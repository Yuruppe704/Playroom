/* Deterministic rules shared by the games and their checks. */
var GameLogic = (() => {
  function mergeLine(line) {
    const compact = line.filter(Boolean), result = [], groups = [];
    let score = 0;
    for (let i = 0; i < compact.length; i++) {
      if (compact[i] === compact[i + 1]) {
        const value = compact[i] * 2;
        result.push(value); score += value; groups.push(true); i++;
      } else { result.push(compact[i]); groups.push(false); }
    }
    while (result.length < 4) { result.push(0); groups.push(false); }
    return { line: result, score, merged: groups };
  }
  function move2048(board, direction) {
    const next = Array(16).fill(0), merged = [], origins = {};
    let score = 0;
    for (let a = 0; a < 4; a++) {
      const indices = Array.from({ length: 4 }, (_, b) =>
        direction === 'left' ? a * 4 + b : direction === 'right' ? a * 4 + 3 - b : direction === 'up' ? b * 4 + a : (3 - b) * 4 + a);
      const source = indices.filter(i => board[i]);
      const compact = source.map(i => board[i]);
      const result = mergeLine(compact); score += result.score;
      let p = 0;
      result.line.forEach((v, b) => {
        const target = indices[b]; next[target] = v;
        if (v) { origins[target] = source[p]; p += result.merged[b] ? 2 : 1; }
        if (result.merged[b]) merged.push(target);
      });
    }
    return { board: next, score, merged, origins, changed: next.some((v, i) => v !== board[i]) };
  }
  function canMove2048(board) {
    return board.includes(0) || board.some((v, i) => (i % 4 < 3 && v === board[i + 1]) || (i < 12 && v === board[i + 4]));
  }
  const winLines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  function tttResult(board) {
    const line = winLines.find(l => board[l[0]] && l.every(i => board[i] === board[l[0]]));
    return line ? { winner: board[line[0]], line } : board.every(Boolean) ? { winner: 'draw', line: [] } : null;
  }
  function bestTTTMove(board, player = 'O') {
    function minimax(b, p, depth) {
      const end = tttResult(b);
      if (end) return end.winner === 'draw' ? 0 : end.winner === 'O' ? 10 - depth : depth - 10;
      const scores = [];
      b.forEach((v, i) => { if (!v) { b[i] = p; scores.push(minimax(b, p === 'O' ? 'X' : 'O', depth + 1)); b[i] = ''; } });
      return p === 'O' ? Math.max(...scores) : Math.min(...scores);
    }
    let best = -Infinity, move = -1;
    // Center and corners are chosen first when evaluations tie.
    for (const i of [4,0,2,6,8,1,3,5,7]) {
      if (board[i]) continue;
      const copy = [...board]; copy[i] = player;
      const value = minimax(copy, player === 'O' ? 'X' : 'O', 0) * (player === 'O' ? 1 : -1);
      if (value > best) { best = value; move = i; }
    }
    return move;
  }
  function neighbors(index, size = 9) {
    const x = index % size, y = Math.floor(index / size), list = [];
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!(dx || dy)) continue;
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && nx < size && ny >= 0 && ny < size) list.push(ny * size + nx);
    }
    return list;
  }
  function shuffled(items) {
    const a = [...items];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  function makeMines(first, size = 9, count = 10) {
    const safe = new Set([first, ...neighbors(first, size)]);
    const candidates = shuffled(Array.from({ length: size * size }, (_, i) => i).filter(i => !safe.has(i)));
    const mines = new Set(candidates.slice(0, count));
    const counts = Array.from({ length: size * size }, (_, i) => mines.has(i) ? -1 : neighbors(i, size).filter(n => mines.has(n)).length);
    return { mines, counts };
  }
  return { mergeLine, move2048, canMove2048, tttResult, bestTTTMove, neighbors, shuffled, makeMines };
})();
