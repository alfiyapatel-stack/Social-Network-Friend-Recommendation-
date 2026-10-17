const hash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
};

const BGS = [
  ['#FCE7EF', '#E8A1B2'],
  ['#FFE9DC', '#F2B8A0'],
  ['#F3E3F7', '#D4A5E0'],
  ['#E3F0F2', '#9CCBD1'],
  ['#FFF1D6', '#F0CB84'],
];
const SKIN = ['#F6D5C0', '#EBBE9E', '#D29A72', '#A9703F'];
const HAIR = ['#2B1B17', '#4A2C20', '#7A4A2A', '#1D1D2A', '#5A1F36'];
const CLOTH = ['#8F244B', '#6D1738', '#C2557A', '#7B5EA7', '#3F8F8A'];

/** Generated illustrated avatar (deterministic from the name). */
export function avatarSvg(name: string): string {
  const h = hash(name);
  const bg = BGS[h % BGS.length];
  const skin = SKIN[(h >> 3) % SKIN.length];
  const hair = HAIR[(h >> 5) % HAIR.length];
  const cloth = CLOTH[(h >> 7) % CLOTH.length];
  const style = (h >> 9) % 3;
  const behind = style === 1 ? `<ellipse cx="50" cy="52" rx="25" ry="30" fill="${hair}"/>` : '';
  const bun = style === 2 ? `<circle cx="50" cy="20" r="8" fill="${hair}"/>` : '';
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${bg[0]}"/><stop offset="1" stop-color="${bg[1]}"/></linearGradient></defs>` +
    `<rect width="100" height="100" fill="url(#g)"/>` +
    behind +
    `<path d="M14 100 Q14 70 50 70 Q86 70 86 100Z" fill="${cloth}"/>` +
    `<rect x="44" y="58" width="12" height="14" rx="5" fill="${skin}"/>` +
    `<circle cx="50" cy="44" r="18" fill="${skin}"/>` +
    bun +
    `<path d="M30 44 Q30 22 50 22 Q70 22 70 44 Q60 32 50 32 Q40 32 30 44Z" fill="${hair}"/>` +
    `<circle cx="43" cy="45" r="2" fill="#2B1B17"/><circle cx="57" cy="45" r="2" fill="#2B1B17"/>` +
    `<path d="M44 53 Q50 58 56 53" stroke="#8F244B" stroke-width="2" fill="none" stroke-linecap="round"/>` +
    `</svg>`
  );
}

export function avatarUri(name: string): string {
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(avatarSvg(name));
}

export function Avatar({
  name,
  size = 48,
  className = '',
  ring,
}: {
  name: string;
  size?: number;
  className?: string;
  ring?: string;
}) {
  return (
    <img
      src={avatarUri(name)}
      alt={name}
      width={size}
      height={size}
      className={`shrink-0 rounded-full object-cover ${className}`}
      style={{ width: size, height: size, boxShadow: ring ? `0 0 0 3px ${ring}` : undefined }}
    />
  );
}

export function Logo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="18" cy="24" r="13" fill="none" stroke="#8F244B" strokeWidth="4" />
      <circle cx="30" cy="24" r="13" fill="none" stroke="#E8A1B2" strokeWidth="4" />
      <path
        d="M24 31 C16 25 19 19 24 23 C29 19 32 25 24 31Z"
        fill="#6D1738"
      />
    </svg>
  );
}
