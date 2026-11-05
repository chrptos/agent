from store import load_index

retriever = load_index().as_retriever(similarity_top_k=3)

for q in ["有給の申請期限は？", "E-4012が出た", "賞与は年何回？"]:
    print(f"\n=== {q}")
    for n in retriever.retrieve(q):
        print(f"{n.score:.3f}  {n.get_content()[:60]!r}")