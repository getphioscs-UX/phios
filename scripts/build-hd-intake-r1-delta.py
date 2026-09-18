"""Package only this successor's changed/new files against the user baseline."""
from pathlib import Path
import hashlib
import json
import subprocess
import zipfile

ROOT = Path(__file__).resolve().parents[1]
BASELINE = 'ca80d9f5a33955d6e222777ccb8c92b01f5cd4e2'
def git(*args):
    return subprocess.check_output(['git', *args], cwd=ROOT, text=True).splitlines()

if git('rev-parse', 'HEAD')[0] != BASELINE:
    raise SystemExit('Review baseline before packaging')
validation = json.loads((ROOT/'docs/hd-intake-r1/validation-summary.json').read_text(encoding='utf-8'))
if validation['npmCheck'] != 'PASS' or validation['pagesBuild'] != 'PASS':
    raise SystemExit('Required machine checks have not passed')
subprocess.run(['git', 'diff', '--check'], cwd=ROOT, check=True)
changed = git('diff', '--name-only', BASELINE)
expected = {
    'assets/customer-ui/js/locale.js',
    'assets/customer-ui/js/surfaces/personal-reality.js',
    'content/professional/personal-reality/current/ppr-current-shared-owner-registry-v1.json',
    'functions/api/customer-external-profile-intake.js',
    'functions/external-profile/external-profile-confirmation.js',
    'functions/external-profile/hdr-intake-calculation-reference.js',
    'perspectives/personal/index.html',
    'scripts/check-cx-r12r4b-r2-external-profile-confirmation-shadow.mjs',
    'scripts/check-ecr-product-r3-w6.mjs',
    'scripts/check-hd-pro-r2-w0-w10.mjs',
    'scripts/check-ziwei-cx-r1-w15-w16.mjs',
    'scripts/check-p1-browser-r1-blocker-repair.mjs'
}
if set(changed) - expected:
    raise SystemExit('Unexpected tracked changes; inspect before packaging: '+str(set(changed)-expected))
new = git('ls-files', '--others', '--exclude-standard')
allowed = ('docs/hd-intake-r1/', 'content/customer-experience-rebuild/hd-intake-r1/',
           'assets/customer-ui/surfaces/hd-intake-r1.css',
           'functions/external-profile/hd-intake-reconciliation.js',
           'scripts/check-hd-intake-r1', 'scripts/build-hd-intake-r1-delta.py')
names = sorted(set(changed + [name for name in new if name.startswith(allowed)]
                   + ['docs/hd-intake-r1/changed-files.txt']))
(ROOT/'docs/hd-intake-r1/changed-files.txt').write_text('\n'.join(names)+'\n', encoding='utf-8')
manifest = {'baseline': BASELINE, 'humanReview': 'PENDING_FINAL_REVIEW_WITH_PIS_R1',
            'deletions': [], 'files': []}
target = ROOT/'output/delta/HD-INTAKE-R1-ca80d9f.zip'
target.parent.mkdir(parents=True, exist_ok=True)
with zipfile.ZipFile(target, 'w', zipfile.ZIP_DEFLATED) as archive:
    for name in names:
        data = (ROOT/name).read_bytes()
        manifest['files'].append({'path': name, 'sha256': hashlib.sha256(data).hexdigest(), 'bytes': len(data)})
        archive.writestr(name, data)
    archive.writestr('DELTA-MANIFEST.json', json.dumps(manifest, ensure_ascii=False, indent=2)+'\n')
with zipfile.ZipFile(target) as archive:
    assert archive.testzip() is None
digest = hashlib.sha256(target.read_bytes()).hexdigest()
target.with_suffix('.zip.sha256').write_text(f'{digest}  {target.name}\n', encoding='utf-8')
print(json.dumps({'path': str(target), 'files': len(names), 'bytes': target.stat().st_size, 'sha256': digest}))
