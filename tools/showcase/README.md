# Website screens and clips (made-up company: Cedarvale Trading)

These scripts make the pictures in **How it works** and **Capabilities**, and the five clips in **See the work**.
They run a clean copy of the Assistall app on a throwaway data folder, fill it with one made-up company, then
take the screens. Real data is never touched: the seeder refuses any folder that is not a temporary
`assistall-capture-*` folder.

## Once per session

1. Copy the app source (its `main` branch) to a temporary folder:
   `git -C C:\agency\assistall-app archive main | tar -x -C %TEMP%\assistall-showcase-app`
2. Start the app copy with its sample modes (company board, sign-in-free accounting connection):
   `C:\agency\assistall-app\venv\Scripts\python.exe serve_capture.py` (port 8791).
3. Create the first person, then fill the company:
   `curl -X POST -H "Content-Type: application/json" -d "{\"name\":\"Layla Haddad\",\"pin\":\"2468\"}" http://127.0.0.1:8791/api/setup/first-user`
   `python run_seed.py`, then set the company name with `POST /api/settings {"company_name": "Cedarvale Trading LLC"}`
   and connect the sample QuickBooks through `/api/erp/select`, `/api/erp/connect/start` and `/erp/fake/consent`.

## Pictures

`python capture_stills.py <out>` saves 1440x900 screens. Convert the chosen ones to WebP (quality 82) into
`assets/media/showcase/`.

## Clips

`bash reset_takes.sh`, `python run_seed.py fresh-run`, then
`python capture_videos.py <out> board build library approve reply`.

- Each clip is recorded through Chrome's screencast (sharp frames, each held exactly as long as it was on screen)
  at a calm pace, then sped up 1.4x by ffmpeg, so the site plays it at normal speed.
- A visible pointer shows every click; pages scroll smoothly; nothing is recorded until the first screen has loaded.
- `clips.json` lists when each step starts; those times go into the step list beside each clip (`data-workflow-seek`).
- `python flicker_check.py <out>/*.mp4` must report `blinks at none` before a clip is used.
- Restart `serve_capture.py` before re-recording the board clip (its sample approvals reset on start).
