# ozan.cloud

Sürükle-bırak yüklemeleri destekleyen, Cloudflare Pages, Pages Functions ve R2 depolama üzerinde çalışan minimal, hızlı ve güvenli kişisel dosya paylaşım sitesi.

**Canlı sürüm:** https://ozan.cloud

## Özellikler

- 🎯 **Sürükle-bırak yükleme** - Basit ve sezgisel dosya yükleme arayüzü
- 🔒 **Parola koruması** - X-Auth başlığıyla güvenli yükleme ve silme işlemleri
- 📊 **İlerleme takibi** - Her dosya için gerçek zamanlı yükleme ilerlemesi
- 🔗 **Paylaşılabilir bağlantılar** - Yüklenen tüm dosyalar için doğrudan indirme bağlantıları
- 🛡️ **Boyut ve tür kısıtlamaları** - Yapılandırılabilir dosya boyutu ve MIME türü kısıtları
- 🤖 **Bot koruması** - İsteğe bağlı Cloudflare Turnstile entegrasyonu
- ⚡ **Hızlı ve küresel** - Cloudflare'ın uç ağı ile güçlendirilmiştir

## Teknoloji Yığını

- **Ön yüz**: Vite + React + TypeScript + Tailwind CSS
- **Arka uç**: Cloudflare Pages Functions (TypeScript)
- **Depolama**: Cloudflare R2 bucket
- **İsteğe bağlı**: Kısa bağlantılar için Cloudflare KV, bot koruması için Turnstile

## Önkoşullar

- Node.js 18+ ve pnpm
- Cloudflare hesabı:
  - Pages etkin
  - R2 bucket oluşturulmuş
  - (İsteğe bağlı) Kısa bağlantılar için KV namespace
  - (İsteğe bağlı) Turnstile site anahtarları

## Yerel Geliştirme

### 1. Bağımlılıkları yükleyin

```bash
pnpm install
```

### 2. Ortam değişkenlerini ayarlayın

`.dev.vars.example` dosyasını `.dev.vars` olarak kopyalayın ve değerleri doldurun:

```bash
cp .dev.vars.example .dev.vars
```

`.dev.vars` dosyasını düzenleyin:

```env
# Zorunlu
UPLOAD_PASSWORD=guvenli-parolanizi-buraya-yazin

# İsteğe bağlı
MAX_SIZE_MB=200
ALLOWED_MIME=image/jpeg,image/png,application/pdf
BLOCKED_MIME=application/x-executable
BASE_URL=http://localhost:8788
TURNSTILE_SITE_KEY=
TURNSTILE_SECRET=
```

### 3. Wrangler ayarlarını yapın

`wrangler.toml` dosyasını açın ve R2 bucket adınızı belirtin:

```toml
[[r2_buckets]]
binding = "BUCKET"
bucket_name = "bucket-adiniz"
```

Slug bağlantıları için KV kullanıyorsanız, yerel geliştirme için `wrangler.toml` içinde hazır ayarlanmıştır. Prodüksiyon için 6. adımı (Cloudflare Pages panosu) takip ederek bağlayın.

### 4. Geliştirme sunucularını çalıştırın

İki sunucuyu aynı anda çalıştırmanız gerekir:

**Terminal 1** - Ön yüz (Vite):
```bash
pnpm dev
```

**Terminal 2** - Arka uç (Wrangler Pages):
```bash
pnpm wrangler pages dev dist --compatibility-date=2024-10-01
```

İsterseniz wrangler'ı global olarak kurup şu komutla da çalıştırabilirsiniz:
```bash
wrangler pages dev dist
```

Ön yüz `http://localhost:5173` adresinde, arka uç ise API isteklerini proxy'leyerek çalışır.

## Prodüksiyon için derleme

```bash
pnpm build
```

Bu komut `dist/` klasöründe prodüksiyon derlemesini üretir.

## Cloudflare Pages'e dağıtım

### 1. R2 bucket oluşturun

1. [Cloudflare Paneli](https://dash.cloudflare.com/) → R2
2. Yeni bir bucket oluşturun (ör. `oksend-bucket`)
3. Bucket adını not edin

### 2. KV namespace oluşturun (isteğe bağlı, kısa bağlantılar için)

1. Workers & Pages → KV
2. Yeni namespace oluşturun (ör. `oksend-links`)
3. Namespace ID'sini not edin

### 3. GitHub deposunu bağlayın

1. Workers & Pages → Pages → Proje oluştur
2. GitHub hesabınızı bağlayın
3. Depoyu ve dalı seçin

### 4. Derleme ayarlarını yapılandırın

- **Çerçeve şablonu**: None
- **Derleme komutu**: `pnpm install && pnpm build`
- **Çıktı klasörü**: `dist`

### 5. Ortam değişkenlerini ayarlayın

**Cloudflare Pages içinde ortam değişkenlerini bulma:**

1. https://dash.cloudflare.com adresine gidip oturum açın
2. Sol menüden **Workers & Pages** → **Pages** yolunu izleyin
3. Proje adınıza tıklayın
4. Üstteki **"Settings"** sekmesine tıklayın
5. Sol menüde **"Environment variables"** bölümünü bulun (veya sayfada aşağı kaydırın)
6. Hâlâ göremiyorsanız projede Yönetici/Sahip yetkilerine sahip olduğunuzdan emin olun

**Alternatif - Wrangler CLI kullanımı:**

Arayüzde ilgili alanı göremiyorsanız komut satırını kullanın:

```bash
# Cloudflare'a giriş yapın (henüz yapmadıysanız)
npx wrangler login

# Gizli değeri kaydedin (parolayı girmeniz istenir)
npx wrangler pages secret put UPLOAD_PASSWORD --project-name=<proje-adiniz>
```

**Değişkenlerin ayarlanması:**

Pages → Settings → Environment variables bölümünde (veya yukarıdaki CLI ile) şu değerleri ekleyin:

**Prodüksiyon:**
- `UPLOAD_PASSWORD` (zorunlu) - Yükleme/silme işlemleri için parola
- `MAX_SIZE_MB` (isteğe bağlı, varsayılan: 200) - MB cinsinden maksimum dosya boyutu
- `ALLOWED_MIME` (isteğe bağlı) - Virgülle ayrılmış izin verilen MIME türleri
- `BLOCKED_MIME` (isteğe bağlı) - Virgülle ayrılmış engellenen MIME türleri
- `BASE_URL` (isteğe bağlı) - Paylaşım bağlantıları için temel adres (örn. `https://ozan.cloud`)
- `TURNSTILE_SITE_KEY` (isteğe bağlı) - Cloudflare Turnstile site anahtarı
- `TURNSTILE_SECRET` (isteğe bağlı) - Cloudflare Turnstile gizli anahtarı

### 6. Fonksiyon bağlarını yapılandırın

Pages → Settings → Functions menüsünde:

**R2 bucket bağı:**
- Değişken adı: `BUCKET`
- Bucket: R2 bucket'ınızı seçin

**KV namespace bağı (kısa URL'ler için zorunlu):**

**Kısa URL'leri etkinleştirmek için şu adımları izleyin:**

1. **KV namespace oluşturun:**
   - Cloudflare Paneli → **Workers & Pages** → **KV**
   - **"Create a namespace"** butonuna tıklayın
   - Bir ad verin (ör. "oksend-links")
   - **"Add"** butonuyla kaydedin
   - Listede görünen namespace ID'sini kopyalayın

2. **KV'yi Pages projesine bağlayın:**
   - Pages projenize gidin → **Settings** → **Functions**
   - **"KV namespace bindings"** bölümüne ilerleyin
   - **"Add binding"** butonuna tıklayın
   - Şu değerleri girin:
     - **Variable name:** `LINKS` (tam olarak `LINKS` olmalı)
     - **KV namespace:** Açılır listeden namespace'inizi seçin
   - **"Save"** butonuna basın

3. **Doğrulayın:**
   - Bağlama sonrası birkaç saniye bekleyin
   - Yeni bir dosya yükleyin; `/s/abc12345` gibi kısa bir URL görmelisiniz
   - KV algılandı mı diye Cloudflare Functions günlüklerini kontrol edin

