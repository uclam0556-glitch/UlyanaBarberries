import { useQuery } from '@tanstack/react-query';
import { Category } from '@/types';
import { mockCategories } from '@/lib/mockData';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

async function fetchCategories(): Promise<Category[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');
    if (error) throw error;
    return data || [];
  }
  return new Promise((resolve) => setTimeout(() => resolve(mockCategories), 300));
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: 10 * 60 * 1000,
  });
}
