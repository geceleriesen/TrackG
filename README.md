# TrackG

Telefonun GPS'ini kullanarak canlı konum, hız, mesafe ve süre takibi yapan,
React + Vite ile yazılmış ve Capacitor ile Android uygulamasına dönüştürülen bir projedir.

> **Durum:** geliştirme aşamasında. Şu an sadece **CANLI İZ** ekranı çalışıyor.
> HEDEF, İSTATİSTİK, HARİTA sekmeleri, dil seçimi ve KİLİTLE butonu henüz yapılmadı.

## Özellikler

- Canlı GPS takibi (hız, mesafe, süre, rakım, yön)
- OpenStreetMap üzerinde canlı rota çizimi (Leaflet)
- Başlat / Duraklat / Durdur
- Zayıf GPS sinyalini (±30 m'den kötü) ve küçük titremeleri (5 m altı) yok sayar

## Kurulum

```bash
npm install
npm run dev      # tarayıcıda dene
npm run build    # üretim derlemesi (dist/)
npm run lint
```

## Android

```bash
npm run build
npx cap sync android
npx cap open android   # Android Studio'yu açar
```

## Bilinen eksikler

- Uygulama arka plana gidince / ekran kapanınca takip durabilir (arka plan servisi yok).
- Rota kayıt edilmiyor; uygulama kapanınca kaybolur.
- Haritalar OpenStreetMap'in ücretsiz sunucusundan geliyor. Yoğun veya ticari kullanım için
  kendi/ücretli bir harita sağlayıcısına geçilmelidir.
