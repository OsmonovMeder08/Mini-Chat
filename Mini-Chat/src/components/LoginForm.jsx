import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, Eye, EyeOff, Mail, Lock, Sparkles, User, ArrowRight } from 'lucide-react';

const LoginForm = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isHovered, setIsHovered] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  // Анимация частиц
  useEffect(() => {
    const createParticle = () => {
      const particle = document.createElement('div');
      particle.className = 'absolute w-2 h-2 bg-blue-400/30 rounded-full animate-float';
      particle.style.left = Math.random() * 100 + '%';
      particle.style.top = '100%';
      particle.style.animationDuration = (Math.random() * 3 + 2) + 's';
      particle.style.animationDelay = Math.random() * 2 + 's';
      
      const container = document.querySelector('.particles-container');
      if (container) {
        container.appendChild(particle);
        
        setTimeout(() => {
          particle.remove();
        }, 5000);
      }
    };

    const interval = setInterval(createParticle, 300);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.username || !formData.password) {
      setError('Пожалуйста, заполните все поля');
      setLoading(false);
      return;
    }

    const result = await login(formData.username, formData.password);
    
    if (result.success) {
      // Анимация успешного входа
      document.querySelector('.login-container')?.classList.add('scale-105', 'opacity-0');
      setTimeout(() => navigate('/chats'), 500);
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Анимированный фон с частицами */}
      <div className="absolute inset-0">
        <div className="particles-container absolute inset-0 overflow-hidden"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-cyan-500/10"></div>
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Основной контейнер */}
      <div className="login-container relative z-10 w-full max-w-md mx-4 transform transition-all duration-500">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
          {/* Декоративная верхняя часть */}
          <div className="relative h-32 bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
            <div className="absolute top-4 left-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-white/20 rounded-2xl backdrop-blur-sm">
                  <LogIn className="h-6 w-6 text-white" />
                </div>
                <span className="text-white font-bold text-lg">Вход</span>
              </div>
            </div>
            
            {/* Анимированные элементы */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full"></div>
            <div className="absolute -bottom-20 -left-10 w-60 h-60 bg-cyan-400/20 rounded-full"></div>
          </div>

          {/* Форма */}
          <div className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent mb-2">
                С возвращением!
              </h1>
              <p className="text-gray-300 text-sm">
                Рады видеть вас снова
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Сообщение об ошибке */}
              {error && (
                <div className="animate-shake bg-red-500/20 backdrop-blur-sm border border-red-500/50 text-red-200 px-4 py-3 rounded-2xl text-sm">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse mr-3"></div>
                    {error}
                  </div>
                </div>
              )}

              {/* Поле имени пользователя */}
              <div className="group">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400 group-focus-within:text-cyan-400 transition-colors duration-300" />
                  </div>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    className="block w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-cyan-500/20 focus:border-cyan-400 transition-all duration-300 backdrop-blur-sm"
                    placeholder="Имя пользователя"
                    value={formData.username}
                    onChange={handleChange}
                  />
                  {formData.username && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
                    </div>
                  )}
                </div>
              </div>

              {/* Поле пароля */}
              <div className="group">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-cyan-400 transition-colors duration-300" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="block w-full pl-12 pr-12 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-cyan-500/20 focus:border-cyan-400 transition-all duration-300 backdrop-blur-sm"
                    placeholder="Пароль"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-cyan-400 transition-colors duration-300" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-cyan-400 transition-colors duration-300" />
                    )}
                  </button>
                </div>
              </div>

              {/* Кнопка входа */}
              <button
                type="submit"
                disabled={loading}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className="group relative w-full py-4 px-6 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:from-gray-600 disabled:to-gray-700 rounded-2xl text-white font-semibold shadow-2xl hover:shadow-cyan-500/25 transition-all duration-500 transform hover:scale-[1.02] disabled:transform-none disabled:hover:shadow-2xl overflow-hidden"
              >
                {/* Анимированный фон кнопки */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                
                {/* Содержимое кнопки */}
                <div className="relative flex items-center justify-center space-x-3">
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Вход...</span>
                    </>
                  ) : (
                    <>
                      <span>Войти в аккаунт</span>
                      <ArrowRight className={`h-5 w-5 transform transition-transform duration-300 ${isHovered ? 'translate-x-1' : ''}`} />
                    </>
                  )}
                </div>

                {/* Эффект свечения */}
                <div className="absolute inset-0 rounded-2xl bg-cyan-400/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </button>
            </form>

            {/* Ссылка на регистрацию */}
            <div className="mt-8 text-center">
              <p className="text-gray-400 text-sm">
                Еще нет аккаунта?{' '}
                <Link
                  to="/register"
                  className="group font-semibold text-cyan-400 hover:text-cyan-300 transition-colors duration-300 inline-flex items-center space-x-1"
                >
                  <span>Создать аккаунт</span>
                  <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
              </p>
            </div>
          </div>

          {/* Декоративная нижняя часть */}
          <div className="px-8 py-4 bg-white/5 backdrop-blur-sm border-t border-white/10">
            <div className="flex items-center justify-center space-x-4 text-xs text-gray-400">
              <div className="flex items-center space-x-1">
                <Sparkles className="h-3 w-3 text-cyan-400" />
                <span>Безопасный вход</span>
              </div>
              <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Система онлайн</span>
              </div>
            </div>
          </div>
        </div>

        {/* Дополнительные декоративные элементы */}
        <div className="absolute -z-10 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-full blur-3xl animate-float-slow"></div>
      </div>

      {/* Стили для анимаций */}
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-100vh) rotate(360deg);
            opacity: 0;
          }
        }

        @keyframes float-slow {
          0%, 100% {
            transform: translate(-50%, -50%) scale(1);
          }
          50% {
            transform: translate(-50%, -50%) scale(1.1);
          }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        .animate-float {
          animation: float linear infinite;
        }

        .animate-float-slow {
          animation: float-slow 8s ease-in-out infinite;
        }

        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }

        /* Стили для скроллбара */
        .particles-container::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default LoginForm;