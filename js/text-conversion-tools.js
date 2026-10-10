
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

  /* ================= THE 7 CONVERTERS ================= */
  var src = $("#src");
  var outEl = $("#out");
  var oWrap = $("#o-wrap");
  var mdPrev = $("#md-prev");
  var outBadge = $("#out-badge");
  var stIn = $("#st-in"), stOut = $("#st-out"), stRatio = $("#st-ratio"),
      stX = $("#st-x"), slX = $("#sl-x"), ssX = $("#ss-x");
  var barLt = $("#bar-lt"), barDg = $("#bar-dg"), barSy = $("#bar-sy"), barWs = $("#bar-ws");
  var scLt = $("#sc-lt"), scDg = $("#sc-dg"), scSy = $("#sc-sy"), scWs = $("#sc-ws");

  var TOOLS = ["html2text","text2html","md","ascii","uni","rot13e","rot13d"];
  var OPTS_MAP = {
    html2text:"opts-html2text", text2html:"opts-text2html", md:"opts-md",
    ascii:"opts-ascii", uni:"opts-uni", rot13e:"opts-rot", rot13d:"opts-rot"
  };

  var tool = "html2text";
  var asciiDir = "encode", asciiBase = "dec";
  var uniDir = "encode", uniStyle = "u";
  var mdView = "preview";
  var decEntities = true, keepBreaks = true, wrapP = true;
  var lastOut = "";

  var SAMPLES = {
    html2text: src.value,
    text2html: "The quick brown fox jumps over the lazy dog.\nEvery letter survives the trip & nothing is lost.\n\nSecond paragraph: ampersands, <angle brackets> and \"quotes\"\nall come back safely escaped on the other side.",
    md: "# The Encoding Ledger\n\nEvery character wears **three costumes**: a glyph, a number, and a story.\n\n## The lineup\n\n- ASCII spells `Hello` as `72 101 108 108 111`\n- Unicode whispers *\\u0048\\u0065\\u006C\\u006C\\u006F*\n- ROT13 grins: [Uryyb](https://example.com)\n\n> Rotate, encode, convert — nothing is lost, only translated.\n\n---\n\n1. Strip the tags\n2. Count the bytes\n3. Ship the text\n\n
