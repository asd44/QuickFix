# Deploying QuickFix Cloud Functions

Since this is the first time you are deploying Cloud Functions for this project, follow these steps:

## Prerequisites
Ensure `firebase-tools` is installed:
```bash
npm install -g firebase-tools
```

## Step 1: Install Dependencies
The `functions` folder needs its own dependencies installed.

```bash
cd functions
npm install
cd ..
```

## Step 2: Login to Firebase
If you haven't already:
```bash
firebase login
```

## Step 3: Deploy Functions
Run the deploy command specifically for functions:
```bash
firebase deploy --only functions
```

### Troubleshooting
- **Missing Project**: If it says no project is active, run `firebase use --add` and select your project (`quickfix-12345`).
- **Permissions**: Ensure you have the 'Editor' or 'Owner' role on the Firebase project.
- **Node Version**: The functions are configured for Node 18. Ensure your local environment supports it (though Firebase handles the runtime).

## Step 4: Verify
Once deployed, check the [Firebase Console > Functions](https://console.firebase.google.com/) tab. You should see:
- `onBookingCreated`
- `onBookingStatusChanged`
- `onMessageCreated`
