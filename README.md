# YAP Nest - Backend API

Proje yönetim platformu için NestJS backend API'si.

## 🚀 Özellikler

- **NestJS** - Modern Node.js framework
- **TypeScript** - Tip güvenliği
- **TypeORM** - Veritabanı ORM
- **PostgreSQL** - İlişkisel veritabanı
- **JWT Authentication** - Güvenli kimlik doğrulama
- **Swagger** - API dokümantasyonu
- **Validation** - Otomatik veri doğrulama
- **CORS** - Cross-origin resource sharing

## 🛠️ Teknolojiler

- **Framework:** NestJS 11
- **Language:** TypeScript 5
- **Database:** PostgreSQL
- **ORM:** TypeORM
- **Authentication:** JWT + Passport
- **Documentation:** Swagger/OpenAPI
- **Validation:** class-validator

## 📦 Kurulum

1. **Bağımlılıkları yükleyin:**
```bash
npm install
```

2. **Environment dosyasını oluşturun:**
```bash
cp env.example .env
```

3. **Veritabanını ayarlayın:**
```bash
# PostgreSQL'de veritabanı oluşturun
createdb yap_nest_db
```

4. **Development server'ı başlatın:**
```bash
npm run start:dev
```

## 🗄️ Veritabanı Yapısı

### Entities

- **User** - Kullanıcı bilgileri ve rolleri
- **Project** - Proje detayları ve durumları
- **Task** - Görev yönetimi ve öncelikleri
- **Comment** - Proje ve görev yorumları

### İlişkiler

- User ↔ Project (One-to-Many)
- User ↔ Task (One-to-Many)
- Project ↔ Task (One-to-Many)
- User ↔ Comment (One-to-Many)
- Task ↔ Comment (One-to-Many)

## 🔐 Authentication

### Endpoints

- `POST /auth/register` - Yeni kullanıcı kaydı
- `POST /auth/login` - Kullanıcı girişi

### JWT Token

Bearer token ile korumalı endpoint'ler:
```
Authorization: Bearer <token>
```

## 📚 API Dokümantasyonu

Swagger UI: http://localhost:3001/api

## 🚀 Kullanılabilir Scriptler

- `npm run start:dev` - Development server
- `npm run build` - Production build
- `npm run start:prod` - Production server
- `npm run test` - Unit testler
- `npm run test:e2e` - E2E testler
- `npm run lint` - ESLint kontrolü

## 🔧 Environment Variables

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_DATABASE=yap_nest_db

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Application
PORT=3001
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:3000
```

## 📁 Proje Yapısı

```
src/
├── auth/                 # Authentication modülü
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── auth.module.ts
│   ├── jwt.strategy.ts
│   └── jwt-auth.guard.ts
├── entities/            # TypeORM entities
│   ├── user.entity.ts
│   ├── project.entity.ts
│   ├── task.entity.ts
│   └── comment.entity.ts
├── dto/                 # Data Transfer Objects
│   ├── auth.dto.ts
│   └── user.dto.ts
├── app.controller.ts    # Ana controller
├── app.service.ts       # Ana servis
├── app.module.ts        # Ana modül
└── main.ts             # Uygulama girişi
```

## 🔗 Frontend Entegrasyonu

Bu API, `yap-next` frontend projesi ile entegre çalışır:

- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:3001
- **API Docs:** http://localhost:3001/api

## 🚀 Deployment

### Production Build

```bash
npm run build
npm run start:prod
```

### Docker (Yakında)

```bash
docker build -t yap-nest .
docker run -p 3001:3001 yap-nest
```

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun
3. Değişikliklerinizi commit edin
4. Branch'inizi push edin
5. Pull Request oluşturun

## 📄 Lisans

MIT License

---

**YAP Nest** - Modern proje yönetim platformu backend API'si 🚀
