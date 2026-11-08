const config = window.NAMECARD_CONFIG;
const $ = id => document.getElementById(id);
const canonical = new URL(config.siteUrl).origin + '/';
let back = false, toastTimer;
const gaReady = location.origin === new URL(canonical).origin && /^G-[A-Z0-9]+$/.test(config.gaMeasurementId);
if (gaReady) {
  window.dataLayer = window.dataLayer || [];
  window.gtag = function(){ window.dataLayer.push(arguments); };
  // Apply before tag initialization, including any automatically configured destination.
  gtag('set',{send_page_view:false,page_location:canonical,page_title:'Digital namecard',page_referrer:'',allow_google_signals:false,allow_ad_personalization_signals:false});
  gtag('js',new Date());
  // Keep query strings, referrer parameters and contact values out of page metadata.
  gtag('config',config.gaMeasurementId,{send_page_view:false,allow_google_signals:false,allow_ad_personalization_signals:false,page_location:canonical,page_title:'Digital namecard',page_referrer:''});
  gtag('event','page_view',{page_location:canonical,page_title:'Digital namecard',page_referrer:''});
  const script=document.createElement('script');script.async=true;script.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(config.gaMeasurementId);document.head.append(script);
}
function track(event,params={}) { if(gaReady) window.gtag('event',event,{...params,page_location:canonical,page_title:'Digital namecard',page_referrer:''}); }
function toast(message) { clearTimeout(toastTimer);$('toast').textContent=message;$('toast').classList.add('show');toastTimer=setTimeout(()=>$('toast').classList.remove('show'),2600); }
function setSide(value) {
  back=value;$('large-dialog').classList.toggle('detail-back',back);$('flip-card').classList.toggle('is-back',back);
  $('flip-card').setAttribute('aria-label',back?'명함 앞면 보기':'명함 뒷면 보기');
  $('front').checked=!back;$('back').checked=back;
  document.querySelector('.front').setAttribute('aria-hidden',String(back));document.querySelector('.back').setAttribute('aria-hidden',String(!back));
  $('large-card').src=`assets/namecard-${back?'back':'front'}.png`;$('large-card').alt=back?'명함 뒷면':'명함 앞면';track('card_view',{card_side:back?'back':'front'});
}
$('flip-card').addEventListener('click',()=>setSide(!back));$('front').addEventListener('change',()=>setSide(false));$('back').addEventListener('change',()=>setSide(true));$('large-flip').addEventListener('click',()=>setSide(!back));
$('enlarge').addEventListener('click',()=>{$('large-dialog').showModal();track('card_enlarge');});
$('download-open').addEventListener('click',()=>$('download-dialog').showModal());
for(const b of document.querySelectorAll('[data-close]')) b.addEventListener('click',()=>$(b.dataset.close).close());
for(const dialog of document.querySelectorAll('dialog')) dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
async function copyText(text) {
  try { await navigator.clipboard.writeText(text);return true; } catch {
    const input=document.createElement('textarea');input.value=text;input.style.cssText='position:fixed;top:0;left:0;opacity:0';document.body.append(input);input.select();let ok=false;
    try{ok=document.execCommand('copy');}catch{} input.remove();return ok;
  }
}
for(const button of document.querySelectorAll('[data-copy]')) button.addEventListener('click',async()=>{
  const field=button.dataset.copy;const ok=await copyText(config[field]);toast(ok?(field==='email'?'이메일을 복사했어요':'전화번호를 복사했어요'):'복사하지 못했어요. 연락처를 길게 눌러 복사해 주세요.');if(ok)track('contact_copy',{contact_type:field});
});
async function share() {
  const data={title:`${config.name} · ${config.englishName}`,text:`${config.role} · ${config.team}`,url:canonical};
  if(navigator.share){try{await navigator.share(data);track('share',{method:'native',content_type:'namecard'});return;}catch(e){if(e.name==='AbortError')return;}}
  const ok=await copyText(canonical);toast(ok?'명함 링크를 복사했어요':'링크를 복사하지 못했어요. 주소창에서 복사해 주세요.');if(ok)track('share',{method:'copy_link',content_type:'namecard'});
}
$('share-top').addEventListener('click',share);$('share-main').addEventListener('click',share);
for(const link of document.querySelectorAll('[data-event]'))link.addEventListener('click',()=>track(link.dataset.event,link.dataset.side?{card_side:link.dataset.side}:{}));
for (const link of document.querySelectorAll('[data-profile]')) link.addEventListener('click', () => track('profile_link_click', {link_index:Number(link.dataset.profile)}));
function updateTheme(choice) {
  if (choice === 'auto') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = choice;
  for (const button of document.querySelectorAll('[data-theme-choice]')) button.checked = button.dataset.themeChoice === choice;
  try { localStorage.setItem('namecard-theme', choice); } catch {}
}
for (const button of document.querySelectorAll('[data-theme-choice]')) button.addEventListener('change', () => updateTheme(button.dataset.themeChoice));
updateTheme(document.documentElement.dataset.theme || 'auto');
$('zoom-toggle').addEventListener('click', () => {
  const zoomed = $('large-dialog').classList.toggle('zoomed');
  $('zoom-toggle').setAttribute('aria-pressed', String(zoomed));
  $('zoom-toggle').textContent = zoomed ? '화면에 맞추기' : '확대';
});
