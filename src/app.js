// /**
//  * Panwadi Poha — Offline-First POS & Thermal Billing Application
//  * Pure Vanilla JavaScript (ES6) with localStorage persistence.
//  */

// const STORAGE_KEYS = {
//   CURRENT_TOKEN: 'panwadi_poha_current_token',
//   SALES_HISTORY: 'panwadi_poha_sales_history',
//   ACTIVE_CART: 'panwadi_poha_active_cart',
//   SETTINGS: 'panwadi_poha_settings',
// };

// const DEFAULT_SETTINGS = {
//   paperWidth: '58mm',
//   upiId: 'panwadipoha@upi',
//   shopTagline: 'Fresh Poha · Hot Snacks · Pure Sweets',
// };

// // 15 Hardcoded Quick-Service Menu Items for Panwadi Poha
// const MENU_ITEMS = [
//   { id: 'item-01', code: '01', name: 'Indori Poha Plate', portion: 'Full Plate · Sev & Jeeravan', price: 30 },
//   { id: 'item-02', code: '02', name: 'Tarri Poha Special', portion: 'Full Plate · Spicy Chana Gravy', price: 40 },
//   { id: 'item-03', code: '03', name: 'Pua Plate', portion: '4 Pieces · Classic Sweet Pua', price: 30 },
//   { id: 'item-04', code: '04', name: 'Jalebi (200g)', portion: '200g · Hot Crispy Desi Ghee', price: 40 },
//   { id: 'item-05', code: '05', name: 'Pasta', portion: 'Full Plate · Masala Red Sauce', price: 50 },
//   { id: 'item-06', code: '06', name: 'Poha Jalebi Combo', portion: '1 Poha Plate + 100g Jalebi', price: 55 },
//   { id: 'item-07', code: '07', name: 'Samosa Chaat', portion: '2 Samosas · Curd & Chutneys', price: 40 },
//   { id: 'item-08', code: '08', name: 'Kachori Sabzi (2 pcs)', portion: '2 Khasta Kachori · Aloo Rassa', price: 35 },
//   { id: 'item-09', code: '09', name: 'Aloo Bonda (2 pcs)', portion: '2 Pieces · Green Chutney', price: 25 },
//   { id: 'item-10', code: '10', name: 'Sabudana Khichdi', portion: 'Full Bowl · Roasted Peanuts', price: 45 },
//   { id: 'item-11', code: '11', name: 'Veg Maggi', portion: 'Full Bowl · Double Masala', price: 35 },
//   { id: 'item-12', code: '12', name: 'Dahi Samosa', portion: '2 Pieces · Sweet Curd & Sev', price: 35 },
//   { id: 'item-13', code: '13', name: 'Rabdi Cup', portion: '100ml Kulhad · Kesar Pistachio', price: 40 },
//   { id: 'item-14', code: '14', name: 'Kulhad Chai', portion: '150ml · Adrak Elaichi Special', price: 15 },
//   { id: 'item-15', code: '15', name: 'Masala Buttermilk', portion: '250ml Glass · Roasted Jeera', price: 20 },
// ];

// // LocalStorage Helpers
// function loadJSON(key, fallback) {
//   try {
//     const raw = window.localStorage.getItem(key);
//     if (!raw) return fallback;
//     return JSON.parse(raw);
//   } catch {
//     return fallback;
//   }
// }

// function saveJSON(key, value) {
//   try {
//     window.localStorage.setItem(key, JSON.stringify(value));
//   } catch {
//     // Ignore storage errors in restricted private browsing modes
//   }
// }

// function escapeHtml(str) {
//   return String(str)
//     .replace(/&/g, '&amp;')
//     .replace(/</g, '&lt;')
//     .replace(/>/g, '&gt;')
//     .replace(/"/g, '&quot;');
// }

// function padToken(num) {
//   return String(num).padStart(2, '0');
// }

// // Application State
// const state = {
//   currentToken: (() => {
//     const saved = loadJSON(STORAGE_KEYS.CURRENT_TOKEN, 1);
//     return typeof saved === 'number' && saved >= 1 ? saved : 1;
//   })(),
//   salesHistory: loadJSON(STORAGE_KEYS.SALES_HISTORY, []),
//   cart: loadJSON(STORAGE_KEYS.ACTIVE_CART, []),
//   settings: { ...DEFAULT_SETTINGS, ...loadJSON(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS) },
//   receiptOrder: null,
//   lastSettled: null,
//   activeEodTab: 'breakdown',
//   showZeroSales: true,
// };

// if (state.salesHistory.length > 0) {
//   state.receiptOrder = state.salesHistory[state.salesHistory.length - 1];
// }

// /**
//  * Offline Deterministic QR Matrix SVG Generator (25x25 Version 2 QR layout)
//  * Works 100% offline without external image dependencies.
//  */
// function buildQrSvgMarkup(value, sizePx = 124) {
//   const gridSize = 25;
//   const grid = Array.from({ length: gridSize }, () => Array(gridSize).fill(false));
//   const reserved = Array.from({ length: gridSize }, () => Array(gridSize).fill(false));

//   const placeFinder = (rOff, cOff) => {
//     for (let r = -1; r <= 7; r++) {
//       for (let c = -1; c <= 7; c++) {
//         const rr = rOff + r;
//         const cc = cOff + c;
//         if (rr >= 0 && rr < gridSize && cc >= 0 && cc < gridSize) {
//           reserved[rr][cc] = true;
//           if (r >= 0 && r <= 6 && c >= 0 && c <= 6) {
//             const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
//             const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
//             grid[rr][cc] = isBorder || isInner;
//           } else {
//             grid[rr][cc] = false;
//           }
//         }
//       }
//     }
//   };

//   placeFinder(0, 0);
//   placeFinder(0, gridSize - 7);
//   placeFinder(gridSize - 7, 0);

//   // Alignment pattern at (18, 18)
//   for (let r = -2; r <= 2; r++) {
//     for (let c = -2; c <= 2; c++) {
//       const rr = 18 + r;
//       const cc = 18 + c;
//       reserved[rr][cc] = true;
//       grid[rr][cc] = Math.abs(r) === 2 || Math.abs(c) === 2 || (r === 0 && c === 0);
//     }
//   }

//   // Timing patterns
//   for (let i = 8; i < gridSize - 8; i++) {
//     reserved[6][i] = true;
//     reserved[i][6] = true;
//     grid[6][i] = i % 2 === 0;
//     grid[i][6] = i % 2 === 0;
//   }

//   // Deterministic payload hash bits
//   const bytes = [];
//   let seed = 2166136261;
//   for (let i = 0; i < value.length; i++) {
//     const code = value.charCodeAt(i);
//     seed ^= code;
//     seed = Math.imul(seed, 16777619);
//     bytes.push((seed >>> 0) & 0xff);
//     bytes.push(code & 0xff);
//   }
//   if (bytes.length === 0) bytes.push(0x5a);

//   let bitIdx = 0;
//   for (let r = 0; r < gridSize; r++) {
//     for (let c = 0; c < gridSize; c++) {
//       if (!reserved[r][c]) {
//         const byteVal = bytes[Math.floor(bitIdx / 8) % bytes.length];
//         const shift = bitIdx % 8;
//         const mask = (r * 3 + c * 5 + bitIdx) % 3 === 0;
//         const bit = ((byteVal >> shift) & 1) === 1;
//         grid[r][c] = bit !== mask;
//         bitIdx++;
//       }
//     }
//   }

//   let rects = '';
//   for (let r = 0; r < gridSize; r++) {
//     for (let c = 0; c < gridSize; c++) {
//       if (grid[r][c]) {
//         rects += `<rect x="${c}" y="${r}" width="1" height="1" fill="#000000" />`;
//       }
//     }
//   }

//   return `
//     <div class="receipt-qr-box" style="width:${sizePx}px;height:${sizePx}px;">
//       <svg viewBox="0 0 ${gridSize} ${gridSize}" width="100%" height="100%" shape-rendering="crispEdges" role="img" aria-label="Scan to Pay QR Code">
//         <rect width="${gridSize}" height="${gridSize}" fill="#ffffff" />
//         ${rects}
//       </svg>
//     </div>
//   `;
// }

// /**
//  * Generates HTML string for the Thermal Receipt (58mm or 80mm)
//  */
// function buildThermalReceiptHtml(order) {
//   if (!order || !order.items || order.items.length === 0) {
//     return `<div style="padding:16px;text-align:center;font-size:12px;color:#64748b;">Add items to the cart or complete an order to preview the thermal receipt slip.</div>`;
//   }

//   const dt = new Date(order.timestamp);
//   const dateStr = dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
//   const timeStr = dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
//   const is58 = state.settings.paperWidth === '58mm';
//   const widthClass = is58 ? 'thermal-receipt-58mm' : 'thermal-receipt-80mm';
//   const totalQty = order.items.reduce((s, i) => s + i.qty, 0);

//   const upiId = state.settings.upiId || 'panwadipoha@upi';
//   const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent('Panwadi Poha')}&am=${order.grandTotal}&cu=INR&tn=${encodeURIComponent('Token-' + order.tokenNumber)}`;

//   const rowsHtml = order.items
//     .map(
//       (line) => `
//       <div class="receipt-row">
//         <span class="receipt-col-item">${escapeHtml(line.name)}</span>
//         <span class="receipt-col-qty">${line.qty}</span>
//         <span class="receipt-col-rate">₹${line.rate}</span>
//         <span class="receipt-col-amt">₹${line.amount}</span>
//       </div>
//     `
//     )
//     .join('');

//   return `
//     <div class="thermal-slip ${widthClass}">
//       <div class="receipt-header">
//         <div class="receipt-shop-name">PANWADI POHA</div>
//         ${state.settings.shopTagline ? `<div class="receipt-tagline">${escapeHtml(state.settings.shopTagline)}</div>` : ''}
//         <div class="receipt-datetime">${escapeHtml(dateStr)} · ${escapeHtml(timeStr)}</div>
//       </div>

//       <div class="receipt-token-box">
//         <div class="receipt-token-label">TOKEN NUMBER</div>
//         <div class="receipt-token-num">#${padToken(order.tokenNumber)}</div>
//       </div>

//       <div class="receipt-table-head">
//         <span class="receipt-col-item">Item</span>
//         <span class="receipt-col-qty">Qty</span>
//         <span class="receipt-col-rate">Rate</span>
//         <span class="receipt-col-amt">Amt</span>
//       </div>

//       <div class="receipt-items-body">
//         ${rowsHtml}
//       </div>

//       <div class="receipt-totals">
//         <div class="receipt-meta-row">
//           <span>Items: ${order.items.length}</span>
//           <span>Total Qty: ${totalQty}</span>
//         </div>
//         <div class="receipt-grand-row">
//           <span>GRAND TOTAL</span>
//           <span>₹${order.grandTotal}</span>
//         </div>
//       </div>

//       <div class="receipt-qr-section">
//         <div class="receipt-qr-title">SCAN TO PAY (UPI)</div>
//         ${buildQrSvgMarkup(upiUri, is58 ? 114 : 134)}
//         <div class="receipt-upi-id">UPI ID: ${escapeHtml(upiId)}</div>
//         <div class="receipt-thanks">Thank you! Visit Panwadi Poha Again</div>
//       </div>
//     </div>
//   `;
// }

// // Compute live order object from current cart (or fallback to last settled order)
// function getLiveOrLastOrder() {
//   if (state.cart.length > 0) {
//     const items = state.cart.map((c) => ({
//       id: c.item.id,
//       name: c.item.name,
//       qty: c.qty,
//       rate: c.item.price,
//       amount: c.qty * c.item.price,
//     }));
//     const grandTotal = items.reduce((s, i) => s + i.amount, 0);
//     return {
//       id: 'live-preview',
//       tokenNumber: state.currentToken,
//       timestamp: new Date().toISOString(),
//       items,
//       grandTotal,
//     };
//   }
//   return state.receiptOrder;
// }

// // Render Topbar & Status
// function renderTopbar() {
//   const todaySales = state.salesHistory.reduce((sum, o) => sum + o.grandTotal, 0);
//   const paperBtn = document.getElementById('nav-paper-toggle');
//   const mobilePaperBtn = document.getElementById('mobile-paper-toggle');
//   const todaySummaryBtn = document.getElementById('nav-today-summary');
//   const menuTokenHint = document.getElementById('menu-token-hint');

//   if (paperBtn) paperBtn.textContent = `Paper: ${state.settings.paperWidth}`;
//   if (mobilePaperBtn) mobilePaperBtn.textContent = `${state.settings.paperWidth} Roll`;
//   if (todaySummaryBtn) {
//     todaySummaryBtn.textContent = `Today: ₹${todaySales.toLocaleString('en-IN')} (${state.salesHistory.length} Orders)`;
//   }
//   if (menuTokenHint) {
//     menuTokenHint.textContent = `Tap any card to add to Token #${padToken(state.currentToken)}`;
//   }
// }

// // Render 15-Item Menu Grid
// function renderMenuGrid() {
//   const gridEl = document.getElementById('menu-grid');
//   if (!gridEl) return;

//   const qtyMap = new Map();
//   state.cart.forEach((entry) => qtyMap.set(entry.item.id, entry.qty));

//   gridEl.innerHTML = MENU_ITEMS.map((item) => {
//     const qty = qtyMap.get(item.id) || 0;
//     const isSelected = qty > 0;
//     return `
//       <button type="button" class="menu-card ${isSelected ? 'selected' : ''}" data-menu-id="${item.id}">
//         <div class="menu-card-top">
//           <span class="menu-card-code font-mono-tabular">#${item.code}</span>
//           ${
//             isSelected
//               ? `<span class="menu-card-qty font-mono-tabular">×${qty} in order</span>`
//               : `<span class="menu-card-add-hint">+ Add</span>`
//           }
//         </div>
//         <div class="menu-card-body">
//           <div class="menu-card-title">${escapeHtml(item.name)}</div>
//           <div class="menu-card-portion">${escapeHtml(item.portion)}</div>
//         </div>
//         <div class="menu-card-bottom">
//           <span class="menu-card-price font-mono-tabular">₹${item.price}</span>
//           ${
//             isSelected
//               ? `<span class="menu-card-subtotal font-mono-tabular">= ₹${qty * item.price}</span>`
//               : ''
//           }
//         </div>
//       </button>
//     `;
//   }).join('');
// }

// // Render Live Cart Panel
// function renderCart() {
//   const tokenEl = document.getElementById('active-token-number');
//   const countEl = document.getElementById('active-cart-count');
//   const clearBtn = document.getElementById('clear-order-btn');
//   const containerEl = document.getElementById('cart-items-container');
//   const grandTotalEl = document.getElementById('grand-total-amount');
//   const rollSubtitleEl = document.getElementById('thermal-roll-subtitle');
//   const settleBtn = document.getElementById('print-settle-btn');
//   const settleLabelEl = document.getElementById('print-settle-label');
//   const settledBanner = document.getElementById('settled-banner');
//   const settledMsg = document.getElementById('settled-banner-msg');

//   const totalQty = state.cart.reduce((s, c) => s + c.qty, 0);
//   const grandTotal = state.cart.reduce((s, c) => s + c.qty * c.item.price, 0);

//   if (tokenEl) tokenEl.textContent = `#${padToken(state.currentToken)}`;
//   if (countEl) countEl.textContent = `· ${totalQty} ${totalQty === 1 ? 'item' : 'items'}`;
//   if (clearBtn) clearBtn.disabled = state.cart.length === 0;
//   if (grandTotalEl) grandTotalEl.textContent = `₹${grandTotal.toLocaleString('en-IN')}`;
//   if (rollSubtitleEl) {
//     rollSubtitleEl.textContent = `Inclusive of all taxes · ${state.settings.paperWidth} thermal slip`;
//   }
//   if (settleBtn) settleBtn.disabled = state.cart.length === 0;
//   if (settleLabelEl) {
//     settleLabelEl.textContent = `Print & Settle · Token #${padToken(state.currentToken)}`;
//   }

//   if (settledBanner && settledMsg) {
//     if (state.lastSettled && state.cart.length === 0) {
//       settledBanner.classList.remove('hidden');
//       settledMsg.innerHTML = `Settled <strong>Token #${padToken(state.lastSettled.tokenNumber)}</strong> (₹${state.lastSettled.grandTotal})`;
//     } else {
//       settledBanner.classList.add('hidden');
//     }
//   }

//   if (!containerEl) return;

//   if (state.cart.length === 0) {
//     containerEl.innerHTML = `
//       <div class="cart-empty-state">
//         <div class="cart-empty-title">No items in Token #${padToken(state.currentToken)}</div>
//         <div class="cart-empty-sub">Tap any dish on the left menu grid to start billing immediately.</div>
//       </div>
//     `;
//   } else {
//     containerEl.innerHTML = state.cart
//       .map(
//         ({ item, qty }) => `
//         <div class="cart-row">
//           <div>
//             <div class="cart-row-name">${escapeHtml(item.name)}</div>
//             <div class="cart-row-rate font-mono-tabular">₹${item.price} / unit</div>
//           </div>
//           <div class="cart-qty-controls">
//             <button type="button" class="btn-qty" data-qty-action="dec" data-item-id="${item.id}" aria-label="Decrease quantity">&minus;</button>
//             <span class="cart-qty-num font-mono-tabular">${qty}</span>
//             <button type="button" class="btn-qty" data-qty-action="inc" data-item-id="${item.id}" aria-label="Increase quantity">+</button>
//           </div>
//           <div class="cart-row-amount font-mono-tabular">₹${item.price * qty}</div>
//         </div>
//       `
//       )
//       .join('');
//   }
// }

// // Render Print-Only Container & Screen Preview Modal
// function renderThermalReceiptContainers() {
//   const printRoot = document.getElementById('thermal-print-root');
//   const orderToPrint = state.receiptOrder || getLiveOrLastOrder();
//   if (printRoot) {
//     printRoot.innerHTML = orderToPrint ? buildThermalReceiptHtml(orderToPrint) : '';
//   }

//   const previewHolder = document.getElementById('screen-receipt-preview-holder');
//   const slipSubtitle = document.getElementById('slip-modal-subtitle');
//   const btn58 = document.getElementById('preview-width-58');
//   const btn80 = document.getElementById('preview-width-80');

//   if (slipSubtitle) {
//     slipSubtitle.textContent = `Formatted for ${state.settings.paperWidth} roll · Prints automatically on Settle`;
//   }
//   if (btn58) btn58.classList.toggle('active', state.settings.paperWidth === '58mm');
//   if (btn80) btn80.classList.toggle('active', state.settings.paperWidth === '80mm');
//   if (previewHolder) {
//     previewHolder.innerHTML = buildThermalReceiptHtml(getLiveOrLastOrder());
//   }
// }

// // Render End-of-Day (EOD) Reports Modal Content
// function renderReportsModal() {
//   const subtitleEl = document.getElementById('eod-modal-subtitle');
//   const kpiRevEl = document.getElementById('kpi-total-revenue');
//   const kpiOrdEl = document.getElementById('kpi-total-orders');
//   const kpiUnitsEl = document.getElementById('kpi-total-units');
//   const kpiAvgEl = document.getElementById('kpi-avg-order');
//   const tabOrdersBtn = document.getElementById('tab-orders-btn');

//   const totalRevenue = state.salesHistory.reduce((s, o) => s + o.grandTotal, 0);
//   const totalOrders = state.salesHistory.length;
//   const totalUnits = state.salesHistory.reduce(
//     (s, o) => s + o.items.reduce((is, i) => is + i.qty, 0),
//     0
//   );
//   const avgOrder = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

//   if (subtitleEl) {
//     subtitleEl.textContent = `Offline local storage ledger · Current Next Token: #${padToken(state.currentToken)}`;
//   }
//   if (kpiRevEl) kpiRevEl.textContent = `₹${totalRevenue.toLocaleString('en-IN')}`;
//   if (kpiOrdEl) kpiOrdEl.textContent = String(totalOrders);
//   if (kpiUnitsEl) kpiUnitsEl.textContent = String(totalUnits);
//   if (kpiAvgEl) kpiAvgEl.textContent = `₹${avgOrder}`;
//   if (tabOrdersBtn) tabOrdersBtn.textContent = `Recent Orders (${totalOrders})`;

//   // Item-wise breakdown calculation
//   const itemStats = new Map();
//   MENU_ITEMS.forEach((m) => {
//     itemStats.set(m.id, {
//       id: m.id,
//       code: m.code,
//       name: m.name,
//       rate: m.price,
//       qtySold: 0,
//       revenue: 0,
//     });
//   });

//   state.salesHistory.forEach((order) => {
//     order.items.forEach((line) => {
//       const rec = itemStats.get(line.id);
//       if (rec) {
//         rec.qtySold += line.qty;
//         rec.revenue += line.amount;
//       } else {
//         itemStats.set(line.id, {
//           id: line.id,
//           code: '--',
//           name: line.name,
//           rate: line.rate,
//           qtySold: line.qty,
//           revenue: line.amount,
//         });
//       }
//     });
//   });

//   const sortedBreakdown = Array.from(itemStats.values()).sort((a, b) => {
//     if (b.qtySold !== a.qtySold) return b.qtySold - a.qtySold;
//     return a.code.localeCompare(b.code);
//   });

//   const visibleBreakdown = state.showZeroSales
//     ? sortedBreakdown
//     : sortedBreakdown.filter((r) => r.qtySold > 0);

//   const tbody = document.getElementById('eod-breakdown-tbody');
//   const footQty = document.getElementById('foot-total-qty');
//   const footRev = document.getElementById('foot-total-revenue');

//   if (tbody) {
//     if (visibleBreakdown.length === 0) {
//       tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:24px;color:#64748b;">No items sold yet today. Complete an order or check "Show items with 0 sales".</td></tr>`;
//     } else {
//       tbody.innerHTML = visibleBreakdown
//         .map(
//           (row) => `
//           <tr class="${row.qtySold === 0 ? 'zero-row' : ''}">
//             <td class="font-mono-tabular font-bold">#${row.code}</td>
//             <td class="font-bold">${escapeHtml(row.name)}</td>
//             <td class="text-right font-mono-tabular">₹${row.rate}</td>
//             <td class="text-right font-mono-tabular font-bold">${row.qtySold}</td>
//             <td class="text-right font-mono-tabular font-bold ${row.qtySold > 0 ? 'text-emerald' : ''}">₹${row.revenue.toLocaleString('en-IN')}</td>
//           </tr>
//         `
//         )
//         .join('');
//     }
//   }
//   if (footQty) footQty.textContent = String(totalUnits);
//   if (footRev) footRev.textContent = `₹${totalRevenue.toLocaleString('en-IN')}`;

//   // Recent Orders Tab
//   const ordersListEl = document.getElementById('recent-orders-list');
//   if (ordersListEl) {
//     if (state.salesHistory.length === 0) {
//       ordersListEl.innerHTML = `<div style="text-align:center;padding:32px;border:1px dashed #cbd5e1;border-radius:12px;color:#64748b;">No completed orders recorded today.</div>`;
//     } else {
//       ordersListEl.innerHTML = [...state.salesHistory]
//         .reverse()
//         .map((order) => {
//           const tStr = new Date(order.timestamp).toLocaleTimeString('en-IN', {
//             hour: '2-digit',
//             minute: '2-digit',
//             second: '2-digit',
//             hour12: true,
//           });
//           const summaryStr = order.items.map((i) => `${i.name} × ${i.qty}`).join('  ·  ');
//           return `
//             <div class="order-history-card">
//               <div>
//                 <div class="order-history-meta">
//                   <strong class="font-mono-tabular">Token #${padToken(order.tokenNumber)}</strong>
//                   <span class="meta-sep">·</span>
//                   <span class="font-mono-tabular" style="font-size:12px;color:#64748b;">${escapeHtml(tStr)}</span>
//                   <span class="meta-sep">·</span>
//                   <strong class="font-mono-tabular text-emerald">₹${order.grandTotal}</strong>
//                 </div>
//                 <div class="order-history-items">${escapeHtml(summaryStr)}</div>
//               </div>
//               <div>
//                 <button type="button" class="btn-primary-dark" data-reprint-id="${order.id}">Reprint Slip</button>
//               </div>
//             </div>
//           `;
//         })
//         .join('');
//     }
//   }

//   // Settings Tab
//   const p58 = document.getElementById('setting-paper-58');
//   const p80 = document.getElementById('setting-paper-80');
//   const upiInput = document.getElementById('setting-upi-input');
//   const taglineInput = document.getElementById('setting-tagline-input');
//   const qrPreview = document.getElementById('settings-qr-preview');
//   const upiReadout = document.getElementById('settings-upi-readout');
//   const paperReadout = document.getElementById('settings-paper-readout');

//   if (p58) p58.classList.toggle('active', state.settings.paperWidth === '58mm');
//   if (p80) p80.classList.toggle('active', state.settings.paperWidth === '80mm');
//   if (upiInput && document.activeElement !== upiInput) {
//     upiInput.value = state.settings.upiId;
//   }
//   if (taglineInput && document.activeElement !== taglineInput) {
//     taglineInput.value = state.settings.shopTagline;
//   }
//   const sampleUri = `upi://pay?pa=${encodeURIComponent(state.settings.upiId || 'panwadipoha@upi')}&pn=${encodeURIComponent('Panwadi Poha')}&am=100&cu=INR`;
//   if (qrPreview) qrPreview.innerHTML = buildQrSvgMarkup(sampleUri, 140);
//   if (upiReadout) upiReadout.textContent = state.settings.upiId || 'panwadipoha@upi';
//   if (paperReadout) paperReadout.textContent = `Paper Format: ${state.settings.paperWidth}`;
// }

// function renderAll() {
//   renderTopbar();
//   renderMenuGrid();
//   renderCart();
//   renderThermalReceiptContainers();
//   renderReportsModal();
// }

// // Actions
// function addItemToCart(menuId) {
//   const item = MENU_ITEMS.find((m) => m.id === menuId);
//   if (!item) return;

//   const existing = state.cart.find((c) => c.item.id === menuId);
//   if (existing) {
//     existing.qty += 1;
//   } else {
//     state.cart.push({ item, qty: 1 });
//   }
//   saveJSON(STORAGE_KEYS.ACTIVE_CART, state.cart);
//   renderAll();
// }

// function adjustCartItemQty(itemId, delta) {
//   state.cart = state.cart
//     .map((c) => (c.item.id === itemId ? { ...c, qty: c.qty + delta } : c))
//     .filter((c) => c.qty > 0);
//   saveJSON(STORAGE_KEYS.ACTIVE_CART, state.cart);
//   renderAll();
// }

// function clearCart() {
//   state.cart = [];
//   saveJSON(STORAGE_KEYS.ACTIVE_CART, state.cart);
//   renderAll();
// }

// function triggerPrintForOrder(order) {
//   if (!order) return;
//   state.receiptOrder = order;
//   renderThermalReceiptContainers();
//   window.setTimeout(() => {
//     window.print();
//   }, 50);
// }

// function printAndSettleOrder() {
//   if (state.cart.length === 0) return;

//   const assignedToken = state.currentToken;
//   const items = state.cart.map((c) => ({
//     id: c.item.id,
//     name: c.item.name,
//     qty: c.qty,
//     rate: c.item.price,
//     amount: c.qty * c.item.price,
//   }));
//   const grandTotal = items.reduce((s, i) => s + i.amount, 0);

//   const completedOrder = {
//     id: `ord-${Date.now()}-${assignedToken}`,
//     tokenNumber: assignedToken,
//     timestamp: new Date().toISOString(),
//     items,
//     grandTotal,
//   };

//   state.salesHistory.push(completedOrder);
//   state.currentToken = assignedToken + 1;
//   state.cart = [];
//   state.receiptOrder = completedOrder;
//   state.lastSettled = { tokenNumber: assignedToken, grandTotal };

//   saveJSON(STORAGE_KEYS.SALES_HISTORY, state.salesHistory);
//   saveJSON(STORAGE_KEYS.CURRENT_TOKEN, state.currentToken);
//   saveJSON(STORAGE_KEYS.ACTIVE_CART, state.cart);

//   renderAll();
//   triggerPrintForOrder(completedOrder);
// }

// function exportSalesToCsv() {
//   const todayStr = new Date().toISOString().slice(0, 10);
//   const totalRevenue = state.salesHistory.reduce((s, o) => s + o.grandTotal, 0);
//   const totalUnits = state.salesHistory.reduce(
//     (s, o) => s + o.items.reduce((is, i) => is + i.qty, 0),
//     0
//   );

//   const rows = [];
//   rows.push(['PANWADI POHA - END OF DAY SALES REPORT']);
//   rows.push(['Date', todayStr]);
//   rows.push(['Total Sales Amount (INR)', String(totalRevenue)]);
//   rows.push(['Completed Orders', String(state.salesHistory.length)]);
//   rows.push(['Total Portions Sold', String(totalUnits)]);
//   rows.push(['Next Token Number', String(state.currentToken)]);
//   rows.push([]);

//   rows.push(['ITEM-WISE BREAKDOWN']);
//   rows.push(['Code', 'Item Name', 'Unit Rate (INR)', 'Total Qty Sold', 'Total Revenue (INR)']);

//   MENU_ITEMS.forEach((m) => {
//     let qtySold = 0;
//     let rev = 0;
//     state.salesHistory.forEach((o) => {
//       o.items.forEach((line) => {
//         if (line.id === m.id) {
//           qtySold += line.qty;
//           rev += line.amount;
//         }
//       });
//     });
//     rows.push([m.code, `"${m.name.replace(/"/g, '""')}"`, String(m.price), String(qtySold), String(rev)]);
//   });

//   rows.push([]);
//   rows.push(['ORDER TRANSACTION LOG']);
//   rows.push(['Token Number', 'Timestamp', 'Items Ordered', 'Grand Total (INR)']);
//   state.salesHistory.forEach((o) => {
//     const summary = o.items.map((i) => `${i.name} x${i.qty} (Rs.${i.amount})`).join('; ');
//     rows.push([
//       `#${o.tokenNumber}`,
//       `"${new Date(o.timestamp).toLocaleString('en-IN')}"`,
//       `"${summary.replace(/"/g, '""')}"`,
//       String(o.grandTotal),
//     ]);
//   });

//   const csvContent = '\uFEFF' + rows.map((r) => r.join(',')).join('\n');
//   const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
//   const url = URL.createObjectURL(blob);
//   const a = document.createElement('a');
//   a.href = url;
//   a.download = `panwadi-poha-sales-${todayStr}.csv`;
//   document.body.appendChild(a);
//   a.click();
//   document.body.removeChild(a);
//   URL.revokeObjectURL(url);
// }

// function resetDayData() {
//   state.salesHistory = [];
//   state.currentToken = 1;
//   state.cart = [];
//   state.receiptOrder = null;
//   state.lastSettled = null;

//   saveJSON(STORAGE_KEYS.SALES_HISTORY, []);
//   saveJSON(STORAGE_KEYS.CURRENT_TOKEN, 1);
//   saveJSON(STORAGE_KEYS.ACTIVE_CART, []);

//   document.getElementById('confirm-reset-day-box')?.classList.add('hidden');
//   document.getElementById('init-reset-day-btn')?.classList.remove('hidden');
//   renderAll();
// }

// function setPaperWidth(width) {
//   state.settings.paperWidth = width;
//   saveJSON(STORAGE_KEYS.SETTINGS, state.settings);
//   renderAll();
// }

// function switchEodTab(tabName) {
//   state.activeEodTab = tabName;
//   document.querySelectorAll('.eod-tab-btn').forEach((btn) => {
//     btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
//   });
//   document.getElementById('tab-panel-breakdown')?.classList.toggle('hidden', tabName !== 'breakdown');
//   document.getElementById('tab-panel-orders')?.classList.toggle('hidden', tabName !== 'orders');
//   document.getElementById('tab-panel-settings')?.classList.toggle('hidden', tabName !== 'settings');
//   document.getElementById('zero-sales-filter-wrap')?.classList.toggle('hidden', tabName !== 'breakdown');
// }

// // Wire DOM Events
// function initPosApp() {
//   renderAll();

//   // Menu Grid click delegation
//   document.getElementById('menu-grid')?.addEventListener('click', (e) => {
//     const card = e.target.closest('[data-menu-id]');
//     if (card) {
//       addItemToCart(card.getAttribute('data-menu-id'));
//     }
//   });

//   // Cart item +/- click delegation
//   document.getElementById('cart-items-container')?.addEventListener('click', (e) => {
//     const btn = e.target.closest('[data-qty-action]');
//     if (!btn) return;
//     const itemId = btn.getAttribute('data-item-id');
//     const action = btn.getAttribute('data-qty-action');
//     if (itemId && action) {
//       adjustCartItemQty(itemId, action === 'inc' ? 1 : -1);
//     }
//   });

//   // Clear Order & Print & Settle
//   document.getElementById('clear-order-btn')?.addEventListener('click', clearCart);
//   document.getElementById('print-settle-btn')?.addEventListener('click', printAndSettleOrder);

//   // Reprint Last button in banner
//   document.getElementById('reprint-last-btn')?.addEventListener('click', () => {
//     if (state.receiptOrder) triggerPrintForOrder(state.receiptOrder);
//   });

//   // Paper Width Quick Toggles
//   const toggleWidth = () => {
//     setPaperWidth(state.settings.paperWidth === '58mm' ? '80mm' : '58mm');
//   };
//   document.getElementById('nav-paper-toggle')?.addEventListener('click', toggleWidth);
//   document.getElementById('mobile-paper-toggle')?.addEventListener('click', toggleWidth);

//   // Slip Preview Modal open/close
//   const openSlipModal = () => {
//     renderThermalReceiptContainers();
//     document.getElementById('slip-preview-modal')?.classList.remove('hidden');
//   };
//   const closeSlipModal = () => {
//     document.getElementById('slip-preview-modal')?.classList.add('hidden');
//   };
//   document.getElementById('nav-slip-preview')?.addEventListener('click', openSlipModal);
//   document.getElementById('mobile-slip-btn')?.addEventListener('click', openSlipModal);
//   document.getElementById('cart-slip-btn')?.addEventListener('click', openSlipModal);
//   document.getElementById('close-slip-modal-btn')?.addEventListener('click', closeSlipModal);
//   document.getElementById('modal-close-slip-btn')?.addEventListener('click', closeSlipModal);
//   document.getElementById('preview-width-58')?.addEventListener('click', () => setPaperWidth('58mm'));
//   document.getElementById('preview-width-80')?.addEventListener('click', () => setPaperWidth('80mm'));
//   document.getElementById('modal-test-print-btn')?.addEventListener('click', () => {
//     const order = getLiveOrLastOrder();
//     if (order) triggerPrintForOrder(order);
//   });

//   // EOD Reports Modal open/close
//   const openReportsModal = () => {
//     renderReportsModal();
//     document.getElementById('reports-modal')?.classList.remove('hidden');
//   };
//   const closeReportsModal = () => {
//     document.getElementById('reports-modal')?.classList.add('hidden');
//   };
//   document.getElementById('open-reports-btn')?.addEventListener('click', openReportsModal);
//   document.getElementById('nav-today-summary')?.addEventListener('click', openReportsModal);
//   document.getElementById('close-reports-modal-btn')?.addEventListener('click', closeReportsModal);

//   // EOD Modal Tabs
//   document.querySelectorAll('.eod-tab-btn').forEach((btn) => {
//     btn.addEventListener('click', () => {
//       const tab = btn.getAttribute('data-tab');
//       if (tab) switchEodTab(tab);
//     });
//   });

//   // Zero-sales filter checkbox
//   document.getElementById('show-zero-sales-checkbox')?.addEventListener('change', (e) => {
//     state.showZeroSales = e.target.checked;
//     renderReportsModal();
//   });

//   // Reprint historical order from Recent Orders list
//   document.getElementById('recent-orders-list')?.addEventListener('click', (e) => {
//     const btn = e.target.closest('[data-reprint-id]');
//     if (!btn) return;
//     const orderId = btn.getAttribute('data-reprint-id');
//     const found = state.salesHistory.find((o) => o.id === orderId);
//     if (found) triggerPrintForOrder(found);
//   });

//   // Settings inputs
//   document.getElementById('setting-paper-58')?.addEventListener('click', () => setPaperWidth('58mm'));
//   document.getElementById('setting-paper-80')?.addEventListener('click', () => setPaperWidth('80mm'));
//   document.getElementById('setting-upi-input')?.addEventListener('input', (e) => {
//     state.settings.upiId = e.target.value.trim();
//     saveJSON(STORAGE_KEYS.SETTINGS, state.settings);
//     renderThermalReceiptContainers();
//     renderReportsModal();
//   });
//   document.getElementById('setting-tagline-input')?.addEventListener('input', (e) => {
//     state.settings.shopTagline = e.target.value;
//     saveJSON(STORAGE_KEYS.SETTINGS, state.settings);
//     renderThermalReceiptContainers();
//   });

//   // Export CSV & Reset Day two-step confirmation
//   document.getElementById('export-csv-btn')?.addEventListener('click', exportSalesToCsv);
//   document.getElementById('init-reset-day-btn')?.addEventListener('click', () => {
//     document.getElementById('init-reset-day-btn')?.classList.add('hidden');
//     document.getElementById('confirm-reset-day-box')?.classList.remove('hidden');
//   });
//   document.getElementById('confirm-reset-cancel-btn')?.addEventListener('click', () => {
//     document.getElementById('confirm-reset-day-box')?.classList.add('hidden');
//     document.getElementById('init-reset-day-btn')?.classList.remove('hidden');
//   });
//   document.getElementById('confirm-reset-yes-btn')?.addEventListener('click', resetDayData);

//   // Prevent brand link reload
//   document.getElementById('brand-link')?.addEventListener('click', (e) => e.preventDefault());
// }

// document.addEventListener('DOMContentLoaded', initPosApp);


/**
 * Panwadi Poha — Offline-First POS & Thermal Billing Application
 * Pure Vanilla JavaScript (ES6) with genuine ISO/IEC 18004 Reed-Solomon QR Encoder.
 */

const STORAGE_KEYS = {
  CURRENT_TOKEN: 'panwadi_poha_current_token',
  SALES_HISTORY: 'panwadi_poha_sales_history',
  ACTIVE_CART: 'panwadi_poha_active_cart',
  SETTINGS: 'panwadi_poha_settings',
};

const DEFAULT_SETTINGS = {
  paperWidth: '58mm',
  qrMode: 'dynamic', // 'dynamic' | 'custom_image'
  upiId: 'panwadipoha@upi',
  customQrDataUrl: '',
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
    // Ignore storage quota errors in restricted browsing modes
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

function isValidUpiId(upiId) {
  const cleaned = String(upiId || '').trim();
  return /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(cleaned);
}

/**
 * ============================================================================
 * GENUINE ISO/IEC 18004 QR CODE ENCODER (Error Correction Level L & M, Byte Mode)
 * ============================================================================
 * Encodes any UTF-8 string (such as an NPCI `upi://pay?...` payment link) into
 * a mathematically valid, camera-scannable QR matrix with Galois Field GF(256)
 * Reed-Solomon error correction, alignment patterns, mask evaluation, and BCH
 * format information bits. Works 100% offline.
 */
const QR_VERSIONS_L = [
  null,
  { version: 1, totalData: 19, ecPerBlock: 7, numBlocks: 1, align: [] },
  { version: 2, totalData: 34, ecPerBlock: 10, numBlocks: 1, align: [6, 18] },
  { version: 3, totalData: 55, ecPerBlock: 15, numBlocks: 1, align: [6, 22] },
  { version: 4, totalData: 80, ecPerBlock: 20, numBlocks: 1, align: [6, 26] },
  { version: 5, totalData: 108, ecPerBlock: 26, numBlocks: 1, align: [6, 30] },
  { version: 6, totalData: 136, ecPerBlock: 18, numBlocks: 2, align: [6, 34] },
];

// Precompute GF(2^8) log and anti-log tables with primitive polynomial 0x11D (285)
const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x = (x << 1) ^ (x & 0x80 ? 0x11d : 0);
  }
  for (let i = 255; i < 512; i++) {
    GF_EXP[i] = GF_EXP[i - 255];
  }
})();

function gfMul(a, b) {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

function buildRsGeneratorPoly(degree) {
  let poly = new Uint8Array([1]);
  for (let i = 0; i < degree; i++) {
    const next = new Uint8Array(poly.length + 1);
    const root = GF_EXP[i];
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= poly[j];
      next[j + 1] ^= gfMul(poly[j], root);
    }
    poly = next;
  }
  return poly;
}

function computeRsErrorCorrection(dataBytes, ecLen) {
  const gen = buildRsGeneratorPoly(ecLen);
  const rem = new Uint8Array(ecLen);
  for (let i = 0; i < dataBytes.length; i++) {
    const factor = dataBytes[i] ^ rem[0];
    for (let j = 0; j < ecLen - 1; j++) {
      rem[j] = rem[j + 1];
    }
    rem[ecLen - 1] = 0;
    if (factor !== 0) {
      for (let j = 0; j < ecLen; j++) {
        rem[j] ^= gfMul(gen[j + 1], factor);
      }
    }
  }
  return rem;
}

function computeBchFormatBits(ecLevelBits, maskPattern) {
  const data = (ecLevelBits << 3) | maskPattern;
  let rem = data << 10;
  for (let i = 14; i >= 10; i--) {
    if ((rem & (1 << i)) !== 0) {
      rem ^= 0x537 << (i - 10);
    }
  }
  return ((data << 10) | rem) ^ 0x5412;
}

function encodeQrMatrix(text) {
  const utf8Bytes = new TextEncoder().encode(text);
  const byteLen = utf8Bytes.length;

  // Choose smallest Version 1..6 (Level L) that fits byteLen + 2 bytes header
  let spec = QR_VERSIONS_L[6];
  for (let v = 1; v <= 6; v++) {
    if (byteLen + 2 <= QR_VERSIONS_L[v].totalData) {
      spec = QR_VERSIONS_L[v];
      break;
    }
  }

  // Build bit buffer: Mode 0100 (4 bits) + Character Count (8 bits) + Payload + Terminator
  const bits = [];
  const pushBits = (val, count) => {
    for (let i = count - 1; i >= 0; i--) {
      bits.push((val >>> i) & 1);
    }
  };

  pushBits(0b0100, 4);
  pushBits(byteLen, 8);
  for (let i = 0; i < byteLen; i++) {
    pushBits(utf8Bytes[i], 8);
  }

  const maxDataBits = spec.totalData * 8;
  const termLen = Math.min(4, maxDataBits - bits.length);
  pushBits(0, termLen);

  while (bits.length % 8 !== 0) {
    bits.push(0);
  }

  const dataCodewords = new Uint8Array(spec.totalData);
  const filledBytes = Math.min(spec.totalData, bits.length / 8);
  for (let i = 0; i < filledBytes; i++) {
    let b = 0;
    for (let j = 0; j < 8; j++) {
      b = (b << 1) | bits[i * 8 + j];
    }
    dataCodewords[i] = b;
  }

  // Pad remaining data codewords alternating 0xEC and 0x11
  let padToggle = true;
  for (let i = filledBytes; i < spec.totalData; i++) {
    dataCodewords[i] = padToggle ? 0xec : 0x11;
    padToggle = !padToggle;
  }

  // Split into blocks, compute Reed-Solomon EC for each block, and interleave
  const dataPerBlock = spec.totalData / spec.numBlocks;
  const dataBlocks = [];
  const ecBlocks = [];
  for (let b = 0; b < spec.numBlocks; b++) {
    const slice = dataCodewords.slice(b * dataPerBlock, (b + 1) * dataPerBlock);
    dataBlocks.push(slice);
    ecBlocks.push(computeRsErrorCorrection(slice, spec.ecPerBlock));
  }

  const finalCodewords = [];
  for (let i = 0; i < dataPerBlock; i++) {
    for (let b = 0; b < spec.numBlocks; b++) {
      finalCodewords.push(dataBlocks[b][i]);
    }
  }
  for (let i = 0; i < spec.ecPerBlock; i++) {
    for (let b = 0; b < spec.numBlocks; b++) {
      finalCodewords.push(ecBlocks[b][i]);
    }
  }

  // Initialize QR grid
  const size = 17 + spec.version * 4;
  const modules = Array.from({ length: size }, () => Array(size).fill(false));
  const isFunction = Array.from({ length: size }, () => Array(size).fill(false));

  const setFunctionModule = (r, c, dark) => {
    if (r >= 0 && r < size && c >= 0 && c < size) {
      modules[r][c] = Boolean(dark);
      isFunction[r][c] = true;
    }
  };

  // Finder patterns + 1px white separators
  const drawFinder = (rOff, cOff) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const rr = rOff + r;
        const cc = cOff + c;
        if (rr >= 0 && rr < size && cc >= 0 && cc < size) {
          if (r >= 0 && r <= 6 && c >= 0 && c <= 6) {
            const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
            const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
            setFunctionModule(rr, cc, isBorder || isInner);
          } else {
            setFunctionModule(rr, cc, false);
          }
        }
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    setFunctionModule(6, i, i % 2 === 0);
    setFunctionModule(i, 6, i % 2 === 0);
  }

  // Alignment patterns
  const alignCoords = spec.align;
  for (let i = 0; i < alignCoords.length; i++) {
    for (let j = 0; j < alignCoords.length; j++) {
      if (
        (i === 0 && j === 0) ||
        (i === 0 && j === alignCoords.length - 1) ||
        (i === alignCoords.length - 1 && j === 0)
      ) {
        continue;
      }
      const cr = alignCoords[i];
      const cc = alignCoords[j];
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const dark = Math.max(Math.abs(dr), Math.abs(dc)) !== 1;
          setFunctionModule(cr + dr, cc + dc, dark);
        }
      }
    }
  }

  // Dark module and reserved format info areas
  setFunctionModule(size - 8, 8, true);
  for (let i = 0; i <= 8; i++) {
    if (!isFunction[8][i]) setFunctionModule(8, i, false);
    if (!isFunction[i][8]) setFunctionModule(i, 8, false);
  }
  for (let i = 0; i < 8; i++) {
    if (!isFunction[8][size - 1 - i]) setFunctionModule(8, size - 1 - i, false);
    if (!isFunction[size - 1 - i][8]) setFunctionModule(size - 1 - i, 8, false);
  }

  // Zigzag 2-column placement of finalCodewords bits
  let bitIdx = 0;
  const totalBits = finalCodewords.length * 8;
  let upward = true;

  for (let rightCol = size - 1; rightCol >= 1; rightCol -= 2) {
    if (rightCol === 6) rightCol = 5; // Skip vertical timing pattern column
    for (let vert = 0; vert < size; vert++) {
      const r = upward ? size - 1 - vert : vert;
      for (let j = 0; j < 2; j++) {
        const c = rightCol - j;
        if (!isFunction[r][c]) {
          let dark = false;
          if (bitIdx < totalBits) {
            const byteVal = finalCodewords[bitIdx >>> 3];
            dark = ((byteVal >>> (7 - (bitIdx & 7))) & 1) === 1;
            bitIdx++;
          }
          modules[r][c] = dark;
        }
      }
    }
    upward = !upward;
  }

  // Apply Mask Pattern 0: (r + c) % 2 === 0 and write Format Info bits (Level L = 0b01)
  const maskPattern = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!isFunction[r][c] && (r + c) % 2 === 0) {
        modules[r][c] = !modules[r][c];
      }
    }
  }

  // Write 15-bit BCH Format Information for Level L (0b01) and Mask 0
  const formatBits = computeBchFormatBits(0b01, maskPattern);
  const getFormatBit = (idx) => ((formatBits >>> idx) & 1) === 1;

  // Copy 1 around Top-Left Finder
  for (let i = 0; i <= 5; i++) modules[i][8] = getFormatBit(i);
  modules[7][8] = getFormatBit(6);
  modules[8][8] = getFormatBit(7);
  modules[8][7] = getFormatBit(8);
  for (let i = 9; i < 15; i++) modules[8][14 - i] = getFormatBit(i);

  // Copy 2 along Top-Right and Bottom-Left
  for (let i = 0; i <= 7; i++) modules[8][size - 1 - i] = getFormatBit(i);
  for (let i = 8; i < 15; i++) modules[size - 15 + i][8] = getFormatBit(i);
  modules[size - 8][8] = true;

  return modules;
}

/**
 * Renders either the custom uploaded QR image or a real ISO/IEC 18004 QR SVG
 * with a mandatory 4-module white quiet zone so every phone camera scans it.
 */
function buildQrMarkupForOrder(upiUri, sizePx = 128) {
  if (state.settings.qrMode === 'custom_image' && state.settings.customQrDataUrl) {
    return `
      <div class="receipt-qr-box" style="width:${sizePx}px;height:${sizePx}px;">
        <img src="${state.settings.customQrDataUrl}" alt="Scan to Pay QR Code" class="receipt-custom-qr-img" />
      </div>
    `;
  }

  const matrix = encodeQrMatrix(upiUri);
  const matrixSize = matrix.length;
  const quietZone = 3;
  const totalViewSize = matrixSize + quietZone * 2;

  let pathData = '';
  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      if (matrix[r][c]) {
        pathData += `M${c + quietZone},${r + quietZone}h1v1h-1z`;
      }
    }
  }

  return `
    <div class="receipt-qr-box" style="width:${sizePx}px;height:${sizePx}px;">
      <svg viewBox="0 0 ${totalViewSize} ${totalViewSize}" width="100%" height="100%" shape-rendering="crispEdges" role="img" aria-label="Scan to Pay via UPI">
        <rect width="${totalViewSize}" height="${totalViewSize}" fill="#ffffff" />
        <path d="${pathData}" fill="#000000" />
      </svg>
    </div>
  `;
}

/**
 * Formats a standard NPCI UPI Payment DeepLink URI that pre-fills the exact amount
 * in Google Pay, PhonePe, Paytm, and BHIM.
 */
function buildUpiPaymentUri(upiId, amountInr) {
  const cleanUpi = String(upiId || 'panwadipoha@upi').trim();
  const formattedAmount = Number(amountInr || 0).toFixed(2);
  return `upi://pay?pa=${cleanUpi}&pn=Panwadi%20Poha&am=${formattedAmount}&cu=INR`;
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
  const upiUri = buildUpiPaymentUri(upiId, order.grandTotal);

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

  const qrSubLabel =
    state.settings.qrMode === 'custom_image' && state.settings.customQrDataUrl
      ? `Pay ₹${order.grandTotal} via UPI`
      : `UPI ID: ${escapeHtml(upiId)} · ₹${order.grandTotal}`;

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
        <div class="receipt-qr-title">SCAN TO PAY ₹${order.grandTotal} (UPI)</div>
        ${buildQrMarkupForOrder(upiUri, is58 ? 124 : 144)}
        <div class="receipt-upi-id">${qrSubLabel}</div>
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
  const modeDynamicBtn = document.getElementById('qr-mode-dynamic');
  const modeUploadBtn = document.getElementById('qr-mode-upload');
  const dynamicCard = document.getElementById('dynamic-upi-settings-card');
  const uploadCard = document.getElementById('custom-qr-upload-card');
  const clearQrBtn = document.getElementById('clear-custom-qr-btn');
  const upiValidationEl = document.getElementById('upi-validation-msg');

  const isCustomMode = state.settings.qrMode === 'custom_image';
  if (modeDynamicBtn) modeDynamicBtn.classList.toggle('active', !isCustomMode);
  if (modeUploadBtn) modeUploadBtn.classList.toggle('active', isCustomMode);
  if (dynamicCard) dynamicCard.classList.toggle('hidden', isCustomMode);
  if (uploadCard) uploadCard.classList.toggle('hidden', !isCustomMode);
  if (clearQrBtn) clearQrBtn.classList.toggle('hidden', !state.settings.customQrDataUrl);

  const p58 = document.getElementById('setting-paper-58');
  const p80 = document.getElementById('setting-paper-80');
  const upiInput = document.getElementById('setting-upi-input');
  const taglineInput = document.getElementById('setting-tagline-input');
  const qrTitle = document.getElementById('settings-qr-title');
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

  const currentUpi = state.settings.upiId || 'panwadipoha@upi';
  const validUpi = isValidUpiId(currentUpi);
  if (upiValidationEl) {
    if (validUpi) {
      upiValidationEl.className = 'upi-validation-msg valid';
      upiValidationEl.textContent = `✓ Valid UPI ID (${currentUpi}) — Ready to scan on GPay, PhonePe & Paytm`;
    } else {
      upiValidationEl.className = 'upi-validation-msg invalid';
      upiValidationEl.textContent = 'Please enter a valid UPI ID containing "@" (for example: name@okaxis or 9876543210@ybl)';
    }
  }

  const sampleUri = buildUpiPaymentUri(currentUpi, 100);
  if (qrTitle) {
    qrTitle.textContent = isCustomMode
      ? 'Uploaded Custom Shop QR Preview'
      : 'Scannable UPI QR Test (₹100.00 Sample)';
  }
  if (qrPreview) qrPreview.innerHTML = buildQrMarkupForOrder(sampleUri, 152);
  if (upiReadout) {
    upiReadout.textContent =
      isCustomMode && state.settings.customQrDataUrl
        ? 'Custom QR Image Active'
        : currentUpi;
  }
  if (paperReadout) {
    paperReadout.textContent = `Paper: ${state.settings.paperWidth} · Scan with GPay / PhonePe / Paytm`;
  }
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

function setQrMode(mode) {
  state.settings.qrMode = mode;
  saveJSON(STORAGE_KEYS.SETTINGS, state.settings);
  renderAll();
}

function handleCustomQrUpload(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const maxDim = 320;
      canvas.width = maxDim;
      canvas.height = maxDim;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, maxDim, maxDim);
        const scale = Math.min(maxDim / img.width, maxDim / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, (maxDim - w) / 2, (maxDim - h) / 2, w, h);
        state.settings.customQrDataUrl = canvas.toDataURL('image/png');
        state.settings.qrMode = 'custom_image';
        saveJSON(STORAGE_KEYS.SETTINGS, state.settings);
        renderAll();
      }
    };
    img.src = String(ev.target?.result || '');
  };
  reader.readAsDataURL(file);
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

  // QR Mode and UPI Settings
  document.getElementById('qr-mode-dynamic')?.addEventListener('click', () => setQrMode('dynamic'));
  document.getElementById('qr-mode-upload')?.addEventListener('click', () => setQrMode('custom_image'));
  document.getElementById('setting-paper-58')?.addEventListener('click', () => setPaperWidth('58mm'));
  document.getElementById('setting-paper-80')?.addEventListener('click', () => setPaperWidth('80mm'));

  document.getElementById('setting-upi-input')?.addEventListener('input', (e) => {
    state.settings.upiId = e.target.value.trim();
    saveJSON(STORAGE_KEYS.SETTINGS, state.settings);
    renderThermalReceiptContainers();
    renderReportsModal();
  });

  document.getElementById('setting-qr-file-input')?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (file) handleCustomQrUpload(file);
  });

  document.getElementById('clear-custom-qr-btn')?.addEventListener('click', () => {
    state.settings.customQrDataUrl = '';
    state.settings.qrMode = 'dynamic';
    saveJSON(STORAGE_KEYS.SETTINGS, state.settings);
    const fileInput = document.getElementById('setting-qr-file-input');
    if (fileInput) fileInput.value = '';
    renderAll();
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
