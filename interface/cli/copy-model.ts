/**
 * Mirrors the pipeline's `copy` operation locally: ../model → ../target/model.
 * On Epicenter the pipeline does this with `{ "objectType": "copy", "items": [{ "location": "MODEL" }] }`.
 */
import * as fs from 'fs';
import * as path from 'path';
import { paths } from './config';

const source = path.join(paths.REPO_DIR, 'model');
const destination = path.join(paths.REPO_DIR, 'target', 'model');

if (!fs.existsSync(source)) {
  console.error(`No model directory at ${source}`);
  process.exit(1);
}

fs.rmSync(destination, { recursive: true, force: true });
fs.mkdirSync(destination, { recursive: true });
fs.cpSync(source, destination, { recursive: true });

const files = fs.readdirSync(destination);
console.log(`Copied ${files.length} file(s) from model/ to target/model/: ${files.join(', ')}`);
