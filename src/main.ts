import { createApp } from "vue"
import "./styles/style.sass"
import App from "./App.vue"
import router from "./router"
import "vuetify/styles"
import { createVuetify } from "vuetify"
import * as components from "vuetify/components"
import * as directives from "vuetify/directives"
import { aliases, mdi } from "vuetify/iconsets/mdi"
import "@mdi/font/css/materialdesignicons.css"
import { initializeApp } from "firebase/app"
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyB7COZppxM7QRZUvYv2JC7EsoFTJBswjUE",
    authDomain: "photosite-3bf2e.firebaseapp.com",
    projectId: "photosite-3bf2e",
    storageBucket: "photosite-3bf2e.appspot.com",
    messagingSenderId: "478584999688",
    appId: "1:478584999688:web:c01eaf898ad6780351a6bd",
    measurementId: "G-EHDQNNF792",
}

initializeApp(firebaseConfig)

const vuetify = createVuetify({
    components,
    directives,
    icons: {
        defaultSet: "mdi",
        aliases,
        sets: {
            mdi,
        },
    },
})

createApp(App).use(router).use(vuetify).mount("#app")
