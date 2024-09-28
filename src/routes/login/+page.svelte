<script lang="ts">
    import { loginWithGoogle } from "$lib/client/utils/firebaseUtils"
    import { user } from "$lib/client/hooks/loginState"
    import { afterUpdate } from "svelte"
    import { goto } from "$app/navigation"
    import googleIcon from "$lib/images/googleIcon.svg"
    import axios from 'axios'

    let userInfo

    $: userInfo = $user

    afterUpdate(() => {
        if (userInfo) {
            goto("/")
        }
    })

    async function handleGoogleLogin() {
        const { success, user, error } = await loginWithGoogle()


        if (success) {
            try {
                const response = await axios.post('/api/login', {
                    'uid': user.uid,
                    'photoURL': user.photoURL,
                    'bannerURL': '/placeholder/',
                    'displayName': user.displayName,
                    'username': `${user.displayName.replace(/[^\w\s]/gi, '').replace(/\s+/g, '.').substring(0, 10).toLowerCase()}.${user.uid.substring(0, 5).toLowerCase()}`,
                    'description': 'Hello Ivory!',
                    'createdAt': user.metadata.createdAt,
                    'email': user.email,
                    'emailVerified': user.emailVerified,
                    'settings': { default: true }
                })

                if (response.status === 201 || response.status == 409) {
                    goto("/")
                }
            } catch (error) {
                console.error("Login error:", error)
            }
        }
    }
</script>

<svelte:head>
    <title>Ivory - Login</title>
    <meta name="description" content="Ivory!" />
</svelte:head>

<main class="main">
    <div class="loginContent">
        <h1>Ivory!</h1>
        <p>Your favorite little space.</p>
    </div>
    <div class="divider"></div>
    <div class="loginContent">
        <button on:click={handleGoogleLogin}><img src={googleIcon} width="25px" alt="Google Icon" /> Login with Google</button>
    </div>
</main>

<style>
    .main {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-around;
        height: 100dvh;
    }

    .divider {
        width: 2px;
        height: 60%;
        background: var(--gainsboro);
    }

    .loginContent {
        display: flex;
        flex-direction: column;
        gap: 0.3rem;
    }

    .loginContent button {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 0.3rem;
        cursor: pointer;
        background: none;
        padding: 1rem;
        border-radius: 0.3rem;
        border: 0.1rem solid var(--background-elevated-press);
        color: var(--text-subdued);
        transition: 0.3s border-color;
        transition: 0.2s box-shadow;
    }

    .loginContent button:hover {
        border-color: var(--background-elevated-highlight);
        -webkit-box-shadow: 0px 0px 5px 3px rgba(245,245,245,1);
        -moz-box-shadow: 0px 0px 5px 3px rgba(245,245,245,1);
        box-shadow: 0px 0px 5px 3px rgba(245,245,245,1);
    }
</style>
