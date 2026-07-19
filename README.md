# PriceVision AI - Product Price Comparison Platform

PriceVision AI is a full-stack, AI-powered product price comparison platform. Users can scan a product image or paste a product URL to instantly identify the item, query prices across 13 major platforms (Amazon, Flipkart, Myntra, Ajio, Meesho, Croma, Reliance Digital, Tata Cliq, Vijay Sales, Snapdeal, Nykaa, FirstCry, JioMart), check historical price changes, set alerts, manage wishlists, and view smart purchasing recommendations.

---

## Technical Stack
* **Frontend**: React.js, Tailwind CSS, Framer Motion, Recharts, Lucide Icons, Vite
* **Backend**: FastAPI, Python 3.11, Uvicorn, JSON/SQLite Database Engine, MongoDB Motor Client
* **AI Engine**: EasyOCR, CLIP Vision matching simulator, and SentenceTransformers semantic text encoder

---

## Getting Started

### Prerequisites
* Python 3.11+
* Node.js v18+ & npm

---

### Backend Setup
1. Open a terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Create and activate a python virtual environment:
   ```bash
   python -m venv .venv
   # Windows:
   .venv\Scripts\activate
   # macOS/Linux:
   source .venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the backend development server:
   ```bash
   python run.py
   ```
   The backend will start running at [http://localhost:8000](http://localhost:8000). The interactive API docs can be accessed at [http://localhost:8000/docs](http://localhost:8000/docs).

---

### Frontend Setup
1. Open a terminal and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   The frontend will run at [http://localhost:5173](http://localhost:5173).

---

## Admin Portal Access
To access the Admin Control Center:
1. Navigate to the **Sign In** tab in the sidebar.
2. Sign in with the system default administrator credentials:
   - **Email**: `admin@pricevision.ai`
   - **Password**: `admin123`
3. Click on the **Admin Panel** tab in the sidebar to view user directories, search metrics, and configure e-commerce affiliate IDs.
