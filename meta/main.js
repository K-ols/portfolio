
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

let commits = [];
let xScale;
let yScale;

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

function processCommits(data) {
  return d3.groups(data, d => d.commit).map(([id, lines]) => {
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
  });
}

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
    ['Average file length', Math.round(d3.mean(fileLengths, d => d[1]) || 0)],
    ['Average line length', Math.round(d3.mean(data, d => d.length) || 0)],
    ['Maximum depth', d3.max(data, d => d.depth) || 0],
  ];

  const dl = d3.select('#stats')
    .append('dl')
    .attr('class', 'stats');

  stats.forEach(([label, value]) => {
    dl.append('dt').text(label);
    dl.append('dd').text(value);
  });
}

function renderTooltipContent(commit) {
  document.querySelector('#commit-link').href = commit.url;
  document.querySelector('#commit-link').textContent = commit.id.slice(0, 8);

  document.querySelector('#commit-date').textContent =
    commit.datetime.toLocaleDateString();

  document.querySelector('#commit-time').textContent =
    commit.datetime.toLocaleTimeString();

  document.querySelector('#commit-author').textContent = commit.author;
  document.querySelector('#commit-lines').textContent = commit.totalLines;
}

function updateTooltipVisibility(visible) {
  document.querySelector('#commit-tooltip').hidden = !visible;
}

function updateTooltipPosition(event) {
  const tooltip = document.querySelector('#commit-tooltip');
  tooltip.style.left = `${Math.min(event.clientX + 15, window.innerWidth - 250)}px`;
  tooltip.style.top = `${Math.max(10, event.clientY - 120)}px`;
}

function isCommitSelected(selection, commit) {
  if (!selection) return false;

  const [[x0, y0], [x1, y1]] = selection;
  const x = xScale(commit.datetime);
  const y = yScale(commit.hourFrac);

  return x >= x0 && x <= x1 && y >= y0 && y <= y1;
}

function renderSelectionCount(selection) {
  const selected = selection
    ? commits.filter(d => isCommitSelected(selection, d))
    : [];

  document.querySelector('#selection-count').textContent =
    `${selected.length || 'No'} commits selected`;

  return selected;
}

function renderLanguageBreakdown(selection) {
  const selected = selection
    ? commits.filter(d => isCommitSelected(selection, d))
    : [];

  const container = d3.select('#language-breakdown');
  container.html('');

  if (!selected.length) return;

  const lines = selected.flatMap(d => d.lines);
  const breakdown = d3.rollup(lines, v => v.length, d => d.type);

  for (const [language, count] of breakdown) {
    container.append('dt').text(language);
    container.append('dd').text(
      `${count} lines (${d3.format('.1%')(count / lines.length)})`
    );
  }
}

function renderScatterPlot(data, commits) {
  const width = 1000;
  const height = 600;
  const margin = { top: 30, right: 30, bottom: 50, left: 70 };

  const usableArea = {
    left: margin.left,
    right: width - margin.right,
    top: margin.top,
    bottom: height - margin.bottom,
    width: width - margin.left - margin.right,
  };

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

  const [minLines, maxLines] = d3.extent(commits, d => d.totalLines);

  const rScale = d3.scaleSqrt()
    .domain([minLines, maxLines])
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

  // Axes
  svg.append('g')
    .attr('transform', `translate(0,${usableArea.bottom})`)
    .call(d3.axisBottom(xScale));

  svg.append('g')
    .attr('transform', `translate(${usableArea.left},0)`)
    .call(
      d3.axisLeft(yScale)
        .tickFormat(d => `${String(d % 24).padStart(2, '0')}:00`)
    );

  const dots = svg.append('g').attr('class', 'dots');

  const sortedCommits = d3.sort(commits, d => -d.totalLines);

  dots.selectAll('circle')
    .data(sortedCommits)
    .join('circle')
    .attr('cx', d => xScale(d.datetime))
    .attr('cy', d => yScale(d.hourFrac))
    .attr('r', d => rScale(d.totalLines))
    .attr('fill', 'steelblue')
    .style('fill-opacity', 0.7)
    .on('mouseenter', (event, commit) => {
      d3.select(event.currentTarget).style('fill-opacity', 1);
      renderTooltipContent(commit);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on('mousemove', event => updateTooltipPosition(event))
    .on('mouseleave', event => {
      d3.select(event.currentTarget).style('fill-opacity', 0.7);
      updateTooltipVisibility(false);
    });

  const brush = d3.brush()
    .extent([
      [usableArea.left, usableArea.top],
      [usableArea.right, usableArea.bottom],
    ])
    .on('start brush end', event => {
      const selection = event.selection;

      dots.selectAll('circle')
        .classed('selected', d => isCommitSelected(selection, d));

      renderSelectionCount(selection);
      renderLanguageBreakdown(selection);
    });

  svg.append('g')
    .attr('class', 'brush')
    .call(brush);

  // Keep dots above the brush overlay for hover tooltips.
  // Brushing starts in empty chart space.
  dots.raise();
}

async function main() {
  try {
    const data = await loadData();

    if (!data.length) {
      document.querySelector('#chart').textContent = 'No code data available.';
      return;
    }

    commits = processCommits(data);

    renderCommitInfo(data, commits);
    renderScatterPlot(data, commits);
  } catch (error) {
    console.error(error);
    document.querySelector('#chart').textContent =
      'Unable to load loc.csv. Please generate the CSV first.';
  }
}

main();
