/* Laboratório controlado: rede e reprodução usam Neuroevolution.js original.
   A física reproduz Bird.update/isDead e a ordem central de Game.update.
   Diferenças intencionais: pista repetível, limite de 720 ciclos e 10 indivíduos. */
(function (root) {
  'use strict';
  const H = 512, W = 500, LIMIT = 720;
  const COURSE = [190, 110, 255, 160, 285, 85, 220, 140];
  function seeded(seed) {
    let a = seed >>> 0;
    return () => { a += 0x6D2B79F5; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  function withRandom(random, fn) {
    const previous = Math.random;
    Math.random = random;
    try { return fn(); } finally { Math.random = previous; }
  }
  function network(weights) {
    const ne = new root.Neuroevolution({network: [2, [2], 1], population: 1});
    const nn = ne.nextGeneration()[0];
    if (weights) nn.setSave({neurons: [2, 2, 1], weights: weights.slice()});
    return nn;
  }
  function forward(weights, y, top) {
    const nn = network(weights), inputs = [y / H, top / H];
    const output = nn.compute(inputs)[0];
    const hidden = nn.layers[1].neurons.map(n => n.value);
    return {inputs, hidden, output, flap: output > 0.5,
      sums: [inputs[0]*weights[0]+inputs[1]*weights[1], inputs[0]*weights[2]+inputs[1]*weights[3], hidden[0]*weights[4]+hidden[1]*weights[5]]};
  }
  function mutateTrace(A, B, rate, range, seed) {
    const ne = new root.Neuroevolution({network:[2,[2],1],population:10,mutationRate:rate,mutationRange:range});
    ne.nextGeneration();
    const draws = [], random = seeded(seed);
    const wrap = () => { const n=random(); draws.push(n); return n; };
    const g = w => ({score:0,network:{neurons:[2,2,1],weights:w.slice()}});
    const result = withRandom(wrap, () => ne.generations.generations[0].breed(g(A),g(B),1)[0].network.weights);
    let cursor=6;
    const rows=A.map((a,i)=>{
      const cross=draws[i], fromB=cross<=0.5, chance=draws[cursor++], mutated=chance<=rate;
      const deltaRandom=mutated?draws[cursor++]:null;
      const delta=mutated?deltaRandom*range*2-range:0;
      return {a,b:B[i],cross,fromB,chance,mutated,deltaRandom,delta,before:fromB?B[i]:a,after:result[i]};
    });
    return {weights:result,rows};
  }
  class Simulation {
    constructor(weights, initial) {
      this.frame=0; this.pipes=[]; this.interval=0; this.spawn=0; this.done=false;
      this.birds=weights.map((w,i)=>({id:i,weights:w.slice(),nn:network(w),y:initial?.y??250,v:initial?.v??0,alive:true,score:null,history:[]}));
      if(initial?.top!==undefined) this.pipes=[{x:initial.x??330,top:initial.top}];
    }
    top() { return this.pipes.find(p=>p.x+50>80)?.top??0; }
    inspect(i) {
      const b=this.birds[i];
      return {...forward(b.weights,b.y,this.top()),y:b.y,v:b.v,frame:this.frame,top:this.top()};
    }
    step() {
      if(this.done) return;
      const top=this.top();
      for(const b of this.birds) {
        if(!b.alive) continue;
        const output=b.nn.compute([b.y/H,top/H])[0], oldY=b.y, oldV=b.v;
        if(output>0.5) b.v=-6;
        b.v+=0.3; b.y+=b.v;
        const dead=b.y>=H || b.y+30<=0 || this.pipes.some(p=>!(80>p.x+50 || 120<p.x) && (!(b.y>p.top || b.y+30<0) || !(b.y>p.top+120+H || b.y+30<p.top+120)));
        b.history.push({frame:this.frame,y:oldY,v:oldV,top,output,flap:output>0.5,nextY:b.y,nextV:b.v});
        if(dead) { b.alive=false;b.score=this.frame; }
      }
      this.pipes.forEach(p=>p.x-=3);this.pipes=this.pipes.filter(p=>p.x+50>=0);
      if(this.interval===0){ this.pipes.push({x:W,top:COURSE[this.spawn++%COURSE.length]}); }
      this.interval=(this.interval+1)%90; this.frame++;
      if(this.frame>=LIMIT) for(const b of this.birds) if(b.alive){b.alive=false;b.score=LIMIT;b.capped=true;}
      this.done=this.birds.every(b=>!b.alive);
    }
    finish() { while(!this.done) this.step(); return this.birds; }
  }
  class Evolution {
    constructor(seed=42) {
      this.random=seeded(seed);this.generation=1;
      this.ne=new root.Neuroevolution({network:[2,[2],1],population:10,elitism:.2,randomBehaviour:.2,mutationRate:.1,mutationRange:.5});
      this.networks=withRandom(this.random,()=>this.ne.nextGeneration());
      this.weights=this.networks.map(n=>n.getSave().weights);
      this.sim=new Simulation(this.weights);this.archive=[];
    }
    evolve() {
      if(!this.sim.done) throw Error('Avalie todos os indivíduos antes de reproduzir.');
      const ranked=this.sim.birds.slice().sort((a,b)=>b.score-a.score);
      // Registrar na ordem de morte, preservando a ordem dos empates do jogo.
      this.sim.birds.slice().sort((a,b)=>a.score-b.score||a.id-b.id).forEach(b=>this.ne.networkScore(this.networks[b.id],b.score));
      const gen=this.ne.generations.generations.at(-1), children=[], original=gen.breed;
      gen.breed=function(a,b,n){ const random=Math.random,draws=[]; const born=withRandom(()=>{const value=random();draws.push(value);return value;},()=>original.call(this,a,b,n));children.push({a:a.network.weights.slice(),b:b.network.weights.slice(),draws,children:born.map(g=>g.network.weights.slice())});return born; };
      const summary={generation:this.generation,best:ranked[0].score,mean:this.sim.birds.reduce((sum,b)=>sum+b.score,0)/10};
      this.archive.push(summary);
      this.networks=withRandom(this.random,()=>this.ne.nextGeneration());
      this.weights=this.networks.map(n=>n.getSave().weights);this.generation++;
      this.sim=new Simulation(this.weights);
      this.last={ranked,children,summary};return this.last;
    }
  }
  root.Lab={H,W,LIMIT,COURSE,seeded,withRandom,network,forward,mutateTrace,Simulation,Evolution};
})(typeof window==='undefined'?globalThis:window);
