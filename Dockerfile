FROM node:20-alpine

WORKDIR /app

# Копируем package.json и устанавливаем зависимости
COPY package*.json ./
RUN npm install

# Копируем весь исходный код
COPY . .

# Собираем React-приложение (Vite)
RUN npm run build

# Открываем порт
EXPOSE 3000

# Запускаем наш прокси-сервер
CMD ["npm", "start"]
