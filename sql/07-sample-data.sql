-- =====================================================
-- 07. SAMPLE DATA
-- =====================================================
-- Bu dosya test ve geliştirme için örnek veriler ekler
-- Tarih: 2024-01-15
-- Açıklama: Gerçekçi test verileri (kullanıcı oluşturduktan sonra çalıştırın)

-- =====================================================
-- IMPORTANT: READ BEFORE EXECUTING
-- =====================================================
-- Bu dosyayı çalıştırmadan önce:
-- 1. Uygulamada bir kullanıcı oluşturun (register)
-- 2. auth.users tablosundan kullanıcı ID'sini alın
-- 3. Aşağıdaki sorguları kullanıcı ID'si ile güncelleyin

-- =====================================================
-- GET CURRENT USER ID (RUN THIS FIRST)
-- =====================================================
-- Bu sorguyu çalıştırarak mevcut kullanıcı ID'sini alın
-- SELECT id, email, raw_user_meta_data FROM auth.users LIMIT 1;

-- =====================================================
-- SAMPLE PROJECTS
-- =====================================================
-- Sample Project 1: E-ticaret Platformu
INSERT INTO projects (title, description, status, start_date, end_date, budget, progress, owner_id) 
SELECT 
    'E-ticaret Platformu',
    'Modern e-ticaret platformu geliştirme projesi. React, Node.js ve PostgreSQL kullanarak tam özellikli bir online satış platformu.',
    'active',
    '2024-01-15',
    '2024-06-30',
    50000.00,
    35,
    id
FROM auth.users 
WHERE email = (SELECT email FROM auth.users LIMIT 1)
LIMIT 1;

-- Sample Project 2: Mobil Uygulama
INSERT INTO projects (title, description, status, start_date, end_date, budget, progress, owner_id) 
SELECT 
    'Mobil Uygulama',
    'iOS ve Android mobil uygulama geliştirme. React Native ile cross-platform mobil uygulama.',
    'active',
    '2024-02-01',
    '2024-08-15',
    75000.00,
    20,
    id
FROM auth.users 
WHERE email = (SELECT email FROM auth.users LIMIT 1)
LIMIT 1;

-- Sample Project 3: Web Sitesi Yenileme
INSERT INTO projects (title, description, status, start_date, end_date, budget, progress, owner_id) 
SELECT 
    'Web Sitesi Yenileme',
    'Kurumsal web sitesi yenileme projesi. Modern tasarım ve SEO optimizasyonu ile birlikte.',
    'completed',
    '2024-01-01',
    '2024-03-15',
    25000.00,
    100,
    id
FROM auth.users 
WHERE email = (SELECT email FROM auth.users LIMIT 1)
LIMIT 1;

-- Sample Project 4: CRM Sistemi
INSERT INTO projects (title, description, status, start_date, end_date, budget, progress, owner_id) 
SELECT 
    'CRM Sistemi',
    'Müşteri ilişkileri yönetimi sistemi. Müşteri takibi, satış yönetimi ve raporlama özellikleri.',
    'on_hold',
    '2024-03-01',
    '2024-09-30',
    100000.00,
    15,
    id
FROM auth.users 
WHERE email = (SELECT email FROM auth.users LIMIT 1)
LIMIT 1;

-- =====================================================
-- SAMPLE TASKS
-- =====================================================

-- Tasks for E-ticaret Platformu
INSERT INTO tasks (title, description, status, priority, project_id, due_date, estimated_hours, assignee_id) 
SELECT 
    'Veritabanı Tasarımı',
    'E-ticaret platformu için veritabanı şeması oluşturma. Ürün, kullanıcı, sipariş ve ödeme tabloları.',
    'completed',
    'high',
    p.id,
    '2024-02-15',
    16,
    u.id
FROM projects p, auth.users u
WHERE p.title = 'E-ticaret Platformu' 
AND u.email = (SELECT email FROM auth.users LIMIT 1)
LIMIT 1;

INSERT INTO tasks (title, description, status, priority, project_id, due_date, estimated_hours, assignee_id) 
SELECT 
    'Frontend Geliştirme',
    'React ile kullanıcı arayüzü geliştirme. Ürün listesi, sepet, ödeme sayfaları.',
    'in_progress',
    'high',
    p.id,
    '2024-04-30',
    40,
    u.id
FROM projects p, auth.users u
WHERE p.title = 'E-ticaret Platformu' 
AND u.email = (SELECT email FROM auth.users LIMIT 1)
LIMIT 1;

INSERT INTO tasks (title, description, status, priority, project_id, due_date, estimated_hours, assignee_id) 
SELECT 
    'Backend API',
    'Node.js ile REST API geliştirme. Ürün, kullanıcı ve sipariş yönetimi endpointleri.',
    'todo',
    'medium',
    p.id,
    '2024-05-15',
    32,
    u.id
FROM projects p, auth.users u
WHERE p.title = 'E-ticaret Platformu' 
AND u.email = (SELECT email FROM auth.users LIMIT 1)
LIMIT 1;

INSERT INTO tasks (title, description, status, priority, project_id, due_date, estimated_hours, assignee_id, tags) 
SELECT 
    'Ödeme Sistemi Entegrasyonu',
    'Stripe ve PayPal entegrasyonu. Güvenli ödeme işlemleri ve webhook yönetimi.',
    'todo',
    'urgent',
    p.id,
    '2024-05-30',
    24,
    u.id,
    ARRAY['payment', 'integration', 'security']
FROM projects p, auth.users u
WHERE p.title = 'E-ticaret Platformu' 
AND u.email = (SELECT email FROM auth.users LIMIT 1)
LIMIT 1;

-- Tasks for Mobil Uygulama
INSERT INTO tasks (title, description, status, priority, project_id, due_date, estimated_hours, assignee_id) 
SELECT 
    'UI/UX Tasarımı',
    'Mobil uygulama için kullanıcı arayüzü tasarımı. Figma ile wireframe ve mockup hazırlama.',
    'in_progress',
    'high',
    p.id,
    '2024-03-15',
    24,
    u.id
FROM projects p, auth.users u
WHERE p.title = 'Mobil Uygulama' 
AND u.email = (SELECT email FROM auth.users LIMIT 1)
LIMIT 1;

INSERT INTO tasks (title, description, status, priority, project_id, due_date, estimated_hours, assignee_id) 
SELECT 
    'iOS Geliştirme',
    'Swift ile iOS uygulaması geliştirme. App Store için hazırlama ve test.',
    'todo',
    'high',
    p.id,
    '2024-06-30',
    60,
    u.id
FROM projects p, auth.users u
WHERE p.title = 'Mobil Uygulama' 
AND u.email = (SELECT email FROM auth.users LIMIT 1)
LIMIT 1;

INSERT INTO tasks (title, description, status, priority, project_id, due_date, estimated_hours, assignee_id) 
SELECT 
    'Android Geliştirme',
    'Kotlin ile Android uygulaması geliştirme. Google Play Store için hazırlama.',
    'todo',
    'high',
    p.id,
    '2024-07-15',
    60,
    u.id
FROM projects p, auth.users u
WHERE p.title = 'Mobil Uygulama' 
AND u.email = (SELECT email FROM auth.users LIMIT 1)
LIMIT 1;

INSERT INTO tasks (title, description, status, priority, project_id, due_date, estimated_hours, assignee_id, tags) 
SELECT 
    'Push Notification',
    'Firebase ile push notification sistemi. Kullanıcı bildirimleri ve reklam entegrasyonu.',
    'todo',
    'medium',
    p.id,
    '2024-07-30',
    16,
    u.id,
    ARRAY['notifications', 'firebase', 'marketing']
FROM projects p, auth.users u
WHERE p.title = 'Mobil Uygulama' 
AND u.email = (SELECT email FROM auth.users LIMIT 1)
LIMIT 1;

-- Tasks for Web Sitesi Yenileme
INSERT INTO tasks (title, description, status, priority, project_id, due_date, estimated_hours, assignee_id) 
SELECT 
    'Tasarım Revizyonu',
    'Mevcut web sitesi tasarımının modernize edilmesi. Responsive tasarım ve kullanıcı deneyimi iyileştirmeleri.',
    'completed',
    'high',
    p.id,
    '2024-02-01',
    20,
    u.id
FROM projects p, auth.users u
WHERE p.title = 'Web Sitesi Yenileme' 
AND u.email = (SELECT email FROM auth.users LIMIT 1)
LIMIT 1;

INSERT INTO tasks (title, description, status, priority, project_id, due_date, estimated_hours, assignee_id) 
SELECT 
    'SEO Optimizasyonu',
    'Arama motoru optimizasyonu. Meta taglar, sitemap ve performans iyileştirmeleri.',
    'completed',
    'medium',
    p.id,
    '2024-02-15',
    12,
    u.id
FROM projects p, auth.users u
WHERE p.title = 'Web Sitesi Yenileme' 
AND u.email = (SELECT email FROM auth.users LIMIT 1)
LIMIT 1;

INSERT INTO tasks (title, description, status, priority, project_id, due_date, estimated_hours, assignee_id) 
SELECT 
    'İçerik Güncelleme',
    'Web sitesi içeriklerinin güncellenmesi. Yeni sayfalar ve blog yazıları.',
    'completed',
    'low',
    p.id,
    '2024-03-01',
    8,
    u.id
FROM projects p, auth.users u
WHERE p.title = 'Web Sitesi Yenileme' 
AND u.email = (SELECT email FROM auth.users LIMIT 1)
LIMIT 1;

-- Tasks for CRM Sistemi
INSERT INTO tasks (title, description, status, priority, project_id, due_date, estimated_hours, assignee_id, tags) 
SELECT 
    'Veritabanı Analizi',
    'CRM sistemi için veritabanı gereksinimlerinin analizi. Müşteri, satış ve raporlama modülleri.',
    'in_progress',
    'high',
    p.id,
    '2024-04-15',
    20,
    u.id,
    ARRAY['analysis', 'database', 'requirements']
FROM projects p, auth.users u
WHERE p.title = 'CRM Sistemi' 
AND u.email = (SELECT email FROM auth.users LIMIT 1)
LIMIT 1;

INSERT INTO tasks (title, description, status, priority, project_id, due_date, estimated_hours, assignee_id) 
SELECT 
    'Kullanıcı Arayüzü',
    'CRM sistemi için kullanıcı arayüzü tasarımı. Dashboard ve raporlama sayfaları.',
    'todo',
    'high',
    p.id,
    '2024-05-01',
    30,
    u.id
FROM projects p, auth.users u
WHERE p.title = 'CRM Sistemi' 
AND u.email = (SELECT email FROM auth.users LIMIT 1)
LIMIT 1;

-- =====================================================
-- SAMPLE COMMENTS
-- =====================================================

-- Comments for E-ticaret Platformu project
INSERT INTO comments (content, author_id, project_id) 
SELECT 
    'Proje başlangıcı için toplantı planlandı. Tüm ekip üyeleri katılım sağlayacak.',
    u.id,
    p.id
FROM auth.users u, projects p
WHERE u.email = (SELECT email FROM auth.users LIMIT 1)
AND p.title = 'E-ticaret Platformu'
LIMIT 1;

INSERT INTO comments (content, author_id, project_id) 
SELECT 
    'Veritabanı tasarımı tamamlandı. Şema onaylandı ve geliştirmeye başlanabilir.',
    u.id,
    p.id
FROM auth.users u, projects p
WHERE u.email = (SELECT email FROM auth.users LIMIT 1)
AND p.title = 'E-ticaret Platformu'
LIMIT 1;

-- Comments for tasks
INSERT INTO comments (content, author_id, task_id) 
SELECT 
    'Frontend geliştirme için React 18 ve TypeScript kullanacağız.',
    u.id,
    t.id
FROM auth.users u, tasks t
WHERE u.email = (SELECT email FROM auth.users LIMIT 1)
AND t.title = 'Frontend Geliştirme'
LIMIT 1;

INSERT INTO comments (content, author_id, task_id) 
SELECT 
    'Backend için Node.js ve Express.js framework kullanılacak.',
    u.id,
    t.id
FROM auth.users u, tasks t
WHERE u.email = (SELECT email FROM auth.users LIMIT 1)
AND t.title = 'Backend API'
LIMIT 1;

-- =====================================================
-- VERIFICATION
-- =====================================================
-- Verify sample data was inserted successfully
SELECT 'Projects' as table_name, COUNT(*) as count FROM projects
UNION ALL
SELECT 'Tasks' as table_name, COUNT(*) as count FROM tasks
UNION ALL
SELECT 'Comments' as table_name, COUNT(*) as count FROM comments
ORDER BY table_name; 