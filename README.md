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

Au demarrage, FastAPI cree automatiquement l'admin par defaut si son identifiant n'existe pas encore.

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

## Deploiement

### Backend et PostgreSQL sur Render

Le fichier `render.yaml` decrit l'API et la base PostgreSQL.

1. Pousser le projet sur GitHub.
2. Dans Render, choisir `New > Blueprint`, connecter le depot et selectionner `render.yaml`.
3. Renseigner `DEFAULT_ADMIN_PASSWORD` avec un mot de passe fort.
4. Renseigner provisoirement `BACKEND_CORS_ORIGINS` avec l'URL Vercel attendue, par exemple `https://spcr.vercel.app`.
5. Lancer la creation du Blueprint.

Render injecte `DATABASE_URL`, applique `alembic upgrade head`, demarre FastAPI et cree l'admin au premier demarrage. Une fois deploye, verifier :

```text
https://spcr-api.onrender.com/health
https://spcr-api.onrender.com/docs
```

Le sous-domaine exact peut differer s'il est deja utilise.

### Frontend sur Vercel

1. Dans Vercel, importer le meme depot GitHub.
2. Choisir `frontend` comme Root Directory.
3. Conserver le framework Vite, la commande `npm run build` et le dossier de sortie `dist`.
4. Ajouter la variable de production :

```text
VITE_API_URL=https://URL-DU-BACKEND.onrender.com/api/v1
```

5. Deployer le frontend.
6. Copier l'URL Vercel finale dans `BACKEND_CORS_ORIGINS` sur Render, sans slash final, puis redeployer l'API.

Pour autoriser aussi le developpement local :

```text
BACKEND_CORS_ORIGINS=https://URL-VERCEL.vercel.app,http://localhost:5173,http://127.0.0.1:5173
```

Ne jamais ajouter `.env`, le mot de passe PostgreSQL, le mot de passe admin ou `SECRET_KEY` dans Git.
