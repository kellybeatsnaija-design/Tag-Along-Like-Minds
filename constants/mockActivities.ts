export interface ActiveMovement {
  id: string;
  partner_name: string;
  avatar_url: string;
  origin: string;
  destination: string;
  status: 'coordinating' | 'escrowed' | 'completed';
  time_window: string;
  shared_cost_kobo: number;
}

export const MOCK_MOVEMENTS: ActiveMovement[] = [
  {
    id: 'mov-101',
    partner_name: 'Lara (Lekki Study Circle)',
    avatar_url: 'https://dicebear.com',
    origin: 'Language practice',
    destination: 'Civic Center lounge',
    status: 'coordinating',
    time_window: 'Tonight • 6:30 PM',
    shared_cost_kobo: 200000
  },
  {
    id: 'mov-102',
    partner_name: 'Tunde (VI Learning Hub)',
    avatar_url: 'https://dicebear.com',
    origin: 'Coding study',
    destination: 'Ikoyi co-working room',
    status: 'escrowed',
    time_window: 'Tomorrow • 8:10 PM',
    shared_cost_kobo: 350000
  }
];
