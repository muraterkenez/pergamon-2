import React from 'react';
import { X, AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { supabase } from '../../lib/supabase';
import { MilkProductionWithAnimal } from '../../lib/types';

interface EditMilkProductionFormData {
  date: string;
  amount: number;
  quality_score?: number;
  notes?: string;
}

interface EditMilkProductionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  production: MilkProductionWithAnimal;
}

export function EditMilkProductionModal({ isOpen, onClose, onSuccess, production }: EditMilkProductionModalProps) {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<EditMilkProductionFormData>({
    defaultValues: {
      date: production.date,
      amount: production.amount,
      quality_score: production.quality_score || undefined,
      notes: production.notes || undefined,
    }
  });
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const onSubmit = async (data: EditMilkProductionFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      const { error: supabaseError } = await supabase
        .from('milk_productions')
        .update({
          date: data.date,
          amount: data.amount,
          quality_score: data.quality_score || null,
          notes: data.notes || null,
        })
        .eq('id', production.id);

      if (supabaseError) throw supabaseError;

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error updating milk production:', err);
      setError('Süt üretimi kaydı güncellenirken bir hata oluştu. Lütfen tekrar deneyin.');
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
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Süt Üretimi Düzenle</h2>
              <p className="text-sm text-gray-500 mt-1">
                {production.animals?.tag_number} {production.animals?.name && `(${production.animals.name})`}
              </p>
            </div>
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
              <input
                type="date"
                {...register('date', { required: 'Tarih zorunludur' })}
                max={new Date().toISOString().split('T')[0]}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
              />
              {errors.date && (
                <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Miktar (Litre) <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  type="number"
                  step="0.1"
                  {...register('amount', {
                    required: 'Miktar zorunludur',
                    min: { value: 0.1, message: 'Miktar 0\'dan büyük olmalıdır' },
                    max: { value: 100, message: 'Miktar 100 litreden fazla olamaz' }
                  })}
                  className="block w-full rounded-md border-gray-300 pl-3 pr-12 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                  placeholder="0.0"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">L</span>
                </div>
              </div>
              {errors.amount && (
                <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kalite Puanı
              </label>
              <select
                {...register('quality_score', {
                  valueAsNumber: true,
                  validate: value => !value || (value >= 1 && value <= 10) || 'Kalite puanı 1-10 arasında olmalıdır'
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
              >
                <option value="">Seçiniz</option>
                {[...Array(10)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1}</option>
                ))}
              </select>
              {errors.quality_score && (
                <p className="mt-1 text-sm text-red-600">{errors.quality_score.message}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                1-10 arası, süt kalitesini belirtir (opsiyonel)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notlar
              </label>
              <textarea
                {...register('notes')}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                placeholder="Ek bilgiler, özel durumlar..."
              />
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