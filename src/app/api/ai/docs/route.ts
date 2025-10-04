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

    const { type, projectData, customPrompt } = await request.json();

    // Get user's projects and tasks (optional - can work without user)
    let realProjectData = {
      user: { name: 'Kullanıcı', email: 'user@example.com' },
      projects: [],
      tasks: []
    };

    try {
      const user = await getUserCached();
      if (user) {
        const supabase = getSupabase();
        
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

          realProjectData = {
            user: {
              name: user.user_metadata?.name || user.email,
              email: user.email
            },
            projects: projects?.map(p => ({
              id: p.id,
              title: p.title,
              description: p.description,
              status: p.status,
              created_at: p.created_at,
              updated_at: p.updated_at,
              tasks: p.project_tasks?.map(t => ({
                title: t.title,
                status: t.status,
                priority: t.priority,
                due_date: t.due_date
              })) || [],
              members: p.project_members?.map(m => ({
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
    } catch (error) {
      console.log('User data fetch failed, using default data:', error);
    }

    let prompt = '';
    let systemPrompt = '';

    switch (type) {
      case 'project-docs':
        systemPrompt = `Sen bir proje dokümantasyon uzmanısın. Kullanıcının gerçek proje verilerine göre detaylı dokümantasyon oluştur.`;
        
        prompt = `Aşağıdaki kullanıcının gerçek proje verilerine göre kapsamlı dokümantasyon oluştur:

KULLANICI BİLGİLERİ:
- İsim: ${realProjectData.user.name}
- Email: ${realProjectData.user.email}

PROJE VERİLERİ:
${JSON.stringify(realProjectData.projects, null, 2)}

GÖREV VERİLERİ:
${JSON.stringify(realProjectData.tasks, null, 2)}

${customPrompt ? `EK TALİMATLAR: ${customPrompt}` : ''}

Lütfen şunları içeren detaylı dokümantasyon oluştur:
1. Kullanıcının proje portföyü genel bakışı
2. Her projenin detaylı analizi (görevler, üyeler, durum)
3. Görev dağılımı ve öncelik analizi
4. Proje performansı ve ilerleme durumu
5. Takım yapısı ve roller
6. Risk analizi ve öneriler
7. Gelecek planları ve iyileştirme önerileri

Dokümantasyonu Türkçe olarak yaz ve profesyonel bir ton kullan. Gerçek verileri kullanarak spesifik öneriler ver.`;
        break;

      case 'api-docs':
        systemPrompt = `Sen bir API dokümantasyon uzmanısın. Kullanıcının proje verilerine göre API dokümantasyonu oluştur.`;
        
        prompt = `Aşağıdaki kullanıcının proje verilerine göre API dokümantasyonu oluştur:

KULLANICI BİLGİLERİ:
- İsim: ${realProjectData.user.name}
- Email: ${realProjectData.user.email}

PROJE VERİLERİ:
${JSON.stringify(realProjectData.projects, null, 2)}

GÖREV VERİLERİ:
${JSON.stringify(realProjectData.tasks, null, 2)}

${customPrompt ? `EK TALİMATLAR: ${customPrompt}` : ''}

Lütfen şunları içeren API dokümantasyonu oluştur:
1. Proje yönetimi API endpoint'leri
2. Görev yönetimi API endpoint'leri
3. Takım yönetimi API endpoint'leri
4. Request/Response formatları
5. Authentication ve authorization
6. Error handling
7. Rate limiting ve best practices

Dokümantasyonu Türkçe olarak yaz ve profesyonel bir ton kullan.`;
        break;

      case 'user-guide':
        systemPrompt = `Sen bir kullanıcı kılavuzu uzmanısın. Kullanıcının proje verilerine göre kullanım kılavuzu oluştur.`;
        
        prompt = `Aşağıdaki kullanıcının proje verilerine göre kullanım kılavuzu oluştur:

KULLANICI BİLGİLERİ:
- İsim: ${realProjectData.user.name}
- Email: ${realProjectData.user.email}

PROJE VERİLERİ:
${JSON.stringify(realProjectData.projects, null, 2)}

GÖREV VERİLERİ:
${JSON.stringify(realProjectData.tasks, null, 2)}

${customPrompt ? `EK TALİMATLAR: ${customPrompt}` : ''}

Lütfen şunları içeren kullanım kılavuzu oluştur:
1. Proje oluşturma ve yönetimi
2. Görev ekleme ve takip etme
3. Takım üyeleri ile işbirliği
4. Proje durumlarını yönetme
5. Raporlama ve analiz
6. En iyi uygulamalar
7. Sorun giderme

Dokümantasyonu Türkçe olarak yaz ve kullanıcının gerçek projelerine özel örnekler ver.`;
        break;

      default:
        return NextResponse.json({ error: 'Geçersiz dokümantasyon tipi' }, { status: 400 });
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
    console.error('Dokümantasyon oluşturma hatası:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      openaiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY ? 'Present' : 'Missing'
    });
    return NextResponse.json(
      { error: 'Dokümantasyon oluşturulamadı', details: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    );
  }
}
