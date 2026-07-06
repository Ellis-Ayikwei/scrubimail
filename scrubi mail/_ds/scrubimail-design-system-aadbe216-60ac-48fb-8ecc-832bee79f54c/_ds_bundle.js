/* @ds-bundle: {"format":3,"namespace":"ScrubiMailDesignSystem_aadbe2","components":[{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"ProgressBar","sourcePath":"components/dashboard/ProgressBar.jsx"},{"name":"StatCard","sourcePath":"components/dashboard/StatCard.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"SegmentedTabs","sourcePath":"components/navigation/SegmentedTabs.jsx"}],"sourceHashes":{"components/core/Badge.jsx":"471f3245626d","components/core/Button.jsx":"8fce2422d710","components/core/Card.jsx":"4451827ca964","components/dashboard/ProgressBar.jsx":"7e48760a6c5d","components/dashboard/StatCard.jsx":"ecd09b13001d","components/forms/Input.jsx":"0c4d311448cd","components/navigation/SegmentedTabs.jsx":"a757e62a8785","ui_kits/app/dashboard.jsx":"74b530f36191","ui_kits/app/shell.jsx":"7b578f3d502b","ui_kits/app/validate.jsx":"3e45a6f0ef03","ui_kits/icons.jsx":"3986e2b13028","ui_kits/marketing/infra-features.jsx":"7b89411a876a","ui_kits/marketing/infra-hero.jsx":"0eb1cdd5043f","ui_kits/marketing/infra-pricing.jsx":"8c4e7235346f","ui_kits/marketing/infra-shared.jsx":"6b2076422905"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.ScrubiMailDesignSystem_aadbe2 = window.ScrubiMailDesignSystem_aadbe2 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * ScrubiMail Badge — small status / metadata pill. Soft-tinted by default,
 * solid on request. Mirrors the "Valid / Detailed / 1,250 credits" chips.
 */
function Badge({
  children,
  tone = "neutral",
  solid = false,
  dot = false,
  style = {},
  ...rest
}) {
  const tones = {
    neutral: {
      soft: "var(--surface-inset)",
      text: "var(--text-secondary)",
      solid: "var(--gray-500)"
    },
    brand: {
      soft: "var(--color-primary-tint)",
      text: "var(--color-primary)",
      solid: "var(--color-primary)"
    },
    success: {
      soft: "var(--color-success-soft)",
      text: "var(--color-success)",
      solid: "var(--color-success)"
    },
    warning: {
      soft: "var(--color-warning-soft)",
      text: "var(--amber-600)",
      solid: "var(--color-warning)"
    },
    danger: {
      soft: "var(--color-danger-soft)",
      text: "var(--red-600)",
      solid: "var(--color-danger)"
    },
    info: {
      soft: "var(--color-info-soft)",
      text: "var(--blue-700)",
      solid: "var(--color-info)"
    }
  };
  const t = tones[tone] || tones.neutral;
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      height: 24,
      padding: "0 10px",
      fontFamily: "var(--font-sans)",
      fontWeight: "var(--fw-semibold)",
      fontSize: 12,
      lineHeight: 1,
      borderRadius: "var(--radius-pill)",
      color: solid ? "#fff" : t.text,
      background: solid ? t.solid : t.soft,
      ...style
    }
  }, rest), dot && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 7,
      height: 7,
      borderRadius: "50%",
      background: solid ? "#fff" : t.solid
    }
  }), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * ScrubiMail Button — the rounded, confident CTA the product uses everywhere.
 * Primary is brand teal; pills are the default marketing shape.
 */
function Button({
  children,
  variant = "primary",
  size = "md",
  pill = false,
  block = false,
  loading = false,
  disabled = false,
  iconLeft = null,
  iconRight = null,
  style = {},
  ...rest
}) {
  const sizes = {
    sm: {
      height: 36,
      padding: "0 14px",
      fontSize: 13,
      gap: 6,
      icon: 15
    },
    md: {
      height: 44,
      padding: "0 20px",
      fontSize: 14,
      gap: 8,
      icon: 17
    },
    lg: {
      height: 52,
      padding: "0 28px",
      fontSize: 16,
      gap: 10,
      icon: 19
    }
  };
  const s = sizes[size] || sizes.md;
  const palettes = {
    primary: {
      background: "var(--color-primary)",
      color: "var(--color-on-primary)",
      border: "1px solid transparent",
      shadow: "var(--shadow-sm)"
    },
    secondary: {
      background: "var(--surface-card)",
      color: "var(--text-strong)",
      border: "1px solid var(--border-default)",
      shadow: "var(--shadow-xs)"
    },
    outline: {
      background: "transparent",
      color: "var(--color-primary)",
      border: "2px solid var(--color-primary)",
      shadow: "none"
    },
    ghost: {
      background: "transparent",
      color: "var(--text-body)",
      border: "1px solid transparent",
      shadow: "none"
    },
    danger: {
      background: "var(--color-danger)",
      color: "#fff",
      border: "1px solid transparent",
      shadow: "var(--shadow-sm)"
    }
  };
  const p = palettes[variant] || palettes.primary;
  const isDisabled = disabled || loading;
  return /*#__PURE__*/React.createElement("button", _extends({
    disabled: isDisabled,
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: s.gap,
      height: s.height,
      padding: s.padding,
      width: block ? "100%" : "auto",
      fontFamily: "var(--font-sans)",
      fontWeight: "var(--fw-semibold)",
      fontSize: s.fontSize,
      lineHeight: 1,
      letterSpacing: "var(--ls-snug)",
      color: p.color,
      background: p.background,
      border: p.border,
      borderRadius: pill ? "var(--radius-pill)" : "var(--radius-sm)",
      boxShadow: p.shadow,
      cursor: isDisabled ? "not-allowed" : "pointer",
      opacity: isDisabled ? 0.55 : 1,
      transition: "background var(--dur-base) var(--ease-standard), transform var(--dur-fast) var(--ease-standard), box-shadow var(--dur-base) var(--ease-standard)",
      whiteSpace: "nowrap",
      ...style
    },
    onMouseDown: e => {
      if (!isDisabled) e.currentTarget.style.transform = "scale(0.97)";
    },
    onMouseUp: e => {
      e.currentTarget.style.transform = "scale(1)";
    },
    onMouseLeave: e => {
      e.currentTarget.style.transform = "scale(1)";
    }
  }, rest), loading ? /*#__PURE__*/React.createElement("span", {
    "aria-hidden": true,
    style: {
      width: s.icon,
      height: s.icon,
      borderRadius: "50%",
      border: "2px solid currentColor",
      borderTopColor: "transparent",
      display: "inline-block",
      animation: "sm-spin 0.7s linear infinite"
    }
  }) : iconLeft ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      width: s.icon,
      height: s.icon
    }
  }, iconLeft) : null, children, iconRight ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      width: s.icon,
      height: s.icon
    }
  }, iconRight) : null, /*#__PURE__*/React.createElement("style", null, "@keyframes sm-spin{to{transform:rotate(360deg)}}"));
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * ScrubiMail Card — the universal surface: white (or dark) panel, hairline
 * border, soft shadow, generous rounding. Optional hoverable lift.
 */
function Card({
  children,
  padding = 24,
  radius = "var(--radius-lg)",
  hoverable = false,
  elevation = "sm",
  style = {},
  ...rest
}) {
  const shadows = {
    none: "none",
    sm: "var(--shadow-sm)",
    md: "var(--shadow-md)",
    lg: "var(--shadow-lg)"
  };
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      background: "var(--surface-card)",
      border: "1px solid var(--border-subtle)",
      borderRadius: radius,
      boxShadow: shadows[elevation] ?? shadows.sm,
      padding,
      transition: "box-shadow var(--dur-base) var(--ease-standard), border-color var(--dur-base) var(--ease-standard), transform var(--dur-base) var(--ease-standard)",
      ...style
    },
    onMouseEnter: e => {
      if (!hoverable) return;
      e.currentTarget.style.boxShadow = shadows.md;
      e.currentTarget.style.borderColor = "var(--color-primary)";
    },
    onMouseLeave: e => {
      if (!hoverable) return;
      e.currentTarget.style.boxShadow = shadows[elevation] ?? shadows.sm;
      e.currentTarget.style.borderColor = "var(--border-subtle)";
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/dashboard/ProgressBar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * ScrubiMail ProgressBar — usage / credits meter. Rounded track + teal fill,
 * with optional value labels underneath.
 */
function ProgressBar({
  value = 0,
  max = 100,
  color = "var(--color-primary)",
  height = 8,
  showLabels = false,
  leftLabel,
  rightLabel,
  style = {},
  ...rest
}) {
  const pct = Math.max(0, Math.min(100, value / max * 100));
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      width: "100%",
      height,
      background: "var(--surface-inset)",
      borderRadius: "var(--radius-pill)",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: pct + "%",
      height: "100%",
      background: color,
      borderRadius: "var(--radius-pill)",
      transition: "width var(--dur-slow) var(--ease-standard)"
    }
  })), showLabels && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      marginTop: 6,
      fontFamily: "var(--font-mono)",
      fontSize: 11,
      color: "var(--text-muted)"
    }
  }, /*#__PURE__*/React.createElement("span", null, leftLabel ?? value.toLocaleString()), /*#__PURE__*/React.createElement("span", null, rightLabel ?? max.toLocaleString())));
}
Object.assign(__ds_scope, { ProgressBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/dashboard/ProgressBar.jsx", error: String((e && e.message) || e) }); }

// components/dashboard/StatCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * ScrubiMail StatCard — the dashboard metric tile: label, big value, a
 * trend delta, and a tinted icon chip. Mirrors the product's stats grid.
 */
function StatCard({
  label,
  value,
  change,
  trend = "neutral",
  // "up" | "down" | "neutral"
  icon = null,
  accent = "brand",
  // brand | success | danger | info | violet | amber
  style = {},
  ...rest
}) {
  const accents = {
    brand: {
      fg: "var(--color-primary)",
      bg: "var(--color-primary-tint)"
    },
    success: {
      fg: "var(--color-success)",
      bg: "var(--color-success-soft)"
    },
    danger: {
      fg: "var(--color-danger)",
      bg: "var(--color-danger-soft)"
    },
    info: {
      fg: "var(--color-info)",
      bg: "var(--color-info-soft)"
    },
    violet: {
      fg: "var(--violet-500)",
      bg: "rgba(139,92,246,0.12)"
    },
    amber: {
      fg: "var(--amber-600)",
      bg: "var(--color-warning-soft)"
    }
  };
  const a = accents[accent] || accents.brand;
  const trendColor = trend === "up" ? "var(--color-success)" : trend === "down" ? "var(--color-danger)" : "var(--text-muted)";
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      background: "var(--surface-card)",
      border: "1px solid var(--border-subtle)",
      borderRadius: "var(--radius-md)",
      boxShadow: "var(--shadow-sm)",
      padding: 20,
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 16,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: 13,
      fontWeight: "var(--fw-medium)",
      color: "var(--text-secondary)",
      marginBottom: 6
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontSize: 26,
      fontWeight: "var(--fw-bold)",
      color: "var(--text-strong)",
      lineHeight: 1,
      letterSpacing: "var(--ls-snug)"
    }
  }, value), change != null && change !== "" && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      marginTop: 8,
      fontFamily: "var(--font-sans)",
      fontSize: 13,
      fontWeight: "var(--fw-semibold)",
      color: trendColor
    }
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": true
  }, trend === "up" ? "↑" : trend === "down" ? "↓" : ""), change)), icon && /*#__PURE__*/React.createElement("div", {
    style: {
      width: 44,
      height: 44,
      flexShrink: 0,
      borderRadius: "var(--radius-sm)",
      background: a.bg,
      color: a.fg,
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, icon));
}
Object.assign(__ds_scope, { StatCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/dashboard/StatCard.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * ScrubiMail Input — text field with optional leading icon, label, hint,
 * and error state. Rounded, hairline border, teal focus ring.
 */
function Input({
  label,
  hint,
  error,
  iconLeft = null,
  size = "md",
  id,
  style = {},
  ...rest
}) {
  const [focused, setFocused] = React.useState(false);
  const heights = {
    sm: 36,
    md: 44,
    lg: 52
  };
  const h = heights[size] || heights.md;
  const inputId = id || (label ? "in-" + label.replace(/\s+/g, "-").toLowerCase() : undefined);
  const borderColor = error ? "var(--color-danger)" : focused ? "var(--color-primary)" : "var(--border-default)";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 6,
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    htmlFor: inputId,
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: 13,
      fontWeight: "var(--fw-semibold)",
      color: "var(--text-body)"
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      height: h,
      padding: "0 14px",
      background: "var(--surface-card)",
      border: "1px solid " + borderColor,
      borderRadius: "var(--radius-sm)",
      boxShadow: focused ? "var(--shadow-glow)" : "none",
      transition: "border-color var(--dur-base) var(--ease-standard), box-shadow var(--dur-base) var(--ease-standard)"
    }
  }, iconLeft && /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      color: focused ? "var(--color-primary)" : "var(--text-muted)",
      flexShrink: 0
    }
  }, iconLeft), /*#__PURE__*/React.createElement("input", _extends({
    id: inputId,
    onFocus: e => {
      setFocused(true);
      rest.onFocus && rest.onFocus(e);
    },
    onBlur: e => {
      setFocused(false);
      rest.onBlur && rest.onBlur(e);
    }
  }, rest, {
    style: {
      flex: 1,
      minWidth: 0,
      border: "none",
      outline: "none",
      background: "transparent",
      fontFamily: "var(--font-sans)",
      fontSize: 15,
      color: "var(--text-strong)"
    }
  }))), error ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: 12,
      color: "var(--color-danger)"
    }
  }, error) : hint ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: 12,
      color: "var(--text-muted)"
    }
  }, hint) : null);
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/navigation/SegmentedTabs.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * ScrubiMail SegmentedTabs — the pill toggle used for "Single Email /
 * Bulk Upload" and similar 2–4 option switches. Active segment fills teal.
 */
function SegmentedTabs({
  tabs = [],
  // [{ id, label, icon? }]
  value,
  onChange,
  size = "md",
  style = {},
  ...rest
}) {
  const [internal, setInternal] = React.useState(tabs[0] && tabs[0].id);
  const active = value !== undefined ? value : internal;
  const heights = {
    sm: 36,
    md: 48
  };
  const h = heights[size] || heights.md;
  const select = id => {
    if (value === undefined) setInternal(id);
    onChange && onChange(id);
  };
  return /*#__PURE__*/React.createElement("div", _extends({
    role: "tablist",
    style: {
      display: "flex",
      gap: 4,
      padding: 5,
      background: "var(--surface-card)",
      border: "1px solid var(--border-subtle)",
      borderRadius: "var(--radius-pill)",
      boxShadow: "var(--shadow-xs)",
      ...style
    }
  }, rest), tabs.map(t => {
    const on = t.id === active;
    return /*#__PURE__*/React.createElement("button", {
      key: t.id,
      role: "tab",
      "aria-selected": on,
      onClick: () => select(t.id),
      style: {
        flex: 1,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        height: h,
        padding: "0 18px",
        border: "none",
        borderRadius: "var(--radius-pill)",
        cursor: "pointer",
        fontFamily: "var(--font-sans)",
        fontSize: 14,
        fontWeight: "var(--fw-semibold)",
        letterSpacing: "var(--ls-snug)",
        color: on ? "var(--color-on-primary)" : "var(--text-secondary)",
        background: on ? "var(--color-primary)" : "transparent",
        boxShadow: on ? "var(--shadow-sm)" : "none",
        transition: "background var(--dur-base) var(--ease-standard), color var(--dur-base) var(--ease-standard)",
        whiteSpace: "nowrap"
      }
    }, t.icon && /*#__PURE__*/React.createElement("span", {
      style: {
        display: "inline-flex"
      }
    }, t.icon), t.label);
  }));
}
Object.assign(__ds_scope, { SegmentedTabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/SegmentedTabs.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/dashboard.jsx
try { (() => {
/* ScrubiMail v2 Dashboard — faithful to Dashboard.tsx. Extends window.SMApp. */
const DI = window.SMIcons;
function Dashboard({
  onNav
}) {
  const {
    Panel,
    labelCss
  } = window.SMApp;
  const mono = {
    fontFamily: "var(--font-mono)"
  };
  const stats = [{
    label: "Total Validations",
    value: "48,920",
    change: "+12%",
    up: true
  }, {
    label: "Valid Emails",
    value: "46,118",
    change: "+8%",
    up: true
  }, {
    label: "Invalid Emails",
    value: "2,802",
    change: "-3%",
    up: false
  }, {
    label: "Success Rate",
    value: "94.3%",
    change: "",
    up: true
  }];
  const ops = [{
    title: "Single Email Validation",
    desc: "Real-time check for individual records.",
    icon: DI.CheckCircle,
    go: "validate"
  }, {
    title: "Bulk Validation",
    desc: "Upload .csv or .json for massive processing.",
    icon: DI.FileText,
    go: "validate"
  }, {
    title: "API Integration",
    desc: "Connect directly into your infrastructure.",
    icon: DI.Key,
    go: "api-keys"
  }, {
    title: "View History",
    desc: "Review and download past scrubbing reports.",
    icon: DI.History,
    go: "history"
  }];
  const recent = [{
    id: "#0481",
    email: "ellis@scrubimail.com",
    status: "valid",
    ts: "14:21:08",
    lat: 142
  }, {
    id: "#0480",
    email: "no-reply@acme.io",
    status: "valid",
    ts: "14:08:52",
    lat: 96
  }, {
    id: "#0479",
    email: "bounce@mailinator.com",
    status: "invalid",
    ts: "13:52:17",
    lat: 188
  }, {
    id: "#0478",
    email: "sales@startup.dev",
    status: "valid",
    ts: "13:30:44",
    lat: 73
  }, {
    id: "#0477",
    email: "ghost@deadhost.zz",
    status: "invalid",
    ts: "13:11:05",
    lat: 204
  }];
  const sdot = {
    valid: "var(--k-accent)",
    invalid: "var(--k-danger)"
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 20,
      fontFamily: "var(--font-body)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginBottom: 2
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      ...mono,
      fontSize: 10,
      color: "var(--k-accent)"
    }
  }, "v2.4.0-stable"), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: 999,
      background: "var(--k-accent)"
    },
    className: "pulse"
  })), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: "var(--font-headline)",
      fontWeight: 900,
      fontSize: 26,
      color: "var(--k-text)",
      letterSpacing: "-0.02em",
      margin: 0
    }
  }, "Dashboard")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      padding: "7px 12px",
      background: "var(--k-surface)",
      border: "1px solid var(--k-border)",
      borderRadius: "var(--radius-xs)",
      color: "var(--k-body)",
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement(DI.RefreshCw, {
    size: 14
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      ...labelCss,
      fontSize: 10
    }
  }, "Refresh")), /*#__PURE__*/React.createElement("a", {
    href: "#",
    onClick: e => {
      e.preventDefault();
      onNav("validate");
    },
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      padding: "7px 12px",
      background: "var(--k-accent)",
      color: "var(--k-accent-ink)",
      borderRadius: "var(--radius-xs)",
      textDecoration: "none",
      ...labelCss,
      fontSize: 10,
      fontWeight: 700,
      whiteSpace: "nowrap"
    }
  }, /*#__PURE__*/React.createElement(DI.Zap, {
    size: 14
  }), " New Validation"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(4,1fr)",
      gap: 12
    }
  }, stats.map(s => /*#__PURE__*/React.createElement(Panel, {
    key: s.label,
    style: {
      padding: 16
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      ...labelCss,
      fontSize: 10,
      color: "var(--k-body)",
      margin: 0
    }
  }, s.label), /*#__PURE__*/React.createElement("p", {
    style: {
      ...mono,
      fontSize: 24,
      fontWeight: 700,
      color: "var(--k-text)",
      margin: "4px 0 0"
    }
  }, s.value), s.change && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 4,
      marginTop: 4
    }
  }, s.up ? /*#__PURE__*/React.createElement(DI.TrendingUp, {
    size: 12,
    style: {
      color: "var(--k-accent)"
    }
  }) : /*#__PURE__*/React.createElement(DI.TrendingDown, {
    size: 12,
    style: {
      color: "var(--k-danger)"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      ...mono,
      fontSize: 10,
      color: s.up ? "var(--k-accent)" : "var(--k-danger)"
    }
  }, s.change))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "2fr 1fr",
      gap: 20
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: 999,
      background: "var(--k-accent)"
    }
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      ...labelCss,
      fontSize: 10,
      color: "var(--k-body)",
      margin: 0
    }
  }, "System Operations")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 12
    }
  }, ops.map(op => /*#__PURE__*/React.createElement("a", {
    key: op.title,
    href: "#",
    onClick: e => {
      e.preventDefault();
      onNav(op.go);
    },
    style: {
      position: "relative",
      padding: 16,
      background: "var(--k-card)",
      border: "1px solid var(--k-border)",
      borderRadius: "var(--radius-xs)",
      textDecoration: "none",
      display: "block"
    }
  }, /*#__PURE__*/React.createElement(DI.ArrowUpRight, {
    size: 14,
    style: {
      position: "absolute",
      top: 12,
      right: 12,
      color: "var(--k-dim)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 32,
      height: 32,
      background: "var(--k-inset)",
      border: "1px solid var(--k-border)",
      borderRadius: "var(--radius-xs)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement(op.icon, {
    size: 16,
    style: {
      color: "var(--k-accent)"
    }
  })), /*#__PURE__*/React.createElement("p", {
    style: {
      ...labelCss,
      fontSize: 11,
      fontWeight: 600,
      color: "var(--k-text)",
      margin: "0 0 4px"
    }
  }, op.title), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 10.5,
      color: "var(--k-body)",
      lineHeight: 1.5,
      margin: 0
    }
  }, op.desc)))), /*#__PURE__*/React.createElement(Panel, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "10px 16px",
      borderBottom: "1px solid var(--k-border)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(DI.TerminalSq, {
    size: 14,
    style: {
      color: "var(--k-accent)"
    }
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      ...labelCss,
      fontSize: 10,
      color: "var(--k-body)",
      margin: 0
    }
  }, "Live Log Stream")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: 999,
      background: "var(--k-accent)"
    },
    className: "pulse"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      ...mono,
      fontSize: 9,
      color: "var(--k-accent)"
    }
  }, "LIVE_FEED_READY"))), /*#__PURE__*/React.createElement("div", null, recent.map((r, i) => /*#__PURE__*/React.createElement("div", {
    key: r.id,
    style: {
      display: "grid",
      gridTemplateColumns: "56px 1fr 84px 70px 44px",
      gap: 12,
      alignItems: "center",
      padding: "10px 16px",
      borderTop: i ? "1px solid var(--k-line)" : "none"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      ...mono,
      fontSize: 10,
      color: "var(--k-dim)"
    }
  }, r.id), /*#__PURE__*/React.createElement("span", {
    style: {
      ...mono,
      fontSize: 11,
      color: "var(--k-body)",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, r.email), /*#__PURE__*/React.createElement("span", {
    style: {
      ...mono,
      fontSize: 10,
      color: "var(--k-dim)"
    }
  }, r.ts), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      color: sdot[r.status]
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: 999,
      background: sdot[r.status]
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      ...labelCss,
      fontSize: 9
    }
  }, r.status)), /*#__PURE__*/React.createElement("span", {
    style: {
      ...mono,
      fontSize: 9,
      color: "var(--k-dim)",
      textAlign: "right"
    }
  }, r.lat, "ms")))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "8px 16px",
      borderTop: "1px solid var(--k-border)"
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "#",
    onClick: e => {
      e.preventDefault();
      onNav("history");
    },
    style: {
      ...mono,
      fontSize: 10,
      color: "var(--k-accent)",
      textDecoration: "none"
    }
  }, "View All Activity \u2192")))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(Panel, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "10px 16px",
      borderBottom: "1px solid var(--k-border)"
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      ...labelCss,
      fontSize: 10,
      color: "var(--k-body)",
      margin: 0
    }
  }, "API Health"), /*#__PURE__*/React.createElement(DI.Activity, {
    size: 14,
    style: {
      color: "var(--k-accent)"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 16,
      display: "flex",
      flexDirection: "column",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-end",
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      ...labelCss,
      fontSize: 10,
      color: "var(--k-body)",
      margin: 0
    }
  }, "Credits Remaining"), /*#__PURE__*/React.createElement("p", {
    style: {
      ...mono,
      fontSize: 15,
      fontWeight: 700,
      color: "var(--k-text)",
      margin: 0
    }
  }, "632", /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--k-dim)",
      fontSize: 12
    }
  }, " / 1,250"))), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 6,
      background: "var(--k-track)",
      borderRadius: 999,
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: "49%",
      height: "100%",
      background: "var(--k-accent)",
      borderRadius: 999
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 8
    }
  }, [["Monthly Fee", "$49"], ["Avg Latency", "14ms"]].map(([k, v]) => /*#__PURE__*/React.createElement("div", {
    key: k,
    style: {
      background: "var(--k-inset)",
      borderRadius: "var(--radius-xs)",
      padding: 10,
      border: "1px solid var(--k-line)"
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      ...labelCss,
      fontSize: 10,
      color: "var(--k-body)",
      margin: 0
    }
  }, k), /*#__PURE__*/React.createElement("p", {
    style: {
      ...mono,
      fontSize: 14,
      fontWeight: 700,
      color: "var(--k-text)",
      margin: "2px 0 0"
    }
  }, v)))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--k-inset)",
      borderRadius: "var(--radius-xs)",
      padding: "8px 12px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      border: "1px solid var(--k-line)"
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      ...labelCss,
      fontSize: 10,
      color: "var(--k-body)",
      margin: 0
    }
  }, "Current Plan"), /*#__PURE__*/React.createElement("span", {
    style: {
      ...labelCss,
      fontSize: 10,
      fontWeight: 700,
      color: "var(--k-accent)"
    }
  }, "Production")), /*#__PURE__*/React.createElement("a", {
    href: "#",
    onClick: e => {
      e.preventDefault();
      onNav("billing");
    },
    style: {
      display: "flex",
      justifyContent: "center",
      padding: "9px",
      background: "var(--k-accent-soft)",
      border: "1px solid var(--k-accent-border)",
      borderRadius: "var(--radius-xs)",
      color: "var(--k-accent)",
      textDecoration: "none",
      ...labelCss,
      fontSize: 10,
      fontWeight: 700
    }
  }, "Refill Credits"))), /*#__PURE__*/React.createElement(Panel, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "10px 16px",
      borderBottom: "1px solid var(--k-border)"
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      ...labelCss,
      fontSize: 10,
      color: "var(--k-body)",
      margin: 0
    }
  }, "Infrastructure Status"), /*#__PURE__*/React.createElement(DI.Globe, {
    size: 14,
    style: {
      color: "var(--k-accent)"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 16,
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, [{
    name: "Node Alpha",
    load: "82%",
    crit: false
  }, {
    name: "Node Beta",
    load: "45%",
    crit: false
  }, {
    name: "Proxy Cluster",
    load: "97%",
    crit: true
  }].map(n => /*#__PURE__*/React.createElement("div", {
    key: n.name,
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "6px 0"
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      ...mono,
      fontSize: 11,
      color: "var(--k-body)",
      margin: 0
    }
  }, n.name), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      ...mono,
      fontSize: 10,
      color: n.crit ? "var(--k-danger)" : "var(--k-body)"
    }
  }, n.load, " Load"), /*#__PURE__*/React.createElement("span", {
    style: {
      ...labelCss,
      fontSize: 9,
      padding: "2px 6px",
      borderRadius: "var(--radius-xs)",
      background: n.crit ? "var(--k-danger-soft)" : "var(--k-accent-soft)",
      color: n.crit ? "var(--k-danger)" : "var(--k-accent)",
      border: "1px solid " + (n.crit ? "var(--k-danger-border)" : "var(--k-accent-border)")
    }
  }, n.crit ? "critical" : "ok")))))))));
}
window.SMApp.Dashboard = Dashboard;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/dashboard.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/shell.jsx
try { (() => {
/* ScrubiMail v2 app shell — terminal Sidebar + TopBar. Theme-aware via --k-*.
   Exposes window.SMApp. */
const AI = window.SMIcons;
const NAV = [{
  id: "dashboard",
  label: "Dashboard",
  icon: AI.BarChart
}, {
  id: "api-usage",
  label: "API Usage",
  icon: AI.Activity
}, {
  id: "validate",
  label: "Validate",
  icon: AI.CheckCircle
}, {
  id: "history",
  label: "History",
  icon: AI.History
}, {
  id: "api-keys",
  label: "API Keys",
  icon: AI.Key
}, {
  id: "integrations",
  label: "Integrations",
  icon: AI.Code
}, {
  id: "billing",
  label: "Billing",
  icon: AI.CreditCard
}, {
  id: "api-docs",
  label: "API Docs",
  icon: AI.FileText
}];
const labelCss = {
  fontFamily: "var(--font-label)",
  textTransform: "uppercase",
  letterSpacing: "0.1em"
};
function Sidebar({
  active,
  onNav
}) {
  return /*#__PURE__*/React.createElement("nav", {
    style: {
      width: 220,
      flexShrink: 0,
      minHeight: "100%",
      display: "flex",
      flexDirection: "column",
      borderRight: "1px solid var(--k-border)",
      background: "var(--k-side)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "16px",
      borderBottom: "1px solid var(--k-border)"
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "#",
    onClick: e => {
      e.preventDefault();
      onNav("dashboard");
    },
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      textDecoration: "none"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 28,
      height: 28,
      borderRadius: "var(--radius-xs)",
      background: "var(--k-accent-2)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement(AI.Zap, {
    size: 16,
    style: {
      color: "var(--k-accent-ink)"
    },
    strokeWidth: 2.5
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-headline)",
      fontWeight: 900,
      letterSpacing: "-0.04em",
      fontSize: 16,
      color: "var(--k-accent)"
    }
  }, "Scrubi")), /*#__PURE__*/React.createElement(AI.ChevronLeft, {
    size: 16,
    style: {
      color: "var(--k-body)"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "8px 16px 4px"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      ...labelCss,
      fontSize: 9,
      letterSpacing: "0.12em",
      color: "var(--k-dim)"
    }
  }, "v2.4.0-stable")), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      padding: "8px",
      display: "flex",
      flexDirection: "column",
      gap: 2
    }
  }, NAV.map(it => {
    const on = it.id === active;
    return /*#__PURE__*/React.createElement("a", {
      key: it.id,
      href: "#",
      onClick: e => {
        e.preventDefault();
        onNav(it.id);
      },
      style: {
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 12px",
        borderRadius: "var(--radius-xs)",
        textDecoration: "none",
        color: on ? "var(--k-accent)" : "var(--k-body)",
        background: on ? "var(--k-side-active)" : "transparent",
        borderRight: on ? "2px solid var(--k-accent)" : "2px solid transparent"
      }
    }, /*#__PURE__*/React.createElement(it.icon, {
      size: 16
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        ...labelCss,
        fontSize: 11,
        whiteSpace: "nowrap"
      }
    }, it.label));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "0 12px 8px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--k-surface)",
      border: "1px solid var(--k-border)",
      borderRadius: "var(--radius-xs)",
      padding: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      ...labelCss,
      fontSize: 9,
      color: "var(--k-body)"
    }
  }, "API Health"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 9,
      color: "var(--k-accent)"
    }
  }, "LIVE")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 10,
      color: "var(--k-body)",
      marginBottom: 4
    }
  }, "632", /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--k-dim)"
    }
  }, " / 1,250")), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 4,
      background: "var(--k-track)",
      borderRadius: 999,
      overflow: "hidden",
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: "49%",
      height: "100%",
      background: "var(--k-accent)",
      borderRadius: 999
    }
  })), /*#__PURE__*/React.createElement("a", {
    href: "#",
    style: {
      display: "flex",
      justifyContent: "center",
      padding: "7px",
      borderRadius: "var(--radius-xs)",
      background: "var(--k-accent-soft)",
      border: "1px solid var(--k-accent-border)",
      color: "var(--k-accent)",
      textDecoration: "none",
      ...labelCss,
      fontSize: 9
    }
  }, "Refill Credits"))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "12px",
      borderTop: "1px solid var(--k-border)"
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "#",
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "8px 12px",
      borderRadius: "var(--radius-xs)",
      color: "var(--k-body)",
      textDecoration: "none"
    }
  }, /*#__PURE__*/React.createElement(AI.LogOut, {
    size: 16
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      ...labelCss,
      fontSize: 11
    }
  }, "Logout"))));
}
function TopBar({
  dark,
  onToggle
}) {
  return /*#__PURE__*/React.createElement("header", {
    style: {
      height: 48,
      flexShrink: 0,
      borderBottom: "1px solid var(--k-border)",
      background: "var(--k-topbar)",
      backdropFilter: "blur(12px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 20px",
      position: "sticky",
      top: 0,
      zIndex: 20
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(AI.Menu, {
    size: 16,
    style: {
      color: "var(--k-body)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      background: "var(--k-surface)",
      border: "1px solid var(--k-border)",
      borderRadius: "var(--radius-xs)",
      padding: "6px 12px",
      width: 224
    }
  }, /*#__PURE__*/React.createElement(AI.Search, {
    size: 14,
    style: {
      color: "var(--k-dim)"
    }
  }), /*#__PURE__*/React.createElement("input", {
    placeholder: "Search validations...",
    style: {
      flex: 1,
      minWidth: 0,
      border: "none",
      outline: "none",
      background: "transparent",
      fontFamily: "var(--font-mono)",
      fontSize: 12,
      color: "var(--k-body)"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 9,
      color: "var(--k-dim)"
    }
  }, "\u2318K"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: "relative",
      display: "inline-flex"
    }
  }, /*#__PURE__*/React.createElement(AI.Bell, {
    size: 16,
    style: {
      color: "var(--k-body)"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      top: 0,
      right: 0,
      width: 6,
      height: 6,
      borderRadius: 999,
      background: "var(--k-accent)"
    }
  })), /*#__PURE__*/React.createElement("button", {
    onClick: onToggle,
    style: {
      border: "none",
      background: "transparent",
      color: "var(--k-body)",
      cursor: "pointer",
      display: "flex"
    }
  }, dark ? /*#__PURE__*/React.createElement(AI.Sun, {
    size: 16
  }) : /*#__PURE__*/React.createElement(AI.Moon, {
    size: 16
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      paddingLeft: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 24,
      height: 24,
      borderRadius: "var(--radius-xs)",
      background: "var(--k-accent-2)",
      color: "var(--k-accent-ink)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "var(--font-headline)",
      fontWeight: 900,
      fontSize: 12
    }
  }, "E"), /*#__PURE__*/React.createElement("span", {
    style: {
      ...labelCss,
      fontSize: 11,
      color: "var(--k-body)"
    }
  }, "ellis@scrubimail.com"), /*#__PURE__*/React.createElement(AI.ChevronDown, {
    size: 14,
    style: {
      color: "var(--k-dim)"
    }
  }))));
}

/* shared card primitive (v2: sharp corners) */
function Panel({
  children,
  style,
  header
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--k-card)",
      border: "1px solid var(--k-border)",
      borderRadius: "var(--radius-xs)",
      ...style
    }
  }, children);
}
window.SMApp = {
  Sidebar,
  TopBar,
  Panel,
  NAV,
  labelCss
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/shell.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/validate.jsx
try { (() => {
/* ScrubiMail v2 Validate view — terminal-styled single + bulk. Extends window.SMApp. */
const VI = window.SMIcons;
const {
  useState: useStateV
} = React;
function Seg({
  value,
  onChange
}) {
  const tabs = [{
    id: "single",
    label: "Single_Probe",
    icon: VI.Mail
  }, {
    id: "bulk",
    label: "Bulk_Ingest",
    icon: VI.Upload
  }];
  const {
    labelCss
  } = window.SMApp;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "inline-flex",
      border: "1px solid var(--k-border)",
      background: "var(--k-surface)",
      borderRadius: "var(--radius-xs)",
      padding: 3
    }
  }, tabs.map(t => {
    const on = t.id === value;
    return /*#__PURE__*/React.createElement("button", {
      key: t.id,
      onClick: () => onChange(t.id),
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "9px 18px",
        border: "none",
        borderRadius: "var(--radius-xs)",
        cursor: "pointer",
        ...labelCss,
        fontSize: 10,
        fontWeight: on ? 700 : 500,
        background: on ? "var(--k-accent)" : "transparent",
        color: on ? "var(--k-accent-ink)" : "var(--k-body)"
      }
    }, /*#__PURE__*/React.createElement(t.icon, {
      size: 14
    }), " ", t.label);
  }));
}
function Results({
  email
}) {
  const {
    Panel,
    labelCss
  } = window.SMApp;
  const mono = {
    fontFamily: "var(--font-mono)"
  };
  const rows = [["syntax_parse", "PASS"], ["dns_mx_active", "TRUE"], ["dns_score", "90"], ["smtp_handshake", "VERIFIED"], ["catch_all", "FALSE"], ["disposable", "FALSE"], ["role_based", "FALSE"]];
  return /*#__PURE__*/React.createElement(Panel, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "12px 16px",
      borderBottom: "1px solid var(--k-border)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(VI.TerminalSq, {
    size: 14,
    style: {
      color: "var(--k-accent)"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      ...labelCss,
      fontSize: 10,
      color: "var(--k-body)"
    }
  }, "Probe_Result")), /*#__PURE__*/React.createElement("span", {
    style: {
      ...labelCss,
      fontSize: 9,
      color: "var(--k-accent)",
      padding: "3px 8px",
      border: "1px solid var(--k-accent-border)",
      borderRadius: "var(--radius-xs)"
    }
  }, "VERIFIED")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...mono,
      fontSize: 12,
      color: "var(--k-body)",
      marginBottom: 14
    }
  }, "$ scrubi probe ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--k-accent)"
    }
  }, email)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(4,1fr)",
      gap: 8,
      marginBottom: 18
    }
  }, [["status", "VERIFIED"], ["score", "100"], ["verdict", "valid"], ["latency", "284ms"]].map(([k, v]) => /*#__PURE__*/React.createElement("div", {
    key: k,
    style: {
      background: "var(--k-inset)",
      border: "1px solid var(--k-line)",
      borderRadius: "var(--radius-xs)",
      padding: "10px 8px",
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...mono,
      fontSize: 15,
      fontWeight: 700,
      color: "var(--k-accent)"
    }
  }, v), /*#__PURE__*/React.createElement("div", {
    style: {
      ...labelCss,
      fontSize: 9,
      color: "var(--k-dim)",
      marginTop: 2
    }
  }, k)))), /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: "1px solid var(--k-line)",
      paddingTop: 12
    }
  }, rows.map(([k, v]) => /*#__PURE__*/React.createElement("div", {
    key: k,
    style: {
      display: "flex",
      justifyContent: "space-between",
      padding: "6px 0",
      ...mono,
      fontSize: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--k-body)"
    }
  }, k), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--k-text)",
      fontWeight: 600
    }
  }, v))))));
}
function Validate() {
  const {
    Panel,
    labelCss
  } = window.SMApp;
  const mono = {
    fontFamily: "var(--font-mono)"
  };
  const [tab, setTab] = useStateV("single");
  const [email, setEmail] = useStateV("ellis@scrubimail.com");
  const [result, setResult] = useStateV("ellis@scrubimail.com");
  const [busy, setBusy] = useStateV(false);
  const run = () => {
    if (!email) return;
    setBusy(true);
    setResult(null);
    setTimeout(() => {
      setResult(email);
      setBusy(false);
    }, 700);
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 20,
      fontFamily: "var(--font-body)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      ...mono,
      fontSize: 10,
      color: "var(--k-accent)",
      marginBottom: 2
    }
  }, "module/validate"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: "var(--font-headline)",
      fontWeight: 900,
      fontSize: 26,
      color: "var(--k-text)",
      letterSpacing: "-0.02em",
      margin: 0
    }
  }, "Email Validation")), /*#__PURE__*/React.createElement("button", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      padding: "8px 14px",
      background: "var(--k-surface)",
      border: "1px solid var(--k-border)",
      borderRadius: "var(--radius-xs)",
      color: "var(--k-body)",
      cursor: "pointer",
      ...labelCss,
      fontSize: 10
    }
  }, /*#__PURE__*/React.createElement(VI.Key, {
    size: 14
  }), " Select_API_Key ", /*#__PURE__*/React.createElement(VI.ChevronDown, {
    size: 13
  }))), /*#__PURE__*/React.createElement(Seg, {
    value: tab,
    onChange: setTab
  }), tab === "single" ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1.2fr",
      gap: 20,
      alignItems: "start"
    }
  }, /*#__PURE__*/React.createElement(Panel, {
    style: {
      padding: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement(VI.Mail, {
    size: 15,
    style: {
      color: "var(--k-accent)"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      ...labelCss,
      fontSize: 11,
      color: "var(--k-text)",
      fontWeight: 600
    }
  }, "Single Probe")), /*#__PURE__*/React.createElement("label", {
    style: {
      ...labelCss,
      fontSize: 9,
      color: "var(--k-body)",
      display: "block",
      marginBottom: 7
    }
  }, "Target Address"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "0 12px",
      height: 44,
      background: "var(--k-inset)",
      border: "1px solid var(--k-border)",
      borderRadius: "var(--radius-xs)",
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement(VI.Mail, {
    size: 15,
    style: {
      color: "var(--k-dim)"
    }
  }), /*#__PURE__*/React.createElement("input", {
    value: email,
    onChange: e => setEmail(e.target.value),
    placeholder: "name@company.com",
    style: {
      flex: 1,
      minWidth: 0,
      border: "none",
      outline: "none",
      background: "transparent",
      ...mono,
      fontSize: 13,
      color: "var(--k-text)"
    }
  })), /*#__PURE__*/React.createElement("label", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 9,
      ...labelCss,
      fontSize: 10,
      color: "var(--k-body)",
      marginBottom: 16,
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 16,
      height: 16,
      borderRadius: "var(--radius-xs)",
      background: "var(--k-accent)",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement(VI.Check, {
    size: 11,
    style: {
      color: "var(--k-accent-ink)"
    }
  })), "Detailed_Breakdown"), /*#__PURE__*/React.createElement("button", {
    onClick: run,
    disabled: busy,
    style: {
      width: "100%",
      padding: "13px",
      border: "none",
      borderRadius: "var(--radius-xs)",
      background: "var(--k-accent)",
      color: "var(--k-accent-ink)",
      cursor: busy ? "default" : "pointer",
      ...labelCss,
      fontSize: 10,
      fontWeight: 700,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      opacity: busy ? 0.7 : 1
    }
  }, busy ? /*#__PURE__*/React.createElement("span", {
    style: {
      width: 14,
      height: 14,
      borderRadius: 999,
      border: "2px solid var(--k-accent-ink)",
      borderTopColor: "transparent",
      animation: "smspin .7s linear infinite"
    }
  }) : /*#__PURE__*/React.createElement(VI.Zap, {
    size: 14
  }), busy ? "Probing…" : "Run_Probe")), result ? /*#__PURE__*/React.createElement(Results, {
    email: result
  }) : /*#__PURE__*/React.createElement(Panel, {
    style: {
      minHeight: 280,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      padding: 24
    }
  }, /*#__PURE__*/React.createElement(VI.TerminalSq, {
    size: 28,
    style: {
      color: "var(--k-dim)"
    }
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      ...mono,
      fontSize: 12,
      color: "var(--k-body)",
      margin: 0
    }
  }, busy ? "// running checks…" : "// awaiting probe target"))) : /*#__PURE__*/React.createElement(Panel, {
    style: {
      minHeight: 300,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 16,
      padding: 32,
      border: "1px dashed var(--k-border)",
      background: "var(--k-inset)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 56,
      height: 56,
      borderRadius: "var(--radius-xs)",
      background: "var(--k-accent-soft)",
      border: "1px solid var(--k-accent-border)",
      color: "var(--k-accent)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement(VI.Upload, {
    size: 26
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...labelCss,
      fontSize: 13,
      fontWeight: 600,
      color: "var(--k-text)",
      marginBottom: 4
    }
  }, "Drop CSV / JSON to ingest"), /*#__PURE__*/React.createElement("div", {
    style: {
      ...mono,
      fontSize: 11,
      color: "var(--k-body)"
    }
  }, "up to 1,000,000 rows \xB7 one address per line")), /*#__PURE__*/React.createElement("button", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "11px 20px",
      border: "none",
      borderRadius: "var(--radius-xs)",
      background: "var(--k-accent)",
      color: "var(--k-accent-ink)",
      cursor: "pointer",
      ...labelCss,
      fontSize: 10,
      fontWeight: 700
    }
  }, /*#__PURE__*/React.createElement(VI.FileText, {
    size: 14
  }), " Choose_File")));
}
window.SMApp.Validate = Validate;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/validate.jsx", error: String((e && e.message) || e) }); }

// ui_kits/icons.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Shared lucide-style icon set for ScrubiMail UI kits.
   Stroke 2, round caps/joins — matches the product's lucide-react usage.
   Loaded as a text/babel script; exposes window.SMIcons + individual globals. */

const _sw = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round"
};
function Svg({
  size = 20,
  children,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("svg", _extends({
    viewBox: "0 0 24 24",
    width: size,
    height: size
  }, _sw, rest), children);
}
const Mail = p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("rect", {
  x: "2",
  y: "4",
  width: "20",
  height: "16",
  rx: "2"
}), /*#__PURE__*/React.createElement("path", {
  d: "m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"
}));
const Shield = p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
  d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"
}));
const CheckCircle = p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
  d: "M21.8 10A10 10 0 1 1 17 3.34"
}), /*#__PURE__*/React.createElement("path", {
  d: "m9 11 3 3L22 4"
}));
const XCircle = p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("circle", {
  cx: "12",
  cy: "12",
  r: "10"
}), /*#__PURE__*/React.createElement("path", {
  d: "m15 9-6 6M9 9l6 6"
}));
const Check = p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
  d: "M20 6 9 17l-5-5"
}));
const Zap = p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
  d: "M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"
}));
const Code = p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
  d: "m16 18 6-6-6-6M8 6l-6 6 6 6"
}));
const BarChart = p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
  d: "M3 3v16a2 2 0 0 0 2 2h16"
}), /*#__PURE__*/React.createElement("path", {
  d: "M18 17V9M13 17V5M8 17v-3"
}));
const Activity = p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
  d: "M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"
}));
const ArrowRight = p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
  d: "M5 12h14M13 6l6 6-6 6"
}));
const Upload = p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
  d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
}), /*#__PURE__*/React.createElement("path", {
  d: "M17 8l-5-5-5 5M12 3v12"
}));
const Key = p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
  d: "m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4"
}), /*#__PURE__*/React.createElement("path", {
  d: "m21 2-9.6 9.6"
}), /*#__PURE__*/React.createElement("circle", {
  cx: "7.5",
  cy: "15.5",
  r: "5.5"
}));
const History = p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
  d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"
}), /*#__PURE__*/React.createElement("path", {
  d: "M3 3v5h5M12 7v5l4 2"
}));
const Globe = p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("circle", {
  cx: "12",
  cy: "12",
  r: "10"
}), /*#__PURE__*/React.createElement("path", {
  d: "M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20"
}));
const Database = p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("ellipse", {
  cx: "12",
  cy: "5",
  rx: "9",
  ry: "3"
}), /*#__PURE__*/React.createElement("path", {
  d: "M3 5v14a9 3 0 0 0 18 0V5"
}), /*#__PURE__*/React.createElement("path", {
  d: "M3 12a9 3 0 0 0 18 0"
}));
const Clock = p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("circle", {
  cx: "12",
  cy: "12",
  r: "10"
}), /*#__PURE__*/React.createElement("path", {
  d: "M12 6v6l4 2"
}));
const TrendingUp = p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
  d: "M16 7h6v6"
}), /*#__PURE__*/React.createElement("path", {
  d: "m22 7-8.5 8.5-5-5L2 17"
}));
const TrendingDown = p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
  d: "M16 17h6v-6"
}), /*#__PURE__*/React.createElement("path", {
  d: "m22 17-8.5-8.5-5 5L2 7"
}));
const Menu = p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
  d: "M4 12h16M4 6h16M4 18h16"
}));
const Moon = p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
  d: "M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9"
}));
const Sun = p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("circle", {
  cx: "12",
  cy: "12",
  r: "4"
}), /*#__PURE__*/React.createElement("path", {
  d: "M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"
}));
const ChevronDown = p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
  d: "m6 9 6 6 6-6"
}));
const Play = p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
  d: "m6 3 14 9-14 9z",
  fill: "currentColor",
  stroke: "none"
}));
const Eye = p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
  d: "M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0"
}), /*#__PURE__*/React.createElement("circle", {
  cx: "12",
  cy: "12",
  r: "3"
}));
const RefreshCw = p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
  d: "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"
}), /*#__PURE__*/React.createElement("path", {
  d: "M21 3v5h-5"
}), /*#__PURE__*/React.createElement("path", {
  d: "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"
}), /*#__PURE__*/React.createElement("path", {
  d: "M3 21v-5h5"
}));
const FileText = p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
  d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"
}), /*#__PURE__*/React.createElement("path", {
  d: "M14 2v5h5M16 13H8M16 17H8M10 9H8"
}));
const Plus = p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
  d: "M5 12h14M12 5v14"
}));
const Search = p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("circle", {
  cx: "11",
  cy: "11",
  r: "8"
}), /*#__PURE__*/React.createElement("path", {
  d: "m21 21-4.3-4.3"
}));
const Bell = p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
  d: "M10.27 21a1.94 1.94 0 0 0 3.46 0"
}), /*#__PURE__*/React.createElement("path", {
  d: "M21 17H3a3 3 0 0 0 2-3V9.5a7 7 0 0 1 14 0V14a3 3 0 0 0 2 3"
}));
const Settings = p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
  d: "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"
}), /*#__PURE__*/React.createElement("circle", {
  cx: "12",
  cy: "12",
  r: "3"
}));
const LogOut = p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
  d: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"
}));
const AlertTri = p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
  d: "M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
}), /*#__PURE__*/React.createElement("path", {
  d: "M12 9v4M12 17h.01"
}));
const Star = p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
  d: "M11.5 2.5a.5.5 0 0 1 .9 0l2.6 5.3 5.8.85a.5.5 0 0 1 .28.85l-4.2 4.1 1 5.8a.5.5 0 0 1-.73.53L12 17.7l-5.2 2.7a.5.5 0 0 1-.73-.52l1-5.8-4.2-4.1a.5.5 0 0 1 .28-.85l5.8-.85z",
  fill: "currentColor",
  stroke: "none"
}));
const Terminal = p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
  d: "m4 17 6-6-6-6M12 19h8"
}));
const ChevronRight = p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
  d: "m9 18 6-6-6-6"
}));
const Lock = p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("rect", {
  x: "3",
  y: "11",
  width: "18",
  height: "11",
  rx: "2"
}), /*#__PURE__*/React.createElement("path", {
  d: "M7 11V7a5 5 0 0 1 10 0v4"
}));
const Github = p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
  d: "M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 1 5 1 5 1c-.3 1.15-.3 2.35 0 3.5A5.4 5.4 0 0 0 4 8c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"
}), /*#__PURE__*/React.createElement("path", {
  d: "M9 18c-4.51 2-5-2-7-2"
}));
const Twitter = p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
  d: "M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"
}));
const Linkedin = p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
  d: "M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"
}), /*#__PURE__*/React.createElement("rect", {
  x: "2",
  y: "9",
  width: "4",
  height: "12"
}), /*#__PURE__*/React.createElement("circle", {
  cx: "4",
  cy: "4",
  r: "2"
}));
const CreditCard = p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("rect", {
  x: "2",
  y: "5",
  width: "20",
  height: "14",
  rx: "2"
}), /*#__PURE__*/React.createElement("path", {
  d: "M2 10h20"
}));
const ChevronLeft = p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
  d: "m15 18-6-6 6-6"
}));
const User = p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
  d: "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"
}), /*#__PURE__*/React.createElement("circle", {
  cx: "12",
  cy: "7",
  r: "4"
}));
const ArrowUpRight = p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
  d: "M7 7h10v10M7 17 17 7"
}));
const TerminalSq = p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
  d: "m7 11 2-2-2-2M11 13h4"
}), /*#__PURE__*/React.createElement("rect", {
  x: "3",
  y: "3",
  width: "18",
  height: "18",
  rx: "2"
}));
window.SMIcons = {
  Mail,
  Shield,
  CheckCircle,
  XCircle,
  Check,
  Zap,
  Code,
  BarChart,
  Activity,
  ArrowRight,
  Upload,
  Key,
  History,
  Globe,
  Database,
  Clock,
  TrendingUp,
  TrendingDown,
  Menu,
  Moon,
  Sun,
  ChevronDown,
  Play,
  Eye,
  RefreshCw,
  FileText,
  Plus,
  Search,
  Bell,
  Settings,
  LogOut,
  AlertTri,
  Star,
  Terminal,
  ChevronRight,
  Lock,
  Github,
  Twitter,
  Linkedin,
  CreditCard,
  ChevronLeft,
  User,
  ArrowUpRight,
  TerminalSq
};
Object.assign(window, window.SMIcons);
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/icons.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing/infra-features.jsx
try { (() => {
/* ScrubiMail v2 — Surgical Infrastructure bento + Scan Process. */
const FI = window.SMIcons;
function Infrastructure() {
  const {
    MAXW,
    Label,
    glass
  } = window.SMInfra;
  return /*#__PURE__*/React.createElement("section", {
    style: {
      ...MAXW,
      padding: "112px 24px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 80,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-end",
      gap: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Label, {
    color: "var(--k-accent)"
  }, "Technical_Capabilities"), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: "var(--font-headline)",
      fontWeight: 900,
      color: "var(--k-text)",
      fontSize: "clamp(2.5rem, 4vw, 4rem)",
      letterSpacing: "-0.04em",
      lineHeight: 0.95,
      margin: 0
    }
  }, "Surgical Infrastructure.")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 9,
      color: "var(--k-dim)",
      textTransform: "uppercase",
      letterSpacing: "0.4em",
      textAlign: "right",
      lineHeight: 1.8
    }
  }, "MODULE: ALPHA_V4", /*#__PURE__*/React.createElement("br", null), "REVISION: 2025.01")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "7fr 5fr",
      gridTemplateRows: "auto auto",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      gridRow: "span 2",
      padding: 40,
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      ...glass
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 44,
      height: 44,
      marginBottom: 32,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      border: "1px solid var(--k-accent-border)",
      color: "var(--k-accent)"
    }
  }, /*#__PURE__*/React.createElement(FI.Terminal, {
    size: 20
  })), /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 16,
      textTransform: "uppercase",
      letterSpacing: "0.08em",
      color: "var(--k-text)",
      margin: "0 0 16px"
    }
  }, "Autonomous_Scrubbing_Protocol"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "var(--font-body)",
      fontSize: 14,
      lineHeight: 1.6,
      color: "var(--k-body)",
      maxWidth: 420,
      margin: 0
    }
  }, "Layer-7 inspection using proprietary SMTP-Handshake patterns to identify honeypots, spamtrap infrastructure, and ephemeral MX clusters without ever leaving a footprint.")), /*#__PURE__*/React.createElement("div", {
    style: {
      paddingTop: 32,
      borderTop: "1px solid var(--k-line)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 12
    }
  }, ["GRAPH_DATA_FLOW", "PACKET_METRICS"].map(t => /*#__PURE__*/React.createElement("div", {
    key: t,
    style: {
      height: 40,
      width: 112,
      background: "var(--k-surface)",
      border: "1px solid var(--k-line)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "var(--font-mono)",
      fontSize: 8,
      color: "var(--k-dim)"
    }
  }, t))), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 10,
      color: "var(--k-accent)"
    }
  }, "v4.1 ACTIVE"))), [{
    icon: FI.Globe,
    mod: "Module_02",
    title: "Anycast_Edge_Network",
    body: "Requests are routed to the nearest secure cluster. Currently spanning 24 global regions for sub-15ms validation cycles."
  }, {
    icon: FI.Code,
    mod: "Module_03",
    title: "Meta_Extraction_v2",
    body: "Deep SMTP telemetry including role detection, provider categorization, and risk scoring in a single JSON packet."
  }].map(m => /*#__PURE__*/React.createElement("div", {
    key: m.mod,
    style: {
      padding: 32,
      ...glass
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement(m.icon, {
    size: 24,
    style: {
      color: "var(--k-accent)"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 8,
      color: "var(--k-dim)",
      textTransform: "uppercase",
      letterSpacing: "0.3em"
    }
  }, m.mod)), /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 14,
      textTransform: "uppercase",
      letterSpacing: "0.08em",
      color: "var(--k-text)",
      margin: "0 0 12px"
    }
  }, m.title), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "var(--font-body)",
      fontSize: 12.5,
      lineHeight: 1.6,
      color: "var(--k-body)",
      margin: 0
    }
  }, m.body)))));
}
function ScanProcess() {
  const {
    MAXW,
    Label
  } = window.SMInfra;
  const steps = [{
    n: "01",
    label: "INGEST",
    icon: FI.ArrowRight,
    desc: "Multi-source entry via API, SMTP proxy, or high-volume batch upload.",
    meta: "LATENCY: 12MS"
  }, {
    n: "02",
    label: "AI ANALYSIS",
    icon: FI.Activity,
    desc: "Neural network pattern matching for syntax and reputation entropy.",
    meta: "CONFIDENCE: 99.8%",
    hi: true
  }, {
    n: "03",
    label: "SMTP CHECK",
    icon: FI.Shield,
    desc: "Real-time handshake with destination servers without sending mail.",
    meta: "TIMEOUT: 1.2S"
  }, {
    n: "04",
    label: "FINAL SCORE",
    icon: FI.CheckCircle,
    desc: "Aggregation of 40+ signals into a binary valid/invalid payload.",
    meta: "OUTPUT: JSON/CSV"
  }];
  return /*#__PURE__*/React.createElement("section", {
    style: {
      background: "var(--k-band)",
      borderTop: "1px solid var(--k-border)",
      borderBottom: "1px solid var(--k-border)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...MAXW,
      padding: "96px 24px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 56,
      display: "flex",
      flexDirection: "column",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Label, {
    color: "var(--k-body)",
    tracking: "0.3em"
  }, "Core Mechanism"), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: "var(--font-headline)",
      fontWeight: 900,
      color: "var(--k-text)",
      fontSize: "clamp(2rem, 4vw, 3rem)",
      letterSpacing: "-0.03em",
      margin: 0
    }
  }, "The Surgical Scan Process")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(4,1fr)",
      gap: 12
    }
  }, steps.map(s => /*#__PURE__*/React.createElement("div", {
    key: s.n,
    style: {
      padding: 28,
      display: "flex",
      flexDirection: "column",
      gap: 20,
      borderRadius: "var(--radius-xs)",
      border: s.hi ? "1px solid var(--k-accent-border-strong)" : "1px solid var(--k-border)",
      background: s.hi ? "var(--k-card-hi)" : "var(--k-panel)",
      boxShadow: s.hi ? "var(--k-accent-shadow)" : "none"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 14,
      fontWeight: 700,
      color: "var(--k-accent)"
    }
  }, s.n), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      color: s.hi ? "var(--k-accent)" : "var(--k-text)"
    }
  }, /*#__PURE__*/React.createElement(s.icon, {
    size: 16
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-headline)",
      fontWeight: 700,
      fontSize: 14,
      letterSpacing: "-0.01em"
    }
  }, s.label)), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "var(--font-body)",
      fontSize: 12,
      lineHeight: 1.6,
      color: "var(--k-body)",
      margin: 0,
      flex: 1
    }
  }, s.desc), /*#__PURE__*/React.createElement("div", {
    style: {
      paddingTop: 12,
      borderTop: "1px solid var(--k-line)",
      fontFamily: "var(--font-mono)",
      fontSize: 10,
      color: "var(--k-dim)"
    }
  }, s.meta.split(": ")[0], ": ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--k-text)"
    }
  }, s.meta.split(": ")[1])))))));
}
window.SMInfra.Infrastructure = Infrastructure;
window.SMInfra.ScanProcess = ScanProcess;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing/infra-features.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing/infra-hero.jsx
try { (() => {
/* ScrubiMail v2 — Hero (headline + terminal probe) and Stats band. */
const HI = window.SMIcons;
function Hero() {
  const {
    MAXW,
    Label,
    glass
  } = window.SMInfra;
  return /*#__PURE__*/React.createElement("section", {
    style: {
      ...MAXW,
      paddingTop: 80,
      paddingBottom: 128,
      display: "grid",
      gridTemplateColumns: "7fr 5fr",
      gap: 48,
      alignItems: "start"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 36,
      paddingTop: 32
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 16,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "5px 14px",
      border: "1px solid var(--k-accent-border)",
      background: "var(--k-accent-soft)",
      borderRadius: "var(--radius-xs)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: 999,
      background: "var(--k-accent)"
    },
    className: "pulse"
  }), /*#__PURE__*/React.createElement(Label, {
    color: "var(--k-accent)"
  }, "System: Optimal")), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 8,
      color: "var(--k-dim)",
      textTransform: "uppercase",
      letterSpacing: "0.2em"
    }
  }, "Build_hash: 8f2a9e1")), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: "var(--font-headline)",
      fontWeight: 900,
      color: "var(--k-text)",
      fontSize: "clamp(3.5rem, 6vw, 6rem)",
      letterSpacing: "-0.04em",
      lineHeight: 0.92,
      margin: 0
    }
  }, "High-Fidelity", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--k-accent)",
      textShadow: "0 0 30px var(--k-accent-glow)"
    }
  }, "Validation.")), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "var(--font-body)",
      fontWeight: 300,
      color: "var(--k-body)",
      fontSize: 18,
      lineHeight: 1.6,
      maxWidth: 520,
      margin: 0
    }
  }, "The definitive email scrubbing engine for critical infrastructure. Zero-latency verification clusters for high-throughput engineering teams."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 16,
      flexWrap: "wrap",
      paddingTop: 4
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "#",
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "16px 32px",
      background: "var(--k-accent)",
      color: "var(--k-accent-ink)",
      fontFamily: "var(--font-mono)",
      fontSize: 10,
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: "0.3em",
      borderRadius: "var(--radius-xs)",
      textDecoration: "none",
      boxShadow: "var(--k-accent-shadow)"
    }
  }, /*#__PURE__*/React.createElement(HI.Zap, {
    size: 14
  }), " Deploy_Cluster"), /*#__PURE__*/React.createElement("a", {
    href: "#",
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "16px 32px",
      border: "1px solid var(--k-border)",
      color: "var(--k-text)",
      fontFamily: "var(--font-mono)",
      fontSize: 10,
      fontWeight: 500,
      textTransform: "uppercase",
      letterSpacing: "0.3em",
      borderRadius: "var(--radius-xs)",
      textDecoration: "none"
    }
  }, /*#__PURE__*/React.createElement(HI.Code, {
    size: 14
  }), " View_Specification"))), /*#__PURE__*/React.createElement("div", {
    style: {
      paddingTop: 32
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      ...glass,
      boxShadow: "var(--shadow-xl)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      top: -12,
      right: -12,
      zIndex: 20,
      border: "1px solid var(--k-panel-border)",
      padding: "8px 14px",
      borderRadius: "var(--radius-xs)",
      background: "var(--k-badge-bg)",
      backdropFilter: "blur(16px)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 9,
      color: "var(--k-accent)",
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 4,
      height: 4,
      borderRadius: 999,
      background: "var(--k-accent)"
    }
  }), " LATENCY: 0.04ms")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "12px 20px",
      borderBottom: "1px solid var(--k-line)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      background: "var(--k-titlebar)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: 999,
      background: "var(--k-dot-r)"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: 999,
      background: "var(--k-dot-y)"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: 999,
      background: "var(--k-dot-g)"
    }
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 8,
      color: "var(--k-dim)",
      textTransform: "uppercase",
      letterSpacing: "0.4em"
    }
  }, "Core_Validation_Probe")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 28,
      fontFamily: "var(--font-mono)",
      fontSize: 13.5,
      lineHeight: 1.7,
      minHeight: 320,
      background: "var(--k-term)",
      display: "flex",
      flexDirection: "column",
      gap: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "rgba(255,255,255,0.25)"
    }
  }, "L01"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--k-term-accent)"
    }
  }, "$ scrubi probe test@infra.net")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "rgba(255,255,255,0.25)"
    }
  }, "L02"), /*#__PURE__*/React.createElement("div", {
    style: {
      color: "#cbd5e1"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: "rgba(255,255,255,0.5)"
    }
  }, "{"), /*#__PURE__*/React.createElement("div", {
    style: {
      paddingLeft: 20
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--k-term-accent)"
    }
  }, "\"status\""), ": ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#fff",
      fontWeight: 700
    }
  }, "\"VERIFIED\""), ","), /*#__PURE__*/React.createElement("div", {
    style: {
      paddingLeft: 20
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--k-term-accent)"
    }
  }, "\"precision\""), ": ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#fff"
    }
  }, "0.999992"), ","), /*#__PURE__*/React.createElement("div", {
    style: {
      paddingLeft: 20
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--k-term-accent)"
    }
  }, "\"provider\""), ": ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#fff"
    }
  }, "\"AWS_SES_NODE\""), ","), /*#__PURE__*/React.createElement("div", {
    style: {
      paddingLeft: 20
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--k-term-accent)"
    }
  }, "\"mx_active\""), ": ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#fff"
    }
  }, "true"), ","), /*#__PURE__*/React.createElement("div", {
    style: {
      paddingLeft: 20
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--k-term-accent)"
    }
  }, "\"scrub_id\""), ": ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: "rgba(255,255,255,0.6)"
    }
  }, "\"x82_921_aa\"")), /*#__PURE__*/React.createElement("div", {
    style: {
      color: "rgba(255,255,255,0.5)"
    }
  }, "}"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 16,
      paddingTop: 16,
      borderTop: "1px solid rgba(255,255,255,0.1)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "rgba(255,255,255,0.25)"
    }
  }, "L09"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "rgba(255,255,255,0.4)",
      fontStyle: "italic"
    }
  }, "// Awaiting next packet..."))))));
}
function Stats() {
  const {
    MAXW
  } = window.SMInfra;
  const items = [{
    value: "12.8M",
    label: "Packet_Operations/hr"
  }, {
    value: "99.998%",
    label: "Accuracy_Coefficient"
  }, {
    value: "< 12ms",
    label: "Edge_Response_TTFB"
  }, {
    value: "Global",
    label: "Node_Distribution",
    pulse: true
  }];
  return /*#__PURE__*/React.createElement("section", {
    style: {
      background: "var(--k-band)",
      borderTop: "1px solid var(--k-border)",
      borderBottom: "1px solid var(--k-border)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...MAXW,
      padding: 0,
      display: "grid",
      gridTemplateColumns: "repeat(4,1fr)",
      borderLeft: "1px solid var(--k-line)",
      borderRight: "1px solid var(--k-line)"
    }
  }, items.map((s, i) => /*#__PURE__*/React.createElement("div", {
    key: s.label,
    style: {
      padding: "56px 40px",
      borderRight: i < 3 ? "1px solid var(--k-line)" : "none"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      marginBottom: 6
    }
  }, s.pulse && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 8,
      height: 8,
      background: "var(--k-accent)"
    },
    className: "pulse"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 30,
      fontWeight: 700,
      color: "var(--k-text)",
      letterSpacing: "-0.03em"
    }
  }, s.value)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 9,
      textTransform: "uppercase",
      letterSpacing: "0.3em",
      color: "var(--k-dim)"
    }
  }, s.label)))));
}
window.SMInfra.Hero = Hero;
window.SMInfra.Stats = Stats;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing/infra-hero.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing/infra-pricing.jsx
try { (() => {
/* ScrubiMail v2 — Capacity Matrix pricing + CTA + Footer. */
const PI = window.SMIcons;
const {
  useState: useStateP
} = React;
function Pricing() {
  const {
    MAXW,
    glass
  } = window.SMInfra;
  const [annual, setAnnual] = useStateP(false);
  const tiers = [{
    name: "Node_Dev",
    price: "$0",
    feats: ["1,000_PROBES/MO", "PUBLIC_RESOURCES", "BASIC_SPEC"],
    cta: "Provision"
  }, {
    name: "Node_Production",
    price: annual ? "$39" : "$49",
    rec: true,
    feats: ["50,000_PROBES/MO", "99.9%_NODE_SLO", "ANYCAST_ROUTING", "PRIORITY_IO"],
    cta: "Select_Node"
  }, {
    name: "Node_Enterprise",
    price: annual ? "$159" : "$199",
    feats: ["500,000_PROBES/MO", "ADVANCED_ANALYTICS", "DEDICATED_VPN"],
    cta: "Provision"
  }, {
    name: "Node_Custom",
    price: "QUOTE",
    feats: ["UNLIMITED_IO", "ON_PREM_BINARIES", "100%_SLO_GUARANTEE"],
    cta: "Talk_To_Ops"
  }];
  return /*#__PURE__*/React.createElement("section", {
    style: {
      ...MAXW,
      padding: "0 24px 128px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      marginBottom: 80,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 24
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: "var(--font-headline)",
      fontWeight: 900,
      color: "var(--k-text)",
      fontSize: "clamp(2.5rem, 5vw, 4.5rem)",
      letterSpacing: "-0.04em",
      lineHeight: 0.95,
      margin: 0
    }
  }, "Capacity Matrix."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "inline-flex",
      border: "1px solid var(--k-border)",
      background: "var(--k-surface)",
      borderRadius: "var(--radius-xs)",
      padding: 2
    }
  }, [["Standard", false], ["Annual_Enterprise", true]].map(([t, val]) => /*#__PURE__*/React.createElement("button", {
    key: t,
    onClick: () => setAnnual(val),
    style: {
      padding: "12px 32px",
      fontFamily: "var(--font-mono)",
      fontSize: 9,
      textTransform: "uppercase",
      letterSpacing: "0.15em",
      borderRadius: "var(--radius-xs)",
      border: "none",
      cursor: "pointer",
      background: annual === val ? "var(--k-toggle-on)" : "transparent",
      color: annual === val ? "var(--k-text)" : "var(--k-dim)"
    }
  }, t)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(4,1fr)",
      gap: 4
    }
  }, tiers.map(t => /*#__PURE__*/React.createElement("div", {
    key: t.name,
    style: {
      padding: 40,
      display: "flex",
      flexDirection: "column",
      position: "relative",
      borderRadius: "var(--radius-xs)",
      ...(t.rec ? {
        border: "2px solid var(--k-accent-border-strong)",
        background: "var(--k-card-hi)",
        boxShadow: "var(--k-accent-shadow)"
      } : glass)
    }
  }, t.rec && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      top: 0,
      right: 0,
      padding: 12,
      fontFamily: "var(--font-mono)",
      fontSize: 8,
      color: "var(--k-accent)",
      textTransform: "uppercase",
      letterSpacing: "0.2em",
      fontWeight: 700
    }
  }, "Recommended"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 9,
      textTransform: "uppercase",
      letterSpacing: "0.3em",
      color: t.rec ? "var(--k-accent)" : "var(--k-dim)",
      marginBottom: 24
    }
  }, t.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-headline)",
      fontSize: 46,
      fontWeight: 700,
      color: "var(--k-text)",
      marginBottom: 48,
      letterSpacing: "-0.03em"
    }
  }, t.price), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 16,
      marginBottom: 56,
      flex: 1
    }
  }, t.feats.map(f => /*#__PURE__*/React.createElement("div", {
    key: f,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      fontFamily: "var(--font-mono)",
      fontSize: 10,
      color: t.rec ? "var(--k-accent)" : "var(--k-body)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 4,
      height: 4,
      background: t.rec ? "var(--k-accent)" : "var(--k-dim)"
    }
  }), f))), /*#__PURE__*/React.createElement("a", {
    href: "#",
    style: {
      padding: "16px",
      textAlign: "center",
      fontFamily: "var(--font-mono)",
      fontSize: 9,
      textTransform: "uppercase",
      letterSpacing: "0.4em",
      borderRadius: "var(--radius-xs)",
      textDecoration: "none",
      fontWeight: t.rec ? 700 : 400,
      ...(t.rec ? {
        background: "var(--k-accent)",
        color: "var(--k-accent-ink)"
      } : {
        border: "1px solid var(--k-border)",
        color: "var(--k-text)"
      })
    }
  }, t.cta)))));
}
function CTA() {
  return /*#__PURE__*/React.createElement("section", {
    style: {
      padding: "128px 24px",
      textAlign: "center",
      position: "relative",
      overflow: "hidden",
      background: "radial-gradient(circle at 50% 50%, var(--k-cta-glow) 0%, transparent 60%)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement(window.SMInfra.Label, {
    color: "var(--k-accent)"
  }, "Ready to Operate")), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: "var(--font-headline)",
      fontWeight: 900,
      color: "var(--k-text)",
      maxWidth: 800,
      fontSize: "clamp(2.5rem, 6vw, 5rem)",
      letterSpacing: "-0.04em",
      lineHeight: 0.95,
      margin: "0 0 32px"
    }
  }, "Ready to build with precision?"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "var(--font-body)",
      fontWeight: 300,
      color: "var(--k-body)",
      fontSize: 18,
      maxWidth: 520,
      margin: "0 0 48px"
    }
  }, "Join thousands of engineering teams using ScrubiMail for mission-critical email validation."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 16,
      flexWrap: "wrap",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "#",
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "20px 40px",
      background: "var(--k-accent)",
      color: "var(--k-accent-ink)",
      fontFamily: "var(--font-mono)",
      fontSize: 10,
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: "0.3em",
      borderRadius: "var(--radius-xs)",
      textDecoration: "none",
      boxShadow: "var(--k-accent-shadow)"
    }
  }, /*#__PURE__*/React.createElement(PI.Zap, {
    size: 14
  }), " Initialize_Cluster"), /*#__PURE__*/React.createElement("a", {
    href: "#",
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "20px 40px",
      border: "1px solid var(--k-border)",
      color: "var(--k-text)",
      fontFamily: "var(--font-mono)",
      fontSize: 10,
      fontWeight: 500,
      textTransform: "uppercase",
      letterSpacing: "0.3em",
      borderRadius: "var(--radius-xs)",
      textDecoration: "none"
    }
  }, /*#__PURE__*/React.createElement(PI.ChevronRight, {
    size: 14
  }), " Read_Specification"))));
}
function Footer() {
  const {
    MAXW,
    SurgicalLine
  } = window.SMInfra;
  const cols = [{
    h: "Product",
    items: ["Email Validation", "Bulk Processing", "Analytics", "API Keys", "Changelog"]
  }, {
    h: "Company",
    items: ["About", "Pricing", "Contact", "Careers"]
  }, {
    h: "Resources",
    items: ["API Docs", "Help Center", "API Status", "Integrations"]
  }];
  return /*#__PURE__*/React.createElement("footer", {
    style: {
      background: "var(--k-foot)",
      borderTop: "1px solid var(--k-border)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...MAXW,
      padding: "64px 24px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "2fr 1fr 1fr 1fr",
      gap: 40,
      marginBottom: 48
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 28,
      height: 28,
      borderRadius: "var(--radius-xs)",
      background: "var(--k-accent)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement(PI.Zap, {
    size: 16,
    style: {
      color: "var(--k-accent-ink)"
    },
    strokeWidth: 2.5
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-headline)",
      fontWeight: 900,
      letterSpacing: "-0.04em",
      fontSize: 18,
      color: "var(--k-accent)"
    }
  }, "ScrubiMail")), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "var(--font-body)",
      fontWeight: 300,
      fontSize: 14,
      lineHeight: 1.6,
      color: "var(--k-body)",
      maxWidth: 280,
      margin: "0 0 24px"
    }
  }, "High-fidelity email validation infrastructure. Zero compromise on deliverability."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 12
    }
  }, [PI.Github, PI.Twitter, PI.Linkedin].map((Ic, i) => /*#__PURE__*/React.createElement("a", {
    key: i,
    href: "#",
    style: {
      width: 32,
      height: 32,
      border: "1px solid var(--k-border)",
      borderRadius: "var(--radius-xs)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "var(--k-body)"
    }
  }, /*#__PURE__*/React.createElement(Ic, {
    size: 14
  }))))), cols.map(c => /*#__PURE__*/React.createElement("div", {
    key: c.h
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-label)",
      fontSize: 9,
      textTransform: "uppercase",
      letterSpacing: "0.3em",
      color: "var(--k-dim)",
      marginBottom: 16
    }
  }, c.h), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, c.items.map(i => /*#__PURE__*/React.createElement("a", {
    key: i,
    href: "#",
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 11,
      textTransform: "uppercase",
      letterSpacing: "0.08em",
      color: "var(--k-body)",
      textDecoration: "none"
    }
  }, i)))))), /*#__PURE__*/React.createElement(SurgicalLine, null), /*#__PURE__*/React.createElement("div", {
    style: {
      paddingTop: 32,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 16,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 10,
      color: "var(--k-dim)",
      textTransform: "uppercase",
      letterSpacing: "0.2em"
    }
  }, "\xA9 2026 ScrubiMail. All rights reserved."), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: 999,
      background: "var(--k-accent)"
    },
    className: "pulse"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 9,
      color: "var(--k-dim)",
      textTransform: "uppercase",
      letterSpacing: "0.2em"
    }
  }, "All systems operational"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 20,
      fontFamily: "var(--font-mono)",
      fontSize: 9,
      textTransform: "uppercase",
      letterSpacing: "0.2em"
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "#",
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      color: "var(--k-dim)",
      textDecoration: "none"
    }
  }, /*#__PURE__*/React.createElement(PI.Lock, {
    size: 10
  }), " Privacy"), /*#__PURE__*/React.createElement("a", {
    href: "#",
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      color: "var(--k-dim)",
      textDecoration: "none"
    }
  }, /*#__PURE__*/React.createElement(PI.FileText, {
    size: 10
  }), " Terms"), /*#__PURE__*/React.createElement("a", {
    href: "#",
    style: {
      color: "var(--k-dim)",
      textDecoration: "none"
    }
  }, "Security")))));
}
Object.assign(window.SMInfra, {
  Pricing,
  CTA,
  Footer
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing/infra-pricing.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing/infra-shared.jsx
try { (() => {
/* ScrubiMail v2 "Surgical Infrastructure" — shared primitives + top nav.
   Theme-aware via --k-* vars defined in index.html. Exposes window.SMInfra. */
const {
  useState
} = React;
const KI = window.SMIcons;
const MAXW = {
  maxWidth: 1400,
  margin: "0 auto",
  padding: "0 24px"
};

/* uppercase Space-Grotesk micro-label */
function Label({
  children,
  color,
  size = 9,
  tracking = "0.3em",
  style = {}
}) {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-label)",
      textTransform: "uppercase",
      letterSpacing: tracking,
      fontSize: size,
      fontWeight: 500,
      color: color || "var(--k-accent)",
      ...style
    }
  }, children);
}

/* thin emerald gradient rule */
function SurgicalLine() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: 1,
      background: "linear-gradient(90deg, transparent, var(--k-accent), transparent)",
      opacity: 0.4
    }
  });
}
const glass = {
  borderRadius: "var(--radius-xs)",
  overflow: "hidden",
  backdropFilter: "blur(16px)",
  border: "1px solid var(--k-panel-border)",
  background: "var(--k-panel)"
};

/* ---- Top navigation (public) ---- */
function TopNav({
  dark,
  onToggle
}) {
  const links = ["API Docs", "Pricing", "About", "Changelog"];
  return /*#__PURE__*/React.createElement("header", {
    style: {
      position: "sticky",
      top: 0,
      zIndex: 50,
      borderBottom: "1px solid var(--k-border)",
      background: dark ? "rgba(8,12,16,0.95)" : "rgba(255,255,255,0.9)",
      backdropFilter: "blur(12px)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...MAXW,
      height: 56,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between"
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "#",
    style: {
      display: "flex",
      alignItems: "center",
      gap: 9,
      textDecoration: "none"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 28,
      height: 28,
      borderRadius: "var(--radius-xs)",
      background: "var(--k-accent)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement(KI.Zap, {
    size: 16,
    style: {
      color: "var(--k-accent-ink)"
    },
    strokeWidth: 2.5
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-headline)",
      fontWeight: 900,
      letterSpacing: "-0.04em",
      fontSize: 19,
      color: "var(--k-accent)"
    }
  }, "ScrubiMail")), /*#__PURE__*/React.createElement("nav", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 30
    }
  }, links.map(l => /*#__PURE__*/React.createElement("a", {
    key: l,
    href: "#",
    style: {
      fontFamily: "var(--font-label)",
      textTransform: "uppercase",
      letterSpacing: "0.1em",
      fontSize: 11,
      color: "var(--k-body)",
      textDecoration: "none",
      whiteSpace: "nowrap"
    }
  }, l))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onToggle,
    title: "Toggle theme",
    style: {
      width: 32,
      height: 32,
      borderRadius: "var(--radius-xs)",
      border: "none",
      background: "transparent",
      color: "var(--k-body)",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, dark ? /*#__PURE__*/React.createElement(KI.Sun, {
    size: 16
  }) : /*#__PURE__*/React.createElement(KI.Moon, {
    size: 16
  })), /*#__PURE__*/React.createElement("a", {
    href: "#",
    style: {
      fontFamily: "var(--font-label)",
      textTransform: "uppercase",
      letterSpacing: "0.1em",
      fontSize: 11,
      color: "var(--k-body)",
      textDecoration: "none",
      padding: "6px 4px"
    }
  }, "Sign In"), /*#__PURE__*/React.createElement("a", {
    href: "#",
    style: {
      fontFamily: "var(--font-label)",
      textTransform: "uppercase",
      letterSpacing: "0.1em",
      fontSize: 11,
      fontWeight: 700,
      background: "var(--k-accent)",
      color: "var(--k-accent-ink)",
      padding: "7px 16px",
      borderRadius: "var(--radius-xs)",
      textDecoration: "none",
      whiteSpace: "nowrap"
    }
  }, "Get Started"))));
}
window.SMInfra = {
  MAXW,
  Label,
  SurgicalLine,
  glass,
  TopNav
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing/infra-shared.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.ProgressBar = __ds_scope.ProgressBar;

__ds_ns.StatCard = __ds_scope.StatCard;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.SegmentedTabs = __ds_scope.SegmentedTabs;

})();
