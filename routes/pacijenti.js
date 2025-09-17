var express = require("express");
var router = express.Router();

var pacijenti = require("../controllers/PacijentController.js");

router.post("/pacijenti/unos/find", pacijenti.PatientFind);
router.post("/pacijenti/unos/findid", pacijenti.PatientFindID);
router.post("/pacijenti/unos/save", pacijenti.PatientSave);
router.get("/pacijenti/detalji/:id", pacijenti.DetaljanPregled);
router.post("/pacijenti/detalji/update/:id", pacijenti.PacijentUpdate);

// 17.09.2025. godine
// Islamović Salko
// Pretraga pacijenata - DATUM I VRIJEME IZDAVANJA NALAZA
router.post("/pacijenti/pretraga", pacijenti.Pretraga);
router.post("/pacijenti/pretraga/nalazi", pacijenti.PretragaNalaza);
router.get("/pacijenti/nalaz/download", pacijenti.timestampNalazDownload);

module.exports = router;
