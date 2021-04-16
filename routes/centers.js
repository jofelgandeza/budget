const express = require('express')
const router  = express.Router()
const Swal = require('sweetalert2')
const Center = require('../models/center')
const Employee = require('../models/employee')
const Loan_type = require('../models/loan_type')
const _ = require('lodash')
const Cleave = require('../public/javascripts/cleave.js')
const sortArray = require('../public/javascripts/sortArray.js')
const { forEach } = require('lodash')

const monthSelect = ["January","February", "March", "April", "May", "June", "July", "August", "September", "October", "November","December"];


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
    const assignCode = IDcode.substr(0,5)

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
   
  console.log(foundCenter)

    
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
                    console.log(resignClient)
                    console.log(resloanTot)

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

        console.log(poLoanGrandTot)

        poLoanGrandTot.push({nClient: nClient, nClientAmt: nClientAmt, oClient: oClient, oClientAmt: oClientAmt, 
            rClient: rClient, bClient: bClient, budgEndBal: tbudgEndBal, totDisburse: totDisburse})

//       console.log(poLoanGrandTot)

            res.render('centers/index', {
                POname: POname,
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
           
           foundPOunits.sort( function (a,b) {
            if ( a.assign_code < b.assign_code ){
                return -1;
              }
              if ( a.assign_code > b.assign_code ){
                return 1;
              }
              return 0;
           })

        console.log(foundPOunits)
   
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

        console.log(officerName)
//        console.log(foundPOunits)
        console.log(programOfficers)

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
            console.log(foundPOunits)
 
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
            console.log(ewan)

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
        console.log(forSortTargets)

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
   console.log(unit_ID)
   let forSortTargets = []
   let sortedTargets = []  
    let loanType = []

   try {

       loType = await Loan_type.find({glp_topUp:true}, function (err, foundLoan) {
           loanType = foundLoan
       })
       console.log(loanType)

//        console.log(loanType)
       const center = await Center.findOne({center: req.params.id}, function (err, foundlist) {

           foundlist.Loan_beg_bal.forEach( begBalList => {
               const _id = begBalList._id
               const loanCode = begBalList.loan_type
               const begBalAmt = begBalList.beg_amount
               const begBalClientCnt = begBalList.beg_client_count
               const sortKey = _.toString(begBalList.dispView + loanCode)
               let lnType = ""
               
               loanType.forEach( lonTyp => {
                   if (_.trim(lonTyp.title) === _.trim(loanCode)) {
                    lnType = lonTyp.title
                   }
               })

               forSortTargets.push({_id: _id, sortKey: sortKey, loanCode: loanCode, loan_type: lnType, begBalAmt: begBalAmt, begBalClientCnt: begBalClientCnt})
           } )

       })
       console.log(forSortTargets)

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
               newListItems: sortedTargets
           });


   } catch (err) {
       console.log(err)
       res.redirect('/centers')
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

      const centerFound = await Center.findOne({center: centerCode}, function(err, foundList){ 
        if (err) {
            console.log(err)
        }
        else {
            console.log(foundList)
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

            const curTargets = foundList.Targets
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
                    if (target.loan_type === loanType && _.trim(target.remarks) === "New Loan") {
                        hasNewLoan = true
                        hasLoanType = tarLoanType
                        newLoanCount = target.numClient
                    }
                    if (hasNewLoan && hasLoanType === loanType && _.trim(remarks) === "Re-loan") {
                        oldLoanCount  = numClient
                    }
                    resiClient = newLoanCount - oldLoanCount
                })
            }
            console.log(resiClient)
            item = {
                loan_type: loanType,
                month: month,
                semester: semester,
                numClient: numClient  ,
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

    } catch(err) {
        console.log(err)
    }
  
  })

// PUT /save Beginning Balances per center

  router.put("/putBegBal/:id", async function(req, res){
    const loanType = req.body.loanType
    const bClientCnt = _.toNumber(_.replace(req.body.numClient,',',''))
    const bBalAmt = _.toNumber(_.replace(req.body.begBalAmt,',',''))
    const centerCode = req.params.id

    let fnView = 0
    let item =[]

    try {
    const loanViewOrder = await Loan_type.findOne({title: _.trim(loanType)}, function(err, foundloanView) {
        if (!err) {
            const finView = foundloanView.display_order
            fnView = finView
      } else {
            console.log(err)
        }
    })

      const centerFound = await Center.findOne({center: centerCode}, function(err, foundList){ 
        if (err) {
            console.log(err)
        }
        else {
            console.log(foundList)

            const curLoanBeg = foundList.Loan_beg_bal
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

    } catch(err) {
        console.log(err)
    }
  
  })

//  router.get('/:id/edit', async (req, res) => {
 
router.post('/delete', async (req, res) => {
 //   alert('Are you sure you want to delete this record?')
     let centerCode = req.body.listName
     const checkedItemId = req.body.checkbox
     const listName = _.trim(req.body.listName)

     let delNewClient = 0
     let delNewClientAmt = 0
     let delOldClient = 0
     let delOldClientAmt = 0

    console.log(checkedItemId)
    console.log(centerCode)
    let center
    try {       

        modifyCenter = Center.findOne({center: listName}, function(err, foundModCenter) {

            const foundTargets = foundModCenter.Targets

            foundTargets.forEach(poTarget => {

                console.log(checkedItemId)

                if (_.trim(poTarget._id) === checkedItemId) {
                    if (_.trim(poTarget.remarks) === "New Loan") {
                        delNewClient = poTarget.numClient
                        delNewClientAmt = poTarget.totAmount
                        foundModCenter.newClient = foundModCenter.newClient - delNewClient
                        foundModCenter.newClientAmt = foundModCenter.newClientAmt - delNewClientAmt
                    } else {
                        delOldClient = poTarget.numClient
                        delOldClientAmt = poTarget.totAmount                        
                        foundModCenter.oldClient = foundModCenter.oldClient - delOldClient
                        foundModCenter.oldClientAmt = foundModCenter.oldClientAmt - delOldClientAmt                                }
                }
            })
            
           foundModCenter.save()

            console.log(delNewClientAmt)
            console.log(delOldClientAmt)

        })        

        center = await Center.findOneAndUpdate({center: listName}, {$pull: {Targets :{_id: checkedItemId }}}, function(err, foundList){
            if (!err) {
               console.log(foundList)


//                const foundTarget = foundList.Target.findOne({_id: checkedItemId})
//                foundList.save();

                res.redirect('/centers/' + centerCode + '/edit')

            } else {
                console.log(err)
            }
        })

    } catch (err) {
        console.log(err)
      }   
})

router.post('/delBegBal', async (req, res) => {
    //   alert('Are you sure you want to delete this record?')
        let centerCode = req.body.listName
        const checkedItemId = req.body.checkbox
        const listName = _.trim(req.body.listName)
      
       console.log(checkedItemId)
       console.log(centerCode)
       let center
       try {       
      
           center = await Center.findOneAndUpdate({center: listName}, {$pull: {Loan_beg_bal :{_id: checkedItemId }}}, function(err, foundList){
               if (!err) {
                  console.log(foundList)
   
                   res.redirect('/centers/setBegBal/' + centerCode)
   
               } else {
                   console.log(err)
               }
           })
   
        } catch (err) {
           console.log(err)
        }  
   //      console.log(center)
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
