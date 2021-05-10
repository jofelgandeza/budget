const { query } = require('express')
const express = require('express')
const { model } = require('mongoose')
const router  = express.Router()
const Swal = require('sweetalert2')
const Center = require('../models/center')
const Employee = require('../models/employee')
const Loan_type = require('../models/loan_type')
const Center_budget_det = require('../models/center_budget_det')
const Center_det_budg_view = require('../models/center_det_budg_view')
const _ = require('lodash')
const Cleave = require('../public/javascripts/cleave.js')
const sortArray = require('../public/javascripts/sortArray.js')
const { forEach, isNull } = require('lodash')

const monthSelect = ["January","February", "March", "April", "May", "June", "July", "August", "September", "October", "November","December"];
const begMonthSelect = ["January","February", "March", "April", "May", "June"];


// All CENTERS Route
router.get('/', async (req, res) => {

    let searchOptions = {}
    if (req.query.title  !=null && req.query.title !== '') {
        searchOptions.description = RegExp(req.query.title, 'i')
    }
    try {
        const center = await Center.find(searchOptions)
        POname = "ALL CENTERS"
        res.render('centers/index', {
            POname: POname,
            centers: center,
            searchOptions: req.query,
            Swal: Swal
        })
    } catch (err) {
        console.log(err)
        res.redirect('/')
    }
})

//View CENTERS per PO Level - TUG-A1

router.get('/center/:id', async (req, res) => {

    const IDcode = req.params.id

    const poNumber = IDcode.substr(5,1)
    const unitCode = IDcode.substr(4,1)
    const branchCode = IDcode.substr(0,3)
    const assignCode = IDcode.substr(0,6)

     let searchOptions = {}
     let poLoanTotals = []
     let poLoanGrandTot = []
     let centerTargets = []
     let foundCenter = []

     let nClient = 0
     let nClientAmt = 0
     let oClient = 0
     let oClientAmt = 0
     let rClient = 0
     let bClient = 0
     let resignClient = 0
     let budgBegBal = 0
     let tbudgEndBal = 0
     let totDisburse = 0
     let lnType 
     let POname =" "
     let POposition = " "
     const POdata = await Employee.findOne({assign_code: assignCode}, function (err, foundedEmp) {
        POname = foundedEmp.first_name + " " + foundedEmp.middle_name.substr(0,1) + ". " + foundedEmp.last_name
        POposition = foundedEmp.position_code
    })


//    console.log(POname)
    try {

        const loanType = await Loan_type.find({})

//        const updateCtrForView = await Center.find()

        const center = await Center.find({branch: branchCode, unit: unitCode, po: poNumber}, function (err, foundCenters) {
//        const center = await Center.find(searchOptions)

            nClient = _.sumBy(foundCenters, function(o) { return o.newClient; });
            nClientAmt = _.sumBy(foundCenters, function(o) { return o.newClientAmt; });
            oClient = _.sumBy(foundCenters, function(o) { return o.oldClient; });
            oClientAmt = _.sumBy(foundCenters, function(o) { return o.oldClientAmt; });
            rClient = _.sumBy(foundCenters, function(o) { return o.resClient; });
            budgBegBal = _.sumBy(foundCenters, function(o) { return o.budget_BegBal; });
            tbudgEndBal = (oClient + nClient) - rClient
            totDisburse = nClientAmt + oClientAmt

            foundCenter = foundCenters
    })
   
  //console.log(foundCenter)

    
        loanType.forEach(loan_type => {
            let typeLoan = loan_type.title
            let nloanTot = 0
            let nloanTotCount = 0
            let oloanTot = 0
            let oloanTotCount = 0
            let resloanTot = 0
            let begLoanTot = 0
            let begClientTot = 0
            lnType = loan_type.loan_type
//            console.log(typeLoan)

            foundCenter.forEach(center => {
                const lnType = center.loan_code
                let centerTargets = center.Targets
                let LoanBegBal = center.Loan_beg_bal
//                let centerLoanBegBal = center.Loan_beg_bal                
                let resignClient = center.resClient
                
                if (lnType === _.trim(lnType)) {
                    BudgBegBal = center.budget_BegBal
                }
                    // console.log(resignClient)
                    // console.log(resloanTot)

                centerTargets.forEach(centerLoan => {
                    if (_.trim(centerLoan.loan_type) === _.trim(typeLoan)) {
                        const loanRem = centerLoan.remarks
                        if (_.trim(loanRem) === "New Loan") {
                            nloanTot = nloanTot + centerLoan.totAmount
                            nloanTotCount = nloanTotCount + centerLoan.numClient
                        } else {
                            oloanTot = oloanTot + centerLoan.totAmount
                            oloanTotCount = oloanTotCount + centerLoan.numClient
                            resloanTot = resloanTot + resignClient
                        }
                    }
                })

                LoanBegBal.forEach(centerBegBal => {
                    if (_.trim(centerBegBal.loan_type) === _.trim(typeLoan)) {
                        begLoanTot = centerBegBal.beg_amount
                        begClientTot = centerBegBal.beg_client_count
                        bClient = bClient + begClientTot
                    }
                })


            })
            let totAmounts = nloanTot + oloanTot 
            let budgEndBal = (oloanTotCount + nloanTotCount + begClientTot) - resloanTot
//            let amtDisburse = oloanTot + oloanTot
            
            poLoanTotals.push({loan_type: typeLoan, nnumClient: nloanTotCount, amtDisburse: totAmounts, begClientTot: begClientTot,
                ntotAmount: nloanTot, onumClient: oloanTotCount, ototAmount: oloanTot, resloanTot: resloanTot, budgEndBal: budgEndBal})

            resloanTot = 0
        })
        tbudgEndBal = tbudgEndBal + bClient

        // console.log(poLoanGrandTot)

        poLoanGrandTot.push({nClient: nClient, nClientAmt: nClientAmt, oClient: oClient, oClientAmt: oClientAmt, 
            rClient: rClient, bClient: bClient, budgEndBal: tbudgEndBal, totDisburse: totDisburse})

//       console.log(poLoanGrandTot)

            res.render('centers/index', {
                POname: POname,
                poCode: IDcode,
                loanTots: poLoanTotals,
                poGrandTot: poLoanGrandTot,
                centers: foundCenter,
                searchOptions: req.query,
                Swal: Swal
            })
        } catch (err) {
            console.log(err)
            res.redirect('/')
        }
})


// View Unit per PO  - TUG-A
router.get('/unit/:id', async (req, res) => {
    
    const IDcode = req.params.id
   
    const unitCode = IDcode.substr(4,1)
    const branchCode = IDcode.substr(0,3)
    const uniCode = IDcode.substr(0,4)
   
    // console.log(IDcode)
    // console.log(unitCode)
    // console.log(uniCode)
   
    let foundCenter = []
    let foundPOunits = []
    let foundPO = []
    let officerName = ""
      
       try {
           const employee = await Employee.find({branch: branchCode, unit: unitCode}, function (err, foundPOs){
               foundPOunits = foundPOs
           })
           
           foundPOunits.sort( function (a,b) {
            if ( a.assign_code < b.assign_code ){
                return -1;
              }
              if ( a.assign_code > b.assign_code ){
                return 1;
              }
              return 0;
           })

        // console.log(foundPOunits)
   
        //    s( a, b ) {

           const center = await Center.find({branch: branchCode, unit: unitCode}, function (err, foundCenters) {
   
   //            console.log(foundCenters)   
   
   //            cost unitOfficer = await Employee
               foundCenter = foundCenters
               const unitTitle = "Unit " + foundCenters.unit
               const poNumber = foundCenters.po
               const nClient = _.sumBy(foundCenters, function(o) { return o.newClient; });
               const nClientAmt = _.sumBy(foundCenters, function(o) { return o.newClientAmt; });
               const oClient = _.sumBy(foundCenters, function(o) { return o.oldClientAmt; });
               const oClientAmt = _.sumBy(foundCenters, function(o) { return o.oldClientAmt; });
               const rClient = _.sumBy(foundCenters, function(o) { return o.resClient; });
   
               const resClient = _.sumBy(foundCenters, function(o) { return o.resClient; });
   
   
   //            console.log(foundCenters) 
   //           res.send(req.params.id)
   //                coa: coa,
   //                locals: locals
   //        })            
           })
           //console.log (foundPOunits)
           let poNumber
           foundPOunits.forEach(po_data => {
               
               POnumber = po_data.po_number
               const POname = po_data.first_name + " " + po_data.middle_name.substr(0,1) + ". " + po_data.last_name
   
              let neClientNum = 0
              let neClientAmt = 0
              let olClientNum = 0 
              let olClientAmt = 0 
              let reClientNum = 0
   
//               console.log(foundCenter)
   
               foundCenter.forEach(center_data => {
                   if (center_data.po === POnumber) {
                       neClientNum = neClientNum + center_data.newClient
                       neClientAmt = neClientAmt + center_data.newClientAmt
                       olClientNum = olClientNum + center_data.oldClient
                       olClientAmt = olClientAmt + center_data.oldClientAmt
                       reClientNum = reClientNum + center_data.resClient
               }
               })
   
               if (POnumber !== "") {
                   foundPO.push({
                       po_name: POname,
                       po_num: POnumber,
                       newClient: neClientNum,
                       newClientAmt: neClientAmt,
                       oldClient: olClientNum,
                       oldClientAmt: olClientAmt,
                       resClient: reClientNum
                   })
               } else {
                   officerName =  POname
               }
               })
//               console.log(foundPO)
   
               res.render('centers/unit', {
                   listTitle: branchCode+"-"+unitCode,
                   officerName: officerName,
                   POs: foundPO,
                   searchOptions: req.query,
                   Swal: Swal
               })
   
       } 
       catch (err) {
           console.log(err)
       }
   })
   
   
// View BRANCH per UNIT  - TUG-A
router.get('/branch/:id', async (req, res) => {
    
    const branchCode = req.params.id

//     const unitCode = IDcode.substr(4,1)
//     const branchCode = IDcode.substr(0,3)
//     const uniCode = IDcode.substr(0,4)

//     console.log(IDcode)
//     console.log(unitCode)
//     console.log(uniCode)

    let foundManager = []
    let foundCenter = []
    let foundPOunits = []
    let foundPO = []
    let officerName = ""
   
    try {
        const branchManager = await Employee.find({branch: branchCode, position_code: "BRN-MGR"}, function (err, foundPOs){
            foundManager = foundPOs
           })

        branchManager.forEach(manager => {
            officerName = manager.first_name + " " + manager.middle_name.substr(0,1) + ". " + manager.last_name

            })
        const unitOfficers = await Employee.find({branch: branchCode, position_code: "UNI-OFR"}, function (err, foundPOs){
            foundPOunits = foundPOs
            })
        const programOfficers = await Employee.find({branch: branchCode, position_code: "PROG-OFR"}, function (err, foundPOs){
            foundProgOff = foundPOs
            })

        // console.log(officerName)
//        console.log(foundPOunits)
        // console.log(programOfficers)

        const center = await Center.find({branch: branchCode}, function (err, foundCenters) {

//            console.log(foundCenters)   

//            cost unitOfficer = await Employee
            foundCenter = foundCenters
            const unitTitle = "Unit " + foundCenters.unit
            const poNumber = foundCenters.po
            const nClient = _.sumBy(foundCenters, function(o) { return o.newClient; });
            const nClientAmt = _.sumBy(foundCenters, function(o) { return o.newClientAmt; });
            const oClient = _.sumBy(foundCenters, function(o) { return o.oldClientAmt; });
            const oClientAmt = _.sumBy(foundCenters, function(o) { return o.oldClientAmt; });
            const rClient = _.sumBy(foundCenters, function(o) { return o.resClient; });

            const resClient = _.sumBy(foundCenters, function(o) { return o.resClient; });
            
        })
        let poNumber
        programOfficers.forEach(po_data => {
            
            POnumber = po_data.po_number
            POunit = po_data.unit
            const POname = po_data.first_name + " " + po_data.middle_name.substr(0,1) + ". " + po_data.last_name

           let neClientNum = 0
           let neClientAmt = 0
           let olClientNum = 0 
           let olClientAmt = 0 
           let reClientNum = 0

//            console.log(foundCenter)

            foundCenter.forEach(center_data => {
                if (center_data.po === POnumber) {

                    neClientNum = neClientNum + center_data.newClient
                    neClientAmt = neClientAmt + center_data.newClientAmt
                    olClientNum = olClientNum + center_data.oldClient
                    olClientAmt = olClientAmt + center_data.oldClientAmt
                    reClientNum = reClientNum + center_data.resClient
            }
            })

            if (POnumber !== "") {
                foundPO.push({
                    po_name: POname,
                    po_num: POnumber,
                    unit: POunit,
                    newClient: neClientNum,
                    newClientAmt: neClientAmt,
                    oldClient: olClientNum,
                    oldClientAmt: olClientAmt,
                    resClient: reClientNum
                })
            } else {
                officerName =  POname
            }
            })
            // console.log(foundPOunits)
 
            res.render('centers/branch', {
                listTitle: branchCode,
                officerName: officerName,
                Units: foundPOunits,
                POs: foundPO,
                searchOptions: req.query,
                Swal: Swal
            })

    } 
    catch (err) {
        console.log(err)
    }
})

// Edit Targets
router.get('/:id/edit', async (req, res) => {

     centerCode = req.params.id
     unit_ID = centerCode.substr(0,6)
    console.log(unit_ID)
    let lnType = []
    let forSortTargets = []
    let sortedTargets = []  

    try {

        const loanType = await Loan_type.find({glp_topUp:true}, function (err, foundLoan) {
            const ewan = foundLoan

        })

//        console.log(loanType)
        const center = await Center.findOne({center: req.params.id}, function (err, foundlist) {
             
            foundlist.Targets.forEach( list => {
                const _id = list._id
                const loan_type = list.loan_type
                const month = list.month
                const semester = list.semester
                const numClient = list.numClient
                const amount = list.amount
                const totAmount = list.totAmount
                const remarks = list.remarks
            
                const sortKey = _.toString(list.dispView) + list.loan_type + _.toString(list.monthOrder)
                
                forSortTargets.push({_id: _id, sortKey: sortKey, loan_type: loan_type, month: month, semester: semester, numClient: numClient, amount: amount, totAmount: totAmount, remarks: remarks})
            } )

        })
        // console.log(forSortTargets)

        sortedTargets = forSortTargets.sort( function (a,b) {
            if ( a.sortKey < b.sortKey ){
                return -1;
              }
              if ( a.sortKey > b.sortKey ){
                return 1;
              }
               return 0;
        })

            res.render("centers/targets", {
                unitID: unit_ID,
                loanType: loanType,
                listTitle: centerCode, 
                newListItems: sortedTargets,
                monthSelect: monthSelect
            });


    } catch (err) {
        console.log(err)
        res.redirect('/centers')
    }
})

// Set Budget Beginning Balances
router.get('/setBegBal/:id', async (req, res) => {

    centerCode = req.params.id
    unit_ID = centerCode.substr(0,6)
//    console.log(unit_ID)
   let forSortTargets = []
   let sortedTargets = []  
    let loanType = []
    let locals = ""

   try {

       loType = await Loan_type.find({glp_topUp:true}, function (err, foundLoan) {
           loanType = foundLoan
       })
    //    console.log(loanType)

       const center = await Center.findOne({center: req.params.id}, function (err, foundlist) {

           foundlist.Loan_beg_bal.forEach( begBalList => {
               const _id = begBalList._id
               const loanCode = begBalList.loan_type
               const begBalAmt = begBalList.beg_amount
               const begBalClientCnt = begBalList.beg_client_count
               const beg_principal = begBalList.beg_principal
               const beg_interest = begBalList.beg_interest
               const expected_maturity_date = begBalList.expected_maturity_date
               const sortKey = _.toString(begBalList.dispView + loanCode)
               let lnType = ""
               
               loanType.forEach( lonTyp => {
                   if (_.trim(lonTyp.title) === _.trim(loanCode)) {
                    lnType = lonTyp.title
                   }
               })

               forSortTargets.push({_id: _id, sortKey: sortKey, loanCode: loanCode, loan_type: lnType, 
                        begBalAmt: begBalAmt, begBalClientCnt: begBalClientCnt, beg_principal: beg_principal, beg_interest: beg_interest, expected_maturity_date: expected_maturity_date})
           } )

       })
    //    console.log(forSortTargets)

       sortedTargets = forSortTargets.sort( function (a,b) {
           if ( a.sortKey < b.sortKey ){
               return -1;
             }
             if ( a.sortKey > b.sortKey ){
               return 1;
             }
              return 0;
       })

           res.render("centers/setBegBal", {
               unitID: unit_ID,
               loanType: loanType,
               listTitle: centerCode, 
               newListItems: sortedTargets,
               monthSelect: begMonthSelect,
               locals: locals
           });


   } catch (err) {
       console.log(err)
       res.redirect('/centers')
   }
})

// PUT /save Beginning Balances per center

router.put("/putBegBal/:id", async function(req, res){
    const begLoanType = req.body.loanType
    const bClientCnt = _.toNumber(_.replace(req.body.numClient,',',''))
    const begBalPrinc = _.toNumber(_.replace(req.body.begBalAmt,',',''))
    const centerCode = req.params.id
    const monthNumber = req.body.numMonth
    const begBalInterest = _.toNumber(_.replace(req.body.begBalInt,',',''))
    const branchCode = centerCode.substr(0,3)
    const unitCode = centerCode.substr(0,5)
    const poNumber = centerCode.substr(5,1)
    const poCode = centerCode.substr(0,6)
    const bBalAmt = begBalInterest + begBalPrinc

    let bgloanType = []
    let fnView = 0
    let item =[]

    try {

        loType = await Loan_type.find({glp_topUp:true}, function (err, foundLoan) {
            bgloanType = foundLoan
        })
 
        const loanViewOrder = await Loan_type.findOne({title: _.trim(begLoanType)}, function(err, foundloanView) {
            if (!err) {
                const finView = foundloanView.display_order
                fnView = finView
        } else {
                console.log(err)
            }
        })

        let numMaturityMonth = 0
        switch(monthNumber) {
            case "January": 
                numMaturityMonth = 11 
                break;
            case "February": 
                numMaturityMonth = 12 
                break;
            case "March": 
                numMaturityMonth = 13 
                break;
            case "April": 
                numMaturityMonth = 14 
                break;
            case "May": 
                numMaturityMonth = 15 
                break;
            case "June": 
                numMaturityMonth = 16 
                break;
            default:
                numMaturityMonth = 0
        }   

    let curLoanBeg = []
    let locals
    let canSaveBegBal = false
    let canAddCenterBudg = false

      const centerFound = await Center.findOne({center: centerCode}, function(err, foundList){ 
        if (err) {
            console.log(err)
        }
        else {
                console.log(foundList)

                const curLoanBeg = foundList.Loan_beg_bal

                if (curLoanBeg.length === 0) {
                    canSaveBegBal = true
                } else {
                    curLoanBeg.forEach(curLoanBegBal => {
                        if (curLoanBegBal.loan_type == _.trim(begLoanType)) {
                            locals = {errorMessage: 'Beginning balance for '+ begLoanType +'  is already exists!'}
                        } else {
                            canSaveBegBal = true
                        }
                    })
                }
            
                if (canSaveBegBal) {
                    item = {
                        loan_type: begLoanType,
                        beg_amount: bBalAmt,
                        beg_interest: begBalInterest,
                        beg_principal: begBalPrinc,
                        beg_client_count: bClientCnt,
                        expected_maturity_date:monthNumber,
                        month_number: numMaturityMonth,
                        dispView: fnView
                    }
                        foundList.Loan_beg_bal.push(item);
                        // console.log(item)
            //            setBegBal
                        foundList.save();
            //            res.redirect('/centers/setBegBal/' + centerCode)
                } else {
                // res.redirect('/centers/setBegBal/' + centerCode)

                    res.render('centers/setBegBal', { 
                        unitID: poCode,
                        loanType: bgloanType,
                        listTitle: centerCode, 
                        newListItems: curLoanBeg,
                        monthSelect: begMonthSelect,
                        locals: locals
                    })    
                 }
         }
      })

    // Saving Loan Beginning Balances to center_budget_dets.. NOTE: To be done only when setting Targets is finished!
    if (canSaveBegBal) {

        const centerBudgDetFound = await Center_budget_det.findOne({center: centerCode, loan_type: begLoanType, view_code: "OldLoanClient"}, function(err, foundVwList){ 
                if (err) {
                    console.log(err)
                }
                else {
                    if (isNull(foundVwList)) {
                        canAddCenterBudg = true
                    } else {
                        console.log(foundVwList)

                        foundVwList.beg_bal = bClientCnt
                        
                        foundVwList.save();

                        res.redirect('/centers/setBegBal/' + centerCode)
                    }
                }
            })

            if (canAddCenterBudg) {
                let newCtrCliBudg = new Center_budget_det({
                    region: "NLO", area: "NEL", branch: branchCode, unit: unitCode, po: poNumber, po_code: poCode, center: centerCode,
                    view_type: "PUH", loan_type: begLoanType, view_code: "OldLoanClient", beg_bal: bClientCnt, beg_bal_amt: bBalAmt,
                    jan_budg: 0, feb_budg: 0, mar_budg: 0, apr_budg: 0,
                    may_budg: 0, jun_budg: 0, jul_budg: 0, aug_budg: 0,
                    sep_budg: 0, oct_budg: 0, nov_budg: 0, dec_budg: 0
                })
                const nwCtrClient = await newCtrCliBudg.save()

                res.redirect('/centers/setBegBal/' + centerCode)

            }
        } else {
            res.redirect('/centers/setBegBal/' + centerCode)
        }
    } catch(err) {
        console.log(err)
    }
  
  })

  // DELETE Beginning Balances...
  router.post('/delBegBal', async (req, res) => {
    //   alert('Are you sure you want to delete this record?')
        let centerCode = req.body.listName
        const checkedItemId = req.body.checkbox
        const listName = _.trim(req.body.listName)
      
       console.log(checkedItemId)
       console.log(centerCode)
       let center
       let delLoanType = ""
       let delLoanAmt = 0
       let delLoanClient = 0

       try {       
      
           center = await Center.findOneAndUpdate({center: listName}, {$pull: {Loan_beg_bal :{_id: checkedItemId }}}, function(err, foundList){
               if (!err) {
                  console.log(foundList)
                  delLoanType = foundList.loan_type
                  delLoanClient = foundList.beg_client_count
                  delLoanAmt = foundList.beg_amount
   
//                   res.redirect('/centers/setBegBal/' + centerCode)
   
               } else {
                   console.log(err)
               }
           })
   
        // Updating Loan Beginning Balances to center_budget_dets.. 
        const centerBudgDetFound = await Center_budget_det.findOne({center: listName, loan_type: delLoanType, view_code: "OldLoanClient"}, function(err, foundVwList){ 
            if (err) {
                console.log(err)
            }
            else {
                console.log(foundVwList)

                foundVwList.beg_bal = 0
                foundVwList.beg_bal_amt = 0
                
                foundVwList.save();

                res.redirect('/centers/setBegBal/' + centerCode)
            }
        })

        } catch (err) {
           console.log(err)
        }  
   })




//Save targets to Targets array field in center collection
router.put("/:id", async function(req, res){

    const loanType = req.body.loanType
    const month = req.body.month
    const semester = req.body.semester
    const numClient = _.toNumber(_.replace(req.body.numClient,',',''))
    const amount = _.toNumber(_.replace(req.body.amount,',',''))
    const totAmount = numClient * amount
    const remarks = req.body.remarks
    const centerCode = req.params.id
    let fnView = 0, orderMonth = 0
    let item =[]
    let janLoanBudg = 0
    let febLoanBudg = 0
    let marLoanBudg = 0
    let aprLoanBudg = 0
    let mayLoanBudg = 0
    let junLoanBudg = 0
    let julLoanBudg = 0
    let augLoanBudg = 0
    let sepLoanBudg = 0 
    let octLoanBudg = 0
    let novLoanBudg = 0
    let decLoanBudg = 0
        let janLoanCliBudg = 0
        let febLoanCliBudg = 0
        let marLoanCliBudg = 0
        let aprLoanCliBudg = 0
        let mayLoanCliBudg = 0
        let junLoanCliBudg = 0
        let julLoanCliBudg = 0
        let augLoanCliBudg = 0
        let sepLoanCliBudg = 0
        let octLoanCliBudg = 0
        let novLoanCliBudg = 0
        let decLoanCliBudg = 0
    let janResCliBudg = 0
    let febResCliBudg = 0
    let marResCliBudg = 0
    let aprResCliBudg = 0
    let mayResCliBudg = 0
    let junResCliBudg = 0
    let julResCliBudg = 0
    let augResCliBudg = 0
    let sepResCliBudg = 0
    let octResCliBudg = 0
    let novResCliBudg = 0
    let decResCliBudg = 0

    switch(month) {
        case "January": 
            orderMonth = 11 
            janLoanCliBudg = numClient
            janLoanBudg = totAmount
            break;
        case "February": 
            orderMonth = 12 
            febLoanCliBudg = numClient
            febLoanBudg = totAmount
            break;
        case "March": 
            orderMonth = 13
            marLoanCliBudg = numClient
            marLoanBudg = totAmount
            break;
        case "April": 
            orderMonth = 14
            aprLoanCliBudg = numClient
            aprLoanBudg = totAmount
            break;
        case "May": 
            orderMonth = 15
            mayLoanCliBudg = numClient
            mayLoanBudg = totAmount
            break;
        case "June": 
            orderMonth = 16
            junLoanCliBudg = numClient
            junLoanBudg = totAmount
            break;
        case "July": 
            orderMonth = 17
            julLoanCliBudg = numClient
            julLoanBudg = totAmount
            break;
        case "August": 
            orderMonth = 18
            augLoanCliBudg = numClient
            augLoanBudg = totAmount
            break;
        case "September": 
            orderMonth = 19
            sepLoanCliBudg = numClient
            sepLoanBudg = totAmount
            break;
        case "October": 
            orderMonth = 20
            octLoanCliBudg = numClient
            octLoanBudg = totAmount
            break;
        case "November": 
            orderMonth = 21
            novLoanCliBudg = numClient
            novLoanBudg = totAmount
            break;
        case "December": 
            orderMonth = 22
            decLoanCliBudg = numClient
            decLoanBudg = totAmount
            break;
        default:
            orderMonth = 0
    }   

//    console.log(loanType)
    try {
        const loanViewOrder = await Loan_type.findOne({title: _.trim(loanType)}, function(err, foundloanView) {
            if (!err) {
                const finView = foundloanView.display_order
                fnView = finView
        } else {
                console.log(err)
            }
        })

    //   console.log(dispOrder)
        

        let newClient =  0 
        let newClientAmt = 0
        let oldClient = 0
        let oldClientAmt = 0
        let rNewClient =  0 
        let rNewClientAmt = 0
        let rOldClient = 0
        let rOldClientAmt = 0
        let rExNewClient =  0 
        let rExPrevNewClient =  0 
        let rExNewClientAmt = 0
        let rExOldClient = 0
        let rExPrevOldClient = 0
        let rExOldClientAmt = 0
        let resClient = 0

        if (_.trim(remarks) === "New Loan") {
            newClient = numClient
            newClientAmt = totAmount
            if (loanType === "Group Loan" || loanType === "Agricultural Loan") {
                rNewClient = numClient
                rNewClientAmt = totAmount
            }
        }
        else {
            oldClient = numClient
            oldClientAmt = totAmount
            if (loanType === "Group Loan" || loanType === "Agricultural Loan") {
                rOldClient = numClient
                rOldClientAmt = totAmount
            }
        }
    // to include amount and client totals for non-GLP products ????
//    resClient = rOldClient - rNewClient
    
    // Saving to Center_budget_det Collection
        const poNumber = centerCode.substr(5,1)
        const unitCode = centerCode.substr(0,5)
        const branchCode = centerCode.substr(0,3)
        const poCode = centerCode.substr(0,6)
        let centerBudgDet = []
        let centerViewCode = ""
        if (remarks === "New Loan") {
            centerView1Code = "NewLoanClient"
            centerView2Code = "NewLoanAmt"
        } else {
            centerView1Code = "OldLoanClient"
            centerView2Code = "OldLoanAmt"
        }
            canSaveResign = false

        centerBudgDet = await Center_budget_det.findOne({center: centerCode, loan_type: loanType})
        
        if (isNull(centerBudgDet)) {

            let newCntrCliBudg = new Center_budget_det({
                region: "NLO", area: "NEL", branch: branchCode, unit: unitCode, po: poNumber, po_code: poCode, center: centerCode,
                view_type: "PUH", loan_type: loanType, view_code: centerView1Code,
                jan_budg: janLoanCliBudg, feb_budg: febLoanCliBudg, mar_budg: marLoanCliBudg, apr_budg: aprLoanCliBudg,
                may_budg: mayLoanCliBudg, jun_budg: junLoanCliBudg, jul_budg: julLoanCliBudg, aug_budg: augLoanCliBudg,
                sep_budg: sepLoanCliBudg, oct_budg: octLoanCliBudg, nov_budg: novLoanCliBudg, dec_budg: decLoanCliBudg
            })
            const newCtrClient = await newCntrCliBudg.save()

            let newCntrAmtBudg = new Center_budget_det({
                region: "NLO", area: "NEL", branch: branchCode, unit: unitCode, po: poNumber, po_code: poCode, center: centerCode,
                view_type: "PUH", loan_type: loanType, view_code: centerView2Code,
                jan_budg: janLoanBudg, feb_budg: febLoanBudg, mar_budg: marLoanBudg, apr_budg: aprLoanBudg,
                may_budg: mayLoanBudg, jun_budg: junLoanBudg, jul_budg: julLoanBudg, aug_budg: augLoanBudg,
                sep_budg: sepLoanBudg, oct_budg: octLoanBudg, nov_budg: novLoanBudg, dec_budg: decLoanBudg
            })
            const newCtrClientAmt = await newCntrAmtBudg.save()

            if (centerView1Code === "OldLoanClient") {
                canSaveResign = true
            }

        } else {

            let centerBudg1Det = []

            centerBudg1Det = await Center_budget_det.findOne({center: centerCode, loan_type: loanType, view_code: centerView1Code})

            if (isNull(centerBudg1Det)) { 
                let newCtrCliBudg = new Center_budget_det({
                    region: "NLO", area: "NEL", branch: branchCode, unit: unitCode, po: poNumber, po_code: poCode, center: centerCode,
                    view_type: "PUH", loan_type: loanType, view_code: centerView1Code,
                    jan_budg: janLoanCliBudg, feb_budg: febLoanCliBudg, mar_budg: marLoanCliBudg, apr_budg: aprLoanCliBudg,
                    may_budg: mayLoanCliBudg, jun_budg: junLoanCliBudg, jul_budg: julLoanCliBudg, aug_budg: augLoanCliBudg,
                    sep_budg: sepLoanCliBudg, oct_budg: octLoanCliBudg, nov_budg: novLoanCliBudg, dec_budg: decLoanCliBudg
                })
                const nwCtrClient = await newCtrCliBudg.save()
    
                let newCtrAmtBudg = new Center_budget_det({
                    region: "NLO", area: "NEL", branch: branchCode, unit: unitCode, po: poNumber, po_code: poCode, center: centerCode,
                    view_type: "PUH", loan_type: loanType, view_code: centerView2Code,
                    jan_budg: janLoanBudg, feb_budg: febLoanBudg, mar_budg: marLoanBudg, apr_budg: aprLoanBudg,
                    may_budg: mayLoanBudg, jun_budg: junLoanBudg, jul_budg: julLoanBudg, aug_budg: augLoanBudg,
                    sep_budg: sepLoanBudg, oct_budg: octLoanBudg, nov_budg: novLoanBudg, dec_budg: decLoanBudg
                })
                const nwCtrClientAmt = await newCtrAmtBudg.save()
    

            } else {
                centerBudg1Det.jan_budg = centerBudg1Det.jan_budg + janLoanCliBudg
                centerBudg1Det.feb_budg = centerBudg1Det.feb_budg + febLoanCliBudg
                centerBudg1Det.mar_budg = centerBudg1Det.mar_budg + marLoanCliBudg
                centerBudg1Det.apr_budg = centerBudg1Det.apr_budg + aprLoanCliBudg
                centerBudg1Det.may_budg = centerBudg1Det.may_budg + mayLoanCliBudg
                centerBudg1Det.jun_budg = centerBudg1Det.jun_budg + junLoanCliBudg
                centerBudg1Det.jul_budg = centerBudg1Det.jul_budg + julLoanCliBudg
                centerBudg1Det.aug_budg = centerBudg1Det.aug_budg + augLoanCliBudg
                centerBudg1Det.sep_budg = centerBudg1Det.sep_budg + sepLoanCliBudg
                centerBudg1Det.oct_budg = centerBudg1Det.oct_budg + octLoanCliBudg
                centerBudg1Det.nov_budg = centerBudg1Det.nov_budg + novLoanCliBudg
                centerBudg1Det.dec_budg = centerBudg1Det.dec_budg + decLoanCliBudg
                await centerBudg1Det.save()
            
        
                center2BudgDet = await Center_budget_det.findOne({center: centerCode, loan_type: loanType, view_code: centerView2Code})
        
                if (isNull(center2BudgDet)) { 
                    if (remarks === "Re-loan") {
                        let oldCtrAmtBudg = new Center_budget_det({
                            region: "NLO", area: "NEL", branch: branchCode, unit: unitCode, po: poNumber, po_code: poCode, center: centerCode,
                            view_type: "PUH", loan_type: loanType, view_code: centerView2Code,
                            jan_budg: janLoanBudg, feb_budg: febLoanBudg, mar_budg: marLoanBudg, apr_budg: aprLoanBudg,
                            may_budg: mayLoanBudg, jun_budg: junLoanBudg, jul_budg: julLoanBudg, aug_budg: augLoanBudg,
                            sep_budg: sepLoanBudg, oct_budg: octLoanBudg, nov_budg: novLoanBudg, dec_budg: decLoanBudg
                        })
                        const olCtrClientAmt = await oldCtrAmtBudg.save()
        
                    }
                } else {
                    center2BudgDet.jan_budg = center2BudgDet.jan_budg + janLoanBudg
                    center2BudgDet.feb_budg = center2BudgDet.feb_budg + febLoanBudg
                    center2BudgDet.mar_budg = center2BudgDet.mar_budg + marLoanBudg
                    center2BudgDet.apr_budg = center2BudgDet.apr_budg + aprLoanBudg
                    center2BudgDet.may_budg = center2BudgDet.may_budg + mayLoanBudg
                    center2BudgDet.jun_budg = center2BudgDet.jun_budg + junLoanBudg
                    center2BudgDet.jul_budg = center2BudgDet.jul_budg + julLoanBudg
                    center2BudgDet.aug_budg = center2BudgDet.aug_budg + augLoanBudg
                    center2BudgDet.sep_budg = center2BudgDet.sep_budg + sepLoanBudg
                    center2BudgDet.oct_budg = center2BudgDet.oct_budg + octLoanBudg
                    center2BudgDet.nov_budg = center2BudgDet.nov_budg + novLoanBudg
                    center2BudgDet.dec_budg = center2BudgDet.dec_budg + decLoanBudg
                    await center2BudgDet.save()
                
                }
            }
        }
        let resiClient = 0
        let otherLoanResCli = 0
        let resWitBegCount = 0
        let resWitBegOldCount = 0


    // Saving to Center collection
      const centerFound = await Center.findOne({center: centerCode}, function(err, foundList){ 
          console.log(foundList)
        if (err) {
            console.log(err)
        }
        else {

            const curTargets = foundList.Targets

            // getting of Beginning Balances per Loan Type
            const curBegBal = foundList.Loan_beg_bal

            let curLoanTypeCliBegBal = 0
            let curLoanTypeAmtBegBal = 0
            let curLoanTypeIntBegBal = 0
            let curMaturityMonthBeg
            let withReloanMonth
            let nMonthBegBal = 0
            let hasLoanBegBal = false

            if (curBegBal.length === 0) {

            } else {
                curBegBal.forEach( curBegBals => {
                    if (curBegBals.loan_type === loanType) {
                        curLoanTypeCliBegBal = curBegBals.beg_client_count
                        curMaturityMonthBeg = curBegBals.expected_maturity_date
                        curLoanTypeIntBegBal = curBegBals.beg_interest
                        curLoanTypeAmtBegBal = curBegBals.beg_amount
                        nMonthBegBal = curBegBals.month_number
                        hasLoanBegBal = true
                    }
                })
            }
//            console.log(curTargets)
            
            let resiOtherClient = 0
            let newLoanCount = 0
            let oldLoanCount = 0
            let newLoanAmount = 0
            let oldLoanAmount = 0
            let hasCurNewLoan = false
            let hasPrevNewLoan = false
            let hasCurReLoan = false
            let hasPrevReLoan = false
            let computeResFromBegBal = false
            let targetKeyForUpdet = ""
            let firstSemNewLoan = 0
            let firstSemReLoan = 0

            if (curTargets.length === 0) {
                if (remarks === "Re-loan") {
                    resiClient = curLoanTypeCliBegBal - numClient
                }
                
            } else {
                curTargets.forEach(target => {
                    const tarLoanType = target.loan_type
                    const targMonth = target.month
                    const nTargMonth = target.monthOrder
                    const targClientCount = target.numClient 

                    if (tarLoanType === loanType && _.trim(target.remarks) === "New Loan" ) {
                        if (targMonth === month) {
                            hasCurNewLoan = true
                            newLoanCount = newLoanCount + target.numClient
                            newLoanAmount = newLoanAmount + target.totAmount
                            if (tarLoanType === "Group Loan" || tarLoanType === "Agricultural Loan") {
                                rExNewClient = rExNewClient + target.numClient
                                rExNewClientAmt = rExNewClientAmt + target.totAmount
                            }
                            rNewClient = rNewClient + target.numClient
                            rNewClientAmt = rNewClientAmt + target.numClient
                        } else {
                            hasPrevNewLoan = true
                            firstSemNewLoan = firstSemNewLoan + targClientCount
                            if (tarLoanType === "Group Loan" || tarLoanType === "Agricultural Loan") {
                                rExPrevNewClient = rExPrevNewClient + target.numClient
//                                rExNewClientAmt = rExNewClientAmt + target.totAmount
                            }
                        }
                    }
                    if (tarLoanType === loanType  &&_.trim(target.remarks) === "Re-loan" ) {
                        if (targMonth === month) {
                            hasCurReLoan = true
                            withReloanMonth = targMonth
                                oldLoanCount  = oldLoanCount + target.numClient
                                oldLoanAmount = oldLoanAmount + target.totAmount
                                targetKeyForUpdet = target.id
                                 if (tarLoanType === "Group Loan" || tarLoanType === "Agricultural Loan") {
                                    rExOldClient = rExOldClient + target.numClient
                                    rExOldClientAmt = rExOldClientAmt + target.totAmount
                                 }
    
                        }else {
                            hasPrevReLoan = true
                            firstSemReLoan + firstSemReLoan + targClientCountd
                            if (tarLoanType === "Group Loan" || tarLoanType === "Agricultural Loan") {
                                rExPrevOldClient = rExPrevOldClient + target.numClient
                                rExOldClientAmt = rExOldClientAmt + target.totAmount
                             }
                    }
                    }
                }) // end of forEach() loop
                
                    // if (hasLoanBegBal) {
                    //     if (nTargMonth == nMonthBegBal ) {
                    //         computeResFromBegBal = true
                    //         resWitBegCount = resWitBegCount + target.numClient
                    //         targetKeyForUpdet = target.id
                    //     } else {
                    //         resWitBegOldCount = resWitBegOldCount + target.numClient
                    //         targetKeyForUpdet = target.id
                    //     }
                    // } else {

                    // }

                if (remarks === "Re-loan") { 
                    if (loanType === "Group Loan" || tarLoanType === "Agricultural Loan") {

                        if (hasLoanBegBal && curMaturityMonthBeg === withReloanMonth) {
                            resiClient = curLoanTypeCliBegBal - (rExOldClient + numClient)
                        }

                        if (hasLoanBegBal && hasCurReLoan && hasPrevReLoan) {
                            resiClient = (firstSemNewLoan + firstSemReLoan) - (rExOldClient + numClient)
                        }

                        if (!hasLoanBegBal && hasPrevNewLoan && hasCurReLoan) {
                            resiClient = firstSemNewLoan - (rExOldClient + numClient)
                        }
                        if (!hasLoanBegBal && hasPrevReLoan) {
                            resiClient = firstSemNewLoan - (rExOldClient + numClient)
                        }

                    } else {

                        if (hasLoanBegBal && curMaturityMonthBeg === withReloanMonth) {
                            resiClient = curLoanTypeCliBegBal - (oldLoanCount + numClient)
                        }

                        if (hasLoanBegBal && hasCurReLoan && hasPrevReLoan) {
                            resiClient = (firstSemNewLoan + firstSemReLoan) - (oldLoanCount + numClient)
                        }

                        if (!hasLoanBegBal && hasPrevReLoan) {
                            resiClient = firstSemNewLoan - (newLoanCount + numClient)
                        }

                        if (hasCurNewLoan) {
                            rOldClient = rOldClient + rExOldClient
                            rOldClientAmt = rOldClientAmt + rExOldClientAmt
                    
                                if (rOldClient > 0) {
                                    resiClient = rNewClient - rOldClient
                                } else {
                                    resiClient = rNewClient - numClient
                                }
                        }
                    }
                }

                    // if (hasLoanBegBal) {
                    //     if (orderMonth == nMonthBegBal) {
                    //         resiClient = curLoanTypeCliBegBal - resWitBegCount                    
                    //     } else {
                    //         resiClient = resWitBegCount - resWitBegOldCount                    
                    //     }
                    // }
                    
                    if (!isNull(targetKeyForUpdet)) {
                        curResTarcenter =  Center.findOneAndUpdate({"center": centerCode}, {$set: {"Targets.$[el].resignClient": 0}}, 
                                                    {arrayFilters: [{"el._id": targetKeyForUpdet }]}, function(err, foundResList){
                            if (err) {
                                console.log(err)
                            } else {
                                console.log(foundResList)
                            }
                        })                                
                    }
            }
            
            // Saving RESIGN Client Count to center_budget_dets collection

//            console.log(resiClient)
            item = {
                loan_type: loanType,
                month: month,
                semester: semester,
                numClient: numClient,
                newClient: newClient,
                oldClient: oldClient,
                amount: amount,
                totAmount: totAmount,
                remarks: remarks,
                monthOrder: orderMonth,
                dispView: fnView,
                resignClient: resiClient
            }
            if (loanType === "Group Loan" || loanType === "Agricultural Loan") {
                foundList.resClient = resiClient
                if (remarks === "Re-loan") {
                    foundList.oldClientAmt = rExOldClientAmt + totAmount
                    foundList.oldClient = rExOldClient + numClient
                } else {
                    foundList.newClient = rExNewClient + numClient
                    foundList.newClientAmt = rExNewClientAmt + totAmount
                }
            }

            // saving to center collections and its Target array field
            foundList.Targets.push(item);
            foundList.save();
         }
      })

            switch(month) {
                case "January": 
                    janResCliBudg = resiClient 
                    break;
                case "February": 
                    febResCliBudg = resiClient 
                    break;
                case "March": 
                    marResCliBudg = resiClient 
                    break;
                case "April": 
                    aprResCliBudg = resiClient 
                    break;
                case "May": 
                    mayResCliBudg = resiClient 
                    break;
                case "June": 
                    junResCliBudg = resiClient 
                    break;
                case "July": 
                    julResCliBudg = resiClient 
                    break;
                case "August": 
                    augResCliBudg = resiClient 
                    break;
                case "September": 
                    sepResCliBudg = resiClient 
                    break;
                case "October": 
                    octResCliBudg = resiClient 
                    break;
                case "November": 
                    novResCliBudg = resiClient 
                    break;
                case "December": 
                    decResCliBudg = resiClient 
                    break;
                default:
                    orderMonth = 0
            }   

            if (centerView1Code === "OldLoanClient" && canSaveResign) {
                        
                let newCntrCliResBudg = new Center_budget_det({
                    region: "NLO", area: "NEL", branch: branchCode, unit: unitCode, po: poNumber, po_code: poCode, center: centerCode,
                    view_type: "PUH", loan_type: loanType, view_code: "ResClientCount",
                    jan_budg: janResCliBudg, feb_budg: febResCliBudg, mar_budg: marResCliBudg, apr_budg: aprResCliBudg,
                    may_budg: mayResCliBudg, jun_budg: junResCliBudg, jul_budg: julResCliBudg, aug_budg: augResCliBudg,
                    sep_budg: sepResCliBudg, oct_budg: octResCliBudg, nov_budg: novResCliBudg, dec_budg: decLoanCliBudg
                })
                const ResCtrClient = await newCntrCliResBudg.save()    

                res.redirect('/centers/' + centerCode + '/edit')

            } else {
                let centerResBudgDet = []

                centerResBudgDet = await Center_budget_det.findOne({center: centerCode, loan_type: loanType, view_code: "ResClientCount"})

                if (isNull(centerResBudgDet)) { 
                    let newResCliBudg = new Center_budget_det({
                        region: "NLO", area: "NEL", branch: branchCode, unit: unitCode, po: poNumber, po_code: poCode, center: centerCode,
                        view_type: "PUH", loan_type: loanType, view_code: "ResClientCount",
                        jan_budg: janResCliBudg, feb_budg: febResCliBudg, mar_budg: marResCliBudg, apr_budg: aprResCliBudg,
                        may_budg: mayResCliBudg, jun_budg: junResCliBudg, jul_budg: julResCliBudg, aug_budg: augResCliBudg,
                        sep_budg: sepResCliBudg, oct_budg: octResCliBudg, nov_budg: novResCliBudg, dec_budg: decLoanCliBudg
                        })
                    const resCtr1Client = await newResCliBudg.save()
                } else {
                    centerResBudgDet.jan_budg = janResCliBudg
                    centerResBudgDet.feb_budg = febResCliBudg
                    centerResBudgDet.mar_budg = marResCliBudg
                    centerResBudgDet.apr_budg = aprResCliBudg
                    centerResBudgDet.may_budg = mayResCliBudg
                    centerResBudgDet.jun_budg = junResCliBudg
                    centerResBudgDet.jul_budg = julResCliBudg
                    centerResBudgDet.aug_budg = augResCliBudg
                    centerResBudgDet.sep_budg = sepResCliBudg
                    centerResBudgDet.oct_budg = octResCliBudg
                    centerResBudgDet.nov_budg = novResCliBudg
                    centerResBudgDet.dec_budg = decResCliBudg

                    await centerResBudgDet.save()
                }
                res.redirect('/centers/' + centerCode + '/edit')
            }

    } catch(err) {
        console.log(err)
    }
  
  })


  // PUT /save Beginning Balances per center
  router.put("/viewMonthlyPO/:id", async function(req, res){

    const viewMonPOcode = req.params.id

    try {
    const cntrBudLonType = await Loan_type.findOne({})

      const POcenterFound = await Center.find({po_code: viewMonPOcode}, function(err, foundPOCenters){ 
        if (err) {
            console.log(err)
        }
        else {
            console.log(foundPOCenters)

            const curLoanBeg = foundPOCenters.Loan_beg_bal
//            console.log(curTargets)
            
            item = {
                loan_type: loanType,
                beg_amount: bBalAmt,
                beg_client_count: bClientCnt,
                dispView: fnView,
            }

            foundList.Loan_beg_bal.push(item);
            // console.log(item)
//            setBegBal
            foundList.save();
            res.redirect('/centers/setBegBal/' + centerCode)
         }
      })

      forEach.POcenterFound( poCntrFnd => {

        const POctrFnd = POcenterFound.center_cnt_begBal
        let janResClientNum, febResClientNum, marResClientNum, aprResClientNum, mayResClientNum, junResClientNum, 
            julResClientNum, augResClientNum, sepResClientNum, octResClientNum, novResClientNum, decResClientNum = 0
        let janNewLoan, febNewLoan, marNewLoan, aprNewLoan, mayNewLoan, junNewLoan, julNewLoan, augNewLoan, sepNewLoan, octNewLoan, novNewLoan, decNewLoan = 0
        let janReloan, febReloan, marReloan, aprReloan, mayReloan, junReloan, julReloan, augReloan, sepReloan, octReloan, novReloan, decReloan = 0

        let janBudg, febBudg, marBudg, aprBudg, mayBudg, junBudg, julBudg, augBudg, sepBudg, octBudg, novBudg, decBudg = 0
        let numClient = 0, targetAmount = 0
        let cntrTarget = []

        cntrTarget = poCntrFnd.Targets
            forEach.cntrTarget( cntrTargets => {

                const loanType = cntrTargets.loan_type
                const semester = cntrTargets.semester

                ctrNumClient = cntrTargets.numClient
                ctrTargetAmount = cntrTargets.totAmount

                const ctrRemarks = cntrTargets.remarks
                const  ctrDispView = cntrTargets.dispView
                const ctrResClient = cntrTargets.resiClient
                const ctrTargetMonth = cntrTargets.monthOrder

                switch(ctrTargetMonth) {
                    case 11: 
                        orderMonth = 11 
                        break;
                    case 12: orderMonth = 12
                        break;
                    case 13: orderMonth = 13
                        break;
                    case 14: orderMonth = 14
                    break;
                    case 15: orderMonth = 15
                    break;
                    case 16: orderMonth = 16
                    break;
                    case 17: orderMonth = 17
                    break;
                    case 18: orderMonth = 18
                    break;
                    case 19: orderMonth = 19
                    break;
                    case 20: orderMonth = 20
                    break;
                    case 21: orderMonth = 21
                    break;
                    case 22: orderMonth = 22
                    break;
                    default:
                        orderMonth = 0
                }   
            
                
            })


    })

    } catch(err) {
        console.log(err)
    }
  
  })

// Post deleted items in Center.Targets and update Monthly views as well..
    
router.post('/delete', async (req, res) => {
    //   alert('Are you sure you want to delete this record?')
        let centerCode = req.body.listName
        const checkedItemId = req.body.checkbox
        const listName = _.trim(req.body.listName)
   
        let lonTypDet
        let litlitekLnTyp = ""
        let delNewClient = 0
        let delNewClientAmt = 0
        let delOldClient = 0
        let delOldClientAmt = 0
        let delResClient = 0
        let lonRemarks
        let numClient = 0
        let totAmount = 0
        let month = ""

        let recCounter = 0
        
   
        try {       

            recCounter =  recCounter + 1
            if (recCounter === 1) {

               modiCenter = await Center.findOne({center: listName})  //, function(err, modiCenter) {
               const foundTargets = modiCenter.Targets
               lonTypDet = ""
               lonRemarks = ""
               foundTargets.forEach(cntrTarget => {
                    const walaLang = cntrTarget.month
                   if (_.trim(cntrTarget._id) === checkedItemId) {
   
                       lonTypDet = cntrTarget.loan_type
                       lonRemarks = cntrTarget.remarks
                       month = cntrTarget.month
                       numClient = cntrTarget.numClient
                       totAmount = cntrTarget.totAmount
   
                       if (_.trim(cntrTarget.remarks) === "New Loan") {
                           delNewClient = cntrTarget.numClient
                           delNewClientAmt = cntrTarget.totAmount
                           modiCenter.newClient = modiCenter.newClient - delNewClient
                           modiCenter.newClientAmt = modiCenter.newClientAmt - delNewClientAmt
                       } else {
                           delOldClient = cntrTarget.numClient
                           delOldClientAmt = cntrTarget.totAmount                        
                           modiCenter.oldClient = modiCenter.oldClient - delOldClient
                           modiCenter.oldClientAmt = modiCenter.oldClientAmt - delOldClientAmt                                }
                   }
               })   
//              console.log(modiCenter)
               if (lonTypDet === "Group Loan" || lonTypDet === "Agricultural Loan") {
                    modiCenter.save()
                }

              
           if (lonRemarks === "New Loan") {
               centerView1Code = "NewLoanClient"
               centerView2Code = "NewLoanAmt"
           } else {
               centerView1Code = "OldLoanClient"
               centerView2Code = "OldLoanAmt"
           }
   
           let janLoanBudg = 0
           let febLoanBudg = 0
           let marLoanBudg = 0
           let aprLoanBudg = 0
           let mayLoanBudg = 0
           let junLoanBudg = 0
           let julLoanBudg = 0
           let augLoanBudg = 0
           let sepLoanBudg = 0 
           let octLoanBudg = 0
           let novLoanBudg = 0
           let decLoanBudg = 0
           let janLoanCliBudg = 0
           let febLoanCliBudg = 0
           let marLoanCliBudg = 0
           let aprLoanCliBudg = 0
           let mayLoanCliBudg = 0
           let junLoanCliBudg = 0
           let julLoanCliBudg = 0
           let augLoanCliBudg = 0
           let sepLoanCliBudg = 0
           let octLoanCliBudg = 0
           let novLoanCliBudg = 0
           let decLoanCliBudg = 0
       
           switch(month) {
               case "January": 
                   janLoanCliBudg = numClient
                   janLoanBudg = totAmount
                   break;
               case "February": 
                   febLoanCliBudg = numClient
                   febLoanBudg = totAmount
                   break;
               case "March": 
                   marLoanCliBudg = numClient
                   marLoanBudg = totAmount
                   break;
               case "April": 
                   aprLoanCliBudg = numClient
                   aprLoanBudg = totAmount
                   break;
               case "May": 
                   mayLoanCliBudg = numClient
                   mayLoanBudg = totAmount
                   break;
               case "June": 
                   junLoanCliBudg = numClient
                   junLoanBudg = totAmount
                   break;
               case "July": 
                   julLoanCliBudg = numClient
                   julLoanBudg = totAmount
                   break;
               case "August": 
                   augLoanCliBudg = numClient
                   augLoanBudg = totAmount
                   break;
               case "September": 
                   sepLoanCliBudg = numClient
                   sepLoanBudg = totAmount
                   break;
               case "October": 
                   octLoanCliBudg = numClient
                   octLoanBudg = totAmount
                   break;
               case "November": 
                   novLoanCliBudg = numClient
                   novLoanBudg = totAmount
                   break;
               case "December": 
                   decLoanCliBudg = numClient
                   decLoanBudg = totAmount
                   break;
               default:
                   orderMonth = 0
           }   
       
//    console.log(listName)
//    console.log(litlitekLnTyp)
//    console.log(centerView1Code)
   
           modifyCenter1Det = await Center_budget_det.findOne({center: listName, loan_type: lonTypDet, view_code: centerView1Code}) //, function(err, fndCenter1Det) {
               
               switch(month) {
                   case "January": 
                       modifyCenter1Det.jan_budg = modifyCenter1Det.jan_budg - janLoanCliBudg
                       break;
                   case "February": 
                       modifyCenter1Det.feb_budg = modifyCenter1Det.feb_budg - febLoanCliBudg
                       break;
                   case "March": 
                       modifyCenter1Det.mar_budg = modifyCenter1Det.mar_budg - marLoanCliBudg
                       break;
                   case "April": 
                       modifyCenter1Det.apr_budg = modifyCenter1Det.apr_budg - aprLoanCliBudg
                       break;
                   case "May": 
                       modifyCenter1Det.may_budg = modifyCenter1Det.may_budg - mayLoanCliBudg
                       break;
                   case "June": 
                       modifyCenter1Det.jun_budg = modifyCenter1Det.jun_budg - junLoanCliBudg
                       break;
                   case "July": 
                       modifyCenter1Det.jul_budg = modifyCenter1Det.jul_budg - julLoanCliBudg
                       break;
                   case "August": 
                       modifyCenter1Det.aug_budg = modifyCenter1Det.aug_budg - augLoanCliBudg
                       break;
                   case "September": 
                       modifyCenter1Det.sep_budg = modifyCenter1Det.sep_budg - sepLoanCliBudg
                       break;
                   case "October": 
                       modifyCenter1Det.oct_budg = modifyCenter1Det.oct_budg - octLoanCliBudg
                       break;
                   case "November": 
                       modifyCenter1Det.nov_budg = modifyCenter1Det.nov_budg - novLoanCliBudg
                       break;
                   case "December": 
                       modifyCenter1Det.dec_budg = modifyCenter1Det.dec_budg - decLoanCliBudg
                       break;
                   default:
                       orderMonth = 0
               }           
               modifyCenter1Det.save()
        
   
           modifyCenter2Det = await Center_budget_det.findOne({center: listName, loan_type: lonTypDet, view_code: centerView2Code}) //, function(err, modifyCenter2Det) {
             if (isNull(modifyCenter2Det)) {

             } else {
               switch(month) {
                   case "January": 
                       modifyCenter2Det.jan_budg = modifyCenter2Det.jan_budg - janLoanBudg
                       break;
                   case "February": 
                       modifyCenter2Det.feb_budg = modifyCenter2Det.feb_budg - febLoanBudg
                       break;
                   case "March": 
                       modifyCenter2Det.mar_budg = modifyCenter2Det.mar_budg - marLoanBudg
                       break;
                   case "April": 
                       modifyCenter2Det.apr_budg = modifyCenter2Det.apr_budg - aprLoanBudg
                       break;
                   case "May": 
                       modifyCenter2Det.may_budg = modifyCenter2Det.may_budg - mayLoanBudg
                       break;
                   case "June": 
                       modifyCenter2Det.jun_budg = modifyCenter2Det.jun_budg - junLoanBudg
                       break;
                   case "July": 
                       modifyCenter2Det.jul_budg = modifyCenter2Det.jul_budg - julLoanBudg
                       break;
                   case "August": 
                       modifyCenter2Det.aug_budg = modifyCenter2Det.aug_budg - augLoanBudg
                       break;
                   case "September": 
                       modifyCenter2Det.sep_budg = modifyCenter2Det.sep_budg - sepLoanBudg
                       break;
                   case "October": 
                       modifyCenter2Det.oct_budg = modifyCenter2Det.oct_budg - octLoanBudg
                       break;
                   case "November": 
                       modifyCenter2Det.nov_budg = modifyCenter2Det.nov_budg - novLoanBudg
                       break;
                   case "December": 
                       modifyCenter2Det.dec_budg = modifyCenter2Det.dec_budg - decLoanBudg
                       break;
                   default:
                       orderMonth = 0
               }           
               modifyCenter2Det.save()
            }
           center = await Center.findOneAndUpdate({center: listName}, {$pull: {Targets :{_id: checkedItemId }}}, function(err, foundList){

               if (!err) {
   
                   res.redirect('/centers/' + centerCode + '/edit')
   
               } else {
                   console.log(err)
               }
           })
        }

       } catch (err) {
           console.log(err)
         }   
   })
   
   
//Save targets to Targets array field in center collection
router.put("center/:id/center", async function(req, res){
    const loanType = req.body.loanType
    const month = req.body.month
    const semester = req.body.semester
    const numClient = _.toNumber(_.replace(req.body.numClient,',',''))
    const amount = _.toNumber(_.replace(req.body.amount,',',''))
    const totAmount = numClient * amount
    const remarks = req.body.remarks
    const centerCode = req.params.id
    let fnView = 0, orderMonth = 0
    let item =[]
    let curItem = []

    switch(month) {
        case "January": orderMonth = 11 
            break;
        case "February": orderMonth = 12
            break;
        case "March": orderMonth = 13
            break;
        case "April": orderMonth = 14
        break;
        case "May": orderMonth = 15
        break;
        case "June": orderMonth = 16
        break;
        case "July": orderMonth = 17
        break;
        case "August": orderMonth = 18
        break;
        case "September": orderMonth = 19
        break;
        case "October": orderMonth = 20
        break;
        case "November": orderMonth = 21
        break;
        case "December": orderMonth = 22
        break;
        default:
            orderMonth = 0
    }   

//    console.log(loanType)
    try {
    const loanViewOrder = await Loan_type.findOne({title: _.trim(loanType)}, function(err, foundloanView) {
        if (!err) {
            const finView = foundloanView.display_order
            fnView = finView
      } else {
            console.log(err)
        }
    })

//   console.log(dispOrder)
    

    let newClient =  0 
    let newClientAmt = 0
    let oldClient = 0
    let oldClientAmt = 0

    let targIDforResiUpdet = ""
    let curTarAmt = 0
    let curTarClient = 0
    let curTarTotAmt = 0

      const centerFound = await Center.findOne({center: centerCode}, function(err, foundList){ 
        if (err) {
            console.log(err)
        }
        else {

            if (_.trim(remarks) === "New Loan") {
                newClient = foundList.newClient + numClient
                newClientAmt = foundList.newClientAmt + totAmount
                foundList.newClient = newClient
                foundList.newClientAmt = newClientAmt
                }
            else {
                oldClient = foundList.oldClient + numClient
                oldClientAmt = foundList.oldClientAmt + totAmount
                foundList.oldClientAmt = oldClientAmt
                foundList.oldClient = oldClient
                }

            const curTargets = foundList.Targets.sort({loand_type: 'asc'})
//            console.log(curTargets)
            
            let resiClient = 0
            let newLoanCount = 0
            let oldLoanCount = 0
            let hasNewLoan = false
            let hasLoanType = ""

            if (curTargets.length === 0) {

            } else {
                curTargets.forEach(target => {
                     const tarLoanType = target.loan_type

                     if (target.loan_type === loanType && target.month === month) {

                        if (_.trim(target.remarks) === "New Loan") {
                            hasNewLoan = true
                            hasLoanType = tarLoanType
                            newLoanCount = newLoanCount + target.numClient
                        }
                        if (hasNewLoan && _.trim(remarks) === "Re-loan") {
                            oldLoanCount = oldLoanCount + target.numClient
                            if ( target.resignClient > 0 ) {
                                targIDforResiUpdet = target.id
                                curTarAmt = target.amount
                                curTarClient = target.numClient
                                curTarTotAmt = target.totAmount
                            }
                        }
                     }
                })
                if (oldLoanCount > 0 && _.trim(remarks) === "Re-loan") {
                    resiClient = newLoanCount - (oldLoanCount + numClient)
                }

            }
//            console.log(resiClient)
            
            if (curTarClient > 0) {
                curTarcenter =  Center.findOneAndUpdate({center: listName}, {$pull: {Targets :{_id: targIDforResiUpdet }}}, function(err, foundList){
                    if (err) {
                        console.log(err)
                    }
                })
            }

            if (curTarClient > 0) {
                curItem = {
                    loan_type: loanType,
                    month: month,
                    semester: semester,
                    numClient: curTarClient  ,
                    amount: curTarAmt,
                    totAmount: curTarTotAmt,
                    remarks: remarks,
                    monthOrder: orderMonth,
                    dispView: fnView,
                    resignClient: 0
                }
                foundList.Targets.push(curItem);
            }

            item = {
                loan_type: loanType,
                month: month,
                semester: semester,
                numClient: numClient,
                amount: amount,
                totAmount: totAmount,
                remarks: remarks,
                monthOrder: orderMonth,
                dispView: fnView,
                resignClient: resiClient
            }

            foundList.resClient = resiClient

            foundList.Targets.push(item);
            // console.log(item)

            foundList.save();
            res.redirect('/centers/' + centerCode + '/edit')
         }
      })


    //     if (!err) {

    //         res.redirect('/centers/' + centerCode + '/edit')

    //     } else {
    //         console.log(err)
    //     }
    // })


    } catch(err) {
        console.log(err)
    }

  })

// View PO Targets per month ROUTE
router.get('/viewTargetsMonthly/:id', async (req, res) => {

    const viewPOCode = req.params.id
    let foundPOV = []
    // let foundCenterDet = []

    const vwloanType = await Loan_type.find({})
    console.log(vwloanType)

    let poSumView = []

    let nwTotValueClient = 0
    let nwTotValueAmt = 0
    let olTotValueClient = 0
    let olTotValueAmt = 0

    let viewTitle = ""

    let jan_newCTotValue = 0  
    let feb_newCTotValue = 0
    let mar_newCTotValue = 0
    let apr_newCTotValue = 0
    let may_newCTotValue = 0
    let jun_newCTotValue = 0
    let jul_newCTotValue = 0
    let aug_newCTotValue = 0
    let sep_newCTotValue = 0
    let oct_newCTotValue = 0
    let nov_newCTotValue = 0
    let dec_newCTotValue = 0
        let begBalOldClient = 0
        let jan_oldCTotValue = 0  
        let feb_oldCTotValue = 0
        let mar_oldCTotValue = 0
        let apr_oldCTotValue = 0
        let may_oldCTotValue = 0
        let jun_oldCTotValue = 0
        let jul_oldCTotValue = 0
        let aug_oldCTotValue = 0
        let sep_oldCTotValue = 0
        let oct_oldCTotValue = 0
        let nov_oldCTotValue = 0
        let dec_oldCTotValue = 0
    let jan_newATotValue = 0  
    let feb_newATotValue = 0
    let mar_newATotValue = 0
    let apr_newATotValue = 0
    let may_newATotValue = 0
    let jun_newATotValue = 0
    let jul_newATotValue = 0
    let aug_newATotValue = 0
    let sep_newATotValue = 0
    let oct_newATotValue = 0
    let nov_newATotValue = 0
    let dec_newATotValue = 0
        let jan_oldATotValue = 0  
        let feb_oldATotValue = 0
        let mar_oldATotValue = 0
        let apr_oldATotValue = 0
        let may_oldATotValue = 0
        let jun_oldATotValue = 0
        let jul_oldATotValue = 0
        let aug_oldATotValue = 0
        let sep_oldATotValue = 0
        let oct_oldATotValue = 0
        let nov_oldATotValue = 0
        let dec_oldATotValue = 0
        let doneReadNLC = false
        let doneReadOLC = false
        let doneReadNLA = false
        let doneReadOLA = false

    const foundCenterDet = await Center_budget_det.find({po_code: viewPOCode})

    console.log(foundCenterDet)

    poSumView.push({title: "NUMBER OF LOANS", sortkey: 1, group: 1})

    const newLoanClientView = await Center_budget_det.find({po_code: viewPOCode, view_code: "NewLoanClient"}, function (err, fndNewCli) {
        jan_newCtotValue = _.sumBy(fndNewCli, function(o) { return o.jan_budg; })
        feb_newCtotValue = _.sumBy(fndNewCli, function(o) { return o.feb_budg; })
        mar_newCtotValue = _.sumBy(fndNewCli, function(o) { return o.mar_budg; })
        apr_newCtotValue = _.sumBy(fndNewCli, function(o) { return o.apr_budg; })
        may_newCtotValue = _.sumBy(fndNewCli, function(o) { return o.may_budg; })
        jun_newCtotValue = _.sumBy(fndNewCli, function(o) { return o.jun_budg; })
        jul_newCtotValue = _.sumBy(fndNewCli, function(o) { return o.jul_budg; })
        aug_newCtotValue = _.sumBy(fndNewCli, function(o) { return o.aug_budg; })
        sep_newCtotValue = _.sumBy(fndNewCli, function(o) { return o.sep_budg; })
        oct_newCtotValue = _.sumBy(fndNewCli, function(o) { return o.oct_budg; })
        nov_newCtotValue = _.sumBy(fndNewCli, function(o) { return o.nov_budg; })
        dec_newCtotValue = _.sumBy(fndNewCli, function(o) { return o.dec_budg; })

        nwTotValueClient = jan_newCtotValue + feb_newCtotValue + mar_newCtotValue + apr_newCtotValue + may_newCtotValue + jun_newCtotValue
            + jul_newCtotValue + aug_newCtotValue + sep_newCtotValue + oct_newCtotValue + nov_newCtotValue + dec_newCtotValue
        
            poSumView.push({title: "Number of New Loan", sortkey: 2, group: 1, beg_bal: 0, jan_value : jan_newCtotValue, feb_value : feb_newCtotValue, mar_value : mar_newCtotValue, apr_value : apr_newCtotValue,
                may_value : may_newCtotValue, jun_value : jun_newCtotValue, jul_value : jul_newCtotValue, aug_value : aug_newCtotValue,
                sep_value : sep_newCtotValue, oct_value : oct_newCtotValue, nov_value : nov_newCtotValue, dec_value : dec_newCtotValue 
            }) 
        doneReadNLC = true
    }) //, function (err, fndPOV) {

    const oldLoanClientView = await Center_budget_det.find({po_code: viewPOCode, view_code: "OldLoanClient"}, function (err, fndOldCli) {

        begBalOldClient = _.sumBy(fndOldCli, function(o) { return o.beg_bal; })
        jan_oldCtotValue = _.sumBy(fndOldCli, function(o) { return o.jan_budg; })
        jan_oldCtotValue = _.sumBy(fndOldCli, function(o) { return o.jan_budg; })
        feb_oldCtotValue = _.sumBy(fndOldCli, function(o) { return o.feb_budg; })
        mar_oldCtotValue = _.sumBy(fndOldCli, function(o) { return o.mar_budg; })
        apr_oldCtotValue = _.sumBy(fndOldCli, function(o) { return o.apr_budg; })
        may_oldCtotValue = _.sumBy(fndOldCli, function(o) { return o.may_budg; })
        jun_oldCtotValue = _.sumBy(fndOldCli, function(o) { return o.jun_budg; })
        jul_oldCtotValue = _.sumBy(fndOldCli, function(o) { return o.jul_budg; })
        aug_oldCtotValue = _.sumBy(fndOldCli, function(o) { return o.aug_budg; })
        sep_oldCtotValue = _.sumBy(fndOldCli, function(o) { return o.sep_budg; })
        oct_oldCtotValue = _.sumBy(fndOldCli, function(o) { return o.oct_budg; })
        nov_oldCtotValue = _.sumBy(fndOldCli, function(o) { return o.nov_budg; })
        dec_oldCtotValue = _.sumBy(fndOldCli, function(o) { return o.dec_budg; })

        olTotValueClient = jan_oldCtotValue + feb_oldCtotValue + mar_oldCtotValue + apr_oldCtotValue + may_oldCtotValue + jun_oldCtotValue
                    + jul_oldCtotValue + aug_oldCtotValue + sep_oldCtotValue + oct_oldCtotValue + nov_oldCtotValue + dec_oldCtotValue
        
        poSumView.push({title: "Number of Reloan", sortkey: 3, group: 1, beg_bal: begBalOldClient, jan_value : jan_oldCtotValue, feb_value : feb_oldCtotValue, mar_value : mar_oldCtotValue, apr_value : apr_oldCtotValue,
            may_value : may_oldCtotValue, jun_value : jun_oldCtotValue, jul_value : jul_oldCtotValue, aug_value : aug_oldCtotValue,
            sep_value : sep_oldCtotValue, oct_value : oct_oldCtotValue, nov_value : nov_oldCtotValue, dec_value : dec_oldCtotValue 
        }) 
        doneReadOLC = true

    }) //, function (err, fndPOV) {

    if (doneReadNLC && doneReadOLC) {
        poSumView.push({title: "TOTAL NO. OF LOAN", sortkey: 4, group: 1, jan_value : jan_oldCtotValue + jan_newCtotValue, feb_value : feb_oldCtotValue + feb_newCtotValue, mar_value : mar_oldCtotValue + mar_newCtotValue, 
        apr_value : apr_oldCtotValue + apr_newCtotValue, may_value : may_oldCtotValue + may_newCtotValue, jun_value : jun_oldCtotValue + jun_newCtotValue, jul_value : jul_oldCtotValue + jul_newCtotValue, aug_value : aug_oldCtotValue + aug_newCtotValue,
            sep_value : sep_oldCtotValue + sep_newCtotValue, oct_value : oct_oldCtotValue + oct_newCtotValue, nov_value : nov_oldCtotValue + nov_newCtotValue, dec_value : dec_oldCtotValue + dec_newCtotValue
        }) 
    }

    poSumView.push({title: "AMOUNT OF LOANS", sortkey: 5, group: 2})


    const newLoanAmtView = await Center_budget_det.find({po_code: viewPOCode, view_code: "NewLoanAmt"}, function (err, fndNewAmt) {

        jan_newAtotValue = _.sumBy(fndNewAmt, function(o) { return o.jan_budg; })
        feb_newAtotValue = _.sumBy(fndNewAmt, function(o) { return o.feb_budg; })
        mar_newAtotValue = _.sumBy(fndNewAmt, function(o) { return o.mar_budg; })
        apr_newAtotValue = _.sumBy(fndNewAmt, function(o) { return o.apr_budg; })
        may_newAtotValue = _.sumBy(fndNewAmt, function(o) { return o.may_budg; })
        jun_newAtotValue = _.sumBy(fndNewAmt, function(o) { return o.jun_budg; })
        jul_newAtotValue = _.sumBy(fndNewAmt, function(o) { return o.jul_budg; })
        aug_newAtotValue = _.sumBy(fndNewAmt, function(o) { return o.aug_budg; })
        sep_newAtotValue = _.sumBy(fndNewAmt, function(o) { return o.sep_budg; })
        oct_newAtotValue = _.sumBy(fndNewAmt, function(o) { return o.oct_budg; })
        nov_newAtotValue = _.sumBy(fndNewAmt, function(o) { return o.nov_budg; })
        dec_newAtotValue = _.sumBy(fndNewAmt, function(o) { return o.dec_budg; })

        nwTotValueAmt = jan_newAtotValue + feb_newAtotValue + mar_newAtotValue + apr_newAtotValue + may_newAtotValue + jun_newAtotValue
                + jul_newAtotValue + aug_newAtotValue + sep_newAtotValue + oct_newAtotValue + nov_newAtotValue + dec_newAtotValue

        poSumView.push({title: "Amount of New Loan", sortkey: 6, group: 2, jan_value : jan_newAtotValue, feb_value : feb_newAtotValue, mar_value : mar_newAtotValue, apr_value : apr_newAtotValue,
            may_value : may_newAtotValue, jun_value : jun_newAtotValue, jul_value : jul_newAtotValue, aug_value : aug_newAtotValue,
            sep_value : sep_newAtotValue, oct_value : oct_newAtotValue, nov_value : nov_newAtotValue, dec_value : dec_newAtotValue 
        }) 
        doneReadNLA = true

    }) //, function (err, fndPOV) {

    const oldLoanAmtView = await Center_budget_det.find({po_code: viewPOCode, view_code: "OldLoanAmt"}, function (err, fndOldAmt) {

        jan_oldAtotValue = _.sumBy(fndOldAmt, function(o) { return o.jan_budg; })
        feb_oldAtotValue = _.sumBy(fndOldAmt, function(o) { return o.feb_budg; })
        mar_oldAtotValue = _.sumBy(fndOldAmt, function(o) { return o.mar_budg; })
        apr_oldAtotValue = _.sumBy(fndOldAmt, function(o) { return o.apr_budg; })
        may_oldAtotValue = _.sumBy(fndOldAmt, function(o) { return o.may_budg; })
        jun_oldAtotValue = _.sumBy(fndOldAmt, function(o) { return o.jun_budg; })
        jul_oldAtotValue = _.sumBy(fndOldAmt, function(o) { return o.jul_budg; })
        aug_oldAtotValue = _.sumBy(fndOldAmt, function(o) { return o.aug_budg; })
        sep_oldAtotValue = _.sumBy(fndOldAmt, function(o) { return o.sep_budg; })
        oct_oldAtotValue = _.sumBy(fndOldAmt, function(o) { return o.oct_budg; })
        nov_oldAtotValue = _.sumBy(fndOldAmt, function(o) { return o.nov_budg; })
        dec_oldAtotValue = _.sumBy(fndOldAmt, function(o) { return o.dec_budg; })

        olTotValueAmt = jan_oldAtotValue + feb_oldAtotValue + mar_oldAtotValue + apr_oldAtotValue + may_oldAtotValue + jun_oldAtotValue
                + jul_oldAtotValue + aug_oldAtotValue + sep_oldAtotValue + oct_oldAtotValue + nov_oldAtotValue + dec_oldAtotValue

                poSumView.push({title: "Amount of Reloan", sortkey: 7, group: 2, jan_value : jan_oldAtotValue, feb_value : feb_oldAtotValue, mar_value : mar_oldAtotValue, apr_value : apr_oldAtotValue,
                    may_value : may_oldAtotValue, jun_value : jun_oldAtotValue, jul_value : jul_oldAtotValue, aug_value : aug_oldAtotValue,
                    sep_value : sep_oldAtotValue, oct_value : oct_oldAtotValue, nov_value : nov_oldAtotValue, dec_value : dec_oldAtotValue 
                 }) 
        doneReadOLA = true

    }) //, function (err, fndPOV) {

        if (doneReadNLA && doneReadOLA) {
            let janTotAmtLoan = jan_oldAtotValue + jan_newAtotValue
            let febTotAmtLoan = feb_oldAtotValue + feb_newAtotValue
            let marTotAmtLoan = mar_oldAtotValue + mar_newAtotValue
            let aprTotAmtLoan = apr_oldAtotValue + apr_newAtotValue
            let mayTotAmtLoan = may_oldAtotValue + may_newAtotValue
            let junTotAmtLoan = jun_oldAtotValue + jun_newAtotValue
            let julTotAmtLoan = jul_oldAtotValue + jul_newAtotValue
            let augTotAmtLoan = aug_oldAtotValue + aug_newAtotValue
            let sepTotAmtLoan = sep_oldAtotValue + sep_newAtotValue
            let octTotAmtLoan = oct_oldAtotValue + oct_newAtotValue
            let novTotAmtLoan = nov_oldAtotValue + nov_newAtotValue
            let decTotAmtLoan = dec_oldAtotValue + dec_newAtotValue

            poSumView.push({title: "TOTAL AMOUNT OF LOAN", sortkey: 8, group: 2, jan_value : janTotAmtLoan, feb_value : febTotAmtLoan, mar_value : marTotAmtLoan, 
                apr_value : aprTotAmtLoan, may_value : mayTotAmtLoan, jun_value : junTotAmtLoan, jul_value : julTotAmtLoan, 
                aug_value : augTotAmtLoan, sep_value : sepTotAmtLoan, oct_value : octTotAmtLoan, nov_value : novTotAmtLoan, dec_value : decTotAmtLoan
            
            })
            poSumView.push({title: "LOAN PORTFOLIO", sortkey: 9, group: 1})

            poSumView.push({title: "MONTHLY DISBURSEMENT (P)", sortkey: 10, group: 1, jan_value : janTotAmtLoan, feb_value : febTotAmtLoan, mar_value : marTotAmtLoan, 
                apr_value : aprTotAmtLoan, may_value : mayTotAmtLoan, jun_value : junTotAmtLoan, jul_value : julTotAmtLoan, 
                aug_value : augTotAmtLoan, sep_value : sepTotAmtLoan, oct_value : octTotAmtLoan, nov_value : novTotAmtLoan, dec_value : decTotAmtLoan
            
            })

            let janRunBalAmt = janTotAmtLoan
            let febRunBalAmt = janRunBalAmt + febTotAmtLoan
            let marRunBalAmt = febRunBalAmt + marTotAmtLoan
            let aprRunBalAmt = marRunBalAmt + aprTotAmtLoan
            let mayRunBalAmt = aprRunBalAmt + mayTotAmtLoan
            let junRunBalAmt = mayRunBalAmt + junTotAmtLoan
            let julRunBalAmt = junRunBalAmt + julTotAmtLoan
            let augRunBalAmt = julRunBalAmt + augTotAmtLoan
            let sepRunBalAmt = augRunBalAmt + sepTotAmtLoan
            let octRunBalAmt = sepRunBalAmt + octTotAmtLoan
            let novRunBalAmt = octRunBalAmt + novTotAmtLoan
            let decRunBalAmt = novRunBalAmt + decTotAmtLoan

            poSumView.push({title: "MONTHLY LOAN PORTFOLIO", sortkey: 12, group: 1, jan_value : janRunBalAmt, feb_value : febRunBalAmt, mar_value : marRunBalAmt, 
                apr_value : aprRunBalAmt, may_value : mayRunBalAmt, jun_value : junRunBalAmt, jul_value : julRunBalAmt, 
                aug_value : augRunBalAmt, sep_value : sepRunBalAmt, oct_value : octRunBalAmt, nov_value : novRunBalAmt, dec_value : decRunBalAmt
            
            })

            let janRunBalPrevMon = 0  // Beginning Balance?
            let febRunBalPrevMon = janRunBalAmt
            let marRunBalPrevMon = febRunBalAmt
            let aprRunBalPrevMon = marRunBalAmt
            let mayRunBalPrevMon = aprRunBalAmt
            let junRunBalPrevMon = mayRunBalAmt
            let julRunBalPrevMon = junRunBalAmt
            let augRunBalPrevMon = julRunBalAmt
            let sepRunBalPrevMon = augRunBalAmt
            let octRunBalPrevMon = sepRunBalAmt
            let novRunBalPrevMon = octRunBalAmt
            let decRunBalPrevMon = novRunBalAmt
            
            poSumView.push({title: "BAL. FROM PREV. MONTH", sortkey: 11, group: 1, jan_value : janRunBalPrevMon, feb_value : febRunBalPrevMon, mar_value : marRunBalPrevMon, 
                apr_value : aprRunBalPrevMon, may_value : mayRunBalPrevMon, jun_value : junRunBalPrevMon, jul_value : julRunBalPrevMon, 
                aug_value : augRunBalPrevMon, sep_value : sepRunBalPrevMon, oct_value : octRunBalPrevMon, nov_value : novRunBalPrevMon, dec_value : decRunBalPrevMon
            
            })

        }
    

    try {

        let jan_totValue = 0  
                let feb_totValue = 0
                let mar_totValue = 0
                let apr_totValue = 0
                let may_totValue = 0
                let jun_totValue = 0
                let jul_totValue = 0
                let aug_totValue = 0
                let sep_totValue = 0
                let oct_totValue = 0
                let nov_totValue = 0
                let dec_totValue = 0

                console.log(viewPOCode)
                let poVSum = []


                vwloanType.forEach(loan_type => {
                    const typeLoanDet = loan_type.title
                    const vwlnType = loan_type.loan_type

                    let nloanTotAmt = 0
                    let nloanTotCli = 0
                    let oloanTotAmt = 0
                    let oloanTotCli = 0
                    let rloanTotCli = 0

//                    const  lnTypeBegBal = 

                    let jan_detNewtotCli = 0 
                    let feb_detNewtotCli = 0
                    let mar_detNewtotCli = 0
                    let apr_detNewtotCli = 0
                    let may_detNewtotCli = 0
                    let jun_detNewtotCli = 0
                    let jul_detNewtotCli = 0
                    let aug_detNewtotCli = 0
                    let sep_detNewtotCli = 0
                    let oct_detNewtotCli = 0
                    let nov_detNewtotCli = 0
                    let dec_detNewtotCli = 0
                        let begBal_OldCli = 0 
                        let jan_detOldtotCli = 0 
                        let feb_detOldtotCli = 0
                        let mar_detOldtotCli = 0
                        let apr_detOldtotCli = 0
                        let may_detOldtotCli = 0
                        let jun_detOldtotCli = 0
                        let jul_detOldtotCli = 0
                        let aug_detOldtotCli = 0
                        let sep_detOldtotCli = 0
                        let oct_detOldtotCli = 0
                        let nov_detOldtotCli = 0
                        let dec_detOldtotCli = 0
                    let jan_detNewtotAmt = 0 
                    let feb_detNewtotAmt = 0
                    let mar_detNewtotAmt = 0
                    let apr_detNewtotAmt = 0
                    let may_detNewtotAmt = 0
                    let jun_detNewtotAmt = 0
                    let jul_detNewtotAmt = 0
                    let aug_detNewtotAmt = 0
                    let sep_detNewtotAmt = 0
                    let oct_detNewtotAmt = 0
                    let nov_detNewtotAmt = 0
                    let dec_detNewtotAmt = 0
                        let jan_detOldtotAmt = 0 
                        let feb_detOldtotAmt = 0
                        let mar_detOldtotAmt = 0
                        let apr_detOldtotAmt = 0
                        let may_detOldtotAmt = 0
                        let jun_detOldtotAmt = 0
                        let jul_detOldtotAmt = 0
                        let aug_detOldtotAmt = 0
                        let sep_detOldtotAmt = 0
                        let oct_detOldtotAmt = 0
                        let nov_detOldtotAmt = 0
                        let dec_detOldtotAmt = 0
                    let jan_detResCli = 0 
                    let feb_detResCli = 0
                    let mar_detResCli = 0
                    let apr_detResCli = 0
                    let may_detResCli = 0
                    let jun_detResCli = 0
                    let jul_detResCli = 0
                    let aug_detResCli = 0
                    let sep_detResCli = 0
                    let oct_detResCli = 0
                    let nov_detResCli = 0
                    let dec_detResCli = 0

        //            console.log(typeLoan)
        
                    foundCenterDet.forEach(centerDet => {
                        const fvwlnType = centerDet.loan_type
                        const monthDet = centerDet.view_code
                        if (fvwlnType === typeLoanDet) {
                            switch(monthDet) {
                                case "NewLoanClient": orderMonth = 11 
                                    jan_detNewtotCli = jan_detNewtotCli + centerDet.jan_budg 
                                    feb_detNewtotCli = feb_detNewtotCli + centerDet.feb_budg 
                                    mar_detNewtotCli = mar_detNewtotCli + centerDet.mar_budg 
                                    apr_detNewtotCli = apr_detNewtotCli + centerDet.apr_budg 
                                    may_detNewtotCli = may_detNewtotCli + centerDet.may_budg 
                                    jun_detNewtotCli = jun_detNewtotCli + centerDet.jun_budg 
                                    jul_detNewtotCli = jul_detNewtotCli + centerDet.jul_budg 
                                    aug_detNewtotCli = aug_detNewtotCli + centerDet.aug_budg 
                                    sep_detNewtotCli = sep_detNewtotCli + centerDet.sep_budg 
                                    oct_detNewtotCli = oct_detNewtotCli + centerDet.oct_budg 
                                    nov_detNewtotCli = nov_detNewtotCli + centerDet.nov_budg 
                                    dec_detNewtotCli = dec_detNewtotCli + centerDet.dec_budg 
                                    break;
                                case "OldLoanClient": orderMonth = 12
                                    begBal_OldCli = begBal_OldCli + centerDet.beg_bal
                                    jan_detOldtotCli = jan_detOldtotCli + centerDet.jan_budg 
                                    feb_detOldtotCli = feb_detOldtotCli + centerDet.feb_budg 
                                    mar_detOldtotCli = mar_detOldtotCli + centerDet.mar_budg 
                                    apr_detOldtotCli = apr_detOldtotCli + centerDet.apr_budg 
                                    may_detOldtotCli = may_detOldtotCli + centerDet.may_budg 
                                    jun_detOldtotCli = jun_detOldtotCli + centerDet.jun_budg 
                                    jul_detOldtotCli = jul_detOldtotCli + centerDet.jul_budg 
                                    aug_detOldtotCli = aug_detOldtotCli + centerDet.aug_budg 
                                    sep_detOldtotCli = sep_detOldtotCli + centerDet.sep_budg 
                                    oct_detOldtotCli = oct_detOldtotCli + centerDet.oct_budg 
                                    nov_detOldtotCli = nov_detOldtotCli + centerDet.nov_budg 
                                    dec_detOldtotCli = dec_detOldtotCli + centerDet.dec_budg 
                                    break;
                                case "NewLoanAmt": orderMonth = 13
                                    jan_detNewtotAmt = jan_detNewtotAmt + centerDet.jan_budg 
                                    feb_detNewtotAmt = feb_detNewtotAmt + centerDet.feb_budg 
                                    mar_detNewtotAmt = mar_detNewtotAmt + centerDet.mar_budg 
                                    apr_detNewtotAmt = apr_detNewtotAmt + centerDet.apr_budg 
                                    may_detNewtotAmt = may_detNewtotAmt + centerDet.may_budg 
                                    jun_detNewtotAmt = jun_detNewtotAmt + centerDet.jun_budg 
                                    jul_detNewtotAmt = jul_detNewtotAmt + centerDet.jul_budg 
                                    aug_detNewtotAmt = aug_detNewtotAmt + centerDet.aug_budg 
                                    sep_detNewtotAmt = sep_detNewtotAmt + centerDet.sep_budg 
                                    oct_detNewtotAmt = oct_detNewtotAmt + centerDet.oct_budg 
                                    nov_detNewtotAmt = nov_detNewtotAmt + centerDet.nov_budg 
                                    dec_detNewtotAmt = dec_detNewtotAmt + centerDet.dec_budg 
                                    break;
                                case "OldLoanAmt": orderMonth = 14
                                    jan_detOldtotAmt = jan_detOldtotAmt + centerDet.jan_budg 
                                    feb_detOldtotAmt = feb_detOldtotAmt + centerDet.feb_budg 
                                    mar_detOldtotAmt = mar_detOldtotAmt + centerDet.mar_budg 
                                    apr_detOldtotAmt = apr_detOldtotAmt + centerDet.apr_budg 
                                    may_detOldtotAmt = may_detOldtotAmt + centerDet.may_budg 
                                    jun_detOldtotAmt = jun_detOldtotAmt + centerDet.jun_budg 
                                    jul_detOldtotAmt = jul_detOldtotAmt + centerDet.jul_budg 
                                    aug_detOldtotAmt = aug_detOldtotAmt + centerDet.aug_budg 
                                    sep_detOldtotAmt = sep_detOldtotAmt + centerDet.sep_budg 
                                    oct_detOldtotAmt = oct_detOldtotAmt + centerDet.oct_budg 
                                    nov_detOldtotAmt = nov_detOldtotAmt + centerDet.nov_budg 
                                    dec_detOldtotAmt = dec_detOldtotAmt + centerDet.dec_budg 
                                    break;
                                    case "ResClientCount": orderMonth = 14
                                    jan_detResCli = jan_detResCli + centerDet.jan_budg 
                                    feb_detResCli = feb_detResCli + centerDet.feb_budg 
                                    mar_detResCli = mar_detResCli + centerDet.mar_budg 
                                    apr_detResCli = apr_detResCli + centerDet.apr_budg 
                                    may_detResCli = may_detResCli + centerDet.may_budg 
                                    jun_detResCli = jun_detResCli + centerDet.jun_budg 
                                    jul_detResCli = jul_detResCli + centerDet.jul_budg 
                                    aug_detResCli = aug_detResCli + centerDet.aug_budg 
                                    sep_detResCli = sep_detResCli + centerDet.sep_budg 
                                    oct_detResCli = oct_detResCli + centerDet.oct_budg 
                                    nov_detResCli = nov_detResCli + centerDet.nov_budg 
                                    dec_detResCli = dec_detResCli + centerDet.dec_budg 
                                    break;
                                default:
                                    orderMonth = 0
                            }   
                        }
                    })
                        nloanTotCli = jan_detNewtotCli + feb_detNewtotCli + mar_detNewtotCli + apr_detNewtotCli + may_detNewtotCli + jun_detNewtotCli
                            + jul_detNewtotCli + aug_detNewtotCli + sep_detNewtotCli + oct_detNewtotCli + nov_detNewtotCli + dec_detNewtotCli
                            
                            if (nloanTotCli > 0) {
                                poSumView.push({title: typeLoanDet + " - NLC", desc: "newLoanClient", sortkey: 13, group: 2, jan_value : jan_detNewtotCli, feb_value : feb_detNewtotCli, mar_value : mar_detNewtotCli, apr_value : apr_detNewtotCli,
                                    may_value : may_detNewtotCli, jun_value : jun_detNewtotCli, jul_value : jul_detNewtotCli, aug_value : aug_detNewtotCli,
                                    sep_value : sep_detNewtotCli, oct_value : oct_detNewtotCli, nov_value : nov_detNewtotCli, dec_value : dec_detNewtotCli 
                                })         
                            }
                
                        oloanTotCli = jan_detOldtotCli + feb_detOldtotCli + mar_detOldtotCli + apr_detOldtotCli + may_detOldtotCli + jun_detOldtotCli
                            + jul_detOldtotCli + aug_detOldtotCli + sep_detOldtotCli + oct_detOldtotCli + nov_detOldtotCli + dec_detOldtotCli

                            if (oloanTotCli > 0) {
                                poSumView.push({title: typeLoanDet + " - OLC", desc: "oldLoanClient", sortkey: 14, group: 2, beg_bal : begBal_OldCli, jan_value : jan_detOldtotCli, feb_value : feb_detOldtotCli, mar_value : mar_detOldtotCli, apr_value : apr_detOldtotCli,
                                    may_value : may_detOldtotCli, jun_value : jun_detOldtotCli, jul_value : jul_detOldtotCli, aug_value : aug_detOldtotCli,
                                    sep_value : sep_detOldtotCli, oct_value : oct_detOldtotCli, nov_value : nov_detOldtotCli, dec_value : dec_detOldtotCli 
                                })         
                            }

                        nloanTotAmt = jan_detNewtotAmt + feb_detNewtotAmt + mar_detNewtotAmt + apr_detNewtotAmt + may_detNewtotAmt + jun_detNewtotAmt
                            + jul_detNewtotAmt + aug_detNewtotAmt + sep_detNewtotAmt + oct_detNewtotAmt + nov_detNewtotAmt + dec_detNewtotAmt

                            if (nloanTotAmt > 0) {
                                poSumView.push({title: typeLoanDet + " - NLA", desc: "newLoanAmt", sortkey: 15, group: 1, jan_value : jan_detNewtotAmt, feb_value : feb_detNewtotAmt, mar_value : mar_detNewtotAmt, apr_value : apr_detNewtotAmt,
                                    may_value : may_detNewtotAmt, jun_value : jun_detNewtotAmt, jul_value : jul_detNewtotAmt, aug_value : aug_detNewtotAmt,
                                    sep_value : sep_detNewtotAmt, oct_value : oct_detNewtotAmt, nov_value : nov_detNewtotAmt, dec_value : dec_detNewtotAmt 
                                })         
                            }

                        oloanTotAmt = jan_detOldtotAmt + feb_detOldtotAmt + mar_detOldtotAmt + apr_detOldtotAmt + may_detOldtotAmt + jun_detOldtotAmt
                            + jul_detOldtotAmt + aug_detOldtotAmt + sep_detOldtotAmt + oct_detOldtotAmt + nov_detOldtotAmt + dec_detOldtotAmt

                            if (oloanTotAmt > 0) {
                                poSumView.push({title: typeLoanDet + " - OLA", desc: "oldLoanAmt", sortkey: 16, group: 1, jan_value : jan_detOldtotAmt, feb_value : feb_detOldtotAmt, mar_value : mar_detOldtotAmt, apr_value : apr_detOldtotAmt,
                                    may_value : may_detOldtotAmt, jun_value : jun_detOldtotAmt, jul_value : jul_detOldtotAmt, aug_value : aug_detOldtotAmt,
                                    sep_value : sep_detOldtotAmt, oct_value : oct_detOldtotAmt, nov_value : nov_detOldtotAmt, dec_value : dec_detOldtotAmt 
                                })         
                            }

                        rloanTotCli = jan_detResCli + feb_detResCli + mar_detResCli + apr_detResCli + may_detResCli + jun_detResCli
                            + jul_detResCli + aug_detResCli + sep_detResCli + oct_detResCli + nov_detResCli + dec_detResCli
        
                            if (rloanTotCli > 0) {
                                poSumView.push({title: typeLoanDet + " - RES", desc: "ResClientCount", sortkey: 17, jan_value : jan_detResCli, feb_value : feb_detResCli, mar_value : mar_detResCli, apr_value : apr_detResCli,
                                    may_value : may_detResCli, jun_value : jun_detResCli, jul_value : jul_detResCli, aug_value : aug_detResCli,
                                    sep_value : sep_detResCli, oct_value : oct_detResCli, nov_value : nov_detResCli, dec_value : dec_detResCli 
                                })         
                            }
                    })         


   console.log(poSumView)

           poSumView.sort( function (a,b) {
                if ( a.sortkey < b.sortkey ){
                    return -1;
                }
                if ( a.sortkey > b.sortkey ){
                    return 1;
                }
                return 0;
            })

        res.render('centers/viewTargetsMonthly', {
            poCode: viewPOCode,
            poSumView: poSumView
        })
    } catch (err) {
        console.log(err)
        res.redirect('/centers/center/'+ viewPOCode)
    }
})


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


                    // fndPOV.forEach(poVSum => {
                    //     console.log(poVSum.view_code)
                    //     console.log(viewCod)
                    //     if (poVSum.view_code === viewCod) {
                    //         jan_totValue = jan_totValue + poVSum.jan_budg
                    //         feb_totValue = feb_totValue + poVSum.feb_budg
                    //         mar_totValue = mar_totValue + poVSum.mar_budg
                    //         apr_totValue = apr_totValue + poVSum.apr_budg
                    //         may_totValue = may_totValue + poVSum.may_budg
                    //         jun_totValue = jun_totValue + poVSum.jun_budg
                    //         jul_totValue = jul_totValue + poVSum.jul_budg
                    //         aug_totValue = aug_totValue + poVSum.aug_budg
                    //         sep_totValue = sep_totValue + poVSum.sep_budg
                    //         oct_totValue = oct_totValue + poVSum.oct_budg
                    //         nov_totValue = nov_totValue + poVSum.nov_budg
                    //         dec_totValue = dec_totValue + poVSum.dec_budg
                    //     }
    
                    // })

                    // jan_totValue = _.sumBy(fndPOV, function(o) { return o.jan_budg; })
                    // feb_totValue = _.sumBy(fndPOV, function(o) { return o.feb_budg; })
                    // mar_totValue = _.sumBy(fndPOV, function(o) { return o.mar_budg; })
                    // apr_totValue = _.sumBy(fndPOV, function(o) { return o.apr_budg; })
                    // may_totValue = _.sumBy(fndPOV, function(o) { return o.may_budg; })
                    // jun_totValue = _.sumBy(fndPOV, function(o) { return o.jun_budg; })
                    // jul_totValue = _.sumBy(fndPOV, function(o) { return o.jul_budg; })
                    // aug_totValue = _.sumBy(fndPOV, function(o) { return o.aug_budg; })
                    // sep_totValue = _.sumBy(fndPOV, function(o) { return o.sep_budg; })
                    // oct_totValue = _.sumBy(fndPOV, function(o) { return o.oct_budg; })
                    // nov_totValue = _.sumBy(fndPOV, function(o) { return o.nov_budg; })
                    // dec_totValue = _.sumBy(fndPOV, function(o) { return o.dec_budg; })
