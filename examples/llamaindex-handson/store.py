import config  # noqa: F401
from llama_index.core import StorageContext, load_index_from_storage

PERSIST_DIR = "./storage"


def load_index():
    storage_context = StorageContext.from_defaults(persist_dir=PERSIST_DIR)
    return load_index_from_storage(storage_context)