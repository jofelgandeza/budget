const express = require('express')
const router  = express.Router()
const Swal = require('sweetalert2')
const excel = require('exceljs')

const Center = require('../models/center')
const Employee = require('../models/employee')
const Position = require('../models/position')
const Loan_type = require('../models/loan_type')
const Center_budget_det = require('../models/center_budget_det')
const Branch = require('../models/branch')
const Area = require('../models/area')
const Region = require('../models/region')
const User = require('../models/user')
const Budg_exec_sum = require('../models/budg_exec_sum')

const bcrypt = require('bcrypt')
const { forEach, isNull } = require('lodash')

const _ = require('lodash')
const Cleave = require('../public/javascripts/cleave.js')
const loan_type = require('../models/loan_type')
const { authUser, authRole } = require('../public/javascripts/basicAuth.js')
const { canViewProject, canDeleteProject, scopedProjects } = require('../public/javascripts/permissions/project.js')
const user = require('../models/user')
const { ROLE } = require('../public/javascripts/data.js')
const region = require('../models/region')

const monthSelect = ["January","February", "March", "April", "May", "June", "July", "August", "September", "October", "November","December"];

let poSumView = []

// authUser, authRole("BM", "ADMIN"), 
// console.log(ROLE)
// All Chart of Accounts Route

router.get('/:id', authUser, authRole(ROLE.AM),  async (req, res) => {

    const areaCode = req.params.id
    const _user = req.user
    let searchOptions = {}

    const fndPositi = posisyon

    let foundPOunits = []
    let foundPO = []
    let officerName = ""
    let postAreaMgr = ""
    let postManager = ""
    let postUnitHead = ""
    let postProgOfr = ""

    let unitLoanTotals = []
    let brnLoanTotals = []
    let brnLoanGrandTot = []
    let foundCenter = []
    let fndAreaEmps = []

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

    let foundAreaMgr = []
    let foundAreaBranches = []
    let foundAreaUnits = []
    let foundAreaPOs = []

    let totBranches = 0
    let totUnits = 0
    let totPOs = 0
    let totCenters = 0
    let lnType 
    // const POdata = await Employee.findOne({assign_code: IDcode})
    // const POname = POdata.first_name + " " + POdata.middle_name.substr(0,1) + ". " + POdata.last_name
    // const POposition = POdata.position_code

    let doneReadCenter = false
    let doneFoundPO = false
    let doneReadLonTyp = false
   
    fndPositi.forEach(fndPosii => {
        const fndPositionEmp = fndPosii.code
        const fndPositID = fndPosii.id
        if (fndPositionEmp === "AREA_MGR") {
            postAreaMgr = fndPositID
        }
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

    try {

        const areaManager = await Employee.find({area: areaCode}, function (err, foundAreaEmp){
            fndAreaEmps = foundAreaEmp
        })

        let i = 0
        fndAreaEmps.forEach( areaEmps => {
            const areaEmpPost = areaEmps.position_code
            const assignCode = areaEmps.assign_code

            const empName = areaEmps.first_name + " " + areaEmps.middle_name.substr(0,1) + ". " + areaEmps.last_name
            
            if( areaEmpPost == postAreaMgr) {
                foundAreaMgr.push({assCode: assignCode, emp_name: empName})
            }
            if(areaEmpPost == postManager) {
                foundAreaBranches.push({assCode: assignCode, emp_name: empName})
            }
            if(areaEmpPost == postUnitHead) {
                foundAreaUnits.push({assCode: assignCode, emp_name: empName})
            }
            if(areaEmpPost == postProgOfr) {
                foundAreaPOs.push({assCode: assignCode, emp_name: empName})
            }

            i = i + 1
        })
            totBranches = foundAreaBranches.length
            totUnits = foundAreaUnits.length
            // })
        // const programOfficers = await Employee.find({area: areaCode, position_code: postProgOfr}, function (err, foundPO){
        //     foundPOs = foundPO
            totPOs = foundAreaPOs.length
            // })
        
        const loanType = await Loan_type.find({})

        const center = await Center.find({area: areaCode}) //, function (err, foundCenters) {
//        const center = await Center.find(searchOptions)
            if (center.length === 0) {
                doneReadCenter = true
            
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
                // tbudgEndBal = (budgBegBal + newClients) - (rClient + rClient2)

                foundCenter = center.sort()

                doneReadCenter = true   
            }

            totCenters = foundCenter.length
//           foundPOunits -> foundAreaBranches
    foundAreaBranches.forEach(uh => {

        let brnCode = _.trim(uh.assCode)
        let brn_Code = brnCode
        let brnMgrName = uh.emp_name
        let forSortUnitNum = brn_Code

        let nUnitLoanTot = 0
        let nUnitLoanTotCount = 0
        let oUnitLoanTot = 0
        let oUnitLoanTotCount = 0
        let resUnitLoanTot = 0
        let begUnitLoanTot = 0
        let begUnitClientTot = 0
        let bUnitClient = 0
        let bUnitClientCnt = 0

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
                brn_Code = " "
                brnMgrName = ""
            } 
            if (typeLoan === "Individual Loan" && brn_Code === "TUG") {
                const typeOfLoan = typeLoan
            }

            foundCenter.forEach(center => {
                const branchCode = center.branch
                if (branchCode === brnCode) { 
                    const lnType = center.loan_code
                    let centerTargets = center.Targets
                    let LoanBegBal = center.Loan_beg_bal
//                  let centerLoanBegBal = center.Loan_beg_bal                
                    let resignClient = center.resClient

                    if (lnType === _.trim(lnType)) {
                        BudgBegBal = center.budget_BegBal
                    }
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
            let areaBudgEndBal = (uBegClientTot + nloanTotCount) - resloanTot
            totbudgEndBal = totbudgEndBal + areaBudgEndBal
//            let amtDisburse = oloanTot + oloanTot
            
            unitLoanTotals.push({sortkey: brn_Code, unit: brn_Code, unitHead: brnMgrName, loan_type: typeLoan, nnumClient: nloanTotCount, amtDisburse: totAmounts, begClientTot: uBegClientTot,
                begClientAmt: bClientAmt, ntotAmount: nloanTot, onumClient: oloanTotCount, ototAmount: oloanTot, resiloanTot: resloanTot, budgEndBal: areaBudgEndBal})

            nUnitLoanTot = nUnitLoanTot + nloanTot
            nUnitLoanTotCount = nUnitLoanTotCount + nloanTotCount
            oUnitLoanTot = oUnitLoanTot + oloanTot
            oUnitLoanTotCount = oUnitLoanTotCount + oloanTotCount
            resUnitLoanTot = resUnitLoanTot + resloanTot
            begUnitLoanTot = begUnitLoanTot + begLoanTot
            begUnitClientTot = begUnitClientTot + uBegClientTot
            
        })

        typeLoan = "BRANCH TOTALS"
        let totUnitAmounts = nUnitLoanTot + oUnitLoanTot 
        let budgUnitEndBal = (oUnitLoanTotCount + nUnitLoanTotCount + begUnitClientTot) - resUnitLoanTot

        unitLoanTotals.push({sortkey: forSortUnitNum, unit: brn_Code, unitHead: brnMgrName, loan_type: typeLoan, nnumClient: nUnitLoanTotCount, amtDisburse: totUnitAmounts, begClientTot: begUnitClientTot,
            begClientAmt: begUnitLoanTot, ntotAmount: nUnitLoanTot, onumClient: oUnitLoanTotCount, ototAmount: oUnitLoanTot, resiloanTot: resUnitLoanTot, budgEndBal: budgUnitEndBal})

            doneFoundPO = true
    })

    if (foundAreaBranches.length === 0) {
        doneFoundPO = true
    }

    console.log(unitLoanTotals)
// LOOP for getting Different Loan products totals in the branch
    let gtBegBalClient = 0
    let gtBegBalAmt = 0

    loanType.forEach(loan_type => {
        const typeLoan = loan_type.title
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
        let totareaAmounts = nloanTot + oloanTot 
        let budgareaEndBal = (ubegClientTot + nloanTotCount) - resloanTot
            tbudgEndBal = tbudgEndBal + budgareaEndBal

        brnLoanTotals.push({loan_type: typeLoan, nnumClient: nloanTotCount, amtDisburse: totareaAmounts, begClientTot: ubegClientTot,
            begClientAmt: begLoanTot, ntotAmount: nloanTot, onumClient: oloanTotCount, ototAmount: oloanTot, resloanTot: resloanTot, budgEndBal: budgareaEndBal})

            doneReadLonTyp = true

    })

//    console.log(unitLoanTotals)
//    console.log(brnLoanTotals)

            brnLoanGrandTot.push({nClient: newClients, nClientAmt: nClientAmt, oClient: oClient, oClientAmt: oClientAmt, totCenters: totCenters, totPOs: totPOs, totUnits: totUnits, totBranches: totBranches,
                rClient: rClient + rClient2, budgBegBal: budgBegBal, budgEndBal: tbudgEndBal, totalDisburse: totDisburse, budBegBalAmt: gtBegBalAmt, budBegBalClient: gtBegBalClient})

            console.log(totDisburse)

//            console.log(foundPOunits)
        if ( doneReadCenter && doneFoundPO && doneReadLonTyp) {
            res.render('areas/index', {
                areaCode: areaCode,
                officerName: officerName,
                loanTots: brnLoanTotals,
                poGrandTot: brnLoanGrandTot,
                searchOptions: req.query,
                yuser: _user,
                dateToday: new Date()

            })
        }


    // if (req.query.title  !=null && req.query.title !== '') {
    //     searchOptions.description = RegExp(req.query.title, 'i')
    // }
    // try {

    //     branchName = "AREA BUDGET MODULE VIEW"
    //     res.render('areas/index', {
    //         areaCode: areaCode,
    //         searchOptions: req.query,
    //         yuser: _user,
    //         dateToday: new Date()
    //     })

    } catch (err) {
        console.log(err)
        res.redirect('/')
    }
})

// View Branch per Branch  - NLE
router.get('/budget/:id', authUser, authRole(ROLE.AM), async (req, res) => {
    
    const areaCode = req.params.id
    const _user = req.user

    const fndPositi = posisyon

    const branchMgrID = "604f06bf7ca02f8a731fa8a6"

    let foundBranchMgr = []
    let foundAMBranches = []
    let foundPO = []
    let officerName = ""
    let postManager = ""
    let postUnitHead = ""
    let postAreaMgr = ""

    let unitLoanTotals = []
    let brnLoanTotals = []
    let brnLoanGrandTot = []
    let foundCenter = []
    let loanType = []

    let newClients = 0
    let nClientAmt = 0
    let oClient = 0
    let oClientAmt = 0
    let rClient = 0
    let rClient2 = 0
    let budgEndBal = 0
    let totDisburse = 0
    let budgBegBal = 0
    let tbudgEndBal = 0

    let lnType 
    // const POdata = await Employee.findOne({assign_code: IDcode})
    // const POname = POdata.first_name + " " + POdata.middle_name.substr(0,1) + ". " + POdata.last_name
    // const POposition = POdata.position_code

    let doneReadCenter = false
    let doneFoundMgr = false
    let doneReadLonTyp = false

    console.log(fndPositi)
   
    fndPositi.forEach(fndPosii => {
        const fndPositionEmp = fndPosii.code
        const fndPositID = fndPosii.id
        if (fndPositionEmp === "AREA_MGR") {
            postAreaMgr = fndPositID
        }
        if (fndPositionEmp === "BRN_MGR") {
            postManager = fndPositID
        }
        if (fndPositionEmp === "UNI_HED") {
            postUnitHead = fndPositID
        }
    })

    console.log(postAreaMgr)
    try {

        const areaManager = await Employee.find({area: areaCode, position_code: postAreaMgr}, function (err, foundBMs){
            foundBranchMgr = foundBMs

           })
        
           if (areaManager) {
                areaManager.forEach(manager => {
                    officerName = manager.first_name + " " + manager.middle_name.substr(0,1) + ". " + manager.last_name
                })
            }            
        const branMgrs = await Employee.find({area: areaCode, position_code: postManager}, function (err, foundUHs){
            foundAMBranches = foundUHs
            doneFoundMgr = true
            })

          const loan_Type= await Loan_type.find({}, function (err, fndLoanTyp) {
            loanType = fndLoanTyp
            doneReadLonTyp = true
          })
        const center = await Center.find({area: areaCode}, function (err, fndCenters) {
//        const center = await Center.find(searchOptions)
                foundCenter = fndCenters.sort()

            if (fndCenters.length === 0) {
                doneReadCenter = true
            
            } else {

                foundCenter.forEach( fndCtr => {
                    newClients = newClients + fndCtr.newClient
                    nClientAmt = nClientAmt + fndCtr.newClientAmt
                    oClient = oClient + fndCtr.oldClient
                    oClientAmt = oClientAmt + fndCtr.oldClientAmt
                    rClient = rClient + fndCtr.resClient
                    rClient2 = rClient2 + fndCtr.resClient2
                    budgBegBal = budgBegBal + fndCtr.budget_BegBal
    
                })
                // newClients = _.sumBy(fndCenters, function(o) { return o.newClient; });
                // nClientAmt = _.sumBy(fndCenters, function(o) { return o.newClientAmt; });
                // oClient = _.sumBy(fndCenters, function(o) { return o.oldClient; });
                // oClientAmt = _.sumBy(fndCenters, function(o) { return o.oldClientAmt; });
                // rClient = _.sumBy(fndCenters, function(o) { return o.resClient; });
                // rClient2 = _.sumBy(fndCenters, function(o) { return o.resClient2; });
                // budgBegBal = _.sumBy(fndCenters, function(o) { return o.budget_BegBal; });
                budgEndBal = oClient + newClients 
                totDisburse = nClientAmt + oClientAmt
                tbudgEndBal = (budgBegBal + newClients) - (rClient + rClient2)
    
                doneReadCenter = true   
                }
        })

        // console.log(newClients)
        // console.log(foundAMBranches)

        if (doneReadCenter && doneFoundMgr && doneReadLonTyp) {
            foundAMBranches.forEach(am => {

                let brCode = _.trim(am.branch)
                let br_Cod = brCode
                let unHeadName = am.first_name + " " + am.middle_name.substr(0,1) + ". " + am.last_name
        
                let nUnitLoanTot = 0
                let nUnitLoanTotCount = 0
                let oUnitLoanTot = 0
                let oUnitLoanTotCount = 0
                let resUnitLoanTot = 0
                let begUnitLoanTot = 0
                let begUnitClientTot = 0
                let bUnitClient = 0
                let bUnitClientCnt = 0
        
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
                        brCode = " "
                        unHeadName = ""
                    } 
        
                    foundCenter.forEach(center => {
                        const br_Code = center.branch
                        if (br_Code === br_Cod) { 
                            const lnType = center.loan_code
                            let centerTargets = center.Targets
                            let LoanBegBal = center.Loan_beg_bal
        //                  let centerLoanBegBal = center.Loan_beg_bal                
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
                                    bClientCnt = bClientCnt + begClientTot
                                    bClientAmt = bClientAmt + begLoanTot
                                }
                            })


                        }
                    })
                    let totAmounts = nloanTot + oloanTot 
                    let budgEndBal = (oloanTotCount + nloanTotCount + bClientCnt) - resloanTot
        //            let amtDisburse = oloanTot + oloanTot
                    
                    unitLoanTotals.push({area: brCode, unitHead: unHeadName, loan_type: typeLoan, nnumClient: nloanTotCount, amtDisburse: totAmounts, begClientTot: bClientCnt,
                        begClientAmt: bClientAmt, ntotAmount: nloanTot, onumClient: oloanTotCount, ototAmount: oloanTot, resiloanTot: resloanTot, budgEndBal: budgEndBal})
        
                    nUnitLoanTot = nUnitLoanTot + nloanTot
                    nUnitLoanTotCount = nUnitLoanTotCount + nloanTotCount
                    oUnitLoanTot = oUnitLoanTot + oloanTot
                    oUnitLoanTotCount = oUnitLoanTotCount + oloanTotCount
                    resUnitLoanTot = resUnitLoanTot + resloanTot
                    begUnitLoanTot = begUnitLoanTot + bClientAmt
                    begUnitClientTot = begUnitClientTot + bClientCnt
                    
                })
        
                typeLoan = "BRANCH TOTALS"
                let totUnitAmounts = nUnitLoanTot + oUnitLoanTot 
                let budgUnitEndBal = (oUnitLoanTotCount + nUnitLoanTotCount + begUnitClientTot) - resUnitLoanTot
        
                unitLoanTotals.push({area: brCode, unitHead: unHeadName, loan_type: typeLoan, nnumClient: nUnitLoanTotCount, amtDisburse: totUnitAmounts, begClientTot: begUnitClientTot,
                    begClientAmt: begUnitLoanTot, ntotAmount: nUnitLoanTot, onumClient: oUnitLoanTotCount, ototAmount: oUnitLoanTot, resiloanTot: resUnitLoanTot, budgEndBal: budgUnitEndBal})
        
                    doneFoundPO = true
            })
        
            if (foundAMBranches.length === 0) {
        
            } else {
                doneFoundPO = true   
            }

            console.log(unitLoanTotals)
        
        // LOOP for getting Different Loan products totals in the branch
            let gtBegBalClient = 0
            let gtBegBalAmt = 0
        
            loanType.forEach(loan_type => {
                const typeLoan = loan_type.title
                let nloanTot = 0
                let nloanTotCount = 0
                let oloanTot = 0
                let oloanTotCount = 0
                let resloanTot = 0
                let begLoanTot = 0
                let begClientTot = 0
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
                        begClientTot = begClientTot + uLoanTots.begClientTot
        
                        gtBegBalClient = gtBegBalClient + uLoanTots.begClientTot
                        gtBegBalAmt = gtBegBalAmt + uLoanTots.begClientAmt
                    }
        
                })
                let totBranchAmounts = nloanTot + oloanTot 
                let budgBranchEndBal = (oloanTotCount + nloanTotCount + begClientTot) - resloanTot
        
                brnLoanTotals.push({loan_type: typeLoan, nnumClient: nloanTotCount, amtDisburse: totBranchAmounts, begClientTot: begClientTot,
                    begClientAmt: begLoanTot, ntotAmount: nloanTot, onumClient: oloanTotCount, ototAmount: oloanTot, resloanTot: resloanTot, budgEndBal: budgBranchEndBal})
        
                    doneReadLonTyp = true
        
            })
            brnLoanGrandTot.push({nClient: newClients, nClientAmt: nClientAmt, oClient: oClient, oClientAmt: oClientAmt, 
                rClient: rClient, budgBegBal: budgBegBal, budgEndBal: budgEndBal, totalDisburse: totDisburse, budBegBalAmt: gtBegBalAmt, budBegBalClient: gtBegBalClient})

            console.log(brnLoanTotals)

        
            res.render('areas/budget', {
                listTitle: areaCode,
                officerName: officerName,
                loanTots: brnLoanTotals,
                poGrandTot: brnLoanGrandTot,
                unitLoanTots: unitLoanTotals,
                searchOptions: req.query,
                yuser: _user,
                dateToday: new Date()

            })
        }

 //   console.log(unitLoanTotals)
//    console.log(brnLoanTotals)

//            console.log(foundAMBranches)
    } 
    catch (err) {
        console.log(err)
    }
})

//View EMPLOYEES per AREA Level - TUG

router.get('/employees/:id', authUser, authRole(ROLE.AM), async (req, res) => {

    const areaCode = req.params.id
    const _user = req.user
    
    let branchMgrID = ""
    let fndPositi = posisyon

    let fondEmploy = []
    let sortedEmp = []
    let fndPosition = {}
    let empCode = ""
    let empName = ""
    let empPostCode = "AREA_MGR"
    let empPost = ""
    let empSortKey = ""
    let empPst
    let empAssign = ""
    let empID = ""
    let empUnit = ""

    fndPositi.forEach(fndPosii => {
        const fndPositionEmp = fndPosii.code
        const fndPositID = fndPosii.id
        if (fndPositionEmp === "BRN_MGR") {
            branchMgrID = fndPositID
        }
    })

    let empCanProceed = false
    
    try {
        const branches = await Branch.find({area: areaCode})

        const brnEmployees = await Employee.find({position_code: branchMgrID, area: areaCode}, function (err, foundEmployees) {
            const fndEmployees = foundEmployees

//            const empStatus = fndEmployees.status
//  - Branch ID
            fndEmployees.forEach(foundEmp =>{
                empPst = foundEmp.position_code
                empID = foundEmp._id
                empName = foundEmp.last_name + ", " + foundEmp.first_name + " " + foundEmp.middle_name.substr(0,1) + "."
                empCode = foundEmp.emp_code
                empUnit = foundEmp.unit
                empUnitPOnum = foundEmp.unit + foundEmp.po_number
                empAss = foundEmp.assign_code
                branchCode = foundEmp.branch
                let exist = false
//                console.log(empID)
                // console.log(empPst)

                const empAssign = _.find(branches, {branch: empAss})

                    fondEmploy.push({empID: empID, area: areaCode, empName: empName, empCode: empCode, empPostCode: empPostCode, empPost: empAssign.branch_desc})
                empCanProceed = true            
            })

        })

        sortedEmp = fondEmploy.sort( function (a,b) {
            if ( a.empName < b.empName ){
                return -1;
              }
              if ( a.empName > b.empName ){
                return 1;
              }
               return 0;
        })        

        if (brnEmployees.length === 0) {
            empCanProceed = true
        }

    if (empCanProceed)
        res.render('areas/employee', {
            areaCode: areaCode,
            fndEmploy: sortedEmp,
            searchOptions: req.query,
            yuser: _user
        })

} catch (err) {
        console.log(err)
        res.redirect('/')
    }
})


// New EMPLOYEE Route
router.get('/newEmployee/:id', authUser, authRole(ROLE.AM), async (req, res) => {
    
    const areaCode = req.params.id
    const _user = req.user
    let foundBranch = []

    try {

        // let foundBranch = await Branch.find({area: areaCode, emp_code: ""})

        const newEmpPost = await Branch.find({area: areaCode, emp_code: ""}, function (err, fndPost) {
            foundBranch = fndPost
           console.log(areaCode)
           const newEmp = new Employee()
           const newUser = new User()
   
            res.render('areas/newEmployee', { 
               emp: newEmp, 
               user: newUser,
               areaCode: areaCode,
               branchAsignDesc: "",
               foundBranch: foundBranch,
               yuser: _user,
               newEmp: true,
               resetPW: false
           })
       })
   
    } catch (err) {
        console.log(err)
        res.redirect('/')
    }
//    console.log(position)

})

// POST or Save new Employee
router.post('/postNewEmp/:id', authUser, authRole(ROLE.AM), async (req, res) => {
    const _user = req.user
   let eUnit
   let ePONum
   const empBranCod = req.body.branch
    const nEmpCode = _.trim(req.body.empCode)
    const nEmail = _.trim(req.body.email).toLowerCase()
    const nLName = _.trim(req.body.lName).toUpperCase()
    const nFName = _.trim(req.body.fName).toUpperCase()
    const nMName = _.trim(req.body.mName).toUpperCase()
    const nName =  nLName + ", " + nFName + " " + nMName
    const areaCod = req.params.id

    let branchMgrID = ""
    let fndPositi = posisyon

    fndPositi.forEach(fndPosii => {
        const fndPositionEmp = fndPosii.code
        const fndPositID = fndPosii.id
        if (fndPositionEmp === "BRN_MGR") {
            branchMgrID = fndPositID
        }
    })

let locals
//console.log(brnCode)
let getExistingUser = []
let canProceed = false
let UserProceed = false
let branchRegion = ""

try {

    const getRegCode = await Area.findOne({area: areaCod})
        branchRegion = getRegCode.region

    const branchEmployees = await Employee.find({position: branchMgrID})
    console.log(branchEmployees)

    const sameName = _.find(branchEmployees, {last_name: nLName, first_name: nFName, middle_name: nMName})

    const sameCode = _.find(branchEmployees, {emp_code: nEmpCode})

    const sameAssign = _.find(branchEmployees, {assign_code: empBranCod})
    console.log(sameAssign)

    if (branchEmployees) {
        if (sameName) {
            locals = {errorMessage: 'Employee Name: ' + nName + ' already exists!'}
            canProceed = false
        } else if (sameAssign) {
            locals = {errorMessage: 'Assign Code: ' + empBranCod + ' already exists!'}
            canProceed = false

          } else if (sameCode) {
                locals = {errorMessage: 'Employee Code: ' + nEmpCode + ' already exists!'}
                canProceed = false
            } else {
                canProceed = true
            }

    } else {
        canProceed = true
    }

        const hashedPassword = await bcrypt.hash(req.body.password, 10)
                
        getExistingUser = await User.findOne({email: nEmail})
            // console.log(foundUser)
            if (!getExistingUser) {
                    UserProceed = true 
            } else {
                    UserProceed = false
                    locals = {errorMessage: 'Username : ' + nEmail + ' already exists!'}
            }    
    
    if (canProceed && UserProceed)  {
            const poAssignCode = await Branch.findOneAndUpdate({"branch": empBranCod}, {$set:{"emp_code": nEmpCode}})

        addedNewUser = true
        
        let employee = new Employee({

            emp_code: nEmpCode,
            last_name: nLName,
            first_name: nFName,
            middle_name: nMName,
            position_code: branchMgrID,
            assign_code: empBranCod,
            branch: empBranCod,
            area: areaCod,
            region: branchRegion,
            unit: "N/A",
            po_number: "N/A"
        })
        
        const newCoa = employee.save()

        let nUser = new User({
            email: nEmail,
            password: hashedPassword,
            name: nName,
            emp_code: nEmpCode,
            assCode: empBranCod,
            role: 'BM',
            region: _user.region,
            area: req.params.id,
            branch: empBranCod
        })
        const saveUser = nUser.save()

        res.redirect('/areas/employees/'+ areaCod)
    } 
    else {
        let areaBranches = []
        const rePosition = await Area.find({area: areaCod}, function (err, fnd_Post) {
            areaBranches = fnd_Post
        })

        let errEmp = []
        let errUser = []

            errUser.push({email: nEmail, password: req.body.password})

            errEmp.push({emp_code: nEmpCode, branch: empBranCod, last_name: nLName, first_name: nFName, middle_name: nMName, position_code: branchMgrID})
            console.log(errEmp)

            res.render('areas/newEmployee', { 
                emp: errEmp, 
                user: errUser,
                foundBranch: areaBranches,
                areaCode: areaCod,
                yuser: _user,
                newEmp: true,
                resetPW: false,
                locals: locals
            })
}


} catch (err) {
    console.log(err)
   let locals = {errorMessage: 'Something WENT went wrong.'}
    res.redirect('/areas/employees/'+ areaCod)
}
})

// Get an Employee for EDIT
router.get('/getEmpForEdit/:id/edit', authUser, authRole(ROLE.AM), async (req, res) => {

    const parame = req.params.id // areaCode + emp_code
    const areaCode = parame.substr(0,3)
    const empCode = _.trim(parame.substr(3,10))

    areaCod = req.body.area

    console.log(empCode)
    const _user = req.user
    let locals = ""
    let foundEmploy = []
    let areaBranches = []
     
   try {
        let brnCod
        const emArea = await Branch.find({area: areaCode}, function (err, fnd_Post) {
            areaBranches = fnd_Post
        })
        console.log(areaBranches)

        const employe = await Employee.findOne({emp_code: empCode}, function (err, foundEmp) {
//            console.log(foundlist)
            foundEmploy = foundEmp
            brnCod = foundEmp.branch
        })
        // console.log(employe)
        const newUser = new User()

        res.render('areas/editEmployee', {
            areaCode: areaCode,
            foundBranch: areaBranches,
            user: newUser,
            emp: employe, 
            locals: locals,
            yuser: _user,
            newEmp: false,
            resetPW: false
       })

//        res.render('centers/edit', { centers: center, coaClass: coaClass })

   } catch (err) {
       console.log(err)
       res.redirect('/areas/employees/'+ areaCode)
   }
})

// SAVE EDITed Employee

router.put('/putEditedEmp/:id', authUser, authRole(ROLE.AM), async function(req, res){

    const paramsID = req.params.id
        console.log(paramsID)

    const areaCod = paramsID.substr(0,3)
    const empID = _.trim(paramsID.substr(3,45))

    const assCode = req.body.branch
    const brnCod = req.body.branch

    const eAssCode = assCode    

    const eCode = _.trim(req.body.empCode)
    const eLName = _.trim(req.body.lName).toUpperCase()
    const eFName = _.trim(req.body.fName).toUpperCase()
    const eMName = _.trim(req.body.mName).toUpperCase()
    const nName =  eLName + ", " + eFName + " " + eMName
        
        try {

            employee = await Employee.findById(empID)
            console.log(employee)

            employee.emp_code = eCode
            employee.last_name = eLName
            employee.first_name = eFName
            employee.middle_name = eMName
            employee.assign_code = eAssCode
            employee.area = areaCod
        
            await employee.save()
        
                const poAssignCode = await Branch.findOneAndUpdate({"branch": brnCod}, {$set:{"emp_code": eCode}})

                const userAssignCode = await User.findOneAndUpdate({"assCode": eAssCode}, {$set:{"name": nName, "emp_code": eCode, "region": req.user.region, "area": areaCod }})

                // const userAssignCode = await User.findOneAndUpdate({"area": areaCod}, {$set:{"name": nName}})

                res.redirect('/areas/employees/'+ areaCod)

        } catch (err) {
            console.log(err)
            let locals = {errorMessage: 'Something WENT went wrong.'}
            res.redirect('/areas/employees/'+ areaCod, {
            locals: locals
            })
        }
  
})

// GET Employee User for RESET PASSWORD
router.get('/getEmpEditPass/:id/edit', authUser, authRole(ROLE.AM), async (req, res) => {

    const parame = req.params.id // areaCode + emp_code
    const areaCode = parame.substr(0,3)
    const empCode = _.trim(parame.substr(3,10))


   const paramsID = req.params.id
        console.log(paramsID)
    const branCod = req.body.branCode
    const empID = req.params.id

    const _user = req.user
    let locals = ""
    let branAsignCode = ""
    let branAsignDesc = ""
    let foundEmploy = []
    let areaBranches = []
    
    let ass_Code = ""

   try {

        const employe = await Employee.findOne({emp_code: empCode}, function (err, foundEmp) {
//            console.log(foundlist)
            foundEmploy = foundEmp
            brnCod = foundEmp.branch
            possit = _.trim(foundEmploy.position_code)
           console.log(possit)
           branAsignCode = foundEmploy.assign_code
        })
        
        const emPosit = await Branch.findOne({branch: branAsignCode}, function (err, fndBranch) {
            branAsignDesc = fndBranch.branch_desc
            areaBranches = fndBranch
        })
    
            // console.log(employe)
        const yoser = await User.findOne({assCode: branAsignCode}, function (err, foundUser) {
            //            console.log(foundlist)
            fndUser = foundUser
            console.log(fndUser)
        })

        yoser.password = ""
            
        res.render('areas/resetPassword', {
            areaCode: areaCode,
            branchAsignDesc: branAsignDesc,
            foundBranch: areaBranches,
            user: yoser,
            emp: employe, 
            locals: locals,
            yuser: _user,
            newEmp: false,
            resetPW: true
       })

//        res.render('centers/edit', { centers: center, coaClass: coaClass })

   } catch (err) {
       console.log(err)
       res.redirect('employees/'+ areaCode)
   }
})

router.put('/putEditedPass/:id', authUser, authRole(ROLE.AM), async function(req, res){

    const paramsID = req.params.id // areaCode + areaCode

    const areaCod = paramsID.substr(0,3)
    // empID = req.params.id
    const branCod = _.trim(paramsID.substr(3,10))
    const newPassword = _.trim(req.body.password)
    const userID = req.body.user_id

    // let getExistingUser
    
        try {
            const hashdPassword = await bcrypt.hash(newPassword, 10)
            let getExistingUser = await User.findOne({assCode: branCod})

                getExistingUser.password = hashdPassword
                const savedNewPW = getExistingUser.save()
        
            res.redirect('/areas/employees/'+ areaCod)

        } catch (err) {
            console.log(err)
            let locals = {errorMessage: 'Something WENT went wrong.'}
            res.render('/areas/employees/'+ areaCod, {
            locals: locals
            })
        }
  
})

// GET Branches PER area
router.get('/setAreaBranchs/:id', authUser, authRole(ROLE.AM), async (req, res) => {

    const areaCod = req.params.id

    const poNumber = IDcode.substr(5,1)
    const unit_Code = IDcode.substr(0,5)
    const unitCode = IDcode.substr(4,1)
    const branchCode = IDcode.substr(0,3)
    const yuser = req.user

    console.log(IDcode)

    let foundBranch = []
    let fndCenter = []
    let doneReadCtr = false

    try {

        // const loanType = await Loan_type.find({})

        const regBranchs = await Area.find({area: areaCod}, function (err, foundBranchs) {
            foundBranch = foundBranchs
            doneReadCtr = true
        })

        if (regBranchs.length === 0) {
            doneReadCtr = true
        }
        
        if (doneReadCtr) {
            res.render('areas/branch', {
                areaCode: areaCod,
                Branchs: foundBranch,
                yuser: yuser
            })
        }
    } catch (err) {
        console.log(err)
        res.redirect('/areas/branch')
    }
})

//
router.get('/setNewBranch/:id', authUser, authRole(ROLE.AM), async (req, res) => {

    const yuser = req.user

    let foundBranchs = []
    
    let numBranchs = 0
    let doneReadPOs = false
    
    try {
        
        foundBranchs = await Area.find({})

            res.render('areas/setNewBranches', {
                fondBranchs: foundBranchs,
                numBranchs: numBranchs,
                uniCod: unitCode,
                lonType: loanType,
                searchOptions: req.query,
                yuser: yuser
            })
    } catch (err) {
        console.log(err)
        res.redirect('/areas/'+unitCode)
    }
})

// Get BRANCHES for Maintenance
router.get('/branches/:id', authUser, authRole(ROLE.AM), async (req, res) => {

    const areaCode = req.params.id
    const _user = req.user

    let foundBranch = []
    let sortedEmp = []
    let fndBranch = []
    let fndBranchs = []
    let sortedBranchs = []
    let doneReadarea = false

    let empName = []

    try {

        const fnd_branch = await Branch.find({area: areaCode}, function (err, fnd_Branchs) {
            fndBranch = fnd_Branchs
        })
        
        let fndEmployee = await Employee.find({area: areaCode})
        
    //            const fndEmployees = foundEmployees
    //            const empStatus = fndEmployees.status
        if (fndBranch.length === 0) {
            doneReadarea = true
        } else {
            fndBranch.forEach(fndBranchs =>{
                id = fndBranchs._id
                branchCode = fndBranchs.branch
                branchDesc = fndBranchs.branch_desc
                branchEmp = fndBranchs.emp_code

                // picked = lodash.filter(arr, { 'city': 'Amsterdam' } );
                empName = _.filter(fndEmployee, {'emp_code': branchEmp})

                if (empName.length === 0) {
                } else {
                    employeeName = empName.first_name + " " + _.trim(empName.middle_name).substr(0,1) + ". " + empName.last_name
                }
                foundBranch.push({id: id, areaCode: areaCode, branchCode: branchCode, branchDesc: branchDesc, emp_code: branchEmp, empName: empName})

                doneReadarea = true
            })

                console.log(foundBranch)
            
                sortedBranchs= foundBranch.sort( function (a,b) {
                    if ( a.branchCode < b.branchCode ){
                        return -1;
                    }
                    if ( a.branchCode > b.branchCode ){
                        return 1;
                    }
                    return 0;
                })
        }

        if (doneReadarea) {
            res.render('areas/branch', {
            areaCode: areaCode,
            fondBranchs: sortedBranchs,
            searchOptions: req.query,
            yuser: _user
            })
        }

    } catch (err) {
        console.log(err)
        res.redirect('/')
    }
})

//GET Branch
router.get('/newBranch/:id', authUser, authRole(ROLE.AM), async (req, res) => {
    const areaCod = req.params.id

    res.render('areas/newBranch', {
        areaCode: areaCod,
        branch: new Branch()
    })
})

router.post('/postNewBranch/:id', authUser, authRole(ROLE.AM), async (req, res) => {

    const areaCod = req.params.id
    let locals
    let canProceed = false
    const _user = req.user
    const branch_code = _.trim(req.body.branchCode).toUpperCase()
    const branch_desc = _.trim(req.body.branchDesc).toUpperCase()
    const branch_add = _.trim(req.body.branchAdd).toUpperCase()

    let branchareaCode = ""
    let fndBranch = [ ]
    let getBrnRegCod = []
    try {
        
        const getExisBranch = await Branch.findOne({branch: branch_code, area: areaCod}, function (err, foundBranch) {
            fndBranch = foundBranch
            if (isNull(fndBranch)) {
                let nBranch  = new Branch({

                    branch: branch_code,
                    branch_desc: branch_desc,
                    emp_code: "",
                    office_loc: "",
                    address: branch_add,
                    num_units: 0,
                    num_pos: 0,
                    num_centers: 0,
                    num_units_budg: 0,
                    num_pos_budg: 0,
                    num_centers_budg: 0,
                    area: areaCod,
                    region: _user.region,
                    status: "Active"
                })
            
                const saveUser = nBranch.save()
    
                res.redirect('/areas/branches/' + areaCod)
            } else {
                canProceed = false
                locals = {errorMessage: "Branch Code already exists!"}

                res.redirect('/areas/branches/' + areaCod)
            }
        })

    } catch (err) {
        console.log(err)
        res.redirect('/areas/branches/' + req.user.assCode)
    }
})  

 // Get a Branch for EDIT
 router.get('/getBranchForEdit/:id/edit', authUser, authRole(ROLE.AM), async (req, res) => {

    const parame = req.params.id // 'Area ' + region.id

    const areaCod = _.trim(parame.substr(0,3))
    const param = _.trim(parame.substr(3,50))

    const uUnit = req.body.uUnit
    const _user = req.user

    let fondBranch = []
    let branchID = ""

    try {

        const regForEdit = await Branch.findById(param)  
        branchID = regForEdit.id

        fondBranch = regForEdit
        console.log(fondBranch)

        res.render('areas/editBranch', { 
            branchID: branchID,
           branch: fondBranch, 
           areaCode: areaCod,
           yuser : _user
       })

    } catch (err) {
            console.log(err)
            let locals = {errorMessage: 'Something WENT went wrong.'}
            res.redirect('/areas/branches/'+ areaCod)
    }
})

// SAVE EDITed Branch

router.put('/putEditedBranch/:id', authUser, authRole(ROLE.AM), async function(req, res){

    const parame = req.params.id // areaCode + branch.id
    const paramsID = parame.substr(0,3)
    const param = _.trim(parame.substr(3,25))
    const branch_code = _.trim(req.body.branchCode).toUpperCase()
    const branch_desc = _.trim(req.body.branchDesc).toUpperCase()

    console.log(req.params.id)

    let branch
        try {

            branch = await Branch.findById(param)

            branch.branch = branch_code,
            branch.branch_desc = branch_desc
        
            await branch.save()
        
            res.redirect('/areas/branches/'+ paramsID)

        } catch (err) {
            console.log(err)
            let locals = {errorMessage: 'Something WENT went wrong.'}
            res.redirect('/areas/branches/'+ paramsID, {
            locals: locals
            })
        }
  
})

//
router.delete('/deleteBranch/:id', authUser, authRole(ROLE.AM), async (req, res) => {

    
    let regBranch

    try {
        regBranch = await Branch.findById(req.params.id)
        delAreaCode = regBranch.region
        await regBranch.remove()  
        res.redirect('/areas/areas/'+delAreaCode)
    } catch (err) {
        console.log(err)
    }
})

// View Unit per PO  - TUG-A
router.get('/unit/:id', authUser, authRole(ROLE.BM), async (req, res) => {
    
    const IDcode = req.params.id
    const _user = req.user

    const unitCode = IDcode.substr(4,1)
    const branchCode = IDcode.substr(0,3)
    const uniCode = IDcode.substr(0,4)
   
    console.log(IDcode)
    console.log(unitCode)
    console.log(uniCode)
   
    let foundCenter = []
    let foundAMBranches = []
    let foundPO = []
    let officerName = ""
      
       try {
           const employee = await Employee.find({branch: branchCode, unit: unitCode}, function (err, foundPOs){
               foundAMBranches = foundPOs
           })
   
           console.log(foundAMBranches)
   
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
           //console.log (foundAMBranches)
           let poNumber
           foundAMBranches.forEach(po_data => {
               
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
               console.log(foundPO)
   
               res.render('centers/unit', {
                   listTitle: branchCode+"-"+unitCode,
                   officerName: officerName,
                   POs: foundPO,
                   searchOptions: req.query,
                   yuser: _user
               })
   
       } 
       catch (err) {
           console.log(err)
       }
   })
   
   
// Edit Targets

//Save targets to Targets array field in center collection

router.put('/:id', authUser, authRole(ROLE.BM), async (req, res) => {
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

router.post('/delete', authUser, authRole(ROLE.BM), async (req, res) => {
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

router.delete('/deleteEmp/:id', authUser, authRole(ROLE.BM), async (req, res) => {

    const paramsID = req.params.id

    console.log(paramsID)
    branCod = paramsID.substr(0,3)
    // empID = req.params.id
    empID = _.trim(paramsID.substr(3,45))

    let empYee
    let empUser

    try {
        
        empYee = await Employee.findById(empID)
        const delBranCode = empYee.branch
        const assCod = empYee.assign_code

        await empYee.remove()  

        empUser = await User.findOne({assCode: assCod})

        await empUser.remove()

        res.redirect('/branches/employees/'+delBranCode)
        
    } catch (err) {
        console.log(err)
    }
})

// View AREA PROJECTED COLLECTIONS ROUTE
router.get('/viewAreaProjCol/:id', authUser, authRole(ROLE.AM), async (req, res) => {
    res.send('Ongoing development')
})

// View AREA PROJECTED COLLECTIONS ROUTE
router.get('/viewAreaProjInc/:id', authUser, authRole(ROLE.AM), async (req, res) => {

    const viewAreaCode = req.params.id
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

            const poBudgExecTotLonAmt = await Budg_exec_sum.findOne({area: viewAreaCode, view_code: "TotLoanAmt"}, function (err, fndTotLonAmt) {
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

                    console.log(poTotLoanAmtArray)

                    res.render('areas/viewAreaProjInc', {
                        vwAreaCod: viewAreaCode,
                        poSumView: poTotLoanAmtArray,
                        yuser: yuser
                    })
            
            })

    } catch (err) {
        console.log(err)
        res.redirect('/areas/'+ viewAreaCode)
    }
})

// View AREA Targets per month ROUTE
router.get('/viewAreaTargetMon/:id', authUser, authRole(ROLE.AM), async (req, res) => {

    const viewAreaCode = req.params.id
    const vwUnitCode = viewAreaCode
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

    let jan_newCtotValue = 0  
    let feb_newCtotValue = 0
    let mar_newCtotValue = 0
    let apr_newCtotValue = 0
    let may_newCtotValue = 0
    let jun_newCtotValue = 0
    let jul_newCtotValue = 0
    let aug_newCtotValue = 0
    let sep_newCtotValue = 0
    let oct_newCtotValue = 0
    let nov_newCtotValue = 0
    let dec_newCtotValue = 0
        let begBalOldClient = 0
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
            let tot_centerCount = 0
    let jan_newAtotValue = 0  
    let feb_newAtotValue = 0
    let mar_newAtotValue = 0
    let apr_newAtotValue = 0
    let may_newAtotValue = 0
    let jun_newAtotValue = 0
    let jul_newAtotValue = 0
    let aug_newAtotValue = 0
    let sep_newAtotValue = 0
    let oct_newAtotValue = 0
    let nov_newAtotValue = 0
    let dec_newAtotValue = 0
        let jan_oldAtotValue = 0  
        let feb_oldAtotValue = 0
        let mar_oldAtotValue = 0
        let apr_oldAtotValue = 0
        let may_oldAtotValue = 0
        let jun_oldAtotValue = 0
        let jul_oldAtotValue = 0
        let aug_oldAtotValue = 0
        let sep_oldAtotValue = 0
        let oct_oldAtotValue = 0
        let nov_oldAtotValue = 0
        let dec_oldAtotValue = 0

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

        let totTotAmtLoan = 0 

        let doneReadNLC = false
        let doneReadOLC = false
        let doneReadNLA = false
        let doneReadOLA = false
        let doneReadTotLonAmt = false

        let doneReadNLCli = false
        let doneReadOLCli = false
        let doneReadResCli = false
        let doneReadNewOldResCli = false

        let fndUnitBudgExecTotLonAmt = []
        let fndUnitBudgExecNumCenters = []

        let fndUnitBudgExecTotInc = []
        let fndUnitBuExTotProcFees = []

        poSumView = [ ]

        try {

        //  Pre-determine if items is already existed or saved in Budg_exec_sum Collection

        const poBudgExecNumCenters = await Budg_exec_sum.find({area: viewAreaCode, view_code: "NumberOfCenters"}, function (err, fndTotNumCenter) {
                fndUnitBudgExecNumCenters = fndTotNumCenter
                console.log(fndTotNumCenter)
                jan_centerCount = _.sumBy(fndTotNumCenter, function(o) { return o.jan_budg; })
                feb_centerCount = _.sumBy(fndTotNumCenter, function(o) { return o.feb_budg; })
                mar_centerCount = _.sumBy(fndTotNumCenter, function(o) { return o.mar_budg; })
                apr_centerCount = _.sumBy(fndTotNumCenter, function(o) { return o.apr_budg; })
                may_centerCount = _.sumBy(fndTotNumCenter, function(o) { return o.may_budg; })
                jun_centerCount = _.sumBy(fndTotNumCenter, function(o) { return o.jun_budg; })
                jul_centerCount = _.sumBy(fndTotNumCenter, function(o) { return o.jul_budg; })
                aug_centerCount = _.sumBy(fndTotNumCenter, function(o) { return o.aug_budg; })
                sep_centerCount = _.sumBy(fndTotNumCenter, function(o) { return o.sep_budg; })
                oct_centerCount = _.sumBy(fndTotNumCenter, function(o) { return o.oct_budg; })
                nov_centerCount = _.sumBy(fndTotNumCenter, function(o) { return o.nov_budg; })
                dec_centerCount = _.sumBy(fndTotNumCenter, function(o) { return o.dec_budg; })

                poSumView.push({title: "NUMBER OF CENTERS", sortkey: 2, group: 1, isTitle: false, beg_bal: centerCntBegBal, jan_value: jan_centerCount, feb_value: feb_centerCount, mar_value: mar_centerCount,
                    apr_value: apr_centerCount, may_value: may_centerCount, jun_value: jun_centerCount, jul_value: jul_centerCount, aug_value: aug_centerCount,
                    sep_value: sep_centerCount, oct_value: oct_centerCount, nov_value: nov_centerCount, dec_value: dec_centerCount, tot_value : dec_centerCount
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

                doneReadNumCenters = true
    
            })

            const poBudgExecTotLonAmt = await Budg_exec_sum.find({area: viewAreaCode, view_code: "TotLoanAmt"}, function (err, fndTotLonAmt) {
                fndUnitBudgExecTotLonAmt = fndTotLonAmt
                janTotAmtLoan = _.sumBy(fndTotLonAmt, function(o) { return o.jan_budg; })
                febTotAmtLoan = _.sumBy(fndTotLonAmt, function(o) { return o.feb_budg; })
                marTotAmtLoan = _.sumBy(fndTotLonAmt, function(o) { return o.mar_budg; })
                aprTotAmtLoan = _.sumBy(fndTotLonAmt, function(o) { return o.apr_budg; })
                mayTotAmtLoan = _.sumBy(fndTotLonAmt, function(o) { return o.may_budg; })
                junTotAmtLoan = _.sumBy(fndTotLonAmt, function(o) { return o.jun_budg; })
                julTotAmtLoan = _.sumBy(fndTotLonAmt, function(o) { return o.jul_budg; })
                augTotAmtLoan = _.sumBy(fndTotLonAmt, function(o) { return o.aug_budg; })
                sepTotAmtLoan = _.sumBy(fndTotLonAmt, function(o) { return o.sep_budg; })
                octTotAmtLoan = _.sumBy(fndTotLonAmt, function(o) { return o.oct_budg; })
                novTotAmtLoan = _.sumBy(fndTotLonAmt, function(o) { return o.nov_budg; })
                decTotAmtLoan = _.sumBy(fndTotLonAmt, function(o) { return o.dec_budg; })

                totTotAmtLoan = janTotAmtLoan + febTotAmtLoan + marTotAmtLoan + aprTotAmtLoan + mayTotAmtLoan + junTotAmtLoan + julTotAmtLoan + augTotAmtLoan +
                    sepTotAmtLoan + octTotAmtLoan + novTotAmtLoan + decTotAmtLoan

                poSumView.push({title: "TOTAL AMOUNT OF LOAN", sortkey: 15, group: 2, jan_value : janTotAmtLoan, feb_value : febTotAmtLoan, mar_value : marTotAmtLoan, 
                    apr_value : aprTotAmtLoan, may_value : mayTotAmtLoan, jun_value : junTotAmtLoan, jul_value : julTotAmtLoan, 
                    aug_value : augTotAmtLoan, sep_value : sepTotAmtLoan, oct_value : octTotAmtLoan, nov_value : novTotAmtLoan, dec_value : decTotAmtLoan, tot_value : totTotAmtLoan
                })

                doneReadTotLonAmt = true
            })

            const poBudgExecTotIncAmt = await Budg_exec_sum.find({area: viewAreaCode, view_code: "TotProjInc"}, function (err, fndTotIncAmt) {
                fndUnitBudgExecTotInc = fndTotIncAmt
                jan_totIntAmt = _.sumBy(fndTotIncAmt, function(o) { return o.jan_budg; })
                feb_totIntAmt = _.sumBy(fndTotIncAmt, function(o) { return o.feb_budg; })
                mar_totIntAmt = _.sumBy(fndTotIncAmt, function(o) { return o.mar_budg; })
                apr_totIntAmt = _.sumBy(fndTotIncAmt, function(o) { return o.apr_budg; })
                may_totIntAmt = _.sumBy(fndTotIncAmt, function(o) { return o.may_budg; })
                jun_totIntAmt = _.sumBy(fndTotIncAmt, function(o) { return o.jun_budg; })
                jul_totIntAmt = _.sumBy(fndTotIncAmt, function(o) { return o.jul_budg; })
                aug_totIntAmt = _.sumBy(fndTotIncAmt, function(o) { return o.aug_budg; })
                sep_totIntAmt = _.sumBy(fndTotIncAmt, function(o) { return o.sep_budg; })
                oct_totIntAmt = _.sumBy(fndTotIncAmt, function(o) { return o.oct_budg; })
                nov_totIntAmt = _.sumBy(fndTotIncAmt, function(o) { return o.nov_budg; })
                dec_totIntAmt = _.sumBy(fndTotIncAmt, function(o) { return o.dec_budg; })

                let nloanTotIntAmt = jan_totIntAmt + feb_totIntAmt + mar_totIntAmt + apr_totIntAmt + may_totIntAmt + jun_totIntAmt
                + jul_totIntAmt + aug_totIntAmt + sep_totIntAmt + oct_totIntAmt + nov_totIntAmt + dec_totIntAmt

              if (nloanTotIntAmt > 0) {
                  poSumView.push({title: "Loan Fees", desc: "Loan Fees", sortkey: 26, group: 1, jan_value : jan_totIntAmt, feb_value : feb_totIntAmt, mar_value : mar_totIntAmt, apr_value : apr_totIntAmt,
                      may_value : may_totIntAmt, jun_value : jun_totIntAmt, jul_value : jul_totIntAmt, aug_value : aug_totIntAmt,
                      sep_value : sep_totIntAmt, oct_value : oct_totIntAmt, nov_value : nov_totIntAmt, dec_value : dec_totIntAmt, tot_value:  nloanTotIntAmt
                  })         
              }

            })

            const fndUnitBuExTotProcFeeAmt = await Budg_exec_sum.find({area: viewAreaCode, view_code: "TotProcFee"}, function (err, fndTotProcFeeAmt) {
                fndUnitBuExTotProcFees = fndTotProcFeeAmt
                janProcFeeAmt = _.sumBy(fndTotProcFeeAmt, function(o) { return o.jan_budg; })
                febProcFeeAmt = _.sumBy(fndTotProcFeeAmt, function(o) { return o.feb_budg; })
                marProcFeeAmt = _.sumBy(fndTotProcFeeAmt, function(o) { return o.mar_budg; })
                aprProcFeeAmt = _.sumBy(fndTotProcFeeAmt, function(o) { return o.apr_budg; })
                mayProcFeeAmt = _.sumBy(fndTotProcFeeAmt, function(o) { return o.may_budg; })
                junProcFeeAmt = _.sumBy(fndTotProcFeeAmt, function(o) { return o.jun_budg; })
                julProcFeeAmt = _.sumBy(fndTotProcFeeAmt, function(o) { return o.jul_budg; })
                augProcFeeAmt = _.sumBy(fndTotProcFeeAmt, function(o) { return o.aug_budg; })
                sepProcFeeAmt = _.sumBy(fndTotProcFeeAmt, function(o) { return o.sep_budg; })
                octProcFeeAmt = _.sumBy(fndTotProcFeeAmt, function(o) { return o.oct_budg; })
                novProcFeeAmt = _.sumBy(fndTotProcFeeAmt, function(o) { return o.nov_budg; })
                decProcFeeAmt = _.sumBy(fndTotProcFeeAmt, function(o) { return o.dec_budg; })


                let nloanTotProcFeeAmt = janProcFeeAmt + febProcFeeAmt + marProcFeeAmt + aprProcFeeAmt + mayProcFeeAmt + junProcFeeAmt
                     + julProcFeeAmt + augProcFeeAmt + sepProcFeeAmt + octProcFeeAmt + novProcFeeAmt + decProcFeeAmt

                  poSumView.push({title: "Processing Fees", desc: "Processing Fees", sortkey: 27, group: 1, jan_value : janProcFeeAmt, feb_value : febProcFeeAmt, mar_value : marProcFeeAmt, apr_value : aprProcFeeAmt,
                      may_value : mayProcFeeAmt, jun_value : junProcFeeAmt, jul_value : julProcFeeAmt, aug_value : augProcFeeAmt,
                      sep_value : sepProcFeeAmt, oct_value : octProcFeeAmt, nov_value : novProcFeeAmt, dec_value : decProcFeeAmt, tot_value : nloanTotProcFeeAmt
                  })         

      })
            // console.log(poBudgExecTotLonAmt)

        poSumView.push({title: "CENTERS", sortkey: 1, group: 1, isTitle: true})

        poSumView.push({title: "CLIENTS", sortkey: 3, group: 2, isTitle: true})


        const newClientCntView = await Budg_exec_sum.find({area: viewAreaCode, view_code: "NewClients"}, function (err, fndNewCliCnt) {
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

        const oldClientCntView = await Budg_exec_sum.find({area: viewAreaCode, view_code: "NumReLoanCli"}, function (err, fndOldCliCnt) {

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

            poSumView.push({title: "Number of Reloan", sortkey: 10, group: 1, beg_bal: begBalOldClient, jan_value : jan_oldCliTot, feb_value : feb_oldCliTot, mar_value : mar_oldCliTot, apr_value : apr_oldCliTot,
                may_value : may_oldCliTot, jun_value : jun_oldCliTot, jul_value : jul_oldCliTot, aug_value : aug_oldCliTot,
                sep_value : sep_oldCliTot, oct_value : oct_oldCliTot, nov_value : nov_oldCliTot, dec_value : dec_oldCliTot, tot_value : olTotValueClient
            }) 

             doneReadOLC = true
        }) //, function (err, fndPOV) {

        const resClientCntView = await Budg_exec_sum.find({area: viewAreaCode, view_code: "ResignClients"}, function (err, fndResCliCnt) {

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
                    
            doneReadResCli = true

        }) //, function (err, fndPOV) {

    if (doneReadNLCli && doneReadOLC && doneReadResCli) {

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

        poSumView.push({title: "Old Clients", sortkey: 5, group: 2, beg_bal: begBalOldClient, jan_value : jan_oldCliTot, feb_value : feb_oldCliTot, mar_value : mar_oldCliTot, apr_value : apr_oldCliTot,
            may_value : may_oldCliTot, jun_value : jun_oldCliTot, jul_value : jul_oldCliTot, aug_value : aug_oldCliTot,
            sep_value : sep_oldCliTot, oct_value : oct_oldCliTot, nov_value : nov_oldCliTot, dec_value : dec_oldCliTot, tot_value : dec_totNumClients
       }) 

       poSumView.push({title: "Resign Clients", sortkey: 6, group: 2, jan_value : jan_resCliTot, feb_value : feb_resCliTot, mar_value : mar_resCliTot, apr_value : apr_resCliTot,
           may_value : may_resCliTot, jun_value : jun_resCliTot, jul_value : jul_resCliTot, aug_value : aug_resCliTot,
           sep_value : sep_resCliTot, oct_value : oct_resCliTot, nov_value : nov_resCliTot, dec_value : dec_resCliTot, tot_value : dec_resCliTot
       }) 
       doneReadNewOldResCli = true
    }

        poSumView.push({title: "NUMBER OF LOANS", sortkey: 8, group: 1, isTitle: true})

        const newLoanClientView = await Budg_exec_sum.find({area: viewAreaCode, view_code: "NumNewLoanCli"}, function (err, fndNewCli) {
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

            let jan_totNoOfLoan = jan_oldCliTot + jan_newCtotValue
            let feb_totNoOfLoan = feb_oldCliTot + feb_newCtotValue
            let mar_totNoOfLoan = mar_oldCliTot + mar_newCtotValue
            let apr_totNoOfLoan = apr_oldCliTot + apr_newCtotValue
            let may_totNoOfLoan = may_oldCliTot + may_newCtotValue
            let jun_totNoOfLoan = jun_oldCliTot + jun_newCtotValue
            let jul_totNoOfLoan = jul_oldCliTot + jul_newCtotValue
            let aug_totNoOfLoan = aug_oldCliTot + aug_newCtotValue
            let sep_totNoOfLoan = sep_oldCliTot + sep_newCtotValue
            let oct_totNoOfLoan = oct_oldCliTot + oct_newCtotValue
            let nov_totNoOfLoan = nov_oldCliTot + nov_newCtotValue
            let dec_totNoOfLoan = dec_oldCliTot + dec_newCtotValue

            if (doneReadNLC && doneReadOLC) {
                let tot_totNoOfLoan = jan_totNoOfLoan + feb_totNoOfLoan + mar_totNoOfLoan + apr_totNoOfLoan + may_totNoOfLoan + jun_totNoOfLoan + jul_totNoOfLoan +
                        aug_totNoOfLoan + sep_totNoOfLoan + oct_totNoOfLoan + nov_totNoOfLoan + dec_totNoOfLoan

                poSumView.push({title: "TOTAL NO. OF LOAN", sortkey: 11, group: 1, jan_value : jan_totNoOfLoan, feb_value : feb_totNoOfLoan, mar_value : mar_totNoOfLoan, 
                    apr_value : apr_totNoOfLoan, may_value : may_totNoOfLoan, jun_value : jun_totNoOfLoan, jul_value : jul_totNoOfLoan, aug_value : aug_totNoOfLoan,
                    sep_value : sep_totNoOfLoan, oct_value : oct_totNoOfLoan, nov_value : nov_totNoOfLoan, dec_value : dec_totNoOfLoan, tot_value: tot_totNoOfLoan
               }) 
            }

        poSumView.push({title: "AMOUNT OF LOANS", sortkey: 12, group: 2, isTitle: true})


        const newLoanAmtView = await Budg_exec_sum.find({area: viewAreaCode, view_code: "NewLoanAmount"}, function (err, fndNewAmt) {

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

        const oldLoanAmtView = await Budg_exec_sum.find({area: viewAreaCode, view_code: "ReLoanAmount"}, function (err, fndOldAmt) {

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

            // let totTotAmtLoan = 0
        let runTotWklyCBUAmt = 0 
        let doneReadForCBU = false

        if (doneReadTotLonAmt && doneReadNLA && doneReadOLA) {
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
                    aug_value : aug_totColAmt, sep_value : sep_totColAmt, oct_value : oct_totColAmt, nov_value : nov_totColAmt, dec_value : dec_totColAmt, tot_value: dec_totColAmt
                
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
                    aug_value : aug_cbuBalFromPrevMo, sep_value : sep_cbuBalFromPrevMo, oct_value : oct_cbuBalFromPrevMo, nov_value : nov_cbuBalFromPrevMo, dec_value : dec_cbuBalFromPrevMo, tot_value: dec_totMonthCBU
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
            let totRunBalPrevMon = decRunBalAmt 
            
            poSumView.push({title: "BAL. FROM PREV. MONTH", sortkey: 17, group: 1, jan_value : janRunBalPrevMon, feb_value : febRunBalPrevMon, mar_value : marRunBalPrevMon, 
                apr_value : aprRunBalPrevMon, may_value : mayRunBalPrevMon, jun_value : junRunBalPrevMon, jul_value : julRunBalPrevMon, 
                aug_value : augRunBalPrevMon, sep_value : sepRunBalPrevMon, oct_value : octRunBalPrevMon, nov_value : novRunBalPrevMon, dec_value : decRunBalPrevMon, tot_value: totRunBalPrevMon
            
            })
            doneReadForCBU = true
        }
    
                    poSumView.push({title: "CAPITAL BUILD-UP", sortkey: 19, group: 2, isTitle: true})

                    poSumView.push({title: "INCOME", sortkey: 25, group: 1, isTitle: true})
                    

            poSumView.sort( function (a,b) {
                if ( a.sortkey < b.sortkey ){
                    return -1;
                }
                if ( a.sortkey > b.sortkey ){
                    return 1;
                }
                return 0;
            })
        if (doneReadForCBU && doneReadNewOldResCli) { 
            // res.json(poSumView)

            res.render('areas/viewAreaTargetMon', {
                vwAreaCod: viewAreaCode,
                poSumView: poSumView,
                yuser: yuser   
            })
        }
    } catch (err) {
        console.log(err)
        res.redirect('/areas/'+ viewAreaCode)
    }
})

    router.get('/exportToExcel/:id', authUser, authRole(ROLE.AM), (req,res) => {

                    // let dataForExcel = []
                    // dataForExcel = poSumView

                    const dataForExcel = poSumView.map(unitExecSum => {
                        return [unitExecSum.title, unitExecSum.beg_bal, unitExecSum.jan_value, unitExecSum.feb_value, unitExecSum.mar_value,
                            unitExecSum.apr_value, unitExecSum.may_value, unitExecSum.jun_value, unitExecSum.jul_value, unitExecSum.aug_value,
                            unitExecSum.sep_value, unitExecSum.oct_value, unitExecSum.nov_value, unitExecSum.dec_value, unitExecSum.tot_value]
                    });
                
                    console.log(dataForExcel)
                
                    let workbook = new excel.Workbook();
                    let worksheet = workbook.addWorksheet("Area_Exec_Sum");
                
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
                      "attachment; filename=" + "Area_exec_Sum.xlsx"
                    );
                
                    workbook.xlsx.write(res).then(function () {
                      res.status(200).end()
                    })
                
})
                
                

module.exports = router
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
       


