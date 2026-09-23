## PHI OS｜GUIDED REPORT SUCCESSOR R2

## ADDENDUM E｜LICENSED EXPLANATORY AUTHORITY + EVIDENCE-ADAPTIVE T3

```
BASELINE:
49ed9d132c668b309808919d001a05784c165d83

PRODUCTION:
UNCHANGED

CURRENT STAGE:
SHADOW

BAZI_R2_T3_ACCEPTED:
false

BAZI_PRODUCTION_SUCCESSOR_ACTIVE:
false
```

### E-W0｜Freeze existing fail-closed behavior

不得降低：

```
semantic verifier
editorial validator
one-repair ceiling
T2 fallback
snapshot digest binding
bilingual parity gate
human acceptance gate
canary gate
```

不得为了通过而：

```
accept unsupported causal claims
accept invented development sequence
accept inferred customer behavior
accept new counterexamples
```

---

### E-W1｜Add Licensed Explanatory Authority

新增 version：

```
BAZI_EXPLANATORY_AUTHORITY_V1
```

不得建立第二套 BaZi engine。

输入必须来自现有：

```
professionalModules.tenGods
professionalModules.dayMasterStrength
professionalModules.relationships
professionalModules.pattern
professionalModules.wholeChartPriority
professionalModules.professionalTopics
professionalModules.professionalTimeline
professionalModules.customerNarrative
```

---

### E-W2｜Create `BaZiNarrativeClaimIR`

每条 claim 必须拥有：

```
id
sectionKey
domain
subject
relationType
objects
rank
modality
sourceRefs

allowParaphrase
allowConditionalLanguage
allowCausalLanguage
allowSequenceLanguage
allowManifestation
allowObservedRealityClaim
```

默认：

```
allowCausalLanguage = false
allowSequenceLanguage = false
allowObservedRealityClaim = false
```

---

### E-W3｜Define relation ontology

至少：

```
EMPHASIS
ASSOCIATION
CO_OCCURRING_DIMENSIONS
CONTEXT_MODIFIER
SUPPORT_CONDITION
TENSION
CONTRAST
OPEN_CONDITION
COUNTER_SIGNAL
TEMPORAL_RELEVANCE
CROSS_SECTION_RELEVANCE
BOUNDARY
```

不得把：

```
ASSOCIATION
```

自动升级成：

```
CAUSE
```

不得把：

```
CO_OCCURRING_DIMENSIONS
```

自动升级成：

```
SEQUENCE
```

---

### E-W4｜Build SectionEvidencePack V3

替换 T3 使用的 v2 pack。

加入：

```
licensedClaims
licensedRelations
primaryThemes
secondaryThemes
manifestationLicenses
reflectionQuestions
temporalClaims
prohibitedOperators
```

保留：

```
canonicalFacts
openConditions
counterSignals
source lineage
temporal snapshot
```

---

### E-W5｜Fix evidence/schema contradiction

当前：

```
prompt allows empty
validator rejects empty
```

必须消除。

所有 list minimum 改成：

```
evidence-adaptive
```

不得为了满足 schema 强迫模型填充不存在的解释。

---

### E-W6｜Separate claims from questions

输出 schema 改为明确区分：

```
CUSTOMER_CLAIM
OBSERVATION_PROMPT
COUNTER_PROMPT
BOUNDARY
TECHNICAL_NOTE
```

`OBSERVATION_PROMPT`：

```
is not customer reality
is not evidence
is not an inferred event
```

---

### E-W7｜Manifestation gate

只有：

```
manifestationLicenses.length > 0
```

才要求：

```
howThisMayShowUp
```

否则：

```
howThisMayShowUp = []
```

使用：

```
observationPrompt
```

替代。

---

### E-W8｜Rewrite Composer Contract

Composer 只能执行：

```
PARAPHRASE
PLAIN_LANGUAGE_ABSTRACTION
RANK_PRESERVING_SUMMARY
CONDITIONAL_REFRAME
CONTRAST
QUESTION_GENERATION
```

禁止自行执行：

```
CAUSE
SEQUENCE
BEHAVIORAL_EFFECT
EVENT_INFERENCE
REALITY_ASSERTION
```

---

### E-W9｜Upgrade verifier

Verifier 优先检查：

```
candidate relation operator
vs
licensed relation operator
```

例如：

```
licensed = CO_OCCURRING_DIMENSIONS
candidate = ordered development
→ UNLICENSED_SEQUENCE
```

```
licensed = CONTEXT_MODIFIER
candidate = produces better performance
→ UNLICENSED_CAUSAL
```

---

### E-W10｜Structured defect taxonomy

至少建立：

```
UNLICENSED_CAUSAL
UNLICENSED_SEQUENCE
UNLICENSED_MANIFESTATION
COUNTERSIGNAL_EXPANSION
QUESTION_TO_FACT_PROMOTION
PAIRWISE_RELATION_COLLAPSE
RANK_FLATTENING
RANK_INVERSION
TECHNICAL_LANGUAGE_LEAK
REALITY_INFERENCE
```

Repair 使用这些 machine-readable defect。

---

### E-W11｜First gate = S02 only

不要马上跑 216-case matrix。

先要求：

```
BASELINE_NOW
EN S02 PASS
ZH S02 PASS
```

且：

```
no unsupportedClaims
no scopeViolations
no factConflicts
no terminologyIssues
editorial PASS
```

完成后再测试：

```
HIGH_EVIDENCE S02
LOW_EVIDENCE S02
MIXED S02
```

---

### E-W12｜Expand section by section

顺序：

```
S02 Personality
↓
S03 Life Structure
↓
S04 Career
↓
S05 Wealth
↓
S06 Relationships
↓
S07 Wellbeing
↓
S08 Timing
↓
S09 Guidance
```

每一章通过后再进入下一章。

---

### E-W13｜Timing authority enrichment

直接使用已经 admitted 的：

```
BAZI-CX-PRO-DA-YUN-LIU-NIAN-PROFESSIONAL-TIMELINE
```

生成 method-owned：

```
natalPriorityRelations
daYunRelevance
annualRelevance
crossLayerRelevance
topicTemporalRelevance
```

不得生成：

```
event certainty
good/bad prediction
guaranteed opportunity
guaranteed warning
```

---

### E-W14｜Guidance authority enrichment

使用：

```
Whole Chart Priority Engine
Professional Topic Reading
Professional Timeline
```

先 deterministic 生成：

```
IntegratedGuidanceIR
```

再交 T3。

T3 不得自己决定：

```
which themes are connected
which one is primary
which timing matters
```

---

### E-W15｜Bilingual semantic parity

不要比较句子相似度。

比较：

```
claim IDs
relation types
rank
conditions
open conditions
counter signals
temporal relevance
boundaries
```

英文中文可以写得完全不同。

---

### E-W16｜Full shadow matrix

只有 baseline quality pass 后才运行：

```
12 profiles
×
2 locales
×
8 T3 sections
+
24 S01 deterministic controls
=
216 checks
```

必须保持当前 release-gate 数字。

---

### E-W17｜Human Review

Review 页面继续：

```
T2 CURRENT
|
T3 CANDIDATE
```

人工逐 section：

```
ACCEPT
REVISE
REJECT
```

必须绑定：

```
snapshotDigest
```

---

### E-W18｜Canary

只有：

```
all semantic
all editorial
bilingual parity
browser/PDF
human review
shadow matrix
```

全部 PASS 后才能进入：

```
CANARY
```

不得提前 production。

---

# 二十、最终你应该追求的架构

```
BaZi Engine
        ↓
Professional Reading Authority
        ↓
Licensed Explanatory Claim IR
        ↓
T3 Composer
        ↓
Strict Semantic Verifier
        ↓
Editorial Validator
        ↓
Publication R2
```
