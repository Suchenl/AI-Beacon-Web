# 📡 AI Beacon

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Tech](https://img.shields.io/badge/Built%20with-React%20%7C%20TypeScript%20%7C%20Gemini-purple)
![Status](https://img.shields.io/badge/Status-Active%20Research-green)
![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey)

**AI Beacon** is an intelligent, customizable **Personal Knowledge Base (PKB)** designed for AI Researchers and Engineers.

In an era where dozens of groundbreaking papers are released daily on ArXiv, keeping up is impossible. AI Beacon solves this by combining a structured mental map ("Pillars of AI") with **Agentic capabilities**. It doesn't just store links; it actively fetches summaries, updates citation counts, finds new related work, and acts as a tutor for complex concepts.

> **"Construct your personal map of Intelligence."**

---

## ✨ Key Features

### 🏗️ The 5 Pillars Architecture
The system comes pre-loaded with a curated ontology of modern AI, but is **fully customizable**:
1.  **Perception & Unified Models** (SSL, World Models, Multimodal)
2.  **Intelligence & Reasoning** (CoT, Neuro-symbolic, Long-context)
3.  **Agents & Interaction** (RL, Tool Use, Embodiment)
4.  **Safety & Alignment** (RLHF, Interpretability, Robustness)
5.  **Efficiency & Systems** (Scaling Laws, Quantization, FlashAttention)

### 🤖 AI-Powered Workflows (Powered by Gemini 2.5)
-   **✨ Magic Auto-Fill**: Add a paper by title (e.g., "DINOv3"), and the AI automatically fetches the authors, publication date, summary, GitHub stars, and PDF links.
-   **📊 Live Stats Sync**: One-click refresh to fetch the latest **Citation Counts** and **GitHub Stars** for any paper in your library.
-   **🔎 Research Radar**: Scan the web for the absolute latest papers (2024-2025) specific to a topic.
-   **📥 Smart Staging Area**: AI-discovered papers don't clutter your library immediately. They go to a staging area where you decide where to merge them.
-   **🎓 AI Tutor**: A built-in chat interface acting as a senior researcher to explain mathematical concepts or architectural details.

### 🛡️ Local-First & Collaborative
-   **Privacy Focused**: Your API Key stays in your browser. Data is stored in `localStorage`.
-   **Import/Export**: Share specific **Topics** (e.g., "Transformers") or entire **Pillars** with colleagues via JSON. Collaborative curation made easy.

### 🚀 Standalone Executables
-   **Cross-Platform**: Pre-built executables for Windows, macOS, and Linux
-   **One-Click Launch**: No need to install Node.js or manage dependencies
-   **Custom Icons**: Support for custom application icons

---

## 🚀 Getting Started

### Prerequisites
-   **Node.js** (v16 or higher) - *Only required for development mode*
-   A **Google Gemini API Key** (Get one for free [here](https://aistudio.google.com/app/apikey))

### Use Steps
1. **Clone the repository**
   ```bash
   git clone https://github.com/Suchenl/AI-Beacon-Web.git
   ```
2. **Grant permissions to executable files (for macOS, Windows can skip)**
   ```bash
   xattr -r -d com.apple.quarantine AI-Beacon-Web
   ```
3. **Install dependencies and initialize configurations** 
   - **Windows**: *Double-click* `AI-Beacon-Web\quick_start_win\init.bat`
   - **macOS**: *Double-click* `AI-Beacon-Web/quick_start_os/init.command`
  
4. **Run the App**
   - **Windows**: *Double-click* `AI-Beacon-Web\quick_start_win\run.bat`
   - **macOS**: *Double-click* `AI-Beacon-Web/quick_start_os/run.command`   

## 📖 Usage Guide

### 1. Edit Mode
Toggle the **"Edit Mode"** button in the top right header. This unlocks:
-   Creating/Deleting Pillars and Topics.
-   Drag-and-drop style management (future roadmap).
-   Manual addition of papers.

### 2. Adding a New Paper
1.  Enter a Topic (e.g., "Self-Supervised Learning").
2.  Click **"+ Add Paper manually"**.
3.  **The Lazy Way**: Type the paper title (e.g., *Masked Autoencoders*) and click **✨ AI Fill**.
4.  The system will browse the web and fill in the Summary, Date, Authors, and Code Links.
5.  Click Save.

### 3. Staying Updated
-   **Find New Papers**: Click the "🔎 Find New Papers" button inside any Pillar. The AI will search for recent breakthroughs (late 2024-2025) excluding what you already have.
-   **Refresh Stats**: Click the "Cycle/Refresh" icon on any paper card to update its Citation count and Star count from the live web.

### 4. Exporting & Sharing
-   **Export Pillar**: Click the download icon next to the Pillar title to save the entire domain as JSON.
-   **Export Topic**: Click the download icon next to a Topic title.
-   **Import**: Use the import buttons at the bottom of the Home screen (for Pillars) or the Topic list (for Topics) to load JSON files shared by others.

---

## 📁 Project Structure

```
ai-beacon/
├── assets/              # Resource files (icons, images)
├── public/              # Public assets
├── quick_start_win/
│   ├── init.bat         # Install dependencies and initialize configurations (for Windows)
│   ├── run.bat          # Run the App (for Windows)
├── quick_start_os/
│   ├── init.command         # Install dependencies and initialize configurations (for macOS)
│   ├── run.command          # Run the App (for macOS)
├── src/                 # Application source code
│   ├── App.tsx
│   ├── index.tsx
│   ├── View*.tsx
│   └── ...
├── index.html           # HTML template
├── package.json         # Node.js configuration
├── vite.config.ts       # Vite configuration
├── tsconfig.json        # TypeScript configuration
└── README.md            # This file
```

## 🛠️ Tech Stack

-   **Frontend**: React 19, TypeScript, Vite
-   **Styling**: Tailwind CSS
-   **AI/LLM**: Google Gemini API (`gemini-2.5-flash`) + Google Search Grounding
-   **Icons**: Heroicons / Custom SVG
-   **Markdown**: `react-markdown`
-   **Build Tools**: Go (for executable packaging)
-   
---

## 🤝 Contributing

Contributions are welcome! If you are a researcher, feel free to submit PRs to update the `INITIAL_PILLARS` constant with classic papers in your field.

### How to Contribute

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

### Development Guidelines

-   Follow the existing code style
-   Add documentation for new features
-   Update README if needed
-   Test your changes before submitting

---

## ⚠️ Disclaimer

This project performs **web scraping via LLM grounding**. Please respect rate limits and use responsibly. The default API key usage is client-side; **do not deploy this to a public URL** without adding a backend proxy to secure your API Key.

---

## 📄 License

Distributed under the Apache 2.0 License. See `LICENSE` for more information.

---

## 🙏 Acknowledgments

-   Built with [Vite](https://vitejs.dev/) and [React](https://react.dev/)
-   Powered by [Google Gemini](https://deepmind.google/technologies/gemini/)
-   Icons from [Heroicons](https://heroicons.com/)

---

## 📞 Support

-   **Issues**: [GitHub Issues](https://github.com/Suchenl/AI-Beacon-Web/issues)
---

**Made with ❤️ for the AI Research Community**
