const API = "";

const coverClass = {
  "Manga":"manga-bg","Manhwa":"manhwa-bg","Manhua":"manhua-bg","Webtoon":"webtoon-bg"
};
const badgeClass = {
  "Manga":"type-manga","Manhwa":"type-manhwa","Manhua":"type-manhua","Webtoon":"type-webtoon"
};

function card(item){
  const bg = coverClass[item.type] || "manga-bg";
  const bc = badgeClass[item.type] || "";
  const ch = item.latest_chapter || ("Ch. " + (item.chapter_count || "?"));
  return `<a class="manga-card" href="detail.html?id=${item.id}" data-type="${item.type}">
    <div class="cover ${bg}">
      <span class="cover-badge">${item.type}</span>
      <span class="cover-title">${item.title}</span>
    </div>
    <div class="manga-body">
      <h3>${item.title}</h3>
      <p>${(item.genres||[]).join(", ")}</p>
      <div class="card-meta">
        <span class="badge ${bc}">${item.type}</span>
        <span class="rating">${item.rating||""}</span>
      </div>
      <div style="margin-top:6px"><span class="ch-label">${ch}</span></div>
    </div>
  </a>`;
}

function feedRow(item){
  const bg = coverClass[item.type] || "manga-bg";
  const bc = badgeClass[item.type] || "";
  return `<a class="feed-item" href="detail.html?id=${item.id}">
    <div class="feed-cover ${bg}">${item.title.substring(0,4)}</div>
    <div class="feed-info">
      <b>${item.title}</b>
      <div class="sub"><span class="badge ${bc}" style="font-size:10px;padding:3px 7px">${item.type}</span> ${(item.genres||[])[0]||""}</div>
    </div>
    <div class="feed-badge">
      <span class="feed-ch">${item.latest_chapter||""}</span>
      <span class="feed-time">${item.updated_label||""}</span>
    </div>
  </a>`;
}

function latestRow(item){
  const bg = coverClass[item.type] || "manga-bg";
  const bc = badgeClass[item.type] || "";
  return `<a class="latest-item" href="detail.html?id=${item.id}">
    <div class="latest-cover ${bg}">${item.series_title ? item.series_title.substring(0,6) : ""}</div>
    <div class="latest-info">
      <h4>${item.series_title||item.title||""}</h4>
      <div class="sub"><span class="badge ${bc}" style="font-size:10px;padding:3px 7px">${item.type||""}</span></div>
    </div>
    <div class="latest-right">
      <div class="latest-ch">${item.title||""}</div>
      <span class="latest-time">${item.updated_label||""}</span>
    </div>
  </a>`;
}

function rankRow(item, i){
  const bc = badgeClass[item.type] || "";
  const rankClasses = ["gold","silver","bronze"];
  const numClass = i < 3 ? rankClasses[i] : "";
  return `<li class="ranking-item">
    <a href="detail.html?id=${item.id}">
      <div class="rank-num ${numClass}">${String(i+1).padStart(2,"0")}</div>
      <div class="rank-info">
        <b>${item.title}</b>
        <small><span class="badge ${bc}" style="font-size:10px;padding:2px 7px">${item.type}</span></small>
      </div>
      <div class="rank-right">
        <div class="rank-rating">${item.rating}</div>
        <div class="rank-views">${fmtViews(item.views)}</div>
      </div>
    </a>
  </li>`;
}

function fmtViews(n){
  if(!n) return "";
  if(n >= 1000000) return (n/1000000).toFixed(1)+"M views";
  if(n >= 1000) return (n/1000).toFixed(0)+"K views";
  return n+" views";
}

async function apiFetch(path){
  try {
    const res = await fetch(API + path);
    if(!res.ok) throw new Error("HTTP "+res.status);
    return await res.json();
  } catch(e){
    console.warn("API error:", path, e.message);
    return null;
  }
}

async function renderHome(type, query){
  if(type === undefined) type = "all";
  if(query === undefined) query = "";

  const grid = document.getElementById("mangaGrid");
  const feed = document.getElementById("chapterFeed");

  if(grid){
    let url = "/api/series/trending?limit=12";
    if(type && type !== "all") url += "&type=" + encodeURIComponent(type);
    if(query) url = "/api/search/?q=" + encodeURIComponent(query) + "&limit=12";
    const data = await apiFetch(url);
    const items = data ? (data.items || data) : [];
    grid.innerHTML = items.length
      ? items.map(card).join("")
      : '<p class="sub" style="grid-column:1/-1;padding:20px 0">No series found.</p>';
  }

  if(feed){
    const data = await apiFetch("/api/series/latest-updated?limit=8");
    const items = data || [];
    feed.innerHTML = items.map(feedRow).join("");
  }
}

async function renderBrowse(){
  const list = document.getElementById("browseGrid");
  if(!list) return;
  const q      = (document.getElementById("browseSearch") || {}).value || "";
  const type   = (document.getElementById("typeFilter") || {}).value || "all";
  const status = (document.getElementById("statusFilter") || {}).value || "all";
  const sort   = (document.getElementById("sortFilter") || {}).value || "updated";

  let url;
  if(q){
    url = "/api/search/?q=" + encodeURIComponent(q) + "&limit=24";
  } else {
    url = "/api/series/?limit=24&sort=" + sort;
    if(type && type !== "all") url += "&type=" + encodeURIComponent(type);
    if(status && status !== "all") url += "&status=" + encodeURIComponent(status);
  }

  const data = await apiFetch(url);
  const items = data ? (data.items || data) : [];
  list.innerHTML = items.length
    ? items.map(card).join("")
    : '<p class="sub" style="grid-column:1/-1;padding:20px 0">No series found.</p>';
  const count = document.getElementById("resultCount");
  if(count) count.textContent = (data && data.total ? data.total : items.length) + " series";
}

async function renderLatest(){
  const feed = document.getElementById("latestFeed");
  if(!feed) return;
  const data = await apiFetch("/api/chapters/latest?limit=14");
  const items = data || [];
  feed.innerHTML = items.map(latestRow).join("");
}

async function renderRanking(period){
  if(!period) period = "weekly";
  const list = document.getElementById("rankList");
  if(!list) return;
  const data = await apiFetch("/api/series/ranking?period=" + period + "&limit=12");
  const items = data || [];
  list.innerHTML = items.map(rankRow).join("");
}

async function renderDetail(){
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if(!id) return;

  const series = await apiFetch("/api/series/" + id);
  if(!series) return;

  const titleEl = document.getElementById("seriesTitle");
  const altEl   = document.getElementById("seriesAlt");
  const descEl  = document.getElementById("seriesDesc");
  const metaEls = {
    status: document.getElementById("metaStatus"),
    author: document.getElementById("metaAuthor"),
    artist: document.getElementById("metaArtist"),
    rating: document.getElementById("metaRating"),
  };
  const genreEl = document.getElementById("seriesGenres");
  const coverEl = document.getElementById("seriesCover");

  if(titleEl) titleEl.textContent = series.title;
  if(altEl && series.alt_title) altEl.textContent = "Alternative title: " + series.alt_title;
  if(descEl) descEl.textContent = series.description;
  if(metaEls.status) metaEls.status.textContent = series.status;
  if(metaEls.author) metaEls.author.textContent = series.author;
  if(metaEls.artist) metaEls.artist.textContent = series.artist;
  if(metaEls.rating) metaEls.rating.textContent = series.rating;
  if(genreEl) genreEl.innerHTML = (series.genres||[]).map(g => `<span class="genre-tag">${g}</span>`).join("");
  if(coverEl){
    const bg = coverClass[series.type] || "manga-bg";
    coverEl.className = "big-cover " + bg;
    const sp = coverEl.querySelector("span");
    if(sp) sp.textContent = series.title;
  }
  document.title = series.title + " - MikoReads";

  const chData = await apiFetch("/api/chapters/series/" + id + "?limit=20");
  const chList = document.getElementById("chapterList");
  if(chList && chData){
    const chs = chData.items || [];
    chList.innerHTML = chs.map(ch =>
      `<a href="reader.html?chapter=${ch.id}"><b>${ch.title}</b><span>${ch.updated_label||""}</span></a>`
    ).join("");
  }
}

function setupTypeFilterBtns(){
  document.querySelectorAll(".type-filter-btn").forEach(function(btn){
    btn.addEventListener("click", function(){
      document.querySelectorAll(".type-filter-btn").forEach(function(b){ b.classList.remove("active"); });
      btn.classList.add("active");
      var tf = document.getElementById("typeFilter");
      if(tf){ tf.value = btn.dataset.value; renderBrowse(); }
    });
  });
}

function setupGenreChips(){
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
}

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
    var input = document.getElementById("searchInput");
    var activeBtn = document.querySelector("#typeTabs button.active");
    renderHome(activeBtn ? activeBtn.dataset.filter : "all", input ? input.value : "");
    var popular = document.getElementById("popular");
    if(popular) popular.scrollIntoView({behavior:"smooth"});
  });
}

["browseSearch","statusFilter","sortFilter"].forEach(function(id){
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
    document.querySelectorAll(".type-filter-btn").forEach(function(b){ b.classList.toggle("active", b.dataset.value === "all"); });
    renderBrowse();
  });
}

var menuBtn = document.getElementById("menuBtn");
if(menuBtn){
  menuBtn.addEventListener("click", function(){
    var nav = document.querySelector(".nav");
    if(nav) nav.classList.toggle("open");
  });
}

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

var slides = document.querySelectorAll(".featured-slide");
var dots   = document.querySelectorAll(".slider-dot");
var currentSlide = 0;
function goToSlide(n){
  slides.forEach(function(s,i){ s.classList.toggle("active", i===n); });
  dots.forEach(function(d,i){ d.classList.toggle("active", i===n); });
  currentSlide = n;
}
dots.forEach(function(dot,i){ dot.addEventListener("click", function(){ goToSlide(i); }); });
if(slides.length > 1){ setInterval(function(){ goToSlide((currentSlide+1)%slides.length); }, 4500); }

document.querySelectorAll(".filter-row button").forEach(function(btn){
  btn.addEventListener("click", function(){
    document.querySelectorAll(".filter-row button").forEach(function(b){ b.classList.remove("active"); });
    btn.classList.add("active");
  });
});

document.querySelectorAll(".admin-sidebar a[data-section]").forEach(function(link){
  link.addEventListener("click", function(){
    document.querySelectorAll(".admin-sidebar a").forEach(function(a){ a.classList.remove("active"); });
    link.classList.add("active");
    document.querySelectorAll(".admin-section").forEach(function(s){ s.style.display="none"; });
    var sec = document.getElementById(link.dataset.section);
    if(sec) sec.style.display="";
  });
});

setupTypeFilterBtns();
setupGenreChips();

renderHome();
renderBrowse();
renderLatest();
renderRanking("weekly");
renderDetail();
