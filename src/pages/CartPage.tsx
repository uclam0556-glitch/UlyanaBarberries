import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { formatPrice } from '@/lib/utils';

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalPrice } = useCartStore();
  const total = totalPrice();

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
        <Helmet><title>Корзина — Barberries</title></Helmet>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 15 }}
          className="text-7xl mb-6"
        >
          🛒
        </motion.div>
        <h1 className="font-display text-2xl font-bold text-choco mb-2">Корзина пуста</h1>
        <p className="text-gray-500 text-sm mb-6 max-w-xs">
          Загляните в каталог и выберите вкусные десерты для себя или в подарок!
        </p>
        <Link
          to="/catalog"
          className="bg-primary text-white font-bold px-6 py-3.5 rounded-2xl touch-feedback"
        >
          Перейти в каталог
        </Link>
      </div>
    );
  }

  return (
    <>
      <Helmet><title>Корзина — Barberries</title></Helmet>

      <div className="min-h-screen bg-cream">
        <div className="bg-white border-b border-cream-dark px-4 py-4">
          <h1 className="font-display text-xl font-bold text-choco flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary" />
            Корзина
            <span className="text-sm font-normal text-gray-500 ml-1">({items.length} поз.)</span>
          </h1>
        </div>

        <div className="p-4 space-y-3">
          <AnimatePresence>
            {items.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl p-3 flex gap-3 shadow-card"
              >
                <img
                  src={item.product.images[0]}
                  alt={item.product.name}
                  className="w-20 h-20 object-cover rounded-xl flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-choco line-clamp-2 leading-snug">{item.product.name}</p>
                  {Object.keys(item.selectedOptions).length > 0 && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {Object.values(item.selectedOptions).join(', ')}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-2.5">
                    <span className="font-bold text-primary">{formatPrice(item.totalPrice)}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 bg-cream-dark rounded-lg flex items-center justify-center touch-feedback"
                      >
                        {item.quantity === 1
                          ? <Trash2 className="w-3.5 h-3.5 text-primary" />
                          : <Minus className="w-3.5 h-3.5 text-choco" />
                        }
                      </button>
                      <span className="w-5 text-center text-sm font-bold text-choco">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 bg-cream-dark rounded-lg flex items-center justify-center touch-feedback"
                      >
                        <Plus className="w-3.5 h-3.5 text-choco" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Summary */}
          <div className="bg-white rounded-2xl p-4 shadow-card space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-sm">Подытог</span>
              <span className="font-semibold text-choco">{formatPrice(total)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-sm">Доставка</span>
              <span className="text-green-600 font-semibold text-sm">Бесплатно</span>
            </div>
            <div className="border-t border-cream-dark pt-3 flex justify-between items-center">
              <span className="font-bold text-choco">Итого</span>
              <span className="font-bold text-2xl text-primary">{formatPrice(total)}</span>
            </div>
          </div>

          <Link
            to="/checkout"
            className="block w-full bg-primary text-white text-center font-bold py-4 rounded-2xl touch-feedback text-base"
          >
            Оформить заказ
          </Link>
          <Link
            to="/catalog"
            className="block w-full text-center text-gray-500 text-sm py-2"
          >
            Продолжить покупки
          </Link>
        </div>
      </div>
    </>
  );
}
