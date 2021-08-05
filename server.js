if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

const express = require('express')
const app = express()
const expressLayouts = require('express-ejs-layouts')
const bodyParser = require('body-parser')
const methodOverride = require('method-override')
const { model } = require('mongoose')
const { lookup } = require('geoip-lite')

const adminRouter = require('./routes/admins.js')
const budgetRouter = require('./routes/budgets.js')
const budgetCOGRouter = require('./routes/centers.js')
const branchesRouter = require('./routes/branches.js')
const unitsRouter = require('./routes/units.js')

const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
const bcrypt = require('bcrypt')
const { authUser, authRole } = require('./public/javascripts/basicAuth')
const { ROLE } = require('./public/javascripts/data')
const _ = require('lodash')


app.set('view engine', 'ejs')
app.set('views', __dirname + '/views')
app.set('layout', 'layouts/layout')
app.use(expressLayouts)
app.use(methodOverride('_method'))

app.use(express.static('public'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

const mongoose = require('mongoose')
mongoose.connect(process.env.DATABASE_URL, {
    useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false })

const db = mongoose.connection
db.on('error', error => console.error(error))
db.once('open', () => console.log('Connected to Mongo Database'))

const User = require('./models/user')
const Position = require('./models/position')
const Employee = require('./models/employee')
const User_log = require('./models/user_log')

let users = [ ]
// console.log (users)
app.use(setUser)

const initializePassport = require('./public/javascripts/passport-config.js')

initializePassport(
    passport,
    email => users.find(user => user.email === email),
    id => users.find(user => user.id === id)
    )

app.use(express.json()) 
app.use(flash())
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())

app.use('/budgets', budgetRouter)
app.use('/centers', budgetCOGRouter)
app.use('/units', unitsRouter)
app.use('/branches', branchesRouter)
app.use('/admins', adminRouter)

// let locals = {}
app.locals.yuser = users
app.locals.posisyon = []
app.locals.userRole = ROLE

app.get('/', checkAuthenticated, async (req, res) => {
    console.log(req.user)
    if (req.user == null) {
      res.redirect('/login') 
    } else {

        const asignCode = _.trim(req.user.assCode)
        const yuserRole = req.user.role
        
          if (req.user.role === "PO") { 
              res.redirect('/centers/' + asignCode)
          } else if (req.user.role === "PUH" ) { 
              res.redirect('/units/' + asignCode)
          } else if (req.user.role === "BM") { 
            res.redirect('/branches/' + asignCode)
          }
          else if (req.user.role === "ADMIN") { 
            res.redirect('/admins') 
          }
    } 
  })
  
  app.get('/login', checkNotAuthenticated, (req, res) => {
    res.render('login.ejs')
  })
  
  app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
  }))
  
  app.delete('/logout', (req, res) => {
    req.logOut()
    res.redirect('/login')
  })
  
  function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next()
    }
  
    res.redirect('/login')
  }
  
  function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return res.redirect('/')
    }
    next()
  }
  
  async function setUser(req, res, next) {

      users = await User.find()
      posisyon = await Position.find({group_code: "BRN"})

      next()
  }


app.listen(process.env.PORT || 3000)

    // const ip = (req.headers['x-forwarded-for'] || req.connection.remoteAddress)
    // console.log(ip) // ip address of the user
    // console.log(lookup(ip)) // location of the user

    // let loggedUser = new User_log({
    //   IP: ip,
    //   login_date: new Date(),
    //   user_name: req.user.name,
    //   assign_code: req.user.assCode,
    //   activity: "Login",
    //   activity_desc: "User logged-in.",
    //  })
    //   const saveLogUser = loggedUser.save()

