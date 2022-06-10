// const Position = require('../models/position')
// const _ = require('lodash')
// const Cleave = require('../public/javascripts/cleave.js')
//alert('Reply from main.js')
// const Cleave = require('cleave')

const setTargetBtn = document.querySelector('.btn-setTarget');
const okBtn = document.querySelector('.ok-btn');
const popupBox = document.querySelector('popup-overlay');

setTargetBtn.addEventListener('click',() => {
    alert('Set Target button is clicked!')
    popupBox.classList.add('active')
})

function onClickOkay() {
    // alert('Set target link was clicked!');
    // popupBox.classList.toggle('active')
    // popupBox.classList.toggle('active')
    document.querySelector('.popup-overlay').classList.toggle('active')
    // document.getElementById("popup-message").classList.remove("active");
}

const cleaveNumCli = new Cleave('.targNumCli', {
    numeral: true,
    numeralThousandGroupStyle: 'thousand'
})

const cleaveAmt = new Cleave('.targetAmt', {
    numeral: true,
    numeralThousandGroupStyle: 'thousand'
})

const cleaveBegCli = new Cleave('.BegBalCli', {
    numeral: true,
    numeralThousandGroupStyle: 'thousand'
})

const cleaveBegPrin = new Cleave('.BegBalPrin', {
    numeral: true,
    numeralThousandGroupStyle: 'thousand'
})

const cleaveBgInt = new Cleave('.BegBalInt', {
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

function hideUnitPoInputs(selected) {
    var e = document.getElementById("ayApo");

    const hidePosit = e.value;
   
    const posi = hidePosit

    let y = document.getElementById("poUnit");
    let z = document.getElementById("poNumber");
    // y.disabled = false;
    // z.disabled = false;
// BRN_MGR = 604f06bf7ca02f8a731fa8a6
// UNI_HED = 604f07087ca02f8a731fa8a7
// PRO_OFR = 604f074e7ca02f8a731fa8a8

    if ( posi === "604f06bf7ca02f8a731fa8a6" || posi === "BRN_ACT" || posi === "BRN_AST" ) {
        y.disabled = true;
        y.value = "Not Applicable";
        z.disabled = true;
        z.value = "Not Applicable";
    }
    if (posi === "604f07087ca02f8a731fa8a7"){
        z.value = "Not Applicable";
        y.value = "";
        z.disabled = true;
    } 
    if (posi === "604f074e7ca02f8a731fa8a8") {
        y.value = "";
        z.value = "";
        y.disabled = false;
        z.disabled = false;
    }

    var ePosition = e.options[e.selectedIndex].value;
    // e.value = ePosition;
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
        case "January":
            document.getElementById("semesterID").value = "First Half"
        case "February":case "March":case "April":case "May":case "June":
            document.getElementById("semesterID").value = "First Half"
            break;
        case "July":case "August":case "September":case "October":case "November":case "December":
            document.getElementById("semesterID").value = "Second Half"
            break
        default:
            document.getElementById("semesterID").value = "Empty"
    }   

}

function setEmailUser() {

    let setEmailBranchCode = ""
    let setEmailUnitCode = ""
    let setEmailPoNumber = " "
    setEmailBranchCode = document.getElementById("brnCode").value
    setEmailUnitCode = document.getElementById("unitCode").value
    setEmailPoNumber = document.getElementById("poNumber").value

    // alert(setEmailBranchCode + setEmailPoNumber)

    const emailName = setEmailBranchCode.toLowerCase() + "-" + setEmailUnitCode.toLowerCase() + setEmailPoNumber + "@kmbi.org.ph"

    document.getElementById("email").value = emailName
}

function setOffEmailUser() {

    let setEmailRegion = ""
    setEmailRegion = document.getElementById("region").value

    // alert(setEmailBranchCode + setEmailPoNumber)

    const emailName = setEmailRegion.toLowerCase() + "@kmbi.org.ph"

    document.getElementById("email").value = emailName
}

function setAreaEmailUser() {

    let setEmailArea = ""
    setEmailArea = document.getElementById("area").value

    // alert(setEmailBranchCode + setEmailPoNumber)

    const emailName = setEmailArea.toLowerCase() + "@kmbi.org.ph"

    document.getElementById("email").value = emailName
}

function setBranchEmailUser() {

    let setEmailBranch = ""
    setEmailBranch = document.getElementById("branch").value

    // alert(setEmailBranchCode + setEmailPoNumber)

    const emailName = setEmailBranch.toLowerCase() + "@kmbi.org.ph"

    document.getElementById("email").value = emailName
}

function setPositValue() {

    acqPositValue = document.getElementById("ayApo").value

//    alert(acqPositValue)

}

function getTotAmt(numClient, param2, param3, targetLength) {
    let targTotAmt = 0
    const numCliValue = document.getElementById(param2).value
        // alert(numCliValue)
    const totAmount  =  numClient * numCliValue
    const totAmtID = 'totAmt' + param3
    
    const totStrAmount = totAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    document.getElementById(totAmtID).value = totStrAmount

    for(var i=0; i<targetLength; i++) {
        const tarAmtID = 'totAmt' + i

        const targAmount = document.getElementById(tarAmtID).value

        const targStrAmount = targAmount.replace(',','')

        const targeAmount = parseInt(targStrAmount)

        targTotAmt = targTotAmt + targeAmount
    }
    const totStrTargAmt = targTotAmt.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    document.getElementById('gTotAmt').value = totStrTargAmt
}


function getTotCli(param2, param3, targetLength) {
    let targTotAmt = 0
    // alert('Pwede!')
        // alert(numCliValue)
    const numCliValue = document.getElementById(param2).value
    
    const totAmount  =  numCliValue
    const totAmtID = 'numClient' + param3
    
    document.getElementById(totAmtID).value = totAmount

    for(var i=0; i<targetLength; i++) {
        const tarAmtID = 'numClient' + i

        const targAmount = document.getElementById(tarAmtID).value
        const targeAmount = parseInt(targAmount)

        targTotAmt = targTotAmt + targeAmount
        // alert(targTotAmt)
    }
    document.getElementById('gtotCli').value = targTotAmt
}

function getTotPrin(param2, param3, targetLength) {
    let targTotAmt = 0
    // alert('Pwede!')
        // alert(numCliValue)
    const numCliValue = document.getElementById(param2).value
    
    const totAmount  =  numCliValue
    const totAmtID = 'begPrincipal' + param3
    
    document.getElementById(totAmtID).value = totAmount

    for(var i=0; i<targetLength; i++) {
        const tarAmtID = 'begPrincipal' + i

        const targAmount = document.getElementById(tarAmtID).value
        const targeAmount = parseInt(targAmount)

        targTotAmt = targTotAmt + targeAmount
        // alert(targTotAmt)
    }
    document.getElementById('gtotPrin').value = targTotAmt
}

function getTotInt(param2, param3, targetLength) {
    let targTotAmt = 0
    // alert('Pwede!')
        // alert(numCliValue)
    const numCliValue = document.getElementById(param2).value
    
    const totAmount  =  numCliValue
    const totAmtID = 'begInterest' + param3
    
    document.getElementById(totAmtID).value = totAmount

    for(var i=0; i<targetLength; i++) {
        const tarAmtID = 'begInterest' + i

        const targAmount = document.getElementById(tarAmtID).value
        const targeAmount = parseInt(targAmount)

        targTotAmt = targTotAmt + targeAmount
        // alert(targTotAmt)
    }
    document.getElementById('gtotInt').value = targTotAmt
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
  