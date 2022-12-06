<script setup>
import NavigationBar from '../components/NavigationBar.vue'
</script>

<template>
    <div class="wrapper-home"></div>
    <div class="wrapper-home__block">
        <NavigationBar></NavigationBar>
        <div class="nav-wrapper">
            <div class="home-page gallery-page">
                <div class="gallery-page__title">
                    <h1>Most popular photos!</h1>
                </div>
                <div class="gallery-page__grid">
                    <div class="gallery-page__image-card" v-for="image in images" :key="image.id">
                        <div class="gallery-page__image-card-photo-wrapper">
                            <img class="gallery-page__image-card-photo" :src="image.file_src" />
                        </div>
                        <div>
                            <button @click="likeImage(image.imageId)" :class="{ 'button-main__liked': image.userLikeCount }" class="button-main">
                                <v-icon icon="mdi-thumb-up-outline" size="small" />
                                {{ image.likeCount + (image.userLikeCount === 1 ? ' Like' : ' Likes') }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import axios from 'axios'
import { getAuth } from 'firebase/auth'
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
            const userId = getAuth().currentUser.uid
            try {
                const response = await axios.get('/getAllImages', {
                    params: {
                        userId: userId,
                    },
                    baseURL: 'http://localhost:8080',
                })
                this.images = response.data
                console.log(this.images)
            } catch (err) {
                console.log(err)
            }
        },
        async likeImage(imageId) {
            const userId = getAuth().currentUser.uid
            const userData = { userId: userId, imageId: imageId }
            try {
                await axios.post('/likeImage', userData, {
                    baseURL: 'http://localhost:8080',
                })
                this.getImages()
            } catch (err) {
                console.log(err)
            }
        },
    },
}
</script>
