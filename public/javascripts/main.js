//alert('Reply from main.js')
//const Cleave = require('cleave')

const cleaveAmt = new Cleave('.targetAmt', {
    numeral: true,
    numeralThousandGroupStyle: 'thousand'
})

const cleave = new Cleave('.janAmount', {
    numeral: true,
    numeralThousandGroupStyle: 'thousand'
})

const cleave1 = new Cleave('.febAmount', {
    numeral: true,
    numeralThousandGroupStyle: 'thousand'
})

const cleave2 = new Cleave('.marAmount', {
    numeral: true,
    numeralThousandGroupStyle: 'thousand'
})

const cleave3 = new Cleave('.aprAmount', {
    numeral: true,
    numeralThousandGroupStyle: 'thousand'
})

const cleave4 = new Cleave('.mayAmount', {
    numeral: true,
    numeralThousandGroupStyle: 'thousand'
})

const cleave5 = new Cleave('.junAmount', {
    numeral: true,
    numeralThousandGroupStyle: 'thousand'
})

const cleave6 = new Cleave('.julAmount', {
    numeral: true,
    numeralThousandGroupStyle: 'thousand'
})

const cleave7 = new Cleave('.augAmount', {
    numeral: true,
    numeralThousandGroupStyle: 'thousand'
})

const cleave8 = new Cleave('.sepAmount', {
    numeral: true,
    numeralThousandGroupStyle: 'thousand'
})

const cleave9 = new Cleave('.octAmount', {
    numeral: true,
    numeralThousandGroupStyle: 'thousand'
})

const cleave10 = new Cleave('.novAmount', {
    numeral: true,
    numeralThousandGroupStyle: 'thousand'
})

const cleave11 = new Cleave('.decAmount', {
    numeral: true,
    numeralThousandGroupStyle: 'thousand'
})

function hideUnitPoInputs() {
    var e = document.getElementById("ePosition");

    const posi = e.value;

    let y = document.getElementById("poUnit");
    let z = document.getElementById("poNumber");
    y.disabled = false;
    z.disabled = false;

    if ( posi === "BRN_MGR" || posi === "BRN_ACT" || posi === "BRN_AST" ) {
        y.disabled = true;
        z.disabled = true;
        y.value = "Not Applicable";
        z.value = "Not Applicable";
    }
    if (posi === "UNI_HED"){
        z.value = "Not Applicable";
        y.value = "";
        z.disabled = true;
    } 
    if (posi === "PRO_OFR") {
        y.value = "";
        z.value = "";
        y.disabled = false;
        z.disabled = false;
    }

    var ePosition = e.options[e.selectedIndex].value;
    e.value = ePosition;
  }


function myFunction() {
    var x = document.getElementById("janInput").value;
    document.getElementById("febInput").value = x;
    document.getElementById("marInput").value = x;
    document.getElementById("AprInput").value = x;
  }

document.querySelector(".delBtn").addEventListener("click", handleCLick)

function handleCLick() {
    alert("I got clicked")
}

function getSemester() {

    nmonth = document.getElementById("monthID").value
//   alert(x)

 //   document.getElementById("semesterID").value = x
 
    switch(nmonth) {
        case "January":case "February":case "March":case "April":case "May":case "June":
            document.getElementById("semesterID").value = "First Half"
            break;
        case "July":case "August":case "September":case "October":case "November":case "December":
            document.getElementById("semesterID").value = "Second Half"
            break
        default:
            document.getElementById("semesterID").value = "Empty"
    }   

}

function setPositValue() {

    acqPositValue = document.getElementById("ayApo").value

    alert(acqPositValue)

}


function compareFirstNames( a, b ) {
    if ( a.first_name < b.first_name ){
      return -1;
    }
    if ( a.first_name > b.first_name ){
      return 1;
    }
    return 0;
  }
  