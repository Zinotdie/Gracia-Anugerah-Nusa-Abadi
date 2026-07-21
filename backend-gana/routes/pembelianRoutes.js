const express = require('express');
const router = express.Router();
const pembelianController = require('../controllers/pembelianController');

router.get('/', pembelianController.getAllPembelian);
router.post('/', pembelianController.addPembelian);
router.put('/:id/approve', pembelianController.approvePembelian);
router.put('/:id/reject', pembelianController.rejectPembelian);
router.put('/:id', (req, res, next) => {
  const { status, status_qc } = req.body;
  if (status === 'rejected' || status === 'Cacat/Retur' || status_qc === 'Cacat/Retur') {
    return pembelianController.rejectPembelian(req, res, next);
  }
  return pembelianController.approvePembelian(req, res, next);
});

module.exports = router;