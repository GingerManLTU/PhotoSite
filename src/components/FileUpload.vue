<template>
    <div class="file">
        <form @submit.prevent="onSubmit" enctype="multipart/form-data">
            <div class="fields">
                <label>Upload files</label><br />
                <input name="imageUpload" type="file" ref="file" @change="onSelect" />
            </div>
            <div class="fields">
                <button>Submit</button>
            </div>
            <div class="message">
                <h5>{{ message }}</h5>
            </div>
        </form>
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
        }
    },
    methods: {
        onSelect() {
            this.file = this.$refs.file.files[0]
        },
        async onSubmit() {
            console.log(this.file)
            const userId = getAuth().currentUser.uid
            const formData = new FormData()
            formData.append('file', this.file)
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
