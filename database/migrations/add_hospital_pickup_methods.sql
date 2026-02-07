-- Add hospital pickup delivery methods
-- Run this migration against the Supabase database

ALTER TYPE delivery_method ADD VALUE IF NOT EXISTS 'hospital_nhsl';
ALTER TYPE delivery_method ADD VALUE IF NOT EXISTS 'hospital_csth';
