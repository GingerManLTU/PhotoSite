<template>
    <div class="wrapper-home"></div>
    <div class="wrapper-home__block">
        <NavigationBar></NavigationBar>
        <div class="nav-wrapper">
            <div class="home-page gallery-page">
                <div class="profile-container">
                    <div class="profile-container-wrapper">
                        <!-- Modal -->
                        <div v-if="showModal" class="modal-overlay">
                            <div class="modal-content">
                                <div class="modal-header">
                                    <button class="modal-button" @click="showModal = false">×</button>
                                </div>
                                <div class="modal-body">
                                    <label for="password">Insert your current password and try again :)</label>
                                    <input v-model="authPassword" type="password" id="password" name="password" />
                                </div>
                                <div class="modal-footer">
                                    <button @click="reauthenticate()">Enter</button>
                                </div>
                            </div>
                        </div>
                        <!-- end -->
                        <div class="profile-container__current">
                            <v-avatar size="65" variant="outlined">
                                <v-img src="https://picsum.photos/id/91/400/400" alt="John" object-fit="cover"></v-img>
                            </v-avatar>
                            <v-spacer />
                            <br />
                            <p>{{ currentUsername }}</p>
                            <v-spacer />
                            <br />

                            <p>Email: {{ userEmail }}</p>
                        </div>
                        <div class="profile-container__form">
                            <v-spacer />
                            <br />
                            <div>
                                <label class="profile-container__title">New email:</label>
                                <br />
                                <input class="profile-container__input" type="email" v-model="newEmail" required />
                                <button @click="updateUserEmail" class="profile-container__button">Update Email</button>
                            </div>

                            <v-spacer />
                            <br />
                            <div>
                                <label class="profile-container__title">New username:</label>
                                <br />
                                <input class="profile-container__input" type="text" v-model="newUsername" required />
                                <button @click="updateUsername" class="profile-container__button">Update Username</button>
                            </div>

                            <v-spacer />
                            <br />
                            <div>
                                <label class="profile-container__title">New password:</label>
                                <br />
                                <input class="profile-container__input" type="password" v-model="newPassword" required />
                            </div>

                            <v-spacer />
                            <br />
                            <div>
                                <label class="profile-container__title">Re-enter password:</label>
                                <br />
                                <input class="profile-container__input" type="password" v-model="rNewPassword" required />
                                <button @click="updateUserPassword" class="profile-container__button">Update Password</button>
                            </div>
                            <v-spacer />
                            <br />
                            <v-spacer />
                            <br />
                            <button @click="deleteCurrentUser" class="profile-container__button-delete">Delete user</button>
                        </div>
                    </div>
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
import { getAuth, updateEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider, deleteUser } from 'firebase/auth'
import { useRouter, useRoute } from 'vue-router'
import Swal from 'sweetalert2'
import { async } from '@firebase/util'

const route = useRoute()
const router = useRouter()

const newEmail = ref('')
const newUsername = ref('')
const newPassword = ref('')
const rNewPassword = ref('')
const currentUsername = ref('')
const showModal = ref(false)
const authPassword = ref('')
const page = ref(1)
const minCommentCountForPagination = ref(15)
const commentsPerPage = ref(10)
const filteredCommentsForPagination = ref([])
const forumComments = ref([])
const forumId = ref(route.params.id)
const forumTitle = ref('')
const forumDescription = ref('')
const imageUrl = ref('https://i.picsum.photos/id/91/3504/2336.jpg?hmac=tK6z7RReLgUlCuf4flDKeg57o6CUAbgklgLsGL0UowU')
const userEmail = ref('')

//TODO: add success messages

onMounted(() => {
    // getAllComments()
    // getForumTitle()
    getCurrentUserEmail()
})

const getCurrentUserEmail = async () => {
    const user = await getAuth().currentUser
    userEmail.value = user.email
    try {
        const response = await axios.get('/getUsername', {
            baseURL: 'http://localhost:8080',
            params: {
                userId: user.uid,
            },
        })
        currentUsername.value = response.data[0].userName
    } catch (err) {
        console.log(err)
    }
}

const deleteCurrentUser = async () => {
    const user = await getAuth().currentUser

    let deleteFireUserError = false

    await deleteUser(user)
        .catch((err) => {
            console.log(err)
            console.log(err.message)
            if (err.message === 'Firebase: Error (auth/requires-recent-login).') {
                deleteFireUserError = true
                console.log('aaa')
                showModal.value = true
            } else {
                deleteFireUserError = true
                console.log('An error occurred:', err)
                alert(err)
            }
        })
        .then(async () => {
            if (!deleteFireUserError) {
                await axios
                    .delete('/deleteUser', {
                        baseURL: 'http://localhost:8080',
                        params: {
                            userId: user.uid,
                        },
                    })
                    .then((response) => {
                        console.log('Successfully deleted user from database')
                        router.push('/')
                    })
                    .catch((error) => {
                        console.error('Error deleting user from database:', error)
                    })
            }
        })
    // TODO toasters

    // let deleteDbUser = null

    // Promise.all([deleteFireUser, deleteDbUser])
    //     .then(() => {
    //         console.log('Successfully deleted user from both Firebase and database')
    //         router.push('/')
    //     })
    //     .catch((error) => {
    //         console.error('Error deleting user:', error)
    //     })
}

const updateUserEmail = async () => {
    const user = await getAuth().currentUser
    user.getIdToken(true)
    console.log(user + newEmail.value)
    updateEmail(user, newEmail.value)
        .then(() => {
            console.log('Email updated successfully')
            getCurrentUserEmail()
            newEmail.value = ''
        })
        .catch((err) => {
            if (err.message === 'Firebase: Error (auth/requires-recent-login).') {
                showModal.value = true
            } else {
                console.log('An error occurred:', err)
                alert(err)
            }
        })
}

const reauthenticate = () => {
    const auth = getAuth()
    let credential = EmailAuthProvider.credential(auth.currentUser.email, authPassword.value)
    authPassword.value = ''
    reauthenticateWithCredential(auth.currentUser, credential)
        .then(() => {
            showModal.value = false
        })
        .catch((err) => {
            alert(err.message)
        })
}

const updateUsername = async () => {
    const userId = getAuth().currentUser.uid
    console.log(userId + newUsername.value)
    const userData = { userId: userId, userName: newUsername.value }
    try {
        await axios.post('/updateUsername', userData, {
            baseURL: 'http://localhost:8080',
        })
        getCurrentUserEmail()
        newUsername.value = ''
    } catch (err) {
        console.log(err)
    }
}

const updateUserPassword = async () => {
    if (newPassword.value !== rNewPassword.value) {
        alert('Passwords do not match')
        return
    } else {
        const user = await getAuth().currentUser
        updatePassword(user, newPassword.value)
            .then(() => {
                console.log('Password updated successfully')
                getCurrentUserEmail()
            })
            .catch((err) => {
                if (err.message === 'Firebase: Error (auth/requires-recent-login).') {
                    showModal.value = true
                } else {
                    console.log('An error occurred:', err.message)
                }
            })
    }
    newPassword.value = ''
    rNewPassword.value = ''
}

// TODO: delete user

// const deleteComment = async (forumId, commentId) => {
//     Swal.fire({
//         title: 'Are you sure?',
//         text: 'Your comment will be deleted!',
//         icon: 'warning',
//         showCancelButton: true,
//         confirmButtonColor: '#3085d6',
//         cancelButtonColor: '#d33',
//         confirmButtonText: 'Yes, delete it!',
//     }).then(async (result) => {
//         if (result.isConfirmed) {
//             try {
//                 await axios.delete('/deleteComment', {
//                     baseURL: 'http://localhost:8080',
//                     params: {
//                         forumId: forumId,
//                         commentId: commentId,
//                     },
//                 })
//                 getAllComments()
//             } catch (err) {
//                 console.log(err)
//             }
//             Swal.fire('Deleted!', 'Your comment has been deleted.', 'success')
//         }
//     })
// }
</script>
