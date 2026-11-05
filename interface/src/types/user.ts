type CountdownReadOutView = {
  last?: string;
  count?: number;
};

type MFADetailReadOutView = {
  mfaMethodology?: 'NONE' | 'TOTP';
};

type GraftReadOutView = {
  reference?: string;
  realm: {
    type: string;
    authority: string;
  };
};

type BaseUserReadOutView = {
  handle: string;
  lastLogin?: string;
  modality?: string;
  created?: string;
  givenName?: string;
  countdown: CountdownReadOutView;
  active?: boolean;
  lastUpdated?: string;
  uploadOrder?: number;
  familyName?: string;
  email?: string;
  mfaDetail: MFADetailReadOutView;
};

type NativeUserReadOutView = BaseUserReadOutView & {
  objectType: 'native';
};

type ExternalUserReadOutView = BaseUserReadOutView & {
  objectType: 'external';
  graft: GraftReadOutView;
};

export type PseudonymReadOutView = {
  lastUpdated?: string;
  displayName?: string;
  created?: string;
  detail: NativeUserReadOutView | ExternalUserReadOutView;
  userId?: number;
  userKey: string;
};

export type SecretCreateInView = {
  password: string;
};

export type SimplifiedUserCreateInView = {
  handle: string;
  secret: SecretCreateInView;
  givenName?: string;
  familyName?: string;
  displayName?: string;
  email?: string;
};

export const DiscardedUserCodes = ['AMBIGUOUS_USER', 'PASSWORD_DIFFICULTY', 'PASSWORD_REUSE', 'AUTHENTICATED_USER_LIMIT'] as const;

export type DiscardedUserCodes = typeof DiscardedUserCodes[number];

export type DiscardedUser = {
  code: DiscardedUserCodes;
  information: Record<string, Array<string>>; // TODO
  message: string;
  user: NativeUserReadOutView | ExternalUserReadOutView;
};

export type UploadReport = {
  created?: Array<PseudonymReadOutView>;
  duplicated?: Array<PseudonymReadOutView>;
  discarded?: Array<DiscardedUser>;
  updated?: Array<PseudonymReadOutView>;
};

type BaseAdminReadoutView = Omit<BaseUserReadOutView, 'modality'> & {
  accountShortName?: string;
  verified?: boolean;
  adminKey?: string;
};

type NativeAdminReadOutView = BaseAdminReadoutView & {
  objectType: 'native';
};

type ExternalAdminReadOutView = BaseAdminReadoutView & {
  objectType: 'external';
  graft: GraftReadOutView;
};

export type AdminReadOutView = NativeAdminReadOutView | ExternalAdminReadOutView;
