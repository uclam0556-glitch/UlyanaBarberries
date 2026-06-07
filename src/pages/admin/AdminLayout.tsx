import { useState, useEffect } from 'react';
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, Tags, ShoppingCart, Image as ImageIcon, LogOut, Box, Cherry, Flower, Menu, X } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminLayout() {
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if ((!isSupabaseConfigured || !supabase) && isLocalhost) {
      // Mock session for local development only
      setSession({ user: { email: 'admin@example.com' } });
      setIsLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Close mobile menu on page change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  if (isLoading) {
    return <div className="min-h-screen bg-cream flex items-center justify-center">Загрузка...</div>;
  }

  if (!session) {
    return <Navigate to="/admin/login" replace />;
  }

  const menuItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Дашборд' },
    { path: '/admin/orders', icon: ShoppingCart, label: 'Заказы' },
    { path: '/admin/products', icon: Package, label: 'Товары' },
    { path: '/admin/flowers', icon: Flower, label: 'Цветы и букеты' },
    { path: '/admin/constructor-items', icon: Cherry, label: 'Ягоды конструктора' },
    { path: '/admin/categories', icon: Tags, label: 'Категории' },
    { path: '/admin/boxes', icon: Box, label: 'Коробки' },
    { path: '/admin/banners', icon: ImageIcon, label: 'Баннеры' },
  ];

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    } else {
      setSession(null); // mock logout
    }
  };

  return (
    <>
      <Helmet>
        <title>Админ-панель — Barberries</title>
      </Helmet>
      
      <div className="min-h-screen bg-cream flex flex-col md:flex-row">
        {/* Sticky Mobile Top Header */}
        <header className="md:hidden bg-choco text-white px-4 py-3 flex items-center justify-between sticky top-0 z-40 border-b border-white/10 shadow-md">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6 text-gold" /> : <Menu className="w-6 h-6 text-gold" />}
            </button>
            <div>
              <span className="font-display font-black text-sm tracking-tight text-white block">BARBERRIES</span>
              <span className="text-[10px] text-gold font-bold block -mt-0.5">Админ-панель</span>
            </div>
          </div>
          <div className="text-[10px] text-white/50 bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
            {session.user?.email}
          </div>
        </header>

        {/* Mobile Slide-out Menu (Drawer) */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <div className="fixed inset-0 z-40 md:hidden flex">
              {/* Overlay Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />

              {/* Sidebar Menu Drawer */}
              <motion.aside
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="relative w-72 bg-choco text-white flex flex-col h-full shadow-2xl p-4 z-50 overflow-y-auto"
              >
                <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                  <div>
                    <h2 className="font-display font-bold text-lg text-gold">BARBERRIES</h2>
                    <p className="text-xs text-white/50">{session.user?.email}</p>
                  </div>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-1.5 hover:bg-white/10 rounded-lg text-white/70"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <nav className="flex-1 space-y-1.5">
                  {menuItems.map((item) => {
                    const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3.5 py-3 rounded-xl transition-colors ${
                          isActive ? 'bg-primary text-white font-bold shadow-md shadow-primary/10' : 'text-white/70 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <item.icon className="w-5 h-5" />
                        <span className="text-sm">{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>

                <div className="pt-4 border-t border-white/10 mt-auto">
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="flex items-center gap-3 text-white/70 hover:text-white w-full px-3 py-3 hover:bg-white/5 rounded-xl transition-colors"
                  >
                    <LogOut className="w-5 h-5 text-red-400" />
                    <span className="text-sm">Выйти</span>
                  </button>
                </div>
              </motion.aside>
            </div>
          )}
        </AnimatePresence>

        {/* Sidebar (Desktop only) */}
        <aside className="hidden md:flex w-64 bg-choco text-white flex-col flex-shrink-0 min-h-screen">
          <div className="p-4 border-b border-white/10">
            <h2 className="font-display font-bold text-lg text-gold">BARBERRIES</h2>
            <p className="text-xs text-white/50">{session.user?.email}</p>
          </div>
          
          <nav className="flex-1 px-2 py-4 flex flex-col overflow-y-auto">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors mb-1 whitespace-nowrap ${
                    isActive ? 'bg-primary text-white font-bold shadow-md shadow-primary/10' : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-white/10">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-white/70 hover:text-white w-full px-2 py-2 hover:bg-white/5 rounded-xl transition-colors"
            >
              <LogOut className="w-5 h-5 text-red-400" />
              <span className="text-sm">Выйти</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </>
  );
}
