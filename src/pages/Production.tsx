import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Calendar, Factory, Milk, Trash2, Edit, Eye, AlertCircle, Download, BarChart2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { AddProcessingBatchModal } from '../components/production/AddProcessingBatchModal';

interface ProcessingBatch {
  id: string;
  date: string;
  process_type: 'cream_separation' | 'direct_cheese';
  input_amount: number;
  cream_amount?: number;
  skimmed_milk_amount?: number;
  cheese_amount?: number;
  quality_score?: number;
  notes?: string;
  inputs: {
    id: string;
    amount: number;
    milk_production: {
      id: string;
      date: string;
      animal: {
        tag_number: string;
        name: string | null;
      } | null;
    };
  }[];
}

export function Production() {
  const { user } = useAuth();
  const [batches, setBatches] = useState<ProcessingBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [processTypeFilter, setProcessTypeFilter] = useState<'all' | 'cream_separation' | 'direct_cheese'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'quality'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('milk_processing_batches')
        .select(`
          *,
          inputs:milk_processing_inputs (
            id,
            amount,
            milk_production:milk_productions (
              id,
              date,
              animal:animals (
                tag_number,
                name
              )
            )
          )
        `)
        .order('date', { ascending: false });

      if (fetchError) throw fetchError;
      setBatches(data || []);
    } catch (err) {
      console.error('Error fetching batches:', err);
      setError('İşlem partileri yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const totalMilkProcessed = batches.reduce((sum, batch) => sum + batch.input_amount, 0);
  const totalCream = batches.reduce((sum, batch) => sum + (batch.cream_amount || 0), 0);
  const totalCheese = batches.reduce((sum, batch) => sum + (batch.cheese_amount || 0), 0);

  const filteredBatches = batches
    .filter(batch => {
      const searchMatch = batch.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        batch.inputs.some(input => 
          input.milk_production.animal?.tag_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          input.milk_production.animal?.name?.toLowerCase().includes(searchTerm.toLowerCase())
        );

      const typeMatch = processTypeFilter === 'all' || batch.process_type === processTypeFilter;

      let dateMatch = true;
      const batchDate = new Date(batch.date);
      const today = new Date();
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      switch (dateFilter) {
        case 'today':
          dateMatch = format(batchDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
          break;
        case 'week':
          dateMatch = batchDate >= weekAgo;
          break;
        case 'month':
          dateMatch = batchDate >= monthAgo;
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
        case 'amount':
          return sortOrder === 'asc'
            ? a.input_amount - b.input_amount
            : b.input_amount - a.input_amount;
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
        <p className="text-gray-600 mt-2">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Üst Başlık */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Süt İşleme</h1>
          <p className="text-gray-600">Toplam {filteredBatches.length} işlem partisi listeleniyor</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Yeni İşlem Partisi
        </button>
      </div>

      {/* İstatistikler */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500">İşlenen Süt</h3>
            <Milk className="h-5 w-5 text-blue-500" />
          </div>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {totalMilkProcessed.toFixed(1)} L
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Toplam işlenen süt miktarı
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500">Krema</h3>
            <Factory className="h-5 w-5 text-yellow-500" />
          </div>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {totalCream.toFixed(1)} L
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Toplam krema üretimi
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500">Peynir</h3>
            <Factory className="h-5 w-5 text-green-500" />
          </div>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {totalCheese.toFixed(1)} kg
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Toplam peynir üretimi
          </p>
        </div>
      </div>

      {/* Filtreler */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Arama..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={processTypeFilter}
              onChange={(e) => setProcessTypeFilter(e.target.value as typeof processTypeFilter)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="all">Tüm İşlemler</option>
              <option value="cream_separation">Krema Çekme</option>
              <option value="direct_cheese">Direkt Peynir</option>
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
              <option value="amount-desc">Miktar (Çok-Az)</option>
              <option value="amount-asc">Miktar (Az-Çok)</option>
              <option value="quality-desc">Kalite (Yüksek-Düşük)</option>
              <option value="quality-asc">Kalite (Düşük-Yüksek)</option>
            </select>
          </div>
        </div>
      </div>

      {/* İşlem Partileri Listesi */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tarih
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlem Tipi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Giriş Miktarı
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Krema
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Yağsız Süt
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Peynir
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kalite
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notlar
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBatches.map((batch) => (
                <tr key={batch.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {format(parseISO(batch.date), 'd MMMM yyyy', { locale: tr })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${batch.process_type === 'cream_separation' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                      {batch.process_type === 'cream_separation' ? 'Krema Çekme' : 'Direkt Peynir'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {batch.input_amount.toFixed(1)} L
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {batch.cream_amount ? `${batch.cream_amount.toFixed(1)} L` : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {batch.skimmed_milk_amount ? `${batch.skimmed_milk_amount.toFixed(1)} L` : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {batch.cheese_amount ? `${batch.cheese_amount.toFixed(1)} kg` : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {batch.quality_score ? (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${batch.quality_score >= 8 ? 'bg-green-100 text-green-800' :
                          batch.quality_score >= 6 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'}`}>
                        {batch.quality_score}/10
                      </span>
                    ) : (
                      <span className="text-sm text-gray-500">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {batch.notes || '-'}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredBatches.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-gray-500">
                    Seçili kriterlere uygun işlem partisi bulunamadı
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modallar */}
      <AddProcessingBatchModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchBatches}
      />
    </div>
  );
}