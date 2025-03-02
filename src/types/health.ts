export interface VaccinationTemplate {
  id: string;
  name: string;
  description: string;
  type: 'mandatory' | 'recommended' | 'program';
  recommendedAge?: {
    min: number;
    max?: number;
    unit: 'month' | 'year';
  };
  schedule: {
    dayOffset: number;
    type: string;
    description: string;
  }[];
  notes: string;
}

export interface MedicineTemplate {
  id: string;
  name: string;
  description: string;
  type: 'antibiotic' | 'antiinflammatory' | 'supplement' | 'other';
  dosage: {
    amount: number;
    unit: string;
    per: number;
    perUnit: 'kg' | 'animal';
  };
  schedule: {
    dayOffset: number;
    description: string;
  }[];
  notes: string;
  withdrawalPeriod: {
    milk: number;
    meat: number;
  };
}

export interface VaccinationRecord {
  id: string;
  animal_id: string;
  template_id: string;
  date: string;
  type: string;
  description: string;
  next_dose_date?: string;
  status: 'pending' | 'completed' | 'cancelled';
  notes?: string;
  created_at: string;
  user_id: string;
}

export interface VaccinationReminder {
  id: string;
  animal_id: string;
  date: string;
  description: string;
  priority: 'normal' | 'high';
  type: 'vaccination' | 'reminder' | 'treatment';
  status: 'pending' | 'completed' | 'cancelled';
  animal: {
    tag_number: string;
    name: string | null;
  };
}