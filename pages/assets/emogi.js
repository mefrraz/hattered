// Ficheiro: /hattered.alpha/pages/assets/emoji.js
// VERSÃO FINAL RECOMENDADA - SEGURA E SEM NECESSIDADE DE CLASSES

(function() {
    'use strict';

const emojiMap = {
  // Caminho final e correto: /hattered/pages/assets/svg/
  '🚀': '/hattered/pages/assets/svg/rocket.svg',
  '🏠': '/hattered/pages/assets/svg/house.svg',
  '📖': '/hattered/pages/assets/svg/open_book.svg',
  '📚': '/hattered/pages/assets/svg/books.svg',
  '🛡️': '/hattered/pages/assets/svg/shield.svg',
  '📱': '/hattered/pages/assets/svg/mobile_phone.svg',
  '🧼': '/hattered/pages/assets/svg/soap.svg',
  '⚡': '/hattered/pages/assets/svg/lightning.svg',
  '🗂️': '/hattered/pages/assets/svg/card_index_dividers.svg',
  '🔄': '/hattered/pages/assets/svg/refresh.svg',
  '🔐': '/hattered/pages/assets/svg/locked_with_key.svg',
  '💸': '/hattered/pages/assets/svg/money_with_wings.svg',
  '🔓': '/hattered/pages/assets/svg/unlocked.svg',
  '🤝': '/hattered/pages/assets/svg/handshake.svg',
  '❤️': '/hattered/pages/assets/svg/heart.svg',
  '🌐': '/hattered/pages/assets/svg/globe.svg',
  '🏆': '/hattered/pages/assets/svg/trophy.svg',
  '🎬': '/hattered/pages/assets/svg/clapper_board.svg',
  '🎵': '/hattered/pages/assets/svg/musical_note.svg',
  '🎮': '/hattered/pages/assets/svg/video_game.svg',
  '💻': '/hattered/pages/assets/svg/laptop.svg',
  '🎨': '/hattered/pages/assets/svg/artist_palette.svg',
  '📡': '/hattered/pages/assets/svg/satellite_antenna.svg',
  '🍥': '/hattered/pages/assets/svg/fish_cake.svg',

  '🔍': '/hattered/pages/assets/svg/loupe.svg',
};

    function replaceEmojisInElement(rootElement) {
        if (!rootElement) return;

        // Expressão regular para encontrar qualquer um dos emojis do nosso mapa
        const emojiRegex = new RegExp(Object.keys(emojiMap).join('|'), 'g');
        
        // O TreeWalker percorre os nós da página de forma segura
        const treeWalker = document.createTreeWalker(rootElement, NodeFilter.SHOW_TEXT);
        const nodesToProcess = [];

        // Encontra todos os nós de texto que contêm emojis
        while (treeWalker.nextNode()) {
            const node = treeWalker.currentNode;
            if (node.parentElement.tagName !== 'SCRIPT' && node.parentElement.tagName !== 'STYLE' && node.nodeValue.match(emojiRegex)) {
                nodesToProcess.push(node);
            }
        }

        // Processa cada nó encontrado para substituir os emojis por imagens
        nodesToProcess.forEach(node => {
            const parent = node.parentNode;
            if (!parent) return;

            const fragment = document.createDocumentFragment();
            let lastIndex = 0;

            node.nodeValue.replace(emojiRegex, (match, offset) => {
                const textBefore = node.nodeValue.substring(lastIndex, offset);
                if (textBefore) {
                    fragment.appendChild(document.createTextNode(textBefore));
                }

                const imageUrl = emojiMap[match];
                if (imageUrl) {
                    const img = document.createElement('img');
                    img.src = imageUrl;
                    img.alt = match;
                    img.className = 'emoji-img';
                    fragment.appendChild(img);
                }
                lastIndex = offset + match.length;
            });

            const textAfter = node.nodeValue.substring(lastIndex);
            if (textAfter) {
                fragment.appendChild(document.createTextNode(textAfter));
            }

            parent.replaceChild(fragment, node);
        });
    }

    // =======================================================
    // ALTERAÇÃO PRINCIPAL: Alvo do script é agora o document.body
    // =======================================================
    window.addEventListener('load', () => {
        // Agora o script vai procurar em toda a página, incluindo a sidebar.
        replaceEmojisInElement(document.body);
    });

})();