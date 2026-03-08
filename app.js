/* ================================================================
   KUNJ MART — app.js
   G.T. Road, Gopiganj, Bhadohi, UP | +91 9005447658
================================================================ */

'use strict';

// ── CONSTANTS ────────────────────────────────────────────────────
var WA_PRIMARY   = '919005447658';
var WA_SECONDARY = '919794682122';

// ── STATE ────────────────────────────────────────────────────────
var allP     = [];   // all products
var cart     = [];   // cart items: {id, name, price, image, qty}
var activeCat = 'All';

// ── SVG ICONS ────────────────────────────────────────────────────
var SVG_WA = '<svg viewBox="0 0 24 24" fill="currentColor" style="width:15px;height:15px;flex-shrink:0"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>';
var SVG_CART = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;flex-shrink:0"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 001.95-1.57l1.65-8.42H6"/></svg>';
var SVG_CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:14px;height:14px;flex-shrink:0"><polyline points="20 6 9 17 4 12"/></svg>';

// ── HELPERS ──────────────────────────────────────────────────────
function esc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function inr(n) {
  return Number(n || 0).toLocaleString('en-IN');
}

// ── BOOT ─────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
  loadCart();
  updateCartBadge();
  loadProducts();
  setupNav();
  setupFooter();

  // ESC key closes overlays
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeCart(); closeProduct(); closePolicy(); }
  });
});

// ── LIVE SYNC (BroadcastChannel from admin) ───────────────────────
(function () {
  try {
    var ch = new BroadcastChannel('km_sync');
    ch.onmessage = function (e) {
      if (e.data && e.data.type === 'products' && Array.isArray(e.data.data)) {
        allP = e.data.data;
        localStorage.setItem('km_products', JSON.stringify(allP));
        refreshAll();
        flashLive();
      }
    };
  } catch (ex) {}

  window.addEventListener('storage', function (e) {
    if (e.key === 'km_products' && e.newValue) {
      try { allP = JSON.parse(e.newValue); refreshAll(); } catch (ex) {}
    }
  });
})();

function flashLive() {
  var el = document.getElementById('liveInd');
  if (!el) return;
  el.classList.add('on');
  setTimeout(function () { el.classList.remove('on'); }, 2500);
}

// ── LOAD PRODUCTS ─────────────────────────────────────────────────
function loadProducts() {
  // 1. localStorage (admin edits win)
  var saved = localStorage.getItem('km_products');
  if (saved) {
    try {
      var p = JSON.parse(saved);
      if (Array.isArray(p) && p.length) { allP = p; refreshAll(); return; }
    } catch (ex) {}
  }
  // 2. products.json
  fetch('products.json')
    .then(function (r) { if (!r.ok) throw 0; return r.json(); })
    .then(function (data) {
      allP = data.map(function (p) {
        return Object.assign({ trending: false, stock: 99, discount: 0, description: '' }, p);
      });
      localStorage.setItem('km_products', JSON.stringify(allP));
      refreshAll();
    })
    .catch(function () {
      // 3. Built-in fallback — a few sample products so page never looks empty
      allP = [
        { id:1, name:"Men's Cotton Shirt",     category:"Mens Wear",   price:599,  discount:0,  stock:50, trending:true,  image:"https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400&h=400&fit=crop", description:"Premium cotton casual shirt." },
        { id:2, name:"Women's Anarkali Kurti", category:"Womens Wear", price:799,  discount:15, stock:35, trending:true,  image:"https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=400&h=400&fit=crop", description:"Beautiful floral Anarkali kurti." },
        { id:3, name:"Basmati Rice 5kg",       category:"Grocery",     price:399,  discount:5,  stock:100,trending:true,  image:"https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=400&fit=crop", description:"Premium aged basmati rice." },
        { id:4, name:"Men's Sports Shoes",     category:"Footwear",    price:999,  discount:12, stock:30, trending:true,  image:"https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop", description:"Lightweight breathable sports shoes." },
        { id:5, name:"Non-Stick Kadai 3L",     category:"Kitchen Accessories", price:799, discount:8, stock:20, trending:false, image:"https://images.unsplash.com/photo-1585515320310-259814833e62?w=400&h=400&fit=crop", description:"Heavy-duty non-stick kadai." },
        { id:6, name:"Cotton Bedsheet Set",    category:"Home Furnishing",     price:899, discount:25, stock:25, trending:true,  image:"https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&h=400&fit=crop", description:"Soft 100% cotton bedsheet set." }
      ];
      localStorage.setItem('km_products', JSON.stringify(allP));
      refreshAll();
    });
}

function refreshAll() {
  buildPills();
  renderProducts(getFiltered());
  renderTrending();
}

// ── CATEGORY FILTER ───────────────────────────────────────────────
function filterCat(cat) {
  activeCat = cat;
  buildPills();
  renderProducts(getFiltered());
  var el = document.getElementById('products');
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function setCat(cat) {
  activeCat = cat;
  buildPills();
  renderProducts(getFiltered());
}

function applyF() {
  renderProducts(getFiltered());
}

function getFiltered() {
  var q = (document.getElementById('srchInp') ? document.getElementById('srchInp').value : '').toLowerCase().trim();
  return allP.filter(function (p) {
    var matchCat = (activeCat === 'All') || (p.category === activeCat);
    var matchQ   = !q || p.name.toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q);
    return matchCat && matchQ;
  });
}

// ── FILTER PILLS ──────────────────────────────────────────────────
function buildPills() {
  var el = document.getElementById('pills');
  if (!el) return;
  var cats = ['All'];
  allP.forEach(function (p) {
    if (p.category && cats.indexOf(p.category) === -1) cats.push(p.category);
  });
  el.innerHTML = cats.map(function (cat) {
    return '<button class="pill' + (cat === activeCat ? ' on' : '') +
           '" onclick="setCat(\'' + cat.replace(/'/g, "\\'") + '\')">' + esc(cat) + '</button>';
  }).join('');
}

// ── RENDER PRODUCTS ───────────────────────────────────────────────
function renderProducts(list) {
  var el = document.getElementById('prodGrid');
  if (!el) return;
  if (!list || !list.length) {
    el.innerHTML = '<div class="empty-state">' +
      '<svg viewBox="0 0 64 64" width="64" height="64" fill="none" stroke="#d1d5db" stroke-width="2"><circle cx="32" cy="32" r="28"/><path d="M20 32h24M32 20v24"/></svg>' +
      '<p>No products found</p>' +
      '<button class="pill on" onclick="filterCat(\'All\')">Show All</button>' +
      '</div>';
    return;
  }
  el.innerHTML = list.map(makeCard).join('');
}

function makeCard(p) {
  var inCart   = cart.some(function (x) { return x.id === p.id; });
  var outStock = (Number(p.stock) === 0);
  var lowStock = (!outStock && Number(p.stock) > 0 && Number(p.stock) <= 5);
  var discount = Number(p.discount) || 0;
  var origP    = Number(p.price);
  var discP    = discount > 0 ? Math.round(origP * (1 - discount / 100)) : origP;

  var priceHtml = discount > 0
    ? '<strong>₹' + inr(discP) + '</strong>' +
      ' <span style="font-size:11px;color:#9CA3AF;text-decoration:line-through">₹' + inr(origP) + '</span>' +
      ' <span class="disc-pill">' + discount + '% OFF</span>'
    : '<strong>₹' + inr(origP) + '</strong>';

  var badges = '<span class="pbadge">' + esc(p.category) + '</span>';
  if (p.trending)  badges += '<span class="trend-badge">★ Trending</span>';
  if (outStock)    badges += '<span class="out-badge">Out of Stock</span>';
  else if (lowStock) badges += '<span class="low-badge">Only ' + p.stock + ' left!</span>';

  var dis = outStock ? ' disabled' : '';
  var dst = outStock ? ' style="opacity:.5;cursor:not-allowed"' : '';

  return (
    '<div class="pc">' +
      '<div class="pi" onclick="openProduct(' + p.id + ')">' +
        '<img src="' + esc(p.image || '') + '" alt="' + esc(p.name) + '" loading="lazy" ' +
          'onerror="this.src=\'https://placehold.co/400x300/EEF4FF/1A73E8?text=Kunj+Mart\'"/>' +
        badges +
      '</div>' +
      '<div class="pinfo">' +
        '<p class="pname" onclick="openProduct(' + p.id + ')">' + esc(p.name) + '</p>' +
        '<p class="pprice">' + priceHtml + '</p>' +
        '<div style="display:flex;flex-direction:column;gap:8px;margin-top:auto">' +
          '<button class="wa-btn" onclick="quickOrder(' + p.id + ')"' + dis + dst + '>' +
            SVG_WA + ' Order on WhatsApp</button>' +
          '<button class="add-cart-mini" onclick="addCart(' + p.id + ')"' + dis + dst + '>' +
            (inCart ? SVG_CHECK + ' In Cart' : SVG_CART + ' Add to Cart') + '</button>' +
        '</div>' +
      '</div>' +
    '</div>'
  );
}

// ── TRENDING SECTION ──────────────────────────────────────────────
function renderTrending() {
  var el = document.getElementById('trendGrid');
  if (!el) return;
  var list = allP.filter(function (p) { return p.trending && Number(p.stock) > 0; }).slice(0, 8);
  if (!list.length) {
    var sec = document.getElementById('trending-sec');
    if (sec) sec.style.display = 'none';
    return;
  }
  el.innerHTML = list.map(function (p) {
    var discount = Number(p.discount) || 0;
    var discP    = discount > 0 ? Math.round(Number(p.price) * (1 - discount / 100)) : Number(p.price);
    return (
      '<div class="trend-card" onclick="openProduct(' + p.id + ')">' +
        '<div class="trend-img"><img src="' + esc(p.image || '') + '" alt="' + esc(p.name) + '" loading="lazy" ' +
          'onerror="this.src=\'https://placehold.co/300x300/1F2937/fff?text=Trending\'"/></div>' +
        '<div class="trend-info">' +
          '<div class="trend-name">' + esc(p.name) + '</div>' +
          '<div class="trend-price">₹' + inr(discP) + (discount > 0 ? ' <span style="font-size:10px;color:#F48FB1;text-decoration:line-through">₹' + inr(p.price) + '</span>' : '') + '</div>' +
        '</div>' +
      '</div>'
    );
  }).join('');
}

// ── PRODUCT DETAIL OVERLAY ────────────────────────────────────────
function openProduct(id) {
  var p = allP.find(function (x) { return Number(x.id) === Number(id); });
  if (!p) return;

  var outStock = Number(p.stock) === 0;
  var lowStock = !outStock && Number(p.stock) > 0 && Number(p.stock) <= 5;
  var discount = Number(p.discount) || 0;
  var origP    = Number(p.price);
  var discP    = discount > 0 ? Math.round(origP * (1 - discount / 100)) : origP;
  var savings  = origP - discP;

  // Price HTML
  var priceHtml = discount > 0
    ? '<span class="pdp-price">₹' + inr(discP) + '</span>' +
      '<span class="pdp-orig">₹' + inr(origP) + '</span>' +
      '<span class="pdp-disc-badge">' + discount + '% OFF</span>'
    : '<span class="pdp-price">₹' + inr(origP) + '</span>';

  // Stock badge
  var stockHtml = outStock
    ? '<span class="pdp-stock out">✕ Out of Stock</span>'
    : lowStock
      ? '<span class="pdp-stock low">⚠ Only ' + p.stock + ' left!</span>'
      : '<span class="pdp-stock in">✓ In Stock</span>';

  // Description bullets
  var desc = (p.description || 'Premium quality product from Kunj Mart, Gopiganj.');
  var bullets = desc.split('.').filter(function (s) { return s.trim().length > 3; })
    .map(function (s) { return '<li>' + esc(s.trim()) + '.</li>'; }).join('');

  var disBtn = outStock ? ' disabled style="opacity:.5;cursor:not-allowed"' : '';

  document.getElementById('pdpInner').innerHTML =
    '<div class="pdp-img-col">' +
      '<div class="pdp-main-img">' +
        '<img src="' + esc(p.image || '') + '" alt="' + esc(p.name) + '" ' +
          'onerror="this.src=\'https://placehold.co/500x500/EEF4FF/1A73E8?text=Kunj+Mart\'"/>' +
        (p.trending ? '<span class="pdp-img-badge">★ Trending</span>' : '') +
      '</div>' +
    '</div>' +

    '<div class="pdp-info-col">' +
      '<span class="pdp-cat">' + esc(p.category) + '</span>' +
      '<h2 class="pdp-name">' + esc(p.name) + '</h2>' +
      '<div class="pdp-stars">★★★★★ <span>5.0 &nbsp;•&nbsp; Kunj Mart Verified</span></div>' +
      '<div class="pdp-price-row">' + priceHtml + '</div>' +
      (savings > 0 ? '<div class="pdp-save">You save ₹' + inr(savings) + '!</div>' : '') +
      '<div>' + stockHtml + '</div>' +
      '<div class="pdp-divider"></div>' +
      '<div class="pdp-desc-title">Product Details</div>' +
      '<ul class="pdp-desc-list">' + (bullets || '<li>' + esc(desc) + '</li>') + '</ul>' +
      '<div class="pdp-divider"></div>' +
      '<div class="pdp-actions">' +
        '<button class="pdp-wa-btn" onclick="quickOrder(' + p.id + ')"' + disBtn + '>' +
          SVG_WA + ' Order via WhatsApp</button>' +
        '<button class="pdp-cart-btn" onclick="addCart(' + p.id + ');showToast(\'Added to cart!\');"' + disBtn + '>' +
          SVG_CART + ' Add to Cart</button>' +
      '</div>' +
      '<div class="pdp-meta">' +
        '<div class="pdp-meta-row"><span>📍 Pickup:</span><span>G.T. Road, Gopiganj, Bhadohi</span></div>' +
        '<div class="pdp-meta-row"><span>⏰ Hours:</span><span>9 AM – 9 PM Daily</span></div>' +
        '<div class="pdp-meta-row"><span>📞 Contact:</span><span>+91 9005447658</span></div>' +
      '</div>' +
    '</div>';

  var ov = document.getElementById('pdpOv');
  ov.classList.add('on');
  ov.scrollTop = 0;
  document.body.style.overflow = 'hidden';
}

function closeProduct() {
  var ov = document.getElementById('pdpOv');
  if (ov) ov.classList.remove('on');
  document.body.style.overflow = '';
}

// Click outside to close
document.addEventListener('DOMContentLoaded', function () {
  var ov = document.getElementById('pdpOv');
  if (ov) ov.addEventListener('click', function (e) {
    if (e.target === ov) closeProduct();
  });
});

// ── CART ──────────────────────────────────────────────────────────
function addCart(id) {
  var p = allP.find(function (x) { return Number(x.id) === Number(id); });
  if (!p) return;
  if (Number(p.stock) === 0) { showToast('This item is out of stock'); return; }
  var discount = Number(p.discount) || 0;
  var price    = discount > 0 ? Math.round(Number(p.price) * (1 - discount / 100)) : Number(p.price);
  var ex = cart.find(function (x) { return x.id === p.id; });
  if (ex) {
    ex.qty++;
  } else {
    cart.push({ id: p.id, name: p.name, price: price, image: p.image || '', qty: 1 });
  }
  saveCart();
  updateCartBadge();
  renderCartDrawer();
  showToast('Added to cart!');
}

function removeCart(id) {
  cart = cart.filter(function (x) { return x.id !== id; });
  saveCart();
  updateCartBadge();
  renderCartDrawer();
}

function changeQty(id, delta) {
  var item = cart.find(function (x) { return x.id === id; });
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) return removeCart(id);
  saveCart();
  updateCartBadge();
  renderCartDrawer();
}

function saveCart()   { localStorage.setItem('km_cart', JSON.stringify(cart)); }
function loadCart()   {
  try { cart = JSON.parse(localStorage.getItem('km_cart') || '[]'); } catch (e) { cart = []; }
}

function updateCartBadge() {
  var total = cart.reduce(function (s, x) { return s + x.qty; }, 0);
  var badge = document.getElementById('cartN');
  var txt   = document.getElementById('cartTxt');
  if (badge) {
    badge.textContent = total;
    badge.style.display = total > 0 ? 'flex' : 'none';
  }
  if (txt) txt.textContent = total > 0 ? 'Cart (' + total + ')' : 'Cart';
}

function renderCartDrawer() {
  var body = document.getElementById('cartBody');
  if (!body) return;
  if (!cart.length) {
    body.innerHTML = '<div class="cart-empty"><div style="font-size:48px;margin-bottom:12px">🛒</div><p style="font-size:15px;margin-bottom:4px">Your cart is empty</p><p style="font-size:13px">Add products to order via WhatsApp</p></div>';
    var foot = document.getElementById('cartFoot');
    if (foot) foot.style.display = 'none';
    return;
  }
  var foot = document.getElementById('cartFoot');
  if (foot) foot.style.display = 'block';
  body.innerHTML = cart.map(function (item) {
    return (
      '<div class="cart-item">' +
        '<img class="cart-item-img" src="' + esc(item.image) + '" alt="' + esc(item.name) + '" ' +
          'onerror="this.src=\'https://placehold.co/64x64/EEF4FF/1A73E8?text=Item\'"/>' +
        '<div class="cart-item-info">' +
          '<div class="cart-item-name">' + esc(item.name) + '</div>' +
          '<div class="cart-item-price">₹' + inr(item.price * item.qty) + '</div>' +
          '<div class="qty-ctrl">' +
            '<button class="qty-btn" onclick="changeQty(' + item.id + ',-1)">−</button>' +
            '<span class="qty-n">' + item.qty + '</span>' +
            '<button class="qty-btn" onclick="changeQty(' + item.id + ',1)">+</button>' +
          '</div>' +
        '</div>' +
        '<button class="rm-btn" onclick="removeCart(' + item.id + ')">✕</button>' +
      '</div>'
    );
  }).join('');
  var total = cart.reduce(function (s, x) { return s + x.price * x.qty; }, 0);
  var tot = document.getElementById('cartTotal');
  if (tot) tot.textContent = '₹' + inr(total);
}

function openCart() {
  loadCart();
  renderCartDrawer();
  document.getElementById('cov').classList.add('on');
  document.getElementById('csb').classList.add('on');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  document.getElementById('cov').classList.remove('on');
  document.getElementById('csb').classList.remove('on');
  document.body.style.overflow = '';
}

function orderViaWA() {
  if (!cart.length) { showToast('Your cart is empty'); return; }
  var lines = cart.map(function (x) { return '• ' + x.name + ' × ' + x.qty + ' = ₹' + inr(x.price * x.qty); }).join('\n');
  var total = cart.reduce(function (s, x) { return s + x.price * x.qty; }, 0);
  var msg = 'Hello Kunj Mart! 👋\n\nI want to place an order:\n\n' + lines + '\n\n*Total: ₹' + inr(total) + '*\n\nPlease confirm availability. Thank you!';
  openWA(WA_PRIMARY, msg);
}

function quickOrder(id) {
  var p = allP.find(function (x) { return Number(x.id) === Number(id); });
  if (!p) return;
  var discount = Number(p.discount) || 0;
  var price    = discount > 0 ? Math.round(Number(p.price) * (1 - discount / 100)) : Number(p.price);
  var msg = 'Hello Kunj Mart! 👋\n\nI want to order:\n• *' + p.name + '*\nPrice: ₹' + inr(price) + (discount > 0 ? ' (' + discount + '% off)' : '') + '\n\nPlease confirm availability. Thank you!';
  openWA(WA_PRIMARY, msg);
}

function openWA(num, msg) {
  var a = document.createElement('a');
  a.href = 'https://wa.me/' + num + '?text=' + encodeURIComponent(msg);
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ── TOAST ─────────────────────────────────────────────────────────
var _toastT = null;
function showToast(msg) {
  var el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('on');
  clearTimeout(_toastT);
  _toastT = setTimeout(function () { el.classList.remove('on'); }, 2500);
}

// ── POLICY MODAL ──────────────────────────────────────────────────
var POLICIES = {
  privacy: {
    title: 'Privacy Policy',
    body: '<p>Kunj Mart respects your privacy. We collect only the information you provide via WhatsApp orders (name, phone, address). This data is used solely to process your order and will never be sold or shared with third parties.</p><br><p>Your phone number may be used to send order updates via WhatsApp. You can opt out at any time by messaging us.</p>'
  },
  terms: {
    title: 'Terms of Use',
    body: '<p>By using this website, you agree to place orders through WhatsApp as directed. All prices shown are inclusive of applicable taxes. Kunj Mart reserves the right to modify prices and product availability without prior notice.</p><br><p>Orders are subject to stock availability at the time of confirmation.</p>'
  },
  shipping: {
    title: 'Shipping Information',
    body: '<p>Kunj Mart currently operates as a <strong>pickup store</strong> at G.T. Road, Gopiganj, Bhadohi, UP. Customers are welcome to visit during store hours (9 AM – 9 PM daily).</p><br><p>For local delivery inquiries, please WhatsApp us at +91 9005447658. Delivery availability depends on location and order size.</p>'
  },
  returns: {
    title: 'Returns & Exchanges',
    body: '<p>We accept returns/exchanges within <strong>7 days</strong> of purchase for unused items in original condition. Grocery and perishable items are non-returnable.</p><br><p>To initiate a return, WhatsApp us with your order details and reason. We will guide you through the process promptly.</p>'
  }
};

function openPolicy(type) {
  var pol = POLICIES[type];
  if (!pol) return;
  document.getElementById('policyTitle').textContent = pol.title;
  document.getElementById('policyBody').innerHTML = pol.body;
  var ov = document.getElementById('policyOv');
  ov.classList.add('on');
  document.body.style.overflow = 'hidden';
}

function closePolicy() {
  var ov = document.getElementById('policyOv');
  if (ov) ov.classList.remove('on');
  document.body.style.overflow = '';
}

// ── NAVIGATION ────────────────────────────────────────────────────
function goTo(id) {
  var el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  // Close mobile menu
  var nl = document.getElementById('navLinks');
  var hm = document.getElementById('hamBtn');
  if (nl) nl.classList.remove('mob');
  if (hm) hm.textContent = '☰';
}

function toggleNav() {
  var nl = document.getElementById('navLinks');
  var hm = document.getElementById('hamBtn');
  if (!nl || !hm) return;
  var open = nl.classList.toggle('mob');
  hm.textContent = open ? '✕' : '☰';
}

function setupNav() {
  // Active link highlight on scroll
  var sections = ['hero','categories','products','offers','about','contact'];
  window.addEventListener('scroll', function () {
    var scrollY = window.scrollY + 80;
    var current = 'hero';
    sections.forEach(function (id) {
      var el = document.getElementById(id);
      if (el && el.offsetTop <= scrollY) current = id;
    });
    document.querySelectorAll('.nav-links a').forEach(function (a) {
      var href = a.getAttribute('data-section') || '';
      a.style.color     = href === current ? '#1A73E8' : '';
      a.style.fontWeight = href === current ? '700' : '';
    });
  }, { passive: true });
}

function setupFooter() {
  // All footer links use onclick, so no href navigation needed
  // Policy overlay close on backdrop click
  var pov = document.getElementById('policyOv');
  if (pov) pov.addEventListener('click', function (e) {
    if (e.target === pov) closePolicy();
  });
}

// ── EXPOSE GLOBALS (for inline onclick handlers) ──────────────────
window.filterCat    = filterCat;
window.setCat       = setCat;
window.applyF       = applyF;
window.openProduct  = openProduct;
window.closeProduct = closeProduct;
window.addCart      = addCart;
window.removeCart   = removeCart;
window.changeQty    = changeQty;
window.openCart     = openCart;
window.closeCart    = closeCart;
window.orderViaWA   = orderViaWA;
window.quickOrder   = quickOrder;
window.openPolicy   = openPolicy;
window.closePolicy  = closePolicy;
window.goTo = goTo;
window.toggleNav    = toggleNav;
window.showToast    = showToast;
window.renderProducts = renderProducts;
window.refreshAll     = refreshAll;
window.loadProducts   = loadProducts;
