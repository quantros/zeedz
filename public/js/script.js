document.addEventListener('DOMContentLoaded', function() {
    const itemsContainer = document.getElementById('items');
    const charactersContainer = document.getElementById('characters');
    const searchItemsContainer = document.getElementById('searchItems');
    const searchCharactersContainer = document.getElementById('searchCharacters');
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');

    // Запрос для получения общего количества каждого предмета
    fetch('/cards/items')
        .then(response => response.json())
        .then(data => {
            for (let item of data) {
                let itemElement = document.createElement('div');
                itemElement.classList.add('grid-item');
                itemElement.innerHTML = `
                    <img src="/images/${encodeURIComponent(item.name)}.png" alt="${item.name} image">
                    <h2>${item.name}</h2>
                    <p>${item.count}</p>
                `;
                itemsContainer.appendChild(itemElement);
            }
        });

    // Запрос для получения общего количества каждого персонажа по редкости
    fetch('/cards/characters')
        .then(response => response.json())
        .then(data => {
            for (let character of data) {
                let characterElement = document.createElement('div');
                characterElement.classList.add('grid-item');
                characterElement.innerHTML = `
                    <img src="/images/${encodeURIComponent(character.rarity)}.png" alt="${character.rarity} image">
                    <h2>${character.rarity}</h2>
                    <p>${character.count}</p>
                `;
                charactersContainer.appendChild(characterElement);
            }
        });

        searchButton.addEventListener('click', function() {
          let query = encodeURIComponent(searchInput.value);
          fetch(`/cards/search/${query}`)
            .then(response => response.json())
            .then(data => {
              searchItemsContainer.innerHTML = '';
              searchCharactersContainer.innerHTML = '';
      
              data.forEach(card => {
                let cardElement = document.createElement('div');
                cardElement.classList.add('grid-item');
                cardElement.innerHTML = `
                  <img src="${card.card_pic}" alt="${card.name}">
                  <h2>${card.name}</h2>
                  ${card.edition ? `<p>Edition: ${card.edition}</p>` : ''}
                  ${card.evo ? `<p>Evo: ${card.evo}</p>` : ''}
                  ${card.rarity ? `<p>Rarity: ${card.rarity}</p>` : ''}
                  <p>Serial: ${card.serial}</p>
                  ${card.tCO2e ? `<p>tCO2e: ${card.tCO2e}</p>` : ''}
                  <p>Price: ${card.price}</p>
                  ${card.itemType ? `<p>Item Type: ${card.itemType}</p>` : ''}
                  <p>Owner: ${card.owner}</p>
                  <a href="${card.link}" target="_blank">Buy</a>
                  <button>Send message</button>
                `;
                if (card.rarity) {
                  searchCharactersContainer.appendChild(cardElement);
                } else {
                  searchItemsContainer.appendChild(cardElement);
                }
              });
          });
      });
      
          
});
