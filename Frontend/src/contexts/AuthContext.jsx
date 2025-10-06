import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, userAPI } from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('access_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    const accessToken = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');
    
    if (accessToken) {
      try {
        // Пытаемся получить текущего пользователя
        const response = await userAPI.getCurrentUser();
        setUser(response.data);
        setToken(accessToken);
      } catch (error) {
        // Если токен недействителен, пытаемся обновить его
        if (refreshToken && error.response?.status === 401) {
          try {
            const refreshResponse = await authAPI.refreshToken(refreshToken);
            const newAccessToken = refreshResponse.data.access;
            
            localStorage.setItem('access_token', newAccessToken);
            setToken(newAccessToken);
            
            // Получаем пользователя с новым токеном
            const userResponse = await userAPI.getCurrentUser();
            setUser(userResponse.data);
          } catch (refreshError) {
            // Не удалось обновить токен, очищаем данные
            clearAuthData();
          }
        } else {
          clearAuthData();
        }
      }
    }
    
    setLoading(false);
  };

  const clearAuthData = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const login = async (username, password) => {
    try {
      const response = await authAPI.login(username, password);
      const { user: userData, tokens } = response.data;
      
      // Сохраняем токены
      localStorage.setItem('access_token', tokens.access);
      localStorage.setItem('refresh_token', tokens.refresh);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setToken(tokens.access);
      setUser(userData);
      
      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      console.error('Error response data:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      let errorMessage = 'Ошибка входа';
      
      if (error.response?.data) {
        const data = error.response.data;
        
        if (data.detail) {
          errorMessage = data.detail;
        } else if (data.message) {
          errorMessage = data.message;
        } else if (data.non_field_errors) {
          errorMessage = Array.isArray(data.non_field_errors) ? data.non_field_errors[0] : data.non_field_errors;
        } else if (data.username) {
          errorMessage = `Имя пользователя: ${Array.isArray(data.username) ? data.username[0] : data.username}`;
        } else if (data.password) {
          errorMessage = `Пароль: ${Array.isArray(data.password) ? data.password[0] : data.password}`;
        } else if (typeof data === 'string') {
          errorMessage = data;
        }
      } else if (error.response?.status === 401) {
        errorMessage = 'Неверное имя пользователя или пароль';
      } else if (error.response?.status === 400) {
        errorMessage = 'Некорректные данные для входа';
      } else if (error.message) {
        errorMessage = `Ошибка соединения: ${error.message}`;
      }
      
      return { 
        success: false, 
        error: errorMessage
      };
    }
  };

  const register = async (formData) => {
    try {
      const requestData = {
        username: formData.username,
        password: formData.password,
        password_confirm: formData.confirmPassword,
        email: formData.email || '',
        first_name: formData.firstName || '',
        last_name: formData.lastName || ''
      };
      
      console.log('Sending registration data:', requestData);
      
      const response = await authAPI.register(requestData);
      
      console.log('Registration successful:', response.data);
      
      const { user: userData, tokens } = response.data;
      
      // Сохраняем токены
      localStorage.setItem('access_token', tokens.access);
      localStorage.setItem('refresh_token', tokens.refresh);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setToken(tokens.access);
      setUser(userData);
      
      return { success: true };
    } catch (error) {
      console.error('Registration failed:', error);
      console.error('Error response data:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      // Показываем детальную информацию об ошибках валидации
      if (error.response?.data?.username) {
        console.error('Username validation error:', error.response.data.username);
      }
      if (error.response?.data) {
        console.error('Full error data structure:', JSON.stringify(error.response.data, null, 2));
      }
      
      console.error('Request config:', error.config);
      console.error('Request URL:', error.config?.url);
      console.error('Request method:', error.config?.method);
      console.error('Request data:', error.config?.data);
      
      let errorMessage = 'Ошибка регистрации';
      
      if (error.response?.data) {
        const data = error.response.data;
        
        // Обрабатываем различные форматы ошибок от Django
        if (data.username) {
          errorMessage = `Имя пользователя: ${Array.isArray(data.username) ? data.username[0] : data.username}`;
        } else if (data.password) {
          errorMessage = `Пароль: ${Array.isArray(data.password) ? data.password[0] : data.password}`;
        } else if (data.password_confirm) {
          errorMessage = `Подтверждение пароля: ${Array.isArray(data.password_confirm) ? data.password_confirm[0] : data.password_confirm}`;
        } else if (data.email) {
          errorMessage = `Email: ${Array.isArray(data.email) ? data.email[0] : data.email}`;
        } else if (data.non_field_errors) {
          errorMessage = Array.isArray(data.non_field_errors) ? data.non_field_errors[0] : data.non_field_errors;
        } else if (data.detail) {
          errorMessage = data.detail;
        } else if (data.message) {
          errorMessage = data.message;
        } else if (typeof data === 'string') {
          errorMessage = data;
        } else {
          // Если структура ошибки неизвестна, покажем первую найденную ошибку
          const firstError = Object.values(data)[0];
          if (firstError) {
            errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
          }
        }
      } else if (error.response?.status === 400) {
        errorMessage = 'Некорректные данные. Проверьте правильность заполнения полей.';
      } else if (error.response?.status === 409) {
        errorMessage = 'Пользователь с таким именем уже существует';
      } else if (error.message) {
        errorMessage = `Ошибка соединения: ${error.message}`;
      }
      
      return { 
        success: false, 
        error: errorMessage
      };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuthData();
    }
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const refreshUser = async () => {
    try {
      const response = await userAPI.getCurrentUser();
      setUser(response.data);
      localStorage.setItem('user', JSON.stringify(response.data));
      return response.data;
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      return null;
    }
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    updateUser,
    refreshUser,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
