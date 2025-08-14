import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Settings as SettingsIcon, Moon, Sun, Globe, Bell, DollarSign, Save, Check } from 'lucide-react';

const Settings = ({ user, setUser }) => {
  const [settings, setSettings] = useState({
    theme: 'dark',
    language: 'ru',
    notifications_enabled: true,
    preferred_currency: 'USD'
  });
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchCurrencies();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get('/api/user/settings');
      setSettings(response.data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrencies = async () => {
    try {
      const response = await axios.get('/api/currencies');
      setCurrencies(response.data.currencies);
    } catch (error) {
      console.error('Error fetching currencies:', error);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await axios.put('/api/user/settings', settings);
      setSaved(true);
      
      // Update user object if currency changed
      if (settings.preferred_currency !== user.preferred_currency) {
        setUser({ ...user, preferred_currency: settings.preferred_currency });
      }
      
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Ошибка при сохранении настроек');
    } finally {
      setSaving(false);
    }
  };

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const languages = [
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'ko', name: '한국어', flag: '🇰🇷' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="glass-card p-8 fade-in-up">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center space-x-3">
          <SettingsIcon className="w-8 h-8 text-cyan-400" />
          <span>Настройки</span>
        </h1>
        <p className="text-slate-400 text-lg">
          Персонализируйте свой опыт использования CripteX
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Appearance Settings */}
        <div className="glass-card p-6 slide-in-right">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
            <Moon className="w-6 h-6 text-cyan-400" />
            <span>Внешний вид</span>
          </h2>

          <div className="space-y-6">
            {/* Theme Selection */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-3">
                Тема оформления
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleSettingChange('theme', 'dark')}
                  className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                    settings.theme === 'dark'
                      ? 'border-cyan-500 bg-cyan-500/20 text-cyan-400'
                      : 'border-slate-600 bg-slate-800/50 text-slate-400 hover:border-cyan-500/50'
                  }`}
                >
                  <Moon className="w-8 h-8 mx-auto mb-2" />
                  <div className="font-semibold">Темная</div>
                  <div className="text-xs">Рекомендуется</div>
                </button>
                
                <button
                  onClick={() => handleSettingChange('theme', 'light')}
                  className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                    settings.theme === 'light'
                      ? 'border-cyan-500 bg-cyan-500/20 text-cyan-400'
                      : 'border-slate-600 bg-slate-800/50 text-slate-400 hover:border-cyan-500/50'
                  }`}
                >
                  <Sun className="w-8 h-8 mx-auto mb-2" />
                  <div className="font-semibold">Светлая</div>
                  <div className="text-xs">Скоро будет</div>
                </button>
              </div>
            </div>

            {/* Language Selection */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-3">
                Язык интерфейса
              </label>
              <select
                value={settings.language}
                onChange={(e) => handleSettingChange('language', e.target.value)}
                className="form-select"
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-1">
                Изменения вступят в силу после перезагрузки страницы
              </p>
            </div>
          </div>
        </div>

        {/* Trading Settings */}
        <div className="glass-card p-6">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
            <DollarSign className="w-6 h-6 text-cyan-400" />
            <span>Торговые настройки</span>
          </h2>

          <div className="space-y-6">
            {/* Currency Selection */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-3">
                Предпочитаемая валюта
              </label>
              <select
                value={settings.preferred_currency}
                onChange={(e) => handleSettingChange('preferred_currency', e.target.value)}
                className="form-select"
              >
                {currencies.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.symbol} {currency.name} ({currency.code})
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-1">
                Все цены будут отображаться в выбранной валюте
              </p>
            </div>

            {/* Notifications */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-3">
                Уведомления
              </label>
              <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                <div className="flex items-center space-x-3">
                  <Bell className="w-5 h-5 text-cyan-400" />
                  <div>
                    <h3 className="text-white font-medium">Push-уведомления</h3>
                    <p className="text-slate-400 text-sm">Получать уведомления о результатах прогнозов</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notifications_enabled}
                    onChange={(e) => handleSettingChange('notifications_enabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Account Info */}
      <div className="glass-card p-6">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
          <Globe className="w-6 h-6 text-cyan-400" />
          <span>Информация об аккаунте</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-slate-800/50 rounded-xl">
            <h3 className="text-lg font-semibold text-white">Участник с</h3>
            <p className="text-cyan-400 font-semibold">
              {new Date(user.created_at).toLocaleDateString('ru-RU')}
            </p>
          </div>
          
          <div className="text-center p-4 bg-slate-800/50 rounded-xl">
            <h3 className="text-lg font-semibold text-white">Email</h3>
            <p className="text-cyan-400 font-semibold break-all">{user.email}</p>
          </div>
          
          <div className="text-center p-4 bg-slate-800/50 rounded-xl">
            <h3 className="text-lg font-semibold text-white">Реферальный код</h3>
            <p className="text-cyan-400 font-semibold crypto-font">{user.referral_code}</p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-center">
        <button
          onClick={handleSaveSettings}
          className={`px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 ${
            saved
              ? 'bg-green-500 text-white'
              : 'btn-primary hover:scale-105'
          }`}
          disabled={saving}
        >
          {saving ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Сохраняем...</span>
            </div>
          ) : saved ? (
            <div className="flex items-center space-x-2">
              <Check className="w-5 h-5" />
              <span>Сохранено!</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Save className="w-5 h-5" />
              <span>Сохранить настройки</span>
            </div>
          )}
        </button>
      </div>
    </div>
  );
};

export default Settings;