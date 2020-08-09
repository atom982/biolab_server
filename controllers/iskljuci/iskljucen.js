module.exports = {
  test: function (test, site) {
    // console.log(test)
    if (
      test === "PDWs" ||
      test === "Starost" ||
      test === "P-LCC" ||
      test === "P-LCR" ||
      test === "RDWs"
    ) {
      return false;
    } else {
      return true;
    }
  },
};
