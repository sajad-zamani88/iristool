
(function(){
  "use strict";
  var $  = function(s,c){ return (c||document).querySelector(s); };
  var $$ = function(s,c){ return Array.prototype.slice.call((c||document).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- header state ---- */
  var header = $("#site-header");
  window.addEventListener("scroll", function(){
    header.classList.toggle("scrolled", window.scrollY > 8);
  }, {passive:true});

  /* ---- mobile drawer ---- */
  var burger = $("#burger");
  var navClose = $("#nav-close");
  function closeNav(){
    document.body.classList.remove("nav-open");
    burger.setAttribute("aria-expanded","false");
    burger.setAttribute("aria-label","Open menu");
  }
  burger.addEventListener("click", function(){
    var open = document.body.classList.toggle("nav-open");
    burger.setAttribute("aria-expanded", open);
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  });
  navClose.addEventListener("click", function(){
    closeNav();
    burger.focus();
  });
  $("#primary-nav").addEventListener("click", function(e){
    if (e.target.closest("a")) closeNav();
  });

  /* ---- mega menu ---- */
  function closeAllMegas(except){
    $$(".m-item.open").forEach(function(item){
      if (item !== except){
        item.classList.remove("open");
        var t = $(".m-trigger", item);
        if (t) t.setAttribute("aria-expanded","false");
      }
    });
  }
  $$(".m-trigger").forEach(function(btn){
    btn.addEventListener("click", function(e){
      e.stopPropagation();
      var item = btn.closest(".m-item");
      var isOpen = item.classList.contains("open");
      closeAllMegas(item);
      item.classList.toggle("open", !isOpen);
      btn.setAttribute("aria-expanded", String(!isOpen));
    });
  });
  document.addEventListener("click", function(e){
    if (!e.target.closest(".m-item")) closeAllMegas(null);
  });
  document.addEventListener("keydown", function(e){
    if (e.key === "Escape"){ closeAllMegas(null); closeNav(); }
  });

  /* ---- scroll reveal ---- */
  var revealEls = $$(".rv");
  if (reduceMotion || !("IntersectionObserver" in window)){
    revealEls.forEach(function(el){ el.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if (en.isIntersecting){ en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, {threshold:0.1, rootMargin:"0px 0px -40px 0px"});
    revealEls.forEach(function(el){ io.observe(el); });
  }

  /* ---- ticker ---- */
  var track = $("#ticker-track");
  track.innerHTML += track.innerHTML;

  /* ---- footer year ---- */
  $("#yr").textContent = new Date().getFullYear();

  /* ================================================================
     LIVE IMAGE OPTIMIZATION (2 tools)
     ================================================================ */
  function clamp(v,a,b){ return Math.min(b,Math.max(a,v)); }
  function kb(n){ return n>=1048576 ? (n/1048576).toFixed(2)+" MB" : Math.max(1,Math.round(n/1024))+" KB"; }

  /* demo image (inline SVG — no network needed) */
  var DEMO_SVG =
    '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600" viewBox="0 0 900 600">'
    +'<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">'
    +'<stop offset="0" stop-color="#0033FF"/><stop offset=".55" stop-color="#6E86FF"/><stop offset="1" stop-color="#C40000"/>'
    +'</linearGradient></defs>'
    +'<rect width="900" height="600" fill="url(#g)"/>'
    +'<circle cx="220" cy="200" r="120" fill="#FFFFFF" opacity=".85"/>'
    +'<circle cx="270" cy="245" r="70" fill="#0033FF" opacity=".55"/>'
    +'<rect x="520" y="120" width="240" height="240" fill="#141414" opacity=".8" transform="rotate(12 640 240)"/>'
    +'<rect x="560" y="160" width="160" height="160" fill="#FFFFFF" opacity=".9" transform="rotate(12 640 240)"/>'
    +'<circle cx="700" cy="470" r="60" fill="#FFCC00"/>'
    +'<circle cx="150" cy="470" r="40" fill="#FFFFFF" opacity=".7"/>'
    +'<text x="450" y="560" font-family="monospace" font-size="26" fill="#FFFFFF" text-anchor="middle" opacity=".9">IrisTool ✱ OPTIMIZATION DEMO</text>'
    +'</svg>';
  var DEMO_URL = "data:image/svg+xml;utf8," + encodeURIComponent(DEMO_SVG);

  var TOOLS=[
    { id:"compressor", tab:"Compressor", name:"Image Compressor",
      def:function(){ return {fmt:"auto",q:80}; } },
    { id:"quality", tab:"Quality", name:"Image Quality Reducer",
      def:function(){ return {q:70,target:""}; } }
  ];

  var state={};
  TOOLS.forEach(function(t){ state[t.id]=t.def(); });
  var activeTool=TOOLS[0];

  var srcCv=document.createElement("canvas");
  var srcReady=false;
  var srcInfo={name:"image",size:0,w:0,h:0};
  var lastBlob=null, lastExt=".jpg", lastURL=null;
  var convId=0;

  var tabsEl=$("#t-tabs"), formEl=$("#calc-form");
  var pvImg=$("#pv-img"), visCap=$("#vis-cap");
  var gSegs=$("#g-segs"), gMark=$("#g-mark"), gLegend=$("#g-legend"), gLabel=$("#gauge-label");
  var dropzone=$("#dropzone"), fileInput=$("#file-input"), dzText=$("#dz-text");

  /* ---------- form ---------- */
  function renderForm(){
    var t=activeTool, s=state[t.id], html="";
    if(t.id==="compressor"){
      html='<div class="f-grid">'
        +'<div class="field">'
        +'<label class="f-label" for="fld-fmt">Output format</label>'
        +'<select class="f-select" id="fld-fmt" data-k="fmt">'
        +'<option value="auto"'+(s.fmt==="auto"?" selected":"")+'>Auto — pick smaller of JPG / WebP</option>'
        +'<option value="jpg"'+(s.fmt==="jpg"?" selected":"")+'>JPG</option>'
        +'<option value="webp"'+(s.fmt==="webp"?" selected":"")+'>WebP</option>'
        +'<option value="png"'+(s.fmt==="png"?" selected":"")+'>PNG — lossless</option>'
        +'</select></div>'
        +'<div class="field">'
        +'<label class="f-label" for="fld-q">Quality — <span class="f-val" id="val-fld-q">'+s.q+'%</span></label>'
        +'<input class="f-input" id="fld-q" data-k="q" type="range" min="10" max="100" step="5" value="'+s.q+'">'
        +'</div>'
        +'<div class="field full"><p class="f-hint">QUALITY APPLIES TO JPG / WEBP · PNG IS LOSSLESS AND CAN BE LARGER THAN THE SOURCE</p></div>'
        +'</div>';
    } else {
      html='<div class="f-grid">'
        +'<div class="field">'
        +'<label class="f-label" for="fld-q">JPG quality — <span class="f-val" id="val-fld-q">'+s.q+'%</span></label>'
        +'<input class="f-input" id="fld-q" data-k="q" type="range" min="10" max="100" step="5" value="'+s.q+'">'
        +'</div>'
        +'<div class="field">'
        +'<label class="f-label" for="fld-target">Target size in KB (optional)</label>'
        +'<input class="f-input" id="fld-target" data-k="target" type="number" min="0" max="20000" value="'+(s.target!=null?s.target:"")+'" placeholder="e.g. 300">'
        +'</div>'
        +'<div class="field full"><p class="f-hint">WITH A TARGET SET, QUALITY IS FOUND BY BINARY SEARCH — HIGHEST QUALITY THAT FITS</p></div>'
        +'</div>';
    }
    formEl.innerHTML=html;
  }

  function renderTabs(){
    tabsEl.innerHTML=TOOLS.map(function(t){
      return '<button type="button" class="t-tab'+(t===activeTool?' on':'')+'" data-tool="'+t.id+'" role="tab" aria-selected="'+(t===activeTool)+'">'+t.tab+'</button>';
    }).join('');
  }

  /* ---------- gauge ---------- */
  function renderGauge(){
    gSegs.innerHTML='<i style="width:25%;background:#C40000"></i><i style="width:25%;background:#C9C9C0"></i><i style="width:25%;background:#6E86FF"></i><i style="width:25%;background:#0E8A3E"></i>';
    if(!lastBlob||srcInfo.size<=0){
      gLabel.textContent="SAVINGS SCALE — WAITING FOR COMPRESSION";
      gMark.style.left="0%";
    } else {
      var saved=Math.max(0,Math.round((1-lastBlob.size/srcInfo.size)*100));
      gLabel.textContent=activeTool.name.toUpperCase()+" — SAVED "+saved+"% · OUTPUT "+kb(lastBlob.size)+" VS SOURCE "+kb(srcInfo.size);
      gMark.style.left=clamp(saved,0,100)+"%";
    }
    gLegend.innerHTML=
      '<span><i class="sw" style="background:#C40000"></i>GREW<b>&lt;0%</b></span>'
      +'<span><i class="sw" style="background:#C9C9C0"></i>SMALL<b>0–25%</b></span>'
      +'<span><i class="sw" style="background:#6E86FF"></i>GOOD<b>25–60%</b></span>'
      +'<span><i class="sw" style="background:#0E8A3E"></i>EXCELLENT<b>60%+</b></span>';
  }

  /* ---------- conversion (async) ---------- */
  function toBlobAsync(canvas,type,q){
    return new Promise(function(res){ canvas.toBlob(res,type,q); });
  }

  async function convert(){
    if(!srcReady){
      visCap.textContent="LOAD AN IMAGE TO BEGIN";
      renderGauge();
      return;
    }
    var myId=++convId;
    var t=activeTool.id, s=state[t];
    var out=document.createElement("canvas");
    out.width=srcCv.width; out.height=srcCv.height;
    var ctx=out.getContext("2d");
    ctx.fillStyle="#FFFFFF";
    ctx.fillRect(0,0,out.width,out.height);
    ctx.drawImage(srcCv,0,0);

    var q=clamp((parseInt(s.q,10)||80)/100,0.05,1);
    var blob=null, ext=".jpg";

    if(t==="quality"){
      var targetKB=parseFloat(s.target);
      if(targetKB>0){
        var lo=0.05, hi=1, best=null;
        for(var i=0;i<8;i++){
          if(myId!==convId) return;
          var mid=(lo+hi)/2;
          var b=await toBlobAsync(out,"image/jpeg",mid);
          if(b && b.size<=targetKB*1024){ best=b; lo=mid; } else hi=mid;
        }
        if(myId!==convId) return;
        blob=best || (await toBlobAsync(out,"image/jpeg",0.05));
      } else {
        blob=await toBlobAsync(out,"image/jpeg",q);
      }
      ext=".jpg";
    } else {
      if(s.fmt==="jpg"){ blob=await toBlobAsync(out,"image/jpeg",q); ext=".jpg"; }
      else if(s.fmt==="webp"){
        blob=await toBlobAsync(out,"image/webp",q); ext=".webp";
        if(!blob){ blob=await toBlobAsync(out,"image/jpeg",q); ext=".jpg"; }
      }
      else if(s.fmt==="png"){ blob=await toBlobAsync(out,"image/png"); ext=".png"; }
      else {
        var jb=await toBlobAsync(out,"image/jpeg",q);
        if(myId!==convId) return;
        var wb=await toBlobAsync(out,"image/webp",q);
        if(myId!==convId) return;
        if(jb&&wb){ if(wb.size<=jb.size){ blob=wb; ext=".webp"; } else { blob=jb; ext=".jpg"; } }
        else if(jb){ blob=jb; ext=".jpg"; }
        else if(wb){ blob=wb; ext=".webp"; }
        else { blob=await toBlobAsync(out,"image/png"); ext=".png"; }
      }
    }
    if(myId!==convId) return;
    finish(blob,ext);
  }

  function finish(blob,ext){
    if(!blob){
      visCap.textContent="OUTPUT FORMAT NOT SUPPORTED IN THIS BROWSER";
      renderGauge();
      return;
    }
    lastBlob=blob; lastExt=ext;
    if(lastURL) URL.revokeObjectURL(lastURL);
    lastURL=URL.createObjectURL(blob);
    pvImg.src=lastURL;
    var saved=srcInfo.size>0?Math.round((1-blob.size/srcInfo.size)*100):0;
    visCap.textContent=
      "SOURCE "+srcInfo.w+" × "+srcInfo.h+" · "+kb(srcInfo.size)
      +" → "+ext.replace(".","").toUpperCase()+" "+srcInfo.w+" × "+srcInfo.h+" · "+kb(blob.size)
      +" · SAVED "+saved+"%";
    renderGauge();
  }

  /* ---------- image loading ---------- */
  function setSource(img,name,size){
    var MAX=2000;
    var r=Math.min(1,MAX/Math.max(img.naturalWidth,img.naturalHeight));
    srcCv.width=Math.max(1,Math.round(img.naturalWidth*r));
    srcCv.height=Math.max(1,Math.round(img.naturalHeight*r));
    srcCv.getContext("2d").drawImage(img,0,0,srcCv.width,srcCv.height);
    srcInfo={name:name||"image",size:size||0,w:srcCv.width,h:srcCv.height};
    srcReady=true;
    convert();
  }
  function loadImageURL(url,name,size){
    var img=new Image();
    img.onload=function(){ setSource(img,name,size); };
    img.onerror=function(){ visCap.textContent="COULD NOT LOAD IMAGE"; };
    img.src=url;
  }
  function loadFile(file){
    if(!file || !/^image\//.test(file.type)) return;
    var reader=new FileReader();
    reader.onload=function(){ loadImageURL(reader.result,file.name,file.size); };
    reader.readAsDataURL(file);
    dzText.textContent=file.name.toUpperCase()+" LOADED — DROP ANOTHER ANYTIME";
  }

  /* ---------- download / copy ---------- */
  function outName(){
    var base=srcInfo.name.replace(/\.[^.]+$/,"")||"image";
    return base+lastExt;
  }

  $("#btn-download").addEventListener("click", function(){
    if(!lastBlob||!lastURL){ flash($("#btn-download"),"NOTHING TO DOWNLOAD",true); return; }
    var a=document.createElement("a");
    a.href=lastURL;
    a.download=outName();
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    flash($("#btn-download"),"SAVED ✓");
  });

  $("#btn-copy").addEventListener("click", function(){
    if(!srcReady){ flash($("#btn-copy"),"LOAD AN IMAGE FIRST",true); return; }
    function fallback(){ flash($("#btn-copy"),"USE DOWNLOAD",true); }
    if(srcCv.toBlob && window.ClipboardItem && navigator.clipboard && navigator.clipboard.write){
      srcCv.toBlob(function(blob){
        if(!blob){ fallback(); return; }
        navigator.clipboard.write([new ClipboardItem({"image/png":blob})]).then(
          function(){ flash($("#btn-copy"),"PNG COPIED ✓"); },
          fallback
        );
      },"image/png");
    } else fallback();
  });

  function flash(btn,text,isErr){
    var original=btn.getAttribute("data-label")||btn.textContent;
    btn.setAttribute("data-label",original);
    btn.textContent=text;
    btn.classList.add(isErr?"err":"ok");
    clearTimeout(btn._t);
    btn._t=setTimeout(function(){
      btn.textContent=original;
      btn.classList.remove("ok","err");
    },1600);
  }

  $("#btn-reset").addEventListener("click", function(){
    state[activeTool.id]=activeTool.def();
    renderForm(); convert();
  });

  /* ---------- tool switching ---------- */
  function selectTool(id){
    var t=TOOLS.filter(function(x){return x.id===id;})[0];
    if(!t) return;
    activeTool=t;
    renderTabs(); renderForm(); convert();
  }
  tabsEl.addEventListener("click", function(e){
    var b=e.target.closest(".t-tab"); if(!b) return;
    selectTool(b.getAttribute("data-tool"));
  });

  /* ---------- form events ---------- */
  formEl.addEventListener("input", function(e){
    var k=e.target.getAttribute("data-k"); if(!k) return;
    state[activeTool.id][k]=e.target.value;
    if(k==="q"){
      var out=$("#val-fld-q");
      if(out) out.textContent=e.target.value+"%";
    }
    convert();
  });

  /* ---------- upload events ---------- */
  dropzone.addEventListener("click", function(){ fileInput.click(); });
  dropzone.addEventListener("keydown", function(e){ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); fileInput.click(); } });
  fileInput.addEventListener("change", function(){ if(fileInput.files[0]) loadFile(fileInput.files[0]); });
  ["dragenter","dragover"].forEach(function(ev){
    dropzone.addEventListener(ev, function(e){ e.preventDefault(); dropzone.classList.add("over"); });
  });
  ["dragleave","drop"].forEach(function(ev){
    dropzone.addEventListener(ev, function(e){ e.preventDefault(); dropzone.classList.remove("over"); });
  });
  dropzone.addEventListener("drop", function(e){
    var f=e.dataTransfer&&e.dataTransfer.files[0];
    if(f) loadFile(f);
  });
  $("#btn-sample-img").addEventListener("click", function(){
    loadImageURL(DEMO_URL,"sample.png",0);
    dzText.textContent="SAMPLE IMAGE LOADED — DROP YOUR OWN ANYTIME";
  });

  /* guide "runs in the optimizer above" jumps */
  $$(".tool-here").forEach(function(btn){
    btn.addEventListener("click", function(){
      selectTool(btn.getAttribute("data-go"));
      $("#analyzer").scrollIntoView({behavior:reduceMotion?"auto":"smooth"});
    });
  });

  /* ---- boot ---- */
  renderTabs(); renderForm();
  loadImageURL(DEMO_URL,"sample.png",0);
  dzText.textContent="SAMPLE IMAGE LOADED — DROP YOUR OWN ANYTIME";
})();
