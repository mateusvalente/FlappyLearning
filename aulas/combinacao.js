(function(){
'use strict';const $=id=>document.getElementById(id),f=Visual.f;
const titles=['Ler o estado','Calcular os neurônios','Obter a saída','Preparar a ação','Atualizar a física','Avaliar sobrevivência','Classificar a geração','Criar nova geração'];
let evo,phase=0,selected=0,snapshot,receipt=null,timer=null,last=null,lines=[];
function stop(){clearInterval(timer);timer=null;$('auto').textContent='Reproduzir etapas';}
function log(text){lines.unshift(text);lines=lines.slice(0,24);$('log').innerHTML=lines.map(l=>`<p>${l}</p>`).join('');}
function capture(){const alive=evo.sim.birds.filter(b=>b.alive);if(!evo.sim.birds[selected]?.alive&&alive.length)selected=alive[0].id;snapshot=evo.sim.inspect(selected);receipt=null;}
function fillFollow(){const value=selected;$('follow').innerHTML=evo.sim.birds.map(b=>`<option value="${b.id}">#${b.id+1}${b.alive?'':' · terminou'}</option>`).join('');$('follow').value=value;}
function ranking(){const birds=(phase===7?last.ranked:evo.sim.birds.slice().sort((a,b)=>(b.score??-1)-(a.score??-1)));return '<table><thead><tr><th>Indivíduo</th><th>Fitness</th><th>Estado</th></tr></thead><tbody>'+birds.map((b,i)=>`<tr class="${!b.alive&&i<2?'selected':''}"><td>#${b.id+1}</td><td>${b.score===null?'Em avaliação':b.score}</td><td>${b.capped?'Limite de teste':b.alive?'Vivo':i<2?'Elite candidata':'Avaliado'}</td></tr>`).join('')+'</tbody></table>';}
function render(){
 const sim=evo.sim,b=sim.birds[selected],r=receipt?.before??snapshot;
 $('stages').innerHTML=titles.map((t,i)=>`<div class="stage ${i===phase?'active':''}" ${i===phase?'aria-current="step"':''}>${i+1}. ${t}</div>`).join('');
 $('cycleBadge').textContent=`Etapa ${phase+1}/8 · ${phase<6?'ciclo individual':'transição da população'}`;
 fillFollow();$('follow').disabled=phase!==0;
 $('cycleScene').innerHTML=Visual.scene({birds:sim.birds,pipes:sim.pipes,frame:sim.frame,selected,ghost:receipt?.before.y??null});
 $('generation').textContent=evo.generation;$('frame').textContent=sim.frame;$('alive').textContent=sim.birds.filter(b=>b.alive).length+' / 10';
 $('observation').textContent=phase===7?'Nova população: novos pesos, pássaros em y = 250 e pista reiniciada.':sim.done?'Avaliação concluída. Agora o algoritmo genético pode usar todos os fitness.':`Acompanhando #${selected+1}. A rede lê coordenadas, não pixels. ${sim.pipes.length?'Abertura fixa nesta pista de comparação.':'Ainda não há cano à frente: E₂ = 0.'}`;
 $('phaseLabel').textContent=`Etapa ${phase+1} · ${phase<6?'rede + ambiente':'algoritmo genético'}`;$('phaseTitle').textContent=titles[phase];
 let text='',code='',numbers='',graphic='';
 if(phase===0){text='O código consulta a posição atual do pássaro e o topo do próximo vão. Não recebe imagens anteriores. São duas entradas por decisão.';code=`E₁ = y / 512 = ${f(snapshot.y,1)} / 512\nE₂ = topo / 512 = ${f(snapshot.top,0)} / 512`;numbers=`Vetor de entrada: [${f(snapshot.inputs[0])}, ${f(snapshot.inputs[1])}]. Velocidade ${f(snapshot.v,1)} existe na física, mas não entra na rede.`;graphic=`<div class="scene compact">${Visual.scene({birds:[{id:selected,y:snapshot.y,alive:true}],pipes:sim.pipes,frame:sim.frame,sensors:true,selected})}</div>`;}
 if(phase===1){text='Cada neurônio oculto soma duas entradas multiplicadas pelos seus pesos. Em seguida, aplica a sigmoide. Os pesos não mudam nesta conta.';code=`h₁ = σ(E₁·w₁ + E₂·w₂) = σ(${f(r.sums[0])})\nh₂ = σ(E₁·w₃ + E₂·w₄) = σ(${f(r.sums[1])})`;numbers=`h₁ = ${f(r.hidden[0],4)}; h₂ = ${f(r.hidden[1],4)}.`;graphic=`<div class="network">${Visual.network(b.weights,r)}</div>`;}
 if(phase===2){text='Os dois neurônios ocultos alimentam a saída. Comparar esse resultado com 0,5 produz a decisão binária de bater ou não bater asas.';code=`s = σ(h₁·w₅ + h₂·w₆)\ns = σ(${f(r.sums[2])}) = ${f(r.output,4)}\n${r.output>.5?'s > 0,5 → bater asas':'s ≤ 0,5 → não bater asas'}`;numbers='A saída é calculada de novo em cada atualização. Não há sorteio na decisão da rede.';graphic=`<div class="network">${Visual.network(b.weights,r)}</div>`;}
 if(phase===3){text='A ação prepara a velocidade que a física vai usar. Bater asas substitui a velocidade por −6. Sem batida, a velocidade anterior é mantida.';code=`v antes = ${f(r.v,1)}\n${r.flap?'bird.flap() → v = −6':'sem flap → v = '+f(r.v,1)}`;numbers='O movimento será aplicado na próxima etapa. Velocidade negativa aponta para cima.';graphic=`<div class="decision ${r.flap?'':'wait'}">${r.flap?'↑ Impulso de −6 px/ciclo':'Continuar com a velocidade atual'}</div>`;}
 if(phase===4){text='Agora executamos a atualização real da população: aplicamos as ações, somamos gravidade e movemos cada pássaro. Também são verificadas as colisões e movidos os canos.';const old=receipt.before,after=receipt.after;code=`v ← ${old.flap?'-6':f(old.v,1)} + 0,3 = ${f(after.v,1)}\ny ← ${f(old.y,1)} + (${f(after.v,1)}) = ${f(after.y,1)}`;numbers=`Ciclo ${old.frame} aplicado. #${selected+1}: ${after.alive?'ainda vivo':'terminou a avaliação'}. O contorno tracejado mostra a posição anterior.`;graphic=`<div class="scene compact">${Visual.scene({birds:[{id:selected,y:after.y,alive:true}],pipes:sim.pipes,frame:sim.frame,selected,ghost:old.y,annotate:false})}</div>`;}
 if(phase===5){text='O fitness é atribuído quando o pássaro morre. Ele é o contador de ciclos naquele momento, não o valor da saída nem a quantidade de canos.';code=b.score===null?`#${selected+1} vivo → continuar avaliando`:`networkScore(rede #${selected+1}, ${b.score})`;numbers=sim.done?'Todos terminaram: a próxima etapa será classificar a geração.':'Ainda há vivos: a próxima etapa volta à leitura do estado, com os mesmos pesos.';graphic=`<div class="genes">${Visual.genes(b.weights)}</div>`;}
 if(phase===6){text='Todos os fitness estão disponíveis. O algoritmo ordena os genomas para preservar os dois melhores e começar a reprodução pelos mais bem classificados.';const ranked=sim.birds.slice().sort((a,b)=>b.score-a.score);code=`Melhor: #${ranked[0].id+1} · fitness ${ranked[0].score}\n2 elites + 2 aleatórios + 6 descendentes\nOs pesos ainda não foram substituídos.`;numbers='Clique em “Próxima etapa” para chamar nextGeneration() do algoritmo original.';graphic=`<div class="genes">${Visual.genes(ranked[0].weights)}</div>`;}
 if(phase===7){text='nextGeneration() copiou as elites, sorteou duas redes novas e preencheu seis lugares com cruzamento e mutação. A população já foi reiniciada para ser avaliada.';code=`Geração ${evo.generation-1} → ${evo.generation}\nNovos pássaros em y = 250; v = 0\nCada filho mantém seus pesos durante o jogo.`;numbers='Mesmo os descendentes dos melhores precisam jogar: seu fitness ainda é desconhecido.';graphic='<div class="table-wrap"><table><thead><tr><th>Novos IDs</th><th>Origem</th></tr></thead><tbody><tr><td>#1–#2</td><td>Elites copiadas</td></tr><tr><td>#3–#4</td><td>Pesos aleatórios</td></tr><tr><td>#5–#10</td><td>Cruzamento + mutação</td></tr></tbody></table></div>';}
 if(phase===7&&last.children.length){
 const sample=last.children[0],w=sample.children[0];let cursor=6;
 const rows=w.map((value,i)=>{const fromB=sample.draws[i]<=.5,before=fromB?sample.b[i]:sample.a[i],mutated=sample.draws[cursor++]<=.1;if(mutated)cursor++;return `<tr><td>w${i+1}</td><td>${fromB?'B':'A'}: ${f(before)}</td><td>${mutated?f(value-before):'Sem mutação'}</td><td>${f(value)}</td></tr>`;}).join('');
 graphic+='<h3 style="margin-top:18px">Primeiro filho real · novo #5</h3><p class="tiny">Dois pais da geração anterior fornecem os pesos. A tabela registra o cruzamento e a mutação usados para este filho.</p><div class="table-wrap"><table><thead><tr><th>Peso</th><th>Herdado</th><th>Δ</th><th>Filho</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
 }
 $('phaseText').textContent=text;$('phaseCode').textContent=code;$('phaseNumbers').textContent=numbers;$('phaseGraphic').innerHTML=graphic;
 $('generationTable').innerHTML=ranking();$('historyChart').innerHTML=Visual.chart(evo.archive);
 $('finishGeneration').disabled=sim.done||phase===7;
}
function next(){
 if(phase===0)phase=1;
 else if(phase<3)phase++;
 else if(phase===3){const before=snapshot;evo.sim.step();const b=evo.sim.birds[selected];receipt={before,after:{y:b.y,v:b.v,alive:b.alive}};phase=4;}
 else if(phase===4)phase=5;
 else if(phase===5){if(evo.sim.done){phase=6;log(`Geração ${evo.generation} avaliada em ${evo.sim.frame} ciclos.`);}else{phase=0;capture();}}
 else if(phase===6){last=evo.evolve();phase=7;selected=0;log(`Geração ${last.summary.generation}: melhor ${last.summary.best}; média ${f(last.summary.mean,1)}. Nova população criada.`);}
 else {phase=0;capture();}
 render();
}
function reset(){stop();evo=new Lab.Evolution(42);phase=0;selected=0;last=null;lines=[];capture();log('Experimento reiniciado com a mesma população inicial e pista.');render();}
$('nextStep').onclick=()=>{stop();next();};$('cycle').onclick=()=>{stop();if(phase>=6){next();return;}const before=evo.sim.frame;let guard=0;do{next();}while(evo.sim.frame===before&&phase<6&&guard++<8);if(phase===4)next();};
$('auto').onclick=()=>{if(timer)stop();else{$('auto').textContent='Pausar etapas';timer=setInterval(next,850);}};
$('finishGeneration').onclick=()=>{stop();evo.sim.finish();phase=6;receipt=null;log(`Avaliação concluída: geração ${evo.generation}, ${evo.sim.frame} ciclos.`);render();};
$('restart').onclick=reset;$('follow').onchange=()=>{selected=+$('follow').value;snapshot=evo.sim.inspect(selected);receipt=null;render();};reset();
})();
