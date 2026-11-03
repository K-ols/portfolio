
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
// LAB 5: STEP 3 - ACTUAL PROJECT DATA
// =====================================

// Group projects by year and count them
let rolledData = d3.rollups(
    projects,
    (v) => v.length,
    (d) => d.year
);

// Convert grouped data into pie chart format
let data = rolledData.map(([year, count]) => {
    return {
        value: count,
        label: year
    };
});

// Create an arc generator
let arcGenerator = d3.arc()
    .innerRadius(0)
    .outerRadius(50);

// Create a pie slice generator
let sliceGenerator = d3.pie()
    .value((d) => d.value);

// Automatically calculate the angles for each slice
let arcData = sliceGenerator(data);

// Generate SVG paths for each slice
let arcs = arcData.map((d) => arcGenerator(d));

// Define colors for each slice
// Using purple tones to match the portfolio
let colors = d3.scaleOrdinal(d3.schemeTableau10);

// Select the pie chart SVG
let svg = d3.select('#projects-pie-plot');

// Draw each slice of the pie chart
arcs.forEach((arc, idx) => {

    svg.append('path')
        .attr('d', arc)
        .attr('fill', colors(idx));

});

// =====================================
// LAB 5: STEP 2.2 - PIE CHART LEGEND
// =====================================

// Select the legend container
let legend = d3.select('.legend');

// Create a legend item for each category
data.forEach((d, idx) => {

    legend.append('li')
        .attr('class', 'legend-item')
        .attr('style', `--color: ${colors(idx)}`)
        .html(`
            <span class="swatch"></span>
            ${d.label} <em>(${d.value})</em>
        `);

});
