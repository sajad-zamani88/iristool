
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
     LIVE IMAGE EDITING (11 tools)
     ================================================================ */
  function clamp(v,a,b){ return Math.min(b,Math.max(a,v)); }
  function clamp255(v){ return v<0?0:v>255?255:v; }
  function rnd(n){ return Math.floor(Math.random()*n); }

  /* ---------- demo image (inline SVG — no network needed) ---------- */
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
    +'<text x="450" y="560" font-family="monospace" font-size="26" fill="#FFFFFF" text-anchor="middle" opacity=".9">IrisTool ✱ IMAGE EDITING DEMO</text>'
    +'</svg>';
  var DEMO_URL = "data:image/svg+xml;utf8," + encodeURIComponent(DEMO_SVG);

  /* ---------- state ---------- */
  var srcCv = document.createElement("canvas");
  var srcReady = false;
  var pvCanvas = $("#pv-canvas"), pvCtx = pvCanvas.getContext("2d");
  var visCap = $("#vis-cap");
  var raf = null;

  var TOOLS=[
    { id:"resizer",   tab:"Resize",     name:"Image Resizer",        def:function(){ return {w:"",h:"",lock:"1"}; } },
    { id:"cropper",   tab:"Crop",       name:"Image Cropper",        def:function(){ return {x:10,y:10,w:80,h:80}; } },
    { id:"rotate",    tab:"Rotate",     name:"Image Rotate",         def:function(){ return {angle:90}; } },
    { id:"flip",      tab:"Flip",       name:"Image Flip",           def:function(){ return {dir:"h"}; } },
    { id:"blur",      tab:"Blur",       name:"Blur Image",           def:function(){ return {r:6}; } },
    { id:"sharpen",   tab:"Sharpen",    name:"Sharpen Image",        def:function(){ return {amt:50}; } },
    { id:"brightness",tab:"Brightness", name:"Brightness Adjuster",  def:function(){ return {amt:120}; } },
    { id:"contrast",  tab:"Contrast",   name:"Contrast Adjuster",    def:function(){ return {amt:130}; } },
    { id:"saturation",tab:"Saturation", name:"Saturation Adjuster",  def:function(){ return {amt:160}; } },
    { id:"grayscale", tab:"Grayscale",  name:"Grayscale Converter",  def:function(){ return {amt:100}; } },
    { id:"sepia",     tab:"Sepia",      name:"Sepia Filter",         def:function(){ return {amt:100}; } }
  ];
  var state={};
  TOOLS.forEach(function(t){ state[t.id]=t.def(); });
  var activeTool=TOOLS[0];

  var tabsEl=$("#t-tabs"), formEl=$("#calc-form");
  var gSegs=$("#g-segs"), gMark=$("#g-mark"), gLegend=$("#g-legend"), gLabel=$("#gauge-label");

  /* ---------- image loading ---------- */
  function setSource(img){
    var MAX=900;
    var r=Math.min(1,MAX/Math.max(img.naturalWidth,img.naturalHeight));
    srcCv.width=Math.max(1,Math.round(img.naturalWidth*r));
    srcCv.height=Math.max(1,Math.round(img.naturalHeight*r));
    srcCv.getContext("2d").drawImage(img,0,0,srcCv.width,srcCv.height);
    srcReady=true;
    state.resizer.w=String(srcCv.width);
    state.resizer.h=String(srcCv.height);
    renderForm();
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
  }

  /* ---------- pixel engines ---------- */
  function blurData(d,w,h,r){
    r=Math.min(Math.max(r|0,1),20);
    var tmp=new Uint8ClampedArray(d.length);
    function passH(src,dst){
      var div=r*2+1;
      for(var y=0;y<h;y++){
        var row=y*w*4;
        for(var c=0;c<4;c++){
          var sum=0;
          for(var k=-r;k<=r;k++){
            var x=clamp(k,0,w-1);
            sum+=src[row+x*4+c];
          }
          for(var x2=0;x2<w;x2++){
            dst[row+x2*4+c]=sum/div;
            var addX=Math.min(w-1,x2+r+1), remX=Math.max(0,x2-r);
            sum+=src[row+addX*4+c]-src[row+remX*4+c];
          }
        }
      }
    }
    function passV(src,dst){
      var div=r*2+1;
      for(var x=0;x<w;x++){
        for(var c=0;c<4;c++){
          var sum=0;
          for(var k=-r;k<=r;k++){
            var y=clamp(k,0,h-1);
            sum+=src[(y*w+x)*4+c];
          }
          for(var y2=0;y2<h;y2++){
            dst[(y2*w+x)*4+c]=sum/div;
            var addY=Math.min(h-1,y2+r+1), remY=Math.max(0,y2-r);
            sum+=src[(addY*w+x)*4+c]-src[(remY*w+x)*4+c];
          }
        }
      }
    }
    passH(d,tmp); passV(tmp,d);
    passH(d,tmp); passV(tmp,d);
  }
  function sharpenData(d,w,h,amt){
    var a=amt/100; if(a<=0) return;
    var src=d.slice();
    var k=[0,-a,0,-a,1+4*a,-a,0,-a,0];
    for(var y=1;y<h-1;y++){
      for(var x=1;x<w-1;x++){
        var idx=(y*w+x)*4;
        for(var c=0;c<3;c++){
          var sum=0,ki=0;
          for(var ky=-1;ky<=1;ky++){
            for(var kx=-1;kx<=1;kx++){
              sum+=src[((y+ky)*w+(x+kx))*4+c]*k[ki++];
            }
          }
          d[idx+c]=clamp255(sum);
        }
      }
    }
  }
  function brightnessData(d,amt){
    var f=amt/100;
    for(var i=0;i<d.length;i+=4){
      d[i]=clamp255(d[i]*f);
      d[i+1]=clamp255(d[i+1]*f);
      d[i+2]=clamp255(d[i+2]*f);
    }
  }
  function contrastData(d,amt){
    var f=amt/100;
    for(var i=0;i<d.length;i+=4){
      d[i]=clamp255((d[i]-128)*f+128);
      d[i+1]=clamp255((d[i+1]-128)*f+128);
      d[i+2]=clamp255((d[i+2]-128)*f+128);
    }
  }
  function saturationData(d,amt){
    var f=amt/100;
    for(var i=0;i<d.length;i+=4){
      var r=d[i],g=d[i+1],b=d[i+2];
      var lum=0.299*r+0.587*g+0.114*b;
      d[i]=clamp255(lum+(r-lum)*f);
      d[i+1]=clamp255(lum+(g-lum)*f);
      d[i+2]=clamp255(lum+(b-lum)*f);
    }
  }
  function grayscaleData(d,amt){
    var f=amt/100;
    for(var i=0;i<d.length;i+=4){
      var r=d[i],g=d[i+1],b=d[i+2];
      var lum=0.299*r+0.587*g+0.114*b;
      d[i]=clamp255(r+(lum-r)*f);
      d[i+1]=clamp255(g+(lum-g)*f);
      d[i+2]=clamp255(b+(lum-b)*f);
    }
  }
  function sepiaData(d,amt){
    var f=amt/100;
    for(var i=0;i<d.length;i+=4){
      var r=d[i],g=d[i+1],b=d[i+2];
      var sr=0.393*r+0.769*g+0.189*b;
      var sg=0.349*r+0.686*g+0.168*b;
      var sb=0.272*r+0.534*g+0.131*b;
      d[i]=clamp255(r+(sr-r)*f);
      d[i+1]=clamp255(g+(sg-g)*f);
      d[i+2]=clamp255(b+(sb-b)*f);
    }
  }

  /* ---------- geometry ---------- */
  function geomCanvas(){
    var t=activeTool.id, s=state[t];
    var cv=document.createElement("canvas");
    var ctx;
    if(t==="resizer"){
      var w=clamp(parseInt(s.w,10)||srcCv.width,1,4000);
      var h=clamp(parseInt(s.h,10)||srcCv.height,1,4000);
      cv.width=w; cv.height=h;
      cv.getContext("2d").drawImage(srcCv,0,0,w,h);
      return cv;
    }
    if(t==="cropper"){
      var cx=clamp(parseFloat(s.x)||0,0,95), cy=clamp(parseFloat(s.y)||0,0,95);
      var cw=clamp(parseFloat(s.w)||80,5,100), ch=clamp(parseFloat(s.h)||80,5,100);
      cx=Math.min(cx,100-cw); cy=Math.min(cy,100-ch);
      var sx=srcCv.width*cx/100, sy=srcCv.height*cy/100;
      var sw=srcCv.width*cw/100, sh=srcCv.height*ch/100;
      cv.width=Math.max(1,Math.round(sw)); cv.height=Math.max(1,Math.round(sh));
      cv.getContext("2d").drawImage(srcCv,sx,sy,sw,sh,0,0,cv.width,cv.height);
      return cv;
    }
    if(t==="rotate"){
      var ang=(parseFloat(s.angle)||0)*Math.PI/180;
      var cos=Math.abs(Math.cos(ang)), sin=Math.abs(Math.sin(ang));
      var nw=Math.ceil(srcCv.width*cos+srcCv.height*sin);
      var nh=Math.ceil(srcCv.width*sin+srcCv.height*cos);
      cv.width=Math.max(1,nw); cv.height=Math.max(1,nh);
      ctx=cv.getContext("2d");
      ctx.translate(cv.width/2,cv.height/2);
      ctx.rotate(ang);
      ctx.drawImage(srcCv,-srcCv.width/2,-srcCv.height/2);
      return cv;
    }
    if(t==="flip"){
      cv.width=srcCv.width; cv.height=srcCv.height;
      ctx=cv.getContext("2d");
      var d=s.dir;
      if(d==="h"){ ctx.translate(cv.width,0); ctx.scale(-1,1); }
      else if(d==="v"){ ctx.translate(0,cv.height); ctx.scale(1,-1); }
      else if(d==="b"){ ctx.translate(cv.width,cv.height); ctx.scale(-1,-1); }
      ctx.drawImage(srcCv,0,0);
      return cv;
    }
    cv.width=srcCv.width; cv.height=srcCv.height;
    cv.getContext("2d").drawImage(srcCv,0,0);
    return cv;
  }

  /* ---------- render ---------- */
  function renderGauge(pos,label,legend){
    gLabel.textContent=label;
    gSegs.innerHTML='<i style="width:25%;background:#C40000"></i><i style="width:25%;background:#C9C9C0"></i><i style="width:25%;background:#6E86FF"></i><i style="width:25%;background:#0033FF"></i>';
    gMark.style.left=clamp(pos,0,100)+"%";
    gLegend.innerHTML=legend.map(function(it){
      return '<span><i class="sw" style="background:'+it.c+'"></i>'+it.l+'<b>'+it.v+'</b></span>';
    }).join('');
  }
  function stdLegend(){
    return [
      {c:"#C40000",l:"MIN",v:"0"},{c:"#C9C9C0",l:"LOW",v:"33%"},
      {c:"#6E86FF",l:"HIGH",v:"66%"},{c:"#0033FF",l:"MAX",v:"100%"}
    ];
  }

  function renderPreview(){
    if(!srcReady){
      visCap.textContent="LOAD AN IMAGE TO BEGIN";
      return;
    }
    var t=activeTool.id, s=state[t];
    var out;
    if(t==="resizer"||t==="cropper"||t==="rotate"||t==="flip"){
      out=geomCanvas();
    } else {
      out=document.createElement("canvas");
      out.width=srcCv.width; out.height=srcCv.height;
      var ctx=out.getContext("2d");
      ctx.drawImage(srcCv,0,0);
      var img=ctx.getImageData(0,0,out.width,out.height);
      var d=img.data;
      if(t==="blur") blurData(d,out.width,out.height,parseFloat(s.r)||0);
      if(t==="sharpen") sharpenData(d,out.width,out.height,parseFloat(s.amt)||0);
      if(t==="brightness") brightnessData(d,parseFloat(s.amt)||100);
      if(t==="contrast") contrastData(d,parseFloat(s.amt)||100);
      if(t==="saturation") saturationData(d,parseFloat(s.amt)||100);
      if(t==="grayscale") grayscaleData(d,parseFloat(s.amt)||100);
      if(t==="sepia") sepiaData(d,parseFloat(s.amt)||100);
      ctx.putImageData(img,0,0);
    }
    pvCanvas.width=out.width;
    pvCanvas.height=out.height;
    pvCtx.clearRect(0,0,out.width,out.height);
    pvCtx.drawImage(out,0,0);
    visCap.textContent=out.width+" × "+out.height+" PX · "+activeTool.name.toUpperCase()+" · EXPORT WITH THE BUTTONS BELOW";

    var pos=50;
    if(t==="blur") pos=clamp((parseFloat(s.r)||0)/20*100,0,100);
    if(t==="sharpen") pos=parseFloat(s.amt)||0;
    if(t==="brightness") pos=clamp((parseFloat(s.amt)||100)/200*100,0,100);
    if(t==="contrast") pos=clamp((parseFloat(s.amt)||100)/200*100,0,100);
    if(t==="saturation") pos=clamp((parseFloat(s.amt)||100)/300*100,0,100);
    if(t==="grayscale") pos=parseFloat(s.amt)||0;
    if(t==="sepia") pos=parseFloat(s.amt)||0;
    if(t==="rotate") pos=clamp((parseFloat(s.angle)||0)/345*100,0,100);
    if(t==="cropper") pos=clamp((parseFloat(s.w)||80),0,100);
    if(t==="resizer") pos=clamp((parseInt(s.w,10)||srcCv.width)/4000*100,0,100);
    if(t==="flip") pos=s.dir==="b"?90:s.dir==="v"?60:30;
    renderGauge(pos,activeTool.name.toUpperCase()+" — "+out.width+" × "+out.height+" PX",stdLegend());
  }
  function scheduleRender(){
    if(raf) return;
    raf=requestAnimationFrame(function(){ raf=null; renderPreview(); });
  }

  /* ---------- form ---------- */
  function sliderField(k,label,min,max,step,unit){
    var id="fld-"+activeTool.id+"-"+k;
    var val=state[activeTool.id][k];
    return '<div class="field"><label class="f-label" for="'+id+'">'+label+' — <span class="f-val" id="val-'+id+'">'+val+(unit||"")+'</span></label>'
      +'<input class="f-input" id="'+id+'" data-k="'+k+'" type="range" min="'+min+'" max="'+max+'" step="'+(step||1)+'" value="'+val+'"></div>';
  }
  function numField(k,label){
    var id="fld-"+activeTool.id+"-"+k;
    var val=state[activeTool.id][k];
    return '<div class="field"><label class="f-label" for="'+id+'">'+label+'</label>'
      +'<input class="f-input" id="'+id+'" data-k="'+k+'" type="number" min="1" max="4000" value="'+(val!=null?val:"")+'"></div>';
  }
  function checkField(k,label){
    var id="fld-"+activeTool.id+"-"+k;
    var on=state[activeTool.id][k]==="1";
    return '<div class="field f-check-row"><input id="'+id+'" data-k="'+k+'" type="checkbox"'+(on?" checked":"")+'>'
      +'<label class="f-label" for="'+id+'">'+label+'</label></div>';
  }
  function segField(k,label,opts){
    var val=state[activeTool.id][k];
    return '<div class="field full"><span class="f-label">'+label+'</span><div class="seg" data-k="'+k+'" role="group" aria-label="'+label+'">'
      +opts.map(function(o){ return '<button type="button" data-v="'+o[0]+'"'+(val===o[0]?' class="on"':'')+'>'+o[1]+'</button>'; }).join('')
      +'</div></div>';
  }

  function renderForm(){
    var t=activeTool.id, html="";
    if(t==="resizer"){
      html=numField("w","Width (px)")+numField("h","Height (px)")
        +'<div class="field full"></div>'+checkField("lock","Lock aspect ratio");
    } else if(t==="cropper"){
      html=sliderField("x","X offset",0,95,1,"%")+sliderField("y","Y offset",0,95,1,"%")
        +sliderField("w","Width",5,100,1,"%")+sliderField("h","Height",5,100,1,"%");
    } else if(t==="rotate"){
      html='<div class="field full">'+sliderField("angle","Angle",0,345,15,"°")+'</div>';
    } else if(t==="flip"){
      html=segField("dir","Flip direction",[["none","None"],["h","Horizontal"],["v","Vertical"],["b","Both"]]);
    } else if(t==="blur"){
      html='<div class="field full">'+sliderField("r","Blur radius",0,20,1," px")+'</div>';
    } else if(t==="sharpen"){
      html='<div class="field full">'+sliderField("amt","Sharpen amount",0,100,5,"%")+'</div>';
    } else if(t==="brightness"){
      html='<div class="field full">'+sliderField("amt","Brightness",0,200,5,"%")+'</div>';
    } else if(t==="contrast"){
      html='<div class="field full">'+sliderField("amt","Contrast",0,200,5,"%")+'</div>';
    } else if(t==="saturation"){
      html='<div class="field full">'+sliderField("amt","Saturation",0,300,10,"%")+'</div>';
    } else if(t==="grayscale"){
      html='<div class="field full">'+sliderField("amt","Amount",0,100,5,"%")+'</div>';
    } else if(t==="sepia"){
      html='<div class="field full">'+sliderField("amt","Amount",0,100,5,"%")+'</div>';
    }
    formEl.innerHTML='<div class="f-grid">'+html+'</div>';
  }

  function renderTabs(){
    tabsEl.innerHTML=TOOLS.map(function(t){
      return '<button type="button" class="t-tab'+(t===activeTool?' on':'')+'" data-tool="'+t.id+'" role="tab" aria-selected="'+(t===activeTool)+'">'+t.tab+'</button>';
    }).join('');
  }

  function selectTool(id){
    var t=TOOLS.filter(function(x){return x.id===id;})[0];
    if(!t) return;
    activeTool=t;
    state[t.id]=t.def();
    if(t.id==="resizer"&&srcReady){
      state.resizer.w=String(srcCv.width);
      state.resizer.h=String(srcCv.height);
    }
    renderTabs(); renderForm(); renderPreview();
  }

  tabsEl.addEventListener("click", function(e){
    var b=e.target.closest(".t-tab"); if(!b) return;
    selectTool(b.getAttribute("data-tool"));
  });

  formEl.addEventListener("input", function(e){
    var k=e.target.getAttribute("data-k"); if(!k) return;
    var s=state[activeTool.id];
    s[k]=e.target.type==="checkbox"?(e.target.checked?"1":""):e.target.value;
    if(activeTool.id==="resizer"&&s.lock==="1"&&srcReady){
      var aspect=srcCv.width/srcCv.height;
      if(k==="w"){ var w=parseInt(s.w,10)||srcCv.width; s.h=String(Math.round(w/aspect)); }
      if(k==="h"){ var h=parseInt(s.h,10)||srcCv.height; s.w=String(Math.round(h*aspect)); }
      renderForm();
    }
    if(e.target.type==="range"){
      var f=activeTool.fields?null:null;
      var out=$("#val-fld-"+activeTool.id+"-"+k);
      if(out){
        var unit=e.target.max==="345"?"°":(e.target.max==="20"&&k==="r"?" px":"%");
        if(k==="lock"||k==="angle") unit="°";
        if(k==="r") unit=" px";
        out.textContent=e.target.value+unit;
      }
    }
    scheduleRender();
  });
  formEl.addEventListener("click", function(e){
    var b=e.target.closest(".seg button"); if(!b) return;
    state[activeTool.id][b.closest(".seg").getAttribute("data-k")]=b.getAttribute("data-v");
    renderForm(); scheduleRender();
  });

  /* ---------- upload ---------- */
  var dropzone=$("#dropzone"), fileInput=$("#file-input"), dzText=$("#dz-text");
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
    if(activeTool.id==="resizer"&&srcReady){
      state.resizer.w=String(srcCv.width);
      state.resizer.h=String(srcCv.height);
    }
    renderForm(); renderPreview();
  });

  $("#btn-download").addEventListener("click", function(){
    if(!srcReady){ flash($("#btn-download"),"LOAD AN IMAGE FIRST",true); return; }
    var a=document.createElement("a");
    a.href=pvCanvas.toDataURL("image/png");
    a.download="IrisTool-"+activeTool.id+".png";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    flash($("#btn-download"),"PNG SAVED ✓");
  });

  $("#btn-copy").addEventListener("click", function(){
    if(!srcReady){ flash($("#btn-copy"),"LOAD AN IMAGE FIRST",true); return; }
    function fallback(){ flash($("#btn-copy"),"USE DOWNLOAD",true); }
    if(pvCanvas.toBlob && window.ClipboardItem && navigator.clipboard && navigator.clipboard.write){
      pvCanvas.toBlob(function(blob){
        if(!blob){ fallback(); return; }
        navigator.clipboard.write([new ClipboardItem({"image/png":blob})]).then(
          function(){ flash($("#btn-copy"),"PNG COPIED ✓"); },
          fallback
        );
      },"image/png");
    } else fallback();
  });

  /* guide "runs in the editor above" jumps */
  $$(".tool-here").forEach(function(btn){
    btn.addEventListener("click", function(){
      selectTool(btn.getAttribute("data-go"));
      $("#analyzer").scrollIntoView({behavior:reduceMotion?"auto":"smooth"});
    });
  });

  /* ---- boot: load built-in sample ---- */
  renderTabs(); renderForm();
  loadImageURL(DEMO_URL);
  dzText.textContent="SAMPLE IMAGE LOADED — DROP YOUR OWN ANYTIME";
})();
