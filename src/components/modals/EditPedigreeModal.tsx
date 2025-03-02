import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Info, Plus, Trash2 } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';

interface PedigreeRecord {
  id: string;
  animal_id: string;
  pedigree_number: string;
  registration_date: string;
  pedigree_class: string;
  genetic_merit_score: number;
  breeding_value: number;
  genetic_defects: string[] | null;
  genetic_traits: Record<string, any>;
  lineage: {
    sire: {
      id: string | null;
      tag_number: string | null;
      name: string | null;
      pedigree_number: string | null;
    };
    dam: {
      id: string | null;
      tag_number: string | null;
      name: string | null;
      pedigree_number: string | null;
    };
    grand_sire_paternal: {
      tag_number: string | null;
      pedigree_number: string | null;
    };
    grand_dam_paternal: {
      tag_number: string | null;
      pedigree_number: string | null;
    };
    grand_sire_maternal: {
      tag_number: string | null;
      pedigree_number: string | null;
    };
    grand_dam_maternal: {
      tag_number: string | null;
      pedigree_number: string | null;
    };
  };
  certificates: string[];
  notes: string | null;
  animal: {
    tag_number: string;
    name: string | null;
    breed: string;
    gender: string;
    birth_date: string;
  };
}

interface EditPedigreeFormData {
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

interface EditPedigreeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  pedigree: PedigreeRecord;
}

export function EditPedigreeModal({ isOpen, onClose, onSuccess, pedigree }: EditPedigreeModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [defect, setDefect] = useState('');
  const [certificate, setCertificate] = useState('');
  
  const { register, handleSubmit, control, setValue, watch, formState: { errors }, reset } = useForm<EditPedigreeFormData>();
  
  const { fields: traitFields, append: appendTrait, remove: removeTrait } = useFieldArray({
    control,
    name: "genetic_traits"
  });
  
  useEffect(() => {
    if (isOpen && pedigree) {
      // Convert genetic traits object to array
      const traitsArray = Object.entries(pedigree.genetic_traits || {}).map(([trait, value]) => ({
        trait,
        value: value as string
      }));
      
      // Set form values
      reset({
        pedigree_number: pedigree.pedigree_number,
        registration_date: pedigree.registration_date,
        pedigree_class: pedigree.pedigree_class,
        genetic_merit_score: pedigree.genetic_merit_score,
        breeding_value: pedigree.breeding_value,
        sire_tag: pedigree.lineage.sire.tag_number || '',
        dam_tag: pedigree.lineage.dam.tag_number || '',
        grand_sire_paternal_tag: pedigree.lineage.grand_sire_paternal?.tag_number || '',
        grand_dam_paternal_tag: pedigree.lineage.grand_dam_paternal?.tag_number || '',
        grand_sire_maternal_tag: pedigree.lineage.grand_sire_maternal?.tag_number || '',
        grand_dam_maternal_tag: pedigree.lineage.grand_dam_maternal?.tag_number || '',
        genetic_traits: traitsArray.length > 0 ? traitsArray : [{ trait: '', value: '' }],
        genetic_defects: pedigree.genetic_defects || [],
        certificates: pedigree.certificates || [],
        notes: pedigree.notes || ''
      });
    }
  }, [isOpen, pedigree, reset]);

  const onSubmit = async (data: EditPedigreeFormData) => {
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
          ...pedigree.lineage.sire,
          tag_number: data.sire_tag || null
        },
        dam: {
          ...pedigree.lineage.dam,
          tag_number: data.dam_tag || null
        },
        grand_sire_paternal: {
          ...pedigree.lineage.grand_sire_paternal,
          tag_number: data.grand_sire_paternal_tag || null
        },
        grand_dam_paternal: {
          ...pedigree.lineage.grand_dam_paternal,
          tag_number: data.grand_dam_paternal_tag || null
        },
        grand_sire_maternal: {
          ...pedigree.lineage.grand_sire_maternal,
          tag_number: data.grand_sire_maternal_tag || null
        },
        grand_dam_maternal: {
          ...pedigree.lineage.grand_dam_maternal,
          tag_number: data.grand_dam_maternal_tag || null
        }
      };

      const { error: updateError } = await supabase
        .from('pedigrees')
        .update({
          pedigree_number: data.pedigree_number,
          registration_date: data.registration_date,
          pedigree_class: data.pedigree_class,
          genetic_merit_score: data.genetic_merit_score,
          breeding_value: data.breeding_value,
          genetic_defects: data.genetic_defects.length > 0 ? data.genetic_defects : null,
          genetic_traits: Object.keys(geneticTraitsObject).length > 0 ? geneticTraitsObject : null,
          lineage,
          certificates: data.certificates.length > 0 ? data.certificates : null,
          notes: data.notes || null
        })
        .eq('id', pedigree.id);

      if (updateError) throw updateError;
      
      // Update animal record with pedigree information
      const { error: animalUpdateError } = await supabase
        .from('animals')
        .update({
          pedigree_number: data.pedigree_number,
          pedigree_class: data.pedigree_class,
          genetic_merit: Object.entries(geneticTraitsObject).map(([trait, value]) => `${trait}: ${value}`).join(', '),
          breeding_value: data.breeding_value
        })
        .eq('id', pedigree.animal_id);
        
      if (animalUpdateError) throw animalUpdateError;

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error updating pedigree:', err);
      setError('Pedigree güncellenirken bir hata oluştu. Lütfen tekrar deneyin.');
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
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Pedigree Düzenle</h2>
              <p className="text-sm text-gray-500 mt-1">
                {pedigree.animal.tag_number} {pedigree.animal.name && `(${pedigree.animal.name})`}
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
                    valueAsNumber: true })}
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
              
              {watch('genetic_defects')?.length > 0 && (
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
              
              {watch('certificates')?.length > 0 && (
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