"""
Vector Store Manager
Creates and manages the vector database for document embeddings
"""

import os
from pathlib import Path
from typing import List, Optional
import chromadb
from chromadb.config import Settings
from langchain_community.vectorstores import Chroma
from langchain.schema import Document

# Try to import embeddings with fallback
try:
    from langchain_community.embeddings import HuggingFaceEmbeddings
    EMBEDDINGS_AVAILABLE = True
except ImportError as e:
    EMBEDDINGS_AVAILABLE = False
    print(f"Warning: Could not import HuggingFaceEmbeddings: {e}")
    print("Please install: pip install sentence-transformers huggingface-hub")


class VectorStoreManager:
    """Manages the vector store for RAG system"""
    
    def __init__(
        self,
        persist_directory: str = "vector_store",
        embedding_model_name: str = "sentence-transformers/all-MiniLM-L6-v2"
    ):
        self.persist_directory = Path(persist_directory)
        self.persist_directory.mkdir(exist_ok=True)
        
        # Initialize embeddings model
        if not EMBEDDINGS_AVAILABLE:
            raise ImportError(
                "HuggingFaceEmbeddings not available. Please install:\n"
                "pip install sentence-transformers\n"
                "pip install huggingface-hub"
            )
        
        print(f"Loading embedding model: {embedding_model_name}...")
        try:
            self.embeddings = HuggingFaceEmbeddings(
                model_name=embedding_model_name,
                model_kwargs={'device': 'cpu'},
                encode_kwargs={'normalize_embeddings': True}
            )
            print("✓ Embedding model loaded")
        except Exception as e:
            print(f"Error loading embedding model: {e}")
            print("\nTrying to fix: Please run in your venv:")
            print("  pip install 'huggingface-hub<0.20.0' --upgrade")
            print("  pip install sentence-transformers --upgrade")
            raise
        
        self.vector_store: Optional[Chroma] = None
    
    def create_vector_store(self, documents: List[Document], collection_name: str = "admission_info"):
        """Create vector store from documents"""
        print(f"\nCreating vector store with {len(documents)} documents...")
        
        # Delete existing collection if it exists to ensure clean rebuild
        try:
            client = chromadb.PersistentClient(path=str(self.persist_directory))
            try:
                client.delete_collection(name=collection_name)
                print(f"  Deleted existing collection '{collection_name}' for clean rebuild")
            except Exception:
                # Collection doesn't exist, that's fine
                pass
        except Exception as e:
            print(f"  Warning: Could not delete existing collection: {e}")
        
        # Create ChromaDB vector store (will create new collection)
        self.vector_store = Chroma.from_documents(
            documents=documents,
            embedding=self.embeddings,
            persist_directory=str(self.persist_directory),
            collection_name=collection_name
        )
        
        # Persist the vector store
        self.vector_store.persist()
        print(f"✓ Vector store created and saved to {self.persist_directory}")
        return self.vector_store
    
    def load_vector_store(self, collection_name: str = "admission_info"):
        """Load existing vector store"""
        if not (self.persist_directory / "chroma.sqlite3").exists():
            raise FileNotFoundError(
                f"Vector store not found at {self.persist_directory}. "
                "Please create it first using create_vector_store()"
            )
        
        print(f"Loading vector store from {self.persist_directory}...")
        self.vector_store = Chroma(
            persist_directory=str(self.persist_directory),
            embedding_function=self.embeddings,
            collection_name=collection_name
        )
        print("✓ Vector store loaded")
        return self.vector_store
    
    def get_retriever(self, k: int = 4, search_type: str = "similarity"):
        """Get a retriever from the vector store"""
        if self.vector_store is None:
            raise ValueError("Vector store not initialized. Load or create it first.")
        
        if search_type == "similarity":
            return self.vector_store.as_retriever(search_kwargs={"k": k})
        elif search_type == "mmr":
            return self.vector_store.as_retriever(
                search_type="mmr",
                search_kwargs={"k": k, "fetch_k": k * 2}
            )
        else:
            raise ValueError(f"Unknown search type: {search_type}")
    
    def similarity_search(self, query: str, k: int = 4):
        """Perform similarity search"""
        if self.vector_store is None:
            raise ValueError("Vector store not initialized. Load or create it first.")
        
        return self.vector_store.similarity_search(query, k=k)
    
    def similarity_search_with_score(self, query: str, k: int = 4):
        """Perform similarity search with scores"""
        if self.vector_store is None:
            raise ValueError("Vector store not initialized. Load or create it first.")
        
        return self.vector_store.similarity_search_with_score(query, k=k)


if __name__ == "__main__":
    # Test the vector store
    try:
        from document_loader import AdmissionDocumentLoader
    except ImportError:
        from .document_loader import AdmissionDocumentLoader
    
    # Load documents
    loader = AdmissionDocumentLoader()
    chunks = loader.load_and_split()
    
    # Create vector store
    vs_manager = VectorStoreManager()
    vs_manager.create_vector_store(chunks)
    
    # Test search
    results = vs_manager.similarity_search("What is the admission fee?", k=3)
    print(f"\nSearch results for 'What is the admission fee?':")
    for i, doc in enumerate(results, 1):
        print(f"\n{i}. Source: {doc.metadata.get('filename', 'Unknown')}")
        print(f"   Content: {doc.page_content[:200]}...")

