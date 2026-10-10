
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

  /* ================= REGEX ENGINE ================= */
  var rxPattern = $("#rx-pattern");
  var rxTest    = $("#rx-test");
  var rxBackdrop= $("#rx-backdrop");
  var rxResults = $("#rx-results");
  var rxPwrap   = $("#rx-pwrap");
  var rxCountBadge = $("#rx-count-badge");
  var sl = [$("#sl-1"),$("#sl-2"),$("#sl-3"),$("#sl-4")];
  var sv = [$("#sv-1"),$("#sv-2"),$("#sv-3"),$("#sv-4")];
  var ss = [$("#ss-1"),$("#ss-2"),$("#ss-3"),$("#ss-4")];

  var state = { mode:"tester", flags:{g:true,i:false,m:false,s:false,u:false} };
  var testerStats = { matches:0, groups:0, named:0, chars:0 };

  var FLAG_DEFS = [
    {f:"g", name:"global — find all matches"},
    {f:"i", name:"ignore case"},
    {f:"m", name:"multiline — ^ and $ per line"},
    {f:"s", name:"dotall — . matches newlines"},
    {f:"u", name:"unicode — enables \\p{…}"}
  ];

  var DEFAULT_PATTERN = "(?<y>\\d{4})-(?<m>\\d{2})-(?<d>\\d{2})";
  var DEFAULT_TEST = "Released 2024-01-15, patched 2024-02-20.\nNext milestone: 2026-08-01 \u2014 that's today.\nNot a date: 12-34-5678 (too short).";

  function escHtml(s){ return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
  function escAttr(s){ return String(s).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }

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

  /* ---- flags ---- */
  function buildFlags(){
    var html = "";
    FLAG_DEFS.forEach(function(fd){
      var on = state.flags[fd.f];
      html += '<button type="button" class="rx-flag' + (on ? " rx-flag-on" : "") + '" data-f="' + fd.f + '" title="' + fd.name + '">' + fd.f + '</button>';
    });
    $("#rx-flagrow").innerHTML = html;
    $$(".rx-flag").forEach(function(b){
      b.addEventListener("click", function(){
        var f = b.getAttribute("data-f");
        state.flags[f] = !state.flags[f];
        b.classList.toggle("rx-flag-on", state.flags[f]);
        updateFlagsDisplay();
        runTester();
      });
    });
  }
  function updateFlagsDisplay(){
    var s = "";
    FLAG_DEFS.forEach(function(fd){ if (state.flags[fd.f]) s += fd.f; });
    $("#rx-flags-disp").textContent = s || "\u2014";
  }

  /* ---- matching ---- */
  function runTester(){
    var pattern = rxPattern.value;
    var str = rxTest.value;

    if (pattern === ""){
      rxPwrap.classList.remove("err");
      rxBackdrop.innerHTML = escHtml(str) + "\n";
      rxResults.innerHTML = '<p class="rx-empty">Type a pattern above \u2014 matches light up here and in the test string the instant they exist. Flip a flag, add a group, break it on purpose: everything re-renders live.</p>';
      rxCountBadge.textContent = "\u2014";
      testerStats = { matches:0, groups:0, named:0, chars:str.length };
      updateStats();
      return;
    }

    var flagStr = "";
    FLAG_DEFS.forEach(function(fd){ if (state.flags[fd.f]) flagStr += fd.f; });

    var re;
    try { re = new RegExp(pattern, flagStr); rxPwrap.classList.remove("err"); }
    catch(e){
      rxPwrap.classList.add("err");
      rxBackdrop.innerHTML = escHtml(str) + "\n";
      rxResults.innerHTML = '<div class="rx-error">\u2715 ' + escHtml(e.message) + '</div>';
      rxCountBadge.textContent = "ERROR";
      testerStats = { matches:0, groups:0, named:0, chars:str.length };
      updateStats();
      return;
    }

    var matches = [], m, guard = 0;
    while ((m = re.exec(str)) !== null && guard < 5000){
      matches.push({ index:m.index, text:m[0], groups:m.slice(1), named:(m.groups || null) });
      if (m.index === re.lastIndex) re.lastIndex++;
      guard++;
      if (!re.global) break;
    }

    /* highlight */
    var html = "", last = 0;
    matches.forEach(function(mm){
      html += escHtml(str.slice(last, mm.index));
      html += '<mark class="rx-match">' + (escHtml(mm.text) || "&#8203;") + '</mark>';
      last = mm.index + mm.text.length;
    });
    html += escHtml(str.slice(last));
    rxBackdrop.innerHTML = html + "\n";

    renderMatches(matches);

    var gcount = matches.length ? matches[0].groups.length : 0;
    var ncount = (matches.length && matches[0].named) ? Object.keys(matches[0].named).length : 0;
    testerStats = { matches:matches.length, groups:gcount, named:ncount, chars:str.length };
    updateStats();
  }

  function renderMatches(matches){
    if (!matches.length){
      rxResults.innerHTML = '<p class="rx-empty">No matches for this pattern and text. Nudge the pattern, flip a flag, or add some text that should match.</p>';
      rxCountBadge.textContent = "0 MATCHES";
      return;
    }
    rxCountBadge.textContent = matches.length + " MATCH" + (matches.length === 1 ? "" : "ES");
    var html = '<div class="rx-count"><i></i>' + matches.length + ' MATCH' + (matches.length === 1 ? '' : 'ES') + ' FOUND</div>';
    matches.forEach(function(mm, i){
      html += '<div class="rx-m" style="animation-delay:' + (i * 35) + 'ms">';
      html += '<div class="rx-m-head"><span class="rx-m-idx">#' + ("0" + (i + 1)).slice(-2) + '</span><span class="rx-m-pos">index ' + mm.index + '</span><button type="button" class="rx-m-copy" data-copy="' + escAttr(mm.text) + '" aria-label="Copy match ' + (i + 1) + '">\u29C9</button></div>';
      html += '<code class="rx-m-text">' + (escHtml(mm.text) || '<em>zero-width</em>') + '</code>';
      if (mm.groups.length || mm.named){
        html += '<div class="rx-groups">';
        mm.groups.forEach(function(g, gi){
          html += '<div class="rx-g"><span class="rx-g-k">$' + (gi + 1) + '</span><code>' + (g === undefined ? "\u2205" : escHtml(g)) + '</code></div>';
        });
        if (mm.named){
          for (var k in mm.named){
            if (Object.prototype.hasOwnProperty.call(mm.named, k)){
              html += '<div class="rx-g rx-g-named"><span class="rx-g-k">&lt;' + escHtml(k) + '&gt;</span><code>' + (mm.named[k] === undefined ? "\u2205" : escHtml(mm.named[k])) + '</code></div>';
            }
          }
        }
        html += '</div>';
      }
      html += '</div>';
    });
    rxResults.innerHTML = html;
  }

  /* match copy delegation */
  rxResults.addEventListener("click", function(e){
    var btn = e.target.closest(".rx-m-copy");
    if (!btn) return;
    var val = btn.getAttribute("data-copy");
    var done = function(){
      btn.textContent = "\u2713"; btn.classList.add("ok");
      setTimeout(function(){ btn.textContent = "\u29C9"; btn.classList.remove("ok"); }, 1000);
    };
    if (navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(val).then(done, done);
    } else {
      var ta = document.createElement("textarea");
      ta.value = val; ta.style.position="fixed"; ta.style.opacity="0";
      document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); } catch(e2){}
      document.body.removeChild(ta); done();
    }
  });

  /* scroll sync for the highlight backdrop */
  rxTest.addEventListener("scroll", function(){
    rxBackdrop.scrollTop = rxTest.scrollTop;
    rxBackdrop.scrollLeft = rxTest.scrollLeft;
  }, {passive:true});

  rxPattern.addEventListener("input", runTester);
  rxTest.addEventListener("input", runTester);

  /* ================= CHEAT SHEET ================= */
  var CHEAT = [
    { cat:"Anchors", items:[
      { t:"^", n:"Start of string", d:"Position before the first character (line start with m).", p:"^Hello", s:"Hello world\nHello again" },
      { t:"$", n:"End of string", d:"Position after the last character (line end with m).", p:"world$", s:"Hello world\nworld" },
      { t:"\\b", n:"Word boundary", d:"Between a word char and a non-word char.", p:"\\bcat\\b", s:"cat concat category" },
      { t:"\\B", n:"Not a word boundary", d:"Inside a word.", p:"\\Bcat", s:"concatenate" }
    ]},
    { cat:"Character classes", items:[
      { t:".", n:"Any character", d:"Anything except newline (unless s flag).", p:"c.t", s:"cat cot cut ct" },
      { t:"\\d", n:"Digit", d:"Shorthand for [0-9].", p:"\\d+", s:"Order 42, item 7" },
      { t:"\\D", n:"Not a digit", d:"Shorthand for [^0-9].", p:"\\D+", s:"abc123def" },
      { t:"\\w", n:"Word character", d:"[A-Za-z0-9_].", p:"\\w+", s:"user_name 42" },
      { t:"\\W", n:"Not a word char", d:"[^A-Za-z0-9_].", p:"\\W+", s:"a!b@c#" },
      { t:"\\s", n:"Whitespace", d:"Space, tab, newline.", p:"a\\sb", s:"a b" },
      { t:"\\S", n:"Not whitespace", d:"Any non-whitespace char.", p:"\\S+", s:"a b c" },
      { t:"[abc]", n:"Character set", d:"Any one of the listed characters.", p:"[cb]at", s:"cat bat hat" },
      { t:"[^abc]", n:"Negated set", d:"Any character NOT listed.", p:"[^cb]at", s:"cat bat hat" },
      { t:"[a-z]", n:"Range", d:"Any character within the range.", p:"[a-c]+", s:"abcde xyz" },
      { t:"\\p{L}", n:"Unicode letter", d:"Any letter, any script (needs u flag).", p:"\\p{L}+", s:"\u0633\u0644\u0627\u0645 hello \u043C\u0438\u0440", f:"u" }
    ]},
    { cat:"Quantifiers", items:[
      { t:"*", n:"0 or more", d:"Greedy.", p:"ab*c", s:"ac abc abbc" },
      { t:"+", n:"1 or more", d:"Greedy.", p:"ab+c", s:"ac abc abbc" },
      { t:"?", n:"0 or 1", d:"Makes the previous token optional.", p:"colou?r", s:"color colour" },
      { t:"{n}", n:"Exactly n", d:"Exact repetition count.", p:"a{3}", s:"aa aaa aaaa" },
      { t:"{n,}", n:"n or more", d:"At least n times.", p:"a{2,}", s:"a aa aaa" },
      { t:"{n,m}", n:"Between n and m", d:"Bounded repetition.", p:"a{2,3}", s:"a aa aaa aaaa" },
      { t:"*?  +?", n:"Lazy", d:"Match as little as possible.", p:"<.+?>", s:"<a><b><c>" }
    ]},
    { cat:"Groups", items:[
      { t:"(\u2026)", n:"Capturing group", d:"Captures for $1, $2\u2026", p:"(\\w+)@(\\w+)", s:"user@host" },
      { t:"(?:\u2026)", n:"Non-capturing group", d:"Groups without capturing.", p:"(?:ab)+", s:"ababab" },
      { t:"(?<name>\u2026)", n:"Named group", d:"Access via groups.name.", p:"(?<y>\\d{4})-(?<m>\\d{2})", s:"2026-08" },
      { t:"\\1", n:"Backreference", d:"Matches the same text as group 1.", p:"(\\w+) \\1", s:"bye bye hello" }
    ]},
    { cat:"Lookaround", items:[
      { t:"(?=\u2026)", n:"Positive lookahead", d:"Asserts what follows, without consuming it.", p:"\\d+(?=px)", s:"10px 20em" },
      { t:"(?!\u2026)", n:"Negative lookahead", d:"Asserts what does NOT follow.", p:"\\d+(?!px)", s:"10px 20em" },
      { t:"(?<=\u2026)", n:"Positive lookbehind", d:"Asserts what precedes.", p:"(?<=\\$)\\d+", s:"$100 100" },
      { t:"(?<!\u2026)", n:"Negative lookbehind", d:"Asserts what does NOT precede.", p:"(?<!\\$)\\d+", s:"$100 100" }
    ]},
    { cat:"Escapes", items:[
      { t:"\\.", n:"Literal dot", d:"Escape a metacharacter to match it.", p:"\\d+\\.\\d+", s:"pi is 3.14" },
      { t:"\\\\", n:"Literal backslash", d:"Escapes a backslash.", p:"\\\\", s:"a\\b" },
      { t:"\\n  \\t", n:"Newline / tab", d:"Control characters.", p:"a\\tb", s:"a\tb" },
      { t:"\\uXXXX", n:"Unicode escape", d:"By code point.", p:"\\u0041", s:"ABC" },
      { t:"\\xHH", n:"Hex escape", d:"By hex byte value.", p:"\\x41", s:"ABC" }
    ]},
    { cat:"Flags", items:[
      { t:"g", n:"Global", d:"Find all matches, not just the first.", p:"a", s:"aaa", f:"g" },
      { t:"i", n:"Ignore case", d:"Case-insensitive matching.", p:"hello", s:"Hello HELLO hello", f:"i" },
      { t:"m", n:"Multiline", d:"^ and $ match each line.", p:"^a", s:"ab\nac\nba", f:"m" },
      { t:"s", n:"Dotall", d:". matches newlines too.", p:"a.b", s:"a\nb", f:"s" },
      { t:"u", n:"Unicode", d:"Full Unicode, enables \\p{\u2026}.", p:"\\p{L}+", s:"\u00e9\u00e8\u00ea", f:"u" }
    ]},
    { cat:"Common patterns", items:[
      { t:"email", n:"Email address", d:"Practical, not RFC-perfect.", p:"[\\w.+-]+@[\\w-]+\\.[\\w.]+", s:"Contact: jane.doe@example.co.uk" },
      { t:"url", n:"URL", d:"http(s) links.", p:"https?://[\\w./?=&%-]+", s:"See https://example.com/path?q=1 now" },
      { t:"ipv4", n:"IPv4 address", d:"Four dotted octets.", p:"\\b(\\d{1,3}\\.){3}\\d{1,3}\\b", s:"Server at 192.168.0.1 down" },
      { t:"date", n:"ISO date", d:"YYYY-MM-DD.", p:"\\d{4}-\\d{2}-\\d{2}", s:"Due 2026-08-01 soon" },
      { t:"hex", n:"Hex color", d:"#RGB or #RRGGBB.", p:"#(?:[0-9a-fA-F]{3}){1,2}\\b", s:"Use #0033FF or #03F" },
      { t:"uuid", n:"UUID", d:"Canonical 8-4-4-4-12 form.", p:"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}", s:"id 550e8400-e29b-41d4-a716-446655440000" },
      { t:"slug", n:"URL slug", d:"Lowercase, hyphenated.", p:"[a-z0-9]+(?:-[a-z0-9]+)*", s:"post: hello-world-2" }
    ]}
  ];

  function flattenCheat(){
    var arr = [];
    CHEAT.forEach(function(c){ c.items.forEach(function(it){ arr.push(it); }); });
    return arr;
  }

  function buildCheat(){
    var idx = 0;
    var html = "";
    CHEAT.forEach(function(cat){
      html += '<div class="cheat-cat"><div class="cheat-cat-h">' + escHtml(cat.cat) + '</div>';
      cat.items.forEach(function(it){
        html += '<div class="cheat-item" data-search="' + escAttr((it.t + " " + it.n + " " + it.d).toLowerCase()) + '">' +
          '<code class="cheat-tok">' + escHtml(it.t) + '</code>' +
          '<span class="cheat-name">' + escHtml(it.n) + '<small>' + escHtml(it.d) + '</small></span>' +
          '<button type="button" class="cheat-try" data-idx="' + idx + '">\u25B6 TRY</button>' +
        '</div>';
        idx++;
      });
      html += '</div>';
    });
    $("#cheat-grid").innerHTML = html;
    $$(".cheat-try").forEach(function(b){
      b.addEventListener("click", function(){
        var i = parseInt(b.getAttribute("data-idx"), 10);
        tryExample(flattenCheat()[i]);
      });
    });
  }

  function tryExample(it){
    rxPattern.value = it.p;
    rxTest.value = it.s;
    state.flags = {g:true,i:false,m:false,s:false,u:false};
    if (it.f){ for (var i=0;i<it.f.length;i++) state.flags[it.f[i]] = true; }
    buildFlags();
    updateFlagsDisplay();
    setMode("tester");
    runTester();
  }

  $("#cheat-filter").addEventListener("input", function(){
    var q = this.value.trim().toLowerCase();
    $$(".cheat-item").forEach(function(item){
      var hay = item.getAttribute("data-search");
      item.style.display = (!q || hay.indexOf(q) !== -1) ? "" : "none";
    });
    $$(".cheat-cat").forEach(function(cat){
      var any = false;
      cat.querySelectorAll(".cheat-item").forEach(function(it){ if (it.style.display !== "none") any = true; });
      cat.style.display = any ? "" : "none";
    });
  });

  /* ---- stats ---- */
  function updateStats(){
    if (state.mode === "tester"){
      setStat(sv[0], testerStats.matches);
      setStat(sv[1], testerStats.groups);
      setStat(sv[2], testerStats.named);
      setStat(sv[3], testerStats.chars);
      sl[0].textContent="Matches";       ss[0].textContent="FOUND LIVE";
      sl[1].textContent="Capture groups"; ss[1].textContent="PER MATCH";
      sl[2].textContent="Named groups";   ss[2].textContent="(?<NAME>\u2026)";
      sl[3].textContent="Test chars";     ss[3].textContent="IN THE LAB";
    } else {
      var flat = flattenCheat();
      var patterns = 0, flags = 0;
      CHEAT.forEach(function(c){
        if (c.cat === "Common patterns") patterns = c.items.length;
        if (c.cat === "Flags") flags = c.items.length;
      });
      setStat(sv[0], CHEAT.length);
      setStat(sv[1], flat.length);
      setStat(sv[2], patterns);
      setStat(sv[3], flags);
      sl[0].textContent="Categories";      ss[0].textContent="OF SYNTAX";
      sl[1].textContent="Tokens";          ss[1].textContent="DOCUMENTED";
      sl[2].textContent="Common patterns"; ss[2].textContent="READY TO TRY";
      sl[3].textContent="Flags";           ss[3].textContent="EXPLAINED";
    }
  }

  /* ---- mode switching ---- */
  function setMode(m){
    state.mode = m;
    $$(".c-tab").forEach(function(t){
      var on = t.getAttribute("data-mode") === m;
      t.classList.toggle("is-on", on);
      t.setAttribute("aria-pressed", String(on));
    });
    $("#analyzer").setAttribute("data-mode", m);
    $("#tester-view").style.display = m === "tester" ? "" : "none";
    $("#cheat-view").style.display = m === "cheat" ? "" : "none";
    updateStats();
  }
  $$(".c-tab").forEach(function(t){
    t.addEventListener("click", function(){ setMode(t.getAttribute("data-mode")); });
  });

  /* ---- init ---- */
  rxPattern.value = DEFAULT_PATTERN;
  rxTest.value = DEFAULT_TEST;
  buildFlags();
  updateFlagsDisplay();
  buildCheat();
  runTester();
})();
