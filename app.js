const langs={
 ta:{name:"🇮🇳 Tamil",speech:"ta-IN",api:"Tamil"},
 hi:{name:"🇮🇳 Hindi",speech:"hi-IN",api:"Hindi"},
 en:{name:"🇬🇧 English",speech:"en-US",api:"English"},
 te:{name:"🇮🇳 Telugu",speech:"te-IN",api:"Telugu"},
 bn:{name:"🇮🇳 Bengali",speech:"bn-IN",api:"Bengali"}
};
const from=document.getElementById("from"),to=document.getElementById("to");
Object.entries(langs).forEach(([k,v])=>{from.add(new Option(v.name,k));to.add(new Option(v.name,k));});
from.value="ta";to.value="hi";

const apiBase=document.getElementById("apiBase");
apiBase.value=localStorage.getItem("machiTalkServer")||"";
document.getElementById("saveServer").onclick=()=>{
  localStorage.setItem("machiTalkServer",apiBase.value.trim().replace(/\/$/,""));
  setStatus("Server saved","success");
};

const heard=document.getElementById("heard"), translated=document.getElementById("translated");
const status=document.getElementById("status"),start=document.getElementById("start"),stop=document.getElementById("stop"),speak=document.getElementById("speak");
let recognition=null,lastTranslation="";

function setStatus(t,cls=""){status.textContent=t;status.className="status "+cls}
function speakText(){
  if(!lastTranslation||!("speechSynthesis" in window))return;
  const u=new SpeechSynthesisUtterance(lastTranslation);
  u.lang=langs[to.value].speech;
  speechSynthesis.cancel();speechSynthesis.speak(u);
}
async function translate(text){
  const base=(apiBase.value||"").trim().replace(/\/$/,"");
  if(!base){setStatus("Add the V2 translation server URL in ⚙️","error");return}
  setStatus("Translating…");
  const r=await fetch(base+"/translate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
    text,source:langs[from.value].api,target:langs[to.value].api
  })});
  const data=await r.json();
  if(!r.ok)throw new Error(data.error||"Translation failed");
  lastTranslation=data.translation;
  translated.textContent=lastTranslation;
  speak.disabled=false;
  setStatus("Translated","success");
  speakText();
}
function makeRecognition(){
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR)return null;
  const r=new SR();r.continuous=false;r.interimResults=false;r.lang=langs[from.value].speech;
  r.onstart=()=>{setStatus("Listening…","success");start.disabled=true;stop.disabled=false};
  r.onresult=async e=>{
    const text=e.results[0][0].transcript;heard.textContent=text;
    try{await translate(text)}catch(err){setStatus(err.message,"error")}
  };
  r.onerror=e=>setStatus("Mic error: "+e.error,"error");
  r.onend=()=>{start.disabled=false;stop.disabled=true};
  return r;
}
start.onclick=()=>{
  recognition=makeRecognition();
  if(!recognition){setStatus("Speech recognition is not supported here.","error");return}
  recognition.start();
};
stop.onclick=()=>{if(recognition)recognition.stop();setStatus("Stopped")};
speak.onclick=speakText;
document.getElementById("swap").onclick=()=>{const x=from.value;from.value=to.value;to.value=x;setStatus("Languages swapped")};
