import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';

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
  const [altitude, setAltitude] = useState(120);
  const [gpsStatus, setGpsStatus] = useState("DISCONNECTED");
  const [heading, setHeading] = useState(245);
  const [batteryLevel, setBatteryLevel] = useState(82);

  const watchIdRef = useRef(null);
  const timerRef = useRef(null);
  const lastPosRef = useRef(null);

  // Mesafe Hesaplama (Haversine Formülü - Metre cinsinden)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
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
  };

  // Pil Durumu
  useEffect(() => {
    if ('getBattery' in navigator) {
      navigator.getBattery().then((battery) => {
        setBatteryLevel(Math.round(battery.level * 100));
        battery.addEventListener('levelchange', () => {
          setBatteryLevel(Math.round(battery.level * 100));
        });
      });
    }
  }, []);

  // Kronometre Süre Sayacı
  useEffect(() => {
    if (isTracking && !isPaused) {
      timerRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isTracking, isPaused]);

  // GERÇEK GERÇEK GPS TAKİBİ
  const startTracking = () => {
    if (!('geolocation' in navigator)) {
      alert('Cihazınızda GPS desteği bulunamadı!');
      return;
    }

    setIsTracking(true);
    setIsPaused(false);
    setGpsStatus('CONNECTING...');

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, speed: gpsSpeed, altitude: gpsAltitude, accuracy } = pos.coords;
        const newPos = [latitude, longitude];

        setPosition(newPos);
        setGpsStatus(`REAL (±${Math.round(accuracy)}m)`);

        if (gpsAltitude !== null) setAltitude(Math.round(gpsAltitude));
        
        // m/s -> km/h çevirisi
        const currentSpeedKmH = gpsSpeed ? Math.round(gpsSpeed * 3.6) : 0;
        setSpeed(currentSpeedKmH);

        if (!isPaused) {
          setPath((prevPath) => [...prevPath, newPos]);

          if (lastPosRef.current) {
            const d = calculateDistance(
              lastPosRef.current[0],
              lastPosRef.current[1],
              latitude,
              longitude
            );
            if (d > 2) { // 2 metreden büyük hareketleri yola ekle
              setDistance((prev) => prev + d / 1000); // Metreyi km yap
            }
          }
          lastPosRef.current = newPos;
        }
      },
      (err) => {
        console.error('GPS Error:', err);
        setGpsStatus('SEARCHING GPS...');
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000,
      }
    );
  };

  const pauseTracking = () => {
    setIsPaused(!isPaused);
  };

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
    setIsPaused(false);
    setGpsStatus('STOPPED');
    setSpeed(0);
    lastPosRef.current = null;
  };

  const formatTime = (totalSeconds) => {
    const hrs = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const mins = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const secs = String(totalSeconds % 60).padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  };

  return (
    <div className="app-container">
      {/* ÜST BAŞLIK */}
      <header className="app-header">
        <h1>TrackG</h1>
        <button className="lang-btn">🌐 TR</button>
      </header>

      {/* SEKMELER */}
      <div className="nav-tabs">
        <button className="tab active">📍 CANLI İZ</button>
        <button className="tab">🎯 HEDEF</button>
        <button className="tab">📊 İSTATİSTİK</button>
        <button className="tab">🗺️ HARİTA</button>
      </div>

      {/* METRİKLER PANELİ */}
      <div className="metrics-panel">
        <div className="metric-item">
          <span className="metric-label">HIZ</span>
          <span className="metric-value green">{speed} <small>km/h</small></span>
        </div>
        <div className="metric-item">
          <span className="metric-label">YOL</span>
          <span className="metric-value green">{distance.toFixed(1)} <small>km</small></span>
        </div>
        <div className="metric-item">
          <span className="metric-label">SÜRE</span>
          <span className="metric-value white">{formatTime(seconds)}</span>
        </div>
        <div className="metric-item">
          <span className="metric-label">RAKIM</span>
          <span className="metric-value blue">{altitude}<small>m</small></span>
        </div>
        <div className="metric-item">
          <span className="metric-label">ISI</span>
          <span className="metric-value orange">20°C</span>
        </div>
      </div>

      {/* HARİTA EKRANI */}
      <div className="map-wrapper">
        <div className="compass-badge">
          PUSULA<br />
          <strong>( N ) {heading}° SW</strong>
        </div>

        <MapContainer center={position} zoom={16} scrollWheelZoom={true} className="leaflet-map">
          <TileLayer
            attribution='&copy; OpenStreetMap'
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
        <span>BAT: <strong>%{batteryLevel}</strong></span>
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
        <button className="ctrl-btn lock">🔒 KİLİTLE</button>
        <button className="ctrl-btn stop" onClick={stopTracking}>⏹ STOP</button>
      </div>
    </div>
  );
}