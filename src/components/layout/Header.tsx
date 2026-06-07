import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, Home, Grid, Gift, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '@/store/cartStore';
import CartDrawer from '@/components/cart/CartDrawer';
import { buildQuickTelegramLink } from '@/lib/social';

const navItems = [
  { path: '/', icon: Home, label: 'Главная' },
  { path: '/catalog', icon: Grid, label: 'Каталог' },
  { path: '/constructor', icon: Gift, label: 'Свой набор' },
  { path: '/contact', icon: Phone, label: 'Написать' },
];

export default function Header() {
  const location = useLocation();
  const { totalItems, openCart } = useCartStore();
  const cartCount = totalItems();



  return (
    <>
      {/* Top header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-cream-dark/40">
        <div className="flex items-center justify-between px-4 h-14" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
          {/* Logo */}
          <Link to="/" className="flex items-center gap-1.5">
            <span className="text-2xl">🍓</span>
            <div>
              <span className="font-display text-lg font-black tracking-tight text-accent leading-none block">BARBERRIES</span>
              <span className="text-[9px] uppercase tracking-widest text-primary font-bold block -mt-0.5">Клубника и цветы</span>
            </div>
          </Link>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Cart button */}
            <button
              onClick={openCart}
              className="relative p-2 touch-feedback"
            >
              <ShoppingBag className="w-6 h-6 text-accent" />
              <AnimatePresence>
                {cartCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary rounded-full text-white text-[10px] font-bold flex items-center justify-center"
                  >
                    {cartCount > 9 ? '9+' : cartCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </header>

      {/* Bottom Navigation (Mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-cream-dark/40"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex items-center justify-around h-16">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(path);

            if (path === '/contact') {
              return (
                <div key={path} className="flex gap-4">
                  <button
                    onClick={() => window.open(buildQuickTelegramLink('Здравствуйте! У меня есть вопрос 🍓'), '_blank')}
                    className="flex flex-col items-center gap-0.5 py-1 touch-feedback"
                  >
                    <div className="w-5 h-5 flex items-center justify-center">
                      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current text-[#0088cc]">
                        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.94z"/>
                      </svg>
                    </div>
                    <span className="text-[10px] font-medium text-[#0088cc]">TG</span>
                  </button>
                </div>
              );
            }

            return (
              <Link
                key={path}
                to={path}
                className="flex flex-col items-center gap-0.5 py-1 px-3 touch-feedback"
              >
                <motion.div
                  animate={isActive ? { scale: 1.15 } : { scale: 1 }}
                  className={`w-5 h-5 flex items-center justify-center ${isActive ? 'text-primary' : 'text-choco/40'}`}
                >
                  <Icon className="w-5 h-5" />
                </motion.div>
                <span className={`text-[10px] font-medium transition-colors ${isActive ? 'text-primary' : 'text-choco/40'}`}>
                  {label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute top-0 w-8 h-0.5 bg-primary rounded-full"
                    style={{ top: 0 }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      <CartDrawer />
    </>
  );
}
