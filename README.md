# StaffPulse

Vite + React staff attendance and leave portal. Authentication and shared staff data use Supabase.

## One-time Supabase setup

1. In the Supabase project, open **SQL Editor**, choose **New query**, paste the contents of [`supabase/setup.sql`](supabase/setup.sql), and click **Run**.
2. The SQL creates the profile, attendance, and leave tables; row-level security rules; and a profile trigger for Auth users. It assigns `admin@ktholidays.com` the manager role and gives other Auth users the staff role.
3. The backfill includes users that already existed before the SQL was run. Afterward, check **Table Editor → profiles** and confirm the manager row has role `manager`.

## Configure and deploy

Add these Vite variables to Vercel for Production (and Preview/Development if used):

- `VITE_SUPABASE_URL`: Supabase Project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY`: Supabase publishable key

Never add a Supabase secret/service-role key to this Vite app or a `VITE_` variable. The client bundle is public by design; row-level security protects the database.

Commit the project to the connected GitHub repository and let Vercel deploy the new commit. Keep the project root at the directory containing `package.json` and `index.html`.

## Add staff accounts

In Supabase, turn off public sign-ups under **Authentication → Settings → User Signups** so only accounts you create can enter the portal. Then open **Authentication → Users → Add user → Create new user** and set the employee's email and temporary password. If email confirmation is required, confirm the account before sign-in. The database trigger creates a profile with the `staff` role. The account owner should change their temporary password after first access.

The `profiles` table starts with basic defaults (name based on email, department `Operations`, and standard leave entitlements). A manager can update profile details and offer-letter terms in the Supabase Table Editor. New attendance and leave records are stored in the shared Supabase tables; the old browser demo records are no longer loaded.

## Local development

1. Install dependencies with `npm install`.
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in `.env.local`.
3. Run `npm run dev`.
