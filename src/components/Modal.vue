<template>
    <div class="text-center">
        <v-dialog v-model="dialog">
            <template v-slot:activator="{ props }">
                <v-btn color="lightblue" v-bind="props"> Create topic </v-btn>
            </template>
            <v-card>
                <v-card-title>Create your own topic!</v-card-title>
                <v-card-text>
                    <label>
                        <span>Enter title</span>
                        <input type="text" v-model="title" placeholder="Tips for..." required />
                    </label>
                    <v-spacer />
                    <label>
                        <span>Describe it! (Max 200 char)</span>
                        <v-textarea maxlength="200" v-model="description" placeholder="Describe your topic for everyone!" required />
                    </label>
                </v-card-text>
                <v-card-actions>
                    <v-btn color="primary" block @click="addTopic()">Add topic</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'
import { getAuth } from 'firebase/auth'

const dialog = ref(false)
const title = ref('')
const description = ref('')

const addTopic = async () => {
    if (title.value === '' || description.value === '') {
        alert('Fill in some information!')
        dialog.value = false
        return
    }
    try {
        const auth = getAuth()
        const user = auth.currentUser.uid
        const userData = { userId: user, title: title.value, description: description.value }
        console.log(userData)
        axios.post('/createForumTopic', userData, {
            baseURL: 'http://localhost:8080',
        })
    } catch (err) {
        console.log(err + 'Forum topic created unsuccessfully :(')
    }
    dialog.value = false
    title.value = ''
    description.value = ''
}
</script>
