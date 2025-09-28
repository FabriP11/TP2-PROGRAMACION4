import express from 'express';
import { db } from './db.js';
import { body, param, validationResult } from 'express-validator';

const router = express.Router();
const validarId = param('id').isInt({ min: 1 }).toInt();

const validarRect = [
  body('base').isFloat({ gt: 0 }).withMessage('base > 0').toFloat(),
  body('altura').isFloat({ gt: 0 }).withMessage('altura > 0').toFloat(),
];

const check = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ success: false, errores: errors.array() });
  next();
};

// LISTAR
router.get('/', async (req, res) => {
  const [rows] = await db.execute('SELECT * FROM rectangulos ORDER BY id');
  res.json({ success: true, data: rows });
});

// OBTENER
router.get('/:id', validarId, check, async (req, res) => {
  const { id } = req.params;
  const [rows] = await db.execute('SELECT * FROM rectangulos WHERE id=?', [id]);
  if (rows.length === 0)
    return res.status(404).json({ success: false, message: 'No encontrado' });
  res.json({ success: true, data: rows[0] });
});

// CREAR
router.post('/', validarRect, check, async (req, res) => {
  const { base, altura } = req.body;
  const perimetro = 2 * (base + altura);
  const superficie = base * altura;

  const [r] = await db.execute(
    'INSERT INTO rectangulos (base, altura, perimetro, superficie) VALUES (?,?,?,?)',
    [base, altura, perimetro, superficie]
  );

  res.status(201).json({
    success: true,
    data: { id: r.insertId, base, altura, perimetro, superficie },
  });
});

// MODIFICAR
router.put('/:id', validarId, validarRect, check, async (req, res) => {
  const { id } = req.params;
  const { base, altura } = req.body;
  const perimetro = 2 * (base + altura);
  const superficie = base * altura;

  const [ex] = await db.execute('SELECT id FROM rectangulos WHERE id=?', [id]);
  if (ex.length === 0)
    return res.status(404).json({ success: false, message: 'No encontrado' });

  await db.execute(
    'UPDATE rectangulos SET base=?, altura=?, perimetro=?, superficie=? WHERE id=?',
    [base, altura, perimetro, superficie, id]
  );

  res.json({ success: true, data: { id: Number(id), base, altura, perimetro, superficie } });
});

// BORRAR
router.delete('/:id', validarId, check, async (req, res) => {
  const { id } = req.params;
  const [ex] = await db.execute('SELECT * FROM rectangulos WHERE id=?', [id]);
  if (ex.length === 0)
    return res.status(404).json({ success: false, message: 'No encontrado' });

  await db.execute('DELETE FROM rectangulos WHERE id=?', [id]);
  res.json({ success: true, data: ex[0] });
});

export default router;