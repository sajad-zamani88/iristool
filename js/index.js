
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

  /* ---- mega menu (click / touch + keyboard) ---- */
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

  /* ---- index accordion ---- */
  $$(".acc-trigger").forEach(function(btn){
    btn.addEventListener("click", function(){
      var item = btn.closest(".acc-item");
      var open = item.classList.toggle("open");
      btn.setAttribute("aria-expanded", String(open));
    });
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
    }, {threshold:0.12, rootMargin:"0px 0px -40px 0px"});
    revealEls.forEach(function(el){ io.observe(el); });
  }

  /* ---- count-up stats ---- */
  function countUp(el){
    var target = parseInt(el.getAttribute("data-count"), 10) || 0;
    if (reduceMotion){ el.textContent = target; return; }
    var dur = 1400, t0 = null;
    function frame(t){
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased);
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  var counters = $$("[data-count]");
  if (!("IntersectionObserver" in window) || reduceMotion){
    counters.forEach(countUp);
  } else {
    var cio = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if (en.isIntersecting){ countUp(en.target); cio.unobserve(en.target); }
      });
    }, {threshold:0.5});
    counters.forEach(function(el){ cio.observe(el); });
  }

  /* ---- live word-counter demo ---- */
  var ta = $("#demo-text");
  var outWords = $("#st-words"), outChars = $("#st-chars"),
      outSent  = $("#st-sent"),  outRead  = $("#st-read");
  function setStat(el, val){
    if (el.textContent !== String(val)){
      el.textContent = val;
      el.classList.remove("bump");
      void el.offsetWidth; /* restart transition */
      el.classList.add("bump");
      setTimeout(function(){ el.classList.remove("bump"); }, 180);
    }
  }
  function analyze(){
    var v = ta.value;
    var words = (v.trim().match(/\S+/g) || []).length;
    var chars = v.length;
    var sent  = (v.match(/[.!?…]+/g) || []).length;
    if (!sent && v.trim()) sent = 1;
    var read  = words ? Math.max(1, Math.round(words / 225)) + " min" : "0 min";
    setStat(outWords, words);
    setStat(outChars, chars);
    setStat(outSent,  sent);
    setStat(outRead,  read);
  }
  ta.addEventListener("input", analyze);
  analyze();

  /* ---- ticker: duplicate track for seamless loop ---- */
  var track = $("#ticker-track");
  track.innerHTML += track.innerHTML;

  /* ---- footer year ---- */
  $("#yr").textContent = new Date().getFullYear();
})();

/* ---- nav-close (site-wide identical menu) ---- */
(function(){
  var nc = document.getElementById("nav-close");
  if (!nc || nc.__irisNavCloseBound) return;
  nc.__irisNavCloseBound = true;
  nc.addEventListener("click", function(){
    document.body.classList.remove("nav-open");
    var b = document.getElementById("burger");
    if (b){ b.setAttribute("aria-expanded","false"); b.setAttribute("aria-label","Open menu"); }
  });
})();
