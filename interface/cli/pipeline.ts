/**
 * Epicenter pipeline CLI.
 *
 *   npm run pipeline -- upload <name>          upload ../pipeline/<name>.cfg1 to config/pipeline/
 *   npm run pipeline -- run <name> [--no-wait] run the config; by default poll until it finishes and print the log
 *   npm run pipeline -- list <name>            audit history for the config
 *   npm run pipeline -- log <name> <auditKey>  print one execution log
 *   npm run pipeline -- deploy <name>          upload + run
 *
 * Config files live in ../pipeline/ (copies); the live copies are config/pipeline/<name>.cfg1
 * on the project and must be re-uploaded after a reset. Uploads do not overwrite, so the old
 * file is deleted first.
 */
import * as fs from 'fs';
import * as path from 'path';
import { Fault } from 'epicenter-libs';
import { loadConfig, paths, type Config } from './config';
import { deleteFile, downloadText, login, postFile, router } from './epicenter';

type AuditStatus = 'RUNNING' | 'CANCELLING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED';
interface Audit {
  auditKey?: string;
  configName?: string;
  status?: AuditStatus;
  started?: string;
  finished?: string;
  creator?: string;
}

const POLL_MS = 5000;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function upload(name: string, token: string, config: Config) {
  const local = path.join(paths.REPO_DIR, 'pipeline', `${name}.cfg1`);
  if (!fs.existsSync(local)) throw new Error(`No pipeline config at ${local}`);
  JSON.parse(fs.readFileSync(local, 'utf-8')); // fail fast on invalid JSON

  const remote = `config/pipeline/${name}.cfg1`;
  try {
    await deleteFile(remote, token, config);
    console.log(`Deleted old ${remote} ✓`);
  } catch (error) {
    if (!(error instanceof Fault && error.status === 404)) throw error;
  }
  const file = new File([fs.readFileSync(local)], `${name}.cfg1`, { type: 'application/json' });
  await postFile('config/pipeline', token, config)(file);
  console.log(`Uploaded ${remote} ✓`);
}

async function run(name: string, token: string, config: Config, wait: boolean) {
  const audit = (await router(config)
    .withAuthorization(`Bearer ${token}`)
    .post(`/pipeline/${encodeURIComponent(name)}`, { body: { attributes: {} } })
    .then(({ body }) => body)) as Audit;
  console.log(`Started ${name}: auditKey=${audit.auditKey} status=${audit.status}`);
  if (!wait) return audit;

  let current = audit;
  while (current.status === 'RUNNING' || current.status === 'CANCELLING') {
    await sleep(POLL_MS);
    current = (await router(config)
      .withAuthorization(`Bearer ${token}`)
      .get(`/pipeline/${encodeURIComponent(audit.auditKey!)}`)
      .then(({ body }) => body)) as Audit;
    process.stdout.write(`  ${new Date().toISOString()} ${current.status}\n`);
  }
  console.log();
  await log(name, audit.auditKey!, token, config);
  console.log();
  console.log(`Pipeline ${name} ${current.status} (${current.started} -> ${current.finished})`);
  if (current.status !== 'SUCCEEDED') process.exitCode = 1;
  return current;
}

async function list(name: string, token: string, config: Config) {
  const page = (await router(config)
    .withAuthorization(`Bearer ${token}`)
    .withSearchParams({ first: 0, max: 20 })
    .get(`/pipeline/with/${encodeURIComponent(name)}`, { paginated: true })
    .then(({ body }) => body)) as { values?: Audit[] } | Audit[];
  const values = Array.isArray(page) ? page : (page.values ?? []);
  if (values.length === 0) {
    console.log(`No executions of ${name}`);
    return;
  }
  for (const a of values) {
    console.log(
      `${a.auditKey}  ${(a.status ?? '').padEnd(10)}  ${a.started ?? ''}  ->  ${a.finished ?? ''}  ${a.creator ?? ''}`
    );
  }
}

async function log(name: string, auditKey: string, token: string, config: Config) {
  const remote = `log/pipeline/${name}-${auditKey}.log`;
  let text: string;
  try {
    text = await downloadText(remote, token, config);
  } catch (error) {
    console.warn(`Could not read ${remote}: ${error instanceof Error ? error.message : error}`);
    return;
  }
  console.log(`--- ${remote}`);
  // The log is a stream of JSON objects, sometimes concatenated without newlines.
  const lines = text.replace(/}\s*{/g, '}\n{').split(/\r?\n/);
  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const entry = JSON.parse(line);
      const { timestamp, time, level, index, operationType, status, message, ...rest } = entry;
      const extra = Object.keys(rest).length ? ' ' + JSON.stringify(rest) : '';
      const op = operationType !== undefined ? `[${index ?? ''} ${operationType} ${status ?? ''}]` : '';
      console.log(
        `${timestamp ?? time ?? ''} ${level ?? ''} ${op} ${message ?? ''}${extra}`
          .replace(/\s+/g, ' ')
          .trim()
      );
    } catch {
      console.log(line);
    }
  }
}

async function main() {
  const [command, name, ...rest] = process.argv.slice(2);
  const usage = () => {
    console.error(
      'Usage: tsx cli/pipeline.ts <upload|run|list|log|deploy> <name> [auditKey] [--no-wait]'
    );
    process.exit(1);
  };
  if (!command || !name) usage();

  const config = await loadConfig();
  console.log(`${config.SERVER}/${config.ACCOUNT_SHORT_NAME}/${config.PROJECT_SHORT_NAME}`);
  const token = await login(config);

  switch (command) {
    case 'upload':
      return upload(name, token, config);
    case 'run':
      return run(name, token, config, !rest.includes('--no-wait'));
    case 'list':
      return list(name, token, config);
    case 'log':
      if (!rest[0]) usage();
      return log(name, rest[0], token, config);
    case 'deploy':
      await upload(name, token, config);
      return run(name, token, config, !rest.includes('--no-wait'));
    default:
      usage();
  }
}

main().catch((error) => {
  console.error(error instanceof Fault ? `${error.status} ${error.message}` : error);
  process.exit(1);
});
