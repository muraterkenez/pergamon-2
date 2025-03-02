import { Database } from './database.types';

export type Tables = Database['public']['Tables'];

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: 'health' | 'vaccination' | 'quality' | 'finance';
  description?: string;
  status: 'pending' | 'completed' | 'cancelled';
  urgent?: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  date: string;
  type: 'health' | 'vaccination' | 'quality' | 'finance';
  status: 'pending' | 'completed' | 'cancelled';
  urgent?: boolean;
}

export interface MilkProductionWithAnimal extends Tables['milk_productions']['Row'] {
  animals: {
    tag_number: string;
    name: string | null;
  } | null;
}