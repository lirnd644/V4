import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Copy, Share2, Gift, TrendingUp, CheckCircle } from 'lucide-react';

const Referrals = ({ user }) => {
  const [referralStats, setReferralStats] = useState({
    referral_code: user.referral_code || '',
    referral_count: user.referral_count || 0,
    referral_earnings: user.referral_earnings || 0
  });
  const [copied, setCopied] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    fetchReferralStats();
  }, []);

  const fetchReferralStats = async () => {
    try {
      const response = await axios.get('/api/referral/stats');
      setReferralStats(response.data);
    } catch (error) {
      console.error('Error fetching referral stats:', error);
    }
  };

  const copyReferralLink = () => {
    const referralLink = `${window.location.origin}?ref=${referralStats.referral_code}`;
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const copyReferralCode = () => {
    navigator.clipboard.writeText(referralStats.referral_code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const shareReferralLink = async () => {
    const referralLink = `${window.location.origin}?ref=${referralStats.referral_code}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'CripteX - Профессиональные криптопрогнозы',
          text: 'Присоединяйся к CripteX и получай точные торговые сигналы!',
          url: referralLink,
        });
      } catch (error) {
        copyReferralLink();
      }
    } else {
      copyReferralLink();
    }
  };

  const applyReferralCode = async (e) => {
    e.preventDefault();
    if (!referralCode.trim()) return;

    setApplying(true);
    try {
      const response = await axios.post(`/api/referral/use/${referralCode}`);
      alert(response.data.message);
      setReferralCode('');
    } catch (error) {
      alert(error.response?.data?.detail || 'Ошибка при применении реферального кода');
    } finally {
      setApplying(false);
    }
  };

  const referralTiers = [
    { referrals: 1, reward: 1, title: 'Новичок' },
    { referrals: 5, reward: 2, title: 'Активный' },
    { referrals: 10, reward: 3, title: 'Профи' },
    { referrals: 25, reward: 5, title: 'Эксперт' },
    { referrals: 50, reward: 10, title: 'Мастер' }
  ];

  const getCurrentTier = () => {
    const currentTier = referralTiers.find(tier => referralStats.referral_count < tier.referrals) ||
                       referralTiers[referralTiers.length - 1];
    return currentTier;
  };

  const currentTier = getCurrentTier();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="glass-card p-8 fade-in-up">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center space-x-3">
              <Users className="w-8 h-8 text-cyan-400" />
              <span>Реферальная программа</span>
            </h1>
            <p className="text-slate-400 text-lg">
              Приглашайте друзей и получайте бонусы за каждого нового пользователя
            </p>
          </div>
          
          <div className="flex space-x-4">
            <button
              onClick={shareReferralLink}
              className="btn-primary px-6 py-3 flex items-center space-x-2"
            >
              <Share2 className="w-4 h-4" />
              <span>Поделиться</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 slide-in-right">
        <div className="stat-card">
          <Users className="w-8 h-8 text-cyan-400 mx-auto mb-4" />
          <div className="text-3xl font-bold gradient-text crypto-font mb-2">
            {referralStats.referral_count}
          </div>
          <div className="text-slate-400 font-medium">Приглашенных друзей</div>
          <div className="text-xs text-slate-500 mt-1">Всего рефералов</div>
        </div>

        <div className="stat-card">
          <Gift className="w-8 h-8 text-green-400 mx-auto mb-4" />
          <div className="text-3xl font-bold text-green-400 crypto-font mb-2">
            {referralStats.referral_earnings}
          </div>
          <div className="text-slate-400 font-medium">Заработано прогнозов</div>
          <div className="text-xs text-slate-500 mt-1">Бонусы от рефералов</div>
        </div>

        <div className="stat-card">
          <TrendingUp className="w-8 h-8 text-purple-400 mx-auto mb-4" />
          <div className="text-3xl font-bold text-purple-400 crypto-font mb-2">
            {currentTier.reward}x
          </div>
          <div className="text-slate-400 font-medium">Текущий множитель</div>
          <div className="text-xs text-slate-500 mt-1">{currentTier.title}</div>
        </div>
      </div>

      {/* Referral Code Section */}
      <div className="glass-card p-6">
        <h2 className="text-2xl font-bold text-white mb-6">Ваш реферальный код</h2>
        
        <div className="space-y-4">
          <div className="referral-code relative">
            {referralStats.referral_code}
            <button
              onClick={copyReferralCode}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <button
              onClick={copyReferralLink}
              className="btn-secondary flex items-center justify-center space-x-2 px-6 py-3"
            >
              <Copy className="w-4 h-4" />
              <span>Копировать ссылку</span>
            </button>
            
            <button
              onClick={shareReferralLink}
              className="btn-primary flex items-center justify-center space-x-2 px-6 py-3"
            >
              <Share2 className="w-4 h-4" />
              <span>Поделиться</span>
            </button>
          </div>
        </div>
      </div>

      {/* Use Referral Code */}
      {!user.referred_by && (
        <div className="glass-card p-6">
          <h2 className="text-2xl font-bold text-white mb-6">Использовать реферальный код</h2>
          
          <form onSubmit={applyReferralCode} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Введите реферальный код друга
              </label>
              <input
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                className="form-input"
                placeholder="Например: ABC12345"
                maxLength="8"
              />
              <p className="text-xs text-slate-500 mt-1">
                Вы и ваш друг получите по 1 бесплатному прогнозу
              </p>
            </div>
            
            <button
              type="submit"
              className="btn-primary px-6 py-3"
              disabled={applying || !referralCode.trim()}
            >
              {applying ? 'Применяем...' : 'Применить код'}
            </button>
          </form>
        </div>
      )}

      {/* Referral Tiers */}
      <div className="glass-card p-6">
        <h2 className="text-2xl font-bold text-white mb-6">Уровни наград</h2>
        
        <div className="space-y-4">
          {referralTiers.map((tier, index) => {
            const isAchieved = referralStats.referral_count >= tier.referrals;
            const isCurrent = referralStats.referral_count < tier.referrals && 
                             (index === 0 || referralStats.referral_count >= referralTiers[index - 1].referrals);
            
            return (
              <div
                key={index}
                className={`prediction-card ${isAchieved ? 'border-green-500/50' : isCurrent ? 'border-cyan-500/50' : 'border-slate-700/50'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      isAchieved 
                        ? 'bg-green-500/20 text-green-400' 
                        : isCurrent 
                        ? 'bg-cyan-500/20 text-cyan-400' 
                        : 'bg-slate-500/20 text-slate-400'
                    }`}>
                      {isAchieved ? (
                        <CheckCircle className="w-6 h-6" />
                      ) : (
                        <Users className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{tier.title}</h3>
                      <p className="text-slate-400 text-sm">
                        {tier.referrals} рефералов • +{tier.reward} прогноз за каждого
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`text-lg font-bold ${
                      isAchieved ? 'text-green-400' : isCurrent ? 'text-cyan-400' : 'text-slate-400'
                    }`}>
                      {isAchieved ? 'Достигнуто' : isCurrent ? 'Текущий' : 'Заблокировано'}
                    </div>
                    {!isAchieved && (
                      <div className="text-xs text-slate-500">
                        Осталось: {tier.referrals - referralStats.referral_count}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* How it Works */}
      <div className="glass-card p-6">
        <h2 className="text-2xl font-bold text-white mb-6">Как это работает</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-cyan-500/20 rounded-xl flex items-center justify-center mx-auto">
              <Share2 className="w-8 h-8 text-cyan-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">1. Поделитесь</h3>
            <p className="text-slate-400 text-sm">
              Отправьте свой реферальный код друзьям или поделитесь ссылкой в социальных сетях
            </p>
          </div>
          
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-500/20 rounded-xl flex items-center justify-center mx-auto">
              <Users className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">2. Друзья регистрируются</h3>
            <p className="text-slate-400 text-sm">
              Когда ваш друг использует ваш код, вы оба получаете по 1 бесплатному прогнозу
            </p>
          </div>
          
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-purple-500/20 rounded-xl flex items-center justify-center mx-auto">
              <Gift className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">3. Получайте награды</h3>
            <p className="text-slate-400 text-sm">
              Приглашайте больше друзей и получайте увеличенные награды за каждого нового пользователя
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Referrals;