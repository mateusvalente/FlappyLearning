// Executar: node tests/laboratorio.test.cjs (sem dependências externas).
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
function setup(){const c={console,Math:Object.create(Math),setTimeout(){},requestAnimationFrame(){},window:{postMessage(){},addEventListener(){}},document:{querySelector:()=>({width:500,height:512,getContext:()=>({})})}};c.window=c;c.postMessage=()=>{};c.addEventListener=()=>{};vm.createContext(c);for(const file of ['Neuroevolution.js','aulas/motor.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),c);return c;}
const c=setup(),L=c.Lab,w=[1,-1,-1,1,1,-1];
assert.equal(L.forward([0,0,0,0,0,0],250,190).output,.5);assert.equal(L.forward([0,0,0,0,0,0],250,190).flap,false);
const s=new L.Simulation([w],{y:250,v:2,top:190,x:330});s.step();assert.equal(s.birds[0].v,-5.7);assert.equal(s.birds[0].y,244.3);
const noFlap=new L.Simulation([[0,0,0,0,0,0]],{y:250,v:2,top:190,x:330});noFlap.step();assert.equal(noFlap.birds[0].y,252.3);
for(const rate of [0,1]){const t=L.mutateTrace(w,w.map(x=>-x),rate,.5,123);assert.equal(t.rows.filter(r=>r.mutated).length,rate*6);for(let i=0;i<6;i++)assert.ok(Math.abs(t.rows[i].before+t.rows[i].delta-t.weights[i])<1e-12);}
// Comparar simulador com o game.js original, usando a mesma pista e pesos.
const original=setup();vm.runInContext(fs.readFileSync(path.join(root,'game.js'),'utf8'),original);
const e=new L.Evolution(42),sim=new L.Simulation(e.weights);original.externalWeights=JSON.parse(JSON.stringify(e.weights));
vm.runInContext(`Neuvol={options:{population:10},nextGeneration:()=>externalWeights.map(w=>Lab.network(w)),networkScore:(net,score)=>{}};game=new Game();game.start();game.start=()=>{game.done=true;};let spawn=0;Math.random=()=>(Lab.COURSE[spawn++%Lab.COURSE.length]-50)/292;`,original);
for(let i=0;i<720&&!sim.done;i++){sim.step();original.game.update();for(let j=0;j<10;j++){const a=sim.birds[j],b=original.game.birds[j];assert.ok(Math.abs(a.y-b.y)<1e-9);assert.ok(Math.abs(a.v-b.gravity)<1e-9);assert.equal(a.alive,b.alive);}assert.equal(sim.pipes.length*2,original.game.pipes.length);for(let j=0;j<sim.pipes.length;j++){assert.equal(sim.pipes[j].x,original.game.pipes[j*2].x);assert.equal(sim.pipes[j].top,original.game.pipes[j*2].height);}}
let best=-1;for(let gen=0;gen<12;gen++){e.sim.finish();const expected=e.sim.birds.slice().sort((a,b)=>b.score-a.score);const result=e.evolve();assert.ok(result.summary.best>=best);best=result.summary.best;assert.equal(e.weights.length,10);assert.deepEqual(Array.from(e.weights[0]),Array.from(expected[0].weights));assert.ok(e.weights.flat().every(Number.isFinite));}
console.log('PASS: rede, física, mutação, equivalência ao game.js e 12 gerações com elitismo. Melhor fitness:',best);
