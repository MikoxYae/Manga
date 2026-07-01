const API = "";

const coverClass = {
  "Manga":"manga-bg","Manhwa":"manhwa-bg","Manhua":"manhua-bg","Webtoon":"webtoon-bg"
};
const badgeClass = {
  "Manga":"type-manga","Manhwa":"type-manhwa","Manhua":"type-manhua","Webtoon":"type-webtoon"
};

function coverImg(url, title, bgClass){
  if(url){
    return '<img src="'+url+'" alt="'+title+'" loading="lazy" onerror="this.style.display=\'none\';this.parentNode.classList.add(\''+bgClass+'\')">';
  }
  return "";
}

function card(item){
  const bg = coverClass[item.type] || "manga-bg";
  const bc = badgeClass[item.type] || "";
  const ch = item.latest_chapter || ("Ch. " + (item.chapter_count || "?"));
  const hasCover = item.cover_url ? "" : " " + bg;
  return `<a class="manga-card" href="detail.html?id=${item.id}" data-type="${item.type}">
    <div class="cover${hasCover}">
      ${coverImg(item.cover_url, item.title, bg)}
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
  const hasCover = item.cover_url ? "" : " " + bg;
  const imgHtml = item.cover_url
    ? '<img src="'+item.cover_url+'" alt="'+item.title+'" loading="lazy" onerror="this.style.display=\'none\';this.parentNode.classList.add(\''+bg+'\')">'
    : item.title.substring(0,4);
  return `<a class="feed-item" href="detail.html?id=${item.id}">
    <div class="feed-cover${hasCover}">${imgHtml}</div>
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
  const seriesTitle = item.series_title || item.title || "";
  const hasCover = item.cover_url ? "" : " " + bg;
  const imgHtml = item.cover_url
    ? '<img src="'+item.cover_url+'" alt="'+seriesTitle+'" loading="lazy" onerror="this.style.display=\'none\';this.parentNode.classList.add(\''+bg+'\')">'
    : seriesTitle.substring(0,6);
  return `<a class="latest-item" href="detail.html?id=${item.id}">
    <div class="latest-cover${hasCover}">${imgHtml}</div>
    <div class="latest-info">
      <h4>${seriesTitle}</h4>
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
    if(series.cover_url){
      coverEl.className = "big-cover";
      const existing = coverEl.querySelector("span");
      const img = document.createElement("img");
      img.src = series.cover_url;
      img.alt = series.title;
      img.loading = "lazy";
      img.onerror = function(){
        this.style.display = "none";
        coverEl.classList.add(bg);
      };
      coverEl.insertBefore(img, coverEl.firstChild);
      if(existing) existing.textContent = series.title;
    } else {
      coverEl.className = "big-cover " + bg;
      const sp = coverEl.querySelector("span");
      if(sp) sp.textContent = series.title;
    }
  }
  document.title = series.title + " - MikoReads";

  const chData = await apiFetch("/api/chapters/series/" + id + "?limit=20");
  const chList = document.getElementById("chapterList");
  const chPage = document.getElementById("chapterPagination");
  function buildPagination(tp){
    if(!chPage) return;
    if(tp <= 1){ chPage.style.display="none"; return; }
    var h = "<a class='active-page'>1</a>";
    if(tp>1) h += "<a>2</a>";
    if(tp>2) h += "<a>3</a>";
    if(tp>4) h += "<a>...</a>";
    if(tp>3) h += "<a>"+tp+"</a>";
    h += "<a>Next</a>";
    chPage.innerHTML = h; chPage.style.display = "";
  }
  if(chList && chData){
    var chs = chData.items || [];
    var total = chData.total || 0;
    if(chs.length > 0){
      chList.innerHTML = chs.map(function(ch){
        return "<a href='reader.html?chapter="+ch.id+"'><b>"+ch.title+"</b><span>"+(ch.updated_label||"")+"</span></a>";
      }).join("");
      buildPagination(Math.ceil(total/20));
    } else if((series.chapter_count||0) > 0){
      var cnt = series.chapter_count;
      var rows = [];
      for(var n = cnt; n > Math.max(0, cnt-20); n--){
        rows.push("<a href='reader.html'><b>Chapter "+n+"</b><span></span></a>");
      }
      chList.innerHTML = rows.join("");
      buildPagination(Math.ceil(cnt/20));
    } else {
      chList.innerHTML = "<p style='padding:20px 0;color:#9ca3af;text-align:center'>No chapters available yet.</p>";
      if(chPage) chPage.style.display="none";
    }
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

async function renderFeatured(){
  var slider = document.getElementById("featuredSlider");
  if(!slider) return;

  var data = await apiFetch("/api/series/trending?limit=3");
  var items = data ? (Array.isArray(data) ? data : (data.items||data.results||[])) : [];
  if(!items.length){
    // fall back to static slider init if no API data
    var s2=slider.querySelectorAll(".featured-slide"), d2=slider.querySelectorAll(".slider-dot"), c2=0;
    function g2(n){ s2.forEach(function(s,i){s.classList.toggle("active",i===n);}); d2.forEach(function(d,i){d.classList.toggle("active",i===n);}); c2=n; }
    d2.forEach(function(dot,i){ dot.addEventListener("click", function(){ g2(i); }); });
    if(s2.length>1){ setInterval(function(){ g2((c2+1)%s2.length); }, 4500); }
    return;
  }

  var bgColors = [
    "rgba(30,10,78,.82), rgba(12,74,110,.72) 55%, rgba(17,24,39,.88)",
    "rgba(26,15,60,.82), rgba(124,45,18,.72) 55%, rgba(17,24,39,.88)",
    "rgba(4,47,46,.82), rgba(30,58,95,.72) 55%, rgba(17,24,39,.88)"
  ];
  var typeClass = { "Manga":"type-manga", "Manhwa":"type-manhwa", "Manhua":"type-manhua", "Webtoon":"type-webtoon" };

  var slidesHtml = items.slice(0,3).map(function(item,i){
    var bg = bgColors[i] || bgColors[0];
    var bgStyle = item.cover_url
      ? "background:linear-gradient(140deg,"+bg+"),url("+JSON.stringify(item.cover_url)+") center top/cover no-repeat"
      : "background:linear-gradient(140deg,"+bg+")";
    var tc = typeClass[item.type] || "";
    var statusBadge = item.status ? "<span class='badge clean'>"+item.status+"</span>" : "";
    var typeBadge   = item.type   ? "<span class='badge "+tc+"'>"+item.type+"</span>"     : "";
    var desc = (item.description||item.synopsis||item.summary||"").slice(0,150);
    if((item.description||item.synopsis||"").length>150) desc += "...";
    var link = item._id ? "detail.html?id="+item._id : (item.id ? "detail.html?id="+item.id : "detail.html");
    return "<div class='featured-slide"+(i===0?" active":"")+"'>"+
      "<div class='featured-bg' style='"+bgStyle+"'></div>"+
      "<div class='featured-content'>"+
        "<div class='badges'>"+statusBadge+typeBadge+"</div>"+
        "<h2>"+item.title+"</h2>"+
        "<p>"+desc+"</p>"+
        "<a class='primary' href='"+link+"'>View Details</a>"+
      "</div>"+
    "</div>";
  }).join("");

  var dotsHtml = items.slice(0,3).map(function(_,i){
    return "<div class='slider-dot"+(i===0?" active":"")+"'></div>";
  }).join("");

  slider.innerHTML = slidesHtml+"<div class='slider-dots'>"+dotsHtml+"</div>";

  // re-init slider
  var ns=slider.querySelectorAll(".featured-slide"), nd=slider.querySelectorAll(".slider-dot"), nc=0;
  function gn(n){ ns.forEach(function(s,i){s.classList.toggle("active",i===n);}); nd.forEach(function(d,i){d.classList.toggle("active",i===n);}); nc=n; }
  nd.forEach(function(dot,i){ dot.addEventListener("click", function(){ gn(i); }); });
  if(ns.length>1){ setInterval(function(){ gn((nc+1)%ns.length); }, 4500); }
}

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
renderFeatured();
renderDetail();
