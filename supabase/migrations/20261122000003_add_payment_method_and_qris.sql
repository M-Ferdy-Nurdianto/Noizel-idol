-- Migration: Add payment_method to orders and support QRIS
-- 1. Add payment_method column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'transfer';

-- 2. Backfill existing orders with 'transfer'
UPDATE orders SET payment_method = 'transfer' WHERE payment_method IS NULL;

-- 3. Ensure merch_orders has payment_method with default 'transfer'
ALTER TABLE merch_orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'transfer';
UPDATE merch_orders SET payment_method = 'transfer' WHERE payment_method IS NULL OR payment_method = 'tf';

-- 4. Create 'payments' storage bucket if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('payments', 'payments', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- 5. Storage RLS policy for payments bucket
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Public Access for Payments' AND tablename = 'objects'
    ) THEN
        CREATE POLICY "Public Access for Payments" ON storage.objects
        FOR SELECT USING (bucket_id = 'payments');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Allow All Operations on Payments' AND tablename = 'objects'
    ) THEN
        CREATE POLICY "Allow All Operations on Payments" ON storage.objects
        FOR ALL USING (bucket_id = 'payments');
    END IF;
END $$;

-- 6. Insert initial QRIS & payment toggle configuration keys if not exists
INSERT INTO config (key, value)
VALUES 
    ('payment_cheki_transfer_active', 'true'),
    ('payment_cheki_qris_active', 'false'),
    ('payment_cheki_qris_image', ''),
    ('payment_merch_transfer_active', 'true'),
    ('payment_merch_qris_active', 'false'),
    ('payment_merch_qris_image', '')
ON CONFLICT (key) DO NOTHING;
