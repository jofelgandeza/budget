const express = require('express')
const router  = express.Router()
const Swal = require('sweetalert2')
const Coa = require('../models/coa')
const _ = require('lodash')


const coaClass = ["Income", "Expense","Asset - Current", "Asset - Non-current", "Contra Asset",
"Liabilities - Current", "Liabilities - Con-current", "Fund Balance"]

// All Chart of Accounts Route
router.get('/', async (req, res) => {

    let searchOptions = {}
    if (req.query.title  !=null && req.query.title !== '') {
        searchOptions.title = RegExp(req.query.title, 'i')
    }
    console.log(searchOptions)
    try {
        const coas = await Coa.find(searchOptions)

        sortedCoas = coas.sort( function (a,b) {
            if  ( a.empSortKey < b.empSortKey ){
                return -1;
              }
              if ( a.empSortKey > b.empSortKey ){
                return 1;
              }
               return 0;
        })


        res.render('coas/index', {
            coas: sortedCoas,
            searchOptions: req.query,
            Swal: Swal
        })
    } catch {
        res.redirect('/', {Swal})
    }
})

// New Chart of Account Route
router.get('/new', (req, res) => {

    let locals = {}

    res.render('coas/new', { coa: new Coa(), coaClass: coaClass })
})

// Create Chart of Account Route
router.post('/', async (req, res) => {
   
    console.log(req.body.description)
//    const coaClass = ["Income", "Expense"]

    const trimCoa = _.trim(req.body.coa)
let coa = new Coa({
    code: _.trim(req.body.code),
    title: _.trim(req.body.title),
    description: req.body.description,
    class: _.trim(req.body.class),
    type: _.trim(req.body.type),
    budget_total: 0,
    actual_total: 0,
    budget_jan: 0,
    budget_feb: 0,
    budget_mar: 0,
    budget_apr: 0,
    budget_may: 0,
    budget_jun: 0,
    budget_jul: 0,
    budget_aug: 0,
    budget_sep: 0,
    budget_oct: 0,
    budget_nov: 0,
    budget_dec: 0,
    actual_jan: 0,
    actual_feb: 0,
    actual_mar: 0,
    actual_apr: 0,
    actual_may: 0,
    actual_jun: 0,
    actual_jul: 0,
    actual_aug: 0,
    actual_sep: 0,
    actual_oct: 0,
    actual_nov: 0,
    actual_dec: 0,

})
try {

    Coa.findOne({code: trimCoa}, function (err, foundItem) {
        if (!err) {
            if (!foundItem) {
                const newCoa = coa.save()
                res.redirect('/coas')

            } else {
                let locals = {errorMessage: 'Chart Account Code already exists!'}
                res.render('coas/new', {
                        coa: coa,
                        coaClass: coaClass,
                        locals: locals
                })            
            }
        }
    } )
//    const newCoa = await coa.save()
//    res.redirect('coas/${newCoa.id}')
//    res.redirect('coas')
} catch (err) {
   let locals = {errorMessage: 'Something WENT went wrong.'}
    res.render('coas/new', {
            coa: coa,
            locals: locals
    })

}

})


router.get('/:id', async (req, res) => {
    const coa = await Coa.findById(req.params.id)

    res.send('Showing Chart of Account : ' + coa.title)
})

// Edit Chart of Account
router.get('/:id/edit', async (req, res) => {

    const coaClass = ["Income", "Expense","Asset - Current", "Asset - Non-current", "Contra Asset",
                    "Liabilities - Current", "Liabilities - Con-current", "Fund Balance"]

    try {
        const coa = await Coa.findById(req.params.id)
//        console.log(coa.class);
//        console.log(coaClass);
        res.render('coas/edit', { coa: coa, coaClass: coaClass })

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
        coa.title = req.body.title
        coa.class = req.body.class
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
 //   alert('Are you sure you want to delete this record?')
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

    //   function areYouSureDelete() {
    //     swal({
    //       title: "Are you sure you wish to delete this record?",
    //       type: "warning",
    //       showCancelButton: true,
    //       confirmButtonColor: '#DD6B55',
    //       confirmButtonText: 'Yes, delete it!',
    //       closeOnConfirm: false,
    //   }.then((value) => {
    //     if(value){
    //              //ajax call or other action to delete the blog
    //           swal("Deleted!", "Your imaginary file has been deleted!", "success");
    //        }else{
    //          //write what you want to do
    //         }
    //    })); };
       

module.exports = router

// Swal.fire({
//     title: 'Are you sure?',
//     text: "You won't be able to revert this!",
//     icon: 'warning',
//     showCancelButton: true,
//     confirmButtonColor: '#3085d6',
//     cancelButtonColor: '#d33',
//     confirmButtonText: 'Yes, delete it!'
//   }).then((result) => {
//     if (result.isConfirmed) {
//       Swal.fire(
//         'Deleted!',
//         'Your file has been deleted.',
//         'success'
//       )
//     }
//   })
