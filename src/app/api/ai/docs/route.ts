import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { type, projectData, teamData } = await request.json();

    let prompt = '';
    let systemPrompt = '';

    switch (type) {
      case 'project-docs':
        systemPrompt = `Sen bir proje yönetimi uzmanısın. Verilen proje bilgilerine göre kapsamlı dokümantasyon oluştur. 
        Dokümantasyon şunları içermeli:
        - Proje genel bakışı
        - Hedefler ve amaçlar
        - Teknik gereksinimler
        - Takım yapısı
        - Zaman çizelgesi
        - Risk analizi
        - Başarı kriterleri`;
        
        prompt = `Aşağıdaki proje bilgilerine göre profesyonel dokümantasyon oluştur:
        Proje Adı: ${projectData.name}
        Açıklama: ${projectData.description}
        Durum: ${projectData.status}
        Takım: ${projectData.team || 'Kişisel Proje'}
        Oluşturulma Tarihi: ${projectData.createdAt}
        Görevler: ${projectData.tasks?.length || 0} görev`;
        break;

      case 'api-docs':
        systemPrompt = `Sen bir API dokümantasyon uzmanısın. Verilen API endpoint'lerine göre detaylı dokümantasyon oluştur.`;
        
        prompt = `Aşağıdaki API endpoint'leri için dokümantasyon oluştur:
        - /api/projects - Proje yönetimi
        - /api/tasks - Görev yönetimi  
        - /api/teams - Takım yönetimi
        - /api/auth - Kimlik doğrulama
        Her endpoint için HTTP metodları, parametreler, yanıt formatları ve örnekler dahil et.`;
        break;

      case 'user-guide':
        systemPrompt = `Sen bir kullanıcı deneyimi uzmanısın. Proje yönetimi uygulaması için kullanıcı kılavuzu oluştur.`;
        
        prompt = `YAP Proje Yönetimi uygulaması için kapsamlı kullanıcı kılavuzu oluştur. Şunları içermeli:
        - Hesap oluşturma ve giriş
        - Proje oluşturma ve yönetimi
        - Görev ekleme ve takip
        - Takım oluşturma ve üye davet etme
        - Bildirimler ve ayarlar
        - Dashboard kullanımı`;
        break;

      default:
        return NextResponse.json({ error: 'Geçersiz dokümantasyon tipi' }, { status: 400 });
    }

    const result = await generateText({
      model: openai('gpt-4o-mini'),
      system: systemPrompt,
      prompt: prompt,
      maxOutputTokens: 2000,
    });

    return NextResponse.json({ 
      content: result.text,
      type: type,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Dokümantasyon oluşturma hatası:', error);
    return NextResponse.json(
      { error: 'Dokümantasyon oluşturulamadı' }, 
      { status: 500 }
    );
  }
}
