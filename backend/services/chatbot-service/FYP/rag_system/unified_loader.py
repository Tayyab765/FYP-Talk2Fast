"""
Unified Document Loader
Combines Admission Information and Program document loaders
"""

from typing import List
from langchain.schema import Document
from .document_loader import AdmissionDocumentLoader
from .program_loader import ProgramDocumentLoader
from .faculty_loader import FacultyDocumentLoader


class UnifiedDocumentLoader:
    """Unified loader that combines admission and program documents"""
    
    def __init__(
        self,
        admission_folder: str = "data/Admission Information",
        program_folder: str = "data/Program",
        faculty_folder: str = "data/Faculty",
    ):
        self.admission_loader = AdmissionDocumentLoader(admission_folder)
        self.program_loader = ProgramDocumentLoader(program_folder)
        self.faculty_loader = FacultyDocumentLoader(faculty_folder)
    
    def load_all_documents(self) -> List[Document]:
        """Load documents from admission, program, and faculty folders"""
        all_documents = []
        
        print("=" * 60)
        print("Loading Documents from Multiple Sources")
        print("=" * 60)
        
        # Load admission information
        print("\n[1/3] Loading Admission Information documents...")
        try:
            admission_chunks = self.admission_loader.load_and_split()
            all_documents.extend(admission_chunks)
            print(f"✓ Loaded {len(admission_chunks)} admission chunks")
        except Exception as e:
            print(f"⚠ Warning: Could not load admission documents: {e}")
        
        # Load program information
        print("\n[2/3] Loading Program documents...")
        try:
            program_chunks = self.program_loader.load_documents()
            all_documents.extend(program_chunks)
            print(f"✓ Loaded {len(program_chunks)} program chunks")
        except Exception as e:
            print(f"⚠ Warning: Could not load program documents: {e}")

        # Load faculty information
        print("\n[3/3] Loading Faculty documents...")
        try:
            faculty_chunks = self.faculty_loader.load_and_split()
            all_documents.extend(faculty_chunks)
            print(f"✓ Loaded {len(faculty_chunks)} faculty chunks")
        except Exception as e:
            print(f"⚠ Warning: Could not load faculty documents: {e}")
        
        print("\n" + "=" * 60)
        print(f"Total documents loaded: {len(all_documents)}")
        print("=" * 60)
        
        return all_documents


if __name__ == "__main__":
    # Test the unified loader
    loader = UnifiedDocumentLoader()
    all_chunks = loader.load_all_documents()
    
    print(f"\nTotal chunks: {len(all_chunks)}")
    print(f"\nSample chunks:")
    for i, chunk in enumerate(all_chunks[:3], 1):
        print(f"\n{i}. Source: {chunk.metadata.get('filename', 'Unknown')}")
        print(f"   Content: {chunk.page_content[:150]}...")

