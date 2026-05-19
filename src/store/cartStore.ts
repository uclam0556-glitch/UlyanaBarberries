import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, Product } from '@/types';
import { generateId } from '@/lib/utils';

interface CartState {
  items: CartItem[];
  isOpen: boolean;

  addItem: (product: Product, quantity?: number, selectedOptions?: Record<string, string>, optionPrice?: number) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;

  totalItems: () => number;
  totalPrice: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (product, quantity = 1, selectedOptions = {}, optionPrice = 0) => {
        set((state) => {
          // Check if same product with same options already in cart
          const existingItem = state.items.find(
            (item) =>
              item.product.id === product.id &&
              JSON.stringify(item.selectedOptions) === JSON.stringify(selectedOptions)
          );

          if (existingItem) {
            return {
              items: state.items.map((item) =>
                item.id === existingItem.id
                  ? {
                      ...item,
                      quantity: item.quantity + quantity,
                      totalPrice: (item.quantity + quantity) * (product.price + optionPrice),
                    }
                  : item
              ),
            };
          }

          const newItem: CartItem = {
            id: generateId(),
            product,
            quantity,
            selectedOptions,
            optionPrice,
            totalPrice: quantity * (product.price + optionPrice),
          };

          return { items: [...state.items, newItem] };
        });
      },

      removeItem: (itemId) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== itemId),
        }));
      },

      updateQuantity: (itemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(itemId);
          return;
        }
        set((state) => ({
          items: state.items.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  quantity,
                  totalPrice: quantity * (item.product.price + item.optionPrice),
                }
              : item
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      totalItems: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
      totalPrice: () => get().items.reduce((sum, item) => sum + item.totalPrice, 0),
    }),
    {
      name: 'klubnika-cart',
      partialize: (state) => ({ items: state.items }),
    }
  )
);
