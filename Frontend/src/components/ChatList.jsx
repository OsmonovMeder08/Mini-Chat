import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, MessageCircle, User, Search, LogOut, Clock, Users, X } from 'lucide-react';
import { chatAPI, userAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import socketService from '../utils/socket';

const ChatList = () => {
  const [chats, setChats] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUserList, setShowUserList] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [selectedChat, setSelectedChat] = useState(null);

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchChats();
    fetchUsers();
    
    const token = localStorage.getItem('access_token');
    if (token) {
      socketService.connect(token);
      socketService.on('new_message', handleNewMessage);
      socketService.on('chat_updated', handleChatUpdated);
    }

    return () => {
      socketService.off('new_message');
      socketService.off('chat_updated');
    };
  }, []);

  const fetchChats = async () => {
    try {
      const response = await chatAPI.getChats();
      setChats(response.data);
    } catch (error) {
      console.error('Failed to fetch chats:', error);
      setError('Ошибка загрузки чатов');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await userAPI.getUsers();
      setUsers(response.data.filter(u => u.id !== user.id));
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const handleNewMessage = (message) => {
    setChats(prevChats => {
      const updatedChats = prevChats.filter(chat => chat.id !== message.chatId);
      const chat = prevChats.find(chat => chat.id === message.chatId);
      return [{
        ...chat,
        lastMessage: message,
        updatedAt: new Date(),
        unreadCount: (chat.unreadCount || 0) + 1
      }, ...updatedChats];
    });
  };

  const handleChatUpdated = (updatedChat) => {
    setChats(prevChats => {
      const existingChat = prevChats.find(chat => chat.id === updatedChat.id);
      if (existingChat) {
        return prevChats.map(chat => 
          chat.id === updatedChat.id ? updatedChat : chat
        );
      } else {
        return [updatedChat, ...prevChats];
      }
    });
  };

  const createChat = async (userId) => {
    try {
      const response = await chatAPI.createChat(userId);
      const newChat = response.data;
      
      const existingChat = chats.find(chat => 
        chat.participants.some(p => p.id === userId)
      );
      
      if (!existingChat) {
        setChats([newChat, ...chats]);
      }
      
      setShowUserList(false);
      setSearchTerm('');
      navigate(`/chat/${newChat.id}`);
    } catch (error) {
      console.error('Failed to create chat:', error);
      setError('Ошибка создания чата');
    }
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Только что';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} мин`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} ч`;
    
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  const getAvatarGradient = (username) => {
    const colors = [
      'from-purple-500 to-pink-500',
      'from-blue-500 to-cyan-500',
      'from-orange-400 to-red-500',
      'from-green-400 to-emerald-500',
      'from-indigo-500 to-purple-600',
      'from-rose-500 to-orange-500'
    ];
    const index = username?.length % colors.length || 0;
    return colors[index];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 font-medium">Загрузка чатов...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Боковая панель чатов */}
      <div className="w-96 bg-white/80 backdrop-blur-xl border-r border-white/20 shadow-2xl flex flex-col transform transition-all duration-500">
        {/* Заголовок */}
        <div className="p-6 border-b border-white/20 bg-gradient-to-r from-white/50 to-blue-50/50">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Сообщения
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {chats.length} чатов
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => navigate('/profile')}
                className="group p-3 text-gray-600 hover:text-white bg-white/80 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 backdrop-blur-sm"
                title="Профиль"
              >
                <User className="h-5 w-5 transition-transform group-hover:rotate-12" />
              </button>
              <button
                onClick={logout}
                className="group p-3 text-gray-600 hover:text-white bg-white/80 hover:bg-gradient-to-r hover:from-red-500 hover:to-pink-500 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 backdrop-blur-sm"
                title="Выйти"
              >
                <LogOut className="h-5 w-5 transition-transform group-hover:rotate-180" />
              </button>
            </div>
          </div>
          
          <button
            onClick={() => setShowUserList(true)}
            className="group w-full flex items-center justify-center px-6 py-4 border-2 border-dashed border-blue-200 rounded-2xl text-sm font-semibold text-blue-600 bg-white/50 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500 hover:text-white hover:border-transparent shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] backdrop-blur-sm"
          >
            <Plus className="h-5 w-5 mr-3 transition-transform group-hover:rotate-90" />
            Новый чат
          </button>
        </div>

        {/* Поиск */}
        <div className="p-4 border-b border-white/20 bg-white/30">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Поиск чатов..."
              className="w-full pl-12 pr-4 py-3 bg-white/50 border border-white/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 backdrop-blur-sm transition-all duration-300"
            />
          </div>
        </div>

        {/* Список чатов */}
        <div className="flex-1 overflow-y-auto">
          {error && (
            <div className="m-4 p-4 bg-red-50/90 backdrop-blur-sm border border-red-200 text-red-600 rounded-2xl shadow-lg transform transition-all duration-300 animate-slide-down">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-3"></div>
                {error}
              </div>
            </div>
          )}
          
          {chats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-3xl flex items-center justify-center mb-6">
                <MessageCircle className="h-12 w-12 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Нет чатов</h3>
              <p className="text-gray-500 mb-6">Создайте первый чат для общения</p>
              <button
                onClick={() => setShowUserList(true)}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                Начать общение
              </button>
            </div>
          ) : (
            <div className="p-2">
              {chats.map((chat, index) => {
                const otherParticipant = chat.participants.find(p => p.id !== user.id);
                const isOnline = otherParticipant?.isOnline;
                
                return (
                  <div
                    key={chat.id}
                    onClick={() => navigate(`/chat/${chat.id}`)}
                    className="group relative p-4 m-2 bg-white/50 hover:bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 hover:border-blue-200 cursor-pointer transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
                    style={{ animationDelay: (index * 50) + 'ms' }}
                  >
                    <div className="flex items-center space-x-4">
                      {/* Аватар */}
                      <div className="relative">
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${getAvatarGradient(otherParticipant?.username)} flex items-center justify-center text-white text-lg font-bold shadow-lg transform transition-all duration-300 group-hover:scale-110`}>
                          {otherParticipant?.username?.charAt(0).toUpperCase()}
                        </div>
                        {isOnline && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full animate-pulse"></div>
                        )}
                      </div>
                      
                      {/* Информация о чате */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-sm font-semibold text-gray-900 truncate">
                            {otherParticipant?.username}
                          </h3>
                          {chat.lastMessage && (
                            <div className="flex items-center space-x-1 text-xs text-gray-400">
                              <Clock className="h-3 w-3" />
                              <span>{formatTime(chat.lastMessage.createdAt)}</span>
                            </div>
                          )}
                        </div>
                        
                        {chat.lastMessage ? (
                          <p className="text-sm text-gray-600 truncate leading-relaxed">
                            {chat.lastMessage.content}
                          </p>
                        ) : (
                          <p className="text-sm text-gray-400 italic">
                            Чат создан
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between mt-2">
                          {chat.unreadCount > 0 && (
                            <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold text-white bg-gradient-to-r from-blue-500 to-purple-500 rounded-full shadow-lg transform transition-all duration-300 group-hover:scale-110">
                              {chat.unreadCount}
                            </span>
                          )}
                          <div className="flex-1"></div>
                          {chat.participants.length > 2 && (
                            <Users className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Акцентная полоска при наведении */}
                    <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-blue-500 to-purple-500 rounded-r-full opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Модальное окно выбора пользователя */}
      {showUserList && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-md transform transition-all duration-500 scale-95 animate-scale-in">
            {/* Заголовок */}
            <div className="p-6 border-b border-white/20 bg-gradient-to-r from-white/50 to-blue-50/50 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Новый чат
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Выберите пользователя
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowUserList(false);
                    setSearchTerm('');
                  }}
                  className="group p-2 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-2xl transition-all duration-300 transform hover:rotate-90"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            {/* Поиск */}
            <div className="p-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Поиск пользователей..."
                  className="w-full pl-12 pr-4 py-4 bg-white/50 border border-white/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 backdrop-blur-sm transition-all duration-300"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
            
            {/* Список пользователей */}
            <div className="max-h-96 overflow-y-auto p-4">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium">Пользователи не найдены</p>
                  <p className="text-sm text-gray-400 mt-1">Попробуйте изменить запрос</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredUsers.map((user, index) => (
                    <div
                      key={user.id}
                      onClick={() => createChat(user.id)}
                      className="group flex items-center space-x-4 p-4 bg-white/50 hover:bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 hover:border-blue-200 cursor-pointer transform transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
                      style={{ animationDelay: (index * 50) + 'ms' }}
                    >
                      <div className="relative">
                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${getAvatarGradient(user.username)} flex items-center justify-center text-white font-bold shadow-lg transform transition-all duration-300 group-hover:scale-110`}>
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        {user.isOnline && (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full animate-pulse"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{user.username}</p>
                        <p className="text-sm text-gray-500 flex items-center">
                          <span className={`w-2 h-2 rounded-full mr-2 ${user.isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></span>
                          {user.isOnline ? 'В сети' : 'Не в сети'}
                        </p>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                          <Plus className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Правая часть - приветственная область */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 transform hover:scale-105 transition-all duration-500">
            <MessageCircle className="h-16 w-16 text-blue-500" />
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-4">
            Добро пожаловать!
          </h2>
          <p className="text-lg text-gray-600 mb-2">
            Выберите чат для начала общения
          </p>
          <p className="text-gray-500 mb-8">
            или создайте новый, чтобы связаться с друзьями
          </p>
          <div className="flex justify-center space-x-3">
            <button
              onClick={() => setShowUserList(true)}
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold"
            >
              Начать чат
            </button>
            <button
              onClick={fetchUsers}
              className="px-8 py-4 bg-white/80 text-gray-700 border border-gray-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold backdrop-blur-sm"
            >
              Обновить
            </button>
          </div>
        </div>
      </div>

      {/* Стили для анимаций */}
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-in {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes slide-down {
          from { transform: translateY(-10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ChatList;