const express = require('express');
const router = express.Router();
const pembelianController = require('../controllers/pembelianController');

router.get('/', pembelianController.getAllPembelian);
router.post('/', pembelianController.addPembelian);
router.put('/:id/approve', pembelianController.approvePembelian);
router.put('/:id/reject', pembelianController.rejectPembelian);
router.put('/:id', pembelianController.approvePembelian);

module.exports = router;