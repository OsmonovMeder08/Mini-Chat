import React from 'react';
import { Check, CheckCheck } from 'lucide-react';

const Message = ({ message, isOwn, showTimestamp = true }) => {
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Сегодня';
    }
    
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Вчера';
    }
    
    return date.toLocaleDateString('ru-RU', { 
      day: '2-digit', 
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
        isOwn 
          ? 'bg-blue-500 text-white' 
          : 'bg-gray-200 text-gray-900'
      }`}>
        {/* Имя отправителя (только для чужих сообщений) */}
        {!isOwn && (
          <div className="text-xs font-medium text-gray-600 mb-1">
            {message.sender?.username}
          </div>
        )}
        
        {/* Текст сообщения */}
        <div className="text-sm whitespace-pre-wrap break-words">
          {message.content}
        </div>
        
        {/* Время и статус прочтения */}
        {showTimestamp && (
          <div className={`flex items-center justify-end mt-1 space-x-1 ${
            isOwn ? 'text-blue-100' : 'text-gray-500'
          }`}>
            <span className="text-xs">
              {formatTime(message.createdAt)}
            </span>
            
            {/* Индикатор прочтения (только для своих сообщений) */}
            {isOwn && (
              <div className="flex items-center">
                {message.isRead ? (
                  <CheckCheck className="h-3 w-3" />
                ) : (
                  <Check className="h-3 w-3" />
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Статус доставки */}
        {isOwn && message.status && (
          <div className={`text-xs mt-1 ${
            isOwn ? 'text-blue-100' : 'text-gray-500'
          }`}>
            {message.status === 'sending' && 'Отправляется...'}
            {message.status === 'sent' && 'Отправлено'}
            {message.status === 'delivered' && 'Доставлено'}
            {message.status === 'read' && 'Прочитано'}
            {message.status === 'failed' && (
              <span className="text-red-300">Ошибка отправки</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Message;
