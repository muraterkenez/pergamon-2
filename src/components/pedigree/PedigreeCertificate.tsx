import React from 'react';
import { Award, Calendar, Tag, Info, Dna } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';

interface PedigreeCertificateProps {
  animal: {
    tag_number: string;
    name: string | null;
    breed: string;
    gender: string;
    birth_date: string;
  };
  pedigree: {
    pedigree_number: string;
    registration_date: string;
    pedigree_class: string;
    genetic_merit_score: number;
    breeding_value: number;
    lineage: {
      sire: {
        tag_number: string | null;
        name: string | null;
      };
      dam: {
        tag_number: string | null;
        name: string | null;
      };
    };
    genetic_traits: Record<string, any>;
  };
}

export function PedigreeCertificate({ animal, pedigree }: PedigreeCertificateProps) {
  const getPedigreeClassColor = (pedigreeClass: string) => {
    switch (pedigreeClass) {
      case 'A': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'B': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'C': return 'bg-green-100 text-green-800 border-green-200';
      case 'D': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
      <div className="bg-blue-600 text-white p-6 text-center">
        <h1 className="text-2xl font-bold">RESMİ PEDİGREE SERTİFİKASI</h1>
        <p className="text-blue-100 mt-1">Bu belge hayvanın soy ağacını ve genetik özelliklerini resmi olarak belgelemektedir</p>
      </div>
      
      <div className="p-8">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{animal.tag_number}</h2>
            {animal.name && <p className="text-lg text-gray-700">{animal.name}</p>}
            <p className="text-sm text-gray-500 mt-1">{animal.breed}</p>
          </div>
          
          <div className={`px-4 py-2 rounded-lg border ${getPedigreeClassColor(pedigree.pedigree_class)}`}>
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              <span className="font-bold">{pedigree.pedigree_class} SINIFI</span>
            </div>
            <p className="text-xs mt-1">Pedigree No: {pedigree.pedigree_number}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Hayvan Bilgileri</h3>
            
            <div className="flex items-start gap-3">
              <Tag className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">Küpe Numarası</p>
                <p className="text-sm text-gray-700">{animal.tag_number}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">Irk</p>
                <p className="text-sm text-gray-700">{animal.breed}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">Cinsiyet</p>
                <p className="text-sm text-gray-700">{animal.gender === 'male' ? 'Erkek' : 'Dişi'}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">Doğum Tarihi</p>
                <p className="text-sm text-gray-700">
                  {format(parseISO(animal.birth_date), 'd MMMM yyyy', { locale: tr })}
                </p>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Pedigree Bilgileri</h3>
            
            <div className="flex items-start gap-3">
              <Award className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">Pedigree Numarası</p>
                <p className="text-sm text-gray-700">{pedigree.pedigree_number}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">Kayıt Tarihi</p>
                <p className="text-sm text-gray-700">
                  {format(parseISO(pedigree.registration_date), 'd MMMM yyyy', { locale: tr })}
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Dna className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">Genetik Değer Puanı</p>
                <div className="flex items-center mt-1">
                  <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                    <div 
                      className="h-2 rounded-full bg-blue-600" 
                      style={{ width: `${(pedigree.genetic_merit_score / 10) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {pedigree.genetic_merit_score.toFixed(1)}/10
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Dna className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">Damızlık Değeri (EBV)</p>
                <p className="text-sm text-gray-700">{pedigree.breeding_value}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">Ebeveyn Bilgileri</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="text-base font-medium text-blue-900 mb-2">Baba</h4>
              <p className="text-sm text-blue-800">
                Küpe No: {pedigree.lineage.sire.tag_number || 'Bilinmiyor'}
              </p>
              {pedigree.lineage.sire.name && (
                <p className="text-sm text-blue-800">
                  İsim: {pedigree.lineage.sire.name}
                </p>
              )}
            </div>
            
            <div className="bg-pink-50 p-4 rounded-lg">
              <h4 className="text-base font-medium text-pink-900 mb-2">Anne</h4>
              <p className="text-sm text-pink-800">
                Küpe No: {pedigree.lineage.dam.tag_number || 'Bilinmiyor'}
              </p>
              {pedigree.lineage.dam.name && (
                <p className="text-sm text-pink-800">
                  İsim: {pedigree.lineage.dam.name}
                </p>
              )}
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">Genetik Özellikler</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pedigree.genetic_traits && Object.entries(pedigree.genetic_traits).map(([trait, value]) => (
              <div key={trait} className="bg-gray-50 p-3 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900">{trait}</h4>
                <p className="text-sm text-gray-700">{value as string}</p>
              </div>
            ))}
            
            {(!pedigree.genetic_traits || Object.keys(pedigree.genetic_traits).length === 0) && (
              <div className="col-span-2 text-center py-4 text-gray-500">
                <p>Genetik özellik bilgisi bulunmuyor</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="bg-gray-50 p-6 border-t">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-500">Sertifika Tarihi: {format(new Date(), 'd MMMM yyyy', { locale: tr })}</p>
            <p className="text-sm text-gray-500">Belge No: CERT-{pedigree.pedigree_number}</p>
          </div>
          <div className="flex items-center gap-2">
            <Award className="h-6 w-6 text-blue-600" />
            <span className="text-sm font-medium text-blue-600">Resmi Pedigree Sertifikası</span>
          </div>
        </div>
      </div>
    </div>
  );
}