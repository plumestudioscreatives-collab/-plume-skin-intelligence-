// Standalone preview entry (dist/plume-media.html). The Plume app renders PlumeMediaApp from its /media route.
import { createRoot } from 'react-dom/client';
import { PlumeMediaApp } from './App.jsx';

createRoot(document.getElementById('root')).render(<PlumeMediaApp />);
