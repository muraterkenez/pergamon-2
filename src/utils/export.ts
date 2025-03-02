import * as XLSX from 'xlsx';
import { MilkProductionWithAnimal } from '../lib/types';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';

export function exportToExcel(data: MilkProductionWithAnimal[], fileName: string) {
  const exportData = data.map(item => ({
    'Tarih': format(parseISO(item.date), 'd MMMM yyyy', { locale: tr }),
    'Hayvan No': item.animals?.tag_number || '',
    'Hayvan Adı': item.animals?.name || '',
    'Miktar (L)': item.amount,
    'Kalite Puanı': item.quality_score || '',
    'Notlar': item.notes || ''
  }));

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Süt Üretimi');
  XLSX.writeFile(wb, `${fileName}.xlsx`);
}