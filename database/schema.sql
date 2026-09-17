-- ============================================
-- GENERA TECH HUB - DATABASE SCHEMA
-- Run this in Supabase SQL Editor
-- Project: https://ofrvakghmlyidtelenib.supabase.co
-- ============================================

-- 1. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(100),
    condition VARCHAR(50) DEFAULT 'New',
    brand VARCHAR(100),
    model VARCHAR(100),
    storage VARCHAR(50),
    color VARCHAR(50),
    stock_quantity INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    is_available BOOLEAN DEFAULT TRUE,
    image_urls TEXT[],
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. REPAIR REQUESTS
CREATE TABLE IF NOT EXISTS repair_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    device_type VARCHAR(100) NOT NULL,
    device_brand VARCHAR(100),
    device_model VARCHAR(100),
    issue_description TEXT NOT NULL,
    urgency VARCHAR(50) DEFAULT 'standard',
    service_type VARCHAR(50) DEFAULT 'walk-in',
    preferred_date DATE,
    preferred_time TIME,
    estimated_price_min DECIMAL(10,2),
    estimated_price_max DECIMAL(10,2),
    status VARCHAR(50) DEFAULT 'pending',
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_email VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. CUSTOMER REVIEWS
CREATE TABLE IF NOT EXISTS reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT NOT NULL,
    device_service VARCHAR(255),
    customer_name VARCHAR(255),
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 4. PURCHASE REQUESTS
CREATE TABLE IF NOT EXISTS purchase_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity INTEGER DEFAULT 1,
    total_price DECIMAL(10,2),
    delivery_address TEXT,
    city_state VARCHAR(255),
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_email VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

-- 5. SWAP/TRADE-IN REQUESTS
CREATE TABLE IF NOT EXISTS swap_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    device_brand VARCHAR(100) NOT NULL,
    device_model VARCHAR(100) NOT NULL,
    device_condition VARCHAR(50) NOT NULL,
    device_storage VARCHAR(50),
    estimated_value DECIMAL(10,2),
    target_device VARCHAR(255),
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_email VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

-- 6. CONTACT MESSAGES
CREATE TABLE IF NOT EXISTS contact_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    subject VARCHAR(255),
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'unread',
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_is_available ON products(is_available);
CREATE INDEX IF NOT EXISTS idx_repair_requests_status ON repair_requests(status);
CREATE INDEX IF NOT EXISTS idx_repair_requests_user_id ON repair_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_is_approved ON reviews(is_approved);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_user_id ON purchase_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_status ON purchase_requests(status);
CREATE INDEX IF NOT EXISTS idx_swap_requests_user_id ON swap_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE repair_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE swap_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- PRODUCTS: Public can read, Admin can write
DROP POLICY IF EXISTS "Public can read products" ON products;
CREATE POLICY "Public can read products" ON products
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin can manage products" ON products;
CREATE POLICY "Admin can manage products" ON products
    FOR ALL
    USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
    WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- REPAIR REQUESTS: Anyone can insert, Admin can read all
DROP POLICY IF EXISTS "Anyone can insert repair" ON repair_requests;
CREATE POLICY "Anyone can insert repair" ON repair_requests
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admin can read repairs" ON repair_requests;
CREATE POLICY "Admin can read repairs" ON repair_requests
    FOR SELECT USING (auth.role() = 'authenticated');

-- REVIEWS: Anyone can insert, Admin can manage
DROP POLICY IF EXISTS "Anyone can insert reviews" ON reviews;
CREATE POLICY "Anyone can insert reviews" ON reviews
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admin can manage reviews" ON reviews;
CREATE POLICY "Admin can manage reviews" ON reviews
    USING (auth.role() = 'authenticated');

-- PURCHASE REQUESTS: Anyone can submit an order enquiry, Admin can read
DROP POLICY IF EXISTS "Anyone can insert purchase" ON purchase_requests;
CREATE POLICY "Anyone can insert purchase" ON purchase_requests
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admin can read purchases" ON purchase_requests;
CREATE POLICY "Admin can read purchases" ON purchase_requests
    FOR SELECT USING (auth.role() = 'authenticated');

-- SWAP REQUESTS: Anyone can insert, Admin can read
DROP POLICY IF EXISTS "Anyone can insert swap" ON swap_requests;
CREATE POLICY "Anyone can insert swap" ON swap_requests
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admin can read swaps" ON swap_requests;
CREATE POLICY "Admin can read swaps" ON swap_requests
    FOR SELECT USING (auth.role() = 'authenticated');

-- CONTACT MESSAGES: Anyone can insert, Admin can read
DROP POLICY IF EXISTS "Anyone can insert contact" ON contact_messages;
CREATE POLICY "Anyone can insert contact" ON contact_messages
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admin can read contacts" ON contact_messages;
CREATE POLICY "Admin can read contacts" ON contact_messages
    FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================
-- SAMPLE DATA (Optional)
-- ============================================
-- Uncomment to add sample products

/*
INSERT INTO products (name, description, price, category, brand, condition, stock_quantity, is_featured, image_urls) VALUES
('iPhone 15 Pro Max', 'Latest iPhone with titanium body and A17 Pro chip. 6.7-inch display, 48MP camera, USB-C.', 850000, 'Phones', 'Apple', 'New', 10, true, ARRAY['https://images.unsplash.com/photo-1695048133142-1a20484d2569']),
('Samsung Galaxy S24 Ultra', 'Premium Android with AI features and S Pen. 6.8-inch display, 200MP camera.', 750000, 'Phones', 'Samsung', 'New', 8, true, ARRAY['https://images.unsplash.com/photo-1610945415295-d9bbf067e59c']),
('MacBook Air M3', 'Lightweight laptop with Apple M3 chip. 13.6-inch display, 8GB RAM, 256GB SSD.', 950000, 'Laptops', 'Apple', 'New', 5, true, ARRAY['https://images.unsplash.com/photo-1517336714731-489689fd1ca8']);
*/