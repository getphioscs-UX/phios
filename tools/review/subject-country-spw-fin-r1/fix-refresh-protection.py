from pathlib import Path
p=Path(r'C:/Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/scripts/refresh-world-country-evidence.py')
s=p.read_text(encoding='utf-8')
s=s.replace("if sig==old_sig:return result", """if sig==old_sig:
  if apply:
   if admitter:admitter(candidate)
   write_atomic(checked_path(root,STATUS),{'schemaVersion':'WORLD_COUNTRY_REFRESH_STATUS_V1','status':'SUCCESS','checkedAt':candidate['retrievedAt'],'activeSourceVersion':current['projectionDigest'],'automaticRefreshEnabled':False,'productionAutomaticRefreshEnabled':False})
  return result""")
s=s.replace("if row.get('value')is not None and(not isinstance", "if row.get('value')is not None and row['period']>datetime.datetime.now(datetime.timezone.utc).year:raise ValueError('FUTURE_OBSERVATION_REJECTED')\n   if row.get('value')is not None and(not isinstance")
s=s.replace("parser=argparse.ArgumentParser();", "parser=argparse.ArgumentParser();")
s=s.replace("try:\n  fd=os.open", "saved={}\n try:\n  fd=os.open")
s=s.replace("os.write(fd,str(os.getpid()).encode());ref,current,raw=load_active(ROOT);", "os.write(fd,str(os.getpid()).encode());saved={rel:(checked_path(ROOT,rel).read_bytes()if checked_path(ROOT,rel).exists()else None)for rel in [POINTER,STATUS,'content/civilization-atlas/reconfiguration/world-observation-projection-v1.json']};ref,current,raw=load_active(ROOT);")
s=s.replace("except Exception as error:\n  print", """except Exception as error:
  if args.apply_local and fd is not None:
   for rel,body in saved.items():
    target=checked_path(ROOT,rel)
    if body is not None:target.write_bytes(body)
    elif target.exists():target.unlink()
   write_atomic(checked_path(ROOT,STATUS),{'schemaVersion':'WORLD_COUNTRY_REFRESH_STATUS_V1','status':'FAILED','checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'error':'REFRESH_FAILED_ACTIVE_SNAPSHOT_PRESERVED','automaticRefreshEnabled':False,'productionAutomaticRefreshEnabled':False})
  print""")
p.write_bytes(s.encode())
p=p.parent/'check-subject-country-spw-fin-r1.mjs';s=p.read_text(encoding='utf-8');s="import {createHash} from 'node:crypto';\n"+s;s=s.replace("const env={ASSETS:{fetch:async()=>Response.json(snapshot)}", "const snapshotRaw=fs.readFileSync(new URL('../content/world/world-country-public-evidence-r1.json',import.meta.url));const env={ASSETS:{fetch:async(input)=>{const u=typeof input==='string'?input:input.url;if(u.includes('evidence-current.json'))return Response.json({schemaVersion:'WORLD_COUNTRY_EVIDENCE_POINTER_V1',owner:'WORLD_EVIDENCE',snapshotPath:'content/world/world-country-public-evidence-r1.json',sha256:createHash('sha256').update(snapshotRaw).digest('hex')});if(u.includes('refresh-status.json'))return Response.json({status:'SUCCESS'});return new Response(snapshotRaw);}}")
p.write_bytes(s.encode())
