import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Camera, Upload, Info } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface AddAnimalFormData {
  tag_number: string;
  name: string;
  birth_date: string;
  gender: 'male' | 'female';
  breed: string;
  color: string;
  weight: number;
  source: 'birth' | 'purchase';
  purchase_date?: string;
  purchase_price?: number;
  mother_tag?: string;
  father_tag?: string;
  vaccination_status: boolean;
  health_status: 'healthy' | 'sick' | 'treatment';
  notes?: string;
  // Pedigree bilgileri
  pedigree_registered: boolean;
  pedigree_number?: string;
  genetic_merit?: number;
  milk_yield_potential?: number;
  fat_percentage?: number;
  protein_percentage?: number;
  body_condition_score?: number;
  // Tohumlama seçeneği
  is_insemination: boolean;
}

interface AddAnimalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface AnimalOption {
  id: string;
  tag_number: string;
  name: string | null;
  gender: string;
}

const COMMON_BREEDS = [
  'Holstein',
  'Simental',
  'Jersey',
  'Angus',
  'Hereford',
  'Montofon',
  'Şarole',
  'Limuzin',
];

const COMMON_COLORS = [
  'Siyah-Beyaz',
  'Kahverengi',
  'Siyah',
  'Beyaz',
  'Kızıl',
  'Alaca',
  'Sarı',
];

export function AddAnimalModal({ isOpen, onClose, onSuccess }: AddAnimalModalProps) {
  const { user } = useAuth();
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting }, reset } = useForm<AddAnimalFormData>({
    defaultValues: {
      is_insemination: false,
      pedigree_registered: false,
      birth_date: new Date().toISOString().split('T')[0]
    }
  });
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [femaleAnimals, setFemaleAnimals] = useState<AnimalOption[]>([]);
  const [maleAnimals, setMaleAnimals] = useState<AnimalOption[]>([]);
  const [loading, setLoading] = useState(false);
  
  const source = watch('source');
  const gender = watch('gender');
  const pedigreeRegistered = watch('pedigree_registered');
  const motherTag = watch('mother_tag');
  const fatherTag = watch('father_tag');
  const isInsemination = watch('is_insemination');

  useEffect(() => {
    if (isOpen) {
      fetchAnimals();
    }
  }, [isOpen]);

  useEffect(() => {
    // Tohumlama seçildiğinde father_tag'i "Tohumlama" olarak ayarla
    if (isInsemination) {
      setValue('father_tag', 'Tohumlama');
    } else if (fatherTag === 'Tohumlama') {
      setValue('father_tag', '');
    }
  }, [isInsemination, setValue, fatherTag]);

  const fetchAnimals = async () => {
    try {
      setLoading(true);
      
      // Fetch female animals for mother selection
      const { data: femaleData, error: femaleError } = await supabase
        .from('animals')
        .select('id, tag_number, name, gender')
        .eq('gender', 'female')
        .eq('status', 'active')
        .order('tag_number', { ascending: true });

      if (femaleError) throw femaleError;
      setFemaleAnimals(femaleData || []);
      
      // Fetch male animals for father selection
      const { data: maleData, error: maleError } = await supabase
        .from('animals')
        .select('id, tag_number, name, gender')
        .eq('gender', 'male')
        .eq('status', 'active')
        .order('tag_number', { ascending: true });

      if (maleError) throw maleError;
      setMaleAnimals(maleData || []);
      
    } catch (err) {
      console.error('Error fetching animals:', err);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: AddAnimalFormData) => {
    try {
      setError(null);
      
      // Tohumlama seçeneği işaretliyse father_tag'i "Tohumlama" olarak ayarla
      if (data.is_insemination) {
        data.father_tag = 'Tohumlama';
      }
      
      // Satın alma seçilmemişse ilgili alanları null olarak ayarla
      if (data.source !== 'purchase') {
        data.purchase_date = undefined;
        data.purchase_price = undefined;
      }
      
      // Pedigree kaydı yoksa ilgili alanları null olarak ayarla
      if (!data.pedigree_registered) {
        data.pedigree_number = undefined;
        data.genetic_merit = undefined;
        data.milk_yield_potential = undefined;
        data.fat_percentage = undefined;
        data.protein_percentage = undefined;
        data.body_condition_score = undefined;
      }
      
      const { error: supabaseError } = await supabase
        .from('animals')
        .insert([
          {
            ...data,
            user_id: user?.id,
            status: 'active',
            weight: parseFloat(data.weight.toString()),
            purchase_price: data.purchase_price ? parseFloat(data.purchase_price.toString()) : null,
            // Pedigree bilgileri
            pedigree_registered: data.pedigree_registered,
            pedigree_number: data.pedigree_number || null,
            genetic_merit: data.genetic_merit || null,
            milk_yield_potential: data.milk_yield_potential || null,
            fat_percentage: data.fat_percentage || null,
            protein_percentage: data.protein_percentage || null,
            body_condition_score: data.body_condition_score || null,
            // Tohumlama bilgisi
            is_insemination: data.is_insemination
          }
        ]);

      if (supabaseError) throw supabaseError;

      reset();
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error adding animal:', err);
      setError('Hayvan eklenirken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-6">
      <div className="flex items-center space-x-2">
        {[1, 2, 3, 4].map((step) => (
          <React.Fragment key={step}>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep === step
                  ? 'bg-blue-600 text-white'
                  : currentStep > step
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {step}
            </div>
            {step < 4 && (
              <div className={`w-12 h-1 ${currentStep > step ? 'bg-green-500' : 'bg-gray-200'}`} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Küpe Numarası <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register('tag_number', { 
              required: 'Küpe numarası zorunludur',
              pattern: {
                value: /^TR\d{10}$/i,
                message: 'Geçerli bir küpe numarası girin (TR + 10 rakam)'
              }
            })}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="TR1234567890"
          />
          {errors.tag_number && (
            <p className="mt-1 text-sm text-red-600">{errors.tag_number.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            İsim
          </label>
          <input
            type="text"
            {...register('name')}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Hayvanın adı (opsiyonel)"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Doğum Tarihi <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            {...register('birth_date', { 
              required: 'Doğum tarihi zorunludur',
              validate: value => {
                const date = new Date(value);
                return date <= new Date() || 'Gelecek bir tarih seçilemez';
              }
            })}
            max={new Date().toISOString().split('T')[0]}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          {errors.birth_date && (
            <p className="mt-1 text-sm text-red-600">{errors.birth_date.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cinsiyet <span className="text-red-500">*</span>
          </label>
          <select
            {...register('gender', { required: 'Cinsiyet zorunludur' })}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Seçiniz</option>
            <option value="male">Erkek</option>
            <option value="female">Dişi</option>
          </select>
          {errors.gender && (
            <p className="mt-1 text-sm text-red-600">{errors.gender.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Irk <span className="text-red-500">*</span>
          </label>
          <select
            {...register('breed', { required: 'Irk zorunludur' })}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Seçiniz</option>
            {COMMON_BREEDS.map(breed => (
              <option key={breed} value={breed}>{breed}</option>
            ))}
            <option value="other">Diğer</option>
          </select>
          {errors.breed && (
            <p className="mt-1 text-sm text-red-600">{errors.breed.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Renk <span className="text-red-500">*</span>
          </label>
          <select
            {...register('color', { required: 'Renk zorunludur' })}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Seçiniz</option>
            {COMMON_COLORS.map(color => (
              <option key={color} value={color}>{color}</option>
            ))}
            <option value="other">Diğer</option>
          </select>
          {errors.color && (
            <p className="mt-1 text-sm text-red-600">{errors.color.message}</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Kaynak <span className="text-red-500">*</span>
        </label>
        <select
          {...register('source', { required: 'Kaynak zorunludur' })}
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="">Seçiniz</option>
          <option value="birth">Doğum</option>
          <option value="purchase">Satın Alma</option>
        </select>
        {errors.source && (
          <p className="mt-1 text-sm text-red-600">{errors.source.message}</p>
        )}
      </div>

      {source === 'purchase' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Satın Alma Tarihi <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              {...register('purchase_date', { 
                required: source === 'purchase' ? 'Satın alma tarihi zorunludur' : false,
                validate: value => {
                  if (source !== 'purchase') return true;
                  if (!value) return 'Satın alma tarihi zorunludur';
                  const date = new Date(value);
                  return date <= new Date() || 'Gelecek bir tarih seçilemez';
                }
              })}
              max={new Date().toISOString().split('T')[0]}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            {errors.purchase_date && (
              <p className="mt-1 text-sm text-red-600">{errors.purchase_date.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Satın Alma Fiyatı <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                {...register('purchase_price', {
                  required: source === 'purchase' ? 'Satın alma fiyatı zorunludur' : false,
                  min: { value: 0, message: 'Fiyat 0\'dan büyük olmalıdır' }
                })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 pr-12"
                placeholder="0.00"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className="text-gray-500">₺</span>
              </div>
            </div>
            {errors.purchase_price && (
              <p className="mt-1 text-sm text-red-600">{errors.purchase_price.message}</p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Anne
          </label>
          <select
            {...register('mother_tag')}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Seçiniz</option>
            {femaleAnimals.map(animal => (
              <option key={animal.id} value={animal.tag_number}>
                {animal.tag_number} {animal.name ? `(${animal.name})` : ''}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            Sistemde kayıtlı dişi hayvanlar arasından seçim yapabilirsiniz
          </p>
        </div>

        <div>
          <div className="flex items-center mb-2">
            <input
              type="checkbox"
              id="is_insemination"
              {...register('is_insemination')}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="is_insemination" className="ml-2 block text-sm text-gray-900">
              Tohumlama ile doğum
            </label>
          </div>
          
          {!isInsemination ? (
            <>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Baba
              </label>
              <select
                {...register('father_tag')}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                disabled={isInsemination}
              >
                <option value="">Seçiniz</option>
                {maleAnimals.map(animal => (
                  <option key={animal.id} value={animal.tag_number}>
                    {animal.tag_number} {animal.name ? `(${animal.name})` : ''}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Sistemde kayıtlı erkek hayvanlar arasından seçim yapabilirsiniz
              </p>
            </>
          ) : (
            <div className="bg-blue-50 p-3 rounded-md mt-1">
              <p className="text-sm text-blue-700">
                Baba olarak "Tohumlama" kaydedilecektir.
              </p>
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Ağırlık (kg) <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          step="0.1"
          {...register('weight', {
            required: 'Ağırlık zorunludur',
            min: { value: 0, message: 'Ağırlık 0\'dan büyük olmalıdır' }
          })}
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="0.0"
        />
        {errors.weight && (
          <p className="mt-1 text-sm text-red-600">{errors.weight.message}</p>
        )}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Sağlık Durumu <span className="text-red-500">*</span>
        </label>
        <select
          {...register('health_status', { required: 'Sağlık durumu zorunludur' })}
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="">Seçiniz</option>
          <option value="healthy">Sağlıklı</option>
          <option value="sick">Hasta</option>
          <option value="treatment">Tedavi Altında</option>
        </select>
        {errors.health_status && (
          <p className="mt-1 text-sm text-red-600">{errors.health_status.message}</p>
        )}
      </div>

      <div>
        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            {...register('vaccination_status')}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label className="ml-2 block text-sm text-gray-900">
            Aşıları tam
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notlar
        </label>
        <textarea
          {...register('notes')}
          rows={4}
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="Ek bilgiler, özel durumlar, sağlık notları..."
        />
      </div>

      <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <Info className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              Hayvan kaydı oluşturulduktan sonra fotoğraf ekleyebilir ve sağlık kayıtlarını düzenleyebilirsiniz.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div>
        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            id="pedigree_registered"
            {...register('pedigree_registered')}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="pedigree_registered" className="ml-2 block text-sm text-gray-900">
            Pedigree kaydı var
          </label>
        </div>
      </div>

      {pedigreeRegistered && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pedigree Numarası
            </label>
            <input
              type="text"
              {...register('pedigree_number')}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="PED-12345"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Genetik Değer (0-100)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                {...register('genetic_merit', {
                  min: { value: 0, message: 'Değer 0-100 arasında olmalıdır' },
                  max: { value: 100, message: 'Değer 0-100 arasında olmalıdır' }
                })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="85"
              />
              {errors.genetic_merit && (
                <p className="mt-1 text-sm text-red-600">{errors.genetic_merit.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vücut Kondisyon Skoru (1-5)
              </label>
              <input
                type="number"
                step="0.1"
                min="1"
                max="5"
                {...register('body_condition_score', {
                  min: { value: 1, message: 'Değer 1-5 arasında olmalıdır' },
                  max: { value: 5, message: 'Değer 1-5 arasında olmalıdır' }
                })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="3.5"
              />
              {errors.body_condition_score && (
                <p className="mt-1 text-sm text-red-600">{errors.body_condition_score.message}</p>
              )}
            </div>
          </div>

          {gender === 'female' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Süt Verimi Potansiyeli (L)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  {...register('milk_yield_potential', {
                    min: { value: 0, message: 'Değer 0\'dan büyük olmalıdır' }
                  })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="30.5"
                />
                {errors.milk_yield_potential && (
                  <p className="mt-1 text-sm text-red-600">{errors.milk_yield_potential.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Yağ Oranı (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  {...register('fat_percentage', {
                    min: { value: 0, message: 'Değer 0-10 arasında olmalıdır' },
                    max: { value: 10, message: 'Değer 0-10 arasında olmalıdır' }
                  })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="3.8"
                />
                {errors.fat_percentage && (
                  <p className="mt-1 text-sm text-red-600">{errors.fat_percentage.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Protein Oranı (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  {...register('protein_percentage', {
                    min: { value: 0, message: 'Değer 0-10 arasında olmalıdır' },
                    max: { value: 10, message: 'Değer 0-10 arasında olmalıdır' }
                  })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="3.2"
                />
                {errors.protein_percentage && (
                  <p className="mt-1 text-sm text-red-600">{errors.protein_percentage.message}</p>
                )}
              </div>
            </div>
          )}
        </>
      )}

      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <Info className="h-5 w-5 text-yellow-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              Pedigree bilgileri, hayvanın soy ağacı ve genetik özellikleri hakkında detaylı bilgi sağlar. Bu bilgiler damızlık değeri ve üretim potansiyelini belirlemede önemlidir.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl">
        <div className="border-b p-4 sm:p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Yeni Hayvan Ekle</h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-4 sm:p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {renderStepIndicator()}

          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}

          <div className="mt-6 flex justify-between">
            <button
              type="button"
              onClick={() => currentStep > 1 && setCurrentStep(currentStep - 1)}
              className={`px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                currentStep === 1 ? 'invisible' : ''
              }`}
              disabled={isSubmitting}
            >
              Geri
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={isSubmitting}
              >
                İptal
              </button>
              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep(currentStep + 1)}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Devam
                </button>
              ) : (
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}