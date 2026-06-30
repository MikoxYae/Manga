const series = [
  {title:"Solo Leveling",type:"Manhwa",chapter:"Chapter 201",rating:"9.6",genres:"Action, Fantasy",status:"Completed",views:"2.4M",updated:"2h ago"},
  {title:"One Piece",type:"Manga",chapter:"Chapter 1124",rating:"9.8",genres:"Adventure, Comedy",status:"Ongoing",views:"5.1M",updated:"1d ago"},
  {title:"Omniscient Reader",type:"Manhwa",chapter:"Chapter 220",rating:"9.4",genres:"Action, Fantasy",status:"Ongoing",views:"1.8M",updated:"3h ago"},
  {title:"Magic Emperor",type:"Manhua",chapter:"Chapter 610",rating:"9.1",genres:"Martial Arts",status:"Ongoing",views:"1.2M",updated:"5h ago"},
  {title:"Blue Lock",type:"Manga",chapter:"Chapter 278",rating:"9.0",genres:"Sports, Drama",status:"Ongoing",views:"980K",updated:"1d ago"},
  {title:"The Beginning After The End",type:"Webtoon",chapter:"Chapter 189",rating:"9.3",genres:"Fantasy, Adventure",status:"Ongoing",views:"1.5M",updated:"2d ago"},
  {title:"Tower of God",type:"Manhwa",chapter:"Chapter 642",rating:"9.2",genres:"Adventure",status:"Ongoing",views:"1.1M",updated:"4h ago"},
  {title:"Spy x Family",type:"Manga",chapter:"Chapter 104",rating:"9.0",genres:"Comedy, Action",status:"Ongoing",views:"860K",updated:"6h ago"},
  {title:"Eleceed",type:"Manhwa",chapter:"Chapter 312",rating:"9.1",genres:"Action, Comedy",status:"Ongoing",views:"720K",updated:"8h ago"},
  {title:"Martial Peak",type:"Manhua",chapter:"Chapter 3780",rating:"8.7",genres:"Martial Arts",status:"Ongoing",views:"950K",updated:"12h ago"},
  {title:"Jujutsu Kaisen",type:"Manga",chapter:"Chapter 271",rating:"9.5",genres:"Action, Supernatural",status:"Completed",views:"3.2M",updated:"2d ago"},
  {title:"Return of the Mount Hua Sect",type:"Manhwa",chapter:"Chapter 132",rating:"9.2",genres:"Martial Arts",status:"Ongoing",views:"680K",updated:"1d ago"},
  {title:"Chainsaw Man",type:"Manga",chapter:"Chapter 178",rating:"9.1",genres:"Action, Supernatural",status:"Ongoing",views:"2.1M",updated:"3d ago"},
  {title:"Nano Machine",type:"Manhwa",chapter:"Chapter 226",rating:"9.0",genres:"Martial Arts, Action",status:"Ongoing",views:"590K",updated:"1d ago"},
  {title:"Pick Me Up",type:"Manhwa",chapter:"Chapter 115",rating:"8.9",genres:"Fantasy, Action",status:"Ongoing",views:"430K",updated:"2d ago"},
  {title:"Kingdom",type:"Manga",chapter:"Chapter 814",rating:"9.4",genres:"War, Historical",status:"Ongoing",views:"1.4M",updated:"4d ago"}
];

const coverClass = {
  "Manga":"manga-bg",
  "Manhwa":"manhwa-bg",
  "Manhua":"manhua-bg",
  "Webtoon":"webtoon-bg"
};

const badgeClass = {
  "Manga":"type-manga",
  "Manhwa":"type-manhwa",
  "Manhua":"type-manhua",
  "Webtoon":"type-webtoon"
};

function card(item){
  const bg = coverClass[item.type] || "manga-bg";
  const bc = badgeClass[item.type] || "";
  return `<a class="manga-card" href="detail.html" data-type="${item.type}" data-title="${item.title.toLowerCase()}" data-status="${item.status}">
    <div class="cover ${bg}">
      <span class="cover-badge">${item.type}</span>
      <span class="cover-title">${item.title}</span>
    </div>
    <div class="manga-body">
      <h3>${item.title}</h3>
      <p>${item.genres}</p>
      <div class="card-meta">
        <span class="badge ${bc}">${item.type}</span>
        <span class="rating">${item.rating}</span>
      </div>
      <div style="margin-top:6px"><span class="ch-label">${item.chapter}</span></div>
    </div>
  </a>`;
}

function feedRow(item){
  const bg = coverClass[item.type] || "manga-bg";
  const bc = badgeClass[item.type] || "";
  return `<a class="feed-item" href="reader.html">
    <div class="feed-cover ${bg}">${item.title.substring(0,4)}</div>
    <div class="feed-info">
      <b>${item.title}</b>
      <div class="sub"><span class="badge ${bc}" style="font-size:10px;padding:3px 7px">${item.type}</span> ${item.genres.split(",")[0]}</div>
    </div>
    <div class="feed-badge">
      <span class="feed-ch">${item.chapter}</span>
      <span class="feed-time">${item.updated}</span>
    </div>
  </a>`;
}

function renderHome(filter, query){
  if(filter === undefined) filter = "all";
  if(query === undefined) query = "";
  const grid = document.getElementById("mangaGrid");
  const feed = document.getElementById("chapterFeed");
  if(grid){
    const q = query.trim().toLowerCase();
    const items = series.filter(function(item){
      const typeOk = filter === "all" || item.type === filter;
      const searchOk = !q || (item.title + " " + item.type + " " + item.genres).toLowerCase().indexOf(q) !== -1;
      return typeOk && searchOk;
    });
    grid.innerHTML = items.slice(0,12).map(card).join("") || '<p class="sub" style="grid-column:1/-1;padding:20px 0">No series found.</p>';
  }
  if(feed) feed.innerHTML = series.slice(0,8).map(feedRow).join("");
}

function renderBrowse(){
  const list = document.getElementById("browseGrid");
  if(!list) return;
  const q = (document.getElementById("browseSearch") ? document.getElementById("browseSearch").value : "").toLowerCase();
  const type = document.getElementById("typeFilter") ? document.getElementById("typeFilter").value : "all";
  const status = document.getElementById("statusFilter") ? document.getElementById("statusFilter").value : "all";
  const sort = document.getElementById("sortFilter") ? document.getElementById("sortFilter").value : "latest";
  let items = series.filter(function(item){
    const searchOk = !q || (item.title + " " + item.type + " " + item.genres).toLowerCase().indexOf(q) !== -1;
    const typeOk = type === "all" || item.type === type;
    const statusOk = status === "all" || item.status === status;
    return searchOk && typeOk && statusOk;
  });
  if(sort === "rating") items = items.slice().sort(function(a,b){ return parseFloat(b.rating) - parseFloat(a.rating); });
  if(sort === "az") items = items.slice().sort(function(a,b){ return a.title.localeCompare(b.title); });
  list.innerHTML = items.map(card).join("") || '<p class="sub" style="grid-column:1/-1;padding:20px 0">No series found.</p>';
  const count = document.getElementById("resultCount");
  if(count) count.textContent = items.length + " series";
}

function renderLatest(){
  const feed = document.getElementById("latestFeed");
  if(!feed) return;
  const recentSeries = series.slice();
  feed.innerHTML = recentSeries.slice(0,14).map(function(item,i){
    const bg = coverClass[item.type] || "manga-bg";
    const bc = badgeClass[item.type] || "";
    return `<a class="latest-item" href="reader.html">
      <div class="latest-cover ${bg}">${item.title.substring(0,6)}</div>
      <div class="latest-info">
        <h4>${item.title}</h4>
        <div class="sub">
          <span class="badge ${bc}" style="font-size:10px;padding:3px 7px">${item.type}</span>
          <span style="margin-left:6px">${item.genres.split(",")[0]}</span>
        </div>
      </div>
      <div class="latest-right">
        <div class="latest-ch">${item.chapter}</div>
        <span class="latest-time">${item.updated}</span>
      </div>
    </a>`;
  }).join("");
}

function renderRanking(period){
  if(!period) period = "weekly";
  const list = document.getElementById("rankList");
  if(!list) return;
  let items = series.slice();
  if(period === "monthly") items = series.slice().sort(function(a,b){ return parseFloat(b.rating) - parseFloat(a.rating); });
  if(period === "alltime") items = series.slice().reverse();
  const rankClasses = ["gold","silver","bronze"];
  list.innerHTML = items.slice(0,12).map(function(item,i){
    const bc = badgeClass[item.type] || "";
    const numClass = i < 3 ? rankClasses[i] : "";
    return `<li class="ranking-item">
      <a href="detail.html">
        <div class="rank-num ${numClass}">${String(i+1).padStart(2,"0")}</div>
        <div class="rank-info">
          <b>${item.title}</b>
          <small>${item.type} <span class="badge ${bc}" style="font-size:10px;padding:2px 7px">${item.type}</span></small>
        </div>
        <div class="rank-right">
          <div class="rank-rating">${item.rating}</div>
          <div class="rank-views">${item.views} views</div>
        </div>
      </a>
    </li>`;
  }).join("");
}

/* Tab switching */
document.querySelectorAll("[data-tab-group]").forEach(function(group){
  const name = group.dataset.tabGroup;
  group.querySelectorAll("[data-tab]").forEach(function(btn){
    btn.addEventListener("click", function(){
      document.querySelectorAll('[data-tab-group="'+name+'"] [data-tab]').forEach(function(b){ b.classList.remove("active"); });
      btn.classList.add("active");
      const target = btn.dataset.tab;
      document.querySelectorAll('[data-panel-group="'+name+'"] [data-panel]').forEach(function(p){
        p.style.display = p.dataset.panel === target ? "" : "none";
      });
      if(name === "home-type") renderHome(target, document.getElementById("searchInput") ? document.getElementById("searchInput").value : "");
      if(name === "ranking") renderRanking(target);
    });
  });
});

document.querySelectorAll("#typeTabs button").forEach(function(btn){
  btn.addEventListener("click", function(){
    document.querySelectorAll("#typeTabs button").forEach(function(b){ b.classList.remove("active"); });
    btn.classList.add("active");
    renderHome(btn.dataset.filter, document.getElementById("searchInput") ? document.getElementById("searchInput").value : "");
  });
});

var searchForm = document.getElementById("searchForm");
if(searchForm){
  searchForm.addEventListener("submit", function(e){
    e.preventDefault();
    var activeBtn = document.querySelector("#typeTabs button.active");
    var filter = activeBtn ? activeBtn.dataset.filter : "all";
    var input = document.getElementById("searchInput");
    renderHome(filter, input ? input.value : "");
    var popular = document.getElementById("popular");
    if(popular) popular.scrollIntoView({behavior:"smooth"});
  });
}

["browseSearch","typeFilter","statusFilter","sortFilter"].forEach(function(id){
  var el = document.getElementById(id);
  if(el) el.addEventListener("input", renderBrowse);
});

var clearFilters = document.getElementById("clearFilters");
if(clearFilters){
  clearFilters.addEventListener("click", function(){
    ["browseSearch","typeFilter","statusFilter"].forEach(function(id){
      var el = document.getElementById(id);
      if(el) el.value = el.tagName === "SELECT" ? "all" : "";
    });
    renderBrowse();
  });
}

/* Type filter buttons for browse */
document.querySelectorAll(".type-filter-btn").forEach(function(btn){
  btn.addEventListener("click", function(){
    document.querySelectorAll(".type-filter-btn").forEach(function(b){ b.classList.remove("active"); });
    btn.classList.add("active");
    var tf = document.getElementById("typeFilter");
    if(tf){ tf.value = btn.dataset.value; renderBrowse(); }
  });
});

/* Genre chip quick filter */
document.querySelectorAll(".genre-chip[data-filter]").forEach(function(chip){
  chip.addEventListener("click", function(){
    document.querySelectorAll(".genre-chip[data-filter]").forEach(function(c){ c.classList.remove("active"); });
    chip.classList.add("active");
    var filterValue = chip.dataset.filter;
    document.querySelectorAll("#typeTabs button").forEach(function(b){
      b.classList.toggle("active", (filterValue === "all" && b.dataset.filter === "all") || b.dataset.filter === filterValue);
    });
    renderHome(filterValue, document.getElementById("searchInput") ? document.getElementById("searchInput").value : "");
    var popular = document.getElementById("popular");
    if(popular) popular.scrollIntoView({behavior:"smooth"});
  });
});

/* Mobile menu */
var menuBtn = document.getElementById("menuBtn");
if(menuBtn){
  menuBtn.addEventListener("click", function(){
    var nav = document.querySelector(".nav");
    if(nav) nav.classList.toggle("open");
  });
}

/* Reader controls */
var themeToggle = document.getElementById("themeToggle");
if(themeToggle){
  themeToggle.addEventListener("click", function(){
    document.body.classList.toggle("light-reader");
    themeToggle.textContent = document.body.classList.contains("light-reader") ? "Dark Mode" : "Light Mode";
  });
}

var compactBtn = document.getElementById("compactBtn");
if(compactBtn){
  compactBtn.addEventListener("click", function(){
    var wrap = document.querySelector(".reader-wrap");
    if(wrap){
      wrap.classList.toggle("compact");
      compactBtn.classList.toggle("active");
      compactBtn.textContent = wrap.classList.contains("compact") ? "Normal Height" : "Compact";
    }
  });
}

var wideBtn = document.getElementById("wideBtn");
if(wideBtn){
  wideBtn.addEventListener("click", function(){
    var wrap = document.querySelector(".reader-wrap");
    if(wrap){
      wrap.classList.toggle("wide");
      wideBtn.classList.toggle("active");
      wideBtn.textContent = wrap.classList.contains("wide") ? "Standard Width" : "Wide Mode";
    }
  });
}

/* Featured slider */
var slides = document.querySelectorAll(".featured-slide");
var dots = document.querySelectorAll(".slider-dot");
var currentSlide = 0;
function goToSlide(n){
  slides.forEach(function(s,i){ s.classList.toggle("active", i === n); });
  dots.forEach(function(d,i){ d.classList.toggle("active", i === n); });
  currentSlide = n;
}
dots.forEach(function(dot,i){
  dot.addEventListener("click", function(){ goToSlide(i); });
});
if(slides.length > 1){
  setInterval(function(){
    goToSlide((currentSlide + 1) % slides.length);
  }, 4500);
}

/* Admin sidebar tabs */
document.querySelectorAll(".admin-sidebar a[data-section]").forEach(function(link){
  link.addEventListener("click", function(){
    document.querySelectorAll(".admin-sidebar a").forEach(function(a){ a.classList.remove("active"); });
    link.classList.add("active");
    document.querySelectorAll(".admin-section").forEach(function(s){ s.style.display = "none"; });
    var sec = document.getElementById(link.dataset.section);
    if(sec) sec.style.display = "";
  });
});

/* Filter row pills (genre chips in browse) */
document.querySelectorAll(".filter-row button").forEach(function(btn){
  btn.addEventListener("click", function(){
    document.querySelectorAll(".filter-row button").forEach(function(b){ b.classList.remove("active"); });
    btn.classList.add("active");
  });
});

renderHome();
renderBrowse();
renderLatest();
renderRanking("weekly");
