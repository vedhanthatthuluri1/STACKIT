# StackIt - A Minimal & Futuristic Q&A Forum

StackIt is a full-featured Q&A platform built with a modern, futuristic aesthetic. It allows users to ask questions, provide answers, vote on content, and build a community around solving technical problems. The project leverages Next.js for the frontend and Firebase for the backend services, including authentication, database, and storage.

## Core Features

-   **User Authentication**: Secure user sign-up and login using Firebase Authentication (Email/Password).
-   **Ask & Answer Questions**: Users can post questions and answers using a rich text editor.
-   **Voting System**: Upvote and downvote answers to highlight the most helpful solutions.
-   **Accepted Answers**: Question authors can mark one answer as the accepted solution.
-   **User Profiles**: Public user profiles displaying activity, reputation, questions, and answers.
-   **Tagging System**: Categorize questions with tags for easy discovery.
-   **AI-Powered Search**: Utilizes Genkit to provide intelligent search across all questions.
-   **Real-time Notifications**: Users get notified about new answers to their questions.

## Technology Stack

-   **Framework**: [Next.js](https://nextjs.org/) (with App Router)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **UI Components**: [ShadCN/UI](https://ui.shadcn.com/)
-   **Backend**: [Firebase](https://firebase.google.com/) (Authentication, Firestore, Storage)
-   **Generative AI**: [Genkit](https://firebase.google.com/docs/genkit)
-   **Language**: TypeScript
-   **Form Management**: React Hook Form with Zod for validation

---

## Getting Started

Follow these instructions to get a local copy up and running for development and testing purposes.

### Prerequisites

-   [Node.js](https://nodejs.org/en) (v18 or later)
-   [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
-   A [Firebase](https://firebase.google.com/) account with an active project.

### 1. Clone the Repository

First, clone the project to your local machine:

```bash
git clone <your-repository-url>
cd stackit-project
```

### 2. Install Dependencies

Install the necessary npm packages:

```bash
npm install
```

### 3. Firebase Setup

This project requires a Firebase project to handle backend services.

#### a. Create a Firebase Project

1.  Go to the [Firebase Console](https://console.firebase.google.com/).
2.  Click **Add project** and follow the on-screen instructions to create a new project.

#### b. Set Up Firebase Services

You need to enable Authentication, Firestore, and Storage.

1.  **Authentication**:
    -   In the Firebase Console, go to **Authentication** (under the Build menu).
    -   Click **Get started**.
    -   Under the **Sign-in method** tab, enable the **Email/Password** provider.

2.  **Firestore Database**:
    -   Go to **Firestore Database** (under the Build menu).
    -   Click **Create database**.
    -   Start in **Test mode** for initial development (you can update security rules later).
    -   Choose a location for your database.

3.  **Storage**:
    -   Go to **Storage** (under the Build menu).
    -   Click **Get started**.
    -   Follow the prompts to create a default storage bucket. You'll need to update the storage security rules to allow uploads. Navigate to the `Rules` tab and paste the following:
    ```
    rules_version = '2';
    service firebase.storage {
      match /b/{bucket}/o {
        match /{allPaths=**} {
          allow read;
          allow write: if request.auth != null;
        }
      }
    }
    ```

#### c. Configure Environment Variables

You need to connect your frontend application to your Firebase project.

1.  In the Firebase Console, go to your **Project Settings** (click the gear icon).
2.  Under the **General** tab, scroll down to "Your apps".
3.  Click the **Web** icon (`</>`) to create a new web app.
4.  Give it a nickname and register the app.
5.  Firebase will provide you with a `firebaseConfig` object. Copy these keys.
6.  In your project's root directory, create a file named `.env`.
7.  Add your Firebase config keys to the `.env` file like this:

    ```env
    NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
    NEXT_PUBLIC_FIREBASE_APP_ID=1:...:web:...
    ```

### 4. Apply Firestore Security Rules

The project comes with a `firestore.rules` file that contains the necessary security rules. You must deploy these to your Firebase project.

1.  Install the Firebase CLI if you haven't already: `npm install -g firebase-tools`
2.  Log in to Firebase: `firebase login`
3.  Deploy the rules: `firebase deploy --only firestore:rules`

### 5. Run the Application

The application requires two separate development servers to run concurrently in different terminal tabs.

**Terminal 1: Run the Next.js Frontend**

```bash
npm run dev
```
This will start the main application, usually on `http://localhost:9002`.

**Terminal 2: Run the Genkit AI Server**

```bash
npm run genkit:dev
```
This starts the Genkit server that handles the AI-powered search.

Your application should now be fully up and running!

---

## Firestore Data Structure

Your Firestore database will be populated with the following collections as you use the app:

-   `users`: Stores user profile information.
    -   Document ID: `user.uid`
    -   Fields: `uid`, `username`, `displayName`, `email`, `reputation`, `createdAt`, `photoURL`
-   `questions`: Stores all the questions posted.
    -   Document ID: (auto-generated)
    -   Fields: `title`, `description`, `tags`, `authorId`, `authorName`, `votes`, etc.
    -   `answers` (subcollection): Stores answers for a specific question.
-   `notifications`: Stores notifications for users (e.g., when their question gets an answer).

No manual setup of these collections is required; they will be created automatically as users interact with the application.
```