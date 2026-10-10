
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
     LIVE IMAGE DESIGN (4 tools)
     ================================================================ */
  function clamp(v,a,b){ return Math.min(b,Math.max(a,v)); }

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
    +'<text x="450" y="560" font-family="monospace" font-size="26" fill="#FFFFFF" text-anchor="middle" opacity=".9">IrisTool ✱ IMAGE DESIGN DEMO</text>'
    +'</svg>';
  var DEMO_URL = "data:image/svg+xml;utf8," + encodeURIComponent(DEMO_SVG);

  var TOOLS=[
    { id:"rounded", tab:"Corners", name:"Rounded Corner Generator",
      def:function(){ return {radius:40}; } },
    { id:"border", tab:"Border", name:"Image Border Generator",
      def:function(){ return {width:12,color:"#141414",style:"solid"}; } },
    { id:"watermark", tab:"Watermark", name:"Watermark Preview",
      def:function(){ return {text:"© IrisTool",opacity:40,size:6,pos:"br"}; } },
    { id:"drawing", tab:"Drawing", name:"Canvas Drawing Tool",
      def:function(){ return {color:"#0033FF",size:8,eraser:""}; } }
  ];

  var state={};
  TOOLS.forEach(function(t){ state[t.id]=t.def(); });
  var activeTool=TOOLS[0];

  var srcCv=document.createElement("canvas");
  var srcReady=false;

  var tabsEl=$("#t-tabs"), formEl=$("#calc-form");
  var pvCanvas=$("#pv-canvas"), pvCtx=pvCanvas.getContext("2d"), visCap=$("#vis-cap");
  var gSegs=$("#g-segs"), gMark=$("#g-mark"), gLegend=$("#g-legend"), gLabel=$("#gauge-label");
  var dropzone=$("#dropzone"), fileInput=$("#file-input"), dzText=$("#dz-text");

  /* ---------- form ---------- */
  function sliderField(k,label,min,max,step,unit){
    var id="fld-"+k;
    var val=state[activeTool.id][k];
    return '<div class="field"><label class="f-label" for="'+id+'">'+label+' — <span class="f-val" id="val-'+id+'">'+val+(unit||"")+'</span></label>'
      +'<input class="f-input" id="'+id+'" data-k="'+k+'" type="range" min="'+min+'" max="'+max+'" step="'+(step||1)+'" value="'+val+'"></div>';
  }
  function renderForm(){
    var t=activeTool.id, s=state[t], html="";
    if(t==="rounded"){
      html='<div class="f-grid">'+sliderField("radius","Corner radius",0,150,1," px")
        +'<div class="field"><p class="f-hint" style="height:100%">CORNERS STAY TRANSPARENT IN THE PNG EXPORT · CSS SNIPPET COPIES WITH THE COPY BUTTON</p></div></div>';
    } else if(t==="border"){
      html='<div class="f-grid">'
        +sliderField("width","Border width",2,40,1," px")
        +'<div class="field"><label class="f-label" for="fld-color">Border color</label>'
        +'<input class="f-input" id="fld-color" data-k="color" type="color" value="'+s.color+'"></div>'
        +'<div class="field full"><label class="f-label" for="fld-style">Border style</label>'
        +'<select class="f-select" id="fld-style" data-k="style">'
        +'<option value="solid"'+(s.style==="solid"?" selected":"")+'>Solid</option>'
        +'<option value="dashed"'+(s.style==="dashed"?" selected":"")+'>Dashed</option>'
        +'<option value="double"'+(s.style==="double"?" selected":"")+'>Double</option>'
        +'</select></div></div>';
    } else if(t==="watermark"){
      html='<div class="f-grid">'
        +'<div class="field full"><label class="f-label" for="fld-text">Watermark text</label>'
        +'<input class="f-input" id="fld-text" data-k="text" type="text" maxlength="60" value="'+(s.text||"").replace(/"/g,"&quot;")+'"></div>'
        +sliderField("opacity","Opacity",10,100,5,"%")
        +sliderField("size","Text size",3,20,1,"% of width")
        +'<div class="field full"><label class="f-label" for="fld-pos">Position</label>'
        +'<select class="f-select" id="fld-pos" data-k="pos">'
        +'<option value="tl"'+(s.pos==="tl"?" selected":"")+'>Top left</option>'
        +'<option value="tc"'+(s.pos==="tc"?" selected":"")+'>Top center</option>'
        +'<option value="tr"'+(s.pos==="tr"?" selected":"")+'>Top right</option>'
        +'<option value="ml"'+(s.pos==="ml"?" selected":"")+'>Middle left</option>'
        +'<option value="mc"'+(s.pos==="mc"?" selected":"")+'>Center</option>'
        +'<option value="mr"'+(s.pos==="mr"?" selected":"")+'>Middle right</option>'
        +'<option value="bl"'+(s.pos==="bl"?" selected":"")+'>Bottom left</option>'
        +'<option value="bc"'+(s.pos==="bc"?" selected":"")+'>Bottom center</option>'
        +'<option value="br"'+(s.pos==="br"?" selected":"")+'>Bottom right</option>'
        +'<option value="tile"'+(s.pos==="tile"?" selected":"")+'>Tiled diagonal</option>'
        +'</select></div></div>';
    } else {
      html='<div class="f-grid">'
        +'<div class="field"><label class="f-label" for="fld-color">Brush color</label>'
        +'<input class="f-input" id="fld-color" data-k="color" type="color" value="'+s.color+'"></div>'
        +sliderField("size","Brush size",2,60,1," px")
        +'<div class="field f-check-row"><input id="fld-eraser" data-k="eraser" type="checkbox"'+(s.eraser==="1"?" checked":"")+'>'
        +'<label class="f-label" for="fld-eraser">Eraser</label></div>'
        +'<div class="field"><button type="button" class="f-btn" id="btn-clear-canvas">✕ Clear canvas</button></div>'
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
  function renderGauge(pos,label,legend){
    gLabel.textContent=label;
    gSegs.innerHTML='<i style="width:25%;background:#C40000"></i><i style="width:25%;background:#C9C9C0"></i><i style="width:25%;background:#6E86FF"></i><i style="width:25%;background:#0033FF"></i>';
    gMark.style.left=clamp(pos,0,100)+"%";
    gLegend.innerHTML=legend.map(function(it){
      return '<span><i class="sw" style="background:'+it.c+'"></i>'+it.l+'<b>'+it.v+'</b></span>';
    }).join('');
  }
  var LEG4=[
    {c:"#C40000",l:"LOW",v:"0–25%"},{c:"#C9C9C0",l:"MID",v:"25–50%"},
    {c:"#6E86FF",l:"HIGH",v:"50–75%"},{c:"#0033FF",l:"MAX",v:"75–100%"}
  ];

  /* ---------- drawing ---------- */
  var drawingInited=false, drawingActive=false, lastPt=null;
  function initDrawing(){
    pvCanvas.width=900; pvCanvas.height=600;
    pvCtx.fillStyle="#FFFFFF";
    pvCtx.fillRect(0,0,900,600);
    drawingInited=true;
  }
  function canvasPos(e){
    var r=pvCanvas.getBoundingClientRect();
    return {
      x:(e.clientX-r.left)*(pvCanvas.width/r.width),
      y:(e.clientY-r.top)*(pvCanvas.height/r.height)
    };
  }
  pvCanvas.addEventListener("pointerdown", function(e){
    if(activeTool.id!=="drawing") return;
    e.preventDefault();
    pvCanvas.setPointerCapture(e.pointerId);
    drawingActive=true;
    lastPt=canvasPos(e);
    drawDot(lastPt);
  });
  pvCanvas.addEventListener("pointermove", function(e){
    if(activeTool.id!=="drawing"||!drawingActive) return;
    e.preventDefault();
    var p=canvasPos(e);
    drawLine(lastPt,p);
    lastPt=p;
  });
  ["pointerup","pointercancel","pointerleave"].forEach(function(ev){
    pvCanvas.addEventListener(ev, function(){ drawingActive=false; lastPt=null; });
  });
  function brushStyle(){
    var s=state.drawing;
    pvCtx.lineWidth=parseInt(s.size,10)||8;
    pvCtx.lineCap="round";
    pvCtx.lineJoin="round";
    pvCtx.strokeStyle=s.eraser==="1"?"#FFFFFF":s.color;
  }
  function drawDot(p){
    brushStyle();
    pvCtx.beginPath();
    pvCtx.moveTo(p.x,p.y);
    pvCtx.lineTo(p.x+0.01,p.y+0.01);
    pvCtx.stroke();
  }
  function drawLine(a,b){
    brushStyle();
    pvCtx.beginPath();
    pvCtx.moveTo(a.x,a.y);
    pvCtx.lineTo(b.x,b.y);
    pvCtx.stroke();
  }

  /* ---------- rendering ---------- */
  function roundRectPath(ctx,x,y,w,h,r){
    r=Math.min(r,w/2,h/2);
    ctx.beginPath();
    ctx.moveTo(x+r,y);
    ctx.lineTo(x+w-r,y); ctx.arcTo(x+w,y,x+w,y+r,r);
    ctx.lineTo(x+w,y+h-r); ctx.arcTo(x+w,y+h,x+w-r,y+h,r);
    ctx.lineTo(x+r,y+h); ctx.arcTo(x,y+h,x,y+h-r,r);
    ctx.lineTo(x,y+r); ctx.arcTo(x,y,x+r,y,r);
    ctx.closePath();
  }

  function renderPreview(){
    pvCanvas.classList.remove("draw-mode");
    if(activeTool.id==="drawing"){
      pvCanvas.classList.add("draw-mode");
      if(!drawingInited) initDrawing();
      var ds=state.drawing;
      visCap.textContent="FREEHAND CANVAS 900 × 600 · BRUSH "+ds.size+"PX"+(ds.eraser==="1"?" · ERASER":"")+"\nDRAW WITH MOUSE OR TOUCH · DOWNLOAD TO KEEP IT";
      renderGauge(clamp((parseInt(ds.size,10)||8)/60*100,0,100),"BRUSH SIZE — "+ds.size+" PX",LEG4);
      return;
    }
    if(!srcReady){
      pvCanvas.width=640; pvCanvas.height=360;
      pvCtx.clearRect(0,0,pvCanvas.width,pvCanvas.height);
      visCap.textContent="LOAD AN IMAGE TO BEGIN — OR USE THE SAMPLE";
      renderGauge(0,"REFERENCE SCALE — WAITING FOR IMAGE",LEG4);
      return;
    }
    var t=activeTool.id, s=state[t];
    var w=srcCv.width, h=srcCv.height;
    pvCanvas.width=w; pvCanvas.height=h;
    pvCtx.clearRect(0,0,w,h);

    if(t==="rounded"){
      var r=clamp(parseInt(s.radius,10)||0,0,Math.min(w,h)/2);
      roundRectPath(pvCtx,0,0,w,h,r);
      pvCtx.save();
      pvCtx.clip();
      pvCtx.drawImage(srcCv,0,0);
      pvCtx.restore();
      visCap.textContent="RADIUS "+r+"PX · TRANSPARENT CORNERS\nCSS: border-radius: "+r+"px;";
      renderGauge(clamp(r/150*100,0,100),"CORNER RADIUS — "+r+" PX",LEG4);
    }
    else if(t==="border"){
      var bw=clamp(parseInt(s.width,10)||8,1,60);
      pvCtx.drawImage(srcCv,0,0);
      pvCtx.strokeStyle=s.color;
      if(s.style==="dashed"){
        pvCtx.lineWidth=bw;
        pvCtx.setLineDash([bw*1.6,bw*1.2]);
        pvCtx.strokeRect(bw/2,bw/2,w-bw,h-bw);
        pvCtx.setLineDash([]);
      } else if(s.style==="double"){
        pvCtx.lineWidth=Math.max(2,Math.round(bw/3));
        pvCtx.strokeRect(bw/6,bw/6,w-bw/3,h-bw/3);
        pvCtx.strokeRect(bw*5/6,bw*5/6,w-bw*5/3,h-bw*5/3);
      } else {
        pvCtx.lineWidth=bw;
        pvCtx.strokeRect(bw/2,bw/2,w-bw,h-bw);
      }
      visCap.textContent="BORDER "+bw+"PX "+s.style.toUpperCase()+" "+s.color.toUpperCase()+"\nCSS: border: "+bw+"px "+s.style+" "+s.color+";";
      renderGauge(clamp(bw/40*100,0,100),"BORDER WIDTH — "+bw+" PX",LEG4);
    }
    else if(t==="watermark"){
      pvCtx.drawImage(srcCv,0,0);
      var text=(s.text||"").trim()||"© WATERMARK";
      var fs=Math.max(10,Math.round(w*(parseInt(s.size,10)||6)/100));
      pvCtx.save();
      pvCtx.globalAlpha=clamp((parseInt(s.opacity,10)||40)/100,0.05,1);
      pvCtx.font="700 "+fs+"px 'IBM Plex Sans', Arial, sans-serif";
      pvCtx.fillStyle="#FFFFFF";
      pvCtx.shadowColor="rgba(0,0,0,.55)";
      pvCtx.shadowBlur=fs/6;
      var mg=Math.round(w*0.03);
      if(s.pos==="tile"){
        pvCtx.translate(w/2,h/2);
        pvCtx.rotate(-28*Math.PI/180);
        pvCtx.textAlign="center";
        var tw=pvCtx.measureText(text).width;
        var gx=tw+w*0.25, gy=fs*3;
        for(var yy=-h; yy<=h; yy+=gy){
          var off=(Math.round(yy/gy)%2)?gx/2:0;
          for(var xx=-w*1.5; xx<=w*1.5; xx+=gx){
            pvCtx.fillText(text,xx+off,yy);
          }
        }
      } else {
        var px=mg, py=h-mg, align="left", base="alphabetic";
        if(s.pos[1]==="c"||s.pos==="mc") align="center";
        if(s.pos[1]==="r") align="right";
        px = s.pos[1]==="l"?mg : s.pos[1]==="r"?w-mg : w/2;
        py = s.pos[0]==="t"?mg+fs : s.pos[0]==="m"?h/2+fs/3 : h-mg;
        pvCtx.textAlign=align;
        pvCtx.fillText(text,px,py);
      }
      pvCtx.restore();
      visCap.textContent="WATERMARK · "+text.toUpperCase()+" · "+s.opacity+"% · "+(s.pos==="tile"?"TILED":s.pos.toUpperCase())+"\nPREVIEW AND EXPORT ARE IDENTICAL";
      renderGauge(clamp((parseInt(s.opacity,10)||40),0,100),"WATERMARK OPACITY — "+s.opacity+"%",LEG4);
    }
  }

  /* ---------- image loading ---------- */
  function setSource(img){
    var MAX=2000;
    var r=Math.min(1,MAX/Math.max(img.naturalWidth,img.naturalHeight));
    srcCv.width=Math.max(1,Math.round(img.naturalWidth*r));
    srcCv.height=Math.max(1,Math.round(img.naturalHeight*r));
    srcCv.getContext("2d").drawImage(img,0,0,srcCv.width,srcCv.height);
    srcReady=true;
    renderPreview();
  }
  function loadImageURL(url){
    var img=new Image();
    img.onload=function(){ setSource(img); };
    img.onerror=function(){ visCap.textContent="COULD NOT LOAD IMAGE"; };
    img.src=url;
  }
  function loadFile(file){
    if(!file || !/^image\//.test(file.type)) return;
    var reader=new FileReader();
    reader.onload=function(){ loadImageURL(reader.result); };
    reader.readAsDataURL(file);
    dzText.textContent=file.name.toUpperCase()+" LOADED — DROP ANOTHER ANYTIME";
  }

  /* ---------- buttons ---------- */
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
    if(activeTool.id==="drawing") initDrawing();
    renderForm(); renderPreview();
  });

  $("#btn-copy").addEventListener("click", function(){
    var t=activeTool.id;
    function copyText(txt){
      function fb(){
        var ta=document.createElement("textarea");
        ta.value=txt; ta.style.position="fixed"; ta.style.left="-9999px";
        document.body.appendChild(ta); ta.select();
        var ok=false; try{ ok=document.execCommand("copy"); }catch(err){}
        document.body.removeChild(ta);
        flash($("#btn-copy"), ok?"COPIED ✓":"COPY FAILED", !ok);
      }
      if(navigator.clipboard&&navigator.clipboard.writeText){
        navigator.clipboard.writeText(txt).then(function(){ flash($("#btn-copy"),"COPIED ✓"); },fb);
      } else fb();
    }
    function copyImage(){
      function fb(){ flash($("#btn-copy"),"USE DOWNLOAD",true); }
      if(pvCanvas.toBlob && window.ClipboardItem && navigator.clipboard && navigator.clipboard.write){
        pvCanvas.toBlob(function(blob){
          if(!blob){ fb(); return; }
          navigator.clipboard.write([new ClipboardItem({"image/png":blob})]).then(
            function(){ flash($("#btn-copy"),"PNG COPIED ✓"); }, fb
          );
        },"image/png");
      } else fb();
    }
    if(t==="rounded"){
      copyText("border-radius: "+(state.rounded.radius||0)+"px;");
    } else if(t==="border"){
      copyText("border: "+state.border.width+"px "+state.border.style+" "+state.border.color+";");
    } else {
      copyImage();
    }
  });

  $("#btn-download").addEventListener("click", function(){
    if(activeTool.id!=="drawing" && !srcReady){
      flash($("#btn-download"),"LOAD AN IMAGE FIRST",true);
      return;
    }
    var a=document.createElement("a");
    a.href=pvCanvas.toDataURL("image/png");
    a.download="IrisTool-"+activeTool.id+".png";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    flash($("#btn-download"),"SAVED ✓");
  });

  /* clear canvas button (delegated, lives inside form) */
  formEl.addEventListener("click", function(e){
    if(e.target.id==="btn-clear-canvas"){
      initDrawing();
    }
  });

  /* ---------- tool switching ---------- */
  function selectTool(id){
    var t=TOOLS.filter(function(x){return x.id===id;})[0];
    if(!t) return;
    activeTool=t;
    renderTabs(); renderForm(); renderPreview();
  }
  tabsEl.addEventListener("click", function(e){
    var b=e.target.closest(".t-tab"); if(!b) return;
    selectTool(b.getAttribute("data-tool"));
  });

  /* ---------- form events ---------- */
  formEl.addEventListener("input", function(e){
    var k=e.target.getAttribute("data-k"); if(!k) return;
    var el=e.target;
    state[activeTool.id][k]=el.type==="checkbox"?(el.checked?"1":""):el.value;
    if(el.type==="range"){
      var out=$("#val-"+k);
      var unit = k==="radius"?" px":k==="width"?" px":k==="opacity"?"%":k==="size"?(activeTool.id==="watermark"?"% of width":" px"):"";
      if(out) out.textContent=el.value+unit;
    }
    renderPreview();
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
    loadImageURL(DEMO_URL);
    dzText.textContent="SAMPLE IMAGE LOADED — DROP YOUR OWN ANYTIME";
  });

  /* guide "runs in the panel above" jumps */
  $$(".tool-here").forEach(function(btn){
    btn.addEventListener("click", function(){
      selectTool(btn.getAttribute("data-go"));
      $("#analyzer").scrollIntoView({behavior:reduceMotion?"auto":"smooth"});
    });
  });

  /* ---- boot ---- */
  renderTabs(); renderForm();
  loadImageURL(DEMO_URL);
  dzText.textContent="SAMPLE IMAGE LOADED — DROP YOUR OWN ANYTIME";
})();
