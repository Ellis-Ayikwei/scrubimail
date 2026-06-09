import { Link } from 'react-router-dom';

type LogoTone = 'auto' | 'white' | 'color';
type LogoVariant = 'full' | 'icon';

interface LogoProps {
  /** If set, wraps the logo in a router Link to this path. */
  to?: string;
  /** Sizing / extra classes. Default: h-7 w-auto. */
  className?: string;
  /** full wordmark (default) or the glyph-only mark. */
  variant?: LogoVariant;
  /**
   * auto  – color on light, white on dark (theme-aware surfaces)
   * white – always white (for permanently dark surfaces: nav, sidebar, footer)
   * color – never filtered (light surfaces only)
   */
  tone?: LogoTone;
}

const SRC: Record<LogoVariant, string> = {
  full: '/assets/images/scrubimail-logo-full.png',
  icon: '/assets/images/scrubimail-logo-icon.png',
};

// The source PNG has black "Scrubi" text, invisible on dark backgrounds, so we
// render a white silhouette there via a brightness/invert filter.
const TONE: Record<LogoTone, string> = {
  auto: 'dark:brightness-0 dark:invert',
  white: 'brightness-0 invert',
  color: '',
};

export default function Logo({
  to,
  className = 'h-7 w-auto',
  variant = 'full',
  tone = 'auto',
}: LogoProps) {
  const img = (
    <img
      src={SRC[variant]}
      alt="ScrubiMail"
      className={`${className} ${TONE[tone]}`.trim()}
    />
  );
  if (to) {
    return (
      <Link to={to} className="inline-flex items-center" aria-label="ScrubiMail home">
        {img}
      </Link>
    );
  }
  return img;
}
