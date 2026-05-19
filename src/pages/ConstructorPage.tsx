import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ChevronRight, Package, Check } from 'lucide-react';
import { useConstructorStore } from '@/store/constructorStore';
import { useCartStore } from '@/store/cartStore';
import { useProducts, useConstructorProducts } from '@/hooks/useProducts';
import { useBoxes } from '@/hooks/useBoxes';
import { formatPrice } from '@/lib/utils';
import { BoxConfig, Product } from '@/types';
import toast from 'react-hot-toast';

export default function ConstructorPage() {
  const {
    selectedBox, items, step, note,
    setBox, addItem, removeItem, setNote, setStep, reset, totalItems, totalPrice, isBoxFull,
  } = useConstructorStore();
  const { addItem: addToCart, openCart } = useCartStore();
  const { data: products, isLoading: isProductsLoading } = useConstructorProducts();
  const { data: boxes, isLoading: isBoxesLoading } = useBoxes();

  const filledCount = totalItems();
  const capacity = selectedBox?.capacity || 0;
  const fillPercent = capacity > 0 ? (filledCount / capacity) * 100 : 0;

  const handleAddToCart = () => {
    if (filledCount === 0 || !selectedBox) return;

    const totalBerriesPrice = items.reduce((sum, ci) => sum + ci.product.price * ci.quantity, 0);
    const totalBoxPrice = selectedBox.base_price + totalBerriesPrice;

    // Создаем виртуальный товар, описывающий весь собранный набор
    const customBoxProduct: Product = {
      id: `custom-box-${selectedBox.id}-${Date.now()}`,
      name: `Свой набор (${selectedBox.name})`,
      price: totalBoxPrice,
      images: [selectedBox.image_url || ''],
      is_active: true,
      slug: `custom-box-${selectedBox.id}-${Date.now()}`,
      sort_order: 1,
      description: `Индивидуально собранный набор из ягод.`,
      created_at: new Date().toISOString(),
      is_featured: false,
      stock_count: 999,
    };

    const berriesSummary = items.map((ci) => `${ci.product.name} ×${ci.quantity}`).join(', ');
    const selectedOptions: Record<string, string> = {
      'Состав': berriesSummary,
      'Вместимость': `${selectedBox.capacity} ягод`,
    };

    if (note.trim()) {
      selectedOptions['Надпись'] = note.trim();
    }

    addToCart(customBoxProduct, 1, selectedOptions, 0);

    toast.success('Набор добавлен в корзину! 🎁', {
      style: {
        background: '#FDF8F4',
        color: '#1A0A0F',
        border: '1px solid #F9E8ED',
        borderRadius: '12px',
      },
    });
    reset();
    setTimeout(() => openCart(), 300);
  };

  return (
    <>
      <Helmet>
        <title>Собери свой набор — Barberries</title>
        <meta name="description" content="Собери свой идеальный подарочный набор из клубники в шоколаде. Выбери коробку и наполнение." />
      </Helmet>

      <div className="min-h-screen">
        {/* Header */}
        <div className="bg-gradient-to-r from-choco to-accent px-4 py-6">
          <h1 className="font-display text-h2-mobile font-bold text-white mb-1">
            Собери свой набор
          </h1>
          <p className="text-white/70 text-sm">Создай свой идеальный подарок</p>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mt-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    s === step ? 'bg-gold text-white' :
                    s < step ? 'bg-green-400 text-white' : 'bg-white/20 text-white/50'
                  }`}
                >
                  {s < step ? <Check className="w-3.5 h-3.5" /> : s}
                </div>
                {s < 3 && <div className={`h-0.5 w-8 rounded-full ${s < step ? 'bg-green-400' : 'bg-white/20'}`} />}
              </div>
            ))}
            <div className="ml-2">
              <p className="text-white text-xs font-medium">
                {step === 1 ? 'Выбери коробку' : step === 2 ? 'Наполни набор' : 'Итог'}
              </p>
            </div>
          </div>
        </div>

        {/* Step 1: Box selection */}
        {step === 1 && (
          <div className="p-4">
            <p className="text-gray-500 text-sm mb-4">Выберите размер коробки для вашего набора:</p>
            <div className="space-y-3">
              {isBoxesLoading ? (
                <div className="p-8 text-center text-gray-500 text-sm">Загрузка коробок...</div>
              ) : (boxes || []).length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-sm">Коробки не найдены</div>
              ) : (
                (boxes || []).map((box) => (
                  <BoxCard key={box.id} box={box} onSelect={setBox} />
                ))
              )}
            </div>
          </div>
        )}

        {/* Step 2: Fill box */}
        {step === 2 && selectedBox && (
          <div className="p-4">
            {/* Progress bar */}
            <div className="bg-white rounded-2xl p-4 mb-4 shadow-card">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-choco">
                  Заполнено: {filledCount}/{capacity}
                </p>
                {isBoxFull() && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                    Полная!
                  </span>
                )}
              </div>
              <div className="h-2 bg-cream-dark rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary to-gold rounded-full"
                  animate={{ width: `${fillPercent}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>

              {/* Box slots visualization */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {Array.from({ length: capacity }).map((_, i) => {
                  const filled = i < filledCount;
                  return (
                    <motion.div
                      key={i}
                      animate={filled ? { scale: [1, 1.2, 1] } : {}}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm transition-colors ${
                        filled ? 'bg-primary/20 text-primary' : 'bg-cream-dark'
                      }`}
                    >
                      {filled ? '🍓' : ''}
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Products grid */}
            <p className="text-xs font-bold text-choco uppercase tracking-wide mb-3">
              Выберите ягоды:
            </p>
            {isProductsLoading ? (
              <div className="text-center py-8 text-gray-500 text-sm">Загрузка ягод...</div>
            ) : (products || []).length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                Ягоды для конструктора ещё не добавлены. Добавьте их в админ-панели с пометкой «Ягода для конструктора».
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {(products || []).map((product) => {
                  const inBox = items.find((i) => i.product.id === product.id);
                  const inBoxCount = inBox?.quantity || 0;
                  return (
                    <ConstructorProductCard
                      key={product.id}
                      product={product}
                      count={inBoxCount}
                      isFull={isBoxFull() && inBoxCount === 0}
                      onAdd={() => addItem(product)}
                      onRemove={() => removeItem(product.id)}
                    />
                  );
                })}
              </div>
            )}

            {/* Next step */}
            {filledCount > 0 && (
              <motion.button
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setStep(3)}
                className="w-full mt-6 bg-primary text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 touch-feedback"
              >
                К оформлению
                <ChevronRight className="w-5 h-5" />
              </motion.button>
            )}
          </div>
        )}

        {/* Step 3: Summary */}
        {step === 3 && (
          <div className="p-4 space-y-4">
            <div className="bg-white rounded-2xl p-4 shadow-card">
              <h2 className="font-display text-lg font-bold text-choco mb-3">Ваш набор</h2>
              <div className="space-y-2">
                {items.map((ci) => (
                  <div key={ci.product.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img src={ci.product.images[0]} alt="" className="w-10 h-10 rounded-xl object-cover" />
                      <div>
                        <p className="text-sm font-semibold text-choco line-clamp-1">{ci.product.name}</p>
                        <p className="text-xs text-gray-500">× {ci.quantity}</p>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-primary">
                      {formatPrice(ci.product.price * ci.quantity)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="border-t border-cream-dark mt-3 pt-3 flex justify-between">
                <span className="font-semibold text-choco">Итого:</span>
                <span className="font-bold text-xl text-primary">{formatPrice(totalPrice())}</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-card">
              <label className="text-xs font-bold text-choco uppercase tracking-wide block mb-2">
                Пожелания / Надпись на открытке
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Напишите ваши пожелания..."
                rows={3}
                className="w-full bg-cream border border-cream-dark rounded-xl px-3 py-2.5 text-sm text-choco placeholder-gray-400 focus:outline-none focus:border-primary resize-none"
              />
            </div>

            <button
              onClick={handleAddToCart}
              className="w-full bg-primary text-white font-bold py-4 rounded-2xl touch-feedback text-base"
            >
              🛒 Добавить в корзину
            </button>
            <button
              onClick={() => setStep(2)}
              className="w-full text-gray-500 text-sm py-2"
            >
              ← Изменить состав
            </button>
          </div>
        )}
      </div>
    </>
  );
}

function BoxCard({ box, onSelect }: { box: BoxConfig; onSelect: (box: BoxConfig) => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(box)}
      className="w-full bg-white rounded-2xl p-4 flex items-center gap-4 shadow-card border-2 border-transparent hover:border-primary transition-colors"
    >
      <img src={box.image_url} alt={box.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
      <div className="flex-1 text-left">
        <p className="font-display text-base font-bold text-choco">{box.name}</p>
        <p className="text-sm text-gray-500">{box.capacity} ягод</p>
        <p className="text-primary font-bold text-sm mt-0.5">от {formatPrice(box.base_price)}</p>
      </div>
      <Package className="w-5 h-5 text-gold flex-shrink-0" />
    </motion.button>
  );
}

function ConstructorProductCard({
  product, count, isFull, onAdd, onRemove,
}: {
  product: Product;
  count: number;
  isFull: boolean;
  onAdd: () => void;
  onRemove: () => void;
}) {
  return (
    <div className={`bg-white rounded-2xl overflow-hidden shadow-card ${isFull ? 'opacity-50' : ''}`}>
      <div className="relative aspect-square">
        <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
        {count > 0 && (
          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
            <span className="text-3xl font-bold text-white drop-shadow-lg">{count}</span>
          </div>
        )}
      </div>
      <div className="p-2">
        <p className="text-xs font-semibold text-choco line-clamp-2 leading-snug">{product.name}</p>
        <p className="text-xs font-bold text-primary mb-2 mt-0.5">{formatPrice(product.price)} / шт</p>
        <div className="flex items-center gap-1">
          {count > 0 && (
            <button
              onClick={onRemove}
              className="flex-1 bg-cream-dark text-choco text-xs font-bold py-1.5 rounded-lg touch-feedback"
            >
              −
            </button>
          )}
          <button
            onClick={onAdd}
            disabled={isFull}
            className={`flex-1 text-xs font-bold py-1.5 rounded-lg touch-feedback transition-colors ${
              isFull ? 'bg-gray-100 text-gray-400' : 'bg-primary text-white'
            }`}
          >
            {count > 0 ? '+' : 'Добавить'}
          </button>
        </div>
      </div>
    </div>
  );
}
