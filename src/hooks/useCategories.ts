import { useQuery } from '@tanstack/react-query';
import { Category } from '@/types';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';

async function fetchCategories(): Promise<Category[]> {
  try {
    const q = query(
      collection(db, 'categories'),
      where('is_active', '==', true),
      orderBy('sort_order')
    );
    const querySnapshot = await getDocs(q);
    const categories: Category[] = [];
    querySnapshot.forEach((doc) => {
      categories.push({ id: doc.id, ...doc.data() } as Category);
    });
    return categories;
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: 10 * 60 * 1000,
  });
}
