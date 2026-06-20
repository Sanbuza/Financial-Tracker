// Mismo origen: Flask sirve este archivo, las llamadas API van al mismo host.
const API_BASE = "";

const BUDGETS = {
  Groceries: 700, Entertainment: 300, "Fixed & Home": 2700,
  Medical: 250, Pets: 150, Transportation: 250, Others: 200,
};
const CATEGORY_ORDER = ["Groceries","Entertainment","Fixed & Home","Medical","Pets","Transportation","Others"];
const SAVINGS_GOALS = [
  { name: "Fondo de vacaciones", target: 5000, match: "Vacation Fund" },
];
const DONUT_COLORS = ["#7b61ff","#9b87ff","#b9abff","#c9bdff","#d9d0ff","#6a4ef0","#8f7bf5"];

function formatCAD(v) {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(v);
}
function moneyParts(v) {
  const full = formatCAD(v);
  const i = full.lastIndexOf(".");
  return i === -1 ? { int: full, cents: "" } : { int: full.slice(0, i), cents: full.slice(i) };
}
function parseAmount(raw) {
  if (typeof raw === "number") return raw;
  const s = String(raw).trim();
  const negative = s.includes("(") || s.startsWith("-");
  const n = parseFloat(s.replace(/[^0-9.]/g, ""));
  return (Number.isFinite(n) ? n : 0) * (negative ? -1 : 1);
}
function formatDate(raw) { return String(raw || "").slice(0, 10); }
function monthKey(t) { return formatDate(t["Date"]).slice(0, 7); }
function avatarFor(owner) {
  if (owner === "Santiago") return { cls: "s", text: "S" };
  if (owner === "Carolina") return { cls: "c", text: "C" };
  return { cls: "joint", text: "J" };
}
function amt(t) { return parseAmount(t["Amount (CAD)"]); }
function cat(t) { return t["App Category"] || t["Raw Category"] || ""; }
function todayISO() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

// KPIs
function setKpi(id, value) {
  const { int, cents } = moneyParts(value);
  document.getElementById(id).innerHTML = `${int}<span class="cents">${cents}</span>`;
}
function renderKpis(txns) {
  const income  = txns.filter(t => amt(t) > 0).reduce((s,t) => s + amt(t), 0);
  const expense = txns.filter(t => amt(t) < 0).reduce((s,t) => s + Math.abs(amt(t)), 0);
  const savings = txns.filter(t => cat(t) === "Savings").reduce((s,t) => s + amt(t), 0);
  setKpi("kpi-balance",  income - expense);
  setKpi("kpi-income",   income);
  setKpi("kpi-expense",  expense);
  setKpi("kpi-savings",  savings);
  renderDeltas(txns);
}
function renderDeltas(txns) {
  const months = [...new Set(txns.map(t => monthKey(t)))].sort();
  const cells = { "kpi-balance-delta":"","kpi-income-delta":"","kpi-expense-delta":"","kpi-savings-delta":"" };
  if (months.length >= 2) {
    const cur = months[months.length - 1], prev = months[months.length - 2];
    const sum = (m, pred) => txns.filter(t => monthKey(t) === m && pred(t)).reduce((s,t) => s + Math.abs(amt(t)), 0);
    const pct = (a, b) => b === 0 ? null : ((a - b) / b) * 100;
    const badge = p => {
      if (p === null) return "";
      const dir = p >= 0 ? "up" : "down", arrow = p >= 0 ? "▲" : "▼";
      return `<span class="${dir}">${arrow} ${Math.abs(p).toFixed(1)}%</span> vs mes anterior`;
    };
    cells["kpi-income-delta"]  = badge(pct(sum(cur, t => amt(t) > 0), sum(prev, t => amt(t) > 0)));
    cells["kpi-expense-delta"] = badge(pct(sum(cur, t => amt(t) < 0), sum(prev, t => amt(t) < 0)));
  } else {
    cells["kpi-balance-delta"] = "Datos de un solo período";
  }
  for (const [id, html] of Object.entries(cells)) document.getElementById(id).innerHTML = html;
}

// Charts
let flowChart, budgetChart;
function renderFlow(txns) {
  const months = [...new Set(txns.map(t => monthKey(t)))].sort();
  const income  = months.map(m => txns.filter(t => monthKey(t) === m && amt(t) > 0).reduce((s,t) => s + amt(t), 0));
  const expense = months.map(m => txns.filter(t => monthKey(t) === m && amt(t) < 0).reduce((s,t) => s + Math.abs(amt(t)), 0));
  const ctx = document.getElementById("flow-chart");
  if (flowChart) flowChart.destroy();
  flowChart = new Chart(ctx, {
    type: "bar",
    data: { labels: months, datasets: [
      { label:"Ingresos", data:income,  backgroundColor:"#7b61ff", borderRadius:6, maxBarThickness:26 },
      { label:"Gastos",   data:expense, backgroundColor:"#c9bdff", borderRadius:6, maxBarThickness:26 },
    ]},
    options: { responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{ display:false } },
      scales:{
        x:{ grid:{ display:false }, ticks:{ color:"#9a99b3" } },
        y:{ grid:{ color:"rgba(154,153,179,0.15)" }, ticks:{ color:"#9a99b3", callback: v => "$"+v.toLocaleString() } },
      },
    },
  });
}
function renderBudget(txns) {
  const byCat = {};
  for (const c of CATEGORY_ORDER) byCat[c] = 0;
  for (const t of txns) { if (amt(t) < 0 && cat(t) in byCat) byCat[cat(t)] += Math.abs(amt(t)); }
  const entries = CATEGORY_ORDER.map(c => [c, byCat[c]]).filter(([,v]) => v > 0);
  const total = entries.reduce((s,[,v]) => s + v, 0);
  document.getElementById("budget-total").textContent = formatCAD(total);
  const ctx = document.getElementById("budget-chart");
  if (budgetChart) budgetChart.destroy();
  budgetChart = new Chart(ctx, {
    type:"doughnut",
    data:{ labels: entries.map(([c]) => c), datasets:[{ data: entries.map(([,v]) => v), backgroundColor:DONUT_COLORS, borderWidth:0, cutout:"72%" }] },
    options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false } } },
  });
  document.getElementById("budget-legend").innerHTML = entries.map(([c,v],i) =>
    `<li><i class="dot" style="background:${DONUT_COLORS[i % DONUT_COLORS.length]}"></i>${c}<span class="legend-amt">${formatCAD(v)}</span></li>`
  ).join("");
}

// Transactions
function renderTransactions(txns) {
  const tbody = document.getElementById("txn-rows");
  if (!txns.length) { tbody.innerHTML = '<tr><td colspan="5" class="empty">Sin transacciones.</td></tr>'; return; }
  tbody.innerHTML = txns.slice(-8).reverse().map(t => {
    const a = amt(t), isIncome = a > 0;
    const { cls, text } = avatarFor(t["Owner"]);
    const flag = String(t["Needs Review"]).toLowerCase() === "yes" ? '<span class="review-flag"></span>' : "";
    return `<tr>
      <td>${formatDate(t["Date"])}</td>
      <td class="${isIncome ? "amt-income" : "amt-expense"}">${formatCAD(a)}</td>
      <td><span class="txn-name"><span class="avatar ${cls}">${text}</span>${t["Merchant"]||"—"}${flag}</span></td>
      <td>${t["Account"]||"—"}</td>
      <td><span class="pill">${cat(t)}</span></td>
    </tr>`;
  }).join("");
}

// Goals
function renderGoals(txns) {
  document.getElementById("goals-list").innerHTML = SAVINGS_GOALS.map(g => {
    const saved = txns.filter(t => cat(t) === "Savings" && t["App Subcategory"] === g.match).reduce((s,t) => s + amt(t), 0);
    const pct = g.target > 0 ? Math.min((saved / g.target) * 100, 100) : 0;
    return `<li>
      <div class="goal-top"><span>${g.name}</span><span class="goal-target">${formatCAD(g.target)}</span></div>
      <div class="goal-bar"><div class="goal-bar-fill" style="width:${pct}%"></div></div>
      <div class="goal-pct">${formatCAD(saved)} ahorrados · ${pct.toFixed(0)}%</div>
    </li>`;
  }).join("");
}

function renderPeriod(txns) {
  const months = [...new Set(txns.map(t => monthKey(t)))].sort();
  document.getElementById("period-label").textContent =
    months.length === 0 ? "Sin datos" :
    months.length === 1 ? months[0] :
    `${months[0]} – ${months[months.length-1]}`;
}

// Load
async function loadData() {
  try {
    const res = await fetch(`${API_BASE}/api/transactions`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const txns = await res.json();
    renderPeriod(txns);
    renderKpis(txns);
    renderFlow(txns);
    renderBudget(txns);
    renderTransactions(txns);
    renderGoals(txns);
  } catch (err) {
    document.getElementById("txn-rows").innerHTML =
      '<tr><td colspan="5" class="empty">No se pudo conectar con el backend.</td></tr>';
    console.error(err);
  }
}

// Modal + form
let tipoActual = "gasto";
const modal = document.getElementById("modal");

function openModal() {
  document.getElementById("date").value = todayISO();
  document.getElementById("form-status").textContent = "";
  document.getElementById("form-status").className = "form-status";
  modal.hidden = false;
}
function closeModal() { modal.hidden = true; }

document.getElementById("open-form").addEventListener("click", openModal);
document.getElementById("close-form").addEventListener("click", closeModal);
modal.addEventListener("click", e => { if (e.target === modal) closeModal(); });

document.querySelectorAll(".tipo-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tipo-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    tipoActual = btn.dataset.tipo;
  });
});

document.getElementById("transaction-form").addEventListener("submit", async e => {
  e.preventDefault();
  const btn = document.getElementById("submit-btn");
  const status = document.getElementById("form-status");
  const absAmount = Math.abs(parseFloat(document.getElementById("amount").value));
  const apiAmount = tipoActual === "gasto" ? -absAmount : absAmount;

  btn.disabled = true;
  status.className = "form-status";
  status.textContent = "Guardando…";

  const payload = {
    date:        document.getElementById("date").value,
    amount:      apiAmount,
    category:    document.getElementById("category").value,
    merchant:    document.getElementById("merchant").value,
    account:     document.getElementById("account").value,
    owner:       document.getElementById("owner").value,
    subcategory: "",
  };

  try {
    const res = await fetch(`${API_BASE}/api/transactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await res.json();
    if (result.success) {
      status.className = "form-status ok";
      status.textContent = `Guardado ✓ (${result.transaction_id})`;
      e.target.reset();
      tipoActual = "gasto";
      document.querySelectorAll(".tipo-btn").forEach(b => b.classList.toggle("active", b.dataset.tipo === "gasto"));
      await loadData();
      setTimeout(closeModal, 800);
    } else {
      throw new Error(result.error || "respuesta sin éxito");
    }
  } catch (err) {
    status.className = "form-status error";
    status.textContent = "Error al guardar. Revisá que el backend esté corriendo.";
    console.error(err);
  } finally {
    btn.disabled = false;
  }
});

document.getElementById("theme-toggle").addEventListener("click", () => {
  const html = document.documentElement;
  html.setAttribute("data-theme", html.getAttribute("data-theme") === "dark" ? "light" : "dark");
});

loadData();
