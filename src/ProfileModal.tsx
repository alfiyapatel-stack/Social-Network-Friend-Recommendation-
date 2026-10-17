import { useEffect, useState } from 'react';
import { HeartHandshake, Pencil, Trash2, UserMinus, UserPlus, X, Check } from 'lucide-react';
import { Avatar } from './avatar';
import { useApp } from './store';
import { Modal, StatusBadge } from './ui';
import { candidatesFor, connectionStatus, mutualFriends } from './algo';

export function ProfileModal() {
  const { profileId, openProfile, net, state, connect, disconnect, setMe, removeUser, updateUser, notify } =
    useApp();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', bio: '', interests: '' });

  const i = profileId ? net.idx.get(profileId) : undefined;
  useEffect(() => setEditing(false), [profileId]);

  if (!profileId || i === undefined) return <Modal open={false} onClose={() => openProfile(null)}>{null}</Modal>;

  const u = net.users[i];
  const me = net.idx.get(state.me) ?? 0;
  const isMe = i === me;
  const comm = net.communities[net.commOf[i]];
  const friends = [...net.nb[i]];
  const mutual = isMe ? [] : mutualFriends(net.nb, me, i);
  const reachable: number[] = [];
  net.users.forEach((_, j) => {
    if (j !== i && net.R[i][j] && !net.nb[i].has(j)) reachable.push(j);
  });
  const recs = candidatesFor(net, i)
    .filter((c) => c.eligible)
    .sort((a, b) => b.score - a.score || a.idx - b.idx)
    .slice(0, 3);
  const status = isMe ? 'self' : connectionStatus(net.A, me, i);
  const linked = status === 'friends' || status === 'following' || status === 'followed-by';

  const startEdit = () => {
    setForm({ name: u.name, bio: u.bio, interests: u.interests.join(', ') });
    setEditing(true);
  };
  const saveEdit = () => {
    const name = form.name.trim();
    if (!name) return notify('Name cannot be empty.');
    updateUser(u.id, {
      name,
      bio: form.bio.trim(),
      interests: form.interests.split(',').map((x) => x.trim()).filter(Boolean),
    });
    setEditing(false);
    notify('Profile updated (stored locally).');
  };

  return (
    <Modal open onClose={() => openProfile(null)} wide>
      <div className="flex items-center gap-4 pr-10">
        <Avatar name={u.name} size={84} ring={comm.color} />
        <div className="min-w-0">
          <h2 className="text-3xl font-bold text-burgundy">{u.name}</h2>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
            <span className="inline-flex items-center gap-1 font-medium text-wine">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: comm.color }} />
              {comm.isolated ? 'Unconnected' : comm.name}
            </span>
            <StatusBadge status={status} />
          </div>
        </div>
      </div>

      {editing ? (
        <div className="mt-4 space-y-2">
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" />
          <textarea className="input" rows={2} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Short bio" />
          <input className="input" value={form.interests} onChange={(e) => setForm({ ...form, interests: e.target.value })} placeholder="Interests, comma separated" />
          <div className="flex gap-2">
            <button className="btn-primary" onClick={saveEdit}><Check size={15} /> Save</button>
            <button className="btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <>
          <p className="mt-4 text-wine">{u.bio}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {u.interests.map((it) => (
              <span key={it} className={`chip ${!isMe && net.users[me].interests.includes(it) ? 'bg-wine text-white' : ''}`}>
                {it}
              </span>
            ))}
          </div>
        </>
      )}

      <div className="mt-5 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-2xl bg-blush p-3"><div className="font-display text-2xl font-bold">{friends.length}</div><div className="text-xs text-wine">Direct friends</div></div>
        <div className="rounded-2xl bg-blush p-3"><div className="font-display text-2xl font-bold">{isMe ? '—' : mutual.length}</div><div className="text-xs text-wine">Mutual with {isMe ? 'you' : net.users[me].name}</div></div>
        <div className="rounded-2xl bg-blush p-3"><div className="font-display text-2xl font-bold">{reachable.length}</div><div className="text-xs text-wine">Reachable (indirect)</div></div>
      </div>

      <h3 className="mt-5 text-lg font-bold">Direct friends</h3>
      <div className="mt-2 flex flex-wrap gap-2">
        {friends.length === 0 && <p className="text-sm text-wine/70">No direct friends yet — this user is isolated.</p>}
        {friends.map((f) => (
          <span key={f} className="inline-flex items-center gap-1 rounded-full bg-white py-1 pl-1 pr-2 text-sm shadow-sm ring-1 ring-rose/40">
            <button className="inline-flex items-center gap-1.5" onClick={() => openProfile(net.ids[f])}>
              <Avatar name={net.users[f].name} size={22} /> {net.users[f].name}
            </button>
            <button
              aria-label={`Remove friendship with ${net.users[f].name}`}
              title="Remove friendship"
              className="rounded-full p-0.5 text-wine hover:bg-blush"
              onClick={() => {
                disconnect(u.id, net.ids[f]);
                notify(`Friendship between ${u.name} and ${net.users[f].name} removed.`);
              }}
            >
              <X size={13} />
            </button>
          </span>
        ))}
      </div>

      {!isMe && (
        <>
          <h3 className="mt-5 text-lg font-bold">Mutual friends with {net.users[me].name}</h3>
          <p className="mt-1 text-sm text-wine">
            {mutual.length ? mutual.map((m) => net.users[m].name).join(', ') : 'None — no user is directly connected to both.'}
          </p>
        </>
      )}

      <h3 className="mt-5 text-lg font-bold">Reachable connections (via transitive closure)</h3>
      <p className="mt-1 text-sm text-wine">
        {reachable.length ? reachable.map((m) => net.users[m].name).join(', ') : 'No indirect connections.'}
      </p>

      <h3 className="mt-5 text-lg font-bold">Recommended connections</h3>
      {recs.length === 0 ? (
        <p className="mt-1 text-sm text-wine">No graph-based recommendations available.</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {recs.map((r) => (
            <li key={r.idx} className="flex items-center gap-3 rounded-2xl bg-white p-2 ring-1 ring-rose/30">
              <Avatar name={net.users[r.idx].name} size={36} />
              <div className="min-w-0 flex-1 text-sm">
                <div className="font-semibold">{net.users[r.idx].name} <span className="text-xs font-normal text-wine/70">score {r.score}</span></div>
                <div className="truncate text-xs text-wine">{r.reasons[0]}</div>
              </div>
              <button
                className="btn-soft px-3 py-1"
                onClick={() => {
                  connect(u.id, net.ids[r.idx]);
                  notify(`${u.name} ↔ ${net.users[r.idx].name} connected (local simulation).`);
                }}
              >
                <UserPlus size={14} /> Connect
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6 flex flex-wrap gap-2 border-t border-rose/30 pt-4">
        {!isMe && !linked && (
          <button className="btn-primary" onClick={() => { connect(state.me, u.id); notify(`${u.name} added — local simulation.`); }}>
            <UserPlus size={15} /> Add Friend
          </button>
        )}
        {!isMe && linked && (
          <button className="btn-ghost" onClick={() => { disconnect(state.me, u.id); notify(`${u.name} removed from your friends.`); }}>
            <UserMinus size={15} /> Remove Friend
          </button>
        )}
        {!isMe && (
          <button className="btn-soft" onClick={() => { setMe(u.id); notify(`Now analysing the network as ${u.name}.`); }}>
            <HeartHandshake size={15} /> Analyse as this user
          </button>
        )}
        {!editing && (
          <button className="btn-soft" onClick={startEdit}><Pencil size={15} /> Edit profile</button>
        )}
        <button
          className="btn-ghost ml-auto text-red-700"
          onClick={() => {
            if (net.users.length <= 2) return notify('Keep at least 2 users in the network.');
            if (window.confirm(`Remove ${u.name} and all their friendships?`)) {
              removeUser(u.id);
              openProfile(null);
              notify(`${u.name} removed.`);
            }
          }}
        >
          <Trash2 size={15} /> Remove user
        </button>
      </div>
      <p className="mt-3 text-xs text-wine/60">Demo only — all changes are a local simulation saved in your browser.</p>
    </Modal>
  );
}

/** "Suggest a Connection" dialog: graph-based and interest-based suggestions are kept separate. */
export function SuggestModal() {
  const { suggestId, openSuggest, net, connect, notify } = useApp();
  const i = suggestId ? net.idx.get(suggestId) : undefined;
  if (!suggestId || i === undefined) return <Modal open={false} onClose={() => openSuggest(null)}>{null}</Modal>;
  const u = net.users[i];
  const all = candidatesFor(net, i);
  const graph = all.filter((c) => c.eligible).sort((a, b) => b.score - a.score || a.idx - b.idx).slice(0, 4);
  const interest = all
    .filter((c) => c.shared.length > 0 && !graph.includes(c))
    .sort((a, b) => b.shared.length - a.shared.length || a.idx - b.idx)
    .slice(0, 4);

  const row = (c: (typeof all)[number]) => (
    <li key={c.idx} className="flex items-center gap-3 rounded-2xl bg-white p-2 ring-1 ring-rose/30">
      <Avatar name={net.users[c.idx].name} size={40} />
      <div className="min-w-0 flex-1 text-sm">
        <div className="font-semibold">{net.users[c.idx].name}</div>
        <div className="text-xs text-wine">{c.reasons[0]}</div>
      </div>
      <button
        className="btn-primary px-3 py-1"
        onClick={() => {
          connect(u.id, net.ids[c.idx]);
          notify(`${u.name} ↔ ${net.users[c.idx].name} connected (local simulation).`);
        }}
      >
        <UserPlus size={14} /> Connect
      </button>
    </li>
  );

  return (
    <Modal open onClose={() => openSuggest(null)}>
      <div className="flex items-center gap-3 pr-10">
        <Avatar name={u.name} size={56} />
        <div>
          <h2 className="text-2xl font-bold">Suggest a connection for {u.name}</h2>
          <p className="text-sm text-wine">{net.degree[i]} direct connection{net.degree[i] === 1 ? '' : 's'}</p>
        </div>
      </div>

      <h3 className="mt-5 text-lg font-bold">Graph-based (mutual friends / reachability)</h3>
      {net.degree[i] === 0 ? (
        <p className="mt-1 rounded-2xl bg-blush p-3 text-sm text-wine">
          {u.name} has no connections, so mutual-friend recommendations are not available — there is no path to
          follow. Use the interest-based suggestions below to make a first connection.
        </p>
      ) : graph.length === 0 ? (
        <p className="mt-1 text-sm text-wine">No graph-based candidates left.</p>
      ) : (
        <ul className="mt-2 space-y-2">{graph.map(row)}</ul>
      )}

      <h3 className="mt-5 text-lg font-bold">Interest-based (not a graph connection)</h3>
      {interest.length === 0 ? (
        <p className="mt-1 text-sm text-wine">No additional people share {u.name}'s interests.</p>
      ) : (
        <ul className="mt-2 space-y-2">{interest.map(row)}</ul>
      )}
    </Modal>
  );
}
