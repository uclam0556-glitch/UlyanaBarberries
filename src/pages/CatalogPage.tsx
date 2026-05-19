import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import ProductGrid from '@/components/catalog/ProductGrid';
import { ProductGridSkeleton } from '@/components/catalog/ProductSkeleton';

type SortOption = 'popular' | 'price_asc' | 'price_desc' | 'new';

export default function CatalogPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [showFilters, setShowFilters] = useState(false);

  const { data: categories } = useCategories();
  const { data: products, isLoading } = useProducts(selectedCategory !== 'all' ? selectedCategory : undefined);

  const filtered = useMemo(() => {
    if (!products) return [];
    let result = [...products];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.short_desc?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
      );
    }

    switch (sortBy) {
      case 'price_asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'new':
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      default:
        result.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0));
    }

    return result;
  }, [products, searchQuery, sortBy]);

  return (
    <>
      <Helmet>
        <title>Каталог — Клубника в Шоколаде</title>
        <meta name="description" content="Весь ассортимент клубники в шоколаде. Подарочные наборы, одиночные ягоды, ассорти. Доставка по городу за 2 часа." />
      </Helmet>

      <div className="min-h-screen">
        {/* Search & Filter bar */}
        <div className="sticky top-14 z-30 bg-cream/95 backdrop-blur-sm border-b border-cream-dark px-4 py-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск десертов..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-cream-dark rounded-xl pl-9 pr-4 py-2.5 text-sm text-choco placeholder-gray-400 focus:outline-none focus:border-primary transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border transition-colors touch-feedback ${
                showFilters
                  ? 'bg-primary border-primary text-white'
                  : 'bg-white border-cream-dark text-choco'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="text-xs font-semibold">Фильтр</span>
            </button>
          </div>

          {/* Filter panel */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3"
            >
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">Сортировка</p>
              <div className="flex gap-2 flex-wrap">
                {[
                  { value: 'popular', label: 'Популярные' },
                  { value: 'price_asc', label: 'Дешевле' },
                  { value: 'price_desc', label: 'Дороже' },
                  { value: 'new', label: 'Новинки' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSortBy(opt.value as SortOption)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors touch-feedback ${
                      sortBy === opt.value
                        ? 'bg-primary border-primary text-white'
                        : 'bg-white border-cream-dark text-choco'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Category chips */}
        <div className="px-4 py-3 overflow-x-auto hide-scrollbar">
          <div className="flex gap-2 w-max">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`text-sm font-semibold px-4 py-2 rounded-full transition-colors touch-feedback whitespace-nowrap ${
                selectedCategory === 'all'
                  ? 'bg-primary text-white'
                  : 'bg-white text-choco border border-cream-dark'
              }`}
            >
              Все
            </button>
            {(categories || []).map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.slug)}
                className={`text-sm font-semibold px-4 py-2 rounded-full transition-colors touch-feedback whitespace-nowrap ${
                  selectedCategory === cat.slug
                    ? 'bg-primary text-white'
                    : 'bg-white text-choco border border-cream-dark'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Products */}
        <div className="px-4 pb-4">
          {isLoading ? (
            <ProductGridSkeleton count={6} />
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-3">🔍</div>
              <p className="font-display text-lg font-bold text-choco mb-1">Ничего не найдено</p>
              <p className="text-gray-500 text-sm">Попробуйте другой запрос</p>
              <button
                onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                className="mt-4 text-primary text-sm font-semibold"
              >
                Сбросить фильтры
              </button>
            </div>
          ) : (
            <>
              <p className="text-xs text-gray-500 mb-3">
                Найдено: {filtered.length} {filtered.length === 1 ? 'товар' : filtered.length < 5 ? 'товара' : 'товаров'}
              </p>
              <ProductGrid products={filtered} />
            </>
          )}
        </div>
      </div>
    </>
  );
}
