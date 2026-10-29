import express from 'express';
import multer from 'multer';
import { publicDirectory } from './middlewares/multer.middleware.js';
import usersRouter from './routes/users.router.js';
import petsRouter from './routes/pets.router.js';

const app = express();
const PORT = process.env.PORT || 8080;

app.use((req, res, next) => {
  const origin = req.get('Origin');
  if (origin && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.vary('Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(publicDirectory));
app.use('/api/users', usersRouter);
app.use('/api/pets', petsRouter);

app.get('/', (req, res) => {
  res.send('API de usuarios y mascotas');
});

app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    const status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    return res.status(status).json({ error: error.message });
  }
  if (error.message === 'Solo se permiten archivos de imagen') {
    return res.status(400).json({ error: error.message });
  }
  const status = error.status || 500;
  res.status(status).json({ error: status === 500 ? 'Error interno del servidor' : error.message });
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});