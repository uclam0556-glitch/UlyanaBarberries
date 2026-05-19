import { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, X, Save, Package, UploadCloud } from 'lucide-react';
import { useBoxes } from '@/hooks/useBoxes';
import { BoxConfig } from '@/types';
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

export default function BoxesAdmin() {
  const { data: initialBoxes, isLoading } = useBoxes();
  const [boxes, setBoxes] = useState<BoxConfig[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  
  const defaultForm: Partial<BoxConfig> = {
    name: '',
    capacity: 12,
    base_price: 250,
    image_url: '',
    is_active: true,
  };

  const [formData, setFormData] = useState<Partial<BoxConfig>>(defaultForm);

  useEffect(() => {
    if (initialBoxes) {
      setBoxes(initialBoxes);
    }
  }, [initialBoxes]);

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
    if (!formData.name || !formData.capacity) {
      toast.error('Заполните название коробки и вместимость');
      return;
    }

    const saveToast = toast.loading(editingId ? 'Сохранение коробки...' : 'Добавление коробки...');
    
    try {
      let finalImageUrl = formData.image_url || '';

      if (finalImageUrl.startsWith('data:image/')) {
        const blob = dataURItoBlob(finalImageUrl);
        const fileName = `${Date.now()}.webp`;
        const path = `boxes/${fileName}`;
        finalImageUrl = await uploadImage(blob, path);
      }

      const boxData = {
        ...formData,
        capacity: Number(formData.capacity),
        base_price: Number(formData.base_price || 0),
        image_url: finalImageUrl,
      };

      if (isSupabaseConfigured && supabase) {
        if (editingId) {
          const { error } = await supabase
            .from('box_configs')
            .update(boxData)
            .eq('id', editingId);
          if (error) throw error;
          
          toast.success('Коробка обновлена', { id: saveToast });
        } else {
          const { error } = await supabase
            .from('box_configs')
            .insert([boxData]);
          if (error) throw error;

          toast.success('Коробка добавлена', { id: saveToast });
        }
        queryClient.invalidateQueries({ queryKey: ['boxes'] });
      } else {
        // Fallback for localDb mock configs
        if (editingId) {
          const updatedBox = { ...boxData, id: editingId } as BoxConfig;
          const currentBoxes = [...boxes];
          const index = currentBoxes.findIndex(b => b.id === editingId);
          if (index !== -1) {
            currentBoxes[index] = updatedBox;
          }
          setBoxes(currentBoxes);
          toast.success('Коробка обновлена (локально)', { id: saveToast });
        } else {
          const newBox = {
            ...boxData,
            id: `box-${Date.now()}`,
          } as BoxConfig;
          setBoxes([...boxes, newBox]);
          toast.success('Коробка добавлена (локально)', { id: saveToast });
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

  const openEditModal = (box: BoxConfig) => {
    setEditingId(box.id);
    setFormData(box);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Удалить эту конфигурацию коробки?')) {
      const deleteToast = toast.loading('Удаление коробки...');
      try {
        if (isSupabaseConfigured && supabase) {
          const { error } = await supabase.from('box_configs').delete().eq('id', id);
          if (error) throw error;
          queryClient.invalidateQueries({ queryKey: ['boxes'] });
          toast.success('Коробка удалена', { id: deleteToast });
        } else {
          setBoxes(boxes.filter(b => b.id !== id));
          toast.success('Коробка удалена (локально)', { id: deleteToast });
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
        <h1 className="font-display text-2xl font-bold text-choco">Размеры коробок</h1>
        <button 
          onClick={openAddModal}
          className="bg-primary text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20"
        >
          <Plus className="w-4 h-4" />
          Добавить коробку
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
                  <th className="py-3 px-4 font-semibold">Фото</th>
                  <th className="py-3 px-4 font-semibold">Название</th>
                  <th className="py-3 px-4 font-semibold">Вместимость</th>
                  <th className="py-3 px-4 font-semibold">Базовая цена</th>
                  <th className="py-3 px-4 font-semibold">Статус</th>
                  <th className="py-3 px-4 font-semibold text-right">Действия</th>
                </tr>
              </thead>
              <tbody>
                {boxes.map((box) => (
                  <tr key={box.id} className="border-b border-cream-dark hover:bg-cream/50 transition-colors">
                    <td className="py-3 px-4">
                      {box.image_url ? (
                        <img src={box.image_url} alt="" className="w-10 h-10 object-cover rounded-lg border border-cream-dark shadow-sm bg-cream" />
                      ) : (
                        <div className="w-10 h-10 bg-cream-dark/30 rounded-lg flex items-center justify-center text-choco text-xs">📦</div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-sm text-choco">{box.name}</p>
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-choco">{box.capacity} ягод</td>
                    <td className="py-3 px-4 text-sm font-bold text-primary">{box.base_price} ₽</td>
                    <td className="py-3 px-4">
                      {box.is_active ? (
                        <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">Активна</span>
                      ) : (
                        <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-bold">Скрыта</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => openEditModal(box)}
                          className="p-2 bg-cream-dark rounded-lg text-choco hover:bg-primary hover:text-white transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(box.id)}
                          className="p-2 bg-cream-dark rounded-lg text-choco hover:bg-red-500 hover:text-white transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {boxes.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500 text-sm">
                      Коробки не найдены
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
                <h2 className="font-display text-xl font-bold text-choco">
                  {editingId ? 'Редактировать коробку' : 'Новая коробка'}
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
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Название коробки *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Например: Стандарт коробка"
                    className="w-full bg-white border border-cream-dark rounded-xl px-4 py-3 text-sm text-choco focus:outline-none focus:border-primary shadow-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Вместимость (Количество ягод) *</label>
                  <input
                    type="number"
                    value={formData.capacity || ''}
                    onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                    placeholder="Например: 12"
                    className="w-full bg-white border border-cream-dark rounded-xl px-4 py-3 text-sm text-choco focus:outline-none focus:border-primary shadow-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Цена пустой коробки (₽)</label>
                  <input
                    type="number"
                    value={formData.base_price || ''}
                    onChange={(e) => setFormData({ ...formData, base_price: Number(e.target.value) })}
                    placeholder="Например: 250"
                    className="w-full bg-white border border-cream-dark rounded-xl px-4 py-3 text-sm text-choco focus:outline-none focus:border-primary shadow-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Фотография коробки</label>
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
                          {isCompressing ? 'Сжатие...' : 'Загрузить фото коробки'}
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
                  {editingId ? 'Сохранить изменения' : 'Создать коробку'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
