# Migration Guide: Railway -> Hugging Face Spaces

We are moving the backend to Hugging Face Spaces to fix the 502 errors and gain 16GB RAM for free.

## Step 1: Create the Space

1. Go to [huggingface.co/new-space](https://huggingface.co/new-space).
2. **Space Name:** `zenith-backend` (or similar).
3. **License:** `mit`.
4. **SDK:** Select **Docker**.
5. **Space Hardware:** Keep default (CPU Basic · 2 vCPU · 16 GB · Free).
6. **Repository:**
    * If you pushed to GitHub: Select "Connect to GitHub" and choose your repo `teoat/378x492`.
    * **Crucial:** If asked for "Dockerfile path", leave blank (it's in root).

## Step 2: Configure Secrets (Environment Variables)

Go to your new Space -> **Settings** -> **Variables and secrets**.
Add the following **Secrets** (Not Variables, for security):

| Name | Value (Copy from your `.credentials.env` or Railway) |
|------|------------------------------------------------------|
| `DATABASE_URL` | `postgresql://...` |
| `REDIS_URL` | `rediss://...` |
| `UPSTASH_REDIS_REST_URL` | `https://...` |
| `UPSTASH_REDIS_REST_TOKEN` | `...` |
| `SECRET_KEY` | (Generate a long string) |
| `JWT_SECRET_KEY` | (Generate a long string) |
| `ENCRYPTION_KEY` | (Generate a long string) |
| `CORS_ALLOWED_ORIGINS` | `*` (or `https://zenith-frontend-v1.pages.dev`) |

*Note: Variables like `ENVIRONMENT=production` can be added as "Variables".*

## Step 3: Verify Deployment

1. Go to the **App** tab.
2. Wait for "Building" -> "Running".
3. Once running, your API URL is roughly:
    `https://[username]-zenith-backend.hf.space`
    *(Click the "Embed this space" menu or look at the URL bar to find the Direct URL).*

## Step 4: Update the Gateway

Once you have the new URL (e.g., `https://teoat-zenith-backend.hf.space`):

1. Open `cloudflare-workers/wrangler.toml`.
2. Update these lines:

    ```toml
    [vars]
    API_GATEWAY_URL = "https://teoat-zenith-backend.hf.space"
    AI_ML_URL = "https://teoat-zenith-backend.hf.space"
    FRAUD_URL = "https://teoat-zenith-backend.hf.space"
    WORKFLOW_URL = "https://teoat-zenith-backend.hf.space"
    ```

3. Deploy keys:

    ```bash
    cd cloudflare-workers
    npx wrangler deploy
    ```

## Step 5: Test Frontend

Refresh `https://zenith-frontend-v1.pages.dev`. The "Blank Screen" will vanish and the Login page will appear.
