import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Info } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Tables } from '../../lib/types';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface AddMilkProductionFormData {
  animal_id: string;
  date: string;
  period: 'morning' | 'evening';
  amount: number;
  notes?: string;
}

interface AddMilkProductionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  animal?: Tables['animals']['Row'];
}

export function AddMilkProductionModal({ isOpen, onClose, onSuccess, animal: preSelectedAnimal }: AddMilkProductionModalProps) {
  const { user } = useAuth();
  const { register, handleSubmit, watch, setValue, formState: { errors }, reset } = useForm<AddMilkProductionFormData>({
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      period: 'morning',
      amount: 0,
      animal_id: preSelectedAnimal?.id
    }
  });

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [animals, setAnimals] = useState<Tables['animals']['Row'][]>([]);
  const [averages, setAverages] = useState<{
    daily: number;
  }>({ daily: 0 });

  const selectedAnimalId = watch('animal_id');

  useEffect(() => {
    if (isOpen) {
      fetchAnimals();
      if (selectedAnimalId) {
        fetchAnimalAverages(selectedAnimalId);
      }
    }
  }, [isOpen, selectedAnimalId]);

  const fetchAnimals = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('animals')
        .select('*')
        .eq('gender', 'female')
        .eq('status', 'active')
        .order('tag_number', { ascending: true });

      if (fetchError) throw fetchError;
      setAnimals(data || []);
    } catch (err) {
      console.error('Error fetching animals:', err);
      setError('Hayvanlar yüklenirken bir hata oluştu.');
    }
  };

  const fetchAnimalAverages = async (animalId: string) => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error: fetchError } = await supabase
        .from('milk_productions')
        .select('amount')
        .eq('animal_id', animalId)
        .gte('date', thirtyDaysAgo.toISOString());

      if (fetchError) throw fetchError;

      if (data && data.length > 0) {
        const totalAmount = data.reduce((sum, record) => sum + record.amount, 0);
        setAverages({ daily: totalAmount / data.length });
      } else {
        setAverages({ daily: 0 });
      }
    } catch (err) {
      console.error('Error fetching averages:', err);
    }
  };

  const onSubmit = async (data: AddMilkProductionFormData) => {
    if (!user) return;

    try {
      setIsSubmitting(true);
      setError(null);

      const { error: supabaseError } = await supabase
        .from('milk_productions')
        .insert([
          {
            animal_id: data.animal_id,
            date: data.date,
            amount: data.amount,
            notes: data.notes || null,
            user_id: user.id
          }
        ]);

      if (supabaseError) throw supabaseError;

      reset();
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error adding milk production:', err);
      setError('Süt üretimi kaydı eklenirken bir hata oluştu. Lütfen tekrar deneyin.');
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
              <h2 className="text-xl font-semibold text-gray-900">Yeni Süt Üretimi Kaydı</h2>
              {preSelectedAnimal && (
                <p className="text-sm text-gray-500 mt-1">
                  {preSelectedAnimal.tag_number} {preSelectedAnimal.name && `(${preSelectedAnimal.name})`}
                </p>
              )}
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
            {!preSelectedAnimal && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hayvan <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('animal_id', { required: 'Hayvan seçimi zorunludur' })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                >
                  <option value="">Seçiniz</option>
                  {animals.map(animal => (
                    <option key={animal.id} value={animal.id}>
                      {animal.tag_number} {animal.name && `(${animal.name})`}
                    </option>
                  ))}
                </select>
                {errors.animal_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.animal_id.message}</p>
                )}
              </div>
            )}

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
                Sağım Zamanı <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 grid grid-cols-2 gap-3">
                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    {...register('period')}
                    value="morning"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-3 text-sm font-medium text-gray-900">Sabah Sağımı</span>
                </label>
                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    {...register('period')}
                    value="evening"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-3 text-sm font-medium text-gray-900">Akşam Sağımı</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Miktar (L) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.1"
                {...register('amount', {
                  required: 'Miktar zorunludur',
                  min: { value: 0, message: 'Miktar 0\'dan büyük olmalıdır' },
                  max: { value: 50, message: 'Miktar 50 litreden fazla olamaz' }
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
              />
              {errors.amount && (
                <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
              )}
            </div>

            {averages.daily > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <Info className="h-5 w-5 text-blue-400" />
                  <span className="ml-2 text-sm text-blue-700">
                    Son 30 gün ortalaması: {averages.daily.toFixed(1)} L
                  </span>
                </div>
              </div>
            )}

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