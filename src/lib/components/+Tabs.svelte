<script lang="ts">
    import axios from "axios"
    import { onMount } from "svelte"
    import { user } from "$lib/client/hooks/loginState"
    import Icon from "@iconify/svelte"
    import { logout } from "$lib/client/utils/firebaseUtils"
    import autosize from "svelte-autosize"
    import { z } from "zod"
    import toast, { Toaster } from "svelte-french-toast"

    export let userUID

    let userAccount
    let userInfo

    $: userInfo = $user

    let post = false
    let image = false

    let postValue = ''
    let imageURL = ''

    let errorMessage = ''

    const postSchema = z.object({
        postValue: z.string().min(1, "Post cannot be empty").max(300, "Post cannot exceed 300 characters"),
        imageURL: z.string().url("Invalid URL").or(z.literal("")).optional(),
    })

    onMount(async () => {
        if (userUID) {
            const response = await axios.get(`/api/getUser/?uid=${userUID}`)
            userAccount = response.data
        }
    })

    function togglePost() {
        post = !post
    }

    function toggleImage() {
        image = !image
    }


    async function validateAndPost() {
        const validationResult = postSchema.safeParse({ postValue, imageURL })
        
        if (!validationResult.success) {
            errorMessage = validationResult.error.errors[0]?.message
        } else {
            try {
                let response = await axios.post(`api/newPost?token=${userInfo.accessToken}`, {
                    'userUID': userInfo.uid,
                    'content': postValue,
                    'image': image,
                    'imageURL': imageURL
                })

                if (response.status == 200 || response.status == 201) {
                    toast.success(response.data.message)
                    errorMessage = ''
                    image = false
                    postValue = ''
                    imageURL = ''
                } else {
                    toast.error(response.data.error)
                }
            } catch (error) {
                toast.error("An error occurred while making the post")
            }
        }
    }

</script>

<nav class="tabs">
    <Toaster />
    {#if userInfo == 'Loading...'}
        <div class="loading">
            <Icon icon="svg-spinners:3-dots-move" width="6rem" height="6rem" style="color: black" />
        </div>
    {:else if userAccount && userInfo}
        {#if post}
            <div class="postToast">
                <div class="postToastContainer">   
                    <div class="toastHead">
                        <button on:click={togglePost}>Cancel</button>                    
                        <button on:click={validateAndPost}>Post</button>                    
                    </div>
                    <div class="post">
                        <img src={userAccount.user.photoURL} width="64px" height="64px" class="profilePicture" />
                        <textarea use:autosize maxlength="300" placeholder="Post..." bind:value={postValue}></textarea>
                    </div>
                    <div class="footer">
                        {#if !image}
                            <button class="addImage" on:click={toggleImage}>Add image</button>
                            {:else}
                            <button class="removeImage" on:click={toggleImage}>Remove image</button>
                        {/if}
                        {#if errorMessage}
                            <p class="error">{errorMessage}</p>
                        {/if}
                        <p class="counter">Ivory · {-postValue.length + 300}</p>
                    </div>
                </div>
                {#if image}
                    <div class="postToastContainer" style="margin-top: 3%;">
                        <input class="imageInput" placeholder="Image URL..." type="text" bind:value={imageURL}>
                    </div>
                {/if}
            </div>
        {/if}
        <ul>
            <a>
                <img src={userAccount.user.photoURL} width="64px" height="64px" class="profilePicture" />                
            </a>
            <li>
                <a href='/'>
                    <Icon icon="material-symbols:home-outline-rounded" width="28px" height="28px" />
                    <p>Home</p>
                </a>
            </li>
            <li>
                <a href="/search">
                    <Icon icon="material-symbols:search" width="28px" height="28px" />
                    <p>Search</p>
                </a>
            </li>
            <li>
                <a href={`/${userAccount.user.username}`}>
                    <Icon icon="material-symbols:account-circle-outline" width="28px" height="28px" />
                    <p>Profile</p>
                </a>
            </li>
            <li>
                <a href="/settings">
                    <Icon icon="material-symbols:settings-outline-rounded" width="28px" height="28px" />
                    <p>Settings</p>
                </a>
            </li>
            <button class="postButton" on:click={togglePost} >
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
    .postToast {
        transform: translateX(-1.2rem);
        position: absolute;
        overflow: auto;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        background: rgba(0, 0, 0, 0.5);
    }

    .postToastContainer {
        overflow: hidden;
        max-height: 50%;
        margin-top: 5%;
        width: 40%;
        background: var(--background-base);
        padding: 1.2rem;
        border-radius: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.8rem;
    }

    .toastHead {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
    }

    .toastHead button {
        cursor: pointer;
        padding: 0.8rem;
        background: var(--white-smoke);
        border-radius: 999px;
        border: 0.1rem solid var(--background-elevated-press);
        color: var(--text-subdued);
        transition: background 0.3s;
    }

    .toastHead button:hover {
        background: var(--background-elevated-press);
    }

    .post {
        height: 100%;
        overflow: auto;
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 0.3rem;
    }

    .post::-webkit-scrollbar {
        width: 10px;
        background-color: var(--background-elevated-highlight);
    }

    .post::-webkit-scrollbar-thumb {
        background: var(--background-elevated-press);
        border-radius: 0.8rem;
    }

    .post textarea {
        width: 100%;
        height: 100%;
        padding: 1rem;
        background: var(--background-elevated-highlight);
        border: 0.1rem solid var(--background-elevated-press);
        color: var(--text-subdued);
        border-radius: 1rem;
        border: none;
        outline: none;
    }

    .footer {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
    }

    .addImage, .removeImage {
        cursor: pointer;
        padding: 0.8rem;
        border-radius: 999px;
        border: 0.1rem solid var(--background-elevated-press);
        font-weight: 600;
        font-size: 12px;
        color: #fff;
        transition: background 0.3s;
    }

    .addImage {
        background: var(--essential-announcement);
    }

    .removeImage {
        background: var(--essential-negative);
    }

    .error {
        color: var(--essential-negative);
        font-size: 14px;
        margin-top: 0.5rem;
    }

    .counter {
        font-size: 14px;
        color: var(--text-subdued);
    }

    .imageInput {
        padding: 1rem;
        background: var(--background-elevated-highlight);
        border: 0.1rem solid var(--background-elevated-press);
        color: var(--text-subdued);
        border-radius: 1rem;
        border: none;
        outline: none;
    }

    .tabs {
        overflow: auto;
        height: 100%;
        max-height: 100vh;
        min-width: 25%;
        max-width: 25%;
        padding-inline: 1.2rem;
        background: var(--background-elevated-base);
    }

    .profilePicture {
        min-width: 64px;
        border: 1px solid var(--white-smoke);
        border-radius: 50%;
        cursor: pointer;
        object-fit: cover;
    }

    .tabs ul {
        padding-block: 1.2rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .tabs ul li a {
        padding: 0.8rem;
        cursor: pointer;
        display: flex;
        flex-direction: row;
        gap: 0.3rem;
        align-items: center;
        background: var(--white-smoke);
        border-radius: 0.3rem;
        border: 0.1rem solid var(--background-elevated-press);
        transition: 0.3s background;
    }

    .tabs ul li a:hover {
        background: var(--background-elevated-press);
    }

    .tabs ul li a {
        text-decoration: none;
        color: var(--text-subdued);
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
        border-radius: 999px;
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
        .postToastContainer {
            width: 80%;
        }

        .tabs {
            min-width: 15%;
            max-width: 15%;
        }

        .tabs ul {
            justify-content: center;
            align-items: center;
        }

        .tabs ul li a {
            width: 28px;
        }

        .postButton {
            width: 64px;
        }

        .logout {
            width: 44px;
        }

        .tabs ul li p {
            display: none;
        }

        .postButton p {
            display: none;
        }
    }
</style>
