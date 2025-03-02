import React, { useState } from 'react';
import { X, AlertCircle, Calendar, DollarSign } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { supabase } from '../../lib/supabase';

interface Expense {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
}

interface EditExpenseFormData {
  date: string;
  category: string;
  description: string;
  amount: number;
}

interface EditExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  expense: Expense;
}

export function EditExpenseModal({ isOpen, onClose, onSuccess, expense }: EditExpenseModalProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<EditExpenseFormData>({
    defaultValues: {
      date: expense.date,
      category: expense.category,
      description: expense.description,
      amount: expense.amount
    }
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (data: EditExpenseFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      const { error: supabaseError } = await supabase
        .from('expenses')
        .update({
          date: data.date,
          category: data.category,
          description: data.description,
          amount: parseFloat(data.amount.toString())
        })
        .eq('id', expense.id);

      if (supabaseError) throw supabaseError;

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error updating expense:', err);
      setError('Gider güncellenirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="border-b p-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Gider Düzenle</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tarih <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="date"
                  {...register('date', { required: 'Tarih zorunludur' })}
                  max={new Date().toISOString().split('T')[0]}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {errors.date && (
                <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kategori <span className="text-red-500">*</span>
              </label>
              <select
                {...register('category', { required: 'Kategori zorunludur' })}
                className="w-full border border-gray-300 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="feed">Yem</option>
                <option value="medicine">İlaç</option>
                <option value="equipment">Ekipman</option>
                <option value="other">Diğer</option>
              </select>
              {errors.category && (
                <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Açıklama <span className="text-red-500">*</span>
              </label>
              <textarea
                {...register('description', { 
                  required: 'Açıklama zorunludur',
                  minLength: { value: 3, message: 'Açıklama en az 3 karakter olmalıdır' }
                })}
                rows={3}
                className="w-full border border-gray-300 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Gider açıklaması..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tutar (₺) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  step="0.01"
                  {...register('amount', {
                    required: 'Tutar zorunludur',
                    min: { value: 0.01, message: 'Tutar 0\'dan büyük olmalıdır' },
                    valueAsNumber: true
                  })}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              {errors.amount && (
                <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
              )}
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={isSubmitting}
            >
              İptal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}