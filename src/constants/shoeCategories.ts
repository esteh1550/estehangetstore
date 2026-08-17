export interface ShoeModelCategory {
  id: string;
  name: string;
  subTypes: string[];
}

export const SHOE_BRANDS = [
  'Nike',
  'Adidas',
  'Puma',
  'BALENCIAGA',
  'LV',
  'GUCCI',
  'ON CLOUD',
  'New Balance',
  'Converse',
  'Vans'
] as const;

export type ShoeBrand = typeof SHOE_BRANDS[number];

export const SHOE_MODELS: ShoeModelCategory[] = [
  {
    id: 'Sepatu Kasual / Lifestyle',
    name: 'Sepatu Kasual / Lifestyle',
    subTypes: [
      'Sneakers Low-top',
      'Sneakers High-top',
      'Slip-on',
      'Canvas Sneakers'
    ]
  },
  {
    id: 'Sepatu Olahraga',
    name: 'Sepatu Olahraga',
    subTypes: [
      'Running Shoes',
      'Training / Cross-training',
      'Basket',
      'Bola',
      'Futsal',
      'Hiking'
    ]
  },
  {
    id: 'Sepatu Formal & Semi-Formal',
    name: 'Sepatu Formal & Semi-Formal',
    subTypes: [
      'Oxford & Derby',
      'Loafers',
      'Monk Strap'
    ]
  },
  {
    id: 'Sepatu Wanita',
    name: 'Sepatu Wanita',
    subTypes: [
      'Flat Shoes / Ballerina',
      'Stiletto',
      'Pumps',
      'Kitten Heels',
      'Wedges'
    ]
  }
];
