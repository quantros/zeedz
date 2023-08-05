const puppeteer = require('puppeteer');
const sqlite3 = require('sqlite3');
const sqlite = require('sqlite');

const parseCards = async () => {
  console.log('Инициализация скрипта...');
  
  console.log('Подключение к базе данных карт...');
  const db = await sqlite.open({
    filename: './cards.db',
    driver: sqlite3.Database
  });
  console.log('Подключено к базе данных карт.');

  console.log('Создание таблицы карт, если она не существует...');
  await db.run(`CREATE TABLE IF NOT EXISTS cards(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    card_pic TEXT,
    link TEXT,
    rarity TEXT,
    serial TEXT,
    edition TEXT,
    evo TEXT,
    tCO2e TEXT,
    price TEXT,
    owner TEXT,
    itemType TEXT
  )`);
  console.log('Таблица карт готова.');

  console.log('Запуск браузера...');
  const browser = await puppeteer.launch();
  console.log('Браузер запущен.');

  console.log('Создание новой страницы...');
  const pages = await Promise.all(Array(15).fill(0).map(_ => browser.newPage()));
  console.log(`${pages.length} новых страниц созданы.`);

  console.log('Переход на веб-сайт...');
  await Promise.all(pages.map(page => page.goto('https://play.zeedz.io/marketplace?limit=16000')));
  console.log('Веб-сайт загружен на каждой странице.');

  console.log('Ожидание 20 секунд на каждой странице...');
  await Promise.all(pages.map(page => page.waitForTimeout(20000)));
  console.log('Ожидание завершено на каждой странице.');

  console.log('Парсинг ссылок на карты и изображений на каждой странице...');
  const cardsArrays = await Promise.all(pages.map(page => page.evaluate(() => {
    const cardEls = document.querySelectorAll('.listing-card');
    const cardData = [];
    for (const cardEl of cardEls) {
      const linkEl = cardEl.querySelector('.listing-card-content a');
      const imgEl = cardEl.querySelector('.listing-card-img img');
      
      const link = 'https://play.zeedz.io' + linkEl.getAttribute('href');
      const card_pic = imgEl ? imgEl.src : null;

      cardData.push({ link, card_pic });
    }
    return cardData;
  })));
  const cards = cardsArrays.flat();
  console.log(`Найдено ${cards.length} ссылок на карты и изображений на всех страницах.`);

  

  console.log('Обработка ссылок на карты и изображений...');
  for (let i = 0; i < cards.length; i++) {
    const cardLink = cards[i].link;
    const cardPic = cards[i].card_pic;

    console.log(`Обработка ссылки на карту ${i + 1} из ${cards.length}.`);

    console.log(`Переход на страницу деталей карты по ссылке ${cardLink}...`);
    await page.goto(cardLink);
    console.log(`Страница деталей карты по ссылке ${cardLink} загружена.`);

    console.log('Ожидание 5 секунд для полной загрузки страницы...');
    await page.waitForTimeout(5000);

    console.log(`Парсинг деталей карты...`);
    const cardDetails = await page.evaluate((cardLink) => {
      const nameEl = document.querySelector('h2');
      const rarityEl = document.querySelectorAll('.purchase-details-item-value')[1];
      const serialEl = document.querySelectorAll('.purchase-details-item-value')[3];
      const editionEl = document.querySelectorAll('.purchase-details-item-value')[2];
      const evoEl = document.querySelectorAll('.purchase-details-item-value')[2];
      const tCO2eEl = document.querySelectorAll('.purchase-details-item-value')[5];
      const priceEl = document.querySelector('.purchase-details-price');
      const ownerEl = document.querySelectorAll('.purchase-details-item-value')[4];
      const itemTypeEl = document.querySelectorAll('.purchase-details-item-value')[0];

      const name = nameEl ? nameEl.innerText : null;
      const link = cardLink;
      const rarity = rarityEl ? rarityEl.innerText : null;
      const serial = serialEl ? serialEl.innerText : null;
      const edition = editionEl ? editionEl.innerText : null;
      const evo = evoEl ? evoEl.innerText : null;
      const tCO2e = tCO2eEl ? tCO2eEl.innerText : null;
      const price = priceEl ? priceEl.innerText : null;
      const owner = ownerEl ? ownerEl.innerText : null;
      const itemType = itemTypeEl ? itemTypeEl.innerText : null;
      
      return {
        name, 
        link, 
        rarity, 
        serial, 
        edition, 
        evo, 
        tCO2e, 
        price, 
        owner,
        itemType
      };
    }, cardLink);

    cardDetails.card_pic = cardPic;

    console.log(`Парсинг деталей карты завершен: `, cardDetails);

    console.log(`Проверка, существует ли карта ${cardDetails.name} в базе данных...`);
    const existingCard = await db.get('SELECT * FROM cards WHERE serial = ?', cardDetails.serial);
    if (existingCard) {
      console.log(`Обновление карты ${cardDetails.name} в базе данных.`);
      await db.run(`UPDATE cards SET name = ?, card_pic = ?, link = ?, rarity = ?, serial = ?, edition = ?, evo = ?, tCO2e = ?, price = ?, owner = ?, itemType = ? WHERE serial = ?`,
        cardDetails.name, cardDetails.card_pic, cardDetails.link, cardDetails.rarity, cardDetails.serial, cardDetails.edition, cardDetails.evo, cardDetails.tCO2e, cardDetails.price, cardDetails.owner, cardDetails.itemType, cardDetails.serial);
      console.log(`Карта ${cardDetails.name} обновлена в базе данных.`);
    } else {
      console.log(`Добавление карты ${cardDetails.name} в базу данных.`);
      await db.run(`INSERT INTO cards(name, card_pic, link, rarity, serial, edition, evo, tCO2e, price, owner, itemType) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        cardDetails.name, cardDetails.card_pic, cardDetails.link, cardDetails.rarity, cardDetails.serial, cardDetails.edition, cardDetails.evo, cardDetails.tCO2e, cardDetails.price, cardDetails.owner, cardDetails.itemType);
      console.log(`Карта ${cardDetails.name} добавлена в базу данных.`);
    }
  }

  console.log('Обработка ссылок на карты завершена.');

  console.log('Закрытие браузера...');
  await browser.close();
  console.log('Браузер закрыт.');

  console.log('Закрытие подключения к базе данных...');
  await db.close();
  console.log('Подключение к базе данных закрыто.');

  console.log('Парсер завершил работу.');

  // Schedule the next run
  setTimeout(parseCards, 3600000); // Run every hour
};

// Start parsing
parseCards();

console.log('Скрипт завершен.');
