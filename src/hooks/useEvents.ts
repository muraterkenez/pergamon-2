import { useState, useEffect } from 'react';
import { CalendarEvent, Task } from '../lib/types';
import { getUpcomingEvents, getUpcomingTasks } from '../services/eventService';

export function useEvents(days: number = 30) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      try {
        setLoading(true);
        const [eventsData, tasksData] = await Promise.all([
          getUpcomingEvents(days),
          getUpcomingTasks(7) // Yaklaşan görevler için 7 gün
        ]);
        
        if (isMounted) {
          setEvents(eventsData);
          setTasks(tasksData);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Veri yüklenirken bir hata oluştu'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [days]);

  return { events, tasks, loading, error };
}