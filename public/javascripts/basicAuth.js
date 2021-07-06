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
        let paramsID = req.params.id
        if (req.user.role === "PO") {
          paramsID = req.params.id.substr(0,6)
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
  