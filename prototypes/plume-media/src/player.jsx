// Video player. Catalog films in this prototype have no video file, so the player
// says so instead of pretending to play. A file the viewer picks in Studio plays
// locally from their own device.
import { useState, useRef } from 'react';
import { Art } from './art.jsx';
import { Icon, IconButton, Notice } from './ui.jsx';

export function Player({ title, art, duration, captions = [], transcript, src, upcoming, premieres }) {
  const [cc, setCc] = useState(false);
  const [ccLang, setCcLang] = useState(captions[0] || '');
  const [showTx, setShowTx] = useState(false);
  const [notice, setNotice] = useState(false);
  const [q, setQ] = useState('');
  const [failed, setFailed] = useState(false);
  const videoRef = useRef(null);
  const hasFile = !!src && !failed;
  const lines = transcript || [];
  const shown = q ? lines.filter((l) => (l[1] + ' ' + l[2]).toLowerCase().includes(q.toLowerCase())) : lines;

  return (
    <div className="player-wrap">
      <div className="player">
        {hasFile ? (
          <video ref={videoRef} src={src} controls playsInline preload="metadata" onError={() => setFailed(true)} aria-label={title} />
        ) : (
          <>
            <Art spec={art} ratio="16 / 9" pos="right" />
            <div className="player-shade" />
            {upcoming ? (
              <div className="player-center"><span className="player-premiere"><Icon name="calendar" size={18} />Premieres {premieres}</span></div>
            ) : (
              <div className="player-center">
                <button type="button" className="big-play" aria-label={'Play ' + title} onClick={() => setNotice(true)}><Icon name="play" size={30} /></button>
              </div>
            )}
            {notice && (
              <div className="player-notice" role="status">
                <strong>No video file in this preview</strong>
                <p>“{title}” is sample content, so there’s nothing to stream. In production, Plume TV plays films from a video service with captions and, where needed, protected playback.</p>
                <button type="button" className="btn btn-pb btn-sm" onClick={() => setNotice(false)}>Close</button>
              </div>
            )}
            {cc && !notice && (
              <div className="caption-sample"><span>{lines[0] ? lines[0][2] : 'Captions will appear here, in the style shown.'}</span><em>Caption style preview · {ccLang || 'English'}</em></div>
            )}
          </>
        )}
      </div>
      {!hasFile && (
        <div className="player-bar">
          <IconButton icon="play" label={upcoming ? 'Not yet available' : 'Play'} onClick={() => !upcoming && setNotice(true)} disabled={upcoming} />
          <span className="player-time">0:00 / {duration}</span>
          <div className="scrub" aria-hidden="true"><span /></div>
          {captions.length > 0 ? (
            <>
              <IconButton icon="cc" label={cc ? 'Turn captions off' : 'Turn captions on'} pressed={cc} className={cc ? 'is-on' : ''} onClick={() => setCc(!cc)} />
              {captions.length > 1 && (
                <label className="sr-only" htmlFor={'cc-' + title}>Caption language</label>
              )}
              {captions.length > 1 && (
                <select id={'cc-' + title} className="cc-select" value={ccLang} onChange={(e) => { setCcLang(e.target.value); setCc(true); }}>
                  {captions.map((c) => <option key={c}>{c}</option>)}
                </select>
              )}
            </>
          ) : <span className="player-flag">No captions yet</span>}
          <IconButton icon="transcript" label={showTx ? 'Hide transcript' : 'Show transcript'} pressed={showTx} className={showTx ? 'is-on' : ''} onClick={() => setShowTx(!showTx)} />
        </div>
      )}
      {showTx && (
        <div className="transcript" aria-label="Transcript">
          {lines.length ? (
            <>
              <div className="tx-head">
                <strong>Transcript</strong>
                <label className="sr-only" htmlFor={'tx-q-' + title}>Search transcript</label>
                <input id={'tx-q-' + title} type="search" placeholder="Search transcript" value={q} onChange={(e) => setQ(e.target.value)} />
              </div>
              <ol>
                {shown.map((l, i) => (
                  <li key={i}><span className="tx-time">{l[0]}</span><span className="tx-who">{l[1]}</span><span>{l[2]}</span></li>
                ))}
                {!shown.length && <li className="muted">No lines match “{q}”.</li>}
              </ol>
              <p className="meta">Excerpt for the prototype. Selecting a line would jump to that moment in a real player.</p>
            </>
          ) : (
            <Notice tone="info" title="No transcript yet">The creator hasn’t added a transcript for this film. Creators can upload one from Studio.</Notice>
          )}
        </div>
      )}
    </div>
  );
}
