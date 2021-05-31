const { query } = require('express')
const express = require('express')
const { model } = require('mongoose')
const User = require('../models/user')

// const router  = express.Router()


const router  = express.Router()

router.get('/', (req, res) => {
    res.render('index')
})

router.post('/register', async (req, res) => {

    let locals
    let canProceed = false
    const userName = req.body.name

    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10)
        
        const getExistingUser = await User.findOne({name: userName}, function (err, foundUser) {
            console.log(foundUser)

            if (!err) {
                if (!foundUser) {
                    canProceed = true 
                } else {
                    canProceed = false
                    locals = {errorMessage: "USER already exist!"}
                }
            }
        })
        let user  = new User({

            userName: req.body.name,
            email: req.body.email,
            password: hashedPassword
        })
    
        if (canProceed) {
            const saveUser = user.save()
            res.redirect('/login')
        } else {
            res.redirect('/register')
        }

    } catch {
        console.log(err)
        res.redirect('/register')
    }
})


module.exports = router