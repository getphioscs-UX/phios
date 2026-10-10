// Presentation-only labels and a customer worksheet. The five accepted source
// blocks and all Publication IR / calculation records remain unchanged.
export const ZIWEI_NAVIGATION_FINALIZATION = 'ZWR-R2-F1';
export function finalizeZiweiNavigation(html, locale) {
 const zh=locale==='zh-Hans';
 const headings=zh?['需要保护什么','可以改变什么','哪些承诺不宜扩大','现在观察什么','哪些证据会修正这份读取']:['WHAT TO PROTECT','WHAT TO CHANGE','WHAT NOT TO OVER-COMMIT','WHAT TO OBSERVE NOW','WHAT EVIDENCE WOULD REVISE THIS READING'];
 const prompts=zh?['一个需要澄清的决定','一个需要减少或设限的承诺','一项需要保护的资源','一个需要持续观察的模式','一个会促使我修正这份读取的条件']:['One decision to clarify','One commitment to reduce or bound','One resource to protect','One pattern to observe','One condition that would make me revise this reading'];
 const window=`<aside class="zwr-next-review" data-review-purpose="OBSERVATION_ONLY"><h3>${zh?'下次复盘窗口':'NEXT REVIEW WINDOW'}</h3><p>${zh?'在未来 30–90 天内自选一个复盘日。这是观察与复盘期限，不是星象事件时间。写下：':'Choose a review date within the next 30–90 days. This is an observation and review horizon, not astrological event timing. Write down:'}</p><ul>${prompts.map(t=>`<li>${t}</li>`).join('')}</ul></aside>`;
 let count=0;
 const result=html.replace(/<p data-source-block="S11:B([1-5])">([\s\S]*?)<\/p>/g,(full,n)=>{count++;return `<div class="zwr-navigation-item"><h3>${headings[Number(n)-1]}</h3>${full}</div>${n==='5'?window:''}`;});
 if(count!==5)throw Error('ZIWEI_NAVIGATION_REQUIRES_FIVE_ACCEPTED_BLOCKS');
 return result;
}
