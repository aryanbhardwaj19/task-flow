# TaskFlow (Task Maestro)

A modern, full-stack task management application built with **React**, **Vite**, **Express**, and **MongoDB**.

## Features

-   **Kanban Board**: Drag-and-drop task management.
-   **Projects**: Organize tasks into multiple projects.
-   **Team Collaboration**: Invite members to projects.
-   **Authentication**: Secure user registration and login.
-   **Responsive Design**: Works on desktop and mobile.

## Tech Stack

-   **Frontend**: React, TypeScript, Tailwind CSS, Vite, TanStack Query, Framer Motion.
-   **Backend**: Node.js, Express, Mongoose (MongoDB ODM), Zod (Validation).
-   **Database**: MongoDB Atlas.

## Project Structure

This project is a monorepo containing both frontend and backend:

-   `frontend/`: The React application.
-   `backend/`: The Express API server.
-   `shared/`: Shared types and schemas (Zod).

## Getting Started

### Prerequisites

-   Node.js (v18+)
-   MongoDB Atlas Connection String

### 1. Setup Backend

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file in `backend/` based on `backend/.env.example` (or use your own credentials):
    ```env
    MONGO_URL=your_mongodb_connection_string
    JWT_SECRET=your_jwt_secret
    PORT=5001
    ```
4.  Start the backend server:
    ```bash
    npm run dev
    ```
    The server will start on `http://localhost:5001`.

### 2. Setup Frontend

1.  Navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```
    The app will open at `http://localhost:5173`.

## Deployment

### Frontend (Vercel / Netlify)

1.  Connect your GitHub repository.
2.  Set the **Root Directory** to `frontend`.
3.  The build command is `npm run build`.
4.  The output directory is `dist`.
5.  **Important**: Configure rewrites or proxy settings used in development for production, or ensure your frontend calls the deployed backend URL directly.

### Backend (Railway / Render / Heroku)

1.  Connect your GitHub repository.
2.  Set the **Root Directory** to `backend`.
3.  The build command is `npm run build` (if applicable) or just start with `npm start` (ensure `package.json` has a `start` script executing `dist/index.js` or `ts-node`).
4.  Add Environment Variables: `MONGO_URL`, `JWT_SECRET`, `PORT`.

### License & Ownership

© 2026 Aryan Bhardwaj. All Rights Reserved.