<template>
    <div class="wrapper-home"></div>
    <div class="wrapper-home__block">
        <NavigationBar></NavigationBar>
        <div class="nav-wrapper">
            <div class="home-page gallery-page">
                <div class="gallery-page__title">
                    <h1>Our</h1>
                    <!-- <HoverButton :buttonData="dropdownData" @button-selected="filterBy"><v-icon icon="mdi-filter-menu-outline" size="x-large" /></HoverButton> -->
                </div>
                <div class="forum-container">
                    <div class="forum-container__add">
                        <label>
                            <input class="forum-container__add-input" type="text" v-model="comment" placeholder="Enter your comment! (Max 500 char)" maxlength="500" />
                        </label>
                        <button class="forum-container__add-button" @click="addComment">Comment</button>
                    </div>
                    <div v-for="comment in filteredCommentsPage" :key="commentId" class="forum-container__comments">
                        <div class="forum-container__comments-wrapper">
                            <div class="forum-container__comments-user">
                                <v-avatar image="../src/assets/avatar.jpg" size="45"></v-avatar>
                                <p style="font-weight: 700; margin-top: 6px">{{ comment.userName }}</p>
                                <v-spacer />
                                <br />
                                <p>{{ convertData(comment.createdAt) }}</p>
                            </div>
                            <div class="forum-container__comments-comment">
                                {{ comment.forumComment }}
                            </div>
                            <div class="forum-container__comments-buttons">
                                <v-icon icon="mdi-cards-heart-outline" size="x-large" @click="" />
                                <v-icon class="forum-container__comments-buttons-space" icon="mdi-alert-outline" size="x-large" @click="" />
                                <v-icon icon="mdi-delete" size="x-large" @click="" />
                            </div>
                        </div>
                    </div>
                    <v-pagination v-if="applyPagination" v-model:modelValue="page" :length="pages" :total-visible="5" circle class="ps-pagination" />
                </div>
            </div>
        </div>
    </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import NavigationBar from '../components/NavigationBar.vue'
import Modal from '../components/Modal.vue'
import HoverButton from '../components/HoverButton.vue'
import axios from 'axios'
import { computed } from '@vue/reactivity'
import { getAuth } from 'firebase/auth'
import { useRouter, useRoute } from 'vue-router'

const route = useRoute()

const comment = ref('')
const currentUserId = ref('')
const page = ref(1)
const minCommentCountForPagination = ref(15)
const commentsPerPage = ref(10)
const filteredCommentsForPagination = ref([])
const forumComments = ref([])
const forumId = ref(route.params.id)

onMounted(() => {
    getAllComments()
})

const getAllComments = async () => {
    // const forumId = route.params.id
    try {
        const response = await axios.get('/getAllForumComments', {
            baseURL: 'http://localhost:8080',
            params: {
                id: forumId.value,
            },
        })
        forumComments.value = response.data
        console.log(forumComments.value.length)
    } catch (err) {
        console.log(err)
    }
}

const addComment = async () => {
    // const forumId = route.params.id
    console.log(forumId)
    if (comment.value === '') {
        alert('Write the comment!')
        return
    }
    try {
        const auth = getAuth()
        const user = auth.currentUser.uid
        const userData = { forumId: forumId.value, userId: user, forumComment: comment.value }
        console.log(userData)
        axios.post('/addForumComment', userData, {
            baseURL: 'http://localhost:8080',
        })
    } catch (err) {
        console.log(err + 'Comment created unsuccessfully :(')
    }
    comment.value = ''
    getAllComments()
}

const convertData = (data) => {
    const convertedData = new Date(data)
    return convertedData.toUTCString()
    // this.routerId = this.$route.params.id
}

// const filterBy = (index) => {
//     console.log(index)
//     dropdownData[index].click.call(this)
// }

const applyPagination = computed(() => {
    return forumComments.value.length > minCommentCountForPagination.value
})

const pages = computed(() => {
    return Math.ceil(forumComments.value.length / commentsPerPage.value)
})

const filteredCommentsPage = computed(() => {
    if (applyPagination) {
        return forumComments.value.slice((page.value - 1) * commentsPerPage.value, page.value * commentsPerPage.value)
    }
    return forumComments
})
</script>
