import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { db } from './db.js';

const router = express.Router();

const validarId = param('id').isInt({ min: 1 });
const validarMateria = [
  body('nombre').isString().trim().isLength({ min: 3, max: 100 }),
];

function verificar(req, res, next) {
  const r = validationResult(req);
  if (!r.isEmpty()) return res.status(400).json({ success: false, errores: r.array() });
  next();
}

// GET materias
router.get('/', async (_req, res) => {
  const [rows] = await db.execute('SELECT * FROM materias ORDER BY nombre');
  res.json({ success: true, data: rows });
});

// GET materias id
router.get('/:id', validarId, verificar, async (req, res) => {
  const id = Number(req.params.id);
  const [rows] = await db.execute('SELECT * FROM materias WHERE id=?', [id]);
  if (!rows.length) return res.status(404).json({ success: false, message: 'Materia no encontrada' });
  res.json({ success: true, data: rows[0] });
});

// GET materias id alumnos
router.get('/:id/alumnos', validarId, verificar, async (req, res) => {
  const id = Number(req.params.id);

  const [materia] = await db.execute('SELECT * FROM materias WHERE id=?', [id]);
  if (!materia.length) return res.status(404).json({ success: false, message: 'Materia no encontrada' });

  const [rows] = await db.execute(
    `SELECT a.id, a.nombre, a.nota1, a.nota2, a.nota3, a.promedio
     FROM alumnos a
     WHERE a.materia_id = ?
     ORDER BY a.nombre`,
    [id]
  );
  res.json({ success: true, materia: materia[0], data: rows });
});

// POST materias
router.post('/', validarMateria, verificar, async (req, res) => {
  const { nombre } = req.body;
  const [result] = await db.execute('INSERT INTO materias (nombre) VALUES (?)', [nombre]);
  res.status(201).json({ success: true, data: { id: result.insertId, nombre } });
});

// PUT materias id
router.put('/:id', [validarId, ...validarMateria], verificar, async (req, res) => {
  const id = Number(req.params.id);
  const { nombre } = req.body;

  const [result] = await db.execute('UPDATE materias SET nombre=? WHERE id=?', [nombre, id]);
  if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Materia no encontrada' });

  res.json({ success: true, data: { id, nombre } });
});

// DELETE materias id
router.delete('/:id', validarId, verificar, async (req, res) => {
  const id = Number(req.params.id);
  const [result] = await db.execute('DELETE FROM materias WHERE id=?', [id]);
  if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Materia no encontrada' });
  res.json({ success: true, message: 'Materia eliminada' });
});

export default router;
