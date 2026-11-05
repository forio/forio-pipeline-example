/**
 * Creates the test group and users for this project on Epicenter.
 *
 *   npm run fixtures -- [groupName]      default group name: pipeline-test
 *
 * Users and their roles are read from the git-ignored ../notes/epicenter_credentials_local.md:
 * lines of the form `<handle> (fac)` or `<handle> (student)` after the `users:` line, with the
 * last `password:` line in the file as their password. Nothing is written to git.
 *
 * Contracts (epicenter-sandbox-1, Epicenter 6.1.0):
 *   GET  /user/with/{handle}            account-level (projectShortName segment is the literal "project")
 *   POST /user                          account-level; body NativeUserCreateInView
 *   GET  /group/with/{groupName}
 *   POST /group                         body GroupCreateInView { name }
 *   POST /group/member/{groupKey}       body [ { objectType: "group", role, userKey } ]
 */
import * as fs from 'fs';
import { Fault } from 'epicenter-libs';
import { loadConfig, paths, type Config } from './config';
import { login, router } from './epicenter';

type Role = 'facilitator' | 'participant';
interface TestUser {
  handle: string;
  role: Role;
}

function readTestUsers(): { users: TestUser[]; password: string } {
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

const authed = (token: string, config: Config) =>
  router(config).withAuthorization(`Bearer ${token}`);
const accountLevel = (token: string, config: Config) =>
  router(config).withProjectShortName('project').withAuthorization(`Bearer ${token}`);

async function ensureUser(token: string, config: Config, handle: string, password: string) {
  try {
    const existing = await accountLevel(token, config)
      .get(`/user/with/${encodeURIComponent(handle)}`)
      .then(({ body }) => body);
    console.log(`User ${handle} exists (${existing.userKey})`);
    return existing.userKey as string;
  } catch (error) {
    if (!(error instanceof Fault && error.status === 404)) throw error;
  }
  const created = await accountLevel(token, config)
    .post('/user', {
      body: { objectType: 'native', handle, displayName: handle, secret: { password } },
    })
    .then(({ body }) => body);
  console.log(`Created user ${handle} (${created.userKey}) ✓`);
  return created.userKey as string;
}

async function ensureGroup(token: string, config: Config, name: string) {
  try {
    const existing = await authed(token, config)
      .get(`/group/with/${encodeURIComponent(name)}`)
      .then(({ body }) => body);
    console.log(`Group ${name} exists (${existing.groupKey})`);
    return existing;
  } catch (error) {
    if (!(error instanceof Fault && error.status === 404)) throw error;
  }
  const created = await authed(token, config)
    .post('/group', { body: { name } })
    .then(({ body }) => body);
  console.log(`Created group ${name} (${created.groupKey}) ✓`);
  return created;
}

async function main() {
  const groupName = process.argv[2] ?? 'pipeline-test';
  const { users, password } = readTestUsers();
  const config = await loadConfig();
  console.log(`${config.SERVER}/${config.ACCOUNT_SHORT_NAME}/${config.PROJECT_SHORT_NAME}`);
  const token = await login(config);

  const group = await ensureGroup(token, config, groupName);
  const existingMembers = new Set<string>(
    (group.members ?? []).map((m: { user?: { userKey?: string } }) => m.user?.userKey)
  );

  const additions = [];
  for (const user of users) {
    const userKey = await ensureUser(token, config, user.handle, password);
    if (existingMembers.has(userKey)) {
      console.log(`  ${user.handle} already in ${groupName}`);
      continue;
    }
    additions.push({ objectType: 'group', role: user.role, userKey });
  }
  if (additions.length) {
    const updated = await authed(token, config)
      .post(`/group/member/${group.groupKey}`, { body: additions })
      .then(({ body }) => body);
    console.log(
      `Added ${additions.length} member(s) to ${groupName}; group now has ${updated.members?.length ?? '?'} ✓`
    );
  }
  console.log(`groupKey: ${group.groupKey}`);
}

main().catch((error) => {
  console.error(
    error instanceof Fault
      ? `${error.status} ${error.message} ${JSON.stringify(error.information ?? '')}`
      : error
  );
  process.exit(1);
});
