import os
import tempfile
from gradio_client import Client, handle_file

class MLService:
    @staticmethod
    def run_yolo_detection(image_bytes: bytes) -> dict:
        """
        Runs YOLOv8 object detection on a Chest X-Ray via Hugging Face Space.
        """
        # 1. Gradio expects a file path, so we save the incoming bytes to a temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as temp_file:
            temp_file.write(image_bytes)
            temp_image_path = temp_file.name

        try:
            print("Connecting to YOLO Hugging Face Space...")
            client = Client("hemish-09/radiology-detect")
            
            # 2. Call the API (returns tuple: [annotated_image_path, findings_string])
            result = client.predict(
                image=handle_file(temp_image_path),
                api_name="/predict"
            )
            
            # 3. Extract the findings string
            findings_str = result[1] if len(result) > 1 else "No findings returned."
            print(f"YOLO Output: {findings_str}")
            
            # Parse the string: "1 abnormality(s) detected\n\nPneumothorax — 54.7% confidence (Low)"
            import re
            disease = "Unknown"
            confidence = 0.85
            
            lines = findings_str.strip().split('\n')
            for line in lines:
                if '—' in line:
                    parts = line.split('—')
                    if len(parts) > 1:
                        disease = parts[0].strip()
                        # Extract the number before the % sign using regex
                        conf_match = re.search(r'([\d\.]+)\s*%', parts[1])
                        if conf_match:
                            try:
                                confidence = float(conf_match.group(1)) / 100.0
                            except ValueError:
                                pass
                    break
            else:
                # If we didn't break out of the loop and find a disease
                if "Normal" in findings_str:
                    disease = "Normal"
                    confidence = 1.0
            
            # 4. Map it back to the dictionary structure our Orchestrator expects
            return {
                "disease": disease,
                "confidence": confidence,
                "bounding_boxes": [], 
                "severity": "Unknown",
                "annotated_image_path": result[0]
            }
        finally:
            # 5. Always clean up the temporary file so we don't leak memory
            if os.path.exists(temp_image_path):
                os.remove(temp_image_path)

    @staticmethod
    def generate_report(findings: dict) -> str:
        """
        Runs Gemma LLM generating a structured radiology report via Hugging Face Space.
        """
        print("Connecting to Gemma Hugging Face Space...")
        client = Client("hemish-09/medgemma-inference")
        
        # Pass "Chest" as anatomy instead of the disease string to prevent the model 
        # from hallucinating or timing out due to an unexpected prompt format.
        report = client.predict(
            modality="Chest X-Ray",
            anatomy="Chest",
            api_name="/generate_report"
        )
        
        # Append the YOLO findings so the doctor still sees what was detected!
        final_report = f"[AI Detection: {findings['disease']} - {(findings['confidence']*100):.1f}% Confidence]\n\n" + report
        return final_report
