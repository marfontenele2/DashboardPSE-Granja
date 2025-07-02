// js/components.js

/*
 * O objetivo deste arquivo é centralizar a criação de elementos HTML reutilizáveis,
 * como cards, botões, ou barras de progresso. A ideia é ter "fábricas de componentes".
 * Em vez de escrever o mesmo bloco de HTML várias vezes em lugares diferentes, você chamaria uma função daqui.
 * * Na versão atual da sua aplicação, a renderização é feita principalmente através da construção
 * de strings HTML diretamente nos arquivos `main.js` e `escolas.js`. Essa é uma abordagem
 * totalmente válida e eficiente. Este arquivo fica como um excelente exemplo de um padrão alternativo
 * que pode ser muito útil se a aplicação crescer e os componentes se tornarem mais complexos.
 */


/**
 * Cria um card simples para exibição de dados.
 * @param {string} title - O título do card.
 * @param {string} content - O conteúdo principal do card.
 * @param {string} [className=''] - Uma classe CSS opcional para estilização adicional.
 * @returns {HTMLElement} O elemento HTML do card, pronto para ser adicionado ao DOM.
 */
export function createCard(title, content, className = '') {
  // Cria o elemento <div> principal do card.
  const card = document.createElement('div');
  card.classList.add('card'); // Adiciona uma classe base para estilização.
  
  // Adiciona a classe extra, se fornecida.
  if (className) {
    card.classList.add(className);
  }

  // Cria e adiciona o título do card.
  const cardTitle = document.createElement('h3');
  cardTitle.textContent = title;
  card.appendChild(cardTitle);

  // Cria e adiciona o parágrafo de conteúdo.
  const cardContent = document.createElement('p');
  cardContent.textContent = content;
  card.appendChild(cardContent);

  return card;
}

// No futuro, você poderia adicionar mais funções de criação de componentes aqui.
// Ex: export function createProgressBar(percentage) { ... }
// Ex: export function createModal(title, body) { ... }