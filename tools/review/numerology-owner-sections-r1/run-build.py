import sys,subprocess
sys.path.insert(0,'scripts/lib')
from disk_space_guard import reserve_render_slot,require_disk_space
require_disk_space('NUM owner SEC01–10 three local PDFs',700_000_000)
release=reserve_render_slot('NUM owner SEC01–10 local PDF build')
try:
    subprocess.run(['node','.tmp/numerology-owner-sections-r1/build.mjs'],check=True)
finally:
    release()
