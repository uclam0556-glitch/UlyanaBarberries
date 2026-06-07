import { useState, useEffect } from 'react';
import { Eye, Search, Filter, X, Download, Printer } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, getDocs, updateDoc, doc, query, orderBy } from 'firebase/firestore';
import { localDb } from '@/lib/localDb';
import { formatPrice } from '@/lib/utils';
import { Order } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function OrdersAdmin() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const q = query(collection(db, 'orders'), orderBy('created_at', 'desc'));
      const querySnapshot = await getDocs(q);
      const fetchedOrders: Order[] = [];
      querySnapshot.forEach((doc) => {
        fetchedOrders.push({ id: doc.id, ...doc.data() } as Order);
      });
      setOrders(fetchedOrders);
    } catch (e: any) {
      console.warn('Firebase orders error', e);
      setOrders(localDb.getOrders());
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, 'orders', id), { status });
      fetchOrders();
      toast.success('Статус обновлён');
    } catch (err) {
      console.warn(err);
      localDb.updateOrderStatus(id, status);
      fetchOrders();
      toast.success('Статус обновлён (Локально)');
    }
  };

  const filtered = orders.filter(o => 
    o.customer_name.toLowerCase().includes(search.toLowerCase()) || 
    o.customer_phone.includes(search)
  );

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h1 className="font-display text-2xl font-bold text-choco">Управление заказами</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        <div className="p-4 border-b border-cream-dark flex gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск по имени или телефону..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-cream border border-cream-dark rounded-xl pl-9 pr-4 py-2 text-sm text-choco focus:outline-none focus:border-primary"
            />
          </div>
          <button className="p-2 bg-cream border border-cream-dark rounded-xl text-choco hover:bg-cream-dark transition-colors">
            <Filter className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">Загрузка...</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-cream-dark/30 text-xs text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4 font-semibold">Дата</th>
                  <th className="py-3 px-4 font-semibold">Клиент</th>
                  <th className="py-3 px-4 font-semibold">Сумма</th>
                  <th className="py-3 px-4 font-semibold">Статус</th>
                  <th className="py-3 px-4 font-semibold text-right">Действия</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => (
                  <tr key={order.id} className="border-b border-cream-dark hover:bg-cream/50 transition-colors">
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {new Date(order.created_at!).toLocaleString('ru-RU')}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-sm text-choco">{order.customer_name}</p>
                      <p className="text-xs text-gray-500">{order.customer_phone}</p>
                    </td>
                    <td className="py-3 px-4 font-bold text-primary">{formatPrice(order.total_price)}</td>
                    <td className="py-3 px-4">
                      <select
                        value={order.status}
                        onChange={(e) => updateStatus(order.id!, e.target.value)}
                        className={`text-xs px-2.5 py-1 rounded-full font-semibold border-none focus:ring-0 cursor-pointer ${
                          order.status === 'new' ? 'bg-blue-100 text-blue-700' :
                          order.status === 'confirmed' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}
                      >
                        <option value="new">Новый</option>
                        <option value="confirmed">Подтверждён</option>
                        <option value="delivered">Доставлен</option>
                        <option value="cancelled">Отменён</option>
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => setSelectedOrder(order)}
                          className="p-2 bg-cream-dark rounded-lg text-choco hover:bg-primary hover:text-white transition-colors" 
                          title="Посмотреть чек"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500 text-sm">
                      Заказы не найдены
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Receipt Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-choco/80 backdrop-blur-sm"
              onClick={() => setSelectedOrder(null)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-[#FAF9F6] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-cream-dark bg-white shrink-0">
                <h2 className="font-display font-bold text-choco">Электронный чек</h2>
                <div className="flex items-center gap-2">
                  <button className="p-2 text-gray-500 hover:text-choco hover:bg-cream rounded-xl transition-colors">
                    <Printer className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-500 hover:text-choco hover:bg-cream rounded-xl transition-colors">
                    <Download className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setSelectedOrder(null)}
                    className="p-2 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-xl transition-colors ml-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Receipt Content */}
              <div className="p-6 overflow-y-auto" style={{ backgroundImage: 'radial-gradient(#E8E1D9 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                <div className="bg-white p-6 shadow-sm border border-cream-dark/50" style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 10px), 98% 100%, 96% calc(100% - 10px), 94% 100%, 92% calc(100% - 10px), 90% 100%, 88% calc(100% - 10px), 86% 100%, 84% calc(100% - 10px), 82% 100%, 80% calc(100% - 10px), 78% 100%, 76% calc(100% - 10px), 74% 100%, 72% calc(100% - 10px), 70% 100%, 68% calc(100% - 10px), 66% 100%, 64% calc(100% - 10px), 62% 100%, 60% calc(100% - 10px), 58% 100%, 56% calc(100% - 10px), 54% 100%, 52% calc(100% - 10px), 50% 100%, 48% calc(100% - 10px), 46% 100%, 44% calc(100% - 10px), 42% 100%, 40% calc(100% - 10px), 38% 100%, 36% calc(100% - 10px), 34% 100%, 32% calc(100% - 10px), 30% 100%, 28% calc(100% - 10px), 26% 100%, 24% calc(100% - 10px), 22% 100%, 20% calc(100% - 10px), 18% 100%, 16% calc(100% - 10px), 14% 100%, 12% calc(100% - 10px), 10% 100%, 8% calc(100% - 10px), 6% 100%, 4% calc(100% - 10px), 2% 100%, 0 calc(100% - 10px))' }}>
                  {/* Brand */}
                  <div className="text-center mb-6">
                    <div className="text-3xl mb-2">🍓</div>
                    <h3 className="font-display font-bold text-choco text-lg uppercase tracking-wider">Ulyana Katalog</h3>
                    <p className="text-xs text-gray-500 mt-1">Клубника в шоколаде премиум класса</p>
                  </div>

                  <div className="border-t border-dashed border-gray-300 my-4" />

                  {/* Order Info */}
                  <div className="space-y-2 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Заказ №:</span>
                      <span className="font-mono text-choco font-semibold">{selectedOrder.id?.slice(0, 8) || '0001'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Дата:</span>
                      <span className="text-choco">{new Date(selectedOrder.created_at!).toLocaleString('ru-RU')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Статус:</span>
                      <span className="font-semibold text-choco">
                        {selectedOrder.status === 'new' ? 'Новый' :
                         selectedOrder.status === 'confirmed' ? 'Подтверждён' :
                         selectedOrder.status === 'delivered' ? 'Доставлен' : 'Отменён'}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-dashed border-gray-300 my-4" />

                  {/* Customer Info */}
                  <div className="space-y-2 mb-6">
                    <h4 className="text-xs font-bold text-choco uppercase tracking-wider mb-3">Данные покупателя</h4>
                    <div className="text-sm">
                      <p className="font-semibold text-choco">{selectedOrder.customer_name}</p>
                      <p className="text-choco mt-1">{selectedOrder.customer_phone}</p>
                      <p className="text-gray-600 mt-1 text-xs leading-relaxed">{selectedOrder.customer_address}</p>
                      <p className="text-gray-500 mt-2 text-xs">Доставка: {selectedOrder.delivery_time}</p>
                      {selectedOrder.notes && (
                        <p className="text-gray-500 mt-1 text-xs italic">Комментарий: {selectedOrder.notes}</p>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-dashed border-gray-300 my-4" />

                  {/* Items */}
                  <div className="mb-6">
                    <h4 className="text-xs font-bold text-choco uppercase tracking-wider mb-3">Позиции</h4>
                    <div className="space-y-3">
                      {selectedOrder.items.map((item, idx) => (
                        <div key={idx} className="text-sm flex justify-between items-start gap-4">
                          <div>
                            <p className="font-semibold text-choco">{item.name}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{item.qty} шт × {formatPrice(item.price)}</p>
                            {item.options && (
                              <p className="text-[10px] text-gray-400 mt-0.5">{item.options}</p>
                            )}
                          </div>
                          <p className="font-bold text-choco">{formatPrice(item.price * item.qty)}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-gray-800 my-4" />

                  {/* Total */}
                  <div className="flex justify-between items-center pb-4">
                    <span className="font-display font-bold text-choco text-lg uppercase">Итого</span>
                    <span className="font-display font-bold text-primary text-xl">{formatPrice(selectedOrder.total_price)}</span>
                  </div>

                  <div className="text-center mt-4">
                    {/* Barcode mock */}
                    <div className="font-mono text-[10px] text-gray-400 tracking-[0.25em]">
                      ||| || ||| | || ||| || |||
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
