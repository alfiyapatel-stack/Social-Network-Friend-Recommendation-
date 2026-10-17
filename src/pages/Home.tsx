import { ArrowRight, Compass, Database, Heart, HeartHandshake, Network, Share2, Sigma, Sparkles, Users } from 'lucide-react';
import { useApp } from '../store';
import { avatarUri } from '../avatar';
import { networkStats, candidatesFor } from '../algo';
import { SectionTitle, StatCard } from '../ui';
import UserCard from '../UserCard';
import type { RouteId } from '../App';

function HeroGraph() {
  const { net, openProfile } = useApp();
  const top = [...net.users.keys()]
    .sort((a, b) => net.degree[b] - net.degree[a] || a - b)
    .slice(0, 9);
  const pos = top.map((_, k) => {
    const a = (k / top.length) * Math.PI * 2 - Math.PI / 2;
    return { x: 50 + 34 * Math.cos(a), y: 50 + 34 * Math.sin(a) };
  });
  const lines: [number, number][] = [];
  for (let a = 0; a < top.length; a++)
    for (let b = a + 1; b < top.length; b++) if (net.nb[top[a]].has(top[b])) lines.push([a, b]);

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[520px]">
      <div className="absolute inset-4 rounded-full bg-gradient-to-br from-blush via-rose/40 to-cream blur-2xl" />
      <svg viewBox="0 0 100 100" className="relative h-full w-full animate-float">
        {lines.map(([a, b], i) => (
          <line key={i} x1={pos[a].x} y1={pos[a].y} x2={pos[b].x} y2={pos[b].y} stroke="#8F244B" strokeOpacity="0.35" strokeWidth="0.7" />
        ))}
        <circle cx="50" cy="50" r="9" fill="#fff" stroke="#E8A1B2" strokeWidth="1.2" />
        <path d="M50 56 C42 50 45 44 50 48 C55 44 58 50 50 56Z" fill="#8F244B" />
        {top.map((m, k) => (
          <g
            key={m}
            className="cursor-pointer transition-transform duration-200 hover:scale-110 [transform-box:fill-box] [transform-origin:center]"
            onClick={() => openProfile(net.ids[m])}
          >
            <clipPath id={`hc${k}`}>
              <circle cx={pos[k].x} cy={pos[k].y} r="7.5" />
            </clipPath>
            <image href={avatarUri(net.users[m].name)} x={pos[k].x - 7.5} y={pos[k].y - 7.5} width="15" height="15" clipPath={`url(#hc${k})`} />
            <circle cx={pos[k].x} cy={pos[k].y} r="7.5" fill="none" stroke={net.communities[net.commOf[m]].color} strokeWidth="1.5" />
            <text x={pos[k].x} y={pos[k].y + 12.5} textAnchor="middle" fontSize="3.4" fontWeight="600" fill="#6D1738">
              {net.users[m].name}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export default function Home({ go }: { go: (r: RouteId) => void }) {
  const { net, meIdx } = useApp();
  const s = networkStats(net);
  const picks = candidatesFor(net, meIdx)
    .filter((c) => c.eligible)
    .sort((a, b) => b.score - a.score || a.idx - b.idx)
    .slice(0, 3);

  const steps = [
    { icon: <Database size={22} />, t: '1. Build the Network', d: 'Users become vertices and friendships become directed edges, stored in an adjacency matrix and neighbour sets.' },
    { icon: <Sigma size={22} />, t: '2. Analyze Connections', d: "Warshall's algorithm computes the transitive closure — who can reach whom through any chain of friends." },
    { icon: <HeartHandshake size={22} />, t: '3. Discover New Friendships', d: 'Mutual friends, shared interests and community are scored to rank friends-of-friends you may want to meet.' },
  ];

  return (
    <>
      <section className="bg-gradient-to-b from-blush/70 to-cream">
        <div className="page grid items-center gap-10 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-wine shadow-sm ring-1 ring-rose/40">
              <Sparkles size={14} /> Powered by Warshall's Algorithm
            </span>
            <h1 className="mt-4 text-4xl font-bold leading-tight text-burgundy sm:text-5xl lg:text-6xl">
              Your Next Best Friend Is One Connection Away.
            </h1>
            <p className="mt-4 max-w-xl text-lg text-wine/90">
              Discover new people, explore mutual friendships, and find your circle with the power of graph algorithms.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button className="btn-primary px-6 py-3 text-base" onClick={() => go('discover')}>
                <Heart size={18} /> Discover Friends
              </button>
              <button className="btn-ghost bg-white px-6 py-3 text-base" onClick={() => go('graph')}>
                <Share2 size={18} /> Explore Network <ArrowRight size={16} />
              </button>
            </div>
            <p className="mt-5 text-sm italic text-wine/70">“Every friendship begins with a connection.”</p>
          </div>
          <HeroGraph />
        </div>
      </section>

      <section className="page">
        <SectionTitle title="Your network at a glance" sub="Every number below is calculated live from the current network — add or remove people and watch it change." />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Total Users" value={s.totalUsers} icon={<Users size={22} />} hint={`${s.isolated} isolated`} />
          <StatCard label="Total Friendships" value={s.totalFriendships} icon={<Heart size={22} />} hint="connected pairs" />
          <StatCard label="Mutual Connections Found" value={s.mutualConnections} icon={<Network size={22} />} hint="unconnected pairs sharing ≥1 friend" />
          <StatCard label="Communities Discovered" value={s.communities} icon={<Compass size={22} />} hint="label propagation" />
        </div>
      </section>

      <section className="page pt-2">
        <SectionTitle title="How Bondly Works" />
        <div className="grid gap-4 md:grid-cols-3">
          {steps.map((st) => (
            <div key={st.t} className="card p-6 transition hover:-translate-y-1">
              <div className="mb-3 inline-flex rounded-2xl bg-blush p-3 text-wine">{st.icon}</div>
              <h3 className="text-xl font-bold">{st.t}</h3>
              <p className="mt-2 text-sm text-wine/90">{st.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="page pt-2">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <SectionTitle title={`Top picks for ${net.users[meIdx].name}`} sub="Live output of the recommendation logic for the current user." />
          <button className="btn-soft" onClick={() => go('discover')}>See all <ArrowRight size={15} /></button>
        </div>
        {picks.length === 0 ? (
          <p className="text-sm text-wine">No graph-based recommendations right now.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {picks.map((c) => (
              <UserCard key={c.idx} userIdx={c.idx} cand={c} showActions={false} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
