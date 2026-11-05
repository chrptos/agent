from llama_index.core import PromptTemplate
from llama_index.core.postprocessor import SimilarityPostprocessor
from llama_index.core.query_engine import RetrieverQueryEngine
from store import load_index

index = load_index()

retriever = index.as_retriever(similarity_top_k=5)
query_engine = RetrieverQueryEngine.from_args(
    retriever,
    # スコアがしきい値未満のチャンクは捨てる（値はモデルによって変わるので要調整）
    node_postprocessors=[SimilarityPostprocessor(similarity_cutoff=0.6)],
)

# 「文書にないことは答えない」ようにプロンプトを差し替える
qa_prompt = PromptTemplate(
    "以下の社内文書だけを根拠に、質問に日本語で答えてください。\n"
    "文書に記載がない場合は「社内文書に記載がありません」とだけ答えてください。\n"
    "---------------------\n{context_str}\n---------------------\n"
    "質問: {query_str}\n回答: "
)
query_engine.update_prompts({"response_synthesizer:text_qa_template": qa_prompt})

for q in ["有給の申請期限は？", "賞与は年何回？"]:
    res = query_engine.query(q)
    print(f"\nQ: {q}\nA: {res}  (根拠 {len(res.source_nodes)} 件)")