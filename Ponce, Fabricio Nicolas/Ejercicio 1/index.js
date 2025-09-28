import express from 'express';
import { conectarDB } from './db.js';
import rectangulosRouter from './rectangulos.js';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
conectarDB();

app.get('/', (req, res) => {
  res.send('API en funcionamiento');
});

app.use('/rectangulos', rectangulosRouter);

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});

