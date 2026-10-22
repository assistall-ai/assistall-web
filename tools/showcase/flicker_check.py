"""Find blinks in a video: a frame (or two) that differs a lot from both its neighbours,
which then agree with each other. Prints the duration and any blink times."""
import subprocess
import sys

import numpy as np

for path in sys.argv[1:]:
    w, h = 180, 112
    raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", path, "-vf", f"scale={w}:{h},format=gray", "-f", "rawvideo", "-"],
                         capture_output=True, check=True).stdout
    frames = np.frombuffer(raw, np.uint8).reshape(-1, h, w).astype(np.int16)
    blinks = []
    for gap in (1, 2, 3):
        for i in range(1, len(frames) - gap):
            before, during, after = frames[i - 1], frames[i], frames[i + gap]
            jump = np.abs(during - before).mean()
            settle = np.abs(after - before).mean()
            if jump > 6 and settle < jump * 0.25:
                blinks.append(round(i / 30, 2))
    big = [round(i / 30, 2) for i in range(1, len(frames)) if np.abs(frames[i] - frames[i - 1]).mean() > 12]
    print(f"{path}: {len(frames) / 30:.1f}s, blinks at {sorted(set(blinks)) or 'none'}, screen changes at {big}")
