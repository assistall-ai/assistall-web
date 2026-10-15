# Deploying the website

Deploys are started by a person. Merging to `main` never publishes anything.

## The button

GitHub → **Actions** → **Deploy website** → **Run workflow** (branch `main`).

| Action | What happens |
|---|---|
| `check-connection` (default) | Logs in to cPanel, reports the last fetched and last deployed commits, and checks the live site. Changes nothing. |
| `deploy` + type `DEPLOY` | Runs the tests and site verifier, asks cPanel to pull `main`, confirms cPanel has exactly this run's commit, deploys with `.cpanel.yml`, then checks the live site. |

The deploy refuses to run while `index.html` still has the placeholder Turnstile key, unless `allow_placeholder_turnstile` is ticked (the demo form then refuses submissions).

After a deploy, the live check must pass: homepage on the new asset versions, privacy and security pages, `security.txt`, and both PHP endpoints answering GET with 405. Missing security headers and the HTTP→HTTPS redirect are reported as warnings.

## One-time setup

Secrets live in the GitHub environment **production** (Settings → Environments), never in the repository:

| Secret | Value |
|---|---|
| `CPANEL_HOST` | Server address from the cPanel login URL, without `https://` or the port |
| `CPANEL_USER` | cPanel username |
| `CPANEL_API_TOKEN` | cPanel → Security → Manage API Tokens |
| `CPANEL_REPO_ROOT` | cPanel → Git Version Control → Manage → Repository Path |
| `CPANEL_PORT` | Optional; only if cPanel is not on 2083 |

Restrict the environment's deployment branches to `main`. The API token has full cPanel account access, so give it an expiry date and rotate it if it is ever exposed.

## Manual fallback and rollback

The cPanel buttons still work: Git Version Control → Manage → Pull or Deploy → **Update from Remote**, then **Deploy HEAD Commit**.

To roll back, revert the bad change on `main` through a pull request, then run the deploy again. `.cpanel.yml` copies files but never deletes them, so a file removed from the repository stays on the server until it is removed in cPanel File Manager.

Tools: `tools/cpanel-deploy.mjs` (cPanel UAPI calls) and `tools/check-live-site.mjs` (live checks; run `node tools/check-live-site.mjs` locally at any time).
