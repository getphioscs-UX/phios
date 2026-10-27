import json,pathlib,hashlib
D=pathlib.Path('tools/review/hd-r6/import-20261027/r65');src=pathlib.Path('content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/source/HD-PRO-R3-W8-channel-source-structural-resolution-v1.json');end=json.loads(src.read_text())['channelEndpoints']
centers=[('HEAD','Head',[[300,28],[245,125],[355,125]],[300,82],'#e9c75d'),('AJNA','Ajna',[[240,166],[360,166],[300,263]],[300,202],'#a4c3a8'),('THROAT','Throat',[[240,300],[360,300],[360,400],[240,400]],[300,350],'#d2ac86'),('G','Identity',[[300,429],[372,501],[300,573],[228,501]],[300,504],'#ecd981'),('EGO','Ego',[[401,446],[453,523],[371,523]],[411,492],'#e0a2a0'),('SPLEEN','Spleen',[[80,482],[202,608],[80,650]],[123,585],'#b9c7a4'),('SOLAR_PLEXUS','Emotional',[[520,482],[398,608],[520,650]],[474,585],'#d3b38e'),('SACRAL','Sacral',[[240,628],[360,628],[360,733],[240,733]],[300,683],'#dfaba1'),('ROOT','Root',[[240,780],[360,780],[360,870],[240,870]],[300,828],'#bcaa92')]
layout={'HEAD':{64:(267,111),61:(300,111),63:(333,111)},'AJNA':{47:(259,179),24:(300,179),4:(341,179),17:(263,207),43:(300,244),11:(337,207)},'THROAT':{62:(258,313),23:(300,313),56:(342,313),16:(253,340),20:(253,365),31:(258,386),8:(300,386),33:(342,386),35:(347,338),12:(347,362),45:(347,383)},'G':{1:(300,449),13:(332,481),25:(352,501),46:(332,531),2:(300,554),15:(268,531),10:(248,501),7:(268,481)},'EGO':{21:(402,468),51:(419,489),26:(388,510),40:(435,510)},'SPLEEN':{48:(94,512),57:(117,545),44:(144,574),50:(177,606),32:(147,620),28:(119,629),18:(94,636)},'SOLAR_PLEXUS':{36:(506,512),22:(483,545),37:(456,574),6:(423,606),49:(453,620),55:(481,629),30:(506,636)},'SACRAL':{5:(258,642),14:(300,642),29:(342,642),59:(346,677),9:(342,718),3:(300,718),42:(258,718),27:(253,701),34:(253,668)},'ROOT':{53:(258,793),60:(300,793),52:(342,793),54:(253,816),38:(253,836),58:(253,856),19:(347,816),39:(347,836),41:(347,856)}}
layout['THROAT'][31]=(278,386);layout['THROAT'][33]=(322,386);layout['SACRAL'][27]=(253,692)
gates={str(g):{'x':x,'y':y,'center':c} for c,a in layout.items() for g,(x,y) in a.items()};assert set(map(int,gates))==set(range(1,65))
channels=[]
for c in end:
 assert gates[str(c['gateA'])]['center']==c['centerA'] and gates[str(c['gateB'])]['center']==c['centerB'],c
 channels.append({'id':c['channelId'],'gates':[c['gateA'],c['gateB']],'centers':[c['centerA'],c['centerB']],'ownerId':c['sourceUnitId']})
routes={frozenset([12,22]):[[465,410],[485,470]],frozenset([26,44]):[[390,580],[220,580]],frozenset([20,34]):[[215,414],[215,590]]}
for ch in channels:
 points=[gates[str(g)] for g in ch['gates']];via=routes.get(frozenset(ch['gates']),[])
 if via and ch['gates'][0] in [22,44,34]:via=list(reversed(via))
 ch['route']=[[points[0]['x'],points[0]['y']],*via,[points[1]['x'],points[1]['y']]]
centerrows=[dict(id=i,name=n,points=p,label=l,fill=f) for i,n,p,l,f in centers]
for row in centerrows:
 if row['id']=='EGO':row['label']=[454,460]
 if row['id']=='SPLEEN':row['label']=[35,595]
 if row['id']=='SOLAR_PLEXUS':row['label']=[559,595]
r={'version':'HD-R65-ORIGINAL-VECTOR-REVIEW-v1','sourceEndpointOwner':str(src),'sourceEndpointSHA256':hashlib.sha256(src.read_bytes()).hexdigest(),'coordinateConvention':'Original PHI OS geometry; conventional relative centers and gate ports. Explicit routes avoid passing through unrelated Centers. No purchased artwork copied. Exact endpoint membership cross-checked against existing owner.','centers':centerrows,'gates':gates,'channels':channels,'commercialApproved':False}
(D/'BODYGRAPH-GEOMETRY.json').write_text(json.dumps(r,indent=2)+'\n');print({'centers':len(centers),'gates':len(gates),'channels':len(channels)})
