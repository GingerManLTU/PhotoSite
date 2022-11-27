<script setup>
import NavigationBar from '../components/NavigationBar.vue'
</script>

<template>
    <div class="wrapper-home"></div>
    <div class="wrapper-home__block">
        <NavigationBar></NavigationBar>
        <h1>Home Page</h1>
        <div class="image" v-for="image in images" :key="image.id">
            <img class="image" :src="image.file_src" />
        </div>
    </div>
</template>

<script>
import axios from 'axios'
import { getAuth } from 'firebase/auth'
import { useRouter } from 'vue-router'
export default {
    data() {
        return {
            images: [],
            userId: '',
            routerId: '',
        }
    },
    created() {
        this.userAuth()
        this.getUserImages()
    },
    methods: {
        // async getUserImages() {
        //     const userId = this.$route.params.id
        //     try {
        //         const response = await axios.get('/getUserImagess', {
        //             baseURL: 'http://localhost:8080',
        //         })
        //         this.images = response.data
        //         console.log(this.images)
        //     } catch (err) {
        //         console.log(err)
        //     }
        // },
        userAuth() {
            const router = useRouter()
            this.userId = getAuth().currentUser.uid
            this.routerId = this.$route.params.id
            if (this.userId !== this.routerId) {
                alert("You don't have permission")
                router.push('/home')
            }
        },

        async getUserImages() {
            try {
                const response = await axios.get('/getUserImages', {
                    baseURL: 'http://localhost:8080',
                    params: {
                        id: this.routerId,
                    },
                })
                console.log(response)
                this.images = response.data
                console.log(this.images)
            } catch (err) {
                console.log(err)
            }
        },
    },
}
</script>
