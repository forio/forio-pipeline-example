import { PseudonymReadOutView } from './user';

type BaseRunReadOutView = {
  cluster?: string;
  hidden?: boolean;
  modelVersion?: number;
  lastOperated?: string;
  modelLanguage?: string;
  perpetual?: boolean;
  cloud?: string;
  grammar?: string;
  trackingKey?: string;
  scope: JPAScopeReadOutView;
  executionContext?: V1ExecutionContext;
  allowChannel?: boolean;
  marked?: boolean;
  address?: JPAAddressReadOutView;
  tombstone?: string;
  morphology?: string;
  modelFile?: string;
  created: string;
  runKey: string;
  permit?: JPAPermitReadOutView;
  closed?: boolean;
  lastModified?: string;
  runState?: string;
  user?: PseudonymReadOutView;
};

// Helper to avoid distributive conditionals over naked type params:
type IfSupplied<T, P> = [T] extends [undefined] ? Record<never, never> : P;

export type RunReadOutView<
  V extends Record<string, unknown> | undefined = undefined,
  M extends Record<string, unknown> | undefined = undefined,
> = BaseRunReadOutView & IfSupplied<V, { variables: V }> & IfSupplied<M, { metaData: M }>;

type JPAScopeReadOutView = {
  scopeBoundary?: string;
  scopeKey?: string;
  userKey?: string;
};

type V1ExecutionContext = {
  presets?: Record<string, Record<string, unknown>>;
  mappedFiles?: Record<string, string>;
  version: string;
  tool?: StellaModelTool | VensimModelTool;
};

type JPAAddressReadOutView = {
  projectShortName?: string;
  groupName?: string;
  accountShortName?: string;
  worldKey?: string;
  episodeName?: string;
};

type JPAPermitReadOutView = {
  writeLock?:
    | 'SYSTEM'
    | 'MONITOR'
    | 'AUTHOR'
    | 'SUPPORT'
    | 'FACILITATOR'
    | 'REVIEWER'
    | 'USER'
    | 'LEADER'
    | 'PARTICIPANT'
    | 'ANONYMOUS';
  readLock?:
    | 'SYSTEM'
    | 'MONITOR'
    | 'AUTHOR'
    | 'SUPPORT'
    | 'FACILITATOR'
    | 'REVIEWER'
    | 'USER'
    | 'LEADER'
    | 'PARTICIPANT'
    | 'ANONYMOUS';
};

export type RunCreateInView = {
  // Required fields
  modelFile: string; // The model file to run
  scope: {
    scopeBoundary: string; // The boundary for the run's scope
    scopeKey: string; // The key for the run's scope
    userKey?: string; // Optional user key for scope
  };

  // Optional fields
  grammar?: string; // Grammar configuration
  morphology?: string; // Morphology configuration
  trackingKey?: string; // Key for tracking the run
  allowChannel?: boolean; // Whether to allow channel
  ephemeral?: boolean; // Whether the run is ephemeral
  perpetual?: boolean; // Whether the run is perpetual

  // Complex optional fields
  executionContext?: {
    version: string;
    presets?: Record<string, any>;
    mappedFiles?: Record<string, string>;
    tool?: StellaModelTool | VensimModelTool;
  };

  permit?: {
    writeLock?:
      | 'SYSTEM'
      | 'MONITOR'
      | 'AUTHOR'
      | 'SUPPORT'
      | 'FACILITATOR'
      | 'REVIEWER'
      | 'USER'
      | 'LEADER'
      | 'PARTICIPANT'
      | 'ANONYMOUS';
    readLock?:
      | 'SYSTEM'
      | 'MONITOR'
      | 'AUTHOR'
      | 'SUPPORT'
      | 'FACILITATOR'
      | 'REVIEWER'
      | 'USER'
      | 'LEADER'
      | 'PARTICIPANT'
      | 'ANONYMOUS';
  };

  modelContext?: {
    version: string;
    variables?: Record<string, VariableOptions>;
    externalFunctions?: Record<string, WireExternalFunction>;
    modelVersion?: number;
    mappedFiles?: Record<string, string>;
    language?: string;
    protections?: Protections;
    control?:
      | ExcelModelControl
      | JavaModelControl
      | PowersimModelControl
      | VensimModelControl;
    restorations?: Restorations;
    workerImage?: string;
    dependencies?: ExternalDependency[];
    operations?: Record<string, OperationOptions>;
    defaults?: ModelContextDefaults;
    enableStateCache?: boolean;
    redirectStandardOut?: boolean;
    startDebugger?: boolean;
    inceptionGracePeriodSeconds?: number;
    events?: Record<string, EventOptions>;
    minimumLogLevel?: string;
  };
};

// Supporting interfaces
interface StellaModelTool {
  objectType: 'stella';
  gameMode?: boolean;
}

interface VensimModelTool {
  objectType: 'vensim';
  sensitivityMode?: boolean;
  cinFiles?: string[];
}

interface VariableOptions {
  resetDecision?: boolean;
  dialect?: string;
  save?: boolean;
  reportPer?: number;
  sensitivity?: boolean;
  reportOffset?: number;
}

interface WireExternalFunction {
  objectType: 'wire';
  route?: {
    service?: string;
    version?: number;
  };
  arguments?: string;
}

interface Protections {
  guards?: Array<
    InputGuard | OverwriteGuard | PrivilegeGuard | RelativeGuard | RoleGuard
  >;
}

interface InputGuard {
  objectType: 'input';
  regex: string;
  operator?: string;
  operand?: string;
}

interface OverwriteGuard {
  objectType: 'overwrite';
  regex: string;
  dialect?: string;
  initial: string;
}

interface PrivilegeGuard {
  objectType: 'privilege';
  regex: string;
  read: string;
  domain: string;
  grant: string;
  execute: string;
  write: string;
}

interface RelativeGuard {
  objectType: 'relative';
  regex: string;
  dialect?: string;
  value: string;
  operator: string;
  key: string;
}

interface RoleGuard {
  objectType: 'role';
  regex: string;
  role: string;
  domain: string;
  grant: string;
}

// Model Controls
interface ExcelModelControl {
  objectType: 'excel';
  autoRecalculate?: boolean;
}

interface JavaModelControl {
  objectType: 'java';
  executable?: string;
}

interface PowersimModelControl {
  objectType: 'powersim';
  minimizeMemoryFootprint?: boolean;
}

interface VensimModelControl {
  objectType: 'vensim';
  sensitivityControl?: {
    noiseSeed?: number;
    reportPer?: number;
    numberOfSimulations?: number;
    parameters?: string[];
    reportOffset?: number;
    algorithm?: string;
  };
  extensionModule?: string;
}

interface Restorations {
  log?: string;
  rewind?: {
    name?: string;
    destructible?: boolean;
    arguments?: Record<string, any>;
  };
  assembly?: Array<ReplayRestoration | SnapshotRestoration>;
}

interface ReplayRestoration {
  objectType: 'replay';
  operations?: ReplayOperation[];
}

interface ReplayOperation {
  targetType: string;
  operationType: string;
  targetKey: string;
}

interface SnapshotRestoration {
  objectType: 'snapshot';
  variables?: string[];
}

// External Dependencies
type ExternalDependency =
  | AptExternalDependency
  | CranExternalDependency
  | GitExternalDependency
  | JuliaExternalDependency
  | NpmExternalDependency
  | PypiExternalDependency
  | ShellExternalDependency;

interface AptExternalDependency {
  objectType: 'apt';
  package?: string;
  repository?: string;
  version?: string;
}

interface CranExternalDependency {
  objectType: 'cran';
  package?: string;
  version?: string;
}

interface GitExternalDependency {
  objectType: 'git';
  url?: string;
  script?: string;
}

interface JuliaExternalDependency {
  objectType: 'julia';
  package?: string;
  version?: string;
}

interface NpmExternalDependency {
  objectType: 'npm';
  package?: string;
  version?: string;
}

interface PypiExternalDependency {
  objectType: 'pypi';
  package?: string;
  version?: string;
}

interface ShellExternalDependency {
  objectType: 'shell';
  script?: string;
}

interface OperationOptions {
  inert?: boolean;
  timeoutSeconds?: number;
}

interface ModelContextDefaults {
  variables?: VariableOptions;
  operations?: OperationOptions;
  events?: EventOptions;
}

interface EventOptions {
  timeoutSeconds?: number;
}
