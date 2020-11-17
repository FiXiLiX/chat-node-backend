const router = require('express').Router()
const bcrypt = require('bcrypt')
const { param, body, validationResult } = require('express-validator')
const moment = require('moment')
const passport = require('passport')
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const UserPasswordReset = require('../models/UserPasswordReset')

router.post('/register',[
    body('username').isString().custom(username => {
        return User.findOne({username})
        .then(user => {
            if(user) return Promise.reject('Username already in use')
        })
    }),
    body('password').isString().isLength({min:5, max: 64}).trim(),
    body('email').isEmail().custom(email => {
        return User.findOne({email})
        .then(user => {
            if(user) return Promise.reject('Email already in use')
        })
    }).trim()
], async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

    const {username, password, email} = req.body

    const HASHCOST = 10

    try {
        const passwordHashed = bcrypt.hashSync(password, HASHCOST)
        const user = await User.create({username, email, password: passwordHashed})
        user.password = undefined
        res.status(200).json({user})
    } catch (error) {
        res.status(400).json({error})
    }
})

router.post('/login', [
    body('username').isString().trim(),
    body('password').isString().trim()
], (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

    passport.authenticate('local', {session: false}, (error, user) => {
        if(error)throw error
        if(!user)throw 'User not found'

        const payload = {
            username: user.username,
            expires: moment() + parseInt(process.env.JWT_EXPIRATION_MS)
        }

        req.login(payload, {session: false}, (error) => {
            if(error) throw error
            const token = jwt.sign(JSON.stringify(payload), process.env.SECRET)

            res.cookie('jwt', token, {httpOnly: true})
            user.password = undefined
            return res.status(200).json({user})
        })
    })(req, res, next)
})

router.post('/reset-password', [
    body('email').isEmail().custom(email => {
        return User.findOne({email})
        .then(user => {
            if(!user)return Promise.reject('There is no user with that email')
        })
    })
],async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
    const {email} = req.body
    try {
        const user =  await User.findOne({email})
        if(!user)throw 'There is no user with that email'
        const resetToken = await UserPasswordReset.createToken(user._id)
        await user.sendResetMail(resetToken.token)
        return res.status(200).json({msg: 'Reset Token succefuly sent, please check your email'})
    } catch (error) {
        return res.status(400).json({error})
    }
})

router.get('/reset-password/check/:user_id/:token', [
    param('token').isString().isLength(6),
    param('user_id').isString().custom(user_id => {
        return User.findById(user_id)
        .then(user => {
            if(!user)return Promise.reject('User with that ID does not exist')
        })
    })
] ,async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
    const {token, user_id} = req.params
    try {
        const activeToken = await UserPasswordReset.findActiveTokenByUser(user_id)
        return res.status(200).json({result: await activeToken.compareToken(token)?user_id:false})
    } catch (error) {
        return res.status(400).json({error})
    }
})

router.post('/reset-password/change', [
    body('user_id').isString().custom(user_id => {
        return User.findById(user_id)
        .then(user => {
            if(!user)return Promise.reject('User with that ID does not exist')
        })
    }),
    body('token').isString().isLength(6),
    body('new_password').isString().isLength({min: 5, max: 64}).trim()
],async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
    const {user_id, token, new_password} = req.body
    try {
        const activeToken = await UserPasswordReset.findActiveTokenByUser(user_id)
        const user  = await User.findById(user_id)
        user.changePassword(new_password)
        activeToken.delete()
        res.status(200).json({msg: 'Password reset'})
    } catch (error) {
        res.status(400).json({error})   
    }
})
module.exports = router