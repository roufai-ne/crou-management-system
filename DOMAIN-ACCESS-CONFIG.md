# Configuration d'accès par nom de domaine

## Résumé des modifications effectuées

### 1. Configuration Backend (✅ Fait)

**Fichier: `apps/api/src/config/cors.config.ts`**
- Ajout de `https://crou.mesrit.com` et `http://crou.mesrit.com` dans les origines autorisées
- Ajout des variantes avec `www.`

**Fichier: `.env` (racine)**
- Mise à jour de `ALLOWED_ORIGINS` pour inclure le domaine
- Le backend écoute déjà sur `0.0.0.0:3001` (toutes les interfaces)

### 2. Configuration Frontend

**Fichier: `apps/web/.env`**
Actuellement configuré pour : `http://localhost:3001/api`

**Fichier: `apps/web/vite.config.ts`**
- Proxy configuré pour `/api` vers `http://localhost:3001`
- `allowedHosts` inclut déjà `crou.mesrit.com`

## Instructions pour utiliser un nom de domaine

### Option 1: Accès direct au backend (Recommandé pour production)

1. **Configurer le DNS**
   - Pointer `crou.mesrit.com` vers l'IP du serveur
   - Pointer `api.crou.mesrit.com` (sous-domaine API) vers la même IP

2. **Mettre à jour `.env` du frontend**
   ```bash
   # Remplacer dans apps/web/.env
   VITE_API_URL=http://crou.mesrit.com:3001/api
   # OU si vous avez un sous-domaine API
   VITE_API_URL=http://api.crou.mesrit.com/api
   ```

3. **Redémarrer le frontend**
   ```bash
   cd apps/web
   npm run dev
   ```

### Option 2: Utiliser un reverse proxy (Recommandé pour production)

#### Avec Nginx

1. **Installer Nginx** (si pas déjà fait)
   ```bash
   # Windows (via Chocolatey)
   choco install nginx
   
   # Linux
   sudo apt install nginx
   ```

2. **Configurer Nginx** (`/etc/nginx/sites-available/crou` ou `C:\nginx\conf\nginx.conf`)
   ```nginx
   # Configuration pour crou.mesrit.com
   server {
       listen 80;
       server_name crou.mesrit.com;

       # Frontend (React/Vite)
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }

       # API Backend
       location /api {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

3. **Activer et redémarrer Nginx**
   ```bash
   # Linux
   sudo ln -s /etc/nginx/sites-available/crou /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   
   # Windows
   nginx -s reload
   ```

4. **Laisser l'API sur localhost dans `.env`**
   ```bash
   # apps/web/.env
   VITE_API_URL=http://localhost:3001/api
   ```
   Le proxy Nginx s'occupera de router les requêtes.

### Option 3: Développement local avec nom de domaine

1. **Modifier le fichier hosts**
   ```bash
   # Windows: C:\Windows\System32\drivers\etc\hosts
   # Linux/Mac: /etc/hosts
   
   # Ajouter cette ligne
   127.0.0.1    crou.mesrit.com
   ```

2. **Mettre à jour `.env` du frontend**
   ```bash
   # apps/web/.env
   VITE_API_URL=http://crou.mesrit.com:3001/api
   ```

3. **Redémarrer le frontend**
   ```bash
   cd apps/web
   npm run dev
   ```

4. **Accéder à l'application**
   - Frontend: `http://crou.mesrit.com:3000`
   - Backend: `http://crou.mesrit.com:3001/api`

## Configuration actuelle

### Backend (Port 3001)
- ✅ Écoute sur `0.0.0.0:3001` (toutes interfaces)
- ✅ CORS configuré pour `crou.mesrit.com`
- ✅ ALLOWED_ORIGINS inclut le domaine
- ✅ Prêt pour accès par nom de domaine

### Frontend (Port 3000)
- ⚠️ Actuellement configuré pour `localhost:3001`
- 🔧 À modifier selon l'option choisie ci-dessus

## Vérification

Pour vérifier que tout fonctionne :

1. **Tester le backend directement**
   ```bash
   curl http://crou.mesrit.com:3001/api/health
   # OU
   curl http://localhost:3001/api/health
   ```

2. **Tester depuis le frontend**
   - Ouvrir la console navigateur (F12)
   - Vérifier les requêtes dans l'onglet Network
   - Les URLs doivent correspondre à `VITE_API_URL`

3. **Vérifier les CORS**
   ```bash
   curl -H "Origin: http://crou.mesrit.com" \
        -H "Access-Control-Request-Method: GET" \
        -H "Access-Control-Request-Headers: Authorization" \
        -X OPTIONS \
        http://localhost:3001/api/health -v
   ```

## Troubleshooting

### Erreur CORS
- Vérifier que le domaine est dans `ALLOWED_ORIGINS` (`.env` racine)
- Vérifier `apps/api/src/config/cors.config.ts`
- Redémarrer le backend après modification

### Connexion refusée
- Vérifier que le backend écoute sur `0.0.0.0` et non `localhost`
- Vérifier le firewall (autoriser port 3001)
- Vérifier le DNS (ping crou.mesrit.com)

### 404 Not Found
- Vérifier l'URL complète avec `/api` à la fin
- Vérifier que `VITE_API_URL` est correct dans `apps/web/.env`

## Production (HTTPS)

Pour la production avec HTTPS :

1. **Obtenir un certificat SSL** (Let's Encrypt)
   ```bash
   sudo certbot --nginx -d crou.mesrit.com
   ```

2. **Mettre à jour les URLs**
   ```bash
   # apps/web/.env
   VITE_API_URL=https://crou.mesrit.com/api
   ```

3. **Nginx configurera automatiquement HTTPS**

## Recommandation finale

Pour un environnement de développement :
- **Option 3** : Modifier le fichier hosts (simple, rapide)

Pour un environnement de production :
- **Option 2** : Nginx reverse proxy (professionnel, sécurisé, performant)

Les configurations CORS et backend sont déjà prêtes ! 🎉
