"""
RAG Pipeline
Retrieval-Augmented Generation pipeline for answering questions
"""

from typing import List, Dict, Optional, Any
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate
from langchain_community.llms import Ollama
from langchain.schema import Document

try:
    from langchain_openai import ChatOpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

try:
    from .vector_store import VectorStoreManager
except ImportError:
    from vector_store import VectorStoreManager


class RAGPipeline:
    """RAG Pipeline for question answering"""
    
    def __init__(
        self,
        vector_store_manager: VectorStoreManager,
        llm_type: str = "ollama",  # "ollama" or "openai"
        model_name: str = "qwen2.5:3b",  # For Ollama
        temperature: float = 0.7
    ):
        self.vector_store_manager = vector_store_manager
        self.llm_type = llm_type
        self.model_name = model_name
        self.temperature = temperature
        self.qa_chain = None
        self._setup_qa_chain()
    
    def _setup_qa_chain(self):
        """Setup the QA chain with appropriate LLM"""
        # Get retriever
        retriever = self.vector_store_manager.get_retriever(k=4)
        
        # Create prompt template
        prompt_template = """Use the following pieces of context from the admission information documents to answer the question. 
If you don't know the answer based on the provided context, just say that you don't know. Don't try to make up an answer.

Context:
{context}

Question: {question}

Answer: Provide a clear, accurate, and helpful answer based on the context above. If the context doesn't contain enough information, say so."""
        
        PROMPT = PromptTemplate(
            template=prompt_template,
            input_variables=["context", "question"]
        )
        
        # Initialize LLM based on type
        if self.llm_type == "ollama":
            try:
                llm = Ollama(model=self.model_name, temperature=self.temperature)
                print(f"✓ Using Ollama with model: {self.model_name}")
            except Exception as e:
                print(f"⚠ Warning: Could not connect to Ollama: {e}")
                print("   Falling back to simple retrieval-based answers")
                llm = None
        elif self.llm_type == "openai":
            if not OPENAI_AVAILABLE:
                print("⚠ Warning: langchain-openai not installed")
                print("   Install with: pip install langchain-openai")
                print("   Falling back to simple retrieval-based answers")
                llm = None
            else:
                try:
                    llm = ChatOpenAI(
                        model_name="gpt-3.5-turbo",
                        temperature=self.temperature
                    )
                    print(f"✓ Using OpenAI GPT-3.5-turbo")
                except Exception as e:
                    print(f"⚠ Warning: Could not connect to OpenAI: {e}")
                    print("   Falling back to simple retrieval-based answers")
                    llm = None
        else:
            llm = None
        
        # Create QA chain if LLM is available
        if llm:
            self.qa_chain = RetrievalQA.from_chain_type(
                llm=llm,
                chain_type="stuff",
                retriever=retriever,
                chain_type_kwargs={"prompt": PROMPT},
                return_source_documents=True
            )
        else:
            self.qa_chain = None
            print("   Using retrieval-only mode (no LLM generation)")
    
    def query(self, question: str) -> Dict[str, Any]:
        """Query the RAG system"""
        if self.qa_chain:
            # Use full RAG pipeline with LLM
            result = self.qa_chain.invoke({"query": question})
            return {
                "answer": result["result"],
                "source_documents": result.get("source_documents", [])
            }
        else:
            # Fallback to retrieval-only
            docs = self.vector_store_manager.similarity_search(question, k=4)
            
            # Simple answer generation from retrieved documents
            context = "\n\n".join([doc.page_content for doc in docs])
            answer = f"Based on the admission information:\n\n{context[:1000]}..."
            
            return {
                "answer": answer,
                "source_documents": docs
            }
    
    def query_with_sources(self, question: str, k: int = 4) -> Dict[str, Any]:
        """Query with detailed source information"""
        # Get relevant documents
        docs_with_scores = self.vector_store_manager.similarity_search_with_score(question, k=k)
        
        # Extract documents and scores
        documents = [doc for doc, score in docs_with_scores]
        scores = [score for doc, score in docs_with_scores]
        
        # Get answer
        result = self.query(question)
        
        # Add source information
        sources = []
        for i, (doc, score) in enumerate(zip(documents, scores), 1):
            sources.append({
                "rank": i,
                "source_file": doc.metadata.get("filename", "Unknown"),
                "relevance_score": float(score),
                "content": doc.page_content[:300] + "..." if len(doc.page_content) > 300 else doc.page_content
            })
        
        return {
            "answer": result["answer"],
            "sources": sources,
            "source_documents": documents
        }


if __name__ == "__main__":
    # Test the RAG pipeline
    try:
        from document_loader import AdmissionDocumentLoader
        from vector_store import VectorStoreManager
    except ImportError:
        from .document_loader import AdmissionDocumentLoader
        from .vector_store import VectorStoreManager
    
    # Load documents and create vector store
    print("Setting up RAG system...")
    loader = AdmissionDocumentLoader()
    chunks = loader.load_and_split()
    
    vs_manager = VectorStoreManager()
    vs_manager.create_vector_store(chunks)
    
    # Create RAG pipeline
    rag = RAGPipeline(vs_manager, llm_type="ollama", model_name="llama2")
    
    # Test query
    question = "What is the admission fee?"
    print(f"\nQuestion: {question}")
    result = rag.query_with_sources(question)
    
    print(f"\nAnswer:\n{result['answer']}")
    print(f"\nSources:")
    for source in result['sources']:
        print(f"  {source['rank']}. {source['source_file']} (score: {source['relevance_score']:.4f})")

