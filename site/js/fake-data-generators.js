
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
     LIVE FAKE DATA GENERATORS (3 tools)
     ================================================================ */
  function clamp(v,a,b){ return Math.min(b,Math.max(a,v)); }
  function rnd(n){ return Math.floor(Math.random()*n); }
  function pick(a){ return a[rnd(a.length)]; }
  function pad2(n){ return String(n).padStart(2,"0"); }

  /* ---------------- shared pools ---------------- */
  var FIRST=["Ava","Liam","Noah","Emma","Mia","Lucas","Ivy","Ethan","Nora","Owen","Ruby","Felix","Cora","Jonah","Isla","Milo","Zoe","Hugo","Lena","Oscar"];
  var LAST=["Reyes","Carter","Nguyen","Patel","Kim","Rossi","Silva","Novak","Haas","Lund","Moreau","Tanaka","Okafor","Ivers","Bakker","Sorensen","Fischer","Costa","Ali","Berg"];
  function fullName(){ return pick(FIRST)+" "+pick(LAST); }

  var ADDR={
    US:{
      country:"United States",
      cities:[["Springfield","IL","62701"],["Austin","TX","78701"],["Portland","OR","97201"],["Denver","CO","80202"],["Madison","WI","53703"],["Asheville","NC","28801"],["Boise","ID","83702"],["Santa Fe","NM","87501"],["Burlington","VT","05401"],["Savannah","GA","31401"],["Ann Arbor","MI","48104"],["Tucson","AZ","85701"]],
      streets:["Maple","Oak","Cedar","Washington","Lincoln","Sunset","Highland","Riverside","Willow","Franklin","Lakeview","Magnolia","Chestnut","Juniper"],
      types:["Street","Avenue","Road","Boulevard","Lane","Drive"],
      apts:["Apt 2B","Apt 4B","Suite 310","Unit 12","","",""]
    },
    UK:{
      country:"United Kingdom",
      cities:[["London","Greater London","SW1A 1AA"],["Manchester","Greater Manchester","M1 1AE"],["Bristol","Bristol","BS1 4DJ"],["Edinburgh","Scotland","EH1 1YZ"],["Cardiff","Wales","CF10 1EP"],["York","North Yorkshire","YO1 7HH"]],
      streets:["Baker Street","Oxford Road","King Street","Church Lane","High Street","Victoria Road","Station Road","Mill Lane","Queensway","Harbour Road"],
      types:[""],
      apts:["Flat 3","Flat 7B","","",""]
    },
    DE:{
      country:"Germany",
      cities:[["Berlin","Berlin","10115"],["München","Bayern","80331"],["Hamburg","Hamburg","20095"],["Köln","NRW","50667"],["Leipzig","Sachsen","04109"],["Freiburg","Baden-Württemberg","79098"]],
      streets:["Hauptstraße","Berliner Straße","Bahnhofstraße","Gartenstraße","Schillerstraße","Lindenweg","Mozartstraße","Uferweg"],
      types:[""],
      apts:["Wohnung 3","2. OG","","",""]
    }
  };
  function genAddress(countryKey){
    var c=ADDR[countryKey]||ADDR.US;
    var city=pick(c.cities);
    var street=(1+rnd(999))+" "+pick(c.streets)+(c.types[0]?" "+pick(c.types):"");
    var apt=pick(c.apts);
    return {
      name:fullName(), street:street, apt:apt,
      city:city[0], region:city[1], zip:city[2], country:c.country,
      full:(fullNameLine=>fullNameLine)(null)
    };
  }

  var PHONES={
    US:{label:"United States",gen:function(){
      var area=pick(["212","310","312","415","617","206","512","303","503","619","702","917","202","646"]);
      var line="01"+pad2(rnd(100));
      return {disp:"("+area+") 555-"+line, e164:"+1"+area+"555"+line};
    }},
    UK:{label:"United Kingdom",gen:function(){
      var rest=pad2(rnd(10))+pad2(rnd(100))+pad2(rnd(100)).slice(0,3);
      var tail=pad2(rnd(100));
      return {disp:"+44 7700 9"+pad2(rnd(100)).slice(0,2)+" "+tail+pad2(rnd(100)).slice(0,2), e164:"+4477009"+pad2(rnd(100))+tail+pad2(rnd(100)).slice(0,2)};
    }},
    DE:{label:"Germany",gen:function(){
      var pre=pick(["151","152","157","160","170"]);
      var n="";for(var i=0;i<7;i++)n+=rnd(10);
      return {disp:"+49 "+pre+" "+n, e164:"+49"+pre+n};
    }},
    FR:{label:"France",gen:function(){
      var n="";for(var i=0;i<8;i++)n+=rnd(10);
      var g=n.match(/.{2}/g).join(" ");
      return {disp:"+33 6 "+g, e164:"+336"+n};
    }},
    AU:{label:"Australia",gen:function(){
      var n="";for(var i=0;i<8;i++)n+=rnd(10);
      return {disp:"+61 4"+n.slice(0,2)+" "+n.slice(2,5)+" "+n.slice(5,8), e164:"+614"+n.slice(0)+n.slice(2)};
    }}
  };
  /* simpler correct AU generator */
  PHONES.AU.gen=function(){
    var n="";for(var i=0;i<7;i++)n+=rnd(10);
    return {disp:"+61 4"+n.slice(0,2)+" "+n.slice(2,5)+" "+n.slice(5,7)+"0", e164:"+614"+n.slice(0,2)+n.slice(2,5)+n.slice(5,7)+"0"};
  };

  /* Luhn */
  function luhnCheckDigit(partial){
    var sum=0, dbl=true;
    for(var i=partial.length-1;i>=0;i--){
      var d=parseInt(partial[i],10);
      if(dbl){ d*=2; if(d>9) d-=9; }
      sum+=d; dbl=!dbl;
    }
    return (10-(sum%10))%10;
  }
  function luhnValid(num){
    var sum=0, dbl=false;
    for(var i=num.length-1;i>=0;i--){
      var d=parseInt(num[i],10);
      if(dbl){ d*=2; if(d>9) d-=9; }
      sum+=d; dbl=!dbl;
    }
    return sum%10===0;
  }
  var CARDS={
    visa:{label:"Visa",prefixes:["4"],len:16,cvv:3,fmt:"4-4-4-4"},
    mastercard:{label:"Mastercard",prefixes:["51","52","53","54","55"],len:16,cvv:3,fmt:"4-4-4-4"},
    amex:{label:"American Express",prefixes:["34","37"],len:15,cvv:4,fmt:"4-6-5"},
    discover:{label:"Discover",prefixes:["6011"],len:16,cvv:3,fmt:"4-4-4-4"}
  };
  function groupCard(num,fmt){
    if(fmt==="4-6-5") return num.slice(0,4)+" "+num.slice(4,10)+" "+num.slice(10);
    return num.match(/.{4}/g).join(" ");
  }
  function genCard(brandKey){
    var key=brandKey==="random"?pick(["visa","mastercard","amex","discover"]):brandKey;
    var c=CARDS[key];
    var body=pick(c.prefixes);
    while(body.length<c.len-1) body+=rnd(10);
    var full=body+luhnCheckDigit(body);
    var yy=new Date().getFullYear()%100;
    var exp=pad2(1+rnd(12))+"/"+pad2(yy+1+rnd(4));
    var cvv="";for(var i=0;i<c.cvv;i++)cvv+=rnd(10);
    return {
      brand:c.label, number:groupCard(full,c.fmt), raw:full,
      exp:exp, cvv:cvv, name:fullName().toUpperCase(),
      iin:full.slice(0,6), valid:luhnValid(full),
      masked:full.slice(0,4)+" •••• "+(c.len===15?"•••••• ":"•••• •••• ")+full.slice(-4)
    };
  }

  /* ---------------- tool registry ---------------- */
  var TOOLS=[
    { id:"address", tab:"Address", name:"Fake Address Generator",
      def:function(){ return {country:"US"}; } },
    { id:"phone", tab:"Phone", name:"Fake Phone Number Generator",
      def:function(){ return {country:"US"}; } },
    { id:"card", tab:"Card", name:"Fake Credit Card Number Generator",
      def:function(){ return {brand:"visa"}; } }
  ];

  var state={};
  TOOLS.forEach(function(t){ state[t.id]=t.def(); });
  var activeTool=TOOLS[0];
  var copyPayload="";

  var tabsEl=$("#t-tabs"), formEl=$("#calc-form");
  var gSegs=$("#g-segs"), gMark=$("#g-mark"), gLegend=$("#g-legend"), gLabel=$("#gauge-label");

  function fieldHtml(f,s){
    var id="fld-"+activeTool.id+"-"+f.k;
    var lab='<label class="f-label" for="'+id+'">'+f.label+'</label>';
    var ctrl='<select class="f-select" id="'+id+'" data-k="'+f.k+'">'+f.opts.map(function(o){
      return '<option value="'+o[0]+'"'+(String(s[f.k])===o[0]?' selected':'')+'>'+o[1]+'</option>';
    }).join('')+'</select>';
    return '<div class="field'+(f.full?' full':'')+'">'+lab+ctrl+'</div>';
  }

  function renderForm(){
    var t=activeTool, s=state[t.id];
    var fields;
    if(t.id==="address"){
      fields=[{k:"country",label:"Country",full:true,opts:[["US","United States"],["UK","United Kingdom"],["DE","Germany"]]}];
    } else if(t.id==="phone"){
      fields=[{k:"country",label:"Country",full:true,opts:[["US","United States — 555 fictional"],["UK","United Kingdom — Ofcom drama"],["DE","Germany"],["FR","France"],["AU","Australia"]]}];
    } else {
      fields=[{k:"brand",label:"Card brand",full:true,opts:[["visa","Visa"],["mastercard","Mastercard"],["amex","American Express"],["discover","Discover"],["random","Random brand"]]}];
    }
    formEl.innerHTML='<div class="f-grid">'+fields.map(function(f){ return fieldHtml(f,s); }).join('')+'</div>'
      +'<p class="f-note" style="padding:0 24px 4px">SYNTHETIC RECORDS · TEST USE ONLY · CLICK ANY CELL TO COPY IT</p>';
  }

  function renderTabs(){
    tabsEl.innerHTML=TOOLS.map(function(t){
      return '<button type="button" class="t-tab'+(t===activeTool?' on':'')+'" data-tool="'+t.id+'" role="tab" aria-selected="'+(t===activeTool)+'">'+t.tab+'</button>';
    }).join('');
  }

  function putCell(i,l,v,sub,tone){
    var b=$("#st-v-"+i);
    $("#st-l-"+i).textContent=l;
    $("#st-s-"+i).textContent=sub||"";
    v=String(v);
    if(b.textContent!==v){
      b.textContent=v;
      b.classList.remove("bump"); void b.offsetWidth; b.classList.add("bump");
      setTimeout(function(){ b.classList.remove("bump"); },200);
    }
    b.classList.remove("pass","fail");
    if(tone==="pass") b.classList.add("pass");
    if(tone==="fail") b.classList.add("fail");
  }

  function renderGauge(pos,label,legend){
    gLabel.textContent=label;
    gSegs.innerHTML='<i style="width:25%;background:#C40000"></i><i style="width:25%;background:#C9C9C0"></i><i style="width:25%;background:#6E86FF"></i><i style="width:25%;background:#0033FF"></i>';
    gMark.style.left=clamp(pos,0,100)+"%";
    gLegend.innerHTML=legend.map(function(it){
      return '<span><i class="sw" style="background:'+it.c+'"></i>'+it.l+'<b>'+it.v+'</b></span>';
    }).join('');
  }

  function generateAll(){
    var s=state[activeTool.id];

    if(activeTool.id==="address"){
      var rec=genAddress(s.country);
      var full=[rec.name, rec.street+(rec.apt?" "+rec.apt:""), rec.city+", "+rec.region+" "+rec.zip, rec.country].join("\n");
      copyPayload=full;
      var cells=[
        ["Recipient", rec.name, "synthetic person"],
        ["Street", rec.street, ""],
        ["Line 2", rec.apt||"—", rec.apt?"apt / suite":"none this time"],
        ["City", rec.city, ""],
        ["Region", rec.region, ""],
        ["Postcode", rec.zip, ""],
        ["Country", rec.country, ""],
        ["Full address", full.replace(/\n/g," · "), "click to copy block"]
      ];
      cells.forEach(function(c,i){ putCell(i,c[0],c[1],c[2]); });
      renderGauge(30,"ADDRESS — "+rec.city.toUpperCase()+", "+rec.region.toUpperCase()+" · "+rec.country.toUpperCase(),[
        {c:"#C40000",l:"REAL",v:"0"},{c:"#C9C9C0",l:"MIXED",v:"—"},
        {c:"#6E86FF",l:"SYNTHETIC",v:"100%"},{c:"#0033FF",l:"SAFE",v:"TEST"}
      ]);
      return;
    }

    if(activeTool.id==="phone"){
      var nums=[], lines=[];
      for(var i=0;i<8;i++){
        var n=PHONES[s.country].gen();
        nums.push(n); lines.push(n.e164);
      }
      copyPayload=lines.join("\n");
      nums.forEach(function(n,i){
        putCell(i,"Phone "+pad2(i+1), n.disp, n.e164);
      });
      renderGauge(70,"8 NUMBERS · "+PHONES[s.country].label.toUpperCase()+" · FICTIONAL RANGES",[
        {c:"#C40000",l:"REAL",v:"0"},{c:"#C9C9C0",l:"SHARED",v:"—"},
        {c:"#6E86FF",l:"FICTIONAL",v:"ALL 8"},{c:"#0033FF",l:"SAFE",v:"TEST"}
      ]);
      return;
    }

    /* card */
    var card=genCard(s.brand);
    copyPayload="Number: "+card.number+"\nExpiry: "+card.exp+"\nCVV: "+card.cvv+"\nName: "+card.name;
    var cells2=[
      ["Card number", card.number, card.brand],
      ["Brand", card.brand, "public test IIN"],
      ["Expires", card.exp, "MM/YY"],
      ["CVV", card.cvv, card.cvv.length===4?"Amex · 4 digits":"3 digits"],
      ["Cardholder", card.name, "synthetic person"],
      ["Luhn check", card.valid?"VALID ✓":"INVALID ✕", card.valid?"checksum passes":"checksum failed", card.valid?"pass":"fail"],
      ["Masked", card.masked, "safe to display"],
      ["IIN / BIN", card.iin, "first 6 digits"]
    ];
    cells2.forEach(function(c,i){ putCell(i,c[0],c[1],c[2],c[3]); });
    renderGauge(90,"TEST CARD — "+card.brand.toUpperCase()+" · LUHN "+(card.valid?"VALID":"INVALID")+" · NEVER WORKS FOR PAYMENTS",[
      {c:"#C40000",l:"LIVE CARD",v:"0"},{c:"#C9C9C0",l:"STOLEN",v:"—"},
      {c:"#6E86FF",l:"TEST IIN",v:"YES"},{c:"#0033FF",l:"SAFE",v:"TEST"}
    ]);
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

  /* buttons */
  $("#btn-gen").addEventListener("click", generateAll);
  $("#btn-reset").addEventListener("click", function(){
    state[activeTool.id]=activeTool.def();
    renderForm(); generateAll();
  });

  /* cell click → copy that cell */
  $("#a-stats").addEventListener("click", function(e){
    var cell=e.target.closest(".astat"); if(!cell) return;
    var idx=$$(".astat").indexOf(cell);
    var val=$("#st-v-"+idx).textContent;
    if(!val||val==="—") return;
    var full=(idx===7&&activeTool.id==="address")?copyPayload:val;
    copyText(full,function(ok){
      var sub=$("#st-s-"+idx);
      var old=sub.textContent;
      sub.textContent=ok?"COPIED ✓":"COPY FAILED";
      setTimeout(function(){ sub.textContent=old; },1200);
    });
  });

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

  function copyText(text,done){
    function fallback(){
      var ta=document.createElement("textarea");
      ta.value=text;
      ta.style.position="fixed";
      ta.style.left="-9999px";
      ta.style.top="0";
      document.body.appendChild(ta);
      ta.select();
      var ok=false;
      try{ ok=document.execCommand("copy"); }catch(err){}
      document.body.removeChild(ta);
      if(done) done(ok);
    }
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(text).then(function(){ if(done) done(true); },fallback);
    } else fallback();
  }

  /* ---- COPY — copies the current full record ---- */
  var btnCopy=$("#btn-copy");
  btnCopy.addEventListener("click", function(){
    if(!copyPayload){ flash(btnCopy,"NOTHING TO COPY",true); return; }
    copyText(copyPayload,function(ok){ flash(btnCopy, ok?"COPIED ✓":"COPY FAILED", !ok); });
  });

  /* ---- boot ---- */
  renderTabs(); renderForm(); generateAll();
})();
