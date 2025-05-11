# Succinct Feedback Backend

Este es el backend Express.js para manejar las ideas, votos y verificación de roles desde Discord para la dApp Succinct Feedback.

## Requisitos

- Node.js 18+
- `.env` con las siguientes claves:
  - `ROLES_API_KEY`
  - `DISCORD_CLIENT_ID`
  - `DISCORD_CLIENT_SECRET`
  - `DISCORD_REDIRECT_URI`

## Uso

```bash
npm install
node app.js
```

El servidor se inicia en `http://localhost:3000`.
