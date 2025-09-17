var mongoose = require("mongoose");
var Patients = require("../models/Postavke");
var Audit_Patients = require("../models/Audit");
var Patients = mongoose.model("Patients");
var Audit_Patients = mongoose.model("Audit_Patients");
var Nalazi = mongoose.model("Nalazi");

const config = require("../config/index");

var pacijentController = {};

// PacijentController.js

pacijentController.PatientFind = function (req, res) {
  Patients.findOne({ jmbg: req.body.jmbg, site: req.body.site }).exec(function (
    err,
    pacijent
  ) {
    if (err) {
      console.log("Greška:", err);
      res.json({
        success: false,
        message: "Greška prilikom pretraživanja baze",
      });
    } else {
      if (pacijent) {
        res.json({ success: true, message: "Pacijent postoji", pacijent });
      } else {
        res.json({ success: false, message: "Pacijent ne postoji" });
      }
    }
  });
};

pacijentController.PatientFindID = function (req, res) {
  Patients.findOne({ _id: req.body.id, site: req.body.site }).exec(function (
    err,
    pacijent
  ) {
    if (err) {
      console.log("Greška:", err);
      res.json({
        success: false,
        message: "Greška prilikom pretraživanja baze",
      });
    } else {
      if (pacijent) {
        res.json({ success: true, message: "Pacijent postoji", pacijent });
      } else {
        res.json({ success: false, message: "Pacijent ne postoji" });
      }
    }
  });
};

pacijentController.PatientSave = function (req, res) {
  req.body.created_at = new Date(
    new Date().getTime() - new Date().getTimezoneOffset() * 60000
  );
  req.body.updated_at = null;
  req.body.created_by = req.body.decoded.user;
  req.body.updated_by = null;
  var pacijent = new Patients(req.body);
  if (mongoose.connection.readyState != 1) {
    res.json({
      success: false,
      message: "Greška prilikom konekcije na MongoDB.",
    });
  } else {
    pacijent.save(function (err, pacijent) {
      if (err) {
        console.log("Greška:", err);
        res.json({ success: false, message: err });
      } else {
        res.json({
          success: true,
          message: "Pacijent uspješno sačuvan.",
          pacijent,
        });
      }
    });
  }
};

pacijentController.DetaljanPregled = function (req, res) {
  Patients.findOne({ _id: req.params.id }).exec(function (err, pacijent) {
    if (err) {
      console.log("Greška:", err);
      res.json({
        success: false,
        message: "Greška prilikom pretraživanja baze",
      });
    } else {
      if (pacijent) {
        res.json({ success: true, message: "Pacijent postoji", pacijent });
      } else {
        res.json({ success: false, message: "Pacijent ne postoji" });
      }
    }
  });
};

pacijentController.PacijentUpdate = function (req, res) {
  if (mongoose.connection.readyState != 1) {
    res.json({
      success: false,
      message: "Greška prilikom konekcije na MongoDB.",
    });
  } else {
    /* Patients.find({}).exec(function (err, pacijents) {
      if (err) {
        console.log("Greška:", err)
      }
      else {

        pacijents.forEach(element => {          
          element.adresa = 'NEPOZNATO'            
          element.save()
        })

        res.json({ success: true, message: 'Pacijent izmjenjen' })
      }
    }) */

    Patients.findOne({ _id: req.params.id }).exec(function (err, pacijent) {
      if (err) {
        console.log("Greška:", err);
      } else {
        if (pacijent) {
          if (typeof req.body.jmbg !== "undefined" && req.body.jmbg) {
            var audit_body = {};

            audit_body.jmbg = pacijent.jmbg;
            audit_body.ime = pacijent.ime;
            audit_body.prezime = pacijent.prezime;
            audit_body.roditelj = pacijent.roditelj;
            audit_body.spol = pacijent.spol;
            audit_body.duhan = pacijent.duhan;
            audit_body.dijabetes = pacijent.dijabetes;
            audit_body.lokacija = pacijent.lokacija;
            audit_body.passport = pacijent.passport;
            audit_body.telefon = pacijent.telefon;
            audit_body.email = pacijent.email;
            audit_body.adresa = pacijent.adresa;
            audit_body.site = pacijent.site;
            audit_body.created_at = pacijent.created_at;
            audit_body.updated_at = pacijent.updated_at;
            audit_body.created_by = pacijent.created_by;
            audit_body.updated_by = pacijent.updated_by;

            var audit_pacijent = new Audit_Patients(audit_body);
            audit_pacijent.save();

            pacijent.jmbg = req.body.jmbg;
            pacijent.ime = req.body.ime;
            pacijent.prezime = req.body.prezime;
            pacijent.roditelj = req.body.roditelj;
            pacijent.spol = req.body.spol;
            pacijent.duhan = req.body.duhan;
            pacijent.dijabetes = req.body.dijabetes;
            pacijent.passport = req.body.passport;
            pacijent.telefon = req.body.telefon;
            pacijent.email = req.body.email;
            pacijent.adresa = req.body.adresa;
            pacijent.updated_by = req.body.decoded.user;
            pacijent.updated_at = new Date(
              new Date().getTime() - new Date().getTimezoneOffset() * 60000
            );
            
            pacijent.save();

            res.json({ success: true, message: "Pacijent izmjenjen" });
          } else {
            pacijent.email = req.body.email;
            pacijent.save();
            res.json({ success: true, message: "Pacijent izmjenjen" });
          }
        } else {
          res.json({ success: false, message: "Pacijent nije pronadjen" });
        }
      }
    });
  }
};

// 17.09.2025. godine
// Islamović Salko
// Pretraga pacijenata - DATUM I VRIJEME IZDAVANJA NALAZA

var fs = require("fs");

pacijentController.Pretraga = function (req, res) {
  if (mongoose.connection.readyState != 1) {
    res.json({
      success: false,
      message: "Greška prilikom konekcije na MongoDB.",
    });
  } else {
    var uslov = {
      site: mongoose.Types.ObjectId(req.body.site),
      ime: { $regex: req.body.ime.toUpperCase().trim() },
      prezime: { $regex: req.body.prezime.toUpperCase().trim() },
    };

    Patients.find(uslov).exec(function (err, patients) {
      if (err) {
        console.log("Greška:", err);
        res.json({
          success: false,
          message: "Greška prilikom pretraživanja baze.",
          pacijenti: [],
        });
      } else {
        var pacijenti = [];
        var Data = {};
        var godiste = "";

        patients.forEach((element) => {
          if (
            element.ime.includes(req.body.ime.toUpperCase().trim()) &&
            element.prezime.includes(req.body.prezime.toUpperCase().trim())
          ) {
            Data = {};
            godiste = "";

            godiste = element.jmbg.substring(4, 7);
            switch (godiste[0]) {
              case "9":
                godiste = "1" + godiste + "";
                break;
              case "0":
                godiste = "2" + godiste + "";
                break;
              default:
                godiste = "";
                break;
            }

            if (godiste == "1920") {
              var godisteTemp = "Nema podataka";
            } else {
              var godisteTemp = godiste;
            }

            Data._id = element._id;
            Data.ime = element.ime;
            Data.prezime = element.prezime;
            Data.jmbg = element.jmbg;
            Data.godiste = godisteTemp;
            Data.active = false;

            pacijenti.push(Data);
          }
        });

        if (pacijenti.length > 0) {
          res.json({
            success: true,
            message: "Pacijenti u prilogu.",
            pacijenti: pacijenti,
          });
        } else {
          res.json({
            success: false,
            message: "Nema podataka.",
            pacijenti: [],
          });
        }
      }
    });
  }
};

pacijentController.PretragaNalaza = function (req, res) {
  var uslov = {
    status: true,
    site: mongoose.Types.ObjectId(req.body.site),
    patient: mongoose.Types.ObjectId(req.body._id),
  };

  Nalazi.find(uslov)
    .populate("patient lokacija")
    .exec(function (err, nalazi) {
      if (err) {
        console.log("Greška:", err);
        res.json({
          success: false,
          message: "Greška prilikom pretraživanja baze.",
          rezultati: [],
        });
      } else {
        // console.log(nalazi.length);

        if (nalazi.length > 0) {
          var rezultati = nalazi;
          var Data = {};

          res.json({
            success: true,
            message: "Pacijenti postoje.",
            rezultati: rezultati,
          });
        } else {
          res.json({
            success: false,
            message: "Nema podataka",
            rezultati: [],
          });
        }
      }
    });
};

pacijentController.timestampNalazDownload = function (req, res) {
  var exists = false;

  var file_path = config.nalaz_path + req.query.timestamp + ".pdf";

  try {
    if (fs.existsSync(file_path)) {
      exists = true;
      res.setHeader("Content-Type", "writeTheType");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=" + req.query.timestamp + ".pdf"
      );
      fs.createReadStream(file_path).pipe(res);
    } else {
      exists = false;
      file_path = config.nalaz_path + "archived/1695550538930" + ".pdf";

      res.setHeader("Content-Type", "writeTheType");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=" + req.query.timestamp + ".pdf"
      );
      fs.createReadStream(file_path).pipe(res);
    }
  } catch (err) {
    console.error(err);

    exists = false;
    file_path = config.nalaz_path + "archived/1695550538930" + ".pdf";

    res.setHeader("Content-Type", "writeTheType");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=" + req.query.timestamp + ".pdf"
    );
    fs.createReadStream(file_path).pipe(res);
  }
};

module.exports = pacijentController;
