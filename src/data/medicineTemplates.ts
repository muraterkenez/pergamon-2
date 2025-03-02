import { MedicineTemplate } from '../types/health';

export const MEDICINE_TEMPLATES: MedicineTemplate[] = [
  // Antibiyotikler
  {
    id: 'amoxicillin-la',
    name: 'Amoksisilin LA',
    description: 'Uzun etkili geniş spektrumlu penisilin grubu antibiyotik',
    type: 'antibiotic',
    dosage: {
      amount: 1,
      unit: 'ml',
      per: 10,
      perUnit: 'kg'
    },
    schedule: [
      { dayOffset: 0, description: 'İlk doz' },
      { dayOffset: 48, description: '2. doz (gerekirse)' }
    ],
    notes: 'Kas içi enjeksiyon. 48 saat etkili.',
    withdrawalPeriod: {
      milk: 4,
      meat: 18
    }
  },
  {
    id: 'ceftiofur',
    name: 'Seftiofur',
    description: '3. kuşak sefalosporin grubu antibiyotik',
    type: 'antibiotic',
    dosage: {
      amount: 1,
      unit: 'ml',
      per: 50,
      perUnit: 'kg'
    },
    schedule: [
      { dayOffset: 0, description: 'İlk doz' },
      { dayOffset: 24, description: '2. doz' },
      { dayOffset: 48, description: '3. doz' }
    ],
    notes: 'Kas içi veya deri altı enjeksiyon. Solunum yolu enfeksiyonlarında etkili.',
    withdrawalPeriod: {
      milk: 0,
      meat: 8
    }
  },
  {
    id: 'enrofloxacin',
    name: 'Enrofloksasin',
    description: 'Florokinolon grubu geniş spektrumlu antibiyotik',
    type: 'antibiotic',
    dosage: {
      amount: 1,
      unit: 'ml',
      per: 40,
      perUnit: 'kg'
    },
    schedule: [
      { dayOffset: 0, description: 'İlk doz' },
      { dayOffset: 24, description: '2. doz' },
      { dayOffset: 48, description: '3. doz' }
    ],
    notes: 'Kas içi veya deri altı enjeksiyon. Ciddi enfeksiyonlarda tercih edilir.',
    withdrawalPeriod: {
      milk: 4,
      meat: 10
    }
  },
  {
    id: 'gentamicin',
    name: 'Gentamisin',
    description: 'Aminoglikozid grubu antibiyotik',
    type: 'antibiotic',
    dosage: {
      amount: 4,
      unit: 'ml',
      per: 100,
      perUnit: 'kg'
    },
    schedule: [
      { dayOffset: 0, description: 'İlk doz' },
      { dayOffset: 24, description: '2. doz' },
      { dayOffset: 48, description: '3. doz' }
    ],
    notes: 'Kas içi enjeksiyon. Böbrek fonksiyonları kontrol edilmeli.',
    withdrawalPeriod: {
      milk: 7,
      meat: 30
    }
  },
  {
    id: 'tylosin',
    name: 'Tilozin',
    description: 'Makrolid grubu antibiyotik',
    type: 'antibiotic',
    dosage: {
      amount: 1,
      unit: 'ml',
      per: 20,
      perUnit: 'kg'
    },
    schedule: [
      { dayOffset: 0, description: 'İlk doz' },
      { dayOffset: 24, description: '2. doz' },
      { dayOffset: 48, description: '3. doz' }
    ],
    notes: 'Kas içi enjeksiyon. Solunum ve sindirim sistemi enfeksiyonlarında etkili.',
    withdrawalPeriod: {
      milk: 4,
      meat: 28
    }
  },
  {
    id: 'reptopen',
    name: 'Reptopen',
    description: 'Penisilin + Streptomisin kombinasyonu',
    type: 'antibiotic',
    dosage: {
      amount: 1,
      unit: 'ml',
      per: 25,
      perUnit: 'kg'
    },
    schedule: [
      { dayOffset: 0, description: 'İlk doz' },
      { dayOffset: 24, description: '2. doz' },
      { dayOffset: 48, description: '3. doz' }
    ],
    notes: 'Kas içi enjeksiyon. Geniş spektrumlu etki.',
    withdrawalPeriod: {
      milk: 3,
      meat: 14
    }
  },
  // Ağrı Kesiciler ve Antiinflamatuarlar
  {
    id: 'ketoprofen',
    name: 'Ketoprofen',
    description: 'Non-steroid antiinflamatuar ilaç (NSAID)',
    type: 'antiinflammatory',
    dosage: {
      amount: 3,
      unit: 'ml',
      per: 100,
      perUnit: 'kg'
    },
    schedule: [
      { dayOffset: 0, description: 'İlk doz' },
      { dayOffset: 24, description: '2. doz' },
      { dayOffset: 48, description: '3. doz' }
    ],
    notes: 'Kas içi veya damar içi enjeksiyon. Ağrı ve ateş durumlarında kullanılır.',
    withdrawalPeriod: {
      milk: 0,
      meat: 4
    }
  },
  {
    id: 'meloxicam',
    name: 'Meloksikam',
    description: 'Selektif COX-2 inhibitörü NSAID',
    type: 'antiinflammatory',
    dosage: {
      amount: 2.5,
      unit: 'ml',
      per: 100,
      perUnit: 'kg'
    },
    schedule: [
      { dayOffset: 0, description: 'İlk doz' },
      { dayOffset: 24, description: '2. doz (gerekirse)' }
    ],
    notes: 'Deri altı enjeksiyon. Kronik ağrı ve yangı durumlarında tercih edilir.',
    withdrawalPeriod: {
      milk: 5,
      meat: 15
    }
  },
  {
    id: 'dexamethasone',
    name: 'Deksametazon',
    description: 'Kortikosteroid antiinflamatuar',
    type: 'antiinflammatory',
    dosage: {
      amount: 1,
      unit: 'ml',
      per: 50,
      perUnit: 'kg'
    },
    schedule: [
      { dayOffset: 0, description: 'Tek doz' }
    ],
    notes: 'Kas içi veya damar içi enjeksiyon. Şok ve alerjik durumlarda kullanılır.',
    withdrawalPeriod: {
      milk: 3,
      meat: 8
    }
  },
  // Vitamin ve Mineral Takviyeleri
  {
    id: 'vitamin-b-complex',
    name: 'B Vitamini Kompleks',
    description: 'B grubu vitaminleri kombinasyonu',
    type: 'supplement',
    dosage: {
      amount: 10,
      unit: 'ml',
      per: 1,
      perUnit: 'animal'
    },
    schedule: [
      { dayOffset: 0, description: 'İlk doz' },
      { dayOffset: 7, description: '2. doz (gerekirse)' }
    ],
    notes: 'Kas içi enjeksiyon. İştahsızlık ve stres durumlarında kullanılır.',
    withdrawalPeriod: {
      milk: 0,
      meat: 0
    }
  },
  {
    id: 'calcium-magnesium',
    name: 'Kalsiyum-Magnezyum',
    description: 'Hipokalsemi ve hipomagnezemide kullanılan mineral takviyesi',
    type: 'supplement',
    dosage: {
      amount: 500,
      unit: 'ml',
      per: 1,
      perUnit: 'animal'
    },
    schedule: [
      { dayOffset: 0, description: 'İlk doz' },
      { dayOffset: 12, description: '2. doz (gerekirse)' }
    ],
    notes: 'Yavaş damar içi infüzyon. Doğum felcinde acil kullanım.',
    withdrawalPeriod: {
      milk: 0,
      meat: 0
    }
  },
  {
    id: 'selenium-e',
    name: 'Selenyum-E Vitamini',
    description: 'Kas distrofisi ve üreme problemlerinde kullanılan kombinasyon',
    type: 'supplement',
    dosage: {
      amount: 1,
      unit: 'ml',
      per: 50,
      perUnit: 'kg'
    },
    schedule: [
      { dayOffset: 0, description: 'Tek doz' }
    ],
    notes: 'Kas içi enjeksiyon. Gebeliğin son döneminde önerilir.',
    withdrawalPeriod: {
      milk: 0,
      meat: 0
    }
  },
  // Antiparaziter İlaçlar
  {
    id: 'ivermectin',
    name: 'İvermektin',
    description: 'Geniş spektrumlu antiparaziter',
    type: 'other',
    dosage: {
      amount: 1,
      unit: 'ml',
      per: 50,
      perUnit: 'kg'
    },
    schedule: [
      { dayOffset: 0, description: 'Tek doz' }
    ],
    notes: 'Deri altı enjeksiyon. İç ve dış parazitlere karşı etkili.',
    withdrawalPeriod: {
      milk: 28,
      meat: 49
    }
  },
  {
    id: 'albendazole',
    name: 'Albendazol',
    description: 'Geniş spektrumlu antihelmintik',
    type: 'other',
    dosage: {
      amount: 1,
      unit: 'tablet',
      per: 50,
      perUnit: 'kg'
    },
    schedule: [
      { dayOffset: 0, description: 'Tek doz' }
    ],
    notes: 'Oral uygulama. Mide-bağırsak kurtlarına karşı etkili.',
    withdrawalPeriod: {
      milk: 5,
      meat: 14
    }
  },
  // Metabolik ve Hormonal İlaçlar
  {
    id: 'insulin',
    name: 'İnsülin',
    description: 'Ketozis tedavisinde kullanılan metabolik hormon',
    type: 'other',
    dosage: {
      amount: 100,
      unit: 'IU',
      per: 1,
      perUnit: 'animal'
    },
    schedule: [
      { dayOffset: 0, description: 'İlk doz' },
      { dayOffset: 24, description: '2. doz' }
    ],
    notes: 'Deri altı enjeksiyon. Kan şekeri takibi yapılmalı.',
    withdrawalPeriod: {
      milk: 0,
      meat: 0
    }
  },
  {
    id: 'oxytocin',
    name: 'Oksitosin',
    description: 'Doğum ve süt inme refleksini uyaran hormon',
    type: 'other',
    dosage: {
      amount: 2,
      unit: 'ml',
      per: 1,
      perUnit: 'animal'
    },
    schedule: [
      { dayOffset: 0, description: 'Tek doz' }
    ],
    notes: 'Kas içi enjeksiyon. Doğum sonrası plasenta atımında kullanılır.',
    withdrawalPeriod: {
      milk: 0,
      meat: 0
    }
  }
];