-- Migration: Add event_id to order_items to support multiple events in a single order
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES events(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_order_items_event_id ON order_items (event_id);

-- Backfill existing order_items from parent orders
UPDATE order_items oi
SET event_id = o.event_id
FROM orders o
WHERE oi.order_id = o.id
  AND oi.event_id IS NULL
  AND o.event_id IS NOT NULL;
