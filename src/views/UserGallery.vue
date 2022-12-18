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
                        <button @click="deleteImage(image.imageId)" class="button-main">
                            <v-icon icon="mdi-delete" size="small" @click="" />
                            Delete
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
                const response = await axios.get('/getUserImages', {
                    baseURL: 'http://localhost:8080',
                    params: {
                        id: this.routerId,
                    },
                })
                this.images = response.data
            } catch (err) {
                console.log(err)
            }
        },
        async deleteImage(id) {
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
                                id: id,
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
    },
}
</script>
