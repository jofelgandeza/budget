//alert('Reply from main.js')
//const Cleave = require('cleave')

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