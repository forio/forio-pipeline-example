import { PseudonymReadOutView } from './user';

export type PresenceReadOutView = {
  lastUpdated?: string;
  ttlSeconds?: number;
  user: PseudonymReadOutView;
  groupRole: 'facilitator' | 'reviewer' | 'leader' | 'participant';
};
