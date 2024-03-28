Here I would be documenting few things, I explored and did some assumptions which made this app possible. This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app). Please jump to this [section](#getting-started) for running this app.

# Important Settings

## Exporting Next-js app

Exporting Next-JS app was bit confusing for me at first, have spent a lot of time.

### Expectations

-   when the command line has this particular directory as its root then it should be able to use the command `npm run export`
-   after running the export command, it should avoid linting next-js as it would be taken care before deploying the changes.
-   First it generates the `antd.min.css` in the `styles` directory. the above file is not distributed. `scripts/genAntdCSS.ts` generates the file
-   and then it would generate the html files inside the requested output directory through `next build` command.

### Changes made

-   `next.config.js`
    -   we made output as `export`
    -   informed to transpile `handshake` (current package)
    -   added rules inside of webpack to enable custom icons in `antd`
-   `package.json`
    -   Added `predev` and `prebuild` command which would generate the antd css file

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.tsx`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/api-routes/introduction) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.ts`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/api-routes/introduction) instead of React pages.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

-   [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
-   [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

## Note

<a target="_blank" href="https://icons8.com/icon/gXoJoyTtYXFg/windows-10">Windows</a> icon by <a target="_blank" href="https://icons8.com">Icons8</a>
<a href="https://www.flaticon.com/free-icons/linux" title="linux icons">Linux icons created by Freepik - Flaticon</a>
