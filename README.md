# Audit Logging UI

Frontend console for viewing system activity, security events, and compliance audit trails, built with **Next.js (App Router)** and **Tailwind CSS**.

## Features

- **Audit Event Log Table:** Displays timestamps, actors, roles (`OWNER`, `ADMIN`, `DEVELOPER`, `SERVICE`), action tags, target resources, and execution statuses (`SUCCESS`, `WARNING`, `FAILURE`).
- **Search & Multi-Facet Filtering:** Real-time search across event IDs, actors, resources, and descriptions, paired with status and action filters.
- **Summary Metrics:** Live counters for total events, successful actions, and alerts/failures.
- **CSV Export:** One-click client-side CSV download of the currently filtered audit records.
- **Mock-to-Live API Switch:** Runs standalone with realistic mock data by default and switches automatically to the live backend API when configured.

## Tech Stack

- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS
- **Icons:** Lucide React

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the development server:**
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Connecting to the Backend API

By default, `src/lib/auditApi.js` uses built-in mock data (`USE_MOCK = true`) when no backend URL is provided.

To connect to the live backend service:

1. Create a `.env.local` file in the project root:
   ```env
   NEXT_PUBLIC_AUDIT_API_URL=http://localhost:8080/api
   ```
2. Restart the Next.js server (`npm run dev`). The UI will automatically fetch records from `GET ${NEXT_PUBLIC_AUDIT_API_URL}/audit-logs`.

## Project Structure

```text
src/
├── app/
│   ├── layout.js       # Root layout and page metadata
│   ├── page.js         # Main Audit Logs dashboard view
│   └── globals.css     # Tailwind CSS imports and theme styles
└── lib/
    └── auditApi.js     # API client with automatic mock/live toggle
```