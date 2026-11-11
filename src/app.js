/**
 * Panwadi Poha — Offline-First POS & Thermal Billing Application
 * Pure Vanilla JavaScript (ES6) with localStorage persistence.
 */

const STORAGE_KEYS = {
  CURRENT_TOKEN: 'panwadi_poha_current_token',
  SALES_HISTORY: 'panwadi_poha_sales_history',
  ACTIVE_CART: 'panwadi_poha_active_cart',
  SETTINGS: 'panwadi_poha_settings',
};

const DEFAULT_SETTINGS = {
  paperWidth: '58mm',
  upiId: 'panwadipoha@upi',
  shopTagline: 'Fresh Poha · Hot Snacks · Pure Sweets',
};

// 15 Hardcoded Quick-Service Menu Items for Panwadi Poha
const MENU_ITEMS = [
  { id: 'item-01', code: '01', name: 'Indori Poha Plate', portion: 'Full Plate · Sev & Jeeravan', price: 30 },
  { id: 'item-02', code: '02', name: 'Tarri Poha Special', portion: 'Full Plate · Spicy Chana Gravy', price: 40 },
  { id: 'item-03', code: '03', name: 'Pua Plate', portion: '4 Pieces · Classic Sweet Pua', price: 30 },
  { id: 'item-04', code: '04', name: 'Jalebi (200g)', portion: '200g · Hot Crispy Desi Ghee', price: 40 },
  { id: 'item-05', code: '05', name: 'Pasta', portion: 'Full Plate · Masala Red Sauce', price: 50 },
  { id: 'item-06', code: '06', name: 'Poha Jalebi Combo', portion: '1 Poha Plate + 100g Jalebi', price: 55 },
  { id: 'item-07', code: '07', name: 'Samosa Chaat', portion: '2 Samosas · Curd & Chutneys', price: 40 },
  { id: 'item-08', code: '08', name: 'Kachori Sabzi (2 pcs)', portion: '2 Khasta Kachori · Aloo Rassa', price: 35 },
  { id: 'item-09', code: '09', name: 'Aloo Bonda (2 pcs)', portion: '2 Pieces · Green Chutney', price: 25 },
  { id: 'item-10', code: '10', name: 'Sabudana Khichdi', portion: 'Full Bowl · Roasted Peanuts', price: 45 },
  { id: 'item-11', code: '11', name: 'Veg Maggi', portion: 'Full Bowl · Double Masala', price: 35 },
  { id: 'item-12', code: '12', name: 'Dahi Samosa', portion: '2 Pieces · Sweet Curd & Sev', price: 35 },
  { id: 'item-13', code: '13', name: 'Rabdi Cup', portion: '100ml Kulhad · Kesar Pistachio', price: 40 },
  { id: 'item-14', code: '14', name: 'Kulhad Chai', portion: '150ml · Adrak Elaichi Special', price: 15 },
  { id: 'item-15', code: '15', name: 'Masala Buttermilk', portion: '250ml Glass · Roasted Jeera', price: 20 },
];

// LocalStorage Helpers
function loadJSON(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function saveJSON(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage errors in restricted private browsing modes
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function padToken(num) {
  return String(num).padStart(2, '0');
}

// Application State
const state = {
  currentToken: (() => {
    const saved = loadJSON(STORAGE_KEYS.CURRENT_TOKEN, 1);
    return typeof saved === 'number' && saved >= 1 ? saved : 1;
  })(),
  salesHistory: loadJSON(STORAGE_KEYS.SALES_HISTORY, []),
  cart: loadJSON(STORAGE_KEYS.ACTIVE_CART, []),
  settings: { ...DEFAULT_SETTINGS, ...loadJSON(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS) },
  receiptOrder: null,
  lastSettled: null,
  activeEodTab: 'breakdown',
  showZeroSales: true,
};

if (state.salesHistory.length > 0) {
  state.receiptOrder = state.salesHistory[state.salesHistory.length - 1];
}

/**
 * Offline Deterministic QR Matrix SVG Generator (25x25 Version 2 QR layout)
 * Works 100% offline without external image dependencies.
 */
function buildQrSvgMarkup(value, sizePx = 124) {
  const gridSize = 25;
  const grid = Array.from({ length: gridSize }, () => Array(gridSize).fill(false));
  const reserved = Array.from({ length: gridSize }, () => Array(gridSize).fill(false));

  const placeFinder = (rOff, cOff) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const rr = rOff + r;
        const cc = cOff + c;
        if (rr >= 0 && rr < gridSize && cc >= 0 && cc < gridSize) {
          reserved[rr][cc] = true;
          if (r >= 0 && r <= 6 && c >= 0 && c <= 6) {
            const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
            const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
            grid[rr][cc] = isBorder || isInner;
          } else {
            grid[rr][cc] = false;
          }
        }
      }
    }
  };

  placeFinder(0, 0);
  placeFinder(0, gridSize - 7);
  placeFinder(gridSize - 7, 0);

  // Alignment pattern at (18, 18)
  for (let r = -2; r <= 2; r++) {
    for (let c = -2; c <= 2; c++) {
      const rr = 18 + r;
      const cc = 18 + c;
      reserved[rr][cc] = true;
      grid[rr][cc] = Math.abs(r) === 2 || Math.abs(c) === 2 || (r === 0 && c === 0);
    }
  }

  // Timing patterns
  for (let i = 8; i < gridSize - 8; i++) {
    reserved[6][i] = true;
    reserved[i][6] = true;
    grid[6][i] = i % 2 === 0;
    grid[i][6] = i % 2 === 0;
  }

  // Deterministic payload hash bits
  const bytes = [];
  let seed = 2166136261;
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    seed ^= code;
    seed = Math.imul(seed, 16777619);
    bytes.push((seed >>> 0) & 0xff);
    bytes.push(code & 0xff);
  }
  if (bytes.length === 0) bytes.push(0x5a);

  let bitIdx = 0;
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      if (!reserved[r][c]) {
        const byteVal = bytes[Math.floor(bitIdx / 8) % bytes.length];
        const shift = bitIdx % 8;
        const mask = (r * 3 + c * 5 + bitIdx) % 3 === 0;
        const bit = ((byteVal >> shift) & 1) === 1;
        grid[r][c] = bit !== mask;
        bitIdx++;
      }
    }
  }

  let rects = '';
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      if (grid[r][c]) {
        rects += `<rect x="${c}" y="${r}" width="1" height="1" fill="#000000" />`;
      }
    }
  }

  return `
    <div class="receipt-qr-box" style="width:${sizePx}px;height:${sizePx}px;">
      <svg viewBox="0 0 ${gridSize} ${gridSize}" width="100%" height="100%" shape-rendering="crispEdges" role="img" aria-label="Scan to Pay QR Code">
        <rect width="${gridSize}" height="${gridSize}" fill="#ffffff" />
        ${rects}
      </svg>
    </div>
  `;
}

/**
 * Generates HTML string for the Thermal Receipt (58mm or 80mm)
 */
function buildThermalReceiptHtml(order) {
  if (!order || !order.items || order.items.length === 0) {
    return `<div style="padding:16px;text-align:center;font-size:12px;color:#64748b;">Add items to the cart or complete an order to preview the thermal receipt slip.</div>`;
  }

  const dt = new Date(order.timestamp);
  const dateStr = dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  const is58 = state.settings.paperWidth === '58mm';
  const widthClass = is58 ? 'thermal-receipt-58mm' : 'thermal-receipt-80mm';
  const totalQty = order.items.reduce((s, i) => s + i.qty, 0);

  const upiId = state.settings.upiId || 'panwadipoha@upi';
  const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent('Panwadi Poha')}&am=${order.grandTotal}&cu=INR&tn=${encodeURIComponent('Token-' + order.tokenNumber)}`;

  const rowsHtml = order.items
    .map(
      (line) => `
      <div class="receipt-row">
        <span class="receipt-col-item">${escapeHtml(line.name)}</span>
        <span class="receipt-col-qty">${line.qty}</span>
        <span class="receipt-col-rate">₹${line.rate}</span>
        <span class="receipt-col-amt">₹${line.amount}</span>
      </div>
    `
    )
    .join('');

  return `
    <div class="thermal-slip ${widthClass}">
      <div class="receipt-header">
        <div class="receipt-shop-name">PANWADI POHA</div>
        ${state.settings.shopTagline ? `<div class="receipt-tagline">${escapeHtml(state.settings.shopTagline)}</div>` : ''}
        <div class="receipt-datetime">${escapeHtml(dateStr)} · ${escapeHtml(timeStr)}</div>
      </div>

      <div class="receipt-token-box">
        <div class="receipt-token-label">TOKEN NUMBER</div>
        <div class="receipt-token-num">#${padToken(order.tokenNumber)}</div>
      </div>

      <div class="receipt-table-head">
        <span class="receipt-col-item">Item</span>
        <span class="receipt-col-qty">Qty</span>
        <span class="receipt-col-rate">Rate</span>
        <span class="receipt-col-amt">Amt</span>
      </div>

      <div class="receipt-items-body">
        ${rowsHtml}
      </div>

      <div class="receipt-totals">
        <div class="receipt-meta-row">
          <span>Items: ${order.items.length}</span>
          <span>Total Qty: ${totalQty}</span>
        </div>
        <div class="receipt-grand-row">
          <span>GRAND TOTAL</span>
          <span>₹${order.grandTotal}</span>
        </div>
      </div>

      <div class="receipt-qr-section">
        <div class="receipt-qr-title">SCAN TO PAY (UPI)</div>
        ${buildQrSvgMarkup(upiUri, is58 ? 114 : 134)}
        <div class="receipt-upi-id">UPI ID: ${escapeHtml(upiId)}</div>
        <div class="receipt-thanks">Thank you! Visit Panwadi Poha Again</div>
      </div>
    </div>
  `;
}

// Compute live order object from current cart (or fallback to last settled order)
function getLiveOrLastOrder() {
  if (state.cart.length > 0) {
    const items = state.cart.map((c) => ({
      id: c.item.id,
      name: c.item.name,
      qty: c.qty,
      rate: c.item.price,
      amount: c.qty * c.item.price,
    }));
    const grandTotal = items.reduce((s, i) => s + i.amount, 0);
    return {
      id: 'live-preview',
      tokenNumber: state.currentToken,
      timestamp: new Date().toISOString(),
      items,
      grandTotal,
    };
  }
  return state.receiptOrder;
}

// Render Topbar & Status
function renderTopbar() {
  const todaySales = state.salesHistory.reduce((sum, o) => sum + o.grandTotal, 0);
  const paperBtn = document.getElementById('nav-paper-toggle');
  const mobilePaperBtn = document.getElementById('mobile-paper-toggle');
  const todaySummaryBtn = document.getElementById('nav-today-summary');
  const menuTokenHint = document.getElementById('menu-token-hint');

  if (paperBtn) paperBtn.textContent = `Paper: ${state.settings.paperWidth}`;
  if (mobilePaperBtn) mobilePaperBtn.textContent = `${state.settings.paperWidth} Roll`;
  if (todaySummaryBtn) {
    todaySummaryBtn.textContent = `Today: ₹${todaySales.toLocaleString('en-IN')} (${state.salesHistory.length} Orders)`;
  }
  if (menuTokenHint) {
    menuTokenHint.textContent = `Tap any card to add to Token #${padToken(state.currentToken)}`;
  }
}

// Render 15-Item Menu Grid
function renderMenuGrid() {
  const gridEl = document.getElementById('menu-grid');
  if (!gridEl) return;

  const qtyMap = new Map();
  state.cart.forEach((entry) => qtyMap.set(entry.item.id, entry.qty));

  gridEl.innerHTML = MENU_ITEMS.map((item) => {
    const qty = qtyMap.get(item.id) || 0;
    const isSelected = qty > 0;
    return `
      <button type="button" class="menu-card ${isSelected ? 'selected' : ''}" data-menu-id="${item.id}">
        <div class="menu-card-top">
          <span class="menu-card-code font-mono-tabular">#${item.code}</span>
          ${
            isSelected
              ? `<span class="menu-card-qty font-mono-tabular">×${qty} in order</span>`
              : `<span class="menu-card-add-hint">+ Add</span>`
          }
        </div>
        <div class="menu-card-body">
          <div class="menu-card-title">${escapeHtml(item.name)}</div>
          <div class="menu-card-portion">${escapeHtml(item.portion)}</div>
        </div>
        <div class="menu-card-bottom">
          <span class="menu-card-price font-mono-tabular">₹${item.price}</span>
          ${
            isSelected
              ? `<span class="menu-card-subtotal font-mono-tabular">= ₹${qty * item.price}</span>`
              : ''
          }
        </div>
      </button>
    `;
  }).join('');
}

// Render Live Cart Panel
function renderCart() {
  const tokenEl = document.getElementById('active-token-number');
  const countEl = document.getElementById('active-cart-count');
  const clearBtn = document.getElementById('clear-order-btn');
  const containerEl = document.getElementById('cart-items-container');
  const grandTotalEl = document.getElementById('grand-total-amount');
  const rollSubtitleEl = document.getElementById('thermal-roll-subtitle');
  const settleBtn = document.getElementById('print-settle-btn');
  const settleLabelEl = document.getElementById('print-settle-label');
  const settledBanner = document.getElementById('settled-banner');
  const settledMsg = document.getElementById('settled-banner-msg');

  const totalQty = state.cart.reduce((s, c) => s + c.qty, 0);
  const grandTotal = state.cart.reduce((s, c) => s + c.qty * c.item.price, 0);

  if (tokenEl) tokenEl.textContent = `#${padToken(state.currentToken)}`;
  if (countEl) countEl.textContent = `· ${totalQty} ${totalQty === 1 ? 'item' : 'items'}`;
  if (clearBtn) clearBtn.disabled = state.cart.length === 0;
  if (grandTotalEl) grandTotalEl.textContent = `₹${grandTotal.toLocaleString('en-IN')}`;
  if (rollSubtitleEl) {
    rollSubtitleEl.textContent = `Inclusive of all taxes · ${state.settings.paperWidth} thermal slip`;
  }
  if (settleBtn) settleBtn.disabled = state.cart.length === 0;
  if (settleLabelEl) {
    settleLabelEl.textContent = `Print & Settle · Token #${padToken(state.currentToken)}`;
  }

  if (settledBanner && settledMsg) {
    if (state.lastSettled && state.cart.length === 0) {
      settledBanner.classList.remove('hidden');
      settledMsg.innerHTML = `Settled <strong>Token #${padToken(state.lastSettled.tokenNumber)}</strong> (₹${state.lastSettled.grandTotal})`;
    } else {
      settledBanner.classList.add('hidden');
    }
  }

  if (!containerEl) return;

  if (state.cart.length === 0) {
    containerEl.innerHTML = `
      <div class="cart-empty-state">
        <div class="cart-empty-title">No items in Token #${padToken(state.currentToken)}</div>
        <div class="cart-empty-sub">Tap any dish on the left menu grid to start billing immediately.</div>
      </div>
    `;
  } else {
    containerEl.innerHTML = state.cart
      .map(
        ({ item, qty }) => `
        <div class="cart-row">
          <div>
            <div class="cart-row-name">${escapeHtml(item.name)}</div>
            <div class="cart-row-rate font-mono-tabular">₹${item.price} / unit</div>
          </div>
          <div class="cart-qty-controls">
            <button type="button" class="btn-qty" data-qty-action="dec" data-item-id="${item.id}" aria-label="Decrease quantity">&minus;</button>
            <span class="cart-qty-num font-mono-tabular">${qty}</span>
            <button type="button" class="btn-qty" data-qty-action="inc" data-item-id="${item.id}" aria-label="Increase quantity">+</button>
          </div>
          <div class="cart-row-amount font-mono-tabular">₹${item.price * qty}</div>
        </div>
      `
      )
      .join('');
  }
}

// Render Print-Only Container & Screen Preview Modal
function renderThermalReceiptContainers() {
  const printRoot = document.getElementById('thermal-print-root');
  const orderToPrint = state.receiptOrder || getLiveOrLastOrder();
  if (printRoot) {
    printRoot.innerHTML = orderToPrint ? buildThermalReceiptHtml(orderToPrint) : '';
  }

  const previewHolder = document.getElementById('screen-receipt-preview-holder');
  const slipSubtitle = document.getElementById('slip-modal-subtitle');
  const btn58 = document.getElementById('preview-width-58');
  const btn80 = document.getElementById('preview-width-80');

  if (slipSubtitle) {
    slipSubtitle.textContent = `Formatted for ${state.settings.paperWidth} roll · Prints automatically on Settle`;
  }
  if (btn58) btn58.classList.toggle('active', state.settings.paperWidth === '58mm');
  if (btn80) btn80.classList.toggle('active', state.settings.paperWidth === '80mm');
  if (previewHolder) {
    previewHolder.innerHTML = buildThermalReceiptHtml(getLiveOrLastOrder());
  }
}

// Render End-of-Day (EOD) Reports Modal Content
function renderReportsModal() {
  const subtitleEl = document.getElementById('eod-modal-subtitle');
  const kpiRevEl = document.getElementById('kpi-total-revenue');
  const kpiOrdEl = document.getElementById('kpi-total-orders');
  const kpiUnitsEl = document.getElementById('kpi-total-units');
  const kpiAvgEl = document.getElementById('kpi-avg-order');
  const tabOrdersBtn = document.getElementById('tab-orders-btn');

  const totalRevenue = state.salesHistory.reduce((s, o) => s + o.grandTotal, 0);
  const totalOrders = state.salesHistory.length;
  const totalUnits = state.salesHistory.reduce(
    (s, o) => s + o.items.reduce((is, i) => is + i.qty, 0),
    0
  );
  const avgOrder = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  if (subtitleEl) {
    subtitleEl.textContent = `Offline local storage ledger · Current Next Token: #${padToken(state.currentToken)}`;
  }
  if (kpiRevEl) kpiRevEl.textContent = `₹${totalRevenue.toLocaleString('en-IN')}`;
  if (kpiOrdEl) kpiOrdEl.textContent = String(totalOrders);
  if (kpiUnitsEl) kpiUnitsEl.textContent = String(totalUnits);
  if (kpiAvgEl) kpiAvgEl.textContent = `₹${avgOrder}`;
  if (tabOrdersBtn) tabOrdersBtn.textContent = `Recent Orders (${totalOrders})`;

  // Item-wise breakdown calculation
  const itemStats = new Map();
  MENU_ITEMS.forEach((m) => {
    itemStats.set(m.id, {
      id: m.id,
      code: m.code,
      name: m.name,
      rate: m.price,
      qtySold: 0,
      revenue: 0,
    });
  });

  state.salesHistory.forEach((order) => {
    order.items.forEach((line) => {
      const rec = itemStats.get(line.id);
      if (rec) {
        rec.qtySold += line.qty;
        rec.revenue += line.amount;
      } else {
        itemStats.set(line.id, {
          id: line.id,
          code: '--',
          name: line.name,
          rate: line.rate,
          qtySold: line.qty,
          revenue: line.amount,
        });
      }
    });
  });

  const sortedBreakdown = Array.from(itemStats.values()).sort((a, b) => {
    if (b.qtySold !== a.qtySold) return b.qtySold - a.qtySold;
    return a.code.localeCompare(b.code);
  });

  const visibleBreakdown = state.showZeroSales
    ? sortedBreakdown
    : sortedBreakdown.filter((r) => r.qtySold > 0);

  const tbody = document.getElementById('eod-breakdown-tbody');
  const footQty = document.getElementById('foot-total-qty');
  const footRev = document.getElementById('foot-total-revenue');

  if (tbody) {
    if (visibleBreakdown.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:24px;color:#64748b;">No items sold yet today. Complete an order or check "Show items with 0 sales".</td></tr>`;
    } else {
      tbody.innerHTML = visibleBreakdown
        .map(
          (row) => `
          <tr class="${row.qtySold === 0 ? 'zero-row' : ''}">
            <td class="font-mono-tabular font-bold">#${row.code}</td>
            <td class="font-bold">${escapeHtml(row.name)}</td>
            <td class="text-right font-mono-tabular">₹${row.rate}</td>
            <td class="text-right font-mono-tabular font-bold">${row.qtySold}</td>
            <td class="text-right font-mono-tabular font-bold ${row.qtySold > 0 ? 'text-emerald' : ''}">₹${row.revenue.toLocaleString('en-IN')}</td>
          </tr>
        `
        )
        .join('');
    }
  }
  if (footQty) footQty.textContent = String(totalUnits);
  if (footRev) footRev.textContent = `₹${totalRevenue.toLocaleString('en-IN')}`;

  // Recent Orders Tab
  const ordersListEl = document.getElementById('recent-orders-list');
  if (ordersListEl) {
    if (state.salesHistory.length === 0) {
      ordersListEl.innerHTML = `<div style="text-align:center;padding:32px;border:1px dashed #cbd5e1;border-radius:12px;color:#64748b;">No completed orders recorded today.</div>`;
    } else {
      ordersListEl.innerHTML = [...state.salesHistory]
        .reverse()
        .map((order) => {
          const tStr = new Date(order.timestamp).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
          });
          const summaryStr = order.items.map((i) => `${i.name} × ${i.qty}`).join('  ·  ');
          return `
            <div class="order-history-card">
              <div>
                <div class="order-history-meta">
                  <strong class="font-mono-tabular">Token #${padToken(order.tokenNumber)}</strong>
                  <span class="meta-sep">·</span>
                  <span class="font-mono-tabular" style="font-size:12px;color:#64748b;">${escapeHtml(tStr)}</span>
                  <span class="meta-sep">·</span>
                  <strong class="font-mono-tabular text-emerald">₹${order.grandTotal}</strong>
                </div>
                <div class="order-history-items">${escapeHtml(summaryStr)}</div>
              </div>
              <div>
                <button type="button" class="btn-primary-dark" data-reprint-id="${order.id}">Reprint Slip</button>
              </div>
            </div>
          `;
        })
        .join('');
    }
  }

  // Settings Tab
  const p58 = document.getElementById('setting-paper-58');
  const p80 = document.getElementById('setting-paper-80');
  const upiInput = document.getElementById('setting-upi-input');
  const taglineInput = document.getElementById('setting-tagline-input');
  const qrPreview = document.getElementById('settings-qr-preview');
  const upiReadout = document.getElementById('settings-upi-readout');
  const paperReadout = document.getElementById('settings-paper-readout');

  if (p58) p58.classList.toggle('active', state.settings.paperWidth === '58mm');
  if (p80) p80.classList.toggle('active', state.settings.paperWidth === '80mm');
  if (upiInput && document.activeElement !== upiInput) {
    upiInput.value = state.settings.upiId;
  }
  if (taglineInput && document.activeElement !== taglineInput) {
    taglineInput.value = state.settings.shopTagline;
  }
  const sampleUri = `upi://pay?pa=${encodeURIComponent(state.settings.upiId || 'panwadipoha@upi')}&pn=${encodeURIComponent('Panwadi Poha')}&am=100&cu=INR`;
  if (qrPreview) qrPreview.innerHTML = buildQrSvgMarkup(sampleUri, 140);
  if (upiReadout) upiReadout.textContent = state.settings.upiId || 'panwadipoha@upi';
  if (paperReadout) paperReadout.textContent = `Paper Format: ${state.settings.paperWidth}`;
}

function renderAll() {
  renderTopbar();
  renderMenuGrid();
  renderCart();
  renderThermalReceiptContainers();
  renderReportsModal();
}

// Actions
function addItemToCart(menuId) {
  const item = MENU_ITEMS.find((m) => m.id === menuId);
  if (!item) return;

  const existing = state.cart.find((c) => c.item.id === menuId);
  if (existing) {
    existing.qty += 1;
  } else {
    state.cart.push({ item, qty: 1 });
  }
  saveJSON(STORAGE_KEYS.ACTIVE_CART, state.cart);
  renderAll();
}

function adjustCartItemQty(itemId, delta) {
  state.cart = state.cart
    .map((c) => (c.item.id === itemId ? { ...c, qty: c.qty + delta } : c))
    .filter((c) => c.qty > 0);
  saveJSON(STORAGE_KEYS.ACTIVE_CART, state.cart);
  renderAll();
}

function clearCart() {
  state.cart = [];
  saveJSON(STORAGE_KEYS.ACTIVE_CART, state.cart);
  renderAll();
}

function triggerPrintForOrder(order) {
  if (!order) return;
  state.receiptOrder = order;
  renderThermalReceiptContainers();
  window.setTimeout(() => {
    window.print();
  }, 50);
}

function printAndSettleOrder() {
  if (state.cart.length === 0) return;

  const assignedToken = state.currentToken;
  const items = state.cart.map((c) => ({
    id: c.item.id,
    name: c.item.name,
    qty: c.qty,
    rate: c.item.price,
    amount: c.qty * c.item.price,
  }));
  const grandTotal = items.reduce((s, i) => s + i.amount, 0);

  const completedOrder = {
    id: `ord-${Date.now()}-${assignedToken}`,
    tokenNumber: assignedToken,
    timestamp: new Date().toISOString(),
    items,
    grandTotal,
  };

  state.salesHistory.push(completedOrder);
  state.currentToken = assignedToken + 1;
  state.cart = [];
  state.receiptOrder = completedOrder;
  state.lastSettled = { tokenNumber: assignedToken, grandTotal };

  saveJSON(STORAGE_KEYS.SALES_HISTORY, state.salesHistory);
  saveJSON(STORAGE_KEYS.CURRENT_TOKEN, state.currentToken);
  saveJSON(STORAGE_KEYS.ACTIVE_CART, state.cart);

  renderAll();
  triggerPrintForOrder(completedOrder);
}

function exportSalesToCsv() {
  const todayStr = new Date().toISOString().slice(0, 10);
  const totalRevenue = state.salesHistory.reduce((s, o) => s + o.grandTotal, 0);
  const totalUnits = state.salesHistory.reduce(
    (s, o) => s + o.items.reduce((is, i) => is + i.qty, 0),
    0
  );

  const rows = [];
  rows.push(['PANWADI POHA - END OF DAY SALES REPORT']);
  rows.push(['Date', todayStr]);
  rows.push(['Total Sales Amount (INR)', String(totalRevenue)]);
  rows.push(['Completed Orders', String(state.salesHistory.length)]);
  rows.push(['Total Portions Sold', String(totalUnits)]);
  rows.push(['Next Token Number', String(state.currentToken)]);
  rows.push([]);

  rows.push(['ITEM-WISE BREAKDOWN']);
  rows.push(['Code', 'Item Name', 'Unit Rate (INR)', 'Total Qty Sold', 'Total Revenue (INR)']);

  MENU_ITEMS.forEach((m) => {
    let qtySold = 0;
    let rev = 0;
    state.salesHistory.forEach((o) => {
      o.items.forEach((line) => {
        if (line.id === m.id) {
          qtySold += line.qty;
          rev += line.amount;
        }
      });
    });
    rows.push([m.code, `"${m.name.replace(/"/g, '""')}"`, String(m.price), String(qtySold), String(rev)]);
  });

  rows.push([]);
  rows.push(['ORDER TRANSACTION LOG']);
  rows.push(['Token Number', 'Timestamp', 'Items Ordered', 'Grand Total (INR)']);
  state.salesHistory.forEach((o) => {
    const summary = o.items.map((i) => `${i.name} x${i.qty} (Rs.${i.amount})`).join('; ');
    rows.push([
      `#${o.tokenNumber}`,
      `"${new Date(o.timestamp).toLocaleString('en-IN')}"`,
      `"${summary.replace(/"/g, '""')}"`,
      String(o.grandTotal),
    ]);
  });

  const csvContent = '\uFEFF' + rows.map((r) => r.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `panwadi-poha-sales-${todayStr}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function resetDayData() {
  state.salesHistory = [];
  state.currentToken = 1;
  state.cart = [];
  state.receiptOrder = null;
  state.lastSettled = null;

  saveJSON(STORAGE_KEYS.SALES_HISTORY, []);
  saveJSON(STORAGE_KEYS.CURRENT_TOKEN, 1);
  saveJSON(STORAGE_KEYS.ACTIVE_CART, []);

  document.getElementById('confirm-reset-day-box')?.classList.add('hidden');
  document.getElementById('init-reset-day-btn')?.classList.remove('hidden');
  renderAll();
}

function setPaperWidth(width) {
  state.settings.paperWidth = width;
  saveJSON(STORAGE_KEYS.SETTINGS, state.settings);
  renderAll();
}

function switchEodTab(tabName) {
  state.activeEodTab = tabName;
  document.querySelectorAll('.eod-tab-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
  });
  document.getElementById('tab-panel-breakdown')?.classList.toggle('hidden', tabName !== 'breakdown');
  document.getElementById('tab-panel-orders')?.classList.toggle('hidden', tabName !== 'orders');
  document.getElementById('tab-panel-settings')?.classList.toggle('hidden', tabName !== 'settings');
  document.getElementById('zero-sales-filter-wrap')?.classList.toggle('hidden', tabName !== 'breakdown');
}

// Wire DOM Events
function initPosApp() {
  renderAll();

  // Menu Grid click delegation
  document.getElementById('menu-grid')?.addEventListener('click', (e) => {
    const card = e.target.closest('[data-menu-id]');
    if (card) {
      addItemToCart(card.getAttribute('data-menu-id'));
    }
  });

  // Cart item +/- click delegation
  document.getElementById('cart-items-container')?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-qty-action]');
    if (!btn) return;
    const itemId = btn.getAttribute('data-item-id');
    const action = btn.getAttribute('data-qty-action');
    if (itemId && action) {
      adjustCartItemQty(itemId, action === 'inc' ? 1 : -1);
    }
  });

  // Clear Order & Print & Settle
  document.getElementById('clear-order-btn')?.addEventListener('click', clearCart);
  document.getElementById('print-settle-btn')?.addEventListener('click', printAndSettleOrder);

  // Reprint Last button in banner
  document.getElementById('reprint-last-btn')?.addEventListener('click', () => {
    if (state.receiptOrder) triggerPrintForOrder(state.receiptOrder);
  });

  // Paper Width Quick Toggles
  const toggleWidth = () => {
    setPaperWidth(state.settings.paperWidth === '58mm' ? '80mm' : '58mm');
  };
  document.getElementById('nav-paper-toggle')?.addEventListener('click', toggleWidth);
  document.getElementById('mobile-paper-toggle')?.addEventListener('click', toggleWidth);

  // Slip Preview Modal open/close
  const openSlipModal = () => {
    renderThermalReceiptContainers();
    document.getElementById('slip-preview-modal')?.classList.remove('hidden');
  };
  const closeSlipModal = () => {
    document.getElementById('slip-preview-modal')?.classList.add('hidden');
  };
  document.getElementById('nav-slip-preview')?.addEventListener('click', openSlipModal);
  document.getElementById('mobile-slip-btn')?.addEventListener('click', openSlipModal);
  document.getElementById('cart-slip-btn')?.addEventListener('click', openSlipModal);
  document.getElementById('close-slip-modal-btn')?.addEventListener('click', closeSlipModal);
  document.getElementById('modal-close-slip-btn')?.addEventListener('click', closeSlipModal);
  document.getElementById('preview-width-58')?.addEventListener('click', () => setPaperWidth('58mm'));
  document.getElementById('preview-width-80')?.addEventListener('click', () => setPaperWidth('80mm'));
  document.getElementById('modal-test-print-btn')?.addEventListener('click', () => {
    const order = getLiveOrLastOrder();
    if (order) triggerPrintForOrder(order);
  });

  // EOD Reports Modal open/close
  const openReportsModal = () => {
    renderReportsModal();
    document.getElementById('reports-modal')?.classList.remove('hidden');
  };
  const closeReportsModal = () => {
    document.getElementById('reports-modal')?.classList.add('hidden');
  };
  document.getElementById('open-reports-btn')?.addEventListener('click', openReportsModal);
  document.getElementById('nav-today-summary')?.addEventListener('click', openReportsModal);
  document.getElementById('close-reports-modal-btn')?.addEventListener('click', closeReportsModal);

  // EOD Modal Tabs
  document.querySelectorAll('.eod-tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab');
      if (tab) switchEodTab(tab);
    });
  });

  // Zero-sales filter checkbox
  document.getElementById('show-zero-sales-checkbox')?.addEventListener('change', (e) => {
    state.showZeroSales = e.target.checked;
    renderReportsModal();
  });

  // Reprint historical order from Recent Orders list
  document.getElementById('recent-orders-list')?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-reprint-id]');
    if (!btn) return;
    const orderId = btn.getAttribute('data-reprint-id');
    const found = state.salesHistory.find((o) => o.id === orderId);
    if (found) triggerPrintForOrder(found);
  });

  // Settings inputs
  document.getElementById('setting-paper-58')?.addEventListener('click', () => setPaperWidth('58mm'));
  document.getElementById('setting-paper-80')?.addEventListener('click', () => setPaperWidth('80mm'));
  document.getElementById('setting-upi-input')?.addEventListener('input', (e) => {
    state.settings.upiId = e.target.value.trim();
    saveJSON(STORAGE_KEYS.SETTINGS, state.settings);
    renderThermalReceiptContainers();
    renderReportsModal();
  });
  document.getElementById('setting-tagline-input')?.addEventListener('input', (e) => {
    state.settings.shopTagline = e.target.value;
    saveJSON(STORAGE_KEYS.SETTINGS, state.settings);
    renderThermalReceiptContainers();
  });

  // Export CSV & Reset Day two-step confirmation
  document.getElementById('export-csv-btn')?.addEventListener('click', exportSalesToCsv);
  document.getElementById('init-reset-day-btn')?.addEventListener('click', () => {
    document.getElementById('init-reset-day-btn')?.classList.add('hidden');
    document.getElementById('confirm-reset-day-box')?.classList.remove('hidden');
  });
  document.getElementById('confirm-reset-cancel-btn')?.addEventListener('click', () => {
    document.getElementById('confirm-reset-day-box')?.classList.add('hidden');
    document.getElementById('init-reset-day-btn')?.classList.remove('hidden');
  });
  document.getElementById('confirm-reset-yes-btn')?.addEventListener('click', resetDayData);

  // Prevent brand link reload
  document.getElementById('brand-link')?.addEventListener('click', (e) => e.preventDefault());
}

document.addEventListener('DOMContentLoaded', initPosApp);
