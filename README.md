# TaskFlow

TaskFlow is a full-stack task and team management application built with React, Express, and MongoDB Atlas.

## Features

- Register and log in with email and password; passwords are bcrypt-hashed on the server.
- JWT-protected dashboard, task, and team data.
- Remember Me: checked sessions persist in local storage; unchecked sessions are scoped to the browser tab/session.
- Create, view details, edit, delete, assign, and track tasks.
- Ownership-aware actions: only the creator can edit or delete; creators and assignees can view.
- Live dashboard counts, recent tasks, due dates, and overdue count.
- Search title and description; filter by status/priority; sort by due or creation date; paginate results.
- Team directory from registered database users (no sample members or tasks are shown).
- Dark mode, accessible success/error toast notifications, and a status-distribution chart.
- Responsive desktop and mobile layouts.

## Technology

- Frontend: React, Vite, React Router, Axios, CSS.
- Shared auth state: React Context (`useAuth`); Redux Toolkit is installed in the starter but is not used because the current shared state is small and Context is sufficient.
- Backend: Node.js, Express, Mongoose, MongoDB Atlas, bcryptjs, jsonwebtoken.

## Project structure

```text
client/src/
  components/       Reusable task card
  context/          Authentication and notification providers
  hooks/            useAuth and useToast hooks
  pages/            Lazy-loaded dashboard, task, and team pages
  services/         Axios client and authentication requests
  utils/            Auth token/session storage helpers
  App.jsx           Protected application shell and routes
server/
  config/           MongoDB connection
  controllers/      Authentication, task, and user handlers
  middleware/       JWT authentication and JSON body validation
  models/           Mongoose User and Task models
  routes/           REST API routes
  tests/            Mongoose model validation tests
postman/
  TaskFlow.postman_collection.json
```

## Local setup

Requires Node.js `20.19+` (or `22.12+`) and access to a MongoDB Atlas database.

### Backend (PowerShell)

```powershell
Set-Location .\server
Copy-Item .env.example .env
npm install
npm start
```

Set real values in `server/.env` locally. Do not commit `.env`.

### Frontend (a second terminal)

```powershell
Set-Location .\client
Copy-Item .env.example .env
npm install
npm run dev
```

Open the Vite URL printed in the terminal (normally `http://localhost:5173`). The development server proxies API requests to `http://localhost:5000` to avoid local-origin CORS mismatches. For production builds, set `VITE_API_URL` to the deployed backend URL.

## Environment variables

### `server/.env`

| Name | Purpose |
| --- | --- |
| `PORT` | Express listening port (defaults to 5000) |
| `NODE_ENV` | Environment name |
| `MONGODB_URI` | MongoDB Atlas connection URI |
| `JWT_SECRET` | Private key used to sign JWTs |
| `CLIENT_URL` | Allowed frontend origin for production CORS |

### `client/.env`

| Name | Purpose |
| --- | --- |
| `VITE_API_URL` | Backend origin used by production client builds |

See [server/.env.example](./server/.env.example) and [client/.env.example](./client/.env.example) for placeholders only.

## API

All request and response bodies are JSON. Authenticated endpoints require `Authorization: Bearer <token>`.

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| `POST` | `/register` | No | Create a user; body: `{ "name": "...", "email": "...", "password": "..." }` |
| `POST` | `/login` | No | Authenticate; body: `{ "email": "...", "password": "..." }`; response includes `token` and safe `user` fields |
| `GET` | `/api/tasks` | Yes | List tasks created by or assigned to the user |
| `POST` | `/api/tasks` | Yes | Create a task |
| `GET` | `/api/tasks/:id` | Yes | View an accessible task |
| `PUT` | `/api/tasks/:id` | Yes | Update a task owned by the requester |
| `DELETE` | `/api/tasks/:id` | Yes | Delete a task owned by the requester |
| `GET` | `/api/users` | Yes | List safe user fields for assignment/team view |
| `GET` | `/` | No | Backend health check |

Typical status codes: `400` invalid input/JSON, `401` missing/invalid/expired JWT, `404` unknown or inaccessible resource, `409` duplicate email, and `500` unexpected server error.

Import [postman/TaskFlow.postman_collection.json](./postman/TaskFlow.postman_collection.json) into Postman to exercise the endpoints. Set its `baseUrl`; after login, the collection saves the returned JWT into its `token` variable. Replace the sample request body with a private test account you registered yourself.

## Tests and checks

```powershell
Set-Location .\server
npm test

Set-Location ..\client
npm test
npm run lint
npm run build
```

The server tests validate Mongoose models and authentication/body-validation middleware without writing test users/tasks to the configured database. Browser flows requiring a real account should be tested locally with an account you control.

## Deployment and submission status

- Frontend is configured for Vercel: deploy `client/` and set `VITE_API_URL` to the Render service URL.
- Backend is configured for a Node host such as Render: set `MONGODB_URI`, a strong private `JWT_SECRET`, `PORT`, `NODE_ENV`, and `CLIENT_URL` in the host environment.
- Deployment manifests are provided in [client/vercel.json](./client/vercel.json) and [render.yaml](./render.yaml); review each service's environment values before deploying.
- MongoDB Atlas must allow the backend host to connect. Never put database credentials or JWT secrets in frontend variables.
- No deployment URLs, repository URL, evaluator credentials, or app screenshots are published in this workspace yet. These require an actual deployment/repository and explicitly provisioned test account; the sample credentials from the assessment PDF are not assumed to exist and are not seeded.
- Four assessment bonus features implemented: dark mode, toast notifications, pagination, and a dashboard status chart.
