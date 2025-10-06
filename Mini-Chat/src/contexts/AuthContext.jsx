import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Mock данные пользователей
const mockUsers = [
  { id: 1, username: 'admin', password: 'admin123' },
  { id: 2, username: 'user1', password: 'password' },
  { id: 3, username: 'user2', password: 'password' },
  { id: 4, username: 'alice', password: 'alice123' },
  { id: 5, username: 'bob', password: 'bob123' },
];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      // Получаем пользователя из localStorage
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    }
    setLoading(false);
  }, [token]);

  const login = async (username, password) => {
    try {
      // Симуляция задержки API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Ищем пользователя в mock данных
      const foundUser = mockUsers.find(u => u.username === username && u.password === password);
      
      if (!foundUser) {
        return { 
          success: false, 
          error: 'Неверное имя пользователя или пароль' 
        };
      }
      
      // Создаем токен (просто строка для демонстрации)
      const newToken = `token_${foundUser.id}_${Date.now()}`;
      const userData = { 
        id: foundUser.id, 
        username: foundUser.username,
        isOnline: true,
        joinedAt: new Date().toISOString()
      };
      
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(userData));
      setToken(newToken);
      setUser(userData);
      
      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      return { 
        success: false, 
        error: 'Ошибка входа' 
      };
    }
  };

  const register = async (username, password) => {
    try {
      // Симуляция задержки API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Проверяем, не существует ли уже такой пользователь
      const existingUser = mockUsers.find(u => u.username === username);
      if (existingUser) {
        return { 
          success: false, 
          error: 'Пользователь с таким именем уже существует' 
        };
      }
      
      // Создаем нового пользователя
      const newUser = {
        id: mockUsers.length + 1,
        username,
        password
      };
      
      mockUsers.push(newUser);
      
      // Создаем токен
      const newToken = `token_${newUser.id}_${Date.now()}`;
      const userData = { 
        id: newUser.id, 
        username: newUser.username,
        isOnline: true,
        joinedAt: new Date().toISOString()
      };
      
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(userData));
      setToken(newToken);
      setUser(userData);
      
      return { success: true };
    } catch (error) {
      console.error('Registration failed:', error);
      return { 
        success: false, 
        error: 'Ошибка регистрации' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
