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
    const idToken = req.headers.authorization.split('Bearer ')[1]
    console.log(idToken, req.body.userId)
    verifyIdToken(idToken, req.body.userId).then((isValidToken) => {
        if (isValidToken) {
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
                const query = 'INSERT INTO images(imageId, file_src, userId) VALUES(?,?,?)'
                const values = [uuidv4(), imgsrc, req.body.userId]
                db.query(query, values, (err, result) => {
                    if (err) throw err
                    console.log('file uploaded')
                    res.send('Image uploaded successfully.')
                })
            })
        } else {
            res.status(401).send({ error: 'Unauthorized' })
        }
    })
})

app.post('/createUser', (req, res) => {
    if (!req.body.uid || !req.body.username) {
        return res.status(400).send({ error: 'Invalid id or username' })
    }
    const query = 'INSERT INTO users(userId, userName) VALUES(?,?)'
    const values = [req.body.uid, req.body.username]
    db.query(query, values, (err, result) => {
        // if (err) throw err
        console.log('User dublicated successfully')
    })
})

app.get('/getAllImages', (req, res) => {
    if (!req.query.userId) {
        return res.status(400).send({ error: 'Invalid request data' })
    }
    const idToken = req.headers.authorization.split('Bearer ')[1]
    verifyIdToken(idToken, req.query.userId).then((isValidToken) => {
        if (isValidToken) {
            const query =
                'SELECT images.imageId, images.file_src, images.userId, Count(likeId) AS likeCount, (SELECT Count(likeId) FROM likes WHERE images.imageId = likes.imageId AND likes.userId = ?) AS userLikeCount FROM images LEFT JOIN likes ON images.imageId = likes.imageId GROUP BY images.imageId'
            const values = [req.query.userId]
            db.query(query, values, (err, results) => {
                if (err) {
                    console.log(err)
                    res.json(err)
                } else {
                    res.json(results)
                }
            })
        } else {
            res.status(401).send({ error: 'Unauthorized' })
        }
    })
})

app.get('/getUserImages', (req, res) => {
    if (!req.query.id) {
        return res.status(400).send({ error: 'Invalid request data' })
    }
    const idToken = req.headers.authorization.split('Bearer ')[1]
    verifyIdToken(idToken, req.query.id).then((isValidToken) => {
        if (isValidToken) {
            const query = 'SELECT * FROM images WHERE userId = ?'
            const values = [req.query.id]
            db.query(query, values, (err, results) => {
                if (err) {
                    console.log(err)
                    res.json(err)
                } else {
                    res.json(results)
                }
            })
        } else {
            res.status(401).send({ error: 'Unauthorized' })
        }
    })
})

app.delete('/deleteImage', (req, res) => {
    if (!req.query.id) {
        return res.status(400).send({ error: 'Invalid request data' })
    }
    const idToken = req.headers.authorization.split('Bearer ')[1]
    verifyIdToken(idToken, req.query.userId).then((isValidToken) => {
        if (isValidToken) {
            const query = 'DELETE FROM images WHERE images.imageId = ?'
            const values = [req.query.id]
            db.query(query, values, (err, result) => {
                if (err) {
                    throw err
                } else {
                    res.send('Image deleted succ.')
                    console.log('Image deleted successfully')
                }
            })
        } else {
            res.status(401).send({ error: 'Unauthorized' })
        }
    })
})

app.post('/likeImage', (req, res) => {
    if (!req.body.userId || !req.body.imageId) {
        return res.status(400).send({ error: 'Invalid request data' })
    }
    const idToken = req.headers.authorization.split('Bearer ')[1]
    verifyIdToken(idToken, req.body.userId).then((isValidToken) => {
        if (isValidToken) {
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
                        })
                    }
                }
            })
        } else {
            res.status(401).send({ error: 'Unauthorized' })
        }
    })
})

app.post('/createForumTopic', (req, res) => {
    if (!req.body.userId || !req.body.title || !req.body.description) {
        return res.status(400).send({ error: 'Invalid request data' })
    }
    const idToken = req.headers.authorization.split('Bearer ')[1]
    verifyIdToken(idToken, req.body.userId).then((isValidToken) => {
        if (isValidToken) {
            const query = 'INSERT INTO forum(forumId, userId, forumTitle, forumDescription) VALUES(?,?,?,?)'
            const values = [uuidv4(), req.body.userId, req.body.title, req.body.description]
            db.query(query, values, (err, result) => {
                if (err) throw err
                console.log('Forum created successfully')
            })
        } else {
            res.status(401).send({ error: 'Unauthorized' })
        }
    })
})

app.get('/getAllForumTopics', (req, res) => {
    const idToken = req.headers.authorization.split('Bearer ')[1]
    verifyIdToken(idToken, req.query.userId).then((isValidToken) => {
        if (isValidToken) {
            const query =
                'SELECT forumId, forumTitle, forumDescription, forum.userId, unix_timestamp(createdAt) * 1000 as createdAt, users.userName FROM forum LEFT JOIN users ON forum.userId = users.userId'
            db.query(query, (err, results) => {
                if (err) {
                    console.log(err)
                    res.json(err)
                } else {
                    res.json(results)
                }
            })
        } else {
            res.status(401).send({ error: 'Unauthorized' })
        }
    })
})

app.post('/addForumComment', (req, res) => {
    if (!req.body.forumId || !req.body.userId || !req.body.forumComment) {
        return res.status(400).send({ error: 'Invalid request data' })
    }
    const idToken = req.headers.authorization.split('Bearer ')[1]
    verifyIdToken(idToken, req.body.userId).then((isValidToken) => {
        if (isValidToken) {
            const query = 'INSERT INTO forumComments(commentId, forumId, userId, forumComment) VALUES(?,?,?,?)'
            const values = [uuidv4(), req.body.forumId, req.body.userId, req.body.forumComment]
            db.query(query, values, (err, result) => {
                if (err) {
                    throw err
                } else {
                    res.send('Comment added successfully.')
                    console.log('Image deleted successfully')
                }
            })
        } else {
            res.status(401).send({ error: 'Unauthorized' })
        }
    })
})

app.get('/getAllForumComments', (req, res) => {
    if (!req.query.forumId || !req.query.userId) {
        return res.status(400).send({ error: 'Invalid request data' })
    }
    const idToken = req.headers.authorization.split('Bearer ')[1]
    verifyIdToken(idToken, req.query.userId).then((isValidToken) => {
        if (isValidToken) {
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
            })
        } else {
            res.status(401).send({ error: 'Unauthorized' })
        }
    })
})

app.get('/getForumTitle', (req, res) => {
    if (!req.query.forumId) {
        return res.status(400).send({ error: 'Invalid request data' })
    }
    const idToken = req.headers.authorization.split('Bearer ')[1]
    verifyIdToken(idToken, req.query.userId).then((isValidToken) => {
        if (isValidToken) {
            const query = 'SELECT forumTitle, forumDescription FROM forum WHERE forumId = ?'
            const values = [req.query.forumId]
            db.query(query, values, (err, results) => {
                if (err) {
                    console.log(err)
                    res.json(err)
                } else {
                    res.json(results)
                }
            })
        } else {
            res.status(401).send({ error: 'Unauthorized' })
        }
    })
})

app.delete('/deleteTopic', (req, res) => {
    if (!req.query.id) {
        return res.status(400).send({ error: 'Invalid request data' })
    }
    const idToken = req.headers.authorization.split('Bearer ')[1]
    verifyIdToken(idToken, req.query.userId).then((isValidToken) => {
        if (isValidToken) {
            const query = 'DELETE FROM forum WHERE forumId = ?'
            const values = [req.query.id]
            db.query(query, values, (err, result) => {
                if (err) {
                    throw err
                } else {
                    res.send('Topic deleted succ.')
                    console.log('Topic deleted successfully')
                }
            })
        } else {
            res.status(401).send({ error: 'Unauthorized' })
        }
    })
})

app.post('/loveComment', (req, res) => {
    if (!req.body.userId || !req.body.commentId) {
        return res.status(400).send({ error: 'Invalid request data' })
    }
    const idToken = req.headers.authorization.split('Bearer ')[1]
    verifyIdToken(idToken, req.body.userId).then((isValidToken) => {
        if (isValidToken) {
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
                        })
                    }
                }
            })
        } else {
            res.status(401).send({ error: 'Unauthorized' })
        }
    })
})

app.post('/reportComment', (req, res) => {
    if (!req.body.userId || !req.body.commentId) {
        return res.status(400).send({ error: 'Invalid request data' })
    }
    const idToken = req.headers.authorization.split('Bearer ')[1]
    verifyIdToken(idToken, req.body.userId).then((isValidToken) => {
        if (isValidToken) {
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
})

app.delete('/deleteComment', (req, res) => {
    if (!req.query.forumId || !req.query.commentId) {
        return res.status(400).send({ error: 'Invalid request data' })
    }
    const idToken = req.headers.authorization.split('Bearer ')[1]
    verifyIdToken(idToken, req.query.userId).then((isValidToken) => {
        if (isValidToken) {
            const query = 'DELETE FROM forumComments WHERE forumId = ? and commentId = ?'
            const values = [req.query.forumId, req.query.commentId]
            db.query(query, values, (err, result) => {
                if (err) {
                    throw err
                } else {
                    res.send('Comment deleted succ.')
                    console.log('Comment deleted successfully')
                }
            })
        } else {
            res.status(401).send({ error: 'Unauthorized' })
        }
    })
})

app.get('/getUsername', (req, res) => {
    if (!req.query.userId) {
        return res.status(400).send({ error: 'Invalid request data' })
    }
    const idToken = req.headers.authorization.split('Bearer ')[1]
    verifyIdToken(idToken, req.query.userId).then((isValidToken) => {
        if (isValidToken) {
            console.log(isValidToken)
            const query = `SELECT userName FROM users WHERE userId = ?`
            const values = [req.query.userId]
            db.query(query, values, (err, results) => {
                if (err) {
                    console.log(err)
                    res.json(err)
                } else {
                    res.json(results)
                }
            })
        } else {
            res.status(401).send({ error: 'Unauthorized' })
        }
    })
})

app.post('/updateUsername', (req, res) => {
    if (!req.body.userName || !req.body.userId) {
        return res.status(400).send({ error: 'Invalid request data' })
    }
    const idToken = req.headers.authorization.split('Bearer ')[1]
    verifyIdToken(idToken, req.body.userId).then((isValidToken) => {
        if (isValidToken) {
            const query = 'UPDATE users SET userName = ? WHERE userId = ?'
            const values = [req.body.userName, req.body.userId]
            db.query(query, values, (err, result) => {
                if (err) {
                    throw err
                } else {
                    res.send('Username updated successfully.')
                    console.log('Username updated successfully')
                }
            })
        } else {
            res.status(401).send({ error: 'Unauthorized' })
        }
    })
})

app.delete('/deleteUser', (req, res) => {
    if (!req.query.userId) {
        return res.status(400).send({ error: 'Invalid request data' })
    }
    const idToken = req.headers.authorization.split('Bearer ')[1]
    verifyIdToken(idToken, req.query.userId).then((isValidToken) => {
        if (isValidToken) {
            const query = 'DELETE FROM users WHERE userId = ?'
            const values = [req.query.userId]

            db.query(query, values, (err, result) => {
                if (err) {
                    throw err
                } else {
                    res.send('User deleted succ.')
                    console.log('User deleted successfully')
                }
            })
        } else {
            res.status(401).send({ error: 'Unauthorized' })
        }
    })
})

app.get('/getAllUsernames', (req, res) => {
    const query = 'SELECT userName FROM users'
    db.query(query, (err, results) => {
        if (err) {
            console.log(err)
            res.json(err)
        } else {
            res.json(results)
        }
    })
})

app.listen(port, () => console.log(`Server started on port ${port}`))
