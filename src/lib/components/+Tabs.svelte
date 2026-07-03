<script lang="ts">
    import axios from "axios"
    import { user } from "$lib/client/hooks/loginState"
    import { account, ensureAccount } from "$lib/client/hooks/accountState"
    import Icon from "@iconify/svelte"
    import { logout } from "$lib/client/utils/firebaseUtils"
    import autosize from "svelte-autosize"
    import { z } from "zod"
    import toast from "svelte-french-toast"
    import { page } from "$app/stores"
    import Skeleton from "./+Skeleton.svelte"
    import { fade, scale } from "svelte/transition"
    import { unreadCount, ensureNotifications } from "$lib/client/hooks/notificationsState"
    import ImageCropModal from "./+ImageCropModal.svelte"

    let userInfo: any
    let userAccount

    $: userInfo = $user
    $: userAccount = $account
    $: if (userInfo && userInfo !== "Loading...") ensureAccount(userInfo.uid)
    $: if (userInfo && userInfo !== "Loading...") ensureNotifications(userInfo.uid, userInfo.accessToken)
    $: currentPath = $page.url.pathname

    let post = false

    let postValue = ""
    let mediaInput: HTMLInputElement
    let cropFile: File | null = null
    let uploadedMediaURL = ""
    let mediaType: "gif" | "video" | null = null
    let mediaPreviewURL = ""
    let uploadingMedia = false

    let errorMessage = ""
    let posting = false

    const postSchema = z.object({
        postValue: z.string().min(1, "Post cannot be empty").max(300, "Post cannot exceed 300 characters"),
    })

    function togglePost() {
        post = !post
        errorMessage = ""
    }

    function handleKeydown(event: KeyboardEvent) {
        if (event.key === "Escape" && post && !cropFile) {
            togglePost()
        }
    }

    function isActive(path: string) {
        return path === "/" ? currentPath === "/" : currentPath.startsWith(path)
    }

    function openMediaPicker() {
        mediaInput.click()
    }

    function handleMediaSelected(event: Event) {
        const input = event.target as HTMLInputElement
        const file = input.files?.[0]
        input.value = ""

        if (!file) return

        if (file.type === "image/gif") {
            uploadMedia(file, "gif")
        } else if (file.type.startsWith("video/")) {
            if (file.size > 4 * 1024 * 1024) {
                toast.error("Video must be 4MB or smaller")
                return
            }
            uploadMedia(file, "video")
        } else if (file.type.startsWith("image/")) {
            cropFile = file
        } else {
            toast.error("Unsupported file type")
        }
    }

    async function handleCropped(event: CustomEvent<{ blob: Blob }>) {
        cropFile = null
        await uploadMedia(event.detail.blob, null)
    }

    async function uploadMedia(fileOrBlob: File | Blob, type: "gif" | "video" | null) {
        uploadingMedia = true
        mediaPreviewURL = URL.createObjectURL(fileOrBlob)
        mediaType = type

        try {
            const formData = new FormData()
            formData.append("image", fileOrBlob, `post.${type === "video" ? "mp4" : type === "gif" ? "gif" : "jpg"}`)

            const response = await axios.post(
                `/api/uploadImage?token=${userInfo.accessToken}&uid=${userInfo.uid}&kind=post`,
                formData
            )

            uploadedMediaURL = response.data.url
        } catch (error) {
            toast.error("Could not upload media")
            removeMedia()
        } finally {
            uploadingMedia = false
        }
    }

    function removeMedia() {
        if (mediaPreviewURL) URL.revokeObjectURL(mediaPreviewURL)
        mediaPreviewURL = ""
        uploadedMediaURL = ""
        mediaType = null
    }

    function cancelCrop() {
        cropFile = null
    }

    async function validateAndPost() {
        const validationResult = postSchema.safeParse({ postValue })

        if (!validationResult.success) {
            errorMessage = validationResult.error.errors[0]?.message
        } else if (uploadingMedia) {
            errorMessage = "Wait for the media upload to finish"
        } else {
            posting = true
            try {
                let response = await axios.post(`api/newPost?token=${userInfo.accessToken}`, {
                    'userUID': userInfo.uid,
                    'content': postValue,
                    'image': !!uploadedMediaURL,
                    'imageURL': uploadedMediaURL,
                    'mediaType': mediaType
                })

                if (response.status == 200 || response.status == 201) {
                    toast.success(response.data.message)
                    errorMessage = ''
                    postValue = ''
                    removeMedia()
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
                {#if mediaPreviewURL}
                    <div class="mediaPreview">
                        {#if mediaType === "video"}
                            <video src={mediaPreviewURL} controls></video>
                        {:else}
                            <img src={mediaPreviewURL} alt="Selected media" />
                        {/if}
                        {#if uploadingMedia}
                            <div class="mediaOverlay">
                                <Icon icon="svg-spinners:3-dots-move" width="28" height="28" color="#fff" />
                            </div>
                        {/if}
                        <button type="button" class="removeMediaButton" on:click={removeMedia} aria-label="Remove media">
                            <Icon icon="material-symbols:close-rounded" width="18" height="18" />
                        </button>
                    </div>
                {/if}
                <div class="footer">
                    <button type="button" class="addImage" on:click={openMediaPicker} disabled={!!mediaPreviewURL}>
                        <Icon icon="material-symbols:image-outline" width="18" height="18" />
                        Add media
                    </button>
                    {#if errorMessage}
                        <p class="error">{errorMessage}</p>
                    {/if}
                    <p class="counter">{-postValue.length + 300}</p>
                </div>
            </div>
        </div>
    {/if}

    <input
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
        bind:this={mediaInput}
        on:change={handleMediaSelected}
        hidden
    />

    {#if cropFile}
        <ImageCropModal
            file={cropFile}
            shape="rect"
            aspect={16 / 9}
            outputWidth={1200}
            outputHeight={675}
            title="Crop image"
            on:crop={handleCropped}
            on:cancel={cancelCrop}
        />
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
            <a href="/notifications" class="notificationsLink" class:selected={isActive('/notifications')}>
                <span class="iconWithBadge">
                    <Icon icon={isActive('/notifications') ? "material-symbols:notifications-rounded" : "material-symbols:notifications-outline-rounded"} width="28px" height="28px" />
                    {#if $unreadCount > 0}
                        <span class="badge">{$unreadCount > 9 ? '9+' : $unreadCount}</span>
                    {/if}
                </span>
                <p>Notifications</p>
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

    .addImage {
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
        background: var(--essential-announcement);
        transition: opacity 0.3s;
    }

    .addImage:disabled {
        opacity: 0.5;
        cursor: default;
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

    .mediaPreview {
        position: relative;
        margin-top: 0.5rem;
        border-radius: 0.8rem;
        overflow: hidden;
        max-height: 260px;
        background: #0a0a0a;
    }

    .mediaPreview img, .mediaPreview video {
        width: 100%;
        max-height: 260px;
        object-fit: cover;
        display: block;
    }

    .mediaOverlay {
        position: absolute;
        inset: 0;
        display: grid;
        place-items: center;
        background: rgba(0, 0, 0, 0.4);
    }

    .removeMediaButton {
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        cursor: pointer;
        display: grid;
        place-items: center;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: none;
        background: rgba(0, 0, 0, 0.6);
        color: #fff;
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
        overflow: hidden;
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

    .iconWithBadge {
        position: relative;
        display: inline-flex;
    }

    .badge {
        position: absolute;
        top: -6px;
        right: -8px;
        min-width: 16px;
        height: 16px;
        padding: 0 3px;
        border-radius: 999px;
        background: var(--essential-negative);
        color: #fff;
        font-size: 10px;
        font-weight: 700;
        line-height: 16px;
        text-align: center;
    }

    @media (max-width: 1100px) {
        .badge {
            top: -2px;
            right: -2px;
        }
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
