import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, Star } from 'lucide-react';
import { Product } from '@/types';
import { formatPrice, getDiscountPercent, triggerHaptic } from '@/lib/utils';
import { useCartStore } from '@/store/cartStore';
import toast from 'react-hot-toast';

interface ProductCardProps {
  product: Product;
  index?: number;
}

const cardVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: 'easeOut' as const },
  }),
};

export default function ProductCard({ product, index = 0 }: ProductCardProps) {
  const { addItem, openCart } = useCartStore();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    triggerHaptic('medium');
    addItem(product);
    toast.success(`${product.name} добавлена в корзину! 🍓`, {
      duration: 2000,
      style: {
        background: '#FDF8F4',
        color: '#1A0A0F',
        border: '1px solid #F9E8ED',
        borderRadius: '12px',
        fontSize: '13px',
        fontFamily: 'Inter, sans-serif',
      },
    });
    setTimeout(() => openCart(), 300);
  };

  const discount = product.old_price
    ? getDiscountPercent(product.price, product.old_price)
    : 0;

  const isHit = product.is_featured;

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -2 }}
    >
      <Link to={`/product/${product.slug}`} className="block group">
        <div className="bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-shadow duration-300">
          {/* Image */}
          <div className="relative aspect-product overflow-hidden bg-cream-dark">
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />

            {/* Badges */}
            <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
              {isHit && (
                <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  ХИТ
                </span>
              )}
              {discount > 0 && (
                <span className="bg-gold text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  -{discount}%
                </span>
              )}
            </div>

            {/* Quick add button (desktop hover) */}
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              whileHover={{ opacity: 1, y: 0 }}
              className="absolute bottom-3 right-3 bg-primary text-white p-2.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden md:flex items-center justify-center"
              onClick={handleAddToCart}
            >
              <ShoppingBag className="w-4 h-4" />
            </motion.button>
          </div>

          {/* Info */}
          <div className="p-3">
            <h3 className="font-display text-sm font-semibold text-choco leading-snug line-clamp-2 mb-1">
              {product.name}
            </h3>

            {product.short_desc && (
              <p className="text-gray-500 text-xs line-clamp-1 mb-2">
                {product.short_desc}
              </p>
            )}

            {/* Rating */}
            {product.rating && (
              <div className="flex items-center gap-1 mb-2.5">
                <Star className="w-3 h-3 fill-gold text-gold" />
                <span className="text-xs font-semibold text-choco">{product.rating}</span>
                <span className="text-xs text-gray-400">({product.reviews_count})</span>
              </div>
            )}

            {/* Price row */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-baseline gap-1.5">
                <span className="text-base font-bold text-primary">
                  {formatPrice(product.price)}
                </span>
                {product.old_price && (
                  <span className="text-xs text-gray-400 line-through">
                    {formatPrice(product.old_price)}
                  </span>
                )}
              </div>

              {/* Mobile add button */}
              <button
                onClick={handleAddToCart}
                className="flex-shrink-0 bg-primary text-white p-2 rounded-xl touch-feedback active:bg-primary-dark transition-colors"
              >
                <ShoppingBag className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
