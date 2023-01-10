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
const admin = require('firebase-admin')
const serviceAccount = require('./app/config/serviceAccountKey.json')
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

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
})

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

const getConnection = () => {
    const db = mysql.createConnection({
        host: dbi.HOST,
        port: dbi.PORT,
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
    return db
}

app.use(cors())
app.use(express.json())

const verifyIdToken = (idToken, userId) => {
    return admin
        .auth()
        .verifyIdToken(idToken)
        .then((decodedToken) => {
            const uid = decodedToken.uid
            console.log((uid === userId) + '  validation')
            return uid === userId
        })
        .catch((error) => {
            //invalid
            return false
        })
}

app.post('/upload', upload.single('file'), async (req, res) => {
    if (req.fileValidationError) {
        return res.status(400).send({ error: 'Only image files are allowed' })
    }
    if (req.file.size === 0) {
        return res.status(400).send({ error: 'Empty files are not allowed' })
    }
    try {
        const idToken = req.headers.authorization.split('Bearer ')[1]
        console.log(idToken, req.body.userId)
        verifyIdToken(idToken, req.body.userId)
            .then((isValidToken) => {
                if (isValidToken) {
                    const imageExtensions = ['jpg', 'jpeg', 'png']
                    fs.readdir('./uploads', async (err, files) => {
                        if (err) {
                            console.error(err)
                            return
                        }

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
                                return res.status(400).send({ error: 'This or a very similar image already exist...' })
                            }

                            // resemble(req.file.path)
                            //     .compareTo(prevImage)
                            //     .onComplete(function (data) {
                            //         // The data object contains information about the difference between the images
                            //         console.log(data.rawMisMatchPercentage) // Outputs a numerical value representing the similarity
                            //     })
                        }
                        const db = getConnection()
                        var imgsrc = 'http://localhost:8080/uploads/' + req.file.filename
                        const selectQuery = 'SELECT userName FROM users WHERE userId = ?'
                        const selectValue = [req.body.userId]
                        const query = 'INSERT INTO images(imageId, file_src, userId, imageType) VALUES(?,?,?,?)'
                        const imageId = uuidv4()
                        const values = [imageId, imgsrc, req.body.userId, 0]
                        db.query(selectQuery, selectValue, (err, result) => {
                            if (err) throw err
                            console.log(result)
                            const userName = result[0].userName
                            db.query(query, values, (err, result) => {
                                if (err) throw err
                                console.log('file uploaded')
                                result.data = { imageId, file_src: imgsrc, userId: req.body.userId, imageType: 0, likeCount: 0, userName }
                                res.send(result)
                                db.end()
                            })
                        })
                    })
                } else {
                    res.status(401).send({ error: 'Unauthorized' })
                }
            })
            .catch((err) => {
                res.status(500).send({ error: 'An error occurred while processing the request:' + err })
            })
    } catch (error) {
        res.status(500).send({ error: 'An error occurred while processing the request:' + error })
    }
})

app.post('/createUser', (req, res) => {
    if (!req.body.uid || !req.body.username) {
        return res.status(400).send({ error: 'Invalid id or username' })
    }
    try {
        const db = getConnection()
        const query = 'INSERT INTO users(userId, userName) VALUES(?,?)'
        const values = [req.body.uid, req.body.username]
        db.query(query, values, (err, result) => {
            if (err) console.log(err)
            console.log('User dublicated successfully')
            db.end()
        })
    } catch (error) {
        res.status(500).send({ error: 'An error occurred while processing the request:' + error })
    }
})

app.get('/getAllImages', (req, res) => {
    if (!req.query.userId) {
        return res.status(400).send({ error: 'Invalid request data' })
    }
    try {
        const idToken = req.headers.authorization.split('Bearer ')[1]
        verifyIdToken(idToken, req.query.userId).then((isValidToken) => {
            if (isValidToken) {
                const db = getConnection()
                const query =
                    'SELECT images.imageId, images.file_src, images.userId, users.userName, Count(likeId) AS likeCount, (SELECT Count(likeId) FROM likes WHERE images.imageId = likes.imageId AND likes.userId = ?) AS userLikeCount FROM images LEFT JOIN likes ON images.imageId = likes.imageId LEFT JOIN users ON users.userId = images.userId WHERE images.imageType != 1 GROUP BY images.imageId ORDER BY images.createdAt DESC'
                const values = [req.query.userId]
                db.query(query, values, (err, results) => {
                    if (err) {
                        console.log(err)
                        res.json(err)
                    } else {
                        res.json(results)
                    }
                    db.end()
                })
            } else {
                res.status(401).send({ error: 'Unauthorized' })
            }
        })
    } catch (error) {
        res.status(500).send({ error: 'An error occurred while processing the request:' + error })
    }
})

app.get('/getPopularImages', (req, res) => {
    if (!req.query.userId) {
        return res.status(400).send({ error: 'Invalid request data' })
    }
    try {
        const idToken = req.headers.authorization.split('Bearer ')[1]
        verifyIdToken(idToken, req.query.userId).then((isValidToken) => {
            if (isValidToken) {
                const db = getConnection()
                const query =
                    'SELECT images.imageId, images.file_src, images.userId, users.userName, COUNT(likeId) AS likeCount FROM images LEFT JOIN likes ON images.imageId = likes.imageId LEFT JOIN users ON users.userId = images.userId WHERE images.imageType != 1 GROUP BY images.imageId ORDER BY likeCount DESC LIMIT 10'
                const values = [req.query.userId]
                db.query(query, values, (err, results) => {
                    if (err) {
                        console.log(err)
                        res.json(err)
                    } else {
                        res.json(results)
                    }
                    db.end()
                })
            } else {
                res.status(401).send({ error: 'Unauthorized' })
            }
        })
    } catch (error) {
        res.status(500).send({ error: 'An error occurred while processing the request:' + error })
    }
})

app.get('/getUserImages', (req, res) => {
    if (!req.query.id) {
        return res.status(400).send({ error: 'Invalid request data' })
    }
    try {
        const idToken = req.headers.authorization.split('Bearer ')[1]
        verifyIdToken(idToken, req.query.id).then((isValidToken) => {
            if (isValidToken) {
                const db = getConnection()
                const query = 'SELECT * FROM images WHERE userId = ? ORDER BY images.createdAt DESC'
                const values = [req.query.id]
                db.query(query, values, (err, results) => {
                    if (err) {
                        console.log(err)
                        res.json(err)
                    } else {
                        res.json(results)
                    }
                    db.end()
                })
            } else {
                res.status(401).send({ error: 'Unauthorized' })
            }
        })
    } catch (error) {
        res.status(500).send({ error: 'An error occurred while processing the request:' + error })
    }
})

app.delete('/deleteImage', (req, res) => {
    if (!req.query.imageId || !req.query.userId || !req.query.imageUserId) {
        return res.status(400).send({ error: 'Invalid request data' })
    }
    if (req.query.imageUserId !== req.query.userId) {
        res.status(401).send({ error: 'Unauthorized' })
    }
    try {
        const idToken = req.headers.authorization.split('Bearer ')[1]
        verifyIdToken(idToken, req.query.userId).then((isValidToken) => {
            if (isValidToken) {
                const db = getConnection()
                const query = 'DELETE FROM images WHERE images.imageId = ?'
                const values = [req.query.imageId]
                db.query(query, values, (err, result) => {
                    if (err) {
                        throw err
                    } else {
                        res.send('Image deleted succ.')
                        console.log('Image deleted successfully')
                    }
                    db.end()
                })
            } else {
                res.status(401).send({ error: 'Unauthorized' })
            }
        })
    } catch (error) {
        res.status(500).send({ error: 'An error occurred while processing the request:' + error })
    }
})

app.post('/likeImage', (req, res) => {
    if (!req.body.userId || !req.body.imageId) {
        return res.status(400).send({ error: 'Invalid request data' })
    }
    try {
        const idToken = req.headers.authorization.split('Bearer ')[1]
        verifyIdToken(idToken, req.body.userId).then((isValidToken) => {
            if (isValidToken) {
                const db = getConnection()
                const query = 'SELECT COUNT(likeId) AS isSelected FROM likes WHERE userId = ? and imageId = ?'
                const values = [req.body.userId, req.body.imageId]
                let isSelected
                db.query(query, values, (err, result) => {
                    if (err) {
                        throw err
                    } else {
                        isSelected = result[0].isSelected
                        if (result[0].isSelected) {
                            const query = 'DELETE FROM likes WHERE userId = ? and imageId = ?'
                            const values = [req.body.userId, req.body.imageId]
                            db.query(query, values, (err, result) => {
                                if (err) {
                                    throw err
                                } else {
                                    res.send('Image unliked')
                                    console.log('Image deleted successfully')
                                }
                                db.end()
                            })
                        } else {
                            const query = 'INSERT INTO likes(likeId, userId, imageId) VALUES(?,?,?)'
                            const values = [uuidv4(), req.body.userId, req.body.imageId]
                            db.query(query, values, (err, result) => {
                                if (err) {
                                    throw err
                                } else {
                                    res.send('Image liked successfully.')
                                    console.log('User liked image successfully!')
                                }
                                db.end()
                            })
                        }
                    }
                })
            } else {
                res.status(401).send({ error: 'Unauthorized' })
            }
        })
    } catch (error) {
        res.status(500).send({ error: 'An error occurred while processing the request:' + error })
    }
})

app.post('/createForumTopic', (req, res) => {
    if (!req.body.userId || !req.body.title || !req.body.description) {
        return res.status(400).send({ error: 'Invalid request data' })
    }
    try {
        const idToken = req.headers.authorization.split('Bearer ')[1]
        verifyIdToken(idToken, req.body.userId).then((isValidToken) => {
            if (isValidToken) {
                const db = getConnection()
                const query = 'INSERT INTO forum(forumId, userId, forumTitle, forumDescription) VALUES(?,?,?,?)'
                const forumId = uuidv4()
                const values = [forumId, req.body.userId, req.body.title, req.body.description]
                const selectQuery = 'SELECT userName FROM users WHERE userId = ?'
                const selectValue = [req.body.userId]
                db.query(selectQuery, selectValue, (err, result) => {
                    if (err) throw err
                    const userName = result[0].userName
                    db.query(query, values, (err, result) => {
                        if (err) throw err
                        console.log('Forum created successfully')
                        result.data = { forumId, userId: req.body.userId, forumTitle: req.body.title, forumDescription: req.body.description, userName, createdAt: new Date() }
                        res.send(result)
                        db.end()
                    })
                })
            } else {
                res.status(401).send({ error: 'Unauthorized' })
            }
        })
    } catch (error) {
        res.status(500).send({ error: 'An error occurred while processing the request:' + error })
    }
})

app.get('/getAllForumTopics', (req, res) => {
    try {
        const idToken = req.headers.authorization.split('Bearer ')[1]
        verifyIdToken(idToken, req.query.userId).then((isValidToken) => {
            if (isValidToken) {
                const db = getConnection()
                const query =
                    'SELECT forumId, forumTitle, forumDescription, forum.userId, unix_timestamp(createdAt) * 1000 as createdAt, users.userName FROM forum LEFT JOIN users ON forum.userId = users.userId'
                db.query(query, (err, results) => {
                    if (err) {
                        console.log(err)
                        res.json(err)
                    } else {
                        res.json(results)
                    }
                    db.end()
                })
            } else {
                res.status(401).send({ error: 'Unauthorized' })
            }
        })
    } catch (error) {
        res.status(500).send({ error: 'An error occurred while processing the request:' + error })
    }
})

app.post('/addForumComment', (req, res) => {
    if (!req.body.forumId || !req.body.userId || !req.body.forumComment) {
        return res.status(400).send({ error: 'Invalid request data' })
    }
    try {
        const idToken = req.headers.authorization.split('Bearer ')[1]
        verifyIdToken(idToken, req.body.userId).then((isValidToken) => {
            if (isValidToken) {
                const db = getConnection()
                const query = 'INSERT INTO forumComments(commentId, forumId, userId, forumComment) VALUES(?,?,?,?)'
                const values = [uuidv4(), req.body.forumId, req.body.userId, req.body.forumComment]
                db.query(query, values, (err, result) => {
                    if (err) {
                        throw err
                    } else {
                        res.send('Comment added successfully.')
                        console.log('Image deleted successfully')
                    }
                    db.end()
                })
            } else {
                res.status(401).send({ error: 'Unauthorized' })
            }
        })
    } catch (error) {
        res.status(500).send({ error: 'An error occurred while processing the request:' + error })
    }
})

app.get('/getAllForumComments', (req, res) => {
    if (!req.query.forumId || !req.query.userId) {
        return res.status(400).send({ error: 'Invalid request data' })
    }
    try {
        const idToken = req.headers.authorization.split('Bearer ')[1]
        verifyIdToken(idToken, req.query.userId).then((isValidToken) => {
            if (isValidToken) {
                const db = getConnection()
                const query = `SELECT forumComments.commentId, forumComments.forumId, forumComments.userId, forumComment, unix_timestamp(forumComments.createdAt) * 1000 as createdAt, forum.forumTitle, forum.forumDescription, users.userName, COUNT(reportedComments.reportId) as reportCount, 
    (SELECT COUNT(loveId) FROM lovedComments WHERE forumComments.commentId = lovedComments.commentId) AS loveCount,
    (SELECT COUNT(loveId) FROM lovedComments WHERE userId = ? and commentId = forumComments.commentId) AS isLoved
    FROM forumComments 
    LEFT JOIN forum ON forum.forumId = forumComments.forumId 
    LEFT JOIN users ON forumComments.userId = users.userId 
    LEFT JOIN reportedComments ON forumComments.commentId = reportedComments.commentId AND reportedComments.userId = ?
    WHERE forumComments.forumId = ? 
    GROUP BY forumComments.commentId
    ORDER BY forumComments.createdAt DESC`
                const values = [req.query.userId, req.query.userId, req.query.forumId]
                db.query(query, values, (err, results) => {
                    if (err) {
                        console.log(err)
                        res.json(err)
                    } else {
                        res.json(results)
                    }
                    db.end()
                })
            } else {
                res.status(401).send({ error: 'Unauthorized' })
            }
        })
    } catch (error) {
        res.status(500).send({ error: 'An error occurred while processing the request:' + error })
    }
})

app.get('/getForumTitle', (req, res) => {
    if (!req.query.forumId) {
        return res.status(400).send({ error: 'Invalid request data' })
    }
    try {
        const idToken = req.headers.authorization.split('Bearer ')[1]
        verifyIdToken(idToken, req.query.userId).then((isValidToken) => {
            if (isValidToken) {
                const db = getConnection()
                const query = 'SELECT forumTitle, forumDescription FROM forum WHERE forumId = ?'
                const values = [req.query.forumId]
                db.query(query, values, (err, results) => {
                    if (err) {
                        console.log(err)
                        res.json(err)
                    } else {
                        res.json(results)
                    }
                    db.end()
                })
            } else {
                res.status(401).send({ error: 'Unauthorized' })
            }
        })
    } catch (error) {
        res.status(500).send({ error: 'An error occurred while processing the request:' + error })
    }
})

app.delete('/deleteTopic', (req, res) => {
    if (!req.query.forumId || !req.query.userId || !req.query.forumUserId) {
        return res.status(400).send({ error: 'Invalid request data' })
    }
    if (req.query.forumUserId !== req.query.userId) {
        res.status(401).send({ error: 'Unauthorized' })
    }
    try {
        const idToken = req.headers.authorization.split('Bearer ')[1]
        verifyIdToken(idToken, req.query.userId).then((isValidToken) => {
            if (isValidToken) {
                const db = getConnection()
                const query = 'DELETE FROM forum WHERE forumId = ?'
                const values = [req.query.forumId]
                db.query(query, values, (err, result) => {
                    if (err) {
                        throw err
                    } else {
                        res.send('Topic deleted succ.')
                        console.log('Topic deleted successfully')
                    }
                    db.end()
                })
            } else {
                res.status(401).send({ error: 'Unauthorized' })
            }
        })
    } catch (error) {
        res.status(500).send({ error: 'An error occurred while processing the request:' + error })
    }
})

app.post('/loveComment', (req, res) => {
    if (!req.body.userId || !req.body.commentId) {
        return res.status(400).send({ error: 'Invalid request data' })
    }
    try {
        const idToken = req.headers.authorization.split('Bearer ')[1]
        verifyIdToken(idToken, req.body.userId).then((isValidToken) => {
            if (isValidToken) {
                const db = getConnection()
                const query = 'SELECT COUNT(loveId) AS isLoved FROM lovedComments WHERE userId = ? and commentId = ?'
                const values = [req.body.userId, req.body.commentId]
                db.query(query, values, (err, result) => {
                    if (err) {
                        throw err
                    } else {
                        console.log(result)
                        if (result[0].isLoved) {
                            const query = 'DELETE FROM lovedComments WHERE userId = ? and commentId = ?'
                            const values = [req.body.userId, req.body.commentId]
                            db.query(query, values, (err, result) => {
                                if (err) {
                                    throw err
                                } else {
                                    res.send('Comment unloved')
                                    console.log('Comment unloved')
                                }
                                db.end()
                            })
                        } else {
                            const query = 'INSERT INTO lovedComments(loveId, userId, commentId) VALUES(?,?,?)'
                            const values = [uuidv4(), req.body.userId, req.body.commentId]
                            db.query(query, values, (err, result) => {
                                if (err) {
                                    throw err
                                } else {
                                    res.send('Comment liked successfully.')
                                    console.log('User loved comment successfully!')
                                }
                                db.end()
                            })
                        }
                    }
                })
            } else {
                res.status(401).send({ error: 'Unauthorized' })
            }
        })
    } catch (error) {
        res.status(500).send({ error: 'An error occurred while processing the request:' + error })
    }
})

app.post('/reportComment', (req, res) => {
    if (!req.body.userId || !req.body.commentId) {
        return res.status(400).send({ error: 'Invalid request data' })
    }
    try {
        const idToken = req.headers.authorization.split('Bearer ')[1]
        verifyIdToken(idToken, req.body.userId).then((isValidToken) => {
            if (isValidToken) {
                const db = getConnection()
                const query =
                    'SELECT (SELECT COUNT(reportId) FROM reportedComments WHERE userId = ? and commentId = ?) AS isReported, (SELECT COUNT(reportId) FROM reportedComments WHERE commentId = ?) AS reportCount'
                const values = [req.body.userId, req.body.commentId, req.body.commentId]
                db.query(query, values, (err, result) => {
                    if (err) {
                        throw err
                    } else {
                        console.log(result)
                        if (result[0].reportCount === 4 && !result[0].isReported) {
                            const query = 'DELETE FROM forumComments WHERE commentId = ?'
                            const values = [req.body.commentId]
                            db.query(query, values, (err, result) => {
                                if (err) {
                                    throw err
                                } else {
                                    res.send('Comment deleted because reached report limit')
                                    console.log('Comment deleted because reached report limit')
                                }
                                db.end()
                            })
                        } else if (!result[0].isReported) {
                            const query = 'INSERT INTO reportedComments(reportId, userId, commentId) VALUES(?,?,?)'
                            const values = [uuidv4(), req.body.userId, req.body.commentId]
                            db.query(query, values, (err, result) => {
                                if (err) {
                                    throw err
                                } else {
                                    res.send('Comment reported successfully.')
                                    console.log('User reported comment successfully!')
                                }
                                db.end()
                            })
                        } else {
                            return
                        }
                    }
                })
            } else {
                res.status(401).send({ error: 'Unauthorized' })
            }
        })
    } catch (error) {
        res.status(500).send({ error: 'An error occurred while processing the request:' + error })
    }
})

app.delete('/deleteComment', (req, res) => {
    if (!req.query.forumId || !req.query.commentId || !req.query.commentUserId) {
        return res.status(400).send({ error: 'Invalid request data' })
    }
    if (req.query.forumUserId !== req.query.userId) {
        res.status(401).send({ error: 'Unauthorized' })
    }
    try {
        const idToken = req.headers.authorization.split('Bearer ')[1]
        verifyIdToken(idToken, req.query.userId).then((isValidToken) => {
            if (isValidToken) {
                const db = getConnection()
                const query = 'DELETE FROM forumComments WHERE forumId = ? and commentId = ?'
                const values = [req.query.forumId, req.query.commentId]
                db.query(query, values, (err, result) => {
                    if (err) {
                        throw err
                    } else {
                        res.send('Comment deleted succ.')
                        console.log('Comment deleted successfully')
                    }
                    db.end()
                })
            } else {
                res.status(401).send({ error: 'Unauthorized' })
            }
        })
    } catch (error) {
        res.status(500).send({ error: 'An error occurred while processing the request:' + error })
    }
})

app.get('/getUsername', (req, res) => {
    if (!req.query.userId) {
        return res.status(400).send({ error: 'Invalid request data' })
    }
    try {
        const idToken = req.headers.authorization.split('Bearer ')[1]
        verifyIdToken(idToken, req.query.userId).then((isValidToken) => {
            if (isValidToken) {
                const db = getConnection()
                const query = `SELECT userName FROM users WHERE userId = ?`
                const values = [req.query.userId]
                db.query(query, values, (err, results) => {
                    if (err) {
                        console.log(err)
                        res.json(err)
                    } else {
                        res.json(results)
                    }
                    db.end()
                })
            } else {
                res.status(401).send({ error: 'Unauthorized' })
            }
        })
    } catch (error) {
        res.status(500).send({ error: 'An error occurred while processing the request:' + error })
    }
})

app.post('/updateUsername', (req, res) => {
    if (!req.body.userName || !req.body.userId) {
        return res.status(400).send({ error: 'Invalid request data' })
    }
    try {
        const idToken = req.headers.authorization.split('Bearer ')[1]
        verifyIdToken(idToken, req.body.userId).then((isValidToken) => {
            if (isValidToken) {
                const db = getConnection()
                const query = 'UPDATE users SET userName = ? WHERE userId = ?'
                const values = [req.body.userName, req.body.userId]
                db.query(query, values, (err, result) => {
                    if (err) {
                        throw err
                    } else {
                        res.send('Username updated successfully.')
                        console.log('Username updated successfully')
                    }
                    db.end()
                })
            } else {
                res.status(401).send({ error: 'Unauthorized' })
            }
        })
    } catch (error) {
        res.status(500).send({ error: 'An error occurred while processing the request:' + error })
    }
})

app.delete('/deleteUser', (req, res) => {
    if (!req.query.userId) {
        return res.status(400).send({ error: 'Invalid request data' })
    }
    try {
        const idToken = req.headers.authorization.split('Bearer ')[1]
        verifyIdToken(idToken, req.query.userId).then((isValidToken) => {
            if (isValidToken) {
                const db = getConnection()
                const query = 'DELETE FROM users WHERE userId = ?'
                const values = [req.query.userId]

                db.query(query, values, (err, result) => {
                    if (err) {
                        throw err
                    } else {
                        res.send('User deleted succ.')
                        console.log('User deleted successfully')
                    }
                    db.end()
                })
            } else {
                res.status(401).send({ error: 'Unauthorized' })
            }
        })
    } catch (error) {
        res.status(500).send({ error: 'An error occurred while processing the request:' + error })
    }
})

app.get('/getAllUsernames', (req, res) => {
    try {
        const db = getConnection()
        const query = 'SELECT userName FROM users'
        db.query(query, (err, results) => {
            if (err) {
                console.log(err)
                res.json(err)
            } else {
                res.json(results)
            }
            db.end()
        })
    } catch (error) {
        res.status(500).send({ error: 'An error occurred while processing the request:' + error })
    }
})

app.get('/getUserPoints', (req, res) => {
    if (!req.query.userId) {
        return res.status(400).send({ error: 'Invalid request data' })
    }
    try {
        const idToken = req.headers.authorization.split('Bearer ')[1]
        verifyIdToken(idToken, req.query.userId).then((isValidToken) => {
            if (isValidToken) {
                const db = getConnection()
                const query = 'SELECT(SELECT COUNT(*) FROM likes WHERE userId = ?) AS likesCount,(SELECT COUNT(*) FROM lovedComments WHERE userId = ?) AS lovedCommentsCount'
                const values = [req.query.userId, req.query.userId]
                db.query(query, values, (err, results) => {
                    if (err) {
                        console.log(err)
                        res.json(err)
                    } else {
                        res.json(results)
                    }
                    db.end()
                })
            } else {
                res.status(401).send({ error: 'Unauthorized' })
            }
        })
    } catch (error) {
        res.status(500).send({ error: 'An error occurred while processing the request:' + error })
    }
})

app.post('/updateImageType', (req, res) => {
    console.log(req.body)
    if (!req.body.imageId || !req.body.userId || req.body.imageType === null) {
        return res.status(400).send({ error: 'Invalid request data' })
    }
    try {
        const idToken = req.headers.authorization.split('Bearer ')[1]
        verifyIdToken(idToken, req.body.userId).then((isValidToken) => {
            if (isValidToken) {
                const db = getConnection()
                if (req.body.imageType) {
                    const query = 'UPDATE images SET imageType = 0 WHERE imageId = ?'
                    const values = [req.body.imageId]
                    db.query(query, values, (err, result) => {
                        if (err) {
                            throw err
                        } else {
                            res.send('Image type updated successfully.')
                            console.log('Image type updated successfully')
                        }
                        db.end()
                    })
                } else {
                    const query = 'UPDATE images SET imageType = 1 WHERE imageId = ?'
                    const values = [req.body.imageId]
                    db.query(query, values, (err, result) => {
                        if (err) {
                            throw err
                        } else {
                            res.send('Image type updated successfully.')
                            console.log('Image type updated successfully')
                        }
                        db.end()
                    })
                }
            } else {
                res.status(401).send({ error: 'Unauthorized' })
            }
        })
    } catch (error) {
        res.status(500).send({ error: 'An error occurred while processing the request:' + error })
    }
})

app.listen(port, () => console.log(`Server started on port ${port}`))
