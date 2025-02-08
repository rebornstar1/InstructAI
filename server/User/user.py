from flask import jsonify, make_response
# from config.db_config import db, users_collection, topics_collection, lessons_collection, questions_collection
from config.db_config import firebase_refs

class User:
    def __init__(self, master_prompt: str, model, youtube):
        self.master_prompt = master_prompt
        self.model = model
        self.youtube = youtube
        # self.cred = cred

    def update_master_prompt(self, new_content: str):
        self.master_prompt += f"\n{new_content}"

    def get_syllabus(self, topic: str):
        try:
            print(topic)
            result = firebase_refs.topics.order_by_child('name').equal_to(topic).get()

            if result:
                return result

            prompt = f"""
            Based on the provided syllabus and description, generate a structured set of 8 lessons/sub divisions that need to be covered to understand and master the topic.
            Combine the user's tentative syllabus and give just 8 subdivisions of the syllabus.
            Syllabus: {topic}
            Format the response as follows for each lesson:
            1. Lesson name
            2. Next lesson name
            ...and so on for all 8 lessons.
            """

            response = self.model.generate_content(prompt)
            lessons = self.parse_ai_response_topic(response.candidates[0].content.parts[0].text)
            
            # Create a new topic entry
            new_topic_ref = firebase_refs.topics.push()
            topic_key = new_topic_ref.key
            
            lesson_keys_and_name = []
            for lesson_name in lessons:
                # Create a new lesson entry
                new_lesson_ref = firebase_refs.lessons.push()
                lesson_key = new_lesson_ref.key
                lesson_keys_and_name.append({"lesson_name": lesson_name, "lesson_key": lesson_key})
                
                # Update the lesson with its data
                new_lesson_ref.set({
                    'name': lesson_name,
                    'explanation': '',  # Empty explanation
                    'questions': []  # Empty questions list
                })
            
            new_topic_ref.set({
                'name': topic,
                'lesson_keys_and_name': lesson_keys_and_name
            })
            
            return jsonify(message="Syllabus generated and stored successfully", 
                           topic_key=topic_key, 
                           lessons=lesson_keys_and_name), 201
        except Exception as e:
            print(f"Error generating and storing syllabus: {e}")
            return jsonify(error=f"Failed to generate and store syllabus: {str(e)}"), 500

    def parse_ai_response_topic(self, response):
        lessons = []
        lines = response.strip().split('\n')
        for line in lines:
            # Remove any numbering and leading/trailing whitespace
            lesson_name = line.split('.', 1)[-1].strip()
            if lesson_name:
                lessons.append(lesson_name)
        
        # Ensure we have exactly 8 lessons
        lessons = lessons[:8]  # Truncate if more than 8
        while len(lessons) < 8:
            lessons.append(f"Lesson {len(lessons) + 1}")  # Add placeholder names if less than 8
        
        return lessons
    
    def generate_lesson_explanation(self, lesson_id, lesson_name):
        try:
            lesson_ref = firebase_refs.lessons.order_by_key().equal_to(lesson_id).get()

            if lesson_id in lesson_ref and len(lesson_ref[lesson_id]['explanation']) > 0:
                return lesson_ref[lesson_id]

            lesson_ref = firebase_refs.lessons.child(lesson_id)
            prompt = f"""
                Based on the provided lesson generate a detail explanation in 2 to 3 paragraphs that need to be covered to understand and master the topic.
                and then in order to test the user knowdege generate 4 questions for the same lesson with options and correct answer
                Syllabus: {lesson_name}
                Format the response as follows for each lesson:
                dont write lesson name in heading start from explanation
                Explanation:
                Questions:
                1. Question 1
                A) Option A
                B) Option B
                C) Option C
                D) Option D
                Correct Answer: [A/B/C/D]
                2. Question 2 (similar format)
                3. Question 3 (similar format)
                4. Question 4 (similar format)
                give four questions for each lesson in the above format
                start writing the questions from next line after the explanation
                and also dont write readme proivde only one paragraph for explanation
                then next line questions will start
            """
            response = self.model.generate_content(prompt)
            lesson_data = self.parse_ai_response_lesson_data(response.candidates[0].content.parts[0].text)

            question_keys = []
            questions = []
            for question in lesson_data['questions']:
                # Create a new question entry
                new_question_ref = firebase_refs.questions.push({
                    'question': question['question'],
                    'options': question['options'],
                    'correct_answer': question['correct_answer']
                })
                question_keys.append(new_question_ref.key)
                # Store the question data instead of the Firebase reference
                questions.append({
                    'key': new_question_ref.key,
                    'question': question['question'],
                    'options': question['options'],
                    'correct_answer': question['correct_answer']
                })
            
            # Update the lesson with its data and question keys
            lesson_ref.set({
                'explanation': lesson_data['explanation'],
                'question_keys': question_keys
            })

            return make_response(
                jsonify(
                    {
                        "status": "success",
                        "explanation": lesson_data['explanation'],
                        "questions": questions  # Now contains serializable data
                    }
                ),
                200,
            )

        except Exception as e:
            print(f"Error generating and storing lesson: {str(e)}")
            return make_response(
                jsonify(
                    {
                        "status": "error",
                        "message": "An error occurred while generating and storing the lesson."
                    }
                ),
                500,
            )
        
        
    def parse_ai_response_lesson_data(self, response):
        # Extract explanation
        lines = response.strip().split('\n')
        explanation = []
        question_start = 0
        for i, line in enumerate(lines):
            if line.startswith('**Explanation:**'):
                i+=2
                continue
            if line.startswith('**Questions:**'):
                question_start = i
                break
            explanation.append(line)

        explanation = ' '.join(explanation).strip()

        # Extract questions
        questions = []
        current_question = {'question': None, 'options': [], 'correct_answer': None}
        for line in lines[question_start:]:
            line = line.strip()
            if line.startswith(('1.', '2.', '3.', '4.')):
                if current_question['question']:
                    questions.append(current_question)
                current_question = {'question': line.split('.', 1)[1].strip(), 'options': []}
            elif line.startswith(('A)', 'B)', 'C)', 'D)')):
                option = line[2:].strip()
                current_question['options'].append(option)
            elif line.startswith('Correct Answer:'):
                current_question['correct_answer'] = line.split(':')[1].strip()

        if current_question['question']:
            questions.append(current_question)

        # Create the final result
        result = {
            'explanation': explanation,
            'questions': questions
        }
        return result