import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { db } from './db.js';

const router = express.Router();

const validarId = param('id').isInt({ min: 1 });
const validarAlumno = [
  body('nombre').isString().trim().isLength({ min: 3, max: 100 }),
  body('materia_id').isInt({ min: 1 }),
  body('nota1').isFloat({ min: 0, max: 10 }),
  body('nota2').isFloat({ min: 0, max: 10 }),
  body('nota3').isFloat({ min: 0, max: 10 }),
];

function verificar(req, res, next) {
  const r = validationResult(req);
  if (!r.isEmpty()) return res.status(400).json({ success: false, errores: r.array() });
  next();
}

const calcProm = (n1, n2, n3) => Number(((Number(n1)+Number(n2)+Number(n3))/3).toFixed(2));

// GET alumnos
router.get('/', async (_req, res) => {
  const [rows] = await db.execute(
    `SELECT a.*, m.nombre AS materia
     FROM alumnos a
     JOIN materias m ON m.id = a.materia_id
     ORDER BY a.nombre, m.nombre`
  );
  res.json({ success: true, data: rows });
});

// GET alumnos id
router.get('/:id', validarId, verificar, async (req, res) => {
  const id = Number(req.params.id);
  const [rows] = await db.execute(
    `SELECT a.*, m.nombre AS materia
     FROM alumnos a
     JOIN materias m ON m.id = a.materia_id
     WHERE a.id=?`,
    [id]
  );
  if (!rows.length) return res.status(404).json({ success: false, message: 'Alumno no encontrado' });
  res.json({ success: true, data: rows[0] });
});

// POST alumnos
router.post('/', validarAlumno, verificar, async (req, res) => {
  const { nombre, materia_id, nota1, nota2, nota3 } = req.body;

  // materia existente
  const [mat] = await db.execute('SELECT id FROM materias WHERE id=?', [materia_id]);
  if (!mat.length) return res.status(400).json({ success: false, message: 'La materia no existe' });
  
  // no duplicado
  const [dup] = await db.execute(
    'SELECT id FROM alumnos WHERE nombre=? AND materia_id=?',
    [nombre, materia_id]
  );
  if (dup.length) return res.status(400).json({ success: false, message: 'Ya existe ese alumno en esa materia' });

  const promedio = calcProm(nota1, nota2, nota3);

  const [result] = await db.execute(
    'INSERT INTO alumnos (nombre, materia_id, nota1, nota2, nota3, promedio) VALUES (?, ?, ?, ?, ?, ?)',
    [nombre, materia_id, nota1, nota2, nota3, promedio]
  );

  res.status(201).json({
    success: true,
    data: { id: result.insertId, nombre, materia_id, nota1, nota2, nota3, promedio }
  });
});

// PUT alumnos id
router.put('/:id', [validarId, ...validarAlumno], verificar, async (req, res) => {
  const id = Number(req.params.id);
  const { nombre, materia_id, nota1, nota2, nota3 } = req.body;

  // materia existe
  const [mat] = await db.execute('SELECT id FROM materias WHERE id=?', [materia_id]);
  if (!mat.length) return res.status(400).json({ success: false, message: 'La materia no existe' });

  // no duplicado con otro id
  const [dup] = await db.execute(
    'SELECT id FROM alumnos WHERE nombre=? AND materia_id=? AND id<>?',
    [nombre, materia_id, id]
  );
  if (dup.length) return res.status(400).json({ success: false, message: 'Ya existe ese alumno en esa materia' });

  const promedio = calcProm(nota1, nota2, nota3);

  const [result] = await db.execute(
    'UPDATE alumnos SET nombre=?, materia_id=?, nota1=?, nota2=?, nota3=?, promedio=? WHERE id=?',
    [nombre, materia_id, nota1, nota2, nota3, promedio, id]
  );

  if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Alumno no encontrado' });

  res.json({ success: true, data: { id, nombre, materia_id, nota1, nota2, nota3, promedio } });
});

// DELETE alumnos id
router.delete('/:id', validarId, verificar, async (req, res) => {
  const id = Number(req.params.id);
  const [result] = await db.execute('DELETE FROM alumnos WHERE id=?', [id]);
  if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Alumno no encontrado' });
  res.json({ success: true, message: 'Alumno eliminado' });
});

export default router;
