const { query } = require('express')
const express = require('express')
const { model } = require('mongoose')
//const coa = require('../models/coa')
const router  = express.Router()
const Coa = require('../models/coa')
const Sub_ledger = require('../models/sub_ledger')
const Cost_center = require('../models/cost_center')
const Budget = require('../models/budget')
const Cleave = require('../public/javascripts/cleave.js')
const _ = require('lodash')


//const cleave = new Cleave('.amount', {
//    numeral: true,
//    numeralThousandGroupStyle: 'thousand'
// })
// console.log(Cleave)

// All Sub-Ledger Accounts Route
router.get('/', async (req, res) => {
    let searchOptions = {}
    if (req.query.description  !=null && req.query.description !== '') {
        searchOptions.description = RegExp(req.query.description, 'i')
    }
    try {
        const budgets = await Budget.find(searchOptions)

        const coas = await Coa.find({})
        console.log(coas)
        res.render('budgets/index', {
            budgets: budgets,
            coas: coas,
            searchOptions: req.query
        })
    } catch (err) {
//        console.log(err)
        res.redirect('/budgets')
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
        res.redirect('/budgets')
    }
})

// Create Budget Route
router.post('/', async (req, res) => {
  
    const jan = _.toNumber(_.replace(req.body.january,',',''))
    const feb =  _.toNumber(_.replace(req.body.february,',',''))
    const mar = _.toNumber(_.replace(req.body.march,',',''))
    const apr = _.toNumber(_.replace(req.body.april,',',''))
    const may = _.toNumber(_.replace(req.body.may,',',''))
    const jun = _.toNumber(_.replace(req.body.june,',',''))
    const jul = _.toNumber(_.replace(req.body.july,',',''))
    const aug = _.toNumber(_.replace(req.body.august,',',''))
    const sep = _.toNumber(_.replace(req.body.september,',',''))
    const oct = _.toNumber(_.replace(req.body.october,',',''))
    const nov = _.toNumber(_.replace(req.body.november,',',''))
    const dec = _.toNumber(_.replace(req.body.december,',',''))
    const total = jan + feb + mar + apr + may + jun + jul + aug + sep + oct + nov + dec

    const budget = new Budget({
        user: req.body.user,
        department: req.body.department,
        coa: req.body.coa,
        sub_ledger: req.body.subLedger,
        cost_center: req.body.costCenter,
        january: jan,
        february: feb,
        march: mar,
        april: apr,
        may: may,
        june: jun,
        july: jul,
        august: aug,
        september: sep,
        october: oct,
        november: nov,
        december: dec,
        total: total,
        type: req.body.type,
        createAt: req.body.createDate
    })

    try {
        const newBudget = await budget.save()

        seekCoa = await Coa.findById(req.body.coa)
        console.log(seekCoa)

        curJanBudget = seekCoa.budget_jan
        curFebBudget = seekCoa.budget_feb
        curMarBudget = seekCoa.budget_mar
        curAprBudget = seekCoa.budget_apr
        curMayBudget = seekCoa.budget_may
        curJunBudget = seekCoa.budget_jun
        curJulBudget = seekCoa.budget_jul
        curAugBudget = seekCoa.budget_aug
        curSepBudget = seekCoa.budget_sep
        curOctBudget = seekCoa.budget_oct
        curNovBudget = seekCoa.budget_nov
        curDecBudget = seekCoa.budget_dec
        curTotBudget = curJanBudget + curFebBudget + curMarBudget + curAprBudget + curMayBudget + curJunBudget + curJulBudget + curAugBudget + curSepBudget + curOctBudget + curNovBudget + curDecBudget

        seekCoa.code = seekCoa.code
        seekCoa.description = seekCoa.description
        seekCoa.type = seekCoa.type
        seekCoa.budget_jan = curJanBudget + jan
        seekCoa.budget_feb = curFebBudget + feb
        seekCoa.budget_mar = curMarBudget + mar
        seekCoa.budget_apr = curAprBudget + apr
        seekCoa.budget_may = curMayBudget + may
        seekCoa.budget_jun = curJunBudget + jun
        seekCoa.budget_jul = curJulBudget + jul
        seekCoa.budget_aug = curAugBudget + aug
        seekCoa.budget_sep = curSepBudget + sep
        seekCoa.budget_oct = curOctBudget + oct
        seekCoa.budget_nov = curNovBudget + nov
        seekCoa.budget_dec = curDecBudget + dec
        seekCoa.budget_total = seekCoa.budget_jan + seekCoa.budget_feb + seekCoa.budget_mar + seekCoa.budget_apr + seekCoa.budget_may + 
               seekCoa.budget_jun + seekCoa.budget_jul + seekCoa.budget_aug + seekCoa.budget_sep + seekCoa.budget_oct + seekCoa.budget_nov + seekCoa.budget_dec 

        console.log(seekCoa)
        await seekCoa.save()

        //res.redirect(`sub_ledgers/${newSub-Ledger.id}`)
        res.redirect('budgets')

    } catch (err) {
        console.log(err)
    }
})

router.get('/:id', async (req, res) => {
    try{
    const budget = await Budget.findById(req.params.id)
    res.send('Budget account ' + budget.description)
    console.log(budget)
    }
    catch (err) {
        console.log(err)
    }
})


// Edit Budget
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