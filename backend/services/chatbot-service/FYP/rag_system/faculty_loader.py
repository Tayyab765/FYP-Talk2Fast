"""
Faculty Document Loader
Loads and processes faculty files organized by campus and department
"""

import os
from pathlib import Path
from typing import List

try:
    from langchain_community.document_loaders import TextLoader
except ImportError:
    # Fallback for older langchain versions
    from langchain.document_loaders import TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document


class FacultyDocumentLoader:
    """Loads and processes faculty documents grouped by campus and department"""

    def __init__(self, data_folder: str = "data/Faculty"):
        self.data_folder = Path(data_folder)
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=150,
            length_function=len,
            separators=["\n\n", "\n", ". ", " ", ""],
        )

    def _normalize_department(self, name: str) -> str:
        return name.replace("_", " ").strip()

    def load_documents(self) -> List[Document]:
        """Load all faculty text files with campus/department metadata."""
        documents: List[Document] = []

        if not self.data_folder.exists():
            raise FileNotFoundError(f"Data folder not found: {self.data_folder}")

        # Expect structure: data/Faculty/<Campus>/<Department>.txt
        campus_dirs = [p for p in self.data_folder.iterdir() if p.is_dir()]
        if not campus_dirs:
            raise ValueError(f"No campus folders found in {self.data_folder}")

        for campus_dir in campus_dirs:
            campus_name = campus_dir.name
            txt_files = list(campus_dir.glob("*.txt"))
            for txt_file in txt_files:
                department_name = self._normalize_department(txt_file.stem)
                try:
                    loader = TextLoader(str(txt_file), encoding="utf-8")
                    docs = loader.load()

                    for d in docs:
                        d.metadata["source"] = str(txt_file)
                        d.metadata["filename"] = txt_file.name
                        d.metadata["campus"] = campus_name
                        d.metadata["department"] = department_name
                        # Ensure the chunk text itself carries campus/department context
                        d.page_content = (
                            f"Campus: {campus_name} | Department: {department_name}\n"
                            f"{d.page_content}"
                        )

                    documents.extend(docs)
                    print(f"✓ Loaded: {campus_name} / {txt_file.name}")
                except Exception as e:
                    print(f"✗ Error loading {txt_file.name}: {e}")

        return documents

    def split_documents(self, documents: List[Document]) -> List[Document]:
        """Split documents into smaller chunks for better retrieval."""
        print(f"\nSplitting {len(documents)} faculty documents into chunks...")
        chunks = self.text_splitter.split_documents(documents)
        print(f"Created {len(chunks)} faculty chunks")
        return chunks

    def load_and_split(self) -> List[Document]:
        """Load and split all faculty documents."""
        documents = self.load_documents()
        return self.split_documents(documents)


if __name__ == "__main__":
    loader = FacultyDocumentLoader()
    chunks = loader.load_and_split()
    print(f"\nTotal chunks: {len(chunks)}")
    if chunks:
        print("Sample chunk:")
        print(chunks[0].page_content[:200] + "...")

