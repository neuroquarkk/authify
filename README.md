# authify

## Features

- **User Authentication**
- **Secure JWT Sessions**
- **Two-Factor Authentication** via email (OTP)
- **Email Verification** for new users
- **Secure Cookie Management**
- **Session Management** (Logout from single device or all devices)
- **Database Auditing** for key authentication events

## Setup Instructions

This project uses `bun` as the runtime and package manager

1. **Install dependencies**

```bash
bun install
```

2. **Set up env variables**

```bash
mv .env.example .env
```

3. **Set up the Database**

```bash
# Apply migrations
bun run migrate

# (optional) Seed the database with test users
bun run seed
```

4. **(optional) Run Scripts**
   If you want to create a ephemeral nodemailer account

```bash
bun run scripts/create-mail-account.ts
```

5. **Start the server**

```bash
bun run start
```

## API Endpoints

**Base URL:** `/api/v1`

### Health Check (`/health`)

| Method | Endpoint | Description                          | Auth Required |
| ------ | -------- | ------------------------------------ | ------------- |
| GET    | /        | Checks the health of the API server. | No            |

### Authentication (`/auth`)

| Method | Endpoint          | Description                                                            | Auth Required |
| ------ | ----------------- | ---------------------------------------------------------------------- | ------------- |
| POST   | /signup           | Register a new user and send verification email                        | No            |
| POST   | /login            | Login user. Issues cookies. May trigger 2FA                            | No            |
| POST   | /login/verify-2fa | Verify the 2FA OTP to complete login                                   | No            |
| POST   | /verify-email     | Verify a user's email with a token (token in query param)              | No            |
| POST   | /refresh          | Issue a new access/refresh token pair. Relies on `refreshToken` cookie | No            |
| POST   | /logout           | Log out a user by invalidating the session                             | Yes           |

### User (`/user`)

| Method | Endpoint  | Description                                              | Auth Required |
| ------ | --------- | -------------------------------------------------------- | ------------- |
| GET    | /me       | Retrieve the currently authenticated user's profile data | Yes           |
| POST   | /settings | Update user settings                                     | Yes           |
| DELETE | /delete   | Permanently delete the authenticated user's account      | Yes           |
| GET    | /audit    | Retrieve paginated audit logs for the user               | Yes           |

### Authentication & Authorization

- The API uses JWTs (`accessToken` and `refreshToken`) stored in `httpOnly` cookies
- The `accessToken` is used to authenticate the user for protected routes (like `/logout`) can be sent as a cookie or as a header

```
Authorization: Bearer <your_token>
```

- The `refreshToken` is only used by the `/refresh` endpoint

## Technologies Used

- TypeScript
- Bun
- Express.js
- PostgreSQL with Prisma ORM
- JWT based authentication
- Zod for environment and request validation
- Nodemailer for sending emails
