<script setup>
import { useRouter } from "vue-router"
import { StytchUIClient } from "@stytch/vanilla-js"
import NavigationBar from "../components/NavigationBar.vue"

const stytch = new StytchUIClient("public-token-test-f064f5ec-8805-44ee-b671-27528b66fda4")

const router = useRouter()

const Logout = async () => {
    let session = stytch.session.getSync()

    if (session === null) {
        router.push("/login")
    }

    console.log(session)

    const res = await fetch("http://localhost:8080/logout", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            session_token: localStorage.getItem("token"),
        }),
    }).then((res) => res.json())

    if (res.success) {
        localStorage.removeItem("token")
        router.push("/login")
    } else {
        alert(res.message)
    }
}
</script>

<template>
    <div class="wrapper-login">
        <NavigationBar></NavigationBar>
        <h1>Home Page</h1>
        <button @click="Logout">Logout</button>
    </div>
</template>
