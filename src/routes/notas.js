const router = require('express').Router();
const AWS = require('aws-sdk');
const Nota = require('../models/Nota');

const sns = new AWS.SNS({ region: process.env.AWS_REGION || 'us-east-1' });

async function publicarNotificacion(nota) {
  const payload = {
    notaId:       nota._id.toString(),
    clienteId:    nota.clienteId.toString(),
    emailCliente: nota.emailCliente,
    total:        nota.total,
    estado:       nota.estado,
    productos:    nota.productos,
    fecha:        nota.createdAt
  };

  const fecha = new Date(nota.createdAt).toLocaleString('es-MX', { timeZone: 'America/Mexico_City' });
  const lineas = nota.productos.map(p =>
    `  • ${p.nombre} x${p.cantidad}  —  $${p.precioUnitario.toLocaleString('es-MX')}`
  ).join('\n');

  const emailTexto = [
    '================================================',
    '        CONFIRMACIÓN DE NOTA DE VENTA',
    '================================================',
    `Nota #:   ${nota._id}`,
    `Fecha:    ${fecha}`,
    `Estado:   ${nota.estado.toUpperCase()}`,
    '------------------------------------------------',
    'PRODUCTOS:',
    lineas,
    '------------------------------------------------',
    `TOTAL:    $${nota.total.toLocaleString('es-MX')}`,
    '================================================',
    'Gracias por tu compra.',
  ].join('\n');

  const params = {
    TopicArn:        process.env.SNS_TOPIC_ARN,
    Subject:         `Nota de venta #${nota._id} — $${nota.total.toLocaleString('es-MX')}`,
    MessageStructure: 'json',
    Message: JSON.stringify({
      default: JSON.stringify(payload),
      email:   emailTexto,
      http:    JSON.stringify(payload),
      https:   JSON.stringify(payload)
    })
  };

  await sns.publish(params).promise();
}

router.get('/', async (req, res) => {
  try {
    const notas = await Nota.find();
    res.json(notas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const nota = await Nota.findById(req.params.id);
    if (!nota) return res.status(404).json({ error: 'Nota no encontrada' });
    res.json(nota);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const nota = new Nota(req.body);
    const saved = await nota.save();

    try {
      await publicarNotificacion(saved);
      console.log(`[ventas-service] Notificación publicada en SNS para nota ${saved._id}`);
    } catch (snsErr) {
      console.error('[ventas-service] Error al publicar en SNS:', snsErr.message);
    }

    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const updated = await Nota.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ error: 'Nota no encontrada' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Nota.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Nota no encontrada' });
    res.json({ message: 'Nota eliminada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
