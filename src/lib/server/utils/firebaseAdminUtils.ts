import { Timestamp } from "firebase-admin/firestore"
import { db, auth, fieldValue } from "$lib/server/services/firebaseAdmin"
import { supabaseAdmin, SUPABASE_BUCKET } from "$lib/server/services/supabase"

export async function verifyToken(token) {
  try {
    const decodedToken = await auth.verifyIdToken(token)
    return { success: true, uid: decodedToken.uid }
  } catch (error) {
    return { success: false, error: 'Invalid or expired token' }
  }
}

async function createNotification(recipientUID, type, actorUID, postUID = null) {
  if (!recipientUID || recipientUID === actorUID) return

  try {
    await db.collection('Notifications').add({
      recipientUID,
      type,
      actorUID,
      postUID,
      createdAt: fieldValue.serverTimestamp()
    })
  } catch (error) {
    console.error('Error creating notification:', error)
  }
}

async function notifyMentions(content, actorUID, postUID) {
  if (!content) return

  const usernames = [...new Set((content.match(/@(\w+)/g) || []).map(match => match.slice(1)))]

  await Promise.all(usernames.map(async username => {
    const result = await getUserByUsername(username)
    if (result.success) {
      await createNotification(result.user.uid, 'mention', actorUID, postUID)
    }
  }))
}

const EXTENSION_BY_TYPE = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov'
}

export async function uploadUserImage(uid, token, kind, buffer, contentType) {
  const tokenVerification = await verifyToken(token)

  if (!tokenVerification.success) {
    return { success: false, message: tokenVerification.error }
  }

  if (tokenVerification.uid !== uid) {
    return { success: false, message: 'You do not have permission to do this' }
  }

  if (kind !== 'avatar' && kind !== 'banner' && kind !== 'post') {
    return { success: false, message: 'Invalid image kind' }
  }

  const extension = EXTENSION_BY_TYPE[contentType]

  if (!extension) {
    return { success: false, message: 'Unsupported media type' }
  }

  try {
    const filePath = kind === 'post'
      ? `posts/${uid}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`
      : `users/${uid}/${kind}.${extension}`

    const { error: uploadError } = await supabaseAdmin.storage
      .from(SUPABASE_BUCKET)
      .upload(filePath, buffer, {
        contentType,
        cacheControl: '31536000',
        upsert: true
      })

    if (uploadError) {
      throw uploadError
    }

    const { data } = supabaseAdmin.storage.from(SUPABASE_BUCKET).getPublicUrl(filePath)
    const url = `${data.publicUrl}?updated=${Date.now()}`

    return { success: true, url }
  } catch (error) {
    console.error('Error uploading image:', error)
    return { success: false, error: 'Failed to upload image' }
  }
}

export async function getUserByUID(uid) {
  try {
    const userDoc = await db.collection('Users').doc(uid).get()

    if (userDoc.exists) {
      return { success: true, user: userDoc.data() }
    } else {
      return { success: false, message: 'User not found' }
    }
  } catch (error) {
    console.error('Error fetching user by UID:', error)
    return { success: false, error: 'Failed to fetch user' }
  }
}

export async function getSimpleUserByUID(uid) {
  try {
    const userDoc = await db.collection('Users').doc(uid).get()

    if (userDoc.exists) {
      let { email, settings, emailVerified, BannerURL, createdAt, ...userData } = userDoc.data()

      return { success: true, user: userData }
    } else {
      return { success: false, message: 'User not found' }
    }
  } catch (error) {
    console.error('Error fetching user by UID:', error)
    return { success: false, error: 'Failed to fetch user' }
  }
}


export async function getUserByUsername(username) {
  try {
    const userSnapshot = await db.collection('Users').where('username', '==', username).get()

    if (!userSnapshot.empty) {
      let { email, settings, emailVerified, ...userData } = userSnapshot.docs[0].data()

      return { success: true, user: userData }
    } else {
      return { success: false, message: 'User not found' }
    }
  } catch (error) {
    console.error('Error fetching user by username:', error)
    return { success: false, error: 'Failed to fetch user' }
  }
}

export async function registerUser(user) {
  try {
    const getUser = await getUserByUID(user.uid)

    if (getUser.success === false && getUser.message === 'User not found') {
      await db.collection('Users').doc(user.uid).set({
        followersCount: 0,
        followingCount: 0,
        ...user,
        'createdAt': fieldValue.serverTimestamp()
      })

      return { success: true, user }
    }

    return { success: false, error: 'The user already exists.' }
  } catch (error) {
    console.error('Error registering user:', error)
    return { success: false, error: 'Failed to register user' }
  }
}

async function isPrivateAndBlocked(authorUID, viewerUID) {
  if (!authorUID || viewerUID === authorUID) return false

  const authorDoc = await db.collection('Users').doc(authorUID).get()
  if (!authorDoc.exists || !authorDoc.data()!.private) return false

  if (!viewerUID) return true

  const followDoc = await db.collection('Follows').doc(`${viewerUID}_${authorUID}`).get()
  return !followDoc.exists
}

async function filterBlockedPosts(posts, viewerUID) {
  const uniqueAuthorUIDs = [...new Set(posts.map(post => post.userUID))]
  const blockedMap = new Map(
    await Promise.all(uniqueAuthorUIDs.map(async authorUID =>
      [authorUID, await isPrivateAndBlocked(authorUID, viewerUID)] as [string, boolean]
    ))
  )

  return posts.filter(post => !blockedMap.get(post.userUID))
}

export async function getRecentPosts(limit = 10, cursorMillis = null, viewerUID = null) {
  try {
    let query = db.collection('Posts').orderBy('uploadDate', 'desc')

    if (cursorMillis) {
      query = query.startAfter(Timestamp.fromMillis(cursorMillis))
    }

    const postsSnapshot = await query.limit(limit).get()

    if (!postsSnapshot.empty) {
      const posts = await filterBlockedPosts(postsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })), viewerUID)

      return { success: true, posts }
    } else {
      return { success: false, message: 'No posts found' }
    }
  } catch (error) {
    console.error('Error fetching recent posts:', error)
    return { success: false, error: 'Failed to fetch recent posts' }
  }
}

export async function getPostsByUserUID(userUID, limit = 10, viewerUID = null) {
  try {
    if (await isPrivateAndBlocked(userUID, viewerUID)) {
      return { success: false, message: 'This account is private', private: true }
    }

    // Sorted in memory instead of via .orderBy() so this doesn't depend on a
    // Firestore composite index existing for (userUID, uploadDate).
    const postsSnapshot = await db.collection('Posts')
      .where('userUID', '==', userUID)
      .get()

    if (!postsSnapshot.empty) {
      const posts = (postsSnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as any[])
        .sort((a, b) => (b.uploadDate?.toMillis?.() || 0) - (a.uploadDate?.toMillis?.() || 0))
        .slice(0, limit)

      return { success: true, posts }
    } else {
      return { success: false, message: 'No posts found for this user' }
    }
  } catch (error) {
    console.error('Error fetching posts by userUID:', error)
    return { success: false, error: 'Failed to fetch user posts' }
  }
}

export async function getPostByUID(postUID: string, viewerUID: string | null = null) {
  try {
    const postDoc = await db.collection('Posts').doc(postUID).get()

    if (postDoc.exists) {
      const post = { id: postDoc.id, ...postDoc.data() } as any

      if (await isPrivateAndBlocked(post.userUID, viewerUID)) {
        return { success: false, message: 'This post is private', private: true }
      }

      return { success: true, post: post }
    } else {
      return { success: false, message: 'No posts found for this UID' }
    }
  } catch (error) {
    console.error('Error fetching posts by postUID:', error)
    return { success: false, error: 'Failed to fetch post' }
  }
}

export async function newPost(post, token) {
  try {

    const tokenVerification = await verifyToken(token)

    if (!tokenVerification.success) {
      return { success: false, message: tokenVerification.error }
    }

    if (tokenVerification.uid !== post.userUID) {
      return { success: false, message: 'You do not have permission to make this post' }
    }

    const { poll: rawPoll, replyAudience, ...postFields } = post

    let poll = null
    if (rawPoll && Array.isArray(rawPoll.options) && rawPoll.options.length >= 2) {
      poll = {
        options: rawPoll.options.map(text => ({ text, votes: 0 })),
        expiresAt: Timestamp.fromMillis(Date.now() + (rawPoll.durationHours || 24) * 3600 * 1000)
      }
    }

    const newPost = await db.collection('Posts').add({
      likesCount: 0,
      repliesCount: 0,
      repostsCount: 0,
      repostOf: null,
      replyAudience: replyAudience || 'everyone',
      poll,
      'uploadDate': fieldValue.serverTimestamp(),
      ...postFields
    })

    const subscribersSnapshot = await db.collection('PostNotifSubs')
      .where('targetUID', '==', post.userUID)
      .get()

    await Promise.all(
      subscribersSnapshot.docs.map(doc =>
        createNotification(doc.data().subscriberUID, 'post', post.userUID, newPost.id)
      )
    )

    await notifyMentions(post.content, post.userUID, newPost.id)

    const newPostDoc = await newPost.get()

    return { success: true, post: { id: newPost.id, ...newPostDoc.data() } }
  } catch (error) {
    console.error('Error making the post:', error)
    return { success: false, error: 'Failed to post' }
  }
}

export async function editPost(postUID, uid, content, token) {
  try {
    const tokenVerification = await verifyToken(token)

    if (!tokenVerification.success) {
      return { success: false, message: tokenVerification.error }
    }

    if (tokenVerification.uid !== uid) {
      return { success: false, message: 'You do not have permission to do this' }
    }

    const postRef = db.collection('Posts').doc(postUID)
    const postDoc = await postRef.get()

    if (!postDoc.exists) {
      return { success: false, message: 'Post not found' }
    }

    const postData = postDoc.data()!

    if (postData.userUID !== uid) {
      return { success: false, message: 'You do not have permission to edit this post' }
    }

    const historyEntry = {
      content: postData.content ?? '',
      editedAt: postData.editedAt ?? postData.uploadDate ?? Timestamp.now(),
    }

    await postRef.update({
      content,
      edited: true,
      editedAt: fieldValue.serverTimestamp(),
      editHistory: fieldValue.arrayUnion(historyEntry),
    })

    const updatedDoc = await postRef.get()

    return { success: true, post: { id: postRef.id, ...updatedDoc.data() } }
  } catch (error) {
    console.error('Error editing post:', error)
    return { success: false, error: 'Failed to edit post' }
  }
}

export async function deletePost(postUID, uid, token) {
  try {
    const tokenVerification = await verifyToken(token)

    if (!tokenVerification.success) {
      return { success: false, message: tokenVerification.error }
    }

    if (tokenVerification.uid !== uid) {
      return { success: false, message: 'You do not have permission to do this' }
    }

    const postRef = db.collection('Posts').doc(postUID)
    const postDoc = await postRef.get()

    if (!postDoc.exists) {
      return { success: false, message: 'Post not found' }
    }

    if (postDoc.data()!.userUID !== uid) {
      return { success: false, message: 'You do not have permission to delete this post' }
    }

    await postRef.delete()

    return { success: true }
  } catch (error) {
    console.error('Error deleting post:', error)
    return { success: false, error: 'Failed to delete post' }
  }
}

export async function togglePinPost(uid, postUID, token) {
  const tokenVerification = await verifyToken(token)

  if (!tokenVerification.success) {
    return { success: false, message: tokenVerification.error }
  }

  if (tokenVerification.uid !== uid) {
    return { success: false, message: 'You do not have permission to do this' }
  }

  try {
    const postDoc = await db.collection('Posts').doc(postUID).get()

    if (!postDoc.exists || postDoc.data()!.userUID !== uid) {
      return { success: false, message: 'You do not have permission to pin this post' }
    }

    const userRef = db.collection('Users').doc(uid)
    const userDoc = await userRef.get()
    const currentlyPinned = userDoc.data()?.pinnedPostUID === postUID

    await userRef.update({ pinnedPostUID: currentlyPinned ? null : postUID })

    return { success: true, pinnedPostUID: currentlyPinned ? null : postUID }
  } catch (error) {
    console.error('Error toggling pinned post:', error)
    return { success: false, error: 'Failed to update pinned post' }
  }
}

export async function toggleLike(postUID, uid, token) {
  const tokenVerification = await verifyToken(token)

  if (!tokenVerification.success) {
    return { success: false, message: tokenVerification.error }
  }

  if (tokenVerification.uid !== uid) {
    return { success: false, message: 'You do not have permission to do this' }
  }

  try {
    const postRef = db.collection('Posts').doc(postUID)
    const postDoc = await postRef.get()

    if (!postDoc.exists) {
      return { success: false, message: 'Post not found' }
    }

    const likeRef = db.collection('Likes').doc(`${postUID}_${uid}`)
    const likeDoc = await likeRef.get()

    if (likeDoc.exists) {
      await likeRef.delete()
      await postRef.update({ likesCount: fieldValue.increment(-1) })
      return { success: true, liked: false }
    } else {
      await likeRef.set({ postUID, userUID: uid, createdAt: fieldValue.serverTimestamp() })
      await postRef.update({ likesCount: fieldValue.increment(1) })
      await createNotification(postDoc.data()!.userUID, 'like', uid, postUID)
      return { success: true, liked: true }
    }
  } catch (error) {
    console.error('Error toggling like:', error)
    return { success: false, error: 'Failed to toggle like' }
  }
}

export async function getPostViewerState(postUID, uid) {
  if (!uid) {
    return { success: true, liked: false, reposted: false, bookmarked: false, pollVotedOption: null }
  }

  try {
    const [likeDoc, repostSnapshot, bookmarkDoc, pollVoteDoc] = await Promise.all([
      db.collection('Likes').doc(`${postUID}_${uid}`).get(),
      db.collection('Posts').where('userUID', '==', uid).where('repostOf', '==', postUID).limit(1).get(),
      db.collection('Bookmarks').doc(`${uid}_${postUID}`).get(),
      db.collection('PollVotes').doc(`${postUID}_${uid}`).get()
    ])

    return {
      success: true,
      liked: likeDoc.exists,
      reposted: !repostSnapshot.empty,
      bookmarked: bookmarkDoc.exists,
      pollVotedOption: pollVoteDoc.exists ? pollVoteDoc.data()!.optionIndex : null
    }
  } catch (error) {
    console.error('Error fetching post viewer state:', error)
    return { success: false, error: 'Failed to fetch post state' }
  }
}

export async function votePoll(postUID, uid, optionIndex, token) {
  const tokenVerification = await verifyToken(token)

  if (!tokenVerification.success) {
    return { success: false, message: tokenVerification.error }
  }

  if (tokenVerification.uid !== uid) {
    return { success: false, message: 'You do not have permission to do this' }
  }

  try {
    const voteRef = db.collection('PollVotes').doc(`${postUID}_${uid}`)
    const postRef = db.collection('Posts').doc(postUID)

    const options = await db.runTransaction(async (tx) => {
      const [voteDoc, postDoc] = await Promise.all([tx.get(voteRef), tx.get(postRef)])

      if (voteDoc.exists) {
        throw new Error('ALREADY_VOTED')
      }

      if (!postDoc.exists || !postDoc.data()!.poll) {
        throw new Error('NO_POLL')
      }

      const poll = postDoc.data()!.poll

      if (poll.expiresAt && poll.expiresAt.toMillis() < Date.now()) {
        throw new Error('POLL_EXPIRED')
      }

      if (optionIndex < 0 || optionIndex >= poll.options.length) {
        throw new Error('INVALID_OPTION')
      }

      const updatedOptions = poll.options.map((option, index) =>
        index === optionIndex ? { ...option, votes: (option.votes || 0) + 1 } : option
      )

      tx.update(postRef, { 'poll.options': updatedOptions })
      tx.set(voteRef, { postUID, userUID: uid, optionIndex, createdAt: fieldValue.serverTimestamp() })

      return updatedOptions
    })

    return { success: true, options }
  } catch (error: any) {
    if (error.message === 'ALREADY_VOTED') return { success: false, message: 'You already voted on this poll' }
    if (error.message === 'POLL_EXPIRED') return { success: false, message: 'This poll has ended' }
    if (error.message === 'NO_POLL') return { success: false, message: 'This post has no poll' }
    console.error('Error voting on poll:', error)
    return { success: false, error: 'Failed to vote' }
  }
}

export async function toggleBookmark(postUID, uid, token) {
  const tokenVerification = await verifyToken(token)

  if (!tokenVerification.success) {
    return { success: false, message: tokenVerification.error }
  }

  if (tokenVerification.uid !== uid) {
    return { success: false, message: 'You do not have permission to do this' }
  }

  try {
    const postDoc = await db.collection('Posts').doc(postUID).get()

    if (!postDoc.exists) {
      return { success: false, message: 'Post not found' }
    }

    const bookmarkRef = db.collection('Bookmarks').doc(`${uid}_${postUID}`)
    const bookmarkDoc = await bookmarkRef.get()

    if (bookmarkDoc.exists) {
      await bookmarkRef.delete()
      return { success: true, bookmarked: false }
    } else {
      await bookmarkRef.set({ userUID: uid, postUID, createdAt: fieldValue.serverTimestamp() })
      return { success: true, bookmarked: true }
    }
  } catch (error) {
    console.error('Error toggling bookmark:', error)
    return { success: false, error: 'Failed to toggle bookmark' }
  }
}

export async function getBookmarkedPosts(uid, token, limit = 30) {
  const tokenVerification = await verifyToken(token)

  if (!tokenVerification.success) {
    return { success: false, message: tokenVerification.error }
  }

  if (tokenVerification.uid !== uid) {
    return { success: false, message: 'You do not have permission to do this' }
  }

  try {
    const bookmarksSnapshot = await db.collection('Bookmarks').where('userUID', '==', uid).get()

    const sortedBookmarks = bookmarksSnapshot.docs
      .map(doc => doc.data())
      .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0))
      .slice(0, limit)

    const posts = (await Promise.all(sortedBookmarks.map(async bookmark => {
      const postDoc = await db.collection('Posts').doc(bookmark.postUID).get()
      return postDoc.exists ? { id: postDoc.id, ...postDoc.data() } : null
    }))).filter(Boolean)

    return { success: true, posts }
  } catch (error) {
    console.error('Error fetching bookmarked posts:', error)
    return { success: false, error: 'Failed to fetch bookmarks' }
  }
}

async function canReplyToPost(postData, uid) {
  const authorUID = postData.userUID
  if (uid === authorUID) return true

  const audience = postData.replyAudience || 'everyone'
  if (audience === 'everyone') return true

  if (audience === 'following') {
    const followDoc = await db.collection('Follows').doc(`${authorUID}_${uid}`).get()
    return followDoc.exists
  }

  if (audience === 'mentioned') {
    const mentionedUsernames = (postData.content?.match(/@(\w+)/g) || []).map(match => match.slice(1))
    if (mentionedUsernames.length === 0) return false

    const replierDoc = await db.collection('Users').doc(uid).get()
    return replierDoc.exists && mentionedUsernames.includes(replierDoc.data()!.username)
  }

  return true
}

export async function newReply(postUID, content, uid, token) {
  const tokenVerification = await verifyToken(token)

  if (!tokenVerification.success) {
    return { success: false, message: tokenVerification.error }
  }

  if (tokenVerification.uid !== uid) {
    return { success: false, message: 'You do not have permission to do this' }
  }

  try {
    const postRef = db.collection('Posts').doc(postUID)
    const postDoc = await postRef.get()

    if (!postDoc.exists) {
      return { success: false, message: 'Post not found' }
    }

    if (!(await canReplyToPost(postDoc.data(), uid))) {
      return { success: false, message: 'You are not allowed to reply to this post' }
    }

    const reply = await db.collection('Replies').add({
      postUID,
      userUID: uid,
      content,
      likesCount: 0,
      uploadDate: fieldValue.serverTimestamp()
    })

    await postRef.update({ repliesCount: fieldValue.increment(1) })
    await createNotification(postDoc.data()!.userUID, 'reply', uid, postUID)
    await notifyMentions(content, uid, postUID)

    return { success: true, id: reply.id }
  } catch (error) {
    console.error('Error creating reply:', error)
    return { success: false, error: 'Failed to reply' }
  }
}

export async function toggleReplyLike(replyUID, uid, token) {
  const tokenVerification = await verifyToken(token)

  if (!tokenVerification.success) {
    return { success: false, message: tokenVerification.error }
  }

  if (tokenVerification.uid !== uid) {
    return { success: false, message: 'You do not have permission to do this' }
  }

  try {
    const replyRef = db.collection('Replies').doc(replyUID)
    const replyDoc = await replyRef.get()

    if (!replyDoc.exists) {
      return { success: false, message: 'Reply not found' }
    }

    const likeRef = db.collection('ReplyLikes').doc(`${replyUID}_${uid}`)
    const likeDoc = await likeRef.get()

    if (likeDoc.exists) {
      await likeRef.delete()
      await replyRef.update({ likesCount: fieldValue.increment(-1) })
      return { success: true, liked: false }
    } else {
      await likeRef.set({ replyUID, userUID: uid, createdAt: fieldValue.serverTimestamp() })
      await replyRef.update({ likesCount: fieldValue.increment(1) })
      await createNotification(replyDoc.data()!.userUID, 'reply_like', uid, replyDoc.data()!.postUID)
      return { success: true, liked: true }
    }
  } catch (error) {
    console.error('Error toggling reply like:', error)
    return { success: false, error: 'Failed to toggle reply like' }
  }
}

export async function getReplyViewerState(replyUID, uid) {
  if (!uid) {
    return { success: true, liked: false }
  }

  try {
    const likeDoc = await db.collection('ReplyLikes').doc(`${replyUID}_${uid}`).get()
    return { success: true, liked: likeDoc.exists }
  } catch (error) {
    console.error('Error fetching reply viewer state:', error)
    return { success: false, error: 'Failed to fetch reply state' }
  }
}

export async function getReplies(postUID, limit = 20) {
  try {
    // Sorted in memory instead of via .orderBy() so this doesn't depend on a
    // Firestore composite index existing for (postUID, uploadDate).
    const repliesSnapshot = await db.collection('Replies')
      .where('postUID', '==', postUID)
      .get()

    const replies = (repliesSnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as any[])
      .sort((a, b) => (a.uploadDate?.toMillis?.() || 0) - (b.uploadDate?.toMillis?.() || 0))
      .slice(0, limit)

    return { success: true, replies }
  } catch (error) {
    console.error('Error fetching replies:', error)
    return { success: false, error: 'Failed to fetch replies' }
  }
}

export async function createRepost(postUID, quote, uid, token) {
  const tokenVerification = await verifyToken(token)

  if (!tokenVerification.success) {
    return { success: false, message: tokenVerification.error }
  }

  if (tokenVerification.uid !== uid) {
    return { success: false, message: 'You do not have permission to do this' }
  }

  try {
    const postRef = db.collection('Posts').doc(postUID)
    const postDoc = await postRef.get()

    if (!postDoc.exists) {
      return { success: false, message: 'Post not found' }
    }

    const existingRepost = await db.collection('Posts')
      .where('userUID', '==', uid)
      .where('repostOf', '==', postUID)
      .limit(1)
      .get()

    if (!existingRepost.empty) {
      return { success: false, message: 'You already reposted this' }
    }

    const repost = await db.collection('Posts').add({
      userUID: uid,
      content: quote || '',
      image: false,
      imageURL: '',
      repostOf: postUID,
      likesCount: 0,
      repliesCount: 0,
      repostsCount: 0,
      uploadDate: fieldValue.serverTimestamp()
    })

    await postRef.update({ repostsCount: fieldValue.increment(1) })
    await createNotification(postDoc.data()!.userUID, 'repost', uid, postUID)

    return { success: true, id: repost.id }
  } catch (error) {
    console.error('Error creating repost:', error)
    return { success: false, error: 'Failed to repost' }
  }
}

export async function removeRepost(postUID, uid, token) {
  const tokenVerification = await verifyToken(token)

  if (!tokenVerification.success) {
    return { success: false, message: tokenVerification.error }
  }

  if (tokenVerification.uid !== uid) {
    return { success: false, message: 'You do not have permission to do this' }
  }

  try {
    const existingRepost = await db.collection('Posts')
      .where('userUID', '==', uid)
      .where('repostOf', '==', postUID)
      .limit(1)
      .get()

    if (existingRepost.empty) {
      return { success: false, message: 'Repost not found' }
    }

    await existingRepost.docs[0].ref.delete()
    await db.collection('Posts').doc(postUID).update({ repostsCount: fieldValue.increment(-1) })

    return { success: true }
  } catch (error) {
    console.error('Error removing repost:', error)
    return { success: false, error: 'Failed to remove repost' }
  }
}

export async function toggleFollow(targetUID, uid, token) {
  const tokenVerification = await verifyToken(token)

  if (!tokenVerification.success) {
    return { success: false, message: tokenVerification.error }
  }

  if (tokenVerification.uid !== uid) {
    return { success: false, message: 'You do not have permission to do this' }
  }

  if (uid === targetUID) {
    return { success: false, message: 'You cannot follow yourself' }
  }

  try {
    const targetRef = db.collection('Users').doc(targetUID)
    const targetDoc = await targetRef.get()

    if (!targetDoc.exists) {
      return { success: false, message: 'User not found' }
    }

    const followRef = db.collection('Follows').doc(`${uid}_${targetUID}`)
    const followDoc = await followRef.get()
    const meRef = db.collection('Users').doc(uid)

    if (followDoc.exists) {
      await followRef.delete()
      await Promise.all([
        targetRef.update({ followersCount: fieldValue.increment(-1) }),
        meRef.update({ followingCount: fieldValue.increment(-1) })
      ])
      return { success: true, following: false, requested: false }
    }

    if (targetDoc.data()!.private) {
      const requestRef = db.collection('FollowRequests').doc(`${uid}_${targetUID}`)
      const requestDoc = await requestRef.get()

      if (requestDoc.exists) {
        await requestRef.delete()
        return { success: true, following: false, requested: false }
      } else {
        await requestRef.set({ requesterUID: uid, targetUID, createdAt: fieldValue.serverTimestamp() })
        await createNotification(targetUID, 'follow_request', uid)
        return { success: true, following: false, requested: true }
      }
    }

    await followRef.set({ followerUID: uid, followingUID: targetUID, createdAt: fieldValue.serverTimestamp() })
    await Promise.all([
      targetRef.update({ followersCount: fieldValue.increment(1) }),
      meRef.update({ followingCount: fieldValue.increment(1) })
    ])
    await createNotification(targetUID, 'follow', uid)
    return { success: true, following: true, requested: false }
  } catch (error) {
    console.error('Error toggling follow:', error)
    return { success: false, error: 'Failed to toggle follow' }
  }
}

export async function getFollowStatus(targetUID, uid) {
  if (!uid || uid === targetUID) {
    return { success: true, following: false, requested: false }
  }

  try {
    const [followDoc, requestDoc] = await Promise.all([
      db.collection('Follows').doc(`${uid}_${targetUID}`).get(),
      db.collection('FollowRequests').doc(`${uid}_${targetUID}`).get()
    ])
    return { success: true, following: followDoc.exists, requested: requestDoc.exists }
  } catch (error) {
    console.error('Error fetching follow status:', error)
    return { success: false, error: 'Failed to fetch follow status' }
  }
}

export async function getFollowRequests(uid, token) {
  const tokenVerification = await verifyToken(token)

  if (!tokenVerification.success) {
    return { success: false, message: tokenVerification.error }
  }

  if (tokenVerification.uid !== uid) {
    return { success: false, message: 'You do not have permission to do this' }
  }

  try {
    const requestsSnapshot = await db.collection('FollowRequests').where('targetUID', '==', uid).get()

    const requests = await Promise.all(requestsSnapshot.docs.map(async doc => {
      const data = doc.data()
      const result = await getSimpleUserByUID(data.requesterUID)
      return result.success ? { requesterUID: data.requesterUID, createdAt: data.createdAt, user: result.user } : null
    }))

    return { success: true, requests: requests.filter(Boolean) }
  } catch (error) {
    console.error('Error fetching follow requests:', error)
    return { success: false, error: 'Failed to fetch follow requests' }
  }
}

export async function respondFollowRequest(uid, requesterUID, accept, token) {
  const tokenVerification = await verifyToken(token)

  if (!tokenVerification.success) {
    return { success: false, message: tokenVerification.error }
  }

  if (tokenVerification.uid !== uid) {
    return { success: false, message: 'You do not have permission to do this' }
  }

  try {
    const requestRef = db.collection('FollowRequests').doc(`${requesterUID}_${uid}`)
    const requestDoc = await requestRef.get()

    if (!requestDoc.exists) {
      return { success: false, message: 'Follow request not found' }
    }

    await requestRef.delete()

    if (accept) {
      const followRef = db.collection('Follows').doc(`${requesterUID}_${uid}`)
      await followRef.set({ followerUID: requesterUID, followingUID: uid, createdAt: fieldValue.serverTimestamp() })
      await Promise.all([
        db.collection('Users').doc(uid).update({ followersCount: fieldValue.increment(1) }),
        db.collection('Users').doc(requesterUID).update({ followingCount: fieldValue.increment(1) })
      ])
      await createNotification(requesterUID, 'follow_accepted', uid)
    }

    return { success: true }
  } catch (error) {
    console.error('Error responding to follow request:', error)
    return { success: false, error: 'Failed to respond to follow request' }
  }
}

async function getFollowList(targetUID, requesterUID, direction) {
  try {
    const targetDoc = await db.collection('Users').doc(targetUID).get()

    if (!targetDoc.exists) {
      return { success: false, message: 'User not found' }
    }

    if (targetDoc.data()!.settings?.hideFollowLists && requesterUID !== targetUID) {
      return { success: false, message: 'This user has hidden this list' }
    }

    const field = direction === 'followers' ? 'followingUID' : 'followerUID'
    const uidField = direction === 'followers' ? 'followerUID' : 'followingUID'

    const followsSnapshot = await db.collection('Follows').where(field, '==', targetUID).get()
    const uids = followsSnapshot.docs.map(doc => doc.data()[uidField])

    const users = await Promise.all(uids.map(async uid => {
      const result = await getSimpleUserByUID(uid)
      return result.success ? result.user : null
    }))

    return { success: true, users: users.filter(Boolean) }
  } catch (error) {
    console.error('Error fetching follow list:', error)
    return { success: false, error: 'Failed to fetch follow list' }
  }
}

export async function getFollowers(targetUID, requesterUID) {
  return getFollowList(targetUID, requesterUID, 'followers')
}

export async function getFollowing(targetUID, requesterUID) {
  return getFollowList(targetUID, requesterUID, 'following')
}

export async function updatePrivacySettings(uid, token, settingsUpdate) {
  const tokenVerification = await verifyToken(token)

  if (!tokenVerification.success) {
    return { success: false, message: tokenVerification.error }
  }

  if (tokenVerification.uid !== uid) {
    return { success: false, message: 'You do not have permission to do this' }
  }

  try {
    const updatePayload: Record<string, any> = {}
    for (const [key, value] of Object.entries(settingsUpdate)) {
      updatePayload[`settings.${key}`] = value
    }

    await db.collection('Users').doc(uid).update(updatePayload)

    return { success: true }
  } catch (error) {
    console.error('Error updating privacy settings:', error)
    return { success: false, error: 'Failed to update privacy settings' }
  }
}

export async function updateAccountPrivacy(uid, token, isPrivate) {
  const tokenVerification = await verifyToken(token)

  if (!tokenVerification.success) {
    return { success: false, message: tokenVerification.error }
  }

  if (tokenVerification.uid !== uid) {
    return { success: false, message: 'You do not have permission to do this' }
  }

  try {
    await db.collection('Users').doc(uid).update({ private: isPrivate })
    return { success: true }
  } catch (error) {
    console.error('Error updating account privacy:', error)
    return { success: false, error: 'Failed to update account privacy' }
  }
}

export async function getNotifications(uid, token, limit = 30) {
  const tokenVerification = await verifyToken(token)

  if (!tokenVerification.success) {
    return { success: false, message: tokenVerification.error }
  }

  if (tokenVerification.uid !== uid) {
    return { success: false, message: 'You do not have permission to do this' }
  }

  try {
    // Sorted in memory instead of via .orderBy() so this doesn't depend on a
    // Firestore composite index existing for (recipientUID, createdAt).
    const [notificationsSnapshot, userDoc] = await Promise.all([
      db.collection('Notifications')
        .where('recipientUID', '==', uid)
        .get(),
      db.collection('Users').doc(uid).get()
    ])

    const notifications = (notificationsSnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as any[])
      .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0))
      .slice(0, limit)

    const lastRead = userDoc.exists ? (userDoc.data()!.notificationsLastRead || null) : null

    return { success: true, notifications, lastRead }
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return { success: false, error: 'Failed to fetch notifications' }
  }
}

export async function markNotificationsSeen(uid, token) {
  const tokenVerification = await verifyToken(token)

  if (!tokenVerification.success) {
    return { success: false, message: tokenVerification.error }
  }

  if (tokenVerification.uid !== uid) {
    return { success: false, message: 'You do not have permission to do this' }
  }

  try {
    await db.collection('Users').doc(uid).update({ notificationsLastRead: fieldValue.serverTimestamp() })
    return { success: true }
  } catch (error) {
    console.error('Error marking notifications seen:', error)
    return { success: false, error: 'Failed to update notifications' }
  }
}

export async function togglePostNotifications(targetUID, uid, token) {
  const tokenVerification = await verifyToken(token)

  if (!tokenVerification.success) {
    return { success: false, message: tokenVerification.error }
  }

  if (tokenVerification.uid !== uid) {
    return { success: false, message: 'You do not have permission to do this' }
  }

  if (uid === targetUID) {
    return { success: false, message: 'You cannot subscribe to your own posts' }
  }

  try {
    const subRef = db.collection('PostNotifSubs').doc(`${uid}_${targetUID}`)
    const subDoc = await subRef.get()

    if (subDoc.exists) {
      await subRef.delete()
      return { success: true, subscribed: false }
    } else {
      await subRef.set({ subscriberUID: uid, targetUID, createdAt: fieldValue.serverTimestamp() })
      return { success: true, subscribed: true }
    }
  } catch (error) {
    console.error('Error toggling post notifications:', error)
    return { success: false, error: 'Failed to toggle post notifications' }
  }
}

export async function getPostNotificationStatus(targetUID, uid) {
  if (!uid || uid === targetUID) {
    return { success: true, subscribed: false }
  }

  try {
    const subDoc = await db.collection('PostNotifSubs').doc(`${uid}_${targetUID}`).get()
    return { success: true, subscribed: subDoc.exists }
  } catch (error) {
    console.error('Error fetching post notification status:', error)
    return { success: false, error: 'Failed to fetch post notification status' }
  }
}

export async function getSuggestedUsers(uid, limit = 3) {
  try {
    const [usersSnapshot, followingSnapshot] = await Promise.all([
      db.collection('Users').orderBy('createdAt', 'desc').limit(limit + 15).get(),
      uid ? db.collection('Follows').where('followerUID', '==', uid).get() : Promise.resolve(null)
    ])

    const followingUIDs = new Set(
      followingSnapshot ? followingSnapshot.docs.map(doc => doc.data().followingUID) : []
    )

    const users = usersSnapshot.docs
      .filter(doc => doc.id !== uid && !followingUIDs.has(doc.id))
      .slice(0, limit)
      .map(doc => {
        let { email, settings, emailVerified, ...userData } = doc.data()
        return { ...userData, uid: doc.id }
      })

    return { success: true, users }
  } catch (error) {
    console.error('Error fetching suggested users:', error)
    return { success: false, error: 'Failed to fetch suggested users' }
  }
}

export async function editUserProfile(uid, updatedUserData, token) {
  const tokenVerification = await verifyToken(token)

  if (!tokenVerification.success) {
    return { success: false, message: tokenVerification.error }
  }

  if (tokenVerification.uid !== uid) {
    return { success: false, message: 'You do not have permission to edit this profile' }
  }

  try {
    const userDocRef = db.collection('Users').doc(uid)
    const userDoc = await userDocRef.get()

    if (!userDoc.exists) {
      return { success: false, message: 'User not found' }
    }

    const currentUserData = userDoc.data()

    if (updatedUserData.username && updatedUserData.username !== currentUserData.username) {
      const existingUserCheck = await getUserByUsername(updatedUserData.username)
      if (existingUserCheck.success) {
        return { success: false, message: 'Username is already taken.' }
      }
    }

    await userDocRef.update(updatedUserData)
    return { success: true, message: 'Profile updated successfully' }
  } catch (error) {
    console.error('Error updating user profile:', error)
    return { success: false, error: 'Failed to update profile' }
  }
}

const ADMIN_EDITABLE_FIELDS = ['displayName', 'description', 'verified', 'admin']

export async function adminEditUserProfile(adminUID, targetUID, updatedUserData, token) {
  const tokenVerification = await verifyToken(token)

  if (!tokenVerification.success) {
    return { success: false, message: tokenVerification.error }
  }

  if (tokenVerification.uid !== adminUID) {
    return { success: false, message: 'You do not have permission to do this' }
  }

  try {
    const adminDoc = await db.collection('Users').doc(adminUID).get()

    if (!adminDoc.exists || !adminDoc.data()!.admin) {
      return { success: false, message: 'You do not have permission to do this' }
    }

    const targetRef = db.collection('Users').doc(targetUID)
    const targetDoc = await targetRef.get()

    if (!targetDoc.exists) {
      return { success: false, message: 'User not found' }
    }

    const updatePayload: Record<string, any> = {}
    for (const field of ADMIN_EDITABLE_FIELDS) {
      if (field in updatedUserData) updatePayload[field] = updatedUserData[field]
    }

    await targetRef.update(updatePayload)
    return { success: true, message: 'User updated successfully' }
  } catch (error) {
    console.error('Error performing admin edit:', error)
    return { success: false, error: 'Failed to update user' }
  }
}

export async function search(query, limit = 10, viewerUID = null) {
  try {
    const usersByUsernameSnapshot = await db.collection('Users')
      .where('username', '>=', query)
      .where('username', '<=', query + '\uf8ff')
      .limit(limit)
      .get()

    const usersByDescriptionSnapshot = await db.collection('Users')
      .where('description', '>=', query)
      .where('description', '<=', query + '\uf8ff')
      .limit(limit)
      .get()

    let users = []

    if (!usersByUsernameSnapshot.empty || !usersByDescriptionSnapshot.empty) {
      const usersFromUsername = usersByUsernameSnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        isUser: true
      }))
      const usersFromDescription = usersByDescriptionSnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        isUser: true
      }))
      users = [...usersFromUsername, ...usersFromDescription]
    }

    const normalizedQuery = query.toLowerCase()
    const postsSnapshot = await db.collection('Posts').get()

    const allPosts = postsSnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      isUser: false
    }))

    const matchedPosts = allPosts.filter(post =>
      post?.content?.toLowerCase().includes(normalizedQuery)
    )

    const visiblePosts = (await filterBlockedPosts(matchedPosts, viewerUID)).slice(0, limit)

    const results = [...users, ...visiblePosts]

    return { success: true, results }
  } catch (error) {
    console.error('Error during search:', error)
    return { success: false, error: 'Failed to execute search' }
  }
}
