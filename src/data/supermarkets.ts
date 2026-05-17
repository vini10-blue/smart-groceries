// Curated top supermarket chains per country, each with a SUGGESTED aisle
// order (category names match the seeded default categories). These are
// sensible starting templates based on how each chain typically lays out
// stores — not a live map of a specific store. Users edit to match reality.

export interface ChainTemplate {
  name: string;
  /** Category names in suggested walking order. Must match seeded category names. */
  layout: string[];
}

export interface Country {
  code: string;
  name: string;
  chains: ChainTemplate[];
}

const STANDARD = [
  'Produce',
  'Bread & Bakery',
  'Meat & Fish',
  'Dairy',
  'Pantry',
  'Snacks',
  'Drinks',
  'Frozen',
  'Household',
  'Personal Care',
  'Other',
];

const DISCOUNTER = [
  'Produce',
  'Bread & Bakery',
  'Pantry',
  'Snacks',
  'Drinks',
  'Dairy',
  'Meat & Fish',
  'Frozen',
  'Household',
  'Personal Care',
  'Other',
];

export const COUNTRIES: Country[] = [
  {
    code: 'NL',
    name: 'Netherlands',
    chains: [
      { name: 'Albert Heijn', layout: STANDARD },
      {
        name: 'Jumbo',
        layout: [
          'Produce',
          'Bread & Bakery',
          'Dairy',
          'Meat & Fish',
          'Pantry',
          'Snacks',
          'Drinks',
          'Frozen',
          'Household',
          'Personal Care',
          'Other',
        ],
      },
      { name: 'Lidl', layout: DISCOUNTER },
      { name: 'Aldi', layout: DISCOUNTER },
      { name: 'Plus', layout: STANDARD },
    ],
  },
  {
    code: 'PT',
    name: 'Portugal',
    chains: [
      { name: 'Continente', layout: STANDARD },
      { name: 'Pingo Doce', layout: STANDARD },
      { name: 'Lidl', layout: DISCOUNTER },
      { name: 'Auchan', layout: STANDARD },
      { name: 'Intermarché', layout: STANDARD },
    ],
  },
];
