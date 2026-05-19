import { Order } from '@/types';

const TG_USERNAME = import.meta.env.VITE_TG_USERNAME || 'khamid_example';
const VK_ID = import.meta.env.VITE_VK_ID || '123456789';
const WA_PHONE = import.meta.env.VITE_WA_PHONE || '79000000000';
export const STORE_PHONE = import.meta.env.VITE_STORE_PHONE || '+7 (900) 000-00-00';

export function buildOrderText(order: Order): string {
  const deliveryTimeLabel = order.delivery_time
    ? `⏰ *Время доставки:* ${order.delivery_time}`
    : '';

  return [
    '🍓 *НОВЫЙ ЗАКАЗ — BARBERRIES* 🍓',
    '--------------------------------------',
    `*Клиент:* ${order.customer_name}`,
    `📞 *Телефон:* ${order.customer_phone}`,
    order.customer_address ? `🏠 *Адрес доставки:* ${order.customer_address}` : '',
    deliveryTimeLabel,
    '',
    '🎁 *Состав заказа:*',
    ...order.items.map(item =>
      `🍓 *${item.name}* × ${item.qty} шт. — *${(item.price * item.qty).toLocaleString('ru-RU')} ₽*`
      + (item.options ? `\n  _(${item.options})_` : '')
    ),
    '--------------------------------------',
    `💵 *ИТОГО К ОПЛАТЕ: ${order.total_price.toLocaleString('ru-RU')} ₽*`,
    order.notes ? `\n💬 *Пожелания к заказу:* ${order.notes}` : '',
  ].filter(Boolean).join('\n');
}

export function buildTelegramOrderLink(order: Order): string {
  const text = buildOrderText(order);
  return `https://t.me/${TG_USERNAME}?text=${encodeURIComponent(text)}`;
}

export function buildVKOrderLink(order: Order): string {
  const text = buildOrderText(order);
  return `https://vk.com/im?sel=${VK_ID}&text=${encodeURIComponent(text)}`;
}

export function buildWhatsAppOrderLink(order: Order): string {
  const text = buildOrderText(order);
  return `https://wa.me/${WA_PHONE}?text=${encodeURIComponent(text)}`;
}

export function buildQuickTelegramLink(message: string): string {
  return `https://t.me/${TG_USERNAME}?text=${encodeURIComponent(message)}`;
}

export function buildQuickVKLink(message: string): string {
  return `https://vk.com/im?sel=${VK_ID}&text=${encodeURIComponent(message)}`;
}

export function buildQuickWhatsAppLink(message: string): string {
  return `https://wa.me/${WA_PHONE}?text=${encodeURIComponent(message)}`;
}
