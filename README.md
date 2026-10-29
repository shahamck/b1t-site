# B1T Studios

Website for B1T Studios, a web design & development studio. Two ASCII hands reach for each other, the spark between them grows into a ball of characters, and the ball becomes the B1T logo.

Built with Vite, GSAP (ScrollTrigger, SplitText) and Lenis. The ASCII scenes are drawn on 2D canvas.

```bash
npm install
npm run dev
```

- `src/stage.js`: the hero canvas (hands → spark → logo)
- `src/hands.js`: the two hands, built from tapered capsules
- `src/logo.js`: the B1T wordmark, traced from the brand artwork
- `src/covers.js`: the projects shown in the work section (screenshots in `public/work/`)

Pushing to `main` deploys to GitHub Pages.
