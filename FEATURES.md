# oksend Özellik Yol Haritası

Bu belge, oksend için eklenmesi düşünülen olası özelliklere yönelik bir referans niteliğindedir. Özellikler öncelik ve kategoriye göre düzenlenmiştir.

## Mevcut Özellikler

- ✅ Sürükle-bırak dosya yüklemeleri
- ✅ Parola korumalı yükleme/silme işlemleri
- ✅ Açılış sayfalarıyla kısa URL üretimi
- ✅ Dosya yönetimi için yönetim paneli
- ✅ Dosya listeleme ve silme
- ✅ Animasyonlu modern yükleme arayüzü
- ✅ Dosya metaverisi gösterimi (boyut, tür, yüklenme tarihi)
- ✅ Paylaşılabilir bağlantıları kopyalama
- ✅ Gerçek zamanlı yükleme ilerlemesi
- ✅ Boyut ve MIME türü doğrulaması
- ✅ Bot koruması (Turnstile entegrasyonu - isteğe bağlı)

---

## Yüksek Öncelikli Özellikler (Çekirdek İşlevsellik)

### 1. Yönetim Panelinde Arama ve Filtreleme
**Öncelik:** 🔴 Yüksek  
**Efor:** Orta  
**Açıklama:**
- Dosyaları ada göre arama
- Dosya türü, tarih aralığı, boyuta göre filtreleme
- Ada, tarihe, boyuta göre artan/azalan sıralama
- Yazdıkça gerçek zamanlı arama
- Filtreleri temizle butonu

**Faydalar:**
- Büyük koleksiyonlarda dosyaları hızlı bulma
- Daha iyi organizasyon ve yönetim
- Geliştirilmiş kullanıcı deneyimi

**Uygulama Notları:**
- AdminPanel bileşenine arama alanı ekleyin
- Mevcut veriler üzerinde istemci tarafı filtreleme kullanın
- Çok büyük veri kümeleri için sunucu tarafı filtrelemeyi değerlendirin

---

### 2. Toplu İşlemler
**Öncelik:** 🔴 Yüksek  
**Efor:** Orta  
**Açıklama:**
- Onay kutuları ile birden fazla dosya seçme
- Seçili dosyaları toplu silme
- ZIP arşivi olarak toplu indirme
- Bağlantıları toplu kopyalama (virgülle ayrılmış)
- Tümünü seç / tümünü bırak işlevi

**Faydalar:**
- Çok sayıda dosya yönetirken zaman kazandırır
- Eski dosyaları verimli şekilde temizleme
- Güçlü kullanıcılar için daha iyi iş akışı

**Uygulama Notları:**
- Yönetim tablosuna onay kutusu sütunu ekleyin
- Seçili dosyaları durumda takip edin
- ZIP üretimini arka uçta veya istemci tarafında uygulayın
- Toplu silme için onay penceresi ekleyin

---

### 3. Dosya Önizleme
**Öncelik:** 🔴 Yüksek  
**Efor:** Yüksek  
**Açıklama:**
- Küçük görsellerle görüntü galerisi
- PDF.js kullanarak PDF görüntüleme
- Sözdizimi vurgulamalı metin dosyası önizlemesi
- Gömülü video/ses oynatma
- Tam boy görseller için lightbox
- Önizlemeyi modal veya yan panelde gösterme

**Faydalar:**
- Önizleme için indirme zorunluluğunu ortadan kaldırır
- Daha iyi kullanıcı deneyimi
- Dosyaları daha hızlı tanımlama

**Uygulama Notları:**
- Önizleme uç noktası ekleyin veya mevcut indirme uç noktasını kullanın
- Her dosya türü için farklı önizleme bileşenleri oluşturun
- Küçük görselleri R2 içinde önbelleğe alın veya anlık oluşturun
- react-pdf ve react-player gibi kütüphanelerden yararlanın

---

### 4. Bağlantı Süre Sonu
**Öncelik:** 🔴 Yüksek  
**Efor:** Orta  
**Açıklama:**
- Kısa URL'ler için son kullanma tarihleri belirleme
- Süresi dolan dosyaları otomatik silme (isteğe bağlı)
- Açılış sayfasında süre sonu uyarıları
- Varsayılan süre sonu ayarı
- Var olan dosyaların süresini uzatma seçeneği

**Faydalar:**
- Daha iyi güvenlik ve gizlilik
- Otomatik temizlik
- Bağlantı ömrü üzerinde kontrol

**Uygulama Notları:**
- Sona erme zaman damgalarını KV metaverisinde saklayın
- Slug çözümleme uç noktasında süre sonunu kontrol edin
- Yükleme yanıtı ve yönetim paneline süre sonu arayüzü ekleyin
- Temizlik için arka plan işi veya zamanlanmış Worker kullanmayı düşünün

---

### 5. Dosya Bazında Parola Koruması
**Öncelik:** 🔴 Yüksek  
**Efor:** Orta  
**Açıklama:**
- Belirli dosya/bağlantıları parola ile koruma
- Yükleme parolasından bağımsız çalışma
- İndirme öncesi açılış sayfasında parola istemi
- Yükleme sırasında dosya özelinde isteğe bağlı parola
- Mevcut dosyaların parolasını değiştirme

**Faydalar:**
- Ek güvenlik katmanı
- Hassas dosyaları seçili kişilerle paylaşma
- Ana parolayı değiştirmeden erişim kontrolü

**Uygulama Notları:**
- Parolaları KV içinde (hash'lenmiş) veya R2 metaverisinde (şifrelenmiş) saklayın
- Açılış sayfasına parola formu ekleyin
- Parola sonrası erişim için oturum/token tabanlı yaklaşım kullanın
- Parola hash'lemek için bcrypt veya benzeri bir kütüphane tercih edin

---

## Orta Öncelikli Özellikler (UX İyileştirmeleri)

### 6. QR Kod Üretimi
**Öncelik:** 🟡 Orta  
**Efor:** Düşük  
**Açıklama:**
- Paylaşım bağlantıları için QR kod üretimi
- Açılış sayfasında QR görüntüleme
- QR kodunu görsel olarak indirme
- Farklı boyut seçenekleri (küçük, orta, büyük)
- Her dosya için yönetim panelinde QR gösterimi

**Faydalar:**
- Mobil cihazlarla hızlı paylaşım
- Dosyaları telefona aktarmayı kolaylaştırır
- Modern paylaşım yöntemi

**Uygulama Notları:**
- `qrcode` veya `qrcode.react` gibi kütüphaneleri kullanın
- İhtiyaca göre istemci veya sunucu tarafında üretin
- Sunucu tarafında üretilecekse QR kodlarını önbelleğe alın

---

### 7. İstatistikler ve Analitik
**Öncelik:** 🟡 Orta  
**Efor:** Yüksek  
**Açıklama:**
- Dosya başına indirme sayısı
- Depolama kullanım panosu (toplam, dosya türüne göre)
- Yükleme/indirme trendleri (grafikler)
- En çok erişilen dosyalar listesi
- Tarih aralığı istatistikleri
- İndirme geçmişi/zaman çizelgesi

**Faydalar:**
- Dosya kullanımına dair içgörüler
- Depolama yönetimi
- Popüler içerikleri belirleme

**Uygulama Notları:**
- İndirme olaylarını KV veya D1 veritabanında saklayın
- Panoya yönelik verileri birleştirin
- Chart.js veya recharts gibi grafik kütüphanelerini kullanın
- Olay takibi için analytics.js değerlendirin

---

### 8. Görsel Galeri Görünümü
**Öncelik:** 🟡 Orta  
**Efor:** Orta  
**Açıklama:**
- Görseller için grid görünümü seçeneği
- Küçük görsellerin üretilmesi ve önbelleğe alınması
- Lightbox galeri gezintisi
- Sadece görselleri göstermek için filtre
- Tam ekran görsel görüntüleme

**Faydalar:**
- Daha iyi görsel gezinme
- Görselleri daha hızlı bulma
- Profesyonel galeri deneyimi

**Uygulama Notları:**
- Küçük görselleri yükleme sırasında veya talep üzerine üretin
- Küçük görselleri `_thumb` son ekiyle R2 içinde saklayın
- react-image-gallery veya photoswipe gibi kütüphaneleri kullanın
- Performans için görselleri tembel yükleme (lazy load) yöntemiyle getirin

---

### 9. Karanlık Mod
**Öncelik:** 🟡 Orta  
**Efor:** Düşük  
**Açıklama:**
- Tema tercih geçişi
- Sistem tercihinin algılanması
- Kalıcı tema depolaması (localStorage)
- Yumuşak tema geçişleri
- Açılış sayfalarında da karanlık mod

**Faydalar:**
- Düşük ışıkta daha konforlu kullanım
- Modern arayüz standardı
- Kullanıcı tercihlerini destekler

**Uygulama Notları:**
- Tema sağlayıcı (context) ekleyin
- Renkler için CSS değişkenleri kullanın
- Üst menüde tema geçiş butonu ekleyin
- Sistem tercihlerini `prefers-color-scheme` ile algılayın

---

### 10. Dosya Organizasyonu
**Öncelik:** 🟡 Orta  
**Efor:** Yüksek  
**Açıklama:**
- Etiket/kategori sistemi
- Özel klasörler/sanal organizasyon
- Dosyaları favorilere/yer imlerine ekleme
- Etiket veya kategoriye göre filtreleme
- Dosya başına birden fazla etiket

**Faydalar:**
- Daha iyi dosya organizasyonu
- Dosyaları kolayca bulma
- Kişisel özelleştirme

**Uygulama Notları:**
- Etiketleri KV veya dosya metaverisinde saklayın
- Yönetim paneline etiket yönetimi arayüzü ekleyin
- Sanal klasörleri metaveriyle yönetin (dosyalar R2'de kalır)
- Karmaşık ilişkiler için D1 veritabanını değerlendirin

---

## Gelişmiş Özellikler

### 11. Özelleştirilmiş Paylaşım Ayarları
**Öncelik:** 🟢 Düşük  
**Efor:** Yüksek  
**Açıklama:**
- İndirme limiti (ör. en fazla 10 indirme)
- Süre sınırlı erişim (saat/gün)
- IP kısıtlamaları (beyaz/siyah liste)
- Tek kullanımlık indirme bağlantıları
- Süre sonu tarih seçici arayüzü

**Faydalar:**
- İnce ayarlı erişim kontrolü
- Güvenliği artırır
- Profesyonel özellikler sunar

**Uygulama Notları:**
- KV içinde karmaşık durum yönetimi
- Bağlantı başına indirme takibi
- IP takibi ve doğrulaması
- Oran sınırlama (rate limiting) uygulanması

---

### 12. Toplu Yükleme İlerlemesi
**Öncelik:** 🟢 Düşük  
**Efor:** Orta  
**Açıklama:**
- Dosya bazında ilerleme çubukları
- Yüklemeyi duraklat/başlat
- Başarısız yüklemeleri yeniden deneme
- Yükleme kuyruğu yönetimi
- Yükleme hızı gösterimi

**Faydalar:**
- Daha iyi yükleme geri bildirimi
- Ağ kesintilerini tolere eder
- Profesyonel yükleme deneyimi

**Uygulama Notları:**
- Dropzone içinde gelişmiş ilerleme takibi
- Kuyruk yönetim sistemi
- Yüklemeyi sürdürme (parçalı yükleme) özelliği
- Hata kurtarma mantığı

---

### 13. Dışa/İçe Aktarma
**Öncelik:** 🟢 Düşük  
**Efor:** Orta  
**Açıklama:**
- Dosya listesini CSV/JSON olarak dışa aktarma
- Dosya metaverisini yedekleme
- Dosya listesini içe aktarma (taşıma için)
- Bağlantılar ve metaveriyle birlikte dışa aktarma
- Zamanlanmış yedekler

**Faydalar:**
- Veri taşınabilirliği
- Yedekleme ve geri yükleme
- Geçiş (migrasyon) desteği

**Uygulama Notları:**
- CSV/JSON üretimini ön yüzde veya arka uçta gerçekleştirin
- Tüm dosya metaverisini dahil edin
- İçe aktarmada doğrulama ve hata yönetimi sağlayın

---

### 14. Gelişmiş Yönetici Özellikleri
**Öncelik:** 🟢 Düşük  
**Efor:** Orta  
**Açıklama:**
- Dosya yeniden adlandırma
- Dosyaları taşıma (R2 anahtarını değiştirme)
- Dosya metaverisini düzenleme
- Yinelenen dosya tespiti (hash ile)
- Dosya detayları modalı/düzenleme formu

**Faydalar:**
- Daha iyi dosya yönetimi
- Yükleme sonrası düzenleme imkânı
- Yinelenenleri engelleme

**Uygulama Notları:**
- R2 anahtarıyla kopyala + sil yaklaşımı
- Dosya hash'lerini metaveride saklayın
- Metaveri düzenleme arayüzü ekleyin
- Hash hesaplamasını yükleme sırasında yapın

---

### 15. API Geliştirmeleri
**Öncelik:** 🟢 Düşük  
**Efor:** Yüksek  
**Açıklama:**
- REST API dokümantasyonu (OpenAPI/Swagger)
- API anahtarı ile kimlik doğrulama
- Olaylar için webhook desteği (yükleme, silme, indirme)
- Kullanıcı/IP bazında oran sınırlama
- GraphQL uç noktası (isteğe bağlı)

**Faydalar:**
- Programatik erişim
- Entegrasyon imkânları
- Geliştirici dostu yapı

**Uygulama Notları:**
- OpenAPI şeması oluşturun
- API anahtarı oluşturma ve yönetimi sağlayın
- Webhook teslim sistemi ekleyin
- Oran sınırlama ara katmanı yazın
- Daha iyi API yapısı için Hono veya tRPC değerlendirin

---

## Nice to Have Özellikler

### 16. Sosyal Paylaşım Butonları
**Öncelik:** 🟢 Düşük  
**Efor:** Düşük  
**Açıklama:**
- Twitter, Facebook, LinkedIn'e paylaş
- Özelleştirilebilir paylaşım mesajları
- Web siteleri için yerleştirme (embed) kodları
- Açılış sayfasında paylaşım butonları

**Faydalar:**
- İçeriği kolayca paylaşma
- Sosyal medya entegrasyonu
- Görünürlüğü artırır

---

### 17. Ön İmzalı Yükleme URL'leri
**Öncelik:** 🟡 Orta  
**Efor:** Yüksek  
**Açıklama:**
- R2'ye doğrudan yükleme (Worker sınırlarını aşar)
- Çok büyük dosyalar için destek (>100 MB)
- Devam ettirilebilir yüklemeler
- Çok parçalı yükleme desteği

**Not:** `functions/api/sign.ts` dosyasında temel yapısı hazır.

**Faydalar:**
- Büyük dosyaları yönetme
- Daha iyi performans
- Worker maliyetlerini azaltır

---

### 18. Dosya Sıkıştırma
**Öncelik:** 🟢 Düşük  
**Efor:** Yüksek  
**Açıklama:**
- Görselleri otomatik sıkıştırma (isteğe bağlı)
- Anlık ZIP oluşturma
- Alan optimizasyonu
- Sıkıştırma kalite ayarları

**Faydalar:**
- Depolama alanından tasarruf
- Daha hızlı transfer
- Maliyet düşürme

---

### 19. Virüs Taraması
**Öncelik:** 🟡 Orta  
**Efor:** Çok Yüksek  
**Açıklama:**
- ClamAV veya benzeri bir araçla entegrasyon
- Yüklemeleri otomatik tarama
- Şüpheli dosyaları karantinaya alma
- Yönetim panelinde tarama sonuçlarını gösterme

**Faydalar:**
- Güvenliği artırır
- Kullanıcıları korur
- Zararlı yazılım yayılımını engeller

---

### 20. E-posta Bildirimleri
**Öncelik:** 🟢 Düşük  
**Efor:** Orta  
**Açıklama:**
- Dosyalara erişildiğinde bildirim gönderme
- Günlük/haftalık özetler
- Paylaşım bağlantısı bildirimleri
- Yapılandırılabilir bildirim tercihleri

**Faydalar:**
- Haberdar olun
- Kullanımı izleyin
- Güvenlik uyarıları oluşturun

---

## Hızlı Kazanımlar (Kolay Uygulamalar)

Bu özellikler kısa sürede uygulanabilir ve kullanıcı deneyimine doğrudan katkı sağlar:

1. ✅ **Yönetim panelinde arama çubuğu** - Basit filtreleme mantığı
2. ✅ **Toplu seçim onay kutusu** - Temel durum yönetimi
3. ✅ **Paylaşım bağlantıları için QR kodu** - Kütüphane entegrasyonu
4. ✅ **Karanlık mod geçişi** - CSS değişkenleri + context
5. ✅ **Görsel galeri görünümü** - Grid yerleşimi + filtreleme
6. ✅ **İndirme sayısı rozetleri** - KV içinde basit sayaç
7. ✅ **Dosya türü simgeleri** - Halihazırda kısmen mevcut
8. ✅ **Tüm URL'leri kopyala butonu** - URL'leri satır sonuyla birleştirin
9. ✅ **Tablo sütunlarını sıralama** - Veriler üzerinde `array.sort()`
10. ✅ **Büyük listeler için sayfalama** - Dizileri dilimleyin, sayfa denetimleri ekleyin

---

## Uygulama Öncelik Önerileri

### Faz 1 (Hemen - Yüksek Etki, Düşük Efor)
1. Yönetim panelinde arama ve filtreleme
2. Toplu seçim ve silme
3. QR kod üretimi
4. Karanlık mod
5. Sıralama ve sayfalama

### Faz 2 (Kısa Vadeli - Yüksek Değer)
1. Dosya önizleme (görsel, PDF, metin)
2. Bağlantı süre sonu
3. Görsel galeri görünümü
4. İstatistik panosu
5. Dosya bazında parolalar

### Faz 3 (Orta Vadeli - Gelişmiş Özellikler)
1. Toplu işlemler (ZIP indirme)
2. Dosya organizasyonu (etiketler, klasörler)
3. Ön imzalı yükleme URL'leri
4. Özelleştirilmiş paylaşım ayarları
5. API geliştirmeleri

### Faz 4 (Uzun Vadeli - İyi Olur Özellikler)
1. Virüs taraması
2. E-posta bildirimleri
3. Gelişmiş analitik
4. Sosyal paylaşım
5. Dosya sıkıştırma

---

## Teknik Hususlar

### Depolama Seçenekleri
- **R2**: Dosya depolama (mevcut)
- **KV**: Metaveri, kısa bağlantılar, istatistikler (mevcut)
- **D1**: Karmaşık ilişkiler için değerlendirilebilir (etiketler, analitik)
- **Durable Objects**: Gerçek zamanlı özellikler, kuyruklar için

### Performans
- Küçük görsellerin üretimi (yükleme sırasında mı, talep üzerine mi)
- Önbellekleme stratejileri (Cloudflare Cache API)
- Büyük listeler için tembel yükleme
- Sayfalama ve sonsuz kaydırma seçenekleri

### Güvenlik
- Parola hash'leme (bcrypt)
- Oran sınırlama
- IP kısıtlamaları
- Dosya doğrulaması (sihirli bayt, sadece uzantıya güvenmeyin)

### Ölçeklenebilirlik
- Büyük dosya listeleri (sayfalama, sanal kaydırma)
- Eşzamanlı çoklu yüklemeler
- Depolama kullanımının izlenmesi
- Maliyet optimizasyonu

---

## Gelecek Geliştirmeler İçin Notlar

- Cloudflare Workers sınırlarını (CPU süresi, bellek, istek boyutu) hesaba katın
- R2 cömert bir ücretsiz katman sunar ancak kullanımı takip edin
- KV'nin yerleşik listeleme işlemi yoktur - bu kısıtlamayı aşacak tasarım yapın
- Karmaşık sorgular için gerekirse D1 kullanın
- Durum (state) gerektiren işlemler için Durable Objects'i düşünün
- Ön yüz paket boyutunu makul seviyede tutun
- Görselleri ve varlıkları optimize edin
- Büyük dosyalarla ve çok sayıda dosyayla test yapın
- Cloudflare analitiklerini izleyerek kullanım eğilimlerini takip edin

---

## Katkıda Bulunma

Özellikleri uygularken:
1. Bu belgeyi durumla güncelleyin
2. Uygunsa testler ekleyin
3. README.md dosyasını gereken yerlerde güncelleyin
4. API değişikliklerini belgelendirin
5. Geriye dönük uyumluluğu göz önünde bulundurun

---

**Son Güncelleme:** 2025-01-01  
**Sürüm:** 1.0
