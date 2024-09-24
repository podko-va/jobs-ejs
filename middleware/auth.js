const authMiddleware = (req, res, next) => {
    console.log(req.user === undefined)
    if (!req.user) {
      req.flash("errors", "You can't access that page before logon.");
      res.redirect("/");
    } else {
      next();
    }
  };
  
  module.exports = authMiddleware;