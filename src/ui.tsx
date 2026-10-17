import React, { useEffect, useId } from 'react';
import { X } from 'lucide-react';
import { avatarUri } from './avatar';
import type { Matrix, Net, Status } from './algo';

export function Modal({
  open,
  onClose,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const f = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', f);
    return () => window.removeEventListener('keydown', f);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-burgundy/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`animate-pop relative max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-cream p-5 shadow-soft sm:rounded-3xl sm:p-7 ${
          wide ? 'max-w-3xl' : 'max-w-xl'
        }`}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full bg-blush p-1.5 text-wine hover:bg-rose/40"
          aria-label="Close"
        >
          <X size={18} />
        </button>
        {children}
      </div>
    </div>
  );
}

export function SectionTitle({
  title,
  sub,
  icon,
}: {
  title: string;
  sub?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <h2 className="flex items-center gap-2 text-3xl font-bold text-burgundy">
        {icon}
        {title}
      </h2>
      {sub && <p className="mt-1 max-w-3xl text-sm text-wine/80">{sub}</p>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon,
  hint,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="card p-5 transition hover:-translate-y-1">
      <div className="mb-3 inline-flex rounded-2xl bg-blush p-2.5 text-wine">{icon}</div>
      <div className="font-display text-4xl font-bold text-burgundy">{value}</div>
      <div className="text-sm font-semibold text-wine">{label}</div>
      {hint && <div className="mt-1 text-xs text-wine/60">{hint}</div>}
    </div>
  );
}

export function StatusBadge({ status }: { status: Status | 'self' }) {
  const map: Record<string, { t: string; c: string }> = {
    self: { t: 'You', c: 'bg-burgundy text-white' },
    friends: { t: 'Friends', c: 'bg-emerald-100 text-emerald-800' },
    following: { t: 'Following (one-way)', c: 'bg-amber-100 text-amber-800' },
    'followed-by': { t: 'Follows you', c: 'bg-amber-100 text-amber-800' },
    none: { t: 'Not connected', c: 'bg-blush text-wine' },
  };
  const m = map[status];
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${m.c}`}>{m.t}</span>;
}

export function EmptyState({ title, text }: { title: string; text?: string }) {
  return (
    <div className="card col-span-full p-10 text-center">
      <div className="font-display text-xl font-bold text-burgundy">{title}</div>
      {text && <p className="mt-1 text-sm text-wine/70">{text}</p>}
    </div>
  );
}

/** Matrix table with highlighting of changed cells and the current k row/column. */
export function MatrixView({
  labels,
  matrix,
  changed,
  k,
}: {
  labels: string[];
  matrix: Matrix;
  changed?: [number, number][];
  k?: number;
}) {
  const chg = new Set((changed || []).map(([i, j]) => `${i}-${j}`));
  const short = (l: string) => l.slice(0, 3);
  return (
    <div className="max-h-[30rem] overflow-auto rounded-2xl border border-rose/40 bg-white">
      <table className="border-collapse text-[11px]">
        <thead>
          <tr>
            <th className="sticky left-0 top-0 z-20 bg-blush" />
            {labels.map((l, j) => (
              <th
                key={j}
                title={l}
                className={`sticky top-0 z-10 px-1 py-1 font-semibold ${
                  k === j ? 'bg-wine text-white' : 'bg-blush text-burgundy'
                }`}
              >
                {short(l)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, i) => (
            <tr key={i}>
              <th
                title={labels[i]}
                className={`sticky left-0 z-10 px-1.5 text-left font-semibold ${
                  k === i ? 'bg-wine text-white' : 'bg-blush text-burgundy'
                }`}
              >
                {short(labels[i])}
              </th>
              {row.map((v, j) => {
                const isChanged = chg.has(`${i}-${j}`);
                const onK = k !== undefined && k >= 0 && (k === i || k === j);
                return (
                  <td
                    key={j}
                    className={`h-7 w-7 border border-rose/20 text-center transition-colors ${
                      isChanged
                        ? 'bg-amber-300 font-bold text-burgundy ring-2 ring-inset ring-amber-500'
                        : v
                        ? 'bg-rose/30 font-bold text-burgundy'
                        : onK
                        ? 'bg-blush/60 text-wine/40'
                        : 'text-wine/30'
                    }`}
                  >
                    {v}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Small circular-layout SVG of a set of members and the friendships among them. */
export function MiniNetwork({
  net,
  members,
  color,
  size = 200,
}: {
  net: Net;
  members: number[];
  color: string;
  size?: number;
}) {
  const uid = useId().replace(/:/g, '');
  const n = members.length;
  const pos = members.map((_, k) => {
    const a = (k / Math.max(n, 1)) * Math.PI * 2 - Math.PI / 2;
    return n === 1 ? { x: 50, y: 50 } : { x: 50 + 34 * Math.cos(a), y: 50 + 34 * Math.sin(a) };
  });
  const lines: [number, number][] = [];
  for (let a = 0; a < n; a++)
    for (let b = a + 1; b < n; b++) if (net.nb[members[a]].has(members[b])) lines.push([a, b]);
  const r = n > 10 ? 6 : 7.5;
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className="mx-auto max-w-full">
      {lines.map(([a, b], i) => (
        <line
          key={i}
          x1={pos[a].x}
          y1={pos[a].y}
          x2={pos[b].x}
          y2={pos[b].y}
          stroke={color}
          strokeOpacity="0.45"
          strokeWidth="1"
        />
      ))}
      {members.map((m, k) => (
        <g key={m}>
          <clipPath id={`${uid}-${k}`}>
            <circle cx={pos[k].x} cy={pos[k].y} r={r} />
          </clipPath>
          <image
            href={avatarUri(net.users[m].name)}
            x={pos[k].x - r}
            y={pos[k].y - r}
            width={r * 2}
            height={r * 2}
            clipPath={`url(#${uid}-${k})`}
          />
          <circle cx={pos[k].x} cy={pos[k].y} r={r} fill="none" stroke={color} strokeWidth="1.6" />
        </g>
      ))}
    </svg>
  );
}
