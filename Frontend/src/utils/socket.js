class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
    this.currentRoom = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 3;
    this.reconnectDelay = 1000;
    this.isReconnecting = false;
  }

  connect(token) {
    if (this.socket && this.isConnected) {
      return;
    }

    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'ws://127.0.0.1:8000/ws';
    
    try {
      // Передаем токен в URL для аутентификации
      const wsUrl = `${SOCKET_URL}/chat/?token=${encodeURIComponent(token)}`;
      console.log('Connecting to WebSocket:', wsUrl);
      
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        console.log('WebSocket connected successfully');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.isReconnecting = false;
        
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
        
        // Уведомляем об отключении
        this.triggerEvent('connection_lost', { 
          code: event.code, 
          reason: event.reason 
        });
        
        if (!this.isReconnecting && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.handleReconnect();
        } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.error('Max reconnection attempts reached');
          this.triggerEvent('connection_failed', { 
            message: 'Не удалось восстановить соединение с сервером' 
          });
        }
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.triggerEvent('connection_error', { 
          error: error.message || 'WebSocket connection error' 
        });
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
        
      case 'connection_established':
        console.log('WebSocket connection established:', payload.message);
        this.triggerEvent('connection_established', payload);
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
    if (this.currentRoom) {
      this.joinChat(this.currentRoom);
    }
  }

  handleReconnect() {
    this.isReconnecting = true;
    
    setTimeout(() => {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      const token = localStorage.getItem('access_token');
      if (token) {
        this.connect(token);
      }
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.isConnected = false;
      this.currentRoom = null;
      this.isReconnecting = false;
    }
  }

  send(data) {
    if (this.socket && this.isConnected) {
      this.socket.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket not connected, cannot send message');
    }
  }

  joinChat(chatId) {
    this.currentRoom = parseInt(chatId);
    
    this.disconnect();
    
    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'ws://127.0.0.1:8000/ws';
    
    try {
      this.socket = new WebSocket(`${SOCKET_URL}/chat/${chatId}/`);
      
      this.socket.onopen = () => {
        console.log(`Joined chat room ${chatId}`);
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.isReconnecting = false;
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
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

    } catch (error) {
      console.error('Failed to join chat room:', error);
    }
  }

  leaveChat() {
    if (this.currentRoom) {
      console.log(`Leaving chat room ${this.currentRoom}`);
      this.disconnect();
      this.currentRoom = null;
    }
  }

  sendMessage(chatId, content) {
    this.send({
      type: 'chat_message',
      message: content
    });
  }

  sendTyping(isTyping = true) {
    this.send({
      type: 'typing',
      is_typing: isTyping
    });
  }

  markAsRead() {
    this.send({
      type: 'mark_read'
    });
  }

  on(event, callback) {
    this.listeners.set(event, callback);
  }

  off(event) {
    this.listeners.delete(event);
  }

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

const socketService = new SocketService();
export default socketService;
