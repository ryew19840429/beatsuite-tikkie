# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Deployment to Google Cloud Run

This project is configured for easy deployment to Google Cloud Run.

### Prerequisites

1.  **Google Cloud SDK**: Ensure you have the `gcloud` CLI installed and authenticated.
    *   `gcloud auth login`
    *   `gcloud config set project [YOUR_PROJECT_ID]`
2.  **Billing Enabled**: Your Google Cloud project must have billing enabled.
3.  **APIs Enabled**: Enable the Cloud Run and Artifact Registry APIs.
    *   `gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com`

### Deploy

Run the following command in your terminal:

```bash
gcloud run deploy nurse-voice-chat --source . --allow-unauthenticated --region us-central1
```

*   **`--source .`**: Uploads the current directory to Cloud Build, which builds the Docker image using the included `Dockerfile`.
*   **`.gcloudignore`**: This file ensures your `.env` file (containing `VITE_GEMINI_API_KEY`) is included in the build, while excluding `node_modules` and `.git`.
*   **`--allow-unauthenticated`**: Makes the app publicly accessible.

Once the command completes, it will output a **Service URL** where you can access your live application.
