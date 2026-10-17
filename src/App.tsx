import { useEffect, useState } from 'react';
import { Heart, Menu, RotateCcw, X } from 'lucide-react';
import { useApp } from './store';
import { Avatar, Logo } from './avatar';
import { ProfileModal, SuggestModal } from './ProfileModal';
import Home from './pages/Home';
import Discover from './pages/Discover';
import GraphPage from './pages/GraphPage';
import Communities from './pages/Communities';
import Lab from './pages/Lab';
import About from './pages/About';

export const ROUTES = [
  { id: 'home', label: 'Home' },
  { id: 'discover', label: 'Discover Friends' },
  { id: 'graph', label: 'Network Graph' },
  { id: 'communities', label: 'Communities' },
  { id: 'lab', label: 'Algorithm Lab' },
  { id: 'about', label: 'About Project' },
] as const;

export type RouteId = (typeof ROUTES)[number]['id'];

function currentRoute(): RouteId {
  const h = window.location.hash.replace(/^#\/?/, '');
  const found = ROUTES.find((r) => r.id === h);
  return found ? found.id : 'home';
}

function useHashRoute() {
  const [route, setRoute] = useState<RouteId>(currentRoute);
  useEffect(() => {
    const f = () => {
      setRoute(currentRoute());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', f);
    return () => window.removeEventListener('hashchange', f);
  }, []);
  const go = (id: RouteId) => {
    window.location.hash = '/' + id;
  };
  return [route, go] as const;
}

function Nav({ route, go }: { route: RouteId; go: (r: RouteId) => void }) {
  const { net, state, setMe, reset } = useApp();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const me = net.users[net.idx.get(state.me) ?? 0];

  const nav = (id: RouteId) => {
    go(id);
    setOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-rose/30 bg-cream/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        <button className="flex items-center gap-2" onClick={() => nav('home')} aria-label="Bondly home">
          <Logo />
          <div className="text-left leading-tight">
            <div className="font-display text-xl font-bold text-burgundy">Bondly</div>
            <div className="hidden text-[10px] font-semibold uppercase tracking-wider text-wine/70 sm:block">Find Your Circle</div>
          </div>
        </button>

        <nav className="ml-6 hidden items-center gap-1 lg:flex">
          {ROUTES.map((r) => (
            <button
              key={r.id}
              onClick={() => nav(r.id)}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${route === r.id ? 'bg-wine text-white' : 'text-wine hover:bg-blush'}`}
            >
              {r.label}
            </button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button className="btn-primary hidden sm:inline-flex" onClick={() => nav('discover')}>
            <Heart size={15} /> Find My Friends
          </button>
          <div className="relative">
            <button onClick={() => setMenu((m) => !m)} aria-label="Profile menu" className="rounded-full ring-2 ring-rose">
              <Avatar name={me.name} size={38} />
            </button>
            {menu && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-rose/40 bg-white p-4 shadow-soft">
                <div className="text-xs font-semibold uppercase tracking-wide text-wine/60">Viewing as</div>
                <select className="input mt-1" value={state.me} onChange={(e) => setMe(e.target.value)}>
                  {net.users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
                <button
                  className="btn-ghost mt-3 w-full"
                  onClick={() => {
                    if (window.confirm('Reset the demo to the original sample network?')) {
                      reset();
                      setMenu(false);
                    }
                  }}
                >
                  <RotateCcw size={15} /> Reset Demo
                </button>
                <p className="mt-2 text-[11px] text-wine/60">Changes are saved locally in your browser.</p>
              </div>
            )}
          </div>
          <button className="btn-soft px-2.5 lg:hidden" aria-label="Toggle menu" onClick={() => setOpen((o) => !o)}>
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-rose/30 bg-cream px-4 pb-4 lg:hidden">
          <div className="mt-2 grid gap-1">
            {ROUTES.map((r) => (
              <button
                key={r.id}
                onClick={() => nav(r.id)}
                className={`rounded-xl px-3 py-2 text-left text-sm font-semibold ${route === r.id ? 'bg-wine text-white' : 'text-wine hover:bg-blush'}`}
              >
                {r.label}
              </button>
            ))}
            <button className="btn-primary mt-2" onClick={() => nav('discover')}>
              <Heart size={15} /> Find My Friends
            </button>
          </div>
        </nav>
      )}
    </header>
  );
}

export default function App() {
  const [route, go] = useHashRoute();
  const { toast } = useApp();

  return (
    <div className="min-h-screen">
      <Nav route={route} go={go} />
      <main>
        {route === 'home' && <Home go={go} />}
        {route === 'discover' && <Discover />}
        {route === 'graph' && <GraphPage />}
        {route === 'communities' && <Communities />}
        {route === 'lab' && <Lab />}
        {route === 'about' && <About />}
      </main>
      <footer className="border-t border-rose/30 bg-white/60 py-6 text-center text-xs text-wine/70">
        Bondly — Find Your Circle · “Every friendship begins with a connection.” · Demo project: all data is fictional and local.
      </footer>
      <ProfileModal />
      <SuggestModal />
      {toast && (
        <div className="fixed bottom-5 left-1/2 z-[60] w-[92%] max-w-md -translate-x-1/2 animate-pop rounded-2xl bg-burgundy px-4 py-3 text-sm font-medium text-white shadow-soft" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}
