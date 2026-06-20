# 🛠 SESSION 4 — Finance Tracker Build Runbook
## Instrucciones para Claude Code · Santiago & Carolina

---

## CÓMO USAR ESTE ARCHIVO

Este archivo es el guión de construcción de la sesión. Se ejecuta en orden,
bloque a bloque, sincronizado con el deck de presentación.

- Los bloques marcados `[PROMPT → Claude Code]` son los mensajes que se escriben
  directamente en Claude Code (terminal con Antigravity).
- Los bloques marcados `[Terminal]` son comandos que Santiago ejecuta en su
  terminal, separada de Claude Code.
- Los `[Checkpoint]` son validaciones antes de avanzar al siguiente bloque.

**Regla de oro:** si algo no funciona, nunca editar el código a mano.
Describir el problema en un nuevo prompt a Claude Code.

---

## SETUP INICIAL (antes de empezar)

**Verificar que Claude Code está corriendo:**

```bash
# En la terminal de Santiago
antigravity  # o el comando configurado en su máquina
```

**Verificar que Python y pip están instalados:**

```bash
python --version    # debe ser 3.9+
pip --version
```

---

## BLOQUE 1 — Setup del proyecto + GitHub
### ⏱ 15 minutos

---

### 1.1 · Crear la carpeta del proyecto

**[Terminal]**

```bash
mkdir finance-tracker
cd finance-tracker
git init
code .
```

> `code .` abre VS Code en esa carpeta. Si no funciona, abrir VS Code
> manualmente y abrir la carpeta desde File → Open Folder.

---

### 1.2 · Crear el CLAUDE.md

Crear un archivo llamado `CLAUDE.md` en la raíz del proyecto con el
siguiente contenido exacto:

```markdown
# Finance Tracker — Santiago & Carolina

## Propósito
App personal de finanzas. Guarda gastos en Google Sheets y los muestra
en un dashboard en el browser. Dos usuarios: Santiago y Carolina.

## Stack
- Backend: Python 3 + Flask
- Storage: Google Sheets API v4 (gspread)
- Frontend: HTML + CSS + JavaScript vanilla
- Auth: ninguna por ahora (localhost)

## Estructura de carpetas
finance-tracker/
├── CLAUDE.md
├── README.md
├── .gitignore
├── backend/
│   ├── app.py
│   ├── credentials.json   ← NO va a GitHub
│   └── requirements.txt
└── frontend/
    ├── index.html
    ├── styles.css
    └── app.js

## Google Sheets
- Sheet name: "Finance Tracker"
- Tab: Raw_Transactions — columnas: Date, Account, Owner, Merchant,
  Amount (CAD), Transaction ID, Raw Category, App Category,
  App Subcategory, Needs Review
- Credenciales en backend/credentials.json (Service Account)

## Categorías de gastos
Groceries | Entertainment | Fixed & Home | Medical | Pets |
Transportation | Others

## Dueños de transacciones
- Santiago → mostrar avatar chip "S"
- Carolina → mostrar avatar chip "C"
- Joint → mostrar avatar chip compartido

## Colores UI
- Verde: positivo, on track, bajo presupuesto
- Ámbar: atención, cerca del límite
- Rojo: sobre presupuesto — usar con moderación
- Neutral: gris oscuro / blanco para UI estándar

## Tipografía
- Preferida: Inter o DM Sans (Google Fonts)
- Números: tabular figures para alineación

## Diseño
- Mobile-first (390px base)
- El dashboard responde una pregunta en 5 segundos:
  ¿cómo vamos este mes?
- Clean y confiable — no flashy
```

---

### 1.3 · Crear .gitignore

Crear un archivo `.gitignore` en la raíz:

```
# Google Sheets credentials — NUNCA subir
backend/credentials.json
backend/*.json

# Python
__pycache__/
*.pyc
*.pyo
.env
venv/
.venv/

# Editors
.vscode/
.idea/
*.swp
.DS_Store
```

---

### 1.4 · Primer prompt a Claude Code

**[PROMPT → Claude Code]**

```
Read the CLAUDE.md in this project first.

Create the full folder structure for the Finance Tracker:
- backend/ with app.py (empty), requirements.txt (empty)
- frontend/ with index.html (empty), styles.css (empty), app.js (empty)
- README.md with a brief description of the project

Do not write any code yet — just create the files with the correct structure.
Confirm when done and explain what each folder is for in one sentence each.
```

---

### 1.5 · Vincular con GitHub

**[Terminal]**

```bash
# Primero: crear el repo en github.com/new (vacío, sin README)
# Luego:

git add .
git commit -m "init: finance tracker + CLAUDE.md + estructura de carpetas"
git remote add origin https://github.com/TU-USUARIO/finance-tracker.git
git push -u origin main
```

> **Verificar:** ir a github.com y confirmar que el commit aparece.
> El `credentials.json` NO debe aparecer (está en .gitignore).

---

### ✅ Checkpoint 1

- [ ] Carpeta `finance-tracker/` creada con la estructura completa
- [ ] `CLAUDE.md` escrito y guardado
- [ ] `.gitignore` incluye `credentials.json`
- [ ] Primer commit visible en GitHub

---

## BLOQUE 2 — Google Sheets como backend
### ⏱ 20 minutos

---

### 2.1 · Configurar Google Cloud Console

Pasos manuales (Santiago los hace en el browser):

**Paso 1:** Ir a [console.cloud.google.com](https://console.cloud.google.com)
→ Crear nuevo proyecto → Nombre: `finance-tracker`

**Paso 2:** APIs y servicios → Biblioteca
→ Buscar "Google Sheets API" → Habilitar

**Paso 3:** IAM y Admin → Cuentas de servicio → Crear cuenta de servicio
→ Nombre: `finance-tracker-bot` → Rol: Editor → Listo

**Paso 4:** Seleccionar la cuenta creada → Claves → Agregar clave → JSON
→ Descargar → Guardar como `credentials.json` en la carpeta `backend/`

**Paso 5:** Copiar el email de la cuenta de servicio
(formato: `finance-tracker-bot@proyecto.iam.gserviceaccount.com`)
→ Abrir el Google Sheet "Finance Tracker"
→ Compartir con ese email como **Editor**

> ⚠️ El `credentials.json` está en `.gitignore`. Nunca hacer commit de ese archivo.

---

### 2.2 · Verificar conexión con Python

**[PROMPT → Claude Code]**

```
Read the CLAUDE.md first.

Write a quick connection test in backend/test_connection.py.
The script should:
1. Connect to Google Sheets using gspread and credentials.json
2. Open the sheet named "Finance Tracker"
3. Print the names of all tabs found
4. Print "Connection OK" if successful

Also add to backend/requirements.txt:
flask
flask-cors
gspread
google-auth
```

**[Terminal]**

```bash
cd backend
pip install flask flask-cors gspread google-auth
python test_connection.py
```

> **Esperado:** debe imprimir los nombres de los tabs y "Connection OK".
> Si hay error, copiarlo y pasarlo a Claude Code como nuevo prompt.

**Commit:**

```bash
git add .
git commit -m "feat: google sheets connection verified"
```

---

### ✅ Checkpoint 2

- [ ] `credentials.json` en `backend/` (y NO en GitHub)
- [ ] Sheet "Finance Tracker" compartido con el service account
- [ ] `python test_connection.py` imprime "Connection OK"
- [ ] `requirements.txt` tiene las 4 dependencias

---

## BLOQUE 3 — Backend Flask
### ⏱ 25 minutos

---

### 3.1 · Construir el servidor Flask

**[PROMPT → Claude Code]**

```
Read the CLAUDE.md first.

Build the Flask backend in backend/app.py.
I need two endpoints:

POST /api/transactions
  - Receives: { date, account, owner, merchant, amount, category,
    subcategory, description }
  - Saves the transaction to the "Raw_Transactions" tab in the
    Google Sheet named "Finance Tracker"
  - Assigns a Transaction ID (format: TXN-001, TXN-002, etc.,
    auto-incrementing based on existing rows)
  - Sets "Needs Review" to "No" by default, "Yes" if category
    is "Others"
  - Returns: { success: true, transaction_id }

GET /api/transactions
  - Returns all rows from "Raw_Transactions" as a JSON array
  - Each object has all column names as keys

Use gspread with credentials.json for the Sheets connection.
Use flask-cors to allow requests from the frontend.
Add plain English comments explaining what each section does.
```

---

### 3.2 · Ejecutar el backend

**[Terminal]**

```bash
cd backend
python app.py
```

**Verificar en el browser:**

```
http://localhost:5000/api/transactions
```

> **Esperado:** `[]` (lista vacía — aún no hay datos).

**Commit:**

```bash
git add .
git commit -m "feat: flask backend with POST and GET /api/transactions"
```

---

### ✅ Checkpoint 3

- [ ] `python app.py` corre sin errores
- [ ] `GET localhost:5000/api/transactions` devuelve `[]`
- [ ] No hay errores de credenciales en la terminal

---

## BLOQUE 4 — Frontend: el dashboard
### ⏱ 30 minutos

---

### 4.1 · Construir el dashboard HTML

**[PROMPT → Claude Code]**

```
Read the CLAUDE.md first. The Flask backend is running at localhost:5000.

Now build the frontend in frontend/index.html, styles.css, and app.js.

I need:

1. A form to add a new transaction with these fields:
   - Date (date picker, defaults to today)
   - Amount in CAD (number input, positive = income, negative = expense)
   - Category (dropdown): Groceries, Entertainment, Fixed & Home,
     Medical, Pets, Transportation, Others
   - Merchant / Description (text input)
   - Owner (dropdown): Santiago, Carolina, Joint

2. A spending summary section showing:
   - Total spent this month (expenses only, as a large number)
   - A breakdown by category: category name + total amount +
     a progress bar (green if under budget, amber if approaching,
     red only if over budget — use red very sparingly)

3. A recent transactions list showing the last 20 transactions:
   - Each row: date | "S" or "C" avatar chip | merchant | amount |
     category
   - Rows with "Needs Review: Yes" get a subtle amber highlight

Design rules from CLAUDE.md:
- Import Inter from Google Fonts
- Mobile-first: base width 390px, max-width 640px centered
- Color system: green #1A6B3A, amber #8B6000, red only when needed
- Clean and trustworthy — no flashy animations or decorations
- The page must work by opening index.html directly in a browser
  (no server needed for the frontend)
```

**[Terminal]** — abrir en el browser:

```bash
open frontend/index.html   # macOS
# o arrastrar el archivo al browser
```

---

### 4.2 · Iteración — ajustar categorías y colores

**[PROMPT → Claude Code]**

```
The frontend looks good. Three adjustments:

1. The category dropdown must match EXACTLY what's in CLAUDE.md:
   Groceries, Entertainment, Fixed & Home, Medical, Pets,
   Transportation, Others
   (in that exact order)

2. The progress bar per category in the spending summary should use
   these monthly budgets as the reference:
   Groceries $700 | Entertainment $300 | Fixed & Home $2700 |
   Medical $250 | Pets $150 | Transportation $250 | Others $200

3. The "S" and "C" avatar chips should be colored:
   S = navy blue (#0F2D6B) | C = a warm teal (#0D7377)
   Both with white text. Joint = light gray with dark text.

Keep the same layout — only update these specific elements.
```

**Commit:**

```bash
git add .
git commit -m "feat: frontend dashboard with form, spending summary, transactions list"
```

---

### 4.3 · Prueba en vivo

Ingresar 3 transacciones de prueba desde el formulario:

| Merchant | Amount | Category | Owner |
|---|---|---|---|
| No Frills | -87.43 | Groceries | Santiago |
| TTC Monthly | -158.00 | Transportation | Carolina |
| Netflix | -23.99 | Entertainment | Santiago |

**Verificar:** abrir Google Sheets → tab `Raw_Transactions` → las 3 filas deben aparecer.

---

### ✅ Checkpoint 4

- [ ] Formulario funciona y guarda en Google Sheets
- [ ] El resumen por categoría se actualiza al recargar la página
- [ ] La lista de transacciones recientes muestra las 3 entradas
- [ ] Los datos aparecen en el tab `Raw_Transactions` del Sheet

---

## BLOQUE 5 — Cierre
### ⏱ 20 minutos

---

### 5.1 · Commit final

**[Terminal]**

```bash
git add .
git commit -m "feat: MVP completo — Flask backend + Google Sheets + Dashboard HTML"
git push
```

**Verificar en GitHub** que todos los cambios están subidos.

---

### 5.2 · Resumen de archivos del proyecto

Al final de la sesión, el proyecto debe tener:

```
finance-tracker/
├── CLAUDE.md                    ✅
├── README.md                    ✅
├── .gitignore                   ✅
├── backend/
│   ├── app.py                   ✅ servidor Flask
│   ├── test_connection.py       ✅ script de prueba
│   ├── requirements.txt         ✅ dependencias
│   └── credentials.json         ✅ (local, NO en GitHub)
└── frontend/
    ├── index.html               ✅ dashboard
    ├── styles.css               ✅ estilos
    └── app.js                   ✅ lógica frontend
```

---

### 5.3 · Cómo deployar en Railway (próxima sesión)

> No ejecutar hoy — solo revisar para que Santiago sepa qué viene.

1. Ir a [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Seleccionar el repo `finance-tracker`
3. Railway detecta Flask automáticamente
4. Agregar la variable de entorno `GOOGLE_CREDENTIALS` con el contenido del JSON
5. Deploy → URL pública en ~3 minutos

---

### ✅ Checkpoint Final

- [ ] Proyecto completo en GitHub con historial de commits por bloque
- [ ] Backend Flask corriendo en `localhost:5000`
- [ ] Frontend abierto en el browser con datos reales
- [ ] Google Sheets `Raw_Transactions` tiene las transacciones de prueba
- [ ] Santiago puede ingresar un gasto nuevo por su cuenta sin ayuda

---

## ROADMAP — Próximas sesiones

| Sesión | Tema | Lo que se construye |
|---|---|---|
| S5 | Google Sheets avanzado | Categorización automática, filtros por mes, tab Savings_Goals conectado |
| S6 | Autenticación | Login para Santiago y Carolina (Firebase Auth o similar) |
| S7 | Savings + Vacation Tracker | Metas de ahorro, trip planner con imagen de destino (Unsplash API) |
| S8 | Deploy + pulido | Railway — URL pública que se abre desde el celular |

---

## COMANDOS GIT DE REFERENCIA RÁPIDA

```bash
git status              # ¿qué cambió desde el último commit?
git add .               # preparar todos los cambios
git add archivo.py      # preparar un archivo específico
git commit -m "msg"     # guardar una foto del código
git push                # subir a GitHub
git log --oneline       # ver el historial resumido
git diff                # ver los cambios exactos
```

---

*Finance Tracker — Santiago & Carolina · Sesión 4 · Junio 2025*
