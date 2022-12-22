<template>
    <div>
        <v-btn class="upload-button" :loading="isSelecting" @click="handleFileImport"> Upload File </v-btn>
        <input ref="uploader" class="d-none" type="file" name="image" accept="image/jpeg" @change="onFileChanged" />
    </div>
</template>
<script type="module">
import axios from 'axios'
import { getAuth } from 'firebase/auth'
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
            formData.append('file', image)
            formData.append('userId', userId)
            try {
                await axios.post('/upload', formData, {
                    baseURL: 'http://localhost:8080',
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                })
            } catch (err) {
                console.log(err)
                this.message = 'Something went wrong :('
            }
        },
    },
}
</script>
