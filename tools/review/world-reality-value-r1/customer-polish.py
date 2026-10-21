from pathlib import Path
p=Path('assets/customer-ui/js/surfaces/ric-world-session-panel.js');s=p.read_text(encoding='utf-8')
s=s.replace('<a href="/RIC-HUMAN-REVIEW.html">', '<details><summary>${t("关于这个本地版本","About this local version")}</summary><a href="/RIC-HUMAN-REVIEW.html">').replace("${t('返回人审入口','Back to Human Review')}</a>","${t('查看审阅记录','Review records')}</a></details>")
s=s.replace('正在查询现有 World 数据接口…','正在查找与你的问题有关的资料…').replace('Querying the existing World evidence endpoint…','Finding evidence relevant to your question…')
s=s.replace('回答已读取。默认没有选择或授权会话使用。','资料已读取；你可以继续了解，或整理自己的问题。').replace('Answer loaded. No selection or session permission is assumed.','Evidence loaded. Continue exploring, or clarify your own question.')
s=s.replace('来源、时间及指标定义','来源与适用范围').replace('Source, time and metric definition','Source and scope')
p.write_text(s,encoding='utf-8')
p=Path('tools/review/reality-information-contract-r1/L1/PRODUCT-LOCAL.html');s=p.read_text(encoding='utf-8').replace('RIC R3-L1 local product chain','PHI OS · World & My Reality');p.write_text(s,encoding='utf-8')
