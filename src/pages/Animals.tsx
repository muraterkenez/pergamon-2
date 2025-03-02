import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, Calendar, Activity, Milk, Trash2, Edit, Eye, AlertCircle, ChevronDown } from 'lucide-react';
import { useAnimals } from '../hooks/useAnimals';
import { format, differenceInMonths, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { AddAnimalModal } from '../components/modals/AddAnimalModal';
import { DeleteAnimalModal } from '../components/modals/DeleteAnimalModal';
import { ViewAnimalModal } from '../components/modals/ViewAnimalModal';
import { AddMilkProductionModal } from '../components/modals/AddMilkProductionModal';
import { AddHealthRecordModal } from '../components/modals/AddHealthRecordModal';
import { EditAnimalModal } from '../components/modals/EditAnimalModal';
import { Tables } from '../lib/types';

export function Animals() {
  const { animals, loading, error, refetchAnimals } = useAnimals();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'sold' | 'deceased'>('all');
  const [filterGender, setFilterGender] = useState<'all' | 'male' | 'female'>('all');
  const [sortBy, setSortBy] = useState<'tag' | 'name' | 'age' | 'status'>('tag');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedAnimal, setSelectedAnimal] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [animalToDelete, setAnimalToDelete] = useState<Tables['animals']['Row'] | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [animalToView, setAnimalToView] = useState<Tables['animals']['Row'] | null>(null);
  const [isMilkModalOpen, setIsMilkModalOpen] = useState(false);
  const [animalForMilk, setAnimalForMilk] = useState<Tables['animals']['Row'] | null>(null);
  const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);
  const [animalForHealth, setAnimalForHealth] = useState<Tables['animals']['Row'] | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [animalToEdit, setAnimalToEdit] = useState<Tables['animals']['Row'] | null>(null);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);

  const handleDeleteClick = (animal: Tables['animals']['Row']) => {
    setAnimalToDelete(animal);
    setIsDeleteModalOpen(true);
  };

  const handleViewClick = (animal: Tables['animals']['Row']) => {
    setAnimalToView(animal);
    setIsViewModalOpen(true);
  };

  const handleMilkClick = (animal: Tables['animals']['Row']) => {
    setAnimalForMilk(animal);
    setIsMilkModalOpen(true);
  };

  const handleHealthClick = (animal: Tables['animals']['Row']) => {
    setAnimalForHealth(animal);
    setIsHealthModalOpen(true);
  };

  const handleEditClick = (animal: Tables['animals']['Row']) => {
    setAnimalToEdit(animal);
    setIsEditModalOpen(true);
  };

  const filteredAnimals = animals
    .filter(animal => 
      (searchTerm === '' || 
        animal.tag_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        animal.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        animal.breed.toLowerCase().includes(searchTerm.toLowerCase())
      ) &&
      (filterStatus === 'all' || animal.status === filterStatus) &&
      (filterGender === 'all' || animal.gender === filterGender)
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'tag':
          return sortOrder === 'asc' 
            ? a.tag_number.localeCompare(b.tag_number)
            : b.tag_number.localeCompare(a.tag_number);
        case 'name':
          return sortOrder === 'asc'
            ? (a.name || '').localeCompare(b.name || '')
            : (b.name || '').localeCompare(a.name || '');
        case 'age':
          const ageA = differenceInMonths(new Date(), new Date(a.birth_date));
          const ageB = differenceInMonths(new Date(), new Date(b.birth_date));
          return sortOrder === 'asc' ? ageA - ageB : ageB - ageA;
        case 'status':
          return sortOrder === 'asc'
            ? a.status.localeCompare(b.status)
            : b.status.localeCompare(a.status);
        default:
          return 0;
      }
    });

  const stats = {
    total: animals.length,
    active: animals.filter(a => a.status === 'active').length,
    male: animals.filter(a => a.gender === 'male').length,
    female: animals.filter(a => a.gender === 'female').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Veri yüklenirken bir hata oluştu</h3>
        <p className="text-gray-600 mt-2">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Üst Başlık */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hayvanlar</h1>
          <p className="text-gray-600">Toplam {filteredAnimals.length} hayvan listeleniyor</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto justify-center sm:justify-start"
        >
          <Plus className="h-5 w-5" />
          Yeni Hayvan Ekle
        </button>
      </div>

      {/* İstatistikler */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500">Toplam Hayvan</h3>
          </div>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500">Aktif Hayvan</h3>
          </div>
          <p className="mt-2 text-3xl font-semibold text-green-600">{stats.active}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500">Erkek</h3>
          </div>
          <p className="mt-2 text-3xl font-semibold text-blue-600">{stats.male}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500">Dişi</h3>
          </div>
          <p className="mt-2 text-3xl font-semibold text-purple-600">{stats.female}</p>
        </div>
      </div>

      {/* Filtreler ve Arama */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Arama yapın..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="relative">
            <button 
              onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
              className="flex items-center justify-between w-full px-4 py-2 border border-gray-300 rounded-lg bg-white"
            >
              <div className="flex items-center">
                <Filter className="h-5 w-5 text-gray-400 mr-2" />
                <span>Filtreler</span>
              </div>
              <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${isFilterMenuOpen ? 'transform rotate-180' : ''}`} />
            </button>
            
            {isFilterMenuOpen && (
              <div className="absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
                    className="w-full border border-gray-300 rounded-lg p-2"
                  >
                    <option value="all">Tüm Durumlar</option>
                    <option value="active">Aktif</option>
                    <option value="sold">Satıldı</option>
                    <option value="deceased">Vefat</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cinsiyet</label>
                  <select
                    value={filterGender}
                    onChange={(e) => setFilterGender(e.target.value as typeof filterGender)}
                    className="w-full border border-gray-300 rounded-lg p-2"
                  >
                    <option value="all">Tüm Cinsiyetler</option>
                    <option value="male">Erkek</option>
                    <option value="female">Dişi</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sıralama</label>
                  <select
                    value={`${sortBy}-${sortOrder}`}
                    onChange={(e) => {
                      const [newSortBy, newSortOrder] = e.target.value.split('-');
                      setSortBy(newSortBy as typeof sortBy);
                      setSortOrder(newSortOrder as typeof sortOrder);
                    }}
                    className="w-full border border-gray-300 rounded-lg p-2"
                  >
                    <option value="tag-asc">Küpe No (A-Z)</option>
                    <option value="tag-desc">Küpe No (Z-A)</option>
                    <option value="name-asc">İsim (A-Z)</option>
                    <option value="name-desc">İsim (Z-A)</option>
                    <option value="age-asc">Yaş (Küçükten Büyüğe)</option>
                    <option value="age-desc">Yaş (Büyükten Küçüğe)</option>
                    <option value="status-asc">Durum (A-Z)</option>
                    <option value="status-desc">Durum (Z-A)</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tablo */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Küpe No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İsim
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Yaş
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cinsiyet
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Irk
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Son Kontrol
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAnimals.map((animal) => (
                <tr 
                  key={animal.id} 
                  className={`hover:bg-gray-50 ${selectedAnimal === animal.id ? 'bg-blue-50' : ''}`}
                  onClick={() => setSelectedAnimal(animal.id)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-gray-900">
                        {animal.tag_number}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{animal.name || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {differenceInMonths(new Date(), parseISO(animal.birth_date))} Aylık
                    </div>
                    <div className="text-xs text-gray-500">
                      {format(parseISO(animal.birth_date), 'd MMMM yyyy', { locale: tr })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${animal.gender === 'male' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                      {animal.gender === 'male' ? 'Erkek' : 'Dişi'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {animal.breed}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                      ${animal.status === 'active' ? 'bg-green-100 text-green-800' : ''}
                      ${animal.status === 'sold' ? 'bg-yellow-100 text-yellow-800' : ''}
                      ${animal.status === 'deceased' ? 'bg-red-100 text-red-800' : ''}
                    `}>
                      {animal.status === 'active' ? 'Aktif' :
                       animal.status === 'sold' ? 'Satıldı' : 'Vefat'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {animal.last_check_date ? 
                        format(parseISO(animal.last_check_date), 'd MMMM yyyy', { locale: tr }) : 
                        'Kontrol yok'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button 
                        className="text-blue-600 hover:text-blue-900"
                        title="Detay Görüntüle"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewClick(animal);
                        }}
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                      <Link 
                        to={`/animals/${animal.id}/pedigree`}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Pedigree"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        <Calendar className="h-5 w-5" />
                      </Link>
                      <button 
                        className="text-green-600 hover:text-green-900"
                        title="Sağlık Kaydı"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleHealthClick(animal);
                        }}
                      >
                        <Activity className="h-5 w-5" />
                      </button>
                      {animal.gender === 'female' && (
                        <button 
                          className="text-purple-600 hover:text-purple-900"
                          title="Süt Üretimi"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMilkClick(animal);
                          }}
                        >
                          <Milk className="h-5 w-5" />
                        </button>
                      )}
                      <button 
                        className="text-yellow-600 hover:text-yellow-900"
                        title="Düzenle"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditClick(animal);
                        }}
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button 
                        className="text-red-600 hover:text-red-900"
                        title="Sil"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(animal);
                        }}
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredAnimals.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    Arama kriterlerine uygun hayvan bulunamadı
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Mobil görünüm için kart listesi */}
        <div className="md:hidden">
          {filteredAnimals.map((animal) => (
            <div 
              key={animal.id}
              className={`p-4 border-b ${selectedAnimal === animal.id ? 'bg-blue-50' : ''}`}
              onClick={() => setSelectedAnimal(animal.id)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium">{animal.tag_number}</div>
                  <div className="text-sm text-gray-500">{animal.name || '-'}</div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full
                  ${animal.status === 'active' ? 'bg-green-100 text-green-800' : ''}
                  ${animal.status === 'sold' ? 'bg-yellow-100 text-yellow-800' : ''}
                  ${animal.status === 'deceased' ? 'bg-red-100 text-red-800' : ''}
                `}>
                  {animal.status === 'active' ? 'Aktif' :
                   animal.status === 'sold' ? 'Satıldı' : 'Vefat'}
                </span>
              </div>
              
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">Yaş:</span> {differenceInMonths(new Date(), parseISO(animal.birth_date))} Aylık
                </div>
                <div>
                  <span className="text-gray-500">Cinsiyet:</span> {animal.gender === 'male' ? 'Erkek' : 'Dişi'}
                </div>
                <div>
                  <span className="text-gray-500">Irk:</span> {animal.breed}
                </div>
                <div>
                  <span className="text-gray-500">Son Kontrol:</span> {animal.last_check_date ? 
                    format(parseISO(animal.last_check_date), 'd MMM', { locale: tr }) : 
                    'Yok'}
                </div>
              </div>
              
              <div className="mt-3 flex justify-end space-x-2">
                <button 
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewClick(animal);
                  }}
                >
                  <Eye className="h-5 w-5" />
                </button>
                <Link 
                  to={`/animals/${animal.id}/pedigree`}
                  className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Calendar className="h-5 w-5" />
                </Link>
                <button 
                  className="p-2 text-green-600 hover:bg-green-50 rounded-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleHealthClick(animal);
                  }}
                >
                  <Activity className="h-5 w-5" />
                </button>
                {animal.gender === 'female' && (
                  <button 
                    className="p-2 text-purple-600 hover:bg-purple-50 rounded-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMilkClick(animal);
                    }}
                  >
                    <Milk className="h-5 w-5" />
                  </button>
                )}
                <button 
                  className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditClick(animal);
                  }}
                >
                  <Edit className="h-5 w-5" />
                </button>
                <button 
                  className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteClick(animal);
                  }}
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
          
          {filteredAnimals.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              Arama kriterlerine uygun hayvan bulunamadı
            </div>
          )}
        </div>
      </div>

      {/* Modallar */}
      <AddAnimalModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={refetchAnimals}
      />

      {animalToDelete && (
        <DeleteAnimalModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setAnimalToDelete(null);
          }}
          onSuccess={refetchAnimals}
          animal={animalToDelete}
        />
      )}

      {animalToView && (
        <ViewAnimalModal
          isOpen={isViewModalOpen}
          onClose={() => {
            setIsViewModalOpen(false);
            setAnimalToView(null);
          }}
          animal={animalToView}
        />
      )}

      {animalForMilk && (
        <AddMilkProductionModal
          isOpen={isMilkModalOpen}
          onClose={() => {
            setIsMilkModalOpen(false);
            setAnimalForMilk(null);
          }}
          onSuccess={refetchAnimals}
          animal={animalForMilk}
        />
      )}

      {animalForHealth && (
        <AddHealthRecordModal
          isOpen={isHealthModalOpen}
          onClose={() => {
            setIsHealthModalOpen(false);
            setAnimalForHealth(null);
          }}
          onSuccess={refetchAnimals}
          animal={animalForHealth}
        />
      )}

      {animalToEdit && (
        <EditAnimalModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setAnimalToEdit(null);
          }}
          onSuccess={refetchAnimals}
          animal={animalToEdit}
        />
      )}
    </div>
  );
}