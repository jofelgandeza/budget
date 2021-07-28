const express = require('express')
const router  = express.Router()
const Swal = require('sweetalert2')
const Center = require('../models/center')
const Employee = require('../models/employee')
const Position = require('../models/position')
const Loan_type = require('../models/loan_type')
const Center_budget_det = require('../models/center_budget_det')
const Unit = require('../models/unit')
const Po = require('../models/po')
const User = require('../models/user')

const bcrypt = require('bcrypt')

const _ = require('lodash')
const Cleave = require('../public/javascripts/cleave.js')
const loan_type = require('../models/loan_type')
const { authUser, authRole } = require('../public/javascripts/basicAuth.js')
const { canViewProject, canDeleteProject, scopedProjects } = require('../public/javascripts/permissions/project.js')
const user = require('../models/user')
const { ROLE } = require('../public/javascripts/data.js')

const monthSelect = ["January","February", "March", "April", "May", "June", "July", "August", "September", "October", "November","December"];

// authUser, authRole("BM", "ADMIN"), 
// console.log(ROLE)
// All Chart of Accounts Route

router.get('/:id', authUser, authRole(ROLE.BM),  async (req, res) => {

    const branchCode = req.params.id
    const _user = req.user
    let searchOptions = {}

    if (req.query.title  !=null && req.query.title !== '') {
        searchOptions.description = RegExp(req.query.title, 'i')
    }
    try {

        branchName = "BRANCHES BUDGET MODULE VIEW"
        res.render('branches/index', {
            branchCode: branchCode,
            searchOptions: req.query,
            yuser: _user,
            dateToday: new Date()
        })
    } catch (err) {
        console.log(err)
        res.redirect('/')
    }
})

// View BRANCH per UNIT  - TUG-A
router.get('/budget/:id', authUser, authRole(ROLE.BM), async (req, res) => {
    
    const branchCode = req.params.id
    const _user = req.user

    const fndPositi = posisyon

    let foundManager = []
    let foundPOunits = []
    let foundPO = []
    let officerName = ""
    let postManager = ""
    let postUnitHead = ""
    let postProgOfr = ""

    let poLoanTotals = []
    let unitLoanTotals = []
    let brnLoanTotals = []
    let brnLoanGrandTot = []
    let centerTargets = []
    let foundCenter = []
    

    let newClients = 0
    let nClientAmt = 0
    let oClient = 0
    let oClientAmt = 0
    let rClient = 0
    let rClient2 = 0
    let resloanTot = 0
    let resignClient = 0
    let budgEndBal = 0
    let totDisburse = 0
    let budgBegBal = 0
    let tbudgEndBal = 0

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


        const branchManager = await Employee.find({branch: branchCode, position_code: postManager}, function (err, foundBMs){
            foundManager = foundBMs

           })
        
           if (branchManager) {
                branchManager.forEach(manager => {
                    officerName = manager.first_name + " " + manager.middle_name.substr(0,1) + ". " + manager.last_name
                })
            }            
        const unitOfficers = await Employee.find({branch: branchCode, position_code: postUnitHead}, function (err, foundUHs){
            foundPOunits = foundUHs
            })
        const programOfficers = await Employee.find({branch: branchCode, position_code: postProgOfr}, function (err, foundPO){
            foundPOs = foundPO
            })

        // console.log(officerName)
        // console.log(foundPOunits)
        // console.log(foundPOs)

        const loanType = await Loan_type.find({})

        const center = await Center.find({branch: branchCode}, function (err, foundCenters) {
//        const center = await Center.find(searchOptions)

            newClients = _.sumBy(foundCenters, function(o) { return o.newClient; });
            nClientAmt = _.sumBy(foundCenters, function(o) { return o.newClientAmt; });
            oClient = _.sumBy(foundCenters, function(o) { return o.oldClient; });
            oClientAmt = _.sumBy(foundCenters, function(o) { return o.oldClientAmt; });
            rClient = _.sumBy(foundCenters, function(o) { return o.resClient; });
            rClient2 = _.sumBy(foundCenters, function(o) { return o.resClient2; });
            budgBegBal = _.sumBy(foundCenters, function(o) { return o.budget_BegBal; });
            budgEndBal = oClient + newClients 
            totDisburse = nClientAmt + oClientAmt
            tbudgEndBal = (budgBegBal + newClients) - (rClient + rClient2)

            foundCenter = foundCenters.sort()

            doneReadCenter = true   
    })
        if (center) {
        } else {
            doneReadCenter = true   
        }
    foundPOunits.forEach(uh => {

        let unCode = _.trim(uh.unit)
        let uniCode = unCode
        let unHeadName = uh.first_name + " " + uh.middle_name.substr(0,1) + ". " + uh.last_name

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
                uniCode = " "
                unHeadName = ""
            } 

            foundCenter.forEach(center => {
                const unitCode = center.unit
                if (unitCode === unCode) { 
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
            let budgEndBal = (oloanTotCount + nloanTotCount + begClientTot) - resloanTot
//            let amtDisburse = oloanTot + oloanTot
            
            unitLoanTotals.push({unit: uniCode, unitHead: unHeadName, loan_type: typeLoan, nnumClient: nloanTotCount, amtDisburse: totAmounts, begClientTot: bClientCnt,
                begClientAmt: bClientAmt, ntotAmount: nloanTot, onumClient: oloanTotCount, ototAmount: oloanTot, resiloanTot: resloanTot, budgEndBal: budgEndBal})

            nUnitLoanTot = nUnitLoanTot + nloanTot
            nUnitLoanTotCount = nUnitLoanTotCount + nloanTotCount
            oUnitLoanTot = oUnitLoanTot + oloanTot
            oUnitLoanTotCount = oUnitLoanTotCount + oloanTotCount
            resUnitLoanTot = resUnitLoanTot + resloanTot
            begUnitLoanTot = begUnitLoanTot + begLoanTot
            begUnitClientTot = begUnitClientTot + begClientTot
            
        })

        typeLoan = "UNIT TOTALS"
        let totUnitAmounts = nUnitLoanTot + oUnitLoanTot 
        let budgUnitEndBal = (oUnitLoanTotCount + nUnitLoanTotCount + begUnitClientTot) - resUnitLoanTot

        unitLoanTotals.push({unit: uniCode, unitHead: unHeadName, loan_type: typeLoan, nnumClient: nUnitLoanTotCount, amtDisburse: totUnitAmounts, begClientTot: begUnitClientTot,
            begClientAmt: begUnitLoanTot, ntotAmount: nUnitLoanTot, onumClient: oUnitLoanTotCount, ototAmount: oUnitLoanTot, resiloanTot: resUnitLoanTot, budgEndBal: budgUnitEndBal})

            doneFoundPO = true
    })

    if (foundPO) {

    } else {
        doneFoundPO = true   
    }

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

 //   console.log(unitLoanTotals)
//    console.log(brnLoanTotals)

            brnLoanGrandTot.push({nClient: newClients, nClientAmt: nClientAmt, oClient: oClient, oClientAmt: oClientAmt, 
                rClient: rClient, budgBegBal: budgBegBal, budgEndBal: budgEndBal, totalDisburse: totDisburse, budBegBalAmt: gtBegBalAmt, budBegBalClient: gtBegBalClient})

            console.log(totDisburse)

//            console.log(foundPOunits)
        if ( doneReadCenter && doneFoundPO && doneReadLonTyp) {
            res.render('branches/budget', {
                listTitle: branchCode,
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
    catch (err) {
        console.log(err)
    }
})

//View EMPLOYEES per BRANCH Level - TUG

router.get('/employees/:id', authUser, authRole(ROLE.BM), async (req, res) => {

    const brnCode = req.params.id
    const _user = req.user


    let fondEmploy = []
    let sortedEmp = []
    let fndPosition = {}
    let empCode = ""
    let empName = ""
    let empPostCode = ""
    let empPost = ""
    let empSortKey = ""
    let empPst
    let empAssign = ""
    let empID = ""
    let empUnit = ""

    let empCanProceed = false
    
    try {
        const brnPosition = await Position.find({group_code: "BRN"}, function (err, foundPosit) {
            fndPosition = foundPosit
        })

        const brnEmployees = await Employee.find({branch: brnCode}, function (err, foundEmployees) {
            const fndEmployees = foundEmployees

//            const empStatus = fndEmployees.status
            
            fndEmployees.forEach(foundEmp =>{
                empPst = foundEmp.position_code
                empID = foundEmp._id
                empName = foundEmp.last_name + ", " + foundEmp.first_name + " " + foundEmp.middle_name.substr(0,1) + "."
                empCode = foundEmp.emp_code
                empUnit = foundEmp.unit
                empUnitPOnum = foundEmp.unit + foundEmp.po_number
                let exist = false
//                console.log(empID)
                // console.log(empPst)

                brnPosition.forEach(branchPost => {
                    const empPosit = branchPost._id

                    if (_.trim(empPosit) === _.trim(empPst) ) {
                        empPostCode = empPosit
                        if (branchPost.code === "BRN_MGR" || branchPost.code === "BRN_ACT" || branchPost.code === "BRN_AST") {
                            empPost = branchPost.title 
                        }
                        if (branchPost.code === "UNI_HED") {
                            empPost = branchPost.title + " - " + empUnit
                        }
                        if (branchPost.code === "PRO_OFR") {
                            empPost = branchPost.title + " - " + empUnitPOnum
                        }
                        
                        empSortKey = branchPost.sort_key.toString() + empUnitPOnum + empName
                        exist = true
                    }
                })
                if (exist) {
                    fondEmploy.push({empID: empID, branchC: brnCode, empName: empName, empCode: empCode, empPostCode: empPostCode, empPost: empPost, empSortKey: empSortKey})
                }    
                empCanProceed = true            
            })

        })

        sortedEmp = fondEmploy.sort( function (a,b) {
            if ( a.empSortKey < b.empSortKey ){
                return -1;
              }
              if ( a.empSortKey > b.empSortKey ){
                return 1;
              }
               return 0;
        })        

        if (brnEmployees.length === 0) {
            empCanProceed = true
        }

    if (empCanProceed)
        res.render('branches/employee', {
            branchCode: brnCode,
            fndEmploy: sortedEmp,
            fndPosition: fndPosition,
            searchOptions: req.query,
            yuser: _user
        })

} catch (err) {
        console.log(err)
        res.redirect('/')
    }
})


// New EMPLOYEE Route
router.get('/newEmployee/:id', authUser, authRole(ROLE.BM), async (req, res) => {
    
    const branchCode = req.params.id
    const _user = req.user


    try {

        const newEmpPost = await Position.find({group_code: "BRN"}, function (err, fndPost) {
            const pstCode = fndPost
           console.log(branchCode)
           const newEmp = new Employee()
           const newUser = new User()
           newEmp.branch = branchCode
   
            res.render('branches/newEmployee', { 
               emp: newEmp, 
               user: newUser,
               posit: fndPost,
               branchCode: branchCode,
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
router.post('/postNewEmp/:id', authUser, authRole(ROLE.BM), async (req, res) => {
    const _user = req.user
   let eUnit
   let ePONum
   const emPostCod = req.body.ayPost
    const nEmpCode = _.trim(req.body.empCode)
    const nEmail = _.trim(req.body.email).toLowerCase()
    const nLName = _.trim(req.body.lName).toUpperCase()
    const nFName = _.trim(req.body.fName).toUpperCase()
    const nMName = _.trim(req.body.mName).toUpperCase()
    const nName =  nLName + ", " + nFName + " " + nMName
    const empID = req.params.id

    console.log(req.body.password)

    const branchPosition = posisyon

    const fndPosition = branchPosition.find(posit => posit.id === emPostCod)

    const ePosition = fndPosition.code

    console.log(ePosition)

    let eShortTitle
    if (ePosition === "BRN_MGR") {
        eShortTitle = "BM"
        eUnit = "N/A"
        ePONum = "N/A"
    }
    if (ePosition === "UNI_HED") {
        eShortTitle = "PUH"
        eUnit = _.trim(req.body.poUnit).toUpperCase()
        ePONum = "N/A"
    }
    if (ePosition === "PRO_OFR") {
        eShortTitle = "PO"
        eUnit = _.trim(req.body.poUnit).toUpperCase()
        ePONum = req.body.poNumber
    }

    const assignUnit = _.trim(req.body.poUnit).toUpperCase() + _.trim(req.body.poNumber)

    const brnCode = req.body.brnCode 
    const assCode = brnCode + "-" + assignUnit
    const empCod = req.body.empCode


let locals
//console.log(brnCode)
let canProceed = true
let UserProceed = true

try {

    let canProceed = false

    const branchEmployees = await Employee.find({branch: brnCode})
    console.log(branchEmployees)

    const sameName = _.find(branchEmployees, {last_name: nLName, first_name: nFName, middle_name: nMName})

    const sameCode = _.find(branchEmployees, {emp_code: nEmpCode})

    const sameAssign = _.find(branchEmployees, {assign_code: assCode})
    console.log(sameAssign)

    if (branchEmployees) {
        if (sameName) {
            locals = {errorMessage: 'Employee Name: ' + nName + ' already exists!'}
            canProceed = false
        } else if (sameAssign) {
            locals = {errorMessage: 'Assign Code: ' + assCode + ' already exists!'}
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
                
        const getExistingUser = await User.findOne({email: nEmail}, function (err, foundUser) {
            // console.log(foundUser)
           let UserProceed = false
            if (!err) {
                if (!foundUser) {
                    UserProceed = true 
                } else {
                    UserProceed = false
                    locals = {errorMessage: 'Username : ' + nEmail + ' already exists!'}
                }
            }
        })
    
    
    if (canProceed && UserProceed)  {
        if (ePosition === "PRO_OFR") {
            const poAssignCode = await Po.findOneAndUpdate({"po_code": assCode}, {$set:{"emp_code": req.body.empCode}})
        } 
        if (ePosition === "UNI_HED") {
//           const unAssignCode = await Po.findOneAndUpdate({"po_code": assCode}, {$set:{"emp_code": req.body.empCode}})
        } 
        let employee = new Employee({

            emp_code: nEmpCode,
            last_name: nLName,
            first_name: nFName,
            middle_name: nMName,
            position_code: emPostCod,
            assign_code: assCode,
            po_number: ePONum,
            branch: req.body.brnCode,
            unit: eUnit
        })
        
        const newCoa = employee.save()

        let nUser = new User({
            name: nName,
            email: nEmail,
            password: hashedPassword,
            assCode: assCode,
            role: eShortTitle
        })
        const saveUser = nUser.save()

        res.redirect('/branches/employees/'+ brnCode)
    } 
    else {
        let psitCode = []
        const rePosition = await Position.find({group_code: "BRN"}, function (err, fnd_Post) {
             psitCode = fnd_Post
        })
        console.log(psitCode)
        let errEmp = []
        let errUser = []

            errUser.push({email: nEmail, password: req.body.password})

            errEmp.push({emp_code: nEmpCode, branch: brnCode, last_name: nLName, first_name: nFName, middle_name: nMName, position_code: emPostCod, unit: eUnit, po_number: ePONum})
            console.log(errEmp)

            res.render('branches/newEmployee', { 
                emp: errEmp, 
                user: errUser,
                posit: psitCode,
                branchCode: brnCode,
                yuser: _user,
                newEmp: true,
                resetPW: false,
                locals: locals
            })
}


} catch (err) {
    console.log(err)
   let locals = {errorMessage: 'Something WENT went wrong.'}
    res.redirect('/branches/employees/'+ brnCode)
}
})

// Get an Employee for EDIT
router.get('/getEmpForEdit/:id/edit', authUser, authRole(ROLE.BM), async (req, res) => {

    paramsID = req.params.id
        console.log(paramsID)

    branCod = req.body.branCode
    empID = req.params.id
    empCode = _.trim(paramsID.substr(3,9))
        console.log(empCode)
    const _user = req.user
    let locals = ""
    let possit
    let foundEmploy = []
    const emPosit = await Position.find({group_code: "BRN"}, function (err, fnd_Post) {
         pst_Code = fnd_Post
    })
     
   try {
        let brnCod
        const employe = await Employee.findOne({emp_code: empCode}, function (err, foundEmp) {
//            console.log(foundlist)
            foundEmploy = foundEmp
            brnCod = foundEmp.branch
            possit = _.trim(foundEmploy.position_code)
           console.log(possit)
        })
        // console.log(employe)
        const newUser = new User()

        res.render('branches/editEmployee', {
            branchCode: brnCod,
            posit: pst_Code,
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
       res.redirect('employees/'+ branCod)
   }
})

// SAVE EDITed Employee

router.put('/putEditedEmp/:id', authUser, authRole(ROLE.BM), async function(req, res){

    paramsID = req.params.id
        console.log(paramsID)

    branCod = paramsID.substr(0,3)
    // empID = req.params.id
    empID = _.trim(paramsID.substr(3,45))

    const assignUnit = _.trim(req.body.poUnit) + _.trim(req.body.poNumber)
    const brnCode = req.body.brnCode 
    const assCode = brnCode + "-" + assignUnit
    const emPost =  req.body.ayPost

    const eAssCode = assCode
    
    let ePONum = "NA"
    let eUnit = "NA"
    
        const emPosition =  await Position.findById(req.body.ayPost)
            const ePosition = emPosition.code
            const eShortTitle = emPosition.short_title

            const eCode = _.trim(req.body.empCode)
            const eLName = _.trim(req.body.lName).toUpperCase()
            const eFName = _.trim(req.body.fName).toUpperCase()
            const eMName = _.trim(req.body.mName).toUpperCase()
            const nName =  eLName + ", " + eFName + " " + eMName
        
        
            if (ePosition === "BRN_MGR" || ePosition === "BRN_ACT" || ePosition === "BRN_AST") {
                eUnit = "NA"
                ePONum = "NA"
            }
            if (ePosition === "UNI_HED") {
                eUnit = req.body.poUnit
                ePONum = "NA"
            } 
            if (ePosition === "PRO_OFR") {
                eUnit = req.body.poUnit
                ePONum = req.body.poNumber    
            } 
    
            console.log(req.params.id)
    let employee
    let empPost
        try {
            const mPost = await Position.findOne({_id: emPost}, function (err, fndEmPost) {
                empPost = fndEmPost.code
            } )

            employee = await Employee.findById(empID)
            console.log(employee)

            employee.emp_code = eCode
            employee.last_name = eLName
            employee.first_name = eFName
            employee.middle_name = eMName
            employee.position_code = emPost
            employee.assign_code = eAssCode
            employee.po_number = ePONum
            employee.branch = brnCode
            employee.unit = eUnit
        
            await employee.save()
        
            if (empPost === "PRO_OFR") {
                const poAssignCode = await Po.findOneAndUpdate({"po_code": eAssCode}, {$set:{"emp_code": eCode}})
            } 
    
            res.redirect('/branches/employees/'+ brnCode)

        } catch (err) {
            console.log(err)
            let locals = {errorMessage: 'Something WENT went wrong.'}
            res.redirect('/branches/employees/'+ brnCode, {
            locals: locals
            })
        }
  
})

// GET Employee User for RESET PASSWORD
router.get('/getEmpEditPass/:id/edit', authUser, authRole(ROLE.BM), async (req, res) => {

   const paramsID = req.params.id
        console.log(paramsID)
    const branCod = req.body.branCode
    const empID = req.params.id
    const empCode = _.trim(paramsID.substr(3,9))

    const _user = req.user
    let locals = ""
    let possit = ""
    let foundEmploy = []
    
    let ass_Code = ""

   try {
        let brnCod
        const employe = await Employee.findOne({emp_code: empCode}, function (err, foundEmp) {
//            console.log(foundlist)
            foundEmploy = foundEmp
            brnCod = foundEmp.branch
            possit = _.trim(foundEmploy.position_code)
           console.log(possit)
           ass_Code = foundEmploy.assign_code
        })
        
        const emPosit = await Position.findById(possit)
        const positsyon = emPosit.title
    
            // console.log(employe)
        const yoser = await User.findOne({assCode: ass_Code}, function (err, foundUser) {
            //            console.log(foundlist)
            fndUser = foundUser
            console.log(fndUser)
        })

        yoser.password = ""
            
        res.render('branches/resetPassword', {
            branchCode: brnCod,
            posit: positsyon,
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
       res.redirect('employees/'+ branCod)
   }
})

router.put('/putEditedPass/:id', authUser, authRole(ROLE.BM), async function(req, res){

    const paramsID = req.params.id

    const branCod = paramsID.substr(0,3)
    // empID = req.params.id
    const empID = _.trim(paramsID.substr(3,45))
    const newPassword = _.trim(req.body.password)
    const userID = req.body.user_id

    // let getExistingUser
    
        try {
            const hashdPassword = await bcrypt.hash(newPassword, 10)
            let getExistingUser = await User.findById(userID)

                getExistingUser.password = hashdPassword
                const savedNewPW = getExistingUser.save()
        
            res.redirect('/branches/employees/'+ branCod)

        } catch (err) {
            console.log(err)
            let locals = {errorMessage: 'Something WENT went wrong.'}
            res.render('/branches/employee/'+ branCod, {
            locals: locals
            })
        }
  
})

// Get UNITS for Maintenance
router.get('/units/:id', authUser, authRole(ROLE.BM), async (req, res) => {

    const brnCode = req.params.id
    const _user = req.user

    let foundEmployee = []
    let sortedEmp = []
    let fndUnit = []
    let empCode = ""
    let empName = ""
    let doneReadUnit = false

    // const brnPosition = await Position.find({group_code: "BRN"}, function (err, foundPosit) {
    //     fndPosition = foundPosit
    // })
    // const brnEmployees = await Employee.find({branch: brnCode}, function (err, fndEmployees) {
    //     foundEmployee = fndEmployees
    // })

    try {
        const brnUnits = await Unit.find({branch: brnCode}, function (err, foundUnits) {
//            const fndEmployees = foundEmployees
//            const empStatus = fndEmployees.status
            
            foundUnits.forEach(fndUnits =>{
                id = fndUnits._id
                unitCode = fndUnits.unit_code
                unitUnit = fndUnits.unit
                unitLoanProd = fndUnits.loan_type
                unitOffLoc = fndUnits.office_loc
                unitAdd = fndUnits.address
                unitHead = fndUnits.emp_code
                unitPoNum = fndUnits.num_pos
                unitCenterNum = fndUnits.num_centers
                unitStatus = fndUnits.status

                foundEmployee.forEach(fndEmp => {
                    empName = fndEmp.first_name + " " + fndEmp.middle_name.substr(0,1) + ". " + fndEmp.last_name
                })
                fndUnit.push({id: id, unitCode: unitCode, unitUnit: unitUnit, unitHead: unitHead, unitLoanProd: unitLoanProd, unitOffLoc: unitOffLoc})
                doneReadUnit = true
            })

                console.log(fndUnit)
            
                sortedUnits= fndUnit.sort( function (a,b) {
                    if ( a.unitCode < b.unitCode ){
                        return -1;
                      }
                      if ( a.unitCode > b.unitCode ){
                        return 1;
                      }
                       return 0;
                })
            if (doneReadUnit || fndUnit.length === 0) {
                res.render('branches/unit', {
                branchCode: brnCode,
                fondUnits: sortedUnits,
                searchOptions: req.query,
                yuser: _user
                })
            }
    })
    } catch (err) {
        console.log(err)
        res.redirect('/')
    }
})

// GET NEW UNIT
router.get('/newUnit/:id', authUser, authRole(ROLE.BM), async (req, res) => {
    
    const branchCode = req.params.id
    const _user = req.user

    const loanType = await Loan_type.find({})

         res.render('branches/newUnit', { 
            unit: new Unit(), 
            lonType: loanType,
            branchCode: branchCode,
            yuser: _user
        })
    // })
//    console.log(position)

})

// POST or Save new Unit
router.post('/postNewUnit/:id', authUser, authRole(ROLE.BM), async (req, res) => {
    
    const param = req.params.id
    const brnCod = _.trim(req.params.id)
    const uUnit = _.trim(req.body.uUnit).toUpperCase()
    const uUnitCode = brnCod + '-' + uUnit

    let canProceed = true
    let locals
    
 
 try {
    const unit = await Unit.findOne({unit_code: uUnitCode}, function (err, fndUnit) {
    })

    if (unit === null) {
        canProceed = true
    } else {
        canProceed = false
    }

    if (canProceed) {
        let unit = new Unit({
            unit_code: uUnitCode,
            unit: uUnit,
            branch: brnCod,
            loan_type: req.body.loanTyp,
            office_loc: req.body.office_loc,
            address: req.body.unitAdd,
            status: "New"
       })
       const newUnit = await unit.save()
       res.redirect('/branches/units/'+ brnCode)
     
    } else {
        locals = {errorMessage: 'UNIT already exists!'}

        const loanType = await Loan_type.find({})

        res.render('branches/newUnit', { 
           unit: new Unit(), 
           lonType: loanType,
           branchCode: brnCod,
           locals: locals
         })
    }


 } catch (err) {
     console.log(err)
    let locals = {errorMessage: 'Something WENT went wrong.'}
     res.redirect('/branches/units/'+ brnCod)
 }
 })
 
 // Get a UNIT for EDIT
router.get('/getUnitForEdit/:id/edit', authUser, authRole(ROLE.BM), async (req, res) => {
    const param = req.params.id
    const brnCod = param.substring(0,3)
    const uUnit = req.body.uUnit
    const uUnitCode = param
    const _user = req.user

    let fondUnit = []

    try {

        const loanType = await Loan_type.find({})

        const units = await Unit.findOne({unit_code: uUnitCode}, function (err, fndUnit) {
            fondUnit = fndUnit
        })

        res.render('branches/editUnit', { 
           unit: fondUnit, 
           lonType: loanType,
           branchCode: brnCod,
           yuser : _user
       })

    } catch (err) {
            console.log(err)
            let locals = {errorMessage: 'Something WENT went wrong.'}
            res.redirect('/branches/units/'+ brnCod)
    }
})

// SAVE EDITed Unit

router.put('/putEditedUnit/:id', authUser, authRole(ROLE.BM), async function(req, res){
    const param = req.params.id
    const brnCod = param.substring(0,3)
    const uUnit = req.body.uUnit
    const uUnitCode = param
    const ln_Typ = req.body.loanTyp

    console.log(req.params.id)

    let unit
        try {

            unit = await Unit.findOne({unit_code: uUnitCode})

            unit.unit_code = uUnitCode
            unit.unit = uUnit.toUpperCase()
            unit.branch = brnCod
            unit.loan_type = ln_Typ
            unit.office_loc = req.body.office_loc
            unit.address = req.body.unitAdd
            unit.status = "Active"
        
            await unit.save()
        
            res.redirect('/branches/units/'+ brnCod)

        } catch (err) {
            console.log(err)
            let locals = {errorMessage: 'Something WENT went wrong.'}
            res.redirect('/branches/units/'+ brnCod, {
            locals: locals
            })
        }
  
})

router.delete('/deleteUnit/:id', authUser, authRole(ROLE.BM), async (req, res) => {

    let unUnit

    try {
        unUnit = await Unit.findById(req.params.id)
        delBranCode = unUnit.branch
        await unUnit.remove()  
        res.redirect('/branches/units/'+delBranCode)
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
    let sysUser

    try {
        
        empYee = await Employee.findById(empID)
        const delBranCode = empYee.branch
        // const 

        await empYee.remove()  


        res.redirect('/branches/employees/'+delBranCode)
        
    } catch (err) {
        console.log(err)
    }
})

// View BRANCH Targets per month ROUTE
router.get('/viewBranchTargetMon/:id', authUser, authRole(ROLE.BM), async (req, res) => {

    const viewBranchCode = req.params.id
    let foundPOV = []
    const _user = req.user
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

    const foundCenterDet = await Center_budget_det.find({branch: viewBranchCode})

    console.log(foundCenterDet)

    poSumView.push({title: "NUMBER OF LOANS", sortkey: 1, group: 1})

    const newLoanClientView = await Center_budget_det.find({branch: viewBranchCode, view_code: "NewLoanClient"}, function (err, fndNewCli) {
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

    const oldLoanClientView = await Center_budget_det.find({branch: viewBranchCode, view_code: "OldLoanClient"}, function (err, fndOldCli) {

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


    const newLoanAmtView = await Center_budget_det.find({branch: viewBranchCode, view_code: "NewLoanAmt"}, function (err, fndNewAmt) {

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

    const oldLoanAmtView = await Center_budget_det.find({branch: viewBranchCode, view_code: "OldLoanAmt"}, function (err, fndOldAmt) {

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

                console.log(viewBranchCode)
                let poVSum = []

                // Accessing loan_types
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
                        let begBaldetOldtotAmt = 0 
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
                                    begBaldetOldtotAmt = begBaldetOldtotAmt + centerDet.beg_bal
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
                                poSumView.push({title: typeLoanDet + " - OLA", desc: "oldLoanAmt", sortkey: 16, group: 1, beg_bal : begBaldetOldtotAmt, jan_value : jan_detOldtotAmt, feb_value : feb_detOldtotAmt, mar_value : mar_detOldtotAmt, apr_value : apr_detOldtotAmt,
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
//        poSumView.push({_id: _id, sortKey: sortKey, loan_type: loan_type, month: month, semester: semester, numClient: numClient, amount: amount, totAmount: totAmount, remarks: remarks})
           poSumView.sort( function (a,b) {
                if ( a.sortkey < b.sortkey ){
                    return -1;
                }
                if ( a.sortkey > b.sortkey ){
                    return 1;
                }
                return 0;
            })

        res.render('branches/viewBranchTargetMon', {
            vwBranchCod: viewBranchCode,
            poSumView: poSumView,
            yuser: _user
        })
    } catch (err) {
        console.log(err)
        res.redirect('/branches/'+ viewBranchCode)
    }
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

