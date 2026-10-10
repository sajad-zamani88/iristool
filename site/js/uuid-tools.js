
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

  /* ================= ID ENGINE ================= */
  var cbControls = $("#cb-controls");
  var idList     = $("#id-list");
  var idPrimaryValue = $("#id-primary-value");
  var idPrimaryLabel = $("#id-primary-label");
  var idLegend   = $("#id-legend");
  var cbBadge    = $("#cb-badge");
  var vsBadge    = $("#vs-badge");
  var sl = [$("#sl-1"),$("#sl-2"),$("#sl-3"),$("#sl-4")];
  var sv = [$("#sv-1"),$("#sv-2"),$("#sv-3"),$("#sv-4")];
  var ss = [$("#ss-1"),$("#ss-2"),$("#ss-3"),$("#ss-4")];

  var NANO_ALPHABET = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";

  var state = { mode:"uuid", count:5, upper:false, hyphens:true, braces:false, nanoLen:21, rawIds:[] };

  var MODES = {
    "uuid": { glyph:"⬡", label:"UUID V4",  badge:function(){ return "BATCH ×" + state.count; } },
    "guid": { glyph:"{}", label:"GUID",     badge:function(){ return "BATCH ×" + state.count; } },
    "nano": { glyph:"~",  label:"NANO ID",  badge:function(){ return "BATCH ×" + state.count; } }
  };

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

  /* ---- randomness ---- */
  function randBytes(n){
    var b = new Uint8Array(n);
    if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(b);
    else for (var i=0;i<n;i++) b[i] = Math.floor(Math.random()*256);
    return b;
  }
  function uuidv4Raw(){
    var b = randBytes(16);
    b[6] = (b[6] & 0x0f) | 0x40;
    b[8] = (b[8] & 0x3f) | 0x80;
    var h = "";
    for (var i=0;i<16;i++) h += ("0"+b[i].toString(16)).slice(-2);
    return h.substr(0,8)+"-"+h.substr(8,4)+"-"+h.substr(12,4)+"-"+h.substr(16,4)+"-"+h.substr(20,12);
  }
  function nanoid(len){
    var b = randBytes(len);
    var id = "";
    for (var i=0;i<len;i++) id += NANO_ALPHABET[b[i] & 63];
    return id;
  }

  /* ---- formatting ---- */
  function formatId(raw){
    if (state.mode === "uuid"){
      var s = raw;
      if (!state.hyphens) s = s.replace(/-/g,"");
      if (state.upper) s = s.toUpperCase();
      if (state.braces) s = "{" + s + "}";
      return s;
    }
    if (state.mode === "guid") return "{" + raw.toUpperCase() + "}";
    return raw;
  }

  function renderHighlighted(formatted){
    var html = "", hexIdx = 0;
    for (var i=0;i<formatted.length;i++){
      var c = formatted[i];
      if (/[0-9a-fA-F]/.test(c)){
        if (hexIdx === 12) html += '<span class="id-ver">' + c + '</span>';
        else if (hexIdx === 16) html += '<span class="id-var">' + c + '</span>';
        else html += c;
        hexIdx++;
      } else {
        html += '<span class="id-sep">' + escHtml(c) + '</span>';
      }
    }
    return html;
  }

  /* ---- generation + rendering ---- */
  function generate(){
    var ids = [];
    for (var i=0;i<state.count;i++){
      ids.push(state.mode === "nano" ? nanoid(state.nanoLen) : uuidv4Raw());
    }
    state.rawIds = ids;
    render();
  }

  function render(){
    var ids = state.rawIds.map(formatId);
    var primary = ids[0] || "";

    idPrimaryLabel.textContent = "FRESHEST · " + MODES[state.mode].label;
    if (state.mode === "nano"){
      idPrimaryValue.innerHTML = escHtml(primary);
      idLegend.innerHTML = "LENGTH " + state.nanoLen + " · " + (state.nanoLen*6) + " BITS OF ENTROPY · URL-SAFE";
    } else {
      idPrimaryValue.innerHTML = renderHighlighted(primary);
      idLegend.innerHTML = '<span class="lg-ver">■</span> VERSION NIBBLE (v4) &nbsp;·&nbsp; <span class="lg-var">■</span> VARIANT NIBBLE (RFC 4122)';
    }
    idPrimaryValue.style.animation = "none";
    void idPrimaryValue.offsetWidth;
    idPrimaryValue.style.animation = "";

    var html = "";
    for (var i=1;i<ids.length;i++){
      html += '<div class="id-row" style="animation-delay:' + (i*35) + 'ms">' +
        '<span class="id-idx">' + ("0"+(i+1)).slice(-2) + '</span>' +
        '<code class="id-val">' + escHtml(ids[i]) + '</code>' +
        '<button type="button" class="id-copy" data-copy="' + escHtml(ids[i]) + '" aria-label="Copy ID ' + (i+1) + '">⧉</button>' +
      '</div>';
    }
    if (ids.length <= 1) html = '<p class="id-listnote">Set a higher batch count on the left to mint a whole set at once — every ID gets its own copy button.</p>';
    idList.innerHTML = html;

    cbBadge.textContent = MODES[state.mode].badge();
    updateStats();
  }

  function updateStats(){
    if (state.mode === "uuid"){
      setStat(sv[0],"v4"); setStat(sv[1],"RFC 4122"); setStat(sv[2],"122 bits");
      setStat(sv[3], String(state.hyphens ? 36 : 32) + (state.braces ? "+2" : ""));
      sl[0].textContent="Version";  ss[0].textContent="RANDOM";
      sl[1].textContent="Variant";  ss[1].textContent="STANDARD";
      sl[2].textContent="Entropy";  ss[2].textContent="OF RANDOMNESS";
      sl[3].textContent="Length";   ss[3].textContent="CHARACTERS";
    } else if (state.mode === "guid"){
      setStat(sv[0],"v4"); setStat(sv[1],"Microsoft"); setStat(sv[2],"122 bits"); setStat(sv[3],"38");
      sl[0].textContent="Version";  ss[0].textContent="RANDOM";
      sl[1].textContent="Variant";  ss[1].textContent="MICROSOFT";
      sl[2].textContent="Entropy";  ss[2].textContent="OF RANDOMNESS";
      sl[3].textContent="Length";   ss[3].textContent="WITH BRACES";
    } else {
      setStat(sv[0],"64"); setStat(sv[1], String(state.nanoLen));
      setStat(sv[2], (state.nanoLen*6) + " bits"); setStat(sv[3], "64^" + state.nanoLen);
      sl[0].textContent="Alphabet"; ss[0].textContent="URL-SAFE CHARS";
      sl[1].textContent="Length";   ss[1].textContent="CHARACTERS";
      sl[2].textContent="Entropy";  ss[2].textContent="OF RANDOMNESS";
      sl[3].textContent="Keyspace"; ss[3].textContent="POSSIBLE IDS";
    }
  }

  /* ---- controls ---- */
  function countChips(){
    return '<label class="cb-fieldlabel">BATCH COUNT</label>' +
      '<div class="cb-chips" id="ctl-count">' +
        [1,5,10,25].map(function(n){
          return '<button type="button" class="cb-chip' + (state.count===n?' cb-chip-on':'') + '" data-count="' + n + '">' + n + '</button>';
        }).join("") +
      '</div>';
  }
  function genButton(){
    return '<button type="button" class="gen-btn" id="ctl-generate"><span class="gen-die">⚄</span> GENERATE</button>';
  }

  function buildControls(){
    var html = genButton() + countChips();
    if (state.mode === "uuid"){
      html += '<label class="cb-fieldlabel">FORMAT</label>' +
        '<div class="cb-optrow">' +
          '<button type="button" class="cb-opt' + (state.upper?' cb-opt-on':'') + '" id="opt-upper">AA UPPERCASE</button>' +
          '<button type="button" class="cb-opt' + (state.hyphens?' cb-opt-on':'') + '" id="opt-hyphens">– HYPHENS</button>' +
          '<button type="button" class="cb-opt' + (state.braces?' cb-opt-on':'') + '" id="opt-braces">{ } BRACES</button>' +
        '</div>' +
        '<p class="cb-hint"><strong>Version 4, variant 1.</strong> The version and variant bits are highlighted in the spotlight — flip the format toggles and the batch re-renders without re-rolling.</p>';
    } else if (state.mode === "guid"){
      html += '<p class="cb-hint"><strong>Microsoft convention:</strong> uppercase, hyphenated, wrapped in braces — the identical v4 random value as the UUID tool, dressed for .NET, the registry and Active Directory.</p>';
    } else {
      html += '<label class="cb-fieldlabel">LENGTH · <em id="nano-len-val">' + state.nanoLen + '</em> CHARS · <em>' + (state.nanoLen*6) + '</em> BITS</label>' +
        '<input type="range" id="ctl-nanolen" class="cb-range" min="6" max="64" value="' + state.nanoLen + '" aria-label="Nano ID length">' +
        '<label class="cb-fieldlabel">ALPHABET · 64 URL-SAFE SYMBOLS</label>' +
        '<code class="cb-alphabet">' + NANO_ALPHABET + '</code>' +
        '<p class="cb-hint"><strong>6 bits per character.</strong> Drag the dial and the entropy readout follows — 21 chars matches a UUID, shorter is handier, longer is paranoid.</p>';
    }
    cbControls.innerHTML = html;
    wireControls();
  }

  function wireControls(){
    $("#ctl-generate").addEventListener("click", function(){
      var die = this.querySelector(".gen-die");
      die.classList.remove("spin"); void die.offsetWidth; die.classList.add("spin");
      generate();
    });
    $$("#ctl-count .cb-chip").forEach(function(chip){
      chip.addEventListener("click", function(){
        state.count = parseInt(chip.getAttribute("data-count"),10);
        $$("#ctl-count .cb-chip").forEach(function(c){ c.classList.toggle("cb-chip-on", c===chip); });
        generate();
      });
    });

    if (state.mode === "uuid"){
      var up = $("#opt-upper"), hy = $("#opt-hyphens"), br = $("#opt-braces");
      up.addEventListener("click", function(){ state.upper=!state.upper; up.classList.toggle("cb-opt-on",state.upper); render(); });
      hy.addEventListener("click", function(){ state.hyphens=!state.hyphens; hy.classList.toggle("cb-opt-on",state.hyphens); render(); });
      br.addEventListener("click", function(){ state.braces=!state.braces; br.classList.toggle("cb-opt-on",state.braces); render(); });
    }
    if (state.mode === "nano"){
      $("#ctl-nanolen").addEventListener("input", function(){
        state.nanoLen = parseInt(this.value,10);
        generate();
      });
    }
  }

  /* ---- copy helpers ---- */
  function doCopy(val, done){
    if (navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(val).then(done, done);
    } else {
      var ta = document.createElement("textarea");
      ta.value = val; ta.style.position="fixed"; ta.style.opacity="0";
      document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); } catch(e){}
      document.body.removeChild(ta); done();
    }
  }
  function flashCopy(btn, val){
    doCopy(val, function(){
      var orig = btn.textContent;
      btn.textContent = "✓"; btn.classList.add("ok");
      setTimeout(function(){ btn.textContent = orig; btn.classList.remove("ok"); }, 1000);
    });
  }

  $("#btn-copy-primary").addEventListener("click", function(){
    flashCopy(this, formatId(state.rawIds[0] || ""));
  });
  $("#btn-copyall").addEventListener("click", function(){
    var btn = this;
    doCopy(state.rawIds.map(formatId).join("\n"), function(){
      btn.textContent = "✓ COPIED"; btn.classList.add("ok");
      setTimeout(function(){ btn.textContent = "⧉ COPY ALL"; btn.classList.remove("ok"); }, 1100);
    });
  });
  idList.addEventListener("click", function(e){
    var btn = e.target.closest(".id-copy");
    if (!btn) return;
    flashCopy(btn, btn.getAttribute("data-copy"));
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
    vsBadge.textContent = MODES[m].glyph;
    buildControls();
    generate();
  }
  $$(".c-tab").forEach(function(t){
    t.addEventListener("click", function(){ setMode(t.getAttribute("data-mode")); });
  });

  /* ---- init ---- */
  setMode("uuid");
})();
