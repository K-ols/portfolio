
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

import { fetchJSON, renderProjects } from '../global.js';

// Fetch project data from JSON file
const projects = await fetchJSON('../lib/projects.json');

// Select the projects container
const projectsContainer = document.querySelector('.projects');

// Display the projects
renderProjects(projects, projectsContainer, 'h2');

// Select the projects title
const projectsTitle = document.querySelector('.projects-title');

// Update the title with the total number of projects
if (projectsTitle && Array.isArray(projects)) {
    projectsTitle.textContent = `${projects.length} Projects`;
}

// Create an arc generator
let arcGenerator = d3.arc()
    .innerRadius(0)
    .outerRadius(50);

// Generate a full circle (2π radians)
let arc = arcGenerator({
    startAngle: 0,
    endAngle: 2 * Math.PI
});

// Draw the circle inside our SVG
d3.select('#projects-pie-plot')
    .append('path')
    .attr('d', arc)
    .attr('fill', 'oklch(65% 50% 270)');
