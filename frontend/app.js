const API = 'http://127.0.0.1:5000';

const BUDGETS = {
  'Groceries':      700,
  'Entertainment':  300,
  'Fixed & Home':  2700,
  'Medical':        250,
  'Pets':           150,
  'Transportation': 250,
  'Others':         200,
};

const MONTH_NAMES = ['Ene','Feb','Mar','Abr','May','Jun',
                     'Jul','Ago','Sep','Oct','Nov','Dic'];

// Convierte el valor del Sheet (número o string con formato) a float
function parseAmount(val) {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return val;
  const s = String(val).trim();
  if (s.startsWith('(')) return -parseFloat(s.replace(/[($),]/g, ''));
  return parseFloat(s.replace(/[$,]/g, '')) || 0;
}

// Formatea un número absoluto como currency para mostrar: "$87.43"
function fmt(abs) {
  return '$' + Math.abs(abs).toLocaleString('en-CA', {
    minimumFractionDigits: 2, maximumFractionDigits: 2
  });
}

// Formatea para enviar al API según el doc: gastos "($45.00)", ingresos "$500.00"
function toApiAmount(absNum, tipo) {
  const s = Math.abs(absNum).toFixed(2);
  return tipo === 'gasto' ? `($${s})` : `$${s}`;
}

// Fecha corta: "2025-06-01" → "1 Jun"
function shortDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;
}

function isThisMonth(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

function ownerChip(owner) {
  if (owner === 'Santiago') return '<span class="chip chip-s">S</span>';
  if (owner === 'Carolina')  return '<span class="chip chip-c">C</span>';
  return '<span class="chip chip-j">J</span>';
}

function renderCategories(expenses) {
  const totals = {};
  for (const t of expenses) {
    const cat = t['App Category'] || t['Raw Category'] || 'Others';
    totals[cat] = (totals[cat] || 0) + Math.abs(parseAmount(t['Amount (CAD)']));
  }

  document.getElementById('categoryList').innerHTML = Object.entries(BUDGETS).map(([cat, budget]) => {
    const spent = totals[cat] || 0;
    const pct   = Math.min((spent / budget) * 100, 100);
    const color = pct >= 100 ? '#B91C1C' : pct >= 75 ? '#8B6000' : '#1A6B3A';
    return `
      <div class="cat-row">
        <div class="cat-header">
          <span class="cat-name">${cat}</span>
          <span class="cat-amounts">${fmt(spent)} <span class="cat-sep">/</span> $${budget}</span>
        </div>
        <div class="progress-track">
          <div class="progress-bar" style="width:${pct}%;background:${color}"></div>
        </div>
      </div>`;
  }).join('');
}

function renderTransactions(txs) {
  const el = document.getElementById('txList');
  if (!txs.length) {
    el.innerHTML = '<p class="empty">Sin transacciones recientes.</p>';
    return;
  }
  el.innerHTML = txs.map(t => {
    const amount     = parseAmount(t['Amount (CAD)']);
    const isExpense  = amount < 0;
    const needsReview = t['Needs Review'] === 'Yes';
    const cat        = t['App Category'] || t['Raw Category'] || '';
    return `
      <div class="tx-row${needsReview ? ' needs-review' : ''}">
        <span class="tx-date">${shortDate(t.Date)}</span>
        ${ownerChip(t.Owner)}
        <div class="tx-mid">
          <span class="tx-merchant">${t.Merchant}</span>
          <span class="tx-cat">${cat}</span>
        </div>
        <span class="tx-amount ${isExpense ? 'expense' : 'income'}">
          ${isExpense ? '-' : '+'}${fmt(Math.abs(amount))}
        </span>
      </div>`;
  }).join('');
}

async function loadData() {
  try {
    const res = await fetch(`${API}/api/transactions`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const now = new Date();
    document.getElementById('monthLabel').textContent =
      `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;

    const thisMonth = data.filter(t => isThisMonth(t.Date));
    const expenses  = thisMonth.filter(t => parseAmount(t['Amount (CAD)']) < 0);
    const total     = expenses.reduce((s, t) => s + Math.abs(parseAmount(t['Amount (CAD)'])), 0);

    document.getElementById('totalSpent').textContent = fmt(total);
    renderCategories(expenses);
    renderTransactions([...data].reverse().slice(0, 20));
  } catch (err) {
    document.getElementById('totalSpent').textContent = '—';
    document.getElementById('categoryList').innerHTML =
      `<p class="empty">Error conectando con el backend.<br><small>${err.message}</small></p>`;
    document.getElementById('txList').innerHTML =
      `<p class="empty">Asegúrate de que el backend está corriendo:<br><code>python backend/app.py</code></p>`;
  }
}

// ── Tipo toggle ──────────────────────────────────────────────
let tipoActual = 'gasto';

document.addEventListener('DOMContentLoaded', () => {
  const dateInput = document.getElementById('date');
  dateInput.value = new Date().toISOString().split('T')[0];

  // Tipo toggle
  document.querySelectorAll('.tipo-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tipo-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      tipoActual = btn.dataset.tipo;
    });
  });

  loadData();

  // ── Submit ───────────────────────────────────────────────
  document.getElementById('txForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn    = document.getElementById('submitBtn');
    const msgEl  = document.getElementById('formMsg');
    btn.disabled = true;
    btn.textContent = 'Guardando...';
    msgEl.textContent = '';
    msgEl.className   = 'form-msg';

    const absAmount = Math.abs(parseFloat(document.getElementById('amount').value));
    const payload = {
      date:        document.getElementById('date').value,
      account:     document.getElementById('account').value,
      owner:       document.getElementById('owner').value,
      merchant:    document.getElementById('merchant').value,
      amount:      toApiAmount(absAmount, tipoActual),
      category:    document.getElementById('category').value,
      subcategory: '',
    };

    try {
      const res = await fetch(`${API}/api/transactions`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });
      const result = await res.json();
      if (result.success) {
        msgEl.textContent = `Guardado en Sheets (${result.transaction_id})`;
        msgEl.className   = 'form-msg success';
        e.target.reset();
        dateInput.value = new Date().toISOString().split('T')[0];
        tipoActual = 'gasto';
        document.querySelectorAll('.tipo-btn').forEach(b =>
          b.classList.toggle('active', b.dataset.tipo === 'gasto'));
        loadData();
      } else {
        throw new Error(result.message || 'Error desconocido');
      }
    } catch (err) {
      msgEl.textContent = `Error: ${err.message}`;
      msgEl.className   = 'form-msg error';
    } finally {
      btn.disabled    = false;
      btn.textContent = 'Guardar transacción';
    }
  });
});
