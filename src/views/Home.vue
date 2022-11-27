<script setup>
import NavigationBar from '../components/NavigationBar.vue'
</script>

<template>
    <div class="wrapper-home"></div>
    <div class="wrapper-home__block">
        <NavigationBar></NavigationBar>
        <h1>Home Page</h1>
        <button @click="Logout">Logout</button>
        <div class="image" v-for="image in images" :key="image.id">
            <img class="image" :src="image.file_src" />
        </div>
    </div>
</template>

<script>
import axios from 'axios'
export default {
    data() {
        return {
            images: [],
        }
    },
    created() {
        this.getImages()
    },
    methods: {
        async getImages() {
            try {
                const response = await axios.get('/getAllImages', {
                    baseURL: 'http://localhost:8080',
                })
                this.images = response.data
                console.log(this.images)
            } catch (err) {
                console.log(err)
            }
        },
    },
}
</script>
