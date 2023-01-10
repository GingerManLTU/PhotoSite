<script setup>
import NavigationBar from '../components/NavigationBar.vue'
</script>

<template>
    <div class="wrapper-home"></div>
    <div class="wrapper-home__block">
        <NavigationBar></NavigationBar>
        <div class="nav-wrapper">
            <div class="gallery-page">
                <div class="gallery-page__title">
                    <h1>Your gallery</h1>
                </div>
                <div class="gallery-page__grid">
                    <div class="gallery-page__image-card" v-for="image in images" :key="image.id">
                        <div class="gallery-page__image-card-photo-wrapper">
                            <img class="gallery-page__image-card-photo" :src="image.file_src" />
                        </div>
                        <button @click="deleteImage(image.imageId, image.userId)" class="button-main">
                            <v-icon icon="mdi-delete" size="small" @click="" />
                            Delete
                        </button>
                        <button @click="changeImageType(image.imageId, image.imageType)" class="button-main">
                            <v-icon icon="mdi-swap-horizontal" size="small" @click="" />
                            {{ image.imageType ? 'Private' : 'Public' }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import axios from 'axios'
import { getAuth } from 'firebase/auth'
import { useRouter } from 'vue-router'
import Swal from 'sweetalert2'
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
                const firebaseToken = await getAuth().currentUser.getIdToken()
                const response = await axios.get('/getUserImages', {
                    baseURL: 'http://localhost:8080',
                    params: {
                        id: this.routerId,
                    },
                    headers: {
                        Authorization: `Bearer ${firebaseToken}`,
                    },
                })
                this.images = response.data
            } catch (err) {
                console.log(err)
            }
        },
        async deleteImage(imageId, imageUserId) {
            const firebaseToken = await getAuth().currentUser.getIdToken()
            Swal.fire({
                title: 'Are you sure?',
                text: 'Your photo will be deleted!',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Yes, delete it!',
            }).then(async (result) => {
                if (result.isConfirmed) {
                    try {
                        await axios.delete('/deleteImage', {
                            baseURL: 'http://localhost:8080',
                            params: {
                                imageId: imageId,
                                userId: this.routerId,
                                imageUserId: imageUserId,
                            },
                            headers: {
                                Authorization: `Bearer ${firebaseToken}`,
                            },
                        })
                        this.getUserImages()
                    } catch (err) {
                        console.log(err)
                    }
                    Swal.fire('Deleted!', 'Your photo has been deleted.', 'success')
                }
            })
        },
        async changeImageType(imageId, imageType) {
            const userId = getAuth().currentUser.uid
            const userData = { userId: userId, imageId: imageId, imageType: imageType }
            const firebaseToken = await getAuth().currentUser.getIdToken()
            try {
                await axios.post('/updateImageType', userData, {
                    baseURL: 'http://localhost:8080',
                    headers: {
                        Authorization: `Bearer ${firebaseToken}`,
                    },
                })
                this.getUserImages()
            } catch (err) {
                console.log(err)
            }
        },
    },
}
</script>
