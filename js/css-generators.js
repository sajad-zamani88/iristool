
(function(){
  "use strict";
  var $  = function(s,c){ return (c||document).querySelector(s); };
  var $$ = function(s,c){ return Array.prototype.slice.call((c||document).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var FILTER_IMG = "https://image.qwenlm.ai/public_source/3da5e8c9-fe02-4bd0-bb7d-d0d86ddd1de7/176bd0cc9-5fc1-452b-84e3-7adce3692d6a.png";

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
     LIVE CSS GENERATORS (5 tools)
     ================================================================ */
  function clamp(v,a,b){ return Math.min(b,Math.max(a,v)); }
  function rnd(n){ return Math.floor(Math.random()*n); }
  function pick(a){ return a[rnd(a.length)]; }
  function num(v){ var n=parseFloat(v); return isFinite(n)?n:0; }
  function hexRgb(h){
    h=String(h).replace("#","");
    if(h.length===3) h=h.split("").map(function(c){ return c+c; }).join("");
    var n=parseInt(h,16);
    return [ (n>>16)&255, (n>>8)&255, n&255 ];
  }
  function randHex(){
    return "#"+[0,0,0].map(function(){ return rnd(256).toString(16).padStart(2,"0"); }).join("").toUpperCase();
  }

  var CLIP_SHAPES={
    circle:{label:"Circle",css:"circle(45% at 50% 50%)"},
    ellipse:{label:"Ellipse",css:"ellipse(45% 35% at 50% 50%)"},
    triangle:{label:"Triangle",css:"polygon(50% 5%, 95% 95%, 5% 95%)"},
    trapezoid:{label:"Trapezoid",css:"polygon(20% 15%, 80% 15%, 100% 100%, 0 100%)"},
    pentagon:{label:"Pentagon",css:"polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)"},
    hexagon:{label:"Hexagon",css:"polygon(25% 5%, 75% 5%, 100% 50%, 75% 95%, 25% 95%, 0 50%)"},
    star:{label:"Star",css:"polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)"}
  };

  /* ---------------- builders ---------------- */
  function buildGradient(s){
    var stops = s.c1+" 0%, "+(s.c3==="1" ? s.c3c+" 50%, "+s.c2+" 100%" : s.c2+" 100%");
    var bg = s.type==="radial" ? "radial-gradient(circle, "+stops+")" : "linear-gradient("+s.angle+"deg, "+stops+")";
    return {
      css:"/* IrisTool · CSS Gradient Generator */\nbackground: "+bg+";",
      apply:function(pv){ pv.style.background=bg; pv.style.borderRadius="14px"; },
      gauge:{pos:(s.type==="radial"?50:s.angle/360*100),
        label:"GRADIENT — "+s.type.toUpperCase()+" · "+(s.type==="radial"?"CIRCLE":s.angle+"°")+" · "+(s.c3==="1"?"3":"2")+" STOPS"}
    };
  }
  function buildShadow(s){
    var c=hexRgb(s.color), a=(num(s.alpha)/100).toFixed(2);
    var inset=s.inset==="1"?"inset ":"";
    var val=inset+s.x+"px "+s.y+"px "+s.blur+"px "+s.spread+"px rgba("+c[0]+", "+c[1]+", "+c[2]+", "+a+")";
    return {
      css:"/* IrisTool · Box Shadow Generator */\nbox-shadow: "+val+";",
      apply:function(pv){ pv.style.background="#fff"; pv.style.borderRadius="14px"; pv.style.boxShadow=val; },
      gauge:{pos:num(s.blur)/100*100,
        label:"SHADOW — "+s.x+" "+s.y+" "+s.blur+" "+s.spread+" · "+(s.inset==="1"?"INSET":"OUTSET")}
    };
  }
  function buildRadius(s){
    var val = s.circle==="1" ? "50%" : s.tl+"px "+s.tr+"px "+s.br+"px "+s.bl+"px";
    var avg=(num(s.tl)+num(s.tr)+num(s.br)+num(s.bl))/4;
    return {
      css:"/* IrisTool · Border Radius Generator */\nborder-radius: "+val+";",
      apply:function(pv){ pv.style.background="linear-gradient(135deg, #0033FF 0%, #6E86FF 100%)"; pv.style.borderRadius=val; },
      gauge:{pos:(s.circle==="1"?100:avg/100*100),
        label:"RADIUS — "+(s.circle==="1"?"50% CIRCLE":val)}
    };
  }
  function buildClip(s){
    var shape=CLIP_SHAPES[s.shape]||CLIP_SHAPES.pentagon;
    var idx=Object.keys(CLIP_SHAPES).indexOf(s.shape);
    return {
      css:"/* IrisTool · CSS Clip Path Generator */\nclip-path: "+shape.css+";",
      apply:function(pv){ pv.style.background="linear-gradient(160deg, #0033FF 0%, #C40000 100%)"; pv.style.clipPath=shape.css; pv.style.borderRadius="0"; },
      gauge:{pos:(idx+1)/7*100, label:"SHAPE — "+shape.label.toUpperCase()}
    };
  }
  function buildFilter(s){
    var parts=[];
    if(num(s.blur)>0) parts.push("blur("+s.blur+"px)");
    if(num(s.brightness)!==100) parts.push("brightness("+s.brightness+"%)");
    if(num(s.contrast)!==100) parts.push("contrast("+s.contrast+"%)");
    if(num(s.saturate)!==100) parts.push("saturate("+s.saturate+"%)");
    if(num(s.grayscale)>0) parts.push("grayscale("+s.grayscale+"%)");
    if(num(s.sepia)>0) parts.push("sepia("+s.sepia+"%)");
    if(num(s.hue)!==0) parts.push("hue-rotate("+s.hue+"deg)");
    if(num(s.invert)>0) parts.push("invert("+s.invert+"%)");
    if(num(s.opacity)!==100) parts.push("opacity("+s.opacity+"%)");
    var val=parts.length?parts.join(" "):"none";
    return {
      css:"/* IrisTool · CSS Filter Generator */\nfilter: "+val+";\n-webkit-filter: "+val+";",
      apply:function(pv){
        pv.innerHTML='<img src="'+FILTER_IMG+'" alt="Filter preview">';
        pv.querySelector("img").style.filter=val;
        pv.style.borderRadius="14px";
      },
      gauge:{pos:num(s.blur)/20*100,
        label:"FILTER — "+parts.length+" ACTIVE FUNCTION"+(parts.length===1?"":"S")}
    };
  }

  /* ---------------- randomizers ---------------- */
  function randGradient(s){
    s.type=Math.random()<0.75?"linear":"radial";
    s.angle=String(rnd(24)*15);
    s.c1=randHex(); s.c2=randHex();
    if(s.c3==="1") s.c3c=randHex();
  }
  function randShadow(s){
    s.x=String(rnd(41)-20); s.y=String(rnd(41)-20);
    s.blur=String(rnd(60)); s.spread=String(rnd(31)-15);
    s.color=randHex(); s.alpha=String(10+rnd(60));
  }
  function randRadius(s){
    if(s.circle==="1") return;
    s.tl=String(rnd(100)); s.tr=String(rnd(100));
    s.br=String(rnd(100)); s.bl=String(rnd(100));
  }
  function randClip(s){ s.shape=pick(Object.keys(CLIP_SHAPES)); }
  function randFilter(s){
    s.blur=String(rnd(6));
    s.brightness=String(60+rnd(120));
    s.contrast=String(60+rnd(120));
    s.saturate=String(rnd(250));
    s.grayscale=String(rnd(3)*40);
    s.sepia=String(rnd(3)*35);
    s.hue=String(rnd(361)-180);
    s.invert="0";
    s.opacity="100";
  }

  /* ---------------- tool registry ---------------- */
  var TOOLS=[
    { id:"gradient", tab:"Gradient", name:"CSS Gradient Generator",
      def:function(){ return {type:"linear",angle:"135",c1:"#0033FF",c2:"#6E86FF",c3:"",c3c:"#C40000"}; },
      fields:[
        {k:"type",label:"Type",type:"seg",full:true,opts:[["linear","Linear"],["radial","Radial"]]},
        {k:"angle",label:"Angle",type:"range",min:0,max:360,step:5,unit:"°"},
        {k:"c3",label:"Third stop",type:"check"},
        {k:"c1",label:"Color A",type:"color"},
        {k:"c2",label:"Color B",type:"color"},
        {k:"c3c",label:"Color C (middle)",type:"color"}
      ], build:buildGradient, rand:randGradient },
    { id:"shadow", tab:"Box Shadow", name:"Box Shadow Generator",
      def:function(){ return {x:"8",y:"12",blur:"24",spread:"0",color:"#141414",alpha:"25",inset:""}; },
      fields:[
        {k:"x",label:"Offset X",type:"range",min:-50,max:50,unit:"px"},
        {k:"y",label:"Offset Y",type:"range",min:-50,max:50,unit:"px"},
        {k:"blur",label:"Blur",type:"range",min:0,max:100,unit:"px"},
        {k:"spread",label:"Spread",type:"range",min:-50,max:50,unit:"px"},
        {k:"color",label:"Shadow color",type:"color"},
        {k:"alpha",label:"Alpha",type:"range",min:0,max:100,unit:"%"},
        {k:"inset",label:"Inset shadow",type:"check",full:true}
      ], build:buildShadow, rand:randShadow },
    { id:"radius", tab:"Radius", name:"Border Radius Generator",
      def:function(){ return {tl:"24",tr:"24",br:"24",bl:"24",circle:""}; },
      fields:[
        {k:"tl",label:"Top left",type:"range",min:0,max:100,unit:"px"},
        {k:"tr",label:"Top right",type:"range",min:0,max:100,unit:"px"},
        {k:"br",label:"Bottom right",type:"range",min:0,max:100,unit:"px"},
        {k:"bl",label:"Bottom left",type:"range",min:0,max:100,unit:"px"},
        {k:"circle",label:"Circle (50%)",type:"check",full:true}
      ], build:buildRadius, rand:randRadius },
    { id:"clip", tab:"Clip Path", name:"CSS Clip Path Generator",
      def:function(){ return {shape:"pentagon"}; },
      fields:[
        {k:"shape",label:"Shape",type:"select",full:true,opts:Object.keys(CLIP_SHAPES).map(function(k){ return [k,CLIP_SHAPES[k].label]; })}
      ], build:buildClip, rand:randClip },
    { id:"filter", tab:"Filter", name:"CSS Filter Generator",
      def:function(){ return {blur:"0",brightness:"100",contrast:"100",saturate:"100",grayscale:"0",sepia:"0",hue:"0",invert:"0",opacity:"100"}; },
      fields:[
        {k:"blur",label:"Blur",type:"range",min:0,max:20,unit:"px"},
        {k:"brightness",label:"Brightness",type:"range",min:0,max:200,unit:"%"},
        {k:"contrast",label:"Contrast",type:"range",min:0,max:200,unit:"%"},
        {k:"saturate",label:"Saturate",type:"range",min:0,max:300,unit:"%"},
        {k:"grayscale",label:"Grayscale",type:"range",min:0,max:100,unit:"%"},
        {k:"sepia",label:"Sepia",type:"range",min:0,max:100,unit:"%"},
        {k:"hue",label:"Hue rotate",type:"range",min:-180,max:180,step:5,unit:"°"},
        {k:"invert",label:"Invert",type:"range",min:0,max:100,unit:"%"},
        {k:"opacity",label:"Opacity",type:"range",min:0,max:100,unit:"%"}
      ], build:buildFilter, rand:randFilter }
  ];

  var state={};
  TOOLS.forEach(function(t){ state[t.id]=t.def(); });
  var activeTool=TOOLS[0];
  var lastCSS="";

  var tabsEl=$("#t-tabs"), formEl=$("#calc-form");
  var pv=$("#pv"), cssOut=$("#css-out");
  var gSegs=$("#g-segs"), gMark=$("#g-mark"), gLegend=$("#g-legend"), gLabel=$("#gauge-label");
  var QUART=["#EFEFE9","#C9C9C0","#6E86FF","#0033FF"];

  function fieldHtml(f,s){
    var id="fld-"+activeTool.id+"-"+f.k;
    var val=s[f.k]!=null?s[f.k]:"";
    var lab, ctrl;
    if(f.type==="range"){
      lab='<label class="f-label" for="'+id+'">'+f.label+' — <span class="f-val" id="val-'+id+'">'+val+(f.unit||"")+'</span></label>';
      ctrl='<input class="f-input" id="'+id+'" data-k="'+f.k+'" type="range" min="'+f.min+'" max="'+f.max+'" step="'+(f.step||1)+'" value="'+val+'">';
    } else if(f.type==="color"){
      lab='<label class="f-label" for="'+id+'">'+f.label+'</label>';
      ctrl='<input class="f-input" id="'+id+'" data-k="'+f.k+'" type="color" value="'+val+'">';
    } else if(f.type==="check"){
      lab='<label class="f-label" for="'+id+'">'+f.label+'</label>';
      ctrl='<input class="f-input" id="'+id+'" data-k="'+f.k+'" type="checkbox"'+(val==="1"?" checked":"")+'>';
      return '<div class="field f-check'+(f.full?' full':'')+'">'+ctrl+lab+'</div>';
    } else if(f.type==="select"){
      lab='<label class="f-label" for="'+id+'">'+f.label+'</label>';
      ctrl='<select class="f-select" id="'+id+'" data-k="'+f.k+'">'+f.opts.map(function(o){
        return '<option value="'+o[0]+'"'+(val===o[0]?' selected':'')+'>'+o[1]+'</option>';
      }).join('')+'</select>';
    } else if(f.type==="seg"){
      lab='<span class="f-label">'+f.label+'</span>';
      ctrl='<div class="seg" data-k="'+f.k+'" role="group" aria-label="'+f.label+'">'+f.opts.map(function(o){
        return '<button type="button" data-v="'+o[0]+'"'+(val===o[0]?' class="on"':'')+'>'+o[1]+'</button>';
      }).join('')+'</div>';
    } else {
      lab='<label class="f-label" for="'+id+'">'+f.label+'</label>';
      ctrl='<input class="f-input" id="'+id+'" data-k="'+f.k+'" type="'+f.type+'" value="'+val+'">';
    }
    return '<div class="field'+(f.full?' full':'')+'">'+lab+ctrl+'</div>';
  }

  function renderForm(){
    var t=activeTool, s=state[t.id];
    formEl.innerHTML='<div class="f-grid">'+t.fields.map(function(f){ return fieldHtml(f,s); }).join('')+'</div>';
  }

  function renderTabs(){
    tabsEl.innerHTML=TOOLS.map(function(t){
      return '<button type="button" class="t-tab'+(t===activeTool?' on':'')+'" data-tool="'+t.id+'" role="tab" aria-selected="'+(t===activeTool)+'">'+t.tab+'</button>';
    }).join('');
  }

  function renderGauge(g){
    gLabel.textContent=g.label;
    gSegs.innerHTML='<i style="width:25%;background:'+QUART[0]+'"></i><i style="width:25%;background:'+QUART[1]+'"></i><i style="width:25%;background:'+QUART[2]+'"></i><i style="width:25%;background:'+QUART[3]+'"></i>';
    gMark.style.left=clamp(g.pos,0,100)+"%";
    gLegend.innerHTML=
      '<span><i class="sw" style="background:'+QUART[0]+'"></i>LOW<b>0–25%</b></span>'+
      '<span><i class="sw" style="background:'+QUART[1]+'"></i>MID<b>25–50%</b></span>'+
      '<span><i class="sw" style="background:'+QUART[2]+'"></i>HIGH<b>50–75%</b></span>'+
      '<span><i class="sw" style="background:'+QUART[3]+'"></i>MAX<b>75–100%</b></span>';
  }

  function generateAll(){
    var res=activeTool.build(state[activeTool.id]);
    lastCSS=res.css;
    pv.style.cssText="";
    pv.innerHTML="";
    res.apply(pv);
    cssOut.textContent=res.css;
    renderGauge(res.gauge);
  }

  function selectTool(id){
    var t=TOOLS.filter(function(x){return x.id===id;})[0];
    if(!t) return;
    activeTool=t;
    renderTabs(); renderForm(); generateAll();
  }

  tabsEl.addEventListener("click", function(e){
    var b=e.target.closest(".t-tab"); if(!b) return;
    selectTool(b.getAttribute("data-tool"));
  });

  formEl.addEventListener("input", function(e){
    var k=e.target.getAttribute("data-k"); if(!k) return;
    var el=e.target;
    if(el.type==="checkbox") state[activeTool.id][k]=el.checked?"1":"";
    else state[activeTool.id][k]=el.value;
    if(el.type==="range"){
      var f=activeTool.fields.filter(function(x){ return x.k===k; })[0];
      var out=$("#val-fld-"+activeTool.id+"-"+k);
      if(out) out.textContent=el.value+(f&&f.unit?f.unit:"");
    }
    generateAll();
  });
  formEl.addEventListener("click", function(e){
    var b=e.target.closest(".seg button"); if(!b) return;
    state[activeTool.id][b.closest(".seg").getAttribute("data-k")]=b.getAttribute("data-v");
    renderForm(); generateAll();
  });

  $("#btn-gen").addEventListener("click", function(){
    activeTool.rand(state[activeTool.id]);
    renderForm(); generateAll();
  });

  /* guide "runs in the generator above" jumps */
  $$(".tool-here").forEach(function(btn){
    btn.addEventListener("click", function(){
      selectTool(btn.getAttribute("data-go"));
      $("#analyzer").scrollIntoView({behavior:reduceMotion?"auto":"smooth"});
    });
  });

  /* ---- button feedback helper ---- */
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

  var btnCopy=$("#btn-copy");
  btnCopy.addEventListener("click", function(){
    if(!lastCSS){ flash(btnCopy,"NOTHING TO COPY",true); return; }
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(lastCSS).then(
        function(){ flash(btnCopy,"CSS COPIED ✓"); },
        function(){ fallbackCopyCSS(); }
      );
    } else fallbackCopyCSS();
    function fallbackCopyCSS(){
      var ta=document.createElement("textarea");
      ta.value=lastCSS; ta.style.position="fixed"; ta.style.left="-9999px";
      document.body.appendChild(ta); ta.select();
      var ok=false; try{ ok=document.execCommand("copy"); }catch(err){}
      document.body.removeChild(ta);
      flash(btnCopy, ok?"CSS COPIED ✓":"USE CTRL+C", !ok);
    }
  });

  var btnDl=$("#btn-download");
  btnDl.addEventListener("click", function(){
    if(!lastCSS){ flash(btnDl,"NOTHING TO SAVE",true); return; }
    var blob=new Blob([lastCSS],{type:"text/css;charset=utf-8"});
    var url=URL.createObjectURL(blob);
    var a=document.createElement("a");
    a.href=url; a.download="IrisTool-"+activeTool.id+".css";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function(){ URL.revokeObjectURL(url); },500);
    flash(btnDl,"SAVED ✓");
  });

  $("#btn-reset").addEventListener("click", function(){
    state[activeTool.id]=activeTool.def();
    renderForm(); generateAll();
  });

  /* ---- boot ---- */
  renderTabs(); renderForm(); generateAll();
})();
