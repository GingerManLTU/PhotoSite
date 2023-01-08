<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth'
import axios from 'axios'
import Toastify from 'toastify-js'
import 'toastify-js/src/toastify.css'

const router = useRouter()

const email = ref('')
const password = ref('')
const c_password = ref('')
const username = ref('')
const allUsers = ref('')

const strongPassword = (pass) => {
    const valid = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+=-])[A-Za-z\d!@#$%^&*()_+=-]{8,}$/
    return valid.test(pass)
}

const validateEmail = (email) => {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    return re.test(String(email).toLowerCase())
}

const Register = async () => {
    try {
        const response = await axios.get('/getAllUsernames', {
            baseURL: 'http://localhost:8080',
        })
        allUsers.value = response.data
    } catch (err) {
        console.log(err)
    }
    if (!email.value || !password.value || !c_password.value || !username.value) {
        return Toastify({
            text: 'Please fill in all fields',
            duration: 5000,
            newWindow: true,
            close: true,
            gravity: 'top',
            position: 'right',
            stopOnFocus: true,
            style: {
                background: 'rgba(254, 21, 21, 0.8)',
                borderRadius: '12px',
                minWidth: '200px',
            },
        }).showToast()
    }
    if (password.value !== c_password.value) {
        return Toastify({
            text: 'Passwords do not match',
            duration: 5000,
            newWindow: true,
            close: true,
            gravity: 'top',
            position: 'right',
            stopOnFocus: true,
            style: {
                background: 'rgba(254, 21, 21, 0.8)',
                borderRadius: '12px',
                minWidth: '200px',
            },
        }).showToast()
    }

    if (allUsers.length !== 0 && allUsers.value.some((obj) => obj.userName === username.value)) {
        return Toastify({
            text: `This username: '${username.value}' already exist... :(`,
            duration: 5000,
            newWindow: true,
            close: true,
            gravity: 'top',
            position: 'right',
            stopOnFocus: true,
            style: {
                background: 'rgba(254, 21, 21, 0.8)',
                borderRadius: '12px',
                minWidth: '200px',
            },
        }).showToast()
    }
    if (username.value.length > 13) {
        return Toastify({
            text: `Username is too long, maximum 12 characters.`,
            duration: 5000,
            newWindow: true,
            close: true,
            gravity: 'top',
            position: 'right',
            stopOnFocus: true,
            style: {
                background: 'rgba(254, 21, 21, 0.8)',
                borderRadius: '12px',
                minWidth: '200px',
            },
        }).showToast()
    }
    if (!validateEmail(email.value)) {
        return Toastify({
            text: `Wrong email format`,
            duration: 5000,
            newWindow: true,
            close: true,
            gravity: 'top',
            position: 'right',
            stopOnFocus: true,
            style: {
                background: 'rgba(254, 21, 21, 0.8)',
                borderRadius: '12px',
                minWidth: '200px',
            },
        }).showToast()
    }
    if (!strongPassword(password.value)) {
        password.value = ''
        c_password.value = ''
        return Toastify({
            text: 'Password must be at least 8 characters long, must contain at least one lowercase and uppercase letter, one number and special character',
            duration: 5000,
            newWindow: true,
            close: true,
            gravity: 'top',
            position: 'right',
            stopOnFocus: true,
            style: {
                background: 'rgba(254, 21, 21, 0.8)',
                borderRadius: '12px',
                minWidth: '200px',
            },
        }).showToast()
    }

    createUserWithEmailAndPassword(getAuth(), email.value, password.value)
        .then((data) => {
            console.log('Successfully created user: ' + JSON.stringify(data))
            try {
                const auth = getAuth()
                const user = auth.currentUser
                const userData = { uid: user.uid, username: username.value }
                axios.post('/createUser', userData, {
                    baseURL: 'http://localhost:8080',
                })
            } catch (err) {
                console.log(err)
                console.log('User dublication failed :(')
            }
            router.push('/home')
        })
        .catch((error) => {
            console.log(error.code)
            return Toastify({
                text: error.message,
                duration: 5000,
                newWindow: true,
                close: true,
                gravity: 'top',
                position: 'right',
                stopOnFocus: true,
                style: {
                    background: 'rgba(254, 21, 21, 0.8)',
                    borderRadius: '12px',
                    minWidth: '200px',
                },
            }).showToast()
        })
}
</script>

<template>
    <div class="wrapper-login">
        <div class="register-form-wrapper">
            <div class="login-form">
                <div style="margin: 20px 30px">
                    <h1 class="login-form">Register</h1>
                </div>
                <div>
                    <form @submit.prevent="Register">
                        <label>
                            <span>Enter Your Username</span>
                            <input style="margin: 20px" class="login-input" type="text" v-model="username" placeholder="PhotoGuruPRO" />
                        </label>
                        <label>
                            <span>Enter Your Email</span>
                            <input style="margin: 20px" class="login-input" type="email" v-model="email" placeholder="email@email.com" />
                        </label>
                        <label>
                            <span>Enter Your Password</span>
                            <input style="margin: 20px" class="login-input" type="password" v-model="password" placeholder="***********" />
                        </label>
                        <label>
                            <span>Confirm Your Password</span>
                            <input style="margin: 20px 20px 0 20px" class="login-input" type="password" v-model="c_password" placeholder="***********" />
                        </label>
                    </form>
                </div>
                <button class="submit-button" style="margin: 20px 0px" @click="Register">Sign Up</button>
                <div>
                    <p>Have an account? <router-link to="/">Login</router-link></p>
                </div>
            </div>
        </div>
    </div>
</template>
