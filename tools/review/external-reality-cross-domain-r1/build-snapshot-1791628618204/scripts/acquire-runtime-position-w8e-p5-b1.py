import argparse, datetime, hashlib, html, json, pathlib, re, time, urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
BASE = ROOT / 'content/civilization-atlas/reconfiguration'
MANIFEST = BASE / 'runtime-position-w8e-p5-b1-primary-filing-manifest-v1.json'
OUTPUT = BASE / 'runtime-position-w8e-p5-b1-acquisition-receipt-v1.json'

def verify(data, row):
    text = data.decode('utf-8-sig')
    flat = re.sub(r'<[^>]+>', ' ', text)
    flat = re.sub(r'\s+', ' ', flat)
    if len(data) < 100000 or not re.search(r'FORM\s+10\s*[-–]?\s*K', flat, re.I):
        raise ValueError('Not a complete 10-K HTML document')
    checks = {'DocumentType': '10-K', 'DocumentPeriodEndDate': row['periodEnd'],
              'EntityCentralIndexKey': row['cik']}
    for key, expected in checks.items():
        match = re.search(r'<ix:nonNumeric\b[^>]*name=[\"\x27]dei:' + key + r'[\"\x27][^>]*>(.*?)</ix:nonNumeric>', text, re.I|re.S)
        actual = None
        if match:
            parts = [match.group(1)]
            tag = match.group(0).split('>', 1)[0]
            seen = set()
            while True:
                ref = re.search(r'continuedAt=[\"\x27]([^\"\x27]+)', tag, re.I)
                if not ref:
                    break
                ident = ref.group(1)
                if ident in seen:
                    raise ValueError('Continuation cycle')
                seen.add(ident)
                cont = re.search(r'<ix:continuation\b[^>]*id=[\"\x27]' + re.escape(ident) + r'[\"\x27][^>]*>(.*?)</ix:continuation>', text, re.I|re.S)
                if not cont:
                    raise ValueError('Missing continuation')
                parts.append(cont.group(1))
                tag = cont.group(0).split('>', 1)[0]
            actual = html.unescape(re.sub(r'<[^>]+>', '', ' '.join(parts)))
            actual = re.sub(r'\s+', ' ', actual).strip()
            if key == 'DocumentPeriodEndDate' and actual != expected:
                if not re.search(r'\d{4}', actual):
                    year = re.search(r'<ix:nonNumeric\b[^>]*name=[\"\x27]dei:DocumentFiscalYearFocus[\"\x27][^>]*>(.*?)</ix:nonNumeric>', text, re.I|re.S)
                    if not year:
                        raise ValueError('Missing fiscal year for split date fact')
                    year_value = re.sub(r'<[^>]+>', '', year.group(1)).strip()
                    actual = actual.rstrip(', ') + ', ' + year_value
                actual = datetime.datetime.strptime(actual, '%B %d, %Y').date().isoformat()
        if key == 'EntityCentralIndexKey' and actual:
            actual = actual.zfill(10)
        if actual != expected:
            raise ValueError(f'{key} mismatch: {actual!r} != {expected!r}')
    return hashlib.sha256(data).hexdigest()

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--user-agent', help='Real organization/name and contact email for SEC requests')
    parser.add_argument('--check', action='store_true', help='Offline verification only')
    args = parser.parse_args()
    manifest = json.loads(MANIFEST.read_text(encoding='utf-8-sig'))
    if not args.check and not args.user_agent:
        parser.error('--user-agent is required for downloading')
    previous = json.loads(OUTPUT.read_text()) if OUTPUT.exists() else {'records': []}
    old = {r['sourceId']: r for r in previous['records']}
    records = []
    for row in manifest['records']:
        dest = BASE / 'p5-b1-filings' / row['file']
        result = dict(row)
        try:
            if args.check:
                data = dest.read_bytes()
                sha = verify(data, row)
                if old.get(row['sourceId'], {}).get('sha256') != sha:
                    raise ValueError('Receipt hash missing or mismatched')
                result = old[row['sourceId']]
            else:
                if dest.exists():
                    data = dest.read_bytes()
                    sha = verify(data, row)
                    if old.get(row['sourceId'], {}).get('sha256') != sha:
                        raise ValueError('Existing file lacks matching receipt; no overwrite')
                    result = old[row['sourceId']]
                else:
                    req = urllib.request.Request(row['url'], headers={'User-Agent': args.user_agent, 'Accept': 'text/html'})
                    with urllib.request.urlopen(req, timeout=45) as response:
                        if response.geturl() != row['url']:
                            raise ValueError('Unexpected redirect; inspect source manually')
                        data = response.read(30000001)
                    if len(data) > 30000000:
                        raise ValueError('Document exceeds 30 MB acquisition limit')
                    sha = verify(data, row)
                    dest.parent.mkdir(parents=True, exist_ok=True)
                    temp = dest.with_suffix('.tmp')
                    temp.write_bytes(data)
                    temp.replace(dest)
                    result.update(state='RAW_PRIMARY_FILING_ACQUIRED', sha256=sha, bytes=len(data),
                                  retrievedAt=datetime.datetime.now(datetime.timezone.utc).isoformat())
                    time.sleep(0.3)
            print('PASS', row['sourceId'])
        except Exception as error:
            result.update(state='ACQUISITION_FAILED', error=str(error))
            print('FAIL', row['sourceId'], str(error))
        records.append(result)
    count = sum(r.get('state') == 'RAW_PRIMARY_FILING_ACQUIRED' for r in records)
    receipt = {'version':'1.0.0','work':'R1-W8E-P5-B1',
               'status':'RAW_ACQUISITION_COMPLETE_B2_PENDING' if count == 15 else 'RAW_ACQUISITION_INCOMPLETE',
               'completed':{'filingsAcquired':count,'filingsRequired':15,'g14Candidates':0,
                            'dossierGlobalPromotions':0,'runtimePositionCandidates':0},
               'records':records,'boundary':'Raw source acquisition only; W8A/B/C/D admission and B2 comparability remain pending.'}
    if not args.check:
        OUTPUT.write_text(json.dumps(receipt, indent=2)+'\n', encoding='utf-8')
    print(f'B1: {count}/15 verified; G14=0; RP=0')
    raise SystemExit(0 if count == 15 else 1)

if __name__ == '__main__':
    main()
