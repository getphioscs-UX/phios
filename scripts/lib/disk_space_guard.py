"""Space budget and one-at-a-time local report rendering. No system changes."""
import os,sys,shutil,json,atexit,datetime
from pathlib import Path

def evaluate_disk_budget(available,estimated,reserve,override=False):
    values=[available,estimated,reserve]
    if any(not isinstance(x,int) or isinstance(x,bool) or x<0 for x in values):
        raise ValueError('INVALID_DISK_BUDGET')
    result=dict(availableBytes=available,estimatedBytes=estimated,reserveBytes=reserve,requiredBytes=estimated+reserve,overridden=available<estimated+reserve)
    if result['overridden'] and not override:
        raise RuntimeError('INSUFFICIENT_DISK_SPACE: '+json.dumps(result)+'; free space or explicitly use --allow-low-disk-space')
    return result

def require_disk_space(label,estimated_bytes=2_000_000_000,directory='.'):
    result=evaluate_disk_budget(shutil.disk_usage(directory).free,int(os.environ.get('PHIOS_DISK_ESTIMATE_BYTES',estimated_bytes)),int(os.environ.get('PHIOS_DISK_RESERVE_BYTES',5_000_000_000)),'--allow-low-disk-space' in sys.argv)
    print('[disk-budget] '+label+': '+json.dumps(result),flush=True)
    return result

def reserve_render_slot(label,directory='.tmp'):
    """Never kill a process or guess that an existing lock is stale."""
    root=Path(directory).resolve();root.mkdir(parents=True,exist_ok=True)
    lock=root/'large-report-render.lock'
    try:fd=os.open(lock,os.O_CREAT|os.O_EXCL|os.O_WRONLY)
    except FileExistsError:raise RuntimeError('REPORT_RENDER_ALREADY_RESERVED: '+str(lock)+'; inspect its owner before removing a stale lock')
    payload=json.dumps(dict(pid=os.getpid(),label=label,utc=datetime.datetime.now(datetime.timezone.utc).isoformat()))
    with os.fdopen(fd,'w',encoding='utf8') as f:f.write(payload)
    def release():
        if lock.exists() and lock.read_text(encoding='utf8')==payload:lock.unlink()
    atexit.register(release)
    return release
