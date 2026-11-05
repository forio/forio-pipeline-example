import archiver from 'archiver';
import { PassThrough } from 'stream';

/**
 * File extensions to ignore for security reasons
 * Only blocking server-side executable code, not media or static assets
 */
const ignoreExtension = [
  // Server-side code that shouldn't be in static builds
  'jsp',
  'php',
  'pl',
  'asp',
  'aspx',
  'shtml',
  // Shell scripts and executables
  'sh',
  'bat',
  'cmd',
  'exe',
  'dll',
  'bin',
  'com',
  'ps1',
].map((ext) => `**/*.${ext}`);

/**
 * Creates a zip archive of the specified directory and returns it as a Buffer
 * @param dirPath - The local directory to zip (e.g., 'public', 'model')
 */
export async function createZipBuffer(dirPath: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const archive = archiver('zip', { zlib: { level: 9 } });
    const memStream = new PassThrough();

    memStream.on('data', (chunk: Buffer) => chunks.push(chunk));
    memStream.on('end', () => {
      resolve(Buffer.concat(chunks));
    });

    archive.on('warning', (err: any) => {
      if (err.code !== 'ENOENT') reject(err);
      else console.warn(err);
    });

    archive.on('error', (err: any) => {
      reject(err);
    });

    archive.pipe(memStream);

    // Add the directory contents to the zip root
    archive.glob('**', {
      ignore: ignoreExtension,
      cwd: dirPath,
    });

    archive.finalize();
  });
}
