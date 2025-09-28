import express from 'express';
import { conectarDB } from './db.js';
import tareasRouter from './tareas.js';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
await conectarDB();

app.get('/', (req, res) => {
  res.send('API en funcionamiento');
});

app.use('/tareas', tareasRouter);

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});

