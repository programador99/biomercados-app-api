import multer from 'multer'
import path from "path";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../public/upload'))
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = new Date().getTime() + path.extname(file.originalname)
    cb(null, uniqueSuffix)
  }
})

module.exports = multer({ storage }).single('image');