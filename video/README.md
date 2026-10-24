# video

Remotion project for making videos about My Diary. Separate from the app; nothing here is loaded by `index.html`.

```sh
cd video
npm install
npm run dev      # Remotion Studio preview
npm run render   # writes out/intro.mp4
```

If Remotion can't download its own headless Chrome, pass a local one:
`npx remotion render Intro out/intro.mp4 --browser-executable=/path/to/chrome-headless-shell`
