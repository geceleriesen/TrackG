import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Geolocation } from '@capacitor/geolocation';

// Retro OLED Neon Yeşil Konum İkonu
const neonMarkerIcon = L.divIcon({
  className: 'custom-neon-marker',
  html: `<div style="
    width: 14px;
    height: 14px;
    background-color: #00FF66;
    border: 2px solid #FFFFFF;
    border-radius: 50%;
    box-shadow: 0 0 10px #00FF66;
  "></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7]
});

// Retro Kırmızı Hedef Bayrak İkonu
const targetMarkerIcon = L.divIcon({
  className: 'custom-target-marker',
  html: `<div style="
    width: 16px;
    height: 16px;
    background-color: #FF3366;
    border: 2px solid #FFFFFF;
    border-radius: 50%;
    box-shadow: 0 0 12px #FF3366;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 10px;
    font-weight: bold;
  ">🎯</div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

function RecenterMap({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView(position);
    }
  }, [position, map]);
  return null;
}

// DİL SÖZLÜĞÜ (TR / EN)
const i18n = {
  TR: {
    liveTrack: '📍 CANLI İZ',
    target: '🎯 HEDEF',
    stats: '📊 İSTATİSTİK',
    map: '🗺️ HARİTA',
    vector: '⬛ VEKTÖR',
    speed: 'HIZ',
    distance: 'YOL',
    time: 'SÜRE',
    altitude: 'RAKIM',
    temp: 'ISI',
    compass: 'PUSULA',
    targetDist: 'HEDEFE KALAN',
    setTarget: '🎯 HEDEF KONUM BELİRLE',
    searchPlaceholder: 'Konum veya Şehir yazın...',
    searchBtn: 'ARA & HEDEFLE',
    activeTarget: 'AKTİF HEDEFİNİZ',
    cancelTarget: '❌ HEDEFİ İPTAL ET',
    noTarget: 'Şu an belirlenmiş bir hedef yok.\nYukarıdan arama yapıp hedefinize yönelebilirsiniz.',
    statsTitle: '📈 YÜKSEKLİK & SÜRÜŞ İSTATİSTİKLERİ',
    historyTitle: '💾 GEÇMİŞ SÜRÜŞ KAYITLARI',
    start: '▶ BAŞLAT',
    rec: '● REC',
    pause: '⏸ PAUSE',
    resume: '▶ RESUME',
    lock: '🔒 KİLİTLE',
    locked: '🔒 KİLİTLİ',
    unlocking: 'AÇILIYOR...',
    stop: '⏹ STOP',
    saveModalTitle: '💾 SÜRÜŞ KAYDEDİLSİN Mİ?',
    saveModalDesc: 'Sürüş kaydı sonlandırılıp İstatistik sekmesindeki geçmiş kayıtlarınıza eklenecek.',
    cancel: 'İPTAL',
    save: 'KAYDET',
    statusGps: 'GPS',
    statusState: 'DURUM',
    statusBat: 'BAT'
  },
  EN: {
    liveTrack: '📍 LIVE TRACK',
    target: '🎯 TARGET',
    stats: '📊 STATS',
    map: '🗺️ MAP',
    vector: '⬛ VECTOR',
    speed: 'SPEED',
    distance: 'DIST',
    time: 'TIME',
    altitude: 'ALT',
    temp: 'TEMP',
    compass: 'COMPASS',
    targetDist: 'TO TARGET',
    setTarget: '🎯 SET TARGET LOCATION',
    searchPlaceholder: 'Type location or city...',
    searchBtn: 'SEARCH',
    activeTarget: 'ACTIVE TARGET',
    cancelTarget: '❌ CANCEL TARGET',
    noTarget: 'No target set currently.\nSearch above to navigate to your destination.',
    statsTitle: '📈 ELEVATION & RIDE STATS',
    historyTitle: '💾 RIDE HISTORY LOGS',
    start: '▶ START',
    rec: '● REC',
    pause: '⏸ PAUSE',
    resume: '▶ RESUME',
    lock: '🔒 LOCK',
    locked: '🔒 LOCKED',
    unlocking: 'UNLOCKING...',
    stop: '⏹ STOP',
    saveModalTitle: '💾 SAVE RIDE LOG?',
    saveModalDesc: 'The ride recording will finish and be added to your Stats history.',
    cancel: 'CANCEL',
    save: 'SAVE',
    statusGps: 'GPS',
    statusState: 'STATUS',
    statusBat: 'BAT'
  }
};

export default function App() {
  // DİL SEÇİMİ (TR / EN)
  const [lang, setLang] = useState('TR');
  const t = i18n[lang];

  // Ekran Sekmeleri: map | nav | stats
  const [activeTab, setActiveTab] = useState('map');
  const [showMapTiles, setShowMapTiles] = useState(false);

  // Sürüş ve Durum Yöneticileri
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [showStopModal, setShowStopModal] = useState(false);
  const [gpsStatus, setGpsStatus] = useState('SEARCHING...');
  
  // Kilit Açma Sayacı
  const [holdProgress, setHoldProgress] = useState(0);
  const holdTimerRef = useRef(null);

  // Telemetri Verileri
  const [seconds, setSeconds] = useState(0);
  const [distance, setDistance] = useState(0);
  const [speed, setSpeed] = useState(0.0);
  const [maxSpeed, setMaxSpeed] = useState(0.0);
  const [altitude, setAltitude] = useState(120);
  const [temperature, setTemperature] = useState(20);

  // GPS Koordinat Geçmişi & Hedef Koordinatı
  const [gpsPath, setGpsPath] = useState([[37.7510, 27.4010]]);
  const [altitudeHistory, setAltitudeHistory] = useState([120]);
  const [targetLocation, setTargetLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [targetName, setTargetName] = useState('');

  // Sürüş Kayıt Geçmişi
  const [rideHistory, setRideHistory] = useState([
    {
      id: 1,
      date: '01.10.2026 - 18:30',
      distance: '14.2 km',
      duration: '00:42:15',
      avgSpeed: '20.1 km/h',
      maxSpeed: '38.5 km/h'
    }
  ]);

  // Saniye Sayacı
  useEffect(() => {
    let interval = null;
    if (isRecording && !isPaused) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRecording, isPaused]);

  // Hava Durumu Çekici
  const fetchWeather = async (lat, lng) => {
    try {
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`);
      const data = await res.json();
      if (data && data.current_weather) {
        setTemperature(Math.round(data.current_weather.temperature));
      }
    } catch (e) {
      setTemperature(20);
    }
  };

  // GPS Dinleyici
  useEffect(() => {
    let watchId = null;

    const startGpsTracking = async () => {
      try {
        watchId = await Geolocation.watchPosition(
          { enableHighAccuracy: true, timeout: 5000 },
          (position, err) => {
            if (err || !position) {
              setGpsStatus('SIMULATED (±2m)');
              runSimulation();
              return;
            }

            setGpsStatus('3D-FIX HARDWARE');
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            const currentSpeed = position.coords.speed ? (position.coords.speed * 3.6).toFixed(1) : 0.0;
            const currentAlt = position.coords.altitude ? Math.round(position.coords.altitude) : 120;

            if (isRecording && !isPaused) {
              setSpeed(currentSpeed);
              if (parseFloat(currentSpeed) > parseFloat(maxSpeed)) {
                setMaxSpeed(currentSpeed);
              }
              setAltitude(currentAlt);
              setGpsPath((prev) => [...prev, [lat, lng]]);
              setAltitudeHistory((prev) => [...prev.slice(-15), currentAlt]);
              fetchWeather(lat, lng);
            }
          }
        );
      } catch (e) {
        setGpsStatus('SIMULATED (±2m)');
        runSimulation();
      }
    };

    const runSimulation = () => {
      if (isRecording && !isPaused) {
        const simSpeed = (20 + Math.random() * 10).toFixed(1);
        setSpeed(simSpeed);
        if (parseFloat(simSpeed) > parseFloat(maxSpeed)) {
          setMaxSpeed(simSpeed);
        }
        setDistance((prev) => parseFloat((prev + 0.005).toFixed(2)));
        setAltitude((prev) => Math.round(prev + (Math.random() * 2 - 1)));
        setGpsPath((prev) => {
          const last = prev[prev.length - 1];
          return [...prev, [last[0] + 0.0001, last[1] + 0.00015]];
        });
      }
    };

    startGpsTracking();

    return () => {
      if (watchId) Geolocation.clearWatch({ id: watchId });
    };
  }, [isRecording, isPaused, maxSpeed]);

  const currentGps = gpsPath[gpsPath.length - 1];

  // Hedefe Kalan Mesafe
  const calculateDistanceToTarget = () => {
    if (!targetLocation || !currentGps) return null;
    const [lat1, lon1] = currentGps;
    const [lat2, lon2] = targetLocation;
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(2);
  };

  // Yer/Arama Yapma
  const handleSearchTarget = async () => {
    if (!searchQuery.trim()) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        setTargetLocation([lat, lon]);
        setTargetName(data[0].display_name.split(',')[0]);
        setActiveTab('map');
      } else {
        alert(lang === 'TR' ? 'Hedef konum bulunamadı!' : 'Target location not found!');
      }
    } catch (e) {
      alert(lang === 'TR' ? 'Arama hatası!' : 'Search error!');
    }
  };

  const formatTime = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const mins = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const secs = (totalSeconds % 60).toString().padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  };

  // Kilit Açma Sayacı
  const handleLockTouchStart = () => {
    if (!isLocked) {
      setIsLocked(true);
      return;
    }
    let current = 0;
    holdTimerRef.current = setInterval(() => {
      current += 10;
      setHoldProgress(current);
      if (current >= 100) {
        clearInterval(holdTimerRef.current);
        setIsLocked(false);
        setHoldProgress(0);
      }
    }, 15);
  };

  const handleLockTouchEnd = () => {
    if (holdTimerRef.current) {
      clearInterval(holdTimerRef.current);
      setHoldProgress(0);
    }
  };

  const handleStartRecord = () => {
    if (isLocked) return;
    setIsRecording(true);
    setIsPaused(false);
  };

  const togglePause = () => {
    if (isLocked || !isRecording) return;
    setIsPaused(!isPaused);
    if (!isPaused) setSpeed(0.0);
  };

  const confirmStop = () => {
    const avgSpd = seconds > 0 ? ((distance / (seconds / 3600)) || 0).toFixed(1) : '0.0';
    const newRide = {
      id: Date.now(),
      date: new Date().toLocaleString(lang === 'TR' ? 'tr-TR' : 'en-US', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      distance: `${distance} km`,
      duration: formatTime(seconds),
      avgSpeed: `${avgSpd} km/h`,
      maxSpeed: `${maxSpeed || speed} km/h`
    };

    setRideHistory([newRide, ...rideHistory]);
    setIsRecording(false);
    setIsPaused(false);
    setSpeed(0.0);
    setSeconds(0);
    setDistance(0);
    setShowStopModal(false);
    
    // Otomatik İstatistik Sekmesine Yönlendir
    setActiveTab('stats');
  };

  const targetDist = calculateDistanceToTarget();

  return (
    <div style={{
      backgroundColor: '#000000',
      color: '#FFFFFF',
      height: '100vh',
      width: '100vw',
      maxWidth: '430px',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      fontFamily: 'monospace',
      boxSizing: 'border-box',
      padding: '12px',
      border: '1px solid #222',
      position: 'relative',
      userSelect: 'none'
    }}>
      {/* 1. ŞIK VE MİNİMAL BAŞLIK: TrackG LOGO & DİL SEÇİMİ */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '6px',
        padding: '0 2px'
      }}>
        <div style={{ fontSize: '15px', fontWeight: 'bold', letterSpacing: '0.5px' }}>
          <span style={{ color: '#FFFFFF' }}>Track</span>
          <span style={{ color: '#00FF66' }}>G</span>
        </div>
        <button
          onClick={() => setLang(lang === 'TR' ? 'EN' : 'TR')}
          style={{
            backgroundColor: '#111',
            color: '#00E5FF',
            border: '1px solid #00E5FF',
            borderRadius: '4px',
            padding: '2px 8px',
            fontSize: '9px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}>
          🌐 {lang}
        </button>
      </div>

      {/* 2. ÜST SEKMELER */}
      <div style={{
        display: 'flex',
        gap: '4px',
        marginBottom: '8px',
        backgroundColor: '#111',
        padding: '4px',
        borderRadius: '8px',
        border: '1px solid #222'
      }}>
        <button
          onClick={() => setActiveTab('map')}
          style={{
            flex: 1,
            backgroundColor: activeTab === 'map' ? '#222' : 'transparent',
            color: activeTab === 'map' ? '#00FF66' : '#666',
            border: 'none',
            padding: '8px 0',
            borderRadius: '6px',
            fontWeight: 'bold',
            fontSize: '9px',
            cursor: 'pointer'
          }}>
          {t.liveTrack}
        </button>

        <button
          onClick={() => setActiveTab('nav')}
          style={{
            flex: 1,
            backgroundColor: activeTab === 'nav' ? '#222' : 'transparent',
            color: activeTab === 'nav' ? '#FF3366' : '#666',
            border: 'none',
            padding: '8px 0',
            borderRadius: '6px',
            fontWeight: 'bold',
            fontSize: '9px',
            cursor: 'pointer'
          }}>
          {t.target}
        </button>

        <button
          onClick={() => setActiveTab('stats')}
          style={{
            flex: 1,
            backgroundColor: activeTab === 'stats' ? '#222' : 'transparent',
            color: activeTab === 'stats' ? '#00E5FF' : '#666',
            border: 'none',
            padding: '8px 0',
            borderRadius: '6px',
            fontWeight: 'bold',
            fontSize: '9px',
            cursor: 'pointer'
          }}>
          {t.stats}
        </button>

        <button
          onClick={() => setShowMapTiles(!showMapTiles)}
          style={{
            flex: 1,
            backgroundColor: showMapTiles ? '#1B3322' : '#222',
            color: showMapTiles ? '#00FF66' : '#888',
            border: `1px solid ${showMapTiles ? '#00FF66' : '#333'}`,
            padding: '8px 0',
            borderRadius: '6px',
            fontWeight: 'bold',
            fontSize: '9px',
            cursor: 'pointer'
          }}>
          {showMapTiles ? t.map : t.vector}
        </button>
      </div>

      {/* 3. ÜST BİLGİ ŞERİDİ (5'Lİ DİJİTAL PANO) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1.2fr 0.9fr 0.9fr',
        gap: '4px',
        backgroundColor: '#111111',
        padding: '10px 4px',
        borderRadius: '8px',
        textAlign: 'center',
        border: '1px solid #333'
      }}>
        <div>
          <div style={{ fontSize: '8px', color: '#888' }}>{t.speed}</div>
          <div style={{ fontSize: '15px', fontWeight: 'bold', color: !isRecording ? '#666' : (isPaused ? '#FFCC00' : '#00FF66') }}>
            {speed} <span style={{ fontSize: '8px' }}>km/h</span>
          </div>
        </div>
        <div>
          <div style={{ fontSize: '8px', color: '#888' }}>{t.distance}</div>
          <div style={{ fontSize: '15px', fontWeight: 'bold' }}>{distance} <span style={{ fontSize: '8px' }}>km</span></div>
        </div>
        <div>
          <div style={{ fontSize: '8px', color: '#888' }}>{t.time}</div>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: !isRecording ? '#666' : (isPaused ? '#FFCC00' : '#FFF') }}>
            {formatTime(seconds)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '8px', color: '#888' }}>{t.altitude}</div>
          <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#00E5FF' }}>
            {altitude}<span style={{ fontSize: '8px' }}>m</span>
          </div>
        </div>
        <div>
          <div style={{ fontSize: '8px', color: '#888' }}>{t.temp}</div>
          <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#FF9900' }}>
            {temperature}°C
          </div>
        </div>
      </div>

      {/* 4. ORTA ALAN */}
      <div style={{
        flex: 1,
        margin: '10px 0',
        backgroundColor: '#050505',
        borderRadius: '12px',
        border: isLocked ? '1px solid #FF3333' : '1px solid #222',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {isLocked && (
          <div style={{
            position: 'absolute',
            top: '12px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(255, 0, 0, 0.3)',
            color: '#FF4444',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '10px',
            border: '1px solid #FF4444',
            fontWeight: 'bold',
            zIndex: 1000
          }}>
            🔒 {t.locked}
          </div>
        )}

        {/* SEKME 1: CANLI İZ */}
        {activeTab === 'map' && (
          <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <div style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              backgroundColor: 'rgba(20, 20, 20, 0.85)',
              padding: '6px 10px',
              borderRadius: '6px',
              fontSize: '11px',
              border: '1px solid #333',
              zIndex: 1000,
              textAlign: 'right'
            }}>
              <div style={{ color: '#888', fontSize: '9px' }}>{t.compass}</div>
              <div style={{ fontWeight: 'bold', color: '#FFF' }}>( N ) 245° SW</div>
              {targetLocation && (
                <div style={{ marginTop: '4px', borderTop: '1px solid #333', paddingTop: '4px' }}>
                  <div style={{ color: '#FF3366', fontSize: '9px', fontWeight: 'bold' }}>🎯 {targetName || 'HEDEF'}</div>
                  <div style={{ color: '#FF3366', fontWeight: 'bold', fontSize: '13px' }}>{targetDist} km</div>
                </div>
              )}
            </div>

            <MapContainer
              center={currentGps}
              zoom={15}
              zoomControl={false}
              style={{ width: '100%', height: '100%', backgroundColor: '#050505' }}
            >
              <RecenterMap position={currentGps} />
              
              {showMapTiles && (
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; OpenStreetMap contributors'
                />
              )}

              <Polyline
                positions={gpsPath}
                pathOptions={{ color: '#00FF66', weight: 5, opacity: 0.9 }}
              />

              <Marker position={currentGps} icon={neonMarkerIcon} />

              {targetLocation && (
                <Marker position={targetLocation} icon={targetMarkerIcon} />
              )}
            </MapContainer>
          </div>
        )}

        {/* SEKME 2: 🎯 HEDEF SEÇİMİ VE NAVİGASYON */}
        {activeTab === 'nav' && (
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', boxSizing: 'border-box' }}>
            <div style={{ fontSize: '12px', color: '#FF3366', fontWeight: 'bold' }}>
              {t.setTarget}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex: 1,
                  backgroundColor: '#111',
                  border: '1px solid #333',
                  color: '#FFF',
                  padding: '10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontFamily: 'monospace'
                }}
              />
              <button
                onClick={handleSearchTarget}
                style={{
                  backgroundColor: '#FF3366',
                  color: '#FFF',
                  border: 'none',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  fontSize: '11px',
                  cursor: 'pointer'
                }}>
                {t.searchBtn}
              </button>
            </div>

            {targetLocation ? (
              <div style={{
                backgroundColor: '#111',
                border: '1px solid #FF3366',
                borderRadius: '8px',
                padding: '14px',
                marginTop: '8px'
              }}>
                <div style={{ fontSize: '10px', color: '#888' }}>{t.activeTarget}</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#FF3366', margin: '4px 0' }}>
                  {targetName || 'Target'}
                </div>
                <div style={{ fontSize: '12px', color: '#FFF' }}>
                  {t.targetDist}: <strong style={{ color: '#00FF66' }}>{targetDist} km</strong>
                </div>
                <button
                  onClick={() => { setTargetLocation(null); setTargetName(''); }}
                  style={{
                    marginTop: '12px',
                    backgroundColor: '#221111',
                    color: '#FF4444',
                    border: '1px solid #FF4444',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}>
                  {t.cancelTarget}
                </button>
              </div>
            ) : (
              <div style={{
                backgroundColor: '#0A0A0A',
                border: '1px dashed #333',
                borderRadius: '8px',
                padding: '20px',
                textAlign: 'center',
                color: '#666',
                fontSize: '11px',
                whiteSpace: 'pre-line'
              }}>
                {t.noTarget}
              </div>
            )}
          </div>
        )}

        {/* SEKME 3: 📊 İSTATİSTİK VE SÜRÜŞ GEÇMİŞİ */}
        {activeTab === 'stats' && (
          <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px', height: '100%', boxSizing: 'border-box', overflowY: 'auto' }}>
            <div style={{ fontSize: '12px', color: '#00E5FF', fontWeight: 'bold' }}>
              {t.statsTitle}
            </div>

            <div style={{
              backgroundColor: '#0A0A0A',
              border: '1px solid #222',
              borderRadius: '8px',
              padding: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#888' }}>
                <span>MAX: {Math.max(...altitudeHistory)}m</span>
                <span>MIN: {Math.min(...altitudeHistory)}m</span>
              </div>

              <svg style={{ width: '100%', height: '70px', overflow: 'visible' }}>
                {altitudeHistory.map((val, idx) => {
                  if (idx === 0) return null;
                  const prevVal = altitudeHistory[idx - 1];
                  const min = Math.min(...altitudeHistory) - 10;
                  const max = Math.max(...altitudeHistory) + 10;
                  
                  const x1 = ((idx - 1) / (altitudeHistory.length - 1)) * 300;
                  const y1 = 60 - ((prevVal - min) / (max - min)) * 50;
                  const x2 = (idx / (altitudeHistory.length - 1)) * 300;
                  const y2 = 60 - ((val - min) / (max - min)) * 50;

                  return (
                    <line
                      key={idx}
                      x1={`${x1}`}
                      y1={`${y1}`}
                      x2={`${x2}`}
                      y2={`${y2}`}
                      stroke="#00E5FF"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  );
                })}
              </svg>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#00E5FF' }}>
                <span>ALT: {altitude} m</span>
                <span>CLIMB: +320 m</span>
              </div>
            </div>

            <div style={{ fontSize: '11px', color: '#00FF66', fontWeight: 'bold', marginTop: '4px' }}>
              {t.historyTitle} ({rideHistory.length})
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {rideHistory.map((item) => (
                <div key={item.id} style={{
                  backgroundColor: '#111',
                  border: '1px solid #222',
                  borderRadius: '6px',
                  padding: '10px',
                  fontSize: '10px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#888', marginBottom: '4px' }}>
                    <span>📅 {item.date}</span>
                    <span style={{ color: '#00FF66', fontWeight: 'bold' }}>{item.distance}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px', textAlign: 'center', color: '#DDD', marginTop: '6px' }}>
                    <div>
                      <div style={{ fontSize: '8px', color: '#666' }}>TIME</div>
                      <div>{item.duration}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '8px', color: '#666' }}>AVG</div>
                      <div>{item.avgSpeed}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '8px', color: '#666' }}>MAX</div>
                      <div style={{ color: '#FFD600' }}>{item.maxSpeed}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 5. SENSÖR STATÜSÜ */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '10px',
        color: '#666',
        padding: '0 4px 8px 4px'
      }}>
        <span>{t.statusGps}: <strong style={{ color: '#AAA' }}>{gpsStatus}</strong></span>
        <span>{t.statusState}: <strong style={{ color: !isRecording ? '#666' : (isPaused ? '#FFCC00' : '#00FF66') }}>
          {!isRecording ? 'STOPPED' : (isPaused ? 'PAUSED' : 'RECORDING')}
        </strong></span>
        <span>{t.statusBat}: <strong style={{ color: '#AAA' }}>%82</strong></span>
      </div>

      {/* 6. ALT KONTROL BUTONLARI */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr 1fr',
        gap: '6px'
      }}>
        <button 
          onClick={handleStartRecord}
          disabled={isRecording && !isPaused}
          style={{
            backgroundColor: isRecording && !isPaused ? '#003311' : '#112211',
            color: '#00FF66',
            border: '1px solid #00FF66',
            padding: '12px 0',
            borderRadius: '8px',
            fontWeight: 'bold',
            fontSize: '10px',
            cursor: isLocked ? 'not-allowed' : 'pointer',
            opacity: isLocked || (isRecording && !isPaused) ? 0.4 : 1
          }}>
          {isRecording ? t.rec : t.start}
        </button>

        <button 
          onClick={togglePause}
          disabled={!isRecording}
          style={{
            backgroundColor: isPaused ? '#332200' : '#222',
            color: isPaused ? '#FFCC00' : '#FFF',
            border: `1px solid ${isPaused ? '#FFCC00' : '#444'}`,
            padding: '12px 0',
            borderRadius: '8px',
            fontWeight: 'bold',
            fontSize: '10px',
            cursor: isLocked ? 'not-allowed' : 'pointer',
            opacity: isLocked || !isRecording ? 0.4 : 1
          }}>
          {isPaused ? t.resume : t.pause}
        </button>

        <button 
          onMouseDown={handleLockTouchStart}
          onMouseUp={handleLockTouchEnd}
          onTouchStart={handleLockTouchStart}
          onTouchEnd={handleLockTouchEnd}
          style={{
            backgroundColor: isLocked ? '#221111' : '#111',
            color: isLocked ? '#FF4444' : '#AAA',
            border: `1px solid ${isLocked ? '#FF4444' : '#444'}`,
            padding: '12px 0',
            borderRadius: '8px',
            fontWeight: 'bold',
            fontSize: '10px',
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden'
          }}>
          {holdProgress > 0 && (
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              height: '100%',
              width: `${holdProgress}%`,
              backgroundColor: 'rgba(0, 255, 102, 0.4)',
              transition: 'width 0.015s linear'
            }} />
          )}
          <span style={{ position: 'relative', zIndex: 2 }}>
            {isLocked ? (holdProgress > 0 ? t.unlocking : t.locked) : t.lock}
          </span>
        </button>

        <button 
          onClick={() => setShowStopModal(true)}
          disabled={!isRecording}
          style={{
            backgroundColor: '#221111',
            color: '#FF4444',
            border: '1px solid #FF4444',
            padding: '12px 0',
            borderRadius: '8px',
            fontWeight: 'bold',
            fontSize: '10px',
            cursor: isLocked ? 'not-allowed' : 'pointer',
            opacity: isLocked || !isRecording ? 0.4 : 1
          }}>
          {t.stop}
        </button>
      </div>

      {/* RETRO SAVE MODAL */}
      {showStopModal && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{
            backgroundColor: '#111',
            border: '1px solid #FF4444',
            padding: '20px',
            borderRadius: '12px',
            textAlign: 'center',
            maxWidth: '280px',
            boxShadow: '0 0 20px rgba(255, 68, 68, 0.2)'
          }}>
            <div style={{ color: '#FF4444', fontSize: '13px', fontWeight: 'bold', marginBottom: '10px' }}>
              {t.saveModalTitle}
            </div>
            <div style={{ color: '#888', fontSize: '11px', marginBottom: '20px' }}>
              {t.saveModalDesc}
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => setShowStopModal(false)}
                style={{
                  flex: 1,
                  backgroundColor: '#222',
                  color: '#FFF',
                  border: '1px solid #444',
                  padding: '10px 0',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}>
                {t.cancel}
              </button>
              <button 
                onClick={confirmStop}
                style={{
                  flex: 1,
                  backgroundColor: '#113311',
                  color: '#00FF66',
                  border: '1px solid #00FF66',
                  padding: '10px 0',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}>
                {t.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}