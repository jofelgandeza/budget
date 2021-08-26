
const { query } = require('express')
const express = require('express')
const { model } = require('mongoose')
const router  = express.Router()
// const Swal = require('sweetalert2')
const Center = require('../models/center')
const Employee = require('../models/employee')
const Position = require('../models/position')
const Loan_type = require('../models/loan_type')
const Center_budget_det = require('../models/center_budget_det')
const Budg_exec_sum = require('../models/budg_exec_sum')
const Unit = require('../models/unit')
const Po = require('../models/po')
const _ = require('lodash')
const Cleave = require('../public/javascripts/cleave.js')
const { forEach, isNull } = require('lodash')
const { authUser, authRole } = require('../public/javascripts/basicAuth.js')
const { canViewProject, canDeleteProject, scopedProjects } = require('../public/javascripts/permissions/project.js')
const user = require('../models/user')
const { ROLE } = require('../public/javascripts/data.js')
const excel = require('exceljs')


const monthSelect = ["January","February", "March", "April", "May", "June", "July", "August", "September", "October", "November","December"];


let unitPosition = []
let poSumView = []

// View UNIT's Buget  - TUG-A
router.get('/:id', authUser, authRole(ROLE.PUH), async (req, res) => {
    
    const unitCode = req.params.id
    console.log(unitCode)
    const branchCode = unitCode.substring(0,3)
    const unitLetter = unitCode.substr(4,1)

    const unitPosition = posisyon

    // console.log(posisyon)

    const _user = req.user
    // const branEmployees = brnEmployees

    let foundPOs = []
    let officerName = ""
    let postManager = ""
    let postUnitHead = ""
    let postProgOfr = ""

    let unitLoanTotals = []
    let brnLoanTotals = []
    let brnLoanGrandTot = []
    let foundCenter = []
    

    let newClients = 0
    let nClientAmt = 0
    let oClient = 0
    let oClientAmt = 0
    let rClient = 0
    let rClient2 = 0
    let totDisburse = 0
    let budgBegBal = 0
    let tbudgEndBal = 0
    let totbudgEndBal = 0

    let doneReadTot = false
    let doneReadSubTot = false
    let doneReadLoanTot = false

    unitPosition.forEach(fndPosii => {
        const fndPositionEmp = fndPosii.code
        const fndPositID = fndPosii._id
        if (fndPositionEmp === "BRN_MGR") {
            postManager = fndPositID
        }
        if (fndPositionEmp === "UNI_HED") {
            postUnitHead = fndPositID
        }
        if (fndPositionEmp === "PRO_OFR") {
            postProgOfr = fndPositID
        }
    })

   console.log(postManager)
   console.log(postUnitHead)
   console.log(postProgOfr)

    try {

    const branEmployees = await Employee.findOne({assign_code: unitCode}, function (err, fndUnitHead) {
        
        officerName = fndUnitHead.first_name + " " + _.trim(fndUnitHead.middle_name).substr(0,1) + ". " + fndUnitHead.last_name
    })

        const programOfficers = await Employee.find({branch: branchCode, unit: unitLetter, position_code: postProgOfr}, function (err, foundPO){
            foundPOs = foundPO
            })

        const loanType = await Loan_type.find({})

        const center = await Center.find({branch: branchCode, unit: unitLetter}) 
//        const center = await Center.find(searchOptions)

        if (center.length === 0) {
            doneReadTot = true
        
        } else {
            newClients = _.sumBy(center, function(o) { return o.newClient; });
            nClientAmt = _.sumBy(center, function(o) { return o.newClientAmt; });
            oClient = _.sumBy(center, function(o) { return o.oldClient; });
            oClientAmt = _.sumBy(center, function(o) { return o.oldClientAmt; });
            rClient = _.sumBy(center, function(o) { return o.resClient; });
            rClient2 = _.sumBy(center, function(o) { return o.resClient2; });
            budgBegBal = _.sumBy(center, function(o) { return o.budget_BegBal; });
            budgEndBal = oClient + newClients 
            totDisburse = nClientAmt + oClientAmt
            // totbudgEndBal = (budgBegBal + newClients) - (rClient + rClient2)

            foundCenter = center.sort()
            doneReadTot = true
        }

        if (foundPOs.length === 0) {
            doneReadSubTot = true
        }
//    console.log(foundCenter)

    foundPOs.forEach(uh => {

        let poNum = _.trim(uh.po_number)
        let uniCode = poNum
        let unHeadName = uh.first_name + " " + uh.middle_name.substr(0,1) + ". " + uh.last_name
        let forSortPoNum = poNum

        let nUnitLoanTot = 0
        let nUnitLoanTotCount = 0
        let oUnitLoanTot = 0
        let oUnitLoanTotCount = 0
        let resUnitLoanTot = 0
        let begUnitLoanTot = 0
        let begUnitClientTot = 0

        let typeLoan = ""
        let count = 0 
    
        loanType.forEach(loan_type => {
            typeLoan = loan_type.title
            let nloanTot = 0
            let nloanTotCount = 0
            let oloanTot = 0
            let oloanTotCount = 0
            let resloanTot = 0
            let begLoanTot = 0
            let begClientTot = 0
            let bClientAmt = 0
            let bClientCnt = 0
            lnType = loan_type.loan_type

            count = count + 1
            if (count !== 1) {
                uniCode = " "
                unHeadName = ""
                poNum = ""
            } 

            foundCenter.forEach(center => {
                const poNo = center.po
                if (poNo === forSortPoNum) { 
                    const lnType = center.loan_code
                    let centerTargets = center.Targets
                    let LoanBegBal = center.Loan_beg_bal
//                  let centerLoanBegBal = center.Loan_beg_bal                
                    // resloanTot = resloanTot + (center.resClient + center.resClient2)
            
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
                                resloanTot = resloanTot + centerLoan.resignClient
                            }
                        }
                    })

                    LoanBegBal.forEach(centerBegBal => {
                        if (_.trim(centerBegBal.loan_type) === _.trim(typeLoan)) {
                            begLoanTot = centerBegBal.beg_amount
                            begClientTot = centerBegBal.beg_client_count
                            bClientCnt = bClientCnt + begClientTot
                            bClientAmt = bClientAmt + begLoanTot
                        }
                    })
                }
            })
            let totAmounts = nloanTot + oloanTot 
            let unitBudgEndBal = (begClientTot + nloanTotCount) - resloanTot
            totbudgEndBal = totbudgEndBal + unitBudgEndBal

//            let amtDisburse = oloanTot + oloanTot
            
            unitLoanTotals.push({sortkey: forSortPoNum, po: poNum, unitHead: unHeadName, loan_type: typeLoan, nnumClient: nloanTotCount, amtDisburse: totAmounts, begClientTot: bClientCnt,
                begClientAmt: bClientAmt, ntotAmount: nloanTot, onumClient: oloanTotCount, ototAmount: oloanTot, resiloanTot: resloanTot, budgEndBal: unitBudgEndBal})

            nUnitLoanTot = nUnitLoanTot + nloanTot
            nUnitLoanTotCount = nUnitLoanTotCount + nloanTotCount
            oUnitLoanTot = oUnitLoanTot + oloanTot
            oUnitLoanTotCount = oUnitLoanTotCount + oloanTotCount
            resUnitLoanTot = resUnitLoanTot + resloanTot
            begUnitLoanTot = begUnitLoanTot + begLoanTot
            begUnitClientTot = begUnitClientTot + begClientTot
    
        })

        typeLoan = "PO TOTALS"
        let totUnitAmounts = nUnitLoanTot + oUnitLoanTot 
        let budgUnitEndBal = (oUnitLoanTotCount + nUnitLoanTotCount + begUnitClientTot) - resUnitLoanTot

        unitLoanTotals.push({sortkey: forSortPoNum, po: poNum, unitHead: unHeadName, loan_type: typeLoan, nnumClient: nUnitLoanTotCount, amtDisburse: totUnitAmounts, begClientTot: begUnitClientTot,
            begClientAmt: begUnitLoanTot, ntotAmount: nUnitLoanTot, onumClient: oUnitLoanTotCount, ototAmount: oUnitLoanTot, resiloanTot: resUnitLoanTot, budgEndBal: budgUnitEndBal})
        
            doneReadSubTot = true
    })
    // console.log(unitLoanTotals)

// LOOP for getting Different Loan products totals in the branch
    let gtBegBalClient = 0
    let gtBegBalAmt = 0

    loanType.forEach(loan_type => {
        typeLoan = loan_type.title
        let nloanTot = 0
        let nloanTotCount = 0
        let oloanTot = 0
        let oloanTotCount = 0
        let resloanTot = 0
        let begLoanTot = 0
        let ubegClientTot = 0
        let bClient = 0
        let bClientCnt = 0
        const lonType = loan_type.loan_type
//        let unCode = ""
        unitLoanTotals.forEach(uLoanTots => {
            const ulnType = uLoanTots.loan_type
            if (ulnType === typeLoan) {
                nloanTot = nloanTot + uLoanTots.ntotAmount
                nloanTotCount = nloanTotCount + uLoanTots.nnumClient
                oloanTot = oloanTot + uLoanTots.ototAmount
                oloanTotCount = oloanTotCount + uLoanTots.onumClient
                resloanTot = resloanTot + uLoanTots.resiloanTot
                begLoanTot = begLoanTot + uLoanTots.begClientAmt
                ubegClientTot = ubegClientTot + uLoanTots.begClientTot

                gtBegBalClient = gtBegBalClient + uLoanTots.begClientTot
                gtBegBalAmt = gtBegBalAmt + uLoanTots.begClientAmt
            }

        })
        let totBranchAmounts = nloanTot + oloanTot 
        let budgBranchEndBal = (ubegClientTot + nloanTotCount) - resloanTot
            tbudgEndBal = tbudgEndBal + budgBranchEndBal

        brnLoanTotals.push({loan_type: typeLoan, nnumClient: nloanTotCount, amtDisburse: totBranchAmounts, begClientTot: ubegClientTot,
            begClientAmt: begLoanTot, ntotAmount: nloanTot, onumClient: oloanTotCount, ototAmount: oloanTot, resloanTot: resloanTot, budgEndBal: budgBranchEndBal})
        
        doneReadLoanTot = true
    })

        console.log(tbudgEndBal)
 //   console.log(unitLoanTotals)
//    console.log(brnLoanTotals)

            brnLoanGrandTot.push({nClient: newClients, nClientAmt: nClientAmt, oClient: oClient, oClientAmt: oClientAmt, 
                rClient: rClient + rClient2, budgBegBal: budgBegBal, budgEndBal: tbudgEndBal, totalDisburse: totDisburse, budBegBalAmt: gtBegBalAmt, budBegBalClient: gtBegBalClient})

                sortedPOs = unitLoanTotals.sort( function (a,b) {
                    if ( a.sortkey < b.sortkey ){
                        return -1;
                      }
                      if ( a.sortkey > b.sortkey ){
                        return 1;
                      }
                       return 0;
                })

        if (doneReadTot && doneReadSubTot && doneReadLoanTot) {
            // res.send('Eto oh!')
            res.render('units/budget', {
                yuser: _user,
                perUnitCode: unitCode,
                officerName: officerName,
                loanTots: brnLoanTotals,
                poGrandTot: brnLoanGrandTot
            })
        }             

    } 
    catch (err) {
        console.log(err)
    }
})

// View UNIT's Budget per PO  - TUG-A
router.get('/perPO/:id', authUser, authRole(ROLE.PUH), async (req, res) => {
    
    const unitCodePO = req.params.id
    const branchCodePO = unitCodePO.substring(0,3)
    const unitLetterPO = unitCodePO.substr(4,1)
    const _userPO = req.user
    console.log(_userPO)

    const unitPosisyon = posisyon

    let foundPOunits = []
    let officerNamePUH = ""
    let foundPOs = []
    let postManagerPO = ""
    let postUnitHeadPO = ""
    let postProgOfrPO = ""

    // console.log(unitPosisyon)
    
    let unitLoanTotals = []
    let foundCenter = []
    
    // const POdata = await Employee.findOne({assign_code: IDcode})
    // const POname = POdata.first_name + " " + POdata.middle_name.substr(0,1) + ". " + POdata.last_name
    // const POposition = POdata.position_code

    let doneReadTot = false
    let doneReadSubTot = false
    let doneReadLoanTot = false
   
    unitPosisyon.forEach(fndPosii => {
        const fndPositionEmp = fndPosii.code
        const fndPositID = fndPosii._id
        if (fndPositionEmp === "BRN_MGR") {
            postManagerPO = fndPositID
        }
        if (fndPositionEmp === "UNI_HED") {
            postUnitHeadPO = fndPositID
        }
        if (fndPositionEmp === "PRO_OFR") {
            postProgOfrPO = fndPositID
        }
    })

    let unitEmployees = []
    let unitPUH = []
    
    try {

        unitPUH = await Employee.find({assign_code: unitCodePO, position_code: postUnitHeadPO})
        console.log(unitPUH)

            officerNamePUH = unitPUH.first_name + " " + _.trim(unitPUH.middle_name).substring(0,1) + ". " + unitPUH.last_name

        // foundPOs = _.find(unitEmployees, {unit: unitLetterPO, position_code: postProgOfrPO})
        //     console.log(foundPOs)
        const programOfficers = await Employee.find({branch: branchCodePO, unit: unitLetterPO, position_code: postProgOfrPO}, function (err, foundPO){
            foundPOs = foundPO
            })
       
        let fndPositionEmp 
        let fndPositID

        const loanType = await Loan_type.find({})

        const center = await Center.find({branch: branchCodePO, unit: unitLetterPO}, function (err, foundCenters) {
//        const center = await Center.find(searchOptions)

            foundCenter = foundCenters.sort()
            doneReadTot = true
        })

        if (center.length === 0) {
            doneReadTot = true  
        }
//    console.log(foundCenter)

    foundPOs.forEach(uh => {

        let poNum = _.trim(uh.po_number)
        let uniCode = poNum
        let unHeadName = uh.first_name + " " + uh.middle_name.substr(0,1) + ". " + uh.last_name
        let forSortPoNum = poNum

        let nUnitLoanTot = 0
        let nUnitLoanTotCount = 0
        let oUnitLoanTot = 0
        let oUnitLoanTotCount = 0
        let resUnitLoanTot = 0
        let begUnitLoanTot = 0
        let begUnitClientTot = 0

        let typeLoan = ""
        let count = 0 
    
        loanType.forEach(loan_type => {
            typeLoan = loan_type.title
            let nloanTot = 0
            let nloanTotCount = 0
            let oloanTot = 0
            let oloanTotCount = 0
            let resloanTot = 0
            let begLoanTot = 0
            let uBegClientTot = 0
            let bClientAmt = 0
            let bClientCnt = 0
            lnType = loan_type.loan_type

            count = count + 1
            if (count !== 1) {
                uniCode = " "
                unHeadName = ""
                poNum = ""
            } 

            foundCenter.forEach(center => {
                const poNo = center.po
                if (poNo === forSortPoNum) { 
                    const lnType = center.loan_code
                    let centerTargets = center.Targets
                    let LoanBegBal = center.Loan_beg_bal
//                  let centerLoanBegBal = center.Loan_beg_bal                
                    // resloanTot = resloanTot + (center.resClient + center.resClient2)
            
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
                                resloanTot = resloanTot + centerLoan.resignClient
                            }
                        }
                    })

                    LoanBegBal.forEach(centerBegBal => {
                        if (_.trim(centerBegBal.loan_type) === _.trim(typeLoan)) {
                            begLoanTot = centerBegBal.beg_amount
                            bClientCnt = centerBegBal.beg_client_count
                            uBegClientTot = uBegClientTot + bClientCnt
                            bClientAmt = bClientAmt + begLoanTot
                        }
                    })
                }
            })
            let totAmounts = nloanTot + oloanTot 
            let budgEndBal = (uBegClientTot + nloanTotCount) - resloanTot
//            let amtDisburse = oloanTot + oloanTot
            
            unitLoanTotals.push({sortkey: forSortPoNum, po: poNum, unitHead: unHeadName, loan_type: typeLoan, nnumClient: nloanTotCount, amtDisburse: totAmounts, begClientTot: uBegClientTot,
                begClientAmt: bClientAmt, ntotAmount: nloanTot, onumClient: oloanTotCount, ototAmount: oloanTot, resiloanTot: resloanTot, budgEndBal: budgEndBal})

            nUnitLoanTot = nUnitLoanTot + nloanTot
            nUnitLoanTotCount = nUnitLoanTotCount + nloanTotCount
            oUnitLoanTot = oUnitLoanTot + oloanTot
            oUnitLoanTotCount = oUnitLoanTotCount + oloanTotCount
            resUnitLoanTot = resUnitLoanTot + resloanTot
            begUnitLoanTot = begUnitLoanTot + begLoanTot
            begUnitClientTot = begUnitClientTot + uBegClientTot
    
        })

        typeLoan = "PO TOTALS"
        let totUnitAmounts = nUnitLoanTot + oUnitLoanTot 
        let budgUnitEndBal = (oUnitLoanTotCount + nUnitLoanTotCount + begUnitClientTot) - resUnitLoanTot

        unitLoanTotals.push({sortkey: forSortPoNum, po: poNum, unitHead: unHeadName, loan_type: typeLoan, nnumClient: nUnitLoanTotCount, amtDisburse: totUnitAmounts, begClientTot: begUnitClientTot,
            begClientAmt: begUnitLoanTot, ntotAmount: nUnitLoanTot, onumClient: oUnitLoanTotCount, ototAmount: oUnitLoanTot, resiloanTot: resUnitLoanTot, budgEndBal: budgUnitEndBal})
        
            doneReadSubTot = true
    })
    // console.log(unitLoanTotals)
            if (unitLoanTotals.length !== 0) {
                sortedPOs = unitLoanTotals.sort( function (a,b) {
                    if ( a.sortkey < b.sortkey ){
                        return -1;
                      }
                      if ( a.sortkey > b.sortkey ){
                        return 1;
                      }
                       return 0;
                })
            }

        if (doneReadTot && doneReadSubTot) {
            // res.send('Eto oh!')
            res.render('units/budgetPerPO', {
                yuser: _userPO,
                perUnitCode: unitCodePO,
                officerName: officerNamePUH,
                unitLoanTots: unitLoanTotals
            })
        }             

    } 
    catch (err) {
        console.log(err)
    }
})


// SET NEW POs - one-time
router.get('/setNewPOs/:id', authUser, authRole(ROLE.PUH), async (req, res) => {

    const unitCode = req.params.id
    const poBranch = unitCode.substr(0,3)
    const poUnitLet = unitCode.substr(4,1)
    const poCod = unitCode.substr(0,6)
    const yuser = req.user

console.log(unitCode)

    let foundPOs = []
    
    let numPOs = 0
    let doneReadPOs = false
    
    try {
        const loanType = await Loan_type.find({})

        const unit = await Po.findOne({po_code: poCod}, function (err, foundedPO) {
            foundPOs = foundedPO
        })

            res.render('units/setNewPOs', {
                fondPos: foundPOs,
                numPOs: numPOs,
                uniCod: unitCode,
                lonType: loanType,
                searchOptions: req.query,
                yuser: yuser
            })
    } catch (err) {
        console.log(err)
        res.redirect('/units/'+unitCode)
    }
})

// POST or Save NEW SET PO's
router.post('/postNewPOs/:id', authUser, authRole(ROLE.PUH), async (req, res) => {
    
    const param = req.params.id
    const brnCod = param.substr(0,3)
    const poUnit = param.substr(4,1)
    const poCod = param.substr(0,5)
    const numPOs = _.toNumber(req.body.numPOs)

    console.log(numPOs)
    let locals   
 
    var i //defines i

    try {

        // const unit = await Po.findOne({po_code: poCod}, function (err, foundedPO) {

        // })

        let cntrNum = 0
        for (i = 1; i <= numPOs; i++) { //starts loop
            console.log("The Number Is: " + i) //What ever you want
            let po_Code = poCod + _.trim(_.toString(i))

            let po = new Po({
                po_code: po_Code,
                po_number: i,
                unit_code: param,
                unit: poUnit,
                branch: brnCod,
                loan_type: req.body.poLoan,
                emp_code: "",
                num_centers: 0,
                num_centers_budg: 0, 
                status: "Vacant"
            })
            const newPO = await po.save()
        }

       res.redirect('/units/pos/'+ param)
     
 } catch (err) {
     console.log(err)
    let locals = {errorMessage: 'Something WENT went wrong.'}
     res.redirect('/units/'+ brnCod)
 }
 })
 

// Get POs for Maintenance
router.get('/pos/:id', authUser, authRole(ROLE.PUH), async (req, res) => {

    const unitCode = req.params.id
    const poBranch = unitCode.substr(0,3)
    const poUnitLet = unitCode.substr(4,1)
    const poCode = unitCode.substr(0,6)
    const yuser = req.user

console.log(unitCode)

    let foundEmployee = []
    let fondPO = []
    let foundPOs = []
    let empCode = ""
    let empName = ""
    
    let poName = ""
    let doneReadPOs = false
    
    try {

        const brnEmployees = await Employee.find({branch: poBranch, unit: poUnitLet})

        const unitPOs = await Po.find({unit_code: unitCode}, function (err, fndPO) {

            foundPOs = fndPO

            foundPOs.forEach(fndPos =>{
                const id = fndPos._id
                const poCode = fndPos.po_code
                const poNum = fndPos.po_number
                const pounitCode = fndPos.unit_code
                const pounitNum = fndPos.unit
                const poBrnch = fndPos.branch
                const poLoanProd = fndPos.loan_type
                const poEmpCod = fndPos.emp_code
                const poCenterNum = fndPos.num_centers
                const poStatus = fndPos.status
                let poName = " "
                if (poEmpCod ===""){
                } else {
                      const po_Name = _.find(brnEmployees, {emp_code: poEmpCod})
                        poName = po_Name.last_name + ", "+ po_Name.first_name + " "+ _.trim(po_Name.middle_name).substr(0,1) + "."
                 }
                    
                fondPO.push({poID: id, poCode: poCode, poNum: poNum, UnitCode: unitCode, poUnitLet: poUnitLet, 
                    poName: poName, poStatus: "Active", branch: poBrnch, poLoanProd: poLoanProd})
                
            })
            
            sortedPOs= fondPO.sort( function (a,b) {
                if ( a.poNum < b.poNum ){
                    return -1;
                  }
                  if ( a.poNum > b.poNum ){
                    return 1;
                  }
                   return 0;
            })
    
            res.render('units/po', {
                uniCod: unitCode,
                fondPos: sortedPOs,
                searchOptions: req.query,
                yuser: yuser
            })

        })
    } catch (err) {
        console.log(err)
        res.redirect('/')
    }
})
 
// Get NEW PO
router.get('/newPO/:id', authUser, authRole(ROLE.PUH), async (req, res) => {
    
    const poCode = req.params.id
    const uniCode = poCode.substr(0,5)
    const yuser = req.user

    const loanType = await Loan_type.find({})

         res.render('units/newPO', { 
            po: new Po(), 
            lonType: loanType,
            unitCode: uniCode,
            yuser: yuser
         })
    // })
//    console.log(position)

})

// POST or Save new Unit
router.post('/postNewPO/:id', authUser, authRole(ROLE.PUH), async (req, res) => {
    const _user = req.user
    const param = req.params.id
    const brnCod = param.substr(0,3)
    const poUnit = param.substr(4,1)
    const poCod = param + req.body.poNum

    let canProceed = true
    let locals   
 
 try {
    const unit = await Po.findOne({po_code: poCod}, function (err, foundedPO) {

    })

    if (unit === null) {
        canProceed = true
    } else {
        canProceed = false
    }

    if (canProceed) {
        let po = new Po({
            po_code: poCod,
            po_number: req.body.poNum,
            unit_code: param,
            unit: poUnit,
            branch: brnCod,
            area: _user.area,
            region: _user.region,
            loan_type: req.body.poLoan,
            emp_code: "",
            num_centers: 0,
            num_centers_budg: 0, 
            status: "Vacant"
       })
       const newPO = await po.save()
       res.redirect('/units/pos/'+ param)
     
    } else {
        locals = {errorMessage: 'PO number already exists!'}

        const loanType = await Loan_type.find({})

        res.render('units/newPO', { 
           unit: new Unit(), 
           lonType: loanType,
           branchCode: brnCod,
           locals: locals
         })
    }

 } catch (err) {
     console.log(err)
    let locals = {errorMessage: 'Something WENT went wrong.'}
     res.redirect('/units/'+ brnCod)
 }
 })
 
 // Get a PO for EDIT
router.get('/getPOForEdit/:id/edit', authUser, authRole(ROLE.PUH), async (req, res) => {
    const param = req.params.id
    const brnCod = param.substring(0,3)
    const uUnitCode = param.substr(0,5)
    const uUnit = param.substr(4,1)
    const yuser = req.user

    let foundedPO = []

    try {

        const loanType = await Loan_type.find({})

        const unitPO = await Po.findOne({po_code: param}, function (err, fndPO) {
            foundedPO = fndPO
        })
        console.log(foundedPO)

        res.render('units/editPO', { 
            po: foundedPO, 
            lonType: loanType,
            unitCode: uUnitCode,
            yuser: yuser
       })

    } catch (err) {
            console.log(err)
            let locals = {errorMessage: 'Something WENT went wrong.'}
            res.redirect('/units/pos/'+ uUnitCode)
    }
})

// SAVE EDITed Unit

router.put('/putEditedPo/:id', authUser, authRole(ROLE.PUH), async function(req, res){
    const poCode = req.params.id
    const brnCod = poCode.substring(0,3)
    const poUnitCode = poCode.substring(0,5)
    const poUnitNum = poCode.substring(4,1)
    const poNum = poCode.substring(5,1)
    const ln_Typ = req.body.loanTyp

    console.log(req.params.id)

    let listPO
        try {

            listPO = await Po.findOne({po_code: poCode})

            listPO.unit_code = poUnitCode
            listPO.unit = poUnitNum
            listPO.branch = brnCod
            listPO.loan_type = ln_Typ
        
            await listPO.save()
        
            res.redirect('/units/pos/'+ poUnitCode)

        } catch (err) {
            console.log(err)
            let locals = {errorMessage: 'Something WENT went wrong.'}
            res.redirect('/units/'+ poUnitCode, {
            locals: locals
            })
        }
  
})

//Set/View CENTERS per PO 

router.get('/setPOCenters/:id', authUser, authRole(ROLE.PUH), async (req, res) => {

    const IDcode = req.params.id

    const poNumber = IDcode.substr(5,1)
    const unit_Code = IDcode.substr(0,5)
    const unitCode = IDcode.substr(4,1)
    const branchCode = IDcode.substr(0,3)
    const yuser = req.user

    console.log(IDcode)

    let foundCenter = []
    let fndCenter = []
    let doneReadCtr = false

    try {

        const loanType = await Loan_type.find({})

        const center = await Center.find({branch: branchCode, unit: unitCode, po: poNumber}, function (err, foundCenters) {
            foundCenter = foundCenters
            doneReadCtr = true
        })

        if (center.length === 0) {
            doneReadCtr = true
        }
        foundCenter.forEach(fndCtr => {
            

        })
        
        if (doneReadCtr) {
            res.render('units/center', {
                poCode: IDcode,
                unitCode: unitCode,
                unit_Code: unit_Code,
                centers: foundCenter,
                yuser: yuser
            })
        }
    } catch (err) {
        console.log(err)
        res.redirect('/')
    }
})

// SET NEW CENTERS - ONE-TIME
router.get('/setNewCenters/:id', authUser, authRole(ROLE.PUH), async (req, res) => {
    
    const poCode = req.params.id
    const uniCode = poCode.substr(0,5)
    const centerStatus = ["For Target","Active"]
    const numCenters = 0
    const yuser = req.user
    let fndCenters = [ ]

    try {
    const lonType = await Loan_type.find({})

    // fndCenters = await Center.find({po_code: poCode})

    // if (isNull(fndCenters)) {


    // }

        res.render('units/setNewCenters', { 
            numCenters: numCenters,
            lonType: lonType,
            poCode: poCode,
            yuser: yuser
        })

        // res.redirect('/units/setPOCenters/'+ centerPoCode)
    } catch (err) {
        console.log(err)
       let locals = {errorMessage: 'Something WENT went wrong.'}
        res.redirect('/units/setPOCenters/'+ centerPoCode)

    }
})

//SAVE NEW SET CENTERS
router.post('/postNewCenters/:id', authUser, authRole(ROLE.PUH), async (req, res) => {
    const _user = req.user
    const centerPoCode = req.body.po_Code
    const poNumber = centerPoCode.substr(5,1)
    const unitCode = centerPoCode.substr(4,1)
    const branchCode = centerPoCode.substr(0,3)
    const centerNumber = req.body.numCenters
    let centerNums = _.toNumber(req.body.numCenters) 

    console.log(centerNums)
    var i //defines i

    try {
        let cntrNum = 0
        for (i = 1; i <= centerNums; i++) { //starts loop
            console.log("The Number Is: " + i) //What ever you want

            switch(poNumber) {
                case "1": 
                    if (i < 10) {
                        cntrCode = centerPoCode + _.padStart(i, 2, '0')        
                    } else {
                        cntrCode = centerPoCode + i
                    }
                    break;
                case "2": 
                    cntrNum = i + 10
                    break;
                case "3": 
                    cntrNum = i + 20
                    break;
                case "4": 
                    cntrNum = i + 30
                    break;
                case "5": 
                    cntrNum = i + 40
                    break;
                case "6": 
                    cntrNum = i + 50
                    break;
                case "7": 
                    cntrNum = i + 60
                    break;
                case "8": 
                    cntrNum = i + 70
                    break;
                case "9": 
                    cntrNum = i + 80
                    break;
                default:
                    cntrNum = 0
            }   
        
                if (poNumber > 1) {
                    cntrCode = centerPoCode + _.toString(cntrNum)
                }
        
            // let cntrCode
            // if (cntrNum.length === 1) {
            //     cntrCode = centerPoCode + _.padStart(cntrNum, 2, '0')        
            // } else {
            //     cntrCode = centerPoCode + cntrNum
            // }
            const cntrLoanType = "GLP"
            const cntrAdd = ""
            const cntrStat = "Active"
        
            const cntrInfo = [
                {address: cntrAdd}
            ]
        
            let center = new Center({
            
                region: _user.region,
                area: _user.area,
                branch: branchCode,
                unit: unitCode,
                po: poNumber,
                po_code: centerPoCode,
                center_no: i,
                center: cntrCode,
                active_clients: 0,
                active_loan_amt: 0,
                loan_cycle: 0,
                loan_type: cntrLoanType,
                status: cntrStat,
                beg_center_month: " ",
                Info : cntrInfo,
                Targets: [],
                Loan_beg_bal: [],
                budgBegBalCli: 0,
                budgBegBal: 0,
                newClient: 0,
                newClientAmt: 0,
                oldClient: 0,
                oldClientAmt: 0,
                resClient: 0,
                resClient2: 0
            })
            
            let locals
            let fondCtr
            //console.log(brnCode)
            let canProceed = true
        
            fondCtr = await Center.findOne({center: cntrCode})

            if (!fondCtr) {
                const newCoa = await center.save()
            } else {
                canProceed = false
                const centerStatus = ["Target","Active"]

                const lonType = await Loan_type.find({})
            
                locals = {errorMessage: 'Center number for the PO is already exist!'}
                res.render('units/newCenter', { 
                    center: fondCtr,
                    centerAdd: cntrAdd,
                    poCode: centerPoCode,
                    unitCode: unitCode,
                    lonType: lonType,
                    centerStatus: centerStatus,
                    locals: locals
                })
            }
        } //e


    res.redirect('/units/setPOCenters/'+ centerPoCode)

 } catch (err) {
     console.log(err)
    let locals = {errorMessage: 'Something WENT went wrong.'}
     res.redirect('/units/setPOCenters/'+ centerPoCode)
 }
 })
 
// Get NEW CENTER
router.get('/newCenter/:id', authUser, authRole(ROLE.PUH), async (req, res) => {
    
    const poCode = req.params.id
    const uniCode = poCode.substr(0,5)
    const centerStatus = ["For Target","Active"]
    const ctrAdd = ""
    const yuser = req.user

    const lonType = await Loan_type.find({})

        res.render('units/newCenter', { 
            center: new Center(),
            centerAdd: ctrAdd,
            poCode: poCode,
            unitCode: uniCode,
            lonType: lonType,
            centerStatus: centerStatus,
            yuser: yuser
        })

})

// POST or Save new CENTER
router.post('/postNewCenter/:id', authUser, authRole(ROLE.PUH), async (req, res) => {

    const _user = req.user
    const centerPoCode = req.body.po_Code
    const poNumber = centerPoCode.substr(5,1)
    const unitCode = centerPoCode.substr(4,1)
    const branchCode = centerPoCode.substr(0,3)
    const centerNumber = req.body.cntrNum
    let cntrNum = _.toNumber(req.body.cntrNum) 

    
    switch(poNumber) {
        case "1": 
            if (cntrNum < 10) {
                cntrCode = centerPoCode + _.padStart(cntrNum, 2, '0')        
            } else {
                cntrCode = centerPoCode + cntrNum
            }
            break;
        case "2": 
            cntrNum = cntrNum + 10
            break;
        case "3": 
            cntrNum = cntrNum + 20
            break;
        case "4": 
            cntrNum = cntrNum + 30
            break;
        case "5": 
            cntrNum = cntrNum + 40
            break;
        case "6": 
            cntrNum = cntrNum + 50
            break;
        case "7": 
            cntrNum = cntrNum + 60
            break;
        case "8": 
            cntrNum = cntrNum + 70
            break;
        case "9": 
            cntrNum = cntrNum + 80
            break;
        default:
            cntrNum = 0
    }   

        if (poNumber > 1) {
            cntrCode = centerPoCode + _.toString(cntrNum)
        }

    // let cntrCode
    // if (cntrNum.length === 1) {
    //     cntrCode = centerPoCode + _.padStart(cntrNum, 2, '0')        
    // } else {
    //     cntrCode = centerPoCode + cntrNum
    // }
    const cntrLoanType = req.body.cntrLoan
    const cntrAdd = req.body.centerAdd
    const cntrStat = req.body.centerStat

    const cntrInfo = [
        {address: cntrAdd}
      ]
 
 let center = new Center({
 
    region: _user.region,
    area: _user.area,
    branch: branchCode,
    unit: unitCode,
    po: poNumber,
    po_code: centerPoCode,
    center_no: centerNumber,
    center: cntrCode,
    active_clients: 0,
    active_loan_amt: 0,
    loan_cycle: 0,
    loan_type: cntrLoanType,
    status: cntrStat,
    beg_center_month: " ",
    Info : cntrInfo,
    Targets: [],
    Loan_beg_bal: [],
    budgBegBalCli: 0,
    budgBegBal: 0,
    newClient: 0,
    newClientAmt: 0,
    oldClient: 0,
    oldClientAmt: 0,
    resClient: 0,
    resClient2: 0
 })
 
 let locals
 let fondCtr
 //console.log(brnCode)
 let canProceed = true
 try {
     fondCtr = await Center.findOne({center: cntrCode})

     if (!fondCtr) {
        const newCoa = await center.save()
        res.redirect('/units/setPOCenters/'+ centerPoCode)
    } else {
        canProceed = false
        const centerStatus = ["Target","Active"]

        const lonType = await Loan_type.find({})
     
        locals = {errorMessage: 'Center number for the PO is already exist!'}
        res.render('units/newCenter', { 
            center: fondCtr,
            centerAdd: cntrAdd,
            poCode: centerPoCode,
            unitCode: unitCode,
            lonType: lonType,
            centerStatus: centerStatus,
            locals: locals
        })
   }

 } catch (err) {
     console.log(err)
    let locals = {errorMessage: 'Something WENT went wrong.'}
     res.redirect('/units/setPOCenters/'+ centerPoCode)
 }
 })
 

 // Get a CENTER for EDIT
router.get('/getCenterForEdit/:id/edit', authUser, authRole(ROLE.PUH), async (req, res) => {

    const params = req.params.id
    const centerID = params.substr(0,8)
    const center_id = _.trim(params.substr(8,25))
    const centerStatus = ["For Target","Active"]
    let ctrInfo = []
    let ctrAdd = ""
    const yuser = req.user

try {
    const ctrLonType = await Loan_type.find({})

    const Fndcenter = await Center.findById(center_id)

        const ctrPoCod = Fndcenter.center.substr(0,6)
        const ctrUniCod = ctrPoCod.substr(0,5)
        const ctrBranch = ctrPoCod.substr(0,3)

        ctrInfo = Fndcenter.Info
        if (ctrInfo.length === 0) {
        } else {
            ctrAdd = ctrInfo[0].address
        }


    const lonType = await Loan_type.find({})

    res.render('units/editCenter', { 
        center: Fndcenter, 
        centerAdd: ctrAdd,
        poCode: ctrPoCod,
        unitCode: ctrUniCod,
        lonType: ctrLonType,
        centerStatus: centerStatus,
        yuser: yuser
    })

} catch (err) {
        console.log(err)
        let locals = {errorMessage: 'Something WENT went wrong.'}
        res.redirect('/units/pos/'+ ctrUniCod)
}
})


 // SAVE EDITed Center

router.put('/putEditedCenter/:id', authUser, authRole(ROLE.PUH), async function(req, res){
    //params.id is center.center
    const centerPoCode = req.body.po_Code
    const poNumber = centerPoCode.substr(5,1)
    const unitCode = centerPoCode.substr(4,1)
    const branchCode = centerPoCode.substr(0,3)
    const centerNumber = req.body.cntrNum
    let cntrNum = _.toNumber(req.body.cntrNum) 
    let cntrCode = ""
    
    switch(poNumber) {
        case "1": 
            if (cntrNum < 10) {
                cntrCode = centerPoCode + _.padStart(cntrNum, 2, '0')        
            } else {
                cntrCode = centerPoCode + cntrNum
            }
            break;
        case "2": 
            cntrNum = cntrNum + 10
            break;
        case "3": 
            cntrNum = cntrNum + 20
            break;
        case "4": 
            cntrNum = cntrNum + 30
            break;
        case "5": 
            cntrNum = cntrNum + 40
            break;
        case "6": 
            cntrNum = cntrNum + 50
            break;
            cntrNum = cntrNum + 60
        case "7": 
            break;
        case "8": 
            cntrNum = cntrNum + 70
            break;
        case "9": 
            cntrNum = cntrNum + 80
            break;
        default:
            cntrNum = 0
    }   

        if (poNumber > 1) {
            cntrCode = centerPoCode + _.toString(cntrNum)
        }

    const cntrLoanType = req.body.cntrLoan
    let cntrAdd = req.body.centerAdd
        cntrAdd = cntrAdd.toUpperCase()
    const cntrStat = req.body.centerStat

    const cntrInfo = [
        {address: cntrAdd}
      ]

    let center_no
        try {

            center = await Center.findOne({center: req.params.id})

            center.center_no = centerNumber
            center.center = cntrCode
            center.loan_type = cntrLoanType
            center.status = cntrStat
            center.address = req.body.unitAdd
            center.Info = cntrInfo
        
            await center.save()
        
            res.redirect('/units/setPOCenters/'+ centerPoCode)

        } catch (err) {
            console.log(err)
            let locals = {errorMessage: 'Something WENT went wrong.'}
            res.redirect('/units/setPOCenters/'+ centerPoCode, {
            locals: locals
            })
        }
})

//DELETE Center Route
router.delete('/deleteCenter/:id', authUser, authRole(ROLE.PUH), async (req, res) => {

    let poCntr

    try {
        poCntr = await Center.findById(req.params.id)
        const delCenterPO = poCntr.center.substr(0,6)
        await poCntr.remove()  
        res.redirect('/units/setPOCenters/' + delCenterPO)
    } catch (err) {
        console.log(err)
    }
})


router.delete('/deletePO/:id', authUser, authRole(ROLE.PUH), async (req, res) => {

    let unPO

    try {
        unPO = await Po.findById(req.params.id)
        delUnitPO = unPO.unit_code
        await unPO.remove()  
        res.redirect('/units/pos/'+delUnitPO)
    } catch (err) {
        console.log(err)
    }
})


// View Unit per PO  - TUG-A
router.get('/unit/:id', authUser, authRole(ROLE.PUH), async (req, res) => {
    
    const IDcode = req.params.id
   
    const unitCode = IDcode.substr(4,1)
    const branchCode = IDcode.substr(0,3)
    const uniCode = IDcode.substr(0,4)
    const yuser = req.user

    console.log(IDcode)
    console.log(unitCode)
    console.log(uniCode)
   
    let foundCenter = []
    let foundPOunits = []
    let foundPO = []
    let officerName = ""
      
       try {
           const employee = await Employee.find({branch: branchCode, unit: unitCode}, function (err, foundPOs){
               foundPOunits = foundPOs
           })
   
           console.log(foundPOunits)
   
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
               const rClient2 = _.sumBy(foundCenters, function(o) { return o.resClient2; });
   
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
   
               console.log(foundCenter)
   
               foundCenter.forEach(center_data => {
                   if (center_data.po === POnumber) {
                       neClientNum = neClientNum + center_data.newClient
                       neClientAmt = neClientAmt + center_data.newClientAmt
                       olClientNum = olClientNum + center_data.oldClient
                       olClientAmt = olClientAmt + center_data.oldClientAmt
                       reClientNum = reClientNum + (center_data.resClient + center_data.resClient2) 
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
               console.log(foundPO)
   
               res.render('centers/unit', {
                   listTitle: branchCode+"-"+unitCode,
                   officerName: officerName,
                   POs: foundPO,
                   searchOptions: req.query,
                   yuser: yuser
               })
   
       } 
       catch (err) {
           console.log(err)
       }
   })
   
   
router.post('/delete', authUser, authRole(ROLE.PUH), async (req, res) => {
 //   alert('Are you sure you want to delete this record?')
     let centerCode = req.body.listName
     const checkedItemId = req.body.checkbox;
     const listName = req.body.listName;
    console.log(checkedItemId)
    let center
    try {       
        center = await Center.findOneAndUpdate({center: listName}, {$pull: {Targets :{_id: checkedItemId }}}, function(err, foundList){
            if (!err) {
                res.redirect('/centers/' + centerCode + '/edit')
            }
            console.log(foundList)
        })
    } catch (err) {
        console.log(err)
      }   
      console.log(center)
})

router.delete('/deleteEmp/:id', authUser, authRole(ROLE.PUH), async (req, res) => {

    let empYee

    try {
        empYee = await Employee.findById(req.params.id)
        delBranCode = empYee.branch
        await empYee.remove()  
        res.redirect('/branches/employees/'+delBranCode)
    } catch (err) {
        console.log(err)
    }
})

// 
// View UNIT Targets per month ROUTE
router.get('/viewUnitTargetMon/:id', authUser, authRole(ROLE.PUH), async (req, res) => {

    const viewUnitCode = req.params.id
    const vwUnitCode = viewUnitCode
    const vwBranchCode = vwUnitCode.substr(0,3)
    const vwUnitLetter = vwUnitCode.substr(4,1)
    const yuser = req.user

    let foundPOV = []
    // let foundCenterDet = []

    const vwloanType = await Loan_type.find({})
    // console.log(vwloanType)

    let poTotLoanAmtArray = []

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

        let doneReadNLCli = false
        let doneReadOLCli = false
        let doneReadResCli = false

        let fndUnitBudgExecTotLonAmt = []

        let fndUnitBudgExecTotInc = []
        let fndUnitBuExTotProcFees = []

        poSumView = [ ]
    try {

        const foundCenters = await Center.find({branch: vwBranchCode, unit: vwUnitLetter}, function(err, foundCenters) {
            const fndCenters = foundCenters
            let centerCntBegBal = 0
            let jan_centerCount = 0
            let feb_centerCount = 0
            let mar_centerCount = 0
            let apr_centerCount = 0
            let may_centerCount = 0
            let jun_centerCount = 0
            let jul_centerCount = 0
            let aug_centerCount = 0
            let sep_centerCount = 0
            let oct_centerCount = 0
            let nov_centerCount = 0
            let dec_centerCount = 0
                console.log(fndCenters)
            fndCenters.forEach( fCenters => {
                const monthCenterBegBal = _.trim(fCenters.beg_center_month)
                    console.log(monthCenterBegBal)
                if (fCenters.status === "For Target") {
                    switch(monthCenterBegBal) {
                        case "January":
                            jan_centerCount = jan_centerCount + 1
                            break;
                        case "February":
                            feb_centerCount = feb_centerCount + 1
                            break;
                        case "March":
                            mar_centerCount = mar_centerCount + 1
                            break;
                        case "April":
                            apr_centerCount = apr_centerCount + 1
                            break;
                        case "May":
                            may_centerCount = may_centerCount + 1
                            break;
                        case "June":
                            jun_centerCount = jun_centerCount + 1
                            break;
                        case "July":
                            jul_centerCount = jul_centerCount + 1
                            break;
                        case "August":
                            aug_centerCount = aug_centerCount + 1
                            break;
                        case "September":
                            sep_centerCount = sep_centerCount + 1
                            break;
                        case "October":
                            oct_centerCount = oct_centerCount + 1
                            break;
                        case "November":
                            nov_centerCount = nov_centerCount + 1
                            break;git 
                        case "December":
                            dec_centerCount = dec_centerCount + 1
                            break;
                        default:
                            jan_centerCount = 0
                    }
                    
                } else {
                    centerCntBegBal = centerCntBegBal + 1
                }

            })
            
            jan_centerCount = jan_centerCount + centerCntBegBal
            feb_centerCount = feb_centerCount + jan_centerCount
            mar_centerCount = mar_centerCount + feb_centerCount
            apr_centerCount = apr_centerCount + mar_centerCount
            may_centerCount = may_centerCount + apr_centerCount
            jun_centerCount = jun_centerCount + may_centerCount
            jul_centerCount = jul_centerCount + jun_centerCount
            aug_centerCount = aug_centerCount + jul_centerCount
            sep_centerCount = sep_centerCount + aug_centerCount
            oct_centerCount = oct_centerCount + sep_centerCount
            nov_centerCount = nov_centerCount + oct_centerCount
            dec_centerCount = dec_centerCount + nov_centerCount

            poSumView.push({title: "NUMBER OF CENTERS", sortkey: 2, group: 1, isTitle: false, beg_bal: centerCntBegBal, jan_value: jan_centerCount, feb_value: feb_centerCount, mar_value: mar_centerCount,
                apr_value: apr_centerCount, may_value: may_centerCount, jun_value: jun_centerCount, jul_value: jul_centerCount, aug_value: aug_centerCount,
                sep_value: sep_centerCount, oct_value: oct_centerCount, nov_value: nov_centerCount, dec_value: dec_centerCount, tot_value : dec_centerCount
            })

        })
        
        //  Pre-determine if items is already existed or saved in Budg_exec_sum Collection
            const poBudgExecTotLonAmt = await Budg_exec_sum.findOne({unit: viewUnitCode, view_code: "TotLoanAmt"}, function (err, fndTotLonAmt) {
                fndUnitBudgExecTotLonAmt = fndTotLonAmt
            })

            const poBudgExecTotIncAmt = await Budg_exec_sum.findOne({unit: viewUnitCode, view_code: "TotProjInc"}, function (err, fndTotIncAmt) {
                fndUnitBudgExecTotInc = fndTotIncAmt
            })

            const fndUnitBuExTotProcFeeAmt = await Budg_exec_sum.findOne({unit: viewUnitCode, view_code: "TotProcFee"}, function (err, fndTotProcFeeAmt) {
                fndUnitBuExTotProcFees = fndTotProcFeeAmt
            })
            console.log(poBudgExecTotLonAmt)

            const foundCenterDet = await Center_budget_det.find({unit: viewUnitCode})

        //    console.log(foundCenterDet)

        poSumView.push({title: "CENTERS", sortkey: 1, group: 1, isTitle: true})

        poSumView.push({title: "CLIENTS", sortkey: 3, group: 2, isTitle: true})


        const newClientCntView = await Center_budget_det.find({unit: viewUnitCode, view_code: "NewLoanClient", client_count_included: true }, function (err, fndNewCliCnt) {
            jan_newCliTot = _.sumBy(fndNewCliCnt, function(o) { return o.jan_budg; })
            feb_newCliTot = _.sumBy(fndNewCliCnt, function(o) { return o.feb_budg; })
            mar_newCliTot = _.sumBy(fndNewCliCnt, function(o) { return o.mar_budg; })
            apr_newCliTot = _.sumBy(fndNewCliCnt, function(o) { return o.apr_budg; })
            may_newCliTot = _.sumBy(fndNewCliCnt, function(o) { return o.may_budg; })
            jun_newCliTot = _.sumBy(fndNewCliCnt, function(o) { return o.jun_budg; })
            jul_newCliTot = _.sumBy(fndNewCliCnt, function(o) { return o.jul_budg; })
            aug_newCliTot = _.sumBy(fndNewCliCnt, function(o) { return o.aug_budg; })
            sep_newCliTot = _.sumBy(fndNewCliCnt, function(o) { return o.sep_budg; })
            oct_newCliTot = _.sumBy(fndNewCliCnt, function(o) { return o.oct_budg; })
            nov_newCliTot = _.sumBy(fndNewCliCnt, function(o) { return o.nov_budg; })
            dec_newCliTot = _.sumBy(fndNewCliCnt, function(o) { return o.dec_budg; })

            nwTotValueClient = jan_newCliTot + feb_newCliTot + mar_newCliTot + apr_newCliTot + may_newCliTot + jun_newCliTot
                + jul_newCliTot + aug_newCliTot + sep_newCliTot + oct_newCliTot + nov_newCliTot + dec_newCliTot
            
                poSumView.push({title: "New Clients", sortkey: 4, group: 2, beg_bal: 0, jan_value : jan_newCliTot, feb_value : feb_newCliTot, mar_value : mar_newCliTot, apr_value : apr_newCliTot,
                    may_value : may_newCliTot, jun_value : jun_newCliTot, jul_value : jul_newCliTot, aug_value : aug_newCliTot,
                    sep_value : sep_newCliTot, oct_value : oct_newCliTot, nov_value : nov_newCliTot, dec_value : dec_newCliTot, tot_value : dec_newCliTot
                }) 
                doneReadNLCli = true
        }) //, function (err, fndPOV) {

        const oldClientCntView = await Center_budget_det.find({unit: viewUnitCode, view_code: "OldLoanClient", client_count_included: true}, function (err, fndOldCliCnt) {

            begBalOldClient = _.sumBy(fndOldCliCnt, function(o) { return o.beg_bal; })
            jan_oldCliTot = _.sumBy(fndOldCliCnt, function(o) { return o.jan_budg; })
            feb_oldCliTot = _.sumBy(fndOldCliCnt, function(o) { return o.feb_budg; })
            mar_oldCliTot = _.sumBy(fndOldCliCnt, function(o) { return o.mar_budg; })
            apr_oldCliTot = _.sumBy(fndOldCliCnt, function(o) { return o.apr_budg; })
            may_oldCliTot = _.sumBy(fndOldCliCnt, function(o) { return o.may_budg; })
            jun_oldCliTot = _.sumBy(fndOldCliCnt, function(o) { return o.jun_budg; })
            jul_oldCliTot = _.sumBy(fndOldCliCnt, function(o) { return o.jul_budg; })
            aug_oldCliTot = _.sumBy(fndOldCliCnt, function(o) { return o.aug_budg; })
            sep_oldCliTot = _.sumBy(fndOldCliCnt, function(o) { return o.sep_budg; })
            oct_oldCliTot = _.sumBy(fndOldCliCnt, function(o) { return o.oct_budg; })
            nov_oldCliTot = _.sumBy(fndOldCliCnt, function(o) { return o.nov_budg; })
            dec_oldCliTot = _.sumBy(fndOldCliCnt, function(o) { return o.dec_budg; })

            olTotValueClient = jan_oldCliTot + feb_oldCliTot + mar_oldCliTot + apr_oldCliTot + may_oldCliTot + jun_oldCliTot
                        + jul_oldCliTot + aug_oldCliTot + sep_oldCliTot + oct_oldCliTot + nov_oldCliTot + dec_oldCliTot
            
            poSumView.push({title: "Old Clients", sortkey: 5, group: 2, beg_bal: begBalOldClient, jan_value : jan_oldCliTot, feb_value : feb_oldCliTot, mar_value : mar_oldCliTot, apr_value : apr_oldCliTot,
                may_value : may_oldCliTot, jun_value : jun_oldCliTot, jul_value : jul_oldCliTot, aug_value : aug_oldCliTot,
                sep_value : sep_oldCliTot, oct_value : oct_oldCliTot, nov_value : nov_oldCliTot, dec_value : dec_oldCliTot, tot_value : dec_oldCliTot
            }) 

            doneReadOLCli = true

        }) //, function (err, fndPOV) {

        const resClientCntView = await Center_budget_det.find({unit: viewUnitCode, view_code: "ResClientCount", client_count_included: true}, function (err, fndResCliCnt) {

            jan_resCliTot = _.sumBy(fndResCliCnt, function(o) { return o.jan_budg; })
            feb_resCliTot = _.sumBy(fndResCliCnt, function(o) { return o.feb_budg; })
            mar_resCliTot = _.sumBy(fndResCliCnt, function(o) { return o.mar_budg; })
            apr_resCliTot = _.sumBy(fndResCliCnt, function(o) { return o.apr_budg; })
            may_resCliTot = _.sumBy(fndResCliCnt, function(o) { return o.may_budg; })
            jun_resCliTot = _.sumBy(fndResCliCnt, function(o) { return o.jun_budg; })
            jul_resCliTot = _.sumBy(fndResCliCnt, function(o) { return o.jul_budg; })
            aug_resCliTot = _.sumBy(fndResCliCnt, function(o) { return o.aug_budg; })
            sep_resCliTot = _.sumBy(fndResCliCnt, function(o) { return o.sep_budg; })
            oct_resCliTot = _.sumBy(fndResCliCnt, function(o) { return o.oct_budg; })
            nov_resCliTot = _.sumBy(fndResCliCnt, function(o) { return o.nov_budg; })
            dec_resCliTot = _.sumBy(fndResCliCnt, function(o) { return o.dec_budg; })

            olTotValueClient = jan_resCliTot + feb_resCliTot + mar_resCliTot + apr_resCliTot + may_resCliTot + jun_resCliTot
                        + jul_resCliTot + aug_resCliTot + sep_resCliTot + oct_resCliTot + nov_resCliTot + dec_resCliTot
            
            poSumView.push({title: "Resign Clients", sortkey: 6, group: 2, jan_value : jan_resCliTot, feb_value : feb_resCliTot, mar_value : mar_resCliTot, apr_value : apr_resCliTot,
                may_value : may_resCliTot, jun_value : jun_resCliTot, jul_value : jul_resCliTot, aug_value : aug_resCliTot,
                sep_value : sep_resCliTot, oct_value : oct_resCliTot, nov_value : nov_resCliTot, dec_value : dec_resCliTot, tot_value : dec_resCliTot
            }) 
        
            doneReadResCli = true

        }) //, function (err, fndPOV) {

    // if (doneReadNLCli && doneReadOLCli && doneReadResCli) {

        jan_oldCliTot = begBalOldClient 
            let jan_totNumClients = (jan_oldCliTot + jan_newCliTot) - jan_resCliTot
        feb_oldCliTot = jan_totNumClients
            let feb_totNumClients = (feb_oldCliTot + feb_newCliTot) - feb_resCliTot    
        mar_oldCliTot = feb_totNumClients
            let mar_totNumClients = (mar_oldCliTot + mar_newCliTot) - mar_resCliTot
        apr_oldCliTot = mar_totNumClients
            let apr_totNumClients = (apr_oldCliTot + apr_newCliTot) - apr_resCliTot
        may_oldCliTot = apr_totNumClients
            let may_totNumClients = (may_oldCliTot + may_newCliTot) - may_resCliTot
        jun_oldCliTot = may_totNumClients
            let jun_totNumClients = (jun_oldCliTot + jun_newCliTot) - jun_resCliTot
        jul_oldCliTot = jun_totNumClients
            let jul_totNumClients = (jul_oldCliTot + jul_newCliTot) - jul_resCliTot
        aug_oldCliTot = jul_totNumClients
            let aug_totNumClients = (aug_oldCliTot + aug_newCliTot) - aug_resCliTot
        sep_oldCliTot = aug_totNumClients
            let sep_totNumClients = (sep_oldCliTot + sep_newCliTot) - sep_resCliTot
        oct_oldCliTot = sep_totNumClients
            let oct_totNumClients = (oct_oldCliTot + oct_newCliTot) - oct_resCliTot
        nov_oldCliTot = oct_totNumClients
            let nov_totNumClients = (nov_oldCliTot + nov_newCliTot) - nov_resCliTot
        dec_oldCliTot = nov_totNumClients
            let dec_totNumClients = (dec_oldCliTot + dec_newCliTot) - dec_resCliTot
        
        poSumView.push({title: "TOTAL NO. OF CLIENTS", sortkey: 7, group: 2, jan_value : jan_totNumClients, feb_value : feb_totNumClients, mar_value : mar_totNumClients, 
            apr_value : apr_totNumClients, may_value : may_totNumClients, jun_value : jun_totNumClients, jul_value : jul_totNumClients, aug_value : aug_totNumClients,
            sep_value : sep_totNumClients, oct_value : oct_totNumClients, nov_value : nov_totNumClients, dec_value : dec_totNumClients, tot_value : dec_totNumClients
        }) 
    // }

        poSumView.push({title: "NUMBER OF LOANS", sortkey: 8, group: 1, isTitle: true})

        const newLoanClientView = await Center_budget_det.find({unit: viewUnitCode, view_code: "NewLoanClient"}, function (err, fndNewCli) {
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
            
                poSumView.push({title: "Number of New Loan", sortkey: 9, group: 1, beg_bal: 0, jan_value : jan_newCtotValue, feb_value : feb_newCtotValue, mar_value : mar_newCtotValue, apr_value : apr_newCtotValue,
                    may_value : may_newCtotValue, jun_value : jun_newCtotValue, jul_value : jul_newCtotValue, aug_value : aug_newCtotValue,
                    sep_value : sep_newCtotValue, oct_value : oct_newCtotValue, nov_value : nov_newCtotValue, dec_value : dec_newCtotValue, tot_value : nwTotValueClient
                }) 
            doneReadNLC = true
        }) //, function (err, fndPOV) {

        const oldLoanClientView = await Center_budget_det.find({unit: viewUnitCode, view_code: "OldLoanClient"}, function (err, fndOldCli) {

            begBalOldClient = _.sumBy(fndOldCli, function(o) { return o.beg_bal; })
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
            
            poSumView.push({title: "Number of Reloan", sortkey: 10, group: 1, beg_bal: begBalOldClient, jan_value : jan_oldCtotValue, feb_value : feb_oldCtotValue, mar_value : mar_oldCtotValue, apr_value : apr_oldCtotValue,
                may_value : may_oldCtotValue, jun_value : jun_oldCtotValue, jul_value : jul_oldCtotValue, aug_value : aug_oldCtotValue,
                sep_value : sep_oldCtotValue, oct_value : oct_oldCtotValue, nov_value : nov_oldCtotValue, dec_value : dec_oldCtotValue, tot_value : olTotValueClient
            }) 
            doneReadOLC = true

        }) //, function (err, fndPOV) {
            let jan_totNoOfLoan = jan_oldCtotValue + jan_newCtotValue
            let feb_totNoOfLoan = feb_oldCtotValue + feb_newCtotValue
            let mar_totNoOfLoan = mar_oldCtotValue + mar_newCtotValue
            let apr_totNoOfLoan = apr_oldCtotValue + apr_newCtotValue
            let may_totNoOfLoan = may_oldCtotValue + may_newCtotValue
            let jun_totNoOfLoan = jun_oldCtotValue + jun_newCtotValue
            let jul_totNoOfLoan = jul_oldCtotValue + jul_newCtotValue
            let aug_totNoOfLoan = aug_oldCtotValue + aug_newCtotValue
            let sep_totNoOfLoan = sep_oldCtotValue + sep_newCtotValue
            let oct_totNoOfLoan = oct_oldCtotValue + oct_newCtotValue
            let nov_totNoOfLoan = nov_oldCtotValue + nov_newCtotValue
            let dec_totNoOfLoan = dec_oldCtotValue + dec_newCtotValue

            if (doneReadNLC && doneReadOLC) {
                let tot_totNoOfLoan = jan_totNoOfLoan + feb_totNoOfLoan + mar_totNoOfLoan + apr_totNoOfLoan + may_totNoOfLoan + jun_totNoOfLoan + jul_totNoOfLoan +
                        aug_totNoOfLoan + sep_totNoOfLoan + oct_totNoOfLoan + nov_totNoOfLoan + dec_totNoOfLoan

                poSumView.push({title: "TOTAL NO. OF LOAN", sortkey: 11, group: 1, jan_value : jan_totNoOfLoan, feb_value : feb_totNoOfLoan, mar_value : mar_totNoOfLoan, 
                    apr_value : apr_totNoOfLoan, may_value : may_totNoOfLoan, jun_value : jun_totNoOfLoan, jul_value : jul_totNoOfLoan, aug_value : aug_totNoOfLoan,
                    sep_value : sep_totNoOfLoan, oct_value : oct_totNoOfLoan, nov_value : nov_totNoOfLoan, dec_value : dec_totNoOfLoan, tot_value: tot_totNoOfLoan
               }) 
            }

        poSumView.push({title: "AMOUNT OF LOANS", sortkey: 12, group: 2, isTitle: true})


        const newLoanAmtView = await Center_budget_det.find({unit: viewUnitCode, view_code: "NewLoanAmt"}, function (err, fndNewAmt) {

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

            poSumView.push({title: "Amount of New Loan", sortkey: 13, group: 2, jan_value : jan_newAtotValue, feb_value : feb_newAtotValue, mar_value : mar_newAtotValue, apr_value : apr_newAtotValue,
                may_value : may_newAtotValue, jun_value : jun_newAtotValue, jul_value : jul_newAtotValue, aug_value : aug_newAtotValue,
                sep_value : sep_newAtotValue, oct_value : oct_newAtotValue, nov_value : nov_newAtotValue, dec_value : dec_newAtotValue, tot_value : nwTotValueAmt
            }) 
            doneReadNLA = true

        }) //, function (err, fndPOV) {

        const oldLoanAmtView = await Center_budget_det.find({unit: viewUnitCode, view_code: "OldLoanAmt"}, function (err, fndOldAmt) {

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

                    poSumView.push({title: "Amount of Reloan", sortkey: 14, group: 2, jan_value : jan_oldAtotValue, feb_value : feb_oldAtotValue, mar_value : mar_oldAtotValue, apr_value : apr_oldAtotValue,
                        may_value : may_oldAtotValue, jun_value : jun_oldAtotValue, jul_value : jul_oldAtotValue, aug_value : aug_oldAtotValue,
                        sep_value : sep_oldAtotValue, oct_value : oct_oldAtotValue, nov_value : nov_oldAtotValue, dec_value : dec_oldAtotValue, tot_value : olTotValueAmt
                    }) 
            doneReadOLA = true

        }) //, function (err, fndPOV) {

        let jan_totColAmt = 0 
        let feb_totColAmt = 0 
        let mar_totColAmt = 0 
        let apr_totColAmt = 0 
        let may_totColAmt = 0 
        let jun_totColAmt = 0 
        let jul_totColAmt = 0 
        let aug_totColAmt = 0 
        let sep_totColAmt = 0 
        let oct_totColAmt = 0 
        let nov_totColAmt = 0 
        let dec_totColAmt = 0 

        let janTotAmtLoan = 0
        let febTotAmtLoan = 0
        let marTotAmtLoan = 0
        let aprTotAmtLoan = 0
        let mayTotAmtLoan = 0
        let junTotAmtLoan = 0
        let julTotAmtLoan = 0
        let augTotAmtLoan = 0
        let sepTotAmtLoan = 0
        let octTotAmtLoan = 0
        let novTotAmtLoan = 0
        let decTotAmtLoan = 0

            let jan_totIntAmt = 0 
            let feb_totIntAmt = 0
            let mar_totIntAmt = 0
            let apr_totIntAmt = 0
            let may_totIntAmt = 0
            let jun_totIntAmt = 0
            let jul_totIntAmt = 0
            let aug_totIntAmt = 0
            let sep_totIntAmt = 0
            let oct_totIntAmt = 0
            let nov_totIntAmt = 0
            let dec_totIntAmt = 0
        let jan_totInitCBUAmt = 0 
        let feb_totInitCBUAmt = 0
        let mar_totInitCBUAmt = 0
        let apr_totInitCBUAmt = 0
        let may_totInitCBUAmt = 0
        let jun_totInitCBUAmt = 0
        let jul_totInitCBUAmt = 0
        let aug_totInitCBUAmt = 0
        let sep_totInitCBUAmt = 0
        let oct_totInitCBUAmt = 0
        let nov_totInitCBUAmt = 0
        let dec_totInitCBUAmt = 0
            let jan_totWklyCBUAmt = 0 
            let feb_totWklyCBUAmt = 0
            let mar_totWklyCBUAmt = 0
            let apr_totWklyCBUAmt = 0
            let may_totWklyCBUAmt = 0
            let jun_totWklyCBUAmt = 0
            let jul_totWklyCBUAmt = 0
            let aug_totWklyCBUAmt = 0
            let sep_totWklyCBUAmt = 0
            let oct_totWklyCBUAmt = 0
            let nov_totWklyCBUAmt = 0
            let dec_totWklyCBUAmt = 0
        let jan_totCBUInt = 0 
        let feb_totCBUInt = 0
        let mar_totCBUInt = 0
        let apr_totCBUInt = 0
        let may_totCBUInt = 0
        let jun_totCBUInt = 0
        let jul_totCBUInt = 0
        let aug_totCBUInt = 0
        let sep_totCBUInt = 0
        let oct_totCBUInt = 0
        let nov_totCBUInt = 0
        let dec_totCBUInt = 0
            let jan_cbuBalFromPrevMo = 0 
            let feb_cbuBalFromPrevMo = 0
            let mar_cbuBalFromPrevMo = 0
            let apr_cbuBalFromPrevMo = 0
            let may_cbuBalFromPrevMo = 0
            let jun_cbuBalFromPrevMo = 0
            let jul_cbuBalFromPrevMo = 0
            let aug_cbuBalFromPrevMo = 0
            let sep_cbuBalFromPrevMo = 0
            let oct_cbuBalFromPrevMo = 0
            let nov_cbuBalFromPrevMo = 0
            let dec_cbuBalFromPrevMo = 0
        let jan_cbuWithDrawal = 0 
        let feb_cbuWithDrawal = 0
        let mar_cbuWithDrawal = 0
        let apr_cbuWithDrawal = 0
        let may_cbuWithDrawal = 0
        let jun_cbuWithDrawal = 0
        let jul_cbuWithDrawal = 0
        let aug_cbuWithDrawal = 0
        let sep_cbuWithDrawal = 0
        let oct_cbuWithDrawal = 0
        let nov_cbuWithDrawal = 0
        let dec_cbuWithDrawal = 0
            let jan_totMonthCBU = 0 
            let feb_totMonthCBU = 0
            let mar_totMonthCBU = 0
            let apr_totMonthCBU = 0
            let may_totMonthCBU = 0
            let jun_totMonthCBU = 0
            let jul_totMonthCBU = 0
            let aug_totMonthCBU = 0
            let sep_totMonthCBU = 0
            let oct_totMonthCBU = 0
            let nov_totMonthCBU = 0
            let dec_totMonthCBU = 0

            let totTotAmtLoan = 0
        let runTotWklyCBUAmt = 0 
        let doneReadForCBU = false

        if (doneReadNLA && doneReadOLA) {
            janTotAmtLoan = jan_oldAtotValue + jan_newAtotValue
            febTotAmtLoan = feb_oldAtotValue + feb_newAtotValue
            marTotAmtLoan = mar_oldAtotValue + mar_newAtotValue
            aprTotAmtLoan = apr_oldAtotValue + apr_newAtotValue
            mayTotAmtLoan = may_oldAtotValue + may_newAtotValue
            junTotAmtLoan = jun_oldAtotValue + jun_newAtotValue
            julTotAmtLoan = jul_oldAtotValue + jul_newAtotValue
            augTotAmtLoan = aug_oldAtotValue + aug_newAtotValue
            sepTotAmtLoan = sep_oldAtotValue + sep_newAtotValue
            octTotAmtLoan = oct_oldAtotValue + oct_newAtotValue
            novTotAmtLoan = nov_oldAtotValue + nov_newAtotValue
            decTotAmtLoan = dec_oldAtotValue + dec_newAtotValue

            totTotAmtLoan = janTotAmtLoan + febTotAmtLoan + marTotAmtLoan + aprTotAmtLoan + mayTotAmtLoan + junTotAmtLoan + julTotAmtLoan + augTotAmtLoan +
                    sepTotAmtLoan + octTotAmtLoan + novTotAmtLoan + decTotAmtLoan

            poSumView.push({title: "TOTAL AMOUNT OF LOAN", sortkey: 15, group: 2, jan_value : janTotAmtLoan, feb_value : febTotAmtLoan, mar_value : marTotAmtLoan, 
                apr_value : aprTotAmtLoan, may_value : mayTotAmtLoan, jun_value : junTotAmtLoan, jul_value : julTotAmtLoan, 
                aug_value : augTotAmtLoan, sep_value : sepTotAmtLoan, oct_value : octTotAmtLoan, nov_value : novTotAmtLoan, dec_value : decTotAmtLoan, tot_value : totTotAmtLoan
            })

            // COMPUTATION OF PRINCIPAL AND INTEREST AMOUNTS

            let jan_loanReleaseAmt = 0 
            let feb_loanReleaseAmt = 0
            let mar_loanReleaseAmt = 0
            let apr_loanReleaseAmt = 0
            let may_loanReleaseAmt = 0
            let jun_loanReleaseAmt = 0
            let jul_loanReleaseAmt = 0
            let aug_loanReleaseAmt = 0
            let sep_loanReleaseAmt = 0
            let oct_loanReleaseAmt = 0
            let nov_loanReleaseAmt = 0
            let dec_loanReleaseAmt = 0

            let rowGranTotloanInt = 0
            let loanAmount = 0

            const interestPerMo = .2
            const initCBUrate = .05
            const wklyCBUrate = 50 * 4
            const withdrawalCBUrate = 1515
            const balFromPrevMonCBU = 0
            const begBalmonthContriCBU = 0

                for (var i = 0; i < monthSelect.length; i++) {
    
                    let monthToSave = monthSelect[i]

                    let jan_CollectAmt = 0 
                    let feb_CollectAmt = 0 
                    let mar_CollectAmt = 0 
                    let apr_CollectAmt = 0 
                    let may_CollectAmt = 0 
                    let jun_CollectAmt = 0 
                    let jul_CollectAmt = 0 
                    let aug_CollectAmt = 0 
                    let sep_CollectAmt = 0 
                    let oct_CollectAmt = 0 
                    let nov_CollectAmt = 0 
                    let dec_CollectAmt = 0 
                        let jan_InterestAmt = 0 
                        let feb_InterestAmt = 0
                        let mar_InterestAmt = 0
                        let apr_InterestAmt = 0
                        let may_InterestAmt = 0
                        let jun_InterestAmt = 0
                        let jul_InterestAmt = 0
                        let aug_InterestAmt = 0
                        let sep_InterestAmt = 0
                        let oct_InterestAmt = 0
                        let nov_InterestAmt = 0
                        let dec_InterestAmt = 0
                    let rowTotCollectAmt = 0
                    let rowTotInterest = 0
                    let loanAmount = 0


                    switch(monthToSave) {
                        case "January":
                            loanAmount = janTotAmtLoan
                            jan_loanReleaseAmt = janTotAmtLoan
                                jan_totInitCBUAmt = jan_newAtotValue * initCBUrate  //Initial Capital Build-Up
                          
                                jan_totWklyCBUAmt = jan_totNoOfLoan * wklyCBUrate // Monthly CBU Amount
                                jan_totCBUInt = _.round((begBalmonthContriCBU + jan_totInitCBUAmt + jan_totWklyCBUAmt) * .01 / 6)
                                jan_cbuBalFromPrevMo = begBalmonthContriCBU
                                jan_cbuWithDrawal = jan_resCliTot * withdrawalCBUrate
                                jan_totMonthCBU = jan_totInitCBUAmt + jan_totWklyCBUAmt + jan_totCBUInt + jan_cbuBalFromPrevMo + jan_cbuWithDrawal 

                                jan_InterestAmt = 0
                                    jan_CollectAmt = 0
                                        jan_totIntAmt = 0 
                                        jan_totColAmt = 0 
                                feb_InterestAmt = _.round((jan_loanReleaseAmt * interestPerMo) * .29)
                                    feb_CollectAmt = _.round((jan_loanReleaseAmt * 1.2 / 6) - feb_InterestAmt)
                                        feb_totIntAmt = feb_totIntAmt + feb_InterestAmt
                                        feb_totColAmt = feb_totColAmt + feb_CollectAmt
                                mar_InterestAmt = _.round((jan_loanReleaseAmt * interestPerMo) * .24)
                                    mar_CollectAmt = _.round((jan_loanReleaseAmt * 1.2 / 6) - mar_InterestAmt)
                                        mar_totIntAmt = mar_totIntAmt + mar_InterestAmt
                                        mar_totColAmt = mar_totColAmt + mar_CollectAmt
                                apr_InterestAmt = _.round((jan_loanReleaseAmt * interestPerMo) * .2)
                                    apr_CollectAmt = _.round((jan_loanReleaseAmt * 1.2 / 6) - apr_InterestAmt)
                                        apr_totIntAmt = apr_totIntAmt + apr_InterestAmt
                                        apr_totColAmt = apr_totColAmt + apr_CollectAmt
                                may_InterestAmt = _.round((jan_loanReleaseAmt * interestPerMo) * .15)
                                    may_CollectAmt = _.round((jan_loanReleaseAmt * 1.2 / 6) - may_InterestAmt)
                                        may_totIntAmt = may_totIntAmt + may_InterestAmt
                                        may_totColAmt = may_totColAmt + may_CollectAmt
                                jun_InterestAmt = _.round((jan_loanReleaseAmt * interestPerMo) * .09)
                                    jun_CollectAmt = _.round((jan_loanReleaseAmt * 1.2 / 6) - jun_InterestAmt)
                                        jun_totIntAmt = jun_totIntAmt + jun_InterestAmt
                                        jun_totColAmt = jun_totColAmt + jun_CollectAmt
                                jul_InterestAmt = _.round((jan_loanReleaseAmt * interestPerMo) * .03)
                                    jul_CollectAmt = _.round((jan_loanReleaseAmt * 1.2 / 6) - jul_InterestAmt)
                                        jul_totIntAmt = jul_totIntAmt + jul_InterestAmt
                                        jul_totColAmt = jul_totColAmt + jul_CollectAmt
                            break;
                        case "February":
                            loanAmount = febTotAmtLoan
                            feb_loanReleaseAmt = febTotAmtLoan
                            runTotWklyCBUAmt = runTotWklyCBUAmt + jan_totNoOfLoan 

                                feb_totInitCBUAmt = feb_newAtotValue * initCBUrate
                                feb_totWklyCBUAmt = feb_totNoOfLoan * wklyCBUrate // Monthly CBU Amount
                                feb_totCBUInt = _.round((jan_totMonthCBU + feb_totInitCBUAmt + feb_totWklyCBUAmt) * .01 / 6)
                                feb_cbuBalFromPrevMo = jan_totMonthCBU
                                feb_cbuWithDrawal = feb_resCliTot * withdrawalCBUrate
                                feb_totMonthCBU = feb_totInitCBUAmt + feb_totWklyCBUAmt + feb_totCBUInt + feb_cbuBalFromPrevMo + feb_cbuWithDrawal 

                                feb_InterestAmt = 0
                                    feb_CollectAmt = 0
                                mar_InterestAmt = _.round((feb_loanReleaseAmt * interestPerMo) * .29)
                                    mar_CollectAmt = _.round((feb_loanReleaseAmt * 1.2 / 6) - mar_InterestAmt)
                                        mar_totIntAmt = mar_totIntAmt + mar_InterestAmt
                                        mar_totColAmt = mar_totColAmt + mar_CollectAmt
                                apr_InterestAmt = _.round((feb_loanReleaseAmt * interestPerMo) * .24)
                                    apr_CollectAmt = _.round((feb_loanReleaseAmt * 1.2 / 6) - apr_InterestAmt)
                                        apr_totIntAmt = apr_totIntAmt + apr_InterestAmt
                                        apr_totColAmt = apr_totColAmt + apr_CollectAmt
                                may_InterestAmt = _.round((feb_loanReleaseAmt * interestPerMo) * .2)
                                    may_CollectAmt = _.round((feb_loanReleaseAmt * 1.2 / 6) - may_InterestAmt)
                                        may_totIntAmt = may_totIntAmt + may_InterestAmt
                                        may_totColAmt = may_totColAmt + may_CollectAmt
                                jun_InterestAmt = _.round((feb_loanReleaseAmt * interestPerMo) * .15)
                                    jun_CollectAmt = _.round((feb_loanReleaseAmt * 1.2 / 6) - jun_InterestAmt)
                                        jun_totIntAmt = jun_totIntAmt + jun_InterestAmt
                                        jun_totColAmt = jun_totColAmt + jun_CollectAmt
                                jul_InterestAmt = _.round((feb_loanReleaseAmt * interestPerMo) * .09)
                                    jul_CollectAmt = _.round((feb_loanReleaseAmt * 1.2 / 6) - jul_InterestAmt)
                                        jul_totIntAmt = jul_totIntAmt + jul_InterestAmt
                                        jul_totColAmt = jul_totColAmt + jul_CollectAmt
                                aug_InterestAmt = _.round((feb_loanReleaseAmt * interestPerMo) * .03)
                                    aug_CollectAmt = _.round((feb_loanReleaseAmt * 1.2 / 6) - aug_InterestAmt)
                                        aug_totIntAmt = aug_totIntAmt + aug_InterestAmt
                                        aug_totColAmt = aug_totColAmt + aug_CollectAmt
                                break;
                        case "March":
                            loanAmount = marTotAmtLoan
                            mar_loanReleaseAmt = marTotAmtLoan
                            runTotWklyCBUAmt = runTotWklyCBUAmt + feb_totNoOfLoan 
                                mar_totInitCBUAmt = mar_newAtotValue * initCBUrate  
                                mar_totWklyCBUAmt = mar_totNoOfLoan * wklyCBUrate // Monthly CBU Amount
                                mar_totCBUInt = _.round((feb_totMonthCBU + mar_totInitCBUAmt + mar_totWklyCBUAmt) * .01 / 6)
                                mar_cbuBalFromPrevMo = feb_totMonthCBU
                                mar_cbuWithDrawal = mar_resCliTot * withdrawalCBUrate
                                mar_totMonthCBU = mar_totInitCBUAmt + mar_totWklyCBUAmt + mar_totCBUInt + mar_cbuBalFromPrevMo + mar_cbuWithDrawal 

                                mar_InterestAmt = 0
                                    mar_CollectAmt = 0
                                apr_InterestAmt = _.round((mar_loanReleaseAmt * interestPerMo) * .29)
                                    apr_CollectAmt = _.round((mar_loanReleaseAmt * 1.2 / 6) - apr_InterestAmt)
                                        apr_totIntAmt = apr_totIntAmt + apr_InterestAmt
                                        apr_totColAmt = apr_totColAmt + apr_CollectAmt
                                may_InterestAmt = _.round((mar_loanReleaseAmt * interestPerMo) * .24)
                                    may_CollectAmt = _.round((mar_loanReleaseAmt * 1.2 / 6) - may_InterestAmt)
                                        may_totIntAmt = may_totIntAmt + may_InterestAmt
                                        may_totColAmt = may_totColAmt + may_CollectAmt
                                jun_InterestAmt = _.round((mar_loanReleaseAmt * interestPerMo) * .2)
                                    jun_CollectAmt = _.round((mar_loanReleaseAmt * 1.2 / 6) - jun_InterestAmt)
                                        jun_totIntAmt = jun_totIntAmt + jun_InterestAmt
                                        jun_totColAmt = jun_totColAmt + jun_CollectAmt
                                jul_InterestAmt = _.round((mar_loanReleaseAmt * interestPerMo) * .15)
                                    jul_CollectAmt = _.round((mar_loanReleaseAmt * 1.2 / 6) - jul_InterestAmt)
                                        jul_totIntAmt = jul_totIntAmt + jul_InterestAmt
                                        jul_totColAmt = jul_totColAmt + jul_CollectAmt
                                aug_InterestAmt = _.round((mar_loanReleaseAmt * interestPerMo) * .09)
                                    aug_CollectAmt = _.round((mar_loanReleaseAmt * 1.2 / 6) - aug_InterestAmt)
                                        aug_totIntAmt = aug_totIntAmt + aug_InterestAmt
                                        aug_totColAmt = aug_totColAmt + aug_CollectAmt
                                sep_InterestAmt = _.round((mar_loanReleaseAmt * interestPerMo) * .03)
                                    sep_CollectAmt = _.round((mar_loanReleaseAmt * 1.2 / 6) - sep_InterestAmt)
                                        sep_totIntAmt = sep_totIntAmt + sep_InterestAmt
                                        sep_totColAmt = sep_totColAmt + sep_CollectAmt
                                break;
                        case "April":
                            loanAmount = aprTotAmtLoan
                            apr_loanReleaseAmt = aprTotAmtLoan
                            runTotWklyCBUAmt = runTotWklyCBUAmt + mar_totNoOfLoan 
                                apr_totInitCBUAmt = apr_newAtotValue * initCBUrate  
                                apr_totWklyCBUAmt = apr_totNoOfLoan * wklyCBUrate // Monthly CBU Amount
                                apr_totCBUInt = _.round((mar_totMonthCBU + apr_totInitCBUAmt + apr_totWklyCBUAmt) * .01 / 6)
                                apr_cbuBalFromPrevMo = mar_totMonthCBU
                                apr_cbuWithDrawal = apr_resCliTot * withdrawalCBUrate
                                apr_totMonthCBU = apr_totInitCBUAmt + apr_totWklyCBUAmt + apr_totCBUInt + apr_cbuBalFromPrevMo + apr_cbuWithDrawal 

                                apr_InterestAmt = 0
                                    apr_CollectAmt = 0
                                may_InterestAmt = _.round((apr_loanReleaseAmt * interestPerMo) * .29)
                                    may_CollectAmt = _.round((apr_loanReleaseAmt * 1.2 / 6) - may_InterestAmt)
                                        may_totIntAmt = may_totIntAmt + may_InterestAmt
                                        may_totColAmt = may_totColAmt + may_CollectAmt
                                jun_InterestAmt = _.round((apr_loanReleaseAmt * interestPerMo) * .24)
                                    jun_CollectAmt = _.round((apr_loanReleaseAmt * 1.2 / 6) - jun_InterestAmt)
                                        jun_totIntAmt = jun_totIntAmt + jun_InterestAmt
                                        jun_totColAmt = jun_totColAmt + jun_CollectAmt
                                jul_InterestAmt = _.round((apr_loanReleaseAmt * interestPerMo) * .2)
                                    jul_CollectAmt = _.round((apr_loanReleaseAmt * 1.2 / 6) - jul_InterestAmt)
                                        jul_totIntAmt = jul_totIntAmt + jul_InterestAmt
                                        jul_totColAmt = jul_totColAmt + jul_CollectAmt
                                aug_InterestAmt = _.round((apr_loanReleaseAmt * interestPerMo) * .15)
                                    aug_CollectAmt = _.round((apr_loanReleaseAmt * 1.2 / 6) - aug_InterestAmt)
                                        aug_totIntAmt = aug_totIntAmt + aug_InterestAmt
                                        aug_totColAmt = aug_totColAmt + aug_CollectAmt
                                sep_InterestAmt = _.round((apr_loanReleaseAmt * interestPerMo) * .09)
                                    sep_CollectAmt = _.round((apr_loanReleaseAmt * 1.2 / 6) - sep_InterestAmt)
                                        sep_totIntAmt = sep_totIntAmt + sep_InterestAmt
                                        sep_totColAmt = sep_totColAmt + sep_CollectAmt
                                oct_InterestAmt = _.round((apr_loanReleaseAmt * interestPerMo) * .03)
                                    oct_CollectAmt = _.round((apr_loanReleaseAmt * 1.2 / 6) - oct_InterestAmt)
                                        oct_totIntAmt = oct_totIntAmt + oct_InterestAmt
                                        oct_totColAmt = oct_totColAmt + oct_CollectAmt
                                break;
                        case "May":
                            loanAmount = mayTotAmtLoan
                            may_loanReleaseAmt = mayTotAmtLoan
                            runTotWklyCBUAmt = runTotWklyCBUAmt + apr_totNoOfLoan 
                                may_totInitCBUAmt = may_newAtotValue * initCBUrate  
                                may_totWklyCBUAmt = may_totNoOfLoan * wklyCBUrate // Monthly CBU Amount
                                may_totCBUInt = _.round((apr_totMonthCBU + may_totInitCBUAmt + may_totWklyCBUAmt) * .01 / 6)
                                may_cbuBalFromPrevMo = apr_totMonthCBU
                                may_cbuWithDrawal = may_resCliTot * withdrawalCBUrate
                                may_totMonthCBU = may_totInitCBUAmt + may_totWklyCBUAmt + may_totCBUInt + may_cbuBalFromPrevMo + may_cbuWithDrawal 

                                may_InterestAmt = 0
                                    may_CollectAmt = 0
                                jun_InterestAmt = _.round((may_loanReleaseAmt * interestPerMo) * .29)
                                    jun_CollectAmt = _.round((may_loanReleaseAmt * 1.2 / 6) - jun_InterestAmt)
                                        jun_totIntAmt = jun_totIntAmt + jun_InterestAmt
                                        jun_totColAmt = jun_totColAmt + jun_CollectAmt
                                jul_InterestAmt = _.round((may_loanReleaseAmt * interestPerMo) * .24)
                                    jul_CollectAmt = _.round((may_loanReleaseAmt * 1.2 / 6) - jul_InterestAmt)
                                        jul_totIntAmt = jul_totIntAmt + jul_InterestAmt
                                        jul_totColAmt = jul_totColAmt + jul_CollectAmt
                                aug_InterestAmt = _.round((may_loanReleaseAmt * interestPerMo) * .2)
                                    aug_CollectAmt = _.round((may_loanReleaseAmt * 1.2 / 6) - aug_InterestAmt)
                                        aug_totIntAmt = aug_totIntAmt + aug_InterestAmt
                                        aug_totColAmt = aug_totColAmt + aug_CollectAmt
                                sep_InterestAmt = _.round((may_loanReleaseAmt * interestPerMo) * .15)
                                    sep_CollectAmt = _.round((may_loanReleaseAmt * 1.2 / 6) - sep_InterestAmt)
                                        sep_totIntAmt = sep_totIntAmt + sep_InterestAmt
                                        sep_totColAmt = sep_totColAmt + sep_CollectAmt
                                oct_InterestAmt = _.round((may_loanReleaseAmt * interestPerMo) * .09)
                                    oct_CollectAmt = _.round((may_loanReleaseAmt * 1.2 / 6) - oct_InterestAmt)
                                        oct_totIntAmt = oct_totIntAmt + oct_InterestAmt
                                        oct_totColAmt = oct_totColAmt + oct_CollectAmt
                                nov_InterestAmt = _.round((may_loanReleaseAmt * interestPerMo) * .03)                        
                                    nov_CollectAmt = _.round((may_loanReleaseAmt * 1.2 / 6) - nov_InterestAmt)
                                        nov_totIntAmt = nov_totIntAmt + nov_InterestAmt
                                        nov_totColAmt = nov_totColAmt + nov_CollectAmt
                                break;
                        case "June":
                            loanAmount = junTotAmtLoan
                            jun_loanReleaseAmt = junTotAmtLoan
                            runTotWklyCBUAmt = runTotWklyCBUAmt + may_totNoOfLoan 
                                jun_totInitCBUAmt = jun_newAtotValue * initCBUrate  
                                jun_totWklyCBUAmt = jun_totNoOfLoan * wklyCBUrate // Monthly CBU Amount
                                jun_totCBUInt = _.round((may_totMonthCBU + jun_totInitCBUAmt + jun_totWklyCBUAmt) * .01 / 6)
                                jun_cbuBalFromPrevMo = may_totMonthCBU
                                jun_cbuWithDrawal = jun_resCliTot * withdrawalCBUrate
                                jun_totMonthCBU = jun_totInitCBUAmt + jun_totWklyCBUAmt + jun_totCBUInt + jun_cbuBalFromPrevMo + jun_cbuWithDrawal 

                                jun_InterestAmt = 0
                                    may_CollectAmt = 0
                                july_InterestAmt = _.round((jun_loanReleaseAmt * interestPerMo) * .29)
                                    jul_CollectAmt = _.round((jun_loanReleaseAmt * 1.2 / 6) - jul_InterestAmt)
                                        jul_totIntAmt = jul_totIntAmt + jul_InterestAmt
                                        jul_totColAmt = jul_totColAmt + jul_CollectAmt
                                aug_InterestAmt = _.round((jun_loanReleaseAmt * interestPerMo) * .24)
                                    aug_CollectAmt = _.round((jun_loanReleaseAmt * 1.2 / 6) - aug_InterestAmt)
                                        aug_totIntAmt = aug_totIntAmt + aug_InterestAmt
                                        aug_totColAmt = aug_totColAmt + aug_CollectAmt
                                sep_InterestAmt = _.round((jun_loanReleaseAmt * interestPerMo) * .2)
                                    sep_CollectAmt = _.round((jun_loanReleaseAmt * 1.2 / 6) - sep_InterestAmt)
                                        sep_totIntAmt = sep_totIntAmt + sep_InterestAmt
                                        sep_totColAmt = sep_totColAmt + sep_CollectAmt
                                oct_InterestAmt = _.round((jun_loanReleaseAmt * interestPerMo) * .15)
                                    oct_CollectAmt = _.round((jun_loanReleaseAmt * 1.2 / 6) - oct_InterestAmt)
                                        oct_totIntAmt = oct_totIntAmt + oct_InterestAmt
                                        oct_totColAmt = oct_totColAmt + oct_CollectAmt
                                nov_InterestAmt = _.round((jun_loanReleaseAmt * interestPerMo) * .09)
                                    nov_CollectAmt = _.round((jun_loanReleaseAmt * 1.2 / 6) - nov_InterestAmt)
                                        nov_totIntAmt = nov_totIntAmt + nov_InterestAmt
                                        nov_totColAmt = nov_totColAmt + nov_CollectAmt
                                dec_InterestAmt = _.round((jun_loanReleaseAmt * interestPerMo) * .03)
                                    dec_CollectAmt = _.round((jun_loanReleaseAmt * 1.2 / 6) - dec_InterestAmt)
                                        dec_totIntAmt = dec_totIntAmt + dec_InterestAmt
                                        dec_totColAmt = dec_totColAmt + dec_CollectAmt
                                break;
                        case "July":
                            loanAmount = julTotAmtLoan
                            jul_loanReleaseAmt = julTotAmtLoan
                            runTotWklyCBUAmt = runTotWklyCBUAmt + jun_totNoOfLoan 
                                jul_totInitCBUAmt = jul_newAtotValue * initCBUrate  
                                jul_totWklyCBUAmt = jul_totNoOfLoan * wklyCBUrate // Monthly CBU Amount
                                jul_totCBUInt = _.round((jun_totMonthCBU + jul_totInitCBUAmt + jul_totWklyCBUAmt) * .01 / 6)
                                jul_cbuBalFromPrevMo = jun_totMonthCBU
                                jul_cbuWithDrawal = jul_resCliTot * withdrawalCBUrate
                                jul_totMonthCBU = jul_totInitCBUAmt + jul_totWklyCBUAmt + jul_totCBUInt + jul_cbuBalFromPrevMo + jul_cbuWithDrawal 

                                jul_InterestAmt = 0
                                    jul_CollectAmt = 0
                                aug_InterestAmt = _.round((jul_loanReleaseAmt * interestPerMo) * .29)
                                    aug_CollectAmt = _.round((jul_loanReleaseAmt * 1.2 / 6) - aug_InterestAmt)
                                        aug_totIntAmt = aug_totIntAmt + aug_InterestAmt
                                        aug_totColAmt = aug_totColAmt + aug_CollectAmt
                                sep_InterestAmt = _.round((jul_loanReleaseAmt * interestPerMo) * .24)
                                    sep_CollectAmt = _.round((jul_loanReleaseAmt * 1.2 / 6) - sep_InterestAmt)
                                        sep_totIntAmt = sep_totIntAmt + sep_InterestAmt
                                        sep_totColAmt = sep_totColAmt + sep_CollectAmt
                                oct_InterestAmt = _.round((jul_loanReleaseAmt * interestPerMo) * .2)
                                    oct_CollectAmt = _.round((jul_loanReleaseAmt * 1.2 / 6) - oct_InterestAmt)
                                        oct_totIntAmt = oct_totIntAmt + oct_InterestAmt
                                        oct_totColAmt = oct_totColAmt + oct_CollectAmt
                                nov_InterestAmt = _.round((jul_loanReleaseAmt * interestPerMo) * .15)
                                    nov_CollectAmt = _.round((jul_loanReleaseAmt * 1.2 / 6) - nov_InterestAmt)
                                        nov_totIntAmt = nov_totIntAmt + nov_InterestAmt
                                        nov_totColAmt = nov_totColAmt + nov_CollectAmt
                                dec_InterestAmt = _.round((jul_loanReleaseAmt * interestPerMo) * .09)
                                    dec_CollectAmt = _.round((jul_loanReleaseAmt * 1.2 / 6) - dec_InterestAmt)
                                        dec_totIntAmt = dec_totIntAmt + dec_InterestAmt
                                        dec_totColAmt = dec_totColAmt + dec_CollectAmt
                                break;
                        case "August":
                            loanAmount = augTotAmtLoan
                            aug_loanReleaseAmt = augTotAmtLoan
                            runTotWklyCBUAmt = runTotWklyCBUAmt + jul_totNoOfLoan 
                                aug_totInitCBUAmt = aug_newAtotValue * initCBUrate  
                                aug_totWklyCBUAmt = aug_totNoOfLoan * wklyCBUrate // Monthly CBU Amount
                                aug_totCBUInt = _.round((jul_totMonthCBU + aug_totInitCBUAmt + aug_totWklyCBUAmt) * .01 / 6)
                                aug_cbuBalFromPrevMo = jul_totMonthCBU
                                aug_cbuWithDrawal = aug_resCliTot * withdrawalCBUrate
                                aug_totMonthCBU = aug_totInitCBUAmt + aug_totWklyCBUAmt + aug_totCBUInt + aug_cbuBalFromPrevMo + aug_cbuWithDrawal 

                                aug_InterestAmt = 0
                                    aug_CollectAmt = 0
                                sep_InterestAmt = _.round((aug_loanReleaseAmt * interestPerMo) * .29)
                                     sep_CollectAmt = _.round((aug_loanReleaseAmt * 1.2 / 6) - sep_InterestAmt)
                                        sep_totIntAmt = sep_totIntAmt + sep_InterestAmt
                                        sep_totColAmt = sep_totColAmt + sep_CollectAmt
                                 oct_InterestAmt = _.round((aug_loanReleaseAmt * interestPerMo) * .24)
                                    oct_CollectAmt = _.round((aug_loanReleaseAmt * 1.2 / 6) - oct_InterestAmt)
                                        oct_totIntAmt = oct_totIntAmt + oct_InterestAmt
                                        oct_totColAmt = oct_totColAmt + oct_CollectAmt
                                nov_InterestAmt = _.round((aug_loanReleaseAmt * interestPerMo) * .2)
                                    nov_CollectAmt = _.round((aug_loanReleaseAmt * 1.2 / 6) - nov_InterestAmt)
                                        nov_totIntAmt = nov_totIntAmt + nov_InterestAmt
                                        nov_totColAmt = nov_totColAmt + nov_CollectAmt
                                dec_InterestAmt = _.round((aug_loanReleaseAmt * interestPerMo) * .15)
                                    dec_CollectAmt = _.round((aug_loanReleaseAmt * 1.2 / 6) - dec_InterestAmt)
                                        dec_totIntAmt = dec_totIntAmt + dec_InterestAmt
                                        dec_totColAmt = dec_totColAmt + dec_CollectAmt
                            break;
                        case "September":
                            loanAmount = sepTotAmtLoan
                            sep_loanReleaseAmt = sepTotAmtLoan
                            runTotWklyCBUAmt = runTotWklyCBUAmt + aug_totNoOfLoan 
                                sep_totInitCBUAmt = sep_newAtotValue * initCBUrate  
                                sep_totWklyCBUAmt = sep_totNoOfLoan * wklyCBUrate // Monthly CBU Amount
                                sep_totCBUInt = _.round((aug_totMonthCBU + sep_totInitCBUAmt + sep_totWklyCBUAmt) * .01 / 6)
                                sep_cbuBalFromPrevMo = aug_totMonthCBU
                                sep_cbuWithDrawal = sep_resCliTot * withdrawalCBUrate
                                sep_totMonthCBU = sep_totInitCBUAmt + sep_totWklyCBUAmt + sep_totCBUInt + sep_cbuBalFromPrevMo + sep_cbuWithDrawal 

                                sep_InterestAmt = 0
                                    sep_CollectAmt = 0
                                oct_InterestAmt = _.round((sep_loanReleaseAmt * interestPerMo) * .29)
                                    oct_CollectAmt = _.round((sep_loanReleaseAmt * 1.2 / 6) - oct_InterestAmt)
                                        oct_totIntAmt = oct_totIntAmt + oct_InterestAmt
                                        oct_totColAmt = oct_totColAmt + oct_CollectAmt
                                nov_InterestAmt = _.round((sep_loanReleaseAmt * interestPerMo) * .24)
                                    nov_CollectAmt = _.round((sep_loanReleaseAmt * 1.2 / 6) - nov_InterestAmt)
                                        nov_totIntAmt = nov_totIntAmt + nov_InterestAmt
                                        nov_totColAmt = nov_totColAmt + nov_CollectAmt
                                dec_InterestAmt = (_.round(sep_loanReleaseAmt * interestPerMo) * .2)
                                    dec_CollectAmt = _.round((sep_loanReleaseAmt * 1.2 / 6) - dec_InterestAmt)
                                        dec_totIntAmt = dec_totIntAmt + dec_InterestAmt
                                        dec_totColAmt = dec_totColAmt + dec_CollectAmt
                            break;
                        case "October":
                            loanAmount = octTotAmtLoan
                            oct_loanReleaseAmt = octTotAmtLoan
                            runTotWklyCBUAmt = runTotWklyCBUAmt + sep_totNoOfLoan 
                                oct_totInitCBUAmt = oct_newAtotValue * initCBUrate  
                                oct_totWklyCBUAmt = oct_totNoOfLoan * wklyCBUrate // Monthly CBU Amount
                                oct_totCBUInt = _.round((sep_totMonthCBU + oct_totInitCBUAmt + oct_totWklyCBUAmt) * .01 / 6)
                                oct_cbuBalFromPrevMo = sep_totMonthCBU
                                oct_cbuWithDrawal = oct_resCliTot * withdrawalCBUrate
                                oct_totMonthCBU = oct_totInitCBUAmt + oct_totWklyCBUAmt + oct_totCBUInt + oct_cbuBalFromPrevMo + oct_cbuWithDrawal 

                                oct_InterestAmt = 0
                                    oct_CollectAmt = 0
                                nov_InterestAmt = _.round((oct_loanReleaseAmt * interestPerMo) * .29)
                                    nov_CollectAmt = _.round((oct_loanReleaseAmt * 1.2 / 6) - nov_InterestAmt)
                                        nov_totIntAmt = nov_totIntAmt + nov_InterestAmt
                                        nov_totColAmt = nov_totColAmt + nov_CollectAmt
                            dec_InterestAmt = _.round((oct_loanReleaseAmt * interestPerMo) * .24)
                                    dec_CollectAmt = _.round((oct_loanReleaseAmt * 1.2 / 6) - dec_InterestAmt)
                                        dec_totIntAmt = dec_totIntAmt + dec_InterestAmt
                                        dec_totColAmt = dec_totColAmt + dec_CollectAmt
                            break;
                        case "November":
                            loanAmount = novTotAmtLoan
                            nov_loanReleaseAmt = novTotAmtLoan
                            runTotWklyCBUAmt = runTotWklyCBUAmt + dec_totNoOfLoan 
                                nov_totInitCBUAmt = nov_newAtotValue * initCBUrate  
                                nov_totWklyCBUAmt = nov_totNoOfLoan * wklyCBUrate // Monthly CBU Amount
                                nov_totCBUInt = _.round((oct_totMonthCBU + nov_totInitCBUAmt + nov_totWklyCBUAmt) * .01 / 6)
                                nov_cbuBalFromPrevMo = oct_totMonthCBU
                                nov_cbuWithDrawal = nov_resCliTot * withdrawalCBUrate
                                nov_totMonthCBU = nov_totInitCBUAmt + nov_totWklyCBUAmt + nov_totCBUInt + nov_cbuBalFromPrevMo + nov_cbuWithDrawal 

                                nov_InterestAmt = 0
                                    nov_CollectAmt = 0
                                dec_InterestAmt = _.round((nov_loanReleaseAmt * interestPerMo) * .29)
                                    dec_CollectAmt = _.round((nov_loanReleaseAmt * 1.2 / 6) - dec_InterestAmt)
                                        dec_totIntAmt = dec_totIntAmt + dec_InterestAmt
                                        dec_totColAmt = dec_totColAmt + dec_CollectAmt
                            break;
                        case "December":
                            loanAmount = decTotAmtLoan
                            dec_loanReleaseAmt = decTotAmtLoan
                            runTotWklyCBUAmt = runTotWklyCBUAmt + dec_totNoOfLoan 
                                dec_totInitCBUAmt = dec_newAtotValue * initCBUrate  
                                dec_totWklyCBUAmt = dec_totNoOfLoan * wklyCBUrate // Monthly CBU Amount
                                dec_totCBUInt = _.round((nov_totMonthCBU + dec_totInitCBUAmt + dec_totWklyCBUAmt) * .01 / 6)
                                dec_cbuBalFromPrevMo = nov_totMonthCBU
                                dec_cbuWithDrawal = dec_resCliTot * withdrawalCBUrate
                                dec_totMonthCBU = dec_totInitCBUAmt + dec_totWklyCBUAmt + dec_totCBUInt + dec_cbuBalFromPrevMo + dec_cbuWithDrawal 

                                dec_InterestAmt = 0
                                break;
                        default:
                            month = ""
                            break;
                    }
                    rowTotCollectAmt = jan_CollectAmt + feb_CollectAmt + mar_CollectAmt + apr_CollectAmt + may_CollectAmt + jun_CollectAmt
                        + jul_CollectAmt + aug_CollectAmt + sep_CollectAmt + oct_CollectAmt + nov_CollectAmt + dec_CollectAmt

                    rowTotInterest = jan_InterestAmt + feb_InterestAmt + mar_InterestAmt + apr_InterestAmt + may_InterestAmt + jun_InterestAmt + 
                        jul_InterestAmt + aug_InterestAmt + sep_InterestAmt + oct_InterestAmt + nov_InterestAmt + dec_InterestAmt
                }

                poSumView.push({title: "MONTHLY COLLECTION", sortkey: 18, group: 1, jan_value : jan_totColAmt, feb_value : feb_totColAmt, mar_value : mar_totColAmt, 
                    apr_value : apr_totColAmt, may_value : may_totColAmt, jun_value : jun_totColAmt, jul_value : jul_totColAmt, 
                    aug_value : aug_totColAmt, sep_value : sep_totColAmt, oct_value : oct_totColAmt, nov_value : nov_totColAmt, dec_value : dec_totColAmt
                
                })
    
                poSumView.push({title: "LOAN PORTFOLIO", sortkey: 15, group: 1, isTitle: true})

                poSumView.push({title: "MONTHLY DISBURSEMENT (P)", sortkey: 16, group: 1, jan_value : janTotAmtLoan, feb_value : febTotAmtLoan, mar_value : marTotAmtLoan, 
                    apr_value : aprTotAmtLoan, may_value : mayTotAmtLoan, jun_value : junTotAmtLoan, jul_value : julTotAmtLoan, 
                    aug_value : augTotAmtLoan, sep_value : sepTotAmtLoan, oct_value : octTotAmtLoan, nov_value : novTotAmtLoan, dec_value : decTotAmtLoan, tot_value : totTotAmtLoan
                
                    })
                
                //CAPITAL BUILD UP VIEW ITEMS

                let tot_totInitCBUAmt = jan_totInitCBUAmt + feb_totInitCBUAmt + mar_totInitCBUAmt + apr_totInitCBUAmt + may_totInitCBUAmt + jun_totInitCBUAmt + jul_totInitCBUAmt + aug_totInitCBUAmt +
                        sep_totInitCBUAmt + oct_totInitCBUAmt + nov_totInitCBUAmt + dec_totInitCBUAmt

                let tot_totWklyCBUAmt = jan_totWklyCBUAmt + feb_totWklyCBUAmt + mar_totWklyCBUAmt + apr_totWklyCBUAmt + may_totWklyCBUAmt + jun_totWklyCBUAmt + jul_totWklyCBUAmt +
                        aug_totWklyCBUAmt + sep_totWklyCBUAmt + oct_totWklyCBUAmt + nov_totWklyCBUAmt + dec_totWklyCBUAmt
                
                let tot_totCBUInt = jan_totCBUInt + feb_totCBUInt + mar_totCBUInt + apr_totCBUInt + may_totCBUInt + jun_totCBUInt + jul_totCBUInt +
                        aug_totCBUInt + sep_totCBUInt + oct_totCBUInt + nov_totCBUInt + dec_totCBUInt

                let tot_cbuWithDrawal = jan_cbuWithDrawal + feb_cbuWithDrawal + mar_cbuWithDrawal + apr_cbuWithDrawal + may_cbuWithDrawal + jun_cbuWithDrawal + jul_cbuWithDrawal
                        aug_cbuWithDrawal + sep_cbuWithDrawal + oct_cbuWithDrawal + nov_cbuWithDrawal + dec_cbuWithDrawal

                poSumView.push({title: "Initial Capital Build-Up", sortkey: 20, group: 2, jan_value : jan_totInitCBUAmt, feb_value : feb_totInitCBUAmt, mar_value : mar_totInitCBUAmt, 
                    apr_value : apr_totInitCBUAmt, may_value : may_totInitCBUAmt, jun_value : jun_totInitCBUAmt, jul_value : jul_totInitCBUAmt, 
                    aug_value : aug_totInitCBUAmt, sep_value : sep_totInitCBUAmt, oct_value : oct_totInitCBUAmt, nov_value : nov_totInitCBUAmt, dec_value : dec_totInitCBUAmt, tot_value : tot_totInitCBUAmt
                
                })
                poSumView.push({title: "Monthly Contribution", sortkey: 21, group: 2, jan_value : jan_totWklyCBUAmt, feb_value : feb_totWklyCBUAmt, mar_value : mar_totWklyCBUAmt, 
                    apr_value : apr_totWklyCBUAmt, may_value : may_totWklyCBUAmt, jun_value : jun_totWklyCBUAmt, jul_value : jul_totWklyCBUAmt, 
                    aug_value : aug_totWklyCBUAmt, sep_value : sep_totWklyCBUAmt, oct_value : oct_totWklyCBUAmt, nov_value : nov_totWklyCBUAmt, dec_value : dec_totWklyCBUAmt, tot_value : tot_totWklyCBUAmt
                })
                poSumView.push({title: "CBU Interest", sortkey: 22, group: 2, jan_value : jan_totCBUInt, feb_value : feb_totCBUInt, mar_value : mar_totCBUInt, 
                    apr_value : apr_totCBUInt, may_value : may_totCBUInt, jun_value : jun_totCBUInt, jul_value : jul_totCBUInt, 
                    aug_value : aug_totCBUInt, sep_value : sep_totCBUInt, oct_value : oct_totCBUInt, nov_value : nov_totCBUInt, dec_value : dec_totCBUInt, tot_value : tot_totCBUInt
                })
                poSumView.push({title: "Bal. from Prev. Month", sortkey: 23, group: 2, jan_value : jan_cbuBalFromPrevMo, feb_value : feb_cbuBalFromPrevMo, mar_value : mar_cbuBalFromPrevMo, 
                    apr_value : apr_cbuBalFromPrevMo, may_value : may_cbuBalFromPrevMo, jun_value : jun_cbuBalFromPrevMo, jul_value : jul_cbuBalFromPrevMo, 
                    aug_value : aug_cbuBalFromPrevMo, sep_value : sep_cbuBalFromPrevMo, oct_value : oct_cbuBalFromPrevMo, nov_value : nov_cbuBalFromPrevMo, dec_value : dec_cbuBalFromPrevMo
                })
                poSumView.push({title: "  "+ "Less: Withdrawals", sortkey: 24, group: 2, jan_value : jan_cbuWithDrawal, feb_value : feb_cbuWithDrawal, mar_value : mar_cbuWithDrawal, 
                    apr_value : apr_cbuWithDrawal, may_value : may_cbuWithDrawal, jun_value : jun_cbuWithDrawal, jul_value : jul_cbuWithDrawal, 
                    aug_value : aug_cbuWithDrawal, sep_value : sep_cbuWithDrawal, oct_value : oct_cbuWithDrawal, nov_value : nov_cbuWithDrawal, dec_value : dec_cbuWithDrawal, tot_value : tot_cbuWithDrawal
                })
                poSumView.push({title: "TOTAL Monthly CBU", sortkey: 25, group: 2, jan_value : jan_totMonthCBU, feb_value : feb_totMonthCBU, mar_value : mar_totMonthCBU, 
                    apr_value : apr_totMonthCBU, may_value : may_totMonthCBU, jun_value : jun_totMonthCBU, jul_value : jul_totMonthCBU, 
                    aug_value : aug_totMonthCBU, sep_value : sep_totMonthCBU, oct_value : oct_totMonthCBU, nov_value : nov_totMonthCBU, dec_value : dec_totMonthCBU, tot_value : dec_totMonthCBU
                })

                    
            let janRunBalAmt = janTotAmtLoan - jan_totColAmt
            let febRunBalAmt = (janRunBalAmt + febTotAmtLoan) - feb_totColAmt
            let marRunBalAmt = (febRunBalAmt + marTotAmtLoan) - mar_totColAmt
            let aprRunBalAmt = (marRunBalAmt + aprTotAmtLoan) - apr_totColAmt
            let mayRunBalAmt = (aprRunBalAmt + mayTotAmtLoan) - may_totColAmt
            let junRunBalAmt = (mayRunBalAmt + junTotAmtLoan) - jun_totColAmt
            let julRunBalAmt = (junRunBalAmt + julTotAmtLoan) - jul_totColAmt
            let augRunBalAmt = (julRunBalAmt + augTotAmtLoan) - aug_totColAmt
            let sepRunBalAmt = (augRunBalAmt + sepTotAmtLoan) - sep_totColAmt
            let octRunBalAmt = (sepRunBalAmt + octTotAmtLoan) - oct_totColAmt
            let novRunBalAmt = (octRunBalAmt + novTotAmtLoan) - nov_totColAmt
            let decRunBalAmt = (novRunBalAmt + decTotAmtLoan) - dec_totColAmt

            poSumView.push({title: "MONTHLY LOAN PORTFOLIO", sortkey: 18, group: 1, jan_value : janRunBalAmt, feb_value : febRunBalAmt, mar_value : marRunBalAmt, 
                apr_value : aprRunBalAmt, may_value : mayRunBalAmt, jun_value : junRunBalAmt, jul_value : julRunBalAmt, 
                aug_value : augRunBalAmt, sep_value : sepRunBalAmt, oct_value : octRunBalAmt, nov_value : novRunBalAmt, dec_value : decRunBalAmt, tot_value : decRunBalAmt
            
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
            
            poSumView.push({title: "BAL. FROM PREV. MONTH", sortkey: 17, group: 1, jan_value : janRunBalPrevMon, feb_value : febRunBalPrevMon, mar_value : marRunBalPrevMon, 
                apr_value : aprRunBalPrevMon, may_value : mayRunBalPrevMon, jun_value : junRunBalPrevMon, jul_value : julRunBalPrevMon, 
                aug_value : augRunBalPrevMon, sep_value : sepRunBalPrevMon, oct_value : octRunBalPrevMon, nov_value : novRunBalPrevMon, dec_value : decRunBalPrevMon
            
            })
            doneReadForCBU = true
        }
    
                    poSumView.push({title: "CAPITAL BUILD-UP", sortkey: 19, group: 2, isTitle: true})


                    console.log(fndUnitBudgExecTotLonAmt)

                    if (isNull(fndUnitBudgExecTotLonAmt)) { 
                        let newPoExecSumBudg = new Budg_exec_sum({
                            region: "NOL", area: "NEL", branch: vwBranchCode, unit: vwUnitCode, po: "Unit", title: "TOTAL AMOUNT OF LOAN", view_code: "TotLoanAmt", jan_budg : janTotAmtLoan, 
                            feb_budg : febTotAmtLoan, mar_budg : marTotAmtLoan, apr_budg : aprTotAmtLoan, may_budg : mayTotAmtLoan, jun_budg : junTotAmtLoan, jul_budg : julTotAmtLoan, 
                            aug_budg : augTotAmtLoan, sep_budg : sepTotAmtLoan, oct_budg : octTotAmtLoan, nov_budg : novTotAmtLoan, dec_budg : decTotAmtLoan                                        
                        })
                        const lonTotAmtExecBudg = await newPoExecSumBudg.save()
                    } else {
                        fndUnitBudgExecTotLonAmt.jan_budg = janTotAmtLoan
                        fndUnitBudgExecTotLonAmt.feb_budg = febTotAmtLoan
                        fndUnitBudgExecTotLonAmt.mar_budg = marTotAmtLoan
                        fndUnitBudgExecTotLonAmt.apr_budg = aprTotAmtLoan
                        fndUnitBudgExecTotLonAmt.may_budg = mayTotAmtLoan
                        fndUnitBudgExecTotLonAmt.jun_budg = junTotAmtLoan
                        fndUnitBudgExecTotLonAmt.jul_budg = julTotAmtLoan
                        fndUnitBudgExecTotLonAmt.aug_budg = augTotAmtLoan
                        fndUnitBudgExecTotLonAmt.sep_budg = sepTotAmtLoan
                        fndUnitBudgExecTotLonAmt.oct_budg = octTotAmtLoan
                        fndUnitBudgExecTotLonAmt.nov_budg = novTotAmtLoan
                        fndUnitBudgExecTotLonAmt.dec_budg = decTotAmtLoan
            
                        await fndUnitBudgExecTotLonAmt.save()            
                    }

                    if (isNull(fndUnitBudgExecTotInc)) { 
                        let newPoExecSumBudg = new Budg_exec_sum({
                            region: "NOL", area: "NEL", branch: vwBranchCode, unit: vwUnitCode, po: "Unit", title: "LOAN FEES", view_code: "TotProjInc", jan_budg : jan_totIntAmt, 
                            feb_budg : feb_totIntAmt, mar_budg : mar_totIntAmt, apr_budg : apr_totIntAmt, may_budg : may_totIntAmt, jun_budg : jun_totIntAmt, jul_budg : jul_totIntAmt, 
                            aug_budg : aug_totIntAmt, sep_budg : sep_totIntAmt, oct_budg : oct_totIntAmt, nov_budg : nov_totIntAmt, dec_budg : dec_totIntAmt                                        
                        })
                        const lonTotAmtExecBudg = await newPoExecSumBudg.save()
                    } else {
                        fndUnitBudgExecTotInc.jan_budg = jan_totIntAmt
                        fndUnitBudgExecTotInc.feb_budg = feb_totIntAmt
                        fndUnitBudgExecTotInc.mar_budg = mar_totIntAmt
                        fndUnitBudgExecTotInc.apr_budg = apr_totIntAmt
                        fndUnitBudgExecTotInc.may_budg = may_totIntAmt
                        fndUnitBudgExecTotInc.jun_budg = jun_totIntAmt
                        fndUnitBudgExecTotInc.jul_budg = jul_totIntAmt
                        fndUnitBudgExecTotInc.aug_budg = aug_totIntAmt
                        fndUnitBudgExecTotInc.sep_budg = sep_totIntAmt
                        fndUnitBudgExecTotInc.oct_budg = oct_totIntAmt
                        fndUnitBudgExecTotInc.nov_budg = nov_totIntAmt
                        fndUnitBudgExecTotInc.dec_budg = dec_totIntAmt
            
                        await fndUnitBudgExecTotInc.save()            
                    }

                    poSumView.push({title: "INCOME", sortkey: 25, group: 1, isTitle: true})
                    
                    let nloanTotIntAmt = jan_totIntAmt + feb_totIntAmt + mar_totIntAmt + apr_totIntAmt + may_totIntAmt + jun_totIntAmt
                      + jul_totIntAmt + aug_totIntAmt + sep_totIntAmt + oct_totIntAmt + nov_totIntAmt + dec_totIntAmt

                    if (nloanTotIntAmt > 0) {
                        poSumView.push({title: "Loan Fees", desc: "Loan Fees", sortkey: 26, group: 1, jan_value : jan_totIntAmt, feb_value : feb_totIntAmt, mar_value : mar_totIntAmt, apr_value : apr_totIntAmt,
                            may_value : may_totIntAmt, jun_value : jun_totIntAmt, jul_value : jul_totIntAmt, aug_value : aug_totIntAmt,
                            sep_value : sep_totIntAmt, oct_value : oct_totIntAmt, nov_value : nov_totIntAmt, dec_value : dec_totIntAmt 
                        })         
                    }

                    let loanProcesFee = .015
                    let janProcFeeAmt = _.round(janTotAmtLoan * loanProcesFee, 2) 
                    let febProcFeeAmt = _.round(febTotAmtLoan * loanProcesFee, 2) 
                    let marProcFeeAmt = _.round(marTotAmtLoan * loanProcesFee, 2) 
                    let aprProcFeeAmt = _.round(aprTotAmtLoan * loanProcesFee, 2) 
                    let mayProcFeeAmt = _.round(mayTotAmtLoan * loanProcesFee, 2) 
                    let junProcFeeAmt = _.round(junTotAmtLoan * loanProcesFee, 2) 
                    let julProcFeeAmt = _.round(julTotAmtLoan * loanProcesFee, 2) 
                    let augProcFeeAmt = _.round(augTotAmtLoan * loanProcesFee, 2) 
                    let sepProcFeeAmt = _.round(sepTotAmtLoan * loanProcesFee, 2) 
                    let octProcFeeAmt = _.round(octTotAmtLoan * loanProcesFee, 2) 
                    let novProcFeeAmt = _.round(novTotAmtLoan * loanProcesFee, 2) 
                    let decProcFeeAmt = _.round(decTotAmtLoan * loanProcesFee, 2) 

                    if (isNull(fndUnitBuExTotProcFees)) { 
                        let newPoExecSumBudg = new Budg_exec_sum({
                            region: "NOL", area: "NEL", branch: vwBranchCode, unit: vwUnitCode, po: "Unit", title: "PROCESSING FEES", view_code: "TotProcFee", jan_budg : janProcFeeAmt, 
                            feb_budg : febProcFeeAmt, mar_budg : marProcFeeAmt, apr_budg : aprProcFeeAmt, 
                            may_budg : mayProcFeeAmt, jun_budg : junProcFeeAmt, jul_budg : julProcFeeAmt, 
                            aug_budg : augProcFeeAmt, sep_budg : sepProcFeeAmt, oct_budg : octProcFeeAmt, 
                            nov_budg : novProcFeeAmt, dec_budg : decProcFeeAmt
                        })
                        const lonTotAmtExecBudg = await newPoExecSumBudg.save()
                    } else {
                        fndUnitBuExTotProcFees.jan_budg = janProcFeeAmt
                        fndUnitBuExTotProcFees.feb_budg = febProcFeeAmt
                        fndUnitBuExTotProcFees.mar_budg = marProcFeeAmt
                        fndUnitBuExTotProcFees.apr_budg = aprProcFeeAmt
                        fndUnitBuExTotProcFees.may_budg = mayProcFeeAmt
                        fndUnitBuExTotProcFees.jun_budg = junProcFeeAmt
                        fndUnitBuExTotProcFees.jul_budg = julProcFeeAmt
                        fndUnitBuExTotProcFees.aug_budg = augProcFeeAmt
                        fndUnitBuExTotProcFees.sep_budg = sepProcFeeAmt
                        fndUnitBuExTotProcFees.oct_budg = octProcFeeAmt
                        fndUnitBuExTotProcFees.nov_budg = novProcFeeAmt
                        fndUnitBuExTotProcFees.dec_budg = decProcFeeAmt
            
                        await fndUnitBuExTotProcFees.save()            
                    }
                    let nloanTotProcFeeAmt = janProcFeeAmt + febProcFeeAmt + marProcFeeAmt + aprProcFeeAmt + mayProcFeeAmt + junProcFeeAmt
                      + julProcFeeAmt + augProcFeeAmt + sepProcFeeAmt + octProcFeeAmt + novProcFeeAmt + decProcFeeAmt

                    if (nloanTotIntAmt > 0) {
                        poSumView.push({title: "Processing Fees", desc: "Processing Fees", sortkey: 27, group: 1, jan_value : janProcFeeAmt, feb_value : febProcFeeAmt, mar_value : marProcFeeAmt, apr_value : aprProcFeeAmt,
                            may_value : mayProcFeeAmt, jun_value : junProcFeeAmt, jul_value : julProcFeeAmt, aug_value : augProcFeeAmt,
                            sep_value : sepProcFeeAmt, oct_value : octProcFeeAmt, nov_value : novProcFeeAmt, dec_value : decProcFeeAmt 
                        })         
                    }


            poSumView.sort( function (a,b) {
                if ( a.sortkey < b.sortkey ){
                    return -1;
                }
                if ( a.sortkey > b.sortkey ){
                    return 1;
                }
                return 0;
            })
        if (doneReadForCBU) { 
            // res.json(poSumView)

            res.render('units/viewUnitTargetMon', {
                vwUniCod: viewUnitCode,
                poSumView: poSumView,
                yuser: yuser   
            })
        }
    } catch (err) {
        console.log(err)
        res.redirect('/units/'+ viewUnitCode)
    }
})

router.get('/exportToExcel/:id', authUser, authRole(ROLE.PUH), (req,res) => {

    // let dataForExcel = []
    // dataForExcel = poSumView

    const dataForExcel = poSumView.map(unitExecSum => {
        return [unitExecSum.title, unitExecSum.beg_bal, unitExecSum.jan_value, unitExecSum.feb_value, unitExecSum.mar_value,
            unitExecSum.apr_value, unitExecSum.may_value, unitExecSum.jun_value, unitExecSum.jul_value, unitExecSum.aug_value,
            unitExecSum.sep_value, unitExecSum.oct_value, unitExecSum.nov_value, unitExecSum.dec_value,unitExecSum.tot_value]
    });

    console.log(dataForExcel)

    let workbook = new excel.Workbook();
    let worksheet = workbook.addWorksheet("Unit_Exec_Sum");

    worksheet.columns = [
      { header: "DESCRIPTION", key: "title", width: 20 },
      { header: "BEG. BALANCE", key: "beg_bal", width: 20 },
      { header: "JANUARY", key: "jan_value", width: 12, style: { numFmt: '#,##0' } },
      { header: "FEBRUARY", key: "feb_value", width: 12, style: { numFmt: '#,##0' } },
      { header: "MARCH", key: "mar_value", width: 12, style: { numFmt: '#,##0' } },
      { header: "APRIL", key: "apr_value", width: 12, style: { numFmt: '#,##0' } },
      { header: "MAY", key: "may_value", width: 12, style: { numFmt: '#,##0' } },
      { header: "JUNE", key: "jun_value", width: 12, style: { numFmt: '#,##0' } },
      { header: "JULY", key: "jul_value", width: 12, style: { numFmt: '#,##0' } },
      { header: "AUGUST", key: "aug_value", width: 12, style: { numFmt: '#,##0' } },
      { header: "SEPTEMBER", key: "sep_value", width: 12, style: { numFmt: '#,##0' } },
      { header: "OCTOBER", key: "oct_value", width: 12, style: { numFmt: '#,##0' } },
      { header: "NOVEMBER", key: "nov_value", width: 12, style: { numFmt: '#,##0' } },
      { header: "DECEMBER", key: "dec_value", width: 12, style: { numFmt: '#,##0' } },
      { header: "TOTAL", key: "tot_value", width: 12, style: { numFmt: '#,##0' } },
    ];

    // Add Array Rows
    worksheet.addRows(dataForExcel)

    worksheet.getRow(1).font = { size: 14, bold: true}
    worksheet.getRow(2).font = { size: 12, bold: true}
    worksheet.getRow(4).font = { size: 12, bold: true}
    worksheet.getRow(9).font = { size: 12, bold: true}
    worksheet.getRow(13).font = { size: 12, bold: true}
    worksheet.getRow(17).font = { size: 12, bold: true}
    worksheet.getRow(22).font = { size: 12, bold: true}
    worksheet.getRow(29).font = { size: 12, bold: true}

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=" + "Unit_exec_Sum.xlsx"
    );

    workbook.xlsx.write(res).then(function () {
      res.status(200).end()
    })

})


// View UNIT PROJECTED COLLECTIONS ROUTE
router.get('/viewUnitProjInc/:id', authUser, authRole(ROLE.PUH), async (req, res) => {

    const viewUnitCode = req.params.id
    const vwUnitCode = viewUnitCode
    const vwBranchCode = vwUnitCode.substr(0,3)
    const yuser = req.user

    let foundPOV = []
    // let foundCenterDet = []
    try {

        const vwloanType = await Loan_type.find({})
        // console.log(vwloanType)

        let poSumViews = []
        let poTotLoanAmtArray = []

        let nwTotValueClient = 0
        let nwTotValueAmt = 0
        let olTotValueClient = 0
        let olTotValueAmt = 0

        let viewTitle = ""

            let doneReadNLC = false
            let doneReadOLC = false
            let doneReadNLA = false
            let doneReadOLA = false

            let fndUnitBudgExecTotLonAmt = []

            const poBudgExecTotLonAmt = await Budg_exec_sum.findOne({unit: viewUnitCode, view_code: "TotLoanAmt"}, function (err, fndTotLonAmt) {
            fndUnitBudgExecTotLonAmt = fndTotLonAmt

                let jan_totLonReleaseInt = 0 
                let feb_totLonReleaseInt = 0 
                let mar_totLonReleaseInt = 0 
                let apr_totLonReleaseInt = 0 
                let may_totLonReleaseInt = 0 
                let jun_totLonReleaseInt = 0 
                let jul_totLonReleaseInt = 0 
                let aug_totLonReleaseInt = 0 
                let sep_totLonReleaseInt = 0 
                let oct_totLonReleaseInt = 0 
                let nov_totLonReleaseInt = 0 
                let dec_totLonReleaseInt = 0 
                let totAmounts = 0

            let jan_loanReleaseAmt = 0 
            let feb_loanReleaseAmt = 0
            let mar_loanReleaseAmt = 0
            let apr_loanReleaseAmt = 0
            let may_loanReleaseAmt = 0
            let jun_loanReleaseAmt = 0
            let jul_loanReleaseAmt = 0
            let aug_loanReleaseAmt = 0
            let sep_loanReleaseAmt = 0
            let oct_loanReleaseAmt = 0
            let nov_loanReleaseAmt = 0
            let dec_loanReleaseAmt = 0

            let rowGranTotloanInt = 0

            let loanAmount = 0

            const interestPerMo = .2

                for (var i = 0; i < monthSelect.length; i++) {
    
                    let monthToSave = monthSelect[i]

                    let jan_ReleaseInt = 0 
                    let feb_ReleaseInt = 0
                    let mar_ReleaseInt = 0
                    let apr_ReleaseInt = 0
                    let may_ReleaseInt = 0
                    let jun_ReleaseInt = 0
                    let jul_ReleaseInt = 0
                    let aug_ReleaseInt = 0
                    let sep_ReleaseInt = 0
                    let oct_ReleaseInt = 0
                    let nov_ReleaseInt = 0
                    let dec_ReleaseInt = 0
                    let rowTotloanInt = 0
                    let loanAmount = 0


                    switch(monthToSave) {
                        case "January":
                            loanAmount = fndTotLonAmt.jan_budg
                            jan_loanReleaseAmt = fndTotLonAmt.jan_budg
                                jan_ReleaseInt = 0
                                feb_ReleaseInt = _.round((jan_loanReleaseAmt * interestPerMo) * .29)
                                mar_ReleaseInt = _.round((jan_loanReleaseAmt * interestPerMo) * .24)
                                apr_ReleaseInt = _.round((jan_loanReleaseAmt * interestPerMo) * .2)
                                may_ReleaseInt = _.round((jan_loanReleaseAmt * interestPerMo) * .15)
                                jun_ReleaseInt = _.round((jan_loanReleaseAmt * interestPerMo) * .09)
                                jul_ReleaseInt = _.round((jan_loanReleaseAmt * interestPerMo) * .03)
                                break;
                        case "February":
                            loanAmount = fndTotLonAmt.feb_budg
                            feb_loanReleaseAmt = fndTotLonAmt.feb_budg
                                feb_ReleaseInt = 0
                                mar_ReleaseInt = _.round((feb_loanReleaseAmt * interestPerMo) * .29)
                                apr_ReleaseInt = _.round((feb_loanReleaseAmt * interestPerMo) * .24)
                                may_ReleaseInt = _.round((feb_loanReleaseAmt * interestPerMo) * .2)
                                jun_ReleaseInt = _.round((feb_loanReleaseAmt * interestPerMo) * .15)
                                jul_ReleaseInt = _.round((feb_loanReleaseAmt * interestPerMo) * .09)
                                aug_ReleaseInt = _.round((feb_loanReleaseAmt * interestPerMo) * .03)
                                break;
                        case "March":
                            loanAmount = fndTotLonAmt.mar_budg
                            mar_loanReleaseAmt = fndTotLonAmt.mar_budg
                                mar_ReleaseInt = 0
                                apr_ReleaseInt = _.round((mar_loanReleaseAmt * interestPerMo) * .29)
                                may_ReleaseInt = _.round((mar_loanReleaseAmt * interestPerMo) * .24)
                                jun_ReleaseInt = _.round((mar_loanReleaseAmt * interestPerMo) * .2)
                                jul_ReleaseInt = _.round((mar_loanReleaseAmt * interestPerMo) * .15)
                                aug_ReleaseInt = _.round((mar_loanReleaseAmt * interestPerMo) * .09)
                                sep_ReleaseInt = _.round((mar_loanReleaseAmt * interestPerMo) * .03)
                                break;
                        case "April":
                            loanAmount = fndTotLonAmt.apr_budg
                            apr_loanReleaseAmt = fndTotLonAmt.apr_budg
                                apr_ReleaseInt = 0
                                may_ReleaseInt = _.round((apr_loanReleaseAmt * interestPerMo) * .29)
                                jun_ReleaseInt = _.round((apr_loanReleaseAmt * interestPerMo) * .24)
                                jul_ReleaseInt = _.round((apr_loanReleaseAmt * interestPerMo) * .2)
                                aug_ReleaseInt = _.round((apr_loanReleaseAmt * interestPerMo) * .15)
                                sep_ReleaseInt = _.round((apr_loanReleaseAmt * interestPerMo) * .09)
                                oct_ReleaseInt = _.round((apr_loanReleaseAmt * interestPerMo) * .03)
                                break;
                        case "May":
                            loanAmount = fndTotLonAmt.may_budg
                            may_loanReleaseAmt = fndTotLonAmt.may_budg
                                may_ReleaseInt = 0
                                jun_ReleaseInt = _.round((may_loanReleaseAmt * interestPerMo) * .29)
                                jul_ReleaseInt = _.round((may_loanReleaseAmt * interestPerMo) * .24)
                                aug_ReleaseInt = _.round((may_loanReleaseAmt * interestPerMo) * .2)
                                sep_ReleaseInt = _.round((may_loanReleaseAmt * interestPerMo) * .15)
                                oct_ReleaseInt = _.round((may_loanReleaseAmt * interestPerMo) * .09)
                                nov_ReleaseInt = _.round((may_loanReleaseAmt * interestPerMo) * .03)                        
                                break;
                        case "June":
                            loanAmount = fndTotLonAmt.jun_budg
                            jun_loanReleaseAmt = fndTotLonAmt.jun_budg
                                jun_ReleaseInt = 0
                                july_ReleaseInt = _.round((jun_loanReleaseAmt * interestPerMo) * .29)
                                aug_ReleaseInt = _.round((jun_loanReleaseAmt * interestPerMo) * .24)
                                sep_ReleaseInt = _.round((jun_loanReleaseAmt * interestPerMo) * .2)
                                oct_ReleaseInt = _.round((jun_loanReleaseAmt * interestPerMo) * .15)
                                nov_ReleaseInt = _.round((jun_loanReleaseAmt * interestPerMo) * .09)
                                dec_ReleaseInt = _.round((jun_loanReleaseAmt * interestPerMo) * .03)
                                break;
                        case "July":
                            loanAmount = fndTotLonAmt.jul_budg
                            jul_loanReleaseAmt = fndTotLonAmt.jul_budg
                                jul_ReleaseInt = 0
                                aug_ReleaseInt = _.round((jul_loanReleaseAmt * interestPerMo) * .29)
                                sep_ReleaseInt = _.round((jul_loanReleaseAmt * interestPerMo) * .24)
                                oct_ReleaseInt = _.round((jul_loanReleaseAmt * interestPerMo) * .2)
                                nov_ReleaseInt = _.round((jul_loanReleaseAmt * interestPerMo) * .15)
                                dec_ReleaseInt = _.round((jul_loanReleaseAmt * interestPerMo) * .09)
                                break;
                        case "August":
                            loanAmount = fndTotLonAmt.aug_budg
                            aug_loanReleaseAmt = fndTotLonAmt.aug_budg
                                aug_ReleaseInt = 0
                                sep_ReleaseInt = _.round((aug_loanReleaseAmt * interestPerMo) * .29)
                                oct_ReleaseInt = _.round((aug_loanReleaseAmt * interestPerMo) * .24)
                                nov_ReleaseInt = _.round((aug_loanReleaseAmt * interestPerMo) * .2)
                                dec_ReleaseInt = _.round((aug_loanReleaseAmt * interestPerMo) * .15)
                                break;
                        case "September":
                            loanAmount = fndTotLonAmt.sep_budg
                            sep_loanReleaseAmt = fndTotLonAmt.sep_budg
                                sep_ReleaseInt = 0
                                oct_ReleaseInt = _.round((sep_loanReleaseAmt * interestPerMo) * .29)
                                nov_ReleaseInt = _.round((sep_loanReleaseAmt * interestPerMo) * .24)
                                dec_ReleaseInt = (_.round(sep_loanReleaseAmt * interestPerMo) * .2)
                                break;
                        case "October":
                            loanAmount = fndTotLonAmt.oct_budg
                            oct_loanReleaseAmt = fndTotLonAmt.oct_budg
                                oct_ReleaseInt = 0
                                nov_ReleaseInt = _.round((oct_loanReleaseAmt * interestPerMo) * .29)
                                dec_ReleaseInt = _.round((oct_loanReleaseAmt * interestPerMo) * .24)
                                break;
                        case "November":
                            loanAmount = fndTotLonAmt.nov_budg
                            nov_loanReleaseAmt = fndTotLonAmt.nov_budg
                                nov_ReleaseInt = 0
                                dec_ReleaseInt = _.round((nov_loanReleaseAmt * interestPerMo) * .29)
                                break;
                        case "December":
                            loanAmount = fndTotLonAmt.dec_budg
                            dec_loanReleaseAmt = fndTotLonAmt.dec_budg
                                dec_ReleaseInt = 0
                                break;
                        default:
                            month = ""
                            break;
                    }

                    rowTotloanInt = jan_ReleaseInt + feb_ReleaseInt + mar_ReleaseInt + apr_ReleaseInt + may_ReleaseInt + jun_ReleaseInt + 
                            jul_ReleaseInt + aug_ReleaseInt + sep_ReleaseInt + oct_ReleaseInt + nov_ReleaseInt + dec_ReleaseInt

                    poTotLoanAmtArray.push({month: monthToSave, loanAmount: loanAmount, jan_loan_int: jan_ReleaseInt, feb_loan_int: feb_ReleaseInt, mar_loan_int: mar_ReleaseInt, 
                        apr_loan_int: apr_ReleaseInt, may_loan_int: may_ReleaseInt, jun_loan_int: jun_ReleaseInt, jul_loan_int: jul_ReleaseInt, aug_loan_int: aug_ReleaseInt, 
                        sep_loan_int: sep_ReleaseInt, oct_loan_int: oct_ReleaseInt, nov_loan_int: nov_ReleaseInt, dec_loan_int: dec_ReleaseInt, rowTotloanInt: rowTotloanInt})

                        jan_totLonReleaseInt = jan_totLonReleaseInt + jan_ReleaseInt
                        feb_totLonReleaseInt = feb_totLonReleaseInt + feb_ReleaseInt
                        mar_totLonReleaseInt = mar_totLonReleaseInt + mar_ReleaseInt
                        apr_totLonReleaseInt = apr_totLonReleaseInt + apr_ReleaseInt
                        may_totLonReleaseInt = may_totLonReleaseInt + may_ReleaseInt
                        jun_totLonReleaseInt = jun_totLonReleaseInt + jun_ReleaseInt
                        jul_totLonReleaseInt = jul_totLonReleaseInt + jul_ReleaseInt
                        aug_totLonReleaseInt = aug_totLonReleaseInt + aug_ReleaseInt
                        sep_totLonReleaseInt = sep_totLonReleaseInt + sep_ReleaseInt
                        oct_totLonReleaseInt = oct_totLonReleaseInt + oct_ReleaseInt
                        nov_totLonReleaseInt = nov_totLonReleaseInt + nov_ReleaseInt
                        dec_totLonReleaseInt = dec_totLonReleaseInt + dec_ReleaseInt
                        totAmounts = totAmounts + loanAmount

                        rowGranTotloanInt = rowGranTotloanInt + rowTotloanInt

                        // res.json("iteration " + i);
                    // res.json('name:' + user[i].name + user[i].address);
                } 
                poTotLoanAmtArray.push({month: "TOTAL AMOUNTS", loanAmount: totAmounts, jan_loan_int: jan_totLonReleaseInt, feb_loan_int: feb_totLonReleaseInt, mar_loan_int: mar_totLonReleaseInt, 
                    apr_loan_int: apr_totLonReleaseInt, may_loan_int: may_totLonReleaseInt, jun_loan_int: jun_totLonReleaseInt, jul_loan_int: jul_totLonReleaseInt, aug_loan_int: aug_totLonReleaseInt, 
                    sep_loan_int: sep_totLonReleaseInt, oct_loan_int: oct_totLonReleaseInt, nov_loan_int: nov_totLonReleaseInt, dec_loan_int: dec_totLonReleaseInt, rowTotloanInt: rowGranTotloanInt})

        })
        console.log(poTotLoanAmtArray)

        res.render('units/viewUnitProjInc', {
            vwUniCod: viewUnitCode,
            poSumView: poTotLoanAmtArray,
            yuser: yuser
        })
    } catch (err) {
        console.log(err)
        res.redirect('/units/'+ viewUnitCode)
    }
})


// View UNIT PROJECTED COLLECTIONS ROUTE
router.get('/viewUnitProjCol/:id', authUser, authRole(ROLE.PUH), async (req, res) => {
    res.send('Ongoing development')
})
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

// DISPLAY SUMMARY BREAKDOWN PER LOAN TYPE
                // let jan_totValue = 0  
                // let feb_totValue = 0
                // let mar_totValue = 0
                // let apr_totValue = 0
                // let may_totValue = 0
                // let jun_totValue = 0
                // let jul_totValue = 0
                // let aug_totValue = 0
                // let sep_totValue = 0
                // let oct_totValue = 0
                // let nov_totValue = 0
                // let dec_totValue = 0

//                console.log(viewUnitCode)
//                 let poVSum = []
//                 poSumView.push({title: "NEW LOAN CLIENTS", sortkey: 31, group: 2})
//                 poSumView.push({title: "NEW LOAN AMOUNTS", sortkey: 33, group: 1})
//                 poSumView.push({title: "OLD LOAN CLIENTS", sortkey: 35, group: 2})
//                 poSumView.push({title: "OLD LOAN AMOUNTS", sortkey: 37, group: 1})
//                 poSumView.push({title: "RESIGN CLIENTS", sortkey: 39, group: 2})

//                 // Accessing loan_types
//                 vwloanType.forEach(loan_type => {
//                     const typeLoanDet = loan_type.title
//                     const vwlnType = loan_type.loan_type

//                     let nloanTotAmt = 0
//                     let nloanTotCli = 0
//                     let oloanTotAmt = 0
//                     let oloanTotCli = 0
//                     let rloanTotCli = 0

// //                    const  lnTypeBegBal = 

//                     let jan_detNewtotCli = 0 
//                     let feb_detNewtotCli = 0
//                     let mar_detNewtotCli = 0
//                     let apr_detNewtotCli = 0
//                     let may_detNewtotCli = 0
//                     let jun_detNewtotCli = 0
//                     let jul_detNewtotCli = 0
//                     let aug_detNewtotCli = 0
//                     let sep_detNewtotCli = 0
//                     let oct_detNewtotCli = 0
//                     let nov_detNewtotCli = 0
//                     let dec_detNewtotCli = 0
//                         let begBal_OldCli = 0 
//                         let jan_detOldtotCli = 0 
//                         let feb_detOldtotCli = 0
//                         let mar_detOldtotCli = 0
//                         let apr_detOldtotCli = 0
//                         let may_detOldtotCli = 0
//                         let jun_detOldtotCli = 0
//                         let jul_detOldtotCli = 0
//                         let aug_detOldtotCli = 0
//                         let sep_detOldtotCli = 0
//                         let oct_detOldtotCli = 0
//                         let nov_detOldtotCli = 0
//                         let dec_detOldtotCli = 0
//                     let jan_detNewtotAmt = 0 
//                     let feb_detNewtotAmt = 0
//                     let mar_detNewtotAmt = 0
//                     let apr_detNewtotAmt = 0
//                     let may_detNewtotAmt = 0
//                     let jun_detNewtotAmt = 0
//                     let jul_detNewtotAmt = 0
//                     let aug_detNewtotAmt = 0
//                     let sep_detNewtotAmt = 0
//                     let oct_detNewtotAmt = 0
//                     let nov_detNewtotAmt = 0
//                     let dec_detNewtotAmt = 0
//                         let begBaldetOldtotAmt = 0 
//                         let jan_detOldtotAmt = 0 
//                         let feb_detOldtotAmt = 0
//                         let mar_detOldtotAmt = 0
//                         let apr_detOldtotAmt = 0
//                         let may_detOldtotAmt = 0
//                         let jun_detOldtotAmt = 0
//                         let jul_detOldtotAmt = 0
//                         let aug_detOldtotAmt = 0
//                         let sep_detOldtotAmt = 0
//                         let oct_detOldtotAmt = 0
//                         let nov_detOldtotAmt = 0
//                         let dec_detOldtotAmt = 0
//                     let jan_detResCli = 0 
//                     let feb_detResCli = 0
//                     let mar_detResCli = 0
//                     let apr_detResCli = 0
//                     let may_detResCli = 0
//                     let jun_detResCli = 0
//                     let jul_detResCli = 0
//                     let aug_detResCli = 0
//                     let sep_detResCli = 0
//                     let oct_detResCli = 0
//                     let nov_detResCli = 0
//                     let dec_detResCli = 0

//         //            console.log(typeLoan)
        
//                     foundCenterDet.forEach(centerDet => {
//                         const fvwlnType = centerDet.loan_type
//                         const monthDet = centerDet.view_code
//                         if (fvwlnType === typeLoanDet) {
//                             switch(monthDet) {
//                                 case "NewLoanClient": orderMonth = 11 
//                                     jan_detNewtotCli = jan_detNewtotCli + centerDet.jan_budg 
//                                     feb_detNewtotCli = feb_detNewtotCli + centerDet.feb_budg 
//                                     mar_detNewtotCli = mar_detNewtotCli + centerDet.mar_budg 
//                                     apr_detNewtotCli = apr_detNewtotCli + centerDet.apr_budg 
//                                     may_detNewtotCli = may_detNewtotCli + centerDet.may_budg 
//                                     jun_detNewtotCli = jun_detNewtotCli + centerDet.jun_budg 
//                                     jul_detNewtotCli = jul_detNewtotCli + centerDet.jul_budg 
//                                     aug_detNewtotCli = aug_detNewtotCli + centerDet.aug_budg 
//                                     sep_detNewtotCli = sep_detNewtotCli + centerDet.sep_budg 
//                                     oct_detNewtotCli = oct_detNewtotCli + centerDet.oct_budg 
//                                     nov_detNewtotCli = nov_detNewtotCli + centerDet.nov_budg 
//                                     dec_detNewtotCli = dec_detNewtotCli + centerDet.dec_budg 
//                                     break;
//                                 case "OldLoanClient": orderMonth = 12
//                                     begBal_OldCli = begBal_OldCli + centerDet.beg_bal
//                                     jan_detOldtotCli = jan_detOldtotCli + centerDet.jan_budg 
//                                     feb_detOldtotCli = feb_detOldtotCli + centerDet.feb_budg 
//                                     mar_detOldtotCli = mar_detOldtotCli + centerDet.mar_budg 
//                                     apr_detOldtotCli = apr_detOldtotCli + centerDet.apr_budg 
//                                     may_detOldtotCli = may_detOldtotCli + centerDet.may_budg 
//                                     jun_detOldtotCli = jun_detOldtotCli + centerDet.jun_budg 
//                                     jul_detOldtotCli = jul_detOldtotCli + centerDet.jul_budg 
//                                     aug_detOldtotCli = aug_detOldtotCli + centerDet.aug_budg 
//                                     sep_detOldtotCli = sep_detOldtotCli + centerDet.sep_budg 
//                                     oct_detOldtotCli = oct_detOldtotCli + centerDet.oct_budg 
//                                     nov_detOldtotCli = nov_detOldtotCli + centerDet.nov_budg 
//                                     dec_detOldtotCli = dec_detOldtotCli + centerDet.dec_budg 
//                                     break;
//                                 case "NewLoanAmt": orderMonth = 13
//                                     jan_detNewtotAmt = jan_detNewtotAmt + centerDet.jan_budg 
//                                     feb_detNewtotAmt = feb_detNewtotAmt + centerDet.feb_budg 
//                                     mar_detNewtotAmt = mar_detNewtotAmt + centerDet.mar_budg 
//                                     apr_detNewtotAmt = apr_detNewtotAmt + centerDet.apr_budg 
//                                     may_detNewtotAmt = may_detNewtotAmt + centerDet.may_budg 
//                                     jun_detNewtotAmt = jun_detNewtotAmt + centerDet.jun_budg 
//                                     jul_detNewtotAmt = jul_detNewtotAmt + centerDet.jul_budg 
//                                     aug_detNewtotAmt = aug_detNewtotAmt + centerDet.aug_budg 
//                                     sep_detNewtotAmt = sep_detNewtotAmt + centerDet.sep_budg 
//                                     oct_detNewtotAmt = oct_detNewtotAmt + centerDet.oct_budg 
//                                     nov_detNewtotAmt = nov_detNewtotAmt + centerDet.nov_budg 
//                                     dec_detNewtotAmt = dec_detNewtotAmt + centerDet.dec_budg 
//                                     break;
//                                 case "OldLoanAmt": orderMonth = 14
//                                     begBaldetOldtotAmt = begBaldetOldtotAmt + centerDet.beg_bal
//                                     jan_detOldtotAmt = jan_detOldtotAmt + centerDet.jan_budg 
//                                     feb_detOldtotAmt = feb_detOldtotAmt + centerDet.feb_budg 
//                                     mar_detOldtotAmt = mar_detOldtotAmt + centerDet.mar_budg 
//                                     apr_detOldtotAmt = apr_detOldtotAmt + centerDet.apr_budg 
//                                     may_detOldtotAmt = may_detOldtotAmt + centerDet.may_budg 
//                                     jun_detOldtotAmt = jun_detOldtotAmt + centerDet.jun_budg 
//                                     jul_detOldtotAmt = jul_detOldtotAmt + centerDet.jul_budg 
//                                     aug_detOldtotAmt = aug_detOldtotAmt + centerDet.aug_budg 
//                                     sep_detOldtotAmt = sep_detOldtotAmt + centerDet.sep_budg 
//                                     oct_detOldtotAmt = oct_detOldtotAmt + centerDet.oct_budg 
//                                     nov_detOldtotAmt = nov_detOldtotAmt + centerDet.nov_budg 
//                                     dec_detOldtotAmt = dec_detOldtotAmt + centerDet.dec_budg 
//                                     break;
//                                     case "ResClientCount": orderMonth = 14
//                                     jan_detResCli = jan_detResCli + centerDet.jan_budg 
//                                     feb_detResCli = feb_detResCli + centerDet.feb_budg 
//                                     mar_detResCli = mar_detResCli + centerDet.mar_budg 
//                                     apr_detResCli = apr_detResCli + centerDet.apr_budg 
//                                     may_detResCli = may_detResCli + centerDet.may_budg 
//                                     jun_detResCli = jun_detResCli + centerDet.jun_budg 
//                                     jul_detResCli = jul_detResCli + centerDet.jul_budg 
//                                     aug_detResCli = aug_detResCli + centerDet.aug_budg 
//                                     sep_detResCli = sep_detResCli + centerDet.sep_budg 
//                                     oct_detResCli = oct_detResCli + centerDet.oct_budg 
//                                     nov_detResCli = nov_detResCli + centerDet.nov_budg 
//                                     dec_detResCli = dec_detResCli + centerDet.dec_budg 
//                                     break;
//                                 default:
//                                     orderMonth = 0
//                             }   
//                         }
//                     })
//                         nloanTotCli = jan_detNewtotCli + feb_detNewtotCli + mar_detNewtotCli + apr_detNewtotCli + may_detNewtotCli + jun_detNewtotCli
//                             + jul_detNewtotCli + aug_detNewtotCli + sep_detNewtotCli + oct_detNewtotCli + nov_detNewtotCli + dec_detNewtotCli
                            
//                             if (nloanTotCli > 0) {
//                                 poSumView.push({title: typeLoanDet + " - NLC", desc: "newLoanClient", sortkey: 32, group: 2, jan_value : jan_detNewtotCli, feb_value : feb_detNewtotCli, mar_value : mar_detNewtotCli, apr_value : apr_detNewtotCli,
//                                     may_value : may_detNewtotCli, jun_value : jun_detNewtotCli, jul_value : jul_detNewtotCli, aug_value : aug_detNewtotCli,
//                                     sep_value : sep_detNewtotCli, oct_value : oct_detNewtotCli, nov_value : nov_detNewtotCli, dec_value : dec_detNewtotCli 
//                                 })         
//                             }
                
//                         oloanTotCli = jan_detOldtotCli + feb_detOldtotCli + mar_detOldtotCli + apr_detOldtotCli + may_detOldtotCli + jun_detOldtotCli
//                             + jul_detOldtotCli + aug_detOldtotCli + sep_detOldtotCli + oct_detOldtotCli + nov_detOldtotCli + dec_detOldtotCli

//                             if (oloanTotCli > 0) {
//                                 poSumView.push({title: typeLoanDet + " - OLC", desc: "oldLoanClient", sortkey: 35, group: 2, beg_bal : begBal_OldCli, jan_value : jan_detOldtotCli, feb_value : feb_detOldtotCli, mar_value : mar_detOldtotCli, apr_value : apr_detOldtotCli,
//                                     may_value : may_detOldtotCli, jun_value : jun_detOldtotCli, jul_value : jul_detOldtotCli, aug_value : aug_detOldtotCli,
//                                     sep_value : sep_detOldtotCli, oct_value : oct_detOldtotCli, nov_value : nov_detOldtotCli, dec_value : dec_detOldtotCli 
//                                 })         
//                             }

//                         nloanTotAmt = jan_detNewtotAmt + feb_detNewtotAmt + mar_detNewtotAmt + apr_detNewtotAmt + may_detNewtotAmt + jun_detNewtotAmt
//                             + jul_detNewtotAmt + aug_detNewtotAmt + sep_detNewtotAmt + oct_detNewtotAmt + nov_detNewtotAmt + dec_detNewtotAmt

//                             if (nloanTotAmt > 0) {
//                                 poSumView.push({title: typeLoanDet + " - NLA", desc: "newLoanAmt", sortkey: 34, group: 1, jan_value : jan_detNewtotAmt, feb_value : feb_detNewtotAmt, mar_value : mar_detNewtotAmt, apr_value : apr_detNewtotAmt,
//                                     may_value : may_detNewtotAmt, jun_value : jun_detNewtotAmt, jul_value : jul_detNewtotAmt, aug_value : aug_detNewtotAmt,
//                                     sep_value : sep_detNewtotAmt, oct_value : oct_detNewtotAmt, nov_value : nov_detNewtotAmt, dec_value : dec_detNewtotAmt 
//                                 })         
//                             }

//                         oloanTotAmt = jan_detOldtotAmt + feb_detOldtotAmt + mar_detOldtotAmt + apr_detOldtotAmt + may_detOldtotAmt + jun_detOldtotAmt
//                             + jul_detOldtotAmt + aug_detOldtotAmt + sep_detOldtotAmt + oct_detOldtotAmt + nov_detOldtotAmt + dec_detOldtotAmt

//                             if (oloanTotAmt > 0) {
//                                 poSumView.push({title: typeLoanDet + " - OLA", desc: "oldLoanAmt", sortkey: 38, group: 1, beg_bal : begBaldetOldtotAmt, jan_value : jan_detOldtotAmt, feb_value : feb_detOldtotAmt, mar_value : mar_detOldtotAmt, apr_value : apr_detOldtotAmt,
//                                     may_value : may_detOldtotAmt, jun_value : jun_detOldtotAmt, jul_value : jul_detOldtotAmt, aug_value : aug_detOldtotAmt,
//                                     sep_value : sep_detOldtotAmt, oct_value : oct_detOldtotAmt, nov_value : nov_detOldtotAmt, dec_value : dec_detOldtotAmt 
//                                 })         
//                             }

//                         rloanTotCli = jan_detResCli + feb_detResCli + mar_detResCli + apr_detResCli + may_detResCli + jun_detResCli
//                             + jul_detResCli + aug_detResCli + sep_detResCli + oct_detResCli + nov_detResCli + dec_detResCli
        
//                             if (rloanTotCli > 0) {
//                                 poSumView.push({title: typeLoanDet + " - RES", desc: "ResClientCount", sortkey: 40, jan_value : jan_detResCli, feb_value : feb_detResCli, mar_value : mar_detResCli, apr_value : apr_detResCli,
//                                     may_value : may_detResCli, jun_value : jun_detResCli, jul_value : jul_detResCli, aug_value : aug_detResCli,
//                                     sep_value : sep_detResCli, oct_value : oct_detResCli, nov_value : nov_detResCli, dec_value : dec_detResCli 
//                                 })         
//                             }
//                     })         

