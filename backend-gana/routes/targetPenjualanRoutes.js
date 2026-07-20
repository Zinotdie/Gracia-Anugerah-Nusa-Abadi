const express = require('express');
const router = express.Router();
const targetController = require('../controllers/targetPenjualanController');

// Router API Target Penjualan Bulanan
router.get('/', targetController.getTarget);
router.post('/', targetController.createTarget);

module.exports = router;
