if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

const express = require('express')
const app = express()
const expressLayouts = require('express-ejs-layouts')
const bodyParser = require('body-parser')
const methodOverride = require('method-override')
const { model } = require('mongoose')
// const { lookup } = require('geoip-lite')

const adminRouter = require('./routes/admins.js')
const budgetRouter = require('./routes/budgets.js')
const branchesRouter = require('./routes/branches.js')
const regionsRouter = require('./routes/regions.js')
const areasRouter = require('./routes/areas.js')
const unitsRouter = require('./routes/units.js')
const budgetCOGRouter = require('./routes/centers.js')
const dedsRouter = require('./routes/deds.js')
const coasRouter = require('./routes/coas.js')
const cost_center = require('./routes/cost_centers.js')
const budget = require('./routes/budgets.js')


const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
const bcrypt = require('bcryptjs')
const { authUser, authRole } = require('./public/javascripts/basicAuth')
const { ROLE } = require('./public/javascripts/data')
const _ = require('lodash')


app.set('view engine', 'ejs')
app.set('views', __dirname + '/views')
app.set('layout', 'layouts/layout')
app.use(expressLayouts)
app.use(methodOverride('_method'))

app.use(express.static('public'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(function (req, res, next) {
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');
  next()
});

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
const Setting = require('./models/setting')

// let users = [ ]
// console.log (users)
app.locals.users = [ ]

app.use(setUser)
app.locals.yuser = ""
app.locals.posisyon = []
app.locals.userRole = ROLE
app.locals.budgetMode = ""
app.locals.budget_Year = ""

app.use(express.json()) 
app.use(flash())

const oneDay = 1000 * 60 * 60 * 24

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  expires: 90000,
  saveUninitialized: false
}))


app.use(passport.initialize())
app.use(passport.session())

const initializePassport = require('./public/passport-config.js')

initializePassport(
    passport,
    email => users.find(user => user.email === email),
    id => users.find(user => user.id === id)
    )

app.use('/budgets', budgetRouter)
app.use('/centers', budgetCOGRouter)
app.use('/units', unitsRouter)
app.use('/branches', branchesRouter)
app.use('/areas', areasRouter)
app.use('/regions', regionsRouter)
app.use('/deds', dedsRouter)
app.use('/admins', adminRouter)
app.use('/coas', coasRouter)
app.use('/cost_centers', cost_center)
app.use('/budgets', budget)


// let locals = {}
app.get('/', checkAuthenticated, async (req, res) => {
    console.log(req.user)
    yuser = req.user
    if (req.user == null) {
      res.redirect('/login') 
    } else {
        console.log(yuser)

        const asignCode = _.trim(req.user.assCode)        
          if (req.user.role === "PO") { 
              res.redirect("/centers/" + asignCode)
          } else if (req.user.role === "PUH" ) { 
              res.redirect("/units/" + asignCode)
          } else if (req.user.role === "BM") { 
            res.redirect("/branches/" + asignCode)
          } else if (req.user.role === "AM") { 
            res.redirect("/areas/" + asignCode)
          } else if (req.user.role === "RD") { 
            res.redirect("/regions/" + asignCode)
          } else if (req.user.role === "DED") { 
            res.redirect("/deds/" + asignCode)
          }
          else if (req.user.role === "ADMIN") { 
              res.redirect("/admins/" + asignCode) 
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
    if (req.user == null) {
      users = await User.find()
      posisyon = await Position.find({})
      budget_Year = await Setting.find({})
    }
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

