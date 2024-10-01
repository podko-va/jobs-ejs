const authMiddleware = (req, res, next) => {
  //console.log("User object: ", req.user);
    if (!req.user) {
      req.flash("errors", "You can't access that page before logon.");
      res.redirect("/");
    } else {
      next();
    }
  };
  
  module.exports = authMiddleware;