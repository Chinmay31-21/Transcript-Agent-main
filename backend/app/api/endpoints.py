import os
import shutil
import base64
import asyncio
import time
from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Query
from fastapi.responses import FileResponse, JSONResponse, Response

from backend.app.core.config import settings
from backend.app.models.schemas import (
    LearningSession, CreateSessionRequest, UpdateSessionRequest,
    TranscriptSegment, FrameCapture, Concept, ChatMessage,
    ChatRequest, CommandRequest, PPTGenerateRequest, PDFGenerateRequest,
    PinItemRequest, SystemStatusResponse, TaskState, TeacherMode, CustomQuizRequest,
    UserProfile, UserRegisterRequest, UserLoginRequest, AuthResponse,
    UpdateProfileRequest, CreditStatusResponse, ConsumeCreditRequest,
    NicheTopicItem, NicheFeedResponse, StudentProgressSummary,
    AdminApproveRequest, AdminTopupRequest, AdminUserActionResponse, AdminStatsResponse
)
from backend.app.db.database import DatabaseManager, get_session_dir, resolve_frame_path
from backend.app.services.screenshot_service import screenshot_service
from backend.app.services.knowledge_service import knowledge_service
from backend.app.services.rag_service import rag_service
from backend.app.services.teacher_service import teacher_service
from backend.app.services.task_agent_service import task_agent_service
from backend.app.services.ppt_service import ppt_service
from backend.app.services.pdf_service import pdf_service
from backend.app.services.quiz_service import quiz_service
from backend.app.services.demo_service import demo_service
from backend.app.services.video_import_service import video_import_service
from backend.app.services.hyper_ingest_service import hyper_ingest_service
from backend.app.providers.llm_provider import llm_provider
from backend.app.providers.transcription_provider import transcription_provider
from backend.app.providers.ocr_provider import ocr_provider

router = APIRouter()

# ----------------- SYSTEM STATUS & DEMO -----------------
@router.get("/system/status", response_model=SystemStatusResponse)
async def get_system_status():
    ollama_ok = await llm_provider.is_available()
    models = await llm_provider.get_models() if ollama_ok else []
    whisper_ok = await transcription_provider.is_available()
    ocr_ok = await ocr_provider.is_available()

    return SystemStatusResponse(
        ollama_connected=ollama_ok,
        ollama_models=models,
        whisper_available=whisper_ok,
        ocr_available=ocr_ok,
        active_session_id=None,
        current_task_state=TaskState.IDLE,
        system_load={"cpu": "Normal", "memory": "Available"}
    )

@router.post("/demo/seed")
async def seed_demo():
    session_id = demo_service.seed_demo_session()
    return {"status": "SUCCESS", "session_id": session_id, "message": "High-yield educational demo session loaded!"}

# ----------------- USER AUTH & PROFILE ENDPOINTS -----------------
@router.post("/auth/register", response_model=AuthResponse)
async def register_user(req: UserRegisterRequest):
    existing = DatabaseManager.get_user_by_email(req.email)
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")
    
    new_user = UserProfile(
        email=req.email.strip().lower(),
        name=req.name.strip(),
        phone=req.phone or "",
        education_level=req.education_level or "Undergraduate",
        standard_class=req.standard_class or "3rd Year",
        institution=req.institution or "Indian Institute of Technology",
        degree_major=req.degree_major or "Computer Science & Engineering",
        focus_topics=req.focus_topics or ["Data Structures & Algorithms", "System Design"],
        credits_balance=10,
        total_credits_used=0,
        subscription_tier="FREE_TRIAL"
    )
    saved = DatabaseManager.create_user(new_user, password_hash=req.password)
    token = f"token_{saved.id}_{int(time.time())}"
    return AuthResponse(
        success=True,
        token=token,
        user=saved,
        message="Account created successfully with 10 Free Study Passes!"
    )

@router.post("/auth/login", response_model=AuthResponse)
async def login_user(req: UserLoginRequest):
    user = DatabaseManager.get_user_by_email(req.email)
    if not user:
        if req.email.strip().lower() in ("demo_student@learnlens.ai", "demo@learnlens.ai", "student@learnlens.ai"):
            user = DatabaseManager.get_or_create_default_user()
        else:
            raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = f"token_{user.id}_{int(time.time())}"
    return AuthResponse(
        success=True,
        token=token,
        user=user,
        message="Welcome back to your Study Studio!"
    )

@router.get("/auth/me", response_model=UserProfile)
async def get_current_user_profile(user_id: Optional[str] = Query(None)):
    if user_id:
        user = DatabaseManager.get_user_by_id(user_id)
        if user:
            return user
    return DatabaseManager.get_or_create_default_user()

@router.put("/user/profile", response_model=UserProfile)
async def update_profile(req: UpdateProfileRequest, user_id: Optional[str] = Query(None)):
    uid = user_id or "usr_demo_student_01"
    updates = req.model_dump(exclude_unset=True, exclude_none=True)
    updated = DatabaseManager.update_user_profile(uid, updates)
    if not updated:
        raise HTTPException(status_code=404, detail="User not found")
    return updated

@router.get("/user/credits", response_model=CreditStatusResponse)
async def get_credits(user_id: Optional[str] = Query(None)):
    uid = user_id or "usr_demo_student_01"
    info = DatabaseManager.get_user_credits(uid)
    return CreditStatusResponse(**info)

@router.post("/user/consume-credit")
async def consume_credit(req: ConsumeCreditRequest, user_id: Optional[str] = Query(None)):
    uid = user_id or "usr_demo_student_01"
    res = DatabaseManager.consume_user_credit(uid, req.session_id, req.action)
    if not res.get("success"):
        return JSONResponse(status_code=402, content=res)
    return res

# ----------------- OVERALL LEARNING PROGRESS ENDPOINT -----------------
@router.get("/user/progress", response_model=StudentProgressSummary)
async def get_student_progress(user_id: Optional[str] = Query(None)):
    summary = DatabaseManager.get_student_overall_progress(user_id)
    return StudentProgressSummary(**summary)

# ----------------- ADMIN USER & SUBSCRIPTION MANAGEMENT -----------------
@router.get("/admin/stats", response_model=AdminStatsResponse)
async def get_admin_dashboard_stats():
    stats = DatabaseManager.get_admin_stats()
    return AdminStatsResponse(**stats)

@router.get("/admin/users", response_model=List[UserProfile])
async def get_all_users_for_admin():
    return DatabaseManager.list_all_users()

@router.post("/admin/users/approve", response_model=AdminUserActionResponse)
async def admin_approve_user(req: AdminApproveRequest):
    res = DatabaseManager.admin_approve_subscription(
        user_id=req.user_id,
        tier=req.tier,
        send_email=req.send_email,
        temp_pass=req.temp_password
    )
    if not res.get("success"):
        raise HTTPException(status_code=400, detail="Could not approve subscription")
    return AdminUserActionResponse(**res)

@router.post("/admin/users/topup", response_model=AdminUserActionResponse)
async def admin_topup_user(req: AdminTopupRequest):
    res = DatabaseManager.admin_topup_credits(
        user_id=req.user_id,
        credits_to_add=req.credits_to_add,
        reason=req.reason
    )
    user = DatabaseManager.get_user_by_id(req.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return AdminUserActionResponse(
        success=res.get("success", True),
        user=user,
        message=res.get("message", "Credits topped up successfully"),
        email_dispatched=False
    )

# ----------------- DISTRACTION-FREE NICHE CURATED FEED -----------------
@router.get("/curated/niche-feed", response_model=NicheFeedResponse)
async def get_niche_feed(user_id: Optional[str] = Query(None)):
    user = DatabaseManager.get_user_by_id(user_id) if user_id else DatabaseManager.get_or_create_default_user()
    stream = user.branch or user.degree_major or "Computer Science & Engineering"
    level = user.education_level or "Undergraduate"
    standard = user.current_year or user.standard_class or "3rd Year"
    aim = user.ultimate_aim or "Crack Google SDE-1 / Top Product Companies"
    interests = user.area_of_interest if user.area_of_interest else user.focus_topics

    # Smart personalized recommendations matching student branch, year, interest & aim
    curated: List[NicheTopicItem] = [
        NicheTopicItem(
            id="cur_dsa_01",
            title="Fastest Way to Learn DSA in 2026 (Without Wasting Time)",
            topic="Data Structures & Algorithms",
            channel_name="take U forward (Striver)",
            target_stream="Computer Science & Engineering",
            source_url="https://www.youtube.com/watch?v=kQW4t_WdZ5U",
            video_id="kQW4t_WdZ5U",
            duration_minutes=24,
            difficulty="Beginner",
            thumbnail_url="https://images.unsplash.com/photo-1516116211227-bbc13c73335c?w=400&auto=format&fit=crop&q=80",
            description="Proven roadmap covering arrays, trees, dynamic programming patterns, and high-frequency FAANG interview patterns.",
            why_recommended=f"Aligned with your aim: {aim} and {standard} curriculum."
        ),
        NicheTopicItem(
            id="cur_sys_02",
            title="System Design Fundamentals: Load Balancing & Caching",
            topic="System Design",
            channel_name="NeetCode / Gaurav Sen",
            target_stream="Computer Science & Engineering",
            source_url="https://www.youtube.com/watch?v=F2OxP4_8b7A",
            video_id="F2OxP4_8b7A",
            duration_minutes=38,
            difficulty="Intermediate",
            thumbnail_url="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&auto=format&fit=crop&q=80",
            description="High-level architecture, horizontal scaling, consistent hashing, and Redis caching layers.",
            why_recommended="Essential for product company architecture interviews."
        ),
        NicheTopicItem(
            id="cur_os_03",
            title="Operating Systems: Process Synchronization & Semaphores",
            topic="Operating Systems",
            channel_name="Gate Smashers",
            target_stream="Computer Science & Engineering",
            source_url="https://www.youtube.com/watch?v=ph2A4pS9w34",
            video_id="ph2A4pS9w34",
            duration_minutes=31,
            difficulty="Intermediate",
            thumbnail_url="https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=400&auto=format&fit=crop&q=80",
            description="Critical section problem, Peterson's algorithm, mutex locks, and deadlock avoidance.",
            why_recommended=f"Core subject for {standard} semester exams & GATE."
        ),
        NicheTopicItem(
            id="cur_cn_04",
            title="Computer Networks: TCP 3-Way Handshake & Congestion Control",
            topic="Computer Networks",
            channel_name="Hussein Nasser",
            target_stream="Computer Science & Engineering",
            source_url="https://www.youtube.com/watch?v=3g6_m8D7k_8",
            video_id="3g6_m8D7k_8",
            duration_minutes=29,
            difficulty="Advanced",
            thumbnail_url="https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=400&auto=format&fit=crop&q=80",
            description="Transport layer mechanics, sequence numbers, window sizing, and Reno/CUBIC algorithms.",
            why_recommended="Deep-dive network packet mechanics for engineering mastery."
        ),
        NicheTopicItem(
            id="cur_math_05",
            title="Engineering Mathematics: Linear Algebra & Eigenvalues",
            topic="Mathematics",
            channel_name="3Blue1Brown",
            target_stream="STEM / All Engineering",
            source_url="https://www.youtube.com/watch?v=PFDu9oVAE-g",
            video_id="PFDu9oVAE-g",
            duration_minutes=42,
            difficulty="Intermediate",
            thumbnail_url="https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&auto=format&fit=crop&q=80",
            description="Intuitive visual geometric interpretation of matrix transformations and characteristic equations.",
            why_recommended="Foundation for machine learning algorithms and quantitative interviews."
        )
    ]

    return NicheFeedResponse(
        education_level=level,
        degree_major=stream,
        standard_class=standard,
        branch=stream,
        current_year=standard,
        ultimate_aim=aim,
        area_of_interest=interests,
        focus_topics=user.focus_topics,
        curated_topics=curated
    )

# ----------------- SESSIONS -----------------
@router.post("/sessions", response_model=LearningSession)
async def create_session(req: CreateSessionRequest):
    session = LearningSession(
        title=req.title,
        source_platform=req.source_platform or "Chrome Tab",
        source_url_or_title=req.source_url_or_title or "Authorized Educational Source",
        status=TaskState.OBSERVING
    )
    return DatabaseManager.create_session(session)

@router.get("/sessions", response_model=List[LearningSession])
async def list_sessions(limit: int = 50):
    return DatabaseManager.list_sessions(limit=limit)

@router.get("/sessions/{session_id}", response_model=LearningSession)
async def get_session(session_id: str):
    s = DatabaseManager.get_session(session_id)
    if not s:
        raise HTTPException(status_code=404, detail="Session not found")
    return s

@router.patch("/sessions/{session_id}")
async def update_session(session_id: str, req: UpdateSessionRequest):
    updates = {k: v for k, v in req.dict().items() if v is not None}
    DatabaseManager.update_session(session_id, updates)
    return {"status": "UPDATED"}

@router.delete("/sessions/{session_id}")
async def delete_session(session_id: str):
    DatabaseManager.delete_session(session_id)
    return {"status": "DELETED"}

# ----------------- TRANSCRIPTS -----------------
@router.get("/sessions/{session_id}/transcript", response_model=List[TranscriptSegment])
async def get_transcripts(session_id: str):
    return DatabaseManager.get_transcript_segments(session_id)

@router.post("/sessions/{session_id}/transcript")
async def add_transcript(session_id: str, segment: TranscriptSegment):
    segment.session_id = session_id
    DatabaseManager.add_transcript_segment(segment)
    # Extract knowledge
    await knowledge_service.extract_knowledge_from_chunk(
        session_id=session_id,
        transcript_text=segment.text,
        timestamp_formatted=segment.timestamp_formatted
    )
    return {"status": "ADDED", "id": segment.id}

# ----------------- FRAMES & SCREENSHOTS -----------------
@router.get("/sessions/{session_id}/frames", response_model=List[FrameCapture])
async def get_frames(session_id: str):
    return DatabaseManager.get_frames(session_id)

@router.post("/sessions/{session_id}/frames")
async def upload_frame(
    session_id: str,
    timestamp_sec: float = Form(...),
    force: bool = Form(False),
    file: UploadFile = File(...)
):
    content = await file.read()
    frame_capture = await screenshot_service.process_frame_data(
        session_id=session_id,
        image_bytes=content,
        timestamp_sec=timestamp_sec,
        force_capture=force
    )
    if not frame_capture:
        return {"status": "SKIPPED_DUPLICATE"}
    
    # Extract knowledge if frame contains OCR text
    if frame_capture.ocr_text:
        await knowledge_service.extract_knowledge_from_chunk(
            session_id=session_id,
            transcript_text=frame_capture.ocr_text,
            timestamp_formatted=frame_capture.timestamp_formatted,
            frame=frame_capture
        )

    return {"status": "CAPTURED", "frame": frame_capture}

@router.post("/sessions/{session_id}/audio-chunk")
async def upload_audio_chunk(
    session_id: str,
    timestamp_sec: float = Form(...),
    speaker: str = Form("Instructor"),
    file: UploadFile = File(...)
):
    audio_bytes = await file.read()
    from backend.app.providers.transcription_provider import transcription_provider
    segments = await transcription_provider.transcribe_audio_bytes(audio_bytes, speaker_hint=speaker)
    saved_segments = []
    for s in segments:
        seg_text = s.get("text", "").strip()
        if not seg_text:
            continue
        formatted_ts = screenshot_service.format_timestamp(timestamp_sec)
        segment = TranscriptSegment(
            session_id=session_id,
            timestamp_start=timestamp_sec,
            timestamp_end=timestamp_sec + 5.0,
            timestamp_formatted=formatted_ts,
            speaker=speaker,
            text=seg_text,
            confidence=s.get("confidence", 0.95)
        )
        DatabaseManager.add_transcript_segment(segment)
        await knowledge_service.extract_knowledge_from_chunk(
            session_id=session_id,
            transcript_text=seg_text,
            timestamp_formatted=formatted_ts
        )
        saved_segments.append(segment)
    return {"status": "TRANSCRIBED", "count": len(saved_segments), "segments": saved_segments}

def generate_fallback_slide_svg(category: str = "SLIDE", description: str = "Lecture Slide", timestamp_str: str = "00:00") -> bytes:
    """Generates a crisp, dark metallic SVG slide visual when an image file is not on disk."""
    import html
    safe_cat = html.escape(str(category or "SLIDE").upper())
    safe_desc = html.escape(str(description or "Visual Lecture Slide")[:80])
    safe_ts = html.escape(str(timestamp_str or "00:00"))
    
    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#090d16" />
          <stop offset="50%" stop-color="#111827" />
          <stop offset="100%" stop-color="#090d16" />
        </linearGradient>
        <linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.15"/>
          <stop offset="100%" stop-color="#0284c7" stop-opacity="0.05"/>
        </linearGradient>
      </defs>
      <rect width="1280" height="720" fill="url(#bg)"/>
      <rect x="30" y="30" width="1220" height="660" rx="20" fill="none" stroke="#334155" stroke-width="2"/>
      <rect x="45" y="45" width="1190" height="630" rx="16" fill="url(#glow)"/>
      
      <!-- Top header bar -->
      <g transform="translate(70, 95)">
        <rect width="160" height="40" rx="8" fill="#0284c7" fill-opacity="0.25" stroke="#38bdf8" stroke-width="1.5"/>
        <text x="80" y="26" font-family="system-ui, sans-serif" font-size="16" font-weight="700" fill="#38bdf8" text-anchor="middle" letter-spacing="1">[{safe_cat}]</text>
        
        <rect x="980" y="0" width="140" height="40" rx="8" fill="#1e293b" stroke="#475569" stroke-width="1.5"/>
        <text x="1050" y="26" font-family="monospace" font-size="16" font-weight="600" fill="#94a3b8" text-anchor="middle">{safe_ts}</text>
      </g>
      
      <!-- Center Graphic: Slide Presentation Canvas -->
      <g transform="translate(640, 360)">
        <circle r="60" fill="#1e293b" stroke="#38bdf8" stroke-width="2" stroke-dasharray="6 4"/>
        <path d="M -22 -20 L 28 0 L -22 20 Z" fill="#38bdf8" fill-opacity="0.85"/>
        <text x="0" y="110" font-family="system-ui, sans-serif" font-size="26" font-weight="700" fill="#f8fafc" text-anchor="middle">{safe_desc}</text>
        <text x="0" y="145" font-family="system-ui, sans-serif" font-size="15" fill="#64748b" text-anchor="middle">LearnLens AI Multimodal Visual Evidence Frame</text>
      </g>
    </svg>"""
    return svg.encode("utf-8")

@router.get("/frames/{frame_id}/image")
async def get_frame_image(frame_id: str):
    from backend.app.db.database import get_db_connection
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT session_id, image_path, thumbnail_path, category, visual_description, timestamp_formatted FROM frames WHERE id = ?", (frame_id,))
    row = cursor.fetchone()
    conn.close()

    if row:
        resolved = resolve_frame_path(row["image_path"], row["session_id"])
        if not resolved and row["thumbnail_path"]:
            resolved = resolve_frame_path(row["thumbnail_path"], row["session_id"])
        if resolved and resolved.is_file():
            return FileResponse(str(resolved), media_type="image/jpeg", headers={"Cache-Control": "public, max-age=86400"})
        
        # Return elegant SVG slide visual fallback
        svg_data = generate_fallback_slide_svg(
            category=row["category"] or "SLIDE",
            description=row["visual_description"] or "Lecture Slide Capture",
            timestamp_str=row["timestamp_formatted"] or "00:00"
        )
        return Response(content=svg_data, media_type="image/svg+xml", headers={"Cache-Control": "public, max-age=3600"})

    # Even for unknown ID, return graceful generic slide fallback rather than 404
    svg_data = generate_fallback_slide_svg("SLIDE", "Lecture Slide Capture", "00:00")
    return Response(content=svg_data, media_type="image/svg+xml", headers={"Cache-Control": "public, max-age=300"})

@router.get("/frames/{frame_id}/thumbnail")
async def get_frame_thumbnail(frame_id: str):
    from backend.app.db.database import get_db_connection
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT session_id, thumbnail_path, image_path, category, visual_description, timestamp_formatted FROM frames WHERE id = ?", (frame_id,))
    row = cursor.fetchone()
    conn.close()

    if row:
        resolved = None
        if row["thumbnail_path"]:
            resolved = resolve_frame_path(row["thumbnail_path"], row["session_id"])
        if not resolved and row["image_path"]:
            resolved = resolve_frame_path(row["image_path"], row["session_id"])
        if resolved and resolved.is_file():
            return FileResponse(str(resolved), media_type="image/jpeg", headers={"Cache-Control": "public, max-age=86400"})

        # Return elegant SVG slide thumbnail fallback
        svg_data = generate_fallback_slide_svg(
            category=row["category"] or "SLIDE",
            description=row["visual_description"] or "Lecture Slide Capture",
            timestamp_str=row["timestamp_formatted"] or "00:00"
        )
        return Response(content=svg_data, media_type="image/svg+xml", headers={"Cache-Control": "public, max-age=3600"})

    svg_data = generate_fallback_slide_svg("SLIDE", "Lecture Slide Capture", "00:00")
    return Response(content=svg_data, media_type="image/svg+xml", headers={"Cache-Control": "public, max-age=300"})

# ----------------- CONCEPTS -----------------
@router.get("/sessions/{session_id}/concepts", response_model=List[Concept])
async def get_concepts(session_id: str):
    return DatabaseManager.get_concepts(session_id)

# ----------------- CHAT & AI TEACHER -----------------
@router.get("/sessions/{session_id}/chat", response_model=List[ChatMessage])
async def get_chat_history(session_id: str):
    return DatabaseManager.get_chat_messages(session_id)

@router.post("/sessions/{session_id}/chat", response_model=ChatMessage)
async def chat_with_teacher(session_id: str, req: ChatRequest):
    # Save user message
    user_msg = ChatMessage(
        session_id=session_id,
        sender="user",
        text=req.message,
        mode=req.mode
    )
    DatabaseManager.add_chat_message(user_msg)

    # Generate teacher response
    assistant_msg = await teacher_service.teach(
        session_id=session_id,
        user_message=req.message,
        mode=req.mode,
        cross_session=req.cross_session
    )
    return assistant_msg

# ----------------- HUMAN CONTROL & COMMANDS -----------------
@router.post("/sessions/{session_id}/command")
async def execute_command(session_id: str, req: CommandRequest):
    return await task_agent_service.handle_user_command(session_id, req.command)

@router.post("/sessions/{session_id}/pause")
async def pause_agent(session_id: str):
    return task_agent_service.pause(session_id)

@router.post("/sessions/{session_id}/resume")
async def resume_agent(session_id: str):
    return task_agent_service.resume(session_id)

@router.post("/sessions/{session_id}/stop")
async def stop_agent(session_id: str):
    return task_agent_service.stop(session_id)

# ----------------- PPT & PDF EXPORTS -----------------
@router.post("/sessions/{session_id}/generate-ppt")
async def generate_ppt(session_id: str, req: PPTGenerateRequest):
    output_path = await ppt_service.generate_presentation(
        session_id=session_id,
        style=req.style,
        slide_count=req.slide_count,
        custom_focus=req.custom_focus
    )
    filename = os.path.basename(output_path)
    return {"status": "SUCCESS", "filename": filename, "download_url": f"/api/exports/{session_id}/{filename}"}

@router.post("/sessions/{session_id}/generate-pdf")
async def generate_pdf(session_id: str, req: PDFGenerateRequest):
    output_path = await pdf_service.generate_pdf(
        session_id=session_id,
        pdf_type=req.pdf_type
    )
    filename = os.path.basename(output_path)
    return {"status": "SUCCESS", "filename": filename, "download_url": f"/api/exports/{session_id}/{filename}"}

@router.get("/exports/{session_id}/{filename}")
async def download_export(session_id: str, filename: str):
    session_dir = get_session_dir(session_id)
    exports_dir = session_dir / "exports"
    target = exports_dir / filename
    if not target.exists() and exports_dir.exists():
        ext = os.path.splitext(filename)[1].lower()
        if not ext and "pdf" in filename.lower():
            ext = ".pdf"
        elif not ext and "ppt" in filename.lower():
            ext = ".pptx"
        if ext:
            matching = sorted(exports_dir.glob(f"*{ext}"), key=lambda p: p.stat().st_mtime, reverse=True)
            if matching:
                target = matching[0]
                filename = target.name

    if not target.exists():
        raise HTTPException(status_code=404, detail=f"Export file '{filename}' not found for session {session_id}")
    media_type = "application/vnd.openxmlformats-officedocument.presentationml.presentation" if filename.endswith(".pptx") else "application/pdf"
    return FileResponse(
        str(target),
        media_type=media_type,
        filename=filename,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@router.get("/sessions/{session_id}/export/{filename}")
async def download_session_export_alias(session_id: str, filename: str):
    return await download_export(session_id, filename)

# ----------------- QUIZ & PRACTICE -----------------
@router.post("/sessions/{session_id}/quiz/import")
async def import_quiz(session_id: str, file: UploadFile = File(...)):
    session_dir = get_session_dir(session_id)
    tmp_path = session_dir / f"uploaded_quiz_{int(time.time())}.pdf"
    with open(tmp_path, "wb") as f:
        f.write(await file.read())
    questions = await quiz_service.import_quiz_pdf(session_id, str(tmp_path))
    return {"status": "IMPORTED", "count": len(questions), "questions": questions}

@router.get("/sessions/{session_id}/quiz")
async def get_quiz(session_id: str):
    return await quiz_service.generate_questions_for_session(session_id, force_refresh=False)

@router.post("/sessions/{session_id}/quiz/generate")
async def generate_quiz(session_id: str):
    questions = await quiz_service.generate_questions_for_session(session_id, force_refresh=True)
    return {"status": "SUCCESS", "count": len(questions), "questions": questions}

@router.post("/sessions/{session_id}/quiz/custom")
async def create_custom_quiz(session_id: str, req: CustomQuizRequest):
    questions = await quiz_service.generate_custom_quiz(
        session_id=session_id,
        concept_name=req.concept_name,
        count=req.num_questions,
        difficulty=req.difficulty or "MEDIUM"
    )
    return {"status": "SUCCESS", "count": len(questions), "questions": questions}

@router.post("/quiz/{question_id}/submit")
async def submit_quiz_answer(question_id: str, answer_data: dict):
    selected_idx = answer_data.get("selected_option_index", 0)
    result = quiz_service.submit_practice_answer(question_id, selected_idx)
    return result

# ----------------- LEARNER PROFILE -----------------
@router.get("/sessions/{session_id}/learner-profile")
async def get_learner_profile(session_id: str):
    return DatabaseManager.get_learner_profile(session_id)

# ----------------- SEARCH & PINNING -----------------
@router.get("/search")
async def search_endpoint(q: str = Query(...), session_id: Optional[str] = Query(None)):
    return DatabaseManager.search_all(query=q, session_id=session_id)

@router.post("/pin")
async def toggle_pin_endpoint(req: PinItemRequest):
    success = DatabaseManager.toggle_pin(req.item_type, req.item_id, req.is_pinned)
    return {"status": "SUCCESS" if success else "FAILED"}

# ----------------- OFFLINE VIDEO IMPORT & HYPERINGEST -----------------
@router.post("/video/import")
async def import_video(file: UploadFile = File(...), title: Optional[str] = Form(None)):
    import time
    from backend.app.core.config import SESSIONS_DIR
    tmp_path = SESSIONS_DIR / f"temp_{int(time.time())}_{file.filename}"
    with open(tmp_path, "wb") as f:
        f.write(await file.read())
    session_id = await video_import_service.process_video_file(str(tmp_path), title=title)
    if tmp_path.exists():
        os.remove(tmp_path)
    return {"status": "PROCESSED", "session_id": session_id}

@router.post("/video/hyper-ingest")
async def hyper_ingest_endpoint(files: List[UploadFile] = File(...), title: Optional[str] = Form(None)):
    """
    HyperIngest Batch Endpoint: Ingests 10-100 videos in parallel/accelerated mode,
    capturing only genuine 16:9 slide transitions at 50x-100x realtime.
    """
    import time
    from backend.app.core.config import SESSIONS_DIR
    batch_dir = SESSIONS_DIR / f"hyper_batch_{int(time.time())}"
    batch_dir.mkdir(parents=True, exist_ok=True)
    
    saved_paths = []
    try:
        for f in files:
            t_path = batch_dir / f.filename
            with open(t_path, "wb") as out_f:
                out_f.write(await f.read())
            saved_paths.append(str(t_path))
            
        session_id = await hyper_ingest_service.ingest_video_batch(saved_paths, course_title=title)
        return {
            "status": "COMPLETED",
            "session_id": session_id,
            "total_videos": len(saved_paths),
            "message": f"Successfully ingested {len(saved_paths)} videos in accelerated mode."
        }
    finally:
        # Cleanup uploaded raw videos
        try:
            shutil.rmtree(batch_dir, ignore_errors=True)
        except Exception:
            pass

@router.get("/video/hyper-ingest/status")
async def get_hyper_ingest_status():
    return hyper_ingest_service.get_status()

class HyperIngestUrlRequest(BaseModel):
    url: str
    title: Optional[str] = None
    max_videos: Optional[int] = 50

@router.post("/video/hyper-ingest-url")
async def hyper_ingest_url_endpoint(req: HyperIngestUrlRequest):
    """
    HyperIngest URL Endpoint: Ingests YouTube playlists, videos, or course web links,
    extracting 16:9 slides and completing courses in accelerated mode.
    """
    session_id = await hyper_ingest_service.ingest_url(
        url=req.url,
        course_title=req.title,
        max_videos=req.max_videos or 50
    )
    return {
        "status": "COMPLETED",
        "session_id": session_id,
        "message": f"Successfully ingested course stream from {req.url}"
    }

@router.post("/sessions/{session_id}/export/slide-pdf")
async def export_slide_only_pdf(session_id: str):
    """
    Generates pure 16:9 widescreen slide deck PDF matching exact video dimensions
    with full-bleed slide images and zero margins.
    """
    output_path = await pdf_service.generate_pdf(session_id, pdf_type="slide_only")
    filename = os.path.basename(output_path)
    return {"status": "SUCCESS", "filename": filename, "download_url": f"/api/exports/{session_id}/{filename}"}

@router.post("/sessions/{session_id}/export/slide-pptx")
async def export_slide_only_pptx(session_id: str):
    """
    Generates pure 16:9 widescreen PowerPoint deck matching exact video dimensions.
    """
    output_path = await ppt_service.generate_slide_only_presentation(session_id)
    filename = os.path.basename(output_path)
    return {"status": "SUCCESS", "filename": filename, "download_url": f"/api/exports/{session_id}/{filename}"}

# ----------------- SYSTEM SETTINGS & RUNTIME CONTROL -----------------
class SystemSettingsUpdate(BaseModel):
    fast_mode: Optional[bool] = None
    default_model: Optional[str] = None
    enable_live_vlm: Optional[bool] = None
    enable_live_whisper: Optional[bool] = None

@router.get("/system/settings")
async def get_system_settings():
    models = await llm_provider.get_models()
    return {
        "fast_mode": settings.FAST_MODE,
        "default_llm_model": settings.DEFAULT_LLM_MODEL,
        "enable_live_vlm": settings.ENABLE_LIVE_VLM,
        "enable_live_whisper": settings.ENABLE_LIVE_WHISPER,
        "ollama_timeout_sec": settings.OLLAMA_TIMEOUT_SEC,
        "installed_models": models
    }

@router.post("/system/settings")
async def update_system_settings(req: SystemSettingsUpdate):
    if req.fast_mode is not None:
        settings.FAST_MODE = req.fast_mode
    if req.default_model:
        settings.DEFAULT_LLM_MODEL = req.default_model
        llm_provider.model = req.default_model
    if req.enable_live_vlm is not None:
        settings.ENABLE_LIVE_VLM = req.enable_live_vlm
    if req.enable_live_whisper is not None:
        settings.ENABLE_LIVE_WHISPER = req.enable_live_whisper
    return {"status": "UPDATED", "settings": await get_system_settings()}


# =========================================================================
# ----------------- USER AUTHENTICATION & PROFILE ENDPOINTS ---------------
# =========================================================================

@router.post("/auth/register", response_model=AuthResponse)
async def register_user(req: UserRegisterRequest):
    existing = DatabaseManager.get_user_by_email(req.email)
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")
    
    tier = req.plan_selected or "FREE_TRIAL"
    is_paid_plan = tier in ("PRO_MONTHLY", "ANNUAL_PASS")
    payment_status = "PENDING_APPROVAL" if is_paid_plan else "FREE_TRIAL_ACTIVE"
    is_approved = not is_paid_plan

    profile_obj = UserProfile(
        email=req.email.strip().lower(),
        name=req.name,
        phone=req.phone or "",
        education_level=req.education_level or "Undergraduate",
        standard_class=req.standard_class or req.current_year or "3rd Year",
        institution=req.institution or "",
        degree_major=req.degree_major or req.branch or "Computer Science & Engineering",
        branch=req.branch or req.degree_major or "Computer Science & Engineering",
        current_year=req.current_year or req.standard_class or "3rd Year",
        area_of_interest=req.area_of_interest or ["Data Structures & Algorithms", "System Design"],
        ultimate_aim=req.ultimate_aim or "Crack Google SDE-1 / Top Product Companies",
        focus_topics=req.focus_topics or ["Data Structures & Algorithms", "System Design"],
        subscription_tier=tier,
        payment_status=payment_status,
        payment_reference=req.payment_reference or "",
        is_approved_by_admin=is_approved,
        credentials_sent=False,
        role="STUDENT"
    )
    
    saved_profile = DatabaseManager.create_user(profile_obj, req.password)
    token = f"token_{saved_profile.id}_{int(time.time())}"
    
    if is_paid_plan and req.payment_reference:
        msg = f"Registration received with Payment Reference {req.payment_reference}. Administrator will verify payment and email your credentials shortly."
    else:
        msg = "Account created successfully with 10 Free Passes!"
        
    return AuthResponse(
        success=True,
        token=token,
        user=saved_profile,
        message=msg
    )

@router.post("/auth/login", response_model=AuthResponse)
async def login_user(req: UserLoginRequest):
    user = DatabaseManager.get_user_by_email(req.email)
    if not user:
        raise HTTPException(status_code=401, detail="User not found with this email.")
    
    token = f"token_{user.id}_{int(time.time())}"
    return AuthResponse(
        success=True,
        token=token,
        user=user,
        message="Logged in successfully."
    )

@router.get("/auth/me", response_model=UserProfile)
async def get_current_user_profile(user_id: Optional[str] = Query(None)):
    if user_id:
        u = DatabaseManager.get_user_by_id(user_id)
        if u:
            return u
    return DatabaseManager.get_or_create_default_user()

@router.put("/user/profile", response_model=UserProfile)
async def update_current_user_profile(req: UpdateProfileRequest, user_id: Optional[str] = Query(None)):
    target_user = DatabaseManager.get_user_by_id(user_id) if user_id else DatabaseManager.get_or_create_default_user()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found.")
    
    updates = req.model_dump(exclude_unset=True)
    updated = DatabaseManager.update_user_profile(target_user.id, updates)
    return updated or target_user

@router.get("/user/credits", response_model=CreditStatusResponse)
async def get_user_credits_endpoint(user_id: Optional[str] = Query(None)):
    target_user = DatabaseManager.get_user_by_id(user_id) if user_id else DatabaseManager.get_or_create_default_user()
    data = DatabaseManager.get_user_credits(target_user.id)
    return CreditStatusResponse(**data)

@router.post("/user/consume-credit")
async def consume_user_credit_endpoint(req: ConsumeCreditRequest, user_id: Optional[str] = Query(None)):
    target_user = DatabaseManager.get_user_by_id(user_id) if user_id else DatabaseManager.get_or_create_default_user()
    res = DatabaseManager.consume_user_credit(target_user.id, req.session_id, req.action)
    return res

@router.get("/user/progress", response_model=StudentProgressSummary)
async def get_student_overall_progress_endpoint(user_id: Optional[str] = Query(None)):
    """
    Returns student's overall learning progress metrics:
    - Study streak & total hours learned
    - Total sessions, concepts mastered vs struggling
    - Transcripts words ingested & screenshots auto-captured
    - Practice quiz accuracy & topic mastery breakdown
    """
    data = DatabaseManager.get_student_overall_progress(user_id)
    return StudentProgressSummary(**data)


# =========================================================================
# --------- DISTRACTION-FREE PERSONALIZED STUDY RECOMMENDATIONS -----------
# =========================================================================

@router.get("/curated/niche-feed", response_model=NicheFeedResponse)
async def get_curated_niche_feed(user_id: Optional[str] = Query(None)):
    """
    Returns tailored YouTube study recommendations and channels directly matched to:
    - Branch / Degree
    - Current Year of Study
    - Area of Interest
    - Ultimate Aim (Optional, e.g. Crack Google SDE-1 / GATE AIR < 100)
    """
    user = DatabaseManager.get_user_by_id(user_id) if user_id else DatabaseManager.get_or_create_default_user()
    branch = user.branch or user.degree_major or "Computer Science & Engineering"
    year = user.current_year or user.standard_class or "3rd Year"
    aim = user.ultimate_aim or "Crack Google SDE-1 / Top Product Companies"
    interests = user.area_of_interest or ["Data Structures & Algorithms", "System Design", "Operating Systems"]

    # Catalog of verified, high-yield educational YouTube lecture videos with working embeds & channels
    catalog = [
        NicheTopicItem(
            id="yt-dsa-striver",
            title="Complete Dynamic Programming Masterclass & Memoization",
            topic="Dynamic Programming & Recursion",
            channel_name="take U forward (Striver)",
            target_stream="CSE / IT / Placement Prep",
            source_url="https://www.youtube.com/watch?v=FfXoiwnn6ey",
            video_id="FfXoiwnn6ey",
            duration_minutes=48,
            difficulty="Intermediate",
            thumbnail_url="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80",
            description="Deep dive into 1D and 2D Dynamic Programming patterns, overlapping subproblems, and optimal substructure with dry-run visuals.",
            why_recommended=f"Essential for your aim '{aim}' as a {year} {branch} student preparing for top coding interviews."
        ),
        NicheTopicItem(
            id="yt-sysdesign-gaurav",
            title="System Design Primer: Designing Scalable Distributed Caching",
            topic="System Design & Scalability",
            channel_name="Gaurav Sen",
            target_stream="CSE / High Level Design",
            source_url="https://www.youtube.com/watch?v=U3RkDLtS7uY",
            video_id="U3RkDLtS7uY",
            duration_minutes=35,
            difficulty="Advanced",
            thumbnail_url="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&auto=format&fit=crop&q=80",
            description="Understand cache eviction policies (LRU/LFU), Write-Through vs Write-Back, Redis clusters, and latency reduction in real-time architectures.",
            why_recommended=f"Directly accelerates your interest in System Design and supports target goal '{aim}'."
        ),
        NicheTopicItem(
            id="yt-os-gatesmashers",
            title="Operating Systems: Concurrency, Semaphores & Deadlock Prevention",
            topic="Operating Systems & Concurrency",
            channel_name="Gate Smashers",
            target_stream="GATE CSE / Semester Core",
            source_url="https://www.youtube.com/watch?v=1r_A_r_vAEM",
            video_id="1r_A_r_vAEM",
            duration_minutes=29,
            difficulty="Intermediate",
            thumbnail_url="https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=600&auto=format&fit=crop&q=80",
            description="Clear animated breakdown of mutexes, counting semaphores, critical section problem, and Banker's algorithm with numerical proofs.",
            why_recommended=f"Matches your {year} core curriculum in {branch} and builds foundational problem-solving rigor."
        ),
        NicheTopicItem(
            id="yt-3blue1brown-linalg",
            title="Essence of Linear Algebra: Vectors, Span & Basis Transformations",
            topic="Mathematics & ML Foundations",
            channel_name="3Blue1Brown",
            target_stream="AI / Data Science / Engineering Math",
            source_url="https://www.youtube.com/watch?v=fNk_zzaMoSs",
            video_id="fNk_zzaMoSs",
            duration_minutes=22,
            difficulty="Beginner",
            thumbnail_url="https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&auto=format&fit=crop&q=80",
            description="World-renowned geometric intuition behind matrix transformations, eigen-values, and multidimensional dot products.",
            why_recommended=f"Fundamental mathematical bedrock for Machine Learning and algorithm optimization."
        ),
        NicheTopicItem(
            id="yt-neetcode-trees",
            title="Binary Tree Traversal, DFS/BFS & Lowest Common Ancestor",
            topic="Data Structures & Algorithms",
            channel_name="NeetCode",
            target_stream="FAANG / LeetCode Roadmap",
            source_url="https://www.youtube.com/watch?v=OnSn2XEQ4MY",
            video_id="OnSn2XEQ4MY",
            duration_minutes=32,
            difficulty="Intermediate",
            thumbnail_url="https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80",
            description="Interactive step-by-step recursion trees, time-space complexity proofs, and edge cases for top product interview questions.",
            why_recommended=f"High frequency interview topic for {branch} students targeting tier-1 software roles."
        ),
        NicheTopicItem(
            id="yt-cn-firewall",
            title="Computer Networks: Packet Filtering, Next-Gen Firewalls & TLS 1.3",
            topic="Computer Networks & Security",
            channel_name="NetworkChuck",
            target_stream="Cybersecurity / DevOps",
            source_url="https://www.youtube.com/watch?v=kd0x89n4yHk",
            video_id="kd0x89n4yHk",
            duration_minutes=27,
            difficulty="Beginner",
            thumbnail_url="https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&auto=format&fit=crop&q=80",
            description="Hands-on demonstration of network traffic packets, OSI layers inspection, stateful vs stateless packet inspection, and zero trust.",
            why_recommended=f"Practical cybersecurity knowledge tailored to modern infrastructure engineering."
        )
    ]

    return NicheFeedResponse(
        education_level=user.education_level or "Undergraduate",
        degree_major=branch,
        standard_class=year,
        branch=branch,
        current_year=year,
        ultimate_aim=aim,
        area_of_interest=interests,
        focus_topics=interests,
        curated_topics=catalog
    )


# =========================================================================
# -------------------- ADMIN PORTAL & SUBSCRIPTION MANAGEMENT -------------
# =========================================================================

@router.get("/admin/stats", response_model=AdminStatsResponse)
async def get_admin_dashboard_stats():
    """
    Returns platform statistics for Admin review:
    - Total registered students
    - Active Pro / Annual subscribers
    - Pending registrations waiting for payment verification
    - Total revenue in INR
    - Total analyzed lectures & PPT decks generated
    - Complete students list with payment reference and credentials status
    """
    stats = DatabaseManager.get_admin_stats()
    return AdminStatsResponse(**stats)

@router.get("/admin/users")
async def get_admin_users_list():
    users = DatabaseManager.list_all_users()
    return {"users": users}

@router.post("/admin/users/approve", response_model=AdminUserActionResponse)
async def admin_approve_user_subscription(req: AdminApproveRequest):
    """
    Admin verifies student payment receipt / reference and approves subscription:
    - Unlocks unlimited access (PRO_MONTHLY / ANNUAL_PASS)
    - Updates payment_status to 'PAID_APPROVED'
    - Dispatches welcome confirmation and login credentials to student's email
    """
    res = DatabaseManager.admin_approve_subscription(
        user_id=req.user_id,
        tier=req.tier or "PRO_MONTHLY",
        send_email=req.send_email,
        temp_pass=req.temp_password
    )
    return AdminUserActionResponse(**res)

@router.post("/admin/users/topup", response_model=AdminUserActionResponse)
async def admin_topup_user_credits(req: AdminTopupRequest):
    """
    Admin adds study passes / credits to a student's account.
    """
    user = DatabaseManager.get_user_by_id(req.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    
    res = DatabaseManager.admin_topup_credits(req.user_id, req.credits_to_add, req.reason)
    user_updated = DatabaseManager.get_user_by_id(req.user_id)
    return AdminUserActionResponse(
        success=res["success"],
        user=user_updated,
        message=res["message"],
        email_dispatched=False
    )



