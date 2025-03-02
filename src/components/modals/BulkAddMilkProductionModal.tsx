import React, { useState } from 'react';
import { X, AlertCircle, Upload, Download } from 'lucide-react';
import { useForm } from 'react-hook-form';
import Papa from 'papaparse';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface BulkAddMilkProductionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function BulkAddMilkProductionModal({ isOpen, onClose, onSuccess }: BulkAddMilkProductionModalProps) {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [preview, setPreview] = useState<any[]>([]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFile(file);
      Papa.parse(file, {
        complete: (results) => {
          setPreview(results.data.slice(0, 5));
        },
        header: true
      });
    }
  };

  const downloadTemplate = () => {
    const template = [
      {
        tag_number: 'TR1234567890',
        date: '2024-02-25',
        amount: '25.5',
        quality_score: '8',
        notes: 'Örnek kayıt'
      }
    ];

    const csv = Papa.unparse(template);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'sut_uretimi_sablonu.csv';
    link.click();
  };

  const handleSubmit = async () => {
    if (!file || !user) return;

    try {
      setIsSubmitting(true);
      setError(null);

      const results = await new Promise<any[]>((resolve, reject) => {
        Papa.parse(file, {
          complete: (results) => resolve(results.data),
          header: true,
          error: (error) => reject(error)
        });
      });

      // Önce hayvanları getir
      const { data: animals, error: animalsError } = await supabase
        .from('animals')
        .select('id, tag_number')
        .eq('user_id', user.id);

      if (animalsError) throw animalsError;

      const animalMap = new Map(animals.map(a => [a.tag_number, a.id]));

      // Kayıtları hazırla
      const records = results
        .filter(row => row.tag_number && row.date && row.amount)
        .map(row => ({
          animal_id: animalMap.get(row.tag_number),
          date: row.date,
          amount: parseFloat(row.amount),
          quality_score: row.quality_score ? parseInt(row.quality_score) : null,
          notes: row.notes || null,
          user_id: user.id
        }))
        .filter(record => record.animal_id); // Geçersiz hayvan numaralarını filtrele

      if (records.length === 0) {
        throw new Error('Geçerli kayıt bulunamadı. Lütfen şablonu kontrol edin.');
      }

      const { error: insertError } = await supabase
        .from('milk_productions')
        .insert(records);

      if (insertError) throw insertError;

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error bulk adding milk productions:', err);
      setError('Kayıtlar eklenirken bir hata oluştu. Lütfen şablonu kontrol edip tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl">
        <div className="border-b p-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Toplu Süt Üretimi Ekle</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
            >
              <Download className="h-5 w-5" />
              Şablonu İndir
            </button>
            <p className="text-sm text-gray-500 mt-2">
              Şablonu indirip, verilerinizi ekledikten sonra yükleyebilirsiniz.
            </p>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="flex flex-col items-center justify-center cursor-pointer"
            >
              <Upload className="h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">
                CSV dosyasını seçin veya buraya sürükleyin
              </p>
            </label>
          </div>

          {file && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-900">Seçilen dosya: {file.name}</h3>
              {preview.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Önizleme:</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          {Object.keys(preview[0]).map((header) => (
                            <th
                              key={header}
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {preview.map((row, index) => (
                          <tr key={index}>
                            {Object.values(row).map((value: any, i) => (
                              <td
                                key={i}
                                className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                              >
                                {value}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="mt-6 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={isSubmitting}
            >
              İptal
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              disabled={!file || isSubmitting}
            >
              {isSubmitting ? 'Yükleniyor...' : 'Kayıtları Ekle'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}