# NoteNest Authentication Setup Guide

## Overview

This guide provides comprehensive instructions for setting up and managing the Firebase Authentication system for NoteNest, which restricts access to only two authorized users through email whitelisting.

## Prerequisites

Before proceeding with the setup, ensure you have:

1. **Firebase Project**: A Firebase project with Firestore and Authentication enabled
2. **Firebase Console Access**: Administrative access to the Firebase Console
3. **User Email Addresses**: The two email addresses that should have access to the application

## Step 1: Firebase Console Configuration

### Enable Authentication Methods

1. Navigate to your Firebase Console: https://console.firebase.google.com/
2. Select your project (`usss-8d9b6`)
3. Go to **Authentication** > **Sign-in method**
4. Enable **Email/Password** authentication:
   - Click on "Email/Password"
   - Toggle "Enable" to ON
   - Click "Save"

### Configure Authorized Domains

1. In the Authentication section, go to **Settings** > **Authorized domains**
2. Add your deployment domain (e.g., `your-domain.com`)
3. For local testing, `localhost` should already be included

## Step 2: Update Email Whitelist

### In the Application Code

Update the whitelisted email addresses in two locations:

#### 1. Update `scripts/auth.js`

```javascript
this.whitelistedEmails = [
    'first.user@example.com',    // Replace with actual email 1
    'second.user@example.com'    // Replace with actual email 2
];
```

#### 2. Update `firestore.rules`

```javascript
function isWhitelisted() {
  return isAuthenticated() && 
         request.auth.token.email in [
           'first.user@example.com',  // Replace with actual email 1
           'second.user@example.com'  // Replace with actual email 2
         ];
}
```

## Step 3: Deploy Firestore Security Rules

### Using Firebase CLI

1. Install Firebase CLI if not already installed:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize Firebase in your project directory:
   ```bash
   firebase init firestore
   ```

4. Deploy the security rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

### Using Firebase Console (Alternative)

1. Go to **Firestore Database** > **Rules**
2. Copy the contents of `firestore.rules` file
3. Paste into the rules editor
4. Click "Publish"

## Step 4: Create User Accounts

### Method 1: Firebase Console (Recommended)

1. Go to **Authentication** > **Users**
2. Click "Add user"
3. Enter the email address and a temporary password
4. Click "Add user"
5. Repeat for the second user

### Method 2: User Self-Registration

1. Temporarily modify the whitelist to include the user's email
2. Have the user visit the login page and attempt to sign in
3. They will need to create an account first (you may need to implement registration)
4. Once account is created, they can sign in normally

## Step 5: Testing the Authentication

### Test Scenarios

1. **Authorized User Login**:
   - Use one of the whitelisted email addresses
   - Should successfully log in and access the application

2. **Unauthorized User Login**:
   - Use an email not in the whitelist
   - Should see "Access denied" error message

3. **Direct URL Access**:
   - Try accessing `index.html` directly without logging in
   - Should automatically redirect to `login.html`

4. **Logout Functionality**:
   - Click the logout button in the main application
   - Should redirect to login page

## Step 6: Password Management

### Password Reset

Users can reset their passwords using the "Forgot your password?" link on the login page. This will:

1. Check if the email is in the whitelist
2. Send a password reset email if authorized
3. Show an error if the email is not whitelisted

### Admin Password Reset

As an administrator, you can reset user passwords through the Firebase Console:

1. Go to **Authentication** > **Users**
2. Find the user and click the menu (three dots)
3. Select "Reset password"
4. The user will receive a password reset email

## Security Considerations

### Email Whitelist Security

- The email whitelist is hardcoded in both client-side JavaScript and Firestore rules
- Client-side validation is for user experience only
- Server-side validation (Firestore rules) provides actual security
- Always update both locations when modifying the whitelist

### Firestore Security Rules

The security rules implement multiple layers of protection:

1. **Authentication Check**: User must be signed in
2. **Email Verification**: User's email must be in the whitelist
3. **Data Isolation**: Users can only access the notes collection
4. **Write Protection**: Only authenticated and whitelisted users can write data

### Best Practices

1. **Regular Security Audits**: Periodically review who has access
2. **Strong Passwords**: Encourage users to use strong, unique passwords
3. **Monitor Usage**: Use Firebase Analytics to monitor application usage
4. **Backup Data**: Regularly backup Firestore data
5. **Update Dependencies**: Keep Firebase SDK and other dependencies updated

## Troubleshooting

### Common Issues

#### "Access denied" for Authorized Users

**Possible Causes**:
- Email address mismatch (check for typos, case sensitivity)
- Firestore rules not deployed
- User account not created in Firebase Authentication

**Solutions**:
1. Verify email addresses in both `auth.js` and `firestore.rules`
2. Check Firebase Console > Authentication > Users
3. Redeploy Firestore rules

#### Login Page Not Redirecting

**Possible Causes**:
- JavaScript errors preventing authentication flow
- Firebase configuration issues
- Network connectivity problems

**Solutions**:
1. Check browser console for JavaScript errors
2. Verify Firebase configuration in `firebaseConfig.js`
3. Test with different browsers/devices

#### Firestore Permission Denied

**Possible Causes**:
- Security rules not properly deployed
- User not authenticated
- Email not in whitelist

**Solutions**:
1. Check Firestore rules in Firebase Console
2. Verify user authentication status
3. Confirm email is in whitelist

### Debug Mode

To enable debug logging, add this to your browser console:

```javascript
// Enable Firebase Auth debug logging
firebase.auth().useDeviceLanguage();
```

## Maintenance

### Adding New Users

To add a new authorized user:

1. Update the whitelist in `scripts/auth.js`
2. Update the whitelist in `firestore.rules`
3. Deploy the updated rules to Firebase
4. Create the user account in Firebase Console
5. Test the new user's access

### Removing Users

To remove a user:

1. Remove email from whitelist in `scripts/auth.js`
2. Remove email from whitelist in `firestore.rules`
3. Deploy the updated rules
4. Optionally disable the user account in Firebase Console

### Monitoring

Monitor your application through:

1. **Firebase Console > Authentication**: View user sign-ins
2. **Firebase Console > Firestore > Usage**: Monitor database usage
3. **Browser Developer Tools**: Check for JavaScript errors
4. **Firebase Console > Analytics**: Track user engagement

## Support

For additional support:

1. **Firebase Documentation**: https://firebase.google.com/docs
2. **Firebase Support**: Available through Firebase Console
3. **Community Forums**: Stack Overflow with `firebase` tag

---

**Note**: Remember to replace all placeholder email addresses with actual email addresses before deployment.

