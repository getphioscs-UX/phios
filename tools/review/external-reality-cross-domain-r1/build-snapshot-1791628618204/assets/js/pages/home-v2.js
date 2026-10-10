const form=document.querySelector('[data-px2-intent-form]');
form?.addEventListener('submit',event=>{event.preventDefault();const q=String(new FormData(form).get('q')||'').trim();if(q) location.href=`/ask?q=${encodeURIComponent(q)}`;});
