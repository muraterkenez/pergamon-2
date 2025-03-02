import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Milk, Filter } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';

interface AddProcessingBatchFormData {
  date: string;
  process_type: 'cream_separation' | 'direct_cheese';
  input_amount: number;
  cream_amount?: number | null;
  skimmed_milk_amount?: number | null;
  cheese_amount?: number | null;
  quality_score?: number | null;
  notes?: string;
  selected_productions: string[];
}

interface MilkProduction {
  id: string;
  date: string;
  amount: number;
  quality_score?: number;
  animal: {
    tag_number: string;
    name: string | null;
  } | null;
}

interface AddProcessingBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddProcessingBatchModal({ isOpen, onClose, onSuccess }: AddProcessingBatchModalProps) {
  const { user } = useAuth();
  const [availableProductions, setAvailableProductions] = useState<MilkProduction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { register, handleSubmit, watch, setValue, formState: { errors }, reset } = useForm<AddProcessingBatchFormData>({
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      process_type: 'cream_separation',
      input_amount: 0,
      selected_productions: []
    }
  });

  const processType = watch('process_type');
  const selectedProductions = watch('selected_productions');

  useEffect(() => {
    if (isOpen) {
      fetchAvailableProductions();
    }
  }, [isOpen]);

  const fetchAvailableProductions = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('milk_productions')
        .select(`
          id,
          date,
          amount,
          quality_score,
          animals (
            tag_number,
            name
          )
        `)
        .eq('processing_status', 'pending')
        .order('date', { ascending: false });

      if (fetchError) throw fetchError;
      setAvailableProductions(data || []);
    } catch (err) {
      console.error('Error fetching available productions:', err);
      setError('Süt üretim kayıtları yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: AddProcessingBatchFormData) => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Convert empty string values to null for optional numeric fields
      const processedData = {
        ...data,
        cream_amount: data.cream_amount || null,
        skimmed_milk_amount: data.skimmed_milk_amount || null,
        cheese_amount: data.cheese_amount || null,
        quality_score: data.quality_score || null
      };

      // Create processing batch
      const { data: batchData, error: batchError } = await supabase
        .from('milk_processing_batches')
        .insert([{
          date: processedData.date,
          process_type: processedData.process_type,
          input_amount: processedData.input_amount,
          cream_amount: processedData.cream_amount,
          skimmed_milk_amount: processedData.skimmed_milk_amount,
          cheese_amount: processedData.cheese_amount,
          quality_score: processedData.quality_score,
          notes: processedData.notes,
          user_id: user.id
        }])
        .select()
        .single();

      if (batchError) throw batchError;

      // Create processing inputs
      const inputs = processedData.selected_productions.map(productionId => ({
        batch_id: batchData.id,
        milk_production_id: productionId,
        amount: availableProductions.find(p => p.id === productionId)?.amount || 0,
        user_id: user.id
      }));

      const { error: inputsError } = await supabase
        .from('milk_processing_inputs')
        .insert(inputs);

      if (inputsError) throw inputsError;

      // Update milk production status
      const { error: updateError } = await supabase
        .from('milk_productions')
        .update({ 
          processing_status: 'processed',
          processing_batch_id: batchData.id
        })
        .in('id', processedData.selected_productions);

      if (updateError) throw updateError;

      reset();
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error adding processing batch:', err);
      setError('İşlem partisi eklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl">
        <div className="border-b p-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Yeni İşlem Partisi</h2>
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
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                İşlem Tarihi <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                {...register('date', { required: 'İşlem tarihi zorunludur' })}
                max={new Date().toISOString().split('T')[0]}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.date && (
                <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                İşlem Tipi <span className="text-red-500">*</span>
              </label>
              <select
                {...register('process_type', { required: 'İşlem tipi zorunludur' })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="cream_separation">Krema Çekme</option>
                <option value="direct_cheese">Direkt Peynir</option>
              </select>
              {errors.process_type && (
                <p className="mt-1 text-sm text-red-600">{errors.process_type.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                İşlenecek Sütler <span className="text-red-500">*</span>
              </label>
              <div className="mt-2 space-y-2 max-h-48 overflow-y-auto border rounded-md p-2">
                {availableProductions.map(production => (
                  <label key={production.id} className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      value={production.id}
                      {...register('selected_productions', {
                        required: 'En az bir süt üretimi seçilmelidir'
                      })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-900">
                      {format(parseISO(production.date), 'd MMMM yyyy', { locale: tr })} - 
                      {production.animal?.tag_number}
                      {production.animal?.name && ` (${production.animal.name})`} - 
                      {production.amount} L
                    </span>
                  </label>
                ))}
              </div>
              {errors.selected_productions && (
                <p className="mt-1 text-sm text-red-600">{errors.selected_productions.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Toplam Süt Miktarı (L) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  {...register('input_amount', {
                    required: 'Süt miktarı zorunludur',
                    min: { value: 0.1, message: 'Miktar 0\'dan büyük olmalıdır' },
                    valueAsNumber: true
                  })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                {errors.input_amount && (
                  <p className="mt-1 text-sm text-red-600">{errors.input_amount.message}</p>
                )}
              </div>

              {processType === 'cream_separation' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Krema Miktarı (L)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      {...register('cream_amount', {
                        min: { value: 0, message: 'Miktar 0\'dan küçük olamaz' },
                        valueAsNumber: true,
                        setValueAs: v => v === '' ? null : parseFloat(v)
                      })}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    {errors.cream_amount && (
                      <p className="mt-1 text-sm text-red-600">{errors.cream_amount.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Yağsız Süt Miktarı (L)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      {...register('skimmed_milk_amount', {
                        min: { value: 0, message: 'Miktar 0\'dan küçük olamaz' },
                        valueAsNumber: true,
                        setValueAs: v => v === '' ? null : parseFloat(v)
                      })}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    {errors.skimmed_milk_amount && (
                      <p className="mt-1 text-sm text-red-600">{errors.skimmed_milk_amount.message}</p>
                    )}
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Peynir Miktarı (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  {...register('cheese_amount', {
                    min: { value: 0, message: 'Miktar 0\'dan küçük olamaz' },
                    valueAsNumber: true,
                    setValueAs: v => v === '' ? null : parseFloat(v)
                  })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                {errors.cheese_amount && (
                  <p className="mt-1 text-sm text-red-600">{errors.cheese_amount.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kalite Puanı
                </label>
                <select
                  {...register('quality_score', {
                    setValueAs: v => v === '' ? null : parseInt(v)
                  })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Seçiniz</option>
                  {[...Array(10)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>{i + 1}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notlar
              </label>
              <textarea
                {...register('notes')}
                rows={3}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="İşlem hakkında ek bilgiler..."
              />
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={loading}
            >
              İptal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}