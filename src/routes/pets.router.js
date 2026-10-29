import { Router } from 'express';
import { fileURLToPath } from 'node:url';
import { uploadPets } from '../middlewares/multer.middleware.js';
import { readData, writeData } from '../util/file.util.js';
import { removeImages, removeUploadedFiles } from '../util/files.js';

const router = Router();
const petsFile = fileURLToPath(new URL('../data/pets.json', import.meta.url));

function validId(id) {
  const numericId = Number(id);
  return Number.isInteger(numericId) && numericId > 0 ? numericId : null;
}

function imagePaths(files = []) {
  return files.map((file) => `/img/pets/${file.filename}`);
}

router.get('/', async (req, res, next) => {
  try {
    res.json(await readData(petsFile));
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const id = validId(req.params.id);
    const pet = id && (await readData(petsFile)).find((item) => item.id === id);
    if (!pet) {
      return res.status(404).json({ error: 'Mascota no encontrada' });
    }
    res.json(pet);
  } catch (error) {
    next(error);
  }
});

router.post('/', uploadPets.array('img', 5), async (req, res, next) => {
  try {
    const { especie, color, edad, sexo } = req.body;
    const numericAge = Number(edad);
    if (![especie, color, sexo].every((value) => typeof value === 'string' && value.trim()) || !Number.isInteger(numericAge) || numericAge < 0) {
      await removeUploadedFiles(req.files);
      return res.status(400).json({ error: 'Se requieren especie, color, edad valida y sexo' });
    }

    const pets = await readData(petsFile);
    const newPet = {
      id: pets.reduce((highestId, pet) => Math.max(highestId, pet.id), 0) + 1,
      especie: especie.trim(),
      color: color.trim(),
      edad: numericAge,
      sexo: sexo.trim(),
      img: imagePaths(req.files)
    };

    pets.push(newPet);
    await writeData(petsFile, pets);
    res.status(201).json(newPet);
  } catch (error) {
    await removeUploadedFiles(req.files);
    next(error);
  }
});

router.put('/:id', uploadPets.array('img', 5), async (req, res, next) => {
  try {
    const id = validId(req.params.id);
    const pets = await readData(petsFile);
    const pet = id && pets.find((item) => item.id === id);
    if (!pet) {
      await removeUploadedFiles(req.files);
      return res.status(404).json({ error: 'Mascota no encontrada' });
    }

    const fields = ['especie', 'color', 'sexo'];
    const hasChanges = fields.some((field) => req.body[field] !== undefined) || req.body.edad !== undefined || req.files.length > 0;
    if (!hasChanges) {
      return res.status(400).json({ error: 'No se enviaron datos para actualizar' });
    }
    for (const field of fields) {
      if (req.body[field] !== undefined) {
        if (typeof req.body[field] !== 'string' || !req.body[field].trim()) {
          await removeUploadedFiles(req.files);
          return res.status(400).json({ error: `El campo ${field} no puede estar vacio` });
        }
        pet[field] = req.body[field].trim();
      }
    }
    if (req.body.edad !== undefined) {
      const numericAge = Number(req.body.edad);
      if (!Number.isInteger(numericAge) || numericAge < 0) {
        await removeUploadedFiles(req.files);
        return res.status(400).json({ error: 'La edad debe ser un numero entero mayor o igual a cero' });
      }
      pet.edad = numericAge;
    }

    if (req.files.length > 0) {
      pet.img = [...pet.img, ...imagePaths(req.files)];
    }
    await writeData(petsFile, pets);
    res.json(pet);
  } catch (error) {
    await removeUploadedFiles(req.files);
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const id = validId(req.params.id);
    const pets = await readData(petsFile);
    const index = id ? pets.findIndex((item) => item.id === id) : -1;
    if (index === -1) {
      return res.status(404).json({ error: 'Mascota no encontrada' });
    }
    const [deletedPet] = pets.splice(index, 1);
    await writeData(petsFile, pets);
    await removeImages(deletedPet.img);
    res.json({ message: 'Mascota eliminada' });
  } catch (error) {
    next(error);
  }
});

export default router;
