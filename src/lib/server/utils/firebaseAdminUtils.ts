import { Timestamp } from "firebase-admin/firestore"
import { db, auth, fieldValue, bucket } from "$lib/server/services/firebaseAdmin"

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
    const file = bucket.file(filePath)

    await file.save(buffer, {
      contentType,
      public: true,
      metadata: { cacheControl: 'public, max-age=31536000' }
    })

    const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(filePath)}?alt=media&updated=${Date.now()}`

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

export async function getRecentPosts(limit = 10, cursorMillis = null) {
  try {
    let query = db.collection('Posts').orderBy('uploadDate', 'desc')

    if (cursorMillis) {
      query = query.startAfter(Timestamp.fromMillis(cursorMillis))
    }

    const postsSnapshot = await query.limit(limit).get()

    if (!postsSnapshot.empty) {
      const posts = postsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }))

      return { success: true, posts }
    } else {
      return { success: false, message: 'No posts found' }
    }
  } catch (error) {
    console.error('Error fetching recent posts:', error)
    return { success: false, error: 'Failed to fetch recent posts' }
  }
}

export async function getPostsByUserUID(userUID, limit = 10) {
  try {
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

export async function getPostByUID(postUID: string) {
  try {
    const postDoc = await db.collection('Posts').doc(postUID).get()

    if (postDoc.exists) {
      const post = { id: postDoc.id, ...postDoc.data() }

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

    const newPost = await db.collection('Posts').add({
      likesCount: 0,
      repliesCount: 0,
      repostsCount: 0,
      repostOf: null,
      'uploadDate': fieldValue.serverTimestamp(),
      ...post
    })

    const subscribersSnapshot = await db.collection('PostNotifSubs')
      .where('targetUID', '==', post.userUID)
      .get()

    await Promise.all(
      subscribersSnapshot.docs.map(doc =>
        createNotification(doc.data().subscriberUID, 'post', post.userUID, newPost.id)
      )
    )

    const newPostDoc = await newPost.get()

    return { success: true, post: { id: newPost.id, ...newPostDoc.data() } }
  } catch (error) {
    console.error('Error making the post:', error)
    return { success: false, error: 'Failed to post' }
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
    return { success: true, liked: false, reposted: false }
  }

  try {
    const [likeDoc, repostSnapshot] = await Promise.all([
      db.collection('Likes').doc(`${postUID}_${uid}`).get(),
      db.collection('Posts').where('userUID', '==', uid).where('repostOf', '==', postUID).limit(1).get()
    ])

    return {
      success: true,
      liked: likeDoc.exists,
      reposted: !repostSnapshot.empty
    }
  } catch (error) {
    console.error('Error fetching post viewer state:', error)
    return { success: false, error: 'Failed to fetch post state' }
  }
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

    const reply = await db.collection('Replies').add({
      postUID,
      userUID: uid,
      content,
      uploadDate: fieldValue.serverTimestamp()
    })

    await postRef.update({ repliesCount: fieldValue.increment(1) })
    await createNotification(postDoc.data()!.userUID, 'reply', uid, postUID)

    return { success: true, id: reply.id }
  } catch (error) {
    console.error('Error creating reply:', error)
    return { success: false, error: 'Failed to reply' }
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
      return { success: true, following: false }
    } else {
      await followRef.set({ followerUID: uid, followingUID: targetUID, createdAt: fieldValue.serverTimestamp() })
      await Promise.all([
        targetRef.update({ followersCount: fieldValue.increment(1) }),
        meRef.update({ followingCount: fieldValue.increment(1) })
      ])
      await createNotification(targetUID, 'follow', uid)
      return { success: true, following: true }
    }
  } catch (error) {
    console.error('Error toggling follow:', error)
    return { success: false, error: 'Failed to toggle follow' }
  }
}

export async function getFollowStatus(targetUID, uid) {
  if (!uid || uid === targetUID) {
    return { success: true, following: false }
  }

  try {
    const followDoc = await db.collection('Follows').doc(`${uid}_${targetUID}`).get()
    return { success: true, following: followDoc.exists }
  } catch (error) {
    console.error('Error fetching follow status:', error)
    return { success: false, error: 'Failed to fetch follow status' }
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

export async function search(query, limit = 10) {
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
    
    let posts = postsSnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      isUser: false
    }))
    
    const filteredItems = posts.filter(post => 
        post?.content?.toLowerCase().includes(normalizedQuery.toLowerCase())
    )

    const results = [...users, ...posts]

    return { success: true, results }
  } catch (error) {
    console.error('Error during search:', error)
    return { success: false, error: 'Failed to execute search' }
  }
}
