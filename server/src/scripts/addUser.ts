import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from '../config/db';
import { User } from '../models/User';
import { Store } from '../models/Store';

async function addCustomUser() {
  await connectDB();

  const store = await Store.findOne();
  if (!store) {
    console.error('Store not found. Please run seed first.');
    process.exit(1);
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('Bhargavi@123', salt);

  const existing = await User.findOne({ username: 'bhargavitej' });
  if (existing) {
    existing.passwordHash = passwordHash;
    existing.role = 'OWNER';
    existing.permissions = ['all'];
    await existing.save();
    console.log('✅ Updated existing user "bhargavitej" with new password and OWNER role.');
  } else {
    await User.create({
      storeId: store._id,
      name: 'Bhargavi Battula',
      email: 'bhargavitej@freshstock.com',
      username: 'bhargavitej',
      passwordHash,
      role: 'OWNER',
      permissions: ['all'],
      active: true,
    });
    console.log('✅ Created new user "bhargavitej" with OWNER role and password.');
  }

  await disconnectDB();
}

addCustomUser()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error adding user:', err);
    process.exit(1);
  });
