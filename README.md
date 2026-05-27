# Workout Tracker PWA

A personal workout tracker that installs to your iPhone home screen, works offline, and syncs to your own Google Sheet.

## What you get

- Track coach sessions and solo workouts
- Auto-suggested solo workouts based on what your coach skipped this week
- Weight suggestions based on history + smart estimates for new exercises
- Body diagrams showing which muscles each exercise hits
- Progress charts and weight-increase advice
- **Auto-sync to your Google Sheet** — every change pushes to the cloud automatically
- All your data also stays on your phone (offline-first)

---

## Setup is in 3 parts:
1. **Deploy the app** (15 min) — get it onto your iPhone
2. **Set up Google Sheets sync** (5 min) — for backup
3. **Connect them** (1 min)

---

## Part 1: Deploy the app

### Stage 1.1: Put the code on GitHub

1. Go to **github.com** and sign up (free) if needed
2. Click **+** top-right → **New repository**
3. Name it `workout-tracker`, leave Public, click **Create repository**
4. Click the **"uploading an existing file"** link
5. Drag this entire folder's contents into the upload area
6. Click **Commit changes**

### Stage 1.2: Deploy with Vercel

1. Go to **vercel.com** → **Sign Up** → **Continue with GitHub**
2. Click **Add New... → Project**
3. Find `workout-tracker` → click **Import**
4. Don't change anything → click **Deploy**
5. Wait ~1 min. You'll get a URL like `workout-tracker-xyz.vercel.app`

### Stage 1.3: Install on iPhone

1. On iPhone, open **Safari** (must be Safari for PWA install)
2. Go to your Vercel URL
3. Tap **Share** (square with up-arrow at bottom)
4. Scroll down → **Add to Home Screen** → **Add**

Done with Part 1. You now have a "Workouts" icon on your home screen.

---

## Part 2: Set up Google Sheets sync

### Stage 2.1: Create the sheet

1. Open a new tab, go to **sheets.new** — this creates a blank Google Sheet
2. Rename it (top-left, "Untitled spreadsheet") → call it `Workout Tracker`
3. In the menu: **Extensions → Apps Script**
4. A new tab opens with a code editor

### Stage 2.2: Paste the script

1. In Apps Script, select all the existing code (placeholder `function myFunction()`) and delete it
2. Open the `google-apps-script.js` file from your project folder
3. Copy all its contents
4. Paste into Apps Script
5. Press **Ctrl+S** (or Cmd+S on Mac) to save
6. When prompted, name the project `Workout Sync`

### Stage 2.3: Deploy as Web App

1. Top-right of Apps Script: click **Deploy → New deployment**
2. Click the **gear icon** next to "Select type" → choose **Web app**
3. Fill in:
   - **Description:** Workout sync (optional)
   - **Execute as:** Me (your email)
   - **Who has access:** **Anyone**

   ⚠️ "Anyone" sounds risky but is correct. Only people with the *exact secret URL* can access. Treat the URL like a password.

4. Click **Deploy**
5. Google will ask to authorize → click **Authorize access**
6. Choose your Google account
7. You'll see "Google hasn't verified this app" — click **Advanced** at the bottom-left → **Go to Workout Sync (unsafe)**

   This warning is normal for personal scripts. The script only touches your own sheet.

8. Click **Allow**
9. Copy the **Web app URL** (looks like `https://script.google.com/macros/s/AKfycb.../exec`)

**Keep this URL private.** Anyone with it can read/write to your sheet.

---

## Part 3: Connect them

1. Open the Workouts app on your iPhone
2. Tap **Settings** in the bottom nav
3. Paste your Web App URL into the box
4. Tap **Save URL**
5. Tap **Sync now**

You should see a green "Synced just now" badge in the top-right. Open your Google Sheet — you'll see a `Workouts` tab with all your sessions, and a `Sync Log` tab tracking each sync.

From now on, **every time you add or delete a session, the app auto-syncs after 1.5 seconds**. You don't have to do anything.

---

## How it works day-to-day

- **Online**: Log a session → green "Synced" badge appears moments later. Done.
- **Offline (gym basement)**: Log a session → badge shows "Offline". Data is safe locally. Next time you have internet, it auto-syncs.
- **New phone or cleared data**: Open the app → Settings → paste your URL → **Restore from Sheet** → all your history comes back.

---

## What's in the sheet

- **Workouts tab**: One row per exercise. Columns: Session ID, Type, Date, Exercise, Muscle Group, Weight (kg), Sets, Reps.
- **Sync Log tab**: Every sync gets a timestamp and a session count.

You can sort, filter, build pivot tables, make charts — it's a normal Google Sheet. **Just don't edit the data manually** if you plan to use Restore — the script reads what's there and overwrites your app. To edit history, use the app's History tab.

---

## If something breaks

### "Sync error" badge
- Tap Settings → look at the error message
- Most common cause: you re-deployed Apps Script and the URL changed. Get the new URL, paste it, save.

### Reset everything
- Apps Script lets you create new deployments without breaking old ones. If you mess up, create a fresh deployment and update the URL in Settings.

### Updating the app
1. New files arrive → upload to your GitHub repo (Add file → Upload files)
2. Vercel auto-redeploys in ~1 min
3. On iPhone: close the app fully (swipe up, swipe up on Workouts), reopen → new version loads

---

## Privacy

- **Your data lives in two places**: your iPhone (Safari storage) and your Google Sheet
- **No third-party servers**: Vercel hosts the static app code (no data). Apps Script runs in *your* Google account.
- **The sync URL is a secret**: anyone with the URL can read/write your sheet. Don't share it.
- To revoke access: Apps Script → Deploy → Manage deployments → archive the deployment. The URL stops working immediately.

---

## Running locally (optional)

```bash
npm install
npm run dev
```

Open http://localhost:5173

```bash
npm run build  # outputs to dist/
```
