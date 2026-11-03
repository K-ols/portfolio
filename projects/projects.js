
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

import { fetchJSON, renderProjects } from '../global.js';

// =====================================
// LAB 4: FETCH AND DISPLAY PROJECTS
// =====================================

const projects = await fetchJSON('../lib/projects.json') || [];

const projectsContainer = document.querySelector('.projects');
const projectsTitle = document.querySelector('.projects-title');

const svg = d3.select('#projects-pie-plot');
const legend = d3.select('.legend');
const searchInput = document.querySelector('.searchBar');

// =====================================
// LAB 5: SEARCH AND SELECTION STATE
// =====================================

let query = '';
let selectedYear = null;

// Colors remain consistent for each year
const years = [...new Set(projects.map(d => String(d.year)))].sort();

const colors = d3.scaleOrdinal()
    .domain(years)
    .range(d3.schemeTableau10);

// =====================================
// LAB 5: PIE CHART GENERATORS
// =====================================

const arcGenerator = d3.arc()
    .innerRadius(0)
    .outerRadius(50);

const sliceGenerator = d3.pie()
    .value(d => d.value)
    .sort(null);

// =====================================
// STEP 4.3: SEARCH PROJECT METADATA
// =====================================

function getSearchResults() {
    return projects.filter(project => {
        const values = Object.values(project)
            .join('\n')
            .toLowerCase();

        return values.includes(query.toLowerCase());
    });
}

// =====================================
// STEP 4.4: RENDER REACTIVE PIE CHART
// =====================================

function renderPieChart(visibleProjects) {

    // Group projects by year
    const rolledData = d3.rollups(
        visibleProjects,
        v => v.length,
        d => String(d.year)
    );

    const data = rolledData.map(([year, count]) => ({
        value: count,
        label: year
    })).sort((a, b) => a.label.localeCompare(b.label));

    // Generate pie slices
    const arcData = sliceGenerator(data);

    // Clear previous chart and legend
    svg.selectAll('*').remove();
    legend.selectAll('*').remove();

    // Create each pie slice
    arcData.forEach(slice => {

        const year = slice.data.label;

        svg.append('path')
            .attr('d', arcGenerator(slice))
            .attr('fill', colors(year))
            .attr('class', selectedYear === year ? 'selected' : '')
            .attr('tabindex', 0)
            .attr('role', 'button')
            .attr('aria-label', `Filter projects from ${year}`)
            .on('click', () => selectYear(year))
            .on('keydown', event => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    selectYear(year);
                }
            });
    });

    // Create legend entries
    data.forEach(d => {

        const year = d.label;

        legend.append('li')
            .attr('class',
                `legend-item ${selectedYear === year ? 'selected' : ''}`
            )
            .attr('style', `--color: ${colors(year)}`)
            .attr('tabindex', 0)
            .attr('role', 'button')
            .attr('aria-label', `Filter projects from ${year}`)
            .html(`
                <span class="swatch"></span>
                ${year} <em>(${d.value})</em>
            `)
            .on('click', () => selectYear(year))
            .on('keydown', event => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    selectYear(year);
                }
            });
    });
}

// =====================================
// STEP 5: FILTER PROJECTS BY YEAR
// =====================================

function selectYear(year) {

    // Clicking the same year deselects it
    selectedYear = selectedYear === year ? null : year;

    updateVisualization();
}

// =====================================
// EXTRA CREDIT: COMBINE BOTH FILTERS
// =====================================

function updateVisualization() {

    // First apply the search query
    const searchResults = getSearchResults();

    // Then apply the selected year
    const visibleProjects = selectedYear === null
        ? searchResults
        : searchResults.filter(
            project => String(project.year) === selectedYear
        );

    // Update project cards
    renderProjects(visibleProjects, projectsContainer, 'h2');

    // Update chart using SEARCH results
    // This preserves the full set of years while selecting a slice
    renderPieChart(searchResults);

    // Update heading
    if (projectsTitle) {
        projectsTitle.textContent = `${visibleProjects.length} Projects`;
    }
}

// =====================================
// STEP 4: SEARCH EVENT LISTENER
// =====================================

searchInput.addEventListener('input', event => {

    query = event.target.value;

    // Reset selection if the selected year
    // no longer appears in search results
    const results = getSearchResults();

    if (
        selectedYear !== null &&
        !results.some(d => String(d.year) === selectedYear)
    ) {
        selectedYear = null;
    }

    updateVisualization();
});

// =====================================
// INITIAL PAGE LOAD
// =====================================

// Display all projects and draw chart
updateVisualization();
