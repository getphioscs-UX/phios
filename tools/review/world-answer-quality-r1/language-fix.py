from pathlib import Path
p=Path('assets/customer-ui/js/surfaces/ric-world-session-panel.js');s=p.read_text(encoding='utf-8')
s=s.replace('${esc(s.observationPeriod)}${s.publishedAt?', '${esc(/^\\d{4}/.test(s.observationPeriod)?s.observationPeriod:t("一般机制解释","General mechanism"))}${s.publishedAt?')
s=s.replace('<p>${esc(s.methodology)}</p>', '')
p.write_bytes(s.encode())
