import { useState } from 'react';
import { Info, Layers } from 'lucide-react';
import { useApp } from '../store';
import { Avatar } from '../avatar';
import { EmptyState, MiniNetwork, SectionTitle } from '../ui';
import { strongComponents, weakComponents } from '../algo';

export default function Communities() {
  const { net, state, openProfile } = useApp();
  const comms = net.communities.filter((c) => !c.isolated);
  const [selId, setSelId] = useState<number | null>(null);
  const [mode, setMode] = useState<'weak' | 'strong'>('weak');

  const sel = comms.find((c) => c.id === selId) || comms[0];
  const comps = mode === 'weak' ? weakComponents(net.A) : strongComponents(net.R);
  const isolated = net.isolatedIdx;

  // Bridges: friendships whose endpoints are in different communities
  const bridges: [number, number][] = [];
  if (sel) {
    for (const m of sel.members)
      for (const o of net.nb[m])
        if (!sel.members.includes(o) && !net.communities[net.commOf[o]].isolated) bridges.push([m, o]);
  }

  return (
    <section className="page">
      <SectionTitle
        title="Communities"
        sub="Clusters of users who are more densely connected to each other than to the rest of the network."
        icon={<Layers className="text-wine" />}
      />

      <div className="card mb-6 flex gap-3 bg-blush/60 p-4 text-sm text-wine">
        <Info className="mt-0.5 shrink-0" size={18} />
        <div>
          <b>Warshall computes reachability, not communities.</b> The closure tells us who can reach whom, so connected
          components can be read from it. But a connected component is not automatically a tight-knit community — two
          friend groups joined by a single bridge are still one component. Communities here are found with a separate
          method, <b>label propagation</b>: every user repeatedly adopts the most common label among their friends until
          labels stop changing. Isolated users (no friends) are not placed in any community.
        </div>
      </div>

      {comms.length === 0 ? (
        <EmptyState title="No communities yet" text="Add friendships between users to form clusters." />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {comms.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelId(c.id)}
              className={`card p-5 text-left transition hover:-translate-y-1 hover:shadow-xl ${sel?.id === c.id ? 'ring-2 ring-wine' : ''}`}
              aria-pressed={sel?.id === c.id}
            >
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ background: c.color }} />
                <h3 className="text-xl font-bold">{c.name}</h3>
              </div>
              <div className="mt-1 text-sm text-wine">{c.members.length} members · {c.internalEdges} internal friendships</div>
              <div className="mt-3 flex -space-x-2">
                {c.members.slice(0, 8).map((m) => (
                  <Avatar key={m} name={net.users[m].name} size={34} className="ring-2 ring-white" />
                ))}
                {c.members.length > 8 && <span className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-blush text-xs font-bold ring-2 ring-white">+{c.members.length - 8}</span>}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {c.interests.filter(([, n]) => n >= 2).slice(0, 4).map(([it, n]) => (
                  <span key={it} className="chip">{it} ×{n}</span>
                ))}
              </div>
              <div className="mt-3"><MiniNetwork net={net} members={c.members} color={c.color} size={170} /></div>
            </button>
          ))}
        </div>
      )}

      {sel && (
        <div className="card mt-6 p-6">
          <h3 className="flex items-center gap-2 text-2xl font-bold">
            <span className="h-3.5 w-3.5 rounded-full" style={{ background: sel.color }} /> {sel.name}
          </h3>
          <div className="mt-4 grid gap-6 lg:grid-cols-2">
            <div>
              <h4 className="font-bold">Members & their friends inside the community</h4>
              <ul className="mt-2 space-y-2">
                {sel.members.map((m) => {
                  const inner = [...net.nb[m]].filter((o) => sel.members.includes(o));
                  return (
                    <li key={m} className="flex items-center gap-3 rounded-2xl bg-blush/50 p-2">
                      <Avatar name={net.users[m].name} size={38} />
                      <div className="min-w-0 flex-1 text-sm">
                        <button className="font-semibold hover:underline" onClick={() => openProfile(net.ids[m])}>{net.users[m].name}</button>
                        <div className="truncate text-xs text-wine">{inner.map((o) => net.users[o].name).join(', ') || '—'}</div>
                      </div>
                      <span className="text-xs font-semibold text-wine">{inner.length}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div>
              <h4 className="font-bold">Links to other communities</h4>
              {bridges.length === 0 ? (
                <p className="mt-2 text-sm text-wine">This community has no friendships to other communities.</p>
              ) : (
                <ul className="mt-2 space-y-1.5 text-sm text-wine">
                  {bridges.map(([a, b]) => (
                    <li key={`${a}-${b}`}>
                      <b>{net.users[a].name}</b> ↔ <b>{net.users[b].name}</b> <span className="text-xs">({net.communities[net.commOf[b]].name})</span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-4"><MiniNetwork net={net} members={sel.members} color={sel.color} size={240} /></div>
            </div>
          </div>
        </div>
      )}

      <div className="card mt-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-xl font-bold">Connected components (derived from Warshall's closure)</h3>
          <div className="flex gap-2">
            <button className={`btn px-3 py-1.5 ${mode === 'weak' ? 'bg-wine text-white' : 'bg-blush text-wine'}`} onClick={() => setMode('weak')}>Weakly connected</button>
            <button className={`btn px-3 py-1.5 ${mode === 'strong' ? 'bg-wine text-white' : 'bg-blush text-wine'}`} onClick={() => setMode('strong')}>Strongly connected</button>
          </div>
        </div>
        <p className="mt-2 text-sm text-wine">
          {mode === 'weak'
            ? 'Weak: ignore edge direction — users are together if any path joins them in either direction.'
            : 'Strong: users i and j are together only if R[i][j] = 1 and R[j][i] = 1 (each can reach the other).'}
          {!state.directed && ' With reciprocal friendships (the default) both views give the same groups.'}
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          {comps.map((c, i) => (
            <div key={i} className="rounded-2xl bg-blush/60 px-3 py-2 text-sm">
              <div className="text-xs font-semibold text-wine/70">Component {i + 1} · {c.length} user{c.length === 1 ? '' : 's'}</div>
              <div className="text-wine">{c.map((m) => net.users[m].name).join(', ')}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card mt-6 p-6">
        <h3 className="text-xl font-bold">Isolated users</h3>
        {isolated.length === 0 ? (
          <p className="mt-2 text-sm text-wine">Nobody is isolated right now.</p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-3">
            {isolated.map((i) => (
              <button key={i} onClick={() => openProfile(net.ids[i])} className="flex items-center gap-2 rounded-full bg-blush px-3 py-1.5 text-sm font-medium text-wine hover:bg-rose/40">
                <Avatar name={net.users[i].name} size={26} /> {net.users[i].name}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
