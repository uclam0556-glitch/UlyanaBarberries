import { useQuery } from '@tanstack/react-query';
import { Product } from '@/types';
import { mockProducts } from '@/lib/mockData';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

async function fetchProducts(): Promise<Product[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('products')
      .select('*, category:categories(*), options:product_options(*)')
      .eq('is_active', true)
      .order('sort_order');
    if (error) throw error;
    return data || [];
  }
  // Fallback to mock data
  return new Promise((resolve) => setTimeout(() => resolve(mockProducts), 500));
}

async function fetchProductBySlug(slug: string): Promise<Product | null> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('products')
      .select('*, category:categories(*), options:product_options(*)')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();
    if (error) return null;
    return data;
  }
  return new Promise((resolve) =>
    setTimeout(() => {
      resolve(mockProducts.find((p) => p.slug === slug) || null);
    }, 300)
  );
}

async function fetchFeaturedProducts(): Promise<Product[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('products')
      .select('*, options:product_options(*)')
      .eq('is_active', true)
      .eq('is_featured', true)
      .order('sort_order');
    if (error) throw error;
    
    if (!data || data.length === 0) {
      const { data: allActive, error: activeError } = await supabase
        .from('products')
        .select('*, options:product_options(*)')
        .eq('is_active', true)
        .order('sort_order')
        .limit(10);
      if (activeError) throw activeError;
      return allActive || [];
    }
    
    return data || [];
  }
  return new Promise((resolve) =>
    setTimeout(() => resolve(mockProducts.filter((p) => p.is_featured)), 400)
  );
}

export function useProducts(categorySlug?: string) {
  return useQuery({
    queryKey: ['products', categorySlug],
    queryFn: async () => {
      const products = await fetchProducts();
      // Filter out constructor items from general catalog
      const catalogProducts = products.filter(p => !p.is_constructor_item);
      
      if (categorySlug && categorySlug !== 'all') {
        return catalogProducts.filter((p) => p.category?.slug === categorySlug);
      }
      return catalogProducts;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: () => fetchProductBySlug(slug),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });
}

export function useFeaturedProducts() {
  return useQuery({
    queryKey: ['products', 'featured'],
    queryFn: fetchFeaturedProducts,
    staleTime: 5 * 60 * 1000,
  });
}

export function useConstructorProducts() {
  return useQuery({
    queryKey: ['products', 'constructor'],
    queryFn: async () => {
      const products = await fetchProducts();
      // Show only individual constructor berries
      return products.filter(p => p.is_constructor_item);
    },
    staleTime: 5 * 60 * 1000,
  });
}
