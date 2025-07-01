# Nuntius Feed

## ***"Your personal herald for the digital age."***

<details>
<summary>

### Demo Screenshots

</summary> 

Landing Page:
![Admin Landing Page][Admin Landing Page]

Subscribed Feeds:
![Subscribed Feeds][Subscribed Feeds]

Single Feed:
![Single Feed][Single Feed]

All Articles:
![All Articles][All Articles]

Favorite Articles:
![Favorite Articles][Favorite Articles]

Admin Dashboard:
![Admin Dash1][Admin Dash1]
![Admin Dash2][Admin Dash2]

[Admin Landing Page]: ./screenshots/admin_landing.png "Admin Landing Page"
[Subscribed Feeds]: ./screenshots/sub_feeds.png "Subscribed Feeds"
[Single Feed]: ./screenshots/single_feed.png "Single Feed"
[All Articles]: ./screenshots/all_articles.png "All Articles"
[Favorite Articles]: ./screenshots/fav_articles.png "Favorite Articles"
[Admin Dash1]: ./screenshots/admin_dash1.png "Admin Dash1"
[Admin Dash2]: ./screenshots/admin_dash2.png "Admin Dash2"

...and many more!
  
</details>

<hr>

A lightweight web application for subscribing to and reading RSS and Atom feeds.
Built with Next.js (frontend), Hono (backend via RPC) and secured with JSON Web Tokens (JWT).

## ✨ Features
### 🧑 Accounts & Authentication
- Credential auth flow
- JWT with access and refresh tokens with silent refresh
- Admin accounts which can add new and refresh existing RSS and Atom feed on demand

### 📚 RSS & Atom feeds
- A curated list of predefined feeds available to all users
- Feed and items allow and parse all specifications of Atom and RSS standards
- Users can subscribe to or unsubscribe from available feeds
- Users can add or remove articles from favorites
- OPML subscriptions export & import
- Each user can manage their personal list of subscribed feeds
- Channel items are cached and stored in MongoDB for efficient delivery
- Periodic background refresh of channel items (e.g. every 30 minutes)

## Environment Configuration
To generate secure ``JWT_SIGNING_SECRET`` and ``JWT_ENCRYPTION_SECRET`` values, use the following command in your terminal:

```bash
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

Run the command twice and assign the first output to ``JWT_SIGNING_SECRET``, and the second to ``JWT_ENCRYPTION_SECRET``.

Example ``.env`` file:
```ini
NEXT_PUBLIC_APP_URL=http://localhost:3006
JWT_SIGNING_SECRET=your_generated_signing_secret
JWT_ENCRYPTION_SECRET=your_generated_encryption_secret
APP_URL=
APP_LAN=
```

## Production

Check ``docker-compose.prod.yaml``, modify ENVs there and run:

```bash
docker compose -f docker-compose.prod.yaml up
```

## Access + Refresh token

> This is practical implementation of token-based authentication described in my blog post here:
> https://witoldzawada.dev/blog/jwt-vs-session 

The application uses a dual-token strategy for authentication.  
The Next.js frontend seamlessly and automatically refreshes the `access_token` when a `401 Unauthorized` HTTP response is encountered.  
The Hono backend — integrated as Next.js API Routes — handles all application-level API logic.

Below are the technical details of the implementation:

### 🔑 Access Token

- **Purpose:** Used to authenticate API requests
- **Algorithm:** Signed with ``HS256``
- **Header:** 
```json
{
    "alg": "HS256",
    "typ": "JWT"
}
```
- **Payload:** 
```json
{
    "sub": "user_id",
    "name": "Username",
    "email": "useremail@example.com",
    "role": "user or admin",
    "jti": "random_token_id",
    "iat": 1712345678,
    "exp": 1712349278
}
```

``role`` is used only for displaying UI. Admin privileges are validated separately using database.

- **Storage:** Sent as a ``HttpOnly`` cookie named ``access_token``
- **Expiry:** Short-lived (e.g., 5 minutes)

### 🔐 Refresh Token

- **Purpose:** Used to obtain a new ``access_token`` when the current one expires
- **Algorithm:** Encrypted using ``A256GCM`` (``alg: "dir", enc: "A256GCM"``).
- **Header:** 
```json
{
    "alg": "dir",
    "enc": "A256GCM"
}
```
- **Payload:** 
```json
{
    "sub": "user_id",
    "jti": "random_token_id",
    "iat": 1712345678,
    "exp": 1714937678
}
```
- **Storage:** Sent as a ``HttpOnly`` cookie named ``refresh_token``
- **Expiry:** Long-lived (e.g., 30 days)

## 🔐 Security Notes
- Common cookie options include:
    - ``httpOnly: true``
    - ``sameSite: Strict``
    - ``path: '/'``
    - ``secure: true (for production)/false (for development)``
- Refresh tokens are encrypted to prevent visibility and tampering.
- Access tokens are signed and contain user identification data for fast verification without DB access.
- On token refresh, the access token is re-issued, and the refresh token remains valid until expiry or logout.