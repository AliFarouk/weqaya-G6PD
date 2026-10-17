-- =====================================================================
-- Weqaya G6PD (وقاية انيميا الفول) - Simplified 3-Table MVP Schema
-- =====================================================================

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email_or_phone VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    is_doctor BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(20) NOT NULL CHECK (category IN ('food', 'medication')),
    image_url TEXT,
    hemolysis_votes INT DEFAULT 0,
    safe_votes INT DEFAULT 0,
    total_votes INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS votes (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_id INT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('hemolysis', 'safe')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_item_vote UNIQUE (user_id, item_id)
);

-- Seed Data (أشهر الأكلات والأدوية في السوق المصري)
INSERT INTO items (name, category, hemolysis_votes, safe_votes, total_votes) VALUES
('طعمية / فلافل سخنة', 'food', 1391, 29, 1420),
('فول مدمس بالزيت والحار', 'food', 1871, 19, 1890),
('لانشون حلواني إخوان بقري', 'food', 299, 116, 415),
('أقراص ريفو 320 مجم (أسبيرين أخضر)', 'medication', 572, 78, 650),
('أقراص سبتازول / ستريم (سلفا)', 'medication', 812, 8, 820),
('بسكويت ويفر كتاكيتو', 'food', 150, 80, 230),
('أقراص بنادول أزرق (باراسيتامول)', 'medication', 31, 1509, 1540),
('شيبسي بطعم الجبنة المتبلة', 'food', 124, 186, 310),
('فيتامين سي فوار 1000 مجم (جرعات عالية)', 'medication', 394, 86, 480),
('حمص الشام (حلبسة)', 'food', 34, 306, 340),
('شوكولاتة كادبوري بابلي', 'food', 45, 135, 180),
('كتافلام 50 مجم أقراص', 'medication', 21, 389, 410)
ON CONFLICT DO NOTHING;
