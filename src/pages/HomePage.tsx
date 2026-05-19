import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { ChevronRight, Package, Truck, Gift, Clock } from 'lucide-react';
import { localDb } from '@/lib/localDb';
import { useFeaturedProducts } from '@/hooks/useProducts';
import ProductCard from '@/components/catalog/ProductCard';
import { ProductGridSkeleton } from '@/components/catalog/ProductSkeleton';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

const features = [
  { icon: '🍓', title: 'Свежая клубника', desc: 'Только отборные ягоды каждый день' },
  { icon: '🌸', title: 'Свежие цветы', desc: 'Красивые букеты и композиции' },
  { icon: '🍫', title: 'Бельгийский шоколад', desc: 'Настоящий премиум-шоколад' },
  { icon: '🚚', title: 'Доставка за 2 часа', desc: 'По Балашихе и Москве' },
];

const reviews = [
  { name: 'Алина К.', text: 'Невероятно вкусно! Заказывала на день рождения — все в восторге!', rating: 5 },
  { name: 'Максим Т.', text: 'Лучший подарок для любимой. Красивая упаковка, свежайшая клубника!', rating: 5 },
  { name: 'Дарья В.', text: 'Уже третий раз заказываю. Качество стабильное, вкус отменный!', rating: 5 },
];

export default function HomePage() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 4000 })]);
  const [productsEmblaRef] = useEmblaCarousel({ loop: true, align: 'start' }, [Autoplay({ delay: 3500, stopOnInteraction: false })]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [banners, setBanners] = useState(localDb.getBanners().filter(b => b.is_active));
  const { data: featuredProducts, isLoading } = useFeaturedProducts();

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCurrentSlide(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
  }, [emblaApi, onSelect]);

  useEffect(() => {
    const loadBanners = async () => {
      try {
        if (isSupabaseConfigured && supabase) {
          const { data, error } = await supabase
            .from('banners')
            .select('*')
            .eq('is_active', true)
            .order('sort_order');
          if (error) throw error;
          if (data && data.length > 0) {
            setBanners(data);
          }
        }
      } catch (err) {
        console.error('Error loading banners from Supabase', err);
      }
    };
    loadBanners();
  }, []);

  return (
    <div className="space-y-0">
      {/* Hero Slider */}
      <section className="relative overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {banners.map((banner) => (
            <div key={banner.id} className="flex-none w-full relative">
              <div className="relative h-[70vh] min-h-[500px]">
                <img
                  src={banner.image_url}
                  alt={banner.title || ''}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-hero-overlay" />
                <div className="absolute inset-0 flex flex-col justify-end p-6 pb-10">
                  <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    {banner.title && (
                      <h1 className="font-display text-h1-mobile font-bold text-white leading-tight mb-2 whitespace-pre-line">
                        {banner.title}
                      </h1>
                    )}
                    {banner.subtitle && (
                      <p className="text-white/80 text-base mb-6">{banner.subtitle}</p>
                    )}
                    <Link
                      to={banner.link_url || '/catalog'}
                      className="inline-flex items-center gap-2 bg-primary text-white font-bold px-6 py-3.5 rounded-2xl touch-feedback"
                    >
                      Выбрать подарок
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </motion.div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => emblaApi?.scrollTo(i)}
              className={`transition-all duration-300 rounded-full ${
                i === currentSlide ? 'w-6 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/40'
              }`}
            />
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-white px-4 py-8">
        <div className="grid grid-cols-2 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className="flex flex-col items-center text-center p-4 rounded-2xl bg-cream"
            >
              <span className="text-2xl mb-2">{f.icon}</span>
              <p className="font-semibold text-xs text-choco mb-0.5">{f.title}</p>
              <p className="text-[11px] text-gray-500 leading-snug">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="px-4 py-8">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-display text-h2-mobile font-bold text-choco">Хиты продаж</h2>
            <div className="gold-divider" />
          </div>
          <Link to="/catalog" className="text-primary text-sm font-semibold flex items-center gap-1">
            Все <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {isLoading ? (
          <ProductGridSkeleton count={4} />
        ) : (
          <div className="overflow-hidden cursor-grab active:cursor-grabbing px-1" ref={productsEmblaRef}>
            <div className="flex">
              {(featuredProducts || []).slice(0, 10).map((product, index) => (
                <div key={product.id} className="flex-none w-[46%] sm:w-[31%] md:w-[23%] mr-3">
                  <ProductCard product={product} index={index} />
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Constructor promo */}
      <section className="px-4 pb-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl"
        >
          <img
            src="https://images.unsplash.com/photo-1548365328-8c6db3220e4c?w=800&q=80"
            alt="Конструктор наборов"
            className="w-full h-48 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-choco/80 to-transparent" />
          <div className="absolute inset-0 flex items-center p-6">
            <div>
              <p className="text-gold text-xs font-semibold uppercase tracking-wider mb-1">
                Новинка
              </p>
              <h2 className="font-display text-xl font-bold text-white mb-1 leading-snug">
                Собери свой<br />идеальный набор
              </h2>
              <p className="text-white/70 text-xs mb-4">Сам выбираешь ягоды и шоколад</p>
              <Link
                to="/constructor"
                className="inline-flex items-center gap-1.5 bg-gold text-white text-sm font-bold px-4 py-2.5 rounded-xl touch-feedback"
              >
                <Package className="w-3.5 h-3.5" />
                Создать набор
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Reviews */}
      <section className="bg-primary-light px-4 py-8">
        <h2 className="font-display text-h2-mobile font-bold text-choco mb-1 text-center">
          Отзывы покупателей
        </h2>
        <div className="gold-divider mx-auto mb-5" />

        <div className="space-y-3">
          {reviews.map((review, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-2xl p-4 shadow-card"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-gold flex items-center justify-center text-white font-bold text-xs">
                  {review.name[0]}
                </div>
                <div>
                  <p className="font-semibold text-sm text-choco">{review.name}</p>
                  <div className="stars text-xs">{'★'.repeat(review.rating)}</div>
                </div>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">"{review.text}"</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Contact CTA */}
      <section className="px-4 py-8 text-center bg-white rounded-t-3xl border-t border-cream-dark">
        <div className="text-3xl mb-3">🍓</div>
        <h2 className="font-display text-lg font-bold text-choco mb-2">
          Наш адрес и контакты
        </h2>
        <p className="text-sm font-semibold text-choco mb-2">
          📍 г. Балашиха, ул. Твардовского, 10А
        </p>
        <p className="text-gray-500 text-sm mb-5">
          Есть вопросы? Напишите нам — ответим за 5 минут!
        </p>
        <div className="flex flex-col gap-3 max-w-xs mx-auto">
          <a
            href="https://vk.com/im?sel=123456789"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-[#0077FF] text-white font-bold px-6 py-3.5 rounded-2xl touch-feedback"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
              <path d="M15.077 18.066c.277.014.542-.047.801-.16a1.36 1.36 0 0 0 .584-.509c.2-.315.26-.693.208-1.06-.06-.414-.265-.79-.58-1.066-.314-.277-.735-.415-1.15-.386-1.073.076-2.146.068-3.218.01-.89-.048-1.748-.284-2.527-.698-.778-.415-1.455-.992-1.99-1.69a6.837 6.837 0 0 1-1.258-2.316 7.641 7.641 0 0 1-.36-2.551c.02-.756.16-1.503.415-2.215.255-.712.63-1.378 1.106-1.97.476-.593 1.05-1.11 1.696-1.529a7.355 7.355 0 0 1 2.227-.923 7.857 7.857 0 0 1 2.533-.146c.833.09 1.64.333 2.392.715a6.452 6.452 0 0 1 1.954 1.488 5.792 5.792 0 0 1 1.157 2.083c.243.722.348 1.485.31 2.246-.038.762-.218 1.509-.53 2.21a6.388 6.388 0 0 1-1.264 1.84c-.496.502-1.065.92-1.688 1.238-.622.318-1.29.532-1.98.634a7.46 7.46 0 0 1-2.072.071c-.714-.078-1.41-.264-2.062-.547a5.556 5.556 0 0 1-1.728-1.144A5.045 5.045 0 0 1 7.8 8.877c-.313-.61-.482-1.277-.497-1.956-.015-.68.125-1.353.41-1.976a4.912 4.912 0 0 1 1.12-1.636 5.093 5.093 0 0 1 1.673-1.042c.628-.245 1.306-.345 1.983-.292a5.452 5.452 0 0 1 1.942.5 4.887 4.887 0 0 1 1.583 1.096c.45.45.81.978 1.062 1.558.252.58.4 1.203.435 1.837.035.633-.035 1.266-.205 1.87a5.008 5.008 0 0 1-.684 1.644c-.31.483-.7.904-1.152 1.242-.452.338-.958.59-1.494.743A5.443 5.443 0 0 1 12.062 18z"/>
            </svg>
            Написать ВКонтакте
          </a>
        </div>
      </section>
    </div>
  );
}
