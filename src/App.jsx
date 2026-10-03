import { useState, useEffect, useRef } from 'react';
import { MapContainer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';
import { calculateDistance, toCardinal, formatTime, startWatch } from './geo.js';
import { CachedTiles } from './tiles.js';
import Goal from './Goal.jsx';
import Records from './Records.jsx';

// GPS "±X metre şaşabilirim" derse ve X bundan büyükse o okumayı yok sayarız
const MAX_ACCURACY_M = 30;
// Bu kadar metreden az hareketi "yürüdün" saymayız (GPS titremesi)
const MIN_MOVE_M = 5;

const TEXT = {
  tr: { live: '📍 CANLI İZ', goal: '🎯 HEDEF', stats: '📊 İSTATİSTİK', map: '🗺️ HARİTA', speed: 'HIZ', dist: 'YOL', time: 'SÜRE', alt: 'RAKIM', avg: 'ORT', temp: 'ISI', hold: 'BASILI TUT', max: 'MAKS', compass: 'PUSULA', here: 'Anlık Konumunuz', state: 'DURUM', start: '▶ BAŞLAT', pause: '⏸ PAUSE', resume: '▶ DEVAM', stop: '⏹ STOP', lock: '🔒 KİLİTLE', soon: 'Yakında', offline: 'İNTERNET YOK: KAYIT MODU', viewMap: 'HARİTA', viewTrail: 'VEKTÖR', offlineSub: 'Harita kapalı, iz çiziliyor ve kayıt devam ediyor', toStart: 'BAŞLANGICA', toTarget: 'HEDEFE', backOn: '↩ GERİ DÖN', backOff: '✕ GERİ DÖNÜŞÜ KAPAT', backLeft: 'İZ ÜZERİNDEN', offTrail: 'İZDEN SAPMA', dir: 'YÖN', arrived: '🏁 BAŞLANGIÇ NOKTASINDASIN', bg: { title: 'TrackG kayıt yapıyor', message: "Durdurmak için uygulamaya dön ve STOP'a bas", permission: 'Konum izni gerekli. Ayarlar açılsın mı?' }, noTrack: 'İz, BAŞLAT\'a basınca burada çizilir', noGps: 'Cihazınızda GPS desteği bulunamadı!', none: 'Henüz kayıt yok. BAŞLAT ile bir kayıt yapıp STOP\'a bas.', del: 'Sil', recs: 'KAYITLAR', tracking: 'RECORDING', paused: 'PAUSED', stopped: 'STOPPED' },
  en: { live: '📍 LIVE', goal: '🎯 GOAL', stats: '📊 STATS', map: '🗺️ MAP', speed: 'SPEED', dist: 'DIST', time: 'TIME', alt: 'ALT', avg: 'AVG', temp: 'TEMP', hold: 'HOLD', max: 'MAX', compass: 'COMPASS', here: 'Your location', state: 'STATE', start: '▶ START', pause: '⏸ PAUSE', resume: '▶ RESUME', stop: '⏹ STOP', lock: '🔒 LOCK', soon: 'Coming soon', offline: 'NO INTERNET: RECORDER MODE', viewMap: 'MAP', viewTrail: 'VECTOR', offlineSub: 'Map is off, drawing your trail and recording', toStart: 'TO START', toTarget: 'TO TARGET', backOn: '↩ GO BACK', backOff: '✕ STOP GOING BACK', backLeft: 'ALONG TRAIL', offTrail: 'OFF TRAIL', dir: 'BEARING', arrived: '🏁 YOU ARE AT THE START', bg: { title: 'TrackG is recording', message: 'Open the app and press STOP to finish', permission: 'Location permission is required. Open settings?' }, noTrack: 'Your trail appears here after START', noGps: 'GPS is not supported on this device!', none: 'No recordings yet. Press START, then STOP to save one.', del: 'Delete', recs: 'RECORDINGS', tracking: 'RECORDING', paused: 'PAUSED', stopped: 'STOPPED' },
};

function load(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* dolu/kapalı: sessizce geç */ }
}
// Ortalama hız (km/h) = toplam km / toplam saat
const avgSpeed = (km, sec) => (sec > 0 ? km / (sec / 3600) : 0);

const fmtM = (m) => (m >= 1000 ? `${(m / 1000).toFixed(2)} km` : `${Math.round(m)} m`);

// Vektör görünümü: siyah zemin üzerinde yürünen izi çizer (kuzey hep yukarı).
// back: "GERİ DÖN" açıldığı andaki iz kopyası; kendi izini tersten takip ettirir.
function OfflineTrack({ path, position, target, back, t }) {
  const k = Math.cos((position[0] * Math.PI) / 180);
  // Metre cinsinden düz koordinat: x = doğu, y = kuzey (şu anki konum merkez)
  const toXY = (p) => [(p[1] - position[1]) * 111320 * k, (p[0] - position[0]) * 110540];
  const pts = path.map(toXY);
  const bpts = back ? back.map(toXY) : null;
  const dest = target ? toXY([target.lat, target.lon]) : null;
  const all = [...pts, ...(bpts || []), [0, 0], ...(dest ? [dest] : [])];
  const xs = all.map((a) => a[0]);
  const ys = all.map((a) => a[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const span = Math.max(maxX - minX, maxY - minY, 60); // en az 60 m görünsün
  const W = 300, pad = 34, scale = (W - 2 * pad) / span;
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
  const sx = (x) => W / 2 + (x - cx) * scale;
  const sy = (y) => W / 2 - (y - cy) * scale;
  const line = (arr) => arr.map((a) => `${sx(a[0])},${sy(a[1])}`).join(' ');

  const steps = [10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000];
  const bar = [...steps].reverse().find((n) => n <= span / 2.5) || 10;
  const start = pts[0];

  // GERİ DÖN: izin en yakın noktasını bul, oradan başlangıca kadar tersten yürüt
  let nav = null;
  if (bpts && bpts.length > 1) {
    const d = bpts.map((a) => Math.hypot(a[0], a[1]));
    let ni = 0;
    d.forEach((v, i) => { if (v < d[ni]) ni = i; });
    let wi = ni;
    while (wi > 0 && d[wi] < 15) wi--; // titremesin diye en az 15 m ilerideki iz noktası hedef
    let remain = d[ni];
    for (let i = ni; i > 0; i--) remain += Math.hypot(bpts[i][0] - bpts[i - 1][0], bpts[i][1] - bpts[i - 1][1]);
    const wp = bpts[wi];
    nav = { ni, wp, off: d[ni], remain, bearing: ((Math.atan2(wp[0], wp[1]) * 180) / Math.PI + 360) % 360, arrived: remain < 15 };
  }
  const goal = nav ? null : dest || start; // kesikli çizgi hedefe (yoksa başlangıca) gider
  const goalM = goal ? Math.hypot(goal[0], goal[1]) : null;

  return (
    <>
      <svg className="track-svg" viewBox={`0 0 ${W} ${W}`} preserveAspectRatio="xMidYMid meet">
        {nav && nav.ni > 0 && (
          <polyline fill="none" stroke="#fb923c" strokeWidth="8" strokeOpacity="0.85" strokeLinejoin="round" strokeLinecap="round"
            points={line(bpts.slice(0, nav.ni + 1))} />
        )}
        {pts.length > 1 && (
          <polyline fill="none" stroke="#00ff66" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" points={line(pts)} />
        )}
        {goal && <line x1={sx(0)} y1={sy(0)} x2={sx(goal[0])} y2={sy(goal[1])} stroke="#fb923c" strokeWidth="1.5" strokeDasharray="4 4" />}
        {nav && !nav.arrived && <line x1={sx(0)} y1={sy(0)} x2={sx(nav.wp[0])} y2={sy(nav.wp[1])} stroke="#fff" strokeWidth="2" strokeDasharray="5 4" />}
        {start && <rect x={sx(start[0]) - 5} y={sy(start[1]) - 5} width="10" height="10" fill="#fff" />}
        {dest && <path d={`M${sx(dest[0])} ${sy(dest[1]) - 9} l9 9 l-9 9 l-9 -9 z`} fill="#fb923c" stroke="#fff" strokeWidth="2" />}
        <circle cx={sx(0)} cy={sy(0)} r="8" fill="#00ff66" stroke="#fff" strokeWidth="2" />
        <text x="22" y="24" fill="#fff" fontSize="14" fontWeight="700" textAnchor="middle">N</text>
        <path d="M22 30 l-6 14 h12 z" fill="#fff" />
        <line x1="16" y1={W - 16} x2={16 + bar * scale} y2={W - 16} stroke="#8b95a5" strokeWidth="3" />
        <text x="16" y={W - 22} fill="#8b95a5" fontSize="11">{bar >= 1000 ? `${bar / 1000} km` : `${bar} m`}</text>
      </svg>
      <div className="track-info">
        {nav ? (
          nav.arrived ? (
            <span className="arrived">{t.arrived}</span>
          ) : (
            <>
              <span>{t.backLeft}<b>{fmtM(nav.remain)}</b></span>
              <span>{t.offTrail}<b className={nav.off > 30 ? 'warn' : ''}>{fmtM(nav.off)}</b></span>
              <span>{t.dir}<b>{Math.round(nav.bearing)}° {toCardinal(nav.bearing)}</b></span>
            </>
          )
        ) : goal ? (
          <span>{dest ? t.toTarget : t.toStart}<b>{fmtM(goalM)}</b></span>
        ) : (
          <span>{t.noTrack}</span>
        )}
      </div>
    </>
  );
}

// Haritayı kullanıcının canlı konumuna odaklayan bileşen
function RecenterMap({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView(position, map.getZoom());
    }
  }, [position, map]);
  return null;
}

// Özel Yeşil Canlı İkon
const liveLocationIcon = new L.DivIcon({
  className: 'custom-live-icon',
  html: `<div style="
    width: 20px;
    height: 20px;
    background-color: #00ff66;
    border: 3px solid #ffffff;
    border-radius: 50%;
    box-shadow: 0 0 12px #00ff66;
  "></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

// Hedef noktası: turuncu elmas
const targetIcon = new L.DivIcon({
  className: 'custom-live-icon',
  html: '<div style="width:16px;height:16px;background:#fb923c;border:2px solid #fff;transform:rotate(45deg)"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

export default function App() {
  const [isTracking, setIsTracking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [position, setPosition] = useState([37.7516, 27.4052]); // Varsayılan Söke
  const [path, setPath] = useState([]);
  const [speed, setSpeed] = useState(0);
  const [distance, setDistance] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [altitude, setAltitude] = useState(null);
  const [gpsStatus, setGpsStatus] = useState('DISCONNECTED');
  const [heading, setHeading] = useState(null);
  const [batteryLevel, setBatteryLevel] = useState(null);

  const [tab, setTab] = useState('live');
  const [view, setView] = useState(navigator.onLine ? 'map' : 'trail'); // internet varken: 'map' (harita) veya 'trail' (iz)
  const [lang, setLang] = useState(() => load('trackg-lang', 'tr'));
  const [online, setOnline] = useState(navigator.onLine);
  const [records, setRecords] = useState(() => load('trackg-records', []));
  const [temp, setTemp] = useState(null);
  const [target, setTargetState] = useState(() => load('trackg-target', null));
  const [goalKm, setGoalKmState] = useState(() => load('trackg-goalkm', null));
  const [backPath, setBackPath] = useState(null); // GERİ DÖN açıkken: o anki izin kopyası
  const setTarget = (v) => { setTargetState(v); save('trackg-target', v); };
  const setGoalKm = (v) => { setGoalKmState(v); save('trackg-goalkm', v); };

  // Süre saatten hesaplanır: ekran kapalıyken zamanlayıcı yavaşlasa bile doğru kalır
  const startedAtRef = useRef(null);
  const segStartRef = useRef(null);
  const accumMsRef = useRef(0);
  const elapsedSec = () => Math.floor((accumMsRef.current + (segStartRef.current ? Date.now() - segStartRef.current : 0)) / 1000);
  const [locked, setLocked] = useState(false);
  const holdRef = useRef(null);
  const t = TEXT[lang];

  const maxSpeedRef = useRef(0);
  const watchIdRef = useRef(null);
  const lastPosRef = useRef(null);
  // GPS callback'i bir kez kurulur ve eski state'i görür.
  // Bu yüzden "duraklatıldı mı?" bilgisini ref ile canlı tutuyoruz.
  const isPausedRef = useRef(false);

  // İnternet var/yok takibi
  useEffect(() => {
    const on = () => { setOnline(true); setView('map'); };
    const off = () => { setOnline(false); setView('trail'); };
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  // ISI: internet varken Open-Meteo'dan gerçek sıcaklık (anahtar gerekmez)
  const posKey = `${position[0].toFixed(2)},${position[1].toFixed(2)}`;
  useEffect(() => {
    if (!online || !isTracking) return;
    const [lat, lon] = posKey.split(',');
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m`)
      .then((r) => r.json())
      .then((d) => setTemp(Math.round(d.current.temperature_2m)))
      .catch(() => {});
  }, [online, isTracking, posKey]);

  // KİLİTLE: kilitlemek tek dokunuş, açmak 0,8 sn basılı tutmak (cepte yanlışlıkla açılmasın)
  const lockDown = () => {
    if (!locked) { setLocked(true); return; }
    holdRef.current = setTimeout(() => setLocked(false), 800);
  };
  const lockUp = () => clearTimeout(holdRef.current);

  const toggleLang = () => {
    const next = lang === 'tr' ? 'en' : 'tr';
    setLang(next);
    save('trackg-lang', next);
  };

  // Pil Durumu (desteklenmiyorsa null kalır ve "—" gösterilir)
  useEffect(() => {
    if (!('getBattery' in navigator)) return;
    let battery;
    const update = () => setBatteryLevel(Math.round(battery.level * 100));
    navigator.getBattery().then((b) => {
      battery = b;
      update();
      battery.addEventListener('levelchange', update);
    });
    return () => {
      if (battery) battery.removeEventListener('levelchange', update);
    };
  }, []);

  // Kronometre: her saniye (ve uygulama öne gelince) saatten yeniden hesaplanır
  useEffect(() => {
    if (!isTracking || isPaused) return;
    const tick = () => setSeconds(elapsedSec());
    const id = setInterval(tick, 1000);
    document.addEventListener('visibilitychange', tick);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', tick); };
  }, [isTracking, isPaused]);

  // Uygulama kapanırken GPS dinlemeyi bırak
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        watchIdRef.current();
      }
    };
  }, []);

  const handlePosition = (pos) => {
    const {
      latitude,
      longitude,
      speed: gpsSpeed,
      altitude: gpsAltitude,
      heading: gpsHeading,
      accuracy,
    } = pos.coords;

    // Çok kötü sinyal: bu okumayı tamamen yok say (rotayı bozmasın)
    if (accuracy > MAX_ACCURACY_M) {
      setGpsStatus(`WEAK (±${Math.round(accuracy)}m)`);
      return;
    }

    const newPos = [latitude, longitude];
    setPosition(newPos);
    setGpsStatus(`REAL (±${Math.round(accuracy)}m)`);

    if (gpsAltitude != null) setAltitude(Math.round(gpsAltitude));
    if (gpsHeading != null && !Number.isNaN(gpsHeading)) setHeading(Math.round(gpsHeading));

    // m/s -> km/h çevirisi
    const kmh = gpsSpeed ? Math.round(gpsSpeed * 3.6) : 0;
    setSpeed(kmh);
    if (!isPausedRef.current && kmh > maxSpeedRef.current) maxSpeedRef.current = kmh;

    if (isPausedRef.current) return;

    if (lastPosRef.current) {
      const d = calculateDistance(
        lastPosRef.current[0],
        lastPosRef.current[1],
        latitude,
        longitude
      );
      // Küçük titremeleri sayma; ne yola ne mesafeye ekle
      if (d < MIN_MOVE_M) return;
      setDistance((prev) => prev + d / 1000); // Metreyi km yap
    }

    setPath((prevPath) => [...prevPath, newPos]);
    lastPosRef.current = newPos;
  };

  const startTracking = async () => {
    if (!('geolocation' in navigator)) {
      alert(t.noGps);
      return;
    }

    // Yeni takip: eski rotayı ve sayaçları temizle
    setPath([]);
    setBackPath(null);
    setDistance(0);
    setSeconds(0);
    setSpeed(0);
    lastPosRef.current = null;
    maxSpeedRef.current = 0;
    isPausedRef.current = false;
    accumMsRef.current = 0;
    segStartRef.current = Date.now();
    startedAtRef.current = Date.now();

    setIsTracking(true);
    setIsPaused(false);
    setGpsStatus('CONNECTING...');

    try {
      watchIdRef.current = await startWatch(
        handlePosition,
        (err) => {
          console.error('GPS Error:', err);
          setGpsStatus(err.code === 1 ? 'PERMISSION DENIED' : 'SEARCHING GPS...');
        },
        t.bg
      );
    } catch (e) {
      console.error(e);
      setGpsStatus('GPS ERROR');
    }
  };

  const pauseTracking = () => {
    const next = !isPaused;
    isPausedRef.current = next;
    if (next) {
      accumMsRef.current += Date.now() - segStartRef.current;
      segStartRef.current = null;
      setSeconds(elapsedSec());
    } else {
      segStartRef.current = Date.now();
    }
    setIsPaused(next);
    // Duraklatma sırasında yürünen yol mesafeye eklenmesin
    lastPosRef.current = null;
    if (next) setSpeed(0);
  };

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      watchIdRef.current();
      watchIdRef.current = null;
    }
    if (segStartRef.current) {
      accumMsRef.current += Date.now() - segStartRef.current;
      segStartRef.current = null;
    }
    const finalSec = Math.floor(accumMsRef.current / 1000);
    setSeconds(finalSec);
    isPausedRef.current = false;
    setIsTracking(false);
    setIsPaused(false);
    setGpsStatus('STOPPED');
    setSpeed(0);
    lastPosRef.current = null;
    // Anlamlı bir kayıtsa (en az 10 m) kaydet
    if (distance > 0 || finalSec >= 20) {
      const next = [{ id: Date.now(), date: new Date().toISOString(), startedAt: startedAtRef.current, distance, seconds: finalSec, maxSpeed: maxSpeedRef.current, path }, ...records];
      setRecords(next);
      save('trackg-records', next);
    }
    // Not: rota, mesafe ve süre burada KASITLI olarak silinmez,
    // bitiş sonucunu görebilesin. Bir sonraki BAŞLAT'ta sıfırlanır.
  };

  const deleteRecord = (id) => {
    const next = records.filter((r) => r.id !== id);
    setRecords(next);
    save('trackg-records', next);
  };

  const renameRecord = (id, name) => {
    const next = records.map((r) => (r.id === id ? { ...r, name: name || undefined } : r));
    setRecords(next);
    save('trackg-records', next);
  };

  const stateText = isTracking ? (isPaused ? t.paused : t.tracking) : t.stopped;

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>TrackG</h1>
        <button className="lang-btn" onClick={toggleLang} disabled={locked}>🌐 {lang.toUpperCase()}</button>
      </header>

      <div className="nav-tabs">
        <button className={`tab ${tab === 'live' ? 'active' : ''}`} onClick={() => setTab('live')} disabled={locked}>{t.live}</button>
        <button className={`tab ${tab === 'goal' ? 'active' : ''}`} onClick={() => setTab('goal')} disabled={locked}>{t.goal}</button>
        <button className={`tab ${tab === 'stats' ? 'active' : ''}`} onClick={() => setTab('stats')} disabled={locked}>{t.stats}</button>
        <button className={`tab toggle ${tab === 'stats' ? '' : 'on'}`} disabled={locked}
          onClick={() => { setTab('live'); setView(view === 'map' ? 'trail' : 'map'); }}>
          {view === 'map' ? `🗺️ ${t.viewMap}` : `⬛ ${t.viewTrail}`}
        </button>
      </div>

      <div className="metrics-panel">
        <div className="metric-item"><span className="metric-label">{t.speed}</span>
          <span className={`metric-value ${isTracking ? 'green' : 'dim'}`}>{speed} <small>km/h</small></span>
          <span className="metric-sub">{t.avg} {avgSpeed(distance, seconds).toFixed(1)}</span></div>
        <div className="metric-item"><span className="metric-label">{t.dist}</span>
          <span className="metric-value white">{distance.toFixed(2)} <small>km</small></span></div>
        <div className="metric-item"><span className="metric-label">{t.time}</span>
          <span className={`metric-value ${isTracking ? 'white' : 'dim'}`}>{formatTime(seconds)}</span></div>
        <div className="metric-item"><span className="metric-label">{t.alt}</span>
          <span className="metric-value blue">{altitude === null ? '—' : <>{altitude}<small>m</small></>}</span></div>
        <div className="metric-item"><span className="metric-label">{t.temp}</span>
          <span className="metric-value orange">{temp === null ? '—' : `${temp}°C`}</span></div>
      </div>

      {goalKm && tab === 'live' && (
        <div className="goal-bar">
          <i style={{ width: `${Math.min(100, (distance / goalKm) * 100)}%` }} />
          <span>{distance.toFixed(2)} / {goalKm} km</span>
        </div>
      )}

      <div className="map-wrapper">
        {tab === 'stats' ? (
          <Records lang={lang} records={records} onDelete={deleteRecord} onRename={renameRecord} />
        ) : tab === 'goal' ? (
          <Goal lang={lang} live={isTracking} position={position} heading={heading} distance={distance}
            start={path[0] || null} target={target} setTarget={setTarget} goalKm={goalKm} setGoalKm={setGoalKm} />
        ) : view === 'map' ? (
          <>
            <MapContainer center={position} zoom={16} scrollWheelZoom={true} className="leaflet-map">
              <CachedTiles />
              <RecenterMap position={position} />
              <Marker position={position} icon={liveLocationIcon}><Popup>{t.here}</Popup></Marker>
              <Polyline positions={path} color="#00ff66" weight={5} />
              {target && (
                <>
                  <Marker position={[target.lat, target.lon]} icon={targetIcon}><Popup>{t.toTarget}</Popup></Marker>
                  <Polyline positions={[position, [target.lat, target.lon]]} color="#fb923c" weight={2} dashArray="6 8" />
                </>
              )}
            </MapContainer>
          </>
        ) : (
          <div className="offline-view">
            {!online && (
              <>
                <div className="offline-title">📡 {t.offline}</div>
                <div className="offline-sub">{t.offlineSub}</div>
              </>
            )}
            <OfflineTrack path={path} position={position} target={target} back={backPath} t={t} />
          </div>
        )}
        {tab === 'live' && view === 'trail' && (path.length >= 2 || backPath) && (
          <button className={`back-chip ${backPath ? 'on' : ''}`} onClick={() => setBackPath(backPath ? null : [...path])}>
            {backPath ? t.backOff : t.backOn}
          </button>
        )}
        {tab === 'live' && (
          <div className="compass-badge">
            {t.compass}<br />
            <strong>{heading === null ? '—' : `( N ) ${heading}° ${toCardinal(heading)}`}</strong>
          </div>
        )}
      </div>

      <div className="status-bar">
        <span>GPS: <strong>{gpsStatus}</strong></span>
        <span>{t.state}: <strong>{stateText}</strong></span>
        <span>BAT: <strong>{batteryLevel === null ? '—' : `%${batteryLevel}`}</strong></span>
      </div>

      <div className="controls">
        <button className="ctrl-btn start" onClick={startTracking} disabled={locked || isTracking}>{t.start}</button>
        <button className="ctrl-btn pause" onClick={pauseTracking} disabled={locked || !isTracking}>{isPaused ? t.resume : t.pause}</button>
        <button className={`ctrl-btn lock ${locked ? 'on' : ''}`} onPointerDown={lockDown} onPointerUp={lockUp} onPointerLeave={lockUp}>
          {locked ? `🔒 ${t.hold}` : t.lock}
        </button>
        <button className="ctrl-btn stop" onClick={stopTracking} disabled={!isTracking || locked}>{t.stop}</button>
      </div>
    </div>
  );
}
