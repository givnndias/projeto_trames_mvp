# TRAMES

Seu caminho, suas prioridades.

## Ficha da CitizenTech

| Item | Descrição |
| --- | --- |
| Nome da solução | Trames |
| Tema | Mobilidade urbana inclusiva e personalizada |
| Problema | Percursos definidos apenas por distância e tempo podem conter barreiras e não atender às necessidades de cada pessoa. |
| Público-alvo | Pessoas que se deslocam a pé, especialmente pessoas com deficiência, pessoas idosas e pessoas com mobilidade reduzida. |
| Solução proposta | Aplicativo para comparar e recomendar percursos conforme as prioridades do usuário, explicando vantagens e limitações. |
| Prioridades | Acessibilidade, segurança relativa, orientação, conforto, menor esforço, rapidez e equilíbrio. |
| Território do piloto | Vila Oliveira, em Mogi das Cruzes — SP. |
| Valor esperado | Apoiar a autonomia e permitir escolhas de percurso mais adequadas às necessidades do cidadão. |
| ODS relacionados | ODS 10 — Redução das Desigualdades; ODS 11 — Cidades e Comunidades Sustentáveis. |

## Integrantes

| Nome | RM |
| --- | --- |
| Giovanna Oliveira Ferreira Dias | 566647 |
| Maria Laura Pereira Druzeic | 566634 |
| Marianne Mukai Nishikawa | 568001 |

## Funcionalidades previstas no MVP

- Seleção de origem e destino.
- Escolha da prioridade de deslocamento.
- Busca e comparação de rotas.
- Explicação da recomendação.
- Visualização do percurso no mapa.
- Recálculo de rotas.

## Algoritmo e dados

O módulo de programação dinâmica utiliza uma base JSON exportada por Data Science para buscar, classificar e recalcular caminhos.

A classificação considera o custo de recomendação dos trechos. Os resultados apresentam distância, Índice de Adequação da Rota (IAR) e scores disponíveis.

Os dados do protótipo são simulados. As recomendações não representam garantia de segurança ou acessibilidade.

## Tecnologias

- Lovable: protótipo da interface.
- Python: módulo de programação dinâmica.
- JSON: integração dos dados.
- Oracle: modelo do banco relacional.
- Git e GitHub: versionamento.

## Execução do algoritmo

Coloque `trames.py` e `trames_base_integracao.json` na mesma pasta e execute:

    python trames.py

Não é necessário instalar bibliotecas externas.

Esse comando executa apenas o módulo Python no terminal. A integração com a interface e a geração do aplicativo instalável são etapas complementares.

## Contexto acadêmico

Engenharia de Software — FIAP  
Global Solution 2026.2 — CitizenTech
