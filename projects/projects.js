
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
// LAB 5: STEP 1.4 - STATIC PIE CHART
// =====================================

// Sample data for our pie chart
let data = [1, 2];

// Create an arc generator
let arcGenerator = d3.arc()
    .innerRadius(0)
    .outerRadius(50);

// Calculate the total of our data
let total = 0;

for (let d of data) {
    total += d;
}

// Calculate the start and end angles for each slice
let angle = 0;
let arcData = [];

for (let d of data) {

    let endAngle = angle + (d / total) * 2 * Math.PI;

    arcData.push({
        startAngle: angle,
        endAngle: endAngle
    });

    angle = endAngle;
}

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
