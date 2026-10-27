
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
// =====================================
// STEP 4: DARK MODE
// =====================================

// Create theme selector
document.body.insertAdjacentHTML(
    "afterbegin",
    `
    <label class="color-scheme">
        Theme:
        <select>
            <option value="light dark">Automatic</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
        </select>
    </label>
    `
);

// Get the theme dropdown
let select = document.querySelector(".color-scheme select");

// Function to apply the selected theme
function setColorScheme(colorScheme) {
    document.documentElement.style.setProperty(
        "color-scheme",
        colorScheme
    );
}

// Change theme when the user selects an option
select.addEventListener("input", function (event) {
    let colorScheme = event.target.value;

    // Apply the selected theme
    setColorScheme(colorScheme);

    // Save preference
    localStorage.colorScheme = colorScheme;
});

// Restore the saved theme when the page loads
if ("colorScheme" in localStorage) {
    let savedColorScheme = localStorage.colorScheme;

    setColorScheme(savedColorScheme);
    select.value = savedColorScheme;
}


export async function fetchJSON(url) {
    try {
        // Fetch the JSON file
        const response = await fetch(url);

        // Check if the request was successful
        if (!response.ok) {
            throw new Error(`Failed to fetch projects: ${response.statusText}`);
        }

        // Convert the response into JSON
        const data = await response.json();

        return data;

    } catch (error) {
        console.error('Error fetching or parsing JSON data:', error);
        return null;
    }
}


export function renderProjects(projects, containerElement, headingLevel = 'h2') {

    // Check that the container exists
    if (!containerElement) {
        console.error('Projects container not found');
        return;
    }

    // Clear existing content
    containerElement.innerHTML = '';

    // Handle an empty or missing project list
    if (!Array.isArray(projects) || projects.length === 0) {
        containerElement.textContent = 'No projects available.';
        return;
    }

    // Create a card for each project
    for (let project of projects) {

        // Create an article element
        const article = document.createElement('article');

        // Add project details
        article.innerHTML = `
            <${headingLevel}>${project.title}</${headingLevel}>
            <img src="${project.image}" alt="${project.title}">
            <p>${project.description}</p>
        `;

        // Add the article to the container
        containerElement.appendChild(article);
    }
}
