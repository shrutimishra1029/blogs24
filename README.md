# Blogs24

Blogs24 is a personal learning project: a small blog website built to explore how websites work and how Firebase handles sign-in and stored data.

The main goal was learning by building. I used Firebase Authentication for Google sign-in and Cloud Firestore to save and retrieve users, blog posts, comments, likes, bookmarks, settings, and feedback.

## What I learned

- How pages built with HTML, CSS, and JavaScript fit together
- How Google sign-in works through Firebase Authentication
- How to read and write documents in Cloud Firestore
- How to represent relationships and activity (such as likes and comments) in stored data
- How to build responsive layouts and shared UI across multiple pages

## Features

- Browse, search, and filter blog posts
- Sign in with Google
- Create, edit, and delete blog posts
- Like, bookmark, and comment on posts
- View profiles and edit a display name or profile photo URL
- Manage user roles and view blog analytics
- Send feedback through the contact page
- Account preferences, including dark mode

Some features require a signed-in Firebase account. Admin pages also require an account with the appropriate role.

## Tech used

- HTML, CSS, and vanilla JavaScript
- Firebase Authentication
- Cloud Firestore
- Firebase JavaScript SDK (compat version, loaded from Google's CDN)
- Python's built-in HTTP server for local development

## Run locally

You need Node.js/npm and Python 3 installed. No npm packages need to be installed for this project.

From the project directory, run:

```bash
npm run dev
```

Then open [http://localhost:8000](http://localhost:8000).

Alternatively, start the server directly:

```bash
python -m http.server 8000
```

The site uses Firebase, so the Firebase project must be configured and available for authentication and database features to work.

## Firebase setup

1. Create a Firebase project in the [Firebase Console](https://console.firebase.google.com/).
2. Register a web app in that project and copy its Firebase web configuration.
3. In `firebase-auth.js`, replace the existing `firebaseConfig` values with your own project's web configuration.
4. In Firebase Authentication, enable Google as a sign-in provider.
5. Add your local and deployed hostnames to Authentication's authorized domains. For local development, this is usually `localhost`.
6. Create a Cloud Firestore database and configure Firestore Security Rules before using real accounts or data.

The Firebase web API key in `firebase-auth.js` is part of the browser app's public configuration; it is not an Admin SDK credential. Do not put Firebase service-account JSON files, private keys, passwords, or other server credentials in this project or commit them to GitHub. Firestore Security Rules—not hiding the web config or relying on UI role checks—must control access to data.

The project includes a `firestore.rules` policy. Review it against your needs, then publish it from **Firestore Database → Rules** in the Firebase Console. The policy allows public article reads, restricts article creation/editing/deletion and analytics to admins, restricts user-role management to superadmins, and permits signed-in users to like, bookmark, and comment. Admin and superadmin roles are read from protected `users` documents; never grant a role by editing browser code. User settings are stored separately from account roles, and public profile fields are stored separately from private account data.

Before publishing the rules, inspect the `users` collection in the Firebase Console and confirm that only trusted accounts have `admin` or `superadmin` roles. The database previously had public read/write rules, so do not assume the existing role records are trustworthy. If needed, use the Console to set your own `users/{your-email}` document's `role` field to the string `superadmin`; this bootstraps the first superadmin without allowing users to promote themselves in the app. Then paste the contents of `firestore.rules` into **Firestore Database → Rules** and publish. Test the app afterward with both a regular account and an admin account.

If you deploy with GitHub Pages or another static host, add that site's hostname to Firebase Authentication's authorized domains and confirm that the Firestore rules allow only the intended access.

## Project pages

- `index.html` — home page, search, and blog feed
- `article.html` — individual blog post and comments
- `profile.html`, `public-profile.html`, `edit-profile.html` — profile pages
- `liked.html`, `bookmarked.html` — saved activity
- `create-news.html`, `edit-news.html` — blog authoring
- `manage-users.html`, `analytics.html` — admin tools
- `settings.html`, `contact.html`, `subscription.html` — preferences and other pages
- `style.css` — shared styles and responsive layouts
- `firebase-auth.js` — Firebase setup and sign-in state

## Project status

This is a personal learning project, not a production service. It is intended for experimenting with web development and Firebase. Use test data unless you have reviewed and configured your Firebase security rules for your deployment.
