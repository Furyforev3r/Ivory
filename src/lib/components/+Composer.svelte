<script lang="ts">
    import axios from "axios"
    import { createEventDispatcher } from "svelte"
    import { user } from "$lib/client/hooks/loginState"
    import { account } from "$lib/client/hooks/accountState"
    import Icon from "@iconify/svelte"
    import autosize from "svelte-autosize"
    import { z } from "zod"
    import toast from "svelte-french-toast"
    import Skeleton from "./+Skeleton.svelte"
    import ImageCropModal from "./+ImageCropModal.svelte"

    export let variant: "modal" | "inline" = "inline"
    export let autofocus = false

    const dispatch = createEventDispatcher()

    function focusIfNeeded(node: HTMLTextAreaElement) {
        if (autofocus) node.focus()
    }

    let userInfo: any
    let userAccount: any

    $: userInfo = $user
    $: userAccount = $account

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

    export async function validateAndPost() {
        const validationResult = postSchema.safeParse({ postValue })

        if (!validationResult.success) {
            errorMessage = validationResult.error.errors[0]?.message
        } else if (uploadingMedia) {
            errorMessage = "Wait for the media upload to finish"
        } else {
            posting = true
            try {
                let response = await axios.post(`/api/newPost?token=${userInfo.accessToken}`, {
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
                    dispatch("posted", { post: response.data.post })
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

<div class="composer" class:inline={variant === "inline"}>
    <div class="post">
        {#if userAccount}
            <img
                src={userAccount.user.photoURL}
                width="48px"
                height="48px"
                class="profilePicture"
                alt="Your avatar"
            />
        {:else}
            <Skeleton circle width="48px" height="48px" />
        {/if}
        <div class="postBody">
            <textarea
                use:autosize
                use:focusIfNeeded
                maxlength="300"
                placeholder="What's happening?"
                bind:value={postValue}
            ></textarea>

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
                </button>
                {#if errorMessage}
                    <p class="error">{errorMessage}</p>
                {/if}
                <div class="footerRight">
                    <p class="counter">{-postValue.length + 300}</p>
                    <button class="postSubmit" on:click={validateAndPost} disabled={posting || !postValue.trim()}>
                        {posting ? "Posting..." : "Post"}
                    </button>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
    .composer {
        display: flex;
        flex-direction: column;
    }

    .post {
        display: flex;
        flex-direction: row;
        align-items: flex-start;
        gap: 0.7rem;
    }

    .profilePicture {
        min-width: 48px;
        border: 1px solid var(--white-smoke);
        border-radius: 50%;
        object-fit: cover;
        overflow: hidden;
        background: var(--background-elevated-highlight);
    }

    .postBody {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
    }

    textarea {
        width: 100%;
        min-height: 3rem;
        padding: 0.6rem 0;
        background: transparent;
        border: none;
        outline: none;
        color: var(--text-base);
        font-size: 18px;
        font-family: inherit;
        resize: none;
    }

    .mediaPreview {
        position: relative;
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

    .footer {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        gap: 0.8rem;
        padding-top: 0.6rem;
        border-top: 1px solid var(--gainsboro);
    }

    .footerRight {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 0.8rem;
    }

    .addImage {
        cursor: pointer;
        display: grid;
        place-items: center;
        width: 34px;
        height: 34px;
        border-radius: 50%;
        border: none;
        color: var(--essential-announcement);
        background: transparent;
        transition: background 0.2s, opacity 0.2s;
    }

    .addImage:hover:not(:disabled) {
        background: color-mix(in srgb, var(--essential-announcement) 12%, transparent);
    }

    .addImage:disabled {
        opacity: 0.4;
        cursor: default;
    }

    .error {
        color: var(--essential-negative);
        font-size: 13px;
        flex: 1;
    }

    .counter {
        font-size: 13px;
        font-weight: 600;
        color: var(--text-subdued);
    }

    .postSubmit {
        cursor: pointer;
        padding: 0.5rem 1.1rem;
        background: var(--essential-announcement);
        color: #fff;
        border: none;
        border-radius: 999px;
        font-weight: 700;
        font-size: 14px;
        transition: opacity 0.2s;
    }

    .postSubmit:hover:not(:disabled) {
        opacity: 0.9;
    }

    .postSubmit:disabled {
        opacity: 0.5;
        cursor: default;
    }

    .composer.inline {
        padding: 1rem;
        border-bottom: 1px solid var(--gainsboro);
    }
</style>
