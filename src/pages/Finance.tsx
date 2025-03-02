import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Calendar, DollarSign, Edit, Trash2, AlertCircle, Download, BarChart2 } from 'lucide-react';
import { format, parseISO, subMonths } from 'date-fns';
import { tr } from 'date-fns/locale';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { AddExpenseModal } from '../components/modals/AddExpenseModal';
import { EditExpenseModal } from '../components/modals/EditExpenseModal';
import { DeleteExpenseModal } from '../components/modals/DeleteExpenseModal';
import { AddBudgetModal } from '../components/modals/AddBudgetModal';

interface Expense {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
}

interface Budget {
  id: string;
  month: string;
  category: string;
  amount: number;
}

export function Finance() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'feed' | 'medicine' | 'equipment' | 'other'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month' | 'year'>('month');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'category'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [isEditExpenseModalOpen, setIsEditExpenseModalOpen] = useState(false);
  const [isDeleteExpenseModalOpen, setIsDeleteExpenseModalOpen] = useState(false);
  const [isAddBudgetModalOpen, setIsAddBudgetModalOpen] = useState(false);
  const [view, setView] = useState<'expenses' | 'budgets' | 'reports'>('expenses');
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  // Finansal veriler
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [profit, setProfit] = useState(0);
  const [expensesByCategory, setExpensesByCategory] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('*')
        .order('date', { ascending: false });

      if (expensesError) throw expensesError;

      const { data: budgetsData, error: budgetsError } = await supabase
        .from('budgets')
        .select('*')
        .order('month', { ascending: false });

      if (budgetsError) throw budgetsError;

      setExpenses(expensesData || []);
      setBudgets(budgetsData || []);

      // Finansal özet hesaplamaları
      const totalExp = (expensesData || []).reduce((sum, expense) => sum + expense.amount, 0);
      // Gelir verisi olmadığı için şimdilik sabit bir değer kullanıyoruz
      const totalInc = totalExp * 1.2; // Örnek olarak giderlerin %20 fazlası
      const prof = totalInc - totalExp;

      // Kategori bazlı giderler
      const expByCat = (expensesData || []).reduce((acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
        return acc;
      }, {} as Record<string, number>);

      setTotalExpenses(totalExp);
      setTotalIncome(totalInc);
      setProfit(prof);
      setExpensesByCategory(expByCat);
    } catch (err) {
      console.error('Error fetching financial data:', err);
      setError('Veriler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsEditExpenseModalOpen(true);
  };

  const handleDeleteClick = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsDeleteExpenseModalOpen(true);
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      fetchFinancialData();
    } catch (err) {
      console.error('Error deleting expense:', err);
      setError('Gider silinirken bir hata oluştu');
    }
  };

  const handleAddBudget = async (data: { month: string; category: string; amount: number }) => {
    try {
      const { error: insertError } = await supabase
        .from('budgets')
        .insert([
          {
            month: data.month,
            category: data.category,
            amount: data.amount,
            user_id: user?.id
          }
        ]);

      if (insertError) throw insertError;

      fetchFinancialData();
    } catch (err) {
      console.error('Error adding budget:', err);
      setError('Bütçe eklenirken bir hata oluştu');
    }
  };

  const filteredExpenses = expenses
    .filter(expense => {
      const searchMatch = expense.description.toLowerCase().includes(searchTerm.toLowerCase());
      const categoryMatch = categoryFilter === 'all' || expense.category === categoryFilter;

      let dateMatch = true;
      const expenseDate = new Date(expense.date);
      const today = new Date();
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      const yearAgo = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);

      switch (dateFilter) {
        case 'today':
          dateMatch = format(expenseDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
          break;
        case 'week':
          dateMatch = expenseDate >= weekAgo;
          break;
        case 'month':
          dateMatch = expenseDate >= monthAgo;
          break;
        case 'year':
          dateMatch = expenseDate >= yearAgo;
          break;
      }

      return searchMatch && categoryMatch && dateMatch;
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
        case 'category':
          return sortOrder === 'asc'
            ? a.category.localeCompare(b.category)
            : b.category.localeCompare(a.category);
        default:
          return 0;
      }
    });

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'feed': return 'Yem';
      case 'medicine': return 'İlaç';
      case 'equipment': return 'Ekipman';
      case 'other': return 'Diğer';
      default: return category;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'feed': return 'bg-yellow-100 text-yellow-800';
      case 'medicine': return 'bg-blue-100 text-blue-800';
      case 'equipment': return 'bg-purple-100 text-purple-800';
      case 'other': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMonthlyData = (date: Date) => {
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    const monthExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= monthStart && expenseDate <= monthEnd;
    });

    const totalMonthExpenses = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const totalMonthIncome = totalMonthExpenses * 1.2; // Örnek olarak
    const monthProfit = totalMonthIncome - totalMonthExpenses;

    const monthExpensesByCategory = monthExpenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalExpenses: totalMonthExpenses,
      totalIncome: totalMonthIncome,
      profit: monthProfit,
      expensesByCategory: monthExpensesByCategory
    };
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
        <p className="text-gray-600 mt-2">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Üst Başlık */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finans Yönetimi</h1>
          <p className="text-gray-600">Finansal durumunuzu takip edin</p>
        </div>
        <div className="flex gap-3">
          {view === 'expenses' && (
            <button
              onClick={() => setIsAddExpenseModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Yeni Gider Ekle
            </button>
          )}
          {view === 'budgets' && (
            <button
              onClick={() => setIsAddBudgetModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Yeni Bütçe Ekle
            </button>
          )}
        </div>
      </div>

      {/* İstatistikler */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500">Toplam Gelir</h3>
            <DollarSign className="h-5 w-5 text-green-500" />
          </div>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            ₺{totalIncome.toFixed(2)}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Son 30 gün
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500">Toplam Gider</h3>
            <DollarSign className="h-5 w-5 text-red-500" />
          </div>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            ₺{totalExpenses.toFixed(2)}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Son 30 gün
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500">Net Kar/Zarar</h3>
            <DollarSign className="h-5 w-5 text-blue-500" />
          </div>
          <p className={`mt-2 text-3xl font-semibold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ₺{profit.toFixed(2)}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Son 30 gün
          </p>
        </div>
      </div>

      {/* Görünüm Seçenekleri */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b">
          <nav className="flex -mb-px">
            <button
              onClick={() => setView('expenses')}
              className={`py-4 px-6 inline-flex items-center gap-2 border-b-2 font-medium text-sm ${
                view === 'expenses'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <DollarSign className="h-5 w-5" />
              Giderler
            </button>
            <button
              onClick={() => setView('budgets')}
              className={`py-4 px-6 inline-flex items-center gap-2 border-b-2 font-medium text-sm ${
                view === 'budgets'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Calendar className="h-5 w-5" />
              Bütçe Planlama
            </button>
            <button
              onClick={() => setView('reports')}
              className={`py-4 px-6 inline-flex items-center gap-2 border-b-2 font-medium text-sm ${
                view === 'reports'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BarChart2 className="h-5 w-5" />
              Raporlar
            </button>
          </nav>
        </div>

        {view === 'expenses' && (
          <div>
            {/* Filtreler */}
            <div className="p-4 border-b">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Açıklama ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value as typeof categoryFilter)}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                  >
                    <option value="all">Tüm Kategoriler</option>
                    <option value="feed">Yem</option>
                    <option value="medicine">İlaç</option>
                    <option value="equipment">Ekipman</option>
                    <option value="other">Diğer</option>
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
                    <option value="year">Son 1 Yıl</option>
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
                    <option value="amount-desc">Tutar (Yüksek-Düşük)</option>
                    <option value="amount-asc">Tutar (Düşük-Yüksek)</option>
                    <option value="category-asc">Kategori (A-Z)</option>
                    <option value="category-desc">Kategori (Z-A)</option>
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
                      Kategori
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Açıklama
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tutar
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredExpenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {format(parseISO(expense.date), 'd MMMM yyyy', { locale: tr })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(expense.category)}`}>
                          {getCategoryName(expense.category)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {expense.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          ₺{expense.amount.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            className="text-yellow-600 hover:text-yellow-900"
                            title="Düzenle"
                            onClick={() => handleEditClick(expense)}
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          <button
                            className="text-red-600 hover:text-red-900"
                            title="Sil"
                            onClick={() => handleDeleteClick(expense)}
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredExpenses.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                        Seçili kriterlere uygun gider bulunamadı
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {view === 'budgets' && (
          <div>
            <div className="p-6 border-b">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Aylık Bütçe Planlaması</h2>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setSelectedMonth(subMonths(selectedMonth, 1))}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <Calendar className="h-5 w-5 text-gray-500" />
                  </button>
                  <span className="text-lg font-medium">
                    {format(selectedMonth, 'MMMM yyyy', { locale: tr })}
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ay
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Kategori
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Bütçe
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Kullanım
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {budgets.map(budget => {
                      const monthDate = new Date(`${budget.month}-01`);
                      const monthData = getMonthlyData(monthDate);
                      const expense = monthData.expensesByCategory[budget.category] || 0;
                      const usage = budget.amount > 0 ? (expense / budget.amount) * 100 : 0;
                      
                      return (
                        <tr key={budget.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {format(new Date(`${budget.month}-01`), 'MMMM yyyy', { locale: tr })}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(budget.category)}`}>
                              {getCategoryName(budget.category)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              ₺{budget.amount.toFixed(2)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                                <div 
                                  className={`h-2 rounded-full ${usage <= 85 ? 'bg-green-600' : usage <= 100 ? 'bg-yellow-500' : 'bg-red-600'}`}
                                  style={{ width: `${Math.min(usage, 100)}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-500">
                                {usage.toFixed(0)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {budgets.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                          Henüz bütçe tanımı yapılmamış
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {view === 'reports' && (
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Nakit Akışı */}
              <div className="bg-white rounded-lg border p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Nakit Akışı</h3>
                <div className="space-y-4">
                  {[0, 1, 2, 3, 4, 5].map((monthsAgo) => {
                    const date = subMonths(new Date(), monthsAgo);
                    const monthData = getMonthlyData(date);
                    
                    return (
                      <div key={monthsAgo} className="border-b pb-4 last:border-0 last:pb-0">
                        <h4 className="font-medium text-gray-900">
                          {format(date, 'MMMM yyyy', { locale: tr })}
                        </h4>
                        <div className="grid grid-cols-3 gap-4 mt-2">
                          <div>
                            <p className="text-xs text-gray-500">Gelir</p>
                            <p className="text-sm font-medium text-green-600">₺{monthData.totalIncome.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Gider</p>
                            <p className="text-sm font-medium text-red-600">₺{monthData.totalExpenses.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Kar/Zarar</p>
                            <p className={`text-sm font-medium ${monthData.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              ₺{monthData.profit.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Maliyet Analizi */}
              <div className="bg-white rounded-lg border p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Maliyet Analizi</h3>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Kategori Bazlı Gider Dağılımı</h4>
                    <div className="space-y-2">
                      {Object.entries(expensesByCategory).map(([category, amount]) => {
                        const percentage = (amount / totalExpenses) * 100;
                        return (
                          <div key={category}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm text-gray-600">{getCategoryName(category)}</span>
                              <span className="text-sm font-medium text-gray-900">₺{amount.toFixed(2)} ({percentage.toFixed(1)}%)</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  category === 'feed' ? 'bg-yellow-500' :
                                  category === 'medicine' ? 'bg-blue-500' :
                                  category === 'equipment' ? 'bg-purple-500' :
                                  'bg-gray-500'
                                }`}
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Birim Maliyet Analizi</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-xs text-gray-500">Litre Süt Başına Maliyet</p>
                        <p className="text-lg font-medium text-gray-900">
                          ₺{totalIncome > 0 ? (totalExpenses / (totalIncome / 5)).toFixed(2) : '0.00'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Toplam gider / Toplam süt üretimi
                        </p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-xs text-gray-500">Kar Marjı</p>
                        <p className={`text-lg font-medium ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          %{totalIncome > 0 ? ((profit / totalIncome) * 100).toFixed(1) : '0.0'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Net kar / Toplam gelir
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trend Analizi */}
              <div className="bg-white rounded-lg border p-6 lg:col-span-2">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Trend Analizi</h3>
                <div className="h-64 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <BarChart2 className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                    <p>Grafik görünümü için Recharts kütüphanesi gereklidir.</p>
                    <p className="text-sm">Gelir ve gider trendleri burada görselleştirilecektir.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modallar */}
      <AddExpenseModal
        isOpen={isAddExpenseModalOpen}
        onClose={() => setIsAddExpenseModalOpen(false)}
        onSuccess={fetchFinancialData}
      />

      {selectedExpense && (
        <>
          <EditExpenseModal
            isOpen={isEditExpenseModalOpen}
            onClose={() => {
              setIsEditExpenseModalOpen(false);
              setSelectedExpense(null);
            }}
            onSuccess={fetchFinancialData}
            expense={selectedExpense}
          />
          <DeleteExpenseModal
            isOpen={isDeleteExpenseModalOpen}
            onClose={() => {
              setIsDeleteExpenseModalOpen(false);
              setSelectedExpense(null);
            }}
            onDelete={handleDeleteExpense}
            expense={selectedExpense}
          />
        </>
      )}

      <AddBudgetModal
        isOpen={isAddBudgetModalOpen}
        onClose={() => setIsAddBudgetModalOpen(false)}
        onSuccess={handleAddBudget}
        selectedMonth={format(selectedMonth, 'yyyy-MM')}
      />
    </div>
  );
}