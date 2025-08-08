#!/bin/bash

# RLS düzeltme scripti
# Bu script project_members tablosundaki sonsuz döngü sorununu çözer

echo "RLS düzeltme scripti başlatılıyor..."

# DATABASE_URL kontrolü
if [ -z "$DATABASE_URL" ]; then
    echo "HATA: DATABASE_URL environment değişkeni ayarlanmamış!"
    echo "Kullanım: DATABASE_URL=postgres://user:pass@host:5432/dbname bash sql/fix-rls.sh"
    exit 1
fi

echo "Veritabanına bağlanılıyor..."
echo "project_members tablosundaki RLS politikaları temizleniyor..."

# SQL dosyasını çalıştır
psql "$DATABASE_URL" -f sql/fix-project-members-rls.sql

if [ $? -eq 0 ]; then
    echo "✅ RLS düzeltmesi başarıyla tamamlandı!"
    echo "project_members tablosundaki sonsuz döngü sorunu çözüldü."
else
    echo "❌ RLS düzeltmesi başarısız oldu!"
    exit 1
fi
