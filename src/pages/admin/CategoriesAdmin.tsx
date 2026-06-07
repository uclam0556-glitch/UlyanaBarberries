import { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, X, Save, Image as ImageIcon, UploadCloud } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { Category } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { localDb } from '@/lib/localDb';
import toast from 'react-hot-toast';
import { supabase, isSupabaseConfigured, uploadImage } from '@/lib/supabase';
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

export default function CategoriesAdmin() {
  const { data: initialCategories, isLoading } = useCategories();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  
  const defaultForm: Partial<Category> = {
    name: '',
    slug: '',
    image_url: '',
    sort_order: 1,
    is_active: true,
  };

  const [formData, setFormData] = useState<Partial<Category>>(defaultForm);

  useEffect(() => {
    if (initialCategories) {
      setCategories(initialCategories);
    }
  }, [initialCategories]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 500;
        const MAX_HEIGHT = 500;
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
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL('image/webp', 0.8);
        setFormData((prev) => ({ ...prev, image_url: compressedBase64 }));
        setIsCompressing(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast.error('Заполните название категории');
      return;
    }

    const saveToast = toast.loading(editingId ? 'Сохранение категории...' : 'Добавление категории...');
    
    try {
      const name = formData.name;
      const slug = name.toLowerCase().replace(/[^a-z0-9а-я]+/gi, '-').replace(/^-+|-+$/g, '');

      let finalImageUrl = formData.image_url || '';

      if (finalImageUrl.startsWith('data:image/')) {
        const blob = dataURItoBlob(finalImageUrl);
        const fileName = `${Date.now()}.webp`;
        const path = `categories/${fileName}`;
        finalImageUrl = await uploadImage(blob, path);
      }

      const categoryData = {
        ...formData,
        slug,
        image_url: finalImageUrl,
        sort_order: Number(formData.sort_order || 1),
      };

      if (isSupabaseConfigured && supabase) {
        if (editingId) {
          const { error } = await supabase
            .from('categories')
            .update(categoryData)
            .eq('id', editingId);
          if (error) throw error;
          
          toast.success('Категория обновлена', { id: saveToast });
        } else {
          const { error } = await supabase
            .from('categories')
            .insert([categoryData]);
          if (error) throw error;

          toast.success('Категория добавлена', { id: saveToast });
        }
        queryClient.invalidateQueries({ queryKey: ['categories'] });
      } else {
        // Fallback to localDb
        if (editingId) {
          const updatedCategory = { ...categoryData, id: editingId } as Category;
          localDb.deleteCategory(editingId);
          const saved = localDb.saveCategory(updatedCategory);
          setCategories(categories.map(c => c.id === editingId ? saved : c).sort((a, b) => a.sort_order - b.sort_order));
          toast.success('Категория обновлена', { id: saveToast });
        } else {
          const newCategory = localDb.saveCategory({
            ...categoryData,
            created_at: new Date().toISOString()
          } as Category);
          setCategories([...categories, newCategory].sort((a, b) => a.sort_order - b.sort_order));
          toast.success('Категория добавлена', { id: saveToast });
        }
      }

      setIsModalOpen(false);
      setEditingId(null);
      setFormData(defaultForm);
    } catch (err: any) {
      console.error(err);
      toast.error(`Ошибка сохранения: ${err.message || err}`, { id: saveToast });
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData(defaultForm);
    setIsModalOpen(true);
  };

  const openEditModal = (category: Category) => {
    setEditingId(category.id!);
    setFormData(category);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Удалить эту категорию?')) {
      const deleteToast = toast.loading('Удаление категории...');
      try {
        if (isSupabaseConfigured && supabase) {
          const { error } = await supabase.from('categories').delete().eq('id', id);
          if (error) throw error;
          queryClient.invalidateQueries({ queryKey: ['categories'] });
          toast.success('Категория удалена', { id: deleteToast });
        } else {
          localDb.deleteCategory(id);
          setCategories(categories.filter(c => c.id !== id));
          toast.success('Категория удалена', { id: deleteToast });
        }
      } catch (err: any) {
        console.error(err);
        toast.error(`Ошибка удаления: ${err.message || err}`, { id: deleteToast });
      }
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h1 className="font-display text-2xl font-bold text-choco">Категории</h1>
        <button 
          onClick={openAddModal}
          className="bg-primary text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20"
        >
          <Plus className="w-4 h-4" />
          Добавить категорию
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">Загрузка...</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-cream-dark/30 text-xs text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4 font-semibold">Порядок</th>
                  <th className="py-3 px-4 font-semibold">Фото</th>
                  <th className="py-3 px-4 font-semibold">Название</th>
                  <th className="py-3 px-4 font-semibold">Статус</th>
                  <th className="py-3 px-4 font-semibold text-right">Действия</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id} className="border-b border-cream-dark hover:bg-cream/50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-choco">{category.sort_order}</td>
                    <td className="py-3 px-4">
                      {category.image_url ? (
                        <img src={category.image_url} alt="" className="w-10 h-10 object-cover rounded-lg border border-cream-dark shadow-sm bg-cream" />
                      ) : (
                        <div className="w-10 h-10 bg-cream-dark/30 rounded-lg flex items-center justify-center text-choco text-xs">🖼️</div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-sm text-choco">{category.name}</p>
                    </td>
                    <td className="py-3 px-4">
                      {category.is_active ? (
                        <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">Активна</span>
                      ) : (
                        <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-bold">Скрыта</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => openEditModal(category)}
                          className="p-2 bg-cream-dark rounded-lg text-choco hover:bg-primary hover:text-white transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(category.id!)}
                          className="p-2 bg-cream-dark rounded-lg text-choco hover:bg-red-500 hover:text-white transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {categories.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500 text-sm">
                      Категории не найдены
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add/Edit Category Modal */}
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
                  {editingId ? 'Редактировать категорию' : 'Новая категория'}
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
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Название *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Например: Подарочные наборы"
                    className="w-full bg-white border border-cream-dark rounded-xl px-4 py-3 text-sm text-choco focus:outline-none focus:border-primary shadow-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Фотография категории</label>
                  <div className="space-y-3">
                    {formData.image_url ? (
                      <div className="relative rounded-2xl overflow-hidden border border-cream-dark shadow-sm h-48 bg-cream flex items-center justify-center">
                        <img 
                          src={formData.image_url} 
                          alt="Превью" 
                          className="w-full h-full object-cover" 
                        />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, image_url: '' })}
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
                        <UploadCloud className="w-8 h-8" />
                        <span className="text-xs font-semibold">
                          {isCompressing ? 'Сжатие...' : 'Загрузить фото категории'}
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

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Порядок сортировки</label>
                  <input
                    type="number"
                    value={formData.sort_order || ''}
                    onChange={(e) => setFormData({ ...formData, sort_order: Number(e.target.value) })}
                    placeholder="1"
                    className="w-full bg-white border border-cream-dark rounded-xl px-4 py-3 text-sm text-choco focus:outline-none focus:border-primary shadow-sm"
                  />
                </div>

                <div className="flex gap-4 p-4 bg-white rounded-xl border border-cream-dark shadow-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={formData.is_active} 
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-4 h-4 accent-primary" 
                    />
                    <span className="text-sm font-semibold text-choco">Активна</span>
                  </label>
                </div>
              </div>

              <div className="p-4 bg-white border-t border-cream-dark shrink-0 pb-safe">
                <button
                  onClick={handleSave}
                  className="w-full bg-primary text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20"
                >
                  <Save className="w-5 h-5" />
                  {editingId ? 'Сохранить изменения' : 'Создать категорию'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
