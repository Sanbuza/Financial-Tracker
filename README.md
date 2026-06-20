# Finance Tracker — Santiago & Carolina

App personal de finanzas que guarda gastos en Google Sheets y los visualiza en un dashboard web.

## Stack
- **Backend:** Python 3 + Flask
- **Storage:** Google Sheets API v4 via gspread
- **Frontend:** HTML + CSS + JavaScript vanilla

## Cómo correr

```bash
cd backend
pip install -r requirements.txt
python app.py
```

Luego abrir `frontend/index.html` en el browser.

## Estructura
- `backend/` — servidor Flask con endpoints `/api/transactions`
- `frontend/` — dashboard HTML/CSS/JS (corre directo en el browser)
- `backend/credentials.json` — credenciales de Google (local, NO en GitHub)
