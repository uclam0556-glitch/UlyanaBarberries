-- Создание таблиц для проекта UlyanaKatalog

-- 1. Категории (Categories)
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Товары (Products)
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  short_desc TEXT,
  price NUMERIC NOT NULL,
  old_price NUMERIC,
  images TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  stock_count INTEGER DEFAULT 999,
  weight TEXT,
  shelf_life TEXT,
  ingredients TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Заказы (Orders)
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_address TEXT,
  delivery_time TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_price NUMERIC NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Баннеры (Banners)
CREATE TABLE IF NOT EXISTS banners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT,
  subtitle TEXT,
  image_url TEXT NOT NULL,
  link_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Опции товаров (Product Options)
CREATE TABLE IF NOT EXISTS product_options (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  option_type TEXT CHECK (option_type IN ('coating', 'filling', 'decor', 'size')) NOT NULL,
  option_name TEXT NOT NULL,
  price_modifier NUMERIC DEFAULT 0 NOT NULL,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Настройка политик безопасности (RLS - Row Level Security)
-- Чтобы приложение могло читать данные без авторизации:
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone." ON categories FOR SELECT USING (true);
CREATE POLICY "Public profiles are viewable by everyone." ON products FOR SELECT USING (true);
CREATE POLICY "Public profiles are viewable by everyone." ON banners FOR SELECT USING (true);
CREATE POLICY "Public profiles are viewable by everyone." ON product_options FOR SELECT USING (true);

-- Разрешаем создавать заказы всем (анонимным пользователям с сайта)
CREATE POLICY "Anyone can create an order" ON orders FOR INSERT WITH CHECK (true);
-- Разрешаем читать заказы всем (временно для админки без авторизации)
CREATE POLICY "Anyone can view orders" ON orders FOR SELECT USING (true);

-- Разрешаем админу редактировать (временно открываем для разработки)
CREATE POLICY "Allow ALL on categories" ON categories FOR ALL USING (true);
CREATE POLICY "Allow ALL on products" ON products FOR ALL USING (true);
CREATE POLICY "Allow ALL on banners" ON banners FOR ALL USING (true);
CREATE POLICY "Allow ALL on orders" ON orders FOR ALL USING (true);
CREATE POLICY "Allow ALL on product_options" ON product_options FOR ALL USING (true);

-- Создание хранилища для картинок (Storage)
-- Внимание: это нужно выполнить в разделе SQL Editor!
insert into storage.buckets (id, name, public) values ('images', 'images', true);

create policy "Images are publicly accessible." 
  on storage.objects for select 
  using ( bucket_id = 'images' );

create policy "Anyone can upload images." 
  on storage.objects for insert 
  with check ( bucket_id = 'images' );

create policy "Anyone can update images." 
  on storage.objects for update 
  with check ( bucket_id = 'images' );

create policy "Anyone can delete images." 
  on storage.objects for delete 
  using ( bucket_id = 'images' );

-- Таблица конфигураций коробок для конструктора ("Свой набор")
CREATE TABLE IF NOT EXISTS box_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  capacity INTEGER NOT NULL,
  base_price NUMERIC DEFAULT 0 NOT NULL,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Права доступа
CREATE POLICY "Allow ALL on box_configs" ON box_configs FOR ALL USING (true);

-- Добавляем колонку в таблицу товаров для разделения набора и отдельных ягод конструктора
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_constructor_item BOOLEAN DEFAULT false;
