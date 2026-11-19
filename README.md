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

## 🧭 Como consultar uma rota

1. Acesse o **[protótipo do Trames](https://givnndias.github.io/projeto_trames_mvp/)**.
2. Selecione a **origem** e o **destino**.
3. Toque em **Escolher prioridade** e selecione o que importa naquele percurso.
4. Toque em **Comparar rotas** para consultar as alternativas.
5. Abra **Ver detalhes** para entender a recomendação, os recursos e as limitações.
6. Toque em **Iniciar percurso** para acompanhar as etapas da demonstração.

### Percursos disponíveis

- **Estação Central ↔ Biblioteca Municipal**
- **Praça Vila Oliveira ↔ Mercado Municipal**

### Sugestão de teste

Pesquise de **Estação Central** para **Biblioteca Municipal**:

- Com **Rapidez**, observe a recomendação da rota de **600 metros**.
- Com **Acessibilidade**, observe a alternativa de **850 metros**, que evita escadas.

> Os percursos, os indicadores e o acompanhamento são demonstrativos. O mapa é esquemático e não representa navegação por GPS em tempo real.

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
