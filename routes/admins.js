
const express = require('express')
const router  = express.Router()
const app = express()
const bodyParser = require('body-parser')
const methodOverride = require('method-override')
const { model } = require('mongoose')
const bcrypt = require('bcrypt')
const User = require('../models/user')

// let LoggedUser = {}
// app.use(setSysUser)

router.get('/', async (req, res) => {
    // res.send('Admin Page')
    const logUser = req.user
    res.render('admins/index', {
        yuser : logUser
    })
})

router.get('/register', async (req, res) => {
    // res.send('User Registration Page!')
    res.render('admins/register')
})

router.post('/register', async (req, res) => {

    let locals
    let canProceed = false
    const userName = req.body.name
    const eMail = req.body.email
    const password = req.body.password
    const assCode = req.body.assCode
    const role = req.body.role
 
    try {
        const hashedPassword = await bcrypt.hash(password, 10)
        
        const getExistingUser = await User.findOne({name: userName}, function (err, foundUser) {
            // console.log(foundUser)

            if (!err) {
                if (!foundUser) {
                    canProceed = true 
                } else {
                    canProceed = false
                    locals = {errorMessage: "USER already exist!"}
                }
            }
        })
        if (canProceed) {
            let nUser  = new User({

                name: userName,
                email: eMail,
                password: hashedPassword,
                assCode: assCode,
                role: role
            })
        
               const saveUser = nUser.save()
            res.redirect('/login')
        } else {
            res.redirect('/register')
        }

    } catch (err) {
        console.log(err)
        res.redirect('/register')
    }
})  


router.get('/getAccess', async (req, res) => {
    res.send('User access page' + req.user.name)
})
// function setSysUser(req, res, next) {
//     const LogUser = req.user
//     if (LogUser) {
//         LoggedUser = LogUser
//     }
//     next()
//   }

module.exports = router