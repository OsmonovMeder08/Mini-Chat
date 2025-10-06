import { authAPI, userAPI, chatAPI } from './api';

// Функция для проверки доступности бекенда
export const checkBackendConnection = async () => {
  try {
    // Простой запрос для проверки доступности API
    const response = await fetch('http://127.0.0.1:8000/api/', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      console.log('✅ Backend is available');
      return true;
    } else {
      console.warn('⚠️ Backend responded with error:', response.status);
      return false;
    }
  } catch (error) {
    console.warn('❌ Backend is not available:', error.message);
    return false;
  }
};

// Проверим подключение при загрузке
checkBackendConnection().then(isAvailable => {
  if (!isAvailable) {
    console.warn(`
🔧 SETUP REQUIRED:
1. Убедитесь, что Django backend запущен на http://127.0.0.1:8000
2. Проверьте настройки CORS в Django
3. Убедитесь, что все миграции применены
4. Создайте суперпользователя: python manage.py createsuperuser

📝 Backend должен быть доступен на:
- API: http://127.0.0.1:8000/api/
- WebSocket: ws://127.0.0.1:8000/ws/
    `);
  }
});

export { authAPI, userAPI, chatAPI };
