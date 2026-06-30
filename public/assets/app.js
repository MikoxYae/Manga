
const series = [
  {title:"Solo Leveling", type:"Manhwa", chapter:"Chapter 201", rating:"9.6", genres:"Action, Fantasy", status:"Completed"},
  {title:"One Piece", type:"Manga", chapter:"Chapter 1124", rating:"9.8", genres:"Adventure, Comedy", status:"Ongoing"},
  {title:"Omniscient Reader", type:"Manhwa", chapter:"Chapter 220", rating:"9.4", genres:"Action, Fantasy", status:"Ongoing"},
  {title:"Magic Emperor", type:"Manhua", chapter:"Chapter 610", rating:"9.1", genres:"Martial Arts", status:"Ongoing"},
  {title:"Blue Lock", type:"Manga", chapter:"Chapter 278", rating:"9.0", genres:"Sports, Drama", status:"Ongoing"},
  {title:"The Beginning After The End", type:"Webtoon", chapter:"Chapter 189", rating:"9.3", genres:"Fantasy, Adventure", status:"Ongoing"},
  {title:"Tower of God", type:"Manhwa", chapter:"Chapter 642", rating:"9.2", genres:"Adventure", status:"Ongoing"},
  {title:"Spy x Family", type:"Manga", chapter:"Chapter 104", rating:"9.0", genres:"Comedy, Action", status:"Ongoing"},
  {title:"Eleceed", type:"Manhwa", chapter:"Chapter 312", rating:"9.1", genres:"Action, Comedy", status:"Ongoing"},
  {title:"Martial Peak", type:"Manhua", chapter:"Chapter 3780", rating:"8.7", genres:"Martial Arts", status:"Ongoing"},
  {title:"Jujutsu Kaisen", type:"Manga", chapter:"Chapter 271", rating:"9.5", genres:"Action, Supernatural", status:"Completed"},
  {title:"Return of the Mount Hua Sect", type:"Manhwa", chapter:"Chapter 132", rating:"9.2", genres:"Martial Arts", status:"Ongoing"},
  {title:"Chainsaw Man", type:"Manga", chapter:"Chapter 178", rating:"9.1", genres:"Action, Supernatural", status:"Ongoing"},
  {title:"Nano Machine", type:"Manhwa", chapter:"Chapter 226", rating:"9.0", genres:"Martial Arts, Action", status:"Ongoing"},
  {title:"Pick Me Up", type:"Manhwa", chapter:"Chapter 115", rating:"8.9", genres:"Fantasy, Action", status:"Ongoing"},
  {title:"Kingdom", type:"Manga", chapter:"Chapter 814", rating:"9.4", genres:"War, Historical", status:"Ongoing"}
];

function card(item){
  return `<a class="manga-card" href="detail.html" data-type="${item.type}" data-title="${item.title.toLowerCase()}" data-status="${item.status}">
    <div class="cover"><span>${item.title}</span></div>
    <div class="manga-body">
      <h3>${item.title}</h3>
      <p>${item.genres}</p>
      <div class="card-meta">
        <span class="badge">${item.type}</span>
        <span class="rating">${item.rating}</span>
      </div>
    </div>
  </a>`;
}
function feedRow(item){
  return `<a href="reader.html"><div><b>${item.title}</b><div class="sub">${item.type} · ${item.genres}</div></div><span>${item.chapter}</span></a>`;
}
function renderHome(filter="all", query=""){
  const grid = document.getElementById("mangaGrid");
  const feed = document.getElementById("chapterFeed");
  if(grid){
    const q = query.trim().toLowerCase();
    const items = series.filter(item => (filter==="all" || item.type===filter) && (!q || `${item.title} ${item.type} ${item.genres}`.toLowerCase().includes(q)));
    grid.innerHTML = items.slice(0,12).map(card).join("") || `<p class="sub">No series found.</p>`;
  }
  if(feed) feed.innerHTML = series.slice(0,10).map(feedRow).join("");
}
function renderBrowse(){
  const list = document.getElementById("browseGrid");
  if(!list) return;
  const q = (document.getElementById("browseSearch")?.value || "").toLowerCase();
  const type = document.getElementById("typeFilter")?.value || "all";
  const status = document.getElementById("statusFilter")?.value || "all";
  const items = series.filter(item => {
    const searchOk = !q || `${item.title} ${item.type} ${item.genres}`.toLowerCase().includes(q);
    const typeOk = type==="all" || item.type===type;
    const statusOk = status==="all" || item.status===status;
    return searchOk && typeOk && statusOk;
  });
  list.innerHTML = items.map(card).join("") || `<p class="sub">No series found.</p>`;
}
document.querySelectorAll("#typeTabs button").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("#typeTabs button").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    renderHome(btn.dataset.filter, document.getElementById("searchInput")?.value || "");
  });
});
document.getElementById("searchForm")?.addEventListener("submit", e => {
  e.preventDefault();
  const active = document.querySelector("#typeTabs button.active")?.dataset.filter || "all";
  renderHome(active, document.getElementById("searchInput").value);
  document.getElementById("popular")?.scrollIntoView({behavior:"smooth"});
});
["browseSearch","typeFilter","statusFilter"].forEach(id => document.getElementById(id)?.addEventListener("input", renderBrowse));
document.getElementById("clearFilters")?.addEventListener("click", () => {
  document.getElementById("browseSearch").value="";
  document.getElementById("typeFilter").value="all";
  document.getElementById("statusFilter").value="all";
  renderBrowse();
});
document.getElementById("menuBtn")?.addEventListener("click", () => document.querySelector(".nav")?.classList.toggle("open"));
document.getElementById("themeToggle")?.addEventListener("click", () => {
  document.body.classList.toggle("light-reader");
  document.getElementById("themeToggle").textContent = document.body.classList.contains("light-reader") ? "Dark Mode" : "Light Mode";
});
document.getElementById("compactBtn")?.addEventListener("click", () => {
  document.querySelectorAll(".reader-page").forEach(p => p.style.minHeight = p.style.minHeight === "520px" ? "760px" : "520px");
});
document.getElementById("wideBtn")?.addEventListener("click", () => {
  const wrap = document.querySelector(".reader-wrap");
  wrap.style.width = wrap.style.width === "min(1080px, 96vw)" ? "min(860px,94vw)" : "min(1080px, 96vw)";
});
renderHome();
renderBrowse();
