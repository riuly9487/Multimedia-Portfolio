# Setup

1. **Supabase project**: create a free account at supabase.com and a new project.
2. **Database**: SQL Editor > paste `supabase.sql`, replace `YOU@EXAMPLE.COM` with your email (4 places), Run.
3. **Your login**: Authentication > Users > Add user, using that same email and a strong password (tick auto-confirm).
   Then Authentication > Sign In / Providers > turn off "Allow new users to sign up".
4. **Keys**: Project Settings > API. Copy the Project URL and the anon public key into `config.js`. Never use the service_role key.
5. **GitHub**: create a public repo, upload everything in this folder (including `.github`), then Settings > Pages > deploy from the main branch.
6. **Keep-alive**: repo Settings > Secrets and variables > Actions, add `SUPABASE_URL` and `SUPABASE_ANON_KEY`. Then Actions > keepalive > Run workflow once.
7. Open your site, choose Owner login, and add content. Click the profile picture to change it.

Notes: only your account can write (enforced by the database rules, not the page). Videos use storage fast, so prefer YouTube links for long AI videos.
