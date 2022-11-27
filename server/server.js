const express = require('express')
const dotenv = require('dotenv')
const cors = require('cors')
const bodyParser = require('body-parser')
const dbi = require('./app/config/db.config')
const multer = require('multer')
const mysql = require('mysql2')
const path = require('path')
const { error } = require('console')

dotenv.config()

const app = express()
const port = process.env.PORT || 8080

const upload = multer({
    dest: './uploads',
})

app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

const db = mysql.createConnection({
    host: dbi.HOST,
    user: dbi.USER,
    password: dbi.PASSWORD,
    database: dbi.DB,
})
db.connect(function (err) {
    if (err) {
        return console.error('error: ' + err.message)
    }
    console.log('Connected to the MySQL server.')
})

app.use(cors())
app.use(express.json())

app.post('/upload', upload.single('file'), (req, res) => {
    var imgsrc = 'http://localhost:8080/uploads/' + req.file.filename
    var insertData = 'INSERT INTO images(file_src, userId) VALUES(?,?)'
    db.query(insertData, [imgsrc, req.body.userId], (err, result) => {
        if (err) throw err
        console.log('file uploaded')
    })
})

app.post('/createUser', (req, res) => {
    db.query('INSERT INTO users(userId, userName) VALUES(?,?)', [req.body.uid, req.body.username], (err, result) => {
        // if (err) throw err
        console.log('User dublicated successfully')
    })
})

app.get('/getAllImages', (req, res) => {
    db.query('SELECT * FROM images', (err, results) => {
        if (err) {
            console.log(err)
            res.json(err)
        } else {
            res.json(results)
        }
    })
})

app.get('/getUserImages', (req, res) => {
    const userId = req.query.id
    db.query('SELECT * FROM images WHERE userId = ?', [userId], (err, results) => {
        if (err) {
            console.log(err)
            res.json(err)
        } else {
            res.json(results)
        }
    })
    console.log(req.query.id)
})

app.listen(port, () => console.log(`Server started on port ${port}`))
