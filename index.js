
import { fetchJSON, renderProjects, fetchGitHubData } from './global.js';

// =====================================
// LAB 4: DISPLAY LATEST PROJECTS
// =====================================

// Fetch project data
const projects = await fetchJSON('./lib/projects.json');

// Get the first three projects
const latestProjects = Array.isArray(projects)
    ? projects.slice(0, 3)
    : [];

// Select the homepage projects container
const projectsContainer = document.querySelector('.projects');

// Display the latest projects
if (projectsContainer) {
    renderProjects(latestProjects, projectsContainer, 'h2');
}

// =====================================
// LAB 4: DISPLAY GITHUB STATISTICS
// =====================================

// Fetch GitHub profile data
const githubData = await fetchGitHubData('K-ols');

// Select the GitHub statistics container
const profileStats = document.querySelector('#profile-stats');

// Display the GitHub statistics
if (profileStats && githubData) {
    profileStats.innerHTML = `
        <dl>
            <dt>Public Repos:</dt>
            <dd>${githubData.public_repos}</dd>

            <dt>Public Gists:</dt>
            <dd>${githubData.public_gists}</dd>

            <dt>Followers:</dt>
            <dd>${githubData.followers}</dd>

            <dt>Following:</dt>
            <dd>${githubData.following}</dd>
        </dl>
    `;
}
