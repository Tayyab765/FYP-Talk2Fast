"""
Main RAG System Application
Interactive interface for querying admission information
"""

import os
import sys
from pathlib import Path
from typing import Dict, Any

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

try:
    from rag_system.document_loader import AdmissionDocumentLoader
    from rag_system.vector_store import VectorStoreManager
    from rag_system.rag_pipeline import RAGPipeline
except ImportError:
    from .document_loader import AdmissionDocumentLoader
    from .vector_store import VectorStoreManager
    from .rag_pipeline import RAGPipeline


class AdmissionRAGSystem:
    """Main RAG System for Admission Information"""
    
    def __init__(
        self,
        data_folder: str = "data/Admission Information",
        vector_store_path: str = "vector_store",
        rebuild_vector_store: bool = False,
        llm_type: str = "ollama",
        model_name: str = "llama2"
    ):
        self.data_folder = data_folder
        self.vector_store_path = vector_store_path
        self.rebuild_vector_store = rebuild_vector_store
        
        print("=" * 60)
        print("Admission Information RAG System")
        print("=" * 60)
        
        # Initialize vector store manager
        self.vs_manager = VectorStoreManager(
            persist_directory=vector_store_path,
            embedding_model_name="sentence-transformers/all-MiniLM-L6-v2"
        )
        
        # Load or create vector store
        if rebuild_vector_store or not (Path(vector_store_path) / "chroma.sqlite3").exists():
            print("\n[1/3] Loading documents...")
            loader = AdmissionDocumentLoader(data_folder)
            chunks = loader.load_and_split()
            
            print("\n[2/3] Creating vector store...")
            self.vs_manager.create_vector_store(chunks)
        else:
            print("\n[1/2] Loading existing vector store...")
            self.vs_manager.load_vector_store()
        
        # Initialize RAG pipeline
        print("\n[2/2] Initializing RAG pipeline...")
        self.rag_pipeline = RAGPipeline(
            self.vs_manager,
            llm_type=llm_type,
            model_name=model_name
        )
        
        print("\n" + "=" * 60)
        print("✓ RAG System Ready!")
        print("=" * 60)
    
    def ask(self, question: str, show_sources: bool = True) -> Dict[str, Any]:
        """Ask a question to the RAG system"""
        if show_sources:
            return self.rag_pipeline.query_with_sources(question)
        else:
            return self.rag_pipeline.query(question)
    
    def interactive_mode(self):
        """Run in interactive mode"""
        print("\n" + "=" * 60)
        print("Interactive Mode - Ask questions about admission information")
        print("Type 'quit' or 'exit' to stop")
        print("=" * 60 + "\n")
        
        while True:
            try:
                question = input("Question: ").strip()
                
                if question.lower() in ['quit', 'exit', 'q']:
                    print("\nGoodbye!")
                    break
                
                if not question:
                    continue
                
                print("\n" + "-" * 60)
                print("Searching...")
                result = self.ask(question, show_sources=True)
                
                print("\nAnswer:")
                print(result['answer'])
                
                if result.get('sources'):
                    print("\nSources:")
                    for source in result['sources'][:3]:  # Show top 3 sources
                        print(f"  [{source['rank']}] {source['source_file']}")
                        print(f"      Relevance: {source['relevance_score']:.4f}")
                
                print("-" * 60 + "\n")
                
            except KeyboardInterrupt:
                print("\n\nGoodbye!")
                break
            except Exception as e:
                print(f"\nError: {str(e)}\n")


def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Admission Information RAG System")
    parser.add_argument(
        "--rebuild",
        action="store_true",
        help="Rebuild the vector store from documents"
    )
    parser.add_argument(
        "--llm",
        type=str,
        default="ollama",
        choices=["ollama", "openai"],
        help="LLM type to use (default: ollama)"
    )
    parser.add_argument(
        "--model",
        type=str,
        default="llama2",
        help="Model name for Ollama (default: llama2)"
    )
    parser.add_argument(
        "--query",
        type=str,
        help="Ask a single question (non-interactive mode)"
    )
    
    args = parser.parse_args()
    
    # Initialize RAG system
    rag_system = AdmissionRAGSystem(
        rebuild_vector_store=args.rebuild,
        llm_type=args.llm,
        model_name=args.model
    )
    
    # Run query or interactive mode
    if args.query:
        result = rag_system.ask(args.query, show_sources=True)
        print("\nAnswer:")
        print(result['answer'])
        if result.get('sources'):
            print("\nSources:")
            for source in result['sources']:
                print(f"  [{source['rank']}] {source['source_file']}")
    else:
        rag_system.interactive_mode()


if __name__ == "__main__":
    main()

