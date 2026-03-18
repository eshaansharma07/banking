# Nova Bank JWT Demo

A Vercel-ready banking demo built with:

- Node.js + Express
- MongoDB + Mongoose
- JWT access and refresh tokens
- bcrypt password hashing
- Protected banking routes
- A polished single-page frontend

## Features

- User registration and login
- Hashed password storage with `bcryptjs`
- JWT access tokens for protected API calls
- Refresh token rotation with secure HTTP-only cookies
- Account-level access control so users only see their own accounts
- Demo transfer flow between a user's own accounts

## API Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/accounts/me`
- `GET /api/accounts/:accountId`
- `POST /api/accounts/transfer`

## Environment Variables

Create a `.env` file based on `.env.example`.

```env
MONGODB_URI=your-mongodb-uri
JWT_ACCESS_SECRET=your-long-random-secret
JWT_REFRESH_SECRET=your-second-long-random-secret
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
APP_ORIGIN=http://localhost:3000
NODE_ENV=development
```

## Local Development

```bash
npm install
npm run dev
```

## Deploying to Vercel

1. Push this repo to GitHub.
2. Import the GitHub repo into Vercel.
3. Add the environment variables from `.env.example` in the Vercel dashboard.
4. Set `APP_ORIGIN` to your deployed Vercel URL.
5. Redeploy.

## Notes

- Refresh tokens are stored in an HTTP-only cookie.
- Access tokens are returned in JSON and used as Bearer tokens by the frontend.
- Demo users automatically receive one checking account and one savings account on registration.
