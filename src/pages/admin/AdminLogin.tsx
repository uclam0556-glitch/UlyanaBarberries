import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!isSupabaseConfigured || !supabase) {
      // Mock login for local dev
      toast.success('Успешный вход (Dev Mode)');
      navigate('/admin');
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      navigate('/admin');
    } catch (error: any) {
      toast.error(error.message || 'Ошибка входа');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Вход — Админ-панель</title>
      </Helmet>

      <div className="min-h-screen bg-cream flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-card w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="text-4xl mb-2">🍓</div>
            <h1 className="font-display text-2xl font-bold text-choco">Админ-панель</h1>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-cream border border-cream-dark rounded-xl px-3 py-2.5 text-sm text-choco focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Пароль</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-cream border border-cream-dark rounded-xl px-3 py-2.5 text-sm text-choco focus:outline-none focus:border-primary"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-white font-bold py-3 rounded-xl touch-feedback mt-2 disabled:opacity-70"
            >
              {isLoading ? 'Вход...' : 'Войти'}
            </button>
            
            {!isSupabaseConfigured && (
              <p className="text-xs text-center text-gray-400 mt-4">
                Supabase не настроен. Любые данные пройдут (Dev Mode).
              </p>
            )}
          </form>
        </div>
      </div>
    </>
  );
}
