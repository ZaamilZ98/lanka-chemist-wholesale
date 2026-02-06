-- Store Settings Configuration
-- Run this in your Supabase SQL Editor after deployment

INSERT INTO store_settings (key, value) VALUES
('store_name', 'Lanka Chemist'),
('store_latitude', '6.9271'),   -- Colombo coordinates (update with your actual location)
('store_longitude', '79.8612'),  -- Colombo coordinates (update with your actual location)
('store_address', 'Your Store Address, Colombo, Sri Lanka'),  -- Update with actual address
('store_phone', '+94 XX XXX XXXX'),  -- Update with actual phone
('store_whatsapp', '+94 XX XXX XXXX'),  -- Update with actual WhatsApp
('nmra_license_number', 'Your NMRA License Number'),  -- Update with actual license
('store_email', 'info@lankachemist.lk'),  -- Update with actual email
('operating_hours', 'Monday - Saturday: 8:00 AM - 8:00 PM, Sunday: 9:00 AM - 6:00 PM')  -- Update as needed
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
