var Ye=()=>document.documentElement.lang==="zh-Hans"?"zh-Hans":"en",t=(n,r)=>Ye()==="zh-Hans"?r:n,e=n=>String(n??"").replace(/[&<>"']/g,r=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[r]),c=n=>Array.isArray(n)?n:[];var Be={WOOD:["Wood","\u6728"],FIRE:["Fire","\u706B"],EARTH:["Earth","\u571F"],METAL:["Metal","\u91D1"],WATER:["Water","\u6C34"]},Ve={YANG:["Yang","\u9633"],YIN:["Yin","\u9634"]},Fe={YEAR:["Year pillar","\u5E74\u67F1"],MONTH:["Month pillar","\u6708\u67F1"],DAY:["Day pillar","\u65E5\u67F1"],HOUR:["Hour pillar","\u65F6\u67F1"]},We={GOVERNED_CHART:["Confirmed","\u5DF2\u786E\u8BA4"],SUPPORTED:["Confirmed","\u5DF2\u786E\u8BA4"],QUALIFIED:["Read with conditions","\u6709\u6761\u4EF6\u9605\u8BFB"],BOUNDED_BY_UNKNOWN:["No strong conclusion yet","\u6682\u4E0D\u4F5C\u5F3A\u5224\u65AD"],ALTERNATIVES_OPEN:["No strong conclusion yet","\u6682\u4E0D\u4F5C\u5F3A\u5224\u65AD"],SCHOOL_VIEW_OPEN:["Different school readings","\u5B58\u5728\u4E0D\u540C\u5B66\u6D3E\u89E3\u91CA"],COUNTERBALANCED:["No strong conclusion yet","\u6682\u4E0D\u4F5C\u5F3A\u5224\u65AD"],PARTIAL:["No strong conclusion yet","\u6682\u4E0D\u4F5C\u5F3A\u5224\u65AD"],OPEN:["No strong conclusion yet","\u6682\u4E0D\u4F5C\u5F3A\u5224\u65AD"]},ke={CAI:["Wealth pattern candidate","\u8D22\u683C\u5019\u9009"],QI_SHA:["Seven-Killings pattern candidate","\u4E03\u6740\u683C\u5019\u9009"],YIN:["Resource pattern candidate","\u5370\u683C\u5019\u9009"],ZHENG_GUAN:["Officer pattern candidate","\u6B63\u5B98\u683C\u5019\u9009"],SHI_SHEN:["Eating-God pattern candidate","\u98DF\u795E\u683C\u5019\u9009"],SHANG_GUAN:["Hurting-Officer pattern candidate","\u4F24\u5B98\u683C\u5019\u9009"],PEER_MONTH_COMMAND_REQUIRES_SPECIAL_RULE:["Jian Lu / Month-Rob special path","\u5EFA\u7984\uFF0F\u6708\u52AB\u7279\u522B\u8DEF\u7EBF"]},Ke={SHUN_USE:["Supportive-use path","\u987A\u7528"],NI_USE:["Counterbalancing-use path","\u9006\u7528"],SPECIAL_JIANLU_YUEJIE_REVIEW:["Special Jian Lu / Month-Rob review","\u5EFA\u7984\uFF0F\u6708\u52AB\u7279\u522B\u6838\u5BF9"]},je={OFFICER_WITH_WEALTH_OR_RESOURCE:["Officer supported by Wealth / Resource","\u5B98\u683C\u7EE7\u7EED\u770B\u8D22\u3001\u5370\u600E\u6837\u652F\u6301\uFF0C\u540C\u65F6\u6838\u5BF9\u5211\u51B2\u7834\u5BB3\u662F\u5426\u4ECB\u5165\u3002"],WEALTH_GENERATES_OFFICER:["Wealth generating Officer","\u8D22\u661F\u4E0E\u5B98\u6740\u540C\u65F6\u51FA\u73B0\uFF0C\u5F62\u6210\u300C\u8D22\u751F\u5B98\u300D\u8FD9\u4E00\u6761\u53EF\u7EE7\u7EED\u6838\u5BF9\u7684\u6210\u683C\u8DEF\u5F84\u3002"],WEALTH_RECEIVES_OUTPUT_WITH_CARRYING_SUPPORT:["Output generating Wealth with carrying support","\u98DF\u4F24\u4E0E\u8D22\u540C\u65F6\u51FA\u73B0\uFF0C\u540C\u65F6\u8FD8\u8981\u770B\u65E5\u4E3B\u627F\u8F7D\u662F\u5426\u8DB3\u4EE5\u652F\u6301\u300C\u98DF\u4F24\u751F\u8D22\u300D\u7684\u8DEF\u5F84\u3002"],WEALTH_RESOURCE_POSITIONAL_ORDER:["Wealth and Resource in workable order","\u8D22\u4E0E\u5370\u540C\u65F6\u51FA\u73B0\uFF0C\u4F46\u5173\u952E\u4E0D\u53EA\u662F\u300C\u90FD\u6709\u300D\uFF0C\u8FD8\u8981\u6838\u5BF9\u67F1\u4F4D\u4E0E\u5F7C\u6B64\u963B\u788D\u3002"],RESOURCE_WITH_OFFICER_OR_SEVEN_KILLINGS:["Resource with Officer / Seven Killings","\u5370\u4E0E\u5B98\u6740\u540C\u65F6\u8FDB\u5165\u7ED3\u6784\uFF0C\u662F\u5370\u683C\u53EF\u7EE7\u7EED\u6838\u5BF9\u7684\u4E00\u6761\u8DEF\u5F84\u3002"],RESOURCE_WITH_OUTPUT:["Resource with Output","\u5370\u4E0E\u98DF\u4F24\u540C\u65F6\u51FA\u73B0\uFF0C\u9700\u8981\u7EE7\u7EED\u770B\u5B83\u4EEC\u5982\u4F55\u5F7C\u6B64\u627F\u63A5\u6216\u7275\u5236\u3002"],RESOURCE_WEALTH_CONTROLLED_USE:["Resource with controlled Wealth use","\u5370\u4E0E\u8D22\u540C\u65F6\u51FA\u73B0\u65F6\uFF0C\u8FD8\u8981\u6838\u5BF9\u4F4D\u7F6E\u3001\u627F\u8F7D\u4E0E\u662F\u5426\u76F4\u63A5\u76F8\u788D\u3002"],EATING_GOD_GENERATES_WEALTH:["Eating God generating Wealth","\u98DF\u795E\u4E0E\u8D22\u540C\u65F6\u51FA\u73B0\uFF0C\u662F\u300C\u98DF\u795E\u751F\u8D22\u300D\u8FD9\u4E00\u6761\u53EF\u7EE7\u7EED\u6838\u5BF9\u7684\u6210\u683C\u8DEF\u5F84\u3002"],OUTPUT_SEVEN_KILLINGS_RESOURCE_PATH:["Output \xD7 Seven Killings \xD7 Resource","\u98DF\u3001\u6740\u3001\u5370\u540C\u65F6\u8FDB\u5165\u7ED3\u6784\u65F6\uFF0C\u9700\u8981\u7EE7\u7EED\u6838\u5BF9\u4E09\u8005\u7684\u5B9E\u9645\u4F5C\u7528\u987A\u5E8F\u3002"],SEVEN_KILLINGS_WITH_CONTROL_AND_CARRYING:["Seven Killings with control and carrying support","\u4E03\u6740\u683C\u8981\u540C\u65F6\u770B\u65E5\u4E3B\u627F\u8F7D\uFF0C\u4EE5\u53CA\u98DF\u4F24\u7B49\u5236\u6740\u8DEF\u5F84\u662F\u5426\u771F\u6B63\u6709\u6548\u3002"],HURTING_OFFICER_GENERATES_WEALTH:["Hurting Officer generating Wealth","\u4F24\u5B98\u4E0E\u8D22\u540C\u65F6\u51FA\u73B0\uFF0C\u662F\u300C\u4F24\u5B98\u751F\u8D22\u300D\u8FD9\u4E00\u6761\u53EF\u7EE7\u7EED\u6838\u5BF9\u7684\u8DEF\u5F84\u3002"],HURTING_OFFICER_WITH_RESOURCE:["Hurting Officer with Resource","\u4F24\u5B98\u4E0E\u5370\u540C\u65F6\u51FA\u73B0\u65F6\uFF0C\u9700\u8981\u7EE7\u7EED\u770B\u5370\u662F\u5426\u771F\u6B63\u5F62\u6210\u8C03\u8282\u4E0E\u627F\u63A5\u3002"],JIANLU_YUEJIE_SELECT_EXTERNAL_OPERATIVE_FACTOR:["Jian Lu / Month-Rob selects another operative factor","\u5EFA\u7984\uFF0F\u6708\u52AB\u4E0D\u80FD\u53EA\u4EE5\u6BD4\u52AB\u672C\u8EAB\u5B9A\u683C\uFF0C\u8981\u4ECE\u8D22\u3001\u5B98\u6740\u3001\u98DF\u4F24\u7B49\u5B9E\u9645\u7ED3\u6784\u4E2D\u53E6\u53D6\u4F5C\u7528\u8DEF\u5F84\u3002"]},Ze={UPSTREAM_PRIMARY_ESTABLISHED:["Established by the pattern verdict","\u4E0A\u6E38\u683C\u5C40\u5224\u65AD\u5DF2\u7ECF\u6B63\u5F0F\u5EFA\u7ACB\u8FD9\u6761\u4E3B\u8DEF\u5F84\u3002"],VISIBLE_SUPPORT_PATH:["Visible structural support","\u672C\u76D8\u5DF2\u7ECF\u770B\u89C1\u8FD9\u6761\u6210\u683C\u8DEF\u5F84\u7684\u4E3B\u8981\u7ED3\u6784\uFF0C\u4F46\u4ECD\u9700\u4FDD\u7559\u6210\u8D25\u6551\u5E94\u6838\u5BF9\u3002"],POSITIONAL_CONDITION_REQUIRES_REVIEW:["Factors visible; position still matters","\u76F8\u5173\u56E0\u7D20\u5DF2\u7ECF\u51FA\u73B0\uFF0C\u4F46\u662F\u5426\u6210\u7ACB\u4ECD\u53D6\u51B3\u4E8E\u67F1\u4F4D\u4E0E\u5F7C\u6B64\u4F5C\u7528\u3002"],RELATIONSHIP_CONDITION_REQUIRES_REVIEW:["Relationship modifier needs review","\u76F8\u5173\u56E0\u7D20\u5DF2\u7ECF\u51FA\u73B0\uFF0C\u4F46\u6708\u4EE4\u9644\u8FD1\u540C\u65F6\u6709\u5408\u51B2\u5211\u5BB3\u7B49\u7ED3\u6784\u4FEE\u6B63\u3002"],CARRYING_CONDITION_OPEN:["Day-Master carrying condition remains open","\u8DEF\u5F84\u6240\u9700\u56E0\u7D20\u5B58\u5728\uFF0C\u4F46\u65E5\u4E3B\u627F\u8F7D\u6761\u4EF6\u4ECD\u4E0D\u8DB3\u4EE5\u6B63\u5F0F\u786E\u8BA4\u3002"],REQUIRED_FACTOR_NOT_VISIBLE:["Required factor not foregrounded","\u8FD9\u6761\u8DEF\u5F84\u6240\u9700\u7684\u5173\u952E\u56E0\u7D20\u76EE\u524D\u6CA1\u6709\u5728\u672C\u76D8\u7ED3\u6784\u4E2D\u524D\u666F\u5316\u3002"]},Xe={HURTING_OFFICER_REVIEW:["Hurting Officer needs review","\u4F24\u5B98\u5DF2\u7ECF\u8FDB\u5165\u7ED3\u6784\uFF0C\u9700\u8981\u7EE7\u7EED\u6838\u5BF9\u662F\u5426\u5BF9\u5B98\u683C\u5F62\u6210\u7834\u574F\u6761\u4EF6\u3002"],MONTH_COMMAND_TENSION_REVIEW:["Month-command tension needs review","\u6708\u4EE4\u9644\u8FD1\u5DF2\u7ECF\u5B58\u5728\u51B2\u3001\u5211\u3001\u5BB3\u3001\u7834\u7B49\u5F20\u529B\u5173\u7CFB\uFF0C\u9700\u8981\u8FDB\u5165\u8D25\u683C\uFF0F\u53D8\u5316\u6761\u4EF6\u6838\u5BF9\u3002"],PEER_COMPETITION_REVIEW:["Peer competition needs review","\u6BD4\u52AB\u7ED3\u6784\u5DF2\u7ECF\u51FA\u73B0\uFF0C\u9700\u8981\u7EE7\u7EED\u6838\u5BF9\u662F\u5426\u8FBE\u5230\u5F71\u54CD\u8D22\u683C\u7684\u7A0B\u5EA6\u3002"],EXPOSED_SEVEN_KILLINGS_REVIEW:["Visible Seven Killings needs review","\u4E03\u6740\u5DF2\u7ECF\u900F\u51FA\uFF0C\u9700\u8981\u7EE7\u7EED\u6838\u5BF9\u5B83\u4E0E\u8D22\u683C\u662F\u652F\u6301\u3001\u8F6C\u5316\u8FD8\u662F\u5F62\u6210\u7834\u574F\u6761\u4EF6\u3002"],WEALTH_RESOURCE_RELATION_REVIEW:["Wealth\u2013Resource relation needs review","\u8D22\u4E0E\u5370\u540C\u65F6\u51FA\u73B0\uFF0C\u9700\u8981\u7EE7\u7EED\u6838\u5BF9\u662F\u5426\u5F62\u6210\u76F8\u788D\u3002"],INDIRECT_RESOURCE_REVIEW:["Indirect Resource needs review","\u504F\u5370\u5DF2\u7ECF\u51FA\u73B0\uFF0C\u9700\u8981\u7EE7\u7EED\u6838\u5BF9\u662F\u5426\u8FDB\u5165\u300C\u67AD\u593A\u98DF\u300D\u7B49\u5177\u4F53\u6761\u4EF6\u3002"],WEALTH_WITH_SEVEN_KILLINGS_REVIEW:["Wealth with Seven Killings needs review","\u8D22\u4E0E\u4E03\u6740\u540C\u65F6\u8FDB\u5165\u7ED3\u6784\uFF0C\u9700\u8981\u7EE7\u7EED\u6838\u5BF9\u662F\u5426\u52A0\u5F3A\u672A\u53D7\u5236\u7684\u4E03\u6740\u3002"],CONTROL_PATH_REVIEW:["Control path needs review","\u5236\u6740\u8DEF\u5F84\u76EE\u524D\u4E0D\u6E05\u695A\uFF0C\u4E0D\u80FD\u53EA\u51ED\u4E03\u6740\u51FA\u73B0\u5C31\u5BA3\u5E03\u6210\u683C\u3002"],OFFICER_RELATION_REVIEW:["Officer relation needs review","\u5B98\u6740\u540C\u65F6\u8FDB\u5165\u7ED3\u6784\uFF0C\u9700\u8981\u7EE7\u7EED\u6838\u5BF9\u4E0E\u4F24\u5B98\u4E4B\u95F4\u7684\u5B9E\u9645\u4F5C\u7528\u3002"],SPECIAL_PATH_REVIEW:["Special Jian Lu / Month-Rob review","\u5EFA\u7984\uFF0F\u6708\u52AB\u5FC5\u987B\u8D70\u4E13\u5C5E\u6210\u8D25\u8DEF\u5F84\uFF0C\u4E0D\u80FD\u6309\u666E\u901A\u6BD4\u52AB\u683C\u76F4\u63A5\u5957\u7528\u3002"]},qe={UPSTREAM_PRIMARY:["Primary pattern established","\u4E3B\u683C\u5DF2\u5EFA\u7ACB"],VISIBLE_MONTH_COMMAND_CANDIDATE:["Visible month-command path","\u6708\u4EE4\u5019\u9009\u4E14\u5DF2\u900F\u5E72"],PRIMARY_HIDDEN_MONTH_COMMAND_CANDIDATE:["Primary hidden-stem path","\u6708\u4EE4\u4E3B\u85CF\u5E72\u8DEF\u5F84"],HIDDEN_MONTH_COMMAND_CANDIDATE:["Hidden month-command path","\u6708\u4EE4\u85CF\u5E72\u5019\u9009"]},Qe={ZHENG_GUAN:["Officer-pattern reading focuses on how standards, responsibility and order become workable through support from Wealth or Resource, while checking whether disruptive relations undermine that structure.","\u6B63\u5B98\u683C\u8BFB\u53D6\u7684\u91CD\u70B9\uFF0C\u662F\u89C4\u5219\u3001\u8D23\u4EFB\u4E0E\u79E9\u5E8F\u600E\u6837\u5728\u8D22\u6216\u5370\u7684\u652F\u6301\u4E0B\u5F62\u6210\u53EF\u627F\u63A5\u7ED3\u6784\uFF0C\u540C\u65F6\u6838\u5BF9\u51B2\u5211\u7834\u5BB3\u662F\u5426\u7834\u574F\u8FD9\u6761\u8DEF\u5F84\u3002"],CAI:["Wealth-pattern reading is not a money-outcome label. It asks how resource exchange and management connect with Officer, Output or Resource structures inside the whole chart.","\u8D22\u683C\u4E0D\u662F\u300C\u4E00\u5B9A\u6709\u94B1\u300D\u7684\u7ED3\u679C\u6807\u7B7E\uFF0C\u800C\u662F\u770B\u8D44\u6E90\u4EA4\u6362\u4E0E\u7BA1\u7406\u600E\u6837\u548C\u5B98\u6740\u3001\u98DF\u4F24\u6216\u5370\u661F\u5728\u6574\u76D8\u91CC\u5F62\u6210\u53EF\u8FD0\u4F5C\u7ED3\u6784\u3002"],YIN:["Resource-pattern reading focuses on receiving, learning, support and carrying capacity, then checks how Officer, Output and Wealth alter that support structure.","\u5370\u683C\u91CD\u70B9\u770B\u5438\u6536\u3001\u5B66\u4E60\u3001\u652F\u6301\u4E0E\u627F\u63A5\u600E\u6837\u6210\u4E3A\u4E3B\u8F74\uFF0C\u518D\u6838\u5BF9\u5B98\u6740\u3001\u98DF\u4F24\u4E0E\u8D22\u600E\u6837\u6539\u53D8\u8FD9\u5957\u652F\u6301\u7ED3\u6784\u3002"],SHI_SHEN:["Eating-God pattern reading follows stable output, expression and production, especially whether that output can connect to Wealth or coordinate with Seven Killings and Resource.","\u98DF\u795E\u683C\u91CD\u70B9\u770B\u7A33\u5B9A\u8F93\u51FA\u3001\u8868\u8FBE\u4E0E\u751F\u4EA7\u600E\u6837\u5C55\u5F00\uFF0C\u5C24\u5176\u8981\u6838\u5BF9\u5B83\u80FD\u5426\u63A5\u5230\u8D22\uFF0C\u6216\u600E\u6837\u4E0E\u4E03\u6740\u3001\u5370\u5F62\u6210\u7ED3\u6784\u3002"],QI_SHA:["Seven-Killings pattern reading starts from pressure, standards and external force; the key is whether the Day Master can carry it and whether an effective control or transformation path exists.","\u4E03\u6740\u683C\u4ECE\u538B\u529B\u3001\u6807\u51C6\u4E0E\u5916\u90E8\u7EA6\u675F\u8FDB\u5165\uFF0C\u5173\u952E\u4E0D\u662F\u300C\u6709\u4E03\u6740\u300D\u672C\u8EAB\uFF0C\u800C\u662F\u65E5\u4E3B\u80FD\u5426\u627F\u8F7D\uFF0C\u4EE5\u53CA\u6709\u6CA1\u6709\u771F\u6B63\u6709\u6548\u7684\u5236\u5316\u8DEF\u5F84\u3002"],SHANG_GUAN:["Hurting-Officer pattern reading focuses on strong output, critique and differentiation, then tests whether Wealth or Resource can organize that output into a coherent structure.","\u4F24\u5B98\u683C\u91CD\u70B9\u770B\u5F3A\u8F93\u51FA\u3001\u8FA8\u522B\u4E0E\u7A81\u7834\u600E\u6837\u6210\u4E3A\u4E3B\u8F74\uFF0C\u518D\u6838\u5BF9\u8D22\u6216\u5370\u80FD\u5426\u628A\u8FD9\u79CD\u8F93\u51FA\u7EC4\u7EC7\u6210\u7A33\u5B9A\u7ED3\u6784\u3002"],PEER_MONTH_COMMAND_REQUIRES_SPECIAL_RULE:["Jian Lu / Month-Rob is a special month-command path. It does not stop at Peer structure; another operative factor must be selected from what the chart actually exposes.","\u5EFA\u7984\uFF0F\u6708\u52AB\u5C5E\u4E8E\u7279\u522B\u6708\u4EE4\u8DEF\u5F84\uFF0C\u4E0D\u80FD\u505C\u5728\u6BD4\u52AB\u672C\u8EAB\uFF1B\u5FC5\u987B\u4ECE\u547D\u76D8\u5B9E\u9645\u900F\u51FA\u4E0E\u53EF\u7528\u7684\u8D22\u3001\u5B98\u6740\u3001\u98DF\u4F24\u7B49\u7ED3\u6784\u4E2D\u53E6\u53D6\u4F5C\u7528\u56E0\u7D20\u3002"]},Je={BRANCH_CLASH:["Clash","\u51B2"],BRANCH_COMBINATION:["Combination","\u516D\u5408"],BRANCH_SIX_COMBINATION:["Six-combination","\u516D\u5408"],BRANCH_HARM:["Harm","\u5BB3"],BRANCH_BREAK:["Break","\u7834"],BRANCH_PUNISHMENT_PAIR:["Punishment","\u5211"],BRANCH_PUNISHMENT_GROUP:["Three-punishment","\u4E09\u5211"],BRANCH_SELF_PUNISHMENT:["Self-punishment","\u81EA\u5211"],BRANCH_THREE_HARMONY:["Three-harmony","\u4E09\u5408"],BRANCH_THREE_MEETING:["Three-meeting","\u4E09\u4F1A"],BRANCH_THREE_HARMONY_WITH_LIU_NIAN:["Three-harmony structure","\u4E09\u5408\u7ED3\u6784"],BRANCH_THREE_MEETING_WITH_LIU_NIAN:["Three-meeting structure","\u4E09\u4F1A\u7ED3\u6784"],BRANCH_THREE_PUNISHMENT_WITH_LIU_NIAN:["Three-punishment structure","\u4E09\u5211\u7ED3\u6784"],STEM_COMBINATION:["Stem combination","\u5929\u5E72\u5408"],STEM_REPEAT:["Stem repeat","\u5929\u5E72\u540C\u89C1"]},en={ZI_PING_MONTH_COMMAND_USE_v1:["Month command, pattern formation and operative factor","\u6708\u4EE4\u3001\u683C\u5C40\u6210\u8D25\u4E0E\u4F5C\u7528\u56E0\u7D20"],DI_TIAN_SUI_TI_YONG_BALANCE_v1:["Whole-chart weighting and structural balance","\u6574\u76D8\u504F\u91CD\u3001\u4F53\u7528\u4E0E\u7ED3\u6784\u5E73\u8861"],DI_TIAN_SUI_CLIMATE_TIAOHOU_v1:["Cold / warm / dry / wet climate adjustment","\u5BD2\u6696\u71E5\u6E7F\u7684\u8C03\u5019\u7EF4\u5EA6"]},nn="/assets/customer-ui/surfaces/bazi-professional-reading.css",tn={CHART:["Whole chart","\u6574\u5F20\u547D\u76D8"],FOUNDATION:["Foundation","\u547D\u5C40\u57FA\u7840"],RELATIONSHIPS:["Relationships","\u7ED3\u6784\u5173\u7CFB"],PATTERN:["Pattern","\u683C\u5C40"],SCHOOL_ZIPING:["Zi Ping","\u5B50\u5E73\u6708\u4EE4"],SCHOOL_TIYONG:["Ti-Yong","\u6EF4\u5929\u9AD3\u4F53\u7528"],SCHOOL_TIAOHOU:["Climate","\u5BD2\u6696\u71E5\u6E7F"],DA_YUN:["Da Yun","\u5927\u8FD0"],LIU_NIAN:["Liu Nian","\u6D41\u5E74"],OPEN_BOUNDARIES:["Open boundaries","\u4ECD\u5F85\u786E\u8BA4"]},rn={CHART:["One chart, read as a connected structure.","\u540C\u4E00\u5F20\u547D\u76D8\uFF0C\u4F5C\u4E3A\u5F7C\u6B64\u5173\u8054\u7684\u6574\u4F53\u6765\u8BFB\u3002"],FOUNDATION:["Day Master, month command, roots, Five Elements and Ten-God distribution.","\u65E5\u4E3B\u3001\u6708\u4EE4\u3001\u6839\u6C14\u3001\u4E94\u884C\u4E0E\u5341\u795E\u5171\u540C\u6784\u6210\u547D\u5C40\u57FA\u7840\u3002"],RELATIONSHIPS:["Stem and branch combinations, clashes, punishments, harms and breaks.","\u5408\u3001\u51B2\u3001\u5211\u3001\u5BB3\u3001\u7834\u7B49\u5E72\u652F\u5173\u7CFB\u5171\u540C\u6539\u53D8\u6574\u76D8\u7ED3\u6784\u3002"],PATTERN:["Pattern candidates are compared by the conditions that strengthen or weaken them.","\u683C\u5C40\u5019\u9009\u8981\u653E\u56DE\u6574\u76D8\uFF0C\u6BD4\u8F83\u54EA\u4E9B\u6761\u4EF6\u652F\u6301\u3001\u54EA\u4E9B\u6761\u4EF6\u524A\u5F31\u3002"],SCHOOL_ZIPING:["Month command, pattern formation and operative-factor view.","\u4ECE\u6708\u4EE4\u3001\u683C\u5C40\u6210\u8D25\u4E0E\u4F5C\u7528\u56E0\u7D20\u9605\u8BFB\u3002"],SCHOOL_TIYONG:["Whole-chart weighting and structural-balance view.","\u4ECE\u6574\u76D8\u504F\u91CD\u3001\u4F53\u7528\u4E0E\u7ED3\u6784\u5E73\u8861\u9605\u8BFB\u3002"],SCHOOL_TIAOHOU:["Cold, warm, dry and wet climate-adjustment view.","\u4ECE\u5BD2\u6696\u71E5\u6E7F\u4E0E\u8C03\u5019\u7EF4\u5EA6\u9605\u8BFB\u3002"],DA_YUN:["Decade cycles show how the natal structure enters different phases.","\u5927\u8FD0\u7528\u6765\u89C2\u5BDF\u539F\u5C40\u5728\u4E0D\u540C\u4EBA\u751F\u9636\u6BB5\u5982\u4F55\u88AB\u5E26\u52A8\u3002"],LIU_NIAN:["Annual context shows which existing themes become more active in a selected year.","\u6D41\u5E74\u7528\u6765\u89C2\u5BDF\u67D0\u4E00\u5E74\u54EA\u4E9B\u539F\u5C40\u4E3B\u9898\u66F4\u5BB9\u6613\u88AB\u5E26\u52A8\u3002"],OPEN_BOUNDARIES:["Some conclusions need more chart-level support before being stated strongly.","\u6709\u4E9B\u7ED3\u8BBA\u4ECD\u8981\u7EE7\u7EED\u7ED3\u5408\u6574\u76D8\u6761\u4EF6\uFF0C\u56E0\u6B64\u6682\u4E0D\u4F5C\u5F3A\u5224\u65AD\u3002"]};function C(){if(typeof document>"u")return;let n=nn;if(document.querySelector('link[data-ppr-bazi-specialist-css="true"]'))return;let r=document.createElement("link");r.rel="stylesheet",r.href=n,r.dataset.pprBaziSpecialistCss="true",document.head?.appendChild(r)}function an(n){let r=tn[n];return r?t(r[0],r[1]):String(n||"")}function sn(n){let r=rn[n];return r?t(r[0],r[1]):""}function v(n){return`<article class="cx-bazi-graph-node" data-node="${e(n.nodeKey||"")}" data-state="${e(n.trace?.resolutionState||"OPEN")}"><header><small>${e(W(n.trace?.resolutionState))}</small><h4>${e(an(n.nodeKey))}</h4></header><p>${e(sn(n.nodeKey))}</p></article>`}var h=(n,r,a="")=>{let s=n[String(r||"").toUpperCase()];return s?t(s[0],s[1]):a||String(r||"")},W=n=>h(We,n,t("Open","\u4ECD\u5F85\u786E\u8BA4")),y=n=>h(Be,n,"\u2014"),Ae=n=>h(Ve,n,"\u2014"),L=n=>h(Fe,n,"\u2014"),on=n=>{let r=n?.stemZh||"\u2014",a=t(n?.tenGodEn||n?.tenGodZh||"",n?.tenGodZh||n?.tenGodEn||"");return a?`${r} \xB7 ${a}`:r},re=Object.freeze({JIA:"\u7532",YI:"\u4E59",BING:"\u4E19",DING:"\u4E01",WU:"\u620A",JI:"\u5DF1",GENG:"\u5E9A",XIN:"\u8F9B",REN:"\u58EC",GUI:"\u7678"}),F=Object.freeze({ZI:"\u5B50",CHOU:"\u4E11",YIN:"\u5BC5",MAO:"\u536F",CHEN:"\u8FB0",SI:"\u5DF3",WU:"\u5348",WEI:"\u672A",SHEN:"\u7533",YOU:"\u9149",XU:"\u620C",HAI:"\u4EA5"}),A=n=>String(n??"").replace(/\b(JIA|YI|BING|DING|WU|JI|GENG|XIN|REN|GUI|ZI|CHOU|YIN|MAO|CHEN|SI|WEI|SHEN|YOU|XU|HAI)\b/g,r=>F[r]||re[r]||r).replace(/Full Production/gi,"").replace(/Reading IR/gi,t("current chart reading","\u5F53\u524D\u547D\u76D8\u89E3\u8BFB")).replace(/semantic owners?/gi,t("whole-chart themes","\u6574\u76D8\u4E3B\u9898")).replace(/\badmitted\b/gi,t("established","\u5DF2\u5EFA\u7ACB")).replace(/\bauthority\b/gi,t("source basis","\u6765\u6E90\u4F9D\u636E")).replace(/\bgoverned\b/gi,t("current","\u5F53\u524D")).replace(/已准入/g,"\u5DF2\u5EFA\u7ACB").replace(/准入/g,"\u786E\u8BA4").replace(/受治理/g,"\u5F53\u524D").replace(/权威/g,"\u6765\u6E90\u4F9D\u636E").replace(/语义\s*owner/gi,"\u6574\u76D8\u4E3B\u9898").replace(/\bW\d+[A-Z0-9.-]*\b/gi,"").replace(/\s{2,}/g," ").trim(),cn=n=>F[String(n||"").toUpperCase()]||String(n||"");function O(n){return n?.schemaVersion==="PHI-OS-METHOD-NATIVE-CUSTOMER-READING-v1.0.0"&&n?.methodId==="BZR"&&n?.publicationDecision?.customerPublishable===!0}function ln(n){let r=n?.stem||{},a=n?.branch||{},s=n?.stemRole||{},i=n?.position==="DAY",l=n?.position==="MONTH",o=t(s.tenGodEn||s.tenGodZh||"",s.tenGodZh||s.tenGodEn||"");return`<article class="cx-bazi-pillar" data-pillar="${e(n?.position||"")}"${i?' data-day-master="true"':""}${l?' data-month-command="true"':""}><header><span>${e(L(n?.position))}</span>${i?`<em>${e(t("Day Master","\u65E5\u4E3B"))}</em>`:l?`<em>${e(t("Month command","\u6708\u4EE4"))}</em>`:""}</header><div class="cx-bazi-pillar__stem"><small>${e(o||t("Heavenly stem","\u5929\u5E72"))}</small><strong>${e(r.zh||"\u2014")}</strong><span>${e([y(r.element),Ae(r.polarity)].filter(Boolean).join(" \xB7 "))}</span></div><div class="cx-bazi-pillar__branch"><small>${e(t("Earthly branch","\u5730\u652F"))}</small><strong>${e(a.zh||"\u2014")}</strong><span>${e(y(a.element))}</span></div><div class="cx-bazi-pillar__hidden"><small>${e(t("Hidden stems","\u85CF\u5E72"))}</small>${c(n?.hiddenStems).length?`<ul>${c(n.hiddenStems).map(u=>`<li>${e(on(u))}</li>`).join("")}</ul>`:"<span>\u2014</span>"}</div></article>`}function ge(n){let r=c(n?.structuralModel?.pillars),a=r.find(o=>o.position==="DAY"),s=r.find(o=>o.position==="MONTH"),i=c(n?.readingSections).find(o=>o.code==="RELATIONSHIPS"),l=c(n?.readingSections).find(o=>o.code==="PATTERNS");return{day:a,month:s,relationshipText:c(i?.paragraphs)[0]||t("No additional natal relation was established in this run.","\u672C\u6B21\u6CA1\u6709\u5EFA\u7ACB\u989D\u5916\u7684\u539F\u5C40\u5173\u7CFB\u3002"),patternText:c(l?.paragraphs)[0]||t("Pattern verdict remains open.","\u683C\u5C40\u5224\u65AD\u4FDD\u6301\u5F00\u653E\u3002"),openCount:c(n?.openVerdicts).length}}function k(n,{embedded:r=!1}={}){if(!O(n))return"";C();let a=c(n?.structuralModel?.pillars),s=ge(n),i=s.day?.stem||{},l=s.month?.branch||{};return`<section class="cx-bazi-structure-surface${r?" cx-bazi-structure-surface--embedded":""}" data-ppr-bazi-professional-structure="true"><header class="cx-bazi-structure-head"><div><p class="cx-eyebrow">${e(t("YOUR FOUR PILLARS","\u4F60\u7684\u56DB\u67F1\u547D\u76D8"))}</p><h3>${e(t("Start with Day Master and month command, then read the four pillars together.","\u5148\u6293\u4F4F\u65E5\u4E3B\u4E0E\u6708\u4EE4\uFF0C\u518D\u628A\u56DB\u67F1\u653E\u56DE\u540C\u4E00\u5F20\u76D8\u91CC\u770B\u3002"))}</h3><p>${e(t("Heavenly stems, Earthly branches, Ten-God roles and hidden stems stay visible so you can see where each part of the reading comes from.","\u5929\u5E72\u3001\u5730\u652F\u3001\u5341\u795E\u89D2\u8272\u4E0E\u85CF\u5E72\u90FD\u4FDD\u7559\u5728\u76D8\u9762\u4E0A\uFF0C\u8BA9\u4F60\u770B\u5F97\u89C1\u6BCF\u4E00\u5C42\u89E3\u91CA\u4ECE\u54EA\u91CC\u6765\u3002"))}</p></div></header><div class="cx-bazi-chart-facts"><article><small>${e(t("Day Master","\u65E5\u4E3B"))}</small><strong>${e(i.zh||"\u2014")}</strong><span>${e([y(i.element),Ae(i.polarity)].filter(Boolean).join(" \xB7 "))}</span></article><article><small>${e(t("Month command","\u6708\u4EE4"))}</small><strong>${e(l.zh||"\u2014")}</strong><span>${e(y(l.element))}</span></article><article><small>${e(t("Natal relation","\u539F\u5C40\u5173\u7CFB"))}</small><strong>${e(A(s.relationshipText))}</strong></article><article><small>${e(t("Pattern direction","\u683C\u5C40\u65B9\u5411"))}</small><strong>${e(A(s.patternText))}</strong></article></div><div class="cx-bazi-pillar-grid">${a.map(ln).join("")}</div><footer><span>${e(t("How to read this chart","\u600E\u4E48\u770B\u8FD9\u5F20\u76D8"))}</span><p>${e(t("A pillar tells you where a structure appears; its meaning comes from how Day Master, season, Five Elements, Ten Gods and relationships work together.","\u67F1\u4F4D\u544A\u8BC9\u4F60\u7ED3\u6784\u51FA\u73B0\u5728\u54EA\u91CC\uFF1B\u771F\u6B63\u7684\u610F\u4E49\u8981\u7ED3\u5408\u65E5\u4E3B\u3001\u5B63\u8282\u3001\u4E94\u884C\u3001\u5341\u795E\u4E0E\u5E72\u652F\u5173\u7CFB\u4E00\u8D77\u8BFB\u3002"))}</p></footer></section>`}var dn={PEER:["Peers / self-support","\u540C\u7C7B\uFF0F\u81EA\u6211\u652F\u6301"],RESOURCE:["Resource / support","\u5370\u661F\uFF0F\u5438\u6536\u652F\u6301"],OUTPUT:["Output / expression","\u98DF\u4F24\uFF0F\u8868\u8FBE\u8F93\u51FA"],WEALTH:["Wealth / exchange","\u8D22\u661F\uFF0F\u8D44\u6E90\u4EA4\u6362"],OFFICER:["Officer / responsibility","\u5B98\u6740\uFF0F\u89C4\u5219\u8D23\u4EFB"],UNAVAILABLE:["Role not resolved","\u529F\u80FD\u5F85\u6838\u5BF9"]},un={SAME_AS_MONTH_COMMAND:["Season anchor","\u4E0E\u6708\u4EE4\u540C\u6C14"],GENERATED_BY_MONTH_COMMAND:["Season can support it","\u53D7\u6708\u4EE4\u76F8\u751F"],GENERATES_MONTH_COMMAND:["Feeds the month command","\u751F\u52A9\u6708\u4EE4"],CONTROLLED_BY_MONTH_COMMAND:["Constrained by month command","\u53D7\u6708\u4EE4\u5236\u7EA6"],CONTROLS_MONTH_COMMAND:["Checks the month command","\u5236\u7EA6\u6708\u4EE4"],MONTH_COMMAND_RELATION_UNAVAILABLE:["Season relation open","\u5B63\u8282\u5173\u7CFB\u5F85\u6838\u5BF9"]},En={BI_JIAN:["Peer","\u6BD4\u80A9"],JIE_CAI:["Rob Wealth","\u52AB\u8D22"],SHI_SHEN:["Eating God","\u98DF\u795E"],SHANG_GUAN:["Hurting Officer","\u4F24\u5B98"],PIAN_CAI:["Indirect Wealth","\u504F\u8D22"],ZHENG_CAI:["Direct Wealth","\u6B63\u8D22"],QI_SHA:["Seven Killings","\u4E03\u6740"],ZHENG_GUAN:["Direct Officer","\u6B63\u5B98"],PIAN_YIN:["Indirect Resource","\u504F\u5370"],ZHENG_YIN:["Direct Resource","\u6B63\u5370"]},ae=n=>h(dn,n,t("Role open","\u529F\u80FD\u5F85\u6838\u5BF9")),_=n=>h(un,n,t("Season relation open","\u5B63\u8282\u5173\u7CFB\u5F85\u6838\u5BF9")),g=n=>h(En,n,String(n||"").replaceAll("_"," ")),Te={SAME_AS_MONTH_COMMAND:["It shares the month-command element, so the seasonal background makes it especially worth watching.","\u5B83\u4E0E\u6708\u4EE4\u540C\u6C14\uFF0C\u56E0\u6B64\u5B63\u8282\u80CC\u666F\u4F1A\u8BA9\u8FD9\u4E00\u4E94\u884C\u66F4\u503C\u5F97\u4F18\u5148\u89C2\u5BDF\u3002"],GENERATED_BY_MONTH_COMMAND:["The month-command element generates it, so the seasonal background offers a supportive direction.","\u6708\u4EE4\u4E94\u884C\u751F\u52A9\u5B83\uFF0C\u56E0\u6B64\u5B63\u8282\u80CC\u666F\u63D0\u4F9B\u4E86\u652F\u6301\u65B9\u5411\u3002"],GENERATES_MONTH_COMMAND:["It generates the month-command element, so part of its structural presence feeds the seasonal environment.","\u5B83\u751F\u52A9\u6708\u4EE4\u4E94\u884C\uFF0C\u56E0\u6B64\u8FD9\u90E8\u5206\u7ED3\u6784\u4F1A\u5411\u5B63\u8282\u4E3B\u6C14\u8F93\u51FA\u3002"],CONTROLLED_BY_MONTH_COMMAND:["The month-command element controls it, so the same raw count should not be treated as equally effective without checking roots and the whole chart.","\u5B83\u53D7\u6708\u4EE4\u4E94\u884C\u5236\u7EA6\uFF0C\u56E0\u6B64\u5373\u4F7F\u539F\u59CB\u6570\u91CF\u4E0D\u5C11\uFF0C\u4E5F\u4E0D\u80FD\u4E0D\u770B\u6839\u6C14\u4E0E\u6574\u76D8\u5C31\u76F4\u63A5\u5F53\u4F5C\u540C\u7B49\u6709\u6548\u3002"],CONTROLS_MONTH_COMMAND:["It controls the month-command element, showing a structural tension with the seasonal background that needs whole-chart context.","\u5B83\u5236\u7EA6\u6708\u4EE4\u4E94\u884C\uFF0C\u663E\u793A\u4E0E\u5B63\u8282\u4E3B\u6C14\u4E4B\u95F4\u5B58\u5728\u7ED3\u6784\u5F20\u529B\uFF0C\u9700\u8981\u653E\u56DE\u6574\u76D8\u7EE7\u7EED\u5224\u65AD\u3002"],MONTH_COMMAND_RELATION_UNAVAILABLE:["The seasonal relationship is not strong enough to summarize yet.","\u5F53\u524D\u8FD8\u4E0D\u8DB3\u4EE5\u628A\u5B83\u4E0E\u5B63\u8282\u80CC\u666F\u6982\u62EC\u6210\u66F4\u660E\u786E\u7684\u5173\u7CFB\u3002"]},pn=n=>{let r=Te[n?.monthCommandRelation]||Te.MONTH_COMMAND_RELATION_UNAVAILABLE;return t(`${r[0]} Relative to the Day Master, it belongs to the ${ae(n?.dayMasterFunction)} functional family.`,`${r[1]} \u76F8\u5BF9\u65E5\u4E3B\uFF0C\u5B83\u5C5E\u4E8E\u300C${ae(n?.dayMasterFunction)}\u300D\u8FD9\u4E00\u529F\u80FD\u7EC4\u3002`)},hn={PEER:["Peer / self-position","\u540C\u7C7B\uFF0F\u81EA\u6211\u4F4D\u7F6E"],OUTPUT:["Output / expression","\u8F93\u51FA\uFF0F\u8868\u8FBE"],WEALTH:["Wealth / exchange","\u8D22\u661F\uFF0F\u8D44\u6E90\u4EA4\u6362"],OFFICER:["Officer / pressure","\u5B98\u6740\uFF0F\u89C4\u5219\u538B\u529B"],RESOURCE:["Resource / support","\u5370\u661F\uFF0F\u5438\u6536\u652F\u6301"],UNAVAILABLE:["To be clarified","\u5F85\u7EE7\u7EED\u6838\u5BF9"]};var mn={SUPPORT_SIDE_VISIBLE:["Support side more visible","\u627F\u8F7D\u4E0E\u652F\u6301\u4FA7\u66F4\u660E\u663E"],OUTPUT_SIDE_VISIBLE:["Output and consumption side more visible","\u5916\u6CC4\u4E0E\u8017\u529B\u4FA7\u66F4\u660E\u663E"],PRESSURE_SIDE_VISIBLE:["Pressure side more visible","\u53D7\u514B\u4E0E\u53D7\u538B\u4FA7\u66F4\u660E\u663E"],MIXED_CARRY:["Support, drain and pressure are mixed","\u652F\u6301\u3001\u5916\u6CC4\u4E0E\u538B\u529B\u5E76\u89C1"]},Tn={DE_LING:["Seasonal support","\u5F97\u4EE4"],DE_DI:["Grounded through branches","\u5F97\u5730"],DE_ZHU:["Visible help","\u5F97\u52A9"],XIE:["Output drain","\u6CC4"],HAO:["Consumption / wealth draw","\u8017"],KE:["Pressure / control","\u514B"],GEN_QI:["Roots","\u6839\u6C14"],TOU_GAN:["Visible stems","\u900F\u5E72"]},R=n=>h(hn,n,t("To be clarified","\u5F85\u7EE7\u7EED\u6838\u5BF9"));var M=n=>h(mn,n,t("Mixed carry","\u6DF7\u5408\u627F\u8F7D")),In=n=>h(Tn,n,t("Signal","\u7ED3\u6784\u4FE1\u53F7")),Ce=n=>c(n).map(L).join("\u3001"),Nn=(n={})=>Object.entries(n).filter(([,r])=>Number(r)>0).map(([r,a])=>`${L(r)}${a>1?`\xD7${a}`:""}`).join("\u3001");function Rn(n){if((Number(n?.count)||0)<=0)return t("Not seen in the chart statistics for now.","\u539F\u5C40\u7EDF\u8BA1\u91CC\u6682\u65F6\u672A\u89C1\u3002");let r=[];Number(n?.visibleCount)&&r.push(t(`${n.visibleCount} visible stem touch(es)`,`\u900F\u5E72 ${n.visibleCount} \u6B21`)),Number(n?.hiddenCount)&&r.push(t(`${n.hiddenCount} hidden-stem touch(es)`,`\u85CF\u5E72 ${n.hiddenCount} \u6B21`));let a=Nn(n?.sources?.pillarCounts||{});return a&&r.push(t(`appearing in ${a}`,`\u5206\u5E03\u4E8E ${a}`)),r.join(t(" \xB7 "," \xB7 "))}function On(n){if((Number(n?.count)||0)<=0)return t("No concentration to read because the chart does not show this Ten-God point here.","\u7531\u4E8E\u539F\u5C40\u672A\u89C1\u8FD9\u4E2A\u5341\u795E\uFF0C\u8FD9\u91CC\u6CA1\u6709\u96C6\u4E2D\u5EA6\u53EF\u8BFB\u3002");if(n?.repeatState==="SINGLE_TOUCH")return t("It appears once, so it acts more like a single doorway than a repeated theme.","\u53EA\u51FA\u73B0 1 \u6B21\uFF0C\u66F4\u50CF\u5355\u4E00\u70B9\u5165\u53E3\uFF0C\u800C\u4E0D\u662F\u53CD\u590D\u4E3B\u9898\u3002");let r=Ce(c(n?.concentration?.spreadPillars).map(a=>a.pillar));return n?.concentration?.mode==="CONCENTRATED"?t(`It repeats ${n.count} times and clusters mainly around ${r||"a narrow pillar range"}.`,`\u5171\u51FA\u73B0 ${n.count} \u6B21\uFF0C\u4E3B\u8981\u96C6\u4E2D\u5728 ${r||"\u8F83\u5C11\u7684\u67F1\u4F4D"}\u3002`):n?.concentration?.mode==="SPREAD"?t(`It repeats ${n.count} times across ${r||"multiple pillars"}, so the theme is distributed rather than isolated.`,`\u5171\u51FA\u73B0 ${n.count} \u6B21\uFF0C\u5206\u5E03\u5728 ${r||"\u591A\u4E2A\u67F1\u4F4D"}\uFF0C\u5C5E\u4E8E\u5206\u6563\u8FDB\u5165\u547D\u76D8\u7684\u4E3B\u9898\u3002`):t(`It repeats ${n.count} times with a balanced spread across ${r||"the chart"}.`,`\u5171\u51FA\u73B0 ${n.count} \u6B21\uFF0C\u5728 ${r||"\u6574\u5F20\u76D8"} \u4E0A\u8F83\u5E73\u5747\u5206\u5E03\u3002`)}function Sn(n){if((Number(n?.count)||0)<=0)return t("Its absence in the chart statistics does not mean the person lacks that life capacity forever; it only means this theme is not a foreground structural emphasis in the present chart layer.","\u539F\u5C40\u7EDF\u8BA1\u672A\u89C1\uFF0C\u5E76\u4E0D\u7B49\u4E8E\u73B0\u5B9E\u91CC\u6C38\u8FDC\u6CA1\u6709\u8FD9\u9879\u80FD\u529B\uFF0C\u53EA\u8868\u793A\u8FD9\u4E00\u5C42\u547D\u76D8\u7ED3\u6784\u91CC\u5B83\u4E0D\u662F\u524D\u666F\u91CD\u70B9\u3002");let r=_(n?.monthCommandRelation),a=R(n?.functionGroup),s=n?.monthCommandCandidate?t("It also appears in the month-command pattern path, so it should be read together with seasonal and pattern conditions.","\u5B83\u540C\u65F6\u8FDB\u5165\u6708\u4EE4\u683C\u5C40\u8DEF\u5F84\uFF0C\u56E0\u6B64\u8981\u548C\u5B63\u8282\u4E0E\u683C\u5C40\u6761\u4EF6\u4E00\u8D77\u8BFB\u3002"):t("At this stage it is read mainly through its visible / hidden placement and the rest of the chart.","\u73B0\u9636\u6BB5\u4E3B\u8981\u901A\u8FC7\u5B83\u7684\u900F\u5E72\uFF0F\u85CF\u5E72\u6765\u6E90\u4E0E\u6574\u76D8\u5173\u7CFB\u6765\u8BFB\u3002");return t(`This belongs to the ${a} family relative to the Day Master. Relative to the month command it is read as ${r}. ${s}`,`\u76F8\u5BF9\u65E5\u4E3B\uFF0C\u5B83\u5C5E\u4E8E\u300C${a}\u300D\u8FD9\u4E00\u529F\u80FD\u7EC4\uFF1B\u76F8\u5BF9\u6708\u4EE4\uFF0C\u76EE\u524D\u53EF\u8BFB\u4F5C\u300C${r}\u300D\u3002${s}`)}function An(n){let a=[["PEER_SUPPORT",t("support","\u652F\u6301")],["RESOURCE_SUPPORT",t("resource","\u751F\u6276")],["OUTPUT_DRAIN",t("output","\u6CC4")],["CONTROLLED_BY_DAY_MASTER",t("consumption","\u8017")],["PRESSURE_ON_DAY_MASTER",t("pressure","\u514B")]].map(([s,i])=>{let l=c(n?.transparentStems?.byRelation?.[s]).length;return l?`${i} ${l}`:""}).filter(Boolean);return a.length?a.join(t(" \xB7 "," \xB7 ")):t("No additional visible stems are available to summarise here.","\u8FD9\u91CC\u6CA1\u6709\u66F4\u591A\u53EF\u6982\u62EC\u7684\u900F\u5E72\u7ED3\u6784\u3002")}function gn(n,r){switch(n?.signalCode){case"DE_LING":return n?.count?t("The month-command environment is on the support side of the Day Master, so seasonal carrying power is present.","\u6708\u4EE4\u73AF\u5883\u7AD9\u5728\u65E5\u4E3B\u7684\u540C\u7C7B\uFF0F\u751F\u6276\u4E00\u4FA7\uFF0C\u56E0\u6B64\u5B63\u8282\u627F\u8F7D\u529B\u5B58\u5728\u3002"):t(`The month-command relation is ${_(r?.seasonalSupport?.getLingState)}; this is not read as a direct \u5F97\u4EE4 structure.`,`\u6708\u4EE4\u5173\u7CFB\u76EE\u524D\u662F\u300C${_(r?.seasonalSupport?.getLingState)}\u300D\uFF0C\u4E0D\u76F4\u63A5\u5F53\u4F5C\u5F97\u4EE4\u7ED3\u6784\u3002`);case"DE_DI":return r?.roots?.total?t(`${r.roots.total} root record(s) are visible in the branches, so the Day Master is not floating without ground.`,`\u5730\u652F\u91CC\u53EF\u89C1 ${r.roots.total} \u5904\u6839\u6C14\uFF0C\u8BF4\u660E\u65E5\u4E3B\u5E76\u4E0D\u662F\u5B8C\u5168\u65E0\u6839\u6D6E\u52A8\u3002`):t("No root evidence is visible in the current branch layer, so grounding should not be assumed.","\u5F53\u524D\u5730\u652F\u5C42\u6CA1\u6709\u770B\u5230\u6839\u6C14\u8BB0\u5F55\uFF0C\u56E0\u6B64\u4E0D\u80FD\u81EA\u52A8\u5047\u8BBE\u6709\u6839\u3002");case"DE_ZHU":return r?.supportBalance?.supportVisible?t(`${r.supportBalance.supportVisible} visible support touch(es) stand on the Day Master side.`,`\u53EF\u89C1 ${r.supportBalance.supportVisible} \u9879\u751F\u6276\uFF0F\u540C\u7C7B\u843D\u70B9\u7AD9\u5728\u65E5\u4E3B\u4E00\u4FA7\u3002`):t("Visible support is limited, so help should not be overstated without more context.","\u53EF\u89C1\u751F\u6276\u6709\u9650\uFF0C\u56E0\u6B64\u4E0D\u80FD\u8FC7\u5EA6\u653E\u5927\u5916\u63F4\u6216\u540C\u7C7B\u652F\u6301\u3002");case"XIE":return r?.supportBalance?.visibleCounts?.OUTPUT_DRAIN?t(`${r.supportBalance.visibleCounts.OUTPUT_DRAIN} visible point(s) show outward release or expression from the Day Master.`,`\u53EF\u89C1 ${r.supportBalance.visibleCounts.OUTPUT_DRAIN} \u9879\u5916\u6CC4\uFF0F\u8F93\u51FA\u843D\u70B9\u3002`):t("No strong output-drain emphasis is visible in this layer.","\u8FD9\u4E00\u5C42\u6CA1\u6709\u660E\u663E\u7684\u6CC4\u52BF\u91CD\u70B9\u3002");case"HAO":return r?.supportBalance?.visibleCounts?.CONTROLLED_BY_DAY_MASTER?t(`${r.supportBalance.visibleCounts.CONTROLLED_BY_DAY_MASTER} visible point(s) show the Day Master spending energy to manage, exchange or allocate.`,`\u53EF\u89C1 ${r.supportBalance.visibleCounts.CONTROLLED_BY_DAY_MASTER} \u9879\u8017\u529B\u53BB\u7BA1\u7406\u3001\u4EA4\u6362\u6216\u914D\u7F6E\u7684\u843D\u70B9\u3002`):t("No strong consumption-through-control emphasis is visible in this layer.","\u8FD9\u4E00\u5C42\u6CA1\u6709\u660E\u663E\u7684\u8017\u529B\u91CD\u70B9\u3002");case"KE":return r?.supportBalance?.visibleCounts?.PRESSURE_ON_DAY_MASTER?t(`${r.supportBalance.visibleCounts.PRESSURE_ON_DAY_MASTER} visible point(s) show standards, pressure or control acting on the Day Master.`,`\u53EF\u89C1 ${r.supportBalance.visibleCounts.PRESSURE_ON_DAY_MASTER} \u9879\u89C4\u5219\uFF0F\u538B\u529B\u4F5C\u7528\u4E8E\u65E5\u4E3B\u3002`):t("No strong pressure-on-Day-Master emphasis is visible in this layer.","\u8FD9\u4E00\u5C42\u6CA1\u6709\u660E\u663E\u7684\u53D7\u514B\u91CD\u70B9\u3002");case"GEN_QI":return r?.roots?.exactDayStemCount?t(`An exact root is visible, with ${r.roots.exactDayStemCount} direct root record(s).`,`\u53EF\u89C1\u65E5\u4E3B\u672C\u6C14\u6839 ${r.roots.exactDayStemCount} \u9879\u3002`):r?.roots?.sameElementCount?t("Same-element roots are visible even if an exact root is not foregrounded.","\u867D\u7136\u672A\u7A81\u51FA\u672C\u6C14\u6839\uFF0C\u4F46\u53EF\u89C1\u540C\u4E94\u884C\u6839\u6C14\u3002"):t("No root Qi is being claimed here.","\u8FD9\u91CC\u4E0D\u5BA3\u79F0\u5B58\u5728\u6839\u6C14\u3002");case"TOU_GAN":return r?.transparentStems?.count?t(`${r.transparentStems.count} visible stem point(s) help show which themes come to the surface first.`,`\u5171\u6709 ${r.transparentStems.count} \u9879\u900F\u5E72\uFF0C\u5E2E\u52A9\u5224\u65AD\u54EA\u4E9B\u4E3B\u9898\u5148\u6D6E\u5230\u8868\u5C42\u3002`):t("No additional visible stems are exposed beyond the Day Master anchor.","\u9664\u65E5\u4E3B\u951A\u70B9\u5916\uFF0C\u6CA1\u6709\u66F4\u591A\u900F\u5E72\u7ED3\u6784\u53EF\u89C1\u3002");default:return t("This structural signal remains open.","\u8FD9\u4E2A\u7ED3\u6784\u4FE1\u53F7\u4FDD\u6301\u5F00\u653E\u3002")}}function Cn(n){if(!n?.roots?.total)return t("The current root layer does not establish visible grounding for the Day Master.","\u5F53\u524D\u6839\u6C14\u5C42\u6CA1\u6709\u4E3A\u65E5\u4E3B\u5EFA\u7ACB\u53EF\u89C1\u7684\u843D\u5730\u4F9D\u636E\u3002");let r=Ce(c(n?.roots?.sources).map(i=>i.pillar)),a=Number(n?.roots?.exactDayStemCount)||0,s=Number(n?.roots?.sameElementCount)||0;return t(`${n.roots.total} root record(s) are visible${r?` in ${r}`:""}. ${a?`${a} are exact roots. `:""}${s?`${s} are same-element roots.`:""}`.trim(),`\u5171\u89C1 ${n.roots.total} \u5904\u6839\u6C14${r?`\uFF0C\u5206\u5E03\u5728 ${r}`:""}\u3002${a?`\u5176\u4E2D ${a} \u5904\u4E3A\u672C\u6C14\u6839\u3002`:""}${s?`\u53E6\u6709 ${s} \u5904\u4E3A\u540C\u4E94\u884C\u6839\u3002`:""}`.trim())}function bn(n){let r=Number(n?.roots?.total)||0,a=Number(n?.supportBalance?.supportVisible)||0,s=Number(n?.supportBalance?.outwardVisible)||0,i=Number(n?.supportBalance?.pressureVisible)||0;return t(`${M(n?.carriers?.overallTendency)} \xB7 roots ${r} \xB7 visible support ${a} \xB7 drain / consumption ${s} \xB7 pressure ${i}. This shows carrying structure, not a simplified strong/weak score.`,`${M(n?.carriers?.overallTendency)} \xB7 \u6839\u6C14 ${r} \xB7 \u53EF\u89C1\u751F\u6276 ${a} \xB7 \u6CC4\uFF0F\u8017 ${s} \xB7 \u514B ${i}\u3002\u8FD9\u91CC\u5C55\u793A\u7684\u662F\u627F\u8F7D\u7ED3\u6784\uFF0C\u4E0D\u662F\u7B80\u5316\u7684\u8EAB\u5F3A\u8EAB\u5F31\u5206\u6570\u3002`)}function K(n,{embedded:r=!1}={}){if(!O(n))return"";C();let a=n?.professionalModules?.fiveElements,s=n?.professionalModules?.tenGods;if(a?.schemaVersion!=="PHI-OS-BAZI-CX-PRO-FIVE-ELEMENT-VISUAL-PROJECTION-v1.0.0")return"";let i=c(a.items),l=c(s?.items).slice().sort((o,u)=>u.count-o.count||u.ratio-o.ratio);return`<section class="cx-bazi-five-element-surface${r?" cx-bazi-surface--embedded":""}" data-bazi-cx-pro-five-elements="true"><header class="cx-bazi-professional-head"><div><p class="cx-eyebrow">${e(t("FIVE ELEMENTS \xB7 STRUCTURE & SEASON","\u4E94\u884C \xB7 \u7ED3\u6784\u5360\u6BD4\u4E0E\u5B63\u8282\u6821\u6B63"))}</p><h3>${e(t("See what appears most often, then correct the first impression with the month command.","\u5148\u770B\u54EA\u4E9B\u4E94\u884C\u51FA\u73B0\u5F97\u591A\uFF0C\u518D\u7528\u6708\u4EE4\u4FEE\u6B63\u7B2C\u4E00\u773C\u7684\u5224\u65AD\u3002"))}</h3><p>${e(t("The bars are raw structural ratios, not strength scores. Seasonal correction is qualitative because this version does not invent hidden-stem weights or a fake weighted percentage.","\u5F69\u8272\u67F1\u663E\u793A\u539F\u59CB\u7ED3\u6784\u5360\u6BD4\uFF0C\u4E0D\u7B49\u540C\u65FA\u8870\u5206\u6570\u3002\u5B63\u8282\u6821\u6B63\u91C7\u7528\u5B9A\u6027\u5173\u7CFB\uFF0C\u56E0\u4E3A\u5F53\u524D\u7248\u672C\u4E0D\u4F1A\u865A\u6784\u85CF\u5E72\u6743\u91CD\uFF0C\u4E5F\u4E0D\u4F1A\u5236\u9020\u5047\u7684\u52A0\u6743\u767E\u5206\u6BD4\u3002"))}</p></div><span class="cx-bazi-season-chip">${e(t("Month command","\u6708\u4EE4"))} \xB7 ${e(a.monthCommand?.branchZh||"\u2014")} \xB7 ${e(y(a.monthCommand?.element))}</span></header><div class="cx-bazi-element-grid">${i.map(o=>`<article class="cx-bazi-element-card" data-element="${e(o.element)}"><header><div><span class="cx-bazi-element-dot" aria-hidden="true"></span><h4>${e(y(o.element))}</h4></div><strong>${e(o.rawRatio)}%</strong></header><div class="cx-bazi-element-bar" role="img" aria-label="${e(`${y(o.element)} ${o.rawRatio}%`)}"><i style="--bazi-element-ratio:${Math.max(0,Math.min(100,Number(o.rawRatio)||0))}%"></i></div><dl><div><dt>${e(t("Raw structure","\u539F\u59CB\u7ED3\u6784"))}</dt><dd>${e(t(`${o.rawCount} appearances`,`\u51FA\u73B0 ${o.rawCount} \u6B21`))}</dd></div><div><dt>${e(t("Seasonal tendency","\u6821\u6B63\u503E\u5411"))}</dt><dd>${e(_(o.monthCommandRelation))}</dd></div><div><dt>${e(t("Relative to Day Master","\u76F8\u5BF9\u65E5\u4E3B"))}</dt><dd>${e(ae(o.dayMasterFunction))}</dd></div></dl><p class="cx-bazi-element-reading">${e(pn(o))}</p><details><summary>${e(t("Where the raw count comes from","\u8FD9\u4E2A\u5360\u6BD4\u600E\u4E48\u6765\u7684"))}</summary><p>${e(t(`Visible stems ${o.breakdown?.visibleStems||0} \xB7 branches ${o.breakdown?.visibleBranches||0} \xB7 hidden stems ${o.breakdown?.hiddenStemsUnweighted||0}`,`\u663E\u5E72 ${o.breakdown?.visibleStems||0} \xB7 \u5730\u652F ${o.breakdown?.visibleBranches||0} \xB7 \u85CF\u5E72 ${o.breakdown?.hiddenStemsUnweighted||0}`))}</p></details></article>`).join("")}</div><div class="cx-bazi-five-element-explainer"><article><small>${e(t("RAW RATIO","\u539F\u59CB\u5360\u6BD4"))}</small><h4>${e(t("Useful for seeing composition, not for declaring strong or weak.","\u7528\u6765\u89C2\u5BDF\u7EC4\u6210\uFF0C\u4E0D\u76F4\u63A5\u62FF\u6765\u5224\u8EAB\u5F3A\u8EAB\u5F31\u3002"))}</h4><p>${e(t("Visible stems, branch elements and hidden stems are counted equally in this first-layer view.","\u8FD9\u4E00\u5C42\u628A\u663E\u5E72\u3001\u5730\u652F\u4E94\u884C\u4E0E\u85CF\u5E72\u7B49\u6743\u7EDF\u8BA1\uFF0C\u56E0\u6B64\u5B83\u56DE\u7B54\u201C\u76D8\u91CC\u51FA\u73B0\u4E86\u4EC0\u4E48\u201D\uFF0C\u4E0D\u662F\u201C\u8C01\u7684\u5B9E\u9645\u529B\u91CF\u6700\u5927\u201D\u3002"))}</p></article><article><small>${e(t("SEASONAL CORRECTION","\u5B63\u8282\u6821\u6B63"))}</small><h4>${e(t("Month command changes how the same raw ratio should be read.","\u540C\u4E00\u4E2A\u539F\u59CB\u5360\u6BD4\uFF0C\u653E\u5230\u4E0D\u540C\u6708\u4EE4\u91CC\u610F\u4E49\u4F1A\u4E0D\u540C\u3002"))}</h4><p>${e(t("The page shows whether each element shares, receives from, feeds, controls or is controlled by the month-command element. Final strength still needs roots and the whole chart.","\u9875\u9762\u6807\u51FA\u5404\u4E94\u884C\u4E0E\u6708\u4EE4\u662F\u540C\u6C14\u3001\u53D7\u751F\u3001\u751F\u52A9\u3001\u5236\u7EA6\u6216\u53D7\u5236\uFF1B\u6700\u7EC8\u65FA\u8870\u4ECD\u8981\u7EE7\u7EED\u7ED3\u5408\u6839\u6C14\u4E0E\u6574\u76D8\u3002"))}</p></article></div>${s?.schemaVersion==="PHI-OS-BAZI-CX-PRO-TEN-GOD-PROFESSIONAL-COMPOSITION-v1.0.0"?`<section class="cx-bazi-ten-god-surface" data-bazi-cx-pro-ten-gods="true"><header class="cx-bazi-professional-head"><div><p class="cx-eyebrow">${e(t("TEN-GOD PREVIEW \xB7 PROFESSIONAL COMPOSITION","\u5341\u795E\u7ED3\u6784\u9884\u89C8 \xB7 \u4E13\u4E1A\u7EC4\u5408\u9605\u8BFB"))}</p><h3>${e(t("Read ratio, function group, source positions, repetition and chart integration together.","\u628A\u5360\u6BD4\u3001\u529F\u80FD\u7EC4\u3001\u67F1\u4F4D\u6765\u6E90\u3001\u91CD\u590D\u96C6\u4E2D\u4E0E\u6574\u76D8\u7EC4\u5408\u653E\u5728\u4E00\u8D77\u770B\u3002"))}</h3><p>${e(t("This is still a structural composition. It does not create good-bad scoring or simplified personality grading.","\u8FD9\u91CC\u4ECD\u7136\u662F\u7ED3\u6784\u7EC4\u5408\u9605\u8BFB\uFF0C\u4E0D\u5236\u9020\u5409\u51F6\u8BC4\u5206\uFF0C\u4E5F\u4E0D\u628A\u4EBA\u7B80\u5316\u6210\u4EBA\u683C\u6253\u5206\u3002"))}</p></div><span class="cx-bazi-season-chip">${e(t(`${s.totalTouches} Ten-God touches`,`${s.totalTouches} \u4E2A\u5341\u795E\u843D\u70B9`))}</span></header><div class="cx-bazi-ten-god-hero"><div class="cx-bazi-ten-god-column-grid">${l.map(o=>`<article class="cx-bazi-ten-god-column" data-function-group="${e(o.functionGroup)}" data-ten-god="${e(o.tenGodCode)}"><div class="cx-bazi-ten-god-column-track"><i style="--bazi-ten-god-ratio:${Math.max(0,Math.min(100,Number(o.ratio)||0))}%"></i></div><strong>${e(g(o.tenGodCode))}</strong><span>${e(o.ratio)}%</span></article>`).join("")}</div><div class="cx-bazi-ten-god-hero-side"><article><small>${e(t("Day Master","\u65E5\u4E3B"))}</small><strong>${e(s.dayMaster?.zh||"\u2014")}</strong><p>${e(t("Ten-God meaning always returns to the Day Master as the reference point.","\u5341\u795E\u7684\u610F\u4E49\u59CB\u7EC8\u56DE\u5230\u65E5\u4E3B\u4F5C\u4E3A\u53C2\u7167\u3002"))}</p></article><article><small>${e(t("Month command","\u6708\u4EE4"))}</small><strong>${e(s.monthCommand?.branchZh||"\u2014")}</strong><p>${e(t("The month command changes which Ten-God themes come forward more easily.","\u6708\u4EE4\u4F1A\u6539\u53D8\u54EA\u4E9B\u5341\u795E\u4E3B\u9898\u66F4\u5BB9\u6613\u6D6E\u5230\u524D\u666F\u3002"))}</p></article><article><small>${e(t("How to use the ratios","\u600E\u4E48\u770B\u5360\u6BD4"))}</small><strong>${e(t("Foreground structure","\u524D\u666F\u7ED3\u6784"))}</strong><p>${e(t("Ratios show which Ten-God points appear more often in visible stems and hidden stems.","\u5360\u6BD4\u544A\u8BC9\u4F60\u54EA\u4E9B\u5341\u795E\u5728\u900F\u5E72\u4E0E\u85CF\u5E72\u91CC\u51FA\u73B0\u5F97\u66F4\u9891\u5BC6\u3002"))}</p></article></div></div><div class="cx-bazi-ten-god-group-grid">${c(s.functionGroups).slice().sort((o,u)=>u.count-o.count||u.ratio-o.ratio).map(o=>`<article class="cx-bazi-ten-god-group-card" data-function-group="${e(o.groupCode)}"><header><small>${e(t("Function group","\u529F\u80FD\u7EC4"))}</small><h4>${e(R(o.groupCode))}</h4><strong>${e(o.ratio)}%</strong></header><div class="cx-bazi-ten-god-group-bar"><i style="--bazi-ten-god-ratio:${Math.max(0,Math.min(100,Number(o.ratio)||0))}%"></i></div><p>${e(t(`${o.count} touch(es) across ${c(o.tenGodCodes).map(g).join(" / ")}`,`${o.count} \u4E2A\u843D\u70B9\uFF0C\u5305\u542B ${c(o.tenGodCodes).map(g).join("\uFF0F")}`))}</p></article>`).join("")}</div><div class="cx-bazi-ten-god-card-grid">${l.map(o=>`<article class="cx-bazi-ten-god-card" data-function-group="${e(o.functionGroup)}" data-ten-god="${e(o.tenGodCode)}"><header><div><small>${e(R(o.functionGroup))}</small><h4>${e(g(o.tenGodCode))}</h4></div><strong>${e(o.ratio)}%</strong></header><div class="cx-bazi-ten-god-card-bar"><i style="--bazi-ten-god-ratio:${Math.max(0,Math.min(100,Number(o.ratio)||0))}%"></i></div><dl><div><dt>${e(t("Pillar / source","\u67F1\u4F4D\u4E0E\u6765\u6E90"))}</dt><dd>${e(Rn(o))}</dd></div><div><dt>${e(t("Repetition / concentration","\u91CD\u590D\u4E0E\u96C6\u4E2D"))}</dt><dd>${e(On(o))}</dd></div><div><dt>${e(t("Season / pattern connection","\u6708\u4EE4\u4E0E\u683C\u5C40\u8FDE\u63A5"))}</dt><dd>${e(t(`${_(o.monthCommandRelation)}${o.monthCommandCandidate?" \xB7 in current month-command pattern path":""}`,`${_(o.monthCommandRelation)}${o.monthCommandCandidate?" \xB7 \u5DF2\u8FDB\u5165\u5F53\u524D\u6708\u4EE4\u683C\u5C40\u8DEF\u5F84":""}`))}</dd></div></dl><p class="cx-bazi-ten-god-note">${e(Sn(o))}</p></article>`).join("")}</div></section>`:""}</section>`}function j(n,{embedded:r=!1}={}){if(!O(n))return"";C();let a=n?.professionalModules?.dayMasterStrength;if(a?.schemaVersion!=="PHI-OS-BAZI-CX-PRO-DAY-MASTER-STRENGTH-PROFESSIONAL-COMPOSITION-v1.0.0")return"";let s=Math.max(0,Number(a?.supportBalance?.supportTotal)||0),i=Math.max(0,Number(a?.supportBalance?.outwardVisible)||0),l=Math.max(0,Number(a?.supportBalance?.pressureVisible)||0),o=Math.max(1,s+i+l);return`<section class="cx-bazi-day-master-strength${r?" cx-bazi-surface--embedded":""}" data-bazi-cx-pro-day-master-strength="true"><header class="cx-bazi-professional-head"><div><p class="cx-eyebrow">${e(t("DAY MASTER \xB7 SEASON \xB7 CARRYING STRUCTURE","\u65E5\u4E3B \xB7 \u6708\u4EE4 \xB7 \u627F\u8F7D\u7ED3\u6784"))}</p><h3>${e(t("Split support, drain and pressure before saying anything about strong or weak.","\u5148\u628A\u652F\u6301\u3001\u5916\u6CC4\u4E0E\u538B\u529B\u62C6\u5F00\u770B\uFF0C\u518D\u8C08\u627F\u8F7D\u7ED3\u6784\u3002"))}</h3><p>${e(t("This section keeps \u5F97\u4EE4\u3001\u5F97\u5730\u3001\u5F97\u52A9\u3001\u6CC4\u3001\u8017\u3001\u514B\u3001\u6839\u6C14 and visible stems visible at the same time. It shows structure, not a simplified strong/weak sticker.","\u8FD9\u4E00\u7AE0\u628A\u5F97\u4EE4\u3001\u5F97\u5730\u3001\u5F97\u52A9\u3001\u6CC4\u3001\u8017\u3001\u514B\u3001\u6839\u6C14\u4E0E\u900F\u5E72\u540C\u65F6\u6446\u51FA\u6765\u770B\uFF1B\u5B83\u5C55\u793A\u7684\u662F\u7ED3\u6784\uFF0C\u4E0D\u662F\u7B80\u5355\u8D34\u4E00\u4E2A\u8EAB\u5F3A\uFF0F\u8EAB\u5F31\u6807\u7B7E\u3002"))}</p></div><span class="cx-bazi-season-chip">${e(a.dayMaster?.zh||"\u2014")} \xB7 ${e(t("Day Master","\u65E5\u4E3B"))} / ${e(a.monthCommand?.branchZh||"\u2014")} \xB7 ${e(t("Month command","\u6708\u4EE4"))}</span></header><div class="cx-bazi-strength-balance-card"><div><div class="cx-bazi-strength-balance-head"><small>${e(t("Overall carrying tendency","\u6574\u4F53\u627F\u8F7D\u503E\u5411"))}</small><strong>${e(M(a?.carriers?.overallTendency))}</strong></div><p>${e(bn(a))}</p></div><div class="cx-bazi-strength-balance-bar" role="img" aria-label="${e(t(`support ${s}, outward ${i}, pressure ${l}`,`\u652F\u6301 ${s}\uFF0C\u6CC4\u8017 ${i}\uFF0C\u538B\u529B ${l}`))}"><i data-balance="support" style="--bazi-strength-ratio:${s/o*100}%"></i><i data-balance="outward" style="--bazi-strength-ratio:${i/o*100}%"></i><i data-balance="pressure" style="--bazi-strength-ratio:${l/o*100}%"></i></div><div class="cx-bazi-strength-balance-legend"><span data-balance="support">${e(t(`Support ${s}`,`\u652F\u6301 ${s}`))}</span><span data-balance="outward">${e(t(`Drain / consume ${i}`,`\u6CC4\u8017 ${i}`))}</span><span data-balance="pressure">${e(t(`Pressure ${l}`,`\u53D7\u514B ${l}`))}</span></div></div><div class="cx-bazi-strength-signal-grid">${c(a.signals).map(u=>`<article class="cx-bazi-strength-signal-card" data-signal="${e(u.signalCode)}"><header><small>${e(t("Signal","\u7ED3\u6784\u4FE1\u53F7"))}</small><h4>${e(In(u.signalCode))}</h4><strong>${e(u.count)}</strong></header><p>${e(gn(u,a))}</p></article>`).join("")}</div><div class="cx-bazi-strength-detail-grid"><article class="cx-bazi-strength-detail-card"><header><small>${e(t("Roots / \u6839\u6C14","\u6839\u6C14"))}</small><h4>${e(t("Where the Day Master is rooted","\u65E5\u4E3B\u4ECE\u54EA\u91CC\u843D\u5730"))}</h4></header><p>${e(Cn(a))}</p></article><article class="cx-bazi-strength-detail-card"><header><small>${e(t("Visible stems / \u900F\u5E72","\u900F\u5E72"))}</small><h4>${e(t("What comes to the surface first","\u54EA\u4E9B\u4E3B\u9898\u5148\u6D6E\u5230\u8868\u5C42"))}</h4></header><p>${e(An(a))}</p></article></div><aside class="cx-bazi-strength-boundary"><strong>${e(t("Reading boundary","\u89E3\u91CA\u8FB9\u754C"))}</strong><p>${e(t("Supportive, draining and pressuring structures are shown separately on purpose. The page does not collapse them into a fake weighted score or a single unqualified strong/weak label.","\u9875\u9762\u523B\u610F\u628A\u751F\u6276\u3001\u5916\u6CC4\u4E0E\u53D7\u538B\u62C6\u5F00\u663E\u793A\uFF0C\u4E0D\u4F1A\u628A\u5B83\u4EEC\u538B\u6210\u4E00\u4E2A\u5047\u7684\u52A0\u6743\u5206\u6570\uFF0C\u4E5F\u4E0D\u4F1A\u76F4\u63A5\u6298\u53E0\u6210\u5355\u4E00\u3001\u65E0\u6761\u4EF6\u7684\u8EAB\u5F3A\u8EAB\u5F31\u6807\u7B7E\u3002"))}</p></aside></section>`}var Pn={LINK:["Link","\u8054\u7ED3"],TENSION:["Tension","\u5F20\u529B"],GROUP_LINK:["Group link","\u7FA4\u7EC4\u8054\u7ED3"],GROUP_TENSION:["Group tension","\u7FA4\u7EC4\u5F20\u529B"],REPEAT_TENSION:["Repeated tension","\u91CD\u590D\u5F20\u529B"],STRUCTURAL:["Structural relation","\u7ED3\u6784\u5173\u7CFB"]},fn={OUTER_ENVIRONMENT_INTERFACE:["Outer context \u2194 month environment","\u5916\u90E8\u80CC\u666F \u2194 \u6708\u4EE4\u73AF\u5883"],OUTER_SELF_INTERFACE:["Outer context \u2194 self anchor","\u5916\u90E8\u80CC\u666F \u2194 \u81EA\u6211\u951A\u70B9"],OUTER_EXPRESSION_INTERFACE:["Outer context \u2194 outward expression","\u5916\u90E8\u80CC\u666F \u2194 \u540E\u7EED\u8868\u8FBE"],ENVIRONMENT_SELF_INTERFACE:["Month environment \u2194 self anchor","\u6708\u4EE4\u73AF\u5883 \u2194 \u81EA\u6211\u951A\u70B9"],ENVIRONMENT_EXPRESSION_INTERFACE:["Month environment \u2194 outward expression","\u6708\u4EE4\u73AF\u5883 \u2194 \u540E\u7EED\u8868\u8FBE"],SELF_EXPRESSION_INTERFACE:["Self anchor \u2194 outward expression","\u81EA\u6211\u951A\u70B9 \u2194 \u540E\u7EED\u8868\u8FBE"],MULTI_PILLAR_NETWORK:["Multi-pillar network","\u591A\u67F1\u7F51\u7EDC"],PILLAR_INTERFACE:["Pillar interface","\u67F1\u4F4D\u63A5\u53E3"]},Ln={VISIBLE_STEM_LINK:["Visible-role connection","\u8868\u5C42\u89D2\u8272\u8054\u7ED3"],BRANCH_LINK:["Branch-level connection","\u5730\u652F\u5C42\u8054\u7ED3"],DIRECT_TENSION:["Direct structural tension","\u76F4\u63A5\u7ED3\u6784\u5F20\u529B"],INDIRECT_FRICTION:["Indirect friction","\u95F4\u63A5\u7275\u626F"],STRUCTURAL_DISRUPTION:["Structural disruption","\u7ED3\u6784\u65AD\u7EED"],CONSTRAINT_PATTERN:["Constraint pattern","\u7EA6\u675F\u578B\u5F20\u529B"],MULTI_PILLAR_CONSTRAINT:["Multi-pillar constraint","\u591A\u67F1\u7EA6\u675F\u7F51\u7EDC"],REPEATED_INTERNAL_TENSION:["Repeated internal tension","\u91CD\u590D\u81EA\u5211\u7ED3\u6784"],THREE_PILLAR_ALIGNMENT:["Three-pillar alignment","\u4E09\u67F1\u5408\u5C40\u7ED3\u6784"],THREE_PILLAR_GATHERING:["Three-pillar gathering","\u4E09\u67F1\u4F1A\u5C40\u7ED3\u6784"],STRUCTURAL_RELATION:["Structural relation","\u7ED3\u6784\u5173\u7CFB"]},$n={DAY_MASTER_MONTH_COMMAND_DIRECT:["Day Master + month command direct","\u65E5\u4E3B \xD7 \u6708\u4EE4\u76F4\u63A5\u63A5\u53E3"],DAY_MASTER_DIRECT:["Direct to Day Master","\u76F4\u63A5\u89E6\u53CA\u65E5\u4E3B"],MONTH_COMMAND_DIRECT:["Direct to month command","\u76F4\u63A5\u89E6\u53CA\u6708\u4EE4"],MULTI_PILLAR_NETWORK:["Multi-pillar network","\u591A\u67F1\u7F51\u7EDC"],SECONDARY_INTERFACE:["Secondary pillar interface","\u6B21\u7EA7\u67F1\u4F4D\u63A5\u53E3"]},se=n=>h(Pn,n,t("Structural relation","\u7ED3\u6784\u5173\u7CFB")),x=n=>h(fn,n,t("Pillar interface","\u67F1\u4F4D\u63A5\u53E3")),yn=n=>h(Ln,n,t("Structural relation","\u7ED3\u6784\u5173\u7CFB")),Dn=n=>h($n,n,t("Pillar interface","\u67F1\u4F4D\u63A5\u53E3"));function Hn(n){let r=c(n?.context?.visibleTenGods).map(l=>l.zh||g(l.code)),a=c(n?.context?.hiddenTenGodCodes).map(g),s=c(n?.context?.functionGroups).map(R),i=[];return r.length&&i.push(t(`visible Ten Gods ${r.join(" / ")}`,`\u900F\u5E72\u5341\u795E ${r.join("\uFF0F")}`)),a.length&&i.push(t(`hidden Ten Gods ${a.join(" / ")}`,`\u85CF\u5E72\u5341\u795E ${a.join("\uFF0F")}`)),s.length&&i.push(t(`functional groups ${s.join(" / ")}`,`\u529F\u80FD\u7EC4 ${s.join("\uFF0F")}`)),i.length?i.join(t(" \xB7 "," \xB7 ")):t("No additional Ten-God context is exposed for this interface.","\u8FD9\u4E2A\u63A5\u53E3\u76EE\u524D\u6CA1\u6709\u66F4\u591A\u5341\u795E\u4E0A\u4E0B\u6587\u53EF\u5C55\u5F00\u3002")}function vn(n){let r=D(n?.type),a=c(n?.positions).map(L).join(" \u2194 "),s=x(n?.positionThemeCode),i=se(n?.relationFamily),l=n?.dayMasterDirect&&n?.monthCommandDirect?t("Because this relation directly connects the Day Master position with the month-command position, it should be read together with both the seasonal background and the Day Master carrying structure.","\u56E0\u4E3A\u8FD9\u6761\u5173\u7CFB\u76F4\u63A5\u8FDE\u63A5\u65E5\u4E3B\u4F4D\u7F6E\u4E0E\u6708\u4EE4\u4F4D\u7F6E\uFF0C\u6240\u4EE5\u8981\u540C\u65F6\u7ED3\u5408\u5B63\u8282\u80CC\u666F\u4E0E\u65E5\u4E3B\u627F\u8F7D\u7ED3\u6784\u3002"):n?.dayMasterDirect?t("Because the Day Master position is directly involved, the relation should be read together with roots, visible support, drain/consumption and pressure.","\u56E0\u4E3A\u65E5\u4E3B\u4F4D\u7F6E\u76F4\u63A5\u53C2\u4E0E\uFF0C\u6240\u4EE5\u8FD9\u6761\u5173\u7CFB\u8981\u548C\u6839\u6C14\u3001\u53EF\u89C1\u751F\u6276\u3001\u6CC4\u8017\u4E0E\u53D7\u538B\u4E00\u8D77\u8BFB\u3002"):n?.monthCommandDirect?t("Because the month-command position is directly involved, seasonal context should stay visible when this relation is interpreted.","\u56E0\u4E3A\u6708\u4EE4\u4F4D\u7F6E\u76F4\u63A5\u53C2\u4E0E\uFF0C\u6240\u4EE5\u89E3\u91CA\u8FD9\u6761\u5173\u7CFB\u65F6\u8981\u4FDD\u7559\u5B63\u8282\u80CC\u666F\u3002"):t("This relation sits between other pillar positions and changes the structural context around the chart rather than replacing the Day Master as the reference point.","\u8FD9\u6761\u5173\u7CFB\u53D1\u751F\u5728\u5176\u4ED6\u67F1\u4F4D\u4E4B\u95F4\uFF0C\u4E3B\u8981\u6539\u53D8\u6574\u76D8\u7684\u7ED3\u6784\u8BED\u5883\uFF0C\u800C\u4E0D\u4F1A\u53D6\u4EE3\u65E5\u4E3B\u4F5C\u4E3A\u53C2\u7167\u3002");return t(`${r} connects ${a} as a ${i} structure. The useful theme is ${s}. ${l}`,`${r}\u8FDE\u63A5 ${a}\uFF0C\u5C5E\u4E8E\u300C${i}\u300D\u7ED3\u6784\uFF1B\u8F83\u9002\u5408\u4ECE\u300C${s}\u300D\u8FD9\u4E2A\u63A5\u53E3\u8FDB\u5165\u9605\u8BFB\u3002${l}`)}function Mn(n){return n?.dayMasterDirect?t(`Day Master carrying context: ${M(n?.context?.dayMasterCarryingTendency)} \xB7 visible support ${n?.context?.supportVisible??0} \xB7 drain/consumption ${n?.context?.outwardVisible??0} \xB7 pressure ${n?.context?.pressureVisible??0} \xB7 roots in involved pillars ${n?.context?.rootCount??0}.`,`\u65E5\u4E3B\u627F\u8F7D\u80CC\u666F\uFF1A${M(n?.context?.dayMasterCarryingTendency)} \xB7 \u53EF\u89C1\u751F\u6276 ${n?.context?.supportVisible??0} \xB7 \u6CC4\u8017 ${n?.context?.outwardVisible??0} \xB7 \u514B ${n?.context?.pressureVisible??0} \xB7 \u76F8\u5173\u67F1\u4F4D\u6839\u6C14 ${n?.context?.rootCount??0}\u3002`):t("Day Master carrying structure is an indirect reference here.","\u8FD9\u91CC\u4EE5\u65E5\u4E3B\u627F\u8F7D\u7ED3\u6784\u4F5C\u4E3A\u95F4\u63A5\u53C2\u7167\u3002")}function _n(n){let r=c(n?.relationFamilies).map(se).join("\uFF0F"),a=c(n?.tenGodCodes).map(g).join("\uFF0F"),s=n?.dayMasterDirect&&n?.monthCommandDirect?t("This theme directly crosses both the Day Master and month-command anchors.","\u8FD9\u4E2A\u4E3B\u9898\u540C\u65F6\u8DE8\u8FC7\u65E5\u4E3B\u4E0E\u6708\u4EE4\u4E24\u4E2A\u951A\u70B9\u3002"):n?.dayMasterDirect?t("This theme directly touches the Day Master anchor.","\u8FD9\u4E2A\u4E3B\u9898\u76F4\u63A5\u89E6\u53CA\u65E5\u4E3B\u951A\u70B9\u3002"):n?.monthCommandDirect?t("This theme directly touches the month-command anchor.","\u8FD9\u4E2A\u4E3B\u9898\u76F4\u63A5\u89E6\u53CA\u6708\u4EE4\u951A\u70B9\u3002"):t("This theme works through the surrounding pillar network.","\u8FD9\u4E2A\u4E3B\u9898\u4E3B\u8981\u901A\u8FC7\u5468\u8FB9\u67F1\u4F4D\u7F51\u7EDC\u53D1\u751F\u4F5C\u7528\u3002");return t(`${n.relationCount} relation(s) \xB7 ${r||"structural relation"}${a?` \xB7 Ten Gods ${a}`:""}. ${s}`,`${n.relationCount} \u6761\u5173\u7CFB \xB7 ${r||"\u7ED3\u6784\u5173\u7CFB"}${a?` \xB7 \u5341\u795E ${a}`:""}\u3002${s}`)}function Z(n,{embedded:r=!1}={}){if(!O(n))return"";C();let a=n?.professionalModules?.relationships;if(a?.schemaVersion!=="PHI-OS-BAZI-CX-PRO-RELATIONSHIP-PILLAR-INTERACTION-v1.0.0")return"";let s=c(a.items),i=c(a.pillarContexts),l=c(a.themes);return`<section class="cx-bazi-relationship-professional${r?" cx-bazi-surface--embedded":""}" data-bazi-cx-pro-relationships="true"><header class="cx-bazi-professional-head"><div><p class="cx-eyebrow">${e(t("RELATIONSHIPS \xB7 PILLAR INTERACTION","\u5173\u7CFB\u7ED3\u6784 \xB7 \u67F1\u4F4D\u4E92\u52A8"))}</p><h3>${e(t("Put combinations, clashes, punishments, harms and breaks back into the four-pillar network.","\u628A\u5408\u3001\u51B2\u3001\u5211\u3001\u5BB3\u3001\u7834\u653E\u56DE\u56DB\u67F1\u7F51\u7EDC\u91CC\u8BFB\uFF0C\u800C\u4E0D\u662F\u53EA\u5217\u4E00\u4E2A\u5173\u7CFB\u540D\u79F0\u3002"))}</h3><p>${e(t("Each relation is connected to its pillar interface, Ten-God context and Day-Master carrying structure. Presence is structural evidence only; it is not an event prediction.","\u6BCF\u6761\u5173\u7CFB\u90FD\u4F1A\u8FDE\u63A5\u67F1\u4F4D\u63A5\u53E3\u3001\u5341\u795E\u4E0A\u4E0B\u6587\u4E0E\u65E5\u4E3B\u627F\u8F7D\u7ED3\u6784\uFF1B\u5173\u7CFB\u51FA\u73B0\u53EA\u4EE3\u8868\u7ED3\u6784\u8BC1\u636E\uFF0C\u4E0D\u76F4\u63A5\u7B49\u540C\u73B0\u5B9E\u4E8B\u4EF6\u3002"))}</p></div><span class="cx-bazi-season-chip">${e(t(`${a.summary?.relationCount||0} natal relation(s)`,`${a.summary?.relationCount||0} \u6761\u539F\u5C40\u5173\u7CFB`))}</span></header><div class="cx-bazi-pillar-interaction-rail">${i.map(o=>`<article data-pillar="${e(o.position)}"${o.isDayMaster?' data-day-master="true"':""}${o.isMonthCommand?' data-month-command="true"':""}><header><span>${e(L(o.position))}</span>${o.isDayMaster?`<em>${e(t("Day Master","\u65E5\u4E3B"))}</em>`:o.isMonthCommand?`<em>${e(t("Month command","\u6708\u4EE4"))}</em>`:""}</header><strong>${e(`${o.stem?.zh||"\u2014"}${o.branch?.zh||"\u2014"}`)}</strong><p>${e(o.visibleTenGod?.code?`${g(o.visibleTenGod.code)} \xB7 ${R(o.visibleTenGod.functionGroup)}`:t("Day Master anchor","\u65E5\u4E3B\u951A\u70B9"))}</p>${c(o.hiddenTenGodCodes).length?`<small>${e(t("Hidden","\u85CF\u5E72"))} \xB7 ${e(c(o.hiddenTenGodCodes).map(g).join("\uFF0F"))}</small>`:""}${o.rootCount?`<small>${e(t(`Roots ${o.rootCount}`,`\u6839\u6C14 ${o.rootCount}`))}</small>`:""}</article>`).join("")}</div>${s.length?`<div class="cx-bazi-relation-card-grid">${s.map((o,u)=>`<article class="cx-bazi-relation-card" data-relation-family="${e(o.relationFamily)}" data-priority="${e(o.priorityBand)}"><header><div><small>${String(u+1).padStart(2,"0")} \xB7 ${e(Dn(o.priorityBand))}</small><h4>${e(D(o.type))} \xB7 ${e(yn(o.relationThemeCode))}</h4></div><span>${e(se(o.relationFamily))}</span></header><div class="cx-bazi-relation-members"><strong>${e(be(o.members,o.type)||c(o.memberZh).join(" \u2194 ")||"\u2014")}</strong><span>${e(c(o.positions).map(L).join(" \u2194 "))}</span></div><div class="cx-bazi-relation-theme"><small>${e(t("Relationship theme","\u5173\u7CFB\u4E3B\u9898"))}</small><strong>${e(x(o.positionThemeCode))}</strong><p>${e(vn(o))}</p></div><dl><div><dt>${e(t("Ten-God context","\u5341\u795E\u4E0A\u4E0B\u6587"))}</dt><dd>${e(Hn(o))}</dd></div><div><dt>${e(t("Day-Master carrying bridge","\u65E5\u4E3B\u627F\u8F7D\u8FDE\u63A5"))}</dt><dd>${e(Mn(o))}</dd></div></dl><footer>${e(t("Relation present \u2260 transformation established \u2260 event outcome.","\u5173\u7CFB\u51FA\u73B0 \u2260 \u5408\u5316\u6210\u7ACB \u2260 \u73B0\u5B9E\u4E8B\u4EF6\u7ED3\u679C\u3002"))}</footer></article>`).join("")}</div>`:`<article class="cx-bazi-relationship-empty"><strong>${e(t("No covered natal relationship is foregrounded in this chart.","\u5F53\u524D\u5DF2\u8986\u76D6\u89C4\u5219\u91CC\uFF0C\u6CA1\u6709\u9700\u8981\u524D\u666F\u5316\u7684\u539F\u5C40\u5408\u51B2\u5211\u5BB3\u7834\u5173\u7CFB\u3002"))}</strong><p>${e(t("This does not mean the chart has no relationship dynamics; it only means no relation in the current covered structural registry was detected.","\u8FD9\u4E0D\u4EE3\u8868\u547D\u76D8\u5B8C\u5168\u6CA1\u6709\u4E92\u52A8\uFF0C\u53EA\u8868\u793A\u5F53\u524D\u5DF2\u8986\u76D6\u7ED3\u6784\u89C4\u5219\u91CC\u6CA1\u6709\u68C0\u6D4B\u5230\u5BF9\u5E94\u5173\u7CFB\u3002"))}</p></article>`}${l.length?`<section class="cx-bazi-relationship-theme-section"><header><small>${e(t("THEME NAVIGATION","\u5173\u7CFB\u4E3B\u9898\u5BFC\u822A"))}</small><h4>${e(t("Which pillar interfaces deserve attention first?","\u54EA\u4E9B\u67F1\u4F4D\u63A5\u53E3\u503C\u5F97\u4F18\u5148\u770B\uFF1F"))}</h4></header><div>${l.map(o=>`<article><span>${e(x(o.themeCode))}</span><strong>${e(o.relationCount)}</strong><p>${e(_n(o))}</p></article>`).join("")}</div></section>`:""}<aside class="cx-bazi-strength-boundary"><strong>${e(t("Interpretation boundary","\u89E3\u91CA\u8FB9\u754C"))}</strong><p>${e(t("Pillar themes organize where to look. They do not turn Year / Month / Day / Hour positions into deterministic labels for parents, spouse, children, career or specific events.","\u67F1\u4F4D\u4E3B\u9898\u53EA\u8D1F\u8D23\u7EC4\u7EC7\u9605\u8BFB\u5165\u53E3\uFF0C\u4E0D\u4F1A\u628A\u5E74\uFF0F\u6708\uFF0F\u65E5\uFF0F\u65F6\u67F1\u76F4\u63A5\u7B49\u540C\u7236\u6BCD\u3001\u914D\u5076\u3001\u5B50\u5973\u3001\u4E8B\u4E1A\u6216\u5177\u4F53\u4E8B\u4EF6\u7684\u51B3\u5B9A\u8BBA\u6807\u7B7E\u3002"))}</p></aside></section>`}function G(n){return h(ke,n,String(n||""))}function xn(n){return h(Ke,n,String(n||""))}function D(n){return h(Je,n,String(n||"").replaceAll("_"," "))}function Y(n){return L(n)}function be(n,r=""){let a=String(r).startsWith("BRANCH_");return c(n).map(s=>(a?F[s]:re[s])||F[s]||re[s]||s).join(" \xB7 ")}function Ie(n){let r=en[n];return r?t(r[0],r[1]):t("A separate school-qualified lens","\u72EC\u7ACB\u7684\u5B66\u6D3E\u89C6\u89D2")}function Un(n){return c(n?.unknownRefs).length?n?.schoolCode==="ZI_PING_MONTH_COMMAND_USE_v1"?t("The final operative-factor / useful-god selection remains open.","\u6700\u7EC8\u4F5C\u7528\u56E0\u7D20\uFF0F\u7528\u795E\u9009\u62E9\u4ECD\u5F00\u653E\u3002"):n?.schoolCode==="DI_TIAN_SUI_TI_YONG_BALANCE_v1"?t("The strong/weak verdict and final structural priority remain open.","\u8EAB\u5F3A\u8EAB\u5F31\u4E0E\u6700\u7EC8\u4F18\u5148\u987A\u5E8F\u4ECD\u5F00\u653E\u3002"):n?.schoolCode==="DI_TIAN_SUI_CLIMATE_TIAOHOU_v1"?t("The final climate-adjustment element remains open.","\u6700\u7EC8\u8C03\u5019\u5143\u7D20\u4ECD\u5F00\u653E\u3002"):t("This school-qualified conclusion remains open.","\u8FD9\u4E2A\u5206\u5B66\u6D3E\u7ED3\u8BBA\u4ECD\u5F00\u653E\u3002"):t("No additional open condition is recorded for this view.","\u8FD9\u4E2A\u89C6\u89D2\u6CA1\u6709\u989D\u5916\u672A\u51B3\u6761\u4EF6\u3002")}function wn(n){let r=n?.evidence||{};return n?.schoolCode==="ZI_PING_MONTH_COMMAND_USE_v1"?t(`Month command ${r.monthCommandBranch||"\u2014"} \xB7 ${c(r.patternCandidateIds).length} pattern paths \xB7 ${r.variationEvidencePresent?"variation conditions are visible":"variation conditions still need checking"}`,`\u6708\u4EE4 ${cn(r.monthCommandBranch)||"\u2014"} \xB7 ${c(r.patternCandidateIds).length} \u6761\u683C\u5C40\u8DEF\u5F84 \xB7 ${r.variationEvidencePresent?"\u5DF2\u7ECF\u770B\u5230\u53D8\u5316\u6761\u4EF6":"\u53D8\u5316\u6761\u4EF6\u4ECD\u8981\u7EE7\u7EED\u6838\u5BF9"}`):n?.schoolCode==="DI_TIAN_SUI_TI_YONG_BALANCE_v1"?t(`${r.rootEvidenceCount??0} root record(s) \xB7 strong/weak ${r.strongWeakVerdictAvailable?"can be read":"still needs checking"}`,`${r.rootEvidenceCount??0} \u9879\u6839\u6C14\u8BB0\u5F55 \xB7 \u8EAB\u5F3A\u8EAB\u5F31${r.strongWeakVerdictAvailable?"\u53EF\u4EE5\u7EE7\u7EED\u9605\u8BFB":"\u4ECD\u8981\u7EE7\u7EED\u6838\u5BF9"}`):n?.schoolCode==="DI_TIAN_SUI_CLIMATE_TIAOHOU_v1"?t(`Season ${r.season||"\u2014"} \xB7 thermal ${r.thermalContext||"open"} \xB7 moisture ${r.moistureContext||"open"}`,`\u5B63\u8282 ${r.season==="SPRING"?"\u6625":r.season||"\u2014"} \xB7 \u5BD2\u6696 ${r.thermalContext==="TRANSITIONAL_SEASON_CONTEXT"?"\u8FC7\u6E21\u5B63\u8282\u60C5\u5883":r.thermalContext||"\u7EE7\u7EED\u6838\u5BF9"} \xB7 \u71E5\u6E7F ${r.moistureContext==="NOT_DECIDABLE_FROM_SEASON_ALONE"?"\u4E0D\u80FD\u53EA\u7531\u5B63\u8282\u51B3\u5B9A":r.moistureContext||"\u7EE7\u7EED\u6838\u5BF9"}`):t("This school view is read from the same chart through a different technical question.","\u8FD9\u4E2A\u5B66\u6D3E\u4ECE\u540C\u4E00\u5F20\u547D\u76D8\u63D0\u51FA\u4E0D\u540C\u7684\u6280\u672F\u95EE\u9898\u3002")}function X(n,{embedded:r=!1}={}){if(!O(n))return"";C();let a=n?.professionalModules?.pattern;if(!a)return"";let s=new Map(c(a.candidates).map(E=>[E.candidateId,E])),i=c(a.summary?.readingOrder).map(E=>s.get(E)).filter(Boolean);for(let E of c(a.candidates))i.includes(E)||i.push(E);let l=E=>{let p=je[E];return p?t(p[0],p[1]):String(E||"")},o=E=>{let p=Ze[E];return p?t(p[0],p[1]):t("Keep checking this path","\u7EE7\u7EED\u6838\u5BF9\u8FD9\u6761\u8DEF\u5F84")},u=E=>{let p=Xe[E];return p?t(p[0],p[1]):t("A defeat condition still needs review.","\u8FD8\u6709\u4E00\u9879\u8D25\u683C\u6761\u4EF6\u9700\u8981\u6838\u5BF9\u3002")},d=E=>{let p=qe[E];return p?t(p[0],p[1]):t("Pattern path","\u683C\u5C40\u8DEF\u5F84")},S=E=>{let p=Qe[E];return p?t(p[0],p[1]):t("This pattern path is read through the month command and the whole chart.","\u8FD9\u6761\u683C\u5C40\u8DEF\u5F84\u9700\u8981\u4ECE\u6708\u4EE4\u4E0E\u6574\u76D8\u4E00\u8D77\u7406\u89E3\u3002")},m=E=>c(E).map(R).join("\uFF0F")||t("none foregrounded","\u6682\u65E0\u524D\u666F\u5316\u56E0\u7D20"),I=E=>c(E).length?c(E).map(p=>`${D(p.type)} \xB7 ${c(p.positions).map(L).join("\u2194")}`).join("\uFF1B"):t("No additional relationship modifier is foregrounded.","\u5F53\u524D\u6CA1\u6709\u989D\u5916\u7684\u67F1\u4F4D\u5173\u7CFB\u4FEE\u6B63\u9700\u8981\u524D\u666F\u5316\u3002"),$=E=>{let p=E.professionalReading||{};return p.conclusionState==="PRIMARY_ESTABLISHED_BY_UPSTREAM"?t("The pattern verdict has established this as the primary pattern; the formation, defeat and rescue evidence remains visible below.","\u683C\u5C40\u5224\u65AD\u5DF2\u7ECF\u628A\u8FD9\u6761\u8DEF\u5F84\u5EFA\u7ACB\u4E3A\u4E3B\u683C\uFF1B\u4E0B\u9762\u4ECD\u4FDD\u7559\u6210\u683C\u3001\u8D25\u683C\u4E0E\u6551\u5E94\u4F9D\u636E\u3002"):p.conclusionState==="OPEN_WITH_VISIBLE_FORMATION_SUPPORT"?t("This is more than a label: the month-command candidate is visible and at least one admitted formation path has structural support, but the whole chart still does not justify forcing a single primary pattern.","\u8FD9\u4E0D\u53EA\u662F\u4E00\u4E2A\u5019\u9009\u540D\u79F0\uFF1A\u6708\u4EE4\u5019\u9009\u5DF2\u7ECF\u900F\u5E72\uFF0C\u800C\u4E14\u81F3\u5C11\u4E00\u6761\u6210\u683C\u8DEF\u5F84\u51FA\u73B0\u7ED3\u6784\u652F\u6301\uFF1B\u4F46\u6574\u76D8\u4ECD\u4E0D\u8DB3\u4EE5\u5F3A\u884C\u5B9A\u6210\u552F\u4E00\u4E3B\u683C\u3002"):p.conclusionState==="OPEN_WITH_PARTIAL_FORMATION_SUPPORT"?t("Some formation factors are visible, but position, carrying or relationship conditions still need to be resolved.","\u90E8\u5206\u6210\u683C\u56E0\u7D20\u5DF2\u7ECF\u51FA\u73B0\uFF0C\u4F46\u4ECD\u8981\u7EE7\u7EED\u6838\u5BF9\u67F1\u4F4D\u3001\u65E5\u4E3B\u627F\u8F7D\u6216\u5E72\u652F\u5173\u7CFB\u3002"):t("The candidate comes from the month command, but the current chart does not foreground enough formation support to promote it.","\u8FD9\u6761\u5019\u9009\u6765\u81EA\u6708\u4EE4\uFF0C\u4F46\u5F53\u524D\u6574\u76D8\u8FD8\u6CA1\u6709\u524D\u666F\u5316\u8DB3\u591F\u7684\u6210\u683C\u652F\u6301\uFF0C\u56E0\u6B64\u4FDD\u6301\u5F00\u653E\u3002")},T=i.map((E,p)=>{let N=E.professionalReading||{},Ge=N.formation||{},H=N.carryingContext||{};return`<article class="cx-bazi-pattern-reading-card" data-pattern-family="${e(E.patternFamily||"")}" data-reading-priority="${e(N.readingPriority||"")}"><header><div><small>${String(p+1).padStart(2,"0")} \xB7 ${e(d(N.readingPriority))}</small><h4>${e(`${E.tenGodZh||"\u2014"} \xB7 ${G(E.patternFamily)}`)}</h4><p>${e(`${E.hiddenStemZh||"\u2014"} \xB7 ${xn(E.treatmentClass)}`)}</p></div><span>${e(N.tenGodContext?`${N.tenGodContext.ratio}%`:t("Open","\u5F00\u653E"))}</span></header><section class="cx-bazi-pattern-origin"><small>${e(t("WHY THIS PATTERN IS HERE","\u4E3A\u4EC0\u4E48\u4F1A\u8FDB\u5165\u683C\u5C40\u8BA8\u8BBA"))}</small><p>${e(E.visibleStemMatch?t(`It starts from the month-command hidden stem and the same stem is visible in ${c(E.visiblePillars).map(Y).join(", ")}.`,`\u5B83\u6765\u81EA\u6708\u4EE4\u85CF\u5E72\u7B2C ${E.hiddenOrder} \u4F4D\uFF0C\u5E76\u4E14\u540C\u5E72\u5DF2\u7ECF\u900F\u51FA\u4E8E${c(E.visiblePillars).map(Y).join("\u3001")}\u3002`):t(`It starts from month-command hidden stem ${E.hiddenOrder}, but the same stem is not visible among the four stems.`,`\u5B83\u6765\u81EA\u6708\u4EE4\u85CF\u5E72\u7B2C ${E.hiddenOrder} \u4F4D\uFF0C\u4F46\u56DB\u4E2A\u663E\u5E72\u91CC\u6CA1\u6709\u540C\u5E72\u900F\u51FA\u3002`))}</p><p class="cx-bazi-pattern-family-reading">${e(S(E.patternFamily))}</p><dl><div><dt>${e(t("Ten-God presence","\u5341\u795E\u51FA\u73B0"))}</dt><dd>${e(t(`${N.tenGodContext?.count||0} touch(es) \xB7 ${N.tenGodContext?.visibleCount||0} visible \xB7 ${N.tenGodContext?.hiddenCount||0} hidden`,`${N.tenGodContext?.count||0} \u4E2A\u843D\u70B9 \xB7 \u900F\u5E72 ${N.tenGodContext?.visibleCount||0} \xB7 \u85CF\u5E72 ${N.tenGodContext?.hiddenCount||0}`))}</dd></div><div><dt>${e(t("Day-Master carrying","\u65E5\u4E3B\u627F\u8F7D"))}</dt><dd>${e(t(`roots ${H.rootCount||0} \xB7 support ${H.supportVisible||0} \xB7 drain ${H.outwardVisible||0} \xB7 pressure ${H.pressureVisible||0}`,`\u6839\u6C14 ${H.rootCount||0} \xB7 \u751F\u6276 ${H.supportVisible||0} \xB7 \u6CC4\u8017 ${H.outwardVisible||0} \xB7 \u514B ${H.pressureVisible||0}`))}</dd></div></dl></section><section class="cx-bazi-pattern-paths"><header><small>${e(t("FORMATION PATHS","\u6210\u683C\u8DEF\u5F84"))}</small><h5>${e(t("What would make this candidate become a real pattern structure?","\u8FD9\u6761\u5019\u9009\u8981\u600E\u6837\u624D\u771F\u6B63\u5F62\u6210\u683C\u5C40\u7ED3\u6784\uFF1F"))}</h5></header><div>${c(Ge.paths).map(f=>`<article data-path-state="${e(f.state)}"><strong>${e(l(f.pathCode))}</strong><p>${e(o(f.state))}</p>${c(f.visibleRequiredGroups).length?`<span>${e(t("Visible factors","\u5DF2\u89C1\u56E0\u7D20"))} \xB7 ${e(m(f.visibleRequiredGroups))}</span>`:""}${c(f.missingRequiredGroups).length?`<span>${e(t("Still missing / not foregrounded","\u4ECD\u672A\u524D\u666F\u5316"))} \xB7 ${e(m(f.missingRequiredGroups))}</span>`:""}</article>`).join("")}</div></section><div class="cx-bazi-pattern-evidence-grid"><section><small>${e(t("RELATIONSHIP MODIFIERS","\u5E72\u652F\u5173\u7CFB\u4FEE\u6B63"))}</small><h5>${e(t("Does the month-command path stay structurally simple?","\u6708\u4EE4\u8DEF\u5F84\u6709\u6CA1\u6709\u88AB\u5408\u51B2\u5211\u5BB3\u8FDB\u4E00\u6B65\u6539\u5199\uFF1F"))}</h5><p>${e(I(N.relationshipModifiers))}</p></section><section><small>${e(t("DEFEAT CHECKS","\u8D25\u683C\u68C0\u67E5"))}</small><h5>${e(t("Do not erase counter-evidence just because a formation path is visible.","\u770B\u5230\u6210\u683C\u8DEF\u5F84\uFF0C\u4E5F\u4E0D\u80FD\u628A\u53EF\u80FD\u7684\u7834\u574F\u6761\u4EF6\u5220\u6389\u3002"))}</h5>${c(N.defeatChecks).length?`<ul>${c(N.defeatChecks).map(f=>`<li data-state="${e(f.state)}">${e(u(f.checkCode))}${f.state==="NOT_FOREGROUNDED"?` <em>${e(t("not foregrounded now","\u5F53\u524D\u672A\u524D\u666F\u5316"))}</em>`:""}</li>`).join("")}</ul>`:`<p>${e(t("No additional defeat check is foregrounded.","\u5F53\u524D\u6CA1\u6709\u989D\u5916\u8D25\u683C\u68C0\u67E5\u88AB\u524D\u666F\u5316\u3002"))}</p>`}</section><section><small>${e(t("RESCUE FRAMEWORK","\u6551\u5E94\u6846\u67B6"))}</small><h5>${e(t("If a damaging condition is established, what kind of counter-condition should be checked?","\u5982\u679C\u8D25\u683C\u6761\u4EF6\u6210\u7ACB\uFF0C\u63A5\u4E0B\u6765\u8981\u68C0\u67E5\u4EC0\u4E48\u7C7B\u578B\u7684\u6551\u5E94\uFF1F"))}</h5><p>${e(t(`Check ${m(N.rescueFramework?.focusGroups)}; currently visible: ${m(N.rescueFramework?.visibleFocusGroups)}.`,`\u91CD\u70B9\u6838\u5BF9 ${m(N.rescueFramework?.focusGroups)}\uFF1B\u672C\u76D8\u5F53\u524D\u5DF2\u7ECF\u770B\u89C1\uFF1A${m(N.rescueFramework?.visibleFocusGroups)}\u3002`))}</p></section><section><small>${e(t("CURRENT CONCLUSION","\u5F53\u524D\u7ED3\u8BBA"))}</small><h5>${e(t("A complete explanation does not require a forced winner.","\u5B8C\u6574\u89E3\u91CA\u4E0D\u7B49\u4E8E\u5F3A\u884C\u9009\u4E00\u4E2A\u8D62\u5BB6\u3002"))}</h5><p>${e($(E))}</p></section></div></article>`}).join("");return`<section class="cx-bazi-pattern-surface cx-bazi-pattern-reading${r?" cx-bazi-surface--embedded":""}" data-ppr-bazi-pattern-professional="true" data-bazi-cx-pro-pattern-reading="true" data-w15-section="PATTERNS"><header class="cx-bazi-professional-head"><div><p class="cx-eyebrow">${e(t("PATTERN \xB7 PROFESSIONAL READING","\u683C\u5C40 \xB7 \u4E13\u4E1A\u8BFB\u53D6"))}</p><h3>${e(t("A pattern is not a name. It is a formation path that must survive support, defeat, rescue and relationship checks.","\u683C\u5C40\u4E0D\u662F\u4E00\u4E2A\u540D\u79F0\uFF0C\u800C\u662F\u4E00\u6761\u8981\u7ECF\u8FC7\u6210\u683C\u3001\u8D25\u683C\u3001\u6551\u5E94\u4E0E\u5E72\u652F\u5173\u7CFB\u6838\u5BF9\u7684\u7ED3\u6784\u8DEF\u5F84\u3002"))}</h3><p>${e(t("The page now explains why each path enters the discussion, what is already visible in this chart, what can support formation, what can modify it, and why a primary pattern may still remain open.","\u73B0\u5728\u6BCF\u6761\u8DEF\u5F84\u90FD\u4F1A\u89E3\u91CA\uFF1A\u4E3A\u4EC0\u4E48\u8FDB\u5165\u683C\u5C40\u8BA8\u8BBA\u3001\u672C\u76D8\u5B9E\u9645\u770B\u89C1\u4EC0\u4E48\u3001\u54EA\u4E9B\u6761\u4EF6\u652F\u6301\u6210\u683C\u3001\u54EA\u4E9B\u5173\u7CFB\u4F1A\u4FEE\u6B63\u5B83\uFF0C\u4EE5\u53CA\u4E3A\u4EC0\u4E48\u4E3B\u683C\u4ECD\u53EF\u80FD\u4FDD\u6301\u5F00\u653E\u3002"))}</p></div><span class="cx-personal-status-chip" data-state="${a.summary?.primaryPatternEstablished?"ready":"open"}">${e(a.summary?.primaryPatternEstablished?t("Primary pattern established","\u4E3B\u683C\u5DF2\u5EFA\u7ACB"):t(`${a.summary?.candidateCount||0} paths \xB7 primary open`,`${a.summary?.candidateCount||0} \u6761\u8DEF\u5F84 \xB7 \u4E3B\u683C\u5F00\u653E`))}</span></header><div class="cx-bazi-pattern-reading-summary"><article><small>${e(t("Month-command candidates","\u6708\u4EE4\u5019\u9009"))}</small><strong>${e(a.summary?.candidateCount||0)}</strong><p>${e(t("All candidates come from the month-command hidden-stem structure.","\u6240\u6709\u5019\u9009\u90FD\u4ECE\u6708\u4EE4\u85CF\u5E72\u7ED3\u6784\u8FDB\u5165\u3002"))}</p></article><article><small>${e(t("Visible-stem candidates","\u5DF2\u7ECF\u900F\u5E72"))}</small><strong>${e(a.summary?.visibleStemCandidateCount||0)}</strong><p>${e(t("Visible does not equal formed, but it gives the path more chart-level presence.","\u900F\u5E72\u4E0D\u7B49\u4E8E\u6210\u683C\uFF0C\u4F46\u4EE3\u8868\u8FD9\u6761\u8DEF\u5F84\u5DF2\u7ECF\u8FDB\u5165\u8868\u5C42\u7ED3\u6784\u3002"))}</p></article><article><small>${e(t("Paths with visible formation support","\u6210\u683C\u8DEF\u5F84\u5DF2\u6709\u652F\u6301"))}</small><strong>${e(a.summary?.visibleFormationSupportCount||0)}</strong><p>${e(t("This counts visible formation support only; it is not a quality score.","\u8FD9\u91CC\u53EA\u7EDF\u8BA1\u5DF2\u7ECF\u53EF\u89C1\u7684\u6210\u683C\u652F\u6301\uFF0C\u4E0D\u662F\u683C\u5C40\u8BC4\u5206\u3002"))}</p></article></div><div class="cx-bazi-pattern-reading-list">${T}</div><aside class="cx-bazi-professional-boundary"><strong>${e(t("Why the primary pattern can still stay open","\u4E3A\u4EC0\u4E48\u89E3\u91CA\u66F4\u5B8C\u6574\u4EE5\u540E\uFF0C\u4E3B\u683C\u4ECD\u53EF\u80FD\u5F00\u653E"))}</strong><p>${e(t("The admitted pattern framework allows formation and damaging factors to coexist, and rescue must be checked without deleting the original counter-evidence. PHI OS therefore explains each path fully before it promotes any one path to the primary pattern.","\u683C\u5C40\u89C4\u5219\u5141\u8BB8\u300C\u6210\u4E2D\u6709\u8D25\u300D\uFF0C\u6551\u5E94\u4E5F\u4E0D\u80FD\u628A\u539F\u672C\u7684\u53CD\u8BC1\u76F4\u63A5\u5220\u9664\u3002\u56E0\u6B64 PHI OS \u4F1A\u5148\u628A\u6BCF\u6761\u8DEF\u5F84\u7684\u6210\u3001\u8D25\u3001\u6551\u5E94\u4E0E\u5173\u7CFB\u4FEE\u6B63\u8BB2\u5B8C\u6574\uFF0C\u518D\u51B3\u5B9A\u662F\u5426\u8DB3\u4EE5\u63D0\u5347\u4E3A\u4E3B\u683C\u3002"))}</p></aside></section>`}function oe(n,{embedded:r=!1}={}){if(!O(n))return"";C();let a=n?.professionalModules?.pattern;if(a?.schemaVersion!=="PHI-OS-PPR-C1-BAZI-PATTERN-PROFESSIONAL-SURFACE-v1.0.0"||a?.professionalReadingVersion!=="PHI-OS-BAZI-CX-PRO-PATTERN-PROFESSIONAL-READING-v1.0.0")return"";let i=c(a.candidates).slice().sort((l,o)=>(Number(o.professionalReading?.visibleFormationPathCount)||0)-(Number(l.professionalReading?.visibleFormationPathCount)||0)||(Number(o.visibleStemMatch)||0)-(Number(l.visibleStemMatch)||0)).map((l,o)=>{let u=l.professionalReading||{},d=u.carryingContext||{},S=c(u.relationshipModifiers);return`<article class="cx-bazi-pattern-main-card" data-pattern-family="${e(l.patternFamily||"")}"><header><span>${String(o+1).padStart(2,"0")}</span><div><small>${e(t("Pattern path","\u683C\u5C40\u8DEF\u5F84"))}</small><h4>${e(`${l.tenGodZh||"\u2014"} \xB7 ${G(l.patternFamily)}`)}</h4></div></header><p>${e(l.visibleStemMatch?t(`This path comes from the month command and is also visible through ${c(l.visiblePillars).map(Y).join(", ")}.`,`\u8FD9\u6761\u8DEF\u5F84\u4ECE\u6708\u4EE4\u8FDB\u5165\uFF0C\u5E76\u4E14\u5DF2\u7ECF\u900F\u51FA\u4E8E${c(l.visiblePillars).map(Y).join("\u3001")}\u3002`):t("This path comes from the month command hidden-stem structure and remains part of the whole-chart pattern discussion.","\u8FD9\u6761\u8DEF\u5F84\u6765\u81EA\u6708\u4EE4\u85CF\u5E72\u7ED3\u6784\uFF0C\u56E0\u6B64\u4ECD\u5C5E\u4E8E\u6574\u76D8\u683C\u5C40\u9605\u8BFB\u7684\u4E00\u90E8\u5206\u3002"))}</p><dl><div><dt>${e(t("Formation support now visible","\u5F53\u524D\u5DF2\u89C1\u6210\u683C\u652F\u6301"))}</dt><dd>${e(t(`${u.visibleFormationPathCount||0} path(s)`,` ${u.visibleFormationPathCount||0} \u6761\u8DEF\u5F84`).trim())}</dd></div><div><dt>${e(t("Relationship modifiers","\u5E72\u652F\u5173\u7CFB\u4FEE\u6B63"))}</dt><dd>${e(S.length?S.slice(0,3).map(m=>`${D(m.type)} \xB7 ${c(m.positions).map(L).join("\u2194")}`).join("\uFF1B"):t("No direct modifier is foregrounded in the main reading.","\u4E3B\u9605\u8BFB\u91CC\u6CA1\u6709\u989D\u5916\u5173\u7CFB\u4FEE\u6B63\u9700\u8981\u524D\u666F\u5316\u3002"))}</dd></div><div><dt>${e(t("Day-Master carrying context","\u65E5\u4E3B\u627F\u8F7D\u80CC\u666F"))}</dt><dd>${e(t(`roots ${d.rootCount||0} \xB7 support ${d.supportVisible||0} \xB7 drain ${d.outwardVisible||0} \xB7 pressure ${d.pressureVisible||0}`,`\u6839\u6C14 ${d.rootCount||0} \xB7 \u751F\u6276 ${d.supportVisible||0} \xB7 \u6CC4\u8017 ${d.outwardVisible||0} \xB7 \u514B ${d.pressureVisible||0}`))}</dd></div></dl></article>`}).join("");return`<section class="cx-bazi-pattern-main${r?" cx-bazi-surface--embedded":""}" data-bazi-cx-pro-pattern-main="true" data-bazi-cx-pro-pattern-reading="true"><header class="cx-bazi-professional-head"><div><p class="cx-eyebrow">${e(t("PATTERN \xB7 CUSTOMER READING","\u683C\u5C40 \xB7 \u5BA2\u6237\u4E3B\u9605\u8BFB"))}</p><h3>${e(t("Read how the month-command paths organize the whole chart, without turning technical status into the main story.","\u5148\u770B\u6708\u4EE4\u683C\u5C40\u8DEF\u5F84\u600E\u6837\u7EC4\u7EC7\u6574\u76D8\uFF0C\u4E0D\u8BA9\u6280\u672F\u5224\u636E\u548C\u72B6\u6001\u8BCD\u5360\u636E\u4E3B\u9605\u8BFB\u3002"))}</h3><p>${e(t("Formation support, relationship modifiers and Day-Master carrying stay visible here. School-specific rules, source lineage and unresolved technical conditions are kept in Sources & Technical.","\u8FD9\u91CC\u4FDD\u7559\u6210\u683C\u652F\u6301\u3001\u5E72\u652F\u4FEE\u6B63\u4E0E\u65E5\u4E3B\u627F\u8F7D\uFF1B\u66F4\u7EC6\u7684\u6280\u672F\u5224\u636E\u7EDF\u4E00\u653E\u5230\u300C\u6765\u6E90\u6280\u672F\u300D\u3002"))}</p></div></header><div class="cx-bazi-pattern-main-grid">${i}</div></section>`}var zn={CARRYING:["Carrying structure","\u627F\u8F7D\u7ED3\u6784"],TEN_GOD_GROUP:["Functional group","\u5341\u795E\u529F\u80FD\u7EC4"],RELATIONSHIP:["Pillar interface","\u67F1\u4F4D\u63A5\u53E3"],PATTERN:["Pattern path","\u683C\u5C40\u8DEF\u5F84"],TIMING:["Timing activation","\u65F6\u95F4\u6FC0\u6D3B"]},Gn={CAREER:["Career & work","\u4E8B\u4E1A\u4E0E\u5DE5\u4F5C"],WEALTH:["Wealth & resources","\u8D22\u5BCC\u4E0E\u8D44\u6E90"],RELATIONSHIPS:["Relationships","\u5173\u7CFB"],FAMILY:["Family & background","\u5BB6\u5EAD\u4E0E\u80CC\u666F"],CAPABILITY:["Capability & expression","\u80FD\u529B\u4E0E\u8868\u8FBE"],PRESSURE:["Pressure & responsibility","\u538B\u529B\u4E0E\u8D23\u4EFB"],LIFE_OPERATION:["Life operation","\u751F\u6D3B\u8FD0\u884C"]},U={CAREER:{lens:["Career is read through responsibility, output, resources and carrying\u2014not a job-title prediction.","\u4E8B\u4E1A\u4E3B\u9898\u770B\u7684\u662F\u8D23\u4EFB\u3001\u8F93\u51FA\u3001\u8D44\u6E90\u4E0E\u627F\u8F7D\u600E\u6837\u534F\u540C\uFF0C\u4E0D\u9884\u6D4B\u4E00\u4E2A\u56FA\u5B9A\u804C\u4E1A\u540D\u79F0\u3002"],reality:["Which work situations repeatedly bring the same mix of responsibility, expression and resource exchange into view?","\u54EA\u4E9B\u5DE5\u4F5C\u60C5\u5883\u4F1A\u53CD\u590D\u628A\u540C\u4E00\u7EC4\u8D23\u4EFB\u3001\u8868\u8FBE\u4E0E\u8D44\u6E90\u4EA4\u6362\u5E26\u5230\u524D\u666F\uFF1F"]},WEALTH:{lens:["Wealth is read as resource management and exchange, then checked against output, peer competition, pattern and carrying conditions.","\u8D22\u5BCC\u4E3B\u9898\u5148\u770B\u8D44\u6E90\u5982\u4F55\u88AB\u7BA1\u7406\u4E0E\u4EA4\u6362\uFF0C\u518D\u7ED3\u5408\u8F93\u51FA\u3001\u540C\u7C7B\u7ADE\u4E89\u3001\u683C\u5C40\u4E0E\u627F\u8F7D\u6761\u4EF6\u3002"],reality:["Where does resource flow become easier when output and carrying are aligned, and where does it become costly?","\u54EA\u4E9B\u60C5\u5883\u91CC\u8D44\u6E90\u6D41\u52A8\u4F1A\u56E0\u4E3A\u8F93\u51FA\u4E0E\u627F\u8F7D\u914D\u5408\u800C\u66F4\u987A\uFF0C\u54EA\u4E9B\u60C5\u5883\u53CD\u800C\u66F4\u8017\u529B\uFF1F"]},RELATIONSHIPS:{lens:["Relationships are read through recurring pillar interfaces and Ten-God functions, not by assigning one pillar to one guaranteed person or outcome.","\u5173\u7CFB\u4E3B\u9898\u4ECE\u53CD\u590D\u51FA\u73B0\u7684\u67F1\u4F4D\u63A5\u53E3\u4E0E\u5341\u795E\u529F\u80FD\u8FDB\u5165\uFF0C\u4E0D\u628A\u67D0\u4E00\u67F1\u76F4\u63A5\u7B49\u540C\u67D0\u4E2A\u5FC5\u7136\u4EBA\u7269\u6216\u7ED3\u5C40\u3002"],reality:["Which relationship interfaces repeat across different people, and which only appear under a particular environment or pressure?","\u54EA\u4E9B\u5173\u7CFB\u63A5\u53E3\u4F1A\u8DE8\u4E0D\u540C\u5BF9\u8C61\u53CD\u590D\u51FA\u73B0\uFF0C\u54EA\u4E9B\u53EA\u5728\u7279\u5B9A\u73AF\u5883\u6216\u538B\u529B\u4E0B\u51FA\u73B0\uFF1F"]},FAMILY:{lens:["Family is read as the interaction between background, support, peer structure and the self anchor\u2014not as a deterministic family-member label.","\u5BB6\u5EAD\u4E3B\u9898\u770B\u80CC\u666F\u3001\u652F\u6301\u3001\u540C\u7C7B\u7ED3\u6784\u4E0E\u81EA\u6211\u951A\u70B9\u5982\u4F55\u4E92\u52A8\uFF0C\u4E0D\u628A\u67F1\u4F4D\u76F4\u63A5\u53D8\u6210\u5BB6\u5EAD\u6210\u5458\u7684\u51B3\u5B9A\u8BBA\u6807\u7B7E\u3002"],reality:["Which background or family conditions consistently support the chart, and which create recurring friction or role pressure?","\u54EA\u4E9B\u5BB6\u5EAD\u6216\u6210\u957F\u80CC\u666F\u6301\u7EED\u63D0\u4F9B\u652F\u6301\uFF0C\u54EA\u4E9B\u4F1A\u53CD\u590D\u5F62\u6210\u6469\u64E6\u6216\u89D2\u8272\u538B\u529B\uFF1F"]},CAPABILITY:{lens:["Capability is read from what the chart can absorb, hold, express and repeat, then checked against carrying capacity.","\u80FD\u529B\u4E3B\u9898\u770B\u547D\u76D8\u600E\u6837\u5438\u6536\u3001\u627F\u63A5\u3001\u8868\u8FBE\u4E0E\u91CD\u590D\u4F7F\u7528\u4E00\u9879\u80FD\u529B\uFF0C\u518D\u7ED3\u5408\u65E5\u4E3B\u627F\u8F7D\u3002"],reality:["Which abilities become reliable only after enough support or practice, and which emerge naturally through repeated output?","\u54EA\u4E9B\u80FD\u529B\u9700\u8981\u8DB3\u591F\u652F\u6301\u6216\u7EC3\u4E60\u540E\u624D\u7A33\u5B9A\uFF0C\u54EA\u4E9B\u4F1A\u901A\u8FC7\u53CD\u590D\u8F93\u51FA\u81EA\u7136\u663E\u73B0\uFF1F"]},PRESSURE:{lens:["Pressure is read from officer/control functions, direct tensions and the Day Master\u2019s carrying response.","\u538B\u529B\u4E3B\u9898\u4ECE\u5B98\u6740\uFF0F\u53D7\u514B\u529F\u80FD\u3001\u76F4\u63A5\u5F20\u529B\u4E0E\u65E5\u4E3B\u627F\u8F7D\u53CD\u5E94\u4E00\u8D77\u8BFB\u3002"],reality:["Under what kinds of standards, deadlines or authority does pressure become productive, and when does it overwhelm available support?","\u9762\u5BF9\u54EA\u4E9B\u6807\u51C6\u3001\u671F\u9650\u6216\u6743\u8D23\u65F6\u538B\u529B\u4F1A\u8F6C\u6210\u63A8\u52A8\u529B\uFF0C\u4EC0\u4E48\u65F6\u5019\u53C8\u4F1A\u8D85\u8FC7\u73B0\u6709\u652F\u6301\uFF1F"]},LIFE_OPERATION:{lens:["Life operation asks how support, output, resources, responsibility and relationships circulate as one system.","\u751F\u6D3B\u8FD0\u884C\u770B\u652F\u6301\u3001\u8F93\u51FA\u3001\u8D44\u6E90\u3001\u8D23\u4EFB\u4E0E\u5173\u7CFB\u600E\u6837\u4F5C\u4E3A\u4E00\u4E2A\u7CFB\u7EDF\u5FAA\u73AF\u3002"],reality:["What recurring daily pattern best shows how you receive support, spend energy, respond to pressure and recover?","\u54EA\u4E00\u79CD\u53CD\u590D\u51FA\u73B0\u7684\u65E5\u5E38\u6A21\u5F0F\u6700\u80FD\u770B\u51FA\u4F60\u5982\u4F55\u83B7\u5F97\u652F\u6301\u3001\u6D88\u8017\u80FD\u91CF\u3001\u56DE\u5E94\u538B\u529B\u4E0E\u6062\u590D\uFF1F"]}},Yn=n=>h(zn,n,t("Chart theme","\u6574\u76D8\u4E3B\u9898")),ie=n=>h(Gn,n,String(n||"")),P=n=>t(n?.en||"",n?.zhHans||"");function Ne(n,r){return c(n?.professionalModules?.customerNarrative?.topicNarratives).find(a=>a.topicCode===r)||null}function Bn(n,r){return c(n?.professionalModules?.realityBridge?.priorityPrompts).find(a=>a.priorityRef===r)?.prompts||[]}function Vn(n,r){return c(n?.professionalModules?.realityBridge?.topicPrompts).find(a=>a.topicCode===r)?.prompts||[]}function Fn(n){return c(n?.professionalModules?.realityBridge?.timingPrompts)}function ce(n,{compact:r=!1}={}){let a=c(n).slice(0,2);return a.length?`<aside class="cx-bazi-reality-bridge${r?" cx-bazi-reality-bridge--compact":""}" data-bazi-cx-pro-reality-bridge="true"><strong>${e(t("Bring this chapter back to reality","\u628A\u8FD9\u4E00\u7AE0\u5E26\u56DE\u73B0\u5B9E"))}</strong><ol>${a.map(s=>`<li>${e(P(s.prompt))}</li>`).join("")}</ol><small>${e(t("Look for repetition, context and counterexamples. Agreement is not required.","\u91CD\u70B9\u89C2\u5BDF\u91CD\u590D\u3001\u60C5\u5883\u4E0E\u53CD\u4F8B\uFF1B\u4E0D\u8981\u6C42\u73B0\u5B9E\u4E00\u5B9A\u7B26\u5408\u8FD9\u6BB5\u89E3\u8BFB\u3002"))}</small></aside>`:""}function q(n,{embedded:r=!1}={}){if(!O(n))return"";C();let a=n?.professionalModules?.customerNarrative;return a?.schemaVersion!=="PHI-OS-BAZI-CX-PRO-CUSTOMER-NARRATIVE-v1.0.0"?"":`<section class="cx-bazi-customer-narrative${r?" cx-bazi-surface--embedded":""}" data-bazi-cx-pro-customer-narrative="true"><header class="cx-bazi-narrative-opening"><p class="cx-eyebrow">${e(t("YOUR READING THREAD","\u4F60\u7684\u6574\u76D8\u4E3B\u7EBF"))}</p><h3>${e(P(a.opening?.headline))}</h3>${c(a.opening?.paragraphs).map(s=>`<p>${e(P(s))}</p>`).join("")}</header><div class="cx-bazi-narrative-thread">${c(a.priorityChapters).map(s=>`<article class="cx-bazi-narrative-chapter" data-theme-type="${e(s.themeType)}"><header><span>${String(s.rank).padStart(2,"0")}</span><h4>${e(P(s.title))}</h4></header><p class="cx-bazi-narrative-thesis">${e(P(s.thesis))}</p><p>${e(P(s.development))}</p><aside>${e(P(s.condition))}</aside>${ce(Bn(n,s.priorityRef))}</article>`).join("")}</div></section>`}function Wn(n){let r=n?.professionalModules?.customerNarrative?.timingNarrative;return r?.available?`<section class="cx-bazi-timing-narrative" data-bazi-cx-pro-timing-narrative="true"><p class="cx-eyebrow">${e(t("TIMING NARRATIVE","\u5F53\u524D\u65F6\u95F4\u4E3B\u7EBF"))}</p><h4>${e(P(r.headline))}</h4>${c(r.paragraphs).map(a=>`<p>${e(P(a))}</p>`).join("")}${ce(Fn(n),{compact:!0})}</section>`:""}function le(n){return n?.themeType==="CARRYING"?t("How the Day Master carries the whole chart","\u65E5\u4E3B\u600E\u6837\u627F\u8F7D\u6574\u76D8"):n?.themeType==="TEN_GOD_GROUP"?t(`${R(n.themeKey)} comes to the foreground`,`${R(n.themeKey)}\u6210\u4E3A\u524D\u666F\u529F\u80FD\u7EC4`):n?.themeType==="RELATIONSHIP"?t(`${x(n.themeKey)} is a key interface`,`${x(n.themeKey)}\u662F\u5173\u952E\u63A5\u53E3`):n?.themeType==="PATTERN"?t(`${G(n.themeKey)} deserves early attention`,`${G(n.themeKey)}\u503C\u5F97\u4F18\u5148\u6838\u5BF9`):n?.themeType==="TIMING"?t("The selected timing layer is activating natal structure","\u5F53\u524D\u65F6\u95F4\u5C42\u6B63\u5728\u5E26\u52A8\u539F\u5C40\u7ED3\u6784"):t("Whole-chart theme","\u6574\u76D8\u4E3B\u9898")}function kn(n){let r=n?.facts||{};return n?.themeType==="CARRYING"?t(`Roots ${r.rootCount||0}, visible support ${r.supportVisible||0}, drain/consumption ${r.outwardVisible||0}, pressure ${r.pressureVisible||0}. This balance changes how every other symbol can be carried.`,`\u6839\u6C14 ${r.rootCount||0}\u3001\u53EF\u89C1\u751F\u6276 ${r.supportVisible||0}\u3001\u6CC4\u8017 ${r.outwardVisible||0}\u3001\u514B ${r.pressureVisible||0}\uFF1B\u8FD9\u7EC4\u627F\u8F7D\u5173\u7CFB\u4F1A\u6539\u53D8\u5176\u4ED6\u7B26\u53F7\u600E\u6837\u771F\u6B63\u843D\u5730\u3002`):n?.themeType==="TEN_GOD_GROUP"?t(`${R(r.groupCode)} accounts for ${r.ratio||0}% of the Ten-God occurrence structure and links to ${c(r.tenGods).map(a=>g(a.tenGodCode)).join(" / ")||"the visible Ten-God layer"}.`,`\u300C${R(r.groupCode)}\u300D\u5360\u5F53\u524D\u5341\u795E\u843D\u70B9 ${r.ratio||0}% \uFF0C\u4E3B\u8981\u7531 ${c(r.tenGods).map(a=>g(a.tenGodCode)).join("\uFF0F")||"\u5F53\u524D\u5341\u795E\u5C42"} \u6784\u6210\u3002`):n?.themeType==="RELATIONSHIP"?t(`${D(r.type)} directly links ${c(r.positions).map(L).join(" \u2194 ")} and brings ${c(r.functionGroups).map(R).join(" / ")||"multiple functions"} into the same structural interface.`,`${D(r.type)}\u76F4\u63A5\u8FDE\u63A5 ${c(r.positions).map(L).join(" \u2194 ")}\uFF0C\u5E76\u628A ${c(r.functionGroups).map(R).join("\uFF0F")||"\u591A\u4E2A\u529F\u80FD\u7EC4"} \u653E\u8FDB\u540C\u4E00\u4E2A\u7ED3\u6784\u63A5\u53E3\u3002`):n?.themeType==="PATTERN"?t(`${r.tenGodZh||g(r.tenGodCode)} enters the month-command pattern path with ${r.visiblePathCount||0} visible formation path(s); the primary pattern still follows the governed conclusion state.`,`${r.tenGodZh||g(r.tenGodCode)}\u8FDB\u5165\u6708\u4EE4\u683C\u5C40\u8DEF\u5F84\uFF0C\u76EE\u524D\u6709 ${r.visiblePathCount||0} \u6761\u6210\u683C\u8DEF\u5F84\u51FA\u73B0\u652F\u6301\uFF1B\u662F\u5426\u6210\u4E3A\u4E3B\u683C\u4ECD\u670D\u4ECE\u5B8C\u6574\u683C\u5C40\u6761\u4EF6\u3002`):n?.themeType==="TIMING"?t(`${r.crossLayerGroupCount||0} cross-layer group(s) and ${r.interactionCount||0} timing interaction(s) are visible for the selected target context.`,`\u6240\u9009\u65F6\u95F4\u60C5\u5883\u91CC\u53EF\u89C1 ${r.crossLayerGroupCount||0} \u7EC4\u8DE8\u5C42\u7ED3\u6784\u4E0E ${r.interactionCount||0} \u9879\u65F6\u95F4\u4E92\u52A8\u3002`):t("This theme has multiple chart-level links.","\u8FD9\u4E2A\u4E3B\u9898\u8FDE\u63A5\u4E86\u591A\u4E2A\u6574\u76D8\u5C42\u6B21\u3002")}function Kn(n){return n?.themeType==="CARRYING"?t("Check whether the same task becomes easier or harder when support, rest, resources or external pressure change.","\u89C2\u5BDF\u540C\u4E00\u4EF6\u4E8B\u5728\u652F\u6301\u3001\u4F11\u606F\u3001\u8D44\u6E90\u6216\u5916\u90E8\u538B\u529B\u6539\u53D8\u65F6\uFF0C\u627F\u8F7D\u611F\u662F\u5426\u660E\u663E\u4E0D\u540C\u3002"):n?.themeType==="TEN_GOD_GROUP"?t("Look for situations where this functional group repeatedly appears, and note where another group takes over instead.","\u89C2\u5BDF\u8FD9\u4E2A\u529F\u80FD\u7EC4\u5728\u54EA\u4E9B\u60C5\u5883\u53CD\u590D\u51FA\u73B0\uFF0C\u4E5F\u8BB0\u5F55\u4EC0\u4E48\u65F6\u5019\u53CD\u800C\u7531\u53E6\u4E00\u7EC4\u529F\u80FD\u63A5\u7BA1\u3002"):n?.themeType==="RELATIONSHIP"?t("Compare the same interface across roles and environments; repeated structure matters more than one isolated event.","\u628A\u540C\u4E00\u4E2A\u63A5\u53E3\u653E\u5230\u4E0D\u540C\u89D2\u8272\u4E0E\u73AF\u5883\u6BD4\u8F83\uFF1B\u53CD\u590D\u7ED3\u6784\u6BD4\u5355\u4E00\u4E8B\u4EF6\u66F4\u503C\u5F97\u91CD\u89C6\u3002"):n?.themeType==="PATTERN"?t("Check whether formation support, modifying relations and counter-evidence appear together in lived situations.","\u89C2\u5BDF\u6210\u683C\u652F\u6301\u3001\u5173\u7CFB\u4FEE\u6B63\u4E0E\u53CD\u8BC1\u662F\u5426\u4F1A\u5728\u771F\u5B9E\u60C5\u5883\u91CC\u4E00\u8D77\u51FA\u73B0\u3002"):t("Separate what persists across periods from what appears only in this selected timing window.","\u628A\u8DE8\u9636\u6BB5\u6301\u7EED\u5B58\u5728\u7684\u90E8\u5206\uFF0C\u4E0E\u53EA\u5728\u5F53\u524D\u65F6\u95F4\u7A97\u53E3\u51FA\u73B0\u7684\u90E8\u5206\u5206\u5F00\u3002")}function Q(n,{embedded:r=!1}={}){if(!O(n))return"";C();let a=n?.professionalModules?.wholeChartPriority;return a?.schemaVersion!=="PHI-OS-BAZI-CX-PRO-WHOLE-CHART-PRIORITY-v1.0.0"?"":`<section class="cx-bazi-whole-chart-priority${r?" cx-bazi-surface--embedded":""}" data-bazi-cx-pro-whole-chart-priority="true"><header class="cx-bazi-professional-head"><div><p class="cx-eyebrow">${e(t("WHOLE-CHART PRIORITY","\u6574\u76D8\u4F18\u5148\u4E3B\u9898"))}</p><h3>${e(t("Do not read everything at the same volume. Start with the 3\u20135 structures that organize the rest of the chart.","\u4E0D\u8981\u628A\u6240\u6709\u7B26\u53F7\u7528\u540C\u6837\u97F3\u91CF\u9010\u9879\u7F57\u5217\uFF0C\u5148\u6293\u4F4F\u771F\u6B63\u7EC4\u7EC7\u6574\u76D8\u7684 3\u20135 \u4E2A\u7ED3\u6784\u3002"))}</h3><p>${e(t("Priority is determined by chart connectivity: Day Master carrying, dominant functional groups, direct pillar interfaces, pattern support and explicit timing activation. It is reading order\u2014not a fate score.","\u4F18\u5148\u987A\u5E8F\u6765\u81EA\u6574\u76D8\u8FDE\u63A5\u5EA6\uFF1A\u65E5\u4E3B\u627F\u8F7D\u3001\u524D\u666F\u529F\u80FD\u7EC4\u3001\u76F4\u63A5\u67F1\u4F4D\u63A5\u53E3\u3001\u683C\u5C40\u652F\u6301\u4E0E\u660E\u786E\u65F6\u95F4\u6FC0\u6D3B\u3002\u5B83\u662F\u9605\u8BFB\u987A\u5E8F\uFF0C\u4E0D\u662F\u547D\u8FD0\u8BC4\u5206\u3002"))}</p></div><span class="cx-bazi-season-chip">${e(t(`${a.themeCount} priorities`,`${a.themeCount} \u4E2A\u4F18\u5148\u4E3B\u9898`))}</span></header><div class="cx-bazi-priority-grid">${c(a.themes).map(s=>`<article class="cx-bazi-priority-card" data-priority-type="${e(s.themeType)}"><header><span>${String(s.rank).padStart(2,"0")}</span><div><small>${e(Yn(s.themeType))}</small><h4>${e(le(s))}</h4></div></header><p>${e(kn(s))}</p><footer><strong>${e(t("Reality check","\u73B0\u5B9E\u89C2\u5BDF"))}</strong><span>${e(Kn(s))}</span></footer></article>`).join("")}</div></section>`}function Re(n){return c(n?.relevantGroups).length?c(n.relevantGroups).map(r=>`${R(r.groupCode)} ${r.ratio}%`).join(" \xB7 "):t("No single functional group is foregrounded.","\u5F53\u524D\u6CA1\u6709\u5355\u4E00\u529F\u80FD\u7EC4\u660E\u663E\u524D\u666F\u5316\u3002")}function jn(n){let r=c(n?.relevantTenGods).slice(0,4);return r.length?r.map(a=>`${g(a.tenGodCode)} ${a.ratio}%${a.visibleCount?t(" visible"," \u900F\u5E72"):""}`).join(" \xB7 "):t("No specific Ten-God point is foregrounded for this topic.","\u8FD9\u4E2A\u4E3B\u9898\u76EE\u524D\u6CA1\u6709\u7279\u5B9A\u5341\u795E\u843D\u70B9\u660E\u663E\u524D\u666F\u5316\u3002")}function Zn(n){let r=c(n?.patternCandidates).slice(0,3);return r.length?r.map(a=>`${a.tenGodZh||g(a.tenGodCode)} \xB7 ${G(a.patternFamily)}${a.visiblePathCount?t(` \xB7 ${a.visiblePathCount} supported path(s)`,` \xB7 ${a.visiblePathCount} \u6761\u6210\u683C\u652F\u6301`):""}`).join("\uFF1B"):t("No current pattern path is required to explain this topic.","\u8FD9\u4E2A\u4E3B\u9898\u76EE\u524D\u4E0D\u9700\u8981\u4F9D\u8D56\u67D0\u4E00\u6761\u683C\u5C40\u8DEF\u5F84\u624D\u80FD\u6210\u7ACB\u3002")}function Xn(n){let r=c(n?.relationshipInterfaces).slice(0,3);return r.length?r.map(a=>`${D(a.type)} \xB7 ${x(a.positionThemeCode)}`).join("\uFF1B"):t("No direct pillar interface is foregrounded for this topic.","\u8FD9\u4E2A\u4E3B\u9898\u76EE\u524D\u6CA1\u6709\u76F4\u63A5\u67F1\u4F4D\u63A5\u53E3\u88AB\u524D\u666F\u5316\u3002")}function qn(n){let r=U[n?.topicCode]||U.LIFE_OPERATION,a=n?.carryingContext||{};return t(`${r.lens[0]} The foreground functional mix is ${Re(n)}. Day-Master carrying is ${M(a.overallTendency)}, with roots ${a.rootCount||0}, support ${a.supportVisible||0}, drain/consumption ${a.outwardVisible||0}, and pressure ${a.pressureVisible||0}.`,`${r.lens[1]} \u5F53\u524D\u524D\u666F\u529F\u80FD\u7EC4\u5408\u4E3A\uFF1A${Re(n)}\u3002\u65E5\u4E3B\u627F\u8F7D\u5448\u300C${M(a.overallTendency)}\u300D\uFF0C\u6839\u6C14 ${a.rootCount||0}\u3001\u751F\u6276 ${a.supportVisible||0}\u3001\u6CC4\u8017 ${a.outwardVisible||0}\u3001\u514B ${a.pressureVisible||0}\u3002`)}function J(n,{embedded:r=!1}={}){if(!O(n))return"";C();let a=n?.professionalModules?.professionalTopics;return a?.schemaVersion!=="PHI-OS-BAZI-CX-PRO-PROFESSIONAL-TOPIC-READING-v1.0.0"?"":`<section class="cx-bazi-professional-topics${r?" cx-bazi-surface--embedded":""}" data-bazi-cx-pro-professional-topics="true"><header class="cx-bazi-professional-head"><div><p class="cx-eyebrow">${e(t("PROFESSIONAL TOPIC READING","\u4E13\u4E1A\u4E3B\u9898\u89E3\u8BFB"))}</p><h3>${e(t("Career, wealth, relationships and daily life should be composed from the chart\u2014not generated from one symbol.","\u4E8B\u4E1A\u3001\u8D22\u5BCC\u3001\u5173\u7CFB\u4E0E\u751F\u6D3B\u4E3B\u9898\u8981\u4ECE\u6574\u76D8\u7EC4\u5408\u51FA\u6765\uFF0C\u800C\u4E0D\u662F\u62FF\u4E00\u4E2A\u7B26\u53F7\u76F4\u63A5\u4E0B\u7ED3\u8BBA\u3002"))}</h3><p>${e(t("Each topic below combines Ten-God distribution, pattern paths, pillar interfaces and Day-Master carrying. Missing dimensions stay visible instead of being filled with generic fortune-telling copy.","\u4E0B\u9762\u6BCF\u4E2A\u4E3B\u9898\u90FD\u4F1A\u7EC4\u5408\u5341\u795E\u5206\u5E03\u3001\u683C\u5C40\u8DEF\u5F84\u3001\u67F1\u4F4D\u63A5\u53E3\u4E0E\u65E5\u4E3B\u627F\u8F7D\uFF1B\u6CA1\u6709\u51FA\u73B0\u7684\u5C42\u6B21\u5C31\u4FDD\u6301\u7A7A\u7F3A\uFF0C\u4E0D\u7528\u901A\u7528\u7B97\u547D\u6587\u6848\u8865\u6EE1\u3002"))}</p></div><span class="cx-bazi-season-chip">${e(t(`${a.topicCount} composed topics`,`${a.topicCount} \u4E2A\u7EC4\u5408\u4E3B\u9898`))}</span></header><div class="cx-bazi-topic-grid">${c(a.topics).map((s,i)=>{let l=U[s.topicCode]||U.LIFE_OPERATION;return`<article class="cx-bazi-topic-card" data-topic="${e(s.topicCode)}" data-state="${e(s.state)}"><header><div><small>${String(i+1).padStart(2,"0")} \xB7 ${e(t("multi-factor composition","\u591A\u56E0\u7D20\u7EC4\u5408"))}</small><h4>${e(ie(s.topicCode))}</h4></div><span>${e(c(s.compositionDimensions).length)} ${e(t("layers","\u5C42"))}</span></header>${(()=>{let o=Ne(n,s.topicCode);return o?`<p class="cx-bazi-topic-lead">${e(P(o.lead))}</p><p class="cx-bazi-topic-narrative">${e(P(o.development))}</p>`:`<p class="cx-bazi-topic-lead">${e(qn(s))}</p>`})()}<div class="cx-bazi-topic-evidence"><section><small>${e(t("TEN GODS / FUNCTIONS","\u5341\u795E\uFF0F\u529F\u80FD\u7EC4"))}</small><p>${e(jn(s))}</p></section><section><small>${e(t("PATTERN PATHS","\u683C\u5C40\u8DEF\u5F84"))}</small><p>${e(Zn(s))}</p></section><section><small>${e(t("PILLAR INTERFACES","\u67F1\u4F4D\u63A5\u53E3"))}</small><p>${e(Xn(s))}</p></section></div>${(()=>{let o=Ne(n,s.topicCode);return o?`<aside class="cx-bazi-topic-condition"><strong>${e(t("How to hold this reading","\u8FD9\u6BB5\u89E3\u8BFB\u600E\u4E48\u62FF\u634F"))}</strong><p>${e(P(o.condition))}</p></aside>`:""})()}${(()=>{let o=Vn(n,s.topicCode);return o.length?ce(o,{compact:!0}):`<footer><strong>${e(t("Reality check","\u73B0\u5B9E\u89C2\u5BDF"))}</strong><p>${e(t(l.reality[0],l.reality[1]))}</p></footer>`})()}</article>`}).join("")}</div><aside class="cx-bazi-professional-boundary"><strong>${e(t("Topic reading is not event prediction","\u4E3B\u9898\u89E3\u8BFB\u4E0D\u662F\u4E8B\u4EF6\u9884\u6D4B"))}</strong><p>${e(t("These sections describe how chart functions can organize a life domain. They do not establish guaranteed career, money, marriage, family or health outcomes.","\u8FD9\u4E9B\u7AE0\u8282\u8BF4\u660E\u547D\u76D8\u529F\u80FD\u600E\u6837\u7EC4\u7EC7\u67D0\u4E2A\u751F\u6D3B\u9886\u57DF\uFF0C\u4E0D\u5EFA\u7ACB\u5FC5\u7136\u804C\u4E1A\u3001\u8D22\u5BCC\u3001\u5A5A\u59FB\u3001\u5BB6\u5EAD\u6216\u5065\u5EB7\u7ED3\u679C\u3002"))}</p></aside></section>`}function ee(n,{embedded:r=!1}={}){if(!O(n))return"";C();let a=c(n?.professionalModules?.schools);return a.length?`<section class="cx-bazi-school-surface${r?" cx-bazi-surface--embedded":""}" data-ppr-bazi-school-professional="true" data-w15-section="SCHOOLS"><header class="cx-bazi-professional-head"><div><p class="cx-eyebrow">${e(t("THREE SCHOOLS \xB7 KEPT DISTINCT","\u4E09\u5957\u5B66\u6D3E \xB7 \u5206\u5F00\u9605\u8BFB"))}</p><h3>${e(t("Three schools can ask different questions of the same chart without being forced into one answer.","\u540C\u4E00\u5F20\u547D\u76D8\u53EF\u4EE5\u4ECE\u4E09\u79CD\u6280\u672F\u89C6\u89D2\u9605\u8BFB\uFF0C\u4E0D\u5FC5\u786C\u628A\u5B83\u4EEC\u63C9\u6210\u4E00\u4E2A\u7B54\u6848\u3002"))}</h3><p>${e(t("Differences are shown as different reading angles, not as an internal status problem.","\u5B66\u6D3E\u5DEE\u5F02\u4F1A\u76F4\u63A5\u89E3\u91CA\u6210\u4E0D\u540C\u9605\u8BFB\u89D2\u5EA6\uFF0C\u800C\u4E0D\u662F\u8BA9\u5BA2\u6237\u9762\u5BF9\u5185\u90E8\u72B6\u6001\u8BED\u8A00\u3002"))}</p></div><span class="cx-personal-status-chip" data-state="school">${e(t("Different school readings","\u5B58\u5728\u4E0D\u540C\u5B66\u6D3E\u89E3\u91CA"))}</span></header><div class="cx-bazi-school-professional-grid">${a.map(s=>`<article class="cx-bazi-school-card"><header><span>${e(W(s.resolutionState))}</span><h4>${e(A(s.customerTitle||Ie(s.schoolCode)))}</h4></header><dl><div><dt>${e(t("What this school examines","\u8FD9\u4E2A\u5B66\u6D3E\u5728\u770B\u4EC0\u4E48"))}</dt><dd>${e(Ie(s.schoolCode))}</dd></div><div><dt>${e(t("What this chart currently shows","\u8FD9\u5F20\u76D8\u76EE\u524D\u770B\u5230\u4E86\u4EC0\u4E48"))}</dt><dd>${e(wn(s))}</dd></div><div><dt>${e(t("How to read it now","\u76EE\u524D\u53EF\u4EE5\u600E\u4E48\u7406\u89E3"))}</dt><dd>${e(A(s.customerText||t("This view still needs more chart-level support before a stronger conclusion.","\u8FD9\u4E2A\u89C6\u89D2\u4ECD\u8981\u7ED3\u5408\u66F4\u591A\u6574\u76D8\u6761\u4EF6\uFF0C\u6682\u4E0D\u4F5C\u66F4\u5F3A\u5224\u65AD\u3002")))}</dd></div><div><dt>${e(t("What still needs checking","\u8FD8\u8981\u7EE7\u7EED\u6838\u5BF9\u4EC0\u4E48"))}</dt><dd>${e(Un(s))}</dd></div></dl></article>`).join("")}</div></section>`:""}function V(n,r){return c(n).length?`<ul>${c(n).map(a=>`<li><strong>${e(D(a.type))}</strong><span>${e(be(a.members,a.type))}${a.natalPosition?` \xB7 ${e(Y(a.natalPosition))}`:""}</span></li>`).join("")}</ul>`:`<p class="cx-bazi-muted">${e(r)}</p>`}var Qn={DA_YUN_LIU_NIAN_CONVERGENCE:["Da Yun + Liu Nian both active","\u5927\u8FD0 \xD7 \u6D41\u5E74\u5171\u540C\u8FDB\u5165"],DA_YUN_ACTIVE:["Da Yun active","\u5927\u8FD0\u8FDB\u5165"],LIU_NIAN_ACTIVE:["Liu Nian active","\u6D41\u5E74\u8FDB\u5165"],NATAL_BASELINE_ONLY:["Natal baseline","\u539F\u5C40\u57FA\u7EBF"]},Jn={PRIMARY:["Primary entry","\u4E3B\u8F74\u8FDB\u5165"],SUPPORTING:["Supporting entry","\u652F\u6301\u8FDB\u5165"],CONTEXT:["Contextual entry","\u60C5\u5883\u8FDB\u5165"],NONE:["No direct entry","\u672A\u76F4\u63A5\u8FDB\u5165"]},et=n=>h(Qn,n,t("Natal baseline","\u539F\u5C40\u57FA\u7EBF")),Oe=n=>h(Jn,n,t("No direct entry","\u672A\u76F4\u63A5\u8FDB\u5165"));function nt(n,r){let a=c(n?.professionalModules?.wholeChartPriority?.themes).find(s=>s.priorityId===r);return a?le(a):t("Natal priority","\u539F\u5C40\u91CD\u70B9")}function tt(n){return c(n).slice(0,4).map(r=>`<span>${e(ie(r.topicCode))}</span>`).join("")}function rt(n,r){let a=c(n.priorityRefs).slice(0,2).map(i=>nt(r,i)),s=c(n.functionGroups).map(R);return`<article class="cx-bazi-professional-cycle"${n.isSelected?' data-current="true"':""}><header><small>${e(t(`Cycle ${n.cycleNumber}`,`\u7B2C ${n.cycleNumber} \u8FD0`))}</small>${n.isSelected?`<em>${e(t("Selected window","\u5F53\u524D\u7A97\u53E3"))}</em>`:""}</header><strong>${e(`${n.pillar?.stem?.zh||""}${n.pillar?.branch?.zh||""}`)}</strong><span>${e(`${n.startAge}\u2013${n.endAge} \xB7 ${n.stemTenGod?.zh||""}`)}</span><div class="cx-bazi-cycle-groups">${s.length?s.map(i=>`<span>${e(i)}</span>`).join(""):`<span>${e(t("Function group open","\u529F\u80FD\u7EC4\u5F85\u6838\u5BF9"))}</span>`}</div><div class="cx-bazi-cycle-topics">${tt(n.topicActivations)}</div><footer><span>${e(t(`${n.activationEvidence?.interactionCount||0} natal interaction(s)`,`${n.activationEvidence?.interactionCount||0} \u9879\u539F\u5C40\u4E92\u52A8`))}</span>${a.length?`<small>${e(a.join(" \xB7 "))}</small>`:""}</footer></article>`}var at={FULL:["Da Yun + Liu Nian available","\u5927\u8FD0\u4E0E\u6D41\u5E74\u5DF2\u5EFA\u7ACB"],DA_YUN_ONLY:["Da Yun available \xB7 Liu Nian open","\u5927\u8FD0\u5DF2\u5EFA\u7ACB \xB7 \u6D41\u5E74\u5F85\u786E\u8BA4"],LIU_NIAN_ONLY:["Liu Nian available \xB7 Da Yun open","\u6D41\u5E74\u5DF2\u5EFA\u7ACB \xB7 \u5927\u8FD0\u5F85\u786E\u8BA4"],TARGET_ONLY:["Target context established \xB7 timing layers open","\u76EE\u6807\u65F6\u95F4\u5DF2\u5EFA\u7ACB \xB7 \u65F6\u95F4\u5C42\u5F85\u786E\u8BA4"],NO_TARGET:["No target context","\u672A\u63D0\u4F9B\u76EE\u6807\u65F6\u95F4"]},st=n=>h(at,n,t("Timing layers open","\u65F6\u95F4\u5C42\u5F85\u786E\u8BA4"));function ot(n,r){let a=n.currentWindow||{},s=a.currentDaYun,i=a.annual,l=c(r?.professionalModules?.wholeChartPriority?.themes),o=l.slice(0,5).map(le);return`<section class="cx-bazi-current-window"><header><div><p class="cx-eyebrow">${e(t("SELECTED TIMING WINDOW","\u6240\u9009\u65F6\u95F4\u7A97\u53E3"))}</p><h4>${e(t("Read the target window as natal priorities passing through Da Yun, then Liu Nian.","\u628A\u76EE\u6807\u65F6\u95F4\u8BFB\u6210\u300C\u539F\u5C40\u91CD\u70B9 \u2192 \u5927\u8FD0\u9636\u6BB5 \u2192 \u6D41\u5E74\u89E6\u53D1\u300D\u7684\u8FDE\u7EED\u7ED3\u6784\u3002"))}</h4><small>${e(st(a.completeness))}</small></div><span>${e(n.targetContext?.targetDate||"")}</span></header><div class="cx-bazi-timeline-flow"><article data-layer="natal"><small>${e(t("01 \xB7 Natal priorities","01 \xB7 \u539F\u5C40\u91CD\u70B9"))}</small><strong>${e(t(`${n.natalPriorityCount} priority themes`,`${n.natalPriorityCount} \u4E2A\u4F18\u5148\u4E3B\u9898`))}</strong><p>${e(o.slice(0,3).join(" \xB7 "))}</p></article><i aria-hidden="true">\u2192</i><article data-layer="dayun"><small>${e(t("02 \xB7 Da Yun","02 \xB7 \u5927\u8FD0"))}</small><strong>${e(`${s?.pillar?.stem?.zh||""}${s?.pillar?.branch?.zh||""}`)}</strong><p>${e(`${s?`${s.startAge}\u2013${s.endAge} \xB7 ${s.stemTenGod?.zh||""} \xB7 ${c(a.currentDaYunFunctionGroups).map(R).join("\uFF0F")}`:t("Current Da Yun remains open","\u5F53\u524D\u5927\u8FD0\u4ECD\u5F85\u786E\u8BA4")}`)}</p></article><i aria-hidden="true">\u2192</i><article data-layer="liunian"><small>${e(t("03 \xB7 Liu Nian","03 \xB7 \u6D41\u5E74"))}</small><strong>${e(`${i?.stem?.zh||""}${i?.branch?.zh||""}`)}</strong><p>${e(`${i?`${i.year||""} \xB7 ${i.stemTenGod?.zh||""} \xB7 ${c(a.annualFunctionGroups).map(R).join("\uFF0F")}`:t("Liu Nian remains open","\u6D41\u5E74\u4ECD\u5F85\u786E\u8BA4")}`)}</p></article><i aria-hidden="true">\u2192</i><article data-layer="topics"><small>${e(t("04 \xB7 Life themes","04 \xB7 \u4E03\u5927\u751F\u6D3B\u4E3B\u9898"))}</small><strong>${e(t("See which themes are foregrounded","\u770B\u54EA\u4E9B\u4E3B\u9898\u8FDB\u5165\u524D\u666F"))}</strong><p>${e(t("Activation is structural relevance, not an event promise.","\u6FC0\u6D3B\u8868\u793A\u7ED3\u6784\u76F8\u5173\u6027\uFF0C\u4E0D\u662F\u4E8B\u4EF6\u4FDD\u8BC1\u3002"))}</p></article></div></section>`}function it(n){let r=c(n?.currentWindow?.topicTimeline);return r.length?`<section class="cx-bazi-timing-topic-section"><header><h4>${e(t("Seven themes in this timing window","\u4E03\u5927\u4E3B\u9898\u5728\u8FD9\u4E2A\u65F6\u95F4\u7A97\u53E3\u600E\u6837\u53D8\u5316"))}</h4><p>${e(t("The natal topic remains the baseline. Da Yun and Liu Nian only show which existing themes become more foregrounded.","\u539F\u5C40\u4E3B\u9898\u59CB\u7EC8\u662F\u57FA\u7EBF\uFF1B\u5927\u8FD0\u4E0E\u6D41\u5E74\u53EA\u663E\u793A\u54EA\u4E9B\u5DF2\u6709\u4E3B\u9898\u5728\u5F53\u524D\u9636\u6BB5\u66F4\u524D\u666F\u5316\u3002"))}</p></header><div class="cx-bazi-timing-topic-grid">${r.map(a=>{let s=U[a.topicCode]||U.LIFE_OPERATION,i=c(a.daYun?.matchedGroups).map(R),l=c(a.liuNian?.matchedGroups).map(R);return`<article data-topic="${e(a.topicCode)}" data-activation="${e(a.activationState)}"><header><div><small>${e(et(a.activationState))}</small><h5>${e(ie(a.topicCode))}</h5></div><span>${e(a.crossLayerInteractionCount||0)}</span></header><p>${e(t(s.lens[0],s.lens[1]))}</p><dl><div><dt>${e(t("Da Yun contribution","\u5927\u8FD0\u5E26\u5165"))}</dt><dd>${e(`${Oe(a.daYun?.activationBand)}${i.length?` \xB7 ${i.join("\uFF0F")}`:""}`)}</dd></div><div><dt>${e(t("Liu Nian contribution","\u6D41\u5E74\u5E26\u5165"))}</dt><dd>${e(`${Oe(a.liuNian?.activationBand)}${l.length?` \xB7 ${l.join("\uFF0F")}`:""}`)}</dd></div><div><dt>${e(t("Cross-layer relations","\u8DE8\u5C42\u4E92\u52A8"))}</dt><dd>${e(a.crossLayerInteractionCount?`${a.crossLayerInteractionCount} \xB7 ${c(a.crossLayerInteractionTypes).map(D).join("\uFF0F")}`:t("No additional cross-layer relation","\u6CA1\u6709\u989D\u5916\u8DE8\u5C42\u5173\u7CFB"))}</dd></div></dl><footer><strong>${e(t("Reality observation","\u73B0\u5B9E\u89C2\u5BDF"))}</strong><span>${e(t(s.reality[0],s.reality[1]))}</span></footer></article>`}).join("")}</div></section>`:""}function ct(n){let r=n?.currentWindow?.interactions||{};return`<section class="cx-bazi-interaction-section"><header><h4>${e(t("Interaction layers","\u7ED3\u6784\u4E92\u52A8"))}</h4><p>${e(t("Each relation remains traceable to natal, Da Yun or Liu Nian. Structure present \u2260 transformation established; relation present \u2260 event certainty.","\u6BCF\u9879\u5173\u7CFB\u90FD\u4FDD\u7559\u539F\u5C40\u3001\u5927\u8FD0\u6216\u6D41\u5E74\u7684\u6765\u6E90\uFF1B\u7EC4\u5408\u51FA\u73B0 \u2260 \u5DF2\u7ECF\u5316\u6210\uFF0C\u5173\u7CFB\u51FA\u73B0\u4E5F\u4E0D\u7B49\u4E8E\u4E8B\u4EF6\u786E\u5B9A\u3002"))}</p></header><div class="cx-bazi-interaction-grid"><article><h5>${e(t("Natal \xD7 Da Yun","\u539F\u5C40 \xD7 \u5927\u8FD0"))}</h5>${V(r.daYunToNatal,t("No additional interaction established.","\u6CA1\u6709\u5EFA\u7ACB\u989D\u5916\u4E92\u52A8\u3002"))}</article><article><h5>${e(t("Natal \xD7 Liu Nian","\u539F\u5C40 \xD7 \u6D41\u5E74"))}</h5>${V(r.liuNianToNatal,t("No additional interaction established.","\u6CA1\u6709\u5EFA\u7ACB\u989D\u5916\u4E92\u52A8\u3002"))}</article><article><h5>${e(t("Da Yun \xD7 Liu Nian","\u5927\u8FD0 \xD7 \u6D41\u5E74"))}</h5>${V(r.daYunToLiuNian,t("No additional interaction established.","\u6CA1\u6709\u5EFA\u7ACB\u989D\u5916\u4E92\u52A8\u3002"))}</article><article><h5>${e(t("Cross-layer groups","\u8DE8\u5C42\u7EC4\u5408"))}</h5>${V(r.crossLayerGroups,t("No cross-layer group established.","\u6CA1\u6709\u5EFA\u7ACB\u8DE8\u5C42\u7EC4\u5408\u3002"))}</article></div></section>`}function ne(n,{embedded:r=!1}={}){if(!O(n))return"";C();let a=n?.professionalModules?.professionalTimeline;return a?.schemaVersion!=="PHI-OS-BAZI-CX-PRO-DA-YUN-LIU-NIAN-PROFESSIONAL-TIMELINE-v1.0.0"?"":`<section class="cx-bazi-timing-surface cx-bazi-professional-timeline${r?" cx-bazi-surface--embedded":""}" data-ppr-bazi-temporal-experience="true" data-bazi-cx-pro-professional-timeline="true" data-w15-section="TIMING"><header class="cx-bazi-professional-head"><div><p class="cx-eyebrow">${e(t("NATAL \xD7 DA YUN \xD7 LIU NIAN \xB7 PRIORITY \xD7 LIFE THEMES","\u539F\u5C40 \xD7 \u5927\u8FD0 \xD7 \u6D41\u5E74 \xB7 Priority \xD7 \u4E03\u5927\u751F\u6D3B\u4E3B\u9898"))}</p><h3>${e(t("A timeline should explain what is being activated\u2014not merely list cyclical pillars.","\u65F6\u95F4\u8F74\u4E0D\u53EA\u5217\u51FA\u5927\u8FD0\u67F1\uFF0C\u800C\u8981\u89E3\u91CA\u539F\u5C40\u54EA\u4E9B\u91CD\u70B9\u5728\u4EC0\u4E48\u9636\u6BB5\u88AB\u5E26\u5230\u524D\u666F\u3002"))}</h3><p>${e(t("Natal priorities stay as the baseline. Each Da Yun shows its Ten-God functions, natal interactions and life-theme relevance; a selected Liu Nian then adds a narrower annual layer.","\u539F\u5C40\u4F18\u5148\u4E3B\u9898\u59CB\u7EC8\u662F\u57FA\u7EBF\u3002\u6BCF\u4E00\u6B65\u5927\u8FD0\u90FD\u4F1A\u663E\u793A\u5341\u795E\u529F\u80FD\u3001\u4E0E\u539F\u5C40\u7684\u4E92\u52A8\u53CA\u751F\u6D3B\u4E3B\u9898\u76F8\u5173\u6027\uFF1B\u9009\u62E9\u660E\u786E\u6D41\u5E74\u540E\uFF0C\u518D\u53E0\u52A0\u66F4\u7A84\u7684\u5E74\u5EA6\u5C42\u3002"))}</p></div><span class="cx-personal-status-chip" data-state="${a.state==="EXPLICIT"?"ready":"open"}">${e(a.state==="EXPLICIT"?t("Target context established","\u76EE\u6807\u65F6\u95F4\u5DF2\u5EFA\u7ACB"):t("Full Da Yun readable \xB7 Liu Nian not selected","\u5927\u8FD0\u53EF\u8BFB \xB7 \u6D41\u5E74\u672A\u9009\u62E9"))}</span></header>${Wn(n)}${a.state!=="EXPLICIT"?`<aside class="cx-bazi-professional-boundary"><strong>${e(t("The timeline stays useful without inventing \u201Ctoday\u201D.","\u4E0D\u63A8\u65AD\u201C\u4ECA\u5929\u201D\uFF0C\u65F6\u95F4\u8F74\u4ECD\u7136\u53EF\u4EE5\u9605\u8BFB\u3002"))}</strong><p>${e(t("The complete Da Yun sequence is composed against natal priorities and the seven professional topics. Current Da Yun and Liu Nian remain unselected until a complete target date, time and timezone are supplied.","\u5B8C\u6574\u5927\u8FD0\u5E8F\u5217\u4ECD\u4F1A\u7ED3\u5408\u539F\u5C40\u4F18\u5148\u4E3B\u9898\u4E0E\u4E03\u5927\u4E13\u4E1A\u4E3B\u9898\u8FDB\u884C\u7EC4\u5408\uFF1B\u53EA\u6709\u63D0\u4F9B\u5B8C\u6574\u76EE\u6807\u65E5\u671F\u3001\u65F6\u95F4\u4E0E\u65F6\u533A\u540E\uFF0C\u7CFB\u7EDF\u624D\u4F1A\u9009\u51FA\u5F53\u524D\u5927\u8FD0\u4E0E\u6D41\u5E74\u3002"))}</p></aside>`:ot(a,n)}<section class="cx-bazi-professional-dayun"><header><h4>${e(t("Da Yun professional timeline","\u5927\u8FD0\u4E13\u4E1A\u65F6\u95F4\u8F74"))}</h4><p>${e(t("Each cycle shows what functional groups enter, which natal priorities it reconnects to, and which life themes become structurally relevant.","\u6BCF\u4E00\u6B65\u5927\u8FD0\u90FD\u663E\u793A\u8FDB\u5165\u7684\u529F\u80FD\u7EC4\u3001\u91CD\u65B0\u8FDE\u63A5\u5230\u54EA\u4E9B\u539F\u5C40\u91CD\u70B9\uFF0C\u4EE5\u53CA\u54EA\u4E9B\u751F\u6D3B\u4E3B\u9898\u5728\u7ED3\u6784\u4E0A\u66F4\u76F8\u5173\u3002"))}</p></header><div class="cx-bazi-professional-dayun-track">${c(a.daYunTimeline).map(s=>rt(s,n)).join("")}</div></section>${a.state==="EXPLICIT"?`${it(a)}${ct(a)}`:""}<aside class="cx-bazi-timeline-boundary"><strong>${e(t("Timing boundary","\u65F6\u95F4\u89E3\u91CA\u8FB9\u754C"))}</strong><p>${e(t("Da Yun and Liu Nian alter emphasis, not natal identity. A theme becoming active means it deserves attention in that window; it does not prove a future event, guarantee success or failure, or replace the natal chart.","\u5927\u8FD0\u4E0E\u6D41\u5E74\u6539\u53D8\u7684\u662F\u5F3A\u8C03\u65B9\u5F0F\uFF0C\u4E0D\u4F1A\u6539\u5199\u539F\u5C40\u8EAB\u4EFD\u3002\u67D0\u4E2A\u4E3B\u9898\u8FDB\u5165\u6FC0\u6D3B\uFF0C\u53EA\u8868\u793A\u5B83\u5728\u8FD9\u4E2A\u65F6\u95F4\u7A97\u53E3\u66F4\u503C\u5F97\u89C2\u5BDF\uFF1B\u4E0D\u8BC1\u660E\u672A\u6765\u4E8B\u4EF6\uFF0C\u4E0D\u4FDD\u8BC1\u6210\u529F\u6216\u5931\u8D25\uFF0C\u4E5F\u4E0D\u4F1A\u53D6\u4EE3\u539F\u5C40\u3002"))}</p></aside></section>`}function w(n,{embedded:r=!1,customerMain:a=!1}={}){if(!O(n))return"";C();let s=n?.professionalModules?.customerSafeGraph;if(s?.schemaVersion!=="PHI-OS-PPR-C1-BAZI-CUSTOMER-SAFE-STRUCTURE-GRAPH-v1.0.0")return"";let i=new Map(c(s.nodes).map(T=>[T.nodeKey,T])),l=i.get("CHART"),o=i.get("FOUNDATION"),u=i.get("RELATIONSHIPS"),d=i.get("PATTERN"),S=["SCHOOL_ZIPING","SCHOOL_TIYONG","SCHOOL_TIAOHOU"].map(T=>i.get(T)).filter(Boolean),m=i.get("DA_YUN"),I=i.get("LIU_NIAN"),$=i.get("OPEN_BOUNDARIES");return a?`<section class="cx-bazi-customer-safe-graph cx-bazi-customer-safe-graph--main${r?" cx-bazi-customer-safe-graph--embedded":""}" data-ppr-bazi-customer-safe-graph="true" data-bazi-technical-relocation="true"><header class="cx-bazi-professional-head"><div><p class="cx-eyebrow">${e(t("WHOLE-CHART STRUCTURE MAP","\u6574\u76D8\u7ED3\u6784\u5173\u7CFB\u56FE"))}</p><h3>${e(t("See how foundation, relationships, pattern and timing connect.","\u628A\u547D\u5C40\u57FA\u7840\u3001\u5E72\u652F\u5173\u7CFB\u3001\u683C\u5C40\u4E0E\u65F6\u95F4\u5C42\u653E\u5728\u4E00\u5F20\u56FE\u91CC\u770B\u3002"))}</h3><p>${e(t("School-specific and unresolved technical layers are intentionally kept out of the customer main reading.","\u66F4\u7EC6\u7684\u6280\u672F\u5224\u636E\u4E0D\u4F1A\u5360\u636E\u5BA2\u6237\u4E3B\u9605\u8BFB\uFF0C\u7EDF\u4E00\u653E\u5728\u300C\u6765\u6E90\u6280\u672F\u300D\u3002"))}</p></div></header><div class="cx-bazi-graph-canvas">${l?`<div class="cx-bazi-graph-root">${v(l)}</div>`:""}<div class="cx-bazi-graph-spine">${[o,u,d].filter(Boolean).map(v).join("")}</div><div class="cx-bazi-graph-branches"><section><header><span>${e(t("Timing layers","\u65F6\u95F4\u5C42"))}</span></header><div>${[m,I].filter(Boolean).map(v).join("")}</div></section></div></div><footer class="cx-bazi-graph-legend"><span><i data-kind="confirmed"></i>${e(t("Customer reading layer","\u5BA2\u6237\u4E3B\u9605\u8BFB\u5C42"))}</span></footer></section>`:`<section class="cx-bazi-customer-safe-graph${r?" cx-bazi-customer-safe-graph--embedded":""}" data-ppr-bazi-customer-safe-graph="true"><header class="cx-bazi-professional-head"><div><p class="cx-eyebrow">${e(t("WHOLE-CHART STRUCTURE MAP","\u6574\u76D8\u7ED3\u6784\u5173\u7CFB\u56FE"))}</p><h3>${e(t("See how foundation, relationships, pattern, schools and timing belong to one chart.","\u628A\u547D\u5C40\u57FA\u7840\u3001\u5E72\u652F\u5173\u7CFB\u3001\u683C\u5C40\u3001\u5B66\u6D3E\u4E0E\u65F6\u95F4\u5C42\u653E\u5728\u4E00\u5F20\u56FE\u91CC\u770B\u3002"))}</h3><p>${e(t("The lines show reading context: one part changes how another part is understood, but the diagram is not a causal or probability chart.","\u8FDE\u7EBF\u8868\u793A\u9605\u8BFB\u65F6\u8981\u5F7C\u6B64\u53C2\u7167\uFF1A\u4E00\u4E2A\u5C42\u6B21\u4F1A\u6539\u53D8\u53E6\u4E00\u4E2A\u5C42\u6B21\u7684\u7406\u89E3\u65B9\u5F0F\uFF0C\u4F46\u5B83\u4E0D\u662F\u56E0\u679C\u56FE\u6216\u6982\u7387\u56FE\u3002"))}</p></div></header><div class="cx-bazi-graph-canvas">${l?`<div class="cx-bazi-graph-root">${v(l)}</div>`:""}<div class="cx-bazi-graph-spine">${[o,u,d].filter(Boolean).map(v).join("")}</div><div class="cx-bazi-graph-branches"><section><header><span>${e(t("School views","\u5206\u5B66\u6D3E\u89C6\u89D2"))}</span></header><div>${S.map(v).join("")}</div></section><section><header><span>${e(t("Timing layers","\u65F6\u95F4\u5C42"))}</span></header><div>${[m,I].filter(Boolean).map(v).join("")}</div></section></div>${$?`<div class="cx-bazi-graph-open">${v($)}</div>`:""}</div><footer class="cx-bazi-graph-legend"><span><i data-kind="confirmed"></i>${e(t("Confirmed","\u5DF2\u786E\u8BA4"))}</span><span><i data-kind="school"></i>${e(t("Different school readings","\u5B58\u5728\u4E0D\u540C\u5B66\u6D3E\u89E3\u91CA"))}</span><span><i data-kind="open"></i>${e(t("No strong conclusion yet","\u6682\u4E0D\u4F5C\u5F3A\u5224\u65AD"))}</span></footer></section>`}function lt(n){typeof document>"u"||typeof queueMicrotask!="function"||queueMicrotask(()=>{let r=document.querySelector("[data-cx-personal-graphs]");if(!r)return;let a=w(n);if(!a)return;let s=r.querySelector("[data-ppr-bazi-customer-safe-graph]");if(s){s.outerHTML=a;return}r.children.length===1&&r.firstElementChild?.classList.contains("cx-p1-empty")?r.innerHTML=a:r.insertAdjacentHTML("afterbegin",a)})}function de(n,{embedded:r=!1}={}){if(!O(n))return"";C();let a=n?.professionalModules?.realityBridge;return a?.schemaVersion!=="PHI-OS-BAZI-CX-PRO-REALITY-BRIDGE-v1.0.0"?"":`<section class="cx-bazi-reality-bridge-summary${r?" cx-bazi-surface--embedded":""}" data-bazi-cx-pro-reality-bridge-summary="true"><header class="cx-bazi-professional-head"><div><p class="cx-eyebrow">${e(t("REALITY BRIDGE","\u73B0\u5B9E\u6865\u63A5"))}</p><h3>${e(t("Reality questions now appear where they are useful: at the end of each professional chapter.","\u73B0\u5B9E\u95EE\u9898\u73B0\u5728\u53EA\u5728\u771F\u6B63\u6709\u7528\u7684\u4F4D\u7F6E\u51FA\u73B0\uFF1A\u6BCF\u4E2A\u4E13\u4E1A\u7AE0\u8282\u7684\u7ED3\u5C3E\u3002"))}</h3><p>${e(t("Instead of a second bank of generic questions, each chapter ends with one or two prompts about repetition, context or counterexamples.","\u4E0D\u518D\u53E6\u5916\u5806\u4E00\u6574\u7EC4\u901A\u7528\u95EE\u9898\uFF1B\u6BCF\u7AE0\u53EA\u4FDD\u7559 1\u20132 \u4E2A\u5173\u4E8E\u91CD\u590D\u3001\u60C5\u5883\u6216\u53CD\u4F8B\u7684\u9AD8\u8D28\u91CF\u95EE\u9898\u3002"))}</p></div><span class="cx-bazi-season-chip">${e(t(`${a.summary?.totalPromptCount||0} prompts across the reading`,`${a.summary?.totalPromptCount||0} \u4E2A\u7AE0\u8282\u73B0\u5B9E\u95EE\u9898`))}</span></header><div class="cx-bazi-reality-bridge-principles"><article><strong>${e(t("Read first","\u5148\u8BFB\u89E3\u91CA"))}</strong><p>${e(t("The prompt comes after the interpretation, not before it.","\u5148\u5B8C\u6210\u4E13\u4E1A\u89E3\u91CA\uFF0C\u518D\u56DE\u5230\u73B0\u5B9E\u89C2\u5BDF\u3002"))}</p></article><article><strong>${e(t("Counterexamples matter","\u53CD\u4F8B\u540C\u6837\u91CD\u8981"))}</strong><p>${e(t("A mismatch is useful information; agreement is never required.","\u4E0D\u7B26\u5408\u4E5F\u662F\u6709\u6548\u4FE1\u606F\uFF0C\u4E0D\u8981\u6C42\u73B0\u5B9E\u4E00\u5B9A\u543B\u5408\u3002"))}</p></article><article><strong>${e(t("No recalculation","\u4E0D\u4F1A\u6539\u76D8"))}</strong><p>${e(t("Your answer helps compare the reading with lived experience; it does not rewrite the Four Pillars.","\u4F60\u7684\u56DE\u7B54\u7528\u4E8E\u73B0\u5B9E\u5BF9\u7167\uFF0C\u4E0D\u4F1A\u6539\u5199\u56DB\u67F1\u8BA1\u7B97\u3002"))}</p></article></div></section>`}var dt={FOUNDATION:{title:["Foundation in lived experience","\u547D\u5C40\u57FA\u7840\u5728\u73B0\u5B9E\u4E2D\u5982\u4F55\u7A33\u5B9A\u51FA\u73B0\uFF1F"],question:["Does this whole-chart foundation stay recognizable across different periods, or only under certain conditions?","\u8FD9\u7EC4\u6574\u76D8\u57FA\u7840\u662F\u5426\u5728\u4E0D\u540C\u9636\u6BB5\u90FD\u80FD\u8FA8\u8BA4\u51FA\u6765\uFF0C\u8FD8\u662F\u53EA\u5728\u7279\u5B9A\u6761\u4EF6\u4E0B\u660E\u663E\uFF1F"]},RELATIONSHIPS:{title:["Relationship structure in lived experience","\u54EA\u4E9B\u5173\u7CFB\u7ED3\u6784\u4F1A\u5728\u73B0\u5B9E\u4E2D\u53CD\u590D\u51FA\u73B0\uFF1F"],question:["Across different roles and environments, which established relationship patterns repeat, and where do they not?","\u8DE8\u4E0D\u540C\u89D2\u8272\u4E0E\u73AF\u5883\uFF0C\u54EA\u4E9B\u5DF2\u7ECF\u5EFA\u7ACB\u7684\u5173\u7CFB\u7ED3\u6784\u4F1A\u91CD\u590D\u51FA\u73B0\uFF0C\u53C8\u6709\u54EA\u4E9B\u573A\u666F\u5E76\u4E0D\u7B26\u5408\uFF1F"]},PATTERN:{title:["Pattern candidates in lived experience","\u54EA\u4E9B\u683C\u5C40\u5019\u9009\u5F97\u5230\u8F83\u7A33\u5B9A\u7684\u73B0\u5B9E\u652F\u6301\uFF1F"],question:["Among the open pattern candidates, which path is repeatedly supported by lived experience, which appears only conditionally, and what argues against promoting one too early?","\u5728\u4ECD\u5F00\u653E\u7684\u683C\u5C40\u5019\u9009\u4E2D\uFF0C\u54EA\u6761\u8DEF\u5F84\u5F97\u5230\u8F83\u7A33\u5B9A\u7684\u73B0\u5B9E\u652F\u6301\uFF0C\u54EA\u6761\u53EA\u5728\u7279\u5B9A\u6761\u4EF6\u4E0B\u51FA\u73B0\uFF0C\u53C8\u6709\u54EA\u4E9B\u53CD\u4F8B\u63D0\u9192\u6211\u4EEC\u4E0D\u8981\u8FC7\u65E9\u5B9A\u4E3B\u683C\uFF1F"]},SCHOOL_ZIPING:{title:["Zi Ping reality check","\u5B50\u5E73\u6708\u4EE4\u89C6\u89D2\u5982\u4F55\u4E0E\u73B0\u5B9E\u5BF9\u7167\uFF1F"],question:["When you compare month-command and pattern logic with lived experience, what repeats reliably and what remains conditional?","\u628A\u6708\u4EE4\u4E0E\u683C\u5C40\u903B\u8F91\u653E\u56DE\u73B0\u5B9E\u540E\uFF0C\u54EA\u4E9B\u8868\u73B0\u7A33\u5B9A\u91CD\u590D\uFF0C\u54EA\u4E9B\u53EA\u5728\u7279\u5B9A\u6761\u4EF6\u4E0B\u6210\u7ACB\uFF1F"]},SCHOOL_TIYONG:{title:["Ti-Yong reality check","\u4F53\u7528\u4E0E\u5E73\u8861\u5982\u4F55\u4E0E\u73B0\u5B9E\u5BF9\u7167\uFF1F"],question:["Where does the chart\u2019s weighting and balance feel structurally consistent, and where does lived experience show a different balance?","\u6574\u76D8\u504F\u91CD\u4E0E\u5E73\u8861\u5728\u54EA\u4E9B\u73B0\u5B9E\u60C5\u5883\u4E2D\u8F83\u7A33\u5B9A\uFF0C\u53C8\u6709\u54EA\u4E9B\u7ECF\u9A8C\u663E\u793A\u51FA\u4E0D\u540C\u7684\u5E73\u8861\uFF1F"]},SCHOOL_TIAOHOU:{title:["Climate-adjustment reality check","\u5BD2\u6696\u71E5\u6E7F\u5982\u4F55\u4E0E\u73B0\u5B9E\u5BF9\u7167\uFF1F"],question:["Under what environments or phases does the cold/warm/dry/wet dimension become noticeable, and when does it not?","\u5BD2\u6696\u71E5\u6E7F\u8FD9\u4E00\u7EF4\u5EA6\u901A\u5E38\u5728\u4EC0\u4E48\u73AF\u5883\u6216\u9636\u6BB5\u53D8\u5F97\u660E\u663E\uFF0C\u53C8\u5728\u4EC0\u4E48\u60C5\u51B5\u4E0B\u5E76\u4E0D\u660E\u663E\uFF1F"]},TIMING:{title:["Timing correspondence","\u5F53\u524D\u65F6\u95F4\u6FC0\u6D3B\u6709\u6CA1\u6709\u73B0\u5B9E\u5BF9\u5E94\uFF1F"],question:["Around the selected Da Yun / Liu Nian context, is there a recognizable change in the themes already present in the natal chart?","\u5728\u6240\u9009\u5927\u8FD0\uFF0F\u6D41\u5E74\u7684\u65F6\u95F4\u7A97\u53E3\u9644\u8FD1\uFF0C\u539F\u5C40\u5DF2\u6709\u4E3B\u9898\u662F\u5426\u51FA\u73B0\u4E86\u53EF\u4EE5\u8FA8\u8BA4\u7684\u53D8\u5316\uFF1F"]}};function ut(n){return dt[n]||{title:["Reality comparison","\u73B0\u5B9E\u5BF9\u7167"],question:["What repeats, what depends on context, and what contradicts the reading?","\u54EA\u4E9B\u4F1A\u91CD\u590D\u51FA\u73B0\uFF0C\u54EA\u4E9B\u4F9D\u8D56\u60C5\u5883\uFF0C\u53C8\u6709\u54EA\u4E9B\u73B0\u5B9E\u53CD\u4F8B\uFF1F"]}}var Se={FOUNDATION:[["Repeated pattern \u2014 does the whole-chart foundation remain recognizable across different periods?","\u91CD\u590D\u51FA\u73B0\u2014\u2014\u8FD9\u7EC4\u6574\u76D8\u57FA\u7840\u662F\u5426\u5728\u4E0D\u540C\u9636\u6BB5\u4ECD\u80FD\u8FA8\u8BA4\uFF1F"],["Context specificity \u2014 which environments make this foundation clearer or less visible?","\u60C5\u5883\u9650\u5B9A\u2014\u2014\u54EA\u4E9B\u73AF\u5883\u4F1A\u8BA9\u8FD9\u7EC4\u57FA\u7840\u66F4\u6E05\u695A\uFF0C\u54EA\u4E9B\u73AF\u5883\u4F1A\u8BA9\u5B83\u4E0D\u660E\u663E\uFF1F"],["What does not fit \u2014 what recurring experience does not fit this foundation?","\u4E0D\u7B26\u5408\u4E4B\u5904\u2014\u2014\u6709\u54EA\u4E9B\u53CD\u590D\u51FA\u73B0\u7684\u73B0\u5B9E\u7ECF\u9A8C\u5E76\u4E0D\u7B26\u5408\u8FD9\u7EC4\u57FA\u7840\uFF1F"]],RELATIONSHIPS:[["Repeated pattern \u2014 which established relationship structures recur across different roles?","\u91CD\u590D\u51FA\u73B0\u2014\u2014\u54EA\u4E9B\u5DF2\u7ECF\u5EFA\u7ACB\u7684\u5173\u7CFB\u7ED3\u6784\u4F1A\u8DE8\u4E0D\u540C\u89D2\u8272\u53CD\u590D\u51FA\u73B0\uFF1F"],["Context specificity \u2014 which relationship pattern appears only with certain people or pressures?","\u60C5\u5883\u9650\u5B9A\u2014\u2014\u54EA\u4E9B\u5173\u7CFB\u6A21\u5F0F\u53EA\u4F1A\u5728\u7279\u5B9A\u5BF9\u8C61\u6216\u538B\u529B\u4E0B\u51FA\u73B0\uFF1F"],["What does not fit \u2014 where do your actual relationships show the opposite structure?","\u4E0D\u7B26\u5408\u4E4B\u5904\u2014\u2014\u54EA\u4E9B\u771F\u5B9E\u5173\u7CFB\u5448\u73B0\u4E86\u4E0E\u8BFB\u53D6\u76F8\u53CD\u7684\u7ED3\u6784\uFF1F"]],PATTERN:[["Repeated pattern \u2014 which open pattern candidate receives support across more than one setting?","\u91CD\u590D\u51FA\u73B0\u2014\u2014\u54EA\u6761\u5F00\u653E\u4E2D\u7684\u683C\u5C40\u5019\u9009\u5728\u4E0D\u6B62\u4E00\u79CD\u60C5\u5883\u91CC\u5F97\u5230\u652F\u6301\uFF1F"],["Context specificity \u2014 which candidate appears only under a narrow condition?","\u60C5\u5883\u9650\u5B9A\u2014\u2014\u54EA\u6761\u5019\u9009\u53EA\u5728\u8F83\u7A84\u7684\u6761\u4EF6\u4E0B\u51FA\u73B0\uFF1F"],["What does not fit \u2014 what experience argues against promoting a candidate too early?","\u4E0D\u7B26\u5408\u4E4B\u5904\u2014\u2014\u54EA\u4E9B\u7ECF\u9A8C\u63D0\u9192\u6211\u4EEC\u8FD8\u4E0D\u80FD\u8FC7\u65E9\u628A\u67D0\u6761\u5019\u9009\u63D0\u5347\u4E3A\u4E3B\u683C\uFF1F"]],SCHOOL_ZIPING:[["Repeated pattern \u2014 does month-command logic recur across different phases?","\u91CD\u590D\u51FA\u73B0\u2014\u2014\u6708\u4EE4\u4E0E\u683C\u5C40\u903B\u8F91\u662F\u5426\u5728\u4E0D\u540C\u9636\u6BB5\u6301\u7EED\u51FA\u73B0\uFF1F"],["Context specificity \u2014 under which conditions does the Zi Ping reading become most visible?","\u60C5\u5883\u9650\u5B9A\u2014\u2014\u5B50\u5E73\u6708\u4EE4\u89C6\u89D2\u5728\u4EC0\u4E48\u6761\u4EF6\u4E0B\u6700\u660E\u663E\uFF1F"],["What does not fit \u2014 where does lived experience not follow the month-command expectation?","\u4E0D\u7B26\u5408\u4E4B\u5904\u2014\u2014\u54EA\u4E9B\u73B0\u5B9E\u7ECF\u9A8C\u5E76\u6CA1\u6709\u6CBF\u7740\u6708\u4EE4\u9884\u671F\u5C55\u5F00\uFF1F"]],SCHOOL_TIYONG:[["Repeated pattern \u2014 does the same weighting or balance pattern recur across major situations?","\u91CD\u590D\u51FA\u73B0\u2014\u2014\u76F8\u4F3C\u7684\u6574\u76D8\u504F\u91CD\u6216\u5E73\u8861\u6A21\u5F0F\u662F\u5426\u4F1A\u5728\u91CD\u8981\u60C5\u5883\u4E2D\u91CD\u590D\uFF1F"],["Context specificity \u2014 when does the chart feel more balanced or more one-sided?","\u60C5\u5883\u9650\u5B9A\u2014\u2014\u4EC0\u4E48\u60C5\u51B5\u4E0B\u6574\u76D8\u66F4\u5E73\u8861\uFF0C\u4EC0\u4E48\u60C5\u51B5\u4E0B\u504F\u91CD\u66F4\u660E\u663E\uFF1F"],["What does not fit \u2014 which experience suggests a different weighting from this school view?","\u4E0D\u7B26\u5408\u4E4B\u5904\u2014\u2014\u54EA\u4E9B\u7ECF\u9A8C\u663E\u793A\u51FA\u4E0E\u4F53\u7528\u89C6\u89D2\u4E0D\u540C\u7684\u6574\u76D8\u504F\u91CD\uFF1F"]],SCHOOL_TIAOHOU:[["Repeated pattern \u2014 does the climate-adjustment theme recur across seasons or environments?","\u91CD\u590D\u51FA\u73B0\u2014\u2014\u5BD2\u6696\u71E5\u6E7F\u4E3B\u9898\u662F\u5426\u4F1A\u8DE8\u5B63\u8282\u6216\u73AF\u5883\u91CD\u590D\u51FA\u73B0\uFF1F"],["Context specificity \u2014 which surroundings make the climate dimension more noticeable?","\u60C5\u5883\u9650\u5B9A\u2014\u2014\u54EA\u4E9B\u73AF\u5883\u4F1A\u8BA9\u5BD2\u6696\u71E5\u6E7F\u7EF4\u5EA6\u66F4\u660E\u663E\uFF1F"],["What does not fit \u2014 when does the expected climate tendency not show up at all?","\u4E0D\u7B26\u5408\u4E4B\u5904\u2014\u2014\u4EC0\u4E48\u60C5\u51B5\u4E0B\u9884\u671F\u7684\u8C03\u5019\u503E\u5411\u5E76\u6CA1\u6709\u51FA\u73B0\uFF1F"]],TIMING:[["Repeated pattern \u2014 during this target window, which natal theme is showing up again?","\u91CD\u590D\u51FA\u73B0\u2014\u2014\u5728\u8FD9\u4E2A\u76EE\u6807\u65F6\u95F4\u7A97\u53E3\u91CC\uFF0C\u54EA\u9879\u539F\u5C40\u4E3B\u9898\u518D\u6B21\u51FA\u73B0\uFF1F"],["Context specificity \u2014 is the activation limited to one role, environment or pressure?","\u60C5\u5883\u9650\u5B9A\u2014\u2014\u8FD9\u6B21\u6FC0\u6D3B\u662F\u5426\u53EA\u96C6\u4E2D\u5728\u67D0\u4E2A\u89D2\u8272\u3001\u73AF\u5883\u6216\u538B\u529B\uFF1F"],["What does not fit \u2014 what expected activation is absent or moving in the opposite direction?","\u4E0D\u7B26\u5408\u4E4B\u5904\u2014\u2014\u54EA\u4E9B\u9884\u671F\u6FC0\u6D3B\u6CA1\u6709\u51FA\u73B0\uFF0C\u6216\u8005\u53CD\u800C\u671D\u76F8\u53CD\u65B9\u5411\u53D1\u5C55\uFF1F"]]};function Et(n){let r=String(n?.questionKey||""),a=(Se[r]||Se.FOUNDATION).map(([s,i])=>t(s,i));return n?.temporalCorrespondenceEnabled&&a.push(t("Temporal correspondence \u2014 around the selected timing window, did an already-present natal theme become more visible, less visible, or simply different?","\u65F6\u95F4\u5BF9\u5E94\u2014\u2014\u5728\u6240\u9009\u65F6\u95F4\u7A97\u53E3\u9644\u8FD1\uFF0C\u539F\u5C40\u5DF2\u6709\u4E3B\u9898\u662F\u53D8\u5F97\u66F4\u660E\u663E\u3001\u66F4\u4E0D\u660E\u663E\uFF0C\u8FD8\u662F\u53EA\u662F\u4EE5\u4E0D\u540C\u65B9\u5F0F\u51FA\u73B0\uFF1F")),a}function pt(n,{embedded:r=!1}={}){if(!O(n))return"";C();let a=n?.professionalModules?.realityComparison;return a?.schemaVersion!=="PHI-OS-PPR-C1-BAZI-REALITY-COMPARISON-v1.0.0"?"":`<section class="cx-bazi-reality-comparison${r?" cx-bazi-surface--embedded":""}" data-ppr-bazi-reality-comparison="true"><header class="cx-bazi-professional-head"><div><p class="cx-eyebrow">${e(t("REALITY COMPARISON","\u73B0\u5B9E\u5BF9\u7167"))}</p><h3>${e(t("One chart theme, one useful reality question.","\u4E00\u4E2A\u547D\u76D8\u4E3B\u9898\uFF0C\u53EA\u4FDD\u7559\u4E00\u4E2A\u771F\u6B63\u6709\u7528\u7684\u73B0\u5B9E\u95EE\u9898\u3002"))}</h3><p>${e(t("Use these questions after reading the BaZi interpretation. They help you notice what repeats, what depends on context and what does not fit.","\u5148\u8BFB\u5B8C\u516B\u5B57\u89E3\u91CA\uFF0C\u518D\u7528\u8FD9\u4E9B\u95EE\u9898\u56DE\u5230\u73B0\u5B9E\uFF1A\u770B\u54EA\u4E9B\u4F1A\u91CD\u590D\u3001\u54EA\u4E9B\u4F9D\u8D56\u60C5\u5883\uFF0C\u4EE5\u53CA\u54EA\u4E9B\u5730\u65B9\u5E76\u4E0D\u7B26\u5408\u3002"))}</p></div><span class="cx-personal-status-chip" data-state="ready">${e(t(`${a.questionCount} reality questions`,`${a.questionCount} \u4E2A\u73B0\u5B9E\u95EE\u9898`))}</span></header><div class="cx-bazi-reality-grid">${c(a.questions).map((s,i)=>{let l=ut(s.questionKey);return`<article class="cx-bazi-reality-card" data-question-key="${e(s.questionKey)}"><header><small>${String(i+1).padStart(2,"0")} \xB7 ${e(W(s.resolutionState))}</small><h4>${e(t(l.title[0],l.title[1]))}</h4></header><blockquote>${e(t(l.question[0],l.question[1]))}</blockquote><ul>${Et(s).map(o=>`<li>${e(A(o))}</li>`).join("")}</ul></article>`}).join("")}</div><aside class="cx-bazi-professional-boundary"><strong>${e(t("How to use this section","\u8FD9\u4E00\u7AE0\u600E\u4E48\u7528"))}</strong><p>${e(t("Agreement or disagreement helps you examine the reading; it does not change the Four-Pillar calculation by itself.","\u73B0\u5B9E\u7ECF\u9A8C\u65E0\u8BBA\u7B26\u5408\u6216\u4E0D\u7B26\u5408\uFF0C\u90FD\u7528\u6765\u5E2E\u52A9\u4F60\u7406\u89E3\u8FD9\u4EFD\u89E3\u8BFB\uFF1B\u5B83\u672C\u8EAB\u4E0D\u4F1A\u6539\u5199\u56DB\u67F1\u8BA1\u7B97\u3002"))}</p></aside></section>`}function ht(n){let r=`<header><span>${e(W(n?.state))}</span><h3>${e(A(n?.title||n?.code||""))}</h3>${n?.dek?`<p>${e(A(n.dek))}</p>`:""}</header>`;return n?.code==="SCHOOLS"?`<section class="cx-native-section" data-section="SCHOOLS">${r}<div class="cx-native-school-grid">${c(n.blocks).map(a=>`<article><strong>${e(A(a.title||""))}</strong><span>${e(t("School-qualified view","\u5206\u5B66\u6D3E\u8BFB\u53D6"))}</span><p>${e(A(a.text||""))}</p></article>`).join("")}</div></section>`:n?.code==="OPEN"?`<section class="cx-native-section cx-bazi-open" data-section="OPEN">${r}<ul>${c(n.items).map(a=>`<li>${e(A(a))}</li>`).join("")}</ul></section>`:`<section class="cx-native-section" data-section="${e(n?.code||"")}">${r}${c(n?.paragraphs).map(a=>`<p>${e(A(a))}</p>`).join("")}</section>`}function mt(n){if(!O(n))return"";C();let r=n.summary||{},a=ge(n),s=a.day?.stem||{},i=a.month?.branch||{},l=c(n.readingSections),o=n.evidence||{};return lt(n),`<article class="cx-smr-report cx-native-reading cx-bazi-professional-reading" data-method-native="BZR" data-ppr-whole-chart-first="true"><header class="cx-smr-executive cx-bazi-executive"><p class="cx-eyebrow">${e(t("WHOLE CHART FIRST","\u5148\u770B\u6574\u76D8"))}</p><h2>${e(A(r.title||t("Your BaZi reading","\u4F60\u7684\u516B\u5B57\u8BFB\u53D6")))}</h2>${r.subtitle?`<p class="cx-bazi-subtitle">${e(A(r.subtitle))}</p>`:""}<div class="cx-bazi-key-structures">${c(r.keyPoints).slice(0,5).map((u,d)=>`<article><small>${String(d+1).padStart(2,"0")}</small><p>${e(A(u))}</p></article>`).join("")}</div></header><section class="cx-bazi-whole-chart-snapshot"><header><p class="cx-eyebrow">${e(t("CHART SNAPSHOT","\u547D\u5C40\u5148\u8BFB"))}</p><h3>${e(t("Start with the anchors, then read the relationships around them.","\u5148\u770B\u547D\u76D8\u951A\u70B9\uFF0C\u518D\u770B\u5B83\u4EEC\u5468\u56F4\u7684\u7ED3\u6784\u5173\u7CFB\u3002"))}</h3></header><div><article><small>${e(t("Day Master","\u65E5\u4E3B"))}</small><strong>${e(s.zh||"\u2014")} \xB7 ${e(y(s.element))}</strong></article><article><small>${e(t("Month command","\u6708\u4EE4"))}</small><strong>${e(i.zh||"\u2014")} \xB7 ${e(y(i.element))}</strong></article><article><small>${e(t("Established natal relation","\u5DF2\u5EFA\u7ACB\u539F\u5C40\u5173\u7CFB"))}</small><strong>${e(A(a.relationshipText))}</strong></article><article><small>${e(t("Open conclusions","\u4ECD\u672A\u5B9A\u8BBA"))}</small><strong>${e(a.openCount)}</strong></article></div></section>${q(n,{embedded:!0})}${Q(n,{embedded:!0})}${k(n,{embedded:!0})}${j(n,{embedded:!0})}${K(n,{embedded:!0})}${w(n,{embedded:!0})}${J(n,{embedded:!0})}<div class="cx-smr-body cx-bazi-reading-body"><header class="cx-bazi-depth-head"><p class="cx-eyebrow">${e(t("DEEPER READING","\u7EE7\u7EED\u6DF1\u5165"))}</p><h3>${e(t("Structure first. Interpretation follows the relationships inside the chart.","\u5148\u770B\u7ED3\u6784\uFF0C\u518D\u6CBF\u7740\u547D\u76D8\u5185\u90E8\u5173\u7CFB\u8FDB\u5165\u89E3\u91CA\u3002"))}</h3></header>${l.map(u=>u.code==="RELATIONSHIPS"?Z(n,{embedded:!0}):u.code==="PATTERNS"?X(n,{embedded:!0}):u.code==="SCHOOLS"?ee(n,{embedded:!0}):u.code==="TIMING"?ne(n,{embedded:!0}):ht(u)).join("")}<details class="cx-smr-technical"><summary>${e(t("View sources and structure details","\u67E5\u770B\u6765\u6E90\u4E0E\u7ED3\u6784\u8BE6\u60C5"))}</summary><dl><dt>${e(t("Product","\u4EA7\u54C1"))}</dt><dd><code>${e(n.productVersion||"")}</code></dd><dt>${e(t("Timing context","\u65F6\u95F4\u60C5\u5883"))}</dt><dd>${e(n.temporalContext?.state||"UNAVAILABLE")}</dd><dt>${e(t("Evidence records","\u8BC1\u636E\u8BB0\u5F55"))}</dt><dd>${e(o.evidenceCount??"\u2014")}</dd><dt>${e(t("Authority records","\u6743\u5A01\u8BB0\u5F55"))}</dt><dd>${e(o.authorityCount??"\u2014")}</dd><dt>${e(t("Report digest","\u62A5\u544A\u6307\u7EB9"))}</dt><dd><code>${e(r.reportDigest||"")}</code></dd></dl></details></div></article>`}var Wt=Object.freeze({isBaziNativeProduct:O,renderBaziProfessionalStructure:k,renderBaziDayMasterStrengthSurface:j,renderBaziFiveElementSurface:K,renderBaziRelationshipInteractionSurface:Z,renderBaziPatternSurface:X,renderBaziPatternCustomerMainSurface:oe,renderBaziWholeChartPrioritySurface:Q,renderBaziCustomerNarrativeSurface:q,renderBaziProfessionalTopicSurface:J,renderBaziSchoolSurface:ee,renderBaziTimingSurface:ne,renderBaziCustomerSafeStructureGraph:w,renderBaziRealityBridgeSummarySurface:de,renderBaziRealityComparisonSurface:pt,renderBaziWholeChartFirst:mt});var Pe="PVP_PHASE10_METHOD_VISUAL_SET",fe="/assets/customer-ui/surfaces/pvp-phase10-method-snapshots.css",z=n=>Array.isArray(n)?n:[],b=(n,r,a)=>n==="zh-Hans"?a:r,Le=n=>z(n?.visuals).find(r=>r?.type===Pe)?.payload||null;function ue(n=globalThis.document){if(!n?.head)return null;let r=n.querySelector?.('link[data-pvp-phase10-snapshot-css="true"]');return r||(r=n.createElement("link"),r.rel="stylesheet",r.href=fe,r.dataset.pvpPhase10SnapshotCss="true",n.head.appendChild(r),r)}function Ee(n){return z(n).length?`<div class="pvp-p10-highlights">${z(n).map((r,a)=>`<article><span>${String(a+1).padStart(2,"0")}</span><p>${e(r)}</p></article>`).join("")}</div>`:""}function Tt(n,r){return`<div class="pvp-p10-state" data-pvp-phase10-w28="true" data-active-state="${e(n.experienceStates?.activeState||"FREE")}"><article class="is-active"><small>${e(b(r,"FREE SNAPSHOT","\u514D\u8D39\u5FEB\u7167"))}</small><strong>${e(b(r,"Useful method-native overview","\u53EF\u7528\u7684\u65B9\u6CD5\u539F\u751F\u603B\u89C8"))}</strong></article><article class="is-locked"><small>${e(b(r,"DEEP VISUAL","\u6DF1\u5C42\u89C6\u89C9"))}</small><strong>${e(b(r,"Locked \xB7 server entitlement required","\u9501\u5B9A \xB7 \u9700\u8981\u670D\u52A1\u7AEF\u6743\u9650"))}</strong></article></div>`}function It(n,r){let a=n.snapshot||{},s=a.structuralCounts||{};return`<section class="pvp-p10-card pvp-p10-ast" data-pvp-phase10-w25="true"><header><p>${e(b(r,"ASTROLOGY \xB7 SNAPSHOT","\u5360\u661F \xB7 \u5FEB\u7167"))}</p><h2>${e(a.title||b(r,"Chart snapshot","\u661F\u76D8\u5FEB\u7167"))}</h2>${a.summary?`<span>${e(a.summary)}</span>`:""}</header><div class="pvp-p10-stats"><article><strong>${e(s.positions??0)}</strong><span>${e(b(r,"Planets","\u884C\u661F"))}</span></article><article><strong>${e(s.houses??0)}</strong><span>${e(b(r,"Houses","\u5BAB\u4F4D"))}</span></article><article><strong>${e(s.aspects??0)}</strong><span>${e(b(r,"Aspects","\u76F8\u4F4D"))}</span></article></div>${Ee(a.highlights)}</section>`}function Nt(n,r){let a=n.snapshot||{};return`<section class="pvp-p10-card pvp-p10-bzr" data-pvp-phase10-w26="true"><header><p>${e(b(r,"BAZI \xB7 SNAPSHOT","\u516B\u5B57 \xB7 \u5FEB\u7167"))}</p><h2>${e(a.title||b(r,"Four-pillar snapshot","\u56DB\u67F1\u5FEB\u7167"))}</h2>${a.summary?`<span>${e(a.summary)}</span>`:""}</header><div class="pvp-p10-pillars">${z(a.pillars).map(s=>`<article data-pillar="${e(s.position)}"><small>${e(s.position)}</small><strong>${e(s.stem||"\u2014")}</strong><strong>${e(s.branch||"\u2014")}</strong>${s.role?`<span>${e(s.role)}</span>`:""}</article>`).join("")}</div>${Ee(a.highlights)}</section>`}function Rt(n,r){let a=n.snapshot||{};return`<section class="pvp-p10-card pvp-p10-num" data-pvp-phase10-w27="true"><header><p>${e(b(r,"NUMEROLOGY \xB7 SNAPSHOT","\u6570\u5B57\u5B66 \xB7 \u5FEB\u7167"))}</p><h2>${e(a.title||b(r,"Number snapshot","\u6570\u5B57\u5FEB\u7167"))}</h2>${a.summary?`<span>${e(a.summary)}</span>`:""}</header><div class="pvp-p10-numbers">${z(a.coreNumbers).map(s=>`<article data-role="${e(s.role)}"><strong>${e(s.value??"\u2014")}</strong><span>${e(s.label||s.role)}</span></article>`).join("")}</div>${Ee(a.highlights)}</section>`}function pe(n){let r=Le(n);if(!r)return"";let a=r.locale||n?.locale||"en",s=r.methodId==="AST"?It(r,a):r.methodId==="BZR"?Nt(r,a):r.methodId==="NUM"?Rt(r,a):"";return s?`<div class="pvp-p10-snapshot" data-pvp-phase10-method="${e(r.methodId)}" data-pvp-phase10-work="${e(r.workCode)}" data-mfig-bindings="${e(z(r.mfigIds).join(" "))}">${s}${Tt(r,a)}<p class="pvp-p10-boundary">${e(b(a,"Deeper visual layers require server entitlement. The existing admitted specialist reading below remains governed by its original publication authority.","\u66F4\u6DF1\u89C6\u89C9\u5C42\u9700\u8981\u670D\u52A1\u7AEF\u6743\u9650\uFF1B\u4E0B\u65B9\u65E2\u6709\u5DF2\u51C6\u5165\u4E13\u4E1A\u8BFB\u53D6\u4ECD\u7531\u539F\u6709\u53D1\u5E03\u6743\u5A01\u7BA1\u7406\u3002"))}</p></div>`:""}function Ot(n){let r=Le(n);return!!(r?.schemaVersion==="PHI-OS-PVP-PHASE10-METHOD-VISUAL-PROJECTION-v1.0.0"&&["AST","BZR","NUM"].includes(r.methodId)&&r.experienceStates?.activeState==="FREE"&&r.experienceStates?.deep?.clientMaySelfUnlock===!1)}var jt=Object.freeze({renderPvpPhase10MethodSnapshot:pe,assertPvpPhase10ProjectionRenderable:Ot,ensurePvpPhase10SnapshotCss:ue,PVP_PHASE10_VISUAL_TYPE:Pe,PVP_PHASE10_CSS_HREF:fe});var $e=[{methodId:"BZR",sourceConversation:"6aaa576d-03bc-83ec-a176-5f8885313c6f",pages:[{pageNumber:1,title:{"zh-Hans":"\u516B\u5B57\u5B8C\u6574\u62A5\u544A",en:"BAZI FULL REPORT"},sourceText:`## 01\uFF5C\u516B\u5B57\u5B8C\u6574\u62A5\u544A
### BAZI FULL REPORT

**\u72B6\u6001\uFF1A** \`OPEN\`

**\u9875\u9762\u76EE\u6807\uFF1A** \u5EFA\u7ACB\u4EA7\u54C1\u8EAB\u4EFD\u3002

**\u4E3B\u89C6\u89C9\uFF1A**
\u5546\u54C1\u5C01\u9762\u7684\u89C6\u89C9\u8BED\u8A00\u5EF6\u7EED\uFF0C\u5305\u62EC\uFF1A

- \u56DB\u67F1
- \u4E94\u884C
- \u7ED3\u6784\u7EBF
- \u65F6\u95F4\u8F68\u8FF9
- \u516B\u5B57 icon

\u4E0D\u663E\u793A\u4EF7\u683C\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-bazi-blueprint.md",role:"BAZI_FULL_REPORT",master:"M01"},{pageNumber:2,title:{"zh-Hans":"\u4EC0\u4E48\u662F\u516B\u5B57\uFF1F",en:"WHAT IS BAZI?"},sourceText:`# 02\uFF5C\u4EC0\u4E48\u662F\u516B\u5B57\uFF1F
## WHAT IS BAZI?

**\u72B6\u6001\uFF1A** \`OPEN\`

\u524D\u4E00\u8F6E\u5DF2\u7ECF\u51BB\u7ED3\u3002

### \u5BA2\u6237\u95EE\u9898
> \u516B\u5B57\u5230\u5E95\u5728\u8BFB\u53D6\u4EC0\u4E48\uFF1F

### \u4E3B\u89C6\u89C9
\`Birth \u2192 Four Pillars \u2192 Five Elements \u2192 Structure \u2192 Timing\`

---`,sourcePath:"docs/guided-report-successor-r1/reference-bazi-blueprint.md",role:"WHAT_IS_BAZI",master:"M02"},{pageNumber:3,title:{"zh-Hans":"\u4E3A\u4EC0\u4E48\u516B\u5B57\u4F1A\u4F20\u627F\u81F3\u4ECA\uFF1F",en:"WHY HAS BAZI ENDURED?"},sourceText:`Source conversation: https://chatgpt.com/c/6aaa576d-03bc-83ec-a176-5f8885313c6f
Source turn: de93fabd-a669-4019-9563-81ef17d622db
Reference material; current task attachment and latest user corrections take precedence.

\u7EE7\u7EED\u3002\u5148\u628A **\u516B\u5B57\u7684 Origin & Continuity \u56FA\u5B9A\u9875**\u5B8C\u6210\uFF0C\u518D\u628A **Astrology \u7684\u540C\u7C7B\u56FA\u5B9A\u9875**\u4E00\u8D77\u51BB\u7ED3\uFF0C\u8FD9\u6837\u6211\u4EEC\u5C31\u5F00\u59CB\u5EFA\u7ACB 8 \u79CD\u62A5\u544A\u5171\u540C\u7684\u7B2C\u4E09\u9875\u6807\u51C6\u3002

---

# BAZI-03\uFF5C\u4E3A\u4EC0\u4E48\u516B\u5B57\u4F1A\u4F20\u627F\u81F3\u4ECA\uFF1F
## WHY HAS BAZI ENDURED?

### \u9875\u9762\u89D2\u8272
\`METHOD_ORIGIN_CONTINUITY\`

### \u9875\u9762\u72B6\u6001
\`FIXED_CANONICAL_CONTENT\`

\u6240\u6709\u5BA2\u6237\u5171\u7528\uFF0C\u4E0D\u8C03\u7528 OpenAI \u52A8\u6001\u91CD\u5199\u3002

### \u56FA\u5B9A\u6807\u9898

**\u4E3A\u4EC0\u4E48\u516B\u5B57\u4F1A\u4F20\u627F\u81F3\u4ECA\uFF1F**  
**WHY HAS BAZI ENDURED?**

### \u56FA\u5B9A\u526F\u6807\u9898

**\u5B83\u7ECF\u5386\u4E86\u957F\u671F\u6574\u7406\u3001\u89E3\u91CA\u4E0E\u5B9E\u8DF5\uFF0C\u9010\u6E10\u5F62\u6210\u4E00\u5957\u4EE5\u51FA\u751F\u65F6\u95F4\u89C2\u5BDF\u7ED3\u6784\u4E0E\u53D8\u5316\u7684\u8BED\u8A00\u3002**

**It endured through centuries of refinement, interpretation, and practice as a structured language for examining birth patterns and change over time.**

---

## \u4E2D\u6587\u56FA\u5B9A\u6B63\u6587

\u516B\u5B57\u5E76\u4E0D\u662F\u5728\u67D0\u4E00\u4E2A\u65F6\u523B\u7A81\u7136\u5B8C\u6210\u7684\u4F53\u7CFB\u3002\u5B83\u5EFA\u7ACB\u5728\u4E2D\u56FD\u957F\u671F\u4F7F\u7528\u5E72\u652F\u7EAA\u5E74\u3001\u5386\u6CD5\u3001\u9634\u9633\u4E0E\u4E94\u884C\u5173\u7CFB\u6765\u7EC4\u7EC7\u65F6\u95F4\u548C\u53D8\u5316\u7684\u4F20\u7EDF\u4E4B\u4E0A\uFF0C\u540E\u6765\u9010\u6E10\u53D1\u5C55\u51FA\u4EE5\u51FA\u751F\u5E74\u3001\u6708\u3001\u65E5\u3001\u65F6\u5EFA\u7ACB\u56DB\u67F1\uFF0C\u5E76\u901A\u8FC7\u5E72\u652F\u3001\u4E94\u884C\u3001\u5B63\u8282\u4E0E\u65F6\u95F4\u5468\u671F\u8FDB\u884C\u7ED3\u6784\u8BFB\u53D6\u7684\u65B9\u6CD5\u3002

\u968F\u7740\u4E0D\u540C\u65F6\u4EE3\u7684\u6574\u7406\u4E0E\u4F20\u627F\uFF0C\u516B\u5B57\u7684\u672F\u8BED\u3001\u5224\u65AD\u89C4\u5219\u4E0E\u6D41\u6D3E\u4E0D\u65AD\u53D1\u5C55\uFF0C\u540C\u4E00\u4E2A\u7ED3\u6784\u4E5F\u53EF\u80FD\u51FA\u73B0\u4E0D\u540C\u89E3\u91CA\u3002\u5B83\u4E4B\u6240\u4EE5\u80FD\u591F\u957F\u671F\u5EF6\u7EED\uFF0C\u5E76\u4E0D\u53EA\u662F\u56E0\u4E3A\u201C\u5386\u53F2\u60A0\u4E45\u201D\uFF0C\u800C\u662F\u56E0\u4E3A\u56DB\u67F1\u3001\u4E94\u884C\u3001\u5B63\u8282\u4E0E\u65F6\u95F4\u4E4B\u95F4\u5F62\u6210\u4E86\u4E00\u5957\u53EF\u4EE5\u91CD\u590D\u8BA1\u7B97\u3001\u8BB0\u5F55\u3001\u6BD4\u8F83\u4E0E\u8BA8\u8BBA\u7684\u7ED3\u6784\u8BED\u8A00\uFF0C\u4F7F\u4E0D\u540C\u4E16\u4EE3\u7684\u4EBA\u80FD\u591F\u7EE7\u7EED\u5728\u540C\u4E00\u5957\u6846\u67B6\u4E2D\u63D0\u51FA\u5173\u4E8E\u5173\u7CFB\u3001\u8D44\u6E90\u3001\u9636\u6BB5\u4E0E\u53D8\u5316\u7684\u95EE\u9898\u3002

\u957F\u671F\u4F20\u627F\u8BF4\u660E\u516B\u5B57\u5177\u6709\u6301\u7EED\u7684\u6587\u5316\u4E0E\u89E3\u91CA\u4EF7\u503C\uFF0C\u4F46\u5E76\u4E0D\u610F\u5473\u7740\u6BCF\u4E00\u4E2A\u4F20\u7EDF\u5224\u65AD\u90FD\u56E0\u6B64\u6210\u4E3A\u7ECF\u8FC7\u73B0\u4EE3\u5B9E\u8BC1\u9A8C\u8BC1\u7684\u4E8B\u5B9E\u3002\u4ECA\u5929\u4F7F\u7528\u516B\u5B57\uFF0C\u66F4\u91CD\u8981\u7684\u662F\u5206\u6E05\u54EA\u4E9B\u5C5E\u4E8E\u8BA1\u7B97\u7ED3\u6784\u3001\u54EA\u4E9B\u5C5E\u4E8E\u5386\u53F2\u5F62\u6210\u7684\u89E3\u91CA\uFF0C\u4EE5\u53CA\u8FD9\u4E9B\u89E3\u91CA\u662F\u5426\u771F\u7684\u80FD\u591F\u5728\u73B0\u5B9E\u4E2D\u88AB\u89C2\u5BDF\u548C\u68C0\u9A8C\u3002

---

## Fixed English Copy

BaZi did not emerge as a complete system at a single moment in history. It developed from long-standing Chinese traditions for organizing time through the sexagenary cycle, calendrical structure, yin\u2013yang relationships, and the Five Elements. Over time, these ideas were increasingly organized around the year, month, day, and hour of birth, forming the Four Pillars framework and its later approaches to structure and timing.

Across different periods, practitioners refined terminology, interpretive rules, and schools of reading. The same structural configuration can therefore be interpreted differently within different traditions. BaZi has endured not simply because it is old, but because the relationships among pillars, elements, seasons, and timing created a repeatable framework that could be calculated, recorded, compared, debated, and transmitted across generations.

Long transmission demonstrates enduring cultural and interpretive value. It does not, by itself, establish every traditional interpretation as an empirically verified fact. A contemporary reading should therefore distinguish calculated structure from inherited interpretation, and inherited interpretation from what can actually be observed in Reality.

---

# BAZI-03 \u4E3B\u89C6\u89C9
## \`BAZI HISTORY & CONTINUITY TIMELINE\`

\u4E0D\u8981\u753B\u671D\u4EE3\u767E\u79D1\uFF0C\u4E5F\u4E0D\u8981\u505A\u6EE1\u9875\u5386\u53F2\u6587\u5B57\u3002

\u5EFA\u8BAE\u7528 **6 \u4E2A\u5386\u53F2\u9636\u6BB5\u8282\u70B9**\uFF1A

\`\`\`text
TIME ORGANIZATION
\u65F6\u95F4\u7EC4\u7EC7
\u5E72\u652F / \u5386\u6CD5
        \u2193
YIN\u2013YANG & FIVE ELEMENTS
\u9634\u9633\u4E0E\u4E94\u884C
        \u2193
BIRTH-TIME STRUCTURE
\u51FA\u751F\u65F6\u95F4\u7ED3\u6784
        \u2193
FOUR PILLARS
\u56DB\u67F1\u4F53\u7CFB
        \u2193
SCHOOLS & INTERPRETATION
\u6D41\u6D3E\u4E0E\u89E3\u91CA
        \u2193
MODERN PRACTICE
\u73B0\u4EE3\u5B9E\u8DF5
\`\`\`

\u89C6\u89C9\u5E95\u5C42\u53EF\u4EE5\u662F\u4E00\u6761\u975E\u5E38\u7EC6\u7684\u65F6\u95F4\u5E26\uFF1A

\`\`\`text
Early calendrical traditions
\u2192 medieval systematization
\u2192 later textual traditions
\u2192 modern transmission
\`\`\`

\u4E0D\u9700\u8981\u5F3A\u884C\u585E\u7CBE\u786E\u5E74\u4EFD\u3002

---

## \u9875\u9762\u4E09\u4E2A\u56FA\u5B9A\u77E5\u8BC6\u5757

### 01\uFF5C\u4E3A\u4EC0\u4E48\u5B83\u80FD\u591F\u6301\u7EED\uFF1F
**WHY DID IT CONTINUE?**

> \u56E0\u4E3A\u5B83\u63D0\u4F9B\u4E86\u4E00\u5957\u53EF\u91CD\u590D\u8BA1\u7B97\u3001\u8BB0\u5F55\u4E0E\u6BD4\u8F83\u7684\u7ED3\u6784\u8BED\u8A00\u3002

> Because it offered a structure that could be repeatedly calculated, recorded, and compared.

### 02\uFF5C\u4E3A\u4EC0\u4E48\u4F1A\u6709\u4E0D\u540C\u6D41\u6D3E\uFF1F
**WHY ARE THERE DIFFERENT SCHOOLS?**

> \u56E0\u4E3A\u957F\u671F\u4F20\u627F\u540C\u65F6\u610F\u5473\u7740\u89C4\u5219\u3001\u91CD\u70B9\u4E0E\u89E3\u91CA\u4E0D\u65AD\u88AB\u91CD\u65B0\u6574\u7406\u3002

> Long transmission also meant that rules, priorities, and interpretations continued to evolve.

### 03\uFF5C\u4ECA\u5929\u5E94\u8BE5\u600E\u6837\u770B\uFF1F
**HOW SHOULD WE READ IT TODAY?**

> \u4FDD\u7559\u7ED3\u6784\uFF0C\u7406\u89E3\u4F20\u7EDF\uFF0C\u540C\u65F6\u628A\u89E3\u91CA\u91CD\u65B0\u653E\u56DE\u73B0\u5B9E\u4E2D\u9A8C\u8BC1\u3002

> Preserve the structure, understand the tradition, and compare interpretation with Reality.

---

# BAZI \u5386\u53F2\u9875\u7684\u56FA\u5B9A\u8FB9\u754C

\u9875\u9762\u5E95\u90E8\u56FA\u5B9A\u4E00\u6761\uFF1A

> **\u957F\u671F\u4F20\u627F\u8BF4\u660E\u6301\u7EED\u7684\u6587\u5316\u4E0E\u89E3\u91CA\u4EF7\u503C\uFF0C\u4E0D\u7B49\u4E8E\u6BCF\u4E00\u4E2A\u4F20\u7EDF\u5224\u65AD\u90FD\u56E0\u6B64\u6210\u4E3A\u73B0\u4EE3\u5B9E\u8BC1\u4E8B\u5B9E\u3002**

\u82F1\u6587\uFF1A

> **Long transmission shows enduring cultural and interpretive value; it does not by itself validate every traditional claim as a modern empirical fact.**

\u8FD9\u4E00\u53E5\u4EE5\u540E Traditional Method \u90FD\u53EF\u4EE5\u6CBF\u7528\u601D\u60F3\uFF0C\u4F46\u4E0D\u8981\u673A\u68B0\u590D\u5236\u63AA\u8F9E\u3002

---

# \u73B0\u5728\u516B\u5B57\u524D\u516D\u9875\u6B63\u5F0F\u987A\u5E8F

\`\`\`text
01\uFF5CCOVER
\u516B\u5B57\u5B8C\u6574\u62A5\u544A

02\uFF5CWHAT IS BAZI?
\u4EC0\u4E48\u662F\u516B\u5B57\uFF1F

03\uFF5CWHY HAS BAZI ENDURED?
\u4E3A\u4EC0\u4E48\u516B\u5B57\u4F1A\u4F20\u627F\u81F3\u4ECA\uFF1F

04\uFF5CHOW DOES PHI OS USE BAZI?
PHI OS \u5982\u4F55\u770B\u5F85\u5E76\u4F7F\u7528\u516B\u5B57\uFF1F

05\uFF5CHOW TO READ THIS REPORT
\u5982\u4F55\u9605\u8BFB\u8FD9\u4EFD\u62A5\u544A\uFF1F

06\uFF5CYOUR BAZI SNAPSHOT
\u4F60\u7684\u516B\u5B57\u603B\u89C8
\`\`\`

\u539F\u672C\u7684\u4E2A\u4EBA\u9875\u9762\u5168\u90E8\u987A\u5EF6\u4E00\u9875\uFF0C\u6240\u4EE5\u6700\u7EC8\u516B\u5B57\u53D8\u6210 **26 \u9875 Premium Report**\u3002

---

# ASTROLOGY-03\uFF5C\u4E3A\u4EC0\u4E48\u5360\u661F\u4F1A\u4F20\u627F\u81F3\u4ECA\uFF1F
## WHY HAS ASTROLOGY ENDURED?

Astrology \u7684\u5386\u53F2\u9875\u53EF\u4EE5\u66F4\u4E30\u5BCC\uFF0C\u56E0\u4E3A\u5B83\u975E\u5E38\u9002\u5408\u753B\u4E00\u6761\u8DE8\u6587\u660E\u4F20\u64AD\u7EBF\u3002

### \u9875\u9762\u89D2\u8272
\`METHOD_ORIGIN_CONTINUITY\`

### \u56FA\u5B9A\u6807\u9898

**\u4E3A\u4EC0\u4E48\u5360\u661F\u4F1A\u4F20\u627F\u81F3\u4ECA\uFF1F**  
**WHY HAS ASTROLOGY ENDURED?**

### \u56FA\u5B9A\u526F\u6807\u9898

**\u5B83\u968F\u7740\u5929\u6587\u89C2\u5BDF\u3001\u6570\u5B66\u3001\u54F2\u5B66\u4E0E\u6587\u5316\u4EA4\u6D41\u4E0D\u65AD\u6539\u53D8\uFF0C\u5374\u4E00\u76F4\u4FDD\u7559\u7740\u4E00\u4E2A\u6838\u5FC3\u95EE\u9898\uFF1A\u5929\u7A7A\u4E2D\u7684\u5468\u671F\u80FD\u5426\u6210\u4E3A\u7406\u89E3\u65F6\u95F4\u4E0E\u4EBA\u7C7B\u7ECF\u9A8C\u7684\u4E00\u79CD\u8BED\u8A00\uFF1F**

**It changed through astronomy, mathematics, philosophy, and cultural exchange while preserving one persistent question: can celestial cycles offer a language for understanding time and human experience?**

---

## \u4E2D\u6587\u56FA\u5B9A\u6B63\u6587

\u5360\u661F\u7684\u5386\u53F2\u4E0D\u662F\u4E00\u6761\u7531\u5355\u4E00\u6587\u660E\u8FDE\u7EED\u4FDD\u5B58\u4E0B\u6765\u7684\u76F4\u7EBF\uFF0C\u800C\u662F\u4E00\u5957\u968F\u7740\u5929\u6587\u89C2\u5BDF\u3001\u5386\u6CD5\u3001\u6570\u5B66\u4E0E\u6587\u5316\u4EA4\u6D41\u4E0D\u65AD\u91CD\u7EC4\u7684\u4F20\u7EDF\u3002\u65E9\u671F\u8FD1\u4E1C\u793E\u4F1A\u5DF2\u7ECF\u957F\u671F\u8BB0\u5F55\u5929\u8C61\u4E0E\u65F6\u95F4\u53D8\u5316\uFF1B\u540E\u6765\uFF0C\u5E0C\u814A\u5316\u65F6\u671F\u9010\u6E10\u5F62\u6210\u4E86\u66F4\u63A5\u8FD1\u73B0\u4EE3\u672C\u547D\u5360\u661F\u7684\u7ED3\u6784\uFF0C\u628A\u884C\u661F\u3001\u9EC4\u9053\u3001\u5BAB\u4F4D\u4E0E\u51FA\u751F\u65F6\u523B\u7EC4\u7EC7\u5728\u540C\u4E00\u5F20\u56FE\u4E2D\u3002

\u8FD9\u4E9B\u77E5\u8BC6\u6B64\u540E\u901A\u8FC7\u4E0D\u540C\u8BED\u8A00\u3001\u5730\u533A\u4E0E\u5B66\u672F\u4F20\u7EDF\u7EE7\u7EED\u4F20\u64AD\uFF0C\u5728\u665A\u671F\u53E4\u5178\u4E16\u754C\u3001\u4F0A\u65AF\u5170\u5B66\u672F\u73AF\u5883\u3001\u4E2D\u4E16\u7EAA\u4E0E\u8FD1\u4EE3\u6B27\u6D32\u4EE5\u53CA\u540E\u6765\u7684\u73B0\u4EE3\u5360\u661F\u5B9E\u8DF5\u4E2D\u4E0D\u65AD\u88AB\u7FFB\u8BD1\u3001\u6574\u7406\u548C\u91CD\u65B0\u89E3\u91CA\u3002\u4ECA\u5929\u5E38\u89C1\u7684\u672C\u547D\u76D8\u3001\u5BAB\u4F4D\u3001\u76F8\u4F4D\u4E0E\u65F6\u95F4\u6280\u672F\uFF0C\u5E76\u4E0D\u662F\u67D0\u4E00\u4E2A\u65F6\u4EE3\u4E00\u6B21\u5B8C\u6210\u7684\uFF0C\u800C\u662F\u591A\u6B21\u77E5\u8BC6\u4F20\u9012\u4E0E\u91CD\u6784\u7684\u7ED3\u679C\u3002

\u5360\u661F\u4E4B\u6240\u4EE5\u6301\u7EED\u5B58\u5728\uFF0C\u4E00\u90E8\u5206\u539F\u56E0\u5728\u4E8E\u5B83\u628A\u590D\u6742\u7684\u5929\u4F53\u5468\u671F\u538B\u7F29\u6210\u4E00\u5957\u53EF\u89C6\u5316\u7ED3\u6784\uFF0C\u4F7F\u4EBA\u80FD\u591F\u8BA8\u8BBA\u65F6\u95F4\u3001\u5173\u7CFB\u3001\u4EBA\u751F\u9886\u57DF\u4E0E\u53D8\u5316\u3002\u5B83\u7684\u957F\u671F\u6587\u5316\u751F\u547D\u529B\u503C\u5F97\u7406\u89E3\uFF0C\u4F46\u957F\u671F\u6D41\u4F20\u672C\u8EAB\u5E76\u4E0D\u80FD\u8BC1\u660E\u661F\u76D8\u4E2D\u7684\u6BCF\u4E00\u4E2A\u89E3\u91CA\u90FD\u662F\u73B0\u4EE3\u79D1\u5B66\u610F\u4E49\u4E0A\u7684\u56E0\u679C\u4E8B\u5B9E\u3002

---

## Fixed English Copy

The history of astrology is not a single uninterrupted tradition preserved by one civilization. It developed through repeated interaction among astronomical observation, calendars, mathematics, philosophy, and cultural exchange. Ancient Near Eastern societies recorded celestial phenomena and their relation to time, while the Hellenistic period gradually produced structures closer to natal astrology as it is recognized today, bringing planets, the zodiac, houses, and the birth moment into a single chart.

These traditions were subsequently transmitted, translated, reorganized, and reinterpreted across late antiquity, Islamic scholarly contexts, medieval and early modern Europe, and later modern forms of astrology. The natal chart, houses, aspects, and timing methods familiar today were therefore not created all at once; they are the result of multiple stages of transmission and reconstruction.

Astrology has endured partly because it transforms complex celestial cycles into a visual language for discussing time, relationships, life domains, and change. Its long cultural continuity is historically significant, but longevity alone does not establish every astrological interpretation as a scientifically demonstrated causal fact.

---

# ASTROLOGY-03 \u4E3B\u89C6\u89C9
## \`ASTROLOGY TRANSMISSION MAP\`

\u8FD9\u4E00\u9875\u975E\u5E38\u9002\u5408\u505A\u6210\u6BD4\u516B\u5B57\u66F4\u5BBD\u5E7F\u7684\u5386\u53F2\u8F68\u8FF9\u56FE\u3002

\u5EFA\u8BAE\uFF1A

\`\`\`text
MESOPOTAMIAN
CELESTIAL RECORDS
\u65E9\u671F\u5929\u8C61\u8BB0\u5F55
        \u2193
HELLENISTIC
SYNTHESIS
\u5E0C\u814A\u5316\u4F53\u7CFB\u5316
        \u2193
LATE ANTIQUE
TRANSMISSION
\u665A\u671F\u53E4\u5178\u4F20\u64AD
        \u2193
ISLAMIC SCHOLARSHIP
\u7FFB\u8BD1\u3001\u8BA1\u7B97\u4E0E\u4FDD\u5B58
        \u2193
MEDIEVAL / EARLY MODERN
EUROPE
\u6B27\u6D32\u91CD\u7EC4
        \u2193
MODERN ASTROLOGY
\u73B0\u4EE3\u5360\u661F
\`\`\`

\u89C6\u89C9\u4E0A\u53EF\u4EE5\u662F\u4E00\u6761\u4ECE\u5DE6\u5230\u53F3\u7684\uFF1A

**celestial orbit \xD7 manuscript \xD7 chart evolution timeline**

\u4E0D\u8981\u5806\u5386\u53F2\u4EBA\u7269\u5934\u50CF\u3002

---

# Astrology \u5386\u53F2\u9875\u53EF\u4EE5\u518D\u52A0\u4E00\u4E2A\u201C\u7ED3\u6784\u5982\u4F55\u5F62\u6210\u201D\u5C0F\u56FE

\u53F3\u4E0B\u89D2\uFF1A

\`\`\`text
CELESTIAL OBSERVATION
\u5929\u8C61\u89C2\u5BDF
+
MATHEMATICAL CALCULATION
\u6570\u5B66\u8BA1\u7B97
+
CULTURAL INTERPRETATION
\u6587\u5316\u89E3\u91CA
        \u2193
ASTROLOGICAL TRADITIONS
\u5360\u661F\u4F20\u7EDF
\`\`\`

\u8FD9\u975E\u5E38\u7B26\u5408 PHI OS\uFF0C\u56E0\u4E3A\u5B83\u76F4\u63A5\u8BF4\u660E\uFF1A

> \u8BA1\u7B97\u7ED3\u6784\u4E0E\u89E3\u91CA\u4F20\u7EDF\u4E0D\u662F\u540C\u4E00\u4EF6\u4E8B\u3002

---

# Astrology \u4E09\u4E2A\u56FA\u5B9A\u77E5\u8BC6\u5757

### 01\uFF5C\u4E3A\u4EC0\u4E48\u4E0D\u65AD\u53D8\u5316\u5374\u6CA1\u6709\u6D88\u5931\uFF1F
**WHY DID IT SURVIVE CHANGE?**

> \u56E0\u4E3A\u5B83\u4E0D\u65AD\u5438\u6536\u65B0\u7684\u8BA1\u7B97\u65B9\u6CD5\u3001\u6587\u5316\u8BED\u8A00\u4E0E\u89E3\u91CA\u6846\u67B6\u3002

### 02\uFF5C\u4ECA\u5929\u7684\u5360\u661F\u662F\u4E0D\u662F\u53E4\u4EE3\u539F\u6837\u4FDD\u5B58\uFF1F
**IS MODERN ASTROLOGY IDENTICAL TO ANCIENT ASTROLOGY?**

> \u4E0D\u662F\u3002\u4ECA\u5929\u5E38\u89C1\u7684\u4F53\u7CFB\u7ECF\u8FC7\u4E86\u591A\u6B21\u4F20\u64AD\u3001\u9009\u62E9\u4E0E\u91CD\u7EC4\u3002

### 03\uFF5C\u4E3A\u4EC0\u4E48\u4ECA\u5929\u4ECD\u6709\u4EBA\u4F7F\u7528\uFF1F
**WHY IS IT STILL USED?**

> \u56E0\u4E3A\u661F\u76D8\u63D0\u4F9B\u4E86\u4E00\u79CD\u9AD8\u5EA6\u7ED3\u6784\u5316\u7684\u65B9\u5F0F\uFF0C\u628A\u65F6\u95F4\u3001\u9886\u57DF\u4E0E\u5173\u7CFB\u653E\u5728\u540C\u4E00\u5F20\u56FE\u4E2D\u89C2\u5BDF\u3002

---

# Astrology \u56FA\u5B9A\u5386\u53F2\u8FB9\u754C

\u4E2D\u6587\uFF1A

> **\u5360\u661F\u957F\u671F\u5B58\u5728\uFF0C\u8BF4\u660E\u5B83\u5177\u6709\u6301\u7EED\u7684\u6587\u5316\u3001\u8C61\u5F81\u4E0E\u89E3\u91CA\u5F71\u54CD\u529B\uFF1B\u8FD9\u4E0E\u8BC1\u660E\u5929\u4F53\u4F4D\u7F6E\u4F1A\u4EE5\u7279\u5B9A\u673A\u5236\u51B3\u5B9A\u4E2A\u4EBA\u547D\u8FD0\uFF0C\u662F\u4E24\u4E2A\u4E0D\u540C\u7684\u95EE\u9898\u3002**

\u82F1\u6587\uFF1A

> **Astrology's longevity demonstrates enduring cultural, symbolic, and interpretive influence; that is distinct from demonstrating that celestial positions determine individual fate through an established causal mechanism.**

---

# Astrology \u524D\u516D\u9875\u73B0\u5728\u4E5F\u6B63\u5F0F\u51BB\u7ED3

\`\`\`text
01\uFF5CASTROLOGY FULL REPORT
\u5360\u661F\u5B8C\u6574\u62A5\u544A

02\uFF5CWHAT IS ASTROLOGY?
\u4EC0\u4E48\u662F\u5360\u661F\uFF1F

03\uFF5CWHY HAS ASTROLOGY ENDURED?
\u4E3A\u4EC0\u4E48\u5360\u661F\u4F1A\u4F20\u627F\u81F3\u4ECA\uFF1F

04\uFF5CHOW DOES PHI OS USE ASTROLOGY?
PHI OS \u5982\u4F55\u770B\u5F85\u5E76\u4F7F\u7528\u5360\u661F\uFF1F

05\uFF5CHOW TO READ THIS REPORT
\u5982\u4F55\u9605\u8BFB\u8FD9\u4EFD\u62A5\u544A\uFF1F

06\uFF5CYOUR ASTROLOGY SNAPSHOT
\u4F60\u7684\u661F\u76D8\u603B\u89C8
\`\`\`

\u540E\u9762\u7684\u4E2A\u4EBA\u9875\u9762\u987A\u5EF6\uFF0C\u56E0\u6B64 Astrology \u6700\u7EC8\u4E5F\u81EA\u7136\u53D8\u6210\u7EA6 **26 \u9875**\u3002

---

## \u540E\u7EED 6 \u4E2A\u65B9\u6CD5\u7684\u5386\u53F2\u9875\u4E0D\u80FD\u5B8C\u5168\u5957\u6A21\u677F

\u73B0\u5728\u6211\u4EEC\u5B9E\u9645\u4E0A\u4F1A\u5F62\u6210\u4E09\u5957 Origin Page\uFF1A

**\u4F20\u7EDF\u957F\u671F\u65B9\u6CD5\uFF1A**

\`\`\`text
BAZI
ZI WEI
ASTROLOGY
NUMEROLOGY
\`\`\`

\u4F7F\u7528\uFF1A

> **WHY HAS THIS METHOD ENDURED?**

**\u73B0\u4EE3\u7EFC\u5408\u65B9\u6CD5\uFF1A**

\`\`\`text
HUMAN DESIGN
\`\`\`

\u4F7F\u7528\uFF1A

> **HOW DID THIS METHOD EMERGE AND DEVELOP?**

**PHI OS \u539F\u751F\u65B9\u6CD5\uFF1A**

\`\`\`text
PROFILE
ECR
CROSS
\`\`\`

\u5206\u522B\u66F4\u9002\u5408\uFF1A

> **WHY WAS THIS METHOD BUILT?**

\u8FD9\u6837\u4E0D\u4F1A\u4E3A\u4E86\u201C\u5386\u53F2\u539A\u5EA6\u201D\u800C\u5236\u9020\u4E0D\u5B58\u5728\u7684\u53E4\u8001\u4F20\u627F\u3002

\u4E0B\u4E00\u6B65\u6700\u5408\u7406\u7684\u662F\u7EE7\u7EED\u5B8C\u6210 **\u7D2B\u5FAE\u6597\u6570\uFF1AWhat is Zi Wei \u2192 \u4E3A\u4EC0\u4E48\u4F20\u627F\u81F3\u4ECA \u2192 PHI OS Lens**\uFF0C\u7136\u540E\u518D\u628A Zi Wei \u7684\u5B8C\u6574 26 \u9875 blueprint \u4E00\u6B21\u51BB\u7ED3\u3002
`,sourcePath:"docs/guided-report-successor-r1/reference-origins-bazi-astrology.md",role:"WHY_HAS_BAZI_ENDURED",master:"M02"},{pageNumber:4,title:{"zh-Hans":"PHI OS \u5982\u4F55\u770B\u5F85\u5E76\u4F7F\u7528\u516B\u5B57\uFF1F",en:"HOW DOES PHI OS USE BAZI?"},sourceText:`# 03\uFF5CPHI OS \u5982\u4F55\u770B\u5F85\u5E76\u4F7F\u7528\u516B\u5B57\uFF1F
## HOW DOES PHI OS USE BAZI?

**\u72B6\u6001\uFF1A** \`OPEN\`

\u524D\u4E00\u8F6E\u5DF2\u7ECF\u51BB\u7ED3\u3002

### \u5BA2\u6237\u95EE\u9898
> PHI OS \u4F1A\u4E0D\u4F1A\u628A\u516B\u5B57\u5F53\u6210\u7EDD\u5BF9\u7B54\u6848\uFF1F

### \u4E3B\u89C6\u89C9
\`Method Projection \u2192 Interpretation \u2192 Evidence \u2192 Observation \u2192 Navigation\`

---`,sourcePath:"docs/guided-report-successor-r1/reference-bazi-blueprint.md",role:"HOW_DOES_PHI_OS_USE_BAZI",master:"M02"},{pageNumber:5,title:{"zh-Hans":"\u5982\u4F55\u9605\u8BFB\u8FD9\u4EFD\u62A5\u544A",en:"HOW TO READ THIS REPORT"},sourceText:`# 04\uFF5C\u5982\u4F55\u9605\u8BFB\u8FD9\u4EFD\u62A5\u544A
## HOW TO READ THIS REPORT

**\u72B6\u6001\uFF1A** \`OPEN\`

\u5C31\u662F\u672C\u8F6E\u4E0A\u9762\u51BB\u7ED3\u7684\u56FA\u5B9A\u9875\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-bazi-blueprint.md",role:"HOW_TO_READ_THIS_REPORT",master:"M02"},{pageNumber:6,title:{"zh-Hans":"\u4F60\u7684\u516B\u5B57\u603B\u89C8",en:"YOUR BAZI SNAPSHOT"},sourceText:`# 05\uFF5C\u4F60\u7684\u516B\u5B57\u603B\u89C8
## YOUR BAZI SNAPSHOT

**\u72B6\u6001\uFF1A** \`OPEN\`

\u8FD9\u662F Free \u4E2D\u6700\u91CD\u8981\u7684\u5BA2\u6237\u4E2A\u4EBA\u9875\u3002

### \u5BA2\u6237\u95EE\u9898
> \u5982\u679C\u6211\u53EA\u770B\u4E00\u9875\uFF0C\u6211\u6700\u9700\u8981\u5148\u77E5\u9053\u4EC0\u4E48\uFF1F

### \u4E3B\u89C6\u89C9
**BaZi Snapshot Dashboard**

\u5EFA\u8BAE\u4E2D\u592E\uFF1A

\`\`\`text
\u56DB\u67F1 mini chart
\`\`\`

\u5468\u56F4 5 \u4E2A\u6A21\u5757\uFF1A

\`\`\`text
DAY MASTER
\u65E5\u4E3B

SEASON
\u5B63\u8282 / \u6708\u4EE4

FIVE ELEMENTS
\u4E94\u884C

PRIMARY STRUCTURE
\u4E3B\u8981\u7ED3\u6784

TIMING POSITION
\u65F6\u95F4\u4F4D\u7F6E
\`\`\`

### \u4FE1\u606F\u69FD
\u6700\u591A\u4E09\u6761\uFF1A

1. \`PRIMARY STRUCTURE\`
2. \`KEY TENSION\`
3. \`WHAT TO OBSERVE\`

### Free \u4EF7\u503C
\u8FD9\u4E00\u9875\u5FC5\u987B\u8DB3\u591F\u8BA9\u5BA2\u6237\u611F\u89C9\uFF1A

> \u201C\u6211\u771F\u7684\u5DF2\u7ECF\u5F97\u5230\u4E00\u4EFD\u4E2A\u4EBA\u8BFB\u53D6\u3002\u201D

\u4E0D\u662F\u7EAF\u8425\u9500\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-bazi-blueprint.md",role:"YOUR_BAZI_SNAPSHOT",master:"M03"},{pageNumber:7,title:{"zh-Hans":"\u4F60\u7684\u56DB\u67F1\u7ED3\u6784",en:"YOUR FOUR PILLARS"},sourceText:`# 06\uFF5C\u4F60\u7684\u56DB\u67F1\u7ED3\u6784
## YOUR FOUR PILLARS

**\u72B6\u6001\uFF1A** \`LOCKED\`

### \u5BA2\u6237\u95EE\u9898
> \u6211\u7684\u5E74\u3001\u6708\u3001\u65E5\u3001\u65F6\u56DB\u67F1\u4E4B\u95F4\u5F62\u6210\u4E86\u600E\u6837\u7684\u57FA\u7840\u7ED3\u6784\uFF1F

### \u4E3B\u89C6\u89C9
\u56DB\u67F1\u7EB5\u5411\u6216\u6A2A\u5411\u7ED3\u6784\u56FE\uFF1A

\`\`\`text
YEAR
MONTH
DAY
HOUR
\`\`\`

\u6BCF\u67F1\u663E\u793A\uFF1A

- Stem
- Branch
- relation markers
- element tag

### \u4FE1\u606F\u69FD

1. \`STRUCTURAL ROLE\`
2. \`RELATION\`
3. \`OBSERVATION\`

### Locked Preview \u6587\u6848

**\u4E2D\u6587\uFF1A**
> \u770B\u89C1\u56DB\u67F1\u5982\u4F55\u5171\u540C\u6784\u6210\u4F60\u7684\u57FA\u7840\u7ED3\u6784\uFF0C\u800C\u4E0D\u662F\u628A\u6BCF\u4E00\u67F1\u5206\u5F00\u9605\u8BFB\u3002

**English:**
> See how the Four Pillars work together as one structure rather than as isolated labels.

---`,sourcePath:"docs/guided-report-successor-r1/reference-bazi-blueprint.md",role:"YOUR_FOUR_PILLARS",master:"M04"},{pageNumber:8,title:{"zh-Hans":"\u65E5\u4E3B\u4E0E\u5B63\u8282\u80CC\u666F",en:"DAY MASTER & SEASONAL CONTEXT"},sourceText:`# 07\uFF5C\u65E5\u4E3B\u4E0E\u5B63\u8282\u80CC\u666F
## DAY MASTER & SEASONAL CONTEXT

**\u72B6\u6001\uFF1A** \`LOCKED\`

### \u5BA2\u6237\u95EE\u9898
> \u6211\u7684\u6838\u5FC3\u7ED3\u6784\u5904\u5728\u600E\u6837\u7684\u5B63\u8282\u4E0E\u73AF\u5883\u80CC\u666F\u4E2D\uFF1F

### \u4E3B\u89C6\u89C9
\u4E2D\u592E Day Master\uFF0C\u5916\u5C42 Seasonal Context\uFF1A

\`\`\`text
DAY MASTER
        \u2193
MONTH COMMAND / SEASON
        \u2193
AVAILABLE SUPPORT
        \u2193
STRUCTURAL PRESSURE
\`\`\`

### \u4FE1\u606F\u69FD

1. \`BASE POSITION\`
2. \`SEASONAL CONTEXT\`
3. \`STRUCTURAL EFFECT\`

### Locked Preview

> \u770B\u89C1\u6838\u5FC3\u7ED3\u6784\u4E0D\u662F\u72EC\u7ACB\u5B58\u5728\uFF0C\u800C\u662F\u5728\u5B63\u8282\u3001\u6708\u4EE4\u4E0E\u6574\u4F53\u5173\u7CFB\u4E2D\u88AB\u5B9A\u4E49\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-bazi-blueprint.md",role:"DAY_MASTER_SEASONAL_CONTEXT",master:"M04"},{pageNumber:9,title:{"zh-Hans":"\u4E94\u884C\u5206\u5E03",en:"FIVE ELEMENT DISTRIBUTION"},sourceText:`# 08\uFF5C\u4E94\u884C\u5206\u5E03
## FIVE ELEMENT DISTRIBUTION

**\u72B6\u6001\uFF1A** \`LOCKED\`

### \u5BA2\u6237\u95EE\u9898
> \u4E94\u79CD\u5143\u7D20\u5728\u6211\u7684\u7ED3\u6784\u4E2D\u5982\u4F55\u5206\u5E03\uFF1F

### \u4E3B\u89C6\u89C9
\u4E00\u5B9A\u662F\u52A8\u6001\u771F\u5B9E\u6570\u636E\uFF1A

- donut
- bar
- radial

\u4E0D\u80FD\u7528\u5047\u6BD4\u4F8B\u3002

### \u4FE1\u606F\u69FD

1. \`DOMINANT\`
2. \`UNDER-REPRESENTED\`
3. \`BALANCE NOTE\`

### Locked Preview

> \u4E00\u9875\u770B\u6E05\u4E94\u884C\u7684\u5B9E\u9645\u5206\u5E03\uFF0C\u4EE5\u53CA\u54EA\u4E9B\u5143\u7D20\u503C\u5F97\u8FDB\u4E00\u6B65\u89C2\u5BDF\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-bazi-blueprint.md",role:"FIVE_ELEMENT_DISTRIBUTION",master:"M05"},{pageNumber:10,title:{"zh-Hans":"\u4E94\u884C\u5173\u7CFB\u7F51\u7EDC",en:"FIVE ELEMENT RELATIONSHIPS"},sourceText:`# 09\uFF5C\u4E94\u884C\u5173\u7CFB\u7F51\u7EDC
## FIVE ELEMENT RELATIONSHIPS

**\u72B6\u6001\uFF1A** \`LOCKED\`

### \u5BA2\u6237\u95EE\u9898
> \u5143\u7D20\u4E4B\u95F4\u662F\u5728\u652F\u6301\u3001\u6D88\u8017\u3001\u7275\u5236\u8FD8\u662F\u8F6C\u5316\uFF1F

### \u4E3B\u89C6\u89C9
Network / directed relationship diagram\uFF1A

\`\`\`text
WOOD
FIRE
EARTH
METAL
WATER
\`\`\`

\u4EE5\u771F\u5B9E\u751F\u514B\u5173\u7CFB\u548C\u5BA2\u6237\u7ED3\u6784\u6620\u5C04\u3002

### \u4FE1\u606F\u69FD

1. \`SUPPORT\`
2. \`TENSION\`
3. \`FLOW\`

### Locked Preview

> \u4E0D\u53EA\u770B\u201C\u54EA\u4E00\u79CD\u5143\u7D20\u591A\u201D\uFF0C\u800C\u662F\u770B\u5B83\u4EEC\u4E4B\u95F4\u5982\u4F55\u76F8\u4E92\u4F5C\u7528\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-bazi-blueprint.md",role:"FIVE_ELEMENT_RELATIONSHIPS",master:"M05"},{pageNumber:11,title:{"zh-Hans":"\u7ED3\u6784\u5E73\u8861\u4E0E\u5F20\u529B",en:"STRUCTURAL BALANCE & TENSION"},sourceText:`# 10\uFF5C\u7ED3\u6784\u5E73\u8861\u4E0E\u5F20\u529B
## STRUCTURAL BALANCE & TENSION

**\u72B6\u6001\uFF1A** \`LOCKED\`

### \u5BA2\u6237\u95EE\u9898
> \u6211\u7684\u516B\u5B57\u7ED3\u6784\u4E2D\uFF0C\u54EA\u91CC\u8F83\u7A33\u5B9A\uFF0C\u54EA\u91CC\u66F4\u5BB9\u6613\u51FA\u73B0\u5F20\u529B\uFF1F

### \u4E3B\u89C6\u89C9
Split Matrix\uFF1A

\`\`\`text
SUPPORT
BALANCE
TENSION
OPEN
\`\`\`

### \u4FE1\u606F\u69FD

1. \`STABLE STRUCTURE\`
2. \`TENSION\`
3. \`CONDITION\`

### Locked Preview

> \u628A\u652F\u6301\u4E0E\u5F20\u529B\u653E\u5728\u540C\u4E00\u5F20\u56FE\u91CC\uFF0C\u770B\u89C1\u7ED3\u6784\u771F\u6B63\u7684\u91CD\u70B9\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-bazi-blueprint.md",role:"STRUCTURAL_BALANCE_TENSION",master:"M05"},{pageNumber:12,title:{"zh-Hans":"\u4E3B\u8981\u547D\u5C40\u6A21\u5F0F",en:"PRIMARY STRUCTURAL PATTERN"},sourceText:`# 11\uFF5C\u4E3B\u8981\u547D\u5C40\u6A21\u5F0F
## PRIMARY STRUCTURAL PATTERN

**\u72B6\u6001\uFF1A** \`LOCKED\`

### \u5BA2\u6237\u95EE\u9898
> \u6574\u4F53\u547D\u5C40\u6700\u91CD\u8981\u7684\u7EC4\u7EC7\u6A21\u5F0F\u662F\u4EC0\u4E48\uFF1F

### \u4E3B\u89C6\u89C9
\u4E0D\u8981\u505A\u6587\u7AE0\u3002

\u5EFA\u8BAE\uFF1A

\`\`\`text
CENTER
PRIMARY PATTERN

\u5468\u56F4\uFF1A
Support
Pressure
Resource
Output
Relation
Timing
\`\`\`

### \u4FE1\u606F\u69FD

1. \`PRIMARY PATTERN\`
2. \`WHY IT MATTERS\`
3. \`WHAT TO OBSERVE\`

### Locked Preview

> \u4ECE\u5206\u6563\u7684\u5143\u7D20\u5173\u7CFB\u4E2D\uFF0C\u63D0\u53D6\u6574\u5957\u7ED3\u6784\u6700\u503C\u5F97\u5173\u6CE8\u7684\u4E3B\u6A21\u5F0F\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-bazi-blueprint.md",role:"PRIMARY_STRUCTURAL_PATTERN",master:"M04"},{pageNumber:13,title:{"zh-Hans":"\u6B21\u7EA7\u6A21\u5F0F\u4E0E\u6761\u4EF6",en:"SECONDARY PATTERNS & CONDITIONS"},sourceText:`# 12\uFF5C\u6B21\u7EA7\u6A21\u5F0F\u4E0E\u6761\u4EF6
## SECONDARY PATTERNS & CONDITIONS

**\u72B6\u6001\uFF1A** \`LOCKED\`

### \u5BA2\u6237\u95EE\u9898
> \u9664\u4E86\u4E3B\u6A21\u5F0F\uFF0C\u8FD8\u6709\u54EA\u4E9B\u7ED3\u6784\u53EA\u4F1A\u5728\u7279\u5B9A\u6761\u4EF6\u4E0B\u53D8\u5F97\u91CD\u8981\uFF1F

### \u4E3B\u89C6\u89C9
Conditional Cards\uFF1A

\`\`\`text
PATTERN A
when...

PATTERN B
when...

PATTERN C
when...
\`\`\`

### \u4FE1\u606F\u69FD

\u6700\u591A 3 \u4E2A\u6B21\u7EA7\u6A21\u5F0F\u3002

### Locked Preview

> \u6709\u4E9B\u4E3B\u9898\u5E76\u4E0D\u662F\u4E00\u76F4\u663E\u73B0\uFF0C\u800C\u662F\u5728\u7279\u5B9A\u6761\u4EF6\u6216\u9636\u6BB5\u4E0B\u88AB\u653E\u5927\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-bazi-blueprint.md",role:"SECONDARY_PATTERNS_CONDITIONS",master:"M04"},{pageNumber:14,title:{"zh-Hans":"\u4F60\u7684\u53EF\u7528\u4F18\u52BF\u4E0E\u8D44\u6E90",en:"AVAILABLE STRENGTHS & RESOURCES"},sourceText:`# 13\uFF5C\u4F60\u7684\u53EF\u7528\u4F18\u52BF\u4E0E\u8D44\u6E90
## AVAILABLE STRENGTHS & RESOURCES

**\u72B6\u6001\uFF1A** \`LOCKED\`

### \u5BA2\u6237\u95EE\u9898
> \u8FD9\u5957\u7ED3\u6784\u91CC\uFF0C\u54EA\u4E9B\u90E8\u5206\u53EF\u4EE5\u6210\u4E3A\u53EF\u4F7F\u7528\u7684\u8D44\u6E90\uFF1F

### \u4E3B\u89C6\u89C9
Ranked Resource Cards \u6216 capability map\u3002

### \u4FE1\u606F\u69FD

1. \`AVAILABLE RESOURCE\`
2. \`WHEN IT HELPS\`
3. \`LIMIT\`

\u6CE8\u610F\u4E0D\u80FD\u5199\u6210\uFF1A

> \u4F60\u5929\u751F\u5F88\u6709\u94B1 / \u4F60\u5929\u751F\u5F88\u806A\u660E\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-bazi-blueprint.md",role:"AVAILABLE_STRENGTHS_RESOURCES",master:"M04"},{pageNumber:15,title:{"zh-Hans":"\u7ED3\u6784\u538B\u529B\u4E0E\u6469\u64E6",en:"STRUCTURAL PRESSURE & FRICTION"},sourceText:`# 14\uFF5C\u7ED3\u6784\u538B\u529B\u4E0E\u6469\u64E6
## STRUCTURAL PRESSURE & FRICTION

**\u72B6\u6001\uFF1A** \`LOCKED\`

### \u5BA2\u6237\u95EE\u9898
> \u54EA\u4E9B\u7ED3\u6784\u5728\u67D0\u4E9B\u6761\u4EF6\u4E0B\u4F1A\u589E\u52A0\u8FD0\u884C\u6210\u672C\uFF1F

### \u4E3B\u89C6\u89C9
Pressure / Friction Map\u3002

### \u4FE1\u606F\u69FD

1. \`PRESSURE\`
2. \`TRIGGER CONDITION\`
3. \`OBSERVABLE SIGNAL\`

### Locked Preview

> \u770B\u89C1\u54EA\u4E9B\u6A21\u5F0F\u672C\u8EAB\u4E0D\u662F\u201C\u574F\u201D\uFF0C\u4F46\u5728\u7279\u5B9A\u6761\u4EF6\u4E0B\u4F1A\u589E\u52A0\u6210\u672C\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-bazi-blueprint.md",role:"STRUCTURAL_PRESSURE_FRICTION",master:"M04"},{pageNumber:16,title:{"zh-Hans":"\u81EA\u6211\u4E0E\u65B9\u5411",en:"SELF & DIRECTION"},sourceText:`# 15\uFF5C\u81EA\u6211\u4E0E\u65B9\u5411
## SELF & DIRECTION

**\u72B6\u6001\uFF1A** \`LOCKED\`

### \u5BA2\u6237\u95EE\u9898
> \u8FD9\u5957\u516B\u5B57\u7ED3\u6784\u5982\u4F55\u63CF\u8FF0\u6211\u7684\u81EA\u6211\u7EC4\u7EC7\u4E0E\u65B9\u5411\u4E3B\u9898\uFF1F

### \u4E3B\u89C6\u89C9
Domain map\uFF1A

\`\`\`text
SELF
DIRECTION
DECISION
EXPRESSION
\`\`\`

\u53EA\u4ECE\u5DF2\u51C6\u5165 claim \u91CC\u53D6\u3002

### \u4FE1\u606F\u69FD

1. \`SELF\`
2. \`DIRECTION\`
3. \`CONDITION\`

---`,sourcePath:"docs/guided-report-successor-r1/reference-bazi-blueprint.md",role:"SELF_DIRECTION",master:"M06"},{pageNumber:17,title:{"zh-Hans":"\u5173\u7CFB\u7ED3\u6784",en:"RELATIONSHIPS"},sourceText:`# 16\uFF5C\u5173\u7CFB\u7ED3\u6784
## RELATIONSHIPS

**\u72B6\u6001\uFF1A** \`LOCKED\`

### \u5BA2\u6237\u95EE\u9898
> \u516B\u5B57\u4ECE\u4EC0\u4E48\u89D2\u5EA6\u63CF\u8FF0\u5173\u7CFB\u4E2D\u7684\u7ED3\u6784\u4E0E\u4E92\u52A8\uFF1F

### \u4E3B\u89C6\u89C9
Relationship Matrix\uFF1A

\`\`\`text
SELF
PARTNER
FAMILY
SOCIAL
BOUNDARY
\`\`\`

\u4E0D\u8981\u9884\u6D4B\u5A5A\u59FB\u7ED3\u679C\u3002

### \u4FE1\u606F\u69FD

1. \`RELATION PATTERN\`
2. \`TENSION / SUPPORT\`
3. \`WHAT TO OBSERVE\`

---`,sourcePath:"docs/guided-report-successor-r1/reference-bazi-blueprint.md",role:"RELATIONSHIPS",master:"M06"},{pageNumber:18,title:{"zh-Hans":"\u4E8B\u4E1A\u4E0E\u5DE5\u4F5C\u7ED3\u6784",en:"CAREER & WORK"},sourceText:`# 17\uFF5C\u4E8B\u4E1A\u4E0E\u5DE5\u4F5C\u7ED3\u6784
## CAREER & WORK

**\u72B6\u6001\uFF1A** \`LOCKED\`

### \u5BA2\u6237\u95EE\u9898
> \u6211\u7684\u7ED3\u6784\u4E2D\uFF0C\u54EA\u4E9B\u6A21\u5F0F\u4E0E\u5DE5\u4F5C\u3001\u8F93\u51FA\u3001\u8D23\u4EFB\u6216\u65B9\u5411\u6709\u5173\uFF1F

### \u4E3B\u89C6\u89C9
Career Structure Map\uFF1A

\`\`\`text
INPUT
\u2193
WORK STYLE
\u2193
OUTPUT
\u2193
RESPONSIBILITY
\u2193
DIRECTION
\`\`\`

### \u4FE1\u606F\u69FD

1. \`WORK PATTERN\`
2. \`AVAILABLE STRENGTH\`
3. \`FRICTION\`

---`,sourcePath:"docs/guided-report-successor-r1/reference-bazi-blueprint.md",role:"CAREER_WORK",master:"M06"},{pageNumber:19,title:{"zh-Hans":"\u8D44\u6E90\u4E0E\u8D22\u5BCC\u7ED3\u6784",en:"RESOURCES & MONEY"},sourceText:`# 18\uFF5C\u8D44\u6E90\u4E0E\u8D22\u5BCC\u7ED3\u6784
## RESOURCES & MONEY

**\u72B6\u6001\uFF1A** \`LOCKED\`

### \u5BA2\u6237\u95EE\u9898
> \u516B\u5B57\u5982\u4F55\u63CF\u8FF0\u8D44\u6E90\u6D41\u52A8\uFF0C\u800C\u4E0D\u662F\u7B80\u5355\u56DE\u7B54\u201C\u8D22\u8FD0\u597D\u4E0D\u597D\u201D\uFF1F

### \u4E3B\u89C6\u89C9
Resource Flow\uFF1A

\`\`\`text
INPUT
RESOURCE
HOLDING
OUTPUT
RISK
\`\`\`

### \u4FE1\u606F\u69FD

1. \`RESOURCE PATTERN\`
2. \`CONDITION\`
3. \`RISK / OPPORTUNITY\`

\u5FC5\u987B\u907F\u514D\uFF1A

> \u4E00\u5B9A\u53D1\u8D22 / \u4E00\u5B9A\u7834\u8D22\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-bazi-blueprint.md",role:"RESOURCES_MONEY",master:"M06"},{pageNumber:20,title:{"zh-Hans":"\u65F6\u95F4\u7ED3\u6784",en:"TIMING ARCHITECTURE"},sourceText:`# 19\uFF5C\u65F6\u95F4\u7ED3\u6784
## TIMING ARCHITECTURE

**\u72B6\u6001\uFF1A** \`LOCKED\`

### \u5BA2\u6237\u95EE\u9898
> \u6211\u7684\u516B\u5B57\u5982\u4F55\u7EC4\u7EC7\u4E0D\u540C\u9636\u6BB5\u7684\u65F6\u95F4\u53D8\u5316\uFF1F

### \u4E3B\u89C6\u89C9
Long timeline\uFF1A

\`\`\`text
BASE STRUCTURE
\u2193
PERIODS
\u2193
SELECTED WINDOW
\`\`\`

### \u4FE1\u606F\u69FD

1. \`CURRENT POSITION\`
2. \`EMPHASIZED THEME\`
3. \`BOUNDARY\`

---`,sourcePath:"docs/guided-report-successor-r1/reference-bazi-blueprint.md",role:"TIMING_ARCHITECTURE",master:"M07"},{pageNumber:21,title:{"zh-Hans":"\u5F53\u524D\uFF0F\u9009\u5B9A\u5468\u671F",en:"CURRENT / SELECTED PERIOD"},sourceText:`# 20\uFF5C\u5F53\u524D\uFF0F\u9009\u5B9A\u5468\u671F
## CURRENT / SELECTED PERIOD

**\u72B6\u6001\uFF1A** \`CONDITIONAL + LOCKED\`

\u53EA\u6709\u771F\u5B9E timing authority \u5B58\u5728\u624D\u51FA\u73B0\u3002

### \u5BA2\u6237\u95EE\u9898
> \u5F53\u524D\u8FD9\u4E2A\u9636\u6BB5\uFF0C\u54EA\u4E9B\u7ED3\u6784\u4E3B\u9898\u66F4\u503C\u5F97\u89C2\u5BDF\uFF1F

### \u4E3B\u89C6\u89C9
Period Focus Dashboard\u3002

### \u4FE1\u606F\u69FD

1. \`ACTIVE EMPHASIS\`
2. \`POSSIBLE TENSION\`
3. \`OBSERVE\`

\u5982\u679C\u6CA1\u6709 timing authority\uFF1A

**\u6574\u9875\u6291\u5236\u3002**

\u7EDD\u5BF9\u4E0D\u8981\u7528 generic \u6D41\u5E74\u6587\u6848\u586B\u8865\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-bazi-blueprint.md",role:"CURRENT_SELECTED_PERIOD",master:"M07"},{pageNumber:22,title:{"zh-Hans":"\u5F53\u524D\u73B0\u5B9E\u6BD4\u8F83",en:"CURRENT REALITY COMPARISON"},sourceText:`# 21\uFF5C\u5F53\u524D\u73B0\u5B9E\u6BD4\u8F83
## CURRENT REALITY COMPARISON

**\u72B6\u6001\uFF1A** \`CONDITIONAL + LOCKED\`

\u4EC5\u5F53\u6709 Current Reality evidence\u3002

### \u5BA2\u6237\u95EE\u9898
> \u51FA\u751F\u7ED3\u6784\u4E0E\u6211\u73B0\u5728\u771F\u5B9E\u7ECF\u5386\u7684\u73B0\u5B9E\uFF0C\u6709\u54EA\u4E9B\u4E00\u81F4\u3001\u90E8\u5206\u4E00\u81F4\u6216\u4E0D\u4E00\u81F4\uFF1F

### \u4E3B\u89C6\u89C9
Split Compare\uFF1A

\`\`\`text
BAZI BASELINE
        VS
CURRENT REALITY
\`\`\`

\u72B6\u6001\u6CBF\u73B0\u6709 shared authority\uFF1A

\`\`\`text
CURRENTLY_RESONANT
PARTIALLY_RESONANT
CURRENTLY_NOT_RESONANT
OPEN
\`\`\`

### \u4FE1\u606F\u69FD

1. \`BASELINE\`
2. \`CURRENT EVIDENCE\`
3. \`COMPARISON\`

---`,sourcePath:"docs/guided-report-successor-r1/reference-bazi-blueprint.md",role:"CURRENT_REALITY_COMPARISON",master:"M07"},{pageNumber:23,title:{"zh-Hans":"\u53EF\u89C2\u5BDF\u8BAF\u53F7",en:"OBSERVABLE SIGNALS"},sourceText:`# 22\uFF5C\u53EF\u89C2\u5BDF\u8BAF\u53F7
## OBSERVABLE SIGNALS

**\u72B6\u6001\uFF1A** \`LOCKED\`

### \u5BA2\u6237\u95EE\u9898
> \u6211\u53EF\u4EE5\u5728\u73B0\u5B9E\u4E2D\u89C2\u5BDF\u4EC0\u4E48\uFF0C\u6765\u5224\u65AD\u8FD9\u4E9B\u89E3\u91CA\u662F\u5426\u771F\u6B63\u51FA\u73B0\uFF1F

### \u4E3B\u89C6\u89C9
Signal Cards\uFF1A

\`\`\`text
WHEN...
WATCH FOR...
COUNTER-SIGNAL...
\`\`\`

### \u4FE1\u606F\u69FD
\u6700\u591A 3 \u6761\u9AD8\u4EF7\u503C\u8BAF\u53F7\u3002

\u4F8B\u5982\u7ED3\u6784\u4E0A\u5E94\u8BE5\u662F\uFF1A

> \u5F53 X \u6761\u4EF6\u51FA\u73B0\u65F6\uFF0C\u89C2\u5BDF Y \u662F\u5426\u968F\u4E4B\u51FA\u73B0\u3002

\u4E0D\u662F\uFF1A

> \u4F60\u4E00\u5B9A\u4F1A\u600E\u6837\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-bazi-blueprint.md",role:"OBSERVABLE_SIGNALS",master:"M08"},{pageNumber:24,title:{"zh-Hans":"\u673A\u4F1A\u4E0E\u98CE\u9669",en:"OPPORTUNITIES & RISKS"},sourceText:`# 23\uFF5C\u673A\u4F1A\u4E0E\u98CE\u9669
## OPPORTUNITIES & RISKS

**\u72B6\u6001\uFF1A** \`LOCKED\`

### \u5BA2\u6237\u95EE\u9898
> \u54EA\u4E9B\u7ED3\u6784\u5728\u5408\u9002\u6761\u4EF6\u4E0B\u53EF\u80FD\u6210\u4E3A\u673A\u4F1A\uFF0C\u800C\u5728\u54EA\u4E9B\u60C5\u51B5\u4E0B\u53EF\u80FD\u589E\u52A0\u98CE\u9669\uFF1F

### \u4E3B\u89C6\u89C9
Dual Panel\uFF1A

\`\`\`text
OPPORTUNITY
        |
        |
RISK
\`\`\`

\u4E0D\u662F\u201C\u5409\u51F6\u9875\u201D\u3002

### \u4FE1\u606F\u69FD

1. \`OPPORTUNITY\`
2. \`RISK\`
3. \`CONDITION\`

---`,sourcePath:"docs/guided-report-successor-r1/reference-bazi-blueprint.md",role:"OPPORTUNITIES_RISKS",master:"M08"},{pageNumber:25,title:{"zh-Hans":"\u73B0\u5B9E\u5BFC\u822A",en:"REALITY NAVIGATION"},sourceText:`# 24\uFF5C\u73B0\u5B9E\u5BFC\u822A
## REALITY NAVIGATION

**\u72B6\u6001\uFF1A** \`LOCKED\`

### \u5BA2\u6237\u95EE\u9898
> \u770B\u5B8C\u8FD9\u4E9B\u7ED3\u6784\u4E4B\u540E\uFF0C\u6211\u63A5\u4E0B\u6765\u6700\u503C\u5F97\u89C2\u5BDF\u4EC0\u4E48\uFF1F

### \u4E3B\u89C6\u89C9
3-step path\uFF1A

\`\`\`text
NOTICE
\u89C2\u5BDF

COMPARE
\u6BD4\u8F83

ADJUST
\u8C03\u6574
\`\`\`

\u6216\u8005\uFF1A

\`\`\`text
STRUCTURE
\u2193
REALITY
\u2193
NEXT OBSERVATION
\`\`\`

### \u4FE1\u606F\u69FD

1. \`OBSERVE\`
2. \`COMPARE\`
3. \`NEXT QUESTION\`

\u4E0D\u662F\uFF1A

> \u4F60\u5E94\u8BE5\u8F9E\u804C / \u4F60\u5E94\u8BE5\u7ED3\u5A5A / \u4F60\u5E94\u8BE5\u6295\u8D44\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-bazi-blueprint.md",role:"REALITY_NAVIGATION",master:"M08"},{pageNumber:26,title:{"zh-Hans":"\u4E3A\u4EC0\u4E48\u8FD9\u6837\u8BF4 + \u65B9\u6CD5\u8FB9\u754C",en:"EVIDENCE, BOUNDARY & CLOSING"},sourceText:`# 25\uFF5C\u4E3A\u4EC0\u4E48\u8FD9\u6837\u8BF4 + \u65B9\u6CD5\u8FB9\u754C
## EVIDENCE, BOUNDARY & CLOSING

**\u72B6\u6001\uFF1A** \`OPEN IN WEB SUMMARY / FULL IN PAID\`

\u8FD9\u91CC\u6211\u5EFA\u8BAE\u628A\u539F\u672C\u7B2C 24 Evidence \u4E0E\u7B2C 25 Boundary \u5408\u5E76\u6210\u4E00\u4E2A\u975E\u5E38\u9AD8\u7EA7\u7684 closing page\u3002

### \u5BA2\u6237\u95EE\u9898
> \u8FD9\u4E9B\u7ED3\u8BBA\u6765\u81EA\u54EA\u91CC\uFF1F\u54EA\u4E9B\u5730\u65B9\u8FD8\u4E0D\u80FD\u786E\u5B9A\uFF1F

### \u4E3B\u89C6\u89C9
Evidence Lineage\uFF1A

\`\`\`text
Birth Input
\u2193
BaZi Calculation
\u2193
Canonical Projection
\u2193
Accepted Claims
\u2193
Interpretation
\u2193
Current Evidence
\u2193
Report
\`\`\`

\u65C1\u8FB9 4 \u4E2A\u72B6\u6001\uFF1A

\`\`\`text
CALCULATED
INTERPRETED
CURRENT EVIDENCE
OPEN
\`\`\`

### \u6700\u7EC8\u56FA\u5B9A Closing

\u4E2D\u6587\uFF1A

> \u8FD9\u4EFD\u516B\u5B57\u62A5\u544A\u63D0\u4F9B\u7684\u662F\u4E00\u79CD\u7ED3\u6784\u4E0E\u65F6\u95F4\u89C6\u89D2\uFF0C\u800C\u4E0D\u662F\u5BF9\u4F60\u4EBA\u751F\u7684\u6700\u7EC8\u5B9A\u4E49\u3002\u771F\u6B63\u6709\u4EF7\u503C\u7684\u90E8\u5206\uFF0C\u4E0D\u662F\u628A\u6240\u6709\u7ED3\u679C\u5F53\u6210\u7ED3\u8BBA\uFF0C\u800C\u662F\u77E5\u9053\u54EA\u4E9B\u7ED3\u6784\u503C\u5F97\u89C2\u5BDF\u3001\u54EA\u4E9B\u89E3\u91CA\u9700\u8981\u73B0\u5B9E\u9A8C\u8BC1\uFF0C\u4EE5\u53CA\u54EA\u4E9B\u95EE\u9898\u4ECD\u7136\u4FDD\u6301\u5F00\u653E\u3002

\u82F1\u6587\uFF1A

> This BaZi report offers one structured perspective on pattern and timing rather than a final definition of your life. Its value lies not in treating every result as a conclusion, but in seeing what deserves observation, what requires comparison with Reality, and what should remain open.

---`,sourcePath:"docs/guided-report-successor-r1/reference-bazi-blueprint.md",role:"EVIDENCE_BOUNDARY_CLOSING",master:"M08"}],humanReview:"PENDING",sourceRole:"USER_DESIGN_REFERENCE_NOT_NEW_METHOD_MEANING"},{methodId:"AST",sourceConversation:"6aaa576d-03bc-83ec-a176-5f8885313c6f",pages:[{pageNumber:1,title:{"zh-Hans":"\u5360\u661F\u5B8C\u6574\u62A5\u544A",en:"ASTROLOGY FULL REPORT"},sourceText:`## 01\uFF5C\u5360\u661F\u5B8C\u6574\u62A5\u544A
### ASTROLOGY FULL REPORT

**\u72B6\u6001\uFF1A\`OPEN\`**

### \u9875\u9762\u76EE\u6807
\u5EFA\u7ACB Astrology \u4EA7\u54C1\u8EAB\u4EFD\u3002

### \u4E3B\u89C6\u89C9
\u5EF6\u7EED \`COM-REPORT-ASTROLOGY-FULL\`\uFF1A

- natal wheel
- orbit lines
- planets
- aspects
- celestial blue
- gold
- ivory

\u4E0D\u663E\u793A\u4EF7\u683C\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-astrology.md",role:"ASTROLOGY_FULL_REPORT",master:"M01"},{pageNumber:2,title:{"zh-Hans":"\u4EC0\u4E48\u662F\u5360\u661F\uFF1F",en:"WHAT IS ASTROLOGY?"},sourceText:`# 02\uFF5C\u4EC0\u4E48\u662F\u5360\u661F\uFF1F
## WHAT IS ASTROLOGY?

**\u72B6\u6001\uFF1A\`OPEN\`**

### \u5BA2\u6237\u95EE\u9898
> \u5360\u661F\u5B9E\u9645\u4E0A\u5728\u8BFB\u53D6\u4EC0\u4E48\uFF1F

### \u56FA\u5B9A\u526F\u6807\u9898

**\u4ECE\u51FA\u751F\u65F6\u523B\u7684\u5929\u4F53\u4F4D\u7F6E\uFF0C\u5EFA\u7ACB\u4E00\u5F20\u7ED3\u6784\u3001\u5173\u7CFB\u4E0E\u65F6\u95F4\u5730\u56FE\u3002**

**A structural map of planetary positions, relationships, and timing derived from the birth moment.**

### \u4E2D\u6587\u56FA\u5B9A\u7A3F

\u5360\u661F\u4EE5\u51FA\u751F\u65E5\u671F\u3001\u65F6\u95F4\u4E0E\u5730\u70B9\u8BA1\u7B97\u7279\u5B9A\u65F6\u523B\u7684\u5929\u4F53\u4F4D\u7F6E\uFF0C\u5E76\u628A\u884C\u661F\u3001\u661F\u5EA7\u3001\u5BAB\u4F4D\u4E0E\u76F8\u4F4D\u7EC4\u7EC7\u6210\u4E00\u5F20\u672C\u547D\u76D8\u3002\u5B83\u5173\u6CE8\u7684\u4E0D\u53EA\u662F\u67D0\u4E00\u9897\u884C\u661F\u201C\u4EE3\u8868\u4EC0\u4E48\u201D\uFF0C\u800C\u662F\u4E0D\u540C\u4F4D\u7F6E\u4E4B\u95F4\u600E\u6837\u5171\u540C\u6784\u6210\u4E00\u5957\u7ED3\u6784\uFF1A\u54EA\u4E9B\u4E3B\u9898\u88AB\u5F3A\u8C03\uFF0C\u54EA\u4E9B\u9886\u57DF\u5F7C\u6B64\u8FDE\u63A5\uFF0C\u54EA\u4E9B\u5173\u7CFB\u5F62\u6210\u652F\u6301\u3001\u5F20\u529B\u6216\u91CD\u590D\u6A21\u5F0F\u3002

\u672C\u547D\u76D8\u63D0\u4F9B\u7684\u662F\u4E00\u4E2A\u51FA\u751F\u65F6\u523B\u7684\u7ED3\u6784\u6295\u5F71\uFF1B\u540E\u7EED\u5468\u671F\u4E0E\u884C\u8FD0\uFF0C\u5219\u7528\u6765\u89C2\u5BDF\u4E0D\u540C\u65F6\u95F4\u9636\u6BB5\u4E2D\uFF0C\u54EA\u4E9B\u539F\u6709\u4E3B\u9898\u53EF\u80FD\u53D7\u5230\u8FDB\u4E00\u6B65\u5F3A\u8C03\u3002\u5360\u661F\u56E0\u6B64\u53EF\u4EE5\u63D0\u4F9B\u5173\u4E8E\u81EA\u6211\u3001\u5173\u7CFB\u3001\u5DE5\u4F5C\u3001\u8D44\u6E90\u3001\u65B9\u5411\u4E0E\u65F6\u95F4\u53D8\u5316\u7684\u89C6\u89D2\uFF0C\u4F46\u5B83\u5E76\u4E0D\u80FD\u5355\u72EC\u8BC1\u660E\u4E00\u4E2A\u4EBA\u7684\u73B0\u5B9E\u4E00\u5B9A\u4F1A\u600E\u6837\u53D1\u5C55\u3002

### English fixed copy

Astrology calculates the positions of celestial bodies from the date, time, and place of birth and organizes planets, signs, houses, and aspects into a natal chart. Its purpose is not simply to assign a meaning to each planet in isolation, but to examine how positions and relationships combine into a larger structure: what is emphasized, which life areas connect, and where support, tension, or recurring patterns appear.

The natal chart is a projection of the birth moment. Timing techniques can then be used to examine how certain themes may become more emphasized during particular periods. Astrology can therefore offer a perspective on self, relationships, work, resources, direction, and change over time, but it does not by itself prove that a person's Reality must unfold in a particular way.

### \u4E3B\u89C6\u89C9

\`\`\`text
Birth Data
\u2193
Planetary Positions
\u2193
Signs
+
Houses
+
Aspects
\u2193
Natal Chart
\u2193
Timing Layers
\`\`\`

---`,sourcePath:"docs/guided-report-successor-r1/reference-astrology.md",role:"WHAT_IS_ASTROLOGY",master:"M02"},{pageNumber:3,title:{"zh-Hans":"\u4E3A\u4EC0\u4E48\u5360\u661F\u4F1A\u4F20\u627F\u81F3\u4ECA\uFF1F",en:"WHY HAS ASTROLOGY ENDURED?"},sourceText:`Source conversation: https://chatgpt.com/c/6aaa576d-03bc-83ec-a176-5f8885313c6f
Source turn: de93fabd-a669-4019-9563-81ef17d622db
Reference material; current task attachment and latest user corrections take precedence.

\u7EE7\u7EED\u3002\u5148\u628A **\u516B\u5B57\u7684 Origin & Continuity \u56FA\u5B9A\u9875**\u5B8C\u6210\uFF0C\u518D\u628A **Astrology \u7684\u540C\u7C7B\u56FA\u5B9A\u9875**\u4E00\u8D77\u51BB\u7ED3\uFF0C\u8FD9\u6837\u6211\u4EEC\u5C31\u5F00\u59CB\u5EFA\u7ACB 8 \u79CD\u62A5\u544A\u5171\u540C\u7684\u7B2C\u4E09\u9875\u6807\u51C6\u3002

---

# BAZI-03\uFF5C\u4E3A\u4EC0\u4E48\u516B\u5B57\u4F1A\u4F20\u627F\u81F3\u4ECA\uFF1F
## WHY HAS BAZI ENDURED?

### \u9875\u9762\u89D2\u8272
\`METHOD_ORIGIN_CONTINUITY\`

### \u9875\u9762\u72B6\u6001
\`FIXED_CANONICAL_CONTENT\`

\u6240\u6709\u5BA2\u6237\u5171\u7528\uFF0C\u4E0D\u8C03\u7528 OpenAI \u52A8\u6001\u91CD\u5199\u3002

### \u56FA\u5B9A\u6807\u9898

**\u4E3A\u4EC0\u4E48\u516B\u5B57\u4F1A\u4F20\u627F\u81F3\u4ECA\uFF1F**  
**WHY HAS BAZI ENDURED?**

### \u56FA\u5B9A\u526F\u6807\u9898

**\u5B83\u7ECF\u5386\u4E86\u957F\u671F\u6574\u7406\u3001\u89E3\u91CA\u4E0E\u5B9E\u8DF5\uFF0C\u9010\u6E10\u5F62\u6210\u4E00\u5957\u4EE5\u51FA\u751F\u65F6\u95F4\u89C2\u5BDF\u7ED3\u6784\u4E0E\u53D8\u5316\u7684\u8BED\u8A00\u3002**

**It endured through centuries of refinement, interpretation, and practice as a structured language for examining birth patterns and change over time.**

---

## \u4E2D\u6587\u56FA\u5B9A\u6B63\u6587

\u516B\u5B57\u5E76\u4E0D\u662F\u5728\u67D0\u4E00\u4E2A\u65F6\u523B\u7A81\u7136\u5B8C\u6210\u7684\u4F53\u7CFB\u3002\u5B83\u5EFA\u7ACB\u5728\u4E2D\u56FD\u957F\u671F\u4F7F\u7528\u5E72\u652F\u7EAA\u5E74\u3001\u5386\u6CD5\u3001\u9634\u9633\u4E0E\u4E94\u884C\u5173\u7CFB\u6765\u7EC4\u7EC7\u65F6\u95F4\u548C\u53D8\u5316\u7684\u4F20\u7EDF\u4E4B\u4E0A\uFF0C\u540E\u6765\u9010\u6E10\u53D1\u5C55\u51FA\u4EE5\u51FA\u751F\u5E74\u3001\u6708\u3001\u65E5\u3001\u65F6\u5EFA\u7ACB\u56DB\u67F1\uFF0C\u5E76\u901A\u8FC7\u5E72\u652F\u3001\u4E94\u884C\u3001\u5B63\u8282\u4E0E\u65F6\u95F4\u5468\u671F\u8FDB\u884C\u7ED3\u6784\u8BFB\u53D6\u7684\u65B9\u6CD5\u3002

\u968F\u7740\u4E0D\u540C\u65F6\u4EE3\u7684\u6574\u7406\u4E0E\u4F20\u627F\uFF0C\u516B\u5B57\u7684\u672F\u8BED\u3001\u5224\u65AD\u89C4\u5219\u4E0E\u6D41\u6D3E\u4E0D\u65AD\u53D1\u5C55\uFF0C\u540C\u4E00\u4E2A\u7ED3\u6784\u4E5F\u53EF\u80FD\u51FA\u73B0\u4E0D\u540C\u89E3\u91CA\u3002\u5B83\u4E4B\u6240\u4EE5\u80FD\u591F\u957F\u671F\u5EF6\u7EED\uFF0C\u5E76\u4E0D\u53EA\u662F\u56E0\u4E3A\u201C\u5386\u53F2\u60A0\u4E45\u201D\uFF0C\u800C\u662F\u56E0\u4E3A\u56DB\u67F1\u3001\u4E94\u884C\u3001\u5B63\u8282\u4E0E\u65F6\u95F4\u4E4B\u95F4\u5F62\u6210\u4E86\u4E00\u5957\u53EF\u4EE5\u91CD\u590D\u8BA1\u7B97\u3001\u8BB0\u5F55\u3001\u6BD4\u8F83\u4E0E\u8BA8\u8BBA\u7684\u7ED3\u6784\u8BED\u8A00\uFF0C\u4F7F\u4E0D\u540C\u4E16\u4EE3\u7684\u4EBA\u80FD\u591F\u7EE7\u7EED\u5728\u540C\u4E00\u5957\u6846\u67B6\u4E2D\u63D0\u51FA\u5173\u4E8E\u5173\u7CFB\u3001\u8D44\u6E90\u3001\u9636\u6BB5\u4E0E\u53D8\u5316\u7684\u95EE\u9898\u3002

\u957F\u671F\u4F20\u627F\u8BF4\u660E\u516B\u5B57\u5177\u6709\u6301\u7EED\u7684\u6587\u5316\u4E0E\u89E3\u91CA\u4EF7\u503C\uFF0C\u4F46\u5E76\u4E0D\u610F\u5473\u7740\u6BCF\u4E00\u4E2A\u4F20\u7EDF\u5224\u65AD\u90FD\u56E0\u6B64\u6210\u4E3A\u7ECF\u8FC7\u73B0\u4EE3\u5B9E\u8BC1\u9A8C\u8BC1\u7684\u4E8B\u5B9E\u3002\u4ECA\u5929\u4F7F\u7528\u516B\u5B57\uFF0C\u66F4\u91CD\u8981\u7684\u662F\u5206\u6E05\u54EA\u4E9B\u5C5E\u4E8E\u8BA1\u7B97\u7ED3\u6784\u3001\u54EA\u4E9B\u5C5E\u4E8E\u5386\u53F2\u5F62\u6210\u7684\u89E3\u91CA\uFF0C\u4EE5\u53CA\u8FD9\u4E9B\u89E3\u91CA\u662F\u5426\u771F\u7684\u80FD\u591F\u5728\u73B0\u5B9E\u4E2D\u88AB\u89C2\u5BDF\u548C\u68C0\u9A8C\u3002

---

## Fixed English Copy

BaZi did not emerge as a complete system at a single moment in history. It developed from long-standing Chinese traditions for organizing time through the sexagenary cycle, calendrical structure, yin\u2013yang relationships, and the Five Elements. Over time, these ideas were increasingly organized around the year, month, day, and hour of birth, forming the Four Pillars framework and its later approaches to structure and timing.

Across different periods, practitioners refined terminology, interpretive rules, and schools of reading. The same structural configuration can therefore be interpreted differently within different traditions. BaZi has endured not simply because it is old, but because the relationships among pillars, elements, seasons, and timing created a repeatable framework that could be calculated, recorded, compared, debated, and transmitted across generations.

Long transmission demonstrates enduring cultural and interpretive value. It does not, by itself, establish every traditional interpretation as an empirically verified fact. A contemporary reading should therefore distinguish calculated structure from inherited interpretation, and inherited interpretation from what can actually be observed in Reality.

---

# BAZI-03 \u4E3B\u89C6\u89C9
## \`BAZI HISTORY & CONTINUITY TIMELINE\`

\u4E0D\u8981\u753B\u671D\u4EE3\u767E\u79D1\uFF0C\u4E5F\u4E0D\u8981\u505A\u6EE1\u9875\u5386\u53F2\u6587\u5B57\u3002

\u5EFA\u8BAE\u7528 **6 \u4E2A\u5386\u53F2\u9636\u6BB5\u8282\u70B9**\uFF1A

\`\`\`text
TIME ORGANIZATION
\u65F6\u95F4\u7EC4\u7EC7
\u5E72\u652F / \u5386\u6CD5
        \u2193
YIN\u2013YANG & FIVE ELEMENTS
\u9634\u9633\u4E0E\u4E94\u884C
        \u2193
BIRTH-TIME STRUCTURE
\u51FA\u751F\u65F6\u95F4\u7ED3\u6784
        \u2193
FOUR PILLARS
\u56DB\u67F1\u4F53\u7CFB
        \u2193
SCHOOLS & INTERPRETATION
\u6D41\u6D3E\u4E0E\u89E3\u91CA
        \u2193
MODERN PRACTICE
\u73B0\u4EE3\u5B9E\u8DF5
\`\`\`

\u89C6\u89C9\u5E95\u5C42\u53EF\u4EE5\u662F\u4E00\u6761\u975E\u5E38\u7EC6\u7684\u65F6\u95F4\u5E26\uFF1A

\`\`\`text
Early calendrical traditions
\u2192 medieval systematization
\u2192 later textual traditions
\u2192 modern transmission
\`\`\`

\u4E0D\u9700\u8981\u5F3A\u884C\u585E\u7CBE\u786E\u5E74\u4EFD\u3002

---

## \u9875\u9762\u4E09\u4E2A\u56FA\u5B9A\u77E5\u8BC6\u5757

### 01\uFF5C\u4E3A\u4EC0\u4E48\u5B83\u80FD\u591F\u6301\u7EED\uFF1F
**WHY DID IT CONTINUE?**

> \u56E0\u4E3A\u5B83\u63D0\u4F9B\u4E86\u4E00\u5957\u53EF\u91CD\u590D\u8BA1\u7B97\u3001\u8BB0\u5F55\u4E0E\u6BD4\u8F83\u7684\u7ED3\u6784\u8BED\u8A00\u3002

> Because it offered a structure that could be repeatedly calculated, recorded, and compared.

### 02\uFF5C\u4E3A\u4EC0\u4E48\u4F1A\u6709\u4E0D\u540C\u6D41\u6D3E\uFF1F
**WHY ARE THERE DIFFERENT SCHOOLS?**

> \u56E0\u4E3A\u957F\u671F\u4F20\u627F\u540C\u65F6\u610F\u5473\u7740\u89C4\u5219\u3001\u91CD\u70B9\u4E0E\u89E3\u91CA\u4E0D\u65AD\u88AB\u91CD\u65B0\u6574\u7406\u3002

> Long transmission also meant that rules, priorities, and interpretations continued to evolve.

### 03\uFF5C\u4ECA\u5929\u5E94\u8BE5\u600E\u6837\u770B\uFF1F
**HOW SHOULD WE READ IT TODAY?**

> \u4FDD\u7559\u7ED3\u6784\uFF0C\u7406\u89E3\u4F20\u7EDF\uFF0C\u540C\u65F6\u628A\u89E3\u91CA\u91CD\u65B0\u653E\u56DE\u73B0\u5B9E\u4E2D\u9A8C\u8BC1\u3002

> Preserve the structure, understand the tradition, and compare interpretation with Reality.

---

# BAZI \u5386\u53F2\u9875\u7684\u56FA\u5B9A\u8FB9\u754C

\u9875\u9762\u5E95\u90E8\u56FA\u5B9A\u4E00\u6761\uFF1A

> **\u957F\u671F\u4F20\u627F\u8BF4\u660E\u6301\u7EED\u7684\u6587\u5316\u4E0E\u89E3\u91CA\u4EF7\u503C\uFF0C\u4E0D\u7B49\u4E8E\u6BCF\u4E00\u4E2A\u4F20\u7EDF\u5224\u65AD\u90FD\u56E0\u6B64\u6210\u4E3A\u73B0\u4EE3\u5B9E\u8BC1\u4E8B\u5B9E\u3002**

\u82F1\u6587\uFF1A

> **Long transmission shows enduring cultural and interpretive value; it does not by itself validate every traditional claim as a modern empirical fact.**

\u8FD9\u4E00\u53E5\u4EE5\u540E Traditional Method \u90FD\u53EF\u4EE5\u6CBF\u7528\u601D\u60F3\uFF0C\u4F46\u4E0D\u8981\u673A\u68B0\u590D\u5236\u63AA\u8F9E\u3002

---

# \u73B0\u5728\u516B\u5B57\u524D\u516D\u9875\u6B63\u5F0F\u987A\u5E8F

\`\`\`text
01\uFF5CCOVER
\u516B\u5B57\u5B8C\u6574\u62A5\u544A

02\uFF5CWHAT IS BAZI?
\u4EC0\u4E48\u662F\u516B\u5B57\uFF1F

03\uFF5CWHY HAS BAZI ENDURED?
\u4E3A\u4EC0\u4E48\u516B\u5B57\u4F1A\u4F20\u627F\u81F3\u4ECA\uFF1F

04\uFF5CHOW DOES PHI OS USE BAZI?
PHI OS \u5982\u4F55\u770B\u5F85\u5E76\u4F7F\u7528\u516B\u5B57\uFF1F

05\uFF5CHOW TO READ THIS REPORT
\u5982\u4F55\u9605\u8BFB\u8FD9\u4EFD\u62A5\u544A\uFF1F

06\uFF5CYOUR BAZI SNAPSHOT
\u4F60\u7684\u516B\u5B57\u603B\u89C8
\`\`\`

\u539F\u672C\u7684\u4E2A\u4EBA\u9875\u9762\u5168\u90E8\u987A\u5EF6\u4E00\u9875\uFF0C\u6240\u4EE5\u6700\u7EC8\u516B\u5B57\u53D8\u6210 **26 \u9875 Premium Report**\u3002

---

# ASTROLOGY-03\uFF5C\u4E3A\u4EC0\u4E48\u5360\u661F\u4F1A\u4F20\u627F\u81F3\u4ECA\uFF1F
## WHY HAS ASTROLOGY ENDURED?

Astrology \u7684\u5386\u53F2\u9875\u53EF\u4EE5\u66F4\u4E30\u5BCC\uFF0C\u56E0\u4E3A\u5B83\u975E\u5E38\u9002\u5408\u753B\u4E00\u6761\u8DE8\u6587\u660E\u4F20\u64AD\u7EBF\u3002

### \u9875\u9762\u89D2\u8272
\`METHOD_ORIGIN_CONTINUITY\`

### \u56FA\u5B9A\u6807\u9898

**\u4E3A\u4EC0\u4E48\u5360\u661F\u4F1A\u4F20\u627F\u81F3\u4ECA\uFF1F**  
**WHY HAS ASTROLOGY ENDURED?**

### \u56FA\u5B9A\u526F\u6807\u9898

**\u5B83\u968F\u7740\u5929\u6587\u89C2\u5BDF\u3001\u6570\u5B66\u3001\u54F2\u5B66\u4E0E\u6587\u5316\u4EA4\u6D41\u4E0D\u65AD\u6539\u53D8\uFF0C\u5374\u4E00\u76F4\u4FDD\u7559\u7740\u4E00\u4E2A\u6838\u5FC3\u95EE\u9898\uFF1A\u5929\u7A7A\u4E2D\u7684\u5468\u671F\u80FD\u5426\u6210\u4E3A\u7406\u89E3\u65F6\u95F4\u4E0E\u4EBA\u7C7B\u7ECF\u9A8C\u7684\u4E00\u79CD\u8BED\u8A00\uFF1F**

**It changed through astronomy, mathematics, philosophy, and cultural exchange while preserving one persistent question: can celestial cycles offer a language for understanding time and human experience?**

---

## \u4E2D\u6587\u56FA\u5B9A\u6B63\u6587

\u5360\u661F\u7684\u5386\u53F2\u4E0D\u662F\u4E00\u6761\u7531\u5355\u4E00\u6587\u660E\u8FDE\u7EED\u4FDD\u5B58\u4E0B\u6765\u7684\u76F4\u7EBF\uFF0C\u800C\u662F\u4E00\u5957\u968F\u7740\u5929\u6587\u89C2\u5BDF\u3001\u5386\u6CD5\u3001\u6570\u5B66\u4E0E\u6587\u5316\u4EA4\u6D41\u4E0D\u65AD\u91CD\u7EC4\u7684\u4F20\u7EDF\u3002\u65E9\u671F\u8FD1\u4E1C\u793E\u4F1A\u5DF2\u7ECF\u957F\u671F\u8BB0\u5F55\u5929\u8C61\u4E0E\u65F6\u95F4\u53D8\u5316\uFF1B\u540E\u6765\uFF0C\u5E0C\u814A\u5316\u65F6\u671F\u9010\u6E10\u5F62\u6210\u4E86\u66F4\u63A5\u8FD1\u73B0\u4EE3\u672C\u547D\u5360\u661F\u7684\u7ED3\u6784\uFF0C\u628A\u884C\u661F\u3001\u9EC4\u9053\u3001\u5BAB\u4F4D\u4E0E\u51FA\u751F\u65F6\u523B\u7EC4\u7EC7\u5728\u540C\u4E00\u5F20\u56FE\u4E2D\u3002

\u8FD9\u4E9B\u77E5\u8BC6\u6B64\u540E\u901A\u8FC7\u4E0D\u540C\u8BED\u8A00\u3001\u5730\u533A\u4E0E\u5B66\u672F\u4F20\u7EDF\u7EE7\u7EED\u4F20\u64AD\uFF0C\u5728\u665A\u671F\u53E4\u5178\u4E16\u754C\u3001\u4F0A\u65AF\u5170\u5B66\u672F\u73AF\u5883\u3001\u4E2D\u4E16\u7EAA\u4E0E\u8FD1\u4EE3\u6B27\u6D32\u4EE5\u53CA\u540E\u6765\u7684\u73B0\u4EE3\u5360\u661F\u5B9E\u8DF5\u4E2D\u4E0D\u65AD\u88AB\u7FFB\u8BD1\u3001\u6574\u7406\u548C\u91CD\u65B0\u89E3\u91CA\u3002\u4ECA\u5929\u5E38\u89C1\u7684\u672C\u547D\u76D8\u3001\u5BAB\u4F4D\u3001\u76F8\u4F4D\u4E0E\u65F6\u95F4\u6280\u672F\uFF0C\u5E76\u4E0D\u662F\u67D0\u4E00\u4E2A\u65F6\u4EE3\u4E00\u6B21\u5B8C\u6210\u7684\uFF0C\u800C\u662F\u591A\u6B21\u77E5\u8BC6\u4F20\u9012\u4E0E\u91CD\u6784\u7684\u7ED3\u679C\u3002

\u5360\u661F\u4E4B\u6240\u4EE5\u6301\u7EED\u5B58\u5728\uFF0C\u4E00\u90E8\u5206\u539F\u56E0\u5728\u4E8E\u5B83\u628A\u590D\u6742\u7684\u5929\u4F53\u5468\u671F\u538B\u7F29\u6210\u4E00\u5957\u53EF\u89C6\u5316\u7ED3\u6784\uFF0C\u4F7F\u4EBA\u80FD\u591F\u8BA8\u8BBA\u65F6\u95F4\u3001\u5173\u7CFB\u3001\u4EBA\u751F\u9886\u57DF\u4E0E\u53D8\u5316\u3002\u5B83\u7684\u957F\u671F\u6587\u5316\u751F\u547D\u529B\u503C\u5F97\u7406\u89E3\uFF0C\u4F46\u957F\u671F\u6D41\u4F20\u672C\u8EAB\u5E76\u4E0D\u80FD\u8BC1\u660E\u661F\u76D8\u4E2D\u7684\u6BCF\u4E00\u4E2A\u89E3\u91CA\u90FD\u662F\u73B0\u4EE3\u79D1\u5B66\u610F\u4E49\u4E0A\u7684\u56E0\u679C\u4E8B\u5B9E\u3002

---

## Fixed English Copy

The history of astrology is not a single uninterrupted tradition preserved by one civilization. It developed through repeated interaction among astronomical observation, calendars, mathematics, philosophy, and cultural exchange. Ancient Near Eastern societies recorded celestial phenomena and their relation to time, while the Hellenistic period gradually produced structures closer to natal astrology as it is recognized today, bringing planets, the zodiac, houses, and the birth moment into a single chart.

These traditions were subsequently transmitted, translated, reorganized, and reinterpreted across late antiquity, Islamic scholarly contexts, medieval and early modern Europe, and later modern forms of astrology. The natal chart, houses, aspects, and timing methods familiar today were therefore not created all at once; they are the result of multiple stages of transmission and reconstruction.

Astrology has endured partly because it transforms complex celestial cycles into a visual language for discussing time, relationships, life domains, and change. Its long cultural continuity is historically significant, but longevity alone does not establish every astrological interpretation as a scientifically demonstrated causal fact.

---

# ASTROLOGY-03 \u4E3B\u89C6\u89C9
## \`ASTROLOGY TRANSMISSION MAP\`

\u8FD9\u4E00\u9875\u975E\u5E38\u9002\u5408\u505A\u6210\u6BD4\u516B\u5B57\u66F4\u5BBD\u5E7F\u7684\u5386\u53F2\u8F68\u8FF9\u56FE\u3002

\u5EFA\u8BAE\uFF1A

\`\`\`text
MESOPOTAMIAN
CELESTIAL RECORDS
\u65E9\u671F\u5929\u8C61\u8BB0\u5F55
        \u2193
HELLENISTIC
SYNTHESIS
\u5E0C\u814A\u5316\u4F53\u7CFB\u5316
        \u2193
LATE ANTIQUE
TRANSMISSION
\u665A\u671F\u53E4\u5178\u4F20\u64AD
        \u2193
ISLAMIC SCHOLARSHIP
\u7FFB\u8BD1\u3001\u8BA1\u7B97\u4E0E\u4FDD\u5B58
        \u2193
MEDIEVAL / EARLY MODERN
EUROPE
\u6B27\u6D32\u91CD\u7EC4
        \u2193
MODERN ASTROLOGY
\u73B0\u4EE3\u5360\u661F
\`\`\`

\u89C6\u89C9\u4E0A\u53EF\u4EE5\u662F\u4E00\u6761\u4ECE\u5DE6\u5230\u53F3\u7684\uFF1A

**celestial orbit \xD7 manuscript \xD7 chart evolution timeline**

\u4E0D\u8981\u5806\u5386\u53F2\u4EBA\u7269\u5934\u50CF\u3002

---

# Astrology \u5386\u53F2\u9875\u53EF\u4EE5\u518D\u52A0\u4E00\u4E2A\u201C\u7ED3\u6784\u5982\u4F55\u5F62\u6210\u201D\u5C0F\u56FE

\u53F3\u4E0B\u89D2\uFF1A

\`\`\`text
CELESTIAL OBSERVATION
\u5929\u8C61\u89C2\u5BDF
+
MATHEMATICAL CALCULATION
\u6570\u5B66\u8BA1\u7B97
+
CULTURAL INTERPRETATION
\u6587\u5316\u89E3\u91CA
        \u2193
ASTROLOGICAL TRADITIONS
\u5360\u661F\u4F20\u7EDF
\`\`\`

\u8FD9\u975E\u5E38\u7B26\u5408 PHI OS\uFF0C\u56E0\u4E3A\u5B83\u76F4\u63A5\u8BF4\u660E\uFF1A

> \u8BA1\u7B97\u7ED3\u6784\u4E0E\u89E3\u91CA\u4F20\u7EDF\u4E0D\u662F\u540C\u4E00\u4EF6\u4E8B\u3002

---

# Astrology \u4E09\u4E2A\u56FA\u5B9A\u77E5\u8BC6\u5757

### 01\uFF5C\u4E3A\u4EC0\u4E48\u4E0D\u65AD\u53D8\u5316\u5374\u6CA1\u6709\u6D88\u5931\uFF1F
**WHY DID IT SURVIVE CHANGE?**

> \u56E0\u4E3A\u5B83\u4E0D\u65AD\u5438\u6536\u65B0\u7684\u8BA1\u7B97\u65B9\u6CD5\u3001\u6587\u5316\u8BED\u8A00\u4E0E\u89E3\u91CA\u6846\u67B6\u3002

### 02\uFF5C\u4ECA\u5929\u7684\u5360\u661F\u662F\u4E0D\u662F\u53E4\u4EE3\u539F\u6837\u4FDD\u5B58\uFF1F
**IS MODERN ASTROLOGY IDENTICAL TO ANCIENT ASTROLOGY?**

> \u4E0D\u662F\u3002\u4ECA\u5929\u5E38\u89C1\u7684\u4F53\u7CFB\u7ECF\u8FC7\u4E86\u591A\u6B21\u4F20\u64AD\u3001\u9009\u62E9\u4E0E\u91CD\u7EC4\u3002

### 03\uFF5C\u4E3A\u4EC0\u4E48\u4ECA\u5929\u4ECD\u6709\u4EBA\u4F7F\u7528\uFF1F
**WHY IS IT STILL USED?**

> \u56E0\u4E3A\u661F\u76D8\u63D0\u4F9B\u4E86\u4E00\u79CD\u9AD8\u5EA6\u7ED3\u6784\u5316\u7684\u65B9\u5F0F\uFF0C\u628A\u65F6\u95F4\u3001\u9886\u57DF\u4E0E\u5173\u7CFB\u653E\u5728\u540C\u4E00\u5F20\u56FE\u4E2D\u89C2\u5BDF\u3002

---

# Astrology \u56FA\u5B9A\u5386\u53F2\u8FB9\u754C

\u4E2D\u6587\uFF1A

> **\u5360\u661F\u957F\u671F\u5B58\u5728\uFF0C\u8BF4\u660E\u5B83\u5177\u6709\u6301\u7EED\u7684\u6587\u5316\u3001\u8C61\u5F81\u4E0E\u89E3\u91CA\u5F71\u54CD\u529B\uFF1B\u8FD9\u4E0E\u8BC1\u660E\u5929\u4F53\u4F4D\u7F6E\u4F1A\u4EE5\u7279\u5B9A\u673A\u5236\u51B3\u5B9A\u4E2A\u4EBA\u547D\u8FD0\uFF0C\u662F\u4E24\u4E2A\u4E0D\u540C\u7684\u95EE\u9898\u3002**

\u82F1\u6587\uFF1A

> **Astrology's longevity demonstrates enduring cultural, symbolic, and interpretive influence; that is distinct from demonstrating that celestial positions determine individual fate through an established causal mechanism.**

---

# Astrology \u524D\u516D\u9875\u73B0\u5728\u4E5F\u6B63\u5F0F\u51BB\u7ED3

\`\`\`text
01\uFF5CASTROLOGY FULL REPORT
\u5360\u661F\u5B8C\u6574\u62A5\u544A

02\uFF5CWHAT IS ASTROLOGY?
\u4EC0\u4E48\u662F\u5360\u661F\uFF1F

03\uFF5CWHY HAS ASTROLOGY ENDURED?
\u4E3A\u4EC0\u4E48\u5360\u661F\u4F1A\u4F20\u627F\u81F3\u4ECA\uFF1F

04\uFF5CHOW DOES PHI OS USE ASTROLOGY?
PHI OS \u5982\u4F55\u770B\u5F85\u5E76\u4F7F\u7528\u5360\u661F\uFF1F

05\uFF5CHOW TO READ THIS REPORT
\u5982\u4F55\u9605\u8BFB\u8FD9\u4EFD\u62A5\u544A\uFF1F

06\uFF5CYOUR ASTROLOGY SNAPSHOT
\u4F60\u7684\u661F\u76D8\u603B\u89C8
\`\`\`

\u540E\u9762\u7684\u4E2A\u4EBA\u9875\u9762\u987A\u5EF6\uFF0C\u56E0\u6B64 Astrology \u6700\u7EC8\u4E5F\u81EA\u7136\u53D8\u6210\u7EA6 **26 \u9875**\u3002

---

## \u540E\u7EED 6 \u4E2A\u65B9\u6CD5\u7684\u5386\u53F2\u9875\u4E0D\u80FD\u5B8C\u5168\u5957\u6A21\u677F

\u73B0\u5728\u6211\u4EEC\u5B9E\u9645\u4E0A\u4F1A\u5F62\u6210\u4E09\u5957 Origin Page\uFF1A

**\u4F20\u7EDF\u957F\u671F\u65B9\u6CD5\uFF1A**

\`\`\`text
BAZI
ZI WEI
ASTROLOGY
NUMEROLOGY
\`\`\`

\u4F7F\u7528\uFF1A

> **WHY HAS THIS METHOD ENDURED?**

**\u73B0\u4EE3\u7EFC\u5408\u65B9\u6CD5\uFF1A**

\`\`\`text
HUMAN DESIGN
\`\`\`

\u4F7F\u7528\uFF1A

> **HOW DID THIS METHOD EMERGE AND DEVELOP?**

**PHI OS \u539F\u751F\u65B9\u6CD5\uFF1A**

\`\`\`text
PROFILE
ECR
CROSS
\`\`\`

\u5206\u522B\u66F4\u9002\u5408\uFF1A

> **WHY WAS THIS METHOD BUILT?**

\u8FD9\u6837\u4E0D\u4F1A\u4E3A\u4E86\u201C\u5386\u53F2\u539A\u5EA6\u201D\u800C\u5236\u9020\u4E0D\u5B58\u5728\u7684\u53E4\u8001\u4F20\u627F\u3002

\u4E0B\u4E00\u6B65\u6700\u5408\u7406\u7684\u662F\u7EE7\u7EED\u5B8C\u6210 **\u7D2B\u5FAE\u6597\u6570\uFF1AWhat is Zi Wei \u2192 \u4E3A\u4EC0\u4E48\u4F20\u627F\u81F3\u4ECA \u2192 PHI OS Lens**\uFF0C\u7136\u540E\u518D\u628A Zi Wei \u7684\u5B8C\u6574 26 \u9875 blueprint \u4E00\u6B21\u51BB\u7ED3\u3002
`,sourcePath:"docs/guided-report-successor-r1/reference-origins-bazi-astrology.md",role:"WHY_HAS_ASTROLOGY_ENDURED",master:"M02"},{pageNumber:4,title:{"zh-Hans":"PHI OS \u5982\u4F55\u770B\u5F85\u5E76\u4F7F\u7528\u5360\u661F\uFF1F",en:"HOW DOES PHI OS USE ASTROLOGY?"},sourceText:`# 03\uFF5CPHI OS \u5982\u4F55\u770B\u5F85\u5E76\u4F7F\u7528\u5360\u661F\uFF1F
## HOW DOES PHI OS USE ASTROLOGY?

**\u72B6\u6001\uFF1A\`OPEN\`**

### \u5BA2\u6237\u95EE\u9898
> PHI OS \u4F1A\u4E0D\u4F1A\u628A\u661F\u76D8\u5F53\u6210\u6211\u7684\u5168\u90E8\u73B0\u5B9E\uFF1F

### \u56FA\u5B9A\u526F\u6807\u9898

**\u4FDD\u7559\u661F\u76D8\u672C\u8EAB\u7684\u7ED3\u6784\uFF0C\u540C\u65F6\u533A\u5206\u6295\u5F71\u3001\u89E3\u91CA\u4E0E\u6B63\u5728\u53D1\u751F\u7684\u73B0\u5B9E\u3002**

**Preserve the chart as a structured projection while keeping projection, interpretation, and current Reality distinct.**

### \u4E2D\u6587\u56FA\u5B9A\u7A3F

PHI OS \u4E0D\u628A\u5360\u661F\u56FE\u89C6\u4E3A\u4E00\u4E2A\u80FD\u591F\u5B8C\u6574\u5B9A\u4E49\u4E2A\u4EBA\u73B0\u5B9E\u7684\u7B54\u6848\uFF0C\u800C\u628A\u5B83\u4F5C\u4E3A\u4E00\u79CD\u7ED3\u6784\u4E0E\u65F6\u95F4\u89C6\u89D2\u3002\u661F\u76D8\u8D1F\u8D23\u63D0\u4F9B\u81EA\u5DF1\u7684\u884C\u661F\u4F4D\u7F6E\u3001\u5BAB\u4F4D\u3001\u76F8\u4F4D\u4E0E\u5468\u671F\u6570\u636E\uFF1BPHI OS \u4E0D\u91CD\u65B0\u8BA1\u7B97\u8FD9\u4E9B\u7ED3\u6784\uFF0C\u4E5F\u4E0D\u4F1A\u56E0\u4E3A\u67D0\u4E2A\u914D\u7F6E\u51FA\u73B0\uFF0C\u5C31\u76F4\u63A5\u628A\u5B83\u8F6C\u6362\u6210\u5173\u4E8E\u5BA2\u6237\u4EBA\u683C\u3001\u884C\u4E3A\u6216\u672A\u6765\u4E8B\u4EF6\u7684\u786E\u5B9A\u4E8B\u5B9E\u3002

\u5728 PHI OS \u4E2D\uFF0C\u5360\u661F\u7ED3\u679C\u9996\u5148\u88AB\u4FDD\u7559\u4E3A\u65B9\u6CD5\u6295\u5F71\uFF0C\u518D\u8FDB\u4E00\u6B65\u533A\u5206\u54EA\u4E9B\u5C5E\u4E8E\u8BA1\u7B97\u3001\u54EA\u4E9B\u5C5E\u4E8E\u89E3\u91CA\u3001\u54EA\u4E9B\u9700\u8981\u5F53\u524D\u73B0\u5B9E\u8BC1\u636E\u624D\u80FD\u6BD4\u8F83\u3002\u5F53\u5BA2\u6237\u7684\u5B9E\u9645\u5DE5\u4F5C\u3001\u5173\u7CFB\u3001\u8D44\u6E90\u3001\u73AF\u5883\u6216\u6B63\u5728\u7ECF\u5386\u7684\u53D8\u5316\u88AB\u5E26\u5165\u4EE5\u540E\uFF0C\u7CFB\u7EDF\u53EF\u4EE5\u89C2\u5BDF\u661F\u76D8\u6240\u5F3A\u8C03\u7684\u4E3B\u9898\u4E0E\u73B0\u5B9E\u4E4B\u95F4\u7A76\u7ADF\u662F\u5171\u632F\u3001\u90E8\u5206\u5171\u632F\u3001\u4E0D\u5171\u632F\uFF0C\u8FD8\u662F\u4ECD\u7136\u5F00\u653E\u3002

\u5360\u661F\u56E0\u6B64\u4E0D\u662F\u66FF\u5BA2\u6237\u51B3\u5B9A\u672A\u6765\uFF0C\u800C\u662F\u589E\u52A0\u4E00\u4E2A\u89C2\u5BDF\u73B0\u5B9E\u7684\u89C6\u89D2\u3002

### English fixed copy

PHI OS does not treat an astrological chart as a complete definition of a person's Reality. It uses astrology as one structured perspective on configuration and timing.

The astrology method remains responsible for planetary positions, houses, aspects, and admitted timing calculations. PHI OS does not replace those calculations, and it does not automatically turn a chart configuration into a factual claim about personality, behavior, or future events.

The chart is first preserved as a method projection. PHI OS then distinguishes calculated structure from interpretation, and interpretation from evidence about current Reality. When real information about work, relationships, resources, environment, or current change is available, the system can compare those circumstances with what the chart highlights rather than assuming they must be identical.

Astrology therefore becomes a perspective for observation and navigation, not a mechanism for deciding the customer's future.

---`,sourcePath:"docs/guided-report-successor-r1/reference-astrology.md",role:"HOW_DOES_PHI_OS_USE_ASTROLOGY",master:"M02"},{pageNumber:5,title:{"zh-Hans":"\u5982\u4F55\u9605\u8BFB\u8FD9\u4EFD\u5360\u661F\u62A5\u544A",en:"HOW TO READ THIS REPORT"},sourceText:`# 04\uFF5C\u5982\u4F55\u9605\u8BFB\u8FD9\u4EFD\u5360\u661F\u62A5\u544A
## HOW TO READ THIS REPORT

**\u72B6\u6001\uFF1A\`OPEN\`**

\u6CBF\u7528\u7EDF\u4E00\uFF1A

\`\`\`text
CALCULATED
\u5DF2\u8BA1\u7B97

INTERPRETED
\u89E3\u91CA

CURRENT EVIDENCE
\u5F53\u524D\u8BC1\u636E

OPEN
\u4ECD\u5F85\u89C2\u5BDF
\`\`\`

### \u4E3B\u89C6\u89C9
\u56DB\u5C42\u9605\u8BFB\u72B6\u6001\u56FE\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-astrology.md",role:"HOW_TO_READ_THIS_REPORT",master:"M02"},{pageNumber:6,title:{"zh-Hans":"\u4F60\u7684\u661F\u76D8\u603B\u89C8",en:"YOUR ASTROLOGY SNAPSHOT"},sourceText:`# 05\uFF5C\u4F60\u7684\u661F\u76D8\u603B\u89C8
## YOUR ASTROLOGY SNAPSHOT

**\u72B6\u6001\uFF1A\`OPEN\`**

### \u5BA2\u6237\u95EE\u9898
> \u5982\u679C\u53EA\u770B\u4E00\u9875\uFF0C\u6211\u6700\u9700\u8981\u5148\u77E5\u9053\u4EC0\u4E48\uFF1F

### \u4E3B\u89C6\u89C9
Premium dashboard\uFF1A

\`\`\`text
Natal Wheel
+
Primary Planetary Emphasis
+
House Emphasis
+
Aspect Pattern
+
Element / Mode
\`\`\`

\u6700\u591A\u4E09\u6761\u6838\u5FC3\u7ED3\u8BBA\uFF1A

- Primary pattern
- Main tension / support
- What to observe

---`,sourcePath:"docs/guided-report-successor-r1/reference-astrology.md",role:"YOUR_ASTROLOGY_SNAPSHOT",master:"M03"},{pageNumber:7,title:{"zh-Hans":"\u4F60\u7684\u672C\u547D\u76D8",en:"YOUR NATAL CHART"},sourceText:`# 06\uFF5C\u4F60\u7684\u672C\u547D\u76D8
## YOUR NATAL CHART

**\u72B6\u6001\uFF1A\`LOCKED\`**

### \u5BA2\u6237\u95EE\u9898
> \u6211\u7684\u51FA\u751F\u65F6\u523B\u6574\u4F53\u5F62\u6210\u4E86\u4E00\u5F20\u600E\u6837\u7684\u661F\u76D8\uFF1F

### \u4E3B\u89C6\u89C9
\u5B8C\u6574 natal wheel\u3002

\u4E0D\u662F\u88C5\u9970\uFF0C\u8981\u663E\u793A\u771F\u5B9E\uFF1A

- planets
- houses
- angles
- aspect lines

### Locked Preview

> \u4ECE\u6574\u5F20\u672C\u547D\u76D8\u5F00\u59CB\uFF0C\u5148\u770B\u7ED3\u6784\uFF0C\u518D\u8FDB\u5165\u5355\u4E00\u884C\u661F\u7684\u89E3\u91CA\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-astrology.md",role:"YOUR_NATAL_CHART",master:"M04"},{pageNumber:8,title:{"zh-Hans":"\u884C\u661F\u91CD\u70B9",en:"PLANETARY EMPHASIS"},sourceText:`# 07\uFF5C\u884C\u661F\u91CD\u70B9
## PLANETARY EMPHASIS

**\u72B6\u6001\uFF1A\`LOCKED\`**

### \u5BA2\u6237\u95EE\u9898
> \u54EA\u4E9B\u884C\u661F\u5728\u6574\u5F20\u7ED3\u6784\u4E2D\u6700\u503C\u5F97\u4F18\u5148\u8BFB\u53D6\uFF1F

### \u4E3B\u89C6\u89C9

Orbit / ranked planet map\u3002

### \u4E09\u69FD

1. PRIMARY
2. SUPPORT
3. CONDITION

\u4E0D\u8981\u9010\u9897\u884C\u661F\u5199\u767E\u79D1\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-astrology.md",role:"PLANETARY_EMPHASIS",master:"M04"},{pageNumber:9,title:{"zh-Hans":"\u5BAB\u4F4D\u7ED3\u6784",en:"HOUSE STRUCTURE"},sourceText:`# 08\uFF5C\u5BAB\u4F4D\u7ED3\u6784
## HOUSE STRUCTURE

**\u72B6\u6001\uFF1A\`LOCKED\`**

### \u5BA2\u6237\u95EE\u9898
> \u54EA\u4E9B\u4EBA\u751F\u9886\u57DF\u5728\u8FD9\u5F20\u661F\u76D8\u4E2D\u83B7\u5F97\u66F4\u591A\u7ED3\u6784\u91CD\u70B9\uFF1F

### \u4E3B\u89C6\u89C9

12-house matrix / radial highlight\u3002

### \u4E09\u69FD

- emphasized domains
- relationship between houses
- observation

---`,sourcePath:"docs/guided-report-successor-r1/reference-astrology.md",role:"HOUSE_STRUCTURE",master:"M04"},{pageNumber:10,title:{"zh-Hans":"\u76F8\u4F4D\u7F51\u7EDC",en:"ASPECT NETWORK"},sourceText:`# 09\uFF5C\u76F8\u4F4D\u7F51\u7EDC
## ASPECT NETWORK

**\u72B6\u6001\uFF1A\`LOCKED\`**

### \u5BA2\u6237\u95EE\u9898
> \u4E0D\u540C\u884C\u661F\u4E4B\u95F4\u5F62\u6210\u4E86\u600E\u6837\u7684\u652F\u6301\u3001\u5F20\u529B\u4E0E\u8FDE\u63A5\uFF1F

### \u4E3B\u89C6\u89C9

Network graph\uFF1A

\`\`\`text
planet
\u2194
planet
\`\`\`

\u4EE5 aspect \u7C7B\u578B\u7F16\u7801\u3002

### Locked Preview

> \u770B\u89C1\u771F\u6B63\u5F71\u54CD\u661F\u76D8\u7684\u4E0D\u662F\u5355\u4E00\u884C\u661F\uFF0C\u800C\u662F\u5B83\u4EEC\u4E4B\u95F4\u7684\u5173\u7CFB\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-astrology.md",role:"ASPECT_NETWORK",master:"M06"},{pageNumber:11,title:{"zh-Hans":"\u5143\u7D20\u4E0E\u6A21\u5F0F\u5206\u5E03",en:"ELEMENTS & MODALITIES"},sourceText:`# 10\uFF5C\u5143\u7D20\u4E0E\u6A21\u5F0F\u5206\u5E03
## ELEMENTS & MODALITIES

**\u72B6\u6001\uFF1A\`LOCKED / CONDITIONAL\`**

### \u5BA2\u6237\u95EE\u9898
> \u6574\u4F53\u661F\u76D8\u7684\u5143\u7D20\u4E0E\u8FD0\u884C\u6A21\u5F0F\u5982\u4F55\u5206\u5E03\uFF1F

### \u4E3B\u89C6\u89C9

- element donut
- modality bars

\u5FC5\u987B\u4F7F\u7528\u771F\u5B9E\u8BA1\u7B97\u503C\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-astrology.md",role:"ELEMENTS_MODALITIES",master:"M04"},{pageNumber:12,title:{"zh-Hans":"\u6838\u5FC3\u7ED3\u6784\u6A21\u5F0F",en:"PRIMARY CHART PATTERN"},sourceText:`# 11\uFF5C\u6838\u5FC3\u7ED3\u6784\u6A21\u5F0F
## PRIMARY CHART PATTERN

**\u72B6\u6001\uFF1A\`LOCKED\`**

### \u5BA2\u6237\u95EE\u9898
> \u5982\u679C\u628A\u6574\u5F20\u661F\u76D8\u538B\u7F29\u6210\u4E00\u4E2A\u4E3B\u8981\u7ED3\u6784\uFF0C\u5B83\u662F\u4EC0\u4E48\uFF1F

### \u4E3B\u89C6\u89C9

\u4E2D\u592E primary pattern\uFF1A

\`\`\`text
PRIMARY THEME
\u2502
\u251C\u2500 Planet
\u251C\u2500 House
\u251C\u2500 Aspect
\u2514\u2500 Supporting structures
\`\`\`

---`,sourcePath:"docs/guided-report-successor-r1/reference-astrology.md",role:"PRIMARY_CHART_PATTERN",master:"M04"},{pageNumber:13,title:{"zh-Hans":"\u6B21\u7EA7\u4E3B\u9898\u4E0E\u6761\u4EF6",en:"SECONDARY THEMES & CONDITIONS"},sourceText:`# 12\uFF5C\u6B21\u7EA7\u4E3B\u9898\u4E0E\u6761\u4EF6
## SECONDARY THEMES & CONDITIONS

**\u72B6\u6001\uFF1A\`LOCKED\`**

### \u5BA2\u6237\u95EE\u9898
> \u54EA\u4E9B\u4E3B\u9898\u53EA\u5728\u67D0\u4E9B\u5173\u7CFB\u6216\u6761\u4EF6\u4E0B\u53D8\u5F97\u660E\u663E\uFF1F

### \u4E3B\u89C6\u89C9

3 conditional cards\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-astrology.md",role:"SECONDARY_THEMES_CONDITIONS",master:"M04"},{pageNumber:14,title:{"zh-Hans":"\u53EF\u7528\u4F18\u52BF\u4E0E\u8D44\u6E90",en:"AVAILABLE STRENGTHS & RESOURCES"},sourceText:`# 13\uFF5C\u53EF\u7528\u4F18\u52BF\u4E0E\u8D44\u6E90
## AVAILABLE STRENGTHS & RESOURCES

**\u72B6\u6001\uFF1A\`LOCKED\`**

### \u5BA2\u6237\u95EE\u9898
> \u661F\u76D8\u4E2D\u54EA\u4E9B\u7ED3\u6784\u53EF\u4EE5\u6210\u4E3A\u53EF\u4F7F\u7528\u7684\u8D44\u6E90\uFF1F

### \u4E3B\u89C6\u89C9

Resource constellation / ranked cards\u3002

\u4E0D\u80FD\u5199\uFF1A

> \u4F60\u5929\u751F\u6210\u529F\u3002

\u5E94\u8BE5\u5199\uFF1A

> \u8FD9\u79CD\u914D\u7F6E\u5728 X \u6761\u4EF6\u4E0B\u53EF\u652F\u6301 Y\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-astrology.md",role:"AVAILABLE_STRENGTHS_RESOURCES",master:"M06"},{pageNumber:15,title:{"zh-Hans":"\u5F20\u529B\u4E0E\u6469\u64E6",en:"TENSIONS & FRICTION"},sourceText:`# 14\uFF5C\u5F20\u529B\u4E0E\u6469\u64E6
## TENSIONS & FRICTION

**\u72B6\u6001\uFF1A\`LOCKED\`**

### \u5BA2\u6237\u95EE\u9898
> \u54EA\u4E9B\u5173\u7CFB\u53EF\u80FD\u589E\u52A0\u73B0\u5B9E\u8FD0\u884C\u6210\u672C\uFF1F

### \u4E3B\u89C6\u89C9

Tension map\uFF1A

\`\`\`text
SUPPORT
TENSION
CONDITION
\`\`\`

\u4E0D\u662F\u201C\u574F\u76F8\u4F4D\u201D\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-astrology.md",role:"TENSIONS_FRICTION",master:"M05"},{pageNumber:16,title:{"zh-Hans":"\u81EA\u6211\u4E0E\u8868\u8FBE",en:"SELF & EXPRESSION"},sourceText:`# 15\uFF5C\u81EA\u6211\u4E0E\u8868\u8FBE
## SELF & EXPRESSION

**\u72B6\u6001\uFF1A\`LOCKED\`**

### \u5BA2\u6237\u95EE\u9898
> \u661F\u76D8\u5982\u4F55\u63CF\u8FF0\u81EA\u6211\u7EC4\u7EC7\u4E0E\u8868\u8FBE\u65B9\u5F0F\uFF1F

### \u4E3B\u89C6\u89C9

Self-expression map\uFF1A

\`\`\`text
IDENTITY
CREATION
EXPRESSION
DIRECTION
\`\`\`

\u53EA\u6D88\u8D39\u5DF2\u51C6\u5165 claims\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-astrology.md",role:"SELF_EXPRESSION",master:"M06"},{pageNumber:17,title:{"zh-Hans":"\u5173\u7CFB\u7ED3\u6784",en:"RELATIONSHIPS"},sourceText:`# 16\uFF5C\u5173\u7CFB\u7ED3\u6784
## RELATIONSHIPS

**\u72B6\u6001\uFF1A\`LOCKED\`**

### \u5BA2\u6237\u95EE\u9898
> \u8FD9\u5F20\u661F\u76D8\u4ECE\u54EA\u4E9B\u89D2\u5EA6\u63CF\u8FF0\u5173\u7CFB\u4E0E\u4E92\u52A8\uFF1F

### \u4E3B\u89C6\u89C9

Relationship domain matrix\uFF1A

- self
- partner
- intimacy
- social
- boundaries

\u4E0D\u9884\u6D4B\u5A5A\u59FB\u7ED3\u679C\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-astrology.md",role:"RELATIONSHIPS",master:"M05"},{pageNumber:18,title:{"zh-Hans":"\u4E8B\u4E1A\u4E0E\u5DE5\u4F5C",en:"CAREER & WORK"},sourceText:`# 17\uFF5C\u4E8B\u4E1A\u4E0E\u5DE5\u4F5C
## CAREER & WORK

**\u72B6\u6001\uFF1A\`LOCKED\`**

### \u5BA2\u6237\u95EE\u9898
> \u54EA\u4E9B\u7ED3\u6784\u4E0E\u5DE5\u4F5C\u3001\u8D23\u4EFB\u3001\u8F93\u51FA\u4E0E\u793E\u4F1A\u65B9\u5411\u6709\u5173\uFF1F

### \u4E3B\u89C6\u89C9

Career map\uFF1A

\`\`\`text
DIRECTION
WORK
RESPONSIBILITY
OUTPUT
VISIBILITY
\`\`\`

---`,sourcePath:"docs/guided-report-successor-r1/reference-astrology.md",role:"CAREER_WORK",master:"M06"},{pageNumber:19,title:{"zh-Hans":"\u8D44\u6E90\u4E0E\u4EF7\u503C",en:"RESOURCES & VALUES"},sourceText:`# 18\uFF5C\u8D44\u6E90\u4E0E\u4EF7\u503C
## RESOURCES & VALUES

**\u72B6\u6001\uFF1A\`LOCKED\`**

### \u5BA2\u6237\u95EE\u9898
> \u661F\u76D8\u5982\u4F55\u63CF\u8FF0\u8D44\u6E90\u3001\u4EF7\u503C\u4E0E\u4EA4\u6362\u4E3B\u9898\uFF1F

### \u4E3B\u89C6\u89C9

Resource-value flow\u3002

\u907F\u514D\uFF1A

\`\`\`text
\u4E00\u5B9A\u53D1\u8D22
\u4E00\u5B9A\u8D2B\u7A77
\`\`\`

---`,sourcePath:"docs/guided-report-successor-r1/reference-astrology.md",role:"RESOURCES_VALUES",master:"M06"},{pageNumber:20,title:{"zh-Hans":"\u65F6\u95F4\u4E0E\u53D8\u5316\u7ED3\u6784",en:"TIMING & CHANGE"},sourceText:`# 19\uFF5C\u65F6\u95F4\u4E0E\u53D8\u5316\u7ED3\u6784
## TIMING & CHANGE

**\u72B6\u6001\uFF1A\`LOCKED / CONDITIONAL\`**

### \u5BA2\u6237\u95EE\u9898
> \u5360\u661F\u5982\u4F55\u7EC4\u7EC7\u5F53\u524D\u4E0E\u672A\u6765\u9636\u6BB5\u7684\u53D8\u5316\uFF1F

### \u4E3B\u89C6\u89C9

Timeline\uFF1A

\`\`\`text
Natal Baseline
\u2193
Transit / admitted timing layer
\u2193
Selected Window
\`\`\`

---`,sourcePath:"docs/guided-report-successor-r1/reference-astrology.md",role:"TIMING_CHANGE",master:"M07"},{pageNumber:21,title:{"zh-Hans":"\u5F53\u524D\uFF0F\u9009\u5B9A\u5468\u671F",en:"CURRENT / SELECTED PERIOD"},sourceText:`# 20\uFF5C\u5F53\u524D\uFF0F\u9009\u5B9A\u5468\u671F
## CURRENT / SELECTED PERIOD

**\u72B6\u6001\uFF1A\`CONDITIONAL\`**

\u53EA\u6709\u5B58\u5728\u771F\u5B9E timing authority \u624D\u663E\u793A\u3002

### \u4E3B\u89C6\u89C9

Current timing dashboard\u3002

\u6700\u591A\u663E\u793A\uFF1A

- active emphasis
- tension
- observation

\u4E0D\u8F93\u51FA\u672A\u7ECF\u652F\u6301\u7684\u4E8B\u4EF6\u9884\u6D4B\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-astrology.md",role:"CURRENT_SELECTED_PERIOD",master:"M07"},{pageNumber:22,title:{"zh-Hans":"\u5F53\u524D\u73B0\u5B9E\u6BD4\u8F83",en:"CURRENT REALITY COMPARISON"},sourceText:`# 21\uFF5C\u5F53\u524D\u73B0\u5B9E\u6BD4\u8F83
## CURRENT REALITY COMPARISON

**\u72B6\u6001\uFF1A\`CONDITIONAL\`**

### \u5BA2\u6237\u95EE\u9898
> \u661F\u76D8\u6240\u5F3A\u8C03\u7684\u4E3B\u9898\uFF0C\u4E0E\u6211\u73B0\u5728\u6B63\u5728\u7ECF\u5386\u7684\u73B0\u5B9E\u6709\u4EC0\u4E48\u5173\u7CFB\uFF1F

### \u4E3B\u89C6\u89C9

\`\`\`text
ASTROLOGY PROJECTION
        VS
CURRENT REALITY
\`\`\`

\u72B6\u6001\uFF1A

- Currently resonant
- Partially resonant
- Currently not resonant
- Open

---`,sourcePath:"docs/guided-report-successor-r1/reference-astrology.md",role:"CURRENT_REALITY_COMPARISON",master:"M07"},{pageNumber:23,title:{"zh-Hans":"\u53EF\u89C2\u5BDF\u8BAF\u53F7",en:"OBSERVABLE SIGNALS"},sourceText:`# 22\uFF5C\u53EF\u89C2\u5BDF\u8BAF\u53F7
## OBSERVABLE SIGNALS

**\u72B6\u6001\uFF1A\`LOCKED\`**

### \u5BA2\u6237\u95EE\u9898
> \u6211\u53EF\u4EE5\u89C2\u5BDF\u4EC0\u4E48\u6765\u5224\u65AD\u8FD9\u4E9B\u4E3B\u9898\u662F\u5426\u771F\u7684\u5728\u73B0\u5B9E\u4E2D\u51FA\u73B0\uFF1F

### \u4E3B\u89C6\u89C9

Signal cards\uFF1A

\`\`\`text
WHEN
WATCH FOR
COUNTER-SIGNAL
\`\`\`

\u6700\u591A 3 \u6761\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-astrology.md",role:"OBSERVABLE_SIGNALS",master:"M08"},{pageNumber:24,title:{"zh-Hans":"\u673A\u4F1A\u4E0E\u98CE\u9669",en:"OPPORTUNITIES & RISKS"},sourceText:`# 23\uFF5C\u673A\u4F1A\u4E0E\u98CE\u9669
## OPPORTUNITIES & RISKS

**\u72B6\u6001\uFF1A\`LOCKED\`**

### \u5BA2\u6237\u95EE\u9898
> \u54EA\u4E9B\u7ED3\u6784\u5728\u5408\u9002\u6761\u4EF6\u4E0B\u53EF\u80FD\u6210\u4E3A\u673A\u4F1A\uFF0C\u5728\u54EA\u4E9B\u6761\u4EF6\u4E0B\u589E\u52A0\u538B\u529B\uFF1F

### \u4E3B\u89C6\u89C9

Dual panel\uFF1A

\`\`\`text
OPPORTUNITY
vs
RISK
\`\`\`

\u4E0D\u662F\u5409\u51F6\u5224\u5B9A\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-astrology.md",role:"OPPORTUNITIES_RISKS",master:"M08"},{pageNumber:25,title:{"zh-Hans":"\u73B0\u5B9E\u5BFC\u822A",en:"REALITY NAVIGATION"},sourceText:`# 24\uFF5C\u73B0\u5B9E\u5BFC\u822A
## REALITY NAVIGATION

**\u72B6\u6001\uFF1A\`LOCKED\`**

### \u5BA2\u6237\u95EE\u9898
> \u6211\u63A5\u4E0B\u6765\u5E94\u8BE5\u89C2\u5BDF\u4EC0\u4E48\uFF0C\u800C\u4E0D\u662F\u76F8\u4FE1\u4EC0\u4E48\uFF1F

### \u4E3B\u89C6\u89C9

\`\`\`text
NOTICE
\u2193
COMPARE
\u2193
TEST
\u2193
REVIEW
\`\`\`

### \u4E09\u69FD

1. Observe
2. Compare
3. Next question

---`,sourcePath:"docs/guided-report-successor-r1/reference-astrology.md",role:"REALITY_NAVIGATION",master:"M08"},{pageNumber:26,title:{"zh-Hans":"\u8BC1\u636E\u3001\u8FB9\u754C\u4E0E\u7ED3\u5C3E",en:"EVIDENCE, BOUNDARY & CLOSING"},sourceText:`# 25\uFF5C\u8BC1\u636E\u3001\u8FB9\u754C\u4E0E\u7ED3\u5C3E
## EVIDENCE, BOUNDARY & CLOSING

**\u72B6\u6001\uFF1A\`PAID + WEB SUMMARY\`**

### \u4E3B\u89C6\u89C9

\`\`\`text
Birth Data
\u2193
Astronomical Calculation
\u2193
Natal Projection
\u2193
Accepted Claims
\u2193
Interpretation
\u2193
Current Reality Evidence
\u2193
Report
\`\`\`

### \u56FA\u5B9A Closing

\u4E2D\u6587\uFF1A

> \u8FD9\u4EFD\u5360\u661F\u62A5\u544A\u63D0\u4F9B\u7684\u662F\u4E00\u4E2A\u5173\u4E8E\u7ED3\u6784\u3001\u5173\u7CFB\u4E0E\u65F6\u95F4\u7684\u89C2\u5BDF\u89C6\u89D2\uFF0C\u800C\u4E0D\u662F\u5BF9\u4F60\u4EBA\u751F\u7684\u6700\u7EC8\u5B9A\u4E49\u3002\u661F\u76D8\u53EF\u4EE5\u5E2E\u52A9\u4F60\u770B\u89C1\u54EA\u4E9B\u4E3B\u9898\u503C\u5F97\u5173\u6CE8\uFF0C\u4F46\u8FD9\u4E9B\u4E3B\u9898\u5982\u4F55\u771F\u6B63\u8FDB\u5165\u73B0\u5B9E\uFF0C\u4ECD\u7136\u9700\u8981\u7ED3\u5408\u6B63\u5728\u53D1\u751F\u7684\u751F\u6D3B\u3001\u73AF\u5883\u3001\u9009\u62E9\u4E0E\u7ED3\u679C\u6301\u7EED\u89C2\u5BDF\u3002

\u82F1\u6587\uFF1A

> This astrology report offers a structured perspective on configuration, relationships, and timing rather than a final definition of your life. The chart can show what may deserve attention, but how those themes actually enter Reality still depends on the circumstances, choices, environment, and outcomes that can be observed over time.

---`,sourcePath:"docs/guided-report-successor-r1/reference-astrology.md",role:"EVIDENCE_BOUNDARY_CLOSING",master:"M08"}],humanReview:"PENDING",sourceRole:"USER_DESIGN_REFERENCE_NOT_NEW_METHOD_MEANING"},{methodId:"ZWR",sourceConversation:"6aaa576d-03bc-83ec-a176-5f8885313c6f",pages:[{pageNumber:1,title:{"zh-Hans":"\u7D2B\u5FAE\u6597\u6570\u5B8C\u6574\u62A5\u544A",en:"ZI WEI FULL REPORT"},sourceText:`## 01\uFF5C\u7D2B\u5FAE\u6597\u6570\u5B8C\u6574\u62A5\u544A
### ZI WEI FULL REPORT

\`OPEN\`

\u5EF6\u7EED \`COM-REPORT-ZIWEI-FULL\`\uFF1A

- royal purple
- gold
- ivory
- palace-grid geometry
- stellar lines
- premium report identity

---`,sourcePath:"docs/guided-report-successor-r1/reference-ziwei.md",role:"ZI_WEI_FULL_REPORT",master:"M01"},{pageNumber:2,title:{"zh-Hans":"\u4EC0\u4E48\u662F\u7D2B\u5FAE\u6597\u6570\uFF1F",en:"WHAT IS ZI WEI DOU SHU?"},sourceText:`## 02\uFF5C\u4EC0\u4E48\u662F\u7D2B\u5FAE\u6597\u6570\uFF1F
### WHAT IS ZI WEI DOU SHU?

\`OPEN\`

\u56FA\u5B9A\u7A3F\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-ziwei.md",role:"WHAT_IS_ZI_WEI_DOU_SHU",master:"M02"},{pageNumber:3,title:{"zh-Hans":"\u4E3A\u4EC0\u4E48\u7D2B\u5FAE\u6597\u6570\u4F1A\u4F20\u627F\u81F3\u4ECA\uFF1F",en:"WHY HAS ZI WEI DOU SHU ENDURED?"},sourceText:`## 03\uFF5C\u4E3A\u4EC0\u4E48\u7D2B\u5FAE\u6597\u6570\u4F1A\u4F20\u627F\u81F3\u4ECA\uFF1F
### WHY HAS ZI WEI DOU SHU ENDURED?

\`OPEN\`

\u56FA\u5B9A\u7A3F\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-ziwei.md",role:"WHY_HAS_ZI_WEI_DOU_SHU_ENDURED",master:"M02"},{pageNumber:4,title:{"zh-Hans":"PHI OS \u5982\u4F55\u8BFB\u53D6\u7D2B\u5FAE\u6597\u6570\uFF1F",en:"HOW DOES PHI OS USE ZI WEI DOU SHU?"},sourceText:`## 04\uFF5CPHI OS \u5982\u4F55\u8BFB\u53D6\u7D2B\u5FAE\u6597\u6570\uFF1F
### HOW DOES PHI OS USE ZI WEI DOU SHU?

\`OPEN\`

\u56FA\u5B9A\u7A3F\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-ziwei.md",role:"HOW_DOES_PHI_OS_USE_ZI_WEI_DOU_SHU",master:"M02"},{pageNumber:5,title:{"zh-Hans":"\u5982\u4F55\u9605\u8BFB\u8FD9\u4EFD\u62A5\u544A",en:"HOW TO READ THIS REPORT"},sourceText:`## 05\uFF5C\u5982\u4F55\u9605\u8BFB\u8FD9\u4EFD\u62A5\u544A
### HOW TO READ THIS REPORT

\`OPEN\`

\u6CBF\u7528\u56DB\u72B6\u6001\uFF1A

\`\`\`text
CALCULATED
INTERPRETED
CURRENT EVIDENCE
OPEN
\`\`\`

---`,sourcePath:"docs/guided-report-successor-r1/reference-ziwei.md",role:"HOW_TO_READ_THIS_REPORT",master:"M02"},{pageNumber:6,title:{"zh-Hans":"\u4F60\u7684\u7D2B\u5FAE\u547D\u76D8\u603B\u89C8",en:"YOUR ZI WEI SNAPSHOT"},sourceText:`# 06\uFF5C\u4F60\u7684\u7D2B\u5FAE\u547D\u76D8\u603B\u89C8
## YOUR ZI WEI SNAPSHOT

\`OPEN\`

### \u5BA2\u6237\u95EE\u9898
> \u5982\u679C\u53EA\u770B\u4E00\u9875\uFF0C\u6211\u6700\u9700\u8981\u5148\u770B\u89C1\u4EC0\u4E48\uFF1F

### \u4E3B\u89C6\u89C9

\u4E2D\u592E mini twelve-palace chart\u3002

\u5468\u56F4\uFF1A

\`\`\`text
LIFE PALACE
\u547D\u5BAB

BODY / EMBODIED PALACE
\u8EAB\u5BAB / \u5F53\u524D authority \u7684\u5BF9\u5E94\u7ED3\u6784

PRIMARY STARS
\u6838\u5FC3\u661F\u66DC

KEY DOMAINS
\u91CD\u70B9\u9886\u57DF

TIMING POSITION
\u65F6\u95F4\u4F4D\u7F6E
\`\`\`

\u6700\u591A\u4E09\u6761\u4E2A\u4EBA insight\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-ziwei.md",role:"YOUR_ZI_WEI_SNAPSHOT",master:"M03"},{pageNumber:7,title:{"zh-Hans":"\u5341\u4E8C\u5BAB\u7ED3\u6784",en:"THE TWELVE PALACES"},sourceText:`# 07\uFF5C\u5341\u4E8C\u5BAB\u7ED3\u6784
## THE TWELVE PALACES

\`LOCKED\`

### \u5BA2\u6237\u95EE\u9898
> \u6211\u7684\u5341\u4E8C\u4E2A\u4EBA\u751F\u9886\u57DF\u5728\u6574\u5F20\u547D\u76D8\u4E2D\u600E\u6837\u6392\u5217\uFF1F

### \u4E3B\u89C6\u89C9
\u5B8C\u6574 12-palace grid\u3002

\u6BCF\u5BAB\u53EA\u663E\u793A\uFF1A

- palace
- principal stars
- priority marker

\u4E0D\u8981\u585E\u6BB5\u843D\u3002

### Preview

> \u5148\u770B\u6574\u5F20\u4EBA\u751F\u9886\u57DF\u5730\u56FE\uFF0C\u518D\u8FDB\u5165\u5355\u4E00\u5BAB\u4F4D\uFF0C\u800C\u4E0D\u662F\u628A\u5341\u4E8C\u5BAB\u62C6\u6210\u5341\u4E8C\u7BC7\u767E\u79D1\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-ziwei.md",role:"THE_TWELVE_PALACES",master:"M04"},{pageNumber:8,title:{"zh-Hans":"\u547D\u5BAB\u4E0E\u6838\u5FC3\u7ED3\u6784",en:"LIFE PALACE & CORE STRUCTURE"},sourceText:`# 08\uFF5C\u547D\u5BAB\u4E0E\u6838\u5FC3\u7ED3\u6784
## LIFE PALACE & CORE STRUCTURE

\`LOCKED\`

### \u5BA2\u6237\u95EE\u9898
> \u54EA\u4E9B\u7ED3\u6784\u6700\u76F4\u63A5\u53C2\u4E0E\u81EA\u6211\u4E0E\u4EBA\u751F\u65B9\u5411\u7684\u7EC4\u7EC7\uFF1F

### \u4E3B\u89C6\u89C9

\u4E2D\u592E Life Palace\uFF1A

\`\`\`text
LIFE PALACE
        \u2193
PRIMARY STARS
        \u2193
RELATED PALACES
        \u2193
CORE PATTERN
\`\`\`

---`,sourcePath:"docs/guided-report-successor-r1/reference-ziwei.md",role:"LIFE_PALACE_CORE_STRUCTURE",master:"M04"},{pageNumber:9,title:{"zh-Hans":"\u6838\u5FC3\u661F\u66DC",en:"PRIMARY STARS"},sourceText:`# 09\uFF5C\u6838\u5FC3\u661F\u66DC
## PRIMARY STARS

\`LOCKED\`

### \u5BA2\u6237\u95EE\u9898
> \u6574\u5F20\u76D8\u91CC\uFF0C\u54EA\u4E9B\u661F\u66DC\u771F\u6B63\u5E94\u8BE5\u4F18\u5148\u8BFB\u53D6\uFF1F

### \u4E3B\u89C6\u89C9

Ranked Stellar Map\u3002

\u4E0D\u662F\uFF1A

> \u6240\u6709\u661F\u66DC\u9010\u4E2A\u89E3\u91CA\u3002

\u6700\u591A\uFF1A

\`\`\`text
PRIMARY
SECONDARY
CONDITIONAL
\`\`\`

---`,sourcePath:"docs/guided-report-successor-r1/reference-ziwei.md",role:"PRIMARY_STARS",master:"M04"},{pageNumber:10,title:{"zh-Hans":"\u661F\u66DC\u5173\u7CFB\u7F51\u7EDC",en:"STAR RELATIONSHIPS"},sourceText:`# 10\uFF5C\u661F\u66DC\u5173\u7CFB\u7F51\u7EDC
## STAR RELATIONSHIPS

\`LOCKED\`

### \u5BA2\u6237\u95EE\u9898
> \u8FD9\u4E9B\u661F\u66DC\u4E4B\u95F4\u600E\u6837\u5F62\u6210\u7EC4\u5408\u3001\u652F\u6301\u6216\u5F20\u529B\uFF1F

### \u4E3B\u89C6\u89C9
Network graph\u3002

\`\`\`text
STAR
\u2194 PALACE
\u2194 STAR
\`\`\`

\u6700\u591A 3 \u4E2A\u4E3B\u8981\u5173\u7CFB\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-ziwei.md",role:"STAR_RELATIONSHIPS",master:"M05"},{pageNumber:11,title:{"zh-Hans":"\u5BAB\u4F4D\u5173\u7CFB\u5730\u56FE",en:"PALACE RELATIONSHIP MAP"},sourceText:`# 11\uFF5C\u5BAB\u4F4D\u5173\u7CFB\u5730\u56FE
## PALACE RELATIONSHIP MAP

\`LOCKED\`

### \u5BA2\u6237\u95EE\u9898
> \u4E0D\u540C\u4EBA\u751F\u9886\u57DF\u4E4B\u95F4\u662F\u600E\u6837\u76F8\u4E92\u7275\u52A8\u7684\uFF1F

### \u4E3B\u89C6\u89C9

\u4F8B\u5982\uFF1A

\`\`\`text
SELF
\u2194 CAREER
\u2194 RESOURCES
\u2194 RELATIONSHIPS
\`\`\`

\u5B9E\u9645\u8282\u70B9\u5FC5\u987B\u7531\u76D8\u9762 authority \u51B3\u5B9A\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-ziwei.md",role:"PALACE_RELATIONSHIP_MAP",master:"M05"},{pageNumber:12,title:{"zh-Hans":"\u547D\u76D8\u4E3B\u8981\u6A21\u5F0F",en:"PRIMARY CHART PATTERN"},sourceText:`# 12\uFF5C\u547D\u76D8\u4E3B\u8981\u6A21\u5F0F
## PRIMARY CHART PATTERN

\`LOCKED\`

### \u5BA2\u6237\u95EE\u9898
> \u5982\u679C\u628A\u6574\u5F20\u547D\u76D8\u538B\u7F29\u6210\u4E00\u4E2A\u4E3B\u8981\u7ED3\u6784\uFF0C\u6700\u91CD\u8981\u7684\u662F\u4EC0\u4E48\uFF1F

### \u4E3B\u89C6\u89C9

\`\`\`text
PRIMARY PATTERN

\u652F\u6301\u6765\u6E90
\u538B\u529B\u6765\u6E90
\u4E3B\u8981\u9886\u57DF
\u65F6\u95F4\u6761\u4EF6
\`\`\`

\u6700\u591A\u4E09\u6761 insight\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-ziwei.md",role:"PRIMARY_CHART_PATTERN",master:"M04"},{pageNumber:13,title:{"zh-Hans":"\u6B21\u7EA7\u6A21\u5F0F\u4E0E\u6761\u4EF6",en:"SECONDARY PATTERNS & CONDITIONS"},sourceText:`# 13\uFF5C\u6B21\u7EA7\u6A21\u5F0F\u4E0E\u6761\u4EF6
## SECONDARY PATTERNS & CONDITIONS

\`LOCKED\`

### \u5BA2\u6237\u95EE\u9898
> \u54EA\u4E9B\u4E3B\u9898\u53EA\u6709\u5728\u7279\u5B9A\u5BAB\u4F4D\u5173\u7CFB\u6216\u65F6\u95F4\u6761\u4EF6\u4E0B\u624D\u4F1A\u53D8\u5F97\u91CD\u8981\uFF1F

### \u4E3B\u89C6\u89C9
\u4E09\u5F20 conditional cards\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-ziwei.md",role:"SECONDARY_PATTERNS_CONDITIONS",master:"M04"},{pageNumber:14,title:{"zh-Hans":"\u53EF\u7528\u4F18\u52BF\u4E0E\u8D44\u6E90",en:"AVAILABLE STRENGTHS & RESOURCES"},sourceText:`# 14\uFF5C\u53EF\u7528\u4F18\u52BF\u4E0E\u8D44\u6E90
## AVAILABLE STRENGTHS & RESOURCES

\`LOCKED\`

### \u5BA2\u6237\u95EE\u9898
> \u54EA\u4E9B\u76D8\u9762\u7ED3\u6784\u53EF\u4EE5\u6210\u4E3A\u53EF\u4F7F\u7528\u7684\u73B0\u5B9E\u8D44\u6E90\uFF1F

### \u4E3B\u89C6\u89C9
Resource constellation / cards\u3002

\u907F\u514D\u5199\u6210\uFF1A

> \u67D0\u661F = \u4E00\u5B9A\u6210\u529F\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-ziwei.md",role:"AVAILABLE_STRENGTHS_RESOURCES",master:"M06"},{pageNumber:15,title:{"zh-Hans":"\u7ED3\u6784\u538B\u529B\u4E0E\u6469\u64E6",en:"STRUCTURAL PRESSURE & FRICTION"},sourceText:`# 15\uFF5C\u7ED3\u6784\u538B\u529B\u4E0E\u6469\u64E6
## STRUCTURAL PRESSURE & FRICTION

\`LOCKED\`

### \u5BA2\u6237\u95EE\u9898
> \u54EA\u4E9B\u5173\u7CFB\u5728\u7279\u5B9A\u6761\u4EF6\u4E0B\u53EF\u80FD\u589E\u52A0\u73B0\u5B9E\u8FD0\u884C\u6210\u672C\uFF1F

### \u4E3B\u89C6\u89C9

\`\`\`text
SUPPORT
TENSION
CONDITION
\`\`\`

---`,sourcePath:"docs/guided-report-successor-r1/reference-ziwei.md",role:"STRUCTURAL_PRESSURE_FRICTION",master:"M04"},{pageNumber:16,title:{"zh-Hans":"\u81EA\u6211\u4E0E\u53D1\u5C55\u65B9\u5411",en:"SELF & DEVELOPMENT"},sourceText:`# 16\uFF5C\u81EA\u6211\u4E0E\u53D1\u5C55\u65B9\u5411
## SELF & DEVELOPMENT

\`LOCKED\`

### \u5BA2\u6237\u95EE\u9898
> \u547D\u76D8\u4ECE\u4EC0\u4E48\u89D2\u5EA6\u63CF\u8FF0\u6211\u7684\u81EA\u6211\u7EC4\u7EC7\u4E0E\u957F\u671F\u53D1\u5C55\u4E3B\u9898\uFF1F

### \u4E3B\u89C6\u89C9

\`\`\`text
SELF
DIRECTION
DEVELOPMENT
EXPRESSION
\`\`\`

---`,sourcePath:"docs/guided-report-successor-r1/reference-ziwei.md",role:"SELF_DEVELOPMENT",master:"M06"},{pageNumber:17,title:{"zh-Hans":"\u5173\u7CFB\u4E0E\u4F34\u4FA3",en:"RELATIONSHIPS & PARTNERSHIP"},sourceText:`# 17\uFF5C\u5173\u7CFB\u4E0E\u4F34\u4FA3
## RELATIONSHIPS & PARTNERSHIP

\`LOCKED\`

### \u5BA2\u6237\u95EE\u9898
> \u547D\u76D8\u4E2D\u7684\u5173\u7CFB\u7ED3\u6784\u91CD\u70B9\u5728\u54EA\u91CC\uFF1F

### \u4E3B\u89C6\u89C9
Relationship matrix\u3002

\u53EF\u4EE5\u6D89\u53CA\uFF1A

- self
- partner
- relationship field
- family context

\u4EC5\u7528\u5DF2\u51C6\u5165 claims\u3002

\u4E0D\u9884\u6D4B\uFF1A

> \u4E00\u5B9A\u79BB\u5A5A / \u4E00\u5B9A\u7ED3\u5A5A\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-ziwei.md",role:"RELATIONSHIPS_PARTNERSHIP",master:"M05"},{pageNumber:18,title:{"zh-Hans":"\u5BB6\u5EAD\u4E0E\u4EB2\u5BC6\u7ED3\u6784",en:"FAMILY & CLOSE RELATIONSHIPS"},sourceText:`# 18\uFF5C\u5BB6\u5EAD\u4E0E\u4EB2\u5BC6\u7ED3\u6784
## FAMILY & CLOSE RELATIONSHIPS

\`LOCKED\`

### \u5BA2\u6237\u95EE\u9898
> \u5BB6\u5EAD\u3001\u5B50\u5973\u6216\u4EB2\u5BC6\u5173\u7CFB\u9886\u57DF\u600E\u6837\u4E0E\u5176\u4ED6\u4EBA\u751F\u9886\u57DF\u8FDE\u63A5\uFF1F

### \u4E3B\u89C6\u89C9

Family network\u3002

\u8FD9\u4E00\u9875\u7684\u610F\u4E49\u662F\u628A Relationship \u4E0E Family \u5206\u5F00\uFF0C\u4E0D\u8981\u6240\u6709\u4E1C\u897F\u585E\u4E00\u9875\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-ziwei.md",role:"FAMILY_CLOSE_RELATIONSHIPS",master:"M05"},{pageNumber:19,title:{"zh-Hans":"\u4E8B\u4E1A\u4E0E\u793E\u4F1A\u65B9\u5411",en:"CAREER & SOCIAL DIRECTION"},sourceText:`# 19\uFF5C\u4E8B\u4E1A\u4E0E\u793E\u4F1A\u65B9\u5411
## CAREER & SOCIAL DIRECTION

\`LOCKED\`

### \u5BA2\u6237\u95EE\u9898
> \u54EA\u4E9B\u5BAB\u4F4D\u4E0E\u661F\u66DC\u6700\u53C2\u4E0E\u5DE5\u4F5C\u3001\u4E8B\u4E1A\u4E0E\u793E\u4F1A\u89D2\u8272\uFF1F

### \u4E3B\u89C6\u89C9

\`\`\`text
CAREER PALACE
\u2193
STAR STRUCTURE
\u2193
SUPPORTING PALACES
\u2193
DIRECTION
\`\`\`

---`,sourcePath:"docs/guided-report-successor-r1/reference-ziwei.md",role:"CAREER_SOCIAL_DIRECTION",master:"M06"},{pageNumber:20,title:{"zh-Hans":"\u8D44\u6E90\u4E0E\u8D22\u5BCC\u7ED3\u6784",en:"RESOURCES & WEALTH"},sourceText:`# 20\uFF5C\u8D44\u6E90\u4E0E\u8D22\u5BCC\u7ED3\u6784
## RESOURCES & WEALTH

\`LOCKED\`

### \u5BA2\u6237\u95EE\u9898
> \u7D2B\u5FAE\u5982\u4F55\u63CF\u8FF0\u8D44\u6E90\u3001\u8D22\u5BCC\u4E0E\u4EA4\u6362\uFF0C\u800C\u4E0D\u662F\u7B80\u5355\u56DE\u7B54\u8D22\u8FD0\u597D\u4E0D\u597D\uFF1F

### \u4E3B\u89C6\u89C9

Resource domain map\u3002

\`\`\`text
RESOURCE SOURCE
FLOW
HOLDING
PRESSURE
CONDITION
\`\`\`

---`,sourcePath:"docs/guided-report-successor-r1/reference-ziwei.md",role:"RESOURCES_WEALTH",master:"M06"},{pageNumber:21,title:{"zh-Hans":"\u8FC1\u79FB\u3001\u73AF\u5883\u4E0E\u5916\u90E8\u4E16\u754C",en:"MOVEMENT, ENVIRONMENT & OUTER WORLD"},sourceText:`# 21\uFF5C\u8FC1\u79FB\u3001\u73AF\u5883\u4E0E\u5916\u90E8\u4E16\u754C
## MOVEMENT, ENVIRONMENT & OUTER WORLD

\`LOCKED\`

\u8FD9\u662F\u7D2B\u5FAE\u5F88\u9002\u5408\u62E5\u6709\u3001\u800C\u5176\u4ED6\u65B9\u6CD5\u4E0D\u4E00\u5B9A\u9700\u8981\u7684\u4E13\u5C5E\u9875\u3002

### \u5BA2\u6237\u95EE\u9898
> \u5916\u90E8\u73AF\u5883\u3001\u79FB\u52A8\u3001\u53D8\u5316\u4E0E\u6269\u5C55\u5728\u6211\u7684\u76D8\u4E2D\u5904\u4E8E\u600E\u6837\u7684\u4F4D\u7F6E\uFF1F

### \u4E3B\u89C6\u89C9

\`\`\`text
HOME / BASE
        \u2194
MOVEMENT
        \u2194
OUTER WORLD
\`\`\`

---`,sourcePath:"docs/guided-report-successor-r1/reference-ziwei.md",role:"MOVEMENT_ENVIRONMENT_OUTER_WORLD",master:"M04"},{pageNumber:22,title:{"zh-Hans":"\u65F6\u95F4\u7ED3\u6784",en:"TIMING ARCHITECTURE"},sourceText:`# 22\uFF5C\u65F6\u95F4\u7ED3\u6784
## TIMING ARCHITECTURE

\`LOCKED\`

### \u5BA2\u6237\u95EE\u9898
> \u7D2B\u5FAE\u5982\u4F55\u7EC4\u7EC7\u4E0D\u540C\u9636\u6BB5\u7684\u65F6\u95F4\u91CD\u70B9\uFF1F

### \u4E3B\u89C6\u89C9

Long Cycle Timeline\uFF1A

\`\`\`text
NATAL
\u2193
MAJOR PERIOD
\u2193
SELECTED PERIOD
\u2193
YEAR / admitted timing layer
\`\`\`

---`,sourcePath:"docs/guided-report-successor-r1/reference-ziwei.md",role:"TIMING_ARCHITECTURE",master:"M07"},{pageNumber:23,title:{"zh-Hans":"\u5F53\u524D\uFF0F\u9009\u5B9A\u5468\u671F",en:"CURRENT / SELECTED PERIOD"},sourceText:`# 23\uFF5C\u5F53\u524D\uFF0F\u9009\u5B9A\u5468\u671F
## CURRENT / SELECTED PERIOD

\`CONDITIONAL\`

\u53EA\u6709\u5F53\u524D timing owner \u63D0\u4F9B\u5408\u6CD5\u6570\u636E\u624D\u51FA\u73B0\u3002

### \u4E3B\u89C6\u89C9
Current period dashboard\u3002

\u53EA\u63D0\u4F9B\uFF1A

- emphasis
- condition
- observation

\u4E0D\u505A\u7EDD\u5BF9\u4E8B\u4EF6\u9884\u6D4B\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-ziwei.md",role:"CURRENT_SELECTED_PERIOD",master:"M07"},{pageNumber:24,title:{"zh-Hans":"\u5F53\u524D\u73B0\u5B9E\u6BD4\u8F83",en:"CURRENT REALITY COMPARISON"},sourceText:`# 24\uFF5C\u5F53\u524D\u73B0\u5B9E\u6BD4\u8F83
## CURRENT REALITY COMPARISON

\`CONDITIONAL\`

### \u5BA2\u6237\u95EE\u9898
> \u547D\u76D8\u6240\u5F3A\u8C03\u7684\u4EBA\u751F\u9886\u57DF\uFF0C\u4E0E\u6211\u73B0\u5728\u5B9E\u9645\u7ECF\u5386\u7684\u73B0\u5B9E\u4E00\u81F4\u5417\uFF1F

### \u4E3B\u89C6\u89C9

\`\`\`text
ZI WEI PROJECTION
        VS
CURRENT REALITY
\`\`\`

\u72B6\u6001\u6CBF shared authority\uFF1A

\`\`\`text
CURRENTLY_RESONANT
PARTIALLY_RESONANT
CURRENTLY_NOT_RESONANT
OPEN
\`\`\`

---`,sourcePath:"docs/guided-report-successor-r1/reference-ziwei.md",role:"CURRENT_REALITY_COMPARISON",master:"M07"},{pageNumber:25,title:{"zh-Hans":"\u53EF\u89C2\u5BDF\u8BAF\u53F7\u4E0E\u73B0\u5B9E\u5BFC\u822A",en:"OBSERVABLE SIGNALS & REALITY NAVIGATION"},sourceText:`# 25\uFF5C\u53EF\u89C2\u5BDF\u8BAF\u53F7\u4E0E\u73B0\u5B9E\u5BFC\u822A
## OBSERVABLE SIGNALS & REALITY NAVIGATION

\`LOCKED\`

\u628A\u4E24\u4E2A\u529F\u80FD\u5408\u8D77\u6765\uFF0C\u4EE5\u514D\u4E3A\u4E86\u9875\u6570\u62C6\u5F97\u592A\u788E\u3002

### \u5BA2\u6237\u95EE\u9898
> \u6211\u63A5\u4E0B\u6765\u6700\u503C\u5F97\u89C2\u5BDF\u4EC0\u4E48\uFF1F

### \u4E3B\u89C6\u89C9

\`\`\`text
NOTICE
\u2193
COMPARE
\u2193
OBSERVE OVER TIME
\u2193
REVIEW
\`\`\`

\u6700\u591A\u4E09\u6761\uFF1A

- Observable signal
- Counter-signal
- Next question

---`,sourcePath:"docs/guided-report-successor-r1/reference-ziwei.md",role:"OBSERVABLE_SIGNALS_REALITY_NAVIGATION",master:"M08"},{pageNumber:26,title:{"zh-Hans":"\u8BC1\u636E\u3001\u65B9\u6CD5\u8FB9\u754C\u4E0E\u7ED3\u5C3E",en:"EVIDENCE, METHOD BOUNDARY & CLOSING"},sourceText:`# 26\uFF5C\u8BC1\u636E\u3001\u65B9\u6CD5\u8FB9\u754C\u4E0E\u7ED3\u5C3E
## EVIDENCE, METHOD BOUNDARY & CLOSING

\`PAID\`

### \u4E3B\u89C6\u89C9

\`\`\`text
Birth Data
\u2193
Zi Wei Calculation
\u2193
Palace / Star Projection
\u2193
Accepted Interpretation
\u2193
Timing Conditions
\u2193
Current Reality Evidence
\u2193
Report
\`\`\`

### \u4E2D\u6587\u56FA\u5B9A Closing

> \u8FD9\u4EFD\u7D2B\u5FAE\u6597\u6570\u62A5\u544A\u63D0\u4F9B\u7684\u662F\u4E00\u5F20\u4EBA\u751F\u9886\u57DF\u3001\u7ED3\u6784\u5173\u7CFB\u4E0E\u65F6\u95F4\u53D8\u5316\u7684\u89C2\u5BDF\u5730\u56FE\uFF0C\u800C\u4E0D\u662F\u5BF9\u4F60\u4EBA\u751F\u7684\u6700\u7EC8\u5B9A\u4E49\u3002\u547D\u76D8\u53EF\u4EE5\u5E2E\u52A9\u4F60\u770B\u89C1\u54EA\u4E9B\u9886\u57DF\u6B63\u5728\u88AB\u5F3A\u8C03\u3001\u54EA\u4E9B\u5173\u7CFB\u503C\u5F97\u8FDB\u4E00\u6B65\u7406\u89E3\uFF0C\u4F46\u8FD9\u4E9B\u7ED3\u6784\u5982\u4F55\u771F\u6B63\u8FDB\u5165\u751F\u6D3B\uFF0C\u4ECD\u7136\u9700\u8981\u4E0E\u73B0\u5B9E\u4E2D\u7684\u9009\u62E9\u3001\u73AF\u5883\u3001\u5173\u7CFB\u4E0E\u7ED3\u679C\u6301\u7EED\u6BD4\u8F83\u3002

### English Closing

> This Zi Wei Dou Shu report offers a structured map of life domains, relationships, and change over time rather than a final definition of your life. The chart can highlight what deserves attention and where important relationships appear, but how those structures actually enter lived Reality still needs to be compared with choices, circumstances, relationships, and outcomes.

---`,sourcePath:"docs/guided-report-successor-r1/reference-ziwei.md",role:"EVIDENCE_METHOD_BOUNDARY_CLOSING",master:"M08"}],humanReview:"PENDING",sourceRole:"USER_DESIGN_REFERENCE_NOT_NEW_METHOD_MEANING"},{methodId:"NUM",sourceConversation:"6aaa576d-03bc-83ec-a176-5f8885313c6f",pages:[{pageNumber:1,title:{"zh-Hans":"\u6570\u5B57\u5B66\u5B8C\u6574\u62A5\u544A",en:"NUMEROLOGY FULL REPORT"},sourceText:`## 01\uFF5C\u6570\u5B57\u5B66\u5B8C\u6574\u62A5\u544A
### NUMEROLOGY FULL REPORT

\`OPEN\`

\u5EF6\u7EED \`COM-REPORT-NUMEROLOGY-FULL\`\uFF1A

- navy
- amber gold
- ivory
- numbers
- rings
- rhythm / cycle geometry

---`,sourcePath:"docs/guided-report-successor-r1/reference-numerology.md",role:"NUMEROLOGY_FULL_REPORT",master:"M01"},{pageNumber:2,title:{"zh-Hans":"\u4EC0\u4E48\u662F\u6570\u5B57\u5B66\uFF1F",en:"WHAT IS NUMEROLOGY?"},sourceText:`## 02\uFF5C\u4EC0\u4E48\u662F\u6570\u5B57\u5B66\uFF1F
### WHAT IS NUMEROLOGY?

\`OPEN\`

\u56FA\u5B9A\u7A3F\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-numerology.md",role:"WHAT_IS_NUMEROLOGY",master:"M02"},{pageNumber:3,title:{"zh-Hans":"\u6570\u5B57\u5B66\u5982\u4F55\u5F62\u6210\u5E76\u6301\u7EED\u53D1\u5C55\uFF1F",en:"HOW DID NUMEROLOGY DEVELOP AND ENDURE?"},sourceText:`## 03\uFF5C\u6570\u5B57\u5B66\u5982\u4F55\u5F62\u6210\u5E76\u6301\u7EED\u53D1\u5C55\uFF1F
### HOW DID NUMEROLOGY DEVELOP AND ENDURE?

\`OPEN\`

\u56FA\u5B9A\u7A3F\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-numerology.md",role:"HOW_DID_NUMEROLOGY_DEVELOP_AND_ENDURE",master:"M02"},{pageNumber:4,title:{"zh-Hans":"PHI OS \u5982\u4F55\u8BFB\u53D6\u6570\u5B57\u5B66\uFF1F",en:"HOW DOES PHI OS USE NUMEROLOGY?"},sourceText:`## 04\uFF5CPHI OS \u5982\u4F55\u8BFB\u53D6\u6570\u5B57\u5B66\uFF1F
### HOW DOES PHI OS USE NUMEROLOGY?

\`OPEN\`

\u56FA\u5B9A\u7A3F\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-numerology.md",role:"HOW_DOES_PHI_OS_USE_NUMEROLOGY",master:"M02"},{pageNumber:5,title:{"zh-Hans":"\u5982\u4F55\u9605\u8BFB\u8FD9\u4EFD\u62A5\u544A",en:"HOW TO READ THIS REPORT"},sourceText:`## 05\uFF5C\u5982\u4F55\u9605\u8BFB\u8FD9\u4EFD\u62A5\u544A
### HOW TO READ THIS REPORT

\`OPEN\`

\u56DB\u72B6\u6001\uFF1A

\`\`\`text
CALCULATED
INTERPRETED
CURRENT EVIDENCE
OPEN
\`\`\`

---`,sourcePath:"docs/guided-report-successor-r1/reference-numerology.md",role:"HOW_TO_READ_THIS_REPORT",master:"M02"},{pageNumber:6,title:{"zh-Hans":"\u4F60\u7684\u6570\u5B57\u603B\u89C8",en:"YOUR NUMEROLOGY SNAPSHOT"},sourceText:`## 06\uFF5C\u4F60\u7684\u6570\u5B57\u603B\u89C8
### YOUR NUMEROLOGY SNAPSHOT

\`OPEN\`

### \u5BA2\u6237\u95EE\u9898
> \u5982\u679C\u53EA\u770B\u4E00\u9875\uFF0C\u6211\u6700\u9700\u8981\u5148\u77E5\u9053\u54EA\u4E9B\u6570\u5B57\uFF1F

### \u4E3B\u89C6\u89C9

\u4E2D\u592E\uFF1A

\`\`\`text
CORE NUMBERS
\`\`\`

\u5468\u56F4\uFF1A

- Life Path / current canonical equivalent
- Expression / current equivalent
- Inner / current equivalent
- Cycle
- Primary pattern

\u5FC5\u987B\u5B8C\u5168\u6309\u73B0\u6709 Numerology authority \u547D\u540D\uFF0C\u4E0D\u80FD\u786C\u5957\u6211\u4E3E\u4F8B\u7684\u4F20\u7EDF\u5B57\u6BB5\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-numerology.md",role:"YOUR_NUMEROLOGY_SNAPSHOT",master:"M03"},{pageNumber:7,title:{"zh-Hans":"\u6838\u5FC3\u6570\u5B57\u7ED3\u6784",en:"CORE NUMBER STRUCTURE"},sourceText:`## 07\uFF5C\u6838\u5FC3\u6570\u5B57\u7ED3\u6784
### CORE NUMBER STRUCTURE

\`LOCKED\`

### \u5BA2\u6237\u95EE\u9898
> \u54EA\u4E9B\u6570\u5B57\u6784\u6210\u6211\u7684\u4E3B\u8981\u7ED3\u6784\uFF1F

### \u4E3B\u89C6\u89C9
Radial number map\u3002

\u6700\u591A 3 \u4E2A\u4E3B\u8981\u6838\u5FC3\u503C\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-numerology.md",role:"CORE_NUMBER_STRUCTURE",master:"M04"},{pageNumber:8,title:{"zh-Hans":"\u6570\u5B57\u4E4B\u95F4\u7684\u5173\u7CFB",en:"NUMBER RELATIONSHIPS"},sourceText:`## 08\uFF5C\u6570\u5B57\u4E4B\u95F4\u7684\u5173\u7CFB
### NUMBER RELATIONSHIPS

\`LOCKED\`

### \u5BA2\u6237\u95EE\u9898
> \u8FD9\u4E9B\u6570\u5B57\u662F\u4E92\u76F8\u652F\u6301\u3001\u91CD\u590D\u8FD8\u662F\u4EA7\u751F\u5F20\u529B\uFF1F

### \u4E3B\u89C6\u89C9
Number network\u3002

\`\`\`text
N1 \u2194 N2 \u2194 N3
\`\`\`

---`,sourcePath:"docs/guided-report-successor-r1/reference-numerology.md",role:"NUMBER_RELATIONSHIPS",master:"M05"},{pageNumber:9,title:{"zh-Hans":"\u6A21\u5F0F\u5206\u5E03",en:"PATTERN DISTRIBUTION"},sourceText:`## 09\uFF5C\u6A21\u5F0F\u5206\u5E03
### PATTERN DISTRIBUTION

\`LOCKED\`

### \u5BA2\u6237\u95EE\u9898
> \u54EA\u4E9B\u6570\u5B57\u6216\u4E3B\u9898\u5728\u6574\u4F53\u7ED3\u6784\u4E2D\u88AB\u91CD\u590D\u5F3A\u8C03\uFF1F

### \u4E3B\u89C6\u89C9
Distribution bars / rings\u3002

\u53EA\u80FD\u4F7F\u7528\u771F\u5B9E\u8BA1\u7B97\u9891\u7387\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-numerology.md",role:"PATTERN_DISTRIBUTION",master:"M05"},{pageNumber:10,title:{"zh-Hans":"\u91CD\u590D\u4E0E\u7F3A\u5931",en:"REPETITION & ABSENCE"},sourceText:`## 10\uFF5C\u91CD\u590D\u4E0E\u7F3A\u5931
### REPETITION & ABSENCE

\`LOCKED / CONDITIONAL\`

### \u5BA2\u6237\u95EE\u9898
> \u54EA\u4E9B\u6A21\u5F0F\u91CD\u590D\u51FA\u73B0\uFF0C\u54EA\u4E9B\u7ED3\u6784\u8F83\u5C11\u51FA\u73B0\u6216\u4E0D\u5B58\u5728\uFF1F

### \u4E3B\u89C6\u89C9

\`\`\`text
REPEATED
BALANCED
ABSENT / LOW PRESENCE
\`\`\`

\u53EA\u6709\u73B0\u6709 method authority \u652F\u6301\u65F6\u624D\u663E\u793A\u3002

\u4E0D\u8981\u628A\u201C\u7F3A\u6570\u5B57\u201D\u81EA\u52A8\u5199\u6210\u7F3A\u9677\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-numerology.md",role:"REPETITION_ABSENCE",master:"M04"},{pageNumber:11,title:{"zh-Hans":"\u4E3B\u8981\u6570\u5B57\u6A21\u5F0F",en:"PRIMARY NUMERICAL PATTERN"},sourceText:`## 11\uFF5C\u4E3B\u8981\u6570\u5B57\u6A21\u5F0F
### PRIMARY NUMERICAL PATTERN

\`LOCKED\`

### \u5BA2\u6237\u95EE\u9898
> \u5982\u679C\u628A\u6574\u5957\u6570\u5B57\u7ED3\u6784\u538B\u7F29\u6210\u4E00\u4E2A\u4E3B\u8981\u6A21\u5F0F\uFF0C\u5B83\u662F\u4EC0\u4E48\uFF1F

### \u4E3B\u89C6\u89C9

\u4E2D\u592E\u4E3B\u6A21\u5F0F + 3 supporting numbers\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-numerology.md",role:"PRIMARY_NUMERICAL_PATTERN",master:"M04"},{pageNumber:12,title:{"zh-Hans":"\u6B21\u7EA7\u6A21\u5F0F\u4E0E\u6761\u4EF6",en:"SECONDARY PATTERNS & CONDITIONS"},sourceText:`## 12\uFF5C\u6B21\u7EA7\u6A21\u5F0F\u4E0E\u6761\u4EF6
### SECONDARY PATTERNS & CONDITIONS

\`LOCKED\`

\u6700\u591A\u4E09\u5F20 conditional cards\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-numerology.md",role:"SECONDARY_PATTERNS_CONDITIONS",master:"M04"},{pageNumber:13,title:{"zh-Hans":"\u53EF\u7528\u4F18\u52BF\u4E0E\u8D44\u6E90",en:"AVAILABLE STRENGTHS & RESOURCES"},sourceText:`## 13\uFF5C\u53EF\u7528\u4F18\u52BF\u4E0E\u8D44\u6E90
### AVAILABLE STRENGTHS & RESOURCES

\`LOCKED\`

### \u5BA2\u6237\u95EE\u9898
> \u8FD9\u4E9B\u6570\u5B57\u7ED3\u6784\u5728\u4EC0\u4E48\u6761\u4EF6\u4E0B\u53EF\u4EE5\u6210\u4E3A\u53EF\u7528\u8D44\u6E90\uFF1F

\u4E3B\u89C6\u89C9\uFF1A
ranked resource cards\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-numerology.md",role:"AVAILABLE_STRENGTHS_RESOURCES",master:"M06"},{pageNumber:14,title:{"zh-Hans":"\u5F20\u529B\u4E0E\u6469\u64E6",en:"TENSIONS & FRICTION"},sourceText:`## 14\uFF5C\u5F20\u529B\u4E0E\u6469\u64E6
### TENSIONS & FRICTION

\`LOCKED\`

### \u5BA2\u6237\u95EE\u9898
> \u54EA\u4E9B\u6570\u5B57\u5173\u7CFB\u5728\u7279\u5B9A\u60C5\u51B5\u4E0B\u53EF\u80FD\u589E\u52A0\u73B0\u5B9E\u6210\u672C\uFF1F

\u4E3B\u89C6\u89C9\uFF1A
support vs tension matrix\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-numerology.md",role:"TENSIONS_FRICTION",master:"M05"},{pageNumber:15,title:{"zh-Hans":"\u81EA\u6211\u4E0E\u65B9\u5411",en:"SELF & DIRECTION"},sourceText:`## 15\uFF5C\u81EA\u6211\u4E0E\u65B9\u5411
### SELF & DIRECTION

\`LOCKED\`

### \u5BA2\u6237\u95EE\u9898
> \u6570\u5B57\u7ED3\u6784\u5982\u4F55\u63CF\u8FF0\u81EA\u6211\u7EC4\u7EC7\u4E0E\u957F\u671F\u65B9\u5411\u4E3B\u9898\uFF1F

\u4E3B\u89C6\u89C9\uFF1A

\`\`\`text
SELF
DIRECTION
EXPRESSION
DEVELOPMENT
\`\`\`

---`,sourcePath:"docs/guided-report-successor-r1/reference-numerology.md",role:"SELF_DIRECTION",master:"M06"},{pageNumber:16,title:{"zh-Hans":"\u5173\u7CFB\u4E0E\u4E92\u52A8",en:"RELATIONSHIPS & INTERACTION"},sourceText:`## 16\uFF5C\u5173\u7CFB\u4E0E\u4E92\u52A8
### RELATIONSHIPS & INTERACTION

\`LOCKED / CONDITIONAL\`

\u4EC5\u5F53\u5F53\u524D Numerology authority \u6709\u6B63\u5F0F\u5173\u7CFB\u89E3\u91CA\u3002

\u4E3B\u89C6\u89C9\uFF1A
interaction matrix\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-numerology.md",role:"RELATIONSHIPS_INTERACTION",master:"M05"},{pageNumber:17,title:{"zh-Hans":"\u5DE5\u4F5C\u4E0E\u53D1\u5C55",en:"WORK & DEVELOPMENT"},sourceText:`## 17\uFF5C\u5DE5\u4F5C\u4E0E\u53D1\u5C55
### WORK & DEVELOPMENT

\`LOCKED\`

### \u5BA2\u6237\u95EE\u9898
> \u54EA\u4E9B\u6570\u5B57\u4E3B\u9898\u4E0E\u5DE5\u4F5C\u65B9\u5F0F\u3001\u8F93\u51FA\u6216\u957F\u671F\u53D1\u5C55\u6709\u5173\uFF1F

\u4E3B\u89C6\u89C9\uFF1A
work pattern flow\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-numerology.md",role:"WORK_DEVELOPMENT",master:"M06"},{pageNumber:18,title:{"zh-Hans":"\u8D44\u6E90\u4E0E\u4EF7\u503C",en:"RESOURCES & VALUE"},sourceText:`## 18\uFF5C\u8D44\u6E90\u4E0E\u4EF7\u503C
### RESOURCES & VALUE

\`LOCKED / CONDITIONAL\`

\u5982\u679C\u6CA1\u6709\u771F\u6B63\u7684 resource authority\uFF0C\u6291\u5236\u3002

\u4E0D\u8981\u786C\u5199\u201C\u8D22\u5BCC\u6570\u5B57\u201D\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-numerology.md",role:"RESOURCES_VALUE",master:"M06"},{pageNumber:19,title:{"zh-Hans":"\u751F\u547D\u5468\u671F\u4E0E\u8282\u5F8B",en:"LIFE CYCLES & RHYTHM"},sourceText:`## 19\uFF5C\u751F\u547D\u5468\u671F\u4E0E\u8282\u5F8B
### LIFE CYCLES & RHYTHM

\`LOCKED\`

### \u5BA2\u6237\u95EE\u9898
> \u6570\u5B57\u5B66\u5982\u4F55\u7EC4\u7EC7\u4E0D\u540C\u9636\u6BB5\u7684\u65F6\u95F4\u53D8\u5316\uFF1F

\u4E3B\u89C6\u89C9\uFF1A
cycle timeline\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-numerology.md",role:"LIFE_CYCLES_RHYTHM",master:"M07"},{pageNumber:20,title:{"zh-Hans":"\u5F53\u524D\u5468\u671F",en:"CURRENT CYCLE"},sourceText:`## 20\uFF5C\u5F53\u524D\u5468\u671F
### CURRENT CYCLE

\`CONDITIONAL\`

\u53EA\u6709\u73B0\u6709 timing/cycle calculation \u5B58\u5728\u65F6\u3002

\u4E3B\u89C6\u89C9\uFF1A

\`\`\`text
BASELINE
\u2193
CURRENT CYCLE
\u2193
CURRENT EMPHASIS
\`\`\`

---`,sourcePath:"docs/guided-report-successor-r1/reference-numerology.md",role:"CURRENT_CYCLE",master:"M07"},{pageNumber:21,title:{"zh-Hans":"\u5F53\u524D\u73B0\u5B9E\u6BD4\u8F83",en:"CURRENT REALITY COMPARISON"},sourceText:`## 21\uFF5C\u5F53\u524D\u73B0\u5B9E\u6BD4\u8F83
### CURRENT REALITY COMPARISON

\`CONDITIONAL\`

### \u5BA2\u6237\u95EE\u9898
> \u5F53\u524D\u6570\u5B57\u5468\u671F\u6240\u5F3A\u8C03\u7684\u4E3B\u9898\uFF0C\u4E0E\u6211\u73B0\u5728\u7684\u73B0\u5B9E\u662F\u5426\u6709\u53EF\u89C2\u5BDF\u5173\u7CFB\uFF1F

\u4E3B\u89C6\u89C9\uFF1A

\`\`\`text
NUMERICAL PROJECTION
VS
CURRENT REALITY
\`\`\`

---`,sourcePath:"docs/guided-report-successor-r1/reference-numerology.md",role:"CURRENT_REALITY_COMPARISON",master:"M07"},{pageNumber:22,title:{"zh-Hans":"\u53EF\u89C2\u5BDF\u8BAF\u53F7",en:"OBSERVABLE SIGNALS"},sourceText:`## 22\uFF5C\u53EF\u89C2\u5BDF\u8BAF\u53F7
### OBSERVABLE SIGNALS

\`LOCKED\`

\u6700\u591A\u4E09\u6761\uFF1A

\`\`\`text
WHEN
WATCH FOR
COUNTER-SIGNAL
\`\`\`

---`,sourcePath:"docs/guided-report-successor-r1/reference-numerology.md",role:"OBSERVABLE_SIGNALS",master:"M08"},{pageNumber:23,title:{"zh-Hans":"\u73B0\u5B9E\u5BFC\u822A",en:"REALITY NAVIGATION"},sourceText:`## 23\uFF5C\u73B0\u5B9E\u5BFC\u822A
### REALITY NAVIGATION

\`LOCKED\`

\u4E3B\u89C6\u89C9\uFF1A

\`\`\`text
NOTICE
\u2193
COMPARE
\u2193
TRACK
\u2193
REVIEW
\`\`\`

---`,sourcePath:"docs/guided-report-successor-r1/reference-numerology.md",role:"REALITY_NAVIGATION",master:"M08"},{pageNumber:24,title:{"zh-Hans":"\u8BC1\u636E\u3001\u8FB9\u754C\u4E0E\u7ED3\u5C3E",en:"EVIDENCE, BOUNDARY & CLOSING"},sourceText:`## 24\uFF5C\u8BC1\u636E\u3001\u8FB9\u754C\u4E0E\u7ED3\u5C3E
### EVIDENCE, BOUNDARY & CLOSING

\`PAID\`

\u4E3B\u89C6\u89C9\uFF1A

\`\`\`text
INPUT
\u2193
NUMBER CALCULATION
\u2193
PATTERN PROJECTION
\u2193
INTERPRETATION
\u2193
CURRENT REALITY
\u2193
REPORT
\`\`\`

### \u4E2D\u6587\u56FA\u5B9A Closing

> \u8FD9\u4EFD\u6570\u5B57\u5B66\u62A5\u544A\u63D0\u4F9B\u7684\u662F\u4E00\u5F20\u5173\u4E8E\u6570\u5B57\u6A21\u5F0F\u3001\u5173\u7CFB\u4E0E\u5468\u671F\u7684\u7ED3\u6784\u56FE\uFF0C\u800C\u4E0D\u662F\u5BF9\u4F60\u7684\u6700\u7EC8\u5B9A\u4E49\u3002\u6570\u5B57\u53EF\u4EE5\u5E2E\u52A9\u538B\u7F29\u590D\u6742\u8D44\u6599\u3001\u89C2\u5BDF\u91CD\u590D\u4E0E\u53D8\u5316\uFF0C\u4F46\u771F\u6B63\u91CD\u8981\u7684\u662F\u54EA\u4E9B\u6A21\u5F0F\u80FD\u591F\u5728\u73B0\u5B9E\u4E2D\u88AB\u770B\u89C1\u3001\u54EA\u4E9B\u89E3\u91CA\u9700\u8981\u6761\u4EF6\uFF0C\u4EE5\u53CA\u54EA\u4E9B\u95EE\u9898\u4ECD\u7136\u5E94\u8BE5\u4FDD\u6301\u5F00\u653E\u3002

### English Closing

> This numerology report offers a structured map of numerical patterns, relationships, and cycles rather than a final definition of who you are. Numbers can compress complex information and make repetition or change easier to observe, but the important question remains which patterns are visible in Reality, which interpretations depend on conditions, and what should remain open.

---`,sourcePath:"docs/guided-report-successor-r1/reference-numerology.md",role:"EVIDENCE_BOUNDARY_CLOSING",master:"M08"}],humanReview:"PENDING",sourceRole:"USER_DESIGN_REFERENCE_NOT_NEW_METHOD_MEANING"},{methodId:"PROFILE",sourceConversation:"6aaa576d-03bc-83ec-a176-5f8885313c6f",pages:[{pageNumber:1,title:{"zh-Hans":"\u4E2A\u4EBA\u7ED3\u6784\u5B8C\u6574\u62A5\u544A",en:"PROFILE FULL REPORT"},sourceText:`## 01\uFF5C\u4E2A\u4EBA\u7ED3\u6784\u5B8C\u6574\u62A5\u544A
### PROFILE FULL REPORT

\`OPEN\`

\u5EF6\u7EED\u73B0\u6709 \`COM-REPORT-PROFILE-FULL\`\uFF1A

- purple
- ivory
- soft gold
- person-at-center
- evidence nodes
- network geometry

---`,sourcePath:"docs/guided-report-successor-r1/reference-profile.md",role:"PROFILE_FULL_REPORT",master:"M01"},{pageNumber:2,title:{"zh-Hans":"\u4EC0\u4E48\u662F PHI OS Profile\uFF1F",en:"WHAT IS THE PHI OS PROFILE?"},sourceText:`## 02\uFF5C\u4EC0\u4E48\u662F PHI OS Profile\uFF1F
### WHAT IS THE PHI OS PROFILE?

\`OPEN\`

\u56FA\u5B9A\u7A3F\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-profile.md",role:"WHAT_IS_THE_PHI_OS_PROFILE",master:"M02"},{pageNumber:3,title:{"zh-Hans":"\u4E3A\u4EC0\u4E48 PHI OS \u8981\u5EFA\u7ACB Profile\uFF1F",en:"WHY WAS THE PHI OS PROFILE BUILT?"},sourceText:`## 03\uFF5C\u4E3A\u4EC0\u4E48 PHI OS \u8981\u5EFA\u7ACB Profile\uFF1F
### WHY WAS THE PHI OS PROFILE BUILT?

\`OPEN\`

\u56FA\u5B9A\u7A3F\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-profile.md",role:"WHY_WAS_THE_PHI_OS_PROFILE_BUILT",master:"M02"},{pageNumber:4,title:{"zh-Hans":"PHI OS \u5982\u4F55\u4F7F\u7528 Profile\uFF1F",en:"HOW DOES PHI OS USE PROFILE EVIDENCE?"},sourceText:`## 04\uFF5CPHI OS \u5982\u4F55\u4F7F\u7528 Profile\uFF1F
### HOW DOES PHI OS USE PROFILE EVIDENCE?

\`OPEN\`

\u56FA\u5B9A\u7A3F\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-profile.md",role:"HOW_DOES_PHI_OS_USE_PROFILE_EVIDENCE",master:"M02"},{pageNumber:5,title:{"zh-Hans":"\u5982\u4F55\u9605\u8BFB\u8FD9\u4EFD\u62A5\u544A",en:"HOW TO READ THIS REPORT"},sourceText:`## 05\uFF5C\u5982\u4F55\u9605\u8BFB\u8FD9\u4EFD\u62A5\u544A
### HOW TO READ THIS REPORT

\`OPEN\`

Profile \u7684\u9605\u8BFB\u72B6\u6001\u5EFA\u8BAE\u6BD4\u5176\u4ED6\u65B9\u6CD5\u591A\u4E00\u4E2A\uFF1A

\`\`\`text id="profile-status">
DIRECT EVIDENCE
\u76F4\u63A5\u8BC1\u636E

INFERRED
\u63A8\u65AD

MULTI-SOURCE
\u591A\u6765\u6E90\u652F\u6301

CONTRADICTED
\u5B58\u5728\u51B2\u7A81

OPEN
\u4ECD\u5F85\u89C2\u5BDF
\`\`\`

\u8FD9\u91CC\u4E0D\u8981\u5F3A\u884C\u5957 \u201CCalculated\u201D\uFF0C\u56E0\u4E3A Profile \u4E0D\u4E00\u5B9A\u6765\u81EA deterministic calculation\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-profile.md",role:"HOW_TO_READ_THIS_REPORT",master:"M02"},{pageNumber:6,title:{"zh-Hans":"\u4F60\u7684 Profile \u603B\u89C8",en:"YOUR PROFILE SNAPSHOT"},sourceText:`## 06\uFF5C\u4F60\u7684 Profile \u603B\u89C8
### YOUR PROFILE SNAPSHOT

\`OPEN\`

### \u5BA2\u6237\u95EE\u9898
> \u5982\u679C\u53EA\u770B\u4E00\u9875\uFF0C\u76EE\u524D\u6700\u6709\u8BC1\u636E\u652F\u6301\u7684\u4E2A\u4EBA\u7ED3\u6784\u662F\u4EC0\u4E48\uFF1F

### \u4E3B\u89C6\u89C9
\u4E2D\u5FC3\u4EBA\u7269 / profile hub\u3002

\u5468\u56F4\uFF1A

\`\`\`text id="profile-overview">
CORE CONFIGURATION
\u6838\u5FC3\u7ED3\u6784

TOP SUPPORTED SIGNALS
\u6700\u5F3A\u652F\u6301\u4FE1\u53F7

CURRENT EVIDENCE SOURCES
\u5F53\u524D\u8BC1\u636E\u6765\u6E90

MAIN FRICTION
\u4E3B\u8981\u6469\u64E6

OPEN AREA
\u4ECD\u5F00\u653E\u9886\u57DF
\`\`\`

\u6700\u591A\u4E09\u6761\u7ED3\u8BBA\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-profile.md",role:"YOUR_PROFILE_SNAPSHOT",master:"M03"},{pageNumber:7,title:{"zh-Hans":"\u4F60\u7684\u8BC1\u636E\u6765\u6E90",en:"YOUR EVIDENCE SOURCES"},sourceText:`# 07\uFF5C\u4F60\u7684\u8BC1\u636E\u6765\u6E90
## YOUR EVIDENCE SOURCES

\`LOCKED\`

### \u5BA2\u6237\u95EE\u9898
> \u8FD9\u4EFD Profile \u5230\u5E95\u662F\u6839\u636E\u4EC0\u4E48\u5F62\u6210\u7684\uFF1F

### \u4E3B\u89C6\u89C9
Evidence source wheel\u3002

\u663E\u793A\u771F\u5B9E\u5B8C\u6210\u60C5\u51B5\uFF1A

\`\`\`text id="evidence-source">
QUICK PROFILE        \u2713
SELF ASSESSMENT      \u2713 / \u2014
BIG FIVE             \u2713 / \u2014
CAREER               \u2713 / \u2014
FINANCIAL            \u2713 / \u2014
EXTERNAL             \u2713 / \u2014
INFERENCE TASK       \u2713 / \u2014
\`\`\`

### \u91CD\u70B9
\u8FD9\u9875\u975E\u5E38\u91CD\u8981\uFF0C\u56E0\u4E3A\u5B83\u89E3\u91CA\u4E3A\u4EC0\u4E48\u67D0\u4E9B\u540E\u7EED\u6A21\u5757\u5B58\u5728\u3001\u67D0\u4E9B\u4E0D\u5B58\u5728\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-profile.md",role:"YOUR_EVIDENCE_SOURCES",master:"M08"},{pageNumber:8,title:{"zh-Hans":"\u8BC1\u636E\u5B8C\u6574\u5EA6",en:"EVIDENCE COVERAGE"},sourceText:`# 08\uFF5C\u8BC1\u636E\u5B8C\u6574\u5EA6
## EVIDENCE COVERAGE

\`LOCKED\`

### \u5BA2\u6237\u95EE\u9898
> \u54EA\u4E9B\u9886\u57DF\u8BC1\u636E\u8F83\u5B8C\u6574\uFF0C\u54EA\u4E9B\u9886\u57DF\u76EE\u524D\u53EA\u80FD\u6682\u65F6\u5224\u65AD\uFF1F

### \u4E3B\u89C6\u89C9
Coverage matrix\u3002

\u4E0D\u662F\u201C\u4EBA\u683C\u51C6\u786E\u7387\u201D\u3002

\u5EFA\u8BAE\uFF1A

\`\`\`text id="coverage">
STRONG COVERAGE
MODERATE COVERAGE
LIMITED COVERAGE
OPEN
\`\`\`

---`,sourcePath:"docs/guided-report-successor-r1/reference-profile.md",role:"EVIDENCE_COVERAGE",master:"M08"},{pageNumber:9,title:{"zh-Hans":"\u516D\u7EF4\u7ED3\u6784\u5730\u56FE",en:"SIX-DOMAIN PROFILE MAP"},sourceText:`# 09\uFF5C\u516D\u7EF4\u7ED3\u6784\u5730\u56FE
## SIX-DOMAIN PROFILE MAP

\`CONDITIONAL / LOCKED\`

\u53EA\u6709\u73B0\u6709 Profile authority \u786E\u8BA4\u516D\u4E2A canonical domains \u65F6\u51FA\u73B0\u3002

### \u5BA2\u6237\u95EE\u9898
> \u4E0D\u540C\u4E2A\u4EBA\u7ED3\u6784\u9886\u57DF\u4E4B\u95F4\u600E\u6837\u5206\u5E03\uFF1F

### \u4E3B\u89C6\u89C9
Radar / radial / hex map\u3002

\u5FC5\u987B\u662F\u5B9E\u9645\u6570\u503C\u6216 governed signal strength\u3002

\u4E0D\u80FD fake radar\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-profile.md",role:"SIX_DOMAIN_PROFILE_MAP",master:"M04"},{pageNumber:10,title:{"zh-Hans":"\u6838\u5FC3\u7ED3\u6784",en:"CORE CONFIGURATION"},sourceText:`# 10\uFF5C\u6838\u5FC3\u7ED3\u6784
## CORE CONFIGURATION

\`LOCKED\`

### \u5BA2\u6237\u95EE\u9898
> \u628A\u6240\u6709\u73B0\u6709\u8BC1\u636E\u653E\u5728\u4E00\u8D77\uFF0C\u76EE\u524D\u6700\u6838\u5FC3\u7684\u7ED3\u6784\u662F\u4EC0\u4E48\uFF1F

### \u4E3B\u89C6\u89C9

\u4E2D\u592E Core Configuration\u3002

\u5468\u56F4\uFF1A

- strongest evidence
- supporting sources
- conditions
- open counterpoint

---`,sourcePath:"docs/guided-report-successor-r1/reference-profile.md",role:"CORE_CONFIGURATION",master:"M04"},{pageNumber:11,title:{"zh-Hans":"\u6700\u7A33\u5B9A\u7684\u6A21\u5F0F",en:"MOST CONSISTENT PATTERNS"},sourceText:`# 11\uFF5C\u6700\u7A33\u5B9A\u7684\u6A21\u5F0F
## MOST CONSISTENT PATTERNS

\`LOCKED\`

### \u5BA2\u6237\u95EE\u9898
> \u54EA\u4E9B\u4E3B\u9898\u5728\u591A\u4E2A\u6765\u6E90\u91CC\u91CD\u590D\u51FA\u73B0\uFF1F

### \u4E3B\u89C6\u89C9
Pattern cluster\u3002

\u4F8B\u5982\uFF1A

\`\`\`text id="pattern-cluster">
PATTERN A
3 sources

PATTERN B
2 sources

PATTERN C
1 strong source
\`\`\`

\u4E0D\u8981\u7528\u201C3 tests prove\u201D\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-profile.md",role:"MOST_CONSISTENT_PATTERNS",master:"M04"},{pageNumber:12,title:{"zh-Hans":"\u51B2\u7A81\u4E0E\u4E0D\u4E00\u81F4",en:"CONTRADICTIONS & DIFFERENCES"},sourceText:`# 12\uFF5C\u51B2\u7A81\u4E0E\u4E0D\u4E00\u81F4
## CONTRADICTIONS & DIFFERENCES

\`LOCKED\`

\u8FD9\u9875\u5BF9 Profile \u7279\u522B\u6709\u4EF7\u503C\u3002

### \u5BA2\u6237\u95EE\u9898
> \u54EA\u4E9B\u6D4B\u8BC4\u6216\u8BC1\u636E\u5BF9\u540C\u4E00\u4E2A\u4E3B\u9898\u7ED9\u51FA\u4E86\u4E0D\u540C\u4FE1\u53F7\uFF1F

### \u4E3B\u89C6\u89C9

\`\`\`text id="contradiction">
SOURCE A \u2192 Signal X
SOURCE B \u2192 Signal Y

        \u2193

CONTEXT?
STATE?
MEASUREMENT DIFFERENCE?
OPEN?
\`\`\`

PHI OS \u4E0D\u5E94\u8BE5\u628A\u51B2\u7A81\u81EA\u52A8\u5E73\u5747\u6389\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-profile.md",role:"CONTRADICTIONS_DIFFERENCES",master:"M04"},{pageNumber:13,title:{"zh-Hans":"\u53EF\u7528\u4F18\u52BF",en:"AVAILABLE STRENGTHS"},sourceText:`# 13\uFF5C\u53EF\u7528\u4F18\u52BF
## AVAILABLE STRENGTHS

\`LOCKED\`

### \u5BA2\u6237\u95EE\u9898
> \u54EA\u4E9B\u80FD\u529B\u6216\u503E\u5411\u76EE\u524D\u6709\u8F83\u5F3A\u8BC1\u636E\u652F\u6301\uFF1F

### \u4E3B\u89C6\u89C9
Ranked cards\u3002

\u6BCF\u4E2A\u5361\uFF1A

\`\`\`text id="strength-card">
SIGNAL
SOURCE SUPPORT
WHERE IT MAY HELP
BOUNDARY
\`\`\`

---`,sourcePath:"docs/guided-report-successor-r1/reference-profile.md",role:"AVAILABLE_STRENGTHS",master:"M04"},{pageNumber:14,title:{"zh-Hans":"\u6469\u64E6\u4E0E\u76F2\u70B9",en:"FRICTION & BLIND SPOTS"},sourceText:`# 14\uFF5C\u6469\u64E6\u4E0E\u76F2\u70B9
## FRICTION & BLIND SPOTS

\`LOCKED\`

### \u5BA2\u6237\u95EE\u9898
> \u54EA\u4E9B\u6A21\u5F0F\u53EF\u80FD\u5728\u67D0\u4E9B\u73AF\u5883\u4E2D\u589E\u52A0\u73B0\u5B9E\u6210\u672C\uFF1F

### \u4E3B\u89C6\u89C9
Friction map\u3002

\u4E0D\u80FD\u5199\u6210\u75C5\u7406\u6807\u7B7E\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-profile.md",role:"FRICTION_BLIND_SPOTS",master:"M04"},{pageNumber:15,title:{"zh-Hans":"\u81EA\u6211\u7EC4\u7EC7\u4E0E\u51B3\u7B56",en:"SELF-ORGANIZATION & DECISION"},sourceText:`# 15\uFF5C\u81EA\u6211\u7EC4\u7EC7\u4E0E\u51B3\u7B56
## SELF-ORGANIZATION & DECISION

\`LOCKED\`

### \u5BA2\u6237\u95EE\u9898
> \u76EE\u524D\u8BC1\u636E\u663E\u793A\uFF0C\u6211\u503E\u5411\u600E\u6837\u7EC4\u7EC7\u4FE1\u606F\u4E0E\u505A\u51B3\u5B9A\uFF1F

### \u4E3B\u89C6\u89C9

\`\`\`text id="decision">
INPUT
\u2193
PROCESS
\u2193
DECISION
\u2193
REVIEW
\`\`\`

\u53EA\u6709\u6709\u76F8\u5173 evidence \u624D\u663E\u793A\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-profile.md",role:"SELF_ORGANIZATION_DECISION",master:"M06"},{pageNumber:16,title:{"zh-Hans":"\u5173\u7CFB\u4E0E\u4E92\u52A8",en:"RELATIONSHIPS & INTERACTION"},sourceText:`# 16\uFF5C\u5173\u7CFB\u4E0E\u4E92\u52A8
## RELATIONSHIPS & INTERACTION

\`CONDITIONAL\`

### \u5BA2\u6237\u95EE\u9898
> \u54EA\u4E9B\u4E92\u52A8\u6A21\u5F0F\u76EE\u524D\u6709\u8DB3\u591F\u8BC1\u636E\u652F\u6301\uFF1F

\u6765\u6E90\u53EF\u4EE5\u5305\u62EC\uFF1A

- self assessment
- Big Five
- inference
- external evidence

\u6CA1\u6709\u5219\u6291\u5236\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-profile.md",role:"RELATIONSHIPS_INTERACTION",master:"M05"},{pageNumber:17,title:{"zh-Hans":"\u804C\u4E1A\u5174\u8DA3",en:"CAREER INTEREST"},sourceText:`# 17\uFF5C\u804C\u4E1A\u5174\u8DA3
## CAREER INTEREST

\`CONDITIONAL\`

\u53EA\u6709 O*NET / RIASEC \u6216\u5F53\u524D career owner \u6709\u6570\u636E\u3002

### \u4E3B\u89C6\u89C9
Career interest wheel / ranked domains\u3002

### \u5185\u5BB9

- strongest interests
- supporting dimensions
- work-environment fit questions

\u4E0D\u662F\uFF1A

> \u4F60\u5E94\u8BE5\u505A\u67D0\u67D0\u804C\u4E1A\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-profile.md",role:"CAREER_INTEREST",master:"M06"},{pageNumber:18,title:{"zh-Hans":"\u5DE5\u4F5C\u65B9\u5F0F",en:"WORK STYLE"},sourceText:`# 18\uFF5C\u5DE5\u4F5C\u65B9\u5F0F
## WORK STYLE

\`CONDITIONAL\`

### \u5BA2\u6237\u95EE\u9898
> \u73B0\u6709\u8BC1\u636E\u5982\u4F55\u63CF\u8FF0\u6211\u7684\u5DE5\u4F5C\u8282\u594F\u3001\u4EFB\u52A1\u504F\u597D\u4E0E\u534F\u4F5C\u65B9\u5F0F\uFF1F

### \u4E3B\u89C6\u89C9
Work-style matrix\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-profile.md",role:"WORK_STYLE",master:"M06"},{pageNumber:19,title:{"zh-Hans":"Big Five / Personality Evidence",en:"BIG FIVE EVIDENCE"},sourceText:`# 19\uFF5CBig Five / Personality Evidence
## BIG FIVE EVIDENCE

\`CONDITIONAL\`

\u53EA\u6709\u5B8C\u6210 IPIP / admitted external Big Five \u624D\u663E\u793A\u3002

### \u4E3B\u89C6\u89C9
5-dimension bars / radar\u3002

\u5FC5\u987B\u663E\u793A\uFF1A

\`\`\`text id="bigfive-source">
SOURCE
instrument

DATE
if governed

PRECISION BOUNDARY
\`\`\`

---`,sourcePath:"docs/guided-report-successor-r1/reference-profile.md",role:"BIG_FIVE_EVIDENCE",master:"M08"},{pageNumber:20,title:{"zh-Hans":"\u8D22\u52A1\u80FD\u529B\u4E0E\u884C\u4E3A",en:"FINANCIAL CAPABILITY"},sourceText:`# 20\uFF5C\u8D22\u52A1\u80FD\u529B\u4E0E\u884C\u4E3A
## FINANCIAL CAPABILITY

\`CONDITIONAL\`

\u5982\u679C Financial Capability input \u5B58\u5728\u3002

### \u5BA2\u6237\u95EE\u9898
> \u5F53\u524D\u8D44\u6599\u5728\u91D1\u94B1\u7BA1\u7406\u3001\u89C4\u5212\u4E0E\u98CE\u9669\u76F8\u5173\u80FD\u529B\u4E0A\u663E\u793A\u4EC0\u4E48\uFF1F

### \u4E3B\u89C6\u89C9
Capability matrix\u3002

\u6CE8\u610F\uFF1A

\u4E0D\u662F\u8D22\u5BCC\u9884\u6D4B\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-profile.md",role:"FINANCIAL_CAPABILITY",master:"M04"},{pageNumber:21,title:{"zh-Hans":"\u5916\u90E8\u6D4B\u8BC4\u7ED3\u679C",en:"EXTERNAL RESULTS"},sourceText:`# 21\uFF5C\u5916\u90E8\u6D4B\u8BC4\u7ED3\u679C
## EXTERNAL RESULTS

\`CONDITIONAL\`

\u5982\u679C\u5BA2\u6237\u5BFC\u5165\uFF1A

- MBTI
- 16P
- external Big Five
- other admitted results

### \u4E3B\u89C6\u89C9
Source comparison\u3002

\u4E0D\u5141\u8BB8\uFF1A

\`\`\`text id="external">
MBTI says X
\u2192 PHI OS treats X as fact
\`\`\`

\u5FC5\u987B\u663E\u793A\uFF1A

> imported external source\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-profile.md",role:"EXTERNAL_RESULTS",master:"M04"},{pageNumber:22,title:{"zh-Hans":"\u8BC1\u636E\u6574\u5408",en:"EVIDENCE INTEGRATION"},sourceText:`# 22\uFF5C\u8BC1\u636E\u6574\u5408
## EVIDENCE INTEGRATION

\`LOCKED\`

### \u5BA2\u6237\u95EE\u9898
> \u6240\u6709\u73B0\u6709\u6765\u6E90\u653E\u5728\u4E00\u8D77\u540E\uFF0C\u54EA\u4E9B\u7ED3\u8BBA\u503C\u5F97\u4FDD\u7559\uFF1F

### \u4E3B\u89C6\u89C9

\`\`\`text id="integration">
SOURCE A \u2500\u2510
SOURCE B \u2500\u2524
SOURCE C \u2500\u2524
SOURCE D \u2500\u2518
          \u2193
SUPPORTED
CONDITIONAL
CONTRADICTED
OPEN
\`\`\`

\u8FD9\u662F Profile Paid Report \u7684\u9AD8\u4EF7\u503C\u6838\u5FC3\u9875\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-profile.md",role:"EVIDENCE_INTEGRATION",master:"M08"},{pageNumber:23,title:{"zh-Hans":"\u5F53\u524D\u73B0\u5B9E\u6BD4\u8F83",en:"CURRENT REALITY COMPARISON"},sourceText:`# 23\uFF5C\u5F53\u524D\u73B0\u5B9E\u6BD4\u8F83
## CURRENT REALITY COMPARISON

\`CONDITIONAL\`

\u5982\u679C\u5B58\u5728 Current Reality evidence\u3002

### \u5BA2\u6237\u95EE\u9898
> \u5F53\u524D\u7684 Profile \u7ED3\u6784\u4E0E\u6211\u73B0\u5728\u7684\u5B9E\u9645\u751F\u6D3B\u662F\u5426\u4E00\u81F4\uFF1F

\u4E3B\u89C6\u89C9\uFF1A

\`\`\`text id="profile-current">
PROFILE SIGNALS
        VS
CURRENT REALITY
\`\`\`

\u4E0D\u8981\u628A Profile \u7ED3\u679C\u5F53\u73B0\u5B9E\u771F\u503C\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-profile.md",role:"CURRENT_REALITY_COMPARISON",master:"M07"},{pageNumber:24,title:{"zh-Hans":"\u53EF\u89C2\u5BDF\u8BAF\u53F7",en:"OBSERVABLE SIGNALS"},sourceText:`# 24\uFF5C\u53EF\u89C2\u5BDF\u8BAF\u53F7
## OBSERVABLE SIGNALS

\`LOCKED\`

\u6700\u591A\u4E09\u6761\u771F\u6B63\u9AD8\u4EF7\u503C\u7684\uFF1A

\`\`\`text id="profile-signals">
IF...
OBSERVE...
COUNTER-SIGNAL...
\`\`\`

---`,sourcePath:"docs/guided-report-successor-r1/reference-profile.md",role:"OBSERVABLE_SIGNALS",master:"M08"},{pageNumber:25,title:{"zh-Hans":"\u73B0\u5B9E\u5BFC\u822A",en:"REALITY NAVIGATION"},sourceText:`# 25\uFF5C\u73B0\u5B9E\u5BFC\u822A
## REALITY NAVIGATION

\`LOCKED\`

### \u5BA2\u6237\u95EE\u9898
> \u54EA\u4E9B\u4E2A\u4EBA\u7ED3\u6784\u503C\u5F97\u5728\u73B0\u5B9E\u4E2D\u7EE7\u7EED\u9A8C\u8BC1\uFF1F

### \u4E3B\u89C6\u89C9

\`\`\`text id="profile-nav">
SUPPORTED
\u2193
TRY
\u2193
OBSERVE
\u2193
REVIEW
\u2193
UPDATE PROFILE
\`\`\`

\u8FD9\u91CC\u8981\u7A81\u51FA Profile \u662F**\u53EF\u66F4\u65B0**\u7684\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-profile.md",role:"REALITY_NAVIGATION",master:"M08"},{pageNumber:26,title:{"zh-Hans":"\u8BC1\u636E\u3001\u8FB9\u754C\u4E0E\u7ED3\u5C3E",en:"EVIDENCE, BOUNDARY & CLOSING"},sourceText:`# 26\uFF5C\u8BC1\u636E\u3001\u8FB9\u754C\u4E0E\u7ED3\u5C3E
## EVIDENCE, BOUNDARY & CLOSING

\`PAID\`

### \u4E3B\u89C6\u89C9

\`\`\`text id="profile-lineage">
ASSESSMENTS
+
TASKS
+
EXTERNAL RESULTS
+
CURRENT REALITY
        \u2193
EVIDENCE ENVELOPE
        \u2193
PROFILE SIGNALS
        \u2193
REPORT
\`\`\`

### \u4E2D\u6587\u56FA\u5B9A Closing

> \u8FD9\u4EFD Profile \u63CF\u8FF0\u7684\u662F\u76EE\u524D\u8BC1\u636E\u80FD\u591F\u652F\u6301\u7684\u4E2A\u4EBA\u7ED3\u6784\uFF0C\u800C\u4E0D\u662F\u4E00\u4E2A\u6C38\u4E45\u4E0D\u53D8\u7684\u8EAB\u4EFD\u5B9A\u4E49\u3002\u65B0\u7684\u7ECF\u9A8C\u3001\u65B0\u7684\u8BC4\u4F30\u4E0E\u73B0\u5B9E\u4E2D\u7684\u53CD\u4F8B\uFF0C\u90FD\u53EF\u80FD\u8BA9\u5176\u4E2D\u4E00\u4E9B\u7ED3\u8BBA\u53D8\u5F97\u66F4\u5F3A\u3001\u66F4\u5F31\uFF0C\u6216\u9700\u8981\u91CD\u65B0\u89E3\u91CA\u3002\u771F\u6B63\u6709\u4EF7\u503C\u7684 Profile\uFF0C\u4E0D\u662F\u628A\u4E00\u4E2A\u4EBA\u56FA\u5B9A\u4E0B\u6765\uFF0C\u800C\u662F\u8BA9\u4E2A\u4EBA\u7ED3\u6784\u59CB\u7EC8\u4FDD\u6301\u53EF\u89C2\u5BDF\u3001\u53EF\u6BD4\u8F83\u4E0E\u53EF\u4FEE\u8BA2\u3002

### English Closing

> This Profile describes the personal structure that the available evidence can currently support rather than a permanent definition of identity. New experience, additional assessments, and counter-evidence from Reality may strengthen, weaken, or revise parts of the picture. A useful Profile does not freeze a person into a label; it keeps personal structure observable, comparable, and open to revision.

---`,sourcePath:"docs/guided-report-successor-r1/reference-profile.md",role:"EVIDENCE_BOUNDARY_CLOSING",master:"M08"}],humanReview:"PENDING",sourceRole:"USER_DESIGN_REFERENCE_NOT_NEW_METHOD_MEANING"},{methodId:"ECR",sourceConversation:"6aaa576d-03bc-83ec-a176-5f8885313c6f",pages:[{pageNumber:1,title:{"zh-Hans":"PHI \u6784\u578B\u5B8C\u6574\u62A5\u544A",en:"ECR FULL REPORT"},sourceText:`## 01\uFF5CPHI \u6784\u578B\u5B8C\u6574\u62A5\u544A
### ECR FULL REPORT

\`OPEN\`

\u5EF6\u7EED \`COM-REPORT-ECR-FULL\`\uFF1A

- teal
- gold
- ivory
- orbit / node
- PHI Card
- structured runtime aesthetic

---`,sourcePath:"docs/guided-report-successor-r1/reference-ecr.md",role:"ECR_FULL_REPORT",master:"M01"},{pageNumber:2,title:{"zh-Hans":"\u4EC0\u4E48\u662F PHI \u6784\u578B\uFF1F",en:"WHAT IS PHI CONFIGURATION?"},sourceText:`## 02\uFF5C\u4EC0\u4E48\u662F PHI \u6784\u578B\uFF1F
### WHAT IS PHI CONFIGURATION?

\`OPEN\`

\u56FA\u5B9A\u7A3F\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-ecr.md",role:"WHAT_IS_PHI_CONFIGURATION",master:"M02"},{pageNumber:3,title:{"zh-Hans":"\u4E3A\u4EC0\u4E48 PHI OS \u8981\u5EFA\u7ACB PHI \u6784\u578B\uFF1F",en:"WHY WAS PHI CONFIGURATION BUILT?"},sourceText:`## 03\uFF5C\u4E3A\u4EC0\u4E48 PHI OS \u8981\u5EFA\u7ACB PHI \u6784\u578B\uFF1F
### WHY WAS PHI CONFIGURATION BUILT?

\`OPEN\`

\u56FA\u5B9A\u7A3F\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-ecr.md",role:"WHY_WAS_PHI_CONFIGURATION_BUILT",master:"M02"},{pageNumber:4,title:{"zh-Hans":"PHI OS \u5982\u4F55\u4F7F\u7528 PHI \u6784\u578B\uFF1F",en:"HOW DOES PHI OS USE PHI CONFIGURATION?"},sourceText:`## 04\uFF5CPHI OS \u5982\u4F55\u4F7F\u7528 PHI \u6784\u578B\uFF1F
### HOW DOES PHI OS USE PHI CONFIGURATION?

\`OPEN\`

\u56FA\u5B9A\u7A3F\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-ecr.md",role:"HOW_DOES_PHI_OS_USE_PHI_CONFIGURATION",master:"M02"},{pageNumber:5,title:{"zh-Hans":"\u5982\u4F55\u9605\u8BFB\u8FD9\u4EFD\u62A5\u544A",en:"HOW TO READ THIS REPORT"},sourceText:`## 05\uFF5C\u5982\u4F55\u9605\u8BFB\u8FD9\u4EFD\u62A5\u544A
### HOW TO READ THIS REPORT

\`OPEN\`

\u4E94\u72B6\u6001\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-ecr.md",role:"HOW_TO_READ_THIS_REPORT",master:"M02"},{pageNumber:6,title:{"zh-Hans":"\u4F60\u7684 PHI Card",en:"YOUR PHI CARD"},sourceText:`## 06\uFF5C\u4F60\u7684 PHI Card
### YOUR PHI CARD

\`OPEN\`

\u8FD9\u662F\u6574\u4E2A ECR \u7684 Free \u6838\u5FC3\u3002

### \u5BA2\u6237\u95EE\u9898
> \u5982\u679C\u53EA\u770B\u4E00\u9875\uFF0C\u6211\u7684\u6784\u578B\u6838\u5FC3\u662F\u4EC0\u4E48\uFF1F

### \u4E3B\u89C6\u89C9
\u5B8C\u6574 PHI Card\u3002

\u663E\u793A\uFF1A

- Core Question
- Capability Region
- Driver Priority
- Motion
- Configuration
- Activation

\u6700\u591A 3 \u6761\u6982\u89C8 insight\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-ecr.md",role:"YOUR_PHI_CARD",master:"M03"},{pageNumber:7,title:{"zh-Hans":"\u4F60\u7684\u6784\u578B\u603B\u89C8",en:"YOUR CONFIGURATION OVERVIEW"},sourceText:`# 07\uFF5C\u4F60\u7684\u6784\u578B\u603B\u89C8
## YOUR CONFIGURATION OVERVIEW

\`OPEN / PREVIEW\`

### \u5BA2\u6237\u95EE\u9898
> \u628A\u8FD9\u4E9B\u7EF4\u5EA6\u653E\u5728\u4E00\u8D77\u540E\uFF0C\u6574\u4F53\u7ED3\u6784\u662F\u4EC0\u4E48\uFF1F

### \u4E3B\u89C6\u89C9
Dashboard\uFF1A

\`\`\`text
QUESTION
REGION
DRIVER
MOTION
CONFIGURATION
ACTIVATION
\`\`\`

---`,sourcePath:"docs/guided-report-successor-r1/reference-ecr.md",role:"YOUR_CONFIGURATION_OVERVIEW",master:"M03"},{pageNumber:8,title:{"zh-Hans":"\u6838\u5FC3\u95EE\u9898",en:"CORE QUESTION"},sourceText:`# 08\uFF5C\u6838\u5FC3\u95EE\u9898
## CORE QUESTION

\`LOCKED\`

### \u5BA2\u6237\u95EE\u9898
> \u6211\u7684\u7ED3\u6784\u66F4\u5BB9\u6613\u56F4\u7ED5\u4EC0\u4E48\u6838\u5FC3\u95EE\u9898\u7EC4\u7EC7\uFF1F

### \u4E3B\u89C6\u89C9
Question architecture\u3002

\u4E0D\u662F\u4E00\u6BB5\u62BD\u8C61\u54F2\u5B66\u6587\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-ecr.md",role:"CORE_QUESTION",master:"M04"},{pageNumber:9,title:{"zh-Hans":"\u80FD\u529B\u533A\u57DF",en:"CAPABILITY REGION"},sourceText:`# 09\uFF5C\u80FD\u529B\u533A\u57DF
## CAPABILITY REGION

\`LOCKED\`

### \u5BA2\u6237\u95EE\u9898
> \u6211\u7684\u8FD0\u884C\u80FD\u529B\u66F4\u96C6\u4E2D\u5728\u54EA\u4E00\u4E2A\u533A\u57DF\uFF1F

### \u4E3B\u89C6\u89C9
Region map / ranked structural map\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-ecr.md",role:"CAPABILITY_REGION",master:"M04"},{pageNumber:10,title:{"zh-Hans":"\u9A71\u52A8\u4F18\u5148\u7EA7",en:"DRIVER PRIORITY"},sourceText:`# 10\uFF5C\u9A71\u52A8\u4F18\u5148\u7EA7
## DRIVER PRIORITY

\`LOCKED\`

### \u5BA2\u6237\u95EE\u9898
> \u54EA\u4E9B\u9A71\u52A8\u5728\u51FA\u751F\u57FA\u7EBF\u4E2D\u53D6\u5F97\u66F4\u9AD8\u7ED3\u6784\u4F18\u5148\u7EA7\uFF1F

### \u4E3B\u89C6\u89C9
Ranked bars / radial priority map\u3002

\u5FC5\u987B\u6E05\u695A\u5199\uFF1A

> Baseline priority \u2260 current Reality priority.

---`,sourcePath:"docs/guided-report-successor-r1/reference-ecr.md",role:"DRIVER_PRIORITY",master:"M04"},{pageNumber:11,title:{"zh-Hans":"\u8FD0\u52A8\u6A21\u5F0F",en:"MOTION"},sourceText:`# 11\uFF5C\u8FD0\u52A8\u6A21\u5F0F
## MOTION

\`LOCKED\`

### \u5BA2\u6237\u95EE\u9898
> \u8FD9\u4E2A\u7ED3\u6784\u503E\u5411\u600E\u6837\u53D1\u751F\u53D8\u5316\uFF1F

### \u4E3B\u89C6\u89C9
Motion flow / directional geometry\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-ecr.md",role:"MOTION",master:"M04"},{pageNumber:12,title:{"zh-Hans":"PHI \u6784\u578B",en:"PHI CONFIGURATION"},sourceText:`# 12\uFF5CPHI \u6784\u578B
## PHI CONFIGURATION

\`LOCKED\`

### \u5BA2\u6237\u95EE\u9898
> \u73AF\u5883\u4F18\u5148\u4F4D\u7F6E\u4E0E embodied response \u4E4B\u95F4\u5F62\u6210\u600E\u6837\u7684\u914D\u7F6E\uFF1F

### \u4E3B\u89C6\u89C9
Configuration map\u3002

\u5FC5\u987B\u4FDD\u7559\uFF1A

\`\`\`text
ENVIRONMENT PRIORITY
vs
EMBODIED RESPONSE POSITION
\`\`\`

\u4E0D\u80FD\u628A\u4E24\u8005\u538B\u6210\u4E00\u4E2A\u89E3\u91CA\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-ecr.md",role:"PHI_CONFIGURATION",master:"M04"},{pageNumber:13,title:{"zh-Hans":"\u6FC0\u6D3B\u9636\u6BB5",en:"ACTIVATION"},sourceText:`# 13\uFF5C\u6FC0\u6D3B\u9636\u6BB5
## ACTIVATION

\`LOCKED\`

### \u5BA2\u6237\u95EE\u9898
> \u8FD9\u4E2A\u6784\u578B\u76EE\u524D\u4F4D\u4E8E\u600E\u6837\u7684\u7ED3\u6784\u9636\u6BB5\uFF1F

### \u4E3B\u89C6\u89C9
Activation cycle / 8-stage ring\u3002

\u4E0D\u89E3\u91CA\u4E3A\uFF1A

- luck
- success
- guaranteed event

---`,sourcePath:"docs/guided-report-successor-r1/reference-ecr.md",role:"ACTIVATION",master:"M04"},{pageNumber:14,title:{"zh-Hans":"\u6838\u5FC3\u8FD0\u884C\u6A21\u5F0F",en:"PRIMARY RUNTIME PATTERN"},sourceText:`# 14\uFF5C\u6838\u5FC3\u8FD0\u884C\u6A21\u5F0F
## PRIMARY RUNTIME PATTERN

\`LOCKED\`

### \u5BA2\u6237\u95EE\u9898
> Question\u3001Driver\u3001Motion\u3001Configuration\u3001Activation \u653E\u5728\u4E00\u8D77\u540E\uFF0C\u6700\u6838\u5FC3\u7684\u8FD0\u884C\u6A21\u5F0F\u662F\u4EC0\u4E48\uFF1F

### \u4E3B\u89C6\u89C9
Central pattern map\u3002

\u5468\u56F4\u6700\u591A 4 \u4E2A supporting nodes\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-ecr.md",role:"PRIMARY_RUNTIME_PATTERN",master:"M04"},{pageNumber:15,title:{"zh-Hans":"\u6B21\u7EA7\u6A21\u5F0F\u4E0E\u6761\u4EF6",en:"SECONDARY PATTERNS & CONDITIONS"},sourceText:`# 15\uFF5C\u6B21\u7EA7\u6A21\u5F0F\u4E0E\u6761\u4EF6
## SECONDARY PATTERNS & CONDITIONS

\`LOCKED\`

\u6700\u591A\u4E09\u5F20 conditional cards\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-ecr.md",role:"SECONDARY_PATTERNS_CONDITIONS",master:"M04"},{pageNumber:16,title:{"zh-Hans":"\u53EF\u7528\u80FD\u529B\u4E0E\u8D44\u6E90",en:"AVAILABLE CAPABILITIES & RESOURCES"},sourceText:`# 16\uFF5C\u53EF\u7528\u80FD\u529B\u4E0E\u8D44\u6E90
## AVAILABLE CAPABILITIES & RESOURCES

\`LOCKED\`

### \u5BA2\u6237\u95EE\u9898
> \u54EA\u4E9B\u7ED3\u6784\u80FD\u529B\u53EF\u4EE5\u5728\u5408\u9002\u6761\u4EF6\u4E0B\u6210\u4E3A\u53EF\u4F7F\u7528\u8D44\u6E90\uFF1F

### \u4E3B\u89C6\u89C9
Capability cards\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-ecr.md",role:"AVAILABLE_CAPABILITIES_RESOURCES",master:"M06"},{pageNumber:17,title:{"zh-Hans":"\u7ED3\u6784\u538B\u529B\u4E0E\u6469\u64E6",en:"STRUCTURAL PRESSURE & FRICTION"},sourceText:`# 17\uFF5C\u7ED3\u6784\u538B\u529B\u4E0E\u6469\u64E6
## STRUCTURAL PRESSURE & FRICTION

\`LOCKED\`

### \u5BA2\u6237\u95EE\u9898
> \u54EA\u4E9B\u7EC4\u5408\u5728\u67D0\u4E9B\u6761\u4EF6\u4E0B\u53EF\u80FD\u589E\u52A0\u8FD0\u884C\u6210\u672C\uFF1F

### \u4E3B\u89C6\u89C9
Friction map\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-ecr.md",role:"STRUCTURAL_PRESSURE_FRICTION",master:"M04"},{pageNumber:18,title:{"zh-Hans":"\u8F7D\u4F53\u4E2D\u7684\u6784\u578B",en:"EMBODIED CONFIGURATION"},sourceText:`# 18\uFF5C\u8F7D\u4F53\u4E2D\u7684\u6784\u578B
## EMBODIED CONFIGURATION

\`CONDITIONAL + LOCKED\`

R1A \u9875\u3002

### \u5BA2\u6237\u95EE\u9898
> \u6211\u7684\u57FA\u7EBF\u6784\u578B\u5728\u5F53\u524D\u5B9E\u9645\u627F\u8F7D\u6761\u4EF6\u4E0B\u600E\u6837\u88AB\u652F\u6301\u6216\u9650\u5236\uFF1F

### \u5FC5\u9700\u8F93\u5165
\u72EC\u7ACB Carrier evidence\u3002

### \u4E3B\u89C6\u89C9

\`\`\`text
ECR BASELINE
\u2193
CARRIER CONDITIONS
\u2193
SUPPORT
CONSTRAINT
LOAD
RECOVERY
\`\`\`

\u6CA1\u6709\u72EC\u7ACB\u8BC1\u636E\u5219\u6574\u9875\u6291\u5236\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-ecr.md",role:"EMBODIED_CONFIGURATION",master:"M04"},{pageNumber:19,title:{"zh-Hans":"\u7ECF\u9A8C\u4E2D\u7684\u8868\u8FBE",en:"EXPERIENCE EXPRESSION"},sourceText:`# 19\uFF5C\u7ECF\u9A8C\u4E2D\u7684\u8868\u8FBE
## EXPERIENCE EXPRESSION

\`CONDITIONAL + LOCKED\`

### \u5BA2\u6237\u95EE\u9898
> \u8FD9\u5957\u8FD0\u884C\u7ED3\u6784\u5728\u5F53\u524D\u7ECF\u9A8C\u4E2D\u53EF\u80FD\u600E\u6837\u88AB\u611F\u53D7\u5230\u6216\u7EC4\u7EC7\uFF1F

### \u5FC5\u9700\u8F93\u5165
\u72EC\u7ACB experience evidence\u3002

### \u4E3B\u89C6\u89C9

\`\`\`text
RUNTIME
\u2193
SELECTION
\u2193
STABILIZATION
\u2193
PERSPECTIVE
\u2193
EXPERIENCE
\`\`\`

\u4E0D\u80FD\u4ECE ECR birth result \u76F4\u63A5\u63A8\u5BFC\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-ecr.md",role:"EXPERIENCE_EXPRESSION",master:"M04"},{pageNumber:20,title:{"zh-Hans":"\u5F53\u524D\u73B0\u5B9E\u6BD4\u8F83",en:"CURRENT REALITY COMPARISON"},sourceText:`# 20\uFF5C\u5F53\u524D\u73B0\u5B9E\u6BD4\u8F83
## CURRENT REALITY COMPARISON

\`CONDITIONAL + LOCKED\`

### \u5BA2\u6237\u95EE\u9898
> \u6211\u7684\u5F53\u524D\u73B0\u5B9E\u662F\u5426\u6B63\u5728\u8868\u73B0\u51FA\u51FA\u751F\u57FA\u7EBF\u4E2D\u7684\u4E3B\u9898\uFF1F

### \u4E3B\u89C6\u89C9

\`\`\`text
ECR BASELINE
        VS
CURRENT REALITY
\`\`\`

\u72B6\u6001\u6CBF shared Current Reality authority\uFF1A

- Currently Resonant
- Partially Resonant
- Currently Not Resonant
- Open

---`,sourcePath:"docs/guided-report-successor-r1/reference-ecr.md",role:"CURRENT_REALITY_COMPARISON",master:"M07"},{pageNumber:21,title:{"zh-Hans":"\u81EA\u6211\u4E0E\u65B9\u5411",en:"SELF & DIRECTION"},sourceText:`# 21\uFF5C\u81EA\u6211\u4E0E\u65B9\u5411
## SELF & DIRECTION

\`LOCKED\`

### \u5BA2\u6237\u95EE\u9898
> \u8FD9\u5957\u7ED3\u6784\u5982\u4F55\u53C2\u4E0E\u6211\u7684\u81EA\u6211\u7EC4\u7EC7\u4E0E\u65B9\u5411\u9009\u62E9\uFF1F

### \u4E3B\u89C6\u89C9
Self / direction map\u3002

\u53EA\u7528 admitted claim family\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-ecr.md",role:"SELF_DIRECTION",master:"M06"},{pageNumber:22,title:{"zh-Hans":"\u5173\u7CFB\u3001\u5DE5\u4F5C\u4E0E\u8D44\u6E90",en:"RELATIONSHIPS, WORK & RESOURCES"},sourceText:`# 22\uFF5C\u5173\u7CFB\u3001\u5DE5\u4F5C\u4E0E\u8D44\u6E90
## RELATIONSHIPS, WORK & RESOURCES

\`LOCKED / ADAPTIVE\`

ECR \u4E0D\u5E94\u8BE5\u4E3A\u4E86\u51D1\u4E09\u9875\u786C\u62C6\uFF1A

- relationship
- career
- money

\u5982\u679C\u5F53\u524D Topic authority\u8DB3\u591F\uFF0C\u53EF\u4EE5\u505A 3 mini-domain cards\uFF1A

\`\`\`text
RELATIONSHIPS
WORK
RESOURCES
\`\`\`

\u5982\u679C\u8BC1\u636E\u5C11\uFF0C\u4FDD\u6301\u4E00\u9875\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-ecr.md",role:"RELATIONSHIPS_WORK_RESOURCES",master:"M05"},{pageNumber:23,title:{"zh-Hans":"\u53EF\u89C2\u5BDF\u8BAF\u53F7",en:"OBSERVABLE SIGNALS"},sourceText:`# 23\uFF5C\u53EF\u89C2\u5BDF\u8BAF\u53F7
## OBSERVABLE SIGNALS

\`LOCKED\`

### \u5BA2\u6237\u95EE\u9898
> \u73B0\u5B9E\u4E2D\u4EC0\u4E48\u73B0\u8C61\u503C\u5F97\u6211\u7279\u522B\u89C2\u5BDF\uFF1F

\u6700\u591A\u4E09\u6761\uFF1A

\`\`\`text
WHEN
OBSERVE
COUNTER-SIGNAL
\`\`\`

---`,sourcePath:"docs/guided-report-successor-r1/reference-ecr.md",role:"OBSERVABLE_SIGNALS",master:"M08"},{pageNumber:24,title:{"zh-Hans":"\u673A\u4F1A\u3001\u98CE\u9669\u4E0E\u8FB9\u754C",en:"OPPORTUNITIES, RISKS & LIMITS"},sourceText:`# 24\uFF5C\u673A\u4F1A\u3001\u98CE\u9669\u4E0E\u8FB9\u754C
## OPPORTUNITIES, RISKS & LIMITS

\`LOCKED\`

### \u5BA2\u6237\u95EE\u9898
> \u8FD9\u4E2A\u7ED3\u6784\u5728\u54EA\u4E9B\u6761\u4EF6\u4E0B\u66F4\u5BB9\u6613\u6210\u4E3A\u8D44\u6E90\uFF0C\u5728\u54EA\u4E9B\u6761\u4EF6\u4E0B\u53EF\u80FD\u589E\u52A0\u6210\u672C\uFF1F

### \u4E3B\u89C6\u89C9
Opportunity / Risk / Condition matrix\u3002

\u4E0D\u662F\u5409\u51F6\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-ecr.md",role:"OPPORTUNITIES_RISKS_LIMITS",master:"M08"},{pageNumber:25,title:{"zh-Hans":"\u73B0\u5B9E\u5BFC\u822A",en:"REALITY NAVIGATION"},sourceText:`# 25\uFF5C\u73B0\u5B9E\u5BFC\u822A
## REALITY NAVIGATION

\`LOCKED\`

### \u5BA2\u6237\u95EE\u9898
> \u63A5\u4E0B\u6765\u6700\u503C\u5F97\u9A8C\u8BC1\u7684\u662F\u4EC0\u4E48\uFF1F

### \u4E3B\u89C6\u89C9

\`\`\`text
NOTICE
\u2193
COMPARE
\u2193
TEST
\u2193
REVIEW
\u2193
UPDATE
\`\`\`

ECR \u5728\u8FD9\u91CC\u6BD4\u4F20\u7EDF\u65B9\u6CD5\u66F4\u9002\u5408\u52A0\u5165\uFF1A

\`\`\`text
NEXT REALITY QUESTION
\`\`\`

---`,sourcePath:"docs/guided-report-successor-r1/reference-ecr.md",role:"REALITY_NAVIGATION",master:"M08"},{pageNumber:26,title:{"zh-Hans":"\u8BC1\u636E\u3001\u65B9\u6CD5\u8FB9\u754C\u4E0E\u7ED3\u5C3E",en:"EVIDENCE, METHOD BOUNDARY & CLOSING"},sourceText:`# 26\uFF5C\u8BC1\u636E\u3001\u65B9\u6CD5\u8FB9\u754C\u4E0E\u7ED3\u5C3E
## EVIDENCE, METHOD BOUNDARY & CLOSING

\`PAID\`

### \u4E3B\u89C6\u89C9

\`\`\`text
INPUT
\u2193
ECR CALCULATION
\u2193
PHI CARD
\u2193
ECR READING IR
\u2193
CONTEXTUAL EVIDENCE
\u2193
CURRENT REALITY
\u2193
REPORT
\`\`\`

### \u4E2D\u6587\u56FA\u5B9A Closing

> \u8FD9\u4EFD PHI \u6784\u578B\u62A5\u544A\u63CF\u8FF0\u7684\u662F\u4E00\u5957\u57FA\u7EBF\u8FD0\u884C\u7ED3\u6784\uFF0C\u4EE5\u53CA\u5728\u8BC1\u636E\u5141\u8BB8\u65F6\uFF0C\u8FD9\u5957\u7ED3\u6784\u4E0E\u8F7D\u4F53\u3001\u7ECF\u9A8C\u548C\u5F53\u524D\u73B0\u5B9E\u4E4B\u95F4\u53EF\u4EE5\u600E\u6837\u88AB\u6BD4\u8F83\u3002\u5B83\u4E0D\u662F\u5BF9\u4F60\u4EBA\u683C\u3001\u8EAB\u4F53\u6216\u672A\u6765\u7684\u6700\u7EC8\u5B9A\u4E49\u3002\u771F\u6B63\u6709\u4EF7\u503C\u7684\u90E8\u5206\uFF0C\u662F\u77E5\u9053\u54EA\u4E9B\u7ED3\u6784\u5DF2\u7ECF\u786E\u5B9A\u3001\u54EA\u4E9B\u89E3\u91CA\u9700\u8981\u6761\u4EF6\u3001\u54EA\u4E9B\u73B0\u5B9E\u53EF\u4EE5\u7EE7\u7EED\u89C2\u5BDF\uFF0C\u4EE5\u53CA\u65B0\u7684\u8BC1\u636E\u662F\u5426\u4F1A\u6539\u53D8\u4F60\u5BF9\u8FD9\u5F20\u6784\u578B\u56FE\u7684\u7406\u89E3\u3002

### English Closing

> This PHI Configuration report describes a baseline runtime structure and, where evidence allows, how that structure may be compared with embodiment, experience, and current Reality. It is not a final definition of your personality, body, or future. Its value lies in knowing what is structurally established, what remains conditional, what can be observed in Reality, and whether new evidence changes how the configuration should be understood.

---`,sourcePath:"docs/guided-report-successor-r1/reference-ecr.md",role:"EVIDENCE_METHOD_BOUNDARY_CLOSING",master:"M08"}],humanReview:"PENDING",sourceRole:"USER_DESIGN_REFERENCE_NOT_NEW_METHOD_MEANING"},{methodId:"HD",sourceConversation:"6aaa576d-03bc-83ec-a176-5f8885313c6f",pages:[{pageNumber:1,title:{"zh-Hans":"\u4EBA\u7C7B\u56FE\u5B8C\u6574\u62A5\u544A",en:"HUMAN DESIGN FULL REPORT"},sourceText:`## 01\uFF5C\u4EBA\u7C7B\u56FE\u5B8C\u6574\u62A5\u544A
### HUMAN DESIGN FULL REPORT

\`OPEN\`

\u5EF6\u7EED \`COM-REPORT-HD-FULL\`\uFF1A

- electric blue
- indigo
- violet-blue
- ivory
- gold
- center / channel geometry

---`,sourcePath:"docs/guided-report-successor-r1/reference-human-design.md",role:"HUMAN_DESIGN_FULL_REPORT",master:"M01"},{pageNumber:2,title:{"zh-Hans":"\u4EC0\u4E48\u662F\u4EBA\u7C7B\u56FE\uFF1F",en:"WHAT IS HUMAN DESIGN?"},sourceText:`## 02\uFF5C\u4EC0\u4E48\u662F\u4EBA\u7C7B\u56FE\uFF1F
### WHAT IS HUMAN DESIGN?

\`OPEN\`

\u56FA\u5B9A\u7A3F\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-human-design.md",role:"WHAT_IS_HUMAN_DESIGN",master:"M02"},{pageNumber:3,title:{"zh-Hans":"\u4EBA\u7C7B\u56FE\u5982\u4F55\u5F62\u6210\u5E76\u53D1\u5C55\uFF1F",en:"HOW DID HUMAN DESIGN EMERGE AND DEVELOP?"},sourceText:`## 03\uFF5C\u4EBA\u7C7B\u56FE\u5982\u4F55\u5F62\u6210\u5E76\u53D1\u5C55\uFF1F
### HOW DID HUMAN DESIGN EMERGE AND DEVELOP?

\`OPEN\`

\u56FA\u5B9A\u7A3F\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-human-design.md",role:"HOW_DID_HUMAN_DESIGN_EMERGE_AND_DEVELOP",master:"M02"},{pageNumber:4,title:{"zh-Hans":"PHI OS \u5982\u4F55\u4F7F\u7528\u4EBA\u7C7B\u56FE\uFF1F",en:"HOW DOES PHI OS USE HUMAN DESIGN?"},sourceText:`## 04\uFF5CPHI OS \u5982\u4F55\u4F7F\u7528\u4EBA\u7C7B\u56FE\uFF1F
### HOW DOES PHI OS USE HUMAN DESIGN?

\`OPEN\`

\u56FA\u5B9A\u7A3F\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-human-design.md",role:"HOW_DOES_PHI_OS_USE_HUMAN_DESIGN",master:"M02"},{pageNumber:5,title:{"zh-Hans":"\u5982\u4F55\u9605\u8BFB\u8FD9\u4EFD\u62A5\u544A",en:"HOW TO READ THIS REPORT"},sourceText:`## 05\uFF5C\u5982\u4F55\u9605\u8BFB\u8FD9\u4EFD\u62A5\u544A
### HOW TO READ THIS REPORT

\`OPEN\`

\u516D\u72B6\u6001\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-human-design.md",role:"HOW_TO_READ_THIS_REPORT",master:"M02"},{pageNumber:6,title:{"zh-Hans":"\u4F60\u7684\u8BBE\u8BA1\u603B\u89C8",en:"YOUR DESIGN SNAPSHOT"},sourceText:`# 06\uFF5C\u4F60\u7684\u8BBE\u8BA1\u603B\u89C8
## YOUR DESIGN SNAPSHOT

\`OPEN\`

### \u5BA2\u6237\u95EE\u9898
> \u5982\u679C\u6211\u53EA\u770B\u4E00\u9875\uFF0C\u6700\u9700\u8981\u5148\u77E5\u9053\u4EC0\u4E48\uFF1F

### \u4E3B\u89C6\u89C9

\u4E2D\u592E\uFF1A

\`\`\`text
TYPE
STRATEGY
AUTHORITY
PROFILE
DEFINITION
\`\`\`

\u4E0B\u9762\uFF1A

\`\`\`text
DEFINED CENTERS
OPEN / UNDEFINED CENTERS
PRIORITY CHANNELS
ADVANCED DATA STATUS
\`\`\`

\u6700\u591A\u4E09\u6761\u9AD8\u5C42 insight\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-human-design.md",role:"YOUR_DESIGN_SNAPSHOT",master:"M03"},{pageNumber:7,title:{"zh-Hans":"\u4F60\u7684\u7C7B\u578B",en:"YOUR TYPE"},sourceText:`# 07\uFF5C\u4F60\u7684\u7C7B\u578B
## YOUR TYPE

\`OPEN / PREVIEW\`

### \u5BA2\u6237\u95EE\u9898
> Type \u5728\u6574\u5957\u8BBE\u8BA1\u4E2D\u8D1F\u8D23\u56DE\u7B54\u4EC0\u4E48\uFF1F

### \u4E3B\u89C6\u89C9
Type architecture\u3002

\u4E0D\u662F\u4E00\u6574\u9875 Type \u6027\u683C\u63CF\u8FF0\u3002

\u4E09\u69FD\uFF1A

1. Structural meaning
2. Strategy relationship
3. What to observe

---`,sourcePath:"docs/guided-report-successor-r1/reference-human-design.md",role:"YOUR_TYPE",master:"M04"},{pageNumber:8,title:{"zh-Hans":"\u4F60\u7684\u7B56\u7565",en:"YOUR STRATEGY"},sourceText:`# 08\uFF5C\u4F60\u7684\u7B56\u7565
## YOUR STRATEGY

\`LOCKED\`

### \u5BA2\u6237\u95EE\u9898
> Strategy \u5728\u8FD9\u5957\u4F53\u7CFB\u4E2D\u63D0\u4F9B\u600E\u6837\u7684\u4E92\u52A8\u5165\u53E3\uFF1F

### \u4E3B\u89C6\u89C9

\`\`\`text
ENVIRONMENT / EVENT
        \u2193
STRATEGY
        \u2193
RESPONSE / ENTRY
        \u2193
OBSERVATION
\`\`\`

---`,sourcePath:"docs/guided-report-successor-r1/reference-human-design.md",role:"YOUR_STRATEGY",master:"M04"},{pageNumber:9,title:{"zh-Hans":"\u4F60\u7684\u5185\u5728\u6743\u5A01",en:"YOUR INNER AUTHORITY"},sourceText:`# 09\uFF5C\u4F60\u7684\u5185\u5728\u6743\u5A01
## YOUR INNER AUTHORITY

\`LOCKED\`

\u8FD9\u662F Premium Report \u6838\u5FC3\u9875\u4E4B\u4E00\u3002

### \u5BA2\u6237\u95EE\u9898
> \u8FD9\u5957 Human Design \u4F53\u7CFB\u5982\u4F55\u63CF\u8FF0\u4F60\u7684\u51B3\u7B56\u673A\u5236\uFF1F

### \u4E3B\u89C6\u89C9

Decision Flow\uFF1A

\`\`\`text
INPUT
\u2193
INTERNAL PROCESS
\u2193
WAIT / RESPONSE / CLARITY
\u2193
DECISION
\`\`\`

\u4F9D\u636E\u771F\u5B9E Authority\u3002

\u4E0D\u8981\u628A Authority \u53D8\u6210\u7EDD\u5BF9\u51B3\u7B56\u547D\u4EE4\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-human-design.md",role:"YOUR_INNER_AUTHORITY",master:"M04"},{pageNumber:10,title:{"zh-Hans":"Type \xD7 Strategy \xD7 Authority",en:"YOUR DECISION ARCHITECTURE"},sourceText:`# 10\uFF5CType \xD7 Strategy \xD7 Authority
## YOUR DECISION ARCHITECTURE

\`LOCKED\`

### \u5BA2\u6237\u95EE\u9898
> Type\u3001Strategy \u4E0E Authority \u653E\u5728\u4E00\u8D77\u540E\uFF0C\u51B3\u7B56\u7ED3\u6784\u662F\u4EC0\u4E48\uFF1F

### \u4E3B\u89C6\u89C9
\u4E09\u5C42 integration map\u3002

\u8FD9\u9875\u6BD4\u5355\u72EC\u4E09\u9875\u66F4\u6709\u4ED8\u8D39\u4EF7\u503C\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-human-design.md",role:"YOUR_DECISION_ARCHITECTURE",master:"M04"},{pageNumber:11,title:{"zh-Hans":"\u4F60\u7684 Profile",en:"YOUR HUMAN DESIGN PROFILE"},sourceText:`# 11\uFF5C\u4F60\u7684 Profile
## YOUR HUMAN DESIGN PROFILE

\`LOCKED\`

\u7279\u522B\u6807\u9898\u8981\u660E\u786E\uFF1A

**Human Design Profile**

\u4E0D\u662F PHI OS Profile\u3002

### \u5BA2\u6237\u95EE\u9898
> Profile \u5728 Human Design \u4E2D\u589E\u52A0\u4E86\u600E\u6837\u7684\u89D2\u8272\u4E0E\u4E92\u52A8\u5DEE\u5F02\uFF1F

### \u4E3B\u89C6\u89C9
\u4E24-line profile architecture\u3002

\u4F8B\u5982\uFF1A

\`\`\`text
CONSCIOUS ROLE
        \xD7
UNCONSCIOUS ROLE
\`\`\`

\u5B9E\u9645\u7528\u5F53\u524D HD authority\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-human-design.md",role:"YOUR_HUMAN_DESIGN_PROFILE",master:"M04"},{pageNumber:12,title:{"zh-Hans":"\u4F60\u7684 Definition",en:"YOUR DEFINITION"},sourceText:`# 12\uFF5C\u4F60\u7684 Definition
## YOUR DEFINITION

\`LOCKED\`

### \u5BA2\u6237\u95EE\u9898
> \u5DF2\u5B9A\u4E49\u7ED3\u6784\u662F\u600E\u6837\u8FDE\u63A5\u6210\u4E00\u4E2A\u6574\u4F53\u7684\uFF1F

### \u4E3B\u89C6\u89C9
Connected components map\u3002

\u5982\u679C\uFF1A

- single
- split
- triple split
- quadruple split

\u5219\u505A\u771F\u5B9E\u7ED3\u6784\u56FE\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-human-design.md",role:"YOUR_DEFINITION",master:"M04"},{pageNumber:13,title:{"zh-Hans":"\u4E5D\u4E2A\u4E2D\u5FC3\u603B\u89C8",en:"CENTERS OVERVIEW"},sourceText:`# 13\uFF5C\u4E5D\u4E2A\u4E2D\u5FC3\u603B\u89C8
## CENTERS OVERVIEW

\`LOCKED\`

### \u5BA2\u6237\u95EE\u9898
> \u54EA\u4E9B\u4E2D\u5FC3\u5177\u6709\u8F83\u7A33\u5B9A\u5B9A\u4E49\uFF0C\u54EA\u4E9B\u4E2D\u5FC3\u4FDD\u6301\u5F00\u653E\u6216\u672A\u5B9A\u4E49\uFF1F

### \u4E3B\u89C6\u89C9
\u5B8C\u6574 center-state map\u3002

\u8FD9\u91CC\u4E00\u5B9A\u8981\u9075\u5FAA\u5F53\u524D HD authority \u7684\u72B6\u6001\u533A\u5206\uFF0C\u4E0D\u80FD\u968F\u610F\u628A\u6240\u6709\u975E defined \u90FD\u53EB open\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-human-design.md",role:"CENTERS_OVERVIEW",master:"M03"},{pageNumber:14,title:{"zh-Hans":"\u5B9A\u4E49\u4E2D\u5FC3",en:"DEFINED CENTERS"},sourceText:`# 14\uFF5C\u5B9A\u4E49\u4E2D\u5FC3
## DEFINED CENTERS

\`LOCKED\`

### \u5BA2\u6237\u95EE\u9898
> \u54EA\u4E9B\u8FD0\u884C\u4E3B\u9898\u5728\u56FE\u8868\u7ED3\u6784\u4E2D\u8F83\u7A33\u5B9A\uFF1F

### \u4E3B\u89C6\u89C9
Defined center cluster\u3002

\u53EA\u4F18\u5148\u663E\u793A\u91CD\u8981\u4E2D\u5FC3\uFF0C\u4E0D\u8981\u5168\u90E8\u957F\u7BC7\u89E3\u91CA\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-human-design.md",role:"DEFINED_CENTERS",master:"M04"},{pageNumber:15,title:{"zh-Hans":"\u5F00\u653E / \u672A\u5B9A\u4E49\u4E2D\u5FC3",en:"OPEN & UNDEFINED CENTERS"},sourceText:`# 15\uFF5C\u5F00\u653E / \u672A\u5B9A\u4E49\u4E2D\u5FC3
## OPEN & UNDEFINED CENTERS

\`LOCKED\`

### \u5BA2\u6237\u95EE\u9898
> \u54EA\u4E9B\u533A\u57DF\u5728\u4F53\u7CFB\u4E2D\u88AB\u63CF\u8FF0\u4E3A\u66F4\u5BB9\u6613\u53D7\u5230\u5916\u754C\u6761\u4EF6\u5F71\u54CD\uFF1F

### \u4E3B\u89C6\u89C9

\`\`\`text
CENTER
EXTERNAL INPUT
AMPLIFICATION / VARIABILITY
OBSERVATION
\`\`\`

\u5FC5\u987B\u56FA\u5B9A\uFF1A

> Open / Undefined \u2260 weakness.

---`,sourcePath:"docs/guided-report-successor-r1/reference-human-design.md",role:"OPEN_UNDEFINED_CENTERS",master:"M04"},{pageNumber:16,title:{"zh-Hans":"\u4E2D\u5FC3\u4E4B\u95F4\u7684\u5173\u7CFB",en:"CENTER RELATIONSHIPS"},sourceText:`# 16\uFF5C\u4E2D\u5FC3\u4E4B\u95F4\u7684\u5173\u7CFB
## CENTER RELATIONSHIPS

\`LOCKED\`

### \u5BA2\u6237\u95EE\u9898
> \u4E2D\u5FC3\u4E0D\u662F\u72EC\u7ACB\u7684\uFF0C\u5B83\u4EEC\u5982\u4F55\u901A\u8FC7\u901A\u9053\u5F62\u6210\u6574\u4F53\u7ED3\u6784\uFF1F

### \u4E3B\u89C6\u89C9
Network\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-human-design.md",role:"CENTER_RELATIONSHIPS",master:"M05"},{pageNumber:17,title:{"zh-Hans":"\u4F18\u5148\u901A\u9053",en:"PRIORITY CHANNELS"},sourceText:`# 17\uFF5C\u4F18\u5148\u901A\u9053
## PRIORITY CHANNELS

\`LOCKED\`

### \u5BA2\u6237\u95EE\u9898
> \u54EA\u4E9B\u5B8C\u6574\u901A\u9053\u5BF9\u6574\u5F20\u56FE\u7684\u7ED3\u6784\u4FE1\u606F\u589E\u91CF\u6700\u9AD8\uFF1F

### \u4E3B\u89C6\u89C9
Priority channels only\u3002

\u6700\u591A\u5EFA\u8BAE\uFF1A

\`\`\`text
3\u20135 channels
\`\`\`

\u800C\u4E0D\u662F\u628A\u5168\u90E8 channel encyclopedia \u5316\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-human-design.md",role:"PRIORITY_CHANNELS",master:"M04"},{pageNumber:18,title:{"zh-Hans":"\u901A\u9053\u5173\u7CFB",en:"CHANNEL INTERACTION"},sourceText:`# 18\uFF5C\u901A\u9053\u5173\u7CFB
## CHANNEL INTERACTION

\`LOCKED\`

### \u5BA2\u6237\u95EE\u9898
> \u8FD9\u4E9B\u91CD\u8981\u901A\u9053\u4E4B\u95F4\u662F\u5426\u5F62\u6210\u91CD\u590D\u3001\u652F\u6301\u6216\u5F20\u529B\u4E3B\u9898\uFF1F

### \u4E3B\u89C6\u89C9
Channel network / theme clusters\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-human-design.md",role:"CHANNEL_INTERACTION",master:"M04"},{pageNumber:19,title:{"zh-Hans":"\u5173\u952E\u95F8\u95E8",en:"PRIORITY GATES"},sourceText:`# 19\uFF5C\u5173\u952E\u95F8\u95E8
## PRIORITY GATES

\`CONDITIONAL\`

### \u5BA2\u6237\u95EE\u9898
> \u54EA\u4E9B Gate \u771F\u6B63\u503C\u5F97\u4ECE\u6574\u5F20\u56FE\u91CC\u5355\u72EC\u62FF\u51FA\u6765\u8BFB\u53D6\uFF1F

### \u89C4\u5219
\u7EDD\u5BF9\u4E0D\u8981\uFF1A

\`\`\`text
64 Gates \u5168\u5C55\u5F00
\`\`\`

\u53EA\u663E\u793A\u5F53\u524D R3 priority selector \u9009\u51FA\u7684 findings\u3002

### \u4E3B\u89C6\u89C9
Gate orbit / ranked activations\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-human-design.md",role:"PRIORITY_GATES",master:"M04"},{pageNumber:20,title:{"zh-Hans":"\u884C\u661F\u6FC0\u6D3B\u7ED3\u6784",en:"PLANETARY ACTIVATIONS"},sourceText:`# 20\uFF5C\u884C\u661F\u6FC0\u6D3B\u7ED3\u6784
## PLANETARY ACTIVATIONS

\`CONDITIONAL\`

\u5982\u679C\u5F53\u524D HD production authority \u6709\u5B8C\u6574\u5408\u6CD5 activation data\u3002

### \u5BA2\u6237\u95EE\u9898
> \u4E0D\u540C\u884C\u661F\u4F4D\u7F6E\u5982\u4F55\u627F\u8F7D\u8FD9\u4E9B\u4F18\u5148 Gate\uFF1F

### \u4E3B\u89C6\u89C9

Planet \u2192 Design / Personality gate table + diagram\u3002

\u8FD9\u9875\u5F88\u9002\u5408 Premium HD\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-human-design.md",role:"PLANETARY_ACTIVATIONS",master:"M04"},{pageNumber:21,title:{"zh-Hans":"\u4EBA\u683C\u9762\u4E0E\u8BBE\u8BA1\u9762",en:"PERSONALITY & DESIGN"},sourceText:`# 21\uFF5C\u4EBA\u683C\u9762\u4E0E\u8BBE\u8BA1\u9762
## PERSONALITY & DESIGN

\`LOCKED\`

### \u5BA2\u6237\u95EE\u9898
> Human Design \u6240\u533A\u5206\u7684 conscious / unconscious layers \u5728\u56FE\u8868\u4E2D\u5982\u4F55\u5448\u73B0\uFF1F

### \u4E3B\u89C6\u89C9
Split visual\uFF1A

\`\`\`text
PERSONALITY
\u9ED1 / conscious

        VS

DESIGN
\u7EA2 / unconscious
\`\`\`

\u4FDD\u6301\u5F53\u524D\u54C1\u724C\u89C6\u89C9\uFF0C\u4E0D\u5FC5\u673A\u68B0\u590D\u5236\u4F20\u7EDF BodyGraph \u7EA2\u9ED1\u6837\u5F0F\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-human-design.md",role:"PERSONALITY_DESIGN",master:"M04"},{pageNumber:22,title:{"zh-Hans":"\u51B3\u7B56\u6D41\u7A0B",en:"DECISION FLOW"},sourceText:`# 22\uFF5C\u51B3\u7B56\u6D41\u7A0B
## DECISION FLOW

\`LOCKED\`

\u8FD9\u91CC\u6BD4\u7B2C 09 Authority \u66F4\u8FDB\u4E00\u6B65\u3002

### \u5BA2\u6237\u95EE\u9898
> \u5F53\u73B0\u5B9E\u95EE\u9898\u53D1\u751F\u65F6\uFF0C\u8FD9\u5957\u8BBE\u8BA1\u600E\u6837\u5F62\u6210\u4E00\u4E2A\u53EF\u89C2\u5BDF\u7684\u51B3\u7B56\u6D41\u7A0B\uFF1F

\u4E3B\u89C6\u89C9\uFF1A

\`\`\`text
EVENT
\u2193
TYPE ENTRY
\u2193
STRATEGY
\u2193
AUTHORITY
\u2193
TIME / CLARITY
\u2193
ACTION
\u2193
REVIEW
\`\`\`

---`,sourcePath:"docs/guided-report-successor-r1/reference-human-design.md",role:"DECISION_FLOW",master:"M04"},{pageNumber:23,title:{"zh-Hans":"Variables \u603B\u89C8",en:"VARIABLES OVERVIEW"},sourceText:`# 23\uFF5CVariables \u603B\u89C8
## VARIABLES OVERVIEW

\`CONDITIONAL\`

\u53EA\u6709\u6570\u636E\u5B58\u5728\u624D\u51FA\u73B0\u3002

### \u5BA2\u6237\u95EE\u9898
> \u8FDB\u9636\u53D8\u91CF\u4E3A\u6574\u5957\u8BBE\u8BA1\u589E\u52A0\u4E86\u54EA\u4E9B\u66F4\u7EC6\u7684\u5DEE\u5F02\uFF1F

### \u4E3B\u89C6\u89C9
Four-arrow / current canonical variable structure\u3002

\u4E0D\u8981\u8981\u6C42\u5BA2\u6237\u81EA\u5DF1\u61C2\uFF1A

\`\`\`text
DLLPLL
PRRDLR
\`\`\`

\u5FC5\u987B\u4F18\u5148\u663E\u793A\u81EA\u7136\u8BED\u8A00\u3002

\u6280\u672F\u4EE3\u7801\u53EA\u4F5C\u4E3A secondary traceability\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-human-design.md",role:"VARIABLES_OVERVIEW",master:"M03"},{pageNumber:24,title:{"zh-Hans":"Cognition",en:"COGNITION"},sourceText:`# 24\uFF5CCognition
## COGNITION

\`CONDITIONAL\`

### \u5BA2\u6237\u95EE\u9898
> \u4F53\u7CFB\u5982\u4F55\u63CF\u8FF0\u8EAB\u4F53\u4F18\u5148\u8BFB\u53D6\u73AF\u5883\u4FE1\u606F\u7684\u5165\u53E3\uFF1F

### \u4E3B\u89C6\u89C9
Sensory entry map\u3002

\u4E00\u5B9A\u907F\u514D\u628A\u5B83\u5F53\u533B\u5B66\u611F\u5B98\u4E8B\u5B9E\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-human-design.md",role:"COGNITION",master:"M04"},{pageNumber:25,title:{"zh-Hans":"Determination / Intake",en:"DETERMINATION"},sourceText:`# 25\uFF5CDetermination / Intake
## DETERMINATION

\`CONDITIONAL\`

### \u5BA2\u6237\u95EE\u9898
> Human Design \u7684\u8FDB\u9636\u4F53\u7CFB\u5982\u4F55\u63CF\u8FF0\u8F93\u5165\u4E0E\u6444\u53D6\u6761\u4EF6\uFF1F

\u4E3B\u89C6\u89C9\uFF1A
input-context diagram\u3002

\u4E0D\u80FD\u7ED9\u533B\u5B66\u996E\u98DF\u5EFA\u8BAE\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-human-design.md",role:"DETERMINATION",master:"M04"},{pageNumber:26,title:{"zh-Hans":"Environment",en:"ENVIRONMENT"},sourceText:`# 26\uFF5CEnvironment
## ENVIRONMENT

\`CONDITIONAL\`

### \u5BA2\u6237\u95EE\u9898
> \u4F53\u7CFB\u5982\u4F55\u63CF\u8FF0\u8F83\u9002\u5408\u89C2\u5BDF\u81EA\u5DF1\u7684\u73AF\u5883\u6761\u4EF6\uFF1F

### \u4E3B\u89C6\u89C9
Environment map\u3002

\u4F8B\u5982\uFF1A

\`\`\`text
STRUCTURE
SOCIAL DENSITY
MOVEMENT
BOUNDARY
\`\`\`

\u4F9D\u636E\u771F\u5B9E PHS data\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-human-design.md",role:"ENVIRONMENT",master:"M04"},{pageNumber:27,title:{"zh-Hans":"Perspective & Motivation",en:"PERSPECTIVE & MOTIVATION"},sourceText:`# 27\uFF5CPerspective & Motivation
## PERSPECTIVE & MOTIVATION

\`CONDITIONAL\`

### \u5BA2\u6237\u95EE\u9898
> \u4F53\u7CFB\u5982\u4F55\u63CF\u8FF0\u89C2\u770B\u4E16\u754C\u4E0E\u7EC4\u7EC7\u5FC3\u667A\u6CE8\u610F\u7684\u5DEE\u5F02\uFF1F

\u4E3B\u89C6\u89C9\uFF1A

\`\`\`text
PERSPECTIVE
        \u2193
WHAT GETS NOTICED

MOTIVATION
        \u2193
HOW ATTENTION IS ORGANIZED
\`\`\`

\u4E0D\u80FD\u53D8\u6210\uFF1A

> \u4F60\u7684\u4EBA\u751F\u771F\u6B63\u4F7F\u547D\u5C31\u662F\u2026\u2026

---`,sourcePath:"docs/guided-report-successor-r1/reference-human-design.md",role:"PERSPECTIVE_MOTIVATION",master:"M04"},{pageNumber:28,title:{"zh-Hans":"\u53EF\u89C2\u5BDF\u8BAF\u53F7",en:"OBSERVABLE SIGNALS"},sourceText:`# 28\uFF5C\u53EF\u89C2\u5BDF\u8BAF\u53F7
## OBSERVABLE SIGNALS

\`LOCKED\`

### \u5BA2\u6237\u95EE\u9898
> \u54EA\u4E9B\u73B0\u5B9E\u4FE1\u53F7\u6700\u503C\u5F97\u7528\u6765\u89C2\u5BDF\u8FD9\u5F20\u56FE\u662F\u5426\u5BF9\u4F60\u6709\u7528\uFF1F

\u6700\u591A 3\u20135 \u6761\u3002

\u56E0\u4E3A HD \u6BD4 RM39 \u62A5\u544A\u6DF1\uFF0C\u53EF\u4EE5\u5141\u8BB8\u6700\u591A 5 \u6761\uFF0C\u4F46\u4ECD\u7136\u8981 visual-first\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-human-design.md",role:"OBSERVABLE_SIGNALS",master:"M08"},{pageNumber:29,title:{"zh-Hans":"\u5F53\u524D\u73B0\u5B9E\u6BD4\u8F83",en:"CURRENT REALITY COMPARISON"},sourceText:`# 29\uFF5C\u5F53\u524D\u73B0\u5B9E\u6BD4\u8F83
## CURRENT REALITY COMPARISON

\`CONDITIONAL\`

### \u5BA2\u6237\u95EE\u9898
> Human Design \u6240\u63CF\u8FF0\u7684\u7ED3\u6784\uFF0C\u4E0E\u6211\u5F53\u524D\u771F\u5B9E\u8FD0\u884C\u662F\u5426\u4E00\u81F4\uFF1F

\u4E3B\u89C6\u89C9\uFF1A

\`\`\`text
HD BASELINE
        VS
CURRENT REALITY
\`\`\`

\u4E0D\u8981\u5199\uFF1A

> HD \u8BC1\u660E\u4F60\u73B0\u5728\u600E\u6837\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-human-design.md",role:"CURRENT_REALITY_COMPARISON",master:"M07"},{pageNumber:30,title:{"zh-Hans":"\u73B0\u5B9E\u5BFC\u822A",en:"REALITY NAVIGATION"},sourceText:`# 30\uFF5C\u73B0\u5B9E\u5BFC\u822A
## REALITY NAVIGATION

\`LOCKED\`

### \u5BA2\u6237\u95EE\u9898
> \u770B\u5B8C\u8FD9\u5F20\u8BBE\u8BA1\u56FE\u540E\uFF0C\u63A5\u4E0B\u6765\u6700\u503C\u5F97\u5B9E\u9645\u6D4B\u8BD5\u4EC0\u4E48\uFF1F

\u4E3B\u89C6\u89C9\uFF1A

\`\`\`text
NOTICE
\u2193
EXPERIMENT
\u2193
OBSERVE
\u2193
REVIEW
\`\`\`

\u8FD9\u91CC\u53EF\u4EE5\u4F7F\u7528 Human Design \u5E38\u89C1\u7684\u201Cexperiment\u201D\u601D\u60F3\uFF0C\u4F46 PHI OS \u5FC5\u987B\u4FDD\u7559\uFF1A

> customer decides.

---`,sourcePath:"docs/guided-report-successor-r1/reference-human-design.md",role:"REALITY_NAVIGATION",master:"M08"},{pageNumber:31,title:{"zh-Hans":"\u8BC1\u636E\u4E0E\u6280\u672F\u8FFD\u6EAF",en:"EVIDENCE & TECHNICAL TRACE"},sourceText:`# 31\uFF5C\u8BC1\u636E\u4E0E\u6280\u672F\u8FFD\u6EAF
## EVIDENCE & TECHNICAL TRACE

\`PAID\`

\u8FD9\u662F HD Premium \u5F88\u503C\u5F97\u62E5\u6709\u7684\u4E00\u9875\u3002

### \u4E3B\u89C6\u89C9
Technical lineage\uFF1A

\`\`\`text
Birth Data
\u2193
Chart Calculation
\u2193
Type / Centers / Channels / Gates
\u2193
Selected Findings
\u2193
Interpretation Units
\u2193
Report
\`\`\`

\u53EF\u4EE5\u9644\uFF1A

- source refs
- calculation version
- chart provider / internal calculation status
- manually confirmed fields

\u5BA2\u6237\u4E0D\u7528\u770B\u6E90\u7801\uFF0C\u4F46\u62A5\u544A\u4F1A\u660E\u663E\u66F4\u201C\u4E13\u4E1A\u201D\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-human-design.md",role:"EVIDENCE_TECHNICAL_TRACE",master:"M08"},{pageNumber:32,title:{"zh-Hans":"\u65B9\u6CD5\u8FB9\u754C\u4E0E\u7ED3\u5C3E",en:"METHOD BOUNDARY & CLOSING"},sourceText:`# 32\uFF5C\u65B9\u6CD5\u8FB9\u754C\u4E0E\u7ED3\u5C3E
## METHOD BOUNDARY & CLOSING

### \u4E2D\u6587\u56FA\u5B9A Closing

> \u8FD9\u4EFD Human Design \u62A5\u544A\u63D0\u4F9B\u7684\u662F\u4E00\u5F20\u5173\u4E8E\u7ED3\u6784\u3001\u51B3\u7B56\u3001\u4E2D\u5FC3\u5173\u7CFB\u4E0E\u8FDB\u9636\u53D8\u91CF\u7684\u4E2A\u4EBA\u8BBE\u8BA1\u89C6\u89D2\uFF0C\u800C\u4E0D\u662F\u5BF9\u4F60\u8EAB\u4F53\u3001\u4EBA\u683C\u6216\u672A\u6765\u7684\u6700\u7EC8\u5B9A\u4E49\u3002\u56FE\u8868\u53EF\u4EE5\u63D0\u51FA\u503C\u5F97\u5B9E\u9A8C\u4E0E\u89C2\u5BDF\u7684\u95EE\u9898\uFF0C\u4F46\u771F\u6B63\u6709\u4EF7\u503C\u7684\u90E8\u5206\uFF0C\u662F\u628A\u8FD9\u4E9B\u7ED3\u6784\u5E26\u56DE\u751F\u6D3B\uFF0C\u89C2\u5BDF\u54EA\u4E9B\u6A21\u5F0F\u6301\u7EED\u51FA\u73B0\u3001\u54EA\u4E9B\u53EA\u5728\u7279\u5B9A\u73AF\u5883\u4E0B\u51FA\u73B0\uFF0C\u4EE5\u53CA\u54EA\u4E9B\u89E3\u91CA\u5E76\u4E0D\u7B26\u5408\u4F60\u7684\u73B0\u5B9E\u3002

### English Closing

> This Human Design report offers a structured perspective on design, decision mechanics, Centers, relationships, and advanced Variables rather than a final definition of your body, personality, or future. The chart can suggest questions worth experimenting with and observing, but its value depends on returning those structures to lived Reality: noticing what consistently appears, what depends on context, and what interpretations do not fit your experience.

---`,sourcePath:"docs/guided-report-successor-r1/reference-human-design.md",role:"METHOD_BOUNDARY_CLOSING",master:"M08"}],humanReview:"PENDING",sourceRole:"USER_DESIGN_REFERENCE_NOT_NEW_METHOD_MEANING"},{methodId:"CROSS",sourceConversation:"6aaa576d-03bc-83ec-a176-5f8885313c6f",pages:[{pageNumber:1,title:{"zh-Hans":"\u4EA4\u53C9\u5B8C\u6574\u62A5\u544A",en:"CROSS FULL REPORT"},sourceText:`## 01\uFF5C\u4EA4\u53C9\u5B8C\u6574\u62A5\u544A
### CROSS FULL REPORT

\`OPEN\`

\u5EF6\u7EED \`COM-REPORT-CROSS-FULL\`\uFF1A

- ivory
- PHI OS gold
- multiple method accents
- orbital / node network
- central Cross structure

---`,sourcePath:"docs/guided-report-successor-r1/reference-cross.md",role:"CROSS_FULL_REPORT",master:"M01"},{pageNumber:2,title:{"zh-Hans":"\u4EC0\u4E48\u662F\u4EA4\u53C9\u8BFB\u53D6\uFF1F",en:"WHAT IS A CROSS READING?"},sourceText:`## 02\uFF5C\u4EC0\u4E48\u662F\u4EA4\u53C9\u8BFB\u53D6\uFF1F
### WHAT IS A CROSS READING?

\`OPEN\`

\u56FA\u5B9A\u7A3F\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-cross.md",role:"WHAT_IS_A_CROSS_READING",master:"M02"},{pageNumber:3,title:{"zh-Hans":"\u4E3A\u4EC0\u4E48 PHI OS \u8981\u5EFA\u7ACB Cross\uFF1F",en:"WHY WAS CROSS BUILT?"},sourceText:`## 03\uFF5C\u4E3A\u4EC0\u4E48 PHI OS \u8981\u5EFA\u7ACB Cross\uFF1F
### WHY WAS CROSS BUILT?

\`OPEN\`

\u56FA\u5B9A\u7A3F\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-cross.md",role:"WHY_WAS_CROSS_BUILT",master:"M02"},{pageNumber:4,title:{"zh-Hans":"PHI OS \u5982\u4F55\u4F7F\u7528 Cross\uFF1F",en:"HOW DOES PHI OS USE CROSS?"},sourceText:`## 04\uFF5CPHI OS \u5982\u4F55\u4F7F\u7528 Cross\uFF1F
### HOW DOES PHI OS USE CROSS?

\`OPEN\`

\u56FA\u5B9A\u7A3F\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-cross.md",role:"HOW_DOES_PHI_OS_USE_CROSS",master:"M02"},{pageNumber:5,title:{"zh-Hans":"\u5982\u4F55\u9605\u8BFB\u8FD9\u4EFD\u62A5\u544A",en:"HOW TO READ THIS REPORT"},sourceText:`## 05\uFF5C\u5982\u4F55\u9605\u8BFB\u8FD9\u4EFD\u62A5\u544A
### HOW TO READ THIS REPORT

\`OPEN\`

\u663E\u793A\u4E03\u79CD\u5173\u7CFB\u72B6\u6001\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-cross.md",role:"HOW_TO_READ_THIS_REPORT",master:"M02"},{pageNumber:6,title:{"zh-Hans":"\u672C\u6B21\u5B9E\u9645\u53C2\u4E0E\u7684\u65B9\u6CD5",en:"METHODS IN THIS READING"},sourceText:`# 06\uFF5C\u672C\u6B21\u5B9E\u9645\u53C2\u4E0E\u7684\u65B9\u6CD5
## METHODS IN THIS READING

\`OPEN\`

\u8FD9\u9875\u975E\u5E38\u91CD\u8981\u3002

### \u5BA2\u6237\u95EE\u9898
> \u8FD9\u6B21 Cross \u5230\u5E95\u7528\u4E86\u54EA\u4E9B\u62A5\u544A\uFF1F

### \u4E3B\u89C6\u89C9

\u771F\u5B9E\u65B9\u6CD5\u53C2\u4E0E\u56FE\uFF1A

\`\`\`text
ASTROLOGY      INCLUDED
BAZI           INCLUDED
ZI WEI         INCLUDED
NUMEROLOGY     INCLUDED
ECR            INCLUDED
HUMAN DESIGN   AVAILABLE / NOT ADMITTED / INCLUDED
PROFILE        AVAILABLE / NOT ADMITTED / INCLUDED
\`\`\`

\u4E0D\u80FD\u56E0\u4E3A\u5546\u54C1\u5C01\u9762\u51FA\u73B0\u4E03\u4E2A icon \u5C31\u5168\u90E8\u663E\u793A included\u3002

\u5F53\u524D\u5DE5\u7A0B\u72B6\u6001\u4E0B\uFF0CHD/Profile \u4ECD\u53EA\u662F\u5019\u9009\u800C\u4E0D\u662F\u6B63\u5F0F production Cross input\u3002:chatgpt-content-reference{index="1"}

---`,sourcePath:"docs/guided-report-successor-r1/reference-cross.md",role:"METHODS_IN_THIS_READING",master:"M04"},{pageNumber:7,title:{"zh-Hans":"\u6BCF\u4E2A\u65B9\u6CD5\u5E26\u6765\u4E86\u4EC0\u4E48\uFF1F",en:"WHAT DOES EACH METHOD CONTRIBUTE?"},sourceText:`# 07\uFF5C\u6BCF\u4E2A\u65B9\u6CD5\u5E26\u6765\u4E86\u4EC0\u4E48\uFF1F
## WHAT DOES EACH METHOD CONTRIBUTE?

\`OPEN / PREVIEW\`

### \u5BA2\u6237\u95EE\u9898
> \u4E3A\u4EC0\u4E48\u9700\u8981\u4E0D\u540C\u65B9\u6CD5\uFF0C\u5B83\u4EEC\u5404\u81EA\u63D0\u4F9B\u4EC0\u4E48\u4E0D\u540C\u4FE1\u606F\uFF1F

### \u4E3B\u89C6\u89C9

Method Contribution Cards\u3002

\u4F8B\u5982\uFF1A

\`\`\`text
BAZI
Structure + Timing

ASTROLOGY
Planetary / House Relationships

ZI WEI
Life Domains

NUMEROLOGY
Patterns + Cycles

ECR
Runtime Configuration
\`\`\`

\u5FC5\u987B\u6765\u81EA\u5F53\u524D authority\uFF0C\u4E0D\u80FD\u5199\u6210 generic marketing copy\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-cross.md",role:"WHAT_DOES_EACH_METHOD_CONTRIBUTE",master:"M04"},{pageNumber:8,title:{"zh-Hans":"\u4EA4\u53C9\u603B\u89C8",en:"CROSS SNAPSHOT"},sourceText:`# 08\uFF5C\u4EA4\u53C9\u603B\u89C8
## CROSS SNAPSHOT

\`OPEN\`

### \u5BA2\u6237\u95EE\u9898
> \u5982\u679C\u53EA\u770B\u4E00\u9875\uFF0C\u6240\u6709\u65B9\u6CD5\u653E\u5728\u4E00\u8D77\u540E\u6700\u503C\u5F97\u5173\u6CE8\u4EC0\u4E48\uFF1F

### \u4E3B\u89C6\u89C9

\u4E2D\u592E\uFF1A

\`\`\`text
TOP SHARED THEMES
\`\`\`

\u5468\u56F4\uFF1A

- Common
- Complementary
- Tension
- Context-dependent
- Open

\u6700\u591A 3 \u4E2A\u4F18\u5148\u4E3B\u9898\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-cross.md",role:"CROSS_SNAPSHOT",master:"M03"},{pageNumber:9,title:{"zh-Hans":"\u5171\u4EAB\u8BED\u4E49\u5730\u56FE",en:"SHARED SEMANTIC MAP"},sourceText:`# 09\uFF5C\u5171\u4EAB\u8BED\u4E49\u5730\u56FE
## SHARED SEMANTIC MAP

\`LOCKED\`

### \u5BA2\u6237\u95EE\u9898
> \u4E0D\u540C\u65B9\u6CD5\u5B9E\u9645\u4E0A\u5728\u54EA\u4E9B\u5171\u540C\u7EF4\u5EA6\u4E0A\u88AB\u6BD4\u8F83\uFF1F

### \u4E3B\u89C6\u89C9

\u73B0\u6709 shared semantic dimensions\u3002

\u4E0D\u8981\u81EA\u884C\u53D1\u660E\u65B0\u7EF4\u5EA6\u3002

\u53EF\u4EE5\u505A\uFF1A

\`\`\`text
SELF
RELATIONSHIP
WORK
RESOURCES
CHANGE
ENVIRONMENT
...
\`\`\`

\u5177\u4F53\u6807\u7B7E\u7531\u5F53\u524D Cross Registry \u51B3\u5B9A\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-cross.md",role:"SHARED_SEMANTIC_MAP",master:"M04"},{pageNumber:10,title:{"zh-Hans":"\u65B9\u6CD5\u8D21\u732E\u77E9\u9635",en:"METHOD CONTRIBUTION MATRIX"},sourceText:`# 10\uFF5C\u65B9\u6CD5\u8D21\u732E\u77E9\u9635
## METHOD CONTRIBUTION MATRIX

\`LOCKED\`

### \u5BA2\u6237\u95EE\u9898
> \u54EA\u4E2A\u65B9\u6CD5\u5728\u54EA\u4E9B\u7EF4\u5EA6\u771F\u6B63\u63D0\u4F9B\u4E86\u8BC1\u636E\uFF1F

### \u4E3B\u89C6\u89C9

\u77E9\u9635\uFF1A

| Dimension | AST | BZR | ZWR | NUM | ECR | HD | PROFILE |
|---|---|---|---|---|---|---|---|

\u4E0D\u662F \u2713 \u8D8A\u591A\u8D8A\u771F\u3002

\u53EA\u8868\u793A\uFF1A

\`\`\`text
HAS CONTRIBUTION
NO CONTRIBUTION
NOT ADMITTED
OPEN
\`\`\`

---`,sourcePath:"docs/guided-report-successor-r1/reference-cross.md",role:"METHOD_CONTRIBUTION_MATRIX",master:"M04"},{pageNumber:11,title:{"zh-Hans":"\u5171\u540C\u5F3A\u8C03",en:"COMMON"},sourceText:`# 11\uFF5C\u5171\u540C\u5F3A\u8C03
## COMMON

\`LOCKED\`

### \u5BA2\u6237\u95EE\u9898
> \u54EA\u4E9B\u4E3B\u9898\u88AB\u591A\u4E2A\u72EC\u7ACB\u65B9\u6CD5\u4EE5\u76F8\u8FD1\u65B9\u5F0F\u5F3A\u8C03\uFF1F

### \u4E3B\u89C6\u89C9
Convergence map\u3002

\u6BCF\u4E2A\u4E3B\u9898\u5FC5\u987B\u663E\u793A\uFF1A

\`\`\`text
Theme
Method refs
Claim refs
Boundary
\`\`\`

---`,sourcePath:"docs/guided-report-successor-r1/reference-cross.md",role:"COMMON",master:"M04"},{pageNumber:12,title:{"zh-Hans":"\u4E3A\u4EC0\u4E48\u5B83\u4EEC\u88AB\u5F52\u4E3A\u5171\u540C\uFF1F",en:"WHY ARE THESE THEMES COMMON?"},sourceText:`# 12\uFF5C\u4E3A\u4EC0\u4E48\u5B83\u4EEC\u88AB\u5F52\u4E3A\u5171\u540C\uFF1F
## WHY ARE THESE THEMES COMMON?

\`LOCKED\`

\u8FD9\u9875\u589E\u52A0\u89E3\u91CA\u900F\u660E\u5EA6\u3002

### \u5BA2\u6237\u95EE\u9898
> \u5B83\u4EEC\u662F\u771F\u7684\u8BF4\u4E86\u540C\u4E00\u4EF6\u4E8B\uFF0C\u8FD8\u662F\u53EA\u662F\u7528\u4E86\u76F8\u4F3C\u7684\u8BCD\uFF1F

### \u4E3B\u89C6\u89C9

\u4F8B\u5982\uFF1A

\`\`\`text
AST CLAIM
        \\
BZR CLAIM
         \u2192 SHARED DIMENSION
ECR CLAIM
\`\`\`

\u7136\u540E\u89E3\u91CA\uFF1A

\`\`\`text
SEMANTIC OVERLAP
NOT TEXT SIMILARITY
\`\`\`

\u8FD9\u662F RM299 \u5F88\u503C\u5F97\u6709\u7684\u4E00\u9875\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-cross.md",role:"WHY_ARE_THESE_THEMES_COMMON",master:"M04"},{pageNumber:13,title:{"zh-Hans":"\u4E92\u8865\u89C6\u89D2",en:"COMPLEMENTARY"},sourceText:`# 13\uFF5C\u4E92\u8865\u89C6\u89D2
## COMPLEMENTARY

\`LOCKED\`

### \u5BA2\u6237\u95EE\u9898
> \u54EA\u4E9B\u65B9\u6CD5\u4E0D\u662F\u8BF4\u540C\u4E00\u4EF6\u4E8B\uFF0C\u5374\u5171\u540C\u8865\u5168\u4E86\u4E00\u4E2A\u4E3B\u9898\uFF1F

### \u4E3B\u89C6\u89C9

Side-by-side\uFF1A

\`\`\`text
METHOD A
describes structure

METHOD B
describes timing

METHOD C
describes domain

        \u2193
BROADER PICTURE
\`\`\`

---`,sourcePath:"docs/guided-report-successor-r1/reference-cross.md",role:"COMPLEMENTARY",master:"M04"},{pageNumber:14,title:{"zh-Hans":"\u5F20\u529B\u4E0E\u5DEE\u5F02",en:"TENSION"},sourceText:`# 14\uFF5C\u5F20\u529B\u4E0E\u5DEE\u5F02
## TENSION

\`LOCKED\`

### \u5BA2\u6237\u95EE\u9898
> \u54EA\u4E9B\u65B9\u6CD5\u63D0\u4F9B\u4E86\u65E0\u6CD5\u76F4\u63A5\u5408\u5E76\u7684\u4E0D\u540C\u65B9\u5411\uFF1F

### \u4E3B\u89C6\u89C9
Tension graph\u3002

\u7EDD\u5BF9\u4E0D\u80FD\u81EA\u52A8\u88C1\u5B9A\u8C01\u5BF9\u8C01\u9519\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-cross.md",role:"TENSION",master:"M05"},{pageNumber:15,title:{"zh-Hans":"\u4E3A\u4EC0\u4E48\u4F1A\u51FA\u73B0\u5F20\u529B\uFF1F",en:"UNDERSTANDING TENSION"},sourceText:`# 15\uFF5C\u4E3A\u4EC0\u4E48\u4F1A\u51FA\u73B0\u5F20\u529B\uFF1F
## UNDERSTANDING TENSION

\`LOCKED\`

### \u5BA2\u6237\u95EE\u9898
> \u5DEE\u5F02\u6765\u81EA\u65B9\u6CD5\u4E0D\u540C\u3001\u65F6\u95F4\u4E0D\u540C\u3001\u8BC1\u636E\u4E0D\u540C\uFF0C\u8FD8\u662F\u73B0\u5B9E\u672C\u8EAB\u590D\u6742\uFF1F

### \u4E3B\u89C6\u89C9

\`\`\`text
POSSIBLE SOURCE OF TENSION

Different Method Scope
Different Timing Layer
Different Evidence
Different Context
Unknown
\`\`\`

\u8FD9\u9875\u4F1A\u8BA9 Cross \u4ECE\u201C\u7384\u5B66\u62FC\u63A5\u201D\u53D8\u6210\u771F\u6B63\u5206\u6790\u4EA7\u54C1\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-cross.md",role:"UNDERSTANDING_TENSION",master:"M05"},{pageNumber:16,title:{"zh-Hans":"\u60C5\u5883\u4F9D\u8D56",en:"CONTEXT-DEPENDENT"},sourceText:`# 16\uFF5C\u60C5\u5883\u4F9D\u8D56
## CONTEXT-DEPENDENT

\`LOCKED\`

### \u5BA2\u6237\u95EE\u9898
> \u54EA\u4E9B\u7ED3\u8BBA\u53EA\u6709\u5728\u7279\u5B9A\u6761\u4EF6\u4E0B\u624D\u80FD\u540C\u65F6\u6210\u7ACB\uFF1F

### \u4E3B\u89C6\u89C9
Conditional Matrix\uFF1A

\`\`\`text
IF A
\u2192 Pattern X

IF B
\u2192 Pattern Y
\`\`\`

---`,sourcePath:"docs/guided-report-successor-r1/reference-cross.md",role:"CONTEXT_DEPENDENT",master:"M04"},{pageNumber:17,title:{"zh-Hans":"\u5F00\u653E\u95EE\u9898",en:"OPEN"},sourceText:`# 17\uFF5C\u5F00\u653E\u95EE\u9898
## OPEN

\`LOCKED\`

### \u5BA2\u6237\u95EE\u9898
> \u54EA\u4E9B\u91CD\u8981\u95EE\u9898\u76EE\u524D\u6CA1\u6709\u4EFB\u4F55\u65B9\u6CD5\u63D0\u4F9B\u8DB3\u591F\u4F9D\u636E\uFF1F

### \u4E3B\u89C6\u89C9
Open nodes\u3002

\u8FD9\u9875\u5F88\u91CD\u8981\u3002

RM299 \u4EA7\u54C1\u4E0D\u5E94\u8BE5\u5047\u88C5\uFF1A

> \u4E70\u4E86 Cross \u5C31\u4EC0\u4E48\u90FD\u77E5\u9053\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-cross.md",role:"OPEN",master:"M04"},{pageNumber:18,title:{"zh-Hans":"\u81EA\u6211\u4E0E\u8EAB\u4EFD",en:"SELF & IDENTITY"},sourceText:`# 18\uFF5C\u81EA\u6211\u4E0E\u8EAB\u4EFD
## SELF & IDENTITY

\`LOCKED\`

### \u5BA2\u6237\u95EE\u9898
> \u4E0D\u540C\u65B9\u6CD5\u5982\u4F55\u4ECE\u5404\u81EA\u89D2\u5EA6\u63CF\u8FF0\u81EA\u6211\u7EC4\u7EC7\uFF1F

### \u4E3B\u89C6\u89C9
Cross-method matrix\u3002

\u4F8B\u5982\uFF1A

\`\`\`text
AST
BZR
ZI WEI
NUM
ECR
HD*
PROFILE*
\`\`\`

\u56F4\u7ED5\u540C\u4E00 shared dimension\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-cross.md",role:"SELF_IDENTITY",master:"M06"},{pageNumber:19,title:{"zh-Hans":"\u51B3\u7B56\u4E0E\u884C\u52A8",en:"DECISION & ACTION"},sourceText:`# 19\uFF5C\u51B3\u7B56\u4E0E\u884C\u52A8
## DECISION & ACTION

\`LOCKED / CONDITIONAL\`

\u5982\u679C\u73B0\u6709 Cross dimensions \u652F\u6301\u3002

\u7279\u522B\u9002\u5408 HD \u6B63\u5F0F\u51C6\u5165\u540E\u589E\u5F3A\u3002

### \u4E3B\u89C6\u89C9

\`\`\`text
STRUCTURE
\u2193
DECISION
\u2193
ACTION
\`\`\`

\u4E0D\u540C\u65B9\u6CD5\u8D21\u732E\u5206\u522B\u6807\u6CE8\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-cross.md",role:"DECISION_ACTION",master:"M04"},{pageNumber:20,title:{"zh-Hans":"\u5173\u7CFB",en:"RELATIONSHIPS"},sourceText:`# 20\uFF5C\u5173\u7CFB
## RELATIONSHIPS

\`LOCKED\`

### \u5BA2\u6237\u95EE\u9898
> \u5404\u65B9\u6CD5\u5728\u5173\u7CFB\u4E3B\u9898\u4E0A\u5206\u522B\u770B\u5230\u4EC0\u4E48\uFF1F

\u4E3B\u89C6\u89C9\uFF1A
Multi-method relationship matrix\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-cross.md",role:"RELATIONSHIPS",master:"M05"},{pageNumber:21,title:{"zh-Hans":"\u5BB6\u5EAD\u4E0E\u4EB2\u5BC6\u5173\u7CFB",en:"FAMILY & CLOSE RELATIONSHIPS"},sourceText:`# 21\uFF5C\u5BB6\u5EAD\u4E0E\u4EB2\u5BC6\u5173\u7CFB
## FAMILY & CLOSE RELATIONSHIPS

\`CONDITIONAL\`

\u5982\u679C\u6709\u8DB3\u591F\u591A\u65B9\u6CD5\u8D21\u732E\u3002

\u4E0D\u8981\u4E3A\u4E86 34 \u9875\u786C\u62C6\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-cross.md",role:"FAMILY_CLOSE_RELATIONSHIPS",master:"M05"},{pageNumber:22,title:{"zh-Hans":"\u4E8B\u4E1A\u4E0E\u5DE5\u4F5C",en:"CAREER & WORK"},sourceText:`# 22\uFF5C\u4E8B\u4E1A\u4E0E\u5DE5\u4F5C
## CAREER & WORK

\`LOCKED\`

### \u4E3B\u89C6\u89C9

\`\`\`text
DIRECTION
WORK STYLE
RESPONSIBILITY
EXPRESSION
\`\`\`

\u6BCF\u4E2A\u7ED3\u8BBA\u6807\u8BB0\u6765\u6E90\u65B9\u6CD5\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-cross.md",role:"CAREER_WORK",master:"M06"},{pageNumber:23,title:{"zh-Hans":"\u8D44\u6E90\u4E0E\u8D22\u5BCC",en:"RESOURCES & MONEY"},sourceText:`# 23\uFF5C\u8D44\u6E90\u4E0E\u8D22\u5BCC
## RESOURCES & MONEY

\`LOCKED\`

### \u5BA2\u6237\u95EE\u9898
> \u5404\u65B9\u6CD5\u5982\u4F55\u5206\u522B\u63CF\u8FF0\u8D44\u6E90\u3001\u4EF7\u503C\u3001\u627F\u8F7D\u4E0E\u8D22\u5BCC\u4E3B\u9898\uFF1F

\u4E3B\u89C6\u89C9\uFF1A
Cross-resource matrix\u3002

\u4E0D\u505A\uFF1A

> \u4E94\u4E2A\u7CFB\u7EDF\u90FD\u8BF4\u4F60\u4F1A\u53D1\u8D22\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-cross.md",role:"RESOURCES_MONEY",master:"M06"},{pageNumber:24,title:{"zh-Hans":"\u73AF\u5883\u4E0E\u627F\u8F7D",en:"ENVIRONMENT & CAPACITY"},sourceText:`# 24\uFF5C\u73AF\u5883\u4E0E\u627F\u8F7D
## ENVIRONMENT & CAPACITY

\`CONDITIONAL\`

ECR / HD / Profile \u6B63\u5F0F\u53C2\u4E0E\u540E\uFF0C\u8FD9\u4E00\u9875\u4F1A\u7279\u522B\u6709\u4EF7\u503C\u3002

### \u4E3B\u89C6\u89C9

\`\`\`text
STRUCTURE
\u2194 ENVIRONMENT
\u2194 CAPACITY
\u2194 LOAD
\`\`\`

---`,sourcePath:"docs/guided-report-successor-r1/reference-cross.md",role:"ENVIRONMENT_CAPACITY",master:"M04"},{pageNumber:25,title:{"zh-Hans":"\u65F6\u95F4\u4E0E\u53D8\u5316",en:"TIMING & CHANGE"},sourceText:`# 25\uFF5C\u65F6\u95F4\u4E0E\u53D8\u5316
## TIMING & CHANGE

\`LOCKED / CONDITIONAL\`

### \u5BA2\u6237\u95EE\u9898
> \u54EA\u4E9B\u65B9\u6CD5\u771F\u6B63\u6709 timing authority\uFF0C\u5B83\u4EEC\u7684\u65F6\u95F4\u8BED\u8A00\u5982\u4F55\u4E0D\u540C\uFF1F

### \u4E3B\u89C6\u89C9

Multi-layer timeline\uFF1A

\`\`\`text
BAZI timing
AST timing
ZI WEI timing
NUM cycle
ECR activation
\`\`\`

\u4E0D\u80FD\u628A\u4E0D\u540C\u65F6\u95F4\u7CFB\u7EDF\u5F3A\u884C\u5BF9\u9F50\u6210\u540C\u4E00\u4E2A\u65E5\u671F\u4E8B\u5B9E\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-cross.md",role:"TIMING_CHANGE",master:"M07"},{pageNumber:26,title:{"zh-Hans":"\u65F6\u95F4\u89C6\u89D2\u4E4B\u95F4\u662F\u5426\u4E00\u81F4\uFF1F",en:"TIMING RELATIONSHIPS"},sourceText:`# 26\uFF5C\u65F6\u95F4\u89C6\u89D2\u4E4B\u95F4\u662F\u5426\u4E00\u81F4\uFF1F
## TIMING RELATIONSHIPS

\`CONDITIONAL\`

### \u5BA2\u6237\u95EE\u9898
> \u4E0D\u540C\u65F6\u95F4\u7CFB\u7EDF\u662F\u5728\u5F3A\u8C03\u540C\u4E00\u9636\u6BB5\uFF0C\u8FD8\u662F\u63CF\u8FF0\u4E0D\u540C\u7C7B\u578B\u7684\u53D8\u5316\uFF1F

\u4E3B\u89C6\u89C9\uFF1A

\`\`\`text
METHOD A TIMING
METHOD B TIMING
METHOD C TIMING
        \u2193
COMMON WINDOW?
COMPLEMENTARY?
TENSION?
OPEN?
\`\`\`

\u8FD9\u9875\u5F88\u9AD8\u7EA7\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-cross.md",role:"TIMING_RELATIONSHIPS",master:"M05"},{pageNumber:27,title:{"zh-Hans":"\u5F53\u524D\u73B0\u5B9E\u6BD4\u8F83",en:"CURRENT REALITY COMPARISON"},sourceText:`# 27\uFF5C\u5F53\u524D\u73B0\u5B9E\u6BD4\u8F83
## CURRENT REALITY COMPARISON

\`CONDITIONAL\`

### \u5BA2\u6237\u95EE\u9898
> \u8FD9\u4E9B\u591A\u65B9\u6CD5\u4E3B\u9898\uFF0C\u4E0E\u6211\u73B0\u5728\u771F\u6B63\u7ECF\u5386\u7684\u73B0\u5B9E\u6709\u4EC0\u4E48\u5173\u7CFB\uFF1F

\u4E3B\u89C6\u89C9\uFF1A

\`\`\`text
CROSS SYNTHESIS
        VS
CURRENT REALITY
\`\`\`

Current Reality \u5FC5\u987B\u72EC\u7ACB\u4E8E\u65B9\u6CD5\u7ED3\u679C\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-cross.md",role:"CURRENT_REALITY_COMPARISON",master:"M07"},{pageNumber:28,title:{"zh-Hans":"\u54EA\u4E9B\u7ED3\u8BBA\u83B7\u5F97\u73B0\u5B9E\u652F\u6301\uFF1F",en:"REALITY-SUPPORTED THEMES"},sourceText:`# 28\uFF5C\u54EA\u4E9B\u7ED3\u8BBA\u83B7\u5F97\u73B0\u5B9E\u652F\u6301\uFF1F
## REALITY-SUPPORTED THEMES

\`CONDITIONAL\`

### \u5BA2\u6237\u95EE\u9898
> \u54EA\u4E9B Cross \u4E3B\u9898\u76EE\u524D\u6709\u73B0\u5B9E\u8BC1\u636E\u652F\u6301\uFF0C\u54EA\u4E9B\u8FD8\u6CA1\u6709\uFF1F

\u4E3B\u89C6\u89C9\uFF1A

\`\`\`text
SUPPORTED
PARTIAL
NOT CURRENTLY SUPPORTED
OPEN
\`\`\`

\u4E0D\u662F\u51C6\u786E\u7387\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-cross.md",role:"REALITY_SUPPORTED_THEMES",master:"M04"},{pageNumber:29,title:{"zh-Hans":"\u6700\u503C\u5F97\u5173\u6CE8\u7684\u4E3B\u9898",en:"PRIORITY THEMES"},sourceText:`# 29\uFF5C\u6700\u503C\u5F97\u5173\u6CE8\u7684\u4E3B\u9898
## PRIORITY THEMES

\`LOCKED\`

### \u5BA2\u6237\u95EE\u9898
> \u5982\u679C\u8FD9\u4EFD\u62A5\u544A\u53EA\u80FD\u7559\u4E0B\u4E09\u4E2A\u4E3B\u9898\uFF0C\u54EA\u4E9B\u6700\u503C\u5F97\u7EE7\u7EED\u89C2\u5BDF\uFF1F

### \u4E3B\u89C6\u89C9
Top 3 theme cards\u3002

\u6BCF\u5F20\u663E\u793A\uFF1A

\`\`\`text
Theme
Why it matters
Methods contributing
Current evidence
Boundary
\`\`\`

---`,sourcePath:"docs/guided-report-successor-r1/reference-cross.md",role:"PRIORITY_THEMES",master:"M04"},{pageNumber:30,title:{"zh-Hans":"\u6700\u5927\u7684\u5F20\u529B",en:"PRIMARY TENSION"},sourceText:`# 30\uFF5C\u6700\u5927\u7684\u5F20\u529B
## PRIMARY TENSION

\`LOCKED / CONDITIONAL\`

### \u5BA2\u6237\u95EE\u9898
> \u6574\u4EFD Cross \u4E2D\uFF0C\u6700\u5927\u7684\u7ED3\u6784\u5DEE\u5F02\u6216\u672A\u89E3\u51B3\u5F20\u529B\u662F\u4EC0\u4E48\uFF1F

### \u4E3B\u89C6\u89C9

\`\`\`text
PERSPECTIVE A
      \u2195
TENSION
      \u2195
PERSPECTIVE B
\`\`\`

\u8FD9\u4F1A\u6BD4\u6240\u6709\u65B9\u6CD5\u201C\u4E00\u81F4\u201D\u66F4\u6709\u4EF7\u503C\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-cross.md",role:"PRIMARY_TENSION",master:"M05"},{pageNumber:31,title:{"zh-Hans":"\u53EF\u89C2\u5BDF\u8BAF\u53F7",en:"OBSERVABLE SIGNALS"},sourceText:`# 31\uFF5C\u53EF\u89C2\u5BDF\u8BAF\u53F7
## OBSERVABLE SIGNALS

\`LOCKED\`

Cross \u53EF\u4EE5\u5141\u8BB8\u6700\u591A 5 \u6761\uFF0C\u4F46\u5FC5\u987B\u9AD8\u4FE1\u606F\u91CF\uFF1A

\`\`\`text
WHEN...
WATCH FOR...
METHODS INVOLVED...
COUNTER-EVIDENCE...
\`\`\`

---`,sourcePath:"docs/guided-report-successor-r1/reference-cross.md",role:"OBSERVABLE_SIGNALS",master:"M08"},{pageNumber:32,title:{"zh-Hans":"\u73B0\u5B9E\u5BFC\u822A",en:"REALITY NAVIGATION"},sourceText:`# 32\uFF5C\u73B0\u5B9E\u5BFC\u822A
## REALITY NAVIGATION

\`LOCKED\`

### \u5BA2\u6237\u95EE\u9898
> \u770B\u5B8C\u591A\u4E2A\u89C6\u89D2\u4E4B\u540E\uFF0C\u6211\u4E0B\u4E00\u6B65\u5E94\u8BE5\u89C2\u5BDF\u4EC0\u4E48\uFF0C\u800C\u4E0D\u662F\u76F8\u4FE1\u4EC0\u4E48\uFF1F

\u4E3B\u89C6\u89C9\uFF1A

\`\`\`text
PRIORITIZE
\u2193
OBSERVE
\u2193
COMPARE
\u2193
TEST
\u2193
REVIEW
\`\`\`

\u6700\u591A 3 \u4E2A next questions\u3002

---`,sourcePath:"docs/guided-report-successor-r1/reference-cross.md",role:"REALITY_NAVIGATION",master:"M08"},{pageNumber:33,title:{"zh-Hans":"\u8BC1\u636E\u4E0E\u6765\u6E90\u8FFD\u6EAF",en:"EVIDENCE & LINEAGE"},sourceText:`# 33\uFF5C\u8BC1\u636E\u4E0E\u6765\u6E90\u8FFD\u6EAF
## EVIDENCE & LINEAGE

\`PAID\`

RM299 \u4E00\u5B9A\u5E94\u8BE5\u6709\u8FD9\u4E00\u9875\u3002

### \u4E3B\u89C6\u89C9

\`\`\`text
METHOD READING
        \u2193
METHOD CLAIMS
        \u2193
CROSS DIMENSION
        \u2193
RELATIONSHIP CLASS
        \u2193
CROSS CLAIM
\`\`\`

\u5BA2\u6237\u53EF\u4EE5\u770B\u5230\uFF1A

- contributing methods
- claim count\uFF08\u4E0D\u80FD\u5F53 vote\uFF09
- source lineage
- conditions
- boundaries

---`,sourcePath:"docs/guided-report-successor-r1/reference-cross.md",role:"EVIDENCE_LINEAGE",master:"M08"},{pageNumber:34,title:{"zh-Hans":"\u53C2\u4E0E\u65B9\u6CD5\u3001\u8FB9\u754C\u4E0E\u7ED3\u5C3E",en:"PARTICIPATION, BOUNDARY & CLOSING"},sourceText:`# 34\uFF5C\u53C2\u4E0E\u65B9\u6CD5\u3001\u8FB9\u754C\u4E0E\u7ED3\u5C3E
## PARTICIPATION, BOUNDARY & CLOSING

\`PAID\`

\u660E\u786E\u5217\uFF1A

\`\`\`text
Included methods
Excluded methods
Candidate methods
Unavailable inputs
\`\`\`

### \u4E2D\u6587\u56FA\u5B9A Closing

> \u8FD9\u4EFD Cross Report \u5E76\u4E0D\u662F\u4E3A\u4E86\u8BA9\u591A\u4E2A\u65B9\u6CD5\u5171\u540C\u8BC1\u660E\u4E00\u4E2A\u7B54\u6848\uFF0C\u800C\u662F\u4E3A\u4E86\u8BA9\u4E0D\u540C\u89C6\u89D2\u4E4B\u95F4\u7684\u5173\u7CFB\u53D8\u5F97\u53EF\u89C1\u3002\u5171\u540C\u5F3A\u8C03\u503C\u5F97\u6CE8\u610F\uFF0C\u4E92\u8865\u4FE1\u606F\u53EF\u4EE5\u6269\u5927\u7406\u89E3\uFF0C\u5F20\u529B\u9700\u8981\u88AB\u4FDD\u7559\uFF0C\u60C5\u5883\u4F9D\u8D56\u4E0D\u80FD\u88AB\u7701\u7565\uFF0C\u800C\u5F00\u653E\u95EE\u9898\u4ECD\u7136\u53EF\u4EE5\u4FDD\u6301\u5F00\u653E\u3002\u6700\u7EC8\u8981\u51B3\u5B9A\u54EA\u4E9B\u89E3\u91CA\u771F\u6B63\u6709\u7528\uFF0C\u4ECD\u7136\u9700\u8981\u56DE\u5230\u4F60\u6B63\u5728\u7ECF\u5386\u7684\u73B0\u5B9E\u3002

### English Closing

> This Cross Report is not designed to make multiple methods prove a single answer. Its purpose is to make the relationships among perspectives visible. Common themes may deserve attention, complementary perspectives can broaden understanding, tensions should be preserved, contextual conditions should remain visible, and open questions are allowed to remain open. Whether any interpretation is genuinely useful still has to be tested against the Reality you are actually living.

---`,sourcePath:"docs/guided-report-successor-r1/reference-cross.md",role:"PARTICIPATION_BOUNDARY_CLOSING",master:"M08"}],humanReview:"PENDING",sourceRole:"USER_DESIGN_REFERENCE_NOT_NEW_METHOD_MEANING"}];var ye="GUIDED_REPORT_SUCCESSOR_R2",lr=Object.freeze({reportSchemaVersion:ye,visualSystemVersion:"2.0.0",composerPolicyVersion:"2.0.0",temporalPolicyVersion:"2.0.0",pageRegistryVersion:"2.0.0"}),St=n=>n.pageNumber<=6?"INTRO_EXISTING":n.master==="M07"?"TIMING":/CLOS|BOUNDARY/.test(n.role)?"CLOSURE":/NAVIGATION/.test(n.role)?"NAVIGATION":n.master==="M06"||n.master==="M08"?"DOMAIN_READING":"STRUCTURAL",dr=Object.freeze($e.map(n=>Object.freeze({method:n.methodId,totalPages:n.pages.length,pages:n.pages.map(r=>Object.freeze({method:n.methodId,pageKey:r.role,sequence:r.pageNumber,section:r.master,contentType:St(r),executionClass:r.pageNumber<=6?"T1_CANONICAL_ASSEMBLY":r.pageNumber<16?"T2_LIGHT_COMPOSITION":"T3_DEEP_COMPOSITION",requiredEvidence:["ADMITTED_METHOD_READING","SOURCE_BOUND_PAGE"],visualVariant:r.pageNumber===7?"P07_ENTRY_VARIANT":[16,20,25].includes(r.pageNumber)?"SECTION":"BODY",localeSupport:["zh-Hans","en"],pagination:r.pageNumber===1?"NONE":"GLOBAL",customerVisible:!0,fallbackPolicy:"CANONICAL_HUMANIZATION",title:r.title}))}))),he=Object.freeze(Object.fromEntries([["BZR","BaZi","\u516B\u5B57","LANDSCAPE_RINGS"],["ZWR","Zi Wei","\u7D2B\u5FAE\u6597\u6570","PALACE_GRID"],["AST","Astrology","\u5360\u661F","ORBITS"],["PROFILE","Profile","\u81EA\u6211\u753B\u50CF","LAYERS"],["NUM","Numerology","\u6570\u5B57\u5B66","SEQUENCE"],["ECR","ECR","\u5177\u8EAB\u73B0\u5B9E","FIELDS"],["HD","Human Design","\u4EBA\u7C7B\u56FE","CHANNELS"],["CROSS","Cross","\u7EFC\u5408\u8BFB\u53D6","INTERSECTIONS"]].map(([n,r,a,s])=>[n,Object.freeze({method:n,label:{en:r,"zh-Hans":a},bodyBackground:null,sectionBackground:null,motif:s,localeIndependent:!0,backgroundSafeArea:"CENTRAL_80_PERCENT",status:"VISUAL_ASSET_ENHANCEMENT_PENDING",fallback:"CSS_CANONICAL_PREMIUM",version:"2.0.0",accentTokens:["--phi-report-gold","--phi-report-navy"],diagramTokens:["--phi-report-gold-line"]})])));function De(n,r){if(!Number.isInteger(n)||!Number.isInteger(r)||n<1||n>r)throw Error("PUBLICATION_PAGINATION_INVALID");return n===1?"":`${String(n).padStart(2,"0")} / ${r}`}function He(n){if(n?.schemaVersion!==ye||n.customerPublishable!==!1||n.successorBaselineActivated!==!1)throw Error("PUBLICATION_CANDIDATE_GATE_REQUIRED");if(!he[n.methodId]||!["zh-Hans","en"].includes(n.locale))throw Error("PUBLICATION_METHOD_OR_LOCALE_INVALID");return n}function ve(n,r){let a=De(n,r);return a?`<span data-pagination-owner="GlobalReportPagination" aria-label="${e(a)}">${a}</span>`:""}function te(n){return[...n.querySelectorAll(".pub-page")].map(r=>{let a=!1;for(let s of["STANDARD","COMPACT","REFLOW"]){r.dataset.textFit=s;let i=r.getBoundingClientRect().bottom,l=r.querySelector("footer").getBoundingClientRect();if(a=r.scrollHeight<=r.clientHeight+2&&l.bottom<=i,a)break}return{pageNumber:Number(r.dataset.pageNumber),variant:r.dataset.textFit,fits:a}})}function Me(n){let r={LANDSCAPE_RINGS:'<path d="M0 270L70 190 130 240 210 120 300 245 390 155 480 270 600 180 720 280V340H0Z"/><path d="M0 300L130 210 230 280 350 195 460 270 580 220 720 310V340H0Z"/>',PALACE_GRID:'<path d="M80 60H640V300H80ZM220 60V300M360 60V300M500 60V300M80 140H640M80 220H640"/>',ORBITS:'<ellipse cx="360" cy="170" rx="260" ry="90"/><ellipse cx="360" cy="170" rx="180" ry="130"/>',CHANNELS:'<path d="M200 80L520 80 360 280ZM200 80L360 170 520 80M360 170V280"/>',INTERSECTIONS:'<circle cx="280" cy="170" r="120"/><circle cx="440" cy="170" r="120"/>',LAYERS:'<path d="M90 250Q360 20 630 250M90 210Q360 -20 630 210M90 290Q360 60 630 290"/>',SEQUENCE:'<path d="M100 250L220 90 360 250 500 90 620 250"/>',FIELDS:'<ellipse cx="360" cy="170" rx="240" ry="130"/><ellipse cx="360" cy="170" rx="180" ry="95"/><ellipse cx="360" cy="170" rx="100" ry="50"/>'};return`<svg class="pub-motif" viewBox="0 0 720 340" aria-hidden="true" focusable="false">${r[n]||r.LAYERS}</svg>`}function _e(n){He(n);let{locale:r,totalPages:a,methodId:s}=n,i=he[s],l=(d,S)=>r==="en"?d:S,o=n.intro.map(d=>d.kind==="STATIC"?`<section class="pub-static" data-page-number="${d.pageNumber}" data-pagination-exception="APPROVED_BAKED_ASSET"><img src="${e(d.src)}" alt="${e(d.alt)}"></section>`:d.html).join(""),u=n.pages.map(d=>{if(d.pageFamily)return Ct(d,{locale:r,totalPages:a,skin:i,t:l});let S=d.facts.filter(I=>I.value!==void 0),m=d.primaryVisualHtml||(d.temporal?`<div class="pub-time"><span>${l("Observation date","\u89C2\u5BDF\u65E5\u671F")}<b>${e(d.temporal.date)}</b></span>${d.temporal.selectedLuck?`<span>${l("Luck cycle","\u5927\u8FD0")}<b>${e(d.temporal.selectedLuck)}</b></span>`:""}${d.temporal.annual?`<span>${l("Year pillar","\u6D41\u5E74")}<b>${e(d.temporal.annual)}</b></span>`:""}</div>`:S.length?`<div class="pub-facts" role="list">${S.slice(0,5).map(I=>`<div role="listitem"><b>${e(I.value)}</b><span>${e(I.label)}</span></div>`).join("")}</div>`:d.pageNumber===26?'<div class="pub-closing-mark" aria-hidden="true">\u25C7</div>':"");return`<section class="pub-page" data-page-number="${d.pageNumber}" data-page-key="${e(d.pageKey)}" data-variant="${d.visualVariant}" data-method-skin="${s}" data-text-fit="STANDARD">
  ${Me(i.motif)}<header class="pub-header"><span>PHI OS<small>${l("SEE DEEPER \xB7 LIVE CLEARER","\u770B\u89C1\u66F4\u6DF1 \xB7 \u6D3B\u51FA\u66F4\u6E05\u6670")}</small></span><span>${e(i.label[r])}<small>${l("PERSONAL READING","\u4E2A\u4EBA\u8BFB\u53D6")}</small></span></header>
  <div class="pub-heading"><p class="pub-section">${e(l({M04:"Structure & context",M05:"Balance & relationships",M06:"Your life in context",M07:"Time & experience",M08:"Observation & direction"}[d.section]||"Personal reading",{M04:"\u7ED3\u6784\u4E0E\u60C5\u5883",M05:"\u5E73\u8861\u4E0E\u8054\u7CFB",M06:"\u4EBA\u751F\u60C5\u5883",M07:"\u65F6\u95F4\u4E0E\u7ECF\u9A8C",M08:"\u89C2\u5BDF\u4E0E\u65B9\u5411"}[d.section]||"\u4E2A\u4EBA\u8BFB\u53D6"))}</p><h2>${e(d.title)}</h2>${d.lead?`<p class="pub-lead">${e(d.lead)}</p>`:""}</div>
  ${m?`<figure class="pub-visual" aria-label="${e(d.title)}">${m}</figure>`:""}
  <div class="pub-narrative">${d.paragraphs.map(I=>`<p>${e(I)}</p>`).join("")}</div>
  ${d.provenanceHighlights?.length?`<ul class="pub-provenance">${d.provenanceHighlights.map(I=>`<li>${e(I)}</li>`).join("")}</ul>`:""}
  ${d.observation||d.counterSignal?`<aside class="pub-reflection"><h3>${l("Bring it into experience","\u628A\u8BFB\u53D6\u5E26\u56DE\u7ECF\u9A8C")}</h3>${d.observation?`<p>${e(d.observation)}</p>`:""}${d.counterSignal?`<p>${e(d.counterSignal)}</p>`:""}</aside>`:""}
  <p class="pub-boundary">${e(d.boundary)}</p><footer class="pub-footer"><span>${l("Your life, in context.","\u5728\u60C5\u5883\u4E2D\u7406\u89E3\u4F60\u7684\u4EBA\u751F\u3002")}</span>${ve(d.pageNumber,a)}</footer></section>`}).join("");return`<article class="pub-report" lang="${r}" data-publication-version="2.0.0" data-method="${s}">${o}${u}</article>`}function At(n){let r=n.visualBinding||{},a=[[0,r.bodyUrl],[1,r.motifUrl],[2,n.pageFamily==="SECTION_OPENER_PAGE"?r.url:null]].filter(([,i])=>i),s=r.intensityByFamily?.[n.pageFamily]??.17;return`<div class="pub-decoration" aria-hidden="true">${a.map(([i,l])=>`<img data-decorative-layer="${i}" style="opacity:${i===1?.16:i===0&&n.pageFamily==="SECTION_OPENER_PAGE"?.22:s}" ${i===2?`data-fallback-sources="${e(JSON.stringify(r.candidates||[]))}"`:""} src="${e(l)}" alt="">`).join("")}</div>`}function gt(n){return`<svg class="pub-section-landscape" viewBox="0 0 800 600" aria-hidden="true"><circle cx="${600-Number(n)%3*45}" cy="240" r="46" fill="#cfb77e" opacity=".25"/><path d="M0 480 Q100 470 175 360 L260 425 350 310 445 420 530 355 655 450 800 330V600H0Z" fill="#bcc5c0" opacity=".48"/><path d="M0 555L110 445 200 485 330 390 430 505 550 460 640 410 800 520V600H0Z" fill="#8e9b93" opacity=".35"/><path d="M0 600Q120 500 260 555T550 530T800 575" fill="none" stroke="#b7975f" stroke-width="2"/><path d="M100 540Q280 505 410 548T760 555" fill="none" stroke="#b7975f" opacity=".65"/></svg>`}function Ct(n,{locale:r,totalPages:a,skin:s,t:i}){let l=n.pageFamily==="SECTION_OPENER_PAGE",o=n.heroPlacement||["hero-bottom","hero-right","hero-left","hero-full-fade"][(Number(n.sectionNumber)-1)%4],u=`<header class="pub-header"><span>PHI OS<small>${i("SEE DEEPER \xB7 LIVE CLEARER","\u770B\u89C1\u66F4\u6DF1 \xB7 \u6D3B\u51FA\u66F4\u6E05\u6670")}</small></span><span>${e(s.label[r])}<small>${e(n.sectionTitle[r])}</small></span></header>`,d=l?`<div class="pub-opener-heading"><span class="pub-section-number">${e(n.sectionNumber)}</span><h2 lang="zh-Hans">${e(n.sectionTitle["zh-Hans"])}</h2><p lang="en">${e(n.sectionTitle.en)}</p></div>`:`<div class="pub-heading"><p class="pub-section">${e(n.sectionNumber)} \xB7 ${e(n.sectionTitle[r])}</p><h2>${e(n.title)}</h2></div>`,S=n.temporal?`<dl class="pub-time"><div><dt>${i("Observation time","\u89C2\u5BDF\u65F6\u95F4")}</dt><dd>${e(n.temporal.date)}<small>${e(n.temporal.localTime||"")} \xB7 ${e(n.temporal.timezone)}</small></dd></div><div><dt>${i("Luck cycle","\u5927\u8FD0")}</dt><dd>${e(n.temporal.selectedLuck||i("Outside resolved range","\u8D85\u51FA\u5DF2\u89E3\u6790\u8303\u56F4"))}</dd></div><div><dt>${i("Year pillar","\u6D41\u5E74")}</dt><dd>${e(n.temporal.annual||i("Not admitted","\u672A\u83B7\u51C6"))}</dd></div></dl>`:"",m=n.items?.length?`<ol class="pub-insights">${n.items.map((T,E)=>`<li><span aria-hidden="true">${String(E+1).padStart(2,"0")}</span><p>${e(T)}</p></li>`).join("")}</ol>`:"",I=n.facts?.length?`<div class="pub-facts">${n.facts.map(T=>`<div><b>${e(T.value)}</b><span>${e(T.label)}</span></div>`).join("")}</div>`:"",$=n.observations?.length?`<aside class="pub-reflection"><h3>${n.sectionKey==="S08_TIMING"?i("Questions for this period","\u8FD9\u4E00\u9636\u6BB5\u7684\u89C2\u5BDF\u95EE\u9898"):i("Questions to consider","\u89C2\u5BDF\u95EE\u9898")}</h3>${n.observations.map(T=>`<p>${e(T)}</p>`).join("")}</aside>`:"";return`<section class="pub-page pub-family" data-page-number="${n.pageNumber}" data-page-key="${e(n.pageKey)}" data-page-family="${e(n.pageFamily)}" data-section="${e(n.sectionKey)}" data-hero-placement="${o}" data-body-variant="BODY_${["A","B","C"][(n.pageNumber-7)%3]}" data-text-fit="STANDARD">${At(n)}${l?gt(n.sectionNumber):Me(s.motif)}${u}${d}${n.primaryVisualHtml?`<figure class="pub-visual">${n.primaryVisualHtml}</figure>`:""}${S}${I}<div class="pub-narrative">${n.paragraphs.map(T=>`<p>${e(T)}</p>`).join("")}</div>${m}${$}${n.boundary?`<p class="pub-boundary">${e(n.boundary)}</p>`:""}<footer class="pub-footer"><span>${i("Your life, in context.","\u5728\u60C5\u5883\u4E2D\u7406\u89E3\u4F60\u7684\u4EBA\u751F\u3002")}</span>${ve(n.pageNumber,a)}</footer></section>`}async function xe(n){await Promise.all([...n.querySelectorAll(".pub-decoration img")].map(async r=>{let a=r.dataset.fallbackSources?JSON.parse(r.dataset.fallbackSources):[r.getAttribute("src")];for(let s of a)try{r.src=s,await r.decode();return}catch{}r.remove()}))}var bt=Object.freeze([["overview","Overview","\u603B\u89C8"],["chart","Chart","\u547D\u76D8"],["elements","Five Elements & Ten Gods","\u4E94\u884C\u4E0E\u5341\u795E"],["core","Core structure","\u6838\u5FC3\u7ED3\u6784"],["pattern","Pattern & balance","\u683C\u5C40\u4E0E\u5E73\u8861"],["relationships","Relationships","\u5173\u7CFB\u7ED3\u6784"],["timing","Da Yun & Liu Nian","\u5927\u8FD0\u6D41\u5E74"],["themes","Life themes","\u4EBA\u751F\u4E3B\u9898"],["reality","Reality comparison","\u73B0\u5B9E\u5BF9\u7167"],["technical","Sources & technical","\u6765\u6E90\u6280\u672F"]]);var Pt=Object.freeze({JIA:"\u7532",YI:"\u4E59",BING:"\u4E19",DING:"\u4E01",WU:"\u620A",JI:"\u5DF1",GENG:"\u5E9A",XIN:"\u8F9B",REN:"\u58EC",GUI:"\u7678",ZI:"\u5B50",CHOU:"\u4E11",YIN:"\u5BC5",MAO:"\u536F",CHEN:"\u8FB0",SI:"\u5DF3",WEI:"\u672A",SHEN:"\u7533",YOU:"\u9149",XU:"\u620C",HAI:"\u4EA5"}),ft=n=>String(n??"").replace(/\b(JIA|YI|BING|DING|WU|JI|GENG|XIN|REN|GUI|ZI|CHOU|YIN|MAO|CHEN|SI|WEI|SHEN|YOU|XU|HAI)\b/g,r=>Pt[r]||r).replace(/Full Production/gi,"").replace(/Reading IR/gi,t("current chart reading","\u5F53\u524D\u547D\u76D8\u89E3\u8BFB")).replace(/semantic owners?/gi,t("whole-chart themes","\u6574\u76D8\u4E3B\u9898")).replace(/\badmitted\b/gi,t("established","\u5DF2\u5EFA\u7ACB")).replace(/\bauthority\b/gi,t("source basis","\u6765\u6E90\u4F9D\u636E")).replace(/\bgoverned\b/gi,t("current","\u5F53\u524D")).replace(/已准入/g,"\u5DF2\u5EFA\u7ACB").replace(/准入/g,"\u786E\u8BA4").replace(/受治理/g,"\u5F53\u524D").replace(/权威/g,"\u6765\u6E90\u4F9D\u636E").replace(/语义\s*owner/gi,"\u6574\u76D8\u4E3B\u9898").replace(/\bW\d+[A-Z0-9.-]*\b/gi,"").replace(/\s{2,}/g," ").trim();var Ar=Object.freeze({PEER:[["Peers & self-support","\u540C\u7C7B\u4E0E\u81EA\u6211\u652F\u6301"],["How you share strength, compete, cooperate and keep your own position.","\u89C2\u5BDF\u540C\u7C7B\u652F\u6301\u3001\u534F\u4F5C\u7ADE\u4E89\u4E0E\u81EA\u6211\u7ACB\u573A\u600E\u6837\u8FDB\u5165\u6574\u76D8\u3002"]],RESOURCE:[["Learning & support","\u5B66\u4E60\u4E0E\u652F\u6301"],["How the chart receives, absorbs, protects and turns support into capacity.","\u89C2\u5BDF\u5438\u6536\u3001\u5B66\u4E60\u3001\u652F\u6301\u4E0E\u627F\u63A5\u600E\u6837\u8FDB\u5165\u6574\u76D8\u3002"]],OUTPUT:[["Expression & output","\u8868\u8FBE\u4E0E\u8F93\u51FA"],["How ideas, skills, creation and outward expression leave the Day Master.","\u89C2\u5BDF\u60F3\u6CD5\u3001\u6280\u80FD\u3001\u521B\u9020\u4E0E\u8868\u8FBE\u600E\u6837\u4ECE\u65E5\u4E3B\u5411\u5916\u5C55\u5F00\u3002"]],WEALTH:[["Resources & exchange","\u8D44\u6E90\u4E0E\u4EA4\u6362"],["How the chart handles what the Day Master can manage, exchange or allocate.","\u89C2\u5BDF\u65E5\u4E3B\u80FD\u591F\u7BA1\u7406\u3001\u4EA4\u6362\u4E0E\u914D\u7F6E\u7684\u8D44\u6E90\u7ED3\u6784\u3002"]],OFFICER:[["Responsibility & rules","\u8D23\u4EFB\u4E0E\u89C4\u5219"],["How standards, pressure, responsibility and external structure act on the Day Master.","\u89C2\u5BDF\u6807\u51C6\u3001\u538B\u529B\u3001\u8D23\u4EFB\u4E0E\u5916\u90E8\u89C4\u5219\u600E\u6837\u4F5C\u7528\u4E8E\u65E5\u4E3B\u3002"]],UNAVAILABLE:[["Theme to be clarified","\u4E3B\u9898\u5F85\u7EE7\u7EED\u6838\u5BF9"],["This function needs more chart context before it becomes useful.","\u8FD9\u4E00\u529F\u80FD\u8FD8\u8981\u7ED3\u5408\u66F4\u591A\u547D\u76D8\u4FE1\u606F\u624D\u9002\u5408\u5C55\u5F00\u3002"]]});function Lt(){return`<div class="cx-bazi-w12-nav" aria-label="${e(t("BaZi reading sections","\u516B\u5B57\u89E3\u8BFB\u7AE0\u8282"))}">${bt.map(([n,r,a],s)=>`<button type="button" data-ppr-r3-nav-target="#bazi-section-${n}" aria-current="${s===0?"true":"false"}"><span>${String(s+1).padStart(2,"0")}</span><strong>${e(t(r,a))}</strong></button>`).join("")}</div>`}function $t(n){let r=c(n?.structuralModel?.pillars),a=r.find(o=>o.position==="DAY"),s=r.find(o=>o.position==="MONTH"),i=c(n?.professionalModules?.fiveElements?.items).slice().sort((o,u)=>u.rawRatio-o.rawRatio),l=i[0];return`<section id="bazi-section-overview" class="cx-bazi-w12-section cx-bazi-w12-overview" tabindex="-1"><header class="cx-bazi-w12-hero"><p class="cx-eyebrow">${e(t("BAZI \xB7 YOUR CHART","\u516B\u5B57 \xB7 \u4F60\u7684\u547D\u76D8"))}</p><h1>${e(t("Start with the few structures that organize the whole chart.","\u5148\u6293\u4F4F\u771F\u6B63\u7EC4\u7EC7\u6574\u5F20\u547D\u76D8\u7684\u51E0\u4E2A\u91CD\u70B9\u3002"))}</h1><p class="cx-bazi-w12-subtitle">${e(t("The chart is not a catalogue of symbols. Day Master, month command, Ten Gods, relationships and pattern are prioritized by how strongly they connect across the whole chart.","\u547D\u76D8\u4E0D\u662F\u7B26\u53F7\u76EE\u5F55\u3002\u65E5\u4E3B\u3001\u6708\u4EE4\u3001\u5341\u795E\u3001\u5E72\u652F\u5173\u7CFB\u4E0E\u683C\u5C40\uFF0C\u4F1A\u6309\u7167\u5B83\u4EEC\u5728\u6574\u76D8\u4E2D\u7684\u8FDE\u63A5\u7A0B\u5EA6\u6765\u51B3\u5B9A\u9605\u8BFB\u4F18\u5148\u987A\u5E8F\u3002"))}</p></header><div class="cx-bazi-overview-facts"><article><small>${e(t("Day Master","\u65E5\u4E3B"))}</small><strong>${e(a?.stem?.zh||"\u2014")}</strong><p>${e(t("The central reference point used to read the rest of the chart.","\u540E\u7EED\u4E94\u884C\u3001\u5341\u795E\u4E0E\u5173\u7CFB\u7ED3\u6784\u90FD\u4EE5\u65E5\u4E3B\u4F5C\u4E3A\u53C2\u7167\u3002"))}</p></article><article><small>${e(t("Month command","\u6708\u4EE4"))}</small><strong>${e(s?.branch?.zh||"\u2014")}</strong><p>${e(t("The seasonal background that changes how raw element counts should be understood.","\u6708\u4EE4\u63D0\u4F9B\u5B63\u8282\u80CC\u666F\uFF0C\u4F1A\u6539\u53D8\u539F\u59CB\u4E94\u884C\u6570\u91CF\u5E94\u8BE5\u600E\u6837\u7406\u89E3\u3002"))}</p></article><article><small>${e(t("Most visible raw element","\u539F\u59CB\u7ED3\u6784\u4E2D\u8F83\u591A\u7684\u4E94\u884C"))}</small><strong>${e(l?`${t(l.element==="WOOD"?"Wood":l.element==="FIRE"?"Fire":l.element==="EARTH"?"Earth":l.element==="METAL"?"Metal":"Water",l.element==="WOOD"?"\u6728":l.element==="FIRE"?"\u706B":l.element==="EARTH"?"\u571F":l.element==="METAL"?"\u91D1":"\u6C34")} ${l.rawRatio}%`:"\u2014")}</strong><p>${e(t("This is composition, not a final strength verdict.","\u8FD9\u662F\u7EC4\u6210\u5360\u6BD4\uFF0C\u4E0D\u662F\u6700\u7EC8\u65FA\u8870\u5224\u65AD\u3002"))}</p></article></div>${q(n,{embedded:!0})}<details class="cx-bazi-priority-detail"><summary>${e(t("Why these themes come first","\u4E3A\u4EC0\u4E48\u5148\u8BFB\u8FD9\u4E9B\u4E3B\u7EBF"))}</summary>${Q(n,{embedded:!0})}</details></section>`}function yt(n){return`<section id="bazi-section-chart" class="cx-bazi-w12-section" tabindex="-1"><header class="cx-bazi-w12-section-head"><p class="cx-eyebrow">${e(t("FOUR PILLARS","\u547D\u76D8"))}</p><h2>${e(t("See the stems, branches, Ten-God roles and hidden stems before reading conclusions.","\u5148\u628A\u5929\u5E72\u3001\u5730\u652F\u3001\u5341\u795E\u89D2\u8272\u4E0E\u85CF\u5E72\u770B\u6E05\uFF0C\u518D\u8FDB\u5165\u89E3\u91CA\u3002"))}</h2></header>${k(n,{embedded:!0})}${j(n,{embedded:!0})}</section>`}function Dt(n){return`<section id="bazi-section-elements" class="cx-bazi-w12-section" tabindex="-1"><header class="cx-bazi-w12-section-head"><p class="cx-eyebrow">${e(t("FIVE ELEMENTS & TEN GODS","\u4E94\u884C\u4E0E\u5341\u795E"))}</p><h2>${e(t("Turn the chart into a visual composition you can actually read.","\u628A\u547D\u76D8\u8F6C\u6210\u4E00\u773C\u80FD\u8BFB\u61C2\u7684\u4E94\u884C\u4E0E\u5341\u795E\u7ED3\u6784\u3002"))}</h2></header>${K(n,{embedded:!0})}</section>`}function Ht(n){return`<section id="bazi-section-core" class="cx-bazi-w12-section" tabindex="-1"><header class="cx-bazi-w12-section-head"><p class="cx-eyebrow">${e(t("CORE STRUCTURE","\u6838\u5FC3\u7ED3\u6784"))}</p><h2>${e(t("See how the major customer-reading layers connect before isolating any one symbol.","\u5148\u770B\u5BA2\u6237\u4E3B\u9605\u8BFB\u91CC\u7684\u5173\u952E\u5C42\u6B21\u600E\u6837\u5F7C\u6B64\u5173\u8054\uFF0C\u518D\u5224\u65AD\u5355\u4E00\u7B26\u53F7\u7684\u91CD\u8981\u6027\u3002"))}</h2></header>${w(n,{embedded:!0,customerMain:!0})}</section>`}function vt(n){return`<section id="bazi-section-pattern" class="cx-bazi-w12-section" tabindex="-1"><header class="cx-bazi-w12-section-head"><p class="cx-eyebrow">${e(t("PATTERN & BALANCE","\u683C\u5C40\u4E0E\u5E73\u8861"))}</p><h2>${e(t("Read the pattern paths that matter to the whole chart; technical school variants and unresolved conditions stay in Sources & Technical.","\u4E3B\u9605\u8BFB\u53EA\u89E3\u91CA\u771F\u6B63\u5F71\u54CD\u6574\u76D8\u7684\u683C\u5C40\u8DEF\u5F84\uFF1B\u66F4\u7EC6\u7684\u6280\u672F\u5224\u636E\u7EDF\u4E00\u653E\u5230\u300C\u6765\u6E90\u6280\u672F\u300D\u3002"))}</h2></header>${oe(n,{embedded:!0})}</section>`}function Mt(n){return`<section id="bazi-section-relationships" class="cx-bazi-w12-section" tabindex="-1"><header class="cx-bazi-w12-section-head"><p class="cx-eyebrow">${e(t("RELATIONSHIPS","\u5173\u7CFB\u7ED3\u6784"))}</p><h2>${e(t("Read combinations, clashes, punishments, harms and breaks through pillar interfaces, Ten-God context and Day-Master carrying structure.","\u628A\u5408\u3001\u51B2\u3001\u5211\u3001\u5BB3\u3001\u7834\u8FDE\u63A5\u5230\u67F1\u4F4D\u63A5\u53E3\u3001\u5341\u795E\u4E0A\u4E0B\u6587\u4E0E\u65E5\u4E3B\u627F\u8F7D\u7ED3\u6784\u6765\u8BFB\u3002"))}</h2></header>${Z(n,{embedded:!0})}</section>`}function _t(n){return`<section id="bazi-section-timing" class="cx-bazi-w12-section" tabindex="-1"><header class="cx-bazi-w12-section-head"><p class="cx-eyebrow">${e(t("DA YUN & LIU NIAN","\u5927\u8FD0\u4E0E\u6D41\u5E74"))}</p><h2>${e(t("See which natal themes become more active in different periods.","\u770B\u539F\u5C40\u54EA\u4E9B\u4E3B\u9898\u4F1A\u5728\u4E0D\u540C\u9636\u6BB5\u88AB\u5E26\u52A8\u3002"))}</h2></header>${ne(n,{embedded:!0})}</section>`}function xt(n){return`<section id="bazi-section-themes" class="cx-bazi-w12-section" tabindex="-1"><header class="cx-bazi-w12-section-head"><p class="cx-eyebrow">${e(t("LIFE THEMES","\u4EBA\u751F\u4E3B\u9898"))}</p><h2>${e(t("Read real life domains through multi-factor BaZi composition.","\u7528\u591A\u56E0\u7D20\u516B\u5B57\u7EC4\u5408\u8FDB\u5165\u771F\u5B9E\u751F\u6D3B\u4E3B\u9898\u3002"))}</h2><p>${e(t("Career, wealth, relationships, family, capability, pressure and daily operation are composed from the same chart structure instead of being generated from isolated symbols.","\u4E8B\u4E1A\u3001\u8D22\u5BCC\u3001\u5173\u7CFB\u3001\u5BB6\u5EAD\u3001\u80FD\u529B\u3001\u538B\u529B\u4E0E\u751F\u6D3B\u8FD0\u884C\u90FD\u4ECE\u540C\u4E00\u5F20\u6574\u76D8\u7EC4\u5408\u51FA\u6765\uFF0C\u4E0D\u518D\u7531\u5355\u4E00\u7B26\u53F7\u76F4\u63A5\u751F\u6210\u3002"))}</p></header>${J(n,{embedded:!0})}</section>`}function Ut(n){return`<section id="bazi-section-reality" class="cx-bazi-w12-section" tabindex="-1"><header class="cx-bazi-w12-section-head"><p class="cx-eyebrow">${e(t("REALITY BRIDGE","\u73B0\u5B9E\u5BF9\u7167"))}</p><h2>${e(t("Reality prompts are attached to the professional chapters they belong to.","\u73B0\u5B9E\u95EE\u9898\u8DDF\u7740\u5BF9\u5E94\u7684\u4E13\u4E1A\u7AE0\u8282\u51FA\u73B0\uFF0C\u800C\u4E0D\u662F\u5728\u6700\u540E\u518D\u5806\u4E00\u7EC4\u91CD\u590D\u95EE\u9898\u3002"))}</h2></header>${de(n,{embedded:!0})}</section>`}function wt(n,r){let a=n.evidence||{},s=n.publicationDecision||{},i=n.governance||{},l=n.professionalModules?.customerSafeGraph||{},o=c(n.openVerdicts),u=c(n.professionalModules?.schools),d=n.professionalModules?.pattern||{};return`<section id="bazi-section-technical" class="cx-bazi-w12-technical" tabindex="-1" data-bazi-cx-pro-technical-relocation="true"><header class="cx-bazi-w12-section-head"><p class="cx-eyebrow">${e(t("SOURCES & TECHNICAL","\u6765\u6E90\u6280\u672F"))}</p><h2>${e(t("Source lineage, school variants, technical uncertainty and production metadata live here\u2014not in the customer reading flow.","\u6765\u6E90\u6EAF\u6E90\u3001\u5B66\u6D3E\u5DEE\u5F02\u3001\u6280\u672F\u6027\u672A\u51B3\u4E0E\u751F\u4EA7\u5143\u6570\u636E\u7EDF\u4E00\u653E\u5728\u8FD9\u91CC\uFF0C\u4E0D\u5360\u636E\u5BA2\u6237\u4E3B\u9605\u8BFB\u3002"))}</h2></header><div class="cx-bazi-technical-summary"><article><small>${e(t("Product version","\u4EA7\u54C1\u7248\u672C"))}</small><strong>${e(n.productVersion||"")}</strong></article><article><small>${e(t("Evidence records","\u8BC1\u636E\u8BB0\u5F55"))}</small><strong>${e(a.evidenceCount??"\u2014")}</strong></article><article><small>${e(t("Authority records","\u6743\u5A01\u8BB0\u5F55\uFF08\u6765\u6E90\u4F9D\u636E\uFF09"))}</small><strong>${e(a.authorityCount??"\u2014")}</strong></article><article><small>${e(t("Publication state","\u53D1\u5E03\u72B6\u6001"))}</small><strong>${e(s.status||r.state||"")}</strong></article></div><details open><summary>${e(t("School-qualified readings","\u5206\u5B66\u6D3E\u6280\u672F\u8BFB\u53D6"))}</summary>${ee(n,{embedded:!0})}</details><details><summary>${e(t("Pattern decision detail","\u683C\u5C40\u6280\u672F\u5224\u636E"))}</summary>${X(n,{embedded:!0})}</details><details><summary>${e(t("Open technical conditions","\u4ECD\u5F85\u6838\u5BF9\u7684\u6280\u672F\u6761\u4EF6"))}</summary>${o.length?`<ul class="cx-bazi-technical-open-list">${o.map(S=>`<li>${e(ft(S))}</li>`).join("")}</ul>`:`<p>${e(t("No additional open condition is recorded in this product.","\u8FD9\u4EFD\u4EA7\u54C1\u6CA1\u6709\u989D\u5916\u8BB0\u5F55\u7684\u6280\u672F\u6027\u5F85\u6838\u5BF9\u6761\u4EF6\u3002"))}</p>`}</details><details><summary>${e(t("Full technical structure map","\u5B8C\u6574\u6280\u672F\u7ED3\u6784\u56FE"))}</summary>${w(n,{embedded:!0})}</details><details><summary>${e(t("Reading lineage","\u8BFB\u53D6\u6EAF\u6E90"))}</summary><dl><dt>${e(t("Report digest","\u62A5\u544A\u6307\u7EB9"))}</dt><dd><code>${e(n.summary?.reportDigest||"")}</code></dd><dt>${e(t("Natal projection","\u51FA\u751F\u6295\u5C04"))}</dt><dd><code>${e(a.sourceNatalProjectionId||"")}</code></dd><dt>${e(t("Structure graph digest","\u7ED3\u6784\u56FE\u6307\u7EB9"))}</dt><dd><code>${e(l.sourceGraphDigest||"")}</code></dd><dt>${e(t("Temporal state","\u65F6\u95F4\u72B6\u6001"))}</dt><dd>${e(n.temporalContext?.state||"UNAVAILABLE")}</dd><dt>${e(t("School views retained","\u4FDD\u7559\u5B66\u6D3E\u89C6\u89D2"))}</dt><dd>${e(u.length)}</dd><dt>${e(t("Pattern paths retained","\u4FDD\u7559\u683C\u5C40\u8DEF\u5F84"))}</dt><dd>${e(c(d.candidates).length)}</dd></dl></details><details><summary>${e(t("Interpretation boundaries","\u89E3\u91CA\u8FB9\u754C"))}</summary><ul><li>${e(t("Raw Five-Element ratios are composition counts, not strength scores.","\u4E94\u884C\u539F\u59CB\u5360\u6BD4\u662F\u7ED3\u6784\u8BA1\u6570\uFF0C\u4E0D\u7B49\u540C\u65FA\u8870\u5206\u6570\u3002"))}</li><li>${e(t("School-qualified views remain distinct rather than silently merged.","\u4E0D\u540C\u5B66\u6D3E\u7684\u7ED3\u8BBA\u4FDD\u6301\u533A\u5206\uFF0C\u4E0D\u9759\u9ED8\u5408\u5E76\u3002"))}</li><li>${e(t("Reality responses help compare the reading with lived experience but do not rewrite the Four-Pillar calculation.","\u73B0\u5B9E\u56DE\u7B54\u7528\u4E8E\u6BD4\u8F83\u89E3\u8BFB\u4E0E\u7ECF\u9A8C\uFF0C\u4E0D\u4F1A\u6539\u5199\u56DB\u67F1\u8BA1\u7B97\u3002"))}</li><li>${e(i.sharedPersonalRealitySurfaceModified===!1?t("The shared My Reality surface remains unchanged.","\u5171\u7528 My Reality \u9875\u9762\u4FDD\u6301\u4E0D\u53D8\u3002"):t("Shared-surface state is not asserted here.","\u8FD9\u91CC\u4E0D\u5BA3\u79F0\u5171\u7528\u9875\u9762\u72B6\u6001\u3002"))}</li></ul></details></section>`}function zt(n){return`<article class="cx-bazi-w12-workspace" data-ppr-c1-w12-bazi-workspace="true" data-bazi-cx-pro-w0-w2="true" data-ppr-whole-chart-first="true" data-bazi-market-grade-reading="active">${$t(n)}${yt(n)}${Dt(n)}${Ht(n)}${vt(n)}${Mt(n)}${_t(n)}${xt(n)}${Ut(n)}</article>`}function Gt({product:n,mount:r}={}){let a=n?.sourceProduct;if(!O(a))return Object.freeze({status:"NOT_HANDLED",reason:"BAZI_METHOD_NATIVE_PRODUCT_REQUIRED"});let s=zt(a);if(!s)return Object.freeze({status:"NOT_HANDLED",reason:"BAZI_SPECIALIST_HTML_EMPTY"});ue(r?.host?.ownerDocument||globalThis.document);let i=pe(n);return Object.freeze({status:"RENDERED",navigationHtml:Lt(),visualHtml:i,readingHtml:s,technicalHtml:wt(a,n),customerDefaultSurface:"BAZI_PROFESSIONAL_READING",governanceSurfaceDefault:!1,technicalSurfaceMode:"ON_DEMAND",marketGradeCutoverState:a.governance?.marketGradeCustomerCutoverActive===!0?a.governance?.marketGradeCustomerCutoverFrozen===!0?"ACTIVE_FROZEN":"ACTIVE":"CANDIDATE_PENDING_W13_HUMAN_ACCEPTANCE",marketGradeCutoverFrozen:a.governance?.marketGradeCustomerCutoverFrozen===!0})}function me({product:n,mount:r}={}){let a=n?.publicationReport,s=n?.reportAccess;if(!a)return Object.freeze({status:"RENDERED",navigationHtml:"",visualHtml:"",readingHtml:`<section data-bazi-access="FREE_REPORT_PREVIEW"><p>${e(t("Generate your free BaZi report from the Personal Reality form.","\u8BF7\u4ECE Personal Reality \u8868\u5355\u751F\u6210\u4F60\u7684\u514D\u8D39\u516B\u5B57\u62A5\u544A\u3002"))}</p></section>`,technicalHtml:"",customerDefaultSurface:"FREE_REPORT_PREVIEW"});let i=s?.state==="FULL_REPORT"&&s?.verifiedPurchase===!0,l=s?.offer,o=l&&new Intl.NumberFormat(n.locale==="en"?"en-MY":"zh-MY",{style:"currency",currency:l.currency,maximumFractionDigits:0}).format(l.amountMinor/100),u=i?"":`<section class="bazi-report-unlock" data-bazi-paid-state="PAID_LOCKED"><h2>${e(t("Full Report","\u5B8C\u6574\u62A5\u544A"))}</h2><p>${e(t("Pattern paths, carrying conditions, sources, career, wealth, relationships and timing.","\u683C\u5C40\u8DEF\u5F84\u3001\u627F\u8F7D\u6761\u4EF6\u3001\u6765\u6E90\u3001\u4E8B\u4E1A\u3001\u8D22\u5BCC\u3001\u5173\u7CFB\u4E0E\u65F6\u95F4\u5C42\u3002"))}</p>${l?`<a class="cx-button" href="${e(l.href)}">${e(t("Unlock Full BaZi Report","\u89E3\u9501\u5B8C\u6574\u516B\u5B57\u62A5\u544A"))} \xB7 ${e(o)}</a>`:""}${s?.reason==="FULL_REPORT_RELEASE_PENDING"?`<p>${e(t("Your purchase is recorded. The new report edition awaits release acceptance.","\u8D2D\u4E70\u5DF2\u8BB0\u5F55\uFF0C\u65B0\u7248\u62A5\u544A\u7B49\u5F85\u53D1\u5E03\u9A8C\u6536\u3002"))}</p>`:""}</section>`,d=i&&n.sourceProduct?Gt({product:n,mount:r}):null,S=d?`<details data-bazi-technical-detail><summary>${e(t("Technical / interactive detail","\u6280\u672F\uFF0F\u4EA4\u4E92\u8BE6\u60C5"))}</summary>${d.navigationHtml}${d.visualHtml}${d.readingHtml}${d.technicalHtml}</details>`:"";return{status:"RENDERED",navigationHtml:"",visualHtml:"",readingHtml:`<div data-bazi-access="${i?"FULL_REPORT":"FREE_REPORT_PREVIEW"}">${u}${_e(a)}${u}</div>`,technicalHtml:S,customerDefaultSurface:i?"GUIDED_REPORT_SUCCESSOR_R2":"FREE_REPORT_PREVIEW",afterMount:async m=>{let I=m.host?.ownerDocument||globalThis.document;for(let $ of["visual-report","report-publication"])if(!I.querySelector(`link[data-bazi-report-css="${$}"]`)){let T=I.createElement("link");T.rel="stylesheet",T.href=`/assets/customer-ui/surfaces/${$}.css`,T.dataset.baziReportCss=$,I.head.appendChild(T)}await xe(m.reading),te(m.reading)}}}var gr=Object.freeze({renderBaziProduct:me});var Ue=document.querySelector("script[data-mode]"),Yt=Ue.dataset.mode,we=Ue.dataset.locale||new URLSearchParams(location.search).get("locale")||"en";document.documentElement.lang=we;var Bt=await(await fetch(`/docs/guided-report-successor-r2/visual-commerce/${Yt}-${we}.json`)).json(),B=document.querySelector("#report"),ze=me({product:Bt,mount:{host:B}});B.innerHTML=ze.readingHtml;await ze.afterMount({host:B,reading:B});await document.fonts.ready;window.fitPublication=()=>te(B);window.batchReady=!0;
