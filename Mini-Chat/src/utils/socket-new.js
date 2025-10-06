class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
    this.currentRoom = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
  }

  connect(token) {
    if (this.socket && this.isConnected) {
      return;
    }

    const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'ws://127.0.0.1:8000/ws';
    
    try {
      // Для Django Channels WebSocket не используем socket.io, а обычный WebSocket
      this.socket = new WebSocket(`${SOCKET_URL}/chat/`);

      this.socket.onopen = () => {
        console.log('WebSocket connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        
        // Отправляем токен для аутентификации
        this.send({
          type: 'auth',
          token: token
        });

        // Восстанавливаем все подписки
        this.restoreListeners();
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.socket.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        this.isConnected = false;
        this.handleReconnect();
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  }

  handleMessage(data) {
    const { type, ...payload } = data;
    
    switch (type) {
      case 'chat_message':
        this.triggerEvent('new_message', {
          id: payload.message_id,
          content: payload.message,
          senderId: payload.user_id,
          sender: { 
            id: payload.user_id, 
            username: payload.username 
          },
          chatId: this.currentRoom,
          createdAt: payload.timestamp,
          isRead: false
        });
        break;
        
      case 'typing':
        if (payload.is_typing) {
          this.triggerEvent('user_typing', {
            userId: payload.user_id,
            chatId: this.currentRoom
          });
        } else {
          this.triggerEvent('user_stopped_typing', {
            userId: payload.user_id,
            chatId: this.currentRoom
          });
        }
        break;
        
      case 'read_receipt':
        this.triggerEvent('message_read', {
          chatId: this.currentRoom,
          messageIds: payload.message_ids
        });
        break;
        
      case 'user_status':
        this.triggerEvent('user_status_changed', {
          userId: payload.user_id,
          isOnline: payload.is_online
        });
        break;
        
      case 'error':
        console.error('WebSocket error:', payload.message);
        break;
        
      default:
        console.log('Unknown message type:', type, payload);
    }
  }

  triggerEvent(event, data) {
    const callback = this.listeners.get(event);
    if (callback) {
      callback(data);
    }
  }

  restoreListeners() {
    // Если мы были в комнате, переподключаемся
    if (this.currentRoom) {
      this.joinChat(this.currentRoom);
    }
  }

  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      setTimeout(() => {
        this.reconnectAttempts++;
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        const token = localStorage.getItem('access_token');
        if (token) {
          this.connect(token);
        }
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.isConnected = false;
      this.currentRoom = null;
    }
  }

  send(data) {
    if (this.socket && this.isConnected) {
      this.socket.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket not connected, cannot send message');
    }
  }

  // Присоединиться к чату
  joinChat(chatId) {
    this.currentRoom = parseInt(chatId);
    
    // Для Django Channels нам нужно создать отдельное соединение для каждого чата
    this.disconnect();
    
    const token = localStorage.getItem('access_token');
    const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'ws://127.0.0.1:8000/ws';
    
    try {
      this.socket = new WebSocket(`${SOCKET_URL}/chat/${chatId}/`);
      
      this.socket.onopen = () => {
        console.log(`Joined chat room ${chatId}`);
        this.isConnected = true;
        this.reconnectAttempts = 0;
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.socket.onclose = (event) => {
        console.log(`Left chat room ${chatId}:`, event.code, event.reason);
        this.isConnected = false;
        this.handleReconnect();
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

    } catch (error) {
      console.error('Failed to join chat room:', error);
    }
  }

  // Покинуть чат
  leaveChat() {
    if (this.currentRoom) {
      console.log(`Leaving chat room ${this.currentRoom}`);
      this.disconnect();
      this.currentRoom = null;
    }
  }

  // Отправить сообщение
  sendMessage(chatId, content) {
    this.send({
      type: 'chat_message',
      message: content
    });
  }

  // Отправить индикатор печати
  sendTyping(isTyping = true) {
    this.send({
      type: 'typing',
      is_typing: isTyping
    });
  }

  // Отметить сообщения как прочитанные
  markAsRead() {
    this.send({
      type: 'mark_read'
    });
  }

  // Подписаться на событие
  on(event, callback) {
    this.listeners.set(event, callback);
  }

  // Отписаться от события
  off(event) {
    this.listeners.delete(event);
  }

  // Эмуляция socket.io методов для совместимости
  emit(event, data) {
    switch (event) {
      case 'typing':
        this.sendTyping(true);
        break;
      case 'stop_typing':
        this.sendTyping(false);
        break;
      case 'mark_read':
        this.markAsRead();
        break;
      default:
        console.warn('Unknown emit event:', event);
    }
  }
}

// Создаем единственный экземпляр
const socketService = new SocketService();
export default socketService;
