<template>
    <div>
        <v-btn class="upload-button" :loading="isSelecting" @click="handleFileImport"> Upload File </v-btn>
        <input ref="uploader" class="d-none" type="file" name="image" accept="image/jpeg" @change="onFileChanged" />
    </div>
</template>
<script type="module">
import axios from 'axios'
import { getAuth } from 'firebase/auth'
import Toastify from 'toastify-js'
import 'toastify-js/src/toastify.css'
export default {
    name: 'FileUpload',
    data() {
        return {
            file: '',
            message: '',
            isSelecting: false,
            selectedFile: null,
        }
    },
    methods: {
        handleFileImport() {
            this.isSelecting = true
            window.addEventListener(
                'focus',
                () => {
                    this.isSelecting = false
                },
                { once: true }
            )
            this.$refs.uploader.click()
        },
        onFileChanged(e) {
            this.selectedFile = e.target.files[0]
            this.uploadImage(this.selectedFile)
        },
        async uploadImage(image) {
            console.log(image)
            const userId = getAuth().currentUser.uid
            const formData = new FormData()
            const firebaseToken = await getAuth().currentUser.getIdToken()
            formData.append('file', image)
            formData.append('userId', userId)
            console.log(firebaseToken)
            try {
                await axios.post('/upload', formData, {
                    baseURL: 'http://localhost:8080',
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        Authorization: `Bearer ${firebaseToken}`,
                    },
                })
                Toastify({
                    text: 'Image uploaded successfully',
                    duration: 5000,
                    newWindow: true,
                    close: true,
                    gravity: 'bottom',
                    position: 'right',
                    stopOnFocus: true,
                    style: {
                        background: 'rgba(13, 180, 185, 1)',
                        borderRadius: '12px',
                    },
                    onClick: function () {}, // Callback after click
                }).showToast()
            } catch (err) {
                Toastify({
                    text: err.response.data.error,
                    duration: 5000,
                    newWindow: true,
                    close: true,
                    gravity: 'bottom',
                    position: 'right',
                    stopOnFocus: true,
                    style: {
                        background: 'rgba(254, 21, 21, 0.8)',
                        borderRadius: '12px',
                    },
                    onClick: function () {}, // Callback after click
                }).showToast()
                console.log(err.response.data.error)
            }
        },
    },
}
</script>
