# FFmpeg Core Files

This directory contains the FFmpeg WebAssembly files required for browser-based media processing.

## Setup Instructions

1. Copy the following files from `node_modules/@ffmpeg/core/dist/` to this directory:
   - `ffmpeg-core.js`
   - `ffmpeg-core.wasm`
   - `ffmpeg-core.worker.js` (if it exists)

2. Make sure the files are accessible via browser at the following URLs:
   - `/ffmpeg/ffmpeg-core.js`
   - `/ffmpeg/ffmpeg-core.wasm`
   - `/ffmpeg/ffmpeg-core.worker.js` (if it exists)

## Troubleshooting

If you're encountering issues with FFmpeg:

1. Check that you're using the correct version of @ffmpeg/ffmpeg and @ffmpeg/core packages:

