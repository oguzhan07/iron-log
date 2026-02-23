# IRON LOG - Enhanced Version 🚀

## 🆕 Yeni Özellikler

### 1️⃣ Egzersiz Geçmişi 📊
- Her egzersizin yanında **"📊 GEÇMİŞ"** butonu
- Tüm geçmiş antrenmanları göster (tarih, setler, max kg, toplam hacim)
- Geçmiş performansını takip et

### 2️⃣ Önerilen Ağırlık 💡
- **Progressive overload** algoritması
- Üst vücut: +2.5kg artış
- Alt vücut: +5kg artış
- **"✨ Uygula"** butonu ile tüm setlere otomatik uygula

### 3️⃣ Geliştirilmiş UI
- Geçmiş veriler ekranda görünür
- Önceki ortalama ağırlık gösterimi
- Önerilen artış miktarı

---

## 📦 Kurulum

```bash
# GitHub'a yükle
cd iron-log
git add .
git commit -m "Add exercise history and suggested weights"
git push origin master

# Ya da Netlify Drop'a sürükle
# https://app.netlify.com/drop
```

---

## 🎯 Nasıl Kullanılır

### Antrenman Sırasında:
1. **Başlat** butonuna tıkla
2. Her egzersizde **📊 GEÇMİŞ** ile geçmiş kayıtları gör
3. **💡 Önerilen** satırında ne kadar ağırlık eklenmesi gerektiğini gör
4. **✨ Uygula** ile önerilen ağırlığı tüm setlere uygula

### Örnek:
```
BENCH PRESS
💡 Önerilen: 82.5kg (önceki ort: 80kg, +2.5kg)

[📊 GEÇMİŞ] → Modal açılır:
  15 Şub 2025
  Set 1: 80kg × 10
  Set 2: 80kg × 8
  Set 3: 75kg × 10
  
  12 Şub 2025
  Set 1: 75kg × 10
  ...
```

---

## 🔧 Teknik Detaylar

### Değişen Dosyalar:
- `index.html` - 2 yeni modal eklendi
- `assets/js/views/workout.js` - Yeni fonksiyonlar
- `assets/js/app.js` - Yeni window exports

### Yeni Fonksiyonlar:
```javascript
getExerciseHistory(state, exerciseName)  // Geçmiş kayıtlar
getSuggestedWeight(state, exerciseName)  // Önerilen ağırlık
showExerciseHistory(state, exerciseName) // Modal göster
applySuggestedWeight(state, exIdx, kg)   // Ağırlığı uygula
```

---

## 🚀 Deployment

### GitHub Pages:
```bash
git push origin master
# Settings → Pages → Deploy from main
```

### Netlify (Önerilen):
1. https://app.netlify.com/start
2. GitHub repo seç
3. Deploy!

---

## 💪 Progressive Overload Mantığı

```
Üst Vücut (chest, shoulders, arms):
Önceki: 80kg → Önerilen: 82.5kg (+2.5kg)

Alt Vücut (squat, deadlift, legs):
Önceki: 100kg → Önerilen: 105kg (+5kg)
```

---

## 🐛 Sorun Giderme

### Modal açılmıyor?
- Console'da hata var mı kontrol et (F12)
- `closeModal` fonksiyonu import edilmiş mi?

### Önerilen ağırlık görünmüyor?
- En az 1 geçmiş antrenman kaydı olmalı
- Egzersiz adı eşleşiyor mu kontrol et

---

## 📝 To-Do (İleride Eklenebilir)

- [ ] PR takibi (kişisel rekorlar)
- [ ] Grafiklerde PR işaretleyici
- [ ] Egzersiz notları (form cues, tempo)
- [ ] Rest timer (set arası dinlenme)
- [ ] Deload week detection
- [ ] Export to CSV

---

## 🎉 Başarıyla Eklendi!

Artık her antrenmanda geçmiş performansını görebilir ve **progressive overload** ile sürekli gelişebilirsin! 💪

