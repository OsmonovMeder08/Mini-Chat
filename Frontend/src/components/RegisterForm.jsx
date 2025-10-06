import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserPlus, Eye, EyeOff, User, Lock, Shield, Sparkles, Rocket, CheckCircle, ArrowRight } from 'lucide-react';

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  // Анимация прогресса при заполнении формы
  useEffect(() => {
    let filledFields = 0;
    if (formData.username.length >= 3) filledFields++;
    if (formData.password.length >= 6) filledFields++;
    if (formData.confirmPassword.length >= 6 && formData.password === formData.confirmPassword) filledFields++;
    
    setProgress((filledFields / 3) * 100);
  }, [formData]);

  // Анимация звезд
  useEffect(() => {
    const createStar = () => {
      const star = document.createElement('div');
      star.className = 'absolute w-1 h-1 bg-white/40 rounded-full animate-twinkle';
      star.style.left = Math.random() * 100 + '%';
      star.style.top = Math.random() * 100 + '%';
      star.style.animationDelay = Math.random() * 3 + 's';
      star.style.animationDuration = (Math.random() * 2 + 1) + 's';
      
      const container = document.querySelector('.stars-container');
      if (container) {
        container.appendChild(star);
      }
    };

    // Создаем начальные звезды
    for (let i = 0; i < 50; i++) {
      createStar();
    }

    const interval = setInterval(createStar, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const validateForm = () => {
    if (!formData.username || !formData.password || !formData.confirmPassword) {
      return 'Пожалуйста, заполните все поля';
    }
    
    if (formData.username.length < 3) {
      return 'Имя пользователя должно содержать минимум 3 символа';
    }
    
    if (formData.password.length < 6) {
      return 'Пароль должен содержать минимум 6 символов';
    }
    
    if (formData.password !== formData.confirmPassword) {
      return 'Пароли не совпадают';
    }
    
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      setLoading(false);
      return;
    }

    const result = await register(formData);
    
    if (result.success) {
      // Анимация успешной регистрации
      document.querySelector('.register-container')?.classList.add('scale-110', 'opacity-0');
      setTimeout(() => navigate('/chats'), 600);
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  const getPasswordStrength = () => {
    if (formData.password.length === 0) return { strength: 0, color: 'bg-gray-500' };
    if (formData.password.length < 6) return { strength: 33, color: 'bg-red-500' };
    if (formData.password.length < 8) return { strength: 66, color: 'bg-yellow-500' };
    return { strength: 100, color: 'bg-green-500' };
  };

  const passwordStrength = getPasswordStrength();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden">
      {/* Анимированный фон с звездами */}
      <div className="absolute inset-0 stars-container overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-blue-500/10 to-transparent"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-700"></div>
      </div>

      {/* Летающая ракета */}
      <div className="absolute top-10 right-10 animate-float-slow">
        <Rocket className="h-8 w-8 text-cyan-400 transform rotate-45" />
      </div>

      {/* Основной контейнер */}
      <div className="register-container relative z-10 w-full max-w-lg mx-4 transform transition-all duration-500">
        <div className="bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
          {/* Верхняя часть с прогрессом */}
          <div className="relative h-40 bg-gradient-to-r from-cyan-600 via-purple-600 to-pink-600 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
            
            {/* Анимированные элементы */}
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/10 rounded-full"></div>
            <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-cyan-400/20 rounded-full"></div>
            
            {/* Заголовок */}
            <div className="relative p-6 h-full flex flex-col justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-2xl backdrop-blur-sm">
                  <UserPlus className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Создание аккаунта</h1>
                  <p className="text-white/80 text-sm">Присоединяйтесь к сообществу</p>
                </div>
              </div>

              {/* Прогресс бар */}
              <div className="w-full bg-white/20 rounded-full h-2">
                <div 
                  className="h-2 rounded-full bg-gradient-to-r from-cyan-400 to-pink-400 transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Форма */}
          <div className="p-8">
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
                <label className="block text-sm font-medium text-cyan-300 mb-3">
                  Имя пользователя
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400 group-focus-within:text-cyan-400 transition-colors duration-300" />
                  </div>
                  <input
                    name="username"
                    type="text"
                    required
                    className="block w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-cyan-500/20 focus:border-cyan-400 transition-all duration-300 backdrop-blur-sm"
                    placeholder="минимум 3 символа"
                    value={formData.username}
                    onChange={handleChange}
                  />
                  {formData.username.length >= 3 && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <CheckCircle className="h-5 w-5 text-green-400 animate-scale-in" />
                    </div>
                  )}
                </div>
              </div>

              {/* Поле пароля */}
              <div className="group">
                <label className="block text-sm font-medium text-cyan-300 mb-3">
                  Пароль
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-cyan-400 transition-colors duration-300" />
                  </div>
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="block w-full pl-12 pr-12 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-cyan-500/20 focus:border-cyan-400 transition-all duration-300 backdrop-blur-sm"
                    placeholder="минимум 6 символов"
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
                
                {/* Индикатор сложности пароля */}
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex space-x-1">
                      {[0, 1, 2].map((index) => (
                        <div
                          key={index}
                          className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                            index * 33 < passwordStrength.strength 
                              ? passwordStrength.color 
                              : 'bg-gray-600'
                          }`}
                        ></div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {passwordStrength.strength === 33 && 'Слабый пароль'}
                      {passwordStrength.strength === 66 && 'Средний пароль'}
                      {passwordStrength.strength === 100 && 'Сильный пароль'}
                    </p>
                  </div>
                )}
              </div>

              {/* Подтверждение пароля */}
              <div className="group">
                <label className="block text-sm font-medium text-cyan-300 mb-3">
                  Подтверждение пароля
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Shield className="h-5 w-5 text-gray-400 group-focus-within:text-cyan-400 transition-colors duration-300" />
                  </div>
                  <input
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    className="block w-full pl-12 pr-12 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-cyan-500/20 focus:border-cyan-400 transition-all duration-300 backdrop-blur-sm"
                    placeholder="повторите пароль"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-cyan-400 transition-colors duration-300" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-cyan-400 transition-colors duration-300" />
                    )}
                  </button>
                  
                  {formData.confirmPassword && formData.password === formData.confirmPassword && (
                    <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
                      <CheckCircle className="h-5 w-5 text-green-400 animate-scale-in" />
                    </div>
                  )}
                </div>
              </div>

              {/* Кнопка регистрации */}
              <button
                type="submit"
                disabled={loading || progress !== 100}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className="group relative w-full py-4 px-6 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 disabled:from-gray-600 disabled:to-gray-700 rounded-2xl text-white font-semibold shadow-2xl hover:shadow-cyan-500/25 transition-all duration-500 transform hover:scale-[1.02] disabled:transform-none disabled:hover:shadow-2xl overflow-hidden"
              >
                {/* Анимированный фон */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                
                {/* Содержимое кнопки */}
                <div className="relative flex items-center justify-center space-x-3">
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Создание аккаунта...</span>
                    </>
                  ) : (
                    <>
                      <Rocket className="h-5 w-5 transform transition-transform duration-300 group-hover:rotate-45" />
                      <span>Начать путешествие</span>
                      <ArrowRight className={`h-5 w-5 transform transition-transform duration-300 ${isHovered ? 'translate-x-1' : ''}`} />
                    </>
                  )}
                </div>

                {/* Эффект свечения */}
                <div className="absolute inset-0 rounded-2xl bg-cyan-400/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </button>
            </form>

            {/* Ссылка на вход */}
            <div className="mt-8 text-center">
              <p className="text-gray-400 text-sm">
                Уже есть аккаунт?{' '}
                <Link
                  to="/login"
                  className="group font-semibold text-cyan-400 hover:text-cyan-300 transition-colors duration-300 inline-flex items-center space-x-1"
                >
                  <span>Войти в систему</span>
                  <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
              </p>
            </div>
          </div>

          {/* Нижняя часть с информацией */}
          <div className="px-8 py-4 bg-white/5 backdrop-blur-sm border-t border-white/10">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <Sparkles className="h-3 w-3 text-cyan-400" />
                  <span>Защищено шифрованием</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>Система активна</span>
                </div>
              </div>
              <div className="text-cyan-400">
                {progress === 100 ? 'Готово к запуску! 🚀' : `${Math.round(progress)}% завершено`}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Стили для анимаций */}
      <style jsx>{`
        @keyframes float-slow {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          33% {
            transform: translateY(-20px) rotate(120deg);
          }
          66% {
            transform: translateY(10px) rotate(240deg);
          }
        }

        @keyframes twinkle {
          0%, 100% {
            opacity: 0.2;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }

        @keyframes scale-in {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        .animate-float-slow {
          animation: float-slow 6s ease-in-out infinite;
        }

        .animate-twinkle {
          animation: twinkle ease-in-out infinite;
        }

        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }

        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default RegisterForm;