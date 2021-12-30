const util = require("util");
const multer = require("multer");
const maxSize = 2 * 1024 * 1024;
const path = require('path');

let storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "..","resources", "static", "assets", "uploads", "users") );
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

let uploadAvatar = multer({
  storage: storage,
  limits: { fileSize: maxSize },
}).single("avatar");

 let uploadAvatarMiddleware = util.promisify(uploadAvatar);
 module.exports = uploadAvatarMiddleware;


