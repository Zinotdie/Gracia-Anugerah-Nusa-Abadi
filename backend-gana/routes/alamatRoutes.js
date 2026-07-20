const express = require('express');
const router = express.Router();
const alamatController = require('../controllers/alamatController');

router.get('/', alamatController.getAllAlamat);
router.post('/', alamatController.addAlamat);
router.put('/:id', alamatController.updateAlamat);
router.delete('/:id', alamatController.deleteAlamat);

module.exports = router;