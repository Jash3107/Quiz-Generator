from phi.agent import Agent, RunResponse
from phi.model.google import Gemini
import json
import sys
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

agent = Agent(
    model=Gemini(id="gemini-1.5-flash", api_key=os.getenv('GEMINI_API_KEY')),
    instructions="""
You are an AI quiz generation engine.

Generate a rich quiz in valid JSON format. 
Include questions of different types: mcq, true_false, numeric, fill_blank, matching, ordering.
atleast 10 questions
Return this structure (only JSON, no extra text):

{
  "topic": "<topic>",
  "subtopics": ["<subtopic1>", "<subtopic2>"],
  "generated_at": "<ISO timestamp>",
  "question_count": <number>,
  "questions": [
    {
      "type": "mcq",
      "question": "What is the capital of France?",
      "options": ["Paris", "London", "Rome", "Berlin"],
      "answer": "Paris",
      "difficulty": "easy",
      "tags": ["geography", "memory"],
      "points": 1,
      "explanation": "Paris is the capital city of France."
    },
    {
      "type": "true_false",
      "question": "The Sun revolves around the Earth.",
      "answer": false,
      "difficulty": "easy",
      "tags": ["astronomy", "conceptual"],
      "points": 1,
      "explanation": "Actually, the Earth revolves around the Sun."
    },
    {
      "type": "numeric",
      "question": "How many bones are there in the adult human body?",
      "answer": 206,
      "difficulty": "medium",
      "tags": ["biology", "memory"],
      "points": 2,
      "explanation": "The adult human body has 206 bones."
    },
    {
      "type": "fill_blank",
      "question": "The process by which plants make food using sunlight is called _____.",
      "answer": "photosynthesis",
      "difficulty": "easy",
      "tags": ["biology", "fill"],
      "points": 1,
      "explanation": "Photosynthesis is the process of converting light into energy."
    },
    {
      "type": "matching",
      "question": "Match the scientist to their discovery.",
      "pairs": {
        "Newton": "Gravity",
        "Einstein": "Relativity",
        "Curie": "Radioactivity"
      },
      "difficulty": "hard",
      "tags": ["science", "application"],
      "points": 3,
      "explanation": "Each scientist is famous for the listed discovery."
    },
    {
      "type": "ordering",
      "question": "Arrange the planets from closest to farthest from the Sun.",
      "items": ["Mercury", "Venus", "Earth", "Mars"],
      "correct_order": ["Mercury", "Venus", "Earth", "Mars"],
      "difficulty": "medium",
      "tags": ["astronomy", "ordering"],
      "points": 2,
      "explanation": "This is the order of planets based on their distance from the Sun."
    }
  ]
}
"""
)

topic = sys.stdin.read().strip()

# Run the agent with the topic
run: RunResponse = agent.run(f"Generate a detailed quiz on: {topic}")

# Print raw output (stdout)
print(run.content)