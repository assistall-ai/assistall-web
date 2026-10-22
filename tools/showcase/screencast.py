"""Sharp screen recordings of a Playwright page through Chrome's screencast, encoded with ffmpeg.

Frames arrive only when the screen changes, each with its own timestamp, so the video
holds each frame exactly as long as it was on screen. ``speed`` shortens every frame
evenly (1.4 = 40% faster), so the whole clip plays faster without skipping any screen.
"""
import base64
import shutil
import subprocess
import time
from pathlib import Path


class Screencast:
    def __init__(self, page, work_dir: Path):
        self.page = page
        self.work = Path(work_dir)
        shutil.rmtree(self.work, ignore_errors=True)
        self.work.mkdir(parents=True)
        self.frames: list[tuple[float, Path]] = []
        self.marks: list[tuple[str, float]] = []
        self.cdp = page.context.new_cdp_session(page)
        self.cdp.on("Page.screencastFrame", self._frame)

    def _frame(self, event):
        index = len(self.frames)
        path = self.work / f"f{index:05d}.jpg"
        path.write_bytes(base64.b64decode(event["data"]))
        self.frames.append((time.monotonic(), path))
        try:
            self.cdp.send("Page.screencastFrameAck", {"sessionId": event["sessionId"]})
        except Exception:  # noqa: BLE001 - the session may already be closing
            pass

    def start(self):
        size = self.page.viewport_size
        self.cdp.send("Page.startScreencast", {"format": "jpeg", "quality": 92, "maxWidth": size["width"],
                                               "maxHeight": size["height"], "everyNthFrame": 1})
        self.page.wait_for_timeout(300)

    def stop(self, out: Path, *, speed: float = 1.4, hold_end: float = 0.6, width: int = 1440):
        end = time.monotonic()
        self.cdp.send("Page.stopScreencast")
        frames = self.frames
        if not frames:
            raise RuntimeError("no frames were captured")
        lines = []
        for index, (stamp, path) in enumerate(frames):
            following = frames[index + 1][0] if index + 1 < len(frames) else end
            duration = max(following - stamp, 1 / 120) / speed
            if index + 1 == len(frames):
                duration += hold_end
            lines.append(f"file '{path.as_posix()}'\nduration {duration:.4f}")
        lines.append(f"file '{frames[-1][1].as_posix()}'")
        concat = self.work / "frames.txt"
        concat.write_text("\n".join(lines) + "\n", encoding="utf-8")
        out = Path(out)
        out.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", str(concat),
                        "-vf", f"fps=30,scale={width}:-2:flags=lanczos,format=yuv420p", "-c:v", "libx264",
                        "-preset", "slow", "-crf", "24", "-movflags", "+faststart", "-an", str(out)], check=True)
        total = sum(max((frames[i + 1][0] if i + 1 < len(frames) else end) - frames[i][0], 0) for i in range(len(frames)))
        first = frames[0][0]
        self.steps = [{"label": label, "at": round(max(stamp - first, 0) / speed, 2)} for label, stamp in self.marks]
        return {"video": str(out), "frames": len(frames), "recorded_s": round(total, 1),
                "played_s": round(total / speed + hold_end, 1), "steps": self.steps}

    def mark(self, label):
        self.marks.append((label, time.monotonic()))
