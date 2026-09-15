import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// IMPORTANT: change 'org-manager' to your actual GitHub repo name.
// If your repo is https://github.com/yourname/org-manager, base stays '/org-manager/'.
// If you deploy to a custom domain or a *.github.io user/org page, set base to '/'.
export default defineConfig({
  plugins: [react()],
  base: '/simaqom/',
})
