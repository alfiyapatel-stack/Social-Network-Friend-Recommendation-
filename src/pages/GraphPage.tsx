import { useMemo, useRef, useState } from 'react';
import { Eye, Link2, Maximize, Plus, RefreshCw, Unlink, UserPlus, ZoomIn, ZoomOut } from 'lucide-react';
import GraphView from '../GraphView';
import type { GraphControls } from '../GraphView';
import { useApp } from '../store';
import { Avatar } from '../avatar';
import { SectionTitle } from '../ui';
import { bfsPath, mutualFriends } from '../algo';

function Toggle({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      className={`btn px-3 py-1.5 ${on ? 'bg-wine text-white' : 'bg-white text-wine ring-1 ring-rose/60 hover:bg-blush'}`}
    >
      <Eye size={14} /> {label}
    </button>
  );
}

export default function GraphPage() {
  const { net, state, setDirected, openProfile, addUser, connect, disconnect, notify } = useApp();
  const controls = useRef<GraphControls | null>(null);
  const [showDirect, setShowDirect] = useState(true);
  const [showIndirect, setShowIndirect] = useState(false);
  const [showIsolated, setShowIsolated] = useState(true);
  const [sel, setSel] = useState<string[]>([]);
  const [nu, setNu] = useState({ name: '', bio: '', interests: '' });
  const [pair, setPair] = useState<[string, string]>([net.ids[0], net.ids[1]]);

  const pa = net.ids.includes(pair[0]) ? pair[0] : net.ids[0];
  const pb = net.ids.includes(pair[1]) ? pair[1] : net.ids[1];

  const onNodeTap = (id: string) =>
    setSel((s) => (s.length === 1 && s[0] !== id ? [s[0], id] : [id]));

  const focus = sel.length ? net.idx.get(sel[sel.length - 1]) : undefined;

  const pathInfo = useMemo(() => {
    if (sel.length !== 2) return null;
    const a = net.idx.get(sel[0]);
    const b = net.idx.get(sel[1]);
    if (a === undefined || b === undefined) return null;
    let p = bfsPath(net.A, a, b);
    let reversed = false;
    if (!p) {
      p = bfsPath(net.A, b, a);
      reversed = !!p;
    }
    return { a, b, p, reversed };
  }, [sel, net]);

  const pathIds = pathInfo?.p ? pathInfo.p.map((i) => net.ids[i]) : [];

  const submitUser = () => {
    const name = nu.name.trim();
    if (!name) return notify('Please enter a name for the new user.');
    addUser({
      name,
      bio: nu.bio.trim() || 'New to Bondly.',
      interests: nu.interests.split(',').map((x) => x.trim()).filter(Boolean),
    });
    setNu({ name: '', bio: '', interests: '' });
    notify(`${name} added as an isolated user — connect them using the form below.`);
  };

  const comms = net.communities.filter((c) => !c.isolated);

  return (
    <section className="page">
      <SectionTitle
        title="Network Graph"
        sub="Nodes are users, edges are friendships. Click a node for details, click a second node to see the connecting path, hover to highlight neighbours."
      />
      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="card overflow-hidden">
          <div className="flex flex-wrap items-center gap-2 border-b border-rose/30 bg-blush/50 p-3">
            <Toggle on={showDirect} onClick={() => setShowDirect((v) => !v)} label="Direct friends" />
            <Toggle on={showIndirect} onClick={() => setShowIndirect((v) => !v)} label={`Indirect (from ${net.users[net.idx.get(state.me) ?? 0].name})`} />
            <Toggle on={showIsolated} onClick={() => setShowIsolated((v) => !v)} label="Isolated users" />
            <Toggle on={state.directed} onClick={() => setDirected(!state.directed)} label="Directed mode" />
            <div className="ml-auto flex gap-1">
              <button className="btn-soft px-2.5" aria-label="Zoom in" onClick={() => controls.current?.zoomIn()}><ZoomIn size={16} /></button>
              <button className="btn-soft px-2.5" aria-label="Zoom out" onClick={() => controls.current?.zoomOut()}><ZoomOut size={16} /></button>
              <button className="btn-soft px-2.5" aria-label="Fit to screen" title="Fit to screen" onClick={() => controls.current?.fit()}><Maximize size={16} /></button>
              <button className="btn-soft px-2.5" aria-label="Re-layout" title="Re-layout" onClick={() => controls.current?.relayout()}><RefreshCw size={16} /></button>
            </div>
          </div>
          <div className="h-[62vh] min-h-[420px] bg-gradient-to-br from-white to-blush/40">
            <GraphView
              net={net}
              directed={state.directed}
              meId={state.me}
              showDirect={showDirect}
              showIndirect={showIndirect}
              showIsolated={showIsolated}
              selected={sel}
              pathIds={pathIds}
              onNodeTap={onNodeTap}
              onBgTap={() => setSel([])}
              controls={controls}
            />
          </div>
          <p className="border-t border-rose/30 bg-blush/40 px-4 py-2 text-xs text-wine">
            {state.directed
              ? 'Directed mode: every directed edge is drawn with an arrow; new friendships you add are one-way (A → B).'
              : 'Friendships are stored as reciprocal directed edges (A → B and B → A) and drawn as one line. A lone arrow marks a one-way edge.'}
          </p>
        </div>

        <aside className="space-y-4">
          <div className="card p-5">
            <h3 className="text-lg font-bold">{sel.length === 2 ? 'Path between users' : 'Selected user'}</h3>
            {sel.length === 0 && <p className="mt-2 text-sm text-wine/80">Click a node to see its profile. Click a second node to find the path between them.</p>}
            {focus !== undefined && (
              <div className="mt-3 flex items-center gap-3">
                <Avatar name={net.users[focus].name} size={52} />
                <div className="min-w-0 flex-1">
                  <div className="font-bold">{net.users[focus].name}</div>
                  <div className="text-xs text-wine">{net.degree[focus]} friends · {net.communities[net.commOf[focus]].name}</div>
                </div>
                <button className="btn-soft px-3 py-1" onClick={() => openProfile(net.ids[focus])}>Open</button>
              </div>
            )}
            {focus !== undefined && <p className="mt-2 text-sm text-wine">{net.users[focus].bio}</p>}
            {pathInfo && (
              <div className="mt-3 rounded-2xl bg-blush p-3 text-sm">
                {pathInfo.p ? (
                  <>
                    <div className="font-semibold">
                      {pathInfo.p.map((i) => net.users[i].name).join(' → ')}
                    </div>
                    <div className="mt-1 text-xs text-wine">
                      {pathInfo.p.length - 1} step{pathInfo.p.length === 2 ? '' : 's'}
                      {pathInfo.p.length > 2 && ` · intermediate: ${pathInfo.p.slice(1, -1).map((i) => net.users[i].name).join(', ')}`}
                      {pathInfo.reversed && ' · found in the reverse direction only'}
                      {` · mutual friends: ${mutualFriends(net.nb, pathInfo.a, pathInfo.b).length}`}
                    </div>
                  </>
                ) : (
                  <span>No path exists between these two users — they are in different connected components.</span>
                )}
              </div>
            )}
          </div>

          <div className="card p-5">
            <h3 className="text-lg font-bold">Legend</h3>
            <ul className="mt-2 space-y-1.5 text-sm text-wine">
              <li className="flex items-center gap-2"><span className="h-4 w-4 rounded-full border-[3px] border-wine bg-blush" /> User (avatar node, ring = community colour)</li>
              <li className="flex items-center gap-2"><span className="h-4 w-4 rounded-full border-[3px] border-dashed border-[#A89AA0] bg-blush" /> Isolated user (no connections)</li>
              <li className="flex items-center gap-2"><span className="h-0.5 w-6 bg-rose" /> Friendship (reciprocal edges)</li>
              <li className="flex items-center gap-2"><span className="text-wine">→</span> One-way / directed edge</li>
              <li className="flex items-center gap-2"><span className="w-6 border-t-2 border-dashed border-[#C98A3E]" /> Indirect (reachable) from viewing user</li>
              <li className="flex items-center gap-2"><span className="h-0.5 w-6 bg-burgundy" style={{ height: 4 }} /> Highlighted path</li>
            </ul>
            <div className="mt-3 flex flex-wrap gap-2">
              {comms.map((c) => (
                <span key={c.id} className="inline-flex items-center gap-1.5 rounded-full bg-blush px-2.5 py-1 text-xs font-medium text-wine">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} /> {c.name}
                </span>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <h3 className="text-lg font-bold">Manage network</h3>
            <p className="mb-2 text-xs text-wine/70">Local simulation — the graph, matrices and recommendations all recalculate instantly.</p>
            <div className="space-y-2">
              <input className="input" placeholder="New user name" value={nu.name} onChange={(e) => setNu({ ...nu, name: e.target.value })} />
              <input className="input" placeholder="Short bio" value={nu.bio} onChange={(e) => setNu({ ...nu, bio: e.target.value })} />
              <input className="input" placeholder="Interests (comma separated)" value={nu.interests} onChange={(e) => setNu({ ...nu, interests: e.target.value })} />
              <button className="btn-primary w-full" onClick={submitUser}><UserPlus size={15} /> Add user</button>
            </div>
            <div className="my-4 border-t border-rose/30" />
            <div className="space-y-2">
              <select className="input" value={pa} onChange={(e) => setPair([e.target.value, pb])}>
                {net.users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
              <select className="input" value={pb} onChange={(e) => setPair([pa, e.target.value])}>
                {net.users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
              <div className="flex gap-2">
                <button
                  className="btn-primary flex-1"
                  onClick={() => {
                    if (pa === pb) return notify('Choose two different users.');
                    connect(pa, pb);
                    notify('Friendship added (local simulation).');
                  }}
                >
                  <Link2 size={15} /> {state.directed ? 'Add edge A → B' : 'Connect'}
                </button>
                <button
                  className="btn-ghost flex-1"
                  onClick={() => {
                    if (pa === pb) return notify('Choose two different users.');
                    disconnect(pa, pb);
                    notify('Friendship removed.');
                  }}
                >
                  <Unlink size={15} /> Disconnect
                </button>
              </div>
              <p className="flex items-center gap-1 text-xs text-wine/70"><Plus size={12} /> Remove a user from their profile (click a node → Open).</p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
