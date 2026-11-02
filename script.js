const SUPABASE_URL = "https://nctzzqfyfevmawhensyk.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_RL_rARffVtRS7kGLTO-xyg_z2hiJd_a";
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const IMAGE_BUCKET = "images";
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

function safeFileName(name){
  return String(name || "image").toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/-+/g, "-").slice(-80);
}

async function uploadImage(file, statusEl){
  if(!admin) throw new Error("Please log in as admin first.");
  if(!file) throw new Error("Choose an image first.");
  if(!file.type.startsWith("image/")) throw new Error("Please select an image file.");
  if(file.size > MAX_IMAGE_SIZE) throw new Error("Image must be 5 MB or smaller.");

  if(statusEl) statusEl.textContent = "Uploading image…";

  const path = `admin/${crypto.randomUUID()}-${safeFileName(file.name)}`;
  const { error } = await db.storage.from(IMAGE_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type
  });

  if(error){
    if(statusEl) statusEl.textContent = "Upload failed: " + error.message;
    throw error;
  }

  const { data } = db.storage.from(IMAGE_BUCKET).getPublicUrl(path);
  if(!data?.publicUrl) throw new Error("Could not create image URL.");

  if(statusEl) statusEl.textContent = "Image uploaded successfully.";
  return data.publicUrl;
}

async function handleImageFile(fileInputId, urlInputId, statusId){
  const file = $(fileInputId).files[0];
  if(!file) return;
  try{
    const url = await uploadImage(file, $(statusId));
    $(urlInputId).value = url;
  }catch(error){
    console.error(error);
    alert(error.message || "Image upload failed.");
  }
}


const DEFAULT_DATA = [
  {
    id:"valorant", name:"VALORANT", image:"", description:"Competitive tactical shooter.",
    subdivisions:[
      {id:"ranked",name:"Ranked",image:"",description:"Competitive ranked gameplay."},
      {id:"esports",name:"Esports",image:"",description:"Teams, tournaments and competitive play."}
    ]
  },
  {
    id:"fivem", name:"GTA V — FiveM", image:"", description:"Roleplay, characters and custom servers.",
    subdivisions:[
      {id:"characters",name:"Characters",image:"",description:"My FiveM characters and profiles."},
      {id:"gang-rp",name:"Gang RP",image:"",description:"Gang roleplay and stories."},
      {id:"pd-rp",name:"PD RP",image:"",description:"Police Department roleplay."},
      {id:"citizen-rp",name:"Citizen RP",image:"",description:"Citizen roleplay and everyday stories."}
    ]
  },
  {
    id:"gta-v", name:"GTA V", image:"", description:"Grand Theft Auto V.",
    subdivisions:[
      {id:"story",name:"Story Mode",image:"",description:"Story mode gameplay."},
      {id:"online",name:"GTA Online",image:"",description:"Online gameplay."}
    ]
  }
];

const DEFAULT_PROFILE = {
  name:"Kuttan PP", image:"", bio:"Gaming • FiveM RP • VALORANT", instagram:"", youtube:""
};

let data = clone(DEFAULT_DATA);
let profile = {...DEFAULT_PROFILE};
let admin = false;

const $ = id => document.getElementById(id);
function clone(x){ return JSON.parse(JSON.stringify(x)); }
function uid(prefix="item"){ return prefix+"-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,7); }

async function loadSiteData(){
  const { data: row, error } = await db.from("site_data").select("data").eq("id",1).maybeSingle();
  if(error){ console.error(error); return; }
  if(row?.data){
    data = Array.isArray(row.data.games) ? row.data.games : clone(DEFAULT_DATA);
    data.forEach(g => (g.subdivisions || []).forEach(sub => { if(!Array.isArray(sub.subdivisions)) sub.subdivisions=[]; }));
    profile = {...DEFAULT_PROFILE, ...(row.data.profile || {})};
  }
}

async function saveSiteData(){
  const { error } = await db.from("site_data").update({data:{games:data, profile}}).eq("id",1);
  if(error){
    console.error(error);
    alert("Could not save changes. Make sure you are logged in as the admin.");
    return false;
  }
  renderProfile();
  render();
  return true;
}

function renderProfile(){
  $("profileName").textContent = profile.name || "Kuttan PP";
  $("profileBio").textContent = profile.bio || "";
  const avatar = $("profileAvatar");
  if(profile.image){
    avatar.style.backgroundImage = `url("${String(profile.image).replace(/"/g,'\\"')}")`;
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
          <div><strong>${esc(sub.name)}</strong><span>${esc(sub.description || "")}</span>${(sub.subdivisions||[]).length ? `<small class="nested-count">${sub.subdivisions.length} sub-level${sub.subdivisions.length===1?"":"s"}</small>` : ""}</div>
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
  const children = Array.isArray(sub.subdivisions) ? sub.subdivisions : [];
  $("gameModalTitle").textContent = `${game.name} · ${sub.name}`;
  $("gameDetails").innerHTML = `
    ${imageHtml(sub.image,"details-image")}
    <h3>${esc(sub.name)}</h3>
    <p class="details-description">${esc(sub.description || "No description added yet.")}</p>
    <h3>Subdivisions</h3>
    <div class="sub-grid">
      ${children.map(child => `
        <div class="sub-card" onclick="openNestedSub('${game.id}','${sub.id}','${child.id}')">
          ${child.image ? `<img src="${esc(child.image)}" alt="">` : `<div class="sub-placeholder no-image">SUB</div>`}
          <div><strong>${esc(child.name)}</strong><span>${esc(child.description || "")}</span></div>
        </div>
      `).join("") || "<p class='muted'>No subdivisions yet.</p>"}
    </div>
    <button class="secondary-btn" onclick="openGame('${game.id}')">← Back to ${esc(game.name)}</button>
  `;
}

function openNestedSub(gameId, subId, childId){
  const game = data.find(x=>x.id===gameId);
  const sub = game?.subdivisions.find(x=>x.id===subId);
  const child = sub?.subdivisions?.find(x=>x.id===childId);
  if(!child) return;
  $("gameModalTitle").textContent = `${game.name} · ${sub.name} · ${child.name}`;
  $("gameDetails").innerHTML = `
    ${imageHtml(child.image,"details-image")}
    <h3>${esc(child.name)}</h3>
    <p class="details-description">${esc(child.description || "No description added yet.")}</p>
    <button class="secondary-btn" onclick="openSub('${game.id}','${sub.id}')">← Back to ${esc(sub.name)}</button>
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
          <div class="sub-row nested-parent-row">
            <div>
              <span>${esc(sub.name)}</span>
              <span class="muted nested-label">${(sub.subdivisions||[]).length} sub-level${(sub.subdivisions||[]).length===1?"":"s"}</span>
            </div>
            <div class="admin-buttons">
              <button class="mini-btn" onclick="editSub('${game.id}','${sub.id}')">Edit</button>
              <button class="mini-btn" onclick="addNestedSub('${game.id}','${sub.id}')">+ Subdivision</button>
              <button class="mini-btn delete" onclick="deleteSub('${game.id}','${sub.id}')">Delete</button>
            </div>
          </div>
          <div class="nested-admin">
            ${(sub.subdivisions||[]).map(child=>`
              <div class="sub-row child-row">
                <span>↳ ${esc(child.name)}</span>
                <div class="admin-buttons">
                  <button class="mini-btn" onclick="editNestedSub('${game.id}','${sub.id}','${child.id}')">Edit</button>
                  <button class="mini-btn delete" onclick="deleteNestedSub('${game.id}','${sub.id}','${child.id}')">Delete</button>
                </div>
              </div>`).join("")}
          </div>
        `).join("") || "<span class='muted'>No subdivisions</span>"}
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

async function login(){
  const email = $("adminEmail").value.trim();
  const password = $("adminPassword").value;
  $("loginMsg").textContent = "";
  if(!email || !password){ $("loginMsg").textContent = "Enter your email and password."; return; }

  const { error } = await db.auth.signInWithPassword({email,password});
  if(error){ $("loginMsg").textContent = error.message; return; }

  admin = true;
  $("adminPassword").value = "";
  updateAdminUI();
  render();
}

$("loginBtn").onclick = login;

$("profileImageFile").onchange = () => handleImageFile("profileImageFile","profileImageInput","profileImageStatus");
$("editImageFile").onchange = () => handleImageFile("editImageFile","editImage","editImageStatus");
$("adminPassword").addEventListener("keydown", e => { if(e.key==="Enter") login(); });

$("logoutBtn").onclick = async () => {
  await db.auth.signOut();
  admin = false;
  updateAdminUI();
  render();
};

function addGame(){ if(admin) openEditor("game",null,null); }
function editGame(id){ if(admin) openEditor("game",id,null); }
function addSub(gameId){ if(admin) openEditor("sub",null,gameId); }
function editSub(gameId,subId){ if(admin) openEditor("sub",subId,gameId); }
function addNestedSub(gameId,subId){ if(admin) openEditor("nested",null,gameId,subId); }
function editNestedSub(gameId,subId,childId){ if(admin) openEditor("nested",childId,gameId,subId); }

function openEditor(type,id,gameId,parentSubId){
  $("editType").value=type;
  $("editGameId").value=type==="game" ? (id||"") : (gameId||"");
  $("editSubId").value=(type==="sub" || type==="nested") ? (id||"") : "";
  const title = type==="game" ? (id ? "Edit Game" : "Add Game") : type==="sub" ? (id ? "Edit Subdivision" : "Add Subdivision") : (id ? "Edit Subdivision" : "Add Subdivision");
  $("editorTitle").textContent = title;
  $("parentGameField").classList.toggle("hidden",type==="game");
  $("parentSubField").classList.toggle("hidden",type!=="nested");
  $("editParentGame").innerHTML = data.map(g=>`<option value="${g.id}">${esc(g.name)}</option>`).join("");
  $("editParentSub").innerHTML = data.flatMap(g=>(g.subdivisions||[]).map(sub=>`<option value="${g.id}::${sub.id}">${esc(g.name)} → ${esc(sub.name)}</option>`)).join("");

  $("editImageFile").value="";
  $("editImageStatus").textContent="Upload an image from your PC or use a public image URL.";

  if(type==="game" && id){
    const g=data.find(x=>x.id===id);
    $("editName").value=g.name; $("editImage").value=g.image||""; $("editDescription").value=g.description||"";
  }else if(type==="sub" && id){
    const g=data.find(x=>x.id===gameId);
    const s=g?.subdivisions.find(x=>x.id===id);
    $("editName").value=s?.name||""; $("editImage").value=s?.image||""; $("editDescription").value=s?.description||"";
    $("editParentGame").value=gameId;
  }else if(type==="nested" && id){
    const g=data.find(x=>x.id===gameId);
    const parent=g?.subdivisions.find(x=>x.id===parentSubId);
    const s=parent?.subdivisions?.find(x=>x.id===id);
    $("editName").value=s?.name||""; $("editImage").value=s?.image||""; $("editDescription").value=s?.description||"";
    $("editParentSub").value=`${gameId}::${parentSubId}`;
  }else{
    $("editName").value=""; $("editImage").value=""; $("editDescription").value="";
    if(type==="sub") $("editParentGame").value=gameId || data[0]?.id || "";
    if(type==="nested") $("editParentSub").value=`${gameId}::${parentSubId}`;
  }
  showModal("editorModal");
}

$("editorForm").onsubmit = async e => {
  e.preventDefault();
  if(!admin) return;

  const type=$("editType").value;
  const name=$("editName").value.trim();
  const image=$("editImage").value.trim();
  const description=$("editDescription").value.trim();
  if(!name) return;

  if(type==="game"){
    const id=$("editGameId").value;
    if(id){
      const g=data.find(x=>x.id===id);
      if(g){g.name=name;g.image=image;g.description=description;}
    }else{
      data.push({id:uid("game"),name,image,description,subdivisions:[]});
    }
  }else if(type==="sub"){
    const parent=$("editParentGame").value;
    const subId=$("editSubId").value;
    let found=null;
    for(const g of data){
      const idx=g.subdivisions.findIndex(s=>s.id===subId);
      if(idx>=0){found=g.subdivisions.splice(idx,1)[0];break;}
    }
    const target=data.find(g=>g.id===parent);
    if(target){
      if(found){found.name=name;found.image=image;found.description=description;if(!Array.isArray(found.subdivisions))found.subdivisions=[];target.subdivisions.push(found);}
      else target.subdivisions.push({id:uid("sub"),name,image,description,subdivisions:[]});
    }
  }else if(type==="nested"){
    const [parentGameId,parentSubId]=$("editParentSub").value.split("::");
    const childId=$("editSubId").value;
    let found=null;
    for(const g of data){
      for(const sub of (g.subdivisions||[])){
        const idx=(sub.subdivisions||[]).findIndex(x=>x.id===childId);
        if(idx>=0){found=sub.subdivisions.splice(idx,1)[0];break;}
      }
      if(found) break;
    }
    const parentGame=data.find(g=>g.id===parentGameId);
    const parentSub=parentGame?.subdivisions.find(s=>s.id===parentSubId);
    if(parentSub){
      if(!Array.isArray(parentSub.subdivisions)) parentSub.subdivisions=[];
      if(found){found.name=name;found.image=image;found.description=description;parentSub.subdivisions.push(found);}
      else parentSub.subdivisions.push({id:uid("sub2"),name,image,description,subdivisions:[]});
    }
  }

  if(await saveSiteData()){ hideModal("editorModal"); updateAdminUI(); }
};

async function deleteGame(id){
  if(!admin) return;
  const g=data.find(x=>x.id===id);
  if(g && confirm(`Delete "${g.name}" and all its subdivisions?`)){
    data=data.filter(x=>x.id!==id);
    if(await saveSiteData()) updateAdminUI();
  }
}

async function deleteSub(gameId,subId){
  if(!admin) return;
  const g=data.find(x=>x.id===gameId);
  const s=g?.subdivisions.find(x=>x.id===subId);
  if(g && s && confirm(`Delete "${s.name}" and its sub-levels?`)){
    g.subdivisions=g.subdivisions.filter(x=>x.id!==subId);
    if(await saveSiteData()) updateAdminUI();
  }
}

async function deleteNestedSub(gameId,subId,childId){
  if(!admin) return;
  const g=data.find(x=>x.id===gameId);
  const parent=g?.subdivisions.find(x=>x.id===subId);
  const child=parent?.subdivisions?.find(x=>x.id===childId);
  if(parent && child && confirm(`Delete "${child.name}"?`)){
    parent.subdivisions=parent.subdivisions.filter(x=>x.id!==childId);
    if(await saveSiteData()) updateAdminUI();
  }
}

$("exportBtn").onclick=()=>{
  const blob=new Blob([JSON.stringify({games:data,profile},null,2)],{type:"application/json"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download="kuttan-gaming-data.json";
  a.click();
  URL.revokeObjectURL(a.href);
};

$("importFile").onchange=e=>{
  const file=e.target.files[0];
  if(!file)return;
  const reader=new FileReader();
  reader.onload=async()=>{
    try{
      const imported=JSON.parse(reader.result);
      if(!Array.isArray(imported) && !Array.isArray(imported.games)) throw Error();
      if(Array.isArray(imported)) data=imported;
      else {
        data=imported.games;
        profile={...DEFAULT_PROFILE,...(imported.profile||{})};
      }
      if(await saveSiteData()){ updateAdminUI(); alert("Data imported."); }
    }catch(err){alert("Invalid JSON file.");}
  };
  reader.readAsText(file);
};

$("resetBtn").onclick=async()=>{
  if(confirm("Reset everything to the original games?")){
    data=clone(DEFAULT_DATA);
    profile={...DEFAULT_PROFILE};
    if(await saveSiteData()) updateAdminUI();
  }
};

function openProfileEditor(){
  if(!admin) return;
  $("profileNameInput").value=profile.name||"";
  $("profileImageInput").value=profile.image||"";
  $("profileImageFile").value="";
  $("profileImageStatus").textContent="Upload an image from your PC or use a public image URL.";
  $("profileBioInput").value=profile.bio||"";
  $("instagramInput").value=profile.instagram||"";
  $("youtubeInput").value=profile.youtube||"";
  showModal("profileModal");
}
$("editProfileTop").onclick=openProfileEditor;

$("profileForm").onsubmit=async e=>{
  e.preventDefault();
  if(!admin) return;
  profile={
    name:$("profileNameInput").value.trim() || "Kuttan PP",
    image:$("profileImageInput").value.trim(),
    bio:$("profileBioInput").value.trim(),
    instagram:$("instagramInput").value.trim(),
    youtube:$("youtubeInput").value.trim()
  };
  if(await saveSiteData()) hideModal("profileModal");
};

document.querySelectorAll("[data-close]").forEach(btn=>btn.onclick=()=>hideModal(btn.dataset.close));
document.querySelectorAll(".modal").forEach(m=>m.addEventListener("click",e=>{if(e.target===m)m.classList.add("hidden")}));

async function init(){
  const { data:{session} } = await db.auth.getSession();
  admin=!!session;
  await loadSiteData();
  renderProfile();
  render();
  updateAdminUI();
}

db.auth.onAuthStateChange((_event,session)=>{
  admin=!!session;
  updateAdminUI();
  render();
});

init();
