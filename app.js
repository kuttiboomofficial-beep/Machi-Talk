const langs = {
  ta:{name:"🇮🇳 Tamil", speech:"ta-IN"},
  hi:{name:"🇮🇳 Hindi", speech:"hi-IN"},
  en:{name:"🇬🇧 English", speech:"en-US"},
  te:{name:"🇮🇳 Telugu", speech:"te-IN"},
  bn:{name:"🇮🇳 Bengali", speech:"bn-IN"}
};
const from=document.getElementById("from"), to=document.getElementById("to");
Object.entries(langs).forEach(([k,v])=>{
  from.add(new Option(v.name,k)); to.add(new Option(v.name,k));
});
from.value="ta"; to.value="hi";
const heard=document.getElementById("heard"), translated=document.getElementById("translated");
const status=document.getElementById("status"), start=document.getElementById("start");
const stop=document.getElementById("stop"), speak=document.getElementById("speak");
let recognition=null, lastTranslation="";

function setStatus(t, cls=""){status.textContent=t;status.className="status "+cls}
function translateDemo(text, a, b){
  // V1 UI/demo fallback. Real cloud translation should be connected in the next version.
  const pairs={
    "ta-hi":{"வணக்கம்":"नमस्ते","நாளைக்கு வர முடியுமா":"क्या आप कल आ सकते हैं?","ஆர்டர் எப்போது தயாராகும்":"ऑर्डर कब तैयार होगा?"},
    "hi-ta":{"नमस्ते":"வணக்கம்","क्या आप कल आ सकते हैं?":"நாளைக்கு வர முடியுமா?","ऑर्डर कब तैयार होगा?":"ஆர்டர் எப்போது தயாராகும்?"},
    "ta-en":{"வணக்கம்":"Hello","நாளைக்கு வர முடியுமா":"Can you come tomorrow?"},
    "en-ta":{"Hello":"வணக்கம்","Can you come tomorrow?":"நாளைக்கு வர முடியுமா?"},
    "ta-te":{"வணக்கம்":"నమస్కారం"},
    "ta-bn":{"வணக்கம்":"নমস্কার"}
  };
  return (pairs[a+"-"+b]||{})[text] || "Translation service connection needed for this sentence.";
}
function speakText(){
  if(!lastTranslation || !("speechSynthesis" in window)) return;
  const u=new SpeechSynthesisUtterance(lastTranslation);
  u.lang=langs[to.value].speech;
  speechSynthesis.cancel(); speechSynthesis.speak(u);
}
function makeRecognition(){
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR) return null;
  const r=new SR(); r.continuous=false; r.interimResults=false;
  r.lang=langs[from.value].speech;
  r.onstart=()=>{setStatus("Listening…","success");start.disabled=true;stop.disabled=false};
  r.onresult=e=>{
    const text=e.results[0][0].transcript;
    heard.textContent=text;
    lastTranslation=translateDemo(text,from.value,to.value);
    translated.textContent=lastTranslation;
    speak.disabled=false;
    speakText();
    setStatus("Translated","success");
  };
  r.onerror=e=>setStatus("Mic error: "+e.error,"error");
  r.onend=()=>{start.disabled=false;stop.disabled=true};
  return r;
}
start.onclick=()=>{
  recognition=makeRecognition();
  if(!recognition){setStatus("Speech recognition is not supported on this browser.","error");return}
  recognition.start();
};
stop.onclick=()=>{if(recognition) recognition.stop();setStatus("Stopped")};
speak.onclick=speakText;
document.getElementById("swap").onclick=()=>{
  const x=from.value;from.value=to.value;to.value=x;
  setStatus("Languages swapped");
};
