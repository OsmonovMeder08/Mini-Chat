// Утилита для определения доступности бекенда и переключения на mock режим

let isBackendAvailable = true;
let lastBackendCheck = 0;
const BACKEND_CHECK_INTERVAL = 30000; // 30 секунд

// Mock данные
const mockUsers = [
  { 
    id: 1, 
    username: 'admin', 
    email: 'admin@example.com',
    first_name: 'Admin',
    last_name: 'User',
    is_online: true 
  },
  { 
    id: 2, 
    username: 'alice', 
    email: 'alice@example.com',
    first_name: 'Alice',
    last_name: 'Smith',
    is_online: false 
  },
  { 
    id: 3, 
    username: 'bob', 
    email: 'bob@example.com',
    first_name: 'Bob',
    last_name: 'Johnson',
    is_online: true 
  },
];

let mockChats = [];
let mockMessages = {};

// Инициализация mock данных
const initMockData = () => {
  const currentUser = getCurrentMockUser();
  if (!currentUser) return;

  // Создаем чаты с другими пользователями
  mockChats = mockUsers
    .filter(u => u.id !== currentUser.id)
    .map((otherUser, index) => ({
      id: index + 1,
      participants: [currentUser, otherUser],
      last_message: {
        id: index + 1,
        content: index === 0 ? 'Привет! Как дела?' : 'До свидания!',
        sender_id: otherUser.id,
        sender: otherUser,
        created_at: new Date(Date.now() - (index + 1) * 3600000).toISOString(),
        is_read: false
      },
      created_at: new Date(Date.now() - (index + 1) * 86400000).toISOString(),
      updated_at: new Date(Date.now() - (index + 1) * 3600000).toISOString(),
      unread_count: index === 0 ? 1 : 0
    }));

  // Создаем сообщения для каждого чата
  mockChats.forEach(chat => {
    const otherUser = chat.participants.find(p => p.id !== currentUser.id);
    mockMessages[chat.id] = [
      {
        id: 1,
        content: 'Привет!',
        sender_id: otherUser.id,
        sender: otherUser,
        chat_id: chat.id,
        created_at: new Date(Date.now() - 7200000).toISOString(),
        is_read: true
      },
      {
        id: 2,
        content: 'Привет! Как дела?',
        sender_id: currentUser.id,
        sender: currentUser,
        chat_id: chat.id,
        created_at: new Date(Date.now() - 3600000).toISOString(),
        is_read: false
      }
    ];
  });
};

// Получить текущего mock пользователя
const getCurrentMockUser = () => {
  const savedUser = localStorage.getItem('user');
  if (savedUser) {
    try {
      return JSON.parse(savedUser);
    } catch (e) {
      return null;
    }
  }
  return null;
};

// Проверка доступности бекенда
export const checkBackendAvailability = async () => {
  const now = Date.now();
  if (now - lastBackendCheck < BACKEND_CHECK_INTERVAL) {
    return isBackendAvailable;
  }

  try {
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
    const response = await fetch(`${API_BASE_URL}/health/`, {
      method: 'GET',
      timeout: 5000,
    });
    
    isBackendAvailable = response.ok;
    lastBackendCheck = now;
    
    if (isBackendAvailable) {
      console.log('✅ Backend is available');
    } else {
      console.warn('⚠️ Backend is not responding, switching to mock mode');
    }
  } catch (error) {
    console.warn('⚠️ Backend connection failed, using mock data:', error.message);
    isBackendAvailable = false;
    lastBackendCheck = now;
  }

  return isBackendAvailable;
};

// Mock API методы
export const mockAPI = {
  // Аутентификация
  login: async (username, password) => {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Имитация задержки
    
    const user = mockUsers.find(u => u.username === username);
    if (!user || password !== 'password') {
      throw new Error('Invalid credentials');
    }

    const tokens = {
      access: `mock_access_token_${user.id}`,
      refresh: `mock_refresh_token_${user.id}`
    };

    localStorage.setItem('access_token', tokens.access);
    localStorage.setItem('refresh_token', tokens.refresh);
    localStorage.setItem('user', JSON.stringify(user));

    initMockData();

    return {
      data: {
        user,
        tokens,
        message: 'Успешный вход'
      }
    };
  },

  register: async (userData) => {
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (mockUsers.find(u => u.username === userData.username)) {
      throw new Error('Username already exists');
    }

    const newUser = {
      id: mockUsers.length + 1,
      username: userData.username,
      email: userData.email || '',
      first_name: userData.first_name || '',
      last_name: userData.last_name || '',
      is_online: true
    };

    mockUsers.push(newUser);

    const tokens = {
      access: `mock_access_token_${newUser.id}`,
      refresh: `mock_refresh_token_${newUser.id}`
    };

    localStorage.setItem('access_token', tokens.access);
    localStorage.setItem('refresh_token', tokens.refresh);
    localStorage.setItem('user', JSON.stringify(newUser));

    initMockData();

    return {
      data: {
        user: newUser,
        tokens,
        message: 'Пользователь успешно зарегистрирован'
      }
    };
  },

  // Пользователи
  getCurrentUser: async () => {
    const user = getCurrentMockUser();
    if (!user) throw new Error('User not found');
    return { data: user };
  },

  getUsers: async () => {
    const currentUser = getCurrentMockUser();
    const otherUsers = mockUsers.filter(u => u.id !== currentUser?.id);
    return { data: otherUsers };
  },

  // Чаты
  getChats: async () => {
    initMockData();
    return { data: mockChats };
  },

  createChat: async (participantId) => {
    const currentUser = getCurrentMockUser();
    const participant = mockUsers.find(u => u.id === participantId);
    
    if (!participant) throw new Error('Participant not found');

    // Проверяем, существует ли уже чат
    let existingChat = mockChats.find(chat => 
      chat.participants.some(p => p.id === participantId)
    );

    if (existingChat) {
      return { data: existingChat };
    }

    const newChat = {
      id: mockChats.length + 1,
      participants: [currentUser, participant],
      last_message: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      unread_count: 0
    };

    mockChats.unshift(newChat);
    mockMessages[newChat.id] = [];

    return { data: newChat };
  },

  getChatMessages: async (chatId) => {
    return { data: mockMessages[chatId] || [] };
  },

  sendMessage: async (chatId, content) => {
    const currentUser = getCurrentMockUser();
    const chat = mockChats.find(c => c.id === parseInt(chatId));
    
    if (!chat) throw new Error('Chat not found');

    const newMessage = {
      id: Date.now(),
      content,
      sender_id: currentUser.id,
      sender: currentUser,
      chat_id: parseInt(chatId),
      created_at: new Date().toISOString(),
      is_read: false
    };

    if (!mockMessages[chatId]) {
      mockMessages[chatId] = [];
    }
    
    mockMessages[chatId].push(newMessage);

    // Обновляем последнее сообщение в чате
    chat.last_message = newMessage;
    chat.updated_at = new Date().toISOString();

    return { data: newMessage };
  },

  markAsRead: async (chatId) => {
    const currentUser = getCurrentMockUser();
    const messages = mockMessages[chatId] || [];
    
    messages.forEach(msg => {
      if (msg.sender_id !== currentUser.id) {
        msg.is_read = true;
      }
    });

    const chat = mockChats.find(c => c.id === parseInt(chatId));
    if (chat) {
      chat.unread_count = 0;
    }

    return { data: { success: true } };
  }
};

// Wrapper функция для API вызовов с fallback на mock
export const apiWithFallback = async (apiCall, mockCall) => {
  const backendAvailable = await checkBackendAvailability();
  
  if (backendAvailable) {
    try {
      return await apiCall();
    } catch (error) {
      console.warn('API call failed, falling back to mock:', error.message);
      isBackendAvailable = false;
      return await mockCall();
    }
  } else {
    return await mockCall();
  }
};
