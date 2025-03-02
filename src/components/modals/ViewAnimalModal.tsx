import React from 'react';
import { X, Calendar, Weight, Tag, Info, Activity, Milk } from 'lucide-react';
import { format, differenceInMonths, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Tables } from '../../lib/types';

interface ViewAnimalModalProps {
  isOpen: boolean;
  onClose: () => void;
  animal: Tables['animals']['Row'];
}

export function ViewAnimalModal({ isOpen, onClose, animal }: ViewAnimalModalProps) {
  if (!isOpen) return null;

  const ageInMonths = differenceInMonths(new Date(), parseISO(animal.birth_date));

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full">Aktif</span>;
      case 'sold':
        return <span className="px-2 py-1 text-xs font-medium text-yellow-800 bg-yellow-100 rounded-full">Satıldı</span>;
      case 'deceased':
        return <span className="px-2 py-1 text-xs font-medium text-red-800 bg-red-100 rounded-full">Vefat</span>;
      default:
        return null;
    }
  };

  const renderHealthStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <span className="px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full">Sağlıklı</span>;
      case 'sick':
        return <span className="px-2 py-1 text-xs font-medium text-red-800 bg-red-100 rounded-full">Hasta</span>;
      case 'treatment':
        return <span className="px-2 py-1 text-xs font-medium text-yellow-800 bg-yellow-100 rounded-full">Tedavi Altında</span>;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-3xl">
        <div className="border-b p-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Hayvan Detayı</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Temel Bilgiler */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Temel Bilgiler</h3>
              
              <div className="flex items-start gap-3">
                <Tag className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{animal.tag_number}</p>
                  <p className="text-sm text-gray-500">Küpe Numarası</p>
                </div>
              </div>

              {animal.name && (
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{animal.name}</p>
                    <p className="text-sm text-gray-500">İsim</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {format(parseISO(animal.birth_date), 'd MMMM yyyy', { locale: tr })}
                    <span className="text-gray-500 ml-2">({ageInMonths} aylık)</span>
                  </p>
                  <p className="text-sm text-gray-500">Doğum Tarihi</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Weight className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{animal.weight} kg</p>
                  <p className="text-sm text-gray-500">Ağırlık</p>
                </div>
              </div>
            </div>

            {/* Durum Bilgileri */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Durum Bilgileri</h3>

              <div className="flex items-start gap-3">
                <Activity className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="flex items-center gap-2">
                    {renderStatusBadge(animal.status)}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Durum</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Activity className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="flex items-center gap-2">
                    {renderHealthStatusBadge(animal.health_status)}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Sağlık Durumu</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Activity className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {animal.vaccination_status ? (
                      <span className="text-green-600">Aşıları Tam</span>
                    ) : (
                      <span className="text-yellow-600">Aşı Takibi Gerekli</span>
                    )}
                  </p>
                  <p className="text-sm text-gray-500">Aşı Durumu</p>
                </div>
              </div>
            </div>
          </div>

          {/* Notlar */}
          {animal.notes && (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Notlar</h3>
              <p className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">{animal.notes}</p>
            </div>
          )}

          {/* Aksiyon Butonları */}
          <div className="mt-8 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {/* TODO: Sağlık kaydı ekleme modalını aç */}}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <Activity className="h-4 w-4 mr-2" />
              Sağlık Kaydı Ekle
            </button>
            {animal.gender === 'female' && (
              <button
                type="button"
                onClick={() => {/* TODO: Süt üretimi kaydı ekleme modalını aç */}}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                <Milk className="h-4 w-4 mr-2" />
                Süt Üretimi Ekle
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}