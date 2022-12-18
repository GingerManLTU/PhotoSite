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

<template>
    <div class="wrapper-home"></div>
    <div class="wrapper-home__block">
        <NavigationBar></NavigationBar>
        <div class="nav-wrapper">
            <div class="home-page gallery-page">
                <div class="gallery-page__title">
                    <h1>Our creators forums!</h1>
                    <Modal style="margin-top: 20px" />
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
                                <td @click="openSelectedTopic(topic.forumId)">
                                    {{ topic.forumTitle }}
                                </td>
                                <td @click="openSelectedTopic(topic.forumId)">{{ topic.userName }}</td>
                                <td @click="openSelectedTopic(topic.forumId)">{{ convertData(topic.createdAt) }}</td>
                                <td class="random-th__button"><v-icon v-if="currentUserId === topic.userId" icon="mdi-delete" size="large" @click="deleteTopic(topic.forumId)" /></td>
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
            try {
                const response = await axios.get('/getAllForumTopics', {
                    baseURL: 'http://localhost:8080',
                })
                this.forumTopics = response.data
                console.log(this.forumTopics)
            } catch (err) {
                console.log(err)
            }
        },
        async deleteTopic(id) {
            try {
                await axios.delete('/deleteTopic', {
                    baseURL: 'http://localhost:8080',
                    params: {
                        id: id,
                    },
                })
                this.getForumTopics()
            } catch (err) {
                console.log(err)
            }
        },
        convertData(data) {
            const convertedData = new Date(data)
            return convertedData.toUTCString()
        },
        filterBy(index) {
            console.log(index)
            this.dropdownData[index].click.call(this)
        },
    },
}
</script>
