// how to sort module
 
module.exports = function compareFirstNames( a, b ) {
    if ( a.first_name < b.first_name ){
      return -1;
    }
    if ( a.first_name > b.first_name ){
      return 1;
    }
    return 0;
  }
  
  
 