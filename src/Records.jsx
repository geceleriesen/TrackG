import { useState } from 'react';
import { formatTime } from './geo.js';

const R = {
  tr: {
    total: 'KAYIT', none: 'Henüz kayıt yok. BAŞLAT ile kaydı başlat, STOP ile bitir; burada listelenir.',
    back: '← KAYITLAR', dist: 'YOL', time: 'SÜRE', avg: 'ORT HIZ', max: 'MAKS HIZ', pace: 'TEMPO',
    start: 'BAŞLANGIÇ', end: 'BİTİŞ', points: 'NOKTA', del: 'Kaydı sil', confirm: 'Bu kayıt silinsin mi?',
    name: 'Kayda isim ver', save: 'KAYDET', locale: 'tr-TR',
  },
  en: {
    total: 'RECORDS', none: 'No recordings yet. Press START, then STOP; it will be listed here.',
    back: '← RECORDS', dist: 'DIST', time: 'TIME', avg: 'AVG SPEED', max: 'MAX SPEED', pace: 'PACE',
    start: 'STARTED', end: 'ENDED', points: 'POINTS', del: 'Delete recording', confirm: 'Delete this recording?',
    name: 'Name this recording', save: 'SAVE', locale: 'en-GB',
  },
};

const avg = (km, s) => (s > 0 ? km / (s / 3600) : 0);
const pace = (km, s) => {
  if (km <= 0) return '—';
  const total = Math.round(s / km);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')} /km`;
};

// Kaydedilen yolu küçük bir çizim olarak gösterir (kuzey yukarı)
function RouteSvg({ path, size, big }) {
  const style = big ? { width: '100%', height: 200 } : { width: size, height: size };
  if (!path || path.length < 2) return <div className="route-empty" style={style} />;
  const lat0 = path.reduce((a, p) => a + p[0], 0) / path.length;
  const k = Math.cos((lat0 * Math.PI) / 180);
  const xy = path.map((p) => [p[1] * k, -p[0]]);
  const xs = xy.map((a) => a[0]);
  const ys = xy.map((a) => a[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const span = Math.max(maxX - minX, maxY - minY, 1e-6);
  const sc = 84 / span;
  const px = (x) => 50 + (x - (minX + maxX) / 2) * sc;
  const py = (y) => 50 + (y - (minY + maxY) / 2) * sc;
  const pts = xy.map((a) => `${px(a[0])},${py(a[1])}`);
  const [sx, sy] = pts[0].split(',');
  const [ex, ey] = pts[pts.length - 1].split(',');
  const r = big ? 2.5 : 4;
  return (
    <svg viewBox="0 0 100 100" style={style} preserveAspectRatio="xMidYMid meet" className="route-svg">
      <polyline points={pts.join(' ')} fill="none" stroke="#00ff66" strokeWidth={big ? 3 : 2} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <rect x={sx - r} y={sy - r} width={r * 2} height={r * 2} fill="#fff" />
      <circle cx={ex} cy={ey} r={r} fill="#fb923c" />
    </svg>
  );
}

export default function Records({ lang, records, onDelete, onRename }) {
  const r = R[lang];
  const [openId, setOpenId] = useState(null);
  const [name, setName] = useState('');

  const fmtDate = (ms) => new Date(ms).toLocaleString(r.locale, { dateStyle: 'medium', timeStyle: 'short' });
  const titleOf = (x) => x.name || fmtDate(x.startedAt ?? Date.parse(x.date));
  const confirmDelete = (id) => {
    if (window.confirm(r.confirm)) { onDelete(id); setOpenId(null); }
  };

  const rec = records.find((x) => x.id === openId);

  if (rec) {
    const cells = [
      [r.dist, `${rec.distance.toFixed(2)} km`],
      [r.time, formatTime(rec.seconds)],
      [r.avg, `${avg(rec.distance, rec.seconds).toFixed(1)} km/h`],
      [r.max, `${rec.maxSpeed} km/h`],
      [r.pace, pace(rec.distance, rec.seconds)],
      [r.points, String(rec.path?.length ?? 0)],
      [r.start, rec.startedAt ? fmtDate(rec.startedAt) : '—'],
      [r.end, fmtDate(Date.parse(rec.date))],
    ];
    return (
      <div className="stats-view">
        <button className="back-btn" onClick={() => setOpenId(null)}>{r.back}</button>
        <div className="record">
          <div className="rec-title">{titleOf(rec)}</div>
          <RouteSvg path={rec.path} big />
          <div className="detail-grid">
            {cells.map(([label, value]) => (
              <span key={label}>{label}<b>{value}</b></span>
            ))}
          </div>
          <div className="btn-row">
            <input className="goal-input" value={name} onChange={(e) => setName(e.target.value)} placeholder={r.name} maxLength={40} />
            <button className="mini-btn" onClick={() => onRename(rec.id, name.trim())}>{r.save}</button>
          </div>
          <button className="del-btn" onClick={() => confirmDelete(rec.id)}>🗑 {r.del}</button>
        </div>
      </div>
    );
  }

  const totalKm = records.reduce((a, x) => a + x.distance, 0);
  const totalSec = records.reduce((a, x) => a + x.seconds, 0);

  return (
    <div className="stats-view">
      <div className="sum-bar">
        <span><b>{records.length}</b>{r.total}</span>
        <span><b>{totalKm.toFixed(1)}</b>km</span>
        <span><b>{formatTime(totalSec)}</b>{r.time}</span>
      </div>
      {records.length === 0 && <p className="empty">{r.none}</p>}
      {records.map((x) => (
        <div className="rec-row" key={x.id}>
          <button className="rec-open" onClick={() => { setOpenId(x.id); setName(x.name || ''); }}>
            <RouteSvg path={x.path} size={56} />
            <div className="rec-main">
              <div className="rec-title">{titleOf(x)}</div>
              <div className="rec-sub">{x.distance.toFixed(2)} km · {formatTime(x.seconds)}</div>
            </div>
            <div className="rec-avg">{avg(x.distance, x.seconds).toFixed(1)}<small>km/h</small></div>
          </button>
          <button className="rec-del" onClick={() => confirmDelete(x.id)} aria-label={r.del}>🗑</button>
        </div>
      ))}
    </div>
  );
}
