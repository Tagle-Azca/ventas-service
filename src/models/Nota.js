const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  productoId:     { type: mongoose.Schema.Types.ObjectId, required: true },
  nombre:         { type: String, required: true },
  cantidad:       { type: Number, required: true, min: 1 },
  precioUnitario: { type: Number, required: true, min: 0 }
}, { _id: false });

const notaSchema = new mongoose.Schema({
  clienteId:    { type: mongoose.Schema.Types.ObjectId, required: true },
  emailCliente: { type: String, required: true, lowercase: true, trim: true },
  productos:    { type: [itemSchema], required: true },
  total:        { type: Number, required: true, min: 0 },
  estado:       { type: String, enum: ['pendiente', 'pagada', 'cancelada'], default: 'pendiente' }
}, { timestamps: true });

module.exports = mongoose.model('Nota', notaSchema);
