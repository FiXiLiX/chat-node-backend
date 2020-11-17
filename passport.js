require('dotenv').config()
const passport = require('passport')
const localStrategy = require('passport-local').Strategy
const jwtStrategy = require('passport-jwt').Strategy
const bcrypt = require('bcrypt')

const User = require('./models/User')

passport.use(new localStrategy({
    usernameField: 'username',
    passwordField: 'password'
},async (username, password, done) => {
    try {
        const user = await User.findOne({username})
        if(user == undefined) throw "Wrong username or password"
        const hashCompare = bcrypt.compareSync(password, user.password)
        if(hashCompare) return done(null, user)
        throw "Wrong username or password"
    } catch (error) {
        done(error)
    }
}))

passport.use(new jwtStrategy({
    jwtFromRequest: (req) => {return req.header('Authorization')},
    secretOrKey: process.env.SECRET
}, (jwtPayload, done) => {
    if(moment() > jwtPayload.expires) return done('JWT token expired')
    return done(null, jwtPayload)
}))