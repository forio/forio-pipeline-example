import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import prompts from 'prompts';

export interface Config {
  SERVER: string;
  ACCOUNT_SHORT_NAME: string;
  PROJECT_SHORT_NAME: string;
  ADMIN_HANDLE: string;
  ADMIN_PASSWORD: string;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INTERFACE_DIR = path.resolve(__dirname, '..');
const REPO_DIR = path.resolve(INTERFACE_DIR, '..');

/** Legacy per-checkout config (git-ignored). Used only when the credentials file is absent. */
const CONFIG_PATH = path.join(__dirname, 'config.json');
/** Git-ignored credentials file shared by every CLI in this repository. */
const CREDENTIALS_PATH = path.join(REPO_DIR, 'notes', 'epicenter_credentials_local.md');
/** Account / project come from the interface .env so dev server and CLI agree. */
const ENV_PATH = path.join(INTERFACE_DIR, '.env');

const CONFIG_KEYS: (keyof Config)[] = [
  'SERVER',
  'ACCOUNT_SHORT_NAME',
  'PROJECT_SHORT_NAME',
  'ADMIN_HANDLE',
  'ADMIN_PASSWORD',
];

const DEFAULTS: Partial<Config> = {
  SERVER: 'https://forio.com',
};

/**
 * Parses `key: value` lines from the credentials markdown file.
 * The first occurrence of a key wins, so the author block must come before any
 * test-user block that reuses the `password:` key.
 */
function parseKeyValueLines(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const match = /^([A-Za-z][A-Za-z _-]*?)\s*:\s*(.+?)\s*$/.exec(rawLine);
    if (!match) continue;
    const key = match[1].trim().toLowerCase();
    if (!(key in result)) result[key] = match[2];
  }
  return result;
}

function parseEnvFile(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }
  return result;
}

function readIfExists(file: string): string | undefined {
  try {
    return fs.existsSync(file) ? fs.readFileSync(file, 'utf-8') : undefined;
  } catch {
    return undefined;
  }
}

/** Builds a config from notes/epicenter_credentials_local.md + interface/.env. */
function loadFromCredentialsFile(): Partial<Config> {
  const creds = readIfExists(CREDENTIALS_PATH);
  if (!creds) return {};
  const kv = parseKeyValueLines(creds);
  const env = parseEnvFile(readIfExists(ENV_PATH) ?? '');

  const config: Partial<Config> = {};
  if (kv.host) {
    config.SERVER = /^https?:\/\//.test(kv.host) ? kv.host : `https://${kv.host}`;
  }
  if (kv.author) config.ADMIN_HANDLE = kv.author;
  if (kv.password) config.ADMIN_PASSWORD = kv.password;
  if (env.VITE_DEV_ACCOUNT_SHORT_NAME) config.ACCOUNT_SHORT_NAME = env.VITE_DEV_ACCOUNT_SHORT_NAME;
  if (env.VITE_DEV_PROJECT_SHORT_NAME) config.PROJECT_SHORT_NAME = env.VITE_DEV_PROJECT_SHORT_NAME;
  return config;
}

async function promptForMissingKeys(existingConfig: Partial<Config>): Promise<Config> {
  const config = { ...existingConfig } as Partial<Config>;
  const questions: prompts.PromptObject[] = [];

  for (const key of CONFIG_KEYS) {
    if (!config[key]) {
      const defaultValue = DEFAULTS[key];
      const isPassword = key === 'ADMIN_PASSWORD';

      questions.push({
        type: isPassword ? ('password' as const) : ('text' as const),
        name: key,
        message: key,
        initial: defaultValue,
      });
    }
  }

  if (questions.length > 0) {
    const answers = await prompts(questions);
    Object.assign(config, answers);
  }

  return config as Config;
}

function loadExistingConfig(): Partial<Config> {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const content = fs.readFileSync(CONFIG_PATH, 'utf-8');
      return JSON.parse(content);
    }
  } catch (_error) {
    console.warn('Warning: Could not read config.json, will prompt for all values');
  }
  return {};
}

function saveConfig(config: Config): void {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2) + '\n', 'utf-8');
}

/**
 * Resolution order:
 *   1. ../notes/epicenter_credentials_local.md (host / author / password) + .env (account / project)
 *   2. cli/config.json (legacy)
 *   3. interactive prompt, saved to cli/config.json
 */
export async function loadConfig(): Promise<Config> {
  const fromCredentials = loadFromCredentialsFile();
  const existingConfig: Partial<Config> = { ...loadExistingConfig(), ...fromCredentials };
  const missingKeys = CONFIG_KEYS.filter((key) => !existingConfig[key]);

  if (missingKeys.length > 0) {
    console.log('Configuration incomplete. Please provide the following:');
    console.log();

    const config = await promptForMissingKeys(existingConfig);
    saveConfig(config);

    console.log();
    console.log('Configuration saved to cli/config.json');
    console.log();

    return config;
  }

  return existingConfig as Config;
}

export const paths = { INTERFACE_DIR, REPO_DIR, CREDENTIALS_PATH, ENV_PATH };

/**
 * Test users from the credentials file: lines `<handle> (fac)` / `<handle> (student)` after the
 * `users:` line, and the LAST `password:` line as their shared password.
 */
export type TestUserRole = 'facilitator' | 'participant';
export interface TestUser {
  handle: string;
  role: TestUserRole;
}

export function loadTestUsers(): { users: TestUser[]; password: string } {
  const content = fs.readFileSync(paths.CREDENTIALS_PATH, 'utf-8');
  const lines = content.split(/\r?\n/);
  const users: TestUser[] = [];
  let password: string | undefined;
  let inUsers = false;
  for (const line of lines) {
    if (/^users\s*:/i.test(line)) inUsers = true;
    const pw = /^password\s*:\s*(.+?)\s*$/i.exec(line);
    if (pw) password = pw[1]; // last occurrence wins: the test-user password follows the author block
    const user = /^(\S+)\s*\((fac|facilitator|student|participant)\)\s*$/i.exec(line.trim());
    if (inUsers && user) {
      users.push({
        handle: user[1],
        role: /^fac/i.test(user[2]) ? 'facilitator' : 'participant',
      });
    }
  }
  if (!users.length || !password) {
    throw new Error(`No test users / password found in ${paths.CREDENTIALS_PATH}`);
  }
  return { users, password };
}

