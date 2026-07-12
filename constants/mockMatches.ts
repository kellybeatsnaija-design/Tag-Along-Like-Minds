export interface AvailableIntent {
  intent_id: string;
  creator_name: string;
  reputation: number;
  community_badge: string;
  intent_tag: string;
  origin_label: string;
  destination_label: string;
  time_window: string;
  group_size: number;
  matched_count: number;
  participants: string[];
  status: 'Open' | 'Requested' | 'Confirmed' | 'Closed';
  request_status: 'none' | 'requested' | 'confirmed';
  avatar_url: string;
  match_vibe: 'any' | 'same-gender' | 'women' | 'men';
  comfort_note: string;
}

export const AVAILABLE_INTENTS: AvailableIntent[] = [
  {
    intent_id: 'intent-123',
    creator_name: 'Lara',
    reputation: 4.9,
    community_badge: 'Lekki Estate',
    intent_tag: 'Language practice',
    origin_label: 'Ajah',
    destination_label: 'Victoria Island',
    time_window: 'Today • 6:30 PM',
    group_size: 2,
    matched_count: 1,
    participants: ['Lara'],
    status: 'Open',
    request_status: 'none',
    avatar_url: 'https://dicebear.com',
    match_vibe: 'same-gender',
    comfort_note: 'Supportive and low-pressure'
  },
  {
    intent_id: 'intent-456',
    creator_name: 'Tunde',
    reputation: 4.7,
    community_badge: 'Verified Nearby',
    intent_tag: 'Coding study',
    origin_label: 'Ajah',
    destination_label: 'Victoria Island',
    time_window: 'Tomorrow • 8:10 PM',
    group_size: 3,
    matched_count: 2,
    participants: ['Tunde', 'Ngozi'],
    status: 'Open',
    request_status: 'none',
    avatar_url: 'https://dicebear.com',
    match_vibe: 'any',
    comfort_note: 'Open to mixed, welcoming circles'
  }
];
