import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());

// URL настоящего Supabase
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://pedudlvzotzusuzwvbhe.supabase.co';

// Проксируем все запросы с /api/supabase на настоящий Supabase
app.use('/api/supabase', createProxyMiddleware({
  target: SUPABASE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/supabase': '', // убираем /api/supabase из пути при отправке в Supabase
  },
  onProxyRes: function (proxyRes, req, res) {
    // Включаем CORS заголовки для безопасных запросов с нашего фронта
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
  }
}));

// Раздаем статику собранного React-приложения
app.use(express.static(path.join(__dirname, 'dist')));

// Все остальные запросы отправляем в React Router
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist/index.html'));
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`Proxying /api/supabase to ${SUPABASE_URL}`);
});

// Анти-сон механизм для бесплатного Supabase
// Раз в 4 часа делаем легкий запрос, чтобы база не уходила в спячку
setInterval(async () => {
  try {
    const anonKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable__Zz2a4Th9O3a2MMTBgUbdw_VRQ5c7Ve';
    const response = await fetch(`${SUPABASE_URL}/rest/v1/products?select=id&limit=1`, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`
      }
    });
    if (response.ok) {
      console.log(`[${new Date().toISOString()}] Anti-sleep ping successful.`);
    } else {
      console.warn(`[${new Date().toISOString()}] Anti-sleep ping failed:`, response.status);
    }
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Anti-sleep ping error:`, err);
  }
}, 1000 * 60 * 60 * 4); // Каждые 4 часа
