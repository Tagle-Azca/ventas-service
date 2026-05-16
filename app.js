require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'ventas-service',
    environment: process.env.NODE_ENV || 'local'
  });
});

app.use('/api/notas', require('./src/routes/notas'));

const PORT = process.env.PORT || 3002;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('[ventas-service] Conectado a MongoDB');
    app.listen(PORT, () =>
      console.log(`[ventas-service] Corriendo en puerto ${PORT} — ambiente: ${process.env.NODE_ENV || 'local'}`)
    );
  })
  .catch(err => {
    console.error('[ventas-service] Error al conectar a MongoDB:', err.message);
    process.exit(1);
  });
