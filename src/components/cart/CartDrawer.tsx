import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Minus, Plus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCartStore } from '@/store/cartStore';
import { formatPrice } from '@/lib/utils';

const drawerVariants = {
  hidden: { x: '100%', opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { type: 'spring' as const, damping: 30, stiffness: 300 } },
  exit: { x: '100%', opacity: 0, transition: { duration: 0.25, ease: 'easeIn' as const } },
};

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, totalPrice } = useCartStore();
  const total = totalPrice();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-choco/50 backdrop-blur-sm"
            onClick={closeCart}
          />

          {/* Drawer */}
          <motion.div
            variants={drawerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed right-0 top-0 bottom-0 z-[70] w-full max-w-sm bg-cream flex flex-col shadow-2xl"
            style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-cream-dark">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-primary" />
                <h2 className="font-display text-lg font-bold text-choco">Корзина</h2>
                {items.length > 0 && (
                  <span className="bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {items.length}
                  </span>
                )}
              </div>
              <button onClick={closeCart} className="p-2 touch-feedback rounded-xl hover:bg-cream-dark">
                <X className="w-5 h-5 text-choco" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {items.length === 0 ? (
                <EmptyCart onClose={closeCart} />
              ) : (
                <div className="p-4 space-y-3">
                  {items.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="bg-white rounded-2xl p-3 flex gap-3 shadow-card"
                    >
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="w-16 h-16 object-cover rounded-xl flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-choco line-clamp-2 leading-snug">
                          {item.product.name}
                        </p>
                        {Object.keys(item.selectedOptions).length > 0 && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            {Object.values(item.selectedOptions).join(', ')}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <span className="font-bold text-primary text-sm">
                            {formatPrice(item.totalPrice)}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="w-7 h-7 bg-cream-dark rounded-lg flex items-center justify-center touch-feedback"
                            >
                              {item.quantity === 1 ? (
                                <Trash2 className="w-3.5 h-3.5 text-primary" />
                              ) : (
                                <Minus className="w-3.5 h-3.5 text-choco" />
                              )}
                            </button>
                            <span className="w-5 text-center text-sm font-bold text-choco">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-7 h-7 bg-cream-dark rounded-lg flex items-center justify-center touch-feedback"
                            >
                              <Plus className="w-3.5 h-3.5 text-choco" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="p-4 border-t border-cream-dark bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 text-sm">Итого</span>
                  <span className="font-bold text-xl text-choco">{formatPrice(total)}</span>
                </div>
                <Link
                  to="/checkout"
                  onClick={closeCart}
                  className="block w-full bg-primary text-white text-center font-bold py-4 rounded-2xl touch-feedback hover:bg-primary-dark transition-colors text-base"
                >
                  Оформить заказ
                </Link>
                <button
                  onClick={closeCart}
                  className="block w-full text-gray-500 text-center text-sm py-1 touch-feedback"
                >
                  Продолжить покупки
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function EmptyCart({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-12 text-center">
      <div className="text-6xl mb-4">🛒</div>
      <h3 className="font-display text-xl font-bold text-choco mb-2">Корзина пуста</h3>
      <p className="text-gray-500 text-sm mb-6">
        Добавьте вкусные десерты из нашего каталога!
      </p>
      <Link
        to="/catalog"
        onClick={onClose}
        className="bg-primary text-white font-bold px-6 py-3 rounded-2xl touch-feedback"
      >
        Перейти в каталог
      </Link>
    </div>
  );
}
