import os
from dotenv import load_dotenv
from llama_index.core import Settings
from llama_index.llms.google_genai import GoogleGenAI
from llama_index.embeddings.google_genai import GoogleGenAIEmbedding

load_dotenv()  # .env の GOOGLE_CLOUD_PROJECT を環境変数に読み込む
PROJECT_ID = os.environ["GOOGLE_CLOUD_PROJECT"]

# Gemini 3系のプレビューモデルは global エンドポイントでのみ提供される
LLM_MODEL = "gemini-3-flash-preview"
LLM_LOCATION = "global"

# 埋め込みは東京リージョンを使う
EMBED_MODEL = "gemini-embedding-001"
EMBED_LOCATION = "asia-northeast1"

# vertexai_config を渡すと、APIキーではなくADC（IAM）で Vertex AI に接続する
Settings.llm = GoogleGenAI(
    model=LLM_MODEL,
    vertexai_config={"project": PROJECT_ID, "location": LLM_LOCATION},
)
Settings.embed_model = GoogleGenAIEmbedding(
    model_name=EMBED_MODEL,
    vertexai_config={"project": PROJECT_ID, "location": EMBED_LOCATION},
)