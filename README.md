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
- [Contributing](#contributing)

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

### From Requirements to Implementation (Example Workflow)

The key to successful AI-assisted development is **quality Requirements Engineering (RE)**. Well-documented requirements enable AI to generate accurate, complete code.

> **⚠️ Important: Tailor RE Techniques to Your Project**
> 
> Requirements Engineering is not one-size-fits-all. Each project demands a tailored approach:
> 
> | RE Phase | Considerations |
> |----------|----------------|
> | **Elicitation** | Interviews, workshops, prototypes — choose based on stakeholder availability and domain complexity |
> | **Analysis** | Use cases, user stories, formal specs — match formality to project criticality |
> | **Documentation** | Lightweight markdown vs. formal SRS — scale to team size and regulatory needs |
> | **Validation** | Reviews, walkthroughs, acceptance tests — align with project risk profile |
> 
> The example below demonstrates a **medium/low-formality approach** suitable for this small size MVP. For larger enterprise systems, consider more rigorous documentation (SRS, traceability matrices). For quick prototypes, even lighter documentation may suffice.

#### Step 1: Define Use Cases with Scenarios

Start by identifying use cases and documenting all possible paths through the system:

```markdown
## UC-007: Book a Meeting Room

### Overview
| Attribute | Value |
|-----------|-------|
| **Actor** | Building Occupant (Employee) |
| **Goal** | Reserve a meeting room for a specific date/time |
| **Preconditions** | User is authenticated, at least one room exists |
| **Postconditions** | Booking is created, room is reserved, user receives confirmation |
| **Trigger** | User clicks "New Booking" or navigates to booking form |

---

### Main Success Scenario (Happy Path)

| Step | Actor Action | System Response |
|------|--------------|-----------------|
| 1 | User opens booking form | System displays form with today's date pre-selected |
| 2 | User selects date | System loads available time slots for that date |
| 3 | User selects start/end time | System filters rooms available for that time range |
| 4 | User selects a room | System displays room details (capacity, amenities) |
| 5 | User enters meeting title | System validates title (3-100 chars) |
| 6 | User enters attendee count | System validates against room capacity |
| 7 | User clicks "Book Room" | System creates booking, shows success toast |
| 8 | — | System redirects to booking confirmation |

---

### Alternative Flows

**AF-1: User changes date after selecting room**
- At step 4, user changes date
- System clears room selection
- Flow continues from step 2

**AF-2: User cancels booking**
- At any step, user clicks "Cancel"
- System discards form data
- User returns to previous page

---

### Exception Flows (Failure Paths)

**EF-1: No rooms available**
- At step 3, no rooms match criteria
- System displays: "No rooms available for selected time"
- System suggests: nearby time slots with availability

**EF-2: Attendee count exceeds capacity**
- At step 6, attendeeCount > room.capacity
- System displays inline error: "Attendee count exceeds room capacity (max: N)"
- Form does not submit, field is highlighted

**EF-3: Scheduling conflict detected**
- At step 7, another booking exists for same room/time
- System displays: "Conflict detected with existing booking"
- System highlights conflicting time slots on calendar
- System offers alternative rooms or times

**EF-4: Network/server error**
- At step 7, API call fails
- System displays: "Unable to complete booking. Please try again."
- Form data is preserved, user can retry

---

### Edge Cases

| Edge Case | Expected Behavior |
|-----------|-------------------|
| Booking spans midnight | System rejects: "Booking must end same day" |
| Start time = End time | System rejects: "End time must be after start time" |
| Booking in the past | Date picker disables past dates |
| Room deleted mid-booking | System shows error: "Room no longer available" |
| Concurrent booking (race) | First submission wins, second gets conflict error |
| Session expires during form | Redirect to login, preserve form in sessionStorage |
```

#### Step 2: Write User Stories Bounded to Use Cases

Each user story maps to specific use case flows:

```markdown
## User Stories for UC-007

### US-042: Basic Room Booking (Happy Path)
**As a** building occupant  
**I want to** book a meeting room through an intuitive form  
**So that** I can reserve space for my meetings quickly and accurately

**Covers:** UC-007 Main Success Scenario (Steps 1-8)

---

### US-043: Room Availability Feedback (EF-1)
**As a** building occupant  
**I want to** see alternative options when my preferred time is unavailable  
**So that** I can quickly find a suitable room without starting over

**Covers:** UC-007 Exception Flow EF-1

---

### US-044: Capacity Validation (EF-2)
**As a** building occupant  
**I want to** be warned if my attendee count exceeds room capacity  
**So that** I don't book an inadequate space

**Covers:** UC-007 Exception Flow EF-2

---

### US-045: Conflict Resolution (EF-3)
**As a** building occupant  
**I want to** see conflicting bookings and alternatives  
**So that** I can resolve scheduling issues without frustration

**Covers:** UC-007 Exception Flow EF-3
```

#### Step 3: Define Acceptance Criteria per User Story

```markdown
## US-042: Basic Room Booking - Acceptance Criteria

**AC-042.1: Form Initialization**
- GIVEN I navigate to the booking form
- WHEN the page loads
- THEN date should default to today
- AND time fields should be empty
- AND room selector should show "Select a room"

**AC-042.2: Time Slot Loading**
- GIVEN I am on the booking form
- WHEN I select a date
- THEN available time slots should load within 500ms
- AND unavailable slots should be grayed out
- AND I should see a loading indicator during fetch

**AC-042.3: Room Filtering**
- GIVEN I have selected a valid date and time range
- WHEN the room dropdown populates
- THEN only rooms available for that time should appear
- AND each room displays: name, capacity, building, floor
- AND rooms are sorted by: most recently used by me first

**AC-042.4: Successful Submission**
- GIVEN all form fields are valid
- WHEN I click "Book Room"
- THEN a booking record is created in the database
- AND I see a success toast: "Room booked successfully"
- AND I am redirected to /bookings with the new booking visible

---

## US-044: Capacity Validation - Acceptance Criteria

**AC-044.1: Inline Validation**
- GIVEN I have selected a room with capacity 10
- WHEN I enter attendee count 15
- THEN I see inline error: "Exceeds room capacity (max: 10)"
- AND the input field has error styling (red border)
- AND the submit button remains enabled but form won't submit

**AC-044.2: Boundary Validation**
- GIVEN room capacity is 10
- WHEN I enter exactly 10 attendees
- THEN no error is shown
- AND form can submit successfully

**AC-044.3: Zero/Negative Prevention**
- GIVEN I am entering attendee count
- WHEN I enter 0 or negative number
- THEN I see error: "At least 1 attendee required"
```

#### Step 4: Write Test Cases

```markdown
## Test Cases for US-042, US-044

### TC-042-01: Happy Path - Complete Booking Flow
| Attribute | Value |
|-----------|-------|
| **Precondition** | User logged in, Room "Alpha" available tomorrow 10:00-11:00 |
| **Test Data** | Title: "Sprint Planning", Date: tomorrow, Time: 10:00-11:00, Room: Alpha, Attendees: 5 |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to /bookings/new | Form loads with today's date |
| 2 | Select tomorrow's date | Time slots load |
| 3 | Enter start: 10:00, end: 11:00 | Room dropdown populates |
| 4 | Select "Alpha" | Room details shown |
| 5 | Enter title: "Sprint Planning" | No validation error |
| 6 | Enter attendees: 5 | No validation error |
| 7 | Click "Book Room" | Success toast appears |
| 8 | Verify redirect | /bookings page shows new booking |
| 9 | Check database | Record exists with correct data |

**Result:** ☐ Pass  ☐ Fail

---

### TC-042-02: Edge Case - Booking at Day Boundary
| Attribute | Value |
|-----------|-------|
| **Precondition** | User logged in |
| **Test Data** | Start: 23:00, End: 00:30 (next day) |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Select today's date | — |
| 2 | Enter start: 23:00 | — |
| 3 | Enter end: 00:30 | Error: "Booking must end same day" |
| 4 | Try to submit | Form does not submit |

**Result:** ☐ Pass  ☐ Fail

---

### TC-044-01: Capacity Exceeded
| Attribute | Value |
|-----------|-------|
| **Precondition** | Room "Beta" has capacity 8 |
| **Test Data** | Attendees: 12 |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Select Room "Beta" | Capacity shown: 8 |
| 2 | Enter attendees: 12 | Inline error appears |
| 3 | Verify error message | "Exceeds room capacity (max: 8)" |
| 4 | Click "Book Room" | Form does not submit |
| 5 | Change to 8 | Error clears |
| 6 | Click "Book Room" | Booking succeeds |

**Result:** ☐ Pass  ☐ Fail

---

### TC-044-02: Capacity Boundary (Exact Match)
| Attribute | Value |
|-----------|-------|
| **Precondition** | Room "Gamma" has capacity 20 |
| **Test Data** | Attendees: 20 |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Select Room "Gamma" | — |
| 2 | Enter attendees: 20 | No error (boundary valid) |
| 3 | Click "Book Room" | Booking succeeds |

**Result:** ☐ Pass  ☐ Fail

---

### TC-EF3-01: Conflict Detection
| Attribute | Value |
|-----------|-------|
| **Precondition** | Room "Delta" booked tomorrow 14:00-15:00 |
| **Test Data** | Same room, 14:30-15:30 (overlaps) |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Select tomorrow, 14:30-15:30 | — |
| 2 | Select Room "Delta" | — |
| 3 | Complete form and submit | Error: "Conflict detected" |
| 4 | Verify conflict display | Existing booking highlighted |
| 5 | Verify alternatives | System suggests 15:00+ or other rooms |

**Result:** ☐ Pass  ☐ Fail
```

#### Step 5: Iterate Until Complete

```markdown
## RE Iteration Checklist

### Iteration 1: Initial Draft ✓
- [x] Use cases documented
- [x] Happy path defined
- [x] User stories written
- [ ] Review with stakeholders

### Iteration 2: Exception Handling
- [x] Failure paths added
- [x] Edge cases identified  
- [x] Error messages specified
- [ ] UX review for error states

### Iteration 3: Test Coverage
- [x] Test cases for happy path
- [x] Test cases for boundaries
- [x] Test cases for failures
- [ ] Automated test feasibility check

### Iteration 4: Refinement (Current)
- [ ] Stakeholder feedback incorporated
- [ ] Missing scenarios added
- [ ] Test cases updated
- [ ] Ready for implementation

### Definition of Done
- [ ] All use case flows have acceptance criteria
- [ ] All acceptance criteria have test cases
- [ ] Edge cases documented and tested
- [ ] Documentation reviewed by team
- [ ] Implementation plan approved
```

#### Step 6: Technical Specification

```markdown
## Technical Specification: Booking Form Component

### Component Structure
- Location: `components/bookings/booking-form.tsx`
- Type: Client Component ('use client')
- Dependencies: React Hook Form, Zod, React Day Picker, Radix UI

### Data Flow
1. Form State → React Hook Form with Zod validation
2. Room Data → Server action fetches available rooms
3. Submission → Server action creates booking via bookingService

### Validation Schema (Zod)
| Field | Type | Validation |
|-------|------|------------|
| title | string | Required, 3-100 chars |
| date | Date | Required, >= today |
| startTime | string | Required, HH:mm format |
| endTime | string | Required, > startTime |
| roomId | string | Required, valid UUID |
| attendeeCount | number | Required, 1-500, <= room.capacity |
| notes | string | Optional, max 1000 chars |

### Error States
- Field-level errors (inline, red text)
- Form-level errors (alert banner)
- Conflict errors (highlighted calendar slots)

### Accessibility
- ARIA labels on all form fields
- Keyboard navigation support
- Focus management on errors
- Screen reader announcements for submissions
```

#### Step 7: Create Implementation Plan

From the RE documentation above, we derive a structured implementation plan:

```markdown
## Implementation Plan: US-042 Booking Form

### Phase 1: Foundation (Day 1)
- [ ] Create booking-form.tsx component skeleton
- [ ] Define Zod validation schema
- [ ] Set up React Hook Form with resolver
- [ ] Create form field components (Input, Select, DatePicker)

### Phase 2: Data Integration (Day 1-2)
- [ ] Create server action: getAvailableRooms(date, startTime, endTime)
- [ ] Create server action: createBooking(formData)
- [ ] Implement room availability filtering
- [ ] Add conflict detection query

### Phase 3: UI/UX (Day 2)
- [ ] Style form with Tailwind CSS
- [ ] Add loading states and spinners
- [ ] Implement error display (inline + banner)
- [ ] Add success toast notification

### Phase 4: Validation & Edge Cases (Day 3)
- [ ] Test attendee count vs room capacity
- [ ] Test date/time boundary conditions
- [ ] Test conflict scenarios
- [ ] Add accessibility attributes

### Phase 5: Testing & Refinement (Day 3)
- [ ] Manual testing across all ACs
- [ ] Fix edge cases discovered
- [ ] Code review and cleanup
```

#### Step 8: AI-Assisted Implementation

With this documentation, AI can generate precise implementations:

```
User: "Implement AC-042.3 (Attendee Count Validation) 
       based on the technical spec above"

AI: [Generates exact validation logic matching the spec]
    - Zod refinement comparing attendeeCount to room.capacity
    - Error message matching acceptance criteria
    - Form field with proper ARIA attributes
    
User: Reviews code against acceptance criteria, tests, commits
```

### Why This Approach Works

| Traditional Approach | RE-Driven AI Approach |
|---------------------|----------------------|
| Vague request: "Make a form" | Specific ACs with GIVEN/WHEN/THEN |
| Multiple iterations to clarify | Clear expectations upfront |
| AI guesses at requirements | AI implements documented specs |
| Inconsistent results | Reproducible, testable output |
| Hard to verify correctness | ACs serve as test cases |

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
│   ├── schemas/            # Zod validation schemas
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
git clone git@github.com:Noise85/ai-drive-raumreservierung.git
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
