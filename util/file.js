const fs = require('fs')
const path = require('path')
exports.deleteFile = (filePath) => {
    const filePathPoints = filePath.split('/')
    const fileName = filePathPoints[filePathPoints.length - 1]
    fs.unlink(path.join('images', fileName), (err) => {
        if (err) {
            throw err
        }
    })
}