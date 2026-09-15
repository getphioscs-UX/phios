# W70 Ask checker

The six required Chinese questions and six English equivalents now have explicit test coverage. Existing 10-intent and 14 bilingual KAP/CKA/customer-renderer cases remain included.

| Required question | Selected context | Current result |
| --- | --- | --- |
| 为什么压力不会自动导致改变？ | Book I Pressure | Object not registered; resolver rejects rather than substitutes another mechanism |
| 为什么两个正常的人在一起会产生冲突？ | Book II mutual interference | Missing live definition; no structured answer fabricated |
| 一个 Runtime 为什么会慢慢退化？ | Book III runtime drift | Missing live definition; no structured answer fabricated |
| 恢复和回到原样有什么不同？ | Book III reintegration | Missing live definition; no structured answer fabricated |
| 为什么扩大规模会增加维护成本？ | Book IV structural cost | Existing article-summary evidence supports bounded short-answer projection |
| 什么时候扩展会进入新的尺度？ | Book IV scale transition | Existing article-summary evidence supports bounded short-answer projection |

A real relevance gap was fixed: EXPANSION now admits the selected Book IV MAINTENANCE_COST and SCALE_SHIFT classifications. The exception is limited to Book IV. Negative cases reject the same tag in Book III, unrelated recovery, and a generic capacity source. No definitions, classification vocabulary or generated source authority were added.

Ten registered-context cases exercise the real KAP pipeline through composition and customer projection. Two missing-pressure cases stop at entry resolution; they do not pretend to test a successful customer API answer. All source IDs stay bound to the selected object; speculative transition fields remain null. This is checker coverage, not a claim that all six questions now have complete semantic answers or that a live paid API campaign passed.

Forty source-verified meaning proposals still require consolidated semantic review and successor import. The missing Book I Pressure object is a separate extraction/admission gap. Current outcomes are deliberately asserted so future source import must update these fixtures explicitly rather than silently changing acceptance. Next W71 customer acceptance preparation; no human acceptance is granted here.
