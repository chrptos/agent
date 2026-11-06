# step5_hybrid.py
from llama_index.core.query_engine import RetrieverQueryEngine
from llama_index.core.retrievers import QueryFusionRetriever
from ja_bm25 import JaBM25Retriever, tokenize_ja
from store import load_index

index = load_index()
nodes = list(index.docstore.docs.values())  # 保存済みのNodeを取り出す

vector_retriever = index.as_retriever(similarity_top_k=5)
bm25_retriever = JaBM25Retriever(nodes, similarity_top_k=5)

hybrid_retriever = QueryFusionRetriever(
    [vector_retriever, bm25_retriever],
    similarity_top_k=3,
    num_queries=1,               # 1 = クエリの自動言い換えをしない
    mode="reciprocal_rerank",    # RRF：スコアではなく順位で統合する
    use_async=False,
)

q = "E-4012"
print("tokens:", tokenize_ja(q))
for name, r in [("vector", vector_retriever), ("bm25", bm25_retriever), ("hybrid", hybrid_retriever)]:
    print(f"\n=== {name}")
    for n in r.retrieve(q)[:3]:
        print(f"{n.score:.3f}  {n.get_content()[:50]!r}")

query_engine = RetrieverQueryEngine.from_args(hybrid_retriever)
print("\n回答:", query_engine.query("E-4012が出たときの対処法は？"))