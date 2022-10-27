module.exports = {
  create_report: function (report, config, data, legenda, sekcijeniz, napomena,
    res, specificni, type, naziv, lokacija, site, site_data) {

    let code = "";
    let adresa_x = 0;
    let adresa = "";

    code = site_data.sifra;
    adresa_x = 68;
    adresa = "Zmaja od Bosne broj 63, 71000 Sarajevo, tel: +38733645845, email: info@bio-lab.ba, web: www.bio-lab.ba"
    var fs = require("fs");
    PDFDocument = require("pdfkit");
    const PDFDocumentWithTables = require("./pdf_class");
    var rowsno = "Rezultati laboratorijskih analiza";

    var rows = [];
    var temp = [];

    var pid = report.pid

    var datRodjenja = data.jmbg.substring(0, 2) + "." + data.jmbg.substring(2, 4) + ".";

    if (type != undefined && naziv != undefined && type === "single") {
      var nalazPath = config.nalaz_path + "/samples/";
      var imeFile = naziv;
    } else if (type != undefined && naziv != undefined && type === "multi") {
      var nalazPath = config.nalaz_path;
      var imeFile = naziv;
    } else if (type != undefined && naziv != undefined && type === "partial") {
      var nalazPath = config.nalaz_path + "/partials/";
      var imeFile = naziv;
    } else {
      var nalazPath = config.nalaz_path;
      var imeFile = report._id;
    }

    const doc = new PDFDocumentWithTables({ bufferPages: true, margins: { top: 80, bottom: 50, left: 50, right: 50 } });
    doc.pipe(fs.createWriteStream(nalazPath + imeFile + ".pdf").on("finish", function () {
      res.json({
        success: true,
        message: "Nalaz uspješno kreiran.",
        id: report._id,
        lokacija: lokacija,
        memo: memo
      });
    })
    );

    var memo = 0;
    var temp = 0;
    var nvisina = 90;
    var adjust = nvisina - 70;
    var nalazMemorandum = true;

    if (nalazMemorandum) {
      doc.registerFont("PTSansRegular", config.nalaz_ptsansregular);
      doc.registerFont("PTSansBold", config.nalaz_ptsansbold);
    }

    doc.registerFont("PTSansRegular", config.nalaz_ptsansregular);
    doc.registerFont("PTSansBold", config.nalaz_ptsansbold);
    doc.image(config.nalaz_logo + code + ".jpg", 28, 10, { fit: [240, 70], align: "center", valign: "center" });

    // doc.font("PTSansRegular").fontSize(13).fillColor("#7B8186").text("RIQAS certificirana eksterna kontrola kvaliteta", 308, 40);
    doc.font("PTSansRegular").fontSize(12).fillColor("black").text("Prezime i ime: ", 50, nvisina);

    if(data.roditelj.trim() == ""){
      doc.font("PTSansBold").fontSize(14).text(" " + data.prezime.toUpperCase() + " " + data.ime.toUpperCase(), 142 - 17, nvisina - 2);
    }else{
      doc.font("PTSansBold").fontSize(14).text(" " + data.prezime.toUpperCase() + " (" + data.roditelj + ") " + data.ime.toUpperCase(), 142 - 17, nvisina - 2);
    }

    

    if (datRodjenja.includes("01.01") && data.godiste == "1920") {
      doc.font("PTSansRegular").fontSize(12).text("Datum rođenja:", 50, nvisina + 16).text("Nema podataka", 150 - 17, nvisina + 16);
    } else if (!datRodjenja.includes("00.00")) {
      doc.font("PTSansRegular").fontSize(12).text("Datum rođenja:", 50, nvisina + 16).text(datRodjenja + data.godiste + ".", 150 - 17, nvisina + 16);
    } else {
      doc.font("PTSansRegular").fontSize(12).text("Godište:", 50, nvisina + 16).text(data.godiste + ".", 150 - 56, nvisina + 16);
    }

    doc.font("PTSansRegular").fontSize(12).text("Spol:", 50, nvisina + 32).text(data.spol[0].toUpperCase() + data.spol.slice(1).toLowerCase(), 96 - 17, nvisina + 32);
    // .text("Datum: ", 444 + 10, nvisina - 2).text(data.datum, 494 + 10, nvisina - 2);

    if (data.telefon === "NEPOZNATO" || data.telefon === "Nema podataka" || data.telefon.trim() === "") {
      data.telefon = "";
    } else {
      doc.font("PTSansRegular").fontSize(12).text("Kontakt:", 50, nvisina + 48).text(data.telefon, 150 - 54, nvisina + 48);
    }

    var uzorkovan = JSON.stringify(report.uzorkovano).substring(1, 11).split("-");

    doc.font("PTSansRegular").fontSize(10).text("Izdavanje nalaza:", 444.5 + 10, nvisina + 3 + 15 + 3 - 25);
      doc.font("PTSansBold").fontSize(10).text(data.datum + " " + data.vrijeme.substring(0, 5), 444.5 + 10, nvisina + 3 + 15 + 3 + 15 - 25);
      doc.font("PTSansRegular", config.nalaz_ptsansbold).fontSize(10).text("Vrijeme uzorkovanja:", 444.5 + 10, nvisina + 18 + 15 + 3 + 15 - 25);
      doc.font("PTSansRegular", config.nalaz_ptsansbold).fontSize(10).text(uzorkovan[2] + "." + uzorkovan[1] + "." + uzorkovan[0] + " " + data.uzorkovano_t, 444.5 + 10, nvisina + 33 + 3  + 15  + 15 - 25);
      
      doc.font("PTSansRegular").fontSize(10).text("Broj protokola:" , 444.5 + 10, nvisina + 60 - 2);
      doc.font("PTSansBold").fontSize(10).text(data.protokol, 444.5 + 10, nvisina + 75 - 2);


    // doc.font("PTSansRegular").text("Vrijeme:", 445 + 10, nvisina + 14).text(data.vrijeme, 506.5 + 10, nvisina + 14);
    // doc.font("PTSansBold", config.nalaz_ptsansbold).fontSize(8).text("Datum i vrijeme uzorkovanja:", 444.5 + 10, nvisina + 32);
    // doc.font("PTSansBold", config.nalaz_ptsansbold).fontSize(8).text(uzorkovan[2] + "." + uzorkovan[1] + "." + uzorkovan[0] + " " + data.uzorkovano_t, 444.5 + 10, nvisina + 42);
    // doc.font("PTSansRegular", config.nalaz_ptsansbold).fontSize(10).text("Redni broj pacijenta: ", 444.5 + 10, nvisina + 55);
    // doc.font("PTSansBold", config.nalaz_ptsansbold).fontSize(10).text(pid, 534 + 10, nvisina + 55);
    doc.font("PTSansBold").fontSize(12).text(rowsno, 50, nvisina + 70);
    doc.moveDown(1);

    var i = 0;
    var rows = [];
    var analit = true;
    var COV2 = false;
    var AbIgG = false;
    var AbIgM = false;
    var reset = 0;

    var alergije = false;
    var Inhalation30 = ""

    sekcijeniz.forEach(element => {
      if (!element[0].mikrobiologija) {
        i++;
        analit = true;
        rows = [];
        multi = [];

        if (doc.y > 630) {
          doc.addPage();
        }

        if (element[0].multi === undefined) {
          doc.fontSize(12).opacity(0.2).rect(50, doc.y, 511.5, 15).fill("#7B8186").fillColor("black").opacity(1).text(element[0].sekcija, 50);
        }

        element.forEach(test => {
          if (test.hasOwnProperty("multi")) {
            analit = false;
            multi.push({
              naslov: test.test,
              headers: report.headersa,
              rows: test.rezultat
            });
          } else {

            if(test.rezultat[0].includes("COVID-19 Antigen")){
             
              COV2 = true
              
            } 

            if(test.rezultat[0].includes("SARS-COV-2 IgG")){
             
              AbIgG = true
              
            } 

            if(test.rezultat[0].includes("SARS-COV-2 IgM")){
             
              AbIgM = true
              
            } 


            rows.push(test.rezultat);
            analit = true;
          }
        });

        if (analit || rows.length) {
          doc.table_default({ headers: report.headers, rows: rows }, { prepareHeader: () => doc.fontSize(8), prepareRow: (row, i) => doc.fontSize(10) }
          );
          multi.forEach(mul => {
            doc.fontSize(12).text(mul.naslov, 50);
            doc.table_default({ headers: mul.headers, rows: mul.rows }, { prepareHeader: () => doc.fontSize(8), prepareRow: (row, i) => doc.fontSize(10) });
          });
          multi = [];
        } else {
          if (multi.length) {
            multi.forEach(mul => {
              if (doc.y > 650) {
                doc.addPage();
              }

              if (mul.naslov.slice(4).toLowerCase().includes("alergo test")) {
                alergije = true;
              } 

              if (mul.naslov.slice(4).includes("INHALATORNI ALERGO TEST (IgE) - 30 alergena")) {
                Inhalation30 = "INHALATORNI ALERGO TEST (IgE) - 30 alergena\n" +
                "gx7 g03 / g04 / g05 / g06 / g08 / g13 - Polen ježevice, Polen livadskog vijuka, Polen Ljulja,\nPolen mačijeg repka, Polen livadarke, Polen medunike\n" +
                "ex10 e71 / e82 / e84 - Epitel miša, Epitel Zeca, Epitel hrčka\n" +
                "k202 CCD - Unakrsno reaktivne determinante ugljenih hidrata iz Bromelaina"
              } 


              if (mul.naslov.slice(4).trim() === "Sediment urina") {
                mul.rows.forEach(red => {
                  if (red[1].rezultat.includes(";")) {
                    reset = reset + 3;
                  }
                });
                doc.fontSize(12).opacity(0.2).rect(50, doc.y, 511.5, 15).fill("#7B8186").fillColor("black").opacity(1).fontSize(8).fillColor("red").text(mul.naslov.slice(1, 2), 50).fontSize(12).fillColor("black").text(mul.naslov.slice(4), 57, doc.y - 11);
                doc.table_sediment({ headers: mul.headers, rows: mul.rows }, { prepareHeader: () => doc.fontSize(8), prepareRow: (row, i) => doc.fontSize(10) });
              } else if (mul.naslov.slice(4).trim() === "Spermiogram") {
                mul.rows.forEach(red => {
                  if (red[1].rezultat.includes(";")) {
                    reset = reset + 3;
                  }
                });
                doc.fontSize(12).opacity(0.2).rect(50, doc.y, 511.5, 15).fill("#7B8186").fillColor("black").opacity(1).fontSize(8).fillColor("red").text(mul.naslov.slice(1, 2), 50).fontSize(12).fillColor("black").text(mul.naslov.slice(4), 57, doc.y - 11);
                doc.table_default({ headers: mul.headers, rows: mul.rows }, { prepareHeader: () => doc.fontSize(8), prepareRow: (row, i) => doc.fontSize(10) });
              } else {
                doc.fontSize(12).opacity(0.2).rect(50, doc.y, 511.5, 15).fill("#7B8186").fillColor("black").opacity(1).fontSize(8).fillColor("red").text(mul.naslov.slice(1, 2), 50).fontSize(12).fillColor("black").text(mul.naslov.slice(4), 57, doc.y - 11);
                doc.table_default({ headers: mul.headers, rows: mul.rows }, { prepareHeader: () => doc.fontSize(8), prepareRow: (row, i) => doc.fontSize(10) });
              }
            });
          }
        }
      }
    });

    // Mikrobiologija

    sekcijeniz.forEach(element => {
      if (element[0].mikrobiologija) {
        i++;
        analit = true;
        rows = [];
        multi = [];

        if (doc.y > 630) {
          doc.addPage();
        }

        if (element[0].multi === undefined) {
          doc.fontSize(12).opacity(0.2).rect(50, doc.y, 511.5, 15).fill("#7B8186").fillColor("black").opacity(1).text(element[0].sekcija, 50);
        }

        element.forEach(test => {

          rows.push(test.rezultat);
          analit = true;

          if (test.hasOwnProperty("data") && test.data.length > 1) {

            var obj = {}
            var ant = []
            var Bakterije = []
            const bheader = ["Antibiotik", "Rezultat", ""]
            let bnaslov = "Antibiogram za bakteriju: "

            test.data.forEach(bactery => {
              if (bactery.bakterija) {
                obj.bakterija_naziv = bactery.naziv;
                obj.bakterija_opis = bactery.opis;
                obj.antibiogram_naziv = bactery.antibiogram.naziv;
                obj.antibiogram_opis = bactery.antibiogram.opis;
                obj.antibiotici = []

                bactery.antibiogram.antibiotici.forEach(antibiotik => {
                  if (antibiotik.rezultat != "") {

                    ant.push(antibiotik.opis)

                    ant.naziv = antibiotik.naziv;
                    ant.opis = antibiotik.opis;
                    switch (antibiotik.rezultat) {
                      case "S":
                        ant.push({
                          rezultat: 'Senzitivan',
                          kontrola: 'No Class'
                        })
                        break;

                      case "I":
                        ant.push({
                          rezultat: 'Intermedijaran',
                          kontrola: 'No Class'
                        })
                        break;
                      case "R":
                        ant.push({
                          rezultat: 'Rezistentan',
                          kontrola: 'No Class'
                        })
                        break;

                      default:
                        break;
                    }

                    ant.push("")
                    ant.push({
                      reference: '/',
                      extend: ''
                    })

                    obj.antibiotici.push(ant)
                  }
                  ant = []
                });
                Bakterije.push(obj)
                obj = {}
              }
            });

            Bakterije.forEach(Bakt => {
              analit = false;
              multi.push({
                naslov: bnaslov + Bakt.bakterija_opis,
                headers: bheader,
                rows: Bakt.antibiotici,
                /* [
                  [ 'Eritrociti', { rezultat: 'uu', kontrola: 'No Class'}, 'x10^12/L', { reference: '4.4 - 5.8', extend: '' }],
                  [ 'Hematokrit', { rezultat: 'uu', kontrola: 'No Class'}, '%', { reference: '42 - 52', extend: '' } ],
                  [ 'Volumen Erc (MCV)', { rezultat: 'uu', kontrola: 'No Class'}, 'fL', { reference: '80 - 94', extend: '' } ] 
                ] */
              });
            });
          }
        });

        if (analit || rows.length) {
          doc.table_mikrobiologija({ headers: report.headers, rows: rows }, { prepareHeader: () => doc.fontSize(8), prepareRow: (row, i) => doc.fontSize(10) }
          );
          multi.forEach(mul => {
            if (doc.y > 630) {
              doc.addPage();
            }
            doc.fontSize(11).fillColor("#7B8186").text(mul.naslov.slice(0, 25), 50).fontSize(12).fillColor("black").text(mul.naslov.slice(25), 170, doc.y - 15);
            doc.fillColor("black")
            doc.moveDown(0.2);
            doc.table_antibiotici({ headers: mul.headers, rows: mul.rows }, { prepareHeader: () => doc.fontSize(8), prepareRow: (row, i) => doc.fontSize(10) });
            doc.moveDown(0.5);
          });
          multi = [];
        }

        /* if (multi.length) {
          multi.forEach(mul => {
            if (doc.y > 650) {
              doc.addPage();
            }
            doc.fontSize(12).opacity(0.2).rect(50, doc.y, 511.5, 15).fill("#7B8186").fillColor("black").opacity(1).fontSize(8).fillColor("red").text(mul.naslov.slice(1, 2), 50).fontSize(12).fillColor("black").text(mul.naslov.slice(4), 57, doc.y - 11);
            doc.table_antibiotici({ headers: mul.headers, rows: mul.rows }, { prepareHeader: () => doc.fontSize(8), prepareRow: (row, i) => doc.fontSize(10) });
          });
        } */
      }
    });

    var leg = "";

    legenda.forEach(element => {
      switch (element) {
        case "S":
          leg += element + "-" + "Serum, ";
          break;
        case "K":
          leg += element + "-" + "Puna Krv, ";
          break;
        case "k":
          leg += element + "-" + "kapilarna krv, ";
          break;
        case "P":
          leg += element + "-" + "Plazma, ";
          break;
        case "U":
          leg += element + "-" + "Urin, ";
          break;
        case "F":
          leg += element + "-" + "Feces, ";
          break;
        case "B":
          leg += element + "-" + "Bris, ";
          break;
        case "E":
          leg += element + "-" + "Ejakulat, ";
          break;
        default:
          break;
      }
    });

    leg = leg.substring(0, leg.length - 2);

    doc.font("PTSansBold").fontSize(8);
    if (legenda.length) {
      doc.fontSize(8).text("Legenda: L - nizak, H - visok\n" + leg, 50, doc.y + reset);
    }
    if (specificni != undefined && specificni.length) {
      var ref = "";

      specificni = specificni.sort(function (a, b) {
        return a.fussnote.localeCompare(b.fussnote, undefined, {
          numeric: true,
          sensitivity: "base"
        });
      });

      specificni.forEach(element => {
        ref = element.extend;
        doc.fontSize(7).text(element.fussnote + " " + ref, 50);
      });
    }

    doc.font("PTSansBold").fontSize(12);

    if (doc.y > 650) {
      doc.addPage();
    }

    if(alergije === true){
      console.log(Inhalation30)
      // Inhalation30

      if (Inhalation30.trim() != "") {
        doc.moveDown(0.3);
        doc.fontSize(10).text("", 50);
      }
      doc.font("PTSansRegular");
      eachLine = Inhalation30.split("\n");
  
      for (var i = 0, l = eachLine.length; i < l; i++) {
        doc.text(eachLine[i], { width: 465, align: "left" });
        if (eachLine[i].length === 0) {
          doc.moveDown(1);
        }
      }

      temp = 60;
      
      doc.image(config.nalaz_references + "Alergije.png", 50, doc.y + 5, { width: 510, keepAspectRatio: true, lineBreak: false });
      doc.moveDown(7);
    }else{

      temp = 0;

    }

    let comment1 = napomena

    if(COV2){
      napomena = "Analiza: COVID-19 Antigen\nUzorak: Bris nazofarinksa\nMetod: Fluorescent Immunoassay (FIA)\n" + comment1
    }

    let comment2 = napomena


    if(AbIgM && AbIgG){
      napomena = "Analize: SARS-COV-2 IgG i SARS-COV-2 IgM su rađene metodom Fluorescent Immunoassay (FIA)\n" + comment2
    }else if(AbIgM && !AbIgG){
      napomena = "Analiza: SARS-COV-2 IgM je rađena metodom Fluorescent Immunoassay (FIA)\n" + comment2
    }else if(!AbIgM && AbIgG){
      napomena = "Analiza: SARS-COV-2 IgG je rađena metodom Fluorescent Immunoassay (FIA)\n" + comment2
    }else{


    }

    if (napomena.length) {
      doc.moveDown(0.3);
      doc.fontSize(12).text("Komentar:", 50);
    }
    doc.font("PTSansRegular");
    eachLine = napomena.split("\n");

    for (var i = 0, l = eachLine.length; i < l; i++) {
      doc.text(eachLine[i], { width: 465, align: "left" });
      if (eachLine[i].length === 0) {
        doc.moveDown(1);
      }
    }
    memo = doc.y - temp;

    doc.font("PTSansRegular").fontSize(10).text("_______________________________", 390).text("       Voditelj laboratorija");

    const range = doc.bufferedPageRange();

    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      doc.font("PTSansRegular").fontSize(10).fillColor("#7B8186").text(adresa, adresa_x, 760, { lineBreak: false }).fontSize(8).fillColor("black").text(`Stranica ${i + 1} od ${range.count}`, doc.page.width / 2 - 25, doc.page.height - 18, { lineBreak: false });
    }
    doc.end();
  }
};
