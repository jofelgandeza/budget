const express = require('express')
const router  = express.Router()
const Swal = require('sweetalert2')
const Center = require('../models/center')
const Employee = require('../models/employee')
const Position = require('../models/position')
const Loan_type = require('../models/loan_type')
const Unit = require('../models/unit')
const Po = require('../models/po')
const _ = require('lodash')
const Cleave = require('../public/javascripts/cleave.js')
const loan_type = require('../models/loan_type')

const monthSelect = ["January","February", "March", "April", "May", "June", "July", "August", "September", "October", "November","December"];


// All Chart of Accounts Route
router.get('/:id', async (req, res) => {

    const branchCode = req.params.id
    let searchOptions = {}

    if (req.query.title  !=null && req.query.title !== '') {
        searchOptions.description = RegExp(req.query.title, 'i')
    }
    try {
        // const brnEmployees = await Employee.find({branch: branchCode})

        // const center = await Center.find(searchOptions)

        branchName = "BRANCHES BUDGET MODULE VIEW"
        res.render('branches/index', {
            branchCode: branchCode,
            searchOptions: req.query,
            Swal: Swal
        })
    } catch (err) {
        console.log(err)
        res.redirect('/')
    }
})

//  router.get('/:id/edit', async (req, res) => {
 

//View EMPLOYEES per BRANCH Level - TUG

router.get('/employees/:id', async (req, res) => {

    const brnCode = req.params.id

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

    const brnPosition = await Position.find({group_code: "BRN"}, function (err, foundPosit) {
        fndPosition = foundPosit
    })

    try {
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
        
            res.render('branches/employee', {
            branchCode: brnCode,
            fndEmploy: sortedEmp,
            fndPosition: fndPosition,
            searchOptions: req.query,
            Swal: Swal
        })
    })
    } catch (err) {
        console.log(err)
        res.redirect('/')
    }
})


// New EMPLOYEE Route
router.get('/newEmployee/:id', (req, res) => {
    
    const branchCode = req.params.id

    const newEmpPost = Position.find({group_code: "BRN"}, function (err, fndPost) {
         const pstCode = fndPost
        console.log(branchCode)

         res.render('branches/newEmployee', { 
            emp: new Employee(), 
            posit: fndPost,
            branchCode: branchCode
        })
    })
//    console.log(position)

})

// POST or Save new Employee
router.post('/postNewEmp', async (req, res) => {
   let eUnit
   let ePONum
   const emPostCod = req.body.ayPost
    const emPosition =  await Position.findById(req.body.ayPost)
        const ePosition = emPosition.code

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
    
    const assignUnit = _.trim(req.body.poUnit) + _.trim(req.body.poNumber)

    const brnCode = req.body.brnCode 
    const assCode = brnCode + "-" + assignUnit
    const empCod = req.body.empCode

let employee = new Employee({

    emp_code: req.body.empCode,
    last_name: req.body.lName,
    first_name: req.body.fName,
    middle_name: req.body.mName,
    position_code: emPostCod,
    assign_code: assCode,
    po_number: ePONum,
    branch: req.body.brnCode,
    unit: eUnit
})

let locals
//console.log(brnCode)
let canProceed = true
try {

    const fndEmp = await Employee.findOne({emp_code: empCod}, function (err, foundEmp) {
        console.log(foundEmp)
        let canProceed = false

        if (!err) {
            if (!foundEmp) {
                canProceed = true
            } else {
                const empUnit = foundEmp.unit
                const assUnit = _.trim(empUnit) + _.trim(foundEmp.po_number)
                if (assUnit === assignUnit) {
                    canProceed = false
                    locals = {errorMessage: 'PO number in the unit is already exist!'}
                }
                if (foundEmp.emp_code === empCod) {
                    canProceed = false
                    locals = {errorMessage: 'Employee Code already exists!'}
                }
             }
            } else {
            res.render('branches/newEmployee', { 
                locals: locals
            })
        }
    })

    if (canProceed) {
        if (ePosition === "PRO_OFR") {
            const poAssignCode = await Po.findOneAndUpdate({"po_code": assCode}, {$set:{"emp_code": req.body.empCode}})
        } 
        if (ePosition === "UNI_HED") {
//           const unAssignCode = await Po.findOneAndUpdate({"po_code": assCode}, {$set:{"emp_code": req.body.empCode}})
        } 
        
        const newCoa = await employee.save()
        res.redirect('/branches/employees/'+ brnCode)
    } else {

        const position = Position.find({group_code: "BRN"}, function (err, fndPost) {
             const pstCode = fndPost
    //         console.log(pstCode)
    
            res.render('branches/newEmployee'+ brnCode, { 
                emp: new Employee(), 
                posit: fndPost,
                branchCode: brnCode,
                locals: locals
            })
        })
     }


} catch (err) {
    console.log(err)
   let locals = {errorMessage: 'Something WENT went wrong.'}
    res.redirect('/branches/employees/'+ brnCode)
}
})

// Get an Employee for EDIT
router.get('/getEmpForEdit/:id/edit', async (req, res) => {

    branCod = req.body.branCode
    empID = req.params.id
    empCode = req.body.emp_code
    let locals = ""
    let possit
    let foundEmploy = []
    const emPosit = await Position.find({group_code: "BRN"}, function (err, fnd_Post) {
         pst_Code = fnd_Post
    })
     
   try {
        let brnCod
        const employe = await Employee.findOne({emp_code: req.params.id}, function (err, foundEmp) {
//            console.log(foundlist)
            foundEmploy = foundEmp
            brnCod = foundEmp.branch
            possit = _.trim(foundEmploy.position_code)
           console.log(possit)
        })
        // console.log(employe)

        res.render("branches/editEmployee", {
            branchCode: brnCod,
            posit: pst_Code,
            // empPostCod: possit,
            emp: employe, 
            locals: locals
       })

//        res.render('centers/edit', { centers: center, coaClass: coaClass })

   } catch (err) {
       console.log(err)
       res.redirect('employees/'+ branCod)
   }
})



// SAVE EDITed Employee

router.put('/putEditedEmp/:id', async function(req, res){

    const assignUnit = _.trim(req.body.poUnit) + _.trim(req.body.poNumber)
    const brnCode = req.body.brnCode 
    const assCode = brnCode + "-" + assignUnit
    const emPost =  req.body.ayPost

    const eCode = req.body.empCode
    const eLName =  req.body.lName
    const eFName = req.body.fName
    const eMName =  req.body.mName

    const eAssCode = assCode
    const ePONnumber = req.body.poNumber
    const eUnit = req.body.poUnit

    console.log(req.params.id)
    let employee
    let empPost
        try {
            const mPost = await Position.findOne({_id: emPost}, function (err, fndEmPost) {
                empPost = fndEmPost.code
            } )

            employee = await Employee.findById(req.params.id)
            console.log(employee)

            employee.emp_code = eCode
            employee.last_name = eLName
            employee.first_name = eFName
            employee.middle_name = eMName
            employee.position_code = emPost
            employee.assign_code = eAssCode
            employee.po_number = ePONnumber
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
            res.render('/branches/newEmployee/'+ brnCode, {
            locals: locals
            })
        }
  
})

// Get UNITS for Maintenance
router.get('/units/:id', async (req, res) => {

    const brnCode = req.params.id

    let foundEmployee = []
    let sortedEmp = []
    let fndUnit = []
    let empCode = ""
    let empName = ""
    
    const brnPosition = await Position.find({group_code: "BRN"}, function (err, foundPosit) {
        fndPosition = foundPosit
    })
    const brnEmployees = await Employee.find({branch: brnCode}, function (err, fndEmployees) {
        foundEmployee = fndEmployees
    })

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
        
            res.render('branches/unit', {
            branchCode: brnCode,
            fondUnits: sortedUnits,
            searchOptions: req.query,
            Swal: Swal
        })
    })
    } catch (err) {
        console.log(err)
        res.redirect('/')
    }
})

// GET NEW UNIT
router.get('/newUnit/:id', async (req, res) => {
    
    const branchCode = req.params.id

    const loanType = await Loan_type.find({})

         res.render('branches/newUnit', { 
            unit: new Unit(), 
            lonType: loanType,
            branchCode: branchCode
        })
    // })
//    console.log(position)

})

// POST or Save new Unit
router.post('/postNewUnit/:id', async (req, res) => {
    
    const param = req.params.id
    const brnCod = req.params.id
    const uUnit = req.body.uUnit
    const uUnitCode = _.trim(brnCod + '-' + uUnit)

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
router.get('/getUnitForEdit/:id/edit', async (req, res) => {
    const param = req.params.id
    const brnCod = param.substring(0,3)
    const uUnit = req.body.uUnit
    const uUnitCode = param

    let fondUnit = []

    try {

        const loanType = await Loan_type.find({})

        const units = await Unit.findOne({unit_code: uUnitCode}, function (err, fndUnit) {
            fondUnit = fndUnit
        })

        res.render('branches/editUnit', { 
           unit: fondUnit, 
           lonType: loanType,
           branchCode: brnCod
       })

    } catch (err) {
            console.log(err)
            let locals = {errorMessage: 'Something WENT went wrong.'}
            res.redirect('/branches/units/'+ brnCod)
    }
})

// SAVE EDITed Unit

router.put('/putEditedUnit/:id', async function(req, res){
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
            unit.unit = uUnit
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

router.delete('/deleteUnit/:id', async (req, res) => {

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
router.get('/unit/:id', async (req, res) => {
    
    const IDcode = req.params.id
   
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
                   Swal: Swal
               })
   
       } 
       catch (err) {
           console.log(err)
       }
   })
   
   
// View BRANCH per UNIT  - TUG-A
router.get('/budget/:id', async (req, res) => {
    
    const branchCode = req.params.id

//     const unitCode = IDcode.substr(4,1)
//     const branchCode = IDcode.substr(0,3)
//     const uniCode = IDcode.substr(0,4)

//     console.log(IDcode)
//     console.log(unitCode)
//     console.log(uniCode)

    let foundManager = []
    let foundPOunits = []
    let foundPO = []
    let officerName = ""
    let fndPositi = []
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


   
    try {

        const postEmp = await Position.find({dept_code: "BRN"}, function (err, fndPosi) {
            fndPositi = fndPosi
        })

//        console.log(fndPositi)

        fndPositi.forEach(fndPosii => {
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

        const branchManager = await Employee.find({branch: branchCode, position_code: postManager}, function (err, foundBMs){
            foundManager = foundBMs
           })

        branchManager.forEach(manager => {
            officerName = manager.first_name + " " + manager.middle_name.substr(0,1) + ". " + manager.last_name

            })
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
            budgBegBal = _.sumBy(foundCenters, function(o) { return o.budget_BegBal; });
            budgEndBal = oClient + newClients 
            totDisburse = nClientAmt + oClientAmt
            tbudgEndBal = (oClient + newClients) - rClient

            foundCenter = foundCenters.sort()
    })

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

    })

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

    })

 //   console.log(unitLoanTotals)
//    console.log(brnLoanTotals)

            brnLoanGrandTot.push({nClient: newClients, nClientAmt: nClientAmt, oClient: oClient, oClientAmt: oClientAmt, 
                rClient: rClient, budgBegBal: budgBegBal, budgEndBal: budgEndBal, totalDisburse: totDisburse, budBegBalAmt: gtBegBalAmt, budBegBalClient: gtBegBalClient})

            console.log(totDisburse)

//            console.log(foundPOunits)
 
            res.render('branches/budget', {
                listTitle: branchCode,
                officerName: officerName,
                loanTots: brnLoanTotals,
                poGrandTot: brnLoanGrandTot,
                unitLoanTots: unitLoanTotals,
                searchOptions: req.query,
                Swal: Swal
            })

    } 
    catch (err) {
        console.log(err)
    }
})

// Edit Targets

//Save targets to Targets array field in center collection

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

router.post('/delete', async (req, res) => {
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

router.delete('/deleteEmp/:id', async (req, res) => {

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
