exports.get404 = (req, res, next) => {
  res.status(404).render('404', {
    pageTitle: 'Page Not Found',
    path: '/404',
    csrfToken: req.csrfToken()
  });
};


exports.get500 = (req, res, next) => {
  res.status(500).render('500', {
    pageTitle: 'Internal Error',
    path: '/500',
    csrfToken: req.csrfToken()
  });
};
