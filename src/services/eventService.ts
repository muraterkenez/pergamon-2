import { supabase } from '../lib/supabase';
import { CalendarEvent, Task } from '../lib/types';
import { format, addDays } from 'date-fns';

export async function getUpcomingEvents(days: number = 30): Promise<CalendarEvent[]> {
  const startDate = format(new Date(), 'yyyy-MM-dd');
  const endDate = format(addDays(new Date(), days), 'yyyy-MM-dd');
  
  try {
    // Sağlık kayıtlarından etkinlikler
    const { data: healthRecords, error: healthError } = await supabase
      .from('health_records')
      .select('id, date, type, description, next_check_date')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (healthError) throw healthError;

    // Etkinlikleri dönüştür
    const events: CalendarEvent[] = (healthRecords || []).map(record => ({
      id: record.id,
      title: record.type === 'vaccination' ? 'Aşılama' : 'Sağlık Kontrolü',
      date: record.date,
      type: record.type === 'vaccination' ? 'vaccination' : 'health',
      description: record.description,
      status: 'pending',
      urgent: record.type === 'treatment'
    }));

    return events;
  } catch (error) {
    console.error('Error fetching events:', error);
    return [];
  }
}

export async function getUpcomingTasks(days: number = 7): Promise<Task[]> {
  const startDate = format(new Date(), 'yyyy-MM-dd');
  const endDate = format(addDays(new Date(), days), 'yyyy-MM-dd');
  
  try {
    // Sağlık kayıtlarından görevler
    const { data: healthTasks, error: healthError } = await supabase
      .from('health_records')
      .select('id, date, type, description')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (healthError) throw healthError;

    // Harcama kayıtlarından görevler
    const { data: expenseTasks, error: expenseError } = await supabase
      .from('expenses')
      .select('id, date, category, description, amount')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (expenseError) throw expenseError;

    // Görevleri birleştir ve dönüştür
    const tasks: Task[] = [
      ...(healthTasks || []).map(task => ({
        id: task.id,
        title: task.type === 'vaccination' ? 'Aşılama' : 'Sağlık Kontrolü',
        description: task.description,
        date: task.date,
        type: task.type === 'vaccination' ? 'vaccination' : 'health',
        status: 'pending',
        urgent: task.type === 'treatment'
      })),
      ...(expenseTasks || []).map(task => ({
        id: task.id,
        title: `${task.category} Ödemesi`,
        description: task.description,
        date: task.date,
        type: 'finance',
        status: 'pending',
        urgent: false
      }))
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return tasks;
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return [];
  }
}