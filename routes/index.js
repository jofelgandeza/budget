
const express = require('express')
const router  = express.Router()
const app = express()
const bodyParser = require('body-parser')
const methodOverride = require('method-override')
const { model } = require('mongoose')

let LoggedUser = {}
// app.use(setSysUser)


app.get('/', async (req, res) => {
    // console.log(req.params.id)
    console.log(req.user)
    const logUser = req.user
    res.render('/dashboards/dashboard', {
        yuser : logUser
    })
})
//          if (user.role === "PO") {
//             res.redirect('/centers/' + user.assCode)
//         } else if (user.role === "PUH") {

//             res.redirect('/units/' + user.assCode)

//         } else if (user.role === "BM") {

//             res.redirect('/branches/' + user.assCode)
//         }
//     }

app.get('/dash', async (req, res) => {
    res.send('Dash page')
})
// function setSysUser(req, res, next) {
//     const LogUser = req.user
//     if (LogUser) {
//         LoggedUser = LogUser
//     }
//     next()
//   }

module.exports = router