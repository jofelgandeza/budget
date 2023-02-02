const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy

const bcrypt = require('bcryptjs')
const User = require('../models/user')

    function initialize(passport, getUserByEmail, getUserById) {
        const authenticateUser = async (email, password, done) => {
            const user = getUserByEmail(email)
            //  console.log(user)
            if(user == null) {
                return done(null, false, {message: 'No user with that email.'})
            } else if (user.name === '') {
                user.name = 'VACANT'
            } 

            try {
                if (await bcrypt.compare(password, user.password)) {
                    return done(null, user)
                } else {
                    return done(null, false, {message: 'Password incorrect.'})
                }

            } catch (e) {
                return done(e)
            }
        }
        passport.use(new LocalStrategy({usernameField: 'email'}, authenticateUser ))
        passport.serializeUser((user, done) => done(null,user.id))
        passport.deserializeUser(function(id, done) {
            User.findById(id, function (err, user) {
              done(err, user)
            })
          })
        // passport.deserializeUser((id, done) => {
        //     return done(null, getUserById(id))
        // })
    }

module.exports = initialize