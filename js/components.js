// components.js
// Este arquivo conterá funções para criar elementos HTML reutilizáveis (componentes).

/**
 * Cria um card simples para exibição de dados.
 * @param {string} title O título do card.
 * @param {string} content O conteúdo principal do card.
 * @param {string} [className=''] Uma classe CSS opcional para estilização adicional.
 * @returns {HTMLElement} O elemento HTML do card.
 */
export function createCard(title, content, className = '') {
  const card = document.createElement('div');
  card.classList.add('card');
  if (className) {
    card.classList.add(className);
  }

  const cardTitle = document.createElement('h3');
  cardTitle.textContent = title;
  card.appendChild(cardTitle);

  const cardContent = document.createElement('p');
  cardContent.textContent = content;
  card.appendChild(cardContent);

  return card;
}

// Você pode adicionar mais funções para criar outros componentes UI aqui.
// Ex: createCheckbox, createProgressBar, etc.