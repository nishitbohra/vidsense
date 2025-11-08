#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AI Summarizer using Groq API

This script takes a transcript text and generates both short and detailed summaries
using Groq's Llama models. It also extracts key topics from the content.
"""

import sys
import json
import os
import re
from typing import List, Dict, Any
from groq import Groq
from dotenv import load_dotenv

# Set UTF-8 encoding for stdout to handle Unicode characters
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    if sys.stderr:
        sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

# Load environment variables
load_dotenv()

class VideoSummarizer:
    def __init__(self):
        self.api_key = os.getenv('GROQ_API_KEY')
        if not self.api_key:
            raise ValueError("GROQ_API_KEY environment variable is required")
        
        self.client = Groq(api_key=self.api_key)
        self.model = "llama-3.1-8b-instant"  # Updated Groq Llama model
    
    def clean_text(self, text: str) -> str:
        """Clean and prepare text for processing."""
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text.strip())
        
        # Remove very short words that might be transcript artifacts
        words = text.split()
        cleaned_words = [word for word in words if len(word) > 1 or word.lower() in ['a', 'i']]
        
        return ' '.join(cleaned_words)
    
    def generate_short_summary(self, text: str) -> str:
        """Generate a concise summary (3-5 sentences)."""
        prompt = f"""Summarize the following video transcript in 3-5 clear sentences. Focus on the main points and key takeaways. Provide only the summary without any introductory phrases.

Transcript:
{text}"""
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a professional content summarizer. Provide clear, concise summaries without introductory phrases like 'Here is a summary' or 'The video discusses'. Start directly with the content."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=200,
                temperature=0.3
            )
            
            summary = response.choices[0].message.content.strip()
            
            # Remove common introductory phrases
            intro_phrases = [
                "Here is a concise summary of the video transcript in 3-5 sentences:",
                "Here's a concise summary of the video transcript in 3-5 sentences:",
                "Here is a concise summary in 3-5 sentences:",
                "Here's a concise summary in 3-5 sentences:",
                "Here is a concise summary:",
                "Here's a concise summary:",
                "The video transcript discusses:",
                "This video discusses:",
                "Summary:",
                "Here is the summary:",
                "Here's the summary:"
            ]
            
            for phrase in intro_phrases:
                if summary.lower().startswith(phrase.lower()):
                    summary = summary[len(phrase):].strip()
                    break  # Only remove one prefix
            
            return self.clean_text(summary)
            
        except Exception as e:
            raise Exception(f"Failed to generate short summary: {str(e)}")
    
    def generate_detailed_summary(self, text: str) -> str:
        """Generate a detailed summary (2-3 paragraphs)."""
        prompt = f"""Provide a detailed, comprehensive summary of this video transcript in 2-3 well-structured paragraphs. Include:
- Main topics and themes
- Key insights and important points
- Conclusions and takeaways

Write in clear, professional prose without using markdown formatting (no asterisks, no bold text, no headers). Use proper paragraph spacing only.

Transcript:
{text}"""
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a professional content analyst. Create detailed, well-written summaries in plain text format. Never use markdown formatting like ** or ##. Write in clear paragraphs with proper spacing."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=600,
                temperature=0.3
            )
            
            summary = response.choices[0].message.content.strip()
            
            # Remove markdown formatting
            # Remove bold markdown (**text** or __text__)
            summary = re.sub(r'\*\*(.+?)\*\*', r'\1', summary)
            summary = re.sub(r'__(.+?)__', r'\1', summary)
            
            # Remove italic markdown (*text* or _text_)
            summary = re.sub(r'\*(.+?)\*', r'\1', summary)
            summary = re.sub(r'_(.+?)_', r'\1', summary)
            
            # Remove headers (##, ###, etc.)
            summary = re.sub(r'^#{1,6}\s+', '', summary, flags=re.MULTILINE)
            
            # Clean up multiple spaces and normalize line breaks
            summary = re.sub(r'\n\s*\n\s*\n+', '\n\n', summary)  # Max 2 line breaks
            summary = re.sub(r' +', ' ', summary)  # Multiple spaces to single
            
            return self.clean_text(summary)
            
        except Exception as e:
            raise Exception(f"Failed to generate detailed summary: {str(e)}")
    
    def extract_topics(self, text: str) -> List[str]:
        """Extract key topics and themes from the text."""
        prompt = f"""Extract 10-15 key topics from this transcript. Output ONLY the topics as a simple comma-separated list with NO other text.

Transcript:
{text}"""
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You extract topics from text. Return ONLY a comma-separated list of topics with no introductory text, no explanations, no labels. Example format: artificial intelligence, machine learning, neural networks"
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=150,
                temperature=0.2
            )
            
            topics_text = response.choices[0].message.content.strip()
            
            # Remove common introductory phrases that the AI might add (more aggressive)
            intro_patterns = [
                r'^here\s+(are|is)\s+the\s+(main\s+)?topics?:?\s*',
                r'^topics?:?\s*',
                r'^key\s+topics?:?\s*',
                r'^main\s+topics?:?\s*',
                r'^the\s+(main\s+)?topics?\s+(are|is):?\s*',
                r'^keywords?:?\s*',
                r'^\*+\s*topics?\s*\*+:?\s*',
                r'^based\s+on.*?:?\s*',
                r'^from\s+the\s+transcript.*?:?\s*',
            ]
            
            for pattern in intro_patterns:
                topics_text = re.sub(pattern, '', topics_text, flags=re.IGNORECASE).strip()
            
            # Remove any leading/trailing punctuation or special characters
            topics_text = re.sub(r'^[:\-\*\s]+|[:\-\*\s]+$', '', topics_text).strip()
            
            # Split by comma, semicolon, newline, or numbered list patterns
            # First, replace numbered patterns with commas
            topics_text = re.sub(r'\d+[\.\)]\s+', ', ', topics_text)
            
            # Split by comma, semicolon, or newline
            topics = re.split(r'[,;\n]+', topics_text)
            
            # Clean and filter topics
            cleaned_topics = []
            for topic in topics:
                # Remove leading bullets, dashes, and other formatting
                topic = re.sub(r'^[-•*\s]+', '', topic)
                topic = re.sub(r'^["\'\[\]]+|["\'\[\]]+$', '', topic)  # Remove quotes and brackets
                
                # Remove common filler words and phrases
                topic = re.sub(r'^(the|a|an|and|or|but|in|on|at|to|for|of|with)\s+', '', topic, flags=re.IGNORECASE)
                
                # Remove special characters but keep spaces, hyphens, and alphanumerics
                topic = re.sub(r'[^\w\s-]', '', topic)
                topic = re.sub(r'\s+', ' ', topic).strip()  # Normalize whitespace
                
                # Filter out noise patterns
                noise_patterns = [
                    r'^here\s',
                    r'^topics?$',
                    r'^keywords?$', 
                    r'^themes?$',
                    r'^main$',
                    r'^list$',
                    r'^\d+\s*$',  # Just numbers
                    r'^prompt\s+engineering',  # Specific to the error seen
                    r'^comma[\s-]separated',
                    r'^separated\s+list',
                    r'extracted\s+from',
                    r'transcript',
                    r'^as\s+',
                ]
                
                is_noise = any(re.search(pattern, topic.lower()) for pattern in noise_patterns)
                
                # Additional validation
                words = topic.split()
                has_too_many_words = len(words) > 5  # Topics shouldn't be sentences
                is_too_long = len(topic) > 50
                is_too_short = len(topic) <= 2
                
                # Check if it's already in list (case-insensitive)
                is_duplicate = any(topic.lower() == existing.lower() for existing in cleaned_topics)
                
                if (not is_too_short and 
                    not is_too_long and
                    not has_too_many_words and
                    not is_noise and 
                    not is_duplicate):
                    cleaned_topics.append(topic.lower())
            
            # Return up to 15 topics
            return cleaned_topics[:15]
            
        except Exception as e:
            # If topic extraction fails, return empty list but don't fail the whole process
            print(f"Warning: Topic extraction failed: {str(e)}", file=sys.stderr)
            return []
    
    def summarize(self, transcript_text: str) -> Dict[str, Any]:
        """
        Generate comprehensive summary including short, detailed, and topics.
        
        Args:
            transcript_text: Full transcript text
            
        Returns:
            Dictionary containing all summary components
        """
        try:
            # Clean the input text
            cleaned_text = self.clean_text(transcript_text)
            
            # Check if text is too short
            if len(cleaned_text.split()) < 10:
                return {
                    'success': False,
                    'error': 'Transcript too short for meaningful summarization'
                }
            
            # Check if text is too long and truncate if necessary
            # Groq free tier limit: 6000 tokens per minute
            # Reduce limit for non-English text which uses more tokens per word
            max_words = 1500  # Conservative limit to stay under 6000 tokens for all languages
            words = cleaned_text.split()
            if len(words) > max_words:
                cleaned_text = ' '.join(words[:max_words])
                print(f"Warning: Transcript truncated to {max_words} words to fit token limits", file=sys.stderr)
            
            # Generate summaries and topics
            print("Generating short summary...", file=sys.stderr)
            summary_short = self.generate_short_summary(cleaned_text)
            
            print("Generating detailed summary...", file=sys.stderr)
            summary_detailed = self.generate_detailed_summary(cleaned_text)
            
            print("Extracting topics...", file=sys.stderr)
            topics = self.extract_topics(cleaned_text)
            
            return {
                'success': True,
                'summary_short': summary_short,
                'summary_detailed': summary_detailed,
                'topics': topics,
                'word_count': len(words),
                'processed_words': len(cleaned_text.split())
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Summarization failed: {str(e)}'
            }

def main():
    """Main function to handle command line execution."""
    if len(sys.argv) != 2:
        print(json.dumps({
            'success': False,
            'error': 'Usage: python summarizer.py <data_file_path>'
        }))
        sys.exit(1)
    
    # Read transcript from temp file to avoid command line length limits
    data_file = sys.argv[1]
    
    try:
        with open(data_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        transcript_text = data.get('transcript_text', '')
        
        summarizer = VideoSummarizer()
        result = summarizer.summarize(transcript_text)
        
        print(json.dumps(result, ensure_ascii=False, indent=2))
        
        # Exit with appropriate code
        sys.exit(0 if result['success'] else 1)
        
    except json.JSONDecodeError as e:
        print(json.dumps({
            'success': False,
            'error': f'Invalid JSON in data file: {str(e)}'
        }))
        sys.exit(1)
    except FileNotFoundError:
        print(json.dumps({
            'success': False,
            'error': f'Data file not found: {data_file}'
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