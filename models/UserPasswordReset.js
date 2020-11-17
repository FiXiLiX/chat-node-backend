const mongoose = require('mongoose')
const moment = require('moment')
const randomstring = require('randomstring')


const UserPasswordResetSchema = mongoose.Schema({
    user_id: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'User',
        required: true
    },
    token: {
        type: String,
        required: true,
        default: randomstring.generate(6)
    },
    created_at: {
        type: Date,
        required: true,
        default: moment()
    },
    expire_at: {
        type: Date,
        required: true,
        default: moment().add('20', 'minutes')
    },
    guess_remaining: {
        type: Number,
        required: true,
        default: 5
    }
})
UserPasswordResetSchema.statics.createToken = async function(user_id){
    await this.deleteMany({user_id})
    return this.create({user_id})
}

UserPasswordResetSchema.statics.findActiveTokenByUser = async function (user_id){
    return new Promise(async (cb, err) => {
        try {
            const token = await this.findOne({user_id, expire_at: {$gt: moment()}, guess_remaining: {$gt: 0}})
            if(!token)throw 'There is no such token or token already expired' 
            cb(token)
        } catch (error) {
            err(error)
        }
    })
}

UserPasswordResetSchema.methods.compareToken = async function (token) {
    const cmp = token === this.token
    if(!cmp)await this.update({guess_remaining: this.guess_remaining - 1})
    return cmp
} 

module.exports = mongoose.model('UserPasswordReset', UserPasswordResetSchema)