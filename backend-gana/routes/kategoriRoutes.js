const express = require('express');
const router = express.Router();
const kategoriController = require('../controllers/kategoriController');

router.get('/', kategoriController.getAllKategori);
router.post('/', kategoriController.addKategori);
router.put('/:id', kategoriController.updateKategori);
router.delete('/:id', kategoriController.deleteKategori);

module.exports = router;