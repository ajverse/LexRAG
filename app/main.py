import os
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'
import tensorflow as tf
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
import uuid
from fastapi import FastAPI, Request
from starlette.middleware.sessions import SessionMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from dotenv import load_dotenv
from app.rag import get_rag_chain

load_dotenv()

# Debug: Print the Hugging Face token prefix to verify loading
hf_token = os.getenv("HUGGINGFACEHUB_API_TOKEN")
print("HUGGINGFACEHUB_API_TOKEN:", hf_token[:8] if hf_token else "NOT FOUND")

# Debug: Print the Google API key prefix to verify loading
google_key = os.getenv("GOOGLE_API_KEY")
print("GOOGLE_API_KEY:", google_key[:8] if google_key else "NOT FOUND")

SESSION_SECRET_KEY = os.getenv("SESSION_SECRET_KEY", "defaultsecret")

app = FastAPI()
app.model_config = {'arbitrary_types_allowed': True}
app.add_middleware(SessionMiddleware, secret_key=SESSION_SECRET_KEY)
app.mount("/static", StaticFiles(directory="frontend"), name="static")

chat_chain = get_rag_chain()
user_sessions = {}

class Query(BaseModel):
    question: str

@app.post("/chat")
async def chat(request: Request, query: Query):
    uid = request.session.get("user_id")
    if not uid:
        uid = str(uuid.uuid4())
        request.session["user_id"] = uid

    user_sessions[uid] = user_sessions.get(uid, 0) + 1
    if user_sessions[uid] > 2:
        return {"message": "Usage limit reached. Only 2 queries allowed."}

    answer = chat_chain.run(query.question)
    return {"answer": answer}

@app.get("/")
async def root():
    return FileResponse("frontend/index.html")
