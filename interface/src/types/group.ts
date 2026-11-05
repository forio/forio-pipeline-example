import { PseudonymReadOutView } from './user';

export type GroupPermissionUpdateInView = {
  role?: string;
  available?: boolean;
  objectType: 'group';
};

type PricingCreateInView = {
  amount?: number;
};

type StatusQuantizedOutView = {
  code?: string;
  message?: string;
};

type PricingQuantizedOutView = {
  amount?: number;
};

type FlightRecorderCreateInView = {
  stop: number;
  start?: number;
  enabled: boolean;
};

export type GroupReadOutView = {
  allowSelfRegistration?: boolean;
  salesChannel?: 'TEAM' | 'TEST' | 'FORIO' | 'HBP_HIGHER_ED' | 'HBP_CL';
  perpetual?: boolean;
  groupKey?: string;
  capacity?: number;
  reference?: string;
  terminationDate?: string;
  lastUpdated?: string;
  members: GroupPermissionReadOutView[];
  allowChannel?: boolean;
  flightRecorder: FlightRecorderReadOutView;
  event?: string;
  allowMembershipChanges?: boolean;
  expirationDate?: string;
  approximateMemberCount?: number;
  creator?: string;
  tombstone?: string;
  runLimit?: number;
  created?: string;
  organization?: string;
  name?: string;
  demonstration?: boolean;
  pricing: PricingReadOutView;
  startDate?: string;
  status: StatusReadOutView;
};

type FlightRecorderQuantizedOutView = {
  stop?: number;
  start?: number;
  enabled?: boolean;
};

type StatusCreateInView = {
  code?: string;
  message?: string;
};

export type GroupPermissionCreateInView = {
  role: string;
  available?: boolean;
  payment: StripePaymentCreateInView;
  userKey: string;
  objectType: 'group';
};

type PricingUpdateInView = {
  amount?: number;
};

type FlightRecorderUpdateInView = {
  stop?: number;
  start?: number;
  enabled?: boolean;
};

type PricingReadOutView = {
  amount?: number;
};

export type GroupQuantizedOutView = {
  creator?: string;
  groupQuanta: GroupQuantaQuantizedOutView;
  runLimit?: number;
  allowSelfRegistration?: boolean;
  salesChannel?: 'TEAM' | 'TEST' | 'FORIO' | 'HBP_HIGHER_ED' | 'HBP_CL';
  perpetual?: boolean;
  capacity?: number;
  reference?: string;
  terminationDate?: string;
  organization?: string;
  name?: string;
  flightRecorder: FlightRecorderQuantizedOutView;
  demonstration?: boolean;
  event?: string;
  allowMembershipChanges?: boolean;
  pricing: PricingQuantizedOutView;
  startDate?: string;
  status: StatusQuantizedOutView;
  expirationDate?: string;
};

type StatusUpdateInView = {
  code?: string;
  message?: string;
};

type GroupQuantaQuantizedOutView = {
  runCount?: number;
};

export type GroupPermissionReadOutView = {
  role?: string;
  available?: boolean;
  user: PseudonymReadOutView;
  objectType: 'group';
};

export type GroupCreateInView = {
  runLimit?: number;
  allowSelfRegistration?: boolean;
  salesChannel?: 'TEAM' | 'TEST' | 'FORIO' | 'HBP_HIGHER_ED' | 'HBP_CL';
  perpetual?: boolean;
  capacity?: number;
  reference?: string;
  terminationDate?: string;
  organization?: string;
  name: string;
  allowChannel?: boolean;
  flightRecorder: FlightRecorderCreateInView;
  demonstration?: boolean;
  event?: string;
  allowMembershipChanges?: boolean;
  pricing: PricingCreateInView;
  startDate?: string;
  status: StatusCreateInView;
  expirationDate?: string;
};

type StatusReadOutView = {
  code?: string;
  message?: string;
};

export type GroupUpdateInView = {
  tombstone?: string;
  runLimit?: number;
  allowSelfRegistration?: boolean;
  salesChannel?: 'TEAM' | 'TEST' | 'FORIO' | 'HBP_HIGHER_ED' | 'HBP_CL';
  perpetual?: boolean;
  capacity?: number;
  reference?: string;
  terminationDate?: string;
  organization?: string;
  allowChannel?: boolean;
  flightRecorder: FlightRecorderUpdateInView;
  demonstration?: boolean;
  event?: string;
  allowMembershipChanges?: boolean;
  pricing: PricingUpdateInView;
  startDate?: string;
  status: StatusUpdateInView;
  expirationDate?: string;
};

type FlightRecorderReadOutView = {
  stop?: number;
  start?: number;
  enabled?: boolean;
};

type StripePaymentCreateInView = {
  description?: string;
  token: string;
  objectType: 'stripe';
};
