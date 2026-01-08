# Backend Migration Options

Current Backend: **Railway** (Trial Mode, 512MB RAM, Credit Usage).
Goal: Migrate to a **Permanent Free Tier** service with no credit card requirement.

## Option 1: Hugging Face Spaces (🏆 Recommended)

Perfect for AI/ML applications like Zenith.

- **Specs:** 2 vCPU, 16GB RAM (!), 50GB Storage.
- **Cost:** Free Forever (CPU Basic tier).
- **Sleep Policy:** Suspends after 48h of inactivity (wakes up instantly).
- **Deployment:** Git Push (Docker or Python).
- **Pros:** Massive resources for AI models, zero cost, designed for Python.
- **Cons:** Public visibility by default (can be Private), URL format.

## Option 2: Render

The standard for web hosting.

- **Specs:** 0.1 CPU, 512MB RAM.
- **Cost:** Free.
- **Sleep Policy:** Spins down after 15 mins inactivity (slow wake up ~30s).
- **Deployment:** GitHub Integration.
- **Pros:** Easy setup, managed SSL.
- **Cons:** Very low resources (OOM risk), annoying cold starts.

## Option 3: Koyeb

Performance-focused serverless.

- **Specs:** 0.1 CPU, 512MB RAM.
- **Cost:** Free ($5.00/mo credit).
- **Sleep Policy:** Spins down when idle.
- **Pros:** Global CDN, fast build.
- **Cons:** Credit interface can be confusing.

## Option 4: Oracle Cloud (Free Tier)

Enterprise-grade VPS.

- **Specs:** 4 ARM Cores, 24GB RAM.
- **Cost:** Free Forever.
- **Pros:** Full VPS control, massive power.
- **Cons:** **Extremely difficult sign-up** (payment card verification fails often), complex maintenance.

# Recommendation

**Migrate to Hugging Face Spaces**.
Zenith is a Fraud Detection AI. It belongs on an AI platform. The **16GB RAM** allow us to restore the heavy ML libraries (TensorFlow/XGBoost) that we stripped out for Railway, making the app fully functional again.

## Next Steps

1. Create a Hugging Face Account.
2. Create a new "Space" (Docker SDK).
3. "Sync" our repository to the Space.
4. Update `zenith-gateway` to point to the new HF URL.
