"""Run seed_showcase_company.py inside the showcase app's environment."""
import os
import runpy
import sys
from pathlib import Path

HERE = Path(__file__).parent
exec(compile((HERE / "run_showcase_app.py").read_text().split("args = sys.argv")[0], "env", "exec"))
os.environ.update(env)
os.chdir(DATA)
sys.path.insert(0, str(APP))
sys.argv = ["seed", *sys.argv[1:]]
runpy.run_path(str(HERE / "seed_showcase_company.py"), run_name="__main__")
