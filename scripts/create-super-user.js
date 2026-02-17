#!/usr/bin/env node

/**
 * Script to create the first super user
 * Usage: node scripts/create-super-user.js
 */

const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || 'KU/jmcVMHc+OMUMZPJgj9V+oBMrx7PiA2vCB/6M6Ggk=';

async function createSuperUser() {
    try {
        console.log('Creating super user...\n');

        const response = await fetch('http://localhost:3000/api/users/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'ikymasie@gmail.com',
                password: '12345678',
                firstName: 'Super',
                lastName: 'User',
                role: 'super_regulator',
                secret: NEXTAUTH_SECRET,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to create user');
        }

        console.log('✅ Super user created successfully!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('User ID:', data.user.id);
        console.log('Email:', data.user.email);
        console.log('Password: 12345678');
        console.log('Role:', data.user.role);
        console.log('Firebase UID:', data.user.firebaseUid);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\nYou can now login with these credentials at http://localhost:3000');
    } catch (error) {
        console.error('Error:', error.message);
        console.log('\nMake sure the development server is running:');
        console.log('  npm run dev');
        process.exit(1);
    }
}

createSuperUser();
