const langs={
  ta:{name:"🇮🇳 Tamil",speech:"ta-IN",api:"Tamil"},
  hi:{name:"🇮🇳 Hindi",speech:"hi-IN",api:"Hindi"},
  en:{name:"🇬🇧 English",speech:"en-US",api:"English"},
  te:{name:"🇮🇳 Telugu",speech:"te-IN",api:"Telugu"},
  bn:{name:"🇮🇳 Bengali",speech:"bn-IN",api:"Bengali"}
};

const from=document.getElementById("from"), to=document.getElementById("to");
Object.entries(langs).forEach(([k,v])=>{from.add(new Option(v.name,k));to.add(new Option(v.name,k));});
from.value="ta"; to.value="hi";

const apiBase=document.getElementById("apiBase");
apiBase.value=localStorage.getItem("machiTalkServer")||"";
const saveServer=document.getElementById("saveServer");
saveServer.onclick=()=>{
  localStorage.setItem("machiTalkServer",apiBase.value.trim().replace(/\/$/,""));
  setStatus("Server saved","success");
};

const heard=document.getElementById("heard");
const translated=document.getElementById("translated");
const status=document.getElementById("status");
const turnIndicator=document.getElementById("turnIndicator");
const myTurn=document.getElementById("myTurn");
const customerTurn=document.getElementById("customerTurn");
const startAuto=document.getElementById("startAuto");
const stop=document.getElementById("stop");
const speak=document.getElementById("speak");
const autoMode=document.getElementById("autoMode");
const fromLabel=document.getElementById("fromLabel");
const toLabel=document.getElementById("toLabel");

let recognition=null;
let running=false;
let autoRunning=false;
let currentSpeaker="mine";
let lastTranslation="";
let restartTimer=null;

function setStatus(t,cls=""){
  status.textContent=t;
  status.className="status "+cls;
}
function labels(){
  fromLabel.textContent="You · "+langs[from.value].name;
  toLabel.textContent="Customer · "+langs[to.value].name;
}
labels();

function speakText(done){
  if(!lastTranslation || !("speechSynthesis" in window)){ if(done) done(); return; }
  const u=new SpeechSynthesisUtterance(lastTranslation);
  u.lang=langs[currentSpeaker==="mine"?to.value:from.value].speech;
  u.rate=0.96;
  u.onend=()=>done&&done();
  u.onerror=()=>done&&done();
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}
speak.onclick=()=>speakText();

async function translate(text,sourceKey,targetKey){
  const base=(apiBase.value||"").trim().replace(/\/$/,"");
  if(!base) throw new Error("Add the translation server URL in ⚙️");
  const r=await fetch(base+"/translate",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
      text,
      source:langs[sourceKey].api,
      target:langs[targetKey].api
    })
  });
  let data={};
  try{data=await r.json()}catch{}
  if(!r.ok) throw new Error(data.error||"Translation failed");
  return (data.translation||"").trim();
}

function makeRecognition(sourceKey,targetKey){
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR) return null;
  const r=new SR();
  r.continuous=false;
  r.interimResults=false;
  r.lang=langs[sourceKey].speech;

  r.onstart=()=>{
    setStatus("Listening…","success");
    turnIndicator.textContent=currentSpeaker==="mine"
      ? "🗣️ Your turn — speak Tamil"
      : "👤 Customer turn — speak Hindi";
    myTurn.disabled=true; customerTurn.disabled=true;
    stop.disabled=false;
  };

  r.onresult=async e=>{
    const text=e.results[0][0].transcript.trim();
    if(!text) return;
    heard.textContent=text;
    setStatus("Translating…");
    try{
      lastTranslation=await translate(text,sourceKey,targetKey);
      translated.textContent=lastTranslation;
      speak.disabled=false;
      setStatus("Translation ready","success");

      if(autoRunning){
        speakText(()=>{
          if(!autoRunning)return;
          currentSpeaker=currentSpeaker==="mine"?"customer":"mine";
          scheduleListen(650);
        });
      }else{
        speakText();
      }
    }catch(err){
      setStatus(err.message,"error");
      if(autoRunning) stopAll();
    }
  };

  r.onerror=e=>{
    if(e.error==="no-speech"){
      setStatus("No speech detected");
      if(autoRunning) scheduleListen(500);
    }else{
      setStatus("Mic error: "+e.error,"error");
      if(autoRunning) stopAll();
    }
  };

  r.onend=()=>{
    recognition=null;
    if(!autoRunning){
      myTurn.disabled=false; customerTurn.disabled=false;
      stop.disabled=true;
    }
  };
  return r;
}

function listenOnce(speaker){
  if(!running)return;
  currentSpeaker=speaker;
  const sourceKey=speaker==="mine"?from.value:to.value;
  const targetKey=speaker==="mine"?to.value:from.value;
  recognition=makeRecognition(sourceKey,targetKey);
  if(!recognition){
    setStatus("Speech recognition is not supported in this browser.","error");
    stopAll(); return;
  }
  try{recognition.start()}catch(e){}
}

function scheduleListen(ms=500){
  clearTimeout(restartTimer);
  restartTimer=setTimeout(()=>listenOnce(currentSpeaker),ms);
}

function startManual(speaker){
  stopRecognitionOnly();
  running=true;
  autoRunning=false;
  currentSpeaker=speaker;
  listenOnce(speaker);
}

myTurn.onclick=()=>startManual("mine");
customerTurn.onclick=()=>startManual("customer");

startAuto.onclick=()=>{
  if(!autoMode.checked){
    autoMode.checked=true;
  }
  stopRecognitionOnly();
  running=true;
  autoRunning=true;
  currentSpeaker="mine";
  setStatus("Auto conversation started","success");
  scheduleListen(300);
};

stop.onclick=()=>stopAll();

function stopRecognitionOnly(){
  clearTimeout(restartTimer);
  if(recognition){
    try{recognition.stop()}catch(e){}
    recognition=null;
  }
  if("speechSynthesis" in window) speechSynthesis.cancel();
}

function stopAll(){
  running=false;
  autoRunning=false;
  stopRecognitionOnly();
  myTurn.disabled=false;
  customerTurn.disabled=false;
  stop.disabled=true;
  setStatus("Stopped");
  turnIndicator.textContent="Choose who speaks first";
}

document.getElementById("swap").onclick=()=>{
  const x=from.value; from.value=to.value; to.value=x;
  labels();
  lastTranslation="";
  translated.textContent="மொழிபெயர்ப்பு இங்கே வரும்...";
  setStatus("Languages swapped");
};

from.onchange=()=>{labels(); if(running) stopAll();};
to.onchange=()=>{labels(); if(running) stopAll();};
window.addEventListener("beforeunload",stopAll);
