
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

  /* ================= CONVERSION ENGINE ================= */
  var dcInput = $("#dc-input");
  var dcOut   = $("#dc-out");
  var sl = [$("#sl-1"),$("#sl-2"),$("#sl-3"),$("#sl-4")];
  var sv = [$("#sv-1"),$("#sv-2"),$("#sv-3"),$("#sv-4")];
  var ss = [$("#ss-1"),$("#ss-2"),$("#ss-3"),$("#ss-4")];

  var state = { tool:"csv", dir:"to", autoType:true, plainOut:"" };

  var TOOL_NAMES = { csv:"CSV", yaml:"YAML", xml:"XML" };

  var SAMPLES = {
    csv: {
      to: 'name,role,missions,active\n"Armstrong, Neil",Commander,3,true\nBuzz Aldrin,LM Pilot,2,true\nMichael Collins,CM Pilot,1,false',
      from: '[\n  {"name":"Armstrong, Neil","role":"Commander","missions":3,"active":true},\n  {"name":"Buzz Aldrin","role":"LM Pilot","missions":2,"active":true},\n  {"name":"Michael Collins","role":"CM Pilot","missions":1,"active":false}\n]'
    },
    yaml: {
      to: 'name: Apollo 11\nlaunched: 1969-07-16\nmanned: true\ncrew:\n  - name: Neil Armstrong\n    role: Commander\n  - name: Buzz Aldrin\n    role: LM Pilot\ntelemetry:\n  altitude: 111.1\n  velocity: 38940\n  signal: null\ntags: [space, moon, nasa]',
      from: '{\n  "name": "Apollo 11",\n  "manned": true,\n  "crew": [\n    {"name": "Neil Armstrong", "role": "Commander"},\n    {"name": "Buzz Aldrin", "role": "LM Pilot"}\n  ],\n  "tags": ["space", "moon", "nasa"]\n}'
    },
    xml: {
      to: '<?xml version="1.0" encoding="UTF-8"?>\n<mission name="Apollo 11" year="1969">\n  <crew>\n    <member role="Commander">Neil Armstrong</member>\n    <member role="LM Pilot">Buzz Aldrin</member>\n  </crew>\n  <manned>true</manned>\n  <altitude>111.1</altitude>\n</mission>',
      from: '{\n  "mission": {\n    "@name": "Apollo 11",\n    "@year": "1969",\n    "member": [\n      {"@role": "Commander", "#text": "Neil Armstrong"},\n      {"@role": "LM Pilot", "#text": "Buzz Aldrin"}\n    ],\n    "manned": true,\n    "altitude": 111.1\n  }\n}'
    }
  };

  function escHtml(s){ return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
  function fmtNum(n){ return n.toLocaleString("en-US"); }

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

  /* ---- JSON syntax highlighting ---- */
  function jsonHighlight(json){
    json = json.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function(match){
      var cls = "jh-num";
      if (/^"/.test(match)){ cls = /:$/.test(match) ? "jh-key" : "jh-str"; }
      else if (/true|false/.test(match)) cls = "jh-bool";
      else if (/null/.test(match)) cls = "jh-null";
      return '<span class="' + cls + '">' + match + '</span>';
    });
  }

  /* ---- CSV ---- */
  function parseCSV(text){
    var rows = [], row = [], field = "", inQ = false, i = 0;
    while (i < text.length){
      var c = text[i];
      if (inQ){
        if (c === '"'){
          if (text[i+1] === '"'){ field += '"'; i += 2; continue; }
          inQ = false; i++; continue;
        }
        field += c; i++; continue;
      }
      if (c === '"'){ inQ = true; i++; continue; }
      if (c === ','){ row.push(field); field = ""; i++; continue; }
      if (c === '\n'){ row.push(field); rows.push(row); row = []; field = ""; i++; continue; }
      if (c === '\r'){ i++; continue; }
      field += c; i++;
    }
    if (field !== "" || row.length){ row.push(field); rows.push(row); }
    return rows.filter(function(r){ return r.some(function(f){ return f.trim() !== ""; }); });
  }
  function coerceVal(s){
    if (s === "true") return true;
    if (s === "false") return false;
    if (s === "null") return null;
    if (/^-?\d+$/.test(s)) return parseInt(s,10);
    if (/^-?\d+\.\d+$/.test(s)) return parseFloat(s);
    return s;
  }
  function csvToJson(text){
    var rows = parseCSV(text);
    if (!rows.length) return { ok:true, output:"[]", records:0, fields:0 };
    var headers = rows[0].map(function(h){ return h.trim(); });
    var records = [];
    for (var i=1;i<rows.length;i++){
      var obj = {};
      for (var j=0;j<headers.length;j++){
        var v = rows[i][j] !== undefined ? rows[i][j] : "";
        obj[headers[j] || ("col"+(j+1))] = state.autoType ? coerceVal(v) : v;
      }
      records.push(obj);
    }
    return { ok:true, output: JSON.stringify(records, null, 2), records: records.length, fields: headers.length };
  }
  function jsonToCsv(text){
    var data;
    try { data = JSON.parse(text); } catch(e){ return { ok:false, error: e.message }; }
    var arr = Array.isArray(data) ? data : [data];
    if (!arr.length) return { ok:true, output:"", records:0, fields:0 };
    var headers = [];
    arr.forEach(function(obj){
      if (obj && typeof obj === "object" && !Array.isArray(obj)){
        Object.keys(obj).forEach(function(k){ if (headers.indexOf(k) === -1) headers.push(k); });
      }
    });
    function esc(v){
      if (v === null || v === undefined) return "";
      if (typeof v === "object") v = JSON.stringify(v);
      else v = String(v);
      if (/[",\n\r]/.test(v)) return '"' + v.replace(/"/g,'""') + '"';
      return v;
    }
    var lines = [headers.join(",")];
    arr.forEach(function(obj){
      lines.push(headers.map(function(h){ return esc(obj ? obj[h] : ""); }).join(","));
    });
    return { ok:true, output: lines.join("\n"), records: arr.length, fields: headers.length };
  }

  /* ---- YAML ---- */
  function parseYAML(text){
    var lines = text.split("\n").map(function(l, idx){
      return { indent: l.match(/^ */)[0].length, content: l.trim(), line: idx+1 };
    }).filter(function(l){
      return l.content !== "" && l.content.indexOf("#") !== 0;
    });
    var pos = 0;
    function parseScalar(s){
      s = s.trim();
      if (s === "" || s === "null" || s === "~") return null;
      if (s === "true") return true;
      if (s === "false") return false;
      if (/^-?\d+$/.test(s)) return parseInt(s,10);
      if (/^-?\d+\.\d+$/.test(s)) return parseFloat(s);
      if ((s[0] === '"' && s[s.length-1] === '"') || (s[0] === "'" && s[s.length-1] === "'")) return s.slice(1,-1);
      if (s[0] === "[" && s[s.length-1] === "]"){
        var inner = s.slice(1,-1).trim();
        if (inner === "") return [];
        return inner.split(",").map(function(x){ return parseScalar(x.trim()); });
      }
      if (s[0] === "{" && s[s.length-1] === "}"){
        var inner2 = s.slice(1,-1).trim();
        var obj = {};
        if (inner2 !== ""){
          inner2.split(",").forEach(function(pair){
            var ci = pair.indexOf(":");
            if (ci !== -1) obj[pair.slice(0,ci).trim()] = parseScalar(pair.slice(ci+1).trim());
          });
        }
        return obj;
      }
      return s;
    }
    function parseArray(indent){
      var arr = [];
      while (pos < lines.length && lines[pos].indent === indent && (lines[pos].content.indexOf("- ") === 0 || lines[pos].content === "-")){
        var item = lines[pos].content === "-" ? "" : lines[pos].content.slice(2);
        if (item.indexOf(": ") !== -1 || /:\s*$/.test(item)){
          var subIndent = indent + 2;
          lines[pos] = { indent: subIndent, content: item, line: lines[pos].line };
          arr.push(parseMap(subIndent));
        } else {
          arr.push(parseScalar(item));
          pos++;
        }
      }
      return arr;
    }
    function parseMap(indent){
      var map = {};
      while (pos < lines.length && lines[pos].indent === indent && lines[pos].content.indexOf("- ") !== 0 && lines[pos].content !== "-"){
        var l = lines[pos];
        var ci = l.content.indexOf(":");
        if (ci === -1){ pos++; continue; }
        var key = l.content.slice(0, ci).trim();
        var rest = l.content.slice(ci+1).trim();
        if (rest === ""){
          pos++;
          if (pos < lines.length){
            var nl = lines[pos];
            if (nl.indent > indent) map[key] = parseBlock(nl.indent);
            else if (nl.indent === indent && (nl.content.indexOf("- ") === 0 || nl.content === "-")) map[key] = parseArray(indent);
            else map[key] = null;
          } else map[key] = null;
        } else {
          map[key] = parseScalar(rest);
          pos++;
        }
      }
      return map;
    }
    function parseBlock(indent){
      if (pos >= lines.length || lines[pos].indent < indent) return null;
      if (lines[pos].content.indexOf("- ") === 0 || lines[pos].content === "-") return parseArray(indent);
      return parseMap(indent);
    }
    if (!lines.length) return { value: null };
    return { value: parseBlock(lines[0].indent) };
  }
  function yamlToJson(text){
    try {
      var result = parseYAML(text);
      var output = JSON.stringify(result.value, null, 2);
      var records = 0, fields = 0;
      if (Array.isArray(result.value)) records = result.value.length;
      else if (result.value && typeof result.value === "object") fields = Object.keys(result.value).length;
      return { ok:true, output: output, records: records, fields: fields };
    } catch(e){
      return { ok:false, error: e.message };
    }
  }
  function formatYamlScalar(v){
    if (v === null) return "null";
    if (typeof v === "boolean") return v ? "true" : "false";
    if (typeof v === "number") return String(v);
    var s = String(v);
    if (s === "" || /[:#\[\]{}&*!|>'"%@`]|^\s|\s$/.test(s)) return '"' + s.replace(/"/g,'\\"') + '"';
    return s;
  }
  function jsonToYamlLines(value, indent){
    var pad = "  ".repeat(indent);
    var lines = [];
    if (value === null) return [pad + "null"];
    if (typeof value !== "object") return [pad + formatYamlScalar(value)];
    if (Array.isArray(value)){
      if (!value.length) return [pad + "[]"];
      value.forEach(function(item){
        if (item !== null && typeof item === "object"){
          var sub = jsonToYamlLines(item, indent+1);
          var first = sub[0].slice((indent+1)*2);
          lines.push(pad + "- " + first);
          for (var i=1;i<sub.length;i++) lines.push(sub[i]);
        } else {
          lines.push(pad + "- " + formatYamlScalar(item));
        }
      });
      return lines;
    }
    var keys = Object.keys(value);
    if (!keys.length) return [pad + "{}"];
    keys.forEach(function(k){
      var v = value[k];
      if (v !== null && typeof v === "object"){
        lines.push(pad + k + ":");
        lines.push.apply(lines, jsonToYamlLines(v, indent+1));
      } else {
        lines.push(pad + k + ": " + formatYamlScalar(v));
      }
    });
    return lines;
  }
  function jsonToYaml(text){
    var data;
    try { data = JSON.parse(text); } catch(e){ return { ok:false, error: e.message }; }
    var lines = jsonToYamlLines(data, 0);
    var records = Array.isArray(data) ? data.length : (data && typeof data === "object" ? Object.keys(data).length : 0);
    return { ok:true, output: lines.join("\n"), records: records, fields: (data && typeof data === "object" && !Array.isArray(data)) ? Object.keys(data).length : 0 };
  }

  /* ---- XML ---- */
  function xmlToJson(text){
    var doc = new DOMParser().parseFromString(text, "application/xml");
    var err = doc.getElementsByTagName("parsererror");
    if (err.length) return { ok:false, error: err[0].textContent.split("\n")[0] };
    var root = doc.documentElement;
    function coerce(s){
      if (s === "true") return true;
      if (s === "false") return false;
      if (s === "null") return null;
      if (/^-?\d+$/.test(s)) return parseInt(s,10);
      if (/^-?\d+\.\d+$/.test(s)) return parseFloat(s);
      return s;
    }
    function nodeToObj(el){
      var obj = {}, hasAttr = false;
      for (var i=0;i<el.attributes.length;i++){
        obj["@" + el.attributes[i].name] = el.attributes[i].value;
        hasAttr = true;
      }
      var children = {}, textParts = [];
      for (var j=0;j<el.childNodes.length;j++){
        var node = el.childNodes[j];
        if (node.nodeType === 3){
          var t = node.nodeValue.trim();
          if (t) textParts.push(t);
        } else if (node.nodeType === 1){
          var name = node.nodeName;
          var val = nodeToObj(node);
          if (children[name] !== undefined){
            if (!Array.isArray(children[name])) children[name] = [children[name]];
            children[name].push(val);
          } else children[name] = val;
        }
      }
      var childKeys = Object.keys(children);
      if (childKeys.length === 0 && textParts.length > 0){
        var text = textParts.join(" ");
        if (hasAttr){ obj["#text"] = coerce(text); return obj; }
        return coerce(text);
      }
      childKeys.forEach(function(k){ obj[k] = children[k]; });
      if (textParts.length) obj["#text"] = coerce(textParts.join(" "));
      return obj;
    }
    var result = {};
    result[root.nodeName] = nodeToObj(root);
    var fields = root.attributes.length + root.children.length;
    return { ok:true, output: JSON.stringify(result, null, 2), records: root.children.length, fields: fields };
  }
  function jsonToXml(text){
    var data;
    try { data = JSON.parse(text); } catch(e){ return { ok:false, error: e.message }; }
    function esc(s){ return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
    function toXml(value, name, indent){
      var pad = "  ".repeat(indent);
      if (value === null) return pad + "<" + name + "/>";
      if (typeof value !== "object") return pad + "<" + name + ">" + esc(value) + "</" + name + ">";
      if (Array.isArray(value)) return value.map(function(item){ return toXml(item, name, indent); }).join("\n");
      var attrs = "", children = [], text = null;
      Object.keys(value).forEach(function(k){
        var v = value[k];
        if (k[0] === "@") attrs += " " + k.slice(1) + '="' + esc(v) + '"';
        else if (k === "#text") text = v;
        else children.push([k, v]);
      });
      if (children.length === 0 && text !== null) return pad + "<" + name + attrs + ">" + esc(text) + "</" + name + ">";
      if (children.length === 0 && text === null) return pad + "<" + name + attrs + "/>";
      var inner = children.map(function(kv){ return toXml(kv[1], kv[0], indent+1); }).join("\n");
      if (text !== null) inner = esc(text) + "\n" + inner;
      return pad + "<" + name + attrs + ">\n" + inner + "\n" + pad + "</" + name + ">";
    }
    var rootName = "root", rootVal = data;
    if (data && typeof data === "object" && !Array.isArray(data)){
      var keys = Object.keys(data);
      if (keys.length === 1){ rootName = keys[0]; rootVal = data[keys[0]]; }
    }
    var xml = '<?xml version="1.0" encoding="UTF-8"?>\n' + toXml(rootVal, rootName, 0);
    return { ok:true, output: xml, records: Array.isArray(data) ? data.length : 1, fields: (data && typeof data === "object") ? Object.keys(data).length : 0 };
  }

  /* ================= RUNNER ================= */
  function run(){
    var input = dcInput.value;
    var result;
    if (input.trim() === ""){
      state.plainOut = "";
      dcOut.innerHTML = '<span class="dc-placeholder">Paste ' + TOOL_NAMES[state.tool] + ' on the left \u2014 the ' + (state.dir === "to" ? "JSON" : TOOL_NAMES[state.tool]) + ' appears here as you type.</span>';
      $("#out-badge").textContent = "\u2014";
      setStat(sv[0],"0"); setStat(sv[1],"0"); setStat(sv[2],"0"); setStat(sv[3],"0");
      sv[3].classList.remove("bad","good");
      return;
    }
    if (state.dir === "to"){
      if (state.tool === "csv") result = csvToJson(input);
      else if (state.tool === "yaml") result = yamlToJson(input);
      else result = xmlToJson(input);
    } else {
      if (state.tool === "csv") result = jsonToCsv(input);
      else if (state.tool === "yaml") result = jsonToYaml(input);
      else result = jsonToXml(input);
    }
    if (!result.ok){
      state.plainOut = "";
      dcOut.innerHTML = '<span class="dc-error">\u2715 ' + escHtml(result.error) + '</span>';
      $("#out-badge").textContent = "ERROR";
      setStat(sv[0],"\u2014"); setStat(sv[1],"\u2014"); setStat(sv[2], fmtNum(input.length)); setStat(sv[3],"\u2014");
      sv[3].classList.add("bad");
      return;
    }
    sv[3].classList.remove("bad");
    state.plainOut = result.output;
    dcOut.innerHTML = state.dir === "to" ? jsonHighlight(result.output) : escHtml(result.output);
    $("#out-badge").textContent = (result.records || 0) + " REC";
    setStat(sv[0], fmtNum(result.records || 0));
    setStat(sv[1], fmtNum(result.fields || 0));
    setStat(sv[2], fmtNum(input.length));
    setStat(sv[3], fmtNum(result.output.length));
  }

  /* ---- options ---- */
  function renderOpts(){
    var holder = $("#opts-holder");
    holder.innerHTML = "";
    if (state.tool === "csv"){
      var b = document.createElement("button");
      b.type = "button"; b.className = "tgl";
      b.setAttribute("aria-pressed", String(state.autoType));
      b.textContent = "123 AUTO-TYPE";
      b.addEventListener("click", function(){
        state.autoType = !state.autoType;
        b.setAttribute("aria-pressed", String(state.autoType));
        run();
      });
      holder.appendChild(b);
    }
  }

  /* ---- direction ---- */
  function updateDirLabels(){
    var name = TOOL_NAMES[state.tool];
    $("#dir-to").textContent = name + " \u2192 JSON";
    $("#dir-from").textContent = "JSON \u2192 " + name;
    $("#dir-to").classList.toggle("dir-on", state.dir === "to");
    $("#dir-from").classList.toggle("dir-on", state.dir === "from");
    $("#in-label").textContent = state.dir === "to" ? name : "JSON";
    $("#out-label").textContent = state.dir === "to" ? "JSON" : name;
    $("#vs-badge").textContent = state.dir === "to" ? "\u2192" : "\u2190";
  }
  function setDir(d){ state.dir = d; updateDirLabels(); run(); }
  $("#dir-to").addEventListener("click", function(){ setDir("to"); });
  $("#dir-from").addEventListener("click", function(){ setDir("from"); });

  /* ---- tool switching ---- */
  function setTool(t){
    state.tool = t;
    $$(".c-tab").forEach(function(tab){
      var on = tab.getAttribute("data-mode") === t;
      tab.classList.toggle("is-on", on);
      tab.setAttribute("aria-pressed", String(on));
    });
    $("#analyzer").setAttribute("data-mode", t);
    renderOpts();
    updateDirLabels();
    dcInput.value = SAMPLES[t][state.dir];
    run();
  }
  $$(".c-tab").forEach(function(tab){
    tab.addEventListener("click", function(){ setTool(tab.getAttribute("data-mode")); });
  });

  dcInput.addEventListener("input", run);

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
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(val).then(done, done);
    else {
      var ta = document.createElement("textarea");
      ta.value = val; ta.style.position="fixed"; ta.style.opacity="0";
      document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); } catch(e){}
      document.body.removeChild(ta); done();
    }
  }
  $("#btn-copy-in").addEventListener("click", function(){
    var b = this;
    if (!dcInput.value){ flash(b, "INPUT EMPTY", true); return; }
    copyText(dcInput.value, function(){ flash(b, "COPIED \u2713"); });
  });
  $("#btn-copy-out").addEventListener("click", function(){
    var b = this;
    if (!state.plainOut){ flash(b, "OUTPUT EMPTY", true); return; }
    copyText(state.plainOut, function(){ flash(b, "COPIED \u2713"); });
  });
  $("#btn-clear").addEventListener("click", function(){
    dcInput.value = "";
    run();
    dcInput.focus();
  });
  $("#btn-sample").addEventListener("click", function(){
    dcInput.value = SAMPLES[state.tool][state.dir];
    run();
    dcInput.focus();
  });
  $("#btn-feed").addEventListener("click", function(){
    if (!state.plainOut){ flash(this, "OUTPUT EMPTY", true); return; }
    dcInput.value = state.plainOut;
    setDir(state.dir === "to" ? "from" : "to");
    flash(this, "REVERSED \u2713");
  });

  /* ---- init ---- */
  renderOpts();
  updateDirLabels();
  dcInput.value = SAMPLES.csv.to;
  run();
})();
