"""
Quote engine for pay-as-you-go credit purchases.

Pricing rules live in ``CreditPricingConfig`` (admin-editable). Everything that
turns credits into money — the public quote endpoint, the pricing calculator and
checkout — goes through ``quote_for_credits`` / ``credits_for_amount`` so the
number a user sees is the number they are charged.

Tiers are ``[{"from": <int>, "unit_price": "<decimal>"}, ...]`` sorted by
``from``. Tier *i* covers ``from_i .. from_{i+1} - 1``; the last tier is open.

The frontends mirror this arithmetic (src/utils/creditPricing.ts) for instant
feedback; keep the two in step.
"""

from dataclasses import dataclass
from decimal import Decimal, ROUND_DOWN, ROUND_HALF_UP

CENT = Decimal("0.01")
MAX_UNIT_PRICE_PLACES = 6


class CreditPricingError(ValueError):
    """A request the pricing rules cannot satisfy (shown to the user verbatim)."""


@dataclass(frozen=True)
class Tier:
    start: int
    unit_price: Decimal


def parse_tiers(raw):
    """Validate and normalise stored/submitted tiers. Raises CreditPricingError."""
    if not isinstance(raw, list) or not raw:
        raise CreditPricingError("At least one pricing tier is required.")
    tiers = []
    for i, item in enumerate(raw):
        if not isinstance(item, dict):
            raise CreditPricingError(f"Tier {i + 1} is malformed.")
        try:
            start = int(item.get("from"))
            unit = Decimal(str(item.get("unit_price")))
        except (TypeError, ValueError, ArithmeticError):
            raise CreditPricingError(f"Tier {i + 1} needs a whole 'from' and a numeric 'unit_price'.")
        if not unit.is_finite() or unit <= 0:
            raise CreditPricingError(f"Tier {i + 1}: unit price must be greater than 0.")
        if -unit.as_tuple().exponent > MAX_UNIT_PRICE_PLACES:
            raise CreditPricingError(
                f"Tier {i + 1}: unit price allows at most {MAX_UNIT_PRICE_PLACES} decimal places."
            )
        if start < 1:
            raise CreditPricingError(f"Tier {i + 1}: 'from' must be at least 1.")
        tiers.append(Tier(start, unit))
    for prev, cur in zip(tiers, tiers[1:]):
        if cur.start <= prev.start:
            raise CreditPricingError("Tier 'from' values must be strictly increasing.")
        if cur.unit_price > prev.unit_price:
            raise CreditPricingError("Unit prices must not increase as volume grows.")
    return tiers


def validate_rules(tiers, min_credits, max_credits, step):
    """Cross-field checks shared by the admin serializer and the engine."""
    if step < 1:
        raise CreditPricingError("Credit step must be at least 1.")
    if min_credits < 1:
        raise CreditPricingError("Minimum credits must be at least 1.")
    if max_credits <= min_credits:
        raise CreditPricingError("Maximum credits must be greater than the minimum.")
    if min_credits % step or max_credits % step:
        raise CreditPricingError("Minimum and maximum credits must be multiples of the credit step.")
    if tiers[0].start > min_credits:
        raise CreditPricingError("The first tier must start at or below the minimum purchase.")


def _tier_index(tiers, credits):
    idx = 0
    for i, t in enumerate(tiers):
        if credits >= t.start:
            idx = i
    return idx


def _price(tiers, mode, credits):
    """Exact (unrounded) price of ``credits``."""
    if mode == "graduated":
        total = Decimal(0)
        for i, t in enumerate(tiers):
            if credits < t.start:
                break
            # The first tier also absorbs anything below its start.
            lo = 1 if i == 0 else t.start
            hi = tiers[i + 1].start - 1 if i + 1 < len(tiers) else credits
            total += (min(credits, hi) - lo + 1) * t.unit_price
        return total
    return credits * tiers[_tier_index(tiers, credits)].unit_price


def price_for(tiers, mode, credits):
    return _price(tiers, mode, credits).quantize(CENT, rounding=ROUND_HALF_UP)


class CreditPricer:
    """Bound view of one config's rules."""

    def __init__(self, config):
        self.config = config
        self.mode = config.tiers_mode
        self.currency = config.currency
        self.tiers = parse_tiers(config.tiers)
        self.min_credits = config.min_credits
        self.max_credits = config.max_credits
        self.step = config.credit_step
        validate_rules(self.tiers, self.min_credits, self.max_credits, self.step)

    # -- checks ---------------------------------------------------------------

    def check_credits(self, credits):
        if credits < self.min_credits:
            raise CreditPricingError(f"The minimum purchase is {self.min_credits:,} credits.")
        if credits > self.max_credits:
            raise CreditPricingError(
                f"The maximum purchase is {self.max_credits:,} credits. Contact sales for more."
            )
        if credits % self.step:
            raise CreditPricingError(f"Credits must be a multiple of {self.step:,}.")

    # -- quoting --------------------------------------------------------------

    def quote_for_credits(self, credits):
        self.check_credits(credits)
        total = price_for(self.tiers, self.mode, credits)
        idx = _tier_index(self.tiers, credits)
        base_unit = self.tiers[0].unit_price
        list_total = (credits * base_unit).quantize(CENT, rounding=ROUND_HALF_UP)

        next_tier = None
        if idx + 1 < len(self.tiers) and self.tiers[idx + 1].start <= self.max_credits:
            nt = self.tiers[idx + 1]
            # Tier starts are not necessarily step-aligned: round up to a buyable amount.
            nt_credits = -(-nt.start // self.step) * self.step
            if nt_credits <= self.max_credits:
                next_tier = {
                    "credits": nt_credits,
                    "credits_needed": nt_credits - credits,
                    "unit_price": str(nt.unit_price),
                    "total": str(price_for(self.tiers, self.mode, nt_credits)),
                }

        return {
            "credits": credits,
            "total": str(total),
            "currency": self.currency,
            "effective_unit_price": str(
                (total / credits).quantize(Decimal("0.000001"), rounding=ROUND_HALF_UP)
            ),
            "tier_index": idx,
            "tier_unit_price": str(self.tiers[idx].unit_price),
            "tiers_mode": self.mode,
            "savings": str(max(list_total - total, Decimal(0))),
            "next_tier": next_tier,
            "expiry_days": self.config.expiry_days,
        }

    def credits_for_amount(self, amount):
        """Most credits ``amount`` buys (never charging more than ``amount``)."""
        amount = Decimal(str(amount))
        if not amount.is_finite() or amount <= 0:
            raise CreditPricingError("Enter an amount greater than 0.")
        best = 0
        if self.mode == "graduated":
            # Price is monotone in credits: binary search over step multiples.
            lo, hi = 0, self.max_credits // self.step
            while lo < hi:
                mid = (lo + hi + 1) // 2
                if price_for(self.tiers, self.mode, mid * self.step) <= amount:
                    lo = mid
                else:
                    hi = mid - 1
            best = lo * self.step
        else:
            # Volume pricing is not monotone (crossing a tier can make the total
            # drop), so take the best candidate inside each tier.
            for i, t in enumerate(self.tiers):
                tier_lo = t.start
                tier_hi = self.tiers[i + 1].start - 1 if i + 1 < len(self.tiers) else self.max_credits
                c = int((amount / t.unit_price).to_integral_value(rounding=ROUND_DOWN))
                c = min(c, tier_hi, self.max_credits)
                c -= c % self.step
                while c > 0 and price_for(self.tiers, self.mode, c) > amount:
                    c -= self.step
                if c >= max(tier_lo, 1) or (i == 0 and c > 0):
                    best = max(best, c)
        if best < self.min_credits:
            minimum = price_for(self.tiers, self.mode, self.min_credits)
            raise CreditPricingError(
                f"The minimum purchase is {self.min_credits:,} credits "
                f"({minimum} {self.currency})."
            )
        return best

    def quote(self, credits=None, amount=None):
        if credits is None and amount is None:
            raise CreditPricingError("Provide either credits or amount.")
        if credits is None:
            credits = self.credits_for_amount(amount)
        quote = self.quote_for_credits(int(credits))
        if amount is not None:
            quote["requested_amount"] = str(Decimal(str(amount)).quantize(CENT))
        return quote

    def public_rules(self):
        return {
            "is_enabled": self.config.is_enabled,
            "currency": self.currency,
            "tiers_mode": self.mode,
            "tiers": [{"from": t.start, "unit_price": str(t.unit_price)} for t in self.tiers],
            "min_credits": self.min_credits,
            "max_credits": self.max_credits,
            "credit_step": self.step,
            "expiry_days": self.config.expiry_days,
            "min_total": str(price_for(self.tiers, self.mode, self.min_credits)),
            "updated_at": self.config.updated_at.isoformat() if self.config.updated_at else None,
        }


def get_pricer():
    from .models import CreditPricingConfig

    return CreditPricer(CreditPricingConfig.get_solo())
