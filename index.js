
import { fetchJSON, renderProjects } from './global.js';

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
