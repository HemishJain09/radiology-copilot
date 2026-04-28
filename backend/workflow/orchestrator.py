from typing import Dict, Any
from services.ml_service import MLService
from services.firebase_service import FirebaseService

import os

class RadiologyWorkflow:
    @staticmethod
    def process_image(image_bytes: bytes, filename: str) -> Dict[str, Any]:
        print("1. Running YOLO Detection...")
        detection_result = MLService.run_yolo_detection(image_bytes)
        
        print("2. Uploading Annotated Image to Firebase Storage...")
        annotated_path = detection_result.get("annotated_image_path")
        
        if annotated_path and os.path.exists(annotated_path):
            with open(annotated_path, "rb") as f:
                upload_bytes = f.read()
            image_url = FirebaseService.upload_image(upload_bytes, "annotated_" + filename)
        else:
            image_url = FirebaseService.upload_image(image_bytes, filename)
        
        print("3. Generating Report with Gemma...")
        report = MLService.generate_report(detection_result)
        
        print("4. Decision Engine Routing...")
        disease = detection_result.get("disease", "Unknown")
        confidence = detection_result.get("confidence", 0.0)
        
        if disease == "Normal":
            route = "fast-track"
        elif confidence < 0.75:
            route = "senior"
        else:
            route = "junior"
        
        # Prepare the full data package
        full_data = {
            "image_url": image_url,
            "filename": filename,
            "findings": detection_result,
            "report_text": report,
            "routing": route
        }
        
        print("5. Saving Report to Firestore...")
        report_id = FirebaseService.save_report(full_data)
        
        return {
            "report_id": report_id,
            "image_url": image_url,
            "findings": detection_result,
            "report": report,
            "routing": route
        }
