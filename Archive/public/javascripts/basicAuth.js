
function authUser(req, res, next) {
  const auUser = req.user
  console.log('Log From authUser -->' + auUser)
  
  if (auUser == null) {
      console.log(err)
      res.status(403)
      return res.send('You need to sign in')
    }
  
    next()
  }
  
  function authRole(role, role2) {
    return (req, res, next) => {
        let params_ID = req.params.id
        let paramsID = ""

        console.log("Eto ba yun ->" + req.user.role)
        console.log("params-id ->" + params_ID)

        if (req.user.role === "PO") {
          paramsID = params_ID.substr(0,6)
        }          
        if (req.user.role === "PUH") {
          paramsID = params_ID.substr(0,5)
        }          
        if (req.user.role === "BM") {
          paramsID = params_ID.substr(0,3)
        }          
        if (req.user.role === "AM") {
          paramsID = params_ID.substr(0,3)
        }          
        if (req.user.role === "RD") {
          paramsID = params_ID.substr(0,3)
        }          
        if (req.user.role === "DED") {
          paramsID = params_ID.substr(0,3)
        }          
        if (req.user.role === "ADMIN") {
          paramsID = req.user.role
        }          
        console.log("paramsID ->" + paramsID)

        // console.log(paramsID + ", " + req.user.assCode)
        if (req.user.role !== role || req.user.assCode !== paramsID) {
          if (role2 === "BM") {

          } else {
            res.status(401)
            return res.send('Not allowed')
          }
        }  
          next()
    }
  }
  
  module.exports = {
    authUser,
    authRole
  }
  