const { query } = require('express')
const express = require('express')
const { model } = require('mongoose')
const router  = express.Router()
// const Swal = require('sweetalert2')
const Center = require('../models/center')
const Employee = require('../models/employee')
const Loan_type = require('../models/loan_type')
const Center_budget_det = require('../models/center_budget_det')
const Center_det_budg_view = require('../models/center_det_budg_view')
const Budg_exec_sum = require('../models/budg_exec_sum')
const Setting = require('../models/setting')
const _ = require('lodash')
const sortArray = require('../public/javascripts/sortArray.js')
const { forEach, isNull, constant } = require('lodash')
const { authUser, authRole } = require('../public/javascripts/basicAuth.js')
const user = require('../models/user')
const User_log = require('../models/user_log')
const excel = require('exceljs')
const Cleave = require('../public/javascripts/cleave.js')
const { lookup } = require('geoip-lite')
const loan_type = require('../models/loan_type')


const monthSelect = ["January","February", "March", "April", "May", "June", "July", "August", "September", "October", "November","December"];
const begMonthSelect = ["January","February", "March", "April", "May", "June"];

let poSumView = []
let poCenters = []
let loanTypes = []
let budgetYear = ""

router.get('/:id', authUser, authRole("PO"), async (req, res) => {

    const IDcode = req.params.id

    const poNumber = IDcode.substr(5,1)
    const unitCode = IDcode.substr(4,1)
    const branchCode = IDcode.substr(0,3)
    const assignCode = IDcode.substr(0,6)
    const yuser = req.user

    console.log(IDcode)

    let poLoanTotals = []
     let poLoanGrandTot = []
     let foundCenter = []

     let nClient = 0
     let nClientAmt = 0
     let oClient = 0
     let oClientAmt = 0
     let rClient = 0
     let rClient2 = 0
     let bClient = 0
     let tbudgEndBal = 0
     let totDisburse = 0
     let lnType 
     let POname =" "
     let POposition = " "
    //  let center = []
     let POData = []
     let ctrResBudgDet = []

    let doneCenterRead = false
    let doneLoanTypeRead = false

    let budget_Mode = ""
    
    const budget_Year = await Setting.find({})

    ctrResBudgDet = await Center_budget_det.find({po_code: IDcode, view_code: "ResClientCount", target_year: budgetYear})


    if (!isNull(budget_Year)) {
        budget_Year.forEach(budgYear => {
            budgetYear = budgYear.budget_year
        })
    }

    console.log(budgetYear)

    try {

        POdata = await Employee.findOne({assign_code: assignCode}, function (err, foundedEmp) {
            POname = foundedEmp.first_name + " " + foundedEmp.middle_name.substr(0,1) + ". " + foundedEmp.last_name
            POposition = foundedEmp.position_code
        })
                //  console.log(ctrResBudgDet)
         
        loanTypes = await Loan_type.find()

        const center = await Center.find({branch: branchCode, unit: unitCode, po: poNumber}, function (err, fndPOCenters) {
            poCenters = fndPOCenters
            // console.log(poCenters)
        })
   
        let totDisburseAmt = 0
        // console.log(center)

        if (poCenters.length == 0) {
            doneCenterRead = true
        }

        loanTypes.forEach(loan_type => {
            let typeLoan = loan_type.title
            let nloanTot = 0
            let nloanTotCount = 0
            let oloanTot = 0
            let oloanTotCount = 0
            let resloanTot = 0
            let begLoanTot = 0
            let begClientTot = 0
            let budgEndBal = 0

            lnType = loan_type.loan_type

            center.forEach(center => {
                const lnType = center.loan_code
                let centerTargets = center.Targets
                let LoanBegBal = center.Loan_beg_bal
//                let centerLoanBegBal = center.Loan_beg_bal                
                let resignClient = center.resClient + center.resClient2
                
                if (lnType === _.trim(lnType)) {
                    BudgBegBal = center.budget_BegBalCli
                }

                centerTargets.forEach(centerLoan => {
                    if (_.trim(centerLoan.loan_type) === _.trim(typeLoan) && centerLoan.target_year === budgetYear) {
                        const loanRem = centerLoan.remarks
                        if (_.trim(loanRem) === "New Loan") {
                            nloanTot = nloanTot + centerLoan.totAmount
                            nloanTotCount = nloanTotCount + centerLoan.numClient
                            nClient = nClient + centerLoan.numClient
                        } else {
                            oloanTot = oloanTot + centerLoan.totAmount
                            oloanTotCount = oloanTotCount + centerLoan.numClient
                            // resloanTot = resloanTot + centerLoan.resignClient
                            oClient = oClient + centerLoan.numClient
                        }
                        // rClient = rClient + centerLoan.resignClient
                    }
                })
                    // rClient = rClient + resignClient

                LoanBegBal.forEach(centerBegBal => {
                    if (_.trim(centerBegBal.loan_type) === _.trim(typeLoan) && centerBegBal.target_year === budgetYear) {
                        const loan_type = centerBegBal.loan_type
                        if (loan_type === "Group Loan" || loan_type === "Agricultural Loan" || loan_type === "Individual Loan - IMEP") {
                            begLoanTot = centerBegBal.beg_amount
                            begClientTot = begClientTot+ centerBegBal.beg_client_count
                            bClient = bClient + centerBegBal.beg_client_count
    
                        }

                    }
                })
                doneCenterRead = true
            })

            if (!isNull(ctrResBudgDet)) {
                ctrResBudgDet.forEach(fndResCli => {
                    if (fndResCli.loan_type === typeLoan ) {
                        const totalResCnt = fndResCli.jan_budg + fndResCli.feb_budg + fndResCli.mar_budg + fndResCli.apr_budg + fndResCli.may_budg + fndResCli.jun_budg + 
                            fndResCli.jul_budg + fndResCli.aug_budg + fndResCli.sep_budg + fndResCli.oct_budg + fndResCli.nov_budg + fndResCli.dec_budg 
                        resloanTot = resloanTot + totalResCnt

                        rClient = rClient + totalResCnt
                    }
                })
            }

            let totAmounts = nloanTot + oloanTot 

            if (typeLoan === "Group Loan" || typeLoan === "Agricultural Loan" || typeLoan === "Individual Loan - IMEP") {
                budgEndBal =  (begClientTot +  nloanTotCount) - resloanTot
                
            }
                totDisburseAmt = totDisburseAmt + totAmounts
            
            poLoanTotals.push({loan_type: typeLoan, nnumClient: nloanTotCount, amtDisburse: totAmounts, begClientTot: begClientTot,
                ntotAmount: nloanTot, onumClient: oloanTotCount, ototAmount: oloanTot, resloanTot: resloanTot, budgEndBal: budgEndBal})

            resloanTot = 0
            tbudgEndBal = tbudgEndBal + budgEndBal

            doneLoanTypeRead = true
        })

        poLoanGrandTot.push({nClient: nClient, nClientAmt: nClientAmt, oClient: oClient, oClientAmt: oClientAmt, 
            rClient: rClient, bClient: bClient, budgEndBal: tbudgEndBal, totDisburse: totDisburseAmt})


            if (doneCenterRead && doneLoanTypeRead) {
                res.render('centers/viewTargets', {
                    POname: POname,
                    poCode: IDcode,
                    loanTots: poLoanTotals,
                    poGrandTot: poLoanGrandTot,
                    searchOptions: req.query,
                    yuser: yuser,
                    dateToday: new Date()
                })
            }
        } catch (err) {
            console.log(err)
            res.redirect('/')
        }
})


router.get('/viewTarget/:id', authUser, authRole("PO", "BM"), async (req, res) => {

    const paramsID = req.params.id
    const IDcode = paramsID.substr(0,6)
    const viewStat = paramsID.substr(6,11) // "target_mode"/ "recalc_mode"

    const poNumber = IDcode.substr(5,1)
    const unitCode = IDcode.substr(4,1)
    const branchCode = IDcode.substr(0,3)
    const assignCode = IDcode.substr(0,6)
    const yuser = req.user

    console.log(poCenters)

     let foundCenter = []

     let nClient = 0
     let nClientAmt = 0
     let oClient = 0
     let oClientAmt = 0
     let rClient = 0
     let rClient2 = 0
     let bClient = 0
     let resignClient = 0
     let budgBegBal = 0
     let budgBegBalCli = 0
     let totDisburse = 0
     let lnType 
     let POname =" "
     let POposition = " "
     const POdata = await Employee.findOne({assign_code: assignCode}, function (err, foundedEmp) {
        POname = foundedEmp.first_name + " " + foundedEmp.middle_name.substr(0,1) + ". " + foundedEmp.last_name
        POposition = foundedEmp.position_code
    })

    let doneCenterRead = false
    let doneLoanTypeRead = false
    let forSortTargets = []
    let sortedTargets = []

    let budget_Mode = ""
    let targCenters = []
    let loanTermOption = []

    let totBeginBal = 0
    let totNewLoanCli = 0
    let totOldLoanCli = 0
    let totResign = 0
    let totEndingBal = 0
    let totNewLoanAmt = 0
    let totOldLoanAmt = 0
    let totalDisAmt = 0

//    console.log(POname)
    try {

        // const loanType = await Loan_type.find({})
        // center = await Center.find({branch: branchCode, unit: unitCode, po: poNumber}, function (err, fndPOCenters) {
        //     targCenters = fndPOCenters
        //     // console.log(poCenters)
        // })

        const budg_setting = await Setting.find({}, function (err, foundSettings) {
            foundSettings.forEach(fndSet =>{
                budget_Mode = fndSet.status
            })

        })

        // budget_Mode = "Open"

//        const updateCtrForView = await Center.find()

        const center = await Center.find({branch: branchCode, unit: unitCode, po: poNumber}, function (err, foundPOctr) {

        })
   
        if (center.length == 0) {
            doneCenterRead = true
        
        } else {
            // nClient = _.sumBy(center, function(o) { return o.newClient; });
            // nClientAmt = _.sumBy(center, function(o) { return o.newClientAmt; });
            // oClient = _.sumBy(center, function(o) { return o.oldClient; });
            // oClientAmt = _.sumBy(center, function(o) { return o.oldClientAmt; });
            // rClient = _.sumBy(center, function(o) { return o.resClient; });
            // rClient2 = _.sumBy(center, function(o) { return o.resClient2; });
            // budgBegBal = _.sumBy(center, function(o) { return o.budget_BegBal; });
            // budgBegBalCli = _.sumBy(center, function(o) { return o.budget_BegBalCli; });
            // // tbudgEndBal = (oClient + nClient) - rClient
            // totDisburse = nClientAmt + oClientAmt

            foundCenter = center
            doneCenterRead = true

            foundCenter.forEach( list => {
                
                const _id = list._id
                const fndCenter = list.center
                let fndbudget_BegBalCli = 0
                if (list.budget_BegBalCli > 0) {
                    fndbudget_BegBalCli = list.budget_BegBalCli
                } else {
                    fndbudget_BegBalCli = 0
                }
                const fndnewClient = list.newClient
                const fndnewClientAmt = list.newClientAmt
                const fndoldClient = list.oldClient
                const fndoldClientAmt = list.oldClientAmt
                const fndresClient = list.resClient
                const fndresClient2 = list.resClient2
                const fndTargets = list.Targets

                let fTargNewCli = 0
                let fTargNewAmt = 0
                let fTargReloanCli = 0
                let fTargReloanAmt = 0
                let fTargEndBal = 0

                fndTargets.forEach( fTargets => {
                    const fTargTotAmt = fTargets.totAmount
                    const loan_type = fTargets.loan_type

                    if (fTargets.target_year === budgetYear) {

                        if (fTargets.remarks === "New Loan") {
                            fTargNewAmt = fTargNewAmt + fTargTotAmt 

                            if (loan_type === "Group Loan" || loan_type === "Agricultural Loan" || loan_type === "Individual Loan - IMEP") {
                                fTargNewCli = fTargNewCli + fTargets.numClient
                            }

                        } 
                        else {
                            fTargReloanAmt = fTargReloanAmt + fTargTotAmt

                            if (loan_type === "Group Loan" || loan_type === "Agricultural Loan" || loan_type === "Individual Loan - IMEP") {
                                fTargReloanCli = fTargReloanCli + fTargets.numClient
                            }

                        }
                        
                    }
                })
                fTargEndBal = (fndbudget_BegBalCli + fTargNewCli) - (fndresClient + fndresClient2)
                let totDisbAmt = fTargNewAmt + fTargReloanAmt

                
                totBeginBal = totBeginBal + fndbudget_BegBalCli
                totNewLoanCli = totNewLoanCli + fTargNewCli
                totOldLoanCli = totOldLoanCli + fTargReloanCli
                totResign = totResign + (fndresClient + fndresClient2)
                totEndingBal = totEndingBal + fTargEndBal
                totNewLoanAmt = totNewLoanAmt + fTargNewAmt
                totOldLoanAmt = totOldLoanAmt + fTargReloanAmt
                totalDisAmt = totalDisAmt + totDisbAmt
    
                const sortKey = _.toString(list.center) + list.loan_type + list.remarks + _.toString(list.monthOrder)

                forSortTargets.push({_id: _id, sortKey: sortKey, center: fndCenter, budget_BegBalCli: fndbudget_BegBalCli, newClient: fTargNewCli, newClientAmt: fTargNewAmt, 
                    oldClient: fTargReloanCli, oldClientAmt: fTargReloanAmt, resClient: fndresClient, resClient2: fndresClient2, endBalanceCli: fTargEndBal, totDisbAmt: totDisbAmt})

            }) 
            forSortTargets.push({_id: '_id', sortKey: "ZZZZZ", center: "TOTAL", budget_BegBalCli: totBeginBal, newClient: totNewLoanCli, newClientAmt: totNewLoanAmt, 
                oldClient: totOldLoanCli, oldClientAmt: totOldLoanAmt, resClient: totResign, resClient2: 0, endBalanceCli: totEndingBal, totDisbAmt: totalDisAmt})


            sortedTargets = forSortTargets.sort( function (a,b) {
                if ( a.sortKey < b.sortKey ){
                    return -1;
                }
                if ( a.sortKey > b.sortKey ){
                    return 1;
                }
                return 0;
            })


        }
    
            if (doneCenterRead) {
                res.render('centers/index', {
                    POname: POname,
                    poCode: IDcode,
                    centers: forSortTargets,
                    searchOptions: req.query,
                    budget_Mode: budget_Mode,
                    viewStat: viewStat,
                    yuser: yuser   
                })
            }
        } catch (err) {
            console.log(err)
            res.redirect('/')
        }
})

// Edit Targets of a particular CENTER
router.get('/:id/edit', authUser, authRole("PO", "BM"), async (req, res) => {

     centerCode = req.params.id
     unit_ID = centerCode.substr(0,6)
     poCode = centerCode.substr(0,6)
    const yuser = req.user
     
    let forSortTargets = []
    let sortedTargets = []  
    let doneRedEditCenter = false
    let ctrBrkDownTots = []
    let totCntrBudgAmt = 0
    let begBalData = []

    let totNewCliSem1 = 0
    let totNewAmtSem1 = 0
    let totNewCliSem2 = 0
    let totNewAmtSem2 = 0

    let totOldCliSem1 = 0
    let totOldAmtSem1 = 0
    let totOldCliSem2 = 0
    let totOldAmtSem2 = 0

    let totLoanAmount = 0
        
    let totBegBal1 = 0
    let totBegBal2 = 0

    let budget_Mode = ""
    let centerLoanType = ""
    let lastMonSelect = ""
    let defaultPeriod = ""
    let ctrLonTypSelect = []
    let doneReadCenters = false
    let ctrLonTermSelect = []


    ctrLonTypSelect = await Loan_type.find({})

    try {

        const budg_setting = await Setting.find({}, function (err, foundSettings) {
            foundSettings.forEach(fndSet =>{
                budget_Mode = fndSet.status
            })

        })

        // budget_Mode = "Open"

        // loanTypes = await Loan_type.find()


//        console.log(loanType)
        const Editcenter = await Center.findOne({center: req.params.id}, function (err, foundlist) {
            centerLoanType = foundlist.loan_type
            
            const ctrTarget = foundlist.Targets
            if (ctrTarget.length == 0) {
                defaultPeriod = "First Half"

            } else {
                ctrTarget.forEach(centerTarget =>{
                    lastMonSelect = centerTarget.month
                    if (centerTarget.target_year === budgetYear) {
                        if (lastMonSelect === "January" || lastMonSelect === "February" || lastMonSelect === "March" || lastMonSelect === "April" || lastMonSelect === "May" || lastMonSelect === "June") {
                            defaultPeriod = "First Half"
                        } else  {
                            defaultPeriod = "Second Half"
        
                        }    
                    }
                })
    
            }
            doneReadCenters = true
        })

        if (doneReadCenters && Editcenter.length !== 0) {

            if (centerLoanType === "Group Loan") {
                ctrLonTypSelect = await Loan_type.find({glp_topUp:true}, function (err, foundLoan) {
                    const ewan = foundLoan    
                })
                loanTermOption = ["6 Months", "3 Months", "2 Months"]
            } else {

                if (centerLoanType === "Agricultural Loan") {
                    ctrLonTypSelect = await Loan_type.find({agl_topUp:true}, function (err, foundLoan) {
                        const ewan = foundLoan    
                    })                        
                    loanTermOption = ["6 Months", "2 Months"]
                } 
                if (centerLoanType === "Individual Loan - IMEP") {

                    ctrLonTypSelect = await Loan_type.find({title:centerLoanType}, function (err, foundLoan) {
                        const ewan = foundLoan    
                    })
                    loanTermOption = ["12 Months", "6 Months"]

                }

            }

            
            let totResign1 = Editcenter.resClient
            let totResign2 = Editcenter.resClient2

            Editcenter.Loan_beg_bal.forEach( listBeg => {
                const begLonType = listBeg.loan_type
                const begMonth = listBeg.expected_maturity_date
                const begClient = listBeg.beg_client_count
                const begPrincipal = listBeg.beg_principal
                const begInterest = listBeg.beg_interest

                if (listBeg.target_year === budgetYear) { 

                    if (begLonType === "Group Loan" || begLonType === "Agricultural Loan" || begLonType === "Individual Loan - IMEP") {
                        totBegBal1 = begClient
                    }
    
                    begBalData.push({begLonType: begLonType, begMon : begMonth, begClient: begClient, begPrincipal: begPrincipal, begInterest: begInterest })
    
                }

             })
            
            Editcenter.Targets.forEach( list => {
                const _id = list._id
                const targYear = list.target_year
                const loan_type = list.loan_type
                const month = list.month
                let lonTerm = ""
                if (list.loan_term) {
                    lonTerm = list.loan_term + " Months"
                } else {
                    lonTerm = "6 Months"
                }
                const semester = list.semester
                const numClient = list.numClient
                const amount = list.amount
                const totAmount = list.totAmount
                const remarks = list.remarks
                const strAmount = _.toString(list.amount)
                let strLoanAmount = ""
                 if (strAmount.length == 4 ) {
                    strLoanAmount = _.padStart(strAmount,5,'0')
                 } else {
                    strLoanAmount = strAmount
                 }

                 if (targYear === budgetYear) {  // IF TARGET year is egual to the Budget Year 
                    totCntrBudgAmt = totCntrBudgAmt + totAmount
                    totLoanAmount = totLoanAmount + totAmount

                    const sortKey = _.toString(list.dispView) + list.loan_type + semester + list.remarks + _.toString(list.monthOrder) + strLoanAmount

                    // const sortKey = _.toString(list.dispView) + list.loan_type + semester + list.remarks + _.toString(list.monthOrder) + strLoanAmount

                    forSortTargets.push({_id: _id, sortKey: sortKey, loan_type: loan_type, lonTerm: lonTerm, month: month, semester: semester, numClient: numClient, amount: amount, totAmount: totAmount, remarks: remarks})

                    //  if (loan_type === "Group Loan" || loan_type === "Agricultural Loan") {
                    if (semester === "First Half") {

                        if (remarks === "New Loan") {
                            totNewAmtSem1 = totNewAmtSem1 + totAmount

                            if (loan_type === "Group Loan" || loan_type === "Agricultural Loan" || loan_type === "Individual Loan - IMEP") {
                                totBegBal2 = totBegBal2 + numClient
                                totNewCliSem1 = totNewCliSem1 + numClient
                            }
                        } else {
                            totOldAmtSem1 = totOldAmtSem1 + totAmount

                            if (loan_type === "Group Loan" || loan_type === "Agricultural Loan" || loan_type === "Individual Loan - IMEP") {
                                totBegBal2 = totBegBal2 + numClient
                                totOldCliSem1 = totOldCliSem1 + numClient
                            }
    
                        }
                    } else {   // Second Half
    
                        if (remarks === "New Loan") {
                            if (loan_type === "Group Loan" || loan_type === "Agricultural Loan" || loan_type === "Individual Loan - IMEP") {
                                totNewCliSem2 = totNewCliSem2 + numClient
                            }
                            totNewAmtSem2 = totNewAmtSem2 + totAmount
    
                        } else {
                            monthReLoan2 = month
                            if (loan_type === "Group Loan" || loan_type === "Agricultural Loan" || loan_type === "Individual Loan - IMEP") {
                                totOldCliSem2 = totOldCliSem2 + numClient
                            }
                            totOldAmtSem2 = totOldAmtSem2 + totAmount
                            
                        }
                    }    

                 }

                //  }


            })
            doneRedEditCenter = true
            let totCliSem1 = totNewCliSem1 + totOldCliSem1
            let totCliSem2  = totNewCliSem2 + totOldCliSem2
            let totLoanAmtSem1 = totNewAmtSem1 + totOldAmtSem1 
            let totLoanAmtSem2 = totNewAmtSem2 + totOldAmtSem2 

            ctrBrkDownTots.push({totBegBal1: totBegBal1, totBegBal2: totBegBal2, totNewCliSem1: totNewCliSem1, totNewCliSem2: totNewCliSem2,
                totNewAmtSem1: totNewAmtSem1, totNewAmtSem2: totNewAmtSem2, totOldCliSem1: totOldCliSem1, totOldCliSem2: totOldCliSem2,
                totOldAmtSem1: totOldAmtSem1, totOldAmtSem2: totOldAmtSem2, totResign1: totResign1, totResign2: totResign2,
                totCliSem1: totCliSem1, totCliSem2: totCliSem2, totLoanAmount: totLoanAmount, totLoanAmtSem1: totLoanAmtSem1, totLoanAmtSem2: totLoanAmtSem2 })


        } else {
            if (doneReadCenters) {
                doneRedEditCenter = true

            }
        }
        console.log(ctrBrkDownTots)
        sortedTargets = forSortTargets.sort( function (a,b) {
            if ( a.sortKey < b.sortKey ){
                return -1;
              }
              if ( a.sortKey > b.sortKey ){
                return 1;
              }
               return 0;
        })
        console.log(ctrLonTypSelect)

        if (doneRedEditCenter) {
            res.render("centers/editTargets", {
                poCode: poCode,
                loanTermOption: loanTermOption,
                loanType: ctrLonTypSelect,
                defMonSelect: lastMonSelect,
                defaultPeriod, defaultPeriod,
                listTitle: centerCode, 
                newListItems: sortedTargets,
                totCntrBudgAmt: totCntrBudgAmt,
                begBalData: begBalData,
                ctrBrkDownTots: ctrBrkDownTots,
                monthSelect: monthSelect,
                budget_Mode: budget_Mode,
                yuser: yuser
            });
        }

    } catch (err) {
        console.log(err)
        res.redirect('/centers')
    } 
})

// SET BEGINNING BALANCES - GLP ONLY FOR ALL THE CENTERS
router.get('/setBegBals/:id', authUser, authRole("PO", "BM"), async (req, res) => {

   const poCode = req.params.id
   const unit_ID = poCode.substr(0,6)
   const yuser = req.user
   let lnType = []
   let forSortTargets = []
   let sortedTargets = []  
   let doneRedEditCenter = false
   let totCntrBudgCli = 0
   let totCntrBudgPrin = 0
   let totCntrBudgInt = 0
   let begBalData = []

//    budgetYear
   try {

       let LonType = " "

//        console.log(loanType)
       const Editcenter = await Center.find({po_code: poCode}, function (err, foundlist) {

        })

       if (Editcenter.length !== 0) {
           
           Editcenter.forEach( listBeg => {
               let ctrBegBalCli = 0
               let begPrincipal = 0
               let begInterest = 0
               const CenterBegBal = listBeg.center
               const begBal = listBeg.Loan_beg_bal
               const centerLoanType = listBeg.loan_type
               let begBalID = ""
               let begMonth = ""

                    // LonType = listBeg.loan_type === "AGL" ? "Agricultural Loan" : "Group Loan"

                //    const ctrBegBal = begBal.find(cBeg => cBeg.loan_type === LonType &&)
                //     if (!ctrBegBal) {
                //         ctrBegBalCli = 0
                //     } else {
                    begBal.forEach(beginBal => {

                        if (beginBal.target_year === budgetYear) {
                            if (beginBal.loan_type === centerLoanType) {
                                ctrBegBalCli = beginBal.beg_client_count
                                begPrincipal = beginBal.beg_principal
                                begInterest = beginBal.beg_interest
                                begBalID = beginBal._id
                                begMonth = beginBal.expected_maturity_date
                                totCntrBudgPrin = totCntrBudgPrin + begPrincipal
                                totCntrBudgCli = totCntrBudgCli + ctrBegBalCli
                                totCntrBudgInt = totCntrBudgInt + begInterest
                                
    
                            }
                        }

                    })
                    // }
                   begBalData.push({_id: begBalID, center: CenterBegBal, begMonth: begMonth, begLonType: LonType, begClient: ctrBegBalCli, begPrincipal: _.toString(begPrincipal), begInterest: begInterest })

            //    }
            })
           
           doneRedEditCenter = true

       } else {
           doneRedEditCenter = true
       }

       sortedBegBals = begBalData.sort( function (a,b) {
           if ( a.center < b.center ){
               return -1;
             }
             if ( a.center > b.center ){
               return 1;
             }
              return 0;
       })

       if (doneRedEditCenter) {
           res.render("centers/setBegBals", {
            //    centerID: centerCode,
               loanType: LonType,
               poCode: poCode, 
               begBalData: sortedBegBals,
               totCntrBudgPrin: totCntrBudgPrin,
               totCntrBudgCli: totCntrBudgCli,
               totCntrBudgInt: totCntrBudgInt,
               monthSelect: begMonthSelect,
               yuser: yuser
           });
       }

   } catch (err) {
       console.log(err)
       res.redirect('/centers')
   } 
})


// RECALCULATE CENTERS TARGETS per PO
// In editing of a Target, it should be one Loan type per multiple edit, cannot be edited multi-loan type in one single EDIT
router.get('/reCalculatePOCenters/:id', authUser, authRole("PO", "BM"), async function(req, res){

    const poCode = req.params.id
    const unit_ID = poCode.substr(0,6)
    const yuser = req.user

    const idClient= req.body.idClient
    const numClient = req.body.numClient
    // const totalAmt = req.body.totAmt
    let loanTyp = ""
    let prevLoanTyp = ""
    let forSortTargets = []
    let sortedTargets = []
    let doneReadCenter = false

    let totNewCliSem1 = 0
    let totNewAmtSem1 = 0
    let totNewCliSem2 = 0
    let totNewAmtSem2 = 0

    let totOldCliSem1 = 0
    let totOldAmtSem1 = 0
    let totOldCliSem2 = 0
    let totOldAmtSem2 = 0

    let perLonTypSem1NewCli = 0
    let perLonTypSem1NewAmt = 0
    let perLonTypSem2NewCli = 0
    let perLonTypSem2NewAmt = 0

    let hasChangeTarget = false
    let hasChangeGLP = false
    let resChangeLnType = ""
    let doneReadSortedTarg = false
    let prevLonTyp = ""
    let fndCtrLnType = []

    let perLonTypSem1OldCli = 0
    let perLonTypSem1OldAmt = 0
    let perLonTypSem2OldCli = 0
    let perLonTypSem2OldAmt = 0

    let totBegBal1 = 0
    let totBegBal2 = 0

    let totResign1 = 0
    let totResign2 = 0

    let monthNewLoan1 = ""
    let monthNewLoan2 = ""
    let monthReLoan1 = ""
    let monthReLoan2 = ""
    let num_Client = 0
    let id_Client = ""

    let nowZeroTargetsLength = false
    let nowOneTargetsLength = false

    let poEditedTargPerLonTyp = []

    let hasChangesTarg = false
    let firstSemChanged = false
    let secondSemChanged = false
    let doneUpdating = false
    let ctrBegBalClient = 0

    let cntrTargetView = []

    try {

        let ctrBegBalCli = 0
        let ctrBegBals = []

        const loanType = await Loan_type.find({})

        const fndCenter = await Center.find({po_code: poCode}, function (err, foundCenter) {
            const ctrTargets = foundCenter.Targets
            ctrBegBals = foundCenter.Loan_beg_bal
            ctrBegBalClient = foundCenter.budget_BegBalCli
            // console.log(foundCenter)
        })

        if (fndCenter) {

            fndCenter.forEach (foundCenter => {
                const fndCenterNo = foundCenter.center
                const recCenter = foundCenter.Targets
                ctrBegBals = foundCenter.Loan_beg_bal

                let totNewClient = 0
                let totOldClient = 0
                let totNewCliSem1 = 0
                let totNewCliSem2 = 0
                let totNewAmtSem1 = 0
                let totNewAmtSem2 = 0
                let totOldCliSem1 = 0
                let totOldCliSem2 = 0
                let totOldAmtSem1 = 0
                let totOldAmtSem2 = 0
                let ctrBegBalCli = 0

                recCenter.forEach( list => {
                    const targetYear = list.target_year
                    const chTargMon = ""
    
                    if (targetYear === budgetYear) {
                        const _id = list._id
                        const loan_type = list.loan_type
                        const month = list.month
                        const monthOrder = list.monthOrder
                        const semester = list.semester
                        const numClient = list.numClient
                        const amount = list.amount
                        const totAmount = list.totAmount
                        const remarks = list.remarks
                        const strAmount = _.toString(list.amount)
                        let strLoanAmount = ""
                        if (strAmount.length == 4 ) {
                           strLoanAmount = _.padStart(strAmount,5,'0')
                        } else {
                           strLoanAmount = strAmount
                        }

                        if (semester === "First Half") {
                            if (remarks === "New Loan") {
                                totNewClient = totNewClient + numClient
                                totNewAmtSem1 = totNewAmtSem1 + totAmount
                
                                if (loan_type === "Group Loan" || loan_type === "Agricultural Loan" || loan_type === "Individual Loan - IMEP")  {
                                    totNewCliSem1 = totNewCliSem1 + numClient
                                }

                            } else {
                                totOldClient = totOldClient + numClient
                                totOldAmtSem1 = totOldAmtSem1 +totAmount
                
                                if (loan_type === "Group Loan" || loan_type === "Agricultural Loan" || loan_type === "Individual Loan - IMEP")  {
                                    totOldCliSem1 = totOldCliSem1 + numClient
                                }

                            }

                        }
                        if (semester === "Second Half") {
                            if (remarks === "New Loan") {
                                totNewClient = totNewClient + numClient

                                totNewAmtSem2 = totNewAmtSem2 + totAmount

                                if (loan_type === "Group Loan" || loan_type === "Agricultural Loan" || loan_type === "Individual Loan - IMEP")  {
                                    totNewCliSem2 = totNewCliSem2 + numClient
                                    }
                
                            } else {
                                totOldAmtSem2 = totOldAmtSem2 +totAmount

                                if (loan_type === "Group Loan" || loan_type === "Agricultural Loan" || loan_type === "Individual Loan - IMEP")  {
                                    totOldCliSem2 = totOldCliSem2 + numClient                            
                                }

                            }
                        }
        
                        ctrBegBals.forEach( listBeg => {
                            const begLonType = listBeg.loan_type
                            const begClient = listBeg.beg_client_count
                            const targYear = listBeg.target_year
                            const begPrincipal = listBeg.beg_principal
                            const begInterest = listBeg.beg_interest
        
                            if (begLonType === loan_type && targYear === budgetYear ) {
                                ctrBegBalCli = begClient
                            }
            
                            // begBalData.push({begLonType: begLonType, begClient: begClient, begPrincipal: begPrincipal, begInterest: begInterest })
                         })
            
                        // const sortKey = _.toString(list.dispView) + list.loan_type + _.toString(list.monthOrder) + list.remarks + strLoanAmount
        
                        const sortKey = fndCenterNo+ _.toString(list.dispView) + list.loan_type + semester + list.remarks + _.toString(list.monthOrder) + strLoanAmount
        
                        const ctrBegBal = ctrBegBals.find(cBeg => cBeg.loan_type === loan_type)
                        // if (!ctrBegBal) {
                        //     ctrBegBalCli = 0
                        // } else {
                        //     ctrBegBalCli = ctrBegBal.beg_client_count
                        // }
        
                        forSortTargets.push({_id: _id, sortKey: sortKey, center: fndCenterNo, loan_type: loan_type, begBal: ctrBegBalCli, month: month, semester: semester, numClient: numClient, amount: amount, 
                            totAmount: totAmount, remarks: remarks, newClient: list.newClient, oldClient: list.oldClient})
                        
                        
                        const lnTypeSortKey = loan_type + fndCenterNo + monthOrder

                        if (fndCtrLnType.length == 0) {
                            fndCtrLnType.push({sortKey: lnTypeSortKey, loan_type: loan_type, center: fndCenterNo, begBalClient: ctrBegBalCli, month: month, month_order: monthOrder})
                        } else {
                            const fndLnType = _.find(fndCtrLnType, {loan_type: loan_type, center: fndCenterNo})
                            if (fndLnType) {
                            
                            } else {
                                fndCtrLnType.push({sortKey: lnTypeSortKey, loan_type: loan_type, center: fndCenterNo, begBalClient: ctrBegBalCli, month: month, month_order: monthOrder})
                            }
                        }

                    }
    
                }) 
                totResign1 = ctrBegBalCli - totOldCliSem1
                totResign2 = (totNewCliSem1 + totOldCliSem1) - totOldCliSem2

                foundCenter.newClient = totNewClient //TypeError: Cannot set property 'newClient' of null
                // Cause of error is, loan_type === "GLP", it should be "Group Loan"
                foundCenter.newClientAmt = totNewAmtSem1 + totNewAmtSem2
                foundCenter.oldClient = totOldCliSem1 + totOldCliSem2
                foundCenter.oldClientAmt = totOldAmtSem1 + totOldAmtSem2
                foundCenter.resClient = totResign1
                foundCenter.resClient2 = totResign2

                foundCenter.save()

            })
            doneReadCenter = true
    
        }

        let idClientLen = 0
    
        if (doneReadCenter) {
            sortedTargets = forSortTargets.sort( function (a,b) {
                if ( a.sortKey < b.sortKey ){
                    return -1;
                }
                if ( a.sortKey > b.sortKey ){
                    return 1;
                }
                return 0;
            })

            if (sortedTargets.length == 1) {
                idClientLen = 1
            } else {
                idClientLen = sortedTargets.length
            }

            sortedTargLonTyp = fndCtrLnType.sort( function (a,b) {
                if ( a.sortKey < b.sortKey ){
                    return -1;
                }
                if ( a.sortKey > b.sortKey ){
                    return 1;
                }
                return 0;
            })

            let LoanTypeLen = 0 // Length of Loan type of Targets in a Center
            if (sortedTargLonTyp.length == 1) {
                LoanTypeLen = 1
            } else {
                LoanTypeLen = sortedTargLonTyp.length
            }

            let hasSeconHalfReloan = false
            let hasFirstHalfNewLoan = false
            let hasFirstHalfReloan = false
            let targetKeyForUpdet = ""
            // let lonTayps = ""

            // fndCtrLnType.forEach (foundCenter => {

            for(var i=0; i<LoanTypeLen; i++) {  // Loop to SCAN all Targets regardless of Loan Type that have CHANGES

                const recCenter = sortedTargLonTyp[i].center
                const lonTayps = sortedTargLonTyp[i].loan_type
                const lnTypBegBalCli = sortedTargLonTyp[i].begBalClient
                const lnTypMonOrder = sortedTargLonTyp[i].month_order
                let recCounter = 0
                let cntrLnTypHasChanged = false

                let newLoanCount = 0
                let oldLoanCount = 0
                let newLoanAmount = 0
                let oldLoanAmount = 0
        
                let jan_1stHalfNewLoanCount = 0
                let feb_1stHalfNewLoanCount = 0
                let mar_1stHalfNewLoanCount = 0
                let apr_1stHalfNewLoanCount = 0
                let may_1stHalfNewLoanCount = 0
                let jun_1stHalfNewLoanCount = 0

                let jan_1stHalfReLoanCount = 0
                let feb_1stHalfReLoanCount = 0
                let mar_1stHalfReLoanCount = 0
                let apr_1stHalfReLoanCount = 0
                let may_1stHalfReLoanCount = 0
                let jun_1stHalfReLoanCount = 0

                let jan_1stHalfNewLoanAmount = 0
                let feb_1stHalfNewLoanAmount = 0
                let mar_1stHalfNewLoanAmount = 0
                let apr_1stHalfNewLoanAmount = 0
                let may_1stHalfNewLoanAmount = 0
                let jun_1stHalfNewLoanAmount = 0

                let jan_1stHalfReLoanAmount = 0
                let feb_1stHalfReLoanAmount = 0
                let mar_1stHalfReLoanAmount = 0
                let apr_1stHalfReLoanAmount = 0
                let may_1stHalfReLoanAmount = 0
                let jun_1stHalfReLoanAmount = 0

                let jul_2ndHalfNewLoanCount = 0
                let aug_2ndHalfNewLoanCount = 0
                let sep_2ndHalfNewLoanCount = 0
                let oct_2ndHalfNewLoanCount = 0
                let nov_2ndHalfNewLoanCount = 0
                let dec_2ndHalfNewLoanCount = 0

                let jul_2ndHalfReLoanCount = 0
                let aug_2ndHalfReLoanCount = 0
                let sep_2ndHalfReLoanCount = 0
                let oct_2ndHalfReLoanCount = 0
                let nov_2ndHalfReLoanCount = 0
                let dec_2ndHalfReLoanCount = 0

                let jul_2ndHalfNewLoanAmount = 0
                let aug_2ndHalfNewLoanAmount = 0
                let sep_2ndHalfNewLoanAmount = 0
                let oct_2ndHalfNewLoanAmount = 0
                let nov_2ndHalfNewLoanAmount = 0
                let dec_2ndHalfNewLoanAmount = 0

                let jun_2ndHalfReLoanAmount = 0
                let jul_2ndHalfReLoanAmount = 0
                let aug_2ndHalfReLoanAmount = 0
                let sep_2ndHalfReLoanAmount = 0
                let oct_2ndHalfReLoanAmount = 0
                let nov_2ndHalfReLoanAmount = 0
                let dec_2ndHalfReLoanAmount = 0

                let firstHalfNewLoanCount = 0
                let firstHalfNewLoanAmount = 0
                let firstHalfReLoanCount = 0
                let firstHalfReLoanAmount = 0
                let seconHalfNewLoanCount = 0
                let seconHalfNewLoanAmount = 0
                let seconHalfReLoanCount = 0
                let seconHalfReLoanAmount = 0

                let TotfirstHalfNewLoanCount = 0
                let TotfirstHalfNewLoanAmount = 0
                let TotfirstHalfReLoanCount = 0
                let TotfirstHalfReLoanAmount = 0
                let TotseconHalfNewLoanCount = 0
                let TotseconHalfNewLoanAmount = 0
                let TotseconHalfReLoanCount = 0
                let TotseconHalfReLoanAmount = 0

                let resiClient1 = 0
                let resiClient2 = 0 
    
                let lnTyp1stHalf_NLA = 0
                let lnTyp1stHalf_RLC = 0
                let lnTyp1stHalf_RLA = 0
                let lnTyp2ndHalf_NLC = 0
                let lnTyp2ndHalf_NLA = 0
                let lnTyp2ndHalf_RLC = 0
                let lnTyp2ndHalf_RLA = 0
    
                sortedTargets.forEach(target => {
                    const centerTarget = target.center
                    const targetLoanType = target.loan_type
    
                        if (centerTarget === recCenter && targetLoanType === lonTayps) {
    
                            const tarLoanType = target.loan_type
                            const targMonth = target.month
                            const nTargMonth = target.monthOrder
                            const targClientCount = target.numClient 
                            const targSemester = target.semester
                            const totLonAmount = target.totAmount
                            const targRemarks = target.remarks
        
                            // if (tarLoanType === loanType) {
                                if (targSemester === "First Half") {
                                    if (target.remarks === "New Loan") {
                                        hasFirstHalfNewLoan = true
        
                                        newLoanAmount = newLoanAmount + totLonAmount
        
                                        firstHalfNewLoanAmount = firstHalfNewLoanAmount + totLonAmount

                                        if (tarLoanType === "Group Loan" || tarLoanType === "Agricultural Loan" || tarLoanType === "Individual Loan - IMEP")  {

                                            newLoanCount = newLoanCount + target.numClient   // New Loan Count running Totals
                                            firstHalfNewLoanCount = firstHalfNewLoanCount + target.numClient        
                                            switch(targMonth) {
                                                case "January": 
                                                    jan_1stHalfNewLoanCount = jan_1stHalfNewLoanCount + targClientCount
                                                    break;
                                                case "February": 
                                                    feb_1stHalfNewLoanCount = feb_1stHalfNewLoanCount + targClientCount
                                                    break;
                                                case "March": 
                                                    mar_1stHalfNewLoanCount = mar_1stHalfNewLoanCount + targClientCount
                                                    break;
                                                case "April": 
                                                    apr_1stHalfNewLoanCount = apr_1stHalfNewLoanCount + targClientCount
                                                    break;
                                                case "May": 
                                                    may_1stHalfNewLoanCount = may_1stHalfNewLoanCount + targClientCount
                                                    break;
                                                case "June": 
                                                    jun_1stHalfNewLoanCount = jun_1stHalfNewLoanCount + targClientCount
                                                    break;
                                                default:
                                                    orderMonth = 0
                                            }   
                                        }            
    
                                            switch(targMonth) {
                                                case "January": 
                                                    jan_1stHalfNewLoanAmount = jan_1stHalfNewLoanAmount + totLonAmount
                                                    break;
                                                case "February": 
                                                    feb_1stHalfNewLoanAmount = feb_1stHalfNewLoanAmount + totLonAmount
                                                    break;
                                                case "March": 
                                                    mar_1stHalfNewLoanAmount = mar_1stHalfNewLoanAmount + totLonAmount
                                                    break;
                                                case "April": 
                                                    apr_1stHalfNewLoanAmount = apr_1stHalfNewLoanAmount + totLonAmount
                                                    break;
                                                case "May": 
                                                    may_1stHalfNewLoanAmount = may_1stHalfNewLoanAmount + totLonAmount
                                                    break;
                                                case "June": 
                                                    jun_1stHalfNewLoanAmount = jun_1stHalfNewLoanAmount + totLonAmount
                                                    break;
                                                default:
                                                    orderMonth = 0
                                            }   
                                    }
                                    else { 
                                        hasFirstHalfReloan = true
                                        monthReLoan1 = targMonth
        
                                        withReloanMonth = targMonth
                                        oldLoanAmount = oldLoanAmount + totLonAmount
                                        targetKeyForUpdet = target.id
        
                                        firstHalfReLoanAmount = firstHalfReLoanAmount + totLonAmount
        
                                        if (tarLoanType === "Group Loan" || tarLoanType === "Agricultural Loan" || tarLoanType === "Individual Loan - IMEP")  {
                                            oldLoanCount  = oldLoanCount + target.numClient
                                            firstHalfReLoanCount = firstHalfReLoanCount + target.numClient

                                            switch(targMonth) {
                                                case "January": 
                                                    jan_1stHalfReLoanCount = jan_1stHalfReLoanCount + targClientCount
                                                    break;
                                                case "February": 
                                                    feb_1stHalfReLoanCount = feb_1stHalfReLoanCount + targClientCount
                                                    break;
                                                case "March": 
                                                    mar_1stHalfReLoanCount = mar_1stHalfReLoanCount + targClientCount
                                                    break;
                                                case "April": 
                                                    apr_1stHalfReLoanCount = apr_1stHalfReLoanCount + targClientCount
                                                    break;
                                                case "May": 
                                                    may_1stHalfReLoanCount = may_1stHalfReLoanCount + targClientCount
                                                    break;
                                                case "June": 
                                                    jun_1stHalfReLoanCount = jun_1stHalfReLoanCount + targClientCount
                                                    break;
                                                default:
                                                    orderMonth = 0
                                            }   
    
                                        }

                                        switch(targMonth) {
                                            case "January": 
                                                jan_1stHalfReLoanAmount = jan_1stHalfReLoanAmount + totLonAmount
                                                break;
                                            case "February": 
                                                feb_1stHalfReLoanAmount = feb_1stHalfReLoanAmount + totLonAmount
                                                break;
                                            case "March": 
                                                mar_1stHalfReLoanAmount = mar_1stHalfReLoanAmount + totLonAmount
                                                break;
                                            case "April": 
                                                apr_1stHalfReLoanAmount = apr_1stHalfReLoanAmount + totLonAmount
                                                break;
                                            case "May": 
                                                may_1stHalfReLoanAmount = may_1stHalfReLoanAmount + totLonAmount
                                                break;
                                            case "June": 
                                                jun_1stHalfReLoanAmount = jun_1stHalfReLoanAmount + totLonAmount
                                                break;
                                            default:
                                                orderMonth = 0
                                        }   

                                    }
                                }
                                if (targSemester === "Second Half") {
                                    if (target.remarks === "New Loan") {
                                        hasSeconHalfNewLoan = true
        
                                        newLoanAmount = newLoanAmount + totLonAmount
        
                                        seconHalfNewLoanAmount = seconHalfNewLoanAmount + totLonAmount
        
                                        if (tarLoanType === "Group Loan" || tarLoanType === "Agricultural Loan" || tarLoanType === "Individual Loan - IMEP")  {
                                            newLoanCount = newLoanCount + target.numClient   // New Loan Count running Totals
                                            seconHalfNewLoanCount = seconHalfNewLoanCount + target.numClient

                                            switch(targMonth) {
                                                case "July": 
                                                    jul_2ndHalfNewLoanCount = jul_2ndHalfNewLoanCount + targClientCount
                                                    break;
                                                case "August": 
                                                    aug_2ndHalfNewLoanCount = aug_2ndHalfNewLoanCount + targClientCount
                                                    break;
                                                case "September": 
                                                    sep_2ndHalfNewLoanCount = sep_2ndHalfNewLoanCount + targClientCount
                                                    break;
                                                case "October": 
                                                    oct_2ndHalfNewLoanCount = oct_2ndHalfNewLoanCount + targClientCount
                                                    break;
                                                case "November": 
                                                    nov_2ndHalfNewLoanCount = nov_2ndHalfNewLoanCount + targClientCount
                                                    break;
                                                case "December": 
                                                    dec_2ndHalfNewLoanCount = dec_2ndHalfNewLoanCount + targClientCount
                                                    break;
                                                default:
                                                    orderMonth = 0
                                            }   
                                        }
                                                    
                                            switch(targMonth) {
                                                case "July": 
                                                    jul_2ndHalfNewLoanAmount = jul_2ndHalfNewLoanAmount + totLonAmount
                                                    break;
                                                case "August": 
                                                    aug_2ndHalfNewLoanAmount = aug_2ndHalfNewLoanAmount + totLonAmount
                                                    break;
                                                case "September": 
                                                    sep_2ndHalfNewLoanAmount = sep_2ndHalfNewLoanAmount + totLonAmount
                                                    break;
                                                case "October": 
                                                    oct_2ndHalfNewLoanAmount = oct_2ndHalfNewLoanAmount + totLonAmount
                                                    break;
                                                case "November": 
                                                    nov_2ndHalfNewLoanAmount = nov_2ndHalfNewLoanAmount + totLonAmount
                                                    break;
                                                case "December": 
                                                    dec_2ndHalfNewLoanAmount = dec_2ndHalfNewLoanAmount + totLonAmount
                                                    break;
                                                default:
                                                    orderMonth = 0
                                            }   
                                    }
                                    else { 
                                        hasSeconHalfReloan = true
                                        monthReLoan2 = targMonth
        
                                        withReloanMonth = targMonth
                                        oldLoanAmount = oldLoanAmount + totLonAmount
        
                                        seconHalfReLoanAmount = seconHalfReLoanAmount + totLonAmount
        
                                        if (tarLoanType === "Group Loan" || tarLoanType === "Agricultural Loan" || tarLoanType === "Individual Loan - IMEP")  {
                                            oldLoanCount  = oldLoanCount + target.numClient
                                            seconHalfReLoanCount = seconHalfReLoanCount + target.numClient

                                            switch(targMonth) {
                                                case "July": 
                                                    jul_2ndHalfReLoanCount = jul_2ndHalfReLoanCount + targClientCount
                                                    break;
                                                case "August": 
                                                    aug_2ndHalfReLoanCount = aug_2ndHalfReLoanCount + targClientCount
                                                    break;
                                                case "September": 
                                                    sep_2ndHalfReLoanCount = sep_2ndHalfReLoanCount + targClientCount
                                                    break;
                                                case "October": 
                                                    oct_2ndHalfReLoanCount = oct_2ndHalfReLoanCount + targClientCount
                                                    break;
                                                case "November": 
                                                    nov_2ndHalfReLoanCount = nov_2ndHalfReLoanCount + targClientCount
                                                    break;
                                                case "December": 
                                                    dec_2ndHalfReLoanCount = dec_2ndHalfReLoanCount + targClientCount
                                                    break;
                                                default:
                                                    orderMonth = 0
                                            }       
    
                                        }
                                        switch(targMonth) {
                                            case "July": 
                                                jul_2ndHalfReLoanAmount = jul_2ndHalfReLoanAmount + totLonAmount
                                                break;
                                            case "August": 
                                                aug_2ndHalfReLoanAmount = aug_2ndHalfReLoanAmount + totLonAmount
                                                break;
                                            case "September": 
                                                sep_2ndHalfReLoanAmount = sep_2ndHalfReLoanAmount + totLonAmount
                                                break;
                                            case "October": 
                                                oct_2ndHalfReLoanAmount = oct_2ndHalfReLoanAmount + totLonAmount
                                                break;
                                            case "November": 
                                                nov_2ndHalfReLoanAmount = nov_2ndHalfReLoanAmount + totLonAmount
                                                break;
                                            case "December": 
                                                dec_2ndHalfReLoanAmount = dec_2ndHalfReLoanAmount + totLonAmount
                                                break;
                                            default:
                                                orderMonth = 0
                                        }   

        
                                        if (tarLoanType === loanType && targMonth === month && targRemarks === remarks) {
                                            forTheMonOldCliCnt = forTheMonOldCliCnt + targClientCount
                                            forTheMonOldCliAmt = forTheMonOldCliAmt + totLonAmount
                                        }

                                    }
                                
                                }
                            }
    
                }) // end of forEach() loop - sorteTargets

                TotfirstHalfNewLoanCount = jan_1stHalfNewLoanCount + feb_1stHalfNewLoanCount + mar_1stHalfNewLoanCount + apr_1stHalfNewLoanCount + may_1stHalfNewLoanCount + jun_1stHalfNewLoanCount

                TotfirstHalfNewLoanAmount = jan_1stHalfNewLoanAmount + feb_1stHalfNewLoanAmount + mar_1stHalfNewLoanAmount + apr_1stHalfNewLoanAmount + may_1stHalfNewLoanAmount + jun_1stHalfNewLoanAmount

                TotfirstHalfReLoanCount = jan_1stHalfReLoanCount + feb_1stHalfReLoanCount + mar_1stHalfReLoanCount + apr_1stHalfReLoanCount + may_1stHalfReLoanCount + jun_1stHalfReLoanCount

                TotfirstHalfReLoanAmount = jan_1stHalfReLoanAmount + feb_1stHalfReLoanAmount + mar_1stHalfReLoanAmount + apr_1stHalfReLoanAmount + may_1stHalfReLoanAmount + jun_1stHalfReLoanAmount

                TotseconHalfNewLoanCount =  jul_2ndHalfNewLoanCount + aug_2ndHalfNewLoanCount + sep_2ndHalfNewLoanCount + oct_2ndHalfNewLoanCount + nov_2ndHalfNewLoanCount + dec_2ndHalfNewLoanCount

                TotseconHalfNewLoanAmount = jul_2ndHalfNewLoanAmount + aug_2ndHalfNewLoanAmount + sep_2ndHalfNewLoanAmount + oct_2ndHalfNewLoanAmount + nov_2ndHalfNewLoanAmount + dec_2ndHalfNewLoanAmount

                TotseconHalfReLoanCount = jul_2ndHalfReLoanCount + aug_2ndHalfReLoanCount + sep_2ndHalfReLoanCount + oct_2ndHalfReLoanCount + nov_2ndHalfReLoanCount + dec_2ndHalfReLoanCount

                TotseconHalfReLoanAmount = jul_2ndHalfReLoanAmount + aug_2ndHalfReLoanAmount + sep_2ndHalfReLoanAmount + oct_2ndHalfReLoanAmount + nov_2ndHalfReLoanAmount + dec_2ndHalfReLoanAmount

                const grandTotClients = TotfirstHalfNewLoanCount + TotfirstHalfReLoanCount + TotseconHalfNewLoanCount + TotseconHalfReLoanCount

                const grandTotNewClients = TotfirstHalfNewLoanCount + TotseconHalfNewLoanCount
                const grandTotOldClients = TotfirstHalfReLoanCount + TotseconHalfReLoanCount

                // chCntrViewCode1 = "NewLoanClient"
                // chCntrViewCode2 = "NewLoanAmt"

                // chCntrViewCode1 = "OldLoanClient"
                // chCntrViewCode2 = "OldLoanAmt"

                    if (grandTotNewClients > 0) {
                        const cntr1BudgDet = await Center_budget_det.findOne({ center: recCenter, view_code: "NewLoanClient", loan_type: lonTayps, target_year: budgetYear}, function (err, cntrForChange) {
                            console.log(cntrForChange)
                            if(!isNull(cntrForChange)) {
                                    cntrForChange.jan_budg = jan_1stHalfNewLoanCount
                                    cntrForChange.feb_budg = feb_1stHalfNewLoanCount
                                    cntrForChange.mar_budg = mar_1stHalfNewLoanCount
                                    cntrForChange.apr_budg = apr_1stHalfNewLoanCount
                                    cntrForChange.may_budg = may_1stHalfNewLoanCount
                                    cntrForChange.jun_budg = jun_1stHalfNewLoanCount

                                    cntrForChange.jul_budg = jul_2ndHalfNewLoanCount
                                    cntrForChange.aug_budg = aug_2ndHalfNewLoanCount
                                    cntrForChange.sep_budg = sep_2ndHalfNewLoanCount
                                    cntrForChange.oct_budg = oct_2ndHalfNewLoanCount
                                    cntrForChange.nov_budg = nov_2ndHalfNewLoanCount
                                    cntrForChange.dec_budg = dec_2ndHalfNewLoanCount

                                cntrForChange.save()
                            }
                        })
                        const cntr2BudgDet = await Center_budget_det.findOne({center: recCenter, view_code: "NewLoanAmt", loan_type: lonTayps, target_year: budgetYear}, function (err, cntrForChange2) {
                            if (!isNull(cntrForChange2)) {
                                        cntrForChange2.jan_budg = jan_1stHalfNewLoanAmount
                                        cntrForChange2.feb_budg = feb_1stHalfNewLoanAmount
                                        cntrForChange2.mar_budg = mar_1stHalfNewLoanAmount
                                        cntrForChange2.apr_budg = apr_1stHalfNewLoanAmount
                                        cntrForChange2.may_budg = may_1stHalfNewLoanAmount
                                        cntrForChange2.jun_budg = jun_1stHalfNewLoanAmount

                                        cntrForChange2.jul_budg = jul_2ndHalfNewLoanAmount
                                        cntrForChange2.aug_budg = aug_2ndHalfNewLoanAmount
                                        cntrForChange2.sep_budg = sep_2ndHalfNewLoanAmount
                                        cntrForChange2.oct_budg = oct_2ndHalfNewLoanAmount
                                        cntrForChange2.nov_budg = nov_2ndHalfNewLoanAmount
                                        cntrForChange2.dec_budg = dec_2ndHalfNewLoanAmount

                                        cntrForChange2.save()
                                    }   
                        })
                    }

                    if (grandTotOldClients > 0) {

                        const cntr3BudgDet = await Center_budget_det.findOne({ center: recCenter, view_code: "OldLoanClient", loan_type: lonTayps, target_year: budgetYear}, function (err, fndOldClient) {
                            if(!isNull(fndOldClient)) {
                                    fndOldClient.jan_budg = jan_1stHalfReLoanCount
                                    fndOldClient.feb_budg = feb_1stHalfReLoanCount
                                    fndOldClient.mar_budg = mar_1stHalfReLoanCount
                                    fndOldClient.apr_budg = apr_1stHalfReLoanCount
                                    fndOldClient.may_budg = may_1stHalfReLoanCount
                                    fndOldClient.jun_budg = jun_1stHalfReLoanCount

                                    fndOldClient.jul_budg = jul_2ndHalfReLoanCount
                                    fndOldClient.aug_budg = aug_2ndHalfReLoanCount
                                    fndOldClient.sep_budg = sep_2ndHalfReLoanCount
                                    fndOldClient.oct_budg = oct_2ndHalfReLoanCount
                                    fndOldClient.nov_budg = nov_2ndHalfReLoanCount
                                    fndOldClient.dec_budg = dec_2ndHalfReLoanCount

                                fndOldClient.save()
                            }
                        })
                        const cntr4BudgDet = await Center_budget_det.findOne({center: recCenter, view_code: "OldLoanAmt", loan_type: lonTayps, target_year: budgetYear}, function (err, fndOldAmount) {
                            if (!isNull(fndOldAmount)) {
                                console.log(fndOldAmount)
                                        fndOldAmount.jan_budg = jan_1stHalfReLoanAmount
                                        fndOldAmount.feb_budg = feb_1stHalfReLoanAmount
                                        fndOldAmount.mar_budg = mar_1stHalfReLoanAmount
                                        fndOldAmount.apr_budg = apr_1stHalfReLoanAmount
                                        fndOldAmount.may_budg = may_1stHalfReLoanAmount
                                        fndOldAmount.jun_budg = jun_1stHalfReLoanAmount

                                        fndOldAmount.jul_budg = jul_2ndHalfReLoanAmount
                                        fndOldAmount.aug_budg = aug_2ndHalfReLoanAmount
                                        fndOldAmount.sep_budg = sep_2ndHalfReLoanAmount
                                        fndOldAmount.oct_budg = oct_2ndHalfReLoanAmount
                                        fndOldAmount.nov_budg = nov_2ndHalfReLoanAmount
                                        fndOldAmount.dec_budg = dec_2ndHalfReLoanAmount

                                        fndOldAmount.save()
                                }   
                            })

                    } 

                    if (lonTayps === "Group Loan" || lonTayps === "Agricultural Loan" || lonTayps === "Individual Loan - IMEP")  {
                        if (hasFirstHalfReloan) {
                            totResign1 = lnTypBegBalCli - (firstHalfReLoanCount)
                        }
                        if (hasSeconHalfReloan) {
                            totResign2 = (firstHalfNewLoanCount + firstHalfReLoanCount) - seconHalfReLoanCount
                        } 
                    } else {
                        totResign1 = 0
                        totResign2 = 0
                    }

                    const totalResign = totResign1 + totResign2

                    if (totalResign >= 0) {

                        let janHasChangedResCli = 0 
                        let febHasChangedResCli = 0 
                        let marHasChangedResCli = 0 
                        let aprHasChangedResCli = 0 
                        let mayHasChangedResCli = 0 
                        let junHasChangedResCli = 0 
                        let julHasChangedResCli = 0 
                        let augHasChangedResCli = 0 
                        let sepHasChangedResCli = 0 
                        let octHasChangedResCli = 0 
                        let novHasChangedResCli = 0 
                        let decHasChangedResCli = 0 

                        switch(monthReLoan1) {
                            case "January": 
                                janHasChangedResCli = totResign1
                                break;
                            case "February": 
                                febHasChangedResCli = totResign1
                                break;
                            case "March": 
                                marHasChangedResCli = totResign1
                                break;
                            case "April": 
                                aprHasChangedResCli = totResign1
                                break;
                            case "May": 
                                mayHasChangedResCli = totResign1
                                break;
                            case "June": 
                                junHasChangedResCli = totResign1
                                break;
                            default:
                                orderMonth = 0
                        }

                        switch(monthReLoan2) {
                            case "July": 
                                julHasChangedResCli = totResign2
                                break;
                            case "August": 
                                augHasChangedResCli = totResign2
                                break;
                            case "September": 
                                sepHasChangedResCli = totResign2
                                break;
                            case "October": 
                                octHasChangedResCli = totResign2
                                break;
                            case "November": 
                                novHasChangedResCli = totResign2
                                break;
                            case "December": 
                                decHasChangedResCli = totResign2
                                break;
                            default:
                                orderMonth = 0
                        }   


                        const ctrResBudgDet = await Center_budget_det.findOne({center: recCenter, loan_type: lonTayps, view_code: "ResClientCount", target_year: budgetYear}, function (err, fndResCli) {
                            const asgd = fndResCli
                            if (!isNull(fndResCli)) {
                                    fndResCli.jan_budg = janHasChangedResCli
                                    fndResCli.feb_budg = febHasChangedResCli
                                    fndResCli.mar_budg = marHasChangedResCli
                                    fndResCli.apr_budg = aprHasChangedResCli
                                    fndResCli.may_budg = mayHasChangedResCli
                                    fndResCli.jun_budg = junHasChangedResCli
                                    fndResCli.jul_budg = julHasChangedResCli
                                    fndResCli.aug_budg = augHasChangedResCli
                                    fndResCli.sep_budg = sepHasChangedResCli
                                    fndResCli.oct_budg = octHasChangedResCli
                                    fndResCli.nov_budg = novHasChangedResCli
                                    fndResCli.dec_budg = decHasChangedResCli

                                if (!isNull(asgd)) {
                                    fndResCli.save()
                                }
                            }
                        })
                    }

            } // end of forEach() loop - fndCtrLnType

        }
        
        if (req.user.role === "BM") {
            res.redirect('/branches/perPOforEdit/' + req.user.assCode)
        } else {
            res.redirect('/centers/viewTarget/' + req.user.assCode+ "recalc_mode")
            // res.redirect('/centers/' + centerCode + '/edit')
        }
        console.log(numClient)
        // alert(Success )
    } catch(err) {
        console.log(err)
        res.redirect('/')
    }
})

// RECALCULATE A CENTER TARGETS
// In editing of a Target, it should be one Loan type per multiple edit, cannot be edited multi-loan type in one single EDIT
router.get('/reCalculateCenter/:id', authUser, authRole("PO", "BM"), async function(req, res){

    const paramsID = req.params.id
    console.log('Recalculate' + paramsID)
    const centerCode = paramsID.substr(0,8)
    const unit_ID = centerCode.substr(0,6)
    const yuser = req.user

    const idClient= req.body.idClient
    const numClient = req.body.numClient
    // const totalAmt = req.body.totAmt
    let loanTyp = ""
    let prevLoanTyp = ""
    let forSortTargets = []
    let sortedTargets = []
    let doneReadCenter = false

    let totNewCliSem1 = 0
    let totNewAmtSem1 = 0
    let totNewCliSem2 = 0
    let totNewAmtSem2 = 0

    let totOldCliSem1 = 0
    let totOldAmtSem1 = 0
    let totOldCliSem2 = 0
    let totOldAmtSem2 = 0

    let perLonTypSem1NewCli = 0
    let perLonTypSem1NewAmt = 0
    let perLonTypSem2NewCli = 0
    let perLonTypSem2NewAmt = 0

    let hasChangeTarget = false
    let hasChangeGLP = false
    let resChangeLnType = ""
    let doneReadSortedTarg = false
    let prevLonTyp = ""
    let fndCtrLnType = []

    let perLonTypSem1OldCli = 0
    let perLonTypSem1OldAmt = 0
    let perLonTypSem2OldCli = 0
    let perLonTypSem2OldAmt = 0

    let totBegBal1 = 0
    let totBegBal2 = 0

    let totResign1 = 0
    let totResign2 = 0

    let monthNewLoan1 = ""
    let monthNewLoan2 = ""
    let monthReLoan1 = ""
    let monthReLoan2 = ""
    let num_Client = 0
    let id_Client = ""

    let nowZeroTargetsLength = false
    let nowOneTargetsLength = false

    let poEditedTargPerLonTyp = []

    let hasChangesTarg = false
    let firstSemChanged = false
    let secondSemChanged = false
    let doneUpdating = false
    let ctrBegBalClient = 0

    let cntrTargetView = []

    try {

        let ctrBegBalCli = 0
        let ctrBegBals = []

        const loanType = await Loan_type.find({})

        const fndCenter = await Center.findOne({center: centerCode}, function (err, foundCenter) {
            const ctrTargets = foundCenter.Targets
            ctrBegBals = foundCenter.Loan_beg_bal
            ctrBegBalClient = foundCenter.budget_BegBalCli
            // console.log(foundCenter)
        })

        if (fndCenter) {

            // fndCenter.forEach (foundCenter => {
                const fndCenterNo = fndCenter.center
                const recCenter = fndCenter.Targets
                ctrBegBals = fndCenter.Loan_beg_bal

                let totNewClient = 0
                let totOldClient = 0
                let totNewCliSem1 = 0
                let totNewCliSem2 = 0
                let totNewAmtSem1 = 0
                let totNewAmtSem2 = 0
                let totOldCliSem1 = 0
                let totOldCliSem2 = 0
                let totOldAmtSem1 = 0
                let totOldAmtSem2 = 0
                let ctrBegBalCli = 0

                recCenter.forEach( list => {
                    const targetYear = list.target_year
                    const chTargMon = ""
    
                    if (targetYear === budgetYear) {
                        const _id = list._id
                        const loan_type = list.loan_type
                        const month = list.month
                        const monthOrder = list.monthOrder
                        const semester = list.semester
                        const numClient = list.numClient
                        const amount = list.amount
                        const totAmount = list.totAmount
                        const remarks = list.remarks
                        const strAmount = _.toString(list.amount)
                        let strLoanAmount = ""
                        if (strAmount.length == 4 ) {
                           strLoanAmount = _.padStart(strAmount,5,'0')
                        } else {
                           strLoanAmount = strAmount
                        }

                        if (semester === "First Half") {
                            if (remarks === "New Loan") {
                                totNewClient = totNewClient + numClient
                                totNewAmtSem1 = totNewAmtSem1 + totAmount
                
                                if (loan_type === "Group Loan" || loan_type === "Agricultural Loan" || loan_type === "Individual Loan - IMEP")  {
                                    totNewCliSem1 = totNewCliSem1 + numClient
                                }

                            } else {
                                totOldClient = totOldClient + numClient
                                totOldAmtSem1 = totOldAmtSem1 +totAmount
                
                                if (loan_type === "Group Loan" || loan_type === "Agricultural Loan" || loan_type === "Individual Loan - IMEP")  {
                                    totOldCliSem1 = totOldCliSem1 + numClient
                                }

                            }

                        }
                        if (semester === "Second Half") {
                            if (remarks === "New Loan") {
                                totNewClient = totNewClient + numClient

                                totNewAmtSem2 = totNewAmtSem2 + totAmount

                                if (loan_type === "Group Loan" || loan_type === "Agricultural Loan" || loan_type === "Individual Loan - IMEP")  {
                                    totNewCliSem2 = totNewCliSem2 + numClient
                                    }
                
                            } else {
                                totOldAmtSem2 = totOldAmtSem2 +totAmount

                                if (loan_type === "Group Loan" || loan_type === "Agricultural Loan" || loan_type === "Individual Loan - IMEP")  {
                                    totOldCliSem2 = totOldCliSem2 + numClient                            
                                }

                            }
                        }
        
                        ctrBegBals.forEach( listBeg => {
                            const begLonType = listBeg.loan_type
                            const begClient = listBeg.beg_client_count
                            const targYear = listBeg.target_year
                            const begPrincipal = listBeg.beg_principal
                            const begInterest = listBeg.beg_interest
        
                            if (begLonType === loan_type && targYear === budgetYear ) {
                                ctrBegBalCli = begClient
                            }
            
                            // begBalData.push({begLonType: begLonType, begClient: begClient, begPrincipal: begPrincipal, begInterest: begInterest })
                         })
            
                        // const sortKey = _.toString(list.dispView) + list.loan_type + _.toString(list.monthOrder) + list.remarks + strLoanAmount
        
                        const sortKey = fndCenterNo+ _.toString(list.dispView) + list.loan_type + semester + list.remarks + _.toString(list.monthOrder) + strLoanAmount
        
                        const ctrBegBal = ctrBegBals.find(cBeg => cBeg.loan_type === loan_type)
                        // if (!ctrBegBal) {
                        //     ctrBegBalCli = 0
                        // } else {
                        //     ctrBegBalCli = ctrBegBal.beg_client_count
                        // }
        
                        forSortTargets.push({_id: _id, sortKey: sortKey, center: fndCenterNo, loan_type: loan_type, begBal: ctrBegBalCli, month: month, semester: semester, numClient: numClient, amount: amount, 
                            totAmount: totAmount, remarks: remarks, newClient: list.newClient, oldClient: list.oldClient})
                        
                        
                        const lnTypeSortKey = loan_type + fndCenterNo + monthOrder

                        if (fndCtrLnType.length == 0) {
                            fndCtrLnType.push({sortKey: lnTypeSortKey, loan_type: loan_type, center: fndCenterNo, begBalClient: ctrBegBalCli, month: month, month_order: monthOrder})
                        } else {
                            const fndLnType = _.find(fndCtrLnType, {loan_type: loan_type, center: fndCenterNo})
                            if (fndLnType) {
                            
                            } else {
                                fndCtrLnType.push({sortKey: lnTypeSortKey, loan_type: loan_type, center: fndCenterNo, begBalClient: ctrBegBalCli, month: month, month_order: monthOrder})
                            }
                        }

                    }
    
                }) 
                totResign1 = ctrBegBalCli - totOldCliSem1
                totResign2 = (totNewCliSem1 + totOldCliSem1) - totOldCliSem2

                fndCenter.newClient = totNewClient //TypeError: Cannot set property 'newClient' of null
                // Cause of error is, loan_type === "GLP", it should be "Group Loan"
                fndCenter.newClientAmt = totNewAmtSem1 + totNewAmtSem2
                fndCenter.oldClient = totOldCliSem1 + totOldCliSem2
                fndCenter.oldClientAmt = totOldAmtSem1 + totOldAmtSem2
                fndCenter.resClient = totResign1
                fndCenter.resClient2 = totResign2

                fndCenter.save()
            // })
            doneReadCenter = true
    
        }

        let idClientLen = 0
    
        if (doneReadCenter) {
            sortedTargets = forSortTargets.sort( function (a,b) {
                if ( a.sortKey < b.sortKey ){
                    return -1;
                }
                if ( a.sortKey > b.sortKey ){
                    return 1;
                }
                return 0;
            })

            if (sortedTargets.length == 1) {
                idClientLen = 1
            } else {
                idClientLen = sortedTargets.length
            }

            sortedTargLonTyp = fndCtrLnType.sort( function (a,b) {
                if ( a.sortKey < b.sortKey ){
                    return -1;
                }
                if ( a.sortKey > b.sortKey ){
                    return 1;
                }
                return 0;
            })

            let LoanTypeLen = 0 // Length of Loan type of Targets in a Center
            if (loanType.length == 1) {
                LoanTypeLen = 1
            } else {
                LoanTypeLen = loanType.length
            }

            console.log(sortedTargLonTyp)
            let hasSeconHalfReloan = false
            let hasFirstHalfNewLoan = false
            let hasFirstHalfReloan = false
            let targetKeyForUpdet = ""
            // let lonTayps = ""

            // fndCtrLnType.forEach (foundCenter => {

            for(var i=0; i<LoanTypeLen; i++) {  // Loop to SCAN all Targets regardless of Loan Type that have CHANGES

                // const recCenter = loanType[i].center
                const lonTayps = loanType[i].title
                console.log(lonTayps)
                // const lnTypBegBalCli = loanType[i].begBalClient
                // const lnTypMonOrder = loanType[i].month_order
                let recCounter = 0
                let cntrLnTypHasChanged = false

                let newLoanCount = 0
                let oldLoanCount = 0
                let newLoanAmount = 0
                let oldLoanAmount = 0
                let lnTypBegBalCli = 0
        
                let jan_1stHalfNewLoanCount = 0
                let feb_1stHalfNewLoanCount = 0
                let mar_1stHalfNewLoanCount = 0
                let apr_1stHalfNewLoanCount = 0
                let may_1stHalfNewLoanCount = 0
                let jun_1stHalfNewLoanCount = 0

                let jan_1stHalfReLoanCount = 0
                let feb_1stHalfReLoanCount = 0
                let mar_1stHalfReLoanCount = 0
                let apr_1stHalfReLoanCount = 0
                let may_1stHalfReLoanCount = 0
                let jun_1stHalfReLoanCount = 0

                let jan_1stHalfNewLoanAmount = 0
                let feb_1stHalfNewLoanAmount = 0
                let mar_1stHalfNewLoanAmount = 0
                let apr_1stHalfNewLoanAmount = 0
                let may_1stHalfNewLoanAmount = 0
                let jun_1stHalfNewLoanAmount = 0

                let jan_1stHalfReLoanAmount = 0
                let feb_1stHalfReLoanAmount = 0
                let mar_1stHalfReLoanAmount = 0
                let apr_1stHalfReLoanAmount = 0
                let may_1stHalfReLoanAmount = 0
                let jun_1stHalfReLoanAmount = 0

                let jul_2ndHalfNewLoanCount = 0
                let aug_2ndHalfNewLoanCount = 0
                let sep_2ndHalfNewLoanCount = 0
                let oct_2ndHalfNewLoanCount = 0
                let nov_2ndHalfNewLoanCount = 0
                let dec_2ndHalfNewLoanCount = 0

                let jul_2ndHalfReLoanCount = 0
                let aug_2ndHalfReLoanCount = 0
                let sep_2ndHalfReLoanCount = 0
                let oct_2ndHalfReLoanCount = 0
                let nov_2ndHalfReLoanCount = 0
                let dec_2ndHalfReLoanCount = 0

                let jul_2ndHalfNewLoanAmount = 0
                let aug_2ndHalfNewLoanAmount = 0
                let sep_2ndHalfNewLoanAmount = 0
                let oct_2ndHalfNewLoanAmount = 0
                let nov_2ndHalfNewLoanAmount = 0
                let dec_2ndHalfNewLoanAmount = 0

                let jun_2ndHalfReLoanAmount = 0
                let jul_2ndHalfReLoanAmount = 0
                let aug_2ndHalfReLoanAmount = 0
                let sep_2ndHalfReLoanAmount = 0
                let oct_2ndHalfReLoanAmount = 0
                let nov_2ndHalfReLoanAmount = 0
                let dec_2ndHalfReLoanAmount = 0

                let firstHalfNewLoanCount = 0
                let firstHalfNewLoanAmount = 0
                let firstHalfReLoanCount = 0
                let firstHalfReLoanAmount = 0
                let seconHalfNewLoanCount = 0
                let seconHalfNewLoanAmount = 0
                let seconHalfReLoanCount = 0
                let seconHalfReLoanAmount = 0

                let TotfirstHalfNewLoanCount = 0
                let TotfirstHalfNewLoanAmount = 0
                let TotfirstHalfReLoanCount = 0
                let TotfirstHalfReLoanAmount = 0
                let TotseconHalfNewLoanCount = 0
                let TotseconHalfNewLoanAmount = 0
                let TotseconHalfReLoanCount = 0
                let TotseconHalfReLoanAmount = 0

                let resiClient1 = 0
                let resiClient2 = 0 
    
                let lnTyp1stHalf_NLA = 0
                let lnTyp1stHalf_RLC = 0
                let lnTyp1stHalf_RLA = 0
                let lnTyp2ndHalf_NLC = 0
                let lnTyp2ndHalf_NLA = 0
                let lnTyp2ndHalf_RLC = 0
                let lnTyp2ndHalf_RLA = 0
    
                sortedTargets.forEach(target => {
                    const centerTarget = target.center
                    const targetLoanType = target.loan_type
    
                        if (targetLoanType === lonTayps) {
    
                            const tarLoanType = target.loan_type
                            const targMonth = target.month
                            const nTargMonth = target.monthOrder
                            const targClientCount = target.numClient 
                            const targSemester = target.semester
                            const totLonAmount = target.totAmount
                            const targRemarks = target.remarks
                            lnTypBegBalCli = target.begBal
        
                            // if (tarLoanType === loanType) {
                                if (targSemester === "First Half") {
                                    if (target.remarks === "New Loan") {
                                        hasFirstHalfNewLoan = true
        
                                        newLoanAmount = newLoanAmount + totLonAmount
        
                                        firstHalfNewLoanAmount = firstHalfNewLoanAmount + totLonAmount

                                        if (tarLoanType === "Group Loan" || tarLoanType === "Agricultural Loan" || tarLoanType === "Individual Loan - IMEP")  {

                                            newLoanCount = newLoanCount + target.numClient   // New Loan Count running Totals
                                            firstHalfNewLoanCount = firstHalfNewLoanCount + target.numClient
                                            
                                            switch(targMonth) {

                                                case "January": 
                                                    jan_1stHalfNewLoanCount = jan_1stHalfNewLoanCount + targClientCount
                                                    break;
                                                case "February": 
                                                    feb_1stHalfNewLoanCount = feb_1stHalfNewLoanCount + targClientCount
                                                    break;
                                                case "March": 
                                                    mar_1stHalfNewLoanCount = mar_1stHalfNewLoanCount + targClientCount
                                                    break;
                                                case "April": 
                                                    apr_1stHalfNewLoanCount = apr_1stHalfNewLoanCount + targClientCount
                                                    break;
                                                case "May": 
                                                    may_1stHalfNewLoanCount = may_1stHalfNewLoanCount + targClientCount
                                                    break;
                                                case "June": 
                                                    jun_1stHalfNewLoanCount = jun_1stHalfNewLoanCount + targClientCount
                                                    break;
                                                default:
                                                    orderMonth = 0
                                            }   
                                        }
    
                                            switch(targMonth) {
                                                case "January": 
                                                    jan_1stHalfNewLoanAmount = jan_1stHalfNewLoanAmount + totLonAmount
                                                    break;
                                                case "February": 
                                                    feb_1stHalfNewLoanAmount = feb_1stHalfNewLoanAmount + totLonAmount
                                                    break;
                                                case "March": 
                                                    mar_1stHalfNewLoanAmount = mar_1stHalfNewLoanAmount + totLonAmount
                                                    break;
                                                case "April": 
                                                    apr_1stHalfNewLoanAmount = apr_1stHalfNewLoanAmount + totLonAmount
                                                    break;
                                                case "May": 
                                                    may_1stHalfNewLoanAmount = may_1stHalfNewLoanAmount + totLonAmount
                                                    break;
                                                case "June": 
                                                    jun_1stHalfNewLoanAmount = jun_1stHalfNewLoanAmount + totLonAmount
                                                    break;
                                                default:
                                                    orderMonth = 0
                                            }   
            
            
                                    }
                                    else { 
                                        hasFirstHalfReloan = true
                                        monthReLoan1 = targMonth
        
                                        withReloanMonth = targMonth
                                        oldLoanAmount = oldLoanAmount + totLonAmount
                                        targetKeyForUpdet = target.id
        
                                        firstHalfReLoanAmount = firstHalfReLoanAmount + totLonAmount
        
                                        if (tarLoanType === "Group Loan" || tarLoanType === "Agricultural Loan" || tarLoanType === "Individual Loan - IMEP")  {
                                            oldLoanCount  = oldLoanCount + target.numClient
                                            firstHalfReLoanCount = firstHalfReLoanCount + target.numClient

                                            switch(targMonth) {
                                                case "January": 
                                                    jan_1stHalfReLoanCount = jan_1stHalfReLoanCount + targClientCount
                                                    break;
                                                case "February": 
                                                    feb_1stHalfReLoanCount = feb_1stHalfReLoanCount + targClientCount
                                                    break;
                                                case "March": 
                                                    mar_1stHalfReLoanCount = mar_1stHalfReLoanCount + targClientCount
                                                    break;
                                                case "April": 
                                                    apr_1stHalfReLoanCount = apr_1stHalfReLoanCount + targClientCount
                                                    break;
                                                case "May": 
                                                    may_1stHalfReLoanCount = may_1stHalfReLoanCount + targClientCount
                                                    break;
                                                case "June": 
                                                    jun_1stHalfReLoanCount = jun_1stHalfReLoanCount + targClientCount
                                                    break;
                                                default:
                                                    orderMonth = 0
                                            }   
                                        } 
    
    
                                            switch(targMonth) {
                                                case "January": 
                                                    jan_1stHalfReLoanAmount = jan_1stHalfReLoanAmount + totLonAmount
                                                    break;
                                                case "February": 
                                                    feb_1stHalfReLoanAmount = feb_1stHalfReLoanAmount + totLonAmount
                                                    break;
                                                case "March": 
                                                    mar_1stHalfReLoanAmount = mar_1stHalfReLoanAmount + totLonAmount
                                                    break;
                                                case "April": 
                                                    apr_1stHalfReLoanAmount = apr_1stHalfReLoanAmount + totLonAmount
                                                    break;
                                                case "May": 
                                                    may_1stHalfReLoanAmount = may_1stHalfReLoanAmount + totLonAmount
                                                    break;
                                                case "June": 
                                                    jun_1stHalfReLoanAmount = jun_1stHalfReLoanAmount + totLonAmount
                                                    break;
                                                default:
                                                    orderMonth = 0
                                            }   
                                    }
                                }
                                if (targSemester === "Second Half") {
                                    if (target.remarks === "New Loan") {
                                        hasSeconHalfNewLoan = true
        
                                        newLoanAmount = newLoanAmount + totLonAmount
        
                                        seconHalfNewLoanAmount = seconHalfNewLoanAmount + totLonAmount
        
                                        if (tarLoanType === "Group Loan" || tarLoanType === "Agricultural Loan" || tarLoanType === "Individual Loan - IMEP")  {
                                            newLoanCount = newLoanCount + target.numClient   // New Loan Count running Totals
                                            seconHalfNewLoanCount = seconHalfNewLoanCount + target.numClient

                                            switch(targMonth) {
                                                case "July": 
                                                    jul_2ndHalfNewLoanCount = jul_2ndHalfNewLoanCount + targClientCount
                                                    break;
                                                case "August": 
                                                    aug_2ndHalfNewLoanCount = aug_2ndHalfNewLoanCount + targClientCount
                                                    break;
                                                case "September": 
                                                    sep_2ndHalfNewLoanCount = sep_2ndHalfNewLoanCount + targClientCount
                                                    break;
                                                case "October": 
                                                    oct_2ndHalfNewLoanCount = oct_2ndHalfNewLoanCount + targClientCount
                                                    break;
                                                case "November": 
                                                    nov_2ndHalfNewLoanCount = nov_2ndHalfNewLoanCount + targClientCount
                                                    break;
                                                case "December": 
                                                    dec_2ndHalfNewLoanCount = dec_2ndHalfNewLoanCount + targClientCount
                                                    break;
                                                default:
                                                    orderMonth = 0
                                            }   
    
                                        }
                                                
                                        switch(targMonth) {
                                            case "July": 
                                                jul_2ndHalfNewLoanAmount = jul_2ndHalfNewLoanAmount + totLonAmount
                                                break;
                                            case "August": 
                                                aug_2ndHalfNewLoanAmount = aug_2ndHalfNewLoanAmount + totLonAmount
                                                break;
                                            case "September": 
                                                sep_2ndHalfNewLoanAmount = sep_2ndHalfNewLoanAmount + totLonAmount
                                                break;
                                            case "October": 
                                                oct_2ndHalfNewLoanAmount = oct_2ndHalfNewLoanAmount + totLonAmount
                                                break;
                                            case "November": 
                                                nov_2ndHalfNewLoanAmount = nov_2ndHalfNewLoanAmount + totLonAmount
                                                break;
                                            case "December": 
                                                dec_2ndHalfNewLoanAmount = dec_2ndHalfNewLoanAmount + totLonAmount
                                                break;
                                            default:
                                                orderMonth = 0
                                        }   

                                    }
                                    else { 
                                        hasSeconHalfReloan = true
                                        monthReLoan2 = targMonth
        
                                        withReloanMonth = targMonth
                                        oldLoanAmount = oldLoanAmount + totLonAmount
        
                                        seconHalfReLoanAmount = seconHalfReLoanAmount + totLonAmount
        
                                        if (tarLoanType === "Group Loan" || tarLoanType === "Agricultural Loan" || tarLoanType === "Individual Loan - IMEP")  {
                                            oldLoanCount  = oldLoanCount + target.numClient
                                            seconHalfReLoanCount = seconHalfReLoanCount + target.numClient

                                            switch(targMonth) {
                                                case "July": 
                                                    jul_2ndHalfReLoanCount = jul_2ndHalfReLoanCount + targClientCount
                                                    break;
                                                case "August": 
                                                    aug_2ndHalfReLoanCount = aug_2ndHalfReLoanCount + targClientCount
                                                    break;
                                                case "September": 
                                                    sep_2ndHalfReLoanCount = sep_2ndHalfReLoanCount + targClientCount
                                                    break;
                                                case "October": 
                                                    oct_2ndHalfReLoanCount = oct_2ndHalfReLoanCount + targClientCount
                                                    break;
                                                case "November": 
                                                    nov_2ndHalfReLoanCount = nov_2ndHalfReLoanCount + targClientCount
                                                    break;
                                                case "December": 
                                                    dec_2ndHalfReLoanCount = dec_2ndHalfReLoanCount + targClientCount
                                                    break;
                                                default:
                                                    orderMonth = 0
                                            }       
    
                                        }

        
                                        if (tarLoanType === loanType && targMonth === month && targRemarks === remarks) {
                                            forTheMonOldCliCnt = forTheMonOldCliCnt + targClientCount
                                            forTheMonOldCliAmt = forTheMonOldCliAmt + totLonAmount
                                        }

                                        switch(targMonth) {
                                            case "July": 
                                                jul_2ndHalfReLoanAmount = jul_2ndHalfReLoanAmount + totLonAmount
                                                break;
                                            case "August": 
                                                aug_2ndHalfReLoanAmount = aug_2ndHalfReLoanAmount + totLonAmount
                                                break;
                                            case "September": 
                                                sep_2ndHalfReLoanAmount = sep_2ndHalfReLoanAmount + totLonAmount
                                                break;
                                            case "October": 
                                                oct_2ndHalfReLoanAmount = oct_2ndHalfReLoanAmount + totLonAmount
                                                break;
                                            case "November": 
                                                nov_2ndHalfReLoanAmount = nov_2ndHalfReLoanAmount + totLonAmount
                                                break;
                                            case "December": 
                                                dec_2ndHalfReLoanAmount = dec_2ndHalfReLoanAmount + totLonAmount
                                                break;
                                            default:
                                                orderMonth = 0
                                        }   
                                    }
                                
                                }
                            }
    
                }) // end of forEach() loop - sorteTargets

                TotfirstHalfNewLoanCount = jan_1stHalfNewLoanCount + feb_1stHalfNewLoanCount + mar_1stHalfNewLoanCount + apr_1stHalfNewLoanCount + may_1stHalfNewLoanCount + jun_1stHalfNewLoanCount

                TotfirstHalfNewLoanAmount = jan_1stHalfNewLoanAmount + feb_1stHalfNewLoanAmount + mar_1stHalfNewLoanAmount + apr_1stHalfNewLoanAmount + may_1stHalfNewLoanAmount + jun_1stHalfNewLoanAmount

                TotfirstHalfReLoanCount = jan_1stHalfReLoanCount + feb_1stHalfReLoanCount + mar_1stHalfReLoanCount + apr_1stHalfReLoanCount + may_1stHalfReLoanCount + jun_1stHalfReLoanCount

                TotfirstHalfReLoanAmount = jan_1stHalfReLoanAmount + feb_1stHalfReLoanAmount + mar_1stHalfReLoanAmount + apr_1stHalfReLoanAmount + may_1stHalfReLoanAmount + jun_1stHalfReLoanAmount

                TotseconHalfNewLoanCount =  jul_2ndHalfNewLoanCount + aug_2ndHalfNewLoanCount + sep_2ndHalfNewLoanCount + oct_2ndHalfNewLoanCount + nov_2ndHalfNewLoanCount + dec_2ndHalfNewLoanCount

                TotseconHalfNewLoanAmount = jul_2ndHalfNewLoanAmount + aug_2ndHalfNewLoanAmount + sep_2ndHalfNewLoanAmount + oct_2ndHalfNewLoanAmount + nov_2ndHalfNewLoanAmount + dec_2ndHalfNewLoanAmount

                TotseconHalfReLoanCount = jul_2ndHalfReLoanCount + aug_2ndHalfReLoanCount + sep_2ndHalfReLoanCount + oct_2ndHalfReLoanCount + nov_2ndHalfReLoanCount + dec_2ndHalfReLoanCount

                TotseconHalfReLoanAmount = jul_2ndHalfReLoanAmount + aug_2ndHalfReLoanAmount + sep_2ndHalfReLoanAmount + oct_2ndHalfReLoanAmount + nov_2ndHalfReLoanAmount + dec_2ndHalfReLoanAmount

                const grandTotClients = TotfirstHalfNewLoanCount + TotfirstHalfReLoanCount + TotseconHalfNewLoanCount + TotseconHalfReLoanCount

                const grandTotNewClients = TotfirstHalfNewLoanCount + TotseconHalfNewLoanCount
                const grandTotOldClients = TotfirstHalfReLoanCount + TotseconHalfReLoanCount

                // chCntrViewCode1 = "NewLoanClient"
                // chCntrViewCode2 = "NewLoanAmt"

                // chCntrViewCode1 = "OldLoanClient"
                // chCntrViewCode2 = "OldLoanAmt"

                    // if (grandTotNewClients > 0) {
                        const cntr1BudgDet = await Center_budget_det.findOne({ center: centerCode, view_code: "NewLoanClient", loan_type: lonTayps, target_year: budgetYear}, function (err, cntrForChange) {
                            // console.log(cntrForChange)
                            if(!isNull(cntrForChange)) {
                                    cntrForChange.jan_budg = jan_1stHalfNewLoanCount
                                    cntrForChange.feb_budg = feb_1stHalfNewLoanCount
                                    cntrForChange.mar_budg = mar_1stHalfNewLoanCount
                                    cntrForChange.apr_budg = apr_1stHalfNewLoanCount
                                    cntrForChange.may_budg = may_1stHalfNewLoanCount
                                    cntrForChange.jun_budg = jun_1stHalfNewLoanCount

                                    cntrForChange.jul_budg = jul_2ndHalfNewLoanCount
                                    cntrForChange.aug_budg = aug_2ndHalfNewLoanCount
                                    cntrForChange.sep_budg = sep_2ndHalfNewLoanCount
                                    cntrForChange.oct_budg = oct_2ndHalfNewLoanCount
                                    cntrForChange.nov_budg = nov_2ndHalfNewLoanCount
                                    cntrForChange.dec_budg = dec_2ndHalfNewLoanCount

                                cntrForChange.save()
                            }
                        })
                        const cntr2BudgDet = await Center_budget_det.findOne({center: centerCode, view_code: "NewLoanAmt", loan_type: lonTayps, target_year: budgetYear}, function (err, cntrForChange2) {
                            if (!isNull(cntrForChange2)) {
                                        cntrForChange2.jan_budg = jan_1stHalfNewLoanAmount
                                        cntrForChange2.feb_budg = feb_1stHalfNewLoanAmount
                                        cntrForChange2.mar_budg = mar_1stHalfNewLoanAmount
                                        cntrForChange2.apr_budg = apr_1stHalfNewLoanAmount
                                        cntrForChange2.may_budg = may_1stHalfNewLoanAmount
                                        cntrForChange2.jun_budg = jun_1stHalfNewLoanAmount

                                        cntrForChange2.jul_budg = jul_2ndHalfNewLoanAmount
                                        cntrForChange2.aug_budg = aug_2ndHalfNewLoanAmount
                                        cntrForChange2.sep_budg = sep_2ndHalfNewLoanAmount
                                        cntrForChange2.oct_budg = oct_2ndHalfNewLoanAmount
                                        cntrForChange2.nov_budg = nov_2ndHalfNewLoanAmount
                                        cntrForChange2.dec_budg = dec_2ndHalfNewLoanAmount
                                    cntrForChange2.save()
                            }   
                        })
                    // }

                    // if (grandTotOldClients > 0) {

                        const cntr3BudgDet = await Center_budget_det.findOne({ center: centerCode, view_code: "OldLoanClient", loan_type: lonTayps, target_year: budgetYear}, function (err, fndOldClient) {
                            if(!isNull(fndOldClient)) {
                                    fndOldClient.jan_budg = jan_1stHalfReLoanCount
                                    fndOldClient.feb_budg = feb_1stHalfReLoanCount
                                    fndOldClient.mar_budg = mar_1stHalfReLoanCount
                                    fndOldClient.apr_budg = apr_1stHalfReLoanCount
                                    fndOldClient.may_budg = may_1stHalfReLoanCount
                                    fndOldClient.jun_budg = jun_1stHalfReLoanCount

                                    fndOldClient.jul_budg = jul_2ndHalfReLoanCount
                                    fndOldClient.aug_budg = aug_2ndHalfReLoanCount
                                    fndOldClient.sep_budg = sep_2ndHalfReLoanCount
                                    fndOldClient.oct_budg = oct_2ndHalfReLoanCount
                                    fndOldClient.nov_budg = nov_2ndHalfReLoanCount
                                    fndOldClient.dec_budg = dec_2ndHalfReLoanCount

                                fndOldClient.save()
                            }
                        })
                        const cntr4BudgDet = await Center_budget_det.findOne({center: centerCode, view_code: "OldLoanAmt", loan_type: lonTayps, target_year: budgetYear}, function (err, fndOldAmount) {
                            if (!isNull(fndOldAmount)) {
                                // console.log(fndOldAmount)
                                        fndOldAmount.jan_budg = jan_1stHalfReLoanAmount
                                        fndOldAmount.feb_budg = feb_1stHalfReLoanAmount
                                        fndOldAmount.mar_budg = mar_1stHalfReLoanAmount
                                        fndOldAmount.apr_budg = apr_1stHalfReLoanAmount
                                        fndOldAmount.may_budg = may_1stHalfReLoanAmount
                                        fndOldAmount.jun_budg = jun_1stHalfReLoanAmount

                                        fndOldAmount.jul_budg = jul_2ndHalfReLoanAmount
                                        fndOldAmount.aug_budg = aug_2ndHalfReLoanAmount
                                        fndOldAmount.sep_budg = sep_2ndHalfReLoanAmount
                                        fndOldAmount.oct_budg = oct_2ndHalfReLoanAmount
                                        fndOldAmount.nov_budg = nov_2ndHalfReLoanAmount
                                        fndOldAmount.dec_budg = dec_2ndHalfReLoanAmount

                                        fndOldAmount.save()
                                }   
                            })

                    // } 
                    if (lonTayps === "Group Loan" || lonTayps === "Agricultural Loan" || lonTayps === "Individual Loan - IMEP")  {
                        if (hasFirstHalfReloan) {
                            totResign1 = lnTypBegBalCli - (firstHalfReLoanCount)
                        }
                        if (hasSeconHalfReloan) {
                            totResign2 = (firstHalfNewLoanCount + firstHalfReLoanCount) - seconHalfReLoanCount
                        } 
                    } else {
                        totResign1 = 0
                        totResign2 = 0
                    }
                    
                    const totalResign = totResign1 + totResign2

                    if (totalResign >= 0) {

                        let janHasChangedResCli = 0 
                        let febHasChangedResCli = 0 
                        let marHasChangedResCli = 0 
                        let aprHasChangedResCli = 0 
                        let mayHasChangedResCli = 0 
                        let junHasChangedResCli = 0 
                        let julHasChangedResCli = 0 
                        let augHasChangedResCli = 0 
                        let sepHasChangedResCli = 0 
                        let octHasChangedResCli = 0 
                        let novHasChangedResCli = 0 
                        let decHasChangedResCli = 0 

                        switch(monthReLoan1) {
                            case "January": 
                                janHasChangedResCli = totResign1
                                break;
                            case "February": 
                                febHasChangedResCli = totResign1
                                break;
                            case "March": 
                                marHasChangedResCli = totResign1
                                break;
                            case "April": 
                                aprHasChangedResCli = totResign1
                                break;
                            case "May": 
                                mayHasChangedResCli = totResign1
                                break;
                            case "June": 
                                junHasChangedResCli = totResign1
                                break;
                            default:
                                orderMonth = 0
                        }

                        switch(monthReLoan2) {
                            case "July": 
                                julHasChangedResCli = totResign2
                                break;
                            case "August": 
                                augHasChangedResCli = totResign2
                                break;
                            case "September": 
                                sepHasChangedResCli = totResign2
                                break;
                            case "October": 
                                octHasChangedResCli = totResign2
                                break;
                            case "November": 
                                novHasChangedResCli = totResign2
                                break;
                            case "December": 
                                decHasChangedResCli = totResign2
                                break;
                            default:
                                orderMonth = 0
                        }   


                        const ctrResBudgDet = await Center_budget_det.findOne({center: centerCode, loan_type: lonTayps, view_code: "ResClientCount", target_year: budgetYear}, function (err, fndResCli) {
                            const asgd = fndResCli
                            if (!isNull(fndResCli)) {
                                    fndResCli.jan_budg = janHasChangedResCli
                                    fndResCli.feb_budg = febHasChangedResCli
                                    fndResCli.mar_budg = marHasChangedResCli
                                    fndResCli.apr_budg = aprHasChangedResCli
                                    fndResCli.may_budg = mayHasChangedResCli
                                    fndResCli.jun_budg = junHasChangedResCli
                                    fndResCli.jul_budg = julHasChangedResCli
                                    fndResCli.aug_budg = augHasChangedResCli
                                    fndResCli.sep_budg = sepHasChangedResCli
                                    fndResCli.oct_budg = octHasChangedResCli
                                    fndResCli.nov_budg = novHasChangedResCli
                                    fndResCli.dec_budg = decHasChangedResCli

                                if (!isNull(asgd)) {
                                    fndResCli.save()
                                }
                            }
                        })
                    }

            } // end of forEach() loop - fndCtrLnType

        }
        
        if (req.user.role === "BM") {
            res.redirect('/branches/perPOforEdit/' + req.user.assCode)
        } else {
            res.redirect('/centers/'+ centerCode + '/edit')
            // res.redirect('/centers/' + centerCode + '/edit')
        }
        console.log(numClient)
        // alert(Success )
    } catch(err) {
        console.log(err)
        res.redirect('/centers')
    }
})

// Put EDITED TARGETS
// In editing of a Target, it should be one Loan type per multiple edit, cannot be edited multi-loan type in one single EDIT
router.put('/saveEditTargets/:id', authUser, authRole("PO", "BM"), async function(req, res){

    const centerCode = req.params.id
    const unit_ID = centerCode.substr(0,6)
    const yuser = req.user

    const idClient= req.body.idClient
    const numClient = req.body.numClient
    // const totalAmt = req.body.totAmt
    let loanTyp = ""
    let prevLoanTyp = ""
    let forSortTargets = []
    let sortedTargets = []
    let doneReadCenter = false

    let totNewCliSem1 = 0
    let totNewAmtSem1 = 0
    let totNewCliSem2 = 0
    let totNewAmtSem2 = 0

    let totOldCliSem1 = 0
    let totOldAmtSem1 = 0
    let totOldCliSem2 = 0
    let totOldAmtSem2 = 0

    let perLonTypSem1NewCli = 0
    let perLonTypSem1NewAmt = 0
    let perLonTypSem2NewCli = 0
    let perLonTypSem2NewAmt = 0

    let hasChangeTarget = false
    let hasChangeGLP = false
    let resChangeLnType = ""
    let doneReadSortedTarg = false
    let prevLonTyp = ""
    let fndCtrLnType = []

    let perLonTypSem1OldCli = 0
    let perLonTypSem1OldAmt = 0
    let perLonTypSem2OldCli = 0
    let perLonTypSem2OldAmt = 0

    let totBegBal1 = 0
    let totBegBal2 = 0

    let totResign1 = 0
    let totResign2 = 0

    let monthNewLoan1 = ""
    let monthNewLoan2 = ""
    let monthReLoan1 = ""
    let monthReLoan2 = ""
    let num_Client = 0
    let id_Client = ""

    let nowZeroTargetsLength = false
    let nowOneTargetsLength = false

    let poEditedTargPerLonTyp = []

    let hasChangesTarg = false
    let firstSemChanged = false
    let secondSemChanged = false
    let doneUpdating = false
    let ctrBegBalClient = 0

    let cntrTargetView = []

    try {

        let ctrBegBalCli = 0
        let ctrBegBals = []

        const loanType = await Loan_type.find({})

        const fndCenter = await Center.findOne({center: centerCode}, function (err, foundCenter) {
            const ctrTargets = foundCenter.Targets
            ctrBegBals = foundCenter.Loan_beg_bal
            ctrBegBalClient = foundCenter.budget_BegBalCli
            // console.log(foundCenter)
        })

        if (fndCenter) {

            fndCenter.Targets.forEach( list => {
                const targetYear = list.target_year

                if (targetYear === budgetYear) {
                    const _id = list._id
                    const loan_type = list.loan_type
                    const month = list.month
                    const semester = list.semester
                    const numClient = list.numClient
                    const amount = list.amount
                    const totAmount = list.totAmount
                    const remarks = list.remarks
                    const strAmount = _.toString(list.amount)
                    let strLoanAmount = ""
                    if (strAmount.length == 4 ) {
                       strLoanAmount = _.padStart(strAmount,5,'0')
                    } else {
                       strLoanAmount = strAmount
                    }
                    let ctrBegBalCli = 0
    
                    ctrBegBals.forEach( listBeg => {
                        const begLonType = listBeg.loan_type
                        const begClient = listBeg.beg_client_count
                        const targYear = listBeg.target_year
                        const begPrincipal = listBeg.beg_principal
                        const begInterest = listBeg.beg_interest
    
                        if (begLonType === loan_type && targYear === budgetYear ) {
                            ctrBegBalCli = begClient
                        }
        
                        // begBalData.push({begLonType: begLonType, begClient: begClient, begPrincipal: begPrincipal, begInterest: begInterest })
                     })
        
                    // const sortKey = _.toString(list.dispView) + list.loan_type + _.toString(list.monthOrder) + list.remarks + strLoanAmount
    
                    const sortKey = _.toString(list.dispView) + list.loan_type + semester + list.remarks + _.toString(list.monthOrder) + strLoanAmount
    
                    const ctrBegBal = ctrBegBals.find(cBeg => cBeg.loan_type === loan_type)
                    // if (!ctrBegBal) {
                    //     ctrBegBalCli = 0
                    // } else {
                    //     ctrBegBalCli = ctrBegBal.beg_client_count
                    // }
    
                    forSortTargets.push({_id: _id, sortKey: sortKey, loan_type: loan_type, begBal: ctrBegBalCli, month: month, semester: semester, numClient: numClient, amount: amount, 
                        totAmount: totAmount, remarks: remarks, newClient: list.newClient, oldClient: list.oldClient})
    
                }

            }) 
            doneReadCenter = true

        }

        let loanTypeHasChanges = []
        let idClientLen = 0
    
        if (doneReadCenter) {
            sortedTargets = forSortTargets.sort( function (a,b) {
                if ( a.sortKey < b.sortKey ){
                    return -1;
                }
                if ( a.sortKey > b.sortKey ){
                    return 1;
                }
                return 0;
            })

            if (sortedTargets.length == 1) {
                idClientLen = 1
            } else {
                idClientLen = sortedTargets.length
            }

            let lntyptNumCli 

                // *---------------------
                // Scan Targets and SAVE that has changes in CENTER Collection         
                for(var i=0; i<idClientLen; i++) {  // Loop to SCAN all Targets regardless of Loan Type that have CHANGES
                
                    loanTyp = sortedTargets[i].loan_type
                    const semester = sortedTargets[i].semester
                    const remarks = sortedTargets[i].remarks
                    const amount = sortedTargets[i].amount
                    // const totAmount = sortedTargets[i].totAmount
                    const chTargID = sortedTargets[i]._id
                    const chTargMon = sortedTargets[i].month
                    totBegBal1 = sortedTargets[i].begBal

                    const targLength = sortedTargets.length
                    let totAmount = 0

                    if (sortedTargets.length == 1) {
                        id_Client = idClient
                        num_Client = numClient 
                        targetClient = _.toNumber(num_Client)
                        totAmount = targetClient * amount
                        nowOneTargetsLength = true
    
                    } else {
                        id_Client = idClient[i]
                        num_Client = numClient[i]
                        targetClient = _.toNumber(num_Client)
                        totAmount = targetClient * amount
                    }
                    let totalAmt = targetClient * sortedTargets[i].amount
                    const totCliDiff = targetClient - sortedTargets[i].numClient

                    // if (i > 0){ 
                    //     if (loanTyp === prevLonTyp) {
                    //         hasChangeTarget = false
                    //     } else {

                    //         if (hasChangeTarget) {
                    //             loanTypeHasChanges.push({loan_type_title: loanTyp, month: sortedTargets.month})
                    //         }
                    //     }
                    // }

                    if (numClient[i] == sortedTargets[i].numClient) { // if TARGETS have no changes

                        if (semester === "First Half") {

                            if (remarks === "New Loan") {
                                totNewAmtSem1 = totNewAmtSem1 + totAmount
    
                                if (loanTyp === "Group Loan" || loanTyp === "Agricultural Loan" || loanTyp === "Individual Loan - IMEP") {
                                    totBegBal2 = totBegBal2 + targetClient
                                    totNewCliSem1 = totNewCliSem1 + targetClient
                                } else { // Non-GLP Loan Products
                                    // WIll continue on this loop, to get the total clients and loan amounts per loantype
                                    perLonTypSem1NewCli = perLonTypSem1NewCli + sortedTargets[i].numClient
                                    perLonTypSem1NewAmt = perLonTypSem1NewAmt + sortedTargets[i].totAmount
    
                                } 
                            } else {
                                totOldAmtSem1 = totOldAmtSem1 + totAmount
    
                                if (loanTyp === "Group Loan" || loanTyp === "Agricultural Loan" || loanTyp === "Individual Loan - IMEP") {
                                    totBegBal2 = totBegBal2 + targetClient
                                    totOldCliSem1 = totOldCliSem1 + targetClient
                                }
        
                            }
                        } else {   // Second Half
        
                            if (remarks === "New Loan") {
                                if (loanTyp === "Group Loan" || loanTyp === "Agricultural Loan" || loanTyp === "Individual Loan - IMEP") {
                                    totNewCliSem2 = totNewCliSem2 + targetClient
                                }
                                totNewAmtSem2 = totNewAmtSem2 + totAmount
        
                            } else {
                                monthReLoan2 = sortedTargets[i].month
                                if (loanTyp === "Group Loan" || loanTyp === "Agricultural Loan" || loanTyp === "Individual Loan - IMEP") {
                                    totOldCliSem2 = totOldCliSem2 + targetClient
                                }
                                totOldAmtSem2 = totOldAmtSem2 + totAmount
                                
                            }
                        }    
    
                    } else { // Has channges
                        hasChangeTarget = true

                        let targNewLoanCli = 0
                        let targOldLoanCli = 0

                        // const fondCtrLnType = _.find(loanType, {title: loanTyp})

                        if (loanTyp === "Group Loan" || loanTyp === "Agricultural Loan" || loanTyp === "Individual Loan - IMEP") {
                            hasChangeGLP = true
                            resChangeLnType = loanTyp
                        }

                        if (sortedTargets[i].semester === "First Half") {
                            firstSemChanged = true

                            if(sortedTargets[i].remarks === "New Loan") {
                                monthNewLoan1 = sortedTargets[i].month
                                totNewAmtSem1 = totNewAmtSem1 + totAmount

                                if (loanTyp === "Group Loan" || loanTyp === "Agricultural Loan" || loanTyp === "Individual Loan - IMEP") {
                                    totBegBal2 = totBegBal2 + targetClient
                                    totNewCliSem1 = totNewCliSem1 + targetClient

                                } else {

                                }


                            } else {
                                totOldAmtSem1 = totOldAmtSem1 + totAmount

                                if (loanTyp === "Group Loan" || loanTyp === "Agricultural Loan" || loanTyp === "Individual Loan - IMEP") {
                                    monthReLoan1 = sortedTargets[i].month

                                    totBegBal2 = totBegBal2 + targetClient
                                    totOldCliSem1 = totOldCliSem1 + targetClient
                                } else {

                                }
                            }
                        }

                        if (sortedTargets[i].semester === "Second Half") {
                            secondSemChanged = true

                            if(sortedTargets[i].remarks === "New Loan") {

                                monthNewLoan2 = sortedTargets[i].month
                                totNewAmtSem2 = totNewAmtSem2 + totAmount

                                if (loanTyp === "Group Loan" || loanTyp === "Agricultural Loan" || loanTyp === "Individual Loan - IMEP") {
                                    totNewCliSem2 = totNewCliSem2 + targetClient
                                } else {

                                }

                            } else {
                                targOldClient = targetClient

                                totOldAmtSem2 = totOldAmtSem2 + totAmount

                                if (loanTyp === "Group Loan" || loanTyp === "Agricultural Loan" || loanTyp === "Individual Loan - IMEP") {
                                    totOldCliSem2 = totOldCliSem2 + targetClient
                                    monthReLoan2 = sortedTargets[i].month
                                } else {

                                }
                                // totOldCliDiff2 = totOldCliDiff2 + totCliDiff
                                // totOldAmtDiff2 = totOldAmtDiff2 + (totCliDiff * sortedTargets[i].amount)

                            }
                        }


                        if (fndCtrLnType.length == 0) {
                            fndCtrLnType.push({loan_type: loanTyp, month: chTargMon, remarks: remarks})
                        } else {
                            const fndLnType = _.find(fndCtrLnType, {loan_type: loanTyp, month: chTargMon, remarks: remarks})
                            if (fndLnType) {
                            
                            } else {
                                fndCtrLnType.push({loan_type: loanTyp, month: chTargMon, remarks: remarks})
                            }
                        }

                        if (remarks === "New Loan"){
                            targNewLoanCli = targetClient
    
                        } else { // Re-loan
                            targOldLoanCli = targetClient
    
                        }
                        
                        if (targetClient == 0) {
                            sortedTargets[i].numClient = 0
                            sortedTargets[i].totAmount = 0

                            const center = await Center.findOneAndUpdate({center: centerCode}, {$pull: {Targets :{_id: id_Client }}})

                        } else {
                            sortedTargets[i].numClient = targetClient
                            sortedTargets[i].totAmount = totAmount

                            const curResTarcenter =  await Center.findOneAndUpdate({"center": centerCode}, 
                                {$set: {"Targets.$[el].numClient": targetClient, "Targets.$[el].totAmount": totAmount, "Targets.$[el].newClient": targNewLoanCli, "Targets.$[el].oldClient": targOldLoanCli}}, 
                                {arrayFilters: [{"el._id": chTargID }]}, function(err, foundResList){
                                
                                // console.log(foundResList)
                            })
                        }
                        
                        // sortedTargets.save()

                        cntrTargetView.push({_id: sortedTargets[i]._id, sortKey: sortedTargets[i].sortKey, loan_type: loanTyp, month: sortedTargets[i].month, semester: sortedTargets[i].semester, 
                            newNumClient: targetClient, oldNumClient: sortedTargets[i].numClient, amount: sortedTargets[i].amount, remarks: remarks})
                    }

                    if (i == (idClientLen - 1) && hasChangeTarget) {  // Last item/record in the Targets

                        const totalTargClients = totNewCliSem1 + totNewCliSem2 + totOldCliSem1 + totOldCliSem2

                        if (totOldCliSem2 > 0) {
                            totResign2 = totBegBal2 - totOldCliSem2
                        }    

                        if (ctrBegBalClient > 0) {
                            totResign1 = ctrBegBalClient - totOldCliSem1
                        } else {
                            totResign1 = 0
                        }

                        totalNewClient = totNewCliSem1 + totNewCliSem2
                        let doneReadCtrHasChange = false
    
                        const ctrBudgDet = await Center.findOne({center: centerCode}) //, function (err, fndOldCli) {
                            if (!isNull(ctrBudgDet)) {
                                const fndOldCli = ctrBudgDet
                                if (totalTargClients == 0 ) {  // ALL TARGETS IS ZERO
                                    fndOldCli.newClient = 0
                                    // Cause of error is, loan_type === "GLP", it should be "Group Loan"
                                    fndOldCli.newClientAmt = 0
                                    fndOldCli.oldClient = 0
                                    fndOldCli.oldClientAmt = 0
                                    fndOldCli.resClient = 0
                                    fndOldCli.resClient2 = 0
    
                                } else {
                                    fndOldCli.newClient = totalNewClient //TypeError: Cannot set property 'newClient' of null
                                    // Cause of error is, loan_type === "GLP", it should be "Group Loan"
                                    fndOldCli.newClientAmt = totNewAmtSem1 + totNewAmtSem2
                                    fndOldCli.oldClient = totOldCliSem1 + totOldCliSem2
                                    fndOldCli.oldClientAmt = totOldAmtSem1 + totOldAmtSem2
                                    fndOldCli.resClient = totResign1
                                    fndOldCli.resClient2 = totResign2
                                    
                                }
                                fndOldCli.save()
                                doneReadCtrHasChange = true
                                // To update newClient, NewClientAmt, oldClient, oldClientAmt, resClient, resClient2 in CENTER fields
    
                            }
                        // })

                        const totalResign = totResign1 + totResign2

                        if (totalResign >= 0 && hasChangeGLP) {

                            let janHasChangedResCli = 0 
                            let febHasChangedResCli = 0 
                            let marHasChangedResCli = 0 
                            let aprHasChangedResCli = 0 
                            let mayHasChangedResCli = 0 
                            let junHasChangedResCli = 0 
                            let julHasChangedResCli = 0 
                            let augHasChangedResCli = 0 
                            let sepHasChangedResCli = 0 
                            let octHasChangedResCli = 0 
                            let novHasChangedResCli = 0 
                            let decHasChangedResCli = 0 

                            switch(monthReLoan1) {
                                case "January": 
                                    janHasChangedResCli = totResign1
                                    break;
                                case "February": 
                                    febHasChangedResCli = totResign1
                                    break;
                                case "March": 
                                    marHasChangedResCli = totResign1
                                    break;
                                case "April": 
                                    aprHasChangedResCli = totResign1
                                    break;
                                case "May": 
                                    mayHasChangedResCli = totResign1
                                    break;
                                case "June": 
                                    junHasChangedResCli = totResign1
                                    break;
                                default:
                                    orderMonth = 0
                            }

                            switch(monthReLoan2) {
                                case "July": 
                                    julHasChangedResCli = totResign2
                                    break;
                                case "August": 
                                    augHasChangedResCli = totResign2
                                    break;
                                case "September": 
                                    sepHasChangedResCli = totResign2
                                    break;
                                case "October": 
                                    octHasChangedResCli = totResign2
                                    break;
                                case "November": 
                                    novHasChangedResCli = totResign2
                                    break;
                                case "December": 
                                    decHasChangedResCli = totResign2
                                    break;
                                default:
                                    orderMonth = 0
                            }   


                            const ctrResBudgDet = await Center_budget_det.findOne({center: centerCode, loan_type: resChangeLnType, view_code: "ResClientCount"}, function (err, fndResCli) {
                                const asgd = fndResCli

                                        fndResCli.jan_budg = janHasChangedResCli
                                        fndResCli.feb_budg = febHasChangedResCli
                                        fndResCli.mar_budg = marHasChangedResCli
                                        fndResCli.apr_budg = aprHasChangedResCli
                                        fndResCli.may_budg = mayHasChangedResCli
                                        fndResCli.jun_budg = junHasChangedResCli
                                        fndResCli.jul_budg = julHasChangedResCli
                                        fndResCli.aug_budg = augHasChangedResCli
                                        fndResCli.sep_budg = sepHasChangedResCli
                                        fndResCli.oct_budg = octHasChangedResCli
                                        fndResCli.nov_budg = novHasChangedResCli
                                        fndResCli.dec_budg = decHasChangedResCli

                                if (!isNull(asgd)) {
                                    fndResCli.save()
                                }
                            })
                        }


                    }
                    prevLonTyp = loanTyp
                    doneReadSortedTarg = true
                }
            // END of SCANning Targets that have changes
            // *---------------------
            
            console.log(fndCtrLnType)
            console.log(cntrTargetView)

            //NEW LOOP

            let sameLonTypMonNewCli = 0
            let sameLonTypMonOldCli = 0
            let chTotalClient = 0
            let chCntrViewCode1 = ""
            let chCntrViewCode2 = ""
            let chLonTypeLen = fndCtrLnType.length

            // if (doneReadSortedTarg && hasChangeTarget) {

                // fndCtrLnType.forEach(ctrLoan_type => {

                for(var i=0; i<chLonTypeLen; i++) {  // Loop to SCAN all Targets regardless of Loan Type that have CHANGES

                    const typeLoan = _.trim(fndCtrLnType[i].loan_type)
                    const chTargMon = fndCtrLnType[i].month
                    const chTargRem = fndCtrLnType[i].remarks

                    if (chTargRem === "New Loan"){
                        chCntrViewCode1 = "NewLoanClient"
                        chCntrViewCode2 = "NewLoanAmt"
                    } else { // Re-loan
                        chCntrViewCode1 = "OldLoanClient"
                        chCntrViewCode2 = "OldLoanAmt"
                    }
                    let chLoanTotCount = 0
                    let chLoanTotAmt = 0

                    sortedTargets.forEach(updatedCtrTargets => {

                        const chTargID = updatedCtrTargets._id
                        const chLonType = updatedCtrTargets.loan_type
                        const chMonth = updatedCtrTargets.month
                        const chTargRemarks = updatedCtrTargets.remarks
                        const chNewNumClient = updatedCtrTargets.numClient
                        const chNewTotAmount = updatedCtrTargets.totAmount

                        if (chLonType === typeLoan && chMonth === chTargMon && chTargRemarks === chTargRem) { 
                            chLoanTotCount = chLoanTotCount + chNewNumClient
                            chLoanTotAmt = chLoanTotAmt + chNewTotAmount
                        } 
                    })


                    const cntrBudgDet = await Center_budget_det.findOne({"center": centerCode, view_code: chCntrViewCode1, loan_type: typeLoan}, function (err, cntrForChange) {

                        switch(chTargMon) {
                            case "January": 
                                cntrForChange.jan_budg = chLoanTotCount
                                break;
                            case "February": 
                                cntrForChange.feb_budg = chLoanTotCount
                                break;
                            case "March": 
                                cntrForChange.mar_budg = chLoanTotCount
                                break;
                            case "April": 
                                cntrForChange.apr_budg = chLoanTotCount
                                break;
                            case "May": 
                                cntrForChange.may_budg = chLoanTotCount
                                break;
                            case "June": 
                                cntrForChange.jun_budg = chLoanTotCount
                                break;
                            case "July": 
                                cntrForChange.jul_budg = chLoanTotCount
                                break;
                            case "August": 
                                cntrForChange.aug_budg = chLoanTotCount
                                break;
                            case "September": 
                                cntrForChange.sep_budg = chLoanTotCount
                                break;
                            case "October": 
                                cntrForChange.oct_budg = chLoanTotCount
                                break;
                            case "November": 
                                cntrForChange.nov_budg = chLoanTotCount
                                break;
                            case "December": 
                                cntrForChange.dec_budg = chLoanTotCount
                                break;
                            default:
                                orderMonth = 0
                            }   
                            cntrForChange.save()
                    })

                    const cntr2BudgDet = await Center_budget_det.findOne({"center": centerCode, view_code: chCntrViewCode2, loan_type: typeLoan}, function (err, cntrForChange2) {
                        if (!isNull(cntrForChange2)) {
                            switch(chTargMon) {

                                case "January": 
                                    cntrForChange2.jan_budg = chLoanTotAmt
                                    break;
                                case "February": 
                                    cntrForChange2.feb_budg = chLoanTotAmt
                                    break;
                                case "March": 
                                    cntrForChange2.mar_budg = chLoanTotAmt
                                    break;
                                case "April": 
                                    cntrForChange2.apr_budg = chLoanTotAmt
                                    break;
                                case "May": 
                                    cntrForChange2.may_budg = chLoanTotAmt
                                    break;
                                case "June": 
                                    cntrForChange2.jun_budg = chLoanTotAmt
                                    break;
                                case "July": 
                                    cntrForChange2.jul_budg = chLoanTotAmt
                                    break;
                                case "August": 
                                    cntrForChange2.aug_budg = chLoanTotAmt
                                    break;
                                case "September": 
                                    cntrForChange2.sep_budg = chLoanTotAmt
                                    break;
                                case "October": 
                                    cntrForChange2.oct_budg = chLoanTotAmt
                                    break;
                                case "November": 
                                    cntrForChange2.nov_budg = chLoanTotAmt
                                    break;
                                case "December": 
                                    cntrForChange2.dec_budg = chLoanTotAmt
                                    break;
                                default:
                                    orderMonth = 0
                                }   
                                cntrForChange2.save()
                        }
                    })
                    
                }
    
                        
        }
        
        if (req.user.role === "BM") {
            res.redirect('/branches/perPOforEdit/' + req.user.assCode)
        } else {
            res.redirect('/centers/' + centerCode + '/edit')
        }
        console.log(numClient)
        // alert(Success )
    } catch(err) {
        console.log(err)
        res.redirect('/centers')
    }
})

// Put BEGINNING BALANCES
// In setting Beginning Balances, it is only applicable to GLP or AGL. 
// Setting of Beginning Balances for other Loan products is as is at Set Targets
router.put('/saveBegBals/:id', authUser, authRole("PO"), async function(req, res){

    const poCode = req.params.id
    const unit_ID = poCode.substr(0,5)
    const yuser = req.user
    const branchCode = poCode.substr(0,3)
    const poNumber = poCode.substr(5,1)

    const numClient = req.body.numClient
    const begCenter = req.body.begCenter
    const begInterest = req.body.begInterest
    const begPrincipal = req.body.begPrincipal
    const month = req.body.month
    const begBalID = req.body.idBegbal
    // const totalAmt = req.body.totAmt
    let doneReadCenter = false

    let loanTyp = ""
    let hasChangesBal = false
    let centerCode = ""
    let canSaveBegBal = false
    let canSaveNewBegBal = false
    let doneSaveFromOldClient = false
    let doneSaveFromOldAmt = false

    try {

            for(var i=0; i<begCenter.length; i++) {

                // if (numClient[i] > 0) {
                    centerCode = begCenter[i]
                    let totBegAmount = 0
                    let num_Client = _.toNumber(numClient[i])
                    let begMonth = month[i]
                    let numMaturityMonth = 0
                    switch(begMonth) {
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
            
                    canSaveBegBal = false
                    canSaveNewBegBal = true
                    let doneReadBegBal = false
                    let hasChangedBegBal = false
                    let canDeleteBegBal = false
                    let centerFound
    
                    const fndCenter = await Center.findOne({center: centerCode}, function (err, centrFound) {
                        centerFound = centrFound
                    })

                    centerFound = fndCenter
                    console.log(fndCenter)

                        if (!isNull(fndCenter)) {
                            const curLoanBeg = fndCenter.Loan_beg_bal
                            loanTyp = fndCenter.loan_type
                            totBegAmount = _.toNumber(begPrincipal[i]) + _.toNumber(begInterest[i])
                                        
                            if (curLoanBeg.length === 0  && num_Client > 0) {
                                let item = {
                                    target_year: budgetYear,
                                    beg_amount: totBegAmount,
                                    loan_type: loanTyp,
                                    beg_interest: begInterest[i],
                                    beg_principal: begPrincipal[i],
                                    beg_client_count: num_Client,
                                    expected_maturity_date: begMonth,
                                    month_number: numMaturityMonth,
                                    dispView: 1
                                 }
    
                                fndCenter.Loan_beg_bal.push(item);

                                canSaveBegBal = true
    
                            } else {

                                curLoanBeg.forEach(ctrBegBal => {
                                    const begBalClient = ctrBegBal.beg_client_count

                                    if (ctrBegBal.loan_type === loanTyp) {

                                        if (ctrBegBal.target_year === budgetYear) {
                                            if (begBalClient == num_Client && ctrBegBal.expected_maturity_date === begMonth) {

                                            } else {
                                                hasChangedBegBal = false
                                                if (num_Client == 0) {
                                                    canDeleteBegBal = true
                                                }
                                                canSaveBegBal = true
                                            }
                                            canSaveNewBegBal = false
                                            
                                        } else {

                                            canSaveNewBegBal = true
                                        }

                                    } else {

                                        canSaveNewBegBal = true

                                    }
                                    doneReadBegBal = true
                                })

                                    if (doneReadBegBal && canSaveNewBegBal && num_Client > 0) {
                                        let item = {
                                            target_year: budgetYear,
                                            loan_type: loanTyp,
                                            beg_amount: totBegAmount,
                                            beg_interest: begInterest[i],
                                            beg_principal: begPrincipal[i],
                                            beg_client_count: num_Client,
                                            expected_maturity_date: begMonth,
                                            month_number: numMaturityMonth,
                                            dispView: 1
                                         }
    
                                        fndCenter.Loan_beg_bal.push(item);

                                        canSaveBegBal = true
                                    }

                            }

                            if (isNull(curLoanBeg) || num_Client === 0) {
                                fndCenter.beg_center_month = ""
                            }

                            if (canSaveBegBal) {
                                if (canDeleteBegBal) {
                                    fndCenter.beg_center_month = ""
                                } else {
                                    if (num_Client === 0) {
                                        fndCenter.beg_center_month = ""
                                    } else {
                                        fndCenter.beg_center_month = begMonth
                                    }
                                }
                                fndCenter.budget_BegBalCli = num_Client
            
                                fndCenter.region = req.user.region
                                fndCenter.save(); 
                            }                           
                            doneReadCenter = true

                            if (num_Client === 0 && canDeleteBegBal) {
                                const center = await Center.findOneAndUpdate({center: centerCode}, {$pull: {Loan_beg_bal :{_id: begBalID[i] }}})                        
                            }

                            if (canSaveBegBal) {
                                const curResTarcenter =  await Center.findOneAndUpdate({"center": centerCode}, 
                                    {$set: {"Loan_beg_bal.$[el].beg_client_count": num_Client, "Loan_beg_bal.$[el].beg_amount": totBegAmount, "Loan_beg_bal.$[el].beg_interest": begInterest[i], 
                                    "Loan_beg_bal.$[el].beg_principal": begPrincipal[i], "Loan_beg_bal.$[el].expected_maturity_date": month[i], "Loan_beg_bal.$[el].month_number": numMaturityMonth }}, 
                                    {arrayFilters: [{"el.loan_type": loanTyp }]}, function(err, foundResList){
                                    
                                        console.log(foundResList)
                                })

                                const ctrBBalCli = await Center_budget_det.findOne({center: centerCode, loan_type: loanTyp, view_code: "OldLoanClient", target_year: budgetYear}, function (err, fndBegBalCli) {
                                    const ctrBegBalCli = fndBegBalCli
                                    console.log(fndBegBalCli)
                                    if (isNull(ctrBegBalCli)) {
                                        let OLDCtrCliBudg = new Center_budget_det({
                                            region: req.user.region, area: req.user.area, branch: branchCode, unit: unit_ID, po: poNumber, po_code: poCode, center: centerCode, target_year: budgetYear,
                                            view_type: "PUH", loan_type: loanTyp, beg_bal: num_Client, beg_bal_amt: begPrincipal[i], beg_bal_int: begInterest[i], client_count_included: true, view_code: "OldLoanClient", 
                                            jan_budg: 0, feb_budg: 0, mar_budg: 0, apr_budg: 0, may_budg: 0, jun_budg: 0, jul_budg: 0, aug_budg: 0, sep_budg: 0, oct_budg: 0, nov_budg: 0, dec_budg: 0
                                            })
                                    
                                            OLDCtrCliBudg.save()
                
                                    } else {
                                        fndBegBalCli.target_year =  budgetYear,
                                        fndBegBalCli.beg_bal = num_Client
                                        fndBegBalCli.beg_bal_amt = begPrincipal[i]
                                        fndBegBalCli.beg_bal_int = begInterest[i]
                                        
                                        fndBegBalCli.save();
                
                                    }
                                    doneSaveFromOldClient = true
                                })
                
                
                                const ctrBudgDetBBalAmt = await Center_budget_det.findOne({center: centerCode, loan_type: loanTyp, view_code: "OldLoanAmt", target_year: budgetYear}, function (err, fndBegBalAmt) {
                                    const ctrBudgDetBegBalAmt = fndBegBalAmt
                                    console.log(fndBegBalAmt)

                                    if (isNull(ctrBudgDetBegBalAmt)) {
                                        let OLFCtrAMTBudg = new Center_budget_det({
                                            region: req.user.region, area: req.user.area, branch: branchCode, unit: unit_ID, po: poNumber, po_code: poCode, center: centerCode, target_year: budgetYear,
                                            view_type: "PUH", loan_type: loanTyp, beg_bal: num_Client, beg_bal_amt: begPrincipal[i], beg_bal_int: begInterest[i], client_count_included: true, view_code: "OldLoanAmt", 
                                            jan_budg: 0, feb_budg: 0, mar_budg: 0, apr_budg: 0, may_budg: 0, jun_budg: 0, jul_budg: 0, aug_budg: 0, sep_budg: 0, oct_budg: 0, nov_budg: 0, dec_budg: 0
                                        })
                                    
                                        OLFCtrAMTBudg.save()
                
                                    } else {
                                        fndBegBalAmt.target_year =  budgetYear,
                                        fndBegBalAmt.beg_bal = num_Client
                                        fndBegBalAmt.beg_bal_amt = begPrincipal[i]
                                        fndBegBalAmt.beg_bal_int = begInterest[i]
                                            
                                        fndBegBalAmt.save()
                                    }
                                    doneSaveFromOldAmt = true
                                })                
                            }
                            doneReadCenter = true
                        }
        }

        if (doneReadCenter && doneSaveFromOldAmt && doneSaveFromOldClient) {
                res.redirect('/centers/viewTarget/' + poCode + "target_mode")
            }
        console.log(numClient)
        // alert(Success )
    } catch(err) {
        console.log(err)
        res.redirect('/centers')
    }
})

// Set Budget Beginning Balances
router.get('/setBegBal/:id', authUser, authRole("PO"), async (req, res) => {

    centerCode = req.params.id
    unit_ID = centerCode.substr(0,6)
    yuser = req.user
//    console.log(unit_ID)
   let forSortTargets = []
   let sortedTargets = []
   let foundTarg = []
    let loanType = []
    let locals = ""
    let doneReadCenter = false

    try {

       loType = await Loan_type.find({}, function (err, foundLoan) {
           loanType = foundLoan
       })
    //    console.log(loanType)

       const center = await Center.findOne({center: req.params.id}, function (err, foundlist) {
        foundTarg = foundlist
       })

        if (center.length !== 0) {
            center.Loan_beg_bal.forEach( begBalList => {
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
            })
            doneReadCenter = true
        } else {
            doneReadCenter = true
        }

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

       if (doneReadCenter) {
           res.render("centers/setBegBal", {
               unitID: unit_ID,
               loanType: loanType,
               listTitle: centerCode, 
               newListItems: sortedTargets,
               monthSelect: begMonthSelect,
               locals: locals,
               yuser: yuser
           });
        }


   } catch (err) {
       console.log(err)
       res.redirect('/centers')
   }
})

// PUT /save Beginning Balances per center

router.put("/putBegBal/:id", authUser, authRole("PO"), async function(req, res){
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
    const _user = req.user

    let bgloanType = []
    let fnView = 0
    let item =[]

    let fndCtrBudgDetCliBegBal = []
    let fndCenterBudgDetAmtBegBal = []
    let locals
    
    let doneReadBegBalCli = false
    let doneReadBegBalAmt = false
    let ctrBegBalCli = []
    let ctrBudgDetBegBalAmt = []
    let doneSaveFromOldClient = false
    let doneSaveFromOldAmt = false

    let centerFound = []
    let doneReadCtr = false
    let curLoanBeg = []
    let doneReadCenterBegBal = false
    let canSaveBegBal = false


    try {

        // loType = await Loan_type.find({glp_topUp:true}, function (err, foundLoan) {

        // loType = await Loan_type.find({}, function (err, foundLoan) {
        //     bgloanType = foundLoan
        // })
 
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

        const ctrFound = await Center.findOne({center: centerCode}, function(err, foundCtr){ 
            centerFound = foundCtr

              const curLoanBeg = foundCtr.Loan_beg_bal
            
              console.log(curLoanBeg)

              item = {
                target_year: budgetYear,
                loan_type: begLoanType,
                beg_amount: bBalAmt,
                beg_interest: begBalInterest,
                beg_principal: begBalPrinc,
                beg_client_count: bClientCnt,
                expected_maturity_date:monthNumber,
                month_number: numMaturityMonth,
                dispView: fnView
             }

            if (curLoanBeg.length == 0) {

                    if (begLoanType === "Group Loan" || begLoanType === "Agricultural Loan" || begLoanType === "Individual Loan - IMEP") {
                        foundCtr.budget_BegBalCli = bClientCnt

                    }
                    foundCtr.beg_center_month = monthNumber
                    foundCtr.region = req.user.region
                    foundCtr.Loan_beg_bal.push(item);
                    foundCtr.save();

                    canSaveBegBal = true

            } else {
                    curLoanBeg.forEach(curLoanBegBal => {
                        if (curLoanBegBal.loan_type === _.trim(begLoanType)) {
                            locals = {errorMessage: 'Beginning balance for '+ begLoanType +'  is already exists!'}
                            canSaveBegBal = false
                        } else {
                            foundCtr.Loan_beg_bal.push(item);
                            foundCtr.save();
                                    canSaveBegBal = true
                        }
                    })
            }            
                doneReadCenterBegBal = true
        })
    
        
        // Saving Loan Beginning Balances to center_budget_dets.. NOTE: To be done only when setting Targets is finished!
        if (doneReadCenterBegBal && canSaveBegBal) {
            let canSaveOldLoanCli = false  
            let canSaveOldLoanAmt = false

            const ctrBBalCli = await Center_budget_det.findOne({center: centerCode, loan_type: begLoanType, view_code: "OldLoanClient", target_year: budgetYear}, function (err, fndBegBalCli) {
                ctrBegBalCli = fndBegBalCli
                console.log(fndBegBalCli)
                if (isNull(ctrBegBalCli)) {
                    let OLDCtrCliBudg = new Center_budget_det({
                        region: _user.region, area: _user.area, branch: branchCode, unit: unitCode, po: poNumber, po_code: poCode, center: centerCode, 
                        view_type: "PUH", loan_type: begLoanType, beg_bal: bClientCnt, beg_bal_amt: begBalPrinc, beg_bal_int: begBalInterest, client_count_included: true, view_code: "OldLoanClient", 
                        target_year: budgetYear, jan_budg: 0, feb_budg: 0, mar_budg: 0, apr_budg: 0, may_budg: 0, jun_budg: 0, jul_budg: 0, aug_budg: 0, sep_budg: 0, oct_budg: 0, nov_budg: 0, dec_budg: 0
                        })
                    
                        OLDCtrCliBudg.save()

                } else {
                    fndBegBalCli.target_year =  budgetYear,
                    fndBegBalCli.beg_bal = bClientCnt
                    fndBegBalCli.beg_bal_amt = begBalPrinc
                    fndBegBalCli.beg_bal_int = begBalInterest
                    
                    fndBegBalCli.save();

                }
                doneSaveFromOldClient = true
            })


            const ctrBudgDetBBalAmt = await Center_budget_det.findOne({center: centerCode, loan_type: begLoanType, view_code: "OldLoanAmt", target_year: budgetYear}, function (err, fndBegBalAmt) {
                ctrBudgDetBegBalAmt = fndBegBalAmt
                console.log(fndBegBalAmt)

                if (isNull(ctrBudgDetBegBalAmt)) {
                    let OLFCtrAMTBudg = new Center_budget_det({
                        region: _user.region, area: _user.area, branch: branchCode, unit: unitCode, po: poNumber, po_code: poCode, center: centerCode,
                        view_type: "PUH", loan_type: begLoanType, beg_bal: bBalAmt, beg_bal_amt: begBalPrinc, beg_bal_int: begBalInterest, client_count_included: true, view_code: "OldLoanAmt", 
                        target_year: budgetYear, jan_budg: 0, feb_budg: 0, mar_budg: 0, apr_budg: 0, may_budg: 0, jun_budg: 0, jul_budg: 0, aug_budg: 0, sep_budg: 0, oct_budg: 0, nov_budg: 0, dec_budg: 0
                    })
                    
                    OLFCtrAMTBudg.save()

                } else {
                    fndBegBalAmt.target_year =  budgetYear,
                    fndBegBalAmt.beg_bal = bBalAmt
                    fndBegBalAmt.beg_bal_amt = begBalPrinc
                    fndBegBalAmt.beg_bal_int = begBalInterest
                            
                    fndBegBalAmt.save()
                }
                doneSaveFromOldAmt = true
            })

            // if (doneSaveFromOldClient && doneSaveFromOldAmt) {

                res.redirect('/centers/setBegBal/' + centerCode)

            // }

        // } else {
        
        //     if (doneReadCenterBegBal && !canSaveBegBal) {
        //         res.render('centers/setBegBal', { 
        //             unitID: poCode,
        //             loanType: bgloanType,
        //             listTitle: centerCode, 
        //             newListItems: curLoanBeg,
        //             monthSelect: begMonthSelect,
        //             locals: locals
        //         })    
        //     }
        }   
    } catch(err) {
        console.log(err)
        res.redirect('/centers')
    }
  
  })

  // DELETE Beginning Balances...
  router.post('/delBegBal/:id', authUser, authRole("PO"), async (req, res) => {
    //   alert('Are you sure you want to delete this record?')
        let centerCode = _.trim(req.body.listName)
        const checkedItemId = _.trim(req.body.checkbox)
        const listName = req.params.id
        const yuser = req.user

       let delLoanType = ""
       let delLoanAmt = 0
       let delLoanClient = 0
       let doneUpdateOldClient = false
       let doneUpdateOldAmt = false
       let doneReadCenter = false
        let doneReadCtr = false

        let fndCenterDetBegBal = []
        let fondCtr = []

       try {       
      

        const modiCtr = await Center.findOne({center: listName}, function (err, fndCtr) {
            fondCtr = fndCtr
        
                const foundBegBal = fondCtr.Loan_beg_bal

                foundBegBal.forEach(cntrBegBal => {
                    const walaLang = cntrBegBal.expected_maturity_date
                    const begBalID = cntrBegBal.id
                    // budget_BegBalCli
                    if (cntrBegBal.id === checkedItemId) {
                        delLoanType = cntrBegBal.loan_type
                        delLoanClient = cntrBegBal.beg_client_count
                        delLoanAmt = cntrBegBal.beg_amount
                    }
                })
                fondCtr.target_year = budgetYear
                fondCtr.beg_center_month = ""
                fondCtr.budget_BegBalCli = 0
                fondCtr.save()

            doneReadCenter = true
        }) //, function(err, modifCenter) {

        const center = await Center.findOneAndUpdate({center: listName}, {$pull: {Loan_beg_bal :{_id: checkedItemId }}})
        
        // console.log(delLoanType)
           if (doneReadCenter) {
                // Updating Loan Beginning Balances to center_budget_dets.. 
                const centerBudgDetFound = await Center_budget_det.findOne({center: centerCode, loan_type: delLoanType, view_code: "OldLoanClient", target_year: budgetYear}, function(err, fndVwList){ 
                    fndCenterDetBegBal = fndVwList
                        console.log(fndCenterDetBegBal)
                        
                        fndCenterDetBegBal.target_year = budgetYear
                        fndCenterDetBegBal.beg_bal = 0
                        fndCenterDetBegBal.beg_bal_amt = 0
                        fndCenterDetBegBal.beg_bal_int = 0
                        
                        fndCenterDetBegBal.save();

                        doneUpdateOldClient = true
                })

                let fndCBDBegAmt = []
                const center2BudgDetFound = await Center_budget_det.findOne({center: centerCode, loan_type: delLoanType, view_code: "OldLoanAmt", target_year: budgetYear}, function(err, foundBegAmtList){ 
                    fndCBDBegAmt = foundBegAmtList
                        console.log(foundBegAmtList)

                        foundBegAmtList.target_year = budgetYear
                        foundBegAmtList.beg_bal = 0
                        foundBegAmtList.beg_bal_amt = 0
                        foundBegAmtList.beg_bal_int = 0
                        
                        foundBegAmtList.save();
                    doneUpdateOldAmt = true
                })

                const centerResCliFound = await Center_budget_det.findOne({center: centerCode, loan_type: delLoanType, view_code: "ResClientCount", target_year: budgetYear}, function(err, fndVwList){ 
                    fndResCliBegBal = fndVwList
                        console.log(fndResCliBegBal)
                        if (!isNull(fndResCliBegBal.target_year)) {
                            fndResCliBegBal.target_year = budgetYear

                        }
                        fndResCliBegBal.jan_budg = 0
                        fndResCliBegBal.feb_budg = 0
                        fndResCliBegBal.mar_budg = 0
                        fndResCliBegBal.apr_budg = 0
                        fndResCliBegBal.may_budg = 0
                        fndResCliBegBal.jun_budg = 0
                        fndResCliBegBal.jul_budg = 0
                        fndResCliBegBal.aug_budg = 0
                        fndResCliBegBal.sep_budg = 0
                        fndResCliBegBal.oct_budg = 0
                        fndResCliBegBal.nov_budg = 0
                        fndResCliBegBal.dec_budg = 0
                        
                        fndResCliBegBal.save();

                        doneUpdateOldClient = true
                })


            // }

            // if (doneReadCenter && doneUpdateOldClient && doneUpdateOldAmt) {

                const ip = (req.headers['x-forwarded-for'] || req.connection.remoteAddress)
                let loggedUser = new User_log({
                    IP: ip,
                    login_date: new Date(),
                    user_name: req.user.name,
                    assign_code: req.user.assCode,
                    activity: "Delete Beginning Balance for Center: " + centerCode,
                    activity_desc: "Delete Beginning Balance for Center: " + centerCode
                   })
                    const saveLogUser = loggedUser.save()

                res.redirect('/centers/setBegBal/' + centerCode)
            }

        } catch (err) {
           console.log(err)
           res.redirect('/centers')
        }  
   })

// SAVE TARGET
//Save targets to Targets array field in center collection
//
router.put("/:id", authUser, authRole("PO"), async function(req, res){

    const loanType = req.body.loanType
    const month = req.body.month
    const semester = req.body.semester
    const lonTerm = req.body.loanTerm
    const numClient = _.toNumber(req.body.numClient)
    const amount = _.toNumber(_.replace(req.body.amount,',',''))
    const totAmount = numClient * amount
    const remarks = req.body.remarks
    const centerCode = req.params.id
    const yuser = req.user
    let loanTerm = ""

    switch (lonTerm) {
        case "2 Months":
            loanTerm = "2"
            break;
        case "3 Months":
            loanTerm = "3"
            break;
        case "4 Months":
            loanTerm = "6"
            break;
        default:
            loanTerm = "6"
    }
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

    let canSaveResign = false

    let clientCountIncluded = false
    let centerBudgDet = []
    let centerBudg1Det
    let center2BudgDet

//    console.log(loanType)
    try {
        
        const centerFound = await Center.findOne({center: centerCode}) //, function(err, foundList){ 
            console.log(centerFound)

        const loanViewOrder = await Loan_type.findOne({title: _.trim(loanType)}, function(err, foundloanView) {
            if (!isNull(foundloanView)) {
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

        if (_.trim(remarks) === "New Loan") {
            newClient = numClient
            newClientAmt = totAmount
            if (loanType === "Group Loan" || loanType === "Agricultural Loan" || loanType === "Individual Loan - IMEP") {
                rNewClient = numClient
                rNewClientAmt = totAmount
                clientCountIncluded = true
            }
        }
        else {
            oldClient = numClient
            oldClientAmt = totAmount
            if (loanType === "Group Loan" || loanType === "Agricultural Loan" || loanType === "Individual Loan - IMEP") {
                rOldClient = numClient
                rOldClientAmt = totAmount
                clientCountIncluded = true
            }
        }
    // to include amount and client totals for non-GLP products ????
//    resClient = rOldClient - rNewClient
    
    // Saving to Center_budget_det Collection
        const poNumber = centerCode.substr(5,1)
        const unitCode = centerCode.substr(0,5)
        const branchCode = centerCode.substr(0,3)
        const poCode = centerCode.substr(0,6)
        let centerViewCode = ""
        if (remarks === "New Loan") {
            centerView1Code = "NewLoanClient"
            centerView2Code = "NewLoanAmt"
        } else {
            centerView1Code = "OldLoanClient"
            centerView2Code = "OldLoanAmt"
        }
 
        centerBudg1Det = await Center_budget_det.findOne({center: centerCode, loan_type: loanType, view_code: centerView1Code, target_year: budgetYear})
        
        center2BudgDet = await Center_budget_det.findOne({center: centerCode, loan_type: loanType, view_code: centerView2Code, target_year: budgetYear})
    
        centerBudgDet = await Center_budget_det.findOne({center: centerCode, loan_type: loanType, target_year: budgetYear})
       
    
        let resiClient = 0
        let resiClient1 = 0
        let resiClient2 = 0
        let withReloanMonth = ""

        let firstHalfNewLoanCount = 0
        let firstHalfNewLoanAmount = 0
        let firstHalfReLoanCount = 0
        let firstHalfReLoanAmount = 0
        let seconHalfNewLoanCount = 0
        let seconHalfNewLoanAmount = 0
        let seconHalfReLoanCount = 0
        let seconHalfReLoanAmount = 0

        let forTheMonNewCliCnt = 0
        let forTheMonNewCliAmt = 0
        let forTheMonOldCliCnt = 0
        let forTheMonOldCliAmt = 0


        let janTotCliCount = 0
        let febTotCliCount = 0
        let marTotCliCount = 0
        let aprTotCliCount = 0
        let mayTotCliCount = 0
        let junTotCliCount = 0
        let julTotCliCount = 0
        let augTotCliCount = 0
        let sepTotCliCount = 0
        let octTotCliCount = 0
        let novTotCliCount = 0
        let decTotCliCount = 0

            let janTotCliAmount = 0
            let febTotCliAmount = 0
            let marTotCliAmount = 0
            let aprTotCliAmount = 0
            let mayTotCliAmount = 0
            let junTotCliAmount = 0
            let julTotCliAmount = 0
            let augTotCliAmount = 0
            let sepTotCliAmount = 0
            let octTotCliAmount = 0
            let novTotCliAmount = 0
            let decTotCliAmount = 0

    // SAVING TO CENTER COLLECTION

        if (!isNull(centerFound)) {
            let foundList = centerFound
            const curTargets = foundList.Targets
            
            const ctrBegBals = foundList.Loan_beg_bal

            let forSortTargets = []
            let sortedTargets = []
            let ctrBegBalCli = 0

            //sort Center Targets prior to Saving
            foundList.Targets.forEach( list => {
                const targYear = list.target_year

                if (targYear === budgetYear) {
                    const _id = list._id
                    const loan_type = list.loan_type
                    const month = list.month
                    const monthOrder = list.monthOrder
                    const semester = list.semester
                    const num_Client = list.numClient
                    const amount = list.amount
                    const tarTotAmount = list.totAmount
                    const remarks = list.remarks
                    const strLoanAmount = _.toString(list.amount)
                    
                    const sortKey = _.toString(list.dispView) + list.loan_type + semester + list.remarks + _.toString(list.monthOrder) + strLoanAmount
    
                    ctrBegBals.forEach( listBeg => {
                        const begLonType = listBeg.loan_type
                        const begClient = listBeg.beg_client_count
                        const targYear = listBeg.target_year
                        const begPrincipal = listBeg.beg_principal
                        const begInterest = listBeg.beg_interest
    
                        if (begLonType === loan_type && targYear === budgetYear ) {
                            ctrBegBalCli = begClient
                        }
        
                        // begBalData.push({begLonType: begLonType, begClient: begClient, begPrincipal: begPrincipal, begInterest: begInterest })
                     })
                    
                    forSortTargets.push({_id: _id, sortKey: sortKey, loan_type: loan_type, begBal: ctrBegBalCli, month: month, monthOrder: monthOrder, 
                        semester: semester, numClient: num_Client, amount: amount, totAmount: tarTotAmount, remarks: remarks})
        
                }
            }) 

                sortedTargets = forSortTargets.sort( function (a,b) {
                    if ( a.sortKey < b.sortKey ){
                        return -1;
                    }
                    if ( a.sortKey > b.sortKey ){
                        return 1;
                    }
                    return 0;
                })
    
                let idClientLen = 0
    
                if (sortedTargets.length == 1) {
                    idClientLen = 1
                } else {
                    idClientLen = sortedTargets.length
                }

            console.log(sortedTargets) 

            // getting of Beginning Balances per Loan Type
            const curBegBal = foundList.Loan_beg_bal

            let curLoanTypeCliBegBal = 0
            let curLoanTypeAmtBegBal = 0
            let curLoanTypeIntBegBal = 0
            let curMaturityMonthBeg
            withReloanMonth = ""
            let nMonthBegBal = 0
            let hasLoanBegBal = false

            if (curBegBal.length === 0) {

            } else {
                curBegBal.forEach( curBegBals => {
                    const ctrBegLnTyp = curBegBals.loan_type
                    const ctrBegTargYear = curBegBals.target_year
                    
                    if (ctrBegLnTyp === loanType && ctrBegTargYear === budgetYear) {
                        curLoanTypeCliBegBal = curBegBals.beg_client_count
                        curMaturityMonthBeg = curBegBals.expected_maturity_date
                        curLoanTypeIntBegBal = curBegBals.beg_interest
                        curLoanTypeAmtBegBal = curBegBals.beg_amount
                        nMonthBegBal = curBegBals.month_number
                        hasLoanBegBal = true
                    }
                })
            }
            
            let newLoanCount = 0
            let oldLoanCount = 0
            let newLoanAmount = 0
            let oldLoanAmount = 0
            let hasSeconHalfReloan = false
            let hasFirstHalfNewLoan = false
            let hasFirstHalfReloan = false
            let targetKeyForUpdet = ""

            firstHalfNewLoanCount = 0
            firstHalfNewLoanAmount = 0
            firstHalfReLoanCount = 0
            firstHalfReLoanAmount = 0
            seconHalfNewLoanCount = 0
            seconHalfNewLoanAmount = 0
            seconHalfReLoanCount = 0
            seconHalfReLoanAmount = 0
            
            if (curTargets.length === 0) {
                if (remarks === "Re-loan") {
                    resiClient = curLoanTypeCliBegBal - numClient
                }
                
            } else {
                sortedTargets.forEach(target => {
                    const tarLoanType = target.loan_type
                    const targMonth = target.month
                    const nTargMonth = target.monthOrder
                    const targClientCount = target.numClient 
                    const targSemester = target.semester
                    const totLonAmount = target.totAmount
                    const targRemarks = target.remarks

                    // if (tarLoanType === loanType) {
                        if (targSemester === "First Half") {
                            if (target.remarks === "New Loan") {
                                hasFirstHalfNewLoan = true

                                newLoanAmount = newLoanAmount + totLonAmount

                                firstHalfNewLoanAmount = firstHalfNewLoanAmount + totLonAmount

                                rNewClientAmt = rNewClientAmt + target.numClient //

                                if (tarLoanType === loanType && targMonth === month && targRemarks === remarks) {
                                    forTheMonNewCliCnt = forTheMonNewCliCnt + targClientCount
                                    forTheMonNewCliAmt = forTheMonNewCliAmt + totLonAmount
                                }

                                if (tarLoanType === "Group Loan" || tarLoanType === "Agricultural Loan" || tarLoanType === "Individual Loan - IMEP")  {
                                    newLoanCount = newLoanCount + target.numClient   // New Loan Count running Totals
                                    firstHalfNewLoanCount = firstHalfNewLoanCount + target.numClient

                                    rNewClient = rNewClient + target.numClient   //
                                }
                            }
                            else { 
                                hasFirstHalfReloan = true

                                withReloanMonth = targMonth
                                oldLoanAmount = oldLoanAmount + totLonAmount
                                targetKeyForUpdet = target.id

                                firstHalfReLoanAmount = firstHalfReLoanAmount + totLonAmount

                                if (tarLoanType === "Group Loan" || tarLoanType === "Agricultural Loan" || tarLoanType === "Individual Loan - IMEP")  {
                                    oldLoanCount  = oldLoanCount + target.numClient
                                    firstHalfReLoanCount = firstHalfReLoanCount + target.numClient
                                }
                                if (tarLoanType === loanType && targMonth === month && targRemarks === remarks) {
                                    forTheMonOldCliCnt = forTheMonOldCliCnt + targClientCount
                                    forTheMonOldCliAmt = forTheMonOldCliAmt + totLonAmount
                                }

                            }
                        }
                        if (targSemester === "Second Half") {
                            if (target.remarks === "New Loan") {
                                hasSeconHalfNewLoan = true

                                newLoanAmount = newLoanAmount + totLonAmount

                                seconHalfNewLoanAmount = seconHalfNewLoanAmount + totLonAmount

                                if (tarLoanType === "Group Loan" || tarLoanType === "Agricultural Loan" || tarLoanType === "Individual Loan - IMEP")  {
                                    newLoanCount = newLoanCount + target.numClient   // New Loan Count running Totals
                                    seconHalfNewLoanCount = seconHalfNewLoanCount + target.numClient
                                }

                                if (tarLoanType === loanType && targMonth === month && targRemarks === remarks) {
                                    forTheMonNewCliCnt = forTheMonNewCliCnt + targClientCount
                                    forTheMonNewCliAmt = forTheMonNewCliAmt + totLonAmount
                                }

                            }
                            else { 
                                hasSeconHalfReloan = true

                                withReloanMonth = targMonth
                                oldLoanAmount = oldLoanAmount + totLonAmount

                                seconHalfReLoanAmount = seconHalfReLoanAmount + totLonAmount

                                if (tarLoanType === "Group Loan" || tarLoanType === "Agricultural Loan" || tarLoanType === "Individual Loan - IMEP")  {
                                    oldLoanCount  = oldLoanCount + target.numClient
                                    seconHalfReLoanCount = seconHalfReLoanCount + target.numClient
                                }

                                if (tarLoanType === loanType && targMonth === month && targRemarks === remarks) {
                                    forTheMonOldCliCnt = forTheMonOldCliCnt + targClientCount
                                    forTheMonOldCliAmt = forTheMonOldCliAmt + totLonAmount
                                }
                            }
                        
                        }
                    // }
                }) // end of forEach() loop

                if (loanType === "Group Loan" || loanType === "Agricultural Loan" || loanType === "Individual Loan - IMEP") {

                    if (semester === "First Half") {
                        if (remarks === "Re-loan") {
                            resiClient1 = curLoanTypeCliBegBal - (firstHalfReLoanCount + numClient)
                            if (hasSeconHalfReloan) {
                                resiClient2 = (firstHalfNewLoanCount + firstHalfReLoanCount + numClient) - seconHalfReLoanCount
                            } 
                        } else { // remarks === 'New Loan'
                            if (hasFirstHalfReloan) {
                                resiClient1 = curLoanTypeCliBegBal - (firstHalfReLoanCount)
                            }
                            if (hasSeconHalfReloan) {
                                resiClient2 = (firstHalfNewLoanCount + firstHalfReLoanCount + numClient) - seconHalfReLoanCount
                            }
                        }
                    }

                    if (semester === "Second Half") {
                        if (remarks === "Re-loan") {
                            resiClient2 = (firstHalfNewLoanCount + firstHalfReLoanCount) - (seconHalfReLoanCount + numClient)
                        }
                        if (hasFirstHalfReloan) {
                            resiClient1 = curLoanTypeCliBegBal - (firstHalfReLoanCount)
                        }
                    }
                }
                    
                    if (!isNull(targetKeyForUpdet)) {
                        curResTarcenter =  Center.findOneAndUpdate({"center": centerCode}, {$set: {"Targets.$[el].resignClient": 0}}, 
                                                    {arrayFilters: [{"el._id": targetKeyForUpdet }]}, function(err, foundResList){
                            if (err) {
                                console.log(err)
                            } else {
                                // console.log(foundResList)
                            }
                        })                                
                    }

            }
            
            if (resiClient < 0) {
                resiClient = 0
            }

            switch(month) {
                case "January": 
                    orderMonth = 11 
                    janLoanCliBudg = numClient
                    janLoanBudg = totAmount
                    // janTotCliCount = forTheMonNewCliCnt + numClient
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
        
            item = {
                target_year: budgetYear,
                loan_type: loanType,
                month: month,
                loan_term: loanTerm,
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
            if (loanType === "Group Loan" || loanType === "Agricultural Loan" || loanType === "Individual Loan - IMEP") {

                if (semester === "First Half") {
                    if (remarks === "Re-loan") {
                        foundList.resClient = resiClient1 //+ (curLoanTypeCliBegBal - rExPrevOldClient)
                        if (hasSeconHalfReloan) {
                            foundList.resClient2 = resiClient2 //+ (curLoanTypeCliBegBal - rExPrevOldClient)
                            // resiClient2 = (firstHalfNewLoanCount + firstHalfReLoanCount + numClient) - seconHalfReLoanCount
                        }
                    } else { // remarks === 'New Loan'
                        foundList.resClient = resiClient1 //+ (curLoanTypeCliBegBal - rExPrevOldClient)
                        if (hasSeconHalfReloan) {
                            foundList.resClient2 = resiClient2 //+ (curLoanTypeCliBegBal - rExPrevOldClient)
                            // resiClient2 = (firstHalfNewLoanCount + firstHalfReLoanCount + numClient) - seconHalfReLoanCount
                        }
                    }
                }

                if (semester === "Second Half") {
                    if (remarks === "Re-loan") {
                        foundList.resClient2 = resiClient2 //+ (curLoanTypeCliBegBal - rExPrevOldClient)
                        // resiClient2 = (firstHalfNewLoanCount + firstHalfReLoanCount) - (seconHalfReLoanCount + numClient)
                    }
                }

                if (remarks === "Re-loan") {                    
                    foundList.oldClient = (firstHalfReLoanCount + seconHalfReLoanCount) + numClient
                    foundList.oldClientAmt = (firstHalfReLoanAmount + seconHalfReLoanAmount) + totAmount
                } else {
                    foundList.newClient = (firstHalfNewLoanCount + seconHalfNewLoanCount) + numClient
                    foundList.newClientAmt = (firstHalfNewLoanAmount + seconHalfNewLoanAmount) + totAmount
                }
            } else {  // Loan Amounts from other Loan Types shall only be added into the Total Disbursement Amount
                if (remarks === "Re-loan") {
                    foundList.oldClientAmt = foundList.oldClientAmt + totAmount  // (firstHalfReLoanAmount + seconHalfReLoanAmount)
                } else {
                    foundList.newClientAmt = foundList.newClientAmt + totAmount // (firstHalfNewLoanAmount + seconHalfNewLoanAmount)
                }

            }
            // foundList.beg_center_month = month
            foundList.region = req.user.region
            // saving to center collections and its Target array field
            foundList.Targets.push(item);
            foundList.save();
         }

        // Saving New Loan & Old Loan to Center_budget_dets table
        // centerBudgDet = await Center_budget_det.findOne({center: centerCode, loan_type: loanType})


        // FOR marked as COMMENT LATER  *-------------------
            // if (remarks === "New Loan") {
            //     centerView1Code = "NewLoanClient"
            //     centerView2Code = "NewLoanAmt"
            // } else { // Re-loan
            //     centerView1Code = "OldLoanClient"
            //     centerView2Code = "OldLoanAmt"
            // }
            // centerBudg1Det = await Center_budget_det.findOne({center: centerCode, loan_type: loanType, view_code: centerView1Code})
            
            // center2BudgDet = await Center_budget_det.findOne({center: centerCode, loan_type: loanType, view_code: centerView2Code})
        // FOR marked as COMMENT LATER *--------------------


        if (isNull(centerBudg1Det)) { 
            let newCtrCliBudg = new Center_budget_det({
                region: yuser.region, area: yuser.area, branch: branchCode, unit: unitCode, po: poNumber, po_code: poCode, center: centerCode, target_year: budgetYear,
                view_type: "PUH", loan_type: loanType, client_count_included: clientCountIncluded, view_code: centerView1Code,
                beg_bal: 0, beg_bal_amt: 0, beg_bal_int: 0,
                jan_budg: janLoanCliBudg, feb_budg: febLoanCliBudg, mar_budg: marLoanCliBudg, apr_budg: aprLoanCliBudg,
                may_budg: mayLoanCliBudg, jun_budg: junLoanCliBudg, jul_budg: julLoanCliBudg, aug_budg: augLoanCliBudg,
                sep_budg: sepLoanCliBudg, oct_budg: octLoanCliBudg, nov_budg: novLoanCliBudg, dec_budg: decLoanCliBudg
            })
            const nwCtrClient = await newCtrCliBudg.save()

        } else {

            switch(month) {
                case "January": 
                    if (remarks === "New Loan") {
                        janTotCliCount = forTheMonNewCliCnt + numClient
                
                    } else {
                        janTotCliCount = forTheMonOldCliCnt + numClient                    
                    }  
                    centerBudg1Det.jan_budg = janTotCliCount
                    break;
                case "February": 
                    if (remarks === "New Loan") {
                        febTotCliCount = forTheMonNewCliCnt + numClient
                
                    } else {
                        febTotCliCount = forTheMonOldCliCnt + numClient                    
                    }  
                    centerBudg1Det.feb_budg = febTotCliCount
                    break;
                case "March": 
                    if (remarks === "New Loan") {
                        marTotCliCount = forTheMonNewCliCnt + numClient
                
                    } else {
                        marTotCliCount = forTheMonOldCliCnt + numClient                    
                    }  
                    centerBudg1Det.mar_budg = marTotCliCount
                    break;
                case "April": 
                    if (remarks === "New Loan") {
                        aprTotCliCount = forTheMonNewCliCnt + numClient
                
                    } else {
                        aprTotCliCount = forTheMonOldCliCnt + numClient                    
                    }  
                    centerBudg1Det.apr_budg = aprTotCliCount
                    break;
                case "May": 
                    if (remarks === "New Loan") {
                        mayTotCliCount = forTheMonNewCliCnt + numClient
                
                    } else {
                        mayTotCliCount = forTheMonOldCliCnt + numClient                    
                    }  
                    centerBudg1Det.may_budg = mayTotCliCount
                    break;
                case "June": 
                    if (remarks === "New Loan") {
                        junTotCliCount = forTheMonNewCliCnt + numClient
                
                    } else {
                        junTotCliCount = forTheMonOldCliCnt + numClient                    
                    }  
                    centerBudg1Det.jun_budg = junTotCliCount
                    break;
                case "July": 
                    if (remarks === "New Loan") {
                        julTotCliCount = forTheMonNewCliCnt + numClient
                
                    } else {
                        julTotCliCount = forTheMonOldCliCnt + numClient                    
                    }  
                    centerBudg1Det.jul_budg = julTotCliCount
                    break;
                case "August": 
                    if (remarks === "New Loan") {
                        augTotCliCount = forTheMonNewCliCnt + numClient
                
                    } else {
                        augTotCliCount = forTheMonOldCliCnt + numClient                    
                    }  
                    centerBudg1Det.aug_budg = augTotCliCount
                    break;
                case "September": 
                    if (remarks === "New Loan") {
                        sepTotCliCount = forTheMonNewCliCnt + numClient
                
                    } else {
                        sepTotCliCount = forTheMonOldCliCnt + numClient                    
                    }  
                    centerBudg1Det.sep_budg = sepTotCliCount
                    break;
                case "October": 
                    if (remarks === "New Loan") {
                        octTotCliCount = forTheMonNewCliCnt + numClient
                
                    } else {
                        octTotCliCount = forTheMonOldCliCnt + numClient                    
                    }  
                    centerBudg1Det.oct_budg = octTotCliCount
                    break;
                case "November": 
                    if (remarks === "New Loan") {
                        novTotCliCount = forTheMonNewCliCnt + numClient
                
                    } else {
                        novTotCliCount = forTheMonOldCliCnt + numClient                    
                    }  
                    centerBudg1Det.nov_budg = novTotCliCount
                    break;
                case "December": 
                    if (remarks === "New Loan") {
                        decTotCliCount = forTheMonNewCliCnt + numClient
                
                    } else {
                        decTotCliCount = forTheMonOldCliCnt + numClient                    
                    }  
                    centerBudg1Det.dec_budg = decTotCliCount
                    break;
                default:
                    orderMonth = 0
            }           
            centerBudg1Det.target_year = budgetYear

            await centerBudg1Det.save()
        }

        if (isNull(center2BudgDet)) { 
            // if (remarks === "Re-loan") {
                let oldCtrAmtBudg = new Center_budget_det({
                    region: yuser.region, area: yuser.area, branch: branchCode, unit: unitCode, po: poNumber, po_code: poCode, center: centerCode,
                    view_type: "PUH", loan_type: loanType, client_count_included: clientCountIncluded, view_code: centerView2Code, loan_term: loanTerm,
                    target_year: budgetYear, jan_budg: janLoanBudg, feb_budg: febLoanBudg, mar_budg: marLoanBudg, apr_budg: aprLoanBudg,
                    may_budg: mayLoanBudg, jun_budg: junLoanBudg, jul_budg: julLoanBudg, aug_budg: augLoanBudg,
                    sep_budg: sepLoanBudg, oct_budg: octLoanBudg, nov_budg: novLoanBudg, dec_budg: decLoanBudg
                })
                const olCtrClientAmt = await oldCtrAmtBudg.save()

            // }
        } else {

            switch(month) {
                case "January": 
                    if (remarks === "New Loan") {
                        janTotCliAmount = forTheMonNewCliAmt + totAmount
                
                    } else {
                        janTotCliAmount = forTheMonOldCliAmt + totAmount
                    }  
                    center2BudgDet.jan_budg = janTotCliAmount
                    // janTotCliAmount = forTheMonNewCliAmt + totAmount
                    break;
                case "February": 
                    if (remarks === "New Loan") {
                        febTotCliAmount = forTheMonNewCliAmt + totAmount
                
                    } else {
                        febTotCliAmount = forTheMonOldCliAmt + totAmount
                    }  
                    center2BudgDet.feb_budg = febTotCliAmount
                    break;
                case "March": 
                    if (remarks === "New Loan") {
                        marTotCliAmount = forTheMonNewCliAmt + totAmount
                
                    } else {
                        marTotCliAmount = forTheMonOldCliAmt + totAmount
                    }  
                    center2BudgDet.mar_budg = marTotCliAmount
                    break;
                case "April": 
                    if (remarks === "New Loan") {
                        aprTotCliAmount = forTheMonNewCliAmt + totAmount
                
                    } else {
                        aprTotCliAmount = forTheMonOldCliAmt + totAmount
                    }  
                    center2BudgDet.apr_budg = aprTotCliAmount
                    break;
                case "May": 
                    if (remarks === "New Loan") {
                        mayTotCliAmount = forTheMonNewCliAmt + totAmount
                
                    } else {
                        mayTotCliAmount = forTheMonOldCliAmt + totAmount
                    }  
                    center2BudgDet.may_budg = mayTotCliAmount
                    break;
                case "June": 
                    if (remarks === "New Loan") {
                        junTotCliAmount = forTheMonNewCliAmt + totAmount
                
                    } else {
                        junTotCliAmount = forTheMonOldCliAmt + totAmount
                    }  
                    center2BudgDet.jun_budg = junTotCliAmount
                    break;
                case "July": 
                    if (remarks === "New Loan") {
                        julTotCliAmount = forTheMonNewCliAmt + totAmount
                
                    } else {
                        julTotCliAmount = forTheMonOldCliAmt + totAmount
                    }  
                    center2BudgDet.jul_budg = julTotCliAmount
                    break;
                case "August": 
                    if (remarks === "New Loan") {
                        augTotCliAmount = forTheMonNewCliAmt + totAmount
                
                    } else {
                        augTotCliAmount = forTheMonOldCliAmt + totAmount
                    }  
                    center2BudgDet.aug_budg = augTotCliAmount
                    break;
                case "September": 
                    if (remarks === "New Loan") {
                        sepTotCliAmount = forTheMonNewCliAmt + totAmount
                
                    } else {
                        sepTotCliAmount = forTheMonOldCliAmt + totAmount
                    }  
                    center2BudgDet.sep_budg = sepTotCliAmount
                    break;
                case "October": 
                    if (remarks === "New Loan") {
                        octTotCliAmount = forTheMonNewCliAmt + totAmount
                
                    } else {
                        octTotCliAmount = forTheMonOldCliAmt + totAmount
                    }  
                    center2BudgDet.oct_budg = octTotCliAmount
                    break;
                case "November": 
                    if (remarks === "New Loan") {
                        novTotCliAmount = forTheMonNewCliAmt + totAmount
                
                    } else {
                        novTotCliAmount = forTheMonOldCliAmt + totAmount
                    }  
                    center2BudgDet.nov_budg = novTotCliAmount
                    break;
                case "December": 
                    if (remarks === "New Loan") {
                        decTotCliAmount = forTheMonNewCliAmt + totAmount
                
                    } else {
                        decTotCliAmount = forTheMonOldCliAmt + totAmount
                    }  
                    center2BudgDet.dec_budg = decTotCliAmount
                    break;
                default:
                    orderMonth = 0
            }           
            
            center2BudgDet.target_year = budgetYear
                        
            await center2BudgDet.save()
        
        }

         //  Saving / Updating Number of Resign clients in Center_budget_det
            switch(month) {
                case "January": 
                    janResCliBudg = resiClient1
                     if (withReloanMonth === "July") {
                        julResCliBudg = resiClient2
                     }
                    break;
                case "February": 
                    febResCliBudg = resiClient1
                     if (withReloanMonth === "August") {
                        augResCliBudg = resiClient2 
                    }
                    break;
                case "March": 
                    marResCliBudg = resiClient1 
                    if (withReloanMonth === "September") {
                        sepResCliBudg = resiClient2 
                    }
                    break;
                case "April": 
                    aprResCliBudg = resiClient1
                    if (withReloanMonth === "October") {
                        octResCliBudg = resiClient2 
                    }
                    break;
                case "May": 
                    mayResCliBudg = resiClient1
                    if (withReloanMonth === "November") {
                        novResCliBudg = resiClient2 
                    }
                    break;
                case "June": 
                    junResCliBudg = resiClient1 
                    if (withReloanMonth === "December") {
                        decResCliBudg = resiClient2 
                    }
                    break;
                case "July": 
                    julResCliBudg = resiClient2
                    
                    janResCliBudg = resiClient1
                    break;
                case "August": 
                    augResCliBudg = resiClient2

                    febResCliBudg = resiClient1
                    break;
                case "September": 
                    sepResCliBudg = resiClient2

                    marResCliBudg = resiClient1 
                    break;
                case "October": 
                    octResCliBudg = resiClient2

                    aprResCliBudg = resiClient1
                    break;
                case "November": 
                    novResCliBudg = resiClient2

                    mayResCliBudg = resiClient1
                    break;
                case "December": 
                    decResCliBudg = resiClient2

                    junResCliBudg = resiClient1 
                    break;
                default:
                    orderMonth = 0
            }   

            let centerResBudgDet

            if (centerView1Code === "OldLoanClient" && canSaveResign) {
                        
                let newCntrCliResBudg = new Center_budget_det({
                    region: yuser.region, area: yuser.area, branch: branchCode, unit: unitCode, po: poNumber, po_code: poCode, center: centerCode, target_year: budgetYear,
                    view_type: "PUH", loan_type: loanType, client_count_included: clientCountIncluded, view_code: "ResClientCount",
                    jan_budg: janResCliBudg, feb_budg: febResCliBudg, mar_budg: marResCliBudg, apr_budg: aprResCliBudg,
                    may_budg: mayResCliBudg, jun_budg: junResCliBudg, jul_budg: julResCliBudg, aug_budg: augResCliBudg,
                    sep_budg: sepResCliBudg, oct_budg: octResCliBudg, nov_budg: novResCliBudg, dec_budg: decResCliBudg
                })
                const ResCtrClient = await newCntrCliResBudg.save()    

                res.redirect('/centers/' + centerCode + '/edit')

            } else {

                centerResBudgDet = await Center_budget_det.findOne({center: centerCode, loan_type: loanType, view_code: "ResClientCount", target_year: budgetYear})

                if (isNull(centerResBudgDet)) { 
                    let newResCliBudg = new Center_budget_det({
                        region: yuser.region, area: yuser.area, branch: branchCode, unit: unitCode, po: poNumber, po_code: poCode, center: centerCode, target_year: budgetYear,
                        view_type: "PUH", loan_type: loanType, client_count_included: clientCountIncluded, view_code: "ResClientCount",
                        jan_budg: janResCliBudg, feb_budg: febResCliBudg, mar_budg: marResCliBudg, apr_budg: aprResCliBudg,
                        may_budg: mayResCliBudg, jun_budg: junResCliBudg, jul_budg: julResCliBudg, aug_budg: augResCliBudg,
                        sep_budg: sepResCliBudg, oct_budg: octResCliBudg, nov_budg: novResCliBudg, dec_budg: decResCliBudg
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

                        centerResBudgDet.target_year = budgetYear
            
                        await centerResBudgDet.save()
                }


                res.redirect('/centers/' + centerCode + '/edit')
            }
        } catch(err) {
        console.log(err)
        res.redirect('/centers')
    }
  
  }) // END OF SAVING NEW TARGET


  // 
  router.put("/viewMonthlyPO/:id", authUser, authRole("PO", "ADMIN"), async function(req, res){

    const viewMonPOcode = req.params.id

    try {
    const cntrBudLonType = await Loan_type.findOne({})

      const POcenterFound = await Center.find({po_code: viewMonPOcode}, function(err, foundPOCenters){ 
        if (err) {
            console.log(err)
        }
        else {
            // console.log(foundPOCenters)

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
        res.redirect('/centers')
    }
  
  })

// Post deleted items in Center.Targets and update Monthly views as well..
    
router.post('/delete/:id', authUser, authRole("PO", "ADMIN"), async (req, res) => {
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
        let fndNumClient = 0
        let totAmount = 0
        let month = ""

        let recCounter = 0
        let foundTargets = []
        let zeroFndTargets = false
        lonTypDet = ""
        lonRemarks = ""

        try {       

            recCounter =  recCounter + 1
            
            if (recCounter === 1) {

                let modiCenter = await Center.findOne({center: listName})  //, function(err, modiCenter) {
                foundTargets = modiCenter.Targets

                foundTargets.forEach(cntrTarget => {
                        const walaLang = cntrTarget.month
                    if (cntrTarget._id == checkedItemId) {
                        lonTypDet = cntrTarget.loan_type
                        lonRemarks = cntrTarget.remarks
                        month = cntrTarget.month
                        fndNumClient = cntrTarget.numClient
                        totAmount = cntrTarget.totAmount
                        fndSemester = cntrTarget.semester
    
                        if (_.trim(cntrTarget.remarks) === "New Loan") {
                            delNewClient = cntrTarget.numClient
                            delNewClientAmt = cntrTarget.totAmount
                            modiCenter.newClient = modiCenter.newClient - delNewClient
                            modiCenter.newClientAmt = modiCenter.newClientAmt - delNewClientAmt
                        } else {
                                delOldClient = cntrTarget.numClient
                            delOldClientAmt = cntrTarget.totAmount                        
                            modiCenter.oldClient = modiCenter.oldClient - delOldClient
                            modiCenter.oldClientAmt = modiCenter.oldClientAmt - delOldClientAmt

                            if (fndSemester === "Second Half") {
                                    modiCenter.resClient2 = modiCenter.resClient2 + fndNumClient // saving to resClient2 field for 2nd half/semester
                                } else {
                                    modiCenter.resClient = modiCenter.resClient + fndNumClient //+ (curLoanTypeCliBegBal - rExPrevOldClient)
                                }
                            }

                            if (foundTargets.length === 1) {
                                modiCenter.resClient = 0
                                modiCenter.resClient2 = 0 
                                modiCenter.oldClient = 0
                                modiCenter.oldClientAmt = 0
                                zeroFndTargets = true
                            }
                            if (lonTypDet === "Group Loan" || lonTypDet === "Agricultural Loan" || lonTypDet === "Individual Loan - IMEP") {
                                modiCenter.save()
                            }
            
                        }                    

                    })
//              console.log(modiCenter)
              
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
                        janLoanCliBudg = fndNumClient
                        janLoanBudg = totAmount
                        break;
                    case "February": 
                        febLoanCliBudg = fndNumClient
                        febLoanBudg = totAmount
                        break;
                    case "March": 
                        marLoanCliBudg = fndNumClient
                        marLoanBudg = totAmount
                        break;
                    case "April": 
                        aprLoanCliBudg = fndNumClient
                        aprLoanBudg = totAmount
                        break;
                    case "May": 
                        mayLoanCliBudg = fndNumClient
                        mayLoanBudg = totAmount
                        break;
                    case "June": 
                        junLoanCliBudg = fndNumClient
                        junLoanBudg = totAmount
                        break;
                    case "July": 
                        julLoanCliBudg = fndNumClient
                        julLoanBudg = totAmount
                        break;
                    case "August": 
                        augLoanCliBudg = fndNumClient
                        augLoanBudg = totAmount
                        break;
                    case "September": 
                        sepLoanCliBudg = fndNumClient
                        sepLoanBudg = totAmount
                        break;
                    case "October": 
                        octLoanCliBudg = fndNumClient
                        octLoanBudg = totAmount
                        break;
                    case "November": 
                        novLoanCliBudg = fndNumClient
                        novLoanBudg = totAmount
                        break;
                    case "December": 
                        decLoanCliBudg = fndNumClient
                        decLoanBudg = totAmount
                        break;
                    default:
                        orderMonth = 0
                }   
       
//    console.log(listName)
//    console.log(litlitekLnTyp)
//    console.log(centerView1Code)
   
           modifyCenter1Det = await Center_budget_det.findOne({center: listName, loan_type: lonTypDet, view_code: centerView1Code}) //, function(err, fndCenter1Det) {
            if (isNull(modifyCenter1Det)) {

            } else {
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
                }
   
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

            if (lonRemarks === "Re-loan") {

               const modifyCenter3Det = await Center_budget_det.findOne({center: listName, loan_type: lonTypDet, view_code: "ResClientCount"},  function(err, modResClient) {
                    if (!isNull(modResClient)) {
    
                        if (zeroFndTargets) {
                            modResClient.jan_budg = 0
                            modResClient.feb_budg = 0
                            modResClient.mar_budg = 0
                            modResClient.apr_budg = 0
                            modResClient.may_budg = 0
                            modResClient.jun_budg = 0
                            modResClient.jul_budg = 0
                            modResClient.aug_budg = 0
                            modResClient.sep_budg = 0
                            modResClient.oct_budg = 0
                            modResClient.nov_budg = 0
                            modResClient.dec_budg = 0
                            modResClient.save()
        
                        } else {
                            switch(month) {
                                case "January": 
                                    modResClient.jan_budg = modResClient.jan_budg + janLoanCliBudg
                                    break;
                                case "February": 
                                    modResClient.feb_budg = modResClient.feb_budg + febLoanCliBudg
                                    break;
                                case "March": 
                                    modResClient.mar_budg = modResClient.mar_budg + marLoanCliBudg
                                    break;
                                case "April": 
                                    modResClient.apr_budg = modResClient.apr_budg + aprLoanCliBudg
                                    break;
                                case "May": 
                                    modResClient.may_budg = modResClient.may_budg + mayLoanCliBudg
                                    break;
                                case "June": 
                                    modResClient.jun_budg = modResClient.jun_budg + junLoanCliBudg
                                    break;
                                case "July": 
                                    modResClient.jul_budg = modResClient.jul_budg + julLoanCliBudg
                                    break;
                                case "August": 
                                    modResClient.aug_budg = modResClient.aug_budg + augLoanCliBudg
                                    break;
                                case "September": 
                                    modResClient.sep_budg = modResClient.sep_budg + sepLoanCliBudg
                                    break;
                                case "October": 
                                    modResClient.oct_budg = modResClient.oct_budg + octLoanCliBudg
                                    break;
                                case "November": 
                                    modResClient.nov_budg = modResClient.nov_budg + novLoanCliBudg
                                    break;
                                case "December": 
                                    modResClient.dec_budg = modResClient.dec_budg + decLoanCliBudg
                                    break;
                                default:
                                    orderMonth = 0
                            }
                            modResClient.save()
                        }
                    }
                })
            } else {

            }

            center = await Center.findOneAndUpdate({center: listName}, {$pull: {Targets :{_id: checkedItemId }}}, function(err, foundList){

               if (!err) {

                const ip = (req.headers['x-forwarded-for'] || req.connection.remoteAddress)
                let loggedUser = new User_log({
                    IP: ip,
                    login_date: new Date(),
                    user_name: req.user.name,
                    assign_code: req.user.assCode,
                    activity: "Deleted Target for Center: " + listName +" - "+ month + ", " + fndNumClient + ", " + totAmount,
                    activity_desc: "Deleted Target Center: " + listName
                   })
                    const saveLogUser = loggedUser.save()

                   res.redirect('/centers/' + centerCode + '/edit')
   
               } else {
                   console.log(err)
               }
           })
        }

       } catch (err) {
           console.log(err)
           res.redirect('/centers')
        }   
   })
   

// View PO Targets per month ROUTE
router.get('/viewTargetsMonthly/:id', authUser, authRole("PO", "ADMIN"), async (req, res) => {

    const viewPOCode = req.params.id
    const vwUnitCode = viewPOCode.substr(0,5)
    const vwBranchCode = viewPOCode.substr(0,3)
    const yuser = req.user

    let foundPOV = []

    poSumView = []
    let poTotLoanAmtArray = []

    const poBudgExecViews = await Center_budget_det.find({po_code: viewPOCode, target_year: budgetYear})

    let nwTotValueClient = 0
    let nwTotValueAmt = 0
    let olTotValueClient = 0
    let resTotValueClient = 0
    let olTotValueAmt = 0

    let viewTitle = ""
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
        let tot_newCliTot = 0

        let jan_oldClientTot = 0  
        let feb_oldClientTot = 0
        let mar_oldClientTot = 0
        let apr_oldClientTot = 0
        let may_oldClientTot = 0
        let jun_oldClientTot = 0
        let jul_oldClientTot = 0
        let aug_oldClientTot = 0
        let sep_oldClientTot = 0
        let oct_oldClientTot = 0
        let nov_oldClientTot = 0
        let dec_oldClientTot = 0
        let tot_oldClientTot = 0

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
        let tot_resCliTot = 0

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
    let tot_newCtotValue = 0

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
    let tot_newAtotValue = 0
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
        let tot_oldAtotValue = 0
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

            let jan_cntrNewCliTot = 0  
            let feb_cntrNewCliTot = 0
            let mar_cntrNewCliTot = 0
            let apr_cntrNewCliTot = 0
            let may_cntrNewCliTot = 0
            let jun_cntrNewCliTot = 0
            let jul_cntrNewCliTot = 0
            let aug_cntrNewCliTot = 0
            let sep_cntrNewCliTot = 0
            let oct_cntrNewCliTot = 0
            let nov_cntrNewCliTot = 0
            let dec_cntrNewCliTot = 0
            let tot_cntrNewCliTot = 0

            let jan_cntrOldClientTot = 0  
            let feb_cntrOldClientTot = 0
            let mar_cntrOldClientTot = 0
            let apr_cntrOldClientTot = 0
            let may_cntrOldClientTot = 0
            let jun_cntrOldClientTot = 0
            let jul_cntrOldClientTot = 0
            let aug_cntrOldClientTot = 0
            let sep_cntrOldClientTot = 0
            let oct_cntrOldClientTot = 0
            let nov_cntrOldClientTot = 0
            let dec_cntrOldClientTot = 0
            let tot_cntrOldClientTot = 0    

            let jan_cntrNewAtotValue = 0  
            let feb_cntrNewAtotValue = 0
            let mar_cntrNewAtotValue = 0
            let apr_cntrNewAtotValue = 0
            let may_cntrNewAtotValue = 0
            let jun_cntrNewAtotValue = 0
            let jul_cntrNewAtotValue = 0
            let aug_cntrNewAtotValue = 0
            let sep_cntrNewAtotValue = 0
            let oct_cntrNewAtotValue = 0
            let nov_cntrNewAtotValue = 0
            let dec_cntrNewAtotValue = 0
            let tot_cntrNewAtotValue = 0
                let jan_cntrOldAtotValue = 0  
                let feb_cntrOldAtotValue = 0
                let mar_cntrOldAtotValue = 0
                let apr_cntrOldAtotValue = 0
                let may_cntrOldAtotValue = 0
                let jun_cntrOldAtotValue = 0
                let jul_cntrOldAtotValue = 0
                let aug_cntrOldAtotValue = 0
                let sep_cntrOldAtotValue = 0
                let oct_cntrOldAtotValue = 0
                let nov_cntrOldAtotValue = 0
                let dec_cntrOldAtotValue = 0
                let tot_cntrOldAtotValue = 0        

        let doneReadNLC = false
        let doneReadOLC = false
        let doneReadNLA = false
        let doneReadOLA = false

        let doneReadNLCli = false
        let doneReadOLCli = false
        let doneReadResCli = false

        let doneReadClientCount = false
        let doneReadLoanCount = false
        let doneReadLoanAmt = false
        let doneReadNumCenters = false
        
        let fndPONumCenters = []
        let fondNewClients = []
        let fondOldClients = []
        let fondResClients = []
        let fondNewLoanCli = []
        let fondReLoanCli = []
        let fondNewLoanAmt = []
        let fondReLoanAmt = []
        let fondMonthlyDisburse = []
        let fondBalFromPrevMo = []

        let begBalOldClient = 0
        let jan_oldCtotValue = 0   
        let feb_oldCtotValue = 0
        let mar_oldCtotValue = 0
        let apr_oldCtotValue = 0
        let may_oldCtotValue = 0
        let jun_oldCtotValue = 0
        let jul_oldCtotValue = 0
        let aug_oldCtotValue = 0
        let sep_oldCtotValue = 0
        let oct_oldCtotValue = 0
        let nov_oldCtotValue = 0
        let dec_oldCtotValue = 0
        let tot_oldCtotValue = 0

        const oldLoanClientView = await Center_budget_det.find({po_code: viewPOCode, view_code: "OldLoanClient", target_year: budgetYear})
        const oldLoanAmtView = await Center_budget_det.find({po_code: viewPOCode, view_code: "OldLoanAmt", target_year: budgetYear})
        const newLoanAmtView = await Center_budget_det.find({po_code: viewPOCode, view_code: "NewLoanAmt", target_year: budgetYear})

    try {

        const cntrTargLonTyp = loanTypes
        console.log(cntrTargLonTyp)
        // const vwloanType = await Loan_type.find({})

        // const foundCenterDet = await Center_budget_det.find({po_code: viewPOCode})

        // Gets NumberOfCenters from Budg_exec_sum
        
        // const newLoanAmtView = await Center_budget_det.find({po_code: viewPOCode, view_code: "NewLoanAmt", client_count_included:true})

        const foundCenters = await Center.find({po_code: viewPOCode}, function(err, fdCenters) {
            const fawndCenter = fdCenters
        }) 

        if (!isNull(foundCenters)) {
            const fndCenters = foundCenters
                console.log(fndCenters)
            fndCenters.forEach( fCenters => {
                let monthNewCenter = ""
                let fndTarget = []
                let canAddBegCenter = false
                let monthNewTarget = ""
                let monthTarget = ""
                const centerBegBalCli = fCenters.budget_BegBalCli
                const fCenter = fCenters.center
                const monthCenterBegBal = _.trim(fCenters.beg_center_month)
                    // console.log(monthCenterBegBal)
                const begBalData = fCenters.Loan_beg_bal

                if (centerBegBalCli) {
                    // begBalOldClient = begBalOldClient + centerBegBalCli
                } 

                fndTarget = fCenters.Targets
                    let i = 0
                    let targTotAmt = 0

                    cntrTargLonTyp.forEach(loan_type => {
                        const typeLoan = loan_type.title
                        const loanCode = loan_type.loan_type
                    
                        jan_cntrNewCliTot = 0  
                        feb_cntrNewCliTot = 0
                        mar_cntrNewCliTot = 0
                        apr_cntrNewCliTot = 0
                        may_cntrNewCliTot = 0
                        jun_cntrNewCliTot = 0
                        jul_cntrNewCliTot = 0
                        aug_cntrNewCliTot = 0
                        sep_cntrNewCliTot = 0
                        oct_cntrNewCliTot = 0
                        nov_cntrNewCliTot = 0
                        dec_cntrNewCliTot = 0
                        tot_cntrNewCliTot = 0
            
                        jan_cntrOldClientTot = 0  
                        feb_cntrOldClientTot = 0
                        mar_cntrOldClientTot = 0
                        apr_cntrOldClientTot = 0
                        may_cntrOldClientTot = 0
                        jun_cntrOldClientTot = 0
                        jul_cntrOldClientTot = 0
                        aug_cntrOldClientTot = 0
                        sep_cntrOldClientTot = 0
                        oct_cntrOldClientTot = 0
                        nov_cntrOldClientTot = 0
                        dec_cntrOldClientTot = 0
                        tot_cntrOldClientTot = 0    
            
                        jan_cntrNewAtotValue = 0  
                        feb_cntrNewAtotValue = 0
                        mar_cntrNewAtotValue = 0
                        apr_cntrNewAtotValue = 0
                        may_cntrNewAtotValue = 0
                        jun_cntrNewAtotValue = 0
                        jul_cntrNewAtotValue = 0
                        aug_cntrNewAtotValue = 0
                        sep_cntrNewAtotValue = 0
                        oct_cntrNewAtotValue = 0
                        nov_cntrNewAtotValue = 0
                        dec_cntrNewAtotValue = 0
                        tot_cntrNewAtotValue = 0
                            jan_cntrOldAtotValue = 0  
                            feb_cntrOldAtotValue = 0
                            mar_cntrOldAtotValue = 0
                            apr_cntrOldAtotValue = 0
                            may_cntrOldAtotValue = 0
                            jun_cntrOldAtotValue = 0
                            jul_cntrOldAtotValue = 0
                            aug_cntrOldAtotValue = 0
                            sep_cntrOldAtotValue = 0
                            oct_cntrOldAtotValue = 0
                            nov_cntrOldAtotValue = 0
                            dec_cntrOldAtotValue = 0
                            tot_cntrOldAtotValue = 0        
                    
                        fndTarget.forEach( findTarg => {
                            monthTarget = findTarg.month
                            targTotAmt = findTarg.totAmount
                            targNumClient = findTarg.numClient
                            targLonType = findTarg.loan_type
                            const targYr = findTarg.target_year

                            if (targYr === budgetYear) {
                                if (targLonType === "Group Loan" || targLonType === "Agricultural Loan" || targLonType === "Individual Loan - IMEP") {
                                    if (findTarg.remarks === "New Loan" && i == 0) {
                                        i = i + 1
                                        monthNewCenter = monthTarget
                                    }    
                                }
                                if (targLonType === typeLoan) {
                                    if (findTarg.remarks === "New Loan") {
        
                                        switch(monthTarget) {
                                            case "January":
                                                jan_cntrNewAtotValue = jan_cntrNewAtotValue + targTotAmt
                                                jan_cntrNewCliTot = jan_cntrNewCliTot + targNumClient
            
                                                // jan_newAtotValue = jan_newAtotValue + targTotAmt
                                                // jan_newCliTot = jan_newCliTot + targNumClient
                                                break;
                                            case "February":
                                                feb_cntrNewAtotValue = feb_cntrNewAtotValue + targTotAmt
                                                feb_cntrNewCliTot = feb_cntrNewCliTot + targNumClient
            
                                                // feb_newAtotValue = feb_newAtotValue + targTotAmt
                                                // feb_newCliTot = feb_newCliTot + targNumClient
                                                // break;
                                            case "March":
                                                mar_cntrNewAtotValue = mar_cntrNewAtotValue + targTotAmt
                                                mar_cntrNewCliTot = mar_cntrNewCliTot + targNumClient
            
                                                // mar_newAtotValue = mar_newAtotValue + targTotAmt
                                                // mar_newCliTot = mar_newCliTot + targNumClient
                                                // break;
                                            case "April":
                                                apr_cntrNewAtotValue = apr_cntrNewAtotValue + targTotAmt
                                                apr_cntrNewCliTot = apr_cntrNewCliTot + targNumClient
            
                                                // apr_newAtotValue = apr_newAtotValue + targTotAmt
                                                // apr_newCliTot = apr_newCliTot + targNumClient
                                                break;
                                            case "May":
                                                may_cntrNewAtotValue = may_cntrNewAtotValue + targTotAmt
                                                may_cntrNewCliTot = may_cntrNewCliTot + targNumClient
            
                                                // may_newAtotValue = may_newAtotValue + targTotAmt
                                                // may_newCliTot = may_newCliTot + targNumClient
                                                break;
                                            case "June":
                                                jun_cntrNewAtotValue = jun_cntrNewAtotValue + targTotAmt
                                                jun_cntrNewCliTot = jun_cntrNewCliTot + targNumClient
            
                                                // jun_newAtotValue = jun_newAtotValue + targTotAmt
                                                // jun_newCliTot = jun_newCliTot + targNumClient
                                                break;
                                            case "July":
                                                jul_cntrNewAtotValue = jul_cntrNewAtotValue + targTotAmt
                                                jul_cntrNewCliTot = jul_cntrNewCliTot + targNumClient
            
                                                // jul_newAtotValue = jul_newAtotValue + targTotAmt
                                                // jul_newCliTot = jul_newCliTot + targNumClient
                                                break;
                                            case "August":
                                                aug_cntrNewAtotValue = aug_cntrNewAtotValue + targTotAmt
                                                aug_cntrNewCliTot = aug_cntrNewCliTot + targNumClient
            
                                                // aug_newAtotValue = aug_newAtotValue + targTotAmt
                                                // aug_newCliTot = aug_newCliTot + targNumClient
                                                break;
                                            case "September":
                                                sep_cntrNewAtotValue = sep_cntrNewAtotValue + targTotAmt
                                                sep_cntrNewCliTot = sep_cntrNewCliTot + targNumClient
            
                                                // sep_newAtotValue = sep_newAtotValue + targTotAmt
                                                // sep_newCliTot = sep_newCliTot + targNumClient
                                                break;
                                            case "October":
                                                oct_cntrNewAtotValue = oct_cntrNewAtotValue + targTotAmt
                                                oct_cntrNewCliTot = oct_cntrNewCliTot + targNumClient
            
                                                // oct_newAtotValue = oct_newAtotValue + targTotAmt
                                                // oct_newCliTot = oct_newCliTot + targNumClient
                                                break;
                                            case "November":
                                                nov_cntrNewAtotValue = nov_cntrNewAtotValue + targTotAmt
                                                nov_cntrNewCliTot = nov_cntrNewCliTot + targNumClient
            
                                                // nov_newAtotValue = nov_newAtotValue + targTotAmt
                                                // nov_newCliTot = nov_newCliTot + targNumClient
                                                break;
                                            case "December":
                                                dec_cntrNewAtotValue = dec_cntrNewAtotValue + targTotAmt
                                                dec_cntrNewCliTot = dec_cntrNewCliTot + targNumClient
            
                                                // dec_newAtotValue = dec_newAtotValue + targTotAmt
                                                // dec_newCliTot = dec_newCliTot + targNumClient
                                                break;
                                            default:
                                                let jan_ctrCount = 0
                                        }
                                    }
                                    if (findTarg.remarks === "Re-loan") {
            
                                        switch(monthTarget) {
                                            case "January":
                                                jan_cntrOldAtotValue = jan_cntrOldAtotValue + targTotAmt
                                                jan_cntrOldClientTot = jan_cntrOldClientTot + targNumClient
            
                                                // jan_oldAtotValue = jan_oldAtotValue + targTotAmt
                                                // jan_oldClientTot = jan_oldClientTot + targNumClient
                                                break;
                                            case "February":
                                                feb_cntrOldAtotValue = feb_cntrOldAtotValue + targTotAmt
                                                feb_cntrOldClientTot = feb_cntrOldClientTot + targNumClient
            
                                                // feb_oldAtotValue = feb_oldAtotValue + targTotAmt
                                                // feb_oldClientTot = feb_oldClientTot + targNumClient
                                                break;
                                            case "March":
                                                mar_cntrOldAtotValue = mar_cntrOldAtotValue + targTotAmt
                                                mar_cntrOldClientTot = mar_cntrOldClientTot + targNumClient
            
                                                // mar_oldAtotValue = mar_oldAtotValue + targTotAmt
                                                // mar_oldClientTot = mar_oldClientTot + targNumClient
                                                break;
                                            case "April":
                                                apr_cntrOldAtotValue = apr_cntrOldAtotValue + targTotAmt
                                                apr_cntrOldClientTot = apr_cntrOldClientTot + targNumClient
            
                                                // apr_oldAtotValue = apr_oldAtotValue + targTotAmt
                                                // apr_oldClientTot = apr_oldClientTot + targNumClient
                                                break;
                                            case "May":
                                                may_cntrOldAtotValue = may_cntrOldAtotValue + targTotAmt
                                                may_cntrOldClientTot = may_cntrOldClientTot + targNumClient
            
                                                // may_oldAtotValue = may_oldAtotValue + targTotAmt
                                                // may_oldClientTot = may_oldClientTot + targNumClient
                                                break;
                                            case "June":
                                                jun_cntrOldAtotValue = jun_cntrOldAtotValue + targTotAmt
                                                jun_cntrOldClientTot = jun_cntrOldClientTot + targNumClient
            
                                                // jun_oldAtotValue = jun_oldAtotValue + targTotAmt
                                                // jun_oldClientTot = jun_oldClientTot + targNumClient
                                                break;
                                            case "July":
                                                jul_cntrOldAtotValue = jul_cntrOldAtotValue + targTotAmt
                                                jul_cntrOldClientTot = jul_cntrOldClientTot + targNumClient
            
                                                // jul_oldAtotValue = jul_oldAtotValue + targTotAmt
                                                // jul_oldClientTot = jul_oldClientTot + targNumClient
                                                break;
                                            case "August":
                                                aug_cntrOldAtotValue = aug_cntrOldAtotValue + targTotAmt
                                                aug_cntrOldClientTot = aug_cntrOldClientTot + targNumClient
            
                                                // aug_oldAtotValue = aug_oldAtotValue + targTotAmt
                                                // aug_oldClientTot = aug_oldClientTot + targNumClient
                                                break;
                                            case "September":
                                                sep_cntrOldAtotValue = sep_cntrOldAtotValue + targTotAmt
                                                sep_cntrOldClientTot = sep_cntrOldClientTot + targNumClient
            
                                                // sep_oldAtotValue = sep_oldAtotValue + targTotAmt
                                                // sep_oldClientTot = sep_oldClientTot + targNumClient
                                                break;
                                            case "October":
                                                oct_cntrOldAtotValue = oct_cntrOldAtotValue + targTotAmt
                                                oct_cntrOldClientTot = oct_cntrOldClientTot + targNumClient
            
                                                // oct_oldAtotValue = oct_oldAtotValue + targTotAmt
                                                // oct_oldClientTot = oct_oldClientTot + targNumClient
                                                break;
                                            case "November":
                                                nov_cntrOldAtotValue = nov_cntrOldAtotValue + targTotAmt
                                                nov_cntrOldClientTot = nov_cntrOldClientTot + targNumClient
            
                                                // nov_oldAtotValue = nov_oldAtotValue + targTotAmt
                                                // nov_oldClientTot = nov_oldClientTot + targNumClient
                                                break;
                                            case "December":
                                                dec_cntrOldAtotValue = dec_cntrOldAtotValue + targTotAmt
                                                dec_cntrOldClientTot = dec_cntrOldClientTot + targNumClient
            
                                                // dec_oldAtotValue = dec_oldAtotValue + targTotAmt
                                                // dec_oldClientTot = dec_oldClientTot + targNumClient
                                                break;
                                            default:
                                                let jan_ctrCount = 0
                                        }
                                    }
        
                                }
    
                            }
                            
                        })
                        
                    })
                        
                    begBalData.forEach( cntrBegBal => {
                        if (cntrBegBal.target_year === budgetYear) {
                            if (cntrBegBal.loan_type === "Group Loan" || cntrBegBal.loan_type === "Agricultural Loan" || cntrBegBal.loan_type === "Individual Loan - IMEP") {
                                if (cntrBegBal.beg_client_count > 0) {
                                    // centerCntBegBal = centerCntBegBal + 1 
                                    canAddBegCenter = true
                                } else {
                                    
                                }
                            }
    
                        }
                    })

                    // if (monthCenterBegBal === "" && begBalData.length === 0 && monthNewCenter !=="" ) {

                    if (!canAddBegCenter) {

                        switch(monthNewCenter) {
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
                                let jan_ctrCount = 0
                        }
                    
                    } else {
                        if (begBalData.length > 0) {
                            if (canAddBegCenter) {
                                centerCntBegBal = centerCntBegBal + 1                        
                            } else {
                                
                            }
                        }
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

            doneReadNumCenters = true

        }

        const fondPONumCenters = await Budg_exec_sum.findOne({po: viewPOCode, view_code: "NumberOfCenters", target_year: budgetYear}, function (err, fndTotLonAmt) {
            fndPONumCenters = fndTotLonAmt
        })

            if (isNull(fondPONumCenters)) { 
                let newPONumCenters = new Budg_exec_sum({
                    region: yuser.region, area: yuser.area, branch: vwBranchCode, unit: vwUnitCode, po: viewPOCode, target_year: budgetYear,
                    title: "Number of Centers", view_code: "NumberOfCenters", sort_key: 2, display_group: 1, beg_bal: centerCntBegBal, jan_budg : jan_centerCount, 
                    feb_budg : feb_centerCount, mar_budg : mar_centerCount, apr_budg : apr_centerCount, may_budg : may_centerCount, jun_budg : jun_centerCount, jul_budg : jul_centerCount, 
                    aug_budg : aug_centerCount, sep_budg : sep_centerCount, oct_budg : oct_centerCount, nov_budg : nov_centerCount, dec_budg : dec_centerCount                                        
                })
                newPONumCenters.save()

            } else {
                fondPONumCenters.title = "Number of Centers"
                fondPONumCenters.beg_bal = centerCntBegBal
                fondPONumCenters.jan_budg = jan_centerCount
                fondPONumCenters.feb_budg = feb_centerCount
                fondPONumCenters.mar_budg = mar_centerCount
                fondPONumCenters.apr_budg = apr_centerCount
                fondPONumCenters.may_budg = may_centerCount
                fondPONumCenters.jun_budg = jun_centerCount
                fondPONumCenters.jul_budg = jul_centerCount
                fondPONumCenters.aug_budg = aug_centerCount
                fondPONumCenters.sep_budg = sep_centerCount
                fondPONumCenters.oct_budg = oct_centerCount
                fondPONumCenters.nov_budg = nov_centerCount
                fondPONumCenters.dec_budg = dec_centerCount
                fondPONumCenters.target_year =  budgetYear

                fondPONumCenters.save()            
            }

        poSumView.push({title: "CENTERS", sortkey: 1, group: 1, isTitle: true})

        poSumView.push({title: "CLIENTS", sortkey: 3, group: 2, isTitle: true})

        // **********------------

        if (!isNull(poBudgExecViews)) {   // Scan Center_budget_dets views for a particular PO

            poBudgExecViews.forEach( TotNumCenter => { 
                const areaVwCode = TotNumCenter.view_code

                switch(areaVwCode) {
                    case "NewLoanClient":

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

                        jan_newCtotValue = jan_newCtotValue + TotNumCenter.jan_budg
                        feb_newCtotValue = feb_newCtotValue + TotNumCenter.feb_budg
                        mar_newCtotValue = mar_newCtotValue + TotNumCenter.mar_budg
                        apr_newCtotValue = apr_newCtotValue + TotNumCenter.apr_budg
                        may_newCtotValue = may_newCtotValue + TotNumCenter.may_budg
                        jun_newCtotValue = jun_newCtotValue + TotNumCenter.jun_budg
                        jul_newCtotValue = jul_newCtotValue + TotNumCenter.jul_budg
                        aug_newCtotValue = aug_newCtotValue + TotNumCenter.aug_budg
                        sep_newCtotValue = sep_newCtotValue + TotNumCenter.sep_budg
                        oct_newCtotValue = oct_newCtotValue + TotNumCenter.oct_budg
                        nov_newCtotValue = nov_newCtotValue + TotNumCenter.nov_budg
                        dec_newCtotValue = dec_newCtotValue + TotNumCenter.dec_budg
                        break;

                    case "OldLoanClient":

                        begBalOldClient = begBalOldClient + TotNumCenter.beg_bal
                        jan_oldClientTot = jan_oldClientTot + TotNumCenter.jan_budg
                        feb_oldClientTot = feb_oldClientTot + TotNumCenter.feb_budg
                        mar_oldClientTot = mar_oldClientTot + TotNumCenter.mar_budg
                        apr_oldClientTot = apr_oldClientTot + TotNumCenter.apr_budg
                        may_oldClientTot = may_oldClientTot + TotNumCenter.may_budg
                        jun_oldClientTot = jun_oldClientTot + TotNumCenter.jun_budg
                        jul_oldClientTot = jul_oldClientTot + TotNumCenter.jul_budg
                        aug_oldClientTot = aug_oldClientTot + TotNumCenter.aug_budg
                        sep_oldClientTot = sep_oldClientTot + TotNumCenter.sep_budg
                        oct_oldClientTot = oct_oldClientTot + TotNumCenter.oct_budg
                        nov_oldClientTot = nov_oldClientTot + TotNumCenter.nov_budg
                        dec_oldClientTot = dec_oldClientTot + TotNumCenter.dec_budg

                        jan_oldCtotValue = jan_oldCtotValue + TotNumCenter.jan_budg
                        feb_oldCtotValue = feb_oldCtotValue + TotNumCenter.feb_budg
                        mar_oldCtotValue = mar_oldCtotValue + TotNumCenter.mar_budg
                        apr_oldCtotValue = apr_oldCtotValue + TotNumCenter.apr_budg
                        may_oldCtotValue = may_oldCtotValue + TotNumCenter.may_budg
                        jun_oldCtotValue = jun_oldCtotValue + TotNumCenter.jun_budg
                        jul_oldCtotValue = jul_oldCtotValue + TotNumCenter.jul_budg
                        aug_oldCtotValue = aug_oldCtotValue + TotNumCenter.aug_budg
                        sep_oldCtotValue = sep_oldCtotValue + TotNumCenter.sep_budg
                        oct_oldCtotValue = oct_oldCtotValue + TotNumCenter.oct_budg
                        nov_oldCtotValue = nov_oldCtotValue + TotNumCenter.nov_budg
                        dec_oldCtotValue = dec_oldCtotValue + TotNumCenter.dec_budg
                        
                        break;

                    case "ResClientCount":

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

                    case "NewLoanAmt":

                        jan_newAtotValue = jan_newAtotValue + TotNumCenter.jan_budg
                        feb_newAtotValue = feb_newAtotValue + TotNumCenter.feb_budg
                        mar_newAtotValue = mar_newAtotValue + TotNumCenter.mar_budg
                        apr_newAtotValue = apr_newAtotValue + TotNumCenter.apr_budg
                        may_newAtotValue = may_newAtotValue + TotNumCenter.may_budg
                        jun_newAtotValue = jun_newAtotValue + TotNumCenter.jun_budg
                        jul_newAtotValue = jul_newAtotValue + TotNumCenter.jul_budg
                        aug_newAtotValue = aug_newAtotValue + TotNumCenter.aug_budg
                        sep_newAtotValue = sep_newAtotValue + TotNumCenter.sep_budg
                        oct_newAtotValue = oct_newAtotValue + TotNumCenter.oct_budg
                        nov_newAtotValue = nov_newAtotValue + TotNumCenter.nov_budg
                        dec_newAtotValue = dec_newAtotValue + TotNumCenter.dec_budg
                        break;

                    case "OldLoanAmt":

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

            nwTotValueClient = jan_newCliTot + feb_newCliTot + mar_newCliTot + apr_newCliTot + may_newCliTot + jun_newCliTot
                + jul_newCliTot + aug_newCliTot + sep_newCliTot + oct_newCliTot + nov_newCliTot + dec_newCliTot
        
            poSumView.push({title: "New Clients", sortkey: 4, group: 2, beg_bal: 0, isTitle: false, jan_value : jan_newCliTot, feb_value : feb_newCliTot, mar_value : mar_newCliTot, apr_value : apr_newCliTot,
                may_value : may_newCliTot, jun_value : jun_newCliTot, jul_value : jul_newCliTot, aug_value : aug_newCliTot,
                sep_value : sep_newCliTot, oct_value : oct_newCliTot, nov_value : nov_newCliTot, dec_value : dec_newCliTot, tot_value: nwTotValueClient
            }) 
            doneReadNLCli = true   //******--------

            olTotValueClient = jan_oldClientTot + feb_oldClientTot + mar_oldClientTot + apr_oldClientTot + may_oldClientTot + jun_oldClientTot
                        + jul_oldClientTot + aug_oldClientTot + sep_oldClientTot + oct_oldClientTot + nov_oldClientTot + dec_oldClientTot
            
            doneReadOLCli = true   //******--------

            resTotValueClient = jan_resCliTot + feb_resCliTot + mar_resCliTot + apr_resCliTot + may_resCliTot + jun_resCliTot
            + jul_resCliTot + aug_resCliTot + sep_resCliTot + oct_resCliTot + nov_resCliTot + dec_resCliTot

            doneReadResCli = true   //******--------

            tot_oldCtotValue = jan_oldCtotValue + feb_oldCtotValue + mar_oldCtotValue + apr_oldCtotValue + may_oldCtotValue + jun_oldCtotValue
                    + jul_oldCtotValue + aug_oldCtotValue + sep_oldCtotValue + oct_oldCtotValue + nov_oldCtotValue + dec_oldCtotValue
            
            poSumView.push({title: "Number of Reloan", sortkey: 9, group: 1, isTitle: false, beg_bal: 0, jan_value : jan_oldCtotValue, feb_value : feb_oldCtotValue, mar_value : mar_oldCtotValue, apr_value : apr_oldCtotValue,
                may_value : may_oldCtotValue, jun_value : jun_oldCtotValue, jul_value : jul_oldCtotValue, aug_value : aug_oldCtotValue,
                sep_value : sep_oldCtotValue, oct_value : oct_oldCtotValue, nov_value : nov_oldCtotValue, dec_value : dec_oldCtotValue, tot_value: tot_oldCtotValue
            }) 
            doneReadOLC = true   //******--------

            tot_newCtotValue = jan_newCtotValue + feb_newCtotValue + mar_newCtotValue + apr_newCtotValue + may_newCtotValue + jun_newCtotValue
                + jul_newCtotValue + aug_newCtotValue + sep_newCtotValue + oct_newCtotValue + nov_newCtotValue + dec_newCtotValue
            
            poSumView.push({title: "Number of New Loan", sortkey: 8, group: 1, isTitle: false, beg_bal: 0, jan_value : jan_newCtotValue, feb_value : feb_newCtotValue, mar_value : mar_newCtotValue, apr_value : apr_newCtotValue,
                may_value : may_newCtotValue, jun_value : jun_newCtotValue, jul_value : jul_newCtotValue, aug_value : aug_newCtotValue,
                sep_value : sep_newCtotValue, oct_value : oct_newCtotValue, nov_value : nov_newCtotValue, dec_value : dec_newCtotValue, tot_value: tot_newCtotValue
            }) 
            doneReadNLC = true   //******--------

            tot_newAtotValue = jan_newAtotValue + feb_newAtotValue + mar_newAtotValue + apr_newAtotValue + may_newAtotValue + jun_newAtotValue
                    + jul_newAtotValue + aug_newAtotValue + sep_newAtotValue + oct_newAtotValue + nov_newAtotValue + dec_newAtotValue

            poSumView.push({title: "Amount of New Loan", sortkey: 12, group: 2, isTitle: false, jan_value : jan_newAtotValue, feb_value : feb_newAtotValue, mar_value : mar_newAtotValue, apr_value : apr_newAtotValue,
                may_value : may_newAtotValue, jun_value : jun_newAtotValue, jul_value : jul_newAtotValue, aug_value : aug_newAtotValue,
                sep_value : sep_newAtotValue, oct_value : oct_newAtotValue, nov_value : nov_newAtotValue, dec_value : dec_newAtotValue, tot_value: tot_newAtotValue
            }) 
            doneReadNLA = true   //******--------

            tot_oldAtotValue = jan_oldAtotValue + feb_oldAtotValue + mar_oldAtotValue + apr_oldAtotValue + may_oldAtotValue + jun_oldAtotValue
            + jul_oldAtotValue + aug_oldAtotValue + sep_oldAtotValue + oct_oldAtotValue + nov_oldAtotValue + dec_oldAtotValue

            poSumView.push({title: "Amount of Reloan", sortkey: 13, group: 2, isTitle: false, jan_value : jan_oldAtotValue, feb_value : feb_oldAtotValue, mar_value : mar_oldAtotValue, apr_value : apr_oldAtotValue,
                may_value : may_oldAtotValue, jun_value : jun_oldAtotValue, jul_value : jul_oldAtotValue, aug_value : aug_oldAtotValue,
                sep_value : sep_oldAtotValue, oct_value : oct_oldAtotValue, nov_value : nov_oldAtotValue, dec_value : dec_oldAtotValue, tot_value: tot_oldAtotValue
            }) 
            doneReadOLA = true//******--------

            
        }
        // **********------------ END of Scan Center_budget_dets views for a particular PO

        if (doneReadNumCenters) {
            
            console.log("Total New Clients " + jan_oldClientTot)
        }
        // END of NEW codes for getting Items in Center_budget_dets 06.28.2022

            if (doneReadNLCli) {
                const fndNewClients = await Budg_exec_sum.findOne({po: viewPOCode, view_code: "NewClients", target_year: budgetYear}, function (err, fndTotLonAmt) {
                    fondNewClients = fndTotLonAmt
        
                    if (isNull(fondNewClients)) { 
                        let newNewClients = new Budg_exec_sum({
                            region: yuser.region, area: yuser.area, branch: vwBranchCode, unit: vwUnitCode, po: viewPOCode, target_year: budgetYear,
                            title: "New Clients", view_code: "NewClients", sort_key: 4, display_group: 2, beg_bal: 0, jan_budg : jan_newCliTot, 
                            feb_budg : feb_newCliTot, mar_budg : mar_newCliTot, apr_budg : apr_newCliTot, may_budg : may_newCliTot, jun_budg : jun_newCliTot, jul_budg : jul_newCliTot, 
                            aug_budg : aug_newCliTot, sep_budg : sep_newCliTot, oct_budg : oct_newCliTot, nov_budg : nov_newCliTot, dec_budg : dec_newCliTot, tot_budg: tot_newCliTot
                        })
                        newNewClients.save()
                    } else {
                        fondNewClients.title = "New Clients"
                        fondNewClients.jan_budg = jan_newCliTot
                        fondNewClients.feb_budg = feb_newCliTot
                        fondNewClients.mar_budg = mar_newCliTot
                        fondNewClients.apr_budg = apr_newCliTot
                        fondNewClients.may_budg = may_newCliTot
                        fondNewClients.jun_budg = jun_newCliTot
                        fondNewClients.jul_budg = jul_newCliTot
                        fondNewClients.aug_budg = aug_newCliTot
                        fondNewClients.sep_budg = sep_newCliTot
                        fondNewClients.oct_budg = oct_newCliTot
                        fondNewClients.nov_budg = nov_newCliTot
                        fondNewClients.dec_budg = dec_newCliTot
                        fondNewClients.tot_budg = tot_newCliTot
            
                        fondNewClients.target_year = budgetYear
                        fondNewClients.save()            
                    }
                })

            }
                    
        if (doneReadNLCli && doneReadOLCli && doneReadResCli) {

            console.log("Total New Loan Client is: " + jan_newCliTot)
            console.log("Total Old Loan Client is: " + jan_oldClientTot)
            console.log("Total Resign is: " + jan_resCliTot)

            jan_oldClientTot = begBalOldClient 
                let jan_totNumClients = (jan_oldClientTot + jan_newCliTot) - jan_resCliTot
            feb_oldClientTot = jan_totNumClients
                let feb_totNumClients = (feb_oldClientTot + feb_newCliTot) - feb_resCliTot    
            mar_oldClientTot = feb_totNumClients
                let mar_totNumClients = (mar_oldClientTot + mar_newCliTot) - mar_resCliTot
            apr_oldClientTot = mar_totNumClients
                let apr_totNumClients = (apr_oldClientTot + apr_newCliTot) - apr_resCliTot
            may_oldClientTot = apr_totNumClients
                let may_totNumClients = (may_oldClientTot + may_newCliTot) - may_resCliTot
            jun_oldClientTot = may_totNumClients
                let jun_totNumClients = (jun_oldClientTot + jun_newCliTot) - jun_resCliTot
            jul_oldClientTot = jun_totNumClients
                let jul_totNumClients = (jul_oldClientTot + jul_newCliTot) - jul_resCliTot
            aug_oldClientTot = jul_totNumClients
                let aug_totNumClients = (aug_oldClientTot + aug_newCliTot) - aug_resCliTot
            sep_oldClientTot = aug_totNumClients
                let sep_totNumClients = (sep_oldClientTot + sep_newCliTot) - sep_resCliTot
            oct_oldClientTot = sep_totNumClients
                let oct_totNumClients = (oct_oldClientTot + oct_newCliTot) - oct_resCliTot
            nov_oldClientTot = oct_totNumClients
                let nov_totNumClients = (nov_oldClientTot + nov_newCliTot) - nov_resCliTot
            dec_oldClientTot = nov_totNumClients
                let dec_totNumClients = (dec_oldClientTot + dec_newCliTot) - dec_resCliTot
            tot_oldClientTot = dec_totNumClients
                let tot_totNumClients = (dec_oldClientTot + dec_newCliTot) - dec_resCliTot
            
            poSumView.push({title: "Resign Clients", sortkey: 6, group: 2, isTitle: false, jan_value : jan_resCliTot, feb_value : feb_resCliTot, mar_value : mar_resCliTot, apr_value : apr_resCliTot,
                may_value : may_resCliTot, jun_value : jun_resCliTot, jul_value : jul_resCliTot, aug_value : aug_resCliTot,
                sep_value : sep_resCliTot, oct_value : oct_resCliTot, nov_value : nov_resCliTot, dec_value : dec_resCliTot, tot_value: resTotValueClient
            }) 
            
            poSumView.push({title: "TOTAL NO. OF CLIENTS", sortkey: 7, group: 2, isTitle: false, jan_value : jan_totNumClients, feb_value : feb_totNumClients, mar_value : mar_totNumClients, 
                apr_value : apr_totNumClients, may_value : may_totNumClients, jun_value : jun_totNumClients, jul_value : jul_totNumClients, aug_value : aug_totNumClients,
                sep_value : sep_totNumClients, oct_value : oct_totNumClients, nov_value : nov_totNumClients, dec_value : dec_totNumClients, tot_valaue: dec_totNumClients, tot_value: dec_totNumClients
            }) 

            poSumView.push({title: "Old Clients", sortkey: 5, group: 2, isTitle: false, beg_bal: begBalOldClient, jan_value : jan_oldClientTot, feb_value : feb_oldClientTot, mar_value : mar_oldClientTot, apr_value : apr_oldClientTot,
                may_value : may_oldClientTot, jun_value : jun_oldClientTot, jul_value : jul_oldClientTot, aug_value : aug_oldClientTot,
                sep_value : sep_oldClientTot, oct_value : oct_oldClientTot, nov_value : nov_oldClientTot, dec_value : dec_oldClientTot, tot_value : dec_oldClientTot
            }) 

            const fndTotClients = await Budg_exec_sum.findOne({po: viewPOCode, view_code: "TotClientOutreach", target_year: budgetYear}, function (err, fndTotLonAmt) {
                fondResClients = fndTotLonAmt
            })
            console.log("Total January New Loan Client is: " + jan_totNumClients)

                if (isNull(fndTotClients)) { 
                    let newTotCliOutreach = new Budg_exec_sum({
                        region: yuser.region, area: yuser.area, branch: vwBranchCode, unit: vwUnitCode, po: viewPOCode, title: "Client Outreach", view_code: "TotClientOutreach", sort_key: 5, display_group: 2, target_year: budgetYear,
                        beg_bal: 0, jan_budg : jan_totNumClients, feb_budg : feb_totNumClients, mar_budg : mar_totNumClients, apr_budg : apr_totNumClients, may_budg : may_totNumClients, jun_budg : jun_totNumClients, jul_budg : jul_totNumClients, 
                        aug_budg : aug_totNumClients, sep_budg : sep_totNumClients, oct_budg : oct_totNumClients, nov_budg : nov_totNumClients, dec_budg : dec_totNumClients, tot_budg: tot_totNumClients                                   
                    })
                    newTotCliOutreach.save()
                } else {
                    fndTotClients.title = "Client Outreach"
                    fndTotClients.jan_budg = jan_totNumClients
                    fndTotClients.feb_budg = feb_totNumClients
                    fndTotClients.mar_budg = mar_totNumClients
                    fndTotClients.apr_budg = apr_totNumClients
                    fndTotClients.may_budg = may_totNumClients
                    fndTotClients.jun_budg = jun_totNumClients
                    fndTotClients.jul_budg = jul_totNumClients
                    fndTotClients.aug_budg = aug_totNumClients
                    fndTotClients.sep_budg = sep_totNumClients
                    fndTotClients.oct_budg = oct_totNumClients
                    fndTotClients.nov_budg = nov_totNumClients
                    fndTotClients.dec_budg = dec_totNumClients
                    fndTotClients.tot_budg = tot_totNumClients
        
                    fndTotClients.target_year = budgetYear

                    fndTotClients.save()            
                }

            const fndResClients = await Budg_exec_sum.findOne({po: viewPOCode, view_code: "ResignClients", target_year: budgetYear}, function (err, fndTotLonAmt) {
                fondResClients = fndTotLonAmt
                if (isNull(fondResClients)) { 
                    let newNewClients = new Budg_exec_sum({
                        region: yuser.region, area: yuser.area, branch: vwBranchCode, unit: vwUnitCode, po: viewPOCode, target_year: budgetYear,
                        title: "Resign Clients", view_code: "ResignClients", sort_key: 5, display_group: 2, beg_bal: 0, jan_budg : jan_resCliTot, 
                        feb_budg : feb_resCliTot, mar_budg : mar_resCliTot, apr_budg : apr_resCliTot, may_budg : may_resCliTot, jun_budg : jun_resCliTot, jul_budg : jul_resCliTot, 
                        aug_budg : aug_resCliTot, sep_budg : sep_resCliTot, oct_budg : oct_resCliTot, nov_budg : nov_resCliTot, dec_budg : dec_resCliTot, tot_budg: resTotValueClient                                   
                    })
                    newNewClients.save()
                } else {
                    fondResClients.title = "Resign Clients"
                    fondResClients.jan_budg = jan_resCliTot
                    fondResClients.feb_budg = feb_resCliTot
                    fondResClients.mar_budg = mar_resCliTot
                    fondResClients.apr_budg = apr_resCliTot
                    fondResClients.may_budg = may_resCliTot
                    fondResClients.jun_budg = jun_resCliTot
                    fondResClients.jul_budg = jul_resCliTot
                    fondResClients.aug_budg = aug_resCliTot
                    fondResClients.sep_budg = sep_resCliTot
                    fondResClients.oct_budg = oct_resCliTot
                    fondResClients.nov_budg = nov_resCliTot
                    fondResClients.dec_budg = dec_resCliTot
        
                    fondResClients.target_year = budgetYear

                    fondResClients.save()            
                }
            })
    
            const fndCliOutreach = await Budg_exec_sum.findOne({po: viewPOCode, view_code: "ClienOutreach", target_year: budgetYear}, function (err, fndTotLonAmt) {
                fondCliOutReach = fndTotLonAmt
                if (isNull(fondCliOutReach)) { 
                    let newCliOutreach = new Budg_exec_sum({
                        region: yuser.region, area: yuser.area, branch: vwBranchCode, unit: vwUnitCode, po: viewPOCode, target_year: budgetYear,
                        title: "Client Outreach", view_code: "ClienOutreach", sort_key: 5, display_group: 2, beg_bal: 0, jan_budg : jan_totNumClients, 
                        feb_budg : feb_totNumClients, mar_budg : mar_totNumClients, apr_budg : apr_totNumClients, may_budg : may_totNumClients, jun_budg : jun_totNumClients, jul_budg : jul_totNumClients, 
                        aug_budg : aug_totNumClients, sep_budg : sep_totNumClients, oct_budg : oct_totNumClients, nov_budg : nov_totNumClients, dec_budg : dec_totNumClients, tot_budg: resTotValueClient                                   
                    })
                    newCliOutreach.save()
                } else {
                    fondCliOutReach.title = "Client Outreach"
                    fondCliOutReach.jan_budg = jan_totNumClients
                    fondCliOutReach.feb_budg = feb_totNumClients
                    fondCliOutReach.mar_budg = mar_totNumClients
                    fondCliOutReach.apr_budg = apr_totNumClients
                    fondCliOutReach.may_budg = may_totNumClients
                    fondCliOutReach.jun_budg = jun_totNumClients
                    fondCliOutReach.jul_budg = jul_totNumClients
                    fondCliOutReach.aug_budg = aug_totNumClients
                    fondCliOutReach.sep_budg = sep_totNumClients
                    fondCliOutReach.oct_budg = oct_totNumClients
                    fondCliOutReach.nov_budg = nov_totNumClients
                    fondCliOutReach.dec_budg = dec_totNumClients
        
                    fondCliOutReach.target_year = budgetYear
                    fondCliOutReach.save()            
                }
            })
    
            doneReadClientCount = true
        }

        // NUMBER OF LOANS GROUP
        poSumView.push({title: "NUMBER OF LOANS", sortkey: 7, group: 1, isTitle: true})

        const fndNewCli = await Center_budget_det.find({po_code: viewPOCode, view_code: "NewLoanClient", target_year: budgetYear}, function (err, fandNewCli) {
            const fowndNewCLi = fandNewCli
            doneReadNLC = true
        })

        if(!isNull(fndNewCli)) {
            const fndNewLoanCli = await Budg_exec_sum.findOne({po: viewPOCode, view_code: "NumNewLoanCli", target_year: budgetYear}, function (err, fndTotLonAmt) {
                fondNewLoanCli = fndTotLonAmt

                if (isNull(fondNewLoanCli)) { 
                    let newNewClients = new Budg_exec_sum({
                        region: yuser.region, area: yuser.area, branch: vwBranchCode, unit: vwUnitCode, po: viewPOCode, target_year: budgetYear,
                        title: "Number of New Loan", view_code: "NumNewLoanCli", sort_key: 8, display_group: 1, beg_bal: 0, jan_budg : jan_newCtotValue, 
                        feb_budg : feb_newCtotValue, mar_budg : mar_newCtotValue, apr_budg : apr_newCtotValue, may_budg : may_newCtotValue, jun_budg : jun_newCtotValue, jul_budg : jul_newCtotValue, 
                        aug_budg : aug_newCtotValue, sep_budg : sep_newCtotValue, oct_budg : oct_newCtotValue, nov_budg : nov_newCtotValue, dec_budg : dec_newCtotValue, tot_budg: tot_newCtotValue                                       
                    })
                    newNewClients.save()
                } else {
                    fondNewLoanCli.title = "Number of New Loan"
                    fondNewLoanCli.jan_budg = jan_newCtotValue
                    fondNewLoanCli.feb_budg = feb_newCtotValue
                    fondNewLoanCli.mar_budg = mar_newCtotValue
                    fondNewLoanCli.apr_budg = apr_newCtotValue
                    fondNewLoanCli.may_budg = may_newCtotValue
                    fondNewLoanCli.jun_budg = jun_newCtotValue
                    fondNewLoanCli.jul_budg = jul_newCtotValue
                    fondNewLoanCli.aug_budg = aug_newCtotValue
                    fondNewLoanCli.sep_budg = sep_newCtotValue
                    fondNewLoanCli.oct_budg = oct_newCtotValue
                    fondNewLoanCli.nov_budg = nov_newCtotValue
                    fondNewLoanCli.dec_budg = dec_newCtotValue
                    fondNewLoanCli.tot_budg = tot_newCtotValue
        
                    fondNewLoanCli.target_year = budgetYear
                    fondNewLoanCli.save()            
                }
            })
        }   

        if (!isNull(oldLoanClientView)) {

            const fndReLoanCli = await Budg_exec_sum.findOne({po: viewPOCode, view_code: "NumReLoanCli", target_year: budgetYear}, function (err, fndTotLonAmt) {
                fondReLoanCli = fndTotLonAmt
                    if (isNull(fondReLoanCli)) { 
                    let newNewClients = new Budg_exec_sum({
                        region: yuser.region, area: yuser.area, branch: vwBranchCode, unit: vwUnitCode, po: viewPOCode, target_year: budgetYear,
                        title: "Number of Reloan", view_code: "NumReLoanCli", sort_key: 9, display_group: 1, beg_bal: begBalOldClient, jan_budg : jan_oldCtotValue, 
                        feb_budg : feb_oldCtotValue, mar_budg : mar_oldCtotValue, apr_budg : apr_oldCtotValue, may_budg : may_oldCtotValue, jun_budg : jun_oldCtotValue, jul_budg : jul_oldCtotValue, 
                        aug_budg : aug_oldCtotValue, sep_budg : sep_oldCtotValue, oct_budg : oct_oldCtotValue, nov_budg : nov_oldCtotValue, dec_budg : dec_oldCtotValue, tot_budg: tot_oldCtotValue                                      
                    })
                    newNewClients.save()
                } else {
                    fondReLoanCli.title = "Number of Reloan"
                    fondReLoanCli.beg_bal = begBalOldClient
                    fondReLoanCli.jan_budg = jan_oldCtotValue
                    fondReLoanCli.feb_budg = feb_oldCtotValue
                    fondReLoanCli.mar_budg = mar_oldCtotValue
                    fondReLoanCli.apr_budg = apr_oldCtotValue
                    fondReLoanCli.may_budg = may_oldCtotValue
                    fondReLoanCli.jun_budg = jun_oldCtotValue
                    fondReLoanCli.jul_budg = jul_oldCtotValue
                    fondReLoanCli.aug_budg = aug_oldCtotValue
                    fondReLoanCli.sep_budg = sep_oldCtotValue
                    fondReLoanCli.oct_budg = oct_oldCtotValue
                    fondReLoanCli.nov_budg = nov_oldCtotValue
                    fondReLoanCli.dec_budg = dec_oldCtotValue
                    fondReLoanCli.tot_budg = tot_oldCtotValue

                    fondReLoanCli.target_year = budgetYear
                    fondReLoanCli.save()            
                }
            })
            doneReadOLC = true
        } //, function (err, fndPOV) {

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
        let tot_totNoOfLoan = tot_oldCtotValue + tot_newCtotValue
        
        // if (doneReadNLC && doneReadOLC) {
            poSumView.push({title: "TOTAL NO. OF LOAN", sortkey: 10, group: 1, isTitle: false, jan_value : jan_oldCtotValue + jan_newCtotValue, feb_value : feb_oldCtotValue + feb_newCtotValue, mar_value : mar_oldCtotValue + mar_newCtotValue, 
            apr_value : apr_oldCtotValue + apr_newCtotValue, may_value : may_oldCtotValue + may_newCtotValue, jun_value : jun_oldCtotValue + jun_newCtotValue, jul_value : jul_oldCtotValue + jul_newCtotValue, aug_value : aug_oldCtotValue + aug_newCtotValue,
                sep_value : sep_oldCtotValue + sep_newCtotValue, oct_value : oct_oldCtotValue + oct_newCtotValue, nov_value : nov_oldCtotValue + nov_newCtotValue, dec_value : dec_oldCtotValue + dec_newCtotValue, tot_value: tot_totNoOfLoan
            }) 
            doneReadLoanCount = true
        // }

        poSumView.push({title: "AMOUNT OF LOANS", sortkey: 11, group: 2, isTitle: true})

        
        if (!isNull(newLoanAmtView)) {

            const fndNewLoanAmt = await Budg_exec_sum.findOne({po: viewPOCode, view_code: "NewLoanAmount", target_year: budgetYear}, function (err, fndTotLonAmt) {
                fondNewLoanAmt = fndTotLonAmt
                if (isNull(fondNewLoanAmt)) { 
                    let newNewClients = new Budg_exec_sum({
                        region: yuser.region, area: yuser.area, branch: vwBranchCode, unit: vwUnitCode, po: viewPOCode, target_year: budgetYear,
                        title: "Amount of New Loan", view_code: "NewLoanAmount", sort_key: 12, display_group: 2, beg_bal: 0, jan_budg : jan_newAtotValue, 
                        feb_budg : feb_newAtotValue, mar_budg : mar_newAtotValue, apr_budg : apr_newAtotValue, may_budg : may_newAtotValue, jun_budg : jun_newAtotValue, jul_budg : jul_newAtotValue, 
                        aug_budg : aug_newAtotValue, sep_budg : sep_newAtotValue, oct_budg : oct_newAtotValue, nov_budg : nov_newAtotValue, dec_budg : dec_newAtotValue, tot_budg : tot_newAtotValue                                       
                    })
                    newNewClients.save()
                } else {
                    fondNewLoanAmt.title = "Amount of New Loan"
                    fondNewLoanAmt.jan_budg = jan_newAtotValue
                    fondNewLoanAmt.feb_budg = feb_newAtotValue
                    fondNewLoanAmt.mar_budg = mar_newAtotValue
                    fondNewLoanAmt.apr_budg = apr_newAtotValue
                    fondNewLoanAmt.may_budg = may_newAtotValue
                    fondNewLoanAmt.jun_budg = jun_newAtotValue
                    fondNewLoanAmt.jul_budg = jul_newAtotValue
                    fondNewLoanAmt.aug_budg = aug_newAtotValue
                    fondNewLoanAmt.sep_budg = sep_newAtotValue
                    fondNewLoanAmt.oct_budg = oct_newAtotValue
                    fondNewLoanAmt.nov_budg = nov_newAtotValue
                    fondNewLoanAmt.dec_budg = dec_newAtotValue
                    fondNewLoanAmt.tot_budg = tot_newAtotValue
                    
                    fondNewLoanAmt.target_year = budgetYear
                    fondNewLoanAmt.save()            
                }
            })       
            doneReadNLA = true
        }
    
            if (!isNull(oldLoanAmtView)) {
                            
                const fndReLoanAmt = await Budg_exec_sum.findOne({po: viewPOCode, view_code: "ReLoanAmount", target_year: budgetYear}, function (err, fndTotLonAmt) {
                    fondReLoanAmt = fndTotLonAmt
        
                    if (isNull(fondReLoanAmt)) { 
                        let newNewClients = new Budg_exec_sum({
                            region: yuser.region, area: yuser.area, branch: vwBranchCode, unit: vwUnitCode, po: viewPOCode, target_year: budgetYear,
                            title: "Amount of Reloan", view_code: "ReLoanAmount", sort_key: 13, display_group: 2, beg_bal: 0, jan_budg : jan_oldAtotValue, 
                            feb_budg : feb_oldAtotValue, mar_budg : mar_oldAtotValue, apr_budg : apr_oldAtotValue, may_budg : may_oldAtotValue, jun_budg : jun_oldAtotValue, jul_budg : jul_oldAtotValue, 
                            aug_budg : aug_oldAtotValue, sep_budg : sep_oldAtotValue, oct_budg : oct_oldAtotValue, nov_budg : nov_oldAtotValue, dec_budg : dec_oldAtotValue, tot_budg : tot_oldAtotValue                                      
                        })
                        newNewClients.save()
                    } else {
                        fondReLoanAmt.title = "Amount of Reloan"
                        fondReLoanAmt.jan_budg = jan_oldAtotValue
                        fondReLoanAmt.feb_budg = feb_oldAtotValue
                        fondReLoanAmt.mar_budg = mar_oldAtotValue
                        fondReLoanAmt.apr_budg = apr_oldAtotValue
                        fondReLoanAmt.may_budg = may_oldAtotValue
                        fondReLoanAmt.jun_budg = jun_oldAtotValue
                        fondReLoanAmt.jul_budg = jul_oldAtotValue
                        fondReLoanAmt.aug_budg = aug_oldAtotValue
                        fondReLoanAmt.sep_budg = sep_oldAtotValue
                        fondReLoanAmt.oct_budg = oct_oldAtotValue
                        fondReLoanAmt.nov_budg = nov_oldAtotValue
                        fondReLoanAmt.dec_budg = dec_oldAtotValue
                        fondReLoanAmt.tot_budg = tot_oldAtotValue
            
                        fondReLoanAmt.target_year = budgetYear
                        fondReLoanAmt.save()            
                    }
                })
                doneReadOLA = true

            }

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

                totTotAmtLoan = janTotAmtLoan + febTotAmtLoan + marTotAmtLoan + aprTotAmtLoan + mayTotAmtLoan + junTotAmtLoan + julTotAmtLoan + augTotAmtLoan +
                        sepTotAmtLoan + octTotAmtLoan + novTotAmtLoan + decTotAmtLoan

                poSumView.push({title: "TOTAL AMOUNT OF LOAN", sortkey: 14, group: 2, isTitle: false, jan_value : janTotAmtLoan, feb_value : febTotAmtLoan, mar_value : marTotAmtLoan, 
                apr_value : aprTotAmtLoan, may_value : mayTotAmtLoan, jun_value : junTotAmtLoan, jul_value : julTotAmtLoan, 
                aug_value : augTotAmtLoan, sep_value : sepTotAmtLoan, oct_value : octTotAmtLoan, nov_value : novTotAmtLoan, dec_value : decTotAmtLoan, tot_value: totTotAmtLoan })
                
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
                          
                                jan_totWklyCBUAmt = jan_totInitCBUAmt + (begBalOldClient * 50 * 4) // Monthly CBU Amount
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


                poSumView.push({title: "MONTHLY DISBURSEMENT (P)", sortkey: 16, group: 1, isTitle: false, jan_value : janTotAmtLoan, feb_value : febTotAmtLoan, mar_value : marTotAmtLoan, 
                    apr_value : aprTotAmtLoan, may_value : mayTotAmtLoan, jun_value : junTotAmtLoan, jul_value : julTotAmtLoan, 
                    aug_value : augTotAmtLoan, sep_value : sepTotAmtLoan, oct_value : octTotAmtLoan, nov_value : novTotAmtLoan, dec_value : decTotAmtLoan, tot_value : totTotAmtLoan
                })
                
                const fndRMonDisburse = await Budg_exec_sum.findOne({po: viewPOCode, view_code: "MonthlyDisbAmt", target_year: budgetYear}, function (err, fndTotLonAmt) {
                    fondMonthlyDisburse = fndTotLonAmt
                    if (isNull(fondMonthlyDisburse)) { 
                        let newNewClients = new Budg_exec_sum({
                            region: yuser.region, area: yuser.area, branch: vwBranchCode, unit: vwUnitCode, po: viewPOCode, target_year: budgetYear,
                            title: "MONTHLY DISBURSEMENT (P)", view_code: "MonthlyDisbAmt", sort_key: 16, display_group: 1, beg_bal: 0, jan_budg : janTotAmtLoan, 
                            feb_budg : febTotAmtLoan, mar_budg : marTotAmtLoan, apr_budg : aprTotAmtLoan, may_budg : mayTotAmtLoan, jun_budg : junTotAmtLoan, jul_budg : julTotAmtLoan, 
                            aug_budg : augTotAmtLoan, sep_budg : sepTotAmtLoan, oct_budg : octTotAmtLoan, nov_budg : novTotAmtLoan, dec_budg : decTotAmtLoan, tot_budg : totTotAmtLoan
                        })
                        newNewClients.save()
                    } else {
                        fondMonthlyDisburse.title = "MONTHLY DISBURSEMENT (P)"
                        fondMonthlyDisburse.jan_budg = janTotAmtLoan
                        fondMonthlyDisburse.feb_budg = febTotAmtLoan
                        fondMonthlyDisburse.mar_budg = marTotAmtLoan
                        fondMonthlyDisburse.apr_budg = aprTotAmtLoan
                        fondMonthlyDisburse.may_budg = mayTotAmtLoan
                        fondMonthlyDisburse.jun_budg = junTotAmtLoan
                        fondMonthlyDisburse.jul_budg = julTotAmtLoan
                        fondMonthlyDisburse.aug_budg = augTotAmtLoan
                        fondMonthlyDisburse.sep_budg = sepTotAmtLoan
                        fondMonthlyDisburse.oct_budg = octTotAmtLoan
                        fondMonthlyDisburse.nov_budg = novTotAmtLoan
                        fondMonthlyDisburse.dec_budg = decTotAmtLoan
                        fondMonthlyDisburse.tot_budg = totTotAmtLoan
            
                        fondMonthlyDisburse.target_year = budgetYear
                        fondMonthlyDisburse.save()            
                    }
                })
                       
                //CAPITAL BUILD UP VIEW ITEMS
                poSumView.push({title: "CAPITAL BUILD-UP", sortkey: 19, group: 2, isTitle: true})

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
                poSumView.push({title: "Monthly Contribution", sortkey: 21, group: 2, beg_bal: (begBalOldClient * 50 * 4), jan_value : jan_totWklyCBUAmt, feb_value : feb_totWklyCBUAmt, mar_value : mar_totWklyCBUAmt, 
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
    
                poSumView.push({title: "MONTHLY LOAN PORTFOLIO", sortkey: 18, group: 1, isTitle: false, jan_value : janRunBalAmt, feb_value : febRunBalAmt, mar_value : marRunBalAmt, 
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

                poSumView.push({title: "BAL. FROM PREV. MONTH", sortkey: 17, group: 1, isTitle: false, jan_value : janRunBalPrevMon, feb_value : febRunBalPrevMon, mar_value : marRunBalPrevMon, 
                    apr_value : aprRunBalPrevMon, may_value : mayRunBalPrevMon, jun_value : junRunBalPrevMon, jul_value : julRunBalPrevMon, 
                    aug_value : augRunBalPrevMon, sep_value : sepRunBalPrevMon, oct_value : octRunBalPrevMon, nov_value : novRunBalPrevMon, dec_value : decRunBalPrevMon
                
                })

                const fndBalFromPrevMo = await Budg_exec_sum.findOne({po: viewPOCode, view_code: "BalFromPrevMon", target_year: budgetYear}, function (err, fndTotLonAmt) {
                    fondBalFromPrevMo = fndTotLonAmt
                    if (isNull(fondBalFromPrevMo)) { 
                        let newNewClients = new Budg_exec_sum({
                            region: yuser.region, area: yuser.area, branch: vwBranchCode, unit: vwUnitCode, po: viewPOCode, target_year: budgetYear,
                            title: "BAL. FROM PREV. MONTH", view_code: "BalFromPrevMon", sort_key: 17, display_group: 1, beg_bal: 0, jan_budg : janRunBalPrevMon, 
                            feb_budg : febRunBalPrevMon, mar_budg : marRunBalPrevMon, apr_budg : aprRunBalPrevMon, may_budg : mayRunBalPrevMon, jun_budg : junRunBalPrevMon, jul_budg : julRunBalPrevMon, 
                            aug_budg : augRunBalPrevMon, sep_budg : sepRunBalPrevMon, oct_budg : octRunBalPrevMon, nov_budg : novRunBalPrevMon, dec_budg : decRunBalPrevMon                                        
                        })
                        newNewClients.save()
                    } else {
                        fondBalFromPrevMo.title = "BAL. FROM PREV. MONTH"
                        fondBalFromPrevMo.jan_budg = janRunBalPrevMon
                        fondBalFromPrevMo.feb_budg = febRunBalPrevMon
                        fondBalFromPrevMo.mar_budg = marRunBalPrevMon
                        fondBalFromPrevMo.apr_budg = aprRunBalPrevMon
                        fondBalFromPrevMo.may_budg = mayRunBalPrevMon
                        fondBalFromPrevMo.jun_budg = junRunBalPrevMon
                        fondBalFromPrevMo.jul_budg = julRunBalPrevMon
                        fondBalFromPrevMo.aug_budg = augRunBalPrevMon
                        fondBalFromPrevMo.sep_budg = sepRunBalPrevMon
                        fondBalFromPrevMo.oct_budg = octRunBalPrevMon
                        fondBalFromPrevMo.nov_budg = novRunBalPrevMon
                        fondBalFromPrevMo.dec_budg = decRunBalPrevMon
            
                        fondBalFromPrevMo.target_year = budgetYear
                        fondBalFromPrevMo.save()            
                    }
                })
                                                
                doneReadLoanAmt = true
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
        if (doneReadClientCount && doneReadLoanAmt) {  //doneReadLoanCount
            res.render('centers/viewTargetsMonthly', {
                poCode: viewPOCode,
                poSumView: poSumView,
                yuser: yuser,
                dateToday: new Date()

            })
        }
    } catch (err) {
        console.log(err)
        res.redirect('/centers/center/'+ viewPOCode)
    }
})

router.get('/exportToExcel/:id', authUser, authRole("PO"), (req,res) => {

    // let dataForExcel = []
    // dataForExcel = poSumView

    const dataForExcel = poSumView.map(unitExecSum => {
        return [unitExecSum.title, unitExecSum.beg_bal, unitExecSum.jan_value, unitExecSum.feb_value, unitExecSum.mar_value,
            unitExecSum.apr_value, unitExecSum.may_value, unitExecSum.jun_value, unitExecSum.jul_value, unitExecSum.aug_value,
            unitExecSum.sep_value, unitExecSum.oct_value, unitExecSum.nov_value, unitExecSum.dec_value, unitExecSum.tot_value]
    });

    console.log(dataForExcel)

    let workbook = new excel.Workbook();
    let worksheet = workbook.addWorksheet("PO_Exec_Sum");

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
      "attachment; filename=" + "PO_exec_Sum.xlsx"
    );

    workbook.xlsx.write(res).then(function () {
      res.status(200).end()
    })

})


// SAVE TARGET - ORIGINAL codes 07.05.2022
//Save targets to Targets array field in center collection
//
router.put("SaveOrig/:id", authUser, authRole("PO"), async function(req, res){

    const loanType = req.body.loanType
    const month = req.body.month
    const semester = req.body.semester
    const numClient = _.toNumber(req.body.numClient)
    const amount = _.toNumber(_.replace(req.body.amount,',',''))
    const totAmount = numClient * amount
    const remarks = req.body.remarks
    const centerCode = req.params.id
    const yuser = req.user

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

    let canSaveResign = false


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

    let clientCountIncluded = false
    let centerBudgDet = []

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
        let rExNewClientAmt = 0
        let rExPrevNewClient =  0 
        let rExPrevNewAmt =  0 
        let rExOldClient = 0
        let rExOldClientAmt = 0
        let rExPrevOldClient = 0
        let rExPrevOldAmt = 0
        let resClient = 0

        if (_.trim(remarks) === "New Loan") {
            newClient = numClient
            newClientAmt = totAmount
            if (loanType === "Group Loan" || loanType === "Agricultural Loan" || loanType === "Individual Loan - IMEP") {
                rNewClient = numClient
                rNewClientAmt = totAmount
                clientCountIncluded = true
            }
        }
        else {
            oldClient = numClient
            oldClientAmt = totAmount
            if (loanType === "Group Loan" || loanType === "Agricultural Loan" || loanType === "Individual Loan - IMEP") {
                rOldClient = numClient
                rOldClientAmt = totAmount
                clientCountIncluded = true
            }
        }
    // to include amount and client totals for non-GLP products ????
//    resClient = rOldClient - rNewClient
    
    // Saving to Center_budget_det Collection
        const poNumber = centerCode.substr(5,1)
        const unitCode = centerCode.substr(0,5)
        const branchCode = centerCode.substr(0,3)
        const poCode = centerCode.substr(0,6)
        let centerViewCode = ""
        if (remarks === "New Loan") {
            centerView1Code = "NewLoanClient"
            centerView2Code = "NewLoanAmt"
        } else {
            centerView1Code = "OldLoanClient"
            centerView2Code = "OldLoanAmt"
        }

        centerBudgDet = await Center_budget_det.findOne({center: centerCode, loan_type: loanType})
        
        let resiClient = 0
        let resiClient1 = 0
        let resiClient2 = 0
        let otherLoanResCli = 0
        let resWitBegCount = 0
        let resWitBegOldCount = 0
        let withReloanMonth = ""

        let firstHalfNewLoanCount = 0
        let firstHalfNewLoanAmount = 0
        let firstHalfReLoanCount = 0
        let firstHalfReLoanAmount = 0
        let seconHalfNewLoanCount = 0
        let seconHalfNewLoanAmount = 0
        let seconHalfReLoanCount = 0
        let seconHalfReLoanAmount = 0


    // SAVING TO CENTER COLLECTION
      const centerFound = await Center.findOne({center: centerCode}) //, function(err, foundList){ 
          console.log(centerFound)

        if (!isNull(centerFound)) {
            let foundList = centerFound
            const curTargets = foundList.Targets

            const ctrBegBals = foundList.Loan_beg_bal

            let forSortTargets = []
            let sortedTargets = []
            let ctrBegBalCli = 0

            //sort Center Targets prior to Saving
            foundList.Targets.forEach( list => {
                
                const _id = list._id
                const loan_type = list.loan_type
                const month = list.month
                const monthOrder = list.monthOrder
                const semester = list.semester
                const num_Client = list.numClient
                const amount = list.amount
                const totAmount = list.totAmount
                const remarks = list.remarks
                const strLoanAmount = _.toString(list.amount)
                
                const sortKey = _.toString(list.dispView) + list.loan_type + semester + list.remarks + _.toString(list.monthOrder) + strLoanAmount

                // const sortKey = _.toString(list.dispView) + list.loan_type + list.remarks + _.toString(list.monthOrder)

                const ctrBegBal = ctrBegBals.find(cBeg => cBeg.loan_type === loan_type)
                if (!ctrBegBal) {
                    ctrBegBalCli = 0
                } else {
                    ctrBegBalCli = ctrBegBal.beg_client_count
                }   

                forSortTargets.push({_id: _id, sortKey: sortKey, loan_type: loan_type, begBal: ctrBegBalCli, month: month, monthOrder: monthOrder, 
                    semester: semester, numClient: num_Client, amount: amount, totAmount: totAmount, remarks: remarks})

            }) 

                sortedTargets = forSortTargets.sort( function (a,b) {
                    if ( a.sortKey < b.sortKey ){
                        return -1;
                    }
                    if ( a.sortKey > b.sortKey ){
                        return 1;
                    }
                    return 0;
                })
    
                let idClientLen = 0
    
                if (sortedTargets.length == 1) {
                    idClientLen = 1
                } else {
                    idClientLen = sortedTargets.length
                }

            console.log(sortedTargets)  

            // getting of Beginning Balances per Loan Type
            const curBegBal = foundList.Loan_beg_bal

            let curLoanTypeCliBegBal = 0
            let curLoanTypeAmtBegBal = 0
            let curLoanTypeIntBegBal = 0
            let curMaturityMonthBeg
            withReloanMonth = ""
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
            
            let resiOtherClient = 0
            let newLoanCount = 0
            let oldLoanCount = 0
            let newLoanAmount = 0
            let oldLoanAmount = 0
            let hasCurNewLoan = false
            let hasPrevNewLoan = false
            let hasCurReLoan = false
            let hasSeconHalfNewLoan = false
            let hasSeconHalfReloan = false
            let hasFirstHalfNewLoan = false
            let hasFirstHalfReloan = false
            let targetKeyForUpdet = ""

            firstHalfNewLoanCount = 0
            firstHalfNewLoanAmount = 0
            firstHalfReLoanCount = 0
            firstHalfReLoanAmount = 0
            seconHalfNewLoanCount = 0
            seconHalfNewLoanAmount = 0
            seconHalfReLoanCount = 0
            seconHalfReLoanAmount = 0
    
            if (curTargets.length == 0) {
                if (remarks === "Re-loan") {
                    resiClient = curLoanTypeCliBegBal - numClient
                }
                
            } else {
                sortedTargets.forEach(target => {
                    const tarLoanType = target.loan_type
                    const targMonth = target.month
                    const nTargMonth = target.monthOrder
                    const targClientCount = target.numClient 
                    const targSemester = target.semester
                    const totLonAmount = target.totAmount

                    if (tarLoanType === loanType) {
                        if (targSemester === "First Half") {
                            if (target.remarks === "New Loan") {
                                hasFirstHalfNewLoan = true

                                newLoanAmount = newLoanAmount + totLonAmount

                                firstHalfNewLoanAmount = firstHalfNewLoanAmount + totLonAmount

                                rNewClientAmt = rNewClientAmt + target.numClient //

                                if (tarLoanType === "Group Loan" || tarLoanType === "Agricultural Loan" || tarLoanType === "Individual Loan - IMEP")  {
                                    newLoanCount = newLoanCount + target.numClient   // New Loan Count running Totals
                                    firstHalfNewLoanCount = firstHalfNewLoanCount + target.numClient

                                    rNewClient = rNewClient + target.numClient   //
                                }
                            }
                            else { 
                                hasFirstHalfReloan = true

                                withReloanMonth = targMonth
                                oldLoanAmount = oldLoanAmount + totLonAmount
                                targetKeyForUpdet = target.id

                                firstHalfReLoanAmount = firstHalfReLoanAmount + totLonAmount

                                if (tarLoanType === "Group Loan" || tarLoanType === "Agricultural Loan" || tarLoanType === "Individual Loan - IMEP")  {
                                    oldLoanCount  = oldLoanCount + target.numClient
                                    firstHalfReLoanCount = firstHalfReLoanCount + target.numClient

                                }
                            }
                        }
                        if (targSemester === "Second Half") {
                            if (target.remarks === "New Loan") {
                                hasSeconHalfNewLoan = true

                                newLoanAmount = newLoanAmount + totLonAmount

                                seconHalfNewLoanAmount = seconHalfNewLoanAmount + totLonAmount

                                if (tarLoanType === "Group Loan" || tarLoanType === "Agricultural Loan" || tarLoanType === "Individual Loan - IMEP")  {
                                    newLoanCount = newLoanCount + target.numClient   // New Loan Count running Totals

                                    seconHalfNewLoanCount = seconHalfNewLoanCount + target.numClient
                                }
                            }
                            else { 
                                hasSeconHalfReloan = true

                                withReloanMonth = targMonth
                                oldLoanAmount = oldLoanAmount + totLonAmount

                                seconHalfReLoanAmount = seconHalfReLoanAmount + totLonAmount

                                if (tarLoanType === "Group Loan" || tarLoanType === "Agricultural Loan" || tarLoanType === "Individual Loan - IMEP")  {
                                    oldLoanCount  = oldLoanCount + target.numClient

                                    seconHalfReLoanCount = seconHalfReLoanCount + target.numClient
                                }
                            }
                        
                        }
                    }

                }) // end of forEach() loop
                if (loanType === "Group Loan" || loanType === "Agricultural Loan" || loanType === "Individual Loan - IMEP") {

                    if (semester === "First Half") {
                        if (remarks === "Re-loan") {
                            resiClient1 = curLoanTypeCliBegBal - (firstHalfReLoanCount + numClient)
                            if (hasSeconHalfReloan) {
                                resiClient2 = (firstHalfNewLoanCount + firstHalfReLoanCount + numClient) - seconHalfReLoanCount
                            } 
                        } else { // remarks === 'New Loan'
                            if (hasFirstHalfReloan) {
                                resiClient1 = curLoanTypeCliBegBal - (firstHalfReLoanCount)
                            }
                            if (hasSeconHalfReloan) {
                                resiClient2 = (firstHalfNewLoanCount + firstHalfReLoanCount + numClient) - seconHalfReLoanCount
                            }
                        }
                    }

                    if (semester === "Second Half") {
                        if (remarks === "Re-loan") {
                            resiClient2 = (firstHalfNewLoanCount + firstHalfReLoanCount) - (seconHalfReLoanCount + numClient)
                        }
                        if (hasFirstHalfReloan) {
                            resiClient1 = curLoanTypeCliBegBal - (firstHalfReLoanCount)
                        }
                    }
                }
                    
                    if (!isNull(targetKeyForUpdet)) {
                        curResTarcenter =  Center.findOneAndUpdate({"center": centerCode}, {$set: {"Targets.$[el].resignClient": 0}}, 
                                                    {arrayFilters: [{"el._id": targetKeyForUpdet }]}, function(err, foundResList){
                            if (err) {
                                console.log(err)
                            } else {
                                // console.log(foundResList)
                            }
                        })                                
                    }

            }
            
            // Saving RESIGN Client Count to center_budget_dets collection
            if (resiClient < 0) {
                resiClient = 0
            }

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
            if (loanType === "Group Loan" || loanType === "Agricultural Loan" || loanType === "Individual Loan - IMEP") {

                if (semester === "First Half") {
                    if (remarks === "Re-loan") {
                        foundList.resClient = resiClient1 //+ (curLoanTypeCliBegBal - rExPrevOldClient)
                        if (hasSeconHalfReloan) {
                            foundList.resClient2 = resiClient2 //+ (curLoanTypeCliBegBal - rExPrevOldClient)
                            // resiClient2 = (firstHalfNewLoanCount + firstHalfReLoanCount + numClient) - seconHalfReLoanCount
                        }
                    } else { // remarks === 'New Loan'
                        foundList.resClient = resiClient1 //+ (curLoanTypeCliBegBal - rExPrevOldClient)
                        if (hasSeconHalfReloan) {
                            foundList.resClient2 = resiClient2 //+ (curLoanTypeCliBegBal - rExPrevOldClient)
                            // resiClient2 = (firstHalfNewLoanCount + firstHalfReLoanCount + numClient) - seconHalfReLoanCount
                        }
                    }
                }

                if (semester === "Second Half") {
                    if (remarks === "Re-loan") {
                        foundList.resClient2 = resiClient2 //+ (curLoanTypeCliBegBal - rExPrevOldClient)
                        // resiClient2 = (firstHalfNewLoanCount + firstHalfReLoanCount) - (seconHalfReLoanCount + numClient)
                    }
                }

                // if (semester === "Second Half") {
                //     foundList.resClient2 = resiClient // saving to resClient2 field for 2nd half/semester
                // } else {
                //     foundList.resClient = resiClient //+ (curLoanTypeCliBegBal - rExPrevOldClient)
                // }

                if (remarks === "Re-loan") {
                    
                    foundList.oldClient = (firstHalfReLoanCount + seconHalfReLoanCount) + numClient
                    foundList.oldClientAmt = (firstHalfReLoanAmount + seconHalfReLoanAmount) + totAmount
                    // foundList.oldClient = (rExOldClient + rExPrevOldClient) + numClient
                    // foundList.oldClientAmt = (rExOldClientAmt + rExPrevOldAmt) + totAmount
                } else {
                    foundList.newClient = (firstHalfNewLoanCount + seconHalfNewLoanCount) + numClient
                    foundList.newClientAmt = (firstHalfNewLoanAmount + seconHalfNewLoanAmount) + totAmount
                    // foundList.newClient = (rExNewClient + rExPrevNewClient) + numClient
                    // foundList.newClientAmt = (rExNewClientAmt + rExPrevNewAmt) + totAmount
                }
            } else {  // Loan Amounts from other Loan Types shall only be added into the Total Disbursement Amount
                if (remarks === "Re-loan") {
                    foundList.oldClientAmt = foundList.oldClientAmt + totAmount  // (firstHalfReLoanAmount + seconHalfReLoanAmount)
                } else {
                    foundList.newClientAmt = foundList.newClientAmt + totAmount // (firstHalfNewLoanAmount + seconHalfNewLoanAmount)
                }

            }
            // foundList.beg_center_month = month
            foundList.region = req.user.region
            // saving to center collections and its Target array field
            foundList.Targets.push(item);
            foundList.save();
         }

        // Saving New Loan & Old Loan to Center_budget_dets table
        // centerBudgDet = await Center_budget_det.findOne({center: centerCode, loan_type: loanType})

         if (isNull(centerBudgDet)) {

            let newCntrCliBudg = new Center_budget_det({
                region: yuser.region, area: yuser.area, branch: branchCode, unit: unitCode, po: poNumber, po_code: poCode, center: centerCode,
                view_type: "PUH", loan_type: loanType, client_count_included: clientCountIncluded, view_code: centerView1Code,
                beg_bal: 0, beg_bal_amt: 0, beg_bal_int: 0,
                jan_budg: janLoanCliBudg, feb_budg: febLoanCliBudg, mar_budg: marLoanCliBudg, apr_budg: aprLoanCliBudg,
                may_budg: mayLoanCliBudg, jun_budg: junLoanCliBudg, jul_budg: julLoanCliBudg, aug_budg: augLoanCliBudg,
                sep_budg: sepLoanCliBudg, oct_budg: octLoanCliBudg, nov_budg: novLoanCliBudg, dec_budg: decLoanCliBudg
            })
            const newCtrClient = await newCntrCliBudg.save()

            let newCntrAmtBudg = new Center_budget_det({
                region: yuser.region, area: yuser.area, branch: branchCode, unit: unitCode, po: poNumber, po_code: poCode, center: centerCode,
                view_type: "PUH", loan_type: loanType, client_count_included: clientCountIncluded, view_code: centerView2Code,
                beg_bal: 0, beg_bal_amt: 0, beg_bal_int: 0,
                jan_budg: janLoanBudg, feb_budg: febLoanBudg, mar_budg: marLoanBudg, apr_budg: aprLoanBudg,
                may_budg: mayLoanBudg, jun_budg: junLoanBudg, jul_budg: julLoanBudg, aug_budg: augLoanBudg,
                sep_budg: sepLoanBudg, oct_budg: octLoanBudg, nov_budg: novLoanBudg, dec_budg: decLoanBudg
            })
            const newCtrClientAmt = await newCntrAmtBudg.save()

            if (centerView1Code === "OldLoanClient") {
                canSaveResign = true
            }

        } else {

            let janTotCliCount = 0
            let febTotCliCount = 0
            let marTotCliCount = 0
            let aprTotCliCount = 0
            let mayTotCliCount = 0
            let junTotCliCount = 0
            let julTotCliCount = 0
            let augTotCliCount = 0
            let sepTotCliCount = 0
            let octTotCliCount = 0
            let novTotCliCount = 0
            let decTotCliCount = 0

                let janTotCliAmount = 0
                let febTotCliAmount = 0
                let marTotCliAmount = 0
                let aprTotCliAmount = 0
                let mayTotCliAmount = 0
                let junTotCliAmount = 0
                let julTotCliAmount = 0
                let augTotCliAmount = 0
                let sepTotCliAmount = 0
                let octTotCliAmount = 0
                let novTotCliAmount = 0
                let decTotCliAmount = 0

                // if (remarks === "New Loan") {
                //     centerView1Code = "NewLoanClient"
                //     centerView2Code = "NewLoanAmt"
                // } else {
                //     centerView1Code = "OldLoanClient"
                //     centerView2Code = "OldLoanAmt"
                // }
        
                if (semester === "First Half") {
                    if (remarks === "New Loan") {
                        switch(month) {
                            case "January": 
                                janTotCliCount = firstHalfNewLoanCount + janLoanCliBudg
                                janTotCliAmount = firstHalfNewLoanAmount + janLoanBudg
    
                                if (withReloanMonth === "July") {
                                    julTotCliCount = seconHalfNewLoanCount
                                    julTotCliAmount = seconHalfNewLoanAmount
                                    }
                               break;
                            case "February": 
                                febTotCliCount = firstHalfNewLoanCount + febLoanCliBudg
                                febTotCliAmount = firstHalfNewLoanAmount + febLoanBudg
    
                                if (withReloanMonth === "August") {
                                    augTotCliCount = seconHalfNewLoanCount
                                    augTotCliAmount = seconHalfNewLoanAmount
                                    }
                               break;
                            case "March": 
                                marTotCliCount = firstHalfNewLoanCount + marLoanCliBudg
                                marTotCliAmount = firstHalfNewLoanAmount + marLoanBudg
    
                                if (withReloanMonth === "September") {
                                    sepTotCliCount = seconHalfNewLoanCount
                                    sepTotCliAmount = seconHalfNewLoanAmount
                                    }
                               break;
                            case "April": 
                                aprTotCliCount = firstHalfNewLoanCount + aprLoanCliBudg
                                aprTotCliAmount = firstHalfNewLoanAmount + aprLoanBudg
    
                                if (withReloanMonth === "October") {
                                    octTotCliCount = seconHalfNewLoanCount
                                    octTotCliAmount = seconHalfNewLoanAmount
                                    }
                               break;
                            case "May": 
                                mayTotCliCount = firstHalfNewLoanCount + mayLoanCliBudg
                                mayTotCliAmount = firstHalfNewLoanAmount + mayLoanBudg
    
                                if (withReloanMonth === "November") {
                                    novTotCliCount = seconHalfNewLoanCount
                                    novTotCliAmount = seconHalfNewLoanAmount
                                    }
                                break;
                            case "June": 
                                junTotCliCount = firstHalfNewLoanCount + junLoanCliBudg
                                junTotCliAmount = firstHalfNewLoanAmount + junLoanBudg
    
                                if (withReloanMonth === "December") {
                                    decTotCliCount = seconHalfNewLoanCount
                                    decTotCliAmount = seconHalfNewLoanAmount
                                    }
                                break;                           
                            default:
                                orderMonth = 0
                                                    
                        }
                    } else {  // remarks === "Reloan"
                        switch(month) {
                            case "January": 
                                janTotCliCount = firstHalfReLoanCount + janLoanCliBudg
                                janTotCliAmount = firstHalfReLoanAmount + janLoanBudg
        
                                if (withReloanMonth === "July") {
                                    julTotCliCount = seconHalfReLoanCount
                                    julTotCliAmount = seconHalfReLoanAmount
                                    }
                               break;
                            case "February": 
                                febTotCliCount = firstHalfReLoanCount + febLoanCliBudg
                                febTotCliAmount = firstHalfReLoanAmount + febLoanBudg
    
                                if (withReloanMonth === "August") {
                                    augTotCliCount = seconHalfReLoanCount
                                    augTotCliAmount = seconHalfReLoanAmount
                                    }
                               break;
                            case "March": 
                                marTotCliCount = firstHalfReLoanCount + marLoanCliBudg
                                marTotCliAmount = firstHalfReLoanAmount + marLoanBudg
    
                                if (withReloanMonth === "September") {
                                    sepTotCliCount = seconHalfReLoanCount
                                    sepTotCliAmount = seconHalfReLoanAmount
                                    }
                               break;
                            case "April": 
                                aprTotCliCount = firstHalfReLoanCount + aprLoanCliBudg
                                aprTotCliAmount = firstHalfReLoanAmount + aprLoanBudg
    
                                if (withReloanMonth === "October") {
                                    octTotCliCount = seconHalfReLoanCount
                                    octTotCliAmount = seconHalfReLoanAmount
                                    }
                               break;
                            case "May": 
                                mayTotCliCount = firstHalfReLoanCount + mayLoanCliBudg
                                mayTotCliAmount = firstHalfReLoanAmount + mayLoanBudg
    
                                if (withReloanMonth === "November") {
                                    novTotCliCount = seconHalfReLoanCount
                                    novTotCliAmount = seconHalfReLoanAmount
                                    }
                                break;
                            case "June": 
                                junTotCliCount = firstHalfReLoanCount + junLoanCliBudg
                                junTotCliAmount = firstHalfReLoanAmount + junLoanBudg
    
                                if (withReloanMonth === "December") {
                                    decTotCliCount = seconHalfReLoanCount
                                    decTotCliAmount = seconHalfReLoanAmount
                                    }
                                break;
                        }

                    }
                } 

                if (semester === "Second Half") {
                    if (remarks === "New Loan") {
                        switch(month) {
                            case "July": 
                                julTotCliCount = seconHalfNewLoanCount + julLoanCliBudg
                                julTotCliAmount = seconHalfNewLoanAmount + julLoanBudg

                                janTotCliCount = firstHalfNewLoanCount
                                janTotCliAmount = firstHalfNewLoanAmount

                                break;
                            case "August": 
                                augTotCliCount = seconHalfNewLoanCount + augLoanCliBudg
                                augTotCliAmount = seconHalfNewLoanAmount + augLoanBudg

                                febTotCliCount = firstHalfNewLoanCount
                                febTotCliAmount = firstHalfNewLoanAmount
                                break;
                            case "September": 
                                sepTotCliCount = seconHalfNewLoanCount + sepLoanCliBudg
                                sepTotCliAmount = seconHalfNewLoanAmount + sepLoanBudg

                                marTotCliCount = firstHalfNewLoanCount
                                marTotCliAmount = firstHalfNewLoanAmount                                
                                break;
                            case "October": 
                                octTotCliCount = seconHalfNewLoanCount + octLoanCliBudg
                                octTotCliAmount = seconHalfNewLoanAmount + octLoanBudg

                                aprTotCliCount = firstHalfNewLoanCount
                                aprTotCliAmount = firstHalfNewLoanAmount                                
                                break;
                            case "November": 
                                novTotCliCount = seconHalfNewLoanCount + novLoanCliBudg
                                novTotCliAmount = seconHalfNewLoanAmount + novLoanBudg

                                mayTotCliCount = firstHalfNewLoanCount
                                mayTotCliAmount = firstHalfNewLoanAmount                                
                                break;
                            case "December": 
                                decTotCliCount = seconHalfNewLoanCount + decLoanCliBudg
                                decTotCliAmount = seconHalfNewLoanAmount + decLoanBudg

                                junTotCliCount = firstHalfNewLoanCount
                                junTotCliAmount = firstHalfNewLoanAmount                                
                                break;
                            default:
                                orderMonth = 0
                        }
                    } else { // Reloan for Second Half
                           
                        switch(month) {
                            case "July": 
                                julTotCliCount = seconHalfReLoanCount + julLoanCliBudg
                                julTotCliAmount = seconHalfReLoanAmount + julLoanBudg
                                
                                janTotCliCount = firstHalfReLoanCount
                                janTotCliAmount = firstHalfReLoanAmount
                            break;
                            case "August": 
                                augTotCliCount = seconHalfReLoanCount + augLoanCliBudg
                                augTotCliAmount = seconHalfReLoanAmount + augLoanBudg
                                
                                febTotCliCount = firstHalfReLoanCount
                                febTotCliAmount = firstHalfReLoanAmount
                                break;
                            case "September": 
                                sepTotCliCount = seconHalfReLoanCount + sepLoanCliBudg
                                sepTotCliAmount = seconHalfReLoanAmount + sepLoanBudg
                                
                                marTotCliCount = firstHalfReLoanCount
                                marTotCliAmount = firstHalfReLoanAmount
                                break;
                            case "October": 
                                octTotCliCount = seconHalfReLoanCount + octLoanCliBudg
                                octTotCliAmount = seconHalfReLoanAmount + octLoanBudg
                                
                                aprTotCliCount = firstHalfReLoanCount
                                aprTotCliAmount = firstHalfReLoanAmount
                                break;
                            case "November": 
                                novTotCliCount = seconHalfReLoanCount + novLoanCliBudg
                                novTotCliAmount = seconHalfReLoanAmount + novLoanBudg
                                
                                mayTotCliCount = firstHalfReLoanCount
                                mayTotCliAmount = firstHalfReLoanAmount
                                break;
                            case "December": 
                                decTotCliCount = seconHalfReLoanCount + decLoanCliBudg
                                decTotCliAmount = seconHalfReLoanAmount + decLoanBudg
                                
                                junTotCliCount = firstHalfReLoanCount
                                junTotCliAmount = firstHalfReLoanAmount
                                break;
                            default:
                            orderMonth = 0
                        }
                    }
                } 


                // if (remarks === "New Loan") {
                //     centerView1Code = "NewLoanClient"
                //     centerView2Code = "NewLoanAmt"
                // } else {
                //     centerView1Code = "OldLoanClient"
                //     centerView2Code = "OldLoanAmt"
                // }
            let centerBudg1Det = []

            centerBudg1Det = await Center_budget_det.findOne({center: centerCode, loan_type: loanType, view_code: centerView1Code})

            if (isNull(centerBudg1Det)) { 
                let newCtrCliBudg = new Center_budget_det({
                    region: yuser.region, area: yuser.area, branch: branchCode, unit: unitCode, po: poNumber, po_code: poCode, center: centerCode,
                    view_type: "PUH", loan_type: loanType, client_count_included: clientCountIncluded, view_code: centerView1Code,
                    beg_bal: 0, beg_bal_amt: 0, beg_bal_int: 0,
                    jan_budg: janTotCliCount, feb_budg: febTotCliCount, mar_budg: marTotCliCount, apr_budg: aprTotCliCount,
                    may_budg: mayTotCliCount, jun_budg: junTotCliCount, jul_budg: julTotCliCount, aug_budg: augTotCliCount,
                    sep_budg: sepTotCliCount, oct_budg: octTotCliCount, nov_budg: novTotCliCount, dec_budg: decTotCliCount
                })
                const nwCtrClient = await newCtrCliBudg.save()
    
                let newCtrAmtBudg = new Center_budget_det({
                    region: yuser.region, area: yuser.area, branch: branchCode, unit: unitCode, po: poNumber, po_code: poCode, center: centerCode,
                    view_type: "PUH", loan_type: loanType, client_count_included: clientCountIncluded, view_code: centerView2Code,
                    beg_bal: 0, beg_bal_amt: 0, beg_bal_int: 0,
                    jan_budg: janTotCliAmount, feb_budg: febTotCliAmount, mar_budg: marTotCliAmount, apr_budg: aprTotCliAmount,
                    may_budg: mayTotCliAmount, jun_budg: junTotCliAmount, jul_budg: julTotCliAmount, aug_budg: augTotCliAmount,
                    sep_budg: sepTotCliAmount, oct_budg: octTotCliAmount, nov_budg: novTotCliAmount, dec_budg: decTotCliAmount
                })
                const nwCtrClientAmt = await newCtrAmtBudg.save()
    

            } else {
                centerBudg1Det.jan_budg = janTotCliCount
                centerBudg1Det.feb_budg = febTotCliCount
                centerBudg1Det.mar_budg = marTotCliCount
                centerBudg1Det.apr_budg = aprTotCliCount
                centerBudg1Det.may_budg = mayTotCliCount
                centerBudg1Det.jun_budg = junTotCliCount
                centerBudg1Det.jul_budg = julTotCliCount
                centerBudg1Det.aug_budg = augTotCliCount
                centerBudg1Det.sep_budg = sepTotCliCount
                centerBudg1Det.oct_budg = octTotCliCount
                centerBudg1Det.nov_budg = novTotCliCount
                centerBudg1Det.dec_budg = decTotCliCount
                await centerBudg1Det.save()
            
        
                center2BudgDet = await Center_budget_det.findOne({center: centerCode, loan_type: loanType, view_code: centerView2Code})
        
                if (isNull(center2BudgDet)) { 
                    if (remarks === "Re-loan") {
                        let oldCtrAmtBudg = new Center_budget_det({
                            region: yuser.region, area: yuser.area, branch: branchCode, unit: unitCode, po: poNumber, po_code: poCode, center: centerCode,
                            view_type: "PUH", loan_type: loanType, client_count_included: clientCountIncluded, view_code: centerView2Code,
                            jan_budg: janTotCliAmount, feb_budg: febTotCliAmount, mar_budg: marTotCliAmount, apr_budg: aprTotCliAmount,
                            may_budg: mayTotCliAmount, jun_budg: junTotCliAmount, jul_budg: julTotCliAmount, aug_budg: augTotCliAmount,
                            sep_budg: sepTotCliAmount, oct_budg: octTotCliAmount, nov_budg: novTotCliAmount, dec_budg: decTotCliAmount
                        })
                        const olCtrClientAmt = await oldCtrAmtBudg.save()
        
                    }
                } else {
                    center2BudgDet.jan_budg = janTotCliAmount
                    center2BudgDet.feb_budg = febTotCliAmount
                    center2BudgDet.mar_budg = marTotCliAmount
                    center2BudgDet.apr_budg = aprTotCliAmount
                    center2BudgDet.may_budg = mayTotCliAmount
                    center2BudgDet.jun_budg = junTotCliAmount
                    center2BudgDet.jul_budg = julTotCliAmount
                    center2BudgDet.aug_budg = augTotCliAmount
                    center2BudgDet.sep_budg = sepTotCliAmount
                    center2BudgDet.oct_budg = octTotCliAmount
                    center2BudgDet.nov_budg = novTotCliAmount
                    center2BudgDet.dec_budg = decTotCliAmount
                    await center2BudgDet.save()
                
                }
            }
        }


         //  Saving / Updating Number of Resign clients in Center_budget_det
            switch(month) {
                case "January": 
                    janResCliBudg = resiClient1
                     if (withReloanMonth === "July") {
                        julResCliBudg = resiClient2
                     }
                    break;
                case "February": 
                    febResCliBudg = resiClient1
                     if (withReloanMonth === "August") {
                        augResCliBudg = resiClient2 
                    }
                    break;
                case "March": 
                    marResCliBudg = resiClient1 
                    if (withReloanMonth === "September") {
                        sepResCliBudg = resiClient2 
                    }
                    break;
                case "April": 
                    aprResCliBudg = resiClient1
                    if (withReloanMonth === "October") {
                        octResCliBudg = resiClient2 
                    }
                    break;
                case "May": 
                    mayResCliBudg = resiClient1
                    if (withReloanMonth === "November") {
                        novResCliBudg = resiClient2 
                    }
                    break;
                case "June": 
                    junResCliBudg = resiClient1 
                    if (withReloanMonth === "December") {
                        decResCliBudg = resiClient2 
                    }
                    break;
                case "July": 
                    julResCliBudg = resiClient2
                    
                    janResCliBudg = resiClient1
                    break;
                case "August": 
                    augResCliBudg = resiClient2

                    febResCliBudg = resiClient1
                    break;
                case "September": 
                    sepResCliBudg = resiClient2

                    marResCliBudg = resiClient1 
                    break;
                case "October": 
                    octResCliBudg = resiClient2

                    aprResCliBudg = resiClient1
                    break;
                case "November": 
                    novResCliBudg = resiClient2

                    mayResCliBudg = resiClient1
                    break;
                case "December": 
                    decResCliBudg = resiClient2

                    junResCliBudg = resiClient1 
                    break;
                default:
                    orderMonth = 0
            }   

            let centerResBudgDet = []

            if (centerView1Code === "OldLoanClient" && canSaveResign) {
                        
                let newCntrCliResBudg = new Center_budget_det({
                    region: yuser.region, area: yuser.area, branch: branchCode, unit: unitCode, po: poNumber, po_code: poCode, center: centerCode,
                    view_type: "PUH", loan_type: loanType, client_count_included: clientCountIncluded, view_code: "ResClientCount",
                    jan_budg: janResCliBudg, feb_budg: febResCliBudg, mar_budg: marResCliBudg, apr_budg: aprResCliBudg,
                    may_budg: mayResCliBudg, jun_budg: junResCliBudg, jul_budg: julResCliBudg, aug_budg: augResCliBudg,
                    sep_budg: sepResCliBudg, oct_budg: octResCliBudg, nov_budg: novResCliBudg, dec_budg: decResCliBudg
                })
                const ResCtrClient = await newCntrCliResBudg.save()    

                res.redirect('/centers/' + centerCode + '/edit')

            } else {

                centerResBudgDet = await Center_budget_det.findOne({center: centerCode, loan_type: loanType, view_code: "ResClientCount"})

                if (isNull(centerResBudgDet)) { 
                    let newResCliBudg = new Center_budget_det({
                        region: yuser.region, area: yuser.area, branch: branchCode, unit: unitCode, po: poNumber, po_code: poCode, center: centerCode,
                        view_type: "PUH", loan_type: loanType, client_count_included: clientCountIncluded, view_code: "ResClientCount",
                        jan_budg: janResCliBudg, feb_budg: febResCliBudg, mar_budg: marResCliBudg, apr_budg: aprResCliBudg,
                        may_budg: mayResCliBudg, jun_budg: junResCliBudg, jul_budg: julResCliBudg, aug_budg: augResCliBudg,
                        sep_budg: sepResCliBudg, oct_budg: octResCliBudg, nov_budg: novResCliBudg, dec_budg: decResCliBudg
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
        res.redirect('/centers')
    }
  
  }) // END OF SAVING NEW TARGET - ORIGINGAL codes 


// Put EDITED TARGETS - ORIGINAL Codes
// In editing of a Target, it should be one Loan type per multiple edit, cannot be edited multi-loan type in one single EDIT
router.put('/saveEditTargets2/:id', authUser, authRole("PO", "BM"), async function(req, res){

    const centerCode = req.params.id
    const unit_ID = centerCode.substr(0,6)
    const yuser = req.user

    const idClient= req.body.idClient
    const numClient = req.body.numClient
    // const totalAmt = req.body.totAmt
    let loanTyp = ""
    let prevLoanTyp = ""
    let forSortTargets = []
    let sortedTargets = []
    let doneReadCenter = false

    let totNewCliSem1 = 0
    let totNewAmtSem1 = 0
    let totNewCliSem2 = 0
    let totNewAmtSem2 = 0

    let totOldCliSem1 = 0
    let totOldAmtSem1 = 0
    let totOldCliSem2 = 0
    let totOldAmtSem2 = 0

    let perLonTypSem1NewCli = 0
    let perLonTypSem1NewAmt = 0
    let perLonTypSem2NewCli = 0
    let perLonTypSem2NewAmt = 0

    let perLonTypSem1OldCli = 0
    let perLonTypSem1OldAmt = 0
    let perLonTypSem2OldCli = 0
    let perLonTypSem2OldAmt = 0

    let totBegBal1 = 0
    let totBegBal2 = 0

    let totResign1 = 0
    let totResign2 = 0

    let monthNewLoan1 = ""
    let monthNewLoan2 = ""
    let monthReLoan1 = ""
    let monthReLoan2 = ""
    let num_Client = 0
    let id_Client = ""

    let nowZeroTargetsLength = false
    let nowOneTargetsLength = false

    let poEditedTargPerLonTyp = []

    let hasChangesTarg = false
    let firstSemChanged = false
    let secondSemChanged = false
    let doneUpdating = false

    let cntrTargetView = []

    try {

        let ctrBegBalCli = 0
        let ctrBegBals = []

        const loanType = await Loan_type.find({})

        const fndCenter = await Center.findOne({center: centerCode}, function (err, foundCenter) {
            const ctrTargets = foundCenter.Targets
            ctrBegBals = foundCenter.Loan_beg_bal
            // console.log(foundCenter)
        })

        if (fndCenter) {

            fndCenter.Targets.forEach( list => {
                
                const _id = list._id
                const loan_type = list.loan_type
                const month = list.month
                const semester = list.semester
                const numClient = list.numClient
                const amount = list.amount
                const totAmount = list.totAmount
                const remarks = list.remarks
                const strAmount = _.toString(list.amount)
                let strLoanAmount = ""
                if (strAmount.length == 4 ) {
                   strLoanAmount = _.padStart(strAmount,5,'0')
                } else {
                   strLoanAmount = strAmount
                }

                // const sortKey = _.toString(list.dispView) + list.loan_type + _.toString(list.monthOrder) + list.remarks + strLoanAmount

                const sortKey = _.toString(list.dispView) + list.loan_type + semester + list.remarks + _.toString(list.monthOrder) + strLoanAmount

                const ctrBegBal = ctrBegBals.find(cBeg => cBeg.loan_type === loan_type)
                if (!ctrBegBal) {
                    ctrBegBalCli = 0
                } else {
                    ctrBegBalCli = ctrBegBal.beg_client_count
                }

                forSortTargets.push({_id: _id, sortKey: sortKey, loan_type: loan_type, begBal: ctrBegBalCli, month: month, semester: semester, numClient: numClient, amount: amount, totAmount: totAmount, remarks: remarks})

            }) 
            doneReadCenter = true

        }
    
        if (doneReadCenter) {
            sortedTargets = forSortTargets.sort( function (a,b) {
                if ( a.sortKey < b.sortKey ){
                    return -1;
                }
                if ( a.sortKey > b.sortKey ){
                    return 1;
                }
                return 0;
            })

            let idClientLen = 0

            if (sortedTargets.length == 1) {
                idClientLen = 1
            } else {
                idClientLen = sortedTargets.length
            }

            for(var i=0; i<idClientLen; i++) {  // Loop to SCAN all Targets regardless of Loan Type
                
                loanTyp = sortedTargets[i].loan_type
            
               const loanType = await Loan_type.findOne({title: loanTyp})
            
               const centerLoanTyp = loanType.loan_type
            
               if (i > 0){
                   if (loanTyp === prevLoanTyp) {
                       if (hasChangesTarg) {
            
                       } else {
            
                       }
            
                   } else {
                       if (hasChangesTarg) {
                           
                           // Save changes to center_budget_dets here...
            
                           totResign1 = totBegBal1 - totOldCliSem1
                           if (totOldCliSem2 > 0) {
                               totResign2 = totBegBal2 - totOldCliSem2
                           }
            
                           const totalResign = totResign1 + totResign2
                           
                           if (prevLoanTyp === "Group Loan") {
                               const ctrBudgDet = await Center.findOne({center: centerCode, loan_type: "Group Loan"}, function (err, fndOldCli) {
                                   // console.log(fndOldCli)
            
                                   fndOldCli.newClient = totNewCliSem1 + totNewCliSem2
                                   fndOldCli.newClientAmt = totNewAmtSem1 + totNewAmtSem2
                                   fndOldCli.oldClient = totOldCliSem1 + totOldCliSem2
                                   fndOldCli.oldClientAmt = totOldAmtSem1 + totOldAmtSem2
                                   fndOldCli.resClient = totResign1
                                   fndOldCli.resClient2 = totResign2
            
                                   fndOldCli.save()
                                   // To update newClient, NewClientAmt, oldClient, oldClientAmt, resClient, resClient2 in CENTER fields
                               })
            
                           }
            
                           if (totalResign >= 0) {
            
                               const ctrResBudgDet = await Center_budget_det.findOne({center: centerCode, loan_type: prevLoanTyp, view_code: "ResClientCount"}, function (err, fndResCli) {
            
                                   switch(monthReLoan1) {
                                       case "January": 
                                           fndResCli.jan_budg = totResign1
                                           break;
                                       case "February": 
                                           fndResCli.feb_budg = totResign1
                                           break;
                                       case "March": 
                                           fndResCli.mar_budg = totResign1
                                           break;
                                       case "April": 
                                           fndResCli.apr_budg = totResign1
                                           break;
                                       case "May": 
                                           fndResCli.may_budg = totResign1
                                           break;
                                       case "June": 
                                           fndResCli.jun_budg = totResign1
                                           break;
                                       default:
                                           orderMonth = 0
                                   }   
            
                                   switch(monthReLoan2) {
                                       case "July": 
                                           fndResCli.jul_budg = totResign2
                                           break;
                                       case "August": 
                                           fndResCli.aug_budg = totResign2
                                           break;
                                       case "September": 
                                           fndResCli.sep_budg = totResign2
                                           break;
                                       case "October": 
                                           fndResCli.oct_budg = totResign2
                                           break;
                                       case "November": 
                                           fndResCli.nov_budg = totResign2
                                           break;
                                       case "December": 
                                           fndResCli.dec_budg = totResign2
                                           break;
                                       default:
                                           orderMonth = 0
                                   }   
                                   if (!isNull(fndResCli)) {
                                       fndResCli.save()
                                   }
                               })
                           }
            
                           const totalOldCli = totOldCliSem1 + totOldCliSem2
            
                           if (totalOldCli >= 0) {
            
                               const ctrOldCliBudgDet = await Center_budget_det.findOne({center: centerCode, loan_type: prevLoanTyp, view_code: "OldLoanClient"}, function (err, fndOldCli) {
            
                                   switch(monthReLoan1) {
                                       case "January": 
                                           fndOldCli.jan_budg = totOldCliSem1
                                           break;
                                       case "February": 
                                           fndOldCli.feb_budg = totOldCliSem1
                                           break;
                                       case "March": 
                                           fndOldCli.mar_budg = totOldCliSem1
                                           break;
                                       case "April": 
                                           fndOldCli.apr_budg = totOldCliSem1
                                           break;
                                       case "May": 
                                           fndOldCli.may_budg = totOldCliSem1
                                           break;
                                       case "June": 
                                           fndOldCli.jun_budg = totOldCliSem1
                                           break;
                                       default:
                                           orderMonth = 0
                                   }   
            
                                   switch(monthReLoan2) {
                                       case "July": 
                                           fndOldCli.jul_budg = totOldCliSem2
                                           break;
                                       case "August": 
                                           fndOldCli.aug_budg = totOldCliSem2
                                           break;
                                       case "September": 
                                           fndOldCli.sep_budg = totOldCliSem2
                                           break;
                                       case "October": 
                                           fndOldCli.oct_budg = totOldCliSem2
                                           break;
                                       case "November": 
                                           fndOldCli.nov_budg = totOldCliSem2
                                           break;
                                       case "December": 
                                           fndOldCli.dec_budg = totOldCliSem2
                                           break;
                                       default:
                                           orderMonth = 0
                                   }   
            
                                   if (!isNull(fndOldCli)) {
                                       fndOldCli.save()
                                   }
                               })
                               // console.log(ctrOldCliBudgDet)
                           }
            
                           const totalOldAmt = totOldAmtSem1 + totOldAmtSem2
            
                           if (totalOldAmt >= 0) {
            
                               const ctrOldAmtBudgDet = await Center_budget_det.findOne({center: centerCode, loan_type: prevLoanTyp, view_code: "OldLoanAmt"}, function (err, fndOldAmt) {
            
                                   switch(monthReLoan1) {
                                       case "January": 
                                       fndOldAmt.jan_budg = totOldAmtSem1
                                           break;
                                       case "February": 
                                           fndOldAmt.feb_budg = totOldAmtSem1
                                           break;
                                       case "March": 
                                           fndOldAmt.mar_budg = totOldAmtSem1
                                           break;
                                       case "April": 
                                           fndOldAmt.apr_budg = totOldAmtSem1
                                           break;
                                       case "May": 
                                           fndOldAmt.may_budg = totOldAmtSem1
                                           break;
                                       case "June": 
                                           fndOldAmt.jun_budg = totOldAmtSem1
                                           break;
                                       default:
                                           orderMonth = 0
                                   }   
            
                                   switch(monthReLoan2) {
                                       case "July": 
                                           fndOldAmt.jul_budg = totOldAmtSem2
                                           break;
                                       case "August": 
                                           fndOldAmt.aug_budg = totOldAmtSem2
                                           break;
                                       case "September": 
                                           fndOldAmt.sep_budg = totOldAmtSem2
                                           break;
                                       case "October": 
                                           fndOldAmt.oct_budg = totOldAmtSem2
                                           break;
                                       case "November": 
                                           fndOldAmt.nov_budg = totOldAmtSem2
                                           break;
                                       case "December": 
                                           fndOldAmt.dec_budg = totOldAmtSem2
                                           break;
                                       default:
                                           orderMonth = 0
                                   }   
                                   if (!isNull(fndOldAmt)) {
                                       fndOldAmt.save()
                                   }
                               })
                           }
            
                           const totalNewCli = totNewCliSem1 + totNewCliSem2
            
                           if (totalNewCli >= 0) {
            
                               const ctrNewCliBudgDet = await Center_budget_det.findOne({center: centerCode, loan_type: prevLoanTyp, view_code: "NewLoanClient"}, function (err, fndNewCli) {
                                   const foundNewCli = fndNewCli
                                   // console.log(foundNewCli)
                                   switch(monthNewLoan1) {
                                       case "January": 
                                           fndNewCli.jan_budg = totNewCliSem1
                                           break;
                                       case "February": 
                                           fndNewCli.feb_budg = totNewCliSem1
                                           break;
                                       case "March": 
                                           fndNewCli.mar_budg = totNewCliSem1
                                           break;
                                       case "April": 
                                           fndNewCli.apr_budg = totNewCliSem1
                                           break;
                                       case "May": 
                                           fndNewCli.may_budg = totNewCliSem1
                                           break;
                                       case "June": 
                                           fndNewCli.jun_budg = totNewCliSem1
                                           break;
                                       default:
                                           orderMonth = 0
                                   }   
            
                                   switch(monthNewLoan2) {
                                       case "July": 
                                           fndNewCli.jul_budg = totNewCliSem2
                                           break;
                                       case "August": 
                                           fndNewCli.aug_budg = totNewCliSem2
                                           break;
                                       case "September": 
                                           fndNewCli.sep_budg = totNewCliSem2
                                           break;
                                       case "October": 
                                           fndNewCli.oct_budg = totNewCliSem2
                                           break;
                                       case "November": 
                                           fndNewCli.nov_budg = totNewCliSem2
                                           break;
                                       case "December": 
                                           fndNewCli.dec_budg = totNewCliSem2
                                           break;
                                       default:
                                           orderMonth = 0
                                   }   
                                   if (!isNull(fndNewCli)) {
                                       fndNewCli.save()
                                   }
                               })
                               // console.log(ctrNewCliBudgDet)
                           }
            
                           const totalNewAmt = totNewAmtSem1 + totNewAmtSem2
            
                           if (totalNewAmt >= 0) {
            
                               const ctrNewAmtBudgDet = await Center_budget_det.findOne({center: centerCode, loan_type: loanTyp, view_code: "NewLoanAmt"}, function (err, fndNewLoanAmt) {
                                   
                                   if (!isNull(fndNewLoanAmt)) {
                                       switch(monthNewLoan1) {
                                           case "January": 
                                               fndNewLoanAmt.jan_budg = totNewAmtSem1
                                               break;
                                           case "February": 
                                               fndNewLoanAmt.feb_budg = totNewAmtSem1
                                               break;
                                           case "March": 
                                               fndNewLoanAmt.mar_budg = totNewAmtSem1
                                               break;
                                           case "April": 
                                               fndNewLoanAmt.apr_budg = totNewAmtSem1
                                               break;
                                           case "May": 
                                               fndNewLoanAmt.may_budg = totNewAmtSem1
                                               break;
                                           case "June": 
                                               fndNewLoanAmt.jun_budg = totNewAmtSem1
                                               break;
                                           default:
                                               orderMonth = 0
                                       }   
            
                                       switch(monthNewLoan2) {
                                           case "July": 
                                               fndNewLoanAmt.jul_budg = totNewAmtSem2
                                               break;
                                           case "August": 
                                               fndNewLoanAmt.aug_budg = totNewAmtSem2
                                               break;
                                           case "September": 
                                               fndNewLoanAmt.sep_budg = totNewAmtSem2
                                               break;
                                           case "October": 
                                               fndNewLoanAmt.oct_budg = totNewAmtSem2
                                               break;
                                           case "November": 
                                               fndNewLoanAmt.nov_budg = totNewAmtSem2
                                               break;
                                           case "December": 
                                               fndNewLoanAmt.dec_budg = ftotNewAmtSem2
                                               break;
                                           default:
                                               orderMonth = 0
                                       }
            
                                       fndNewLoanAmt.save()
                                   }
                               })
                           }
            
                           // poEditedTargPerLonTyp.push({center: centerCode, centerLoanTyp: centerLoanTyp, loan_type: loanTyp, tNewCliSem1: totNewCliSem1, tNewAmtSem1: totNewAmtSem1, tNewCliSem2: totNewCliSem2, tNewAmtSem2: totNewAmtSem2,
                           //     tBegBal1: totBegBal1, tBegBal2: totBegBal2, tOldAmtSem1: totOldAmtSem1, tOldAmtSem2: totOldAmtSem2,
                           //     tOldCliSem1: totOldCliSem1, tOldCliSem2: totOldCliSem2, monthNewLoan1: monthNewLoan1, monthNewLoan2: monthNewLoan2, monthReLoan1: monthReLoan1, monthReLoan2: monthReLoan2})
                               
                           hasChangesTarg = false
                       }
            
                           totNewCliSem1 = 0
                           totNewAmtSem1 = 0
                           totNewCliSem2 = 0
                           totNewAmtSem2 = 0
                       
                           totOldCliSem1 = 0
                           totOldAmtSem1 = 0
                           totOldCliSem2 = 0
                           totOldAmtSem2 = 0
                                                                       
                           totBegBal1 = 0
                           totBegBal2 = 0
                       
                           monthNewLoan1 = ""
                           monthNewLoan2 = ""
                           monthReLoan1 = ""
                           monthReLoan2 = ""
                   
                   
                   }
               } else {
            
               }
            
               totBegBal1 = sortedTargets[i].begBal
               let targetClient = 0
            
               if (sortedTargets.length == 1) {
                   id_Client = idClient
                   num_Client = numClient
                   targetClient = _.toNumber(num_Client)
                   nowOneTargetsLength = true
            
               } else {
                   id_Client = idClient[i]
                   num_Client = numClient[i]
                   targetClient = _.toNumber(num_Client)
               }
            
               if (targetClient == sortedTargets[i].numClient) { // if TARGETS have no changes
            
                   if (sortedTargets[i].remarks === "New Loan") {       
            
                       if (sortedTargets[i].semester === "First Half") {
                           monthNewLoan1 = sortedTargets[i].month
            
                           totNewAmtSem1 = totNewAmtSem1 + sortedTargets[i].totAmount  // Total Amounts are included in center.newClientAmt
            
                           if ( loanTyp === "Group Loan" || loanTyp === "Agricultural Loan" || loanTyp === "Individual Loan - IMEP") {
            
                               totBegBal2 = totBegBal2 + sortedTargets[i].numClient
                               totNewCliSem1 = totNewCliSem1 + sortedTargets[i].numClient
            
                           } else { // Non-GLP Loan Products
            
                               perLonTypSem1NewCli = perLonTypSem1NewCli + sortedTargets[i].numClient
                               perLonTypSem1NewAmt = perLonTypSem1NewAmt + sortedTargets[i].totAmount
            
                           }
            
                       } else {
                           monthNewLoan2 = sortedTargets[i].month
            
                           totNewAmtSem2 = totNewAmtSem2 + sortedTargets[i].totAmount
            
                           if ( loanTyp === "Group Loan" || loanTyp === "Agricultural Loan" || loanTyp === "Individual Loan - IMEP") {
                               totNewCliSem2 = totNewCliSem2 + sortedTargets[i].numClient
            
                           } else { // Non-GLP Loan Products
                               perLonTypSem2NewCli = perLonTypSem2NewCli + sortedTargets[i].numClient
                               perLonTypSem2NewAmt = perLonTypSem2NewAmt + sortedTargets[i].totAmount
            
                           }
                       }
            
                   } else {
                       targOldClient = targetClient
            
                       if (sortedTargets[i].semester === "First Half") {
                           monthReLoan1 = sortedTargets[i].month
            
                           totBegBal2 = totBegBal2 + sortedTargets[i].numClient
                           totOldCliSem1 = totOldCliSem1 + sortedTargets[i].numClient
                           totOldAmtSem1 = totOldAmtSem1 + sortedTargets[i].totAmount
            
                           if ( loanTyp === "Group Loan" || loanTyp === "Agricultural Loan" || loanTyp === "Individual Loan - IMEP") {
            
                           } else { // Non-GLP Loan Products
                               perLonTypSem1OldCli = perLonTypSem1OldCli + sortedTargets[i].numClient
                               perLonTypSem1OldAmt = perLonTypSem1OldAmt + sortedTargets[i].totAmount
            
                           }
                       } else {
                           monthReLoan2 = sortedTargets[i].month
            
                           totOldCliSem2 = totOldCliSem2 + sortedTargets[i].numClient
                           totOldAmtSem2 = totOldAmtSem2 + sortedTargets[i].totAmount
            
                           if ( loanTyp === "Group Loan" || loanTyp === "Agricultural Loan" || loanTyp === "Individual Loan - IMEP") {
            
                           } else { // Non-GLP Loan Products
                               perLonTypSem2OldCli = perLonTypSem2OldCli + sortedTargets[i].numClient
                               perLonTypSem2OldAmt = perLonTypSem2OldAmt + sortedTargets[i].totAmount
            
                           }
                       }
                   }
            
               } else { // IF target has changes / modifications   
                   hasChangesTarg = true
                   loanTyp = sortedTargets[i].loan_type  
                   let totalAmt = targetClient * sortedTargets[i].amount
                   let targNewClient = 0
                   let targOldClient = 0
                   const totCliDiff = targetClient - sortedTargets[i].numClient
            
                   const targLength = sortedTargets.length
            
            
                   // let totBegBal2 = 0
                   if (targetClient == 0) {
                       nowZeroTargetsLength = true
                   }
            
                   if (sortedTargets[i].semester === "First Half") {
                       firstSemChanged = true
            
                       if(sortedTargets[i].remarks === "New Loan") {
                           monthNewLoan1 = sortedTargets[i].month
            
                           totBegBal2 = totBegBal2 + targetClient
            
                           totNewCliSem1 = totNewCliSem1 + targetClient
                           totNewAmtSem1 = totNewAmtSem1 + totalAmt
            
                       } else {
                           monthReLoan1 = sortedTargets[i].month
            
                           totBegBal2 = totBegBal2 + targetClient
            
                           totOldCliSem1 = totOldCliSem1 + targetClient
                           totOldAmtSem1 = totOldAmtSem1 + totalAmt
            
                       }
                   }
            
                   if (sortedTargets[i].semester === "Second Half") {
                       secondSemChanged = true
            
                       if(sortedTargets[i].remarks === "New Loan") {
            
                           monthNewLoan2 = sortedTargets[i].month
            
                           totNewCliSem2 = totNewCliSem2 + targetClient
                           totNewAmtSem2 = totNewAmtSem2 + totalAmt
            
                       } else {
                           targOldClient = targetClient
            
                           monthReLoan2 = sortedTargets[i].month
            
                           // totOldCliDiff2 = totOldCliDiff2 + totCliDiff
                           // totOldAmtDiff2 = totOldAmtDiff2 + (totCliDiff * sortedTargets[i].amount)
            
                           totOldCliSem2 = totOldCliSem2 + targetClient
                           totOldAmtSem2 = totOldAmtSem2 + totalAmt
            
                       }
                   }
            
                    // Delete Target if target Client is ZERO-0
                   if (targetClient == 0) {
                       const totalTargClients = totNewCliSem1 + totNewCliSem2 + totOldCliSem1 + totOldCliSem2
                       const center = await Center.findOneAndUpdate({center: centerCode}, {$pull: {Targets :{_id: id_Client }}})
            
                       // Saving changes into center_budget_dets table 
                       let targetRemarks = sortedTargets[i].remarks 
                       let cntrTargClient = sortedTargets[i].numClient
                       let monthToChange = sortedTargets[i].month
                       let cntrViewCode1 = ""
                       let cntrViewCode2 = ""
                       
                       if (targetRemarks === "New Loan") {
                           cntrViewCode1 = "NewLoanClient"
                           cntrViewCode2 = "NewLoanAmt"
                               
                       } else {  // Re-loan
                           cntrViewCode1 = "OldLoanClient"
                           cntrViewCode2 = "OldLoanAmt"
                       }
                       const cntrBudgDet = await Center_budget_det.findOne({"center": centerCode, view_code: cntrViewCode1, loan_type:loanTyp}, function (err, cntrForChange) {
            
                           switch(monthToChange) {
                               case "January": 
                                   cntrForChange.jan_budg = cntrForChange.jan_budg - cntrTargClient
                                   break;
                               case "February": 
                                   cntrForChange.feb_budg = cntrForChange.feb_budg - cntrTargClient
                                   break;
                               case "March": 
                                   cntrForChange.mar_budg = cntrForChange.mar_budg - cntrTargClient
                                   break;
                               case "April": 
                                   cntrForChange.apr_budg = cntrForChange.apr_budg - cntrTargClient
                                   break;
                               case "May": 
                                   cntrForChange.may_budg = cntrForChange.may_budg - cntrTargClient
                                   break;
                               case "June": 
                                   cntrForChange.jun_budg = cntrForChange.jun_budg - cntrTargClient
                                   break;
                               case "July": 
                                   cntrForChange.jul_budg = cntrForChange.jul_budg - cntrTargClient
                                   break;
                               case "August": 
                                   cntrForChange.aug_budg = cntrForChange.aug_budg - cntrTargClient
                                   break;
                               case "September": 
                                   cntrForChange.sep_budg = cntrForChange.sep_budg - cntrTargClient
                                   break;
                               case "October": 
                                   cntrForChange.oct_budg = cntrForChange.oct_budg - cntrTargClient
                                   break;
                               case "November": 
                                   cntrForChange.nov_budg = cntrForChange.nov_budg - cntrTargClient
                                   break;
                               case "December": 
                                   cntrForChange.dec_budg = cntrForChange.dec_budg - cntrTargClient
                                   break;
                               default:
                                   orderMonth = 0
                               }   
                               cntrForChange.save()
                       })
            
                       const cntr2BudgDet = await Center_budget_det.findOne({"center": centerCode, view_code: cntrViewCode2, loan_type:loanTyp}, function (err, cntrForChange2) {
                           if (!isNull(cntrForChange2)) {
                               switch(monthToChange) {
                                   case "January": 
                                       cntrForChange2.jan_budg = cntrForChange2.jan_budg - totalAmt
                                       break;
                                   case "February": 
                                       cntrForChange2.feb_budg = cntrForChange2.feb_budg - totalAmt
                                       break;
                                   case "March": 
                                       cntrForChange2.mar_budg = cntrForChange2.mar_budg - totalAmt
                                       break;
                                   case "April": 
                                       cntrForChange2.apr_budg = cntrForChange2.apr_budg - totalAmt
                                       break;
                                   case "May": 
                                       cntrForChange2.may_budg = cntrForChange2.may_budg - totalAmt
                                       break;
                                   case "June": 
                                       cntrForChange2.jun_budg = cntrForChange2.jun_budg - totalAmt
                                       break;
                                   case "July": 
                                       cntrForChange2.jul_budg = cntrForChange2.jul_budg - totalAmt
                                       break;
                                   case "August": 
                                       cntrForChange2.aug_budg = cntrForChange2.aug_budg - totalAmt
                                       break;
                                   case "September": 
                                       cntrForChange2.sep_budg = cntrForChange2.sep_budg - totalAmt
                                       break;
                                   case "October": 
                                       cntrForChange2.oct_budg = cntrForChange2.oct_budg - totalAmt
                                       break;
                                   case "November": 
                                       cntrForChange2.nov_budg = cntrForChange2.nov_budg - totalAmt
                                       break;
                                   case "December": 
                                       cntrForChange2.dec_budg = cntrForChange2.dec_budg - totalAmt
                                       break;
                                   default:
                                       orderMonth = 0
                                   }   
                                   cntrForChange2.save()
            
                           }
                       })
            
            
                       if ((targLength == 1) || (totalTargClients == 0 && i > 0) ) {
            
                           if (loanTyp === "Group Loan" || loanTyp === "Agricultural Loan" || loanTyp === "Individual Loan - IMEP") {
            
                               const curResTarcenter =  await Center.findOneAndUpdate({"center": centerCode}, {$set:{"newClient": 0, "newClientAmt": 0, "oldClient": 0, "oldClientAmt": 0, "resClient":0, "resClient2":0 }})
                                                       
                           }
            
                           const ctrResCliBudgDet = await Center_budget_det.findOne({center: centerCode, loan_type: loanTyp, view_code: "ResClientCount"}, function (err, fndResCli) {
            
                               if (!isNull(fndResCli)) {
                                   fndResCli.jan_budg = 0
                                   fndResCli.feb_budg = 0
                                   fndResCli.mar_budg = 0
                                   fndResCli.apr_budg = 0
                                   fndResCli.may_budg = 0
                                   fndResCli.jun_budg = 0
                                   fndResCli.jul_budg = 0
                                   fndResCli.aug_budg = 0
                                   fndResCli.sep_budg = 0
                                   fndResCli.oct_budg = 0
                                   fndResCli.nov_budg = 0
                                   fndResCli.dec_budg = 0
            
                                   fndResCli.save()
                               }
                           })
            
                           const ctrOldCliBudgDet = await Center_budget_det.findOne({center: centerCode, loan_type: loanTyp, view_code: "OldLoanClient"}, function (err, fndOldCli) {
                               
                               if (!isNull(fndOldCli)) {
                                   fndOldCli.jan_budg = 0
                                   fndOldCli.feb_budg = 0
                                   fndOldCli.mar_budg = 0
                                   fndOldCli.apr_budg = 0
                                   fndOldCli.may_budg = 0
                                   fndOldCli.jun_budg = 0
                                   fndOldCli.jul_budg = 0
                                   fndOldCli.aug_budg = 0
                                   fndOldCli.sep_budg = 0
                                   fndOldCli.oct_budg = 0
                                   fndOldCli.nov_budg = 0
                                   fndOldCli.dec_budg = 0
            
                                   fndOldCli.save()
                               }
                          })
            
                           const ctrOldAmtBudgDet = await Center_budget_det.findOne({center: centerCode, loan_type: loanTyp, view_code: "OldLoanAmt"}, function (err, fndOldAmt) {
            
            
                               if (!isNull(fndOldAmt)) {
                                 fndOldAmt.jan_budg = 0
                                   fndOldAmt.feb_budg = 0
                                   fndOldAmt.mar_budg = 0
                                   fndOldAmt.apr_budg = 0
                                   fndOldAmt.may_budg = 0
                                   fndOldAmt.jun_budg = 0
                                   fndOldAmt.jul_budg = 0
                                   fndOldAmt.aug_budg = 0
                                   fndOldAmt.sep_budg = 0
                                   fndOldAmt.oct_budg = 0
                                   fndOldAmt.nov_budg = 0
                                   fndOldAmt.dec_budg = 0
            
                                   fndOldAmt.save()
                               }
                           })
            
                           const ctrNewCliBudgDet = await Center_budget_det.findOne({center: centerCode, loan_type: loanTyp, view_code: "NewLoanClient"}, function (err, fndNewCli) {
            
                               if (!isNull(fndNewCli)) {
                                   fndNewCli.jan_budg = 0
                                   fndNewCli.feb_budg = 0
                                   fndNewCli.mar_budg = 0
                                   fndNewCli.apr_budg = 0
                                   fndNewCli.may_budg = 0
                                   fndNewCli.jun_budg = 0
                                   fndNewCli.jul_budg = 0
                                   fndNewCli.aug_budg = 0
                                   fndNewCli.sep_budg = 0
                                   fndNewCli.oct_budg = 0
                                   fndNewCli.nov_budg = 0
                                   fndNewCli.dec_budg = 0
            
                                   fndNewCli.save()
                               }
                           })
            
                           const ctrNewAmtBudgDet = await Center_budget_det.findOne({center: centerCode, loan_type: loanTyp, view_code: "NewLoanAmt"}, function (err, fndNewAmt) {
            
                               if (!isNull(fndNewAmt)) {
                                   fndNewAmt.jan_budg = 0
                                   fndNewAmt.feb_budg = 0
                                   fndNewAmt.mar_budg = 0
                                   fndNewAmt.apr_budg = 0
                                   fndNewAmt.may_budg = 0
                                   fndNewAmt.jun_budg = 0
                                   fndNewAmt.jul_budg = 0
                                   fndNewAmt.aug_budg = 0
                                   fndNewAmt.sep_budg = 0
                                   fndNewAmt.oct_budg = 0
                                   fndNewAmt.nov_budg = 0
                                   fndNewAmt.dec_budg = 0
            
                                   fndNewAmt.save()
                               }
                           })
                       } 
            
            
                   } else {
            
                       const curResTarcenter =  await Center.findOneAndUpdate({"center": centerCode}, 
                           {$set: {"Targets.$[el].numClient": targetClient, "Targets.$[el].totAmount": totalAmt, "Targets.$[el].newClient": targNewClient, "Targets.$[el].oldClient": targOldClient}}, 
                           {arrayFilters: [{"el._id": id_Client }]}, function(err, foundResList){
                       
                           // console.log(foundResList)
                       })
            
                       let clientDiffSem1 = totNewCliSem1 - totOldCliSem1
                       let clientDiffSem2 = totNewCliSem2 - totOldCliSem2
            
                       let amountDiffSem1 = totNewAmtSem1 - totOldAmtSem1
                       let amountDiffSem2 = totNewAmtSem2 - totOldAmtSem2
            
                       const totalResign = totResign1 + totResign2
            
                       // if (totalResign >= 0) {
            
                       //     const ctrResBudgDet = await Center_budget_det.findOne({center: centerCode, loan_type: loanTyp, view_code: "ResClientCount"}, function (err, fndResCli) {
            
                       //         switch(monthReLoan1) {
                       //             case "January": 
                       //                 fndResCli.jan_budg = totResign1
                       //                 break;
                       //             case "February": 
                       //                 fndResCli.feb_budg = totResign1
                       //                 break;
                       //             case "March": 
                       //                 fndResCli.mar_budg = totResign1
                       //                 break;
                       //             case "April": 
                       //                 fndResCli.apr_budg = totResign1
                       //                 break;
                       //             case "May": 
                       //                 fndResCli.may_budg = totResign1
                       //                 break;
                       //             case "June": 
                       //                 fndResCli.jun_budg = totResign1
                       //                 break;
                       //             default:
                       //                 orderMonth = 0
                       //         }   
            
                       //         switch(monthReLoan2) {
                       //             case "July": 
                       //                 fndResCli.jul_budg = totResign2
                       //                 break;
                       //             case "August": 
                       //                 fndResCli.aug_budg = totResign2
                       //                 break;
                       //             case "September": 
                       //                 fndResCli.sep_budg = totResign2
                       //                 break;
                       //             case "October": 
                       //                 fndResCli.oct_budg = totResign2
                       //                 break;
                       //             case "November": 
                       //                 fndResCli.nov_budg = totResign2
                       //                 break;
                       //             case "December": 
                       //                 fndResCli.dec_budg = totResign2
                       //                 break;
                       //             default:
                       //                 orderMonth = 0
                       //         }   
                       //         if (!isNull(fndResCli)) {
                       //             fndResCli.save()
                       //         }
                       //     })
                       // }
            
                       const totalOldCli = totOldCliSem1 + totOldCliSem2
            
                       // if (totalOldCli >= 0) {
            
                       //     const ctrOldCliBudgDet = await Center_budget_det.findOne({center: centerCode, loan_type: loanTyp, view_code: "OldLoanClient"}, function (err, fndOldCli) {
            
                       //         switch(monthReLoan1) {
                       //             case "January": 
                       //                 fndOldCli.jan_budg = totOldCliSem1
                       //                 break;
                       //             case "February": 
                       //                 fndOldCli.feb_budg = totOldCliSem1
                       //                 break;
                       //             case "March": 
                       //                 fndOldCli.mar_budg = totOldCliSem1
                       //                 break;
                       //             case "April": 
                       //                 fndOldCli.apr_budg = totOldCliSem1
                       //                 break;
                       //             case "May": 
                       //                 fndOldCli.may_budg = totOldCliSem1
                       //                 break;
                       //             case "June": 
                       //                 fndOldCli.jun_budg = totOldCliSem1
                       //                 break;
                       //             default:
                       //                 orderMonth = 0
                       //         }   
            
                       //         switch(monthReLoan2) {
                       //             case "July": 
                       //                 fndOldCli.jul_budg = totOldCliSem2
                       //                 break;
                       //             case "August": 
                       //                 fndOldCli.aug_budg = totOldCliSem2
                       //                 break;
                       //             case "September": 
                       //                 fndOldCli.sep_budg = totOldCliSem2
                       //                 break;
                       //             case "October": 
                       //                 fndOldCli.oct_budg = totOldCliSem2
                       //                 break;
                       //             case "November": 
                       //                 fndOldCli.nov_budg = totOldCliSem2
                       //                 break;
                       //             case "December": 
                       //                 fndOldCli.dec_budg = totOldCliSem2
                       //                 break;
                       //             default:
                       //                 orderMonth = 0
                       //         }   
            
                       //         if (!isNull(fndOldCli)) {
                       //             fndOldCli.save()
                       //         }
                       //     })
                       //     // console.log(ctrOldCliBudgDet)
                       // }
            
                       const totalOldAmt = totOldAmtSem1 + totOldAmtSem2
            
                       // if (totalOldAmt >= 0) {
            
                       //     const ctrOldAmtBudgDet = await Center_budget_det.findOne({center: centerCode, loan_type: loanTyp, view_code: "OldLoanAmt"}, function (err, fndOldAmt) {
            
                       //         switch(monthReLoan1) {
                       //             case "January": 
                       //             fndOldAmt.jan_budg = totOldAmtSem1
                       //                 break;
                       //             case "February": 
                       //                 fndOldAmt.feb_budg = totOldAmtSem1
                       //                 break;
                       //             case "March": 
                       //                 fndOldAmt.mar_budg = totOldAmtSem1
                       //                 break;
                       //             case "April": 
                       //                 fndOldAmt.apr_budg = totOldAmtSem1
                       //                 break;
                       //             case "May": 
                       //                 fndOldAmt.may_budg = totOldAmtSem1
                       //                 break;
                       //             case "June": 
                       //                 fndOldAmt.jun_budg = totOldAmtSem1
                       //                 break;
                       //             default:
                       //                 orderMonth = 0
                       //         }   
            
                       //         switch(monthReLoan2) {
                       //             case "July": 
                       //                 fndOldAmt.jul_budg = totOldAmtSem2
                       //                 break;
                       //             case "August": 
                       //                 fndOldAmt.aug_budg = totOldAmtSem2
                       //                 break;
                       //             case "September": 
                       //                 fndOldAmt.sep_budg = totOldAmtSem2
                       //                 break;
                       //             case "October": 
                       //                 fndOldAmt.oct_budg = totOldAmtSem2
                       //                 break;
                       //             case "November": 
                       //                 fndOldAmt.nov_budg = totOldAmtSem2
                       //                 break;
                       //             case "December": 
                       //                 fndOldAmt.dec_budg = totOldAmtSem2
                       //                 break;
                       //             default:
                       //                 orderMonth = 0
                       //         }   
                       //         if (!isNull(fndOldAmt)) {
                       //             fndOldAmt.save()
                       //         }
                       //     })
                       // }
            
                       const totalNewCli = totNewCliSem1 + totNewCliSem2
            
                       // if (totalNewCli >= 0) {
            
                       //     const ctrNewCliBudgDet = await Center_budget_det.findOne({center: centerCode, loan_type: loanTyp, view_code: "NewLoanClient"}, function (err, fndNewCli) {
                       //         const foundNewCli = fndNewCli
                       //         // console.log(foundNewCli)
                       //         switch(monthNewLoan1) {
                       //             case "January": 
                       //                 fndNewCli.jan_budg = totNewCliSem1
                       //                 break;
                       //             case "February": 
                       //                 fndNewCli.feb_budg = totNewCliSem1
                       //                 break;
                       //             case "March": 
                       //                 fndNewCli.mar_budg = totNewCliSem1
                       //                 break;
                       //             case "April": 
                       //                 fndNewCli.apr_budg = totNewCliSem1
                       //                 break;
                       //             case "May": 
                       //                 fndNewCli.may_budg = totNewCliSem1
                       //                 break;
                       //             case "June": 
                       //                 fndNewCli.jun_budg = totNewCliSem1
                       //                 break;
                       //             default:
                       //                 orderMonth = 0
                       //         }   
            
                       //         switch(monthNewLoan2) {
                       //             case "July": 
                       //                 fndNewCli.jul_budg = totNewCliSem2
                       //                 break;
                       //             case "August": 
                       //                 fndNewCli.aug_budg = totNewCliSem2
                       //                 break;
                       //             case "September": 
                       //                 fndNewCli.sep_budg = totNewCliSem2
                       //                 break;
                       //             case "October": 
                       //                 fndNewCli.oct_budg = totNewCliSem2
                       //                 break;
                       //             case "November": 
                       //                 fndNewCli.nov_budg = totNewCliSem2
                       //                 break;
                       //             case "December": 
                       //                 fndNewCli.dec_budg = totNewCliSem2
                       //                 break;
                       //             default:
                       //                 orderMonth = 0
                       //         }   
                       //         if (!isNull(fndNewCli)) {
                       //             fndNewCli.save()
                       //         }
                       //     })
                       //     // console.log(ctrNewCliBudgDet)
                       // }
            
                       const totalNewAmt = totNewAmtSem1 + totNewAmtSem2
            
                       // if (totalNewAmt >= 0) {
            
                       //     const ctrNewAmtBudgDet = await Center_budget_det.findOne({center: centerCode, loan_type: loanTyp, view_code: "NewLoanAmt"}, function (err, fndNewLoanAmt) {
            
                       //         switch(monthNewLoan1) {
                       //             case "January": 
                       //                 fndNewLoanAmt.jan_budg = totNewAmtSem1
                       //                 break;
                       //             case "February": 
                       //                 fndNewLoanAmt.feb_budg = totNewAmtSem1
                       //                 break;
                       //             case "March": 
                       //                 fndNewLoanAmt.mar_budg = totNewAmtSem1
                       //                 break;
                       //             case "April": 
                       //                 fndNewLoanAmt.apr_budg = totNewAmtSem1
                       //                 break;
                       //             case "May": 
                       //                 fndNewLoanAmt.may_budg = totNewAmtSem1
                       //                 break;
                       //             case "June": 
                       //                 fndNewLoanAmt.jun_budg = totNewAmtSem1
                       //                 break;
                       //             default:
                       //                 orderMonth = 0
                       //         }   
            
                       //         switch(monthNewLoan2) {
                       //             case "July": 
                       //                 fndNewLoanAmt.jul_budg = totNewAmtSem2
                       //                 break;
                       //             case "August": 
                       //                 fndNewLoanAmt.aug_budg = totNewAmtSem2
                       //                 break;
                       //             case "September": 
                       //                 fndNewLoanAmt.sep_budg = totNewAmtSem2
                       //                 break;
                       //             case "October": 
                       //                 fndNewLoanAmt.oct_budg = totNewAmtSem2
                       //                 break;
                       //             case "November": 
                       //                 fndNewLoanAmt.nov_budg = totNewAmtSem2
                       //                 break;
                       //             case "December": 
                       //                 fndNewLoanAmt.dec_budg = ftotNewAmtSem2
                       //                 break;
                       //             default:
                       //                 orderMonth = 0
                       //         }
                       //         if (!isNull(fndNewLoanAmt)) {
                       //             fndNewLoanAmt.save()
                       //         }
                       //     })
                       // }
            
                   }
                   // hasChangesTarg = false
               }
            
               prevLoanTyp = sortedTargets[i].loan_type
            
               let totalNewClient = 0
            
                   if (i == (idClientLen - 1) && hasChangesTarg) {
            
                       //MAKE THE SAVING OF THE CHANGES in center_budget_dets here...
                       totResign1 = totBegBal1 - totOldCliSem1
                       if (totOldCliSem2 > 0) {
                           totResign2 = totBegBal2 - totOldCliSem2
                       }
                       let totalNewCli = 0
                       let totalNewAmt = 0
            
                       const totalResign = totResign1 + totResign2
                       totalNewClient = totNewCliSem1 + totNewCliSem2
            
                       const ctrBudgDet = await Center.findOne({center: centerCode, loan_type: "Group Loan"}, function (err, fndOldCli) {
                           const fondCenter = fndOldCli
            
                           fondCenter.newClient = totalNewClient //TypeError: Cannot set property 'newClient' of null
                               // Cause of error is, loan_type === "GLP", it should be "Group Loan"
                           fondCenter.newClientAmt = totNewAmtSem1 + totNewAmtSem2
                           fondCenter.oldClient = totOldCliSem1 + totOldCliSem2
                           fondCenter.oldClientAmt = totOldAmtSem1 + totOldAmtSem2
                           fondCenter.resClient = totResign1
                           fondCenter.resClient2 = totResign2
            
                           fondCenter.save()
                           // To update newClient, NewClientAmt, oldClient, oldClientAmt, resClient, resClient2 in CENTER fields
                       })
            
                       if (totalResign >= 0) {
            
                           const ctrResBudgDet = await Center_budget_det.findOne({center: centerCode, loan_type: loanTyp, view_code: "ResClientCount"}, function (err, fndResCli) {
            
                               switch(monthReLoan1) {
                                   case "January": 
                                       fndResCli.jan_budg = totResign1
                                       break;
                                   case "February": 
                                       fndResCli.feb_budg = totResign1
                                       break;
                                   case "March": 
                                       fndResCli.mar_budg = totResign1
                                       break;
                                   case "April": 
                                       fndResCli.apr_budg = totResign1
                                       break;
                                   case "May": 
                                       fndResCli.may_budg = totResign1
                                       break;
                                   case "June": 
                                       fndResCli.jun_budg = totResign1
                                       break;
                                   default:
                                       orderMonth = 0
                               }   
            
                               switch(monthReLoan2) {
                                   case "July": 
                                       fndResCli.jul_budg = totResign2
                                       break;
                                   case "August": 
                                       fndResCli.aug_budg = totResign2
                                       break;
                                   case "September": 
                                       fndResCli.sep_budg = totResign2
                                       break;
                                   case "October": 
                                       fndResCli.oct_budg = totResign2
                                       break;
                                   case "November": 
                                       fndResCli.nov_budg = totResign2
                                       break;
                                   case "December": 
                                       fndResCli.dec_budg = totResign2
                                       break;
                                   default:
                                       orderMonth = 0
                               }   
                               if (!isNull(fndResCli)) {
                                   fndResCli.save()
                               }
                           })
                       }
            
                       const totalOldCli = totOldCliSem1 + totOldCliSem2
            
                       if (totalOldCli >= 0) {
            
                           const ctrOldCliBudgDet = await Center_budget_det.findOne({center: centerCode, loan_type: loanTyp, view_code: "OldLoanClient"}, function (err, fndOldCli) {
            
                               switch(monthReLoan1) {
                                   case "January": 
                                       fndOldCli.jan_budg = totOldCliSem1
                                       break;
                                   case "February": 
                                       fndOldCli.feb_budg = totOldCliSem1
                                       break;
                                   case "March": 
                                       fndOldCli.mar_budg = totOldCliSem1
                                       break;
                                   case "April": 
                                       fndOldCli.apr_budg = totOldCliSem1
                                       break;
                                   case "May": 
                                       fndOldCli.may_budg = totOldCliSem1
                                       break;
                                   case "June": 
                                       fndOldCli.jun_budg = totOldCliSem1
                                       break;
                                   default:
                                       orderMonth = 0
                               }   
            
                               switch(monthReLoan2) {
                                   case "July": 
                                       fndOldCli.jul_budg = totOldCliSem2
                                       break;
                                   case "August": 
                                       fndOldCli.aug_budg = totOldCliSem2
                                       break;
                                   case "September": 
                                       fndOldCli.sep_budg = totOldCliSem2
                                       break;
                                   case "October": 
                                       fndOldCli.oct_budg = totOldCliSem2
                                       break;
                                   case "November": 
                                       fndOldCli.nov_budg = totOldCliSem2
                                       break;
                                   case "December": 
                                       fndOldCli.dec_budg = totOldCliSem2
                                       break;
                                   default:
                                       orderMonth = 0
                               }   
            
                               if (!isNull(fndOldCli)) {
                                   fndOldCli.save()
                               }
                           })
                           // console.log(ctrOldCliBudgDet)
                       }
            
                       const totalOldAmt = totOldAmtSem1 + totOldAmtSem2
            
                       if (totalOldAmt >= 0) {
            
                           const ctrOldAmtBudgDet = await Center_budget_det.findOne({center: centerCode, loan_type: loanTyp, view_code: "OldLoanAmt"}, function (err, fndOldAmt) {
            
                               switch(monthReLoan1) {
                                   case "January": 
                                       fndOldAmt.jan_budg = totOldAmtSem1
                                       break;
                                   case "February": 
                                       fndOldAmt.feb_budg = totOldAmtSem1
                                       break;
                                   case "March": 
                                       fndOldAmt.mar_budg = totOldAmtSem1
                                       break;
                                   case "April": 
                                       fndOldAmt.apr_budg = totOldAmtSem1
                                       break;
                                   case "May": 
                                       fndOldAmt.may_budg = totOldAmtSem1
                                       break;
                                   case "June": 
                                       fndOldAmt.jun_budg = totOldAmtSem1
                                       break;
                                   default:
                                       orderMonth = 0
                               }   
            
                               switch(monthReLoan2) {
                                   case "July": 
                                       fndOldAmt.jul_budg = totOldAmtSem2
                                       break;
                                   case "August": 
                                       fndOldAmt.aug_budg = totOldAmtSem2
                                       break;
                                   case "September": 
                                       fndOldAmt.sep_budg = totOldAmtSem2
                                       break;
                                   case "October": 
                                       fndOldAmt.oct_budg = totOldAmtSem2
                                       break;
                                   case "November": 
                                       fndOldAmt.nov_budg = totOldAmtSem2
                                       break;
                                   case "December": 
                                       fndOldAmt.dec_budg = totOldAmtSem2
                                       break;
                                   default:
                                       orderMonth = 0
                               }   
                               if (!isNull(fndOldAmt)) {
                                   fndOldAmt.save()
                               }
                           })
                       }
            
                       totalNewCli = totNewCliSem1 + totNewCliSem2
            
                       if (totalNewCli >= 0) {
            
                           const ctrNewCliBudgDet = await Center_budget_det.findOne({center: centerCode, loan_type: loanTyp, view_code: "NewLoanClient"}, function (err, fndNewCli) {
                               const foundNewCli = fndNewCli
                               // console.log(foundNewCli)
                               switch(monthNewLoan1) {
                                   case "January": 
                                       fndNewCli.jan_budg = totNewCliSem1
                                       break;
                                   case "February": 
                                       fndNewCli.feb_budg = totNewCliSem1
                                       break;
                                   case "March": 
                                       fndNewCli.mar_budg = totNewCliSem1
                                       break;
                                   case "April": 
                                       fndNewCli.apr_budg = totNewCliSem1
                                       break;
                                   case "May": 
                                       fndNewCli.may_budg = totNewCliSem1
                                       break;
                                   case "June": 
                                       fndNewCli.jun_budg = totNewCliSem1
                                       break;
                                   default:
                                       orderMonth = 0
                               }   
            
                               switch(monthNewLoan2) {
                                   case "July": 
                                       fndNewCli.jul_budg = totNewCliSem2
                                       break;
                                   case "August": 
                                       fndNewCli.aug_budg = totNewCliSem2
                                       break;
                                   case "September": 
                                       fndNewCli.sep_budg = totNewCliSem2
                                       break;
                                   case "October": 
                                       fndNewCli.oct_budg = totNewCliSem2
                                       break;
                                   case "November": 
                                       fndNewCli.nov_budg = totNewCliSem2
                                       break;
                                   case "December": 
                                       fndNewCli.dec_budg = totNewCliSem2
                                       break;
                                   default:
                                       orderMonth = 0
                               }   
                               if (!isNull(fndNewCli)) {
                                   fndNewCli.save()
                               }
                           })
                           // console.log(ctrNewCliBudgDet)
                       }
            
                       totalNewAmt = totNewAmtSem1 + totNewAmtSem2
            
                       if (totalNewAmt >= 0) {
            
                           const ctrNewAmtBudgDet = await Center_budget_det.findOne({center: centerCode, loan_type: loanTyp, view_code: "NewLoanAmt"}, function (err, fndNewLoanAmt) {
                               if (!isNull(fndNewLoanAmt)) {
                                   switch(monthNewLoan1) {
                                       case "January": 
                                           fndNewLoanAmt.jan_budg = totNewAmtSem1
                                           break;
                                       case "February": 
                                           fndNewLoanAmt.feb_budg = totNewAmtSem1
                                           break;
                                       case "March": 
                                           fndNewLoanAmt.mar_budg = totNewAmtSem1
                                           break;
                                       case "April": 
                                           fndNewLoanAmt.apr_budg = totNewAmtSem1
                                           break;
                                       case "May": 
                                           fndNewLoanAmt.may_budg = totNewAmtSem1
                                           break;
                                       case "June": 
                                           fndNewLoanAmt.jun_budg = totNewAmtSem1
                                           break;
                                       default:
                                           orderMonth = 0
                                   }   
            
                                   switch(monthNewLoan2) {
                                       case "July": 
                                           fndNewLoanAmt.jul_budg = totNewAmtSem2
                                           break;
                                       case "August": 
                                           fndNewLoanAmt.aug_budg = totNewAmtSem2
                                           break;
                                       case "September": 
                                           fndNewLoanAmt.sep_budg = totNewAmtSem2
                                           break;
                                       case "October": 
                                           fndNewLoanAmt.oct_budg = totNewAmtSem2
                                           break;
                                       case "November": 
                                           fndNewLoanAmt.nov_budg = totNewAmtSem2
                                           break;
                                       case "December": 
                                           fndNewLoanAmt.dec_budg = totNewAmtSem2
                                           break;
                                       default:
                                           orderMonth = 0
                                   }
                                   fndNewLoanAmt.save()    
                               }
                           })
                       }
            
                   }
            }
            
               // const ip = (req.headers['x-forwarded-for'] || req.connection.remoteAddress)
               // console.log(ip) // ip address of the user
               // console.log(lookup(ip)) // location of the user
            
               // let loggedUser = new User_log({
               //   IP: ip,
               //   login_date: new Date(),
               //   user_name: req.user.name,
               //   assign_code: req.user.assCode,
               //   activity: "Changed a Target",
               //   activity_desc: "Made Changes in a Target" + centerCode,
               // })
               //   const saveLogUser = loggedUser.save()
                       
            }
            
            if (req.user.role === "BM") {
            res.redirect('/branches/perPOforEdit/' + req.user.assCode)
            } else {
            res.redirect('/centers/viewTarget/' + centerCode)
            // res.redirect('/centers/viewTarget/' + centerCode)
            }
            console.log(numClient)
            // alert(Success )

    } catch(err) {
        console.log(err)
        res.redirect('/centers')
    }
})



function setProject(req, res, next) {
    const projectId = parseInt(req.params.projectId)
    req.project = projects.find(project => project.id === projectId)
    
    if (req.project == null) {
      res.status(404)
      return res.send('Project not found')
    }
    next()
  }
  
  function authGetProject(req, res, next) {
    //   console.log(req.user.role)
    if (req.user.role === "PO") {
        next()
      } else {
        res.status(401)
        return res.send('Not Allowed')  
    }
  }
  
module.exports = router

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

// // console.log(viewPOCode)
// let poVSum = []

//                 poSumView.push({title: "NEW LOAN CLIENTS", sortkey: 19, group: 2, isTitle: true})
//                 poSumView.push({title: "NEW LOAN AMOUNTS", sortkey: 20, group: 1, isTitle: true})
//                 poSumView.push({title: "OLD LOAN CLIENTS", sortkey: 21, group: 2, isTitle: true})
//                 poSumView.push({title: "OLD LOAN AMOUNTS", sortkey: 22, group: 1, isTitle: true})
//                 poSumView.push({title: "RESIGN CLIENTS", sortkey: 23, group: 2, isTitle: true})

//                 // Accessing loan_types .. Displaying figures in a per Loan Type..
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
//                                 poSumView.push({title: typeLoanDet + " - NLC", desc: "newLoanClient", sortkey: 19, group: 2, isTitle: false, jan_value : jan_detNewtotCli, feb_value : feb_detNewtotCli, mar_value : mar_detNewtotCli, apr_value : apr_detNewtotCli,
//                                     may_value : may_detNewtotCli, jun_value : jun_detNewtotCli, jul_value : jul_detNewtotCli, aug_value : aug_detNewtotCli,
//                                     sep_value : sep_detNewtotCli, oct_value : oct_detNewtotCli, nov_value : nov_detNewtotCli, dec_value : dec_detNewtotCli 
//                                 })         
//                             }

//                         nloanTotAmt = jan_detNewtotAmt + feb_detNewtotAmt + mar_detNewtotAmt + apr_detNewtotAmt + may_detNewtotAmt + jun_detNewtotAmt
//                             + jul_detNewtotAmt + aug_detNewtotAmt + sep_detNewtotAmt + oct_detNewtotAmt + nov_detNewtotAmt + dec_detNewtotAmt

//                             if (nloanTotAmt > 0) {
//                                 poSumView.push({title: typeLoanDet + " - NLA", desc: "newLoanAmt", sortkey: 20, group: 1, isTitle: false, jan_value : jan_detNewtotAmt, feb_value : feb_detNewtotAmt, mar_value : mar_detNewtotAmt, apr_value : apr_detNewtotAmt,
//                                     may_value : may_detNewtotAmt, jun_value : jun_detNewtotAmt, jul_value : jul_detNewtotAmt, aug_value : aug_detNewtotAmt,
//                                     sep_value : sep_detNewtotAmt, oct_value : oct_detNewtotAmt, nov_value : nov_detNewtotAmt, dec_value : dec_detNewtotAmt 
//                                 })         
//                             }

//                         oloanTotCli = jan_detOldtotCli + feb_detOldtotCli + mar_detOldtotCli + apr_detOldtotCli + may_detOldtotCli + jun_detOldtotCli
//                             + jul_detOldtotCli + aug_detOldtotCli + sep_detOldtotCli + oct_detOldtotCli + nov_detOldtotCli + dec_detOldtotCli

//                             if (oloanTotCli > 0) {
//                                 poSumView.push({title: typeLoanDet + " - OLC", desc: "oldLoanClient", sortkey: 21, group: 2, isTitle: false, beg_bal : begBal_OldCli, jan_value : jan_detOldtotCli, feb_value : feb_detOldtotCli, mar_value : mar_detOldtotCli, apr_value : apr_detOldtotCli,
//                                     may_value : may_detOldtotCli, jun_value : jun_detOldtotCli, jul_value : jul_detOldtotCli, aug_value : aug_detOldtotCli,
//                                     sep_value : sep_detOldtotCli, oct_value : oct_detOldtotCli, nov_value : nov_detOldtotCli, dec_value : dec_detOldtotCli 
//                                 })         
//                             }

//                         oloanTotAmt = jan_detOldtotAmt + feb_detOldtotAmt + mar_detOldtotAmt + apr_detOldtotAmt + may_detOldtotAmt + jun_detOldtotAmt
//                             + jul_detOldtotAmt + aug_detOldtotAmt + sep_detOldtotAmt + oct_detOldtotAmt + nov_detOldtotAmt + dec_detOldtotAmt

//                             if (oloanTotAmt > 0) {
//                                 poSumView.push({title: typeLoanDet + " - OLA", desc: "oldLoanAmt", sortkey: 22, group: 1, isTitle: false, beg_bal : begBaldetOldtotAmt, jan_value : jan_detOldtotAmt, feb_value : feb_detOldtotAmt, mar_value : mar_detOldtotAmt, apr_value : apr_detOldtotAmt,
//                                     may_value : may_detOldtotAmt, jun_value : jun_detOldtotAmt, jul_value : jul_detOldtotAmt, aug_value : aug_detOldtotAmt,
//                                     sep_value : sep_detOldtotAmt, oct_value : oct_detOldtotAmt, nov_value : nov_detOldtotAmt, dec_value : dec_detOldtotAmt 
//                                 })         
//                             }

//                         rloanTotCli = jan_detResCli + feb_detResCli + mar_detResCli + apr_detResCli + may_detResCli + jun_detResCli
//                             + jul_detResCli + aug_detResCli + sep_detResCli + oct_detResCli + nov_detResCli + dec_detResCli

//                             if (rloanTotCli > 0) {
//                                 poSumView.push({title: typeLoanDet + " - RES", desc: "ResClientCount", sortkey: 23, isTitle: false, jan_value : jan_detResCli, feb_value : feb_detResCli, mar_value : mar_detResCli, apr_value : apr_detResCli,
//                                     may_value : may_detResCli, jun_value : jun_detResCli, jul_value : jul_detResCli, aug_value : aug_detResCli,
//                                     sep_value : sep_detResCli, oct_value : oct_detResCli, nov_value : nov_detResCli, dec_value : dec_detResCli 
//                                 })         
//                             }
//                     })         

//   console.log(poSumView)
