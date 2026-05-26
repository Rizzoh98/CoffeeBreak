import admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  try {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!serviceAccountJson) {
      throw new Error('Missing FIREBASE_SERVICE_ACCOUNT environment variable');
    }
    const serviceAccount = JSON.parse(serviceAccountJson);
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
  }
}

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { groupCode, senderName, senderUid, coffeeType } = req.body;

    if (!groupCode || !senderName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const db = admin.firestore();

    // 1. Fetch the group members to get their UIDs
    const groupRef = db.collection('groups').doc(groupCode);
    const groupSnap = await groupRef.get();

    if (!groupSnap.exists) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const groupData = groupSnap.data();
    const members = groupData.members || [];
    
    // Get all members EXCEPT the sender
    const targetUids = members
      .filter(m => m.uid !== senderUid)
      .map(m => m.uid);

    if (targetUids.length === 0) {
      return res.status(200).json({ message: 'No other members to notify' });
    }

    // 2. Fetch the fcmTokens for these users
    const tokens = [];
    // Firestore 'in' query supports max 10 items at a time, but for small groups it's fine.
    // To be safe with larger groups, we query them individually or in chunks.
    const userDocs = await Promise.all(
      targetUids.map(uid => db.collection('users').doc(uid).get())
    );

    userDocs.forEach(docSnap => {
      if (docSnap.exists) {
        const userData = docSnap.data();
        if (userData.fcmToken) {
          tokens.push(userData.fcmToken);
        }
      }
    });

    if (tokens.length === 0) {
      return res.status(200).json({ message: 'No push tokens found for group members' });
    }

    // 3. Send Multicast Message via FCM
    const message = {
      notification: {
        title: '☕ Pausa Caffè!',
        body: `${senderName} ti sta invitando a fare una pausa!`,
      },
      data: {
        type: 'invite',
        groupCode,
        coffeeType: coffeeType || 'espresso',
        click_action: 'FLUTTER_NOTIFICATION_CLICK' // Optional: useful if opening from background
      },
      tokens: tokens,
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    
    console.log(`Successfully sent ${response.successCount} messages. Failed: ${response.failureCount}`);
    
    return res.status(200).json({ 
      success: true, 
      sent: response.successCount, 
      failed: response.failureCount 
    });

  } catch (error) {
    console.error('Error sending invite push:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
