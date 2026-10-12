Running Comeback v4 - Live Strava sync

Upload all app files to the root of your existing GitHub Pages repository. Export a backup before updating.
Open the app > More > Live Strava synchronisation. Enter APP_ACCESS_KEY (NOT SETUP_KEY), then Sync Strava.
If you tick Remember key, it is stored in browser localStorage on that device; otherwise sessionStorage is used. On shared devices, do not tick Remember key.
Runs are fetched from your configured Cloudflare Worker and imported without duplicating Strava activity IDs. Each imported run needs manual injury and effort feedback.
No key is included in this ZIP, exported app backups or GitHub source.
Automatic background sync is not enabled; tap Sync Strava to refresh.
The Worker must have working OAuth tokens, the TOKENS KV binding, and APP_ACCESS_KEY.
