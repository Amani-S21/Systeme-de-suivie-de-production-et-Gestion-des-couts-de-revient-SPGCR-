# SPCR - Suivi de Production et Gestion des Couts de Revient

Application decoupee en deux parties :

- `backend/` : API FastAPI, PostgreSQL, SQLAlchemy, Alembic, JWT, roles et permissions.
- `frontend/` : interface React/Vite reprenant le design du dashboard SPCR.

## Prerequis

- Python 3.11+
- Node.js 20+
- PostgreSQL

## Configuration

Copier `.example.env` vers `.env`, puis remplacer les valeurs PostgreSQL et admin.

Le fichier `.env` est ignore par Git. Il contient notamment :

- `DATABASE_URL`
- `SECRET_KEY`
- `DEFAULT_ADMIN_EMAIL`
- `DEFAULT_ADMIN_PASSWORD`
- `VITE_API_URL`

## Backend FastAPI

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r backend\requirements.txt
cd backend
alembic upgrade head
uvicorn app.main:app --reload
```

Au demarrage, FastAPI cree automatiquement l'admin par defaut si son email n'existe pas encore.

API locale : `http://localhost:8000`

Documentation FastAPI : `http://localhost:8000/docs`

## Frontend React

```bash
cd frontend
npm install
npm run dev
```

Interface locale : `http://localhost:5173`

## Roles

- `admin` : acces complet, utilisateurs, parametres, couts, production.
- `responsable` : production, matieres premieres, produits, couts, rapports.
- `operateur` : tableau de bord et production.

## Migrations

Les tables PostgreSQL sont creees par Alembic depuis :

```text
backend/migrations/versions/202606170001_initial_schema.py
```

Pour appliquer les migrations :

```bash
npm run migrate
```
