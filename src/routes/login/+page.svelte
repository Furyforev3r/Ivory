<script lang="ts">
    import { goto } from '$app/navigation'
    import googleIcon from "$lib/images/googleIcon.svg"

    let login: bool = false

    if (login) {
        goto("/")
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
        <button><img src={googleIcon} width="25px" alt="Google Icon" /> Login with Google</button>
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
