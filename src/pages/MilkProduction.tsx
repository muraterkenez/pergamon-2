import React, { useState } from 'react';
import { Plus, Search, Filter, Calendar, Milk, Edit, Trash2, AlertCircle, Download, BarChart2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { MilkProductionWithAnimal } from '../lib/types';
import { AddMilkProductionModal } from '../components/modals/AddMilkProductionModal';
import { EditMilkProductionModal } from '../components/modals/EditMilkProductionModal';
import { DeleteMilkProductionModal } from '../components/modals/DeleteMilkProductionModal';
import { BulkAddMilkProductionModal } from '../components/modals/BulkAddMilkProductionModal';
import { MilkProductionChart } from '../components/charts/MilkProductionChart';
import { AnimalProductionReport } from '../components/reports/AnimalProductionReport';
import { exportToExcel } from '../utils/export';

export function MilkProduction() {
  const { user } = useAuth();
  const [productions, setProductions] = React.useState<MilkProductionWithAnimal[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'quality'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedProduction, setSelectedProduction] = useState<MilkProductionWithAnimal | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBulkAddModalOpen, setIsBulkAddModalOpen] = useState(false);
  const [view, setView] = useState<'list' | 'chart' | 'report'>('list');

  React.useEffect(() => {
    fetchProductions();
  }, []);

  const fetchProductions = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('milk_productions')
        .select(`
          *,
          animals (
            tag_number,
            name
          )
        `)
        .order('date', { ascending: false });

      if (fetchError) throw fetchError;

      setProductions(data as MilkProductionWithAnimal[]);
    } catch (err) {
      console.error('Error fetching milk productions:', err);
      setError(err instanceof Error ? err : new Error('Veriler yüklenirken bir hata oluştu'));
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (production: MilkProductionWithAnimal) => {
    setSelectedProduction(production);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (production: MilkProductionWithAnimal) => {
    setSelectedProduction(production);
    setIsDeleteModalOpen(true);
  };

  const handleExport = () => {
    exportToExcel(filteredProductions, `sut_uretimi_${format(new Date(), 'yyyy-MM-dd')}`);
  };

  const filteredProductions = productions
    .filter(production => {
      const searchMatch = production.animals?.tag_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        production.animals?.name?.toLowerCase().includes(searchTerm.toLowerCase());

      let dateMatch = true;
      const productionDate = new Date(production.date);
      const today = new Date();
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      switch (dateFilter) {
        case 'today':
          dateMatch = format(productionDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
          break;
        case 'week':
          dateMatch = productionDate >= weekAgo;
          break;
        case 'month':
          dateMatch = productionDate >= monthAgo;
          break;
      }

      return searchMatch && dateMatch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return sortOrder === 'asc'
            ? new Date(a.date).getTime() - new Date(b.date).getTime()
            : new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'amount':
          return sortOrder === 'asc'
            ? a.amount - b.amount
            : b.amount - a.amount;
        case 'quality':
          const qualityA = a.quality_score || 0;
          const qualityB = b.quality_score || 0;
          return sortOrder === 'asc'
            ? qualityA - qualityB
            : qualityB - qualityA;
        default:
          return 0;
      }
    });

  const totalProduction = filteredProductions.reduce((sum, p) => sum + p.amount, 0);
  const averageQuality = filteredProductions
    .filter(p => p.quality_score)
    .reduce((sum, p) => sum + (p.quality_score || 0), 0) / filteredProductions.filter(p => p.quality_score).length || 0;

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
          <h1 className="text-2xl font-bold text-gray-900">Süt Üretimi</h1>
          <p className="text-gray-600">Toplam {filteredProductions.length} kayıt listeleniyor</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="h-5 w-5" />
            Excel'e Aktar
          </button>
          <button
            onClick={() => setIsBulkAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Toplu Kayıt Ekle
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Yeni Kayıt
          </button>
        </div>
      </div>

      {/* İstatistikler */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500">Toplam Üretim</h3>
            <Milk className="h-5 w-5 text-blue-500" />
          </div>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {totalProduction.toFixed(1)} L
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Seçili dönem için toplam üretim
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500">Ortalama Kalite</h3>
            <Calendar className="h-5 w-5 text-green-500" />
          </div>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {averageQuality.toFixed(1)}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            1-10 arası kalite puanı
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500">Günlük Ortalama</h3>
            <Calendar className="h-5 w-5 text-purple-500" />
          </div>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {(totalProduction / (filteredProductions.length || 1)).toFixed(1)} L
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Kayıt başına ortalama üretim
          </p>
        </div>
      </div>

      {/* Görünüm Seçenekleri */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex justify-between items-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
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
                <option value="amount-desc">Miktar (Çok-Az)</option>
                <option value="amount-asc">Miktar (Az-Çok)</option>
                <option value="quality-desc">Kalite (Yüksek-Düşük)</option>
                <option value="quality-asc">Kalite (Düşük-Yüksek)</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2 ml-4">
            <button
              onClick={() => setView('list')}
              className={`p-2 rounded-lg ${view === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-500'}`}
              title="Liste Görünümü"
            >
              <Filter className="h-5 w-5" />
            </button>
            <button
              onClick={() => setView('chart')}
              className={`p-2 rounded-lg ${view === 'chart' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-500'}`}
              title="Grafik Görünümü"
            >
              <BarChart2 className="h-5 w-5" />
            </button>
            <button
              onClick={() => setView('report')}
              className={`p-2 rounded-lg ${view === 'report' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-500'}`}
              title="Hayvan Bazlı Rapor"
            >
              <Calendar className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* İçerik */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {view === 'list' && (
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
                  Miktar
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kalite
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notlar
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProductions.map((production) => (
                <tr key={production.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {format(parseISO(production.date), 'd MMMM yyyy', { locale: tr })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {production.animals?.tag_number}
                    </div>
                    {production.animals?.name && (
                      <div className="text-sm text-gray-500">
                        {production.animals.name}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {production.amount.toFixed(1)} L
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {production.quality_score ? (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${production.quality_score >= 8 ? 'bg-green-100 text-green-800' :
                          production.quality_score >= 6 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'}`}>
                        {production.quality_score}/10
                      </span>
                    ) : (
                      <span className="text-sm text-gray-500">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {production.notes || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        className="text-yellow-600 hover:text-yellow-900"
                        title="Düzenle"
                        onClick={() => handleEditClick(production)}
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        className="text-red-600 hover:text-red-900"
                        title="Sil"
                        onClick={() => handleDeleteClick(production)}
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {view === 'chart' && (
          <div className="p-6">
            <MilkProductionChart data={filteredProductions} />
          </div>
        )}

        {view === 'report' && (
          <div className="p-6">
            <AnimalProductionReport productions={filteredProductions} />
          </div>
        )}
      </div>

      {/* Modallar */}
      <AddMilkProductionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchProductions}
      />

      {selectedProduction && (
        <>
          <EditMilkProductionModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedProduction(null);
            }}
            onSuccess={fetchProductions}
            production={selectedProduction}
          />
          <DeleteMilkProductionModal
            isOpen={isDeleteModalOpen}
            onClose={() => {
              setIsDeleteModalOpen(false);
              setSelectedProduction(null);
            }}
            onSuccess={fetchProductions}
            production={selectedProduction}
          />
        </>
      )}

      <BulkAddMilkProductionModal
        isOpen={isBulkAddModalOpen}
        onClose={() => setIsBulkAddModalOpen(false)}
        onSuccess={fetchProductions}
      />
    </div>
  );
}