/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    MODAL_BACKEND_URL: process.env.MODAL_BACKEND_URL || 'http://localhost:8000'
  }
}

export default nextConfig