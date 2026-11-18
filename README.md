# 🧭 TRAMES
### Seu caminho, suas prioridades.

O melhor caminho depende de quem está caminhando.

O **Trames** é uma proposta de aplicativo que compara percursos a pé conforme as necessidades de cada pessoa. Além de distância e tempo, considera critérios que influenciam a autonomia e a experiência de deslocamento.

## 🌍 Ficha da CitizenTech

| Item | Descrição |
| --- | --- |
| **Solução** | Trames |
| **Tema** | Mobilidade urbana inclusiva e personalizada |
| **Problema** | O caminho mais curto pode conter escadas, calçadas irregulares e outras barreiras que dificultam o deslocamento. |
| **Público-alvo** | Pessoas que se deslocam a pé, com atenção às necessidades de pessoas com deficiência, pessoas idosas e pessoas com mobilidade reduzida. |
| **Proposta** | Comparar percursos e recomendar alternativas conforme a prioridade escolhida, explicando vantagens e limitações. |
| **Território do piloto** | Vila Oliveira, em Mogi das Cruzes — SP |
| **Valor esperado** | Mais autonomia e informação para escolher como se deslocar pela cidade. |
| **ODS** | **10** — Redução das Desigualdades · **11** — Cidades e Comunidades Sustentáveis |

## 📱 Como funciona

1. **Escolha o destino:** informe de onde vai sair e aonde deseja chegar.
2. **Defina sua prioridade:** acessibilidade, segurança relativa, orientação, conforto, menor esforço, rapidez ou equilíbrio.
3. **Compare os caminhos:** consulte distância, indicadores e limitações.
4. **Entenda a recomendação:** descubra por que uma alternativa atende melhor à sua necessidade.

A personalização considera o que importa naquele percurso, sem exigir diagnóstico ou declaração de deficiência.

## ✨ Escopo do MVP

- Busca de percursos entre os locais cadastrados.
- Seleção da prioridade de deslocamento.
- Comparação de rotas e explicação da recomendação.
- Visualização do caminho no mapa.
- Recálculo de rotas.

## 🧠 A lógica por trás dos caminhos

O módulo de **programação dinâmica em Python** consome uma base JSON exportada por Data Science para buscar, classificar e recalcular percursos.

A classificação utiliza o **custo de recomendação dos trechos**. Os resultados apresentam distância, **Índice de Adequação da Rota (IAR)** e scores disponíveis.

Antes da busca, o módulo valida os campos utilizados, incluindo distâncias e indicadores, para evitar que registros inválidos comprometam o cálculo.

> **Dados de demonstração:** a base do protótipo é simulada. As recomendações dependem das informações disponíveis e não garantem segurança ou acessibilidade.

## 🛠️ Tecnologias

| Tecnologia | Aplicação |
| --- | --- |
| **Lovable** | Protótipo da interface |
| **Python** | Módulo de programação dinâmica |
| **JSON** | Integração dos dados |
| **Oracle** | Modelo do banco relacional |
| **Git e GitHub** | Versionamento |

## ▶️ Executando o algoritmo

Coloque `trames.py` e `trames_base_integracao.json` na mesma pasta e execute:

```bash
python trames.py
```

Não é necessário instalar bibliotecas externas.

Esse comando executa o módulo Python no terminal. A integração com a interface e a geração do aplicativo instalável são etapas complementares.

## 👩‍💻 Equipe

| Integrante | RM |
| --- | --- |
| Giovanna Oliveira Ferreira Dias | 566647 |
| Maria Laura Pereira Druzeic | 566634 |
| Marianne Mukai Nishikawa | 568001 |

---

**FIAP · Engenharia de Software**  
Global Solution 2026.2 — CitizenTech
