const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

// Controller Executive & Operations Dashboard (Direct MySQL Queries)
module.exports = {
  // Ambil data dashboard admin
  getAdminDashboard: asyncHandler(async (req, res) => {
    try {
      const selectedMonth = req.query.bulan || new Date().toISOString().slice(0, 7);
      
      const [totalSalesRow] = await db.query(
        `SELECT COALESCE(SUM(total_netto), 0) AS totalSales FROM penjualan WHERE DATE_FORMAT(tgl_invoice, '%Y-%m') = ?`,
        [selectedMonth]
      );
      const [salesRow] = await db.query(
        `SELECT COUNT(*) AS activeSalesCount FROM users WHERE role = 'sales' AND (is_active = TRUE OR is_active IS NULL)`
      );
      const [customersRow] = await db.query(
        `SELECT COUNT(*) AS registeredCustomersCount FROM pelanggan WHERE (is_active = TRUE OR is_active IS NULL)`
      );
      const [productsRow] = await db.query(
        `SELECT COUNT(*) AS activeProductsCount FROM produk WHERE (is_active = TRUE OR is_active IS NULL)`
      );
      const [monthsRows] = await db.query(
        `SELECT DISTINCT DATE_FORMAT(tgl_invoice, '%Y-%m') AS month FROM penjualan WHERE tgl_invoice IS NOT NULL ORDER BY month DESC`
      );
      const [transactionsRows] = await db.query(
        `SELECT p.id_penjualan, pel.nama_bengkel, p.total_netto, p.status_bayar, p.tgl_invoice 
         FROM penjualan p
         LEFT JOIN pelanggan pel ON p.id_pelanggan = pel.id_pelanggan
         WHERE DATE_FORMAT(p.tgl_invoice, '%Y-%m') = ?
         ORDER BY p.id_penjualan DESC LIMIT 5`,
        [selectedMonth]
      );

      let availableMonths = monthsRows.map(r => r.month);
      if (!availableMonths.includes(selectedMonth)) {
        availableMonths.unshift(selectedMonth);
      }

      const recentTransactions = transactionsRows.map(row => ({
        id: `INV-${String(row.id_penjualan).padStart(4, '0')}`,
        invoiceId: `INV-${String(row.id_penjualan).padStart(4, '0')}`,
        customer: row.nama_bengkel || 'Bengkel System',
        amount: parseFloat(row.total_netto),
        total: parseFloat(row.total_netto),
        status: row.status_bayar,
        statusBayar: row.status_bayar,
        date: row.tgl_invoice ? new Date(row.tgl_invoice).toLocaleDateString('id-ID') : '-'
      }));

      res.json({
        success: true,
        selectedMonth,
        availableMonths,
        stats: {
          totalSales: parseFloat(totalSalesRow[0].totalSales),
          activeSalesCount: parseInt(salesRow[0].activeSalesCount),
          registeredCustomersCount: parseInt(customersRow[0].registeredCustomersCount),
          activeProductsCount: parseInt(productsRow[0].activeProductsCount)
        },
        recentTransactions
      });
    } catch (err) {
      console.error("[getAdminDashboard] ERROR:", err);
      res.status(500).json({ success: false, message: err.message });
    }
  }),

  // Ambil data dashboard owner
  getOwnerDashboard: asyncHandler(async (req, res) => {
    try {
      const selectedMonthStr = req.query.bulan || new Date().toISOString().slice(0, 7);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [totalPiutangRow] = await db.query(
        `SELECT COALESCE(
             (SELECT SUM(total_netto) FROM penjualan WHERE metode_bayar = 'Tempo' AND status_bayar != 'Lunas')
             -
             (SELECT COALESCE(SUM(pp.jumlah_bayar), 0)
              FROM pembayaran_penjualan pp
              JOIN penjualan p ON pp.id_penjualan = p.id_penjualan
              WHERE p.metode_bayar = 'Tempo' AND pp.status_pembayaran = 'Disetujui'),
             0
         ) AS totalPiutang`
      );
      const [overduePiutangRow] = await db.query(
        `SELECT COALESCE(
             (SELECT SUM(total_netto) FROM penjualan WHERE metode_bayar = 'Tempo' AND status_bayar != 'Lunas' AND tgl_jatuh_tempo < NOW())
             -
             (SELECT COALESCE(SUM(pp.jumlah_bayar), 0)
              FROM pembayaran_penjualan pp
              JOIN penjualan p ON pp.id_penjualan = p.id_penjualan
              WHERE p.metode_bayar = 'Tempo' AND pp.status_pembayaran = 'Disetujui' AND p.tgl_jatuh_tempo < NOW()),
             0
         ) AS overduePiutang`
      );
      const [countBengkelRow] = await db.query(
        `SELECT COUNT(DISTINCT id_pelanggan) AS count 
         FROM penjualan 
         WHERE metode_bayar = 'Tempo' AND status_bayar != 'Lunas' AND tgl_jatuh_tempo < NOW()`
      );
      const [salesMTDRow] = await db.query(
        `SELECT COALESCE(SUM(total_netto), 0) AS sales FROM penjualan WHERE DATE_FORMAT(tgl_invoice, '%Y-%m') = ?`,
        [selectedMonthStr]
      );
      const [purchaseMTDRow] = await db.query(
        `SELECT COALESCE(SUM(total_bayar), 0) AS purchase FROM pembelian WHERE DATE_FORMAT(tgl_beli, '%Y-%m') = ?`,
        [selectedMonthStr]
      );

      const chartData = [];
      const [year, month] = selectedMonthStr.split('-').map(Number);
      const shortMonthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];

      for (let i = 3; i >= 0; i--) {
        let m = month - i;
        let y = year;
        if (m < 1) { m += 12; y -= 1; }
        const monthKey = `${y}-${String(m).padStart(2, '0')}`;
        
        const [sRow] = await db.query(`SELECT COALESCE(SUM(total_netto), 0) AS sales FROM penjualan WHERE DATE_FORMAT(tgl_invoice, '%Y-%m') = ?`, [monthKey]);
        const [pRow] = await db.query(`SELECT COALESCE(SUM(total_bayar), 0) AS purchase FROM pembelian WHERE DATE_FORMAT(tgl_beli, '%Y-%m') = ?`, [monthKey]);

        chartData.push({
          label: shortMonthNames[m - 1],
          sales: parseFloat(sRow[0].sales),
          purchase: parseFloat(pRow[0].purchase)
        });
      }

      const [topReceivablesRows] = await db.query(
        `SELECT 
             pel.nama_bengkel AS customer,
             (SUM(p.total_netto) - COALESCE((
                 SELECT SUM(pp.jumlah_bayar)
                 FROM pembayaran_penjualan pp
                 JOIN penjualan p2 ON pp.id_penjualan = p2.id_penjualan
                 WHERE p2.id_pelanggan = pel.id_pelanggan AND pp.status_pembayaran = 'Disetujui'
             ), 0)) AS outstanding,
             MIN(p.tgl_jatuh_tempo) AS earliest_due
         FROM penjualan p
         JOIN pelanggan pel ON p.id_pelanggan = pel.id_pelanggan
         WHERE p.metode_bayar = 'Tempo' AND p.status_bayar != 'Lunas'
         GROUP BY pel.id_pelanggan, pel.nama_bengkel
         ORDER BY outstanding DESC LIMIT 5`
      );

      const topReceivables = topReceivablesRows.map((r, index) => {
        const earliestDue = r.earliest_due ? new Date(r.earliest_due) : null;
        let overdueText = 'Lancar';
        let color = 'bg-[#22C55E]';

        if (earliestDue) {
          earliestDue.setHours(0,0,0,0);
          const diffDays = Math.ceil((earliestDue.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays < 0) {
            overdueText = `Telat ${Math.abs(diffDays)} Hari`;
            color = 'bg-[#EF4444]';
          } else {
            overdueText = `Sisa ${diffDays} Hari`;
            color = 'bg-[#F59E0B]';
          }
        }

        return {
          id: index + 1,
          customer: r.customer,
          amount: parseFloat(r.outstanding || 0),
          outstanding: parseFloat(r.outstanding || 0),
          overdueText,
          color
        };
      });

      res.json({
        success: true,
        stats: {
          totalPiutang: parseFloat(totalPiutangRow[0].totalPiutang || 0),
          overduePiutang: parseFloat(overduePiutangRow[0].overduePiutang || 0),
          piutangJatuhTempo: parseFloat(overduePiutangRow[0].overduePiutang || 0),
          countBengkelOverdue: parseInt(countBengkelRow[0].count || 0),
          countBengkelJatuhTempo: parseInt(countBengkelRow[0].count || 0),
          salesMTD: parseFloat(salesMTDRow[0].sales || 0),
          purchaseMTD: parseFloat(purchaseMTDRow[0].purchase || 0),
          pembelianMTD: parseFloat(purchaseMTDRow[0].purchase || 0)
        },
        chartData,
        topReceivables
      });
    } catch (err) {
      console.error("[getOwnerDashboard] ERROR:", err);
      res.status(500).json({ success: false, message: err.message });
    }
  }),

  // Ambil data monitoring piutang
  getMonitoringPiutang: asyncHandler(async (req, res) => {
    try {
      const today = new Date();
      today.setHours(0,0,0,0);

      const [invoicesRows] = await db.query(
        `SELECT p.id_penjualan, p.tgl_invoice, p.tgl_jatuh_tempo, p.total_netto, p.metode_bayar, p.status_bayar,
                pel.nama_bengkel AS customer,
                (SELECT ab.telp_bengkel FROM alamat_bengkel ab WHERE ab.id_pelanggan = pel.id_pelanggan LIMIT 1) AS phone,
                COALESCE((
                  SELECT SUM(pp.jumlah_bayar)
                  FROM pembayaran_penjualan pp
                  WHERE pp.id_penjualan = p.id_penjualan AND pp.status_pembayaran = 'Disetujui'
                ), 0) AS total_dibayar
         FROM penjualan p
         JOIN pelanggan pel ON p.id_pelanggan = pel.id_pelanggan
         WHERE p.metode_bayar = 'Tempo'
         ORDER BY p.id_penjualan DESC`
      );

      const mappedInvoices = [];
      for (const r of invoicesRows) {
        const invoiceIdStr = `INV-${String(r.id_penjualan).padStart(4, '0')}`;
        const totalNetto = parseFloat(r.total_netto);
        const totalDibayar = parseFloat(r.total_dibayar);
        const remainingAmount = Math.max(0, totalNetto - totalDibayar);
        let statusBayar = remainingAmount === 0 ? 'Lunas' : (totalDibayar > 0 ? 'Cicilan' : 'Belum Lunas');

        const dueDate = r.tgl_jatuh_tempo ? new Date(r.tgl_jatuh_tempo) : null;
        let statusTempo = 'Lancar';
        let overdueDays = 0;

        let diffDaysCalculated = 0;
        if (dueDate) {
          dueDate.setHours(0,0,0,0);
          diffDaysCalculated = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        }

        const isLunas = remainingAmount === 0;
        let uiStatus = 'lancar';
        if (isLunas) {
          uiStatus = 'lunas';
        } else if (dueDate && diffDaysCalculated < 0) {
          uiStatus = 'overdue';
          statusTempo = 'Jatuh Tempo';
          overdueDays = Math.abs(diffDaysCalculated);
        } else if (dueDate && diffDaysCalculated <= 7) {
          uiStatus = 'warning';
          statusTempo = 'Warning';
        }

        const daysVal = uiStatus === 'overdue' ? Math.abs(diffDaysCalculated) : Math.max(0, diffDaysCalculated);

        const [paymentsRows] = await db.query(
          `SELECT id_pembayaran, tgl_bayar AS tgl_pembayaran, jumlah_bayar, metode_bayar AS metode_pembayaran, bukti_bayar, status_pembayaran 
           FROM pembayaran_penjualan WHERE id_penjualan = ? ORDER BY id_pembayaran DESC`,
          [r.id_penjualan]
        );

        mappedInvoices.push({
          id: invoiceIdStr,
          dbId: r.id_penjualan,
          id_penjualan: r.id_penjualan,
          customer: r.customer,
          city: 'Banjarmasin',
          phone: r.phone || '-',
          invoiceDate: r.tgl_invoice ? new Date(r.tgl_invoice).toLocaleDateString('id-ID') : '-',
          dueDate: r.tgl_jatuh_tempo ? new Date(r.tgl_jatuh_tempo).toLocaleDateString('id-ID') : '-',
          rawDueDate: r.tgl_jatuh_tempo,
          amount: totalNetto,
          paidAmount: totalDibayar,
          remainingAmount,
          statusTempo,
          overdueDays,
          statusBayar,
          isLunas,
          status: uiStatus,
          days: daysVal,
          payments: paymentsRows.map(p => ({
            id: p.id_pembayaran,
            date: p.tgl_pembayaran ? new Date(p.tgl_pembayaran).toLocaleDateString('id-ID') : '-',
            amount: parseFloat(p.jumlah_bayar),
            method: p.metode_pembayaran,
            bukti_bayar: p.bukti_bayar || null,
            status: p.status_pembayaran
          }))
        });
      }

      const summaryStats = {
        totalPiutangAktif: mappedInvoices.filter(i => i.remainingAmount > 0).reduce((acc, curr) => acc + curr.remainingAmount, 0),
        totalJatuhTempo: mappedInvoices.filter(i => (i.status === 'overdue' || i.statusTempo === 'Jatuh Tempo') && i.remainingAmount > 0).reduce((acc, curr) => acc + curr.remainingAmount, 0),
        bengkelJatuhTempoCount: new Set(mappedInvoices.filter(i => (i.status === 'overdue' || i.statusTempo === 'Jatuh Tempo') && i.remainingAmount > 0).map(i => i.customer)).size,
        totalInvoices: mappedInvoices.length
      };

      const stats = {
        totalPiutang: summaryStats.totalPiutangAktif || 0,
        overduePiutang: summaryStats.totalJatuhTempo || 0,
        countOverdue: summaryStats.bengkelJatuhTempoCount || 0,
        warningPiutang: mappedInvoices.filter(i => (i.status === 'warning' || i.statusTempo === 'Warning') && i.remainingAmount > 0).reduce((acc, curr) => acc + curr.remainingAmount, 0)
      };

      res.json({ success: true, stats, summaryStats, list: mappedInvoices, invoices: mappedInvoices });
    } catch (err) {
      console.error("[getMonitoringPiutang] ERROR STACK:", err);
      res.status(500).json({ success: false, message: err.message, stack: err.stack });
    }
  }),

  // Ambil data aging schedule (>45 hari)
  getAgingSchedule: asyncHandler(async (req, res) => {
    try {
      const today = new Date();
      today.setHours(0,0,0,0);

      const [workshopsRows] = await db.query(
        `SELECT pel.id_pelanggan, pel.nama_bengkel AS workshop,
                (SELECT ab.telp_bengkel FROM alamat_bengkel ab WHERE ab.id_pelanggan = pel.id_pelanggan LIMIT 1) AS phone
         FROM penjualan p
         JOIN pelanggan pel ON p.id_pelanggan = pel.id_pelanggan
         WHERE p.metode_bayar = 'Tempo'
         GROUP BY pel.id_pelanggan, pel.nama_bengkel`
      );

      const resultList = [];
      for (const w of workshopsRows) {
        const [invRows] = await db.query(
          `SELECT p.id_penjualan, p.tgl_invoice, p.tgl_jatuh_tempo, p.total_netto, p.status_bayar,
                  COALESCE(SUM(pp.jumlah_bayar), 0) AS total_dibayar
           FROM penjualan p
           LEFT JOIN pembayaran_penjualan pp ON p.id_penjualan = pp.id_penjualan AND pp.status_pembayaran = 'Disetujui'
           WHERE p.id_pelanggan = ? AND p.metode_bayar = 'Tempo'
           GROUP BY p.id_penjualan, p.tgl_invoice, p.tgl_jatuh_tempo, p.total_netto, p.status_bayar`,
          [w.id_pelanggan]
        );

        let current = 0;
        let days1_30 = 0;
        let days31_45 = 0;
        let daysOver45 = 0;

        const invoicesList = [];
        for (const inv of invRows) {
          const totalNetto = parseFloat(inv.total_netto);
          const totalDibayar = parseFloat(inv.total_dibayar);
          const remaining = Math.max(0, totalNetto - totalDibayar);

          const invDate = new Date(inv.tgl_invoice || Date.now());
          invDate.setHours(0,0,0,0);
          const ageDays = Math.max(0, Math.floor((today.getTime() - invDate.getTime()) / (1000 * 60 * 60 * 24)));

          if (remaining > 0) {
            if (ageDays <= 0) current += remaining;
            else if (ageDays <= 30) days1_30 += remaining;
            else if (ageDays <= 45) days31_45 += remaining;
            else daysOver45 += remaining;
          }

          const [payLogs] = await db.query(
            `SELECT id_pembayaran, tgl_bayar AS tgl_pembayaran, jumlah_bayar, metode_bayar AS metode_pembayaran, bukti_bayar, status_pembayaran
             FROM pembayaran_penjualan WHERE id_penjualan = ? ORDER BY id_pembayaran DESC`,
            [inv.id_penjualan]
          );

          invoicesList.push({
            id_penjualan: inv.id_penjualan,
            invoiceId: `INV-${String(inv.id_penjualan).padStart(4, '0')}`,
            date: inv.tgl_invoice ? new Date(inv.tgl_invoice).toLocaleDateString('id-ID') : '-',
            dueDate: inv.tgl_jatuh_tempo ? new Date(inv.tgl_jatuh_tempo).toLocaleDateString('id-ID') : '-',
            total: totalNetto,
            paid: totalDibayar,
            remaining,
            statusBayar: inv.status_bayar,
            ageDays,
            paymentLogs: payLogs.map(pl => ({
              id: pl.id_pembayaran,
              date: pl.tgl_pembayaran ? new Date(pl.tgl_pembayaran).toLocaleDateString('id-ID') : '-',
              amount: parseFloat(pl.jumlah_bayar),
              method: pl.metode_pembayaran,
              bukti_bayar: pl.bukti_bayar || null,
              status: pl.status_pembayaran
            }))
          });
        }

        const totalOutstanding = current + days1_30 + days31_45 + daysOver45;
        let statusCategory = 'Lancar (0-30 Hari)';
        let isCritical = false;

        if (daysOver45 > 0) {
          statusCategory = 'Masa Kritis (>45 Hari)';
          isCritical = true;
        } else if (days31_45 > 0) {
          statusCategory = 'Waspada (31-45 Hari)';
        } else if (days1_30 > 0) {
          statusCategory = 'Perhatian (1-30 Hari)';
        }

        resultList.push({
          id: w.id_pelanggan,
          workshop: w.workshop,
          phone: w.phone || '-',
          current,
          days1_30,
          days31_45,
          daysOver45,
          totalOutstanding,
          statusCategory,
          isCritical,
          invoices: invoicesList
        });
      }

      resultList.sort((a, b) => b.daysOver45 - a.daysOver45 || b.totalOutstanding - a.totalOutstanding);

      const tableData = resultList.map(r => ({
        id: r.id,
        workshop: r.workshop,
        phone: r.phone,
        current: r.current,
        d1_30: r.days1_30,
        d31_45: r.days31_45,
        d45_plus: r.daysOver45,
        total: r.totalOutstanding,
        statusCategory: r.statusCategory,
        isCritical: r.isCritical,
        invoices: r.invoices
      }));

      const cards = {
        totalPiutang: tableData.reduce((acc, curr) => acc + curr.total, 0),
        current30: tableData.reduce((acc, curr) => acc + curr.current + curr.d1_30, 0),
        d31_45: tableData.reduce((acc, curr) => acc + curr.d31_45, 0),
        d45_plus: tableData.reduce((acc, curr) => acc + curr.d45_plus, 0)
      };

      const summary = {
        totalAgingPiutang: cards.totalPiutang,
        totalMasaKritis: cards.d45_plus,
        totalWaspada: cards.d31_45,
        bengkelKritisCount: tableData.filter(r => r.d45_plus > 0).length
      };

      res.json({
        success: true,
        cards,
        table: tableData,
        data: {
          cards,
          table: tableData,
          summary,
          agingList: tableData
        }
      });
    } catch (err) {
      console.error("[getAgingSchedule] ERROR STACK:", err);
      res.status(500).json({ success: false, message: err.message, stack: err.stack });
    }
  }),

  // Ambil data laporan penjualan bulanan
  getLaporanPenjualan: asyncHandler(async (req, res) => {
    try {
      const selectedMonth = req.query.bulan || new Date().toISOString().slice(0, 7);

      const [revRow] = await db.query(
        `SELECT COALESCE(SUM(total_netto), 0) AS totalRevenue FROM penjualan WHERE DATE_FORMAT(tgl_invoice, '%Y-%m') = ?`,
        [selectedMonth]
      );

      const [qtyRow] = await db.query(
        `SELECT COALESCE(SUM(pd.qty_dus), 0) AS totalDus
         FROM detail_penjualan pd
         JOIN penjualan p ON pd.id_penjualan = p.id_penjualan
         WHERE DATE_FORMAT(p.tgl_invoice, '%Y-%m') = ?`,
        [selectedMonth]
      );

      const [topCustRows] = await db.query(
        `SELECT pel.nama_bengkel AS name, SUM(p.total_netto) AS totalSpent, COUNT(p.id_penjualan) AS orderCount
         FROM penjualan p
         JOIN pelanggan pel ON p.id_pelanggan = pel.id_pelanggan
         WHERE DATE_FORMAT(p.tgl_invoice, '%Y-%m') = ?
         GROUP BY pel.id_pelanggan, pel.nama_bengkel
         ORDER BY totalSpent DESC LIMIT 5`,
        [selectedMonth]
      );

      const [brandRows] = await db.query(
        `SELECT pr.brand, SUM(COALESCE(pd.subtotal, 0)) AS revenue, SUM(COALESCE(pd.qty_dus, 0)) AS totalDus
         FROM detail_penjualan pd
         JOIN penjualan p ON pd.id_penjualan = p.id_penjualan
         JOIN produk pr ON pd.id_produk = pr.id_produk
         WHERE DATE_FORMAT(p.tgl_invoice, '%Y-%m') = ?
         GROUP BY pr.brand`,
        [selectedMonth]
      );

      const [monthOrders] = await db.query(
        `SELECT p.id_penjualan, p.tgl_invoice, p.total_netto, p.status_bayar,
                pel.nama_bengkel AS customer, u.nama AS sales
         FROM penjualan p
         LEFT JOIN pelanggan pel ON p.id_pelanggan = pel.id_pelanggan
         LEFT JOIN users u ON p.id_sales = u.id
         WHERE DATE_FORMAT(p.tgl_invoice, '%Y-%m') = ?
         ORDER BY p.id_penjualan DESC`,
        [selectedMonth]
      );

      const totalRev = parseFloat(revRow[0].totalRevenue);
      const totalDusVal = parseInt(qtyRow[0].totalDus);
      const orderCountVal = monthOrders.length;
      const avgOrderVal = orderCountVal > 0 ? Math.round(totalRev / orderCountVal) : 0;

      const brandBreakdown = brandRows.map(r => {
        const rev = parseFloat(r.revenue);
        return {
          brand: r.brand || 'Lainnya',
          revenue: rev,
          total: rev,
          dus: parseInt(r.totalDus),
          percentage: totalRev > 0 ? Math.round((rev / totalRev) * 100) : 0
        };
      });

      const mappedTransactions = monthOrders.map(r => ({
        id: `INV-${String(r.id_penjualan).padStart(4, '0')}`,
        date: r.tgl_invoice ? new Date(r.tgl_invoice).toLocaleDateString('id-ID') : '-',
        customer: r.customer || 'Bengkel',
        customerName: r.customer || 'Bengkel',
        sales: r.sales || 'Sales Team',
        salesName: r.sales || 'Sales Team',
        amount: parseFloat(r.total_netto),
        total: parseFloat(r.total_netto),
        paymentMethod: 'Tempo',
        paymentStatus: r.status_bayar || 'Belum Lunas',
        status: r.status_bayar || 'Belum Lunas',
        statusBayar: r.status_bayar || 'Belum Lunas',
        shippingStatus: 'Delivered'
      }));

      const reportData = {
        totalRevenue: totalRev,
        totalDus: totalDusVal,
        avgOrder: avgOrderVal,
        summary: {
          totalRevenue: totalRev,
          totalDus: totalDusVal,
          totalOrders: orderCountVal
        },
        topCustomers: topCustRows.map(r => {
          const spent = parseFloat(r.totalSpent);
          return {
            name: r.name,
            city: 'Banjarmasin',
            totalSpent: spent,
            total: spent,
            orderCount: parseInt(r.orderCount),
            percentage: totalRev > 0 ? Math.round((spent / totalRev) * 100) : 0
          };
        }),
        brandBreakdown,
        transactions: mappedTransactions,
        orders: mappedTransactions
      };

      res.json({ success: true, data: reportData });
    } catch (err) {
      console.error("[getLaporanPenjualan] ERROR STACK:", err);
      res.status(500).json({ success: false, message: err.message, stack: err.stack });
    }
  })
};
