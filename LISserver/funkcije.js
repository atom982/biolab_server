
// ========
module.exports = {
  checksum: function (frame) {//provjera checksum-a dolazeceg frame-a
    var incoming_checksum='';
    var suma_prep='';
      if(frame.indexOf("\u0003")>0){
         incoming_checksum=frame.substring(frame.indexOf("\u0003")+1,frame.indexOf("\u0003")+3);
         suma_prep = frame.substring(frame.indexOf("\u0002")+1,frame.indexOf("\u0003")+1);
         //console.log('pripremni frame:')
         //console.log(JSON.stringify(suma_prep))
      }
      if(frame.indexOf("\u0017")>0){
        incoming_checksum=frame.substring(frame.indexOf("\u0017")+1,frame.indexOf("\u0017")+3);
        suma_prep = frame.substring(frame.indexOf("\u0002")+1,frame.indexOf("\u0017")+1);
      }

      var hex = [];

      	for(var i=0;i<suma_prep.length;i++) {
          
          switch (suma_prep.charCodeAt(i)) {
            case 181:
            hex.push(parseInt('375').toString(16)); 
              break;
            case 65533:
            hex.push(parseInt('181').toString(16)); 
           
            break;
            default:
            hex.push(suma_prep.charCodeAt(i).toString(16));
              break;
          }
          
      	}

        var suma_dec = 0;
        hex.forEach(function(element) {
            suma_dec += hextoDec(element);

        });
        var suma_dec_to_hex = suma_dec.toString(16).toUpperCase();
 
        var checksum = suma_dec_to_hex.substring(suma_dec_to_hex.length-2,suma_dec_to_hex.length);
        if(incoming_checksum == checksum){
          return true;
        }
        else{
          return false;
        }

    //------------------------------------
    function hextoDec(hex) {
        var num = 0;

        for(var x=0;x<hex.length;x++) {
            var hexdigit = parseInt(hex[x],16);
            num = (num << 4) | hexdigit;
        }
        return num;
    }
    //-------------------------------------
  },
  uredi_ETB: function (niz_poruka) {//izbaci ETB frame-ove iz dolazne poruke
    var tempmessage='';
    var niz_message =[];
    niz_poruka.forEach(function(frame){

                        if(frame.indexOf("\u0003")>0){
                          frame=tempmessage+frame.substring(frame.indexOf("\u0002")+2,frame.indexOf("\u0003")-1);
                          niz_message.push(frame);
                          tempmessage='';
                        }
                        if(frame.indexOf("\u0017")>0){

                            tempmessage+=frame.substring(frame.indexOf("\u0002")+2,frame.indexOf("\u0017")-1);
                        }

    });

    return niz_message;

},

  kreiraj_checksum: function(frame){//racunanje checksum-a za slanje

                            function hextoDec(hex) {
                                var num = 0;

                                for(var x=0;x<hex.length;x++) {
                                    var hexdigit = parseInt(hex[x],16);
                                    num = (num << 4) | hexdigit;
                                }
                                return num;
                            }

    if(frame.indexOf("\u0003")>0){

                var hex = [];
                for(var i=0;i<frame.length;i++) {
                  hex.push(frame.charCodeAt(i).toString(16));
                }

                var suma_dec = 0;
                hex.forEach(function(element) {
                    suma_dec += hextoDec(element);

                });
        suma_dec_to_hex = suma_dec.toString(16).toUpperCase();
        var checksum = suma_dec_to_hex.substring(suma_dec_to_hex.length-2,suma_dec_to_hex.length);
        return checksum;
    }

    if(frame.indexOf("\u0017")>0){
      var hex = [];
        for(var i=0;i<frame.length;i++) {
          hex.push(frame.charCodeAt(i).toString(16));
        }

        var suma_dec = 0;
        hex.forEach(function(element) {
            suma_dec += hextoDec(element);

        });

        suma_dec_to_hex = suma_dec.toString(16).toUpperCase();
        var checksum = suma_dec_to_hex.substring(suma_dec_to_hex.length-2,suma_dec_to_hex.length);
        return checksum;
    }

  },

kreiraj_poruku:function(data,callback){//slanje poruke za order iz frontend-a
  var mongoose = require("mongoose") 
  var Lokacija = require("../models/Postavke")
  var AnaAssays = mongoose.model("AnaAssays")
  var tmpAna = ''
  var ordeTosend = ''
console.log('funkcija kreiraj poruku')

switch (data.site) {
  case '5c69f68c338fe912f99f833b':
         tmpAna = '5c71b6f5c599d9279717a334'
    break;
  case '5c6b3386c6543501079f4889':
         tmpAna = '5c9fa69fa98ac9917fa9c2a2'
    break;
  default:
    break;
}

                                 
AnaAssays.find({
  aparat: mongoose.Types.ObjectId(tmpAna)
}).lean().exec(function (err, assays) {

  ordeTosend += '\u0018'  + data.site+'/'
  var count = 0
  data.uzorci.forEach(element => {

    ordeTosend += data.samples[count].sid + '^'
    //console.log(element)
    element.testovi.forEach(test => {
      assays.forEach(anaassay => {
        if (anaassay.kod === test.itemName.split('-')[0]) {

          ordeTosend += test.itemName + '^'
        } 
      });
    });

    ordeTosend += '|'
    count++
  });

  ordeTosend += '\u0009'
  callback(ordeTosend)
  //var io = req.app.get('socketio')
  //io.emit('BT1500', req.body.site)
  // var client = new net.Socket();
  // client.connect({
  //   port: process.env.lisPORT
  // });
  // client.write(ordeTosend)

  // client.end()
})

  
},


parsaj_rezultat: function (record, io) {
  // MedLAB: 5bc71402bf21a379083d6e07
  // Analysers
  // Erba ELite 3: "5bc85683048ce379ac50a0d6", Serijski broj: "960855"
  // Erba XL 200: "5bc8592c048ce379ac50a0f0", Serijski broj: "251025"
  // TOSOH AIA-360: "5bc859e9048ce379ac50a0f8", Serijski broj: "27026012"
  // Urilyzer 100 Pro: "5bc85a93048ce379ac50a105", Serijski broj: "6101157"
  // Erba ECL 105: "5bcb72b2717d866cf6c12f57", Serijski broj: "E0041-11-250716"

  var mythic18 = require("./aparati/mythic18");
  var ErbaXL200 = require("./aparati/erbaxl200");
  var erbalyteplus = require("./aparati/erbalyteplus");
  var Urilyzer100Pro = require("./aparati/urilyzer100pro");
  var ecl105 = require("./aparati/ecl105");

  console.log("Parsanje rezultata...");
  //console.log(record)
  var header = record[0].split("|");
  var sender = header[4].split("^");
  var _id = "";
  var sn = "";

  if (sender[0] === "MYTHIC 1") {
    sn = sender[0].trim();
  } else {
    sn = sender[2]; // Mythic
  }
  if (record[0].includes("E 1394-97")) {
    sn = "251714"; // Erba XL 200
  }
  if (record[0].includes("XP-300")) {
    sn = sender[5];
  }
  if (record[0].includes("ErbalytePlus")) {
    sn = "111283"; // TOSOH AIA-360
  }
  if (record[0].includes("ECL 10")) {
    sn = "E0041-11-051216"; // Erba ECL 105
  }
  if (sender[0] === "URI2P") {
    sn = sender[1].trim(); // Urilyzer 100 Pro
  }
console.log(sn)
  switch (sn) {
    case "251714":
      console.log("Erba XL 200");
      ErbaXL200.parsaj_rezultat(record, io);
      break;
    case "MYTHIC 1":
      console.log("MYTHIC 18");
      mythic18.parsaj_rezultat(record, io);
      break;
    case "111283":
        console.log("Erba lyte plus");
        erbalyteplus.parsaj_rezultat(record, io);
        break;
    case "E0041-11-051216":
      console.log("Erba ECL 105");
      _id = "5bcb72b2717d866cf6c12f57";
      ecl105.parsaj_rezultat(record, io, _id);
      break;
    case "6101157":
      console.log("Urilyzer 100 Pro");
      urilyzer100pro.parsaj_rezultat(record, io);
      break;

    default:
      console.log("Nije definisan aparat sa serijskim brojem: " + sn);
  }
},

parsaj_query: function (record, callback) {
  // MedLAB: 5bc71402bf21a379083d6e07
  // Analysers
  // Erba ELite 3: "5bc85683048ce379ac50a0d6", Serijski broj: "960855"
  // Erba XL 200: "5bc8592c048ce379ac50a0f0", Serijski broj: "251025"
  // TOSOH AIA-360: "5bc859e9048ce379ac50a0f8", Serijski broj: "27026012"
  // Urilyzer 100 Pro: "5bc85a93048ce379ac50a105", Serijski broj: "6101157"
  // Erba ECL 105: "5bcb72b2717d866cf6c12f57", Serijski broj: "E0041-11-250716"

  var ErbaELite3 = require("./aparati/elite3");
  var ErbaXL200 = require("./aparati/erbaxl200");
  var TOSOHAIA360 = require("./aparati/aia360");
  var Urilyzer100Pro = require("./aparati/urilyzer100pro");
  var ErbaECL105 = require("./aparati/erbaxl200");

  //console.log(record)

  var header = record[0].split("|");
  var sender = header[4].split("^");
  var sn = "";

  if (sender[1] === "CDRuby") {
    sn = sender[0].trim();
  } else {
    sn = sender[2];
  }
  if (record[0].includes("E 1394-97")) {
    sn = "251025"; // Erba XL 200
  }

  switch (sn) {
    case "251025": // Erba XL 200
      console.log("Query Parsing: Erba XL 200");
      ErbaXL200.parsaj_query(record, function (poruka) {
        callback(poruka);
      });
      break;
    default:
      console.log("Nije definisan aparat sa serijskim brojem: " + sn);
  }
},

parsaj_hl7: function(record,callback){

  //-------definicija protocola za aparat
  var alinity = require('./aparati/alinity')
  const net = require('net');
  //-------------------------------------

  console.log("Parsam HL7... funkcije");
  console.log(JSON.stringify(record))
  var Parts = record.split("|");
  var Type = Parts[8].split("^")
  var Segments = record.split("\r")
  console.log(Segments)

  var sn = Type[0]
  // • Order Query
  // • Results Upload
  // • Test Status Update
  // • Sample Status Update
  // • Connection Test
  // • Assay Availability
  switch(sn){

    case 'NMD':  // Connection Test
                        alinity.connection_test(record,function(poruka){
                        console.log("Kreirano: ");
                        console.log(poruka);
                        callback(poruka);
                        });
                        break;          
    case 'QBP':  // Order Query Message Profile
                      alinity.order_query(record,function(poruka){
                        console.log("Kreirano: ");
                        console.log(poruka);
                        callback(poruka);
                        });
                        break; 
    case 'ORL':  // Order Query Message Profile
                        alinity.order_query_resp(record,function(poruka){
                          console.log("Kreirano: ");
                          console.log(poruka);
                          callback(poruka);
                          });
                          break; 
    case 'OUL':  // Order Query Message Profile
                        alinity.specimen_result(record,function(poruka){
                          //console.log("Kreirano: ");
                          //console.log(poruka);
                          callback(poruka);
                          });
                          break; 
                        default:
            console.log("U LIS -u nije definisan aparat, sa serijskim brojem: "+sn);
  }

},

};
