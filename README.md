# 2x2 Matrix Game Website

This is a static web app that solves 2x2 zero-sum matrix games and shows the optimal mixed strategies and game value.

How to run locally:

1. Use any static server (Python example):
   - `python3 -m http.server 8000 -d .`
2. Open `http://localhost:8000` in your browser.

Deploy to GitHub Pages:

- Push this repo to GitHub with default branch `main` or `master`.
- GitHub Actions workflow `.github/workflows/pages.yml` will build and deploy automatically to Pages.