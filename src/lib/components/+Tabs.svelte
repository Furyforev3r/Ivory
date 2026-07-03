<script lang="ts">
    import axios from "axios"
    import { user } from "$lib/client/hooks/loginState"
    import { account, ensureAccount } from "$lib/client/hooks/accountState"
    import Icon from "@iconify/svelte"
    import { logout } from "$lib/client/utils/firebaseUtils"
    import autosize from "svelte-autosize"
    import { z } from "zod"
    import toast, { Toaster } from "svelte-french-toast"
    import { page } from "$app/stores"
    import Skeleton from "./+Skeleton.svelte"
    import { fade, scale } from "svelte/transition"

    let userInfo: any
    let userAccount

    $: userInfo = $user
    $: userAccount = $account
    $: if (userInfo && userInfo !== "Loading...") ensureAccount(userInfo.uid)
    $: currentPath = $page.url.pathname

    let post = false
    let image = false

    let postValue = ""
    let imageURL = ""

    let errorMessage = ""
    let posting = false

    const postSchema = z.object({
        postValue: z.string().min(1, "Post cannot be empty").max(300, "Post cannot exceed 300 characters"),
        imageURL: z.string().url("Invalid URL").or(z.literal("")).optional(),
    })

    function togglePost() {
        post = !post
        errorMessage = ""
    }

    function handleKeydown(event: KeyboardEvent) {
        if (event.key === "Escape" && post) {
            togglePost()
        }
    }

    function toggleImage() {
        image = !image
    }

    function isActive(path: string) {
        return path === "/" ? currentPath === "/" : currentPath.startsWith(path)
    }

    async function validateAndPost() {
        if (!imageURL.trim() && image) {
            errorMessage = "You must provide an image URL to post."
            return
        }

        const validationResult = postSchema.safeParse({ postValue, imageURL })

        if (!validationResult.success) {
            errorMessage = validationResult.error.errors[0]?.message
        } else {
            posting = true
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
                    post = false
                } else {
                    toast.error(response.data.error)
                }
            } catch (error) {
                toast.error("An error occurred while making the post")
            } finally {
                posting = false
            }
        }
    }
</script>

<svelte:window on:keydown={handleKeydown} />
<nav class="tabs">
    <Toaster />
    {#if post}
        <div class="postToast" on:click|self={togglePost} role="presentation" transition:fade={{ duration: 150 }}>
            <div class="postToastContainer" transition:scale={{ duration: 150, start: 0.96 }}>
                <div class="toastHead">
                    <button on:click={togglePost}>Cancel</button>
                    <button class="postSubmit" on:click={validateAndPost} disabled={posting}>
                        {posting ? "Posting..." : "Post"}
                    </button>
                </div>
                <div class="post">
                    {#if userAccount}
                        <img
                            src={userAccount.user.photoURL}
                            width="64px"
                            height="64px"
                            class="profilePicture"
                            alt="Your avatar"
                        />
                    {:else}
                        <Skeleton circle width="64px" height="64px" />
                    {/if}
                    <textarea use:autosize maxlength="300" placeholder="What's happening?" bind:value={postValue}></textarea>
                </div>
                <div class="footer">
                    {#if !image}
                        <button class="addImage" on:click={toggleImage}>
                            <Icon icon="material-symbols:image-outline" width="18" height="18" />
                            Add image
                        </button>
                    {:else}
                        <button class="removeImage" on:click={toggleImage}>
                            <Icon icon="material-symbols:close-small-rounded" width="18" height="18" />
                            Remove image
                        </button>
                    {/if}
                    {#if errorMessage}
                        <p class="error">{errorMessage}</p>
                    {/if}
                    <p class="counter">{-postValue.length + 300}</p>
                </div>
                {#if image}
                    <input class="imageInput" placeholder="Image URL..." type="text" bind:value={imageURL}>
                {/if}
            </div>
        </div>
    {/if}
    <ul>
        <a class="brandLink" href="/" aria-label="Ivory home">
            {#if userAccount}
                <img
                    src={userAccount.user.photoURL}
                    width="64px"
                    height="64px"
                    class="profilePicture"
                    alt="Your avatar"
                />
            {:else}
                <Skeleton circle width="64px" height="64px" />
            {/if}
        </a>
        <li>
            <a href='/' class:selected={isActive('/')}>
                <Icon icon={isActive('/') ? "material-symbols:home-rounded" : "material-symbols:home-outline-rounded"} width="28px" height="28px" />
                <p>Home</p>
            </a>
        </li>
        <li>
            <a href="/search" class:selected={isActive('/search')}>
                <Icon icon="material-symbols:search" width="28px" height="28px" />
                <p>Search</p>
            </a>
        </li>
        <li>
            <a href={userAccount ? `/${userAccount.user.username}` : '#'} class:selected={userAccount && currentPath === `/${userAccount.user.username}`}>
                <Icon icon={userAccount && currentPath === `/${userAccount.user.username}` ? "material-symbols:account-circle" : "material-symbols:account-circle-outline"} width="28px" height="28px" />
                <p>Profile</p>
            </a>
        </li>
        <li>
            <a href="/settings" class:selected={isActive('/settings')}>
                <Icon icon={isActive('/settings') ? "material-symbols:settings" : "material-symbols:settings-outline-rounded"} width="28px" height="28px" />
                <p>Settings</p>
            </a>
        </li>
        <button class="postButton" on:click={togglePost} >
            <Icon icon="material-symbols:edit-square-outline-rounded" width="22px" height="22px" color="fff" />
            <p>Post</p>
        </button>
        <button class="postButton logout" on:click={logout}>
            <Icon icon="material-symbols:logout-rounded" width="20px" height="20px" color="fff" />
            <p>Log out</p>
        </button>
    </ul>
</nav>

<style>
    .postToast {
        position: fixed;
        inset: 0;
        z-index: 900;
        overflow: auto;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
    }

    .postToastContainer {
        overflow: hidden;
        max-height: 50%;
        box-shadow: 0 10px 40px var(--shadow-color);
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
        padding: 0.6rem 1.1rem;
        background: var(--white-smoke);
        border-radius: 999px;
        border: 0.1rem solid var(--background-elevated-press);
        color: var(--text-subdued);
        font-weight: 600;
        transition: background 0.2s;
    }

    .toastHead button:hover {
        background: var(--background-elevated-press);
    }

    .postSubmit {
        background: var(--essential-announcement) !important;
        color: #fff !important;
        border-color: var(--essential-announcement) !important;
    }

    .postSubmit:hover {
        opacity: 0.9;
        background: var(--essential-announcement) !important;
    }

    .postSubmit:disabled {
        opacity: 0.6;
        cursor: default;
    }

    .post {
        height: 100%;
        overflow: auto;
        display: flex;
        flex-direction: row;
        align-items: flex-start;
        gap: 0.6rem;
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
        min-height: 4rem;
        padding: 1rem;
        background: var(--background-elevated-highlight);
        border-radius: 1rem;
        border: none;
        outline: none;
        color: var(--text-base);
        font-size: 16px;
    }

    .footer {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
    }

    .addImage, .removeImage {
        cursor: pointer;
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 0.3rem;
        padding: 0.6rem 0.9rem;
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
    }

    .counter {
        font-size: 14px;
        font-weight: 600;
        color: var(--text-subdued);
    }

    .imageInput {
        padding: 1rem;
        background: var(--background-elevated-highlight);
        border: none;
        color: var(--text-base);
        border-radius: 1rem;
        outline: none;
    }

    .tabs {
        overflow: auto;
        overflow-x: hidden;
        height: 100%;
        max-height: 100vh;
        flex: 0 0 auto;
        width: 275px;
        padding-inline: 0.8rem;
        background: var(--background-elevated-base);
    }

    .profilePicture {
        min-width: 64px;
        border: 1px solid var(--white-smoke);
        border-radius: 50%;
        cursor: pointer;
        object-fit: cover;
        background: var(--background-elevated-highlight);
    }

    .brandLink {
        display: inline-block;
        text-decoration: none;
    }

    .tabs ul {
        padding-block: 1.2rem;
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
    }

    .tabs ul li a {
        padding: 0.8rem 1rem;
        cursor: pointer;
        display: flex;
        flex-direction: row;
        gap: 0.6rem;
        align-items: center;
        border-radius: 999px;
        transition: 0.2s background;
    }

    .tabs ul li a:hover {
        background: var(--background-highlight);
    }

    .tabs ul li a {
        text-decoration: none;
        color: var(--text-base);
        font-size: 18px;
        font-weight: 500;
    }

    .tabs ul li a.selected {
        font-weight: 800;
    }

    .postButton {
        cursor: pointer;
        background: var(--essential-announcement);
        margin-top: 0.8rem;
        padding: 0.9rem;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        gap: 0.4rem;
        border: none;
        border-radius: 999px;
        transition: 0.2s opacity;
    }

    .postButton:hover {
        opacity: 0.9;
    }

    .postButton * {
        color: #fff;
    }

    .postButton p {
        font-size: 16px;
        font-weight: 700;
    }

    .logout {
        background: transparent;
        border: 0.1rem solid var(--background-elevated-press);
    }

    .logout p, .logout :global(svg) {
        color: var(--essential-negative) !important;
    }

    .logout:hover {
        background: rgba(233, 20, 41, 0.08);
        opacity: 1;
    }

    @media (max-width: 1100px) {
        .tabs {
            width: 88px;
            padding-inline: 0.4rem;
        }

        .tabs ul {
            justify-content: center;
            align-items: center;
        }

        .tabs ul li a {
            width: 44px;
            justify-content: center;
        }

        .postButton {
            width: 44px;
            height: 44px;
        }

        .tabs ul li p {
            display: none;
        }

        .postButton p {
            display: none;
        }

        .brandLink img, .brandLink :global(span) {
            width: 44px !important;
            height: 44px !important;
            min-width: 44px !important;
        }
    }

    @media (max-width: 700px) {
        .postToastContainer {
            width: 90%;
            max-height: 70%;
        }

        .tabs {
            width: 64px;
        }
    }
</style>
