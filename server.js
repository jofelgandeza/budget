if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

const express = require('express')
const app = express()
const expressLayouts = require('express-ejs-layouts')
const bodyParser = require('body-parser')
const methodOverride = require('method-override')
const { model } = require('mongoose')

const indexRouter = require('./routes/index.js')
const adminRouter = require('./routes/admins.js')
// const coaRouter = require('./routes/coas.js')
// const sub_ledgerRouter = require('./routes/sub_ledgers.js')
// const cost_centerRouter = require('./routes/cost_centers.js')
const budgetRouter = require('./routes/budgets.js')
const budgetCOGRouter = require('./routes/centers.js')
const centsRouter = require('./routes/cents.js')
const branchesRouter = require('./routes/branches.js')
const unitsRouter = require('./routes/units.js')

const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
const bcrypt = require('bcrypt')
const Position = require('./models/position')
const { authUser, authRole } = require('./public/javascripts/basicAuth')
const { ROLE } = require('./public/javascripts/data')
const { forEach, isNull, isEmpty } = require('lodash')
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
const initializePassport = require('./public/javascripts/passport-config.js')

initializePassport(
    passport,
    email => users.find(user => user.email === email),
    id => users.find(user => user.id === id)
    )

let users = [ ]
// console.log (users)

app.use(express.json()) 
app.use(flash())
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(setUser)

app.use('/index', indexRouter)
// app.use('/coas', coaRouter)
// app.use('/sub_ledgers', sub_ledgerRouter)
app.use('/cents', centsRouter)
app.use('/budgets', budgetRouter)
app.use('/centers', budgetCOGRouter)
app.use('/units', unitsRouter)
app.use('/branches', branchesRouter)
app.use('/admins', adminRouter)
let locals = {}
app.locals.yuser = users
app.locals.userRole = ROLE

// console.log(app.locals.yuser)

app.get('/', checkAuthenticated, async (req, res) => {
    console.log(req.user)
    if (!isEmpty(req.user)) {
        const asignCode = _.trim(req.user.assCode)
        // req.user = user
            // res.redirect('/centers/' + user.assCode)
        // res.redirect('dashboards/' + user.assCode)
        if (req.user.role === "PO") {
            res.redirect('/centers/' + req.user.assCode)
            // next()
        }
        if (req.user.role === "PUH") {
            res.redirect('/units/' + asignCode)
            // next()
        }
        if (req.user.role === "BM") {
            res.redirect('/branches/' + req.user.assCode)
            // next()
        }
        if (req.user.role === "ADMIN") {
            res.redirect('/admins')
            // next()
        }
    } else {
        res.redirect('/login') 
        }
})

// app.get('/', checkAuthenticated, (req, res) => {
//     res.render('index.ejs', { name: req.user.name })
//   })
  
  app.get('/login', checkNotAuthenticated, (req, res) => {
    res.render('login.ejs')
  })
  
  app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
  }))
  
  app.get('/register', checkNotAuthenticated, (req, res) => {
    res.render('register.ejs')
  })
  
  app.post('/register', checkNotAuthenticated, async (req, res) => {
    try {
      const hashedPassword = await bcrypt.hash(req.body.password, 10)
      users.push({
        id: Date.now().toString(),
        name: req.body.name,
        email: req.body.email,
        password: hashedPassword
      })
      res.redirect('/login')
    } catch {
      res.redirect('/register')
    }
  })
  
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
  
  function setUser(req, res, next) {
    // const userId = req.user
    // console.log(user + "User atuy")
    // if (userId) {
    //   req.user = user  
    // }
    if (users.length === 0) {
        const Yusers = User.find({}, function (err, foundUsers) {
            users = foundUsers
        })
        // console.log(Yusers)
    }
    next()
  }


app.listen(process.env.PORT || 3000)