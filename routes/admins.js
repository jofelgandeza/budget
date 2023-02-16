
const express = require('express')
const router  = express.Router()
const app = express()
const bodyParser = require('body-parser')
const methodOverride = require('method-override')
const { model } = require('mongoose')
const bcrypt = require('bcryptjs')
const { forEach, isNull, isEmpty } = require('lodash')
const _ = require('lodash')
const { authUser, authRole } = require('../public/javascripts/basicAuth.js')
const { ROLE } = require('../public/javascripts/data.js')

const User = require('../models/user')
const Region = require('../models/region')
const Area = require('../models/area')
const Branch = require('../models/branch')

const Employee = require('../models/employee')
const Setting = require('../models/setting')
const region = require('../models/region')
const employee = require('../models/employee')

// let LoggedUser = {}
// app.use(setSysUser)

router.get('/:id', authUser, authRole(ROLE.ADMIN), async (req, res) => {
    // res.send('Admin Page')
    console.log("From Index view " + ROLE.ADMIN)
    const logUser = req.user
    res.render('admins/index', {
        yuser : logUser
    })
})

//View BUDGET SETTINGS

router.get('/settings/:id', authUser, authRole(ROLE.ADMIN), async (req, res) => {

    const _user = req.user

    console.log(ROLE.AM)
    
    const regDirID = "611d094bdb81bf7f61039616"

    const statSelect = ["OPEN","CLOSED"]

    let fndBudgSetting = []

    let doneReadSetting = false
    
    try {

        const budg_setting = await Setting.find({}) //, function (err, foundSettings) {

        if (budg_setting.length > 0) {
            budg_setting.forEach(fndSet =>{
                budget_Mode = fndSet.status
                
                let starDet = fndSet.start_budget_date
                let endDet = fndSet.end_budget_date


                fndBudgSetting.push({budget_year: fndSet.budget_year, start_budget_date: starDet,
                    end_budget_date: endDet, status: fndSet.status})
            })
            doneReadSetting = true            
        } else {
            fndBudgSetting.push({budget_year: "2023" , start_budget_date: new Date(),
                end_budget_date: new Date(), status: "OPEN"})
         }
         const startDate = new Date()
         const endDate = new Date()
        // console.log(Date.now())
        // if (doneReadSetting) {
            res.render('admins/setting', {
                admin: "ADMIN",
                startDate: startDate,
                endDate: endDate,
                fndSetting: fndBudgSetting,
                statSelect: statSelect,
                searchOptions: req.query,
                yuser: _user
            })
    // }
} catch (err) {
        console.log(err)
        res.redirect('/')
    }
})

// saveSettings
router.post('/saveSettings/:id', async (req, res) => {

const admin = req.params.id

// let setting
    try {
        
        const setting = await Setting.findOne()
            
            if (!isNull(setting)) {
                console.log(setting)
        
                setting.budget_year = req.body.budgYear
                setting.start_budget_date = req.body.startBudgDet
                setting.end_budget_date = req.body.endBudgDet
                setting.status = req.body.budgStatus
    
                const saveSetting = setting.save()

                canProceed = true 
            }
            else {
                let newSetting = new Setting({
                    budget_year: req.body.budgYear,
                    start_budget_date: req.body.startBudgDet,
                    end_budget_date: req.body.endBudgDet,
                    status: req.body.budgStatus
                })
                newSetting.save()

                canProceed = true 

            }

        console.log(canProceed) 
        
        if (canProceed) {
            res.redirect('/admins/settings/' + admin)
        }

    } catch (err) {
        console.log(err)
        res.redirect('/admins/settings/' + admin)
    }
})  

//View EMPLOYEES / USERS

router.get('/employees/:id', authUser, authRole(ROLE.ADMIN), async (req, res) => {

    const areaCode = req.params.id
    const _user = req.user
    
    let fndPositi = posisyon

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
    let opDED = ""
    let recCount = 0

    let empCanProceed = false
    let fndEmployees = []
    
    // console.log(fndPositi)

    fndPositi.forEach(fndPosii => {
        const fndPositionEmp = fndPosii.code
        const fndPositID = fndPosii.id
        if (fndPositionEmp === "DED") {
            opDED = fndPositID
        }
    })

    console.log(opDED)

    try {

        const regions = await Region.find()

        const brnEmployees = await Employee.find({position_code: opDED}) // , function (err, foundEmployees) {

            if (!isNull(brnEmployees) && brnEmployees.length > 0) {
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
    
                    // const empAssign = _.find(regions, {region: empAss})
                    
                    fondEmploy.push({empID: empID, region: regDirRegion, empName: empName, empCode: empCode, empPostCode: empPostCode, empPost: empAss})
    
                })
                recCount = 1
            }
            else {
                recCount = 0
            }

            console.log(brnEmployees)
            console.log(recCount)

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
    
            res.render('admins/employee', {
                ded: "DED",
                fndEmploy: sortedEmp,
                searchOptions: req.query,
                recCount: recCount,
                yuser: _user
            })

} catch (err) {
        console.log(err)
        res.render(err)
        // res.redirect('/')
    }
})


// New EMPLOYEE Route
router.get('/newEmployee/:id', authUser, authRole(ROLE.ADMIN), async (req, res) => {
    
    const areaCode = req.params.id
    const _user = req.user
    const empStatus = ["Active","Deactivate"]

    // regionPosiID = "611d094bdb81bf7f61039616"
    let foundRegion = []
    let fndRegions = []

    try {

        foundRegion = await Region.find()

           console.log(foundRegion)
           const newEmp = new Employee()
           const newUser = new User()
   
            res.render('admins/newEmployee', { 
               emp: newEmp, 
               empStatus: empStatus,
               user: newUser,
               admin: "ADMIN",
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
router.post('/postNewEmp/:id', authUser, authRole(ROLE.ADMIN), async (req, res) => {
    const _user = req.user
   let eUnit
   let ePONum
    const nEmpCode = _.trim(req.body.empCode)
    const nEmail = _.trim(req.body.email).toLowerCase()
    const nLName = _.trim(req.body.lName).toUpperCase()
    const nFName = _.trim(req.body.fName).toUpperCase()
    const nMName = _.trim(req.body.mName).toUpperCase()
    const nName =  nLName + ", " + nFName + " " + nMName
    const empID = req.params.id

    // const regionPosiID = "611d094bdb81bf7f61039616"

    console.log(req.body.password)

    let opDED_ID = ""

    console.log(req.body.password)

    let fndPositi = posisyon

    fndPositi.forEach(fndPosii => {
        const fndPositionEmp = fndPosii.code
        const fndPositID = fndPosii.id
        if (fndPositionEmp === "DED") {
            opDED_ID = fndPositID
        }
    })

    const empStatus = ["Active","Deactivate"]

let locals
//console.log(brnCode)
let getExistingUser = []
let canProceed = false
let UserProceed = false

const regionEmployees = await Employee.find()


try {


    const sameName = _.find(regionEmployees, {last_name: nLName, first_name: nFName, middle_name: nMName})

    const sameCode = _.find(regionEmployees, {emp_code: nEmpCode})

    const sameAssign = _.find(regionEmployees, {assign_code: empID})
    console.log(sameAssign)

    if (regionEmployees.length === 0) {
        if (sameName) {
            locals = {errorMessage: 'Employee Name: ' + nName + ' already exists!'}
            canProceed = false
        } else if (sameAssign) {
            locals = {errorMessage: 'Assign Code: ' + empID + ' already exists!'}
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

        addedNewUser = true
        
        const empName = nLName + ' ' + nFName + ' ' + nMName

        let employee = new Employee({

            emp_code: nEmpCode,
            last_name: nLName,
            first_name: nFName,
            middle_name: nMName,
            emp_name: empName,
            position_code: opDED_ID,
            assign_code: empID,
            status: "Active",
            po_number: 'N/A',
            unit: 'N/A',
            branch: 'N/A',
            area: 'N/A',
            region: "N/A",
            status: "Active"
        })
        
        const newCoa = employee.save()

        let nUser = new User({
            email: nEmail,
            password: hashedPassword,
            name: nName,
            emp_code: nEmpCode,
            assCode: empID,
            role: 'DED',
            region: "",
            area: "",
        })
        const saveUser = nUser.save()

        res.redirect('/admins/employees/'+ 'ADMIN')
    } 
    else {
        // let psitCode = []
        // const foundRegion = await Region.find({region: "empRegCod"}, function (err, fnd_Post) {
        //      psitCode = fnd_Post
        // })
        // console.log(psitCode)
        let errEmp = []
        let errUser = []

            errUser.push({email: nEmail, password: req.body.password})

            errEmp.push({emp_code: nEmpCode, region: "", last_name: nLName, first_name: nFName, middle_name: nMName, position_code: opDED_ID})
            console.log(errEmp)

            res.render('admins/newEmployee', { 
                emp: errEmp, 
                empStatus: empStatus,
                user: errUser,
                admin: "ADMIN",
                 yuser: _user,
                newEmp: true,
                resetPW: false,
                locals: locals
            })
}


} catch (err) {
    console.log(err)
   let locals = {errorMessage: 'Something WENT went wrong.'}
    res.redirect('/admins/employees/'+ 'ADMIN')
}
})

// Get an Employee for EDIT
router.get('/getEmpForEdit/:id/edit', authUser, authRole(ROLE.ADMIN), async (req, res) => {


    const parame = req.params.id // admin + region.id
    const ded = parame.substr(0,3)
    const empCode = _.trim(parame.substr(3,10))

    // areaCod = req.body.area

    console.log(empCode)
    const _user = req.user
    let locals = ""
    let foundEmploy = []
    let adminRegions = []
    const empStatus = ["Active","Deactivate"]

     
   try {
        let brnCod
        // const emRegion = await Region.find({}, function (err, fnd_Post) {
        //     dedRegions = fnd_Post
        // })
        // console.log(dedRegions)

        const employe = await Employee.findOne({emp_code: empCode}, function (err, foundEmp) {
//            console.log(foundlist)
            foundEmploy = foundEmp
            // brnCod = foundEmp.region
        })
        console.log(employe)
        const newUser = new User()

        res.render('admins/editEmployee', {
            ded: ded,
            empStatus: empStatus,
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
       res.redirect('admins/employees/'+ ded)
   }
})

// SAVE EDITed Employee

router.put('/putEditedEmp/:id', authUser, authRole(ROLE.ADMIN), async function(req, res){

    const paramsID = req.params.id // admin + emp.ID
        console.log(paramsID)

    const ded = paramsID.substr(0,3)
    const empID = _.trim(paramsID.substr(3,45))

    // const assCode = req.body.region
    // const regionCod = req.body.region
    const empStatus = req.body.empStat

    // const eAssCode = assCode
    
    const eCode = _.trim(req.body.empCode).toUpperCase()
    const eLName = _.trim(req.body.lName).toUpperCase()
    const eFName = _.trim(req.body.fName).toUpperCase()
    const eMName = _.trim(req.body.mName).toUpperCase()
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
    } else if (trimmedEmpCode.length == 0 || eLName.length == 0 || eFName.length == 0 || eMName.length == 0) {
        locals = {errorMessage: 'Field/s must NOT be SPACE/S!'}
        // nameCanProceed = true
    } else {

        fieldsOkay = true
    }

        try {

            if (fieldsOkay) {
    
                const employee = await Employee.findById(empID)

                const OpEmployees = await Employee.find({})

                if (OpEmployees) {
                    const sameName = _.find(OpEmployees, {last_name: eLName, first_name: eFName, middle_name: eMName})
            
                    const sameCode = _.find(OpEmployees, {emp_code: eCode})
                    
                    if (sameName) {
                        const sameNameID = sameName._id
                        // const strEmpID = sameNameID //_.trim(stringify(sameName._id),'"')
                        if (sameNameID == empID) {
                            canProceed = true
                        } else {
                            locals = {errorMessage: 'Employee Name: ' + nName + ' already exists!'}
                            canProceed = false        
                        }
                    } else {
                        canProceed = true
    
                    }
                    if (sameCode) {
                        // const strSameACode = _.trim(stringify(sameCode._id),'"')
                        const sameCodeID = sameCode._id
                        if (sameCodeID == empID) {
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

                const dedEmp = await Employee.findById(empID)
    
                dedEmp.emp_code = eCode
                dedEmp.last_name = eLName
                dedEmp.first_name = eFName
                dedEmp.middle_name = eMName
                dedEmp.emp_name = empName
                dedEmp.status = empStatus
            
                await dedEmp.save()
                
                    res.redirect('/admins/employees/'+ ded)
    
            } else {
                const empStatus = ["Active","Deactivate"]

                const dedEmp = await Employee.findById(empID)
    
                dedEmp.emp_code = eCode
                dedEmp.last_name = eLName
                dedEmp.first_name = eFName
                dedEmp.middle_name = eMName
                dedEmp.emp_name = empName
                dedEmp.status = empStatus

                res.render('admins/editEmployee', {
                    ded: ded,
                    empStatus: empStatus,
                    user: newUser,
                    emp: dedEmp, 
                    locals: locals,
                    yuser: _user,
                    newEmp: false,
                    resetPW: false
               })
        
            }

        } catch (err) {
            console.log(err)
            let locals = {errorMessage: 'Something WENT went wrong.'}
            res.redirect('/admins/employees/'+ ded, {
            locals: locals
            })
        }
  
})

// GET Employee User for RESET PASSWORD
router.get('/getEmpEditPass/:id/edit', authUser, authRole(ROLE.ADMIN), async (req, res) => {

    const parame = req.params.id // admin + emp_code
    const admin = parame.substr(0,3)
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

    let ass_Code = ""

   try {
        const employe = await Employee.findOne({emp_code: empCode}) //, function (err, foundEmp) {
        
        if (!isNull(employe)) {
            foundEmploy = employe
            brnCod = employe.branch
            possit = _.trim(employe.position_code)
           console.log(possit)
           regionAsignCode = employe.assign_code

        }
//            console.log(foundlist)
        
        // const region = await Region.findOne({region: regionAsignCode}) //, function (err, fnd_area) {
        
        // if (!isNull(region)) {
        //     areaAsignDesc = region.region_desc
        //     dedRegions = region

        // }
    
            // console.log(employe)
        const editUser = await User.findOne({assCode: regionAsignCode}) //, function (err, foundUser) {
        
        if (!isNull(editUser)) {
            fndUser = editUser
            console.log(fndUser)

        }
            //            console.log(foundlist)

            editUser.password = ""
            
        res.render('admins/resetPassword', {
            ded: "DED",
            user: editUser,
            emp: employe, 
            locals: locals,
            yuser: _user,
            newEmp: false,
            resetPW: true
       })

//        res.render('centers/edit', { centers: center, coaClass: coaClass })

   } catch (err) {
       console.log(err)
       res.redirect('admins/'+ 'ADMIN')
   }
})

router.put('/putEditedPass/:id', authUser, authRole(ROLE.ADMIN), async function(req, res){

    const paramsID = req.params.id // 'ADMIN' + emp.id

    const regionCod = _.trim(paramsID.substr(3,3))
    // empID = req.params.id
    const ded = _.trim(paramsID.substr(0,3))
    // const regionCod = _.trim(paramsID.substr(3,10))
    const newPassword = _.trim(req.body.password)
    const userID = req.body.user_id

    // let getExistingUser
    
        try {
            const hashdPassword = await bcrypt.hash(newPassword, 10)
            let getExistingUser = await User.findOne({assCode: ded})

                getExistingUser.password = hashdPassword
                const savedNewPW = getExistingUser.save()
        
            res.redirect('/admins/employees/'+ ded)

        } catch (err) {
            console.log(err)
            let locals = {errorMessage: 'Something WENT went wrong.'}
            res.redirect('/admins/employees/'+ ded)
        }
  
})


// REGISTER ROUTE
router.get('/register/:id', authUser, authRole(ROLE.ADMIN), async (req, res) => {
    // res.send('User Registration Page!')
    const regUser = new User()
    res.render('admins/register', {
        regUser: regUser
    })
})

router.post('/saveRegister', async (req, res) => {

    let locals
    let canProceed = false
    const userName = req.body.name
    const eMail = req.body.email
    const password = req.body.password
    const assCode = req.body.assCode
    const role = req.body.role
 
    try {
        const hashedPassword = await bcrypt.hash(password, 10)
        
        const getExistingUser = await User.findOne({email: eMail}, function (err, foundUser) {

            if (!isNull(foundUser)) {
                    canProceed = false
                    locals = {errorMessage: "USER already exist!"}
            } else {
                canProceed = true 
            }
        })
        console.log(canProceed)
        
        if (canProceed) {
            let nUser  = new User({

                name: userName,
                email: eMail,
                password: hashedPassword,
                assCode: assCode,
                role: role,
                emp_code: "",
                
            })
        
               const saveUser = nUser.save()
            res.redirect('/login')

        } else {
            res.render('/admins/register')
        }

    } catch (err) {
        console.log(err)
        res.redirect('/admins/register')
    }
})  

router.get('/region', authUser, authRole(ROLE.ADMIN), async (req, res) => {

    const brnCode = req.params.id
    const _user = req.user

    let foundRegion = []
    let sortedEmp = []
    let fndRegion = []
    let fndRegions = []
    let doneReadRegion = false

    let empName = []

    console.log(_user + "View Region")
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
                    employeeName = empName.first_name + " " + empName.middle_name.substr(0,1) + ". " + empName.last_name
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
            res.render('admins/region', {
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

// GET  USER for RESET PASSWORD
router.get('/getEmpEditPass/:id/edit', authUser, authRole(ROLE.ADMIN), async (req, res) => {

    const parame = req.params.id // admin + emp_code
    const admin = parame.substr(0,3)
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

    let ass_Code = ""

   try {
        // const employe = await Employee.findOne({emp_code: empCode}) //, function (err, foundEmp) {
        
        // if (!isNull(employe)) {
        //     foundEmploy = employe
        //     brnCod = employe.branch
        //     possit = _.trim(employe.position_code)
        //    console.log(possit)
        //    regionAsignCode = employe.assign_code

        // }
//            console.log(foundlist)
        
        // const region = await Region.findOne({region: regionAsignCode}) //, function (err, fnd_area) {
        
        // if (!isNull(region)) {
        //     areaAsignDesc = region.region_desc
        //     dedRegions = region

        // }
    
            // console.log(employe)
        const yoser = await User.findOne({assCode: "ADMIN"}) //, function (err, foundUser) {
        
        if (!isNull(yoser)) {
            fndUser = yoser
            console.log(fndUser)

        }
            //            console.log(foundlist)

        yoser.password = ""
            
        res.render('admins/resetPassword', {
            admin: "ADMIN",
            yoser: yoser,
            locals: locals,
            yuser: _user,
            newEmp: false,
            resetPW: true
       })

//        res.render('centers/edit', { centers: center, coaClass: coaClass })

   } catch (err) {
       console.log(err)
       res.redirect('admins/'+ 'ADMIN')
   }
})

router.put('/putEditedPass/:id', authUser, authRole(ROLE.ADMIN), async function(req, res){

    const paramsID = req.params.id // 'DED' + emp.id

    const regionCod = _.trim(paramsID.substr(3,3))
    // empID = req.params.id
    const admin = _.trim(paramsID.substr(0,3))
    // const regionCod = _.trim(paramsID.substr(3,10))
    const newPassword = _.trim(req.body.password)
    const userID = req.body.user_id

    // let getExistingUser
    
        try {
            const hashdPassword = await bcrypt.hash(newPassword, 10)
            let getExistingUser = await User.findOne({assCode: "ADMIN"})

                getExistingUser.password = hashdPassword
                const savedNewPW = getExistingUser.save()
        
            res.redirect('/admins/employees/'+ admin)

        } catch (err) {
            console.log(err)
            let locals = {errorMessage: 'Something WENT went wrong.'}
            res.redirect('/admins/getEmpEditPass/'+ admin + '/edit')
        }
  
})

// GET AREAS PER REGION
router.get('/setRegionAreas/:id', authUser, authRole(ROLE.ADMIN), async (req, res) => {

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
            res.render('admins/area', {
                regionCode: regionCod,
                regions: foundArea,
                yuser: yuser
            })
        }
    } catch (err) {
        console.log(err)
        res.redirect('/admins/region')
    }
})

//
router.get('/setNewRegions', authUser, authRole(ROLE.ADMIN), async (req, res) => {

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
        res.redirect('/units/'+unitCode)
    }
})

router.get('/newRegion', authUser, authRole(ROLE.ADMIN), async (req, res) => {
    // res.send('User Registration Page!')

    res.render('admins/newRegion', {
        region: new Region()
    })
})

router.post('/postNewRegion', async (req, res) => {

    let locals
    let canProceed = false
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
                status: "Active"
            })
        
            const saveUser = nRegion.save()

            res.redirect('/admins/region')

        } else {
            res.redirect('/admins/region')
        }

    } catch (err) {
        console.log(err)
        res.redirect('/admins/register')
    }
})  

router.post('/postNewRegions', async (req, res) => {

    let canProceed = false

    let numRegions = _.toNumber(req.body.numRegions)
    let locals   
 
    var i //defines i

    try {

        // const unit = await Po.findOne({po_code: poCod}, function (err, foundedPO) {

        // })

        let cntrNum = 0
        for (i = 1; i <= numPOs; i++) { //starts loop
            console.log("The Number Is: " + i) //What ever you want
            let po_Code = poCod + _.trim(_.toString(i))

            let po = new Po({
                po_code: po_Code,
                po_number: i,
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
        }

       res.redirect('/units/pos/'+ param)

    } catch (err) {
        console.log(err)
        res.redirect('/admins/register')
    }
})  

router.get('/regionView/:id', async (req, res) => {

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
        
        const fndEmployee = await Employee.find()

        // WILL UPDATE emp_name field in EMPLOYEE Collection
        // fndEmployee.forEach( fndEmp => {
        //     const empName = fndEmp.last_name + ' ' + fndEmp.first_name + ' ' + fndEmp.middle_name
        //     fndEmp.emp_name = empName
        //     fndEmp.status = "ACTIVE"
        //     fndEmp.save()
        // })
        
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
            res.render('admins/regionView', {
            admin: 'admin',
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

// GET AREA for display
router.get('/areaView/:id', authUser, authRole(ROLE.ADMIN), async (req, res) => {

    // const regionCode = req.params.id
    const _user = req.user

    let foundArea = []
    let sortedEmp = []
    let fndAreas = []
    let sortedAreas = []
    let doneReadRegion = false

    let empName = []
    let areaCode = ""
    let areaDesc = ""
    let areaEmp = ""
    let areaMgrID = ""

    fndPositi = posisyon

    fndPositi.forEach(fndPosii => {
        const fndPositionEmp = fndPosii.code
        const fndPositID = fndPosii.id
        if (fndPositionEmp === "AREA_MGR") {
            areaMgrID = fndPositID
        }
    })


    // picked = lodash.filter(arr, { 'city': 'Amsterdam' } );

    try {

        const fnd_area = await Area.find() //{}, function (err, fnd_Areas) {
        
        let fndEmployee = await Employee.find({position_code: areaMgrID})
        
    //            const fndEmployees = foundEmployees
    //            const empStatus = fndEmployees.status
        if (fnd_area.length === 0) {
            doneReadRegion = true
        } else {
            fnd_area.forEach(fnd_areas =>{
                id = fnd_areas._id
                areaCode = fnd_areas.area
                areaDesc = fnd_areas.area_desc
                areaEmp = fnd_areas.emp_code
                regionCode = fnd_areas.region

                // picked = lodash.filter(arr, { 'city': 'Amsterdam' } );
                empName = _.filter(fndEmployee, {'emp_code': areaEmp})

                if (empName.length === 0) {
                } else {
                    employeeName = empName.first_name + " " + _.trim(empName.middle_name).substr(0,1) + ". " + empName.last_name
                }
                foundArea.push({id: id, sortkey: regionCode + areaCode, regionCode: regionCode, areaCode: areaCode, areaDesc: areaDesc, areaEmp: areaEmp, empName: empName})

                doneReadRegion = true
            })

                console.log(foundArea)
            
                sortedAreas= foundArea.sort( function (a,b) {
                    if ( a.sortkey < b.sortkey ){
                        return -1;
                    }
                    if ( a.sortkey > b.sortkey ){
                        return 1;
                    }
                    return 0;
                })
        }

        if (doneReadRegion) {
            res.render('admins/areaView', {
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

// Get BRANCHES for Display
router.get('/branchView/:id', authUser, authRole(ROLE.ADMIN), async (req, res) => {

    // const areaCode = req.params.id
    const _user = req.user

    let foundBranch = []
    let sortedEmp = []
    let fndBranchs = []
    let sortedBranchs = []
    let doneReadarea = false
    let branchStat = ""
    let empName = []
    let branchMgrID = ""

    fndPositi = posisyon

    fndPositi.forEach(fndPosii => {
        const fndPositionEmp = fndPosii.code
        const fndPositID = fndPosii.id
        if (fndPositionEmp === "BRN_MGR") {
            branchMgrID = fndPositID
        }
    })


    try {

        const fnd_branch = await Branch.find() //{}, function (err, fnd_Branchs) {
        
        let fndEmployee = await Employee.find({position_code: branchMgrID})
        
    //            const fndEmployees = foundEmployees
    //            const empStatus = fndEmployees.status
        if (fnd_branch.length == 0) {
            doneReadarea = true
        } else {
            fnd_branch.forEach(fnd_branchs =>{
                id = fnd_branchs._id
                branchCode = fnd_branchs.branch
                branchDesc = fnd_branchs.branch_desc
                branchEmp = fnd_branchs.emp_code
                branchStat = fnd_branchs.status
                branchCategory = fnd_branchs.branch_category
                areaCode = fnd_branchs.area
                regionCode = fnd_branchs.region

                // picked = lodash.filter(arr, { 'city': 'Amsterdam' } );
                empName = _.filter(fndEmployee, {'emp_code': branchEmp})

                if (empName.length === 0) {
                } else {
                    employeeName = empName.first_name + " " + _.trim(empName.middle_name).substr(0,1) + ". " + empName.last_name
                }
                foundBranch.push({id: id, sortkey: regionCode + areaCode + branchCode, regionCode: regionCode, areaCode: areaCode, branchCode: branchCode, branchDesc: branchDesc, branchCategory: branchCategory, emp_code: branchEmp, empName: empName, branchStat: branchStat})

                doneReadarea = true
            })

                console.log(foundBranch)
            
                sortedBranchs= foundBranch.sort( function (a,b) {
                    if ( a.sortkey < b.sortkey ){
                        return -1;
                    }
                    if ( a.sortkey > b.sortkey ){
                        return 1;
                    }
                    return 0;
                })
        }

        if (doneReadarea) {
            res.render('admins/branchView', {
            // areaCode: areaCode,
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

router.get('/users', authUser, authRole(ROLE.ADMIN), async (req, res) => {
    res.send('System USERS VIEW Page! - ONGOING DEVELOPMENT.')
    // res.render('admins/register')
})

router.get('/getAccess', authUser, authRole(ROLE.ADMIN), async (req, res) => {
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