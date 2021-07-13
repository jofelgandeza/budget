const _ = require('lodash')

function authUser(req, res, next) {
    if (req.user == null) {
      res.status(403)
      return res.send('You need to sign in')
    }
  
    next()
  }
  
  function authRole(role) {
    return (req, res, next) => {
        let params_ID = req.params.id
        let paramsID = ""

        console.log(params_ID)
        if (req.user.role === "PO") {
          paramsID = params_ID.substr(0,6)
        }          
        if (req.user.role === "PUH") {
          paramsID = params_ID.substr(0,5)
        }          
        if (req.user.role === "BM") {
          paramsID = params_ID.id.substr(0,3)
        }          
        // console.log(paramsID + ", " + req.user.assCode)
        if (req.user.role !== role || req.user.assCode !== paramsID) {
          res.status(401)
          return res.send('Not allowed')
        }  
//          console.log(req.params.id.length)
          next()
          //  if (role === 'PO' && (req.user.assCode === paramsID) || (req.user.assCode === paramsID.substr(0,6))) {
          //   next()      

          //  }
          //  if (role === 'UH' && (req.user.assCode === paramsID) || (req.user.assCode === paramsID.substr(0,5))) {
          //   next()      

          //  }
          //  if (role === 'BM' && (req.user.assCode === paramsID) || (req.user.assCode === paramsID.substr(0,3))) {
          //   next()      

          //  }
          //  res.status(401)
          //  return res.send('Not allowed')
    }
  }
  
  module.exports = {
    authUser,
    authRole
  }
  