# Flappy Learning — laboratório em português

Material didático do Prof. Mateus de Sousa Valente, baseado no projeto de xviniette.

## Abrir

Abra `index.html` no navegador ou use um servidor estático (por exemplo, Live Server no VS Code). Não é necessário instalar biblioteca de machine learning. As páginas didáticas funcionam sem CDN.

- `index.html`: jogo traduzido, com treinamento automático e velocidade ajustável.
- `rede-neural.html`: laboratório interativo dos seis pesos, usando a implementação real de `Neuroevolution.js`.
- `algoritmo-genetico.html`: explicação e laboratório de cruzamento e mutação.
- `neuroevolucao.html`: ciclo completo interativo, mapa do código e roteiro de aula.

## Implementação

Rede [2, [2], 1], sem bias, com sigmoide e seis pesos. Entradas: y do pássaro / altura da tela e altura do cano superior / altura da tela. Saída > 0,5 faz bater asas. Fitness: atualizações de simulação sobrevividas.

Algoritmo genético: população 50, elitismo 20%, indivíduos aleatórios 20%, mutação por peso 10%, amplitude 0,5. As configurações dos laboratórios são independentes do treinamento do jogo.

Para modificar o treinamento, edite as opções de `new Neuroevolution` em `game.js` e recarregue a página. A aleatoriedade não é semeada; repita experimentos e não espere melhora em toda geração.

## Créditos e licença

Original: https://github.com/xviniette/FlappyLearning

Fork: https://github.com/mateusvalente/FlappyLearning

Demonstração original: https://xviniette.github.io/FlappyLearning/

Licença MIT, conforme arquivo `License`, preservado no repositório. A rede e o algoritmo genético originais permanecem implementados em JavaScript, sem TensorFlow, Synaptic ou NEAT.

## Laboratórios visuais

As três páginas didáticas agora usam diagramas do jogo e controles ligados aos cálculos:

- **Rede neural:** alturas normalizadas, modo de visualização das entradas, seis pesos editáveis, contas da sigmoide e comparação antes/depois de um ciclo. Explica a diferença entre atualização da simulação, renderização e histórico de frames.
- **Algoritmo genético:** avaliação de dez redes, classificação por fitness, sorteios de cruzamento/mutação e teste de pais e filho na mesma pista.
- **Combinação:** oito microetapas da leitura do estado até a criação da próxima população, com valores reais e histórico por geração.

`aulas/motor.js` usa a rede e a reprodução de `Neuroevolution.js`. A simulação didática preserva a física e a ordem central de atualização do jogo, mas usa **10 indivíduos, uma pista repetível e limite de 720 ciclos**. Essas diferenças são identificadas nas páginas. O jogo principal continua com 50 indivíduos e canos aleatórios. Controles dos laboratórios não alteram o treinamento principal.

Os arquivos `aulas/*.js` separam motor, diagramas e controles de cada página. Não há dependência de CDN ou etapa de build para os laboratórios.

### Verificação

Com Node.js instalado, execute:

```sh
node tests/laboratorio.test.cjs
```

O teste compara a física com `game.js`, verifica a decisão no limiar 0,5, mutação de 0% e 100% e evolução por 12 gerações com preservação da elite.
