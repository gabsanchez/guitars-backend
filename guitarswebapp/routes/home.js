var express = require('express');
var router = express.Router();
var path = require('path');
var app = express();
app.use(express.static(__dirname + "/dist/guitars-app"));
/* GET home page. */
router.get('/', (req, res) => res.sendfile(path.join(__dirname)));
module.exports = router;