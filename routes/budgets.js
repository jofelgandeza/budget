const { query } = require('express')
const express = require('express')
const { model } = require('mongoose')
//const coa = require('../models/coa')
const router  = express.Router()
const Coa = require('../models/coa')
const Sub_ledger = require('../models/sub_ledger')
const Cost_center = require('../models/cost_center')
const Budget = require('../models/budget')

// All Sub-Ledger Accounts Route
router.get('/', async (req, res) => {
    let searchOptions = {}
    if (req.query.description  !=null && req.query.description !== '') {
        searchOptions.description = RegExp(req.query.description, 'i')
    }
    try {
        const sub_ledgers = await Sub_ledger.find(searchOptions)
        res.render('sub_ledgers/index', {
            sub_ledgers: sub_ledgers,
            searchOptions: req.query
        })
    } catch {
        res.redirect('/sub_ledgers')
    }
})

// New Budget Route
router.get('/new', async (req, res) => {
    try {
        const coas = await Coa.find({})
        const sub_ledgers = await Sub_ledger.find({})
        const cost_centers = await Cost_center.find({})
        const budget = new Budget()
        res.render('budgets/new', {
            coas: coas,
            sub_ledgers: sub_ledgers,
            cost_centers: cost_centers,
            budget: budget
        })

    } catch {
        res.redirect('sub_ledgers')
    }
})

// Create Sub-Ledger Route
router.post('/', async (req, res) => {
    const sub_ledger = new Sub_ledger({
        code: req.body.code,
        description: req.body.description,
        type: req.body.type,
        coa: req.body.coa,
        createAt: req.body.createDate
    })
    try {
        const newSub_ledger = await sub_ledger.save()
        //res.redirect(`sub_ledgers/${newSub-Ledger.id}`)
        res.redirect('sub_ledgers')
    } catch {

    }
})

router.get('/:id', async (req, res) => {
    const sub_ledger = await Sub_ledger.findById(req.params.id)
    res.send('Show Sub-Ledger account ' + sub_ledger.description)
})


// Edit Sub-Ledger Account
router.get('/:id/edit', async (req, res) => {
    try {
        const sub_ledger = await Sub_ledger.findById(req.params.id)
        const coas = await Coa.find({})
        res.render('sub_ledgers/edit', { sub_ledger: sub_ledger, coas: coas })

    } catch {
        res.redirect('/sub_ledgers')
    }
})

router.put('/:id', async (req, res) => {
    // const sub_ledger = new Sub_ledger({
    //     code: req.body.code,
    //     description: req.body.description,
    //     type: req.body.type
   let sub_ledger

    try {
  //      coas = await Coa.find({})
        sub_ledger = await Sub_ledger.findById(req.params.id)
        sub_ledger.code = req.body.code
        sub_ledger.description = req.body.description
        sub_ledger.type = req.body.type
        sub_ledger.createAt = req.body.createDate
        sub_ledger.coa = req.body.coa

        await sub_ledger.save()  
        res.redirect('/sub_ledgers')
        //res.redirect(`/sub_ledgers/${sub_ledger.id}`)
    } catch (err) {
        console.log(err)
        if (sub_ledger == null) {
            res.redirect('/sub_ledgers')
        } else {
            let locals = {errorMessage: 'Something went wrong.'}
            res.render('sub_ledgers/edit', {
                    sub_ledger: sub_ledger,
                    locals: locals
        })
      }   
      }
    })

router.delete('/:id', (req, res) => {
    res.send('Delete Sub-Ledger account ' + req.params.id)
})

module.exports = router