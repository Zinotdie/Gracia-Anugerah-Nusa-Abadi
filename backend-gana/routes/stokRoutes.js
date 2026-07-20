const express = require('express');
const router = express.Router();
const stokController = require('../controllers/stokController');

router.get('/', stokController.getAllStok);
router.get('/riwayat', stokController.getRiwayatStok);

module.exports = router;