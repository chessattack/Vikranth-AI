import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  query, 
  orderBy, 
  getDocs, 
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from '../firebase';

export interface SavedConversation {
  id: string;
  userId: string;
  title: string;
  modelKey: string;
  role?: string;
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    model?: string;
    sources?: Array<{ title?: string; uri?: string }>;
    mapsSources?: Array<{ title?: string; uri?: string }>;
  }>;
  updatedAt: string;
}

export interface SavedCreation {
  id: string;
  userId: string;
  type: 'music' | 'image' | 'video' | 'transcription';
  prompt: string;
  modelUsed: string;
  mediaUrl?: string;
  metadata?: any;
  createdAt: string;
}

export async function saveUserProfile(user: User) {
  return syncUserProfile(user);
}

export async function loadUserConversationsFromFirestore(userId: string) {
  return fetchUserConversations(userId);
}

export async function syncUserProfile(user: User) {
  try {
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || 'Vikranth AI Explorer',
      photoURL: user.photoURL || '',
      lastLoginAt: new Date().toISOString(),
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    console.warn('[Firestore] Error saving user profile:', error);
  }
}

/**
 * Persists a chat conversation to Firestore
 */
export async function saveConversationToFirestore(
  userId: string,
  arg2: SavedConversation | string,
  arg3?: any[],
  arg4?: string,
  arg5?: string
) {
  if (!userId) return;
  try {
    let payload: any;
    let convId = '';

    if (typeof arg2 === 'object') {
      payload = arg2;
      convId = arg2.id;
    } else {
      convId = arg2;
      payload = {
        id: convId,
        userId,
        title: arg4 || 'Chat Conversation',
        modelKey: arg5 || 'gemini-3.5-flash',
        messages: (arg3 || []).map((m: any) => ({
          id: m.id || String(Date.now()),
          role: m.role || 'user',
          content: m.content || '',
          timestamp: m.timestamp || new Date().toLocaleTimeString(),
          model: m.modelUsed || m.model,
          sources: m.sources,
          mapsSources: m.mapsSources,
        })),
        updatedAt: new Date().toISOString(),
      };
    }

    const convRef = doc(db, 'users', userId, 'conversations', convId);
    await setDoc(convRef, {
      ...payload,
      updatedAt: new Date().toISOString(),
      serverUpdatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    console.warn('[Firestore] Error saving conversation:', error);
  }
}

/**
 * Retrieves all saved conversations for a user
 */
export async function fetchUserConversations(userId: string): Promise<SavedConversation[]> {
  if (!userId) return [];
  try {
    const convsRef = collection(db, 'users', userId, 'conversations');
    const q = query(convsRef, orderBy('updatedAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as SavedConversation);
  } catch (error) {
    console.warn('[Firestore] Error fetching conversations:', error);
    return [];
  }
}

/**
 * Deletes a conversation from Firestore
 */
export async function deleteConversationFromFirestore(userId: string, conversationId: string) {
  if (!userId) return;
  try {
    const convRef = doc(db, 'users', userId, 'conversations', conversationId);
    await deleteDoc(convRef);
  } catch (error) {
    console.warn('[Firestore] Error deleting conversation:', error);
  }
}

/**
 * Saves user generated creations (Music, Image, Video, Audio Transcription)
 */
export async function saveCreationToFirestore(userId: string, creation: SavedCreation) {
  if (!userId) return;
  try {
    const creationRef = doc(db, 'users', userId, 'creations', creation.id);
    await setDoc(creationRef, {
      ...creation,
      createdAt: new Date().toISOString(),
      serverCreatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    console.warn('[Firestore] Error saving creation:', error);
  }
}

/**
 * Retrieves all creations for a user
 */
export async function fetchUserCreations(userId: string): Promise<SavedCreation[]> {
  if (!userId) return [];
  try {
    const creationsRef = collection(db, 'users', userId, 'creations');
    const q = query(creationsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as SavedCreation);
  } catch (error) {
    console.warn('[Firestore] Error fetching creations:', error);
    return [];
  }
}
