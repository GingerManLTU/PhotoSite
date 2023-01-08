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
                                <v-img src="https://picsum.photos/id/91/400/400" alt="profile" object-fit="cover"></v-img>
                            </v-avatar>
                            <v-spacer />
                            <br />
                            <p>{{ currentUsername }}</p>
                            <v-spacer />
                            <br />
                            <p>Email: {{ userEmail }}</p>
                            <v-spacer />
                            <br />
                            <v-spacer />
                            <br />
                            <p>User points: {{ userPoints }}</p>
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
import Toastify from 'toastify-js'
import 'toastify-js/src/toastify.css'

const router = useRouter()

const newEmail = ref('')
const newUsername = ref('')
const newPassword = ref('')
const rNewPassword = ref('')
const currentUsername = ref('')
const showModal = ref(false)
const authPassword = ref('')
const imageUrl = ref('https://i.picsum.photos/id/91/3504/2336.jpg?hmac=tK6z7RReLgUlCuf4flDKeg57o6CUAbgklgLsGL0UowU')
const userEmail = ref('')
const allUsers = ref('')
const userPoints = ref('')

//TODO: add success messages

onMounted(() => {
    // getAllComments()
    // getForumTitle()
    getCurrentUserEmail()
    getUserPoints()
})

const strongPassword = (pass) => {
    const valid = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+=-])[A-Za-z\d!@#$%^&*()_+=-]{8,}$/
    return valid.test(pass)
}

const validateEmail = (email) => {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    return re.test(String(email).toLowerCase())
}

const getCurrentUserEmail = async () => {
    const firebaseToken = await getAuth().currentUser.getIdToken()
    const user = await getAuth().currentUser
    userEmail.value = user.email
    try {
        const response = await axios.get('/getUsername', {
            baseURL: 'http://localhost:8080',
            params: {
                userId: user.uid,
            },
            headers: {
                Authorization: `Bearer ${firebaseToken}`,
            },
        })
        currentUsername.value = response.data[0].userName
    } catch (err) {
        console.log(err)
    }
}

const deleteCurrentUser = async () => {
    const user = await getAuth().currentUser
    const firebaseToken = await getAuth().currentUser.getIdToken()

    let deleteFireUserError = false

    Swal.fire({
        title: 'Are you sure?',
        text: 'Your account will be deleted!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!',
    }).then(async (result) => {
        if (result.isConfirmed) {
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
                                headers: {
                                    Authorization: `Bearer ${firebaseToken}`,
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
        }
    })

    // TODO toasters
}

const updateUserEmail = async () => {
    if (validateEmail(newEmail.value)) {
        Swal.fire({
            title: 'Are you sure?',
            text: 'Your email will be updated!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, update it!',
        }).then(async (result) => {
            if (result.isConfirmed) {
                const user = await getAuth().currentUser
                user.getIdToken(true)
                updateEmail(user, newEmail.value)
                    .then(() => {
                        console.log('Email updated successfully')
                        getCurrentUserEmail()
                        newEmail.value = ''
                        Swal.fire('Updated!', 'Your email has been updated.', 'success')
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
        })
    } else {
        Toastify({
            text: 'Wrong email format',
            duration: 5000,
            newWindow: true,
            close: true,
            gravity: 'top',
            position: 'right',
            stopOnFocus: true,
            style: {
                background: 'rgba(254, 21, 21, 0.8)',
                borderRadius: '12px',
                minWidth: '200px',
                marginTop: '60px',
            },
        }).showToast()
    }
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
    const firebaseToken = getAuth().currentUser.getIdToken()
    try {
        const response = await axios.get('/getAllUsernames', {
            baseURL: 'http://localhost:8080',
            headers: {
                Authorization: `Bearer ${firebaseToken}`,
            },
        })
        allUsers.value = response.data
    } catch (err) {
        console.log(err)
    }
    if (allUsers.value.some((obj) => obj.userName === newUsername.value)) {
        return Toastify({
            text: `This username: '${newUsername.value}' already exist... :(`,
            duration: 5000,
            newWindow: true,
            close: true,
            gravity: 'top',
            position: 'right',
            stopOnFocus: true,
            style: {
                background: 'rgba(254, 21, 21, 0.8)',
                borderRadius: '12px',
                minWidth: '200px',
                marginTop: '60px',
            },
        }).showToast()
    }
    if (newUsername.value.length > 13) {
        return Toastify({
            text: `Username is too long, maximum 12 characters.`,
            duration: 5000,
            newWindow: true,
            close: true,
            gravity: 'top',
            position: 'right',
            stopOnFocus: true,
            style: {
                background: 'rgba(254, 21, 21, 0.8)',
                borderRadius: '12px',
                minWidth: '200px',
                marginTop: '60px',
            },
        }).showToast()
    }

    const userId = getAuth().currentUser.uid
    console.log(userId + newUsername.value)
    if (!newUsername.value) {
        return Toastify({
            text: 'Enter username!',
            duration: 5000,
            newWindow: true,
            close: true,
            gravity: 'top',
            position: 'right',
            stopOnFocus: true,
            style: {
                background: 'rgba(254, 21, 21, 0.8)',
                borderRadius: '12px',
                minWidth: '200px',
                marginTop: '60px',
            },
        }).showToast()
    }

    if (!newUsername.value.match(/^[a-zA-Z0-9]+$/)) {
        return Toastify({
            text: 'Only alphanumeric!',
            duration: 5000,
            newWindow: true,
            close: true,
            gravity: 'top',
            position: 'right',
            stopOnFocus: true,
            style: {
                background: 'rgba(254, 21, 21, 0.8)',
                borderRadius: '12px',
                minWidth: '200px',
                marginTop: '60px',
            },
        }).showToast()
    }
    Swal.fire({
        title: 'Are you sure?',
        text: 'Your username will be updated!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, update it!',
    }).then(async (result) => {
        if (result.isConfirmed) {
            const userData = { userId: userId, userName: newUsername.value }
            const firebaseToken = await getAuth().currentUser.getIdToken()
            try {
                await axios.post('/updateUsername', userData, {
                    baseURL: 'http://localhost:8080',
                    headers: {
                        Authorization: `Bearer ${firebaseToken}`,
                    },
                })
                getCurrentUserEmail()
                newUsername.value = ''
                Swal.fire('Updated!', 'Your username has been updated.', 'success')
            } catch (err) {
                console.log(err)
            }
        }
    })
}

const getUserPoints = async () => {
    try {
        const firebaseToken = await getAuth().currentUser.getIdToken()
        const userId = getAuth().currentUser.uid
        const response = await axios.get('/getUserPoints', {
            baseURL: 'http://localhost:8080',
            params: {
                userId: userId,
            },
            headers: {
                Authorization: `Bearer ${firebaseToken}`,
            },
        })
        console.log(response.data)
        userPoints.value = response.data[0].likesCount + response.data[0].lovedCommentsCount
        console.log(userPoints.value)
    } catch (err) {
        console.log(err)
    }
}

const updateUserPassword = async () => {
    if (!strongPassword(newPassword.value)) {
        newPassword.value = ''
        rNewPassword.value = ''
        return Toastify({
            text: 'Password must be at least 8 characters long, must contain at least one lowercase and uppercase letter, one number and special character',
            duration: 5000,
            newWindow: true,
            close: true,
            gravity: 'top',
            position: 'right',
            stopOnFocus: true,
            style: {
                background: 'rgba(254, 21, 21, 0.8)',
                borderRadius: '12px',
                minWidth: '200px',
                marginTop: '60px',
            },
        }).showToast()
    }
    if (newPassword.value !== rNewPassword.value) {
        newPassword.value = ''
        rNewPassword.value = ''
        return Toastify({
            text: 'Passwords do not match...',
            duration: 5000,
            newWindow: true,
            close: true,
            gravity: 'top',
            position: 'right',
            stopOnFocus: true,
            style: {
                background: 'rgba(254, 21, 21, 0.8)',
                borderRadius: '12px',
                minWidth: '200px',
                marginTop: '60px',
            },
        }).showToast()
    } else {
        Swal.fire({
            title: 'Are you sure?',
            text: 'Your password will be updated!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, update it!',
        }).then(async (result) => {
            if (result.isConfirmed) {
                const user = await getAuth().currentUser
                updatePassword(user, newPassword.value)
                    .then(() => {
                        console.log('Password updated successfully')
                        Swal.fire('Updated!', 'Your password has been updated.', 'success')
                    })
                    .catch((err) => {
                        if (err.message === 'Firebase: Error (auth/requires-recent-login).') {
                            showModal.value = true
                        } else {
                            console.log('An error occurred:', err.message)
                        }
                    })
            }
        })
    }
    newPassword.value = ''
    rNewPassword.value = ''
}
</script>
