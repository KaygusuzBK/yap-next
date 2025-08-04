# YAP Next - Modern Web Uygulaması

Next.js, TypeScript ve Tailwind CSS ile geliştirilmiş modern web uygulaması.

## 🚀 Özellikler

- ⚡ **Next.js 15** - En son Next.js sürümü ile hızlı geliştirme
- 🔷 **TypeScript** - Tip güvenliği ile daha güvenilir kod
- 🎨 **Tailwind CSS** - Utility-first CSS framework
- 📱 **Responsive Design** - Tüm cihazlarda mükemmel görünüm
- 🌙 **Dark Mode** - Otomatik tema desteği
- 🎯 **Modern UI** - Shadcn/ui bileşenleri
- 🔧 **ESLint** - Kod kalitesi ve tutarlılık
- 📦 **Turbopack** - Hızlı geliştirme deneyimi

## 🛠️ Teknolojiler

- **Framework:** Next.js 15.4.5
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 4
- **UI Components:** Shadcn/ui
- **Icons:** Lucide React
- **State Management:** Zustand
- **Forms:** React Hook Form + Zod
- **Charts:** Recharts
- **Drag & Drop:** @dnd-kit

## 📦 Kurulum

1. **Projeyi klonlayın:**
```bash
git clone <repository-url>
cd yap-next
```

2. **Bağımlılıkları yükleyin:**
```bash
npm install
```

3. **Development server'ı başlatın:**
```bash
npm run dev
```

4. **Tarayıcınızda açın:**
```
http://localhost:3000
```

## 🚀 Kullanılabilir Scriptler

- `npm run dev` - Development server'ı başlatır (Turbopack ile)
- `npm run build` - Production build oluşturur
- `npm run start` - Production server'ı başlatır
- `npm run lint` - ESLint ile kod kontrolü yapar

## 📁 Proje Yapısı

```
yap-next/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── layout.tsx      # Root layout
│   │   ├── page.tsx        # Ana sayfa
│   │   └── globals.css     # Global stiller
│   ├── components/         # React bileşenleri
│   │   └── ui/            # Shadcn/ui bileşenleri
│   └── lib/               # Utility fonksiyonları
├── public/                # Statik dosyalar
├── tailwind.config.ts     # Tailwind yapılandırması
├── next.config.ts         # Next.js yapılandırması
└── package.json           # Proje bağımlılıkları
```

## 🎨 Tema ve Renkler

Proje, modern bir tasarım sistemi kullanır:

- **Primary:** Modern mavi tonları
- **Secondary:** Nötr gri tonları
- **Accent:** Vurgu renkleri
- **Dark Mode:** Otomatik tema desteği

## 🔧 Geliştirme

### Yeni Sayfa Ekleme

```bash
# Yeni sayfa oluştur
touch src/app/about/page.tsx
```

### Yeni Bileşen Ekleme

```bash
# Yeni bileşen oluştur
touch src/components/MyComponent.tsx
```

### Stil Ekleme

Tailwind CSS utility sınıflarını kullanın:

```tsx
<div className="flex items-center justify-center bg-primary text-primary-foreground">
  Merhaba Dünya!
</div>
```

## 📱 Responsive Design

Proje, tüm cihaz boyutları için optimize edilmiştir:

- **Mobile:** 320px+
- **Tablet:** 768px+
- **Desktop:** 1024px+
- **Large Desktop:** 1280px+

## 🚀 Deployment

### Vercel (Önerilen)

1. Vercel hesabınızda yeni proje oluşturun
2. GitHub repository'nizi bağlayın
3. Otomatik deployment başlayacaktır

### Diğer Platformlar

```bash
# Production build
npm run build

# Production server başlat
npm run start
```

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 📞 İletişim

- **GitHub:** [@username](https://github.com/username)
- **Email:** info@yapnext.com

---

⭐ Bu projeyi beğendiyseniz yıldız vermeyi unutmayın!
