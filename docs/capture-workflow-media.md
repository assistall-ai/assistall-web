# Recording synthetic Assistall workflow evidence

Use this procedure only from the `feature/capture-fixtures` app worktree. It creates a temporary `assistall-capture-*` directory under the Windows system temporary folder, directs the SQLite database and encrypted app configuration there, seeds only fictional Demo Trading LLC records, binds the app to `127.0.0.1`, records the browser and removes the temporary data at the end.

```powershell
powershell -ExecutionPolicy Bypass -File tools\capture-workflow-media.ps1 `
  -Workflow all `
  -AppRoot C:\agency\assistall-app\.worktrees\capture-fixtures `
  -OutputRoot assets\media\workflows `
  -PythonPath C:\agency\assistall-app\venv\Scripts\python.exe
```

Before committing generated media, inspect every clip and poster for fictional labels only. Do not publish local file paths, OS notifications, customer information, credentials, session values or live connector output. The three clips must show contract review, shipment customs review and report preparation. To re-record one clip, pass its identifier instead of `all`.
