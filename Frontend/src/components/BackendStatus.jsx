import React, { useState, useEffect } from 'react';
import { AlertTriangle, Server, Database, CheckCircle, XCircle } from 'lucide-react';

const BackendStatus = () => {
  const [backendStatus, setBackendStatus] = useState('checking');
  const [wsStatus, setWsStatus] = useState('checking');

  useEffect(() => {
    checkBackendStatus();
    checkWebSocketStatus();
  }, []);

  const checkBackendStatus = async () => {
    try {
      const response = await fetch('/api/auth/user/', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer dummy-token-for-test`
        }
      });
      
      if (response.status === 401) {
        setBackendStatus('running'); // Сервер работает, но требует аутентификацию
      } else if (response.status === 404) {
        setBackendStatus('wrong-endpoint'); // Сервер работает, но endpoint неправильный
      } else {
        setBackendStatus('running');
      }
    } catch (error) {
      if (error.message.includes('fetch')) {
        setBackendStatus('offline');
      } else {
        setBackendStatus('error');
      }
    }
  };

  const checkWebSocketStatus = () => {
    try {
      const ws = new WebSocket('ws://127.0.0.1:8000/ws/chat/?token=test');
      
      ws.onopen = () => {
        setWsStatus('running');
        ws.close();
      };
      
      ws.onerror = () => {
        setWsStatus('offline');
      };
      
      setTimeout(() => {
        if (ws.readyState === WebSocket.CONNECTING) {
          setWsStatus('offline');
          ws.close();
        }
      }, 3000);
    } catch (error) {
      setWsStatus('error');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'running':
      case 'wrong-endpoint':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'offline':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'checking':
        return <div className="h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusText = (status, type) => {
    const isWS = type === 'websocket';
    
    switch (status) {
      case 'running':
        return isWS ? 'WebSocket сервер доступен' : 'Django API сервер работает';
      case 'wrong-endpoint':
        return 'Сервер работает, но API endpoints могут отличаться';
      case 'offline':
        return isWS ? 'WebSocket сервер недоступен' : 'Django API сервер не запущен';
      case 'checking':
        return 'Проверка соединения...';
      default:
        return 'Ошибка проверки статуса';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Server className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mini Chat Frontend</h1>
          <p className="text-gray-600">Приложение настроено для работы с реальным Django API</p>
        </div>

        <div className="space-y-6">
          <div className="bg-white/60 rounded-2xl p-6 border border-white/40">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <Database className="h-6 w-6 mr-3 text-blue-500" />
              Статус бэкенда
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white/50 rounded-xl">
                <div>
                  <p className="font-medium text-gray-700">Django API Server</p>
                  <p className="text-sm text-gray-500">http://127.0.0.1:8000/api/</p>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(backendStatus)}
                  <span className="text-sm">{getStatusText(backendStatus, 'api')}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-white/50 rounded-xl">
                <div>
                  <p className="font-medium text-gray-700">WebSocket Server</p>
                  <p className="text-sm text-gray-500">ws://127.0.0.1:8000/ws/</p>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(wsStatus)}
                  <span className="text-sm">{getStatusText(wsStatus, 'websocket')}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50/80 rounded-2xl p-6 border border-blue-200/50">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">Инструкции по запуску:</h3>
            <div className="space-y-2 text-sm text-blue-700">
              <p>1. Убедитесь, что Django сервер запущен на порту 8000</p>
              <p>2. Настройте CORS в Django для домена http://localhost:5173</p>
              <p>3. Убедитесь, что WebSocket сервер (Django Channels) работает</p>
              <p>4. Проверьте, что API endpoints соответствуют ожидаемым</p>
            </div>
          </div>

          <div className="bg-green-50/80 rounded-2xl p-6 border border-green-200/50">
            <h3 className="text-lg font-semibold text-green-800 mb-3">Функции приложения:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-green-700">
              <p>✅ Регистрация и аутентификация</p>
              <p>✅ Реальное время через WebSocket</p>
              <p>✅ Обмен сообщениями</p>
              <p>✅ Управление профилем</p>
              <p>✅ Статусы пользователей</p>
              <p>✅ Индикаторы набора текста</p>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={() => {
                setBackendStatus('checking');
                setWsStatus('checking');
                checkBackendStatus();
                checkWebSocketStatus();
              }}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-medium"
            >
              Проверить снова
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackendStatus;
