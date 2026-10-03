import { useState, useEffect } from 'react';
import { calculateDistance, bearingTo, toCardinal } from './geo.js';
import { cacheCount, clearTiles } from './tiles.js';

const G = {
  tr: {
    target: 'HEDEF NOKTASI', none: 'Henüz hedef yok. Aracını, kampını ya da dönüş noktanı işaretle.',
    markHere: '📍 Buradayım, işaretle', toStart: '🏁 Başlangıcı hedef yap',
    coords: 'enlem, boylam (37.86, 27.26)', set: 'AYARLA', clear: 'Sil',
    bad: 'Koordinat okunamadı. Örnek: 37.8605, 27.2606', noFix: 'Konum alınamadı, konum iznini kontrol et.',
    needStart: 'Canlı mesafe için BAŞLAT\'a bas', bearing: 'YÖN',
    arrowHeading: 'Ok, gittiğin yöne göre döner.', arrowNorth: 'Ok, kuzeye göre. Yürümeye başlayınca gittiğin yöne göre döner.',
    goalTitle: 'MESAFE HEDEFİ', goalNone: 'Hedef km yaz, ilerleme çubuğu canlı ekranda görünsün.', goalPh: 'km (ör. 5)',
    remain: 'kalan', cacheTitle: 'HARİTA ÖNBELLEĞİ', tiles: 'karo kayıtlı', clearCache: 'Önbelleği sil',
    cacheInfo: 'Haritada gezdiğin yerler cihaza kaydedilir ve internet yokken gösterilir. Yola çıkmadan önce bölgeyi internetle bir gez. (Toplu indirme yok: OpenStreetMap kuralları buna izin vermiyor.)',
  },
  en: {
    target: 'TARGET POINT', none: 'No target yet. Mark your car, camp or turn-back point.',
    markHere: '📍 I am here, mark it', toStart: '🏁 Set start as target',
    coords: 'lat, lon (37.86, 27.26)', set: 'SET', clear: 'Clear',
    bad: 'Could not read coordinates. Example: 37.8605, 27.2606', noFix: 'Could not get location, check location permission.',
    needStart: 'Press START for live distance', bearing: 'BEARING',
    arrowHeading: 'The arrow turns relative to your walking direction.', arrowNorth: 'Arrow is relative to north. It follows your direction once you move.',
    goalTitle: 'DISTANCE GOAL', goalNone: 'Enter a goal in km to see a progress bar on the live screen.', goalPh: 'km (e.g. 5)',
    remain: 'left', cacheTitle: 'MAP CACHE', tiles: 'tiles saved', clearCache: 'Clear cache',
    cacheInfo: 'Areas you view on the map are saved on the device and shown when offline. Browse the area online before you set out. (No bulk download: OpenStreetMap rules do not allow it.)',
  },
};

const fmt = (m) => (m >= 1000 ? `${(m / 1000).toFixed(2)} km` : `${Math.round(m)} m`);

export default function Goal({ lang, live, position, heading, distance, start, target, setTarget, goalKm, setGoalKm }) {
  const g = G[lang];
  const [input, setInput] = useState('');
  const [km, setKm] = useState(goalKm ? String(goalKm) : '');
  const [msg, setMsg] = useState('');
  const [cached, setCached] = useState(0);

  useEffect(() => { cacheCount().then(setCached); }, []);

  const markHere = () => {
    if (!('geolocation' in navigator)) { setMsg(g.noFix); return; }
    navigator.geolocation.getCurrentPosition(
      (p) => { setTarget({ lat: p.coords.latitude, lon: p.coords.longitude }); setMsg(''); },
      () => setMsg(g.noFix),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const fromInput = () => {
    const m = input.match(/(-?\d+(?:\.\d+)?)[\s,;]+(-?\d+(?:\.\d+)?)/);
    const lat = m ? parseFloat(m[1]) : NaN;
    const lon = m ? parseFloat(m[2]) : NaN;
    if (!m || Math.abs(lat) > 90 || Math.abs(lon) > 180) { setMsg(g.bad); return; }
    setTarget({ lat, lon });
    setInput('');
    setMsg('');
  };

  const dist = target ? calculateDistance(position[0], position[1], target.lat, target.lon) : 0;
  const brg = target ? bearingTo(position[0], position[1], target.lat, target.lon) : 0;
  const rot = brg - (heading ?? 0);

  return (
    <div className="stats-view">
      <div className="record">
        <div className="record-date">🎯 {g.target}</div>
        {target ? (
          <div className="target-row">
            <span className="arrow" style={{ transform: `rotate(${rot}deg)` }}>⬆</span>
            <div>
              <div className="big-dist">{live ? fmt(dist) : '—'}</div>
              <div className="hint">{live ? `${g.bearing} ${Math.round(brg)}° ${toCardinal(brg)}` : g.needStart}</div>
              <div className="hint">{heading == null ? g.arrowNorth : g.arrowHeading}</div>
            </div>
          </div>
        ) : (
          <div className="empty">{g.none}</div>
        )}
        <div className="btn-row">
          <button className="mini-btn" onClick={markHere}>{g.markHere}</button>
          <button className="mini-btn" disabled={!start} onClick={() => setTarget({ lat: start[0], lon: start[1] })}>{g.toStart}</button>
        </div>
        <div className="btn-row">
          <input className="goal-input" value={input} onChange={(e) => setInput(e.target.value)} placeholder={g.coords} />
          <button className="mini-btn" onClick={fromInput}>{g.set}</button>
        </div>
        {msg && <div className="msg">{msg}</div>}
        {target && <button className="del-btn" onClick={() => setTarget(null)}>{g.clear}</button>}
      </div>

      <div className="record">
        <div className="record-date">🏁 {g.goalTitle}</div>
        {goalKm ? (
          <>
            <div className="big-dist">{distance.toFixed(2)} / {goalKm} km</div>
            <div className="hint">{g.remain}: {Math.max(0, goalKm - distance).toFixed(2)} km · %{Math.min(100, Math.round((distance / goalKm) * 100))}</div>
          </>
        ) : (
          <div className="empty">{g.goalNone}</div>
        )}
        <div className="btn-row">
          <input className="goal-input" value={km} inputMode="decimal" onChange={(e) => setKm(e.target.value)} placeholder={g.goalPh} />
          <button className="mini-btn" onClick={() => { const v = parseFloat(km.replace(',', '.')); setGoalKm(v > 0 ? v : null); }}>{g.set}</button>
        </div>
        {goalKm && <button className="del-btn" onClick={() => { setGoalKm(null); setKm(''); }}>{g.clear}</button>}
      </div>

      <div className="record">
        <div className="record-date">🗺️ {g.cacheTitle}</div>
        <div className="big-dist">{cached} <span className="hint">{g.tiles}</span></div>
        <div className="hint">{g.cacheInfo}</div>
        <button className="del-btn" onClick={() => clearTiles().then(() => setCached(0))}>{g.clearCache}</button>
      </div>
    </div>
  );
}
