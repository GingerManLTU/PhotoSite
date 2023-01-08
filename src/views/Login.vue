<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { getAuth, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import ForgetPassword from './ForgetPassword.vue'
import Toastify from 'toastify-js'
import 'toastify-js/src/toastify.css'

const router = useRouter()

const email = ref('')
const password = ref('')
const errMsg = ref()
const showModal = ref(false)

const Login = async () => {
    if (!email.value || !password.value) {
        return alert('Please fill in all fields')
    }

    signInWithEmailAndPassword(getAuth(), email.value, password.value)
        .then((data) => {
            console.log('Successfully logged in with email and password')
            router.push('/home')
        })
        .catch((error) => {
            console.log(error.code)
            switch (error.code) {
                case 'auth/invalid-email':
                    errMsg.value = 'Invalid email'
                    break
                case 'auth/user-not-found':
                    errMsg.value = "This email doesn't exist"
                    break
                case 'auth/wrong-password':
                    errMsg.value = 'Incorrect password'
                    break
                default:
                    errMsg.value = 'Email or password was incorrect'
                    break
            }
        })
}

const signInWithGoogle = () => {
    return Toastify({
        text: 'Google account currently unavailable....',
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

    const provider = new GoogleAuthProvider()
    signInWithPopup(getAuth(), provider)
        .then((result) => {
            console.log(result.user)
            router.push('/home')
        })
        .catch((error) => {
            console.log(error)
            alert(error.body + ': ' + error.message)
        })
}
</script>

<template>
    <div class="wrapper-login">
        <ForgetPassword v-if="showModal.value" v-bind="showModal.value"></ForgetPassword>
        <div class="navigation-flexbox">
            <div class="login-position">
                <div class="login-text">
                    <h1 style="border-bottom: 1px solid white; margin-bottom: 24px; font-size: 45px">Time to explore</h1>
                    <p class="main-text" style="font-size: 24px">
                        It's time to see it with your own eyes, evaluate, share and support each other. Join our community and share how you see the world through your eyes!
                    </p>
                </div>
            </div>

            <div class="login-position">
                <div class="login-form-wrapper">
                    <div class="login-form">
                        <div style="margin: 30px">
                            <h1 class="login-form">Login</h1>
                        </div>
                        <div>
                            <form>
                                <label>
                                    <input class="login-input" type="email" v-model="email" placeholder="Email" style="margin: 20px 0px" />
                                </label>
                                <label>
                                    <input class="login-input" type="password" v-model="password" placeholder="Password" />
                                </label>
                            </form>
                        </div>
                        <button class="submit-button submit-button--login" @click="Login">Login</button>
                        <p v-if="errMsg">{{ errMsg }}</p>
                        <div>
                            <button class="submit-button submit-button--google" @click="signInWithGoogle">Log in with Google Account</button>
                        </div>
                        <div>
                            <p>Dont have an account? <router-link to="/register">Register</router-link></p>
                        </div>
                        <div style="margin-top: 24px">
                            <p><router-link to="/forget">Forget password?</router-link></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
