import React, { useState, useEffect } from 'react';
import { User, Save, LogOut, Tractor, UserCog, Bell, Shield, HelpCircle, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export function Settings() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'profile' | 'farm' | 'notifications' | 'security' | 'help'>('profile');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Profil bilgileri
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  
  // Çiftlik bilgileri
  const [farmId, setFarmId] = useState<string | null>(null);
  const [farmName, setFarmName] = useState('');
  const [farmAddress, setFarmAddress] = useState('');
  const [farmSize, setFarmSize] = useState('');
  const [farmType, setFarmType] = useState('dairy');
  
  // Bildirim ayarları
  const [notificationId, setNotificationId] = useState<string | null>(null);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [healthAlerts, setHealthAlerts] = useState(true);
  const [financialReports, setFinancialReports] = useState(true);
  const [milkProductionAlerts, setMilkProductionAlerts] = useState(true);

  useEffect(() => {
    if (user) {
      setEmail(user.email || '');
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      
      // Kullanıcı profil bilgilerini getir
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .maybeSingle();
      
      if (profileError) {
        console.error('Profile error:', profileError);
      }
      
      if (profileData) {
        setFullName(profileData.full_name || '');
        setPhone(profileData.phone || '');
      }
      
      // Çiftlik bilgilerini getir
      const { data: farmData, error: farmError } = await supabase
        .from('farms')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();
      
      if (farmError) {
        console.error('Farm error:', farmError);
      }
      
      if (farmData) {
        setFarmId(farmData.id);
        setFarmName(farmData.name || '');
        setFarmAddress(farmData.address || '');
        setFarmSize(farmData.size?.toString() || '');
        setFarmType(farmData.type || 'dairy');
      }
      
      // Bildirim ayarlarını getir
      const { data: notificationData, error: notificationError } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();
      
      if (notificationError) {
        console.error('Notification settings error:', notificationError);
      }
      
      if (notificationData) {
        setNotificationId(notificationData.id);
        setEmailNotifications(notificationData.email_enabled);
        setHealthAlerts(notificationData.health_alerts);
        setFinancialReports(notificationData.financial_reports);
        setMilkProductionAlerts(notificationData.milk_production_alerts);
      }
      
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError('Profil bilgileri yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Profil bilgilerini güncelle
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user?.id,
          full_name: fullName,
          phone: phone,
          updated_at: new Date().toISOString()
        });
      
      if (profileError) throw profileError;
      
      setSuccess('Profil bilgileri başarıyla güncellendi');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Profil güncellenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFarm = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!farmId) {
        // Eğer farmId yoksa, yeni bir çiftlik kaydı oluştur
        const { error: farmError } = await supabase
          .from('farms')
          .insert({
            user_id: user?.id,
            name: farmName,
            address: farmAddress,
            size: farmSize ? parseFloat(farmSize) : null,
            type: farmType,
            updated_at: new Date().toISOString()
          });
        
        if (farmError) throw farmError;
      } else {
        // Mevcut çiftlik kaydını güncelle
        const { error: farmError } = await supabase
          .from('farms')
          .update({
            name: farmName,
            address: farmAddress,
            size: farmSize ? parseFloat(farmSize) : null,
            type: farmType,
            updated_at: new Date().toISOString()
          })
          .eq('id', farmId);
        
        if (farmError) throw farmError;
      }
      
      setSuccess('Çiftlik bilgileri başarıyla güncellendi');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error updating farm:', err);
      setError('Çiftlik bilgileri güncellenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Bildirim ayarlarını güncelle
      const notificationData = {
        user_id: user?.id,
        email_enabled: emailNotifications,
        health_alerts: healthAlerts,
        financial_reports: financialReports,
        milk_production_alerts: milkProductionAlerts,
        updated_at: new Date().toISOString()
      };
      
      if (notificationId) {
        // Mevcut bildirim ayarlarını güncelle
        const { error: updateError } = await supabase
          .from('notification_settings')
          .update(notificationData)
          .eq('id', notificationId);
        
        if (updateError) throw updateError;
      } else {
        // Yeni bildirim ayarları oluştur
        const { data, error: insertError } = await supabase
          .from('notification_settings')
          .insert([notificationData])
          .select();
        
        if (insertError) throw insertError;
        
        if (data && data.length > 0) {
          setNotificationId(data[0].id);
        }
      }
      
      setSuccess('Bildirim ayarları başarıyla güncellendi');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error updating notification settings:', err);
      setError('Bildirim ayarları güncellenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth/login');
    } catch (err) {
      console.error('Error signing out:', err);
      setError('Çıkış yapılırken bir hata oluştu');
    }
  };

  return (
    <div className="space-y-6">
      {/* Üst Başlık */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ayarlar</h1>
        <p className="text-gray-600">Hesap ve uygulama ayarlarınızı yönetin</p>
      </div>

      {/* Ana İçerik */}
      <div className="bg-white rounded-lg shadow">
        <div className="md:flex">
          {/* Sol Menü */}
          <div className="md:w-64 border-r">
            <nav className="p-4 space-y-1">
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg ${
                  activeTab === 'profile'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <User className="h-5 w-5" />
                Profil Bilgileri
              </button>
              <button
                onClick={() => setActiveTab('farm')}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg ${
                  activeTab === 'farm'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Tractor className="h-5 w-5" />
                Çiftlik Bilgileri
              </button>
              <button
                onClick={() => setActiveTab('notifications')}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg ${
                  activeTab === 'notifications'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Bell className="h-5 w-5" />
                Bildirim Ayarları
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg ${
                  activeTab === 'security'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Shield className="h-5 w-5" />
                Güvenlik
              </button>
              <button
                onClick={() => setActiveTab('help')}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg ${
                  activeTab === 'help'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <HelpCircle className="h-5 w-5" />
                Yardım ve Destek
              </button>
              <hr className="my-4" />
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg"
              >
                <LogOut className="h-5 w-5" />
                Çıkış Yap
              </button>
            </nav>
          </div>

          {/* Sağ İçerik */}
          <div className="flex-1 p-6">
            {success && (
              <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-700">{success}</p>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-6">Profil Bilgileri</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      E-posta Adresi
                    </label>
                    <input
                      type="email"
                      value={email}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      E-posta adresinizi değiştirmek için lütfen destek ekibiyle iletişime geçin.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ad Soyad
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Telefon Numarası
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="+90 555 123 4567"
                    />
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={handleUpdateProfile}
                      disabled={loading}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {loading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'farm' && (
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-6">Çiftlik Bilgileri</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Çiftlik Adı
                    </label>
                    <input
                      type="text"
                      value={farmName}
                      onChange={(e) => setFarmName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Çiftliğinizin adı"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Adres
                    </label>
                    <textarea
                      value={farmAddress}
                      onChange={(e) => setFarmAddress(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Çiftlik adresi"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Çiftlik Büyüklüğü (Dönüm)
                      </label>
                      <input
                        type="number"
                        value={farmSize}
                        onChange={(e) => setFarmSize(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Çiftlik Tipi
                      </label>
                      <select
                        value={farmType}
                        onChange={(e) => setFarmType(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="dairy">Süt Çiftliği</option>
                        <option value="meat">Et Çiftliği</option>
                        <option value="mixed">Karma</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={handleUpdateFarm}
                      disabled={loading}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {loading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-6">Bildirim Ayarları</h2>
                <div className="space-y-6">
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="email-notifications"
                        type="checkbox"
                        checked={emailNotifications}
                        onChange={(e) => setEmailNotifications(e.target.checked)}
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="email-notifications" className="font-medium text-gray-700">
                        E-posta Bildirimleri
                      </label>
                      <p className="text-gray-500">
                        Önemli bildirimler ve güncellemeler için e-posta almak istiyorum.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="health-alerts"
                        type="checkbox"
                        checked={healthAlerts}
                        onChange={(e) => setHealthAlerts(e.target.checked)}
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="health-alerts" className="font-medium text-gray-700">
                        Sağlık Uyarıları
                      </label>
                      <p className="text-gray-500">
                        Hayvan sağlığı kontrolleri ve aşı hatırlatıcıları için bildirim al.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="financial-reports"
                        type="checkbox"
                        checked={financialReports}
                        onChange={(e) => setFinancialReports(e.target.checked)}
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="financial-reports" className="font-medium text-gray-700">
                        Finansal Raporlar
                      </label>
                      <p className="text-gray-500">
                        Haftalık ve aylık finansal raporlar için bildirim al.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="milk-production-alerts"
                        type="checkbox"
                        checked={milkProductionAlerts}
                        onChange={(e) => setMilkProductionAlerts(e.target.checked)}
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="milk-production-alerts" className="font-medium text-gray-700">
                        Süt Üretimi Uyarıları
                      </label>
                      <p className="text-gray-500">
                        Süt üretimindeki önemli değişiklikler için bildirim al.
                      </p>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={handleUpdateNotifications}
                      disabled={loading}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {loading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-6">Güvenlik Ayarları</h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-md font-medium text-gray-900 mb-2">Şifre Değiştir</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Güvenliğiniz için şifrenizi düzenli olarak değiştirmenizi öneririz.
                    </p>
                    <button
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Şifre Değiştir
                    </button>
                  </div>

                  <hr className="my-6" />

                  <div>
                    <h3 className="text-md font-medium text-gray-900 mb-2">İki Faktörlü Doğrulama</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Hesabınızı daha güvenli hale getirmek için iki faktörlü doğrulamayı etkinleştirin.
                    </p>
                    <button
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      İki Faktörlü Doğrulamayı Etkinleştir
                    </button>
                  </div>

                  <hr className="my-6" />

                  <div>
                    <h3 className="text-md font-medium text-red-600 mb-2">Hesabı Sil</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Hesabınızı sildiğinizde, tüm verileriniz kalıcı olarak silinecektir. Bu işlem geri alınamaz.
                    </p>
                    <button
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      Hesabı Sil
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'help' && (
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-6">Yardım ve Destek</h2>
                <div className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-md font-medium text-gray-900 mb-2">Sık Sorulan Sorular</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      En çok sorulan sorular ve cevapları için SSS bölümümüzü ziyaret edin.
                    </p>
                    <button
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      SSS'ye Git
                    </button>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-md font-medium text-gray-900 mb-2">Kullanım Kılavuzu</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Uygulamanın tüm özelliklerini öğrenmek için kullanım kılavuzumuzu inceleyin.
                    </p>
                    <button
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Kılavuzu İndir
                    </button>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-md font-medium text-gray-900 mb-2">Destek Ekibi</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Sorularınız veya sorunlarınız için destek ekibimizle iletişime geçin.
                    </p>
                    <button
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      İletişime Geç
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}