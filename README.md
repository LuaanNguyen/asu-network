# asunetwork.com

a webring for arizona state university students.

## join asunetwork.com

requirements: asu student + things you are building + at least one public link

1. open the site and click `want to join? fill out the form`
2. submit your info (full name, email, asu program, grad year are required)
3. wait for admin review
4. once approved, your profile shows up in the list + graph

## contribute

open a pull request with a clear summary of what changed.

## admin auth

admin uses google oauth with an email allowlist.

required env vars:

- `AUTH_SECRET`
- `AUTH_GOOGLE_ID`
- `AUTH_GOOGLE_SECRET`
- `ADMIN_ALLOWED_EMAILS`

google oauth redirect uris:

- local: `http://localhost:3000/api/auth/callback/google`
- production: `https://asunetwork.com/api/auth/callback/google`

---

made with ❤️ by luan
