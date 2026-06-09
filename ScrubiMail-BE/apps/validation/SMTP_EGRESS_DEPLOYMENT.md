# SMTP Egress Deployment (ZeroBounce-style mailbox verification)

To return confirmed `valid` / `invalid` mailbox verdicts (not just `unknown`),
ScrubiMail must open an outbound SMTP connection to each recipient's MX server
and run a `RCPT TO` probe. This only works from a host that meets **all** of the
requirements below. Get any one wrong and major providers (Google, Microsoft)
will tarpit or refuse the probe, and you'll get `unknown`/`greylisted` instead
of real answers — or worse, get the IP blocklisted.

## 1. Where it can run

- **NOT** on AWS EC2, GCP, Azure, Heroku, Render, Fly, etc. — they block
  outbound port 25 by default and will not unblock it for mailbox probing.
- **YES** on a bare-metal box or a VPS provider that permits port 25 egress
  (e.g. a dedicated server, or a VPS where you've explicitly requested port 25).
- Run it as a **dedicated Celery worker** ("egress worker"). Keep the web/API
  dynos with `VALIDATION_SMTP_ENABLED=False` so realtime stays fast; only the
  egress worker does deep SMTP verification (the Celery task already uses
  `deep=True`).

## 2. Required DNS / network setup

Assume the egress host has static IP `203.0.113.10` and you control
`scrubimail.com`.

| Record | Value | Why |
|--------|-------|-----|
| **A** | `verify.scrubimail.com` → `203.0.113.10` | the HELO hostname must resolve |
| **PTR** (reverse DNS) | `203.0.113.10` → `verify.scrubimail.com` | set via your host/ISP; MX servers reject probes from IPs with no/mismatched PTR |
| **SPF (TXT)** | on the MAIL FROM domain, include the IP | `v=spf1 ip4:203.0.113.10 -all` (or merge into existing SPF) |
| **Port 25** | outbound open | `nc -vz gmail-smtp-in.l.google.com 25` must connect |

The PTR ↔ HELO ↔ A records must all agree (Forward-confirmed reverse DNS).

## 3. Environment variables (egress worker only)

```bash
VALIDATION_SMTP_ENABLED=True
VALIDATION_SMTP_HELO_HOST=verify.scrubimail.com      # must match PTR + have an A record
VALIDATION_SMTP_MAIL_FROM=verify@scrubimail.com      # domain must have SPF
VALIDATION_SMTP_TIMEOUT=5
VALIDATION_SMTP_STARTTLS=True
VALIDATION_SMTP_FAILURE_THRESHOLD=5                  # raise on a reliable host
VALIDATION_SMTP_BLOCK_TTL=600                        # set 0 to disable the breaker
```

Leave `VALIDATION_SMTP_ENABLED=False` everywhere else.

## 4. Verify the host before going live

```bash
# Port 25 egress works?
nc -vz gmail-smtp-in.l.google.com 25

# Forward-confirmed reverse DNS matches?
dig +short verify.scrubimail.com        # -> 203.0.113.10
dig +short -x 203.0.113.10               # -> verify.scrubimail.com.

# Manual probe sanity check (expect 250 on a real address):
python - <<'PY'
import smtplib
s = smtplib.SMTP("gmail-smtp-in.l.google.com", 25, timeout=10)
s.helo("verify.scrubimail.com"); s.mail("verify@scrubimail.com")
print(s.rcpt("someone@gmail.com")); s.quit()
PY
```

## 5. Operational guidance

- **Rate-limit** probes per destination domain; hammering Gmail/Outlook from one
  IP gets you greylisted then blocklisted. Spread bulk jobs over time.
- **Warm the IP**: start with low volume and ramp up.
- **Monitor blocklists** (Spamhaus, etc.) for the egress IP.
- **Catch-all domains** return `catch-all`, not `valid` — the specific mailbox
  genuinely can't be confirmed; that's expected, not a bug.
- The circuit breaker (`VALIDATION_SMTP_FAILURE_THRESHOLD` /
  `VALIDATION_SMTP_BLOCK_TTL`) auto-disables SMTP after repeated total failures
  so a network blip doesn't turn into per-request timeouts. Raise the threshold
  once egress is proven reliable.

## Status / sub_status reference (ZeroBounce-style)

| status | meaning | is_valid |
|--------|---------|----------|
| `valid` | SMTP confirmed the mailbox accepts mail | ✅ true |
| `invalid` | bad syntax / no DNS / mailbox not found | false |
| `catch-all` | domain accepts everything; mailbox unconfirmable | false |
| `unknown` | SMTP inconclusive (timeout, greylist, blocked, or not run) | false |
| `do_not_mail` | disposable / role-based address | false |
| `spamtrap` | matches spam-trap indicators | false |
