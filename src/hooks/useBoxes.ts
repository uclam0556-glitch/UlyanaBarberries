import { useQuery } from '@tanstack/react-query';
import { BoxConfig } from '@/types';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';

async function fetchBoxes(): Promise<BoxConfig[]> {
  try {
    const q = query(
      collection(db, 'box_configs'),
      where('is_active', '==', true),
      orderBy('sort_order')
    );
    const querySnapshot = await getDocs(q);
    const boxes: BoxConfig[] = [];
    querySnapshot.forEach((doc) => {
      boxes.push({ id: doc.id, ...doc.data() } as BoxConfig);
    });
    return boxes;
  } catch (error) {
    console.error("Error fetching boxes:", error);
    return [];
  }
}

export function useBoxes() {
  return useQuery({
    queryKey: ['boxes'],
    queryFn: fetchBoxes,
    staleTime: 10 * 60 * 1000,
  });
}
