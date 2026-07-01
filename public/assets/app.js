const API = "";

const coverClass = {
  "Manga": "manga-bg",
  "Manhwa": "manhwa-bg",
  "Manhua": "manhua-bg",
  "Webtoon": "webtoon-bg"
};
const badgeClass = {
  "Manga": "type-manga",
  "Manhwa": "type-manhwa",
  "Manhua": "type-manhua",
  "Webtoon": "type-webtoon"
};

function safe(value){
  return String(value === undefined || value === null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalizeCover(item){
  item = item || {};
  return item.cover_url || item.cover_image || item.coverImage || item.image_url || item.image || item.thumbnail || item.poster || "";
}

function itemId(item){
  return item ? (item.id || item._id || item.slug || "") : "";
}

function detailUrl(item){
  const id = itemId(item);
  return id ? "detail.html?id=" + encodeURIComponent(id) : "detail.html";
}

function readerUrl(seriesId, number, chapterId){
  const sid = seriesId || "";
  if(sid && number){
    return "reader.html?series=" + encodeURIComponent(sid) + "&chapter=" + encodeURIComponent(number);
  }
  if(chapterId){
    return "reader.html?chapter=" + encodeURIComponent(chapterId);
  }
  return "reader.html";
}

function coverImg(url, title, bgClass){
  if(!url) return "";
  return '<img src="' + safe(url) + '" alt="' + safe(title) + '" loading="lazy" onerror="this.style.display=\'none\';this.parentNode.classList.add(\'' + bgClass + '\')">';
}

function card(item){
  const bg = coverClass[item.type] || "manga-bg";
  const bc = badgeClass[item.type] || "";
  const cover = normalizeCover(item);
  const ch = item.latest_chapter || (item.chapter_count ? ("Ch. " + item.chapter_count) : "");
  const hasCover = cover ? "" : " " + bg;
  return `<a class="manga-card" href="${detailUrl(item)}" data-type="${safe(item.type || "")}">
    <div class="cover${hasCover}">
      ${coverImg(cover, item.title, bg)}
      <span class="cover-badge">${safe(item.type || "Series")}</span>
      <span class="cover-title">${safe(item.title || "Untitled")}</span>
    </div>
    <div class="manga-body">
      <h3>${safe(item.title || "Untitled")}</h3>
      <p>${safe((item.genres || []).slice(0, 3).join(", "))}</p>
      <div class="card-meta">
        <span class="badge ${bc}">${safe(item.type || "Series")}</span>
        <span class="rating">${safe(item.rating || "")}</span>
      </div>
      <div style="margin-top:6px"><span class="ch-label">${safe(ch)}</span></div>
    </div>
  </a>`;
}

function feedRow(item){
  const bg = coverClass[item.type] || "manga-bg";
  const bc = badgeClass[item.type] || "";
  const cover = normalizeCover(item);
  const hasCover = cover ? "" : " " + bg;
  const imgHtml = cover ? coverImg(cover, item.title, bg) : '<span>' + safe(String(item.title || "").substring(0, 4)) + '</span>';
  return `<a class="feed-item" href="${detailUrl(item)}">
    <div class="feed-cover${hasCover}">${imgHtml}</div>
    <div class="feed-info">
      <b>${safe(item.title || "Untitled")}</b>
      <div class="sub"><span class="badge ${bc}" style="font-size:10px;padding:3px 7px">${safe(item.type || "")}</span> ${safe((item.genres || [])[0] || "")}</div>
    </div>
    <div class="feed-badge">
      <span class="feed-ch">${safe(item.latest_chapter || "")}</span>
      <span class="feed-time">${safe(item.updated_label || "")}</span>
    </div>
  </a>`;
}

function latestRow(item){
  const bg = coverClass[item.type] || "manga-bg";
  const bc = badgeClass[item.type] || "";
  const seriesTitle = item.series_title || item.title || "Untitled";
  const cover = normalizeCover(item);
  const hasCover = cover ? "" : " " + bg;
  const imgHtml = cover ? coverImg(cover, seriesTitle, bg) : '<span>' + safe(String(seriesTitle).substring(0, 8)) + '</span>';
  const detailId = item.series_id || item.series_slug || item.id || "";
  return `<a class="latest-item" href="detail.html?id=${encodeURIComponent(detailId)}">
    <div class="latest-cover${hasCover}">${imgHtml}</div>
    <div class="latest-info">
      <h4>${safe(seriesTitle)}</h4>
      <div class="sub"><span class="badge ${bc}" style="font-size:10px;padding:3px 7px">${safe(item.type || "")}</span> ${safe((item.genres || [])[0] || "")}</div>
    </div>
    <div class="latest-right">
      <div class="latest-ch">${safe(item.title || (item.number ? "Chapter " + item.number : ""))}</div>
      <span class="latest-time">${safe(item.updated_label || "")}</span>
    </div>
  </a>`;
}

function rankRow(item, i){
  const bc = badgeClass[item.type] || "";
  const rankClasses = ["gold", "silver", "bronze"];
  const numClass = i < 3 ? rankClasses[i] : "";
  return `<li class="ranking-item">
    <a href="${detailUrl(item)}">
      <div class="rank-num ${numClass}">${String(i + 1).padStart(2, "0")}</div>
      <div class="rank-info">
        <b>${safe(item.title || "Untitled")}</b>
        <small><span class="badge ${bc}" style="font-size:10px;padding:2px 7px">${safe(item.type || "")}</span></small>
      </div>
      <div class="rank-right">
        <div class="rank-rating">${safe(item.rating || "")}</div>
        <div class="rank-views">${safe(fmtViews(item.views))}</div>
      </div>
    </a>
  </li>`;
}

function fmtViews(n){
  if(!n) return "";
  if(n >= 1000000) return (n / 1000000).toFixed(1) + "M views";
  if(n >= 1000) return (n / 1000).toFixed(0) + "K views";
  return n + " views";
}

async function apiFetch(path){
  try{
    const res = await fetch(API + path);
    if(!res.ok) throw new Error("HTTP " + res.status);
    return await res.json();
  }catch(e){
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
    grid.innerHTML = items.length ? items.map(card).join("") : '<p class="sub" style="grid-column:1/-1;padding:20px 0">No series found.</p>';
  }

  if(feed){
    const data = await apiFetch("/api/series/latest-updated?limit=8");
    const items = data || [];
    feed.innerHTML = items.length ? items.map(feedRow).join("") : '<p class="sub">No updates yet.</p>';
  }
}

async function renderBrowse(){
  const list = document.getElementById("browseGrid");
  if(!list) return;
  const q = (document.getElementById("browseSearch") || {}).value || "";
  const type = (document.getElementById("typeFilter") || {}).value || "all";
  const status = (document.getElementById("statusFilter") || {}).value || "all";
  const sort = (document.getElementById("sortFilter") || {}).value || "updated";

  let url;
  if(q){
    url = "/api/search/?q=" + encodeURIComponent(q) + "&limit=24";
  }else{
    url = "/api/series/?limit=24&sort=" + sort;
    if(type && type !== "all") url += "&type=" + encodeURIComponent(type);
    if(status && status !== "all") url += "&status=" + encodeURIComponent(status);
  }

  const data = await apiFetch(url);
  const items = data ? (data.items || data) : [];
  list.innerHTML = items.length ? items.map(card).join("") : '<p class="sub" style="grid-column:1/-1;padding:20px 0">No series found.</p>';
  const count = document.getElementById("resultCount");
  if(count) count.textContent = (data && data.total ? data.total : items.length) + " series";
}

async function renderLatest(){
  const feed = document.getElementById("latestFeed");
  if(!feed) return;
  const data = await apiFetch("/api/chapters/latest?limit=14");
  const items = data || [];
  feed.innerHTML = items.length ? items.map(latestRow).join("") : '<p class="sub">No chapter updates yet.</p>';
}

async function renderRanking(period){
  if(!period) period = "weekly";
  const list = document.getElementById("rankList");
  if(!list) return;
  const data = await apiFetch("/api/series/ranking?period=" + period + "&limit=12");
  const items = data || [];
  list.innerHTML = items.map(rankRow).join("");
}

function renderBadges(series){
  const badgeBox = document.getElementById("seriesBadges") || document.querySelector(".detail-copy .badges");
  if(!badgeBox) return;
  const bc = badgeClass[series.type] || "";
  const status = series.status || "Unknown";
  const statusClass = status.toLowerCase() === "completed" ? "clean" : "";
  let html = `<span class="badge ${statusClass}">${safe(status)}</span>`;
  html += `<span class="badge ${bc}">${safe(series.type || "Series")}</span>`;
  if(series.rating){ html += `<span class="badge warn">${safe(series.rating)} rating</span>`; }
  badgeBox.innerHTML = html;
}

function renderDetailCover(series){
  const coverEl = document.getElementById("seriesCover");
  if(!coverEl) return;
  const bg = coverClass[series.type] || "manga-bg";
  const cover = normalizeCover(series);
  coverEl.className = "big-cover " + (cover ? "" : bg);
  coverEl.innerHTML = cover ? `${coverImg(cover, series.title, bg)}<span>${safe(series.title || "Untitled")}</span>` : `<span>${safe(series.title || "Untitled")}</span>`;
}

async function fetchDetailSeries(id){
  if(id){
    return await apiFetch("/api/series/" + encodeURIComponent(id));
  }
  const data = await apiFetch("/api/series/trending?limit=1");
  const first = data && data.length ? data[0] : null;
  if(first && itemId(first)){
    const newUrl = "detail.html?id=" + encodeURIComponent(itemId(first));
    history.replaceState(null, "", newUrl);
    return await apiFetch("/api/series/" + encodeURIComponent(itemId(first)));
  }
  return null;
}

function chapterRow(ch, seriesId){
  const number = ch.number || "";
  const title = ch.title || (number ? "Chapter " + number : "Chapter");
  const href = readerUrl(seriesId, number, ch.id);
  return `<a class="chapter-row" href="${href}" data-title="${safe(String(title).toLowerCase())}">
    <div class="chapter-main">
      <b>${safe(title)}</b>
      ${ch.is_placeholder ? '<small>Metadata placeholder</small>' : ''}
    </div>
    <span>${safe(ch.updated_label || "")}</span>
  </a>`;
}

function buildChapterPagination(totalPages, currentPage, onPage){
  const chPage = document.getElementById("chapterPagination");
  if(!chPage) return;
  if(totalPages <= 1){ chPage.style.display = "none"; return; }
  chPage.style.display = "";
  const pages = [];
  pages.push(1);
  if(currentPage > 3) pages.push("...");
  for(let p = Math.max(2, currentPage - 1); p <= Math.min(totalPages - 1, currentPage + 1); p++) pages.push(p);
  if(currentPage < totalPages - 2) pages.push("...");
  if(totalPages > 1) pages.push(totalPages);
  if(currentPage < totalPages) pages.push("Next");

  chPage.innerHTML = pages.map(p => {
    if(p === "...") return "<a class='page-gap'>...</a>";
    if(p === "Next") return `<a data-page="${currentPage + 1}">Next</a>`;
    return `<a data-page="${p}" class="${p === currentPage ? "active-page" : ""}">${p}</a>`;
  }).join("");
  chPage.querySelectorAll("a[data-page]").forEach(a => {
    a.addEventListener("click", () => onPage(Number(a.dataset.page)));
  });
}

async function renderChapterPage(seriesId, page){
  const chList = document.getElementById("chapterList");
  if(!chList || !seriesId) return;
  const data = await apiFetch("/api/chapters/series/" + encodeURIComponent(seriesId) + "?limit=20&page=" + page);
  if(!data){
    chList.innerHTML = "<p style='padding:20px 0;color:#9ca3af;text-align:center'>No chapters available yet.</p>";
    return;
  }
  const chs = data.items || [];
  chList.innerHTML = chs.length ? chs.map(ch => chapterRow(ch, seriesId)).join("") : "<p style='padding:20px 0;color:#9ca3af;text-align:center'>No chapters available yet.</p>";
  buildChapterPagination(Math.ceil((data.total || chs.length || 0) / (data.limit || 20)), data.page || page, p => renderChapterPage(seriesId, p));

  const elCh = document.getElementById("metaChapters");
  if(elCh) elCh.textContent = (data.total || chs.length || 0) + " chapters";

  const startReading = document.getElementById("startReading");
  if(startReading && chs.length){
    const first = chs[0];
    startReading.href = readerUrl(seriesId, first.number, first.id);
  }
}

async function renderRelated(series){
  const grid = document.getElementById("relatedGrid") || document.querySelector(".related-grid");
  if(!grid || !series) return;
  let url = "/api/series/?limit=12&sort=rating";
  if(series.type) url += "&type=" + encodeURIComponent(series.type);
  const data = await apiFetch(url);
  let items = data ? (data.items || data) : [];
  const current = itemId(series);
  items = items.filter(it => itemId(it) !== current).slice(0, 5);
  if(!items.length){
    const fallback = await apiFetch("/api/series/trending?limit=6");
    items = (fallback || []).filter(it => itemId(it) !== current).slice(0, 5);
  }
  grid.innerHTML = items.length ? items.map(card).join("") : '<p class="sub">No related series found.</p>';
}

async function renderDetail(){
  if(!document.getElementById("seriesTitle")) return;
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id") || params.get("slug");
  const series = await fetchDetailSeries(id);
  if(!series || series.error) return;
  const sid = itemId(series);

  const titleEl = document.getElementById("seriesTitle");
  const altEl = document.getElementById("seriesAlt");
  const descEl = document.getElementById("seriesDesc");
  const genreEl = document.getElementById("seriesGenres");
  const metaEls = {
    status: document.getElementById("metaStatus"),
    author: document.getElementById("metaAuthor"),
    artist: document.getElementById("metaArtist"),
    rating: document.getElementById("metaRating"),
    type: document.getElementById("metaType"),
    schedule: document.getElementById("metaSchedule"),
    chapters: document.getElementById("metaChapters"),
  };

  if(titleEl) titleEl.textContent = series.title || "Untitled";
  if(altEl) altEl.textContent = series.alt_title ? "Alternative title: " + series.alt_title : "";
  if(descEl) descEl.textContent = series.description || "No description available yet.";
  if(metaEls.status) metaEls.status.textContent = series.status || "Unknown";
  if(metaEls.author) metaEls.author.textContent = series.author || "Unknown";
  if(metaEls.artist) metaEls.artist.textContent = series.artist || series.author || "Unknown";
  if(metaEls.rating) metaEls.rating.textContent = series.rating || "-";
  if(metaEls.type) metaEls.type.textContent = series.type || "-";
  if(metaEls.schedule) metaEls.schedule.textContent = series.status || series.schedule || "-";
  if(metaEls.chapters) metaEls.chapters.textContent = (series.chapter_count || 0) + " chapters";
  if(genreEl) genreEl.innerHTML = (series.genres || []).map(g => `<span class="genre-tag">${safe(g)}</span>`).join("");

  renderBadges(series);
  renderDetailCover(series);
  document.title = (series.title || "Series") + " - MikoReads";

  await renderChapterPage(sid, 1);
  renderRelated(series);

  const search = document.getElementById("chapterSearch") || document.querySelector(".chapter-toolbar input");
  if(search){
    search.oninput = function(){
      const q = this.value.trim().toLowerCase();
      document.querySelectorAll("#chapterList .chapter-row").forEach(row => {
        row.style.display = !q || row.dataset.title.includes(q) ? "" : "none";
      });
    };
  }
}

async function renderReader(){
  if(!document.body.classList.contains("reader-body")) return;
  const params = new URLSearchParams(window.location.search);
  let seriesId = params.get("series") || "";
  let chapterNumber = params.get("chapter") || "";
  let chapter = null;
  let series = null;

  if(seriesId && chapterNumber){
    series = await apiFetch("/api/series/" + encodeURIComponent(seriesId));
    chapter = await apiFetch("/api/chapters/series/" + encodeURIComponent(seriesId) + "/" + encodeURIComponent(chapterNumber));
  }else if(chapterNumber){
    chapter = await apiFetch("/api/chapters/" + encodeURIComponent(chapterNumber));
    if(chapter && chapter.series_id){
      seriesId = chapter.series_id;
      series = await apiFetch("/api/series/" + encodeURIComponent(seriesId));
    }
  }else{
    const top = await apiFetch("/api/series/trending?limit=1");
    if(top && top.length){
      series = top[0];
      seriesId = itemId(series);
      chapterNumber = series.chapter_count || 1;
      chapter = await apiFetch("/api/chapters/series/" + encodeURIComponent(seriesId) + "/" + encodeURIComponent(chapterNumber));
    }
  }

  if(!series && chapter && chapter.series_id){
    series = await apiFetch("/api/series/" + encodeURIComponent(chapter.series_id));
  }
  if(!series || !chapter) return;

  const num = Number(chapter.number || chapterNumber || series.chapter_count || 1);
  const title = `${series.title || chapter.series_title || "Series"} - ${chapter.title || ("Chapter " + num)}`;
  const titleEl = document.getElementById("readerTitle") || document.querySelector(".reader-title");
  if(titleEl) titleEl.textContent = title;
  document.title = title + " - MikoReads";

  const back = document.getElementById("readerBack") || document.querySelector(".reader-back-btn");
  if(back) back.href = "detail.html?id=" + encodeURIComponent(seriesId || itemId(series));

  const prev = document.getElementById("prevChapter");
  const next = document.getElementById("nextChapter");
  if(prev){
    prev.href = num > 1 ? readerUrl(seriesId, num - 1) : "#";
    prev.classList.toggle("disabled", num <= 1);
  }
  if(next){
    const max = Number(series.chapter_count || num);
    next.href = num < max ? readerUrl(seriesId, num + 1) : "#";
    next.classList.toggle("disabled", num >= max);
  }

  const listData = await apiFetch("/api/chapters/series/" + encodeURIComponent(seriesId) + "?limit=100&page=1");
  const select = document.getElementById("chapterSelect") || document.querySelector(".reader-nav select");
  if(select && listData && listData.items){
    select.innerHTML = listData.items.map(ch => `<option value="${safe(ch.number)}" ${Number(ch.number) === num ? "selected" : ""}>${safe(ch.title || ("Chapter " + ch.number))}</option>`).join("");
    select.onchange = function(){ window.location.href = readerUrl(seriesId, this.value); };
  }

  const pagesWrap = document.getElementById("readerPages") || document.querySelector(".reader-wrap");
  if(pagesWrap){
    const pages = Math.max(1, Number(chapter.pages || 0) || 7);
    pagesWrap.innerHTML = Array.from({length: Math.min(pages, 12)}, (_, i) => `<div class="reader-page">Page ${String(i + 1).padStart(2, "0")}</div>`).join("");
  }
}

async function renderFeatured(){
  var slider = document.getElementById("featuredSlider");
  if(!slider) return;
  var data = await apiFetch("/api/series/trending?limit=3");
  var items = data ? (Array.isArray(data) ? data : (data.items || data.results || [])) : [];
  if(!items.length){ return; }

  var bgColors = [
    "rgba(30,10,78,.82), rgba(12,74,110,.72) 55%, rgba(17,24,39,.88)",
    "rgba(26,15,60,.82), rgba(124,45,18,.72) 55%, rgba(17,24,39,.88)",
    "rgba(4,47,46,.82), rgba(30,58,95,.72) 55%, rgba(17,24,39,.88)"
  ];

  var slidesHtml = items.slice(0,3).map(function(item,i){
    var bg = bgColors[i] || bgColors[0];
    var cover = normalizeCover(item);
    var bgStyle = cover ? "background:linear-gradient(140deg," + bg + "),url(" + JSON.stringify(cover) + ") center top/cover no-repeat" : "background:linear-gradient(140deg," + bg + ")";
    var tc = badgeClass[item.type] || "";
    var statusBadge = item.status ? "<span class='badge clean'>" + safe(item.status) + "</span>" : "";
    var typeBadge = item.type ? "<span class='badge " + tc + "'>" + safe(item.type) + "</span>" : "";
    var desc = (item.description || item.synopsis || item.summary || "").slice(0, 150);
    if((item.description || item.synopsis || "").length > 150) desc += "...";
    return "<div class='featured-slide" + (i === 0 ? " active" : "") + "'>" +
      "<div class='featured-bg' style='" + bgStyle + "'></div>" +
      "<div class='featured-content'>" +
        "<div class='badges'>" + statusBadge + typeBadge + "</div>" +
        "<h2>" + safe(item.title) + "</h2>" +
        "<p>" + safe(desc) + "</p>" +
        "<a class='primary' href='" + detailUrl(item) + "'>View Details</a>" +
      "</div>" +
    "</div>";
  }).join("");
  var dotsHtml = items.slice(0,3).map(function(_,i){ return "<div class='slider-dot" + (i === 0 ? " active" : "") + "'></div>"; }).join("");
  slider.innerHTML = slidesHtml + "<div class='slider-dots'>" + dotsHtml + "</div>";

  var ns = slider.querySelectorAll(".featured-slide"), nd = slider.querySelectorAll(".slider-dot"), nc = 0;
  function go(n){ ns.forEach(function(s,i){ s.classList.toggle("active", i === n); }); nd.forEach(function(d,i){ d.classList.toggle("active", i === n); }); nc = n; }
  nd.forEach(function(dot,i){ dot.addEventListener("click", function(){ go(i); }); });
  if(ns.length > 1){ setInterval(function(){ go((nc + 1) % ns.length); }, 4500); }
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
      if(popular) popular.scrollIntoView({behavior: "smooth"});
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
    if(popular) popular.scrollIntoView({behavior: "smooth"});
  });
}

["browseSearch", "statusFilter", "sortFilter"].forEach(function(id){
  var el = document.getElementById(id);
  if(el) el.addEventListener("input", renderBrowse);
});

var clearFilters = document.getElementById("clearFilters");
if(clearFilters){
  clearFilters.addEventListener("click", function(){
    ["browseSearch", "typeFilter", "statusFilter"].forEach(function(id){
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
    document.querySelectorAll(".admin-section").forEach(function(s){ s.style.display = "none"; });
    var sec = document.getElementById(link.dataset.section);
    if(sec) sec.style.display = "";
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
renderReader();
