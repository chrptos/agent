# ja_bm25.py
import re
from rank_bm25 import BM25Okapi
from llama_index.core.retrievers import BaseRetriever
from llama_index.core.schema import NodeWithScore, QueryBundle


def tokenize_ja(text: str) -> list[str]:
    """英数字の連続（E-4012など）は1語、日本語部分は2文字ずつに区切る"""
    text = text.lower()
    tokens = re.findall(r"[a-z0-9\-]+", text)
    ja = re.sub(r"[a-z0-9\-]+|[\W_]+", " ", text)  # 英数字と記号を除いた日本語部分
    for seg in ja.split():
        tokens += [seg[i:i + 2] for i in range(len(seg) - 1)] or [seg]
    return tokens


class JaBM25Retriever(BaseRetriever):
    def __init__(self, nodes, similarity_top_k: int = 5):
        super().__init__()
        self._nodes = nodes
        self._top_k = similarity_top_k
        self._bm25 = BM25Okapi([tokenize_ja(n.get_content()) for n in nodes])

    def _retrieve(self, query_bundle: QueryBundle) -> list[NodeWithScore]:
        scores = self._bm25.get_scores(tokenize_ja(query_bundle.query_str))
        ranked = sorted(zip(self._nodes, scores), key=lambda x: x[1], reverse=True)
        return [NodeWithScore(node=n, score=float(s)) for n, s in ranked[: self._top_k]]