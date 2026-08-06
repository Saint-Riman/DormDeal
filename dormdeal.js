/* =========================================================================
   DORM DEAL — DATA & CONTROLLER (WITH PERSISTENCE & GOOGLE SSO)
   ========================================================================= */

const UNIVERSITIES = [
  "Covenant University",
  "University of Lagos (UNILAG)",
  "University of Ibadan (UI)",
  "Obafemi Awolowo University (OAU)",
  "University of Nigeria, Nsukka (UNN)",
  "Ahmadu Bello University (ABU)",
  "Babcock University",
  "Landmark University",
  "Lagos State University (LASU)",
  "Federal University of Technology, Akure (FUTA)",
  "University of Benin (UNIBEN)",
  "Bowen University"
];

const CATEGORIES = [
  "Printing", "Tech Repair", "Laundry", "Tailoring", "Catering",
  "Hairstyling", "Transport & Errands", "Makeup", "Snacks", "Clothes"
];

const CATEGORY_ICON = {
  "Printing":"🖨️", "Tech Repair":"🔧", "Laundry":"🧺", "Tailoring":"🧵",
  "Catering":"🍲", "Hairstyling":"💇🏾‍♀️", "Transport & Errands":"🛵",
  "Makeup":"💄", "Snacks":"🍿", "Clothes":"👕"
};

const DEFAULT_VENDORS = [
  { id:1, name:"CU PrintHub", category:"Printing", university:"Covenant University",
    description:"Same-day printing, binding & lamination right by the SST building.",
    location:"Behind SST Complex", baseDistanceKm:0.3, phone:"0803 111 2201", whatsapp:"2348031112201",
    price:50, priceLabel:"₦50/page", featured:true, discount:"10% off for CU IDs",
    servicesOffered: ["A4/A3 Printing", "Spiral Binding", "Hardcover Project Binding", "Lamination"],
    reliability:{onTimeRate:0.96, cancellationRate:0.02, avgResponseMins:4},
    reviews:[{user:"Tomiwa A.", rating:5, text:"Fastest print spot on campus, never late for a submission.", date:"2 weeks ago"},
             {user:"Chiamaka O.", rating:4, text:"Good quality binding, slightly pricey for colour prints.", date:"1 month ago"}] },

  { id:2, name:"QuickFix Gadget Clinic", category:"Tech Repair", university:"Covenant University",
    description:"Screen, battery & charging port repairs for phones and laptops.",
    location:"Student Hostel Mall", baseDistanceKm:0.6, phone:"0805 220 3391", whatsapp:"2348052203391",
    price:4500, priceLabel:"from ₦4,500", featured:true, discount:"Free diagnosis for students",
    servicesOffered: ["Screen Replacement", "Battery Fix", "Port Soldering", "OS Flashing"],
    reliability:{onTimeRate:0.88, cancellationRate:0.06, avgResponseMins:12},
    reviews:[{user:"David E.", rating:5, text:"Fixed my charging port in 40 minutes, honestly impressive.", date:"3 days ago"}] },

  { id:3, name:"Sparkle Laundromat", category:"Laundry", university:"Covenant University",
    description:"Wash, dry & fold with hostel pickup and drop-off included.",
    location:"Behind Peniel Hall", baseDistanceKm:0.2, phone:"0701 998 4432", whatsapp:"2347019984432",
    price:1500, priceLabel:"₦1,500/bag", featured:false, discount:"",
    servicesOffered: ["Wash & Fold", "Ironing", "Duvet Cleaning"],
    reliability:{onTimeRate:0.79, cancellationRate:0.10, avgResponseMins:22},
    reviews:[{user:"Grace I.", rating:3, text:"Clothes came back clean but a day later than promised.", date:"1 week ago"}] },

  { id:4, name:"Mama Nkechi's Kitchen", category:"Catering", university:"Covenant University",
    description:"Home-style Nigerian meals, bulk trays for fellowships & events.",
    location:"Off-campus, Canaan Land Rd", baseDistanceKm:1.1, phone:"0906 554 2201", whatsapp:"2349065542201",
    price:1200, priceLabel:"₦1,200/plate", featured:true, discount:"Bulk tray discount at 20 plates",
    servicesOffered: ["Jollof Rice Trays", "Fried Rice Trays", "Egusi & Pounded Yam", "Plantain Extra"],
    reliability:{onTimeRate:0.93, cancellationRate:0.01, avgResponseMins:6},
    reviews:[{user:"Emeka N.", rating:5, text:"The jollof rice hits different, and delivery is always on time.", date:"2 days ago"}] }
];

let vendors = [];
let groupOrders = [
  { id:1, title:"Bulk Screen-Protector Pack", category:"Tech Repair", vendorName:"QuickFix Gadget Clinic",
    unit:"units", threshold:15, joined:11, discountPct:20, windowLabel:"This week, Zion & Peniel Hall pickup" },
  { id:2, title:"Jollof Rice Trays for Fellowship", category:"Catering", vendorName:"Mama Nkechi's Kitchen",
    unit:"trays", threshold:10, joined:10, discountPct:15, windowLabel:"Friday 5–7pm, hall delivery" },
  { id:3, title:"A4 Ream Group Order", category:"Printing", vendorName:"CU PrintHub",
    unit:"reams", threshold:20, joined:6, discountPct:12, windowLabel:"Before Monday's exams" }
];

let deliveries = [
  { hall:"Peniel Hall", slot:"Today, 4:00–5:00pm",
    orders:[{vendor:"CU PrintHub", item:"Project binding x2"}, {vendor:"Sparkle Laundromat", item:"Laundry bag pickup"}] },
  { hall:"Zion Hall", slot:"Today, 6:00–7:00pm",
    orders:[{vendor:"QuickFix Gadget Clinic", item:"Screen protector"}] }
];

// USER STORAGE & AUTH STATE
let registeredUsers = [];
let currentUser = null; 
let userOrders = []; 

let activeUni = "Covenant University";
let activeCategory = "All";
let compareOpen = false;

/* ------------------ RELIABILITY CALCULATIONS ------------------ */
const RELIABILITY_WEIGHTS = { onTime:0.5, cancellation:0.3, response:0.2 };
function reliabilityScore(r){
  const onTimeScore = r.onTimeRate * 100;
  const cancelScore = (1 - r.cancellationRate) * 100;
  const responseScore = Math.max(0, 100 - r.avgResponseMins * 2.5);
  const score = onTimeScore*RELIABILITY_WEIGHTS.onTime + cancelScore*RELIABILITY_WEIGHTS.cancellation + responseScore*RELIABILITY_WEIGHTS.response;
  return Math.round(Math.max(0, Math.min(100, score)));
}
function reliabilityLabel(score){
  if(score >= 85) return {label:"Excellent", color:"#1F9D82"};
  if(score >= 70) return {label:"Good", color:"#F2A83B"};
  if(score >= 50) return {label:"Fair", color:"#D98A16"};
  return {label:"Needs Improvement", color:"#FF6452"};
}
function avgRating(vendor){
  if(!vendor.reviews.length) return 0;
  return vendor.reviews.reduce((s,r)=>s+r.rating,0)/vendor.reviews.length;
}
function starString(n){
  const full = Math.round(n);
  return "★★★★★".slice(0,full) + "☆☆☆☆☆".slice(0, 5-full);
}

/* ------------------ INITIALIZATION ------------------ */
function populateSelect(select, options, withAll){
  select.innerHTML = "";
  if(withAll){
    const o = document.createElement("option"); o.value="All"; o.textContent="All Nigerian Universities";
    select.appendChild(o);
  }
  options.forEach(u=>{
    const o = document.createElement("option"); o.value=u; o.textContent=u;
    select.appendChild(o);
  });
}

function openModal(id){ document.getElementById(id).classList.add("open"); }
function closeModal(id){ document.getElementById(id).classList.remove("open"); }

function closeHamburgerMenu(){
  document.getElementById("hamburgerBtn").classList.remove("open");
  document.getElementById("navDrawer").classList.remove("open");
  document.getElementById("navOverlay").classList.remove("open");
}

function init(){
  // 1. Load persisted data from localStorage
  loadPersistedData();

  populateSelect(document.getElementById("uniSelect"), UNIVERSITIES, false);
  document.getElementById("uniSelect").value = activeUni;
  populateSelect(document.getElementById("signupUni"), UNIVERSITIES, false);

  renderCategoryChips();
  renderTicker();
  renderVendors();
  renderPools();
  renderQueue();
  updateStats();
  initHamburgerMenu();

  // Restore Active Session if remembered
  restoreUserSession();

  // Event Listeners
  document.getElementById("uniSelect").addEventListener("change", e=>{
    activeUni = e.target.value; renderVendors(); if(compareOpen) renderCompare();
  });
  document.getElementById("scanLocationBtn").addEventListener("click", recalcDistances);
  document.getElementById("compareToggle").addEventListener("click", toggleCompare);

  // Auth Modal Triggers
  document.getElementById("openLoginBtn").addEventListener("click", ()=>openAuthModal("login"));
  document.getElementById("openSignupBtn").addEventListener("click", ()=>openAuthModal("signup"));
  document.getElementById("drawerLoginBtn").addEventListener("click", ()=>openAuthModal("login"));
  document.getElementById("drawerSignupBtn").addEventListener("click", ()=>openAuthModal("signup"));
  document.getElementById("openProfileBtn").addEventListener("click", openProfileModal);
  document.getElementById("logoutBtn").addEventListener("click", handleLogout);

  // Google Sign In Handlers
  document.getElementById("googleSignupBtn").addEventListener("click", () => handleGoogleAuth("buyer"));
  document.getElementById("googleLoginBtn").addEventListener("click", () => handleGoogleAuth("buyer"));

  // Modal Close Handlers
  document.querySelectorAll(".modal-close").forEach(btn=>{
    btn.addEventListener("click", ()=>closeModal(btn.dataset.close));
  });
  document.querySelectorAll(".modal-backdrop").forEach(bd=>{
    bd.addEventListener("click", e=>{ if(e.target===bd) closeModal(bd.id); });
  });

  // Auth Tabs Toggle
  document.querySelectorAll("[data-authtab]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      switchAuthTab(btn.dataset.authtab);
    });
  });

  // Signup Role Toggle (Buyer vs Seller)
  document.querySelectorAll("input[name='userRole']").forEach(radio=>{
    radio.addEventListener("change", (e)=>{
      const sellerFields = document.getElementById("sellerFields");
      sellerFields.style.display = e.target.value === "seller" ? "block" : "none";
    });
  });

  // Auth Form Submissions
  document.getElementById("signupForm").addEventListener("submit", handleSignup);
  document.getElementById("loginForm").addEventListener("submit", handleLogin);

  // Start Withdrawal Window Clock Tick
  setInterval(renderActiveOrders, 10000);
}

/* ------------------ PERSISTENCE ENGINE ------------------ */
function loadPersistedData() {
  const savedUsers = localStorage.getItem("dormdeal_users");
  if (savedUsers) {
    registeredUsers = JSON.parse(savedUsers);
  } else {
    registeredUsers = [
      { name: "Demo Student", email: "student@cu.edu.ng", password: "password123", role: "buyer", university: "Covenant University", location: "Mary Hall, Room 204", phone: "08012345678", picture: "https://via.placeholder.com/150", businessName: "", servicesOffered: [] },
      { name: "Demo Vendor", email: "vendor@cu.edu.ng", password: "password123", role: "seller", university: "Covenant University", location: "Hostel Mall, Shop B", phone: "08087654321", picture: "https://via.placeholder.com/150", businessName: "QuickFix Clinic", servicesOffered: ["Tech Repair"] }
    ];
  }

  const savedVendors = localStorage.getItem("dormdeal_vendors");
  if (savedVendors) {
    vendors = JSON.parse(savedVendors);
  } else {
    vendors = [...DEFAULT_VENDORS];
  }

  const savedOrders = localStorage.getItem("dormdeal_orders");
  if (savedOrders) {
    userOrders = JSON.parse(savedOrders);
  }
}

function restoreUserSession() {
  const persistentSession = localStorage.getItem("dormdeal_session");
  const tempSession = sessionStorage.getItem("dormdeal_session");
  
  const savedUser = persistentSession || tempSession;
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
    finishAuth();
  }
}

function saveUserSession(user, rememberMe) {
  currentUser = user;
  const jsonUser = JSON.stringify(user);
  if (rememberMe) {
    localStorage.setItem("dormdeal_session", jsonUser);
    sessionStorage.removeItem("dormdeal_session");
  } else {
    sessionStorage.setItem("dormdeal_session", jsonUser);
    localStorage.removeItem("dormdeal_session");
  }
}

/* ------------------ AUTHENTICATION & PROFILE LOGIC ------------------ */
function switchAuthTab(targetTabId){
  document.querySelectorAll("[data-authtab]").forEach(b => {
    b.classList.toggle("active", b.dataset.authtab === targetTabId);
  });
  document.querySelectorAll("#authModal .tab-panel").forEach(p => {
    p.classList.toggle("active", p.id === targetTabId);
  });
}

function openAuthModal(tab){
  openModal("authModal");
  switchAuthTab(tab === "signup" ? "signupTab" : "loginTab");
}

function handleSignup(e){
  e.preventDefault();
  const name = document.getElementById("signupName").value.trim();
  const email = document.getElementById("signupEmail").value.trim();
  const university = document.getElementById("signupUni").value;
  const location = document.getElementById("signupLocation").value.trim();
  const phone = document.getElementById("signupPhone").value.trim();
  const password = document.getElementById("signupPassword").value;
  const role = document.querySelector("input[name='userRole']:checked").value;

  if(registeredUsers.some(u => u.email.toLowerCase() === email.toLowerCase())){
    alert("An account with this email already exists!");
    return;
  }

  const newUser = {
    name, email, password, role, university, location, phone,
    picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1F9D82&color=fff`,
    businessName: role === "seller" ? document.getElementById("signupBusiness").value.trim() : "",
    servicesOffered: role === "seller" ? [document.getElementById("signupService").value.trim()] : []
  };

  registeredUsers.push(newUser);
  localStorage.setItem("dormdeal_users", JSON.stringify(registeredUsers));

  // IF USER REGISTERED AS A SELLER -> INSTANTIATE REAL VENDOR PROFILE ON MAIN PAGE DIRECTORY!
  if(role === "seller"){
    createAndRegisterVendor(newUser);
  }

  saveUserSession(newUser, true);
  closeModal("authModal");
  finishAuth();
}

function handleLogin(e){
  e.preventDefault();
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;
  const rememberMe = document.getElementById("rememberMe").checked;

  const user = registeredUsers.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
  if(!user){
    alert("Invalid email or password!");
    return;
  }

  saveUserSession(user, rememberMe);
  closeModal("authModal");
  finishAuth();
}

function handleGoogleAuth(defaultRole = "buyer"){
  const mockGoogleUser = {
    name: "Alex Johnson (Google)",
    email: "alex.google@cu.edu.ng",
    password: "google_authenticated_sso",
    role: defaultRole,
    university: activeUni,
    location: "Peter Hall, Room 102",
    phone: "0812 345 6789",
    picture: "https://lh3.googleusercontent.com/a/default-user=s96-c",
    businessName: defaultRole === "seller" ? "Alex's Google Printing" : "",
    servicesOffered: defaultRole === "seller" ? ["Express Document Print"] : []
  };

  let existingUser = registeredUsers.find(u => u.email.toLowerCase() === mockGoogleUser.email.toLowerCase());
  if(!existingUser){
    registeredUsers.push(mockGoogleUser);
    localStorage.setItem("dormdeal_users", JSON.stringify(registeredUsers));
    existingUser = mockGoogleUser;

    if(defaultRole === "seller") {
      createAndRegisterVendor(mockGoogleUser);
    }
  }

  saveUserSession(existingUser, true);
  closeModal("authModal");
  finishAuth();
}

function createAndRegisterVendor(user) {
  const category = document.getElementById("signupCategory") ? document.getElementById("signupCategory").value : "Printing";
  const priceLabel = document.getElementById("signupPrice") ? document.getElementById("signupPrice").value : "₦1,000";

  const newVendorCard = {
    id: Date.now(),
    name: user.businessName || `${user.name}'s Service`,
    category: category,
    university: user.university,
    description: `Verified Seller ${user.name} providing fast campus fulfillment.`,
    location: user.location,
    baseDistanceKm: 0.4,
    phone: user.phone,
    whatsapp: `234${user.phone.replace(/^0/, '')}`,
    price: 1000,
    priceLabel: priceLabel || "₦1,000",
    featured: true,
    discount: "New Campus Seller Special",
    servicesOffered: user.servicesOffered.length ? user.servicesOffered : ["Custom Request"],
    reliability: { onTimeRate: 1.0, cancellationRate: 0.0, avgResponseMins: 3 },
    reviews: []
  };

  vendors.unshift(newVendorCard);
  localStorage.setItem("dormdeal_vendors", JSON.stringify(vendors));
  renderVendors();
  updateStats();
}

function finishAuth(){
  const isSeller = currentUser.role === "seller";
  document.getElementById("guestNavControls").style.display = "none";
  document.getElementById("userNavControls").style.display = "flex";
  document.getElementById("greetText").textContent = `Hi, ${currentUser.name.split(" ")[0]} (${isSeller ? 'Seller 🏪' : 'Buyer 🎓'})`;
  document.getElementById("myOrdersSection").style.display = "block";
  
  updateHamburgerUserMenu();
  renderActiveOrders();
}

function handleLogout(){
  currentUser = null;
  localStorage.removeItem("dormdeal_session");
  sessionStorage.removeItem("dormdeal_session");

  document.getElementById("guestNavControls").style.display = "flex";
  document.getElementById("userNavControls").style.display = "none";
  document.getElementById("myOrdersSection").style.display = "none";
  updateHamburgerUserMenu();
}

function updateHamburgerUserMenu(){
  const badge = document.getElementById("drawerUserBadge");
  const name = document.getElementById("drawerUserName");
  const role = document.getElementById("drawerUserRole");
  const authFooter = document.getElementById("drawerAuthFooter");

  if(currentUser){
    badge.textContent = currentUser.role === "seller" ? "🏪 Verified Seller" : "🎓 Verified Buyer";
    name.textContent = currentUser.name;
    role.textContent = `${currentUser.university} • ${currentUser.location}`;
    authFooter.innerHTML = `<button class="btn btn-coral btn-block" onclick="handleLogout()">Logout Account</button>`;
  } else {
    badge.textContent = "👤 Guest Mode";
    name.textContent = "Welcome, Guest";
    role.textContent = "Select Buyer or Seller to continue";
    authFooter.innerHTML = `
      <div class="row-2">
        <button class="btn btn-ghost btn-block" onclick="openAuthModal('login')">Log in</button>
        <button class="btn btn-gold btn-block" onclick="openAuthModal('signup')">Sign Up</button>
      </div>`;
  }
}

function openProfileModal(){
  if(!currentUser) return;
  const wrap = document.getElementById("profileModalView");
  wrap.innerHTML = `
    <div style="text-align:center; padding:10px 0;">
      <img src="${currentUser.picture}" style="width:72px; height:72px; border-radius:50%; border:2px solid var(--teal); margin-bottom:10px;">
      <h4>${currentUser.name}</h4>
      <span class="badge ${currentUser.role === 'seller' ? 'badge-teal' : 'badge-gold'}">${currentUser.role.toUpperCase()}</span>
      <p style="margin-top:10px; font-size:13px; color:var(--ink-soft);">${currentUser.email}</p>
      <p style="font-size:13px; color:var(--ink-soft);">${currentUser.university} — ${currentUser.location}</p>
      ${currentUser.role === 'seller' ? `<div style="margin-top:14px; background:rgba(31,157,130,0.1); padding:10px; border-radius:8px;"><strong>Business:</strong> ${currentUser.businessName}</div>` : ''}
    </div>`;
  openModal("profileModal");
}

/* ------------------ HAMBURGER & RENDERERS ------------------ */
function initHamburgerMenu(){
  const btn = document.getElementById("hamburgerBtn");
  const drawer = document.getElementById("navDrawer");
  const overlay = document.getElementById("navOverlay");

  btn.addEventListener("click", ()=>{
    btn.classList.toggle("open");
    drawer.classList.toggle("open");
    overlay.classList.toggle("open");
  });
  overlay.addEventListener("click", closeHamburgerMenu);
}

function renderCategoryChips(){
  const wrap = document.getElementById("categoryChips");
  wrap.innerHTML = `<button class="chip ${activeCategory==='All'?'active':''}" data-cat="All">✨ All Services</button>`;
  CATEGORIES.forEach(c=>{
    const icon = CATEGORY_ICON[c] || "📦";
    wrap.innerHTML += `<button class="chip ${activeCategory===c?'active':''}" data-cat="${c}">${icon} ${c}</button>`;
  });
  wrap.querySelectorAll(".chip").forEach(ch=>{
    ch.addEventListener("click", ()=>{
      activeCategory = ch.dataset.cat;
      renderCategoryChips();
      renderVendors();
    });
  });
}

function renderTicker(){
  const track = document.getElementById("tickerTrack");
  const items = [
    "🔥 CU PrintHub completed 14 project bindings in Peniel Hall today",
    "⚡ QuickFix Clinic added 50 screen protectors to Zion Hall batch",
    "🍲 Mama Nkechi's Kitchen bulk order unlocked at 15% OFF",
    "🛵 Next delivery runner batch leaves at 4:00 PM for Mary Hall"
  ];
  track.innerHTML = items.map(i=>`<span>${i}</span>`).join(" • ");
}

function renderVendors(){
  const grid = document.getElementById("vendorGrid");
  document.getElementById("currentUniLabel").textContent = activeUni;
  
  let list = vendors.filter(v=> v.university === activeUni || v.university === "All");
  if(activeCategory !== "All") list = list.filter(v=>v.category === activeCategory);

  if(!list.length){
    grid.innerHTML = `<div style="grid-column:1/-1; padding:40px; text-align:center; background:#fff; border-radius:16px;">
      <h3>No campus sellers listed for ${activeCategory} at ${activeUni} yet.</h3>
      <p style="margin-top:8px;">Be the first student hustle to register standard services here!</p>
    </div>`;
    return;
  }

  grid.innerHTML = list.map(v=>{
    const score = reliabilityScore(v.reliability);
    const badge = reliabilityLabel(score);
    return `
    <div class="card vendor-card">
      <div class="card-head">
        <div>
          <span class="category-badge">${CATEGORY_ICON[v.category] || "📦"} ${v.category}</span>
          <h3>${v.name}</h3>
          <p class="location">📍 ${v.location} (${v.baseDistanceKm} km away)</p>
        </div>
        <div class="score-pill" style="border-color:${badge.color}">
          <span class="score-num" style="color:${badge.color}">${score}</span>
          <span class="score-tag">${badge.label}</span>
        </div>
      </div>
      <p class="desc">${v.description}</p>
      <div class="service-tags">
        ${v.servicesOffered.map(s=>`<span class="tag">${s}</span>`).join("")}
      </div>
      <div class="card-foot">
        <div class="price">
          <span class="amount">${v.priceLabel}</span>
          ${v.discount ? `<span class="discount">${v.discount}</span>` : ""}
        </div>
        <button class="btn btn-teal btn-sm" onclick="openVendorModal(${v.id})">Book / Direct Chat</button>
      </div>
    </div>`;
  }).join("");
}

function openVendorModal(id){
  const v = vendors.find(item => item.id === id);
  if(!v) return;
  const content = document.getElementById("vendorModalContent");
  content.innerHTML = `
    <button class="modal-close" onclick="closeModal('vendorModal')">✕</button>
    <h3>${v.name}</h3>
    <p style="color:var(--ink-soft); font-size:13.5px; margin-bottom:14px;">${v.description}</p>
    <div class="confirm-box show" style="margin-bottom:14px;">
      <strong>Instant Direct Contact:</strong><br>
      📞 Phone: <a href="tel:${v.phone}">${v.phone}</a><br>
      💬 WhatsApp: <a href="https://wa.me/${v.whatsapp}" target="_blank">Chat with Seller</a>
    </div>
    <h4>Book Service</h4>
    <form onsubmit="handleOrderSubmit(event, '${v.name}', '${v.category}')">
      <div class="field">
        <label>Select Required Service</label>
        <select id="modalServiceItem">${v.servicesOffered.map(s=>`<option value="${s}">${s}</option>`).join("")}</select>
      </div>
      <div class="field">
        <label>Your Hostel / Room</label>
        <input type="text" id="modalHostelInput" required placeholder="e.g. Zion Hall, Room 310">
      </div>
      <button class="btn btn-gold btn-block" type="submit">Submit Request Order</button>
    </form>`;
  openModal("vendorModal");
}

function handleOrderSubmit(e, vendorName, category){
  e.preventDefault();
  const item = document.getElementById("modalServiceItem").value;
  const hostel = document.getElementById("modalHostelInput").value;

  const order = {
    id: Date.now(),
    vendor: vendorName,
    item: item,
    hostel: hostel,
    timestamp: Date.now(),
    type: "Single Order"
  };

  userOrders.unshift(order);
  localStorage.setItem("dormdeal_orders", JSON.stringify(userOrders));
  addToDeliveryQueue(hostel, "Next Delivery Slot", vendorName, category);
  
  closeModal("vendorModal");
  alert(`Order submitted successfully! Your 10-minute cancellation window has started.`);
  
  if(currentUser) finishAuth();
}

function renderActiveOrders(){
  const wrap = document.getElementById("activeOrdersList");
  if(!wrap) return;

  if(!userOrders.length){
    wrap.innerHTML = `<p style="grid-column:1/-1; color:var(--ink-soft);">No active orders placed yet.</p>`;
    return;
  }

  const now = Date.now();
  wrap.innerHTML = userOrders.map(o=>{
    const elapsedMins = (now - o.timestamp) / (1000 * 60);
    const canWithdraw = elapsedMins < 10;
    const remainingMins = Math.max(0, Math.ceil(10 - elapsedMins));

    return `
    <div class="card card-pad" style="border-left:4px solid var(--teal);">
      <div style="display:flex; justify-content:space-between; align-items:flex-start;">
        <div>
          <h4>${o.item}</h4>
          <p style="font-size:13px; color:var(--ink-soft);">Seller: ${o.vendor} • Deliver to: ${o.hostel}</p>
        </div>
        <span class="badge ${canWithdraw ? 'badge-teal' : 'badge-featured'}">${canWithdraw ? `${remainingMins}m window left` : 'Locked in batch'}</span>
      </div>
      <div style="margin-top:12px; display:flex; gap:10px; align-items:center;">
        ${canWithdraw ? `<button class="btn btn-coral btn-sm" onclick="withdrawOrder(${o.id})">Withdraw Order</button>` : `<span style="font-size:12px; color:var(--ink-soft);">Order dispatched to logistics runner.</span>`}
      </div>
    </div>`;
  }).join("");
}

function withdrawOrder(id){
  userOrders = userOrders.filter(o => o.id !== id);
  localStorage.setItem("dormdeal_orders", JSON.stringify(userOrders));
  renderActiveOrders();
}

function renderPools(){
  const grid = document.getElementById("poolsGrid");
  grid.innerHTML = groupOrders.map(g=>{
    const pct = Math.round((g.joined / g.threshold)*100);
    return `
    <div class="card card-pad">
      <span class="category-badge">${CATEGORY_ICON[g.category] || "📦"} ${g.category}</span>
      <h3>${g.title}</h3>
      <p class="desc">Hostel pickup target: <b>${g.threshold} ${g.unit}</b> for <b>${g.discountPct}% OFF</b></p>
      <div class="progress-bar" style="background:#eee; height:8px; border-radius:4px; margin:12px 0; overflow:hidden;">
        <div style="width:${pct}%; background:var(--gold); height:100%;"></div>
      </div>
      <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:12px;">
        <span>${g.joined} / ${g.threshold} joined</span>
        <span><b>${pct}%</b> filled</span>
      </div>
      <button class="btn btn-gold btn-block btn-sm" onclick="joinPool(${g.id})">Join Group Pool</button>
    </div>`;
  }).join("");
}

function joinPool(id){
  const pool = groupOrders.find(p => p.id === id);
  if(pool){
    pool.joined += 1;
    renderPools();
    updateStats();
    alert(`Joined ${pool.title}! You unlock the group rate as soon as threshold is met.`);
  }
}

function renderQueue(){
  const wrap = document.getElementById("queueWrap");
  wrap.innerHTML = deliveries.map(d=>{
    const ready = d.orders.length >= 3;
    return `
    <div class="queue-group">
      <div class="queue-group-head">
        <h4>${d.hall} — ${d.slot}</h4>
        <span class="runner-tag ${ready ? 'runner-ready' : 'runner-waiting'}">${ready ? 'Runner assigned' : `${3 - d.orders.length} more order${3-d.orders.length===1?'':'s'} to batch`}</span>
      </div>
      <div class="queue-items">
        ${d.orders.map(o=>`<div class="queue-item"><span>${o.item}</span><span class="v">${o.vendor}</span></div>`).join("")}
      </div>
    </div>`;
  }).join("");
}

function addToDeliveryQueue(hall, slot, vendorName, category){
  let group = deliveries.find(d=>d.hall.toLowerCase()===hall.toLowerCase());
  if(!group){
    group = { hall, slot:"Today 5:00 PM", orders:[] };
    deliveries.unshift(group);
  }
  group.orders.push({ vendor:vendorName, item:`${category} booking` });
  renderQueue();
}

function recalcDistances(){
  vendors.forEach(v => {
    v.baseDistanceKm = (Math.random() * 1.2 + 0.1).toFixed(1);
  });
  renderVendors();
  alert("Hostel distances recalculated based on your current campus GPS sector!");
}

function toggleCompare(){
  compareOpen = !compareOpen;
  document.getElementById("compareTray").classList.toggle("open", compareOpen);
  if(compareOpen) renderCompare();
}

function renderCompare(){
  const wrap = document.getElementById("compareGrid");
  const top = [...vendors].sort((a,b)=> reliabilityScore(b.reliability) - reliabilityScore(a.reliability)).slice(0,3);
  wrap.innerHTML = top.map(v=>`
    <div style="border:1px solid var(--line); border-radius:12px; padding:12px; background:#fff;">
      <h4>${v.name}</h4>
      <p style="font-size:12px; color:var(--ink-soft);">${v.category}</p>
      <div style="font-size:18px; font-weight:700; color:var(--teal); margin:6px 0;">Score: ${reliabilityScore(v.reliability)}/100</div>
      <p style="font-size:12px;">Price: ${v.priceLabel}</p>
    </div>
  `).join("");
}

function updateStats(){
  document.getElementById("statVendors").textContent = vendors.length;
  document.getElementById("statUnis").textContent = UNIVERSITIES.length;
  document.getElementById("statPools").textContent = groupOrders.length;
}

// DOM Init Execution
document.addEventListener("DOMContentLoaded", init);
