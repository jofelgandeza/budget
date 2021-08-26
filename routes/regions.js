
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
const Area = require('../models/area')
const Employee = require('../models/employee')

const { authUser, authRole } = require('../public/javascripts/basicAuth.js')
const { ROLE } = require('../public/javascripts/data.js')

// let LoggedUser = {}
// app.use(setSysUser)

router.get('/:id', authUser, authRole(ROLE.RD),  async (req, res) => {

    const regionCode = req.params.id
    const _user = req.user
    let searchOptions = {}
    let fndRegion = []

    if (req.query.title  !=null && req.query.title !== '') {
        searchOptions.description = RegExp(req.query.title, 'i')
    }
    try {

        const foundRegion = await Region.findOne({region: regionCode})
        fndRegion = foundRegion
        console.log(fndRegion)

        branchName = "REGION BUDGET MODULE VIEW"
        res.render('regions/index', {
            regionCode: regionCode,
            regionDesc: fndRegion.region_desc,
            searchOptions: req.query,
            yuser: _user,
            dateToday: new Date()
        })
    } catch (err) {
        console.log(err)
        res.redirect('/')
    }
})

// GET AREA for Maintenance
router.get('/areas/:id', authUser, authRole(ROLE.RD), async (req, res) => {

    const regionCode = req.params.id
    const _user = req.user

    let foundArea = []
    let sortedEmp = []
    let fndArea = []
    let fndAreas = []
    let sortedAreas = []
    let doneReadRegion = false

    let empName = []

    try {

        const fnd_area = await Area.find({region: regionCode}, function (err, fnd_Areas) {
            fndArea = fnd_Areas
        })
        
        let fndEmployee = await Employee.find({region: regionCode})
        
    //            const fndEmployees = foundEmployees
    //            const empStatus = fndEmployees.status
        if (fndArea.length === 0) {
            doneReadRegion = true
        } else {
            fndArea.forEach(fndAreas =>{
                id = fndAreas._id
                areaCode = fndAreas.area
                areaDesc = fndAreas.area_desc
                areaEmp = fndAreas.emp_code

                // picked = lodash.filter(arr, { 'city': 'Amsterdam' } );
                empName = _.filter(fndEmployee, {'emp_code': areaEmp})

                if (empName.length === 0) {
                } else {
                    employeeName = empName.first_name + " " + _.trim(empName.middle_name).substr(0,1) + ". " + empName.last_name
                }
                foundArea.push({id: id, regionCode: regionCode, areaCode: areaCode, areaDesc: areaDesc, areaEmp: areaEmp, empName: empName})

                doneReadRegion = true
            })

                console.log(foundArea)
            
                sortedAreas= foundArea.sort( function (a,b) {
                    if ( a.areaCode < b.areaCode ){
                        return -1;
                    }
                    if ( a.areaCode > b.areaCode ){
                        return 1;
                    }
                    return 0;
                })
        }

        if (doneReadRegion) {
            res.render('regions/area', {
            regionCode: regionCode,
            fondAreas: sortedAreas,
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
router.get('/setRegionAreas/:id', authUser, authRole(ROLE.RD), async (req, res) => {

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
        })

        if (regAreas.length === 0) {
            doneReadCtr = true
        }
        
        if (doneReadCtr) {
            res.render('regions/area', {
                regionCode: regionCod,
                Areas: foundArea,
                yuser: yuser
            })
        }
    } catch (err) {
        console.log(err)
        res.redirect('/regions/region')
    }
})

//
router.get('/setNewArea/:id', authUser, authRole(ROLE.RD), async (req, res) => {

    const yuser = req.user

    let foundAreas = []
    
    let numAreas = 0
    let doneReadPOs = false
    
    try {
        
        foundAreas = await Region.find({})

            res.render('regions/setNewAreas', {
                fondAreas: foundAreas,
                numAreas: numAreas,
                uniCod: unitCode,
                lonType: loanType,
                searchOptions: req.query,
                yuser: yuser
            })
    } catch (err) {
        console.log(err)
        res.redirect('/regions/'+unitCode)
    }
})

//GET AREAS
router.get('/newArea/:id', authUser, authRole(ROLE.RD), async (req, res) => {
    const regionCod = req.params.id

    res.render('regions/newArea', {
        regionCode: regionCod,
        area: new Area()
    })
})

router.post('/postNewArea/:id', authUser, authRole(ROLE.RD), async (req, res) => {

    const regionCod = req.params.id
    let locals
    let canProceed = false
    const area_code = _.trim(req.body.areaCode).toUpperCase()
    const area_desc = _.trim(req.body.areaDesc).toUpperCase()

    let fndArea = [ ]
    try {
        
        const getExisArea = await Area.findOne({area: area_code}, function (err, foundArea) {
            fndArea = foundArea
        })

        console.log(fndArea)

        if (isNull(fndArea)) {
            canProceed = true 
        } else {
            canProceed = false
            locals = {errorMessage: "Area Code already exists!"}
        }

        console.log(canProceed)
        
        if (canProceed) {
            let nArea  = new Area({

                area: area_code,
                area_desc: area_desc,
                emp_code: "",
                office_loc: "",
                address: "None",
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
                region: regionCod,
                status: "Active"
            })
        
            const saveUser = nArea.save()

            res.redirect('/regions/areas/' + regionCod)

        } else {
            res.redirect('/regions/areas/' + regionCod)
        }

    } catch (err) {
        console.log(err)
        res.redirect('/regions/' + req.user.assCode)
    }
})  

 // Get a AREA for EDIT
 router.get('/getAreaForEdit/:id/edit', authUser, authRole(ROLE.RD), async (req, res) => {

    const parame = req.params.id // 'Region ' + region.id

    const regionCod = _.trim(parame.substr(0,3))
    const param = _.trim(parame.substr(3,50))

    const uUnit = req.body.uUnit
    const _user = req.user

    let fondArea = []
    let regID = ""

    try {

        const regForEdit = await Area.findById(param)  
        regID = regForEdit.id

        fondArea = regForEdit
        console.log(fondArea)

        res.render('regions/editArea', { 
            regID: regID,
           area: fondArea, 
           regionCode: regionCod,
           yuser : _user
       })

    } catch (err) {
            console.log(err)
            let locals = {errorMessage: 'Something WENT went wrong.'}
            res.redirect('/regions/area/'+ param)
    }
})

// SAVE EDITed Region

router.put('/putEditedArea/:id', authUser, authRole(ROLE.RD), async function(req, res){

    const parame = req.params.id // regionCode + region.id
    const paramsID = parame.substr(0,3)
    const param = _.trim(parame.substr(3,25))
    const area_code = _.trim(req.body.areaCode).toUpperCase()
    const area_desc = _.trim(req.body.areaDesc).toUpperCase()

    console.log(req.params.id)

    let area
        try {

            area = await Area.findById(param)

            area.area = area_code,
            area.area_desc = area_desc
        
            await area.save()
        
            res.redirect('/regions/areas/'+ paramsID)

        } catch (err) {
            console.log(err)
            let locals = {errorMessage: 'Something WENT went wrong.'}
            res.redirect('/regions/areas/'+ paramsID, {
            locals: locals
            })
        }
  
})

//
router.delete('/deleteArea/:id', authUser, authRole(ROLE.RD), async (req, res) => {

    
    let regArea

    try {
        regArea = await Area.findById(req.params.id)
        delRegionCode = regArea.region
        await regArea.remove()  
        res.redirect('/regions/areas/'+delRegionCode)
    } catch (err) {
        console.log(err)
    }
})

//View EMPLOYEES per BRANCH Level - TUG

router.get('/employees/:id', authUser, authRole(ROLE.RD), async (req, res) => {

    const regionCode = req.params.id
    const _user = req.user
    
    const areaMgrID = "611d088fdb81bf7f61039615"

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
    let Areas = []
    
    try {

        const fnd_area = await Area.find({region: regionCode}, function (err, fndAreas) {
            Areas = fndAreas
        })

        const brnEmployees = await Employee.find({position_code: areaMgrID, region: regionCode}, function (err, foundEmployees) {
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
                areaCode = foundEmp.area
                let exist = false

                const empAssign = _.find(Areas, {area: empAss})
                
                fondEmploy.push({empID: empID, area: areaCode, empName: empName, empCode: empCode, empPostCode: empPostCode, empPost: empAssign.area_desc})
                
            })
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

        // if (fndEmployees.length === 0) {
        //     empCanProceed = true
        // }

    if (empCanProceed)
        res.render('regions/employee', {
            regionCode: regionCode,
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
router.get('/newEmployee/:id', authUser, authRole(ROLE.RD), async (req, res) => {
    
    const regionCode = req.params.id
    const _user = req.user

    // regionPosiID = "611d094bdb81bf7f61039616"
    let foundArea = []
    let fndAreas = []

    try {

        foundArea = await Area.find({emp_code: ""})

           console.log(foundArea)
           const newEmp = new Employee()
           const newUser = new User()
   
            res.render('regions/newEmployee', { 
               emp: newEmp, 
               user: newUser,
               regionCode: regionCode,
               areaAsignDesc: "",
               foundArea: foundArea,
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
router.post('/postNewEmp/:id', authUser, authRole(ROLE.RD), async (req, res) => {
    const _user = req.user
   let eUnit
   let ePONum
   const empAreaCod = req.body.area
    const nEmpCode = _.trim(req.body.empCode)
    const nEmail = _.trim(req.body.email).toLowerCase()
    const nLName = _.trim(req.body.lName).toUpperCase()
    const nFName = _.trim(req.body.fName).toUpperCase()
    const nMName = _.trim(req.body.mName).toUpperCase()
    const nName =  nLName + ", " + nFName + " " + nMName

    const areaMgrID = "611d088fdb81bf7f61039615"

    const regionPosiID = "611d094bdb81bf7f61039616"

    console.log(req.body.password)

    
let locals
//console.log(brnCode)
let getExistingUser = []
let canProceed = false
let UserProceed = false

try {

    const branchEmployees = await Employee.find({position: areaMgrID})
    console.log(branchEmployees)

    const sameName = _.find(branchEmployees, {last_name: nLName, first_name: nFName, middle_name: nMName})

    const sameCode = _.find(branchEmployees, {emp_code: nEmpCode})

    const sameAssign = _.find(branchEmployees, {assign_code: empAreaCod})
    console.log(sameAssign)

    if (branchEmployees.length === 0) {
        if (sameName) {
            locals = {errorMessage: 'Employee Name: ' + nName + ' already exists!'}
            canProceed = false
        } else if (sameAssign) {
            locals = {errorMessage: 'Assign Code: ' + empAreaCod + ' already exists!'}
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
            const poAssignCode = await Area.findOneAndUpdate({"area": empAreaCod}, {$set:{"emp_code": req.body.empCode}})
        // } 

        addedNewUser = true
        
        let employee = new Employee({

            emp_code: nEmpCode,
            last_name: nLName,
            first_name: nFName,
            middle_name: nMName,
            position_code: areaMgrID,
            assign_code: empAreaCod,
            po_number: 'N/A',
            unit: 'N/A',
            branch: 'N/A',
            area: empAreaCod,
            region: req.params.id
        })
        
        const newCoa = employee.save()

        let nUser = new User({
            email: nEmail,
            password: hashedPassword,
            name: nName,
            emp_code: nEmpCode,
            assCode: empAreaCod,
            role: 'AM',
            region: req.params.id,
            area: empAreaCod,
        })
        const saveUser = nUser.save()

        res.redirect('/regions/employees/'+ req.params.id)
    } 
    else {
        let regionAreas = []
        const rePosition = await Region.find({region: req.params.id}, function (err, fnd_Post) {
            regionAreas = fnd_Post
        })

        let errEmp = []
        let errUser = []

            errUser.push({email: nEmail, password: req.body.password})

            errEmp.push({emp_code: nEmpCode, branch: brnCode, last_name: nLName, first_name: nFName, middle_name: nMName, position_code: emPostCod, unit: eUnit, po_number: ePONum})
            console.log(errEmp)

            res.render('regions/newEmployee', { 
                emp: errEmp, 
                user: errUser,
                regionCode: req.params.id,
                foundArea: regionAreas,
                 yuser: _user,
                newEmp: true,
                resetPW: false,
                locals: locals
            })
}


} catch (err) {
    console.log(err)
   let locals = {errorMessage: 'Something WENT went wrong.'}
    res.redirect('/regions/employees/'+ req.params.id)
}
})

// Get an Employee for EDIT
router.get('/getEmpForEdit/:id/edit', authUser, authRole(ROLE.RD), async (req, res) => {

    const parame = req.params.id // regionCode + region.id
    const regionCode = parame.substr(0,3)
    const empCode = _.trim(parame.substr(3,10))

    areaCod = req.body.area

    console.log(empCode)
    const _user = req.user
    let locals = ""
    let foundEmploy = []
    let regionAreas = []
     
   try {
        let brnCod
        const emRegion = await Area.find({region: regionCode}, function (err, fnd_Post) {
            regionAreas = fnd_Post
        })
        console.log(regionAreas)

        const employe = await Employee.findOne({emp_code: empCode}, function (err, foundEmp) {
//            console.log(foundlist)
            foundEmploy = foundEmp
            brnCod = foundEmp.branch
        })
        // console.log(employe)
        const newUser = new User()

        res.render('regions/editEmployee', {
            regionCode: regionCode,
            foundArea: regionAreas,
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
       res.redirect('employees/'+ regionCode)
   }
})

// SAVE EDITed Employee

router.put('/putEditedEmp/:id', authUser, authRole(ROLE.RD), async function(req, res){

    const paramsID = req.params.id
        console.log(paramsID)

    const regionCod = paramsID.substr(0,3)
    const empID = _.trim(paramsID.substr(3,45))

    const assCode = req.body.area
    const areaCod = req.body.area

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
            employee.area = eAssCode
        
            await employee.save()
        
                const poAssignCode = await Area.findOneAndUpdate({"area": areaCod}, {$set:{"emp_code": eCode}})

                const userAssignCode = await User.findOneAndUpdate({"assCode": eAssCode}, {$set:{"name": nName, "emp_code": eCode, "region": regionCod, "area": areaCod }})

                res.redirect('/regions/employees/'+ regionCod)

        } catch (err) {
            console.log(err)
            let locals = {errorMessage: 'Something WENT went wrong.'}
            res.redirect('/regions/employees/'+ regionCod, {
            locals: locals
            })
        }
  
})

// GET Employee User for RESET PASSWORD
router.get('/getEmpEditPass/:id/edit', authUser, authRole(ROLE.RD), async (req, res) => {

    const parame = req.params.id // regionCode + emp_code
    const regionCode = parame.substr(0,3)
    const empCode = _.trim(parame.substr(3,10))


   const paramsID = req.params.id
        console.log(paramsID)
    const branCod = req.body.branCode
    const empID = req.params.id

    const _user = req.user
    let locals = ""
    let areaAsignCode = ""
    let areaAsignDesc = ""
    let foundEmploy = []
    let regionAreas = []
    
    let ass_Code = ""

   try {

        const employe = await Employee.findOne({emp_code: empCode}, function (err, foundEmp) {
//            console.log(foundlist)
            foundEmploy = foundEmp
            brnCod = foundEmp.branch
            possit = _.trim(foundEmploy.position_code)
           console.log(possit)
           areaAsignCode = foundEmploy.assign_code
        })
        
        const emPosit = await Area.findOne({area: areaAsignCode}, function (err, fndArea) {
            areaAsignDesc = fndArea.area_desc
            regionAreas = fndArea
        })
    
            // console.log(employe)
        const yoser = await User.findOne({assCode: areaAsignCode}, function (err, foundUser) {
            //            console.log(foundlist)
            fndUser = foundUser
            console.log(fndUser)
        })

        yoser.password = ""
            
        res.render('regions/resetPassword', {
            regionCode: regionCode,
            areaAsignDesc: areaAsignDesc,
            foundArea: regionAreas,
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

router.put('/putEditedPass/:id', authUser, authRole(ROLE.RD), async function(req, res){

    const paramsID = req.params.id // regionCode + areaCode

    const regionCod = paramsID.substr(0,3)
    // empID = req.params.id
    const areaCod = _.trim(paramsID.substr(3,10))
    const newPassword = _.trim(req.body.password)
    const userID = req.body.user_id

    // let getExistingUser
    
        try {
            const hashdPassword = await bcrypt.hash(newPassword, 10)
            let getExistingUser = await User.findOne({assCode: areaCod})

                getExistingUser.password = hashdPassword
                const savedNewPW = getExistingUser.save()
        
            res.redirect('/regions/employees/'+ regionCod)

        } catch (err) {
            console.log(err)
            let locals = {errorMessage: 'Something WENT went wrong.'}
            res.render('/regions/employee/'+ regionCod, {
            locals: locals
            })
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