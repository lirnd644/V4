import React from 'react';
import { TrendingUp, Shield, Zap, Star } from 'lucide-react';

const Login = () => {
  const handleLogin = () => {
    const currentUrl = window.location.origin;
    const loginUrl = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(currentUrl + '/profile')}`;
    window.location.href = loginUrl;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        {/* Left side - Hero Content */}
        <div className="text-center md:text-left space-y-8 fade-in-up">
          <div className="flex items-center justify-center md:justify-start space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center pulse-glow">
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold crypto-font gradient-text">CripteX</h1>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
              Профессиональные
              <br />
              <span className="gradient-text">Криптопрогнозы</span>
            </h2>
            <p className="text-xl text-slate-300 leading-relaxed">
              Получайте точные торговые сигналы с высокой вероятностью успеха для максимизации прибыли
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="glass-card p-6 text-center">
              <Shield className="w-8 h-8 text-cyan-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">Точные Прогнозы</h3>
              <p className="text-slate-400 text-sm">Анализ с высокой точностью для популярных криптовалют</p>
            </div>
            
            <div className="glass-card p-6 text-center">
              <Zap className="w-8 h-8 text-cyan-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">Реальное Время</h3>
              <p className="text-slate-400 text-sm">Мгновенные уведомления о новых торговых сигналах</p>
            </div>
          </div>

          {/* Stats */}
          <div className="glass p-6 rounded-2xl">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold gradient-text crypto-font">75%+</div>
                <div className="text-slate-400 text-sm">Точность</div>
              </div>
              <div>
                <div className="text-2xl font-bold gradient-text crypto-font">10+</div>
                <div className="text-slate-400 text-sm">Криптовалют</div>
              </div>
              <div>
                <div className="text-2xl font-bold gradient-text crypto-font">24/7</div>
                <div className="text-slate-400 text-sm">Мониторинг</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Login Card */}
        <div className="slide-in-right">
          <div className="glass-card p-8 max-w-md mx-auto">
            <div className="text-center space-y-6">
              <div className="space-y-3">
                <h3 className="text-2xl font-bold text-white">Добро пожаловать!</h3>
                <p className="text-slate-400">Войдите для доступа к премиум прогнозам</p>
              </div>

              {/* Benefits */}
              <div className="space-y-3 text-left">
                <div className="flex items-center space-x-3">
                  <Star className="w-5 h-5 text-cyan-400" />
                  <span className="text-slate-300">5 бесплатных прогнозов для новых пользователей</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Star className="w-5 h-5 text-cyan-400" />
                  <span className="text-slate-300">+1 бонусный прогноз каждые 24 часа</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Star className="w-5 h-5 text-cyan-400" />
                  <span className="text-slate-300">Реферальная программа с наградами</span>
                </div>
              </div>

              <button
                onClick={handleLogin}
                className="w-full btn-primary text-lg py-4 rounded-xl font-semibold transition-all duration-300 hover:scale-105"
              >
                Войти / Регистрация
              </button>

              <p className="text-xs text-slate-500 text-center">
                Нажимая "Войти", вы соглашаетесь с условиями использования и политикой конфиденциальности
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Background Elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-3/4 left-3/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
};

export default Login;