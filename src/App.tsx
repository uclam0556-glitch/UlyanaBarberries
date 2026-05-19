import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import Layout from '@/components/layout/Layout';
import HomePage from '@/pages/HomePage';
import CatalogPage from '@/pages/CatalogPage';
import ProductPage from '@/pages/ProductPage';
import ConstructorPage from '@/pages/ConstructorPage';
import CartPage from '@/pages/CartPage';
import CheckoutPage from '@/pages/CheckoutPage';

import AdminLogin from '@/pages/admin/AdminLogin';
import AdminLayout from '@/pages/admin/AdminLayout';
import DashboardAdmin from '@/pages/admin/DashboardAdmin';
import ProductsAdmin from '@/pages/admin/ProductsAdmin';
import FlowersAdmin from '@/pages/admin/FlowersAdmin';
import CategoriesAdmin from '@/pages/admin/CategoriesAdmin';
import OrdersAdmin from '@/pages/admin/OrdersAdmin';
import BannersAdmin from '@/pages/admin/BannersAdmin';
import BoxesAdmin from '@/pages/admin/BoxesAdmin';
import ConstructorItemsAdmin from '@/pages/admin/ConstructorItemsAdmin';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Layout><HomePage /></Layout>} />
        <Route path="/catalog" element={<Layout><CatalogPage /></Layout>} />
        <Route path="/product/:slug" element={<Layout><ProductPage /></Layout>} />
        <Route path="/constructor" element={<Layout><ConstructorPage /></Layout>} />
        <Route path="/cart" element={<Layout><CartPage /></Layout>} />
        <Route path="/checkout" element={<Layout><CheckoutPage /></Layout>} />
        
        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<DashboardAdmin />} />
          <Route path="products" element={<ProductsAdmin />} />
          <Route path="flowers" element={<FlowersAdmin />} />
          <Route path="constructor-items" element={<ConstructorItemsAdmin />} />
          <Route path="categories" element={<CategoriesAdmin />} />
          <Route path="orders" element={<OrdersAdmin />} />
          <Route path="banners" element={<BannersAdmin />} />
          <Route path="boxes" element={<BoxesAdmin />} />
        </Route>

        <Route path="*" element={
          <Layout>
            <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
              <div className="text-6xl mb-4">🍓</div>
              <h1 className="font-display text-2xl font-bold text-choco mb-2">Страница не найдена</h1>
              <a href="/" className="text-primary font-semibold">На главную</a>
            </div>
          </Layout>
        } />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AnimatedRoutes />
          <Toaster position="top-center" />
        </BrowserRouter>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
