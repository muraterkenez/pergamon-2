import React from 'react';
import { MilkProductionWithAnimal } from '../../lib/types';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';

interface AnimalProductionReportProps {
  productions: MilkProductionWithAnimal[];
}

export function AnimalProductionReport({ productions }: AnimalProductionReportProps) {
  const animalProductions = productions.reduce((acc, curr) => {
    const key = curr.animal_id;
    if (!acc[key]) {
      acc[key] = {
        tag_number: curr.animals?.tag_number || '',
        name: curr.animals?.name || '',
        totalProduction: 0,
        averageQuality: 0,
        productionCount: 0,
        qualityCount: 0,
        productions: []
      };
    }
    
    acc[key].totalProduction += curr.amount;
    acc[key].productionCount += 1;
    if (curr.quality_score) {
      acc[key].averageQuality += curr.quality_score;
      acc[key].qualityCount += 1;
    }
    acc[key].productions.push(curr);
    
    return acc;
  }, {} as Record<string, {
    tag_number: string;
    name: string;
    totalProduction: number;
    averageQuality: number;
    productionCount: number;
    qualityCount: number;
    productions: MilkProductionWithAnimal[];
  }>);

  return (
    <div className="space-y-6">
      {Object.values(animalProductions).map((animal) => (
        <div key={animal.tag_number} className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b">
            <h3 className="text-lg font-medium text-gray-900">
              {animal.tag_number}
              {animal.name && <span className="text-gray-500 ml-2">({animal.name})</span>}
            </h3>
            <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Toplam Üretim</p>
                <p className="font-medium">{animal.totalProduction.toFixed(1)} L</p>
              </div>
              <div>
                <p className="text-gray-500">Günlük Ortalama</p>
                <p className="font-medium">
                  {(animal.totalProduction / animal.productionCount).toFixed(1)} L
                </p>
              </div>
              <div>
                <p className="text-gray-500">Ortalama Kalite</p>
                <p className="font-medium">
                  {animal.qualityCount > 0
                    ? (animal.averageQuality / animal.qualityCount).toFixed(1)
                    : '-'}
                </p>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tarih
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Miktar
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Kalite
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Notlar
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {animal.productions
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((production) => (
                    <tr key={production.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {format(parseISO(production.date), 'd MMMM yyyy', { locale: tr })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {production.amount.toFixed(1)} L
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {production.quality_score || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {production.notes || '-'}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}