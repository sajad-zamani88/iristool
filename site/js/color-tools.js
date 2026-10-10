
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
  $("#primary-nav").addEventListener("click", function(e){
    if (e.target.closest("a")) closeNav();
  });
  $("#nav-close").addEventListener("click", closeNav);

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

  /* ================= COLOR ENGINE ================= */
  var cbControls = $("#cb-controls");
  var cbReadouts = $("#cb-readouts");
  var cbSwatch   = $("#cb-swatch");
  var cbSwatchLabel = $("#cb-swatch-label");
  var cbInLabel  = $("#cb-in-label");
  var cbOutLabel = $("#cb-out-label");
  var cbBadge    = $("#cb-badge");
  var vsBadge    = $("#vs-badge");
  var sl = [$("#sl-1"),$("#sl-2"),$("#sl-3"),$("#sl-4")];
  var sv = [$("#sv-1"),$("#sv-2"),$("#sv-3"),$("#sv-4")];
  var ss = [$("#ss-1"),$("#ss-2"),$("#ss-3"),$("#ss-4")];

  var color = { r:0, g:51, b:255 };
  var grad  = { c1:{r:0,g:51,b:255}, c2:{r:110,g:134,b:255}, angle:135, type:"linear" };
  var state = { mode:"hex-rgb" };

  var MODES = {
    "hex-rgb":  { inLabel:"HEX",    outLabel:"RGB",        glyph:"#R", badge:"TARGET · RGB" },
    "rgb-hex":  { inLabel:"RGB",    outLabel:"HEX",        glyph:"R#", badge:"TARGET · HEX" },
    "rgb-hsl":  { inLabel:"RGB",    outLabel:"HSL",        glyph:"RH", badge:"TARGET · HSL" },
    "hsl-rgb":  { inLabel:"HSL",    outLabel:"RGB",        glyph:"HR", badge:"TARGET · RGB" },
    "hex-cmyk": { inLabel:"HEX",    outLabel:"CMYK",       glyph:"#C", badge:"TARGET · CMYK" },
    "cmyk-hex": { inLabel:"CMYK",   outLabel:"HEX",        glyph:"C#", badge:"TARGET · HEX" },
    "picker":   { inLabel:"PICK",   outLabel:"ALL FORMATS",glyph:"◉",  badge:"EVERY FORMAT" },
    "gradient": { inLabel:"STOPS",  outLabel:"CSS",        glyph:"▧",  badge:"CSS OUTPUT" }
  };

  var PRESETS = ["#0033FF","#6E86FF","#C40000","#141414","#FFB703","#2EC4B6","#E71D36","#8338EC","#06D6A0","#118AB2","#F72585","#FCFCFA"];

  function fmtNum(n){ return n.toLocaleString("en-US"); }
  function escHtml(s){ return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }

  function setStat(el, val){
    val = String(val);
    if (el.textContent !== val){
      el.textContent = val;
      el.classList.remove("bump");
      void el.offsetWidth;
      el.classList.add("bump");
      setTimeout(function(){ el.classList.remove("bump"); }, 200);
    }
  }

  /* ---- color math ---- */
  function hexToRgb(hex){
    hex = String(hex).replace(/^#/, "").trim();
    if (/^[0-9a-fA-F]{3}$/.test(hex)) hex = hex.charAt(0)+hex.charAt(0)+hex.charAt(1)+hex.charAt(1)+hex.charAt(2)+hex.charAt(2);
    if (!/^[0-9a-fA-F]{6}$/.test(hex)) return null;
    return { r:parseInt(hex.substr(0,2),16), g:parseInt(hex.substr(2,2),16), b:parseInt(hex.substr(4,2),16) };
  }
  function rgbToHex(r,g,b){
    function h(v){ return ("0"+Math.round(v).toString(16)).slice(-2).toUpperCase(); }
    return "#" + h(r) + h(g) + h(b);
  }
  function rgbToHsl(r,g,b){
    r/=255; g/=255; b/=255;
    var max=Math.max(r,g,b), min=Math.min(r,g,b);
    var h=0, s=0, l=(max+min)/2;
    if (max !== min){
      var d = max - min;
      s = l > 0.5 ? d/(2-max-min) : d/(max+min);
      if (max === r) h = (g-b)/d + (g < b ? 6 : 0);
      else if (max === g) h = (b-r)/d + 2;
      else h = (r-g)/d + 4;
      h /= 6;
    }
    return { h:Math.round(h*360), s:Math.round(s*100), l:Math.round(l*100) };
  }
  function hslToRgb(h,s,l){
    h/=360; s/=100; l/=100;
    var r,g,b;
    if (s === 0){ r=g=b=l; }
    else {
      var hue2rgb = function(p,q,t){
        if (t<0) t+=1; if (t>1) t-=1;
        if (t<1/6) return p+(q-p)*6*t;
        if (t<1/2) return q;
        if (t<2/3) return p+(q-p)*(2/3-t)*6;
        return p;
      };
      var q = l < 0.5 ? l*(1+s) : l+s-l*s;
      var p = 2*l - q;
      r = hue2rgb(p,q,h+1/3); g = hue2rgb(p,q,h); b = hue2rgb(p,q,h-1/3);
    }
    return { r:Math.round(r*255), g:Math.round(g*255), b:Math.round(b*255) };
  }
  function rgbToCmyk(r,g,b){
    if (r===0 && g===0 && b===0) return { c:0, m:0, y:0, k:100 };
    var c=1-r/255, m=1-g/255, y=1-b/255;
    var k=Math.min(c,m,y);
    c=(c-k)/(1-k); m=(m-k)/(1-k); y=(y-k)/(1-k);
    return { c:Math.round(c*100), m:Math.round(m*100), y:Math.round(y*100), k:Math.round(k*100) };
  }
  function cmykToRgb(c,m,y,k){
    c/=100; m/=100; y/=100; k/=100;
    return { r:Math.round(255*(1-c)*(1-k)), g:Math.round(255*(1-m)*(1-k)), b:Math.round(255*(1-y)*(1-k)) };
  }
  function isLight(r,g,b){ return (0.299*r + 0.587*g + 0.114*b) > 150; }
  function luminance(r,g,b){
    function chan(c){ c/=255; return c<=0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055, 2.4); }
    return 0.2126*chan(r)+0.7152*chan(g)+0.0722*chan(b);
  }

  function currentHex(){ return rgbToHex(color.r,color.g,color.b); }
  function gradientCSS(){
    var c1 = rgbToHex(grad.c1.r,grad.c1.g,grad.c1.b);
    var c2 = rgbToHex(grad.c2.r,grad.c2.g,grad.c2.b);
    if (grad.type === "linear") return "linear-gradient(" + grad.angle + "deg, " + c1 + ", " + c2 + ")";
    return "radial-gradient(circle, " + c1 + ", " + c2 + ")";
  }

  /* ---- track tinting ---- */
  function setTrack(el, css){ el.style.background = css + " center / 100% 4px no-repeat"; }
  function updateRgbTracks(box, r,g,b){
    var rEl = box.querySelector("#ctl-rgb-r"), gEl = box.querySelector("#ctl-rgb-g"), bEl = box.querySelector("#ctl-rgb-b");
    if (!rEl) return;
    setTrack(rEl, "linear-gradient(to right, rgb(0,"+g+","+b+"), rgb(255,"+g+","+b+"))");
    setTrack(gEl, "linear-gradient(to right, rgb("+r+",0,"+b+"), rgb("+r+",255,"+b+"))");
    setTrack(bEl, "linear-gradient(to right, rgb("+r+","+g+",0), rgb("+r+","+g+",255))");
  }
  function updateHslTracks(box, h,s,l){
    var hEl = box.querySelector("#ctl-hsl-h"), sEl = box.querySelector("#ctl-hsl-s"), lEl = box.querySelector("#ctl-hsl-l");
    if (!hEl) return;
    setTrack(hEl, "linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)");
    setTrack(sEl, "linear-gradient(to right, hsl("+h+",0%,"+l+"%), hsl("+h+",100%,"+l+"%))");
    setTrack(lEl, "linear-gradient(to right, hsl("+h+","+s+"%,0%), hsl("+h+","+s+"%,50%), hsl("+h+","+s+"%,100%))");
  }

  /* ---- control builders ---- */
  function sliderRow(id, label, min, max, val){
    return '<div class="cb-slider">' +
      '<label for="' + id + '">' + label + '</label>' +
      '<input type="range" id="' + id + '" min="' + min + '" max="' + max + '" value="' + val + '">' +
      '<span class="cb-num" id="' + id + '-num">' + val + '</span>' +
    '</div>';
  }

  function buildControls(){
    var mode = state.mode;
    cbControls.innerHTML = "";
    var hex = currentHex();

    if (mode === "hex-rgb" || mode === "hex-cmyk"){
      cbControls.innerHTML =
        '<div class="cb-hexfield">' +
          '<input type="color" id="ctl-well" value="' + hex.toLowerCase() + '" aria-label="Color well">' +
          '<input type="text" id="ctl-hex" value="' + hex + '" spellcheck="false" maxlength="7" aria-label="Hex value">' +
        '</div>' +
        '<p class="cb-hint">Type a 3- or 6-digit hex — with or without the #. The swatch and every format follow.</p>';
      wireHex();
    }
    else if (mode === "rgb-hex" || mode === "rgb-hsl"){
      cbControls.innerHTML =
        sliderRow("ctl-rgb-r","R",0,255,color.r) +
        sliderRow("ctl-rgb-g","G",0,255,color.g) +
        sliderRow("ctl-rgb-b","B",0,255,color.b) +
        '<p class="cb-hint">Drag the channels — each track is tinted with the color it makes.</p>';
      wireRgb();
      updateRgbTracks(cbControls, color.r, color.g, color.b);
    }
    else if (mode === "hsl-rgb"){
      var hsl = rgbToHsl(color.r,color.g,color.b);
      cbControls.innerHTML =
        sliderRow("ctl-hsl-h","H",0,360,hsl.h) +
        sliderRow("ctl-hsl-s","S",0,100,hsl.s) +
        sliderRow("ctl-hsl-l","L",0,100,hsl.l) +
        '<p class="cb-hint">Hue, saturation, lightness — the artist\u2019s dials, with live tracks.</p>';
      wireHsl();
      updateHslTracks(cbControls, hsl.h, hsl.s, hsl.l);
    }
    else if (mode === "cmyk-hex"){
      var cmyk = rgbToCmyk(color.r,color.g,color.b);
      cbControls.innerHTML =
        sliderRow("ctl-cmyk-c","C",0,100,cmyk.c) +
        sliderRow("ctl-cmyk-m","M",0,100,cmyk.m) +
        sliderRow("ctl-cmyk-y","Y",0,100,cmyk.y) +
        sliderRow("ctl-cmyk-k","K",0,100,cmyk.k) +
        '<p class="cb-hint">Ink percentages — how a press would mix this color.</p>';
      wireCmyk();
    }
    else if (mode === "picker"){
      cbControls.innerHTML =
        '<div class="cb-bigwell-wrap"><input type="color" id="ctl-bigwell" value="' + hex.toLowerCase() + '" aria-label="Color picker"></div>' +
        '<div class="cb-hexfield"><input type="text" id="ctl-hex" value="' + hex + '" spellcheck="false" maxlength="7" aria-label="Hex value"></div>' +
        sliderRow("ctl-rgb-r","R",0,255,color.r) +
        sliderRow("ctl-rgb-g","G",0,255,color.g) +
        sliderRow("ctl-rgb-b","B",0,255,color.b) +
        '<div class="cb-presets">' + PRESETS.map(function(h){
          return '<button type="button" class="cb-preset" data-hex="' + h + '" style="background:' + h + '" aria-label="' + h + '"></button>';
        }).join("") + '</div>' +
        '<p class="cb-hint">Pick, type, or slide — the presets give you a running start.</p>';
      wirePicker();
      updateRgbTracks(cbControls, color.r, color.g, color.b);
    }
    else if (mode === "gradient"){
      var c1 = rgbToHex(grad.c1.r,grad.c1.g,grad.c1.b);
      var c2 = rgbToHex(grad.c2.r,grad.c2.g,grad.c2.b);
      cbControls.innerHTML =
        '<div class="cb-grad-stops">' +
          '<div class="cb-grad-stop"><span class="cb-gs-label">STOP 1</span>' +
            '<input type="color" id="ctl-g1" value="' + c1.toLowerCase() + '" aria-label="Stop 1 color">' +
            '<input type="text" id="ctl-g1-hex" value="' + c1 + '" maxlength="7" spellcheck="false" aria-label="Stop 1 hex">' +
          '</div>' +
          '<button type="button" class="cb-reverse" id="ctl-reverse" title="Swap stops" aria-label="Swap stops">⇄</button>' +
          '<div class="cb-grad-stop"><span class="cb-gs-label">STOP 2</span>' +
            '<input type="color" id="ctl-g2" value="' + c2.toLowerCase() + '" aria-label="Stop 2 color">' +
            '<input type="text" id="ctl-g2-hex" value="' + c2 + '" maxlength="7" spellcheck="false" aria-label="Stop 2 hex">' +
          '</div>' +
        '</div>' +
        '<div id="ctl-angle-wrap">' + sliderRow("ctl-angle","∠",0,360,grad.angle) + '</div>' +
        '<div class="cb-type-toggle">' +
          '<button type="button" class="cb-type' + (grad.type==="linear"?" cb-type-on":"") + '" data-type="linear">LINEAR</button>' +
          '<button type="button" class="cb-type' + (grad.type==="radial"?" cb-type-on":"") + '" data-type="radial">RADIAL</button>' +
        '</div>' +
        '<p class="cb-hint">Two stops, an angle, a direction — the CSS writes itself.</p>';
      wireGradient();
      applyAngleState();
    }
  }

  function applyAngleState(){
    var wrap = $("#ctl-angle-wrap");
    if (wrap) wrap.classList.toggle("cb-disabled", grad.type === "radial");
  }

  /* ---- control wiring ---- */
  function wireHex(){
    var well = $("#ctl-well"), field = $("#ctl-hex");
    well.addEventListener("input", function(){
      var rgb = hexToRgb(well.value);
      if (rgb){ setColor(rgb); field.value = currentHex(); field.classList.remove("cb-invalid"); }
    });
    field.addEventListener("input", function(){
      var rgb = hexToRgb(field.value);
      if (rgb){ field.classList.remove("cb-invalid"); setColor(rgb); well.value = currentHex().toLowerCase(); }
      else field.classList.add("cb-invalid");
    });
  }

  function wireRgb(){
    ["r","g","b"].forEach(function(){
      var rEl = $("#ctl-rgb-r"), gEl = $("#ctl-rgb-g"), bEl = $("#ctl-rgb-b");
      [rEl,gEl,bEl].forEach(function(el){
        el.addEventListener("input", function(){
          var r=+rEl.value, g=+gEl.value, b=+bEl.value;
          $("#ctl-rgb-r-num").textContent = r;
          $("#ctl-rgb-g-num").textContent = g;
          $("#ctl-rgb-b-num").textContent = b;
          updateRgbTracks(cbControls, r,g,b);
          setColor({r:r,g:g,b:b});
        });
      });
    });
  }

  function wireHsl(){
    var hEl=$("#ctl-hsl-h"), sEl=$("#ctl-hsl-s"), lEl=$("#ctl-hsl-l");
    [hEl,sEl,lEl].forEach(function(el){
      el.addEventListener("input", function(){
        var h=+hEl.value, s=+sEl.value, l=+lEl.value;
        $("#ctl-hsl-h-num").textContent = h + "°";
        $("#ctl-hsl-s-num").textContent = s + "%";
        $("#ctl-hsl-l-num").textContent = l + "%";
        updateHslTracks(cbControls, h,s,l);
        setColor(hslToRgb(h,s,l));
      });
    });
  }

  function wireCmyk(){
    var cEl=$("#ctl-cmyk-c"), mEl=$("#ctl-cmyk-m"), yEl=$("#ctl-cmyk-y"), kEl=$("#ctl-cmyk-k");
    [cEl,mEl,yEl,kEl].forEach(function(el){
      el.addEventListener("input", function(){
        var c=+cEl.value, m=+mEl.value, y=+yEl.value, k=+kEl.value;
        $("#ctl-cmyk-c-num").textContent = c + "%";
        $("#ctl-cmyk-m-num").textContent = m + "%";
        $("#ctl-cmyk-y-num").textContent = y + "%";
        $("#ctl-cmyk-k-num").textContent = k + "%";
        setColor(cmykToRgb(c,m,y,k));
      });
    });
  }

  function wirePicker(){
    var well = $("#ctl-bigwell"), field = $("#ctl-hex");
    well.addEventListener("input", function(){
      var rgb = hexToRgb(well.value);
      if (rgb){ setColor(rgb); syncPickerControls(rgb); field.classList.remove("cb-invalid"); }
    });
    field.addEventListener("input", function(){
      var rgb = hexToRgb(field.value);
      if (rgb){ field.classList.remove("cb-invalid"); setColor(rgb); syncPickerControls(rgb); }
      else field.classList.add("cb-invalid");
    });
    var rEl=$("#ctl-rgb-r"), gEl=$("#ctl-rgb-g"), bEl=$("#ctl-rgb-b");
    [rEl,gEl,bEl].forEach(function(el){
      el.addEventListener("input", function(){
        var r=+rEl.value, g=+gEl.value, b=+bEl.value;
        $("#ctl-rgb-r-num").textContent = r;
        $("#ctl-rgb-g-num").textContent = g;
        $("#ctl-rgb-b-num").textContent = b;
        updateRgbTracks(cbControls, r,g,b);
        var rgb = {r:r,g:g,b:b};
        setColor(rgb);
        well.value = currentHex().toLowerCase();
        field.value = currentHex();
      });
    });
    cbControls.addEventListener("click", function(e){
      var p = e.target.closest(".cb-preset");
      if (!p) return;
      var rgb = hexToRgb(p.getAttribute("data-hex"));
      if (rgb){ setColor(rgb); syncPickerControls(rgb); }
    });
  }

  function syncPickerControls(rgb){
    var well = $("#ctl-bigwell"), field = $("#ctl-hex");
    if (well) well.value = currentHex().toLowerCase();
    if (field) field.value = currentHex();
    var rEl=$("#ctl-rgb-r"), gEl=$("#ctl-rgb-g"), bEl=$("#ctl-rgb-b");
    if (rEl){ rEl.value = rgb.r; $("#ctl-rgb-r-num").textContent = rgb.r; }
    if (gEl){ gEl.value = rgb.g; $("#ctl-rgb-g-num").textContent = rgb.g; }
    if (bEl){ bEl.value = rgb.b; $("#ctl-rgb-b-num").textContent = rgb.b; }
    updateRgbTracks(cbControls, rgb.r, rgb.g, rgb.b);
  }

  function wireGradient(){
    var g1=$("#ctl-g1"), g2=$("#ctl-g2"), g1h=$("#ctl-g1-hex"), g2h=$("#ctl-g2-hex"), ang=$("#ctl-angle");
    g1.addEventListener("input", function(){ var rgb=hexToRgb(g1.value); if(rgb){ grad.c1=rgb; g1h.value=rgbToHex(rgb.r,rgb.g,rgb.b); gradChanged(); } });
    g2.addEventListener("input", function(){ var rgb=hexToRgb(g2.value); if(rgb){ grad.c2=rgb; g2h.value=rgbToHex(rgb.r,rgb.g,rgb.b); gradChanged(); } });
    g1h.addEventListener("input", function(){ var rgb=hexToRgb(g1h.value); if(rgb){ grad.c1=rgb; g1.value=rgbToHex(rgb.r,rgb.g,rgb.b).toLowerCase(); g1h.classList.remove("cb-invalid"); gradChanged(); } else g1h.classList.add("cb-invalid"); });
    g2h.addEventListener("input", function(){ var rgb=hexToRgb(g2h.value); if(rgb){ grad.c2=rgb; g2.value=rgbToHex(rgb.r,rgb.g,rgb.b).toLowerCase(); g2h.classList.remove("cb-invalid"); gradChanged(); } else g2h.classList.add("cb-invalid"); });
    ang.addEventListener("input", function(){ grad.angle=+ang.value; $("#ctl-angle-num").textContent=grad.angle+"°"; gradChanged(); });
    $("#ctl-reverse").addEventListener("click", function(){
      var t = grad.c1; grad.c1 = grad.c2; grad.c2 = t;
      buildControls(); gradChanged();
    });
    $$(".cb-type").forEach(function(btn){
      btn.addEventListener("click", function(){
        grad.type = btn.getAttribute("data-type");
        $$(".cb-type").forEach(function(b){ b.classList.toggle("cb-type-on", b === btn); });
        applyAngleState();
        gradChanged();
      });
    });
  }

  /* ---- output rendering ---- */
  function setColor(rgb){
    color = { r:rgb.r, g:rgb.g, b:rgb.b };
    buildReadouts();
    updateSwatch();
    updateStats();
  }
  function gradChanged(){
    buildReadouts();
    updateSwatch();
    updateStats();
  }

  function buildReadouts(){
    if (state.mode === "gradient"){
      var css = "background: " + gradientCSS() + ";";
      var c1 = rgbToHex(grad.c1.r,grad.c1.g,grad.c1.b);
      var c2 = rgbToHex(grad.c2.r,grad.c2.g,grad.c2.b);
      cbReadouts.innerHTML =
        row("CSS", css, true) + row("STOP 1", c1, false) + row("STOP 2", c2, false);
      return;
    }
    var target = MODES[state.mode].outLabel;
    var hsl = rgbToHsl(color.r,color.g,color.b);
    var cmyk = rgbToCmyk(color.r,color.g,color.b);
    cbReadouts.innerHTML =
      row("HEX", currentHex(), target==="HEX") +
      row("RGB", "rgb(" + color.r + ", " + color.g + ", " + color.b + ")", target==="RGB") +
      row("HSL", "hsl(" + hsl.h + ", " + hsl.s + "%, " + hsl.l + "%)", target==="HSL") +
      row("CMYK", "cmyk(" + cmyk.c + "%, " + cmyk.m + "%, " + cmyk.y + "%, " + cmyk.k + "%)", target==="CMYK");
  }

  function row(label, value, active){
    return '<div class="cb-row' + (active?" cb-active":"") + '">' +
      '<span class="cb-rl">' + label + '</span>' +
      '<code class="cb-rv">' + escHtml(value) + '</code>' +
      '<button type="button" class="cb-copy" data-copy="' + escHtml(value) + '" aria-label="Copy ' + label + '">⧉</button>' +
    '</div>';
  }

  function updateSwatch(){
    if (state.mode === "gradient"){
      cbSwatch.style.background = gradientCSS();
      cbSwatchLabel.textContent = grad.type === "linear" ? grad.angle + "°" : "RADIAL";
      var mid = { r:(grad.c1.r+grad.c2.r)/2, g:(grad.c1.g+grad.c2.g)/2, b:(grad.c1.b+grad.c2.b)/2 };
      cbSwatchLabel.style.color = isLight(mid.r,mid.g,mid.b) ? "var(--ink)" : "#fff";
    } else {
      cbSwatch.style.background = currentHex();
      cbSwatchLabel.textContent = currentHex();
      cbSwatchLabel.style.color = isLight(color.r,color.g,color.b) ? "var(--ink)" : "#fff";
    }
  }

  function updateStats(){
    if (state.mode === "gradient"){
      var css = "background: " + gradientCSS() + ";";
      var delta = Math.round(Math.sqrt(
        Math.pow(grad.c1.r-grad.c2.r,2)+Math.pow(grad.c1.g-grad.c2.g,2)+Math.pow(grad.c1.b-grad.c2.b,2)));
      setStat(sv[0], grad.angle + "°");
      setStat(sv[1], "2");
      setStat(sv[2], fmtNum(delta));
      setStat(sv[3], fmtNum(css.length));
      sl[0].textContent="Angle";    ss[0].textContent="DEGREES";
      sl[1].textContent="Stops";    ss[1].textContent="COLORS";
      sl[2].textContent="Color Δ";  ss[2].textContent="RGB DISTANCE";
      sl[3].textContent="CSS chars";ss[3].textContent="OUTPUT LENGTH";
    } else {
      setStat(sv[0], color.r);
      setStat(sv[1], color.g);
      setStat(sv[2], color.b);
      setStat(sv[3], Math.round(luminance(color.r,color.g,color.b)*100) + "%");
      sl[0].textContent="Red";       ss[0].textContent="CHANNEL R";
      sl[1].textContent="Green";     ss[1].textContent="CHANNEL G";
      sl[2].textContent="Blue";      ss[2].textContent="CHANNEL B";
      sl[3].textContent="Luminance"; ss[3].textContent="PERCEIVED BRIGHTNESS";
    }
  }

  /* ---- copy delegation ---- */
  cbReadouts.addEventListener("click", function(e){
    var btn = e.target.closest(".cb-copy");
    if (!btn) return;
    var val = btn.getAttribute("data-copy");
    var done = function(){
      btn.textContent = "✓"; btn.classList.add("ok");
      setTimeout(function(){ btn.textContent = "⧉"; btn.classList.remove("ok"); }, 1000);
    };
    if (navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(val).then(done, done);
    } else {
      var ta = document.createElement("textarea");
      ta.value = val; ta.style.position="fixed"; ta.style.opacity="0";
      document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); } catch(err){}
      document.body.removeChild(ta); done();
    }
  });

  /* ---- mode switching ---- */
  function setMode(m){
    state.mode = m;
    $$(".c-tab").forEach(function(t){
      var on = t.getAttribute("data-mode") === m;
      t.classList.toggle("is-on", on);
      t.setAttribute("aria-pressed", String(on));
    });
    $("#analyzer").setAttribute("data-mode", m);
    var meta = MODES[m];
    cbInLabel.textContent = meta.inLabel;
    cbOutLabel.textContent = meta.outLabel;
    cbBadge.textContent = meta.badge;
    vsBadge.textContent = meta.glyph;
    buildControls();
    buildReadouts();
    updateSwatch();
    updateStats();
  }
  $$(".c-tab").forEach(function(t){
    t.addEventListener("click", function(){ setMode(t.getAttribute("data-mode")); });
  });

  /* ---- init ---- */
  setMode("hex-rgb");
})();
