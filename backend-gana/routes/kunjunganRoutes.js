const express = require('express');
const router = express.Router();
const kunjunganController = require('../controllers/kunjunganController');

router.get('/', kunjunganController.getAllKunjungan);
router.post('/', kunjunganController.addKunjungan);
router.put('/:id', kunjunganController.updateKunjungan);
router.delete('/:id', kunjunganController.deleteKunjungan);

module.exports = router;