import { useQuery } from '@tanstack/react-query';
import { Product } from '@/types';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';

async function fetchProducts(): Promise<Product[]> {
  try {
    const q = query(
      collection(db, 'products'),
      where('is_active', '==', true),
      orderBy('sort_order')
    );
    const querySnapshot = await getDocs(q);
    const products: Product[] = [];
    querySnapshot.forEach((doc) => {
      products.push({ id: doc.id, ...doc.data() } as Product);
    });
    return products;
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

async function fetchProductBySlug(slug: string): Promise<Product | null> {
  try {
    const q = query(
      collection(db, 'products'),
      where('slug', '==', slug),
      where('is_active', '==', true),
      limit(1)
    );
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;
    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Product;
  } catch (error) {
    console.error("Error fetching product by slug:", error);
    return null;
  }
}

async function fetchFeaturedProducts(): Promise<Product[]> {
  try {
    const q = query(
      collection(db, 'products'),
      where('is_active', '==', true),
      orderBy('sort_order')
    );
    const querySnapshot = await getDocs(q);
    const products: Product[] = [];
    querySnapshot.forEach((doc) => {
      products.push({ id: doc.id, ...doc.data() } as Product);
    });

    const featured = products.filter(p => p.is_featured);

    if (featured.length === 0) {
      return products.slice(0, 10);
    }

    return featured;
  } catch (error) {
    console.error("Error fetching featured products:", error);
    return [];
  }
}

export function useProducts(categorySlug?: string) {
  return useQuery({
    queryKey: ['products', categorySlug],
    queryFn: async () => {
      const products = await fetchProducts();
      // Filter out constructor items from general catalog
      const catalogProducts = products.filter(p => !p.is_constructor_item);
      
      if (categorySlug && categorySlug !== 'all') {
        // Since we are not doing a complex join like supabase, we filter on client
        return catalogProducts.filter((p) => p.category_id === categorySlug || p.category?.slug === categorySlug);
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
