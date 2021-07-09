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
// const router  = express.Router()
const bcrypt = require('bcrypt')
// const suser = require('./data.js')
const User = require('./models/user')
const Position = require('./models/position')
const { authUser, authRole } = require('./public/javascripts/basicAuth')
const { ROLE } = require('./public/javascripts/data')
const { forEach, isNull, isEmpty } = require('lodash')
const _ = require('lodash')

let user = []
app.set('view engine', 'ejs')
app.set('views', __dirname + '/views')
app.set('layout', 'layouts/layout')
app.use(expressLayouts)
app.use(methodOverride('_method'))

app.use(express.static('public'))
// app.use(express.json()) 
// app.use(express.urlencoded()) 
//Parse URL-encoded bodies
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

const mongoose = require('mongoose')
mongoose.connect(process.env.DATABASE_URL, {
    useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false })
const db = mongoose.connection
db.on('error', error => console.error(error))
db.once('open', () => console.log('Connected to Mongo Database'))

const initializePassport = require('./public/javascripts/passport-config.js')

initializePassport(
    passport,
    email => user.find(user => user.email === email),
    id => user.findById(user => user._id === id)
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
app.locals.yuser = user
app.locals.userRole = ROLE

// console.log(app.locals.yuser)

app.get('/', async (req, res) => {
    // console.log(user.role)
    if (isEmpty(user)) {
        res.redirect('/login') 
    } else {
        const asignCode = _.trim(user.assCode)
        req.user = user
            // res.redirect('/centers/' + user.assCode)
        // res.redirect('dashboards/' + user.assCode)
        if (user.role === "PO") {
            res.redirect('/centers/' + user.assCode)
            // next()
        }
        if (user.role === "PUH") {
            res.redirect('/units/' + asignCode)
            // next()
        }
        if (user.role === "BM") {
            res.redirect('/branches/' + user.assCode)
            // next()
        }
        if (user.role === "ADMIN") {
            res.redirect('/admins')
            // next()
        }
    }
})

// app.get('/dashboard', authUser, (req, res) => {
//     res.send('Dashboard page.')
// })

app.get('/login', async (req, res) => {
        if (isEmpty(locals)) {
            res.render('login.ejs')
        } else {
            res.render('login.ejs', {
                locals: locals
            })            
        }
    
})

app.post('/login', async (req, res) => {
    let fnduser = []
   const sysUser = await User.findOne({email: req.body.email}, function (err, foundUser) {
        fnduser = foundUser
        user = foundUser
    })
    if (fnduser == null) {
        locals = {errorMessage: 'Cannot find user!'}
    //   return res.status(400).send('Cannot find user')
    }
    try {
        // console.log(fnduser.email)
      if(await bcrypt.compare(req.body.password, fnduser.password)) {
          req.user = fnduser
        //   next()
        res.redirect('/')
      } else {
        // req.user = []
        locals = {errorMessage: 'Username / Password incorrect!'}
        res.render('login.ejs', {
            locals: locals
        })            
}
    } catch {
      res.status(500).send()
    }
})

app.get('/logout', async (req, res) => {
    user = []
    req.user = []
    app.locals.yuser = []
    res.redirect('/login') 
    
})

function setUser(req, res, next) {
    const userId = user.email
    console.log(user + "User atuy")
    if (userId) {
      req.user = user
      
    }
    next()
  }


app.listen(process.env.PORT || 3000)