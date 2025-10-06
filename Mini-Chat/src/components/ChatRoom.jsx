import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, ArrowLeft, MoreVertical, Phone, Video, Image, Mic, Smile, Paperclip, Clock, Check, CheckCheck } from 'lucide-react';
import { chatAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import socketService from '../utils/socket';
import Message from './Message';

const ChatRoom = () => {
  const { id: chatId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [otherUser, setOtherUser] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [isInputFocused, setIsInputFocused] = useState(false);
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (chatId) {
      fetchChatData();
      
      const token = localStorage.getItem('access_token');
      if (token) {
        console.log('Connecting to WebSocket with token:', token.substring(0, 10) + '...');
        socketService.connect(token);
        socketService.joinChat(chatId);
        
        socketService.on('new_message', handleNewMessage);
        socketService.on('message_read', handleMessageRead);
        socketService.on('user_typing', handleUserTyping);
        socketService.on('user_stopped_typing', handleUserStoppedTyping);
        socketService.on('user_status_changed', handleUserStatusChanged);
        socketService.on('connection_lost', handleConnectionLost);
        socketService.on('connection_error', handleConnectionError);
        socketService.on('connection_failed', handleConnectionFailed);
      }
    }

    return () => {
      if (chatId) {
        socketService.leaveChat(chatId);
        socketService.off('new_message');
        socketService.off('message_read');
        socketService.off('user_typing');
        socketService.off('user_stopped_typing');
        socketService.off('user_status_changed');
        socketService.off('connection_lost');
        socketService.off('connection_error');
        socketService.off('connection_failed');
        socketService.off('connection_lost');
        socketService.off('connection_error');
        socketService.off('connection_failed');
      }
    };
  }, [chatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchChatData = async () => {
    try {
      setLoading(true);
      
      const [chatResponse, messagesResponse] = await Promise.all([
        chatAPI.getChats(),
        chatAPI.getChatMessages(chatId)
      ]);
      
      const currentChat = chatResponse.data.find(c => c.id === parseInt(chatId));
      if (!currentChat) {
        setError('Чат не найден');
        return;
      }
      
      setChat(currentChat);
      setMessages(messagesResponse.data || []);
      
      const otherParticipant = currentChat.participants.find(p => p.id !== user.id);
      setOtherUser(otherParticipant);
      
      try {
        await chatAPI.markAsRead(chatId);
      } catch (error) {
        console.error('Failed to mark as read:', error);
      }
      
    } catch (error) {
      console.error('Failed to fetch chat data:', error);
      setError('Ошибка загрузки чата');
    } finally {
      setLoading(false);
    }
  };

  const handleNewMessage = (message) => {
    if (message.chatId === parseInt(chatId)) {
      setMessages(prev => [...prev, message]);
      
      if (message.senderId !== user.id) {
        chatAPI.markAsRead(chatId);
      }
    }
  };

  const handleMessageRead = (data) => {
    if (data.chatId === parseInt(chatId)) {
      setMessages(prev => 
        prev.map(msg => 
          data.messageIds.includes(msg.id) 
            ? { ...msg, isRead: true }
            : msg
        )
      );
    }
  };

  const handleUserTyping = (data) => {
    if (data.chatId === parseInt(chatId) && data.userId !== user.id) {
      setTypingUsers(prev => new Set([...prev, data.userId]));
    }
  };

  const handleUserStoppedTyping = (data) => {
    if (data.chatId === parseInt(chatId)) {
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(data.userId);
        return newSet;
      });
    }
  };

  const handleUserStatusChanged = (data) => {
    if (otherUser && data.userId === otherUser.id) {
      setOtherUser(prev => ({ ...prev, isOnline: data.isOnline }));
    }
  };

  const handleConnectionLost = (data) => {
    console.warn('WebSocket connection lost:', data);
    setError('Соединение с сервером потеряно. Попытка переподключения...');
  };

  const handleConnectionError = (data) => {
    console.error('WebSocket connection error:', data);
    setError('Ошибка соединения с сервером');
  };

  const handleConnectionFailed = (data) => {
    console.error('WebSocket connection failed:', data);
    setError('Не удалось подключиться к серверу. Проверьте соединение.');
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || sending) return;
    
    setSending(true);
    const messageContent = newMessage.trim();
    setNewMessage('');
    
    const tempMessage = {
      id: Date.now(),
      content: messageContent,
      senderId: user.id,
      sender: user,
      createdAt: new Date().toISOString(),
      status: 'sending'
    };
    
    setMessages(prev => [...prev, tempMessage]);
    
    try {
      const response = await chatAPI.sendMessage(chatId, messageContent);
      
      setMessages(prev => 
        prev.map(msg => 
          msg.id === tempMessage.id 
            ? { ...response.data, status: 'sent' }
            : msg
        )
      );
      
      // Отправляем через WebSocket если подключен
      socketService.sendMessage(chatId, messageContent);
      
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => 
        prev.map(msg => 
          msg.id === tempMessage.id 
            ? { ...msg, status: 'failed' }
            : msg
        )
      );
    } finally {
      setSending(false);
    }
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    
    if (!isTyping) {
      setIsTyping(true);
      socketService.sendTyping(true);
    }
    
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socketService.sendTyping(false);
    }, 1000);
  };

  const getAvatarGradient = (username) => {
    const colors = [
      'from-purple-500 to-pink-500',
      'from-blue-500 to-cyan-500',
      'from-orange-400 to-red-500',
      'from-green-400 to-emerald-500',
      'from-indigo-500 to-purple-600'
    ];
    const index = username?.length % colors.length || 0;
    return colors[index];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 font-medium">Загрузка чата...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        <div className="text-center">
          <div className="w-24 h-24 bg-red-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xl">!</span>
            </div>
          </div>
          <div className="text-red-600 mb-4 text-lg font-semibold">{error}</div>
          <button
            onClick={() => navigate('/chats')}
            className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold"
          >
            Вернуться к чатам
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">
      {/* Заголовок чата */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-lg">
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/chats')}
              className="group p-3 text-gray-600 hover:text-white bg-white/80 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 backdrop-blur-sm"
            >
              <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
            </button>
            
            <div className="relative">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${getAvatarGradient(otherUser?.username)} flex items-center justify-center text-white text-xl font-bold shadow-lg`}>
                {otherUser?.username?.charAt(0).toUpperCase()}
              </div>
              {otherUser?.isOnline && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-3 border-white rounded-full animate-pulse"></div>
              )}
            </div>
            
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {otherUser?.username}
              </h1>
              <div className="flex items-center space-x-2">
                <p className="text-sm text-gray-500">
                  {otherUser?.isOnline ? (
                    <span className="flex items-center space-x-1">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      <span>В сети</span>
                    </span>
                  ) : (
                    'Не в сети'
                  )}
                </p>
                {typingUsers.size > 0 && otherUser?.isOnline && (
                  <div className="flex items-center space-x-2 text-blue-500 text-sm">
                    <div className="flex space-x-1">
                      <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"></div>
                      <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span>печатает...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button className="group p-3 text-gray-600 hover:text-white bg-white/80 hover:bg-gradient-to-r hover:from-green-500 hover:to-emerald-500 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 backdrop-blur-sm">
              <Phone className="h-5 w-5 transition-transform group-hover:scale-110" />
            </button>
            <button className="group p-3 text-gray-600 hover:text-white bg-white/80 hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-500 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 backdrop-blur-sm">
              <Video className="h-5 w-5 transition-transform group-hover:scale-110" />
            </button>
            <button className="group p-3 text-gray-600 hover:text-white bg-white/80 hover:bg-gradient-to-r hover:from-gray-500 hover:to-slate-600 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 backdrop-blur-sm">
              <MoreVertical className="h-5 w-5 transition-transform group-hover:rotate-90" />
            </button>
          </div>
        </div>
      </div>

      {/* Область сообщений */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-transparent">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-3xl flex items-center justify-center mb-6">
              <div className="w-20 h-20 bg-white rounded-2xl shadow-lg flex items-center justify-center">
                <Send className="h-10 w-10 text-blue-400" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Начните общение!</h3>
            <p className="text-gray-500 text-lg max-w-md">
              Это начало вашего разговора с {otherUser?.username}. Отправьте первое сообщение!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((message, index) => {
              const isOwn = message.senderId === user.id;
              const showTimestamp = index === 0 || 
                new Date(message.createdAt).getTime() - new Date(messages[index - 1].createdAt).getTime() > 300000;
              
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-message-in`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className={`max-w-xs lg:max-w-md xl:max-w-lg 2xl:max-w-xl ${
                    isOwn 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' 
                      : 'bg-white/80 backdrop-blur-sm text-gray-900 border border-white/50'
                  } rounded-3xl px-6 py-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]`}>
                    <div className="flex flex-col">
                      <p className="text-lg leading-relaxed">{message.content}</p>
                      <div className={`flex items-center justify-end space-x-2 mt-2 text-xs ${
                        isOwn ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        <span>{new Date(message.createdAt).toLocaleTimeString('ru-RU', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}</span>
                        {isOwn && (
                          <div className="flex items-center">
                            {message.status === 'sending' && <Clock className="h-3 w-3" />}
                            {message.status === 'sent' && <Check className="h-3 w-3" />}
                            {message.status === 'failed' && <span className="text-red-300">!</span>}
                            {message.isRead && <CheckCheck className="h-3 w-3" />}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Поле ввода */}
      <div className="bg-white/80 backdrop-blur-xl border-t border-white/20 shadow-2xl p-6">
        <form onSubmit={handleSendMessage} className="relative">
          {/* Дополнительные кнопки */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex space-x-2">
              <button type="button" className="p-3 text-gray-500 hover:text-blue-500 hover:bg-white/50 rounded-2xl transition-all duration-300 transform hover:scale-110">
                <Paperclip className="h-5 w-5" />
              </button>
              <button type="button" className="p-3 text-gray-500 hover:text-blue-500 hover:bg-white/50 rounded-2xl transition-all duration-300 transform hover:scale-110">
                <Image className="h-5 w-5" />
              </button>
              <button type="button" className="p-3 text-gray-500 hover:text-blue-500 hover:bg-white/50 rounded-2xl transition-all duration-300 transform hover:scale-110">
                <Smile className="h-5 w-5" />
              </button>
            </div>
            <button type="button" className="p-3 text-gray-500 hover:text-blue-500 hover:bg-white/50 rounded-2xl transition-all duration-300 transform hover:scale-110">
              <Mic className="h-5 w-5" />
            </button>
          </div>

          {/* Поле ввода сообщения */}
          <div className={`relative transition-all duration-300 ${
            isInputFocused ? 'transform scale-[1.02]' : ''
          }`}>
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={handleInputChange}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
              placeholder="Введите сообщение..."
              className="w-full pl-6 pr-20 py-5 bg-white/50 backdrop-blur-sm border-2 border-white/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-400 text-gray-900 placeholder-gray-500 text-lg transition-all duration-300"
              disabled={sending}
            />
            
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-3 rounded-2xl transition-all duration-300 ${
                newMessage.trim() 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg hover:shadow-xl transform hover:scale-110' 
                  : 'bg-gray-200 text-gray-400'
              } ${sending ? 'animate-pulse' : ''}`}
            >
              {sending ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Стили для анимаций вынесены в CSS модуль */}
    </div>
  );
};

export default ChatRoom;