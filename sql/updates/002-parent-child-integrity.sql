-- =====================================================
-- 002 - Parent-Child Integrity & Self-Loop Prevention
-- =====================================================
-- Tarih: 2025-08-07
-- Açıklama: Parent-child ilişkilerinde döngüsel referansları engelleyen trigger ve constraint'ler

-- 1. TASKS tablosunda parent_task_id için self-loop engelleme
CREATE OR REPLACE FUNCTION prevent_task_self_loop()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.parent_task_id = NEW.id THEN
        RAISE EXCEPTION 'Bir görev kendisini parent olarak gösteremez!';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_task_self_loop ON tasks;
CREATE TRIGGER trg_prevent_task_self_loop
    BEFORE INSERT OR UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION prevent_task_self_loop();

-- 2. COMMENTS tablosunda parent_comment_id için self-loop engelleme
CREATE OR REPLACE FUNCTION prevent_comment_self_loop()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.parent_comment_id = NEW.id THEN
        RAISE EXCEPTION 'Bir yorum kendisini parent olarak gösteremez!';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_comment_self_loop ON comments;
CREATE TRIGGER trg_prevent_comment_self_loop
    BEFORE INSERT OR UPDATE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION prevent_comment_self_loop();

-- NOT: Daha ileri seviye döngü kontrolü için recursive CTE ile zincir kontrolü eklenebilir.
