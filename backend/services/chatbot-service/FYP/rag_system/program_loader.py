"""
Program Document Loader
Specialized loader for Program files with paragraph-wise chunking
"""

import re
from pathlib import Path
from typing import List, Dict, Tuple
try:
    from langchain_community.document_loaders import TextLoader
except ImportError:
    from langchain.document_loaders import TextLoader
from langchain.schema import Document


class ProgramDocumentLoader:
    """Loads and processes program information documents with paragraph-wise chunking"""
    
    def __init__(
        self,
        data_folder: str = "data/Program",
        max_paragraph_length: int = 1000,
        overlap_size: int = 200
    ):
        self.data_folder = Path(data_folder)
        self.max_paragraph_length = max_paragraph_length
        self.overlap_size = overlap_size
    
    def extract_metadata(self, line: str) -> Dict[str, str]:
        """Extract program metadata from a line"""
        metadata = {}
        # Pattern: Program Code: X | Program Title: Y | Level: Z | Domain: W
        code_match = re.search(r'Program Code:\s*([^|]+)', line)
        title_match = re.search(r'Program Title:\s*([^|]+)', line)
        level_match = re.search(r'Level:\s*([^|]+)', line)
        domain_match = re.search(r'Domain:\s*([^|]+)', line)
        
        if code_match:
            metadata['program_code'] = code_match.group(1).strip()
        if title_match:
            metadata['program_title'] = title_match.group(1).strip()
        if level_match:
            metadata['level'] = level_match.group(1).strip()
        if domain_match:
            metadata['domain'] = domain_match.group(1).strip()
        
        return metadata
    
    def split_long_paragraph(self, text: str) -> List[str]:
        """Split a long paragraph in half with overlap"""
        if len(text) <= self.max_paragraph_length:
            return [text]
        
        # Split in half
        midpoint = len(text) // 2
        
        # Try to split at a sentence boundary near the midpoint
        sentence_endings = ['. ', '.\n', '! ', '?\n', '?\n']
        best_split = midpoint
        
        for i in range(midpoint - 100, midpoint + 100):
            if i < 0 or i >= len(text):
                continue
            for ending in sentence_endings:
                if text[i:i+len(ending)] == ending:
                    best_split = i + len(ending)
                    break
            if best_split != midpoint:
                break
        
        # Create two chunks with overlap
        first_half = text[:best_split + self.overlap_size // 2]
        second_half = text[best_split - self.overlap_size // 2:]
        
        return [first_half, second_half]
    
    def process_program_file(self, file_path: Path) -> List[Document]:
        """Process a single program file"""
        documents = []
        
        # Load file content
        loader = TextLoader(str(file_path), encoding='utf-8')
        raw_docs = loader.load()
        content = raw_docs[0].page_content
        
        # Split by sections (marked with [Section Name])
        # Pattern matches [Section Name] at start of line
        section_pattern = r'^(\[.*?\])'
        lines = content.split('\n')
        
        current_section = None
        current_metadata = {}
        current_paragraph_lines = []
        current_metadata_line = None  # Store the full metadata line
        
        for line in lines:
            # Check if this is a section header
            section_match = re.match(section_pattern, line.strip())
            if section_match:
                # Save previous section if exists
                if current_section and current_paragraph_lines:
                    # Combine paragraph lines
                    paragraph_text = '\n'.join(current_paragraph_lines).strip()
                    if paragraph_text:
                        documents.extend(self._create_documents_from_section(
                            current_section, current_metadata, [paragraph_text], file_path, current_metadata_line
                        ))
                
                # Start new section
                current_section = section_match.group(1)
                current_paragraph_lines = []
                current_metadata_line = None
            elif 'Program Code:' in line:
                # Extract metadata
                current_metadata = self.extract_metadata(line)
                current_metadata['section'] = current_section
                current_metadata['source_file'] = str(file_path)
                current_metadata['filename'] = file_path.name
                current_metadata['program_type'] = 'Graduate' if 'Graduate' in str(file_path) else 'Undergraduate'
                # Store the full metadata line to include in chunks
                current_metadata_line = line.strip()
            elif line.strip():
                # This is content - add to current paragraph
                current_paragraph_lines.append(line.strip())
            else:
                # Empty line - end of current paragraph if we have content
                if current_paragraph_lines:
                    paragraph_text = '\n'.join(current_paragraph_lines).strip()
                    if paragraph_text:
                        documents.extend(self._create_documents_from_section(
                            current_section, current_metadata, [paragraph_text], file_path, current_metadata_line
                        ))
                    current_paragraph_lines = []
        
        # Don't forget the last section
        if current_section and current_paragraph_lines:
            paragraph_text = '\n'.join(current_paragraph_lines).strip()
            if paragraph_text:
                documents.extend(self._create_documents_from_section(
                    current_section, current_metadata, [paragraph_text], file_path, current_metadata_line
                ))
        
        return documents
    
    def extract_semester_number(self, text: str) -> str:
        """Extract semester number from text (returns 'i', 'ii', 'iii', etc. or None)"""
        text_lower = text.lower()
        
        # Check for Roman numerals first (most common in Study Plan)
        if re.search(r'\bsemester\s+i\b', text_lower) or re.search(r'\bsemester\s+1\b', text_lower) or 'first semester' in text_lower:
            return 'i'
        elif re.search(r'\bsemester\s+ii\b', text_lower) or re.search(r'\bsemester\s+2\b', text_lower) or 'second semester' in text_lower:
            return 'ii'
        elif re.search(r'\bsemester\s+iii\b', text_lower) or re.search(r'\bsemester\s+3\b', text_lower) or 'third semester' in text_lower:
            return 'iii'
        elif re.search(r'\bsemester\s+iv\b', text_lower) or re.search(r'\bsemester\s+4\b', text_lower) or 'fourth semester' in text_lower:
            return 'iv'
        elif re.search(r'\bsemester\s+v\b', text_lower) or re.search(r'\bsemester\s+5\b', text_lower) or 'fifth semester' in text_lower:
            return 'v'
        elif re.search(r'\bsemester\s+vi\b', text_lower) or re.search(r'\bsemester\s+6\b', text_lower) or 'sixth semester' in text_lower:
            return 'vi'
        elif re.search(r'\bsemester\s+vii\b', text_lower) or re.search(r'\bsemester\s+7\b', text_lower) or 'seventh semester' in text_lower:
            return 'vii'
        elif re.search(r'\bsemester\s+viii\b', text_lower) or re.search(r'\bsemester\s+8\b', text_lower) or 'eighth semester' in text_lower:
            return 'viii'
        
        return None
    
    def normalize_semester_references(self, text: str) -> str:
        """Normalize semester references for better semantic matching"""
        # Map Roman numerals to multiple representations
        replacements = {
            r'\bSemester I\b': 'Semester I first semester 1st semester semester 1',
            r'\bSemester II\b': 'Semester II second semester 2nd semester semester 2',
            r'\bSemester III\b': 'Semester III third semester 3rd semester semester 3',
            r'\bSemester IV\b': 'Semester IV fourth semester 4th semester semester 4',
            r'\bSemester V\b': 'Semester V fifth semester 5th semester semester 5',
            r'\bSemester VI\b': 'Semester VI sixth semester 6th semester semester 6',
            r'\bSemester VII\b': 'Semester VII seventh semester 7th semester semester 7',
            r'\bSemester VIII\b': 'Semester VIII eighth semester 8th semester semester 8',
        }
        
        normalized_text = text
        for pattern, replacement in replacements.items():
            normalized_text = re.sub(pattern, replacement, normalized_text, flags=re.IGNORECASE)
        
        return normalized_text
    
    def _create_documents_from_section(
        self,
        section_name: str,
        metadata: Dict[str, str],
        paragraphs: List[str],
        file_path: Path,
        metadata_line: str = None
    ) -> List[Document]:
        """Create documents from a section's paragraphs"""
        documents = []
        
        # Process each paragraph (already separated)
        for para_text in paragraphs:
            if not para_text.strip():
                continue
            
            # Normalize semester references for better semantic matching
            normalized_para = self.normalize_semester_references(para_text)
                
            # Split if too long
            para_chunks = self.split_long_paragraph(normalized_para)
            
            # Extract semester number if this is a Study Plan section
            semester_number = None
            if section_name and '[Study Plan]' in section_name:
                semester_number = self.extract_semester_number(para_text)
            
            for chunk_idx, chunk in enumerate(para_chunks):
                # Create document
                doc_metadata = metadata.copy()
                doc_metadata['section_name'] = section_name
                doc_metadata['chunk_index'] = chunk_idx
                doc_metadata['total_chunks_in_para'] = len(para_chunks)
                
                # Add semester number to metadata if available
                if semester_number:
                    doc_metadata['semester'] = semester_number
                
                # Add section name and program info to content for context
                content = f"{section_name}\n"
                # Include the full metadata line if available
                if metadata_line:
                    content += f"{metadata_line}\n"
                else:
                    # Fallback to individual fields if metadata line not available
                    if 'program_title' in doc_metadata:
                        content += f"Program: {doc_metadata['program_title']}\n"
                    if 'program_code' in doc_metadata:
                        content += f"Program Code: {doc_metadata['program_code']}\n"
                content += f"\n{chunk}"
                
                doc = Document(
                    page_content=content,
                    metadata=doc_metadata
                )
                documents.append(doc)
        
        return documents
    
    def load_documents(self) -> List[Document]:
        """Load all program files from Graduate and Undergraduate folders"""
        all_documents = []
        
        if not self.data_folder.exists():
            raise FileNotFoundError(f"Program folder not found: {self.data_folder}")
        
        # Process Graduate folder
        graduate_folder = self.data_folder / "Graduate"
        if graduate_folder.exists():
            txt_files = list(graduate_folder.glob("*.txt"))
            print(f"\nFound {len(txt_files)} Graduate program files...")
            for txt_file in txt_files:
                try:
                    docs = self.process_program_file(txt_file)
                    all_documents.extend(docs)
                    print(f"[OK] Loaded: {txt_file.name} ({len(docs)} chunks)")
                except Exception as e:
                    print(f"[ERROR] Error loading {txt_file.name}: {str(e)}")
        
        # Process Undergraduate folder
        undergraduate_folder = self.data_folder / "Undergraduate"
        if undergraduate_folder.exists():
            txt_files = list(undergraduate_folder.glob("*.txt"))
            print(f"\nFound {len(txt_files)} Undergraduate program files...")
            for txt_file in txt_files:
                try:
                    docs = self.process_program_file(txt_file)
                    all_documents.extend(docs)
                    print(f"[OK] Loaded: {txt_file.name} ({len(docs)} chunks)")
                except Exception as e:
                    print(f"[ERROR] Error loading {txt_file.name}: {str(e)}")
        
        print(f"\nTotal program chunks created: {len(all_documents)}")
        return all_documents


if __name__ == "__main__":
    # Test the loader
    loader = ProgramDocumentLoader()
    chunks = loader.load_documents()
    
    print(f"\nSample chunk:")
    if chunks:
        print(f"Section: {chunks[0].metadata.get('section_name', 'N/A')}")
        print(f"Program: {chunks[0].metadata.get('program_title', 'N/A')}")
        print(f"Content preview: {chunks[0].page_content[:300]}...")

