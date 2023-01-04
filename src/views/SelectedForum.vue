<template>
    <div class="wrapper-home"></div>
    <div class="wrapper-home__block">
        <NavigationBar></NavigationBar>
        <div class="nav-wrapper">
            <div class="home-page gallery-page">
                <!-- <HoverButton :buttonData="dropdownData" @button-selected="filterBy"><v-icon icon="mdi-filter-menu-outline" size="x-large" /></HoverButton> -->

                <div class="forum-container">
                    <div class="text-color-black">
                        <div>
                            <h1 class="forum-container__title">{{ forumTitle }}</h1>
                            <h2 class="forum-container__description">{{ forumDescription }}</h2>
                        </div>
                    </div>
                    <div class="forum-container__add">
                        <label>
                            <input class="forum-container__add-input" type="text" v-model="comment" placeholder="Enter your comment! (Max 500 char)" maxlength="500" />
                        </label>
                        <button class="forum-container__add-button" @click="addComment">Comment</button>
                    </div>
                    <div v-if="forumComments.length" v-for="comment in filteredCommentsPage" :key="commentId" class="forum-container__comments">
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
                            <div class="forum-container__comments-buttons primary-color">
                                <!-- :class="{ 'button-main__liked': image.userLikeCount }" class="button-main" -->
                                <v-icon v-if="comment.isLoved === 0" icon="mdi-cards-heart-outline" size="x-large" @click="likeComment(comment.commentId)" />
                                <v-icon v-else icon="mdi-cards-heart" size="x-large" @click="likeComment(comment.commentId)" />
                                <div class="forum-container__comments-love">{{ comment.loveCount === 0 ? '' : comment.loveCount }}</div>
                                <v-icon v-if="comment.reportCount === 1" class="forum-container__comments-buttons-space cursor-none" icon="mdi-alert" size="x-large" />
                                <v-icon v-else class="forum-container__comments-buttons-space" icon="mdi-alert-outline" size="x-large" @click="reportComment(comment.commentId)" />
                                <v-icon v-if="isUserOwner(comment.userId)" icon="mdi-delete" size="x-large" @click="deleteComment(comment.forumId, comment.commentId)" />
                            </div>
                        </div>
                    </div>
                    <div v-else class="forum-container__no-comments">No comments yet! Be the first one!</div>

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
import Swal from 'sweetalert2'

const route = useRoute()

const comment = ref('')
const currentUserId = ref('')
const page = ref(1)
const minCommentCountForPagination = ref(15)
const commentsPerPage = ref(10)
const filteredCommentsForPagination = ref([])
const forumComments = ref([])
const forumId = ref(route.params.id)
const forumTitle = ref('')
const forumDescription = ref('')

onMounted(() => {
    getAllComments()
    getForumTitle()
})

const getAllComments = async () => {
    const firebaseToken = await getAuth().currentUser.getIdToken()
    const userId = getAuth().currentUser.uid
    try {
        const response = await axios.get('/getAllForumComments', {
            baseURL: 'http://localhost:8080',
            params: {
                forumId: forumId.value,
                userId: userId,
            },
            headers: {
                Authorization: `Bearer ${firebaseToken}`,
            },
        })
        forumComments.value = response.data
    } catch (err) {
        console.log(err)
    }
}

const getForumTitle = async () => {
    try {
        const firebaseToken = await getAuth().currentUser.getIdToken()
        const userId = getAuth().currentUser.uid
        const response = await axios.get('/getForumTitle', {
            baseURL: 'http://localhost:8080',
            params: {
                forumId: forumId.value,
                userId: userId,
            },
            headers: {
                Authorization: `Bearer ${firebaseToken}`,
            },
        })
        console.log(response.data)
        forumTitle.value = response.data[0].forumTitle
        forumDescription.value = response.data[0].forumDescription
        console.log(forumComments.value)
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
        const firebaseToken = await getAuth().currentUser.getIdToken()
        console.log(userData)
        axios.post('/addForumComment', userData, {
            baseURL: 'http://localhost:8080',
            headers: {
                Authorization: `Bearer ${firebaseToken}`,
            },
        })
    } catch (err) {
        console.log(err + 'Comment created unsuccessfully :(')
    }
    comment.value = ''
    getAllComments()
}
const likeComment = async (commentId) => {
    const userId = getAuth().currentUser.uid
    const userData = { userId: userId, commentId: commentId }
    const firebaseToken = await getAuth().currentUser.getIdToken()
    try {
        await axios.post('/loveComment', userData, {
            baseURL: 'http://localhost:8080',
            headers: {
                Authorization: `Bearer ${firebaseToken}`,
            },
        })
        getAllComments()
    } catch (err) {
        console.log(err)
    }
}

const reportComment = async (commentId) => {
    console.log('aaa')
    const userId = getAuth().currentUser.uid
    const userData = { userId: userId, commentId: commentId }
    const firebaseToken = await getAuth().currentUser.getIdToken()
    try {
        await axios.post('/reportComment', userData, {
            baseURL: 'http://localhost:8080',
            headers: {
                Authorization: `Bearer ${firebaseToken}`,
            },
        })
        getAllComments()
    } catch (err) {
        console.log(err)
    }
}

const deleteComment = async (forumId, commentId) => {
    Swal.fire({
        title: 'Are you sure?',
        text: 'Your comment will be deleted!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!',
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const firebaseToken = await getAuth().currentUser.getIdToken()
                const userId = getAuth().currentUser.uid
                await axios.delete('/deleteComment', {
                    baseURL: 'http://localhost:8080',
                    params: {
                        forumId: forumId,
                        commentId: commentId,
                        userId: userId,
                    },
                    headers: {
                        Authorization: `Bearer ${firebaseToken}`,
                    },
                })
                getAllComments()
            } catch (err) {
                console.log(err)
            }
            Swal.fire('Deleted!', 'Your comment has been deleted.', 'success')
        }
    })
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

const isUserOwner = (userId) => {
    const currentUserId = getAuth().currentUser.uid
    return userId === currentUserId
}
</script>
