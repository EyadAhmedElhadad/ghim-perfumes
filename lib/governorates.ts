// Egypt's 27 governorates. The storefront UI is English, so the canonical
// `value` is the English name; `ar` is provided for bilingual/admin display.
export const GOVERNORATES = [
  'Cairo',
  'Giza',
  'Alexandria',
  'Qalyubia',
  'Port Said',
  'Suez',
  'Dakahlia',
  'Sharqia',
  'Gharbia',
  'Monufia',
  'Beheira',
  'Kafr El Sheikh',
  'Damietta',
  'Ismailia',
  'North Sinai',
  'South Sinai',
  'Faiyum',
  'Beni Suef',
  'Minya',
  'Asyut',
  'Sohag',
  'Qena',
  'Luxor',
  'Aswan',
  'Red Sea',
  'New Valley',
  'Matrouh',
] as const;

export type Governorate = (typeof GOVERNORATES)[number];

export const GOVERNORATES_AR: Record<Governorate, string> = {
  Cairo: 'القاهرة',
  Giza: 'الجيزة',
  Alexandria: 'الإسكندرية',
  Qalyubia: 'القليوبية',
  'Port Said': 'بورسعيد',
  Suez: 'السويس',
  Dakahlia: 'الدقهلية',
  Sharqia: 'الشرقية',
  Gharbia: 'الغربية',
  Monufia: 'المنوفية',
  Beheira: 'البحيرة',
  'Kafr El Sheikh': 'كفر الشيخ',
  Damietta: 'دمياط',
  Ismailia: 'الإسماعيلية',
  'North Sinai': 'شمال سيناء',
  'South Sinai': 'جنوب سيناء',
  Faiyum: 'الفيوم',
  'Beni Suef': 'بني سويف',
  Minya: 'المنيا',
  Asyut: 'أسيوط',
  Sohag: 'سوهاج',
  Qena: 'قنا',
  Luxor: 'الأقصر',
  Aswan: 'أسوان',
  'Red Sea': 'البحر الأحمر',
  'New Valley': 'الوادي الجديد',
  Matrouh: 'مطروح',
};

export function isGovernorate(value: string): value is Governorate {
  return (GOVERNORATES as readonly string[]).includes(value);
}
