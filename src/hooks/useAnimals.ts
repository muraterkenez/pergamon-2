import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Tables } from '../lib/types';

type Animal = Tables['animals']['Row'] & {
  last_check_date?: string;
};

export function useAnimals() {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAnimals = useCallback(async () => {
    try {
      setLoading(true);
      
      // Hayvanları ve son kontrol tarihlerini getir
      const { data: animalsData, error: animalsError } = await supabase
        .from('animals')
        .select(`
          *,
          health_records (
            date
          )
        `)
        .order('tag_number', { ascending: true });

      if (animalsError) throw animalsError;

      // Son kontrol tarihlerini işle
      const processedAnimals = animalsData.map(animal => ({
        ...animal,
        last_check_date: animal.health_records?.[0]?.date
      }));

      setAnimals(processedAnimals);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Veriler yüklenirken bir hata oluştu'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnimals();
  }, [fetchAnimals]);

  return { animals, loading, error, refetchAnimals: fetchAnimals };
}