# 🚀 **Gelişmiş Takım Yönetimi Özellikleri**

Bu dokümanda, YAP proje yönetimi uygulamasına eklenen gelişmiş takım yönetimi özellikleri detaylandırılmıştır.

## 📋 **İçindekiler**

- [Genel Bakış](#genel-bakış)
- [Yeni Özellikler](#yeni-özellikler)
- [Kurulum](#kurulum)
- [Kullanım Kılavuzu](#kullanım-kılavuzu)
- [API Referansı](#api-referansı)
- [Veritabanı Şeması](#veritabanı-şeması)
- [Güvenlik](#güvenlik)

## 🎯 **Genel Bakış**

Takım yönetimi sistemi, modern iş ortamlarının ihtiyaçlarını karşılamak üzere tamamen yeniden tasarlanmıştır. Rol tabanlı yetkilendirme, gelişmiş üye yönetimi ve kapsamlı takım istatistikleri ile profesyonel takım yönetimi deneyimi sunar.

## ✨ **Yeni Özellikler**

### 1. **Rol Tabanlı Yetkilendirme Sistemi**

#### **Roller ve Yetkiler**

| Rol | Yetkiler | Açıklama |
|-----|----------|----------|
| **Owner** | Tüm yetkiler | Takım sahibi, tüm işlemleri yapabilir |
| **Admin** | Üye yönetimi, davet gönderme | Takım yönetimi için geniş yetkiler |
| **Member** | Sadece görüntüleme | Takım bilgilerini görüntüleyebilir |

#### **Yetki Matrisi**

| İşlem | Owner | Admin | Member |
|--------|-------|-------|--------|
| Takım bilgilerini düzenleme | ✅ | ✅ | ❌ |
| Üye davet etme | ✅ | ✅ | ❌ |
| Üye çıkarma | ✅ | ✅ | ❌ |
| Rol değiştirme | ✅ | ❌ | ❌ |
| Sahiplik devretme | ✅ | ❌ | ❌ |
| Takım silme | ✅ | ❌ | ❌ |

### 2. **Gelişmiş Takım Üye Yönetimi**

- **Üye Ekleme**: E-posta ile davet gönderme
- **Toplu Davet**: Birden fazla üyeyi aynı anda davet etme
- **Rol Yönetimi**: Üye rollerini dinamik olarak değiştirme
- **Üye Çıkarma**: Güvenli üye çıkarma işlemleri
- **Takımdan Ayrılma**: Üyelerin kendi istekleriyle ayrılması

### 3. **Takım İstatistikleri ve Metrikleri**

- **Üye Sayısı**: Aktif takım üyeleri
- **Proje Sayısı**: Takıma ait projeler
- **Aktif Görev Sayısı**: Devam eden görevler
- **Tamamlanan Görev Sayısı**: Biten görevler
- **Performans Grafikleri**: Zaman bazlı metrikler

### 4. **Gelişmiş Davet Sistemi**

- **Tekli Davet**: Bireysel üye davetleri
- **Toplu Davet**: Çoklu e-posta ile toplu davet
- **Davet Durumu Takibi**: Pending, Accepted, Expired
- **Davet Yeniden Gönderme**: Süresi dolan davetleri yenileme
- **Davet İptal Etme**: Gönderilen davetleri iptal etme

### 5. **Takım Ayarları ve Yapılandırma**

- **Takım Açıklaması**: Detaylı takım bilgileri
- **Avatar Desteği**: Takım profil resimleri
- **Birincil Proje**: Takımın ana projesi
- **Özelleştirilebilir Ayarlar**: Takım ihtiyaçlarına göre yapılandırma

## 🛠️ **Kurulum**

### **1. Veritabanı Güncellemeleri**

```bash
# SQL güncellemelerini uygulayın
psql "$DATABASE_URL" -f sql/updates/023-team-management-enhancements.sql
```

### **2. Environment Variables**

```env
# Mevcut Supabase ayarları
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### **3. Uygulama Başlatma**

```bash
npm run dev
```

## 📖 **Kullanım Kılavuzu**

### **Takım Oluşturma**

1. **Dashboard** → **Takımlar** bölümüne gidin
2. **"Yeni Takım Oluştur"** butonuna tıklayın
3. Takım bilgilerini doldurun:
   - **Takım Adı** (zorunlu)
   - **Açıklama** (opsiyonel)
   - **Avatar URL** (opsiyonel)
4. **"Takım Oluştur"** butonuna tıklayın

### **Üye Davet Etme**

#### **Tekli Davet**
1. Takım detay sayfasına gidin
2. **"Üyeler"** sekmesine tıklayın
3. **"Üye Davet Et"** butonuna tıklayın
4. E-posta adresini ve rolü girin
5. **"Davet Gönder"** butonuna tıklayın

#### **Toplu Davet**
1. **"Toplu Davet"** butonuna tıklayın
2. Her satıra bir e-posta adresi yazın
3. Varsayılan rolü seçin
4. **"Toplu Davet Gönder"** butonuna tıklayın

### **Üye Yönetimi**

#### **Rol Değiştirme**
1. Üye satırında **⚙️** (ayarlar) ikonuna tıklayın
2. **"Rol Değiştir"** seçeneğini seçin
3. Yeni rolü seçin (Member, Admin)
4. **"Güncelle"** butonuna tıklayın

#### **Üye Çıkarma**
1. Üye satırında **⚙️** (ayarlar) ikonuna tıklayın
2. **"Takımdan Çıkar"** seçeneğini seçin
3. Onay dialogunda **"Çıkar"** butonuna tıklayın

### **Takım Sahipliği Devretme**

1. **"Sahiplik Devret"** bölümünde **"Sahiplik Devret"** butonuna tıklayın
2. Yeni takım sahibini seçin
3. **"Sahipliği Devret"** butonuna tıklayın
4. İşlemi onaylayın

### **Takımdan Ayrılma**

1. **"Takımdan Ayrıl"** bölümünde **"Takımdan Ayrıl"** butonuna tıklayın
2. Onay dialogunda **"Ayrıl"** butonuna tıklayın

## 🔌 **API Referansı**

### **Takım API'si**

```typescript
// Takım oluşturma
createTeam(input: { name: string; description?: string; avatar_url?: string }): Promise<Team>

// Takım güncelleme
updateTeam(input: { team_id: string; name?: string; description?: string; avatar_url?: string }): Promise<Team>

// Takım istatistikleri
getTeamStats(team_id: string): Promise<TeamStats>

// Takım üyeleri
getTeamMembers(team_id: string): Promise<TeamMember[]>
```

### **Üye Yönetimi API'si**

```typescript
// Üye davet etme
inviteToTeam(input: { team_id: string; email: string; role?: TeamRole; message?: string }): Promise<{ invitation: TeamInvitation; inviteUrl: string; teamName?: string }>

// Toplu davet
bulkInviteToTeam(input: { team_id: string; emails: string[]; role?: TeamRole; message?: string }): Promise<{ success: string[]; failed: string[] }>

// Rol değiştirme
updateTeamMemberRole(input: { team_id: string; user_id: string; new_role: TeamRole }): Promise<void>

// Üye çıkarma
removeTeamMember(input: { team_id: string; user_id: string }): Promise<void>

// Sahiplik devretme
transferTeamOwnership(input: { team_id: string; new_owner_id: string }): Promise<void>
```

### **Davet Yönetimi API'si**

```typescript
// Davet iptal etme
revokeTeamInvitation(invitationId: string): Promise<void>

// Davet yeniden gönderme
resendTeamInvitation(invitationId: string): Promise<TeamInvitation>

// Bekleyen davetler
getPendingInvitations(): Promise<TeamInvitation[]>

// Takım davetleri
getTeamInvitations(teamId: string): Promise<TeamInvitation[]>
```

## 🗄️ **Veritabanı Şeması**

### **Teams Tablosu**

```sql
CREATE TABLE public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  avatar_url text,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  primary_project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

### **Team Members Tablosu**

```sql
CREATE TABLE public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member',
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);
```

### **Team Invitations Tablosu**

```sql
CREATE TABLE public.team_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'member',
  token text NOT NULL UNIQUE,
  accepted_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

## 🔒 **Güvenlik**

### **Row Level Security (RLS) Politikaları**

- **Takım Bilgileri**: Sadece takım üyeleri okuyabilir
- **Üye Yönetimi**: Sadece Owner ve Admin'ler yönetebilir
- **Davet Sistemi**: Sadece Owner ve Admin'ler davet gönderebilir
- **Sahiplik Devretme**: Sadece mevcut Owner yapabilir

### **Yetki Kontrolleri**

```typescript
// Takım sahibi kontrolü
const isOwner = team.owner_id === currentUser.id;

// Admin yetkisi kontrolü
const isAdmin = isOwner || (membership?.role === 'admin');

// Üye yönetimi yetkisi
const canManageMembers = isOwner || isAdmin;
```

### **Güvenlik Önlemleri**

- **Token Güvenliği**: Davet token'ları crypto.randomUUID() ile oluşturulur
- **Süre Sınırı**: Davetler 7 gün sonra otomatik olarak geçersiz olur
- **E-posta Doğrulama**: Davet kabul edilirken e-posta adresi kontrol edilir
- **Rol Hiyerarşisi**: Kendi rolünü değiştirme engellenir

## 🎨 **UI/UX Özellikleri**

### **Responsive Tasarım**
- Mobil uyumlu arayüz
- Tablet ve desktop optimizasyonu
- Touch-friendly etkileşimler

### **Modern Bileşenler**
- Shadcn/ui tabanlı tasarım sistemi
- Tutarlı renk paleti ve tipografi
- Smooth animasyonlar ve geçişler

### **Kullanıcı Deneyimi**
- Intuitive navigasyon
- Context-aware aksiyonlar
- Real-time güncellemeler
- Toast bildirimleri

## 🚀 **Gelecek Özellikler**

### **Planlanan Geliştirmeler**
- [ ] Takım şablonları
- [ ] Gelişmiş analitik dashboard
- [ ] Takım performans metrikleri
- [ ] Otomatik rol atama
- [ ] Takım aktivite geçmişi
- [ ] Entegrasyon API'leri

### **Önerilen İyileştirmeler**
- [ ] Bulk üye yönetimi
- [ ] Gelişmiş arama ve filtreleme
- [ ] Takım raporları
- [ ] E-posta şablonları
- [ ] Webhook desteği

## 🐛 **Sorun Giderme**

### **Yaygın Sorunlar**

#### **RLS Hatası**
```bash
# RLS politikalarını yeniden uygulayın
psql "$DATABASE_URL" -f sql/updates/023-team-management-enhancements.sql
```

#### **Yetki Hatası**
- Kullanıcının takım üyesi olduğundan emin olun
- Rol yetkilerini kontrol edin
- Takım sahibi olup olmadığınızı doğrulayın

#### **Davet Hatası**
- E-posta adresinin doğru olduğundan emin olun
- Davet süresinin dolmadığını kontrol edin
- Token'ın geçerli olduğunu doğrulayın

### **Debug Modu**

```typescript
// Console'da debug bilgilerini görüntüleyin
console.log('Team:', team);
console.log('User Role:', userRole);
console.log('Can Edit:', canEdit);
```

## 📞 **Destek**

### **Teknik Destek**
- GitHub Issues: [Proje Repository](https://github.com/KaygusuzBK/yap-next)
- E-posta: [email protected]

### **Dokümantasyon**
- API Docs: `/api/docs`
- Swagger UI: `/api/swagger`
- Postman Collection: `docs/postman/team-management.json`

---

**YAP Takım Yönetimi** - Profesyonel takım yönetimi için modern çözümler 🚀

*Son güncelleme: 2024*
