const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// Router API Dashboard & Laporan Executive Owner
router.get('/dashboard', dashboardController.getOwnerDashboard);
router.get('/monitoring-piutang', dashboardController.getMonitoringPiutang);
router.get('/aging-schedule', dashboardController.getAgingSchedule);
router.get('/laporan-penjualan', dashboardController.getLaporanPenjualan);

module.exports = router;
