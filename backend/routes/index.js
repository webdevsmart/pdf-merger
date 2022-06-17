let express = require('express'),
    multer = require('multer'),
    router = express.Router();

const pdfMerge = require('easy-pdf-merge'),
        fs = require("fs");

const DIR = './public/';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, DIR);
    },
    filename: (req, file, cb) => {
        const fileName = file.originalname.toLowerCase().split(' ').join('-');
        // cb(null, uuidv4() + '-' + fileName)
        cb(null, Date.now() +'-'+ fileName);
    }
});

var upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === "application/pdf") {
            cb(null, true);
        } else {
            console.log(file.mimetype)
            cb(null, false);
            return cb(new Error('Only .pdf format allowed!'));
        }
    }
});

// User model
let User = require('../models/User');

router.post('/upload-images', upload.array('imgCollection', 100), (req, res, next) => {
    console.log('router');
    const reqFiles = [];
    const url = req.protocol + '://' + req.get('host')
    for (var i = 0; i < req.files.length; i++) {
        reqFiles.push(url + '/public/' + req.files[i].filename)
    }

    console.log(reqFiles)
})

// var mergepdffilesupload = multer({storage:storage,fileFilter:mergepdffilter})

router.post('/mergepdf', upload.array('file',100), (req,res) => {
    const files = [], url = req.protocol + '://' + req.get('host') + "/public/" + Date.now() + "-output.pdf"
    const outputFilePath = __dirname + "\\..\\public\\" + Date.now() + "-output.pdf"

    if (req.files) {
      req.files.forEach(file => {
          files.push(__dirname + "\\..\\public\\" + file.filename)
      });

      const opts = {
          maxBuffer: 1024 * 500, // 500kb
          maxHeap: '2g' // for setting JVM heap limits to 2GB
      };
      
      pdfMerge(files, outputFilePath, opts, function(err) {
          if (err) {
              console.log(err)
              fs.unlinkSync(outputFilePath)
              res.status(400).json({  
                status_code: 0,
                error_msg: "Require Params Missing", 
                message:"Some error takes place in merging the pdf file"
              })
          } else {
            res.status(200).json({downloadUrl : url})
          }

          // res.status(200).download(outputFilePath, (err) => {
          //     if (err) {
          //         res.status(400).json({  status_code: 0,
          //                                 error_msg: "Require Params Missing", 
          //                                 message:"Some error takes place in downloading the file"})
          //     }
          //     console.log("downloaded successfully.")
          // })
          // console.log(url)
          // res.status(200).json({data:url, message: 'okay'})
      })
    }
})

router.get("/", (req, res, next) => {
    res.status(200).json({
        message: "User list retrieved successfully!",
    });
});

module.exports = router;