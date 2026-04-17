"""
Simple RAG System (No LLM Required)
A lightweight version that uses retrieval-only for answering questions
"""

import os
from pathlib import Path
from typing import Dict, Any, List, Tuple
import re
try:
    from langchain_community.llms import Ollama
except ImportError:
    Ollama = None

try:
    from .document_loader import AdmissionDocumentLoader
    from .program_loader import ProgramDocumentLoader
    from .unified_loader import UnifiedDocumentLoader
    from .vector_store import VectorStoreManager
except ImportError:
    from document_loader import AdmissionDocumentLoader
    from program_loader import ProgramDocumentLoader
    from unified_loader import UnifiedDocumentLoader
    from vector_store import VectorStoreManager


class SimpleRAG:
    """Simple RAG system without LLM - uses retrieval and context summarization"""
    
    def __init__(
        self,
        data_folder: str = "data/Admission Information",
        program_folder: str = "data/Program",
        faculty_folder: str = "data/Faculty",
        vector_store_path: str = "vector_store",
        rebuild_vector_store: bool = False,
        include_programs: bool = True,
        include_faculty: bool = True,
        use_llm: bool = False,
        llm_model_name: str = "qwen2.5:3b",
        llm_temperature: float = 0.2
    ):
        self.data_folder = data_folder
        self.program_folder = program_folder
        self.faculty_folder = faculty_folder
        self.vector_store_path = vector_store_path
        self.use_llm = use_llm
        self.llm_model_name = llm_model_name
        self.llm_temperature = llm_temperature
        
        print("=" * 60)
        print("Simple Admission Information RAG System")
        flags = []
        if include_programs:
            flags.append("Programs")
        if include_faculty:
            flags.append("Faculty")
        if use_llm:
            flags.append(f"LLM:{llm_model_name}")
        if flags:
            print(f"(Including: {', '.join(flags)})")
        print("=" * 60)
        
        # Initialize vector store manager
        self.vs_manager = VectorStoreManager(
            persist_directory=vector_store_path,
            embedding_model_name="sentence-transformers/all-MiniLM-L6-v2"
        )
        
        # Load or create vector store
        if rebuild_vector_store or not (Path(vector_store_path) / "chroma.sqlite3").exists():
            print("\n[1/2] Loading documents and creating vector store...")
            
            if include_programs or include_faculty:
                # Use unified loader for admission + program + faculty (as configured)
                unified_loader = UnifiedDocumentLoader(
                    admission_folder=data_folder,
                    program_folder=program_folder,
                    faculty_folder=faculty_folder
                )
                chunks = unified_loader.load_all_documents()
            else:
                # Use only admission loader
                loader = AdmissionDocumentLoader(data_folder)
                chunks = loader.load_and_split()
            
            self.vs_manager.create_vector_store(chunks)
        else:
            print("\n[1/2] Loading existing vector store...")
            self.vs_manager.load_vector_store()
        
        print("\n" + "=" * 60)
        print("✓ RAG System Ready!")
        print("=" * 60)
    
    def ask(self, question: str, k: int = 5) -> Dict[str, Any]:
        """Ask a question and get answer with sources"""
        question_lower = question.lower()
        
        # Heuristics to detect faculty lookup queries (campus + dept + faculty terms)
        faculty_terms = [
            "faculty", "teacher", "professor", "prof", "hod", "lecturer",
            "lab engineer", "instructor", "staff", "dr ", "dr.", "doctor"
        ]
        campus_terms = [
            "islamabad", "karachi", "lahore", "faisalabad", "peshawar", "multan", "chiniot", "campus"
        ]
        dept_terms = [
            "computer science", "software engineering", "computer engineering", "cyber security",
            "data science", "artificial intelligence", "ai", "management sciences", "electrical engineering",
            "civil engineering", "accounting", "finance", "business analytics", "sciences and humanities",
            "sciences & humanities", "science and humanities", "science & humanities"
        ]
        is_faculty_query = any(t in question_lower for t in faculty_terms) or bool(
            re.search(r"\b(dr|prof|professor|lecturer|instructor|faculty)\b", question_lower)
        )
        campus_hit = next((t for t in campus_terms if t in question_lower), None)
        dept_hit = next((t for t in dept_terms if t in question_lower), None)

        # Check if this is an eligibility query (should NOT be treated as listing query)
        # Remove generic "requirements" and "requirement" - they're too broad and match rules queries
        is_eligibility_query = any(term in question_lower for term in [
            'eligible', 'eligibility', 'can i', 'am i', 'can i apply', 'am i eligible',
            'qualify', 'qualification', 'criteria',
            'fsc', 'fsc medical', 'pre-medical', 'pre medical', 'medical', 'ics', 'pre-engineering'
        ])
        
        # Check if this is a rules/regulations query - use a more general approach
        # Instead of hardcoding keywords, we'll detect it by checking if rules/regulations files
        # appear in the top results. But we can still check for obvious rules-related terms.
        # Only check for very specific rules-related terms that are unlikely to appear in other contexts
        is_rules_query = any(term in question_lower for term in [
            'academic rules', 'rules and regulations', 'code of conduct', 'disciplinary action'
        ])
        
        # Check if this is a fee query (should NOT be treated as listing query)
        is_fee_query = any(term in question_lower for term in [
            'fee', 'fees', 'tuition', 'cost', 'price', 'payment', 'payable',
            'semester fee', 'admission fee', 'tuition fee', 'security deposit',
            'refund', 'fine', 'charges', 'how much', 'what is the fee'
        ])
        
        # Check if query is about facilities (hostel, transport) vs programs
        is_facility_query = any(term in question_lower for term in [
            'hostel', 'transport', 'facility', 'facilities', 'accommodation', 
            'housing', 'bus', 'shuttle', 'pick', 'drop'
        ])
        is_hostel_query = any(term in question_lower for term in ['hostel', 'accommodation', 'housing'])
        is_attendance_query = any(term in question_lower for term in [
            'attendance', 'absent', 'absentee', 'short attendance', 'attendance requirement'
        ])
        is_test_pattern_query = 'test pattern' in question_lower or 'nu-oat' in question_lower or 'oat' in question_lower
        is_apply_query = any(term in question_lower for term in [
            'apply', 'application', 'admission process', 'how to apply', 'admissions'
        ])
        
        # Check if this is a listing query (needs to process many documents)
        # BUT exclude eligibility, fee, rules, and test-pattern queries from being treated as listing queries
        is_listing_query = not is_eligibility_query and not is_fee_query and not is_rules_query and not is_test_pattern_query and not is_facility_query and any(term in question_lower for term in [
            'what programs', 'programs available', 'programs are', 'list programs',
            'computing programs', 'management programs', 'engineering programs',
            'what computing', 'what management', 'what engineering'
        ])
        
        # Check if this is a campus query (but NOT if it's about facilities)
        is_campus_query = any(term in question_lower for term in [
            'islamabad', 'karachi', 'lahore', 'faisalabad', 'chiniot', 
            'peshawar', 'multan', 'campus'
        ]) and not is_facility_query  # Only treat as campus query if NOT a facility query
        
        # Enhance query for semester-related questions
        enhanced_query = self._enhance_query(question)
        
        # Get MANY more results to ensure Semester I chunk is included
        # We need to cast a wide net, then filter and prioritize
        # Retrieve 100 results to ensure we get Semester I chunk
        # For campus queries, retrieve more to get Programs Offered.txt content
        # For listing queries, retrieve many more to get all programs
        # For eligibility queries, prioritize Eligibility Criteria.txt
        # For fee queries, prioritize Fee Structure.txt
        # For rules queries, prioritize Academic Rules and Regulations.txt
        if is_listing_query:
            retrieval_k = 200  # Get many documents for listing queries
        elif is_campus_query:
            retrieval_k = 150
        elif is_eligibility_query:
            retrieval_k = 100  # Get enough to find Eligibility Criteria.txt
        elif is_fee_query:
            retrieval_k = 100  # Get enough to find Fee Structure.txt
        elif is_rules_query:
            retrieval_k = 100  # Get enough to find Academic Rules and Regulations.txt
        else:
            retrieval_k = 100
        docs_with_scores = self.vs_manager.similarity_search_with_score(enhanced_query, k=retrieval_k)
        
        # Faculty-specific post-filtering by campus/department metadata if detected
        if is_faculty_query and docs_with_scores:
            filtered = []
            for doc, score in docs_with_scores:
                meta = doc.metadata or {}
                campus = (meta.get("campus") or "").lower()
                dept = (meta.get("department") or "").lower()
                # Require campus match when user named a campus
                if campus_hit and campus_hit not in campus:
                    continue
                # Require department match when user named a department
                if dept_hit and dept_hit not in dept:
                    continue
                # Prefer only faculty docs that have campus/department metadata
                if meta.get("campus") and meta.get("department"):
                    filtered.append((doc, score))
            # If filtering leaves nothing, we'll handle below
            if filtered:
                docs_with_scores = filtered
            else:
                # Try a targeted faculty search if initial filter failed
                faculty_query = f"{campus_hit or ''} {dept_hit or ''} faculty professor lecturer hod staff"
                extra_faculty = self.vs_manager.similarity_search_with_score(faculty_query.strip(), k=50)
                extra_filtered = []
                for doc, score in extra_faculty:
                    meta = doc.metadata or {}
                    campus = (meta.get("campus") or "").lower()
                    dept = (meta.get("department") or "").lower()
                    if campus_hit and campus_hit not in campus:
                        continue
                    if dept_hit and dept_hit not in dept:
                        continue
                    if meta.get("campus") and meta.get("department"):
                        extra_filtered.append((doc, score))
                if extra_filtered:
                    docs_with_scores = extra_filtered
                else:
                    # No matching campus/department faculty found
                    if campus_hit and dept_hit:
                        return {
                            "answer": f"No faculty data found for {campus_hit.title()} Campus {dept_hit.title()} department.",
                            "sources": []
                        }
                    elif campus_hit:
                        return {
                            "answer": f"No faculty data found for {campus_hit.title()} Campus.",
                            "sources": []
                        }
                    elif dept_hit:
                        return {
                            "answer": f"No faculty data found for department {dept_hit.title()}.",
                            "sources": []
                        }

        if not docs_with_scores:
            return {
                "answer": "I couldn't find any relevant information to answer your question.",
                "sources": []
            }
        
        # For eligibility queries, rely purely on semantic similarity (no hardcoded boosting)
        
        # For fee queries, prioritize Fee Structure.txt
        if is_fee_query:
            # Boost Fee Structure.txt documents EXTREMELY
            fee_docs = []
            other_docs = []
            for doc, score in docs_with_scores:
                filename = doc.metadata.get('filename', '').lower()
                if 'fee' in filename or 'fee structure' in filename:
                    # Boost fee documents EXTREMELY (100x better)
                    fee_docs.append((doc, score * 0.01))  # Extreme priority
                else:
                    # Penalize non-fee documents heavily
                    other_docs.append((doc, score * 10.0))  # Much lower priority
            # Reorder: fee docs first, then others
            docs_with_scores = fee_docs + other_docs

        # For apply/admission queries, prioritize How to Apply / Admission Information
        if is_apply_query:
            apply_docs = []
            other_docs = []
            for doc, score in docs_with_scores:
                filename = doc.metadata.get('filename', '').lower()
                if ('how to apply' in filename or
                    'admission information' in filename or
                    'admission schedule' in filename or
                    'admission' in filename):
                    apply_docs.append((doc, score * 0.01))  # strong boost
                else:
                    other_docs.append((doc, score * 5.0))  # penalty
            if apply_docs:
                docs_with_scores = apply_docs + other_docs
        
        # For ANY query, check if rules/regulations files appear in results
        # If they do, boost them significantly (this handles attendance requirements, GPA, etc.)
        # This is more flexible than hardcoding keywords - let semantic search find the content,
        # then prioritize the right source files
        rules_files_found = any(
            'rules' in doc.metadata.get('filename', '').lower() or 
            'regulations' in doc.metadata.get('filename', '').lower() or
            'code of conduct' in doc.metadata.get('filename', '').lower()
            for doc, score in docs_with_scores[:20]  # Check top 20 results
        )
        
        # Determine if we should prioritize rules files
        # EXCLUDE eligibility and fee queries - they should use semantic similarity, not rules files
        should_prioritize_rules = (rules_files_found or is_rules_query or is_attendance_query) and not is_eligibility_query and not is_fee_query
        
        if should_prioritize_rules:
            # Boost Academic Rules and Regulations.txt and Code of Conduct.txt documents EXTREMELY
            rules_docs = []
            other_docs = []
            for doc, score in docs_with_scores:
                filename = doc.metadata.get('filename', '').lower()
                if 'rules' in filename or 'regulations' in filename or 'code of conduct' in filename:
                    # Boost rules documents EXTREMELY (100x better)
                    rules_docs.append((doc, score * 0.01))  # Extreme priority
                else:
                    # Penalize non-rules documents heavily
                    other_docs.append((doc, score * 10.0))  # Much lower priority
            # Reorder: rules docs first, then others
            docs_with_scores = rules_docs + other_docs

        # If rules/attendance query, keep only rules docs if present
        if should_prioritize_rules:
            rules_only = []
            for doc, score in docs_with_scores:
                filename = doc.metadata.get('filename', '').lower()
                if 'rules' in filename or 'regulations' in filename or 'code of conduct' in filename:
                    rules_only.append((doc, score))
            if rules_only:
                docs_with_scores = rules_only

        # For facility queries (hostel/transport), prioritize Transport and Hostel Facilities.txt
        if is_facility_query:
            facility_docs = []
            for doc, score in docs_with_scores:
                filename = (doc.metadata.get('filename') or '').lower()
                content_l = doc.page_content.lower()
                if 'transport' in filename or 'hostel' in filename:
                    if campus_hit and campus_hit not in content_l:
                        continue
                    facility_docs.append((doc, score * 0.01))  # Strong boost
            # Fallback: targeted search if none found
            if not facility_docs:
                facility_query = "hostel transport facility accommodation housing bus shuttle pick drop"
                extra_facility = self.vs_manager.similarity_search_with_score(facility_query, k=50)
                for d, s in extra_facility:
                    fname = (d.metadata.get('filename') or '').lower()
                    content_l = d.page_content.lower()
                    if 'transport' in fname or 'hostel' in fname:
                        if campus_hit and campus_hit not in content_l:
                            continue
                        facility_docs.append((d, s * 0.01))
            if facility_docs:
                docs_with_scores = facility_docs
            else:
                return {
                    "answer": "Transport/hostel information not found for the requested context.",
                    "sources": []
                }

        # If attendance query, keep only rules docs
        if is_attendance_query:
            rules_only = []
            for doc, score in docs_with_scores:
                filename = doc.metadata.get('filename', '').lower()
                if 'rules' in filename or 'regulations' in filename or 'code of conduct' in filename:
                    rules_only.append((doc, score))
            if rules_only:
                docs_with_scores = rules_only

        # If test pattern query, prioritize Test Pattern.txt
        if is_test_pattern_query:
            test_docs = []
            other_docs = []
            for doc, score in docs_with_scores:
                filename = doc.metadata.get('filename', '').lower()
                if 'test pattern' in filename:
                    test_docs.append((doc, score * 0.01))
                else:
                    other_docs.append((doc, score * 5.0))
            if test_docs:
                docs_with_scores = test_docs  # keep only test pattern docs when found

        # For facility queries (hostel/transport), softly boost transport/hostel docs but keep semantic top results
        if is_facility_query:
            boosted = []
            for doc, score in docs_with_scores:
                filename = (doc.metadata.get('filename') or '').lower()
                if 'transport' in filename or 'hostel' in filename:
                    boosted.append((doc, score * 0.1))  # Soft boost
                else:
                    boosted.append((doc, score))
            docs_with_scores = boosted
        
        # Filter out completely wrong results FIRST (aggressive filtering)
        # But skip filtering for eligibility, fee, rules, and facility queries to avoid removing relevant info
        if not is_eligibility_query and not is_fee_query and not is_rules_query and not is_facility_query:
            filtered_docs = self._filter_wrong_results(docs_with_scores, question)
            
            # If filtering removed all results, keep original (fallback)
            if filtered_docs:
                docs_with_scores = filtered_docs
        # Otherwise, keep original results but still prioritize
        
        # Filter and prioritize semester-related chunks if query mentions semester
        # BUT skip this for fee queries (they're asking about semester fees, not semester study plans)
        if not is_fee_query and any(term in question.lower() for term in ['semester', 'first', 'second', 'third', 'fourth', '1st', '2nd', '3rd', '4th']):
            # Check if target semester chunk exists in filtered results
            program_code = self._extract_program_name(question)
            target_semester = None
            question_lower = question.lower()
            if any(term in question_lower for term in ['first', '1st', 'semester 1', 'semester i']):
                target_semester = 'i'
            elif any(term in question_lower for term in ['second', '2nd', 'semester 2', 'semester ii']):
                target_semester = 'ii'
            elif any(term in question_lower for term in ['third', '3rd', 'semester 3', 'semester iii']):
                target_semester = 'iii'
            elif any(term in question_lower for term in ['fourth', '4th', 'semester 4', 'semester iv']):
                target_semester = 'iv'
            elif any(term in question_lower for term in ['fifth', '5th', 'semester 5', 'semester v']):
                target_semester = 'v'
            elif any(term in question_lower for term in ['sixth', '6th', 'semester 6', 'semester vi']):
                target_semester = 'vi'
            elif any(term in question_lower for term in ['seventh', '7th', 'semester 7', 'semester vii']):
                target_semester = 'vii'
            elif any(term in question_lower for term in ['eighth', '8th', 'semester 8', 'semester viii']):
                target_semester = 'viii'
            
            # If we're looking for a specific semester, check if it exists
            if target_semester and program_code:
                # Determine program level
                question_lower = question.lower()
                is_undergraduate = (
                    bool(re.search(r'\bbs\b', question_lower)) or 
                    question_lower.startswith('bs') or
                    any(term in question_lower for term in ['bachelor', 'undergraduate'])
                )
                
                semester_chunk_found = False
                for doc, score in docs_with_scores:
                    chunk_semester = doc.metadata.get('semester', '').lower()
                    filename = doc.metadata.get('filename', '').lower()
                    program_type = doc.metadata.get('program_type', '')
                    
                    # Check semester match
                    semester_match = chunk_semester == target_semester.lower()
                    
                    # Check program code match
                    program_match = program_code in filename
                    
                    # Check program level match
                    level_match = False
                    if is_undergraduate:
                        level_match = (filename.startswith('bs_') or program_type == 'Undergraduate')
                    else:
                        level_match = (filename.startswith('ms_') or program_type == 'Graduate')
                    
                    if semester_match and program_match and level_match:
                        semester_chunk_found = True
                        break
                
                # If Semester I chunk not found, do a targeted search
                if not semester_chunk_found:
                    # Determine if we need BS or MS
                    question_lower = question.lower()
                    is_undergraduate = (
                        bool(re.search(r'\bbs\b', question_lower)) or 
                        question_lower.startswith('bs') or
                        any(term in question_lower for term in ['bachelor', 'undergraduate'])
                    )
                    
                    # Search with a very specific query for the target semester
                    semester_names = {
                        'i': 'first', 'ii': 'second', 'iii': 'third', 'iv': 'fourth',
                        'v': 'fifth', 'vi': 'sixth', 'vii': 'seventh', 'viii': 'eighth'
                    }
                    semester_name = semester_names.get(target_semester.lower(), '')
                    
                    if is_undergraduate:
                        targeted_query = f"BS {program_code.upper()} Semester {target_semester.upper()} undergraduate bachelor {semester_name} semester"
                    else:
                        targeted_query = f"MS {program_code.upper()} Semester {target_semester.upper()} graduate master {semester_name} semester"
                    
                    targeted_results = self.vs_manager.similarity_search_with_score(targeted_query, k=50)
                    
                    # Filter for exact match: correct program level + correct program + correct semester
                    found_correct_chunk = False
                    checked_count = 0
                    for doc, score in targeted_results:
                        checked_count += 1
                        chunk_semester = doc.metadata.get('semester', '').lower()
                        filename = doc.metadata.get('filename', '').lower()
                        program_type = doc.metadata.get('program_type', '')
                        
                        chunk_semester = doc.metadata.get('semester', '').lower()
                        filename = doc.metadata.get('filename', '').lower()
                        program_type = doc.metadata.get('program_type', '')
                        
                        # Check program level match
                        level_match = False
                        if is_undergraduate:
                            level_match = (filename.startswith('bs_') or program_type == 'Undergraduate')
                            # Also check it's NOT a graduate program
                            is_graduate = (filename.startswith('ms_') or program_type == 'Graduate')
                            if is_graduate:
                                continue  # Skip graduate programs
                        else:
                            level_match = (filename.startswith('ms_') or program_type == 'Graduate')
                            # Also check it's NOT an undergraduate program
                            is_undergrad = (filename.startswith('bs_') or program_type == 'Undergraduate')
                            if is_undergrad:
                                continue  # Skip undergraduate programs
                        
                        if (chunk_semester == target_semester.lower() and 
                            program_code in filename and
                            level_match and
                            'study plan' in doc.page_content.lower()):
                            # Found it! Add with very high priority (low score)
                            docs_with_scores.append((doc, score * 0.0001))  # Extreme boost
                            found_correct_chunk = True
                            break
            
            docs_with_scores = self._prioritize_semester_chunks(docs_with_scores, question)
        
        # Check if this is a campus query and extract campus name
        target_campus = None
        if is_campus_query:
            campus_keywords = {
                'islamabad': 'Islamabad Campus',
                'karachi': 'Karachi Campus',
                'lahore': 'Lahore Campus',
                'faisalabad': 'Chiniot-Faisalabad Campus',
                'chiniot': 'Chiniot-Faisalabad Campus',
                'peshawar': 'Peshawar Campus',
                'multan': 'Multan Campus'
            }
            question_lower = question.lower()
            for keyword, campus_name in campus_keywords.items():
                if keyword in question_lower:
                    target_campus = campus_name
                    break
        
        # For queries that might be about rules/regulations, do a targeted search
        # This helps when the initial search doesn't find rules files
        # Check again after prioritization to see if rules files are now in top results
        rules_files_after_boost = any(
            'rules' in doc.metadata.get('filename', '').lower() or 
            'regulations' in doc.metadata.get('filename', '').lower() or
            'code of conduct' in doc.metadata.get('filename', '').lower()
            for doc, score in docs_with_scores[:10]  # Check top 10 after boost
        )
        
        if should_prioritize_rules and not rules_files_after_boost:
            # Search for Academic Rules and Regulations.txt using the original query
            # This ensures we get relevant chunks even if they weren't in initial results
            rules_results = self.vs_manager.similarity_search_with_score(enhanced_query + " academic rules regulations", k=30)
            seen_doc_ids = {hash(doc.page_content[:200]) for doc, score in docs_with_scores}  # Track existing docs
            
            for doc, score in rules_results:
                filename = doc.metadata.get('filename', '').lower()
                if ('rules' in filename or 'regulations' in filename or 'code of conduct' in filename):
                    # Check if we've already seen this document
                    doc_id = hash(doc.page_content[:200])  # Use first 200 chars as ID
                    if doc_id not in seen_doc_ids:
                        seen_doc_ids.add(doc_id)
                        # Add with high priority (low score)
                        docs_with_scores.append((doc, score * 0.01))  # Very high priority
            
            # Re-sort after adding targeted results to ensure rules docs are at the top
            docs_with_scores.sort(key=lambda x: x[1])  # Lower score = higher priority
        
        # For fee queries, do a targeted search for Fee Structure.txt
        if is_fee_query:
            # Search for Fee Structure.txt with multiple queries to get all chunks
            fee_structure_queries = [
                "Fee Structure tuition fee semester fee",
                "Fee Structure BS programs undergraduate",
                "Fee Structure admission fee security deposit",
                "Fee Structure credit hour payment",
                "Fee Structure refund policy"
            ]
            seen_filenames = {doc.metadata.get('filename', '').lower() for doc, score in docs_with_scores}
            seen_doc_ids = set()  # Track by content hash to avoid duplicates
            
            for fee_query in fee_structure_queries:
                fee_results = self.vs_manager.similarity_search_with_score(fee_query, k=20)
                for doc, score in fee_results:
                    filename = doc.metadata.get('filename', '').lower()
                    if 'fee' in filename or 'fee structure' in filename:
                        # Check if we've already seen this document
                        doc_id = hash(doc.page_content[:200])  # Use first 200 chars as ID
                        if doc_id not in seen_doc_ids:
                            seen_doc_ids.add(doc_id)
                            # Add with high priority (low score)
                            docs_with_scores.append((doc, score * 0.01))  # Very high priority
            
            # Re-sort after adding targeted results to ensure fee docs are at the top
            docs_with_scores.sort(key=lambda x: x[1])  # Lower score = higher priority
        
        # Extract documents and scores
        # For listing queries or campus queries, process ALL retrieved documents, not just top k
        if is_listing_query or (is_campus_query and not (is_rules_query or is_attendance_query or is_test_pattern_query)):
            # Process all retrieved documents to find all programs
            documents_to_process = [doc for doc, score in docs_with_scores]
            scores_to_process = [score for doc, score in docs_with_scores]
            
            # For campus queries (about programs), also do a targeted search for Programs Offered.txt
            # Skip program extraction for facility queries (hostel, transport, etc.)
            if is_campus_query and target_campus and not is_facility_query:
                # Search for Programs Offered.txt with multiple queries to get all chunks
                programs_offered_queries = [
                    f"{target_campus} programs available",
                    f"{target_campus} undergraduate programs",
                    f"{target_campus} graduate programs",
                    "Programs Offered undergraduate",
                    "Programs Offered graduate",
                    "Bachelor of Science",
                    "Master of Science"
                ]
                seen_filenames = {doc.metadata.get('filename', '').lower() for doc in documents_to_process}
                seen_doc_ids = set()  # Track by content hash to avoid duplicates
                
                for query in programs_offered_queries:
                    programs_offered_results = self.vs_manager.similarity_search_with_score(query, k=50)
                    for doc, score in programs_offered_results:
                        filename = doc.metadata.get('filename', '').lower()
                        if 'programs offered' in filename:
                            # Use content hash to avoid duplicates
                            doc_id = hash(doc.page_content[:200])
                            if doc_id not in seen_doc_ids:
                                documents_to_process.append(doc)
                                scores_to_process.append(score)
                                seen_doc_ids.add(doc_id)
                                seen_filenames.add(filename)
        else:
            # For other queries, use top k
            documents_to_process = [doc for doc, score in docs_with_scores[:k]]
            scores_to_process = [score for doc, score in docs_with_scores[:k]]
        
        # Check if this is a domain/program listing query (already checked above, but keep for domain filtering)
        question_lower = question.lower()
        
        # Extract target domain if specified
        target_domain = None
        if 'computing' in question_lower:
            target_domain = 'Computing'
        elif 'management' in question_lower:
            target_domain = 'Management Sciences'
        elif 'engineering' in question_lower:
            target_domain = 'Engineering'
        
        # Check if this is a campus query (target_campus already extracted above)

        # If campus query, try to extract programs directly from Programs Offered text
        if is_campus_query and target_campus and not is_facility_query and not is_faculty_query and not is_rules_query and not is_attendance_query and not is_test_pattern_query:
            campus_programs = self._extract_programs_for_campus(docs_with_scores, target_campus)
            # If we found programs, use them immediately (skip the rest of combination logic)
            if campus_programs:
                level_filter = self._program_level_filter(question_lower)
                if level_filter:
                    campus_programs = [p for p in campus_programs if p[1] == level_filter]
                campus_programs_names = [p[0] for p in campus_programs]
                # If the question asks about a specific program, answer yes/no from the list
                program_query_name = self._extract_program_phrase(question_lower)
                only_po_docs = [doc for doc, score in docs_with_scores if "programs offered" in doc.metadata.get("filename", "").lower()]
                sources = []
                for i, doc in enumerate(only_po_docs[:k], 1):
                    sources.append({
                        "rank": i,
                        "source_file": doc.metadata.get("filename", "Unknown"),
                        "relevance_score": 0.0,  # not using score here
                        "content": doc.page_content
                    })

                if program_query_name:
                    found = any(program_query_name in prog.lower() for prog in campus_programs_names)
                    ans_text = "Yes" if found else "No"
                    answer = f"{ans_text}, {program_query_name.title()} is " + ("offered" if found else "not listed") + f" at {target_campus}."
                else:
                    if level_filter == 'graduate':
                        header = f"Graduate programs at {target_campus}:"
                    elif level_filter == 'postgraduate':
                        header = f"Postgraduate programs at {target_campus}:"
                    elif level_filter == 'undergraduate':
                        header = f"Undergraduate programs at {target_campus}:"
                    else:
                        header = f"Programs available at {target_campus}:"
                    answer = header + "\n\n" + "\n".join(f"• {prog}" for prog in sorted(campus_programs_names))

                return {
                    "answer": answer,
                    "sources": sources,
                    "source_documents": only_po_docs[:k]
                }

        # Combine top documents as context
        context_parts = []
        seen_content = set()
        seen_programs = set()  # Track unique programs for listing queries
        campus_programs = []  # For campus-specific queries
        
        # For faculty queries, allow all matching docs to list full faculty
        max_docs = len(documents_to_process) if is_faculty_query else 3

        for doc, score in zip(documents_to_process, scores_to_process):
            content = doc.page_content
            metadata = doc.metadata
            filename = metadata.get('filename', '').lower()
            
            # For fee queries, skip program files (BS_*.txt, MS_*.txt) - only use Fee Structure.txt
            if is_fee_query:
                if filename.startswith('bs_') or filename.startswith('ms_'):
                    continue  # Skip program files for fee queries
            
            # For rules queries, skip program files (BS_*.txt, MS_*.txt) - only use Academic Rules and Regulations.txt
            if is_rules_query:
                if filename.startswith('bs_') or filename.startswith('ms_'):
                    continue  # Skip program files for rules queries
            
            # For campus queries (about programs), prioritize Programs Offered.txt and filter by campus
            # Skip program extraction for facility queries (hostel, transport, etc.)
            if is_campus_query and target_campus and not is_facility_query and not is_faculty_query:
                # Check if this is from Programs Offered.txt
                if 'programs offered' in filename:
                    # Extract programs available at target campus
                    content_lower = content.lower()
                    campus_lower = target_campus.lower()
                    
                    # Determine program level from query (once per chunk, not per line)
                    # Use ORIGINAL question, not enhanced query, to avoid false positives
                    question_lower = question.lower()
                    # Only set to True if explicitly mentioned - don't infer from generic "programs" queries
                    # Use word boundaries to avoid matching "ms" in "programs" or "bs" in other words
                    is_bs_query = (
                        bool(re.search(r'\bbs\b', question_lower)) or 
                        question_lower.startswith('bs ') or
                        any(term in question_lower for term in ['bachelor', 'undergraduate'])
                    )
                    is_ms_query = (
                        bool(re.search(r'\bms\b', question_lower)) or  # Use word boundary to avoid matching "ms" in "programs"
                        question_lower.startswith('ms ') or
                        any(term in question_lower for term in ['master', 'mba'])
                    )
                    is_phd_query = (
                        bool(re.search(r'\bphd\b', question_lower)) or
                        bool(re.search(r'\bph\.d\b', question_lower)) or
                        any(term in question_lower for term in ['doctor', 'postgraduate', 'post graduate'])
                    )
                    
                    # If query just says "programs" without specifying level, extract ALL levels
                    # This means all flags should be False (don't filter anything)
                    if not is_bs_query and not is_ms_query and not is_phd_query:
                        # Generic query - extract all programs (don't filter)
                        # Flags are already False, so this is just for clarity
                        pass
                    
                    # Process ALL Programs Offered.txt chunks - don't filter by campus at chunk level
                    # Extract program information from the content line by line
                    # Pattern: "Bachelor of Science in X (BS Y) is available at..."
                    program_lines = content.split('\n')
                    bs_lines_found = 0
                    ms_lines_found = 0
                    phd_lines_found = 0
                    for line in program_lines:
                        line_lower = line.lower()
                        # Check if line mentions the campus or "all campuses" AND is a program line
                        # This ensures we only extract programs available at the target campus
                        if (campus_lower in line_lower or 'all campuses' in line_lower) and \
                           ('bachelor' in line_lower or 'master' in line_lower or 'phd' in line_lower or 'doctor' in line_lower):
                                
                                # IMPORTANT: Check PhD FIRST to avoid matching "MS" in "(PhD MS)" as Master of Science
                                # Extract PhD/Postgraduate programs
                                if ('phd' in line_lower or 'doctor' in line_lower or 'ph.d' in line_lower):
                                    phd_lines_found += 1
                                    # Skip PhD programs if query explicitly asks for BS or MS only
                                    if (is_bs_query or is_ms_query) and not is_phd_query:
                                        continue  # Skip PhD programs when query asks for BS/MS only
                                    
                                    program_code = None
                                    program_name = None
                                    
                                    # Try to match PhD programs
                                    # Pattern: (PhD CS) or (PhD CV) or (PhD MS) etc.
                                    program_match = re.search(r'\(PhD\s+([A-Z\s]+)\)', line, re.IGNORECASE)
                                    if program_match:
                                        program_code = program_match.group(1).replace(' ', '').upper()
                                    else:
                                        # Try PhD without parentheses
                                        program_match = re.search(r'\bPhD\s+([A-Z\s]+)', line, re.IGNORECASE)
                                        if program_match:
                                            program_code = program_match.group(1).replace(' ', '').upper()
                                    
                                    if program_code:
                                        # Extract program name
                                        if 'Doctor of Philosophy' in line:
                                            name_match = re.search(r'Doctor of Philosophy in ([^(]+)', line, re.IGNORECASE)
                                            if name_match:
                                                program_name = f"Doctor of Philosophy in {name_match.group(1).strip()}"
                                            else:
                                                program_name = line.split('(')[0].strip()
                                        else:
                                            program_name = line.split('(')[0].strip()
                                        
                                        # Special handling for PhD MS (Management Sciences) to avoid confusion with MS (Master of Science)
                                        if program_code == 'MS':
                                            program_code = 'MS'  # Keep as MS but it's PhD MS
                                            # Ensure we have the full name
                                            if 'Management Sciences' in line:
                                                program_name = 'Doctor of Philosophy in Management Sciences'
                                        
                                        program_key = f"PhD_{program_code}"
                                        if program_key not in seen_programs:
                                            seen_programs.add(program_key)
                                            campus_programs.append(f"{program_name} (PhD {program_code})")
                                
                                # Extract BS programs
                                elif ('bachelor' in line_lower or 'bs' in line_lower):
                                    bs_lines_found += 1
                                    # Skip BS programs if query explicitly asks for MS/PhD only
                                    if (is_ms_query or is_phd_query) and not is_bs_query:
                                        continue  # Skip BS programs when query asks for MS/PhD only
                                    
                                    program_code = None
                                    program_name = None
                                    
                                    # Try multiple patterns to extract program code
                                    # Pattern 1: (BS AF) or (BS SE) etc. - handles spaces in code
                                    program_match = re.search(r'\(BS\s+([A-Z\s]+)\)', line, re.IGNORECASE)
                                    if program_match:
                                        # Remove spaces from code (e.g., "AF" from "BS AF")
                                        program_code = program_match.group(1).replace(' ', '').upper()
                                    else:
                                        # Pattern 2: (BBA) - Bachelor of Business Administration
                                        if 'bachelor of business administration' in line_lower or 'bba' in line_lower:
                                            bba_match = re.search(r'\(BBA\)', line, re.IGNORECASE)
                                            if bba_match:
                                                program_code = 'BBA'
                                        # Pattern 3: BS without parentheses (e.g., "BS AF" in text)
                                        if not program_code:
                                            program_match = re.search(r'\bBS\s+([A-Z\s]+)', line, re.IGNORECASE)
                                            if program_match:
                                                program_code = program_match.group(1).replace(' ', '').upper()
                                    
                                    if program_code:
                                        # Extract full program name
                                        if 'Bachelor of Science' in line:
                                            # Extract name between "Bachelor of Science" and "("
                                            name_match = re.search(r'Bachelor of Science in ([^(]+)', line, re.IGNORECASE)
                                            if name_match:
                                                program_name = f"Bachelor of Science in {name_match.group(1).strip()}"
                                            else:
                                                program_name = line.split('(')[0].strip()
                                        elif 'Bachelor of Business Administration' in line or 'BBA' in line:
                                            program_name = 'Bachelor of Business Administration'
                                        else:
                                            program_name = line.split('(')[0].strip()
                                        
                                        program_key = f"BS_{program_code}"
                                        if program_key not in seen_programs:
                                            seen_programs.add(program_key)
                                            campus_programs.append(f"{program_name} (BS {program_code})")
                                
                                # Extract MS/MBA programs
                                # IMPORTANT: Exclude PhD lines (e.g., "PhD MS" should not match here)
                                elif ('master' in line_lower or ('ms' in line_lower and 'phd' not in line_lower and 'doctor' not in line_lower) or 'mba' in line_lower):
                                    ms_lines_found += 1
                                    # Skip MS programs if query explicitly asks for BS or PhD only
                                    if (is_bs_query or is_phd_query) and not is_ms_query:
                                        continue  # Skip MS programs when query asks for BS/PhD only
                                    
                                    program_code = None
                                    program_name = None
                                    
                                    # Try to match MS programs first
                                    program_match = re.search(r'\(MS\s+([A-Z\s]+)\)', line, re.IGNORECASE)
                                    if program_match:
                                        program_code = program_match.group(1).replace(' ', '').upper()
                                    else:
                                        # Try MS without parentheses
                                        program_match = re.search(r'\bMS\s+([A-Z\s]+)', line, re.IGNORECASE)
                                        if program_match:
                                            program_code = program_match.group(1).replace(' ', '').upper()
                                        else:
                                            # Check for MBA
                                            if 'mba' in line_lower or 'Master of Business Administration' in line:
                                                program_code = 'MBA'
                                    
                                    if program_code:
                                        # Extract program name
                                        if 'Master of Science' in line:
                                            name_match = re.search(r'Master of Science in ([^(]+)', line, re.IGNORECASE)
                                            if name_match:
                                                program_name = f"Master of Science in {name_match.group(1).strip()}"
                                            else:
                                                program_name = line.split('(')[0].strip()
                                        elif 'Master of Business Administration' in line or program_code == 'MBA':
                                            program_name = 'Master of Business Administration'
                                        else:
                                            program_name = line.split('(')[0].strip()
                                        
                                        program_key = f"MS_{program_code}"
                                        if program_key not in seen_programs:
                                            seen_programs.add(program_key)
                                            campus_programs.append(f"{program_name} ({program_code})")
                    
                elif is_listing_query:
                    # For listing queries, extract unique program information
                    program_code = metadata.get('program_code', '')
                    program_title = metadata.get('program_title', '')
                    domain = metadata.get('domain', '')
                    level = metadata.get('level', '')
                    
                    if program_code and program_title:
                        program_key = f"{level}_{program_code}"
                        if program_key not in seen_programs:
                            seen_programs.add(program_key)
                            # Format: "BS Software Engineering (BS_SE) - Domain: Computing"
                            program_info = f"{program_title} ({program_code})"
                            if domain:
                                program_info += f" - Domain: {domain}"
                            context_parts.append(program_info)
            elif is_listing_query:
                # For listing queries, extract unique program information
                program_code = metadata.get('program_code', '')
                program_title = metadata.get('program_title', '')
                domain = metadata.get('domain', '')
                level = metadata.get('level', '')
                
                # Filter by domain if specified
                if target_domain and domain and domain != target_domain:
                    continue  # Skip programs from other domains
                
                if program_code and program_title:
                    program_key = f"{level}_{program_code}"
                    if program_key not in seen_programs:
                        seen_programs.add(program_key)
                        # Format: "BS Software Engineering (BS_SE) - Domain: Computing"
                        program_info = f"{program_title} ({program_code})"
                        if domain:
                            program_info += f" - Domain: {domain}"
                        context_parts.append(program_info)
            else:
                # For other queries, use original logic
                # Avoid duplicate content
                content_hash = hash(doc.page_content[:200])
                if content_hash not in seen_content:
                    chunk_content = doc.page_content
                    # For faculty queries, strip trailing non-faculty sections (e.g., appended campus/program summaries)
                    if is_faculty_query:
                        chunk_content = self._strip_non_faculty_sections(chunk_content)
                    # For hostel queries, trim to hostel/transport info
                    if is_hostel_query and ('hostel' not in chunk_content.lower() and 'transport' not in chunk_content.lower()):
                        continue
                    context_parts.append(chunk_content)
                    seen_content.add(content_hash)
            if not is_faculty_query and len(context_parts) >= max_docs:
                break
        
        # Create answer from context
        # Only format as program list if it's a campus query about programs (not facilities/rules/attendance/test pattern/faculty)
        if is_campus_query and target_campus and not is_facility_query and not is_faculty_query and not is_rules_query and not is_attendance_query and not is_test_pattern_query:
            if campus_programs:
                answer = f"Programs available at {target_campus}:\n\n" + "\n".join(f"• {prog}" for prog in campus_programs[:30])
            else:
                answer = f"Based on Programs Offered information, programs at {target_campus} should be listed in the Programs Offered document. Please check the source file for complete details."
        elif is_listing_query and context_parts:
            answer = "Programs available:\n\n" + "\n".join(f"• {prog}" for prog in context_parts[:20])
        elif is_faculty_query and context_parts:
            header = "Faculty"
            if campus_hit:
                header += f" - {campus_hit.title()} Campus"
            if dept_hit:
                header += f" - {dept_hit.title()} Department"
            answer = f"{header}:\n\n" + "\n\n".join(context_parts)
        elif is_test_pattern_query:
            if not context_parts:
                # Fallback: use top test-pattern docs directly
                context_parts = [doc.page_content for doc, score in docs_with_scores[:3]]
            answer = self._format_general_answer(question, context_parts)
        elif is_eligibility_query:
            # For eligibility queries, always build a retrieval-based fallback answer first.
            # If LLM is enabled and succeeds later, it can overwrite this answer.
            if not context_parts:
                # Fallback: use top docs directly
                context_parts = [doc.page_content for doc, score in docs_with_scores[:5]]
            answer = self._format_general_answer(question, context_parts, max_points=3)
        elif is_facility_query and context_parts:
            answer = self._format_facility_answer(question, context_parts)
        elif is_attendance_query and context_parts:
            answer = self._format_general_answer(question, context_parts)
        elif is_rules_query and context_parts:
            answer = self._format_general_answer(question, context_parts)
        elif is_apply_query and context_parts:
            answer = self._format_general_answer(question, context_parts)
        else:
            max_docs = 3
            context = "\n\n".join(context_parts[:max_docs])  # Use top docs
            answer = self._format_general_answer(question, context_parts) if context_parts else f"Based on the admission information:\n\n{context}"
        
        # If no context was accumulated (e.g., after strict filtering), fall back to top docs
        if not context_parts and documents_to_process:
            for doc in documents_to_process[:3]:
                chunk_content = doc.page_content
                if is_faculty_query:
                    chunk_content = self._strip_non_faculty_sections(chunk_content)
                if is_hostel_query and ('hostel' not in chunk_content.lower() and 'transport' not in chunk_content.lower()):
                    continue
                context_parts.append(chunk_content)

        # LLM generation (optional) — skip only for structured lists (campus program listings, faculty lists, explicit program listings)
        # For normal Q&A, prefer LLM with richer retrieved context.
        if self.use_llm and not (is_campus_query or is_faculty_query or is_listing_query):
            # Build LLM context from top retrieved documents directly (richer than condensed context_parts).
            llm_doc_limit = int(os.getenv("RAG_LLM_DOCS", "10"))
            llm_context = "\n\n".join([doc.page_content for doc, score in docs_with_scores[:llm_doc_limit]])
            if not llm_context.strip() and context_parts:
                llm_context = "\n\n".join(context_parts)

            # Allow substantially larger context for complete answers.
            llm_context_chars = int(os.getenv("RAG_LLM_CONTEXT_CHARS", "14000"))
            llm_context = llm_context[:llm_context_chars]
            print(f"[LLM] Invoking {self.llm_model_name} with context length={len(llm_context)} chars")
            llm_answer = self._llm_generate(question, llm_context)
            if llm_answer and llm_answer.strip():
                answer = llm_answer
            elif is_eligibility_query and context_parts:
                # Fallback: if LLM fails, return context directly for eligibility queries
                answer = "\n\n".join(context_parts[:3])

        # Truncate if too long (but never truncate faculty responses and never truncate LLM-generated answer)
        if (not is_faculty_query) and (not self.use_llm) and len(answer) > 5000:
            answer = answer[:5000] + "..."
        
        # Prepare sources (use top k documents for sources, not all processed)
        sources = []
        top_documents = [doc for doc, score in docs_with_scores[:k]]
        top_scores = [score for doc, score in docs_with_scores[:k]]
        for i, (doc, score) in enumerate(zip(top_documents, top_scores), 1):
            # Show full content in sources (chunks are complete, truncation was only for display)
            sources.append({
                "rank": i,
                "source_file": doc.metadata.get("filename", "Unknown"),
                "relevance_score": float(1 - score),  # Convert distance to similarity
                "content": doc.page_content  # Show full chunk content (chunks are complete, not truncated)
            })
        
        # Return appropriate documents based on query type
        if is_listing_query:
            return_documents = documents_to_process[:50]  # Return more docs for listing queries
        else:
            return_documents = top_documents
        
        return {
            "answer": answer,
            "sources": sources,
            "source_documents": return_documents
        }

    def _format_facility_answer(self, question: str, context_parts: List[str]) -> str:
        """Return a concise sentence response for facility questions."""
        return self._format_general_answer(question, context_parts, max_points=2)

    def _format_general_answer(self, question: str, context_parts: List[str], max_points: int = 5) -> str:
        """Create concise, sentence-level answers for general query types."""
        if not context_parts:
            return "I couldn't find enough relevant information to answer this clearly."

        question_lower = question.lower()
        question_terms = {
            t for t in re.findall(r"[a-zA-Z]{3,}", question_lower)
            if t not in {
                "what", "when", "where", "which", "about", "from", "that", "this",
                "with", "have", "there", "their", "your", "please", "tell", "give"
            }
        }

        candidates = []
        seen = set()
        for block in context_parts:
            # Sentence-level parsing gives cleaner answers than raw lines/chunks.
            for raw_sentence in re.split(r'(?<=[.!?])\s+', block):
                sentence = raw_sentence.strip()
                if not sentence:
                    continue
                sentence_l = sentence.lower()

                # Skip noisy headings and labels.
                if sentence_l.startswith("section:") or sentence_l.startswith("source:"):
                    continue
                if "national university of computer and emerging sciences" in sentence_l and len(sentence) < 120:
                    continue
                if len(sentence) < 20:
                    continue

                # Keep lines that are likely relevant to question terms.
                tokens = set(re.findall(r"[a-zA-Z]{3,}", sentence_l))
                overlap = len(tokens & question_terms)
                if question_terms and overlap == 0:
                    continue

                key = re.sub(r"\s+", " ", sentence_l)
                if key in seen:
                    continue
                seen.add(key)
                # Prefer medium-length explanatory sentences.
                length_penalty = abs(len(sentence) - 120) / 120.0
                score = overlap - (0.4 * length_penalty)
                candidates.append((score, sentence))

        if not candidates:
            # fallback to first meaningful sentences
            for block in context_parts:
                for raw_sentence in re.split(r'(?<=[.!?])\s+', block):
                    sentence = raw_sentence.strip()
                    if len(sentence) >= 20:
                        key = re.sub(r"\s+", " ", sentence.lower())
                        if key not in seen:
                            seen.add(key)
                            candidates.append((0, sentence))
                    if len(candidates) >= max_points:
                        break
                if len(candidates) >= max_points:
                    break

        # Prefer sentences with better relevance scores.
        candidates.sort(key=lambda x: x[0], reverse=True)
        top_sentences = [s for _, s in candidates[:max_points]]

        if not top_sentences:
            return "I found related information, but couldn't form a concise answer."

        # Yes/No style for direct questions.
        is_yes_no = bool(re.match(r"^\s*(is|are|can|does|do|has|have|was|were)\b", question_lower))
        if is_yes_no:
            positive_signals = ["available", "provides", "provide", "offered", "facility", "hostel", "transport"]
            has_positive = any(any(sig in s.lower() for sig in positive_signals) for s in top_sentences)
            prefix = "Yes" if has_positive else "Based on available information"
            return f"{prefix}, {top_sentences[0]}"

        # Default: short paragraph style.
        return " ".join(top_sentences[:2])

    def _extract_programs_for_campus(self, docs_with_scores, target_campus: str):
        """Extract program names and levels for a given campus from Programs Offered content."""
        campus_lower = target_campus.lower()
        programs = []
        patterns = [
            r"(Bachelor of [A-Za-z\s&]+?)\s*\(",
            r"(Master of [A-Za-z\s&]+?)\s*\(",
            r"(Doctor of Philosophy in [A-Za-z\s&]+?)\s*\("
        ]
        for doc, score in docs_with_scores:
            filename = doc.metadata.get("filename", "").lower()
            if "programs offered" not in filename:
                continue
            for line in doc.page_content.splitlines():
                line_lower = line.lower()
                if campus_lower in line_lower or "all campuses" in line_lower:
                    for pat in patterns:
                        m = re.search(pat, line)
                        if m:
                            name = m.group(1).strip()
                            level = 'undergraduate' if name.startswith("Bachelor") else 'graduate' if name.startswith("Master") else 'postgraduate'
                            programs.append((name, level))
        return programs

    def _extract_program_phrase(self, question_lower: str) -> str:
        """Extract a simple program phrase from the question for yes/no campus checks."""
        phrases = [
            "software engineering",
            "computer science",
            "cyber security",
            "data science",
            "artificial intelligence",
            "business analytics",
            "accounting and finance",
            "financial technology",
            "computer engineering",
            "electrical engineering",
            "civil engineering",
            "business administration",
            "bba",
        ]
        for p in phrases:
            if p in question_lower:
                return p
        return None

    def _program_level_filter(self, question_lower: str) -> str:
        """Determine if the question asks for a specific program level."""
        if any(term in question_lower for term in ['bachelor', 'undergraduate', 'bs ']):
            return 'undergraduate'
        if any(term in question_lower for term in ['master', 'graduate', 'ms ', 'mba']):
            return 'graduate'
        if any(term in question_lower for term in ['phd', 'postgraduate', 'post graduate', 'doctor of philosophy']):
            return 'postgraduate'
        return None

    def _strip_non_faculty_sections(self, content: str) -> str:
        """Remove trailing non-faculty sections (e.g., campus summaries) from faculty chunks."""
        lines = content.splitlines()
        cleaned = []
        stop_markers = (
            "Section:",
            "Programs Offered",
            "Programs offered",
            "Campus Summary",
            "---",
            "Bachelor of",
            "Master of",
            "Doctor of Philosophy",
        )
        for line in lines:
            if any(line.strip().startswith(marker) for marker in stop_markers):
                break
            cleaned.append(line)
        return "\n".join(cleaned).strip()

    def _llm_generate(self, question: str, context: str) -> str:
        """Generate answer using local Ollama LLM if available."""
        if not Ollama:
            return None
        if not context or not context.strip():
            return None
        try:
            llm = Ollama(model=self.llm_model_name, temperature=self.llm_temperature)
            prompt = (
                "Answer the following question using ONLY the information provided in the context below. "
                "Extract and present the relevant information clearly and concisely.\n\n"
                f"Context:\n{context}\n\n"
                f"Question: {question}\n\n"
                "Answer based on the context above:"
            )
            result = llm.invoke(prompt)
            # Clean up the response - remove "Not found" if context exists
            if result and "not found" in result.lower() and len(context) > 100:
                # Context exists but LLM said not found - try to extract anyway
                return f"Based on the provided information:\n\n{context[:500]}..."
            return result
        except Exception as e:
            print(f"[LLM Error] {e}")
            return None
    
    def _enhance_query(self, question: str) -> str:
        """Enhance query for better matching"""
        question_lower = question.lower()
        
        # Map common semester terms to normalized forms
        semester_mappings = {
            'first semester': 'first semester semester i semester 1 1st semester Semester I',
            '1st semester': 'first semester semester i semester 1 1st semester Semester I',
            'semester 1': 'first semester semester i semester 1 1st semester Semester I',
            'first': 'first semester semester i semester 1 1st semester Semester I',  # Add standalone "first"
            'second semester': 'second semester semester ii semester 2 2nd semester Semester II',
            '2nd semester': 'second semester semester ii semester 2 2nd semester Semester II',
            'semester 2': 'second semester semester ii semester 2 2nd semester Semester II',
        }
        
        enhanced = question
        
        # Add semester synonyms - check for "first" as standalone word too
        added_semester = False
        for term, replacement in semester_mappings.items():
            if term in question_lower:
                enhanced += f" {replacement}"
                added_semester = True
                break
        
        # If "first" appears but wasn't caught above, add it
        if not added_semester and 'first' in question_lower and 'semester' in question_lower:
            enhanced += " first semester semester i semester 1 1st semester Semester I"
        
        # Detect campus queries and enhance
        campus_keywords = {
            'islamabad': 'Islamabad Campus',
            'karachi': 'Karachi Campus',
            'lahore': 'Lahore Campus',
            'faisalabad': 'Chiniot-Faisalabad Campus',
            'chiniot': 'Chiniot-Faisalabad Campus',
            'peshawar': 'Peshawar Campus',
            'multan': 'Multan Campus'
        }
        
        detected_campus = None
        for keyword, campus_name in campus_keywords.items():
            if keyword in question_lower:
                detected_campus = campus_name
                enhanced += f" {campus_name} available at campus"
                break
        
        # Detect eligibility queries and enhance
        is_eligibility = any(term in question_lower for term in ['eligible', 'eligibility', 'can i', 'am i', 'qualify', 'qualification', 'requirements'])
        if is_eligibility:
            enhanced += " eligibility criteria requirements FSC HSSC pre-medical pre-engineering ICS mathematics"
        
        # Detect fee queries and enhance
        is_fee = any(term in question_lower for term in ['fee', 'fees', 'tuition', 'cost', 'price', 'payment', 'payable', 'semester fee', 'admission fee', 'tuition fee'])
        if is_fee:
            enhanced += " fee structure tuition fee admission fee security deposit semester fee credit hour payment refund"
        
        # Detect rules/regulations queries and enhance (only for explicit rules queries)
        # For general queries, we'll rely on filename-based prioritization
        is_rules = any(term in question_lower for term in [
            'academic rules', 'rules and regulations', 'code of conduct', 'disciplinary action'
        ])
        if is_rules:
            enhanced += " academic rules regulations code of conduct"
        
        # Detect domain queries and enhance (but NOT for eligibility, fee, or rules queries)
        if not is_eligibility and not is_fee and not is_rules:
            if any(term in question_lower for term in ['computing programs', 'computing domain', 'what computing']):
                enhanced += " Domain: Computing program code program title"
            elif any(term in question_lower for term in ['management programs', 'management sciences', 'management domain']):
                enhanced += " Domain: Management Sciences program code program title"
            elif any(term in question_lower for term in ['engineering programs', 'engineering domain']):
                enhanced += " Domain: Engineering program code program title"
            elif 'domain' in question_lower or 'programs available' in question_lower or 'programs are' in question_lower:
                # Generic program listing query
                enhanced += " program code program title domain level"
        
        # Detect program level and add emphasis - check for "bs" as word or at start
        # Only add level keywords if explicitly mentioned in query
        has_bs = bool(re.search(r'\bbs\b', question_lower)) or question_lower.startswith('bs')
        has_bachelor = any(term in question_lower for term in ['bachelor', 'undergraduate', 'b.s.'])
        has_ms = bool(re.search(r'\bms\b', question_lower)) or question_lower.startswith('ms')
        has_master = any(term in question_lower for term in ['master', 'graduate', 'm.s.', 'masters'])
        
        # Only enhance if level is explicitly mentioned - don't add keywords for generic "programs" queries
        if has_bs or has_bachelor:
            enhanced += " undergraduate bachelor bs bachelor of science"
        elif has_ms or has_master:
            enhanced += " graduate master ms master of science"
        # If neither BS nor MS is mentioned, don't add level keywords (allows both to be retrieved)
        
        return enhanced
    
    def _extract_program_name(self, question: str) -> str:
        """Extract program name from question (e.g., 'software engineering' -> 'SE')"""
        question_lower = question.lower()
        
        # Map program names to codes
        program_mappings = {
            'software engineering': 'se',
            'computer science': 'cs',
            'cyber security': 'cy',
            'data science': 'ds',
            'artificial intelligence': 'ai',
            'electrical engineering': 'ee',
            'computer engineering': 'ce',
            'civil engineering': 'civil',
            'accounting finance': 'af',
            'business analytics': 'ba',
            'business administration': 'bba',
            'financial technology': 'fintech',
        }
        
        for program_name, code in program_mappings.items():
            if program_name in question_lower:
                return code
        return None
    
    def _prioritize_semester_chunks(self, docs_with_scores: List[Tuple], question: str) -> List[Tuple]:
        """Prioritize chunks that contain semester information and match program level"""
        question_lower = question.lower()
        
        # Detect program level from query - use regex for word boundaries
        is_undergraduate = (
            bool(re.search(r'\bbs\b', question_lower)) or 
            question_lower.startswith('bs') or
            any(term in question_lower for term in [
                'bachelor', 'undergraduate', 'b.s.', 
                'bachelor of science', 'bachelor\'s'
            ])
        )
        is_graduate = (
            bool(re.search(r'\bms\b', question_lower)) or 
            question_lower.startswith('ms') or
            any(term in question_lower for term in [
                'master', 'graduate', 'm.s.', 'masters',
                'master of science', 'master\'s'
            ])
        )
        
        # Extract program name
        program_code = self._extract_program_name(question)
        
        # Check if query mentions specific semester
        semester_keywords = []
        target_semester = None
        if any(term in question_lower for term in ['first', '1st', 'semester 1', 'semester i']):
            semester_keywords = ['semester i', 'first semester', '1st semester', 'semester 1']
            target_semester = 'i'
        elif any(term in question_lower for term in ['second', '2nd', 'semester 2', 'semester ii']):
            semester_keywords = ['semester ii', 'second semester', '2nd semester', 'semester 2']
            target_semester = 'ii'
        elif any(term in question_lower for term in ['third', '3rd', 'semester 3', 'semester iii']):
            semester_keywords = ['semester iii', 'third semester', '3rd semester', 'semester 3']
            target_semester = 'iii'
        elif any(term in question_lower for term in ['fourth', '4th', 'semester 4', 'semester iv']):
            semester_keywords = ['semester iv', 'fourth semester', '4th semester', 'semester 4']
            target_semester = 'iv'
        
        # Score chunks based on semester match, program level, and program name
        scored_docs = []
        for doc, score in docs_with_scores:
            content_lower = doc.page_content.lower()
            metadata = doc.metadata
            filename = metadata.get('filename', '').lower()
            
            adjusted_score = score
            
            # CRITICAL: Match specific program name
            matches_program = False
            if program_code:
                # Check if filename matches program code
                if filename.startswith(f'bs_{program_code}') or filename.startswith(f'ms_{program_code}'):
                    matches_program = True
                    adjusted_score = score * 0.01  # EXTREME boost for exact program match (100x better)
                elif program_code in filename:
                    matches_program = True
                    adjusted_score = score * 0.05  # Very strong boost
                else:
                    # Penalize wrong program
                    adjusted_score = score * 2.0  # Penalty for wrong program
            
            # VERY STRONG boost/penalty for matching program level
            if is_undergraduate:
                # Check multiple indicators for undergraduate
                is_undergrad_chunk = (
                    'undergraduate' in content_lower or 
                    metadata.get('program_type') == 'Undergraduate' or
                    filename.startswith('bs_') or
                    'bachelor' in content_lower
                )
                is_graduate_chunk = (
                    'graduate' in content_lower or 
                    metadata.get('program_type') == 'Graduate' or
                    filename.startswith('ms_') or
                    'master' in content_lower
                )
                
                if is_undergrad_chunk and not matches_program:
                    adjusted_score = adjusted_score * 0.1  # Strong boost for undergraduate
                elif is_graduate_chunk:
                    adjusted_score = adjusted_score * 5.0  # Very strong penalty for graduate
                    
            elif is_graduate:
                is_graduate_chunk = (
                    'graduate' in content_lower or 
                    metadata.get('program_type') == 'Graduate' or
                    filename.startswith('ms_') or
                    'master' in content_lower
                )
                is_undergrad_chunk = (
                    'undergraduate' in content_lower or 
                    metadata.get('program_type') == 'Undergraduate' or
                    filename.startswith('bs_') or
                    'bachelor' in content_lower
                )
                
                if is_graduate_chunk and not matches_program:
                    adjusted_score = adjusted_score * 0.1  # Strong boost for graduate
                elif is_undergrad_chunk:
                    adjusted_score = adjusted_score * 5.0  # Very strong penalty for undergraduate
            
            # CRITICAL: Match specific semester using metadata (much more reliable!)
            matches_semester = False
            wrong_semester = False
            chunk_semester = metadata.get('semester')  # Get semester from metadata
            
            if target_semester:
                if chunk_semester:
                    # Use metadata if available (most reliable)
                    if chunk_semester.lower() == target_semester.lower():
                        matches_semester = True
                        # EXTREME boost for correct semester (especially if also correct program)
                        if matches_program:
                            adjusted_score = adjusted_score * 0.01  # EXTREME boost (100x better) for correct program + semester
                        else:
                            adjusted_score = adjusted_score * 0.1  # Strong boost for correct semester
                    else:
                        # Wrong semester in metadata
                        wrong_semester = True
                        if 'study plan' in content_lower:
                            # HEAVY penalty for wrong semester in Study Plan
                            adjusted_score = adjusted_score * 10.0  # Very heavy penalty (10x worse)
                elif semester_keywords:
                    # Fallback to content matching if metadata not available
                    if any(keyword in content_lower for keyword in semester_keywords):
                        matches_semester = True
                        if matches_program:
                            adjusted_score = adjusted_score * 0.01
                        else:
                            adjusted_score = adjusted_score * 0.1
                    else:
                        # Check if this is a wrong semester (has semester info but wrong one)
                        has_any_semester = any(term in content_lower for term in [
                            'semester i', 'semester ii', 'semester iii', 'semester iv', 'semester v',
                            'semester vi', 'semester vii', 'semester viii',
                            'first semester', 'second semester', 'third semester', 'fourth semester',
                            'fifth semester', 'sixth semester', 'seventh semester', 'eighth semester'
                        ])
                        if has_any_semester and 'study plan' in content_lower:
                            wrong_semester = True
                            adjusted_score = adjusted_score * 10.0
            
            # CRITICAL: Prioritize Study Plan sections
            is_study_plan = 'study plan' in content_lower
            if is_study_plan:
                if matches_semester:
                    # Already boosted above, don't double-boost
                    pass
                else:
                    adjusted_score = adjusted_score * 0.5  # Moderate boost for Study Plan
            else:
                # Penalize non-Study Plan sections (but less if it's correct program)
                if matches_program:
                    adjusted_score = adjusted_score * 1.2  # Light penalty
                else:
                    adjusted_score = adjusted_score * 1.5  # Penalty for other sections
            
            # EXTREME boost for perfect match (program + semester + study plan)
            if matches_program and matches_semester and is_study_plan:
                adjusted_score = score * 0.0001  # EXTREME boost (10000x better) - use original score
            
            scored_docs.append((doc, adjusted_score))
        
        # Sort by adjusted score (lower is better for distance)
        scored_docs.sort(key=lambda x: x[1])
        
        return scored_docs
    
    def _filter_wrong_results(self, docs_with_scores: List[Tuple], question: str) -> List[Tuple]:
        """Aggressively filter out wrong results"""
        question_lower = question.lower()
        
        # Extract program info
        is_undergraduate = (
            bool(re.search(r'\bbs\b', question_lower)) or 
            question_lower.startswith('bs') or
            any(term in question_lower for term in ['bachelor', 'undergraduate'])
        )
        is_graduate = (
            bool(re.search(r'\bms\b', question_lower)) or 
            question_lower.startswith('ms') or
            any(term in question_lower for term in ['master', 'graduate'])
        )
        
        program_code = self._extract_program_name(question)
        
        # Determine target semester
        target_semester = None
        semester_keywords = []
        if any(term in question_lower for term in ['first', '1st', 'semester 1', 'semester i']):
            target_semester = 'i'
            semester_keywords = ['semester i', 'first semester', '1st semester', 'semester 1']
        elif any(term in question_lower for term in ['second', '2nd', 'semester 2', 'semester ii']):
            target_semester = 'ii'
            semester_keywords = ['semester ii', 'second semester', '2nd semester', 'semester 2']
        elif any(term in question_lower for term in ['third', '3rd', 'semester 3', 'semester iii']):
            target_semester = 'iii'
            semester_keywords = ['semester iii', 'third semester', '3rd semester', 'semester 3']
        elif any(term in question_lower for term in ['fourth', '4th', 'semester 4', 'semester iv']):
            target_semester = 'iv'
            semester_keywords = ['semester iv', 'fourth semester', '4th semester', 'semester 4']
        
        filtered_docs = []
        filtered_count = 0
        for doc, score in docs_with_scores:
            content_lower = doc.page_content.lower()
            filename = doc.metadata.get('filename', '').lower()
            
            # Check if this is a program file
            is_program_file = filename.startswith('bs_') or filename.startswith('ms_')
            
            # Check if this is the correct program
            is_correct_program = True
            if program_code and is_program_file:
                # Check filename pattern: bs_se.txt should match "se" (case-insensitive)
                filename_match = (
                    f"_{program_code}." in filename or 
                    filename.startswith(f"bs_{program_code}") or 
                    filename.startswith(f"ms_{program_code}")
                )
                
                # Check metadata program_code field (e.g., "BS_SE" should match "se")
                metadata_program_code = doc.metadata.get('program_code', '').lower()
                metadata_match = (
                    metadata_program_code.endswith(f"_{program_code}") or 
                    metadata_program_code == program_code or
                    metadata_program_code == f"bs_{program_code}" or
                    metadata_program_code == f"ms_{program_code}"
                )
                
                # Check content for "Program Code: BS_SE" pattern (more specific, case-insensitive)
                content_program_code_match = (
                    f"program code: bs_{program_code}" in content_lower or 
                    f"program code: ms_{program_code}" in content_lower
                )
                
                is_correct_program = filename_match or metadata_match or content_program_code_match
            
            # Filter out wrong program level (only for program files)
            if is_program_file:
                if is_undergraduate:
                    if filename.startswith('ms_') or doc.metadata.get('program_type') == 'Graduate':
                        filtered_count += 1
                        continue  # Skip graduate programs
                elif is_graduate:
                    if filename.startswith('bs_') or doc.metadata.get('program_type') == 'Undergraduate':
                        filtered_count += 1
                        continue  # Skip undergraduate programs
                
                # Filter out wrong program name (only if it's a program file)
                if program_code and not is_correct_program:
                    # This is a program file but wrong program
                    filtered_count += 1
                    continue  # Skip wrong program
            
            # Filter out wrong semester ONLY if:
            # 1. It's a Study Plan section
            # 2. It's from the WRONG program (not just wrong semester)
            # This way, correct program chunks are kept even if wrong semester (prioritization will handle ranking)
            if target_semester and 'study plan' in content_lower and is_program_file and program_code:
                # Use metadata first (most reliable)
                chunk_semester = doc.metadata.get('semester')
                
                if chunk_semester:
                    # Only filter wrong semester if it's ALSO from wrong program
                    if chunk_semester.lower() != target_semester.lower() and not is_correct_program:
                        # Wrong program AND wrong semester - filter out
                        filtered_count += 1
                        continue
                else:
                    # Fallback to content matching if metadata not available
                    semester_in_content = None
                    if any(term in content_lower for term in ['semester i', 'first semester', '1st semester', 'semester 1']):
                        semester_in_content = 'i'
                    elif any(term in content_lower for term in ['semester ii', 'second semester', '2nd semester', 'semester 2']):
                        semester_in_content = 'ii'
                    elif any(term in content_lower for term in ['semester iii', 'third semester', '3rd semester', 'semester 3']):
                        semester_in_content = 'iii'
                    elif any(term in content_lower for term in ['semester iv', 'fourth semester', '4th semester', 'semester 4']):
                        semester_in_content = 'iv'
                    elif any(term in content_lower for term in ['semester v', 'fifth semester', '5th semester', 'semester 5']):
                        semester_in_content = 'v'
                    
                    # Only filter wrong semester if it's ALSO from wrong program
                    if semester_in_content and semester_in_content != target_semester and not is_correct_program:
                        # Wrong program AND wrong semester - filter out
                        filtered_count += 1
                        continue
            
            # Keep this document
            filtered_docs.append((doc, score))
        
        return filtered_docs
    
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
                result = self.ask(question)
                
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


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Simple Admission Information RAG System")
    parser.add_argument(
        "--rebuild",
        action="store_true",
        help="Rebuild the vector store from documents"
    )
    parser.add_argument(
        "--no-programs",
        action="store_true",
        help="Exclude program information (only use admission info)"
    )
    parser.add_argument(
        "--query",
        type=str,
        help="Ask a single question (non-interactive mode)"
    )
    parser.add_argument(
        "--use_llm",
        action="store_true",
        help="Use local Ollama LLM for generation"
    )
    parser.add_argument(
        "--llm_model_name",
        type=str,
        default="qwen2.5:3b",
        help="Ollama model name to use (default: qwen2.5:3b)"
    )
    parser.add_argument(
        "--llm_temperature",
        type=float,
        default=0.2,
        help="LLM temperature (default: 0.2)"
    )
    
    args = parser.parse_args()
    
    # Initialize RAG system
    rag = SimpleRAG(
        rebuild_vector_store=args.rebuild,
        include_programs=not args.no_programs,
        use_llm=args.use_llm,
        llm_model_name=args.llm_model_name,
        llm_temperature=args.llm_temperature
    )
    
    # Run query or interactive mode
    if args.query:
        result = rag.ask(args.query)
        print("\nAnswer:")
        print(result['answer'])
        if result.get('sources'):
            print("\nSources:")
            for source in result['sources']:
                print(f"  [{source['rank']}] {source['source_file']}")
    else:
        rag.interactive_mode()

