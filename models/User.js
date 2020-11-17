const mongoose = require('mongoose')
const nodemailer = require('nodemailer')

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        unique: true
    },
    username: {
        type: String,
        required: true,
    },
    password: {
        type: String,
    }
})

userSchema.methods.sendResetMail =async function (token){
    try {
        const testAccount = await nodemailer.createTestAccount()

        let transporter = nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
            user: testAccount.user, // generated ethereal user
            pass: testAccount.pass, // generated ethereal password
            },
        })

        let info = await transporter.sendMail({
            from: '"Fred Foo 👻" <foo@example.com>', // sender address
            to: "bar@example.com, baz@example.com", // list of receivers
            subject: "Hello ✔", // Subject line
            html: `
            <h2>Reset Token</h2>
            Please click on the button to reset the password: 
            <a href="localhost:3000/api/auth/reset-password/check/${this._id}/${token}">Link</a>
            `, // html body
        })

        console.log("Message sent: %s", info.messageId)
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info))
        return true
    } catch (error) {
        console.log(error);
        return false
    }
}

userSchema.methods.changePassword = async function (new_password){
    await this.update({password: new_password})
    return true
}

module.exports = mongoose.model('User', userSchema)