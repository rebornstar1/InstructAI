from flask import Flask, request, jsonify
import google.generativeai as genai
from typing import List, Dict, Tuple, Union
import json
import time
from youtube_transcript_api import YouTubeTranscriptApi
from googleapiclient.discovery import build

from middleware.trafficControl import CustomMiddleware
from YouTubeVideoControllers.get_youtube_video_links import get_youtube_links
from YouTubeVideoControllers.get_youtube_video_questions import generate_video_question, get_video_transcript, teach_with_video
import os
from dotenv import load_dotenv

app = Flask(__name__)

load_dotenv()
from User.user import User

app.wsgi_app = CustomMiddleware(app.wsgi_app)

# Add CORS
from flask_cors import CORS
CORS(app)

initial_prompt = ""       # will be filled on user signup
master_prompt = "You are an adaptive AI teacher. Tailor your responses to the student's current level."
master_prompt += initial_prompt

# Initialize the youtube API
youtube = build('youtube', 'v3', os.getenv("DEVELOPER_KEY"))
print(f"Youtube initialized: {youtube}")

# Initialize the generative model
model_name='gemini-pro'
genai.configure(api_key=os.getenv("API_KEY"))
model = genai.GenerativeModel(model_name)
print(f"Model initialized: {model}")

# Initialize the user
user = User(master_prompt, model, youtube)

@app.route('/', methods=['GET'])
def hello():
    return 'Hi from IceCreamAI!'

# Get youtube video links
@app.route('/api/v1/youtube', methods=['GET'])
def get_youtube_video_links():
    topic = 'machine learning'
    if 'topic' in request.args:
        topic = request.args['topic']
    print(topic)
    
    youtube_links = get_youtube_links(topic, youtube)
    return youtube_links

# Get video questions
@app.route('/api/v1/video/question', methods=['GET'])
def get_video_questions():
    video_id = 'Ks-_Mh1QhMc'
    if 'video_id' in request.args:
        video_id = request.args['video_id']
    print(video_id)

    transcript = get_video_transcript(video_id)
    video_questions = []
    if transcript:
        video_questions = teach_with_video(transcript, master_prompt, model)
    return video_questions

# Generate lessons
@app.route('/api/v1/generateLessons', methods=['GET'])
def get_lesson_list():
    topic = 'Machine Learning'
    # description = 'This is a description'
    # user_syllabus_tentative = 'This is a tentative syllabus'
    if 'topic' in request.args:
        topic = request.args['topic']
    # if 'description' in request.args:
    #     description = request.args['description']
    # if 'user_syllabus_tentative' in request.args:
    #     user_syllabus_tentative = request.args['user_syllabus_tentative']
    print(topic)

    lesson_plan = user.get_syllabus(topic)

    return lesson_plan

@app.route('/api/v1/genExplanation')
def get_lesson_explantion_and_questions():
    lesson_id=request.args['lesson_id']
    lesson_name=request.args['lesson_name']
    lesson_data=user.generate_lesson_explanation(lesson_id,lesson_name)
    return lesson_data

if __name__ == '__main__':
    app.run(debug=True)