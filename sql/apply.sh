#!/bin/bash

# SQL dosyalarını doğru sırayla uygula
# Bu script, veritabanı şemasını adım adım kurar

set -e  # Hata durumunda dur

# DATABASE_URL kontrolü
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL is not set. Please set it first:"
    echo "export DATABASE_URL='postgres://user:pass@host:5432/dbname'"
    exit 1
fi

echo "🚀 Starting database setup..."
echo "📊 Database URL: ${DATABASE_URL:0:20}..."

# 1. Temel Kurulum
echo "📋 Step 1: Basic Setup"
echo "   - Initial setup..."
psql "$DATABASE_URL" -f sql/00-initial-setup.sql

echo "   - Functions..."
psql "$DATABASE_URL" -f sql/00_functions.sql

echo "   - Tables..."
psql "$DATABASE_URL" -f sql/01_tables.sql

echo "   - RLS policies..."
psql "$DATABASE_URL" -f sql/02_rls.sql

# 2. Takım Yönetimi
echo "👥 Step 2: Team Management"
echo "   - Teams..."
psql "$DATABASE_URL" -f sql/04_teams.sql

# 3. Proje Yönetimi
echo "📁 Step 3: Project Management"
echo "   - Projects..."
psql "$DATABASE_URL" -f sql/05_projects.sql

# 4. Görev Yönetimi
echo "✅ Step 4: Task Management"
echo "   - Tasks (main structures)..."
psql "$DATABASE_URL" -f sql/06_tasks_complete.sql

echo "   - Tasks (updates and triggers)..."
psql "$DATABASE_URL" -f sql/10_task_management_complete.sql

echo "🎉 Database setup completed successfully!"
echo ""
echo "📝 Next steps:"
echo "1. Start your application: npm run dev"
echo "2. Test task creation and assignment features"
echo "3. Check the sidebar task list"
echo "4. Test the task detail page"
echo ""
echo "🐛 If you encounter RLS errors, run: ./sql/fix-rls.sh"
