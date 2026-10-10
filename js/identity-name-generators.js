
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
     LIVE NAME GENERATORS (7 tools)
     ================================================================ */
  function clamp(v,a,b){ return Math.min(b,Math.max(a,v)); }
  function rnd(n){ return Math.floor(Math.random()*n); }
  function pick(a){ return a[rnd(a.length)]; }
  function cap(s){ s=String(s); return s ? s.charAt(0).toUpperCase()+s.slice(1) : s; }
  function slug(s){ return String(s||"").toLowerCase().replace(/[^a-z0-9]+/g,"").slice(0,18); }

  function uniqueSet(gen,count){
    var out=[],seen={},guard=0;
    while(out.length<count && guard<400){
      guard++;
      var v=gen();
      if(!v) continue;
      var key=v.toLowerCase();
      if(seen[key]) continue;
      seen[key]=1; out.push(v);
    }
    return out;
  }

  /* ---------------- word banks ---------------- */
  var ADJ_COOL=["Shadow","Neon","Turbo","Cyber","Frost","Blaze","Storm","Phantom","Viper","Rogue","Zenith","Crimson","Onyx","Falcon","Drift","Apex","Volt","Echo","Grim","Razor"];
  var ADJ_CUTE=["Fluffy","Bubbly","Sunny","Tiny","Peachy","Cozy","Sparkle","Giggly","Muffin","Pip","Doodle","Waffle","Pumpkin","Jelly","Twinkle","Bunny","Boop","Cuddle"];
  var ADJ_PRO=["Prime","Elite","Sharp","Keen","Bold","Swift","Clear","True","Solid","Bright","Grand","Noble","Rapid","Smart","Pure","Steady"];
  var USER_SUF=["ify","ly","io","hq","zone","hub","wave","core","lab","forge"];
  var ROOT_FALLBACK=["pixel","nova","echo","drift","lunar","onyx","ember","atlas","orbit","zephyr"];

  var IND_WORDS={
    tech:["Labs","Systems","Tech","Dynamics","Logic","Cloud","Works","Digital"],
    food:["Bites","Kitchen","Foods","Table","Harvest","Provisions"],
    fashion:["Atelier","Threads","Studio","Apparel","House","Collective"],
    finance:["Capital","Partners","Group","Advisors","Holdings","Wealth"],
    media:["Media","Studio","Films","Press","Creative","Broadcast"],
    health:["Wellness","Health","Care","Vital","Life","Clinic"]
  };
  var CO_PREFIX=["Nova","Apex","Prime","Vertex","Lumen","Astra","Summit","Cobalt","Ever","True"];
  var BRAND_SUF=["ora","ix","eo","ify","ly","ex","on","ara","io","ux"];
  var BRAND_PRE=["Ever","Omni","Zen","Alto","Kiro","Vela","Nova","Aria"];
  var DOM_MODS=["hq","app","get","try","go","my","the","hub","lab","zone","now","up"];
  var DOM_ROOTS=["flux","bloom","orbit","spark","harbor","fable","meadow","signal","anchor","willow"];

  var FIRST_M=["James","Liam","Noah","Oliver","Ethan","Lucas","Mason","Logan","Alex","Henry","Samuel","Daniel","Matthew","Joseph","David","Andrew","Ryan","Nathan","Isaac","Owen","Caleb","Julian","Marcus","Victor","Felix","Hugo","Leo","Adrian","Sebastian","Miles"];
  var FIRST_F=["Emma","Olivia","Ava","Sophia","Mia","Luna","Chloe","Layla","Nora","Hazel","Stella","Violet","Aurora","Ivy","Elena","Clara","Alice","Maya","Freya","Iris","Lucy","Ruby","Sadie","Piper","Naomi","Elsie","Ada","Margot","Selena","Wren"];
  var LAST_N=["Smith","Johnson","Brown","Taylor","Anderson","Thomas","Jackson","White","Harris","Martin","Thompson","Garcia","Martinez","Robinson","Clark","Lewis","Lee","Walker","Hall","Young","King","Wright","Scott","Green","Baker","Adams","Nelson","Carter","Mitchell","Turner"];

  /* ---------------- generators ---------------- */
  function genUsernames(s){
    var k=slug(s.kw)||pick(ROOT_FALLBACK);
    var bank=s.style==="cute"?ADJ_CUTE:s.style==="pro"?ADJ_PRO:ADJ_COOL;
    return uniqueSet(function(){
      switch(rnd(6)){
        case 0: return cap(pick(bank))+cap(k);
        case 1: return k+pick(USER_SUF);
        case 2: return "the"+cap(k)+pick(["X","Pro","HQ"]);
        case 3: return pick(bank).toLowerCase()+"_"+k+(10+rnd(90));
        case 4: return k+(100+rnd(900));
        default: return pick(["x","its","real","mr","miss"])+cap(k);
      }
    },8);
  }
  function genNicknames(s){
    var raw=String(s.name||"").trim();
    var B=cap(slug(raw))||pick(["Champ","Ace","Star","Boss","Chief","Rocket"]);
    var pats=[
      function(){ return B+"y"; },
      function(){ return B+"-Bear"; },
      function(){ return "Lil "+B; },
      function(){ return "Big "+B; },
      function(){ return "The "+B; },
      function(){ return B+"-ster"; },
      function(){ return "Doc "+B; },
      function(){ return B+"-zilla"; },
      function(){ return "Captain "+B; },
      function(){ return B+"-boo"; },
      function(){ return "MC "+B; },
      function(){ return B+"-ito"; },
      function(){ return "Sir "+B; },
      function(){ return B+"-Pie"; }
    ];
    return uniqueSet(function(){ return pick(pats)(); },8);
  }
  function genCompany(s){
    var k=cap(slug(s.kw))||pick(["Vertex","Origin","Signal","Harbor"]);
    var words=IND_WORDS[s.ind]||IND_WORDS.tech;
    var root=k.toLowerCase();
    return uniqueSet(function(){
      switch(rnd(5)){
        case 0: return k+" "+pick(words);
        case 1: return pick(CO_PREFIX)+" "+k;
        case 2: return pick(CO_PREFIX)+pick(words);
        case 3: return k+" & "+pick(["Co","Partners","Sons"]);
        default: return cap(root.slice(0,Math.max(3,root.length-2))+pick(["ora","ex","ify","ax","io"]));
      }
    },8);
  }
  function genDomains(s){
    var base=slug(s.kw)||pick(DOM_ROOTS);
    var tld=s.tld||".com";
    return uniqueSet(function(){
      var m=pick(DOM_MODS);
      var name;
      switch(rnd(4)){
        case 0: name=base; break;
        case 1: name=base+m; break;
        case 2: name=m+base; break;
        default: name=base+pick(["ly","io","ify"]); break;
      }
      name=name.slice(0,20);
      return name+tld;
    },8);
  }
  function genBusiness(s){
    var k=cap(slug(s.kw))||pick(["Willow","Ember","Harbor","Juniper"]);
    var classic=[function(){return k+" & Co.";},function(){return "The "+k+" Company";},function(){return "House of "+k;},function(){return k+" Brothers";},function(){return k+" & Sons";}];
    var modern=[function(){return k+" Studio";},function(){return k+" Lab";},function(){return k+".";},function(){return k+" Works";},function(){return "Studio "+k;}];
    var playful=[function(){return k+" & Friends";},function(){return "Happy "+k;},function(){return k+" Pop";},function(){return "Little "+k;},function(){return k+" Club";}];
    var pats=s.style==="classic"?classic:s.style==="playful"?playful:modern;
    return uniqueSet(function(){ return pick(pats)(); },8);
  }
  function genBrands(s){
    var root=slug(s.kw).slice(0,5)||pick(["ver","lum","nov","kal","mir","sol","zen","ori"]);
    return uniqueSet(function(){
      switch(rnd(6)){
        case 0: return cap(root+pick(["ora","ara","ia"]));
        case 1: return cap(root+pick(["ix","ex","ax"]));
        case 2: return cap(root.slice(0,3)+"ify");
        case 3: return cap(root+"ly");
        case 4: return cap(pick(BRAND_PRE)+root.slice(0,3));
        case 5: return cap(root+pick(["eo","io","on"]));
        default: return cap(root.split("").reverse().join("").slice(0,4)+"o");
      }
    },8);
  }
  function genPeople(s){
    var pool=s.gender==="male"?FIRST_M:s.gender==="female"?FIRST_F:FIRST_M.concat(FIRST_F);
    return uniqueSet(function(){ return pick(pool)+" "+pick(LAST_N); },8);
  }

  /* ---------------- tool registry ---------------- */
  var TOOLS=[
    { id:"user", tab:"Username", name:"Username Generator",
      def:function(){ return {kw:"nova",style:"cool"}; },
      fields:[
        {k:"kw",label:"Keyword (optional)",type:"text",ph:"nova"},
        {k:"style",label:"Style",type:"select",opts:[["cool","Cool"],["cute","Cute"],["pro","Pro"]]}
      ], gen:genUsernames },
    { id:"nick", tab:"Nickname", name:"Nickname Generator",
      def:function(){ return {name:"Sara"}; },
      fields:[
        {k:"name",label:"First name",type:"text",ph:"Sara",full:true}
      ], gen:genNicknames },
    { id:"company", tab:"Company", name:"Company Name Generator",
      def:function(){ return {kw:"pixel",ind:"tech"}; },
      fields:[
        {k:"kw",label:"Keyword (optional)",type:"text",ph:"pixel"},
        {k:"ind",label:"Industry",type:"select",opts:[["tech","Technology"],["food","Food & Drink"],["fashion","Fashion"],["finance","Finance"],["media","Media"],["health","Health"]]}
      ], gen:genCompany },
    { id:"domain", tab:"Domain", name:"Domain Name Generator",
      def:function(){ return {kw:"bloom",tld:".com"}; },
      fields:[
        {k:"kw",label:"Keyword (optional)",type:"text",ph:"bloom"},
        {k:"tld",label:"TLD",type:"select",opts:[[".com",".com"],[".io",".io"],[".co",".co"],[".net",".net"],[".app",".app"]]}
      ], gen:genDomains },
    { id:"business", tab:"Business", name:"Business Name Generator",
      def:function(){ return {kw:"maple",style:"classic"}; },
      fields:[
        {k:"kw",label:"Keyword (optional)",type:"text",ph:"maple"},
        {k:"style",label:"Voice",type:"select",opts:[["classic","Classic"],["modern","Modern"],["playful","Playful"]]}
      ], gen:genBusiness },
    { id:"brand", tab:"Brand", name:"Brand Name Generator",
      def:function(){ return {kw:"verde"}; },
      fields:[
        {k:"kw",label:"Root word (optional)",type:"text",ph:"verde",full:true}
      ], gen:genBrands },
    { id:"person", tab:"Random Name", name:"Random Name Generator",
      def:function(){ return {gender:"any"}; },
      fields:[
        {k:"gender",label:"Gender",type:"seg",full:true,opts:[["any","Any"],["male","Male"],["female","Female"]]}
      ], gen:genPeople }
  ];

  var state={};
  TOOLS.forEach(function(t){ state[t.id]=t.def(); });
  var activeTool=TOOLS[0];
  var currentNames=[];

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
      ctrl='<input class="f-input" id="'+id+'" data-k="'+f.k+'" type="'+f.type+'" value="'+(s[f.k]!=null?s[f.k]:"")+'"'+
        (f.min!=null?' min="'+f.min+'"':'')+(f.max!=null?' max="'+f.max+'"':'')+(f.ph?' placeholder="'+f.ph+'"':'')+' maxlength="40">';
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

  function generateAll(){
    currentNames=activeTool.gen(state[activeTool.id]);
    var totalLen=0;
    for(var i=0;i<8;i++){
      var n=currentNames[i]||"—";
      if(currentNames[i]) totalLen+=n.length;
      var label="CANDIDATE "+String(i+1).padStart(2,"0");
      setStat(i,label,n,currentNames[i]?n.length+" chars · click to copy":"");
    }
    var avg=currentNames.length?totalLen/currentNames.length:0;
    gLabel.textContent="8 CANDIDATES · AVG LENGTH "+avg.toFixed(1)+" CHARS · CLICK ANY NAME TO COPY";
    gSegs.innerHTML='<i style="width:25%;background:'+QUART[0]+'"></i><i style="width:25%;background:'+QUART[1]+'"></i><i style="width:25%;background:'+QUART[2]+'"></i><i style="width:25%;background:'+QUART[3]+'"></i>';
    gMark.style.left=clamp(avg/24*100,0,100)+"%";
    gLegend.innerHTML=
      '<span><i class="sw" style="background:'+QUART[0]+'"></i>SHORT<b>≤ 6</b></span>'+
      '<span><i class="sw" style="background:'+QUART[1]+'"></i>COMPACT<b>6–12</b></span>'+
      '<span><i class="sw" style="background:'+QUART[2]+'"></i>STANDARD<b>12–18</b></span>'+
      '<span><i class="sw" style="background:'+QUART[3]+'"></i>LONG<b>18+</b></span>';
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
    state[activeTool.id][k]=e.target.value;
    generateAll();
  });
  formEl.addEventListener("click", function(e){
    var b=e.target.closest(".seg button"); if(!b) return;
    state[activeTool.id][b.closest(".seg").getAttribute("data-k")]=b.getAttribute("data-v");
    renderForm(); generateAll();
  });

  /* click a candidate cell to copy that single name */
  var copyTimers={};
  $("#a-stats").addEventListener("click", function(e){
    var cell=e.target.closest(".astat"); if(!cell) return;
    var idx=$$(".astat").indexOf(cell);
    var name=currentNames[idx];
    if(!name) return;
    function done(ok){
      setStat(idx,"CANDIDATE "+String(idx+1).padStart(2,"0"),name,ok?"COPIED ✓":"COPY FAILED — SELECT MANUALLY");
      clearTimeout(copyTimers[idx]);
      copyTimers[idx]=setTimeout(function(){
        setStat(idx,"CANDIDATE "+String(idx+1).padStart(2,"0"),name,name.length+" chars · click to copy");
      },1400);
    }
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(name).then(function(){ done(true); },function(){ done(false); });
    } else {
      var ta=document.createElement("textarea");
      ta.value=name; ta.style.position="fixed"; ta.style.left="-9999px";
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
    return currentNames.filter(Boolean).map(function(n,i){
      return ["Candidate "+String(i+1).padStart(2,"0"), n, n.length+" chars"];
    });
  }

  function buildTSV(rows){
    var lines=["IrisTool — Identity & Name Generators","Tool: "+activeTool.name,""];
    lines.push("#\tName\tLength");
    rows.forEach(function(r){ lines.push(r.join("\t")); });
    lines.push("");
    lines.push(gLabel.textContent);
    lines.push("Suggestions only — verify availability before use.");
    return lines.join("\n");
  }

  function buildTableHTML(rows){
    var h='<div style="font-family:Arial,Helvetica,sans-serif">';
    h+='<p style="margin:0 0 8px;font-size:13px;color:#6C6C64">IrisTool — Identity &amp; Name Generators · <b style="color:#141414">'+esc(activeTool.name)+'</b></p>';
    h+='<table border="1" cellspacing="0" cellpadding="6" style="border-collapse:collapse;font-size:13px;border-color:#E4E4DC">';
    h+='<tr style="background:#0033FF;color:#FFFFFF;text-align:left">'
      +'<th style="padding:8px 14px">#</th>'
      +'<th style="padding:8px 14px">Name</th>'
      +'<th style="padding:8px 14px">Length</th></tr>';
    rows.forEach(function(r,i){
      h+='<tr style="background:'+(i%2?"#FCFCFA":"#FFFFFF")+'">'
        +'<td style="padding:6px 14px">'+esc(r[0])+'</td>'
        +'<td style="padding:6px 14px;color:#0033FF;font-weight:bold">'+esc(r[1])+'</td>'
        +'<td style="padding:6px 14px;color:#6C6C64">'+esc(r[2])+'</td></tr>';
    });
    h+='</table>';
    h+='<p style="margin:8px 0 0;font-size:11px;color:#9A9A92">Suggestions only — verify availability before use.</p></div>';
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
        var item=new ClipboardItem({
          "text/html":  new Blob([html],{type:"text/html"}),
          "text/plain": new Blob([tsv],{type:"text/plain"})
        });
        navigator.clipboard.write(item).then(
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
    a.href=url; a.download="IrisTool-name-ideas.txt";
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
