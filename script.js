const DEFAULT_DATA = [
  {
    id:"valorant",
    name:"VALORANT",
    image:"",
    description:"Competitive tactical shooter.",
    subdivisions:[
      {id:"ranked",name:"Ranked",image:"",description:"Competitive ranked gameplay."},
      {id:"esports",name:"Esports",image:"",description:"Teams, tournaments and competitive play."}
    ]
  },
  {
    id:"fivem",
    name:"GTA V — FiveM",
    image:"",
    description:"Roleplay, characters and custom servers.",
    subdivisions:[
      {id:"characters",name:"Characters",image:"",description:"My FiveM characters and profiles."},
      {id:"gang-rp",name:"Gang RP",image:"",description:"Gang roleplay and stories."},
      {id:"pd-rp",name:"PD RP",image:"",description:"Police Department roleplay."},
      {id:"citizen-rp",name:"Citizen RP",image:"",description:"Citizen roleplay and everyday stories."}
    ]
  },
  {
    id:"gta-v",
    name:"GTA V",
    image:"",
    description:"Grand Theft Auto V.",
    subdivisions:[
      {id:"story",name:"Story Mode",image:"",description:"Story mode gameplay."},
      {id:"online",name:"GTA Online",image:"",description:"Online gameplay."}
    ]
  }
];

const STORAGE_KEY = "arjunGamingHubData";
const PROFILE_KEY = "arjunGamingHubProfile";
const ADMIN_KEY = "arjunGamingHubAdmin";

const DEFAULT_PROFILE = {
  name:"Kuttan PP",
  image:"",
  bio:"Gaming • FiveM RP • VALORANT",
  instagram:"",
  youtube:""
};

let data = loadData();
let profile = loadProfile();
let admin = sessionStorage.getItem(ADMIN_KEY) === "1";

const $ = id => document.getElementById(id);

function clone(x){ return JSON.parse(JSON.stringify(x)); }
function uid(prefix="item"){ return prefix+"-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,7); }
function loadData(){
  try{
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : clone(DEFAULT_DATA);
  }catch(e){ return clone(DEFAULT_DATA); }
}
function saveData(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  renderProfile();
render();
}
function loadProfile(){
  try{
    const saved = localStorage.getItem(PROFILE_KEY);
    return saved ? {...DEFAULT_PROFILE,...JSON.parse(saved)} : {...DEFAULT_PROFILE};
  }catch(e){ return {...DEFAULT_PROFILE}; }
}
function saveProfile(){
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  renderProfile();
}
function renderProfile(){
  $("profileName").textContent = profile.name || "Kuttan PP";
  $("profileBio").textContent = profile.bio || "";
  const avatar = $("profileAvatar");
  if(profile.image){
    avatar.style.backgroundImage = `url("${String(profile.image).replace(/"/g,'\"')}")`;
    avatar.textContent = "";
  }else{
    avatar.style.backgroundImage = "";
    avatar.textContent = (profile.name || "KP").split(/\s+/).map(x=>x[0]).join("").slice(0,2).toUpperCase();
  }
  [["instagramLink",profile.instagram],["youtubeLink",profile.youtube]].forEach(([id,url])=>{
    const a=$(id);
    if(url){a.href=url;a.classList.remove("disabled");}
    else{a.href="#";a.classList.add("disabled");}
  });
}
function esc(s){
  return String(s ?? "").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}
function imageStyle(url){
  if(!url) return "";
  return `background-image:url("${String(url).replace(/"/g,'\\"')}")`;
}
function imageHtml(url, cls="card-image"){
  return url ? `<div class="${cls}" style="${imageStyle(url)}"></div>` : `<div class="${cls} no-image">GAME</div>`;
}

function render(){
  document.body.classList.toggle("admin-mode", admin);
  $("gamesGrid").innerHTML = data.map(game => `
    <article class="game-card" onclick="openGame('${game.id}')">
      ${imageHtml(game.image)}
      <button class="mini-btn card-edit edit-pill" onclick="event.stopPropagation();editGame('${game.id}')">Edit</button>
      <div class="card-body">
        <h3>${esc(game.name)}</h3>
        <p>${esc(game.description)}</p>
        <span class="sub-count">${game.subdivisions.length} subdivision${game.subdivisions.length===1?"":"s"}</span>
      </div>
    </article>
  `).join("");
  $("emptyState").classList.toggle("hidden", data.length !== 0);
  renderAdminList();
}

function openGame(id){
  const game = data.find(x=>x.id===id);
  if(!game) return;
  $("gameModalTitle").textContent = game.name;
  $("gameDetails").innerHTML = `
    ${imageHtml(game.image,"details-image")}
    <p class="details-description">${esc(game.description)}</p>
    <h3>Subdivisions</h3>
    <div class="sub-grid">
      ${game.subdivisions.map(sub => `
        <div class="sub-card" onclick="openSub('${game.id}','${sub.id}')">
          ${sub.image ? `<img src="${esc(sub.image)}" alt="">` : `<div class="sub-placeholder no-image">SUB</div>`}
          <div><strong>${esc(sub.name)}</strong><span>${esc(sub.description || "")}</span></div>
        </div>
      `).join("") || "<p class='muted'>No subdivisions yet.</p>"}
    </div>
  `;
  $("gameModal").classList.remove("hidden");
}

function openSub(gameId, subId){
  const game = data.find(x=>x.id===gameId);
  const sub = game?.subdivisions.find(x=>x.id===subId);
  if(!sub) return;
  $("gameModalTitle").textContent = `${game.name} · ${sub.name}`;
  $("gameDetails").innerHTML = `
    ${imageHtml(sub.image,"details-image")}
    <h3>${esc(sub.name)}</h3>
    <p class="details-description">${esc(sub.description || "No description added yet.")}</p>
    <button class="secondary-btn" onclick="openGame('${game.id}')">← Back to ${esc(game.name)}</button>
  `;
}

function renderAdminList(){
  if(!admin){ $("adminList").innerHTML=""; return; }
  $("adminList").innerHTML = data.map(game => `
    <div class="admin-item">
      <div class="admin-item-head">
        <div><h3>${esc(game.name)}</h3><span class="muted">${game.subdivisions.length} subdivisions</span></div>
        <div class="admin-buttons">
          <button class="mini-btn" onclick="editGame('${game.id}')">Edit</button>
          <button class="mini-btn" onclick="addSub('${game.id}')">+ Subdivision</button>
          <button class="mini-btn delete" onclick="deleteGame('${game.id}')">Delete</button>
        </div>
      </div>
      <div class="sub-admin">
        ${game.subdivisions.map(sub=>`
          <div class="sub-row">
            <span>${esc(sub.name)}</span>
            <div class="admin-buttons">
              <button class="mini-btn" onclick="editSub('${game.id}','${sub.id}')">Edit</button>
              <button class="mini-btn delete" onclick="deleteSub('${game.id}','${sub.id}')">Delete</button>
            </div>
          </div>`).join("") || "<span class='muted'>No subdivisions</span>"}
      </div>
    </div>
  `).join("");
}

function showModal(id){ $(id).classList.remove("hidden"); }
function hideModal(id){ $(id).classList.add("hidden"); }

$("adminBtn").onclick = () => { showModal("adminModal"); updateAdminUI(); };
$("addGameTop").onclick = () => addGame();
$("addGameBtn").onclick = () => addGame();

function updateAdminUI(){
  $("loginArea").classList.toggle("hidden", admin);
  $("adminArea").classList.toggle("hidden", !admin);
  renderAdminList();
}

$("loginBtn").onclick = () => {
  if($("adminPassword").value === "2255Kuttan"){
    admin = true;
    sessionStorage.setItem(ADMIN_KEY,"1");
    $("loginMsg").textContent = "";
    updateAdminUI(); render();
  }else{
    $("loginMsg").textContent = "Wrong password.";
  }
};

$("logoutBtn").onclick = () => {
  admin = false; sessionStorage.removeItem(ADMIN_KEY); updateAdminUI(); render();
};

function addGame(){
  if(!admin) return;
  openEditor("game", null, null);
}
function editGame(id){ if(admin) openEditor("game", id, null); }
function addSub(gameId){ if(admin) openEditor("sub", null, gameId); }
function editSub(gameId, subId){ if(admin) openEditor("sub", subId, gameId); }

function openEditor(type, id, gameId){
  $("editType").value=type;
  $("editGameId").value=type==="game" ? (id||"") : (gameId||"");
  $("editSubId").value=type==="sub" ? (id||"") : "";
  $("editorTitle").textContent = type==="game" ? (id ? "Edit Game" : "Add Game") : (id ? "Edit Subdivision" : "Add Subdivision");
  $("parentGameField").classList.toggle("hidden", type!=="sub");
  $("editParentGame").innerHTML = data.map(g=>`<option value="${g.id}">${esc(g.name)}</option>`).join("");
  if(type==="game" && id){
    const g=data.find(x=>x.id===id);
    $("editName").value=g.name; $("editImage").value=g.image||""; $("editDescription").value=g.description||"";
  }else if(type==="sub" && id){
    const g=data.find(x=>x.id===gameId); const s=g?.subdivisions.find(x=>x.id===id);
    $("editName").value=s?.name||""; $("editImage").value=s?.image||""; $("editDescription").value=s?.description||"";
    $("editParentGame").value=gameId;
  }else{
    $("editName").value=""; $("editImage").value=""; $("editDescription").value="";
    if(type==="sub") $("editParentGame").value=gameId || data[0]?.id || "";
  }
  showModal("editorModal");
}

$("editorForm").onsubmit = e => {
  e.preventDefault();
  if(!admin) return;
  const type=$("editType").value, name=$("editName").value.trim(), image=$("editImage").value.trim(), description=$("editDescription").value.trim();
  if(!name) return;
  if(type==="game"){
    const id=$("editGameId").value;
    if(id){
      const g=data.find(x=>x.id===id); if(g){g.name=name;g.image=image;g.description=description;}
    }else{
      data.push({id:uid("game"),name,image,description,subdivisions:[]});
    }
  }else{
    const parent=$("editParentGame").value;
    const subId=$("editSubId").value;
    // If editing, remove from old parent first if parent changed.
    let found=null;
    for(const g of data){
      const idx=g.subdivisions.findIndex(s=>s.id===subId);
      if(idx>=0){found=g.subdivisions.splice(idx,1)[0];break;}
    }
    const target=data.find(g=>g.id===parent);
    if(target){
      if(found){found.name=name;found.image=image;found.description=description;target.subdivisions.push(found);}
      else target.subdivisions.push({id:uid("sub"),name,image,description});
    }
  }
  saveData(); hideModal("editorModal"); updateAdminUI();
};

function deleteGame(id){
  if(!admin) return;
  const g=data.find(x=>x.id===id);
  if(g && confirm(`Delete "${g.name}" and all its subdivisions?`)){
    data=data.filter(x=>x.id!==id); saveData(); updateAdminUI();
  }
}
function deleteSub(gameId, subId){
  if(!admin) return;
  const g=data.find(x=>x.id===gameId);
  const s=g?.subdivisions.find(x=>x.id===subId);
  if(g && s && confirm(`Delete "${s.name}"?`)){
    g.subdivisions=g.subdivisions.filter(x=>x.id!==subId); saveData(); updateAdminUI();
  }
}

$("exportBtn").onclick=()=>{
  const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
  const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="arjun-gaming-data.json"; a.click();
  URL.revokeObjectURL(a.href);
};
$("importFile").onchange=e=>{
  const file=e.target.files[0]; if(!file)return;
  const reader=new FileReader();
  reader.onload=()=>{
    try{
      const imported=JSON.parse(reader.result);
      if(!Array.isArray(imported)) throw Error();
      data=imported; saveData(); updateAdminUI(); alert("Data imported.");
    }catch(err){alert("Invalid JSON file.");}
  };
  reader.readAsText(file);
};
$("resetBtn").onclick=()=>{
  if(confirm("Reset everything to the original games?")){data=clone(DEFAULT_DATA);saveData();updateAdminUI();}
};

function openProfileEditor(){
  if(!admin) return;
  $("profileNameInput").value=profile.name||"";
  $("profileImageInput").value=profile.image||"";
  $("profileBioInput").value=profile.bio||"";
  $("instagramInput").value=profile.instagram||"";
  $("youtubeInput").value=profile.youtube||"";
  showModal("profileModal");
}
$("editProfileTop").onclick=openProfileEditor;

$("profileForm").onsubmit=e=>{
  e.preventDefault();
  if(!admin) return;
  profile={
    name:$("profileNameInput").value.trim() || "Kuttan PP",
    image:$("profileImageInput").value.trim(),
    bio:$("profileBioInput").value.trim(),
    instagram:$("instagramInput").value.trim(),
    youtube:$("youtubeInput").value.trim()
  };
  saveProfile();
  hideModal("profileModal");
};

document.querySelectorAll("[data-close]").forEach(btn=>btn.onclick=()=>hideModal(btn.dataset.close));
document.querySelectorAll(".modal").forEach(m=>m.addEventListener("click",e=>{if(e.target===m)m.classList.add("hidden")}));

render();
