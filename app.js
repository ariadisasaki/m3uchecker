const video = document.getElementById("video");
const playlistDiv = document.getElementById("playlist");
const fileInput = document.getElementById("fileInput");
const loadBtn = document.getElementById("loadBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const streamLinkText = document.getElementById("streamLink");
const copyBtn = document.getElementById("copyBtn");

let playlistData = [];
let currentIndex = 0;
let hls;

/* Convert */
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

/* Render Playlist */
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

/* Play */
function playCurrent(){
  const item = playlistData[currentIndex];
  if(!item) return;

  if(hls){
    hls.destroy();
  }

  if(item.url.endsWith(".m3u8") && Hls.isSupported()){
    hls = new Hls();
    hls.loadSource(item.url);
    hls.attachMedia(video);
  } else {
    video.src = item.url;
  }

  video.play(); // AUTO PLAY

  streamLinkText.textContent = item.url; // tampilkan link
  renderPlaylist();
}

/* Navigation */
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

/* Copy Link */
copyBtn.addEventListener("click", ()=>{
  const link = streamLinkText.textContent;
  if(!link) return;

  navigator.clipboard.writeText(link);
  copyBtn.textContent = "Copied!";
  setTimeout(()=>copyBtn.textContent="Copy Link",1500);
});

/* Load */
async function loadFromURL(){
  const url = document.getElementById("m3uUrl").value;
  if(!url) return alert("Masukkan URL");

  try{
    const res = await fetch(url);
    const text = await res.text();
    playlistData = convertToJSON(text);
    currentIndex = 0;
    renderPlaylist();
    playCurrent();
  }catch{
    alert("Gagal load (mungkin CORS)");
  }
}

loadBtn.addEventListener("click", loadFromURL);

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

/* Service Worker */
if("serviceWorker" in navigator){
  navigator.serviceWorker.register("sw.js");
}
