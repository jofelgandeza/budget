const express = require('express')
const router  = express.Router()
const Swal = require('sweetalert2')
const Center = require('../models/center')
const Employee = require('../models/employee')
const Position = require('../models/position')
const Loan_type = require('../models/loan_type')
const Center_budget_det = require('../models/center_budget_det')
const Center_det_budg_view = require('../models/center_det_budg_view')
const Budg_exec_sum = require('../models/budg_exec_sum')
const Unit = require('../models/unit')
const Po = require('../models/po')
const _ = require('lodash')
const Cleave = require('../public/javascripts/cleave.js')
const { forEach, isNull } = require('lodash')



const monthSelect = ["January","February", "March", "April", "May", "June", "July", "August", "September", "October", "November","December"];


// All Chart of Accounts Route
router.get('/:id', async (req, res) => {

    const unitCode = req.params.id
    let searchOptions = {}

    if (req.query.title  !=null && req.query.title !== '') {
        searchOptions.description = RegExp(req.query.title, 'i')
    }
    try {
        // const brnEmployees = await Employee.find({branch: branchCode})

        // const center = await Center.find(searchOptions)

        branchName = "UNIT ACCESS VIEW"
        res.render('units/index', {
            unitCode: unitCode,
            searchOptions: req.query,
            Swal: Swal
        })
    } catch (err) {
        console.log(err)
        res.redirect('/')
    }
})

// Get POs for Maintenance
router.get('/pos/:id', async (req, res) => {

    const unitCode = req.params.id
    const poBranch = unitCode.substr(0,3)
    const poUnitLet = unitCode.substr(4,1)
console.log(unitCode)

    let foundEmployee = []
    let fondPO = []
    let foundPOs = []
    let empCode = ""
    let empName = ""
    
    const brnPosition = await Position.find({group_code: "BRN"}, function (err, foundPosit) {
        fndPosition = foundPosit
    })
    const unitPOs = await Po.find({branch: poBranch, unit: poUnitLet}, function (err, fndPO) {
        if (!fndPO) {
        
        } else {
            foundPOs = fndPO
        }
    })
    const brnEmployees = await Employee.find({branch: poBranch, unit: poUnitLet}, function (err, fndEmployees) {
        foundEmployee = fndEmployees
    })

    try {
            let poName = ""

            foundPOs.forEach(fndPos =>{
                id = fndPos._id
                poCode = fndPos.po_code
                poNum = fndPos.po_number
                pounitCode = fndPos.unit_code
                pounitNum = fndPos.unit
                poBrnch = fndPos.branch
                poLoanProd = fndPos.loan_type
                poEmpCod = fndPos.emp_code
                poCenterNum = fndPos.num_centers
                poStatus = fndPos.status
                
                if (poEmpCod ===""){
                    poName = ""
                } else {
                    foundEmployee.forEach(fndEmp => {
                        if (fndEmp.emp_code === poEmpCod) {
                            poName = fndEmp.first_name + " " + fndEmp.middle_name.substr(0,1) + ". " + fndEmp.last_name
                        } else {
                        }
                    })
                }
                    
                fondPO.push({poID: id, poCode: poCode, poNum: poNum, UnitCode: unitCode, poUnitLet: poUnitLet, 
                    poName: poName, poStatus: "Active", branch: poBrnch, poLoanProd: poLoanProd})
            })

//                console.log(fondPO)
            
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
            Swal: Swal
        })
    } catch (err) {
        console.log(err)
        res.redirect('/')
    }
})

 
// Get NEW PO
router.get('/newPO/:id', async (req, res) => {
    
    const poCode = req.params.id
    const uniCode = poCode.substr(0,5)

    const loanType = await Loan_type.find({})

         res.render('units/newPO', { 
            po: new Po(), 
            lonType: loanType,
            unitCode: uniCode
        })
    // })
//    console.log(position)

})

// POST or Save new Unit
router.post('/postNewPO/:id', async (req, res) => {
    
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
router.get('/getPOForEdit/:id/edit', async (req, res) => {
    const param = req.params.id
    const brnCod = param.substring(0,3)
    const uUnitCode = param.substr(0,5)
    const uUnit = param.substr(4,1)
    
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
            unitCode: uUnitCode
       })

    } catch (err) {
            console.log(err)
            let locals = {errorMessage: 'Something WENT went wrong.'}
            res.redirect('/units/pos/'+ uUnitCode)
    }
})

// SAVE EDITed Unit

router.put('/putEditedPo/:id', async function(req, res){
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

//Set/View CENTERS per PO 

router.get('/setPOCenters/:id', async (req, res) => {

    const IDcode = req.params.id

    const poNumber = IDcode.substr(5,1)
    const unit_Code = IDcode.substr(0,5)
    const unitCode = IDcode.substr(4,1)
    const branchCode = IDcode.substr(0,3)

    console.log(IDcode)

    let foundCenter = []
    let fndCenter = []

    try {

        const loanType = await Loan_type.find({})

        const center = await Center.find({branch: branchCode, unit: unitCode, po: poNumber}, function (err, foundCenters) {
            foundCenter = foundCenters
        })
        
        foundCenter.forEach(fndCtr => {
            

        })
            

            res.render('units/center', {
                poCode: IDcode,
                unitCode: unitCode,
                unit_Code: unit_Code,
                centers: foundCenter
            })
        } catch (err) {
            console.log(err)
            res.redirect('/')
        }
})

// Get NEW CENTER
router.get('/newCenter/:id', async (req, res) => {
    
    const poCode = req.params.id
    const uniCode = poCode.substr(0,5)
    const centerStatus = ["Targetted","Active"]
    const ctrAdd = ""
    const lonType = await Loan_type.find({})

        res.render('units/newCenter', { 
            center: new Center(),
            centerAdd: ctrAdd,
            poCode: poCode,
            unitCode: uniCode,
            lonType: lonType,
            centerStatus: centerStatus
        })

})

// POST or Save new CENTER
router.post('/postNewCenter/:id', async (req, res) => {

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
 
    area: "NLE",
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
        const centerStatus = ["Targetted","Active"]

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
router.get('/getCenterForEdit/:id/edit', async (req, res) => {

    const centerID = req.params.id
    const centerStatus = ["Targetted","Active"]
    let ctrInfo = []
    let ctrAdd = ""
try {
    const ctrLonType = await Loan_type.find({})

    const Fndcenter = await Center.findById(centerID)

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
        centerStatus: centerStatus
    })

} catch (err) {
        console.log(err)
        let locals = {errorMessage: 'Something WENT went wrong.'}
        res.redirect('/units/pos/'+ ctrUniCod)
}
})


 // SAVE EDITed Center

router.put('/putEditedCenter/:id', async function(req, res){
    //params.id is center.center
    const centerPoCode = req.body.po_Code
    const poNumber = centerPoCode.substr(5,1)
    const unitCode = centerPoCode.substr(4,1)
    const branchCode = centerPoCode.substr(0,3)
    const centerNumber = req.body.cntrNum
    let cntrNum = _.toNumber(req.body.cntrNum) 

    
    switch(poNumber) {
        case "1": 
            if (cntrNum.length === 1) {
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

    const cntrLoanType = req.body.cntrLoan
    const cntrAdd = req.body.centerAdd
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

router.delete('/deleteCenter/:id', async (req, res) => {

    let poCntr

    try {
        poCntr = await Center.findById(req.params.id)
        delCenterPO = poCntr.center.substr(0,6)
        await poCntr.remove()  
        res.redirect('/units/setPOCenters/'+delCenterPO)
    } catch (err) {
        console.log(err)
    }
})


router.delete('/deletePO/:id', async (req, res) => {

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
                   Swal: Swal
               })
   
       } 
       catch (err) {
           console.log(err)
       }
   })
   
   

// View BRANCH per UNIT  - TUG-A
router.get('/budget/:id', async (req, res) => {
    
    const unitCode = req.params.id
    const branchCode = unitCode.substring(0,3)
    const unitLetter = unitCode.substr(4,1)

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
    let rClient2 = 0
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

//        console.log(fnd)

        const branchManager = await Employee.find({branch: branchCode, position_code: postUnitHead, assign_code: unitCode}, function (err, foundBMs){
            foundManager = foundBMs
           })

        branchManager.forEach(manager => {
            officerName = manager.first_name + " " + manager.middle_name.substr(0,1) + ". " + manager.last_name

            })
        const unitOfficers = await Employee.find({branch: branchCode, assign_code: unitCode}, function (err, foundUHs){
            foundPOunits = foundUHs
            })
        const programOfficers = await Employee.find({branch: branchCode, unit: unitLetter, position_code: postProgOfr}, function (err, foundPO){
            foundPOs = foundPO
            })

        // console.log(officerName)
        // console.log(foundPOunits)
        // console.log(foundPOs)

        const loanType = await Loan_type.find({})

        const center = await Center.find({branch: branchCode, unit: unitLetter}, function (err, foundCenters) {
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
            tbudgEndBal = (oClient + newClients) - (rClient + rClient2)

            foundCenter = foundCenters.sort()
    })

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
                poNum = ""
            } 

            foundCenter.forEach(center => {
                const poNo = center.po
                if (poNo === forSortPoNum) { 
                    const lnType = center.loan_code
                    let centerTargets = center.Targets
                    let LoanBegBal = center.Loan_beg_bal
//                  let centerLoanBegBal = center.Loan_beg_bal                
                    let resignClient = center.resClient + center.resClient2 
            
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
            
            unitLoanTotals.push({sortkey: forSortPoNum, po: poNum, unitHead: unHeadName, loan_type: typeLoan, nnumClient: nloanTotCount, amtDisburse: totAmounts, begClientTot: bClientCnt,
                begClientAmt: bClientAmt, ntotAmount: nloanTot, onumClient: oloanTotCount, ototAmount: oloanTot, resiloanTot: resloanTot, budgEndBal: budgEndBal})

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

    })
    console.log(unitLoanTotals)

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

                sortedPOs = unitLoanTotals.sort( function (a,b) {
                    if ( a.sortkey < b.sortkey ){
                        return -1;
                      }
                      if ( a.sortkey > b.sortkey ){
                        return 1;
                      }
                       return 0;
                })
 
            res.render('units/budget', {
                perUnitCode: unitCode,
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


// View UNIT Targets per month ROUTE
router.get('/viewUnitTargetMon/:id', async (req, res) => {

    const viewUnitCode = req.params.id
    const vwUnitCode = viewUnitCode
    const vwBranchCode = vwUnitCode.substr(0,3)

    let foundPOV = []
    // let foundCenterDet = []

    const vwloanType = await Loan_type.find({})
    // console.log(vwloanType)

    let poSumView = []
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

        let doneReadNLC = false
        let doneReadOLC = false
        let doneReadNLA = false
        let doneReadOLA = false

        let fndUnitBudgExecTotLonAmt = []

    const poBudgExecTotLonAmt = await Budg_exec_sum.findOne({unit: viewUnitCode, view_code: "TotLoanAmt"}, function (err, fndTotLonAmt) {
        fndUnitBudgExecTotLonAmt = fndTotLonAmt
    })

    console.log(poBudgExecTotLonAmt)

    const foundCenterDet = await Center_budget_det.find({unit: viewUnitCode})

//    console.log(foundCenterDet)

    poSumView.push({title: "NUMBER OF LOANS", sortkey: 1, group: 1})

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
        
            poSumView.push({title: "Number of New Loan", sortkey: 2, group: 1, beg_bal: 0, jan_value : jan_newCtotValue, feb_value : feb_newCtotValue, mar_value : mar_newCtotValue, apr_value : apr_newCtotValue,
                may_value : may_newCtotValue, jun_value : jun_newCtotValue, jul_value : jul_newCtotValue, aug_value : aug_newCtotValue,
                sep_value : sep_newCtotValue, oct_value : oct_newCtotValue, nov_value : nov_newCtotValue, dec_value : dec_newCtotValue 
            }) 
        doneReadNLC = true
    }) //, function (err, fndPOV) {

    const oldLoanClientView = await Center_budget_det.find({unit: viewUnitCode, view_code: "OldLoanClient"}, function (err, fndOldCli) {

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

        poSumView.push({title: "Amount of New Loan", sortkey: 6, group: 2, jan_value : jan_newAtotValue, feb_value : feb_newAtotValue, mar_value : mar_newAtotValue, apr_value : apr_newAtotValue,
            may_value : may_newAtotValue, jun_value : jun_newAtotValue, jul_value : jul_newAtotValue, aug_value : aug_newAtotValue,
            sep_value : sep_newAtotValue, oct_value : oct_newAtotValue, nov_value : nov_newAtotValue, dec_value : dec_newAtotValue 
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

                poSumView.push({title: "Amount of Reloan", sortkey: 7, group: 2, jan_value : jan_oldAtotValue, feb_value : feb_oldAtotValue, mar_value : mar_oldAtotValue, apr_value : apr_oldAtotValue,
                    may_value : may_oldAtotValue, jun_value : jun_oldAtotValue, jul_value : jul_oldAtotValue, aug_value : aug_oldAtotValue,
                    sep_value : sep_oldAtotValue, oct_value : oct_oldAtotValue, nov_value : nov_oldAtotValue, dec_value : dec_oldAtotValue 
                 }) 
        doneReadOLA = true

    }) //, function (err, fndPOV) {

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
        
            poSumView.push({title: "TOTAL AMOUNT OF LOAN", sortkey: 8, group: 2, jan_value : janTotAmtLoan, feb_value : febTotAmtLoan, mar_value : marTotAmtLoan, 
                apr_value : aprTotAmtLoan, may_value : mayTotAmtLoan, jun_value : junTotAmtLoan, jul_value : julTotAmtLoan, 
                aug_value : augTotAmtLoan, sep_value : sepTotAmtLoan, oct_value : octTotAmtLoan, nov_value : novTotAmtLoan, dec_value : decTotAmtLoan
            })

            // COMPUTATION OF PRINCIPAL AND INTEREST AMOUNTS

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
                                jan_InterestAmt = 0
                                    jan_CollectAmt = 0
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
                            sep_loanReleaseAmt = sepTotAmtLoanv
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
                                nov_InterestAmt = 0
                                    oct_CollectAmt = 0
                                dec_InterestAmt = _.round((nov_loanReleaseAmt * interestPerMo) * .29)
                                    dec_CollectAmt = _.round((nov_loanReleaseAmt * 1.2 / 6) - dec_InterestAmt)
                                        dec_totIntAmt = dec_totIntAmt + dec_InterestAmt
                                        dec_totColAmt = dec_totColAmt + dec_CollectAmt
                            break;
                        case "December":
                            loanAmount = decTotAmtLoan
                            dec_loanReleaseAmt = decTotAmtLoan
                                dec_InterestAmt = 0
                                break;
                        default:
                            month = ""
                            break;
                    }
                }
                rowTotCollectAmt = jan_CollectAmt + feb_CollectAmt + mar_CollectAmt + apr_CollectAmt + may_CollectAmt + jun_CollectAmt
                    + jul_CollectAmt + aug_CollectAmt + sep_CollectAmt + oct_CollectAmt + nov_CollectAmt + dec_CollectAmt

                rowTotInterest = jan_InterestAmt + feb_InterestAmt + mar_InterestAmt + apr_InterestAmt + may_InterestAmt + jun_InterestAmt + 
                    jul_InterestAmt + aug_InterestAmt + sep_InterestAmt + oct_InterestAmt + nov_InterestAmt + dec_InterestAmt

                poSumView.push({title: "MONTHLY COLLECTION", sortkey: 13, group: 1, jan_value : jan_CollectAmt, feb_value : feb_CollectAmt, mar_value : mar_CollectAmt, 
                    apr_value : apr_CollectAmt, may_value : may_CollectAmt, jun_value : jun_CollectAmt, jul_value : jul_CollectAmt, 
                    aug_value : aug_CollectAmt, sep_value : sep_CollectAmt, oct_value : oct_CollectAmt, nov_value : nov_CollectAmt, dec_value : dec_CollectAmt
                
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

            poSumView.push({title: "MONTHLY LOAN PORTFOLIO", sortkey: 13, group: 1, jan_value : janRunBalAmt, feb_value : febRunBalAmt, mar_value : marRunBalAmt, 
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

//                console.log(viewUnitCode)
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


                    console.log(fndUnitBudgExecTotLonAmt)

                    if (isNull(fndUnitBudgExecTotLonAmt)) { 
                        let newPoExecSumBudg = new Budg_exec_sum({
                            region: "NOL", area: "NEL", branch: vwBranchCode, unit: vwUnitCode, title: "TOTAL AMOUNT OF LOAN", view_code: "TotLoanAmt", jan_budg : janTotAmtLoan, 
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
            
            poSumView.sort( function (a,b) {
                if ( a.sortkey < b.sortkey ){
                    return -1;
                }
                if ( a.sortkey > b.sortkey ){
                    return 1;
                }
                return 0;
            })

        res.render('units/viewUnitTargetMon', {
            vwUniCod: viewUnitCode,
            poSumView: poSumView
        })
    } catch (err) {
        console.log(err)
        res.redirect('/units/'+ viewUnitCode)
    }
})


// View UNIT PROJECTED COLLECTIONS ROUTE
router.get('/viewUnitProjInc/:id', async (req, res) => {

    const viewUnitCode = req.params.id
    const vwUnitCode = viewUnitCode
    const vwBranchCode = vwUnitCode.substr(0,3)

    let foundPOV = []
    // let foundCenterDet = []

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
    try {


        res.render('units/viewUnitProjInc', {
            vwUniCod: viewUnitCode,
            poSumView: poTotLoanAmtArray
        })
    } catch (err) {
        console.log(err)
        res.redirect('/units/'+ viewUnitCode)
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
