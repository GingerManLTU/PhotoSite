import { createRouter, createWebHistory } from "vue-router"
import { getAuth, onAuthStateChanged } from "firebase/auth"

const routes = [
    {
        path: "/",
        name: "Home",
        component: () => import("./views/Home.vue"),
        //important allow just auth users
        meta: {
            requiresAuth: true,
        },
    },
    {
        path: "/login",
        name: "Login",
        component: () => import("./views/Login.vue"),
    },
    {
        path: "/register",
        name: "Register",
        component: () => import("./views/Register.vue"),
    },
]

const getCurrentUser = () => {
    return new Promise((resolve, reject) => {
        const removeListener = onAuthStateChanged(
            getAuth(),
            (user) => {
                removeListener()
                resolve(user)
            },
            reject
        )
    })
}

const router = createRouter({
    history: createWebHistory(),
    routes,
})

router.beforeEach(async (to, from, next) => {
    if (to.matched.some((record) => record.meta.requiresAuth)) {
        //auth check
        if (await getCurrentUser()) {
            next()
        } else {
            alert("You dont have permission")
            return next("/login")
        }
    } else {
        next()
    }
})

export default router
