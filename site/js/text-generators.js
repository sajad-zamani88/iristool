
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

  /* ================= THE 5 MACHINES ================= */
  var GENS = ["lorem","word","letter","para","sent"];
  var activeGen = "lorem";
  var genCount = 0;
  var scrambleIv = null;

  var outEl = $("#out");
  var trayTime = $("#tray-time");
  var genLog = $("#gen-log"), logEmpty = $("#log-empty");
  var stWords = $("#st-words"), stChars = $("#st-chars"),
      stLines = $("#st-lines"), stGens = $("#st-gens");

  function fmtNum(n){ return n.toLocaleString("en-US"); }
  function randInt(a, b){ return a + Math.floor(Math.random() * (b - a + 1)); }
  function pick(arr){ return arr[Math.floor(Math.random() * arr.length)]; }

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

  /* ---- corpora ---- */
  var LOREM = [
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
    "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
    "Curabitur pretium tincidunt lacus, nec gravida nisi vehicula a.",
    "Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.",
    "Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae.",
    "Donec velit neque, auctor sit amet aliquam vel, ullamcorper sit amet ligula.",
    "Nulla porttitor accumsan tincidunt, sed consectetur lorem.",
    "Vivamus suscipit tortor eget felis porttitor volutpat.",
    "Mauris blandit aliquet elit, eget tincidunt nibh pulvinar a.",
    "Quisque velit nisi, pretium ut lacinia in, elementum id enim.",
    "Sed porttitor lectus nibh, et sollicitudin ex pharetra at.",
    "Aliquam erat volutpat, suscipit non posuere vitae, mollis in ligula.",
    "Integer posuere erat a ante venenatis dapibus posuere velit aliquet.",
    "Cras ultricies ligula sed magna dictum porta.",
    "Praesent sapien massa, convallis a pellentesque nec, egestas non nisi.",
    "Donec rutrum congue leo eget malesuada.",
    "Nulla quis lorem ut libero malesuada feugiat.",
    "Proin eget tortor risus, vestibulum ac est lacinia, venenatis sed justo."
  ];

  var WORDS = ["apple","river","candle","trumpet","garden","whisper","mountain","pocket","silver","thunder","blanket","compass","dragon","ember","feather","harbor","journey","kettle","lantern","meadow","noodle","orange","pencil","quilt","rainbow","saddle","tunnel","umbrella","velvet","walrus","yellow","zipper","anchor","breeze","castle","desert","echo","forest","glacier","hammer","island","jungle","kingdom","lemon","mirror","needle","ocean","palace","question","rocket","sunset","temple","village","window","zebra","arrow","basket","cloud","drum","eagle","flame","grape","hill","ink","jar","kite","lion","map","nest","owl","pine","queen","rose","star","tree","vine","wolf","yard","bell","coin","door","egg","fan","gate","hat","ice","jam","key","lamp","moon","nail","oak","ring","sock","tea","van","web","box","cup","dot","fig","gem","hen","jet","log","mug","net","pig","rug","sun","toe","wax","yak","zip","bee","cat","dog","fox","gum","hop","ivy","keg","lid","mop","nut","ore","paw","quiz","rat","ski","tub","urn","vow","brick","chair","dance","earth","fruit","ghost","house","juice","knife","light","music","night","paint","quiet","radio","stone","tiger","voice","water","youth","bread","cream","dream","field","gold","heart","iron","jewel","knot","leaf","milk","north","pearl","road","sand","train","wind","bridge","copper","dawn","engine","frost","gravel","honey","ivory","kernel","lunar","marble","nectar","opal","prism","quartz","ripple","scarf","timber","urban","vapor","willow","zenith"];

  /* ---- generator state ---- */
  var loremUnit = "paragraphs";
  var loremClassic = true;
  var letterCase = "lower";
  var letterDigits = false;

  /* ---- steppers ---- */
  function stepVal(id){
    var v = parseInt($("#" + id).value, 10);
    return isNaN(v) ? 1 : v;
  }
  $$(".step").forEach(function(step){
    var inp = step.querySelector(".step-inp");
    var mn = parseInt(step.getAttribute("data-min"), 10);
    var mx = parseInt(step.getAttribute("data-max"), 10);
    function clampSet(v){
      if (isNaN(v)){ v = mn; }
      inp.value = Math.max(mn, Math.min(mx, v));
    }
    step.querySelectorAll(".step-btn").forEach(function(b){
      b.addEventListener("click", function(){
        clampSet((parseInt(inp.value, 10) || mn) + parseInt(b.getAttribute("data-d"), 10));
      });
    });
    inp.addEventListener("change", function(){ clampSet(parseInt(inp.value, 10)); });
    inp.addEventListener("keydown", function(e){
      if (e.key === "Enter"){ e.preventDefault(); generate(); }
    });
  });

  /* ---- radio chip groups ---- */
  function bindChips(containerId, attr, setter){
    $$("#" + containerId + " .chip-r").forEach(function(btn){
      btn.addEventListener("click", function(){
        $$("#" + containerId + " .chip-r").forEach(function(b){ b.setAttribute("aria-pressed","false"); });
        btn.setAttribute("aria-pressed","true");
        setter(btn.getAttribute(attr));
      });
    });
  }
  bindChips("chips-lorem-unit", "data-unit", function(v){ loremUnit = v; });
  bindChips("chips-letter-case", "data-case", function(v){ letterCase = v; });

  /* ---- toggles ---- */
  function bindTgl(id, setter){
    var btn = $("#" + id);
    btn.addEventListener("click", function(){
      var on = btn.getAttribute("aria-pressed") !== "true";
      btn.setAttribute("aria-pressed", String(on));
      setter(on);
    });
  }
  bindTgl("tgl-lorem-classic", function(v){ loremClassic = v; });
  bindTgl("tgl-letter-digits", function(v){ letterDigits = v; });

  /* ---- lorem machine ---- */
  function loremSentences(n, forceClassic){
    var out = [], last = -1;
    for (var i = 0; i < n; i++){
      var idx;
      if (i === 0 && forceClassic){ idx = 0; }
      else {
        do { idx = Math.floor(Math.random() * LOREM.length); } while (idx === last);
      }
      last = idx;
      out.push(LOREM[idx]);
    }
    return out;
  }
  function genLorem(){
    var n = stepVal("stp-lorem-count");
    if (loremUnit === "words"){
      var pool = LOREM.join(" ").replace(/[.,]/g, "").split(/\s+/);
      var out = [];
      if (loremClassic && n >= 5){ out = ["lorem","ipsum","dolor","sit","amet"]; }
      var i = Math.floor(Math.random() * pool.length);
      while (out.length < n){ out.push(pool[i % pool.length]); i++; }
      return { text: out.join(" "), detail: fmtNum(n) + " words" + (loremClassic && n >= 5 ? " · classic opener" : "") };
    }
    if (loremUnit === "sentences"){
      return { text: loremSentences(n, loremClassic).join(" "), detail: fmtNum(n) + " sentences" + (loremClassic ? " · classic opener" : "") };
    }
    var paras = [];
    for (var p = 0; p < n; p++){
      paras.push(loremSentences(randInt(4, 7), loremClassic && p === 0).join(" "));
    }
    return { text: paras.join("\n\n"), detail: fmtNum(n) + " paragraphs" + (loremClassic ? " · classic opener" : "") };
  }

  /* ---- word machine ---- */
  function genWords(){
    var n = stepVal("stp-word-count");
    var mn = stepVal("stp-word-min"), mx = stepVal("stp-word-max");
    var lo = Math.min(mn, mx), hi = Math.max(mn, mx);
    var pool = WORDS.filter(function(w){ return w.length >= lo && w.length <= hi; });
    if (!pool.length){ pool = WORDS; }
    var out = [];
    for (var i = 0; i < n; i++){ out.push(pick(pool)); }
    return { text: out.join(" "), detail: fmtNum(n) + " words · len " + lo + "–" + hi };
  }

  /* ---- letter machine ---- */
  function genLetters(){
    var n = stepVal("stp-letter-count");
    var set = letterCase === "upper" ? "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
            : letterCase === "mixed" ? "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
            : "abcdefghijklmnopqrstuvwxyz";
    if (letterDigits){ set += "0123456789"; }
    var out = "";
    for (var i = 0; i < n; i++){ out += set[Math.floor(Math.random() * set.length)]; }
    var caseLabel = letterCase === "upper" ? "UPPER" : letterCase === "mixed" ? "mixed" : "lower";
    return { text: out, detail: fmtNum(n) + " chars · " + caseLabel + (letterDigits ? " + digits" : "") };
  }

  /* ---- sentence machine ---- */
  function makeSentence(minW, maxW){
    var n = randInt(minW, maxW);
    var ws = [];
    for (var i = 0; i < n; i++){ ws.push(pick(WORDS)); }
    var s = ws.join(" ");
    s = s.charAt(0).toUpperCase() + s.slice(1);
    var r = Math.random();
    return s + (r < 0.85 ? "." : (r < 0.95 ? "?" : "!"));
  }
  function genSentences(){
    var n = stepVal("stp-sent-count");
    var mn = stepVal("stp-sent-min"), mx = stepVal("stp-sent-max");
    var lo = Math.min(mn, mx), hi = Math.max(mn, mx);
    var out = [];
    for (var i = 0; i < n; i++){ out.push(makeSentence(lo, hi)); }
    return { text: out.join(" "), detail: fmtNum(n) + " sentences · " + lo + "–" + hi + " words" };
  }

  /* ---- paragraph machine ---- */
  function genParagraphs(){
    var n = stepVal("stp-para-count");
    var sents = stepVal("stp-para-sent");
    var mn = 4, mx = 12;
    var paras = [];
    for (var p = 0; p < n; p++){
      var row = [];
      for (var s = 0; s < sents; s++){ row.push(makeSentence(mn, mx)); }
      paras.push(row.join(" "));
    }
    return { text: paras.join("\n\n"), detail: fmtNum(n) + " × " + fmtNum(sents) + " sentences" };
  }

  /* ---- decode-into-view effect ---- */
  function scrambleIn(el, finalText){
    if (scrambleIv){ clearInterval(scrambleIv); scrambleIv = null; }
    if (reduceMotion || !finalText || finalText.length > 6000){
      el.value = finalText;
      el.scrollTop = 0;
      return;
    }
    var glyphs = "#%&/=+*<>0123456789abcdefmkxr";
    var frame = 0, total = 9;
    scrambleIv = setInterval(function(){
      frame++;
      var reveal = Math.floor(finalText.length * frame / total);
      var tailLen = Math.min(28, finalText.length - reveal);
      var tail = "";
      for (var i = 0; i < tailLen; i++){
        tail += glyphs[Math.floor(Math.random() * glyphs.length)];
      }
      el.value = finalText.slice(0, reveal) + tail;
      if (frame >= total){
        clearInterval(scrambleIv);
        scrambleIv = null;
        el.value = finalText;
        el.scrollTop = 0;
      }
    }, 34);
  }

  /* ---- generation log ---- */
  function logGen(label, detail){
    var t = new Date().toLocaleTimeString("en-GB");
    var row = document.createElement("div");
    row.className = "log-row";
    var b = document.createElement("b");
    b.textContent = label;
    var s = document.createElement("span");
    s.textContent = detail + " · " + t;
    row.appendChild(b); row.appendChild(s);
    genLog.insertBefore(row, genLog.firstChild);
    while (genLog.children.length > 5){ genLog.removeChild(genLog.lastChild); }
    logEmpty.style.display = "none";
  }

  /* ---- stats ---- */
  function updateStats(text){
    var words = text.trim() ? text.trim().split(/\s+/).length : 0;
    var lines = text ? text.split("\n").length : 0;
    setStat(stWords, fmtNum(words));
    setStat(stChars, fmtNum(text.length));
    setStat(stLines, fmtNum(lines));
    setStat(stGens, fmtNum(genCount));
  }

  /* ---- THE LEVER ---- */
  function generate(){
    var t0 = performance.now();
    var result, label;
    switch (activeGen){
      case "word":   result = genWords();      label = "RANDOM WORDS";  break;
      case "letter": result = genLetters();    label = "RANDOM LETTERS"; break;
      case "para":   result = genParagraphs(); label = "PARAGRAPHS";     break;
      case "sent":   result = genSentences();  label = "SENTENCES";      break;
      default:       result = genLorem();      label = "LOREM IPSUM";
    }
    var ms = Math.max(1, Math.round(performance.now() - t0));
    genCount++;
    scrambleIn(outEl, result.text);
    trayTime.textContent = ms + " MS";
    updateStats(result.text);
    logGen(label, result.detail);
  }

  $("#btn-generate").addEventListener("click", generate);
  $("#btn-regen").addEventListener("click", function(){
    generate();
    flash(btnRegen, "FRESH ✓");
  });

  /* ---- tabs ---- */
  var tabEls = {}, ctrlEls = {};
  GENS.forEach(function(g){
    tabEls[g] = $("#tab-" + g);
    ctrlEls[g] = $("#ctrls-" + g);
    tabEls[g].addEventListener("click", function(){ setTab(g); });
  });
  function setTab(id){
    activeGen = id;
    GENS.forEach(function(g){
      var on = (g === id);
      tabEls[g].classList.toggle("is-on", on);
      tabEls[g].setAttribute("aria-pressed", String(on));
      ctrlEls[g].classList.toggle("is-on", on);
    });
    generate();
  }

  /* ---- feedback helper ---- */
  function flash(btn, text, isErr){
    var original = btn.getAttribute("data-label") || btn.textContent;
    btn.setAttribute("data-label", original);
    btn.textContent = text;
    btn.classList.add(isErr ? "err" : "ok");
    clearTimeout(btn._t);
    btn._t = setTimeout(function(){
      btn.textContent = original;
      btn.classList.remove("ok","err");
    }, 1400);
  }

  /* ---- copy / download ---- */
  var btnCopyOut = $("#btn-copy-out");
  btnCopyOut.addEventListener("click", function(){
    var v = outEl.value;
    if (!v){ flash(btnCopyOut, "TRAY IS EMPTY", true); return; }
    function fallback(){
      outEl.focus(); outEl.select();
      try { document.execCommand("copy"); flash(btnCopyOut, "COPIED ✓"); }
      catch(err){ flash(btnCopyOut, "USE CTRL+C", true); }
      window.getSelection().removeAllRanges();
    }
    if (navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(v).then(function(){ flash(btnCopyOut, "COPIED ✓"); }, fallback);
    } else { fallback(); }
  });

  var btnDlOut = $("#btn-dl-out");
  btnDlOut.addEventListener("click", function(){
    var v = outEl.value;
    if (!v){ flash(btnDlOut, "TRAY IS EMPTY", true); return; }
    var blob = new Blob([v], {type:"text/plain;charset=utf-8"});
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "IrisTool-generated.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function(){ URL.revokeObjectURL(url); }, 500);
    flash(btnDlOut, "SAVED ✓");
  });

  var btnRegen = $("#btn-regen");

  /* ---- init: first pull of the lever ---- */
  generate();
})();
