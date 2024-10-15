<script lang="ts">
    import Icon from "@iconify/svelte"
    import { onMount } from "svelte"
    import axios from "axios"
    import { formatDistanceToNow } from "date-fns"
    import { ptBR } from "date-fns/locale"
    
    export let post

    let user

    onMount(async () => {
        try {
            const response = await axios.get(`/api/getSimpleUser?uid=${post.userUID}`)

            if (response.status === 200) {
                user = response.data.user
            }
        } catch (error) {
            console.error(error)
        }
    })


    function formatTimestamp(uploadDate) {
        const dataUpload = new Date(uploadDate._seconds * 1000 + uploadDate._nanoseconds / 1000000)

        return formatDistanceToNow(dataUpload, { locale: ptBR, addSuffix: true })
    }
</script>

<div class="postContainer">
    {#if user && post}
        <a href={`/${user.username}`}>
            <img class="userPic" alt={user.displayName} src={user.photoURL} width="52px" height="52px" />
        </a>
        <div class="postContentContainer">
            <div class="postInfo">
                <p class="displayName">{user.displayName}</p>
                <p class="username">@{user.username}</p>
                <span class="username">·</span>
                <p class="username">{formatTimestamp(post.uploadDate)}</p>
            </div>
            <div class="postContent">
                <p class="content">{post.content}</p>
                {#if post.image}
                    <img class="postImage" src={post.imageURL} alt="...">
                {/if}
            </div>
            <div class="postIcons">
                <div class="icon">
                    <Icon icon="bx:comment" width="20px" height="20px" color="#6b6b6b" />
                </div>
                <div class="icon">
                    <Icon icon="mdi:repost" width="20px" height="20px" color="#6b6b6b" />
                </div>
                <div class="icon">
                    <Icon icon="mdi:heart-outline" width="20px" height="20px" color="#6b6b6b" />
                </div>
                <div class="icon">
                    <Icon icon="ri:more-fill" width="20px" height="20px" color="#6b6b6b" />
                </div>
            </div>
        </div>
    {/if}
</div>

<style>
    .postContainer {
        cursor: pointer;
        display: flex;
        flex-direction: row;
        gap: 0.8rem;
        padding: 1rem;
        border-block: 1px solid var(--gainsboro);
        flex-grow: 1;
        transition: 0.8s background;
    }

    .postContainer:hover {
        background: var(--background-highlight);
    }

    .userPic {
        min-width: 52px;
        border-radius: 50%;
        object-fit: cover;
        border: 1px solid var(--gainsboro);
    }

    .postContentContainer {
        display: flex;
        flex-direction: column;
        gap: 0.1rem;
    }

    .postInfo {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 0.3rem;
    }

    .displayName {
        font-weight: 600;
    }

    .username {
        color: var(--text-subdued);
        font-size: 16px;
    }

    .postContent {
        padding: 0.3rem;
    }

    .content {
        word-break: break-word;
        max-width: 80%;
    }

    .postImage {
        margin-top: 0.3rem;
        object-fit: cover;
        max-height: 400px;
        min-width: 50%;
        max-width: 100%;
    }

    .postIcons {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 1rem;
    }

    .icon {
        border-radius: 50%;
        padding: 0.3rem;
        cursor: pointer;
        display: grid;
        place-items: center;
    }

    .icon:hover {
        background: var(--background-press);
    }

    @media (max-width: 800px) {
        .postContainer {
            width: 100%;
        }

        .postInfo {
            flex-direction: column;
            gap: 0.1rem;
            align-items: start;
        }

        .displayName {
            font-size: 14px;
        }

        .username {
            font-size: 14px;
        }

        .postInfo span {
            display: none;
        }
    }
</style>