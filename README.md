# Beilen Bonnen

A vibe-coded project to keep tabs on who pays what during our holiday. Scan (large) receipts with AI (TabScanner implementation) and automatically fill in who wants to pay for it.

## Running the project (with Docker Compose)

Make sure to create a `.env` file with the following properties:
 - TABSCANNER_API_KEY (used to convert photos of receipts to items)
 - CLOUDFLARE_TUNNEL_TOKEN (used to connect automatically to a Cloudflare Tunnel to quickly host the project)

Then, with Docker installed, run

```bash
docker compose up
```

## Screenshots

### Overview
![Overview screenshot](/screenshots/overview.png?raw=true "Overview")

### Receipts
![Receipts screenshot](/screenshots/receipts.png?raw=true "Receipts")

### Atone
![Atone screenshot](/screenshots/atone.png?raw=true "Atone")

### Afrekening
![Afrekening screenshot](/screenshots/afrekening.png?raw=true "Afrekening")