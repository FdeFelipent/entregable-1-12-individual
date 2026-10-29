import { unlink } from 'node:fs/promises';
import path from 'node:path';
import { publicDirectory } from '../middlewares/multer.middleware.js';

export async function removeUploadedFiles(files = []) {
  await Promise.all(files.map((file) => unlink(file.path).catch(() => {})));
}

export async function removeImages(images = []) {
  const files = images
    .filter((image) => typeof image === 'string' && image.startsWith('/img/'))
    .map((image) => path.resolve(publicDirectory, `.${image}`));
  const root = `${path.resolve(publicDirectory)}${path.sep}`;
  await Promise.all(files
    .filter((file) => file.startsWith(root))
    .map((file) => unlink(file).catch(() => {})));
}