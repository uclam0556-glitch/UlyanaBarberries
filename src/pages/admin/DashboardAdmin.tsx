import { useState, useEffect } from 'react';
import { Users, ShoppingBag, DollarSign, TrendingUp } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { localDb } from '@/lib/localDb';
import { Order } from '@/types';

import { db } from '@/lib/firebase';
import { collection, getDocs, query } from 'firebase/firestore';

export default function DashboardAdmin() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const q = query(collection(db, 'orders'));
        const querySnapshot = await getDocs(q);
        const fetchedOrders: Order[] = [];
        querySnapshot.forEach((doc) => {
          fetchedOrders.push({ id: doc.id, ...doc.data() } as Order);
        });
        
        const localOrders = localDb.getOrders();
        const allOrders = [...fetchedOrders];
        
        localOrders.forEach(lo => {
          if (!allOrders.find(o => o.id === lo.id)) {
            allOrders.push(lo);
          }
        });
        
        allOrders.sort((a, b) => {
          const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return timeB - timeA;
        });
        
        setOrders(allOrders);
      } catch (e) {
        console.warn('Dashboard fetch error', e);
        const localOrders = localDb.getOrders();
        localOrders.sort((a, b) => {
          const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return timeB - timeA;
        });
        setOrders(localOrders);
      }
    };
    fetchOrders();
  }, []);

  const totalOrders = orders.length;
  
  // Calculate revenue only for confirmed or delivered orders
  const revenue = orders
    .filter(o => o.status === 'confirmed' || o.status === 'delivered')
    .reduce((sum, o) => sum + o.total_price, 0);

  const stats = [
    { label: 'Всего заказов', value: totalOrders.toString(), icon: ShoppingBag, color: 'text-blue-500', bg: 'bg-blue-100' },
    { label: 'Выручка', value: formatPrice(revenue), icon: DollarSign, color: 'text-green-500', bg: 'bg-green-100' },
    { label: 'Новые клиенты', value: '+32', icon: Users, color: 'text-purple-500', bg: 'bg-purple-100' },
    { label: 'Конверсия', value: '4.2%', icon: TrendingUp, color: 'text-orange-500', bg: 'bg-orange-100' },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-choco mb-6">Дашборд</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-5 rounded-2xl shadow-card flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium mb-1">{stat.label}</p>
              <p className="text-xl font-bold text-choco">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-card p-6">
        <h2 className="font-bold text-choco mb-4">Последние заказы</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-cream-dark text-xs text-gray-500">
                <th className="pb-3 font-medium px-4">Заказ</th>
                <th className="pb-3 font-medium px-4">Клиент</th>
                <th className="pb-3 font-medium px-4">Дата</th>
                <th className="pb-3 font-medium px-4">Сумма</th>
                <th className="pb-3 font-medium px-4">Статус</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 5).map((order) => (
                <tr key={order.id} className="border-b border-cream-dark/50 hover:bg-cream/50 transition-colors">
                  <td className="py-4 px-4 text-sm font-semibold text-choco font-mono">#{order.id?.slice(0, 6)}</td>
                  <td className="py-4 px-4 text-sm text-choco">{order.customer_name}</td>
                  <td className="py-4 px-4 text-sm text-gray-500">{new Date(order.created_at!).toLocaleDateString('ru-RU')}</td>
                  <td className="py-4 px-4 text-sm font-semibold text-primary">{formatPrice(order.total_price)}</td>
                  <td className="py-4 px-4">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                      order.status === 'new' ? 'bg-blue-100 text-blue-700' :
                      order.status === 'confirmed' ? 'bg-yellow-100 text-yellow-700' :
                      order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {order.status === 'new' ? 'Новый' : 
                       order.status === 'confirmed' ? 'Подтверждён' : 
                       order.status === 'delivered' ? 'Доставлен' : 'Отменён'}
                    </span>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">
                    Пока нет ни одного заказа
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
