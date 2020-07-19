module.exports = {
  test: function(test, site) {
    // console.log(test)
    if ((test === "HGB - KKS3" || test === "HbA1c - ILab 650" || test === "HDL - ILab 650")) {
      return false;
    } else {
      return true;
    } 
    // return true;
  }
};

