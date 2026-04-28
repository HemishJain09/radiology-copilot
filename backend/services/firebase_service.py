import firebase_admin
from firebase_admin import credentials, firestore, storage
import uuid
import mimetypes

# Initialize Firebase App
cred = credentials.Certificate("./firebase_credentials.json")
firebase_admin.initialize_app(cred, {
    'storageBucket': 'radiology-copilot-326cb.firebasestorage.app'
})

db = firestore.client()
bucket = storage.bucket()

class FirebaseService:
    @staticmethod
    def upload_image(image_bytes: bytes, filename: str) -> str:
        """
        Uploads the X-Ray image to Firebase Storage and returns the public URL.
        """
        # Generate a unique ID for the image to prevent overwriting
        unique_id = str(uuid.uuid4())
        extension = filename.split('.')[-1] if '.' in filename else 'jpg'
        blob_path = f"xrays/{unique_id}.{extension}"
        
        blob = bucket.blob(blob_path)
        
        # Guess content type
        content_type, _ = mimetypes.guess_type(filename)
        blob.upload_from_string(image_bytes, content_type=content_type or 'image/jpeg')
        
        # Make the URL publicly accessible (read-only)
        blob.make_public()
        
        return blob.public_url

    @staticmethod
    def save_report(report_data: dict) -> str:
        """
        Saves the generated ML findings and report to Firestore Database.
        Returns the document ID.
        """
        report_id = str(uuid.uuid4())
        doc_ref = db.collection('reports').document(report_id)
        
        # Add initial status and timestamp
        report_data['status'] = 'pending_review'
        report_data['created_at'] = firestore.SERVER_TIMESTAMP
        
        doc_ref.set(report_data)
        
        return report_id

    @staticmethod
    def update_feedback(report_id: str, action: str, reward_score: float, edited_text: str = None):
        """
        Updates an existing report in Firestore with the Doctor's RLHF feedback.
        """
        doc_ref = db.collection('reports').document(report_id)
        
        update_data = {
            'status': 'reviewed',
            'feedback_action': action,
            'rlhf_reward_score': reward_score,
            'reviewed_at': firestore.SERVER_TIMESTAMP
        }
        
        if edited_text is not None:
            update_data['report_text'] = edited_text
            
        doc_ref.update(update_data)
