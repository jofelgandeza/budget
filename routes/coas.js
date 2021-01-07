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

// Create Chart of Account Route
router.post('/', async (req, res) => {
const coa = new Coa({
    code: req.body.code,
    description: req.body.description,
    type: req.body.type
})
try {
    const newCoa = await coa.save()
    res.redirect('coas/${newCoa.id}')
//    res.redirect('coas')
} catch {
   let locals = {errorMessage: 'Something went wrong.'}
    res.render('coas/new', {
            coa: coa,
            locals: locals
    })

}

})


router.get('/:id', async (req, res) => {
    const coa = await Coa.findById(req.params.id)

    res.send('Showing Chart of Account : ' + coa.description)
})

// Edit Chart of Account
router.get('/:id/edit', async (req, res) => {
    try {
        const coa = await Coa.findById(req.params.id)
        res.render('coas/edit', { coa: coa })

    } catch {
        res.redirect('/coas')
    }
})

router.put('/:id', async (req, res) => {
    // const coa = new Coa({
    //     code: req.body.code,
    //     description: req.body.description,
    //     type: req.body.type
    let coa

    try {
        coa = await Coa.findById(req.params.id)
        coa.code = req.body.code
        coa.description = req.body.description
        coa.type = req.body.type
        await coa.save()  
        res.redirect('/coas')
        //res.redirect(`/coas/${coa.id}`)
    } catch {
        if (author == null) {
            res.redirect('/')
        } else {
            let locals = {errorMessage: 'Something went wrong.'}
            res.render('coas/edit', {
                    coa: coa,
                    locals: locals
        })
      }   
      }
    })

router.delete('/:id', async (req, res) => {
    let coa

    try {
        coa = await Coa.findById(req.params.id)
        await coa.remove()  
        res.redirect('/coas')
    } catch {
        if (coa == null) {
            res.redirect('/coas')
        } else {
            let locals = {errorMessage: 'Something went wrong.'}
            res.render(`/coas/${coa.id}`, {
                    coa: coa,
                    locals: locals
        })
      }   
      }})

module.exports = router