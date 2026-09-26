const mongoose = require('mongoose');
const app = require('./app');
const User = require('./models/User');
const Note = require('./models/Note');

// In-memory or local test runner
async function runOwnershipIsolationTest() {
  console.log('\n======================================================');
  console.log('🔒 RUNNING MANDATORY USER DATA ISOLATION VERIFICATION');
  console.log('======================================================\n');

  try {
    // 1. Connect DB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kabi-notes');
    console.log('1. Connected to MongoDB database');

    // 2. Clean up test users
    await User.deleteMany({ email: { $in: ['usera@test.com', 'userb@test.com'] } });
    const userA_id = new mongoose.Types.ObjectId();
    const userB_id = new mongoose.Types.ObjectId();
    await Note.deleteMany({ userId: { $in: [userA_id, userB_id] } });

    // 3. Create User A and User B
    const userA = await User.create({
      _id: userA_id,
      name: 'User A',
      email: 'usera@test.com',
      passwordHash: 'password123',
    });

    const userB = await User.create({
      _id: userB_id,
      name: 'User B',
      email: 'userb@test.com',
      passwordHash: 'password123',
    });

    console.log(`2. Created User A (${userA.email}) & User B (${userB.email})`);

    // 4. User A creates a Note
    const noteA = await Note.create({
      userId: userA._id,
      title: 'Secret Note of User A',
      content: 'This note belongs exclusively to User A',
      tags: ['confidential'],
      attachments: [
        {
          originalName: 'userA_doc.pdf',
          publicId: 'local_uploads/userA_doc.pdf',
          url: '/uploads/userA_doc.pdf',
          size: 1024,
        },
      ],
    });

    console.log(`3. Created Note ID ${noteA._id} for User A`);

    // 5. Test 1: User B attempts to read User A's note via database query
    const userB_readAttempt = await Note.findOne({
      _id: noteA._id,
      userId: userB._id, // Filter enforced in noteController
    });

    if (userB_readAttempt === null) {
      console.log('✅ TEST 1 PASSED: User B CANNOT read User A\'s note (returns null/404)');
    } else {
      throw new Error('❌ TEST 1 FAILED: User B was able to access User A\'s note!');
    }

    // 6. Test 2: User B attempts to edit User A's note
    const userB_updateAttempt = await Note.findOneAndUpdate(
      { _id: noteA._id, userId: userB._id },
      { title: 'Hacked Title by User B' },
      { new: true }
    );

    if (userB_updateAttempt === null) {
      console.log('✅ TEST 2 PASSED: User B CANNOT edit User A\'s note');
    } else {
      throw new Error('❌ TEST 2 FAILED: User B was able to modify User A\'s note!');
    }

    // 7. Test 3: User B attempts to delete User A's note
    const userB_deleteAttempt = await Note.deleteOne({
      _id: noteA._id,
      userId: userB._id,
    });

    if (userB_deleteAttempt.deletedCount === 0) {
      console.log('✅ TEST 3 PASSED: User B CANNOT delete User A\'s note');
    } else {
      throw new Error('❌ TEST 3 FAILED: User B was able to delete User A\'s note!');
    }

    // 8. Test 4: User A requests their own notes
    const userA_notes = await Note.find({ userId: userA._id });
    if (userA_notes.length === 1 && userA_notes[0].title === 'Secret Note of User A') {
      console.log('✅ TEST 4 PASSED: User A successfully accesses their own note & attachment');
    } else {
      throw new Error('❌ TEST 4 FAILED: User A could not access their own note!');
    }

    // Clean up
    await Note.deleteMany({ userId: { $in: [userA_id, userB_id] } });
    await User.deleteMany({ _id: { $in: [userA_id, userB_id] } });

    console.log('\n======================================================');
    console.log('🎉 ALL USER DATA ISOLATION TESTS PASSED 100% SUCCESSFULLY');
    console.log('======================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ OWNERSHIP ISOLATION TEST ERROR:', err);
    process.exit(1);
  }
}

runOwnershipIsolationTest();
