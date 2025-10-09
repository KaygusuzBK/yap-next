import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { getUserCached } from '@/lib/auth-cache';

export async function POST(request: NextRequest) {
  try {
    // Check if Google AI API key is available
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      console.error('Google AI API key not found');
      return NextResponse.json({ error: 'Google AI API key not configured' }, { status: 500 });
    }

    const { type, teamData, projectData, meetingData } = await request.json();

    // Get user's teams, projects and tasks (optional - can work without user)
    let realTeamData: any = {
      user: { name: 'Kullanıcı', email: 'user@example.com' },
      teams: [],
      projects: [],
      tasks: []
    };

    try {
      const user = await getUserCached();
      if (user) {
        const supabase = getSupabase();
        
        // Fetch user's teams
        const { data: teams, error: teamsError } = await supabase
          .from('teams')
          .select(`
            *,
            team_members (
              user_id,
              role,
              profiles (
                name,
                email
              )
            )
          `)
          .or(`owner_id.eq.${user.id},team_members.user_id.eq.${user.id}`)
          .order('created_at', { ascending: false });

        if (!teamsError && teams) {
          // Fetch user's projects
          const { data: projects, error: projectsError } = await supabase
            .from('projects')
            .select(`
              *,
              project_tasks (
                id,
                title,
                description,
                status,
                priority,
                due_date,
                assigned_to,
                created_at
              ),
              project_members (
                user_id,
                role,
                profiles (
                  name
                )
              )
            `)
            .or(`owner_id.eq.${user.id},project_members.user_id.eq.${user.id}`)
            .order('created_at', { ascending: false });

          if (!projectsError && projects) {
            // Get user's tasks
            const { data: tasks, error: tasksError } = await supabase
              .from('project_tasks')
              .select(`
                *,
                projects (
                  title,
                  description
                )
              `)
              .or(`assigned_to.eq.${user.id},created_by.eq.${user.id}`)
              .order('created_at', { ascending: false });

            realTeamData = {
              user: {
                name: user.user_metadata?.name || user.email || 'Unknown User',
                email: user.email || 'unknown@example.com'
              },
              teams: teams?.map(t => ({
                id: t.id,
                name: t.name,
                description: t.description,
                created_at: t.created_at,
                members: t.team_members?.map((m: any) => ({
                  name: m.profiles?.name,
                  email: m.profiles?.email,
                  role: m.role
                })) || []
              })) || [],
              projects: projects?.map(p => ({
                id: p.id,
                title: p.title,
                description: p.description,
                status: p.status,
                created_at: p.created_at,
                tasks: p.project_tasks?.map((t: any) => ({
                  title: t.title,
                  status: t.status,
                  priority: t.priority,
                  due_date: t.due_date,
                  assigned_to: t.assigned_to
                })) || [],
                members: p.project_members?.map((m: any) => ({
                  name: m.profiles?.name,
                  role: m.role
                })) || []
              })) || [],
              tasks: tasks?.map(t => ({
                id: t.id,
                title: t.title,
                description: t.description,
                status: t.status,
                priority: t.priority,
                due_date: t.due_date,
                project_title: t.projects?.title
              })) || []
            };
          }
        }
      }
    } catch (error) {
      console.log('User data fetch failed, using default data:', error);
    }

    let prompt = '';
    let systemPrompt = '';

    switch (type) {
      case 'performance-analysis':
        systemPrompt = `Sen bir takım performans analizi uzmanısın. Kullanıcının gerçek takım ve proje verilerine göre detaylı analiz oluştur.`;
        
        prompt = `Aşağıdaki kullanıcının gerçek takım ve proje verilerine göre performans analizi oluştur:

KULLANICI BİLGİLERİ:
- İsim: ${realTeamData.user.name}
- Email: ${realTeamData.user.email}

TAKIM VERİLERİ:
${JSON.stringify(realTeamData.teams, null, 2)}

PROJE VERİLERİ:
${JSON.stringify(realTeamData.projects, null, 2)}

GÖREV VERİLERİ:
${JSON.stringify(realTeamData.tasks, null, 2)}

Lütfen şunları içeren detaylı performans analizi oluştur:
1. Takım performansı genel değerlendirmesi
2. Proje başarı oranları ve ilerleme durumu
3. Görev tamamlama istatistikleri
4. Takım üyelerinin katkı analizi
5. Performans göstergeleri ve metrikler
6. Güçlü yönler ve iyileştirme alanları
7. Spesifik öneriler ve aksiyon planları

Analizi Türkçe olarak yaz ve profesyonel bir ton kullan. Gerçek verileri kullanarak spesifik öneriler ver.`;
        break;

      case 'workload-optimization':
        systemPrompt = `Sen bir iş yükü optimizasyonu uzmanısın. Kullanıcının gerçek takım ve proje verilerine göre optimizasyon önerileri oluştur.`;
        
        prompt = `Aşağıdaki kullanıcının gerçek takım ve proje verilerine göre iş yükü optimizasyonu analizi oluştur:

KULLANICI BİLGİLERİ:
- İsim: ${realTeamData.user.name}
- Email: ${realTeamData.user.email}

TAKIM VERİLERİ:
${JSON.stringify(realTeamData.teams, null, 2)}

PROJE VERİLERİ:
${JSON.stringify(realTeamData.projects, null, 2)}

GÖREV VERİLERİ:
${JSON.stringify(realTeamData.tasks, null, 2)}

Lütfen şunları içeren detaylı optimizasyon analizi oluştur:
1. Mevcut iş yükü dağılımı analizi
2. Takım üyelerinin kapasite değerlendirmesi
3. Görev öncelikleri ve zamanlama optimizasyonu
4. Kaynak tahsisi önerileri
5. Darboğazların tespiti ve çözüm önerileri
6. Verimlilik artırma stratejileri
7. Uygulanabilir aksiyon planları

Analizi Türkçe olarak yaz ve profesyonel bir ton kullan. Gerçek verileri kullanarak spesifik öneriler ver.`;
        break;

      case 'meeting-summary':
        systemPrompt = `Sen bir toplantı özeti uzmanısın. Verilen toplantı verilerine göre detaylı özet oluştur.`;
        
        prompt = `Aşağıdaki toplantı verilerine göre detaylı özet oluştur:

KULLANICI BİLGİLERİ:
- İsim: ${realTeamData.user.name}
- Email: ${realTeamData.user.email}

TOPLANTI VERİLERİ:
${JSON.stringify(meetingData, null, 2)}

TAKIM VERİLERİ:
${JSON.stringify(realTeamData.teams, null, 2)}

PROJE VERİLERİ:
${JSON.stringify(realTeamData.projects, null, 2)}

Lütfen şunları içeren detaylı toplantı özeti oluştur:
1. Toplantı genel bakışı ve katılımcılar
2. Gündem maddeleri ve tartışılan konular
3. Alınan kararlar ve sonuçlar
4. Aksiyon maddeleri ve sorumlular
5. Takip edilecek konular
6. Sonraki adımlar ve zaman çizelgesi
7. Önemli notlar ve hatırlatmalar

Özeti Türkçe olarak yaz ve profesyonel bir ton kullan.`;
        break;

      default:
        return NextResponse.json({ error: 'Geçersiz analiz tipi' }, { status: 400 });
    }

    const result = await generateText({
      model: google('gemini-2.5-flash-lite'),
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
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      googleKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY ? 'Present' : 'Missing'
    });
    return NextResponse.json(
      { error: 'Analiz oluşturulamadı', details: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    );
  }
}