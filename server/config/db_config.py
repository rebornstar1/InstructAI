import firebase_admin
from firebase_admin import credentials, db

def initialize_firebase():
    cred = credentials.Certificate("configuration.json")

    firebase_admin.initialize_app(cred, {
        "databaseURL": "https://instructai-9f026-default-rtdb.asia-southeast1.firebasedatabase.app/"
    })

    # Create references to your collections
    users_ref = db.reference('users')
    topics_ref = db.reference('topics')
    lessons_ref = db.reference('lessons')
    questions_ref = db.reference('questions')

    return users_ref, topics_ref, lessons_ref, questions_ref

class FirebaseReferences:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(FirebaseReferences, cls).__new__(cls)
            cls._instance.users, cls._instance.topics, cls._instance.lessons, cls._instance.questions = initialize_firebase()
        return cls._instance

firebase_refs = FirebaseReferences()