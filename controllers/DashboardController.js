var mongoose = require("mongoose");

var dashboardController = {};

dashboardController.dashboardData = function(req, res) {
  if (mongoose.connection.readyState != 1) {
    res.json({
      success: false,
      message: "Greška prilikom konekcije na MongoDB."
    });
  } else {
    req.query.sites.forEach(site => {
      // console.log(mongoose.Types.ObjectId(site));
    });

    var datum = new Date(
      new Date().getTime() - new Date().getTimezoneOffset() * 60000
    )
      .toISOString()
      .substring(0, 10);
    var from = new Date(datum + "T00:00:00Z");
    var to = new Date(datum + "T23:59:59Z");

    // console.log(from);
    // console.log(to);

    var uslov = {};

    /* uslov = {
      $gte: new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000)
    } */

    uslov = {
      created_at: {
        $gt: from,
        $lt: to
      }
    };

    // console.log(uslov);

    Results.find(uslov)
      .populate("patient")
      .exec(function(err, results) {
        if (err) {
          console.log("Greška:", err);
          res.json({
            success: false,
            message: err
          });
        } else {
          if (results.length) {
            var counter = 0;
            var Zaprimljen = 0;
            var Realizovan = 0;

            var ukupnoTestova = 0;
            var realizovanoTestova = 0;

            var patients = [];
            var patient = { _id: null, jmbg: null, site: null };

            var samples = [];
            var sample = { id: null, status: null, site: null, tests: null };

            results.forEach(element => {
              ukupnoTestova = 0;
              realizovanoTestova = 0;
              // Today
              // if (element.created_at <= to && element.created_at >= from) {
              if (true) {
                if (
                  !patients.filter(
                    patient => patient._id == element.patient._id
                  ).length > 0
                ) {
                  patient = {
                    _id: element.patient._id,
                    jmbg: element.patient.jmbg,
                    site: element.site
                  };
                  patients.push(patient);
                  patient = { _id: null, jmbg: null, site: null };
                }

                if (
                  element.status === "ODOBREN" ||
                  element.verificiran === true
                ) {
                  element.rezultati.forEach(test => {
                    ukupnoTestova++;

                    if (
                      test.rezultat[test.rezultat.length - 1].rezultat_f != ""
                    ) {
                      realizovanoTestova++;
                    }
                  });

                  sample = {
                    id: element.id,
                    status: "Odobren",
                    site: element.site,
                    tests: {
                      Ukupno: ukupnoTestova,
                      Realizovano: realizovanoTestova
                    }
                  };
                  samples.push(sample);
                  sample = { id: null, status: null, site: null, tests: null };
                } else {
                  counter = 0;
                  Zaprimljen = 0;
                  Realizovan = 0;

                  element.rezultati.forEach(test => {
                    ukupnoTestova++;

                    counter++;
                    if (
                      test.rezultat[test.rezultat.length - 1].rezultat_f === ""
                    ) {
                      Zaprimljen++;
                    }
                    if (
                      test.rezultat[test.rezultat.length - 1].rezultat_f != ""
                    ) {
                      Realizovan++;
                      realizovanoTestova++;
                    }

                    if (counter === element.rezultati.length) {
                      if (Zaprimljen < 1) {
                        sample = {
                          id: element.id,
                          status: "Realizovan",
                          site: element.site,
                          tests: {
                            Ukupno: ukupnoTestova,
                            Realizovano: realizovanoTestova
                          }
                        };
                        samples.push(sample);
                        sample = {
                          id: null,
                          status: null,
                          site: null,
                          tests: null
                        };
                      } else if (Realizovan < 1) {
                        sample = {
                          id: element.id,
                          status: "Zaprimljen",
                          site: element.site,
                          tests: {
                            Ukupno: ukupnoTestova,
                            Realizovano: realizovanoTestova
                          }
                        };
                        samples.push(sample);
                        sample = {
                          id: null,
                          status: null,
                          site: null,
                          tests: null
                        };
                      } else {
                        sample = {
                          id: element.id,
                          status: "U obradi",
                          site: element.site,
                          tests: {
                            Ukupno: ukupnoTestova,
                            Realizovano: realizovanoTestova
                          }
                        };
                        samples.push(sample);
                        sample = {
                          id: null,
                          status: null,
                          site: null,
                          tests: null
                        };
                      }
                    }
                  });
                }
              }
              // End of Today
            });

            res.json({
              success: true,
              message: "Success.",
              Results: results,
              Patients: patients,
              Samples: samples
            });
          } else {
            res.json({
              success: true,
              message: "Nema podataka.",
              Results: [],
              Patients: [],
              Samples: []
            });
          }
        }
      });
  }
};

dashboardController.DonutChart = function(req, res) {
  var datum = new Date();
  datum.setDate(datum.getDate());

  var mjesec = datum.getMonth() + 1;
  var dan = datum.getUTCDate();

  if (dan < 10) {
    dan = "0" + dan;
  }

  if (mjesec < 10) {
    mjesec = "0" + mjesec;
  }

  var datum = datum.getFullYear() + "-" + mjesec + "-" + dan;

  var from = new Date();
  var to = new Date();

  from = datum + "T00:00:00";
  from = new Date(from + "Z");
  to = datum + "T23:59:59";
  to = new Date(to + "Z");

  if (mongoose.connection.readyState != 1) {
    res.json({
      success: false,
      message: "Greška prilikom konekcije na MongoDB."
    });
  } else {
    Results.find({
      created_at: {
        $gt: from,
        $lt: to
      },
      site: mongoose.Types.ObjectId(req.query.site)
    }).exec(function(err, results) {
      if (err) {
        console.log("Greška:", err);
        res.json({
          success: false,
          message: err
        });
      } else {
        if (!results.length) {
          var json = {};
          json.zaprimljenUzorak = 0;
          json.uObradiUzorak = 0;
          json.realizovanUzorak = 0;
          json.obradjenUzorak = 0;
          json.empty = true;

          res.json({
            success: true,
            message: "Nema podataka.",
            json,
            results
          });
        } else {
          var json = {};
          json.zaprimljenUzorak = 0;
          json.uObradiUzorak = 0;
          json.realizovanUzorak = 0;
          json.obradjenUzorak = 0;
          json.empty = false;

          results.forEach(element => {
            var uslov = 0;
            var zaprimljen = 0;
            var realizovan = 0;
            var status_uzorka = element.status;
            var verificiran = element.verificiran;

            if (status_uzorka === "ODOBREN" || verificiran) {
              json.obradjenUzorak++;
            } else {
              element.rezultati.forEach(test => {
                uslov++;
                if (test.rezultat[test.rezultat.length - 1].rezultat_f === "") {
                  zaprimljen++;
                }
                if (test.rezultat[test.rezultat.length - 1].rezultat_f != "") {
                  realizovan++;
                }

                if (uslov === element.rezultati.length) {
                  if (zaprimljen < 1) {
                    json.realizovanUzorak++;
                  } else if (realizovan < 1) {
                    json.zaprimljenUzorak++;
                  } else {
                    json.uObradiUzorak++;
                  }
                }
              });
            }
          });
          res.json({
            success: true,
            message: "Success",
            json,
            results
          });
        }
      }
    });
  }
};

dashboardController.VerticalBar = function(req, res) {
  if (mongoose.connection.readyState != 1) {
    res.json({
      success: false,
      message: "Greška prilikom konekcije na MongoDB."
    });
  } else {
    Results.find({
      created_at: {
        $gte: new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000)
      },
      site: mongoose.Types.ObjectId(req.query.site)
    })
      .populate("patient")
      .exec(function(err, results) {
        if (err) {
          console.log("Greška:", err);
          res.json({
            success: false,
            message: err
          });
        } else {
          var barData = {};
          barData.labels = [];
          barData.labela = [];
          barData.data = [];
          barData.obr = [];
          barData.patients = [];

          var temp = null;
          var labela = null;
          var counter = 0;
          var brojac = 0;
          var jmbg = [];

          results.forEach(result => {
            temp = result.id.slice(4, result.id.length);
            if (
              !barData.labels.filter(element => element === temp).length > 0
            ) {
              labela = temp.slice(4, 6) + "/" + temp.slice(2, 4);
              barData.labels.push(temp);
              barData.labela.push(labela);
            }
          });

          barData.labels.forEach(element => {
            counter = 0;
            brojac = 0;
            jmbg = [];

            results.forEach(result => {
              temp = result.id.slice(4, result.id.length);
              if (temp === element) {
                counter++;
                if (
                  result.status === "ODOBREN" ||
                  result.verificiran === true
                ) {
                  brojac++;
                }
                if (
                  !jmbg.filter(pacijent => pacijent === result.patient.jmbg)
                    .length > 0
                ) {
                  jmbg.push(result.patient.jmbg);
                }
              }
            });

            barData.data.push(counter);
            barData.obr.push(brojac);
            barData.patients.push(jmbg.length);
          });
          res.json({
            success: true,
            message: "Success.",
            barData
          });
        }
      });
  }
};

dashboardController.InfoWidgets = function(req, res) {
  var datum = new Date();
  datum.setDate(datum.getDate());

  var mjesec = datum.getMonth() + 1;
  var dan = datum.getUTCDate();

  if (dan < 10) {
    dan = "0" + dan;
  }

  if (mjesec < 10) {
    mjesec = "0" + mjesec;
  }

  var datum = datum.getFullYear() + "-" + mjesec + "-" + dan;

  var from = new Date();
  var to = new Date();

  from = datum + "T00:00:00";
  from = new Date(from + "Z");
  to = datum + "T23:59:59";
  to = new Date(to + "Z");

  if (mongoose.connection.readyState != 1) {
    res.json({
      success: false,
      message: "Greška prilikom konekcije na MongoDB."
    });
  } else {
    Results.find({
      created_at: {
        $gt: from,
        $lt: to
      },
      site: mongoose.Types.ObjectId(req.query.site)
    }).exec(function(err, results) {
      if (err) {
        console.log("Greška:", err);
        res.json({
          success: false,
          message: err
        });
      } else {
        if (!results.length) {
          var json = {};
          json.ukupnoUzoraka = 0;
          json.obradjenUzorak = 0;
          json.realizovanoTestova = 0;
          json.ukupnoTestova = 0;
          json.empty = true;

          res.json({
            success: true,
            message: "Nema podataka.",
            json,
            results
          });
        } else {
          var json = {};
          json.ukupnoUzoraka = results.length;
          json.obradjenUzorak = 0;
          json.realizovanoTestova = 0;
          json.ukupnoTestova = 0;
          json.empty = false;

          results.forEach(element => {
            var uslov = 0;
            var status_uzorka = element.status;
            var verificiran = element.verificiran;

            element.rezultati.forEach(test => {
              uslov++;

              if (test.rezultat[test.rezultat.length - 1].rezultat_f != "") {
                json.realizovanoTestova++;
              }

              if (uslov === element.rezultati.length) {
                if (status_uzorka === "ODOBREN" || verificiran) {
                  json.obradjenUzorak++;
                }
              }
            });
            json.ukupnoTestova += element.rezultati.length;
          });
          res.json({
            success: true,
            message: "Success",
            json,
            results
          });
        }
      }
    });
  }
};

dashboardController.Patients = function(req, res) {
  var datum = new Date();
  datum.setDate(datum.getDate());

  var mjesec = datum.getMonth() + 1;
  var dan = datum.getUTCDate();

  if (dan < 10) {
    dan = "0" + dan;
  }

  if (mjesec < 10) {
    mjesec = "0" + mjesec;
  }

  var datum = datum.getFullYear() + "-" + mjesec + "-" + dan;

  var from = new Date();
  var to = new Date();

  from = datum + "T00:00:00";
  from = new Date(from + "Z");
  to = datum + "T23:59:59";
  to = new Date(to + "Z");

  var uslov = {};
  uslov = {
    created_at: {
      $gt: from,
      $lt: to
    },
    site: mongoose.Types.ObjectId(req.query.site)
  };

  if (mongoose.connection.readyState != 1) {
    res.json({
      success: false,
      message: "Greška prilikom konekcije na MongoDB."
    });
  } else {
    Samples.find(uslov)
      .populate("patient")
      .exec(function(err, samples) {
        if (err) {
          console.log("Greška:", err);
          res.json({
            success: false,
            message: err
          });
        } else {
          jmbg = [];
          if (samples.length) {
            samples.forEach(element => {
              if (
                !jmbg.filter(pacijent => pacijent === element.patient.jmbg)
                  .length > 0
              ) {
                jmbg.push(element.patient.jmbg);
              }
            });
            res.json({
              success: true,
              jmbg: jmbg
            });
          } else {
            res.json({
              success: true,
              message: "Success.",
              jmbg: jmbg
            });
          }
        }
      });
  }
};

dashboardController.LineChart = function(req, res) {
  if (mongoose.connection.readyState != 1) {
    res.json({
      success: false,
      message: "Greška prilikom konekcije na MongoDB."
    });
  } else {
    Results.find({
      created_at: {
        $gte: new Date(new Date().getTime() - 90 * 24 * 60 * 60 * 1000)
      },
      site: mongoose.Types.ObjectId(req.query.site)
    })
      .populate("patient")
      .exec(function(err, results) {
        if (err) {
          console.log("Greška:", err);
          res.json({
            success: false,
            message: err
          });
        } else {
          var barData = {};
          barData.labels = [];
          barData.labela = [];
          barData.data = [];
          barData.obr = [];
          barData.patients = [];

          var temp = null;
          var labela = null;
          var mjesta = [""];
          var lokacija = "";
          var Rezultati = [];
          var counter = 0;
          var brojac = 0;
          var jmbg = [];

          if (req.query.adresa.trim() === "") {
            lokacija = "Sve lokacije";
          } else {
            lokacija = req.query.adresa;
          }

          results.forEach(result => {
            if (
              !mjesta.filter(pacijent => pacijent === result.patient.adresa)
                .length > 0
            ) {
              mjesta.push(result.patient.adresa);
            }

            if (req.query.adresa.trim() === "") {
              Rezultati.push(result);
            } else {
              if (req.query.adresa.trim() === result.patient.adresa) {
                Rezultati.push(result);
              }
            }
          });

          Rezultati.forEach(result => {
            temp = result.id.slice(4, result.id.length);
            if (
              !barData.labels.filter(element => element === temp).length > 0
            ) {
              labela = temp.slice(4, 6) + "/" + temp.slice(2, 4);
              barData.labels.push(temp);
              barData.labela.push(labela);
            }
          });

          barData.labels.forEach(element => {
            counter = 0;
            brojac = 0;
            jmbg = [];

            Rezultati.forEach(result => {
              temp = result.id.slice(4, result.id.length);
              if (temp === element) {
                counter++;
                if (
                  result.status === "ODOBREN" ||
                  result.verificiran === true
                ) {
                  brojac++;
                }
                if (
                  !jmbg.filter(pacijent => pacijent === result.patient.jmbg)
                    .length > 0
                ) {
                  jmbg.push(result.patient.jmbg);
                }
              }
            });

            barData.data.push(counter);
            barData.obr.push(brojac);
            barData.patients.push(jmbg.length);
          });
          res.json({
            success: true,
            message: "Success.",
            barData,
            mjesta,
            lokacija
          });
        }
      });
  }
};

dashboardController.BubbleChart = function(req, res) {
  if (mongoose.connection.readyState != 1) {
    res.json({
      success: false,
      message: "Greška prilikom konekcije na MongoDB."
    });
  } else {
    Results.find({
      patient: mongoose.Types.ObjectId(req.query.patient),
      site: mongoose.Types.ObjectId(req.query.site)
    })
      .populate("patient")
      .exec(function(err, results) {
        if (err) {
          console.log("Greška:", err);
          res.json({
            success: false,
            message: err
          });
        } else {
          if (results.length) {
            var count = 0;
            var Results = [];

            results.forEach(element => {
              count++;
              if (element.verificiran) {
                Results.push(element);
              }

              if (count == results.length) {
                res.json({
                  success: true,
                  message: "Success.",
                  Results
                });
              }
            });
          } else {
            var Results = [];
            res.json({
              success: false,
              message: "Nema podataka.",
              Results
            });
          }
        }
      });
  }
};

module.exports = dashboardController;
