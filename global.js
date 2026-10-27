console.log("IT'S ALIVE!");

function $$(selector, context = document) {
    return Array.from(context.querySelectorAll(selector));
}
let navLinks = $$("nav a");

let currentLink = navLinks.find(
    (a) => a.host === location.host && a.pathname === location.pathname
);

currentLink?.classList.add("current");

console.log("IT'S ALIVE!");

function $$(selector, context = document) {
    return Array.from(context.querySelectorAll(selector));
}

// Determine the base path for local development or GitHub Pages
const BASE_PATH =
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1"
        ? "/"
        : "/website/";

// All website pages
let pages = [
    { url: "", title: "Home" },
    { url: "projects/", title: "Projects" },
    { url: "contact/", title: "Contact" },
    { url: "https://github.com/K-ols", title: "GitHub" },
    { url: "resume/", title: "Resume" }
];

// Create the navigation menu
let nav = document.createElement("nav");
document.body.prepend(nav);

// Create each navigation link
for (let p of pages) {
    let url = p.url;
    let title = p.title;

    if (!url.startsWith("http")) {
        url = BASE_PATH + url;
    }

    let a = document.createElement("a");
    a.href = url;
    a.textContent = title;

    // Highlight the current page
    if (a.host === location.host && a.pathname === location.pathname) {
        a.classList.add("current");
    }

    // Open external links in a new tab
    if (a.host !== location.host) {
        a.target = "_blank";
        a.rel = "noopener noreferrer";
    }

    nav.append(a);
}
