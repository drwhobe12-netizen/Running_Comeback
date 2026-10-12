RUNNING COMEBACK — Android installable web app

1. Upload all files from this folder to a HTTPS static website, keeping them together. GitHub Pages, Netlify and Cloudflare Pages are suitable options.
2. Open the HTTPS website in Chrome on your Android phone.
3. In Chrome's menu choose "Install app" or "Add to Home screen".
4. The app can then run offline after the first successful load.
5. Log runs, add next-morning Achilles feedback, and use More > Export backup regularly.
6. More > Copy coaching summary provides a text summary to paste into ChatGPT for personalised review.

IMPORTANT: Opening index.html directly from a ZIP or phone file manager is not equivalent to hosting the PWA; service workers and Android installation require HTTPS (or localhost for testing).
Data is stored in that browser's localStorage. Clearing site data, changing browser or device, or uninstalling can erase it. Export backups regularly.
The app does not diagnose injuries or independently adjust the 12-week schedule. Its recommendation banner is a conservative rule-based guide.

VERSION 2 — WEIGHT TRACKING
Open Progress to log weight in kilograms, view the trend and remove mistaken entries. Set an optional weight goal in More > Settings. Backups now include weights and weight goal.
If updating an existing GitHub Pages installation, replace all app files at the same URL. Existing browser data at that URL is preserved; do not clear site data. Export a backup before updating.
GitHub Pages: upload the CONTENTS of this folder to the root of the repository (or the same subfolder you already host the app from), commit, then enable Pages in Settings > Pages with Deploy from a branch, selecting main and /root (or your chosen folder). Your Pages URL depends on your repository name.
