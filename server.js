const https = require('https')
const express = require('express')
const cron = require('node-cron');
const bodyParser = require("body-parser");
const fs = require('fs')
const { database } = require('./src/database');

const db = database();
db.init();

const app = express();
const port = 3000;
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.status(200).send("Hello World")
})

// return string
app.post('/verification_code', (req, res) => {
  const vCode = req.body.verificationCode;
  db.insertVerificationCode(vCode).then(value => {
    res.status(200).send(value);
  }).catch(err => {
    res.status(500).send(err.message);
  });
});

// return String
app.post('/security_code', (req, res) => {
  const list = req.body.secrets;
  const vCode = req.body.verificationCode;
  db.checkVerificationCode(vCode).then(id => {
    db.insertSecretCode(list);
    // assume that above execution without error
    db.deleteUsedVerificationCode(id);
    res.status(200).send("OK");
  }).catch(err => {
    res.status(401).send("unknown Verification Code");
  })
})

// return JSON
app.get('/get_secret_list', (req, res) => {
  db.getSecretList().then(value => {
    res.status(200).send(JSON.stringify(value));
  }).catch(err => {
    res.status(500).send(err);
  });
});

// run every 1st of months
cron.schedule('* * 1 * *', function () {
  db.cleanExpiredSecret();
});

https.createServer({
  key: fs.readFileSync('server.key'),
  cert: fs.readFileSync('server.cert')
}, app).listen(port, () => {
  console.log(`Example app listening at https://localhost:${port}`)
})

// app.listen(port, () => {
//   console.log(`Example app listening at http://localhost:${port}`)
// })