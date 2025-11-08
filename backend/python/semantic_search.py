#!/usr/bin/env python3
"""
Semantic Search using ChromaDB

This script performs semantic search across stored video embeddings.
"""

import sys
import json
import os

# Suppress TensorFlow warnings before importing anything else
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'

import warnings
warnings.filterwarnings('ignore')

from typing import List, Dict, Any
import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class SemanticSearcher:
    def __init__(self):
        self.model_name = "all-MiniLM-L6-v2"
        self.chroma_persist_dir = os.getenv('CHROMA_PERSIST_DIR', './chromadb')
        
        try:
            print("Loading embedding model for search...", file=sys.stderr)
            self.embedding_model = SentenceTransformer(self.model_name)
        except Exception as e:
            raise Exception(f"Failed to load embedding model: {str(e)}")
        
        try:
            print("Connecting to ChromaDB...", file=sys.stderr)
            self.chroma_client = chromadb.PersistentClient(
                path=self.chroma_persist_dir,
                settings=Settings(
                    anonymized_telemetry=False
                )
            )
            
            # Get the existing collection
            try:
                self.collection = self.chroma_client.get_collection("video_embeddings")
                collection_count = self.collection.count()
                print(f"Connected to ChromaDB collection with {collection_count} documents", file=sys.stderr)
            except Exception:
                print("Warning: video_embeddings collection not found", file=sys.stderr)
                self.collection = None
                
        except Exception as e:
            raise Exception(f"Failed to connect to ChromaDB: {str(e)}")
    
    def search(self, query: str, limit: int = 10) -> Dict[str, Any]:
        """
        Perform semantic search for similar videos.
        
        Args:
            query: Search query text
            limit: Maximum number of results to return
            
        Returns:
            Dictionary with search results
        """
        try:
            if not self.collection:
                return {
                    'success': False,
                    'error': 'ChromaDB collection not available. No videos have been analyzed yet.'
                }
            
            if not query.strip():
                return {
                    'success': False,
                    'error': 'Empty search query provided'
                }
            
            print(f"Searching for: '{query}' (limit: {limit})", file=sys.stderr)
            
            # Generate embedding for the search query
            query_embedding = self.embedding_model.encode([query], convert_to_tensor=False)[0].tolist()
            
            # Search in ChromaDB with higher result count to allow for deduplication
            search_limit = min(limit * 5, 100)  # Get more results to deduplicate by video
            
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=search_limit,
                include=['documents', 'metadatas', 'distances']
            )
            
            if not results['ids'] or not results['ids'][0]:
                return {
                    'success': True,
                    'results': [],
                    'query': query,
                    'message': 'No similar content found. Try different keywords or analyze more videos.'
                }
            
            print(f"Found {len(results['ids'][0])} raw results", file=sys.stderr)
            
            # Debug: print first few results
            if results['distances'][0]:
                print(f"Sample distances: {results['distances'][0][:3]}", file=sys.stderr)
                print(f"Sample metadatas: {[m.get('chunk_type', 'unknown') for m in results['metadatas'][0][:3]]}", file=sys.stderr)
            
            # Process and deduplicate results by video_id
            video_results = {}
            
            for doc, metadata, distance in zip(
                results['documents'][0], 
                results['metadatas'][0], 
                results['distances'][0]
            ):
                video_id = metadata['video_id']
                chunk_type = metadata.get('chunk_type', 'transcript')
                
                # ChromaDB returns squared L2 distance by default
                # For normalized embeddings (which sentence-transformers produces),
                # squared L2 distance is equivalent to 2 * (1 - cosine_similarity)
                # So: cosine_similarity = 1 - (distance / 2)
                # This gives us a proper 0-1 similarity score
                
                # Calculate base similarity
                similarity_score = max(0, 1 - (distance / 2.0))
                
                # Apply boost for title and summary matches
                boost = 1.0
                if chunk_type == 'title':
                    boost = 1.3  # 30% boost for title matches
                elif chunk_type == 'summary':
                    boost = 1.15  # 15% boost for summary matches
                
                similarity_score = min(1.0, similarity_score * boost)
                
                # Debug logging for first result
                if len(video_results) == 0:
                    print(f"First match - Type: {chunk_type}, Distance: {distance:.4f}, Similarity: {similarity_score:.4f}, Boost: {boost}", file=sys.stderr)
                
                # Only keep the best match for each video
                if video_id not in video_results or similarity_score > video_results[video_id]['similarity_score']:
                    video_results[video_id] = {
                        'video_id': video_id,
                        'similarity_score': round(similarity_score, 4),
                        'match_type': chunk_type,
                        'best_match_text': doc[:200] + ('...' if len(doc) > 200 else ''),
                        'chunk_index': metadata.get('chunk_index', 0),
                        'estimated_timestamp': metadata.get('estimated_timestamp', 0),
                        'word_count': metadata.get('word_count', 0)
                    }
            
            # Sort by similarity score (descending) and limit results
            sorted_results = sorted(
                video_results.values(),
                key=lambda x: x['similarity_score'],
                reverse=True
            )[:limit]
            
            # Filter out results with very low similarity scores
            # Lower threshold since we're now using proper cosine similarity
            filtered_results = [
                result for result in sorted_results 
                if result['similarity_score'] > 0.2  # Minimum similarity threshold
            ]
            
            print(f"Returning {len(filtered_results)} unique video results", file=sys.stderr)
            
            return {
                'success': True,
                'results': filtered_results,
                'query': query,
                'total_found': len(filtered_results),
                'collection_size': self.collection.count()
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Semantic search failed: {str(e)}'
            }
    
    def get_collection_stats(self) -> Dict[str, Any]:
        """Get statistics about the ChromaDB collection."""
        try:
            if not self.collection:
                return {
                    'success': False,
                    'error': 'Collection not available'
                }
            
            count = self.collection.count()
            
            # Get some sample documents to understand the collection
            sample_results = self.collection.get(
                limit=50,
                include=['metadatas']
            )
            
            unique_videos = set()
            chunk_types = {'title': 0, 'summary': 0, 'transcript': 0, 'other': 0}
            
            for metadata in sample_results['metadatas']:
                unique_videos.add(metadata['video_id'])
                chunk_type = metadata.get('chunk_type', 'other')
                chunk_types[chunk_type] = chunk_types.get(chunk_type, 0) + 1
            
            return {
                'success': True,
                'total_documents': count,
                'sample_videos': len(unique_videos),
                'chunk_type_distribution': chunk_types,
                'collection_name': 'video_embeddings',
                'note': 'If title/summary counts are 0, videos need to be re-analyzed'
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Failed to get collection stats: {str(e)}'
            }

def main():
    """Main function to handle command line execution."""
    if len(sys.argv) != 3:
        print(json.dumps({
            'success': False,
            'error': 'Usage: python semantic_search.py "<query>" <limit>'
        }))
        sys.exit(1)
    
    query = sys.argv[1]
    
    try:
        limit = int(sys.argv[2])
        if limit < 1 or limit > 50:
            raise ValueError("Limit must be between 1 and 50")
    except ValueError as e:
        print(json.dumps({
            'success': False,
            'error': f'Invalid limit parameter: {str(e)}'
        }))
        sys.exit(1)
    
    try:
        searcher = SemanticSearcher()
        result = searcher.search(query, limit)
        
        print(json.dumps(result, ensure_ascii=False, indent=2))
        
        # Exit with appropriate code
        sys.exit(0 if result['success'] else 1)
        
    except Exception as e:
        print(json.dumps({
            'success': False,
            'error': f'Unexpected error: {str(e)}'
        }))
        sys.exit(1)

if __name__ == "__main__":
    main()