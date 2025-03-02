import React, { useState } from 'react';
import { Plus, Search, Filter, Calendar, Activity, AlertCircle, Download, Bell } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { AddHealthRecordModal } from '../components/modals/AddHealthRecordModal';
import { VaccinationPlan } from '../components/health/VaccinationPlan';
import { VaccinationReminders } from '../components/health/VaccinationReminders';

interface HealthRecord {
  id: string;
  date: string;
  type: string;
  description: string;
  treatment: string | null;
  cost: number | null;
  next_check_date: string | null;
  animals: {
    tag_number: string;
    name: string | null;
  } | null;
}

export function Health() {
  const { user } = useAuth();
  const [records, setRecords] = React.useState<HealthRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'examination' | 'vaccination' | 'treatment'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'type' | 'cost'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'records' | 'plan' | 'reminders'>('records');

  React.useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('health_records')
        .select(`
          *,
          animals (
            tag_number,
            name
          )
        `)
        .order('date', { ascending: false });

      if (fetchError) throw fetchError;

      setRecords(data as HealthRecord[]);
    } catch (err) {
      console.error('Error fetching health records:', err);
      setError(err instanceof Error ? err : new Error('Veriler yüklenirken bir hata oluştu'));
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = records
    .filter(record => {
      const searchMatch = record.animals?.tag_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.animals?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.description.toLowerCase().includes(searchTerm.toLowerCase());

      const typeMatch = typeFilter === 'all' || record.type === typeFilter;

      let dateMatch = true;
      const recordDate = new Date(record.date);
      const today = new Date();
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      switch (dateFilter) {
        case 'today':
          dateMatch = format(recordDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
          break;
        case 'week':
          dateMatch = recordDate >= weekAgo;
          break;
        case 'month':
          dateMatch = recordDate >= monthAgo;
          break;
      }

      return searchMatch && typeMatch && dateMatch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return sortOrder === 'asc'
            ? new Date(a.date).getTime() - new Date(b.date).getTime()
            : new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'type':
          return sortOrder === 'asc'
            ? a.type.localeCompare(b.type)
            : b.type.localeCompare(a.type);
        case 'cost':
          const costA = a.cost || 0;
          const costB = b.cost || 0;
          return sortOrder === 'asc'
            ? costA - costB
            : costB - costA;
        default:
          return 0;
      }
    });

  const totalCost = filteredRecords.reduce((sum, record) => sum + (record.cost || 0), 0);
  const recordsByType = {
    examination: filteredRecords.filter(r => r.type === 'examination').length,
    vaccination: filteredRecords.filter(r => r.type === 'vaccination').length,
    treatment: filteredRecords.filter(r => r.type === 'treatment').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Veri yüklenirken bir hata oluştu</h3>
        <p className="text-gray-600 mt-2">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Üst Başlık */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sağlık Kayıtları</h1>
          <p className="text-gray-600">Toplam {filteredRecords.length} kayıt listeleniyor</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Yeni Kayıt
        </button>
      </div>

      {/* İstatistikler */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500">Toplam Maliyet</h3>
            <Activity className="h-5 w-5 text-blue-500" />
          </div>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            ₺{totalCost.toFixed(2)}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Seçili dönem için toplam maliyet
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500">Kontroller</h3>
            <Calendar className="h-5 w-5 text-green-500" />
          </div>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {recordsByType.examination}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Rutin kontrol sayısı
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500">Aşılamalar</h3>
            <Activity className="h-5 w-5 text-yellow-500" />
          </div>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {recordsByType.vaccination}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Aşılama sayısı
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500">Tedaviler</h3>
            <Activity className="h-5 w-5 text-red-500" />
          </div>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {recordsByType.treatment}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Tedavi sayısı
          </p>
        </div>
      </div>

      {/* Sekmeler */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('records')}
              className={`py-4 px-6 inline-flex items-center gap-2 border-b-2 font-medium text-sm ${
                activeTab === 'records'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Activity className="h-5 w-5" />
              Kayıtlar
            </button>
            <button
              onClick={() => setActiveTab('plan')}
              className={`py-4 px-6 inline-flex items-center gap-2 border-b-2 font-medium text-sm ${
                activeTab === 'plan'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Calendar className="h-5 w-5" />
              Aşı Planı
            </button>
            <button
              onClick={() => setActiveTab('reminders')}
              className={`py-4 px-6 inline-flex items-center gap-2 border-b-2 font-medium text-sm ${
                activeTab === 'reminders'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Bell className="h-5 w-5" />
              Hatırlatıcılar
            </button>
          </nav>
        </div>

        {activeTab === 'records' && (
          <div>
            {/* Filtreler */}
            <div className="p-4 border-b">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Hayvan ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                  >
                    <option value="all">Tüm İşlemler</option>
                    <option value="examination">Kontroller</option>
                    <option value="vaccination">Aşılamalar</option>
                    <option value="treatment">Tedaviler</option>
                  </select>
                </div>

                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value as typeof dateFilter)}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                  >
                    <option value="all">Tüm Tarihler</option>
                    <option value="today">Bugün</option>
                    <option value="week">Son 7 Gün</option>
                    <option value="month">Son 30 Gün</option>
                  </select>
                </div>

                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <select
                    value={`${sortBy}-${sortOrder}`}
                    onChange={(e) => {
                      const [newSortBy, newSortOrder] = e.target.value.split('-');
                      setSortBy(newSortBy as typeof sortBy);
                      setSortOrder(newSortOrder as typeof sortOrder);
                    }}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                  >
                    <option value="date-desc">Tarih (Yeni-Eski)</option>
                    <option value="date-asc">Tarih (Eski-Yeni)</option>
                    <option value="type-asc">İşlem Türü (A-Z)</option>
                    <option value="type-desc">İşlem Türü (Z-A)</option>
                    <option value="cost-desc">Maliyet (Yüksek-Düşük)</option>
                    <option value="cost-asc">Maliyet (Düşük-Yüksek)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Tablo */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tarih
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hayvan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İşlem Türü
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Açıklama
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tedavi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Maliyet
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sonraki Kontrol
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {format(parseISO(record.date), 'd MMMM yyyy', { locale: tr })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {record.animals?.tag_number}
                        </div>
                        {record.animals?.name && (
                          <div className="text-sm text-gray-500">
                            {record.animals.name}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${record.type === 'examination' ? 'bg-blue-100 text-blue-800' :
                            record.type === 'vaccination' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'}`}>
                          {record.type === 'examination' ? 'Kontrol' :
                            record.type === 'vaccination' ? 'Aşılama' : 'Tedavi'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {record.description}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {record.treatment || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {record.cost ? `₺${record.cost.toFixed(2)}` : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {record.next_check_date
                            ? format(parseISO(record.next_check_date), 'd MMMM yyyy', { locale: tr })
                            : '-'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'plan' && <VaccinationPlan />}
        {activeTab === 'reminders' && <VaccinationReminders />}
      </div>

      {/* Modal */}
      <AddHealthRecordModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchRecords}
      />
    </div>
  );
}

export default Health