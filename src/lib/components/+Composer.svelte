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

    let textareaEl: HTMLTextAreaElement
    let emojiWrapEl: HTMLDivElement
    let audienceWrapEl: HTMLDivElement

    function focusIfNeeded(node: HTMLTextAreaElement) {
        textareaEl = node
        if (autofocus) node.focus()
    }

    function handleWindowClick(event: MouseEvent) {
        if (showEmojiPicker && emojiWrapEl && !emojiWrapEl.contains(event.target as Node)) {
            showEmojiPicker = false
        }
        if (showAudienceMenu && audienceWrapEl && !audienceWrapEl.contains(event.target as Node)) {
            showAudienceMenu = false
        }
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

    const EMOJIS = [
        "😀", "😂", "🥹", "😍", "😎", "🤔", "😴", "😭", "😡", "🥳",
        "👍", "👎", "👏", "🙌", "🙏", "💪", "🤝", "✌️", "🤞", "👀",
        "❤️", "🔥", "✨", "🎉", "💯", "😢", "😅", "🤯", "🥰", "😏",
        "🚀", "⭐", "🌟", "☀️", "🌙", "⚡", "🎶", "📸", "🐶", "🐱"
    ]

    let showEmojiPicker = false

    function toggleEmojiPicker() {
        showEmojiPicker = !showEmojiPicker
    }

    function insertEmoji(emoji: string) {
        const start = textareaEl?.selectionStart ?? postValue.length
        const end = textareaEl?.selectionEnd ?? postValue.length
        postValue = postValue.slice(0, start) + emoji + postValue.slice(end)
        showEmojiPicker = false
        requestAnimationFrame(() => {
            if (!textareaEl) return
            const cursor = start + emoji.length
            textareaEl.focus()
            textareaEl.setSelectionRange(cursor, cursor)
        })
    }

    let showPollComposer = false
    let pollOptions = ["", ""]
    let pollDurationHours = 24

    const POLL_DURATIONS = [
        { label: "1 day", hours: 24 },
        { label: "3 days", hours: 72 },
        { label: "7 days", hours: 168 },
    ]

    function togglePoll() {
        if (mediaPreviewURL) return
        showPollComposer = !showPollComposer
    }

    function addPollOption() {
        if (pollOptions.length < 4) pollOptions = [...pollOptions, ""]
    }

    function removePollOption(index: number) {
        if (pollOptions.length > 2) pollOptions = pollOptions.filter((_, i) => i !== index)
    }

    function cancelPoll() {
        showPollComposer = false
        pollOptions = ["", ""]
        pollDurationHours = 24
    }

    const AUDIENCE_OPTIONS = [
        { value: "everyone", label: "Everyone", icon: "material-symbols:public" },
        { value: "following", label: "People you follow", icon: "material-symbols:group-outline-rounded" },
        { value: "mentioned", label: "Only people you mention", icon: "material-symbols:alternate-email" },
    ] as const

    let replyAudience: "everyone" | "following" | "mentioned" = "everyone"
    let showAudienceMenu = false

    function toggleAudienceMenu() {
        showAudienceMenu = !showAudienceMenu
    }

    function selectAudience(value: "everyone" | "following" | "mentioned") {
        replyAudience = value
        showAudienceMenu = false
    }

    $: currentAudience = AUDIENCE_OPTIONS.find(option => option.value === replyAudience)!

    export async function validateAndPost() {
        const validationResult = postSchema.safeParse({ postValue })

        if (!validationResult.success) {
            errorMessage = validationResult.error.errors[0]?.message
        } else if (uploadingMedia) {
            errorMessage = "Wait for the media upload to finish"
        } else if (showPollComposer && pollOptions.filter(option => option.trim()).length < 2) {
            errorMessage = "A poll needs at least 2 options"
        } else {
            posting = true
            try {
                let response = await axios.post(`/api/newPost?token=${userInfo.accessToken}`, {
                    'userUID': userInfo.uid,
                    'content': postValue,
                    'image': !!uploadedMediaURL,
                    'imageURL': uploadedMediaURL,
                    'mediaType': mediaType,
                    'replyAudience': replyAudience,
                    'poll': showPollComposer ? {
                        options: pollOptions.map(option => option.trim()).filter(Boolean),
                        durationHours: pollDurationHours
                    } : null
                })

                if (response.status == 200 || response.status == 201) {
                    toast.success(response.data.message)
                    errorMessage = ''
                    postValue = ''
                    removeMedia()
                    cancelPoll()
                    replyAudience = "everyone"
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

<svelte:window on:click={handleWindowClick} />

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
                placeholder="Qual a bang perfeitinha de hoje?"
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

            {#if showPollComposer}
                <div class="pollComposer">
                    {#each pollOptions as option, index}
                        <div class="pollOptionRow">
                            <input
                                type="text"
                                placeholder="Option {index + 1}"
                                maxlength="25"
                                bind:value={pollOptions[index]}
                            />
                            {#if pollOptions.length > 2}
                                <button type="button" on:click={() => removePollOption(index)} aria-label="Remove option">
                                    <Icon icon="material-symbols:close-rounded" width="16" height="16" />
                                </button>
                            {/if}
                        </div>
                    {/each}
                    <div class="pollFooter">
                        {#if pollOptions.length < 4}
                            <button type="button" class="addOption" on:click={addPollOption}>+ Add option</button>
                        {/if}
                        <select bind:value={pollDurationHours}>
                            {#each POLL_DURATIONS as duration}
                                <option value={duration.hours}>{duration.label}</option>
                            {/each}
                        </select>
                        <button type="button" class="removePoll" on:click={cancelPoll} aria-label="Remove poll">
                            <Icon icon="material-symbols:delete-outline-rounded" width="16" height="16" />
                        </button>
                    </div>
                </div>
            {/if}

            <div class="audienceRow">
                <div class="audienceWrap" bind:this={audienceWrapEl}>
                    <button type="button" class="audiencePill" on:click={toggleAudienceMenu}>
                        <Icon icon={currentAudience.icon} width="14" height="14" />
                        {currentAudience.label} can reply
                    </button>
                    {#if showAudienceMenu}
                        <div class="audienceMenu" role="menu">
                            {#each AUDIENCE_OPTIONS as option}
                                <button type="button" class:selected={option.value === replyAudience} on:click={() => selectAudience(option.value)}>
                                    <Icon icon={option.icon} width="18" height="18" />
                                    {option.label}
                                    {#if option.value === replyAudience}
                                        <Icon icon="material-symbols:check-rounded" width="16" height="16" class="checkIcon" />
                                    {/if}
                                </button>
                            {/each}
                        </div>
                    {/if}
                </div>
            </div>

            <div class="footer">
                <div class="footerLeft">
                    <button type="button" class="addImage" on:click={openMediaPicker} disabled={!!mediaPreviewURL || showPollComposer}>
                        <Icon icon="material-symbols:image-outline" width="18" height="18" />
                    </button>
                    <button type="button" class="addImage" on:click={togglePoll} disabled={!!mediaPreviewURL} aria-label="Add poll">
                        <Icon icon="material-symbols:poll-outline" width="18" height="18" />
                    </button>
                    <div class="emojiWrap" bind:this={emojiWrapEl}>
                        <button type="button" class="addImage" on:click={toggleEmojiPicker} aria-label="Add emoji">
                            <Icon icon="material-symbols:mood-outline" width="18" height="18" />
                        </button>
                        {#if showEmojiPicker}
                            <div class="emojiPicker">
                                {#each EMOJIS as emoji}
                                    <button type="button" on:click={() => insertEmoji(emoji)}>{emoji}</button>
                                {/each}
                            </div>
                        {/if}
                    </div>
                </div>
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
        min-height: 1.6rem;
        padding: 0.4rem 0;
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

    .pollComposer {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        padding: 0.8rem;
        border: 1px solid var(--gainsboro);
        border-radius: 0.8rem;
    }

    .pollOptionRow {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 0.5rem;
    }

    .pollOptionRow input {
        flex: 1;
        padding: 0.6rem 0.8rem;
        background: var(--background-elevated-highlight);
        border: none;
        outline: none;
        border-radius: 0.6rem;
        color: var(--text-base);
        font-size: 14px;
    }

    .pollOptionRow button {
        cursor: pointer;
        display: grid;
        place-items: center;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        border: none;
        background: transparent;
        color: var(--text-subdued);
    }

    .pollOptionRow button:hover {
        background: var(--background-highlight);
    }

    .pollFooter {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 0.6rem;
    }

    .addOption {
        cursor: pointer;
        border: none;
        background: none;
        color: var(--essential-announcement);
        font-weight: 600;
        font-size: 13px;
    }

    .pollFooter select {
        margin-left: auto;
        padding: 0.4rem 0.6rem;
        border-radius: 0.6rem;
        border: 1px solid var(--gainsboro);
        background: var(--background-base);
        color: var(--text-base);
        font-size: 13px;
    }

    .removePoll {
        cursor: pointer;
        display: grid;
        place-items: center;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        border: none;
        background: transparent;
        color: var(--essential-negative);
    }

    .removePoll:hover {
        background: rgba(244, 33, 46, 0.08);
    }

    .audienceRow {
        display: flex;
    }

    .audienceWrap {
        position: relative;
    }

    .audiencePill {
        cursor: pointer;
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 0.4rem;
        padding: 0.4rem 0.8rem;
        border-radius: 999px;
        border: none;
        background: color-mix(in srgb, var(--essential-announcement) 12%, transparent);
        color: var(--essential-announcement);
        font-weight: 600;
        font-size: 12px;
    }

    .audienceMenu {
        position: absolute;
        top: 100%;
        left: 0;
        margin-top: 0.4rem;
        min-width: 240px;
        background: var(--background-base);
        border: 1px solid var(--gainsboro);
        border-radius: 0.8rem;
        box-shadow: 0 10px 30px var(--shadow-color);
        overflow: hidden;
        z-index: 50;
    }

    .audienceMenu button {
        cursor: pointer;
        width: 100%;
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 0.6rem;
        padding: 0.8rem 1rem;
        border: none;
        background: none;
        color: var(--text-base);
        font-size: 14px;
        font-weight: 600;
        text-align: left;
    }

    .audienceMenu button:hover {
        background: var(--background-highlight);
    }

    .audienceMenu button.selected {
        color: var(--essential-announcement);
    }

    .audienceMenu :global(.checkIcon) {
        margin-left: auto;
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

    .footerLeft {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 0.2rem;
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

    .emojiWrap {
        position: relative;
    }

    .emojiPicker {
        position: absolute;
        top: 100%;
        left: 0;
        margin-top: 0.4rem;
        display: grid;
        grid-template-columns: repeat(8, 1fr);
        gap: 0.2rem;
        width: 260px;
        max-height: 200px;
        overflow-y: auto;
        padding: 0.6rem;
        background: var(--background-base);
        border: 1px solid var(--gainsboro);
        border-radius: 0.8rem;
        box-shadow: 0 10px 30px var(--shadow-color);
        z-index: 50;
    }

    .emojiPicker button {
        cursor: pointer;
        display: grid;
        place-items: center;
        width: 28px;
        height: 28px;
        border-radius: 0.4rem;
        border: none;
        background: transparent;
        font-size: 18px;
        transition: background 0.2s;
    }

    .emojiPicker button:hover {
        background: var(--background-highlight);
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
