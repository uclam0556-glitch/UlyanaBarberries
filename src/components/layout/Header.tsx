import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, Home, Grid, Gift, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '@/store/cartStore';
import CartDrawer from '@/components/cart/CartDrawer';
import { buildQuickVKLink, buildQuickWhatsAppLink } from '@/lib/social';

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

  const handleVK = () => {
    window.open(buildQuickVKLink('Здравствуйте! Хочу сделать заказ 🍓'), '_blank');
  };

  const handleWhatsApp = () => {
    window.open(buildQuickWhatsAppLink('Здравствуйте! Хочу сделать заказ 🍓'), '_blank');
  };

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
            {/* VK button */}
            <button
              onClick={handleVK}
              className="flex items-center gap-1.5 bg-[#0077FF] text-white text-xs font-semibold px-3 py-1.5 rounded-full touch-feedback"
            >
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                <path d="M15.077 18.066c.277.014.542-.047.801-.16a1.36 1.36 0 0 0 .584-.509c.2-.315.26-.693.208-1.06-.06-.414-.265-.79-.58-1.066-.314-.277-.735-.415-1.15-.386-1.073.076-2.146.068-3.218.01-.89-.048-1.748-.284-2.527-.698-.778-.415-1.455-.992-1.99-1.69a6.837 6.837 0 0 1-1.258-2.316 7.641 7.641 0 0 1-.36-2.551c.02-.756.16-1.503.415-2.215.255-.712.63-1.378 1.106-1.97.476-.593 1.05-1.11 1.696-1.529a7.355 7.355 0 0 1 2.227-.923 7.857 7.857 0 0 1 2.533-.146c.833.09 1.64.333 2.392.715a6.452 6.452 0 0 1 1.954 1.488 5.792 5.792 0 0 1 1.157 2.083c.243.722.348 1.485.31 2.246-.038.762-.218 1.509-.53 2.21a6.388 6.388 0 0 1-1.264 1.84c-.496.502-1.065.92-1.688 1.238-.622.318-1.29.532-1.98.634a7.46 7.46 0 0 1-2.072.071c-.714-.078-1.41-.264-2.062-.547a5.556 5.556 0 0 1-1.728-1.144A5.045 5.045 0 0 1 7.8 8.877c-.313-.61-.482-1.277-.497-1.956-.015-.68.125-1.353.41-1.976a4.912 4.912 0 0 1 1.12-1.636 5.093 5.093 0 0 1 1.673-1.042c.628-.245 1.306-.345 1.983-.292a5.452 5.452 0 0 1 1.942.5 4.887 4.887 0 0 1 1.583 1.096c.45.45.81.978 1.062 1.558.252.58.4 1.203.435 1.837.035.633-.035 1.266-.205 1.87a5.008 5.008 0 0 1-.684 1.644c-.31.483-.7.904-1.152 1.242-.452.338-.958.59-1.494.743A5.443 5.443 0 0 1 12.062 18z"/>
              </svg>
              <span className="hidden sm:inline">ВКонтакте</span>
            </button>
            {/* WhatsApp button */}
            <button
              onClick={handleWhatsApp}
              className="flex items-center gap-1.5 bg-[#25D366] text-white text-xs font-semibold px-3 py-1.5 rounded-full touch-feedback"
            >
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

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
                    onClick={handleVK}
                    className="flex flex-col items-center gap-0.5 py-1 touch-feedback"
                  >
                    <div className="w-5 h-5 flex items-center justify-center">
                      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current text-[#0077FF]">
                        <path d="M15.077 18.066c.277.014.542-.047.801-.16a1.36 1.36 0 0 0 .584-.509c.2-.315.26-.693.208-1.06-.06-.414-.265-.79-.58-1.066-.314-.277-.735-.415-1.15-.386-1.073.076-2.146.068-3.218.01-.89-.048-1.748-.284-2.527-.698-.778-.415-1.455-.992-1.99-1.69a6.837 6.837 0 0 1-1.258-2.316 7.641 7.641 0 0 1-.36-2.551c.02-.756.16-1.503.415-2.215.255-.712.63-1.378 1.106-1.97.476-.593 1.05-1.11 1.696-1.529a7.355 7.355 0 0 1 2.227-.923 7.857 7.857 0 0 1 2.533-.146c.833.09 1.64.333 2.392.715a6.452 6.452 0 0 1 1.954 1.488 5.792 5.792 0 0 1 1.157 2.083c.243.722.348 1.485.31 2.246-.038.762-.218 1.509-.53 2.21a6.388 6.388 0 0 1-1.264 1.84c-.496.502-1.065.92-1.688 1.238-.622.318-1.29.532-1.98.634a7.46 7.46 0 0 1-2.072.071c-.714-.078-1.41-.264-2.062-.547a5.556 5.556 0 0 1-1.728-1.144A5.045 5.045 0 0 1 7.8 8.877c-.313-.61-.482-1.277-.497-1.956-.015-.68.125-1.353.41-1.976a4.912 4.912 0 0 1 1.12-1.636 5.093 5.093 0 0 1 1.673-1.042c.628-.245 1.306-.345 1.983-.292a5.452 5.452 0 0 1 1.942.5 4.887 4.887 0 0 1 1.583 1.096c.45.45.81.978 1.062 1.558.252.58.4 1.203.435 1.837.035.633-.035 1.266-.205 1.87a5.008 5.008 0 0 1-.684 1.644c-.31.483-.7.904-1.152 1.242-.452.338-.958.59-1.494.743A5.443 5.443 0 0 1 12.062 18z"/>
                      </svg>
                    </div>
                    <span className="text-[10px] font-medium text-[#0077FF]">ВК</span>
                  </button>
                  <button
                    onClick={handleWhatsApp}
                    className="flex flex-col items-center gap-0.5 py-1 touch-feedback"
                  >
                    <div className="w-5 h-5 flex items-center justify-center">
                      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current text-[#25D366]">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                    </div>
                    <span className="text-[10px] font-medium text-[#25D366]">WA</span>
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
