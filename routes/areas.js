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
const Setting = require('../models/setting')

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
let LonType = []
let AreaEmp = []
// let budgetYear = ""

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
   
    const budget_Year = await Setting.find({})

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

    budgetYear = budget_Year[0].budget_year

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

        ctrResBudgDet = await Center_budget_det.find({area: areaCode, view_code: "ResClientCount"})

        LonType = await Loan_type.find({})

        const center = await Center.find({area: areaCode}) //, function (err, foundCenters) {
//        const center = await Center.find(searchOptions)
            if (center.length === 0) {
                doneReadCenter = true
            
            } else {

                newClients = _.sumBy(center, function(o) { return o.newClient; });
                nClientAmt = _.sumBy(center, function(o) { return o.newClientAmt; });
                oClient = _.sumBy(center, function(o) { return o.oldClient; });
                oClientAmt = _.sumBy(center, function(o) { return o.oldClientAmt; });
                // rClient = _.sumBy(center, function(o) { return o.resClient; });
                rClient2 = _.sumBy(center, function(o) { return o.resClient2; });
                budgBegBal = _.sumBy(center, function(o) { return o.budget_BegBal; });
                budgEndBal = oClient + newClients 
                totDisburse = nClientAmt + oClientAmt
                // tbudgEndBal = (budgBegBal + newClients) - (rClient + rClient2)

                foundCenter = center.sort()

                doneReadCenter = true   
            }

            totCenters = foundCenter.length
            console.log(foundAreaBranches)
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
    
        LonType.forEach(loan_type => {
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
            // if (typeLoan === "Individual Loan" && brn_Code === "TUG") {
            //     const typeOfLoan = typeLoan
            // }

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

            if (!isNull(ctrResBudgDet)) {
                ctrResBudgDet.forEach(fndResCli => {
                    if (fndResCli.loan_type === typeLoan  && fndResCli.branch === brn_Code) {
                        const totalResCnt = fndResCli.jan_budg + fndResCli.feb_budg + fndResCli.mar_budg + fndResCli.apr_budg + fndResCli.may_budg + fndResCli.jun_budg + 
                            fndResCli.jul_budg + fndResCli.aug_budg + fndResCli.sep_budg + fndResCli.oct_budg + fndResCli.nov_budg + fndResCli.dec_budg 
    
                        resloanTot = resloanTot + totalResCnt
    
                        rClient = rClient + totalResCnt
                    }
                })
            }


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
// LOOP for getting Different Loan products totals in the branch
    let gtBegBalClient = 0
    let gtBegBalAmt = 0

    LonType.forEach(loan_type => {
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
                rClient: rClient, budgBegBal: budgBegBal, budgEndBal: tbudgEndBal, totalDisburse: totDisburse, budBegBalAmt: gtBegBalAmt, budBegBalClient: gtBegBalClient})

            // console.log(totDisburse)

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

    let newClients = 0
    let nClientAmt = 0
    let oClient = 0
    let oClientAmt = 0
    let rClient = 0
    let rClient1 = 0
    let rClient2 = 0
    let budgEndBal = 0
    let totBudgEndBal = 0
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
    let doneFoundPO = false

    // console.log(fndPositi)
   
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

    // console.log(postAreaMgr)
    try {

        const center = await Center.find({area: areaCode}, function (err, fndCenters) {
            //        const center = await Center.find(searchOptions)
                    foundCenter = fndCenters.sort()

                    fndCenters.forEach( fndCtr => {
                        newClients = newClients + fndCtr.newClient
                        nClientAmt = nClientAmt + fndCtr.newClientAmt
                        oClient = oClient + fndCtr.oldClient
                        oClientAmt = oClientAmt + fndCtr.oldClientAmt
                        rClient1 = rClient1 + fndCtr.resClient
                        rClient2 = rClient2 + fndCtr.resClient2
                        budgBegBal = budgBegBal + fndCtr.budget_BegBalCli
                
                    })
            
                    totDisburse = nClientAmt + oClientAmt
                    tbudgEndBal = (budgBegBal + newClients) - (rClient1 + rClient2)
                            
                    doneReadCenter = true   
        })
            
            
        const areaManager = await Employee.find({area: areaCode}) 
            // foundBranchMgr = foundBMs

        if (!isNull(areaManager)) {
            areaManager.forEach( foundAMs =>{
                const positCode = _.trim(foundAMs.position_code)

                if (positCode === postAreaMgr) {
                    officerName = foundAMs.first_name + " " + foundAMs.middle_name.substr(0,1) + ". " + foundAMs.last_name
                }
    
                if (positCode === branchMgrID) {
                    foundAMBranches.push({branch: foundAMs.branch, last_name: foundAMs.last_name, first_name: foundAMs.first_name, middle_name: foundAMs.middle_name, 
                        assign_code: foundAMs.assign_code, position_code : positCode})
                }
    
            })

            doneFoundMgr = true 

        }
        
        //    if (areaManager) {
        //         areaManager.forEach(manager => {
        //             officerName = manager.first_name + " " + manager.middle_name.substr(0,1) + ". " + manager.last_name
        //         })
        //     } 
        // const branMgrs = await Employee.find({area: areaCode, position_code: postManager}, function (err, foundUHs){
        //     foundAMBranches = foundUHs
        //     doneFoundMgr = true
        //     })

            if (isNull(center)) {
                doneReadCenter = true
            
            } else {

            }

        // console.log(newClients)
        console.log(foundAMBranches)

        if (doneReadCenter && doneFoundMgr) {

            foundAMBranches.forEach(am => {   // to get Budget Breakdown per Manager

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
            
                LonType.forEach(loan_type => {
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
                        //  let centerLoanBegBal = center.Loan_beg_bal                
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
                                        // resloanTot = resloanTot + resignClient
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

                    if (!isNull(ctrResBudgDet)) {
                        ctrResBudgDet.forEach(fndResCli => {
                            if (fndResCli.loan_type === typeLoan  && fndResCli.branch === br_Cod) {
                                const totalResCnt = fndResCli.jan_budg + fndResCli.feb_budg + fndResCli.mar_budg + fndResCli.apr_budg + fndResCli.may_budg + fndResCli.jun_budg + 
                                    fndResCli.jul_budg + fndResCli.aug_budg + fndResCli.sep_budg + fndResCli.oct_budg + fndResCli.nov_budg + fndResCli.dec_budg 
            
                                resloanTot = resloanTot + totalResCnt
            
                                rClient = rClient + totalResCnt
                            }
                        })
                    }
        
        
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
        
            console.log(unitLoanTotals)
        
        // LOOP for getting Different Loan products totals in the branch
            let gtBegBalClient = 0
            let gtBegBalAmt = 0
        
            LonType.forEach(loan_type => {
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
            totBudgEndBal = (gtBegBalClient + oClient + newClients) - rClient

            brnLoanGrandTot.push({nClient: newClients, nClientAmt: nClientAmt, oClient: oClient, oClientAmt: oClientAmt, 
                rClient: rClient, budgBegBal: budgBegBal, budgEndBal: totBudgEndBal, totalDisburse: totDisburse, budBegBalAmt: gtBegBalAmt, budBegBalClient: gtBegBalClient})

            // console.log(brnLoanGrandTot)

        if (doneFoundPO && doneReadLonTyp) {
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
    let empStat = ""
    let empSortKey = ""
    let empPst
    let empAssign = ""
    let empID = ""
    let empUnit = ""

    const empStatus = ["Active","Deactivate"]

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
                empStat = foundEmp.status
                let exist = false
//                console.log(empID)
                // console.log(empPst)

                empAssign = _.find(branches, {branch: empAss})

                    fondEmploy.push({empID: empID, area: areaCode, empName: empName, empCode: empCode, empPostCode: empPostCode, empPost: empAssign.branch_desc, empStat: empStat})
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
            empStatus: empStatus,
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
            po_number: "N/A",
            status: "Active"
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
    const brnStatus = ["Active","Deactivate"]

    
    try {
        
        foundBranchs = await Area.find({})

            res.render('areas/setNewBranches', {
                fondBranchs: foundBranchs,
                brnStatus: brnStatus,
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
    let branchStat = ""
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
                branchStat = fndBranch.status

                // picked = lodash.filter(arr, { 'city': 'Amsterdam' } );
                empName = _.filter(fndEmployee, {'emp_code': branchEmp})

                if (empName.length === 0) {
                } else {
                    employeeName = empName.first_name + " " + _.trim(empName.middle_name).substr(0,1) + ". " + empName.last_name
                }
                foundBranch.push({id: id, areaCode: areaCode, branchCode: branchCode, branchDesc: branchDesc, emp_code: branchEmp, empName: empName, branchStat: branchStat})

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
    const brnStatus = ["Active","Deactivate"]

    res.render('areas/newBranch', {
        areaCode: areaCod,
        branch: new Branch(),
        brnStatus: brnStatus
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
    const branch_status = req.body.brnStat

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
    const brnStatus = ["Active","Deactivate"]

    try {

        const regForEdit = await Branch.findById(param)  
        branchID = regForEdit.id
        
        fondBranch = regForEdit
        console.log(fondBranch)

        res.render('areas/editBranch', { 
            branchID: branchID,
            brnStatus: brnStatus,
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
    const branch_status = req.body.brnStat

    console.log(req.params.id)

    let branch
        try {

            branch = await Branch.findById(param)

            branch.branch = branch_code
            branch.branch_desc = branch_desc
            branch.status = branch_status
        
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
    const areaBudgExecViews = await Budg_exec_sum.find({area: viewAreaCode})

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
    
        let jan_newCliTot = 0
        let feb_newCliTot = 0
        let mar_newCliTot = 0
        let apr_newCliTot = 0
        let may_newCliTot = 0
        let jun_newCliTot = 0
        let jul_newCliTot = 0
        let aug_newCliTot = 0
        let sep_newCliTot = 0
        let oct_newCliTot = 0
        let nov_newCliTot = 0
        let dec_newCliTot = 0
    
        let jan_oldCliTot = 0
        let feb_oldCliTot = 0
        let mar_oldCliTot = 0
        let apr_oldCliTot = 0
        let may_oldCliTot = 0
        let jun_oldCliTot = 0
        let jul_oldCliTot = 0
        let aug_oldCliTot = 0
        let sep_oldCliTot = 0
        let oct_oldCliTot = 0
        let nov_oldCliTot = 0
        let dec_oldCliTot = 0
    
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
    
            let jan_reLoanCliTot = 0
            let feb_reLoanCliTot = 0
            let mar_reLoanCliTot = 0
            let apr_reLoanCliTot = 0
            let may_reLoanCliTot = 0
            let jun_reLoanCliTot = 0
            let jul_reLoanCliTot = 0
            let aug_reLoanCliTot = 0
            let sep_reLoanCliTot = 0
            let oct_reLoanCliTot = 0
            let nov_reLoanCliTot = 0
            let dec_reLoanCliTot = 0
        
            let jan_totNumClients = 0
            let feb_totNumClients = 0
            let mar_totNumClients = 0
            let apr_totNumClients = 0
            let may_totNumClients = 0
            let jun_totNumClients = 0
            let jul_totNumClients = 0
            let aug_totNumClients = 0
            let sep_totNumClients = 0
            let oct_totNumClients = 0
            let nov_totNumClients = 0
            let dec_totNumClients = 0
            
            let jan_resCliTot = 0
            let feb_resCliTot = 0
            let mar_resCliTot = 0
            let apr_resCliTot = 0
            let may_resCliTot = 0
            let jun_resCliTot = 0
            let jul_resCliTot = 0
            let aug_resCliTot = 0
            let sep_resCliTot = 0
            let oct_resCliTot = 0
            let nov_resCliTot = 0
            let dec_resCliTot = 0
    
            let janProcFeeAmt = 0
            let febProcFeeAmt = 0
            let marProcFeeAmt = 0 
            let aprProcFeeAmt = 0
            let mayProcFeeAmt = 0
            let junProcFeeAmt = 0
            let julProcFeeAmt = 0
            let augProcFeeAmt = 0
            let sepProcFeeAmt = 0
            let octProcFeeAmt = 0
            let novProcFeeAmt = 0
            let decProcFeeAmt = 0

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


            if (!isNull(areaBudgExecViews)) {

                areaBudgExecViews.forEach( TotNumCenter => { 
                    const areaVwCode = TotNumCenter.view_code

                    switch(areaVwCode) {
                        case "NumberOfCenters":

                            centerCntBegBal = centerCntBegBal + TotNumCenter.beg_bal
                            jan_centerCount = jan_centerCount + TotNumCenter.jan_budg
                            feb_centerCount = feb_centerCount + TotNumCenter.feb_budg
                            mar_centerCount = mar_centerCount + TotNumCenter.mar_budg
                            apr_centerCount = apr_centerCount + TotNumCenter.apr_budg
                            may_centerCount = may_centerCount + TotNumCenter.may_budg
                            jun_centerCount = jun_centerCount + TotNumCenter.jun_budg
                            jul_centerCount = jul_centerCount + TotNumCenter.jul_budg
                            aug_centerCount = aug_centerCount + TotNumCenter.aug_budg
                            sep_centerCount = sep_centerCount + TotNumCenter.sep_budg
                            oct_centerCount = oct_centerCount + TotNumCenter.oct_budg
                            nov_centerCount = nov_centerCount + TotNumCenter.nov_budg
                            dec_centerCount = dec_centerCount + TotNumCenter.dec_budg
                            
                            break;
                        
                        case "TotLoanAmt":
                            
                            janTotAmtLoan = janTotAmtLoan + TotNumCenter.jan_budg
                            febTotAmtLoan = febTotAmtLoan + TotNumCenter.feb_budg
                            marTotAmtLoan = marTotAmtLoan + TotNumCenter.mar_budg
                            aprTotAmtLoan = aprTotAmtLoan + TotNumCenter.apr_budg
                            mayTotAmtLoan = mayTotAmtLoan + TotNumCenter.may_budg
                            junTotAmtLoan = junTotAmtLoan + TotNumCenter.jun_budg
                            julTotAmtLoan = julTotAmtLoan + TotNumCenter.jul_budg
                            augTotAmtLoan = augTotAmtLoan + TotNumCenter.aug_budg
                            sepTotAmtLoan = sepTotAmtLoan + TotNumCenter.sep_budg
                            octTotAmtLoan = octTotAmtLoan + TotNumCenter.oct_budg
                            novTotAmtLoan = novTotAmtLoan + TotNumCenter.nov_budg
                            decTotAmtLoan = decTotAmtLoan + TotNumCenter.dec_budg
                                break;
                                
                        case "NewClients":
                            
                            jan_newCliTot = jan_newCliTot + TotNumCenter.jan_budg
                            feb_newCliTot = feb_newCliTot + TotNumCenter.feb_budg
                            mar_newCliTot = mar_newCliTot + TotNumCenter.mar_budg
                            apr_newCliTot = apr_newCliTot + TotNumCenter.apr_budg
                            may_newCliTot = may_newCliTot + TotNumCenter.may_budg
                            jun_newCliTot = jun_newCliTot + TotNumCenter.jun_budg
                            jul_newCliTot = jul_newCliTot + TotNumCenter.jul_budg
                            aug_newCliTot = aug_newCliTot + TotNumCenter.aug_budg
                            sep_newCliTot = sep_newCliTot + TotNumCenter.sep_budg
                            oct_newCliTot = oct_newCliTot + TotNumCenter.oct_budg
                            nov_newCliTot = nov_newCliTot + TotNumCenter.nov_budg
                            dec_newCliTot = dec_newCliTot + TotNumCenter.dec_budg
                            break;

                        case "NumReLoanCli":
                            begBalOldClient = begBalOldClient + TotNumCenter.beg_bal
                            jan_oldCliTot = jan_oldCliTot + TotNumCenter.jan_budg
                            feb_oldCliTot = feb_oldCliTot + TotNumCenter.feb_budg
                            mar_oldCliTot = mar_oldCliTot + TotNumCenter.mar_budg
                            apr_oldCliTot = apr_oldCliTot + TotNumCenter.apr_budg
                            may_oldCliTot = may_oldCliTot + TotNumCenter.may_budg
                            jun_oldCliTot = jun_oldCliTot + TotNumCenter.jun_budg
                            jul_oldCliTot = jul_oldCliTot + TotNumCenter.jul_budg
                            aug_oldCliTot = aug_oldCliTot + TotNumCenter.aug_budg
                            sep_oldCliTot = sep_oldCliTot + TotNumCenter.sep_budg
                            oct_oldCliTot = oct_oldCliTot + TotNumCenter.oct_budg
                            nov_oldCliTot = nov_oldCliTot + TotNumCenter.nov_budg
                            dec_oldCliTot = dec_oldCliTot + TotNumCenter.dec_budg
                            break;
                        
                        case "NumNewLoanCli":

                            jan_newCtotValue =  jan_newCtotValue + TotNumCenter.jan_budg 
                            feb_newCtotValue =  feb_newCtotValue + TotNumCenter.feb_budg 
                            mar_newCtotValue =  mar_newCtotValue + TotNumCenter.mar_budg 
                            apr_newCtotValue =  apr_newCtotValue + TotNumCenter.apr_budg 
                            may_newCtotValue =  may_newCtotValue + TotNumCenter.may_budg 
                            jun_newCtotValue =  jun_newCtotValue + TotNumCenter.jun_budg 
                            jul_newCtotValue =  jul_newCtotValue + TotNumCenter.jul_budg 
                            aug_newCtotValue =  aug_newCtotValue + TotNumCenter.aug_budg 
                            sep_newCtotValue =  sep_newCtotValue + TotNumCenter.sep_budg 
                            oct_newCtotValue =  oct_newCtotValue + TotNumCenter.oct_budg 
                            nov_newCtotValue =  nov_newCtotValue + TotNumCenter.nov_budg 
                            dec_newCtotValue =  dec_newCtotValue + TotNumCenter.dec_budg
                            break;
                            
                        case "ResignClients":

                            jan_resCliTot = jan_resCliTot + TotNumCenter.jan_budg 
                            feb_resCliTot = feb_resCliTot + TotNumCenter.feb_budg 
                            mar_resCliTot = mar_resCliTot + TotNumCenter.mar_budg 
                            apr_resCliTot = apr_resCliTot + TotNumCenter.apr_budg 
                            may_resCliTot = may_resCliTot + TotNumCenter.may_budg 
                            jun_resCliTot = jun_resCliTot + TotNumCenter.jun_budg 
                            jul_resCliTot = jul_resCliTot + TotNumCenter.jul_budg 
                            aug_resCliTot = aug_resCliTot + TotNumCenter.aug_budg 
                            sep_resCliTot = sep_resCliTot + TotNumCenter.sep_budg 
                            oct_resCliTot = oct_resCliTot + TotNumCenter.oct_budg 
                            nov_resCliTot = nov_resCliTot + TotNumCenter.nov_budg 
                            dec_resCliTot = dec_resCliTot + TotNumCenter.dec_budg 
                                    break;

                        case "TotProcFee":

                            janProcFeeAmt = janProcFeeAmt +  TotNumCenter.jan_budg 
                            febProcFeeAmt = febProcFeeAmt +  TotNumCenter.feb_budg 
                            marProcFeeAmt = marProcFeeAmt +  TotNumCenter.mar_budg 
                            aprProcFeeAmt = aprProcFeeAmt +  TotNumCenter.apr_budg 
                            mayProcFeeAmt = mayProcFeeAmt +  TotNumCenter.may_budg 
                            junProcFeeAmt = junProcFeeAmt +  TotNumCenter.jun_budg 
                            julProcFeeAmt = julProcFeeAmt +  TotNumCenter.jul_budg 
                            augProcFeeAmt = augProcFeeAmt +  TotNumCenter.aug_budg 
                            sepProcFeeAmt = sepProcFeeAmt +  TotNumCenter.sep_budg 
                            octProcFeeAmt = octProcFeeAmt +  TotNumCenter.oct_budg 
                            novProcFeeAmt = novProcFeeAmt +  TotNumCenter.nov_budg 
                            decProcFeeAmt = decProcFeeAmt +  TotNumCenter.dec_budg
                                break;

                        case "TotProjInc":
                            jan_totIntAmt = jan_totIntAmt + TotNumCenter.jan_budg
                            feb_totIntAmt = feb_totIntAmt + TotNumCenter.feb_budg
                            mar_totIntAmt = mar_totIntAmt + TotNumCenter.mar_budg
                            apr_totIntAmt = apr_totIntAmt + TotNumCenter.apr_budg
                            may_totIntAmt = may_totIntAmt + TotNumCenter.may_budg
                            jun_totIntAmt = jun_totIntAmt + TotNumCenter.jun_budg
                            jul_totIntAmt = jul_totIntAmt + TotNumCenter.jul_budg
                            aug_totIntAmt = aug_totIntAmt + TotNumCenter.aug_budg
                            sep_totIntAmt = sep_totIntAmt + TotNumCenter.sep_budg
                            oct_totIntAmt = oct_totIntAmt + TotNumCenter.oct_budg
                            nov_totIntAmt = nov_totIntAmt + TotNumCenter.nov_budg
                            dec_totIntAmt = dec_totIntAmt + TotNumCenter.dec_budg
                            break;

                            
                        case "NewLoanAmount":

                            jan_newAtotValue =  jan_newAtotValue + TotNumCenter.jan_budg
                            feb_newAtotValue =  feb_newAtotValue + TotNumCenter.feb_budg
                            mar_newAtotValue =  mar_newAtotValue + TotNumCenter.mar_budg
                            apr_newAtotValue =  apr_newAtotValue + TotNumCenter.apr_budg
                            may_newAtotValue =  may_newAtotValue + TotNumCenter.may_budg
                            jun_newAtotValue =  jun_newAtotValue + TotNumCenter.jun_budg
                            jul_newAtotValue =  jul_newAtotValue + TotNumCenter.jul_budg
                            aug_newAtotValue =  aug_newAtotValue + TotNumCenter.aug_budg
                            sep_newAtotValue =  sep_newAtotValue + TotNumCenter.sep_budg
                            oct_newAtotValue =  oct_newAtotValue + TotNumCenter.oct_budg
                            nov_newAtotValue =  nov_newAtotValue + TotNumCenter.nov_budg
                            dec_newAtotValue =  dec_newAtotValue + TotNumCenter.dec_budg
                            break;

                        case "ReLoanAmount":

                            jan_oldAtotValue = jan_oldAtotValue + TotNumCenter.jan_budg 
                            feb_oldAtotValue = feb_oldAtotValue + TotNumCenter.feb_budg 
                            mar_oldAtotValue = mar_oldAtotValue + TotNumCenter.mar_budg 
                            apr_oldAtotValue = apr_oldAtotValue + TotNumCenter.apr_budg 
                            may_oldAtotValue = may_oldAtotValue + TotNumCenter.may_budg 
                            jun_oldAtotValue = jun_oldAtotValue + TotNumCenter.jun_budg 
                            jul_oldAtotValue = jul_oldAtotValue + TotNumCenter.jul_budg 
                            aug_oldAtotValue = aug_oldAtotValue + TotNumCenter.aug_budg 
                            sep_oldAtotValue = sep_oldAtotValue + TotNumCenter.sep_budg 
                            oct_oldAtotValue = oct_oldAtotValue + TotNumCenter.oct_budg 
                            nov_oldAtotValue = nov_oldAtotValue + TotNumCenter.nov_budg 
                            dec_oldAtotValue = dec_oldAtotValue + TotNumCenter.dec_budg
                            break;

                        default:
                            month = 0
                            break;
                    }
                })
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
    
                    doneReadNumCenters = true  // ****-----

                    totTotAmtLoan = janTotAmtLoan + febTotAmtLoan + marTotAmtLoan + aprTotAmtLoan + mayTotAmtLoan + junTotAmtLoan + julTotAmtLoan + augTotAmtLoan +
                        sepTotAmtLoan + octTotAmtLoan + novTotAmtLoan + decTotAmtLoan
    
                    poSumView.push({title: "TOTAL AMOUNT OF LOAN", sortkey: 15, group: 2, jan_value : janTotAmtLoan, feb_value : febTotAmtLoan, mar_value : marTotAmtLoan, 
                        apr_value : aprTotAmtLoan, may_value : mayTotAmtLoan, jun_value : junTotAmtLoan, jul_value : julTotAmtLoan, 
                        aug_value : augTotAmtLoan, sep_value : sepTotAmtLoan, oct_value : octTotAmtLoan, nov_value : novTotAmtLoan, dec_value : decTotAmtLoan, tot_value : totTotAmtLoan
                    })
    
                    doneReadTotLonAmt = true  // ****-----
                
                    nwTotValueClient = jan_newCliTot + feb_newCliTot + mar_newCliTot + apr_newCliTot + may_newCliTot + jun_newCliTot
                    + jul_newCliTot + aug_newCliTot + sep_newCliTot + oct_newCliTot + nov_newCliTot + dec_newCliTot
                
                    poSumView.push({title: "New Clients", sortkey: 4, group: 2, beg_bal: 0, jan_value : jan_newCliTot, feb_value : feb_newCliTot, mar_value : mar_newCliTot, apr_value : apr_newCliTot,
                        may_value : may_newCliTot, jun_value : jun_newCliTot, jul_value : jul_newCliTot, aug_value : aug_newCliTot,
                        sep_value : sep_newCliTot, oct_value : oct_newCliTot, nov_value : nov_newCliTot, dec_value : dec_newCliTot, tot_value : nwTotValueClient
                    }) 
                    doneReadNLCli = true  // ****-----

                    jan_reLoanCliTot = jan_oldCliTot
                    feb_reLoanCliTot = feb_oldCliTot
                    mar_reLoanCliTot = mar_oldCliTot
                    apr_reLoanCliTot = apr_oldCliTot
                    may_reLoanCliTot = may_oldCliTot
                    jun_reLoanCliTot = jun_oldCliTot
                    jul_reLoanCliTot = jul_oldCliTot
                    aug_reLoanCliTot = aug_oldCliTot
                    sep_reLoanCliTot = sep_oldCliTot
                    oct_reLoanCliTot = oct_oldCliTot
                    nov_reLoanCliTot = nov_oldCliTot
                    dec_reLoanCliTot = dec_oldCliTot
        
                    olTotValueClient = jan_oldCliTot + feb_oldCliTot + mar_oldCliTot + apr_oldCliTot + may_oldCliTot + jun_oldCliTot
                                + jul_oldCliTot + aug_oldCliTot + sep_oldCliTot + oct_oldCliTot + nov_oldCliTot + dec_oldCliTot
        
                    poSumView.push({title: "Number of Reloan", sortkey: 10, group: 1, beg_bal: 0, jan_value : jan_oldCliTot, feb_value : feb_oldCliTot, mar_value : mar_oldCliTot, apr_value : apr_oldCliTot,
                        may_value : may_oldCliTot, jun_value : jun_oldCliTot, jul_value : jul_oldCliTot, aug_value : aug_oldCliTot,
                        sep_value : sep_oldCliTot, oct_value : oct_oldCliTot, nov_value : nov_oldCliTot, dec_value : dec_oldCliTot, tot_value : olTotValueClient
                    }) 
        
                    doneReadOLC = true  // ****-----

                    nwTotValueClient = jan_newCtotValue + feb_newCtotValue + mar_newCtotValue + apr_newCtotValue + may_newCtotValue + jun_newCtotValue
                    + jul_newCtotValue + aug_newCtotValue + sep_newCtotValue + oct_newCtotValue + nov_newCtotValue + dec_newCtotValue
                
                    poSumView.push({title: "Number of New Loan", sortkey: 9, group: 1, beg_bal: 0, jan_value : jan_newCtotValue, feb_value : feb_newCtotValue, mar_value : mar_newCtotValue, apr_value : apr_newCtotValue,
                        may_value : may_newCtotValue, jun_value : jun_newCtotValue, jul_value : jul_newCtotValue, aug_value : aug_newCtotValue,
                        sep_value : sep_newCtotValue, oct_value : oct_newCtotValue, nov_value : nov_newCtotValue, dec_value : dec_newCtotValue, tot_value : nwTotValueClient
                    }) 
                    doneReadNLC = true  // ****-----

                    olTotValueClient = jan_resCliTot + feb_resCliTot + mar_resCliTot + apr_resCliTot + may_resCliTot + jun_resCliTot
                    + jul_resCliTot + aug_resCliTot + sep_resCliTot + oct_resCliTot + nov_resCliTot + dec_resCliTot
                
                    doneReadResCli = true  // ****-----

                    let nloanTotProcFeeAmt = janProcFeeAmt + febProcFeeAmt + marProcFeeAmt + aprProcFeeAmt + mayProcFeeAmt + junProcFeeAmt
                         + julProcFeeAmt + augProcFeeAmt + sepProcFeeAmt + octProcFeeAmt + novProcFeeAmt + decProcFeeAmt
    
                      poSumView.push({title: "Processing Fees", desc: "Processing Fees", sortkey: 27, group: 1, jan_value : janProcFeeAmt, feb_value : febProcFeeAmt, mar_value : marProcFeeAmt, apr_value : aprProcFeeAmt,
                          may_value : mayProcFeeAmt, jun_value : junProcFeeAmt, jul_value : julProcFeeAmt, aug_value : augProcFeeAmt,
                          sep_value : sepProcFeeAmt, oct_value : octProcFeeAmt, nov_value : novProcFeeAmt, dec_value : decProcFeeAmt, tot_value : nloanTotProcFeeAmt
                      })         

                    let nloanTotIntAmt = jan_totIntAmt + feb_totIntAmt + mar_totIntAmt + apr_totIntAmt + may_totIntAmt + jun_totIntAmt
                        + jul_totIntAmt + aug_totIntAmt + sep_totIntAmt + oct_totIntAmt + nov_totIntAmt + dec_totIntAmt
    
                      poSumView.push({title: "Loan Fees", desc: "Loan Fees", sortkey: 26, group: 1, jan_value : jan_totIntAmt, feb_value : feb_totIntAmt, mar_value : mar_totIntAmt, apr_value : apr_totIntAmt,
                          may_value : may_totIntAmt, jun_value : jun_totIntAmt, jul_value : jul_totIntAmt, aug_value : aug_totIntAmt,
                          sep_value : sep_totIntAmt, oct_value : oct_totIntAmt, nov_value : nov_totIntAmt, dec_value : dec_totIntAmt, tot_value : nloanTotIntAmt
                      })         
                    
                    let nwTotValueAmt = jan_newAtotValue + feb_newAtotValue + mar_newAtotValue + apr_newAtotValue + may_newAtotValue + jun_newAtotValue
                      + jul_newAtotValue + aug_newAtotValue + sep_newAtotValue + oct_newAtotValue + nov_newAtotValue + dec_newAtotValue
  
                    poSumView.push({title: "Amount of New Loan", sortkey: 13, group: 2, jan_value : jan_newAtotValue, feb_value : feb_newAtotValue, mar_value : mar_newAtotValue, apr_value : apr_newAtotValue,
                        may_value : may_newAtotValue, jun_value : jun_newAtotValue, jul_value : jul_newAtotValue, aug_value : aug_newAtotValue,
                        sep_value : sep_newAtotValue, oct_value : oct_newAtotValue, nov_value : nov_newAtotValue, dec_value : dec_newAtotValue, tot_value : nwTotValueAmt
                    }) 
                    doneReadNLA = true  // ****-----

                    let olTotValueAmt = jan_oldAtotValue + feb_oldAtotValue + mar_oldAtotValue + apr_oldAtotValue + may_oldAtotValue + jun_oldAtotValue
                    + jul_oldAtotValue + aug_oldAtotValue + sep_oldAtotValue + oct_oldAtotValue + nov_oldAtotValue + dec_oldAtotValue

                    poSumView.push({title: "Amount of Reloan", sortkey: 14, group: 2, jan_value : jan_oldAtotValue, feb_value : feb_oldAtotValue, mar_value : mar_oldAtotValue, apr_value : apr_oldAtotValue,
                        may_value : may_oldAtotValue, jun_value : jun_oldAtotValue, jul_value : jul_oldAtotValue, aug_value : aug_oldAtotValue,
                        sep_value : sep_oldAtotValue, oct_value : oct_oldAtotValue, nov_value : nov_oldAtotValue, dec_value : dec_oldAtotValue, tot_value : olTotValueAmt
                    }) 
                    doneReadOLA = true  // ****-----
                                          
                }
    
            poSumView.push({title: "CENTERS", sortkey: 1, group: 1, isTitle: true})
    
            poSumView.push({title: "CLIENTS", sortkey: 3, group: 2, isTitle: true})
    
    
        if (doneReadNLCli && doneReadOLC && doneReadResCli) {
    
            jan_oldCliTot = begBalOldClient 
                jan_totNumClients = (jan_oldCliTot + jan_newCliTot) - jan_resCliTot
            feb_oldCliTot = jan_totNumClients
                feb_totNumClients = (feb_oldCliTot + feb_newCliTot) - feb_resCliTot    
            mar_oldCliTot = feb_totNumClients
                mar_totNumClients = (mar_oldCliTot + mar_newCliTot) - mar_resCliTot
            apr_oldCliTot = mar_totNumClients
                apr_totNumClients = (apr_oldCliTot + apr_newCliTot) - apr_resCliTot
            may_oldCliTot = apr_totNumClients
                may_totNumClients = (may_oldCliTot + may_newCliTot) - may_resCliTot
            jun_oldCliTot = may_totNumClients
                jun_totNumClients = (jun_oldCliTot + jun_newCliTot) - jun_resCliTot
            jul_oldCliTot = jun_totNumClients
                jul_totNumClients = (jul_oldCliTot + jul_newCliTot) - jul_resCliTot
            aug_oldCliTot = jul_totNumClients
                aug_totNumClients = (aug_oldCliTot + aug_newCliTot) - aug_resCliTot
            sep_oldCliTot = aug_totNumClients
                sep_totNumClients = (sep_oldCliTot + sep_newCliTot) - sep_resCliTot
            oct_oldCliTot = sep_totNumClients
                oct_totNumClients = (oct_oldCliTot + oct_newCliTot) - oct_resCliTot
            nov_oldCliTot = oct_totNumClients
                nov_totNumClients = (nov_oldCliTot + nov_newCliTot) - nov_resCliTot
            dec_oldCliTot = nov_totNumClients
                dec_totNumClients = (dec_oldCliTot + dec_newCliTot) - dec_resCliTot
            
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
               sep_value : sep_resCliTot, oct_value : oct_resCliTot, nov_value : nov_resCliTot, dec_value : dec_resCliTot, tot_value : olTotValueClient
           }) 
           doneReadNewOldResCli = true
        }
    
            poSumView.push({title: "NUMBER OF LOANS", sortkey: 8, group: 1, isTitle: true})
        
                if (doneReadNLC && doneReadOLC) {
                    let jan_totNoOfLoan = jan_reLoanCliTot + jan_newCtotValue
                    let feb_totNoOfLoan = feb_reLoanCliTot + feb_newCtotValue
                    let mar_totNoOfLoan = mar_reLoanCliTot + mar_newCtotValue
                    let apr_totNoOfLoan = apr_reLoanCliTot + apr_newCtotValue
                    let may_totNoOfLoan = may_reLoanCliTot + may_newCtotValue
                    let jun_totNoOfLoan = jun_reLoanCliTot + jun_newCtotValue
                    let jul_totNoOfLoan = jul_reLoanCliTot + jul_newCtotValue
                    let aug_totNoOfLoan = aug_reLoanCliTot + aug_newCtotValue
                    let sep_totNoOfLoan = sep_reLoanCliTot + sep_newCtotValue
                    let oct_totNoOfLoan = oct_reLoanCliTot + oct_newCtotValue
                    let nov_totNoOfLoan = nov_reLoanCliTot + nov_newCtotValue
                    let dec_totNoOfLoan = dec_reLoanCliTot + dec_newCtotValue
    
                    let tot_totNoOfLoan = jan_totNoOfLoan + feb_totNoOfLoan + mar_totNoOfLoan + apr_totNoOfLoan + may_totNoOfLoan + jun_totNoOfLoan + jul_totNoOfLoan +
                            aug_totNoOfLoan + sep_totNoOfLoan + oct_totNoOfLoan + nov_totNoOfLoan + dec_totNoOfLoan
    
                    poSumView.push({title: "TOTAL NO. OF LOAN", sortkey: 11, group: 1, jan_value : jan_totNoOfLoan, feb_value : feb_totNoOfLoan, mar_value : mar_totNoOfLoan, 
                        apr_value : apr_totNoOfLoan, may_value : may_totNoOfLoan, jun_value : jun_totNoOfLoan, jul_value : jul_totNoOfLoan, aug_value : aug_totNoOfLoan,
                        sep_value : sep_totNoOfLoan, oct_value : oct_totNoOfLoan, nov_value : nov_totNoOfLoan, dec_value : dec_totNoOfLoan, tot_value: tot_totNoOfLoan
                   }) 
                }
    
                poSumView.push({title: "AMOUNT OF LOANS", sortkey: 12, group: 2, isTitle: true})
    
    
    
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
                              
                                    jan_totWklyCBUAmt = jan_totInitCBUAmt + (begBalOldClient * 50 * 4)   // * wklyCBUrate // Monthly CBU Amount
                                    jan_totCBUInt = _.round((begBalmonthContriCBU + jan_totInitCBUAmt + jan_totWklyCBUAmt) * .01 / 6)
                                    jan_cbuBalFromPrevMo = begBalmonthContriCBU
                                    jan_cbuWithDrawal = jan_resCliTot * withdrawalCBUrate
                                    jan_totMonthCBU = (jan_totInitCBUAmt + jan_totWklyCBUAmt + jan_totCBUInt + jan_cbuBalFromPrevMo) - jan_cbuWithDrawal 
    
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
                                runTotWklyCBUAmt = runTotWklyCBUAmt + jan_totNumClients 
    
                                    feb_totInitCBUAmt = feb_newAtotValue * initCBUrate
                                    feb_totWklyCBUAmt = feb_totNumClients * wklyCBUrate // Monthly CBU Amount
                                    feb_totCBUInt = _.round((jan_totMonthCBU + feb_totInitCBUAmt + feb_totWklyCBUAmt) * .01 / 6)
                                    feb_cbuBalFromPrevMo = jan_totMonthCBU
                                    feb_cbuWithDrawal = feb_resCliTot * withdrawalCBUrate
                                    feb_totMonthCBU = (feb_totInitCBUAmt + feb_totWklyCBUAmt + feb_totCBUInt + feb_cbuBalFromPrevMo) - feb_cbuWithDrawal 
    
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
                                runTotWklyCBUAmt = runTotWklyCBUAmt + feb_totNumClients 
                                    mar_totInitCBUAmt = mar_newAtotValue * initCBUrate  
                                    mar_totWklyCBUAmt = mar_totNumClients * wklyCBUrate // Monthly CBU Amount
                                    mar_totCBUInt = _.round((feb_totMonthCBU + mar_totInitCBUAmt + mar_totWklyCBUAmt) * .01 / 6)
                                    mar_cbuBalFromPrevMo = feb_totMonthCBU
                                    mar_cbuWithDrawal = mar_resCliTot * withdrawalCBUrate
                                    mar_totMonthCBU = (mar_totInitCBUAmt + mar_totWklyCBUAmt + mar_totCBUInt + mar_cbuBalFromPrevMo) - mar_cbuWithDrawal 
    
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
                                runTotWklyCBUAmt = runTotWklyCBUAmt + mar_totNumClients 
                                    apr_totInitCBUAmt = apr_newAtotValue * initCBUrate  
                                    apr_totWklyCBUAmt = apr_totNumClients * wklyCBUrate // Monthly CBU Amount
                                    apr_totCBUInt = _.round((mar_totMonthCBU + apr_totInitCBUAmt + apr_totWklyCBUAmt) * .01 / 6)
                                    apr_cbuBalFromPrevMo = mar_totMonthCBU
                                    apr_cbuWithDrawal = apr_resCliTot * withdrawalCBUrate
                                    apr_totMonthCBU = (apr_totInitCBUAmt + apr_totWklyCBUAmt + apr_totCBUInt + apr_cbuBalFromPrevMo) - apr_cbuWithDrawal 
    
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
                                runTotWklyCBUAmt = runTotWklyCBUAmt + apr_totNumClients 
                                    may_totInitCBUAmt = may_newAtotValue * initCBUrate  
                                    may_totWklyCBUAmt = may_totNumClients * wklyCBUrate // Monthly CBU Amount
                                    may_totCBUInt = _.round((apr_totMonthCBU + may_totInitCBUAmt + may_totWklyCBUAmt) * .01 / 6)
                                    may_cbuBalFromPrevMo = apr_totMonthCBU
                                    may_cbuWithDrawal = may_resCliTot * withdrawalCBUrate
                                    may_totMonthCBU = (may_totInitCBUAmt + may_totWklyCBUAmt + may_totCBUInt + may_cbuBalFromPrevMo) - may_cbuWithDrawal 
    
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
                                runTotWklyCBUAmt = runTotWklyCBUAmt + may_totNumClients 
                                    jun_totInitCBUAmt = jun_newAtotValue * initCBUrate  
                                    jun_totWklyCBUAmt = jun_totNumClients * wklyCBUrate // Monthly CBU Amount
                                    jun_totCBUInt = _.round((may_totMonthCBU + jun_totInitCBUAmt + jun_totWklyCBUAmt) * .01 / 6)
                                    jun_cbuBalFromPrevMo = may_totMonthCBU
                                    jun_cbuWithDrawal = jun_resCliTot * withdrawalCBUrate
                                    jun_totMonthCBU = (jun_totInitCBUAmt + jun_totWklyCBUAmt + jun_totCBUInt + jun_cbuBalFromPrevMo) - jun_cbuWithDrawal 
    
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
                                runTotWklyCBUAmt = runTotWklyCBUAmt + jun_totNumClients 
                                    jul_totInitCBUAmt = jul_newAtotValue * initCBUrate  
                                    jul_totWklyCBUAmt = jul_totNumClients * wklyCBUrate // Monthly CBU Amount
                                    jul_totCBUInt = _.round((jun_totMonthCBU + jul_totInitCBUAmt + jul_totWklyCBUAmt) * .01 / 6)
                                    jul_cbuBalFromPrevMo = jun_totMonthCBU
                                    jul_cbuWithDrawal = jul_resCliTot * withdrawalCBUrate
                                    jul_totMonthCBU = (jul_totInitCBUAmt + jul_totWklyCBUAmt + jul_totCBUInt + jul_cbuBalFromPrevMo) - jul_cbuWithDrawal 
    
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
                                runTotWklyCBUAmt = runTotWklyCBUAmt + jul_totNumClients 
                                    aug_totInitCBUAmt = aug_newAtotValue * initCBUrate  
                                    aug_totWklyCBUAmt = aug_totNumClients * wklyCBUrate // Monthly CBU Amount
                                    aug_totCBUInt = _.round((jul_totMonthCBU + aug_totInitCBUAmt + aug_totWklyCBUAmt) * .01 / 6)
                                    aug_cbuBalFromPrevMo = jul_totMonthCBU
                                    aug_cbuWithDrawal = aug_resCliTot * withdrawalCBUrate
                                    aug_totMonthCBU = (aug_totInitCBUAmt + aug_totWklyCBUAmt + aug_totCBUInt + aug_cbuBalFromPrevMo) - aug_cbuWithDrawal 
    
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
                                runTotWklyCBUAmt = runTotWklyCBUAmt + aug_totNumClients 
                                    sep_totInitCBUAmt = sep_newAtotValue * initCBUrate  
                                    sep_totWklyCBUAmt = sep_totNumClients * wklyCBUrate // Monthly CBU Amount
                                    sep_totCBUInt = _.round((aug_totMonthCBU + sep_totInitCBUAmt + sep_totWklyCBUAmt) * .01 / 6)
                                    sep_cbuBalFromPrevMo = aug_totMonthCBU
                                    sep_cbuWithDrawal = sep_resCliTot * withdrawalCBUrate
                                    sep_totMonthCBU = (sep_totInitCBUAmt + sep_totWklyCBUAmt + sep_totCBUInt + sep_cbuBalFromPrevMo) - sep_cbuWithDrawal 
    
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
                                runTotWklyCBUAmt = runTotWklyCBUAmt + sep_totNumClients 
                                    oct_totInitCBUAmt = oct_newAtotValue * initCBUrate  
                                    oct_totWklyCBUAmt = oct_totNumClients * wklyCBUrate // Monthly CBU Amount
                                    oct_totCBUInt = _.round((sep_totMonthCBU + oct_totInitCBUAmt + oct_totWklyCBUAmt) * .01 / 6)
                                    oct_cbuBalFromPrevMo = sep_totMonthCBU
                                    oct_cbuWithDrawal = oct_resCliTot * withdrawalCBUrate
                                    oct_totMonthCBU = (oct_totInitCBUAmt + oct_totWklyCBUAmt + oct_totCBUInt + oct_cbuBalFromPrevMo) - oct_cbuWithDrawal 
    
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
                                runTotWklyCBUAmt = runTotWklyCBUAmt + dec_totNumClients 
                                    nov_totInitCBUAmt = nov_newAtotValue * initCBUrate  
                                    nov_totWklyCBUAmt = nov_totNumClients * wklyCBUrate // Monthly CBU Amount
                                    nov_totCBUInt = _.round((oct_totMonthCBU + nov_totInitCBUAmt + nov_totWklyCBUAmt) * .01 / 6)
                                    nov_cbuBalFromPrevMo = oct_totMonthCBU
                                    nov_cbuWithDrawal = nov_resCliTot * withdrawalCBUrate
                                    nov_totMonthCBU = (nov_totInitCBUAmt + nov_totWklyCBUAmt + nov_totCBUInt + nov_cbuBalFromPrevMo) - nov_cbuWithDrawal 
    
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
                                runTotWklyCBUAmt = runTotWklyCBUAmt + dec_totNumClients 
                                    dec_totInitCBUAmt = dec_newAtotValue * initCBUrate  
                                    dec_totWklyCBUAmt = dec_totNumClients * wklyCBUrate // Monthly CBU Amount
                                    dec_totCBUInt = _.round((nov_totMonthCBU + dec_totInitCBUAmt + dec_totWklyCBUAmt) * .01 / 6)
                                    dec_cbuBalFromPrevMo = nov_totMonthCBU
                                    dec_cbuWithDrawal = dec_resCliTot * withdrawalCBUrate
                                    dec_totMonthCBU = (dec_totInitCBUAmt + dec_totWklyCBUAmt + dec_totCBUInt + dec_cbuBalFromPrevMo) - dec_cbuWithDrawal 
    
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
    
                    let tot_cbuWithDrawal = jan_cbuWithDrawal + feb_cbuWithDrawal + mar_cbuWithDrawal + apr_cbuWithDrawal + may_cbuWithDrawal + jun_cbuWithDrawal + jul_cbuWithDrawal +
                            aug_cbuWithDrawal + sep_cbuWithDrawal + oct_cbuWithDrawal + nov_cbuWithDrawal + dec_cbuWithDrawal
    
                    poSumView.push({title: "Initial Capital Build-Up", sortkey: 20, group: 2, jan_value : jan_totInitCBUAmt, feb_value : feb_totInitCBUAmt, mar_value : mar_totInitCBUAmt, 
                        apr_value : apr_totInitCBUAmt, may_value : may_totInitCBUAmt, jun_value : jun_totInitCBUAmt, jul_value : jul_totInitCBUAmt, 
                        aug_value : aug_totInitCBUAmt, sep_value : sep_totInitCBUAmt, oct_value : oct_totInitCBUAmt, nov_value : nov_totInitCBUAmt, dec_value : dec_totInitCBUAmt, tot_value : tot_totInitCBUAmt
                    
                    })
                    poSumView.push({title: "Monthly Contribution", sortkey: 21, group: 2, beg_bal: begBalOldClient * 50 * 4, jan_value : jan_totWklyCBUAmt, feb_value : feb_totWklyCBUAmt, mar_value : mar_totWklyCBUAmt, 
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
                    let worksheet1 = workbook.addWorksheet("Area_Exec_Sum2");
                
                    worksheet1.columns = [
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
                    worksheet1.addRows(dataForExcel)
                
                    worksheet.getRow(1).font = { size: 14, bold: true}
                    worksheet.getRow(2).font = { size: 12, bold: true}
                    worksheet.getRow(4).font = { size: 12, bold: true}
                    worksheet.getRow(9).font = { size: 12, bold: true}
                    worksheet.getRow(13).font = { size: 12, bold: true}
                    worksheet.getRow(17).font = { size: 12, bold: true}
                    worksheet.getRow(22).font = { size: 12, bold: true}
                    worksheet.getRow(29).font = { size: 12, bold: true}
                
                    worksheet1.getRow(1).font = { size: 14, bold: true}
                    worksheet1.getRow(2).font = { size: 12, bold: true}
                    worksheet1.getRow(4).font = { size: 12, bold: true}
                    worksheet1.getRow(9).font = { size: 12, bold: true}
                    worksheet1.getRow(13).font = { size: 12, bold: true}
                    worksheet1.getRow(17).font = { size: 12, bold: true}
                    worksheet1.getRow(22).font = { size: 12, bold: true}
                    worksheet1.getRow(29).font = { size: 12, bold: true}

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

// View KRA per Branch & per month ROUTE
router.get('/viewAreaKRAMon/:id', authUser, authRole(ROLE.AM), async (req, res) => {

    const viewAreaCode = req.params.id
    const vwUnitCode = viewAreaCode
    const yuser = req.user

    let foundPOV = []
    // let foundCenterDet = []

    const vwloanType = await Loan_type.find({})
    const vwAreaBranches = await Branch.find({area:viewAreaCode})
    
    const areaCtrBudgDet = await Center_budget_det.find({area: viewAreaCode})

    // const areaCtrBudgTotLonAmt = await Center_budget_det.find({area: viewAreaCode, view_code: "TotLoanAmt"})

    const poBudgExecTotReach = await Budg_exec_sum.find({area: viewAreaCode, view_code: "TotClientOutreach"})
    const poBudgExecTotLonAmt = await Budg_exec_sum.find({area: viewAreaCode, view_code: "TotLoanAmt"})

    // console.log(vwAreaBranches)

                let centerCntBegBal = 0

                let jan_TotalCliOutReach = 0
                let feb_TotalCliOutReach = 0
                let mar_TotalCliOutReach = 0
                let apr_TotalCliOutReach = 0
                let may_TotalCliOutReach = 0
                let jun_TotalCliOutReach = 0
                let jul_TotalCliOutReach = 0
                let aug_TotalCliOutReach = 0
                let sep_TotalCliOutReach = 0
                let oct_TotalCliOutReach = 0
                let nov_TotalCliOutReach = 0
                let dec_TotalCliOutReach = 0

                let jan_TotalAmtDisburse = 0
                let feb_TotalAmtDisburse = 0
                let mar_TotalAmtDisburse = 0
                let apr_TotalAmtDisburse = 0
                let may_TotalAmtDisburse = 0
                let jun_TotalAmtDisburse = 0
                let jul_TotalAmtDisburse = 0
                let aug_TotalAmtDisburse = 0
                let sep_TotalAmtDisburse = 0
                let oct_TotalAmtDisburse = 0
                let nov_TotalAmtDisburse = 0
                let dec_TotalAmtDisburse = 0

            let jan_brnTotAmtDisburse = 0
            let feb_brnTotAmtDisburse = 0
            let mar_brnTotAmtDisburse = 0
            let apr_brnTotAmtDisburse = 0
            let may_brnTotAmtDisburse = 0
            let jun_brnTotAmtDisburse = 0
            let jul_brnTotAmtDisburse = 0
            let aug_brnTotAmtDisburse = 0
            let sep_brnTotAmtDisburse = 0
            let oct_brnTotAmtDisburse = 0
            let nov_brnTotAmtDisburse = 0
            let dec_brnTotAmtDisburse = 0
    
            let jan_brnNewLoanAmt = 0
            let feb_brnNewLoanAmt = 0
            let mar_brnNewLoanAmt = 0
            let apr_brnNewLoanAmt = 0
            let may_brnNewLoanAmt = 0
            let jun_brnNewLoanAmt = 0
            let jul_brnNewLoanAmt = 0
            let aug_brnNewLoanAmt = 0
            let sep_brnNewLoanAmt = 0
            let oct_brnNewLoanAmt = 0
            let nov_brnNewLoanAmt = 0
            let dec_brnNewLoanAmt = 0

            let jan_brnOldLoanAmt = 0
            let feb_brnOldLoanAmt = 0
            let mar_brnOldLoanAmt = 0
            let apr_brnOldLoanAmt = 0
            let may_brnOldLoanAmt = 0
            let jun_brnOldLoanAmt = 0
            let jul_brnOldLoanAmt = 0
            let aug_brnOldLoanAmt = 0
            let sep_brnOldLoanAmt = 0
            let oct_brnOldLoanAmt = 0
            let nov_brnOldLoanAmt = 0
            let dec_brnOldLoanAmt = 0

            let tot_brnTotAmtDisburse = 0

                let jan_TotOldClient = 0
                let feb_TotOldClient = 0
                let mar_TotOldClient = 0
                let apr_TotOldClient = 0
                let may_TotOldClient = 0
                let jun_TotOldClient = 0
                let jul_TotOldClient = 0
                let aug_TotOldClient = 0
                let sep_TotOldClient = 0
                let oct_TotOldClient = 0
                let nov_TotOldClient = 0
                let dec_TotOldClient = 0

                let jan_TotNewClient = 0
                let feb_TotNewClient = 0
                let mar_TotNewClient = 0
                let apr_TotNewClient = 0
                let may_TotNewClient = 0
                let jun_TotNewClient = 0
                let jul_TotNewClient = 0
                let aug_TotNewClient = 0
                let sep_TotNewClient = 0
                let oct_TotNewClient = 0
                let nov_TotNewClient = 0
                let dec_TotNewClient = 0

                let jan_TotResClient = 0
                let feb_TotResClient = 0
                let mar_TotResClient = 0
                let apr_TotResClient = 0
                let may_TotResClient = 0
                let jun_TotResClient = 0
                let jul_TotResClient = 0
                let aug_TotResClient = 0
                let sep_TotResClient = 0
                let oct_TotResClient = 0
                let nov_TotResClient = 0
                let dec_TotResClient = 0

                let jan_TotNewLoanAmt = 0
                let feb_TotNewLoanAmt = 0
                let mar_TotNewLoanAmt = 0
                let apr_TotNewLoanAmt = 0
                let may_TotNewLoanAmt = 0
                let jun_TotNewLoanAmt = 0
                let jul_TotNewLoanAmt = 0
                let aug_TotNewLoanAmt = 0
                let sep_TotNewLoanAmt = 0
                let oct_TotNewLoanAmt = 0
                let nov_TotNewLoanAmt = 0
                let dec_TotNewLoanAmt = 0

                let jan_TotOldLoanAmt = 0
                let feb_TotOldLoanAmt = 0
                let mar_TotOldLoanAmt = 0
                let apr_TotOldLoanAmt = 0
                let may_TotOldLoanAmt = 0
                let jun_TotOldLoanAmt = 0
                let jul_TotOldLoanAmt = 0
                let aug_TotOldLoanAmt = 0
                let sep_TotOldLoanAmt = 0
                let oct_TotOldLoanAmt = 0
                let nov_TotOldLoanAmt = 0
                let dec_TotOldLoanAmt = 0

            let jan_vwLonTypNewCli = 0
            let feb_vwLonTypNewCli = 0
            let mar_vwLonTypNewCli = 0
            let apr_vwLonTypNewCli = 0
            let may_vwLonTypNewCli = 0
            let jun_vwLonTypNewCli = 0
            let jul_vwLonTypNewCli = 0
            let aug_vwLonTypNewCli = 0
            let sep_vwLonTypNewCli = 0
            let oct_vwLonTypNewCli = 0
            let nov_vwLonTypNewCli = 0
            let dec_vwLonTypNewCli = 0

            let jan_vwLonTypOldCli = 0
            let feb_vwLonTypOldCli = 0
            let mar_vwLonTypOldCli = 0
            let apr_vwLonTypOldCli = 0
            let may_vwLonTypOldCli = 0
            let jun_vwLonTypOldCli = 0
            let jul_vwLonTypOldCli = 0
            let aug_vwLonTypOldCli = 0
            let sep_vwLonTypOldCli = 0
            let oct_vwLonTypOldCli = 0
            let nov_vwLonTypOldCli = 0
            let dec_vwLonTypOldCli = 0

            let jan_vwLonTypNewAmt = 0
            let feb_vwLonTypNewAmt = 0
            let mar_vwLonTypNewAmt = 0
            let apr_vwLonTypNewAmt = 0
            let may_vwLonTypNewAmt = 0
            let jun_vwLonTypNewAmt = 0
            let jul_vwLonTypNewAmt = 0
            let aug_vwLonTypNewAmt = 0
            let sep_vwLonTypNewAmt = 0
            let oct_vwLonTypNewAmt = 0
            let nov_vwLonTypNewAmt = 0
            let dec_vwLonTypNewAmt = 0

            let jan_vwLonTypOldAmt = 0
            let feb_vwLonTypOldAmt = 0
            let mar_vwLonTypOldAmt = 0
            let apr_vwLonTypOldAmt = 0
            let may_vwLonTypOldAmt = 0
            let jun_vwLonTypOldAmt = 0
            let jul_vwLonTypOldAmt = 0
            let aug_vwLonTypOldAmt = 0
            let sep_vwLonTypOldAmt = 0
            let oct_vwLonTypOldAmt = 0
            let nov_vwLonTypOldAmt = 0
            let dec_vwLonTypOldAmt = 0

            let jan_vwLonTypResCli = 0
            let feb_vwLonTypResCli = 0
            let mar_vwLonTypResCli = 0
            let apr_vwLonTypResCli = 0
            let may_vwLonTypResCli = 0
            let jun_vwLonTypResCli = 0
            let jul_vwLonTypResCli = 0
            let aug_vwLonTypResCli = 0
            let sep_vwLonTypResCli = 0
            let oct_vwLonTypResCli = 0
            let nov_vwLonTypResCli = 0
            let dec_vwLonTypResCli = 0
                let tot_vwLonTypNewCli = 0
                let tot_vwLonTypOldCli = 0
                let tot_vwLonTypNewAmt = 0
                let tot_vwLonTypOldAmt = 0

                let jan_brnOldCliTot = 0
                let feb_brnOldCliTot = 0
                let mar_brnOldCliTot = 0
                let apr_brnOldCliTot = 0
                let may_brnOldCliTot = 0
                let jun_brnOldCliTot = 0
                let jul_brnOldCliTot = 0
                let aug_brnOldCliTot = 0
                let sep_brnOldCliTot = 0
                let oct_brnOldCliTot = 0
                let nov_brnOldCliTot = 0
                let dec_brnOldCliTot = 0
    
                let jan_brnNewCliTot = 0
                let feb_brnNewCliTot = 0
                let mar_brnNewCliTot = 0
                let apr_brnNewCliTot = 0
                let may_brnNewCliTot = 0
                let jun_brnNewCliTot = 0
                let jul_brnNewCliTot = 0
                let aug_brnNewCliTot = 0
                let sep_brnNewCliTot = 0
                let oct_brnNewCliTot = 0
                let nov_brnNewCliTot = 0
                let dec_brnNewCliTot = 0
    
                let jan_totNumClients = 0 
                let feb_totNumClients = 0
                let mar_totNumClients = 0
                let apr_totNumClients = 0
                let may_totNumClients = 0
                let jun_totNumClients = 0
                let jul_totNumClients = 0
                let aug_totNumClients = 0
                let sep_totNumClients = 0
                let oct_totNumClients = 0
                let nov_totNumClients = 0
                let dec_totNumClients = 0

                let lnTypBegBalOldClient = 0
                let branBegBalOldClient = 0
                let totBegBalOldClient = 0

            let doneReadTotLonAmt = false
            let doneReadTotOutreach = false
            let doneReadBranLnType = false
            let doneReadLnType = false
            let ctr = 20
            let ctrPerLonType = 20
            let ctrAreaOutReach = 1
            let ctrAreaDisb = 10
            let totalCtr = 2
            let ctrPerLonTypGrp = 1

            poSumView = [ ]

            let areaPerLnTypView = []
    
            try {
                
                console.log(poBudgExecTotReach)

                if (isNull(poBudgExecTotReach)) {

                    doneReadTotOutreach = true
                }

                if (isNull(poBudgExecTotLonAmt)) {

                    doneReadTotLonAmt = true
                }

                poSumView.push({title: "AREA OUTREACH", sortkey: 1, group: 1, isTitle: true})

                poSumView.push({title: "AREA DISBURSEMENT", sortkey: ctrAreaDisb , group: 2, isTitle: true})

                vwAreaBranches.forEach ( areaBranch => {         //SCAN the Branches
                    const brnDesc = areaBranch.branch_desc
                    const brnCode = areaBranch.branch

                    vwloanType.forEach( lonType => {            // SCAN the Loan Types

                        const scanvwloanType = lonType.title
                        ctr = ctr + 1

                        // poSumView.push({title: scanvwloanType, sortkey: ctrPerLonType , group: 2, isTitle: true})

                        ctrPerLonType = ctrPerLonType + 1

                        if (ctrPerLonTypGrp == 1) {
                            ctrPerLonTypGrp = 2
                        } else {
                            ctrPerLonTypGrp = 1
                        }
    
                        areaCtrBudgDet.forEach(areaBudgetDets => {      // SCAN Center_Budget_dets for the Area
    
                            const areaViewCode = areaBudgetDets.view_code
                            const areaLnType = areaBudgetDets.loan_type
                            const areaBranCode = areaBudgetDets.branch
    
                            if (areaBranCode === brnCode && areaLnType === scanvwloanType) {
    
                                switch (areaViewCode) {
                                    case "NewLoanClient":

                                            jan_vwLonTypNewCli = jan_vwLonTypNewCli + areaBudgetDets.jan_budg
                                            feb_vwLonTypNewCli = feb_vwLonTypNewCli + areaBudgetDets.feb_budg
                                            mar_vwLonTypNewCli = mar_vwLonTypNewCli + areaBudgetDets.mar_budg
                                            apr_vwLonTypNewCli = apr_vwLonTypNewCli + areaBudgetDets.apr_budg
                                            may_vwLonTypNewCli = may_vwLonTypNewCli + areaBudgetDets.may_budg
                                            jun_vwLonTypNewCli = jun_vwLonTypNewCli + areaBudgetDets.jun_budg
                                            jul_vwLonTypNewCli = jul_vwLonTypNewCli + areaBudgetDets.jul_budg
                                            aug_vwLonTypNewCli = aug_vwLonTypNewCli + areaBudgetDets.aug_budg
                                            sep_vwLonTypNewCli = sep_vwLonTypNewCli + areaBudgetDets.sep_budg
                                            oct_vwLonTypNewCli = oct_vwLonTypNewCli + areaBudgetDets.oct_budg
                                            nov_vwLonTypNewCli = nov_vwLonTypNewCli + areaBudgetDets.nov_budg
                                            dec_vwLonTypNewCli = dec_vwLonTypNewCli + areaBudgetDets.dec_budg                        
            
                                        if (areaLnType === "Group Loan" || areaLnType === "Agricultural Loan") {
                                            jan_brnNewCliTot = jan_brnNewCliTot + areaBudgetDets.jan_budg
                                            feb_brnNewCliTot = feb_brnNewCliTot + areaBudgetDets.feb_budg
                                            mar_brnNewCliTot = mar_brnNewCliTot + areaBudgetDets.mar_budg
                                            apr_brnNewCliTot = apr_brnNewCliTot + areaBudgetDets.apr_budg
                                            may_brnNewCliTot = may_brnNewCliTot + areaBudgetDets.may_budg
                                            jun_brnNewCliTot = jun_brnNewCliTot + areaBudgetDets.jun_budg
                                            jul_brnNewCliTot = jul_brnNewCliTot + areaBudgetDets.jul_budg
                                            aug_brnNewCliTot = aug_brnNewCliTot + areaBudgetDets.aug_budg
                                            sep_brnNewCliTot = sep_brnNewCliTot + areaBudgetDets.sep_budg
                                            oct_brnNewCliTot = oct_brnNewCliTot + areaBudgetDets.oct_budg
                                            nov_brnNewCliTot = nov_brnNewCliTot + areaBudgetDets.nov_budg
                                            dec_brnNewCliTot = dec_brnNewCliTot + areaBudgetDets.dec_budg                        
            
                                            jan_TotNewClient = jan_TotNewClient + areaBudgetDets.jan_budg
                                            feb_TotNewClient = feb_TotNewClient + areaBudgetDets.feb_budg
                                            mar_TotNewClient = mar_TotNewClient + areaBudgetDets.mar_budg
                                            apr_TotNewClient = apr_TotNewClient + areaBudgetDets.apr_budg
                                            may_TotNewClient = may_TotNewClient + areaBudgetDets.may_budg
                                            jun_TotNewClient = jun_TotNewClient + areaBudgetDets.jun_budg
                                            jul_TotNewClient = jul_TotNewClient + areaBudgetDets.jul_budg
                                            aug_TotNewClient = aug_TotNewClient + areaBudgetDets.aug_budg
                                            sep_TotNewClient = sep_TotNewClient + areaBudgetDets.sep_budg
                                            oct_TotNewClient = oct_TotNewClient + areaBudgetDets.oct_budg
                                            nov_TotNewClient = nov_TotNewClient + areaBudgetDets.nov_budg
                                            dec_TotNewClient = dec_TotNewClient + areaBudgetDets.dec_budg                        
                                        }

                                        break;
                                    case "OldLoanClient":
                                        if (areaLnType === "Group Loan" || areaLnType === "Agricultural Loan") {
                                            totBegBalOldClient = totBegBalOldClient + areaBudgetDets.beg_bal
                                            branBegBalOldClient = branBegBalOldClient + areaBudgetDets.beg_bal
                                        }
                                            lnTypBegBalOldClient = lnTypBegBalOldClient + areaBudgetDets.beg_bal
    
                                            jan_vwLonTypOldCli = jan_vwLonTypOldCli + areaBudgetDets.jan_budg
                                            feb_vwLonTypOldCli = feb_vwLonTypOldCli + areaBudgetDets.feb_budg
                                            mar_vwLonTypOldCli = mar_vwLonTypOldCli + areaBudgetDets.mar_budg
                                            apr_vwLonTypOldCli = apr_vwLonTypOldCli + areaBudgetDets.apr_budg
                                            may_vwLonTypOldCli = may_vwLonTypOldCli + areaBudgetDets.may_budg
                                            jun_vwLonTypOldCli = jun_vwLonTypOldCli + areaBudgetDets.jun_budg
                                            jul_vwLonTypOldCli = jul_vwLonTypOldCli + areaBudgetDets.jul_budg
                                            aug_vwLonTypOldCli = aug_vwLonTypOldCli + areaBudgetDets.aug_budg
                                            sep_vwLonTypOldCli = sep_vwLonTypOldCli + areaBudgetDets.sep_budg
                                            oct_vwLonTypOldCli = oct_vwLonTypOldCli + areaBudgetDets.oct_budg
                                            nov_vwLonTypOldCli = nov_vwLonTypOldCli + areaBudgetDets.nov_budg
                                            dec_vwLonTypOldCli = dec_vwLonTypOldCli + areaBudgetDets.dec_budg                        
            
                                        if (areaLnType === "Group Loan" || areaLnType === "Agricultural Loan") {
                                            jan_TotOldClient = jan_TotOldClient + areaBudgetDets.jan_budg
                                            feb_TotOldClient = feb_TotOldClient + areaBudgetDets.feb_budg
                                            mar_TotOldClient = mar_TotOldClient + areaBudgetDets.mar_budg
                                            apr_TotOldClient = apr_TotOldClient + areaBudgetDets.apr_budg
                                            may_TotOldClient = may_TotOldClient + areaBudgetDets.may_budg
                                            jun_TotOldClient = jun_TotOldClient + areaBudgetDets.jun_budg
                                            jul_TotOldClient = jul_TotOldClient + areaBudgetDets.jul_budg
                                            aug_TotOldClient = aug_TotOldClient + areaBudgetDets.aug_budg
                                            sep_TotOldClient = sep_TotOldClient + areaBudgetDets.sep_budg
                                            oct_TotOldClient = oct_TotOldClient + areaBudgetDets.oct_budg
                                            nov_TotOldClient = nov_TotOldClient + areaBudgetDets.nov_budg
                                            dec_TotOldClient = dec_TotOldClient + areaBudgetDets.dec_budg
                                        }
                                    
                                        break;
                                    case "NewLoanAmt":
                                        jan_vwLonTypNewAmt = jan_vwLonTypNewAmt + areaBudgetDets.jan_budg
                                        feb_vwLonTypNewAmt = feb_vwLonTypNewAmt + areaBudgetDets.feb_budg
                                        mar_vwLonTypNewAmt = mar_vwLonTypNewAmt + areaBudgetDets.mar_budg
                                        apr_vwLonTypNewAmt = apr_vwLonTypNewAmt + areaBudgetDets.apr_budg
                                        may_vwLonTypNewAmt = may_vwLonTypNewAmt + areaBudgetDets.may_budg
                                        jun_vwLonTypNewAmt = jun_vwLonTypNewAmt + areaBudgetDets.jun_budg
                                        jul_vwLonTypNewAmt = jul_vwLonTypNewAmt + areaBudgetDets.jul_budg
                                        aug_vwLonTypNewAmt = aug_vwLonTypNewAmt + areaBudgetDets.aug_budg
                                        sep_vwLonTypNewAmt = sep_vwLonTypNewAmt + areaBudgetDets.sep_budg
                                        oct_vwLonTypNewAmt = oct_vwLonTypNewAmt + areaBudgetDets.oct_budg
                                        nov_vwLonTypNewAmt = nov_vwLonTypNewAmt + areaBudgetDets.nov_budg
                                        dec_vwLonTypNewAmt = dec_vwLonTypNewAmt + areaBudgetDets.dec_budg                        
        
                                        jan_brnNewLoanAmt = jan_brnNewLoanAmt + areaBudgetDets.jan_budg
                                        feb_brnNewLoanAmt = feb_brnNewLoanAmt + areaBudgetDets.feb_budg
                                        mar_brnNewLoanAmt = mar_brnNewLoanAmt + areaBudgetDets.mar_budg
                                        apr_brnNewLoanAmt = apr_brnNewLoanAmt + areaBudgetDets.apr_budg
                                        may_brnNewLoanAmt = may_brnNewLoanAmt + areaBudgetDets.may_budg
                                        jun_brnNewLoanAmt = jun_brnNewLoanAmt + areaBudgetDets.jun_budg
                                        jul_brnNewLoanAmt = jul_brnNewLoanAmt + areaBudgetDets.jul_budg
                                        aug_brnNewLoanAmt = aug_brnNewLoanAmt + areaBudgetDets.aug_budg
                                        sep_brnNewLoanAmt = sep_brnNewLoanAmt + areaBudgetDets.sep_budg
                                        oct_brnNewLoanAmt = oct_brnNewLoanAmt + areaBudgetDets.oct_budg
                                        nov_brnNewLoanAmt = nov_brnNewLoanAmt + areaBudgetDets.nov_budg
                                        dec_brnNewLoanAmt = dec_brnNewLoanAmt + areaBudgetDets.dec_budg                       

                                        jan_TotNewLoanAmt = jan_TotNewLoanAmt + areaBudgetDets.jan_budg
                                        feb_TotNewLoanAmt = feb_TotNewLoanAmt + areaBudgetDets.feb_budg
                                        mar_TotNewLoanAmt = mar_TotNewLoanAmt + areaBudgetDets.mar_budg
                                        apr_TotNewLoanAmt = apr_TotNewLoanAmt + areaBudgetDets.apr_budg
                                        may_TotNewLoanAmt = may_TotNewLoanAmt + areaBudgetDets.may_budg
                                        jun_TotNewLoanAmt = jun_TotNewLoanAmt + areaBudgetDets.jun_budg
                                        jul_TotNewLoanAmt = jul_TotNewLoanAmt + areaBudgetDets.jul_budg
                                        aug_TotNewLoanAmt = aug_TotNewLoanAmt + areaBudgetDets.aug_budg
                                        sep_TotNewLoanAmt = sep_TotNewLoanAmt + areaBudgetDets.sep_budg
                                        oct_TotNewLoanAmt = oct_TotNewLoanAmt + areaBudgetDets.oct_budg
                                        nov_TotNewLoanAmt = nov_TotNewLoanAmt + areaBudgetDets.nov_budg
                                        dec_TotNewLoanAmt = dec_TotNewLoanAmt + areaBudgetDets.dec_budg
                                    
                                        break;
                                    case "OldLoanAmt":
                                        jan_vwLonTypOldAmt = jan_vwLonTypOldAmt + areaBudgetDets.jan_budg
                                        feb_vwLonTypOldAmt = feb_vwLonTypOldAmt + areaBudgetDets.feb_budg
                                        mar_vwLonTypOldAmt = mar_vwLonTypOldAmt + areaBudgetDets.mar_budg
                                        apr_vwLonTypOldAmt = apr_vwLonTypOldAmt + areaBudgetDets.apr_budg
                                        may_vwLonTypOldAmt = may_vwLonTypOldAmt + areaBudgetDets.may_budg
                                        jun_vwLonTypOldAmt = jun_vwLonTypOldAmt + areaBudgetDets.jun_budg
                                        jul_vwLonTypOldAmt = jul_vwLonTypOldAmt + areaBudgetDets.jul_budg
                                        aug_vwLonTypOldAmt = aug_vwLonTypOldAmt + areaBudgetDets.aug_budg
                                        sep_vwLonTypOldAmt = sep_vwLonTypOldAmt + areaBudgetDets.sep_budg
                                        oct_vwLonTypOldAmt = oct_vwLonTypOldAmt + areaBudgetDets.oct_budg
                                        nov_vwLonTypOldAmt = nov_vwLonTypOldAmt + areaBudgetDets.nov_budg
                                        dec_vwLonTypOldAmt = dec_vwLonTypOldAmt + areaBudgetDets.dec_budg                        

                                        jan_brnOldLoanAmt = jan_brnOldLoanAmt + areaBudgetDets.jan_budg
                                        feb_brnOldLoanAmt = feb_brnOldLoanAmt + areaBudgetDets.feb_budg
                                        mar_brnOldLoanAmt = mar_brnOldLoanAmt + areaBudgetDets.mar_budg
                                        apr_brnOldLoanAmt = apr_brnOldLoanAmt + areaBudgetDets.apr_budg
                                        may_brnOldLoanAmt = may_brnOldLoanAmt + areaBudgetDets.may_budg
                                        jun_brnOldLoanAmt = jun_brnOldLoanAmt + areaBudgetDets.jun_budg
                                        jul_brnOldLoanAmt = jul_brnOldLoanAmt + areaBudgetDets.jul_budg
                                        aug_brnOldLoanAmt = aug_brnOldLoanAmt + areaBudgetDets.aug_budg
                                        sep_brnOldLoanAmt = sep_brnOldLoanAmt + areaBudgetDets.sep_budg
                                        oct_brnOldLoanAmt = oct_brnOldLoanAmt + areaBudgetDets.oct_budg
                                        nov_brnOldLoanAmt = nov_brnOldLoanAmt + areaBudgetDets.nov_budg
                                        dec_brnOldLoanAmt = dec_brnOldLoanAmt + areaBudgetDets.dec_budg                       

                                        jan_TotOldLoanAmt = jan_TotOldLoanAmt + areaBudgetDets.jan_budg
                                        feb_TotOldLoanAmt = feb_TotOldLoanAmt + areaBudgetDets.feb_budg
                                        mar_TotOldLoanAmt = mar_TotOldLoanAmt + areaBudgetDets.mar_budg
                                        apr_TotOldLoanAmt = apr_TotOldLoanAmt + areaBudgetDets.apr_budg
                                        may_TotOldLoanAmt = may_TotOldLoanAmt + areaBudgetDets.may_budg
                                        jun_TotOldLoanAmt = jun_TotOldLoanAmt + areaBudgetDets.jun_budg
                                        jul_TotOldLoanAmt = jul_TotOldLoanAmt + areaBudgetDets.jul_budg
                                        aug_TotOldLoanAmt = aug_TotOldLoanAmt + areaBudgetDets.aug_budg
                                        sep_TotOldLoanAmt = sep_TotOldLoanAmt + areaBudgetDets.sep_budg
                                        oct_TotOldLoanAmt = oct_TotOldLoanAmt + areaBudgetDets.oct_budg
                                        nov_TotOldLoanAmt = nov_TotOldLoanAmt + areaBudgetDets.nov_budg
                                        dec_TotOldLoanAmt = dec_TotOldLoanAmt + areaBudgetDets.dec_budg
                                    
                                        break;
                                    case "ResClientCount":
                                            jan_vwLonTypResCli = jan_vwLonTypResCli + areaBudgetDets.jan_budg
                                            feb_vwLonTypResCli = feb_vwLonTypResCli + areaBudgetDets.feb_budg
                                            mar_vwLonTypResCli = mar_vwLonTypResCli + areaBudgetDets.mar_budg
                                            apr_vwLonTypResCli = apr_vwLonTypResCli + areaBudgetDets.apr_budg
                                            may_vwLonTypResCli = may_vwLonTypResCli + areaBudgetDets.may_budg
                                            jun_vwLonTypResCli = jun_vwLonTypResCli + areaBudgetDets.jun_budg
                                            jul_vwLonTypResCli = jul_vwLonTypResCli + areaBudgetDets.jul_budg
                                            aug_vwLonTypResCli = aug_vwLonTypResCli + areaBudgetDets.aug_budg
                                            sep_vwLonTypResCli = sep_vwLonTypResCli + areaBudgetDets.sep_budg
                                            oct_vwLonTypResCli = oct_vwLonTypResCli + areaBudgetDets.oct_budg
                                            nov_vwLonTypResCli = nov_vwLonTypResCli + areaBudgetDets.nov_budg
                                            dec_vwLonTypResCli = dec_vwLonTypResCli + areaBudgetDets.dec_budg                        
            
                                        // if (areaLnType === "Group Loan" || areaLnType === "Agricultural Loan") {
                                            jan_TotResClient = jan_TotResClient + areaBudgetDets.jan_budg
                                            feb_TotResClient = feb_TotResClient + areaBudgetDets.feb_budg
                                            mar_TotResClient = mar_TotResClient + areaBudgetDets.mar_budg
                                            apr_TotResClient = apr_TotResClient + areaBudgetDets.apr_budg
                                            may_TotResClient = may_TotResClient + areaBudgetDets.may_budg
                                            jun_TotResClient = jun_TotResClient + areaBudgetDets.jun_budg
                                            jul_TotResClient = jul_TotResClient + areaBudgetDets.jul_budg
                                            aug_TotResClient = aug_TotResClient + areaBudgetDets.aug_budg
                                            sep_TotResClient = sep_TotResClient + areaBudgetDets.sep_budg
                                            oct_TotResClient = oct_TotResClient + areaBudgetDets.oct_budg
                                            nov_TotResClient = nov_TotResClient + areaBudgetDets.nov_budg
                                            dec_TotResClient = dec_TotResClient + areaBudgetDets.dec_budg
    
                                        // }

                                        break;
                                    default:
                                        month = ""
                                        break;
                                }    
    
                            }  // (areaBranCode === brnCode && areaLnType === scanvwloanType) {
            
                        })         // END - SCAN Center_Budget_dets for the Area

                        tot_vwLonTypOldAmt = jan_vwLonTypOldAmt + feb_vwLonTypOldAmt + mar_vwLonTypOldAmt + apr_vwLonTypOldAmt + may_vwLonTypOldAmt + jun_vwLonTypOldAmt
                            + jul_vwLonTypOldAmt + aug_vwLonTypOldAmt + sep_vwLonTypOldAmt + oct_vwLonTypOldAmt + nov_vwLonTypOldAmt + dec_vwLonTypOldAmt


                        const totNewLonAmt = jan_vwLonTypNewAmt + feb_vwLonTypNewAmt + mar_vwLonTypNewAmt + apr_vwLonTypNewAmt + may_vwLonTypNewAmt + jun_vwLonTypNewAmt
                            + jul_vwLonTypNewAmt + aug_vwLonTypNewAmt + sep_vwLonTypNewAmt + oct_vwLonTypNewAmt + nov_vwLonTypNewAmt + dec_vwLonTypNewAmt
                        
                        if (totNewLonAmt > 0) {
                            areaPerLnTypView.push({area: viewAreaCode, branch: brnCode, loan_type: scanvwloanType, title: "New Client", sortkey: ctrPerLonType, group: ctrPerLonTypGrp, jan_value : jan_vwLonTypNewCli, feb_value : feb_vwLonTypNewCli, mar_value : mar_vwLonTypNewCli, 
                                apr_value : apr_vwLonTypNewCli, may_value : may_vwLonTypNewCli, jun_value : jun_vwLonTypNewCli, jul_value : jul_vwLonTypNewCli, 
                                aug_value : aug_vwLonTypNewCli, sep_value : sep_vwLonTypNewCli, oct_value : oct_vwLonTypNewCli, nov_value : nov_vwLonTypNewCli, dec_value : dec_vwLonTypNewCli, tot_value : dec_vwLonTypNewCli
                            })
        
                            areaPerLnTypView.push({area: viewAreaCode, branch: brnCode, loan_type: scanvwloanType, title: "New Amount", sortkey: ctrPerLonType, group: ctrPerLonTypGrp, jan_value : jan_vwLonTypNewAmt, feb_value : feb_vwLonTypNewAmt, mar_value : mar_vwLonTypNewAmt, 
                                apr_value : apr_vwLonTypNewAmt, may_value : may_vwLonTypNewAmt, jun_value : jun_vwLonTypNewAmt, jul_value : jul_vwLonTypNewAmt, 
                                aug_value : aug_vwLonTypNewAmt, sep_value : sep_vwLonTypNewAmt, oct_value : oct_vwLonTypNewAmt, nov_value : nov_vwLonTypNewAmt, dec_value : dec_vwLonTypNewAmt, tot_value : tot_vwLonTypNewAmt
                            })

                        }

                        const totOldLonAmt = jan_vwLonTypOldAmt + feb_vwLonTypOldAmt + mar_vwLonTypOldAmt + apr_vwLonTypOldAmt + may_vwLonTypOldAmt + jun_vwLonTypOldAmt
                            + jul_vwLonTypOldAmt + aug_vwLonTypOldAmt + sep_vwLonTypOldAmt + oct_vwLonTypOldAmt + nov_vwLonTypOldAmt + dec_vwLonTypOldAmt
                        
                        if (totOldLonAmt > 0) {
                            areaPerLnTypView.push({area: viewAreaCode, branch: brnCode, loan_type: scanvwloanType, title: "Old Client", sortkey: ctrPerLonType, group: ctrPerLonTypGrp, beg_bal: lnTypBegBalOldClient, jan_value : jan_vwLonTypOldCli, feb_value : feb_vwLonTypOldCli, mar_value : mar_vwLonTypOldCli, 
                                apr_value : apr_vwLonTypOldCli, may_value : may_vwLonTypOldCli, jun_value : jun_vwLonTypOldCli, jul_value : jul_vwLonTypOldCli, 
                                aug_value : aug_vwLonTypOldCli, sep_value : sep_vwLonTypOldCli, oct_value : oct_vwLonTypOldCli, nov_value : nov_vwLonTypOldCli, dec_value : dec_vwLonTypOldCli, tot_value : dec_vwLonTypOldCli
                            })
        
                            areaPerLnTypView.push({area: viewAreaCode, branch: brnCode, loan_type: scanvwloanType, title: "Old Amount", sortkey: ctrPerLonType, group: ctrPerLonTypGrp, jan_value : jan_vwLonTypOldAmt, feb_value : feb_vwLonTypOldAmt, mar_value : mar_vwLonTypOldAmt, 
                                apr_value : apr_vwLonTypOldAmt, may_value : may_vwLonTypOldAmt, jun_value : jun_vwLonTypOldAmt, jul_value : jul_vwLonTypOldAmt, 
                                aug_value : aug_vwLonTypOldAmt, sep_value : sep_vwLonTypOldAmt, oct_value : oct_vwLonTypOldAmt, nov_value : nov_vwLonTypOldAmt, dec_value : dec_vwLonTypOldAmt, tot_value : tot_vwLonTypOldAmt
                            })

                            areaPerLnTypView.push({area: viewAreaCode, branch: brnCode, loan_type: scanvwloanType, title: "Resign Clients", sortkey: ctrPerLonType, group: ctrPerLonTypGrp, jan_value : jan_vwLonTypResCli, feb_value : feb_vwLonTypResCli, mar_value : mar_vwLonTypResCli, 
                                apr_value : apr_vwLonTypResCli, may_value : may_vwLonTypResCli, jun_value : jun_vwLonTypResCli, jul_value : jul_vwLonTypResCli, 
                                aug_value : aug_vwLonTypResCli, sep_value : sep_vwLonTypResCli, oct_value : oct_vwLonTypResCli, nov_value : nov_vwLonTypResCli, dec_value : dec_vwLonTypResCli, tot_value : dec_vwLonTypResCli
                            })
                        } 


                        lnTypBegBalOldClient = 0
                        jan_vwLonTypNewCli = 0
                        feb_vwLonTypNewCli = 0
                        mar_vwLonTypNewCli = 0
                        apr_vwLonTypNewCli = 0
                        may_vwLonTypNewCli = 0
                        jun_vwLonTypNewCli = 0
                        jul_vwLonTypNewCli = 0
                        aug_vwLonTypNewCli = 0
                        sep_vwLonTypNewCli = 0
                        oct_vwLonTypNewCli = 0
                        nov_vwLonTypNewCli = 0
                        dec_vwLonTypNewCli = 0
            
                        jan_vwLonTypOldCli = 0
                        feb_vwLonTypOldCli = 0
                        mar_vwLonTypOldCli = 0
                        apr_vwLonTypOldCli = 0
                        may_vwLonTypOldCli = 0
                        jun_vwLonTypOldCli = 0
                        jul_vwLonTypOldCli = 0
                        aug_vwLonTypOldCli = 0
                        sep_vwLonTypOldCli = 0
                        oct_vwLonTypOldCli = 0
                        nov_vwLonTypOldCli = 0
                        dec_vwLonTypOldCli = 0
            
                        jan_vwLonTypNewAmt = 0
                        feb_vwLonTypNewAmt = 0
                        mar_vwLonTypNewAmt = 0
                        apr_vwLonTypNewAmt = 0
                        may_vwLonTypNewAmt = 0
                        jun_vwLonTypNewAmt = 0
                        jul_vwLonTypNewAmt = 0
                        aug_vwLonTypNewAmt = 0
                        sep_vwLonTypNewAmt = 0
                        oct_vwLonTypNewAmt = 0
                        nov_vwLonTypNewAmt = 0
                        dec_vwLonTypNewAmt = 0
            
                        jan_vwLonTypOldAmt = 0
                        feb_vwLonTypOldAmt = 0
                        mar_vwLonTypOldAmt = 0
                        apr_vwLonTypOldAmt = 0
                        may_vwLonTypOldAmt = 0
                        jun_vwLonTypOldAmt = 0
                        jul_vwLonTypOldAmt = 0
                        aug_vwLonTypOldAmt = 0
                        sep_vwLonTypOldAmt = 0
                        oct_vwLonTypOldAmt = 0
                        nov_vwLonTypOldAmt = 0
                        dec_vwLonTypOldAmt = 0
            
                        jan_vwLonTypResCli = 0
                        feb_vwLonTypResCli = 0
                        mar_vwLonTypResCli = 0
                        apr_vwLonTypResCli = 0
                        may_vwLonTypResCli = 0
                        jun_vwLonTypResCli = 0
                        jul_vwLonTypResCli = 0
                        aug_vwLonTypResCli = 0
                        sep_vwLonTypResCli = 0
                        oct_vwLonTypResCli = 0
                        nov_vwLonTypResCli = 0
                        dec_vwLonTypResCli = 0
                            tot_vwLonTypNewCli = 0

                    })            // END - SCAN the Loan Types
    
                        jan_oldCliTot = branBegBalOldClient 
                            jan_totNumClients = (jan_oldCliTot + jan_brnNewCliTot) - jan_TotResClient
                        feb_oldCliTot = jan_totNumClients
                            feb_totNumClients = (feb_oldCliTot + feb_brnNewCliTot) - feb_TotResClient    
                        mar_oldCliTot = feb_totNumClients
                            mar_totNumClients = (mar_oldCliTot + mar_brnNewCliTot) - mar_TotResClient
                        apr_oldCliTot = mar_totNumClients
                            apr_totNumClients = (apr_oldCliTot + apr_brnNewCliTot) - apr_TotResClient
                        may_oldCliTot = apr_totNumClients
                            may_totNumClients = (may_oldCliTot + may_brnNewCliTot) - may_TotResClient
                        jun_oldCliTot = may_totNumClients
                            jun_totNumClients = (jun_oldCliTot + jun_brnNewCliTot) - jun_TotResClient
                        jul_oldCliTot = jun_totNumClients
                            jul_totNumClients = (jul_oldCliTot + jul_brnNewCliTot) - jul_TotResClient
                        aug_oldCliTot = jul_totNumClients
                            aug_totNumClients = (aug_oldCliTot + aug_brnNewCliTot) - aug_TotResClient
                        sep_oldCliTot = aug_totNumClients
                            sep_totNumClients = (sep_oldCliTot + sep_brnNewCliTot) - sep_TotResClient
                        oct_oldCliTot = sep_totNumClients
                            oct_totNumClients = (oct_oldCliTot + oct_brnNewCliTot) - oct_TotResClient
                        nov_oldCliTot = oct_totNumClients
                            nov_totNumClients = (nov_oldCliTot + nov_brnNewCliTot) - nov_TotResClient
                        dec_oldCliTot = nov_totNumClients
                            dec_totNumClients = (dec_oldCliTot + dec_brnNewCliTot) - dec_TotResClient
                        
                            jan_brnTotAmtDisburse = jan_brnNewLoanAmt + jan_brnOldLoanAmt
                            feb_brnTotAmtDisburse = feb_brnNewLoanAmt + feb_brnOldLoanAmt
                            mar_brnTotAmtDisburse = mar_brnNewLoanAmt + mar_brnOldLoanAmt
                            apr_brnTotAmtDisburse = apr_brnNewLoanAmt + apr_brnOldLoanAmt
                            may_brnTotAmtDisburse = may_brnNewLoanAmt + may_brnOldLoanAmt
                            jun_brnTotAmtDisburse = jun_brnNewLoanAmt + jun_brnOldLoanAmt
                            jul_brnTotAmtDisburse = jul_brnNewLoanAmt + jul_brnOldLoanAmt
                            aug_brnTotAmtDisburse = aug_brnNewLoanAmt + aug_brnOldLoanAmt
                            sep_brnTotAmtDisburse = sep_brnNewLoanAmt + sep_brnOldLoanAmt
                            oct_brnTotAmtDisburse = oct_brnNewLoanAmt + oct_brnOldLoanAmt
                            nov_brnTotAmtDisburse = nov_brnNewLoanAmt + nov_brnOldLoanAmt
                            dec_brnTotAmtDisburse = dec_brnNewLoanAmt + dec_brnOldLoanAmt
                        
                            ctrAreaOutReach = ctrAreaOutReach + 1
                            ctrAreaDisb = ctrAreaDisb + 1

                        poSumView.push({area: viewAreaCode, branch: brnDesc, loan_type:"", title: "-" +brnDesc, sortkey: ctrAreaOutReach, group: 1, beg_bal: branBegBalOldClient, jan_value : jan_totNumClients, feb_value : feb_totNumClients, mar_value : mar_totNumClients, 
                            apr_value : apr_totNumClients, may_value : may_totNumClients, jun_value : jun_totNumClients, jul_value : jul_totNumClients, aug_value : aug_totNumClients,
                            sep_value : sep_totNumClients, oct_value : oct_totNumClients, nov_value : nov_totNumClients, dec_value : dec_totNumClients, tot_value : dec_totNumClients
                        }) 

                        const totTotDisbAmt = jan_brnTotAmtDisburse + feb_brnTotAmtDisburse + mar_brnTotAmtDisburse + apr_brnTotAmtDisburse + may_brnTotAmtDisburse + jun_brnTotAmtDisburse
                            + jul_brnTotAmtDisburse + aug_brnTotAmtDisburse + sep_brnTotAmtDisburse + oct_brnTotAmtDisburse + nov_brnTotAmtDisburse + dec_brnTotAmtDisburse

                        poSumView.push({area: viewAreaCode, branch: brnDesc, loan_type:"", title: brnDesc, sortkey: ctrAreaDisb, group: 2, beg_bal: 0, jan_value : jan_brnTotAmtDisburse, feb_value : feb_brnTotAmtDisburse, mar_value : mar_brnTotAmtDisburse, 
                            apr_value : apr_brnTotAmtDisburse, may_value : may_brnTotAmtDisburse, jun_value : jun_brnTotAmtDisburse, jul_value : jul_brnTotAmtDisburse, aug_value : aug_brnTotAmtDisburse,
                            sep_value : sep_brnTotAmtDisburse, oct_value : oct_brnTotAmtDisburse, nov_value : nov_brnTotAmtDisburse, dec_value : dec_brnTotAmtDisburse, tot_value : totTotDisbAmt
                        }) 

                        jan_TotalCliOutReach = jan_TotalCliOutReach + jan_totNumClients
                        feb_TotalCliOutReach = feb_TotalCliOutReach + feb_totNumClients
                        mar_TotalCliOutReach = mar_TotalCliOutReach + mar_totNumClients
                        apr_TotalCliOutReach = apr_TotalCliOutReach + apr_totNumClients
                        may_TotalCliOutReach = may_TotalCliOutReach + may_totNumClients
                        jun_TotalCliOutReach = jun_TotalCliOutReach + jun_totNumClients
                        jul_TotalCliOutReach = jul_TotalCliOutReach + jul_totNumClients
                        aug_TotalCliOutReach = aug_TotalCliOutReach + aug_totNumClients
                        sep_TotalCliOutReach = sep_TotalCliOutReach + sep_totNumClients
                        oct_TotalCliOutReach = oct_TotalCliOutReach + oct_totNumClients
                        nov_TotalCliOutReach = nov_TotalCliOutReach + nov_totNumClients
                        dec_TotalCliOutReach = dec_TotalCliOutReach + dec_totNumClients
        
                        jan_TotalAmtDisburse = jan_TotalAmtDisburse + jan_brnTotAmtDisburse
                        feb_TotalAmtDisburse = feb_TotalAmtDisburse + feb_brnTotAmtDisburse
                        mar_TotalAmtDisburse = mar_TotalAmtDisburse + mar_brnTotAmtDisburse
                        apr_TotalAmtDisburse = apr_TotalAmtDisburse + apr_brnTotAmtDisburse
                        may_TotalAmtDisburse = may_TotalAmtDisburse + may_brnTotAmtDisburse
                        jun_TotalAmtDisburse = jun_TotalAmtDisburse + jun_brnTotAmtDisburse
                        jul_TotalAmtDisburse = jul_TotalAmtDisburse + jul_brnTotAmtDisburse
                        aug_TotalAmtDisburse = aug_TotalAmtDisburse + aug_brnTotAmtDisburse
                        sep_TotalAmtDisburse = sep_TotalAmtDisburse + sep_brnTotAmtDisburse
                        oct_TotalAmtDisburse = oct_TotalAmtDisburse + oct_brnTotAmtDisburse
                        nov_TotalAmtDisburse = nov_TotalAmtDisburse + nov_brnTotAmtDisburse
                        dec_TotalAmtDisburse = dec_TotalAmtDisburse + dec_brnTotAmtDisburse

                        branBegBalOldClient = 0
                        jan_brnNewLoanAmt = 0
                        feb_brnNewLoanAmt = 0
                        mar_brnNewLoanAmt = 0
                        apr_brnNewLoanAmt = 0
                        may_brnNewLoanAmt = 0
                        jun_brnNewLoanAmt = 0
                        jul_brnNewLoanAmt = 0
                        aug_brnNewLoanAmt = 0
                        sep_brnNewLoanAmt = 0
                        oct_brnNewLoanAmt = 0
                        nov_brnNewLoanAmt = 0
                        dec_brnNewLoanAmt = 0
            
                        jan_brnOldLoanAmt = 0
                        feb_brnOldLoanAmt = 0
                        mar_brnOldLoanAmt = 0
                        apr_brnOldLoanAmt = 0
                        may_brnOldLoanAmt = 0
                        jun_brnOldLoanAmt = 0
                        jul_brnOldLoanAmt = 0
                        aug_brnOldLoanAmt = 0
                        sep_brnOldLoanAmt = 0
                        oct_brnOldLoanAmt = 0
                        nov_brnOldLoanAmt = 0
                        dec_brnOldLoanAmt = 0

                        jan_brnOldCliTot = 0
                        feb_brnOldCliTot = 0
                        mar_brnOldCliTot = 0
                        apr_brnOldCliTot = 0
                        may_brnOldCliTot = 0
                        jun_brnOldCliTot = 0
                        jul_brnOldCliTot = 0
                        aug_brnOldCliTot = 0
                        sep_brnOldCliTot = 0
                        oct_brnOldCliTot = 0
                        nov_brnOldCliTot = 0
                        dec_brnOldCliTot = 0

                        jan_brnNewCliTot = 0
                        feb_brnNewCliTot = 0
                        mar_brnNewCliTot = 0
                        apr_brnNewCliTot = 0
                        may_brnNewCliTot = 0
                        jun_brnNewCliTot = 0
                        jul_brnNewCliTot = 0
                        aug_brnNewCliTot = 0
                        sep_brnNewCliTot = 0
                        oct_brnNewCliTot = 0
                        nov_brnNewCliTot = 0
                        dec_brnNewCliTot = 0
                        
                        jan_TotResClient = 0 
                        feb_TotResClient = 0
                        mar_TotResClient = 0
                        apr_TotResClient = 0
                        may_TotResClient = 0
                        jun_TotResClient = 0
                        jul_TotResClient = 0
                        aug_TotResClient = 0
                        sep_TotResClient = 0
                        oct_TotResClient = 0
                        nov_TotResClient = 0
                        dec_TotResClient = 0        
                        
                        jan_totNumClients = 0 
                        feb_totNumClients = 0
                        mar_totNumClients = 0
                        apr_totNumClients = 0
                        may_totNumClients = 0
                        jun_totNumClients = 0
                        jul_totNumClients = 0
                        aug_totNumClients = 0
                        sep_totNumClients = 0
                        oct_totNumClients = 0
                        nov_totNumClients = 0
                        dec_totNumClients = 0        

                })   // END - SCAN BRANCHES              

                        poSumView.push({area: viewAreaCode, branch: "", loan_type:"", title: "TOTAL OUTREACH", sortkey: ctrAreaOutReach, group: 1, beg_bal: totBegBalOldClient, jan_value : jan_TotalCliOutReach, feb_value : feb_TotalCliOutReach, mar_value : mar_TotalCliOutReach, 
                            apr_value : apr_TotalCliOutReach, may_value : may_TotalCliOutReach, jun_value : jun_TotalCliOutReach, jul_value : jul_TotalCliOutReach, aug_value : aug_TotalCliOutReach,
                            sep_value : sep_TotalCliOutReach, oct_value : oct_TotalCliOutReach, nov_value : nov_TotalCliOutReach, dec_value : dec_TotalCliOutReach, tot_value : dec_TotalCliOutReach
                        }) 

                        const totTotalDisbAmt = jan_TotalAmtDisburse + feb_TotalAmtDisburse + mar_TotalAmtDisburse + apr_TotalAmtDisburse + may_TotalAmtDisburse + jun_TotalAmtDisburse
                            + jul_TotalAmtDisburse + aug_TotalAmtDisburse + sep_TotalAmtDisburse + oct_TotalAmtDisburse + nov_TotalAmtDisburse + dec_TotalAmtDisburse

                        poSumView.push({area: viewAreaCode, branch: "", loan_type:"", title: "TOTAL DISBURSEMENT", sortkey: ctrAreaDisb, group: 2, beg_bal: 0, jan_value : jan_TotalAmtDisburse, feb_value : feb_TotalAmtDisburse, mar_value : mar_TotalAmtDisburse, 
                            apr_value : apr_TotalAmtDisburse, may_value : may_TotalAmtDisburse, jun_value : jun_TotalAmtDisburse, jul_value : jul_TotalAmtDisburse, aug_value : aug_TotalAmtDisburse,
                            sep_value : sep_TotalAmtDisburse, oct_value : oct_TotalAmtDisburse, nov_value : nov_TotalAmtDisburse, dec_value : dec_TotalAmtDisburse, tot_value : totTotalDisbAmt
                        }) 
                
                    // console.log(poSumView)                        
    
                    let jan_lonTypBranResCli = 0
                    let feb_lonTypBranResCli = 0
                    let mar_lonTypBranResCli = 0
                    let apr_lonTypBranResCli = 0
                    let may_lonTypBranResCli = 0
                    let jun_lonTypBranResCli = 0
                    let jul_lonTypBranResCli = 0
                    let aug_lonTypBranResCli = 0
                    let sep_lonTypBranResCli = 0
                    let oct_lonTypBranResCli = 0
                    let nov_lonTypBranResCli = 0
                    let dec_lonTypBranResCli = 0
    
                    let jan_brLnTypCliTot = 0
                    let feb_brLnTypCliTot = 0
                    let mar_brLnTypCliTot = 0
                    let apr_brLnTypCliTot = 0
                    let may_brLnTypCliTot = 0
                    let jun_brLnTypCliTot = 0
                    let jul_brLnTypCliTot = 0
                    let aug_brLnTypCliTot = 0
                    let sep_brLnTypCliTot = 0
                    let oct_brLnTypCliTot = 0
                    let nov_brLnTypCliTot = 0
                    let dec_brLnTypCliTot = 0

                    console.log(areaPerLnTypView)
                    
                    let scanvwloanType = ""
                    let brnCode = ""
                    let ctrPerLonType2 = ctrPerLonType

                    poSumView.push({title: "PER LOAN TYPE", sortkey: ctrAreaDisb, group: 1, isTitle: true})

                    let budgPerLonTyp = []

                    vwloanType.forEach( lonType => {            // SCAN the Loan Types

                        scanvwloanType = lonType.title
                        const scanVwLoanCode = lonType.loan_type
                        ctr = ctr + 1

                        poSumView.push({title: scanvwloanType, sortkey: ctrPerLonType2 , group: 2, isTitle: true})

                        // budgPerLonTyp = areaPerLnTypView.find({loan_type: scanvwloanType})

                        // console.log(scanvwloanType)
                        
                        ctrPerLonType = ctrPerLonType2 + 1

                        let jan_perLnTypTotAmt = 0
                        let feb_perLnTypTotAmt = 0
                        let mar_perLnTypTotAmt = 0
                        let apr_perLnTypTotAmt = 0
                        let may_perLnTypTotAmt = 0
                        let jun_perLnTypTotAmt = 0
                        let jul_perLnTypTotAmt = 0
                        let aug_perLnTypTotAmt = 0
                        let sep_perLnTypTotAmt = 0
                        let oct_perLnTypTotAmt = 0
                        let nov_perLnTypTotAmt = 0
                        let dec_perLnTypTotAmt = 0
                
                        let beg_perLnTypTotReach = 0
                        let jan_perLnTypTotReach = 0
                        let feb_perLnTypTotReach = 0
                        let mar_perLnTypTotReach = 0
                        let apr_perLnTypTotReach = 0
                        let may_perLnTypTotReach = 0
                        let jun_perLnTypTotReach = 0
                        let jul_perLnTypTotReach = 0
                        let aug_perLnTypTotReach = 0
                        let sep_perLnTypTotReach = 0
                        let oct_perLnTypTotReach = 0
                        let nov_perLnTypTotReach = 0
                        let dec_perLnTypTotReach = 0

                        vwAreaBranches.forEach ( areaBranch => {         //SCAN the Branches
                            const brnDesc = areaBranch.branch_desc
                            brnCode = areaBranch.branch

                            // console.log(brnDesc)


                            let jan_perBranTotCliOutReach = 0
                            let feb_perBranTotCliOutReach = 0
                            let mar_perBranTotCliOutReach = 0
                            let apr_perBranTotCliOutReach = 0
                            let may_perBranTotCliOutReach = 0
                            let jun_perBranTotCliOutReach = 0
                            let jul_perBranTotCliOutReach = 0
                            let aug_perBranTotCliOutReach = 0
                            let sep_perBranTotCliOutReach = 0
                            let oct_perBranTotCliOutReach = 0
                            let nov_perBranTotCliOutReach = 0
                            let dec_perBranTotCliOutReach = 0
                            let tot_perBranTotCliOutReach = 0

                            let jan_perLnTypBrTotAmt = 0
                            let feb_perLnTypBrTotAmt = 0
                            let mar_perLnTypBrTotAmt = 0
                            let apr_perLnTypBrTotAmt = 0
                            let may_perLnTypBrTotAmt = 0
                            let jun_perLnTypBrTotAmt = 0
                            let jul_perLnTypBrTotAmt = 0
                            let aug_perLnTypBrTotAmt = 0
                            let sep_perLnTypBrTotAmt = 0
                            let oct_perLnTypBrTotAmt = 0
                            let nov_perLnTypBrTotAmt = 0
                            let dec_perLnTypBrTotAmt = 0
        
                            let jan_lonTypBranNewCli = 0
                            let feb_lonTypBranNewCli = 0
                            let mar_lonTypBranNewCli = 0
                            let apr_lonTypBranNewCli = 0
                            let may_lonTypBranNewCli = 0
                            let jun_lonTypBranNewCli = 0
                            let jul_lonTypBranNewCli = 0
                            let aug_lonTypBranNewCli = 0
                            let sep_lonTypBranNewCli = 0
                            let oct_lonTypBranNewCli = 0
                            let nov_lonTypBranNewCli = 0
                            let dec_lonTypBranNewCli = 0
                    
                            let jan_lonTypBranNewAmt = 0
                            let feb_lonTypBranNewAmt = 0
                            let mar_lonTypBranNewAmt = 0
                            let apr_lonTypBranNewAmt = 0
                            let may_lonTypBranNewAmt = 0
                            let jun_lonTypBranNewAmt = 0
                            let jul_lonTypBranNewAmt = 0
                            let aug_lonTypBranNewAmt = 0
                            let sep_lonTypBranNewAmt = 0
                            let oct_lonTypBranNewAmt = 0
                            let nov_lonTypBranNewAmt = 0
                            let dec_lonTypBranNewAmt = 0
        
                            let jan_lonTypBranBegBal = 0
                            let jan_lonTypBranOldAmt = 0
                            let feb_lonTypBranOldAmt = 0
                            let mar_lonTypBranOldAmt = 0
                            let apr_lonTypBranOldAmt = 0
                            let may_lonTypBranOldAmt = 0
                            let jun_lonTypBranOldAmt = 0
                            let jul_lonTypBranOldAmt = 0
                            let aug_lonTypBranOldAmt = 0
                            let sep_lonTypBranOldAmt = 0
                            let oct_lonTypBranOldAmt = 0
                            let nov_lonTypBranOldAmt = 0
                            let dec_lonTypBranOldAmt = 0

                            areaPerLnTypView.forEach( areaBrnLontyp => { // SCAN Array of Summary per branch, per Loan Type and view_code
                                const areaLonTyp = areaBrnLontyp.loan_type 
                                const areaBranCod = areaBrnLontyp.branch
                                const areaViewCod = areaBrnLontyp.title


                                if ( areaLonTyp === scanvwloanType && areaBranCod === brnCode) {

                                    switch (areaViewCod) {
                                        case "New Client":
                                            jan_lonTypBranNewCli = areaBrnLontyp.jan_value
                                            feb_lonTypBranNewCli = areaBrnLontyp.feb_value
                                            mar_lonTypBranNewCli = areaBrnLontyp.mar_value
                                            apr_lonTypBranNewCli = areaBrnLontyp.apr_value
                                            may_lonTypBranNewCli = areaBrnLontyp.may_value
                                            jun_lonTypBranNewCli = areaBrnLontyp.jun_value
                                            jul_lonTypBranNewCli = areaBrnLontyp.jul_value
                                            aug_lonTypBranNewCli = areaBrnLontyp.aug_value
                                            sep_lonTypBranNewCli = areaBrnLontyp.sep_value
                                            oct_lonTypBranNewCli = areaBrnLontyp.oct_value
                                            nov_lonTypBranNewCli = areaBrnLontyp.nov_value  
                                            dec_lonTypBranNewCli = areaBrnLontyp.dec_value
                        
                                            break;
                                        case "Old Client":
                                            jan_lonTypBranBegBal = areaBrnLontyp.beg_bal
                                            break;
                                        case "New Amount":
                                            jan_lonTypBranNewAmt = areaBrnLontyp.jan_value
                                            feb_lonTypBranNewAmt = areaBrnLontyp.feb_value
                                            mar_lonTypBranNewAmt = areaBrnLontyp.mar_value
                                            apr_lonTypBranNewAmt = areaBrnLontyp.apr_value
                                            may_lonTypBranNewAmt = areaBrnLontyp.may_value
                                            jun_lonTypBranNewAmt = areaBrnLontyp.jun_value
                                            jul_lonTypBranNewAmt = areaBrnLontyp.jul_value
                                            aug_lonTypBranNewAmt = areaBrnLontyp.aug_value
                                            sep_lonTypBranNewAmt = areaBrnLontyp.sep_value
                                            oct_lonTypBranNewAmt = areaBrnLontyp.oct_value
                                            nov_lonTypBranNewAmt = areaBrnLontyp.nov_value
                                            dec_lonTypBranNewAmt = areaBrnLontyp.dec_value

                                            break;
                                        case "Old Amount":
                                            jan_lonTypBranOldAmt = areaBrnLontyp.jan_value
                                            feb_lonTypBranOldAmt = areaBrnLontyp.feb_value
                                            mar_lonTypBranOldAmt = areaBrnLontyp.mar_value
                                            apr_lonTypBranOldAmt = areaBrnLontyp.apr_value
                                            may_lonTypBranOldAmt = areaBrnLontyp.may_value
                                            jun_lonTypBranOldAmt = areaBrnLontyp.jun_value
                                            jul_lonTypBranOldAmt = areaBrnLontyp.jul_value
                                            aug_lonTypBranOldAmt = areaBrnLontyp.aug_value
                                            sep_lonTypBranOldAmt = areaBrnLontyp.sep_value
                                            oct_lonTypBranOldAmt = areaBrnLontyp.oct_value
                                            nov_lonTypBranOldAmt = areaBrnLontyp.nov_value
                                            dec_lonTypBranOldAmt = areaBrnLontyp.dec_value

                                            break;
                                        case "Resign Clients":

                                            jan_lonTypBranResCli = areaBrnLontyp.jan_value
                                            feb_lonTypBranResCli = areaBrnLontyp.feb_value
                                            mar_lonTypBranResCli = areaBrnLontyp.mar_value
                                            apr_lonTypBranResCli = areaBrnLontyp.apr_value
                                            may_lonTypBranResCli = areaBrnLontyp.may_value
                                            jun_lonTypBranResCli = areaBrnLontyp.jun_value
                                            jul_lonTypBranResCli = areaBrnLontyp.jul_value
                                            aug_lonTypBranResCli = areaBrnLontyp.aug_value
                                            sep_lonTypBranResCli = areaBrnLontyp.sep_value
                                            oct_lonTypBranResCli = areaBrnLontyp.oct_value
                                            nov_lonTypBranResCli = areaBrnLontyp.nov_value
                                            dec_lonTypBranResCli = areaBrnLontyp.dec_value
                                            break;
                                        default:
                                            areaNon = 0

                                    }                                    
                                }  // ( areaLonTyp === scanvwloanType && areaBranCod === brnCode)

                            })  // SCAN Array of Summary per branch, per Loan Type and view_code

                            jan_brLnTypCliTot = jan_lonTypBranBegBal 
                                jan_perBranTotCliOutReach = (jan_brLnTypCliTot + jan_lonTypBranNewCli) - jan_lonTypBranResCli

                            feb_brLnTypCliTot = jan_perBranTotCliOutReach
                                feb_perBranTotCliOutReach = (feb_brLnTypCliTot + feb_lonTypBranNewCli) - feb_lonTypBranResCli    

                            mar_brLnTypCliTot = feb_perBranTotCliOutReach
                                mar_perBranTotCliOutReach = (mar_brLnTypCliTot + mar_lonTypBranNewCli) - mar_lonTypBranResCli

                            apr_brLnTypCliTot = mar_perBranTotCliOutReach
                                apr_perBranTotCliOutReach = (apr_brLnTypCliTot + apr_lonTypBranNewCli) - apr_lonTypBranResCli

                            may_brLnTypCliTot = apr_perBranTotCliOutReach
                                may_perBranTotCliOutReach = (may_brLnTypCliTot + may_lonTypBranNewCli) - may_lonTypBranResCli

                            jun_brLnTypCliTot = may_perBranTotCliOutReach
                                jun_perBranTotCliOutReach = (jun_brLnTypCliTot + jun_lonTypBranNewCli) - jun_lonTypBranResCli

                            jul_brLnTypCliTot = jun_perBranTotCliOutReach
                                jul_perBranTotCliOutReach = (jul_brLnTypCliTot + jul_lonTypBranNewCli) - jul_lonTypBranResCli

                            aug_brLnTypCliTot = jul_perBranTotCliOutReach
                                aug_perBranTotCliOutReach = (aug_brLnTypCliTot + aug_lonTypBranNewCli) - aug_lonTypBranResCli

                            sep_brLnTypCliTot = aug_perBranTotCliOutReach
                                sep_perBranTotCliOutReach = (sep_brLnTypCliTot + sep_lonTypBranNewCli) - sep_lonTypBranResCli

                            oct_brLnTypCliTot = sep_perBranTotCliOutReach
                                oct_perBranTotCliOutReach = (oct_brLnTypCliTot + oct_lonTypBranNewCli) - oct_lonTypBranResCli

                            nov_brLnTypCliTot = oct_perBranTotCliOutReach
                                nov_perBranTotCliOutReach = (nov_brLnTypCliTot + nov_lonTypBranNewCli) - nov_lonTypBranResCli

                            dec_brLnTypCliTot = nov_perBranTotCliOutReach
                                dec_perBranTotCliOutReach = (dec_brLnTypCliTot + dec_lonTypBranNewCli) - dec_lonTypBranResCli
                        
                            jan_perLnTypBrTotAmt = jan_lonTypBranNewAmt + jan_lonTypBranOldAmt
                            feb_perLnTypBrTotAmt = feb_lonTypBranNewAmt + feb_lonTypBranOldAmt
                            mar_perLnTypBrTotAmt = mar_lonTypBranNewAmt + mar_lonTypBranOldAmt
                            apr_perLnTypBrTotAmt = apr_lonTypBranNewAmt + apr_lonTypBranOldAmt
                            may_perLnTypBrTotAmt = may_lonTypBranNewAmt + may_lonTypBranOldAmt
                            jun_perLnTypBrTotAmt = jun_lonTypBranNewAmt + jun_lonTypBranOldAmt
                            jul_perLnTypBrTotAmt = jul_lonTypBranNewAmt + jul_lonTypBranOldAmt
                            aug_perLnTypBrTotAmt = aug_lonTypBranNewAmt + aug_lonTypBranOldAmt
                            sep_perLnTypBrTotAmt = sep_lonTypBranNewAmt + sep_lonTypBranOldAmt
                            oct_perLnTypBrTotAmt = oct_lonTypBranNewAmt + oct_lonTypBranOldAmt
                            nov_perLnTypBrTotAmt = nov_lonTypBranNewAmt + nov_lonTypBranOldAmt
                            dec_perLnTypBrTotAmt = dec_lonTypBranNewAmt + dec_lonTypBranOldAmt

                            jan_perLnTypTotAmt = jan_perLnTypTotAmt + jan_perLnTypBrTotAmt
                            feb_perLnTypTotAmt = feb_perLnTypTotAmt + feb_perLnTypBrTotAmt
                            mar_perLnTypTotAmt = mar_perLnTypTotAmt + mar_perLnTypBrTotAmt
                            apr_perLnTypTotAmt = apr_perLnTypTotAmt + apr_perLnTypBrTotAmt
                            may_perLnTypTotAmt = may_perLnTypTotAmt + may_perLnTypBrTotAmt
                            jun_perLnTypTotAmt = jun_perLnTypTotAmt + jun_perLnTypBrTotAmt
                            jul_perLnTypTotAmt = jul_perLnTypTotAmt + jul_perLnTypBrTotAmt
                            aug_perLnTypTotAmt = aug_perLnTypTotAmt + aug_perLnTypBrTotAmt
                            sep_perLnTypTotAmt = sep_perLnTypTotAmt + sep_perLnTypBrTotAmt
                            oct_perLnTypTotAmt = oct_perLnTypTotAmt + oct_perLnTypBrTotAmt
                            nov_perLnTypTotAmt = nov_perLnTypTotAmt + nov_perLnTypBrTotAmt
                            dec_perLnTypTotAmt = dec_perLnTypTotAmt + dec_perLnTypBrTotAmt

                            beg_perLnTypTotReach = beg_perLnTypTotReach + jan_lonTypBranBegBal
                            jan_perLnTypTotReach = jan_perLnTypTotReach + jan_perBranTotCliOutReach
                            feb_perLnTypTotReach = feb_perLnTypTotReach + feb_perBranTotCliOutReach
                            mar_perLnTypTotReach = mar_perLnTypTotReach + mar_perBranTotCliOutReach
                            apr_perLnTypTotReach = apr_perLnTypTotReach + apr_perBranTotCliOutReach
                            may_perLnTypTotReach = may_perLnTypTotReach + may_perBranTotCliOutReach
                            jun_perLnTypTotReach = jun_perLnTypTotReach + jun_perBranTotCliOutReach
                            jul_perLnTypTotReach = jul_perLnTypTotReach + jul_perBranTotCliOutReach
                            aug_perLnTypTotReach = aug_perLnTypTotReach + aug_perBranTotCliOutReach
                            sep_perLnTypTotReach = sep_perLnTypTotReach + sep_perBranTotCliOutReach
                            oct_perLnTypTotReach = oct_perLnTypTotReach + oct_perBranTotCliOutReach
                            nov_perLnTypTotReach = nov_perLnTypTotReach + nov_perBranTotCliOutReach
                            dec_perLnTypTotReach = dec_perLnTypTotReach + dec_perBranTotCliOutReach
                            
                            ctrPerLonType = ctrPerLonType + 1

                            const totScanvwOutReach = jan_perBranTotCliOutReach + feb_perBranTotCliOutReach + mar_perBranTotCliOutReach + apr_perBranTotCliOutReach + may_perBranTotCliOutReach + jun_perBranTotCliOutReach
                                + jul_perBranTotCliOutReach + aug_perBranTotCliOutReach + sep_perBranTotCliOutReach + oct_perBranTotCliOutReach + nov_perBranTotCliOutReach + dec_perBranTotCliOutReach

                            poSumView.push({loan_type: scanvwloanType, branch: brnDesc, title:  "?" + brnDesc, sortkey: ctrPerLonType , group: 1, beg_bal: jan_lonTypBranBegBal, jan_value : jan_perBranTotCliOutReach, feb_value : feb_perBranTotCliOutReach, mar_value : mar_perBranTotCliOutReach, 
                                apr_value : apr_perBranTotCliOutReach, may_value : may_perBranTotCliOutReach, jun_value : jun_perBranTotCliOutReach, jul_value : jul_perBranTotCliOutReach, aug_value : aug_perBranTotCliOutReach,
                                sep_value : sep_perBranTotCliOutReach, oct_value : oct_perBranTotCliOutReach, nov_value : nov_perBranTotCliOutReach, dec_value : dec_perBranTotCliOutReach, tot_value : dec_perBranTotCliOutReach
                            }) 
                            ctrPerLonType2 = ctrPerLonType + 5

                            const totScanvwDisbAmt = jan_perLnTypBrTotAmt + feb_perLnTypBrTotAmt + mar_perLnTypBrTotAmt + apr_perLnTypBrTotAmt + may_perLnTypBrTotAmt + jun_perLnTypBrTotAmt
                                + jul_perLnTypBrTotAmt + aug_perLnTypBrTotAmt + sep_perLnTypBrTotAmt + oct_perLnTypBrTotAmt + nov_perLnTypBrTotAmt + dec_perLnTypBrTotAmt

                            poSumView.push({loan_type: scanvwloanType, branch: brnDesc, title: brnDesc, sortkey: ctrPerLonType2, group: 1, beg_bal: 0, jan_value : jan_perLnTypBrTotAmt, feb_value : feb_perLnTypBrTotAmt, mar_value : mar_perLnTypBrTotAmt, 
                                apr_value : apr_perLnTypBrTotAmt, may_value : may_perLnTypBrTotAmt, jun_value : jun_perLnTypBrTotAmt, jul_value : jul_perLnTypBrTotAmt, aug_value : aug_perLnTypBrTotAmt,
                                sep_value : sep_perLnTypBrTotAmt, oct_value : oct_perLnTypBrTotAmt, nov_value : nov_perLnTypBrTotAmt, dec_value : dec_perLnTypBrTotAmt, tot_value : totScanvwDisbAmt
                            }) 

                        })

                        const totPerLnTypeOutReach = jan_perLnTypTotReach + feb_perLnTypTotReach + mar_perLnTypTotReach + apr_perLnTypTotReach + may_perLnTypTotReach + jun_perLnTypTotReach
                            + jul_perLnTypTotReach + aug_perLnTypTotReach + sep_perLnTypTotReach + oct_perLnTypTotReach + nov_perLnTypTotReach + dec_perLnTypTotReach

                        poSumView.push({loan_type: scanvwloanType, branch: "", title: scanVwLoanCode + " Outreach", sortkey: ctrPerLonType , group: 1, beg_bal: beg_perLnTypTotReach, jan_value : jan_perLnTypTotReach, feb_value : feb_perLnTypTotReach, mar_value : mar_perLnTypTotReach, 
                            apr_value : apr_perLnTypTotReach, may_value : may_perLnTypTotReach, jun_value : jun_perLnTypTotReach, jul_value : jul_perLnTypTotReach, aug_value : aug_perLnTypTotReach,
                            sep_value : sep_perLnTypTotReach, oct_value : oct_perLnTypTotReach, nov_value : nov_perLnTypTotReach, dec_value : dec_perLnTypTotReach, tot_value : dec_perLnTypTotReach
                        }) 
                        ctrPerLonType2 = ctrPerLonType + 5

                        const totPerLnTypeDisbAmt = jan_perLnTypTotAmt + feb_perLnTypTotAmt + mar_perLnTypTotAmt + apr_perLnTypTotAmt + may_perLnTypTotAmt + jun_perLnTypTotAmt
                            + jul_perLnTypTotAmt + aug_perLnTypTotAmt + sep_perLnTypTotAmt + oct_perLnTypTotAmt + nov_perLnTypTotAmt + dec_perLnTypTotAmt

                        poSumView.push({loan_type: scanvwloanType, branch: "", title: scanVwLoanCode + " Disb. Amount", sortkey: ctrPerLonType2, group: 1, beg_bal: 0, jan_value : jan_perLnTypTotAmt, feb_value : feb_perLnTypTotAmt, mar_value : mar_perLnTypTotAmt, 
                            apr_value : apr_perLnTypTotAmt, may_value : may_perLnTypTotAmt, jun_value : jun_perLnTypTotAmt, jul_value : jul_perLnTypTotAmt, aug_value : aug_perLnTypTotAmt,
                            sep_value : sep_perLnTypTotAmt, oct_value : oct_perLnTypTotAmt, nov_value : nov_perLnTypTotAmt, dec_value : dec_perLnTypTotAmt, tot_value : totPerLnTypeDisbAmt
                        }) 

                    })
                    
                    poSumView.sort( function (a,b) {
                        if ( a.sortkey < b.sortkey ){
                            return -1;
                        }
                        if ( a.sortkey > b.sortkey ){
                            return 1;
                        }
                        return 0;
                    })
            
                    res.render('areas/viewAreaKRAMon', {
                        vwAreaCod: viewAreaCode,
                        poSumView: poSumView,
                        yuser: yuser   
                    })
                // }
        } catch (err) {
            console.log(err)
            res.redirect('/areas/'+ viewAreaCode)
        }
    })
    

    router.get('/expKRAtoExcel/:id', authUser, authRole(ROLE.AM), (req,res) => {

        // let dataForExcel = []
        // dataForExcel = poSumView

        const dataForExcel = poSumView.map(unitExecSum => {
            return [unitExecSum.title, unitExecSum.beg_bal, unitExecSum.jan_value, unitExecSum.feb_value, unitExecSum.mar_value,
                unitExecSum.apr_value, unitExecSum.may_value, unitExecSum.jun_value, unitExecSum.jul_value, unitExecSum.aug_value,
                unitExecSum.sep_value, unitExecSum.oct_value, unitExecSum.nov_value, unitExecSum.dec_value, unitExecSum.tot_value]
        });
    
        console.log(dataForExcel)
    
        let workbook = new excel.Workbook();
        let worksheet = workbook.addWorksheet("Area_KRA_Sum");
        let worksheet1 = workbook.addWorksheet("Area_KRA_Sum2");
    
        worksheet1.columns = [
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
        worksheet1.addRows(dataForExcel)
    
        worksheet.getRow(1).font = { size: 14, bold: true}
        worksheet.getRow(2).font = { size: 12, bold: true}
        worksheet.getRow(6).font = { size: 12, bold: true}
        worksheet.getRow(7).font = { size: 12, bold: true}
        worksheet.getRow(13).font = { size: 12, bold: true}
        worksheet.getRow(11).font = { size: 12, bold: true}

        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
          "Content-Disposition",
          "attachment; filename=" + req.params.id+" - Area_KRA_Sum.xlsx"
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
       


