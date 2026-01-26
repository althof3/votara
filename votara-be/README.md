# Votara Backend

Backend API untuk aplikasi voting Farcaster - Votara.

## Tech Stack

- **Node.js** v22+
- **TypeScript** 5.3+
- **Express.js** - Web framework
- **Viem** - Ethereum library
- **Winston** - Logging
- **Zod** - Schema validation

## Getting Started

### Prerequisites

- Node.js v22 atau lebih tinggi
- npm, yarn, atau pnpm

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env file dengan konfigurasi Anda
```

### Development

```bash
# Run development server dengan hot reload
npm run dev
```

Server akan berjalan di `http://localhost:3001`

### Build

```bash
# Build untuk production
npm run build

# Run production build
npm start
```

### Scripts

- `npm run dev` - Jalankan development server dengan hot reload
- `npm run build` - Build TypeScript ke JavaScript
- `npm start` - Jalankan production server
- `npm run lint` - Lint code dengan ESLint
- `npm run format` - Format code dengan Prettier
- `npm run type-check` - Check TypeScript types

## API Endpoints

### Health Check
- `GET /health` - Check server status

### Votes
- `GET /api/votes` - Get all votes
- `GET /api/votes/:id` - Get vote by ID
- `POST /api/votes` - Create new vote
- `POST /api/votes/:id/cast` - Cast a vote
- `GET /api/votes/:id/results` - Get vote results

## Project Structure

```
votara-be/
├── src/
│   ├── config/         # Configuration files
│   ├── controllers/    # Request handlers
│   ├── middleware/     # Express middleware
│   ├── models/         # Data models
│   ├── routes/         # API routes
│   ├── utils/          # Utility functions
│   └── index.ts        # Application entry point
├── dist/               # Compiled JavaScript (generated)
├── logs/               # Log files (generated)
└── package.json
```

## Environment Variables

Lihat `.env.example` untuk daftar lengkap environment variables yang tersedia.

## License

MIT

