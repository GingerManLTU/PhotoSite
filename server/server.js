const express = require("express")
const { envs, Client } = require("stytch")
const dotenv = require("dotenv")
const cors = require("cors")
const bodyParser = require("body-parser")
// const db = require("./app/config/db.config")

dotenv.config()

const app = express()

const client = new Client({
    project_id: process.env.PROJECT_ID,
    secret: process.env.SECRET,
    env: envs.test,
})

var corsOptions = {
    origin: "http://localhost:8081",
}

const port = process.env.PORT || 8080

app.use(cors())
app.use(express.json())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.post("/register", async (req, res) => {
    const { email, password } = req.body
    try {
        const resp = await client.passwords.create({
            email,
            password,
            session_duration_minutes: 60,
        })
        res.json({
            success: true,
            message: "User created successfully",
            token: resp.session_token,
        })
    } catch (err) {
        console.log(err)

        res.json({
            success: false,
            message: err.error_message,
            err: err,
        })
    }
})

app.post("/login", async (req, res) => {
    const { email, password } = req.body
    try {
        const resp = await client.passwords.authenticate({
            email,
            password,
            session_duration_minutes: 60,
        })
        res.json({
            success: true,
            message: "User logged in successfully",
            token: resp.session_token,
        })
    } catch (err) {
        console.log(err)

        res.json({
            success: false,
            message: err.error_message,
            err: err,
        })
    }
})

app.post("/authenticate", async (req, res) => {
    const { session_token } = req.body
    try {
        await client.sessions.authenticate({ session_token })
        res.json({
            success: true,
            message: "Token is valid",
        })
    } catch (err) {
        console.log(err)

        res.json({
            success: false,
            message: err.error_message,
            err: err,
        })
    }
})

app.post("/logout", async (req, res) => {
    const { session_token } = req.body
    try {
        await client.sessions.revoke({ session_token })
        res.json({
            success: true,
            message: "successfully logged out",
        })
    } catch (err) {
        console.log(err)

        res.json({
            success: false,
            message: err.error_message,
            err: err,
        })
    }
})

app.listen(port, () => console.log(`Server started on port ${port}`))
