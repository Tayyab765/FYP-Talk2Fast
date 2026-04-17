"""
Document Loader for Admission Information
Loads and processes all text files from the Admission Information folder
"""

import os
from pathlib import Path
from typing import List, Dict
try:
    from langchain_community.document_loaders import TextLoader
except ImportError:
    # Fallback for older langchain versions
    from langchain.document_loaders import TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document


class AdmissionDocumentLoader:
    """Loads and processes admission information documents"""
    
    def __init__(self, data_folder: str = "data/Admission Information"):
        self.data_folder = Path(data_folder)
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
            separators=["\n\n", "\n", ". ", " ", ""]
        )
    
    def load_documents(self) -> List[Document]:
        """Load all text files from the admission information folder"""
        documents = []
        
        if not self.data_folder.exists():
            raise FileNotFoundError(f"Data folder not found: {self.data_folder}")
        
        # Get all .txt files
        txt_files = list(self.data_folder.glob("*.txt"))
        
        if not txt_files:
            raise ValueError(f"No .txt files found in {self.data_folder}")
        
        print(f"Found {len(txt_files)} text files to process...")
        
        for txt_file in txt_files:
            try:
                # Load document
                loader = TextLoader(str(txt_file), encoding='utf-8')
                doc = loader.load()
                
                # Add metadata
                for d in doc:
                    d.metadata['source'] = str(txt_file)
                    d.metadata['filename'] = txt_file.name
                
                documents.extend(doc)
                print(f"✓ Loaded: {txt_file.name}")
            except Exception as e:
                print(f"✗ Error loading {txt_file.name}: {str(e)}")
        
        return documents
    
    def split_documents(self, documents: List[Document]) -> List[Document]:
        """Split documents into smaller chunks for better retrieval"""
        print(f"\nSplitting {len(documents)} documents into chunks...")
        chunks = self.text_splitter.split_documents(documents)
        print(f"Created {len(chunks)} chunks")
        return chunks
    
    def load_and_split(self) -> List[Document]:
        """Load and split all documents"""
        documents = self.load_documents()
        chunks = self.split_documents(documents)
        return chunks


if __name__ == "__main__":
    # Test the loader
    loader = AdmissionDocumentLoader()
    chunks = loader.load_and_split()
    print(f"\nTotal chunks: {len(chunks)}")
    print(f"\nSample chunk:")
    print(chunks[0].page_content[:200] + "...")

