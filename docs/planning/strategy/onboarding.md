# 00. Strategy: User Onboarding & Guidance

> **Goal:** Accelerate "Time to Value". Turn a novice into a "Level 1 Investigator" in < 5 minutes.
> **Problem:** The app is complex ("Military-Grade"). A blank screen is intimidating.

## 1. The "First Run" Experience (The Setup)
Before the user sees the Dashboard, we present a high-fidelity **"Role Selection" Wizard**.

### Step 1: "Who are you?"
*   **Investigator:** Optimizes UI for Graph & Maps.
*   **Legal:** Optimizes UI for Reports & Logs.
*   **Admin:** Optimizes UI for System Health.
*   **Result:** The layout presets (Sidebar, Widget placement) are auto-configured.

### Step 2: "Connect Data" (Optional)
*   "Drag your first `case_files.zip` here to start analysis."
*   **Value:** Avoids the "Empty Dashboard" problem by seeding the system immediately.

---

## 2. Interactive Guidance (The Tour)
We avoid generic "Next, Next, Next" carousels. Instead, we use **Task-Based Onboarding**.

### The "Rookie Checklist" (Gamification)
A persistent widget in the bottom-left (initially open).
1.  [ ] **Open a Case** (Link to Cases)
2.  [ ] **Find a Connection** (Link to Graph)
3.  [ ] **Flag Evidence** (Link to Lab)
4.  [ ] **Generate Report** (Link to Conclusion)

*   **Reward:** "Certified Level 1" Badge.

### "Just-in-Time" Tooltips
*   **Trigger:** First time user opens the **Investigation Graph**.
*   **Action:** Dim the screen, spotlight the "Force Layout" button.
*   **Content:** "Click here to auto-organize the shell companies." (Keep it actionable).

---

## 3. Frenly AI as the "Guide"
Frenly isn't just a chatbot; it's the "Senior Partner" showing you the ropes.

*   **Welcome Message:**
    > "Welcome, Agent. I see you've uploaded the 'Enron' dataset. I've already flagged 3 anomalies. Want me to show you?"
    > [Show Me] [I'll Explore Myself]

*   **The "Show Me" Action:**
    *   Frenly takes control (programmatic navigation).
    *   Navigates to **Dashboard**.
    *   Highlights the "Risk Gauge".
    *   Navigates to **Graph**.
    *   Selects the "Central Node".

---

## 4. Educational "Empty States"
Never show a blank page with "No Data".

| Page | Bad Empty State | Educational Empty State |
| :--- | :--- | :--- |
| **Cases** | "No Cases Found" | "No Cases yet. **Import from CSV** or **Connect to Database** to see the magic." |
| **Graph** | Blank Canvas | "Drag entities here to start mapping. Try adding 'John Doe'." |
| **Evidence** | Empty Table | "The Lab is quiet. Upload PDFs to activate OCR and Forgery Detection." |

## 5. Technical Implementation
*   **Library:** `driver.js` or `react-joyride` for the spotlight tours.
*   **State:** `user.onboardingStatus` (Persisted in DB).
*   **AI:** `Frenly.suggestTutorial()` triggers based on idle time.
