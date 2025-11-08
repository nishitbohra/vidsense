#!/usr/bin/env python3
"""
Embedding Generator and Vector Store Manager

This script generates embeddings for video transcripts and stores them in ChromaDB
for semantic search functionality.
"""

import sys
import json
import os
from typing import List, Dict, Any, Optional
import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer
import numpy as np
from dotenv import load_dotenv
import uuid
import hashlib

# Load environment variables
load_dotenv()

class EmbeddingGenerator:
    def __init__(self):
        self.model_name = "all-MiniLM-L6-v2"  # Lightweight but effective model
        self.chroma_persist_dir = os.getenv('CHROMA_PERSIST_DIR', './chromadb')
        
        try:
            print("Loading embedding model...", file=sys.stderr)
            self.embedding_model = SentenceTransformer(self.model_name)
            print(f"Model loaded: {self.model_name}", file=sys.stderr)
        except Exception as e:
            raise Exception(f"Failed to load embedding model: {str(e)}")
        
        try:
            print("Initializing ChromaDB...", file=sys.stderr)
            self.chroma_client = chromadb.PersistentClient(
                path=self.chroma_persist_dir,
                settings=Settings(
                    anonymized_telemetry=False,
                    allow_reset=True
                )
            )
            
            # Get or create collection for video embeddings
            self.collection = self.chroma_client.get_or_create_collection(
                name="video_embeddings",
                metadata={"description": "Video transcript embeddings for semantic search"}
            )
            print("ChromaDB initialized successfully", file=sys.stderr)
            
        except Exception as e:
            raise Exception(f"Failed to initialize ChromaDB: {str(e)}")
    
    def chunk_text(self, text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
        """
        Split text into overlapping chunks for better embedding quality.
        
        Args:
            text: Text to chunk
            chunk_size: Maximum words per chunk
            overlap: Number of overlapping words between chunks
            
        Returns:
            List of text chunks
        """
        words = text.split()
        if len(words) <= chunk_size:
            return [text]
        
        chunks = []
        start = 0
        
        while start < len(words):
            end = min(start + chunk_size, len(words))
            chunk = ' '.join(words[start:end])
            chunks.append(chunk)
            
            if end >= len(words):
                break
            
            start = end - overlap
        
        return chunks
    
    def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """
        Generate embeddings for a list of texts.
        
        Args:
            texts: List of text strings
            
        Returns:
            List of embedding vectors
        """
        try:
            embeddings = self.embedding_model.encode(texts, convert_to_tensor=False)
            return embeddings.tolist()
        except Exception as e:
            raise Exception(f"Failed to generate embeddings: {str(e)}")
    
    def create_document_id(self, video_id: str, chunk_index: int) -> str:
        """Create a unique document ID for ChromaDB."""
        return f"{video_id}_chunk_{chunk_index}"
    
    def store_video_embeddings(self, video_id: str, transcript_text: str, 
                             transcript_segments: List[Dict[str, Any]], 
                             title: str = '', summary: str = '') -> Dict[str, Any]:
        """
        Generate and store embeddings for a video's transcript, title, and summary.
        
        Args:
            video_id: YouTube video ID
            transcript_text: Full transcript text
            transcript_segments: List of transcript segments with timestamps
            title: Video title (optional but recommended)
            summary: Video summary (optional but recommended)
            
        Returns:
            Dictionary with storage results
        """
        try:
            # Check if video already exists in the collection
            existing_docs = self.collection.get(
                where={"video_id": video_id}
            )
            
            if existing_docs['ids']:
                print(f"Video {video_id} already exists in ChromaDB, updating...", file=sys.stderr)
                # Delete existing documents for this video
                self.collection.delete(where={"video_id": video_id})
            
            # Prepare data for ChromaDB
            document_ids = []
            documents = []
            all_texts_to_embed = []
            metadatas = []
            
            # Add title as a searchable document (high priority)
            if title and title.strip():
                doc_id = f"{video_id}_title"
                document_ids.append(doc_id)
                documents.append(title)
                all_texts_to_embed.append(title)
                metadatas.append({
                    'video_id': video_id,
                    'chunk_index': -1,
                    'estimated_timestamp': 0.0,
                    'word_count': len(title.split()),
                    'chunk_type': 'title'
                })
                print(f"Adding title for embedding: {title}", file=sys.stderr)
            
            # Add summary as a searchable document (high priority)
            if summary and summary.strip():
                doc_id = f"{video_id}_summary"
                document_ids.append(doc_id)
                documents.append(summary)
                all_texts_to_embed.append(summary)
                metadatas.append({
                    'video_id': video_id,
                    'chunk_index': -2,
                    'estimated_timestamp': 0.0,
                    'word_count': len(summary.split()),
                    'chunk_type': 'summary'
                })
                print(f"Adding summary for embedding", file=sys.stderr)
            
            # Create chunks from the full transcript
            chunks = self.chunk_text(transcript_text)
            
            if not chunks:
                return {
                    'success': False,
                    'error': 'No valid text chunks generated'
                }
            
            print(f"Generated {len(chunks)} chunks for video {video_id}", file=sys.stderr)
            
            # Add transcript chunks
            for i, chunk in enumerate(chunks):
                doc_id = self.create_document_id(video_id, i)
                
                # Calculate approximate timestamp for this chunk
                words_per_chunk = len(chunk.split())
                total_words = len(transcript_text.split())
                progress = (i * words_per_chunk) / total_words
                
                # Estimate timestamp based on progress through transcript
                total_duration = 0
                if transcript_segments:
                    last_segment = transcript_segments[-1]
                    total_duration = last_segment['start'] + last_segment['duration']
                
                estimated_timestamp = progress * total_duration
                
                document_ids.append(doc_id)
                documents.append(chunk)
                all_texts_to_embed.append(chunk)
                metadatas.append({
                    'video_id': video_id,
                    'chunk_index': i,
                    'estimated_timestamp': round(estimated_timestamp, 2),
                    'word_count': words_per_chunk,
                    'chunk_type': 'transcript'
                })
            
            # Generate embeddings for all documents (title, summary, and transcript chunks)
            print(f"Generating embeddings for {len(all_texts_to_embed)} documents...", file=sys.stderr)
            embeddings = self.generate_embeddings(all_texts_to_embed)
            
            # Store in ChromaDB
            print(f"Storing {len(document_ids)} documents in ChromaDB...", file=sys.stderr)
            self.collection.add(
                documents=documents,
                metadatas=metadatas,
                ids=document_ids,
                embeddings=embeddings
            )
            
            print("Embeddings stored successfully", file=sys.stderr)
            
            return {
                'success': True,
                'video_id': video_id,
                'chunks_stored': len(chunks),
                'title_included': bool(title),
                'summary_included': bool(summary),
                'total_documents': len(document_ids),
                'embedding_dimension': len(embeddings[0]) if embeddings else 0,
                'collection_size': self.collection.count()
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Failed to store embeddings: {str(e)}'
            }
    
    def search_similar_videos(self, query: str, limit: int = 10) -> Dict[str, Any]:
        """
        Search for videos similar to the given query.
        
        Args:
            query: Search query text
            limit: Maximum number of results to return
            
        Returns:
            Dictionary with search results
        """
        try:
            if not query.strip():
                return {
                    'success': False,
                    'error': 'Empty query provided'
                }
            
            print(f"Searching for: '{query}' (limit: {limit})", file=sys.stderr)
            
            # Generate embedding for the query
            query_embedding = self.embedding_model.encode([query], convert_to_tensor=False)[0].tolist()
            
            # Search in ChromaDB
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=min(limit * 3, 50),  # Get more results to deduplicate by video
                include=['documents', 'metadatas', 'distances']
            )
            
            if not results['ids'] or not results['ids'][0]:
                return {
                    'success': True,
                    'results': [],
                    'query': query,
                    'message': 'No similar videos found'
                }
            
            # Process results and group by video_id
            video_scores = {}
            for doc, metadata, distance in zip(
                results['documents'][0], 
                results['metadatas'][0], 
                results['distances'][0]
            ):
                video_id = metadata['video_id']
                similarity_score = 1 - distance  # Convert distance to similarity
                
                # Keep the best score for each video
                if video_id not in video_scores or similarity_score > video_scores[video_id]['similarity_score']:
                    video_scores[video_id] = {
                        'video_id': video_id,
                        'similarity_score': round(similarity_score, 4),
                        'best_match_text': doc[:200] + ('...' if len(doc) > 200 else ''),
                        'timestamp': metadata.get('estimated_timestamp', 0)
                    }
            
            # Sort by similarity score and limit results
            sorted_results = sorted(
                video_scores.values(), 
                key=lambda x: x['similarity_score'], 
                reverse=True
            )[:limit]
            
            return {
                'success': True,
                'results': sorted_results,
                'query': query,
                'total_found': len(sorted_results)
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Search failed: {str(e)}'
            }

def main():
    """Main function to handle command line execution."""
    if len(sys.argv) < 2:
        print(json.dumps({
            'success': False,
            'error': 'Usage: python embedding_generator.py <command> [args...]'
        }))
        sys.exit(1)
    
    command = sys.argv[1]
    
    try:
        embedder = EmbeddingGenerator()
        
        if command == "store" and len(sys.argv) == 3:
            # Store embeddings: data_file_path
            # Read data from temp file to avoid command line length limits
            data_file = sys.argv[2]
            with open(data_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            video_id = data['video_id']
            transcript_text = data['transcript_text']
            transcript_segments = data['transcript_segments']
            title = data.get('title', '')  # Optional
            summary = data.get('summary', '')  # Optional
            
            result = embedder.store_video_embeddings(
                video_id, 
                transcript_text, 
                transcript_segments,
                title=title,
                summary=summary
            )
            
        elif command == "search" and len(sys.argv) == 4:
            # Search: query, limit
            query = sys.argv[2]
            limit = int(sys.argv[3])
            
            result = embedder.search_similar_videos(query, limit)
            
        else:
            result = {
                'success': False,
                'error': 'Invalid command. Use "store" or "search".'
            }
        
        print(json.dumps(result, ensure_ascii=False, indent=2))
        
        # Exit with appropriate code
        sys.exit(0 if result['success'] else 1)
        
    except json.JSONDecodeError as e:
        print(json.dumps({
            'success': False,
            'error': f'Invalid JSON input: {str(e)}'
        }))
        sys.exit(1)
    except Exception as e:
        print(json.dumps({
            'success': False,
            'error': f'Unexpected error: {str(e)}'
        }))
        sys.exit(1)

if __name__ == "__main__":
    main()