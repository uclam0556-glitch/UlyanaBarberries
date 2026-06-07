import { useState, useRef, useEffect } from 'react';
import { Plus, Edit, Trash2, Image as ImageIcon, X, Save, UploadCloud } from 'lucide-react';
import { Banner } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { localDb } from '@/lib/localDb';
import toast from 'react-hot-toast';
import { supabase, isSupabaseConfigured, uploadImage } from '@/lib/supabase';

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

export default function BannersAdmin() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const defaultForm: Partial<Banner> = {
    title: '',
    subtitle: '',
    image_url: '',
    link_url: '/catalog',
    sort_order: 1,
    is_active: true,
  };

  const [formData, setFormData] = useState<Partial<Banner>>(defaultForm);

  useEffect(() => {
    const loadBanners = async () => {
      try {
        if (isSupabaseConfigured && supabase) {
          const { data, error } = await supabase.from('banners').select('*').order('sort_order');
          if (error) throw error;
          setBanners(data || []);
        } else {
          setBanners(localDb.getBanners());
        }
      } catch (err) {
        console.error('Error loading banners', err);
        setBanners(localDb.getBanners());
      }
    };
    loadBanners();
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        // Banners need higher resolution, e.g. 1200x800
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
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
        
        // Compress to webp base64 (quality 0.8)
        const base64Data = canvas.toDataURL('image/webp', 0.8);
        setFormData({ ...formData, image_url: base64Data });
        setIsCompressing(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!formData.image_url) {
      toast.error('Загрузите фотографию для баннера');
      return;
    }

    const saveToast = toast.loading(editingId ? 'Сохранение баннера...' : 'Добавление баннера...');
    
    try {
      let imageUrl = formData.image_url;

      // If new upload
      if (imageUrl.startsWith('data:image/')) {
        if (isSupabaseConfigured && supabase) {
          const blob = dataURItoBlob(imageUrl);
          const filename = `banners/${Date.now()}.webp`;
          imageUrl = await uploadImage(blob, filename);
        }
      }

      const bannerData = {
        ...formData,
        image_url: imageUrl,
        sort_order: Number(formData.sort_order || 1),
      };

      if (isSupabaseConfigured && supabase) {
        if (editingId) {
          const { error } = await supabase
            .from('banners')
            .update(bannerData)
            .eq('id', editingId);
          if (error) throw error;
          
          toast.success('Баннер обновлён', { id: saveToast });
        } else {
          const { error } = await supabase
            .from('banners')
            .insert([bannerData]);
          if (error) throw error;

          toast.success('Баннер добавлен', { id: saveToast });
        }
        
        // Reload banners
        const { data } = await supabase.from('banners').select('*').order('sort_order');
        setBanners(data || []);
      } else {
        // Fallback
        if (editingId) {
          const updatedBanner = { ...bannerData, id: editingId } as Banner;
          localDb.deleteBanner(editingId);
          const saved = localDb.saveBanner(updatedBanner);
          setBanners(banners.map(b => b.id === editingId ? saved : b));
          toast.success('Баннер обновлён', { id: saveToast });
        } else {
          const newBanner = localDb.saveBanner({
            ...bannerData,
          } as Banner);
          setBanners([...banners, newBanner]);
          toast.success('Баннер добавлен', { id: saveToast });
        }
      }

      setIsModalOpen(false);
      setEditingId(null);
      setFormData(defaultForm);
    } catch (err: any) {
      console.error(err);
      toast.error(`Ошибка сохранения баннера: ${err.message || err}`, { id: saveToast });
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData(defaultForm);
    setIsModalOpen(true);
  };

  const openEditModal = (banner: Banner) => {
    setEditingId(banner.id!);
    setFormData(banner);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Удалить этот баннер?')) {
      const deleteToast = toast.loading('Удаление баннера...');
      try {
        if (isSupabaseConfigured && supabase) {
          const { error } = await supabase.from('banners').delete().eq('id', id);
          if (error) throw error;
          
          const { data } = await supabase.from('banners').select('*').order('sort_order');
          setBanners(data || []);
          toast.success('Баннер удален', { id: deleteToast });
        } else {
          localDb.deleteBanner(id);
          setBanners(banners.filter(b => b.id !== id));
          toast.success('Баннер удален', { id: deleteToast });
        }
      } catch (err: any) {
        console.error(err);
        toast.error(`Ошибка удаления: ${err.message || err}`, { id: deleteToast });
      }
    }
  };

  // Sort banners by sort_order
  const sortedBanners = [...banners].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h1 className="font-display text-2xl font-bold text-choco">Управление баннерами</h1>
        <button 
          onClick={openAddModal}
          className="bg-primary text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20"
        >
          <Plus className="w-4 h-4" />
          Добавить баннер
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-cream-dark/30 text-xs text-gray-500 uppercase tracking-wider">
                <th className="py-3 px-4 font-semibold">Превью</th>
                <th className="py-3 px-4 font-semibold">Текст на баннере</th>
                <th className="py-3 px-4 font-semibold">Ссылка</th>
                <th className="py-3 px-4 font-semibold">Порядок</th>
                <th className="py-3 px-4 font-semibold">Статус</th>
                <th className="py-3 px-4 font-semibold text-right">Действия</th>
              </tr>
            </thead>
            <tbody>
              {sortedBanners.map((banner) => (
                <tr key={banner.id} className="border-b border-cream-dark hover:bg-cream/50 transition-colors">
                  <td className="py-3 px-4">
                    {banner.image_url ? (
                      <img src={banner.image_url} alt="" className="w-24 h-12 rounded-lg object-cover border border-cream-dark" />
                    ) : (
                      <div className="w-24 h-12 rounded-lg bg-cream-dark flex items-center justify-center">
                        <ImageIcon className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-semibold text-sm text-choco line-clamp-1">{banner.title || '(Без заголовка)'}</p>
                    <p className="text-xs text-gray-500 line-clamp-1">{banner.subtitle}</p>
                  </td>
                  <td className="py-3 px-4 text-xs text-gray-500">{banner.link_url}</td>
                  <td className="py-3 px-4 font-semibold text-choco">{banner.sort_order}</td>
                  <td className="py-3 px-4">
                    {banner.is_active ? (
                      <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">Активен</span>
                    ) : (
                      <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-bold">Скрыт</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => openEditModal(banner)}
                        className="p-2 bg-cream-dark rounded-lg text-choco hover:bg-primary hover:text-white transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(banner.id!)}
                        className="p-2 bg-cream-dark rounded-lg text-choco hover:bg-red-500 hover:text-white transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {banners.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500 text-sm">
                    Баннеры не найдены
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Banner Modal */}
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
                  {editingId ? 'Редактировать баннер' : 'Новый баннер'}
                </h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 space-y-5">
                
                {/* Image Upload */}
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Фотография баннера *</label>
                  
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  
                  {!formData.image_url ? (
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
                          <span className="text-xs text-gray-500 mt-1">Горизонтальное фото</span>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-cream-dark bg-cream group">
                      <img src={formData.image_url} alt="Предпросмотр" className="w-full h-full object-cover" />
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
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Заголовок</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Например: Осенняя скидка"
                    className="w-full bg-white border border-cream-dark rounded-xl px-4 py-3 text-sm text-choco focus:outline-none focus:border-primary shadow-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Подзаголовок</label>
                  <input
                    type="text"
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    placeholder="Ограниченное предложение"
                    className="w-full bg-white border border-cream-dark rounded-xl px-4 py-3 text-sm text-choco focus:outline-none focus:border-primary shadow-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Ссылка</label>
                    <input
                      type="text"
                      value={formData.link_url}
                      onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                      placeholder="/catalog"
                      className="w-full bg-white border border-cream-dark rounded-xl px-4 py-3 text-sm text-choco focus:outline-none focus:border-primary shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Порядок вывода</label>
                    <input
                      type="number"
                      value={formData.sort_order || 1}
                      onChange={(e) => setFormData({ ...formData, sort_order: Number(e.target.value) })}
                      placeholder="1"
                      className="w-full bg-white border border-cream-dark rounded-xl px-4 py-3 text-sm text-choco focus:outline-none focus:border-primary shadow-sm"
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
                    <span className="text-sm font-semibold text-choco">Отображать на сайте</span>
                  </label>
                </div>
              </div>

              <div className="p-4 bg-white border-t border-cream-dark shrink-0 pb-safe">
                <button
                  onClick={handleSave}
                  className="w-full bg-primary text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20"
                >
                  <Save className="w-5 h-5" />
                  {editingId ? 'Сохранить изменения' : 'Создать баннер'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
