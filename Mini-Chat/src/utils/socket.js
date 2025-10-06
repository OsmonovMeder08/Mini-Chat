// Mock Socket Service для работы без бекенда

class MockSocketService {
  constructor() {
    this.isConnected = false;
    this.listeners = new Map();
    this.currentChatId = null;
  }

  connect(token) {
    console.log('Mock Socket: Connecting with token:', token);
    this.isConnected = true;
    
    // Симулируем событие подключения
    setTimeout(() => {
      console.log('Mock Socket: Connected');
      const connectCallback = this.listeners.get('connect');
      if (connectCallback) connectCallback();
    }, 100);
  }

  disconnect() {
    console.log('Mock Socket: Disconnecting');
    this.isConnected = false;
    this.currentChatId = null;
    
    // Симулируем событие отключения
    const disconnectCallback = this.listeners.get('disconnect');
    if (disconnectCallback) disconnectCallback();
  }

  // Присоединиться к чату
  joinChat(chatId) {
    if (this.isConnected) {
      console.log('Mock Socket: Joining chat', chatId);
      this.currentChatId = chatId;
    }
  }

  // Покинуть чат
  leaveChat(chatId) {
    if (this.isConnected) {
      console.log('Mock Socket: Leaving chat', chatId);
      if (this.currentChatId === chatId) {
        this.currentChatId = null;
      }
    }
  }

  // Отправить сообщение (mock - просто логируем)
  sendMessage(chatId, content) {
    if (this.isConnected) {
      console.log('Mock Socket: Sending message to chat', chatId, ':', content);
      
      // В реальном приложении здесь бы происходила отправка через WebSocket
      // Пока просто симулируем успешную отправку
    }
  }

  // Подписаться на событие
  on(event, callback) {
    console.log('Mock Socket: Subscribing to event:', event);
    this.listeners.set(event, callback);
  }

  // Отписаться от события
  off(event) {
    console.log('Mock Socket: Unsubscribing from event:', event);
    this.listeners.delete(event);
  }

  // Обновить онлайн статус
  updateStatus(status) {
    if (this.isConnected) {
      console.log('Mock Socket: Updating status to:', status);
    }
  }

  // Симуляция получения нового сообщения (для тестирования)
  simulateNewMessage(message) {
    const callback = this.listeners.get('new_message');
    if (callback) {
      setTimeout(() => callback(message), 100);
    }
  }

  // Симуляция событий печати
  emit(event, data) {
    console.log('Mock Socket: Emitting event:', event, data);
    
    // Симулируем некоторые события для демонстрации
    if (event === 'typing') {
      // В реальном приложении это отправлялось бы другим пользователям
      console.log('User is typing in chat:', data.chatId);
    }
    
    if (event === 'stop_typing') {
      console.log('User stopped typing in chat:', data.chatId);
    }
  }
}

// Создаем единственный экземпляр mock сервиса
const socketService = new MockSocketService();
export default socketService;
