const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const cors = require('cors')

const db = require('./db');

app.use(cors())

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(express.static('public'))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.get('/api/exercise/users', async (req, res) => {
  try {
    const users = await db.retrieveUsers();
    res.json([...users]);
  } catch (error) {
    res.json({ error });
  }
});

app.post('/api/exercise/new-user', async (req, res) => {
  try {
    const { username, _id } = await db.addUser(req.body.username);
    res.json({ username, _id });
  } catch (error) {
    res.json({ error });
  }
});

app.get('/api/exercise/log', async (req, res) => {
  try {
    const data = await db.retrieveEx(req.query);
    res.json({ ...data });
  } catch (error) {
    res.json({ error });
  }
});

app.post('/api/exercise/add', async (req, res) => {
  try {
    const data = await db.addEx(req.body);
    res.json({ ...data });
  } catch (error) {
    res.json({ error });
  }
});

/*
// Not found middleware
app.use((req, res, next) => {
  return next({ status: 404, message: 'not found' })
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})
*/
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
