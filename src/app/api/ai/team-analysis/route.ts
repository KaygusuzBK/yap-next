import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { type, teamData, projectData, meetingData } = await request.json();

    let prompt = '';
    let systemPrompt = '';

    switch (type) {
      case 'performance-analysis':
        systemPrompt = `Sen bir takım performans analisti uzmanısın. Verilen takım verilerine göre detaylı performans analizi yap.`;
        
        prompt = `Aşağıdaki takım verilerine göre performans analizi yap:
        Takım Adı: ${teamData.name}
        Üye Sayısı: ${teamData.memberCount}
        Aktif Projeler: ${teamData.activeProjects}
        Tamamlanan Görevler: ${teamData.completedTasks}
        Ortalama Görev Süresi: ${teamData.avgTaskDuration || 'Veri yok'}
        Takım Üretkenliği: ${teamData.productivity || 'Veri yok'}
        
        Analiz şunları içermeli:
        - Genel performans değerlendirmesi
        - Güçlü yönler
        - İyileştirme alanları
        - Öneriler
        - Hedefler`;
        break;

      case 'workload-optimization':
        systemPrompt = `Sen bir iş yükü optimizasyon uzmanısın. Takım üyelerinin iş yüklerini analiz et ve optimizasyon önerileri sun.`;
        
        prompt = `Aşağıdaki takım üyelerinin iş yükü verilerine göre optimizasyon analizi yap:
        ${teamData.members?.map((member: any) => 
          `- ${member.name}: ${member.activeTasks} aktif görev, ${member.completedTasks} tamamlanan görev`
        ).join('\n')}
        
        Analiz şunları içermeli:
        - Mevcut iş yükü dağılımı
        - Aşırı yüklenen üyeler
        - Boşta kalan üyeler
        - Yeniden dağıtım önerileri
        - Verimlilik artırma stratejileri`;
        break;

      case 'meeting-summary':
        systemPrompt = `Sen bir toplantı uzmanısın. Verilen toplantı verilerine göre profesyonel toplantı özeti oluştur.`;
        
        prompt = `Aşağıdaki toplantı verilerine göre özet oluştur:
        Toplantı Konusu: ${meetingData.topic}
        Katılımcılar: ${meetingData.participants}
        Süre: ${meetingData.duration}
        Tarih: ${meetingData.date}
        Gündem Maddeleri: ${meetingData.agenda}
        Alınan Kararlar: ${meetingData.decisions}
        Aksiyon Maddeleri: ${meetingData.actionItems}
        
        Özet şunları içermeli:
        - Toplantı genel bakışı
        - Önemli noktalar
        - Alınan kararlar
        - Aksiyon maddeleri ve sorumluları
        - Sonraki adımlar`;
        break;

      default:
        return NextResponse.json({ error: 'Geçersiz analiz tipi' }, { status: 400 });
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
    console.error('Takım analizi hatası:', error);
    return NextResponse.json(
      { error: 'Analiz oluşturulamadı' }, 
      { status: 500 }
    );
  }
}
