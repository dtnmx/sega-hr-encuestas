import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)

// Restaurar la sesión persistida antes de montar, para que el guard de
// /admin/* tenga el estado de auth listo en la primera navegación.
const auth = useAuthStore(pinia)
auth.init().finally(() => app.mount('#app'))
