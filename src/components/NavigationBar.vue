<template>
    <header class="navigation-header" :class="{ 'scrolled-navigation': scrollPosition }">
        <nav class="navigation-nav">
            <div class="navigation-icon">
                <v-icon icon="mdi-menu" size="x-large" @click="toggleMobileNav" v-show="mobile" class="icon-element" :class="{ 'icon-active': mobileNav }" />
            </div>
            <div class="navigation-branding" :class="{ 'logo-active': mobile }">
                <img src="../assets/logo.png" alt="" />
            </div>
            <ul v-show="!mobile" class="navigation-titles">
                <li class="nagivation-li"><router-link class="navigation-link" :to="{ name: 'Home' }">Home</router-link></li>
                <li class="nagivation-li"><router-link class="navigation-link" :to="{ name: '' }">About</router-link></li>
                <li class="nagivation-li"><router-link class="navigation-link" :to="{ name: '' }">Profile</router-link></li>
                <li class="nagivation-li">
                    <div class="wrapper-div" @mouseover="onOver" @mouseleave="onLeave">
                        <router-link class="navigation-link" :to="{ name: '' }">Contact</router-link>
                    </div>
                </li>
            </ul>

            <transition name="mobile-nav">
                <ul v-show="mobileNav" class="navigation-dropdown">
                    <li class="nagivation-li"><router-link class="navigation-link" :to="{ name: 'Home' }">Home</router-link></li>
                    <li class="nagivation-li"><router-link class="navigation-link" :to="{ name: '' }">About</router-link></li>
                    <li class="nagivation-li"><router-link class="navigation-link" :to="{ name: '' }">Profile</router-link></li>
                    <li class="nagivation-li"><router-link class="navigation-link" :to="{ name: '' }">Contact</router-link></li>
                </ul>
            </transition>
            <div class="ml-3 dropdown">
                <v-avatar image="src/assets/avatar.jpg" size="45"></v-avatar>
                <div class="dropdown-content">
                    <a href="#">Profile</a>
                    <a href="#">Gallery</a>
                    <a @click="Logout">Logout</a>
                </div>
            </div>
        </nav>
    </header>
</template>

<script>
export default {
    name: "nagivation-bar",
    data() {
        return {
            scrollPosition: null,
            mobile: null,
            mobileNav: null,
            windowWidth: null,
            isVisible: true,
        }
    },
    created() {
        window.addEventListener("resize", this.checkScreen)
        this.checkScreen()
    },
    mounted() {
        window.addEventListener("scroll", this.updateScroll)
    },
    methods: {
        toggleMobileNav() {
            this.mobileNav = !this.mobileNav
        },
        updateScroll() {
            const scrollPositionRight = window.scrollY
            if (scrollPositionRight > 50) {
                this.scrollPosition = true
                return
            }
            this.scrollPosition = false
        },
        checkScreen() {
            this.windowWidth = window.innerWidth
            if (this.windowWidth <= 750) {
                this.mobile = true
                return
            }
            this.mobile = false
            this.mobileNav = false
            return
        },
    },
}
</script>
<script setup>
import { useRouter } from "vue-router"
import { onMounted, ref } from "vue"
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth"

const isLoggedIn = ref(false)

let auth
onMounted(() => {
    auth = getAuth()
    onAuthStateChanged(auth, (user) => {
        if (user) {
            isLoggedIn.value = true
        } else {
            isLoggedIn.value = false
        }
    })
})

const router = useRouter()

const Logout = async () => {
    signOut(auth).then(() => {
        router.push("/login")
    })
}
</script>

<style scoped>
ul,
.navigation-link {
    font-weight: 500;
    color: #fff;
    list-style: none;
    text-decoration: none;
}

img {
    width: 60px;
    transition: 0.5s ease all;
}
</style>
