import { db, auth, fieldValue } from "$lib/server/services/firebaseAdmin"

async function verifyToken(token) {
  try {
    const decodedToken = await auth.verifyIdToken(token)
    return { success: true, uid: decodedToken.uid }
  } catch (error) {
    return { success: false, error: 'Invalid or expired token' }
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
      await db.collection('Users').doc(user.uid).set({ ...user, 'createdAt': fieldValue.serverTimestamp() })

      return { success: true, user }
    }

    return { success: false, error: 'The user already exists.' }
  } catch (error) {
    console.error('Error registering user:', error)
    return { success: false, error: 'Failed to register user' }
  }
}

export async function getRecentPosts(limit = 10) {
  try {
    const postsSnapshot = await db.collection('Posts')
      .orderBy('uploadDate', 'desc')
      .limit(limit)
      .get()

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
    const postsSnapshot = await db.collection('Posts')
      .where('userUID', '==', userUID)
      .orderBy('uploadDate', 'desc')
      .limit(limit)
      .get()

    if (!postsSnapshot.empty) {
      const posts = postsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }))

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
      let post = postDoc.data()

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

    const newPost = await db.collection('Posts').add( { 'uploadDate': fieldValue.serverTimestamp(), ...post } )

    return { success: true, newPost }
  } catch (error) {
    console.error('Error making the post:', error)
    return { success: false, error: 'Failed to post' }
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
