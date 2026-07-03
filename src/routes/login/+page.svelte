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
                    'bannerURL': 'https://firebasestorage.googleapis.com/v0/b/ivory-social.appspot.com/o/Ivory%2FIvory%20Banner%20(1).png?alt=media&token=ca08dc25-eaa8-46e3-b130-27847aa113a4',
                    'displayName': user.displayName.substring(0, 15),
                    'username': `${user.displayName.replace(/[^\w\s]/gi, '').replace(/\s+/g, '.').substring(0, 10).toLowerCase()}.${user.uid.substring(0, 5).toLowerCase()}`,
                    'description': 'Hello Ivory!',
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
    <div class="brandSide">
        <span class="wordmark">Ivory</span>
        <p class="tagline">Your favorite little space.</p>
    </div>
    <div class="divider"></div>
    <div class="actionSide">
        <h1>Happening now</h1>
        <p class="subtitle">Join Ivory today.</p>
        <button class="googleButton" on:click={handleGoogleLogin}>
            <img src={googleIcon} width="20px" alt="Google Icon" /> Continue with Google
        </button>
    </div>
</main>

<style>
    .main {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-around;
        gap: 3rem;
        height: 100dvh;
        padding-inline: 2rem;
    }

    .brandSide {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.4rem;
    }

    .wordmark {
        font-size: 56px;
        font-weight: 800;
        color: var(--essential-announcement);
        letter-spacing: -0.02em;
    }

    .tagline {
        color: var(--text-subdued);
        font-size: 16px;
    }

    .divider {
        width: 1px;
        height: 60%;
        background: var(--gainsboro);
    }

    .actionSide {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 0.6rem;
        max-width: 320px;
    }

    .actionSide h1 {
        font-size: 32px;
        font-weight: 800;
    }

    .subtitle {
        color: var(--text-subdued);
        margin-bottom: 0.6rem;
    }

    .googleButton {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        gap: 0.6rem;
        cursor: pointer;
        background: var(--text-base);
        color: var(--background-base);
        width: 100%;
        padding: 0.9rem 1.2rem;
        border-radius: 999px;
        border: none;
        font-weight: 700;
        font-size: 15px;
        transition: 0.2s opacity;
    }

    .googleButton img {
        border-radius: 50%;
        background: #fff;
        padding: 2px;
    }

    .googleButton:hover {
        opacity: 0.85;
    }

    @media (max-width: 700px) {
        .main {
            flex-direction: column;
            justify-content: center;
            gap: 2rem;
        }

        .divider {
            width: 60%;
            height: 1px;
        }

        .actionSide {
            align-items: center;
            text-align: center;
        }
    }
</style>
