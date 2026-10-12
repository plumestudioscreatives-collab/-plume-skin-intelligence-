// Plume Media prototype: app root, routing and shared context.
import { ACCOUNTS } from './data.js';
import { reducer, loadState, saveState, clearSaved, selectContent, AppContext } from './store.js';
import { PreviewBar, Header, MobileTabs, Footer, Toasts } from './shell.jsx';
import { Home } from './screens/home.jsx';
import { ReadIndex, ArticleDetail } from './screens/read.jsx';
import { LearnIndex, CourseDetail, Checkout } from './screens/learn.jsx';
import { Classroom } from './screens/classroom.jsx';
import { WatchIndex, VideoDetail, SeriesDetail } from './screens/watch.jsx';
import { Channel } from './screens/channel.jsx';
import { Search } from './screens/search.jsx';
import { Collection } from './screens/collection.jsx';
import { Studio } from './screens/studio.jsx';

const { useReducer, useState, useEffect, useMemo, useRef, useCallback } = React;

const SCREENS = {
  home: Home, search: Search, channel: Channel,
  read: ReadIndex, article: ArticleDetail, preview: () => <ArticleDetail preview />,
  learn: LearnIndex, course: CourseDetail, checkout: Checkout, classroom: Classroom,
  watch: WatchIndex, video: VideoDetail, series: SeriesDetail,
  collection: Collection, studio: Studio,
};

const SECTION = {
  home: 'home', read: 'read', article: 'read', learn: 'learn', course: 'learn', checkout: 'learn', classroom: 'learn',
  watch: 'watch', video: 'watch', series: 'watch', collection: 'collection', studio: 'studio', preview: 'studio', search: 'search',
};

class ScreenBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error) { console.error(error); }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="page narrow">
        <div className="empty">
          <h3>This screen hit an error</h3>
          <p>Something in the prototype broke here. Your demo data is safe. Go back home or reset the demo from the bar at the top.</p>
          <button type="button" className="btn btn-primary" onClick={() => { this.setState({ error: null }); this.props.onHome(); }}>Go to Home</button>
        </div>
      </div>
    );
  }
}

function readFrame() {
  try { return window.localStorage.getItem('plume-media-frame') || 'desktop'; } catch (e) { return 'desktop'; }
}

function App() {
  const [state, dispatch] = useReducer(reducer, null, loadState);
  const [route, setRoute] = useState({ name: 'home', params: {} });
  const [frame, setFrameState] = useState(readFrame);
  const [toasts, setToasts] = useState([]);
  const routeRef = useRef(route);
  const scrollRef = useRef(null);

  useEffect(() => { saveState(state); }, [state]);
  useEffect(() => {
    if (frame === 'phone' && scrollRef.current) scrollRef.current.scrollTop = 0;
    else window.scrollTo(0, 0);
    const main = document.getElementById('main');
    if (main) main.focus({ preventScroll: true });
  }, [route]);

  const setFrame = (f) => { setFrameState(f); try { window.localStorage.setItem('plume-media-frame', f); } catch (e) { /* ignore */ } };
  const nav = useCallback((name, params = {}) => { const r = { name, params }; routeRef.current = r; setRoute(r); }, []);
  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const toast = useCallback((msg, action) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t.slice(-1), { id, msg, action }]);
    setTimeout(() => dismiss(id), 4600);
  }, [dismiss]);

  const content = useMemo(() => selectContent(state), [state.custom]);
  const user = state.users[state.personaId];
  const persona = ACCOUNTS[state.personaId];
  const ctx = { state, dispatch: (a) => { if (a.type === 'reset') clearSaved(); dispatch(a); }, content, user, persona, route, nav, toast, frame };

  const Screen = SCREENS[route.name] || Home;
  const section = SECTION[route.name];
  const screenKey = route.name + JSON.stringify(route.params) + state.personaId;

  return (
    <AppContext.Provider value={ctx}>
      <PreviewBar frame={frame} setFrame={setFrame} />
      <div className={'stage frame-' + frame}>
        <div className="device">
          <div className="app" ref={scrollRef}>
            <div className="shell">
              <a className="skip" href="#main" onClick={(e) => { e.preventDefault(); const m = document.getElementById('main'); m && m.focus(); }}>Skip to content</a>
              <Header section={section} />
              <main id="main" tabIndex={-1} className={'main main-' + route.name}>
                <ScreenBoundary key={screenKey} onHome={() => nav('home')}><Screen /></ScreenBoundary>
              </main>
              {route.name !== 'classroom' && <Footer />}
              <MobileTabs section={section} />
            </div>
          </div>
          <div id="overlay-root">
            <Toasts toasts={toasts} dismiss={dismiss} />
          </div>
          <div id="modal-root" />
        </div>
      </div>
    </AppContext.Provider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
