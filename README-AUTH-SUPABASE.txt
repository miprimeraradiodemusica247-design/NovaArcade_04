NOVA ARCADE — Supabase Auth + Admin Protected Route

FILES
- public/index.html: Supabase email/password sign-in and protected #admin route.
- api/notify.js: verifies the Supabase access token and admin_users membership before sending Discord webhooks.

VERCEL ENVIRONMENT VARIABLES
Set these in Vercel > Project > Settings > Environment Variables:

SUPABASE_URL=https://ixxqbjoicjmvarnorjts.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_bKVxSSXG_tZzVxCs14xn1g_cqT0vsh-
WEBHOOK_1_CATALOGO=<Discord webhook URL for catalog>
WEBHOOK_2_SEGURIDAD=<Discord webhook URL for security>

Do NOT add a service_role key or a Supabase secret key to Vercel frontend variables or public/index.html.
Do NOT use ADMIN_PASSWORD anymore; the API no longer accepts it.
After changing variables, redeploy the Vercel project.

FIRST ADMIN SETUP
1. Deploy these files.
2. Open https://YOUR-DOMAIN/admin and create your account with your email and a password of at least 12 characters.
3. If email confirmation is enabled, confirm the email and sign in.
4. In Supabase Dashboard > SQL Editor, run the following query, replacing the email with the exact email used above:

insert into public.admin_users (user_id)
select id from auth.users where lower(email) = lower('YOUR-EMAIL@example.com')
on conflict (user_id) do nothing;

5. Reload /#admin and sign in. Only accounts listed in public.admin_users can access the admin panel.

SECURITY NOTES
- public.admin_users has RLS enabled. Authenticated users can only SELECT their own membership row.
- There is no client-side INSERT/UPDATE/DELETE policy. Admin membership must be assigned by a trusted project owner from SQL Editor.
- The Discord API route independently verifies the bearer token with Supabase Auth and checks admin_users before relaying a webhook.
- The publishable key is intentionally public. Webhook URLs must remain secret server-side environment variables.
- This is client-rendered route protection plus server-side authorization for the webhook endpoint. Any future admin data mutation API must repeat server-side authorization and database RLS checks.

DEPLOYMENT
Keep the Vercel Root Directory set to the folder containing api/ and public/.
Output Directory: public
Framework Preset: Other
No build or install command is required.
