import { useState, useRef, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Image as ImageIcon, X, Save, UploadCloud } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { formatPrice } from '@/lib/utils';
import { Product } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { localDb } from '@/lib/localDb';
import toast from 'react-hot-toast';
import { db, uploadImageToImgbb } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { useQueryClient } from '@tanstack/react-query';

function dataURItoBlob(dataURI: string) {
  const byteString = atob(dataURI.split(',')[1]);
  const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeString });
}

export default function ProductsAdmin() {
  const { data: initialProducts, isLoading } = useProducts();
  const { data: categoriesList } = useCategories();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    if (initialProducts) {
      setProducts(initialProducts);
    }
  }, [initialProducts]);
  
  const defaultForm: Partial<Product> = {
    name: '',
    price: 0,
    old_price: 0,
    description: '',
    images: [''],
    stock_count: 10,
    is_active: true,
    is_featured: false,
    is_constructor_item: false,
    category_id: undefined,
  };

  const [formData, setFormData] = useState<Partial<Product>>(defaultForm);

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase())) || [];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setImageFile(file);

    setIsCompressing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('react');
        canvas.getContext('2d')?.drawImage(img, 0, 0, width, height);
        
        // Compress to webp base64 (quality 0.8)
        const base64Data = canvas.toDataURL('image/webp', 0.8);
        setFormData({ ...formData, images: [base64Data] });
        setIsCompressing(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.price) {
      toast.error('Заполните название и текущую цену');
      return;
    }

    const saveToast = toast.loading(editingId ? 'Сохранение изменений...' : 'Добавление товара...');
    
    try {
      let imageUrls = [...(formData.images || [])];
      
      if (imageFile) {
        const publicUrl = await uploadImageToImgbb(imageFile);
        imageUrls = [publicUrl];
      }

      const baseSlug = formData.name.toLowerCase().replace(/[^a-z0-9а-я]+/gi, '-').replace(/^-+|-+$/g, '');
      const uniqueSuffix = Math.random().toString(36).substring(2, 7);
      const slug = `${baseSlug}-${uniqueSuffix}`;
      const productData = {
        name: formData.name,
        description: formData.description || '',
        slug,
        images: imageUrls,
        category_id: formData.category_id && formData.category_id !== '1' && formData.category_id !== '2' && formData.category_id !== '3' ? formData.category_id : null,
        price: Number(formData.price),
        old_price: formData.old_price ? Number(formData.old_price) : null,
        stock_count: Number(formData.stock_count || 10),
        is_active: formData.is_active ?? true,
        is_featured: formData.is_featured ?? false,
        is_constructor_item: formData.is_constructor_item ?? false,
        sort_order: formData.sort_order ?? 0,
      };

      if (editingId) {
        await updateDoc(doc(db, 'products', editingId), productData);
        toast.success('Товар обновлён', { id: saveToast });
      } else {
        await addDoc(collection(db, 'products'), productData);
        toast.success('Товар добавлен', { id: saveToast });
      }
      queryClient.invalidateQueries({ queryKey: ['products'] });

      setIsModalOpen(false);
      setEditingId(null);
      setFormData(defaultForm);
      setImageFile(null);
    } catch (err: any) {
      console.error(err);
      toast.error(`Ошибка сохранения: ${err.message || err}`, { id: saveToast });
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData(defaultForm);
    setImageFile(null);
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingId(product.id!);
    setFormData(product);
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Удалить этот товар?')) {
      const deleteToast = toast.loading('Удаление товара...');
      try {
        await deleteDoc(doc(db, 'products', id));
        queryClient.invalidateQueries({ queryKey: ['products'] });
        toast.success('Товар удален', { id: deleteToast });
      } catch (err: any) {
        console.error(err);
        toast.error(`Ошибка удаления: ${err.message || err}`, { id: deleteToast });
      }
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h1 className="font-display text-2xl font-bold text-choco">Управление товарами</h1>
        <button 
          onClick={openAddModal}
          className="bg-primary text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20"
        >
          <Plus className="w-4 h-4" />
          Добавить товар
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        <div className="p-4 border-b border-cream-dark">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск по названию..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-cream border border-cream-dark rounded-xl pl-9 pr-4 py-2 text-sm text-choco focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">Загрузка...</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-cream-dark/30 text-xs text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4 font-semibold">Фото</th>
                  <th className="py-3 px-4 font-semibold">Название</th>
                  <th className="py-3 px-4 font-semibold">Цена</th>
                  <th className="py-3 px-4 font-semibold">Остаток</th>
                  <th className="py-3 px-4 font-semibold">Статус</th>
                  <th className="py-3 px-4 font-semibold text-right">Действия</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product: Product) => (
                  <tr key={product.id} className="border-b border-cream-dark hover:bg-cream/50 transition-colors">
                    <td className="py-3 px-4">
                      {product.images?.[0] ? (
                        <img src={product.images[0]} alt="" className="w-12 h-12 rounded-lg object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-cream-dark flex items-center justify-center">
                          <ImageIcon className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-sm text-choco line-clamp-1">{product.name}</p>
                      <p className="text-xs text-gray-500">{product.category?.name || 'Без категории'}</p>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-semibold text-primary">{formatPrice(product.price)}</span>
                        {product.old_price && product.old_price > product.price && (
                          <span className="text-xs text-gray-400 line-through">{formatPrice(product.old_price)}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-choco">{product.stock_count} шт</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1.5 flex-wrap">
                        {product.is_active ? (
                          <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">Активен</span>
                        ) : (
                          <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-bold">Скрыт</span>
                        )}
                        {product.is_featured && (
                          <span className="text-[10px] bg-gold-light text-gold-dark px-2 py-0.5 rounded-full font-bold">Хит</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => openEditModal(product)}
                          className="p-2 bg-cream-dark rounded-lg text-choco hover:bg-primary hover:text-white transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(product.id!)}
                          className="p-2 bg-cream-dark rounded-lg text-choco hover:bg-red-500 hover:text-white transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500 text-sm">
                      Товары не найдены
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add/Edit Product Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-choco/20 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md bg-[#FAF9F6] h-full shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-cream-dark bg-white shrink-0">
                <h2 className="font-display text-xl font-bold text-choco">
                  {editingId ? 'Редактировать товар' : 'Новый товар'}
                </h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 space-y-5">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Название товара *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Например: Клубника Premium"
                    className="w-full bg-white border border-cream-dark rounded-xl px-4 py-3 text-sm text-choco focus:outline-none focus:border-primary shadow-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Текущая цена (₽) *</label>
                    <input
                      type="number"
                      value={formData.price || ''}
                      onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                      placeholder="Напр: 1500"
                      className="w-full bg-white border border-cream-dark rounded-xl px-4 py-3 text-sm text-choco focus:outline-none focus:border-primary shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Старая цена (₽)</label>
                    <input
                      type="number"
                      value={formData.old_price || ''}
                      onChange={(e) => setFormData({ ...formData, old_price: Number(e.target.value) })}
                      placeholder="Без скидки"
                      className="w-full bg-white border border-cream-dark rounded-xl px-4 py-3 text-sm text-choco focus:outline-none focus:border-primary shadow-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Остаток (шт)</label>
                  <input
                    type="number"
                    value={formData.stock_count || ''}
                    onChange={(e) => setFormData({ ...formData, stock_count: Number(e.target.value) })}
                    placeholder="10"
                    className="w-full bg-white border border-cream-dark rounded-xl px-4 py-3 text-sm text-choco focus:outline-none focus:border-primary shadow-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Фотография товара</label>
                  
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  
                  {!formData.images?.[0] ? (
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full aspect-video rounded-xl border-2 border-dashed border-cream-dark bg-cream flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors touch-feedback"
                    >
                      {isCompressing ? (
                        <div className="text-primary font-semibold text-sm">Обработка фото...</div>
                      ) : (
                        <>
                          <UploadCloud className="w-8 h-8 text-gray-400 mb-2" />
                          <span className="text-sm font-semibold text-choco">Нажмите, чтобы загрузить</span>
                          <span className="text-xs text-gray-500 mt-1">PNG, JPG до 5MB</span>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-cream-dark bg-cream group">
                      <img src={formData.images[0]} alt="Предпросмотр" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-choco/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button 
                          onClick={() => fileInputRef.current?.click()}
                          className="bg-white text-choco text-xs font-bold px-4 py-2 rounded-lg touch-feedback"
                        >
                          Изменить фото
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Категория</label>
                  <select
                    value={formData.category_id || ''}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value || undefined })}
                    className="w-full bg-white border border-cream-dark rounded-xl px-4 py-3 text-sm text-choco focus:outline-none focus:border-primary shadow-sm appearance-none"
                  >
                    <option value="">Выберите категорию</option>
                    {categoriesList?.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Описание</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Красивое описание товара..."
                    rows={4}
                    className="w-full bg-white border border-cream-dark rounded-xl px-4 py-3 text-sm text-choco focus:outline-none focus:border-primary shadow-sm resize-none"
                  />
                </div>
                
                <div className="flex gap-4 p-4 bg-white rounded-xl border border-cream-dark shadow-sm flex-wrap">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={formData.is_active} 
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-4 h-4 accent-primary" 
                    />
                    <span className="text-sm font-semibold text-choco">Активен</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={formData.is_featured} 
                      onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                      className="w-4 h-4 accent-gold" 
                    />
                    <span className="text-sm font-semibold text-choco">Хит продаж</span>
                  </label>
                </div>
              </div>

              <div className="p-4 bg-white border-t border-cream-dark shrink-0 pb-safe">
                <button
                  onClick={handleSave}
                  className="w-full bg-primary text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20"
                >
                  <Save className="w-5 h-5" />
                  {editingId ? 'Сохранить изменения' : 'Сохранить товар'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
