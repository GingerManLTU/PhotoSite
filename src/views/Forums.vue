<template>
    <div class="wrapper-home"></div>
    <div class="wrapper-home__block">
        <NavigationBar></NavigationBar>
        <div class="nav-wrapper">
            <div class="home-page gallery-page">
                <div class="gallery-page__title">
                    <h1>Our creators forums!</h1>
                    <Modal style="margin-top: 20px" @forum-data="updateForum" />
                    <!-- <HoverButton :buttonData="dropdownData" @button-selected="filterBy"><v-icon icon="mdi-filter-menu-outline" size="x-large" /></HoverButton> -->
                </div>
                <div>
                    <v-table density="comfortable" fixed-header style="border-radius: 12px">
                        <thead>
                            <tr>
                                <th class="text-left">Topic</th>
                                <th class="text-left random-th">Creator</th>
                                <th class="text-left random-th">Created At</th>
                                <th class="random-th__button">
                                    <HoverButton :buttonData="dropdownData" @button-selected="filterBy"><v-icon icon="mdi-filter-menu-outline" size="x-large" /></HoverButton>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="topic in forumTopics" :key="topic.forumId">
                                <td @click="openSelectedTopic(topic.forumId)" style="cursor: pointer">
                                    {{ topic.forumTitle }}
                                </td>
                                <td @click="openSelectedTopic(topic.forumId)" style="cursor: pointer">{{ topic.userName }}</td>
                                <td @click="openSelectedTopic(topic.forumId)" style="cursor: pointer">{{ convertData(topic.createdAt) }}</td>
                                <td class="random-th__button"><v-icon v-if="currentUserId === topic.userId" icon="mdi-delete" size="large" @click="deleteTopic(topic.forumId, topic.userId)" /></td>
                            </tr>
                        </tbody>
                    </v-table>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import axios from 'axios'
import { getAuth } from 'firebase/auth'
import Swal from 'sweetalert2'

export default {
    data() {
        return {
            images: [],
            dialog: false,
            forumTopics: [],
            currentUserId: '',
            dropdownData: [
                {
                    title: 'Topics',
                    click() {
                        this.forumTopics.sort((a, b) => {
                            return a.forumTitle.localeCompare(b.forumTitle)
                        })
                    },
                },
                {
                    title: 'Creator',
                    click() {
                        this.forumTopics.sort((a, b) => {
                            return a.userName.localeCompare(b.userName)
                        })
                    },
                },
                {
                    title: 'Created At',
                    click() {
                        this.forumTopics.sort((a, b) => {
                            return b.createdAt - a.createdAt
                        })
                    },
                },
            ],
        }
    },
    created() {
        this.getForumTopics()
    },
    methods: {
        async getForumTopics() {
            this.currentUserId = getAuth().currentUser.uid
            const firebaseToken = await getAuth().currentUser.getIdToken()
            try {
                const response = await axios.get('/getAllForumTopics', {
                    baseURL: 'http://localhost:8080',
                    params: {
                        userId: this.currentUserId,
                    },
                    headers: {
                        Authorization: `Bearer ${firebaseToken}`,
                    },
                })
                this.forumTopics = response.data
            } catch (err) {
                console.log(err)
            }
        },
        deleteTopic(forumId, forumUserId) {
            Swal.fire({
                title: 'Are you sure?',
                text: 'Your topic will be deleted!',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Yes, delete it!',
            }).then(async (result) => {
                if (result.isConfirmed) {
                    try {
                        const firebaseToken = await getAuth().currentUser.getIdToken()
                        await axios.delete('/deleteTopic', {
                            baseURL: 'http://localhost:8080',
                            params: {
                                forumId: forumId,
                                userId: this.currentUserId,
                                forumUserId: forumUserId,
                            },
                            headers: {
                                Authorization: `Bearer ${firebaseToken}`,
                            },
                        })
                        this.getForumTopics()
                    } catch (err) {
                        console.log(err)
                    }
                    Swal.fire('Deleted!', 'Your topic has been deleted.', 'success')
                }
            })
        },
        updateForum(forum) {
            this.forumTopics.unshift(forum.data)
        },
        convertData(data) {
            const convertedData = new Date(data)
            return convertedData.toUTCString()
        },
        filterBy(index) {
            this.dropdownData[index].click.call(this)
        },
    },
}
</script>
<script setup>
import NavigationBar from '../components/NavigationBar.vue'
import Modal from '../components/Modal.vue'
import HoverButton from '../components/HoverButton.vue'
import { useRouter } from 'vue-router'
const router = useRouter()

const openSelectedTopic = (id) => {
    router.push({ name: 'Selected', params: { id: id } })
}
</script>
