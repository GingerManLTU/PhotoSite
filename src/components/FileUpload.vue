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
<script>
import axios from 'axios'
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
            const file = this.$refs.file.files[0]
            this.file = file
        },
        async onSubmit() {
            console.log(this.file)
            const formData = new FormData()
            formData.append('file', this.file)
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

            // await axios.postForm(
            //     '/upload',
            //     { file: this.file },
            //     {
            //         baseURL: 'http://localhost:8080',
            //     }
            // )
            // try {
            //     await axios.postForm('/upload', { 'files[]': [this.file] })
            //     this.message = 'Upload successfully'
            // } catch (err) {
            //     console.log(err)
            //     this.message = 'Something went wrong :('
            // }
        },
    },
}
</script>
