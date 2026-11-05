from store import load_index

query_engine = load_index().as_query_engine()
res = query_engine.query("リモートワークは週何日まで？")

print(res)
print("\n--- 根拠 ---")
for n in res.source_nodes:
    print(f"{n.score:.3f}  {n.metadata.get('file_name')}  {n.get_content()[:60]!r}")