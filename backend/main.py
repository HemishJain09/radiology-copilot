from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from workflow.orchestrator import RadiologyWorkflow
from services.firebase_service import FirebaseService
from services.firebase_service import db
import uvicorn

app = FastAPI(title="Radiology Copilot API")

# Allow the React frontend to communicate with the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allows Vercel to connect to Render
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "Radiology Copilot Backend Running (Firebase Connected)"}

@app.post("/api/upload")
async def upload_xray(file: UploadFile = File(...)):
    """
    Endpoint for uploading a chest X-Ray.
    Triggers the LangGraph orchestration pipeline and saves to Firebase.
    """
    contents = await file.read()
    
    # Run Orchestrator (now passes filename)
    result = RadiologyWorkflow.process_image(contents, file.filename)
    
    return {
        "status": "success",
        "filename": file.filename,
        "data": result
    }

@app.get("/api/reports/pending")
def get_pending_reports():
    """
    Fetches all reports from Firestore that need doctor review.
    """
    reports_ref = db.collection('reports').where("status", "==", "pending_review").get()
    
    reports = []
    for doc in reports_ref:
        data = doc.to_dict()
        data['id'] = doc.id
        
        # Firestore timestamps are not JSON serializable by default
        if 'created_at' in data and data['created_at']:
            data['created_at'] = data['created_at'].isoformat()
            
        reports.append(data)
        
    return {"status": "success", "reports": reports}

@app.post("/api/feedback")
async def submit_feedback(
    report_id: str = Form(...),
    action: str = Form(...),
    edited_text: str = Form(None)
):
    """
    Endpoint to receive doctor feedback and update Firestore for RLHF.
    """
    reward_map = {
        "Approved (+1)": 1.0,
        "Minor Edit (-0.5)": -0.5,
        "Major Correction (-1)": -1.0,
        "Wrong (-2)": -2.0
    }
    
    score = reward_map.get(action, 0)
    
    print(f"Updating Firestore for {report_id}. Action: {action}. Reward Score: {score}")
    
    # Update Firestore!
    FirebaseService.update_feedback(report_id, action, score, edited_text)
    
    return {
        "status": "success",
        "message": "Feedback recorded in Firestore for RLHF loop",
        "reward_score": score
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
