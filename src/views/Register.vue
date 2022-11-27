<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth'
import axios from 'axios'

const router = useRouter()

const email = ref('')
const password = ref('')
const c_password = ref('')
const username = ref('')

const Register = async () => {
    if (!email.value || !password.value || !c_password.value || !username.value) {
        return alert('Please fill in all fields')
    }
    if (password.value.length < 6) {
        return alert('Password must be at least 6 characters')
    }
    if (password.value !== c_password.value) {
        return alert('Passwords do not match')
    }

    createUserWithEmailAndPassword(getAuth(), email.value, password.value)
        .then((data) => {
            console.log('Successfully created user: ' + JSON.stringify(data))
            try {
                const auth = getAuth()
                const user = auth.currentUser
                console.log(user.uid)
                const userData = { uid: user.uid, username: username.value }
                console.log(userData)
                axios.post('/createUser', userData, {
                    baseURL: 'http://localhost:8080',
                })
            } catch (err) {
                console.log(err)
                this.message = 'User dublication failed :('
            }
            router.push('/home')
        })
        .catch((error) => {
            console.log(error.code)
            alert(error.message)
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
                <button class="submit-button" @click="Register">Sign Up</button>
                <div>
                    <p>Have an account? <router-link to="/Login">Login</router-link></p>
                </div>
            </div>
        </div>
    </div>
</template>
