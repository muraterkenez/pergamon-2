import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Info } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { format, addDays } from 'date-fns';
import { tr } from 'date-fns/locale';
import { MEDICINE_TEMPLATES } from '../../data/medicineTemplates';
import { VACCINE_TEMPLATES } from '../../data/vaccineTemplates';

interface AddHealthRecordFormData {
  animal_id: string;
  date: string;
  type: 'examination' | 'vaccination' | 'treatment';
  description: string;
  treatment?: string;
  medicine_template?: string;
  medicine_dose?: number;
  cost?: number;
  next_check_date?: string;
  vaccine_template?: string;
  set_reminder?: boolean;
  reminder_date?: string;
}

interface AddHealthRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  animal?: {
    id: string;
    tag_number: string;
    name: string | null;
  };
}

export default function AddHealthRecordModal({ isOpen, onClose, onSuccess, animal: preSelectedAnimal }: AddHealthRecordModalProps) {
  const { user } = useAuth();
  const [animals, setAnimals] = useState<Array<{
    id: string;
    tag_number: string;
    name: string | null;
  }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, watch, setValue, formState: { errors }, reset } = useForm<AddHealthRecordFormData>({
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      type: 'examination',
      animal_id: preSelectedAnimal?.id
    }
  });

  const selectedType = watch('type');
  const selectedMedicineTemplate = watch('medicine_template');
  const selectedVaccineTemplate = watch('vaccine_template');

  // Organize medicines by category
  const medicineCategories = {
    antibiotic: MEDICINE_TEMPLATES.filter(m => m.type === 'antibiotic'),
    antiinflammatory: MEDICINE_TEMPLATES.filter(m => m.type === 'antiinflammatory'),
    supplement: MEDICINE_TEMPLATES.filter(m => m.type === 'supplement'),
    other: MEDICINE_TEMPLATES.filter(m => m.type === 'other')
  };

  useEffect(() => {
    if (isOpen && !preSelectedAnimal) {
      fetchAnimals();
    }
  }, [isOpen, preSelectedAnimal]);

  useEffect(() => {
    if (selectedMedicineTemplate) {
      const template = MEDICINE_TEMPLATES.find(t => t.id === selectedMedicineTemplate);
      if (template) {
        setValue('description', template.description);
        setValue('treatment', `${template.name} - ${template.dosage.amount}${template.dosage.unit}/${template.dosage.per}${template.dosage.perUnit}`);
      }
    }
  }, [selectedMedicineTemplate, setValue]);

  useEffect(() => {
    if (selectedVaccineTemplate) {
      const template = VACCINE_TEMPLATES.find(t => t.id === selectedVaccineTemplate);
      if (template) {
        setValue('description', template.description);
        if (template.schedule[0]) {
          setValue('next_check_date', format(addDays(new Date(), template.schedule[0].dayOffset), 'yyyy-MM-dd'));
        }
      }
    }
  }, [selectedVaccineTemplate, setValue]);

  const fetchAnimals = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('animals')
        .select('id, tag_number, name')
        .eq('status', 'active')
        .order('tag_number', { ascending: true });

      if (fetchError) throw fetchError;
      setAnimals(data || []);
    } catch (err) {
      console.error('Error fetching animals:', err);
      setError('Hayvanlar yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: AddHealthRecordFormData) => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { error: insertError } = await supabase
        .from('health_records')
        .insert([{
          animal_id: data.animal_id,
          date: data.date,
          type: data.type,
          description: data.description,
          treatment: data.treatment || null,
          cost: data.cost || null,
          next_check_date: data.next_check_date || null,
          user_id: user.id
        }]);

      if (insertError) throw insertError;

      // Hayvanın sağlık durumunu güncelle
      if (data.type === 'treatment') {
        const { error: updateError } = await supabase
          .from('animals')
          .update({ health_status: 'treatment' })
          .eq('id', data.animal_id);

        if (updateError) throw updateError;
      }

      // Hatırlatıcı ekle
      if (data.set_reminder && data.reminder_date) {
        const { error: reminderError } = await supabase
          .from('health_records')
          .insert([{
            animal_id: data.animal_id,
            date: data.reminder_date,
            type: 'reminder',
            description: `Kontrol hatırlatıcısı: ${data.description}`,
            user_id: user.id
          }]);

        if (reminderError) throw reminderError;
      }

      reset();
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error adding health record:', err);
      setError('Sağlık kaydı eklenirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg w-full max-w-2xl my-8">
        <div className="border-b p-4 sticky top-0 bg-white rounded-t-lg z-10">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Yeni Sağlık Kaydı</h2>
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
                  className="form-select mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
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
                max={format(new Date(), 'yyyy-MM-dd')}
                className="form-input mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
              />
              {errors.date && (
                <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                İşlem Türü <span className="text-red-500">*</span>
              </label>
              <select
                {...register('type', { required: 'İşlem türü zorunludur' })}
                className="form-select mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
              >
                <option value="examination">Kontrol</option>
                <option value="vaccination">Aşılama</option>
                <option value="treatment">Tedavi</option>
              </select>
              {errors.type && (
                <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
              )}
            </div>

            {selectedType === 'vaccination' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Aşı Şablonu
                </label>
                <select
                  {...register('vaccine_template')}
                  className="form-select mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                >
                  <option value="">Seçiniz</option>
                  {VACCINE_TEMPLATES.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedType === 'treatment' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  İlaç Şablonu
                </label>
                <select
                  {...register('medicine_template')}
                  className="form-select mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                >
                  <option value="">Seçiniz</option>
                  <optgroup label="Antibiyotikler">
                    {medicineCategories.antibiotic.map(template => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Ağrı Kesiciler ve Antiinflamatuarlar">
                    {medicineCategories.antiinflammatory.map(template => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Vitamin ve Mineral Takviyeleri">
                    {medicineCategories.supplement.map(template => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Diğer İlaçlar">
                    {medicineCategories.other.map(template => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Açıklama <span className="text-red-500">*</span>
              </label>
              <textarea
                {...register('description', { required: 'Açıklama zorunludur' })}
                rows={3}
                className="form-textarea mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                placeholder="Yapılan işlem veya tespit edilen durumu açıklayın..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            {selectedType === 'treatment' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Uygulanan Tedavi
                </label>
                <textarea
                  {...register('treatment')}
                  rows={2}
                  className="form-textarea mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                  placeholder="Uygulanan tedavi yöntemini açıklayın..."
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Maliyet (₺)
              </label>
              <input
                type="number"
                step="0.01"
                {...register('cost', {
                  min: { value: 0, message: 'Maliyet 0\'dan küçük olamaz' }
                })}
                className="form-input mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                placeholder="0.00"
              />
              {errors.cost && (
                <p className="mt-1 text-sm text-red-600">{errors.cost.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sonraki Kontrol Tarihi
              </label>
              <input
                type="date"
                {...register('next_check_date')}
                min={format(new Date(), 'yyyy-MM-dd')}
                className="form-input mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register('set_reminder')}
                className="form-checkbox h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="text-sm text-gray-700">
                Hatırlatıcı ekle
              </label>
            </div>

            {watch('set_reminder') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hatırlatıcı Tarihi
                </label>
                <input
                  type="date"
                  {...register('reminder_date')}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  className="form-input mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                />
              </div>
            )}
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

export { AddHealthRecordModal }