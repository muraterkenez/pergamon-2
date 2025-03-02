import React from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { MilkProductionWithAnimal } from '../../lib/types';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';

interface DeleteMilkProductionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  production: MilkProductionWithAnimal;
}

export function DeleteMilkProductionModal({ isOpen, onClose, onSuccess, production }: DeleteMilkProductionModalProps) {
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setError(null);

      const { error: deleteError } = await supabase
        .from('milk_productions')
        .delete()
        .eq('id', production.id);

      if (deleteError) throw deleteError;

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error deleting milk production:', err);
      setError('Süt üretimi kaydı silinirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="border-b p-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Süt Üretimi Kaydını Sil</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-center gap-4 mb-4 p-4 bg-red-50 rounded-lg">
            <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-red-800">
                Bu işlem geri alınamaz!
              </h3>
              <p className="text-sm text-red-700 mt-1">
                Bu süt üretimi kaydı kalıcı olarak silinecektir.
              </p>
            </div>
          </div>

          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Silinecek Kayıt:</h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">
                <strong>Hayvan:</strong> {production.animals?.tag_number}
                {production.animals?.name && ` (${production.animals.name})`}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Tarih:</strong> {format(parseISO(production.date), 'd MMMM yyyy', { locale: tr })}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Miktar:</strong> {production.amount.toFixed(1)} L
              </p>
              {production.quality_score && (
                <p className="text-sm text-gray-600">
                  <strong>Kalite Puanı:</strong> {production.quality_score}/10
                </p>
              )}
            </div>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              disabled={isDeleting}
            >
              İptal
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              disabled={isDeleting}
            >
              {isDeleting ? 'Siliniyor...' : 'Sil'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}