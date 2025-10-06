# Mini Chat Frontend

Фронтенд приложение для мини-чата, построенное на React + Vite с использованием Tailwind CSS.

## Установка и запуск

### Предварительные требования

- Node.js (версия 16 или выше)
- npm или yarn

### Установка зависимостей

```bash
npm install
```

### Переменные окружения

Создайте файл `.env` в корне проекта или используйте существующий:

```env
# API конфигурация
VITE_API_URL=http://127.0.0.1:8000/api
VITE_SOCKET_URL=ws://127.0.0.1:8000/ws

# Другие настройки
VITE_APP_NAME=Mini Chat
```

### Запуск в режиме разработки

```bash
npm run dev
```

Приложение будет доступно по адресу `http://localhost:5173`

### Сборка для продакшена

```bash
npm run build
```

### Предварительный просмотр продакшен сборки

```bash
npm run preview
```

## Структура проекта

```
src/
├── components/          # React компоненты
│   ├── ChatList.jsx     # Список чатов
│   ├── ChatRoom.jsx     # Комната чата
│   ├── LoginForm.jsx    # Форма входа
│   ├── RegisterForm.jsx # Форма регистрации
│   ├── Message.jsx      # Компонент сообщения
│   ├── Profile.jsx      # Профиль пользователя
│   └── ProtectedRoute.jsx # Защищенные маршруты
├── contexts/            # React контексты
│   └── AuthContext.jsx  # Контекст аутентификации
├── pages/              # Страницы приложения
│   ├── ChatsPage.jsx
│   ├── ChatPage.jsx
│   ├── LoginPage.jsx
│   ├── RegisterPage.jsx
│   └── ProfilePage.jsx
├── utils/              # Утилиты
│   ├── api.js          # API клиент
│   └── socket.js       # WebSocket клиент
├── App.jsx             # Главный компонент
├── main.jsx            # Точка входа
└── index.css           # Стили
```

## Особенности

### Аутентификация

- JWT токены (access + refresh)
- Автоматическое обновление токенов
- Защищенные маршруты

### WebSocket

- Реальное время сообщений
- Индикаторы печати
- Статусы пользователей

### API

- RESTful API для CRUD операций
- Автоматическое добавление токенов
- Обработка ошибок

## Маршруты

- `/login` - Страница входа
- `/register` - Страница регистрации
- `/chats` - Список чатов
- `/chat/:id` - Конкретный чат
- `/profile` - Профиль пользователя

## Технологии

- **React 19** - UI библиотека
- **Vite** - Сборщик
- **React Router** - Маршрутизация
- **Tailwind CSS** - Стили
- **Axios** - HTTP клиент
- **Lucide React** - Иконки

## Подключение к бекенду

Убедитесь, что Django бекенд запущен на `http://127.0.0.1:8000`

### API Endpoints

- `POST /api/auth/login/` - Вход
- `POST /api/auth/register/` - Регистрация
- `GET /api/chats/` - Список чатов
- `POST /api/chats/` - Создание чата
- `GET /api/chats/:id/messages/` - Сообщения чата
- `POST /api/chats/:id/messages/` - Отправка сообщения

### WebSocket

- `ws://127.0.0.1:8000/ws/chat/:id/` - Подключение к чату

## Разработка

### Добавление новых компонентов

1. Создайте компонент в `src/components/`
2. Добавьте необходимые стили с Tailwind CSS
3. Подключите к маршрутам в `App.jsx`

### Работа с API

1. Добавьте новые методы в `src/utils/api.js`
2. Используйте в компонентах через async/await
3. Обрабатывайте ошибки

### WebSocket события

1. Добавьте обработчики в `src/utils/socket.js`
2. Подписывайтесь на события в компонентах
3. Отписывайтесь в cleanup функциях

## Troubleshooting

### Проблемы с CORS

Убедитесь, что Django настроен для разрешения запросов с фронтенда:

```python
# settings.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
```

### Проблемы с WebSocket

Проверьте, что WebSocket сервер запущен и доступен по указанному адресу.

### Проблемы с токенами

Очистите localStorage если токены стали недействительными:

```javascript
localStorage.clear();
```
