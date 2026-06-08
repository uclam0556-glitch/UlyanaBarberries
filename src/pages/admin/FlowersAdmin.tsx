import { useState, useRef, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Save, UploadCloud } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { formatPrice } from '@/lib/utils';
import { Product, Category } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { db, uploadImageToImgbb } from '@/lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { useQueryClient } from '@tanstack/react-query';

export default function FlowersAdmin() {
  const { data: initialProducts, isLoading: isProductsLoading } = useProducts();
  const { data: categoriesList, isLoading: isCategoriesLoading } = useCategories();
  const [flowerCategoryId, setFlowerCategoryId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const [imageFile, setImageFile] = useState<File | null>(null);

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
  };

  const [formData, setFormData] = useState<Partial<Product>>(defaultForm);

  // 1. Find or create the "Flowers" category
  useEffect(() => {
    const findOrCreateCategory = async () => {
      if (isCategoriesLoading || !categoriesList) return;

      const existing = categoriesList.find(c => 
        c.name.toLowerCase().includes('цвет') || c.name.toLowerCase().includes('букет')
      );

      if (existing) {
        setFlowerCategoryId(existing.id);
      } else {
        // Create new category named "Цветы"
        const newCategoryData = {
          name: 'Цветы',
          slug: 'flowers',
          image_url: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?w=800&q=80',
          sort_order: 10,
          is_active: true
        };

        try {
          const docRef = await addDoc(collection(db, 'categories'), newCategoryData);
          setFlowerCategoryId(docRef.id);
          queryClient.invalidateQueries({ queryKey: ['categories'] });
        } catch (err) {
          console.error('Error creating Flowers category in Firebase:', err);
        }
      }
    };

    findOrCreateCategory();
  }, [categoriesList, isCategoriesLoading]);

  // 2. Filter products belonging to the Flower category
  const products = initialProducts && flowerCategoryId 
    ? initialProducts.filter(p => p.category_id === flowerCategoryId) 
    : [];

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
        canvas.getContext('2d')?.drawImage(img, 0, 0, width, height);
        
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
      toast.error('Заполните название и цену цветка/букета');
      return;
    }
    if (!flowerCategoryId) {
      toast.error('Ошибка: Категория для цветов ещё не создана');
      return;
    }

    const saveToast = toast.loading(editingId ? 'Сохранение изменений...' : 'Добавление букета...');
    
    try {
      let imageUrls = [...(formData.images || [])];
      
      if (imageFile) {
        const publicUrl = await uploadImageToImgbb(imageFile);
        imageUrls = [publicUrl];
      }

      const baseSlug = formData.name.toLowerCase().replace(/[^a-z0-9а-я]+/gi, '-').replace(/^-+|-+$/g, '');
      const uniqueSuffix = Math.random().toString(36).substring(2, 7);
      const slug = `${baseSlug}-${uniqueSuffix}`;

      const productData: any = {
        name: formData.name,
        price: Number(formData.price),
        old_price: formData.old_price ? Number(formData.old_price) : null,
        description: formData.description || '',
        images: imageUrls,
        category_id: flowerCategoryId,
        stock_count: Number(formData.stock_count || 10),
        is_active: formData.is_active ?? true,
        is_featured: formData.is_featured ?? false,
        is_constructor_item: false,
        sort_order: formData.sort_order ?? 0,
      };

      if (!editingId) {
        productData.slug = slug;
      }

      if (editingId) {
        await updateDoc(doc(db, 'products', editingId), productData);
        toast.success('Букет успешно обновлён', { id: saveToast });
      } else {
        await addDoc(collection(db, 'products'), productData);
        toast.success('Букет успешно добавлен', { id: saveToast });
      }
      queryClient.invalidateQueries({ queryKey: ['products'] });

      setIsModalOpen(false);
      setEditingId(null);
      setFormData(defaultForm);
      setImageFile(null);
    } catch (err) {
      console.error(err);
      toast.error(`Ошибка сохранения: ${err instanceof Error ? err.message : String(err)}`, { id: saveToast });
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
    if (confirm('Удалить этот цветок / букет?')) {
      const deleteToast = toast.loading('Удаление...');
      try {
        await deleteDoc(doc(db, 'products', id));
        queryClient.invalidateQueries({ queryKey: ['products'] });
        toast.success('Товар удален', { id: deleteToast });
      } catch (err) {
        console.error(err);
        toast.error(`Ошибка удаления: ${err instanceof Error ? err.message : String(err)}`, { id: deleteToast });
      }
    }
  };

  const isLoading = isProductsLoading || isCategoriesLoading;

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-choco flex items-center gap-2">
            <span>🌸</span>
            Управление цветами и букетами
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Специализированный раздел для создания и редактирования живых цветов, авторских букетов и цветочных композиций
          </p>
        </div>
        <button 
          onClick={openAddModal}
          className="bg-primary text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20"
        >
          <Plus className="w-4 h-4" />
          Добавить букет
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">Загрузка цветов...</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-cream-dark/30 text-xs text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4 font-semibold">Фото</th>
                  <th className="py-3 px-4 font-semibold">Название букета</th>
                  <th className="py-3 px-4 font-semibold">Цена</th>
                  <th className="py-3 px-4 font-semibold">Статус</th>
                  <th className="py-3 px-4 font-semibold">Популярен</th>
                  <th className="py-3 px-4 font-semibold text-right">Действия</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b border-cream-dark hover:bg-cream/50 transition-colors">
                    <td className="py-3 px-4">
                      {product.images?.[0] ? (
                        <img src={product.images[0]} alt="" className="w-10 h-10 object-cover rounded-lg border border-cream-dark shadow-sm bg-cream" />
                      ) : (
                        <div className="w-10 h-10 bg-cream-dark/30 rounded-lg flex items-center justify-center text-choco text-xs">🌸</div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-sm text-choco">{product.name}</p>
                      {product.description && (
                        <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{product.description}</p>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-primary">{formatPrice(product.price)}</span>
                        {product.old_price && (
                          <span className="text-xs text-gray-400 line-through">{formatPrice(product.old_price)}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {product.is_active ? (
                        <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">Активен</span>
                      ) : (
                        <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-bold">Скрыт</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {product.is_featured ? (
                        <span className="text-[10px] bg-gold/20 text-gold-dark px-2 py-0.5 rounded-full font-bold">Да (Хит)</span>
                      ) : (
                        <span className="text-[10px] bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full font-bold">Нет</span>
                      )}
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
                {products.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500 text-sm">
                      Букеты цветов ещё не созданы. Нажмите «Добавить букет», чтобы наполнить каталог красивыми цветами! 🌸
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
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
                <h2 className="font-display text-xl font-bold text-choco flex items-center gap-1.5">
                  <span>🌸</span>
                  {editingId ? 'Редактировать букет' : 'Добавить букет'}
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
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Название букета / композиции *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Например: Букет «Розовое облако» из 15 роз"
                    className="w-full bg-white border border-cream-dark rounded-xl px-4 py-3 text-sm text-choco focus:outline-none focus:border-primary shadow-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Цена (₽) *</label>
                    <input
                      type="number"
                      value={formData.price || ''}
                      onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                      placeholder="3500"
                      className="w-full bg-white border border-cream-dark rounded-xl px-4 py-3 text-sm text-choco focus:outline-none focus:border-primary shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Старая цена (₽)</label>
                    <input
                      type="number"
                      value={formData.old_price || ''}
                      onChange={(e) => setFormData({ ...formData, old_price: Number(e.target.value) })}
                      placeholder="4200"
                      className="w-full bg-white border border-cream-dark rounded-xl px-4 py-3 text-sm text-choco focus:outline-none focus:border-primary shadow-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Описание букета</label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Опишите состав букета, высоту, цвет упаковки и другие детали..."
                    rows={4}
                    className="w-full bg-white border border-cream-dark rounded-xl px-4 py-3 text-sm text-choco focus:outline-none focus:border-primary shadow-sm resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Изображение</label>
                  <div className="space-y-3">
                    {formData.images?.[0] ? (
                      <div className="relative rounded-2xl overflow-hidden border border-cream-dark shadow-sm h-48 bg-cream flex items-center justify-center">
                        <img 
                          src={formData.images[0]} 
                          alt="Превью" 
                          className="w-full h-full object-cover" 
                        />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, images: [''] })}
                          className="absolute top-2 right-2 p-1.5 bg-choco/80 text-white rounded-full hover:bg-primary transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isCompressing}
                        className="w-full h-32 border-2 border-dashed border-cream-dark rounded-2xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-choco hover:border-primary transition-colors bg-white/50"
                      >
                        <UploadCloud className="w-8 h-8 text-primary" />
                        <span className="text-xs font-semibold">
                          {isCompressing ? 'Сжатие...' : 'Загрузить фото букета'}
                        </span>
                      </button>
                    )}
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleImageUpload} 
                      accept="image/*" 
                      className="hidden" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex gap-4 p-3 bg-white rounded-xl border border-cream-dark shadow-sm">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={formData.is_active} 
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="w-4 h-4 accent-primary" 
                      />
                      <span className="text-sm font-semibold text-choco">Активен (показывается на сайте)</span>
                    </label>
                  </div>

                  <div className="flex gap-4 p-3 bg-white rounded-xl border border-cream-dark shadow-sm">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={formData.is_featured} 
                        onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                        className="w-4 h-4 accent-primary" 
                      />
                      <span className="text-sm font-semibold text-choco">Хит продаж (на главной странице)</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white border-t border-cream-dark shrink-0 pb-safe">
                <button
                  onClick={handleSave}
                  className="w-full bg-primary text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20"
                >
                  <Save className="w-5 h-5" />
                  {editingId ? 'Сохранить изменения' : 'Создать букет'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
