-- project_members için kullanıcıların kendi kayıtlarını SELECT edebilmesi
-- Bu, create_sprint RPC ve sprints INSERT politikalarının EXISTS kontrolleri için gereklidir

ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

-- Çakışabilecek eski politikaları temizlemeden önce yeni politikayı ekleyebiliriz; isim çatışmasını önlemek için DROP IF EXISTS kullanıyoruz
DROP POLICY IF EXISTS "project_members_select_self" ON public.project_members;
CREATE POLICY "project_members_select_self" ON public.project_members
  FOR SELECT USING (user_id = auth.uid());

-- Opsiyonel: INSERT/UPDATE/DELETE politikalarınız ayrı dosyalarda tanımlı; burada sadece SELECT ekleniyor
