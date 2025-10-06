import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Edit2, Save, X, LogOut, Camera } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { userAPI } from '../utils/api';

const Profile = () => {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [profileData, setProfileData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    firstName: user?.first_name || '',
    lastName: user?.last_name || '',
    bio: user?.profile?.bio || '' // Берем bio из профиля пользователя
  });

  // Обновляем состояние при изменении данных пользователя
  React.useEffect(() => {
    console.log('User data updated:', user); // Отладка
    
    if (user) {
      setProfileData({
        username: user.username || '',
        email: user.email || '',
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        bio: user.profile?.bio || '' // Берем bio из профиля пользователя
      });
    }
  }, [user]);
  
  const [avatarPreview, setAvatarPreview] = useState(null);

  const handleInputChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value
    });
    setError('');
    setSuccess('');
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Проверка типа файла
    if (!file.type.startsWith('image/')) {
      setError('Пожалуйста, выберите изображение');
      return;
    }

    // Проверка размера файла (максимум 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Размер файла не должен превышать 5MB');
      return;
    }

    setUploadingAvatar(true);
    setError('');

    try {
      // Показываем превью
      const reader = new FileReader();
      reader.onload = (e) => setAvatarPreview(e.target.result);
      reader.readAsDataURL(file);

      // Загружаем файл
      const response = await userAPI.uploadAvatar(file);
      console.log('Avatar uploaded successfully:', response.data);
      setSuccess('Аватар успешно загружен');
      
      // Обновляем данные пользователя из базы данных
      await refreshUser();
      
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      setError('Ошибка загрузки аватара');
      setAvatarPreview(null);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleAvatarUrlChange = async (url) => {
    if (!url.trim()) return;

    setUploadingAvatar(true);
    setError('');

    try {
      const response = await userAPI.updateAvatarUrl(url);
      console.log('Avatar URL updated successfully:', response.data);
      setSuccess('Аватар успешно обновлен');
      setAvatarPreview(url);
      
      // Обновляем данные пользователя из базы данных
      await refreshUser();
      
    } catch (error) {
      console.error('Failed to update avatar URL:', error);
      setError('Ошибка обновления аватара');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // Преобразуем данные для API (camelCase -> snake_case)
      const apiData = {
        first_name: profileData.firstName || '',
        last_name: profileData.lastName || '',
        email: profileData.email || user?.email || '',
        bio: profileData.bio || '' // Добавляем bio как отдельное поле
      };
      
      console.log('Updating profile with data:', apiData);
      const response = await userAPI.updateProfile(apiData);
      console.log('Profile update successful:', response.data);
      setSuccess('Профиль успешно обновлен');
      setIsEditing(false);
      
      // Обновляем данные пользователя из базы данных
      await refreshUser();
      
    } catch (error) {
      console.error('Failed to update profile:', error);
      console.error('Error response data:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error request URL:', error.config?.url);
      
      let errorMessage = 'Ошибка обновления профиля';
      
      if (error.response?.status === 404) {
        errorMessage = 'API endpoint не найден. Проверьте настройки сервера.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response?.data) {
        // Показываем ошибки валидации
        const errors = Object.entries(error.response.data).map(([field, messages]) => 
          `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`
        ).join('; ');
        errorMessage = `Ошибки валидации: ${errors}`;
      } else if (error.message) {
        errorMessage = `Ошибка соединения: ${error.message}`;
      }
      
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setProfileData({
      username: user?.username || '',
      email: user?.email || '',
      firstName: user?.first_name || '',
      lastName: user?.last_name || '',
      bio: user?.profile?.bio || '' // Берем bio из профиля пользователя
    });
    setIsEditing(false);
    setError('');
    setSuccess('');
    setAvatarPreview(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Генерация градиента на основе username
  const getAvatarGradient = (username) => {
    const colors = [
      'from-purple-500 to-pink-500',
      'from-blue-500 to-teal-400',
      'from-orange-400 to-red-500',
      'from-green-400 to-cyan-500',
      'from-indigo-500 to-purple-600'
    ];
    const index = username?.length % colors.length || 0;
    return colors[index];
  };

  // Функция для форматирования даты
  const formatJoinDate = (dateString) => {
    console.log('formatJoinDate called with:', dateString); // Отладка
    
    if (!dateString) {
      return 'Недавно';
    }
    
    try {
      const date = new Date(dateString);
      console.log('Parsed date:', date); // Отладка
      
      const months = [
        'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
        'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
      ];
      
      const day = date.getDate();
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      
      const formatted = `${day} ${month} ${year}`;
      console.log('Formatted date:', formatted); // Отладка
      
      return formatted;
    } catch (error) {
      console.error('Error formatting date:', error); // Отладка
      return 'Недавно';
    }
  };

  // Функция для вычисления времени с регистрации
  const getTimeSinceJoin = (dateString) => {
    if (!dateString) {
      return '';
    }
    
    try {
      const joinDate = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now - joinDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 1) {
        return 'Сегодня';
      } else if (diffDays === 1) {
        return '1 день назад';
      } else if (diffDays < 30) {
        return `${diffDays} ${diffDays < 5 ? 'дня' : 'дней'} назад`;
      } else if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        return `${months} ${months === 1 ? 'месяц' : months < 5 ? 'месяца' : 'месяцев'} назад`;
      } else {
        const years = Math.floor(diffDays / 365);
        return `${years} ${years === 1 ? 'год' : years < 5 ? 'года' : 'лет'} назад`;
      }
    } catch (error) {
      return '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Заголовок с улучшенным дизайном */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/chats')}
              className="group p-3 text-gray-600 hover:text-white bg-white/80 hover:bg-blue-600 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 backdrop-blur-sm"
            >
              <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
            </button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Профиль
              </h1>
              <p className="text-gray-500 text-sm mt-1">Управление вашей учетной записью</p>
            </div>
          </div>
          
          <div className="flex space-x-3">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="group flex items-center px-6 py-3 border-2 border-blue-200 rounded-2xl text-sm font-semibold text-blue-700 bg-white/80 hover:bg-blue-600 hover:text-white hover:border-blue-600 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 backdrop-blur-sm"
              >
                <Edit2 className="h-4 w-4 mr-2 transition-transform group-hover:rotate-12" />
                Редактировать
              </button>
            ) : (
              <div className="flex space-x-3 animate-fade-in">
                <button
                  onClick={handleCancel}
                  className="group flex items-center px-6 py-3 border-2 border-gray-200 rounded-2xl text-sm font-semibold text-gray-700 bg-white/80 hover:bg-gray-100 hover:border-gray-300 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 backdrop-blur-sm"
                >
                  <X className="h-4 w-4 mr-2 transition-transform group-hover:rotate-90" />
                  Отмена
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="group flex items-center px-6 py-3 border-2 border-transparent rounded-2xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:transform-none disabled:hover:shadow-lg"
                >
                  <Save className="h-4 w-4 mr-2 transition-transform group-hover:scale-110" />
                  {loading ? (
                    <span className="flex items-center">
                      <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></span>
                      Сохранение...
                    </span>
                  ) : 'Сохранить'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Анимированные сообщения */}
        {error && (
          <div className="mb-6 animate-slide-down bg-red-50/90 backdrop-blur-sm border border-red-200 text-red-600 px-6 py-4 rounded-2xl shadow-lg transform transition-all duration-300 hover:scale-[1.02]">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-5 h-5 bg-red-500 rounded-full animate-pulse"></div>
              </div>
              <div className="ml-3">
                <p className="font-medium">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {success && (
          <div className="mb-6 animate-slide-down bg-green-50/90 backdrop-blur-sm border border-green-200 text-green-600 px-6 py-4 rounded-2xl shadow-lg transform transition-all duration-300 hover:scale-[1.02]">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-5 h-5 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              <div className="ml-3">
                <p className="font-medium">{success}</p>
              </div>
            </div>
          </div>
        )}

        {/* Основная карточка профиля */}
        <div className="bg-white/80 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden border border-white/20 transform transition-all duration-500 hover:shadow-2xl">
          {/* Аватар и базовая информация */}
          <div className="relative px-8 py-12 border-b border-gray-200/50 bg-gradient-to-r from-blue-50/50 to-purple-50/50">
            <div className="flex items-center space-x-8">
              {/* Аватар с возможностью загрузки */}
              <div className="relative group">
                {avatarPreview || user?.profile?.avatar ? (
                  <img 
                    src={avatarPreview || user?.profile?.avatar} 
                    alt="Avatar" 
                    className="w-32 h-32 rounded-3xl object-cover shadow-2xl transform transition-all duration-500 group-hover:scale-110 group-hover:rotate-3"
                  />
                ) : (
                  <div className={`w-32 h-32 rounded-3xl bg-gradient-to-br ${getAvatarGradient(user?.username)} flex items-center justify-center text-white text-4xl font-bold shadow-2xl transform transition-all duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                    {user?.username?.charAt(0).toUpperCase()}
                  </div>
                )}
                
                {/* Кнопка загрузки аватара */}
                <div className="absolute inset-0 rounded-3xl bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={uploadingAvatar}
                  />
                  {uploadingAvatar ? (
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white opacity-0 group-hover:opacity-100"></div>
                  ) : (
                    <Camera className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300" />
                  )}
                </div>
                
                {user?.isOnline !== undefined && (
                  <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center ${
                    user.isOnline 
                      ? 'bg-green-500 animate-pulse' 
                      : 'bg-gray-400'
                  }`}>
                    <div className={`w-2 h-2 rounded-full bg-white ${user.isOnline ? 'animate-ping' : ''}`}></div>
                  </div>
                )}
              </div>
              
              <div className="flex-1 space-y-3">
                <h2 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  {profileData.firstName && profileData.lastName 
                    ? `${profileData.firstName} ${profileData.lastName}`
                    : profileData.username
                  }
                </h2>
                <p className="text-xl text-gray-600 font-medium">@{profileData.username}</p>
                
                {/* Дата регистрации */}
                <div className="flex items-center space-x-2 text-gray-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm font-medium">
                    С нами с {formatJoinDate(user?.date_joined)}
                  </span>
                </div>
                
                {/* Время с регистрации */}
                <div className="flex items-center space-x-2 text-gray-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h1m4 4h-1v-4h1M5 12h.01M4 6h16M4 6l1.342 1.342M20 6l-1.342 1.342M4 12l1.342-1.342M20 12l-1.342 1.342M4 18l1.342-1.342M20 18l-1.342-1.342" />
                  </svg>
                  <span className="text-sm font-medium">
                    {getTimeSinceJoin(user?.date_joined)}
                  </span>
                </div>
                
                {profileData.bio && (
                  <p className="text-gray-500 text-lg leading-relaxed max-w-2xl">
                    {profileData.bio}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Форма профиля */}
          <div className="px-8 py-12">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
              <div className="space-y-6">
                <div className="transform transition-all duration-300 hover:scale-[1.02]">
                  <label className="block text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                    Имя пользователя
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={profileData.username}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-gray-50/50 disabled:text-gray-500 transition-all duration-300 backdrop-blur-sm bg-white/50"
                  />
                </div>

                <div className="transform transition-all duration-300 hover:scale-[1.02]">
                  <label className="block text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={profileData.email}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="Не указан"
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-gray-50/50 disabled:text-gray-500 transition-all duration-300 backdrop-blur-sm bg-white/50"
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div className="transform transition-all duration-300 hover:scale-[1.02]">
                  <label className="block text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                    Имя
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={profileData.firstName}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="Не указано"
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-gray-50/50 disabled:text-gray-500 transition-all duration-300 backdrop-blur-sm bg-white/50"
                  />
                </div>

                <div className="transform transition-all duration-300 hover:scale-[1.02]">
                  <label className="block text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                    Фамилия
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={profileData.lastName}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="Не указана"
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-gray-50/50 disabled:text-gray-500 transition-all duration-300 backdrop-blur-sm bg-white/50"
                  />
                </div>
              </div>

              <div className="sm:col-span-2 transform transition-all duration-300 hover:scale-[1.01]">
                <label className="block text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                  О себе
                </label>
                <textarea
                  name="bio"
                  rows={4}
                  value={profileData.bio}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="Расскажите о себе..."
                  className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-gray-50/50 disabled:text-gray-500 transition-all duration-300 resize-none backdrop-blur-sm bg-white/50"
                />
              </div>
            </div>
          </div>

          {/* Статистика */}
          <div className="px-8 py-8 border-t border-gray-200/50 bg-gradient-to-r from-gray-50/50 to-blue-50/50">
            <div className="grid grid-cols-3 gap-8 text-center">
              {[
                { value: user?.totalChats || 0, label: 'Чатов', color: 'from-blue-500 to-cyan-500' },
                { value: user?.totalMessages || 0, label: 'Сообщений', color: 'from-purple-500 to-pink-500' },
                { value: formatJoinDate(user?.date_joined), label: 'Дата регистрации', color: 'from-green-500 to-emerald-500' }
              ].map((stat, index) => (
                <div 
                  key={index}
                  className="transform transition-all duration-300 hover:scale-110"
                >
                  <div className={`text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-500 font-medium mt-2">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Действия */}
          <div className="px-8 py-6 border-t border-gray-200/50 bg-white/50">
            <button
              onClick={handleLogout}
              className="group flex items-center justify-center w-full sm:w-auto mx-auto px-8 py-4 border-2 border-red-200 rounded-2xl text-sm font-semibold text-red-700 bg-white/80 hover:bg-red-600 hover:text-white hover:border-red-600 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 backdrop-blur-sm"
            >
              <LogOut className="h-4 w-4 mr-2 transition-transform group-hover:rotate-180" />
              Выйти из аккаунта
            </button>
          </div>
        </div>
      </div>

      {/* Добавляем кастомные стили для анимаций */}
      <style jsx>{`
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Profile;