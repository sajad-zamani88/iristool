
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
     LIVE DESIGN GENERATORS (2 tools)
     ================================================================ */
  function clamp(v,a,b){ return Math.min(b,Math.max(a,v)); }
  function rnd(n){ return Math.floor(Math.random()*n); }
  function pick(a){ return a[rnd(a.length)]; }
  function pad2(n){ return String(n).padStart(2,"0"); }

  /* ---------- color math ---------- */
  function hexRgb(hex){
    var h=String(hex).replace("#","");
    if(h.length===3) h=h.split("").map(function(c){ return c+c; }).join("");
    var n=parseInt(h,16);
    return [(n>>16)&255,(n>>8)&255,n&255];
  }
  function rgbHex(r,g,b){
    return "#"+[r,g,b].map(function(c){ return clamp(Math.round(c),0,255).toString(16).padStart(2,"0"); }).join("").toUpperCase();
  }
  function hexToHsl(hex){
    var c=hexRgb(hex), r=c[0]/255, g=c[1]/255, b=c[2]/255;
    var mx=Math.max(r,g,b), mn=Math.min(r,g,b), h=0, s=0, l=(mx+mn)/2;
    if(mx!==mn){
      var d=mx-mn;
      s=l>0.5?d/(2-mx-mn):d/(mx+mn);
      if(mx===r) h=(g-b)/d+(g<b?6:0);
      else if(mx===g) h=(b-r)/d+2;
      else h=(r-g)/d+4;
      h*=60;
    }
    return [h,s*100,l*100];
  }
  function hslToHex(h,s,l){
    h=((h%360)+360)%360; s=clamp(s,0,100)/100; l=clamp(l,0,100)/100;
    var c=(1-Math.abs(2*l-1))*s, x=c*(1-Math.abs((h/60)%2-1)), m=l-c/2, r=0,g=0,b=0;
    if(h<60){r=c;g=x;} else if(h<120){r=x;g=c;} else if(h<180){g=c;b=x;}
    else if(h<240){g=x;b=c;} else if(h<300){r=x;b=c;} else {r=c;b=x;}
    return rgbHex((r+m)*255,(g+m)*255,(b+m)*255);
  }
  function lum(hex){
    var c=hexRgb(hex);
    return (0.2126*c[0]+0.7152*c[1]+0.0722*c[2])/255;
  }
  function randHex(){
    return rgbHex(rnd(256),rnd(256),rnd(256));
  }

  /* ---------- palette ---------- */
  function makePalette(base,harmony){
    var hsl=hexToHsl(base), h=hsl[0], s=Math.max(hsl[1],35), l=hsl[2];
    if(l<20) l=38; if(l>80) l=62;
    function H(hh,ss,ll){ return hslToHex(hh,clamp(ss,8,100),clamp(ll,8,92)); }
    var out;
    switch(harmony){
      case "complementary":
        out=[H(h,s,l), H(h,s,l+14), H(h,s,l-14), H(h+180,s,l), H(h+180,s,l+14)]; break;
      case "triadic":
        out=[H(h,s,l), H(h+120,s,l), H(h+240,s,l), H(h+120,s,l+14), H(h+240,s,l-12)]; break;
      case "mono":
        out=[H(h,s,l-26), H(h,s,l-13), H(h,s,l), H(h,s*0.8,l+13), H(h,s*0.6,l+26)]; break;
      case "random":
        out=[];
        for(var i=0;i<5;i++) out.push(H(rnd(360),55+rnd(35),35+rnd(30)));
        break;
      default: /* analogous */
        out=[H(h,s,l), H(h-25,s,l+8), H(h+25,s,l-8), H(h-50,s*0.8,l+16), H(h+50,s*0.9,l-16)];
    }
    return out;
  }
  function paletteCSS(colors){
    var lines=["/* IrisTool · Color Palette Generator */",":root{"];
    colors.forEach(function(c,i){ lines.push("  --palette-"+(i+1)+": "+c+";"); });
    lines.push("}");
    return lines.join("\n");
  }
  function renderPalette(colors){
    var html='<div class="pal-row">';
    colors.forEach(function(c){
      var rgb=hexRgb(c);
      var txt=lum(c)>0.55?"#141414":"#FFFFFF";
      html+='<div class="pal-cell" data-hex="'+c+'" style="background:'+c+';color:'+txt+'" title="Click to copy '+c+'">'
          +'<span class="pal-hex">'+c+'</span>'
          +'<span class="pal-rgb">rgb('+rgb[0]+', '+rgb[1]+', '+rgb[2]+')</span>'
          +'</div>';
    });
    html+='</div>';
    pv.innerHTML=html;
  }

  /* ---------- favicon ---------- */
  var GLYPHS=["✱","◆","▲","●","★","✦","⬢","✚","◈","❖"];
  function drawFavicon(s){
    var cv=document.createElement("canvas");
    cv.width=64; cv.height=64;
    var ctx=cv.getContext("2d");
    ctx.clearRect(0,0,64,64);
    ctx.fillStyle=s.bg;
    if(s.shape==="circle"){
      ctx.beginPath(); ctx.arc(32,32,32,0,Math.PI*2); ctx.fill();
    } else if(s.shape==="rounded"){
      var r=14;
      ctx.beginPath();
      ctx.moveTo(r,0);
      ctx.lineTo(64-r,0); ctx.arcTo(64,0,64,r,r);
      ctx.lineTo(64,64-r); ctx.arcTo(64,64,64-r,64,r);
      ctx.lineTo(r,64); ctx.arcTo(0,64,0,64-r,r);
      ctx.lineTo(0,r); ctx.arcTo(0,0,r,0,r);
      ctx.closePath(); ctx.fill();
    } else {
      ctx.fillRect(0,0,64,64);
    }
    var glyph=s.glyph||"✱";
    ctx.fillStyle=s.fg;
    ctx.font="700 "+clamp(parseInt(s.size,10)||40,12,60)+"px 'Space Grotesk', system-ui, sans-serif";
    ctx.textAlign="center";
    ctx.textBaseline="middle";
    ctx.fillText(glyph,32,34);
    return cv.toDataURL("image/png");
  }
  function renderFaviconPreview(url){
    pv.innerHTML=
      '<div class="fav-row">'
      +'<div class="fav-item"><img src="'+url+'" width="128" height="128" alt="Favicon 64px preview"><span>64 px</span></div>'
      +'<div class="fav-item"><img src="'+url+'" width="64" height="64" alt="Favicon 32px preview"><span>32 px</span></div>'
      +'<div class="fav-item"><img src="'+url+'" width="32" height="32" alt="Favicon 16px preview"><span>16 px</span></div>'
      +'</div>';
  }
  function faviconSnippet(s){
    return "/* IrisTool · Favicon Generator */\n"
      +"<link rel=\"icon\" type=\"image/png\" href=\"favicon-64.png\">\n"
      +"<!-- glyph \""+(s.glyph||"✱")+"\" · "+s.fg+" on "+s.bg+" · "+s.shape+" · font "+s.size+"px -->";
  }

  /* ---------------- tool registry ---------------- */
  var TOOLS=[
    { id:"palette", tab:"Palette", name:"Color Palette Generator",
      def:function(){ return {base:"#0033FF",harmony:"analogous"}; },
      fields:[
        {k:"base",label:"Base color",type:"color"},
        {k:"harmony",label:"Harmony",type:"select",opts:[
          ["analogous","Analogous — neighbours"],
          ["complementary","Complementary — opposite"],
          ["triadic","Triadic — triangle"],
          ["mono","Monochromatic — one hue"],
          ["random","Random — surprise me"]]}
      ] },
    { id:"favicon", tab:"FavIcon", name:"FavIcon Generator",
      def:function(){ return {glyph:"✱",bg:"#0033FF",fg:"#FFFFFF",size:"40",shape:"rounded"}; },
      fields:[
        {k:"glyph",label:"Glyph — letter, symbol or emoji",type:"text"},
        {k:"shape",label:"Shape",type:"select",opts:[["square","Square"],["rounded","Rounded"],["circle","Circle"]]},
        {k:"bg",label:"Background",type:"color"},
        {k:"fg",label:"Glyph color",type:"color"},
        {k:"size",label:"Font size",type:"range",min:16,max:60,unit:"px"}
      ] }
  ];

  var state={};
  TOOLS.forEach(function(t){ state[t.id]=t.def(); });
  var activeTool=TOOLS[0];
  var lastCSS="";
  var lastPalette=[];
  var lastFavUrl="";

  var tabsEl=$("#t-tabs"), formEl=$("#calc-form");
  var pv=$("#pv"), cssOut=$("#css-out");
  var gSegs=$("#g-segs"), gMark=$("#g-mark"), gLegend=$("#g-legend"), gLabel=$("#gauge-label");
  var QUART=["#EFEFE9","#C9C9C0","#6E86FF","#0033FF"];
  var btnGen=$("#btn-gen"), btnCopy=$("#btn-copy"), btnDl=$("#btn-download");

  function setBtnLabels(){
    if(activeTool.id==="favicon"){
      btnCopy.textContent="⧉ Copy PNG";
      btnCopy.title="Copy the favicon image to the clipboard";
      btnDl.textContent="↓ Download .png";
      btnDl.title="Download the favicon as favicon-64.png";
    } else {
      btnCopy.textContent="⧉ Copy CSS";
      btnCopy.title="Copy the palette as CSS custom properties";
      btnDl.textContent="↓ Download .css";
      btnDl.title="Download the palette as a .css file";
    }
  }

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
    } else if(f.type==="select"){
      lab='<label class="f-label" for="'+id+'">'+f.label+'</label>';
      ctrl='<select class="f-select" id="'+id+'" data-k="'+f.k+'">'+f.opts.map(function(o){
        return '<option value="'+o[0]+'"'+(val===o[0]?' selected':'')+'>'+o[1]+'</option>';
      }).join('')+'</select>';
    } else {
      lab='<label class="f-label" for="'+id+'">'+f.label+'</label>';
      ctrl='<input class="f-input" id="'+id+'" data-k="'+f.k+'" type="'+f.type+'" value="'+val.replace(/"/g,"&quot;")+'" maxlength="8">';
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
    var segHTML="";
    if(g.segs){
      g.segs.forEach(function(sg){ segHTML+='<i style="width:'+sg.w+'%;background:'+sg.c+'"></i>'; });
    } else {
      segHTML='<i style="width:25%;background:'+QUART[0]+'"></i><i style="width:25%;background:'+QUART[1]+'"></i><i style="width:25%;background:'+QUART[2]+'"></i><i style="width:25%;background:'+QUART[3]+'"></i>';
    }
    gSegs.innerHTML=segHTML;
    gMark.style.left=clamp(g.pos,0,100)+"%";
    var legHTML="";
    g.legend.forEach(function(it){
      legHTML+='<span><i class="sw" style="background:'+it.c+'"></i>'+it.l+'<b>'+it.v+'</b></span>';
    });
    gLegend.innerHTML=legHTML;
  }

  function generateAll(){
    if(activeTool.id==="palette"){
      var s=state.palette;
      lastPalette=makePalette(s.base,s.harmony);
      lastCSS=paletteCSS(lastPalette);
      renderPalette(lastPalette);
      cssOut.textContent=lastCSS;
      var hsl=hexToHsl(s.base);
      renderGauge({
        pos:hsl[0]/360*100,
        label:"BASE HUE "+Math.round(hsl[0])+"° · HARMONY: "+s.harmony.toUpperCase(),
        segs:[
          {c:"#FF3B30",w:8.3},{c:"#FF9500",w:8.3},{c:"#FFCC00",w:8.3},
          {c:"#34C759",w:8.4},{c:"#00C7BE",w:8.3},{c:"#007AFF",w:8.3},
          {c:"#5856D6",w:8.4},{c:"#AF52DE",w:8.3},{c:"#FF2D55",w:8.4},{c:"#E4E4DC",w:25}
        ],
        legend:[
          {c:"#FF3B30",l:"RED",v:"0°"},{c:"#34C759",l:"GREEN",v:"120°"},
          {c:"#007AFF",l:"BLUE",v:"240°"},{c:"#FF2D55",l:"WRAP",v:"360°"}
        ]
      });
    } else {
      var f=state.favicon;
      lastFavUrl=drawFavicon(f);
      lastCSS=faviconSnippet(f);
      renderFaviconPreview(lastFavUrl);
      cssOut.textContent=lastCSS;
      renderGauge({
        pos:(parseInt(f.size,10)-16)/44*100,
        label:"FAVICON — GLYPH \""+(f.glyph||"✱")+"\" · "+f.shape.toUpperCase()+" · "+f.size+"PX FONT · 64×64 PNG",
        segs:null,
        legend:[
          {c:QUART[0],l:"SMALL",v:"16–27px"},{c:QUART[1],l:"MID",v:"27–38px"},
          {c:QUART[2],l:"LARGE",v:"38–49px"},{c:QUART[3],l:"MAX",v:"49–60px"}
        ]
      });
    }
  }

  function selectTool(id){
    var t=TOOLS.filter(function(x){return x.id===id;})[0];
    if(!t) return;
    activeTool=t;
    renderTabs(); renderForm(); setBtnLabels(); generateAll();
  }

  tabsEl.addEventListener("click", function(e){
    var b=e.target.closest(".t-tab"); if(!b) return;
    selectTool(b.getAttribute("data-tool"));
  });

  formEl.addEventListener("input", function(e){
    var k=e.target.getAttribute("data-k"); if(!k) return;
    state[activeTool.id][k]=e.target.value;
    if(e.target.type==="range"){
      var f=activeTool.fields.filter(function(x){ return x.k===k; })[0];
      var out=$("#val-fld-"+activeTool.id+"-"+k);
      if(out) out.textContent=e.target.value+(f&&f.unit?f.unit:"");
    }
    generateAll();
  });

  /* click a swatch to copy its hex */
  pv.addEventListener("click", function(e){
    var cell=e.target.closest(".pal-cell"); if(!cell) return;
    var hex=cell.getAttribute("data-hex");
    var label=cell.querySelector(".pal-hex");
    function done(ok){
      if(label){
        var old=hex;
        label.textContent=ok?"COPIED ✓":"COPY FAILED";
        setTimeout(function(){ label.textContent=old; },1200);
      }
    }
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(hex).then(function(){ done(true); },function(){ done(false); });
    } else {
      var ta=document.createElement("textarea");
      ta.value=hex; ta.style.position="fixed"; ta.style.left="-9999px";
      document.body.appendChild(ta); ta.select();
      var ok=false; try{ ok=document.execCommand("copy"); }catch(err){}
      document.body.removeChild(ta);
      done(ok);
    }
  });

  /* randomize per tool */
  btnGen.addEventListener("click", function(){
    if(activeTool.id==="palette"){
      var s=state.palette;
      s.base=randHex();
      s.harmony=pick(["analogous","complementary","triadic","mono","random"]);
    } else {
      var f=state.favicon;
      f.glyph=pick(GLYPHS);
      var dark=Math.random()<0.5;
      f.bg=dark?randHex():randHex();
      f.fg=dark?"#FFFFFF":"#141414";
      f.shape=pick(["square","rounded","circle"]);
      f.size=String(24+rnd(36));
    }
    renderForm(); generateAll();
  });

  /* copy — CSS for palette, PNG for favicon */
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

  btnCopy.addEventListener("click", function(){
    if(activeTool.id==="favicon"){
      if(!lastFavUrl){ flash(btnCopy,"NOTHING TO COPY",true); return; }
      var img=new Image();
      img.onload=function(){
        var cv=document.createElement("canvas");
        cv.width=64; cv.height=64;
        cv.getContext("2d").drawImage(img,0,0,64,64);
        if(cv.toBlob && window.ClipboardItem && navigator.clipboard && navigator.clipboard.write){
          cv.toBlob(function(blob){
            if(!blob){ flash(btnCopy,"USE DOWNLOAD",true); return; }
            navigator.clipboard.write([new ClipboardItem({"image/png":blob})]).then(
              function(){ flash(btnCopy,"PNG COPIED ✓"); },
              function(){ flash(btnCopy,"USE DOWNLOAD",true); }
            );
          },"image/png");
        } else flash(btnCopy,"USE DOWNLOAD",true);
      };
      img.onerror=function(){ flash(btnCopy,"USE DOWNLOAD",true); };
      img.src=lastFavUrl;
      return;
    }
    if(!lastCSS){ flash(btnCopy,"NOTHING TO COPY",true); return; }
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(lastCSS).then(
        function(){ flash(btnCopy,"CSS COPIED ✓"); },
        function(){ fallbackCopyText(); }
      );
    } else fallbackCopyText();
    function fallbackCopyText(){
      var ta=document.createElement("textarea");
      ta.value=lastCSS; ta.style.position="fixed"; ta.style.left="-9999px";
      document.body.appendChild(ta); ta.select();
      var ok=false; try{ ok=document.execCommand("copy"); }catch(err){}
      document.body.removeChild(ta);
      flash(btnCopy, ok?"CSS COPIED ✓":"USE CTRL+C", !ok);
    }
  });

  /* download — .css for palette, .png for favicon */
  btnDl.addEventListener("click", function(){
    var a=document.createElement("a");
    if(activeTool.id==="favicon"){
      if(!lastFavUrl){ flash(btnDl,"NOTHING TO SAVE",true); return; }
      a.href=lastFavUrl;
      a.download="favicon-64.png";
    } else {
      if(!lastCSS){ flash(btnDl,"NOTHING TO SAVE",true); return; }
      var blob=new Blob([lastCSS],{type:"text/css;charset=utf-8"});
      a.href=URL.createObjectURL(blob);
      a.download="IrisTool-palette.css";
    }
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    flash(btnDl,"SAVED ✓");
  });

  $("#btn-reset").addEventListener("click", function(){
    state[activeTool.id]=activeTool.def();
    renderForm(); generateAll();
  });

  /* guide "runs in the generator above" jumps */
  $$(".tool-here").forEach(function(btn){
    btn.addEventListener("click", function(){
      selectTool(btn.getAttribute("data-go"));
      $("#analyzer").scrollIntoView({behavior:reduceMotion?"auto":"smooth"});
    });
  });

  /* ---- boot ---- */
  renderTabs(); renderForm(); setBtnLabels(); generateAll();
})();
