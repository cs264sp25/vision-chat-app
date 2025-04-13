# Vision Chat

A simple ChatGPT-like application that allows you leverage image generation and image analysis capabilities of OpenAI's LLMs.

## OpenAI API

This project uses the OpenAI API. You need to create an account and get an API key to use the API. Consult the [quick start guide](https://platform.openai.com/docs/quickstart) for instructions.

## Convex

This project uses [Convex](https://convex.dev/) for the backend. You need to create a free account.

## Run locally

Clone the repository and install the dependencies.

```bash
cd vision-chat
pnpm install
```

Run the following command to start the Convex development server.

```bash
npx convex dev
```

The first time you run the command, you will be asked to log in to your Convex account. Follow the instructions in the terminal. It will also ask you to create a new project. You can use the default settings.

Once the development server is running, you will see a `.env.local` file in the project root. Don't modify this file directly. Don't commit this file to the repository either.

At this point, you need to set you OpenAI API key. Run the following command:

```bash
npx convex env set OPENAI_API_KEY sk-...
```

This needs to be done only once. The API key will be stored on the Convex server and will be used every time you run the development server. From this point on, you can start the Convex development server with the following command:

```bash
npx convex dev
```

Finally, run the following command to start the frontend development server.

```bash
pnpm dev
```

Open the browser and navigate to <http://localhost:5173/>.
