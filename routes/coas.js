const express = require('express')
const router  = express.Router()
const Coa = require('../models/coa')

// All Chart of Accounts Route
router.get('/', async (req, res) => {
    let searchOptions = {}
    if (req.query.description  !=null && req.query.description !== '') {
        searchOptions.description = RegExp(req.query.description, 'i')
    }
    try {
        const coas = await Coa.find(searchOptions)
        res.render('coas/index', {
            coas: coas,
            searchOptions: req.query
        })
    } catch {
        res.redirect('/')
    }
})

// New Chart of Account Route
router.get('/new', (req, res) => {
    res.render('coas/new', { coa: new Coa() })
})

// Create Chart of Account
router.post('/', async (req, res) => {
const coa = new Coa({
    code: req.body.code,
    description: req.body.description,
    type: req.body.type
})
try {
    const newCoa = await coa.save()

    res.redirect('coas')
} catch {
   let locals = {errorMessage: 'Something went wrong.'}
    res.render('coas/new', {
            coa: coa,
            locals: locals
    })

}

})

module.exports = router