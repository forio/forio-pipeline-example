/**
 * API-level smoke test of the deployed sim: proves the model in target/model runs and that the
 * participant flow the interface uses (episode → per-user run → variables) works.
 *
 *   cd interface && npm run test:smoke [groupName]       default group: pipeline-test
 *
 * Mirrors src/query/episode.ts and src/query/run.ts:
 *   1. author login            → GET  /group/with/{groupName}
 *   2. facilitator user login  → GET  /episode/in/{groupKey}; POST /episode/{groupName} if none
 *   3. participant user login  → POST /run { modelFile, scope: { episode, userKey } }
 *   4.                         → GET  /run/variable/{runKey}/{name}?ritual=REVIVE
 * Credentials come from the git-ignored notes/epicenter_credentials_local.md (see cli/config.ts).
 */
import { loadConfig, loadTestUsers, type Config } from '../interface/cli/config';
import { Fault, login, router } from '../interface/cli/epicenter';

const MODEL = 'model.xlsx';
const VARIABLES = ['Step', 'Price', 'Bike_Sales', 'Profit'];

interface UserWhoAmI {
  token: string;
  userKey: string;
  groupKey: string;
  groupName: string;
  groupRole: string;
}

const userLogin = (config: Config, handle: string, password: string, groupKey: string) =>
  router(config)
    .post('/authentication', {
      inert: true,
      body: { objectType: 'user', handle, password, groupKey },
    })
    .then(({ body }) => body as UserWhoAmI);

const as = (config: Config, token: string) =>
  router(config).withAuthorization(`Bearer ${token}`);

async function main() {
  const groupName = process.argv[2] ?? 'pipeline-test';
  const config = await loadConfig();
  const { users, password } = loadTestUsers();
  const facilitator = users.find((u) => u.role === 'facilitator');
  const participant = users.find((u) => u.role === 'participant');
  if (!facilitator || !participant) throw new Error('Need one facilitator and one participant test user');

  console.log(`${config.SERVER}/${config.ACCOUNT_SHORT_NAME}/${config.PROJECT_SHORT_NAME}`);

  // 1. group
  const authorToken = await login(config);
  const group = await as(config, authorToken)
    .get(`/group/with/${encodeURIComponent(groupName)}`)
    .then(({ body }) => body);
  console.log(`group ${groupName} = ${group.groupKey}`);

  // 2. episode (facilitator creates one if the group has none, as EpisodeQuery.current does)
  const fac = await userLogin(config, facilitator.handle, password, group.groupKey);
  console.log(`facilitator ${facilitator.handle} logged in (${fac.groupRole})`);
  let episodes = await as(config, fac.token)
    .get(`/episode/in/${group.groupKey}`)
    .then(({ body }) => body as Array<{ episodeKey: string; name: string }>);
  if (!episodes.length) {
    const created = await as(config, fac.token)
      .post(`/episode/${encodeURIComponent(fac.groupName)}`, { body: { name: `ep${Date.now()}` } })
      .then(({ body }) => body);
    console.log(`created episode ${created.name} (${created.episodeKey})`);
    episodes = [created];
  }
  const episode = episodes[episodes.length - 1];
  console.log(`episode ${episode.name} = ${episode.episodeKey}`);

  // 3. participant run
  const student = await userLogin(config, participant.handle, password, group.groupKey);
  console.log(`participant ${participant.handle} logged in (${student.groupRole})`);
  const run = await as(config, student.token)
    .post('/run', {
      body: {
        modelFile: MODEL,
        scope: { scopeBoundary: 'episode', scopeKey: episode.episodeKey, userKey: student.userKey },
      },
    })
    .then(({ body }) => body);
  console.log(`run ${run.runKey}: state=${run.runState} language=${run.modelLanguage} model=${run.modelFile}`);

  // 4. variables
  const values: Record<string, unknown> = {};
  for (const name of VARIABLES) {
    values[name] = await as(config, student.token)
      .withSearchParams({ ritual: 'REVIVE' })
      .get(`/run/variable/${run.runKey}/${name}`)
      .then(({ body }) => body);
  }
  console.log('variables:', JSON.stringify(values));

  const missing = VARIABLES.filter((name) => values[name] === undefined || values[name] === null);
  if (missing.length) throw new Error(`Variables not returned: ${missing.join(', ')}`);
  console.log('SMOKE TEST PASSED ✓');
}

main().catch((error) => {
  console.error(
    error instanceof Fault
      ? `${error.status} ${error.message} ${JSON.stringify(error.information ?? '')}`
      : error
  );
  process.exit(1);
});
