import { Capacitor, registerPlugin } from '@capacitor/core';

// Arka planda (ekran kapalıyken) konum veren eklenti. Sadece telefonda (Android) çalışır.
const BackgroundGeolocation = registerPlugin('BackgroundGeolocation');

const rad = (d) => (d * Math.PI) / 180;

// Mesafe (metre) - Haversine
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const φ1 = rad(lat1);
  const φ2 = rad(lat2);
  const Δφ = rad(lat2 - lat1);
  const Δλ = rad(lon2 - lon1);
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Bir noktadan diğerine yön (0-360°, 0 = kuzey)
export function bearingTo(lat1, lon1, lat2, lon2) {
  const φ1 = rad(lat1);
  const φ2 = rad(lat2);
  const Δλ = rad(lon2 - lon1);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

// Derece -> yön kısaltması (ör. 245 -> SW)
export function toCardinal(deg) {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(deg / 45) % 8];
}

export function formatTime(totalSeconds) {
  const hrs = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const mins = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const secs = String(totalSeconds % 60).padStart(2, '0');
  return `${hrs}:${mins}:${secs}`;
}

// Konum takibini başlatır, durdurma fonksiyonu döndürür.
// Telefonda: ön plan servisiyle (bildirim çubuğunda görünür) ekran kapalıyken de çalışır.
// Tarayıcıda: normal geolocation.
export async function startWatch(onPos, onErr, notice) {
  if (Capacitor.isNativePlatform()) {
    const id = await BackgroundGeolocation.addWatcher(
      {
        backgroundTitle: notice.title,
        backgroundMessage: notice.message,
        requestPermissions: true,
        stale: false,
        distanceFilter: 0,
      },
      (loc, error) => {
        if (error) {
          const denied = error.code === 'NOT_AUTHORIZED';
          if (denied && window.confirm(notice.permission)) BackgroundGeolocation.openSettings();
          onErr({ code: denied ? 1 : 2 });
          return;
        }
        onPos({
          coords: {
            latitude: loc.latitude,
            longitude: loc.longitude,
            accuracy: loc.accuracy,
            altitude: loc.altitude,
            speed: loc.speed,
            heading: loc.bearing,
          },
        });
      }
    );
    return () => BackgroundGeolocation.removeWatcher({ id });
  }

  const id = navigator.geolocation.watchPosition(onPos, onErr, {
    enableHighAccuracy: true,
    maximumAge: 0,
    timeout: 10000,
  });
  return () => navigator.geolocation.clearWatch(id);
}
