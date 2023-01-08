<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { getAuth, sendPasswordResetEmail } from 'firebase/auth'
import axios from 'axios'
import Toastify from 'toastify-js'
import 'toastify-js/src/toastify.css'

const router = useRouter()

const email = ref('')

const validateEmail = (email) => {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    return re.test(String(email).toLowerCase())
}

const RestorePassword = async () => {
    if (!email.value) {
        return Toastify({
            text: 'Please fill in email field',
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

    const auth = await getAuth()
    sendPasswordResetEmail(auth, email.value)
        .then(() => {
            email.value = ''
            Toastify({
                text: 'Check your email for letter! (Check SPAM)',
                duration: 5000,
                newWindow: true,
                close: true,
                gravity: 'top',
                position: 'right',
                stopOnFocus: true,
                style: {
                    background: 'rgba(13, 180, 185, 1)',
                    borderRadius: '12px',
                    minWidth: '200px',
                },
            }).showToast()
            setTimeout(() => {
                router.push('/')
            }, 3000)
        })
        .catch((error) => {
            console.error(error)
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
        <div class="register-form-wrapper" style="width: auto">
            <div class="login-form">
                <div style="margin: 40px 30px">
                    <h1 class="login-form">Restore password</h1>
                </div>
                <div>
                    <form @submit.prevent="RestorePassword">
                        <label>
                            <div style="font-size: 24px; margin-bottom: 12px">Enter Your Email</div>

                            <input style="margin: 20px; width: 60%" class="login-input" type="email" v-model="email" placeholder="email@email.com" />
                        </label>
                    </form>
                </div>
                <button class="submit-button" @click="RestorePassword">Restore</button>
                <div style="margin: 20px 0">
                    <p>Go back to <router-link to="/">Login</router-link></p>
                </div>
            </div>
        </div>
    </div>
</template>
