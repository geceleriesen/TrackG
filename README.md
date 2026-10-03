# 📍 TrackG

**Telefonunun GPS'iyle yürüyüş, koşu ve yol kaydı tutan Android uygulaması.**
İnternet olmasa da izini çizer, kaybolursan **izini tersten takip ettirir**. 🥾🧭

> 🚧 Uygulama test aşamasındadır. Hata bulursan ya da öneri varsa bildirmen çok işe yarar.

---

## ✨ Neler yapar?

| | Özellik |
|---|---|
| 📡 | **Canlı takip:** hız, ortalama hız, mesafe, süre, rakım, sıcaklık, pusula |
| 📱 | **Ekran kapalıyken de kayıt** devam eder (bildirim çubuğunda görünür) |
| 🖤 | **İnternet yokken** siyah "vektör" ekranında yürüdüğün izi çizer |
| ↩️ | **Geri dön:** kendi izini tersten takip ettirir, izden ne kadar saptığını söyler |
| 🎯 | **Hedef noktası** (araç, kamp, dönüş noktası) ve **mesafe hedefi** |
| 📊 | **Kayıt listesi:** tarih-saat, mesafe, süre, ortalama ve en yüksek hız, iz çizimi |
| 🗺️ | Gezdiğin harita bölgeleri cihaza kaydedilir, **internet yokken de görünür** |
| 🔒 | **Kilit:** cepte yanlışlıkla bir tuşa basılmasın |
| 🌐 | **Türkçe / İngilizce** |

---

## 📲 Kurulum

1. **APK dosyasını** telefonuna indir (veya sana gönderilen dosyayı aç).
2. Dosyaya dokun → **Yükle**.
3. Android "Bilinmeyen kaynaklardan yükleme" izni isterse **izin ver**.
4. Play Protect "güvenli değil" derse **Yine de yükle** de. (Uygulama Play Store'da değil, bu uyarı normaldir.)

> ♻️ **Güncelleme notu:** Yeni bir sürüme geçerken önce eski TrackG'yi silip yenisini kurman gerekebilir. Bu durumda **kayıtların silinir**.

---

## 🚀 İlk açılış ve izinler

Uygulama ilk açılışta senden izin ister:

| İzin | Ne için? | Ne seçmeli? |
|---|---|---|
| 📍 **Konum** | Yolunu kaydetmek için | **"Uygulamayı kullanırken"** veya **"Her zaman"**. *"Yalnızca bu seferlik"* seçersen takip yarıda kesilebilir. |
| 🔔 **Bildirim** | Kayıt sürerken çubukta "TrackG kayıt yapıyor" yazısı için | **İzin ver**. Ekran kapalıyken kaydın sürmesine yardım eder. |

---

## 🧭 Ekranı tanı

### Üstteki sayılar

| Kutu | Anlamı |
|---|---|
| ⚡ **HIZ** | Anlık hız (km/h). Altında küçük yazıyla **ORT** = ortalama hız |
| 📏 **YOL** | Toplam mesafe (km) |
| ⏱️ **SÜRE** | Geçen süre. PAUSE'dayken sayılmaz |
| ⛰️ **RAKIM** | Deniz seviyesinden yükseklik (m). GPS vermezse "—" |
| 🌡️ **ISI** | Bulunduğun yerin sıcaklığı. **İnternet gerekir**, yoksa "—" |
| 🧭 **PUSULA** (harita üstü) | Gittiğin yön. **Hareket ederken** görünür, durunca "—" olabilir |

### Alttaki durum çubuğu

| Yazı | Anlamı |
|---|---|
| **GPS: REAL (±10m)** | ✅ Sinyal var. Parantezdeki sayı, telefonun tahmini doğruluğu (küçük olması iyi) |
| **GPS: WEAK (±45m)** | ⚠️ Sinyal zayıf. Bu okumalar kaydedilmez, iz bozulmasın diye |
| **GPS: CONNECTING... / SEARCHING GPS...** | ⏳ Konum aranıyor, açık alana çıkmayı dene |
| **GPS: PERMISSION DENIED** | ❌ Konum izni yok, telefon ayarlarından ver |
| **DURUM** | RECORDING (kayıtta), PAUSED (duraklatıldı), STOPPED (durdu) |
| **BAT** | Pil yüzdesi |

### Sekmeler

| Sekme | Ne var? |
|---|---|
| 📍 **CANLI İZ** | Canlı harita ya da vektör ekranı |
| 🎯 **HEDEF** | Hedef noktası, mesafe hedefi, harita önbelleği |
| 📊 **İSTATİSTİK** | Kayıt listesi |
| 🗺️ **HARİTA** / ⬛ **VEKTÖR** | Görünümü değiştiren düğme (üstüne dokununca geçer) |

Sağ üstteki **🌐 TR / EN** düğmesi dili değiştirir.

---

## ▶️ Kayıt nasıl yapılır?

1. **▶ BAŞLAT**'a bas. Süre ve mesafe sıfırdan başlar.
2. Yürü. Ekranı kapatıp telefonu cebine koyabilirsin. 📱
3. Mola verirsen **⏸ PAUSE**'a bas. Duraklatma sırasında yürüdüğün yol ve süre sayılmaz. Devam etmek için **▶ DEVAM**.
4. Bitirince **⏹ STOP**'a bas. 🏁

> 💾 **Önemli:** Kayıt **STOP'a basınca** kaydedilir. Yürüyüşün ortasında Android uygulamayı kapatırsa o kayıt gidebilir. Yola çıkarken BAŞLAT'a, bitirince STOP'a basmayı unutma.

Çok kısa kayıtlar (hiç hareket yok ve 20 saniyeden kısa) listeye eklenmez.

**GPS titremesi nasıl ele alınır?** Telefon sabit dururken bile GPS birkaç metre oynar. TrackG bunun için 5 metreden küçük hareketleri saymaz ve doğruluğu 30 metreden kötü okumaları atar. Böylece masada dururken kilometre birikmez.

---

## 🗺️ Harita ve ⬛ Vektör görünümü

Sağ üstteki **dördüncü sekme** görünümü değiştirir:

### 🗺️ HARİTA
- Gerçek harita (OpenStreetMap) üzerinde **yeşil nokta** sensin, **yeşil çizgi** yürüdüğün yol.
- **Turuncu elmas** hedef noktandır (varsa).

### ⬛ VEKTÖR
Harita yerine siyah ekranda çizim:

| Gördüğün | Anlamı |
|---|---|
| 🟢 Yeşil çizgi | Yürüdüğün yol |
| 🟩 Yeşil nokta | Şu anki konumun |
| ⬜ Beyaz kare | Başlangıç noktan |
| 🟠 Turuncu kesik çizgi | Başlangıca (ya da hedefe) düz çizgi |
| 🔶 Turuncu elmas | Hedef noktan |
| **N** oku | Kuzey, **her zaman yukarıdadır** |
| Ölçek çubuğu | Çizimdeki mesafe (ör. 50 m) |

İnternet kesilince uygulama **kendiliğinden vektör görünümüne** geçer, internet gelince haritaya döner. İstediğin zaman düğmeyle elle de değiştirebilirsin.

---

## ↩️ Geri dön: kaybolursan

Yürüdüğün yolu **tersten takip etmeni** sağlar. İnternet gerekmez. 🧭

1. Kayıt sürerken **⬛ VEKTÖR** görünümüne geç.
2. Üstte çıkan **↩ GERİ DÖN** düğmesine bas.
3. Ekranda şunlar belirir:
   - 🔶 **Kalın turuncu çizgi:** dönüş yolun (geldiğin yol)
   - ⚪ **Beyaz kesik çizgi:** şimdi yürümen gereken bir sonraki iz noktası
   - Altta üç bilgi:

| Bilgi | Anlamı |
|---|---|
| **İZ ÜZERİNDEN** | Başlangıca kadar kalan yol, izi takip ederek |
| **İZDEN SAPMA** | İzine en yakın noktaya uzaklığın. **30 m'yi geçince kırmızı** olur |
| **YÖN** | Bir sonraki iz noktasının yönü (derece ve pusula yönü) |

4. Başlangıç noktasına varınca **"🏁 BAŞLANGIÇ NOKTASINDASIN"** yazar.
5. Kapatmak için **✕ GERİ DÖNÜŞÜ KAPAT**.

> ⚠️ **Dikkat:**
> - Geri dönüş sadece **kayda başladıktan sonra** çalışır. BAŞLAT'a basmadan kaybolursan iz yoktur.
> - Yoğun ağaç altında GPS 10-30 metre şaşabilir. Çizim "yaklaşık"tır, sapma kutusuna da bak.
> - Sesli yönlendirme yoktur, ekrana bakman gerekir.
> - Bu uygulama bir yardımcıdır, tek başına güvence değildir. Ormana ya da dağa çıkarken **yedek pil, gerçek pusula veya kâğıt harita** taşı. 🎒

---

## 🎯 Hedef sekmesi

### 📍 Hedef noktası
Gitmek ya da dönmek istediğin bir noktayı işaretle (araban, kampın, çeşme...):

| Düğme | Ne yapar? |
|---|---|
| **📍 Buradayım, işaretle** | Bulunduğun yeri hedef yapar |
| **🏁 Başlangıcı hedef yap** | Kaydın başladığı noktayı hedef yapar |
| **Koordinat kutusu** | Elle yaz ya da yapıştır: `37.8605, 27.2606` (enlem, boylam). Google Maps'te bir yere uzun basınca çıkan sayılar bu biçimdedir |

Hedefi koyduktan sonra **kalan mesafeyi, yönü (derece) ve oku** görürsün. Ok, yürümeye başlayınca **gittiğin yöne göre** döner. Canlı mesafe için kayıt açık olmalı (BAŞLAT).

### 🏁 Mesafe hedefi
"5 km yürüyeceğim" gibi bir hedef yaz. **CANLI İZ** ekranında bir **ilerleme çubuğu** (`1.20 / 5 km`) görünür.

### 🗺️ Harita önbelleği
Kaç harita parçasının cihazda kayıtlı olduğunu gösterir. İstersen **Önbelleği sil** ile temizleyebilirsin. Ayrıntısı aşağıdaki **İnternetsiz kullanım** bölümünde.

---

## 📊 Kayıtlarım (İstatistik)

**📊 İSTATİSTİK** sekmesi tüm kayıtlarını listeler.

**Üstte özet:** toplam kayıt sayısı, toplam km, toplam süre.

**Liste:** her satırda
- Sol: yürüdüğün yolun küçük çizimi (⬜ başlangıç, 🟠 bitiş)
- Orta: tarih-saat, mesafe, süre
- Sağ: ortalama hız
- En sağda **🗑** düğmesi: kaydı siler (önce sorar)

**Bir kayda dokununca detay açılır:**

| Bilgi | |
|---|---|
| 🗺️ Büyük iz çizimi | |
| 📏 Yol, ⏱️ Süre | |
| ⚡ Ortalama hız, 🚀 En yüksek hız | |
| 🏃 Tempo | kilometre başına dakika (ör. `12:30 /km`) |
| 📍 Nokta sayısı | Kaç GPS noktası kaydedildi |
| 🕐 Başlangıç ve bitiş zamanı | |
| ✏️ İsim ver | "Sabah yürüyüşü" gibi, listede görünür |
| 🗑 Sil | |

---

## 🔒 Kilit

Telefon cepteyken yanlışlıkla PAUSE ya da STOP'a basılmasın diye:

- **🔒 KİLİTLE**'ye **bir kez dokun**: kilitlenir. PAUSE, STOP, sekmeler ve dil düğmesi çalışmaz olur.
- Kilidi açmak için aynı düğmeye **yaklaşık 1 saniye basılı tut**. Tek dokunuşla açılmaz, bu bilerek böyledir.

---

## 📴 İnternetsiz kullanım

| Özellik | İnternet yokken |
|---|---|
| 📍 Konum, hız, mesafe, süre, kayıt | ✅ Çalışır (GPS internet istemez) |
| ⬛ Vektör görünümü ve ↩ Geri dön | ✅ Çalışır |
| 📊 Kayıtlar, 🎯 Hedef | ✅ Çalışır |
| 🗺️ Harita | ⚠️ Sadece **daha önce gezdiğin** yerler görünür |
| 🌡️ Sıcaklık | ❌ "—" görünür |

### 🗺️ Harita önbelleği nasıl çalışır?
Haritada gezdiğin yerlerin parçaları cihaza kaydedilir ve internet yokken oradan gösterilir.
👉 **Yola çıkmadan önce**, internet varken gideceğin bölgeyi haritada bir gez. Orası internetsiz de görünür.

- Yaklaşık **2000 harita parçası** (~40 MB) saklanır, fazlası olursa en eskiler silinir.
- **Toplu "bölgeyi indir" özelliği yoktur.** Harita sağlayıcımız OpenStreetMap'in kuralları buna izin vermiyor.

---

## 🔋 Pil ve arka plan ayarları

Bazı telefon markaları (özellikle **Xiaomi / Redmi / POCO, Oppo, Vivo, Huawei, Honor**) pil tasarrufu için arka plandaki uygulamaları kapatır. Bunu engellemezsen **ekran kapanınca kayıt durabilir**.

TrackG için şunu yap (menü adları marka ve Android sürümüne göre değişir):

1. **Ayarlar → Uygulamalar → TrackG**
2. **Pil / Pil tasarrufu → "Kısıtlama yok"** (ya da "Optimize etme")
3. **Otomatik başlatma / Arka planda çalışma** varsa **aç**
4. **Bildirimler** açık olsun
5. Mümkünse uygulamayı son kullanılanlar ekranında **kilitle** (bazı markalarda kart üstünde 🔒 simgesi)

> 💡 Markanın kendi ayarlarını bulmak için [dontkillmyapp.com](https://dontkillmyapp.com) sitesine bakabilirsin.

Kayıt sırasında bildirim çubuğunda **"TrackG kayıt yapıyor"** yazısını görmelisin. Görmüyorsan bildirim izni kapalı olabilir.

---

## 🛠️ Sorun giderme

| Sorun | Muhtemel sebep ve çözüm |
|---|---|
| 🗺️ Harita **gri** | İnternet yok ya da o bölgeyi daha önce gezmedin. İnterneti aç, haritada gez |
| 📡 GPS **"SEARCHING"** diyor | Konum aranıyor. Açık alana çık, telefonun konum ayarının açık olduğundan emin ol. Çatı, bina ve ağaç altı sinyali zayıflatır |
| ❌ **"PERMISSION DENIED"** | Konum izni verilmemiş. Ayarlar → Uygulamalar → TrackG → İzinler → Konum |
| ⏸️ Ekran kapanınca **kayıt durdu** | **Pil ve arka plan ayarlarını** yap |
| 📈 Telefon dururken **mesafe artıyor** | Sinyal çok zayıf olabilir (GPS: WEAK). Açık alanda dene |
| 🌡️ **ISI "—"** | İnternet yok. İnternet gelince ve kayıt açıkken yenilenir |
| 🧭 **PUSULA "—"** | Pusula gittiğin yönden okunur, **hareket etmeye başlayınca** görünür |
| 💾 **Kaydım kayboldu** | Kayıt STOP'a basınca kaydedilir. Android uygulamayı kapattıysa yarım kalan kayıt gidebilir |
| 🔁 **Güncellerken "paket mevcut paketle çakışıyor"** | Eski TrackG'yi silip yenisini kur (kayıtlar silinir) |

---

## 🔐 Gizlilik

- 🏠 **Verilerin cihazında kalır.** Kayıtların, hedefin ve ayarların sadece telefonunda saklanır. Hesap, giriş ya da sunucu yoktur. Uygulamayı silersen silinir.
- 🚫 Reklam ve istatistik toplama (analitik) yoktur.
- 🌐 Uygulama internete **sadece iki iş için** çıkar:
  1. **Harita parçaları:** `tile.openstreetmap.org` sunucusundan. Baktığın bölgenin parçalarını istediği için bu sunucu hangi bölgeye baktığını görebilir.
  2. **Sıcaklık:** [Open-Meteo](https://open-meteo.com) servisine, konumun **iki ondalığa yuvarlanmış** (yaklaşık 1 km hassasiyetinde) koordinatı gönderilir.

---

## ⚠️ Bilinen sınırlar

- 📉 GPS doğruluğu ortama bağlıdır: açık havada 3-5 m, bina ve ağaç altında 10-30 m şaşabilir.
- 🧩 Kayıt sadece **STOP'ta** kaydedilir; uygulama kapanırsa yarım kayıt kaybolur.
- 🧾 GPX/KML dışa aktarma yoktur.
- 🗺️ Toplu çevrimdışı harita indirme yoktur (bkz. İnternetsiz kullanım).
- 🔊 Sesli yönlendirme yoktur.
- 🧪 Şu an **debug** sürümüdür, Play Store'da yoktur.
- 🗺️ OpenStreetMap'in ücretsiz harita sunucusu **yoğun kullanım** için uygun değildir. Çok sayıda kullanıcıya açılırsa kendi/ücretli bir harita sağlayıcısına geçmek gerekir.
- 🤖 Az sayıda telefonda denendi. Eski Android sürümlerinde (8-9) ve farklı markalarda denenmedi, sorun yaşarsan telefon modelini ve Android sürümünü bildir.

---

## 👩‍💻 Geliştiriciler için

**Teknoloji:** React + Vite, Leaflet / react-leaflet, Capacitor (Android).
Arka plan konum için [`@capacitor-community/background-geolocation`](https://github.com/capacitor-community/background-geolocation) kullanılır.

```bash
npm install
npm run dev      # tarayıcıda dene (arka plan takibi sadece telefonda çalışır)
npm run build    # üretim derlemesi: dist/
npm run lint
```

**Android:**
```bash
npm run build
npx cap sync android
npx cap open android   # Android Studio
```

**Otomatik APK:** `main` dalına her gönderimde GitHub Actions "Build Android APK" iş akışı çalışır. Yeşil tik çıkınca ilgili çalışmanın sayfasında **Artifacts → TrackG-App** altından APK indirilir.

**Kod yapısı (`src/`):**

| Dosya | İçerik |
|---|---|
| `App.jsx` | Ana ekran, kayıt mantığı, harita ve vektör görünümü |
| `geo.js` | Mesafe/yön hesapları, konum takibi (telefonda ön plan servisi, tarayıcıda normal geolocation) |
| `tiles.js` | Harita parçası önbelleği (OpenStreetMap kurallarına uygun, toplu indirme yok) |
| `Goal.jsx` | HEDEF sekmesi |
| `Records.jsx` | Kayıt listesi ve detay sayfası |

**Notlar:**
- `capacitor.config.json` içindeki `android.useLegacyBridge: true` ayarı, arka planda konum güncellemelerinin birkaç dakika sonra durmaması için gereklidir.
- Kayıtlar `localStorage` içinde tutulur (`trackg-records`).

---

## 📄 Lisans

Lisans bilgisi için [`LICENCE`](LICENCE) dosyasına bak.

---

<p align="center">🥾 İyi yürüyüşler! Hata ya da öneri için bir <b>Issue</b> açabilirsin.</p>
