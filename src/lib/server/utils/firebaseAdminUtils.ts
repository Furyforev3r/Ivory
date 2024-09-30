import { db } from "$lib/server/services/firebaseAdmin"
import { auth } from "$lib/server/services/firebaseAdmin"

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
      await db.collection('Users').doc(user.uid).set(user)

      return { success: true, user }
    }

    return { success: false, error: 'The user already exists.' }
  } catch (error) {
    console.error('Error registering user:', error)
    return { success: false, error: 'Failed to register user' }
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

    // Check if the username is being changed
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
