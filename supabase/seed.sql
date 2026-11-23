-- ==============================================================================
-- NOIZE LOCAL SEED DATA
-- Pure minimal initialization. Admin user: admin / admin
-- ==============================================================================

SET session_replication_role = 'replica';

-- Admin User: admin / admin
INSERT INTO public."admin_users" ("id", "username", "password_hash", "full_name", "created_at") 
VALUES (
    'b8b67422-502d-48d0-b517-a75ec1146ccf', 
    'admin', 
    crypt('admin', gen_salt('bf', 10)), 
    'Admin Noize', 
    CURRENT_TIMESTAMP
) ON CONFLICT (username) DO UPDATE 
SET password_hash = EXCLUDED.password_hash, full_name = EXCLUDED.full_name;

-- Minimal system config to ensure server and client don't crash
INSERT INTO public."config" ("key", "value", "updated_at") VALUES 
('payment_bank', 'BCA', CURRENT_TIMESTAMP),
('payment_rekening', '-', CURRENT_TIMESTAMP),
('payment_atas_nama', 'NOIZE', CURRENT_TIMESTAMP),
('harga_cheki_grup', '0', CURRENT_TIMESTAMP),
('harga_cheki_per_member', '0', CURRENT_TIMESTAMP),
('harga_ots_grup', '0', CURRENT_TIMESTAMP),
('harga_ots_per_member', '0', CURRENT_TIMESTAMP),
('maintenance_mode', 'false', CURRENT_TIMESTAMP),
('maintenance_message', '', CURRENT_TIMESTAMP),
('maintenance_estimated_end', '', CURRENT_TIMESTAMP),
('hero_settings', '{"title":"NOIZE","subtitle":"","tagline":"","titleColor":"#FFFFFF","subtitleColor":"#24C6F5","taglineColor":"#FFFFFF","members":[]}', CURRENT_TIMESTAMP)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

SET session_replication_role = 'origin';
