import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';

// GPS "±X metre şaşabilirim" derse ve X bundan büyükse o okumayı yok sayarız
const MAX_ACCURACY_M = 30;
// Bu kadar metreden az hareketi "yürüdün" saymayız (GPS titremesi)
const MIN_MOVE_M = 5;

// Mesafe Hesaplama (Haversine Formülü - Metre cinsinden)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Dünya yarıçapı (metre)
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Derece -> yön kısaltması (ör. 245 -> SW)
function toCardinal(deg) {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(deg / 45) % 8];
}

function formatTime(totalSeconds) {
  const hrs = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const mins = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const secs = String(totalSeconds % 60).padStart(2, '0');
  return `${hrs}:${mins}:${secs}`;
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

  const watchIdRef = useRef(null);
  const lastPosRef = useRef(null);
  // GPS callback'i bir kez kurulur ve eski state'i görür.
  // Bu yüzden "duraklatıldı mı?" bilgisini ref ile canlı tutuyoruz.
  const isPausedRef = useRef(false);

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

  // Kronometre Süre Sayacı
  useEffect(() => {
    if (!isTracking || isPaused) return;
    const id = setInterval(() => setSeconds((prev) => prev + 1), 1000);
    return () => clearInterval(id);
  }, [isTracking, isPaused]);

  // Uygulama kapanırken GPS dinlemeyi bırak
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
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

    if (gpsAltitude !== null) setAltitude(Math.round(gpsAltitude));
    if (gpsHeading !== null && !Number.isNaN(gpsHeading)) setHeading(Math.round(gpsHeading));

    // m/s -> km/h çevirisi
    setSpeed(gpsSpeed ? Math.round(gpsSpeed * 3.6) : 0);

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

  const startTracking = () => {
    if (!('geolocation' in navigator)) {
      alert('Cihazınızda GPS desteği bulunamadı!');
      return;
    }

    // Yeni takip: eski rotayı ve sayaçları temizle
    setPath([]);
    setDistance(0);
    setSeconds(0);
    setSpeed(0);
    lastPosRef.current = null;
    isPausedRef.current = false;

    setIsTracking(true);
    setIsPaused(false);
    setGpsStatus('CONNECTING...');

    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePosition,
      (err) => {
        console.error('GPS Error:', err);
        setGpsStatus(err.code === 1 ? 'PERMISSION DENIED' : 'SEARCHING GPS...');
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000,
      }
    );
  };

  const pauseTracking = () => {
    const next = !isPaused;
    isPausedRef.current = next;
    setIsPaused(next);
    // Duraklatma sırasında yürünen yol mesafeye eklenmesin
    lastPosRef.current = null;
    if (next) setSpeed(0);
  };

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    isPausedRef.current = false;
    setIsTracking(false);
    setIsPaused(false);
    setGpsStatus('STOPPED');
    setSpeed(0);
    lastPosRef.current = null;
    // Not: rota, mesafe ve süre burada KASITLI olarak silinmez,
    // bitiş sonucunu görebilesin. Bir sonraki BAŞLAT'ta sıfırlanır.
  };

  return (
    <div className="app-container">
      {/* ÜST BAŞLIK */}
      <header className="app-header">
        <h1>TrackG</h1>
        <button className="lang-btn" disabled title="Yakında">🌐 TR</button>
      </header>

      {/* SEKMELER (şimdilik sadece CANLI İZ çalışıyor) */}
      <div className="nav-tabs">
        <button className="tab active">📍 CANLI İZ</button>
        <button className="tab" disabled title="Yakında">🎯 HEDEF</button>
        <button className="tab" disabled title="Yakında">📊 İSTATİSTİK</button>
        <button className="tab" disabled title="Yakında">🗺️ HARİTA</button>
      </div>

      {/* METRİKLER PANELİ */}
      <div className="metrics-panel">
        <div className="metric-item">
          <span className="metric-label">HIZ</span>
          <span className="metric-value green">{speed} <small>km/h</small></span>
        </div>
        <div className="metric-item">
          <span className="metric-label">YOL</span>
          <span className="metric-value green">{distance.toFixed(2)} <small>km</small></span>
        </div>
        <div className="metric-item">
          <span className="metric-label">SÜRE</span>
          <span className="metric-value white">{formatTime(seconds)}</span>
        </div>
        <div className="metric-item">
          <span className="metric-label">RAKIM</span>
          <span className="metric-value blue">
            {altitude === null ? '—' : <>{altitude}<small>m</small></>}
          </span>
        </div>
      </div>

      {/* HARİTA EKRANI */}
      <div className="map-wrapper">
        <div className="compass-badge">
          PUSULA<br />
          <strong>
            {heading === null ? '—' : `${heading}° ${toCardinal(heading)}`}
          </strong>
        </div>

        <MapContainer center={position} zoom={16} scrollWheelZoom={true} className="leaflet-map">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <RecenterMap position={position} />
          <Marker position={position} icon={liveLocationIcon}>
            <Popup>Anlık Konumunuz</Popup>
          </Marker>
          <Polyline positions={path} color="#00ff66" weight={5} />
        </MapContainer>
      </div>

      {/* ALT BİLGİ ÇUBUĞU */}
      <div className="status-bar">
        <span>GPS: <strong>{gpsStatus}</strong></span>
        <span>DURUM: <strong>{isTracking ? (isPaused ? 'PAUSED' : 'TRACKING') : 'STOPPED'}</strong></span>
        <span>BAT: <strong>{batteryLevel === null ? '—' : `%${batteryLevel}`}</strong></span>
      </div>

      {/* BUTONLAR */}
      <div className="controls">
        {!isTracking ? (
          <button className="ctrl-btn start" onClick={startTracking}>▶ BAŞLAT</button>
        ) : (
          <button className="ctrl-btn pause" onClick={pauseTracking}>
            {isPaused ? '▶ DEVAM' : '⏸ PAUSE'}
          </button>
        )}
        <button className="ctrl-btn lock" disabled title="Yakında">🔒 KİLİTLE</button>
        <button className="ctrl-btn stop" onClick={stopTracking} disabled={!isTracking}>⏹ STOP</button>
      </div>
    </div>
  );
}
