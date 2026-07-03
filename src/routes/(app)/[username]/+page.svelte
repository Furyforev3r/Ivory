<script lang="ts">
    import { goto } from "$app/navigation"
    import { browser } from "$app/environment"
    import { user } from "$lib/client/hooks/loginState"
    import { refreshAccount } from "$lib/client/hooks/accountState"
    import Icon from "@iconify/svelte"
    import { page } from "$app/stores"
    import axios from "axios"
    import { z } from "zod"
    import toast, { Toaster } from "svelte-french-toast"
    import Post from "$lib/components/+Post.svelte"
    import PostSkeleton from "$lib/components/+PostSkeleton.svelte"
    import Skeleton from "$lib/components/+Skeleton.svelte"
    import ImageCropModal from "$lib/components/+ImageCropModal.svelte"
    import { fade, scale } from "svelte/transition"

    let userInfo: any
    let username: string
    let userProfile: any
    let userProfileClone: any
    let canEdit = false
    let editing = false
    let saving = false
    let formErrors: any = {}
    let userPosts: any
    let loadedFor: string | null = null

    let avatarInput: HTMLInputElement
    let bannerInput: HTMLInputElement
    let cropFile: File | null = null
    let cropTarget: "avatar" | "banner" | null = null
    let uploadingAvatar = false
    let uploadingBanner = false

    $: username = $page.params.username
    $: userInfo = $user
    $: if (browser && username && username !== loadedFor) fetchUserData()

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
        loadedFor = username
        userProfile = null
        userProfileClone = null
        userPosts = null
        canEdit = false
        editing = false

        try {
            const response = await axios.get(`/api/getAccount/?username=${username}`)
            userProfile = response.data
            userProfileClone = structuredClone(userProfile)

            if (userInfo && userProfile.user.uid == userInfo.uid) {
                canEdit = true
            }

            let postsResponse = await axios.get(`api/getPostsByUserUID?userUID=${userProfile.user.uid}&limit=100`)

            if (postsResponse.status == 200 || postsResponse.status == 201) {
                userPosts = postsResponse.data
            } else {
                console.error(postsResponse.data.error)
            }
        } catch (error) {
            console.error(error)
        }
    }

    function toggleEditing() {
        if (!editing) {
            userProfileClone = structuredClone(userProfile)
            formErrors = {}
        }
        editing = !editing
    }

    function handleKeydown(event: KeyboardEvent) {
        if (event.key === "Escape" && editing && !cropFile) {
            toggleEditing()
        }
    }

    function openFilePicker(target: "avatar" | "banner") {
        if (target === "avatar") avatarInput.click()
        else bannerInput.click()
    }

    function handleFileSelected(event: Event, target: "avatar" | "banner") {
        const input = event.target as HTMLInputElement
        const file = input.files?.[0]
        if (file) {
            cropFile = file
            cropTarget = target
        }
        input.value = ""
    }

    async function handleCropped(event: CustomEvent<{ blob: Blob }>) {
        const target = cropTarget
        const blob = event.detail.blob
        cropFile = null
        cropTarget = null

        if (!target) return

        if (target === "avatar") uploadingAvatar = true
        else uploadingBanner = true

        try {
            const formData = new FormData()
            formData.append("image", blob, `${target}.jpg`)

            const response = await axios.post(
                `/api/uploadImage?token=${userInfo.accessToken}&uid=${userInfo.uid}&kind=${target}`,
                formData
            )

            if (target === "avatar") {
                userProfileClone.user.photoURL = response.data.url
            } else {
                userProfileClone.user.bannerURL = response.data.url
            }
        } catch (error) {
            toast.error("Failed to upload image")
        } finally {
            if (target === "avatar") uploadingAvatar = false
            else uploadingBanner = false
        }
    }

    function cancelCrop() {
        cropFile = null
        cropTarget = null
    }

    async function handleEditProfile(e: SubmitEvent) {
        e.preventDefault()

        const target = e.target as HTMLFormElement

        const formData = {
            bannerURL: userProfileClone.user.bannerURL,
            photoURL: userProfileClone.user.photoURL,
            username: (target.username as HTMLInputElement).value
                .replace(/[^\w\s]/gi, '')
                .replace(/\s+/g, '.')
                .substring(0, 15)
                .toLowerCase(),
            displayName: (target.displayName as HTMLInputElement).value,
            description: (target.description as HTMLTextAreaElement).value
        }

        const result = profileSchema.safeParse(formData)

        if (!result.success) {
            formErrors = result.error.format()
            toast.error("Form is invalid")
        } else {
            saving = true
            try {
                let response = await axios.put(`api/editAccount?token=${userInfo.accessToken}&uid=${userInfo.uid}`, result.data)

                if (response.status == 200) {
                    toast.success(response.data.message)
                    editing = false
                    await refreshAccount(userInfo.uid)
                    if (result.data.username !== username) {
                        await goto(`/${result.data.username}`)
                    } else {
                        loadedFor = null
                        await fetchUserData()
                    }
                } else {
                    toast.error(response.data.error)
                }
            } catch (error) {
                toast.error("An error occurred while updating the profile")
            } finally {
                saving = false
            }
        }
    }
</script>

<svelte:head>
    <title>Ivory - {username ? `@${username}` : ''}</title>
    <meta name="description" content="Ivory!" />
</svelte:head>

<svelte:window on:keydown={handleKeydown} />
<Toaster />

<input
    type="file"
    accept="image/png,image/jpeg,image/webp"
    bind:this={avatarInput}
    on:change={(e) => handleFileSelected(e, "avatar")}
    hidden
/>
<input
    type="file"
    accept="image/png,image/jpeg,image/webp"
    bind:this={bannerInput}
    on:change={(e) => handleFileSelected(e, "banner")}
    hidden
/>

{#if cropFile}
    <ImageCropModal
        file={cropFile}
        shape={cropTarget === "avatar" ? "circle" : "rect"}
        aspect={cropTarget === "avatar" ? 1 : 3}
        outputWidth={cropTarget === "avatar" ? 400 : 1500}
        outputHeight={cropTarget === "avatar" ? 400 : 500}
        title={cropTarget === "avatar" ? "Crop profile photo" : "Crop banner"}
        on:crop={handleCropped}
        on:cancel={cancelCrop}
    />
{/if}

{#if editing && userProfileClone}
    <div class="editProfile" transition:fade={{ duration: 150 }} on:click|self={toggleEditing} role="presentation">
        <form class="form" on:submit={handleEditProfile} transition:scale={{ duration: 150, start: 0.96 }}>
            <div class="formTitle">
                <h1>Edit profile</h1>
                <button type="button" on:click={toggleEditing} aria-label="Close">
                    <Icon icon="charm:cross" width="26" height="26" />
                </button>
            </div>

            <div class="editPreview">
                <button type="button" class="bannerEditButton" on:click={() => openFilePicker("banner")}>
                    <img src={userProfileClone.user.bannerURL} alt="Banner preview" class="editBanner" />
                    <div class="editOverlay">
                        {#if uploadingBanner}
                            <Icon icon="svg-spinners:3-dots-move" width="24" height="24" color="#fff" />
                        {:else}
                            <Icon icon="material-symbols:add-a-photo-outline-rounded" width="24" height="24" color="#fff" />
                        {/if}
                    </div>
                </button>
                <button type="button" class="avatarEditButton" on:click={() => openFilePicker("avatar")}>
                    <img src={userProfileClone.user.photoURL} alt="Avatar preview" class="editAvatar" />
                    <div class="editOverlay editOverlayCircle">
                        {#if uploadingAvatar}
                            <Icon icon="svg-spinners:3-dots-move" width="20" height="20" color="#fff" />
                        {:else}
                            <Icon icon="material-symbols:add-a-photo-outline-rounded" width="20" height="20" color="#fff" />
                        {/if}
                    </div>
                </button>
            </div>
            {#if formErrors.bannerURL || formErrors.photoURL}
                <span class="error">{formErrors.bannerURL?._errors[0] || formErrors.photoURL?._errors[0]}</span>
            {/if}

            <label for="username">Username</label>
            <input id="username" name="username" placeholder="Username..." type="text" bind:value={userProfileClone.user.username} />
            {#if formErrors.username}
                <span class="error">{formErrors.username._errors[0]}</span>
            {/if}

            <label for="displayName">Display name</label>
            <input id="displayName" name="displayName" placeholder="Display Name..." type="text" bind:value={userProfileClone.user.displayName} />
            {#if formErrors.displayName}
                <span class="error">{formErrors.displayName._errors[0]}</span>
            {/if}

            <label for="description">Bio</label>
            <textarea id="description" name="description" placeholder="Description..." maxlength="160" bind:value={userProfileClone.user.description}></textarea>
            {#if formErrors.description}
                <span class="error">{formErrors.description._errors[0]}</span>
            {/if}

            <input class="submit" type="submit" value={saving ? "Saving..." : "Save"} disabled={saving} />
        </form>
    </div>
{/if}

<div class="content">
    {#if !userProfile}
        <Skeleton width="100%" height="150px" radius="0" />
        <div class="profile">
            <div class="topInfo">
                <Skeleton circle width="100px" height="100px" />
            </div>
            <Skeleton width="40%" height="22px" />
            <Skeleton width="25%" height="16px" />
        </div>
    {:else}
        <img src={userProfile.user.bannerURL} alt={`${userProfile.user.displayName}'s banner`} class="banner">
        <div class="profile">
            <div class="topInfo">
                <a href={userProfile.user.photoURL} target="_blank" rel="noreferrer">
                    <img src={userProfile.user.photoURL} alt={userProfile.user.displayName} />
                </a>
                <div class="profileButtons">
                    {#if canEdit}
                        <button on:click={toggleEditing}>Edit profile</button>
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
            </div>
            <div class="posts">
                {#if !userPosts}
                    {#each Array(3) as _}
                        <PostSkeleton />
                    {/each}
                {:else}
                    {#each userPosts.posts.posts as post (post.id)}
                        <Post post={post}/>
                    {/each}
                {/if}
            </div>
        </div>
    {/if}
</div>

<style>
    .content {
        flex-grow: 1;
        overflow: auto;
        border-inline: 1px solid var(--gainsboro);
    }

    .content::-webkit-scrollbar {
        width: 10px;
        background-color: var(--background-elevated-highlight);
    }

    .content::-webkit-scrollbar-thumb {
        background: var(--background-elevated-press);
        border-radius: 0.8rem;
    }

    .banner {
        width: 100%;
        overflow: hidden;
        height: 150px;
        object-fit: cover;
        background: var(--background-elevated-highlight);
        border-bottom: 1px solid var(--gainsboro);
    }

    .form {
        display: flex;
        flex-direction: column;
        width: 60%;
        max-width: 480px;
        max-height: 85vh;
        overflow-y: auto;
        background: var(--background-base);
        padding: 1.2rem;
        border-radius: 1rem;
        gap: 0.5rem;
        box-shadow: 0 10px 40px var(--shadow-color);
    }

    .formTitle {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
    }

    .formTitle h1 {
        font-size: 20px;
        font-weight: 800;
    }

    .formTitle button {
        cursor: pointer;
        border: none;
        background: none;
        color: var(--text-base);
        display: grid;
        place-items: center;
        padding: 0.3rem;
        border-radius: 999px;
        transition: background 0.2s;
    }

    .formTitle button:hover {
        background: var(--background-highlight);
    }

    .editProfile {
        position: fixed;
        inset: 0;
        z-index: 900;
        overflow: auto;
        display: grid;
        place-items: center;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
    }

    .editPreview {
        position: relative;
        margin-bottom: 2.5rem;
    }

    .bannerEditButton {
        cursor: pointer;
        border: none;
        padding: 0;
        display: block;
        width: 100%;
        position: relative;
        border-radius: 0.6rem;
        overflow: hidden;
    }

    .editBanner {
        width: 100%;
        height: 120px;
        object-fit: cover;
        display: block;
        background: var(--background-elevated-highlight);
    }

    .avatarEditButton {
        cursor: pointer;
        border: 3px solid var(--background-base);
        border-radius: 50%;
        padding: 0;
        position: absolute;
        left: 1rem;
        bottom: -2rem;
        overflow: hidden;
        width: 76px;
        height: 76px;
    }

    .editAvatar {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
        background: var(--background-elevated-highlight);
    }

    .editOverlay {
        position: absolute;
        inset: 0;
        display: grid;
        place-items: center;
        background: rgba(0, 0, 0, 0.35);
        opacity: 0;
        transition: opacity 0.2s;
    }

    .bannerEditButton:hover .editOverlay,
    .avatarEditButton:hover .editOverlay,
    .editOverlayCircle {
        opacity: 1;
    }

    .form input[type="text"], .form textarea {
        padding: 0.9rem;
        background: var(--background-elevated-highlight);
        color: var(--text-base);
        border-radius: 0.8rem;
    }

    .form input, .form textarea {
        border: none;
        outline: none;
    }

    .form label {
        font-size: 13px;
        font-weight: 700;
        color: var(--text-subdued);
        margin-top: 0.3rem;
    }

    .error {
        color: var(--essential-negative);
        font-size: 0.875rem;
    }

    .submit {
        cursor: pointer;
        margin-top: 0.6rem;
        padding: 0.9rem;
        background: var(--text-base);
        border: none;
        color: var(--background-base);
        font-weight: 700;
        border-radius: 999px;
        transition: opacity 0.2s;
    }

    .submit:hover {
        opacity: 0.85;
    }

    .submit:disabled {
        opacity: 0.6;
        cursor: default;
    }

    .profile {
        display: flex;
        flex-direction: column;
        padding: 1rem;
        gap: 0.4rem;
    }

    .profile img {
        cursor: pointer;
        height: 100px;
        width: 100px;
        object-fit: cover;
        border-radius: 50%;
        border: 4px solid var(--background-base);
        background: var(--background-elevated-highlight);
        margin-top: -50px;
    }

    .topInfo {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
    }

    .profileButtons {
        display: flex;
        flex-direction: row;
        gap: 0.5rem;
    }

    .profileButtons button {
        cursor: pointer;
        padding: 0.7rem 1.1rem;
        background: var(--background-base);
        border-radius: 999px;
        border: 0.1rem solid var(--background-elevated-press);
        color: var(--text-base);
        font-weight: 700;
        transition: background 0.2s;
    }

    .profileButtons button:hover {
        background: var(--background-highlight);
    }

    .profile h2 {
        font-size: 20px;
        font-weight: 800;
    }

    .username {
        color: var(--text-subdued);
    }

    .profileInfo {
        display: flex;
        flex-direction: row;
        gap: 1rem;
        margin-block: 0.3rem;
    }

    .profileInfo a, .profileInfo p {
        color: var(--text-subdued);
        text-decoration: none;
    }

    .profileInfo span {
        font-weight: 700;
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
        border-bottom: 1px solid var(--gainsboro);
    }

    .contentButton, .selected {
        padding: 1rem;
        cursor: pointer;
        background: none;
        border: none;
        font-weight: 600;
        font-size: 16px;
        color: var(--text-subdued);
        transition: 0.2s background;
    }

    .contentButton:hover, .selected:hover {
        background: var(--background-highlight);
    }

    .selected {
        color: var(--text-base);
        font-weight: 800;
        border-bottom: 0.2rem solid var(--essential-announcement);
    }

    @media (max-width: 800px) {
        .form {
            width: 90%;
        }

        .profile {
            padding: 0.6rem;
        }

        .profile h2 {
            font-size: 18px;
        }

        .profileInfo a , .profileInfo p, .profileDescription p, .contentButton {
            font-size: 14px;
        }
    }
</style>
