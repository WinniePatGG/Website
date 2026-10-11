// ---- Config ----
const GITHUB_USER = "WinniePatGG";
const GITHUB_REPO = "WinniePatGG";
const GITHUB_BRANCH = "main";
const README_PATH = "README.md";
const AUTO_REFRESH_MS = 5 * 60 * 1000;

const README_URL = `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/refs/heads/${GITHUB_BRANCH}/${README_PATH}`;
const RAW_FILE_BASE = `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/refs/heads/${GITHUB_BRANCH}/`;
const BLOB_BASE = `https://github.com/${GITHUB_USER}/${GITHUB_REPO}/blob/${GITHUB_BRANCH}/`;

const statusEl = document.getElementById("status");
const bannerEl = document.getElementById("banner");
const skeletonEl = document.getElementById("skeleton");
const readmeEl = document.getElementById("readme");
const refreshBtn = document.getElementById("refresh");

function absoluteUrl(url) {
  if (!url) return url;
  if (/^(https?:)?\/\//i.test(url) || url.startsWith("data:") || url.startsWith("#") || url.startsWith("mailto:")) {
    return url;
  }
  return RAW_FILE_BASE + url.replace(/^\.?\//, "");
}

function rewriteLinks(html) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll("img[src]").forEach((img) => {
    img.setAttribute("src", absoluteUrl(img.getAttribute("src")));
  });
  doc.querySelectorAll("a[href]").forEach((a) => {
    let href = a.getAttribute("href");
    if (href && !/^(https?:)?\/\//i.test(href) && !href.startsWith("#") && !href.startsWith("mailto:")) {
      href = href.replace(/^\.?\//, "").replace(/\.md(#.*)?$/i, "");
      a.setAttribute("href", BLOB_BASE + href);
      a.setAttribute("target", "_blank");
      a.setAttribute("rel", "noopener noreferrer");
    }
  });
  return doc.body.innerHTML;
}

async function loadReadme() {
  refreshBtn.disabled = true;
  try {
    const res = await fetch(README_URL + "?t=" + Date.now(), { cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const md = await res.text();
    readmeEl.innerHTML = rewriteLinks(marked.parse(md));
    readmeEl.hidden = false;
    skeletonEl.hidden = true;
    bannerEl.style.display = "none";
    statusEl.textContent = "Updated " + new Date().toLocaleTimeString();
  } catch (err) {
    bannerEl.textContent = "Could not load README: " + err.message;
    bannerEl.style.display = "block";
    statusEl.textContent = "Load failed";
    if (!readmeEl.innerHTML) skeletonEl.textContent = "No content loaded.";
  } finally {
    refreshBtn.disabled = false;
  }
}

const themeBtn = document.getElementById("theme");
const saved = localStorage.getItem("theme");
if (saved) {
  document.documentElement.dataset.theme = saved;
} else if (window.matchMedia && !window.matchMedia("(prefers-color-scheme: dark)").matches) {
  document.documentElement.dataset.theme = "light";
}
themeBtn.addEventListener("click", () => {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  localStorage.setItem("theme", next);
});

refreshBtn.addEventListener("click", loadReadme);
setInterval(loadReadme, AUTO_REFRESH_MS);
loadReadme();
