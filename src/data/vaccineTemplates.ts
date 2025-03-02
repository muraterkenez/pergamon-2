import { VaccinationTemplate } from '../types/health';

export const VACCINE_TEMPLATES: VaccinationTemplate[] = [
  {
    id: 'sap',
    name: 'Şap Aşısı',
    description: 'Şap hastalığına karşı zorunlu koruma aşısı',
    type: 'mandatory',
    recommendedAge: {
      min: 2,
      unit: 'month'
    },
    schedule: [
      { dayOffset: 0, type: 'Şap Aşısı', description: 'İlk doz' },
      { dayOffset: 21, type: 'Şap Aşısı', description: 'Rapel' },
      { dayOffset: 180, type: 'Şap Aşısı', description: '6 aylık tekrar' }
    ],
    notes: 'Yılda 2 kez tekrarlanması zorunludur. Tarım Bakanlığı tarafından ücretsiz uygulanır.'
  },
  {
    id: 'brucella',
    name: 'Brucella (S19)',
    description: 'Brusella hastalığına karşı zorunlu aşı',
    type: 'mandatory',
    recommendedAge: {
      min: 4,
      max: 8,
      unit: 'month'
    },
    schedule: [
      { dayOffset: 0, type: 'Brucella S19', description: 'Tek doz (dişi buzağılar için)' }
    ],
    notes: 'Sadece 4-8 aylık dişi buzağılara uygulanır. Tarım Bakanlığı tarafından ücretsiz uygulanır.'
  },
  {
    id: 'lsd',
    name: 'LSD (Nodüler Ekzantem)',
    description: 'Lumpy Skin Disease hastalığına karşı zorunlu aşı',
    type: 'mandatory',
    recommendedAge: {
      min: 3,
      unit: 'month'
    },
    schedule: [
      { dayOffset: 0, type: 'LSD', description: 'İlk doz' },
      { dayOffset: 28, type: 'LSD', description: 'Rapel' }
    ],
    notes: 'Yıllık tekrar gerektirir. Tarım Bakanlığı tarafından ücretsiz uygulanır.'
  },
  {
    id: 'anthrax',
    name: 'Şarbon Aşısı',
    description: 'Şarbon hastalığına karşı koruyucu aşı',
    type: 'recommended',
    recommendedAge: {
      min: 6,
      unit: 'month'
    },
    schedule: [
      { dayOffset: 0, type: 'Şarbon', description: 'Yıllık tek doz' }
    ],
    notes: 'Riskli bölgelerde yıllık aşılama önerilir.'
  },
  {
    id: 'clostridial',
    name: 'Clostridial Aşı',
    description: 'Enterotoksemi ve diğer clostridial hastalıklara karşı koruma',
    type: 'recommended',
    recommendedAge: {
      min: 2,
      unit: 'month'
    },
    schedule: [
      { dayOffset: 0, type: 'Clostridial', description: 'İlk doz' },
      { dayOffset: 21, type: 'Clostridial', description: 'Rapel' },
      { dayOffset: 365, type: 'Clostridial', description: 'Yıllık tekrar' }
    ],
    notes: 'Yıllık tekrar önerilir. Özellikle yoğun besleme yapılan işletmelerde önemlidir.'
  },
  {
    id: 'ibr-bvd',
    name: 'IBR-BVD',
    description: 'Solunum yolu ve üreme sistemi viral hastalıklarına karşı koruma',
    type: 'recommended',
    recommendedAge: {
      min: 6,
      unit: 'month'
    },
    schedule: [
      { dayOffset: 0, type: 'IBR-BVD', description: 'İlk doz' },
      { dayOffset: 21, type: 'IBR-BVD', description: 'Rapel' },
      { dayOffset: 180, type: 'IBR-BVD', description: '6 aylık tekrar' }
    ],
    notes: '6 ayda bir tekrar önerilir. Sürü sağlığı için önemlidir.'
  },
  {
    id: 'pasteurella',
    name: 'Pasteurella',
    description: 'Pnömoni ve solunum yolu enfeksiyonlarına karşı koruma',
    type: 'recommended',
    recommendedAge: {
      min: 2,
      unit: 'month'
    },
    schedule: [
      { dayOffset: 0, type: 'Pasteurella', description: 'İlk doz' },
      { dayOffset: 21, type: 'Pasteurella', description: 'Rapel' }
    ],
    notes: 'Özellikle sonbahar ve kış aylarında önerilir.'
  },
  {
    id: 'brsv-pi3',
    name: 'BRSV-PI3',
    description: 'Viral solunum yolu hastalıklarına karşı koruma',
    type: 'recommended',
    recommendedAge: {
      min: 3,
      unit: 'month'
    },
    schedule: [
      { dayOffset: 0, type: 'BRSV-PI3', description: 'İlk doz' },
      { dayOffset: 21, type: 'BRSV-PI3', description: 'Rapel' }
    ],
    notes: 'Solunum sistemi hastalıklarının önlenmesinde önemlidir.'
  },
  {
    id: 'newborn',
    name: 'Yeni Doğan Buzağı Programı',
    description: 'Yeni doğan buzağılar için kapsamlı aşı programı',
    type: 'program',
    recommendedAge: {
      min: 0,
      max: 6,
      unit: 'month'
    },
    schedule: [
      { dayOffset: 0, type: 'Vitamin E + Selenium', description: 'Doğum sonrası ilk gün' },
      { dayOffset: 7, type: 'Clostridial', description: '1. hafta' },
      { dayOffset: 30, type: 'Pasteurella', description: '1. ay' },
      { dayOffset: 45, type: 'Clostridial', description: 'Rapel' },
      { dayOffset: 60, type: 'BRSV-PI3', description: '2. ay' },
      { dayOffset: 120, type: 'Şap', description: '4. ay (zorunlu)' }
    ],
    notes: 'Buzağı kayıplarını önlemek için önerilen kapsamlı program.'
  },
  {
    id: 'adult',
    name: 'Yetişkin Sığır Programı',
    description: 'Yetişkin sığırlar için yıllık aşı programı',
    type: 'program',
    recommendedAge: {
      min: 12,
      unit: 'month'
    },
    schedule: [
      { dayOffset: 0, type: 'Şap', description: '1. doz (zorunlu)' },
      { dayOffset: 21, type: 'IBR-BVD', description: 'Viral hastalıklar' },
      { dayOffset: 30, type: 'Clostridial', description: 'Yıllık tekrar' },
      { dayOffset: 180, type: 'Şap', description: '2. doz (zorunlu)' }
    ],
    notes: 'Yetişkin sığırlar için temel koruma programı.'
  }
];