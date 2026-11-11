import os

from dotenv import load_dotenv

load_dotenv()  # .env の値を環境変数に読み込む

PROJECT_ID = os.environ["GOOGLE_CLOUD_PROJECT"]
os.environ.setdefault("GOOGLE_CLOUD_LOCATION", "global")
# Gemini Enterprise Agent Platform (旧Vertex AI) をバックエンドに使う
os.environ.setdefault("GOOGLE_GENAI_USE_ENTERPRISE", "True")

MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")
