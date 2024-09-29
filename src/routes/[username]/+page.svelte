<script lang="ts">
    import { goto } from "$app/navigation"
    import { user } from "$lib/client/hooks/loginState"
    import { logout } from "$lib/client/utils/firebaseUtils"
    import { afterUpdate } from "svelte"
    import Icon from "@iconify/svelte"
    import Tabs from "$lib/components/+Tabs.svelte"
    import Discover from "$lib/components/+Discover.svelte"
    import { page } from "$app/stores"
    import axios from "axios"

    let userInfo
    let username
    let userProfile
    let canEdit = false

    $: username = $page.params.username
    $: userInfo = $user

    afterUpdate(async () => {
        if (!userInfo) {
            goto("/login")
        }

        if (username && userInfo) {
            const response = await axios.get(`/api/getAccount/?username=${username}`)
            userProfile = response.data

            if (userProfile.user.uid == userInfo.uid) {
                canEdit = true
            }
        }
    })
</script>

<svelte:head>
    <title>Ivory</title>
    <meta name="description" content="Ivory!" />
</svelte:head>

<main class="main">
    {#if userInfo == 'Loading...'}
        <div class="loading">
            <Icon icon="svg-spinners:3-dots-move" width="6rem" height="6rem" style="color: black" />
        </div>
    {:else if userInfo && userProfile}
        <Tabs userUID={userInfo.uid} />
        <div class="content">
            <img src={userProfile.user.bannerURL} alt={`${userProfile.displayName}'s banner`} class="banner">
            <div class="profile">
                <div class="topInfo">
                    <a href={userProfile.user.photoURL}>
                        <img src={userProfile.user.photoURL} alt={`${userProfile.displayName}`} >                        
                    </a>
                    <div class="profileButtons">
                        {#if canEdit}
                            <button on:click={() => window.alert("To do")}>Edit Profile</button>
                        {/if}
                        <button on:click={() => window.alert("To do")}>Share</button>
                    </div>
                </div>
                <h2>{userProfile.user.displayName}</h2>
                <p class="username">@{userProfile.user.username}</p>
                <div class="profileInfo">
                    <a href={`/${userProfile.user.username}/aaa/followers`}><span>0</span> Followers</a>
                    <a href={`/${userProfile.user.username}/aaa/following`}><span>0</span> Following</a>
                    <p><span>0</span> Posts</p>
                </div>
                <div class="profileDescription">
                    <p>{userProfile.user.description}</p>
                </div>
            </div>
        </div>
        <Discover />
    {/if}

</main>

<style>
    .main {
        height: 100dvh;
        display: flex;
        flex-direction: row;
    }

    .content {
        width: 50%;
        max-width: 50%;
        border-inline: 1px solid var(--gainsboro);
    }

    .loading {
        display: grid;
        place-items: center;
        height: 100%;
        width: 100%;      
    }

    .banner {
        width: 100%;
        overflow: hidden;
        width: 100%;
        height: 150px;
        object-fit: cover;
        border-bottom: 1px solid var(--gainsboro);
    }

    .profile {
        display: flex;
        flex-direction: column;
        padding: 1rem;
    }

    .profile img {
        cursor: pointer;
        height: 100px;
        width: 100px;
        object-fit: cover;
        border-radius: 50%;
    }

    .topInfo {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .profileButtons {
        display: flex;
        flex-direction: row;
        gap: 0.3rem;
    }

    .profileButtons button {
        cursor: pointer;
        padding: 1rem;
        background: var(--white-smoke);
        border-radius: 999px;
        border: 0.1rem solid var(--background-elevated-press);
        color: var(--text-subdued);
        transition: background 0.3s;
    }

    .profileButtons button:hover {
        background: var(--background-elevated-press);
    }

    .username {
        color: var(--text-subdued);
    }

    .profileInfo {
        display: flex;
        flex-direction: row;
        gap: 0.3rem;
        margin-block: 0.3rem;
    }

    .profileInfo a, .profileInfo p {
        color: var(--text-subdued);
        text-decoration: none;
    }

    .profileInfo span {
        font-weight: 600;
        color: var(--text-base);
    }

    .profileInfo a:hover {
        text-decoration: underline;
    }

    .profileDescription {
        padding: 0.1rem;
    }

    @media (max-width: 800px) {
        .content {
            width: 90%;
            max-width: 90%;
        }
    }
</style>