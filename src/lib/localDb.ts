import { Order, Product, Banner, Category } from '@/types';
import { mockBanners } from '@/lib/mockData';

const ORDERS_KEY = 'ul_orders';
const PRODUCTS_KEY = 'ul_products';
const BANNERS_KEY = 'ul_banners';
const CATEGORIES_KEY = 'ul_categories';

export const localDb = {
  getOrders: (): Order[] => {
    const data = localStorage.getItem(ORDERS_KEY);
    return data ? JSON.parse(data) : [];
  },
  
  saveOrder: (order: Order) => {
    const orders = localDb.getOrders();
    const newOrder = { 
      ...order, 
      id: crypto.randomUUID(), 
      created_at: new Date().toISOString() 
    };
    orders.unshift(newOrder);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    return newOrder;
  },

  updateOrderStatus: (id: string, status: string) => {
    const orders = localDb.getOrders();
    const index = orders.findIndex(o => o.id === id);
    if (index > -1) {
      orders[index].status = status as any;
      localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    }
  },

  getProducts: (): Product[] => {
    const data = localStorage.getItem(PRODUCTS_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveProduct: (product: Product) => {
    const products = localDb.getProducts();
    const newProduct = {
      ...product,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString()
    };
    products.unshift(newProduct);
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
    return newProduct;
  },
  
  deleteProduct: (id: string) => {
    const products = localDb.getProducts();
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products.filter(p => p.id !== id)));
  },

  getBanners: (): Banner[] => {
    const data = localStorage.getItem(BANNERS_KEY);
    return data ? JSON.parse(data) : mockBanners;
  },

  saveBanner: (banner: Banner) => {
    const banners = localDb.getBanners();
    const existingIndex = banners.findIndex(b => b.id === banner.id);
    if (existingIndex > -1) {
      banners[existingIndex] = banner;
    } else {
      banner.id = crypto.randomUUID();
      banners.push(banner);
    }
    localStorage.setItem(BANNERS_KEY, JSON.stringify(banners));
    return banner;
  },

  deleteBanner: (id: string) => {
    const banners = localDb.getBanners();
    localStorage.setItem(BANNERS_KEY, JSON.stringify(banners.filter(b => b.id !== id)));
  },

  getCategories: (): Category[] => {
    const data = localStorage.getItem(CATEGORIES_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveCategory: (category: Category) => {
    const categories = localDb.getCategories();
    const newCategory = {
      ...category,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString()
    };
    categories.push(newCategory);
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
    return newCategory;
  },

  deleteCategory: (id: string) => {
    const categories = localDb.getCategories();
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories.filter(c => c.id !== id)));
  }
};
