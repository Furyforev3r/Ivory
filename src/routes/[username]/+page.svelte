<script lang="ts">
    import { goto } from "$app/navigation"
    import { user } from "$lib/client/hooks/loginState"
    import { onMount } from "svelte"
    import Icon from "@iconify/svelte"
    import Tabs from "$lib/components/+Tabs.svelte"
    import Discover from "$lib/components/+Discover.svelte"
    import { page } from "$app/stores"
    import axios from "axios"
    import { z } from "zod"
    import toast, { Toaster } from "svelte-french-toast"

    let userInfo
    let username
    let userProfile
    let userProfileClone
    let canEdit = false
    let editing = false
    let formErrors = {}
    let formValues = {
        bannerURL: '',
        photoURL: '',
        username: '',
        displayName: '',
        description: ''
    }

    $: username = $page.params.username
    $: userInfo = $user

    const profileSchema = z.object({
        bannerURL: z.string().url("Please enter a valid URL for the banner."),
        photoURL: z.string().url("Please enter a valid URL for the photo."),
        username: z.string()
            .min(1, "Username is required.")
            .max(15, "Username cannot exceed 15 characters."),
        displayName: z.string()
            .min(1, "Display name is required.")
            .max(20, "Display name cannot exceed 15 characters."),
        description: z.string()
            .max(160, "Description cannot exceed 160 characters."),
    })

    async function fetchUserData() {
        const response = await axios.get(`/api/getAccount/?username=${username}`)
        userProfile = response.data
        userProfileClone = userProfile

        if (userProfile.user.uid == userInfo.uid) {
            canEdit = true
        }
    }

    onMount(async () => {
        if (!userInfo) {
            goto("/login")
        }

        if (username && userInfo && !userProfile || userProfile.user.username != username) {
            fetchUserData()
        }
    })

    function toggleEditing() {
        editing = !editing
    }

    async function handleEditProfile(e) {
        e.preventDefault()

        const formData = {
            bannerURL: e.target.bannerURL.value,
            photoURL: e.target.photoURL.value,
            username: e.target.username.value
                .replace(/[^\w\s]/gi, '')
                .replace(/\s+/g, '.')
                .substring(0, 15)
                .toLowerCase(),
            displayName: e.target.displayName.value,
            description: e.target.description.value
        }

        const result = profileSchema.safeParse(formData)

        if (!result.success) {
            formErrors = result.error.format()
            toast.error("Form is invalid")
        } else {
            try {
                let response = await axios.put(`api/editAccount?token=${userInfo.accessToken}&uid=${userInfo.uid}`, result.data)

                if (response.status == 200) {
                    toast.success(response.data.message)
                    fetchUserData()
                } else {
                    toast.error(response.data.error)
                }
            } catch (error) {
                toast.error("An error occurred while updating the profile")
            }
            goto(`/${userProfile.user.username}`)
        }
    }
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
        <Toaster />
        {#if editing}
            <div class="editProfile">
                <form class="form" on:submit={handleEditProfile}>
                    <div class="formTitle">
                        <h1>Edit Profile</h1>
                        <button on:click={toggleEditing}>
                            <Icon icon="charm:cross" width="32" height="32" style="cursor: pointer;"/>                        
                        </button>
                    </div>

                    <label for="bannerURL">Profile Banner URL</label>
                    <input id="bannerURL" placeholder="Banner URL..." type="text" bind:value={userProfileClone.user.bannerURL} />
                    {#if formErrors.bannerURL}
                        <span class="error">{formErrors.bannerURL._errors[0]}</span>
                    {/if}

                    <label for="photoURL">Profile Photo URL</label>
                    <input id="photoURL" placeholder="Photo URL..." type="text" bind:value={userProfileClone.user.photoURL} />
                    {#if formErrors.photoURL}
                        <span class="error">{formErrors.photoURL._errors[0]}</span>
                    {/if}

                    <label for="username">Profile Username</label>
                    <input id="username" placeholder="Username..." type="text" bind:value={userProfileClone.user.username} />
                    {#if formErrors.username}
                        <span class="error">{formErrors.username._errors[0]}</span>
                    {/if}

                    <label for="displayName">Profile Display Name</label>
                    <input id="displayName" placeholder="Display Name..." type="text" bind:value={userProfileClone.user.displayName} />
                    {#if formErrors.displayName}
                        <span class="error">{formErrors.displayName._errors[0]}</span>
                    {/if}

                    <label for="description">Profile Description</label>
                    <textarea id="description" placeholder="Description..." bind:value={userProfileClone.user.description}></textarea>
                    {#if formErrors.description}
                        <span class="error">{formErrors.description._errors[0]}</span>
                    {/if}

                    <input class="submit" type="submit" value="Submit" />
                </form>
            </div>
        {/if}
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
                            <button on:click={toggleEditing}>Edit Profile</button>
                        {/if}
                        <button on:click={() => window.alert("To do")}>Share</button>
                    </div>
                </div>
                <h2>{userProfile.user.displayName}</h2>
                <p class="username">@{userProfile.user.username}</p>
                <div class="profileInfo">
                    <a href={`/${userProfile.user.username}/followers`}><span>0</span> Followers</a>
                    <a href={`/${userProfile.user.username}/following`}><span>0</span> Following</a>
                    <p><span>0</span> Posts</p>
                </div>
                <div class="profileDescription">
                    <p>{userProfile.user.description}</p>
                </div>
                <div class="contentList">
                    <button class="contentButton selected">Posts</button>
                    <button class="contentButton">Replies</button>
                    <button class="contentButton">Media</button>
                    <button class="contentButton">Likes</button>
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

    .form {
        display: flex;
        flex-direction: column;
        width: 60%;
        background: var(--background-base);
        padding: 1.2rem;
        border-radius: 0.3rem;
        gap: 0.3rem;
    }

    .formTitle {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
    }

    .formTitle button {
        border: none;
        background: none;
    }

    .editProfile {
        position: absolute;
        overflow: auto;
        width: 100%;
        height: 100%;
        display: grid;
        place-items: center;
        background: rgba(0, 0, 0, 0.5);
    }

    .form input[type="text"], .form textarea {
        padding: 1rem;
        background: var(--background-elevated-highlight);
        border: 0.1rem solid var(--background-elevated-press);
        color: var(--text-subdued);
        border-radius: 1rem;
    }

    .form input, .form textarea {
        border: none;
        outline: none;
    }

    .error {
        color: var(--text-negative);
        font-size: 0.875rem;
    }

    .submit {
        cursor: pointer;
        margin: 0.3rem;
        padding: 1rem;
        background: var(--text-base);
        border: 0.1rem solid var(--background-elevated-press);
        color: var(--white-color-primary);
        border-radius: 1rem;
        transition: 0.8s background;
    }

    .submit:hover, .submit:focus {
        background: var(--text-subdued);
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

    .contentList {
        display: flex;
        flex-direction: row;
        gap: 0.3rem;
        margin-block: 1rem;
    }

    .contentButton, .selected {
        padding: 1rem;
        cursor: pointer;
        background: none;
        border-radius: 0.3rem;
        font-weight: 600;
        font-size: 16px;
        transition: 0.3s background;
    }

    .contentButton {
        border: none;
    }

    .contentButton:hover, .selected:hover {
        background: var(--background-elevated-press);
    }

    .selected {
        border-bottom: 0.3rem solid var(--background-elevated-press);
    }

    @media (max-width: 800px) {
        .content {
            width: 85%;
            max-width: 85%;
        }
    }
</style>