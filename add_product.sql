-- Enable required extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Temporary table to store inserted products
CREATE TEMP TABLE inserted_product (id UUID, name TEXT);

-- 1. Insert Products
INSERT INTO products (
  id, name, slug, description, category, brand, color,
  mrp, our_price, storage, status, sub_product_status,
  total_stocks, delivery_mode, product_images, sku,
  weight, dimensions, material, tags, average_rating,
  rating_count, created_at, updated_at
)
VALUES 
  (
    gen_random_uuid(), 'Apple MacBook Air (13-inch, Apple M4 chip with 10-core CPU and 8-core GPU', 'apple-macbook-air',
    'Lightweight laptop with M2 chip and Retina Display',
    'laptop', 'Apple', 'silver',
    99999.00, 92999.00, '256GB SSD', 'active', 'active',
    20, 'express', '["https://pub-24a64e6c279d47a78e0cfeb74ea9ab44.r2.dev/products/apple-macbook-air-m4-chip-153-inch-3891-cm-24gb-512gb-skyblue/main-image-1746625025333.webp", "https://pub-24a64e6c279d47a78e0cfeb74ea9ab44.r2.dev/products/apple-macbook-air-m4-chip-153-inch-3891-cm-24gb-512gb-skyblue/additional-image-1746625025351-5.webp", "https://pub-24a64e6c279d47a78e0cfeb74ea9ab44.r2.dev/products/apple-macbook-air-m4-chip-153-inch-3891-cm-24gb-512gb-skyblue/additional-image-1746625025343-3.webp"]'::jsonb, 'SKU-MAC-001',
    '1.24kg', '30.41 x 21.24 x 1.61 cm', 'aluminum', 'macbook,apple,laptop',
    4.8, 340, NOW(), NOW()
  ),
  (
    gen_random_uuid(), 'ASUS TUF Gaming A15, 15.6" (39.62cm) FHD 16:9 144Hz, AMD Ryzen 7 7435HS, Gaming Laptop', 'asus-tuf-gaming-a15',
    'Gaming laptop with RTX graphics and 144Hz display',
    'laptop', 'ASUS', 'black',
    79999.00, 74999.00, '512GB SSD', 'active', 'active',
    15, 'standard', '["https://pub-24a64e6c279d47a78e0cfeb74ea9ab44.r2.dev/products/asus-tuf-gaming-a15-amd-ryzen-9-octa-core-8945h/main-image-1746626518134.webp","https://pub-24a64e6c279d47a78e0cfeb74ea9ab44.r2.dev/products/asus-tuf-gaming-a15-amd-ryzen-9-octa-core-8945h/additional-image-1746626518139-5.webp", "https://pub-24a64e6c279d47a78e0cfeb74ea9ab44.r2.dev/products/asus-tuf-gaming-a15-amd-ryzen-9-octa-core-8945h/additional-image-1746626518138-4.webp"]'::jsonb, 'SKU-ASUS-002',
    '2.3kg', '35.9 x 25.6 x 2.28 cm', 'plastic', 'asus,gaming,laptop',
    4.6, 210, NOW(), NOW()
  ),
  (
    gen_random_uuid(), 'ZEBRONICS Optimus Gaming Keyboard & Mouse Combo, Braided Cable, Gold Plated USB', 'zebronics-optimus-gaming-keyboard-mouse-combo',
    'Standard USB keyboard with silent keys',
    'keyboard', 'Zebronics', 'black',
    799.00, 599.00, '', 'active', 'active',
    100, 'standard', '["https://pub-24a64e6c279d47a78e0cfeb74ea9ab44.r2.dev/products/zebronics-zeb-optimus-zeb-kmc-2-wired-usb-standard-gaming-keyboard-compatible-with-desktop-laptop-mac-black/main-image-1746870411625.webp", "https://pub-24a64e6c279d47a78e0cfeb74ea9ab44.r2.dev/products/zebronics-zeb-optimus-zeb-kmc-2-wired-usb-standard-gaming-keyboard-compatible-with-desktop-laptop-mac-black/additional-image-1746870411640-5.webp", "https://pub-24a64e6c279d47a78e0cfeb74ea9ab44.r2.dev/products/zebronics-zeb-optimus-zeb-kmc-2-wired-usb-standard-gaming-keyboard-compatible-with-desktop-laptop-mac-black/additional-image-1746870411635-4.webp", "https://pub-24a64e6c279d47a78e0cfeb74ea9ab44.r2.dev/products/zebronics-zeb-optimus-zeb-kmc-2-wired-usb-standard-gaming-keyboard-compatible-with-desktop-laptop-mac-black/additional-image-1746870411632-2.webp"]'::jsonb, 'SKU-ZEB-003',
    '0.4kg', '45 x 13 x 2 cm', 'plastic', 'keyboard,zebronics,usb',
    4.2, 85, NOW(), NOW()
  )
RETURNING id, name INTO inserted_product;

-- 2. Insert Specification Groups
CREATE TEMP TABLE inserted_groups (id UUID, group_name TEXT);
INSERT INTO product_spec_groups (id, group_name)
VALUES 
  (gen_random_uuid(), 'Performance'),
  (gen_random_uuid(), 'Display'),
  (gen_random_uuid(), 'Build')
RETURNING id, group_name INTO inserted_groups;

-- 3. Map Products to Spec Groups
INSERT INTO product_group_mappings (product_id, group_id)
SELECT p.id, g.id
FROM inserted_product p, inserted_groups g;

-- 4. Insert Specification Fields
INSERT INTO product_spec_fields (id, group_id, product_id, field_name, field_value)
SELECT
  gen_random_uuid(),
  g.id,
  p.id,
  f.field_name,
  f.field_value
FROM inserted_product p
JOIN inserted_groups g ON g.group_name = f.group_name,
LATERAL (
  VALUES
    -- MacBook
    ('Apple MacBook Air', 'Performance', 'Processor', 'Apple M2'),
    ('Apple MacBook Air', 'Performance', 'RAM', '8GB'),
    ('Apple MacBook Air', 'Display', 'Size', '13.6-inch'),
    ('Apple MacBook Air', 'Build', 'Material', 'Aluminum'),

    -- ASUS TUF
    ('ASUS TUF Gaming F15', 'Performance', 'Processor', 'Intel i7-12700H'),
    ('ASUS TUF Gaming F15', 'Performance', 'RAM', '16GB'),
    ('ASUS TUF Gaming F15', 'Display', 'Size', '15.6-inch 144Hz'),
    ('ASUS TUF Gaming F15', 'Build', 'Material', 'Polycarbonate'),

    -- Zebronics Keyboard
    ('Zebronics Wired Keyboard', 'Performance', 'Type', 'Membrane'),
    ('Zebronics Wired Keyboard', 'Build', 'Material', 'ABS Plastic')
) AS f(product_name, group_name, field_name, field_value)
JOIN inserted_product p ON p.name = f.product_name;
