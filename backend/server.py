from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Header
from fastapi.responses import StreamingResponse, Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, validator
from typing import List, Optional
import uuid
from datetime import datetime, timezone, date, timedelta
import bcrypt
import jwt
import io
import pandas as pd
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Secret - must be set in environment
JWT_SECRET = os.environ.get('JWT_SECRET')
if not JWT_SECRET:
    JWT_SECRET = 'fabverse-secret-key-' + os.environ.get('DB_NAME', 'default')
JWT_ALGORITHM = 'HS256'

app = FastAPI(title="FABVERSE ERP API")
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class LoginRequest(BaseModel):
    username: str
    password: str

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str

class TokenResponse(BaseModel):
    token: str
    username: str

class FirmSettings(BaseModel):
    firm_name: str = "FABVERSE"
    address_line1: str = ""
    address_line2: str = ""
    address_line3: str = ""
    city_state_pin: str = ""
    gst_number: str = ""
    mobile: str = ""
    email: str = ""
    logo_url: str = ""

class CuttingRoll(BaseModel):
    roll_no: str
    meters_or_kgs: float

class LotCreate(BaseModel):
    lot_no: str
    cutting_date: str
    gender: str
    sizes: str
    style: str
    fabric_name: str
    fabric_grade: str = "Fresh"
    dyeing_or_washing_instructions: str = ""
    rolls: List[CuttingRoll] = []
    total_pcs_cut: int = 0
    fabric_price_per_meter_or_kg: float = 0.0
    cutting_notes: str = ""

    @validator('gender')
    def validate_gender(cls, v):
        valid_genders = ["Mens", "Womens", "Kids"]
        if v and v not in valid_genders:
            raise ValueError(f"Gender must be one of: {valid_genders}")
        return v

class LotUpdate(BaseModel):
    lot_no: Optional[str] = None
    cutting_date: Optional[str] = None
    gender: Optional[str] = None
    sizes: Optional[str] = None
    style: Optional[str] = None
    fabric_name: Optional[str] = None
    fabric_grade: Optional[str] = None
    dyeing_or_washing_instructions: Optional[str] = None
    rolls: Optional[List[CuttingRoll]] = None
    total_pcs_cut: Optional[int] = None
    fabric_price_per_meter_or_kg: Optional[float] = None
    cutting_notes: Optional[str] = None

class StitchingStageCreate(BaseModel):
    lot_id: str
    stitching_fabricator_name: str
    lot_issue_date_to_stitching: str
    stitching_notes: str = ""

class StitchingStageUpdate(BaseModel):
    stitching_fabricator_name: Optional[str] = None
    lot_issue_date_to_stitching: Optional[str] = None
    receive_date_from_stitching: Optional[str] = None
    pcs_received_back_from_stitching: Optional[int] = None
    stitching_notes: Optional[str] = None

class BartackStageCreate(BaseModel):
    lot_id: str
    bartack_person_name: str
    lot_issue_to_bartack_date: str
    pcs_issued_to_bartack: int = 0
    bartack_notes: str = ""

class BartackStageUpdate(BaseModel):
    bartack_person_name: Optional[str] = None
    lot_issue_to_bartack_date: Optional[str] = None
    pcs_issued_to_bartack: Optional[int] = None
    bartack_notes: Optional[str] = None

class WashingStageCreate(BaseModel):
    lot_id: str
    dyeing_person_firm_name: str
    lot_issue_date_to_washing: str
    pcs_issued_to_washing: int = 0
    washing_notes: str = ""

class WashingStageUpdate(BaseModel):
    dyeing_person_firm_name: Optional[str] = None
    lot_issue_date_to_washing: Optional[str] = None
    pcs_issued_to_washing: Optional[int] = None
    receive_date_from_washing: Optional[str] = None
    pcs_received_back_from_washing: Optional[int] = None
    washing_notes: Optional[str] = None

# ==================== AUTH HELPERS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(username: str) -> str:
    payload = {
        'username': username,
        'exp': datetime.now(timezone.utc).timestamp() + 86400 * 7  # 7 days
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(authorization: str = None):
    if not authorization:
        raise HTTPException(status_code=401, detail="No authorization header")
    try:
        token = authorization.replace("Bearer ", "")
        payload = verify_token(token)
        return payload
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

# ==================== INIT ADMIN ====================

async def init_admin():
    admin = await db.users.find_one({"username": "admin"})
    if not admin:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "username": "admin",
            "password": hash_password("admin"),
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        logger.info("Admin user created with default credentials")

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    user = await db.users.find_one({"username": request.username}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not verify_password(request.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token(user["username"])
    return {"token": token, "username": user["username"]}

@api_router.post("/auth/change-password")
async def change_password(request: ChangePasswordRequest, authorization: str = Header(None)):
    user_data = await get_current_user(authorization)
    user = await db.users.find_one({"username": user_data["username"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not verify_password(request.old_password, user["password"]):
        raise HTTPException(status_code=400, detail="Old password is incorrect")
    await db.users.update_one(
        {"username": user_data["username"]},
        {"$set": {"password": hash_password(request.new_password)}}
    )
    return {"message": "Password changed successfully"}

@api_router.get("/auth/me")
async def get_me(authorization: str = Header(None)):
    user_data = await get_current_user(authorization)
    return {"username": user_data["username"]}

# ==================== FIRM SETTINGS ROUTES ====================

@api_router.get("/settings/firm")
async def get_firm_settings():
    settings = await db.firm_settings.find_one({"type": "firm"}, {"_id": 0})
    if not settings:
        # Return default settings
        return {
            "firm_name": "FABVERSE",
            "address_line1": "Plot No. 2312, Lane No. 12",
            "address_line2": "Raghubar Pura No. 2",
            "address_line3": "",
            "city_state_pin": "Gandhi Nagar, Delhi - 31",
            "gst_number": "",
            "mobile": "9999994690",
            "email": "",
            "logo_url": "https://customer-assets.emergentagent.com/job_fresh-start-208/artifacts/wh0wtqse_2.jpg"
        }
    return settings

@api_router.put("/settings/firm")
async def update_firm_settings(settings: FirmSettings, authorization: str = Header(None)):
    await get_current_user(authorization)  # Verify auth
    
    settings_dict = settings.model_dump()
    settings_dict["type"] = "firm"
    settings_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.firm_settings.update_one(
        {"type": "firm"},
        {"$set": settings_dict},
        upsert=True
    )
    
    return {"message": "Firm settings updated successfully"}

@api_router.get("/settings/logo-proxy")
async def proxy_logo():
    """Proxy the firm logo to avoid CORS issues with html2canvas"""
    settings = await db.firm_settings.find_one({"type": "firm"}, {"_id": 0})
    
    # Use default logo if no settings in database
    if not settings:
        logo_url = "https://customer-assets.emergentagent.com/job_fresh-start-208/artifacts/wh0wtqse_2.jpg"
    else:
        logo_url = settings.get("logo_url")
    
    if not logo_url:
        raise HTTPException(status_code=404, detail="No logo configured")
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(logo_url, timeout=10)
            response.raise_for_status()
            
            content_type = response.headers.get("content-type", "image/jpeg")
            
            return Response(
                content=response.content,
                media_type=content_type,
                headers={
                    "Cache-Control": "public, max-age=3600",
                    "Access-Control-Allow-Origin": "*"
                }
            )
        except Exception as e:
            logger.error(f"Failed to proxy logo: {e}")
            raise HTTPException(status_code=500, detail="Failed to fetch logo")

# ==================== LOT ROUTES ====================

@api_router.post("/lots")
async def create_lot(lot: LotCreate):
    # Check for duplicate lot_no
    existing = await db.lots.find_one({"lot_no": lot.lot_no})
    if existing:
        raise HTTPException(status_code=400, detail="Lot number already exists")
    
    # Calculate totals
    total_meters = sum(r.meters_or_kgs for r in lot.rolls)
    avg_fabric = total_meters / lot.total_pcs_cut if lot.total_pcs_cut > 0 else 0
    fabric_cost_per_pc = avg_fabric * lot.fabric_price_per_meter_or_kg
    
    lot_doc = {
        "id": str(uuid.uuid4()),
        "lot_no": lot.lot_no,
        "cutting_date": lot.cutting_date,
        "gender": lot.gender,
        "sizes": lot.sizes,
        "style": lot.style,
        "fabric_name": lot.fabric_name,
        "fabric_grade": lot.fabric_grade,
        "dyeing_or_washing_instructions": lot.dyeing_or_washing_instructions,
        "rolls": [r.model_dump() for r in lot.rolls],
        "total_meters_or_kgs_used": total_meters,
        "total_pcs_cut": lot.total_pcs_cut,
        "avg_fabric_used_per_pc": round(avg_fabric, 4),
        "fabric_price_per_meter_or_kg": lot.fabric_price_per_meter_or_kg,
        "fabric_cost_per_pc": round(fabric_cost_per_pc, 2),
        "cutting_notes": lot.cutting_notes,
        "current_stage": "Cutting",
        "overall_status": "Pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.lots.insert_one(lot_doc)
    lot_doc.pop("_id", None)
    return lot_doc

@api_router.get("/lots")
async def get_lots(
    search: str = None,
    stage: str = None,
    status: str = None,
    start_date: str = None,
    end_date: str = None
):
    query = {}
    
    # Basic filters on lots collection
    if stage:
        query["current_stage"] = stage
    
    if status:
        query["overall_status"] = status
    
    if start_date:
        query["cutting_date"] = {"$gte": start_date}
    
    if end_date:
        if "cutting_date" in query:
            query["cutting_date"]["$lte"] = end_date
        else:
            query["cutting_date"] = {"$lte": end_date}
    
    lots = await db.lots.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    if not lots:
        return lots
    
    # Batch fetch all stage data using $in operator (optimized - avoids N+1 queries)
    lot_ids = [lot["id"] for lot in lots]
    
    # Fetch all stitching stages in one query
    stitching_list = await db.stitching_stages.find({"lot_id": {"$in": lot_ids}}, {"_id": 0}).to_list(1000)
    stitching_map = {s["lot_id"]: s for s in stitching_list}
    
    # Fetch all bartack stages in one query
    bartack_list = await db.bartack_stages.find({"lot_id": {"$in": lot_ids}}, {"_id": 0}).to_list(1000)
    bartack_map = {b["lot_id"]: b for b in bartack_list}
    
    # Fetch all washing stages in one query
    washing_list = await db.washing_stages.find({"lot_id": {"$in": lot_ids}}, {"_id": 0}).to_list(1000)
    washing_map = {w["lot_id"]: w for w in washing_list}
    
    # Map stage data to lots
    for lot in lots:
        lot_id = lot["id"]
        lot["stitching"] = stitching_map.get(lot_id)
        lot["bartack"] = bartack_map.get(lot_id)
        lot["washing"] = washing_map.get(lot_id)
    
    # Apply search filter after fetching stage data (to search by person names)
    if search:
        search_lower = search.lower()
        filtered_lots = []
        for lot in lots:
            # Search in lot fields
            if (search_lower in (lot.get("lot_no") or "").lower() or
                search_lower in (lot.get("fabric_name") or "").lower() or
                search_lower in (lot.get("style") or "").lower()):
                filtered_lots.append(lot)
                continue
            
            # Search in stitching fabricator name
            if lot.get("stitching") and search_lower in (lot["stitching"].get("stitching_fabricator_name") or "").lower():
                filtered_lots.append(lot)
                continue
            
            # Search in bartack person name
            if lot.get("bartack") and search_lower in (lot["bartack"].get("bartack_person_name") or "").lower():
                filtered_lots.append(lot)
                continue
            
            # Search in washing/dyeing firm name
            if lot.get("washing") and search_lower in (lot["washing"].get("dyeing_person_firm_name") or "").lower():
                filtered_lots.append(lot)
                continue
        
        return filtered_lots
    
    return lots

@api_router.get("/lots/{lot_id}")
async def get_lot(lot_id: str):
    lot = await db.lots.find_one({"id": lot_id}, {"_id": 0})
    if not lot:
        raise HTTPException(status_code=404, detail="Lot not found")
    
    # Fetch related stages
    lot["stitching"] = await db.stitching_stages.find_one({"lot_id": lot_id}, {"_id": 0})
    lot["bartack"] = await db.bartack_stages.find_one({"lot_id": lot_id}, {"_id": 0})
    lot["washing"] = await db.washing_stages.find_one({"lot_id": lot_id}, {"_id": 0})
    
    return lot

@api_router.put("/lots/{lot_id}")
async def update_lot(lot_id: str, lot: LotUpdate):
    existing = await db.lots.find_one({"id": lot_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Lot not found")
    
    update_data = {k: v for k, v in lot.model_dump().items() if v is not None}
    
    # Recalculate if rolls or pcs changed
    if "rolls" in update_data or "total_pcs_cut" in update_data:
        rolls = update_data.get("rolls", existing.get("rolls", []))
        total_pcs = update_data.get("total_pcs_cut", existing.get("total_pcs_cut", 0))
        price = update_data.get("fabric_price_per_meter_or_kg", existing.get("fabric_price_per_meter_or_kg", 0))
        
        if isinstance(rolls[0], dict) if rolls else False:
            total_meters = sum(r.get("meters_or_kgs", 0) for r in rolls)
        else:
            total_meters = sum(r.meters_or_kgs for r in rolls)
        
        avg_fabric = total_meters / total_pcs if total_pcs > 0 else 0
        fabric_cost = avg_fabric * price
        
        update_data["total_meters_or_kgs_used"] = total_meters
        update_data["avg_fabric_used_per_pc"] = round(avg_fabric, 4)
        update_data["fabric_cost_per_pc"] = round(fabric_cost, 2)
        
        if "rolls" in update_data:
            update_data["rolls"] = [r.model_dump() if hasattr(r, 'model_dump') else r for r in update_data["rolls"]]
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.lots.update_one({"id": lot_id}, {"$set": update_data})
    
    updated = await db.lots.find_one({"id": lot_id}, {"_id": 0})
    return updated

@api_router.delete("/lots/{lot_id}")
async def delete_lot(lot_id: str):
    result = await db.lots.delete_one({"id": lot_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Lot not found")
    
    # Delete related stages
    await db.stitching_stages.delete_many({"lot_id": lot_id})
    await db.bartack_stages.delete_many({"lot_id": lot_id})
    await db.washing_stages.delete_many({"lot_id": lot_id})
    await db.challans.delete_many({"lot_id": lot_id})
    
    return {"message": "Lot and related data deleted"}

# ==================== BULK OPERATIONS ====================

class BulkDeleteRequest(BaseModel):
    lot_ids: List[str]

class BulkStatusRequest(BaseModel):
    lot_ids: List[str]
    status: str

class BulkStageRequest(BaseModel):
    lot_ids: List[str]
    stage: str

@api_router.post("/lots/bulk-delete")
async def bulk_delete_lots(request: BulkDeleteRequest, authorization: str = Header(None)):
    await get_current_user(authorization)
    
    if not request.lot_ids:
        raise HTTPException(status_code=400, detail="No lot IDs provided")
    
    deleted_count = 0
    for lot_id in request.lot_ids:
        result = await db.lots.delete_one({"id": lot_id})
        if result.deleted_count > 0:
            deleted_count += 1
            # Delete related data
            await db.stitching_stages.delete_many({"lot_id": lot_id})
            await db.bartack_stages.delete_many({"lot_id": lot_id})
            await db.washing_stages.delete_many({"lot_id": lot_id})
            await db.challans.delete_many({"lot_id": lot_id})
    
    return {"message": f"Deleted {deleted_count} lots", "deleted_count": deleted_count}

@api_router.post("/lots/bulk-status")
async def bulk_update_status(request: BulkStatusRequest, authorization: str = Header(None)):
    await get_current_user(authorization)
    
    if not request.lot_ids:
        raise HTTPException(status_code=400, detail="No lot IDs provided")
    
    valid_statuses = ["Pending", "In Progress", "Completed", "Delayed"]
    if request.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    
    result = await db.lots.update_many(
        {"id": {"$in": request.lot_ids}},
        {"$set": {
            "overall_status": request.status,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"message": f"Updated {result.modified_count} lots", "updated_count": result.modified_count}

@api_router.post("/lots/bulk-stage")
async def bulk_update_stage(request: BulkStageRequest, authorization: str = Header(None)):
    await get_current_user(authorization)
    
    if not request.lot_ids:
        raise HTTPException(status_code=400, detail="No lot IDs provided")
    
    valid_stages = ["Cutting", "Stitching", "Bartack", "Washing/Dyeing", "Completed"]
    if request.stage not in valid_stages:
        raise HTTPException(status_code=400, detail=f"Invalid stage. Must be one of: {valid_stages}")
    
    # Determine status based on stage
    if request.stage == "Completed":
        status = "Completed"
    elif request.stage == "Cutting":
        status = "Pending"
    else:
        status = "In Progress"
    
    result = await db.lots.update_many(
        {"id": {"$in": request.lot_ids}},
        {"$set": {
            "current_stage": request.stage,
            "overall_status": status,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"message": f"Updated {result.modified_count} lots", "updated_count": result.modified_count}

class StageUpdateRequest(BaseModel):
    stage: str

@api_router.put("/lots/{lot_id}/stage")
async def update_lot_stage(lot_id: str, request: StageUpdateRequest):
    """Update lot stage directly (for Kanban drag-and-drop)"""
    existing = await db.lots.find_one({"id": lot_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Lot not found")
    
    valid_stages = ["Cutting", "Stitching", "Bartack", "Washing/Dyeing", "Completed"]
    if request.stage not in valid_stages:
        raise HTTPException(status_code=400, detail=f"Invalid stage. Must be one of: {valid_stages}")
    
    # Determine status based on stage
    if request.stage == "Completed":
        status = "Completed"
    elif request.stage == "Cutting":
        status = "Pending"
    else:
        status = "In Progress"
    
    await db.lots.update_one(
        {"id": lot_id},
        {"$set": {
            "current_stage": request.stage,
            "overall_status": status,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    updated = await db.lots.find_one({"id": lot_id}, {"_id": 0})
    return updated

# ==================== STITCHING ROUTES ====================

async def get_next_stitching_challan_no():
    last = await db.challans.find({"challan_type": "Stitching"}).sort("challan_number", -1).limit(1).to_list(1)
    if not last:
        return "ST-001"
    last_num = int(last[0]["challan_number"].split("-")[1])
    return f"ST-{str(last_num + 1).zfill(3)}"

@api_router.post("/stitching")
async def create_stitching_stage(stage: StitchingStageCreate):
    lot = await db.lots.find_one({"id": stage.lot_id})
    if not lot:
        raise HTTPException(status_code=404, detail="Lot not found")
    
    existing = await db.stitching_stages.find_one({"lot_id": stage.lot_id})
    if existing:
        raise HTTPException(status_code=400, detail="Stitching stage already exists for this lot")
    
    challan_no = await get_next_stitching_challan_no()
    
    stage_doc = {
        "id": str(uuid.uuid4()),
        "lot_id": stage.lot_id,
        "stitching_fabricator_name": stage.stitching_fabricator_name,
        "lot_issue_date_to_stitching": stage.lot_issue_date_to_stitching,
        "stitching_challan_no": challan_no,
        "receive_date_from_stitching": None,
        "pcs_received_back_from_stitching": None,
        "stitching_notes": stage.stitching_notes,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.stitching_stages.insert_one(stage_doc)
    
    # Create challan record
    challan_doc = {
        "challan_id": str(uuid.uuid4()),
        "challan_type": "Stitching",
        "challan_number": challan_no,
        "lot_id": stage.lot_id,
        "stage": "Stitching",
        "issue_date": stage.lot_issue_date_to_stitching,
        "recipient_name": stage.stitching_fabricator_name,
        "pcs_issued": lot.get("total_pcs_cut", 0),
        "notes_printed": stage.stitching_notes,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.challans.insert_one(challan_doc)
    
    # Update lot stage
    await db.lots.update_one(
        {"id": stage.lot_id},
        {"$set": {"current_stage": "Stitching", "overall_status": "In Progress"}}
    )
    
    stage_doc.pop("_id", None)
    return stage_doc

@api_router.put("/stitching/{lot_id}")
async def update_stitching_stage(lot_id: str, stage: StitchingStageUpdate):
    existing = await db.stitching_stages.find_one({"lot_id": lot_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Stitching stage not found")
    
    update_data = {k: v for k, v in stage.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.stitching_stages.update_one({"lot_id": lot_id}, {"$set": update_data})
    
    # If received, check if should move to Bartack
    if stage.receive_date_from_stitching and stage.pcs_received_back_from_stitching:
        await db.lots.update_one(
            {"id": lot_id},
            {"$set": {"current_stage": "Bartack"}}
        )
    
    updated = await db.stitching_stages.find_one({"lot_id": lot_id}, {"_id": 0})
    return updated

# ==================== BARTACK ROUTES ====================

@api_router.post("/bartack")
async def create_bartack_stage(stage: BartackStageCreate):
    lot = await db.lots.find_one({"id": stage.lot_id})
    if not lot:
        raise HTTPException(status_code=404, detail="Lot not found")
    
    existing = await db.bartack_stages.find_one({"lot_id": stage.lot_id})
    if existing:
        raise HTTPException(status_code=400, detail="Bartack stage already exists for this lot")
    
    stage_doc = {
        "id": str(uuid.uuid4()),
        "lot_id": stage.lot_id,
        "bartack_person_name": stage.bartack_person_name,
        "lot_issue_to_bartack_date": stage.lot_issue_to_bartack_date,
        "pcs_issued_to_bartack": stage.pcs_issued_to_bartack,
        "bartack_notes": stage.bartack_notes,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.bartack_stages.insert_one(stage_doc)
    
    # Update lot stage
    await db.lots.update_one(
        {"id": stage.lot_id},
        {"$set": {"current_stage": "Bartack"}}
    )
    
    stage_doc.pop("_id", None)
    return stage_doc

@api_router.put("/bartack/{lot_id}")
async def update_bartack_stage(lot_id: str, stage: BartackStageUpdate):
    existing = await db.bartack_stages.find_one({"lot_id": lot_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Bartack stage not found")
    
    update_data = {k: v for k, v in stage.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.bartack_stages.update_one({"lot_id": lot_id}, {"$set": update_data})
    
    updated = await db.bartack_stages.find_one({"lot_id": lot_id}, {"_id": 0})
    return updated

# ==================== WASHING/DYEING ROUTES ====================

async def get_next_washing_challan_no():
    last = await db.challans.find({"challan_type": "Washing"}).sort("challan_number", -1).limit(1).to_list(1)
    if not last:
        return "W-001"
    last_num = int(last[0]["challan_number"].split("-")[1])
    return f"W-{str(last_num + 1).zfill(3)}"

@api_router.post("/washing")
async def create_washing_stage(stage: WashingStageCreate):
    lot = await db.lots.find_one({"id": stage.lot_id})
    if not lot:
        raise HTTPException(status_code=404, detail="Lot not found")
    
    existing = await db.washing_stages.find_one({"lot_id": stage.lot_id})
    if existing:
        raise HTTPException(status_code=400, detail="Washing stage already exists for this lot")
    
    # Get bartack person name for the challan
    bartack = await db.bartack_stages.find_one({"lot_id": stage.lot_id})
    bartack_person = bartack.get("bartack_person_name", "") if bartack else ""
    
    challan_no = await get_next_washing_challan_no()
    
    stage_doc = {
        "id": str(uuid.uuid4()),
        "lot_id": stage.lot_id,
        "dyeing_person_firm_name": stage.dyeing_person_firm_name,
        "lot_issue_date_to_washing": stage.lot_issue_date_to_washing,
        "washing_challan_no": challan_no,
        "pcs_issued_to_washing": stage.pcs_issued_to_washing,
        "receive_date_from_washing": None,
        "pcs_received_back_from_washing": None,
        "washing_notes": stage.washing_notes,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.washing_stages.insert_one(stage_doc)
    
    # Create challan record with bartack person
    challan_doc = {
        "challan_id": str(uuid.uuid4()),
        "challan_type": "Washing",
        "challan_number": challan_no,
        "lot_id": stage.lot_id,
        "stage": "Washing",
        "issue_date": stage.lot_issue_date_to_washing,
        "recipient_name": stage.dyeing_person_firm_name,
        "pcs_issued": stage.pcs_issued_to_washing,
        "notes_printed": stage.washing_notes,
        "bartack_person_name": bartack_person,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.challans.insert_one(challan_doc)
    
    # Update lot stage
    await db.lots.update_one(
        {"id": stage.lot_id},
        {"$set": {"current_stage": "Washing/Dyeing"}}
    )
    
    stage_doc.pop("_id", None)
    return stage_doc

@api_router.put("/washing/{lot_id}")
async def update_washing_stage(lot_id: str, stage: WashingStageUpdate):
    existing = await db.washing_stages.find_one({"lot_id": lot_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Washing stage not found")
    
    update_data = {k: v for k, v in stage.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.washing_stages.update_one({"lot_id": lot_id}, {"$set": update_data})
    
    # If received, mark as completed
    if stage.receive_date_from_washing and stage.pcs_received_back_from_washing:
        await db.lots.update_one(
            {"id": lot_id},
            {"$set": {"current_stage": "Completed", "overall_status": "Completed"}}
        )
    
    updated = await db.washing_stages.find_one({"lot_id": lot_id}, {"_id": 0})
    return updated

# ==================== CHALLAN ROUTES ====================

@api_router.get("/challans")
async def get_challans(challan_type: str = None, lot_id: str = None):
    query = {}
    if challan_type:
        query["challan_type"] = challan_type
    if lot_id:
        query["lot_id"] = lot_id
    
    challans = await db.challans.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    if not challans:
        return challans
    
    # Batch fetch lot data using $in operator (optimized - avoids N+1 queries)
    lot_ids = list(set([c.get("lot_id") for c in challans if c.get("lot_id")]))
    lots_list = await db.lots.find({"id": {"$in": lot_ids}}, {"_id": 0, "id": 1, "lot_no": 1}).to_list(1000)
    lots_map = {lot["id"]: lot for lot in lots_list}
    
    # Map lot data to challans
    for challan in challans:
        challan["lot"] = lots_map.get(challan.get("lot_id"))
    
    return challans

@api_router.get("/challans/{challan_id}")
async def get_challan(challan_id: str):
    challan = await db.challans.find_one({"challan_id": challan_id}, {"_id": 0})
    if not challan:
        raise HTTPException(status_code=404, detail="Challan not found")
    
    # Get lot details
    lot = await db.lots.find_one({"id": challan["lot_id"]}, {"_id": 0})
    challan["lot"] = lot
    
    return challan

# ==================== EXCEL IMPORT/EXPORT ====================

@api_router.post("/import/excel")
async def import_excel(file: UploadFile = File(...)):
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Only Excel files are allowed")
    
    contents = await file.read()
    df = pd.read_excel(io.BytesIO(contents))
    
    imported_count = 0
    updated_count = 0
    errors = []
    
    for idx, row in df.iterrows():
        try:
            lot_no = str(row.get('Lot No', row.get('LOT NO', row.get('lot_no', ''))))
            if not lot_no or pd.isna(lot_no):
                continue
            
            # Check if lot exists
            existing = await db.lots.find_one({"lot_no": lot_no})
            
            # Parse dates safely
            def parse_date(val):
                if pd.isna(val) or val == '' or val is None:
                    return None
                if isinstance(val, datetime):
                    return val.strftime('%Y-%m-%d')
                if isinstance(val, date):
                    return val.strftime('%Y-%m-%d')
                try:
                    # Try parsing string dates
                    parsed = pd.to_datetime(val)
                    return parsed.strftime('%Y-%m-%d')
                except:
                    return str(val)
            
            # Safe int conversion
            def safe_int(val, default=0):
                if pd.isna(val) or val == '' or val is None:
                    return default
                try:
                    return int(float(val))
                except:
                    return default
            
            lot_data = {
                "lot_no": lot_no,
                "cutting_date": parse_date(row.get('DATE', row.get('Date', row.get('cutting_date', '')))),
                "gender": "",
                "sizes": str(row.get('SIZE', row.get('Size', row.get('sizes', '')))).strip() if not pd.isna(row.get('SIZE', row.get('Size', ''))) else "",
                "style": str(row.get('STYLE', row.get('Style', ''))).strip() if not pd.isna(row.get('STYLE', row.get('Style', ''))) else "",
                "fabric_name": str(row.get('FABRIC', row.get('Fabric', row.get('fabric_name', '')))).strip() if not pd.isna(row.get('FABRIC', row.get('Fabric', ''))) else "",
                "fabric_grade": "Fresh",
                "dyeing_or_washing_instructions": "",
                "rolls": [],
                "total_meters_or_kgs_used": 0,
                "total_pcs_cut": safe_int(row.get('PCS', row.get('Pcs', row.get('total_pcs_cut', 0)))),
                "avg_fabric_used_per_pc": 0,
                "fabric_price_per_meter_or_kg": 0,
                "fabric_cost_per_pc": 0,
                "cutting_notes": "",
                "current_stage": "Cutting",
                "overall_status": "Pending",
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            
            if existing:
                # Update existing lot
                await db.lots.update_one({"lot_no": lot_no}, {"$set": lot_data})
                updated_count += 1
                lot_id = existing["id"]
            else:
                # Create new lot
                lot_data["id"] = str(uuid.uuid4())
                lot_data["created_at"] = datetime.now(timezone.utc).isoformat()
                await db.lots.insert_one(lot_data)
                imported_count += 1
                lot_id = lot_data["id"]
            
            # Import stitching data - matching your Excel columns exactly
            # Your columns: 'STITCHING ', 'LOT ISSUE DATE', 'CHALLAN NO', 'RECEIVE DATE FROM STITCHING ', 'RECEIVED BACK NO OF PCS'
            stitch_fabricator = row.get('STITCHING ', row.get('STITCHING', row.get('Stitching fabricator', '')))
            stitch_issue_date = parse_date(row.get('LOT ISSUE DATE', row.get('Lot issue date to stitching', '')))
            stitch_challan = row.get('CHALLAN NO', row.get('Stitching challan no', ''))
            stitch_receive_date = parse_date(row.get('RECEIVE DATE FROM STITCHING ', row.get('RECEIVE DATE FROM STITCHING', row.get('Receive date from stitching', ''))))
            stitch_pcs_received = safe_int(row.get('RECEIVED BACK NO OF PCS', row.get('Pcs received from stitching', 0)), None)
            
            if stitch_fabricator and not pd.isna(stitch_fabricator) and str(stitch_fabricator).strip():
                existing_stitch = await db.stitching_stages.find_one({"lot_id": lot_id})
                
                # Generate challan number if not provided
                challan_no = str(stitch_challan).strip() if stitch_challan and not pd.isna(stitch_challan) else None
                if not challan_no:
                    challan_no = await get_next_stitching_challan_no()
                elif not challan_no.startswith('ST-'):
                    challan_no = f"ST-{challan_no.zfill(3)}"
                
                stitch_data = {
                    "lot_id": lot_id,
                    "stitching_fabricator_name": str(stitch_fabricator).strip(),
                    "lot_issue_date_to_stitching": stitch_issue_date,
                    "stitching_challan_no": challan_no,
                    "receive_date_from_stitching": stitch_receive_date,
                    "pcs_received_back_from_stitching": stitch_pcs_received,
                    "stitching_notes": "",
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
                
                if existing_stitch:
                    await db.stitching_stages.update_one({"lot_id": lot_id}, {"$set": stitch_data})
                else:
                    stitch_data["id"] = str(uuid.uuid4())
                    stitch_data["created_at"] = datetime.now(timezone.utc).isoformat()
                    await db.stitching_stages.insert_one(stitch_data)
                
                lot_data["current_stage"] = "Stitching"
                lot_data["overall_status"] = "In Progress"
            
            # Import bartack data - matching your Excel columns
            # Your columns: 'LOT ISSUE TO BARTACK DATE', 'BARTACK FABRICATOR NAME', 'NO OF PCS ISSUED TO BARTACK PERSON'
            bartack_person = row.get('BARTACK FABRICATOR NAME', row.get('Bartack person name', ''))
            bartack_date = parse_date(row.get('LOT ISSUE TO BARTACK DATE', row.get('Lot issue to bartack date', '')))
            bartack_pcs = safe_int(row.get('NO OF PCS ISSUED TO BARTACK PERSON', row.get('Pcs issued to bartack', 0)))
            
            if bartack_person and not pd.isna(bartack_person) and str(bartack_person).strip():
                existing_bartack = await db.bartack_stages.find_one({"lot_id": lot_id})
                bartack_data = {
                    "lot_id": lot_id,
                    "bartack_person_name": str(bartack_person).strip(),
                    "lot_issue_to_bartack_date": bartack_date,
                    "pcs_issued_to_bartack": bartack_pcs,
                    "bartack_notes": "",
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
                
                if existing_bartack:
                    await db.bartack_stages.update_one({"lot_id": lot_id}, {"$set": bartack_data})
                else:
                    bartack_data["id"] = str(uuid.uuid4())
                    bartack_data["created_at"] = datetime.now(timezone.utc).isoformat()
                    await db.bartack_stages.insert_one(bartack_data)
                
                lot_data["current_stage"] = "Bartack"
            
            # Import washing data - matching your Excel columns
            # Your columns: 'WASHING/DYEING PERSON FIRM NAME', 'LOT ISSUE DATE.1', 'CHALLAN NO.1', 'PCS.1', 'RECEIVE DATE FROM DYEING ', 'PCS RCVD BACK FROM DYEING'
            washing_firm = row.get('WASHING/DYEING PERSON FIRM NAME', row.get('Washing/dyeing firm name', ''))
            washing_issue_date = parse_date(row.get('LOT ISSUE DATE.1', row.get('Lot issue date to washing', '')))
            washing_challan = row.get('CHALLAN NO.1', row.get('Washing challan no', ''))
            washing_pcs = safe_int(row.get('PCS.1', row.get('Pcs issued to washing', 0)))
            washing_receive_date = parse_date(row.get('RECEIVE DATE FROM DYEING ', row.get('RECEIVE DATE FROM DYEING', row.get('Receive date from washing', ''))))
            washing_pcs_received = safe_int(row.get('PCS RCVD BACK FROM DYEING', row.get('Pcs received from washing', 0)), None)
            
            if washing_firm and not pd.isna(washing_firm) and str(washing_firm).strip():
                existing_washing = await db.washing_stages.find_one({"lot_id": lot_id})
                
                # Generate challan number if not provided
                w_challan_no = str(washing_challan).strip() if washing_challan and not pd.isna(washing_challan) else None
                if not w_challan_no:
                    w_challan_no = await get_next_washing_challan_no()
                elif not w_challan_no.startswith('W-'):
                    w_challan_no = f"W-{w_challan_no.zfill(3)}"
                
                washing_data = {
                    "lot_id": lot_id,
                    "dyeing_person_firm_name": str(washing_firm).strip(),
                    "lot_issue_date_to_washing": washing_issue_date,
                    "washing_challan_no": w_challan_no,
                    "pcs_issued_to_washing": washing_pcs,
                    "receive_date_from_washing": washing_receive_date,
                    "pcs_received_back_from_washing": washing_pcs_received,
                    "washing_notes": "",
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
                
                if existing_washing:
                    await db.washing_stages.update_one({"lot_id": lot_id}, {"$set": washing_data})
                else:
                    washing_data["id"] = str(uuid.uuid4())
                    washing_data["created_at"] = datetime.now(timezone.utc).isoformat()
                    await db.washing_stages.insert_one(washing_data)
                
                lot_data["current_stage"] = "Washing/Dyeing"
                
                # Check if completed
                if washing_data.get("receive_date_from_washing") and washing_data.get("pcs_received_back_from_washing"):
                    lot_data["current_stage"] = "Completed"
                    lot_data["overall_status"] = "Completed"
            
            # Update lot stage
            await db.lots.update_one({"id": lot_id}, {"$set": {"current_stage": lot_data["current_stage"], "overall_status": lot_data["overall_status"]}})
            
        except Exception as e:
            errors.append(f"Row {idx + 2}: {str(e)}")
    
    return {
        "message": "Import completed",
        "imported": imported_count,
        "updated": updated_count,
        "errors": errors
    }

@api_router.get("/export/excel")
async def export_excel():
    lots = await db.lots.find({}, {"_id": 0}).to_list(1000)
    
    if not lots:
        df = pd.DataFrame([])
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Production Data')
        output.seek(0)
        return StreamingResponse(
            output,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=fabverse_export.xlsx"}
        )
    
    # Batch fetch all stage data using $in operator (optimized - avoids N+1 queries)
    lot_ids = [lot["id"] for lot in lots]
    
    stitching_list = await db.stitching_stages.find({"lot_id": {"$in": lot_ids}}, {"_id": 0}).to_list(1000)
    stitching_map = {s["lot_id"]: s for s in stitching_list}
    
    bartack_list = await db.bartack_stages.find({"lot_id": {"$in": lot_ids}}, {"_id": 0}).to_list(1000)
    bartack_map = {b["lot_id"]: b for b in bartack_list}
    
    washing_list = await db.washing_stages.find({"lot_id": {"$in": lot_ids}}, {"_id": 0}).to_list(1000)
    washing_map = {w["lot_id"]: w for w in washing_list}
    
    export_data = []
    for lot in lots:
        lot_id = lot["id"]
        stitching = stitching_map.get(lot_id)
        bartack = bartack_map.get(lot_id)
        washing = washing_map.get(lot_id)
        
        # Match your Excel format exactly
        row = {
            "DATE": lot.get("cutting_date", ""),
            "LOT NO": lot.get("lot_no", ""),
            "PCS": lot.get("total_pcs_cut", 0),
            "SIZE": lot.get("sizes", ""),
            "FABRIC": lot.get("fabric_name", ""),
            "STYLE": lot.get("style", ""),
            "STITCHING ": stitching.get("stitching_fabricator_name", "") if stitching else "",
            "LOT ISSUE DATE": stitching.get("lot_issue_date_to_stitching", "") if stitching else "",
            "CHALLAN NO": stitching.get("stitching_challan_no", "") if stitching else "",
            "RECEIVE DATE FROM STITCHING ": stitching.get("receive_date_from_stitching", "") if stitching else "",
            "RECEIVED BACK NO OF PCS": stitching.get("pcs_received_back_from_stitching", "") if stitching else "",
            "LOT ISSUE TO BARTACK DATE": bartack.get("lot_issue_to_bartack_date", "") if bartack else "",
            "BARTACK FABRICATOR NAME": bartack.get("bartack_person_name", "") if bartack else "",
            "NO OF PCS ISSUED TO BARTACK PERSON": bartack.get("pcs_issued_to_bartack", "") if bartack else "",
            "WASHING/DYEING PERSON FIRM NAME": washing.get("dyeing_person_firm_name", "") if washing else "",
            "LOT ISSUE DATE.1": washing.get("lot_issue_date_to_washing", "") if washing else "",
            "CHALLAN NO.1": washing.get("washing_challan_no", "") if washing else "",
            "PCS.1": washing.get("pcs_issued_to_washing", "") if washing else "",
            "RECEIVE DATE FROM DYEING ": washing.get("receive_date_from_washing", "") if washing else "",
            "PCS RCVD BACK FROM DYEING": washing.get("pcs_received_back_from_washing", "") if washing else "",
        }
        export_data.append(row)
    
    df = pd.DataFrame(export_data)
    
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Production Data')
    output.seek(0)
    
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=fabverse_export.xlsx"}
    )

# ==================== REPORTS ====================

@api_router.get("/reports/summary")
async def get_reports_summary():
    # Lots by stage
    pipeline_stage = [
        {"$group": {"_id": "$current_stage", "count": {"$sum": 1}}}
    ]
    stage_counts = await db.lots.aggregate(pipeline_stage).to_list(100)
    
    # Lots by status
    pipeline_status = [
        {"$group": {"_id": "$overall_status", "count": {"$sum": 1}}}
    ]
    status_counts = await db.lots.aggregate(pipeline_status).to_list(100)
    
    # Total lots
    total_lots = await db.lots.count_documents({})
    
    # Total pcs
    pipeline_pcs = [
        {"$group": {"_id": None, "total": {"$sum": "$total_pcs_cut"}}}
    ]
    total_pcs_result = await db.lots.aggregate(pipeline_pcs).to_list(1)
    total_pcs = total_pcs_result[0]["total"] if total_pcs_result else 0
    
    # Fabric usage by type - with normalization
    pipeline_fabric = [
        {"$project": {
            "normalized_fabric": {"$trim": {"input": {"$toUpper": "$fabric_name"}}},
            "total_meters_or_kgs_used": 1,
            "fabric_price_per_meter_or_kg": 1
        }},
        {"$group": {
            "_id": "$normalized_fabric", 
            "total_meters": {"$sum": "$total_meters_or_kgs_used"}, 
            "total_cost": {"$sum": {"$multiply": ["$total_meters_or_kgs_used", "$fabric_price_per_meter_or_kg"]}}
        }}
    ]
    fabric_usage = await db.lots.aggregate(pipeline_fabric).to_list(100)
    
    # Stitching fabricator load - with normalization to handle trailing spaces
    pipeline_stitch = [
        {"$project": {"normalized_name": {"$trim": {"input": {"$toUpper": "$stitching_fabricator_name"}}}}},
        {"$group": {"_id": "$normalized_name", "count": {"$sum": 1}}}
    ]
    stitch_load = await db.stitching_stages.aggregate(pipeline_stitch).to_list(100)
    
    # Washing firm load - with normalization to handle trailing spaces
    pipeline_wash = [
        {"$project": {"normalized_name": {"$trim": {"input": {"$toUpper": "$dyeing_person_firm_name"}}}}},
        {"$group": {"_id": "$normalized_name", "count": {"$sum": 1}}}
    ]
    wash_load = await db.washing_stages.aggregate(pipeline_wash).to_list(100)
    
    return {
        "total_lots": total_lots,
        "total_pcs": total_pcs,
        "by_stage": {item["_id"]: item["count"] for item in stage_counts if item["_id"]},
        "by_status": {item["_id"]: item["count"] for item in status_counts if item["_id"]},
        "fabric_usage": [{"fabric": item["_id"], "meters": item["total_meters"], "cost": item["total_cost"]} for item in fabric_usage if item["_id"]],
        "stitching_load": [{"fabricator": item["_id"], "lots": item["count"]} for item in stitch_load if item["_id"]],
        "washing_load": [{"firm": item["_id"], "lots": item["count"]} for item in wash_load if item["_id"]]
    }

@api_router.get("/reports/export")
async def export_reports():
    # Get all the report data
    
    # Lots by stage
    pipeline_stage = [
        {"$group": {"_id": "$current_stage", "count": {"$sum": 1}}}
    ]
    stage_counts = await db.lots.aggregate(pipeline_stage).to_list(100)
    
    # Lots by status
    pipeline_status = [
        {"$group": {"_id": "$overall_status", "count": {"$sum": 1}}}
    ]
    status_counts = await db.lots.aggregate(pipeline_status).to_list(100)
    
    # Fabric usage
    pipeline_fabric = [
        {"$group": {"_id": "$fabric_name", "total_meters": {"$sum": "$total_meters_or_kgs_used"}, "total_cost": {"$sum": {"$multiply": ["$total_meters_or_kgs_used", "$fabric_price_per_meter_or_kg"]}}}}
    ]
    fabric_usage = await db.lots.aggregate(pipeline_fabric).to_list(100)
    
    # Stitching load
    pipeline_stitch = [
        {"$group": {"_id": "$stitching_fabricator_name", "count": {"$sum": 1}}}
    ]
    stitch_load = await db.stitching_stages.aggregate(pipeline_stitch).to_list(100)
    
    # Washing load
    pipeline_wash = [
        {"$group": {"_id": "$dyeing_person_firm_name", "count": {"$sum": 1}}}
    ]
    wash_load = await db.washing_stages.aggregate(pipeline_wash).to_list(100)
    
    # Create Excel workbook with multiple sheets
    output = io.BytesIO()
    
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        # Summary sheet
        summary_data = {
            "Metric": ["Total Lots", "Total Pieces"],
            "Value": [
                await db.lots.count_documents({}),
                sum([lot.get("total_pcs_cut", 0) async for lot in db.lots.find({}, {"total_pcs_cut": 1})])
            ]
        }
        pd.DataFrame(summary_data).to_excel(writer, sheet_name='Summary', index=False)
        
        # Lots by Stage
        if stage_counts:
            stage_df = pd.DataFrame([{"Stage": item["_id"], "Count": item["count"]} for item in stage_counts if item["_id"]])
            stage_df.to_excel(writer, sheet_name='Lots by Stage', index=False)
        
        # Lots by Status
        if status_counts:
            status_df = pd.DataFrame([{"Status": item["_id"], "Count": item["count"]} for item in status_counts if item["_id"]])
            status_df.to_excel(writer, sheet_name='Lots by Status', index=False)
        
        # Fabric Usage
        if fabric_usage:
            fabric_df = pd.DataFrame([{
                "Fabric": item["_id"], 
                "Total Meters/Kgs": round(item["total_meters"], 2), 
                "Total Cost (₹)": round(item["total_cost"], 2)
            } for item in fabric_usage if item["_id"]])
            fabric_df.to_excel(writer, sheet_name='Fabric Usage', index=False)
        
        # Stitching Load
        if stitch_load:
            stitch_df = pd.DataFrame([{"Fabricator": item["_id"], "Lots Count": item["count"]} for item in stitch_load if item["_id"]])
            stitch_df.to_excel(writer, sheet_name='Stitching Load', index=False)
        
        # Washing Load
        if wash_load:
            wash_df = pd.DataFrame([{"Washing Firm": item["_id"], "Lots Count": item["count"]} for item in wash_load if item["_id"]])
            wash_df.to_excel(writer, sheet_name='Washing Load', index=False)
    
    output.seek(0)
    
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=fabverse_reports_{datetime.now().strftime('%Y%m%d')}.xlsx"}
    )

# ==================== DASHBOARD STATS ====================

@api_router.get("/dashboard/stats")
async def get_dashboard_stats():
    total_lots = await db.lots.count_documents({})
    pending = await db.lots.count_documents({"overall_status": "Pending"})
    in_progress = await db.lots.count_documents({"overall_status": "In Progress"})
    completed = await db.lots.count_documents({"overall_status": "Completed"})
    
    # Recent lots
    recent = await db.lots.find({}, {"_id": 0}).sort("created_at", -1).limit(5).to_list(5)
    
    return {
        "total_lots": total_lots,
        "pending": pending,
        "in_progress": in_progress,
        "completed": completed,
        "recent_lots": recent
    }

# ==================== TURNAROUND TIME & DELAYED LOTS ====================

@api_router.get("/reports/turnaround")
async def get_turnaround_times():
    """Calculate average turnaround times between stages"""
    
    # Get all lots with stage data
    lots = await db.lots.find({}, {"_id": 0}).to_list(1000)
    
    if not lots:
        return {
            "cutting_to_stitching": {"average_days": 0, "sample_size": 0},
            "stitching_to_bartack": {"average_days": 0, "sample_size": 0},
            "bartack_to_washing": {"average_days": 0, "sample_size": 0},
            "washing_to_complete": {"average_days": 0, "sample_size": 0},
            "total_turnaround": {"average_days": 0, "sample_size": 0}
        }
    
    # Batch fetch all stage data (optimized - avoids N+1 queries)
    lot_ids = [lot["id"] for lot in lots]
    
    stitching_list = await db.stitching_stages.find({"lot_id": {"$in": lot_ids}}, {"_id": 0}).to_list(1000)
    stitching_map = {s["lot_id"]: s for s in stitching_list}
    
    bartack_list = await db.bartack_stages.find({"lot_id": {"$in": lot_ids}}, {"_id": 0}).to_list(1000)
    bartack_map = {b["lot_id"]: b for b in bartack_list}
    
    washing_list = await db.washing_stages.find({"lot_id": {"$in": lot_ids}}, {"_id": 0}).to_list(1000)
    washing_map = {w["lot_id"]: w for w in washing_list}
    
    # Calculate turnaround times
    cutting_to_stitching = []
    stitching_to_bartack = []
    bartack_to_washing = []
    washing_to_complete = []
    total_turnaround = []
    
    for lot in lots:
        lot_id = lot["id"]
        cutting_date = lot.get("cutting_date")
        
        # Get stage data from maps
        stitching = stitching_map.get(lot_id)
        bartack = bartack_map.get(lot_id)
        washing = washing_map.get(lot_id)
        
        try:
            if cutting_date and stitching and stitching.get("lot_issue_date_to_stitching"):
                days = (datetime.fromisoformat(stitching["lot_issue_date_to_stitching"]) - 
                       datetime.fromisoformat(cutting_date)).days
                if days >= 0:
                    cutting_to_stitching.append(days)
            
            if stitching and stitching.get("receive_date_from_stitching") and bartack and bartack.get("lot_issue_to_bartack_date"):
                days = (datetime.fromisoformat(bartack["lot_issue_to_bartack_date"]) - 
                       datetime.fromisoformat(stitching["receive_date_from_stitching"])).days
                if days >= 0:
                    stitching_to_bartack.append(days)
            
            if bartack and bartack.get("lot_issue_to_bartack_date") and washing and washing.get("lot_issue_date_to_washing"):
                days = (datetime.fromisoformat(washing["lot_issue_date_to_washing"]) - 
                       datetime.fromisoformat(bartack["lot_issue_to_bartack_date"])).days
                if days >= 0:
                    bartack_to_washing.append(days)
            
            if washing and washing.get("lot_issue_date_to_washing") and washing.get("receive_date_from_washing"):
                days = (datetime.fromisoformat(washing["receive_date_from_washing"]) - 
                       datetime.fromisoformat(washing["lot_issue_date_to_washing"])).days
                if days >= 0:
                    washing_to_complete.append(days)
            
            # Total turnaround (cutting to completion)
            if cutting_date and washing and washing.get("receive_date_from_washing"):
                days = (datetime.fromisoformat(washing["receive_date_from_washing"]) - 
                       datetime.fromisoformat(cutting_date)).days
                if days >= 0:
                    total_turnaround.append(days)
        except Exception:
            continue
    
    return {
        "cutting_to_stitching": {
            "average_days": round(sum(cutting_to_stitching) / len(cutting_to_stitching), 1) if cutting_to_stitching else 0,
            "sample_size": len(cutting_to_stitching)
        },
        "stitching_to_bartack": {
            "average_days": round(sum(stitching_to_bartack) / len(stitching_to_bartack), 1) if stitching_to_bartack else 0,
            "sample_size": len(stitching_to_bartack)
        },
        "bartack_to_washing": {
            "average_days": round(sum(bartack_to_washing) / len(bartack_to_washing), 1) if bartack_to_washing else 0,
            "sample_size": len(bartack_to_washing)
        },
        "washing_to_complete": {
            "average_days": round(sum(washing_to_complete) / len(washing_to_complete), 1) if washing_to_complete else 0,
            "sample_size": len(washing_to_complete)
        },
        "total_turnaround": {
            "average_days": round(sum(total_turnaround) / len(total_turnaround), 1) if total_turnaround else 0,
            "sample_size": len(total_turnaround)
        }
    }

@api_router.get("/reports/delayed")
async def get_delayed_lots(days_threshold: int = 7):
    """Get lots that have been stuck in a stage for more than threshold days"""
    
    today = datetime.now(timezone.utc).date()
    delayed_lots = []
    
    lots = await db.lots.find(
        {"overall_status": {"$ne": "Completed"}},
        {"_id": 0}
    ).to_list(1000)
    
    if not lots:
        return delayed_lots
    
    # Batch fetch all stage data (optimized - avoids N+1 queries)
    lot_ids = [lot["id"] for lot in lots]
    
    stitching_list = await db.stitching_stages.find({"lot_id": {"$in": lot_ids}}, {"_id": 0}).to_list(1000)
    stitching_map = {s["lot_id"]: s for s in stitching_list}
    
    bartack_list = await db.bartack_stages.find({"lot_id": {"$in": lot_ids}}, {"_id": 0}).to_list(1000)
    bartack_map = {b["lot_id"]: b for b in bartack_list}
    
    washing_list = await db.washing_stages.find({"lot_id": {"$in": lot_ids}}, {"_id": 0}).to_list(1000)
    washing_map = {w["lot_id"]: w for w in washing_list}
    
    for lot in lots:
        lot_id = lot["id"]
        current_stage = lot.get("current_stage", "Cutting")
        days_in_stage = 0
        stage_start_date = None
        
        try:
            if current_stage == "Cutting":
                if lot.get("cutting_date"):
                    stage_start_date = datetime.fromisoformat(lot["cutting_date"]).date()
            
            elif current_stage == "Stitching":
                stitching = stitching_map.get(lot_id)
                if stitching and stitching.get("lot_issue_date_to_stitching"):
                    stage_start_date = datetime.fromisoformat(stitching["lot_issue_date_to_stitching"]).date()
            
            elif current_stage == "Bartack":
                bartack = bartack_map.get(lot_id)
                if bartack and bartack.get("lot_issue_to_bartack_date"):
                    stage_start_date = datetime.fromisoformat(bartack["lot_issue_to_bartack_date"]).date()
            
            elif current_stage == "Washing/Dyeing":
                washing = washing_map.get(lot_id)
                if washing and washing.get("lot_issue_date_to_washing"):
                    stage_start_date = datetime.fromisoformat(washing["lot_issue_date_to_washing"]).date()
            
            if stage_start_date:
                days_in_stage = (today - stage_start_date).days
                
                if days_in_stage >= days_threshold:
                    delayed_lots.append({
                        "id": lot["id"],
                        "lot_no": lot.get("lot_no"),
                        "style": lot.get("style"),
                        "fabric_name": lot.get("fabric_name"),
                        "total_pcs_cut": lot.get("total_pcs_cut"),
                        "current_stage": current_stage,
                        "days_in_stage": days_in_stage,
                        "stage_start_date": stage_start_date.isoformat()
                    })
        except Exception:
            continue
    
    # Sort by days_in_stage descending
    delayed_lots.sort(key=lambda x: x["days_in_stage"], reverse=True)
    
    return {
        "threshold_days": days_threshold,
        "total_delayed": len(delayed_lots),
        "delayed_lots": delayed_lots
    }

# ==================== ROOT ====================

@api_router.get("/")
async def root():
    return {"message": "FABVERSE ERP API", "version": "1.0.0"}

@api_router.get("/health")
async def health():
    return {"status": "healthy"}

# Include router and middleware
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    await init_admin()
    logger.info("FABVERSE ERP API started")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
