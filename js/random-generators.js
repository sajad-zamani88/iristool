
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
     LIVE RANDOM GENERATORS (11 tools)
     ================================================================ */
  function clamp(v,a,b){ return Math.min(b,Math.max(a,v)); }
  function rnd(n){ return Math.floor(Math.random()*n); }
  function pick(a){ return a[rnd(a.length)]; }
  function pad2(n){ return String(n).padStart(2,"0"); }
  function shuffle(arr){
    var a=arr.slice();
    for(var i=a.length-1;i>0;i--){
      var j=rnd(i+1), t=a[i]; a[i]=a[j]; a[j]=t;
    }
    return a;
  }
  function item(v,sub,full){ return {v:String(v),sub:sub||"",full:full||null}; }
  function NIL(){ return null; }

  /* ---------------- data banks ---------------- */
  var QUOTES=[
    ["The best way to predict the future is to invent it.","Alan Kay"],
    ["Simplicity is the ultimate sophistication.","Leonardo da Vinci"],
    ["Make it work, make it right, make it fast.","Kent Beck"],
    ["Programs must be written for people to read.","Harold Abelson"],
    ["The only way to do great work is to love what you do.","Steve Jobs"],
    ["Stay hungry, stay foolish.","Steve Jobs"],
    ["It always seems impossible until it's done.","Nelson Mandela"],
    ["Well begun is half done.","Aristotle"],
    ["Action is the foundational key to all success.","Pablo Picasso"],
    ["Less is more.","Ludwig Mies van der Rohe"],
    ["Perfection is achieved when there is nothing left to take away.","Antoine de Saint-Exupéry"],
    ["First, solve the problem. Then, write the code.","John Johnson"],
    ["Code is like humor. When you have to explain it, it's bad.","Cory House"],
    ["Talk is cheap. Show me the code.","Linus Torvalds"],
    ["The function of good software is to make the complex appear simple.","Grady Booch"],
    ["Any sufficiently advanced technology is indistinguishable from magic.","Arthur C. Clarke"],
    ["In the middle of difficulty lies opportunity.","Albert Einstein"],
    ["Creativity is intelligence having fun.","Albert Einstein"],
    ["What we know is a drop, what we don't know is an ocean.","Isaac Newton"],
    ["Luck is what happens when preparation meets opportunity.","Seneca"],
    ["Done is better than perfect.","Sheryl Sandberg"],
    ["Everything you can imagine is real.","Pablo Picasso"]
  ];
  var EMOJIS={
    smileys:["😀","😄","😁","😆","🥰","😎","🤩","🥳","😜","🤗","🫠","😇","🤓","😌","🙃","😉"],
    animals:["🐶","🐱","🦊","🐼","🐸","🦁","🐯","🐨","🐷","🐵","🦄","🐝","🦋","🐢","🐙","🦉"],
    food:["🍕","🍔","🍟","🌮","🍣","🍩","🍪","🍦","🍓","🍉","🥑","🍿","☕","🧁","🍜","🥐"],
    activities:["⚽","🏀","🎮","🎲","🎸","🎨","🚴","🏄","🎯","🎳","🏆","🎁","🪁","🎤","🧩","🎬"],
    hearts:["❤️","🧡","💛","💚","💙","💜","🤍","💖","💘","💝","💫","⭐","✨","🌈","🔥","🌟"],
    symbols:["⚡","❄️","🍀","🎵","💎","🎈","🌙","☀️","❗","💯","🎀","🧿","🪄","🔮","🧲","🎐"]
  };
  var VOWELS="AEIOU".split(""), CONSONANTS="BCDFGHJKLMNPQRSTVWXYZ".split(""), ALLL="ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  var MONTHS=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  var WEEKDAYS=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

  function parseDateInput(s){
    if(!s) return null;
    var p=String(s).slice(0,10).split("-").map(Number);
    if(p.length!==3||!p[0]) return null;
    var d=new Date(p[0],p[1]-1,p[2]);
    return isNaN(d.getTime())?null:d;
  }
  function fmtDate(d){
    return MONTHS[d.getMonth()]+" "+d.getDate()+", "+d.getFullYear();
  }
  function fmtDateShort(d){
    return MONTHS[d.getMonth()]+" "+d.getDate()+", "+d.getFullYear();
  }

  /* ---------------- generators (each returns 8 items) ---------------- */
  function genNumber(s){
    var a=parseInt(s.min,10), b=parseInt(s.max,10);
    if(!isFinite(a)||!isFinite(b)) return errItems("ENTER MIN AND MAX");
    if(a>b){ var t=a; a=b; b=t; }
    var span=b-a+1;
    var pool=[], guard=0, out=[];
    var seen={};
    while(out.length<8 && guard<500){
      guard++;
      var v=a+rnd(span);
      if(seen[v] && span>=8) continue;
      if(seen[v]) { out.push(item(v,"range "+a+"–"+b)); continue; }
      seen[v]=1; out.push(item(v,"range "+a+"–"+b));
    }
    while(out.length<8) out.push(NIL());
    out._gauge={pos:span>1?((out[0].v-a)/(span-1))*100:50, label:"8 DRAWS · RANGE "+a+"–"+b};
    return out;
  }
  function genLetter(s){
    var bank=s.type==="vowels"?VOWELS:s.type==="consonants"?CONSONANTS:ALLL;
    var out=[];
    for(var i=0;i<8;i++){
      var L=pick(bank);
      if(s.case==="lower") L=L.toLowerCase();
      out.push(item(L,s.case+"case · "+s.type));
    }
    out._gauge={pos:(bank.indexOf(out[0].v.toUpperCase())+1)/26*100, label:"8 LETTERS · "+s.type.toUpperCase()+" · "+s.case.toUpperCase()};
    return out;
  }
  function rgb2hsl(r,g,b){
    r/=255;g/=255;b/=255;
    var mx=Math.max(r,g,b), mn=Math.min(r,g,b), h=0;
    if(mx!==mn){
      var d=mx-mn;
      if(mx===r) h=((g-b)/d+(g<b?6:0));
      else if(mx===g) h=(b-r)/d+2;
      else h=(r-g)/d+4;
      h*=60;
    }
    return h;
  }
  function genColor(s){
    var out=[];
    for(var i=0;i<8;i++){
      var r=rnd(256), g=rnd(256), b=rnd(256);
      var hex="#"+[r,g,b].map(function(c){ return c.toString(16).padStart(2,"0").toUpperCase(); }).join("");
      out.push(item(hex,"rgb("+r+", "+g+", "+b+")"));
      if(i===0) out._hue={r:r,g:g,b:b};
    }
    var c0=out._hue;
    out._gauge={pos:rgb2hsl(c0.r,c0.g,c0.b)/360*100, label:"8 COLORS · CLICK ANY HEX TO COPY"};
    return out;
  }
  function genEmoji(s){
    var bank=EMOJIS[s.cat]||EMOJIS.smileys;
    var out=[];
    var seen={};
    var guard=0;
    while(out.length<8 && guard<300){
      guard++;
      var e=pick(bank);
      if(seen[e] && bank.length>=8) continue;
      seen[e]=1;
      out.push(item(e,s.cat));
    }
    while(out.length<8) out.push(NIL());
    out._gauge={pos:50, label:"8 EMOJI · CATEGORY: "+s.cat.toUpperCase()};
    return out;
  }
  function genDate(s){
    var A=parseDateInput(s.from), B=parseDateInput(s.to);
    if(!A||!B) return errItems("ENTER BOTH DATES");
    if(A>B){ var t=A; A=B; B=t; }
    var span=B.getTime()-A.getTime();
    var out=[];
    for(var i=0;i<8;i++){
      var d=new Date(A.getTime()+Math.random()*span);
      out.push(item(fmtDate(d),WEEKDAYS[d.getDay()],fmtDate(d)));
      if(i===0) out._pos=(d.getTime()-A.getTime())/Math.max(span,1)*100;
    }
    out._gauge={pos:out._pos||50, label:"8 DATES · "+fmtDateShort(A)+" → "+fmtDateShort(B)};
    return out;
  }
  function genTime(s){
    var out=[];
    for(var i=0;i<8;i++){
      var mins=rnd(1440), h=Math.floor(mins/60), m=mins%60, txt;
      if(s.fmt==="12"){
        var ap=h<12?"AM":"PM", h12=h%12; if(h12===0) h12=12;
        txt=h12+":"+pad2(m)+" "+ap;
      } else {
        txt=pad2(h)+":"+pad2(m);
      }
      out.push(item(txt,s.fmt+"-hour"));
      if(i===0) out._pos=mins/1440*100;
    }
    out._gauge={pos:out._pos||50, label:"8 TIMES · "+s.fmt+"-HOUR FORMAT"};
    return out;
  }
  function genQuote(s){
    var pool=shuffle(QUOTES), out=[];
    for(var i=0;i<8;i++){
      var q=pool[i%pool.length];
      var short=q[0].length>42?q[0].slice(0,42)+"…":q[0];
      out.push(item(short,"— "+q[1],'"'+q[0]+'" — '+q[1]));
    }
    out._gauge={pos:50, label:"8 QUOTES · CLICK ANY TO COPY WITH AUTHOR"};
    return out;
  }
  function parseList(str){
    return String(str||"").split(/[,\n;]+/).map(function(x){ return x.trim(); }).filter(Boolean);
  }
  function genTeam(s){
    var names=parseList(s.names);
    if(names.length<2) return errItems("ENTER AT LEAST 2 NAMES");
    var n=clamp(parseInt(s.teams,10)||2,1,8);
    var teams=[];
    for(var i=0;i<n;i++) teams.push([]);
    shuffle(names).forEach(function(name,idx){ teams[idx%n].push(name); });
    var out=[];
    for(var j=0;j<8;j++){
      if(j<n){
        var list=teams[j].join(", ");
        out.push(item(list.length>34?list.slice(0,34)+"…":list, teams[j].length+" member"+(teams[j].length===1?"":"s"), list));
      } else out.push(NIL());
    }
    out._gauge={pos:n/8*100, label:n+" TEAMS · "+names.length+" NAMES · DEALT ROUND-ROBIN"};
    return out;
  }
  function genDice(s){
    var n=clamp(parseInt(s.count,10)||1,1,8);
    var sides=parseInt(s.sides,10)||6;
    var out=[], total=0;
    for(var i=0;i<8;i++){
      if(i<n){
        var face=1+rnd(sides);
        total+=face;
        out.push(item(face,"d"+sides));
      } else out.push(NIL());
    }
    out._gauge={pos:(total/n)/sides*100, label:"TOTAL "+total+" · "+n+"D"+sides+" · AVG "+(total/n).toFixed(1)};
    return out;
  }
  function genCoin(s){
    var out=[], heads=0;
    for(var i=0;i<8;i++){
      var h=Math.random()<0.5;
      if(h) heads++;
      out.push(item(h?"HEADS":"TAILS","flip "+(i+1)));
    }
    out._gauge={pos:heads/8*100, label:"8 FLIPS · "+heads+" HEADS · "+(8-heads)+" TAILS"};
    return out;
  }
  function genWheel(s){
    var opts=parseList(s.options);
    if(opts.length<2) return errItems("ENTER AT LEAST 2 OPTIONS");
    var spun=shuffle(opts), out=[];
    for(var i=0;i<8;i++){
      if(i<spun.length){
        out.push(i===0?item(spun[0],"winner ★ · "+opts.length+" options",spun[0])
                       :item(spun[i],"alternate",spun[i]));
      } else out.push(NIL());
    }
    out._gauge={pos:1/opts.length*100, label:"WINNER FROM "+opts.length+" OPTIONS · EACH EQUALLY LIKELY"};
    return out;
  }
  function errItems(msg){
    var out=[item(msg,"fix the inputs above")];
    while(out.length<8) out.push(NIL());
    out._gauge={pos:0, label:msg};
    return out;
  }

  /* ---------------- tool registry ---------------- */
  var TOOLS=[
    { id:"number", tab:"Number", name:"Random Number Generator",
      def:function(){ return {min:"1",max:"100"}; },
      fields:[
        {k:"min",label:"Minimum",type:"number"},
        {k:"max",label:"Maximum",type:"number"}
      ], gen:genNumber, label:"DRAW" },
    { id:"letter", tab:"Letter", name:"Random Letter Generator",
      def:function(){ return {type:"any","case":"upper"}; },
      fields:[
        {k:"type",label:"Letters",type:"select",opts:[["any","Any letter"],["vowels","Vowels only"],["consonants","Consonants only"]]},
        {k:"case",label:"Case",type:"select",opts:[["upper","UPPERCASE"],["lower","lowercase"]]}
      ], gen:genLetter, label:"LETTER" },
    { id:"color", tab:"Color", name:"Random Color Generator",
      def:function(){ return {}; },
      fields:[
        {k:"hint",label:"Full-spectrum draw — 8 colors per roll",type:"text",ph:"Press Generate to roll again",full:true}
      ], gen:genColor, label:"COLOR", noInput:true },
    { id:"emoji", tab:"Emoji", name:"Random Emoji Generator",
      def:function(){ return {cat:"animals"}; },
      fields:[
        {k:"cat",label:"Category",type:"select",full:true,opts:[["smileys","Smileys"],["animals","Animals"],["food","Food"],["activities","Activities"],["hearts","Hearts & Stars"],["symbols","Symbols"]]}
      ], gen:genEmoji, label:"EMOJI" },
    { id:"date", tab:"Date", name:"Random Date Generator",
      def:function(){ return {from:"2020-01-01",to:"2030-12-31"}; },
      fields:[
        {k:"from",label:"From date",type:"date"},
        {k:"to",label:"To date",type:"date"}
      ], gen:genDate, label:"DATE" },
    { id:"time", tab:"Time", name:"Random Time Generator",
      def:function(){ return {fmt:"24"}; },
      fields:[
        {k:"fmt",label:"Clock format",type:"seg",full:true,opts:[["12","12-hour"],["24","24-hour"]]}
      ], gen:genTime, label:"TIME" },
    { id:"quote", tab:"Quote", name:"Random Quote Generator",
      def:function(){ return {}; },
      fields:[
        {k:"hint",label:"Curated bank of 22 quotes — 8 per draw",type:"text",ph:"Press Generate to roll again",full:true}
      ], gen:genQuote, label:"QUOTE", noInput:true },
    { id:"team", tab:"Team", name:"Random Team Generator",
      def:function(){ return {names:"Alex, Sam, Jordan, Taylor, Casey, Morgan, Riley, Quinn, Avery, Drew",teams:"2"}; },
      fields:[
        {k:"names",label:"Names — separated by commas",type:"text",ph:"Alex, Sam, Jordan…",full:true},
        {k:"teams",label:"Number of teams (1–8)",type:"number",min:1,max:8}
      ], gen:genTeam, label:"TEAM" },
    { id:"dice", tab:"Dice", name:"Dice Roller",
      def:function(){ return {count:"2",sides:"6"}; },
      fields:[
        {k:"count",label:"Dice count (1–8)",type:"number",min:1,max:8},
        {k:"sides",label:"Sides",type:"select",opts:[["4","d4"],["6","d6"],["8","d8"],["10","d10"],["12","d12"],["20","d20"]]}
      ], gen:genDice, label:"DIE" },
    { id:"coin", tab:"Coin", name:"Coin Flip",
      def:function(){ return {}; },
      fields:[
        {k:"hint",label:"Eight fair coins per draw",type:"text",ph:"Press Generate to flip again",full:true}
      ], gen:genCoin, label:"FLIP", noInput:true },
    { id:"wheel", tab:"Wheel", name:"Wheel Spinner",
      def:function(){ return {options:"Pizza, Sushi, Burger, Tacos, Pasta, Salad"}; },
      fields:[
        {k:"options",label:"Options — separated by commas",type:"text",ph:"Pizza, Sushi, Burger…",full:true}
      ], gen:genWheel, label:"PICK" }
  ];

  var state={};
  TOOLS.forEach(function(t){ state[t.id]=t.def(); });
  var activeTool=TOOLS[0];
  var currentItems=[];

  var tabsEl=$("#t-tabs"), formEl=$("#calc-form");
  var gSegs=$("#g-segs"), gMark=$("#g-mark"), gLegend=$("#g-legend"), gLabel=$("#gauge-label");
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
      var extra="";
      if(f.min!=null) extra+=' min="'+f.min+'"';
      if(f.max!=null) extra+=' max="'+f.max+'"';
      if(f.ph) extra+=' placeholder="'+f.ph+'"';
      if(activeTool.noInput) extra+=' readonly';
      ctrl='<input class="f-input" id="'+id+'" data-k="'+f.k+'" type="'+f.type+'" value="'+(s[f.k]!=null?s[f.k]:"")+'"'+extra+' maxlength="300">';
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

  function generateAll(){
    var res=activeTool.gen(state[activeTool.id]);
    currentItems=[];
    var isColor=activeTool.id==="color";
    for(var i=0;i<8;i++){
      var it=res[i]||null;
      var el=$("#st-v-"+i);
      if(it){
        currentItems.push(it);
        var label;
        if(activeTool.id==="wheel" && i===0) label="WINNER ★";
        else label=activeTool.label+" "+pad2(i+1);
        setStat(i,label,it.v,it.sub||"click to copy");
      } else {
        currentItems.push(null);
        setStat(i,activeTool.label+" "+pad2(i+1),"—","");
      }
      el.style.color=(isColor&&it)?it.v:"";
    }
    renderGauge(res._gauge||{pos:50,label:"READY"});
  }

  function selectTool(id){
    var t=TOOLS.filter(function(x){return x.id===id;})[0];
    if(!t) return;
    activeTool=t;
    renderTabs(); renderForm(); generateAll();
  }

  tabsEl.addEventListener("click", function(e){
    var b=e.target.closest(".t-tab"); if(!b) return;
    selectTool(b.getAttribute("data-tool"));
  });

  formEl.addEventListener("input", function(e){
    var k=e.target.getAttribute("data-k"); if(!k) return;
    if(activeTool.noInput) return;
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
  $("#a-stats").addEventListener("click", function(e){
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
    return currentItems.filter(Boolean).map(function(it,i){
      return [activeTool.label+" "+pad2(i+1), it.full||it.v, it.sub||""];
    });
  }

  function buildTSV(rows){
    var lines=["IrisTool — Random Generators","Tool: "+activeTool.name,""];
    lines.push("#\tResult\tNote");
    rows.forEach(function(r){ lines.push(r.join("\t")); });
    lines.push("");
    lines.push(gLabel.textContent);
    lines.push("Randomness via Math.random() — not cryptographic.");
    return lines.join("\n");
  }

  function buildTableHTML(rows){
    var h='<div style="font-family:Arial,Helvetica,sans-serif">';
    h+='<p style="margin:0 0 8px;font-size:13px;color:#6C6C64">IrisTool — Random Generators · <b style="color:#141414">'+esc(activeTool.name)+'</b></p>';
    h+='<table border="1" cellspacing="0" cellpadding="6" style="border-collapse:collapse;font-size:13px;border-color:#E4E4DC">';
    h+='<tr style="background:#0033FF;color:#FFFFFF;text-align:left">'
      +'<th style="padding:8px 14px">#</th>'
      +'<th style="padding:8px 14px">Result</th>'
      +'<th style="padding:8px 14px">Note</th></tr>';
    rows.forEach(function(r,i){
      h+='<tr style="background:'+(i%2?"#FCFCFA":"#FFFFFF")+'">'
        +'<td style="padding:6px 14px">'+esc(r[0])+'</td>'
        +'<td style="padding:6px 14px;color:#0033FF;font-weight:bold">'+esc(r[1])+'</td>'
        +'<td style="padding:6px 14px;color:#6C6C64">'+esc(r[2])+'</td></tr>';
    });
    h+='</table>';
    h+='<p style="margin:8px 0 0;font-size:11px;color:#9A9A92">Randomness via Math.random() — not cryptographic.</p></div>';
    return h;
  }

  var btnCopy=$("#btn-copy");
  btnCopy.addEventListener("click", function(){
    var rows=resultsRows();
    if(!rows.length){ flash(btnCopy,"NOTHING TO COPY",true); return; }
    var tsv=buildTSV(rows);
    var html=buildTableHTML(rows);

    function fallbackCopy(){
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

    if(navigator.clipboard && window.ClipboardItem && navigator.clipboard.write){
      try{
        var clipItem=new ClipboardItem({
          "text/html":  new Blob([html],{type:"text/html"}),
          "text/plain": new Blob([tsv],{type:"text/plain"})
        });
        navigator.clipboard.write([clipItem]).then(
          function(){ flash(btnCopy,"TABLE COPIED ✓"); },
          function(){
            if(navigator.clipboard.writeText){
              navigator.clipboard.writeText(tsv).then(
                function(){ flash(btnCopy,"TABLE COPIED ✓"); },
                fallbackCopy
              );
            } else fallbackCopy();
          }
        );
      }catch(e){ fallbackCopy(); }
    } else if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(tsv).then(
        function(){ flash(btnCopy,"TABLE COPIED ✓"); },
        fallbackCopy
      );
    } else {
      fallbackCopy();
    }
  });

  var btnDl=$("#btn-download");
  btnDl.addEventListener("click", function(){
    var rows=resultsRows();
    if(!rows.length){ flash(btnDl,"NOTHING TO SAVE",true); return; }
    var txt=buildTSV(rows);
    var blob=new Blob([txt],{type:"text/plain;charset=utf-8"});
    var url=URL.createObjectURL(blob);
    var a=document.createElement("a");
    a.href=url; a.download="IrisTool-random-results.txt";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function(){ URL.revokeObjectURL(url); },500);
    flash(btnDl,"SAVED ✓");
  });

  $("#btn-reset").addEventListener("click", function(){
    state[activeTool.id]=activeTool.def();
    renderForm(); generateAll();
  });

  /* ---- boot ---- */
  renderTabs(); renderForm(); generateAll();
})();
