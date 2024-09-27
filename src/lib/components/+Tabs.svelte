<script lang="ts">
    import axios from "axios"
    import { onMount } from "svelte"
    import Icon from "@iconify/svelte"
    import { logout } from "$lib/client/utils/firebaseUtils"

    export let userUID

    let userInfo

    onMount(async () => {
        if (userUID) {
            const response = await axios.get(`/api/getUser/?uid=${userUID}`)
            userInfo = response.data
        }
    })

</script>

<nav class="tabs">
    {#if userInfo}
        <ul>
            <a>
                <img src={userInfo.user.photoURL} width="64px" class="profilePicture" />                
            </a>
            <li>
                <Icon icon="material-symbols:home-outline-rounded" width="28px" height="28px" />
                <a href='/'>Home</a>
            </li>
            <li>
                <Icon icon="material-symbols:search" width="28px" height="28px" class="icon" />
                <a href="/search">Search</a>
            </li>
            <li>
                <Icon icon="material-symbols:account-circle-outline" width="28px" height="28px" />
                <a href={`/${userInfo.user.uid}`}>Profile</a>
            </li>
            <li>
                <Icon icon="material-symbols:settings-outline-rounded" width="28px" height="28px" />
                <a href="/settings">Settings</a>
            </li>
            <button class="postButton">
                <Icon icon="material-symbols:edit-square-outline-rounded" width="28px" height="28px" color="fff" />
                <p>New post</p>
            </button>
            <button class="postButton logout" on:click={logout}>
                <Icon icon="material-symbols:logout-rounded" width="22px" height="22px" color="fff" />
                <p>Log out</p>
            </button>
        </ul>
    {/if}
</nav>

<style>
    .tabs {
        height: 100%;
        max-height: 100vh;
        max-width: 256px;
        padding-inline: 1.2rem;
        background: var(--background-elevated-base);
    }

    .profilePicture {
        border: 1px solid var(--white-smoke);
        border-radius: 50%;
        cursor: pointer;
    }

    .tabs ul {
        padding-block: 1.2rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .tabs ul li {
        padding: 0.8rem;
        cursor: pointer;
        display: flex;
        flex-direction: row;
        gap: 0.3rem;
        align-items: center;
        background: var(--white-smoke);
        border-radius: 0.3rem;
        transition: 0.3s background;
    }

    .tabs ul li:hover {
        background: var(--background-elevated-press);
    }

    .tabs ul li a {
        text-decoration: none;
        color: var(--text-base);
        font-size: 18px;
        font-weight: 600;
    }

    .postButton {
        cursor: pointer;
        background: #000;
        padding: 1rem;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        gap: 0.3rem;
        border: none;
        border-radius: 0.8rem;
        transition: 0.3s background;
    }

    .postButton:hover {
        background: var(--text-subdued);
    }

    .postButton * {
        color: #fff;
    }

    .postButton p {
        font-size: 16px;
        font-weight: 400;
    }

    .logout {
        width: 125px;
        padding: 0.6rem;
        background: var(--essential-negative);
    }

    .logout p {
        font-size: 14px;
    }

    .logout:hover {
        background: var(--text-negative);
    }


    @media (max-width: 800px) {
        .tabs {
            width: 80px;
        }

        .tabs ul {
            justify-content: center;
            align-items: center;
        }

        .tabs ul li {
            width: 28px;
        }

        .postButton {
            width: 64px;
        }

        .logout {
            width: 44px;
        }

        .tabs ul li a {
            display: none;
        }

        .postButton p {
            display: none;
        }
    }
</style>