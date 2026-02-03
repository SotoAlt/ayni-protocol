/**
 * Timeline - Horizontal scrolling audit log
 *
 * Displays message history as expandable cards,
 * auto-scrolling to show newest entries.
 */

export class Timeline {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.entries = [];
    this.maxEntries = options.maxEntries || 50;
    this.onEntryClick = options.onEntryClick || (() => {});
    this.autoScroll = true;

    this.setupScrollPause();
  }

  /**
   * Pause auto-scroll when user hovers
   */
  setupScrollPause() {
    this.container.addEventListener('mouseenter', () => {
      this.autoScroll = false;
    });

    this.container.addEventListener('mouseleave', () => {
      this.autoScroll = true;
      this.scrollToEnd();
    });
  }

  /**
   * Add a message entry to the timeline
   */
  addEntry(message) {
    const { from, to, glyph, category, timestamp, meaning, data } = message;

    // Remove empty state if present
    const empty = this.container.querySelector('.timeline-empty');
    if (empty) empty.remove();

    // Create entry element
    const entry = document.createElement('div');
    entry.className = `timeline-entry timeline-entry--${category}`;
    entry.dataset.message = JSON.stringify(message);

    // Time formatting
    const time = new Date(timestamp);
    const timeStr = time.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    entry.innerHTML = `
      <div class="timeline-entry__header">
        <span class="timeline-entry__glyph">${glyph}</span>
        <span class="timeline-entry__time">${timeStr}</span>
      </div>
      <div class="timeline-entry__flow">${from} → ${to}</div>
      <div class="timeline-entry__meaning">${meaning || this.getMeaning(glyph)}</div>
    `;

    // Click handler
    entry.addEventListener('click', () => {
      this.onEntryClick(message);
    });

    // Add to container
    this.container.appendChild(entry);
    this.entries.push(entry);

    // Remove old entries
    while (this.entries.length > this.maxEntries) {
      const oldEntry = this.entries.shift();
      oldEntry.style.animation = 'timeline-exit 0.3s ease-out forwards';
      setTimeout(() => oldEntry.remove(), 300);
    }

    // Auto-scroll to new entry
    if (this.autoScroll) {
      this.scrollToEnd();
    }

    return entry;
  }

  /**
   * Scroll to the end of the timeline
   */
  scrollToEnd() {
    this.container.scrollTo({
      left: this.container.scrollWidth,
      behavior: 'smooth'
    });
  }

  /**
   * Get human-readable meaning for glyph ID
   */
  getMeaning(glyphId) {
    const meanings = {
      // Queries
      Q01: 'Query Database',
      Q02: 'Query API',
      Q03: 'Search',
      Q04: 'Filtered Query',

      // Responses
      R01: 'Success',
      R02: 'Data Response',
      R03: 'Empty Result',
      R04: 'Cached Response',

      // Errors
      E01: 'General Error',
      E02: 'Payment Required',
      E03: 'Permission Denied',
      E04: 'Not Found',
      E05: 'Timeout',
      E06: 'Rate Limited',

      // Actions
      A01: 'Execute',
      A02: 'Update',
      A03: 'Delete',
      A04: 'Create',
      A05: 'Retry',

      // States
      S01: 'Idle',
      S02: 'Processing',
      S03: 'Waiting',
      S04: 'Complete',

      // Payments
      P01: 'Payment Sent',
      P02: 'Payment Confirmed',
      P03: 'Refund'
    };

    return meanings[glyphId] || glyphId;
  }

  /**
   * Clear all entries
   */
  clear() {
    this.container.innerHTML = `
      <div class="timeline-empty">
        <span>Waiting for messages...</span>
      </div>
    `;
    this.entries = [];
  }

  /**
   * Get entry count
   */
  getCount() {
    return this.entries.length;
  }

  /**
   * Filter entries by category
   */
  filterByCategory(category) {
    this.entries.forEach(entry => {
      if (category === 'all') {
        entry.style.display = '';
      } else {
        const msg = JSON.parse(entry.dataset.message);
        entry.style.display = msg.category === category ? '' : 'none';
      }
    });
  }

  /**
   * Highlight entries from/to a specific agent
   */
  highlightAgent(agentId) {
    this.entries.forEach(entry => {
      const msg = JSON.parse(entry.dataset.message);
      if (msg.from === agentId || msg.to === agentId) {
        entry.style.transform = 'scale(1.05)';
        entry.style.zIndex = '10';
      } else {
        entry.style.transform = '';
        entry.style.zIndex = '';
        entry.style.opacity = '0.5';
      }
    });
  }

  /**
   * Clear agent highlight
   */
  clearHighlight() {
    this.entries.forEach(entry => {
      entry.style.transform = '';
      entry.style.zIndex = '';
      entry.style.opacity = '';
    });
  }

  /**
   * Export entries as JSON
   */
  exportJSON() {
    return this.entries.map(entry => JSON.parse(entry.dataset.message));
  }
}

export default Timeline;
