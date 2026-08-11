# PHI OS Canonical Asset Production

Asset:
MECHANISM_DIAGRAM

Node:
KN-PREFACE-001

Locale:
zh-Hans

Purpose:
将 KN-PREFACE-001 已发布知识转化为受治理的机制图候选，不得增加新主张。

Knowledge Authority:
- KN-PREFACE-001
- Published Article Authority: content/knowledge/public/authority/articles/zh-Hans/KN-PREFACE-001.json

Meaning Authority:
- CM-DECISION-INTERNAL-RESPONSE
- Resolution mode: legacy_car_w2_pilot_bridge

The visual must establish:
1. 当人们谈论人工智能时，最容易注意到的是模型的生成能力、计算速度或对复杂任务的处理表现。
2. 人工智能首先依赖于知识能够被表达。
3. 然而，仅有知识表达仍不足以形成人工智能。
4. 在此基础上，人工智能进一步依赖于社会组织能力。
5. 随着人工智能不断被部署到更多场景，它又开始形成新的反馈机制。

Must include:
1. feedback_scaling
2. knowledge_expression
3. material_infrastructure
4. organizational_coordination
5. responsibility_boundary

Must not include:
1. 新增或推断未发布的知识主张
2. 专业结论或专业判断
3. 把 AI 或视觉资产表现为 Meaning / Knowledge / Publication Authority
4. 未在 Published Knowledge 中出现的因果关系
5. 未经明确允许的图中文字

Factual boundaries:
- No new claims
- No professional conclusion
- Published knowledge only

Visual contract:
```json
{
  "mode": "visual",
  "productionKind": "mechanism_diagram",
  "objective": "只表达 Published Knowledge 已建立的结构与关系，不补充未发布信息。",
  "relationshipPolicy": "do_not_add_unstated_causality",
  "textPolicy": "no_text_unless_explicitly_permitted",
  "sourceAssemblyCodes": [
    "ASSEMBLY-KN-PREFACE-001-ZH-HANS-CONTINUITY-CONTINUITY",
    "ASSEMBLY-KN-PREFACE-001-ZH-HANS-MECHANISM-FEEDBACK-SCALING",
    "ASSEMBLY-KN-PREFACE-001-ZH-HANS-MECHANISM-KNOWLEDGE-EXPRESSION",
    "ASSEMBLY-KN-PREFACE-001-ZH-HANS-MECHANISM-MATERIAL-INFRASTRUCTURE",
    "ASSEMBLY-KN-PREFACE-001-ZH-HANS-MECHANISM-ORGANIZATIONAL-COORDINATION",
    "ASSEMBLY-KN-PREFACE-001-ZH-HANS-MECHANISM-RESPONSIBILITY-BOUNDARY",
    "ASSEMBLY-KN-PREFACE-001-ZH-HANS-OVERVIEW-OVERVIEW",
    "ASSEMBLY-KN-PREFACE-001-ZH-HANS-THEME-TH-PREFACE-01"
  ]
}
```

PDS constraints:
- assets/css/tokens.css
- content/registry/pds-w2-design-token-contract.json

Accessibility:
- 提供简洁、非装饰性的替代文字。
- 不得只依赖颜色表达差异。
- 关键关系必须在无颜色条件下仍可理解。

Output:
- candidate image only
- no publication authority
- do not invent missing content
- do not add text unless explicitly permitted

