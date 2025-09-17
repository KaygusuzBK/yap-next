-- Son aktiviteleri getiren RPC fonksiyonu
CREATE OR REPLACE FUNCTION get_recent_activities(p_limit INTEGER DEFAULT 20)
RETURNS TABLE (
  id TEXT,
  type TEXT,
  user_id UUID,
  user_name TEXT,
  user_email TEXT,
  project_id UUID,
  project_title TEXT,
  task_id UUID,
  task_title TEXT,
  content TEXT,
  details JSONB,
  created_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH all_activities AS (
    -- Görev aktiviteleri
    SELECT 
      ta.id::TEXT as id,
      CASE 
        WHEN ta.action = 'task_created' THEN 'task_created'
        WHEN ta.action = 'task_updated' THEN 'task_updated'
        WHEN ta.action = 'task_completed' THEN 'task_completed'
        WHEN ta.action = 'task_assigned' THEN 'task_assigned'
        ELSE 'task_updated'
      END as type,
      ta.user_id,
      p.full_name as user_name,
      p.email as user_email,
      pt.project_id,
      pr.title as project_title,
      ta.task_id,
      pt.title as task_title,
      NULL::TEXT as content,
      ta.details,
      ta.created_at
    FROM task_activities ta
    LEFT JOIN profiles p ON p.id = ta.user_id
    LEFT JOIN project_tasks pt ON pt.id = ta.task_id
    LEFT JOIN projects pr ON pr.id = pt.project_id
    WHERE EXISTS (
      SELECT 1 FROM projects p2 
      WHERE p2.id = pt.project_id 
      AND (
        p2.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM project_members pm 
          WHERE pm.project_id = p2.id 
          AND pm.user_id = auth.uid()
        ) OR
        EXISTS (
          SELECT 1 FROM teams t 
          WHERE t.id = p2.team_id 
          AND (
            t.owner_id = auth.uid() OR
            EXISTS (
              SELECT 1 FROM team_members tm 
              WHERE tm.team_id = t.id 
              AND tm.user_id = auth.uid()
            )
          )
        )
      )
    )
    
    UNION ALL
    
    -- Görev yorumları
    SELECT 
      tc.id::TEXT as id,
      'task_comment' as type,
      tc.created_by as user_id,
      p.full_name as user_name,
      p.email as user_email,
      pt.project_id,
      pr.title as project_title,
      tc.task_id,
      pt.title as task_title,
      tc.content,
      NULL::JSONB as details,
      tc.created_at
    FROM task_comments tc
    LEFT JOIN profiles p ON p.id = tc.created_by
    LEFT JOIN project_tasks pt ON pt.id = tc.task_id
    LEFT JOIN projects pr ON pr.id = pt.project_id
    WHERE EXISTS (
      SELECT 1 FROM projects p2 
      WHERE p2.id = pt.project_id 
      AND (
        p2.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM project_members pm 
          WHERE pm.project_id = p2.id 
          AND pm.user_id = auth.uid()
        ) OR
        EXISTS (
          SELECT 1 FROM teams t 
          WHERE t.id = p2.team_id 
          AND (
            t.owner_id = auth.uid() OR
            EXISTS (
              SELECT 1 FROM team_members tm 
              WHERE tm.team_id = t.id 
              AND tm.user_id = auth.uid()
            )
          )
        )
      )
    )
    
    UNION ALL
    
    -- Proje yorumları
    SELECT 
      pc.id::TEXT as id,
      'project_comment' as type,
      pc.created_by as user_id,
      p.full_name as user_name,
      p.email as user_email,
      pc.project_id,
      pr.title as project_title,
      NULL::UUID as task_id,
      NULL::TEXT as task_title,
      pc.content,
      NULL::JSONB as details,
      pc.created_at
    FROM project_comments pc
    LEFT JOIN profiles p ON p.id = pc.created_by
    LEFT JOIN projects pr ON pr.id = pc.project_id
    WHERE EXISTS (
      SELECT 1 FROM projects p2 
      WHERE p2.id = pc.project_id 
      AND (
        p2.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM project_members pm 
          WHERE pm.project_id = p2.id 
          AND pm.user_id = auth.uid()
        ) OR
        EXISTS (
          SELECT 1 FROM teams t 
          WHERE t.id = p2.team_id 
          AND (
            t.owner_id = auth.uid() OR
            EXISTS (
              SELECT 1 FROM team_members tm 
              WHERE tm.team_id = t.id 
              AND tm.user_id = auth.uid()
            )
          )
        )
      )
    )
    
    UNION ALL
    
    -- Yeni görevler (sadece oluşturma)
    SELECT 
      pt.id::TEXT as id,
      'task_created' as type,
      pt.created_by as user_id,
      p.full_name as user_name,
      p.email as user_email,
      pt.project_id,
      pr.title as project_title,
      pt.id as task_id,
      pt.title as task_title,
      NULL::TEXT as content,
      NULL::JSONB as details,
      pt.created_at
    FROM project_tasks pt
    LEFT JOIN profiles p ON p.id = pt.created_by
    LEFT JOIN projects pr ON pr.id = pt.project_id
    WHERE EXISTS (
      SELECT 1 FROM projects p2 
      WHERE p2.id = pt.project_id 
      AND (
        p2.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM project_members pm 
          WHERE pm.project_id = p2.id 
          AND pm.user_id = auth.uid()
        ) OR
        EXISTS (
          SELECT 1 FROM teams t 
          WHERE t.id = p2.team_id 
          AND (
            t.owner_id = auth.uid() OR
            EXISTS (
              SELECT 1 FROM team_members tm 
              WHERE tm.team_id = t.id 
              AND tm.user_id = auth.uid()
            )
          )
        )
      )
    )
  )
  SELECT 
    aa.id,
    aa.type,
    aa.user_id,
    aa.user_name,
    aa.user_email,
    aa.project_id,
    aa.project_title,
    aa.task_id,
    aa.task_title,
    aa.content,
    aa.details,
    aa.created_at
  FROM all_activities aa
  ORDER BY aa.created_at DESC
  LIMIT p_limit;
END;
$$;
