(function(){
'use strict';
const $=id=>document.getElementById(id),fmt=Visual.f;
const initial=[1,-1,-1,1,1,-1];let weights=initial.slice(),sensor=false,frame=0,active=-1,timer=null,ghost=null,previous=null,dead=false;
const edgeNames=['x₁ → h₁','x₂ → h₁','x₁ → h₂','x₂ → h₂','h₁ → s','h₂ → s'];
$('weights').innerHTML=weights.map((w,i)=>`<div class="weight"><label class="control" for="weight${i}">w${i+1}<output id="weightOut${i}">${fmt(w,2)}</output><input id="weight${i}" type="range" min="-4" max="4" step="0.05" value="${w}"></label><small>${edgeNames[i]}</small></div>`).join('');
function state(){return {y:+$('birdY').value,v:+$('velocity').value,top:+$('gapY').value,x:+$('pipeX').value};}
let current=state();
function snapshot(s,ghostY=null){return Visual.scene({birds:[{id:0,y:s.y,alive:!dead}],pipes:[{x:s.x,top:s.top}],frame,sensors:sensor,ghost:ghostY});}
function stop(){if(timer)clearInterval(timer);timer=null;$('play').textContent='Reproduzir devagar';}
function render(){
 const s=current,r=Lab.forward(weights,s.y,s.top);
 $('birdOut').value=fmt(s.y,1)+' px';$('gapOut').value=fmt(s.top,0)+' px';$('velocityOut').value=fmt(s.v,1)+' px/ciclo';$('pipeOut').value=fmt(s.x,0)+' px';
 $('world').innerHTML=snapshot(s,ghost);$('network').innerHTML=Visual.network(weights,r,active);
 weights.forEach((w,i)=>$('weightOut'+i).value=fmt(w,2));
 $('math').innerHTML=`h₁ = σ(${fmt(r.inputs[0])} × ${fmt(weights[0],2)} + ${fmt(r.inputs[1])} × ${fmt(weights[1],2)}) = <b>${fmt(r.hidden[0],4)}</b><br>h₂ = σ(${fmt(r.inputs[0])} × ${fmt(weights[2],2)} + ${fmt(r.inputs[1])} × ${fmt(weights[3],2)}) = <b>${fmt(r.hidden[1],4)}</b><br>s = σ(${fmt(r.hidden[0])} × ${fmt(weights[4],2)} + ${fmt(r.hidden[1])} × ${fmt(weights[5],2)}) = <b>${fmt(r.output,4)}</b>`;
 $('decision').textContent=`${fmt(r.output,4)} ${r.flap?'>':'≤'} 0,5 → ${r.flap?'BATER ASAS':'NÃO BATER ASAS'}`;$('decision').className='decision'+(r.flap?'':' wait');
 const before=previous?.before??s,after=previous?.after??s,action=previous?.action??r,oldV=before.v,newV=(action.flap?-6:oldV)+.3;
 $('before').innerHTML=Visual.scene({birds:[{id:0,y:before.y,alive:true}],pipes:[{x:before.x,top:before.top}],frame:previous?frame-1:frame,annotate:false});
 $('after').innerHTML=Visual.scene({birds:[{id:0,y:after.y,alive:true}],pipes:[{x:after.x,top:after.top}],frame,annotate:false,ghost:before.y});
 $('physics').innerHTML=`s = ${fmt(action.output,4)}<br>${action.flap?'Bater: v ← −6':'Sem batida: v continua '+fmt(oldV,1)}<br>Gravidade: v ← ${fmt(action.flap?-6:oldV,1)} + 0,3<br>v nova = ${fmt(newV,1)} px/ciclo<br>y nova = ${fmt(before.y,1)} + (${fmt(newV,1)})<br><b>y nova = ${fmt(before.y+newV,1)} px</b><br>Cano: x ← x − 3`;
 $('oneFrame').disabled=dead;$('play').disabled=dead;
}
function tick(){if(dead)return;const before={...current},action=Lab.forward(weights,before.y,before.top),v=(action.flap?-6:before.v)+.3,y=before.y+v;
 current={...before,v,y,x:before.x-3};frame++;ghost=before.y;
 dead=y>=512||y+30<=0||(!(80>before.x+50||120<before.x)&&(y<=before.top||y+30>=before.top+120));
 previous={before,after:{...current},action};
 if(dead)stop();
 $('frameStatus').textContent=`Ciclo ${frame}: saída ${fmt(action.output,4)}, y ${fmt(before.y,1)} → ${fmt(y,1)} px. ${dead?'Colisão: demonstração pausada. Restaure a cena ou mova os controles.':'Os pesos continuam iguais. A rede receberá a nova altura na próxima decisão.'}`;
 // Evitar que o cano deixe de ser o próximo obstáculo nesta cena isolada.
 if(current.x+50<=80){stop();dead=true;$('frameStatus').textContent+=' Cano ultrapassado. Restaure a cena para outro teste.';}
 render();
}
for(const id of ['birdY','gapY','velocity','pipeX'])$(id).addEventListener('input',()=>{stop();current=state();dead=false;previous=null;ghost=null;frame=0;$('frameStatus').textContent='Cena alterada. Execute um ciclo para comparar.';render();});
weights.forEach((_,i)=>{$('weight'+i).addEventListener('input',()=>{stop();weights[i]=+$('weight'+i).value;active=i;previous=null;render();});$('weight'+i).addEventListener('focus',()=>{active=i;render()});});
function setWeights(w){stop();weights=w;weights.forEach((v,i)=>$('weight'+i).value=v);previous=null;active=-1;render();}
$('preset').onclick=()=>setWeights(initial.slice());$('randomWeights').onclick=()=>setWeights(weights.map(()=>Math.round((Math.random()*2-1)*20)/20));$('zeroWeights').onclick=()=>setWeights([...weights.slice(0,4),0,0]);
$('vision').onclick=()=>{sensor=!sensor;$('vision').setAttribute('aria-pressed',sensor);$('vision').textContent=sensor?'Ver cenário completo':'Ver só as entradas';render();};
$('oneFrame').onclick=tick;$('play').onclick=()=>{if(timer)stop();else{$('play').textContent='Pausar';timer=setInterval(tick,250);}};
$('reset').onclick=()=>{stop();Object.entries({birdY:250,gapY:190,velocity:2,pipeX:330}).forEach(([k,v])=>$(k).value=v);current=state();frame=0;dead=false;previous=null;ghost=null;$('frameStatus').textContent='Cena restaurada. Os pesos foram mantidos.';render();};render();
})();
