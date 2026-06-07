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
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { buildQuickTelegramLink } from '@/lib/social';

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
        const q = query(
          collection(db, 'banners'),
          where('is_active', '==', true),
          orderBy('sort_order')
        );
        const querySnapshot = await getDocs(q);
        const fetchedBanners: any[] = [];
        querySnapshot.forEach((doc) => {
          fetchedBanners.push({ id: doc.id, ...doc.data() });
        });
        if (fetchedBanners.length > 0) {
          setBanners(fetchedBanners);
        }
      } catch (err) {
        console.error('Error loading banners from Firebase', err);
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
            src="/images/chocolate_strawberries_promo.png"
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

      {/* Storytelling Section */}
      <section className="bg-white px-4 py-12">
        <div className="bg-cream-dark rounded-3xl p-6 md:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gold/10 rounded-full blur-2xl" />
          
          <div className="relative z-10">
            <h2 className="font-display text-h2-mobile font-bold text-choco mb-2">
              Искусство в каждой детали
            </h2>
            <div className="gold-divider mb-5" />
            
            <p className="text-gray-600 text-sm md:text-base leading-relaxed mb-4">
              Создание клубники в шоколаде — это не просто десерт, это настоящее ювелирное искусство. Каждое утро мы лично отбираем самые крупные, плотные и сладкие ягоды, чтобы они стали идеальной основой для вашего подарка.
            </p>
            <p className="text-gray-600 text-sm md:text-base leading-relaxed mb-4">
              Мы используем только премиальный <strong className="text-choco font-semibold">бельгийский шоколад Callebaut</strong>. Он темперируется вручную по особой технологии, чтобы получить тот самый фирменный глянцевый блеск и звонкий хруст при укусе.
            </p>
            <div className="flex items-center gap-3 mt-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white text-xl shadow-lg">
                🍓
              </div>
              <div>
                <p className="font-bold text-choco text-sm">С любовью, Ульяна</p>
                <p className="text-xs text-gray-500">Основатель Barberries</p>
              </div>
            </div>
          </div>
        </div>
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
          <button
            onClick={() => window.open(buildQuickTelegramLink('Здравствуйте! У меня есть вопрос 🍓'), '_blank')}
            className="inline-flex items-center justify-center gap-2 bg-[#0088cc] text-white font-bold px-6 py-3.5 rounded-2xl touch-feedback"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.94z"/>
            </svg>
            Написать в Telegram
          </button>
        </div>
      </section>
    </div>
  );
}
