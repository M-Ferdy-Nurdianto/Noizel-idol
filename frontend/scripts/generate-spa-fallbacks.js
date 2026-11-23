import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distDir = path.resolve(__dirname, '../dist')

if (!fs.existsSync(distDir)) {
  console.error('Dist directory does not exist')
  process.exit(1)
}

const indexHtml = path.join(distDir, 'index.html')
if (!fs.existsSync(indexHtml)) {
  console.error('index.html not found in dist')
  process.exit(1)
}

const htmlContent = fs.readFileSync(indexHtml, 'utf8')

// Routes in the application that need static physical entrypoints for 100% 200 OK fallback
const routes = [
  'shop',
  'admin',
  'admin/login',
  'story',
  'about',
  'events',
  'members',
  'music',
  'media',
  'faq'
]

// Also write 404.html as universal SPA fallback
fs.writeFileSync(path.join(distDir, '404.html'), htmlContent)
console.log('Generated: dist/404.html')

routes.forEach(route => {
  const targetDir = path.join(distDir, route)
  fs.mkdirSync(targetDir, { recursive: true })
  fs.writeFileSync(path.join(targetDir, 'index.html'), htmlContent)
  console.log(`Generated: dist/${route}/index.html`)
})

console.log('SPA fallbacks generated successfully!')
