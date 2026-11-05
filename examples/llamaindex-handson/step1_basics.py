import math
import config  # noqa: F401  Settings を初期化する
from llama_index.core import Settings


def cosine(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    return dot / (math.sqrt(sum(x * x for x in a)) * math.sqrt(sum(y * y for y in b)))


embed = Settings.embed_model
query = "有給休暇は何日もらえる？"
texts = [
    "年次休暇の付与日数について説明します。",   # 意味が近い（単語はほぼ一致しない）
    "有給の申請はワークフローから行います。",     # 単語は近いが、聞いていることが違う
    "社内のWi-Fiパスワードは毎月変更されます。",  # 無関係
]

q_vec = embed.get_query_embedding(query)
print(f"ベクトルの次元数: {len(q_vec)}")
print(f"先頭5要素: {q_vec[:5]}\n")

for t in texts:
    score = cosine(q_vec, embed.get_text_embedding(t))
    print(f"{score:.3f}  {t}")

# LLMを単体で呼ぶ
resp = Settings.llm.complete("RAGとは何かを一文で説明して")
print("\nLLM:", resp.text)