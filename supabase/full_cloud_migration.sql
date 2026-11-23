-- ==============================================================================
-- NOIZE - FULL SUPABASE CLOUD INITIALIZATION & MIGRATION SCRIPT
-- Project: gyrzipnfnxvccakeejky (https://gyrzipnfnxvccakeejky.supabase.co)
-- ==============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Trigger Helper Function (Auto Updated At)
CREATE OR REPLACE FUNCTION update_updated_at_column() 
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. TABLE: admin_users (Autentikasi Staf / Admin)
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Akun Default Utama Noize: admin / admin
INSERT INTO admin_users (username, password_hash, full_name)
VALUES (
    'admin', 
    crypt('admin', gen_salt('bf', 10)), 
    'Admin Noize'
)
ON CONFLICT (username) DO UPDATE 
SET password_hash = EXCLUDED.password_hash, full_name = EXCLUDED.full_name;

-- 2. TABLE: members (Member Profil & Dual Photo System)
CREATE TABLE IF NOT EXISTS members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id VARCHAR(50) UNIQUE NOT NULL,
    nama_panggung VARCHAR(100) NOT NULL,
    tagline VARCHAR(255),
    hadir BOOLEAN DEFAULT true,
    image_url TEXT,
    shop_image_url TEXT,
    silhouette_image_url TEXT,
    color VARCHAR(20) DEFAULT '#9D26FF',
    gradient VARCHAR(100),
    order_index INT DEFAULT 99,
    jikoshoukai TEXT,
    tanggal_lahir VARCHAR(50),
    hobi TEXT,
    instagram VARCHAR(100),
    is_secret BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE members ADD COLUMN IF NOT EXISTS hadir BOOLEAN DEFAULT true;
ALTER TABLE members ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS shop_image_url TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS color VARCHAR(20) DEFAULT '#9D26FF';
ALTER TABLE members ADD COLUMN IF NOT EXISTS gradient VARCHAR(100);
ALTER TABLE members ADD COLUMN IF NOT EXISTS order_index INT DEFAULT 99;
ALTER TABLE members ADD COLUMN IF NOT EXISTS jikoshoukai TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS tanggal_lahir VARCHAR(50);
ALTER TABLE members ADD COLUMN IF NOT EXISTS hobi TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS instagram VARCHAR(100);
ALTER TABLE members ADD COLUMN IF NOT EXISTS is_secret BOOLEAN DEFAULT false;
ALTER TABLE members ADD COLUMN IF NOT EXISTS silhouette_image_url TEXT;

DROP TRIGGER IF EXISTS update_members_updated_at ON members;
CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3. TABLE: member_gallery (Galeri Foto Profil Member)
CREATE TABLE IF NOT EXISTS member_gallery (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. TABLE: events (Jadwal Event, Special Event & Pricing PO/OTS)
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nama VARCHAR(255) NOT NULL,
    tanggal INT NOT NULL,
    bulan VARCHAR(50) NOT NULL,
    tahun INT NOT NULL,
    lokasi TEXT NOT NULL,
    event_time VARCHAR(50),
    cheki_time VARCHAR(50),
    is_past BOOLEAN DEFAULT false,
    is_special BOOLEAN DEFAULT false,
    type VARCHAR(50) DEFAULT 'regular',
    theme_name VARCHAR(100),
    theme_color VARCHAR(20),
    event_date DATE,
    deskripsi TEXT,
    harga_cheki_po INT,
    harga_cheki_ots INT,
    ots_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE events ADD COLUMN IF NOT EXISTS event_time VARCHAR(50);
ALTER TABLE events ADD COLUMN IF NOT EXISTS cheki_time VARCHAR(50);
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_past BOOLEAN DEFAULT false;
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_special BOOLEAN DEFAULT false;
ALTER TABLE events ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'regular';
ALTER TABLE events ADD COLUMN IF NOT EXISTS theme_name VARCHAR(100);
ALTER TABLE events ADD COLUMN IF NOT EXISTS theme_color VARCHAR(20);
ALTER TABLE events ADD COLUMN IF NOT EXISTS event_date DATE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS deskripsi TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS harga_cheki_po INT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS harga_cheki_ots INT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS ots_enabled BOOLEAN DEFAULT true;

DROP TRIGGER IF EXISTS update_events_updated_at ON events;
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. TABLE: event_lineup (Relasi Member yang Tampil di Event)
CREATE TABLE IF NOT EXISTS event_lineup (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, member_id)
);

-- 6. TABLE: event_gallery (Galeri Dokumentasi Event)
CREATE TABLE IF NOT EXISTS event_gallery (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    tipe VARCHAR(50),
    path TEXT NOT NULL,
    kredit VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. TABLE: merch_batches (Sistem Batch Merchandise / PO)
CREATE TABLE IF NOT EXISTS merch_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nama VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    open_at TIMESTAMP WITH TIME ZONE,
    close_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

DROP TRIGGER IF EXISTS update_merch_batches_updated_at ON merch_batches;
CREATE TRIGGER update_merch_batches_updated_at BEFORE UPDATE ON merch_batches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE UNIQUE INDEX IF NOT EXISTS idx_merch_batches_single_active 
ON merch_batches (is_active) 
WHERE is_active = true;

-- 8. TABLE: merchandise (Katalog Merchandise Resmi)
CREATE TABLE IF NOT EXISTS merchandise (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nama VARCHAR(255) NOT NULL,
    deskripsi TEXT,
    harga BIGINT NOT NULL,
    stok INT DEFAULT 0,
    gambar_url TEXT,
    available BOOLEAN DEFAULT true,
    urutan INT DEFAULT 0,
    category TEXT DEFAULT 'accessory',
    is_po BOOLEAN DEFAULT false,
    badge VARCHAR(50) DEFAULT NULL,
    images JSONB DEFAULT '[]'::jsonb,
    variants JSONB DEFAULT '[]'::jsonb,
    sizes JSONB DEFAULT '["S", "M", "L", "XL", "XXL"]'::jsonb,
    size_chart_urls JSONB DEFAULT '[]'::jsonb,
    batch_id UUID REFERENCES merch_batches(id) ON DELETE SET NULL,
    jumbo_start_size VARCHAR(20) DEFAULT NULL,
    jumbo_increment_price INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE merchandise ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'accessory';
ALTER TABLE merchandise ADD COLUMN IF NOT EXISTS is_po BOOLEAN DEFAULT false;
ALTER TABLE merchandise ADD COLUMN IF NOT EXISTS badge VARCHAR(50) DEFAULT NULL;
ALTER TABLE merchandise ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;
ALTER TABLE merchandise ADD COLUMN IF NOT EXISTS variants JSONB DEFAULT '[]'::jsonb;
ALTER TABLE merchandise ADD COLUMN IF NOT EXISTS sizes JSONB DEFAULT '["S", "M", "L", "XL", "XXL"]'::jsonb;
ALTER TABLE merchandise ADD COLUMN IF NOT EXISTS size_chart_urls JSONB DEFAULT '[]'::jsonb;
ALTER TABLE merchandise ADD COLUMN IF NOT EXISTS available BOOLEAN DEFAULT true;
ALTER TABLE merchandise ADD COLUMN IF NOT EXISTS urutan INT DEFAULT 0;
ALTER TABLE merchandise ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES merch_batches(id) ON DELETE SET NULL;
ALTER TABLE merchandise ADD COLUMN IF NOT EXISTS jumbo_start_size VARCHAR(20) DEFAULT NULL;
ALTER TABLE merchandise ADD COLUMN IF NOT EXISTS jumbo_increment_price INT DEFAULT 0;

DROP TRIGGER IF EXISTS update_merchandise_updated_at ON merchandise;
CREATE TRIGGER update_merchandise_updated_at BEFORE UPDATE ON merchandise
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. TABLE: merch_orders (Pesanan Merchandise)
CREATE TABLE IF NOT EXISTS merch_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    nama_lengkap VARCHAR(255),
    whatsapp VARCHAR(100) NOT NULL,
    instagram VARCHAR(100),
    catatan TEXT,
    total_harga INT NOT NULL DEFAULT 0,
    payment_proof_url TEXT,
    payment_method TEXT DEFAULT 'transfer',
    shipping_address TEXT,
    batch_id UUID REFERENCES merch_batches(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE merch_orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'transfer';
ALTER TABLE merch_orders ADD COLUMN IF NOT EXISTS shipping_address TEXT;
ALTER TABLE merch_orders ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES merch_batches(id) ON DELETE SET NULL;

DROP TRIGGER IF EXISTS update_merch_orders_updated_at ON merch_orders;
CREATE TRIGGER update_merch_orders_updated_at BEFORE UPDATE ON merch_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. TABLE: merch_order_items (Detail Item Merchandise per Pesanan)
CREATE TABLE IF NOT EXISTS merch_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merch_order_id UUID REFERENCES merch_orders(id) ON DELETE CASCADE,
    merchandise_id UUID REFERENCES merchandise(id) ON DELETE SET NULL,
    item_name VARCHAR(255) NOT NULL,
    harga INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    size VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. TABLE: orders (Transaksi Pemesanan Tiket Cheki Online & OTS)
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    member_id UUID REFERENCES members(id) ON DELETE SET NULL,
    nama_lengkap VARCHAR(255) NOT NULL,
    whatsapp VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    instagram VARCHAR(100),
    total_harga INT NOT NULL,
    payment_proof_url TEXT,
    payment_method TEXT DEFAULT 'transfer',
    status VARCHAR(50) DEFAULT 'pending',
    is_ots BOOLEAN DEFAULT false,
    created_by VARCHAR(50) DEFAULT 'customer',
    catatan TEXT,
    jenis_sesi VARCHAR(255) DEFAULT '2-Shot Cheki',
    quantity INT DEFAULT 1,
    price INT DEFAULT 25000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_ots BOOLEAN DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS created_by VARCHAR(50) DEFAULT 'customer';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS catatan TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES events(id) ON DELETE CASCADE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS member_id UUID REFERENCES members(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS jenis_sesi VARCHAR(255) DEFAULT '2-Shot Cheki';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS quantity INT DEFAULT 1;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS price INT DEFAULT 25000;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'transfer';

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 12. TABLE: order_items (Detail Item Tiket per Transaksi)
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    member_id UUID REFERENCES members(id) ON DELETE SET NULL,
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    item_name VARCHAR(255) NOT NULL,
    price INT NOT NULL,
    quantity INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE order_items ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES events(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_order_items_event_id ON order_items (event_id);

-- 13. TABLE: config (Pengaturan Web, Harga PO & OTS, Rekening, Maintenance, Hero)
CREATE TABLE IF NOT EXISTS config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

DROP TRIGGER IF EXISTS update_config_updated_at ON config;
CREATE TRIGGER update_config_updated_at BEFORE UPDATE ON config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Konfigurasi Awal Noize
INSERT INTO config (key, value)
VALUES 
    ('harga_cheki_per_member', '30000'),
    ('harga_cheki_grup', '40000'),
    ('harga_ots_per_member', '35000'),
    ('harga_ots_grup', '45000'),
    ('payment_bank', 'BCA'),
    ('payment_rekening', '1234567890'),
    ('payment_atas_nama', 'Noize Official'),
    ('payment_cheki_transfer_active', 'true'),
    ('payment_cheki_qris_active', 'false'),
    ('payment_cheki_qris_image', ''),
    ('payment_merch_transfer_active', 'true'),
    ('payment_merch_qris_active', 'false'),
    ('payment_merch_qris_image', ''),
    ('maintenance_mode', 'false'),
    ('maintenance_message', 'Noize portal is currently under maintenance. Please check back shortly.'),
    ('maintenance_estimated_end', ''),
    ('hero_settings', '{"title":"NOIZE","subtitle":"MUSIC PROJECT","tagline":"Official Cyber & Music Portal","titleColor":"#FFFFFF","subtitleColor":"#24C6F5","taglineColor":"#FFFFFF","members":[]}')
ON CONFLICT (key) DO NOTHING;

-- 14. TABLE: faqs (Pertanyaan Umum & Jawaban)
CREATE TABLE IF NOT EXISTS faqs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tanya TEXT NOT NULL,
    jawab TEXT NOT NULL,
    urutan INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE faqs ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

DROP TRIGGER IF EXISTS update_faqs_updated_at ON faqs;
CREATE TRIGGER update_faqs_updated_at BEFORE UPDATE ON faqs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 15. FUNCTIONS
CREATE OR REPLACE FUNCTION activate_merch_batch(target_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.merch_batches SET is_active = false WHERE is_active = true AND id != target_id;
    UPDATE public.merch_batches SET is_active = true WHERE id = target_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION duplicate_merch_product(source_id UUID, target_batch_id UUID)
RETURNS UUID AS $$
DECLARE
    new_product_id UUID;
BEGIN
    INSERT INTO public.merchandise (
        nama,
        deskripsi,
        harga,
        stok,
        gambar_url,
        available,
        urutan,
        sizes,
        size_chart_urls,
        category,
        is_po,
        badge,
        images,
        variants,
        batch_id,
        jumbo_start_size,
        jumbo_increment_price
    )
    SELECT
        nama,
        deskripsi,
        harga,
        0,
        gambar_url,
        available,
        urutan,
        sizes,
        size_chart_urls,
        category,
        is_po,
        badge,
        images,
        variants,
        target_batch_id,
        jumbo_start_size,
        jumbo_increment_price
    FROM public.merchandise
    WHERE id = source_id
    RETURNING id INTO new_product_id;

    RETURN new_product_id;
END;
$$ LANGUAGE plpgsql;

-- 16. INDEXES
CREATE INDEX IF NOT EXISTS idx_members_member_id ON members(member_id);
CREATE INDEX IF NOT EXISTS idx_members_hadir ON members(hadir);
CREATE INDEX IF NOT EXISTS idx_member_gallery_member_id ON member_gallery(member_id);
CREATE INDEX IF NOT EXISTS idx_events_is_past ON events(is_past);
CREATE INDEX IF NOT EXISTS idx_events_is_special ON events(is_special);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(tahun DESC, tanggal DESC);
CREATE INDEX IF NOT EXISTS idx_event_lineup_event ON event_lineup(event_id);
CREATE INDEX IF NOT EXISTS idx_event_lineup_member ON event_lineup(member_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_event_id ON orders(event_id);
CREATE INDEX IF NOT EXISTS idx_orders_is_ots ON orders(is_ots);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_member_id ON order_items(member_id);
CREATE INDEX IF NOT EXISTS idx_merch_batches_active ON merch_batches(is_active);
CREATE INDEX IF NOT EXISTS idx_merchandise_batch_id ON merchandise(batch_id);
CREATE INDEX IF NOT EXISTS idx_merch_orders_batch_id ON merch_orders(batch_id);
CREATE INDEX IF NOT EXISTS idx_merch_available ON merchandise(available);
CREATE INDEX IF NOT EXISTS idx_merch_orders_status ON merch_orders(status);
CREATE INDEX IF NOT EXISTS idx_merch_orders_created ON merch_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_merch_order_items_order ON merch_order_items(merch_order_id);

-- 17. STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public) VALUES 
    ('members', 'members', true),
    ('products', 'products', true),
    ('receipts', 'receipts', true),
    ('payment-proofs', 'payment-proofs', true),
    ('payments', 'payments', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- 18. ROW LEVEL SECURITY (RLS) & ACCESS POLICIES
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_lineup ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchandise ENABLE ROW LEVEL SECURITY;
ALTER TABLE merch_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE config ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE merch_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE merch_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    -- Public Read Policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'members' AND policyname = 'Allow public read members') THEN
        CREATE POLICY "Allow public read members" ON members FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'member_gallery' AND policyname = 'Allow public read member_gallery') THEN
        CREATE POLICY "Allow public read member_gallery" ON member_gallery FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'events' AND policyname = 'Allow public read events') THEN
        CREATE POLICY "Allow public read events" ON events FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'event_lineup' AND policyname = 'Allow public read event_lineup') THEN
        CREATE POLICY "Allow public read event_lineup" ON event_lineup FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'event_gallery' AND policyname = 'Allow public read event_gallery') THEN
        CREATE POLICY "Allow public read event_gallery" ON event_gallery FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'merchandise' AND policyname = 'Allow public read merchandise') THEN
        CREATE POLICY "Allow public read merchandise" ON merchandise FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'merch_batches' AND policyname = 'Allow public read merch_batches') THEN
        CREATE POLICY "Allow public read merch_batches" ON merch_batches FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'config' AND policyname = 'Allow public read config') THEN
        CREATE POLICY "Allow public read config" ON config FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'faqs' AND policyname = 'Allow public read faqs') THEN
        CREATE POLICY "Allow public read faqs" ON faqs FOR SELECT USING (true);
    END IF;

    -- Public Insert Policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Public can create orders') THEN
        CREATE POLICY "Public can create orders" ON orders FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'order_items' AND policyname = 'Public can create order items') THEN
        CREATE POLICY "Public can create order items" ON order_items FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'merch_orders' AND policyname = 'Public can create merch orders') THEN
        CREATE POLICY "Public can create merch orders" ON merch_orders FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'merch_order_items' AND policyname = 'Public can create merch order items') THEN
        CREATE POLICY "Public can create merch order items" ON merch_order_items FOR INSERT WITH CHECK (true);
    END IF;

    -- Storage Objects Policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Allow public read members bucket') THEN
        CREATE POLICY "Allow public read members bucket" ON storage.objects FOR SELECT USING (bucket_id = 'members');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Allow public read products bucket') THEN
        CREATE POLICY "Allow public read products bucket" ON storage.objects FOR SELECT USING (bucket_id = 'products');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Allow public read receipts bucket') THEN
        CREATE POLICY "Allow public read receipts bucket" ON storage.objects FOR SELECT USING (bucket_id = 'receipts');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Allow public read payment proofs bucket') THEN
        CREATE POLICY "Allow public read payment proofs bucket" ON storage.objects FOR SELECT USING (bucket_id = 'payment-proofs');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Public Access for Payments') THEN
        CREATE POLICY "Public Access for Payments" ON storage.objects FOR SELECT USING (bucket_id = 'payments');
    END IF;
END $$;


-- 19. TABLE: ip_bans (Rate Limiter Persistence)
CREATE TABLE IF NOT EXISTS public.ip_bans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip VARCHAR(100) UNIQUE NOT NULL,
    banned_until TIMESTAMP WITH TIME ZONE NOT NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ip_bans_ip ON public.ip_bans(ip);
CREATE INDEX IF NOT EXISTS idx_ip_bans_banned_until ON public.ip_bans(banned_until);

ALTER TABLE public.ip_bans ENABLE ROW LEVEL SECURITY;
