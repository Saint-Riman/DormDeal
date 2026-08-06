/* =========================================================================
   DORM DEAL — DATA & CONTROLLER
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

let vendors = [
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

// USER MANAGEMENT & AUTH STATE
let registeredUsers = []; 
let currentUser = null; // { name, email, role: 'buyer'|'seller', university, location, phone, picture, businessName, servicesOffered }
let userOrders = []; // Track orders & pool entries with withdrawal timestamps [{ id, type: 'order'|'pool', title, vendor, timestamp, poolId }]

let activeUni = "Covenant University";
let activeCategory = "All";
let compareOpen = false;
let activeVendorId = null;

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

/* ------------------ EMAIL VALIDATION HELPER ------------------ */
function isValidEmail(email) {
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(String(email).toLowerCase());
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

function init(){
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
      document.querySelectorAll("[data-authtab]").forEach(b=>b.classList.remove("active"));
      document.querySelectorAll("#authModal .tab-panel").forEach(p=>p.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(btn.dataset.authtab).classList.add("active");
    });
  });

  // Signup Role Toggle (Buyer vs Seller)
  document.querySelectorAll("input[name='userRole']").forEach(radio=>{
    radio.addEventListener("change", (e)=>{
      const sellerFields = document.getElementById("sellerFields");
      if(e.target.value === "seller"){
        sellerFields.style.display = "block";
      } else {
        sellerFields.style.display = "none";
      }
    });
  });

  // Auth Form Submissions
  document.getElementById("signupForm").addEventListener("submit", handleSignup);
  document.getElementById("loginForm").addEventListener("submit", handleLogin);

  // Start Withdrawal Window Clock Tick
  setInterval(renderActiveOrders, 10000); // refresh active orders view every 10s for live timers
}

/* ------------------ AUTHENTICATION & PROFILE LOGIC ------------------ */
function openAuthModal(mode){
  openModal("authModal");
  if(mode === "login"){
    document.getElementById("tabLoginBtn").click();
  } else {
    document.getElementById("tabSignupBtn").click();
  }
}

function handleSignup(e){
  e.preventDefault();
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value;
  const name = document.getElementById("signupName").value.trim();
  const role = document.querySelector("input[name='userRole']:checked").value;
  const university = document.getElementById("signupUni").value;
  const location = document.getElementById("signupLocation").value.trim();
  const phone = document.getElementById("signupPhone").value.trim();
  const picture = document.getElementById("signupPic").value.trim() || "https://via.placeholder.com/150";

  if(!isValidEmail(email)){
    alert("Please enter a valid email address.");
    return;
  }
  if(password.length < 8){
    alert("Password must be at least 8 characters long.");
    return;
  }

  const existing = registeredUsers.find(u => u.email.toLowerCase() === email.toLowerCase() && u.role === role);
  if(existing){
    alert(`An account already exists as a ${role} with this email.`);
    return;
  }

  let servicesList = [];
  let businessName = "";

  if(role === "seller"){
    businessName = document.getElementById("signupBusinessName").value.trim() || name + "'s Business";
    const rawServices = document.getElementById("signupServices").value;
    servicesList = rawServices.split(",").map(s=>s.trim()).filter(s=>s.length > 0);
  }

  const newUser = {
    name, email, password, role, university, location, phone, picture,
    businessName, servicesOffered: servicesList
  };

  registeredUsers.push(newUser);
  currentUser = newUser;

  // If user registered as seller, add them live to the vendor directory!
  if(role === "seller"){
    vendors.unshift({
      id: Date.now(),
      name: businessName,
      category: servicesList.length ? "Custom" : "Services",
      university: university,
      description: `Services offered: ${servicesList.join(", ")}`,
      location: location,
      baseDistanceKm: 0.4,
      phone: phone,
      whatsapp: phone,
      price: 1000,
      priceLabel: "Contact for price",
      featured: false,
      discount: "",
      servicesOffered: servicesList,
      reliability: { onTimeRate:1.0, cancellationRate:0.0, avgResponseMins:5 },
      reviews: []
    });
    renderVendors();
  }

  finishAuth();
}

function handleLogin(e){
  e.preventDefault();
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;
  const role = document.querySelector("input[name='loginRole']:checked").value;

  if(!isValidEmail(email)){
    alert("Please enter a valid email address.");
    return;
  }

  const user = registeredUsers.find(u => u.email.toLowerCase() === email.toLowerCase() && u.role === role && u.password === password);
  if(!user){
    alert("Invalid credentials or role selection. Please verify email, password, and account type.");
    return;
  }

  currentUser = user;
  finishAuth();
}

function handleLogout(){
  currentUser = null;
  document.getElementById("guestNavControls").style.display = "flex";
  document.getElementById("userNavControls").style.display = "none";
  document.getElementById("myOrdersSection").style.display = "none";
  updateHamburgerUserMenu();
}

function finishAuth(){
  document.getElementById("guestNavControls").style.display = "none";
  document.getElementById("userNavControls").style.display = "flex";
  document.getElementById("greetText").textContent = `${currentUser.role === 'buyer' ? '🎓 Buyer' : '🏪 Seller'} · ${currentUser.name}`;
  closeModal("authModal");
  updateHamburgerUserMenu();
  renderActiveOrders();
}

function openProfileModal(){
  if(!currentUser) return;
  const view = document.getElementById("profileModalView");
  
  const isSeller = currentUser.role === "seller";
  
  view.innerHTML = `
    <div style="text-align:center; margin-bottom:20px;">
      <div class="avatar" style="width:80px; height:80px; margin:0 auto 12px; border-radius:50%;">
        <img src="${currentUser.picture}" alt="Profile Picture" onerror="this.src='https://via.placeholder.com/80?text=User'">
      </div>
      <h4>${currentUser.name}</h4>
      <span class="badge badge-featured">${isSeller ? '🏪 Seller Account' : '🎓 Buyer Account'}</span>
    </div>

    <div class="field"><label>Email Address</label><input type="text" value="${currentUser.email}" readonly></div>
    <div class="field"><label>Phone Number / WhatsApp</label><input type="text" value="${currentUser.phone}" readonly></div>
    <div class="field"><label>Campus / Location</label><input type="text" value="${currentUser.university} — ${currentUser.location}" readonly></div>

    ${isSeller ? `
      <div style="border-top:1px dashed var(--line); padding-top:14px; margin-top:14px;">
        <div class="field"><label>Business Name</label><input type="text" value="${currentUser.businessName}" readonly></div>
        <div class="field"><label>Services & Commodities Offered</label>
          <div class="tag-list">
            ${currentUser.servicesOffered.map(s=>`<span class="tag">${s}</span>`).join("") || "<span>No custom services listed</span>"}
          </div>
        </div>
      </div>
    ` : ''}
  `;

  openModal("profileModal");
}

/* ------------------------ HAMBURGER MENU ------------------------ */
function initHamburgerMenu(){
  const btn = document.getElementById("hamburgerBtn");
  const drawer = document.getElementById("navDrawer");
  const overlay = document.getElementById("navOverlay");

  if(!btn || !drawer || !overlay) return;

  function openDrawer(){
    btn.classList.add("open");
    drawer.classList.add("open");
    overlay.classList.add("open");
    btn.setAttribute("aria-expanded", "true");
  }

  function closeDrawer(){
    btn.classList.remove("open");
    drawer.classList.remove("open");
    overlay.classList.remove("open");
    btn.setAttribute("aria-expanded", "false");
  }

  btn.addEventListener("click", ()=>{
    if(drawer.classList.contains("open")) closeDrawer();
    else openDrawer();
  });

  overlay.addEventListener("click", closeDrawer);
  updateHamburgerUserMenu();
}

function updateHamburgerUserMenu(){
  const badge = document.getElementById("drawerUserBadge");
  const nameLabel = document.getElementById("drawerUserName");
  const roleLabel = document.getElementById("drawerUserRole");
  const footer = document.getElementById("drawerAuthFooter");

  if(!currentUser){
    badge.textContent = "👤 Guest Mode";
    nameLabel.textContent = "Welcome, Guest";
    roleLabel.textContent = "Please sign up or log in";
    footer.innerHTML = `
      <div class="row-2">
        <button class="btn btn-ghost btn-block" onclick="openAuthModal('login')">Log in</button>
        <button class="btn btn-gold btn-block" onclick="openAuthModal('signup')">Sign Up</button>
      </div>`;
    return;
  }

  const isBuyer = currentUser.role === "buyer";
  badge.textContent = isBuyer ? "🎓 Buyer" : "🏪 Seller";
  nameLabel.textContent = currentUser.name;
  roleLabel.textContent = currentUser.university;
  
  footer.innerHTML = `
    <button class="btn btn-teal btn-block" onclick="openProfileModal()">View My Profile 👤</button>
    <button class="btn btn-ghost btn-block" style="margin-top:8px;" onclick="handleLogout()">Logout</button>
  `;
}

/* ------------------ WITHDRAWAL & ORDER MANAGEMENT ------------------ */
function addOrderWithWithdrawal(item){
  const orderObj = {
    id: Date.now(),
    timestamp: Date.now(),
    ...item
  };
  userOrders.unshift(orderObj);
  renderActiveOrders();
}

function withdrawOrder(id){
  const idx = userOrders.findIndex(o => o.id === id);
  if(idx === -1) return;

  const order = userOrders[idx];
  const elapsedMins = (Date.now() - order.timestamp) / (1000 * 60);

  if(elapsedMins > 10){
    alert("The 10-minute withdrawal window has expired for this request.");
    return;
  }

  // If order was a pool join, reduce pool count
  if(order.type === 'pool' && order.poolId){
    const pool = groupOrders.find(g => g.id === order.poolId);
    if(pool && pool.joined > 0){
      pool.joined -= 1;
      renderPools();
    }
  }

  userOrders.splice(idx, 1);
  alert("Your order/request has been withdrawn successfully.");
  renderActiveOrders();
  renderTicker();
}

function renderActiveOrders(){
  const sec = document.getElementById("myOrdersSection");
  const list = document.getElementById("activeOrdersList");

  if(!currentUser || userOrders.length === 0){
    sec.style.display = "none";
    return;
  }

  sec.style.display = "block";
  const now = Date.now();

  list.innerHTML = userOrders.map(o => {
    const elapsedSecs = Math.floor((now - o.timestamp) / 1000);
    const windowSecs = 10 * 60;
    const remainingSecs = Math.max(0, windowSecs - elapsedSecs);
    const canWithdraw = remainingSecs > 0;

    const mins = Math.floor(remainingSecs / 60);
    const secs = remainingSecs % 60;

    return `
      <div class="card" style="border:1px solid var(--gold);">
        <div class="card-top">
          <h4>${o.title}</h4>
          <span class="badge ${canWithdraw ? 'badge-featured' : ''}">${canWithdraw ? 'Window Active' : 'Confirmed'}</span>
        </div>
        <p class="desc">Seller/Vendor: ${o.vendor}</p>
        <div class="meta-row">
          <span>${canWithdraw ? `⏳ ${mins}m ${secs}s left to withdraw` : '🔒 Window closed'}</span>
        </div>
        ${canWithdraw ? `
          <button class="btn btn-coral btn-sm btn-block" onclick="withdrawOrder(${o.id})">Withdraw Order</button>
        ` : ''}
      </div>
    `;
  }).join("");
}

/* ---------------------------- TICKER ---------------------------- */
function renderTicker(){
  const items = [
    ...groupOrders.map(g=>`🔥 ${g.title} — ${g.joined}/${g.threshold} joined <span>${g.discountPct}% unlock</span>`),
    ...deliveries.map(d=>`🛵 ${d.hall} run · ${d.orders.length} orders batched <span>${d.slot}</span>`),
    `🎓 Now live at Covenant University <span>expanding soon</span>`
  ];
  const track = document.getElementById("tickerTrack");
  track.innerHTML = items.concat(items).map(i=>`<span style="color:inherit; font-weight:400;">${i}</span>`).join(" &nbsp;•&nbsp; ");
}

/* ------------------------- CATEGORY CHIPS ------------------------- */
function renderCategoryChips(){
  const wrap = document.getElementById("categoryChips");
  const cats = ["All", ...CATEGORIES];
  wrap.innerHTML = cats.map(c=>`<button class="chip ${c===activeCategory?'active':''}" data-cat="${c}">${c}</button>`).join("");
  wrap.querySelectorAll(".chip").forEach(chip=>{
    chip.addEventListener("click", ()=>{
      activeCategory = chip.dataset.cat;
      renderCategoryChips();
      renderVendors();
      if(compareOpen) renderCompare();
    });
  });
}

/* --------------------------- DISTANCE --------------------------- */
function recalcDistances(){
  vendors.forEach(v=>{
    const jitter = (Math.random()*0.3 - 0.15);
    v.liveDistance = Math.max(0.05, v.baseDistanceKm + jitter);
  });
  renderVendors();
  const btn = document.getElementById("scanLocationBtn");
  const old = btn.textContent;
  btn.textContent = "✓ Distances updated";
  setTimeout(()=>btn.textContent = old, 1600);
}
function distanceOf(v){ return v.liveDistance !== undefined ? v.liveDistance : v.baseDistanceKm; }

/* --------------------------- DIRECTORY --------------------------- */
function filteredVendors(){
  return vendors.filter(v=>{
    const uniOk = activeUni === "All" || v.university === activeUni;
    const catOk = activeCategory === "All" || v.category === activeCategory;
    return uniOk && catOk;
  }).sort((a,b)=>distanceOf(a)-distanceOf(b));
}

function renderVendors(){
  const list = filteredVendors();
  document.getElementById("resultsCount").textContent = `${list.length} result${list.length!==1?'s':''}`;
  const grid = document.getElementById("vendorGrid");

  if(!list.length){
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">No campus sellers match this category filter. Try selecting "All" categories.</div>`;
    return;
  }

  grid.innerHTML = list.map(v=>{
    const score = reliabilityScore(v.reliability);
    const rel = reliabilityLabel(score);
    const rating = avgRating(v);
    return `
    <article class="card" data-id="${v.id}">
      <div class="card-top">
        <div class="avatar">${CATEGORY_ICON[v.category] || "🏬"}</div>
        ${v.featured ? '<span class="badge badge-featured">Featured</span>' : ''}
      </div>
      <div>
        <h4>${v.name}</h4>
        <span class="cat">${v.category} · ${v.university.split(" (")[0]}</span>
      </div>
      <p class="desc">${v.description}</p>
      ${v.discount ? `<span class="discount-tag">${v.discount}</span>` : ''}
      <div class="meta-row">
        <span>📍 ${distanceOf(v).toFixed(1)} mi · ${v.location}</span>
        <span class="reli"><span class="reli-dot" style="background:${rel.color};"></span>${rel.label}</span>
      </div>
      <div class="meta-row" style="border-top:none; padding-top:0;">
        <span class="price-tag">${v.priceLabel}</span>
        <span>${rating ? `${starString(rating)} (${v.reviews.length})` : 'No reviews yet'}</span>
      </div>
      <div class="card-actions">
        <button class="btn btn-outline-dark btn-sm btn-block open-profile" data-id="${v.id}">View & Book</button>
      </div>
    </article>`;
  }).join("");

  grid.querySelectorAll(".open-profile").forEach(btn=>{
    btn.addEventListener("click", ()=>openVendorProfile(Number(btn.dataset.id)));
  });
}

/* --------------------------- COMPARE --------------------------- */
function toggleCompare(){
  compareOpen = !compareOpen;
  document.getElementById("compareArea").style.display = compareOpen ? "block" : "none";
  document.getElementById("compareToggle").classList.toggle("btn-teal", compareOpen);
  if(compareOpen) renderCompare();
}
function renderCompare(){
  const list = filteredVendors();
  const minPrice = Math.min(...list.map(v=>v.price));
  const rows = list.map(v=>{
    const score = reliabilityScore(v.reliability);
    const isLowest = v.price === minPrice;
    return `<tr class="${isLowest ? 'row-highlight':''}">
      <td>${v.name}</td>
      <td>${v.category}</td>
      <td class="${isLowest?'lowest':''}">${v.priceLabel}${isLowest ? ' ✓ lowest' : ''}</td>
      <td>${score}/100</td>
      <td>${distanceOf(v).toFixed(1)} mi</td>
    </tr>`;
  }).join("");
  document.getElementById("compareArea").innerHTML = `
    <div class="compare-wrap">
      <table>
        <thead><tr><th>Seller</th><th>Category</th><th>Price</th><th>Reliability</th><th>Distance</th></tr></thead>
        <tbody>${rows || `<tr><td colspan="5" style="text-align:center; padding:20px;">No sellers to compare.</td></tr>`}</tbody>
      </table>
    </div>`;
}

/* --------------------------- VENDOR MODAL & BOOKING --------------------------- */
function openVendorProfile(id){
  activeVendorId = id;
  renderVendorModal();
  openModal("vendorModal");
}

function renderVendorModal(){
  const v = vendors.find(x=>x.id===activeVendorId);
  if(!v) return;
  const score = reliabilityScore(v.reliability);
  const rel = reliabilityLabel(score);

  const timeSlots = ["9:00 AM","11:00 AM","1:00 PM","3:00 PM","5:00 PM","7:00 PM"];

  document.getElementById("vendorModalContent").innerHTML = `
    <button class="modal-close" data-close="vendorModal">✕</button>
    <div class="profile-head">
      <div class="avatar">${CATEGORY_ICON[v.category] || "🏬"}</div>
      <div>
        <h3>${v.name}</h3>
        <span class="sub" style="margin:0;">${v.category} · ${v.university}</span>
      </div>
    </div>
    <p style="font-size:14px; color:var(--ink-soft); margin-top:10px;">${v.description}</p>
    <div class="contact-row">
      <span class="contact-pill">📍 ${v.location}</span>
      <span class="contact-pill">☎ ${v.phone}</span>
      <span class="contact-pill">💰 ${v.priceLabel}</span>
    </div>

    ${v.servicesOffered && v.servicesOffered.length ? `
      <div style="margin-top:10px;">
        <label style="font-size:11px; font-weight:700; text-transform:uppercase;">Services Offered:</label>
        <div class="tag-list">
          ${v.servicesOffered.map(s=>`<span class="tag">${s}</span>`).join("")}
        </div>
      </div>
    ` : ''}

    <div class="score-wrap">
      <div class="score-ring" style="background:${rel.color};">${score}</div>
      <div class="score-detail">
        <b style="font-size:14px;">${rel.label} reliability</b><br>
        On-time ${Math.round(v.reliability.onTimeRate*100)}% · Cancels ${Math.round(v.reliability.cancellationRate*100)}%
      </div>
    </div>

    <div class="tab-panel active" id="bookPanel">
      <form id="bookForm">
        <div class="row-2">
          <div class="field"><label>Date</label><input type="date" id="bookDate" required></div>
          <div class="field"><label>Time slot</label>
            <select id="bookSlot">${timeSlots.map(t=>`<option>${t}</option>`).join("")}</select>
          </div>
        </div>
        <div class="field"><label>Delivery hostel/location</label>
          <input type="text" id="bookHall" placeholder="e.g. Peniel Hall Room 102" required>
        </div>
        <button type="submit" class="btn btn-gold btn-block">Place Order — Instant Confirmation</button>
      </form>
      <div class="confirm-box" id="bookConfirm"></div>
    </div>
  `;

  document.querySelectorAll("#vendorModalContent .modal-close").forEach(btn=>{
    btn.addEventListener("click", ()=>closeModal(btn.dataset.close));
  });

  document.getElementById("bookForm").addEventListener("submit", e=>{
    e.preventDefault();
    if(!currentUser){
      alert("Please Sign Up or Log In first to place an order.");
      openAuthModal("login");
      return;
    }

    const date = document.getElementById("bookDate").value;
    const slot = document.getElementById("bookSlot").value;
    const hall = document.getElementById("bookHall").value;
    
    const box = document.getElementById("bookConfirm");
    box.classList.add("show");
    box.innerHTML = `<b>Order Confirmed ✓</b><br>You have 10 minutes to withdraw this order if needed.<br>Delivery to: ${hall}`;

    addOrderWithWithdrawal({
      type: 'order',
      title: `${v.category} Order`,
      vendor: v.name
    });

    if(hall){
      addToDeliveryQueue(hall, slot, v.name, v.category);
    }
  });
}

/* --------------------------- GROUP BUY POOLS --------------------------- */
function renderPools(){
  const wrap = document.getElementById("poolGrid");
  wrap.innerHTML = groupOrders.map(g=>{
    const pct = Math.min(100, Math.round((g.joined/g.threshold)*100));
    const unlocked = g.joined >= g.threshold;
    return `
    <div class="pool-card">
      <span class="cat">${g.category}</span>
      <h4>${g.title}</h4>
      <p style="font-size:12.5px; color:var(--paper-dim);">${g.vendorName} · ${g.windowLabel}</p>
      <div class="progress-track"><div class="progress-fill" style="width:${pct}%;"></div></div>
      <div class="pool-meta"><span>${g.joined}/${g.threshold} ${g.unit} joined</span><span>${g.discountPct}% off at threshold</span></div>
      ${unlocked
        ? `<div class="pool-unlocked">🎉 Bulk discount unlocked — pool complete</div>`
        : `<button class="btn btn-teal btn-block btn-sm join-pool" data-id="${g.id}">Join this pool</button>`}
    </div>`;
  }).join("");

  wrap.querySelectorAll(".join-pool").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      if(!currentUser){
        alert("Please Sign Up or Log In first to join group buys.");
        openAuthModal("login");
        return;
      }

      const g = groupOrders.find(x=>x.id===Number(btn.dataset.id));
      if(g && g.joined < g.threshold){
        g.joined += 1;

        addOrderWithWithdrawal({
          type: 'pool',
          poolId: g.id,
          title: `Group Buy: ${g.title}`,
          vendor: g.vendorName
        });

        renderPools();
        renderTicker();
        updateStats();
      }
    });
  });
}

/* --------------------------- DELIVERY QUEUE --------------------------- */
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
  let group = deliveries.find(d=>d.hall.toLowerCase()===hall.toLowerCase() && d.slot===slot);
  if(!group){
    group = { hall, slot, orders:[] };
    deliveries.unshift(group);
  }
  group.orders.push({ vendor:vendorName, item:`${category} booking` });
  renderQueue();
  renderTicker();
}

/* --------------------------- UTILS & STATS --------------------------- */
function openModal(id){ document.getElementById(id).classList.add("open"); }
function closeModal(id){ document.getElementById(id).classList.remove("open"); }

function updateStats(){
  document.getElementById("statVendors").textContent = vendors.length;
  document.getElementById("statPools").textContent = groupOrders.filter(g=>g.joined < g.threshold).length;
}

init();
