import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { db } from './db.js';

const router = express.Router();
const validarId = param('id').isInt({ min: 1 });
const validarTarea = [
  body('nombre', 'Nombre inválido')
    .isString()
    .trim()
    .isLength({ min: 3, max: 100 }),
  body('hecha', 'hecha debe ser true o false')
    .isBoolean()
];

const validarFiltro = [
  query('hecha').optional().isBoolean().withMessage('hecha debe ser true o false')
];

const verificarValidacion = (req, res, next) => {
  const r = validationResult(req);
  if (!r.isEmpty()) {
    return res.status(400).json({ success: false, errores: r.array() });
  }
  next();
};

// GET tareas
router.get('/', validarFiltro, verificarValidacion, async (req, res) => {
  let sql = 'SELECT * FROM tareas ORDER BY id';
  const params = [];

  if (req.query.hecha !== undefined) {
    sql = 'SELECT * FROM tareas WHERE hecha = ? ORDER BY id';
    params.push(req.query.hecha === 'true' ? 1 : 0);
  }

  const [rows] = await db.execute(sql, params);
  res.json({ success: true, data: rows });
});

// GET tareas id
router.get('/:id', validarId, verificarValidacion, async (req, res) => {
  const id = Number(req.params.id);
  const [rows] = await db.execute('SELECT * FROM tareas WHERE id=?', [id]);

  if (rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Tarea no encontrada' });
  }
  res.json({ success: true, data: rows[0] });
});

// POST tareas
router.post('/', validarTarea, verificarValidacion, async (req, res) => {
  const { nombre, hecha } = req.body;

  // evitar duplicados
  const [existe] = await db.execute('SELECT id FROM tareas WHERE nombre=?', [nombre]);
  if (existe.length) {
    return res.status(400).json({ success: false, message: 'Ya existe una tarea con ese nombre' });
  }

  const [result] = await db.execute(
    'INSERT INTO tareas (nombre, hecha) VALUES (?, ?)',
    [nombre, hecha ? 1 : 0]
  );

  res.status(201).json({
    success: true,
    data: { id: result.insertId, nombre, hecha: !!hecha }
  });
});

// PUT tareas id
router.put('/:id', [validarId, ...validarTarea], verificarValidacion, async (req, res) => {
  const id = Number(req.params.id);
  const { nombre, hecha } = req.body;

  // nombre duplicado
  const [dup] = await db.execute('SELECT id FROM tareas WHERE nombre=? AND id<>?', [nombre, id]);
  if (dup.length) {
    return res.status(400).json({ success: false, message: 'Ya existe una tarea con ese nombre' });
  }

  const [result] = await db.execute(
    'UPDATE tareas SET nombre=?, hecha=? WHERE id=?',
    [nombre, hecha ? 1 : 0, id]
  );

  if (result.affectedRows === 0) {
    return res.status(404).json({ success: false, message: 'Tarea no encontrada' });
  }

  res.json({ success: true, data: { id, nombre, hecha: !!hecha } });
});

// DELETE tareas id
router.delete('/:id', validarId, verificarValidacion, async (req, res) => {
  const id = Number(req.params.id);
  const [result] = await db.execute('DELETE FROM tareas WHERE id=?', [id]);

  if (result.affectedRows === 0) {
    return res.status(404).json({ success: false, message: 'Tarea no encontrada' });
  }

  res.json({ success: true, message: 'Tarea eliminada' });
});

export default router;
