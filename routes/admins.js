
const express = require('express')
const router  = express.Router()
const app = express()
const bodyParser = require('body-parser')
const methodOverride = require('method-override')
const { model } = require('mongoose')
const bcrypt = require('bcrypt')
const { forEach, isNull, isEmpty } = require('lodash')
const _ = require('lodash')
const { authUser, authRole } = require('../public/javascripts/basicAuth.js')
const { ROLE } = require('../public/javascripts/data.js')

const User = require('../models/user')
const Region = require('../models/region')
const Employee = require('../models/employee')
const Setting = require('../models/setting')

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
    
    try {

        const budg_setting = await Setting.find({}, function (err, foundSettings) {
            fndBudgSetting = foundSettings
            
            foundSettings.forEach(fndSet =>{
                budget_Mode = fndSet.status
            })

        })


//         const brnEmployees = await Employee.find({position_code: regDirID}, function (err, foundEmployees) {
//             const fndEmployees = foundEmployees

// //            const empStatus = fndEmployees.status
// //  - Area ID
//             fndEmployees.forEach(foundEmp =>{
//                 empPst = foundEmp.position_code
//                 empID = foundEmp._id
//                 empName = foundEmp.last_name + ", " + foundEmp.first_name + " " + foundEmp.middle_name.substr(0,1) + "."
//                 empCode = foundEmp.emp_code
//                 empUnit = foundEmp.unit
//                 empUnitPOnum = foundEmp.unit + foundEmp.po_number
//                 empAss = foundEmp.assign_code
//                 let exist = false

//                 const empAssign = _.find(regions, {region: empAss})
                
//                 fondEmploy.push({empID: empID, area: areaCode, empName: empName, empCode: empCode, empPostCode: empPostCode, empPost: empAssign.region_desc})
                
//                 empCanProceed = true            
//             })

//             sortedEmp = fondEmploy.sort( function (a,b) {
//                 if ( a.empName < b.empName ){
//                     return -1;
//                   }
//                   if ( a.empName > b.empName ){
//                     return 1;
//                   }
//                    return 0;
//             })        
    
            res.render('admins/setting', {
                admin: "ADMIN",
                fndSetting: fndBudgSetting,
                statSelect: statSelect,
                searchOptions: req.query,
                yuser: _user
            })

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
        
        const setting = await Setting.find({})
            
            if (!isEmpty(setting)) {
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

router.get('/register/:id', authUser, authRole(ROLE.ADMIN), async (req, res) => {
    // res.send('User Registration Page!')
    res.render('admins/register')
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

            if (!err) {
                if (!foundUser) {
                    canProceed = true 
                } else {
                    canProceed = false
                    locals = {errorMessage: "USER already exist!"}
                }
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
            res.redirect('/admins/register')
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
        res.redirect('/admins//register')
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
        res.redirect('/admins//register')
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