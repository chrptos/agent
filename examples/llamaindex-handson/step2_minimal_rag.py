# step2_minimal_rag.py
import config  # noqa: F401
from llama_index.core import SimpleDirectoryReader, VectorStoreIndex

documents = SimpleDirectoryReader("./data").load_data()   # Load
index = VectorStoreIndex.from_documents(documents)         # Split + Embed + Index
query_engine = index.as_query_engine()                     # Retrieve + Synthesize

print(query_engine.query("入社して半年たったら有給は何日もらえますか？"))