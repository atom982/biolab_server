const path = require("path");
const config = require("../config/index");

var mongoose = require("mongoose");
var fs = require("fs");
var Samples = mongoose.model("Samples");

PDFDocument = require("pdfkit");

var racuniController = {};

// RacuniController.js

class PDFDocumentWithTables extends PDFDocument {
  constructor(options) {
    super(options);
  }

  table(table, arg0, arg1, arg2) {
    let startX = this.page.margins.left,
      startY = this.y;
    let options = {};

    if (typeof arg0 === "number" && typeof arg1 === "number") {
      startX = arg0;
      startY = arg1;

      if (typeof arg2 === "object") options = arg2;
    } else if (typeof arg0 === "object") {
      options = arg0;
    }

    const columnCount = table.headers.length;
    const columnSpacing = options.columnSpacing || 2;
    const rowSpacing = options.rowSpacing || 2;
    const usableWidth =
      options.width ||
      this.page.width - this.page.margins.left - this.page.margins.right;
    const prepareHeader = options.prepareHeader || (() => {});
    const prepareRow = options.prepareRow || (() => {});
    const computeRowHeight = row => {
      let result = 0;

      row.forEach(cell => {
        const cellHeight = this.heightOfString(cell, {
          width: columnWidth,
          align: "left"
        });
        result = Math.max(result, cellHeight);
      });
      return result + rowSpacing;
    };

    const columnContainerWidth = usableWidth / columnCount;
    const columnWidth = columnContainerWidth - columnSpacing;
    const maxY = this.page.height - this.page.margins.bottom;
    let rowBottomY = 0;

    this.on("pageAdded", () => {
      startY = this.page.margins.top + 20;
      rowBottomY = 0;
    });
    // Allow the user to override style for headers
    prepareHeader();
    // Check to have enough room for header and first rows
    if (startY + 3 * computeRowHeight(table.headers) > maxY) this.addPage();
    // Print all headers
    table.headers.forEach((header, i) => {
      if (i === 0) {
        this.text(header, startX + i * columnContainerWidth, startY, {
          width: columnWidth + 40,
          align: "left"
        });
      }
      if (i === 1) {
        this.text(header, startX + 40 + i * columnContainerWidth, startY, {
          width: columnWidth - 40,
          align: "center"
        });
      }
      if (i === 2) {
        this.text(header, startX + i * columnContainerWidth, startY, {
          width: columnWidth - 52,
          align: "center"
        });
      }
      if (i === 3) {
        this.text(header, startX + i * columnContainerWidth, startY, {
          width: columnWidth,
          align: "center"
        });
      }
      if (i === 4) {
        this.text(header, startX + i * columnContainerWidth, startY, {
          width: columnWidth,
          align: "center"
        });
      }
    });
    // Refresh the y coordinate of the bottom of the headers row
    rowBottomY = Math.max(startY + computeRowHeight(table.headers), rowBottomY);
    // Separation line between headers and rows
    this.moveTo(startX, rowBottomY - rowSpacing * 0.5)
      .lineTo(startX + usableWidth, rowBottomY - rowSpacing * 0.5)
      .lineWidth(2)
      .stroke();

    table.rows.forEach((row, i) => {
      const rowHeight = 15; // computeRowHeight(row)
      // Switch to next page if we cannot go any further because the space is ove
      // For safety, consider 3 rows margin instead of just one
      if (startY + 3 * rowHeight < maxY) {
        startY = rowBottomY + rowSpacing;
      } else {
        this.addPage();
      }
      // Allow the user to override style for rows
      prepareRow(row, i);
      // Print all cells of the current row
      var tempcell0 = "";
      var tempcell1 = "";

      row.forEach((cell, i) => {
        if (i === 0) {
          tempcell0 = cell;
          this.text(cell, startX + i * columnContainerWidth, startY, {
            width: columnWidth + 40,
            align: "left"
          });
        }
        if (i === 1) {
          tempcell1 = cell;
          this.text(cell, startX + 40 + i * columnContainerWidth, startY, {
            width: columnWidth - 40,
            align: "center"
          });
        }
        if (i === 2) {
          if (cell === "L" || cell === "H" || cell === "Poz.") {
            this.font("PTSansBold")
              .rect(72, this.y, 468, -14)
              .fill("#cccccc")
              .fillColor("black")
              .text(tempcell0, startX + 0 * columnContainerWidth, startY, {
                width: columnWidth + 40,
                align: "left"
              })
              .text(tempcell1, startX + 40 + 1 * columnContainerWidth, startY, {
                width: columnWidth - 40,
                align: "center"
              })
              .text(cell, startX + i * columnContainerWidth, startY, {
                width: columnWidth - 52,
                align: "center"
              });
          } else {
            this.text(cell, startX + i * columnContainerWidth, startY, {
              width: columnWidth - 52,
              align: "center"
            });
          }
        }
        if (i === 3) {
          this.text(cell, startX + i * columnContainerWidth, startY, {
            width: columnWidth,
            align: "center"
          });
        }
        if (i === 4) {
          this.text(cell, startX + i * columnContainerWidth, startY, {
            width: columnWidth,
            align: "center"
          });
        }
      });
      // Refresh the y coordinate of the bottom of this row
      rowBottomY = Math.max(startY + rowHeight, rowBottomY);
      // Separation line between rows
      this.moveTo(startX, rowBottomY - rowSpacing * 0.5)
        .lineTo(startX + usableWidth, rowBottomY - rowSpacing * 0.5)
        .lineWidth(1)
        .opacity(0.7)
        .stroke()
        .opacity(1); // Reset opacity after drawing the line
    });
    this.x = startX;
    this.moveDown();
    return this;
  }
}

racuniController.Create = function(req, res) {
  if (mongoose.connection.readyState != 1) {
    res.json({
      success: false,
      message: "Greška prilikom konekcije na MongoDB."
    });
  } else {
    req.body.samples = req.body.uzorci.split(",");
    Samples.find({
      site: req.body.site,
      patient: req.body.patient
    })
      .populate("patient site tests.labassay")
      .exec(function(err, samples) {
        if (samples.length) {
          var testovi = [];
          var total = 0;
          var nodiscount = 0;

          samples.forEach(element => {
            req.body.samples.forEach(sample => {
              if (mongoose.Types.ObjectId(sample).equals(element._id)) {
                element.tests.forEach(test => {
                  total += Number(test.labassay.price);
                  nodiscount += Number(test.labassay.price);
                  testovi.push({
                    sekcija: test.labassay.sekcija,
                    grupa: test.labassay.grupa,
                    order: test.labassay.grouporder,
                    test: test.labassay.analit,
                    cijena: test.labassay.price
                  });
                });

                if (req.body.discount > 0) {
                  total = total * ((100 - req.body.discount) / 100);
                }
              }
            });
          });
          testovi.sort(function(a, b) {
            return a.sekcija + a.grupa + a.order ==
              b.sekcija + b.grupa + b.order
              ? 0
              : +(
                  a.sekcija + a.grupa + a.order >
                  b.sekcija + b.grupa + b.order
                ) || -1;
          });
          //--------Datum------------
          var d = new Date(Date.now());
          var mjesec = d.getMonth() + 1;
          if (mjesec < 10) {
            mjesec = "0" + mjesec;
          }
          var dan = d.getUTCDate();
          if (dan < 10) {
            dan = "0" + dan;
          }
          var god = d.getFullYear();
          var datum = dan + "." + mjesec + "." + god;
          //--------------------------

          //-------Vrijeme------------
          var sat = d.getHours();
          if (sat < 10) {
            sat = "0" + sat;
          }
          var min = d.getMinutes();
          if (min < 10) {
            min = "0" + min;
          }
          var sec = d.getSeconds();
          if (sec < 10) {
            sec = "0" + sec;
          }
          var vrijeme = sat + ":" + min + ":" + sec;
          //--------------------------------
          var ime = samples[0].patient.ime;
          var prezime = samples[0].patient.prezime;
          var jmbg = samples[0].patient.jmbg;
          var spol = samples[0].patient.spol;
          var godiste = jmbg.substring(4, 7);
          switch (godiste[0]) {
            case "9":
              godiste = "1" + godiste;
              break;
            case "0":
              godiste = "2" + godiste;
              break;

            default:
              break;
          }

          // console.log(samples[0].site.sifra);

          var rowsno = "Predračun";
          var timestamp = new Date().getTime().toString();

          // console.log(testovi)
          //-------------------------------------------------------------
          const doc = new PDFDocumentWithTables({
            bufferPages: true
          });

          doc.pipe(
            fs
              .createWriteStream(config.racuni_path + timestamp + ".pdf")
              .on("finish", function() {
                res.json({
                  success: true,
                  message: "Racun uspjesno kreiran",
                  link: timestamp + ".pdf",
                  total: total,
                  discount: req.body.discount
                });
              })
          );
          doc.registerFont("PTSansRegular", config.nalaz_ptsansregular);
          doc.registerFont("PTSansBold", config.nalaz_ptsansbold);
          // doc.image(config.nalaz_logo + samples[0].site.sifra + '.jpg', 67, 45, {
          //   fit: [150, 57],
          //   align: 'center',
          //   valign: 'center'
          // })

          // Prilagođavanje visine .PDF

          var visina = 132;

          switch (samples[0].site.sifra) {
            case "C":
              visina = 132;
              break;
            case "M":
              visina = 132;
              break;
            case "P":
              visina = 132;
              break;

            default:
              visina = 132;
              break;
          }

          doc
            .font("PTSansRegular")
            .fontSize(12)
            .text("Ime i prezime: ", 67, visina);
          doc
            .font("PTSansBold")
            .fontSize(14)
            .text(
              " " + ime.toUpperCase() + " " + prezime.toUpperCase(),
              145,
              visina - 2
            );
          doc
            .font("PTSansRegular")
            .fontSize(12)
            .text("Godište:", 67, visina + 16)
            .text(godiste + ".", 112, visina + 16)
            .text("JMBG:", 67, visina + 32)
            .text(jmbg, 99, visina + 32)
            .text("Spol:", 67, visina + 48)
            .text(spol.toLowerCase(), 96, visina + 48)
            .text("Datum: ", 424, visina - 2)
            .text(datum, 474, visina - 2)
            .text("Vrijeme:", 425, visina + 14)
            .text(vrijeme, 485, visina + 14);

          doc
            .font("PTSansBold")
            .fontSize(12)
            .text(rowsno, 67, visina + 78);
          doc.moveDown(1);

          var niz = [];
          var headers = ["Analiza", "Iznos"];
          var rows = [];
          testovi.forEach(element => {
            niz = [];
            niz.push(element.test);
            niz.push(element.cijena);
            rows.push(niz);
          });

          doc.table(
            {
              headers: headers,
              rows: rows
            },
            {
              prepareHeader: () => doc.fontSize(8),
              prepareRow: (row, i) => doc.fontSize(10)
            }
          );

          if (req.body.discount === 0) {
            doc
              .font("PTSansBold")
              .text("", 425)
              .text("Ukupno: " + nodiscount.toFixed(2) + " BAM", {
                underline: true
              });
          } else {
            doc
              .font("PTSansRegular")
              .text("Ukupno: " + nodiscount.toFixed(2) + " BAM", 425)
              .text("Popust: " + req.body.discount + " %", 425)
              .moveDown(0.5);

            doc
              .font("PTSansBold")
              .text("Za platiti: " + total.toFixed(2) + " BAM", {
                underline: true
              });
          }

          const range = doc.bufferedPageRange();

          for (let i = range.start; i < range.start + range.count; i++) {
            doc.switchToPage(i);
            doc
              .font("PTSansRegular")
              .fontSize(8)
              .text(
                `Stranica ${i + 1} od ${range.count}`,
                doc.page.width / 2 - 25,
                doc.page.height - 30,
                {
                  lineBreak: false
                }
              );
          }
          doc.end();
        } else {
          res.json({
            success: true,
            message: "Nema pronadjenih rezultata"
          });
        }
      });
  }
};

racuniController.Generate = function(req, res) {
  if (mongoose.connection.readyState != 1) {
    res.json({
      success: false,
      message: "Greška prilikom konekcije na MongoDB."
    });
  } else {
    // console.log("req.body");
    req.body.samples = req.body.uzorci.split(",");
    Samples.find({
      site: req.body.site,
      patient: req.body.patient
    })
      .populate("patient site tests.labassay")
      .exec(function(err, samples) {
        if (samples.length) {
          var testovi = [];
          var total = 0;
          var nodiscount = 0;

          samples.forEach(element => {
            req.body.samples.forEach(sample => {
              if (sample === element.id) {
                element.tests.forEach(test => {
                  total += Number(test.labassay.price);
                  nodiscount += Number(test.labassay.price);
                  testovi.push({
                    sekcija: test.labassay.sekcija,
                    grupa: test.labassay.grupa,
                    order: test.labassay.grouporder,
                    test: test.labassay.analit,
                    cijena: test.labassay.price
                  });
                });
              }
            });
          });

          if (req.body.discount > 0) {
            total = total * ((100 - req.body.discount) / 100);
          }
          // console.log("total " + total);

          testovi.sort(function(a, b) {
            return a.sekcija + a.grupa + a.order ==
              b.sekcija + b.grupa + b.order
              ? 0
              : +(
                  a.sekcija + a.grupa + a.order >
                  b.sekcija + b.grupa + b.order
                ) || -1;
          });
          //--------Datum------------
          var d = new Date(Date.now());
          var mjesec = d.getMonth() + 1;
          if (mjesec < 10) {
            mjesec = "0" + mjesec;
          }
          var dan = d.getUTCDate();
          if (dan < 10) {
            dan = "0" + dan;
          }
          var god = d.getFullYear();
          var datum = dan + "." + mjesec + "." + god;
          //--------------------------

          //-------Vrijeme------------
          var sat = d.getHours();
          if (sat < 10) {
            sat = "0" + sat;
          }
          var min = d.getMinutes();
          if (min < 10) {
            min = "0" + min;
          }
          var sec = d.getSeconds();
          if (sec < 10) {
            sec = "0" + sec;
          }
          var vrijeme = sat + ":" + min + ":" + sec;
          //--------------------------------
          var ime = samples[0].patient.ime;
          var prezime = samples[0].patient.prezime;
          var jmbg = samples[0].patient.jmbg;

          
          var spol = samples[0].patient.spol;
          spol = samples[0].patient.spol[0].toUpperCase() + samples[0].patient.spol.slice(1).toLowerCase();
          // console.log(spol)
          var godiste = jmbg.substring(4, 7);
          switch (godiste[0]) {
            case "9":
              godiste = "1" + godiste;
              break;
            case "0":
              godiste = "2" + godiste;
              break;

            default:
              break;
          }

          // console.log(samples[0].site.sifra);

          var rowsno = "Predračun";
          var timestamp = new Date().getTime().toString();

          // console.log(testovi)
          //-------------------------------------------------------------
          const doc = new PDFDocumentWithTables({
            bufferPages: true
          });

          doc.pipe(
            fs
              .createWriteStream(config.racuni_path + timestamp + ".pdf")
              .on("finish", function() {
                res.json({
                  success: true,
                  message: "Racun uspjesno kreiran",
                  link: timestamp + ".pdf",
                  total: total,
                  discount: req.body.discount
                });
              })
          );
          doc.registerFont("PTSansRegular", config.nalaz_ptsansregular);
          doc.registerFont("PTSansBold", config.nalaz_ptsansbold);
          // doc.image(config.nalaz_logo + samples[0].site.sifra + '.jpg', 67, 45, {
          //   fit: [150, 57],
          //   align: 'center',
          //   valign: 'center'
          // })

          // Prilagođavanje visine .PDF

          var visina = 132;

          switch (samples[0].site.sifra) {
            case "C":
              visina = 132;
              break;
            case "M":
              visina = 132;
              break;
            case "P":
              visina = 132;
              break;

            default:
              visina = 132;
              break;
          }

          doc
            .font("PTSansRegular")
            .fontSize(12)
            .text("Ime i prezime: ", 67, visina);
          doc
            .font("PTSansBold")
            .fontSize(14)
            .text(
              " " + ime.toUpperCase() + " " + prezime.toUpperCase(),
              145,
              visina - 2
            );
          doc
            .font("PTSansRegular")
            .fontSize(12)
            .text("Godište:", 67, visina + 16)
            .text(godiste + ".", 112, visina + 16)
            .text("Spol:", 67, visina + 32)
            .text(spol, 96, visina + 32)
            
            // .text("JMBG:", 67, visina + 32)
            // .text(jmbg, 99, visina + 32)
            // .text("Spol:", 67, visina + 48)
            // .text(spol, 96, visina + 48)
            .text("Datum: ", 424, visina + 16)
            .text(datum, 474, visina + 16)
            .text("Vrijeme:", 425, visina + 32)
            .text(vrijeme, 486.5, visina + 32);

          doc
            .font("PTSansBold")
            .fontSize(12)
            .text(rowsno, 67, visina + 78);
          doc.moveDown(1);

          var niz = [];
          var headers = ["Analiza", "Iznos"];
          var rows = [];
          testovi.forEach(element => {
            niz = [];
            niz.push(element.test);
            niz.push(element.cijena);
            rows.push(niz);
          });

          doc.table(
            {
              headers: headers,
              rows: rows
            },
            {
              prepareHeader: () => doc.fontSize(8),
              prepareRow: (row, i) => doc.fontSize(10)
            }
          );

          if (req.body.discount === 0) {
            doc
              .font("PTSansBold")
              .text("", 425)
              .text("Ukupno: " + nodiscount.toFixed(2) + " BAM", {
                underline: true
              });
          } else {
            doc
              .font("PTSansRegular")
              .text("Ukupno: " + nodiscount.toFixed(2) + " BAM", 425)
              .text("Popust: " + req.body.discount + " %", 425)
              .moveDown(0.5);

            doc
              .font("PTSansBold")
              .text("Za platiti: " + total.toFixed(2) + " BAM", {
                underline: true
              });
          }

          const range = doc.bufferedPageRange();

          for (let i = range.start; i < range.start + range.count; i++) {
            doc.switchToPage(i);
            doc
              .font("PTSansRegular")
              .fontSize(8)
              .text(
                `Stranica ${i + 1} od ${range.count}`,
                doc.page.width / 2 - 25,
                doc.page.height - 30,
                {
                  lineBreak: false
                }
              );
          }
          doc.end();
        } else {
          res.json({
            success: true,
            message: "Nema pronadjenih rezultata"
          });
        }
      });
  }
};

module.exports = racuniController;
