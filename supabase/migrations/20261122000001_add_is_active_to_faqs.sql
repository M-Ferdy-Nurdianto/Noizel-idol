-- Add is_active column to faqs table for toggle show/hide per item
ALTER TABLE faqs ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
UPDATE faqs SET is_active = true WHERE is_active IS NULL;
