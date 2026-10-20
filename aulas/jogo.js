(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  let lastKey = '';
  window.labPaused = false;
  window.labStepRequested = false;
  $('pauseGame').onclick = () => { window.labPaused = !window.labPaused; };
  $('stepGame').onclick = () => { window.labPaused = true; window.labStepRequested = true; };
  $('gameSpeed').onchange = () => speed($('gameSpeed').value);
  function render() {
    if (window.game && game.gen.length) {
      $('pauseGame').textContent = window.labPaused ? 'Continuar' : 'Pausar';
      $('runState').textContent = window.labPaused ? 'Pausado para inspeção' : 'Treinando';
      $('liveGeneration').textContent = game.generation;
      $('liveAlive').textContent = game.alives + ' / ' + Neuvol.options.population;
      $('liveBest').textContent = game.maxScore;
      const id = game.birds.findIndex(b => b.alive);
      const d = game.lastDecisions && game.lastDecisions[id];
      if (d && d.generation === game.generation) {
        const key = `${d.generation}:${d.frame}:${id}`;
        if (key !== lastKey) {
          lastKey = key;
          const network = game.gen[id];
          const weights = network.getSave().weights;
          const hidden = d.hidden;
          $('trackedBird').textContent = `Pássaro #${id + 1} · ciclo ${d.frame}`;
          $('liveNetwork').innerHTML = Visual.network(weights, {inputs:d.inputs, hidden, output:d.output});
          $('liveX1').textContent = Visual.f(d.inputs[0]);
          $('liveX2').textContent = Visual.f(d.inputs[1]);
          $('liveOutput').textContent = Visual.f(d.output);
          $('liveDecision').textContent = `${Visual.f(d.output,4)} ${d.output > .5 ? '> 0,5 → BATER ASAS' : '≤ 0,5 → NÃO BATER ASAS'}`;
          $('liveDecision').className = 'decision' + (d.output > .5 ? '' : ' wait');
          $('livePhysics').textContent = `Antes: y = ${Visual.f(d.yBefore,1)}; v = ${Visual.f(d.vBefore,1)}\nAção: ${d.output > .5 ? 'v ← −6' : 'manter v'}\nGravidade: v ← v + 0,3 = ${Visual.f(d.vAfter,1)}\nDepois: y = ${Visual.f(d.yAfter,1)} px`;
        }
      }
    }
    setTimeout(render, 100);
  }
  render();
})();
