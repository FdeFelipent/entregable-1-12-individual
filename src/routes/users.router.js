import { Router } from 'express';
import { fileURLToPath } from 'node:url';
import { uploadUsers } from '../middlewares/multer.middleware.js';
import { hashPassword } from '../util/crypto.js';
import { readData, writeData } from '../util/file.util.js';
import { removeImages, removeUploadedFiles } from '../util/files.js';

const router = Router();
const usersFile = fileURLToPath(new URL('../data/users.json', import.meta.url));

function publicUser({ password, ...user }) {
  return user;
}

function validId(id) {
  const numericId = Number(id);
  return Number.isInteger(numericId) && numericId > 0 ? numericId : null;
}

router.get('/', async (req, res, next) => {
  try {
    const users = await readData(usersFile);
    res.json(users.map(publicUser));
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const id = validId(req.params.id);
    const user = id && (await readData(usersFile)).find((item) => item.id === id);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(publicUser(user));
  } catch (error) {
    next(error);
  }
});

router.post('/', uploadUsers.single('avatar'), async (req, res, next) => {
  try {
    const { firstname, lastname, username, password } = req.body;
    if (![firstname, lastname, username, password].every((value) => typeof value === 'string' && value.trim())) {
      await removeUploadedFiles(req.file ? [req.file] : []);
      return res.status(400).json({ error: 'Faltan firstname, lastname, username o password' });
    }

    const users = await readData(usersFile);
    if (users.some((user) => user.username === username.trim())) {
      await removeUploadedFiles(req.file ? [req.file] : []);
      return res.status(409).json({ error: 'El username ya esta registrado' });
    }

    const newUser = {
      id: users.reduce((highestId, user) => Math.max(highestId, user.id), 0) + 1,
      firstname: firstname.trim(),
      lastname: lastname.trim(),
      username: username.trim(),
      password: await hashPassword(password),
      avatar: req.file ? `/img/users/${req.file.filename}` : null
    };

    users.push(newUser);
    await writeData(usersFile, users);
    res.status(201).json(publicUser(newUser));
  } catch (error) {
    await removeUploadedFiles(req.file ? [req.file] : []);
    next(error);
  }
});

router.put('/:id', uploadUsers.single('avatar'), async (req, res, next) => {
  try {
    const id = validId(req.params.id);
    const users = await readData(usersFile);
    const user = id && users.find((item) => item.id === id);
    if (!user) {
      await removeUploadedFiles(req.file ? [req.file] : []);
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const fields = ['firstname', 'lastname', 'username'];
    const hasField = fields.some((field) => req.body[field] !== undefined) || req.body.password !== undefined || req.file;
    if (!hasField) {
      return res.status(400).json({ error: 'No se enviaron datos para actualizar' });
    }
    for (const field of fields) {
      if (req.body[field] !== undefined) {
        if (typeof req.body[field] !== 'string' || !req.body[field].trim()) {
          await removeUploadedFiles(req.file ? [req.file] : []);
          return res.status(400).json({ error: `El campo ${field} no puede estar vacio` });
        }
        user[field] = req.body[field].trim();
      }
    }
    if (users.some((item) => item.id !== id && item.username === user.username)) {
      await removeUploadedFiles(req.file ? [req.file] : []);
      return res.status(409).json({ error: 'El username ya esta registrado' });
    }
    if (req.body.password !== undefined) {
      if (typeof req.body.password !== 'string' || !req.body.password) {
        await removeUploadedFiles(req.file ? [req.file] : []);
        return res.status(400).json({ error: 'La password no puede estar vacia' });
      }
      user.password = await hashPassword(req.body.password);
    }

    const oldAvatar = user.avatar;
    if (req.file) {
      user.avatar = `/img/users/${req.file.filename}`;
    }
    await writeData(usersFile, users);
    if (req.file) {
      await removeImages(oldAvatar ? [oldAvatar] : []);
    }
    res.json(publicUser(user));
  } catch (error) {
    await removeUploadedFiles(req.file ? [req.file] : []);
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const id = validId(req.params.id);
    const users = await readData(usersFile);
    const index = id ? users.findIndex((item) => item.id === id) : -1;
    if (index === -1) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    const [deletedUser] = users.splice(index, 1);
    await writeData(usersFile, users);
    await removeImages(deletedUser.avatar ? [deletedUser.avatar] : []);
    res.json({ message: 'Usuario eliminado' });
  } catch (error) {
    next(error);
  }
});

export default router;
