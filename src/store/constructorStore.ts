import { create } from 'zustand';
import { BoxConfig, ConstructorItem, Product } from '@/types';

interface ConstructorState {
  selectedBox: BoxConfig | null;
  items: ConstructorItem[];
  note: string;
  step: 1 | 2 | 3;

  setBox: (box: BoxConfig) => void;
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  setNote: (note: string) => void;
  setStep: (step: 1 | 2 | 3) => void;
  reset: () => void;

  totalItems: () => number;
  totalPrice: () => number;
  isBoxFull: () => boolean;
}

export const useConstructorStore = create<ConstructorState>((set, get) => ({
  selectedBox: null,
  items: [],
  note: '',
  step: 1,

  setBox: (box) => set({ selectedBox: box, items: [], step: 2 }),

  addItem: (product) => {
    const state = get();
    if (!state.selectedBox) return;

    const totalItems = state.totalItems();
    if (totalItems >= state.selectedBox.capacity) return;

    const existing = state.items.find((i) => i.product.id === product.id);
    if (existing) {
      set({
        items: state.items.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        ),
      });
    } else {
      set({ items: [...state.items, { product, quantity: 1 }] });
    }
  },

  removeItem: (productId) => {
    const state = get();
    const existing = state.items.find((i) => i.product.id === productId);
    if (!existing) return;

    if (existing.quantity > 1) {
      set({
        items: state.items.map((i) =>
          i.product.id === productId ? { ...i, quantity: i.quantity - 1 } : i
        ),
      });
    } else {
      set({ items: state.items.filter((i) => i.product.id !== productId) });
    }
  },

  setNote: (note) => set({ note }),
  setStep: (step) => set({ step }),

  reset: () => set({ selectedBox: null, items: [], note: '', step: 1 }),

  totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

  totalPrice: () => {
    const state = get();
    const boxPrice = state.selectedBox?.base_price || 0;
    const itemsPrice = state.items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
    return boxPrice + itemsPrice;
  },

  isBoxFull: () => {
    const state = get();
    if (!state.selectedBox) return false;
    return state.totalItems() >= state.selectedBox.capacity;
  },
}));
