export type Consensus = {
  instantiated: boolean;
  triggered: boolean;
  closed: boolean;
  transparent: boolean;
  worldKey: string;
  name: string;
  stage: string;
  ttlSeconds: number;
  secondsLeft: number;
  expectedRoles: Record<string, unknown>;
  impendingRoles: Record<string, unknown>;
  arrivedRoles: Record<string, unknown>;
  allowChannel: boolean;
};
