const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('dist/game-core.js', 'utf8'), sandbox);
const g = sandbox.GameLogic;
const plain = value => JSON.parse(JSON.stringify(value));
assert.deepEqual(plain(g.mergeLine([2,2,2,2])), {line:[4,4,0,0], score:8, merged:[true,true,false,false]});
assert.deepEqual(plain(g.mergeLine([2,0,2,4]).line), [4,4,0,0]);
assert.deepEqual(plain(g.mergeLine([4,4,8,8]).line), [8,16,0,0]);
const start = [2,0,0,0,2,0,0,0,4,0,0,0,4,0,0,0];
assert.deepEqual(plain(g.move2048(start,'up').board),[4,0,0,0,8,0,0,0,0,0,0,0,0,0,0,0]);
assert.deepEqual(plain(g.move2048(start,'down').board),[0,0,0,0,0,0,0,0,4,0,0,0,8,0,0,0]);
assert.equal(g.move2048(start,'up').score,12);
assert.equal(g.canMove2048([2,4,2,4,4,2,4,2,2,4,2,4,4,2,4,2]),false);
assert.equal(g.canMove2048([2,4,2,4,4,2,4,2,2,4,2,4,4,2,4,0]),true);
assert.equal(g.bestTTTMove(['X','X','','','O','','','','']),2);
assert.equal(g.bestTTTMove(['O','O','','X','X','','','','']),2);
assert.equal(g.tttResult(['X','X','X','','O','','O','','']).winner,'X');
let leaves=0;
function verifyAI(board, turn) {
 const end=g.tttResult(board);
 if(end){assert.notEqual(end.winner,'X','Computer should never lose');leaves++;return;}
 if(turn==='O'){const i=g.bestTTTMove([...board]);const copy=[...board];copy[i]='O';verifyAI(copy,'X');}
 else board.forEach((v,i)=>{if(!v){const copy=[...board];copy[i]='X';verifyAI(copy,'O');}});
}
verifyAI(Array(9).fill(''),'X');
for(let first=0;first<81;first++){
 const {mines,counts}=g.makeMines(first);
 assert.equal(mines.size,10);assert.equal(mines.has(first),false);assert.equal(counts[first],0);
 assert.equal(g.neighbors(first).some(i=>mines.has(i)),false);
 for(let i=0;i<81;i++)if(!mines.has(i))assert.equal(counts[i],g.neighbors(i).filter(n=>mines.has(n)).length);
}
assert.equal(g.neighbors(0).length,3);assert.equal(g.neighbors(40).length,8);
console.log(`PASS: 2048 merge, directions and game-over; tic-tac-toe ${leaves} full AI branches; all 81 safe minesweeper openings.`);
