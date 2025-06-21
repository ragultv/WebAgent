# WebAgent v2.0 – AI-Powered Website Builder

**WebAgent** is an AI-driven full-stack application that generates responsive websites from simple text prompts or uploaded design mockups. Built with a FastAPI backend and a React frontend, it uses advanced AI models to translate user intent or layout into real-time HTML/CSS/JS websites.

> Now powered by **NVIDIA's DeepSeek R1** and **Qwen 2.5** for smarter layout understanding and more accurate code generation.

🔗 **GitHub**: [https://github.com/ragultv/WebAgent](https://github.com/ragultv/WebAgent)  
⭐ If you find this project useful, give it a star to support ongoing improvements!

---

## 🚀 Features

- **Text-to-Website**: Generate complete websites from simple natural language prompts.
- **Image-to-Website**: Upload UI mockups to generate frontend code automatically.
- **Live Code Preview**: Edit and preview the website in real time using an in-browser code editor.
- **Fullscreen Design View**: View uploaded designs in fullscreen before generating the layout.
- **User Authentication**: Secure login and registration with JWT-based access and refresh tokens.

---

## 🛠 Tech Stack

**Frontend**: React, Vite, Tailwind CSS  
**Backend**: FastAPI, Python, SQLAlchemy, Pillow  
**Database**: SQLite (dev), PostgreSQL (prod-ready)  
**AI Models**:  
- `DeepSeek R1` from NVIDIA code generation 
- `Qwen 2.5` for design layout handling

---

## 📁 Project Structure

```
/backend
  ├── core
  ├── db
  ├── routes
  ├── schemas
  └── services

/frontend
  └── src
      ├── components
      ├── pages
      └── services
```

---

## ⚙️ Setup Instructions

### Backend Setup

```bash
cd backend
python -m venv venv
# Activate environment
# Windows:
.
env\Scripts ctivate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---
![Star History](https://api.star-history.com/svg?repos=ragultv/WebAgent&type=Date)

## ⭐ Support Development

If you like this project or find it useful, please consider **starring** the repository:  
👉 [https://github.com/ragultv/WebAgent](https://github.com/ragultv/WebAgent)

---

## 📬 Feedback & Contact

For feedback, suggestions, or issues, feel free to create an issue or connect with me via GitHub.
