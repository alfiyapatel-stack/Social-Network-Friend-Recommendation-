import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Compass, Flame, HeartHandshake, Palette, Search, Sprout, UserPlus, Users } from 'lucide-react';
import { useApp } from '../store';
import { candidatesFor } from '../algo';
import { Avatar } from '../avatar';
import { EmptyState, SectionTitle } from '../ui';
import UserCard from '../UserCard';

type Filter = 'recommended' | 'mutual' | 'interests' | 'new' | 'least';

const FILTERS: { id: Filter; label: string; icon: ReactNode; desc: string }[] = [
  { id: 'recommended', label: 'Recommended for You', icon: <Flame size={15} />, desc: 'Graph-eligible people (mutual friend or reachable), ranked by score: mutual friends first, then interests, plus a small community bonus.' },
  { id: 'mutual', label: 'Mutual Friends', icon: <Users size={15} />, desc: 'People who share at least one direct friend with you, most mutual friends first.' },
  { id: 'interests', label: 'Same Interests', icon: <Palette size={15} />, desc: 'Interest-based suggestions. A shared hobby is NOT a graph connection — these are kept separate from the algorithmic picks.' },
  { id: 'new', label: 'New Connections', icon: <Compass size={15} />, desc: 'Reachable through a longer chain (no mutual friend yet) — closest first. Found using the Warshall reachability matrix.' },
  { id: 'least', label: 'Least Connected Users', icon: <Sprout size={15} />, desc: 'People with the fewest direct friends who are not yet connected to you.' },
];

function Everyone() {
  const { net, state, setThreshold, openSuggest, openProfile } = useApp();
  const rows = net.users
    .map((u, i) => ({ u, i, d: net.degree[i] }))
    .filter((r) => r.d < Math.max(state.threshold, 1))
    .sort((a, b) => a.d - b.d || a.i - b.i);

  return (
    <section className="page pt-0">
      <div className="card bg-gradient-to-br from-blush to-white p-6 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionTitle
            title="Everyone Deserves a Connection"
            sub="Isolated users have zero direct connections; Low Connectivity users have fewer than the threshold. Adding a friendship updates these labels automatically."
            icon={<HeartHandshake className="text-wine" />}
          />
          <label className="mb-6 flex items-center gap-2 text-sm font-semibold text-wine">
            Low-connectivity threshold
            <input
              type="number"
              min={1}
              max={10}
              value={state.threshold}
              onChange={(e) => setThreshold(Number(e.target.value) || 1)}
              className="input w-20"
            />
          </label>
        </div>
        {rows.length === 0 ? (
          <EmptyState title="Everyone is well connected 🎉" text={`Every user has at least ${state.threshold} direct connections.`} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map(({ u, i, d }) => (
              <div key={u.id} className="card flex flex-col p-5">
                <div className="flex items-center gap-3">
                  <Avatar name={u.name} size={52} />
                  <div className="min-w-0 flex-1">
                    <div className="text-lg font-bold">{u.name}</div>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${d === 0 ? 'bg-burgundy text-white' : 'bg-amber-100 text-amber-800'}`}>
                      {d === 0 ? 'Isolated' : 'Low Connectivity'} · {d} friend{d === 1 ? '' : 's'}
                    </span>
                  </div>
                </div>
                <p className="mt-3 text-sm text-wine">{u.bio}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">{u.interests.map((it) => <span key={it} className="chip">{it}</span>)}</div>
                <div className="mt-4 flex gap-2">
                  <button className="btn-ghost flex-1" onClick={() => openProfile(u.id)}>View Profile</button>
                  <button className="btn-primary flex-1" onClick={() => openSuggest(u.id)}>
                    <UserPlus size={15} /> Suggest a Connection
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default function Discover() {
  const { net, state, meIdx, setMe } = useApp();
  const [filter, setFilter] = useState<Filter>('recommended');
  const [query, setQuery] = useState('');

  const cands = useMemo(
    () => candidatesFor(net, meIdx).filter((c) => !state.dismissed.includes(`${state.me}:${net.ids[c.idx]}`)),
    [net, meIdx, state.dismissed, state.me],
  );

  const list = useMemo(() => {
    let l = [...cands];
    switch (filter) {
      case 'recommended':
        l = l.filter((c) => c.eligible).sort((a, b) => b.score - a.score || a.idx - b.idx);
        break;
      case 'mutual':
        l = l.filter((c) => c.mutual.length > 0).sort((a, b) => b.mutual.length - a.mutual.length || b.score - a.score || a.idx - b.idx);
        break;
      case 'interests':
        l = l.filter((c) => c.shared.length > 0).sort((a, b) => b.shared.length - a.shared.length || a.idx - b.idx);
        break;
      case 'new':
        l = l.filter((c) => c.eligible && c.mutual.length === 0).sort((a, b) => a.hops - b.hops || a.idx - b.idx);
        break;
      case 'least':
        l = l.sort((a, b) => net.degree[a.idx] - net.degree[b.idx] || a.idx - b.idx);
        break;
    }
    const q = query.trim().toLowerCase();
    if (q) {
      l = l.filter((c) => {
        const u = net.users[c.idx];
        return u.name.toLowerCase().includes(q) || u.interests.some((i) => i.toLowerCase().includes(q));
      });
    }
    return l;
  }, [cands, filter, query, net]);

  const active = FILTERS.find((f) => f.id === filter)!;

  return (
    <>
      <section className="page">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionTitle
            title="Discover Friends"
            sub="Recommendations are generated from the network graph (neighbour sets + Warshall reachability) — nothing is random or hardcoded."
          />
          <label className="mb-6 flex items-center gap-2 text-sm font-semibold text-wine">
            Viewing as
            <select className="input w-40" value={state.me} onChange={(e) => setMe(e.target.value)}>
              {net.users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </label>
        </div>

        <div className="mb-4 rounded-2xl bg-blush px-4 py-2 text-xs font-medium text-wine">
          Local simulation: “Add Friend” only changes the demo data stored in your browser — no real friend request is sent.
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`btn ${filter === f.id ? 'bg-wine text-white shadow' : 'bg-white text-wine ring-1 ring-rose/50 hover:bg-blush'}`}
              >
                {f.icon} {f.label}
              </button>
            ))}
          </div>
          <div className="relative md:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-wine/50" />
            <input className="input pl-9" placeholder="Search name or interest…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
        </div>
        <p className="mb-5 mt-3 text-sm text-wine/80">{active.desc}</p>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {list.length === 0 ? (
            <EmptyState
              title="No people to show"
              text={query ? `Nothing matches “${query}” in this filter.` : 'Try another filter, or add friends/users to grow the network.'}
            />
          ) : (
            list.map((c) => <UserCard key={c.idx} userIdx={c.idx} cand={c} />)
          )}
        </div>
      </section>
      <Everyone />
    </>
  );
}
