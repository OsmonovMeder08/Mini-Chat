import axios from 'axios';

// Базовый URL для API
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api';

// Настройка axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor для добавления токена
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor для обработки ответов и обновления токена
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
            refresh: refreshToken,
          });

          const { access } = response.data;
          localStorage.setItem('access_token', access);
          
          // Повторяем оригинальный запрос с новым токеном
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Токен не может быть обновлен, выходим из системы
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// API методы для аутентификации
export const authAPI = {
  login: async (username, password) => {
    const response = await api.post('/auth/login/', { username, password });
    return response;
  },
  
  register: async (userData) => {
    const response = await api.post('/auth/register/', userData);
    return response;
  },
  
  logout: async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      await api.post('/auth/logout/', { refresh: refreshToken });
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  },
  
  refreshToken: async (refreshToken) => {
    const response = await api.post('/auth/token/refresh/', { refresh: refreshToken });
    return response;
  }
};

// API методы для пользователей
export const userAPI = {
  // Получить текущего пользователя
  getCurrentUser: () => api.get('/auth/user/'),
  
  // Получить всех пользователей
  getUsers: () => api.get('/users/'),
  
  // Получить пользователя по ID
  getUserById: (id) => api.get(`/users/${id}/`),
  
  // Обновить профиль
  updateProfile: (data) => api.patch('/auth/user/', data),
  
  // Обновить статус онлайн
  updateOnlineStatus: (isOnline) => api.patch('/auth/user/', { is_online: isOnline })
};

// API методы для чатов
export const chatAPI = {
  // Получить все чаты пользователя
  getChats: () => api.get('/chats/'),
  
  // Создать новый чат
  createChat: (participantId) => api.post('/chats/', { participant_id: participantId }),
  
  // Получить чат по ID
  getChatById: (chatId) => api.get(`/chats/${chatId}/`),
  
  // Получить сообщения чата
  getChatMessages: (chatId, page = 1) => api.get(`/chats/${chatId}/messages/`, { 
    params: { page }
  }),
  
  // Отправить сообщение
  sendMessage: (chatId, content) => api.post(`/chats/${chatId}/messages/`, { 
    content 
  }),
  
  // Пометить сообщения как прочитанные
  markAsRead: (chatId) => api.post(`/chats/${chatId}/mark_read/`),
  
  // Удалить сообщение
  deleteMessage: (chatId, messageId) => api.delete(`/chats/${chatId}/messages/${messageId}/`),
  
  // Редактировать сообщение
  editMessage: (chatId, messageId, content) => api.patch(`/chats/${chatId}/messages/${messageId}/`, {
    content
  })
};

export default api;
