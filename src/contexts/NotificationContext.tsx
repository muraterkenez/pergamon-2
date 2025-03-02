import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface NotificationSettings {
  emailEnabled: boolean;
  healthAlerts: boolean;
  financialReports: boolean;
  milkProductionAlerts: boolean;
}

interface NotificationContextType {
  settings: NotificationSettings;
  loading: boolean;
  error: string | null;
  updateSettings: (newSettings: Partial<NotificationSettings>) => Promise<void>;
}

const defaultSettings: NotificationSettings = {
  emailEnabled: true,
  healthAlerts: true,
  financialReports: true,
  milkProductionAlerts: true
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notificationId, setNotificationId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchNotificationSettings();
    }
  }, [user]);

  const fetchNotificationSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (data) {
        setNotificationId(data.id);
        setSettings({
          emailEnabled: data.email_enabled,
          healthAlerts: data.health_alerts,
          financialReports: data.financial_reports,
          milkProductionAlerts: data.milk_production_alerts
        });
      }
    } catch (err) {
      console.error('Error fetching notification settings:', err);
      setError('Bildirim ayarları yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
    try {
      setLoading(true);
      setError(null);

      const updatedSettings = { ...settings, ...newSettings };
      
      const notificationData = {
        user_id: user?.id,
        email_enabled: updatedSettings.emailEnabled,
        health_alerts: updatedSettings.healthAlerts,
        financial_reports: updatedSettings.financialReports,
        milk_production_alerts: updatedSettings.milkProductionAlerts,
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

      setSettings(updatedSettings);
    } catch (err) {
      console.error('Error updating notification settings:', err);
      setError('Bildirim ayarları güncellenirken bir hata oluştu');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <NotificationContext.Provider value={{ settings, loading, error, updateSettings }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}