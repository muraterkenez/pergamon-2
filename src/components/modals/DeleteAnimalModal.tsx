import React from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface DeleteAnimalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  animal: {
    id: string;
    tag_number: string;
    name?: string | null;
  };
}

export function DeleteAnimalModal({ isOpen, onClose, onSuccess, animal }: DeleteAnimalModalProps) {
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setError(null);

      const { error: deleteError } = await supabase
        .from('animals')
        .delete()
        .eq('id', animal.id);

      if (deleteError) throw deleteError;

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error deleting animal:', err);
      setError('Hayvan silinirken bir hata oluştu. Lütfen tekrar deneyin.');
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
            <h2 className="text-xl font-semibold text-gray-900">Hayvan Sil</h2>
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
                Bu hayvanla ilişkili tüm kayıtlar (sağlık kayıtları, süt üretimi verileri vb.) kalıcı olarak silinecektir.
              </p>
            </div>
          </div>

          <p className="text-gray-600 mb-6">
            <strong>{animal.tag_number}</strong>
            {animal.name && <span> ({animal.name})</span>} numaralı hayvanı silmek istediğinizden emin misiniz?
          </p>

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
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
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