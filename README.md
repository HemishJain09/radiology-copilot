# Radiology Copilot AI

Radiology Copilot AI is an end-to-end clinical workflow automation system designed to assist radiologists. It automates disease detection, generates structured medical reports, and features an RLHF (Reinforcement Learning from Human Feedback) loop to continuously improve the underlying AI models.

## 🚀 Features
- **AI-Powered Disease Detection:** Uses YOLOv8 (via Hugging Face Spaces) to draw bounding boxes around abnormalities like Pneumothorax, Cardiomegaly, etc.
- **Automated Report Generation:** Uses Google's MedGemma LLM (via Hugging Face Spaces) to draft structured clinical reports based on detected findings.
- **Smart Case Routing (LangGraph):** Automatically routes low-confidence or critical cases to Senior Radiologists and normal cases to a fast-track queue.
- **RLHF Loop:** A built-in Review Dashboard allowing doctors to edit reports and provide reward signals (+1, -0.5, etc.). This data is saved back to Firestore to train future models.
- **Serverless Architecture:** React frontend, FastAPI backend, and Firebase for persistent storage.

---

## 🏗 Architecture & Tech Stack
- **Frontend:** React + Vite (Vanilla CSS, Glassmorphism UI)
- **Backend:** FastAPI (Python)
- **Database/Storage:** Firebase (Firestore + Firebase Storage)
- **Orchestration:** LangGraph / Python logic
- **Machine Learning Inference:** Hugging Face Spaces + `gradio_client`

---

## 🛠 Local Setup & Installation

### Prerequisites
1. **Python 3.9+** installed.
2. **Node.js (npm)** installed.
3. A **Firebase Service Account JSON** file (placed in `backend/firebase_credentials.json`).

### 1. Run the Backend (FastAPI)
Open a terminal and run the following commands:
```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows use `venv\Scripts\activate`

# Install required dependencies
pip install -r requirements.txt

# Start the server (Runs on port 8001)
python main.py
```

### 2. Run the Frontend (React / Vite)
Open a **new** terminal and run:
```bash
cd frontend

# Install packages
npm install

# Start the development server
npm run dev
```
Navigate to `http://localhost:5173` in your browser.

---

## 🖼 Adding Example X-Rays
The Upload Dashboard features convenient "Load Example" buttons. 
To make these buttons work locally:
1. Navigate to the `frontend/public/` folder.
2. Create a new folder named `examples`.
3. Drop two of your chest X-ray images into that folder and rename them exactly to:
   - `example_1.jpg`
   - `example_2.jpg`

Now, when you click the "Load Example 1" button in the UI, it will automatically load your specific X-ray image into the system for testing!

---

## 🌐 Deployment 
This project is configured to be easily deployed to free-tier cloud providers.

**Backend (Render):**
- Create a New Web Service.
- Root Directory: `backend`
- Build Command: `pip install -r requirements.txt`
- Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- *Note:* Remember to securely add your `firebase_credentials.json` via Render's "Secret Files" feature rather than committing it to GitHub.

**Frontend (Vercel):**
- Import the repository.
- Framework: `Vite`
- Root Directory: `frontend`
- Environment Variables: Add `VITE_API_URL` pointing to your Render backend URL (e.g., `https://radiology-backend.onrender.com`).

---

## 📡 API Endpoints (FastAPI)
- `POST /api/upload`: Accepts a `.jpg`/`.png` file. Uploads to Firebase Storage -> Triggers YOLO -> Triggers Gemma -> Saves to Firestore.
- `GET /api/reports/pending`: Returns a list of all cases in Firestore that have `status == 'pending_review'`.
- `POST /api/feedback`: Accepts `report_id`, `action`, and `edited_text`. Updates the Firestore document with the doctor's edits and RLHF reward score.

---

*Built by Hemish Jain.*
