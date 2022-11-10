<script setup>
import { useRouter } from "vue-router"
import { StytchUIClient } from "@stytch/vanilla-js"
import NavigationBar from "../components/NavigationBar.vue"
</script>

<template>
    <div class="wrapper-home"></div>
    <div class="wrapper-home__block">
        <NavigationBar></NavigationBar>
        <h1>Home Page</h1>
        <button @click="Logout">Logout</button>
    </div>
</template>
