<script setup>
import NavigationBar from '../components/NavigationBar.vue'
</script>

<template>
    <div class="wrapper-home"></div>
    <div class="wrapper-home__block">
        <NavigationBar @image-response="uploadedImage"></NavigationBar>
        <div class="nav-wrapper">
            <div class="home-page gallery-page">
                <div class="gallery-page__title">
                    <h1 v-if="popularImages.length !== 0">Most popular photos!</h1>
                </div>
                <div class="images-modal" v-if="showModal" @click="showModal = false">
                    <div class="images-modal__wrapper">
                        <img class="images-modal__image" :src="selectedImage.file_src" />
                        <p class="images-modal__image-author">Author : {{ selectedImage.userName }}</p>
                    </div>
                </div>

                <v-carousel v-if="popularImages.length !== 0" cycle height="400" hide-delimiter-background show-arrows="hover">
                    <v-carousel-item v-for="image in popularImages" :key="image.id" :src="image.file_src" @click=";(selectedImage = image), (showModal = true)">
                        <!-- <v-carousel-item-content class="white--text text-center carousel-name">
                            <p>Author : {{ image.userName }}</p>
                        </v-carousel-item-content> -->
                    </v-carousel-item>
                </v-carousel>
                <div v-if="filteredImagesPage.length !== 0" class="gallery-page__title" style="margin-top: 24px">
                    <h1>Recent photos!</h1>
                </div>
                <div class="gallery-page__grid">
                    <div class="gallery-page__image-card" v-for="image in filteredImagesPage" :key="image.id">
                        <div class="gallery-page__image-card-photo-wrapper">
                            <img @click=";(selectedImage = image), (showModal = true)" class="gallery-page__image-card-photo" :src="image.file_src" />
                        </div>
                        <div>
                            <button @click="likeImage(image.imageId)" :class="{ 'button-main__liked': image.userLikeCount }" class="button-main">
                                <v-icon icon="mdi-thumb-up-outline" size="small" />
                                {{ image.likeCount + (image.userLikeCount === 1 ? ' Like' : ' Likes') }}
                            </button>
                            <div class="gallery-page__image-card-photo-wrapper-author">{{ image.userName }}</div>
                        </div>
                    </div>
                </div>
                <div v-if="filteredImagesPage.length === 0" class="gallery-page__title"><h1>Upload the image and be the first one!</h1></div>
                <v-pagination v-if="applyPagination" v-model="page" :length="pages" :total-visible="5" circle class="ps-pagination" />
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
            popularImages: [],
            minImagesCountForPagination: 24,
            page: 1,
            imagesPerPage: 12,
            selectedImage: null,
            showModal: false,
        }
    },
    created() {
        this.getImages()
        this.getPopularImages()
    },
    computed: {
        applyPagination() {
            return this.images.length > this.minImagesCountForPagination
        },

        pages() {
            return Math.ceil(this.images.length / this.imagesPerPage)
        },

        filteredImagesPage() {
            if (this.applyPagination) {
                return this.images.slice((this.page - 1) * this.imagesPerPage, this.page * this.imagesPerPage)
            }
            return this.images
        },
    },
    methods: {
        async getImages() {
            const userId = await getAuth().currentUser.uid
            const firebaseToken = await getAuth().currentUser.getIdToken()
            try {
                const response = await axios.get('/getAllImages', {
                    params: {
                        userId: userId,
                    },
                    baseURL: 'http://localhost:8080',
                    headers: {
                        Authorization: `Bearer ${firebaseToken}`,
                    },
                })
                this.images = response.data
            } catch (err) {
                console.log(err)
            }
        },
        async getPopularImages() {
            const userId = await getAuth().currentUser.uid
            const firebaseToken = await getAuth().currentUser.getIdToken()
            try {
                const response = await axios.get('/getPopularImages', {
                    params: {
                        userId: userId,
                    },
                    baseURL: 'http://localhost:8080',
                    headers: {
                        Authorization: `Bearer ${firebaseToken}`,
                    },
                })
                this.popularImages = response.data
            } catch (err) {
                console.log(err)
            }
        },
        async likeImage(imageId) {
            const userId = getAuth().currentUser.uid
            const firebaseToken = await getAuth().currentUser.getIdToken()
            const userData = { userId: userId, imageId: imageId }
            try {
                await axios.post('/likeImage', userData, {
                    baseURL: 'http://localhost:8080',
                    headers: {
                        Authorization: `Bearer ${firebaseToken}`,
                    },
                })
                this.getImages()
            } catch (err) {
                console.log(err)
            }
        },
        uploadedImage(image) {
            this.images.unshift(image.data)
        },
    },
}
</script>
