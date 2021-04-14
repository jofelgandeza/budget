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
            budgBegBal = _.sumBy(foundCenters, function(o) { return o.budget_BegBal; });
            budgEndBal = oClient + newClients 
            totDisburse = nClientAmt + oClientAmt
            tbudgEndBal = (oClient + newClients) - rClient

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
