/**
 * One-time project setup on Epicenter (rational layout + git integration + public access).
 *
 *   npm run project -- create [--private]        create the project (directory layout) if it does not exist
 *   npm run project -- info                      print the project record
 *   npm run project -- access <public|private|authenticated>
 *   npm run project -- git <ssh-uri> <private-key-file> <public-key-file>
 *   npm run project -- git-status                current branch on the platform
 *
 * Account/project come from ../notes/epicenter_credentials_local.md + .env (see config.ts).
 */
import * as fs from 'fs';
import { Fault } from 'epicenter-libs';
import { loadConfig, type Config } from './config';
import { login, router } from './epicenter';

const PROJECT_NAME = 'Forio Pipeline Example';

const authed = (token: string, config: Config) =>
  router(config).withAuthorization(`Bearer ${token}`);

async function info(token: string, config: Config) {
  const project = await authed(token, config)
    .get('/project')
    .then(({ body }) => body);
  console.log(JSON.stringify(project, null, 2));
  return project;
}

async function create(token: string, config: Config, accessType: string) {
  try {
    const existing = await authed(token, config)
      .get('/project')
      .then(({ body }) => body);
    console.log(
      `Project ${config.PROJECT_SHORT_NAME} already exists (layout ${existing?.structure?.layout})`
    );
    return existing;
  } catch (error) {
    if (!(error instanceof Fault && error.status === 404)) throw error;
  }
  // POST /api/v3/{account}/project/project: the projectShortName path segment is the literal "project"
  const created = await router(config)
    .withProjectShortName('project')
    .withAuthorization(`Bearer ${token}`)
    .post('/project', {
      body: {
        objectType: 'team',
        name: PROJECT_NAME,
        shortName: config.PROJECT_SHORT_NAME,
        accessType,
        structure: { layout: 'RATIONAL' },
      },
    })
    .then(({ body }) => body);
  console.log(
    `Created ${config.ACCOUNT_SHORT_NAME}/${config.PROJECT_SHORT_NAME} (layout ${created?.structure?.layout}, access ${created?.accessType}) ✓`
  );
  return created;
}

async function access(token: string, config: Config, accessType: string) {
  const updated = await authed(token, config)
    .patch('/project', { body: { objectType: 'team', accessType } })
    .then(({ body }) => body);
  console.log(`accessType is now ${updated?.accessType} ✓`);
}

async function git(
  token: string,
  config: Config,
  uri: string,
  privateKeyFile: string,
  publicKeyFile: string
) {
  const privateKey = fs.readFileSync(privateKeyFile, 'utf-8');
  const publicKey = fs.readFileSync(publicKeyFile, 'utf-8').trim();
  const body = {
    uri,
    algorithm: 'ed25519',
    privateKey,
    privateKeySpec: 'openssh',
    publicKey,
    publicKeySpec: 'openssh',
  };
  let result;
  try {
    result = await authed(token, config)
      .post('/git/integration', { body })
      .then(({ body }) => body);
    console.log('Git integration created ✓');
  } catch (error) {
    if (!(error instanceof Fault && error.status === 409)) throw error;
    result = await authed(token, config)
      .patch('/git/integration', { body })
      .then(({ body }) => body);
    console.log('Git integration updated ✓');
  }
  console.log(
    JSON.stringify(
      { uri: result?.uri, algorithm: result?.algorithm, publicKey: result?.publicKey },
      null,
      2
    )
  );
}

async function gitStatus(token: string, config: Config) {
  const status = await authed(token, config)
    .get('/git/status')
    .then(({ body }) => body);
  console.log(JSON.stringify(status, null, 2));
}

async function main() {
  const [command, ...args] = process.argv.slice(2);
  const usage = () => {
    console.error(
      'Usage: tsx cli/project.ts <create [--private] | info | access <type> | git <uri> <private-key> <public-key> | git-status>'
    );
    process.exit(1);
  };
  if (!command) usage();

  const config = await loadConfig();
  console.log(`${config.SERVER}/${config.ACCOUNT_SHORT_NAME}/${config.PROJECT_SHORT_NAME}`);
  let token: string;
  try {
    token = await login(config);
  } catch (error) {
    // Before the project exists its authentication route 404s; log in via the account-level route.
    if (!(command === 'create' && error instanceof Fault && error.status === 404)) throw error;
    token = await login(config, 'project');
  }

  switch (command) {
    case 'create':
      return create(token, config, args.includes('--private') ? 'private' : 'public');
    case 'info':
      return info(token, config);
    case 'access':
      if (!args[0]) usage();
      return access(token, config, args[0]);
    case 'git':
      if (args.length < 3) usage();
      return git(token, config, args[0], args[1], args[2]);
    case 'git-status':
      return gitStatus(token, config);
    default:
      usage();
  }
}

main().catch((error) => {
  console.error(
    error instanceof Fault
      ? `${error.status} ${error.message} ${JSON.stringify(error.information ?? '')}`
      : error
  );
  process.exit(1);
});
