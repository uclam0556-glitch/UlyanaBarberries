// Типы для всего приложения

export interface Category {
  id: string;
  name: string;
  slug: string;
  image_url?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface ProductOption {
  id: string;
  product_id: string;
  option_type: 'coating' | 'filling' | 'decor' | 'size';
  option_name: string;
  price_modifier: number;
  image_url?: string;
  is_active: boolean;
}

export interface Product {
  id: string;
  category_id?: string;
  category?: Category;
  name: string;
  slug: string;
  description?: string;
  short_desc?: string;
  price: number;
  old_price?: number;
  images: string[];
  is_active: boolean;
  is_featured: boolean;
  is_constructor_item?: boolean;
  stock_count: number;
  weight?: string;
  shelf_life?: string;
  ingredients?: string;
  sort_order: number;
  created_at: string;
  options?: ProductOption[];
  rating?: number;
  reviews_count?: number;
}

export interface BoxConfig {
  id: string;
  name: string;
  capacity: number;
  base_price: number;
  image_url?: string;
  is_active: boolean;
  sort_order?: number;
}

export interface CartItem {
  id: string; // unique cart item id
  product: Product;
  quantity: number;
  selectedOptions: Record<string, string>; // option_type → option_name
  optionPrice: number; // extra price from options
  totalPrice: number;
}

export interface ConstructorItem {
  product: Product;
  quantity: number;
}

export interface ConstructorBox {
  config: BoxConfig;
  items: ConstructorItem[];
  note?: string;
}

export interface OrderItem {
  name: string;
  qty: number;
  price: number;
  options?: string;
}

export interface Order {
  id?: string;
  customer_name: string;
  customer_phone: string;
  customer_address?: string;
  delivery_time?: string;
  items: OrderItem[];
  total_price: number;
  notes?: string;
  status: 'new' | 'confirmed' | 'delivered';
  created_at?: string;
}

export interface Banner {
  id: string;
  title?: string;
  subtitle?: string;
  image_url: string;
  link_url?: string;
  sort_order: number;
  is_active: boolean;
}

export interface CheckoutFormData {
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  delivery_time: string;
  notes: string;
  agree: boolean;
}
