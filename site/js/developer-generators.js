
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
     LIVE DEVELOPER GENERATORS (8 tools)
     ================================================================ */
  function clamp(v,a,b){ return Math.min(b,Math.max(a,v)); }
  function rnd(n){ return Math.floor(Math.random()*n); }
  function pick(a){ return a[rnd(a.length)]; }
  function pad2(n){ return String(n).padStart(2,"0"); }
  function item(v,sub,full){ return {v:String(v),sub:sub||"",full:full||null}; }
  function NIL(){ return null; }

  /* ---------------- ID engines ---------------- */
  function uuidv4(){
    if(window.crypto && crypto.randomUUID){ try{ return crypto.randomUUID(); }catch(e){} }
    var b=new Uint8Array(16);
    crypto.getRandomValues(b);
    b[6]=(b[6]&0x0f)|0x40;
    b[8]=(b[8]&0x3f)|0x80;
    var h=[].map.call(b,function(x){ return x.toString(16).padStart(2,"0"); }).join("");
    return h.slice(0,8)+"-"+h.slice(8,12)+"-"+h.slice(12,16)+"-"+h.slice(16,20)+"-"+h.slice(20);
  }
  var NANO_ALPHABET="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-";
  function nanoid(len){
    var b=new Uint8Array(len);
    crypto.getRandomValues(b);
    var out="";
    for(var i=0;i<len;i++) out+=NANO_ALPHABET[b[i]%64];
    return out;
  }

  /* ---------------- dummy data banks ---------------- */
  var FIRST=["Ava","Liam","Noah","Emma","Mia","Lucas","Ivy","Ethan","Nora","Owen","Ruby","Felix","Cora","Jonah","Isla","Milo"];
  var LAST=["Reyes","Carter","Nguyen","Patel","Kim","Rossi","Silva","Novak","Haas","Lund","Moreau","Tanaka","Okafor","Ivers","Bakker","Sorensen"];
  var CITIES=["Amsterdam","Lisbon","Toronto","Seoul","Nairobi","Oslo","Bogota","Kyoto","Vienna","Auckland","Porto","Krakow","Valencia","Hanoi","Montreal","Zagreb"];
  var MAILDOM=["example.com","mail.test","demo.dev"];
  function dummyName(){ return pick(FIRST)+" "+pick(LAST); }
  function dummyEmail(name){
    return name.toLowerCase().replace(/\s+/g,".")+"@"+pick(MAILDOM);
  }
  function dummyDate(){
    var y=2020+rnd(7), m=1+rnd(12), d=1+rnd(28);
    return y+"-"+pad2(m)+"-"+pad2(d);
  }
  function makeRecord(i){
    var name=dummyName();
    return {
      id:i+1,
      uuid:uuidv4(),
      name:name,
      email:dummyEmail(name),
      age:18+rnd(53),
      city:pick(CITIES),
      active:Math.random()<0.7,
      joined:dummyDate()
    };
  }

  /* ---------------- lorem engine ---------------- */
  var LOREM_WORDS=("lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum").split(" ");
  function loremSentence(){
    var n=6+rnd(9), words=[];
    for(var i=0;i<n;i++) words.push(pick(LOREM_WORDS));
    var s=words.join(" ");
    return s.charAt(0).toUpperCase()+s.slice(1)+".";
  }
  function loremParagraph(){
    var n=4+rnd(4), parts=[];
    for(var i=0;i<n;i++) parts.push(loremSentence());
    return parts.join(" ");
  }

  /* ---------------- Code 39 barcode engine ---------------- */
  var C39={
    "0":"101001101101","1":"110100101011","2":"101100101011","3":"110110010101",
    "4":"101001101011","5":"110100110101","6":"101100110101","7":"101001011011",
    "8":"110100101101","9":"101100101101","A":"110101001011","B":"101101001011",
    "C":"110110100101","D":"101011001011","E":"110101100101","F":"101101100101",
    "G":"101010011011","H":"110101001101","I":"101101001101","J":"101011001101",
    "K":"110101010011","L":"101101010011","M":"110110101001","N":"101011010011",
    "O":"110101101001","P":"101101101001","Q":"101010110011","R":"110101011001",
    "S":"101101011001","T":"101011011001","U":"110010101011","V":"100110101011",
    "W":"110011010101","X":"100101101011","Y":"110010110101","Z":"100110110101",
    "-":"100101011011",".":"110010101101"," ":"100110101101","*":"100101101101",
    "$":"100100100101","/":"100100101001","+":"100101001001","%":"101001001001"
  };
  function code39Chars(raw){
    return String(raw).toUpperCase().split("").filter(function(c){
      return c!=="*" && C39.hasOwnProperty(c);
    });
  }
  function code39Bits(chars){
    var full=["*"].concat(chars).concat(["*"]);
    var bits="";
    for(var i=0;i<full.length;i++){
      if(i>0) bits+="0";           /* narrow inter-character gap */
      bits+=C39[full[i]];
    }
    return bits;
  }
  function drawBarcode(chars){
    var bits=code39Bits(chars);
    var cv=document.createElement("canvas");
    var mw=2, h=84, quiet=24;
    cv.width=bits.length*mw+quiet*2;
    cv.height=h+28;
    var ctx=cv.getContext("2d");
    ctx.fillStyle="#fff"; ctx.fillRect(0,0,cv.width,cv.height);
    ctx.fillStyle="#141414";
    for(var i=0;i<bits.length;i++){
      if(bits[i]==="1") ctx.fillRect(quiet+i*mw,8,mw,h);
    }
    ctx.font="11px monospace"; ctx.textAlign="center";
    ctx.fillText(chars.join(""), cv.width/2, cv.height-6);
    return cv.toDataURL("image/png");
  }

  /* ---------------- generators ---------------- */
  function genUUID(s){
    var out=[];
    for(var i=0;i<8;i++){
      var u=uuidv4();
      out.push(item(s.case==="upper"?u.toUpperCase():u,"uuid v4 · 122 random bits"));
    }
    out._gauge={pos:50,label:"8 UUID V4 · CRYPTO RANDOM · CLICK ANY TO COPY"};
    return out;
  }
  function genGUID(s){
    var out=[];
    for(var i=0;i<8;i++){
      var u=uuidv4().toUpperCase();
      out.push(item(s.braces==="yes"?"{"+u+"}":u,"guid · uppercase"));
    }
    out._gauge={pos:50,label:"8 GUIDS · "+(s.braces==="yes"?"BRACED":"NO BRACES")+" · CLICK ANY TO COPY"};
    return out;
  }
  function genNano(s){
    var len=clamp(parseInt(s.len,10)||21,4,64);
    var out=[];
    for(var i=0;i<8;i++){
      out.push(item(nanoid(len),len+" chars · url-safe"));
    }
    out._gauge={pos:len/64*100,label:"8 NANO IDS · "+len+" CHARS · ALPHABET 64 SYMBOLS"};
    return out;
  }
  function genQR(s){
    var text=String(s.text||"").trim();
    if(!text) return {err:"ENTER TEXT OR URL"};
    if(typeof qrcode!=="function") return {err:"QR ENGINE NOT LOADED"};
    try{
      var qr=qrcode(0, s.ecc||"M");
      qr.addData(text);
      qr.make();
      return {url:qr.createDataURL(8,4), payload:text,
        gauge:{pos:(s.ecc==="L"?20:s.ecc==="M"?45:s.ecc==="Q"?70:90),
               label:"QR CODE · ECC "+(s.ecc||"M")+" · "+text.length+" CHARS ENCODED"}};
    }catch(e){ return {err:"PAYLOAD TOO LONG FOR QR"}; }
  }
  function genBarcode(s){
    var chars=code39Chars(s.text||"");
    if(!chars.length) return {err:"USE A–Z, 0–9, SPACE OR - . $ / + %"};
    if(chars.length>26) chars=chars.slice(0,26);
    return {url:drawBarcode(chars), payload:chars.join(""),
      gauge:{pos:chars.length/26*100, label:"CODE 39 · "+chars.length+" CHARACTERS · * START/STOP"}};
  }
  function genJSON(s){
    var n=clamp(parseInt(s.count,10)||3,1,20);
    var records=[];
    for(var i=0;i<n;i++) records.push(makeRecord(i));
    var full=JSON.stringify(records,null,2);
    var out=[];
    for(var j=0;j<8;j++){
      if(j<n){
        var compact=JSON.stringify(records[j]);
        out.push(item(compact.length>44?compact.slice(0,44)+"…":compact,"record "+(j+1)+" · click for full",compact));
      } else out.push(NIL());
    }
    out._full=full;
    out._gauge={pos:n/20*100,label:n+" RECORDS · JSON ARRAY · "+full.length.toLocaleString("en-US")+" CHARS"};
    return out;
  }
  function genCSV(s){
    var n=clamp(parseInt(s.rows,10)||5,1,50);
    var lines=["id,name,email,age,city,joined"];
    for(var i=0;i<n;i++){
      var r=makeRecord(i);
      lines.push([r.id,r.name,r.email,r.age,r.city,r.joined].join(","));
    }
    var full=lines.join("\n");
    var out=[];
    for(var j=0;j<8;j++){
      var li=lines[j];
      if(li!=null){
        out.push(item(li.length>44?li.slice(0,44)+"…":li,(j===0?"header":"row "+j),li));
      } else out.push(NIL());
    }
    out._full=full;
    out._gauge={pos:n/50*100,label:n+" ROWS + HEADER · CSV · CLICK ANY ROW TO COPY"};
    return out;
  }
  function genLorem(s){
    var count=clamp(parseInt(s.count,10)||3,1,s.type==="words"?300:12);
    var units=[], full;
    if(s.type==="paragraphs"){
      for(var i=0;i<count;i++) units.push(loremParagraph());
      full=units.join("\n\n");
    } else if(s.type==="sentences"){
      for(var j=0;j<count;j++) units.push(loremSentence());
      full=units.join(" ");
    } else {
      var words=[];
      for(var k=0;k<count;k++) words.push(pick(LOREM_WORDS));
      full=words.join(" ");
      var chunk=Math.ceil(count/8);
      for(var c=0;c<8;c++){
        var slice=words.slice(c*chunk,(c+1)*chunk).join(" ");
        units.push(slice);
      }
    }
    var out=[];
    for(var m=0;m<8;m++){
      var u=units[m];
      if(u){
        out.push(item(u.length>44?u.slice(0,44)+"…":u,u.split(" ").length+" words · click to copy",u));
      } else out.push(NIL());
    }
    out._full=full;
    out._gauge={pos:50,label:count+" "+s.type.toUpperCase()+" · "+full.split(/\s+/).length+" WORDS TOTAL"};
    return out;
  }
  function errItems(msg){
    var out=[item(msg,"fix the inputs above")];
    while(out.length<8) out.push(NIL());
    out._gauge={pos:0,label:msg};
    return out;
  }

  /* ---------------- tool registry ---------------- */
  var TOOLS=[
    { id:"uuid", tab:"UUID", name:"UUID Generator",
      def:function(){ return {"case":"lower"}; },
      fields:[
        {k:"case",label:"Letter case",type:"seg",full:true,opts:[["lower","lowercase"],["upper","UPPERCASE"]]}
      ], gen:genUUID, label:"UUID" },
    { id:"guid", tab:"GUID", name:"GUID Generator",
      def:function(){ return {braces:"yes"}; },
      fields:[
        {k:"braces",label:"Braces { }",type:"seg",full:true,opts:[["yes","With braces"],["no","No braces"]]}
      ], gen:genGUID, label:"GUID" },
    { id:"nanoid", tab:"Nano ID", name:"Nano ID Generator",
      def:function(){ return {len:"21"}; },
      fields:[
        {k:"len",label:"Length (4–64)",type:"number",min:4,max:64,full:true}
      ], gen:genNano, label:"NANO ID" },
    { id:"qr", tab:"QR Code", name:"QR Code Generator", visual:true,
      def:function(){ return {text:"https://IrisTool.com",size:"256",ecc:"M"}; },
      fields:[
        {k:"text",label:"Text or URL to encode",type:"text",ph:"https://…",full:true},
        {k:"size",label:"Output size",type:"select",opts:[["128","128 px"],["256","256 px"],["512","512 px"]]},
        {k:"ecc",label:"Error correction",type:"select",opts:[["L","L — smallest"],["M","M — balanced"],["Q","Q — robust"],["H","H — toughest"]]}
      ], gen:genQR },
    { id:"barcode", tab:"Barcode", name:"Barcode Generator", visual:true,
      def:function(){ return {text:"IrisTool-2026"}; },
      fields:[
        {k:"text",label:"Text — A–Z, 0–9, space, - . $ / + %",type:"text",ph:"IrisTool-2026",full:true}
      ], gen:genBarcode },
    { id:"json", tab:"Dummy JSON", name:"Dummy JSON Generator",
      def:function(){ return {count:"3"}; },
      fields:[
        {k:"count",label:"Records (1–20)",type:"number",min:1,max:20,full:true}
      ], gen:genJSON, label:"RECORD" },
    { id:"csv", tab:"Dummy CSV", name:"Dummy CSV Generator",
      def:function(){ return {rows:"5"}; },
      fields:[
        {k:"rows",label:"Rows (1–50)",type:"number",min:1,max:50,full:true}
      ], gen:genCSV, label:"ROW" },
    { id:"lorem", tab:"Lorem", name:"Lorem Ipsum Generator",
      def:function(){ return {type:"paragraphs",count:"3"}; },
      fields:[
        {k:"type",label:"Unit",type:"select",opts:[["paragraphs","Paragraphs"],["sentences","Sentences"],["words","Words"]]},
        {k:"count",label:"Count",type:"number",min:1,max:300}
      ], gen:genLorem, label:"BLOCK" }
  ];

  var state={};
  TOOLS.forEach(function(t){ state[t.id]=t.def(); });
  var activeTool=TOOLS[0];
  var currentItems=[];
  var currentFull=null;
  var lastVisualPayload="";
  var lastVisualUrl="";

  var tabsEl=$("#t-tabs"), formEl=$("#calc-form");
  var gSegs=$("#g-segs"), gMark=$("#g-mark"), gLegend=$("#g-legend"), gLabel=$("#gauge-label");
  var statsEl=$("#a-stats"), visEl=$("#a-vis"), visImg=$("#vis-img"), visCap=$("#vis-cap");
  var QUART=["#EFEFE9","#C9C9C0","#6E86FF","#0033FF"];

  function fieldHtml(f,s){
    var id="fld-"+activeTool.id+"-"+f.k;
    var lab='<label class="f-label" for="'+id+'">'+f.label+'</label>';
    var ctrl;
    if(f.type==="seg"){
      lab='<span class="f-label">'+f.label+'</span>';
      ctrl='<div class="seg" data-k="'+f.k+'" role="group" aria-label="'+f.label+'">'+f.opts.map(function(o){
        return '<button type="button" data-v="'+o[0]+'"'+(s[f.k]===o[0]?' class="on"':'')+'>'+o[1]+'</button>';
      }).join('')+'</div>';
    } else if(f.type==="select"){
      ctrl='<select class="f-select" id="'+id+'" data-k="'+f.k+'">'+f.opts.map(function(o){
        return '<option value="'+o[0]+'"'+(String(s[f.k])===o[0]?' selected':'')+'>'+o[1]+'</option>';
      }).join('')+'</select>';
    } else {
      ctrl='<input class="f-input" id="'+id+'" data-k="'+f.k+'" type="'+f.type+'" value="'+(s[f.k]!=null?s[f.k]:"")+'"'+
        (f.min!=null?' min="'+f.min+'"':'')+(f.max!=null?' max="'+f.max+'"':'')+(f.ph?' placeholder="'+f.ph+'"':'')+' maxlength="1200">';
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

  function setStat(i,l,v,sub,quiet){
    var el=$("#st-v-"+i);
    $("#st-l-"+i).textContent=l;
    $("#st-s-"+i).textContent=sub||"";
    v=String(v);
    if(el.textContent!==v){
      el.textContent=v;
      if(!quiet){
        el.classList.remove("bump"); void el.offsetWidth; el.classList.add("bump");
        setTimeout(function(){ el.classList.remove("bump"); },200);
      }
    }
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

  function setVisualMode(on){
    statsEl.style.display=on?"none":"";
    visEl.hidden=!on;
  }

  function renderVisual(){
    var res=activeTool.gen(state[activeTool.id]);
    if(res.err){
      visImg.removeAttribute("src");
      visCap.textContent=res.err;
      lastVisualPayload="";
      lastVisualUrl="";
      renderGauge({pos:0,label:res.err});
      return;
    }
    visImg.src=res.url;
    visImg.style.width=(parseInt(state[activeTool.id].size,10)||256)+"px";
    if(activeTool.id==="barcode") visImg.style.width="100%";
    visCap.textContent=res.payload.length>90?res.payload.slice(0,90)+"…":res.payload;
    lastVisualPayload=res.payload;
    lastVisualUrl=res.url;
    renderGauge(res.gauge);
  }

  function generateAll(){
    if(activeTool.visual){ renderVisual(); return; }
    var res=activeTool.gen(state[activeTool.id]);
    currentItems=[];
    currentFull=res._full||null;
    for(var i=0;i<8;i++){
      var it=res[i]||null;
      if(it){
        currentItems.push(it);
        setStat(i,activeTool.label+" "+pad2(i+1),it.v,it.sub||"click to copy");
      } else {
        currentItems.push(null);
        setStat(i,activeTool.label+" "+pad2(i+1),"—","");
      }
    }
    renderGauge(res._gauge||{pos:50,label:"READY"});
  }

  function selectTool(id){
    var t=TOOLS.filter(function(x){return x.id===id;})[0];
    if(!t) return;
    activeTool=t;
    setVisualMode(!!t.visual);
    renderTabs(); renderForm(); generateAll();
  }

  tabsEl.addEventListener("click", function(e){
    var b=e.target.closest(".t-tab"); if(!b) return;
    selectTool(b.getAttribute("data-tool"));
  });

  formEl.addEventListener("input", function(e){
    var k=e.target.getAttribute("data-k"); if(!k) return;
    state[activeTool.id][k]=e.target.value;
    generateAll();
  });
  formEl.addEventListener("click", function(e){
    var b=e.target.closest(".seg button"); if(!b) return;
    state[activeTool.id][b.closest(".seg").getAttribute("data-k")]=b.getAttribute("data-v");
    renderForm(); generateAll();
  });

  /* click a result cell to copy that single result */
  var copyTimers={};
  statsEl.addEventListener("click", function(e){
    var cell=e.target.closest(".astat"); if(!cell) return;
    var idx=$$(".astat").indexOf(cell);
    var it=currentItems[idx];
    if(!it) return;
    var payload=it.full||it.v;
    function done(ok){
      setStat(idx,$("#st-l-"+idx).textContent,it.v,ok?"COPIED ✓":"COPY FAILED");
      clearTimeout(copyTimers[idx]);
      copyTimers[idx]=setTimeout(function(){
        setStat(idx,$("#st-l-"+idx).textContent,it.v,it.sub||"click to copy");
      },1400);
    }
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(payload).then(function(){ done(true); },function(){ done(false); });
    } else {
      var ta=document.createElement("textarea");
      ta.value=payload; ta.style.position="fixed"; ta.style.left="-9999px";
      document.body.appendChild(ta); ta.select();
      var ok=false; try{ ok=document.execCommand("copy"); }catch(err){}
      document.body.removeChild(ta);
      done(ok);
    }
  });

  /* click the visual preview to copy its payload */
  visImg.addEventListener("click", function(){
    if(!lastVisualPayload) return;
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(lastVisualPayload).then(
        function(){ visCap.textContent="COPIED ✓ "+visCap.textContent.replace(/^COPIED ✓ /,""); },
        function(){}
      );
    }
  });

  $("#btn-gen").addEventListener("click", generateAll);

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

  /* ================= RESULTS AS A TABLE ================= */
  function esc(s){ return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }

  function resultsRows(){
    if(activeTool.visual){
      return lastVisualPayload?[[activeTool.name, lastVisualPayload, "payload"]] : [];
    }
    return currentItems.filter(Boolean).map(function(it,i){
      return [activeTool.label+" "+pad2(i+1), it.full||it.v, it.sub||""];
    });
  }

  function copyPayload(){
    if(activeTool.visual) return lastVisualPayload;
    if(currentFull) return currentFull;
    return currentItems.filter(Boolean).map(function(it){ return it.full||it.v; }).join("\n");
  }

  function buildTSV(rows){
    var lines=["IrisTool — Developer Generators","Tool: "+activeTool.name,""];
    lines.push("#\tResult\tNote");
    rows.forEach(function(r){ lines.push(r.join("\t")); });
    lines.push("");
    lines.push(gLabel.textContent);
    lines.push("Generated locally in the browser.");
    return lines.join("\n");
  }

  function buildTableHTML(rows){
    var h='<div style="font-family:Arial,Helvetica,sans-serif">';
    h+='<p style="margin:0 0 8px;font-size:13px;color:#6C6C64">IrisTool — Developer Generators · <b style="color:#141414">'+esc(activeTool.name)+'</b></p>';
    h+='<table border="1" cellspacing="0" cellpadding="6" style="border-collapse:collapse;font-size:13px;border-color:#E4E4DC">';
    h+='<tr style="background:#0033FF;color:#FFFFFF;text-align:left">'
      +'<th style="padding:8px 14px">#</th>'
      +'<th style="padding:8px 14px">Result</th>'
      +'<th style="padding:8px 14px">Note</th></tr>';
    rows.forEach(function(r,i){
      h+='<tr style="background:'+(i%2?"#FCFCFA":"#FFFFFF")+'">'
        +'<td style="padding:6px 14px">'+esc(r[0])+'</td>'
        +'<td style="padding:6px 14px;color:#0033FF;font-weight:bold;word-break:break-all">'+esc(r[1])+'</td>'
        +'<td style="padding:6px 14px;color:#6C6C64">'+esc(r[2])+'</td></tr>';
    });
    h+='</table>';
    h+='<p style="margin:8px 0 0;font-size:11px;color:#9A9A92">Generated locally in the browser.</p></div>';
    return h;
  }

  var btnCopy=$("#btn-copy");
  btnCopy.addEventListener("click", function(){
    var payload=copyPayload();
    if(!payload){ flash(btnCopy,"NOTHING TO COPY",true); return; }
    var rows=resultsRows();
    var html=buildTableHTML(rows);

    function fallbackCopy(){
      if(activeTool.visual || (currentFull && currentFull.length>2000)){
        var ta=document.createElement("textarea");
        ta.value=payload; ta.style.position="fixed"; ta.style.left="-9999px";
        document.body.appendChild(ta); ta.select();
        var okP=false; try{ okP=document.execCommand("copy"); }catch(err){}
        document.body.removeChild(ta);
        flash(btnCopy, okP?"COPIED ✓":"USE CTRL+C", !okP);
        return;
      }
      var holder=document.createElement("div");
      holder.innerHTML=html;
      holder.style.position="fixed";
      holder.style.left="-9999px";
      holder.style.top="0";
      document.body.appendChild(holder);
      var range=document.createRange();
      range.selectNode(holder);
      var sel=window.getSelection();
      sel.removeAllRanges(); sel.addRange(range);
      var ok=false;
      try{ ok=document.execCommand("copy"); }catch(err){ ok=false; }
      sel.removeAllRanges();
      document.body.removeChild(holder);
      flash(btnCopy, ok ? "TABLE COPIED ✓" : "USE CTRL+C", !ok);
    }

    if(navigator.clipboard && window.ClipboardItem && navigator.clipboard.write && !currentFull){
      try{
        var tsv=buildTSV(rows);
        var clipItem=new ClipboardItem({
          "text/html":  new Blob([html],{type:"text/html"}),
          "text/plain": new Blob([tsv],{type:"text/plain"})
        });
        navigator.clipboard.write([clipItem]).then(
          function(){ flash(btnCopy,"TABLE COPIED ✓"); },
          function(){
            navigator.clipboard.writeText(payload).then(
              function(){ flash(btnCopy,"COPIED ✓"); },
              fallbackCopy
            );
          }
        );
      }catch(e){ fallbackCopy(); }
    } else if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(payload).then(
        function(){ flash(btnCopy,"COPIED ✓"); },
        fallbackCopy
      );
    } else {
      fallbackCopy();
    }
  });

  var btnDl=$("#btn-download");
  btnDl.addEventListener("click", function(){
    var a=document.createElement("a");
    if(activeTool.visual){
      if(!lastVisualUrl){ flash(btnDl,"NOTHING TO SAVE",true); return; }
      a.href=lastVisualUrl;
      a.download=(activeTool.id==="qr"?"IrisTool-qr.png":"IrisTool-barcode.png");
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      flash(btnDl,"IMAGE SAVED ✓");
      return;
    }
    var txt=currentFull||copyPayload();
    if(!txt){ flash(btnDl,"NOTHING TO SAVE",true); return; }
    var ext=activeTool.id==="json"?".json":activeTool.id==="csv"?".csv":".txt";
    var blob=new Blob([txt],{type:"text/plain;charset=utf-8"});
    var url=URL.createObjectURL(blob);
    a.href=url; a.download="IrisTool-"+activeTool.id+ext;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function(){ URL.revokeObjectURL(url); },500);
    flash(btnDl,"SAVED ✓");
  });

  $("#btn-reset").addEventListener("click", function(){
    state[activeTool.id]=activeTool.def();
    renderForm(); generateAll();
  });

  /* ---- boot ---- */
  renderTabs(); renderForm(); setVisualMode(!!activeTool.visual); generateAll();
})();
