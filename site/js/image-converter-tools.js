
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
     LIVE IMAGE CONVERTERS (7 tools)
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
    +'<text x="450" y="560" font-family="monospace" font-size="26" fill="#FFFFFF" text-anchor="middle" opacity=".9">IrisTool ✱ IMAGE CONVERTER DEMO</text>'
    +'</svg>';
  var DEMO_URL = "data:image/svg+xml;utf8," + encodeURIComponent(DEMO_SVG);

  /* tool map: id -> {name, accept, target mime, ext, needs quality, dz label} */
  var TOOLS=[
    { id:"jpg2png", tab:"JPG → PNG",  name:"JPG to PNG",  accept:"image/jpeg,image/jpg", out:"image/png",  ext:".png",  q:false, dz:"DROP JPG HERE — OR CLICK TO BROWSE", def:function(){ return {}; } },
    { id:"png2jpg", tab:"PNG → JPG",  name:"PNG to JPG",  accept:"image/png",            out:"image/jpeg", ext:".jpg",  q:true,  dz:"DROP PNG HERE — OR CLICK TO BROWSE", def:function(){ return {q:90}; } },
    { id:"jpg2webp",tab:"JPG → WebP", name:"JPG to WebP", accept:"image/jpeg,image/jpg", out:"image/webp", ext:".webp", q:true,  dz:"DROP JPG HERE — OR CLICK TO BROWSE", def:function(){ return {q:90}; } },
    { id:"webp2jpg",tab:"WebP → JPG", name:"WebP to JPG", accept:"image/webp",           out:"image/jpeg", ext:".jpg",  q:true,  dz:"DROP WEBP HERE — OR CLICK TO BROWSE", def:function(){ return {q:90}; } },
    { id:"png2webp",tab:"PNG → WebP", name:"PNG to WebP", accept:"image/png",            out:"image/webp", ext:".webp", q:true,  dz:"DROP PNG HERE — OR CLICK TO BROWSE", def:function(){ return {q:90}; } },
    { id:"webp2png",tab:"WebP → PNG", name:"WebP to PNG", accept:"image/webp",           out:"image/png",  ext:".png",  q:false, dz:"DROP WEBP HERE — OR CLICK TO BROWSE", def:function(){ return {}; } },
    { id:"ico",     tab:"→ ICO",      name:"Convert to ICO", accept:"image/png,image/jpeg,image/jpg,image/webp", out:"image/x-icon", ext:".ico", q:false, ico:true, dz:"DROP PNG / JPG / WEBP — OR CLICK TO BROWSE", def:function(){ return {size:32}; } }
  ];

  var state={};
  TOOLS.forEach(function(t){ state[t.id]=t.def(); });
  var activeTool=TOOLS[0];

  var srcCv=document.createElement("canvas");
  var srcReady=false;
  var srcInfo={name:"image",size:0,w:0,h:0};
  var lastBlob=null, lastExt=".png", lastURL=null;

  var tabsEl=$("#t-tabs"), formEl=$("#calc-form");
  var pvImg=$("#pv-img"), visCap=$("#vis-cap");
  var gSegs=$("#g-segs"), gMark=$("#g-mark"), gLegend=$("#g-legend"), gLabel=$("#gauge-label");
  var dropzone=$("#dropzone"), fileInput=$("#file-input"), dzText=$("#dz-text");

  /* ---------- form ---------- */
  function renderForm(){
    var t=activeTool, s=state[t.id], html="";
    if(t.q){
      var id="fld-q";
      html='<div class="f-grid"><div class="field full">'
        +'<label class="f-label" for="'+id+'">Output quality — <span class="f-val" id="val-fld-q">'+s.q+'%</span></label>'
        +'<input class="f-input" id="'+id+'" data-k="q" type="range" min="10" max="100" step="5" value="'+s.q+'">'
        +'</div></div>';
    } else if(t.ico){
      html='<div class="f-grid"><div class="field full">'
        +'<label class="f-label" for="fld-size">Icon size</label>'
        +'<select class="f-select" id="fld-size" data-k="size">'
        +[16,32,48,64].map(function(v){ return '<option value="'+v+'"'+(String(s.size)===String(v)?' selected':'')+'>'+v+' × '+v+' px</option>'; }).join('')
        +'</select>'
        +'<p class="f-hint" style="margin-top:10px">SQUARE CANVAS · CONTAIN FIT · TRANSPARENT PADDING · PNG-IN-ICO</p>'
        +'</div></div>';
    } else {
      html='<div class="f-grid"><div class="field full">'
        +'<p class="f-hint">'+(t.out==="image/png"
          ? "LOSSLESS OUTPUT — NO QUALITY SETTING NEEDED · TRANSPARENCY PRESERVED WHERE PRESENT"
          : "OUTPUT READY")+'</p>'
        +'</div></div>';
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
    if(!lastBlob){
      gLabel.textContent="REFERENCE SCALE — WAITING FOR CONVERSION";
      gSegs.innerHTML='<i style="width:25%;background:#C40000"></i><i style="width:25%;background:#C9C9C0"></i><i style="width:25%;background:#6E86FF"></i><i style="width:25%;background:#0033FF"></i>';
      gMark.style.left="0%";
      gLegend.innerHTML='<span><i class="sw" style="background:#C9C9C0"></i>SMALLER<b>&lt;100%</b></span><span><i class="sw" style="background:#0033FF"></i>LARGER<b>&gt;100%</b></span>';
      return;
    }
    var ratio=srcInfo.size>0 ? lastBlob.size/srcInfo.size : 1;
    var pos=clamp(ratio/2*100,0,100);
    var delta=srcInfo.size>0?Math.round((lastBlob.size/srcInfo.size-1)*100):0;
    gLabel.textContent=activeTool.name.toUpperCase()+" — OUTPUT "+kb(lastBlob.size)+" VS SOURCE "+kb(srcInfo.size)+" · "+(delta>=0?"+":"")+delta+"%";
    gSegs.innerHTML='<i style="width:25%;background:#0E8A3E"></i><i style="width:25%;background:#C9C9C0"></i><i style="width:25%;background:#6E86FF"></i><i style="width:25%;background:#C40000"></i>';
    gMark.style.left=pos+"%";
    gLegend.innerHTML=
      '<span><i class="sw" style="background:#0E8A3E"></i>MUCH SMALLER<b>&lt;50%</b></span>'
      +'<span><i class="sw" style="background:#C9C9C0"></i>SIMILAR<b>50–100%</b></span>'
      +'<span><i class="sw" style="background:#6E86FF"></i>LARGER<b>100–150%</b></span>'
      +'<span><i class="sw" style="background:#C40000"></i>MUCH LARGER<b>&gt;150%</b></span>';
  }

  /* ---------- ICO encoder (PNG-in-ICO container) ---------- */
  function canvasToIcoBlob(canvas,size){
    return new Promise(function(resolve,reject){
      var sq=document.createElement("canvas");
      sq.width=size; sq.height=size;
      var ctx=sq.getContext("2d");
      var r=Math.min(size/canvas.width,size/canvas.height);
      var w=Math.max(1,Math.round(canvas.width*r)), h=Math.max(1,Math.round(canvas.height*r));
      ctx.drawImage(canvas,Math.round((size-w)/2),Math.round((size-h)/2),w,h);
      sq.toBlob(function(pngBlob){
        if(!pngBlob){ reject(new Error("png encode failed")); return; }
        var reader=new FileReader();
        reader.onload=function(){
          try{
            var pngBuf=new Uint8Array(reader.result);
            var buf=new ArrayBuffer(22+pngBuf.length);
            var dv=new DataView(buf);
            var u8=new Uint8Array(buf);
            dv.setUint16(0,0,true);      /* reserved */
            dv.setUint16(2,1,true);      /* type: icon */
            dv.setUint16(4,1,true);      /* image count */
            u8[6]=size>=256?0:size;      /* width (0 = 256) */
            u8[7]=size>=256?0:size;      /* height */
            u8[8]=0; u8[9]=0;            /* colors, reserved */
            dv.setUint16(10,1,true);     /* planes */
            dv.setUint16(12,32,true);    /* bpp */
            dv.setUint32(14,pngBuf.length,true);
            dv.setUint32(18,22,true);    /* data offset */
            u8.set(pngBuf,22);
            resolve(new Blob([buf],{type:"image/x-icon"}));
          }catch(err){ reject(err); }
        };
        reader.onerror=function(){ reject(new Error("read failed")); };
        reader.readAsArrayBuffer(pngBlob);
      },"image/png");
    });
  }

  /* ---------- conversion ---------- */
  function convert(){
    if(!srcReady){
      visCap.textContent="LOAD AN IMAGE TO BEGIN";
      renderGauge();
      return;
    }
    var t=activeTool, s=state[t.id];
    var out=document.createElement("canvas");
    out.width=srcCv.width; out.height=srcCv.height;
    var ctx=out.getContext("2d");
    if(t.out==="image/jpeg"){
      ctx.fillStyle="#FFFFFF";
      ctx.fillRect(0,0,out.width,out.height);
    }
    ctx.drawImage(srcCv,0,0);

    function finish(blob,mime,ext){
      if(!blob){
        visCap.textContent="OUTPUT FORMAT NOT SUPPORTED IN THIS BROWSER";
        renderGauge();
        return;
      }
      lastBlob=blob; lastExt=ext;
      if(lastURL) URL.revokeObjectURL(lastURL);
      lastURL=URL.createObjectURL(blob);
      pvImg.src=lastURL;
      visCap.textContent=
        "SOURCE "+srcInfo.w+" × "+srcInfo.h+" · "+kb(srcInfo.size)
        +" → "+ext.replace(".","").toUpperCase()+" "+out.width+" × "+out.height+" · "+kb(blob.size);
      renderGauge();
    }

    if(t.ico){
      canvasToIcoBlob(out, parseInt(s.size,10)||32).then(
        function(blob){ finish(blob,"image/x-icon",".ico"); },
        function(){ finish(null,"image/x-icon",".ico"); }
      );
      return;
    }
    if(t.out==="image/png"){
      out.toBlob(function(blob){ finish(blob,"image/png",".png"); },"image/png");
      return;
    }
    var q=clamp((parseInt(s.q,10)||90)/100,0.1,1);
    out.toBlob(function(blob){ finish(blob,t.out,t.ext); },t.out,q);
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
    fileInput.setAttribute("accept",t.accept);
    dzText.textContent=t.dz;
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
    if(e.target.type==="range"){
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

  /* guide "runs in the converter above" jumps */
  $$(".tool-here").forEach(function(btn){
    btn.addEventListener("click", function(){
      selectTool(btn.getAttribute("data-go"));
      $("#analyzer").scrollIntoView({behavior:reduceMotion?"auto":"smooth"});
    });
  });

  /* ---- boot ---- */
  renderTabs(); renderForm();
  fileInput.setAttribute("accept",activeTool.accept);
  loadImageURL(DEMO_URL,"sample.png",0);
  dzText.textContent="SAMPLE IMAGE LOADED — DROP YOUR OWN ANYTIME";
})();
