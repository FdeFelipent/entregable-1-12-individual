import multer from 'multer';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { mkdir } from 'node:fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const publicDirectory = path.resolve(__dirname, '../../public');

function createUploader(folder) {
  const destination = path.join(publicDirectory, 'img', folder);
  const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
      try {
        await mkdir(destination, { recursive: true });
        cb(null, destination);
      } catch (error) {
        cb(error);
      }
    },
    filename: (req, file, cb) => {
      const extension = path.extname(file.originalname).toLowerCase();
      const filename = `${file.fieldname}-${Date.now()}-${randomBytes(6).toString('hex')}${extension}`;
      cb(null, filename);
    }
  });

  return multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.startsWith('image/')) {
        return cb(new Error('Solo se permiten archivos de imagen'));
      }
      cb(null, true);
    }
  });
}

export const uploadUsers = createUploader('users');
export const uploadPets = createUploader('pets');
