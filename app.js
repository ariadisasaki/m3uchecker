const video = document.getElementById("video");
const playlistDiv = document.getElementById("playlist");
const fileInput = document.getElementById("fileInput");
const loadBtn = document.getElementById("loadBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const streamLink = document.getElementById("streamLink");
const copyBtn = document.getElementById("copyBtn");
const streamStatus = document.getElementById("streamStatus");

let playlistData = [];
let currentIndex = 0;
let hls = null;

/* ============================= */
/* Convert M3U → JSON */
/* ============================= */
function convertToJSON(m3uText){
  const result = [];
  const lines = m3uText.split("\n");

  for(let i = 0; i < lines.length; i++){
    if(lines[i].startsWith("#EXTINF")){
      const name = lines[i].split(",")[1] || "No Name";
      const url = lines[i+1];
      if(url && url.startsWith("http")){
        result.push({ name, url });
      }
    }
  }
  return result;
}

/* ============================= */
/* Render Playlist */
/* ============================= */
function renderPlaylist(){
  playlistDiv.innerHTML = "";

  playlistData.forEach((item, index)=>{
    const div = document.createElement("div");
    div.textContent = item.name;

    if(index === currentIndex){
      div.classList.add("active");
    }

    div.onclick = ()=>{
      currentIndex = index;
      playCurrent();
    };

    playlistDiv.appendChild(div);
  });
}

/* ============================= */
/* Play Current Stream */
/* ============================= */
function playCurrent(){
  const item = playlistData[currentIndex];
  if(!item) return;

  // Destroy previous HLS instance safely
  if(hls){
    hls.destroy();
    hls = null;
  }

  video.pause();
  video.removeAttribute("src");
  video.load();

  // Play stream
  if(item.url.endsWith(".m3u8") && window.Hls && Hls.isSupported()){
    hls = new Hls();
    hls.loadSource(item.url);
    hls.attachMedia(video);
  } else {
    video.src = item.url;
  }

  video.play().catch(()=>{});

  // Update UI
  streamLink.textContent = item.url;
  checkStreamStatus(item.url);
  renderPlaylist();
}

/* ============================= */
/* Next / Prev */
/* ============================= */
function next(){
  if(currentIndex < playlistData.length - 1){
    currentIndex++;
    playCurrent();
  }
}

function prev(){
  if(currentIndex > 0){
    currentIndex--;
    playCurrent();
  }
}

nextBtn.addEventListener("click", next);
prevBtn.addEventListener("click", prev);

/* ============================= */
/* Copy Link */
/* ============================= */
copyBtn.addEventListener("click", ()=>{
  const link = streamLink.textContent;
  if(!link) return;

  navigator.clipboard.writeText(link).then(()=>{
    copyBtn.textContent = "Copied!";
    setTimeout(()=>{
      copyBtn.textContent = "Copy Link";
    },1500);
  });
});

/* ============================= */
/* Check Stream Status */
/* ============================= */
async function checkStreamStatus(url){
  streamStatus.textContent = "Status: Mengecek...";
  streamStatus.style.color = "orange";

  try{
    const response = await fetch(url, { method: "HEAD" });

    if(response.ok){
      streamStatus.textContent = "Status: Link Aktif";
      streamStatus.style.color = "lightgreen";
    }else{
      streamStatus.textContent = "Status: Link Tidak Aktif";
      streamStatus.style.color = "red";
    }
  }catch{
    streamStatus.textContent = "Status: Tidak Bisa Dicek (CORS)";
    streamStatus.style.color = "gray";
  }
}

/* ============================= */
/* Video Error Detection */
/* ============================= */
video.addEventListener("error", ()=>{
  streamStatus.textContent = "Status: Gagal Diputar";
  streamStatus.style.color = "red";
});

/* ============================= */
/* Load From URL */
/* ============================= */
async function loadFromURL(){
  const url = document.getElementById("m3uUrl").value;
  if(!url) return alert("Masukkan URL terlebih dahulu");

  try{
    const res = await fetch(url);
    const text = await res.text();
    playlistData = convertToJSON(text);
    currentIndex = 0;
    renderPlaylist();
    playCurrent();
  }catch{
    alert("Gagal load URL (mungkin CORS aktif)");
  }
}

loadBtn.addEventListener("click", loadFromURL);

/* ============================= */
/* Load From File */
/* ============================= */
fileInput.addEventListener("change", e=>{
  const reader = new FileReader();
  reader.onload = function(){
    playlistData = convertToJSON(reader.result);
    currentIndex = 0;
    renderPlaylist();
    playCurrent();
  };
  reader.readAsText(e.target.files[0]);
});

/* ============================= */
/* Service Worker */
/* ============================= */
if("serviceWorker" in navigator){
  navigator.serviceWorker.register("sw.js");
}
