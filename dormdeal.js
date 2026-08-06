/* =========================================================================
   DORM DEAL — DATA MODEL
   -------------------------------------------------------------------------
   users          { id, name, role: 'student'|'vendor', university, email }
   vendors        { id, name, category, university, description, icon,
                    location, baseDistanceKm, phone, whatsapp, price,
                    priceLabel, featured, discount, reliability:
                      { onTimeRate, cancellationRate, avgResponseMins },
                    reviews: [{ user, rating, text, date }] }
   listings       (folded into vendor.price / vendor.priceLabel for this MVP —
                    a vendor may extend this into a separate array of
                    { vendorId, title, price } rows as the catalog grows)
   groupOrders    { id, title, category, vendorName, unit, threshold,
                    joined, discountPct, windowLabel }
   deliveries     { hall, slot, orders:[{ vendor, item }], runnerAssigned }
   orders         (simulated bookings) pushed at runtime into deliveries
   ------------------------------------------------------------------------- */

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
    reliability:{onTimeRate:0.96, cancellationRate:0.02, avgResponseMins:4},
    reviews:[{user:"Tomiwa A.", rating:5, text:"Fastest print spot on campus, never late for a submission.", date:"2 weeks ago"},
             {user:"Chiamaka O.", rating:4, text:"Good quality binding, slightly pricey for colour prints.", date:"1 month ago"}] },

  { id:2, name:"QuickFix Gadget Clinic", category:"Tech Repair", university:"Covenant University",
    description:"Screen, battery & charging port repairs for phones and laptops.",
    location:"Student Hostel Mall", baseDistanceKm:0.6, phone:"0805 220 3391", whatsapp:"2348052203391",
    price:4500, priceLabel:"from ₦4,500", featured:true, discount:"Free diagnosis for students",
    reliability:{onTimeRate:0.88, cancellationRate:0.06, avgResponseMins:12},
    reviews:[{user:"David E.", rating:5, text:"Fixed my charging port in 40 minutes, honestly impressive.", date:"3 days ago"}] },

  { id:3, name:"Sparkle Laundromat", category:"Laundry", university:"Covenant University",
    description:"Wash, dry & fold with hostel pickup and drop-off included.",
    location:"Behind Peniel Hall", baseDistanceKm:0.2, phone:"0701 998 4432", whatsapp:"2347019984432",
    price:1500, priceLabel:"₦1,500/bag", featured:false, discount:"",
    reliability:{onTimeRate:0.79, cancellationRate:0.10, avgResponseMins:22},
    reviews:[{user:"Grace I.", rating:3, text:"Clothes came back clean but a day later than promised.", date:"1 week ago"}] },

  { id:4, name:"StitchCraft Tailors", category:"Tailoring", university:"Covenant University",
    description:"Custom fits, alterations and quick repairs — 24hr turnaround.",
    location:"CU Shopping Complex", baseDistanceKm:0.5, phone:"0813 662 7710", whatsapp:"2348136627710",
    price:3000, priceLabel:"from ₦3,000", featured:false, discount:"",
    reliability:{onTimeRate:0.91, cancellationRate:0.03, avgResponseMins:9},
    reviews:[{user:"Faith U.", rating:5, text:"Altered my dress perfectly before Friday service, so grateful.", date:"5 days ago"}] },

  { id:5, name:"Mama Nkechi's Kitchen", category:"Catering", university:"Covenant University",
    description:"Home-style Nigerian meals, bulk trays for fellowships & events.",
    location:"Off-campus, Canaan Land Rd", baseDistanceKm:1.1, phone:"0906 554 2201", whatsapp:"2349065542201",
    price:1200, priceLabel:"₦1,200/plate", featured:true, discount:"Bulk tray discount at 20 plates",
    reliability:{onTimeRate:0.93, cancellationRate:0.01, avgResponseMins:6},
    reviews:[{user:"Emeka N.", rating:5, text:"The jollof rice hits different, and delivery is always on time.", date:"2 days ago"},
             {user:"Blessing K.", rating:5, text:"Ordered for a birthday, portions were generous.", date:"3 weeks ago"}] },

  { id:6, name:"GlowBraids Studio", category:"Hairstyling", university:"Covenant University",
    description:"Braids, weave-ons & natural hair care in a small hostel-friendly studio.",
    location:"Zion Hall Annex", baseDistanceKm:0.4, phone:"0902 774 1180", whatsapp:"2349027741180",
    price:5000, priceLabel:"from ₦5,000", featured:false, discount:"",
    reliability:{onTimeRate:0.84, cancellationRate:0.08, avgResponseMins:18},
    reviews:[{user:"Ifeoma C.", rating:4, text:"Lovely braids, took a bit longer than the quoted time.", date:"1 week ago"}] },

  { id:7, name:"CampusDash Errands", category:"Transport & Errands", university:"Covenant University",
    description:"Bike runners for pickups, drop-offs and quick campus errands.",
    location:"Main Gate Dispatch Point", baseDistanceKm:0.1, phone:"0810 333 9021", whatsapp:"2348103339021",
    price:500, priceLabel:"from ₦500/trip", featured:true, discount:"Free 1st errand for new users",
    reliability:{onTimeRate:0.97, cancellationRate:0.01, avgResponseMins:3},
    reviews:[{user:"Samuel T.", rating:5, text:"Runner arrived in under 5 minutes, super reliable.", date:"yesterday"}] },

  { id:8, name:"BeatFace Makeup Bar", category:"Makeup", university:"Covenant University",
    description:"Everyday glam and event makeup, house calls available.",
    location:"Lydia Hall Room 214", baseDistanceKm:0.35, phone:"0704 221 6650", whatsapp:"2347042216650",
    price:6000, priceLabel:"from ₦6,000", featured:false, discount:"",
    reliability:{onTimeRate:0.75, cancellationRate:0.13, avgResponseMins:26},
    reviews:[{user:"Precious A.", rating:3, text:"Great makeup but had to reschedule once.", date:"2 weeks ago"}] },

  { id:9, name:"SnackStop 24", category:"Snacks", university:"Covenant University",
    description:"Provisions, instant noodles, drinks & midnight snack runs.",
    location:"Joseph Hall Ground Floor", baseDistanceKm:0.15, phone:"0817 990 3312", whatsapp:"2348179903312",
    price:300, priceLabel:"from ₦300", featured:false, discount:"Buy 5 get 1 free on drinks",
    reliability:{onTimeRate:0.9, cancellationRate:0.02, avgResponseMins:5},
    reviews:[{user:"Victor O.", rating:4, text:"Always stocked, good for late night cravings.", date:"4 days ago"}] },

  { id:10, name:"ThreadLine Fashion", category:"Clothes", university:"Covenant University",
    description:"Affordable everyday wear, thrifted pieces and made-to-order fits.",
    location:"CU Shopping Complex Stall 6", baseDistanceKm:0.5, phone:"0909 112 8834", whatsapp:"2349091128834",
    price:2500, priceLabel:"from ₦2,500", featured:false, discount:"",
    reliability:{onTimeRate:0.86, cancellationRate:0.05, avgResponseMins:14},
    reviews:[{user:"Ruth D.", rating:4, text:"Nice quality tops for the price, restocks fast.", date:"6 days ago"}] },

  { id:11, name:"UNILAG PrintSpot", category:"Printing", university:"University of Lagos (UNILAG)",
    description:"Fast printing and project binding near the faculty of science.",
    location:"Behind Faculty of Science", baseDistanceKm:0.4, phone:"0802 556 7712", whatsapp:"2348025567712",
    price:60, priceLabel:"₦60/page", featured:false, discount:"",
    reliability:{onTimeRate:0.89, cancellationRate:0.04, avgResponseMins:10},
    reviews:[{user:"Kunle F.", rating:4, text:"Reliable during exam season rush.", date:"2 weeks ago"}] },

  { id:12, name:"Yaba Gadget Fix", category:"Tech Repair", university:"University of Lagos (UNILAG)",
    description:"Laptop and phone repairs with same-day parts sourcing.",
    location:"Akoka Junction", baseDistanceKm:1.4, phone:"0705 887 2210", whatsapp:"2347058872210",
    price:5000, priceLabel:"from ₦5,000", featured:true, discount:"Student discount 5%",
    reliability:{onTimeRate:0.81, cancellationRate:0.09, avgResponseMins:19},
    reviews:[{user:"Amaka L.", rating:4, text:"Sourced a rare part for my laptop, took two days.", date:"3 weeks ago"}] },

  { id:13, name:"IbadanBraids & Co", category:"Hairstyling", university:"University of Ibadan (UI)",
    description:"Popular hostel-based braiding studio with weekend slots.",
    location:"Queens Hall Junction", baseDistanceKm:0.3, phone:"0813 004 5521", whatsapp:"2348130045521",
    price:4500, priceLabel:"from ₦4,500", featured:false, discount:"",
    reliability:{onTimeRate:0.87, cancellationRate:0.05, avgResponseMins:15},
    reviews:[{user:"Deborah S.", rating:5, text:"Booked a weekend slot easily, great result.", date:"1 week ago"}] },

  { id:14, name:"OAU CampusRide", category:"Transport & Errands", university:"Obafemi Awolowo University (OAU)",
    description:"Okada and errand runners covering the whole OAU campus loop.",
    location:"Freedom Square", baseDistanceKm:0.2, phone:"0908 776 4410", whatsapp:"2349087764410",
    price:400, priceLabel:"from ₦400/trip", featured:false, discount:"",
    reliability:{onTimeRate:0.94, cancellationRate:0.02, avgResponseMins:6},
    reviews:[{user:"Bayo A.", rating:5, text:"Fast and cheap, use them almost every week.", date:"5 days ago"}] }
];

let groupOrders = [
  { id:1, title:"Bulk Screen-Protector Pack", category:"Tech Repair", vendorName:"QuickFix Gadget Clinic",
    unit:"units", threshold:15, joined:11, discountPct:20, windowLabel:"This week, Zion & Peniel Hall pickup" },
  { id:2, title:"Jollof Rice Trays for Fellowship", category:"Catering", vendorName:"Mama Nkechi's Kitchen",
    unit:"trays", threshold:10, joined:10, discountPct:15, windowLabel:"Friday 5–7pm, hall delivery" },
  { id:3, title:"A4 Ream Group Order", category:"Printing", vendorName:"CU PrintHub",
    unit:"reams", threshold:20, joined:6, discountPct:12, windowLabel:"Before Monday's exams" },
  { id:4, title:"Braids Weekend Batch", category:"Hairstyling", vendorName:"GlowBraids Studio",
    unit:"slots", threshold:8, joined:3, discountPct:10, windowLabel:"Saturday morning slots" }
];

let deliveries = [
  { hall:"Peniel Hall", slot:"Today, 4:00–5:00pm",
    orders:[{vendor:"CU PrintHub", item:"Project binding x2"}, {vendor:"SnackStop 24", item:"Provisions restock"}, {vendor:"Sparkle Laundromat", item:"Laundry bag pickup"}] },
  { hall:"Zion Hall", slot:"Today, 6:00–7:00pm",
    orders:[{vendor:"QuickFix Gadget Clinic", item:"Screen protector"}, {vendor:"GlowBraids Studio", item:"Braid appointment reminder kit"}] },
  { hall:"Lydia Hall", slot:"Tomorrow, 12:00–1:00pm",
    orders:[{vendor:"Mama Nkechi's Kitchen", item:"Lunch tray"}] }
];

let currentUser = null; // { name, role, university }
let activeUni = "Covenant University";
let activeCategory = "All";
let compareOpen = false;
let activeVendorId = null;

/* ---------------------------------------------------------------------
   RELIABILITY SCORE
   Weighted composite (0–100), extendable: adjust WEIGHTS to retune, or
   add new factors to the `factors` object without touching callers.
--------------------------------------------------------------------- */
const RELIABILITY_WEIGHTS = { onTime:0.5, cancellation:0.3, response:0.2 };
function reliabilityScore(r){
  const onTimeScore = r.onTimeRate * 100;
  const cancelScore = (1 - r.cancellationRate) * 100;
  const responseScore = Math.max(0, 100 - r.avgResponseMins * 2.5); // faster = higher, floors at 0
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

/* =========================== INIT / RENDER =========================== */
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
  populateSelect(document.getElementById("studentUniInput"), UNIVERSITIES, false);

  const vendorCatSelect = document.getElementById("vendorCategoryInput");
  vendorCatSelect.innerHTML = CATEGORIES.map(c=>`<option value="${c}">${c}</option>`).join("");

  renderCategoryChips();
  renderTicker();
  renderVendors();
  renderPools();
  renderQueue();
  updateStats();
  initHamburgerMenu();

  document.getElementById("uniSelect").addEventListener("change", e=>{
    activeUni = e.target.value; renderVendors(); if(compareOpen) renderCompare();
  });
  document.getElementById("scanLocationBtn").addEventListener("click", recalcDistances);
  document.getElementById("compareToggle").addEventListener("click", toggleCompare);
  document.getElementById("openAuthBtn").addEventListener("click", ()=>openModal("authModal"));

  document.querySelectorAll(".modal-close").forEach(btn=>{
    btn.addEventListener("click", ()=>closeModal(btn.dataset.close));
  });
  document.querySelectorAll(".modal-backdrop").forEach(bd=>{
    bd.addEventListener("click", e=>{ if(e.target===bd) closeModal(bd.id); });
  });
  document.querySelectorAll(".tab-btn").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      document.querySelectorAll(".tab-btn").forEach(b=>b.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach(p=>p.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(btn.dataset.tab).classList.add("active");
    });
  });

  document.getElementById("studentForm").addEventListener("submit", e=>{
    e.preventDefault();
    const inputs = e.target.querySelectorAll("input");
    currentUser = { name: inputs[0].value || "Student", role:"student", university: document.getElementById("studentUniInput").value };
    finishAuth();
  });
  document.getElementById("vendorForm").addEventListener("submit", e=>{
    e.preventDefault();
    const inputs = e.target.querySelectorAll("input");
    currentUser = { name: inputs[0].value || "Vendor", role:"vendor", university: activeUni };
    finishAuth();
  });
}

function finishAuth(){
  const label = currentUser.role === "student" ? "Student" : "Vendor";
  document.getElementById("greetText").textContent = `${label} · ${currentUser.name}`;
  document.getElementById("openAuthBtn").textContent = "Account ✓";
  closeModal("authModal");
  updateHamburgerUserMenu();
}

function openModal(id){ document.getElementById(id).classList.add("open"); }
function closeModal(id){ document.getElementById(id).classList.remove("open"); }

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

  drawer.querySelectorAll("a, button").forEach(elem => {
    elem.addEventListener("click", (e)=>{
      const modalTarget = elem.dataset.modalTarget;
      if(modalTarget){
        e.preventDefault();
        openModal(modalTarget);
      }
      closeDrawer();
    });
  });

  document.getElementById("drawerAuthBtn").addEventListener("click", ()=>{
    openModal("authModal");
  });

  updateHamburgerUserMenu();
}

function updateHamburgerUserMenu(){
  const badge = document.getElementById("drawerUserBadge");
  const nameLabel = document.getElementById("drawerUserName");
  const roleLabel = document.getElementById("drawerUserRole");
  const authBtn = document.getElementById("drawerAuthBtn");
  const dynamicLinks = document.getElementById("drawerDynamicLinks");

  if(!currentUser){
    badge.textContent = "👤 Not signed in";
    nameLabel.textContent = "Welcome, Guest";
    roleLabel.textContent = "Sign in to book or list services";
    authBtn.textContent = "Sign up / Log in";
    dynamicLinks.innerHTML = `
      <li><a href="#directory">🔍 Browse Directory</a></li>
      <li><a href="#groupbuy">🔥 Group Buys</a></li>
      <li><a href="#delivery">🛵 Delivery Batches</a></li>
    `;
    return;
  }

  const isStudent = currentUser.role === "student";
  badge.textContent = isStudent ? "🎓 Student Account" : "🏪 Vendor Account";
  nameLabel.textContent = currentUser.name;
  roleLabel.textContent = currentUser.university;
  authBtn.textContent = "Switch / Manage Account";

  if(isStudent){
    dynamicLinks.innerHTML = `
      <li><a href="#directory">🔍 Directory & Quick Bookings</a></li>
      <li><a href="#groupbuy">🔥 Join Active Group Buys</a></li>
      <li><a href="#delivery">🛵 My Hostel Delivery Batches</a></li>
      <li><a href="#" data-modal-target="authModal">⚙️ Student Settings</a></li>
    `;
  } else {
    dynamicLinks.innerHTML = `
      <li><a href="#directory">🏪 My Vendor Profile & Catalog</a></li>
      <li><a href="#groupbuy">📦 Create / Manage Bulk Deals</a></li>
      <li><a href="#delivery">🛵 Active Hostel Deliveries</a></li>
      <li><a href="#how">📊 View My Reliability Score</a></li>
    `;
  }
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
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">No vendors yet for this campus + category combo. Try "All" categories, or check back as Dorm Deal expands.</div>`;
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
        <thead><tr><th>Vendor</th><th>Category</th><th>Price</th><th>Reliability</th><th>Distance</th></tr></thead>
        <tbody>${rows || `<tr><td colspan="5" style="text-align:center; padding:20px;">No vendors to compare in this filter.</td></tr>`}</tbody>
      </table>
    </div>`;
}

/* --------------------------- VENDOR PROFILE MODAL --------------------------- */
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
  const rating = avgRating(v);

  const reviewsHtml = v.reviews.map(r=>`
    <div class="review">
      <div class="review-head"><span>${r.user}</span><span class="stars">${starString(r.rating)}</span></div>
      <p>${r.text}</p>
      <div style="font-family:var(--font-mono); font-size:11px; color:var(--ink-soft); margin-top:4px;">${r.date}</div>
    </div>`).join("") || `<p style="color:var(--ink-soft); font-size:13.5px;">No reviews yet — be the first to book and review.</p>`;

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
      <span class="contact-pill">📍 ${v.location} — ${distanceOf(v).toFixed(1)} mi</span>
      <span class="contact-pill">☎ ${v.phone}</span>
      <span class="contact-pill">💬 WhatsApp: ${v.whatsapp}</span>
      <span class="contact-pill">💰 ${v.priceLabel}</span>
    </div>

    <div class="score-wrap">
      <div class="score-ring" style="background:${rel.color};">${score}</div>
      <div class="score-detail">
        <b style="font-size:14px;">${rel.label} reliability</b><br>
        On-time ${Math.round(v.reliability.onTimeRate*100)}% · Cancels ${Math.round(v.reliability.cancellationRate*100)}% · Replies in ~${v.reliability.avgResponseMins} min
      </div>
    </div>

    <div class="tabs">
      <button class="tab-btn active" data-vtab="bookPanel">Book Now</button>
      <button class="tab-btn" data-vtab="reviewPanel">Reviews (${v.reviews.length})</button>
    </div>

    <div class="tab-panel active" id="bookPanel">
      <form id="bookForm">
        <div class="row-2">
          <div class="field"><label>Date</label><input type="date" id="bookDate" required></div>
          <div class="field"><label>Time slot</label>
            <select id="bookSlot">${timeSlots.map(t=>`<option>${t}</option>`).join("")}</select>
          </div>
        </div>
        <div class="field"><label>Delivery hall (optional)</label>
          <input type="text" id="bookHall" placeholder="e.g. Peniel Hall">
        </div>
        <button type="submit" class="btn btn-gold btn-block">Book Now — instant confirmation</button>
      </form>
      <div class="confirm-box" id="bookConfirm"></div>
    </div>

    <div class="tab-panel" id="reviewPanel">
      <div style="max-height:220px; overflow-y:auto; margin-bottom:16px;">${reviewsHtml}</div>
      <form id="reviewForm">
        <div class="row-2">
          <div class="field"><label>Your name</label><input type="text" id="reviewName" value="${currentUser ? currentUser.name : ''}" placeholder="e.g. Chidi M." required></div>
          <div class="field"><label>Rating</label>
            <select id="reviewRating">
              <option value="5">★★★★★ Excellent</option>
              <option value="4">★★★★☆ Good</option>
              <option value="3">★★★☆☆ Okay</option>
              <option value="2">★★☆☆☆ Poor</option>
              <option value="1">★☆☆☆☆ Bad</option>
            </select>
          </div>
        </div>
        <div class="field"><label>Review</label><textarea id="reviewText" rows="3" placeholder="How was the service?" required></textarea></div>
        <button type="submit" class="btn btn-outline-dark btn-block">Submit review</button>
      </form>
    </div>
  `;

  document.querySelectorAll("#vendorModalContent .modal-close").forEach(btn=>{
    btn.addEventListener("click", ()=>closeModal(btn.dataset.close));
  });
  document.querySelectorAll("#vendorModalContent [data-vtab]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      document.querySelectorAll("#vendorModalContent .tab-btn").forEach(b=>b.classList.remove("active"));
      document.querySelectorAll("#vendorModalContent .tab-panel").forEach(p=>p.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(btn.dataset.vtab).classList.add("active");
    });
  });

  document.getElementById("bookForm").addEventListener("submit", e=>{
    e.preventDefault();
    const date = document.getElementById("bookDate").value || "today";
    const slot = document.getElementById("bookSlot").value;
    const hall = document.getElementById("bookHall").value;
    const box = document.getElementById("bookConfirm");
    box.classList.add("show");
    box.innerHTML = `<b>Booking confirmed ✓</b><br>${v.name} — ${date} at ${slot}${hall ? ` · delivery to ${hall}` : ''}.<br>A confirmation has been sent to ${v.whatsapp} on WhatsApp.`;
    if(hall){
      addToDeliveryQueue(hall, slot, v.name, v.category);
    }
  });

  document.getElementById("reviewForm").addEventListener("submit", e=>{
    e.preventDefault();
    const name = document.getElementById("reviewName").value || "Anonymous";
    const rating = Number(document.getElementById("reviewRating").value);
    const text = document.getElementById("reviewText").value;
    v.reviews.unshift({ user:name, rating, text, date:"just now" });
    renderVendorModal();
    document.querySelector('[data-vtab="reviewPanel"]').click();
    renderVendors();
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
      const g = groupOrders.find(x=>x.id===Number(btn.dataset.id));
      if(g && g.joined < g.threshold){
        g.joined += 1;
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

/* --------------------------- STATS --------------------------- */
function updateStats(){
  document.getElementById("statVendors").textContent = vendors.length;
  document.getElementById("statPools").textContent = groupOrders.filter(g=>g.joined < g.threshold).length;
}

init();