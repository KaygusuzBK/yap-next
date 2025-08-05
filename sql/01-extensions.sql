-- =====================================================
-- 01. POSTGRESQL EXTENSIONS
-- =====================================================
-- Bu dosya PostgreSQL extensions'larını kurar
-- Tarih: 2024-01-15
-- Açıklama: UUID generation için gerekli extension

-- Enable UUID extension for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto for additional cryptographic functions (optional)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Verify extensions are installed
SELECT extname, extversion FROM pg_extension WHERE extname IN ('uuid-ossp', 'pgcrypto'); 