import { useQuery } from '@tanstack/react-query';
import { BoxConfig } from '@/types';
import { mockBoxConfigs } from '@/lib/mockData';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

async function fetchBoxes(): Promise<BoxConfig[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('box_configs')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.warn('Failed to fetch boxes from Supabase, falling back to mock data:', err);
      return mockBoxConfigs;
    }
  }
  return new Promise((resolve) => setTimeout(() => resolve(mockBoxConfigs), 300));
}

export function useBoxes() {
  return useQuery({
    queryKey: ['boxes'],
    queryFn: fetchBoxes,
    staleTime: 10 * 60 * 1000,
  });
}
