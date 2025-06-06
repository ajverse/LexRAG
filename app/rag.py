import os
from io import BytesIO
import fitz
import warnings
import google.generativeai as genai
from datasets import load_dataset
from langchain_core.documents import Document
from langchain.text_splitter import CharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from dotenv import load_dotenv

load_dotenv()

DATASET_ID = os.getenv("HF_DATASET_ID", "ajverse/law-docs")

# Use the Hugging Face token if available for public dataset access
HUB_TOKEN = os.getenv("HUGGINGFACEHUB_API_TOKEN", None)

def fetch_pdf_docs_from_hf(dataset_id=DATASET_ID) -> list[Document]:
    # Use the recommended Hugging Face datasets loading pattern
    dataset = load_dataset(dataset_id, split="train")
    documents = []

    for item in dataset:
        pdf_field = item["pdf"]
        pdf_bytes = None
        # Handle different possible types for the pdf field
        if isinstance(pdf_field, dict) and "bytes" in pdf_field:
            pdf_bytes = pdf_field["bytes"]
        elif hasattr(pdf_field, "read"):
            pdf_bytes = pdf_field.read()
        elif isinstance(pdf_field, (bytes, bytearray)):
            pdf_bytes = pdf_field
        elif pdf_field.__class__.__module__.startswith("pdfplumber"):  # pdfplumber.pdf.PDF
            # Try to get the underlying stream if possible
            try:
                pdf_field.stream.seek(0)
                pdf_bytes = pdf_field.stream.read()
            except Exception as e:
                warnings.warn(f"Could not extract bytes from pdfplumber PDF: {e}")
                continue
        else:
            warnings.warn(f"Unsupported PDF field type: {type(pdf_field)}. Skipping.")
            continue
        file_stream = BytesIO(pdf_bytes)
        pdf = fitz.open(stream=file_stream, filetype="pdf")

        for page in pdf:
            text = page.get_text()
            metadata = {"source": item.get("filename", "unknown")}
            documents.append(Document(page_content=text, metadata=metadata))

    return documents

def get_gemini_answer(prompt: str) -> str:
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise ValueError("GOOGLE_API_KEY not set in environment.")
    genai.configure(api_key=api_key)
    # Use the most capable free-tier model as of June 2025
    model = genai.GenerativeModel("models/gemini-1.5-flash")
    response = model.generate_content(prompt)
    return response.text

def get_rag_chain():
    raw_docs = fetch_pdf_docs_from_hf()
    splitter = CharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    split_docs = splitter.split_documents(raw_docs)

    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    vectorstore = FAISS.from_documents(split_docs, embeddings)
    retriever = vectorstore.as_retriever()

    # Instead of HuggingFaceHub, use Gemini for LLM answers
    class GeminiRAG:
        def __init__(self, retriever):
            self.retriever = retriever
        def run(self, question):
            docs = self.retriever.invoke(question)
            context = "\n".join([d.page_content for d in docs])
            prompt = (
                "You are LexRAG, an expert legal assistant AI. "
                "Given the following context from legal documents, answer the user's question as clearly, concisely, and helpfully as possible. "
                "If the answer is not present in the context, say 'I could not find a direct answer in the provided documents.'\n"
                "\nContext:\n" + context +
                "\n\nUser Question: " + question +
                "\n\nAnswer (be clear, cite relevant context if possible):"
            )
            return get_gemini_answer(prompt)
    return GeminiRAG(retriever)
