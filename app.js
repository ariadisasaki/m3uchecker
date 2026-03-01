const output = document.getElementById("output");
const fileInput = document.getElementById("fileInput");
const loadBtn = document.getElementById("loadBtn");
const exportBtn = document.getElementById("exportBtn");

function convertToJSON(m3uText){
  const result = [];
  const lines = m3uText.split("\n");

  for(let i=0;i<lines.length;i++){
    if(lines[i].startsWith("#EXTINF")){
      const name = lines[i].split(",")[1];
      const url = lines[i+1];
      result.push({name, url});
    }
  }
  return result;
}

function renderJSON(data){
  const formatted = JSON.stringify(data, null, 2);
  output.textContent = formatted;
  localStorage.setItem("m3u_json", formatted);
}

async function loadFromURL(){
  const url = document.getElementById("m3uUrl").value;
  if(!url) return alert("Masukkan URL terlebih dahulu");

  try{
    const res = await fetch(url);
    const text = await res.text();
    const json = convertToJSON(text);
    renderJSON(json);
  }catch(err){
    alert("Gagal load URL (mungkin CORS aktif)");
  }
}

fileInput.addEventListener("change", e=>{
  const reader = new FileReader();
  reader.onload = function(){
    const json = convertToJSON(reader.result);
    renderJSON(json);
  }
  reader.readAsText(e.target.files[0]);
});

function exportJSON(){
  const data = localStorage.getItem("m3u_json");
  if(!data) return alert("Belum ada data");

  const blob = new Blob([data], {type:"application/json"});
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "playlist.json";
  a.click();

  URL.revokeObjectURL(url);
}

loadBtn.addEventListener("click", loadFromURL);
exportBtn.addEventListener("click", exportJSON);

if(localStorage.getItem("m3u_json")){
  output.textContent = localStorage.getItem("m3u_json");
}

if("serviceWorker" in navigator){
  navigator.serviceWorker.register("sw.js");
}
