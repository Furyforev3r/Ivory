<script lang="ts">
    import { goto } from "$app/navigation"
    import { user } from "$lib/client/hooks/loginState"
    import { afterUpdate } from "svelte"
    import Icon from "@iconify/svelte"
    import Tabs from "$lib/components/+Tabs.svelte"
    import Discover from "$lib/components/+Discover.svelte"
    import { page } from "$app/stores"
    import toast, { Toaster } from "svelte-french-toast"
    import Post from "$lib/components/+Post.svelte"
    import axios from "axios"
    
    let userInfo
    let postUID
    let post
    
    $: postUID = $page.params.postUID
    $: userInfo = $user

    afterUpdate(async () => {
        if (!userInfo) {
            goto("/login")
        }

        if (!post && postUID) {
            try {
                let response = await axios.get(`/api/getPostByUID?uid=${postUID}`)

                if (response.status == 200) {
                    post = response.data.post
                } else {
                    console.error(response.data.error)
                }          
            } catch (error) {
                console.error(error)
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
    {:else if userInfo && post}
        <Toaster />
        <Tabs userUID={userInfo.uid} />
        <div class="content">
             <div class="header">
                <h2>Ivory.</h2>
            </div>
            <Post post={post.post} />
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

    .loading {
        display: grid;
        place-items: center;
        height: 100%;
        width: 100%;
    }

    .header {
        padding: 1rem;
        display: grid;
        place-items: center;
    }

    .header h2 {
        color: var(--text-subdued);
    }
</style>
