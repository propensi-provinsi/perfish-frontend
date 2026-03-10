# Perfish Frontend

Web application built with **Next.js 16**, **React 19**, **TypeScript**, and **Tailwind CSS 4**.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Structure](#project-structure)
3. [Getting Started](#getting-started)
4. [Environment Variables](#environment-variables)
5. [Pages & Routes](#pages--routes)
6. [Authentication](#authentication)
7. [API Client](#api-client)
8. [Role-Based UI](#role-based-ui)
9. [Development Guide](#development-guide)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

| Tool | Version |
|------|---------|
| **Node.js** | 18+ |
| **npm** | 9+ |

---

## Project Structure

```
frontend/
├── package.json
├── next.config.ts
├── tsconfig.json
├── postcss.config.mjs
└── src/
    ├── app/                   # Next.js App Router pages
    │   ├── globals.css
    │   ├── layout.tsx          # Root layout — wraps app with AuthProvider
    │   ├── page.tsx            # Root redirect
    │   ├── login/page.tsx      # Login form
    │   ├── register/page.tsx   # Registration form
    │   ├── dashboard/page.tsx  # Main dashboard (protected)
    │   ├── profile/page.tsx    # View & edit profile (protected)
    │   └── admin/
    │       └── users/page.tsx  # User management (Superadmin only)
    ├── components/
    │   ├── Navbar.tsx           # Top navigation bar (role-aware)
    │   ├── ProtectedRoute.tsx   # Auth guard with 403 page
    │   └── ui/
    │       └── Button.tsx
    ├── context/
    │   └── AuthContext.tsx      # Auth state, login/logout/register actions
    ├── hooks/
    │   └── useHealthCheck.ts   # Backend health polling hook
    ├── lib/
    │   └── api.ts              # Axios client (auto-attaches JWT, handles 401)
    └── types/
        ├── api.ts              # ApiResponse type
        ├── auth.ts             # UserRole, DTOs (LoginPayload, ProfileData, etc.)
        └── index.ts            # Re-exports all types
```

---

## Getting Started

### 1. Clone

```bash
git clone <repository-url>
cd frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set environment variables

Create a `.env.local` file in the `frontend/` folder:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

Change the URL if the backend is hosted elsewhere (staging, production, etc.).

### 4. Run the development server

```bash
npm run dev
```

App runs at **http://localhost:3000**

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | No | `http://localhost:8080/api` | Backend API base URL |

> Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser bundle. Never put secrets in these.

---

## Pages & Routes

| Route | Access | Description |
|-------|--------|-------------|
| `/` | Public | Redirects to `/dashboard` (or `/login` if not authenticated) |
| `/login` | Public | Email/password login form |
| `/register` | Public | Registration form with role dropdown |
| `/dashboard` | Authenticated | Overview — shows user info and backend health |
| `/profile` | Authenticated | View and edit your name & email |
| `/admin/users` | `SUPERADMIN` only | Table of all users with inline role editing |

Accessing a protected route while unauthenticated redirects to `/login`.
Accessing a role-restricted route with insufficient permissions shows a **403** page.

---

## Authentication

Authentication state is managed by `AuthContext` (`src/context/AuthContext.tsx`).

### How it works

1. **Login** — calls `POST /v1/auth/login`, stores the JWT in `localStorage` under the key `token`
2. **Session restore** — on page load, reads `token` from `localStorage` and calls `GET /v1/profile` to rehydrate user state
3. **Logout** — removes `token` from `localStorage` and resets state
4. **Expired/invalid token** — the axios interceptor in `src/lib/api.ts` catches `401` responses and redirects to `/login`

### Using `useAuth`

```tsx
import { useAuth } from "@/context/AuthContext";

function MyComponent() {
  const { user, login, logout } = useAuth();

  // user is null if not authenticated
  // user.role is the UserRole enum value
}
```

### `AuthContext` API

| Property / Method | Type | Description |
|-------------------|------|-------------|
| `user` | `AuthUser \| null` | Current user (name, email, role) |
| `token` | `string \| null` | Raw JWT string |
| `loading` | `boolean` | True while restoring session from localStorage |
| `login(payload)` | `async (LoginPayload) => void` | Authenticate and store token |
| `register(payload)` | `async (RegisterPayload) => void` | Create a new account |
| `logout()` | `() => void` | Clear token and user state |
| `refreshProfile()` | `async () => void` | Re-fetch profile from API |

### Protecting a page

Wrap any page with `<ProtectedRoute>`:

```tsx
import ProtectedRoute from "@/components/ProtectedRoute";

export default function MyPage() {
  return (
    <ProtectedRoute allowedRoles={["SUPERADMIN", "WAREHOUSE_ADMIN"]}>
      {/* page content */}
    </ProtectedRoute>
  );
}
```

Omit `allowedRoles` to allow any authenticated user.

---

## API Client

The axios client in `src/lib/api.ts` handles all HTTP communication.

### Features

- **Base URL** — reads from `NEXT_PUBLIC_API_URL`
- **JWT injection** — automatically attaches `Authorization: Bearer <token>` from `localStorage`
- **401 handling** — clears token and redirects to `/login`
- **Timeout** — 10 seconds

### Usage

```ts
import apiClient from "@/lib/api";
import type { ApiResponse, ProfileData } from "@/types";

// GET
const { data } = await apiClient.get<ApiResponse<ProfileData>>("/v1/profile");
console.log(data.data.name);

// POST
const { data } = await apiClient.post<ApiResponse<LoginResponseData>>(
  "/v1/auth/login",
  { email, password }
);

// PUT
await apiClient.put("/v1/profile", { name, email });
```

### `ApiResponse<T>` shape

All backend responses follow this structure:

```ts
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
```

---

## Role-Based UI

Available roles (defined in `src/types/auth.ts`):

```ts
type UserRole =
  | "SUPERADMIN"
  | "WAREHOUSE_ADMIN"
  | "BOARD_DIRECTORS"
  | "QC_SPECIALIST"
  | "GUEST"
  | "MARKETING_STAFF"
  | "WAREHOUSE_STAFF";
```

### Conditionally rendering UI by role

```tsx
const { user } = useAuth();

{user?.role === "SUPERADMIN" && (
  <Link href="/admin/users">Manage Users</Link>
)}
```

### `USER_ROLES` constant

Use the `USER_ROLES` array when rendering role dropdowns:

```ts
import { USER_ROLES } from "@/types";

USER_ROLES.forEach(({ value, label }) => {
  // value = "WAREHOUSE_ADMIN", label = "Warehouse Admin"
});
```

---

## Development Guide

### Commands

```bash
npm run dev        # Dev server at http://localhost:3000
npm run build      # Production build
npm start          # Start production server (after build)
npm run lint       # Run ESLint
```

### Adding a new page

1. Create `src/app/<route>/page.tsx`
2. If protected, wrap content in `<ProtectedRoute>`
3. If it needs user data, use `useAuth()`
4. If it calls the API, use `apiClient` from `@/lib/api`

### Adding a new API call

Define the response type in `src/types/auth.ts` or `src/types/api.ts`, then call it using `apiClient`:

```ts
const { data } = await apiClient.get<ApiResponse<MyType>>("/v1/my-endpoint");
```

### TypeScript path aliases

`@/` maps to `src/` (configured in `tsconfig.json`):

```ts
import { useAuth } from "@/context/AuthContext";
import apiClient from "@/lib/api";
```

---

## Troubleshooting

**CORS error when calling the backend**
- Ensure the backend is running at the URL set in `NEXT_PUBLIC_API_URL`
- The backend's `CorsConfig` must allow `http://localhost:3000`

**`useAuth` returns null user after refresh**
- The token in `localStorage` may be expired — log in again
- Check browser DevTools → Application → Local Storage for the `token` key

**Port 3000 already in use**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux / Mac
lsof -ti:3000 | xargs kill
```

**Build errors with TypeScript**
```bash
npx tsc --noEmit    # Check types without building
npm run lint        # Check ESLint rules
```

**Environment variable not picked up**
- Confirm the file is named `.env.local` (not `.env`)
- Restart the dev server after changing `.env.local`
- Only `NEXT_PUBLIC_*` vars are available in browser code
