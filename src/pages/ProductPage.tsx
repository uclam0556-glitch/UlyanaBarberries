import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { ChevronLeft, ShoppingBag, Star, Check, Minus, Plus, Heart, Share2 } from 'lucide-react';
import { useProduct, useProducts } from '@/hooks/useProducts';
import { useCartStore } from '@/store/cartStore';
import { formatPrice } from '@/lib/utils';
import ProductCard from '@/components/catalog/ProductCard';
import toast from 'react-hot-toast';

type TabType = 'description' | 'ingredients' | 'storage';

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: product, isLoading } = useProduct(slug || '');
  const { data: allProducts } = useProducts();
  const { addItem, openCart } = useCartStore();

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<TabType>('description');
  const [isWishlisted, setIsWishlisted] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <div className="aspect-[4/3] shimmer" />
        <div className="p-4 space-y-3">
          <div className="h-6 shimmer rounded-lg w-3/4" />
          <div className="h-4 shimmer rounded-lg w-1/2" />
          <div className="h-8 shimmer rounded-lg w-1/3" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
        <div className="text-5xl mb-4">😔</div>
        <h2 className="font-display text-xl font-bold text-choco mb-2">Товар не найден</h2>
        <Link to="/catalog" className="text-primary font-semibold">Вернуться в каталог</Link>
      </div>
    );
  }

  const coatingOptions = product.options?.filter((o) => o.option_type === 'coating') || [];
  const decorOptions = product.options?.filter((o) => o.option_type === 'decor') || [];

  const optionPrice = Object.entries(selectedOptions).reduce((sum, [type, name]) => {
    const opt = product.options?.find((o) => o.option_type === type && o.option_name === name);
    return sum + (opt?.price_modifier || 0);
  }, 0);

  const totalPrice = (product.price + optionPrice) * quantity;

  const handleAddToCart = () => {
    addItem(product, quantity, selectedOptions, optionPrice);
    toast.success('Добавлено в корзину! 🍓', {
      style: {
        background: '#FDF8F4',
        color: '#1A0A0F',
        border: '1px solid #F9E8ED',
        borderRadius: '12px',
      },
    });
    setTimeout(() => openCart(), 300);
  };

  const similarProducts = (allProducts || [])
    .filter((p) => p.id !== product.id && p.category_id === product.category_id)
    .slice(0, 4);

  return (
    <>
      <Helmet>
        <title>{product.name} — Barberries</title>
        <meta name="description" content={product.short_desc || product.description || ''} />
      </Helmet>

      <div className="min-h-screen bg-white">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-16 left-4 z-10 bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-md touch-feedback"
        >
          <ChevronLeft className="w-5 h-5 text-choco" />
        </button>

        {/* Share & Wishlist */}
        <div className="absolute top-16 right-4 z-10 flex gap-2">
          <button
            onClick={() => setIsWishlisted(!isWishlisted)}
            className="bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-md touch-feedback"
          >
            <Heart
              className={`w-5 h-5 transition-colors ${isWishlisted ? 'fill-primary text-primary' : 'text-choco'}`}
            />
          </button>
        </div>

        {/* Gallery */}
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.img
              key={selectedImage}
              src={product.images[selectedImage]}
              alt={product.name}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="w-full aspect-[4/3] object-cover"
            />
          </AnimatePresence>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="flex gap-2 px-4 py-3 overflow-x-auto hide-scrollbar bg-cream-dark/30">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-colors touch-feedback ${
                    i === selectedImage ? 'border-primary' : 'border-transparent'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="px-4 pt-4 pb-48 sm:pb-32">
          {/* Name & Rating */}
          <h1 className="font-display text-h3-mobile font-bold text-choco leading-snug mb-2">
            {product.name}
          </h1>

          <div className="flex items-center gap-2 mb-4">
            {product.rating && (
              <>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-gold text-gold" />
                  <span className="text-sm font-bold text-choco">{product.rating}</span>
                </div>
                <span className="text-gray-400 text-sm">·</span>
                <span className="text-gray-500 text-sm">{product.reviews_count} отзывов</span>
              </>
            )}
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-2 mb-5">
            <span className="text-2xl font-bold text-primary">{formatPrice(totalPrice)}</span>
            {product.old_price && (
              <span className="text-gray-400 text-base line-through">{formatPrice(product.old_price * quantity)}</span>
            )}
          </div>

          {/* Coating options */}
          {coatingOptions.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-bold text-choco uppercase tracking-wide mb-2">Глазурь</p>
              <div className="flex flex-wrap gap-2">
                {coatingOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setSelectedOptions((prev) => ({ ...prev, coating: opt.option_name }))}
                    className={`text-xs px-3 py-2 rounded-xl border transition-all touch-feedback ${
                      selectedOptions.coating === opt.option_name
                        ? 'bg-primary border-primary text-white'
                        : 'bg-cream border-cream-dark text-choco'
                    }`}
                  >
                    {opt.option_name}
                    {opt.price_modifier > 0 && <span className="opacity-70"> +{opt.price_modifier}₽</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Decor options */}
          {decorOptions.length > 0 && (
            <div className="mb-5">
              <p className="text-xs font-bold text-choco uppercase tracking-wide mb-2">Декор</p>
              <div className="flex flex-wrap gap-2">
                {decorOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setSelectedOptions((prev) => ({ ...prev, decor: opt.option_name }))}
                    className={`text-xs px-3 py-2 rounded-xl border transition-all touch-feedback ${
                      selectedOptions.decor === opt.option_name
                        ? 'bg-primary border-primary text-white'
                        : 'bg-cream border-cream-dark text-choco'
                    }`}
                  >
                    {opt.option_name}
                    {opt.price_modifier > 0 && <span className="opacity-70"> +{opt.price_modifier}₽</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Trust badges */}
          <div className="bg-cream rounded-2xl p-3 mb-5 space-y-2">
            {[
              '✓ Свежая клубника каждый день',
              '✓ Доставка 2 часа по городу',
              '✓ Бесплатная подарочная упаковка',
            ].map((text) => (
              <p key={text} className="text-xs text-accent font-medium">{text}</p>
            ))}
          </div>

          {/* Tabs */}
          <div className="mb-4">
            <div className="flex border-b border-cream-dark mb-4">
              {[
                { key: 'description', label: 'Описание' },
                { key: 'ingredients', label: 'Состав' },
                { key: 'storage', label: 'Хранение' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as TabType)}
                  className={`flex-1 py-2.5 text-xs font-semibold transition-colors border-b-2 -mb-px ${
                    activeTab === tab.key
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-400'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="text-sm text-gray-600 leading-relaxed"
              >
                {activeTab === 'description' && (product.description || product.short_desc)}
                {activeTab === 'ingredients' && (product.ingredients || 'Состав уточняйте у менеджера')}
                {activeTab === 'storage' && (
                  <div>
                    <p>Срок хранения: <strong>{product.shelf_life || '48 часов'}</strong></p>
                    <p className="mt-1">Хранить в холодильнике при +2...+6°C.</p>
                    <p className="mt-1">Не подвергать воздействию прямых солнечных лучей.</p>
                    {product.weight && <p className="mt-1">Вес: <strong>{product.weight}</strong></p>}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Similar products */}
          {similarProducts.length > 0 && (
            <div>
              <h2 className="font-display text-lg font-bold text-choco mb-3">Вам также понравится</h2>
              <div className="grid grid-cols-2 gap-3">
                {similarProducts.map((p, i) => (
                  <ProductCard key={p.id} product={p} index={i} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Fixed bottom bar */}
        <div
          className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] sm:bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-cream-dark p-4 shadow-[0_-8px_30px_-15px_rgba(0,0,0,0.1)]"
        >
          <div className="flex items-center gap-3">
            {/* Quantity */}
            <div className="flex items-center gap-2 bg-cream rounded-xl p-1">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-9 h-9 flex items-center justify-center touch-feedback"
              >
                <Minus className="w-4 h-4 text-choco" />
              </button>
              <span className="w-6 text-center font-bold text-choco">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-9 h-9 flex items-center justify-center touch-feedback"
              >
                <Plus className="w-4 h-4 text-choco" />
              </button>
            </div>

            {/* Add to cart */}
            <button
              onClick={handleAddToCart}
              className="flex-1 flex items-center justify-center gap-2 bg-primary text-white font-bold py-3.5 rounded-2xl touch-feedback hover:bg-primary-dark transition-colors"
            >
              <ShoppingBag className="w-5 h-5" />
              В корзину · {formatPrice(totalPrice)}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
