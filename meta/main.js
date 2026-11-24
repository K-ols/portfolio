
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import scrollama from 'https://cdn.jsdelivr.net/npm/scrollama@3.2.0/+esm';

let commits = [];
let filteredCommits = [];
let data = [];

let xScale;
let yScale;
let rScale;
let timeScale;

let commitProgress = 100;
let commitMaxTime;

let brush;

const colors = d3.scaleOrdinal(d3.schemeTableau10);

const width = 1000;
const height = 600;

const margin = {
  top: 30,
  right: 30,
  bottom: 50,
  left: 70
};

const usableArea = {
  left: margin.left,
  right: width - margin.right,
  top: margin.top,
  bottom: height - margin.bottom,
  width: width - margin.left - margin.right
};

// Load CSV data
async function loadData() {
  return await d3.csv('loc.csv', row => ({
    ...row,
    line: Number(row.line),
    depth: Number(row.depth),
    length: Number(row.length),
    date: new Date(row.date + 'T00:00' + row.timezone),
    datetime: new Date(row.datetime),
  }));
}

// Process commits
function processCommits(data) {
  return d3.groups(data, d => d.commit)
    .map(([id, lines]) => {
      const first = lines[0];
      const { author, date, time, timezone, datetime } = first;

      const commit = {
        id,
        url: `https://github.com/K-ols/portfolio/commit/${id}`,
        author,
        date,
        time,
        timezone,
        datetime,
        hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
        totalLines: lines.length,
      };

      Object.defineProperty(commit, 'lines', {
        value: lines,
        enumerable: false,
        configurable: true,
        writable: true,
      });

      return commit;
    })
    .sort((a, b) => a.datetime - b.datetime);
}

// Summary statistics
function renderCommitInfo(data, commits) {
  const files = d3.group(data, d => d.file);

  const fileLengths = d3.rollups(
    data,
    v => d3.max(v, d => d.line),
    d => d.file
  );

  const stats = [
    ['Total LOC', data.length],
    ['Total commits', commits.length],
    ['Total files', files.size],
    ['Average file length',
      Math.round(d3.mean(fileLengths, d => d[1]) || 0)],
    ['Average line length',
      Math.round(d3.mean(data, d => d.length) || 0)],
    ['Maximum depth', d3.max(data, d => d.depth) || 0],
  ];

  const dl = d3.select('#stats')
    .html('')
    .append('dl')
    .attr('class', 'stats');

  stats.forEach(([label, value]) => {
    dl.append('dt').text(label);
    dl.append('dd').text(value);
  });
}

// Tooltip
function renderTooltipContent(commit) {
  d3.select('#commit-link')
    .attr('href', commit.url)
    .text(commit.id.slice(0, 8));

  d3.select('#commit-date')
    .text(commit.datetime.toLocaleDateString());

  d3.select('#commit-time-tooltip')
    .text(commit.datetime.toLocaleTimeString());

  d3.select('#commit-author').text(commit.author);

  d3.select('#commit-lines').text(commit.totalLines);
}

function updateTooltipVisibility(visible) {
  document.querySelector('#commit-tooltip').hidden = !visible;
}

function updateTooltipPosition(event) {
  const tooltip = document.querySelector('#commit-tooltip');

  tooltip.style.left =
    `${Math.max(10, Math.min(event.clientX + 15, window.innerWidth - 250))}px`;

  tooltip.style.top =
    `${Math.max(10, event.clientY - 120)}px`;
}

// Brush selection
function isCommitSelected(selection, commit) {
  if (!selection) return false;

  const [[x0, y0], [x1, y1]] = selection;

  const x = xScale(commit.datetime);
  const y = yScale(commit.hourFrac);

  return x >= x0 && x <= x1 &&
         y >= y0 && y <= y1;
}

function renderSelectionCount(selection) {
  const selected = selection
    ? filteredCommits.filter(d => isCommitSelected(selection, d))
    : [];

  d3.select('#selection-count')
    .text(`${selected.length || 'No'} commits selected`);

  return selected;
}

function renderLanguageBreakdown(selection) {
  const selected = selection
    ? filteredCommits.filter(d => isCommitSelected(selection, d))
    : [];

  const container = d3.select('#language-breakdown');
  container.html('');

  if (!selected.length) return;

  const lines = selected.flatMap(d => d.lines);

  const breakdown = d3.rollup(
    lines,
    v => v.length,
    d => d.type
  );

  for (const [language, count] of breakdown) {
    container.append('dt').text(language);

    container.append('dd').text(
      `${count} lines (${d3.format('.1%')(count / lines.length)})`
    );
  }
}

// Create the scatterplot
function renderScatterPlot() {
  const svg = d3.select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');

  xScale = d3.scaleTime()
    .domain(d3.extent(commits, d => d.datetime))
    .range([usableArea.left, usableArea.right])
    .nice();

  yScale = d3.scaleLinear()
    .domain([0, 24])
    .range([usableArea.bottom, usableArea.top]);

  rScale = d3.scaleSqrt()
    .domain([0, d3.max(commits, d => d.totalLines)])
    .range([3, 22]);

  // Horizontal gridlines
  svg.append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${usableArea.left},0)`)
    .call(
      d3.axisLeft(yScale)
        .tickSize(-usableArea.width)
        .tickFormat('')
    );

  // X-axis
  svg.append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0,${usableArea.bottom})`)
    .call(d3.axisBottom(xScale).ticks(5));

  // Y-axis
  svg.append('g')
    .attr('class', 'y-axis')
    .attr('transform', `translate(${usableArea.left},0)`)
    .call(
      d3.axisLeft(yScale)
        .tickFormat(d => `${String(d % 24).padStart(2, '0')}:00`)
    );

  const dots = svg.append('g')
    .attr('class', 'dots');

  brush = d3.brush()
    .extent([
      [usableArea.left, usableArea.top],
      [usableArea.right, usableArea.bottom],
    ])
    .on('start brush end', event => {
      const selection = event.selection;

      dots.selectAll('circle')
        .classed('selected', d =>
          isCommitSelected(selection, d)
        );

      renderSelectionCount(selection);
      renderLanguageBreakdown(selection);
    });

  svg.append('g')
    .attr('class', 'brush')
    .call(brush);

  dots.raise();
}

// Update scatterplot without creating a new SVG
function updateScatterPlot(filteredCommits) {
  const svg = d3.select('#chart').select('svg');

  if (filteredCommits.length) {
    let [first, last] = d3.extent(
      filteredCommits,
      d => d.datetime
    );

    if (+first === +last) {
      first = new Date(+first - 3600000);
      last = new Date(+last + 3600000);
    }

    xScale.domain([first, last]).nice();

    svg.select('.x-axis')
      .call(d3.axisBottom(xScale).ticks(5));
  }

  svg.select('.brush').call(brush.move, null);

  const sortedCommits = d3.sort(
    filteredCommits,
    d => -d.totalLines
  );

  svg.select('g.dots')
    .selectAll('circle')
    .data(sortedCommits, d => d.id)
    .join('circle')
    .attr('cx', d => xScale(d.datetime))
    .attr('cy', d => yScale(d.hourFrac))
    .attr('r', d => rScale(d.totalLines))
    .attr('fill', 'steelblue')
    .style('fill-opacity', 0.7)
    .on('mouseenter', (event, commit) => {
      d3.select(event.currentTarget)
        .style('fill-opacity', 1);

      renderTooltipContent(commit);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on('mousemove', updateTooltipPosition)
    .on('mouseleave', event => {
      d3.select(event.currentTarget)
        .style('fill-opacity', 0.7);

      updateTooltipVisibility(false);
    });
}

// Unit visualization
function updateFileDisplay(filteredCommits) {
  const lines = filteredCommits.flatMap(d => d.lines);

  const files = d3.groups(lines, d => d.file)
    .map(([name, lines]) => ({ name, lines }))
    .sort((a, b) => b.lines.length - a.lines.length);

  const filesContainer = d3.select('#files')
    .selectAll('div.file-row')
    .data(files, d => d.name)
    .join(enter =>
      enter.append('div')
        .attr('class', 'file-row')
        .call(div => {
          const dt = div.append('dt');

          dt.append('code');
          dt.append('small');

          div.append('dd');
        })
    );

  filesContainer.select('dt > code')
    .text(d => d.name);

  filesContainer.select('dt > small')
    .text(d => `${d.lines.length} lines`);

  filesContainer.select('dd')
    .selectAll('div')
    .data(d => d.lines)
    .join('div')
    .attr('class', 'loc')
    .style('--color', d => colors(d.type))
    .attr('title', d => `${d.type}: line ${d.line}`);
}

// Update all visualizations
function updateVisualizations() {
  filteredCommits = commits.filter(
    d => d.datetime <= commitMaxTime
  );

  const filteredLines = filteredCommits.flatMap(d => d.lines);

  d3.select('#commit-time')
    .text(commitMaxTime.toLocaleString('en', {
      dateStyle: 'long',
      timeStyle: 'short',
    }));

  updateTooltipVisibility(false);
  updateScatterPlot(filteredCommits);
  renderCommitInfo(filteredLines, filteredCommits);
  updateFileDisplay(filteredCommits);
}

// Slider interaction
function onTimeSliderChange() {
  commitProgress = Number(
    document.querySelector('#commit-progress').value
  );

  commitMaxTime = timeScale.invert(commitProgress);

  updateVisualizations();
}

// Generate scrollytelling narrative
function renderScatterStory() {
  d3.select('#scatter-story')
    .selectAll('.step')
    .data(commits, d => d.id)
    .join('div')
    .attr('class', 'step')
    .html((d, i) => `
      <h3>Commit ${i + 1} of ${commits.length}</h3>

      <p>
        On ${d.datetime.toLocaleString('en', {
          dateStyle: 'long',
          timeStyle: 'short',
        })},
        I made ${i === 0 ? 'my first commit' : 'another commit'}
        to my portfolio.
      </p>

      <p>
        This commit contains
        <strong>${d.totalLines} lines</strong>
        across
        <strong>${new Set(d.lines.map(line => line.file)).size} files</strong>.
      </p>

      <p>
        <a href="${d.url}" target="_blank" rel="noopener">
          View commit on GitHub
        </a>
      </p>
    `);
}

// Scrollama interaction
function setupScrollytelling() {
  const scroller = scrollama();

  scroller.setup({
    container: '#scrolly-1',
    step: '#scrolly-1 .step',
    offset: 0.5,
  })
  .onStepEnter(response => {
    const commit = response.element.__data__;

    d3.selectAll('#scatter-story .step')
      .classed('active', false);

    d3.select(response.element)
      .classed('active', true);

    commitMaxTime = commit.datetime;
    commitProgress = timeScale(commitMaxTime);

    document.querySelector('#commit-progress').value =
      commitProgress;

    updateVisualizations();
  });

  window.addEventListener('resize', () => {
    scroller.resize();
  });
}

// Initialize page
async function main() {
  try {
    data = await loadData();

    if (!data.length) {
      document.querySelector('#chart').textContent =
        'No code data available.';
      return;
    }

    commits = processCommits(data);
    filteredCommits = commits;

    colors.domain([...new Set(data.map(d => d.type))]);

    timeScale = d3.scaleTime()
      .domain(d3.extent(commits, d => d.datetime))
      .range([0, 100]);

    commitMaxTime = timeScale.invert(commitProgress);

    renderScatterPlot();
    renderScatterStory();

    document.querySelector('#commit-progress')
      .addEventListener('input', onTimeSliderChange);

    onTimeSliderChange();

    setupScrollytelling();

  } catch (error) {
    console.error(error);

    document.querySelector('#chart').textContent =
      'Unable to load visualization: ' + error.message;
  }
}

main();
