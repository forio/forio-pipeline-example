import { PseudonymReadOutView } from './user';

export type PersonaReadOutView = {
  role: string;
  marginal?: number;
  maximum?: number;
  insertionOrder?: number;
  minimum?: number;
};

export type PersonaCreateInView = {
  role: string;
  marginal?: number | null;
  maximum?: number | null;
  insertionOrder?: number | null;
  minimum?: number | null;
};

export type ColorAnimalWorldNameGenerator = {
  comment?: string;
  objectType: 'colorAnimal';
};

export type AssignmentCreateInView = {
  role?: string;
  userKey: string;
};

export type AssignmentMap = {
  [key: string]: AssignmentCreateInView[];
};

export type AssignmentReadOutView = {
  role: string;
  user: PseudonymReadOutView;
};

export type SequentialWorldNameGenerator = {
  comment?: string;
  prefix?: string;
  objectType: 'sequential';
};

export type WorldUpdateInView = {
  displayName?: string;
  runKey?: string;
  allowChannel?: boolean;
};

export type WorldCreateInView = {
  displayName?: string;
  worldNameGenerator: ColorAnimalWorldNameGenerator | SequentialWorldNameGenerator;
  name?: string;
  allowChannel?: boolean;
};

export type WorldReadOutView = {
  lastUpdated?: string;
  personae?: PersonaReadOutView[];
  assignments: AssignmentReadOutView[];
  orbitKey?: string;
  worldKey: string;
  displayName?: string;
  created?: string;
  name?: string;
  runKey?: string;
  allowChannel?: boolean;
  orbitType?: string;
};

export type AutoAssignCreateInView = {
  keepEmptyWorlds?: boolean;
  populace?: PersonaCreateInView[];
  assignments?: AssignmentCreateInView[];
  worldNameGenerator?: ColorAnimalWorldNameGenerator | SequentialWorldNameGenerator;
  requireAllAssignments?: boolean;
  objective?: 'MINIMUM' | 'MARGINAL' | 'MAXIMUM' | 'OPTIMAL';
};
