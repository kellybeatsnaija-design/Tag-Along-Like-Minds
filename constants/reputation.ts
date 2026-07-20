import { TagAlongColors } from './Colors';

export interface ReputationMeta {
  label: string;
  color: string;
}

export const REPUTATION_META: Record<string, ReputationMeta> = {
  New: { label: 'New Friend', color: '#94A3B8' },
  Verified: { label: 'Verified', color: '#3B82F6' },
  Reliable: { label: 'Reliable', color: TagAlongColors.primary },
  Trusted: { label: 'Trusted Companion', color: '#00B660' },
  Restricted: { label: 'Restricted', color: '#F59E0B' },
  Suspended: { label: 'Suspended', color: '#F97316' },
  Banned: { label: 'Banned', color: '#DC2626' },
};

export function getReputationMeta(state?: string | null): ReputationMeta {
  if (state && REPUTATION_META[state]) return REPUTATION_META[state];
  return { label: state || 'New Friend', color: '#94A3B8' };
}
