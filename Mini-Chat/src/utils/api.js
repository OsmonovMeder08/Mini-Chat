// Mock данные для демонстрации без бекенда

// Mock пользователи
const mockUsers = [
  { id: 1, username: 'admin', isOnline: true, lastSeen: new Date() },
  { id: 2, username: 'user1', isOnline: false, lastSeen: new Date(Date.now() - 300000) },
  { id: 3, username: 'user2', isOnline: true, lastSeen: new Date() },
  { id: 4, username: 'alice', isOnline: false, lastSeen: new Date(Date.now() - 600000) },
  { id: 5, username: 'bob', isOnline: true, lastSeen: new Date() },
];

// Mock чаты
let mockChats = [];

// Mock сообщения
let mockMessages = {};

// Инициализация mock данных
const initializeMockData = () => {
  const savedChats = localStorage.getItem('mockChats');
  const savedMessages = localStorage.getItem('mockMessages');
  
  if (savedChats) {
    mockChats = JSON.parse(savedChats);
  } else {
    // Создаем тестовые чаты
    mockChats = [
      {
        id: 1,
        participants: [mockUsers[0], mockUsers[1]],
        lastMessage: {
          id: 1,
          content: 'Привет! Как дела?',
          senderId: 2,
          sender: mockUsers[1],
          createdAt: new Date(Date.now() - 3600000).toISOString()
        },
        updatedAt: new Date(Date.now() - 3600000).toISOString(),
        unreadCount: 0
      },
      {
        id: 2,
        participants: [mockUsers[0], mockUsers[2]],
        lastMessage: {
          id: 2,
          content: 'Увидимся завтра!',
          senderId: 3,
          sender: mockUsers[2],
          createdAt: new Date(Date.now() - 7200000).toISOString()
        },
        updatedAt: new Date(Date.now() - 7200000).toISOString(),
        unreadCount: 1
      }
    ];
    localStorage.setItem('mockChats', JSON.stringify(mockChats));
  }
  
  if (savedMessages) {
    mockMessages = JSON.parse(savedMessages);
  } else {
    // Создаем тестовые сообщения
    mockMessages = {
      1: [
        {
          id: 1,
          content: 'Привет! Как дела?',
          senderId: 2,
          sender: mockUsers[1],
          chatId: 1,
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          isRead: true
        },
        {
          id: 2,
          content: 'Привет! Все отлично, спасибо! А у тебя как?',
          senderId: 1,
          sender: mockUsers[0],
          chatId: 1,
          createdAt: new Date(Date.now() - 3500000).toISOString(),
          isRead: true
        }
      ],
      2: [
        {
          id: 3,
          content: 'Не забудь про встречу завтра!',
          senderId: 3,
          sender: mockUsers[2],
          chatId: 2,
          createdAt: new Date(Date.now() - 7200000).toISOString(),
          isRead: false
        },
        {
          id: 4,
          content: 'Увидимся завтра!',
          senderId: 3,
          sender: mockUsers[2],
          chatId: 2,
          createdAt: new Date(Date.now() - 7200000).toISOString(),
          isRead: false
        }
      ]
    };
    localStorage.setItem('mockMessages', JSON.stringify(mockMessages));
  }
};

// Инициализируем данные
initializeMockData();

// Симуляция задержки API
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// API методы для чатов
export const chatAPI = {
  // Получить все чаты пользователя
  getChats: async () => {
    await delay(500);
    const currentUser = JSON.parse(localStorage.getItem('user'));
    if (!currentUser) throw new Error('Not authenticated');
    
    const userChats = mockChats.filter(chat => 
      chat.participants.some(p => p.id === currentUser.id)
    );
    
    return { data: userChats };
  },
  
  // Создать новый чат
  createChat: async (participantId) => {
    await delay(500);
    const currentUser = JSON.parse(localStorage.getItem('user'));
    if (!currentUser) throw new Error('Not authenticated');
    
    const participant = mockUsers.find(u => u.id === participantId);
    if (!participant) throw new Error('User not found');
    
    // Проверяем, не существует ли уже чат с этим пользователем
    const existingChat = mockChats.find(chat => 
      chat.participants.some(p => p.id === currentUser.id) &&
      chat.participants.some(p => p.id === participantId)
    );
    
    if (existingChat) {
      return { data: existingChat };
    }
    
    const newChat = {
      id: mockChats.length + 1,
      participants: [currentUser, participant],
      lastMessage: null,
      updatedAt: new Date().toISOString(),
      unreadCount: 0
    };
    
    mockChats.push(newChat);
    mockMessages[newChat.id] = [];
    
    localStorage.setItem('mockChats', JSON.stringify(mockChats));
    localStorage.setItem('mockMessages', JSON.stringify(mockMessages));
    
    return { data: newChat };
  },
  
  // Получить сообщения чата
  getChatMessages: async (chatId) => {
    await delay(300);
    const messages = mockMessages[chatId] || [];
    return { data: messages };
  },
  
  // Отправить сообщение
  sendMessage: async (chatId, content) => {
    await delay(200);
    const currentUser = JSON.parse(localStorage.getItem('user'));
    if (!currentUser) throw new Error('Not authenticated');
    
    const newMessage = {
      id: Date.now(),
      content,
      senderId: currentUser.id,
      sender: currentUser,
      chatId: parseInt(chatId),
      createdAt: new Date().toISOString(),
      isRead: false
    };
    
    if (!mockMessages[chatId]) {
      mockMessages[chatId] = [];
    }
    
    mockMessages[chatId].push(newMessage);
    
    // Обновляем последнее сообщение в чате
    const chatIndex = mockChats.findIndex(chat => chat.id === parseInt(chatId));
    if (chatIndex !== -1) {
      mockChats[chatIndex].lastMessage = newMessage;
      mockChats[chatIndex].updatedAt = new Date().toISOString();
    }
    
    localStorage.setItem('mockMessages', JSON.stringify(mockMessages));
    localStorage.setItem('mockChats', JSON.stringify(mockChats));
    
    return { data: newMessage };
  },
  
  // Пометить сообщения как прочитанные
  markAsRead: async (chatId) => {
    await delay(100);
    const currentUser = JSON.parse(localStorage.getItem('user'));
    if (!currentUser) throw new Error('Not authenticated');
    
    if (mockMessages[chatId]) {
      mockMessages[chatId] = mockMessages[chatId].map(msg => 
        msg.senderId !== currentUser.id ? { ...msg, isRead: true } : msg
      );
      
      // Сбрасываем счетчик непрочитанных
      const chatIndex = mockChats.findIndex(chat => chat.id === parseInt(chatId));
      if (chatIndex !== -1) {
        mockChats[chatIndex].unreadCount = 0;
      }
      
      localStorage.setItem('mockMessages', JSON.stringify(mockMessages));
      localStorage.setItem('mockChats', JSON.stringify(mockChats));
    }
    
    return { data: { success: true } };
  }
};

// API методы для пользователей
export const userAPI = {
  // Получить всех пользователей
  getUsers: async () => {
    await delay(300);
    return { data: mockUsers };
  },
  
  // Получить информацию о текущем пользователе
  getCurrentUser: async () => {
    await delay(200);
    const currentUser = JSON.parse(localStorage.getItem('user'));
    if (!currentUser) throw new Error('Not authenticated');
    return { data: currentUser };
  },
  
  // Обновить профиль
  updateProfile: async (data) => {
    await delay(500);
    const currentUser = JSON.parse(localStorage.getItem('user'));
    if (!currentUser) throw new Error('Not authenticated');
    
    const updatedUser = { ...currentUser, ...data };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    
    return { data: updatedUser };
  }
};

// API методы для аутентификации (уже реализованы в AuthContext)
export const authAPI = {
  login: async (username, password) => {
    // Логика реализована в AuthContext
    throw new Error('Use AuthContext login method');
  },
  register: async (username, password) => {
    // Логика реализована в AuthContext
    throw new Error('Use AuthContext register method');
  },
  logout: async () => {
    // Логика реализована в AuthContext
    throw new Error('Use AuthContext logout method');
  }
};
