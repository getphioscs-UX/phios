import ctypes as c,ctypes.wintypes as w,json,time,sys,os
root=int(sys.argv[1]); directory=sys.argv[2]; k=c.WinDLL('kernel32',use_last_error=True); p=c.WinDLL('psapi',use_last_error=True)
class Entry(c.Structure):_fields_=[('dwSize',w.DWORD),('cntUsage',w.DWORD),('pid',w.DWORD),('heap',c.c_size_t),('module',w.DWORD),('threads',w.DWORD),('parent',w.DWORD),('priority',w.LONG),('flags',w.DWORD),('name',w.WCHAR*260)]
class Memory(c.Structure):_fields_=[('cb',w.DWORD),('faults',w.DWORD),('peakWS',c.c_size_t),('ws',c.c_size_t),('peakPaged',c.c_size_t),('paged',c.c_size_t),('peakNonPaged',c.c_size_t),('nonPaged',c.c_size_t),('pagefile',c.c_size_t),('peakPagefile',c.c_size_t),('private',c.c_size_t)]
k.CreateToolhelp32Snapshot.argtypes=[w.DWORD,w.DWORD];k.CreateToolhelp32Snapshot.restype=w.HANDLE;k.Process32FirstW.argtypes=[w.HANDLE,c.POINTER(Entry)];k.Process32NextW.argtypes=[w.HANDLE,c.POINTER(Entry)];k.OpenProcess.argtypes=[w.DWORD,w.BOOL,w.DWORD];k.OpenProcess.restype=w.HANDLE;k.CloseHandle.argtypes=[w.HANDLE];p.GetProcessMemoryInfo.argtypes=[w.HANDLE,c.POINTER(Memory),w.DWORD]
def sample():
 snap=k.CreateToolhelp32Snapshot(2,0);e=Entry();e.dwSize=c.sizeof(e);entries=[]
 if snap==c.c_void_p(-1).value:return []
 ok=k.Process32FirstW(snap,c.byref(e))
 while ok:entries.append((e.pid,e.parent,e.name));ok=k.Process32NextW(snap,c.byref(e))
 k.CloseHandle(snap);ids={root};changed=True
 while changed:
  changed=False
  for pid,parent,name in entries:
   if parent in ids and pid not in ids:ids.add(pid);changed=True
 rows=[]
 for pid,parent,name in entries:
  if pid not in ids or pid==os.getpid():continue
  handle=k.OpenProcess(0x410,False,pid)
  if not handle:handle=k.OpenProcess(0x1000,False,pid)
  if not handle:rows.append({'pid':pid,'name':name,'error':'OPEN_PROCESS_DENIED'});continue
  m=Memory();m.cb=c.sizeof(m);ok=p.GetProcessMemoryInfo(handle,c.byref(m),m.cb);k.CloseHandle(handle)
  rows.append({'pid':pid,'name':name,**({'workingSetBytes':m.ws,'privateBytes':m.private}if ok else{'error':'MEMORY_QUERY_FAILED'})})
 return rows
rows=[];started=time.monotonic()
while not os.path.exists(directory+'/STOP-MEMORY')and time.monotonic()-started<600:
 try:label=json.load(open(directory+'/MEMORY-LABEL.json'))['label']
 except:label='INIT'
 procs=sample();rows.append({'at':time.time(),'label':label,'processes':procs});time.sleep(.05)
summary=[]
for label in dict.fromkeys(r['label']for r in rows):
 selected=[r for r in rows if r['label']==label];node=[p.get('workingSetBytes',0)for r in selected for p in r['processes']if p['pid']==root];worker=[p.get('workingSetBytes',0)for r in selected for p in r['processes']if'workerd'in p['name'].lower()];totals=[sum(p.get('workingSetBytes',0)for p in r['processes'])for r in selected]
 summary.append({'label':label,'samples':len(selected),'peakNodeWorkingSetBytes':max(node,default=None),'peakWorkerdWorkingSetBytes':max(worker,default=None),'peakProcessTreeWorkingSetSumBytes':max(totals,default=None)})
json.dump({'method':'Windows Toolhelp process tree + PSAPI GetProcessMemoryInfo; 50ms sampled observed peaks. RSS sums may double-count shared pages; not per-isolate JS heap. Only this test process and descendants; sampler excluded.','summary':summary,'samples':rows},open(directory+'/PROCESS-MEMORY.json','w'),indent=2)
