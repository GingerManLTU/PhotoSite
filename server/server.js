const express = require('express')
const dotenv = require('dotenv')
const cors = require('cors')
const bodyParser = require('body-parser')
const dbi = require('./app/config/db.config')
const multer = require('multer')
const mysql = require('mysql2')
const path = require('path')
const { v4: uuidv4 } = require('uuid')
const fs = require('fs')
// const ssim = require('ssim.js')

// const { compare } = require('ssim')
// const looksSame = require('looks-same')
// const imageDiff = require('image-diff')
// const pixelmatch = require('pixelmatch')
const Jimp = require('jimp')
// const { imageHash } = require('image-hash')
// const resemble = require('resemblejs')
// const { loadImage } = require('canvas')
// const BlinkDiff = require('blink-diff')
// const sharp = require('sharp')
// const jsfeat = require('jsfeat')
// const imageSimilarity = require('image-similarity')
// const { diff } = require('jimp/types')

dotenv.config()

const app = express()
const port = process.env.PORT || 8080

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads')
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + '.' + file.mimetype.split('/')[1])
    },
})

const fileFilter = (req, file, cb) => {
    if (!file) {
        cb(new Error('No file was selected'), false)
    } else {
        // Allow only image files that are not GIFs
        if (!file.mimetype.startsWith('image/') || file.mimetype === 'image/gif') {
            req.fileValidationError = 'Forbidden file format'
            return cb(null, false, req.fileValidationError)
        } else if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg' || file.mimetype === 'image/png') {
            cb(null, true)
        }
    }
}

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    // dest: './uploads',
    // storage: multer.memoryStorage(),
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

app.post('/upload', upload.single('file'), async (req, res) => {
    if (req.fileValidationError) {
        return res.status(400).send({ error: 'Only image files are allowed' })
    }
    const imageExtensions = ['jpg', 'jpeg', 'png']
    fs.readdir('./uploads', async (err, files) => {
        if (err) {
            console.error(err)
            return
        }
        //TODO make sure that only images are uploaded

        const imagePaths = files
            .filter((file) => {
                const fileExtension = file.split('.').pop()
                return imageExtensions.includes(fileExtension)
            })
            .map((file) => path.join('uploads', file))

        const selectedImage = await Jimp.read(req.file.path)

        for (const prevImage of imagePaths) {
            console.log(req.file.path, prevImage)

            const existingImage = await Jimp.read(prevImage)
            const distance = Jimp.distance(selectedImage, existingImage)
            console.log(distance)
            if (distance < 0.15 && req.file.path !== prevImage) {
                fs.unlink(req.file.path, (error) => {
                    if (error) {
                        console.error(error)
                    } else {
                        console.log(`Successfully deleted file: ${req.file.path}`)
                    }
                })
                return res.status(400).send({ error: 'This or very similar image is already exist...' })
            }

            // resemble(req.file.path)
            //     .compareTo(prevImage)
            //     .onComplete(function (data) {
            //         // The data object contains information about the difference between the images
            //         console.log(data.rawMisMatchPercentage) // Outputs a numerical value representing the similarity
            //     })
        }
        var imgsrc = 'http://localhost:8080/uploads/' + req.file.filename
        var insertData = 'INSERT INTO images(imageId, file_src, userId) VALUES(?,?,?)'
        db.query(insertData, [uuidv4(), imgsrc, req.body.userId], (err, result) => {
            if (err) throw err
            console.log('file uploaded')
            res.send('Image uploaded successfully.')
        })
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
            // console.log(newData)
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
        `SELECT forumComments.commentId, forumComments.forumId, forumComments.userId, forumComment, unix_timestamp(forumComments.createdAt) * 1000 as createdAt, forum.forumTitle, forum.forumDescription, users.userName, COUNT(reportedComments.reportId) as reportCount, 
        (SELECT COUNT(loveId) FROM lovedComments WHERE forumComments.commentId = lovedComments.commentId) AS loveCount,
        (SELECT COUNT(loveId) FROM lovedComments WHERE userId = ? and commentId = forumComments.commentId) AS isLoved
        FROM forumComments 
        LEFT JOIN forum ON forum.forumId = forumComments.forumId 
        LEFT JOIN users ON forumComments.userId = users.userId 
        LEFT JOIN reportedComments ON forumComments.commentId = reportedComments.commentId AND reportedComments.userId = ?
        WHERE forumComments.forumId = ? 
        GROUP BY forumComments.commentId
        ORDER BY forumComments.createdAt DESC`,
        [req.query.userId, req.query.userId, req.query.forumId],
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

app.get('/getForumTitle', (req, res) => {
    db.query(`SELECT forumTitle, forumDescription FROM forum WHERE forumId = ?`, [req.query.forumId], (err, results) => {
        if (err) {
            console.log(err)
            res.json(err)
        } else {
            res.json(results)
        }
    })
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

app.post('/loveComment', (req, res) => {
    db.query('SELECT COUNT(loveId) AS isLoved FROM lovedComments WHERE userId = ? and commentId = ? ', [req.body.userId, req.body.commentId], (err, result) => {
        if (err) {
            throw err
        } else {
            console.log(result)
            if (result[0].isLoved) {
                db.query('DELETE FROM lovedComments WHERE userId = ? and commentId = ?', [req.body.userId, req.body.commentId], (err, result) => {
                    if (err) {
                        throw err
                    } else {
                        res.send('Comment unloved')
                        console.log('Comment unloved')
                    }
                })
            } else {
                db.query('INSERT INTO lovedComments(loveId, userId, commentId) VALUES(?,?,?)', [uuidv4(), req.body.userId, req.body.commentId], (err, result) => {
                    if (err) {
                        throw err
                    } else {
                        res.send('Comment liked successfully.')
                        console.log('User loved comment successfully!')
                    }
                })
            }
        }
    })
})

app.post('/reportComment', (req, res) => {
    db.query(
        'SELECT (SELECT COUNT(reportId) FROM reportedComments WHERE userId = ? and commentId = ?) AS isReported, (SELECT COUNT(reportId) FROM reportedComments WHERE commentId = ?) AS reportCount',
        [req.body.userId, req.body.commentId, req.body.commentId],
        (err, result) => {
            if (err) {
                throw err
            } else {
                console.log(result)
                if (result[0].reportCount === 4 && !result[0].isReported) {
                    db.query('DELETE FROM forumComments WHERE commentId = ?', [req.body.commentId], (err, result) => {
                        if (err) {
                            throw err
                        } else {
                            res.send('Comment deleted because reached report limit')
                            console.log('Comment deleted because reached report limit')
                        }
                    })
                } else if (!result[0].isReported) {
                    db.query('INSERT INTO reportedComments(reportId, userId, commentId) VALUES(?,?,?)', [uuidv4(), req.body.userId, req.body.commentId], (err, result) => {
                        if (err) {
                            throw err
                        } else {
                            res.send('Comment reported successfully.')
                            console.log('User reported comment successfully!')
                        }
                    })
                } else {
                    return
                }
            }
        }
    )
})

app.delete('/deleteComment', (req, res) => {
    db.query('DELETE FROM forumComments WHERE forumId = ? and commentId = ?', [req.query.forumId, req.query.commentId], (err, result) => {
        if (err) {
            throw err
        } else {
            res.send('Comment deleted succ.')
            console.log('Comment deleted successfully')
        }
    })
})

app.get('/getUsername', (req, res) => {
    db.query(`SELECT userName FROM users WHERE userId = ?`, [req.query.userId], (err, results) => {
        if (err) {
            console.log(err)
            res.json(err)
        } else {
            res.json(results)
        }
    })
})

app.post('/updateUsername', (req, res) => {
    db.query('UPDATE users SET userName = ? WHERE userId = ?', [req.body.userName, req.body.userId], (err, result) => {
        if (err) {
            throw err
        } else {
            res.send('Username updated successfully.')
            console.log('Username updated successfully')
        }
    })
})

app.delete('/deleteUser', (req, res) => {
    db.query('DELETE FROM users WHERE userId = ?', [req.query.userId], (err, result) => {
        if (err) {
            throw err
        } else {
            res.send('User deleted succ.')
            console.log('User deleted successfully')
        }
    })
})

app.listen(port, () => console.log(`Server started on port ${port}`))
