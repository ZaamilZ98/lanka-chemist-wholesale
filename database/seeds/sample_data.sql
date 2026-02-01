-- Lanka Chemist Wholesale - Sample Seed Data
-- Run this after schema.sql to populate test data

-- ============================================
-- MANUFACTURERS
-- ============================================
INSERT INTO manufacturers (name, slug, country) VALUES
  ('State Pharmaceuticals Corporation', 'spc-sri-lanka', 'Sri Lanka'),
  ('Astron Limited', 'astron', 'Sri Lanka'),
  ('Hemas Pharmaceuticals', 'hemas', 'Sri Lanka'),
  ('Glaxo Wellcome Ceylon', 'glaxo-wellcome', 'Sri Lanka'),
  ('Cipla Ltd', 'cipla', 'India'),
  ('Sun Pharma', 'sun-pharma', 'India'),
  ('Pfizer Inc', 'pfizer', 'USA'),
  ('Roche', 'roche', 'Switzerland'),
  ('Novartis', 'novartis', 'Switzerland'),
  ('Sanofi', 'sanofi', 'France');

-- ============================================
-- CATEGORIES
-- ============================================
INSERT INTO categories (name, slug, section, sort_order) VALUES
  ('Analgesics & Antipyretics', 'analgesics-antipyretics', 'medicines', 1),
  ('Antibiotics', 'antibiotics', 'medicines', 2),
  ('Antihypertensives', 'antihypertensives', 'medicines', 3),
  ('Antidiabetics', 'antidiabetics', 'medicines', 4),
  ('Antihistamines', 'antihistamines', 'medicines', 5),
  ('Gastrointestinal', 'gastrointestinal', 'medicines', 6),
  ('Cardiovascular', 'cardiovascular', 'medicines', 7),
  ('Respiratory', 'respiratory', 'medicines', 8),
  ('Vitamins & Supplements', 'vitamins-supplements', 'medicines', 9),
  ('Dermatological', 'dermatological', 'medicines', 10),
  ('Syringes & Needles', 'syringes-needles', 'surgical', 1),
  ('Surgical Gloves', 'surgical-gloves', 'surgical', 2),
  ('Wound Care', 'wound-care', 'surgical', 3),
  ('Blood Pressure Monitors', 'bp-monitors', 'equipment', 1),
  ('Glucometers', 'glucometers', 'equipment', 2),
  ('Thermometers', 'thermometers', 'equipment', 3),
  ('SPC Medicines', 'spc-medicines', 'spc', 1);

-- ============================================
-- SAMPLE PRODUCTS
-- ============================================
INSERT INTO products (generic_name, brand_name, manufacturer_id, category_id, section, strength, dosage_form, pack_size, wholesale_price, mrp, stock_quantity, sku, is_prescription) VALUES
  ('Paracetamol', 'Panadol', (SELECT id FROM manufacturers WHERE slug = 'glaxo-wellcome'), (SELECT id FROM categories WHERE slug = 'analgesics-antipyretics'), 'medicines', '500mg', 'tablet', '100 tablets', 320.00, 450.00, 500, 'MED-001', false),
  ('Amoxicillin', 'Amoxil', (SELECT id FROM manufacturers WHERE slug = 'glaxo-wellcome'), (SELECT id FROM categories WHERE slug = 'antibiotics'), 'medicines', '500mg', 'capsule', '100 capsules', 850.00, 1200.00, 200, 'MED-002', true),
  ('Amlodipine', 'Norvasc', (SELECT id FROM manufacturers WHERE slug = 'pfizer'), (SELECT id FROM categories WHERE slug = 'antihypertensives'), 'medicines', '5mg', 'tablet', '30 tablets', 420.00, 600.00, 150, 'MED-003', true),
  ('Metformin', 'Glucophage', (SELECT id FROM manufacturers WHERE slug = 'sanofi'), (SELECT id FROM categories WHERE slug = 'antidiabetics'), 'medicines', '500mg', 'tablet', '100 tablets', 380.00, 520.00, 300, 'MED-004', true),
  ('Cetirizine', 'Zyrtec', (SELECT id FROM manufacturers WHERE slug = 'cipla'), (SELECT id FROM categories WHERE slug = 'antihistamines'), 'medicines', '10mg', 'tablet', '30 tablets', 180.00, 250.00, 400, 'MED-005', false),
  ('Omeprazole', 'Losec', (SELECT id FROM manufacturers WHERE slug = 'astron'), (SELECT id FROM categories WHERE slug = 'gastrointestinal'), 'medicines', '20mg', 'capsule', '30 capsules', 290.00, 400.00, 250, 'MED-006', true),
  ('Atorvastatin', 'Lipitor', (SELECT id FROM manufacturers WHERE slug = 'pfizer'), (SELECT id FROM categories WHERE slug = 'cardiovascular'), 'medicines', '20mg', 'tablet', '30 tablets', 520.00, 750.00, 180, 'MED-007', true),
  ('Salbutamol', 'Ventolin', (SELECT id FROM manufacturers WHERE slug = 'glaxo-wellcome'), (SELECT id FROM categories WHERE slug = 'respiratory'), 'medicines', '100mcg', 'inhaler', '1 inhaler', 650.00, 900.00, 100, 'MED-008', true),
  ('Vitamin C', 'C-Vit', (SELECT id FROM manufacturers WHERE slug = 'hemas'), (SELECT id FROM categories WHERE slug = 'vitamins-supplements'), 'medicines', '500mg', 'tablet', '100 tablets', 250.00, 350.00, 600, 'MED-009', false),
  ('Betamethasone Cream', 'Betnovate', (SELECT id FROM manufacturers WHERE slug = 'glaxo-wellcome'), (SELECT id FROM categories WHERE slug = 'dermatological'), 'medicines', '0.1%', 'cream', '30g tube', 320.00, 450.00, 120, 'MED-010', true),
  ('Disposable Syringes', 'BD Syringe 5ml', (SELECT id FROM manufacturers WHERE slug = 'hemas'), (SELECT id FROM categories WHERE slug = 'syringes-needles'), 'surgical', '5ml', 'other', 'Box of 100', 1200.00, 1600.00, 80, 'SUR-001', false),
  ('Surgical Gloves', 'Latex Gloves M', (SELECT id FROM manufacturers WHERE slug = 'hemas'), (SELECT id FROM categories WHERE slug = 'surgical-gloves'), 'surgical', 'Medium', 'other', 'Box of 100', 950.00, 1300.00, 60, 'SUR-002', false),
  ('Digital BP Monitor', 'Omron HEM-7120', (SELECT id FROM manufacturers WHERE slug = 'hemas'), (SELECT id FROM categories WHERE slug = 'bp-monitors'), 'equipment', NULL, 'other', '1 unit', 5500.00, 7500.00, 25, 'EQP-001', false),
  ('Glucometer', 'Accu-Chek Active', (SELECT id FROM manufacturers WHERE slug = 'roche'), (SELECT id FROM categories WHERE slug = 'glucometers'), 'equipment', NULL, 'other', '1 unit', 3200.00, 4500.00, 30, 'EQP-002', false);

-- ============================================
-- DEFAULT ADMIN USER
-- Password: admin123 (bcrypt hash - CHANGE IN PRODUCTION)
-- ============================================
INSERT INTO admin_users (email, password_hash, name) VALUES
  ('admin@lankachemist.lk', '$2b$10$placeholder_hash_change_this', 'Admin');
