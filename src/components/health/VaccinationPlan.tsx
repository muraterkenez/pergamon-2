import React, { useState } from 'react';
import { Calendar, Plus, AlertCircle, Info, Download, Search, Filter, Edit, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { format, addDays, parseISO, differenceInDays, differenceInMonths } from 'date-fns';
import { tr } from 'date-fns/locale';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Tables } from '../../lib/types';
import * as XLSX from 'xlsx';
import { VACCINE_TEMPLATES } from '../../data/vaccineTemplates';

interface VaccinationPlan {
  id: string;
  animal_id: string;
  date: string;
  type: string;
  description: string;
  status: 'pending' | 'completed' | 'cancelled';
  animal: {
    tag_number: string;
    name: string | null;
  };
}

type Animal = Tables['animals']['Row'] & {
  last_vaccination?: string;
  health_records?: Array<{
    date: string;
    type: string;
  }>;
};

export function VaccinationPlan() {
  const { user } = useAuth();
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [plans, setPlans] = useState<VaccinationPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState(VACCINE_TEMPLATES[0]);
  const [selectedAnimals, setSelectedAnimals] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [searchTerm, setSearchTerm] = useState('');
  const [ageFilter, setAgeFilter] = useState<'all' | 'recommended'>('all');
  const [success, setSuccess] = useState<string | null>(null);
  const [editingPlan, setEditingPlan] = useState<VaccinationPlan | null>(null);

  React.useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [animalsData, plansData] = await Promise.all([
        supabase
          .from('animals')
          .select(`
            *,
            health_records (
              date,
              type
            )
          `)
          .eq('status', 'active')
          .order('tag_number', { ascending: true }),
        supabase
          .from('health_records')
          .select(`
            *,
            animal:animals (
              tag_number,
              name
            )
          `)
          .eq('type', 'vaccination')
          .order('date', { ascending: true })
      ]);

      if (animalsData.error) throw animalsData.error;
      if (plansData.error) throw plansData.error;

      const processedAnimals = (animalsData.data || []).map(animal => ({
        ...animal,
        last_vaccination: animal.health_records
          ?.filter(record => record.type === 'vaccination')
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]?.date
      }));

      setAnimals(processedAnimals);
      setPlans(plansData.data as VaccinationPlan[]);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Veriler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async () => {
    if (!user || selectedAnimals.length === 0) return;

    try {
      setError(null);
      const records = selectedAnimals.flatMap(animalId => 
        selectedTemplate.schedule.map(item => ({
          animal_id: animalId,
          date: format(addDays(new Date(startDate), item.dayOffset), 'yyyy-MM-dd'),
          type: 'vaccination',
          description: `${item.type} - ${item.description}`,
          user_id: user.id
        }))
      );

      const { error: insertError } = await supabase
        .from('health_records')
        .insert(records);

      if (insertError) throw insertError;

      setSuccess('Aşı planı başarıyla oluşturuldu!');
      setTimeout(() => setSuccess(null), 3000);

      // Reset form and refresh data
      setSelectedAnimals([]);
      setStartDate(format(new Date(), 'yyyy-MM-dd'));
      fetchData();
    } catch (err) {
      console.error('Error creating vaccination plan:', err);
      setError('Aşı planı oluşturulurken bir hata oluştu');
    }
  };

  const handleUpdatePlan = async (planId: string, newDate: string) => {
    try {
      const { error: updateError } = await supabase
        .from('health_records')
        .update({ date: newDate })
        .eq('id', planId);

      if (updateError) throw updateError;

      setSuccess('Aşı planı başarıyla güncellendi!');
      setTimeout(() => setSuccess(null), 3000);
      setEditingPlan(null);
      fetchData();
    } catch (err) {
      console.error('Error updating vaccination plan:', err);
      setError('Aşı planı güncellenirken bir hata oluştu');
    }
  };

  const handleDeletePlan = async (planId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('health_records')
        .delete()
        .eq('id', planId);

      if (deleteError) throw deleteError;

      setSuccess('Aşı planı başarıyla silindi!');
      setTimeout(() => setSuccess(null), 3000);
      fetchData();
    } catch (err) {
      console.error('Error deleting vaccination plan:', err);
      setError('Aşı planı silinirken bir hata oluştu');
    }
  };

  const exportToExcel = () => {
    const data = plans.map(plan => ({
      'Küpe No': plan.animal.tag_number,
      'Hayvan Adı': plan.animal.name || '-',
      'Tarih': format(parseISO(plan.date), 'd MMMM yyyy', { locale: tr }),
      'Aşı': plan.description,
      'Durum': plan.status === 'completed' ? 'Tamamlandı' : 
               plan.status === 'cancelled' ? 'İptal Edildi' : 'Bekliyor'
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Aşı Planı');
    XLSX.writeFile(wb, `asi_plani_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  // ... (rest of the component remains the same until the render part)

  return (
    <div className="bg-white rounded-lg shadow">
      {/* ... (previous JSX remains the same) ... */}

      {/* Add a new section for existing vaccination plans */}
      <div className="mt-8 border-t pt-6">
        <h3 className="text-lg font-medium mb-4">Mevcut Aşı Planları</h3>
        <div className="space-y-4">
          {plans.map(plan => (
            <div key={plan.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{plan.animal.tag_number}</span>
                  {plan.animal.name && (
                    <span className="text-gray-500">({plan.animal.name})</span>
                  )}
                </div>
                <p className="text-sm text-gray-600">{plan.description}</p>
                <p className="text-sm text-gray-500">
                  {format(parseISO(plan.date), 'd MMMM yyyy', { locale: tr })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {editingPlan?.id === plan.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={editingPlan.date}
                      onChange={(e) => setEditingPlan({ ...editingPlan, date: e.target.value })}
                      min={format(new Date(), 'yyyy-MM-dd')}
                      className="rounded-md border-gray-300"
                    />
                    <button
                      onClick={() => handleUpdatePlan(plan.id, editingPlan.date)}
                      className="px-3 py-1 text-sm text-white bg-green-600 rounded-md hover:bg-green-700"
                    >
                      Kaydet
                    </button>
                    <button
                      onClick={() => setEditingPlan(null)}
                      className="px-3 py-1 text-sm text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
                    >
                      İptal
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => setEditingPlan(plan)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
                      title="Düzenle"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDeletePlan(plan.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                      title="Sil"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}

          {plans.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Henüz planlanmış aşı bulunmuyor
            </div>
          )}
        </div>
      </div>
    </div>
  );
}