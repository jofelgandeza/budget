const express = require('express')
const router  = express.Router()
const Cost_center = require('../models/cost_center')

// All Cost Centers Route
router.get('/', async (req, res) => {
    let searchOptions = {}
    if (req.query.description  !=null && req.query.description !== '') {
        searchOptions.description = RegExp(req.query.description, 'i')
    }
    try {
        const cost_centers = await Cost_center.find(searchOptions)
        res.render('cost_centers/index', {
            cost_centers: cost_centers,
            searchOptions: req.query
        })
    } catch {
        res.redirect('/')
    }
})

// New Cost Center Route
router.get('/new', (req, res) => {
    res.render('cost_centers/new', { cost_center: new Cost_center() })
})

// Create Cost Center Route
router.post('/', async (req, res) => {
const cost_center = new Cost_center({
    code: req.body.code,
    description: req.body.description,
    type: req.body.type
})


try {

let isAdd = false

    Cost_center.findOne({code: req.body.code}, function (err, foundItem) {
        if (!err) {
            if (!foundItem) {
                isAdd = true
            } else {
                let locals = {errorMessage: 'Cost Center Code already exists!'}
                res.render('cost_centers/new', {
                        cost_center: cost_center,
                        locals: locals
                })            
            }
        }
    } )

    if (isAdd) {
        const newCoa = await cost_center.save()
        res.redirect('/cost_centers')

    }

//    const newCost_center = await cost_center.save()
//    res.redirect('cost_centers/${newCost_center.id}')
//    res.redirect('cost_centers')
} catch {
   let locals = {errorMessage: 'Something went wrong.'}
    res.render('cost_centers/new', {
            cost_center: cost_center,
            locals: locals
    })

}

})


router.get('/:id', async (req, res) => {
    const cost_center = await Cost_center.findById(req.params.id)

    res.send('Show Cost Center: ' + cost_center.description)
})

// Edit Chart of Account
router.get('/:id/edit', async (req, res) => {
    try {
        const cost_center = await Cost_center.findById(req.params.id)
        res.render('cost_centers/edit', { cost_center: cost_center })

    } catch {
        res.redirect('/cost_centers')
    }
})

router.put('/:id', async (req, res) => {
    // const cost_center = new Cost_center({
    //     code: req.body.code,
    //     description: req.body.description,
    //     type: req.body.type
    let cost_center

    try {
        cost_center = await Cost_center.findById(req.params.id)
        cost_center.code = req.body.code
        cost_center.description = req.body.description
        cost_center.type = req.body.type
        await cost_center.save()  
        res.redirect('/cost_centers')
        //res.redirect(`/cost_centers/${cost_center.id}`)
    } catch {
        if (author == null) {
            res.redirect('/')
        } else {
            let locals = {errorMessage: 'Something went wrong.'}
            res.render('cost_centers/edit', {
                    cost_center: cost_center,
                    locals: locals
        })
      }   
      }
    })

router.delete('/:id', async (req, res) => {
    let cost_center

    try {
        cost_center = await Cost_center.findById(req.params.id)
        await cost_center.remove()  
        res.redirect('/cost_centers')
    } catch {
        if (cost_center == null) {
            res.redirect('/')
        } else {
            let locals = {errorMessage: 'Something went wrong.'}
            res.render(`/cost_centers/${cost_center.id}`, {
                    cost_center: cost_center,
                    locals: locals
        })
      }   
      }})

module.exports = router