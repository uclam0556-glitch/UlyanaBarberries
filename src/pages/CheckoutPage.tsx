import { Helmet } from 'react-helmet-async';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useCartStore } from '@/store/cartStore';
import { buildVKOrderLink, buildWhatsAppOrderLink, buildTelegramOrderLink, buildOrderText, STORE_PHONE } from '@/lib/social';
import { formatPrice } from '@/lib/utils';
import { Order, OrderItem } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { localDb } from '@/lib/localDb';

const schema = z.object({
  customer_name: z.string().min(2, 'Введите имя (минимум 2 символа)'),
  customer_phone: z.string().min(10, 'Введите корректный номер телефона'),
  delivery_type: z.enum(['delivery', 'pickup']),
  customer_address: z.string().optional(),
  delivery_time: z.string().min(1, 'Выберите время доставки/самовывоза'),
  notes: z.string().optional(),
  agree: z.boolean().refine((val) => val, 'Необходимо согласиться с условиями'),
}).superRefine((data, ctx) => {
  if (data.delivery_type === 'delivery' && (!data.customer_address || data.customer_address.length < 5)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Введите адрес доставки',
      path: ['customer_address'],
    });
  }
});

type FormData = z.infer<typeof schema>;

const deliveryTimes = [
  'Как можно скорее',
  'Через 1-2 часа',
  'Через 2-3 часа',
  'Сегодня вечером (18:00–21:00)',
  'Завтра утром (10:00–13:00)',
  'Завтра днём (13:00–17:00)',
];

import { useState } from 'react';

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCartStore();
  const total = totalPrice();

  const [isSuccess, setIsSuccess] = useState(false);
  const [successPlatform, setSuccessPlatform] = useState<'vk' | 'wa' | 'tg' | 'call' | null>(null);
  const [successUrl, setSuccessUrl] = useState('');
  const [lastOrder, setLastOrder] = useState<Order | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      delivery_type: 'delivery',
    }
  });

  const deliveryType = watch('delivery_type');

  const onSubmit = async (data: FormData, platform: 'vk' | 'wa' | 'tg' | 'call') => {
    const orderItems: OrderItem[] = items.map((item) => ({
      name: item.product.name,
      qty: item.quantity,
      price: item.product.price + item.optionPrice,
      options: Object.entries(item.selectedOptions)
        .map(([key, val]) => `${key}: ${val}`)
        .join(', ') || undefined,
    }));

    const finalAddress = data.delivery_type === 'pickup' 
      ? 'Самовывоз: г. Балашиха, ул. Твардовского, 10А' 
      : data.customer_address || '';

    const order: Order = {
      customer_name: data.customer_name,
      customer_phone: data.customer_phone,
      customer_address: finalAddress,
      delivery_time: data.delivery_time,
      items: orderItems,
      total_price: total,
      notes: data.notes,
      status: 'new',
    };

    setLastOrder(order);
    setSuccessPlatform(platform);

    // Save to Supabase if configured, otherwise use localDb
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('orders').insert([order]);
      } catch (e) {
        console.warn('Order save failed:', e);
      }
    } else {
      localDb.saveOrder(order);
    }

    let url = '';
    // Open Social Network or Call
    if (platform === 'call') {
      url = `tel:${STORE_PHONE.replace(/[^0-9+]/g, '')}`;
      window.location.href = url;
    } else {
      if (platform === 'vk') url = buildVKOrderLink(order);
      if (platform === 'wa') url = buildWhatsAppOrderLink(order);
      if (platform === 'tg') url = buildTelegramOrderLink(order);
      
      setSuccessUrl(url);

      if (platform === 'vk' || platform === 'tg') {
        try {
          await navigator.clipboard.writeText(buildOrderText(order));
          toast.success('Текст заказа скопирован в буфер обмена!', { duration: 4000 });
        } catch (err) {
          console.warn('Failed to copy to clipboard', err);
        }
      }

      // Redirect immediately to the social network app (prevents popup blocks and forces direct messaging)
      window.location.href = url;
    }
    
    setIsSuccess(true);
    clearCart();
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-6 text-center">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-3xl p-8 shadow-card max-w-md w-full space-y-6"
        >
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-4xl mx-auto border-2 border-green-200">
            🎉
          </div>
          
          <div className="space-y-2">
            <h2 className="font-display text-2xl font-bold text-choco">Заказ успешно создан!</h2>
            <p className="text-sm text-gray-500">
              {successPlatform === 'call' 
                ? 'Спасибо за ваш звонок! Наш менеджер уже принимает заказ.' 
                : 'Почти готово! Мы подготовили сообщение с вашим заказом.'}
            </p>
          </div>

          {(successPlatform === 'vk' || successPlatform === 'tg') && (
            <div className="bg-cream p-4 rounded-2xl border border-cream-dark text-xs text-choco/80 text-left space-y-1.5">
              <span className="font-bold text-choco block mb-1">📋 Текст скопирован!</span>
              Мы автоматически сохранили параметры вашего заказа. Просто вставьте сообщение в диалог при переходе.
            </div>
          )}

          <div className="space-y-3 pt-4">
            {successPlatform !== 'call' && successUrl && (
              <a 
                href={successUrl} 
                target="_blank" 
                rel="noreferrer"
                className={`w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 shadow-lg touch-feedback text-base ${
                  successPlatform === 'wa' ? 'bg-[#25D366] shadow-[#25D366]/20' :
                  successPlatform === 'tg' ? 'bg-[#229ED9] shadow-[#229ED9]/20' :
                  'bg-[#0077FF] shadow-[#0077FF]/20'
                }`}
              >
                {successPlatform === 'wa' ? '💬 Перейти в WhatsApp' :
                 successPlatform === 'tg' ? '✈️ Перейти в Telegram' :
                 '📱 Перейти во ВКонтакте'}
              </a>
            )}
            
            <a 
              href="/catalog" 
              className="w-full bg-cream hover:bg-cream-dark/50 text-choco border border-cream-dark font-bold py-4 rounded-2xl flex items-center justify-center text-sm transition-colors"
            >
              Вернуться в каталог
            </a>
          </div>
        </motion.div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
        <div className="text-5xl mb-4">🛒</div>
        <h2 className="font-display text-xl font-bold text-choco mb-2">Корзина пуста</h2>
        <p className="text-gray-500 text-sm mb-4">Добавьте товары для оформления заказа</p>
        <a href="/catalog" className="bg-primary text-white font-bold px-6 py-3 rounded-2xl">
          Перейти в каталог
        </a>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Оформление заказа — Barberries</title>
      </Helmet>

      <div className="min-h-screen bg-cream">
        {/* Header */}
        <div className="bg-white border-b border-cream-dark px-4 py-4">
          <h1 className="font-display text-xl font-bold text-choco">Оформление заказа</h1>
          <p className="text-gray-500 text-xs mt-0.5">Заказ будет отправлен во ВКонтакте</p>
        </div>

        <form onSubmit={handleSubmit((d) => onSubmit(d, 'vk'))} className="p-4 space-y-4">
          {/* Order summary */}
          <div className="bg-white rounded-2xl p-4 shadow-card">
            <h2 className="font-semibold text-sm text-choco mb-3">Ваш заказ</h2>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <img src={item.product.images[0]} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-choco line-clamp-1">{item.product.name}</p>
                    {Object.keys(item.selectedOptions).length > 0 && (
                      <p className="text-[10px] text-gray-400">{Object.values(item.selectedOptions).join(', ')}</p>
                    )}
                    <p className="text-xs text-gray-500">× {item.quantity}</p>
                  </div>
                  <p className="text-sm font-bold text-primary flex-shrink-0">{formatPrice(item.totalPrice)}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-cream-dark mt-3 pt-3 flex justify-between">
              <span className="font-semibold text-choco text-sm">Итого</span>
              <span className="font-bold text-lg text-primary">{formatPrice(total)}</span>
            </div>
          </div>

          {/* Contact form */}
          <div className="bg-white rounded-2xl p-4 shadow-card space-y-3">
            <h2 className="font-semibold text-sm text-choco">Ваши данные</h2>

            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Имя *</label>
              <input
                {...register('customer_name')}
                placeholder="Ваше имя"
                className="w-full bg-cream border border-cream-dark rounded-xl px-3 py-3 text-sm text-choco placeholder-gray-400 focus:outline-none focus:border-primary"
              />
              {errors.customer_name && (
                <p className="text-primary text-xs mt-1">{errors.customer_name.message}</p>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Телефон *</label>
              <input
                {...register('customer_phone')}
                placeholder="+7 (900) 000-00-00"
                type="tel"
                className="w-full bg-cream border border-cream-dark rounded-xl px-3 py-3 text-sm text-choco placeholder-gray-400 focus:outline-none focus:border-primary"
              />
              {errors.customer_phone && (
                <p className="text-primary text-xs mt-1">{errors.customer_phone.message}</p>
              )}
            </div>

            {/* Delivery Tabs */}
            <div className="flex bg-cream p-1 rounded-xl mb-4 border border-cream-dark">
              <button
                type="button"
                onClick={() => setValue('delivery_type', 'delivery')}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  deliveryType === 'delivery' ? 'bg-white text-choco shadow-sm' : 'text-gray-500 hover:text-choco'
                }`}
              >
                Доставка
              </button>
              <button
                type="button"
                onClick={() => setValue('delivery_type', 'pickup')}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  deliveryType === 'pickup' ? 'bg-white text-choco shadow-sm' : 'text-gray-500 hover:text-choco'
                }`}
              >
                Самовывоз
              </button>
            </div>

            {deliveryType === 'pickup' ? (
              <div className="bg-cream-dark/30 p-3 rounded-xl border border-cream-dark">
                <p className="text-xs font-semibold text-gray-500 mb-1">Адрес самовывоза:</p>
                <p className="text-sm font-bold text-choco">г. Балашиха, ул. Твардовского, 10А</p>
              </div>
            ) : (
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Адрес доставки *</label>
                <input
                  {...register('customer_address')}
                  placeholder="Улица, дом, квартира"
                  className="w-full bg-cream border border-cream-dark rounded-xl px-3 py-3 text-sm text-choco placeholder-gray-400 focus:outline-none focus:border-primary"
                />
                {errors.customer_address && (
                  <p className="text-primary text-xs mt-1">{errors.customer_address.message}</p>
                )}
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">
                {deliveryType === 'pickup' ? 'Время самовывоза *' : 'Время доставки *'}
              </label>
              <select
                {...register('delivery_time')}
                className="w-full bg-cream border border-cream-dark rounded-xl px-3 py-3 text-sm text-choco focus:outline-none focus:border-primary appearance-none"
              >
                <option value="">Выберите время</option>
                {deliveryTimes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              {errors.delivery_time && (
                <p className="text-primary text-xs mt-1">{errors.delivery_time.message}</p>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Комментарий</label>
              <textarea
                {...register('notes')}
                placeholder="Пожелания к заказу..."
                rows={2}
                className="w-full bg-cream border border-cream-dark rounded-xl px-3 py-2.5 text-sm text-choco placeholder-gray-400 focus:outline-none focus:border-primary resize-none"
              />
            </div>

            {/* Agreement */}
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                {...register('agree')}
                className="mt-0.5 w-4 h-4 accent-primary"
              />
              <span className="text-xs text-gray-500 leading-relaxed">
                Согласен(на) с условиями обработки персональных данных и политикой конфиденциальности
              </span>
            </label>
            {errors.agree && (
              <p className="text-primary text-xs">{errors.agree.message}</p>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="space-y-3 pt-2">
            <motion.button
              type="button"
              onClick={handleSubmit((d) => onSubmit(d, 'wa'))}
              disabled={isSubmitting}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-[#25D366] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 text-base shadow-lg shadow-[#25D366]/20 touch-feedback disabled:opacity-60"
            >
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Заказать в WhatsApp
            </motion.button>

            <motion.button
              type="button"
              onClick={handleSubmit((d) => onSubmit(d, 'tg'))}
              disabled={isSubmitting}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-[#229ED9] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 text-base shadow-lg shadow-[#229ED9]/20 touch-feedback disabled:opacity-60"
            >
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.892-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
              Заказать в Telegram
            </motion.button>

            <motion.button
              type="button"
              onClick={handleSubmit((d) => onSubmit(d, 'vk'))}
              disabled={isSubmitting}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-[#0077FF] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 text-base shadow-lg shadow-[#0077FF]/20 touch-feedback disabled:opacity-60"
            >
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
                <path d="M15.077 18.066c.277.014.542-.047.801-.16a1.36 1.36 0 0 0 .584-.509c.2-.315.26-.693.208-1.06-.06-.414-.265-.79-.58-1.066-.314-.277-.735-.415-1.15-.386-1.073.076-2.146.068-3.218.01-.89-.048-1.748-.284-2.527-.698-.778-.415-1.455-.992-1.99-1.69a6.837 6.837 0 0 1-1.258-2.316 7.641 7.641 0 0 1-.36-2.551c.02-.756.16-1.503.415-2.215.255-.712.63-1.378 1.106-1.97.476-.593 1.05-1.11 1.696-1.529a7.355 7.355 0 0 1 2.227-.923 7.857 7.857 0 0 1 2.533-.146c.833.09 1.64.333 2.392.715a6.452 6.452 0 0 1 1.954 1.488 5.792 5.792 0 0 1 1.157 2.083c.243.722.348 1.485.31 2.246-.038.762-.218 1.509-.53 2.21a6.388 6.388 0 0 1-1.264 1.84c-.496.502-1.065.92-1.688 1.238-.622.318-1.29.532-1.98.634a7.46 7.46 0 0 1-2.072.071c-.714-.078-1.41-.264-2.062-.547a5.556 5.556 0 0 1-1.728-1.144A5.045 5.045 0 0 1 7.8 8.877c-.313-.61-.482-1.277-.497-1.956-.015-.68.125-1.353.41-1.976a4.912 4.912 0 0 1 1.12-1.636 5.093 5.093 0 0 1 1.673-1.042c.628-.245 1.306-.345 1.983-.292a5.452 5.452 0 0 1 1.942.5 4.887 4.887 0 0 1 1.583 1.096c.45.45.81.978 1.062 1.558.252.58.4 1.203.435 1.837.035.633-.035 1.266-.205 1.87a5.008 5.008 0 0 1-.684 1.644c-.31.483-.7.904-1.152 1.242-.452.338-.958.59-1.494.743A5.443 5.443 0 0 1 12.062 18z"/>
              </svg>
              Заказать во ВКонтакте
            </motion.button>
            
            <motion.button
              type="button"
              onClick={handleSubmit((d) => onSubmit(d, 'call'))}
              disabled={isSubmitting}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-white text-choco border border-cream-dark font-bold py-4 rounded-2xl flex items-center justify-center gap-3 text-base shadow-sm touch-feedback disabled:opacity-60"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              Позвонить для заказа
            </motion.button>
          </div>

          <p className="text-center text-xs text-gray-400 pb-2">
            Выберите удобный способ связи. Ваши данные будут сохранены.
          </p>
        </form>
      </div>
    </>
  );
}
