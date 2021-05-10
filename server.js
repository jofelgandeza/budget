if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

const express = require('express')
const app = express()
const expressLayouts = require('express-ejs-layouts')
const bodyParser = require('body-parser')
const methodOverride = require('method-override')

const indexRouter = require('./routes/index.js')
const coaRouter = require('./routes/coas.js')
const sub_ledgerRouter = require('./routes/sub_ledgers.js')
const cost_centerRouter = require('./routes/cost_centers.js')
const budgetRouter = require('./routes/budgets.js')
const budgetCOGRouter = require('./routes/centers.js')
const branchesRouter = require('./routes/branches.js')
const unitsRouter = require('./routes/units.js')

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

app.use('/', indexRouter)
app.use('/coas', coaRouter)
app.use('/sub_ledgers', sub_ledgerRouter)
app.use('/cost_centers', cost_centerRouter)
app.use('/budgets', budgetRouter)
app.use('/centers', budgetCOGRouter)
app.use('/branches', branchesRouter)
app.use('/units', unitsRouter)

app.listen(process.env.PORT || 3000)