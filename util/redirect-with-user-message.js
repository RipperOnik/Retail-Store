module.exports = (req, res, message, redirectPath, statusCode, oldInput, validationErrors) => {
    req.session.message = message
    if (oldInput) {
        req.session.oldInput = oldInput
    }

    req.session.validationErrors = validationErrors ?? []
    console.log(validationErrors)

    req.session.save(err => {
        console.log(err);
        if (statusCode) {
            res.status(statusCode).redirect(redirectPath)
        } else {
            res.redirect(redirectPath)
        }
    })
}
