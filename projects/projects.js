
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

import { fetchJSON, renderProjects } from '../global.js';

// =====================================
// LAB 4: FETCH AND DISPLAY PROJECTS
// =====================================

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

// =====================================
// LAB 5: STEP 1.4 - PIE CHART USING D3
// =====================================

// Sample data for our pie chart
let data = [1, 2];

// Create an arc generator
let arcGenerator = d3.arc()
    .innerRadius(0)
    .outerRadius(50);

// Create a pie slice generator
let sliceGenerator = d3.pie();

// Automatically calculate the angles for each slice
let arcData = sliceGenerator(data);

// Generate SVG paths for each slice
let arcs = arcData.map((d) => arcGenerator(d));

// Define colors for each slice
// Using purple tones to match the portfolio
let colors = [
    'oklch(65% 50% 270)',
    'oklch(80% 25% 300)'
];

// Select the pie chart SVG
let svg = d3.select('#projects-pie-plot');

// Draw each slice of the pie chart
arcs.forEach((arc, idx) => {

    svg.append('path')
        .attr('d', arc)
        .attr('fill', colors[idx]);

});
