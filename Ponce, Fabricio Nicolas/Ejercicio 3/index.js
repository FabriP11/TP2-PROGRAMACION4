import express from 'express';
import { conectarDB } from './db.js';
import alumnosRouter from './alumnos.js';
import materiasRouter from './materias.js';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
await conectarDB();

app.get('/', (_req, res) => {
  res.send('API en funcionamiento');
});

app.use('/alumnos', alumnosRouter);
app.use('/materias', materiasRouter);

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
