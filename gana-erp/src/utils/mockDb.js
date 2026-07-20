const INITIAL_CUSTOMERS = [
  { id: 'PLG-001', name: '[DUMMY] Berkah Sekawan Motor', address: 'Jl. A. Yani Km 5, Banjarmasin', phone: '05113256789', outstanding: 15400000, lastOrder: '28 Apr 2026', status: 'Active', city: 'Banjarmasin' }
];

const INITIAL_ORDERS = [
  { id: 'SO-20260615-002', date: '15 Jun 2026', customer: '[DUMMY] Berkah Sekawan Motor', sales: 'Fernando', total: 25000000, status: 'Draft', qty: 62, address: 'Jl. A. Yani Km 5, Banjarmasin' },
  { id: 'SO-20260605-001', date: '05 Jun 2026', customer: '[DUMMY] Berkah Sekawan Motor', sales: 'Fernando', total: 32000000, status: 'Diterima', qty: 80, address: 'Jl. A. Yani Km 5, Banjarmasin' },
  { id: 'SO-20260525-002', date: '25 Mei 2026', customer: '[DUMMY] Berkah Sekawan Motor', sales: 'Fernando', total: 18000000, status: 'Diterima', qty: 45, address: 'Jl. A. Yani Km 5, Banjarmasin' },
  { id: 'SO-20260511-001', date: '11 Mei 2026', customer: '[DUMMY] Berkah Sekawan Motor', sales: 'Fernando', total: 22000000, status: 'Diterima', qty: 55, address: 'Jl. A. Yani Km 5, Banjarmasin' },
  { id: 'SO-20260418-002', date: '18 Apr 2026', customer: '[DUMMY] Berkah Sekawan Motor', sales: 'Fernando', total: 15000000, status: 'Diterima', qty: 38, address: 'Jl. A. Yani Km 5, Banjarmasin' },
  { id: 'SO-20260405-001', date: '05 Apr 2026', customer: '[DUMMY] Berkah Sekawan Motor', sales: 'Fernando', total: 12000000, status: 'Diterima', qty: 30, address: 'Jl. A. Yani Km 5, Banjarmasin' },
  { id: 'SO-20260322-002', date: '22 Mar 2026', customer: '[DUMMY] Berkah Sekawan Motor', sales: 'Fernando', total: 4500000, status: 'Diterima', qty: 11, address: 'Jl. A. Yani Km 5, Banjarmasin' },
  { id: 'SO-20260310-001', date: '10 Mar 2026', customer: '[DUMMY] Berkah Sekawan Motor', sales: 'Fernando', total: 8500000, status: 'Diterima', qty: 20, address: 'Jl. A. Yani Km 5, Banjarmasin' }
];

const INITIAL_INCOMING_STOCK = [
  { id: 'RCV-20260511-01', sj: 'SJ-PLI-8829', supplier: 'PT. PLI (Petronas)', date: '11 Mei 2026', items: 1, totalQty: 100, status: 'pending', draftList: [
    { id: 101, brand: 'Petronas', name: '[DUMMY] Syntium 5000 10W-40', qty: 100, uom: 'Karton' }
  ]}
];

const INITIAL_PRODUCTS = [
  { id: 'PRD-001', brand: 'Kixx', name: '[DUMMY] Kixx G1 5W-30', sae: '5W-30', kemasan: '4L', kategori: 'Gasoline', harga: 400000, stokKarton: 120, stokLiter: 480 }
];

const INITIAL_STOCK_HISTORY = [
  { id: 'TRX-260511-01', date: '11 Mei 2026 14:30', type: 'out', product: '[DUMMY] Kixx G1 5W-30', qty: 15, ref: 'DO-20260511-001 ([DUMMY] Berkah Sekawan Motor)', balance: 105 }
];


// Initialize mock DB
export const initDb = () => {
  if (!localStorage.getItem('gana_customers')) {
    localStorage.setItem('gana_customers', JSON.stringify(INITIAL_CUSTOMERS));
  }
  const existingOrders = localStorage.getItem('gana_orders');
  if (!existingOrders || JSON.parse(existingOrders).length <= 1) {
    localStorage.setItem('gana_orders', JSON.stringify(INITIAL_ORDERS));
  }
  if (!localStorage.getItem('gana_incoming_stock')) {
    localStorage.setItem('gana_incoming_stock', JSON.stringify(INITIAL_INCOMING_STOCK));
  }
  if (!localStorage.getItem('gana_products')) {
    localStorage.setItem('gana_products', JSON.stringify(INITIAL_PRODUCTS));
  }
  if (!localStorage.getItem('gana_stock_history')) {
    localStorage.setItem('gana_stock_history', JSON.stringify(INITIAL_STOCK_HISTORY));
  }
};

export const resetDb = () => {
  localStorage.removeItem('gana_customers');
  localStorage.removeItem('gana_orders');
  localStorage.removeItem('gana_incoming_stock');
  localStorage.removeItem('gana_products');
  localStorage.removeItem('gana_stock_history');
  initDb();
};

export const getFormattedDate = () => {
  const d = new Date();
  const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
  return `${d.getDate().toString().padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

// Customers Methods
export const getCustomers = () => {
  const data = localStorage.getItem('gana_customers');
  return data ? JSON.parse(data) : [];
};

export const saveCustomers = (customers) => {
  localStorage.setItem('gana_customers', JSON.stringify(customers));
};

export const addCustomer = (customer) => {
  const customers = getCustomers();
  customers.push(customer);
  saveCustomers(customers);
};

// Orders Methods
export const getOrders = () => {
  const data = localStorage.getItem('gana_orders');
  return data ? JSON.parse(data) : [];
};

export const saveOrders = (orders) => {
  localStorage.setItem('gana_orders', JSON.stringify(orders));
};

export const addOrder = (order) => {
  const orders = getOrders();
  const dateFormatted = getFormattedDate();
  const newOrder = {
    id: `SO-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${String(orders.length + 1).padStart(3, '0')}`,
    date: dateFormatted,
    ...order
  };
  orders.unshift(newOrder); // Add to top
  saveOrders(orders);

  // Update Customer Outstanding & Last Order
  const customers = getCustomers();
  const customerIndex = customers.findIndex(c => c.name === order.customer);
  if (customerIndex !== -1) {
    if (order.paymentMethod === 'tempo') {
      customers[customerIndex].outstanding += order.total;
    }
    customers[customerIndex].lastOrder = dateFormatted;
    saveCustomers(customers);
  }
};

export const updateOrderStatus = (orderId, newStatus, additionalData = {}) => {
  const orders = getOrders();
  const updatedOrders = orders.map(o => {
    if (o.id === orderId) {
      // If status changes to Shipped and was not Shipped before, deduct stock
      if (newStatus === 'Shipped' && o.status !== 'Shipped') {
        const products = getProducts();
        const history = getStockHistory();
        const now = new Date();
        const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
        const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WITA';
        const dateStr = `${now.getDate().toString().padStart(2, '0')} ${months[now.getMonth()]} ${now.getFullYear()} ${timeStr}`;

        if (o.items && Array.isArray(o.items)) {
          o.items.forEach(item => {
            const prodIdx = products.findIndex(p => p.name === item.name || p.id === item.id);
            if (prodIdx !== -1) {
              const qtyToDeduct = Number(item.qty);
              products[prodIdx].stokKarton = Math.max(0, Number(products[prodIdx].stokKarton) - qtyToDeduct);
              
              // Recalculate stokLiter based on packaging (kemasan)
              const volumeMatch = products[prodIdx].kemasan.match(/(\d+)/);
              const volumePerKarton = volumeMatch ? parseInt(volumeMatch[1]) : 4;
              products[prodIdx].stokLiter = products[prodIdx].stokKarton * volumePerKarton;

              // Generate transaction ID
              const trxId = `TRX-${now.toISOString().slice(2,10).replace(/-/g,'')}-${String(Math.floor(Math.random() * 90) + 10)}`;

              history.unshift({
                id: trxId,
                date: dateStr,
                type: 'out',
                product: products[prodIdx].name,
                qty: qtyToDeduct,
                ref: `DO-${o.id} (${o.customer})`,
                balance: products[prodIdx].stokKarton
              });
            }
          });
        }
        saveProducts(products);
        saveStockHistory(history);
      }
      return { ...o, status: newStatus, ...additionalData };
    }
    return o;
  });
  saveOrders(updatedOrders);
};

// Products Methods
export const getProducts = () => {
  const data = localStorage.getItem('gana_products');
  return data ? JSON.parse(data) : [];
};

export const saveProducts = (products) => {
  localStorage.setItem('gana_products', JSON.stringify(products));
};

// Stock History Methods
export const getStockHistory = () => {
  const data = localStorage.getItem('gana_stock_history');
  return data ? JSON.parse(data) : [];
};

export const saveStockHistory = (history) => {
  localStorage.setItem('gana_stock_history', JSON.stringify(history));
};

// Incoming Stock Methods
export const getIncomingStock = () => {
  const data = localStorage.getItem('gana_incoming_stock');
  return data ? JSON.parse(data) : [];
};

export const saveIncomingStock = (stock) => {
  localStorage.setItem('gana_incoming_stock', JSON.stringify(stock));
};

export const addIncomingStock = (receipt) => {
  const stock = getIncomingStock();
  const dateFormatted = getFormattedDate();
  const newReceipt = {
    id: `RCV-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${String(stock.length + 1).padStart(2, '0')}`,
    date: dateFormatted,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...receipt
  };
  stock.unshift(newReceipt);
  saveIncomingStock(stock);
  return newReceipt;
};

export const updateIncomingStockStatus = (id, newStatus) => {
  const stock = getIncomingStock();
  const updated = stock.map(s => {
    if (s.id === id) {
      // If approved, update products' stock and log stock transaction history
      if (newStatus === 'approved' && s.status !== 'approved') {
        const products = getProducts();
        const history = getStockHistory();
        const now = new Date();
        const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
        const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WITA';
        const dateStr = `${now.getDate().toString().padStart(2, '0')} ${months[now.getMonth()]} ${now.getFullYear()} ${timeStr}`;

        if (s.draftList && Array.isArray(s.draftList)) {
          s.draftList.forEach(item => {
            const prodIdx = products.findIndex(p => p.name === item.name);
            if (prodIdx !== -1) {
              const qtyToAdd = Number(item.qty);
              products[prodIdx].stokKarton = Number(products[prodIdx].stokKarton) + qtyToAdd;
              
              // Recalculate stokLiter based on packaging (kemasan)
              const volumeMatch = products[prodIdx].kemasan.match(/(\d+)/);
              const volumePerKarton = volumeMatch ? parseInt(volumeMatch[1]) : 4;
              products[prodIdx].stokLiter = products[prodIdx].stokKarton * volumePerKarton;

              // Generate transaction ID
              const trxId = `TRX-${now.toISOString().slice(2,10).replace(/-/g,'')}-${String(Math.floor(Math.random() * 90) + 10)}`;

              history.unshift({
                id: trxId,
                date: dateStr,
                type: 'in',
                product: item.name,
                qty: qtyToAdd,
                ref: `${s.id} (${s.supplier})`,
                balance: products[prodIdx].stokKarton
              });
            }
          });
        }
        saveProducts(products);
        saveStockHistory(history);
      }
      return { ...s, status: newStatus, updatedAt: new Date().toISOString() };
    }
    return s;
  });
  saveIncomingStock(updated);
};

// Initialize DB on script load
initDb();

export const confirmOrderPaymentLocal = (orderId) => {
  const orders = getOrders();
  const updatedOrders = orders.map(o => {
    if (o.id === orderId || o.invoiceId === orderId || o.id_transaksi === orderId) {
      return { ...o, statusBayar: 'Lunas' };
    }
    return o;
  });
  saveOrders(updatedOrders);

  // We should also deduct outstanding amount for the customer
  const order = orders.find(o => o.id === orderId || o.invoiceId === orderId || o.id_transaksi === orderId);
  if (order) {
    const customers = getCustomers();
    const customerIndex = customers.findIndex(c => c.name === order.customer);
    if (customerIndex !== -1) {
      customers[customerIndex].outstanding = Math.max(0, customers[customerIndex].outstanding - order.total);
      saveCustomers(customers);
    }
  }
};
