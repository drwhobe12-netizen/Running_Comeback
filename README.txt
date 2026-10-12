Running Comeback v3 — manual Strava CSV/JSON import

Upload ALL files from running_comeback folder to the ROOT of your existing GitHub Pages repository. Preserve filenames including .png. Existing data is retained under the same site URL/browser origin. Export backup first.

In app: More > Import Strava runs. Obtain Strava account data export from Strava website, unzip and select activities.csv. CSV distances are assumed kilometres. Only Run/TrailRun/VirtualRun activities are imported. JSON supports Strava API activity arrays with metre distances. Imported runs need post-run injury feedback in Progress > Training history.

IMPORTANT: This is NOT automatic Strava OAuth sync. That requires a registered Strava developer app and secure backend, not just GitHub Pages. Never upload client secrets or tokens to a public repository.
