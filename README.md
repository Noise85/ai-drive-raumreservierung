# Raumreservierung (Room Reservation System)

> **⚠️ MVP Prototype**: This is a Minimum Viable Product (MVP) prototype developed for learning and demonstration purposes. It showcases core concepts but is not production-ready. Many features require further refinement for real-world deployment.

A modern, full-stack room reservation application built with Next.js, featuring AI-powered chat assistance, sustainability tracking, and comprehensive booking management.

## Table of Contents

- [Project Overview](#project-overview)
- [Technology Stack](#technology-stack)
- [Understanding React and Next.js](#understanding-react-and-nextjs)
- [AI-Assisted Development](#ai-assisted-development)
- [Architecture](#architecture)
- [Local Development](#local-development)
- [Docker Deployment](#docker-deployment)
- [Maintenance Guide](#maintenance-guide)
- [Learning Resources](#learning-resources)
- [Known Issues](#known-issues--areas-for-improvement)

---

## Project Overview

### Purpose

This application provides a comprehensive room reservation system for organizations, enabling:

- **Room Booking**: Search, filter, and book meeting rooms with real-time availability
- **Calendar Views**: Daily, weekly, and monthly calendar visualizations
- **AI Chat Assistant**: Natural language interface for booking queries and assistance
- **Sustainability Dashboard**: Track carbon footprint and energy consumption of bookings
- **Facility Management**: Analytics and insights for facility managers
- **Multi-language Support**: Internationalization (i18n) with English and German

### Key Features

| Feature | Description |
|---------|-------------|
| 📅 Smart Booking | Interactive calendar with conflict detection |
| 🤖 AI Assistant | Chat interface powered by OpenAI for natural language queries |
| 🌱 Sustainability | Carbon tracking and eco-friendly room suggestions |
| 📊 Analytics | Utilization charts, occupancy grids, and trend analysis |
| 🏢 Multi-building | Support for multiple buildings and room types |
| 💰 Cost Management | Pricing, chargeback, and financial reporting |
| 👥 Visitor Check-in | Self-service visitor registration |

---

## Technology Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 19** | UI component library |
| **Next.js 16** | React framework with SSR/SSG |
| **TypeScript** | Type-safe JavaScript |
| **Tailwind CSS 4** | Utility-first CSS framework |
| **Radix UI** | Accessible component primitives |
| **Recharts** | Data visualization |
| **Lucide Icons** | SVG icon library |

### Backend
| Technology | Purpose |
|------------|---------|
| **Next.js API Routes** | Serverless API endpoints |
| **PostgreSQL 16** | Relational database |
| **Neon Serverless** | Cloud-native Postgres driver |
| **Vercel AI SDK** | AI/LLM integration |

### DevOps
| Technology | Purpose |
|------------|---------|
| **Docker** | Containerization |
| **Docker Compose** | Multi-container orchestration |

---

## Understanding React and Next.js

### What is React?

**React** is a JavaScript library for building user interfaces, developed by Meta (Facebook). It revolutionized frontend development with several key concepts:

#### Component-Based Architecture
```tsx
// A React component is a reusable piece of UI
function BookingCard({ booking }) {
  return (
    <div className="card">
      <h3>{booking.title}</h3>
      <p>{booking.room}</p>
    </div>
  );
}
```

#### Virtual DOM
React maintains a lightweight copy of the actual DOM in memory. When state changes, React:
1. Creates a new virtual DOM
2. Compares it with the previous version (diffing)
3. Updates only the changed parts in the real DOM

This makes updates efficient and fast.

#### Declarative UI
Instead of imperatively manipulating DOM elements, you declare *what* the UI should look like based on state:

```tsx
// Declarative: describe the UI based on state
function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}
```

#### Hooks
React Hooks allow functional components to manage state and side effects:

```tsx
// useState: manage local state
const [rooms, setRooms] = useState([]);

// useEffect: handle side effects (API calls, subscriptions)
useEffect(() => {
  fetchRooms().then(setRooms);
}, []);

// Custom hooks: reusable logic
function useBookings(userId) {
  const [bookings, setBookings] = useState([]);
  useEffect(() => {
    bookingService.getByUser(userId).then(setBookings);
  }, [userId]);
  return bookings;
}
```

### What is Next.js?

**Next.js** is a React framework that adds production-ready features:

#### Server-Side Rendering (SSR)
Pages are rendered on the server, improving SEO and initial load time:

```tsx
// app/[locale]/rooms/page.tsx
// This component runs on the SERVER
export default async function RoomsPage() {
  const rooms = await roomService.getAll(); // Fetches data on server
  return <RoomList rooms={rooms} />;
}
```

#### Static Site Generation (SSG)
Pages can be pre-rendered at build time for maximum performance.

#### App Router (Next.js 13+)
File-based routing with nested layouts:

```
app/
├── layout.tsx          # Root layout (applied to all pages)
├── page.tsx            # Home page (/)
└── [locale]/
    ├── layout.tsx      # Locale layout
    ├── page.tsx        # Dashboard (/en, /de)
    ├── rooms/
    │   └── page.tsx    # Rooms page (/en/rooms)
    └── bookings/
        └── page.tsx    # Bookings page (/en/bookings)
```

#### Server Components vs Client Components
Next.js 13+ introduces React Server Components:

```tsx
// Server Component (default) - runs on server, no JavaScript sent to client
async function ServerComponent() {
  const data = await db.query('SELECT * FROM rooms');
  return <div>{data.map(r => <p>{r.name}</p>)}</div>;
}

// Client Component - runs in browser, can use hooks and interactivity
'use client';
function ClientComponent() {
  const [open, setOpen] = useState(false);
  return <button onClick={() => setOpen(!open)}>Toggle</button>;
}
```

#### API Routes
Backend endpoints within the same project:

```tsx
// app/api/bookings/route.ts
export async function GET(request: Request) {
  const bookings = await bookingService.getAll();
  return Response.json(bookings);
}

export async function POST(request: Request) {
  const body = await request.json();
  const booking = await bookingService.create(body);
  return Response.json(booking, { status: 201 });
}
```

---

## AI-Assisted Development

### Development Approach

This project was developed using **AI-assisted coding techniques** with GitHub Copilot and conversational AI tools. This modern development approach combines:

1. **Requirements Engineering (RE)** - Breaking down features into clear, specific requirements
2. **AI Code Generation** - Using AI to generate boilerplate, components, and logic
3. **Iterative Refinement** - Reviewing, testing, and improving AI-generated code
4. **Human Oversight** - Ensuring code quality, security, and best practices

### How AI Was Used

| Area | AI Contribution |
|------|-----------------|
| **Component Generation** | UI components from descriptions |
| **Database Schema** | SQL schema design from requirements |
| **API Endpoints** | CRUD operations and validation |
| **Styling** | Tailwind CSS classes and responsive design |
| **Documentation** | README, comments, and type definitions |
| **Bug Fixing** | Identifying and resolving issues |
| **Refactoring** | Architecture improvements (services, repositories) |

### Best Practices for AI-Assisted Development

1. **Clear Requirements**: Provide specific, detailed descriptions
2. **Incremental Development**: Build features step-by-step
3. **Review Generated Code**: Always understand what was generated
4. **Test Thoroughly**: AI-generated code still needs testing
5. **Version Control**: Commit frequently to track changes
6. **Documentation**: Document design decisions and architectural choices

### Example Workflow

```
User: "Create a booking form component with date picker, 
       room selector, and validation"

AI: Generates component with:
    - React Hook Form for form state
    - Zod for validation schema
    - React Day Picker for dates
    - Radix Select for room dropdown
    - Error handling and submission logic

User: Reviews, tests, and refines the component
```

---

## Architecture

### Three-Layer Architecture

This project follows a clean three-layer architecture:

```
┌─────────────────────────────────────┐
│           Pages / API Routes        │  ← Presentation Layer
│     (app/[locale]/*, app/api/*)     │
├─────────────────────────────────────┤
│             Services                │  ← Business Logic Layer
│         (lib/services/*)            │
├─────────────────────────────────────┤
│           Repositories              │  ← Data Access Layer
│       (lib/repositories/*)          │
├─────────────────────────────────────┤
│            Database                 │  ← PostgreSQL
└─────────────────────────────────────┘
```

### Directory Structure

```
├── app/                    # Next.js App Router
│   ├── [locale]/           # Internationalized routes
│   │   ├── admin/          # Admin pages
│   │   ├── bookings/       # Booking management
│   │   ├── rooms/          # Room browsing
│   │   └── ...
│   └── api/                # API endpoints
├── components/             # React components
│   ├── ui/                 # Reusable UI primitives
│   ├── bookings/           # Booking-specific components
│   ├── layout/             # Layout components (header, sidebar)
│   └── ...
├── lib/                    # Shared utilities
│   ├── services/           # Business logic
│   ├── repositories/       # Data access
│   └── i18n/               # Internationalization
├── scripts/                # Database scripts
│   ├── 001-schema.sql      # Database schema
│   └── 002-seed.sql        # Seed data
└── public/                 # Static assets
```

---

## Local Development

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- [Node.js](https://nodejs.org/) v20 or later
- npm or pnpm package manager

### Quick Start

#### 1. Clone and Install

```bash
git clone <repository-url>
cd ai-drive-raumreservierung

# Install dependencies
npm install
```

#### 2. Start the Database

```bash
# Start PostgreSQL container
docker compose up db -d

# Verify it's running
docker compose ps
```

The database will be automatically initialized with schema and seed data.

#### 3. Configure Environment

Create a `.env.local` file:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/raumreservierung
OPENAI_API_KEY=your-api-key-here  # Optional, for AI chat
```

#### 4. Run Development Server

```bash
npm run dev
```

Access the app at [http://localhost:3000](http://localhost:3000)

### Database Management

```bash
# View logs
docker compose logs -f db

# Connect to database
docker exec -it raumreservierung-db psql -U postgres -d raumreservierung

# Reset database (delete all data)
docker compose down -v
docker compose up db -d
```

---

## Docker Deployment

### Production Build

The project includes a multi-stage Dockerfile optimized for production:

```bash
# Build and run both app and database
docker compose up --build

# Run in detached mode
docker compose up --build -d
```

Access the app at [http://localhost:8080](http://localhost:8080)

### Docker Architecture

```
┌─────────────────────────────────────────────┐
│              Docker Compose                 │
├────────────────────┬────────────────────────┤
│   app (Next.js)    │   db (PostgreSQL)      │
│   Port: 8080:3000  │   Port: 5432:5432      │
│   Node 22 Alpine   │   Postgres 16 Alpine   │
└────────────────────┴────────────────────────┘
```

### Multi-Stage Build

The Dockerfile uses three stages for optimal image size (~100MB):

1. **deps**: Install npm dependencies
2. **builder**: Build Next.js with `output: 'standalone'`
3. **runner**: Minimal production image with only necessary files

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `NODE_ENV` | Environment mode | `production` |
| `OPENAI_API_KEY` | OpenAI API key for chat | Optional |

---

## Maintenance Guide

### Updating Dependencies

```bash
# Check for outdated packages
npm outdated

# Update all dependencies
npm update

# Update specific package
npm install package-name@latest
```

### Database Migrations

For schema changes:

1. Create a new migration file: `scripts/003-migration-name.sql`
2. Run manually or rebuild the container:

```bash
docker exec -i raumreservierung-db psql -U postgres -d raumreservierung < scripts/003-migration-name.sql
```

### Monitoring & Logs

```bash
# Application logs
docker logs raumreservierung-app -f

# Database logs
docker logs raumreservierung-db -f

# All services
docker compose logs -f
```

### Backup & Restore

```bash
# Backup database
docker exec raumreservierung-db pg_dump -U postgres raumreservierung > backup.sql

# Restore database
docker exec -i raumreservierung-db psql -U postgres -d raumreservierung < backup.sql
```

### Health Checks

```bash
# Check container status
docker compose ps

# Test API endpoint
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/en

# Database connectivity
docker exec raumreservierung-db pg_isready -U postgres
```

---

## Learning Resources

### React & Next.js

- [React Documentation](https://react.dev/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Next.js Learn Course](https://nextjs.org/learn)
- [React Hooks Explained](https://react.dev/reference/react)

### TypeScript

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [TypeScript with React](https://react.dev/learn/typescript)

### Tailwind CSS

- [Tailwind Documentation](https://tailwindcss.com/docs)
- [Tailwind UI Components](https://tailwindui.com/)

### PostgreSQL

- [PostgreSQL Tutorial](https://www.postgresqltutorial.com/)
- [SQL Fundamentals](https://www.postgresql.org/docs/current/tutorial.html)

### Docker

- [Docker Getting Started](https://docs.docker.com/get-started/)
- [Docker Compose Guide](https://docs.docker.com/compose/)

### AI-Assisted Development

- [GitHub Copilot Documentation](https://docs.github.com/en/copilot)
- [Prompt Engineering Guide](https://platform.openai.com/docs/guides/prompt-engineering)

---

## Known Issues & Areas for Improvement

The following areas are known to have issues or need further development:

### Calendar View

| Issue | Description | Priority |
|-------|-------------|----------|
| Event overlap display | Overlapping events in daily/weekly view may not stack perfectly in all edge cases | Medium |
| Long event titles | Event titles may truncate inconsistently across different view modes | Low |
| Mobile responsiveness | Calendar views need optimization for smaller screens | Medium |

### AI Chat Assistant

| Issue | Description | Priority |
|-------|-------------|----------|
| **Poor UX/Interaction** | The hands-free/voice interaction experience needs significant improvement for seamless no-hands operation | **Critical** |
| Response consistency | AI responses may occasionally be inconsistent or miss context from previous messages | High |
| Booking action failures | Natural language booking commands may fail to parse complex requests | Medium |
| Session persistence | Chat history may not persist across page refreshes | Low |
| Rate limiting | No built-in handling for OpenAI API rate limits | Medium |
| Feedback loop | No visual/audio confirmation when AI processes commands | High |

### General

| Issue | Description | Priority |
|-------|-------------|----------|
| Error handling | Some edge cases lack user-friendly error messages | Medium |
| Offline support | No offline/PWA capabilities | Low |
| Performance | Large booking datasets may slow calendar rendering | Medium |

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -m "Add my feature"`
4. Push to branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## License

This project is for educational purposes. See LICENSE file for details.

---

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)
- AI assistance from [GitHub Copilot](https://github.com/features/copilot)
