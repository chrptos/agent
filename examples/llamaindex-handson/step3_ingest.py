# step3_ingest.py
import config  # noqa: F401
from llama_index.core import SimpleDirectoryReader, VectorStoreIndex
from llama_index.core.node_parser import SentenceSplitter

PERSIST_DIR = "./storage"

# Load
docs = SimpleDirectoryReader("./data").load_data()
print(f"Document数: {len(docs)}")

# Split：小さめのチャンクにして、分割の様子を観察しやすくする
splitter = SentenceSplitter(chunk_size=256, chunk_overlap=32)
nodes = splitter.get_nodes_from_documents(docs)
print(f"Node数: {len(nodes)}\n")

for n in nodes:
    print(f"--- id={n.node_id[:8]} file={n.metadata.get('file_name')}")
    print(n.get_content()[:100].replace("\n", " "), "...")

# Embed + Index → ディスクに保存
index = VectorStoreIndex(nodes, show_progress=True)
index.storage_context.persist(persist_dir=PERSIST_DIR)
print(f"\n{PERSIST_DIR} に保存しました")