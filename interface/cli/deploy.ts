import * as fs from 'fs';
import { loadConfig } from './config';
import { emptyDirectory, explodeZip, login, postZip } from './epicenter';
import { createZipBuffer } from './zip';

async function main() {
  // Parse command line arguments
  const localDir = process.argv[2];
  const serverDir = process.argv[3] || localDir; // Default to same name as local dir

  if (!localDir) {
    console.error('Usage: tsx cli/deploy.ts <local-directory> [server-directory]');
    console.error('Example: tsx cli/deploy.ts public');
    console.error('Example: tsx cli/deploy.ts model model');
    process.exit(1);
  }

  // Check if directory exists and has files
  if (!fs.existsSync(localDir)) {
    console.log(`Directory ${localDir}/ does not exist, skipping deployment.`);
    return;
  }

  if (!fs.statSync(localDir).isDirectory()) {
    console.log(`${localDir} is not a directory, skipping deployment.`);
    return;
  }

  const files = fs.readdirSync(localDir).filter((f) => !f.startsWith('.'));
  if (files.length === 0) {
    console.log(`Directory ${localDir}/ is empty, skipping deployment.`);
    return;
  }

  const config = await loadConfig();

  console.log(
    `Deploying ${localDir}/ → ${config.SERVER}/${config.ACCOUNT_SHORT_NAME}/${config.PROJECT_SHORT_NAME}/${serverDir}/`
  );
  console.log();

  const token = await login(config);
  console.log('Logged in ✓');

  const buffer = await createZipBuffer(localDir);
  const file = new File([new Uint8Array(buffer)], 'deployment.zip', {
    type: 'application/zip',
    lastModified: Date.now(),
  });
  console.log(`Zip file created (${(buffer.length / 1024 / 1024).toFixed(2)} MB) ✓`);

  await emptyDirectory(serverDir, token, config);
  console.log('Old files deleted ✓');

  await postZip(serverDir, token, config)(file);
  console.log('File uploaded ✓');

  await explodeZip(`${serverDir}/deployment.zip`, token, config);
  console.log('File exploded ✓');

  console.log();
  console.log('Deployment completed ✓');
  console.log('All done!');
}

main();
