
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

  /* ================= SERP STUDIO ================= */
  var inTitle = $("#in-title"), inDesc = $("#in-desc"), inUrl = $("#in-url"), inSite = $("#in-site");
  var state = { view:"google", tags:"" };

  function escHtml(s){ return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
  function escAttr(s){ return String(s).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }

  function slugify(s){
    return String(s).toLowerCase().trim()
      .replace(/[^a-z0-9\s-]/g,"")
      .replace(/[\s_]+/g,"-")
      .replace(/-+/g,"-")
      .replace(/^-+|-+$/g,"");
  }
  function domainOf(url){
    var m = String(url).match(/^https?:\/\/([^\/?#]+)/i);
    return m ? m[1] : "example.com";
  }
  function pathOf(url){
    var m = String(url).match(/^https?:\/\/[^\/]+(\/[^?#]*)?/i);
    return (m && m[1]) ? m[1].replace(/\/$/,"").replace(/^\//," › ").replace(/\//g," › ") : "";
  }

  /* ---- meters ---- */
  function meter(len, min, max, hardMax){
    var pct = Math.min(100, (len / hardMax) * 100);
    var status = len === 0 ? "idle" : (len > hardMax ? "over" : (len < min ? "warn" : "ok"));
    return { pct:pct, status:status };
  }
  function applyMeter(fillEl, noteEl, countEl, len, min, max, hardMax, unitLabel){
    var m = meter(len, min, max, hardMax);
    fillEl.style.width = m.pct + "%";
    fillEl.className = "meter-fill " + (m.status === "idle" ? "" : m.status);
    countEl.textContent = len + " / " + hardMax;
    countEl.className = "f-count " + (m.status === "idle" ? "" : m.status);
    var noteText, noteCls;
    if (m.status === "idle"){ noteText = "AIM FOR " + min + "–" + hardMax + " CHARACTERS"; noteCls = ""; }
    else if (m.status === "over"){ noteText = "OVER " + hardMax + " — WILL BE TRUNCATED"; noteCls = "over"; }
    else if (m.status === "warn"){ noteText = "SHORT — ADD MORE DETAIL"; noteCls = "warn"; }
    else { noteText = "GOOD LENGTH"; noteCls = "ok"; }
    noteEl.textContent = noteText;
    noteEl.className = "meter-note " + noteCls;
  }

  /* ---- previews ---- */
  function googlePreview(title, desc, url, mobile){
    var dom = domainOf(url), path = pathOf(url);
    var cls = mobile ? "serp serp-m" : "serp";
    return '<div class="' + cls + '">' +
      '<div class="serp-urlrow"><span class="serp-favicon">' + escHtml(dom.charAt(0).toUpperCase()) + '</span>' +
      '<div><div class="serp-domain">' + escHtml(dom) + '</div>' +
      '<div class="serp-url">' + escHtml(url.replace(/^https?:\/\//,"").replace(/\/$/,"")) + '</div></div></div>' +
      '<div class="serp-title">' + escHtml(title || "Your page title") + '</div>' +
      '<div class="serp-desc">' + escHtml(desc || "Your meta description will appear here.") + '</div>' +
    '</div>';
  }
  function ogPreview(title, desc, url, site){
    var dom = domainOf(url);
    return '<div class="og">' +
      '<div class="og-img">OG IMAGE · 1200 × 630 · 1.91:1</div>' +
      '<div class="og-body">' +
      '<div class="og-domain">' + escHtml(dom) + '</div>' +
      '<div class="og-title">' + escHtml(title || "Your page title") + '</div>' +
      '<div class="og-desc">' + escHtml(desc || "Your Open Graph description.") + '</div>' +
      '</div></div>';
  }
  function twitterPreview(title, desc, url){
    var dom = domainOf(url);
    return '<div class="tw">' +
      '<div class="tw-img">CARD IMAGE · 1200 × 628</div>' +
      '<div class="tw-body">' +
      '<div class="tw-domain">' + escHtml(dom) + '</div>' +
      '<div class="tw-title">' + escHtml(title || "Your page title") + '</div>' +
      '<div class="tw-desc">' + escHtml(desc || "Your Twitter Card description.") + '</div>' +
      '</div></div>';
  }

  /* ---- tag generation ---- */
  function buildTags(title, desc, url, site){
    var t = escAttr(title), d = escAttr(desc), u = escAttr(url), s = escAttr(site);
    var lines = [
      '<title>' + t + '</title>',
      '<meta name="description" content="' + d + '">',
      '<link rel="canonical" href="' + u + '">',
      '<meta name="robots" content="index, follow">',
      '',
      '<meta property="og:type" content="website">',
      '<meta property="og:site_name" content="' + s + '">',
      '<meta property="og:url" content="' + u + '">',
      '<meta property="og:title" content="' + t + '">',
      '<meta property="og:description" content="' + d + '">',
      '<meta property="og:image" content="' + u + '/og-image.png">',
      '',
      '<meta name="twitter:card" content="summary_large_image">',
      '<meta name="twitter:url" content="' + u + '">',
      '<meta name="twitter:title" content="' + t + '">',
      '<meta name="twitter:description" content="' + d + '">',
      '<meta name="twitter:image" content="' + u + '/og-image.png">'
    ];
    return lines.join("\n");
  }

  function highlightCode(code){
    return escHtml(code).replace(/(&lt;[^&]*?)(=)(&quot;.*?&quot;)/g, function(m, a, eq, v){
      return '<span class="ct">' + a + '</span>' + eq + '<span class="cv">' + v + '</span>';
    });
  }

  /* ---- main render ---- */
  function run(){
    var title = inTitle.value, desc = inDesc.value, url = inUrl.value, site = inSite.value;

    applyMeter($("#title-meter"), $("#title-note"), $("#title-count"), title.length, 50, 60, 60);
    applyMeter($("#desc-meter"), $("#desc-note"), $("#desc-count"), desc.length, 70, 160, 160);
    $("#url-count").textContent = url.length;
    $("#site-count").textContent = site.length;

    var stage = $("#preview-stage");
    if (state.view === "google") stage.innerHTML = googlePreview(title, desc, url, false);
    else if (state.view === "mobile") stage.innerHTML = googlePreview(title, desc, url, true);
    else if (state.view === "og") stage.innerHTML = ogPreview(title, desc, url, site);
    else stage.innerHTML = twitterPreview(title, desc, url);

    state.tags = buildTags(title, desc, url, site);
    $("#code-out").innerHTML = highlightCode(state.tags);

    var tagCount = state.tags.split("\n").filter(function(l){ return l.trim() !== ""; }).length;
    var slug = slugify(url.split("/").pop() || title);
    setStat($("#sv-1"), title.length, title.length > 60 ? "bad" : (title.length >= 50 ? "good" : "warn"));
    setStat($("#sv-2"), desc.length, desc.length > 160 ? "bad" : (desc.length >= 70 ? "good" : "warn"));
    setStat($("#sv-3"), tagCount, "");
    setStat($("#sv-4"), slug || "—", "");
  }

  function setStat(el, val, tone){
    val = String(val);
    el.classList.remove("good","warn","bad");
    if (tone) el.classList.add(tone);
    if (el.textContent !== val){
      el.textContent = val;
      el.classList.remove("bump");
      void el.offsetWidth;
      el.classList.add("bump");
      setTimeout(function(){ el.classList.remove("bump"); }, 200);
    }
  }

  /* ---- view tabs ---- */
  var VIEW_LABELS = { google:"GOOGLE", mobile:"MOBILE", og:"OPEN GRAPH", twitter:"TWITTER CARD" };
  $$(".c-tab").forEach(function(tab){
    tab.addEventListener("click", function(){
      state.view = tab.getAttribute("data-view");
      $$(".c-tab").forEach(function(t){
        var on = t === tab;
        t.classList.toggle("is-on", on);
        t.setAttribute("aria-pressed", String(on));
      });
      $("#view-label").textContent = VIEW_LABELS[state.view];
      run();
    });
  });

  [inTitle, inDesc, inUrl, inSite].forEach(function(el){ el.addEventListener("input", run); });

  /* ---- actions ---- */
  function flash(btn, text, isErr){
    var original = btn.getAttribute("data-label") || btn.textContent;
    btn.setAttribute("data-label", original);
    btn.textContent = text;
    btn.classList.add(isErr ? "err" : "ok");
    clearTimeout(btn._t);
    btn._t = setTimeout(function(){
      btn.textContent = original;
      btn.classList.remove("ok","err");
    }, 1200);
  }
  function copyText(val, done){
    if (navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(val).then(done, done);
    } else {
      var ta = document.createElement("textarea");
      ta.value = val; ta.style.position="fixed"; ta.style.opacity="0";
      document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); done(); } catch(e){ done(); }
      document.body.removeChild(ta);
    }
  }
  $("#btn-copy-tags").addEventListener("click", function(){
    var b = this;
    copyText(state.tags, function(){ flash(b, "COPIED \u2713"); });
  });
  $("#btn-copy-code").addEventListener("click", function(){
    var b = this;
    copyText(state.tags, function(){
      b.textContent = "\u2713 COPIED"; b.classList.add("ok");
      setTimeout(function(){ b.textContent = "\u29C9 COPY"; b.classList.remove("ok"); }, 1200);
    });
  });
  $("#btn-clear").addEventListener("click", function(){
    inTitle.value = ""; inDesc.value = ""; inUrl.value = ""; inSite.value = "";
    run(); inTitle.focus();
  });

  /* ================= TOOLKIT CATALOG ================= */
  var TOOLKIT = [
    { cat:"Meta & Snippets", glyph:"&lt;t&gt;", tools:[
      {id:"meta-tag-generator", name:"Meta Tag Generator", desc:"Builds the full <head> meta set — title, description, canonical, robots — from one form.", live:true},
      {id:"serp-snippet-preview", name:"SERP Snippet Preview", desc:"Shows exactly how your title and description will look in Google, desktop and mobile.", live:true},
      {id:"meta-length-checker", name:"Meta Length Checker", desc:"Checks title and description against Google's display limits with live meters.", live:true},
      {id:"title-length-checker", name:"Title Length Checker", desc:"Measures your title against the ~60-character display cutoff.", live:true},
      {id:"description-length-checker", name:"Description Length Checker", desc:"Measures your description against the ~160-character display cutoff.", live:true},
      {id:"robots-meta-generator", name:"Robots Meta Generator", desc:"Builds the robots meta tag — index/noindex, follow/nofollow, noarchive and friends."},
      {id:"x-robots-generator", name:"X Robots Generator", desc:"Generates the X-Robots-Tag HTTP header for PDFs, images and other non-HTML files."}
    ]},
    { cat:"Social & Sharing", glyph:"og:", tools:[
      {id:"open-graph-generator", name:"Open Graph Generator", desc:"Builds og: tags so links unfurl beautifully on Facebook, LinkedIn and Slack.", live:true},
      {id:"twitter-card-generator", name:"Twitter Card Generator", desc:"Builds twitter: card tags for rich X/Twitter link previews.", live:true},
      {id:"og-image-preview", name:"OG Image Preview", desc:"Previews your og:image at the exact 1.91:1 ratio social platforms crop to.", live:true},
      {id:"twitter-card-preview", name:"Twitter Card Preview", desc:"Previews your summary_large_image card the way X renders it.", live:true}
    ]},
    { cat:"Structured Data · Schema.org", glyph:"{}", tools:[
      {id:"faq-schema-generator", name:"FAQ Schema Generator", desc:"FAQPage JSON-LD from question/answer pairs — eligible for rich results."},
      {id:"article-schema-generator", name:"Article Schema Generator", desc:"Article/NewsArticle JSON-LD with headline, author, dates and image."},
      {id:"product-schema-generator", name:"Product Schema Generator", desc:"Product JSON-LD with offers, price, availability and aggregate rating."},
      {id:"organization-schema-generator", name:"Organization Schema Generator", desc:"Organization JSON-LD with logo, contacts and social profiles."},
      {id:"local-business-schema-generator", name:"Local Business Schema Generator", desc:"LocalBusiness JSON-LD with address, hours, geo and reviews."},
      {id:"person-schema-generator", name:"Person Schema Generator", desc:"Person JSON-LD with job title, affiliation and sameAs links."},
      {id:"event-schema-generator", name:"Event Schema Generator", desc:"Event JSON-LD with dates, venue, offers and organizer."},
      {id:"recipe-schema-generator", name:"Recipe Schema Generator", desc:"Recipe JSON-LD with ingredients, steps, time and nutrition."},
      {id:"video-schema-generator", name:"Video Schema Generator", desc:"VideoObject JSON-LD with thumbnail, duration and upload date."},
      {id:"breadcrumb-schema-generator", name:"Breadcrumb Schema Generator", desc:"BreadcrumbList JSON-LD from a trail of links."},
      {id:"website-schema-generator", name:"Website Schema Generator", desc:"WebSite JSON-LD with name, URL and publisher."},
      {id:"webpage-schema-generator", name:"Webpage Schema Generator", desc:"WebPage JSON-LD with title, description and date modified."},
      {id:"search-action-schema-generator", name:"Search Action Schema Generator", desc:"PotentialAction JSON-LD that enables a sitelinks search box."}
    ]},
    { cat:"Site Files & Directives", glyph:"/", tools:[
      {id:"robotstxt-generator", name:"Robots.txt Generator", desc:"Builds a robots.txt with directives, sitemaps and crawl rules."},
      {id:"xml-sitemap-generator", name:"XML Sitemap Generator", desc:"Builds an XML sitemap with URLs, lastmod, changefreq and priority."},
      {id:"html-sitemap-generator", name:"HTML Sitemap Generator", desc:"Builds a human-readable HTML sitemap from a URL list."},
      {id:"canonical-generator", name:"Canonical Generator", desc:"Builds the rel=canonical link to consolidate duplicate URLs.", live:true},
      {id:"hreflang-generator", name:"Hreflang Generator", desc:"Builds hreflang link sets for multilingual and multi-region pages."}
    ]},
    { cat:"Campaigns & URLs", glyph:"?utm", tools:[
      {id:"utm-builder", name:"UTM Builder", desc:"Builds campaign-tagged URLs with source, medium, campaign, term and content."},
      {id:"url-slug-generator", name:"URL Slug Generator", desc:"Turns any title into a clean, lowercase, hyphenated URL slug."}
    ]},
    { cat:"Content Analysis", glyph:"%", tools:[
      {id:"keyword-density-checker", name:"Keyword Density Checker", desc:"Measures how often a keyword appears, as a percentage of the whole."},
      {id:"word-frequency-analyzer", name:"Word Frequency Analyzer", desc:"Counts every word and ranks the most frequent."},
      {id:"text-ratio-calculator", name:"Text Ratio Calculator", desc:"Computes the HTML-to-text ratio of a page."},
      {id:"readability-score-calculator", name:"Readability Score Calculator", desc:"Scores readability with Flesch reading ease and grade level."}
    ]}
  ];

  /* assign global indices */
  var gIdx = 0;
  TOOLKIT.forEach(function(c){ c.tools.forEach(function(t){ gIdx++; t.idx = gIdx; }); });

  function renderToolkit(filter){
    filter = (filter || "").toLowerCase().trim();
    var html = "";
    TOOLKIT.forEach(function(c, ci){
      var visible = c.tools.filter(function(t){
        return !filter || (t.name + " " + t.desc).toLowerCase().indexOf(filter) !== -1;
      });
      if (!visible.length) return;
      html += '<div class="tk-cat" style="animation-delay:' + (ci*60) + 'ms">';
      html += '<div class="tk-cat-h"><span class="tk-glyph">' + c.glyph + '</span>' + c.cat + '<span class="tk-count">' + c.tools.length + ' TOOLS</span></div>';
      html += '<div class="tk-grid">';
      visible.forEach(function(t){
        html += '<a class="tk-item" id="' + t.id + '" href="#' + t.id + '">';
        html += '<span class="tk-idx">' + ("0"+t.idx).slice(-2) + '</span>';
        html += '<span class="tk-main"><span class="tk-name">' + t.name + (t.live ? ' <span class="tk-live">● LIVE IN STUDIO</span>' : '') + '</span>';
        html += '<span class="tk-desc">' + t.desc + '</span></span>';
        html += '</a>';
      });
      html += '</div></div>';
    });
    $("#toolkit").innerHTML = html || '<p class="tk-empty">No tools match \u201C' + escHtml(filter) + '\u201D.</p>';
  }
  $("#tk-filter").addEventListener("input", function(){ renderToolkit(this.value); });

  /* ---- init ---- */
  run();
  renderToolkit("");
})();
