<script setup>
import { ref } from "vue"
import { useRouter } from "vue-router"

const router = useRouter()

const email = ref("")
const password = ref("")

const Login = async () => {
    if (!email.value || !password.value) {
        return alert("Please fill in all fields")
    }
    const res = await fetch("http://localhost:8080/login", {
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
                        <button class="submit-button" @click="Login">Login</button>
                        <div>
                            <p>Dont have an account? <router-link to="/register">Register</router-link></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
