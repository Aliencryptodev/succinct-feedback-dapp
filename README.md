# Succinct Feedback DApp (Cards Version)

This is a community feedback application built for the Succinct ecosystem. It uses Discord OAuth and role-based access to allow:
- 📝 Submitting zk-verified improvement ideas (with `Let's pruv it` role)
- 🗳 Voting and ranking (via SP1)
- 🎨 Displaying the leaderboard as interactive cards

## 🧩 Features
- Zero-knowledge proof submission via SP1
- Role-based idea submission (Discord roles)
- Real-time leaderboard with votes
- Frontend styled with Succinct's official color palette

## 📂 Structure
```
public/
├── index.html        ← Full landing with login + cards leaderboard
```

## 🚀 Deployment
You can deploy this easily on [Vercel](https://vercel.com/) by uploading the `/public` folder.

Make sure your backend (SP1 + API) is running separately on a VPS.

## 🔐 Roles
- `Let's pruv it` → Can submit ideas
- `Proof of verify` → Can vote

Built with ❤️ by the Succinct community.


## 🐳 Docker Setup

You can run the backend server using Docker:

```bash
make start       # Build and start the backend
make stop        # Stop the container
make restart     # Restart the container
make logs        # View live logs
make clean       # Remove containers and volumes
```

Make sure to create a `.env` file inside `/server` based on `.env.example`.

Access the frontend at your deployed Vercel URL and backend at `http://localhost:3000`.

---
Built with ❤️ and SP1 zkVM by the Succinct community.
