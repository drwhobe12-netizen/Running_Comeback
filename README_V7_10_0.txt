Running Comeback v7.10.0 — targeted interface update

Changes:
- Run description in Progress activity history is clickable and opens the existing full activity editor.
- The older duplicate 'Copy coaching summary' button is hidden; use 'Copy weekly report for ChatGPT' for the richer report.
- New 'Import coaching update' panel on Progress. Paste JSON, preview, and explicitly approve changing the next three planned running durations.
- Imported updates never edit completed runs or Strava records.
- Updated cache-busting version in index.html.

Coaching update format (EXAMPLE ONLY, not a training recommendation):
{"type":"running-comeback-coach-update","version":1,"sessions":[20,25,30],"reason":"Replace with the assessed rationale."}

Deployment: unzip and upload all files to your existing GitHub Pages repository, preserving filenames. Back up your existing app data using Settings before upgrading.

Validation: app.js and nutrition.js passed Node.js syntax checks. Browser integration and live Strava sync have not been tested.
