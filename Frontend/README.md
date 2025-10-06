# Mini Chat - React Frontend

Современное веб-приложение для обмена сообщениями в реальном времени, построенное на React с использованием WebSocket для мгновенных сообщений.

## Особенности

- 🔐 **Аутентификация** - Регистрация и вход пользователей
- 💬 **Чаты в реальном времени** - Мгновенные сообщения через WebSocket
- 👥 **Управление пользователями** - Поиск и создание чатов с другими пользователями
- 📱 **Адаптивный дизайн** - Работает на всех устройствах
- 🔔 **Индикаторы статуса** - Онлайн статус и уведомления о печати
- 📋 **Профиль пользователя** - Редактирование личной информации

## Технологии

- **React 19** - Основная библиотека
- **React Router** - Маршрутизация
- **Tailwind CSS** - Стилизация
- **Axios** - HTTP клиент
- **Socket.IO Client** - WebSocket соединения
- **Lucide React** - Иконки
- **Vite** - Сборщик

## Структура проекта

```
src/
├── components/          # React компоненты
│   ├── LoginForm.jsx   # Форма входа
│   ├── RegisterForm.jsx # Форма регистрации
│   ├── ChatList.jsx    # Список чатов
│   ├── ChatRoom.jsx    # Окно чата
│   ├── Message.jsx     # Компонент сообщения
│   ├── Profile.jsx     # Профиль пользователя
│   └── ProtectedRoute.jsx # Защищенные маршруты
├── pages/              # Страницы приложения
│   ├── LoginPage.jsx
│   ├── RegisterPage.jsx
│   ├── ChatsPage.jsx
│   ├── ChatPage.jsx
│   └── ProfilePage.jsx
├── contexts/           # React контексты
│   └── AuthContext.jsx # Контекст аутентификации
├── utils/              # Утилиты
│   ├── api.js         # API методы
│   └── socket.js      # WebSocket утилиты
└── App.jsx            # Главный компонент
```

## Маршруты

- `/login` - Страница входа
- `/register` - Страница регистрации
- `/chats` - Список чатов (требует авторизации)
- `/chat/:id` - Конкретный чат (требует авторизации)
- `/profile` - Профиль пользователя (требует авторизации)

## Установка и запуск

1. **Установить зависимости**
```bash
npm install
```

2. **Настроить переменные окружения**
Файл `.env` уже создан:
```env
VITE_API_URL=http://localhost:3001
VITE_SOCKET_URL=http://localhost:3001
VITE_APP_NAME=Mini Chat
```

3. **Запустить в режиме разработки**
```bash
npm run dev
```

4. **Собрать для продакшена**
```bash
npm run build
```

## Зависимости

### Основные зависимости
- `react` - Основная библиотека React
- `react-dom` - DOM рендерер для React
- `react-router-dom` - Маршрутизация для React
- `axios` - HTTP клиент
- `socket.io-client` - WebSocket клиент
- `lucide-react` - Современные иконки

### Зависимости разработки
- `vite` - Быстрый сборщик
- `tailwindcss` - CSS фреймворк
- `eslint` - Линтер кода

## Backend API

Приложение ожидает следующие API эндпоинты:

### Аутентификация
- `POST /api/auth/login` - Вход
- `POST /api/auth/register` - Регистрация

### Пользователи
- `GET /api/users` - Список всех пользователей
- `GET /api/user/me` - Текущий пользователь
- `PUT /api/user/profile` - Обновление профиля

### Чаты
- `GET /api/chats` - Список чатов пользователя
- `POST /api/chats` - Создание нового чата
- `GET /api/chats/:id/messages` - Сообщения чата
- `POST /api/chats/:id/messages` - Отправка сообщения
- `PUT /api/chats/:id/read` - Пометить как прочитанное

### WebSocket события
- `join_chat` - Присоединиться к чату
- `leave_chat` - Покинуть чат
- `send_message` - Отправить сообщение
- `typing` - Начал печатать
- `stop_typing` - Закончил печатать
- `new_message` - Новое сообщение
- `user_status_changed` - Изменение статуса пользователя
