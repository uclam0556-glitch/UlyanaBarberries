import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Читаем URL Supabase из переменных окружения Timeweb
const supabaseTarget = process.env.VITE_SUPABASE_URL || 'https://pedudlvzotzusuzwvbhe.supabase.co';

// Настраиваем прокси: все запросы на /supabase-proxy будут перенаправляться на реальный Supabase
app.use('/supabase-proxy', createProxyMiddleware({
  target: supabaseTarget,
  changeOrigin: true,
  pathRewrite: {
    '^/supabase-proxy': '', // убираем префикс перед отправкой
  },
  onProxyRes: function (proxyRes, req, res) {
    // Добавляем заголовки CORS на всякий случай
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
  }
}));

// Раздаем статические файлы React приложения (наш собранный dist)
app.use(express.static(path.join(__dirname, 'dist')));

// Для работы React Router: любой другой запрос возвращает index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Russian Proxy Server running on port ${port}`);
  console.log(`Proxying /supabase-proxy to ${supabaseTarget}`);
});
