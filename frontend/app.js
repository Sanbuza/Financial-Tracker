const API = 'http://localhost:5000';

const BUDGETS = {
  'Groceries':      700,
  'Entertainment':  300,
  'Fixed & Home':  2700,
  'Medical':        250,
  'Pets':           150,
  'Transportation': 250,
  'Others':         200,
};

const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                     'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function parseAmount(str) {
  if (!str) return 0;
  if (str.startsWith('(')) return -parseFloat(str.replace(/[($),]/g, ''));
  return parseFloat(str.replace(/[$,]/g, '')) || 0;
}

function formatForAPI(num) {
  const abs = Math.abs(num).toFixed(2);
  return num < 0 ? `($${abs})` : `$${abs}`;
}

function formatDisplay(absAmount) {
  return '$' + absAmount.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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

  const html = Object.entries(BUDGETS).map(([cat, budget]) => {
    const spent = totals[cat] || 0;
    const pct = Math.min((spent / budget) * 100, 100);
    const color = pct >= 100 ? '#C0392B' : pct >= 75 ? '#8B6000' : '#1A6B3A';
    return `
      <div class="cat-row">
        <div class="cat-header">
          <span class="cat-name">${cat}</span>
          <span class="cat-amounts">${formatDisplay(spent)} / $${budget}</span>
        </div>
        <div class="progress-track">
          <div class="progress-bar" style="width:${pct}%;background:${color}"></div>
        </div>
      </div>`;
  }).join('');

  document.getElementById('categoryList').innerHTML = html;
}

function renderTransactions(txs) {
  const el = document.getElementById('txList');
  if (!txs.length) {
    el.innerHTML = '<p class="empty">Sin transacciones recientes.</p>';
    return;
  }

  el.innerHTML = txs.map(t => {
    const amount = parseAmount(t['Amount (CAD)']);
    const isExpense = amount < 0;
    const needsReview = t['Needs Review'] === 'Yes';
    const cat = t['App Category'] || t['Raw Category'] || '';
    return `
      <div class="tx-row${needsReview ? ' needs-review' : ''}">
        <span class="tx-date">${t.Date}</span>
        ${ownerChip(t.Owner)}
        <span class="tx-merchant">${t.Merchant}</span>
        <div class="tx-right">
          <span class="tx-amount ${isExpense ? 'expense' : 'income'}">${isExpense ? '-' : '+'}${formatDisplay(Math.abs(amount))}</span>
          <span class="tx-cat">${cat}</span>
        </div>
      </div>`;
  }).join('');
}

async function loadData() {
  try {
    const res = await fetch(`${API}/api/transactions`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const now = new Date();
    document.getElementById('monthLabel').textContent = `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;

    const thisMonth = data.filter(t => isThisMonth(t.Date));
    const expenses  = thisMonth.filter(t => parseAmount(t['Amount (CAD)']) < 0);
    const total     = expenses.reduce((s, t) => s + Math.abs(parseAmount(t['Amount (CAD)'])), 0);

    document.getElementById('totalSpent').textContent = formatDisplay(total);

    renderCategories(expenses);
    renderTransactions([...data].reverse().slice(0, 20));
  } catch (err) {
    document.getElementById('totalSpent').textContent = 'Error';
    document.getElementById('txList').innerHTML =
      `<p class="empty">No se pudo conectar con el backend.<br>${err.message}</p>`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const dateInput  = document.getElementById('date');
  const submitBtn  = document.getElementById('submitBtn');
  const formMsg    = document.getElementById('formMsg');

  dateInput.value = new Date().toISOString().split('T')[0];
  loadData();

  document.getElementById('txForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    submitBtn.disabled = true;
    submitBtn.textContent = 'Guardando...';
    formMsg.textContent = '';
    formMsg.className = 'form-msg';

    const amount = parseFloat(document.getElementById('amount').value);
    const payload = {
      date:       document.getElementById('date').value,
      account:    document.getElementById('account').value || '',
      owner:      document.getElementById('owner').value,
      merchant:   document.getElementById('merchant').value,
      amount:     formatForAPI(amount),
      category:   document.getElementById('category').value,
      subcategory: '',
    };

    try {
      const res = await fetch(`${API}/api/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (result.success) {
        formMsg.textContent = `Guardado correctamente (${result.transaction_id})`;
        formMsg.className = 'form-msg success';
        e.target.reset();
        dateInput.value = new Date().toISOString().split('T')[0];
        loadData();
      } else {
        throw new Error(result.message || 'Error desconocido');
      }
    } catch (err) {
      formMsg.textContent = `Error: ${err.message}`;
      formMsg.className = 'form-msg error';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Guardar transacción';
    }
  });
});
