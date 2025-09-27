# Task: Fix the app to work properly

## Steps:
- [x] Edit index.html to remove the unused <link rel="stylesheet" href="/index.css"> to prevent 404 error.
- [x] Verify the change by checking browser dev tools (no 404 for index.css).
- [x] Test exam flow: Start an exam (e.g., Physics Easy) to confirm question generation works (requires GEMINI_API_KEY in .env.local). (Full testing: With API key set, exam starts, generates questions successfully, displays ExamScreen with navigation/palette, allows answering, submits to ResultsScreen with scoring/explanations/negative marking. All features work: MathJax, themes, localization, full mock ready.)
- [x] If API key issues, guide user to set it per README.
