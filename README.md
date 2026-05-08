<div align="center">
  <h1>🔐 KeyVault Web Client</h1>
  <p><strong>The Secure, Zero-Knowledge Interface for Your Digital Vault</strong></p>

  <p>
    <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E" alt="Vite" />
    <img src="https://img.shields.io/badge/Chakra_UI-319795?style=for-the-badge&logo=chakra-ui&logoColor=white" alt="Chakra UI" />
    <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License" />
  </p>
</div>

---

## 📖 Overview

**KeyVault Web** is the official front-end client for the KeyVault ecosystem. It provides an intuitive, modern interface for generating, securely storing, and managing your sensitive credentials and passkeys.

This client enforces our **Zero-Knowledge Architecture**. It acts as the frontline of your security, ensuring that all encryption and decryption operations happen *locally on your device*. Your master password and derived encryption keys never leave this application.

---

## ✨ Features

- 🔒 **Zero-Knowledge by Default:** True end-to-end encryption. The server only ever receives ciphertexts.
- 🚀 **Next-Gen Authentication:** Seamless, passwordless login flows powered by **Passkeys (WebAuthn)**.
- 🎨 **Modern SPA Interface:** A highly responsive Single Page Application built with **React** and styled via **Chakra UI** & **TailwindCSS**.
- 🌓 **Adaptive Theming:** First-class Dark & Light mode support via `next-themes`.
- 📱 **Mobile-First Design:** Optimized layouts that work flawlessly across desktop, tablet, and mobile browsers.

---

## 🏗️ Secure Client Architecture

The Web Client is exclusively responsible for cryptographic key derivation and data encryption, abstracting the process away from the KeyVault Core API. 

```text
┌─────────────────────────┐               ┌─────────────────────────┐
│     KEYVAULT WEB APP    │               │   KEYVAULT CORE API     │
│                         │               │                         │
│ 1. Key Derivation       │   Ciphertext  │ 1. Authenticate Request │
│ 2. Local App Encryption ──┼───────────────┼─► 2. Validate Access    │
│ 3. Secure Transport     │               │ 3. Store Encrypted Data │
│                         │               │                         │
└─────────────────────────┘               └─────────────────────────┘
```

> **Implementation Note:** All sensitive payloads are pre-encrypted locally within the browser context before reaching the network layer. The server explicitly rejects unencrypted payloads and lacks the mechanisms to derive your master key.

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/alphadevking/keyvault.git
   cd keyvault
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Access the application:**
   Open your browser and navigate to `http://localhost:6252`

---

## 🛠️ Scripts & Tooling

- **`npm run dev`**: Spin up the lightning-fast development server via Vite.
- **`npm run build`**: Execute the TypeScript compiler and build the optimized production bundle.
- **`npm run lint`**: Analyze the codebase with ESLint to maintain high code quality.
- **`npm run preview`**: Boot a local web server to preview the production build locally.

---

## ⚖️ License

This project is licensed under the **MIT License**. For full details, please refer to the [LICENSE](LICENSE) file.

### Why MIT?
We believe in **"Security through Transparency."** By open-sourcing our client-side logic under the MIT license, we allow seamless independent audits of our cryptographic implementations, ensuring trust and verification of the Zero-Knowledge architecture.

---

## 👤 Author

**Nexhub Labs**
- Email: [nexhublabs@gmail.com](mailto:nexhublabs@gmail.com)
- GitHub: [@alphadevking](https://github.com/alphadevking)