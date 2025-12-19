# Frontend Deployment Guide

This guide covers how to deploy the frontend application to various platforms.

## Prerequisites

-   **Backend URL**: You need the URL where your backend API is deployed (e.g., `https://api.fraud-detection-378x492.com/api/v1`).
-   **Node.js**: Version 20+ installed locally for testing builds.

## Environment Variables

The application relies on `VITE_API_URL` to know where to send requests.
-   **Local**: Defaults to `http://localhost:8000/api/v1` (configured in `src/services/client.ts`).
-   **Production**: You **MUST** set `VITE_API_URL` (e.g., `https://api.fraud-detection-378x492.com/api/v1`) in your deployment platform's environment variables.

---

## Option 1: Vercel (Recommended)

1.  Push your code to a Git repository (GitHub, GitLab, Bitbucket).
2.  Log in to [Vercel](https://vercel.com/) and click **"Add New Project"**.
3.  Import your repository.
4.  Select the `frontend` directory as the **Root Directory**.
5.  Vercel should auto-detect "Vite".
6.  Expand **Environment Variables**:
    -   Key: `VITE_API_URL`
    -   Value: `https://your-backend-url.com/api/v1`
7.  Click **Deploy**.

## Option 2: Docker

We have configured a multi-stage `Dockerfile` (optimized for production).

1.  Build the image:
    ```bash
    docker build -t frontend-app .
    ```
    *Note: To bake in the API URL at build time (if not using runtime injection):*
    ```bash
    docker build --build-arg VITE_API_URL=https://api.example.com/api/v1 -t frontend-app .
    ```

2.  Run the container:
    ```bash
    docker run -p 80:80 frontend-app
    ```

## Option 3: Netlify

1.  Push your code to Git.
2.  Log in to Netlify and "Import from Git".
3.  Set **Base directory** to `frontend`.
4.  **Build command**: `npm run build`
5.  **Publish directory**: `dist`
6.  Under **Advanced > Environment variables**:
    -   Set `VITE_API_URL` to your backend URL.
7.  Deploy.

## Option 4: Static Hosting (S3 / Apache / Nginx)

1.  Run the build command locally or in CI/CD:
    ```bash
    export VITE_API_URL=https://api.example.com/api/v1
    npm run build
    ```
2.  The output will be in the `dist` folder.
3.  Upload the contents of `dist` to your web server or bucket.
4.  **Important**: Configure your web server to redirect all 404s to `index.html` (for React Router to work).

---

## Verification

After deployment, open the app and check the Network tab in Developer Tools. Ensure requests are going to your production backend URL, not `localhost`.
