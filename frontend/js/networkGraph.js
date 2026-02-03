/**
 * NetworkGraph - D3.js force-directed graph for agent visualization
 *
 * Shows agents as nodes and communications as edges,
 * with animated pulses traveling along edges during messages.
 */

export class NetworkGraph {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.svg = d3.select('#network-svg');
    this.width = 0;
    this.height = 0;
    this.nodes = [];
    this.links = [];
    this.nodeMap = new Map();
    this.linkMap = new Map();
    this.simulation = null;
    this.onNodeClick = options.onNodeClick || (() => {});
    this.onNodeHover = options.onNodeHover || (() => {});

    this.init();
    this.setupResizeObserver();
  }

  init() {
    // Get dimensions
    const rect = this.container.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;

    // Setup SVG
    this.svg
      .attr('viewBox', `0 0 ${this.width} ${this.height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    // Create layers
    this.linksGroup = this.svg.append('g').attr('class', 'links');
    this.nodesGroup = this.svg.append('g').attr('class', 'nodes');
    this.pulsesGroup = this.svg.append('g').attr('class', 'pulses');

    // Create simulation
    this.simulation = d3.forceSimulation()
      .force('link', d3.forceLink().id(d => d.id).distance(120))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(this.width / 2, this.height / 2))
      .force('collision', d3.forceCollide().radius(50))
      .on('tick', () => this.tick());

    // Add gradient definitions
    this.addGradients();
  }

  addGradients() {
    const defs = this.svg.append('defs');

    // Category gradients
    const categories = {
      query: ['#00d9ff', '#0077b6'],
      response: ['#00ff41', '#00b030'],
      error: ['#ff006e', '#c0003c'],
      action: ['#ffcc00', '#cc9900'],
      payment: ['#9d4edd', '#7b2cbf']
    };

    Object.entries(categories).forEach(([name, [c1, c2]]) => {
      const gradient = defs.append('radialGradient')
        .attr('id', `gradient-${name}`)
        .attr('cx', '30%')
        .attr('cy', '30%');

      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', c1);

      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', c2);
    });

    // Glow filter
    const filter = defs.append('filter')
      .attr('id', 'glow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');

    filter.append('feGaussianBlur')
      .attr('stdDeviation', '3')
      .attr('result', 'coloredBlur');

    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');
  }

  setupResizeObserver() {
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        this.width = entry.contentRect.width;
        this.height = entry.contentRect.height;
        this.svg.attr('viewBox', `0 0 ${this.width} ${this.height}`);
        this.simulation.force('center', d3.forceCenter(this.width / 2, this.height / 2));
        this.simulation.alpha(0.3).restart();
      }
    });
    resizeObserver.observe(this.container);
  }

  /**
   * Add or update an agent node
   */
  addAgent(agentId) {
    if (this.nodeMap.has(agentId)) {
      // Increase message count
      const node = this.nodeMap.get(agentId);
      node.messageCount++;
      this.updateNodes();
      return node;
    }

    // Create new node
    const node = {
      id: agentId,
      messageCount: 1,
      x: this.width / 2 + (Math.random() - 0.5) * 100,
      y: this.height / 2 + (Math.random() - 0.5) * 100
    };

    this.nodes.push(node);
    this.nodeMap.set(agentId, node);
    this.updateNodes();
    this.restartSimulation();

    return node;
  }

  /**
   * Add a communication link between agents
   */
  addLink(fromId, toId, category) {
    // Ensure both agents exist
    this.addAgent(fromId);
    this.addAgent(toId);

    const linkId = `${fromId}-${toId}`;
    const reverseLinkId = `${toId}-${fromId}`;

    // Check if link exists
    let link = this.linkMap.get(linkId) || this.linkMap.get(reverseLinkId);

    if (link) {
      link.messageCount++;
      link.lastCategory = category;
      this.updateLinks();
    } else {
      // Create new link
      link = {
        id: linkId,
        source: fromId,
        target: toId,
        messageCount: 1,
        lastCategory: category
      };
      this.links.push(link);
      this.linkMap.set(linkId, link);
      this.updateLinks();
      this.restartSimulation();
    }

    // Animate pulse
    this.animatePulse(fromId, toId, category);

    return link;
  }

  /**
   * Update node elements
   */
  updateNodes() {
    const categoryColors = {
      query: '#00d9ff',
      response: '#00ff41',
      error: '#ff006e',
      action: '#ffcc00',
      payment: '#9d4edd'
    };

    // Bind data
    const nodeElements = this.nodesGroup
      .selectAll('.network-node')
      .data(this.nodes, d => d.id);

    // Remove old nodes
    nodeElements.exit().remove();

    // Add new nodes
    const nodeEnter = nodeElements.enter()
      .append('g')
      .attr('class', 'network-node')
      .call(d3.drag()
        .on('start', (event, d) => this.dragStart(event, d))
        .on('drag', (event, d) => this.dragging(event, d))
        .on('end', (event, d) => this.dragEnd(event, d)))
      .on('click', (event, d) => this.onNodeClick(d))
      .on('mouseenter', (event, d) => this.onNodeHover(d, true))
      .on('mouseleave', (event, d) => this.onNodeHover(d, false));

    // Node circle
    nodeEnter.append('circle')
      .attr('class', 'network-node__circle')
      .attr('r', 20)
      .attr('fill', 'url(#gradient-query)')
      .attr('stroke', categoryColors.query)
      .attr('filter', 'url(#glow)');

    // Node label
    nodeEnter.append('text')
      .attr('class', 'network-node__label')
      .attr('dy', 35)
      .text(d => d.id);

    // Message count badge
    nodeEnter.append('circle')
      .attr('class', 'network-node__badge')
      .attr('r', 8)
      .attr('cx', 14)
      .attr('cy', -14)
      .attr('fill', '#1a2454')
      .attr('stroke', '#00d9ff');

    nodeEnter.append('text')
      .attr('class', 'network-node__count')
      .attr('x', 14)
      .attr('y', -11)
      .attr('text-anchor', 'middle')
      .attr('font-size', '8px')
      .attr('fill', '#00d9ff')
      .text(d => d.messageCount);

    // Update existing nodes
    this.nodesGroup.selectAll('.network-node__count')
      .text(d => d.messageCount);

    // Update circle sizes based on message count
    this.nodesGroup.selectAll('.network-node__circle')
      .attr('r', d => 20 + Math.min(d.messageCount * 2, 20));
  }

  /**
   * Update link elements
   */
  updateLinks() {
    const categoryColors = {
      query: '#00d9ff',
      response: '#00ff41',
      error: '#ff006e',
      action: '#ffcc00',
      payment: '#9d4edd'
    };

    // Bind data
    const linkElements = this.linksGroup
      .selectAll('.network-link')
      .data(this.links, d => d.id);

    // Remove old links
    linkElements.exit().remove();

    // Add new links
    linkElements.enter()
      .append('line')
      .attr('class', 'network-link')
      .attr('stroke', d => categoryColors[d.lastCategory] || categoryColors.query)
      .attr('stroke-width', d => 1 + Math.min(d.messageCount * 0.5, 4))
      .attr('stroke-opacity', 0.4);

    // Update existing links
    this.linksGroup.selectAll('.network-link')
      .attr('stroke', d => categoryColors[d.lastCategory] || categoryColors.query)
      .attr('stroke-width', d => 1 + Math.min(d.messageCount * 0.5, 4));
  }

  /**
   * Animate a pulse traveling along a link
   */
  animatePulse(fromId, toId, category) {
    const sourceNode = this.nodeMap.get(fromId);
    const targetNode = this.nodeMap.get(toId);

    if (!sourceNode || !targetNode) return;

    const categoryColors = {
      query: '#00d9ff',
      response: '#00ff41',
      error: '#ff006e',
      action: '#ffcc00',
      payment: '#9d4edd'
    };

    const color = categoryColors[category] || categoryColors.query;

    // Create pulse circle
    const pulse = this.pulsesGroup.append('circle')
      .attr('class', 'network-pulse')
      .attr('r', 6)
      .attr('fill', color)
      .attr('cx', sourceNode.x)
      .attr('cy', sourceNode.y)
      .attr('filter', 'url(#glow)');

    // Animate along path
    pulse.transition()
      .duration(600)
      .ease(d3.easeQuadOut)
      .attr('cx', targetNode.x)
      .attr('cy', targetNode.y)
      .attr('r', 3)
      .attr('opacity', 0)
      .remove();

    // Highlight link briefly
    this.linksGroup.selectAll('.network-link')
      .filter(d => (d.source.id === fromId && d.target.id === toId) ||
                   (d.source.id === toId && d.target.id === fromId))
      .classed('network-link--active', true)
      .attr('stroke-opacity', 1);

    setTimeout(() => {
      this.linksGroup.selectAll('.network-link--active')
        .classed('network-link--active', false)
        .attr('stroke-opacity', 0.4);
    }, 500);
  }

  /**
   * Simulation tick - update positions
   */
  tick() {
    this.linksGroup.selectAll('.network-link')
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y);

    this.nodesGroup.selectAll('.network-node')
      .attr('transform', d => `translate(${d.x}, ${d.y})`);
  }

  /**
   * Restart simulation with updated data
   */
  restartSimulation() {
    this.simulation.nodes(this.nodes);
    this.simulation.force('link').links(this.links);
    this.simulation.alpha(0.5).restart();
  }

  /**
   * Drag handlers
   */
  dragStart(event, d) {
    if (!event.active) this.simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  dragging(event, d) {
    d.fx = event.x;
    d.fy = event.y;
  }

  dragEnd(event, d) {
    if (!event.active) this.simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }

  /**
   * Get stats about the network
   */
  getStats() {
    return {
      agents: this.nodes.length,
      connections: this.links.length,
      totalMessages: this.nodes.reduce((sum, n) => sum + n.messageCount, 0)
    };
  }

  /**
   * Clear the graph
   */
  clear() {
    this.nodes = [];
    this.links = [];
    this.nodeMap.clear();
    this.linkMap.clear();
    this.linksGroup.selectAll('*').remove();
    this.nodesGroup.selectAll('*').remove();
    this.pulsesGroup.selectAll('*').remove();
    this.simulation.nodes([]);
    this.simulation.force('link').links([]);
  }
}

export default NetworkGraph;
