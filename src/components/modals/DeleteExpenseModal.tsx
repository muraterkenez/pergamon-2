import React from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';

interface Expense {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
}

interface DeleteExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: (id: string) => Promise<void>;
  expense: Expense;
}

export function DeleteExpenseModal({ isOpen, onClose, onDelete, expense }: DeleteExpenseModalProps) {
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onDelete(expense.id);
      onClose();
    } catch (error) {
      console.error('Error deleting expense:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'feed': return 'Yem';
      case 'medicine': return 'İlaç';
      case 'equipment': return 'Ekipman';
      case 'other': return 'Diğer';
      default: return category;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="border-b p-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Gider Sil</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center gap-4 mb-6 p-4 bg-red-50 rounded-lg">
            <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-red-800">
                Bu işlem geri alınamaz!
              </h3>
              <p className="text-sm text-red-700 mt-1">
                Bu gider kaydı kalıcı olarak silinecektir.
              </p>
            </div>
          </div>

          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Silinecek Gider:</h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">
                <strong>Tarih:</strong> {format(parseISO(expense.date), 'd MMMM yyyy', { locale: tr })}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Kategori:</strong> {getCategoryName(expense.category)}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Açıklama:</strong> {expense.description}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Tutar:</strong> ₺{expense.amount.toFixed(2)}
              </p>
            </div>
          </div>

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