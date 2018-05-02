const mongoClient = require('mongodb').MongoClient;
const url = `mongodb://localhost:27017/db`;

mongoClient.connect(url, (err, client) => {
  console.log('connected')
  // エラー処理
  if (err) { return console.error(err); }

  const db = client.db('users');
  db.collection('data', (err, collection) => {
    if (err) { return console.error(err); }

    // 挿入するデータ
    const docs = [
      {name: "山口",   score: 20},
      {name: "大田",   score: 80},
      {name: "長本",   score: 100},
    ];

    collection.insert(docs, (err, result) => {
      // エラー処理
      if (err) { return console.dir(err); }
    });

    // 検索する
    collection.find().toArray((err,z items) => {
      console.log(items);
    });
  });
});