# GPU Acceleration Alternatives for Video Conversion

This document outlines the alternatives to `ffmpeg.wasm` to enable GPU-accelerated video transcoding for the Shadowing Video App.

## Analysis of Current State
The current implementation uses `ffmpeg.wasm`, which runs entirely on the **CPU** via WebAssembly. While portable, it is slow for large files or complex transcodes.

## GPU-Accelerated Alternatives

### 1. The "Pure Browser" Path: WebCodecs API (No Backend)
If you want to keep the app as a simple web page but get GPU speeds, you can use the **WebCodecs API**.
- **How it works**: Instead of running the entire FFmpeg engine in WASM (CPU), WebCodecs gives the browser direct access to your GPU's hardware encoder/decoder (NVENC, QuickSync, etc.).
- **The Strategy**: You use WebCodecs for the heavy lifting (decoding and encoding frames) and use a very small version of `ffmpeg.wasm` **only for "muxing"** (putting those frames into an `.mp4` container).
- **Pros**: No backend to install; near-native GPU speed.
- **Cons**: More complex to implement than the current solution.

### 2. The "Local Node.js" Path: NodeAV / Mediabunny (Local Backend)
Since your project is already in TypeScript/Node, this is the most natural upgrade.
- **How it works**: You create a small Node.js server on your PC. Instead of using a WASM wrapper, you use **NodeAV** or **Mediabunny**, which are native C-bindings to the FFmpeg libraries.
- **GPU Acceleration**: These bindings can trigger **NVENC (Nvidia)**, **AMF (AMD)**, or **VideoToolbox (Apple)**.
- **The Strategy**: The frontend uploads the file to your local server $\rightarrow$ the server transcodes it using the GPU $\rightarrow$ the server sends back the browser-friendly file.
- **Pros**: Massive speed increase; professional-grade control over codecs.
- **Cons**: Requires running a local server process.

### 3. The "Power User" Path: Rivet (Standalone Service)
If you want a dedicated, high-performance transcoding engine.
- **How it works**: **Rivet** is a Rust-based service designed specifically for GPU transcoding. It can run as a background service on your PC and exposes an **HTTP API**.
- **The Strategy**: Your React app sends a REST request to `http://localhost:PORT/transcode` $\rightarrow$ Rivet handles the job using direct vendor FFI (Fastest possible path to GPU) $\rightarrow$ your app downloads the result.
- **Pros**: Highest possible efficiency; "Decode once, encode many" architecture.
- **Cons**: Requires installing a separate Rust-based binary on your system.

## Summary Comparison

| Option | Hardware | Backend Needed? | Speed | Effort |
| :--- | :--- | :--- | :--- | :--- |
| **Current (`ffmpeg.wasm`)** | CPU | No | 🐌 Slow | Low |
| **WebCodecs** | GPU | No | 🚀 Fast | High |
| **NodeAV / Mediabunny** | GPU | Yes (Node.js) | 🚀 Fast | Medium |
| **Rivet** | GPU | Yes (Rust API) | ⚡ Ultra | Medium |

**Recommendation:**
If you want to avoid the complexity of a full backend but want speed, explore **WebCodecs**. However, if you are comfortable running a local server, **NodeAV/Mediabunny** is the best fit for your current TypeScript stack and will provide an immediate, massive performance boost.

## Sources
- [Rivet Transcoder GitHub](https://github.com/rivet-transcoder/rivet)
- [NodeAV Hardware Transcode Example](https://github.com/seydx/node-av/blob/main/examples/api-hw-transcode.ts)
- [Mediabunny Server Documentation](https://github.com/vanilagy/mediabunny/blob/main/packages/server/README.md)
- [JAD Video: Hardware AV1 in Browser](https://jadapps.app/video-tools/solutions/encode-av1-hardware-accelerated-rtx-arc-m3)
- [WebCVT GitHub](https://github.com/Junhui20/webcvt/blob/main/README.md)
