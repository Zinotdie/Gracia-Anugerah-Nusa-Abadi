const express = require('express');
const router = express.Router();
const penjualanController = require('../controllers/penjualanController');

// 1. Static & Specific Routes (Wajib paling atas agar tidak bentrok dengan parameter /:id)
router.get('/all-pembayaran', penjualanController.getAllPembayaran);
router.get('/pembayaran', penjualanController.getAllPembayaran);
router.put('/pembayaran/:idPembayaran', penjualanController.updateStatusPembayaran);

// 2. Base & Parameterized Routes
router.get('/', penjualanController.getAllPenjualan);
router.post('/', penjualanController.addPenjualan);
router.get('/:id/pembayaran', penjualanController.getPembayaran);
router.post('/:id/pembayaran', penjualanController.addPembayaran);
router.put('/:id', penjualanController.updatePenjualan);
router.delete('/:id', penjualanController.deletePenjualan);

module.exports = router;