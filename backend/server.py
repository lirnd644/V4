import os
import uuid
import requests
from datetime import datetime, timedelta
from typing import Optional, List
from fastapi import FastAPI, HTTPException, Request, Response, Cookie, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr
import asyncio
import aiohttp
import json
from dotenv import load_dotenv
from bson import ObjectId

load_dotenv()

# Custom JSON encoder to handle ObjectId
def custom_json_encoder(obj):
    if isinstance(obj, ObjectId):
        return str(obj)
    if isinstance(obj, datetime):
        return obj.isoformat()
    raise TypeError

app = FastAPI(title="CripteX API", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL')
client = AsyncIOMotorClient(MONGO_URL)
db = client.criptex

# Models
class User(BaseModel):
    id: str
    email: str
    name: str
    picture: str
    free_predictions: int = 5
    total_predictions_used: int = 0
    referral_code: str
    referred_by: Optional[str] = None
    referral_count: int = 0
    referral_earnings: int = 0
    created_at: datetime
    last_bonus_claim: Optional[datetime] = None

class Session(BaseModel):
    session_token: str
    user_id: str
    expires_at: datetime
    created_at: datetime

class Prediction(BaseModel):
    id: str
    user_id: str
    symbol: str
    prediction_type: str  # "bullish", "bearish"
    timeframe: str  # "5m", "15m", "1h", "4h", "1d"
    confidence: float
    entry_price: float
    target_price: float
    stop_loss: float
    created_at: datetime
    is_free: bool

class CryptoData(BaseModel):
    symbol: str
    current_price: float
    price_change_24h: float
    price_change_percentage_24h: float
    volume_24h: float
    market_cap: float
    last_updated: datetime

# Dependency to get current user
async def get_current_user(request: Request, session_token: Optional[str] = Cookie(None)) -> Optional[User]:
    token = session_token
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
    
    if not token:
        return None
    
    session = await db.sessions.find_one({"session_token": token})
    if not session or session["expires_at"] < datetime.utcnow():
        return None
    
    user = await db.users.find_one({"id": session["user_id"]})
    return User(**user) if user else None

# Authentication endpoints
@app.post("/api/auth/session")
async def create_session(request: Request, response: Response):
    data = await request.json()
    session_id = data.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="Session ID required")
    
    # Call Emergent auth API
    headers = {"X-Session-ID": session_id}
    async with aiohttp.ClientSession() as session:
        async with session.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers=headers
        ) as resp:
            if resp.status != 200:
                raise HTTPException(status_code=401, detail="Invalid session")
            
            auth_data = await resp.json()
    
    # Check if user exists, if not create new user
    existing_user = await db.users.find_one({"email": auth_data["email"]})
    
    if not existing_user:
        # Generate referral code
        referral_code = str(uuid.uuid4())[:8].upper()
        
        user_data = {
            "id": auth_data["id"],
            "email": auth_data["email"],
            "name": auth_data["name"],
            "picture": auth_data["picture"],
            "free_predictions": 5,
            "total_predictions_used": 0,
            "referral_code": referral_code,
            "referred_by": None,
            "referral_count": 0,
            "referral_earnings": 0,
            "created_at": datetime.utcnow(),
            "last_bonus_claim": None
        }
        await db.users.insert_one(user_data)
        user = User(**user_data)
    else:
        user = User(**existing_user)
    
    # Create session
    session_token = auth_data["session_token"]
    session_data = {
        "session_token": session_token,
        "user_id": user.id,
        "expires_at": datetime.utcnow() + timedelta(days=7),
        "created_at": datetime.utcnow()
    }
    await db.sessions.insert_one(session_data)
    
    # Set session cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60  # 7 days
    )
    
    return {"user": user.dict(), "session_token": session_token}

@app.get("/api/auth/me")
async def get_me(user: User = Depends(get_current_user)):
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

@app.post("/api/auth/logout")
async def logout(response: Response, user: User = Depends(get_current_user)):
    if user:
        await db.sessions.delete_many({"user_id": user.id})
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out successfully"}

# Crypto data endpoints
@app.get("/api/crypto/prices")
async def get_crypto_prices():
    """Get current crypto prices from CoinGecko API with fallback to mock data"""
    
    # Mock data as fallback
    mock_crypto_data = [
        {
            "symbol": "BITCOIN",
            "current_price": 45230.50,
            "price_change_24h": 1250.30,
            "price_change_percentage_24h": 2.85,
            "volume_24h": 15420000000,
            "market_cap": 890000000000,
            "last_updated": datetime.utcnow()
        },
        {
            "symbol": "ETHEREUM",
            "current_price": 2845.75,
            "price_change_24h": -85.25,
            "price_change_percentage_24h": -2.91,
            "volume_24h": 8230000000,
            "market_cap": 342000000000,
            "last_updated": datetime.utcnow()
        },
        {
            "symbol": "BINANCECOIN",
            "current_price": 312.40,
            "price_change_24h": 12.80,
            "price_change_percentage_24h": 4.27,
            "volume_24h": 1250000000,
            "market_cap": 46800000000,
            "last_updated": datetime.utcnow()
        },
        {
            "symbol": "CARDANO",
            "current_price": 0.485,
            "price_change_24h": 0.028,
            "price_change_percentage_24h": 6.13,
            "volume_24h": 420000000,
            "market_cap": 17200000000,
            "last_updated": datetime.utcnow()
        },
        {
            "symbol": "SOLANA",
            "current_price": 98.75,
            "price_change_24h": -3.45,
            "price_change_percentage_24h": -3.38,
            "volume_24h": 1850000000,
            "market_cap": 45600000000,
            "last_updated": datetime.utcnow()
        }
    ]
    
    popular_coins = [
        "bitcoin", "ethereum", "binancecoin", "cardano", "solana", 
        "polkadot", "dogecoin", "avalanche-2", "chainlink", "polygon"
    ]
    
    try:
        async with aiohttp.ClientSession() as session:
            url = f"https://api.coingecko.com/api/v3/simple/price?ids={','.join(popular_coins)}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true"
            async with session.get(url, timeout=aiohttp.ClientTimeout(total=5)) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    crypto_data = []
                    
                    for coin_id, coin_data in data.items():
                        crypto_info = {
                            "symbol": coin_id.replace("-", "").upper(),
                            "current_price": coin_data.get("usd", 0),
                            "price_change_24h": coin_data.get("usd_24h_change", 0),
                            "price_change_percentage_24h": coin_data.get("usd_24h_change", 0),
                            "volume_24h": coin_data.get("usd_24h_vol", 0),
                            "market_cap": coin_data.get("usd_market_cap", 0),
                            "last_updated": datetime.utcnow()
                        }
                        crypto_data.append(crypto_info)
                    
                    return crypto_data
                else:
                    # Return mock data if API fails
                    return mock_crypto_data
    except Exception as e:
        # Return mock data if any exception occurs
        return mock_crypto_data

@app.get("/api/crypto/chart/{symbol}")
async def get_crypto_chart(symbol: str, timeframe: str = "1h"):
    """Get crypto chart data with fallback to mock data"""
    
    # Mock chart data as fallback
    mock_chart_data = {
        "prices": [[1705276800000, 45230.50], [1705280400000, 45485.20], [1705284000000, 45120.80]],
        "volumes": [[1705276800000, 1542000000], [1705280400000, 1623000000], [1705284000000, 1456000000]],
        "market_caps": [[1705276800000, 890000000000], [1705280400000, 892500000000], [1705284000000, 888700000000]]
    }
    
    coin_map = {
        "BITCOIN": "bitcoin",
        "ETHEREUM": "ethereum",
        "BINANCECOIN": "binancecoin",
        "CARDANO": "cardano",
        "SOLANA": "solana",
        "POLKADOT": "polkadot",
        "DOGECOIN": "dogecoin",
        "AVALANCHE2": "avalanche-2",
        "CHAINLINK": "chainlink",
        "POLYGON": "polygon"
    }
    
    coin_id = coin_map.get(symbol.upper(), symbol.lower())
    days = {"5m": 1, "15m": 1, "1h": 7, "4h": 30, "1d": 365}.get(timeframe, 7)
    
    try:
        async with aiohttp.ClientSession() as session:
            url = f"https://api.coingecko.com/api/v3/coins/{coin_id}/market_chart?vs_currency=usd&days={days}"
            async with session.get(url, timeout=aiohttp.ClientTimeout(total=5)) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    return {
                        "prices": data.get("prices", []),
                        "volumes": data.get("total_volumes", []),
                        "market_caps": data.get("market_caps", [])
                    }
                else:
                    return mock_chart_data
    except Exception as e:
        return mock_chart_data

# Predictions endpoints
@app.get("/api/predictions")
async def get_predictions(user: User = Depends(get_current_user)):
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    predictions = await db.predictions.find({"user_id": user.id}).sort("created_at", -1).to_list(100)
    
    # Convert ObjectId to string and handle datetime serialization
    for prediction in predictions:
        if "_id" in prediction:
            del prediction["_id"]  # Remove MongoDB _id field
        if "created_at" in prediction and isinstance(prediction["created_at"], datetime):
            prediction["created_at"] = prediction["created_at"].isoformat()
    
    return predictions

@app.post("/api/predictions")
async def create_prediction(
    request: Request,
    user: User = Depends(get_current_user)
):
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    if user.free_predictions <= 0:
        raise HTTPException(status_code=400, detail="No free predictions remaining")
    
    # Get request data
    data = await request.json()
    symbol = data.get("symbol")
    prediction_type = data.get("prediction_type")
    timeframe = data.get("timeframe")
    target_price = float(data.get("target_price"))
    stop_loss = float(data.get("stop_loss"))
    
    # Get current price (use mock data if API fails)
    current_price = 45230.50  # Default fallback
    try:
        coin_map = {
            "BITCOIN": "bitcoin",
            "ETHEREUM": "ethereum",
            "BINANCECOIN": "binancecoin"
        }
        coin_id = coin_map.get(symbol.upper(), symbol.lower())
        
        async with aiohttp.ClientSession() as session:
            url = f"https://api.coingecko.com/api/v3/simple/price?ids={coin_id}&vs_currencies=usd"
            async with session.get(url, timeout=aiohttp.ClientTimeout(total=3)) as resp:
                if resp.status == 200:
                    api_data = await resp.json()
                    current_price = api_data[coin_id]["usd"]
    except:
        # Use symbol-specific mock prices
        mock_prices = {
            "BITCOIN": 45230.50,
            "ETHEREUM": 2845.75,
            "BINANCECOIN": 312.40,
            "CARDANO": 0.485,
            "SOLANA": 98.75
        }
        current_price = mock_prices.get(symbol.upper(), 45230.50)
    
    # Create prediction
    prediction_data = {
        "id": str(uuid.uuid4()),
        "user_id": user.id,
        "symbol": symbol,
        "prediction_type": prediction_type,
        "timeframe": timeframe,
        "confidence": 75.5,  # Mock confidence
        "entry_price": current_price,
        "target_price": target_price,
        "stop_loss": stop_loss,
        "created_at": datetime.utcnow(),
        "is_free": True
    }
    
    await db.predictions.insert_one(prediction_data)
    
    # Update user's free predictions count
    await db.users.update_one(
        {"id": user.id},
        {
            "$inc": {"free_predictions": -1, "total_predictions_used": 1}
        }
    )
    
    return prediction_data

# Bonus and referral endpoints
@app.post("/api/bonus/claim")
async def claim_daily_bonus(user: User = Depends(get_current_user)):
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    now = datetime.utcnow()
    if user.last_bonus_claim and (now - user.last_bonus_claim).days < 1:
        raise HTTPException(status_code=400, detail="Bonus already claimed today")
    
    await db.users.update_one(
        {"id": user.id},
        {
            "$inc": {"free_predictions": 1},
            "$set": {"last_bonus_claim": now}
        }
    )
    
    return {"message": "Daily bonus claimed!", "free_predictions": user.free_predictions + 1}

@app.get("/api/referral/stats")
async def get_referral_stats(user: User = Depends(get_current_user)):
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    return {
        "referral_code": user.referral_code,
        "referral_count": user.referral_count,
        "referral_earnings": user.referral_earnings
    }

@app.post("/api/referral/use/{referral_code}")
async def use_referral_code(referral_code: str, user: User = Depends(get_current_user)):
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    if user.referred_by:
        raise HTTPException(status_code=400, detail="Referral code already used")
    
    # Find referrer
    referrer = await db.users.find_one({"referral_code": referral_code})
    if not referrer:
        raise HTTPException(status_code=404, detail="Invalid referral code")
    
    if referrer["id"] == user.id:
        raise HTTPException(status_code=400, detail="Cannot use your own referral code")
    
    # Update both users
    await db.users.update_one(
        {"id": user.id},
        {
            "$set": {"referred_by": referrer["id"]},
            "$inc": {"free_predictions": 1}
        }
    )
    
    await db.users.update_one(
        {"id": referrer["id"]},
        {
            "$inc": {"referral_count": 1, "referral_earnings": 1, "free_predictions": 1}
        }
    )
    
    return {"message": "Referral code applied successfully!", "bonus_predictions": 1}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)