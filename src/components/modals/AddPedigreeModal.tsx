import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Info, Plus, Trash2 } from 'lucide-react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';

interface Animal {
  id: string;
  tag_number: string;
  name: string | null;
  breed: string;
  gender: string;
  birth_date: string;
}

interface AddPedigreeFormData {
  animal_id: string;
  pedigree_number: string;
  registration_date: string;
  pedigree_class: string;
  genetic_merit_score: number;
  breeding_value: number;
  sire_tag: string;
  dam_tag: string;
  grand_sire_paternal_tag: string;
  grand_dam_paternal_tag: string;
  grand_sire_maternal_tag: string;
  grand_dam_maternal_tag: string;
  genetic_traits: {
    trait: string;
    value: string;
  }[];
  genetic_defects: string[];
  certificates: string[];
  notes: string;
}

interface AddPedigreeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddPedigreeModal({ isOpen, onClose, onSuccess }: AddPedigreeModalProps) {
  const { user } = useAuth();
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);
  const [defect, setDefect] = useState('');
  const [certificate, setCertificate] = useState('');
  
  const { register, handleSubmit, control, setValue, watch, formState: { errors } } = useForm<AddPedigreeFormData>({
    defaultValues: {
      registration_date: format(new Date(), 'yyyy-MM-dd'),
      pedigree_class: 'B',
      genetic_merit_score: 7.0,
      breeding_value: 100,
      genetic_traits: [{ trait: '', value: '' }],
      genetic_defects: [],
      certificates: []
    }
  });
  
  const { fields: traitFields, append: appendTrait, remove: removeTrait } = useFieldArray({
    control,
    name: "genetic_traits"
  });
  
  const animalId = watch('animal_id');
  
  useEffect(() => {
    if (isOpen) {
      fetchAnimals();
    }
  }, [isOpen]);
  
  useEffect(() => {
    if (animalId) {
      const animal = animals.find(a => a.id === animalId);
      setSelectedAnimal(animal || null);
      
      // Generate a default pedigree number based on animal tag number
      if (animal) {
        setValue('pedigree_number', `PED-${animal.tag_number.replace('TR', '')}`);
      }
    } else {
      setSelectedAnimal(null);
    }
  }, [animalId, animals, setValue]);

  const fetchAnimals = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('animals')
        .select('id, tag_number, name, breed, gender, birth_date')
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

  const onSubmit = async (data: AddPedigreeFormData) => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      
      // Filter out empty genetic traits
      const filteredTraits = data.genetic_traits.filter(t => t.trait.trim() !== '' && t.value.trim() !== '');
      
      // Convert genetic traits array to object
      const geneticTraitsObject = filteredTraits.reduce((acc, { trait, value }) => {
        acc[trait] = value;
        return acc;
      }, {} as Record<string, string>);
      
      // Prepare lineage data
      const lineage = {
        sire: {
          tag_number: data.sire_tag || null,
          name: null,
          pedigree_number: null
        },
        dam: {
          tag_number: data.dam_tag || null,
          name: null,
          pedigree_number: null
        },
        grand_sire_paternal: {
          tag_number: data.grand_sire_paternal_tag || null,
          pedigree_number: null
        },
        grand_dam_paternal: {
          tag_number: data.grand_dam_paternal_tag || null,
          pedigree_number: null
        },
        grand_sire_maternal: {
          tag_number: data.grand_sire_maternal_tag || null,
          pedigree_number: null
        },
        grand_dam_maternal: {
          tag_number: data.grand_dam_maternal_tag || null,
          pedigree_number: null
        }
      };

      const { error: insertError } = await supabase
        .from('pedigrees')
        .insert([
          {
            animal_id: data.animal_id,
            pedigree_number: data.pedigree_number,
            registration_date: data.registration_date,
            pedigree_class: data.pedigree_class,
            genetic_merit_score: data.genetic_merit_score,
            breeding_value: data.breeding_value,
            genetic_defects: data.genetic_defects.length > 0 ? data.genetic_defects : null,
            genetic_traits: Object.keys(geneticTraitsObject).length > 0 ? geneticTraitsObject : null,
            lineage,
            certificates: data.certificates.length > 0 ? data.certificates : null,
            notes: data.notes || null,
            user_id: user.id
          }
        ]);

      if (insertError) throw insertError;
      
      // Update animal record with pedigree information
      const { error: updateError } = await supabase
        .from('animals')
        .update({
          pedigree_number: data.pedigree_number,
          pedigree_class: data.pedigree_class,
          genetic_merit: Object.entries(geneticTraitsObject).map(([trait, value]) => `${trait}: ${value}`).join(', '),
          breeding_value: data.breeding_value
        })
        .eq('id', data.animal_id);
        
      if (updateError) throw updateError;

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error adding pedigree:', err);
      setError('Pedigree eklenirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };
  
  const addDefect = () => {
    if (defect.trim()) {
      setValue('genetic_defects', [...watch('genetic_defects'), defect.trim()]);
      setDefect('');
    }
  };
  
  const removeDefect = (index: number) => {
    const currentDefects = watch('genetic_defects');
    setValue('genetic_defects', currentDefects.filter((_, i) => i !== index));
  };
  
  const addCertificate = () => {
    if (certificate.trim()) {
      setValue('certificates', [...watch('certificates'), certificate.trim()]);
      setCertificate('');
    }
  };
  
  const removeCertificate = (index: number) => {
    const currentCertificates = watch('certificates');
    setValue('certificates', currentCertificates.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg w-full max-w-4xl my-8">
        <div className="border-b p-4 sticky top-0 bg-white rounded-t-lg z-10">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Yeni Pedigree Ekle</h2>
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
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Info className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    Pedigree kaydı, hayvanın soy ağacı ve genetik özelliklerini belgelemek için kullanılır. Bu bilgiler ıslah çalışmaları ve hayvan değerinin belirlenmesi için önemlidir.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hayvan <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('animal_id', { required: 'Hayvan seçimi zorunludur' })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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

              {selectedAnimal && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Seçilen Hayvan Bilgileri</h3>
                  <p className="text-sm text-gray-600">Irk: {selectedAnimal.breed}</p>
                  <p className="text-sm text-gray-600">Cinsiyet: {selectedAnimal.gender === 'male' ? 'Erkek' : 'Dişi'}</p>
                  <p className="text-sm text-gray-600">
                    Doğum Tarihi: {format(new Date(selectedAnimal.birth_date), 'dd.MM.yyyy')}
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pedigree Numarası <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('pedigree_number', { 
                    required: 'Pedigree numarası zorunludur',
                    pattern: {
                      value: /^[A-Za-z0-9-]+$/,
                      message: 'Geçersiz pedigree numarası formatı'
                    }
                  })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="PED-12345678"
                />
                {errors.pedigree_number && (
                  <p className="mt-1 text-sm text-red-600">{errors.pedigree_number.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kayıt Tarihi <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  {...register('registration_date', { required: 'Kayıt tarihi zorunludur' })}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                {errors.registration_date && (
                  <p className="mt-1 text-sm text-red-600">{errors.registration_date.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pedigree Sınıfı <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('pedigree_class', { required: 'Pedigree sınıfı zorunludur' })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="A">A Sınıfı</option>
                  <option value="B">B Sınıfı</option>
                  <option value="C">C Sınıfı</option>
                  <option value="D">D Sınıfı</option>
                </select>
                {errors.pedigree_class && (
                  <p className="mt-1 text-sm text-red-600">{errors.pedigree_class.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Genetik Değer Puanı <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  {...register('genetic_merit_score', { 
                    required: 'Genetik değer puanı zorunludur',
                    min: { value: 0, message: 'En az 0 olmalıdır' },
                    max: { value: 10, message: 'En fazla 10 olmalıdır' },
                    valueAsNumber: true
                  })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="7.5"
                />
                {errors.genetic_merit_score && (
                  <p className="mt-1 text-sm text-red-600">{errors.genetic_merit_score.message}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">0-10 arası bir değer girin</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Damızlık Değeri (EBV) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  {...register('breeding_value', { 
                    required: 'Damızlık değeri zorunludur',
                    valueAsNumber: true
                  })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="100"
                />
                {errors.breeding_value && (
                  <p className="mt-1 text-sm text-red-600">{errors.breeding_value.message}</p>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Soy Bilgileri</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Baba Küpe No
                  </label>
                  <input
                    type="text"
                    {...register('sire_tag')}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="TR1234567890"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Anne Küpe No
                  </label>
                  <input
                    type="text"
                    {...register('dam_tag')}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="TR1234567890"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Büyükbaba Küpe No (Baba tarafı)
                  </label>
                  <input
                    type="text"
                    {...register('grand_sire_paternal_tag')}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="TR1234567890"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Büyükanne Küpe No (Baba tarafı)
                  </label>
                  <input
                    type="text"
                    {...register('grand_dam_paternal_tag')}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="TR1234567890"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Büyükbaba Küpe No (Anne tarafı)
                  </label>
                  <input
                    type="text"
                    {...register('grand_sire_maternal_tag')}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="TR1234567890"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Büyükanne Küpe No (Anne tarafı)
                  </label>
                  <input
                    type="text"
                    {...register('grand_dam_maternal_tag')}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="TR1234567890"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Genetik Özellikler</h3>
              
              {traitFields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-4 mb-4">
                  <div className="flex-1">
                    <input
                      {...register(`genetic_traits.${index}.trait`)}
                      placeholder="Özellik adı (örn: Süt verimi, Doğum ağırlığı)"
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 mb-2"
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      {...register(`genetic_traits.${index}.value`)}
                      placeholder="Değer (örn: Yüksek, 45kg, %4.2)"
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 mb-2"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeTrait(index)}
                    className="p-2 text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              ))}
              
              <button
                type="button"
                onClick={() => appendTrait({ trait: '', value: '' })}
                className="mt-2 inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="h-4 w-4 mr-1" />
                Genetik Özellik Ekle
              </button>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Genetik Kusurlar</h3>
              
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1">
                  <input
                    type="text"
                    value={defect}
                    onChange={(e) => setDefect(e.target.value)}
                    placeholder="Genetik kusur (örn: Kalça displazisi, Göz anomalisi)"
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={addDefect}
                  className="px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Ekle
                </button>
              </div>
              
              {watch('genetic_defects').length > 0 && (
                <div className="mt-2 bg-red-50 p-3 rounded-md">
                  <ul className="space-y-1">
                    {watch('genetic_defects').map((defect, index) => (
                      <li key={index} className="flex items-center justify-between">
                        <span className="text-sm text-red-700">{defect}</span>
                        <button
                          type="button"
                          onClick={() => removeDefect(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Sertifikalar</h3>
              
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1">
                  <input
                    type="text"
                    value={certificate}
                    onChange={(e) => setCertificate(e.target.value)}
                    placeholder="Sertifika adı (örn: Elit Damızlık Sertifikası, Organik Üretim Sertifikası)"
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={addCertificate}
                  className="px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Ekle
                </button>
              </div>
              
              {watch('certificates').length > 0 && (
                <div className="mt-2 bg-yellow-50 p-3 rounded-md">
                  <ul className="space-y-1">
                    {watch('certificates').map((cert, index) => (
                      <li key={index} className="flex items-center justify-between">
                        <span className="text-sm text-yellow-700">{cert}</span>
                        <button
                          type="button"
                          onClick={() => removeCertificate(index)}
                          className="text-yellow-600 hover:text-yellow-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notlar
              </label>
              <textarea
                {...register('notes')}
                rows={4}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Ek bilgiler, özel durumlar..."
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