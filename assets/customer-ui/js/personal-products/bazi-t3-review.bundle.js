var A=e=>String(e??"").replace(/[&<>"']/g,n=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[n]),b=e=>typeof e=="number"&&Number.isFinite(e),_=(e,n)=>`<svg viewBox="0 0 680 560" role="img" aria-label="${A(e.a11ySummary)}"><title>${A(e.a11ySummary)}</title>${n}</svg>`;function Y(e){let n=e.nodes||[],r=e.type;if(["DONUT","DISTRIBUTION_RING","STACKED_BAR"].includes(r)){if(!n.length||n.some(t=>!b(t.value)||t.value<0)||n.reduce((t,E)=>t+E.value,0)<=0)throw Error("VRPT_NONNEGATIVE_SOURCE_VALUES_REQUIRED");if(!e.unit||e.comparableWithinSource!==!0)throw Error("VRPT_COMPARABLE_SOURCE_UNIT_REQUIRED");let c=n.reduce((t,E)=>t+E.value,0),s=0,a=n.map((t,E)=>{let u=s;s+=t.value/c;let i=`hsl(${170+E*47} 25% ${38+E%3*10}%)`;return r==="STACKED_BAR"?`<rect x="${60+u*560}" y="150" width="${t.value/c*560}" height="110" fill="${i}"/><text x="${60+u*560+t.value/c*280}" y="290" text-anchor="middle">${E+1}</text>`:`<circle cx="220" cy="245" r="145" fill="none" stroke="${i}" stroke-width="55" stroke-dasharray="${t.value/c*911.062} ${911.062}" stroke-dashoffset="${-u*911.062}" transform="rotate(-90 220 245)"/><text x="440" y="${95+E*35}">${E+1}. ${A(t.label)}: ${t.value}</text>`}).join("");return _(e,a+(r==="STACKED_BAR"?n.map((t,E)=>`<text x="60" y="${330+E*28}">${E+1}. ${A(t.label)}: ${t.value}</text>`).join(""):""))}if(["SCATTER","SPARKLINE"].includes(r)){if(n.some(l=>!b(l.x)||!b(l.y))||!e.xUnit||!e.yUnit)throw Error("VRPT_SOURCE_COORDINATES_REQUIRED");let c=n.map(l=>l.x),s=n.map(l=>l.y),a=Math.min(...c),t=Math.max(...c),E=Math.min(...s),u=Math.max(...s),i=l=>80+(l.x-a)/(t-a||1)*520,o=l=>450-(l.y-E)/(u-E||1)*350;if(r==="SPARKLINE"&&n.some((l,R)=>R&&l.x<n[R-1].x))throw Error("VRPT_SOURCE_SEQUENCE_REQUIRED");return _(e,`<path d="M80 80 V450 H620" fill="none" stroke="#80948c"/>${r==="SPARKLINE"?`<polyline points="${n.map(l=>`${i(l)},${o(l)}`).join(" ")}" fill="none" stroke="#247579" stroke-width="3"/>`:""}${n.map(l=>`<circle cx="${i(l)}" cy="${o(l)}" r="6"/><text x="${i(l)}" y="${o(l)-13}" text-anchor="middle">${A(l.label)} (${l.x}, ${l.y})</text>`).join("")}<text x="80" y="500">${a} \u2013 ${t} ${A(e.xUnit)}</text><text x="80" y="55">${E} \u2013 ${u} ${A(e.yUnit)}</text>`)}if(["MATRIX","HEATMAP"].includes(r)){if(n.some(u=>!u.rowLabel||!u.columnLabel||u.value==null))throw Error("VRPT_SOURCE_MATRIX_CELLS_REQUIRED");if(r==="HEATMAP"&&(n.some(u=>!b(u.value))||!e.unit||e.comparableWithinSource!==!0))throw Error("VRPT_COMPARABLE_SOURCE_UNIT_REQUIRED");let c=[...new Set(n.map(u=>u.rowLabel))],s=[...new Set(n.map(u=>u.columnLabel))],a=n.map(u=>u.value),t=Math.min(...a),E=Math.max(...a);return`<div class="vrpt-matrix-scroll"><table class="vrpt-matrix"><caption>${A(e.unit||e.a11ySummary)}</caption><thead><tr><th></th>${s.map(u=>`<th scope="col">${A(u)}</th>`).join("")}</tr></thead><tbody>${c.map(u=>`<tr><th scope="row">${A(u)}</th>${s.map(i=>{let o=n.find(l=>l.rowLabel===u&&l.columnLabel===i);return`<td${o&&r==="HEATMAP"?` style="background:hsl(176 22% ${92-(o.value-t)/(E-t||1)*35}%)"`:""}>${o?A(o.value):"\u2014"}</td>`}).join("")}</tr>`).join("")}</tbody></table></div>`}return null}var d=e=>String(e??"").replace(/[&<>"']/g,n=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[n]);function B(e,{t:n,text:r,panel:c}){let s=e.visual,a=i=>`<div data-part="metrics">${i.map(o=>`<span data-source-ref="${r(o.sourceRefs[0])}">${r(o.label)}<b>${r(o.value)}</b></span>`).join("")}</div>`,t=(i,o)=>{let l=i.map((R,N)=>({x:220+145*Math.cos(-Math.PI/2+N*2*Math.PI/i.length),y:210+145*Math.sin(-Math.PI/2+N*2*Math.PI/i.length)}));return`<svg data-part="balance-orbit" viewBox="0 0 440 420" role="img" aria-label="${r(i.map(R=>`${R.label}: ${R.value}`).join("; "))}"><circle class="vrpt-orbit" cx="220" cy="210" r="145"/>${i.map((R,N)=>`<path class="vrpt-link" d="M220 210L${l[N].x} ${l[N].y}"/>`).join("")}<g class="vrpt-node"><circle cx="220" cy="210" r="57"/><text ${o.length<3?"data-total":""} x="220" y="205" text-anchor="middle">${r(o)}</text><text data-caption x="220" y="226" text-anchor="middle">${r(n("CORE","\u6838\u5FC3"))}</text></g>${i.map((R,N)=>`<g class="vrpt-node"><circle cx="${l[N].x}" cy="${l[N].y}" r="54"/><text data-total x="${l[N].x}" y="${l[N].y+10}" text-anchor="middle">${r(R.value)}</text><text data-caption x="${l[N].x}" y="${l[N].y+36}" text-anchor="middle">${N+1}</text></g>`).join("")}</svg>`},E=i=>`<div data-part="balance-key">${i.map((o,l)=>`<div class="vrpt-tile"><h4>${l+1} \xB7 ${r(o.label)}</h4><b>${r(o.value)}</b></div>`).join("")}</div>`,u=i=>{let o=Math.max(1,...i.map(l=>l.value));return`<div data-part="balance-bars">${i.map(l=>`<div><span>${r(l.label)}</span><svg viewBox="0 0 200 14" role="img" aria-label="${r(`${l.label}: ${l.value}`)}"><rect data-track width="200" height="14" rx="7"/><rect class="vrpt-node" width="${200*l.value/o}" height="14" rx="7" fill="currentColor"/></svg><b>${l.value}</b></div>`).join("")}<small>${r(n("Raw visible counts \xB7 common scale","\u53EF\u89C1\u539F\u59CB\u8BA1\u6570 \xB7 \u7EDF\u4E00\u523B\u5EA6"))}: 0\u2013${o}</small></div>`};if(e.pageNumber===11)return c(n("Visible signal balance","\u53EF\u89C1\u4FE1\u53F7\u5206\u5E03"),u(s.signalNodes))+c(n("Separate context","\u72EC\u7ACB\u80CC\u666F"),a([{label:n("Root records","\u6839\u6C14\u8BB0\u5F55"),value:s.context.roots.value,sourceRefs:s.context.roots.sourceRefs},{label:n("Day Master","\u65E5\u4E3B"),value:s.context.dayMaster.glyph,sourceRefs:s.context.dayMaster.sourceRefs},{label:n("Month command","\u6708\u4EE4"),value:s.context.season.glyph,sourceRefs:s.context.season.sourceRefs}]));if(e.pageNumber===12)return c(n("Primary verdict remains open","\u4E3B\u683C\u5C40\u5224\u65AD\u4FDD\u6301\u5F00\u653E"),`<div data-part="season-structure">${t(s.candidates,n("Open","\u672A\u5B9A"))}${E(s.candidates)}</div>`)+c(n("Candidate evidence","\u5019\u9009\u8BC1\u636E"),`<div data-part="balance-candidates">${s.candidates.map(i=>`<section class="vrpt-tile"><h4>${r(i.label)}</h4><p>${r(i.visibleStemMatch?n("Visible stem match","\u6709\u900F\u5E72\u5BF9\u5E94"):n("No visible stem match","\u672A\u89C1\u900F\u5E72\u5BF9\u5E94"))}</p><p>${r(n("Visible paths / recorded paths","\u53EF\u89C1\u8DEF\u5F84\uFF0F\u5DF2\u8BB0\u5F55\u8DEF\u5F84"))}: ${i.visiblePaths} / ${i.pathCount}</p></section>`).join("")||`<p>${r(n("No candidates recorded.","\u65E0\u5DF2\u8BB0\u5F55\u5019\u9009\u3002"))}</p>`}</div>`);if(e.pageNumber===13)return c(n("Candidate condition map","\u5019\u9009\u6761\u4EF6\u56FE"),`<div data-part="balance-conditions">${s.candidates.map(i=>`<section class="vrpt-tile"><h4>${r(i.label)} \xB7 ${r(i.value)}</h4>${s.paths.filter(o=>o.candidateId===i.id).map((o,l)=>`<div data-part="condition-row" data-state="${o.state}"><small>${l+1} \xB7 ${r(o.pathLabel||o.pathCode.replaceAll("_"," "))}</small><strong>${r(o.value)}</strong></div>`).join("")}</section>`).join("")||`<p>${r(n("No recorded candidate conditions.","\u65E0\u5DF2\u8BB0\u5F55\u5019\u9009\u6761\u4EF6\u3002"))}</p>`}</div>`)+c(n("Verdict boundaries","\u5224\u65AD\u8FB9\u754C"),a([{label:n("Primary","\u4E3B\u683C\u5C40"),value:n("Open","\u672A\u5B9A"),sourceRefs:e.evidenceRefs},{label:n("Secondary","\u6B21\u8981\u683C\u5C40"),value:n("Not set","\u672A\u6307\u5B9A"),sourceRefs:e.evidenceRefs},{label:n("Candidates","\u5019\u9009"),value:s.candidates.length,sourceRefs:e.evidenceRefs}]));if(e.pageNumber===14)return c(n("Support records around the Day Master","\u65E5\u4E3B\u5468\u56F4\u7684\u652F\u6301\u8BB0\u5F55"),`<div data-part="season-structure">${t(s.supportNodes,s.context.dayMaster.glyph)}${E(s.supportNodes)}</div>`)+c(n("Recorded root positions","\u5DF2\u8BB0\u5F55\u6839\u6C14\u4F4D\u7F6E"),s.rootRecords.length?a(s.rootRecords):`<p>${r(n("No root records are available.","\u6CA1\u6709\u53EF\u7528\u6839\u6C14\u8BB0\u5F55\u3002"))}</p>`);if(e.pageNumber===15){let i=[{x:85,y:90},{x:355,y:90},{x:85,y:310},{x:355,y:310}];return c(n("Pillar tension map","\u67F1\u4F4D\u5F20\u529B\u56FE"),`<div data-part="season-structure"><svg data-part="balance-orbit" viewBox="0 0 440 410" role="img" aria-label="${r(s.edges.map(o=>`${o.from} \u2013 ${o.to}: ${o.label}`).join("; ")||n("No tension relationships recorded","\u65E0\u5DF2\u8BB0\u5F55\u5F20\u529B\u5173\u7CFB"))}">${s.edges.map(o=>{let l=i[s.nodes.findIndex(N=>N.id===o.from)],R=i[s.nodes.findIndex(N=>N.id===o.to)];return`<path class="vrpt-link" stroke-dasharray="5 5" d="M${l.x} ${l.y}L${R.x} ${R.y}"/>`}).join("")}${s.nodes.map((o,l)=>`<g class="vrpt-node"><circle cx="${i[l].x}" cy="${i[l].y}" r="62"/><text data-total x="${i[l].x}" y="${i[l].y-10}" text-anchor="middle">${r(o.value)}</text><text data-caption x="${i[l].x}" y="${i[l].y+19}" text-anchor="middle">${r(o.label)}</text></g>`).join("")}</svg><div data-part="balance-key">${s.edges.map(o=>`<section class="vrpt-tile"><h4>${r(o.label)}</h4><p>${r(s.nodes.find(l=>l.id===o.from).label)} \u2194 ${r(s.nodes.find(l=>l.id===o.to).label)}</p></section>`).join("")||`<p>${r(n("No recorded tension relationships.","\u65E0\u5DF2\u8BB0\u5F55\u5F20\u529B\u5173\u7CFB\u3002"))}</p>`}</div></div>`)+c(n("Distinct signal counts","\u4E0D\u540C\u53E3\u5F84\u7684\u4FE1\u53F7\u8BA1\u6570"),a([s.signalNodes.find(o=>o.id==="PRESSURE"),{label:n("Tension relationships","\u5F20\u529B\u5173\u7CFB"),value:s.frictionCount,sourceRefs:e.evidenceRefs}]))}throw Error("BAZI_BATCH_2_PAGE_OUT_OF_SCOPE")}function G(e,{t:n,text:r,panel:c}){let s=e.visual,a=n("Day Master","\u65E5\u4E3B").split(" / "),t=s.nodes.map((i,o)=>({x:220+142*Math.cos(-Math.PI/2+o*2*Math.PI/s.nodes.length),y:215+142*Math.sin(-Math.PI/2+o*2*Math.PI/s.nodes.length)})),E=`<svg data-part="domain-orbit" viewBox="0 0 440 430" role="img" aria-label="${r(s.nodes.map(i=>`${i.label}: ${i.value}${i.lead?" \xB7 "+n("Lead","\u91CD\u70B9"):""}`).join("; "))}"><title>${r(s.domain)}</title><circle class="vrpt-orbit" cx="220" cy="215" r="142"/>${t.map(i=>`<path class="vrpt-link" d="M220 215L${i.x} ${i.y}"/>`).join("")}${s.nodes.map((i,o)=>`<g class="vrpt-node" data-selected="${i.lead}"><circle cx="${t[o].x}" cy="${t[o].y}" r="57"/><text x="${t[o].x}" y="${t[o].y-22}" text-anchor="middle">${r(i.label.split(" / ")[0])}</text>${i.label.includes(" / ")?`<text x="${t[o].x}" y="${t[o].y+8}" text-anchor="middle">${r(i.label.split(" / ")[1])}</text>`:""}<text data-total x="${t[o].x}" y="${t[o].y+38}" text-anchor="middle">${i.value}</text></g>`).join("")}<g class="vrpt-node" data-center><circle cx="220" cy="215" r="63"/><text data-total x="220" y="${a.length===2?201:214}" text-anchor="middle">${r(s.context.dayMaster.glyph)}</text>${a.map((i,o)=>`<text data-caption x="220" y="${a.length===2?231+o*24:240}" text-anchor="middle">${r(i)}</text>`).join("")}</g></svg>`,u=i=>`<span data-source-ref="${r(i.sourceRefs[0])}">${r(i.label)}<b>${i.value}</b></span>`;return`<div data-part="domain-main">${c(n("Domain structure","\u4E3B\u9898\u7ED3\u6784"),E,"domain-structure")}${c(n("Key themes","\u5173\u952E\u4E3B\u9898"),`<div data-part="domain-lead"><small>${r(n("Source-selected lead","\u6765\u6E90\u6307\u5B9A\u91CD\u70B9"))}</small><strong>${r(s.leadLabel)}</strong></div><div data-part="domain-themes">${s.themes.map(u).join("")}</div>`,"domain-themes-panel")}</div><div data-part="domain-conditions">${c(n("Support context","\u652F\u6301\u6761\u4EF6"),`<div data-part="metrics">${s.facts.slice(0,2).map(u).join("")}</div>`,"helps")}${c(n("Demand context","\u9700\u6C42\u6761\u4EF6"),`<div data-part="metrics">${s.facts.slice(2).map(u).join("")}</div>`,"costs")}</div>${c(n("Observe in context","\u60C5\u5883\u4E2D\u7684\u89C2\u5BDF"),`<div data-part="metrics"><span>${r(n("Day Master","\u65E5\u4E3B"))}<b>${r(s.context.dayMaster.glyph)}</b></span><span>${r(n("Month branch","\u6708\u652F"))}<b>${r(s.context.season.glyph)}</b></span>${u(s.themes[2])}</div>`,"observe")}`}function V(e,{t:n,text:r,panel:c}){let s=e.visual,a=s.nodes,t=(o,l)=>`<span>${r(o)}<b>${r(l)}</b></span>`,E=(o,l="guided-flow")=>`<div data-part="${l}">${o.map((R,N)=>`<section class="vrpt-tile" data-step="${N+1}" data-source-ref="${r(R.sourceRefs[0])}"><small>${String(N+1).padStart(2,"0")}</small><h3>${r(R.label)}</h3><p>${r(R.value)}</p></section>`).join("")}</div>`,u=()=>c(n("Natal baseline","\u672C\u547D\u57FA\u7EBF"),`<div data-part="metrics">${t(n("Day Master","\u65E5\u4E3B"),s.context.dayMaster.glyph)}${t(n("Month branch","\u6708\u652F"),s.context.season.glyph)}${t(n("Root records","\u6839\u6C14\u8BB0\u5F55"),s.context.roots.value)}</div>`),i=(o,l="route-map")=>`<svg data-part="${l}" viewBox="0 0 640 165" role="img" aria-label="${r(o.join(" \u2192 "))}"><path class="vrpt-link" d="M65 80H575"/>${o.map((R,N)=>{let g=65+N*510/(o.length-1);return`<g class="vrpt-node"><circle cx="${g}" cy="80" r="32"/><text x="${g}" y="86" text-anchor="middle">${N+1}</text></g>`}).join("")}</svg>`;return e.pageNumber===20?c(n("Time layers","\u65F6\u95F4\u5C42\u7EA7"),E([{label:n("Natal","\u672C\u547D"),value:n("Baseline","\u57FA\u7EBF"),sourceRefs:a[0].sourceRefs},{label:n("Luck pillars","\u5927\u8FD0"),value:n("Age bands","\u5E74\u9F84\u9636\u6BB5"),sourceRefs:a[0].sourceRefs},{label:n("Annual pillar","\u6D41\u5E74"),value:s.annualAvailable?n("Available","\u53EF\u7528"):n("Not supplied","\u672A\u63D0\u4F9B"),sourceRefs:s.sourceRefs}],"time-layers"))+c(n("Luck pillar sequence \xB7 ages","\u5927\u8FD0\u5E8F\u5217 \xB7 \u5E74\u9F84"),`<div data-part="period-bands">${s.bands.map(o=>`<section class="vrpt-tile" data-selected="${o.selected}"><small>${r(n("Cycle","\u9636\u6BB5"))} ${o.cycleNumber}</small><b data-glyph>${r(o.value)}</b><strong>${r(o.label)}</strong><small>${r(o.selected?n("Selected","\u5DF2\u9009\u62E9"):n("Age band","\u5E74\u9F84\u6BB5"))}</small></section>`).join("")}</div>`)+c(n("Target context","\u76EE\u6807\u60C5\u5883"),`<p>${r(s.selection)}</p>`):e.pageNumber===21?c(n("Explicit selection","\u660E\u786E\u9009\u62E9"),`<p>${r(s.selection)}</p><strong data-part="state-label">${r(s.completeness==="FULL"?n("Complete window","\u5B8C\u6574\u7A97\u53E3"):s.completeness==="NO_TARGET"?n("Target required","\u9700\u8981\u76EE\u6807\u65F6\u95F4"):n("Partial window","\u90E8\u5206\u7A97\u53E3"))}</strong>`)+c(n("Baseline \u2192 selected layers","\u57FA\u7EBF \u2192 \u6240\u9009\u5C42"),E(a,"selected-layers"))+u()+c(n("Layer boundary","\u65F6\u95F4\u5C42\u8FB9\u754C"),`<div data-part="metrics">${t(n("Natal","\u672C\u547D"),n("Retained","\u4FDD\u7559"))}${t(n("Timing","\u65F6\u95F4"),s.target?n("Explicit","\u660E\u786E\u6307\u5B9A"):n("Not selected","\u672A\u9009\u62E9"))}${t(n("Reality evidence","\u73B0\u5B9E\u8BC1\u636E"),n("Separate","\u72EC\u7ACB"))}</div>`):e.pageNumber===22?c(n("Comparison boundary","\u5BF9\u7167\u8FB9\u754C"),`<div data-part="reality-split">${E(a.slice(0,1),"method-side")}<div data-part="reality-inputs">${E(a.slice(1,3),"evidence-side")}</div></div>`)+c(n("Comparison state","\u5BF9\u7167\u72B6\u6001"),E(a.slice(3),"comparison-state"))+c(n("Independent records are needed","\u9700\u8981\u72EC\u7ACB\u8BB0\u5F55"),i([a[0].label,a[1].label,a[3].label])+`<div data-part="metrics">${t(n("Method","\u65B9\u6CD5"),n("Available","\u53EF\u7528"))}${t(n("Evidence","\u8BC1\u636E"),n("Required","\u5F85\u63D0\u4F9B"))}${t(n("Comparison","\u6BD4\u8F83"),n("Open","\u5F00\u653E"))}</div>`):e.pageNumber===23||e.pageNumber===24?c(e.pageNumber===23?n("Observe through contrasting situations","\u5728\u5BF9\u7167\u60C5\u5883\u4E2D\u89C2\u5BDF"):n("Explore conditions before conclusions","\u5148\u63A2\u7D22\u6761\u4EF6\uFF0C\u518D\u5F62\u6210\u7ED3\u8BBA"),i(a.map(o=>o.label))+E(a))+u()+c(n("Observation boundary","\u89C2\u5BDF\u8FB9\u754C"),`<div data-part="metrics">${t(n("Prompt","\u63D0\u793A"),n("Question","\u95EE\u9898"))}${t(n("Record","\u8BB0\u5F55"),n("Not supplied","\u672A\u63D0\u4F9B"))}${t(n("Conclusion","\u7ED3\u8BBA"),n("Open","\u5F00\u653E"))}</div>`):e.pageNumber===25?c(n("A path from noticing to review","\u4ECE\u89C9\u5BDF\u8D70\u5411\u56DE\u987E"),i(a.map(o=>o.label))+E(a,"navigation-route"))+c(n("Keep the comparison open","\u4FDD\u6301\u5BF9\u7167\u5F00\u653E"),`<div data-part="metrics">${t(n("Notice","\u89C9\u5BDF"),n("Context","\u60C5\u5883"))}${t(n("Compare","\u6BD4\u8F83"),n("Contrast","\u53CD\u4F8B"))}${t(n("Review","\u56DE\u987E"),n("Changes","\u53D8\u5316"))}</div>`)+u():c(n("Evidence & lineage","\u8BC1\u636E\u4E0E\u6765\u6E90\u8FFD\u6EAF"),`<div data-part="lineage-flow">${s.lineage.map((o,l)=>`<section class="vrpt-tile" data-step="${l+1}"><small>${String(l+1).padStart(2,"0")}</small><h3>${r(o.label)}</h3><code title="${r(o.value)}">${r(o.value.length>30?o.value.slice(0,22)+"\u2026":o.value)}</code></section>`).join("")}</div>`)+c(n("Method-side source records","\u65B9\u6CD5\u4FA7\u6765\u6E90\u8BB0\u5F55"),`<div data-part="trace-metrics">${s.trace.map(o=>t(o.label,o.value)).join("")}</div>`)+c(n("Current Reality stays independent","\u5F53\u524D\u73B0\u5B9E\u4FDD\u6301\u72EC\u7ACB"),`<div data-part="metrics">${t(n("Method","\u65B9\u6CD5"),n("Traceable","\u53EF\u8FFD\u6EAF"))}${t(n("Reality","\u73B0\u5B9E"),n("Not supplied","\u672A\u63D0\u4F9B"))}${t(n("Verdict","\u5224\u65AD"),n("Not promoted","\u4E0D\u63D0\u5347"))}</div>`)}function v(e){let n={"BAZI-DYNAMIC-R1-BATCH-01":[6,5],"BAZI-DYNAMIC-R1-BATCH-02":[11,5],"BAZI-DYNAMIC-R1-BATCH-03":[16,4],"BAZI-DYNAMIC-R1-BATCH-04":[20,3],"BAZI-DYNAMIC-R1-BATCH-05":[23,4]}[e.visualBatch];if(!n)throw Error("BAZI_BATCH_REVIEW_SCOPE_REQUIRED");let[r,c]=n;if(e.reviewMode!==!0||e.customerPublishable!==!1||e.depth!=="PAID"||e.pages.length!==c||e.pages.some((T,I)=>T.pageNumber!==I+r))throw Error("BAZI_BATCH_REVIEW_SCOPE_REQUIRED");let s=e.locale,a=(T,I)=>s==="bilingual"?`${I} / ${T}`:s==="zh-Hans"?I:T,t=T=>d(T),E=(T,I,O="")=>`<section class="vrpt-tile" ${O?`data-part="${O}"`:""}><h3>${t(T)}</h3>${I}</section>`,u=T=>`<div data-part="context">${E(a("Day Master","\u65E5\u4E3B"),`<b data-glyph data-element="${T.context.dayMaster.element}">${t(T.context.dayMaster.glyph)}</b><p>${t(T.context.dayMaster.code)} \xB7 ${t(T.context.dayMaster.polarity)} ${t(T.context.dayMaster.label)}</p>`)}${E(a("Season","\u5B63\u8282"),`<b data-glyph data-element="${T.context.season.element}">${t(T.context.season.glyph)}</b><p>${t(T.context.season.name)} \xB7 ${t(T.context.season.label)}</p>`)}</div>`,i=(T,I=!1)=>`<div data-part="pillars">${T.pillars.map(O=>`<article class="vrpt-tile" data-selected="${O.id==="DAY"}"><h4>${t(O.label)}</h4><small>${t(a("Heavenly stem","\u5929\u5E72"))}</small><b data-glyph data-element="${O.stemElement}">${t(O.stem)}</b><span>${t(O.stemCode)} \xB7 ${t(O.polarity)}</span><strong data-element="${O.stemElement}">${t(O.stemLabel)}</strong><hr><small>${t(a("Earthly branch","\u5730\u652F"))}</small><b data-glyph data-element="${O.branchElement}">${t(O.branch)}</b><span>${t(O.branchCode)}</span><strong data-element="${O.branchElement}">${t(O.branchLabel)}</strong>${I&&O.hiddenStems?`<hr><small>${t(a("Hidden stems","\u85CF\u5E72"))}</small><p>${t(O.hiddenStems)}</p>`:""}</article>`).join("")}</div>`,o=T=>{let I=T.elements.reduce((S,p)=>S+p.value,0),O=2*Math.PI*88,m=0;return`<svg data-part="donut" viewBox="0 0 260 260" role="img" aria-label="${t(T.elements.map(S=>`${S.label}: ${S.value}`).join("; "))}"><title>${t(T.unit)}</title>${T.elements.map(S=>{let p=m;return m+=S.value/I*O,`<circle data-element="${S.id}" cx="130" cy="130" r="88" fill="none" stroke="currentColor" stroke-width="32" stroke-dasharray="${S.value/I*O} ${O}" stroke-dashoffset="${-p}" transform="rotate(-90 130 130)"/>`}).join("")}<text x="130" y="125" text-anchor="middle" data-total>${I}</text><text x="130" y="149" text-anchor="middle">${t(a("COUNT","\u8BA1\u6570"))}</text></svg>`},l=T=>`<div data-part="bars">${[...T.elements].sort((I,O)=>O.value-I.value).map(I=>`<div data-element="${I.id}"><span>${t(I.label)}</span><svg viewBox="0 0 160 12" role="img" aria-label="${t(`${I.label}: ${I.value} / ${T.context.total}`)}"><rect data-track width="160" height="12" rx="6"/><rect width="${160*I.value/T.context.total}" height="12" rx="6" fill="currentColor"/></svg><strong>${I.value}</strong></div>`).join("")}<small>${t(a("Count / total inventory","\u8BA1\u6570\uFF0F\u6E05\u5355\u603B\u6570"))}: ${T.context.total}</small></div>`,R=T=>`<div data-part="distribution">${o(T)}${l(T)}</div>`,N=T=>{let I=T.context;return`<div data-part="season-structure"><svg viewBox="0 0 440 400" role="img" aria-label="${t(`${a("Day Master","\u65E5\u4E3B")}: ${I.dayMaster.code}; ${a("Season","\u5B63\u8282")}: ${I.season.name}; ${a("Root records","\u6839\u6C14\u8BB0\u5F55")}: ${I.roots.value}`)}"><circle class="vrpt-orbit" cx="220" cy="200" r="155"/><path class="vrpt-link" d="M220 85V315M75 200H365"/>${[[220,58,I.season.glyph,I.season.name],[75,200,String(I.roots.value),a("Roots","\u6839\u6C14")],[365,200,"\u2014",a("Open","\u5F00\u653E")],[220,342,I.season.label,a("Month element","\u6708\u4EE4\u4E94\u884C")]].map(([O,m,S,p])=>`<g class="vrpt-node"><circle cx="${O}" cy="${m}" r="55"/><text x="${O}" y="${m-4}" text-anchor="middle">${t(S)}</text><text data-caption x="${O}" y="${m+20}" text-anchor="middle">${t(p)}</text></g>`).join("")}<g class="vrpt-node" data-center><circle cx="220" cy="200" r="73"/><text data-total x="220" y="196" text-anchor="middle">${t(I.dayMaster.glyph)}</text><text x="220" y="226" text-anchor="middle">${t(I.dayMaster.label)}</text></g></svg>${u(T)}</div>`},g=T=>{let I=T.nodes.map((O,m)=>({id:O.id,x:220+145*Math.cos(-Math.PI/2+m*2*Math.PI/5),y:205+145*Math.sin(-Math.PI/2+m*2*Math.PI/5)}));return`<svg data-part="relationships" viewBox="0 0 440 410" role="img" aria-label="${t(a("Solid arrows generate; dashed arrows control. Counts label the inventory only.","\u5B9E\u7EBF\u7BAD\u5934\u76F8\u751F\uFF0C\u865A\u7EBF\u7BAD\u5934\u76F8\u514B\u3002\u6570\u5B57\u4EC5\u8868\u793A\u6E05\u5355\u8BA1\u6570\u3002"))}"><defs><marker id="arrow-${s}" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="currentColor"/></marker></defs><circle class="vrpt-orbit" cx="220" cy="205" r="145"/>${T.edges.map(O=>{let m=I.find(x=>x.id===O.from),S=I.find(x=>x.id===O.to),p=S.x-m.x,U=S.y-m.y,H=Math.hypot(p,U),en=m.x+p/H*43,rn=m.y+U/H*43,tn=S.x-p/H*48,an=S.y-U/H*48;return`<path class="vrpt-link" ${O.relation==="SUBJECT_CONTROLS_TARGET"?'stroke-dasharray="5 5"':""} marker-end="url(#arrow-${s})" d="M${en} ${rn}L${tn} ${an}"/>`}).join("")}${T.nodes.map((O,m)=>`<g class="vrpt-node" data-element="${O.id}"><circle cx="${I[m].x}" cy="${I[m].y}" r="43"/><text x="${I[m].x}" y="${I[m].y-2}" text-anchor="middle">${t(O.label)}</text><text x="${I[m].x}" y="${I[m].y+22}" text-anchor="middle">${O.value}</text></g>`).join("")}</svg>`},nn=T=>{let I=T.visual;return T.pageNumber>=20?V(T,{t:a,text:t,panel:E}):T.pageNumber>=16?G(T,{t:a,text:t,panel:E}):T.pageNumber>=11?B(T,{t:a,text:t,panel:E}):T.pageNumber===6?E(a("Four pillars","\u56DB\u67F1\u547D\u76D8"),`<div data-part="snapshot">${i(I)}${u(I)}</div>`)+E(a("Five elements \xB7 unweighted inventory","\u4E94\u884C \xB7 \u672A\u52A0\u6743\u6E05\u5355"),R(I)):T.pageNumber===7?E(a("Day Master in context","\u65E5\u4E3B\u7684\u7ED3\u6784\u4F4D\u7F6E"),N(I))+E(a("Seasonal reference","\u5B63\u8282\u5B9A\u4F4D"),`<div data-part="season-line">${[["SPRING","Spring","\u6625"],["SUMMER","Summer","\u590F"],["AUTUMN","Autumn","\u79CB"],["WINTER","Winter","\u51AC"]].map(([O,m,S])=>`<span data-selected="${O===I.context.season.name.toUpperCase()||I.context.season.name.includes(S)}">${t(a(m,S))}</span>`).join("")}</div><div data-part="metrics"><span>${t(a("Month branch","\u6708\u652F"))}<b>${t(I.context.season.glyph)}</b></span><span>${t(a("Element","\u4E94\u884C"))}<b>${t(I.context.season.label)}</b></span><span>${t(a("Root records","\u6839\u6C14\u8BB0\u5F55"))}<b>${I.context.roots.value}</b></span></div>`):T.pageNumber===8?E(a("Stems \xB7 branches \xB7 positions","\u5929\u5E72 \xB7 \u5730\u652F \xB7 \u67F1\u4F4D"),i(I,!0))+E(a("The day stem is the reference point","\u4EE5\u65E5\u5E72\u4E3A\u53C2\u7167"),`<div data-part="metrics"><span>${t(a("Day Master","\u65E5\u4E3B"))}<b>${t(I.context.dayMaster.glyph)} ${t(I.context.dayMaster.label)}</b></span><span>${t(a("Month command","\u6708\u4EE4"))}<b>${t(I.context.season.glyph)} ${t(I.context.season.label)}</b></span><span>${t(a("Pillars","\u56DB\u67F1"))}<b>${I.pillars.length}</b></span></div>`):T.pageNumber===9?E(a("Element inventory","\u4E94\u884C\u6E05\u5355"),R(I))+E(a("Count composition","\u8BA1\u6570\u6784\u6210"),`<table data-part="inventory"><thead><tr><th>${t(a("Element","\u4E94\u884C"))}</th><th>${t(a("Stems","\u5929\u5E72"))}</th><th>${t(a("Branches","\u5730\u652F"))}</th><th>${t(a("Hidden","\u85CF\u5E72"))}</th><th>${t(a("Total","\u5408\u8BA1"))}</th></tr></thead><tbody>${I.elements.map(O=>`<tr><th data-element="${O.id}">${t(O.label)}</th><td>${O.breakdown.visibleStems}</td><td>${O.breakdown.visibleBranches}</td><td>${O.breakdown.hiddenStemsUnweighted}</td><td>${O.value}</td></tr>`).join("")}</tbody></table>`):E(a("Generating & controlling cycles","\u76F8\u751F\u4E0E\u76F8\u514B\u5FAA\u73AF"),`<div data-part="relationship-layout">${g(I)}<div data-part="relation-keys">${["SUBJECT_GENERATES_TARGET","SUBJECT_CONTROLS_TARGET"].map((O,m)=>`<section><h4>${t(m?a("Dashed \u2192 controls","\u865A\u7EBF \u2192 \u76F8\u514B"):a("Solid \u2192 generates","\u5B9E\u7EBF \u2192 \u76F8\u751F"))}</h4>${I.edges.filter(S=>S.relation===O).map(S=>`<p>${t(I.nodes.find(p=>p.id===S.from).label)} \u2192 ${t(I.nodes.find(p=>p.id===S.to).label)}</p>`).join("")}</section>`).join("")}</div></div>`)+E(a("Inventory stays distinct from relationship intensity","\u6E05\u5355\u8BA1\u6570\u4E0D\u7B49\u4E8E\u5173\u7CFB\u5F3A\u5EA6"),l(I))};return`<article class="vrpt-report" data-visual-batch="${e.visualBatch}" data-report-locale="${s}" lang="${s==="bilingual"?"zh-Hans":s}">${e.pages.map(T=>`<section class="vrpt-page" id="${T.pageId}" data-page-number="${T.pageNumber}" data-master="${T.visualTemplateId}"><header data-part="chrome"><div><strong>P H I O S</strong><small>HUMAN POTENTIAL INTELLIGENCE</small></div><span>${t(a("BAZI \xB7 FULL REPORT","\u516B\u5B57 \xB7 \u5B8C\u6574\u62A5\u544A"))}<br>${String(T.pageNumber).padStart(2,"0")}</span></header><div class="vrpt-heading"><span data-part="page-index">${String(T.pageNumber).padStart(2,"0")}<small>/ 26</small></span><div><small>${t(a("STRUCTURAL","\u7ED3\u6784\u5C42"))}</small><h2>${T.title.split(" / ").map(I=>`<span>${t(I)}</span>`).join("")}</h2><p>${t(T.question)}</p></div></div><div data-part="page-body"><figure class="vrpt-primary">${nn(T)}<figcaption>${t(T.visual.unit)}</figcaption></figure><div class="vrpt-insights">${T.insights.map((I,O)=>`<article class="vrpt-tile" data-card-type="${["PRIMARY_INSIGHT","CONDITION","OPEN_QUESTION"][O]}" data-source-ref="${t(I.sourceRef)}"><small>${t([a("Structure","\u7ED3\u6784"),a("Condition","\u6761\u4EF6"),a("Observe","\u89C2\u5BDF")][O])}</small><p>${t(I.text)}</p></article>`).join("")}</div></div><aside class="vrpt-boundary">${t(T.boundaryText)}</aside><details class="vrpt-evidence"><summary>${t(a("Data & source lineage","\u6570\u636E\u4E0E\u6765\u6E90\u8FFD\u6EAF"))}</summary><ul>${T.evidenceRefs.map(I=>`<li>${t(I)}</li>`).join("")}</ul></details><footer><span>${t(a("Your life, in context.","\u5728\u60C5\u5883\u4E2D\u7406\u89E3\u4F60\u7684\u4EBA\u751F\u3002"))}</span><span>${String(T.pageNumber).padStart(2,"0")} / 26</span></footer></section>`).join("")}</article>`}var z=[{methodId:"BZR",sourceConversation:"6aaa576d-03bc-83ec-a176-5f8885313c6f",pages:[{pageNumber:1,title:{"zh-Hans":"\u516B\u5B57\u5B8C\u6574\u62A5\u544A",en:"BAZI FULL REPORT"},sourceText:`## 01\uFF5C\u516B\u5B57\u5B8C\u6574\u62A5\u544A
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

---`,sourcePath:"docs/guided-report-successor-r1/reference-cross.md",role:"PARTICIPATION_BOUNDARY_CLOSING",master:"M08"}],humanReview:"PENDING",sourceRole:"USER_DESIGN_REFERENCE_NOT_NEW_METHOD_MEANING"}];var W="GUIDED_REPORT_SUCCESSOR_R2",Ln=Object.freeze({reportSchemaVersion:W,visualSystemVersion:"2.0.0",composerPolicyVersion:"2.0.0",temporalPolicyVersion:"2.0.0",pageRegistryVersion:"2.0.0"}),sn=e=>e.pageNumber<=6?"INTRO_EXISTING":e.master==="M07"?"TIMING":/CLOS|BOUNDARY/.test(e.role)?"CLOSURE":/NAVIGATION/.test(e.role)?"NAVIGATION":e.master==="M06"||e.master==="M08"?"DOMAIN_READING":"STRUCTURAL",Dn=Object.freeze(z.map(e=>Object.freeze({method:e.methodId,totalPages:e.pages.length,pages:e.pages.map(n=>Object.freeze({method:e.methodId,pageKey:n.role,sequence:n.pageNumber,section:n.master,contentType:sn(n),executionClass:n.pageNumber<=6?"T1_CANONICAL_ASSEMBLY":n.pageNumber<16?"T2_LIGHT_COMPOSITION":"T3_DEEP_COMPOSITION",requiredEvidence:["ADMITTED_METHOD_READING","SOURCE_BOUND_PAGE"],visualVariant:n.pageNumber===7?"P07_ENTRY_VARIANT":[16,20,25].includes(n.pageNumber)?"SECTION":"BODY",localeSupport:["zh-Hans","en"],pagination:n.pageNumber===1?"NONE":"GLOBAL",customerVisible:!0,fallbackPolicy:"CANONICAL_HUMANIZATION",title:n.title}))}))),$=Object.freeze(Object.fromEntries([["BZR","BaZi","\u516B\u5B57","LANDSCAPE_RINGS"],["ZWR","Zi Wei","\u7D2B\u5FAE\u6597\u6570","PALACE_GRID"],["AST","Astrology","\u5360\u661F","ORBITS"],["PROFILE","Profile","\u81EA\u6211\u753B\u50CF","LAYERS"],["NUM","Numerology","\u6570\u5B57\u5B66","SEQUENCE"],["ECR","ECR","\u5177\u8EAB\u73B0\u5B9E","FIELDS"],["HD","Human Design","\u4EBA\u7C7B\u56FE","CHANNELS"],["CROSS","Cross","\u7EFC\u5408\u8BFB\u53D6","INTERSECTIONS"]].map(([e,n,r,c])=>[e,Object.freeze({method:e,label:{en:n,"zh-Hans":r},bodyBackground:null,sectionBackground:null,motif:c,localeIndependent:!0,backgroundSafeArea:"CENTRAL_80_PERCENT",status:"VISUAL_ASSET_ENHANCEMENT_PENDING",fallback:"CSS_CANONICAL_PREMIUM",version:"2.0.0",accentTokens:["--phi-report-gold","--phi-report-navy"],diagramTokens:["--phi-report-gold-line"]})])));function w(e,n){if(!Number.isInteger(e)||!Number.isInteger(n)||e<1||e>n)throw Error("PUBLICATION_PAGINATION_INVALID");return e===1?"":`${String(e).padStart(2,"0")} / ${n}`}function F(e){if(e?.schemaVersion!==W||e.customerPublishable!==!1||e.successorBaselineActivated!==!1)throw Error("PUBLICATION_CANDIDATE_GATE_REQUIRED");if(!$[e.methodId]||!["zh-Hans","en"].includes(e.locale))throw Error("PUBLICATION_METHOD_OR_LOCALE_INVALID");return e}function K(e,n){let r=w(e,n);return r?`<span data-pagination-owner="GlobalReportPagination" aria-label="${d(r)}">${r}</span>`:""}function k(e){return[...e.querySelectorAll(".pub-page")].map(n=>{let r=!1;for(let c of["STANDARD","COMPACT","REFLOW"]){n.dataset.textFit=c;let s=n.getBoundingClientRect().bottom,a=n.querySelector("footer").getBoundingClientRect();if(r=n.scrollHeight<=n.clientHeight+2&&a.bottom<=s,r)break}return{pageNumber:Number(n.dataset.pageNumber),variant:n.dataset.textFit,fits:r}})}function Z(e){let n={LANDSCAPE_RINGS:'<path d="M0 270L70 190 130 240 210 120 300 245 390 155 480 270 600 180 720 280V340H0Z"/><path d="M0 300L130 210 230 280 350 195 460 270 580 220 720 310V340H0Z"/>',PALACE_GRID:'<path d="M80 60H640V300H80ZM220 60V300M360 60V300M500 60V300M80 140H640M80 220H640"/>',ORBITS:'<ellipse cx="360" cy="170" rx="260" ry="90"/><ellipse cx="360" cy="170" rx="180" ry="130"/>',CHANNELS:'<path d="M200 80L520 80 360 280ZM200 80L360 170 520 80M360 170V280"/>',INTERSECTIONS:'<circle cx="280" cy="170" r="120"/><circle cx="440" cy="170" r="120"/>',LAYERS:'<path d="M90 250Q360 20 630 250M90 210Q360 -20 630 210M90 290Q360 60 630 290"/>',SEQUENCE:'<path d="M100 250L220 90 360 250 500 90 620 250"/>',FIELDS:'<ellipse cx="360" cy="170" rx="240" ry="130"/><ellipse cx="360" cy="170" rx="180" ry="95"/><ellipse cx="360" cy="170" rx="100" ry="50"/>'};return`<svg class="pub-motif" viewBox="0 0 720 340" aria-hidden="true" focusable="false">${n[e]||n.LAYERS}</svg>`}function j(e){F(e);let{locale:n,totalPages:r,methodId:c}=e,s=$[c],a=(u,i)=>n==="en"?u:i,t=e.intro.map(u=>u.kind==="STATIC"?`<section class="pub-static" data-page-number="${u.pageNumber}" data-pagination-exception="APPROVED_BAKED_ASSET"><img src="${d(u.src)}" alt="${d(u.alt)}"></section>`:u.html).join(""),E=e.pages.map(u=>{if(u.pageFamily)return En(u,{locale:n,totalPages:r,skin:s,t:a});let i=u.facts.filter(l=>l.value!==void 0),o=u.primaryVisualHtml||(u.temporal?`<div class="pub-time"><span>${a("Observation date","\u89C2\u5BDF\u65E5\u671F")}<b>${d(u.temporal.date)}</b></span>${u.temporal.selectedLuck?`<span>${a("Luck cycle","\u5927\u8FD0")}<b>${d(u.temporal.selectedLuck)}</b></span>`:""}${u.temporal.annual?`<span>${a("Year pillar","\u6D41\u5E74")}<b>${d(u.temporal.annual)}</b></span>`:""}</div>`:i.length?`<div class="pub-facts" role="list">${i.slice(0,5).map(l=>`<div role="listitem"><b>${d(l.value)}</b><span>${d(l.label)}</span></div>`).join("")}</div>`:u.pageNumber===26?'<div class="pub-closing-mark" aria-hidden="true">\u25C7</div>':"");return`<section class="pub-page" data-page-number="${u.pageNumber}" data-page-key="${d(u.pageKey)}" data-variant="${u.visualVariant}" data-method-skin="${c}" data-text-fit="STANDARD">
  ${Z(s.motif)}<header class="pub-header"><span>PHI OS<small>${a("SEE DEEPER \xB7 LIVE CLEARER","\u770B\u89C1\u66F4\u6DF1 \xB7 \u6D3B\u51FA\u66F4\u6E05\u6670")}</small></span><span>${d(s.label[n])}<small>${a("PERSONAL READING","\u4E2A\u4EBA\u8BFB\u53D6")}</small></span></header>
  <div class="pub-heading"><p class="pub-section">${d(a({M04:"Structure & context",M05:"Balance & relationships",M06:"Your life in context",M07:"Time & experience",M08:"Observation & direction"}[u.section]||"Personal reading",{M04:"\u7ED3\u6784\u4E0E\u60C5\u5883",M05:"\u5E73\u8861\u4E0E\u8054\u7CFB",M06:"\u4EBA\u751F\u60C5\u5883",M07:"\u65F6\u95F4\u4E0E\u7ECF\u9A8C",M08:"\u89C2\u5BDF\u4E0E\u65B9\u5411"}[u.section]||"\u4E2A\u4EBA\u8BFB\u53D6"))}</p><h2>${d(u.title)}</h2>${u.lead?`<p class="pub-lead">${d(u.lead)}</p>`:""}</div>
  ${o?`<figure class="pub-visual" aria-label="${d(u.title)}">${o}</figure>`:""}
  <div class="pub-narrative">${u.paragraphs.map(l=>`<p>${d(l)}</p>`).join("")}</div>
  ${u.provenanceHighlights?.length?`<ul class="pub-provenance">${u.provenanceHighlights.map(l=>`<li>${d(l)}</li>`).join("")}</ul>`:""}
  ${u.observation||u.counterSignal?`<aside class="pub-reflection"><h3>${a("Bring it into experience","\u628A\u8BFB\u53D6\u5E26\u56DE\u7ECF\u9A8C")}</h3>${u.observation?`<p>${d(u.observation)}</p>`:""}${u.counterSignal?`<p>${d(u.counterSignal)}</p>`:""}</aside>`:""}
  <p class="pub-boundary">${d(u.boundary)}</p><footer class="pub-footer"><span>${a("Your life, in context.","\u5728\u60C5\u5883\u4E2D\u7406\u89E3\u4F60\u7684\u4EBA\u751F\u3002")}</span>${K(u.pageNumber,r)}</footer></section>`}).join("");return`<article class="pub-report" lang="${n}" data-publication-version="2.0.0" data-method="${c}">${t}${E}</article>`}function on(e){let n=e.visualBinding||{};return`<div class="pub-decoration" aria-hidden="true">${[[0,n.bodyUrl],[1,n.motifUrl],[2,e.pageFamily==="SECTION_OPENER_PAGE"?n.url:null]].filter(([,c])=>c).map(([c,s])=>`<img data-decorative-layer="${c}" ${c===2?`data-fallback-sources="${d(JSON.stringify(n.candidates||[]))}"`:""} src="${d(s)}" alt="">`).join("")}</div>`}function cn(e){return`<svg class="pub-section-landscape" viewBox="0 0 800 600" aria-hidden="true"><circle cx="${600-Number(e)%3*45}" cy="240" r="46" fill="#cfb77e" opacity=".25"/><path d="M0 480 Q100 470 175 360 L260 425 350 310 445 420 530 355 655 450 800 330V600H0Z" fill="#bcc5c0" opacity=".48"/><path d="M0 555L110 445 200 485 330 390 430 505 550 460 640 410 800 520V600H0Z" fill="#8e9b93" opacity=".35"/><path d="M0 600Q120 500 260 555T550 530T800 575" fill="none" stroke="#b7975f" stroke-width="2"/><path d="M100 540Q280 505 410 548T760 555" fill="none" stroke="#b7975f" opacity=".65"/></svg>`}function En(e,{locale:n,totalPages:r,skin:c,t:s}){let a=e.pageFamily==="SECTION_OPENER_PAGE",t=e.heroPlacement||["hero-bottom","hero-right","hero-left","hero-full-fade"][(Number(e.sectionNumber)-1)%4],E=`<header class="pub-header"><span>PHI OS<small>${s("SEE DEEPER \xB7 LIVE CLEARER","\u770B\u89C1\u66F4\u6DF1 \xB7 \u6D3B\u51FA\u66F4\u6E05\u6670")}</small></span><span>${d(c.label[n])}<small>${d(e.sectionTitle[n])}</small></span></header>`,u=a?`<div class="pub-opener-heading"><span class="pub-section-number">${d(e.sectionNumber)}</span><h2 lang="zh-Hans">${d(e.sectionTitle["zh-Hans"])}</h2><p lang="en">${d(e.sectionTitle.en)}</p></div>`:`<div class="pub-heading"><p class="pub-section">${d(e.sectionNumber)} \xB7 ${d(e.sectionTitle[n])}</p><h2>${d(e.title)}</h2></div>`,i=e.temporal?`<dl class="pub-time"><div><dt>${s("Observation time","\u89C2\u5BDF\u65F6\u95F4")}</dt><dd>${d(e.temporal.date)}<small>${d(e.temporal.localTime||"")} \xB7 ${d(e.temporal.timezone)}</small></dd></div><div><dt>${s("Luck cycle","\u5927\u8FD0")}</dt><dd>${d(e.temporal.selectedLuck||s("Outside resolved range","\u8D85\u51FA\u5DF2\u89E3\u6790\u8303\u56F4"))}</dd></div><div><dt>${s("Year pillar","\u6D41\u5E74")}</dt><dd>${d(e.temporal.annual||s("Not admitted","\u672A\u83B7\u51C6"))}</dd></div></dl>`:"",o=e.items?.length?`<ol class="pub-insights">${e.items.map((N,g)=>`<li><span aria-hidden="true">${String(g+1).padStart(2,"0")}</span><p>${d(N)}</p></li>`).join("")}</ol>`:"",l=e.facts?.length?`<div class="pub-facts">${e.facts.map(N=>`<div><b>${d(N.value)}</b><span>${d(N.label)}</span></div>`).join("")}</div>`:"",R=e.observations?.length?`<aside class="pub-reflection"><h3>${s("Questions for this period","\u8FD9\u4E00\u9636\u6BB5\u7684\u89C2\u5BDF\u95EE\u9898")}</h3>${e.observations.map(N=>`<p>${d(N)}</p>`).join("")}</aside>`:"";return`<section class="pub-page pub-family" data-page-number="${e.pageNumber}" data-page-key="${d(e.pageKey)}" data-page-family="${d(e.pageFamily)}" data-section="${d(e.sectionKey)}" data-hero-placement="${t}" data-body-variant="BODY_${["A","B","C"][(e.pageNumber-7)%3]}" data-text-fit="STANDARD">${on(e)}${a?cn(e.sectionNumber):Z(c.motif)}${E}${u}${e.primaryVisualHtml?`<figure class="pub-visual">${e.primaryVisualHtml}</figure>`:""}${i}${l}<div class="pub-narrative">${e.paragraphs.map(N=>`<p>${d(N)}</p>`).join("")}</div>${o}${R}${e.boundary?`<p class="pub-boundary">${d(e.boundary)}</p>`:""}<footer class="pub-footer"><span>${s("Your life, in context.","\u5728\u60C5\u5883\u4E2D\u7406\u89E3\u4F60\u7684\u4EBA\u751F\u3002")}</span>${K(e.pageNumber,r)}</footer></section>`}async function q(e){await Promise.all([...e.querySelectorAll(".pub-decoration img")].map(async n=>{let r=n.dataset.fallbackSources?JSON.parse(n.dataset.fallbackSources):[n.getAttribute("src")];for(let c of r)try{n.src=c,await n.decode();return}catch{}n.remove()}))}var h=e=>Array.isArray(e)?e:[],Q=(e,n=22)=>{let r=/[\u3400-\u9fff]/u.test(e),c=r?[...e]:String(e).split(/\s+/),s=[],a="";for(let t of c){let E=a+(a&&!r?" ":"")+t;[...E].length>n&&a?(s.push(a),a=t):a=E}return a&&s.push(a),s},X=(e,n,r,c=22,s="")=>`<text class="${s}" x="${n}" y="${r}" text-anchor="middle">${Q(String(e),c).map((a,t)=>`<tspan x="${n}" dy="${t?21:0}">${d(a)}</tspan>`).join("")}</text>`;function dn(e){let n=h(e.nodes),r=e.type;if(!n.length)return"";let c=Y(e);if(c)return c;if(r==="MINI_CARD"&&n.every(i=>/^images\/phi-cards\/phi-card-[a-z0-9-]+\.webp$/.test(i.asset?.objectKey||"")))return`<div class="vrpt-phi-cards">${n.map(i=>`<article><img src="https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev/${i.asset.objectKey}" width="240" height="320" alt="${d(i.label)}" data-phi-card-asset="${d(i.asset.assetId)}"><strong>${d(i.label)}</strong><p>${d(i.secondary)}</p></article>`).join("")}</div>`;if(r==="STRUCTURAL_DIAGRAM"&&n.length===12&&n.every(i=>Number.isInteger(i.row)&&Number.isInteger(i.col)))return`<div class="vrpt-palaces" role="img" aria-label="${d(e.a11ySummary)}">${n.map(i=>`<article style="grid-row:${i.row};grid-column:${i.col}"><small>${d(i.code)}</small><strong>${d(i.label)}</strong><p>${h(i.stars).map(o=>d(o.label)).join(" \xB7 ")}</p></article>`).join("")}<div class="vrpt-palaces-center">PHI OS<br>Zi Wei</div></div>`;if(/^\/assets\/reports\/PHIOS-COM-REPORT-(ECR|BAZI|ZIWEI|ASTROLOGY|NUMEROLOGY|PROFILE|HD|CROSS)-FULL-v1\.svg$/.test(e.coverAssetUrl||""))return`<img class="vrpt-cover-art" src="${e.coverAssetUrl}" alt="${d(e.a11ySummary)}" width="240" height="320">`;if(r==="BAR"){if(n.some(l=>typeof l.value!="number"||!Number.isFinite(l.value)||l.value<0))throw Error("VRPT_CHART_VALUE_REQUIRED");let i=Math.max(...n.map(l=>l.value),.001),o=n.length*38+60;return`<svg viewBox="0 0 680 ${o}" role="img" aria-label="${d(e.a11ySummary)}"><title>${d(e.unit)}</title>${n.map((l,R)=>`<text x="10" y="${R*38+28}">${d(`${l.rank?l.rank+". ":""}${l.label}`)}</text><rect x="200" y="${R*38+10}" width="${l.value/i*360}" height="21" rx="3"/><text x="575" y="${R*38+28}">${Number(l.value.toFixed(4))}</text>`).join("")}<text x="10" y="${o-10}" class="vrpt-axis">${d(e.unit)}</text></svg>`}if(["MINI_CARD","DOMAIN_GRID","RANKED_CARDS","SPLIT_COMPARE","FLOW","TIMELINE","CONFIDENCE_OR_EVIDENCE_BADGE"].includes(r))return`<div class="vrpt-tiles">${n.map(i=>`<article class="vrpt-tile${/^-?\d+(\.\d+)?$/.test(i.secondary||"")?" vrpt-number-tile":""}"${r==="FLOW"&&h(e.edges).some(o=>o.from===i.id)?' data-flow-connected="true"':""}${i.selected?' data-selected="true"':""}><span>${d(i.role||i.code||"")}</span><h3>${d(i.label)}</h3>${i.secondary?`<p>${d(i.secondary)}</p>`:""}</article>`).join("")}</div>`;if(!["RADIAL_MAP","CYCLE","LAYER_STACK","NETWORK","STRUCTURAL_DIAGRAM","NODE_MAP"].includes(r))throw Error(`VRPT_COMPONENT_NOT_IMPLEMENTED:${r}`);let s=["RADIAL_MAP","CYCLE"].includes(r),a=r==="LAYER_STACK",t=n.length>4&&!s&&!a,E=n.map((i,o)=>t?{x:120+o%3*220,y:75+Math.floor(o/3)*135}:n.length===1?{x:340,y:275}:s?{x:340+225*Math.cos(-Math.PI/2+o*2*Math.PI/n.length),y:275+205*Math.sin(-Math.PI/2+o*2*Math.PI/n.length)}:a?{x:o===2?340:180+o*320,y:o===2?425:130}:{x:n.length===2?190+o*300:o===0?145:465,y:n.length===2?250:o===0?270:100+(o-1)*170}),u=h(e.edges).map(i=>{let o=E[n.findIndex(R=>R.id===i.from)],l=E[n.findIndex(R=>R.id===i.to)];return o&&l?`<path class="vrpt-link" d="M${o.x},${o.y} L${l.x},${l.y}"/>`:""}).join("");return`<svg viewBox="0 0 680 560" role="img" aria-label="${d(e.a11ySummary)}"><title>${d(e.a11ySummary)}</title>${s?'<circle class="vrpt-orbit" cx="340" cy="275" r="210"/>':""}${u}${n.map((i,o)=>{let{x:l,y:R}=E[o],N=Q(i.label,s||t?13:23);return`<g class="vrpt-node${i.selected?" is-selected":""}"><rect x="${l-(s||t?82:122)}" y="${R-48}" width="${s||t?164:244}" height="${Math.max(96,N.length*22+46)}" rx="18"/>${X(i.label,l,R-10,s||t?13:23)}${X(`${i.selected?"\u25CF ":""}${i.role||i.code||""}`,l,R+N.length*21+7,25,"vrpt-node-code")}</g>`}).join("")}</svg>`}function ln(e){let n=dn(e),r=h(e.nodes);if(e.type==="BAR"){let c=Math.max(...r.map(s=>s.value),.001);return`<div class="vrpt-wide-diagram">${n}</div><div class="vrpt-compact-diagram vrpt-bars">${r.map(s=>`<div><strong>${d(s.label)}</strong><div class="vrpt-bar-track"><i style="width:${s.value/c*100}%"></i></div><span>${d(Number(s.value.toFixed(4)))}</span></div>`).join("")}<small>${d(e.unit||"")}</small></div>`}return["NETWORK","NODE_MAP","LAYER_STACK"].includes(e.type)?`<div class="vrpt-wide-diagram">${n}</div><div class="vrpt-compact-diagram vrpt-network">${r.map(c=>`<article><small>${d(c.role||c.code||"")}</small><strong>${d(c.label)}</strong></article>`).join("")}${h(e.edges).length?`<div class="vrpt-connections">${e.edges.map(c=>`<p>${d(r.find(s=>s.id===c.from)?.label||c.from)} <span>\u2192</span> ${d(r.find(s=>s.id===c.to)?.label||c.to)}</p>`).join("")}</div>`:""}</div>`:n}function f(e,{primaryVisuals:n={}}={}){if(e?.schemaVersion==="GUIDED_REPORT_SUCCESSOR_R2")return j(e);if(["BAZI-DYNAMIC-R1-BATCH-01","BAZI-DYNAMIC-R1-BATCH-02","BAZI-DYNAMIC-R1-BATCH-03","BAZI-DYNAMIC-R1-BATCH-04","BAZI-DYNAMIC-R1-BATCH-05"].includes(e?.visualBatch)&&!e.presentationSchema)return v(e);if(e?.presentationSchema==="PHI-OS-REPORT-PRESENTATION-R2")return In(e,{primaryVisuals:n});if(e?.schemaVersion!=="PHI-OS-PERSONAL-READING-VISUAL-PAGES-v1.0.0")throw Error("VRPT_PAGE_REPORT_REQUIRED");let r=e.locale==="zh-Hans";return`<article class="vrpt-report" data-visual-report="${d(e.productId)}" data-depth="${d(e.depth)}">${e.pages.map((c,s)=>`<section class="vrpt-page" id="${d(c.pageId)}" data-template="${d(c.templateId)}" data-page-id="${d(c.pageId)}"><header class="vrpt-heading"><span>PHI OS \xB7 ${d(e.depth)} \xB7 ${String(c.pageNumber??s+1).padStart(2,"0")}</span><h2>${d(c.title)}</h2><p>${d(c.question)}</p></header><figure class="vrpt-primary" data-visual-type="${d(c.visual.type)}">${n[c.pageId]||ln(c.visual)}<figcaption>${d(c.visual.unit||"")}</figcaption></figure><div class="vrpt-insights">${h(c.insights).map(a=>`<p data-source-ref="${d(a.sourceRef)}">${d(a.text)}</p>`).join("")}${c.navigationPrompt?`<p>${d(c.navigationPrompt.text)}</p>`:""}</div>${c.boundaryText?`<aside class="vrpt-boundary">${d(c.boundaryText)}</aside>`:""}<details class="vrpt-evidence"><summary>${r?"\u6570\u636E\u4E0E\u6765\u6E90":"Data and sources"}</summary><table><caption>${d(c.question)}</caption><tbody>${c.visual.nodes.map(a=>`<tr><th scope="row">${d(a.label)}</th><td>${d(a.rawValue?JSON.stringify(a.rawValue):a.value??a.secondary??a.code??"")}</td><td>${h(a.sourceRefs).map(d).join(" \xB7 ")}</td></tr>`).join("")}</tbody></table><ul>${c.evidenceRefs.map(a=>`<li>${d(a)}</li>`).join("")}</ul></details><footer>PHI OS \xB7 REVIEW ONLY <span>${String(c.pageNumber??s+1).padStart(2,"0")} / ${e.totalPages??e.pages.length}</span></footer></section>`).join("")}${e.depth==="FREE"?`<div class="vrpt-upgrade"><p>${r?"\u5B8C\u6574\u62A5\u544A\u6839\u636E\u53EF\u7528\u6765\u6E90\u5C55\u5F00\u7ED3\u6784\u5173\u7CFB\u3001\u6761\u4EF6\u3001\u65F6\u95F4\u5C42\u4E0E\u89C2\u5BDF\u95EE\u9898\u3002":"The full report expands source-supported relationships, conditions, timing and observation questions."}</p><button disabled aria-disabled="true">${r?"\u5B8C\u6574\u62A5\u544A \xB7 \u5F85\u5BA1\u6838\u5F00\u653E":"Full report \xB7 awaiting review"}</button></div>`:""}</article>`}function un(e,n){let r=e?.visualType||"STRUCTURAL_DIAGRAM",c=/BAR|RADIAL|CYCLE|DONUT|DISTRIBUTION/.test(r)?"distribution":/FLOW|TIMELINE/.test(r)?"timeline":/NETWORK|NODE|LAYER|STRUCTURAL/.test(r)?"structure":"cards",s={distribution:'<circle cx="150" cy="145" r="82" fill="none" stroke-width="24"/><path d="M310 95h200M310 145h200M310 195h200" stroke-width="22"/>',timeline:'<path d="M70 145h460"/><circle cx="100" cy="145" r="24"/><circle cx="230" cy="145" r="24"/><circle cx="370" cy="145" r="24"/><circle cx="500" cy="145" r="24"/>',structure:'<path d="M300 145L120 75M300 145L120 215M300 145L480 75M300 145L480 215"/><circle cx="300" cy="145" r="48"/><rect x="60" y="45" width="120" height="60" rx="12"/><rect x="60" y="185" width="120" height="60" rx="12"/><rect x="420" y="45" width="120" height="60" rx="12"/><rect x="420" y="185" width="120" height="60" rx="12"/>',cards:'<rect x="65" y="45" width="210" height="85" rx="12"/><rect x="325" y="45" width="210" height="85" rx="12"/><rect x="65" y="165" width="210" height="85" rx="12"/><rect x="325" y="165" width="210" height="85" rx="12"/>'};return'<figure class="vrpt-preview-silhouette" data-preview-family="'+c+'"><svg viewBox="0 0 600 290" aria-hidden="true">'+s[c]+"</svg><figcaption>"+n("Visual layout preview \u2014 personal findings are locked.","\u56FE\u8868\u5E03\u5C40\u9884\u89C8\uFF1B\u4E2A\u4EBA\u7ED3\u679C\u5C1A\u672A\u89E3\u9501\u3002")+'</figcaption></figure><p role="status">'+n("Findings locked","\u5206\u6790\u7ED3\u679C\u5C1A\u672A\u89E3\u9501")+"</p>"}function In(e,n){let r=e.presentation.reportLocale,c=r==="zh-Hans",s=r==="bilingual",a=(E,u)=>s?`${u} / ${E}`:c?u:E,t={OPEN:a("Open","\u53EF\u9605\u8BFB"),PREVIEW:a("Preview","\u9884\u89C8"),PAID_LOCKED:a("Full report","\u5B8C\u6574\u62A5\u544A"),DATA_REQUIRED:a("Required material missing","\u7F3A\u5C11\u6240\u9700\u8D44\u6599"),CONDITIONAL:a("Conditional","\u89C6\u6761\u4EF6\u63D0\u4F9B"),NOT_APPLICABLE:a("Not applicable","\u4E0D\u9002\u7528")};return`<article class="vrpt-presented" lang="${s?"zh-Hans":d(r)}" data-report-locale="${d(r)}"><nav class="vrpt-report-map" aria-label="${a("Report map","\u62A5\u544A\u76EE\u5F55")}"><ol>${e.pages.map(E=>`<li><a href="#${d(E.pageId)}">${String(E.pageNumber).padStart(2,"0")} \xB7 ${d(E.titles?.[r]||E.sourcePage?.title||E.copy?.[c?"zh-Hans":"en"]?.title||a("Editorial page","\u5BFC\u8BFB\u9875"))}</a> \xB7 ${t[E.accessState]}</li>`).join("")}</ol></nav>${e.pages.map(E=>{if(E.kind==="STATIC_EDITORIAL")return`<section class="vrpt-editorial" id="${d(E.pageId)}"><header>PHI OS \xB7 ${E.pageNumber}</header>${E.error?`<p role="status">${a("Required editorial artwork is unavailable.","\u6240\u9700\u5BFC\u8BFB\u56FE\u7247\u5C1A\u4E0D\u53EF\u7528\u3002")}</p><code>${d(E.error)}</code>`:`<img src="${d(E.asset.src)}" alt="${d(E.copy?.[c?"zh-Hans":"en"]?.alt||a("Report cover","\u62A5\u544A\u5C01\u9762"))}" width="${E.asset.width}" height="${E.asset.height}">`}${E.copy?`<details><summary>${a("Accessible page text","\u9875\u9762\u6587\u5B57")}</summary>${(s?["zh-Hans","en"]:[r]).map(u=>`<div lang="${u}"><h2>${d(E.copy[u].title)}</h2><p>${d(E.copy[u].body)}</p><p>${d(E.copy[u].boundary)}</p></div>`).join("")}</details>`:""}</section>`;if(E.accessState!=="OPEN")return`<section class="vrpt-page vrpt-locked" id="${d(E.pageId)}"><header>${E.pageNumber} \xB7 ${t[E.accessState]}</header><h2>${d(E.titles?.[c?"zh-Hans":"en"]||"")}</h2><p>${d(E.values?.[c?"zh-Hans":"en"]||"")}</p>${E.accessState==="PAID_LOCKED"?un(E.preview,a):""}${E.accessState==="PAID_LOCKED"?`<a class="vrpt-unlock" href="/account/">${a("Choose report language and view price","\u9009\u62E9\u62A5\u544A\u8BED\u8A00\u5E76\u67E5\u770B\u4EF7\u683C")}</a>`:""}</section>`;if(s){let u=E.translations["zh-Hans"],i=E.translations.en,o=(R,N)=>R===N?R:`${R} / ${N}`,l={...u,title:o(u.title,i.title),question:o(u.question,i.question),insights:u.insights.map((R,N)=>({...R,text:o(R.text,i.insights[N].text)})),visual:{...u.visual,nodes:u.visual.nodes.map((R,N)=>({...R,label:o(R.label,i.visual.nodes[N].label)}))}};return`<section class="vrpt-locale-page vrpt-bilingual-shared" id="${d(E.pageId)}" data-page-number="${E.pageNumber}">${f({...e,presentationSchema:void 0,totalPages:e.pages.length,locale:"zh-Hans",depth:"PAID",pages:[{...E.sourcePage,...l,pageId:E.pageId+"-bilingual",pageNumber:E.pageNumber}]},n)}</section>`}return`<section class="vrpt-locale-page" id="${d(E.pageId)}" data-page-number="${E.pageNumber}">${Object.entries(E.translations).map(([u,i])=>`<div lang="${u}">${f({...e,presentationSchema:void 0,totalPages:e.pages.length,locale:u,depth:"PAID",pages:[{...E.sourcePage,...i,pageId:E.pageId+"-"+u,pageNumber:E.pageNumber}]},n)}</div>`).join("")}</section>`}).join("")}</article>`}var M="/docs/guided-report-successor-r2/bazi-t3",P=document.querySelector("script[data-locale]").dataset.locale||new URLSearchParams(location.search).get("locale")||"en";if(!["en","zh-Hans"].includes(P))throw Error("LOCALE_INVALID");document.documentElement.lang=P;var J=await(await fetch(`${M}/bazi-${P}.json`)).json(),y=document.querySelector("#report");y.innerHTML=f(J);document.querySelector("#pdf").href=`${M}/bazi-t3-${P}.pdf`;window.fitPublication=()=>k(y);window.addEventListener("beforeprint",window.fitPublication);await q(y);await document.fonts.ready;window.publicationSnapshot=J;window.batchReady=!0;var L=await(await fetch(`${M}/shadow-matrix.json`)).json(),D=document.createElement("select");D.id="profile";D.setAttribute("aria-label","Synthetic shadow profile");for(let e of new Set(L.matrix.map(n=>n.profileId))){let n=document.createElement("option");n.value=e,n.textContent=e,D.append(n)}document.querySelector("#section").before(D);var C=document.createElement("button");C.textContent="Run fixed shadow matrix";C.id="run-matrix";document.querySelector("#generate").after(C);C.onclick=async()=>{C.disabled=!0,document.querySelector("#generate").disabled=!0;let e=[],n=document.querySelector("#generation-status");try{for(let r of L.matrix){if(r.control||r.state==="SOURCE_REJECTED"){e.push(r);continue}n.textContent=`Shadow progress ${e.length} / ${L.matrix.length}`;let c=await fetch("/api/qa-bazi-t3",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({profileId:r.profileId,locale:r.locale,sectionKey:r.sectionKey})}),s=await c.json();if(e.push({profileId:r.profileId,locale:r.locale,sectionKey:r.sectionKey,httpStatus:c.status,...s}),!c.ok||s.result?.providerFailure||["PROVIDER_TIMEOUT","PROVIDER_CREDENTIAL_NOT_CONFIGURED","NO_ADMITTED_PROVIDER_ROUTE"].includes(s.result?.internalOnly?.fallbackReason))break}n.textContent=JSON.stringify({completed:e.length,total:L.matrix.length,productionActivated:!1,results:e},null,2)}catch{n.textContent=JSON.stringify({completed:e.length,total:L.matrix.length,error:"SHADOW_REQUEST_FAILED",results:e},null,2)}finally{C.disabled=!1,document.querySelector("#generate").disabled=!1}};document.querySelector("#compare").onclick=async()=>{let e=document.querySelector("#comparison");e.replaceChildren();let n=await(await fetch(`${M}/comparison-${P}.json`)).json();for(let r of n){let c=document.createElement("article"),s=document.createElement("h2");s.textContent=`${r.sectionKey} \xB7 ${r.status==="PASS"?"T3 CANDIDATE":"T3 UNAVAILABLE \u2014 T2 FALLBACK"}`,c.append(s);for(let[a,t]of[["T2 CURRENT",r.current],["T3 CANDIDATE",r.status==="PASS"?r.candidate:["No admitted T3 candidate yet."]]]){let E=document.createElement("div"),u=document.createElement("h3");u.textContent=a,E.append(u);for(let i of t){let o=document.createElement("p");o.textContent=i,E.append(o)}c.append(E)}e.append(c)}e.hidden=!e.hidden,y.hidden=!e.hidden};document.querySelector("#generate").onclick=async()=>{let e=document.querySelector("#generate"),n=document.querySelector("#generation-status");e.disabled=!0,n.textContent="Running one bounded Preview shadow attempt\u2026";try{let r=await fetch("/api/qa-bazi-t3",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({locale:P,sectionKey:document.querySelector("#section").value,profileId:D.value})}),c=await r.json();n.textContent=JSON.stringify({httpStatus:r.status,...c},null,2)}catch{n.textContent="Preview request failed. No production activation."}finally{e.disabled=!1}};
