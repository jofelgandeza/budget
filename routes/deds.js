
const express = require('express')
const router  = express.Router()
const stringify = require('json-stringify-safe')
const app = express()
const { model } = require('mongoose')
const bcrypt = require('bcryptjs')
const { forEach, isNull } = require('lodash')
const _ = require('lodash')

const User = require('../models/user')
const Region = require('../models/region')
const Area = require('../models/area')
const Branch = require('../models/branch')
const Center = require('../models/center')
const Employee = require('../models/employee')
const Loan_type = require('../models/loan_type')
const Budg_exec_sum = require('../models/budg_exec_sum')
const Setting = require('../models/setting')

const { authUser, authRole } = require('../public/javascripts/basicAuth.js')
const { ROLE } = require('../public/javascripts/data.js')

const monthSelect = ["January","February", "March", "April", "May", "June", "July", "August", "September", "October", "November","December"];

// let LoggedUser = {}
// app.use(setSysUser)
let budgetYear = ""


router.get('/:id', authUser, authRole(ROLE.DED), async (req, res) => {
    // res.send('Admin Page')
    const _user = req.user
    const logUser = req.user

    const budget_Year = await Setting.find()


    if (!isNull(budget_Year)) {
        budget_Year.forEach(budgYear => {
            budgetYear = budgYear.budget_year
        })
    }

    res.render('deds/index', {
        dateToday: new Date(),
        ded: "DED",
        yuser : logUser
    })
})

// router.get('/budget/:id', authUser, authRole(ROLE.DED), async (req, res) => {
    // res.send('Ongoing development..')

// View Region per area  - NLO
router.get('/budget/:id', authUser, authRole(ROLE.DED), async (req, res) => {
    
    const regionCode = req.params.id
    const _user = req.user

    const fndPositi = posisyon

    const areaMgrID = "611d088fdb81bf7f61039615"

    let officerName = ""
    let postRegDir = ""
    let postAreaMgr = ""
    let postManager = ""
    let postUnitHead = ""
    let postProgOfr = ""

    let unitLoanTotals = []
    let areaLoanTotals = []
    let areaLoanGrandTot = []
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
    let totbudgEndBal = 0

    let fndRegionEmps = []
    let fndRegion = []

    let foundRegDir = []
    let foundAreaMgr = []
    let foundAreaBranches = []
    let foundAreaUnits = []
    let foundAreaPOs = []

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
        if (fndPositionEmp === "REG_DIR") {
            postRegDir = fndPositID
        }
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

        const areaManager = await Employee.find({position_code: postRegDir}, function (err, foundAreaEmp){
            fndRegionEmps = foundAreaEmp
        })
        const foundRegion = await Region.find({})
            fndRegion = foundRegion
            console.log(fndRegion)


        let i = 0
        fndRegionEmps.forEach( regionEmps => {
            const areaEmpPost = regionEmps.position_code
            const assignCode = regionEmps.assign_code

            const empName = regionEmps.first_name + " " + regionEmps.middle_name.substr(0,1) + ". " + regionEmps.last_name
            
            if( areaEmpPost == postRegDir) {
                foundRegDir.push({assCode: assignCode, emp_name: empName})
            }
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

         totAreas = foundRegDir.length
         totBranches = foundAreaBranches.length
         totUnits = foundAreaUnits.length
         totPOs = foundAreaPOs.length
         
         const loanType = await Loan_type.find({})
 
         const center = await Center.find({}) //, function (err, foundCenters) {
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
             console.log(foundRegDir)
 //           foundPOunits -> foundAreaBranches

     foundRegDir.forEach(rd => {
 
         let regioncode = _.trim(rd.assCode)
         let region_Code = regioncode
         let areaMgrName = rd.emp_name
         let forSortUnitNum = region_Code
 
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
                 region_Code = " "
                 areaMgrName = ""
             } 
             if (typeLoan === "Individual Loan" && region_Code === "TUG") {
                 const typeOfLoan = typeLoan
             }
 
             foundCenter.forEach(center => {
                 const cntrAreaCode = center.area
                 if (cntrAreaCode === regioncode) { 
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
             
             unitLoanTotals.push({sortkey: region_Code, unit: region_Code, unitHead: areaMgrName, loan_type: typeLoan, nnumClient: nloanTotCount, amtDisburse: totAmounts, begClientTot: uBegClientTot,
                 begClientAmt: bClientAmt, ntotAmount: nloanTot, onumClient: oloanTotCount, ototAmount: oloanTot, resiloanTot: resloanTot, budgEndBal: areaBudgEndBal})
 
             nUnitLoanTot = nUnitLoanTot + nloanTot
             nUnitLoanTotCount = nUnitLoanTotCount + nloanTotCount
             oUnitLoanTot = oUnitLoanTot + oloanTot
             oUnitLoanTotCount = oUnitLoanTotCount + oloanTotCount
             resUnitLoanTot = resUnitLoanTot + resloanTot
             begUnitLoanTot = begUnitLoanTot + begLoanTot
             begUnitClientTot = begUnitClientTot + uBegClientTot
             
         })
 
         typeLoan = "AREA TOTALS"
         let totUnitAmounts = nUnitLoanTot + oUnitLoanTot 
         let budgUnitEndBal = (oUnitLoanTotCount + nUnitLoanTotCount + begUnitClientTot) - resUnitLoanTot
 
         unitLoanTotals.push({sortkey: forSortUnitNum, unit: region_Code, unitHead: areaMgrName, loan_type: typeLoan, nnumClient: nUnitLoanTotCount, amtDisburse: totUnitAmounts, begClientTot: begUnitClientTot,
             begClientAmt: begUnitLoanTot, ntotAmount: nUnitLoanTot, onumClient: oUnitLoanTotCount, ototAmount: oUnitLoanTot, resiloanTot: resUnitLoanTot, budgEndBal: budgUnitEndBal})
 
             doneFoundPO = true
     })
 
     if (foundAreaBranches.length === 0) {
         doneFoundPO = true
     }
 
     // console.log(unitLoanTotals)
 // LOOP for getting Different Loan products totals in the area
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
 
         areaLoanTotals.push({loan_type: typeLoan, nnumClient: nloanTotCount, amtDisburse: totareaAmounts, begClientTot: ubegClientTot,
             begClientAmt: begLoanTot, ntotAmount: nloanTot, onumClient: oloanTotCount, ototAmount: oloanTot, resloanTot: resloanTot, budgEndBal: budgareaEndBal})
 
             doneReadLonTyp = true
 
     })
 
    console.log(unitLoanTotals)
    // console.log(areaLoanTotals)
 
             areaLoanGrandTot.push({nClient: newClients, nClientAmt: nClientAmt, oClient: oClient, oClientAmt: oClientAmt, totCenters: totCenters, totPOs: totPOs, totUnits: totUnits, totBranches: totBranches,
                 totAreas: totAreas, rClient: rClient + rClient2, budgBegBal: budgBegBal, budgEndBal: tbudgEndBal, totalDisburse: totDisburse, budBegBalAmt: gtBegBalAmt, budBegBalClient: gtBegBalClient})
 
             console.log(totDisburse)
 
 //            console.log(foundAMBranches)
        if ( doneReadCenter && doneFoundPO && doneReadLonTyp) {
            res.render('deds/budget', {
                listTitle: regionCode,
                officerName: officerName,
                loanTots: areaLoanTotals,
                poGrandTot: areaLoanGrandTot,
                unitLoanTots: unitLoanTotals,
                searchOptions: req.query,
                yuser: _user,
                dateToday: new Date()

            })
        }
    } 
    catch (err) {
        console.log(err)
    }
})

// View KRA per Branch & per month ROUTE
router.get('/viewRegionKRAMon/:id', authUser, authRole(ROLE.DED), async (req, res) => {
res.send("Ongoing development...")
})

// View REGION PROJECTED COLLECTIONS ROUTE
router.get('/viewRegionProjCol/:id', authUser, authRole(ROLE.DED), async (req, res) => {
    res.send('Ongoing development')
})

// View AREA Targets per month ROUTE
router.get('/viewDEDTargetMon/:id', authUser, authRole(ROLE.DED), async (req, res) => {

    const viewRegionCode = req.params.id
    const vwUnitCode = viewRegionCode
    const yuser = req.user

    let foundPOV = []
    // let foundCenterDet = []

    const vwloanType = await Loan_type.find({})
    const brnBudgExecViews = await Budg_exec_sum.find({target_year: budgetYear})

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

        if (!isNull(brnBudgExecViews)) {

            brnBudgExecViews.forEach( TotNumCenter => {

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

            // total Disbursement Amount - for Copying to Area conso and Up
            janTotAmtLoan = jan_newAtotValue + jan_oldAtotValue
            febTotAmtLoan = feb_newAtotValue + feb_oldAtotValue
            marTotAmtLoan = mar_newAtotValue + mar_oldAtotValue
            aprTotAmtLoan = apr_newAtotValue + apr_oldAtotValue
            mayTotAmtLoan = may_newAtotValue + may_oldAtotValue
            junTotAmtLoan = jun_newAtotValue + jun_oldAtotValue
            julTotAmtLoan = jul_newAtotValue + jul_oldAtotValue
            augTotAmtLoan = aug_newAtotValue + aug_oldAtotValue
            sepTotAmtLoan = sep_newAtotValue + sep_oldAtotValue
            octTotAmtLoan = oct_newAtotValue + oct_oldAtotValue
            novTotAmtLoan = nov_newAtotValue + nov_oldAtotValue
            decTotAmtLoan = dec_newAtotValue + dec_oldAtotValue

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

            res.render('deds/viewDEDTargetMon', {
                vwRegionCod: viewRegionCode,
                poSumView: poSumView,
                yuser: yuser   
            })
        }
    } catch (err) {
        console.log(err)
        res.redirect('/regions/'+ viewRegionCode)
    }
})


// View REGION PROJECTED COLLECTIONS ROUTE
router.get('/viewRegionProjInc/:id', authUser, authRole(ROLE.DED), async (req, res) => {

    const viewRegionCode = req.params.id
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

            const poBudgExecTotLonAmt = await Budg_exec_sum.findOne({view_code: "TotLoanAmt"}, function (err, fndTotLonAmt) {
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

                    res.render('deds/viewRegionProjInc', {
                        vwRegionCod: viewRegionCode,
                        poSumView: poTotLoanAmtArray,
                        yuser: yuser
                    })
            
            })

    } catch (err) {
        console.log(err)
        res.redirect('/deds/'+ viewRegionCode)
    }
})


router.get('/region/:id', authUser, authRole(ROLE.DED), async (req, res) => {

    const ded = req.params.id
    const _user = req.user

    let foundRegion = []
    let sortedEmp = []
    let fndRegion = []
    let fndRegions = []
    let doneReadRegion = false
    let employeeName = ""

    let empName = []

    try {

        fndRegion = await Region.find()
        
        let fndEmployee = await Employee.find({})
        
    //            const fndEmployees = foundEmployees
    //            const empStatus = fndEmployees.status
        if (isNull(fndRegion)) {
            doneReadRegion = true
        } else {
            fndRegion.forEach(fndRegions =>{
                id = fndRegions._id
                regionCode = fndRegions.region
                regionDesc = fndRegions.region_desc
                regionEmp = fndRegions.emp_code
                employeeName = ""

                // picked = lodash.filter(arr, { 'city': 'Amsterdam' } );
                const empName = _.find(fndEmployee, {'emp_code': regionEmp})

                if (!empName) {
                } else {
                    employeeName = empName.first_name + " " + _.trim(empName.middle_name).substr(0,1) + ". " + empName.last_name
                }
                foundRegion.push({id: id, regionCode: regionCode, regionDesc: regionDesc, regionEmp: regionEmp, empName: employeeName})

                doneReadRegion = true
            })

                console.log(foundRegion)
            
                sortedRegions= foundRegion.sort( function (a,b) {
                    if ( a.regionCode < b.regionCode ){
                        return -1;
                    }
                    if ( a.regionCode > b.regionCode ){
                        return 1;
                    }
                    return 0;
                })
        }

        if (doneReadRegion || fndRegion.length === 0) {
            res.render('deds/region', {
            ded: 'DED',
            fondRegions: sortedRegions,
            searchOptions: req.query,
            yuser: _user
            })
        }

    } catch (err) {
        console.log(err)
        res.redirect('/')
    }
})

// GET AREAS PER REGION
router.get('/setdedRegions/:id', async (req, res) => {

    const regionCod = req.params.id

    const poNumber = IDcode.substr(5,1)
    const unit_Code = IDcode.substr(0,5)
    const unitCode = IDcode.substr(4,1)
    const branchCode = IDcode.substr(0,3)
    const yuser = req.user

    console.log(IDcode)

    let foundArea = []
    let fndCenter = []
    let doneReadCtr = false

    try {

        // const loanType = await Loan_type.find({})

        const regAreas = await Region.find({region: regionCod}, function (err, foundAreas) {
            foundArea = foundAreas
            doneReadCtr = true

            res.render('deds/area', {
                regionCode: regionCod,
                regions: foundArea,
                yuser: yuser
            })
        })
    } catch (err) {
        console.log(err)
        res.redirect('/deds/region')
    }
})

//
router.get('/setNewRegions', async (req, res) => {

    const yuser = req.user

    let foundRegions = []
    
    let numRegions = 0
    let doneReadPOs = false
    
    try {
        
        foundRegions = await Region.find({})

            res.render('units/setNewRegions', {
                fondRegions: foundRegions,
                numRegions: numRegions,
                uniCod: unitCode,
                lonType: loanType,
                canEditRegionCode: true,
                newRegion : true,
                resetPW: false,
                searchOptions: req.query,
                yuser: yuser
            })
    } catch (err) {
        console.log(err)
        res.redirect('/deds/'+ "DED")
    }
})

router.get('/newRegion/:id', authUser, authRole(ROLE.DED), async (req, res) => {
    // res.send('User Registration Page!')
    const newRegion = new Region()
    try {
        res.render('deds/newRegion', {
            ded: 'DED',
            editRegion: true,
            newRegion : true,
            resetPW: false,
            canEditRegionCode: true,
            user: new User(),
            region: newRegion
        })

    } catch (err) {
        console.log(err)
        res.redirect('/deds/'+ "DED")
    }

})

router.post('/postNewRegion/:id', async (req, res) => {

    let locals
    let canProceed = false
    const ded = req.params.id
    const region_code = _.trim(req.body.regionCode).toUpperCase()
    const trimmedRegionCode = _.replace(region_code, " ", "")
    const region_desc = _.trim(req.body.regionDesc).toUpperCase()

    const nEmail = _.trim(req.body.email).toLowerCase()
    const nPassword = _.trim(req.body.password)

    const validDesc = /[^a-zA-Z0-9. ]/.test(region_desc) // /[^a-zA-Z0-9]+/g

    let validCode = /[^a-zA-Z0-9]/.test(region_code) // /[^a-zA-Z0-9]+/g    

    let fieldsOkay = false

    if (region_code.length == 0 || region_desc.length == 0 || nPassword.length == 0) {
        locals = {errorMessage: "Values for the fields must NOT be space/s!"}
    } else if (trimmedRegionCode.length < 3) {
        locals = {errorMessage: "Values for the REGION CODE field must NOT contain space/s!"}
    } else if (validCode) {
        locals = {errorMessage: "Values for REGION CODE must not contain Special/Space Characters!"}

    } else if (validDesc) {
        locals = {errorMessage: "Values for DESCRIPTION must not contain Special Characters!"}
    } else {
        fieldsOkay = true
    }

    let fndRegion = [ ]
    let getExisRegion
    let UserProceed = false

    let regDescExist = false
    let regCodeExist = false

    try {
        
        if (fieldsOkay) {
             const getExisRegDesc = await Region.findOne({region_desc: region_desc}) //, function (err, foundRegion) {
    
            if (isNull(getExisRegDesc)) {
                canProceed = true 
            } else {
                regDescExist = true
            }
    
            const getExisRegion = await Region.findOne({region: trimmedRegionCode}) //, function (err, foundRegion) {

                if (isNull(getExisRegion) && canProceed) {
                    canProceed = true 
                } else {
                    regCodeExist = true
                }
        
                if (regDescExist && regCodeExist) {
                    locals = {errorMessage: "Region Code " + region_code + " and Description " + region_desc + " already exists! Please try again."}
                } else if (regDescExist && !regCodeExist) {
                    locals = {errorMessage: "Region Description " + region_desc + " already exists! Please try again."}
                } else if (!regDescExist && regCodeExist) {
                    locals = {errorMessage: "Region Code " + region_code + " already exists! Please try again."}
                } else {
                    canProceed = true 
                }

            const hashedPassword = await bcrypt.hash(req.body.password, 10)
                    
            const getExistingUser = await User.findOne({email: nEmail})
                // console.log(foundUser)
                if (!getExistingUser) {
                    if (nPassword.length == 0) {
                        UserProceed = false
                        locals = {errorMessage: 'Password must NOT be SPACE/S!'}
                    } else {
                        UserProceed = true 
                    }
                } else {
                        UserProceed = false
                        locals = {errorMessage: 'Username : ' + nEmail + ' already exists!'}
                }    
    
        }

        if (canProceed && fieldsOkay && UserProceed) {
            let nRegion  = new Region({

                region: region_code,
                region_desc: region_desc,
                emp_code: "",
                office_loc: "",
                address: "",
                num_areas: 0,
                num_branches: 0,
                num_units: 0,
                num_pos: 0,
                num_centers: 0,
                num_areas_budg: 0,
                num_branches_budg: 0,
                num_units_budg: 0,
                num_pos_budg: 0,
                num_centers_budg: 0,
                status: "Active"
            })
        
            const saveRegion = nRegion.save()

            let nUser = new User({
                email: nEmail,
                password: hashedPassword,
                name: "",
                emp_code: "",
                assCode: trimmedRegionCode,
                role: 'RD',
                region: region_code,
                area: 'N/A',
            })
            const saveUser = nUser.save()
    

            res.redirect('/deds/region/' + 'DED')

        } else {
            if (!fieldsOkay) {
                getExisRegion = new Region()
            }

            let errRegion = {region: region_code, region_desc: region_desc}

            res.render('deds/newRegion', {
                ded: 'DED',
                region: errRegion,
                user: new User(),
                editRegion: false,
                newRegion : true,
                resetPW: false,
                canEditRegionCode: true,
                locals: locals
            })
        }

    } catch (err) {
        console.log(err)
        res.redirect('/deds/register/')
    }
})  

 // Get a REGION for EDIT
 router.get('/getRegionForEdit/:id/edit', authUser, authRole(ROLE.DED), async (req, res) => {

    const parame = req.params.id // 'DED' + region.id

    const param = _.trim(parame.substr(3,25))

    const uUnit = req.body.uUnit
    const _user = req.user

    let fondRegion = []
    let regID = ""
    let canEditRegionCode = false
    let doneReadRegion = false
    let regEmpCode =""
    let regAsignCode = ""
    let doneReadYoser = false
    let locals = ""

    try {

        const regForEdit = await Region.findById(param)  
        if (!isNull(regForEdit)) {
            regID = regForEdit.id
            regEmpCode = regForEdit.emp_code
            regAsignCode = regForEdit.region
            if (regEmpCode === "") {
                canEditRegionCode = true
            } else {
                locals = {errorMessage: "REGION CODE is locked for editing, already has transactions."}
            }
            doneReadRegion = true 
        }
        const fondRegion = regForEdit
        console.log(fondRegion)

        const yoser = await User.findOne({assCode: regAsignCode}) //, function (err, foundUser) {
            //            console.log(foundlist)
        if (!isNull(yoser)) {
            fndUser = yoser
            console.log(yoser)

            doneReadYoser = true

            yoser.password = ""
        }

        if (doneReadRegion && doneReadYoser) {

            res.render('deds/editRegion', { 
                regID: regID,
                region: regForEdit, 
                canEditRegionCode: canEditRegionCode,
                locals: locals,
                newRegion : false,
                resetPW: false,
                editRegion: true,
                ded: "DED",
                editRegion: true,
                user : yoser
           })
    
        }


    } catch (err) {
            console.log(err)
            let locals = {errorMessage: 'Something WENT went wrong.'}
            res.redirect('/deds/region/'+ 'DED')
    }
})

// SAVE EDITed Region

router.put('/putEditedRegion/:id', authUser, authRole(ROLE.DED), async function(req, res){

    const parame = req.params.id // 'DED' + region.id

    const param = _.trim(parame.substr(3,25))
    const region_code = _.trim(req.body.regionCode).toUpperCase()
    const trimmedRegionCode = _.replace(region_code, " ", "") // if Region Code can be Edited
    const canEditRegionCode = req.body.canEditRegionCode

    const region_desc = _.trim(req.body.regionDesc).toUpperCase()
    const regionCodeHide = _.trim(req.body.regionCodeHid).toUpperCase()

    let fieldsOkay = false
    let locals
    let validCode

    // if (region_desc.length == 0) {
    //     // locals = {errorMessage: "Values for the fields must NOT be space/s!"}
    // } else {
    //     fieldsOkay = true
    // }

    const validDesc = /[^a-zA-Z0-9 ]/.test(region_desc) // /[^a-zA-Z0-9]+/g

    if (canEditRegionCode === "true") { // Region Code can be edited..
        validCode = /[^a-zA-Z0-9]/.test(trimmedRegionCode) // /[^a-zA-Z0-9]+/g
        if (validCode) {
            locals = {errorMessage: "Values for CODE must not contain Special Characters!"}

        } else if (region_code === regionCodeHide) {
            if (region_desc.length == 0) {
                locals = {errorMessage: "Values for the fields must NOT be space/s!"}
            } else if (validDesc) {
                locals = {errorMessage: "Values for DESCRIPTION must not contain Special Characters!"}
            } else {
                fieldsOkay = true          
            }
        } else if (region_desc.length == 0) {
            locals = {errorMessage: "Values for the fields must NOT be space/s!"}

        } else {
            if (trimmedRegionCode.length < 3) {
                locals = {errorMessage: "Values for the Region CODE field must NOT contain space/s!"}
            } else {
                fieldsOkay = true          
            }
        }
    
    } else { // Region Code is locked for Editing
        if (region_desc.length == 0) {
            locals = {errorMessage: "Values for the fields must NOT be space/s!"}
        } else if (validDesc) {
            locals = {errorMessage: "Values for DESCRIPTION must not contain Special Characters!"}
        } else {
            fieldsOkay = true          
        }
    }

    let canProceed = false
    let sameRegionDesc = false
    let newRegionCode = region_code
    let fndRegion

    let getRegionForEdit

        try {

            if (fieldsOkay) {

                const getExisRegion = await Region.findOne({region_desc: region_desc}) //, function (err, foundregion) {
                    fndRegion = getExisRegion

                    const sameDEesc = _.find(getExisRegion, {region_desc: region_desc})

                    const chkRegionCodeExist = await Region.findOne({region: trimmedRegionCode})

                if (canEditRegionCode === "true") { // Region Code can be edited..
        
                    if (trimmedRegionCode === regionCodeHide) {
                        // No Changes on Region COde
                    } else {

                        if (chkRegionCodeExist) { // may kaparehang Area Code
                                locals = {errorMessage: "Region CODE " + trimmedRegionCode + " already exists!"}    
                        } else {
                            canProceed = true

                        }
                    }

                    if (sameDEesc) {
                        if (sameDEesc.region === regionCodeHide) {
                        } else {
                            sameAreaDesc = true
                            locals = {errorMessage: "Region DESCRIPTION already exists!"}    
        
                        }
                    } else {
                        canProceed = true
    
                    }

                } else {
                    if (sameDEesc) {        
                        if (chkRegionCodeExist) { // may kaparehang Region Code
                            if (chkRegionCodeExist.region === regionCodeHide) {
                                canProceed = true
                            }
                        } else {
                            sameRegionDesc = true
                            locals = {errorMessage: "Region DESCRIPTION already exists!"}
                        }
                    } else {

                        newRegionCode = regionCodeHide
                        canProceed = true

                    }    

                }                            
            }

            getRegionForEdit = await Region.findOne({region: regionCodeHide})                    

                if (canProceed && fieldsOkay && !sameRegionDesc) {

                        getRegionForEdit.region = newRegionCode
                        getRegionForEdit.region_desc = region_desc
                
                        getRegionForEdit.save()

                    if (region_code !== regionCodeHide) {

                        const hashedPassword = await bcrypt.hash(req.body.password, 10)

                        const emailForSearch = regionCodeHide.toLowerCase() + '@kmbi.org.ph'
                        const newEmail = newRegionCode.toLowerCase() + '@kmbi.org.ph'
                        const getUser = await User.findOne({email: emailForSearch})

                        if (!isNull(getUser)) {
                            getUser.email = newEmail
                            getUser.region = newRegionCode
                            getUser.assCode = newRegionCode
                            getUser.password = hashedPassword

                            getUser.save()
                        }


                    }

                        res.redirect('/deds/region/'+ 'DED')

                        // Update USER Collection

                } else {

                    const yoser = await User.findOne({assCode: regionCodeHide}) //, function (err, foundUser) {
                        //            console.log(foundlist)
                    if (!isNull(yoser)) {
                        fndUser = yoser
                        console.log(yoser)
            
                        doneReadYoser = true
            
                    }
            
                    res.render('deds/editRegion', { 
                        regID: param,
                        ded: 'DED',
                       region: getRegionForEdit, 
                       regionCode: regionCodeHide,
                       locals: locals,
                       canEditRegionCode: canEditRegionCode,
                       yuser : req.user,
                       newRegion : false,
                       resetPW: true,
                       editRegion: true,
                       user: yoser
           
                   })

                }    
                
        } catch (err) {
            console.log(err)
            let locals = {errorMessage: 'Something WENT went wrong.'}
            res.redirect('/deds/region/'+ 'DED', {
            locals: locals
            })
        }
  
})

//
router.delete('/deleteRegion/:id', authUser, authRole(ROLE.DED), async (req, res) => {

    let regRegion

    try {
        regRegion = await Region.findById(req.params.id)
        delBranCode = unUnit.branch
        await unUnit.remove()  
        res.redirect('/branches/units/'+delBranCode)
    } catch (err) {
        console.log(err)
    }
})

//View EMPLOYEES per BRANCH Level - TUG

router.get('/employees/:id', authUser, authRole(ROLE.DED), async (req, res) => {

    const areaCode = req.params.id
    const _user = req.user
    
    fndPositi = posisyon

    const regDirID = "611d094bdb81bf7f61039616"

    let fondEmploy = []
    let sortedEmp = []
    let fndPosition = {}
    let empCode = ""
    let empName = ""
    let empPostCode = "REG_DIR"
    let empPost = ""
    let empSortKey = ""
    let empPst
    let empAss = ""
    let empID = ""
    let empUnit = ""
    let regionDirID = ""

    let empCanProceed = false
    let fndEmployees = []
    
    fndPositi.forEach(fndPosii => {
        const fndPositionEmp = fndPosii.code
        const fndPositID = fndPosii.id
        if (fndPositionEmp === "REG_DIR") {
            regionDirID = fndPositID
        }
    })


    try {

        const regions = await Region.find()

        const brnEmployees = await Employee.find({position_code: regionDirID}) // , function (err, foundEmployees) {

            if (!isNull(brnEmployees)) {
                const fndEmployees = brnEmployees

                brnEmployees.forEach(foundEmp =>{
                    empPst = foundEmp.position_code
                    const regDirRegion = foundEmp.region
                    empID = foundEmp._id
                    empName = foundEmp.last_name + ", " + foundEmp.first_name + " " + foundEmp.middle_name.substr(0,1) + "."
                    empCode = foundEmp.emp_code
                    empUnit = foundEmp.unit
                    empUnitPOnum = foundEmp.unit + foundEmp.po_number
                    empAss = foundEmp.assign_code
                    let exist = false
                    let empAssDesc = ""
                    const empAssign = _.find(regions, {region: empAss})
                     if (empAssign) {
                        empAssDesc = empAssign.region_desc
                     } else {

                     }
                    
                    fondEmploy.push({empID: empID, region: regDirRegion, empName: empName, empCode: empCode, empPostCode: empPostCode, empPost: empAssDesc})
    
                })
            }
                
                empCanProceed = true            

            sortedEmp = fondEmploy.sort( function (a,b) {
                if ( a.empName < b.empName ){
                    return -1;
                  }
                  if ( a.empName > b.empName ){
                    return 1;
                  }
                   return 0;
            })        
    
            res.render('deds/employee', {
                ded: "DED",
                fndEmploy: sortedEmp,
                searchOptions: req.query,
                yuser: _user
            })

} catch (err) {
        console.log(err)
        res.render(err)
        // res.redirect('/')
    }
})

// SEARCH FUNCTIONALITIES
router.get('/search/:id', authUser, authRole(ROLE.DED), async (req, res) => {

    let searchOptions = {}
    if (req.query.emp_name  !=null && req.query.emp_name !== '') {
        searchOptions.emp_name = RegExp(req.query.emp_name, 'i')
    }

    let regEmp = []
    let empForSearch = []
    console.log(searchOptions) 
    console.log(req.query) 
    let sortedEmp

    try {
        const employee = await Employee.find(searchOptions)

            sortedEmp = employee.sort( function (a,b) {
                if  ( a.emp_name < b.emp_name ){
                    return -1;
                  }
                  if ( a.emp_name > b.emp_name ){
                    return 1;
                  }
                   return 0;
            })


        res.render('deds/search', {
            emp: sortedEmp,
            ded: "DED",
            searchOptions: req.query,
            region: req.params.id
        })
    } catch(err) {
        console.log(err)
        res.redirect('/deds/' + req.params.id)
    }
})


// New EMPLOYEE Route
router.get('/newEmployee/:id', authUser, authRole(ROLE.DED), async (req, res) => {
    
    const areaCode = req.params.id
    const _user = req.user
    const empStatus = ["Active","Deactivate"]

    // regionPosiID = "611d094bdb81bf7f61039616"
    // let foundRegion = []
    let fndRegions = []

    try {

        const foundRegion = await Region.find({emp_code: ""})

           console.log(foundRegion)
           const newEmp = new Employee()
           const newUser = new User()
   
            res.render('deds/newEmployee', { 
               emp: newEmp, 
               empStatus: empStatus,
               user: newUser,
               ded: "DED",
               foundRegion: foundRegion,
               RegionAsignDesc: "",
               empStatus : empStatus,
               empHasRegionAss: false,
               yuser: _user,
               newEmp: true,
               resetPW: false,
               status: "Active"
           })
   
    } catch (err) {
        console.log(err)
        res.redirect('/')
    }
//    console.log(position)

})

// POST or Save new Employee
router.post('/postNewEmp/:id', authUser, authRole(ROLE.DED), async (req, res) => {
    const _user = req.user
   let eUnit
   let ePONum
   let emptyNameField = false
   let locals
   let nameCanProceed = false

   const empRegCod = req.body.region
    const nEmpCode = _.trim(req.body.empCode).toUpperCase()
    const nLName = _.trim(req.body.lName).toUpperCase()
    const nFName = _.trim(req.body.fName).toUpperCase()
    const nMName = _.trim(req.body.mName).toUpperCase()
    const nName =  nLName + ", " + nFName + " " + nMName
    const empID = req.params.id

    const validEmpCode = /[^a-zA-Z0-9-]/.test(nEmpCode)
    const trimmedEmpCode = _.replace(nEmpCode, " ", "")
    const validLName = /[^a-zA-Z. ]/.test(nLName)
    const validFName = /[^a-zA-Z. ]/.test(nFName)
    const validMName = /[^a-zA-Z. ]/.test(nMName)

    let fieldsOkay = false
    
    if (validEmpCode) {
        locals = {errorMessage: "Employee Code must not contain Special Charecters including Space/s!"}
    } else if (validLName) {
        locals = {errorMessage: "Values for LAST NAME must not contain Special/Space Characters!"}
    } else if (validFName) {
        locals = {errorMessage: "Values for FIRST NAME must not contain Special Characters!"}
    } else if (validMName) {
        locals = {errorMessage: "Values for MIDDLE NAME must not contain Special Characters!"}
    } else if (nEmpCode.length == 0 || nLName.length == 0 || nFName.length == 0 || nMName.length == 0) {
        locals = {errorMessage: 'Field/s must NOT be a SPACE/S!'}
    } else if (req.body.region == null) {
        locals = {errorMessage: "New Employee cannot be saved. There is no available or vacant REGION to tag!"}
        // nameCanProceed = true
    } else {

        fieldsOkay = true
    }    

    console.log(req.body.password)

    let regionDirID = ""

    console.log(req.body.password)

    let fndPositi = posisyon

    fndPositi.forEach(fndPosii => {
        const fndPositionEmp = fndPosii.code
        const fndPositID = fndPosii.id
        if (fndPositionEmp === "REG_DIR") {
            regionDirID = fndPositID
        }
    })

    const empStatus = ["Active","Deactivate"]

//console.log(brnCode)
let getExistingUser = []
let canProceed = false
let UserProceed = false

try {

    const regionEmployees = await Employee.find({})
    console.log(req.params.id)

    const sameName = _.find(regionEmployees, {last_name: nLName, first_name: nFName, middle_name: nMName})

    const sameCode = _.find(regionEmployees, {emp_code: nEmpCode})

    const sameAssign = _.find(regionEmployees, {assign_code: empRegCod})
    console.log(sameAssign)

    if (fieldsOkay) {
        if (regionEmployees.length === 0) {
            canProceed = true
        } else {
            if (sameName) {
                locals = {errorMessage: 'Employee Name: ' + nName + ' already exists!'}
                canProceed = false
            } else if (sameAssign) {
                const codeAssignName = sameAssign.last_name + ', ' + sameAssign.first_name + ' ' + sameAssign.middle_name
                locals = {errorMessage: 'Assign Code: ' + empRegCod + ' has been assigned to ' + codeAssignName}
                canProceed = false
    
            } else if (sameCode) {
                locals = {errorMessage: 'Employee Code: ' + nEmpCode + ' already exists!'}
                canProceed = false
            } else {
                canProceed = true
            }
    
        }
    
    }

    if (canProceed && fieldsOkay)  {
        // if (ePosition === "REG_DIR") {
            const poAssignCode = await Region.findOneAndUpdate({"region": empRegCod}, {$set:{"emp_code": req.body.empCode}})
        // } 

        addedNewUser = true

        const empName = nLName + ' ' + nFName + ' ' + nMName

        let employee = new Employee({

            emp_code: nEmpCode,
            last_name: nLName,
            first_name: nFName,
            middle_name: nMName,
            emp_name: empName,
            position_code: regionDirID,
            assign_code: empRegCod,
            status: "Active",
            po_number: 'N/A',
            unit: 'N/A',
            branch: 'N/A',
            area: 'N/A',
            region: empRegCod,
            status: "Active"
        })
        
        const newCoa = employee.save()

        res.redirect('/deds/employees/'+ req.params.id)
    } 
    else {
        let psitCode = []
        const foundRegion = await Region.find({emp_code: ""})
        
        console.log(psitCode)
        let errEmp
        let errUser = []

            // errUser.push({email: nEmail, password: req.body.password})

            errEmp = {emp_code: nEmpCode, region: empRegCod, last_name: nLName, first_name: nFName, middle_name: nMName, position_code: regionDirID}
            console.log(errEmp)

            res.render('deds/newEmployee', { 
                emp: errEmp, 
                empStatus: empStatus,
                // user: errUser,
                ded: "DED",
                foundRegion: foundRegion,
                empHasRegAss: false,
                 yuser: _user,
                newEmp: true,
                resetPW: false,
                locals: locals
            })
}


} catch (err) {
    console.log(err)
   let locals = {errorMessage: 'Something WENT went wrong.'}
    res.redirect('/deds/employees/'+ 'DED')
}
})

// Get an Employee for EDIT
router.get('/getEmpForEdit/:id/edit', authUser, authRole(ROLE.DED), async (req, res) => {


    const parame = req.params.id // ded + region.id
    const ded = parame.substr(0,3)
    const empCode = _.trim(parame.substr(3,10))

    // areaCod = req.body.area

    console.log(empCode)
    const _user = req.user
    let locals = ""
    let foundEmploy = []
    let dedRegions = []
    let region 
    const empStatus = ["Active","Deactivate"]

    let empHasRegionAss = false
     
   try {
        let brnCod
        const emRegion = await Region.find({}) //, function (err, fnd_Post) {
            // dedRegions = fnd_Post

        emRegion.forEach( regionSelection => {
            const region_Code = regionSelection.region    
            const region_Desc = regionSelection.region_desc
            const region_EmpCode = regionSelection.emp_code

            if (region_EmpCode === "" || region_EmpCode=== empCode) {
                dedRegions.push({region: region_Code, region_desc : region_Desc, region: region_Code})
            }
        })
        dedRegions.push({region: "", region_desc : "", region: ""})
        console.log(dedRegions)

        const empHasRegion = _.find(emRegion, {emp_code: empCode})

        if (empHasRegion) {
            empHasRegionAss = true
            locals = {errorMessage: "Employee Code is locked for editing, already has transactions."}
        }

        const employe = await Employee.findOne({emp_code: empCode}, function (err, foundEmp) {
//            console.log(foundlist)
            foundEmploy = foundEmp
            region = foundEmp.region
        })
        // console.log(employe)
        const newUser = new User()

        res.render('deds/editEmployee', {
            ded: ded,
            empStatus: empStatus,
            foundRegion: dedRegions,
            region: region,
            user: newUser,
            emp: employe, 
            empHasRegionAss: empHasRegionAss,
            locals: locals,
            yuser: _user,
            newEmp: false,
            resetPW: false
       })

//        res.render('centers/edit', { centers: center, coaClass: coaClass })

   } catch (err) {
       console.log(err)
       res.redirect('deds/employees/'+ ded)
   }
})

// SAVE EDITed Employee

router.put('/putEditedEmp/:id', authUser, authRole(ROLE.DED), async function(req, res){

    const paramsID = req.params.id // ded + emp.ID
        console.log(paramsID)

    const ded = paramsID.substr(0,3)
    const empID = _.trim(paramsID.substr(3,45))

    const empStatus1 = ["Active","Deactivate"]
    
    const assCode = req.body.region
    const regionCod = req.body.region
    const empStatus = req.body.empStat

    const eAssCode = assCode
    
    const eCode = _.trim(req.body.empCode).toUpperCase()
    const eLName = _.trim(req.body.lName).toUpperCase()
    const eFName = _.trim(req.body.fName).toUpperCase()
    const eMName = _.trim(req.body.mName).toUpperCase()
    const HidRegionAss = req.body.HideRegionAss
    const HidEmpCode = req.body.HideEmpCode
    const nName =  eLName + ", " + eFName + " " + eMName

    const validEmpCode = /[^a-zA-Z0-9]-/.test(eCode) // /[^a-zA-Z0-9]+/g
    const trimmedEmpCode = _.replace(eCode, " ", "")
    const validLName = /[^a-zA-Z ]/.test(eLName)
    const validFName = /[^a-zA-Z ]/.test(eFName)
    const validMName = /[^a-zA-Z ]/.test(eMName)

    let nameCanProceed = false
    let fieldsOkay = false

    if (validEmpCode) {
        locals = {errorMessage: "Employee Code must not contain Special Charecters including Space/s!"}
    } else if (validLName) {
        locals = {errorMessage: "Values for LAST NAME must not contain Special/Space Characters!"}
    } else if (validFName) {
        locals = {errorMessage: "Values for FIRST NAME must not contain Special Characters!"}
    } else if (validMName) {
        locals = {errorMessage: "Values for MIDDLE NAME must not contain Special Characters!"}
    } else if (HidEmpCode.length == 0 || eLName.length == 0 || eFName.length == 0 || eMName.length == 0) {
        locals = {errorMessage: 'Field/s must NOT be a SPACE/S!'}
        // nameCanProceed = true
    } else {

        fieldsOkay = true
    }

    let dedRegions = []
    let employee
    let canProceed = false

        try {

            if (fieldsOkay) {
                const emRegion = await Region.find({emp_code : ""}) //, function (err, fnd_Post) {
                    dedRegions = emRegion
    
                const employee = await Employee.findById(empID)

                const dedEmployees = await Employee.find({})

                if (dedEmployees) {
                    const sameName = _.find(dedEmployees, {last_name: eLName, first_name: eFName, middle_name: eMName})
            
                    const sameCode = _.find(dedEmployees, {emp_code: eCode})
                
                    const sameAssign = _.find(dedEmployees, {assign_code: eAssCode})
                    console.log(sameAssign)
    
                    if (sameName) {
                        const strEmpID = _.trim(stringify(sameName._id),'"')
                        if (strEmpID === empID) {
                            canProceed = true
                        } else {
                            locals = {errorMessage: 'Employee Name: ' + nName + ' already exists!'}
                            canProceed = false        
                        }
                    } else {
                        canProceed = true
    
                    }
                    if (sameAssign) {
                        const strSameAssign = _.trim(stringify(sameAssign._id),'"')
                        if (strSameAssign === empID) {
                            canProceed = true
                        } else {
                            locals = {errorMessage: 'Assign Code: ' + assCode + ' already exists!'}
                            canProceed = false
    
                        }
                    } else {
                        canProceed = true
    
                    }
                    if (sameCode) {
                        const strSameACode = _.trim(stringify(sameCode._id),'"')
                         if (strSameACode === empID) {
                            canProceed = true
                        } else {
                            locals = {errorMessage: 'Employee Code: ' + nEmpCode + ' already exists!'}
                            canProceed = false    
                        }
                    } else {
                            canProceed = true
        
                    }
                
                } else {
                    canProceed = true
                }
            }

            if (fieldsOkay && canProceed) {

                const empName = eLName + ' ' + eFName + ' ' + eMName

                employee.emp_code = eCode
                employee.last_name = eLName
                employee.first_name = eFName
                employee.middle_name = eMName
                employee.emp_name = empName
                employee.status = empStatus
                employee.assign_code = eAssCode

                if (eAssCode === HidRegionAss) {
                    employee.region = eAssCode

                } else {

                    if (eAssCode === "") {
                        const areaOldAssCode = await Region.findOneAndUpdate({"region": HidRegionAss}, {$set:{"emp_code": ""}})
    
                        const userAssignCode = await User.findOneAndUpdate({"assCode": HidRegionAss}, {$set:{"name": "", "emp_code": "", "region": regionCod }})

                        employee.region = HidRegionAss

                    } else {

                        const fndAffectedEmp = await Employee.findOne({"assign_code": eAssCode}, {$set:{"assign_code": ""}})

                        const oldRegionForUpdate = await Region.findOneAndUpdate({"region ": HidRegionAss}, {$set:{"emp_code": ""}})

                        const areaOldAssCode = await Region.findOneAndUpdate({"region": eAssCode}, {$set:{"emp_code": HidEmpCode}})
    
                        const userToNoEmpcode = await User.findOneAndUpdate({"assCode": HidRegionAss}, {$set:{"name": "", "emp_code": "" }})

                        const userAssignCode = await User.findOneAndUpdate({"assCode": eAssCode}, {$set:{"name": nName, "emp_code": HidEmpCode}})

                        employee.region = eAssCode

                    }                            
                }
       
                await employee.save()
            
                    // const poAssignCode = await Region.findOneAndUpdate({"region": regionCod}, {$set:{"emp_code": eCode}})
    
                    // const userAssignCode = await User.findOneAndUpdate({"assCode": eAssCode}, {$set:{"name": nName, "emp_code": eCode, "region": regionCod}})
    
                    res.redirect('/deds/employees/'+ ded)

            } else {
                const newUser = new User()

                let errEmp = {_id: empID, emp_code: eCode, last_name : eLName, first_name : eFName, middle_name : eMName,
                    status : empStatus, assign_code : eAssCode, region: req.user.region}

                res.render('deds/editEmployee', {
                    ded: ded,
                    empStatus: empStatus1,
                    foundRegion: dedRegions,
                    user: newUser,
                    emp: errEmp, 
                    empHasRegionAss: true,
                    locals: locals,
                    yuser: req.user,
                    newEmp: false,
                    resetPW: false
               })
        
            }

        } catch (err) {
            console.log(err)
            let locals = {errorMessage: 'Something WENT went wrong.'}
            res.redirect('/deds/employees/'+ ded, {
            locals: locals
            })
        }
  
})

// GET Employee User for RESET PASSWORD
router.get('/getEmpEditPass/:id/edit', authUser, authRole(ROLE.DED), async (req, res) => {

    const parame = req.params.id // ded + emp_code
    const ded = parame.substr(0,3)
    const regCode = _.trim(parame.substr(3,10))


   const paramsID = req.params.id
        console.log(paramsID)
    const branCod = req.body.branCode
    const empID = req.params.id

    const _user = req.user
    let locals = ""
    let regionAsignCode = ""
    let areaAsignDesc = ""
    let foundEmploy = []
    let dedRegions = []
    
    let ass_Code = ""
    let doneReadEmp = false
    let doneReadRegion = false
    let doneReadYoser = false

   try {
//         const employe = await Employee.findOne({emp_code: empCode}) //, function (err, foundEmp) {
        
//         if (!isNull(employe)) {
//             foundEmploy = employe
//             brnCod = employe.branch
//             possit = _.trim(employe.position_code)
//            console.log(possit)
//            regionAsignCode = employe.assign_code

//         }
// //            console.log(foundlist)
        
        const region = await Region.findOne({region: regCode}) //, function (err, fndArea) {
        
        if (!isNull(region)) {
            regionAsignCode = region.region_desc
            dedRegions = region

            doneReadRegion = true
        }
    
            // console.log(employe)
        const yoser = await User.findOne({assCode: regCode}) //, function (err, foundUser) {
        
        if (!isNull(yoser)) {
            fndUser = yoser
            console.log(fndUser)

            yoser.password = ""
            doneReadYoser = true
        
        }
            //            console.log(foundlist)

        if (doneReadRegion && doneReadYoser ) {
            res.render('deds/resetPassword', {
                ded: "DED",
                region: region,
                canEditRegionCode : false,
                newRegion : false,
                user: yoser,
                locals: locals,
                editRegion: false,
                yuser: _user,
                newEmp: false,
                resetPW: true
           })
    
        }


//        res.render('centers/edit', { centers: center, coaClass: coaClass })

   } catch (err) {
       console.log(err)
       res.redirect('deds/'+ 'DED')
   }
})

router.put('/putEditedPass/:id', authUser, authRole(ROLE.DED), async function(req, res){

    const paramsID = req.params.id // 'DED' + emp.id

    const regionCod = _.trim(paramsID.substr(3,3))
    // empID = req.params.id
    const ded = _.trim(paramsID.substr(0,3))
    // const regionCod = _.trim(paramsID.substr(3,10))
    const newPassword = _.trim(req.body.password)
    const userID = req.body.user_id

    // let getExistingUser
    
        try {
            const hashdPassword = await bcrypt.hash(newPassword, 10)
            let getExistingUser = await User.findOne({assCode: regionCod})

                getExistingUser.password = hashdPassword
                const savedNewPW = getExistingUser.save()
        
            res.redirect('/deds/region/'+ ded)

        } catch (err) {
            console.log(err)
            let locals = {errorMessage: 'Something WENT went wrong.'}
            res.redirect('/deds/region/'+ ded)
        }
  
})

router.get('/users', async (req, res) => {
    res.send('System USERS VIEW Page! - ONGOING DEVELOPMENT.')
    // res.render('admins/register')
})

router.get('/getAccess', async (req, res) => {
    res.send('User access page' + req.user.name)
})
// function setSysUser(req, res, next) {
//     const LogUser = req.user
//     if (LogUser) {
//         LoggedUser = LogUser
//     }
//     next()
//   }

module.exports = router