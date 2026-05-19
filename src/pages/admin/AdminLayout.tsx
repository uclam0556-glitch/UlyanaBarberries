import { useState, useEffect } from 'react';
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, Tags, ShoppingCart, Image as ImageIcon, LogOut, Box } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Helmet } from 'react-helmet-async';

export default function AdminLayout() {
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      // Mock session for local development
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
        <title>Админ-панель — Клубника в Шоколаде</title>
      </Helmet>
      
      <div className="min-h-screen bg-cream flex flex-col md:flex-row">
        {/* Sidebar (Desktop) / Bottom Nav (Mobile) */}
        <aside className="w-full md:w-64 bg-choco text-white flex flex-col flex-shrink-0 md:min-h-screen">
          <div className="p-4 border-b border-white/10 hidden md:block">
            <h2 className="font-display font-bold text-lg text-gold">Админ-панель</h2>
            <p className="text-xs text-white/50">{session.user?.email}</p>
          </div>
          
          <nav className="flex-1 px-2 py-4 flex md:flex-col overflow-x-auto md:overflow-y-auto">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors mb-1 whitespace-nowrap ${
                    isActive ? 'bg-primary text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-white/10 hidden md:block">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-white/70 hover:text-white w-full px-2 py-2 transition-colors"
            >
              <LogOut className="w-5 h-5" />
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
