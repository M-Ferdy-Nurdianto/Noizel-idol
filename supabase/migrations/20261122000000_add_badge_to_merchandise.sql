-- Migration: Add badge column to merchandise table
ALTER TABLE merchandise ADD COLUMN IF NOT EXISTS badge VARCHAR(50) DEFAULT NULL;
