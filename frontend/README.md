# FrameVerse frontend

React single-page application built with Vite and React Router. Internal navigation uses client-side routes, preserving the shared layout and query cache without reloading the document.

## Run locally

```sh
npm install
npm run dev
```

Vite serves the app at http://localhost:5173 and proxies `/api`, `/sanctum`, and `/storage` to Laravel at http://127.0.0.1:8000. Set `VITE_API_TARGET` in `.env.local` to change the backend address.

## Build and preview

```sh
npm run build
npm run preview
```

## Production hosting

Serve `dist/` as static files. Configure the host to serve `index.html` for frontend routes such as `/movies` and `/title/example`, so refreshes and direct links work. Route `/api`, `/sanctum`, and `/storage` to Laravel before applying this fallback; Vite's development proxy does not configure a production server.

For Nginx, the frontend location typically uses:

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

Use this with your host's document root pointing to `dist/` and the separate Laravel proxy locations.
