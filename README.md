<div align="center">

<p>

  [![Next.js](https://img.shields.io/badge/Next.js-black?logo=next.js&logoColor=white)](#)
  [![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=fff)](#)
  [![Cloudflare](https://img.shields.io/badge/Cloudflare-F38020?logo=Cloudflare&logoColor=white)](#)

  [![v0](https://img.shields.io/badge/v0-000?logo=v0&logoColor=fff)](#)
  [![ChatGPT](https://custom-icon-badges.demolab.com/badge/ChatGPT-74aa9c?logo=openai&logoColor=white)](#)
  [![Claude](https://img.shields.io/badge/Claude-D97757?logo=claude&logoColor=fff)](#)
  [![Cursor](https://img.shields.io/badge/Cursor-000000?logo=cursor)](#)
  
</p>

# 🧾 Beilen Bonnen

**AI-powered holiday expense tracking with automatic receipt scanning and bill splitting.**

Keeping track of shared expenses during a group holiday usually starts with good intentions and ends with a pile of receipts and confused math.

Beilen Bonnen was built to automate the tedious parts: scan receipts, assign purchases, and always know who owes what.
Turn photos of supermarket receipts into structured items, assign purchases to people, and keep track of who owes what throughout your trip.

</div>

---

## ✨ Features

- 🤖 **AI receipt scanning** using TabScanner
- 🧾 Supports **large supermarket receipts**
- 👥 Assign individual receipt items to different people
- 💰 Automatically calculate balances and settlements
- 📊 Clear overview of shared expenses
- 🐳 Docker Compose setup for quick deployment
- 🌍 Optional Cloudflare Tunnel integration for instant remote access

---

## 🚀 Getting Started

### Prerequisites

- Docker
- Docker Compose
- A TabScanner API key
- (Optional) A Cloudflare Tunnel token

### Configuration

Create a `.env` file in the project root:

```env
TABSCANNER_API_KEY=your_api_key
CLOUDFLARE_TUNNEL_TOKEN=your_tunnel_token
```

| Variable | Required | Description |
|----------|:--------:|-------------|
| `TABSCANNER_API_KEY` | ✅ | API key used to convert receipt photos into structured line items. |
| `CLOUDFLARE_TUNNEL_TOKEN` | ❌ | Automatically exposes the application through a Cloudflare Tunnel. |

### Run

```bash
docker compose up
```

Once the containers have started, open the application in your browser at `localhost:3000`.

---

## 📸 Screenshots

<table>
<tr>
<td width="50%">

### Overview
<img src="screenshots/overview.png" alt="Overview">

</td>
<td width="50%">

### Receipts
<img src="screenshots/receipts.png" alt="Receipts">

</td>
</tr>

<tr>
<td width="50%">

### Atone
<img src="screenshots/atone.png" alt="Atone">

</td>
<td width="50%">

### Settlement
<img src="screenshots/afrekening.png" alt="Settlement">

</td>
</tr>
</table>

---

<div align="center">

Made with ❤️ for stress-free group holidays.

</div>