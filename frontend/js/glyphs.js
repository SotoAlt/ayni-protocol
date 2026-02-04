/**
 * Ayni Protocol - Andean-Inspired Glyph System
 * Super chunky 16x16 pixel patterns - BIG visible pixels!
 */

const SIZE = 16;

function createGrid(size = SIZE) {
  return Array(size).fill(null).map(() => Array(size).fill(0));
}

// Fill rectangle
function fillRect(grid, x, y, w, h) {
  for (let py = y; py < y + h && py < SIZE; py++) {
    for (let px = x; px < x + w && px < SIZE; px++) {
      if (px >= 0 && py >= 0) grid[py][px] = 1;
    }
  }
}

// ═══════════════════════════════════════
// HUMANOID FIGURES - super chunky
// ═══════════════════════════════════════

function makeHumanoid(pose) {
  const grid = createGrid();

  // HEAD
  fillRect(grid, 6, 1, 4, 3);

  // BODY
  fillRect(grid, 7, 4, 2, 5);

  // ARMS
  if (pose === 'asking') {
    // Arms up
    fillRect(grid, 3, 1, 2, 2);
    fillRect(grid, 11, 1, 2, 2);
    fillRect(grid, 5, 3, 2, 2);
    fillRect(grid, 9, 3, 2, 2);
  } else if (pose === 'giving') {
    // Arms out
    fillRect(grid, 2, 5, 3, 2);
    fillRect(grid, 11, 5, 3, 2);
  } else if (pose === 'celebrating') {
    // Arms up wide
    fillRect(grid, 2, 1, 2, 2);
    fillRect(grid, 12, 1, 2, 2);
    fillRect(grid, 4, 3, 2, 2);
    fillRect(grid, 10, 3, 2, 2);
  } else {
    // Arms down
    fillRect(grid, 4, 5, 2, 3);
    fillRect(grid, 10, 5, 2, 3);
  }

  // LEGS
  fillRect(grid, 5, 9, 2, 4);
  fillRect(grid, 9, 9, 2, 4);

  // FEET
  fillRect(grid, 4, 13, 3, 2);
  fillRect(grid, 9, 13, 3, 2);

  return grid;
}

// ═══════════════════════════════════════
// SYMBOLS - chunky geometric
// ═══════════════════════════════════════

function makeSymbol(type) {
  const grid = createGrid();

  if (type === 'database') {
    // Three stacked boxes
    fillRect(grid, 3, 1, 10, 4);
    fillRect(grid, 3, 6, 10, 4);
    fillRect(grid, 3, 11, 10, 4);
    // Inner lines
    fillRect(grid, 5, 2, 6, 1);
    fillRect(grid, 5, 7, 6, 1);
    fillRect(grid, 5, 12, 6, 1);
  }
  else if (type === 'checkmark') {
    fillRect(grid, 2, 8, 2, 2);
    fillRect(grid, 4, 10, 2, 2);
    fillRect(grid, 6, 12, 2, 2);
    fillRect(grid, 8, 10, 2, 2);
    fillRect(grid, 10, 8, 2, 2);
    fillRect(grid, 12, 6, 2, 2);
    fillRect(grid, 14, 4, 2, 2);
  }
  else if (type === 'x') {
    fillRect(grid, 2, 2, 3, 3);
    fillRect(grid, 11, 2, 3, 3);
    fillRect(grid, 5, 5, 2, 2);
    fillRect(grid, 9, 5, 2, 2);
    fillRect(grid, 7, 7, 2, 2);
    fillRect(grid, 5, 9, 2, 2);
    fillRect(grid, 9, 9, 2, 2);
    fillRect(grid, 2, 11, 3, 3);
    fillRect(grid, 11, 11, 3, 3);
  }
  else if (type === 'clock') {
    // Outer square
    fillRect(grid, 2, 2, 12, 2);
    fillRect(grid, 2, 12, 12, 2);
    fillRect(grid, 2, 2, 2, 12);
    fillRect(grid, 12, 2, 2, 12);
    // Hands
    fillRect(grid, 7, 5, 2, 4);
    fillRect(grid, 9, 8, 3, 2);
  }
  else if (type === 'lock') {
    // Shackle
    fillRect(grid, 5, 1, 6, 2);
    fillRect(grid, 5, 1, 2, 5);
    fillRect(grid, 9, 1, 2, 5);
    // Body
    fillRect(grid, 3, 6, 10, 8);
    // Keyhole
    fillRect(grid, 7, 9, 2, 3);
  }
  else if (type === 'coin') {
    // Diamond shape
    fillRect(grid, 7, 1, 2, 2);
    fillRect(grid, 5, 3, 6, 2);
    fillRect(grid, 3, 5, 10, 2);
    fillRect(grid, 1, 7, 14, 2);
    fillRect(grid, 3, 9, 10, 2);
    fillRect(grid, 5, 11, 6, 2);
    fillRect(grid, 7, 13, 2, 2);
  }
  else if (type === 'lightning') {
    fillRect(grid, 8, 0, 4, 3);
    fillRect(grid, 6, 3, 4, 3);
    fillRect(grid, 4, 6, 6, 2);
    fillRect(grid, 6, 8, 4, 3);
    fillRect(grid, 4, 11, 4, 3);
    fillRect(grid, 2, 14, 3, 2);
  }
  else if (type === 'arrow') {
    // Shaft
    fillRect(grid, 1, 6, 10, 4);
    // Head
    fillRect(grid, 11, 4, 2, 8);
    fillRect(grid, 13, 6, 2, 4);
  }
  else if (type === 'heart') {
    fillRect(grid, 2, 3, 5, 4);
    fillRect(grid, 9, 3, 5, 4);
    fillRect(grid, 4, 7, 8, 3);
    fillRect(grid, 6, 10, 4, 3);
    fillRect(grid, 7, 13, 2, 2);
  }
  else if (type === 'eye') {
    // Diamond outline
    fillRect(grid, 7, 1, 2, 2);
    fillRect(grid, 5, 3, 2, 2);
    fillRect(grid, 9, 3, 2, 2);
    fillRect(grid, 3, 5, 2, 2);
    fillRect(grid, 11, 5, 2, 2);
    fillRect(grid, 1, 7, 2, 2);
    fillRect(grid, 13, 7, 2, 2);
    fillRect(grid, 3, 9, 2, 2);
    fillRect(grid, 11, 9, 2, 2);
    fillRect(grid, 5, 11, 2, 2);
    fillRect(grid, 9, 11, 2, 2);
    fillRect(grid, 7, 13, 2, 2);
    // Pupil
    fillRect(grid, 6, 6, 4, 4);
  }
  // ═══════════════════════════════════════
  // CRYPTO/DeFi SYMBOLS
  // ═══════════════════════════════════════
  else if (type === 'swap') {
    // Two arrows exchanging
    // Top arrow pointing right
    fillRect(grid, 2, 3, 8, 2);
    fillRect(grid, 10, 2, 2, 2);
    fillRect(grid, 12, 3, 2, 2);
    fillRect(grid, 10, 5, 2, 2);
    // Bottom arrow pointing left
    fillRect(grid, 6, 9, 8, 2);
    fillRect(grid, 4, 8, 2, 2);
    fillRect(grid, 2, 9, 2, 2);
    fillRect(grid, 4, 11, 2, 2);
  }
  else if (type === 'stake') {
    // Lock with token inside
    fillRect(grid, 5, 1, 6, 2);
    fillRect(grid, 5, 1, 2, 4);
    fillRect(grid, 9, 1, 2, 4);
    fillRect(grid, 3, 5, 10, 9);
    // Coin inside
    fillRect(grid, 6, 8, 4, 4);
  }
  else if (type === 'bridge') {
    // Two chains linked
    fillRect(grid, 1, 5, 5, 6);
    fillRect(grid, 10, 5, 5, 6);
    // Link between
    fillRect(grid, 6, 7, 4, 2);
    // Inner holes
    fillRect(grid, 2, 7, 2, 2);
    fillRect(grid, 12, 7, 2, 2);
  }
  else if (type === 'vote') {
    // Ballot box with paper
    fillRect(grid, 3, 7, 10, 7);
    // Slot
    fillRect(grid, 6, 6, 4, 2);
    // Paper going in
    fillRect(grid, 6, 1, 4, 6);
    // Check on paper
    fillRect(grid, 7, 3, 2, 2);
  }
  else if (type === 'harvest') {
    // Hand receiving coins
    fillRect(grid, 2, 10, 12, 4);
    // Coins falling
    fillRect(grid, 4, 2, 3, 3);
    fillRect(grid, 9, 4, 3, 3);
    fillRect(grid, 6, 6, 3, 3);
  }
  else if (type === 'limit') {
    // Price tag shape
    fillRect(grid, 2, 4, 10, 8);
    fillRect(grid, 12, 6, 2, 4);
    // Hole
    fillRect(grid, 4, 7, 2, 2);
    // Lines (price)
    fillRect(grid, 7, 6, 4, 2);
    fillRect(grid, 7, 9, 3, 2);
  }
  else if (type === 'shield') {
    // Shield shape
    fillRect(grid, 3, 1, 10, 4);
    fillRect(grid, 3, 5, 10, 4);
    fillRect(grid, 4, 9, 8, 3);
    fillRect(grid, 6, 12, 4, 2);
    fillRect(grid, 7, 14, 2, 2);
  }
  // ═══════════════════════════════════════
  // AGENT WORKFLOW SYMBOLS
  // ═══════════════════════════════════════
  else if (type === 'task') {
    // Checkbox with check
    fillRect(grid, 2, 2, 12, 12);
    // Inner white
    fillRect(grid, 4, 4, 8, 8);
    // Checkmark
    fillRect(grid, 5, 8, 2, 2);
    fillRect(grid, 7, 10, 2, 2);
    fillRect(grid, 9, 8, 2, 2);
    fillRect(grid, 11, 6, 2, 2);
  }
  else if (type === 'heartbeat') {
    // Pulse line
    fillRect(grid, 0, 7, 4, 2);
    fillRect(grid, 4, 4, 2, 3);
    fillRect(grid, 6, 2, 2, 4);
    fillRect(grid, 8, 9, 2, 4);
    fillRect(grid, 10, 6, 2, 3);
    fillRect(grid, 12, 7, 4, 2);
  }
  else if (type === 'broadcast') {
    // Speaker with waves
    fillRect(grid, 1, 5, 4, 6);
    // Waves
    fillRect(grid, 6, 4, 2, 8);
    fillRect(grid, 9, 2, 2, 12);
    fillRect(grid, 12, 0, 2, 16);
  }
  else if (type === 'checkpoint') {
    // Flag
    fillRect(grid, 4, 1, 2, 14);
    fillRect(grid, 6, 1, 8, 6);
    // Base
    fillRect(grid, 2, 13, 8, 3);
  }
  else if (type === 'delegate') {
    // Two figures with arrow
    // Figure 1
    fillRect(grid, 2, 2, 3, 3);
    fillRect(grid, 2, 6, 3, 6);
    // Figure 2
    fillRect(grid, 11, 2, 3, 3);
    fillRect(grid, 11, 6, 3, 6);
    // Arrow between
    fillRect(grid, 6, 7, 4, 2);
    fillRect(grid, 9, 5, 2, 2);
    fillRect(grid, 9, 9, 2, 2);
  }
  else if (type === 'queue') {
    // Stacked items
    fillRect(grid, 2, 1, 12, 3);
    fillRect(grid, 2, 6, 12, 3);
    fillRect(grid, 2, 11, 12, 3);
  }
  else if (type === 'alert') {
    // Diamond with exclamation
    fillRect(grid, 7, 0, 2, 2);
    fillRect(grid, 5, 2, 6, 2);
    fillRect(grid, 3, 4, 10, 2);
    fillRect(grid, 1, 6, 14, 2);
    fillRect(grid, 3, 8, 10, 2);
    fillRect(grid, 5, 10, 6, 2);
    fillRect(grid, 7, 12, 2, 2);
    // Exclamation (hollow in center)
    fillRect(grid, 7, 4, 2, 4);
    fillRect(grid, 7, 10, 2, 2);
  }
  else if (type === 'log') {
    // Stacked papers
    fillRect(grid, 4, 2, 10, 12);
    fillRect(grid, 2, 4, 2, 10);
    // Lines
    fillRect(grid, 6, 5, 6, 2);
    fillRect(grid, 6, 9, 5, 2);
  }
  else if (type === 'sync') {
    // Two circular arrows
    fillRect(grid, 2, 2, 8, 2);
    fillRect(grid, 10, 2, 2, 4);
    fillRect(grid, 8, 4, 2, 2);
    // Bottom arrow
    fillRect(grid, 6, 12, 8, 2);
    fillRect(grid, 4, 10, 2, 4);
    fillRect(grid, 6, 10, 2, 2);
  }

  return grid;
}

// ═══════════════════════════════════════
// CREATURES - blocky animals
// ═══════════════════════════════════════

function makeCreature(type) {
  const grid = createGrid();

  if (type === 'bird') {
    // Body
    fillRect(grid, 4, 6, 6, 4);
    // Head
    fillRect(grid, 10, 5, 4, 4);
    // Beak
    fillRect(grid, 14, 6, 2, 2);
    // Wing
    fillRect(grid, 2, 4, 3, 3);
    // Tail
    fillRect(grid, 0, 7, 4, 2);
    // Legs
    fillRect(grid, 6, 10, 2, 4);
    fillRect(grid, 9, 10, 2, 4);
  }
  else if (type === 'snake') {
    // Zigzag body
    fillRect(grid, 0, 6, 4, 3);
    fillRect(grid, 3, 4, 3, 3);
    fillRect(grid, 5, 7, 3, 3);
    fillRect(grid, 7, 5, 3, 3);
    fillRect(grid, 9, 8, 3, 3);
    // Head
    fillRect(grid, 11, 6, 4, 4);
  }
  else if (type === 'spider') {
    // Body
    fillRect(grid, 6, 6, 4, 4);
    // Legs (8)
    fillRect(grid, 2, 4, 4, 2);
    fillRect(grid, 2, 6, 2, 2);
    fillRect(grid, 2, 10, 4, 2);
    fillRect(grid, 2, 8, 2, 2);
    fillRect(grid, 10, 4, 4, 2);
    fillRect(grid, 12, 6, 2, 2);
    fillRect(grid, 10, 10, 4, 2);
    fillRect(grid, 12, 8, 2, 2);
  }
  else if (type === 'fish') {
    // Diamond body
    fillRect(grid, 6, 4, 4, 2);
    fillRect(grid, 4, 6, 8, 4);
    fillRect(grid, 6, 10, 4, 2);
    // Tail
    fillRect(grid, 0, 5, 4, 6);
    // Eye
    fillRect(grid, 10, 7, 2, 2);
  }
  else if (type === 'cat') {
    // Head
    fillRect(grid, 4, 2, 8, 6);
    // Ears
    fillRect(grid, 3, 0, 3, 3);
    fillRect(grid, 10, 0, 3, 3);
    // Eyes
    fillRect(grid, 5, 4, 2, 2);
    fillRect(grid, 9, 4, 2, 2);
    // Body
    fillRect(grid, 3, 8, 10, 4);
    // Legs
    fillRect(grid, 3, 12, 3, 3);
    fillRect(grid, 10, 12, 3, 3);
    // Tail
    fillRect(grid, 13, 9, 3, 2);
  }

  return grid;
}

// ═══════════════════════════════════════
// MACHINES - tech blocks
// ═══════════════════════════════════════

function makeMachine(type) {
  const grid = createGrid();

  if (type === 'robot') {
    // Antenna
    fillRect(grid, 7, 0, 2, 2);
    // Head
    fillRect(grid, 4, 2, 8, 5);
    // Eyes
    fillRect(grid, 5, 3, 2, 2);
    fillRect(grid, 9, 3, 2, 2);
    // Body
    fillRect(grid, 3, 7, 10, 5);
    // Buttons
    fillRect(grid, 5, 9, 2, 2);
    fillRect(grid, 9, 9, 2, 2);
    // Legs
    fillRect(grid, 4, 12, 3, 3);
    fillRect(grid, 9, 12, 3, 3);
  }
  else if (type === 'terminal') {
    // Screen
    fillRect(grid, 1, 1, 14, 10);
    // Face - empty eyes
    grid[4][4] = 0; grid[4][5] = 0;
    grid[5][4] = 0; grid[5][5] = 0;
    grid[4][10] = 0; grid[4][11] = 0;
    grid[5][10] = 0; grid[5][11] = 0;
    // Smile
    grid[7][5] = 0; grid[7][6] = 0; grid[7][7] = 0; grid[7][8] = 0; grid[7][9] = 0; grid[7][10] = 0;
    // Keyboard
    fillRect(grid, 2, 12, 12, 3);
  }
  else if (type === 'server') {
    // Three stacked units
    fillRect(grid, 2, 1, 12, 4);
    fillRect(grid, 2, 6, 12, 4);
    fillRect(grid, 2, 11, 12, 4);
    // Lights
    fillRect(grid, 4, 2, 2, 2);
    fillRect(grid, 4, 7, 2, 2);
    fillRect(grid, 4, 12, 2, 2);
  }
  else if (type === 'drone') {
    // Center body
    fillRect(grid, 6, 6, 4, 4);
    // Rotors
    fillRect(grid, 1, 1, 4, 4);
    fillRect(grid, 11, 1, 4, 4);
    fillRect(grid, 1, 11, 4, 4);
    fillRect(grid, 11, 11, 4, 4);
    // Arms
    fillRect(grid, 4, 4, 2, 2);
    fillRect(grid, 10, 4, 2, 2);
    fillRect(grid, 4, 10, 2, 2);
    fillRect(grid, 10, 10, 2, 2);
  }
  else if (type === 'antenna') {
    // Tower
    fillRect(grid, 6, 5, 4, 10);
    // Base
    fillRect(grid, 4, 13, 8, 3);
    // Waves
    fillRect(grid, 4, 1, 8, 2);
    fillRect(grid, 2, 3, 12, 2);
  }

  return grid;
}

// ═══════════════════════════════════════
// GENERATE ALL PATTERNS
// ═══════════════════════════════════════

const GLYPH_PATTERNS = {
  // Humanoids
  asking: makeHumanoid('asking'),
  giving: makeHumanoid('giving'),
  waiting: makeHumanoid('waiting'),
  running: makeHumanoid('waiting'),
  thinking: makeHumanoid('waiting'),
  celebrating: makeHumanoid('celebrating'),

  // Core symbols
  database: makeSymbol('database'),
  checkmark: makeSymbol('checkmark'),
  x: makeSymbol('x'),
  clock: makeSymbol('clock'),
  lock: makeSymbol('lock'),
  coin: makeSymbol('coin'),
  lightning: makeSymbol('lightning'),
  arrow: makeSymbol('arrow'),
  heart: makeSymbol('heart'),
  eye: makeSymbol('eye'),

  // Creatures
  bird: makeCreature('bird'),
  snake: makeCreature('snake'),
  spider: makeCreature('spider'),
  fish: makeCreature('fish'),
  cat: makeCreature('cat'),

  // Machines
  robot: makeMachine('robot'),
  terminal: makeMachine('terminal'),
  server: makeMachine('server'),
  drone: makeMachine('drone'),
  antenna: makeMachine('antenna'),

  // Crypto/DeFi symbols
  swap: makeSymbol('swap'),
  stake: makeSymbol('stake'),
  bridge: makeSymbol('bridge'),
  vote: makeSymbol('vote'),
  harvest: makeSymbol('harvest'),
  limit: makeSymbol('limit'),
  shield: makeSymbol('shield'),

  // Agent workflow symbols
  task: makeSymbol('task'),
  heartbeat: makeSymbol('heartbeat'),
  broadcast: makeSymbol('broadcast'),
  checkpoint: makeSymbol('checkpoint'),
  delegate: makeSymbol('delegate'),
  queue: makeSymbol('queue'),
  alert: makeSymbol('alert'),
  log: makeSymbol('log'),
  sync: makeSymbol('sync')
};

const GLYPH_MEANINGS = {
  // Humanoids
  asking: 'Query',
  giving: 'Response',
  waiting: 'Waiting',
  running: 'Execute',
  thinking: 'Processing',
  celebrating: 'Success!',

  // Core symbols
  database: 'Database',
  checkmark: 'Success',
  x: 'Error',
  clock: 'Time',
  lock: 'Encrypted',
  coin: 'Payment',
  lightning: 'Action',
  arrow: 'Direction',
  heart: 'Health',
  eye: 'Watching',

  // Creatures
  bird: 'Messenger',
  snake: 'Data Flow',
  spider: 'Network',
  fish: 'Stream',
  cat: 'Observer',

  // Machines
  robot: 'Agent',
  terminal: 'Claude',
  server: 'Server',
  drone: 'Scout',
  antenna: 'Broadcast',

  // Crypto/DeFi
  swap: 'Token Swap',
  stake: 'Stake Tokens',
  bridge: 'Bridge',
  vote: 'DAO Vote',
  harvest: 'Harvest Rewards',
  limit: 'Limit Order',
  shield: 'Stop Loss',

  // Agent workflow
  task: 'Task',
  heartbeat: 'Heartbeat',
  broadcast: 'Broadcast',
  checkpoint: 'Checkpoint',
  delegate: 'Delegate',
  queue: 'Queue',
  alert: 'Alert',
  log: 'Log Entry',
  sync: 'Sync'
};

const GLYPH_CATEGORIES = {
  humanoid: ['asking', 'giving', 'waiting', 'running', 'thinking', 'celebrating'],
  creature: ['bird', 'snake', 'spider', 'fish', 'cat'],
  machine: ['robot', 'terminal', 'server', 'drone', 'antenna'],
  symbol: ['database', 'checkmark', 'x', 'clock', 'lock', 'coin', 'lightning', 'arrow', 'heart', 'eye'],
  crypto: ['swap', 'stake', 'bridge', 'vote', 'harvest', 'limit', 'shield'],
  agent: ['task', 'heartbeat', 'broadcast', 'checkpoint', 'delegate', 'queue', 'alert', 'log', 'sync']
};

const GLYPH_COMBOS = {};

const CATEGORY_COLORS = {
  humanoid: '#00d9ff',   // Cyan
  creature: '#ff9500',   // Orange
  machine: '#00ff41',    // Green
  symbol: '#9d4edd',     // Purple
  crypto: '#f5a623',     // Gold - for DeFi operations
  agent: '#4a9eff'       // Blue - for agent workflows
};

export {
  SIZE,
  GLYPH_PATTERNS,
  GLYPH_MEANINGS,
  GLYPH_CATEGORIES,
  GLYPH_COMBOS,
  CATEGORY_COLORS
};

export default GLYPH_PATTERNS;
