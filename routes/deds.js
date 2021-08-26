
const express = require('express')
const router  = express.Router()
const app = express()
const bodyParser = require('body-parser')
const methodOverride = require('method-override')
const { model } = require('mongoose')
const bcrypt = require('bcrypt')
const { forEach, isNull } = require('lodash')
const _ = require('lodash')

const User = require('../models/user')
const Region = require('../models/region')
const Employee = require('../models/employee')

const { authUser, authRole } = require('../public/javascripts/basicAuth.js')
const { ROLE } = require('../public/javascripts/data.js')

// let LoggedUser = {}
// app.use(setSysUser)

router.get('/', async (req, res) => {
    // res.send('Admin Page')
    const _user = req.user
    const logUser = req.user
    res.render('deds/index', {
        dateToday: new Date(),
        ded: "DED",
        yuser : logUser
    })
})

router.get('/region/:id', async (req, res) => {

    const ded = req.params.id
    const _user = req.user

    let foundRegion = []
    let sortedEmp = []
    let fndRegion = []
    let fndRegions = []
    let doneReadRegion = false

    let empName = []

    try {

        fndRegion = await Region.find()
        
        let fndEmployee = await Employee.find()
        
    //            const fndEmployees = foundEmployees
    //            const empStatus = fndEmployees.status
        if (isNull(fndRegion)) {
        } else {
            fndRegion.forEach(fndRegions =>{
                id = fndRegions._id
                regionCode = fndRegions.region
                regionDesc = fndRegions.region_desc
                regionEmp = fndRegions.emp_code

                // picked = lodash.filter(arr, { 'city': 'Amsterdam' } );
                empName = _.filter(fndEmployee, {'emp_code': regionEmp})

                if (empName.length === 0) {
                } else {
                    employeeName = empName.first_name + " " + _.trim(empName.middle_name).substr(0,1) + ". " + empName.last_name
                }
                foundRegion.push({id: id, regionCode: regionCode, regionDesc: regionDesc, regionEmp: regionEmp, empName: empName})

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
                searchOptions: req.query,
                yuser: yuser
            })
    } catch (err) {
        console.log(err)
        res.redirect('/deds/'+ "DED")
    }
})

router.get('/newRegion', async (req, res) => {
    // res.send('User Registration Page!')

    res.render('deds/newRegion', {
        ded: 'DED',
        region: new Region()
    })
})

router.post('/postNewRegion/:id', async (req, res) => {

    let locals
    let canProceed = false
    const ded = req.params.id
    const region_code = _.trim(req.body.regionCode).toUpperCase()
    const region_desc = _.trim(req.body.regionDesc).toUpperCase()
    let fndRegion = [ ]
    try {
        
        const getExisRegion = await Region.findOne({region: region_code}, function (err, foundRegion) {
            fndRegion = foundRegion
        })

        console.log(fndRegion)

        if (isNull(fndRegion)) {
            canProceed = true 
        } else {
            canProceed = false
            locals = {errorMessage: "Region Code already exists!"}
        }

        console.log(canProceed)
        
        if (canProceed) {
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
        
            const saveUser = nRegion.save()

            res.redirect('/deds/region/' + ded)

        } else {
            res.redirect('/deds/region/' + ded)
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

    try {

        const regForEdit = await Region.findById(param)  
        regID = regForEdit.id
        fondRegion = regForEdit
        console.log(fondRegion)

        res.render('deds/editRegion', { 
            regID: regID,
           region: fondRegion, 
           ded: "DED",
           yuser : _user
       })

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
    const region_desc = _.trim(req.body.regionDesc).toUpperCase()

    console.log(req.params.id)

    let region
        try {

            region = await Region.findById(param)

            region.region = region_code,
            region.region_desc = region_desc
        
            await region.save()
        
            res.redirect('/deds/region/'+ 'DED')

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

    let empCanProceed = false
    let fndEmployees = []
    
    try {

        const regions = await Region.find()

        const brnEmployees = await Employee.find({position_code: regDirID}, function (err, foundEmployees) {
            const fndEmployees = foundEmployees

//            const empStatus = fndEmployees.status
//  - Area ID
            fndEmployees.forEach(foundEmp =>{
                empPst = foundEmp.position_code
                empID = foundEmp._id
                empName = foundEmp.last_name + ", " + foundEmp.first_name + " " + foundEmp.middle_name.substr(0,1) + "."
                empCode = foundEmp.emp_code
                empUnit = foundEmp.unit
                empUnitPOnum = foundEmp.unit + foundEmp.po_number
                empAss = foundEmp.assign_code
                let exist = false

                const empAssign = _.find(regions, {region: empAss})
                
                fondEmploy.push({empID: empID, area: areaCode, empName: empName, empCode: empCode, empPostCode: empPostCode, empPost: empAssign.region_desc})
                
                empCanProceed = true            
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
    
            res.render('deds/employee', {
                ded: "DED",
                fndEmploy: sortedEmp,
                searchOptions: req.query,
                yuser: _user
            })
        })

} catch (err) {
        console.log(err)
        res.redirect('/')
    }
})


// New EMPLOYEE Route
router.get('/newEmployee/:id', authUser, authRole(ROLE.DED), async (req, res) => {
    
    const areaCode = req.params.id
    const _user = req.user

    // regionPosiID = "611d094bdb81bf7f61039616"
    let foundRegion = []
    let fndRegions = []

    try {

        foundRegion = await Region.find({emp_code: ""})

           console.log(foundRegion)
           const newEmp = new Employee()
           const newUser = new User()
   
            res.render('deds/newEmployee', { 
               emp: newEmp, 
               user: newUser,
               ded: "DED",
               foundRegion: foundRegion,
               yuser: _user,
               newEmp: true,
               resetPW: false
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
   const empRegCod = req.body.region
    const nEmpCode = _.trim(req.body.empCode)
    const nEmail = _.trim(req.body.email).toLowerCase()
    const nLName = _.trim(req.body.lName).toUpperCase()
    const nFName = _.trim(req.body.fName).toUpperCase()
    const nMName = _.trim(req.body.mName).toUpperCase()
    const nName =  nLName + ", " + nFName + " " + nMName
    const empID = req.params.id

    const regionPosiID = "611d094bdb81bf7f61039616"

    console.log(req.body.password)

    
let locals
//console.log(brnCode)
let getExistingUser = []
let canProceed = false
let UserProceed = false

try {

    const branchEmployees = await Employee.find({position: regionPosiID})
    console.log(branchEmployees)

    const sameName = _.find(branchEmployees, {last_name: nLName, first_name: nFName, middle_name: nMName})

    const sameCode = _.find(branchEmployees, {emp_code: nEmpCode})

    const sameAssign = _.find(branchEmployees, {assign_code: empRegCod})
    console.log(sameAssign)

    if (branchEmployees.length === 0) {
        if (sameName) {
            locals = {errorMessage: 'Employee Name: ' + nName + ' already exists!'}
            canProceed = false
        } else if (sameAssign) {
            locals = {errorMessage: 'Assign Code: ' + empRegCod + ' already exists!'}
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
        // if (ePosition === "REG_DIR") {
            const poAssignCode = await Region.findOneAndUpdate({"region": empRegCod}, {$set:{"emp_code": req.body.empCode}})
        // } 

        addedNewUser = true
        
        let employee = new Employee({

            emp_code: nEmpCode,
            last_name: nLName,
            first_name: nFName,
            middle_name: nMName,
            position_code: regionPosiID,
            assign_code: empRegCod,
            po_number: 'N/A',
            unit: 'N/A',
            branch: 'N/A',
            area: 'N/A',
            region: empRegCod
        })
        
        const newCoa = employee.save()

        let nUser = new User({
            email: nEmail,
            password: hashedPassword,
            name: nName,
            emp_code: nEmpCode,
            assCode: empRegCod,
            role: 'RD',
            region: empRegCod,
            area: "",
        })
        const saveUser = nUser.save()

        res.redirect('/deds/employees/'+ 'DED')
    } 
    else {
        let psitCode = []
        const rePosition = await Region.find({group_code: "BRN"}, function (err, fnd_Post) {
             psitCode = fnd_Post
        })
        console.log(psitCode)
        let errEmp = []
        let errUser = []

            errUser.push({email: nEmail, password: req.body.password})

            errEmp.push({emp_code: nEmpCode, branch: brnCode, last_name: nLName, first_name: nFName, middle_name: nMName, position_code: emPostCod, unit: eUnit, po_number: ePONum})
            console.log(errEmp)

            res.render('deds/newEmployee', { 
                emp: errEmp, 
                user: errUser,
                ded: "DED",
                foundRegion: foundRegion,
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
     
   try {
        let brnCod
        const emRegion = await Region.find({}, function (err, fnd_Post) {
            dedRegions = fnd_Post
        })
        console.log(dedRegions)

        const employe = await Employee.findOne({emp_code: empCode}, function (err, foundEmp) {
//            console.log(foundlist)
            foundEmploy = foundEmp
            brnCod = foundEmp.region
        })
        // console.log(employe)
        const newUser = new User()

        res.render('deds/editEmployee', {
            ded: ded,
            foundRegion: dedRegions,
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
       res.redirect('deds/employees/'+ ded)
   }
})

// SAVE EDITed Employee

router.put('/putEditedEmp/:id', authUser, authRole(ROLE.DED), async function(req, res){

    const paramsID = req.params.id // ded + emp.ID
        console.log(paramsID)

    const ded = paramsID.substr(0,3)
    const empID = _.trim(paramsID.substr(3,45))

    const assCode = req.body.region
    const regionCod = req.body.region

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
            employee.region = eAssCode
        
            await employee.save()
        
                const poAssignCode = await Region.findOneAndUpdate({"region": regionCod}, {$set:{"emp_code": eCode}})

                const userAssignCode = await User.findOneAndUpdate({"assCode": eAssCode}, {$set:{"name": nName, "emp_code": eCode, "region": regionCod}})

                res.redirect('/deds/employees/'+ ded)

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
    const empCode = _.trim(parame.substr(3,10))


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

   try {
        const employe = await Employee.findOne({emp_code: empCode}, function (err, foundEmp) {
//            console.log(foundlist)
            foundEmploy = foundEmp
            brnCod = foundEmp.branch
            possit = _.trim(foundEmploy.position_code)
           console.log(possit)
           regionAsignCode = foundEmploy.assign_code
        })
        
        const region = await Region.findOne({region: regionAsignCode}, function (err, fndArea) {
            areaAsignDesc = fndArea.area_desc
            dedRegions = fndArea
        })
    
            // console.log(employe)
        const yoser = await User.findOne({assCode: regionAsignCode}, function (err, foundUser) {
            //            console.log(foundlist)
            fndUser = foundUser
            console.log(fndUser)
        })

        yoser.password = ""
            
        res.render('deds/resetPassword', {
            ded: "DED",
            region: region,
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
        
            res.redirect('/deds/employees/'+ ded)

        } catch (err) {
            console.log(err)
            let locals = {errorMessage: 'Something WENT went wrong.'}
            res.redirect('/deds/employees/'+ ded)
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