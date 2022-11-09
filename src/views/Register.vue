<script setup>
import { ref } from "vue"
import { useRouter } from "vue-router"

const router = useRouter()

const email = ref("")
const password = ref("")
const c_password = ref("")

const Register = async () => {
    console.log("aaa")
    if (!email.value || !password.value || !c_password.value) {
        return alert("Please fill in all fields")
    }
    if (password.value !== c_password.value) {
        return alert("Passwords do not match")
    }

    const res = await fetch("http://localhost:8080/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            email: email.value,
            password: password.value,
        }),
    }).then((res) => res.json())

    if (res.success) {
        localStorage.setItem("token", res.token)
        router.push("/")
    } else {
        alert(res.message)
    }
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
