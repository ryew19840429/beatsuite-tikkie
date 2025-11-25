# Beatsuite Hackathon

![Beatsuite Screenshot](image.png)

**Beatsuite** is an interactive, AI-powered 3D environment designed to simulate and manage ambient conditions for child care. It combines dynamic lighting, generative music, and a circadian rhythm clock to create an optimal environment, all controlled via a voice-activated AI interface.

## 🚀 Tech Stack

*   **Frontend Framework**: [React](https://react.dev/) (v19)
*   **Build Tool**: [Vite](https://vitejs.dev/)
*   **3D Graphics**: [Three.js](https://threejs.org/) with [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) & [Drei](https://github.com/pmndrs/drei)
*   **AI Integration**: [Google Gemini API](https://ai.google.dev/) (@google/genai)
*   **Animations**: [Framer Motion](https://www.framer.com/motion/)
*   **Testing**: [Vitest](https://vitest.dev/) & React Testing Library

## ✨ Features

1.  **Dynamic Ambiance Control**: Real-time adjustment of lights and music based on research-backed presets for child care.
2.  **Generative Music**: Integration with Google's Lyria 2 music generation engine for dynamic soundscapes.
3.  **AI Nurse Assistant**: A voice-activated AI that interprets user descriptions of symptoms and suggests appropriate environmental settings.
4.  **Interactive 3D Room**: A fully navigable 3D environment where users can rearrange furniture to test different layouts and lighting effects.
5.  **Circadian Rhythm Clock**: A simulated clock that tracks the child's daily cycle, influencing the environment's state.

## 🛠️ Running Locally

### Prerequisites

*   **Node.js**: v18 or higher recommended.
*   **npm**: Included with Node.js.
*   **Gemini API Key**: You need a valid API key from Google AI Studio.

### Installation

1.  Navigate to the project directory.
2.  Install dependencies:
    ```bash
    npm install
    ```

### Configuration

1.  Create a `.env` file in the root directory.
2.  Add your Gemini API key:
    ```env
    VITE_GEMINI_API_KEY=your_api_key_here
    ```

### Development

Start the development server:
```bash
npm run dev
```
Open your browser and navigate to the URL shown in the terminal (usually `http://localhost:5173`).

## 🧪 Unit & Integration Tests

This project uses **Vitest** for testing. The tests verify the integration between the Music Generator, Light settings, and the Circadian Clock to ensure the environment reacts correctly to state changes.

To run the tests:
```bash
npm run test
```

## ☁️ Deployment to Google Cloud Run

This project is configured for easy deployment to Google Cloud Run.

### Prerequisites

1.  **Google Cloud SDK**: Ensure `gcloud` CLI is installed and authenticated.
    *   `gcloud auth login`
    *   `gcloud config set project [YOUR_PROJECT_ID]`
2.  **Billing Enabled**: Your Google Cloud project must have billing enabled.
3.  **APIs Enabled**: Enable Cloud Run and Artifact Registry APIs.
    *   `gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com`

### Deploy

Run the following command in your terminal:

```bash
gcloud run deploy beatsuite-tikkie --source . --allow-unauthenticated --region us-central1
```

*   **`--source .`**: Uploads the current directory to Cloud Build.
*   **`.gcloudignore`**: Ensures `.env` (with your API key) is included in the build, while excluding `node_modules` and `.git`.
*   **`--allow-unauthenticated`**: Makes the app publicly accessible.

Once completed, the command will output a **Service URL** to access your live application.
