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
    const previewId = urlInputId === "editImage" ? "editImagePreview" : "profileImagePreview";
    const preview = $(previewId);
    if(preview){
      preview.src = url;
      preview.classList.remove("hidden");
    }
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
    normalizeTree(data);
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
  if(!url) return `<div class="${cls} no-image">GAME</div>`;
  const safeUrl = esc(url);
  return `<img class="${cls}" src="${safeUrl}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`+
         `<div class="${cls} no-image image-fallback" style="display:none">IMAGE UNAVAILABLE</div>`;
}

function normalizeNode(node){
  if(!node || typeof node !== "object") return;
  if(!Array.isArray(node.subdivisions)) node.subdivisions=[];
  node.display = node.display === "image" || node.image ? "image" : "text";
  node.subdivisions.forEach(normalizeNode);
}
function normalizeTree(list){ (list || []).forEach(normalizeNode); }
function findNodeAndParent(list,id,parent=null){
  for(const node of (list||[])){
    if(node.id===id) return {node,parent};
    const found=findNodeAndParent(node.subdivisions,id,node);
    if(found) return found;
  }
  return null;
}
function allSubOptions(list,gameId,prefix="",out=[]){
  for(const node of (list||[])){
    const label = prefix ? `${prefix} → ${node.name}` : node.name;
    out.push({value:`${gameId}::${node.id}`,label});
    allSubOptions(node.subdivisions,gameId,label,out);
  }
  return out;
}
function displayNodeHtml(node, onclick){
  const imageMode=node.display==="image";
  const visual=imageMode && node.image
    ? `<img src="${esc(node.image)}" alt="" loading="lazy">`
    : imageMode ? `<div class="sub-placeholder no-image">IMAGE</div>` : `<div class="sub-text-icon">TEXT</div>`;
  return `<div class="sub-card ${imageMode?'image-mode':'text-mode'}" ${onclick ? `onclick="${onclick}"` : ""}>${visual}<div><strong>${esc(node.name)}</strong>${node.description?`<span>${esc(node.description)}</span>`:""}${node.subdivisions.length?`<small class="nested-count">${node.subdivisions.length} child${node.subdivisions.length===1?'':'ren'}</small>`:""}</div></div>`;
}
function renderSubCards(gameId,nodes){
  return (nodes||[]).map(node=>displayNodeHtml(node,`openNode('${gameId}','${node.id}')`)).join("") || "<p class='muted'>No subdivisions yet.</p>";
}
function render(){
  normalizeTree(data);
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
  const game=data.find(x=>x.id===id); if(!game) return;
  $("gameModalTitle").textContent=game.name;
  $("gameDetails").innerHTML=`
    ${game.image ? imageHtml(game.image,"details-image") : ""}
    <p class="details-description">${esc(game.description || "")}</p>
    <h3>Subdivisions</h3>
    <div class="sub-grid">${renderSubCards(game.id,game.subdivisions)}</div>`;
  $("gameModal").classList.remove("hidden");
}

function openNode(gameId,nodeId){
  const game=data.find(x=>x.id===gameId); const found=findNodeAndParent(game?.subdivisions,nodeId);
  if(!game || !found) return;
  const node=found.node;
  $("gameModalTitle").textContent=`${game.name} · ${node.name}`;
  const parentBack=found.parent ? `<button class="secondary-btn" onclick="openNode('${game.id}','${found.parent.id}')">← Back to ${esc(found.parent.name)}</button>` : `<button class="secondary-btn" onclick="openGame('${game.id}')">← Back to ${esc(game.name)}</button>`;
  $("gameDetails").innerHTML=`
    ${node.display==="image" && node.image ? imageHtml(node.image,"details-image") : ""}
    <h3>${esc(node.name)}</h3>
    ${node.description?`<p class="details-description">${esc(node.description)}</p>`:""}
    <h3>Subdivisions</h3>
    <div class="sub-grid">${renderSubCards(game.id,node.subdivisions)}</div>
    ${parentBack}`;
}

function renderAdminTree(gameId,nodes,depth=0){
  return (nodes||[]).map(node=>`
    <div class="sub-row ${depth?'child-row':''}" style="margin-left:${depth*18}px">
      <div>
        <span>${depth?'↳ ':''}${esc(node.name)}</span>
        <span class="muted nested-label">${node.display==='image'?'IMAGE':'TEXT'} · ${node.subdivisions.length} child${node.subdivisions.length===1?'':'ren'}</span>
      </div>
      <div class="admin-buttons">
        <button class="mini-btn" onclick="editNode('${gameId}','${node.id}')">Edit</button>
        <button class="mini-btn" onclick="addChildSub('${gameId}','${node.id}')">+ Subdivision</button>
        <button class="mini-btn delete" onclick="deleteNode('${gameId}','${node.id}')">Delete</button>
      </div>
    </div>${renderAdminTree(gameId,node.subdivisions,depth+1)}`).join("");
}
function renderAdminList(){
  if(!admin){ $("adminList").innerHTML=""; return; }
  $("adminList").innerHTML=data.map(game=>`
    <div class="admin-item">
      <div class="admin-item-head">
        <div><h3>${esc(game.name)}</h3><span class="muted">${game.subdivisions.length} top-level subdivisions</span></div>
        <div class="admin-buttons">
          <button class="mini-btn" onclick="editGame('${game.id}')">Edit</button>
          <button class="mini-btn" onclick="addSub('${game.id}')">+ Subdivision</button>
          <button class="mini-btn delete" onclick="deleteGame('${game.id}')">Delete</button>
        </div>
      </div>
      <div class="sub-admin">${renderAdminTree(game.id,game.subdivisions)||"<span class='muted'>No subdivisions</span>"}</div>
    </div>`).join("");
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
function addSub(gameId){ if(admin) openEditor("sub",null,gameId,null); }
function editNode(gameId,nodeId){ if(admin) openEditor("sub",nodeId,gameId,null); }
function addChildSub(gameId,parentId){ if(admin) openEditor("sub",null,gameId,parentId); }

function openEditor(type,id,gameId,parentSubId){
  $("editType").value=type;
  $("editGameId").value=type==="game"?(id||""):(gameId||"");
  $("editSubId").value=type==="sub"?(id||""):"";
  $("editorTitle").textContent=type==="game"?(id?"Edit Game":"Add Game"):(id?"Edit Subdivision":"Add Subdivision");
  $("parentGameField").classList.toggle("hidden",type==="game");
  $("parentSubField").classList.toggle("hidden",type==="game");
  $("displayTypeField").classList.toggle("hidden",type==="game");
  $("editParentGame").innerHTML=data.map(g=>`<option value="${g.id}">${esc(g.name)}</option>`).join("");
  const options=data.flatMap(g=>allSubOptions(g.subdivisions,g.id).map(o=>({gameId:g.id,...o})));
  $("editParentSub").innerHTML=`<option value="">Top-level subdivision</option>`+options.map(o=>`<option value="${o.value}">${esc(o.label)}</option>`).join("");
  $("editImageFile").value="";
  $("editImageStatus").textContent="Upload an image from your PC or use a public image URL.";
  $("editImagePreview").classList.add("hidden"); $("editImagePreview").removeAttribute("src");

  let current=null;
  if(type==="game" && id) current=data.find(x=>x.id===id);
  if(type==="sub" && id) current=findNodeAndParent(data.flatMap(g=>g.subdivisions),id)?.node;
  $("editName").value=current?.name||"";
  $("editImage").value=current?.image||"";
  $("editDescription").value=current?.description||"";
  $("editDisplayType").value=current?.display || (current?.image?"image":"text");
  if(type!=="game"){
    const owner=gameId || data[0]?.id || "";
    $("editParentGame").value=owner;
    if(parentSubId){ $("editParentSub").value=`${owner}::${parentSubId}`; }
    else if(current){
      const found=findNodeAndParent(data.find(g=>g.id===owner)?.subdivisions,current.id);
      $("editParentSub").value=found?.parent?`${owner}::${found.parent.id}`:"";
    } else $("editParentSub").value="";
  }
  updateDisplayTypeUI();
  const currentImage=$("editImage").value.trim();
  if(currentImage){ $("editImagePreview").src=currentImage; $("editImagePreview").classList.remove("hidden"); }
  showModal("editorModal");
}

function updateDisplayTypeUI(){
  const isImage=$("editDisplayType")?.value==="image";
  $("imageFieldGroup")?.classList.toggle("hidden",!isImage);
  if(!isImage){ $("editImage").value=""; $("editImageFile").value=""; $("editImagePreview")?.classList.add("hidden"); }
}
$("editDisplayType").onchange=updateDisplayTypeUI;

function removeNodeById(list,id){
  for(let i=0;i<list.length;i++){
    if(list[i].id===id) return list.splice(i,1)[0];
    const found=removeNodeById(list[i].subdivisions||[],id);
    if(found) return found;
  }
  return null;
}

$("editorForm").onsubmit=async e=>{
  e.preventDefault(); if(!admin) return;
  const type=$("editType").value;
  const name=$("editName").value.trim();
  const description=$("editDescription").value.trim();
  const display=type==="game"?"image":$("editDisplayType").value;
  const image=display==="image" ? $("editImage").value.trim() : "";
  if(!name) return;

  if(type==="game"){
    const id=$("editGameId").value; const g=id?data.find(x=>x.id===id):null;
    if(g){g.name=name;g.image=image;g.description=description;}
    else data.push({id:uid("game"),name,image,description,subdivisions:[]});
  }else{
    const parentGameId=$("editParentGame").value;
    const parentPath=$("editParentSub").value;
    const id=$("editSubId").value;
    const game=data.find(g=>g.id===parentGameId); if(!game) return;
    let found=null;
    if(id) found=removeNodeById(game.subdivisions,id);
    const node=found || {id:uid("sub"),name:"",image:"",description:"",display:"text",subdivisions:[]};
    node.name=name; node.image=image; node.description=description; node.display=display;
    if(parentPath){
      const [,parentId]=parentPath.split("::");
      const parent=findNodeAndParent(game.subdivisions,parentId)?.node;
      if(!parent) return;
      if(!Array.isArray(parent.subdivisions)) parent.subdivisions=[];
      parent.subdivisions.push(node);
    }else game.subdivisions.push(node);
  }
  normalizeTree(data);
  if(await saveSiteData()){ hideModal("editorModal"); updateAdminUI(); }
};

async function deleteNode(gameId,nodeId){
  if(!admin) return;
  const game=data.find(g=>g.id===gameId); const found=findNodeAndParent(game?.subdivisions,nodeId);
  if(found?.node && confirm(`Delete "${found.node.name}" and all its children?`)){
    if(found.parent) found.parent.subdivisions=found.parent.subdivisions.filter(x=>x.id!==nodeId);
    else game.subdivisions=game.subdivisions.filter(x=>x.id!==nodeId);
    if(await saveSiteData()) updateAdminUI();
  }
}

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
