# API REST de usuarios y mascotas

API creada con Node.js, Express, `fs/promises`, `crypto` y Multer. Los usuarios y las mascotas se guardan en archivos JSON locales. Las imagenes se guardan en `public/img/users` o `public/img/pets` y se sirven directamente desde `public`.

## Ejecutar

Se requiere Node.js 18 o posterior.

```bash
npm install
npm start
```

Abre `http://localhost:8080` para usar Macotafy. La página y el servidor deben estar activos para consultar, crear, editar o eliminar registros; los datos se guardan en los archivos JSON del proyecto.

Si abres la página con Live Server en su puerto predeterminado (`5500`), inicia también el servidor con `npm start`. Macotafy enviará las peticiones al servidor en `http://localhost:8080`. Si el servidor está detenido, no se podrán ver ni guardar registros.

Para cambiar el puerto, configura la variable de entorno `PORT`.

## Rutas

- `GET /api/users`: lista usuarios sin contrasenas.
- `GET /api/users/:id`: consulta un usuario sin contrasena.
- `POST /api/users`: crea usuario. Campos multipart: `firstname`, `lastname`, `username`, `password` y opcional `avatar` (un archivo).
- `PUT /api/users/:id`: actualiza los campos enviados; puede recibir una nueva `avatar` y/o `password`.
- `DELETE /api/users/:id`: elimina usuario y avatar.
- `GET /api/pets`: lista mascotas.
- `GET /api/pets/:id`: consulta una mascota.
- `POST /api/pets`: crea mascota. Campos multipart: `especie`, `color`, `edad`, `sexo` e imagenes opcionales en `img` (hasta 5).
- `PUT /api/pets/:id`: actualiza campos enviados y agrega las imagenes recibidas en `img` a las que ya existen (hasta 5 por solicitud).
- `DELETE /api/pets/:id`: elimina mascota y sus imagenes.

Las imagenes se limitan a 5 MB por archivo y deben tener un tipo MIME de imagen. La ruta que queda guardada en los JSON, por ejemplo `/img/users/avatar-...png`, tambien es una URL accesible desde el navegador mientras el servidor esta activo.

## Respuestas y errores

Las lecturas inexistentes responden `404`; datos faltantes o invalidos, `400`; username repetido, `409`; y archivo mayor al limite, `413`. Las creaciones responden `201`, las lecturas y actualizaciones correctas `200`. Las respuestas de usuario nunca incluyen `password`.

Ejemplo de alta de usuario con `curl`:

```bash
curl -X POST http://localhost:8080/api/users \
  -F "firstname=Wilmer" \
  -F "lastname=Patino" \
  -F "username=w.patino" \
  -F "password=clave-segura" \
  -F "avatar=@./avatar.png"
```

Para mascotas, envia `especie`, `color`, `edad` y `sexo`, y repite `-F "img=@./foto.jpg"` para agregar varias imagenes.
