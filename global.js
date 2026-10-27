
console.log("IT'S ALIVE!");

// Helper function to select multiple elements
function $$(selector, context = document) {
    return Array.from(context.querySelectorAll(selector));
}

// Set the base path for GitHub Pages
const BASE_PATH =
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1"
        ? "/"
        : "/portfolio/";

// Define all website pages
let pages = [
    { url: "", title: "Home" },
    { url: "projects/", title: "Projects" },
    { url: "contact/", title: "Contact" },
    { url: "https://github.com/K-ols", title: "GitHub" },
    { url: "resume/", title: "Resume" }
];

// Create navigation menu
let nav = document.createElement("nav");
document.body.prepend(nav);

// Add navigation links
for (let p of pages) {
    let url = p.url;
    let title = p.title;

    // Adjust internal links for GitHub Pages
    if (!url.startsWith("http")) {
        url = BASE_PATH + url;
    }

    // Create link
    let a = document.createElement("a");
    a.href = url;
    a.textContent = title;

    // Highlight current page
    if (
        a.host === location.host &&
        a.pathname === location.pathname
    ) {
        a.classList.add("current");
    }

    // Open external links in a new tab
    if (a.host !== location.host) {
        a.target = "_blank";
        a.rel = "noopener noreferrer";
    }

    // Add link to navigation menu
    nav.append(a);
}
