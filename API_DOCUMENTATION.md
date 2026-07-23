# 📡 Documentation Technique & Spécification API - VIU CINEMA (Android TV App)

Ce document récapitule la spécification d'intégration légère entre l'application **VIU CINEMA (Android TV)** et le **Backend VIU PANEL / Supabase**.

---

## 🔒 Principes d'Architecture & Sécurité

1. **Aucun identifiant Xtream sur l'Application Client** :
   - L'application client ne possède jamais les identifiants ni les mots de passe des serveurs Xtream.
   - Le backend VIU PANEL joue le rôle de proxy sécurisé et relaie les demandes de contenu en temps réel.

2. **Authentification par Code à 8 Chiffres & Token JWT** :
   - L'utilisateur entre simplement son **code d'abonnement à 8 chiffres** (ex: `84729104`).
   - Le backend valide le code dans Supabase, active la session et renvoie un **Jeton JWT Client (`client_token`)** valide pour la durée de l'abonnement.
   - Toutes les requêtes ultérieures utilisent l'en-tête HTTP standard : `Authorization: Bearer <client_token>`.

3. **Filtrage Dynamique des Catégories** :
   - Les catégories masquées dans le panneau (`hidden = true`) sont automatiquement filtrées côté serveur.
   - L'ordre configuré dans le panneau (`sort_order`) est appliqué sur la liste des catégories transmises à l'application.

---

## 🛠️ Collection Postman prêtes au téléchargement

Vous pouvez télécharger directement la collection Postman officielle v2.1 de votre backend à l'adresse suivante :
`GET http://votre-serveur-panel/api/app/postman-collection`

---

## 1. 🔑 Endpoint d'Authentification / Activation App

Vérifie le code à 8 chiffres, l'active au premier accès (ou reconnecte une session active) et délivre le token JWT client.

- **URL** : `POST /api/app/login`  *(Alias : `POST /api/app/activate`)*
- **Headers** : `Content-Type: application/json`

### 📥 Corps de la requête (Request Body)
```json
{
  "code": "84729104",
  "device_id": "AndroidTV_LivingRoom_01",
  "device_name": "Xiaomi TV Box S 2nd Gen"
}
```

### 📤 Réponse de succès (HTTP 200 OK)
```json
{
  "success": true,
  "message": "Connexion réussie",
  "status": "Active",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjb2RlIjoiODQ3MjkxMDQiLCJzdWJfaWQiOiJzdWJfMTcz...",
  "code": "84729104",
  "client_name": "Client VIP TV",
  "username": "viu_847291",
  "activated_at": "2026-07-22T09:45:00.000Z",
  "expires_at": "2027-07-22T09:45:00.000Z",
  "device_id": "AndroidTV_LivingRoom_01"
}
```

### ❌ Exemples de réponses d'erreur :
- **Code inexistant (HTTP 404)** :
  ```json
  { "success": false, "error": "Code d'abonnement invalide ou introuvable." }
  ```
- **Abonnement Expiré (HTTP 401)** :
  ```json
  { "success": false, "error": "Ce code d'abonnement est expiré. Veuillez contacter votre revendeur pour le renouveler." }
  ```

---

## 2. 📁 Endpoint des Catégories (Filtrées & Ordonnées)

Renvoie la liste des catégories autorisées, débarrassée des catégories masquées (`hidden = true`) et triée selon l'ordre personnalisé (`sort_order`).

- **URL** : `GET /api/app/categories` *(ou `GET /api/app/content/categories`)*
- **Headers** : `Authorization: Bearer <client_token>`
- **Paramètres Query (Optionnel)** :
  - `server_id` : `movies` | `series` | `shahid` | `all` (par défaut: `all`)

### 📥 Exemple de requête cURL
```bash
curl -X GET "http://votre-serveur/api/app/categories?server_id=movies" \
  -H "Authorization: Bearer <client_token>"
```

### 📤 Réponse HTTP 200 OK
```json
{
  "success": true,
  "total": 3,
  "categories": [
    {
      "id": "cat_1",
      "name": "Nouveautés Cinema 2026",
      "order": 1,
      "server_id": "movies",
      "hidden": false
    },
    {
      "id": "cat_2",
      "name": "Action & Thrillers 4K",
      "order": 2,
      "server_id": "movies",
      "hidden": false
    },
    {
      "id": "cat_3",
      "name": "Comédie & Familial",
      "order": 3,
      "server_id": "movies",
      "hidden": false
    }
  ]
}
```

---

## 3. 🎬 Endpoint Proxy Contenu (Films / Séries / Shahid)

Relaye les requêtes de contenu Xtream en temps réel de manière sécurisée.

- **URL** : `GET /api/app/content/:type`
  - `:type` = `movies` (Server 1) | `series` (Server 2) | `shahid` (Server 3)
- **Headers** : `Authorization: Bearer <client_token>`
- **Paramètres Query (Optionnels)** :
  - `action` :
    - Pour `movies` : `get_vod_streams` (défaut), `get_vod_categories`, `get_vod_info`
    - Pour `series` / `shahid` : `get_series` (défaut), `get_series_categories`, `get_series_info`
  - `category_id` : ID de catégorie spécifique
  - `vod_id` / `series_id` : ID pour les détails d'un titre spécifique

### 📥 Exemple pour récupérer le catalogue de Films
`GET /api/app/content/movies?action=get_vod_streams`

### 📤 Réponse HTTP 200 OK
```json
{
  "success": true,
  "server": "movies",
  "action": "get_vod_streams",
  "count": 2,
  "data": [
    {
      "num": 1,
      "name": "Avatar 3 : Fire and Ash (2026) 4K",
      "stream_id": 98401,
      "stream_type": "movie",
      "category_id": "1",
      "container_extension": "mp4",
      "rating": "8.9",
      "cover": "https://image.tmdb.org/t/p/w500/sample.jpg"
    }
  ]
}
```

---

## 💻 Exemple d'Intégration Kotlin / Android TV (Retrofit / OkHttp)

```kotlin
interface ViuCinemaApiService {

    // 1. Authentification
    @POST("api/app/login")
    suspend fun loginWithCode(
        @Body request: LoginRequest
    ): Response<LoginResponse>

    // 2. Obtenir les catégories filtrées
    @GET("api/app/categories")
    suspend fun getCategories(
        @Header("Authorization") token: String,
        @Query("server_id") serverId: String = "movies"
    ): Response<CategoriesResponse>

    // 3. Obtenir le contenu des films / séries
    @GET("api/app/content/{type}")
    suspend fun getContentProxy(
        @Header("Authorization") token: String,
        @Path("type") type: String,
        @Query("action") action: String = "get_vod_streams",
        @Query("category_id") categoryId: String? = null
    ): Response<ContentProxyResponse>
}

data class LoginRequest(
    val code: String,
    val device_id: String = "AndroidTV"
)

data class LoginResponse(
    val success: Boolean,
    val token: String?,
    val status: String?,
    val expires_at: String?,
    val error: String?
)
```
