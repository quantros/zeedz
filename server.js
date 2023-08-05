const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const morgan = require('morgan');
const app = express();

let db = new sqlite3.Database('./cards.db', (err) => {
  if (err) {
    console.error('Error connecting to the cards database: ', err.message);
    return;
  }
  console.log('Connected to the cards database.');
});

db.run(`CREATE TABLE IF NOT EXISTS cards(
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
)`, (err) => {
  if (err) {
    console.error('Error creating the cards table: ', err.message);
    return;
  }
  console.log('Cards table ready.');
});

app.use(express.static(path.join(__dirname, 'public')));
app.get('/images/:name', function(req, res) {
    res.sendFile(path.join(__dirname, 'public/images', req.params.name));
});

app.get('/', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'views', 'index.html'));
});

// Запрос для получения общего количества каждого предмета
app.get('/cards/items', (req, res) => {
  db.all(`SELECT name, COUNT(*) as count FROM cards WHERE name IN ('Bucket of Water', 'Early Alpha Access', 'Early Beta Access', 'Exclusive Discord Role', 'Piece of Land') GROUP BY name`, [], (err, rows) => {
    if (err) {
      throw err;
    }
    res.json(rows);
  });
});

// Запрос для получения общего количества каждого персонажа по редкости
app.get('/cards/characters', (req, res) => {
  db.all(`SELECT rarity, COUNT(*) as count FROM cards WHERE name NOT IN ('Bucket of Water', 'Early Alpha Access', 'Early Beta Access', 'Exclusive Discord Role', 'Piece of Land') GROUP BY rarity`, [], (err, rows) => {
    if (err) {
      throw err;
    }
    res.json(rows);
  });
});

app.get('/cards/search/:query', (req, res) => {
  let query = decodeURIComponent(req.params.query);  
  db.all(`SELECT *, owner FROM cards WHERE serial = ? OR name = ? OR owner = ?`, [query, query, query], (err, rows) => {
    if (err) {
      throw err;
    }
    res.json(rows);
  });
});


app.get('/cards/serial/:serial', (req, res) => {
    const serial = req.params.serial;
    db.all(`SELECT *, owner FROM cards WHERE serial = ?`, [serial], (err, rows) => {
      if (err) {
        throw err;
      }
      res.json(rows);
    });
});

app.get('/cards/owner/:owner', (req, res) => {
  const owner = req.params.owner;
  db.all(`SELECT * FROM cards WHERE owner = ?`, [owner], (err, rows) => {
    if (err) {
      throw err;
    }
    res.json(rows);
  });
});


app.get('/cards/details', (req, res) => {
  db.all(`SELECT * FROM cards`, [], (err, rows) => {
    if (err) {
      throw err;
    }
    res.json(rows);
  });
}); 

app.use(function (err, req, res, next) {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(3000, () => console.log('Server ready.'));
