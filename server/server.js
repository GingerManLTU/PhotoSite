const express = require('express')
const dotenv = require('dotenv')
const cors = require('cors')
const bodyParser = require('body-parser')
// const db = require("./app/config/db.config")
const multer = require('multer')

dotenv.config()

const app = express()
const port = process.env.PORT || 8080

const upload = multer({
    dest: './uploads',
})

var corsOptions = {
    origin: 'http://localhost:8081',
}

app.use(cors())
app.use(express.json())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.post('/upload', upload.single('file'), (req, res) => {
    res.json({ file: req.file.filename })
})

app.listen(port, () => console.log(`Server started on port ${port}`))
