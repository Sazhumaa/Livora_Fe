export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  count: number;
  imageUrl: string;
}

export const MOCK_CATEGORIES: CategoryItem[] = [
  {
    id: 'cat-01',
    name: 'Music Festival',
    slug: 'music-festival',
    description: 'Multi-stage massive experiences, camping, and unforgettable stadium moments.',
    count: 14,
    imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'cat-02',
    name: 'Pop & K-Pop',
    slug: 'pop-kpop',
    description: 'Electrifying choreographies, stadium world tours, and global idol sensations.',
    count: 22,
    imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'cat-03',
    name: 'Rock & Alternative',
    slug: 'rock-alternative',
    description: 'Raw guitar anthems, mosh pits, and explosive headliner energy.',
    count: 18,
    imageUrl: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'cat-04',
    name: 'Electronic / EDM',
    slug: 'electronic-edm',
    description: 'Pulsing synth waves, laser spectacles, and high-frequency club nights.',
    count: 31,
    imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'cat-05',
    name: 'Jazz & Soul',
    slug: 'jazz-soul',
    description: 'Velvet brass melodies, intimate acoustics, and timeless vocal masterclasses.',
    count: 9,
    imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'cat-06',
    name: 'Indie & Local Scene',
    slug: 'indie-local',
    description: 'Underground venues, raw passion, and emerging breakthrough artists.',
    count: 27,
    imageUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=800&q=80',
  },
];
