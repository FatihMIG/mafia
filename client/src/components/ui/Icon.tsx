interface Props {
  name: string;
  className?: string;
}

// Renders a glyph from the Pixel Icon Library webfont (hn-<name>-solid).
export function Icon({ name, className = "" }: Props) {
  return <i className={`hn hn-${name}-solid ${className}`} aria-hidden="true" />;
}
