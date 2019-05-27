const express = require('express')
const app = express()

app.get('/', (req, res) => res.sendFile('./listing.html', {root: __dirname}))

app.get('/buy/fifs', (req, res) => res.sendFile('./index.html', {root: __dirname}))

app.get('/sell', (req, res) => res.sendFile('./sell.html', {root: __dirname}))

app.get('/whois', (req, res) => res.sendFile('./whois.html', {root: __dirname}))

app.get('/buy/now/:record_id/', (req, res) => res.sendFile('./buy.html', {root: __dirname}))

app.get('/bid/:record_id/', (req, res) => res.sendFile('./buy.html', {root: __dirname}))

app.use('/static', express.static('static'))
app.listen(3000, () => console.log('example app on port 3000'))
