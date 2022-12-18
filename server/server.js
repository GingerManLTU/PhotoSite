const express = require('express')
const dotenv = require('dotenv')
const cors = require('cors')
const bodyParser = require('body-parser')
const dbi = require('./app/config/db.config')
const multer = require('multer')
const mysql = require('mysql2')
const path = require('path')
const { v4: uuidv4 } = require('uuid')

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
    var insertData = 'INSERT INTO images(imageId, file_src, userId) VALUES(?,?,?)'
    console.log(uuidv4())
    db.query(insertData, [uuidv4(), imgsrc, req.body.userId], (err, result) => {
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
    let allData
    let newData = []
    db.query(
        'SELECT images.imageId, images.file_src, images.userId, Count(likeId) AS likeCount FROM images LEFT JOIN likes ON images.imageId = likes.imageId GROUP BY images.imageId',
        (err, results) => {
            if (err) {
                console.log(err)
                res.json(err)
            } else {
                allData = results
            }
        }
    )
    db.query('SELECT Count(likeId) as userLikeCount from images left join likes on images.imageId = likes.imageId and likes.userId = ? GROUP BY images.imageId', [req.query.userId], (err, results) => {
        if (err) {
            console.log(err)
            res.json(err)
        } else {
            let i = 0
            for (data of allData) {
                newData[i] = { ...data, ...results[i] }
                i++
            }
            res.json(newData)
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

app.delete('/deleteImage', (req, res) => {
    db.query('DELETE FROM images WHERE images.imageId = ?', [req.query.id], (err, result) => {
        if (err) {
            throw err
        } else {
            res.send('Image deleted succ.')
            console.log('Image deleted successfully')
        }
    })
})

app.post('/likeImage', (req, res) => {
    let isSelected
    db.query('SELECT COUNT(likeId) AS isSelected FROM likes WHERE userId = ? and imageId = ?', [req.body.userId, req.body.imageId], (err, result) => {
        if (err) {
            throw err
        } else {
            isSelected = result[0].isSelected
            if (result[0].isSelected) {
                console.log('bbb')
                db.query('DELETE FROM likes WHERE userId = ? and imageId = ?', [req.body.userId, req.body.imageId], (err, result) => {
                    if (err) {
                        throw err
                    } else {
                        res.send('Image unliked')
                        console.log('Image deleted successfully')
                    }
                })
            } else {
                db.query('INSERT INTO likes(likeId, userId, imageId) VALUES(?,?,?)', [uuidv4(), req.body.userId, req.body.imageId], (err, result) => {
                    if (err) {
                        throw err
                    } else {
                        res.send('Image liked successfully.')
                        console.log('User liked image successfully!')
                    }
                })
            }
        }
    })
})

app.post('/createForumTopic', (req, res) => {
    db.query('INSERT INTO forum(forumId, userId, forumTitle, forumDescription) VALUES(?,?,?,?)', [uuidv4(), req.body.userId, req.body.title, req.body.description], (err, result) => {
        if (err) throw err
        console.log('Forum created successfully')
    })
})

app.get('/getAllForumTopics', (req, res) => {
    db.query(
        'SELECT forumId, forumTitle, forumDescription, forum.userId, unix_timestamp(createdAt) * 1000 as createdAt, users.userName FROM forum LEFT JOIN users ON forum.userId = users.userId',
        (err, results) => {
            if (err) {
                console.log(err)
                res.json(err)
            } else {
                res.json(results)
            }
        }
    )
})

app.post('/addForumComment', (req, res) => {
    db.query('INSERT INTO forumComments(commentId, forumId, userId, forumComment) VALUES(?,?,?,?)', [uuidv4(), req.body.forumId, req.body.userId, req.body.forumComment], (err, result) => {
        if (err) {
            throw err
        } else {
            res.send('Comment added successfully.')
            console.log('Image deleted successfully')
        }
    })
})

app.get('/getAllForumComments', (req, res) => {
    db.query(
        'SELECT commentId, forumComments.forumId, forumComments.userId, forumComment, unix_timestamp(forumComments.createdAt) * 1000 as createdAt, forum.forumTitle, forum.forumDescription, users.userName FROM forumComments LEFT JOIN forum ON forum.forumId = forumComments.forumId LEFT JOIN users ON forumComments.userId = users.userId ORDER BY forumComments.createdAt DESC',
        (err, results) => {
            if (err) {
                console.log(err)
                res.json(err)
            } else {
                res.json(results)
            }
        }
    )
})

app.delete('/deleteTopic', (req, res) => {
    db.query('DELETE FROM forum WHERE forumId = ?', [req.query.id], (err, result) => {
        if (err) {
            throw err
        } else {
            res.send('Topic deleted succ.')
            console.log('Topic deleted successfully')
        }
    })
})

app.listen(port, () => console.log(`Server started on port ${port}`))
