// The site's own visual recipe: dark navy hall, chalk-white type, the pink
// slip the winner is written on. Rendered after the platform stylesheet, so
// these rules have the last word. Owner: the site's engineer from now on.

export const recipeStyles = `
:root{
  --wn-bg:#1a2039;
  --wn-panel:#232c4b;
  --wn-panel-2:#2b3559;
  --wn-ink:#eef1f8;
  --wn-soft:#c6cfe6;
  --wn-meta:#93a0c6;
  --wn-pink:#f9a3c0;
  --wn-pink-ink:#1a2039;
  --wn-line:rgba(238,241,248,.14);
  --wn-line-soft:rgba(238,241,248,.08);
  --fs-xs:13.5px;
  --fs-body:16px;
  --fs-h3:20px;
  --fs-h2:28px;
  --fs-display:clamp(34px,4.4vw,56px);
  --wn-radius:14px;
  --wn-radius-sm:10px;
  --wn-max:1360px;
  --wn-gap:20px;
  --wn-font:var(--font-albert,"Albert Sans",ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif);
  --wn-display:var(--font-imbue,"Imbue",Georgia,serif);
}
*,*::before,*::after{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{
  margin:0;background:var(--wn-bg);color:var(--wn-ink);
  font-family:var(--wn-font);font-size:var(--fs-body);line-height:1.55;
  text-rendering:optimizeLegibility;-webkit-font-smoothing:antialiased;
}
body::selection{background:rgba(249,163,192,.35)}
a{color:var(--wn-ink);text-decoration:underline;text-decoration-thickness:1px;text-decoration-color:rgba(249,163,192,.75);text-underline-offset:3px}
a:hover{text-decoration-color:var(--wn-pink)}
:focus-visible{outline:2px solid var(--wn-pink);outline-offset:2px;border-radius:4px}
h1,h2,h3,h4,p{margin:0}
img{max-width:100%;height:auto}
button{font:inherit;color:inherit}
.wn-main{max-width:var(--wn-max);margin:0 auto;padding:0 28px}
.wn-skip{position:absolute;left:16px;top:0;width:1px;height:1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;background:var(--wn-pink);color:var(--wn-pink-ink);z-index:60}
.wn-skip:focus{width:auto;height:auto;clip:auto;overflow:visible;padding:10px 16px;border-radius:0 0 8px 0}

/* ---------------- chrome ---------------- */
header[data-chrome="site"]{
  position:relative;z-index:20;
  background:var(--wn-bg);
}
header[data-chrome="site"] > nav{
  max-width:var(--wn-max);margin:0 auto;padding:10px 28px;min-height:64px;
  display:flex;align-items:center;gap:26px;
}
.brand{display:inline-flex;align-items:center;gap:10px;text-decoration:none;color:var(--wn-ink);font-weight:600;font-size:18px;letter-spacing:-.01em;min-height:44px}
.brand-logo{width:28px;height:28px;border-radius:8px}
.brand-wordmark{white-space:nowrap}
.brand::before{
  content:"";width:26px;height:26px;border-radius:50%;
  background:conic-gradient(var(--wn-pink) 0 25%,#41507f 25% 50%,var(--wn-pink) 50% 75%,#41507f 75% 100%);
  box-shadow:inset 0 0 0 3px var(--wn-bg);
}
.brand:has(.brand-logo)::before{display:none}
.nav-links{display:flex;align-items:center;gap:26px;margin-left:8px}
.nav-link{
  appearance:none;background:none;border:0;padding:8px 0;min-height:44px;
  color:var(--wn-soft);font-size:15px;text-decoration:none;cursor:pointer;
  display:inline-flex;align-items:center;gap:6px;
  border-bottom:2px solid transparent;
}
.nav-link:hover{color:var(--wn-ink);border-bottom-color:var(--wn-pink)}
.nav-link[aria-current="page"]{color:var(--wn-ink);border-bottom-color:var(--wn-pink)}
.nav-group{position:relative}
.nav-group > summary{list-style:none;cursor:pointer;display:inline-flex;align-items:center;gap:6px;min-height:44px;color:var(--wn-soft);font-size:15px;padding:8px 0;border-bottom:2px solid transparent}
.nav-group > summary::-webkit-details-marker{display:none}
.nav-group > summary::after{content:"";width:6px;height:6px;border-right:1.6px solid currentColor;border-bottom:1.6px solid currentColor;transform:rotate(45deg) translateY(-2px);opacity:.7}
.nav-group[open] > summary{color:var(--wn-ink);border-bottom-color:var(--wn-pink)}
.nav-group-links{
  position:absolute;top:calc(100% + 6px);left:-14px;min-width:210px;
  background:var(--wn-panel);border:1px solid var(--wn-line);border-radius:12px;
  padding:8px;display:flex;flex-direction:column;gap:2px;
  box-shadow:0 18px 40px rgba(8,12,26,.45);
}
.nav-group-links .nav-link{min-height:40px;border-bottom:0;padding:8px 10px;border-radius:8px}
.nav-group-links .nav-link:hover{background:var(--wn-panel-2);color:var(--wn-ink)}
.nav-actions{margin-left:auto;display:flex;align-items:center;gap:12px}
.nav-signin{
  appearance:none;border:1px solid var(--wn-line);background:var(--wn-panel);
  color:var(--wn-ink);border-radius:999px;padding:0 18px;min-height:40px;font-size:15px;cursor:pointer;
}
.nav-signin:hover{background:var(--wn-panel-2);border-color:rgba(249,163,192,.5)}
.nav-signin:active{background:#1c2440}
.mobile-nav{display:none;margin-left:auto}
.mobile-nav > summary{
  list-style:none;width:44px;height:44px;display:grid;place-items:center;cursor:pointer;
  border:1px solid var(--wn-line);border-radius:10px;background:var(--wn-panel);color:var(--wn-ink);
}
.mobile-nav > summary::-webkit-details-marker{display:none}
.mobile-nav-links{
  position:absolute;left:0;right:0;top:100%;background:var(--wn-panel);
  border-bottom:1px solid var(--wn-line);padding:10px 20px 18px;display:flex;flex-direction:column;gap:2px;
  box-shadow:0 22px 40px rgba(8,12,26,.5);
}
.mobile-nav-links .nav-link{min-height:46px;border-bottom:0;color:var(--wn-ink);font-size:16px}

html,body{overflow-x:clip}
footer[data-node="footer"]{
  margin-top:72px;padding:44px 0 34px;
  background:#161c31;color:var(--wn-soft);
}
.footer-shell{max-width:var(--wn-max);margin:0 auto;padding:0 28px}
.footer-groups{display:grid;grid-template-columns:1.4fr repeat(3,1fr);gap:32px}
.footer-group-title{font-size:var(--fs-xs);color:var(--wn-meta);margin-bottom:10px;font-weight:600}
.footer-group ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px}
.footer-group a{color:var(--wn-soft);text-decoration:none;font-size:15px}
.footer-group a:hover{color:var(--wn-pink)}
.footer-nav{display:flex;flex-wrap:wrap;gap:8px 20px;margin-top:30px}
.footer-nav a{color:var(--wn-soft);text-decoration:none;font-size:var(--fs-xs)}
.footer-note{margin-top:18px;font-size:var(--fs-xs);color:var(--wn-meta);max-width:70ch}
.footer-contact{margin-top:8px;font-size:var(--fs-xs)}
.footer-contact a{color:var(--wn-soft)}
.footer-brand{margin-top:12px;font-size:var(--fs-xs);color:var(--wn-meta)}

/* ---------------- home / tool ---------------- */
.wn-home{padding-top:8px}
.wn-intro{display:grid;grid-template-columns:minmax(0,1fr);gap:6px;margin-bottom:20px}
.wn-intro h1{font-family:var(--wn-display);font-weight:400;font-size:var(--fs-display);line-height:1.02;letter-spacing:-.015em;max-width:20ch}
.wn-lede{color:var(--wn-soft);max-width:86ch;font-size:15px;columns:2;column-gap:34px;margin-top:4px}
.wn-bench{
  display:grid;grid-template-columns:minmax(230px,290px) minmax(0,1fr) minmax(230px,300px);
  grid-template-areas:"editor stage slip" "editor action slip" "editor options slip";
  gap:10px 16px;align-items:start;
  background:var(--wn-panel);border-radius:18px;padding:14px;
}
.wn-editor-col{grid-area:editor;display:flex;flex-direction:column;min-width:0}
.wn-wheel-col{grid-area:stage;min-width:0}
.wn-slip-col{grid-area:slip}
.wn-action{grid-area:action;display:flex;flex-direction:column;gap:8px;min-width:0;margin-top:10px}
.wn-bench .wn-panel{background:none;padding:0}
.wn-tool{min-width:0}
.wn-list-title{font-size:15px;font-weight:600;color:var(--wn-ink);margin:0}
.wn-options{grid-area:options;margin:0;background:var(--wn-panel-2);border-radius:12px;padding:0 12px}
.wn-options>summary{list-style:none;cursor:pointer;min-height:44px;display:flex;align-items:center;justify-content:space-between;font-size:14px;color:var(--wn-soft)}
.wn-options>summary::-webkit-details-marker{display:none}
.wn-options>summary::after{content:"+";color:var(--wn-meta)}
.wn-options[open]>summary::after{content:"–"}
.wn-more{margin-top:12px;background:var(--wn-panel-2);border-radius:12px;padding:0 12px}
.wn-more>summary{list-style:none;cursor:pointer;min-height:44px;display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:14px;color:var(--wn-soft)}
.wn-more>summary::-webkit-details-marker{display:none}
.wn-draws{padding:2px 0 12px}
.footer-groups{margin-left:0}
.wn-panel{background:var(--wn-panel);border-radius:var(--wn-radius);padding:16px}
.wn-panel-head{display:flex;align-items:baseline;justify-content:space-between;gap:10px;margin-bottom:10px}
.wn-label{font-size:var(--fs-xs);color:var(--wn-meta);font-weight:600}
.wn-count{font-size:var(--fs-xs);color:var(--wn-soft);font-variant-numeric:tabular-nums}
.wn-input{
  width:100%;background:#1b2340;color:var(--wn-ink);border:1px solid var(--wn-line);
  border-radius:var(--wn-radius-sm);padding:12px 13px;font:inherit;font-size:15px;line-height:1.6;
  resize:vertical;min-height:150px;display:block;
}
.wn-input::placeholder{color:#7d8ab0}
.wn-input:hover{border-color:rgba(238,241,248,.28)}
.wn-input:focus{outline:none;border-color:var(--wn-pink);box-shadow:0 0 0 3px rgba(249,163,192,.2)}
.wn-editor-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
.wn-dup{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}
.wn-dup-chip{font-size:var(--fs-xs);background:rgba(249,163,192,.14);color:#ffd0e0;border-radius:999px;padding:3px 9px;white-space:nowrap}
.wn-hint{font-size:var(--fs-xs);color:var(--wn-meta);margin-top:8px}

.wn-btn{
  appearance:none;border:1px solid transparent;border-radius:999px;min-height:44px;padding:0 18px;
  font-size:15px;font-weight:500;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:8px;
  background:var(--wn-panel-2);color:var(--wn-ink);transition:background .16s ease,color .16s ease,border-color .16s ease,transform .1s ease;
  text-decoration:none;
}
.wn-btn:hover{background:#36426c}
.wn-btn:active{background:#1f2845;transform:translateY(1px)}
.wn-btn-ghost{background:transparent;border-color:var(--wn-line);color:var(--wn-soft)}
.wn-btn-ghost:hover{background:rgba(238,241,248,.06);color:var(--wn-ink);border-color:rgba(238,241,248,.3)}
.wn-btn-ghost:active{background:rgba(238,241,248,.11)}
.wn-btn-primary{background:var(--wn-pink);color:var(--wn-pink-ink);font-weight:600}
.wn-btn-primary:hover{background:#ffb9d1}
.wn-btn-primary:active{background:#e98cae}
.wn-chances{list-style:none;margin:10px 0 0;padding:0;display:grid;gap:2px;max-height:132px;overflow:auto}
.wn-chances li{display:flex;justify-content:space-between;gap:10px;font-size:13.5px;line-height:1.5;padding:2px 0;color:#dfe5f3}
.wn-chance-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}
.wn-chance-pct{font-variant-numeric:tabular-nums;color:#f9a3c0;font-weight:600;flex:none}
.wn-btn-primary:disabled,.wn-btn-primary[aria-disabled="true"],.wn-btn-primary[data-ready="false"]{
  background:rgba(249,163,192,.30);color:#ffffff;border:2px solid var(--wn-pink);font-weight:600;
  cursor:not-allowed;
}
.wn-btn-primary[data-ready="false"]:hover,.wn-btn-primary[aria-disabled="true"]:hover{
  background:rgba(249,163,192,.44);color:#fff;border-color:var(--wn-pink);
}
.wn-btn-primary[data-ready="false"]:active,.wn-btn-primary[aria-disabled="true"]:active{
  background:rgba(249,163,192,.5);
}
.wn-editor-col.is-nudged .wn-input{outline:2px solid var(--wn-pink);outline-offset:2px}
.wn-btn[disabled]{cursor:not-allowed}
.wn-btn-sm{min-height:36px;padding:0 13px;font-size:var(--fs-xs)}
@media (pointer:coarse){.wn-btn-sm{min-height:44px}}
.wn-spin-btn{width:100%;font-size:17px;min-height:50px}
.wn-progress{display:flex;flex-direction:column;gap:5px}

.wn-wheel-col{display:flex;flex-direction:column;min-width:0}
.wn-stage{position:relative;background:var(--wn-panel-2);border-radius:var(--wn-radius);padding:12px;display:flex;flex-direction:column;align-items:center}
.wn-wheel-wrap{position:relative;width:100%;max-width:420px;aspect-ratio:1;margin:0 auto}
.wn-stage.is-answered .wn-wheel-wrap{opacity:.5;transition:opacity .25s ease}
.wn-wheel-canvas{width:100%;height:100%;display:block;border-radius:50%;will-change:transform;transform:rotate(0deg)}
.wn-pointer{
  position:absolute;left:50%;top:-2px;transform:translateX(-50%);width:0;height:0;z-index:3;
  border-left:10px solid transparent;border-right:10px solid transparent;border-top:16px solid var(--wn-pink);
  filter:drop-shadow(0 2px 2px rgba(0,0,0,.35));
}
.wn-hub{
  position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);
  width:27%;aspect-ratio:1;border-radius:50%;border:3px solid var(--wn-panel);
  background:var(--wn-bg);color:var(--wn-ink);
  display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:4;
}
.wn-hub span{font-family:var(--wn-display);font-size:clamp(20px,2.6vw,32px);line-height:1;font-variant-numeric:tabular-nums}
.wn-hub em{font-style:normal;font-size:11px;color:var(--wn-meta);margin-top:3px}
.wn-empty-wheel{font-size:13px;text-align:center;color:#c6cfe6;margin-top:10px}
.wn-progress{margin-top:10px;width:100%;display:flex;flex-direction:column;gap:5px}
.wn-progress-track{height:4px;border-radius:2px;background:rgba(238,241,248,.14);overflow:hidden}
.wn-progress-bar{height:100%;width:0%;background:var(--wn-pink);transition:width .12s linear}
.wn-progress-line{display:flex;justify-content:space-between;font-size:var(--fs-xs);color:var(--wn-meta);font-variant-numeric:tabular-nums;min-height:18px}
.wn-progress-line strong{color:var(--wn-ink);font-weight:600}
.wn-meta{display:flex;justify-content:space-between;gap:10px;font-size:var(--fs-xs);color:var(--wn-meta);margin-top:8px;font-variant-numeric:tabular-nums;min-height:18px}
.wn-meta .live{color:var(--wn-pink);font-weight:500}

.wn-slip-col{display:flex;flex-direction:column;gap:10px;min-width:0}
.wn-slip{
  width:100%;display:flex;flex-direction:column;justify-content:space-between;gap:10px;
  background:var(--wn-pink);color:var(--wn-pink-ink);border-radius:var(--wn-radius);
  padding:14px 16px;position:relative;overflow:hidden;
}
.wn-slip::before{
  content:"";position:absolute;left:0;right:0;bottom:-6px;height:12px;
  background:radial-gradient(circle at 6px 0,var(--wn-bg) 5px,transparent 5.5px) 0 0/12px 12px repeat-x;
}
.wn-slip-top{display:flex;justify-content:space-between;align-items:baseline;gap:8px;font-size:var(--fs-xs);font-weight:600;color:#3a2431}
.wn-slip-name{
  font-family:var(--wn-display);font-size:clamp(30px,3.2vw,42px);line-height:1.02;letter-spacing:-.01em;
  color:#141a2e;overflow-wrap:anywhere;margin:2px 0;
}
.wn-slip-name.is-empty{color:#4b2c3b;font-size:clamp(24px,2.6vw,30px);font-family:var(--wn-font);font-weight:500;line-height:1.25}
.wn-slip-facts{display:flex;flex-direction:column;gap:2px;font-size:var(--fs-xs);color:#3a2431;font-variant-numeric:tabular-nums}
.wn-slip-facts strong{font-size:17px;color:#141a2e}
.wn-slip-actions{display:flex;flex-direction:column;gap:6px;margin-top:6px}
.wn-slip-row{display:flex;gap:6px}
.wn-slip-row .wn-btn{flex:1 1 0;min-width:0}
.wn-slip-actions .wn-btn{min-height:38px;font-size:var(--fs-xs);border-radius:8px;background:#141a2e;color:#ffe6ef}
.wn-slip-actions .wn-btn:hover{background:#243057}
.wn-slip-actions .wn-btn:active{background:#0e1324}
.wn-slip-actions .wn-btn-ghost{background:transparent;border-color:rgba(20,26,46,.45);color:#141a2e}
.wn-slip-actions .wn-btn-ghost:hover{background:rgba(20,26,46,.1)}
.wn-slip-note{font-size:12.5px;color:#4b2c3b;line-height:1.35}
.wn-slip-slot{display:flex;flex-direction:column;gap:8px;margin-top:10px}
.wn-slot-line{height:10px;border-radius:3px;background:rgba(20,26,46,.16)}
.wn-slot-line.short{width:60%}

.wn-toolbar{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-top:14px}
.wn-toolbar .spacer{flex:1}
.wn-options{background:var(--wn-panel);border-radius:var(--wn-radius);margin-top:12px;overflow:hidden}
.wn-options > summary{
  list-style:none;cursor:pointer;min-height:48px;display:flex;align-items:center;gap:10px;
  padding:10px 16px;font-size:15px;font-weight:500;color:var(--wn-ink);
}
.wn-options > summary::-webkit-details-marker{display:none}
.wn-options > summary::after{content:"";margin-left:auto;width:8px;height:8px;border-right:1.7px solid var(--wn-soft);border-bottom:1.7px solid var(--wn-soft);transform:rotate(45deg) translateY(-2px)}
.wn-options[open] > summary::after{transform:rotate(225deg) translateY(-1px)}
.wn-options > summary:hover{background:var(--wn-panel-2)}
.wn-options-body{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:18px;padding:4px 16px 18px;border-top:1px solid var(--wn-line-soft);margin-top:0;padding-top:16px}
.wn-fieldset{border:0;padding:0;margin:0;min-width:0}
.wn-fieldset-wide{grid-column:1/-1}
.wn-more-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.wn-fieldset legend{font-size:var(--fs-xs);color:var(--wn-meta);font-weight:600;margin-bottom:8px;padding:0}
.wn-seg{display:flex;gap:6px}
.wn-seg label{position:relative;flex:1}
.wn-seg input{position:absolute;opacity:0;width:100%;height:100%;inset:0;margin:0;cursor:pointer}
.wn-seg span{
  display:flex;align-items:center;justify-content:center;min-height:40px;border-radius:8px;
  background:#1b2340;border:1px solid var(--wn-line);font-size:var(--fs-xs);color:var(--wn-soft);
}
.wn-seg input:hover + span{border-color:rgba(238,241,248,.32);color:var(--wn-ink)}
.wn-seg input:checked + span{background:var(--wn-pink);border-color:var(--wn-pink);color:var(--wn-pink-ink);font-weight:600}
.wn-seg input:focus-visible + span{outline:2px solid var(--wn-pink);outline-offset:2px}
.wn-switch{display:flex;align-items:center;gap:10px;min-height:40px;cursor:pointer;font-size:var(--fs-xs);color:var(--wn-soft)}
.wn-switch input{position:absolute;opacity:0;width:1px;height:1px}
.wn-switch .track{width:40px;height:24px;border-radius:999px;background:#1b2340;border:1px solid var(--wn-line);position:relative;flex:none;transition:background .15s ease}
.wn-switch .track::after{content:"";position:absolute;left:2px;top:2px;width:18px;height:18px;border-radius:50%;background:var(--wn-soft);transition:transform .15s ease,background .15s ease}
.wn-switch input:checked + .track{background:rgba(249,163,192,.32);border-color:var(--wn-pink)}
.wn-switch input:checked + .track::after{transform:translateX(16px);background:var(--wn-pink)}
.wn-switch input:focus-visible + .track{outline:2px solid var(--wn-pink);outline-offset:2px}
.wn-range{display:flex;align-items:center;gap:10px}
.wn-range input[type="range"]{
  appearance:none;flex:1;height:24px;background:transparent;margin:0;
}
.wn-range input[type="range"]::-webkit-slider-runnable-track{height:4px;border-radius:2px;background:rgba(238,241,248,.2)}
.wn-range input[type="range"]::-moz-range-track{height:4px;border-radius:2px;background:rgba(238,241,248,.2)}
.wn-range input[type="range"]::-webkit-slider-thumb{appearance:none;width:16px;height:16px;border-radius:50%;background:var(--wn-pink);margin-top:-6px;border:2px solid var(--wn-bg)}
.wn-range input[type="range"]::-moz-range-thumb{width:16px;height:16px;border:2px solid var(--wn-bg);border-radius:50%;background:var(--wn-pink)}
.wn-range input[type="range"]:focus-visible{outline:2px solid var(--wn-pink);outline-offset:4px;border-radius:4px}
.wn-range output{font-size:var(--fs-xs);color:var(--wn-soft);font-variant-numeric:tabular-nums;min-width:3ch;text-align:right}
.wn-swatches{display:flex;flex-wrap:wrap;gap:8px}
.wn-swatch{position:relative}
.wn-swatch input{position:absolute;inset:0;opacity:0;margin:0;cursor:pointer}
.wn-swatch span{
  display:block;width:30px;height:30px;border-radius:8px;border:2px solid transparent;
  box-shadow:inset 0 0 0 1px rgba(238,241,248,.18);
}
.wn-swatch input:checked + span{border-color:var(--wn-ink)}
.wn-swatch input:focus-visible + span{outline:2px solid var(--wn-pink);outline-offset:2px}

/* results panel */
.wn-draws{background:var(--wn-panel);border-radius:var(--wn-radius);padding:12px 14px;margin-top:0}
.wn-draws-head h2{font-family:var(--wn-font);font-size:15px;font-weight:600;letter-spacing:0;display:flex;align-items:center;gap:8px}
.wn-draws-head .wn-btn{min-height:32px;font-size:13px;padding:0 10px}
.wn-draws-head{display:flex;flex-wrap:wrap;align-items:center;gap:10px;justify-content:space-between}
.wn-draws-head h2{font-size:var(--fs-h3);font-family:var(--wn-font);font-weight:600;display:flex;align-items:center;gap:8px}
.wn-badge{background:rgba(249,163,192,.16);color:#ffd0e0;border-radius:999px;padding:1px 9px;font-size:var(--fs-xs);font-weight:600;font-variant-numeric:tabular-nums}
.wn-draws-actions{display:flex;flex-wrap:wrap;gap:8px}
.wn-draw-list{list-style:none;margin:8px 0 0;padding:0;display:flex;flex-direction:column;gap:1px;max-height:150px;overflow:auto}
.wn-draw-list li{display:grid;grid-template-columns:18px minmax(0,1fr) 46px 52px;gap:6px;align-items:center;padding:5px 2px;border-radius:6px;font-size:14px}
.wn-draw-list li:nth-child(odd){background:rgba(238,241,248,.04)}
.wn-draw-list .n{color:var(--wn-meta);font-variant-numeric:tabular-nums;font-size:var(--fs-xs)}
.wn-draw-list .who{font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.wn-draw-list .odds,.wn-draw-list .when{color:var(--wn-meta);font-size:var(--fs-xs);font-variant-numeric:tabular-nums;text-align:right}
.wn-draws-empty{color:var(--wn-meta);font-size:13.5px;line-height:1.4;margin-top:6px}
.wn-plus{display:inline-flex;align-items:center;gap:6px;font-size:var(--fs-xs);color:#ffd0e0;background:rgba(249,163,192,.14);border:1px solid rgba(249,163,192,.4);border-radius:999px;padding:0 12px;min-height:36px;text-decoration:none}
.wn-plus:hover{background:rgba(249,163,192,.24)}

/* share + embed */
.wn-share{display:flex;flex-wrap:wrap;gap:10px;margin-top:12px;align-items:center}
.wn-embed{border:0;background:#1b2340;color:var(--wn-soft);width:100%;border-radius:8px;padding:10px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12.5px;resize:vertical;min-height:64px;margin-top:8px}
.wn-toast{
  position:fixed;left:50%;bottom:24px;transform:translateX(-50%) translateY(12px);
  background:var(--wn-ink);color:#11162a;padding:10px 18px;border-radius:999px;font-size:15px;font-weight:500;
  opacity:0;pointer-events:none;transition:opacity .18s ease,transform .18s ease;z-index:50;
}
.wn-toast.is-on{opacity:1;transform:translateX(-50%) translateY(0)}

/* phone sticky spin */
.wn-sticky{
  display:none;position:fixed;left:12px;right:12px;bottom:12px;z-index:30;
  padding:8px;background:rgba(26,32,57,.94);border:1px solid var(--wn-line);border-radius:16px;
  box-shadow:0 12px 30px rgba(5,8,18,.55);
}
.wn-sticky .wn-btn{width:100%}

/* ---------------- page furniture ---------------- */
.wn-page{padding-top:34px}
.wn-page-head{max-width:none;margin-bottom:18px}
.wn-page-head h1{font-family:var(--wn-display);font-weight:400;font-size:var(--fs-display);line-height:1.04;letter-spacing:-.015em;max-width:920px}
.wn-page-head .wn-lede{columns:1;max-width:72ch;margin-top:12px;font-size:16px}
.wn-page-head .wn-crumbs{font-size:var(--fs-xs);color:var(--wn-meta);margin-bottom:10px}
.wn-page-head .wn-crumbs a{color:var(--wn-meta)}
.wn-page-body{max-width:1240px}
.wn-section{margin-top:52px}
.wn-section:first-child{margin-top:0}
.wn-section > h2{font-family:var(--wn-display);font-weight:400;font-size:var(--fs-h2);line-height:1.12;margin-bottom:12px;letter-spacing:-.01em}
.wn-section > p{max-width:74ch;color:var(--wn-soft);font-size:16px;margin-bottom:12px}
.wn-section p + p{margin-top:12px}
.wn-two-col{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(0,1fr);gap:36px;align-items:start}
.wn-card{background:var(--wn-panel);border-radius:var(--wn-radius);padding:20px 22px}
.wn-card h3{font-size:var(--fs-h3);font-weight:600;margin-bottom:8px;font-family:var(--wn-font)}
.wn-card p{color:var(--wn-soft);font-size:15px}
.wn-steps{list-style:none;margin:0;padding:0;counter-reset:step;display:grid;gap:14px}
.wn-steps li{display:grid;grid-template-columns:30px minmax(0,1fr);gap:12px;align-items:start}
.wn-steps .num{
  width:26px;height:26px;border-radius:50%;background:rgba(249,163,192,.18);color:#ffd0e0;
  display:grid;place-items:center;font-size:var(--fs-xs);font-weight:600;font-variant-numeric:tabular-nums;
}
.wn-steps h3{font-family:var(--wn-font);font-size:16px;font-weight:600;line-height:1.35;letter-spacing:0;margin-bottom:2px}
.wn-steps p{color:var(--wn-soft);font-size:15px;max-width:60ch}
.wn-item-list{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));column-gap:34px;row-gap:22px}
.wn-item{background:none;border-radius:0;padding:0}
.wn-item h3{font-family:var(--wn-font);font-size:16px;font-weight:600;line-height:1.35;letter-spacing:0;margin-bottom:4px}
.wn-item p{color:var(--wn-soft);font-size:15px}
.wn-prose{max-width:74ch;color:var(--wn-soft);font-size:16px}
.wn-prose p{margin:0 0 12px}
.wn-prose h2{font-family:var(--wn-display);font-weight:400;font-size:var(--fs-h2);color:var(--wn-ink);margin:34px 0 10px;line-height:1.15}
.wn-prose h3{font-family:var(--wn-font);font-size:19px;color:var(--wn-ink);font-weight:600;line-height:1.35;letter-spacing:0;margin:22px 0 8px}
.wn-prose ul{margin:0 0 14px;padding-left:20px}
.wn-prose li{margin-bottom:6px}
.wn-prose a{color:#ffd0e0}
.wn-prose table{margin:16px 0}
.wn-table-wrap{overflow-x:auto;border-radius:12px}
.wn-table{width:100%;border-collapse:collapse;font-size:15px;min-width:520px}
.wn-table caption{display:block;width:100%;text-align:left;font-size:var(--fs-xs);color:var(--wn-meta);padding-bottom:8px;white-space:normal}
.wn-table th,.wn-table td{padding:10px 12px;text-align:left;border-bottom:1px solid var(--wn-line-soft);vertical-align:top}
.wn-table thead th{background:#1c2440;font-size:var(--fs-xs);color:var(--wn-meta);font-weight:600}
.wn-table tbody tr:nth-child(even){background:rgba(238,241,248,.03)}
.wn-table td:first-child{font-weight:500;color:var(--wn-ink)}
.wn-table td{color:var(--wn-soft);font-variant-numeric:tabular-nums}
.wn-table-time{font-size:var(--fs-xs);color:var(--wn-meta);margin-top:8px}
.wn-faq{display:grid;gap:0;margin-top:8px;max-width:80ch}
.wn-faq details{padding:14px 0}
.wn-faq details + details{margin-top:2px}
.wn-faq summary{
  list-style:none;cursor:pointer;min-height:52px;display:flex;align-items:center;gap:12px;
  font-family:var(--wn-font);font-size:16px;font-weight:500;letter-spacing:0;padding:12px 0;
}
.wn-faq summary::-webkit-details-marker{display:none}
.wn-faq summary::after{content:"";margin-left:auto;width:8px;height:8px;border-right:1.7px solid var(--wn-soft);border-bottom:1.7px solid var(--wn-soft);transform:rotate(45deg);transition:transform .18s ease}
.wn-faq details[open] summary::after{transform:rotate(225deg)}
.wn-faq summary:hover{color:var(--wn-pink)}
.wn-faq .answer{color:var(--wn-soft);padding:0 0 16px;max-width:70ch;font-size:15px}
.wn-faq .answer a{color:#ffd0e0}
.wn-cta-row{display:flex;flex-wrap:wrap;gap:12px;margin-top:22px;align-items:center}
.wn-note{color:var(--wn-meta);font-size:var(--fs-xs)}

/* ---------------- pricing ---------------- */
.wn-billing-toggle{
  display:inline-flex;background:var(--wn-panel);border-radius:999px;padding:4px;gap:4px;margin:6px 0 24px;
}
.wn-billing-toggle button{
  appearance:none;border:0;background:transparent;color:var(--wn-soft);border-radius:999px;
  min-height:40px;padding:0 18px;font-size:15px;cursor:pointer;
}
.wn-billing-toggle button[aria-pressed="true"]{background:var(--wn-pink);color:var(--wn-pink-ink);font-weight:600}
.wn-billing-toggle button:hover{color:var(--wn-ink)}
.wn-billing-toggle button[aria-pressed="true"]:hover{color:var(--wn-pink-ink)}
.wn-save{margin-left:8px;font-size:var(--fs-xs);color:#ffd0e0;background:rgba(249,163,192,.16);border-radius:999px;padding:2px 8px}
.wn-plans{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px;align-items:stretch}
.wn-plan{
  background:var(--wn-panel);border-radius:var(--wn-radius);padding:20px;display:flex;flex-direction:column;gap:12px;
  position:relative;
}
.wn-plan.is-featured{background:#2a3457;box-shadow:inset 0 0 0 2px var(--wn-pink)}
.wn-plan .flag{
  position:absolute;top:-11px;left:18px;background:var(--wn-pink);color:var(--wn-pink-ink);
  font-size:12.5px;font-weight:600;border-radius:999px;padding:2px 10px;
}
.wn-plan h3{font-family:var(--wn-font);font-size:20px;font-weight:600;line-height:1.3;letter-spacing:0}
.wn-price{display:flex;align-items:baseline;gap:6px;font-variant-numeric:tabular-nums}
.wn-price .amount{font-family:var(--wn-display);font-size:40px;line-height:1;font-weight:400}
.wn-price .per{font-size:var(--fs-xs);color:var(--wn-meta)}
.wn-plan ul{list-style:none;margin:0;padding:0;display:grid;gap:7px;font-size:15px;color:var(--wn-soft)}
.wn-plan li{display:grid;grid-template-columns:16px 1fr;gap:8px}
.wn-plan li::before{content:"";width:8px;height:8px;margin-top:7px;border-radius:50%;background:var(--wn-pink)}
.wn-plan .wn-btn{margin-top:auto;width:100%}
.wn-plan .wn-plan-note{font-size:var(--fs-xs);color:var(--wn-meta)}
.wn-trust{margin-top:20px;color:var(--wn-meta);font-size:var(--fs-xs)}
.wn-compare{display:grid;gap:0}

/* ---------------- comparison page ---------------- */
.wn-vs-table td, .wn-vs-table th{font-size:15px}
.wn-vs-head{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:10px}
.wn-vs-card{background:var(--wn-panel);border-radius:12px;padding:16px}
.wn-vs-card h3{font-size:var(--fs-h3);margin-bottom:4px}

/* ---------------- contact ---------------- */
.wn-contact{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,420px);gap:32px;align-items:start}
.wn-contact h2{font-family:var(--wn-display);font-weight:400;font-size:var(--fs-h2);margin-bottom:10px}
.wn-contact .wn-card p{margin-bottom:10px}
.wn-contact-mail{font-size:var(--fs-h3);color:#ffd0e0;font-weight:500}
.wn-form{display:flex;flex-direction:column;gap:12px}
.wn-form label{font-size:var(--fs-xs);color:var(--wn-meta);font-weight:600}
.wn-form input,.wn-form textarea,.wn-form select{
  width:100%;margin-top:5px;background:#1b2340;border:1px solid var(--wn-line);border-radius:10px;
  color:var(--wn-ink);padding:11px 12px;font:inherit;font-size:15px;
}
.wn-form textarea{min-height:140px;resize:vertical}
.wn-form input:hover,.wn-form textarea:hover,.wn-form select:hover{border-color:rgba(238,241,248,.3)}
.wn-form input:focus,.wn-form textarea:focus,.wn-form select:focus{outline:none;border-color:var(--wn-pink);box-shadow:0 0 0 3px rgba(249,163,192,.2)}
.wn-form .wn-btn{align-self:flex-start;margin-top:4px}
.wn-form-status{font-size:15px;color:var(--wn-soft);min-height:22px}

/* ---------------- legal ---------------- */
.wn-legal{display:grid;grid-template-columns:minmax(0,240px) minmax(0,1fr);gap:44px;align-items:start}
.wn-toc{position:sticky;top:20px;font-size:15px}
.wn-toc .wn-label{margin-bottom:8px}
.wn-toc ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px}
.wn-toc a{color:var(--wn-soft);text-decoration:none;display:block;padding:2px 0}
.wn-toc a:hover{color:var(--wn-pink)}
.wn-legal .wn-section{margin-top:34px}
.wn-legal .wn-section:first-child{margin-top:0}
.wn-legal .wn-section > h2{font-size:24px}
.wn-legal .wn-section p{font-size:15.5px}

/* ---------------- embed ---------------- */
.wn-embed-mode{padding:14px}
.wn-embed-mode .wn-intro{display:none}

/* ---------------- responsive ---------------- */
@media (max-width:1080px){
  .wn-bench{grid-template-columns:minmax(200px,1fr) minmax(0,1fr) minmax(200px,260px);gap:12px}
  .wn-options-body{grid-template-columns:repeat(2,minmax(0,1fr))}
  .wn-plans{grid-template-columns:repeat(2,minmax(0,1fr))}
  .footer-groups{grid-template-columns:1fr 1fr}
}
@media (max-width:900px){
  .nav-links{display:none}
  .nav-actions .nav-signin{display:none}
  .mobile-nav{display:block}
  .wn-lede{columns:1}
  .wn-bench{grid-template-columns:1fr;grid-template-areas:"editor" "action" "slip" "stage";gap:12px}
  .wn-input{min-height:132px}
  .wn-action{margin-top:0}
  .wn-wheel-wrap{max-width:320px}
  .wn-slip-row .wn-btn{min-height:44px}
  .wn-two-col{grid-template-columns:1fr;gap:22px}
  .wn-contact{grid-template-columns:1fr}
  .wn-legal{grid-template-columns:1fr;gap:20px}
  .wn-toc{position:static}
  .wn-section{margin-top:38px}
  .wn-draw-list li{grid-template-columns:28px minmax(0,1fr) 60px;font-size:14px}
  .wn-draw-list .when{display:none}
  .wn-stage{padding:10px}
  .wn-slip-name{font-size:clamp(30px,8vw,40px)}
}
@media (max-width:760px){
  header[data-chrome="site"] > nav{padding:8px 16px;gap:12px}
  .wn-main{padding:0 16px}
  .footer-shell{padding:0 16px}
  .footer-groups{grid-template-columns:1fr 1fr;gap:24px}
  .wn-home{padding-top:16px}
  .wn-intro h1{font-size:clamp(30px,8.4vw,40px);max-width:none}
  .wn-lede{font-size:14.5px;margin-top:8px}
  .wn-plans{grid-template-columns:1fr}
  .wn-section > h2{font-size:24px}
  .wn-draws{padding:14px}
}
@media (max-width:420px){
  .wn-slip-actions .wn-btn{min-height:42px}
  .wn-options-body{grid-template-columns:1fr}
}
@media (prefers-reduced-motion:reduce){
  *,*::before,*::after{animation-duration:.01ms !important;animation-iteration-count:1 !important;transition-duration:.01ms !important;scroll-behavior:auto !important}
}

/* ---- rev2: compact ticket, single surface, phone tables ---- */
.wn-slip{border-radius:0;min-height:0;justify-content:flex-start;
  clip-path:polygon(0 0,100% 0,100% calc(100% - 20px),calc(100% - 20px) 100%,0 100%);
  padding:16px 18px 20px;}
.wn-slip-slot{display:none}
.wn-stage{padding:6px 6px 0;background:none}
.wn-options-body{border-top:0}
.wn-options-body{border-top:0;margin-top:0;padding-top:14px}
.wn-home{padding-top:2px}
.wn-home .wn-page-head{margin-bottom:10px}
.wn-home .wn-page-head h1{max-width:600px;font-size:clamp(32px,3.9vw,50px)}
.wn-home-lede{columns:1;color:var(--wn-soft);font-size:16px;line-height:1.6;max-width:68ch;margin-top:26px}
@media (max-width:760px){
  .wn-home-lede{columns:1}
  .wn-page-head h1{font-size:clamp(29px,8vw,40px)}
  .wn-home{padding-top:8px}
  .wn-table{min-width:0}
  .wn-table thead{display:none}
  .wn-table,.wn-table tbody,.wn-table tr,.wn-table th,.wn-table td{display:block;width:100%}
  .wn-table tr{padding:12px 0}
  .wn-table tr + tr{padding-top:16px}
  .wn-table th[scope="row"]{font-size:16px;color:var(--wn-ink);padding:0 0 6px}
  .wn-table td{display:grid;grid-template-columns:minmax(84px,36%) minmax(0,1fr);gap:10px;padding:3px 0;color:var(--wn-soft)}
  .wn-table td::before{content:attr(data-label);color:var(--wn-meta);font-size:var(--fs-xs);font-weight:600}
}
@media (max-width:520px){
  .footer-groups{grid-template-columns:1fr}
  .wn-item-list{grid-template-columns:1fr}
}

/* rev7: the drawing's three parts — names | wheel with Spin under it | draw slip */
.wn-page-head{background:none;padding:0}
.wn-bench{
  grid-template-columns:minmax(0,290px) minmax(0,1fr) minmax(0,300px);
  grid-template-areas:"editor stage slip" "editor action slip" "editor options slip";
  gap:6px 22px;padding:16px;align-items:start;
}
.wn-stage{height:auto;justify-content:flex-start;padding:0;background:none}
.wn-wheel-wrap{max-width:380px;margin:0 auto}
.wn-action{grid-area:action;width:100%;max-width:440px;margin:8px auto 0}
.wn-label{font-family:var(--wn-font);font-size:14px;font-weight:600;letter-spacing:0;line-height:1.4;color:var(--wn-ink);text-decoration:none}
.wn-count{font-size:14px}
.wn-options{grid-area:options;width:100%;max-width:440px;margin:6px auto 0;background:var(--wn-panel-2);border-radius:12px;overflow:hidden}
.wn-options > summary{display:flex;align-items:center;min-height:40px;padding:0 12px;cursor:pointer;font-family:var(--wn-font);font-size:14px;font-weight:600;color:var(--wn-ink);list-style:none}
.wn-options > summary::-webkit-details-marker{display:none}
.wn-options > summary::after{content:"+";margin-left:auto;font-size:16px;color:var(--wn-soft)}
.wn-options[open] > summary::after{content:"\u2013"}
.wn-options-body{display:grid;grid-template-columns:1fr;gap:6px;padding:2px 12px 12px}
.wn-opt{display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:32px}
.wn-opt-block{flex-direction:column;align-items:flex-start;gap:6px}
.wn-opt-label{font-size:13.5px;color:var(--wn-soft);font-weight:500}
.wn-opt .wn-seg{flex:0 0 auto;width:148px}
.wn-opt .wn-range{flex:0 0 150px;display:flex;align-items:center;gap:8px}
.wn-opt .wn-range input{flex:1 1 auto;min-width:0}
.wn-opt .wn-range output{min-width:26px;text-align:right;font-size:13px;color:var(--wn-soft);font-variant-numeric:tabular-nums}
.wn-opt .wn-switch{min-height:32px;gap:6px}
.wn-opt .wn-swatches{gap:6px}
.wn-opt .wn-swatch span{width:22px;height:22px}
.wn-draws-foot{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px;padding-top:10px;border-top:1px solid var(--wn-line-soft, #E3E7F2)}
.wn-draws-foot .wn-btn{min-height:32px;font-size:13px;padding:0 10px}
a.wn-btn{justify-content:center;text-decoration:none;display:inline-flex;align-items:center}
.wn-embed-box{margin-top:8px;font-size:13.5px;color:var(--wn-soft)}
.wn-embed-box > summary{cursor:pointer;font-size:13.5px;font-weight:600;color:var(--wn-ink);min-height:32px;display:flex;align-items:center}
.wn-embed-box .wn-embed{margin-top:6px;width:100%;min-height:0;font-size:12.5px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;padding:6px 8px}
.wn-file-hidden{position:absolute;width:1px;height:1px;opacity:0;pointer-events:none}
@media (max-width:1200px){
  .wn-bench{grid-template-columns:minmax(0,270px) minmax(0,1fr) minmax(0,270px);gap:12px}
}
@media (max-width:1080px){
  .wn-bench{grid-template-columns:minmax(0,1fr);grid-template-areas:"editor" "stage" "action" "slip" "options";gap:10px}
  .wn-wheel-wrap{max-width:320px}
  .wn-action,.wn-options{max-width:none}
}
@media (max-width:900px){
  .wn-bench{grid-template-columns:1fr;grid-template-areas:"editor" "stage" "action" "slip" "options";gap:10px}
  .wn-wheel-wrap{max-width:300px;margin:0 auto}
  .wn-stage{padding:10px}
  .wn-opt .wn-seg{width:auto}
  .wn-opt .wn-range{flex:1 1 auto;max-width:180px}
}

/* ---- rev5: compact the panel so input, spin, result and settings share one screen ---- */
.wn-editor-col{justify-content:flex-start;gap:8px;height:auto;padding-top:0}
.wn-editor-col .wn-panel-head{margin-bottom:0}
.wn-input{min-height:116px}
.wn-hint{margin:0;font-size:12.5px;line-height:1.45}
.wn-editor-actions{margin:0}
.wn-action{margin:8px auto 0;gap:6px}
.wn-spin-btn{min-height:48px}
.wn-progress-track{height:4px}
.wn-progress-line{min-height:20px;font-size:13px}
.wn-slip-col{display:flex;flex-direction:column;gap:10px}
.wn-options-body{gap:4px;padding:0 12px 10px}
.wn-opt{min-height:30px}
.wn-options > summary{min-height:36px}

/* ---- rev6: phone — keep input, spin and the slip in the first screen ---- */
@media (max-width:520px){
  .wn-bench{padding:10px;gap:10px}
  .wn-input{min-height:92px}
  .wn-hint{font-size:12px;line-height:1.4}
  .wn-editor-actions .wn-btn{min-height:38px}
  .wn-spin-btn{min-height:46px}
  .wn-slip{padding:12px}
  .wn-slip-name{font-size:clamp(26px,7.6vw,34px)}
  .wn-stage{padding:8px}
  .wn-wheel-wrap{max-width:200px}
  .wn-options-body{gap:2px}
}

/* A .wn-seg radio is the pill its label draws (.wn-seg span): its own input
   stays transparent and focusable, and :focus-visible outlines the pill. */
.wn-seg input[type="radio"]:focus-visible + span{outline:2px solid var(--wn-pink);outline-offset:2px}
.wn-swatch input[type="radio"]{
  position:absolute;inset:0;width:100%;height:100%;margin:0;opacity:1;appearance:none;
  border-radius:inherit;background:transparent;cursor:pointer;
}
.wn-swatch input[type="radio"]:checked{
  box-shadow:inset 0 0 0 3px var(--wn-bg),inset 0 0 0 5px #ffffff;
}


/* ---- rev7: the slip waits quiet and fills with the brand colour when a draw lands ---- */
.wn-slip.is-empty{
  background:var(--wn-pink);color:var(--pink-ink, #3a2431);
  min-height:150px;justify-content:flex-start;
}
.wn-slip.is-empty .wn-slip-top{color:#3a2431}
.wn-slip.is-empty .wn-slip-name.is-empty{color:#141a2e;font-size:clamp(22px,2.2vw,26px)}
.wn-slip.is-empty .wn-slip-note{color:#3a2431;margin-top:auto}
.wn-slip.is-empty .wn-slip-slot{opacity:.45}
/* the field is flat: a wash behind the text is a measured tell, so the atmosphere layer stays off */
body[data-atmosphere="true"] .atmosphere-layer,
body[data-atmosphere="true"]::before{display:none}

/* rev8: the primary is one flat pink action with the slip's clipped corner,
   at every width, so ready/not-ready differ by fill weight, not by shape */
.wn-btn-primary{border-radius:0;clip-path:polygon(0 0,100% 0,100% calc(100% - 10px),calc(100% - 10px) 100%,0 100%)}

/* rev8: on a desktop the names field is as tall as the wheel beside it, so the
   editor column fills its side of the bench instead of leaving a dead band */
@media (min-width:761px){
  .wn-input{min-height:228px}
  .wn-lede{max-width:92ch}
}
/* rev8: the phone keeps the whole loop — input, wheel, start, slip — in the first screen */
@media (max-width:760px){
  body[data-atmosphere="true"] main > *{padding-top:14px;padding-bottom:0}
  .wn-wheel-wrap{max-width:128px}
  .wn-input{min-height:64px}
  .wn-page-head{margin-bottom:10px}
  .wn-lede{margin-top:6px;font-size:14px;line-height:1.5}
  .wn-editor-actions{margin-top:4px;gap:4px}
  .wn-hint{margin-top:6px;font-size:12.5px;line-height:1.45}
  .wn-stage{padding:0}
  .wn-action{margin-top:4px;gap:6px}
}


/* ---- rev8: a refusal answers on the press, visibly, next to the action ---- */
.wn-error-line{color:#ffd0e0;font-size:14px;margin-top:10px}
.wn-refuse{color:var(--wn-pink);font-size:14px;margin-top:10px;max-width:52ch}

/* The platform's mobile scrim paints each direct child of <main> on the home
   page (body[data-atmosphere="true"], max-width:700px). A painted surface takes
   inner padding so its text never sits on the box's own edge. */
@media (max-width:700px){
  body[data-atmosphere="true"] main > *{padding-inline:16px}
}
/* /fairness/ — the DevTools recipe below the audit result */
.wn-options[data-devtools]{grid-column:1/-1;width:100%;max-width:none;margin:12px 0 0;align-self:stretch}
.wn-devtools-body{padding:14px 16px 18px;display:grid;gap:10px}
.wn-devtools-body ol{margin:0;padding-left:20px;display:grid;gap:6px;font-size:14.5px;color:var(--wn-soft)}
.wn-code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12.5px;line-height:1.55;background:var(--wn-panel-2);border-radius:8px;padding:12px 14px;overflow-x:auto;white-space:pre-wrap;word-break:break-word;color:var(--wn-soft);margin:0}
.wn-devtools-body ol li{font-size:14.5px;line-height:1.5}


/* ---------- rev10: the whole loop on one screen, one drawer, phone order ---------- */
.wn-stage{position:relative}
.wn-more{grid-area:options;margin:10px 0 0;background:var(--wn-panel-2);border:1px solid rgba(238,241,248,.10);border-radius:10px;padding:0 12px}
.wn-more>summary{padding:10px 2px;font-size:14px;font-weight:600;cursor:pointer;color:var(--wn-ink)}
.wn-more .wn-options-body{padding:2px 0 12px}
.wn-more .wn-draws{padding:0 0 12px;margin:0;background:none}
.wn-more .wn-embed-box{margin:0 0 12px}
.wn-stage-tool{position:absolute;top:6px;right:6px;z-index:3;appearance:none;background:rgba(26,32,57,.72);border:1px solid rgba(238,241,248,.20);color:var(--wn-soft);font:inherit;font-size:12px;letter-spacing:.02em;padding:5px 9px;border-radius:6px;cursor:pointer}
.wn-stage-tool:hover{color:var(--wn-ink);border-color:rgba(249,163,192,.6)}
.wn-stage-tool[aria-pressed="true"]{background:var(--wn-pink);color:#231a24;border-color:var(--wn-pink)}
@media (min-width:961px){
  .wn-bench{grid-template-columns:minmax(0,1.08fr) minmax(250px,320px) minmax(230px,300px);grid-template-areas:"editor stage slip" "editor action slip" "options options options";gap:12px 18px}
  .wn-wheel-wrap{max-width:300px}
  .wn-slip-name{font-size:clamp(40px,3.4vw,54px);line-height:1.02}
  .wn-intro h1,.wn-page-head h1{font-size:clamp(30px,3vw,42px);line-height:1.06;max-width:26ch}
  .wn-intro p,.wn-page-head .wn-lede{font-size:15px;line-height:1.45;margin-top:6px}
  .wn-page-head,.wn-intro{margin:0 0 10px;padding-bottom:0}
}
@media (max-width:960px){
  .wn-bench{grid-template-columns:minmax(0,1fr);grid-template-areas:"editor" "action" "slip" "stage" "options";gap:10px}
  .wn-wheel-wrap{max-width:250px}
  .wn-slip-name{font-size:clamp(34px,10vw,44px)}
  .wn-slip-actions{gap:6px}
}
.wn-tool.is-projector .wn-bench{grid-template-columns:minmax(0,1fr) minmax(300px,420px);grid-template-areas:"stage slip" "action slip" "editor editor" "options options";gap:14px 22px}
.wn-tool.is-projector .wn-wheel-wrap{max-width:min(56vh,470px)}
.wn-tool.is-projector .wn-slip{min-height:0}
.wn-tool.is-projector .wn-slip-name{font-size:clamp(44px,4.6vw,76px);line-height:1.02}
.wn-tool.is-projector .wn-slot-line{opacity:.5}

/* freshness + per-row source links */
.wn-updated-row{margin:26px 0 6px}
.wn-updated{font-size:var(--fs-xs);color:var(--wn-meta);margin:0}
.wn-row-source{display:inline-block;margin-left:8px;font-size:11px;font-weight:500;letter-spacing:.02em;color:var(--wn-meta);text-decoration:none;border-bottom:1px dotted currentColor;white-space:nowrap}
.wn-row-source:hover{color:var(--wn-accent)}

/* ---------- rev11: phone order on the weighted bench, one wheel-options drawer ---------- */
.wn-wheel-options{grid-area:options;margin:0}
.wn-wheel-options>summary{padding:10px 2px;font-size:14px;font-weight:600;cursor:pointer;color:var(--wn-ink)}
@media (max-width:960px){
  .wn-bench-weighted{display:flex;flex-direction:column;gap:10px}
  .wn-bench-weighted .wn-wheel-col,
  .wn-bench-weighted .wn-stage,
  .wn-bench-weighted .wn-slip-col{display:contents}
  .wn-bench-weighted .wn-editor-col{order:1}
  .wn-bench-weighted .wn-progress-line{order:2}
  .wn-bench-weighted .wn-spin-btn{order:3;width:100%}
  .wn-bench-weighted .wn-slip{order:4}
  .wn-bench-weighted .wn-wheel-wrap{order:5;margin:0 auto}
  .wn-bench-weighted .wn-empty-wheel{order:6}
}

/* ---------- rev12: comparison page, the deciding table on the first screen ---------- */
.wn-vs-top.has-table{display:grid;grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:30px;align-items:start}
.wn-vs-top .wn-section{margin:0}
.wn-vs-top .wn-section h2{font-size:20px;margin:0 0 8px}
.wn-vs-top .wn-section p{font-size:14.5px;line-height:1.45}
.wn-vs-top .wn-table th,.wn-vs-top .wn-table td{padding:4px 9px;font-size:13px;line-height:1.25}
.wn-vs-top .wn-section h2{font-size:18px;margin:0 0 6px}
.wn-vs-top .wn-section p{margin:0 0 6px}
.wn-vs-top .wn-section ul,.wn-vs-top .wn-section ol{margin:0}
.wn-vs-top .wn-table td{vertical-align:top}
@media (max-width:960px){
  .wn-vs-top.has-table{display:block}
  .wn-vs-top .wn-section{margin-top:18px}
}
`;
