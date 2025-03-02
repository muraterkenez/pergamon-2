import React, { useState, useEffect } from 'react';
import { Calendar, AlertCircle, Bell, CheckCircle, Clock, Download } from 'lucide-react';
import { format, parseISO, differenceInDays, isAfter } from 'date-fns';
import { tr } from 'date-fns/locale';
import { supabase } from '../../lib/supabase';
import * as XLSX from 'xlsx';

interface VaccinationReminder {
  id: string;
  animal_id: string;
  date: string;
  description: string;
  priority: 'normal' | 'high';
  type: 'vaccination' | 'reminder';
  status: 'pending' | 'completed' | 'cancelled';
  animal: {
    tag_number: string;
    name: string | null;
  };
}

export function VaccinationReminders() {
  const [reminders, setReminders] = useState<VaccinationReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'today' | 'overdue'>('all');
  const [showCompleted, setShowCompleted] = useState(false);

  useEffect(() => {
    fetchReminders();
  }, []);

  const fetchReminders = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('health_records')
        .select(`
          *,
          animal:animals (
            tag_number,
            name
          )
        `)
        .in('type', ['vaccination', 'reminder'])
        .order('date', { ascending: true });

      if (fetchError) throw fetchError;

      setReminders(data as VaccinationReminder[]);
    } catch (err) {
      console.error('Error fetching reminders:', err);
      setError('Hatırlatıcılar yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (reminderId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('health_records')
        .update({ status: 'completed' })
        .eq('id', reminderId);

      if (updateError) throw updateError;

      fetchReminders();
    } catch (err) {
      console.error('Error completing reminder:', err);
    }
  };

  const exportToExcel = () => {
    const data = filteredReminders.map(reminder => ({
      'Küpe No': reminder.animal.tag_number,
      'Hayvan Adı': reminder.animal.name || '-',
      'Tarih': format(parseISO(reminder.date), 'd MMMM yyyy', { locale: tr }),
      'Tip': reminder.type === 'vaccination' ? 'Aşı' : 'Hatırlatıcı',
      'Açıklama': reminder.description,
      'Öncelik': reminder.priority === 'high' ? 'Yüksek' : 'Normal',
      'Durum': reminder.status === 'completed' ? 'Tamamlandı' : 
               reminder.status === 'cancelled' ? 'İptal Edildi' : 'Bekliyor'
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Hatırlatıcılar');
    XLSX.writeFile(wb, `hatirlaticilar_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const filteredReminders = reminders
    .filter(reminder => {
      if (!showCompleted && reminder.status === 'completed') return false;
      
      const reminderDate = new Date(reminder.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      switch (filter) {
        case 'pending':
          return isAfter(reminderDate, today) && reminder.status === 'pending';
        case 'today':
          return format(reminderDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
        case 'overdue':
          return isAfter(today, reminderDate) && reminder.status === 'pending';
        default:
          return true;
      }
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (reminder: VaccinationReminder) => {
    if (reminder.status === 'completed') return 'text-green-600 bg-green-50';
    if (reminder.status === 'cancelled') return 'text-gray-600 bg-gray-50';
    
    const days = differenceInDays(new Date(reminder.date), new Date());
    if (days < 0) return 'text-red-600 bg-red-50';
    if (days <= 7) return 'text-yellow-600 bg-yellow-50';
    return 'text-blue-600 bg-blue-50';
  };

  const getStatusIcon = (reminder: VaccinationReminder) => {
    if (reminder.status === 'completed') return <CheckCircle className="h-5 w-5" />;
    if (reminder.type === 'reminder') return <Bell className="h-5 w-5" />;
    return <Calendar className="h-5 w-5" />;
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Aşı Hatırlatıcıları</h2>
          <div className="flex items-center gap-4">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as typeof filter)}
              className="rounded-md border-gray-300"
            >
              <option value="all">Tümü</option>
              <option value="pending">Bekleyen</option>
              <option value="today">Bugün</option>
              <option value="overdue">Gecikmiş</option>
            </select>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showCompleted}
                onChange={(e) => setShowCompleted(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600">Tamamlananları Göster</span>
            </label>
            <button
              onClick={exportToExcel}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
            >
              <Download className="h-4 w-4" />
              Excel'e Aktar
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {filteredReminders.map(reminder => {
            const daysUntil = differenceInDays(new Date(reminder.date), new Date());
            const statusColor = getStatusColor(reminder);

            return (
              <div
                key={reminder.id}
                className={`flex items-start gap-4 p-4 rounded-lg border ${
                  reminder.status === 'completed' ? 'bg-gray-50' : ''
                }`}
              >
                <div className={`p-2 rounded-lg ${statusColor}`}>
                  {getStatusIcon(reminder)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-gray-900">
                      {reminder.animal.tag_number}
                      {reminder.animal.name && ` (${reminder.animal.name})`}
                    </h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColor}`}>
                      {reminder.status === 'completed'
                        ? 'Tamamlandı'
                        : reminder.status === 'cancelled'
                        ? 'İptal Edildi'
                        : daysUntil < 0
                        ? `${Math.abs(daysUntil)} gün gecikmiş`
                        : daysUntil === 0
                        ? 'Bugün'
                        : `${daysUntil} gün kaldı`}
                    </span>
                    {reminder.priority === 'high' && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                        Yüksek Öncelik
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {reminder.description}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-gray-500">
                      {format(parseISO(reminder.date), 'd MMMM yyyy', { locale: tr })}
                    </p>
                    {reminder.status === 'pending' && (
                      <button
                        onClick={() => handleComplete(reminder.id)}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        Tamamlandı olarak işaretle
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredReminders.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Seçili kriterlere uygun hatırlatıcı bulunmuyor
            </div>
          )}
        </div>
      </div>
    </div>
  );
}