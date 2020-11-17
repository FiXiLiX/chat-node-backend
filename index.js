require('dotenv').config()
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const express = require('express')

const mongoose = require('mongoose')
const passport = require('passport')

const app = express()

app.use(bodyParser.urlencoded({extended: true}))
app.use(cookieParser())

require('./passport')
app.use(passport.initialize())

const authRoute = require('./routes/auth')

mongoose.connect(process.env.DATABASE_URL, {useNewUrlParser: true, useUnifiedTopology: true})
const db = mongoose.connection
db.on('error', (error) => {console.error(error)})
db.once('open', () => console.log('Database connected'))

app.use('/api/auth', authRoute)

app.listen(3000, () => console.log('Server started'))