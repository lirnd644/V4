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
    successful_predictions: int = 0
    referral_code: str
    referred_by: Optional[str] = None
    referral_count: int = 0
    referral_earnings: int = 0
    created_at: datetime
    last_bonus_claim: Optional[datetime] = None
    # User settings
    theme: str = "dark"
    language: str = "ru"
    notifications_enabled: bool = True
    preferred_currency: str = "USD"

class Session(BaseModel):
    session_token: str
    user_id: str
    expires_at: datetime
    created_at: datetime

class BinaryPrediction(BaseModel):
    id: str
    user_id: str
    symbol: str
    direction: str  # "UP" or "DOWN"
    timeframe: str  # "1m", "5m", "15m", "30m", "1h", "4h", "1d"
    entry_price: float
    entry_time: datetime
    expiry_time: datetime
    stake_amount: int  # Number of free predictions used (1 for normal, 2 for high stakes)
    confidence_score: float
    status: str = "ACTIVE"  # "ACTIVE", "WON", "LOST", "EXPIRED"
    result_price: Optional[float] = None
    created_at: datetime
    is_free: bool = True

class InvestmentRecommendation(BaseModel):
    id: str
    symbol: str
    recommendation_type: str  # "BUY", "SELL", "HOLD"
    confidence: float
    target_price: float
    stop_loss: float
    timeframe: str
    reason: str
    created_at: datetime
    accuracy_rating: float

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

# Extended crypto data with all major cryptocurrencies
CRYPTO_LIST = [
    "bitcoin", "ethereum", "binancecoin", "cardano", "solana", "polkadot", "dogecoin", 
    "avalanche-2", "chainlink", "polygon", "litecoin", "bitcoin-cash", "ethereum-classic",
    "stellar", "vechain", "tron", "cosmos", "algorand", "tezos", "monero", "dash",
    "zcash", "decred", "qtum", "icon", "ontology", "neo", "waves", "stratis",
    "ripple", "eos", "iota", "nem", "omisego", "basic-attention-token", "0x",
    "zilliqa", "enjincoin", "maker", "compound", "aave", "uniswap", "sushiswap",
    "pancakeswap-token", "1inch", "yearn-finance", "curve-dao-token", "synthetix",
    "uma", "balancer", "kyber-network-crystal", "loopring", "bancor", "ren",
    "storj", "filecoin", "siacoin", "arweave", "ocean-protocol", "nucypher",
    "the-graph", "livepeer", "audius", "theta-token", "helium", "holo",
    "flow", "near", "harmony", "fantom", "celo", "elrond-erd-2", "terra-luna",
    "thorchain", "secret", "kava", "band-protocol", "injective-protocol",
    "serum", "raydium", "orca", "marinade", "step-finance", "star-atlas",
    "gensokishi-metaverse", "shiba-inu", "pepe", "floki", "baby-doge-coin",
    "safemoon", "bonk", "wojak", "meme", "doge-killer"
]

# Currency pairs and conversion rates
CURRENCY_RATES = {
    "USD": 1.0,
    "RUB": 92.5,
    "EUR": 0.85,
    "GBP": 0.73,
    "JPY": 110.0,
    "CNY": 6.4,
    "KRW": 1200.0,
    "INR": 74.5
}

@app.get("/api/crypto/prices")
async def get_crypto_prices(currency: str = "USD", limit: int = 50):
    """Get current crypto prices with support for multiple currencies"""
    
    # Comprehensive mock data for all major cryptocurrencies
    mock_crypto_data = [
        {"id": "bitcoin", "symbol": "BTC", "name": "Bitcoin", "current_price": 45230.50, "price_change_percentage_24h": 2.85, "volume_24h": 15420000000, "market_cap": 890000000000, "icon": "bitcoin"},
        {"id": "ethereum", "symbol": "ETH", "name": "Ethereum", "current_price": 2845.75, "price_change_percentage_24h": -2.91, "volume_24h": 8230000000, "market_cap": 342000000000, "icon": "ethereum"},
        {"id": "binancecoin", "symbol": "BNB", "name": "BNB", "current_price": 312.40, "price_change_percentage_24h": 4.27, "volume_24h": 1250000000, "market_cap": 46800000000, "icon": "binancecoin"},
        {"id": "cardano", "symbol": "ADA", "name": "Cardano", "current_price": 0.485, "price_change_percentage_24h": 6.13, "volume_24h": 420000000, "market_cap": 17200000000, "icon": "cardano"},
        {"id": "solana", "symbol": "SOL", "name": "Solana", "current_price": 98.75, "price_change_percentage_24h": -3.38, "volume_24h": 1850000000, "market_cap": 45600000000, "icon": "solana"},
        {"id": "polkadot", "symbol": "DOT", "name": "Polkadot", "current_price": 15.85, "price_change_percentage_24h": 1.25, "volume_24h": 380000000, "market_cap": 18500000000, "icon": "polkadot"},
        {"id": "dogecoin", "symbol": "DOGE", "name": "Dogecoin", "current_price": 0.085, "price_change_percentage_24h": 8.45, "volume_24h": 850000000, "market_cap": 12000000000, "icon": "dogecoin"},
        {"id": "avalanche-2", "symbol": "AVAX", "name": "Avalanche", "current_price": 28.50, "price_change_percentage_24h": -1.85, "volume_24h": 680000000, "market_cap": 11500000000, "icon": "avalanche-2"},
        {"id": "chainlink", "symbol": "LINK", "name": "Chainlink", "current_price": 18.75, "price_change_percentage_24h": 3.25, "volume_24h": 485000000, "market_cap": 10800000000, "icon": "chainlink"},
        {"id": "polygon", "symbol": "MATIC", "name": "Polygon", "current_price": 0.95, "price_change_percentage_24h": 5.85, "volume_24h": 425000000, "market_cap": 9200000000, "icon": "polygon"},
        {"id": "litecoin", "symbol": "LTC", "name": "Litecoin", "current_price": 85.40, "price_change_percentage_24h": 2.15, "volume_24h": 380000000, "market_cap": 6400000000, "icon": "litecoin"},
        {"id": "bitcoin-cash", "symbol": "BCH", "name": "Bitcoin Cash", "current_price": 285.50, "price_change_percentage_24h": 1.85, "volume_24h": 185000000, "market_cap": 5600000000, "icon": "bitcoin-cash"},
        {"id": "stellar", "symbol": "XLM", "name": "Stellar", "current_price": 0.125, "price_change_percentage_24h": 4.25, "volume_24h": 125000000, "market_cap": 3200000000, "icon": "stellar"},
        {"id": "vechain", "symbol": "VET", "name": "VeChain", "current_price": 0.045, "price_change_percentage_24h": 6.85, "volume_24h": 85000000, "market_cap": 3100000000, "icon": "vechain"},
        {"id": "tron", "symbol": "TRX", "name": "TRON", "current_price": 0.085, "price_change_percentage_24h": 3.45, "volume_24h": 485000000, "market_cap": 7800000000, "icon": "tron"},
        {"id": "cosmos", "symbol": "ATOM", "name": "Cosmos", "current_price": 12.85, "price_change_percentage_24h": 2.85, "volume_24h": 185000000, "market_cap": 3800000000, "icon": "cosmos"},
        {"id": "algorand", "symbol": "ALGO", "name": "Algorand", "current_price": 0.285, "price_change_percentage_24h": 4.85, "volume_24h": 125000000, "market_cap": 2200000000, "icon": "algorand"},
        {"id": "tezos", "symbol": "XTZ", "name": "Tezos", "current_price": 1.85, "price_change_percentage_24h": 1.85, "volume_24h": 85000000, "market_cap": 1800000000, "icon": "tezos"},
        {"id": "monero", "symbol": "XMR", "name": "Monero", "current_price": 165.50, "price_change_percentage_24h": -0.85, "volume_24h": 125000000, "market_cap": 3000000000, "icon": "monero"},
        {"id": "ripple", "symbol": "XRP", "name": "XRP", "current_price": 0.58, "price_change_percentage_24h": 2.45, "volume_24h": 1200000000, "market_cap": 32000000000, "icon": "ripple"},
        {"id": "shiba-inu", "symbol": "SHIB", "name": "Shiba Inu", "current_price": 0.0000085, "price_change_percentage_24h": 12.85, "volume_24h": 485000000, "market_cap": 5000000000, "icon": "shiba-inu"},
        {"id": "pepe", "symbol": "PEPE", "name": "Pepe", "current_price": 0.00000125, "price_change_percentage_24h": 25.85, "volume_24h": 285000000, "market_cap": 580000000, "icon": "pepe"},
        {"id": "uniswap", "symbol": "UNI", "name": "Uniswap", "current_price": 8.85, "price_change_percentage_24h": 3.85, "volume_24h": 185000000, "market_cap": 6800000000, "icon": "uniswap"},
        {"id": "aave", "symbol": "AAVE", "name": "Aave", "current_price": 125.50, "price_change_percentage_24h": 2.25, "volume_24h": 125000000, "market_cap": 1800000000, "icon": "aave"},
        {"id": "maker", "symbol": "MKR", "name": "Maker", "current_price": 1285.50, "price_change_percentage_24h": 1.85, "volume_24h": 85000000, "market_cap": 1200000000, "icon": "maker"}
    ]
    
    
    # Convert prices to requested currency
    currency_rate = CURRENCY_RATES.get(currency.upper(), 1.0)
    
    # Add more cryptocurrencies to mock data and apply currency conversion
    for crypto in mock_crypto_data[:limit]:
        crypto["current_price"] *= currency_rate
        crypto["volume_24h"] *= currency_rate
        crypto["market_cap"] *= currency_rate
        crypto["currency"] = currency.upper()
        crypto["last_updated"] = datetime.utcnow()
        
        # Add icon URL
        crypto["icon_url"] = f"https://assets.coingecko.com/coins/images/{crypto['icon']}/large/{crypto['icon']}.png"
    
    try:
        # Try to get real data from CoinGecko API
        coins_param = ",".join(CRYPTO_LIST[:limit])
        async with aiohttp.ClientSession() as session:
            url = f"https://api.coingecko.com/api/v3/coins/markets?vs_currency={currency.lower()}&ids={coins_param}&order=market_cap_desc&per_page={limit}&page=1&sparkline=false"
            async with session.get(url, timeout=aiohttp.ClientTimeout(total=5)) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    real_crypto_data = []
                    
                    for coin in data:
                        crypto_info = {
                            "id": coin.get("id"),
                            "symbol": coin.get("symbol", "").upper(),
                            "name": coin.get("name", ""),
                            "current_price": coin.get("current_price", 0),
                            "price_change_percentage_24h": coin.get("price_change_percentage_24h", 0),
                            "volume_24h": coin.get("total_volume", 0),
                            "market_cap": coin.get("market_cap", 0),
                            "currency": currency.upper(),
                            "icon_url": coin.get("image", ""),
                            "last_updated": datetime.utcnow()
                        }
                        real_crypto_data.append(crypto_info)
                    
                    return real_crypto_data
                else:
                    return mock_crypto_data[:limit]
    except Exception as e:
        return mock_crypto_data[:limit]

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

# Binary Options Predictions endpoints
@app.get("/api/binary-predictions")
async def get_binary_predictions(user: User = Depends(get_current_user)):
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    predictions = await db.binary_predictions.find({"user_id": user.id}).sort("created_at", -1).to_list(100)
    
    # Convert ObjectId to string and handle datetime serialization
    for prediction in predictions:
        if "_id" in prediction:
            del prediction["_id"]
        if "created_at" in prediction and isinstance(prediction["created_at"], datetime):
            prediction["created_at"] = prediction["created_at"].isoformat()
        if "entry_time" in prediction and isinstance(prediction["entry_time"], datetime):
            prediction["entry_time"] = prediction["entry_time"].isoformat()
        if "expiry_time" in prediction and isinstance(prediction["expiry_time"], datetime):
            prediction["expiry_time"] = prediction["expiry_time"].isoformat()
    
    return predictions

@app.post("/api/binary-predictions")
async def create_binary_prediction(
    request: Request,
    user: User = Depends(get_current_user)
):
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    if user.free_predictions <= 0:
        raise HTTPException(status_code=400, detail="No free predictions remaining")
    
    data = await request.json()
    symbol = data.get("symbol")
    direction = data.get("direction")  # "UP" or "DOWN"
    timeframe = data.get("timeframe")  # "1m", "5m", "15m", etc.
    stake_amount = int(data.get("stake_amount", 1))  # How many predictions to stake
    
    if stake_amount > user.free_predictions:
        raise HTTPException(status_code=400, detail="Insufficient free predictions")
    
    # Get current price for the symbol
    current_price = await get_current_price_for_symbol(symbol, user.preferred_currency)
    
    # Calculate expiry time based on timeframe
    timeframes = {
        "1m": 1, "5m": 5, "15m": 15, "30m": 30,
        "1h": 60, "4h": 240, "1d": 1440
    }
    expiry_minutes = timeframes.get(timeframe, 5)
    
    now = datetime.utcnow()
    expiry_time = now + timedelta(minutes=expiry_minutes)
    
    # Calculate confidence score based on market conditions (mock calculation)
    confidence_score = calculate_prediction_confidence(symbol, direction, timeframe)
    
    prediction_data = {
        "id": str(uuid.uuid4()),
        "user_id": user.id,
        "symbol": symbol,
        "direction": direction,
        "timeframe": timeframe,
        "entry_price": current_price,
        "entry_time": now,
        "expiry_time": expiry_time,
        "stake_amount": stake_amount,
        "confidence_score": confidence_score,
        "status": "ACTIVE",
        "result_price": None,
        "created_at": now,
        "is_free": True
    }
    
    await db.binary_predictions.insert_one(prediction_data)
    
    # Update user's free predictions count
    await db.users.update_one(
        {"id": user.id},
        {
            "$inc": {"free_predictions": -stake_amount, "total_predictions_used": 1}
        }
    )
    
    # Clean response data
    if "_id" in prediction_data:
        del prediction_data["_id"]
    prediction_data["created_at"] = prediction_data["created_at"].isoformat()
    prediction_data["entry_time"] = prediction_data["entry_time"].isoformat()
    prediction_data["expiry_time"] = prediction_data["expiry_time"].isoformat()
    
    return prediction_data

@app.get("/api/investment-recommendations")
async def get_investment_recommendations(currency: str = "USD", limit: int = 10):
    """Get AI-powered investment recommendations"""
    
    # Mock investment recommendations with high accuracy
    recommendations = [
        {
            "id": str(uuid.uuid4()),
            "symbol": "BTC",
            "recommendation_type": "BUY",
            "confidence": 85.5,
            "target_price": 48000,
            "stop_loss": 42000,
            "timeframe": "1-3 months",
            "reason": "Институциональная поддержка растет, техническая картина позитивная",
            "accuracy_rating": 78.5,
            "created_at": datetime.utcnow().isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "symbol": "ETH",
            "recommendation_type": "BUY",
            "confidence": 82.3,
            "target_price": 3200,
            "stop_loss": 2600,
            "timeframe": "2-4 weeks",
            "reason": "Предстоящие обновления сети, рост DeFi активности",
            "accuracy_rating": 76.2,
            "created_at": datetime.utcnow().isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "symbol": "SOL",
            "recommendation_type": "HOLD",
            "confidence": 71.8,
            "target_price": 110,
            "stop_loss": 85,
            "timeframe": "1-2 months",
            "reason": "Хорошие фундаментальные показатели, но краткосрочная неопределенность",
            "accuracy_rating": 73.1,
            "created_at": datetime.utcnow().isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "symbol": "ADA",
            "recommendation_type": "BUY",
            "confidence": 79.2,
            "target_price": 0.65,
            "stop_loss": 0.40,
            "timeframe": "3-6 months",
            "reason": "Развитие экосистемы, увеличение числа dApps",
            "accuracy_rating": 74.8,
            "created_at": datetime.utcnow().isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "symbol": "DOT",
            "recommendation_type": "BUY",
            "confidence": 75.6,
            "target_price": 22,
            "stop_loss": 12,
            "timeframe": "2-4 months",
            "reason": "Парачейн аукционы показывают активность экосистемы",
            "accuracy_rating": 72.3,
            "created_at": datetime.utcnow().isoformat()
        }
    ]
    
    return recommendations[:limit]

# User Settings endpoints
@app.get("/api/user/settings")
async def get_user_settings(user: User = Depends(get_current_user)):
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    return {
        "theme": user.theme,
        "language": user.language,
        "notifications_enabled": user.notifications_enabled,
        "preferred_currency": user.preferred_currency
    }

@app.put("/api/user/settings")
async def update_user_settings(
    request: Request,
    user: User = Depends(get_current_user)
):
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    data = await request.json()
    
    update_data = {}
    if "theme" in data:
        update_data["theme"] = data["theme"]
    if "language" in data:
        update_data["language"] = data["language"]
    if "notifications_enabled" in data:
        update_data["notifications_enabled"] = data["notifications_enabled"]
    if "preferred_currency" in data:
        update_data["preferred_currency"] = data["preferred_currency"]
    
    await db.users.update_one(
        {"id": user.id},
        {"$set": update_data}
    )
    
    return {"message": "Settings updated successfully"}

@app.get("/api/currencies")
async def get_supported_currencies():
    """Get list of supported currencies"""
    return {
        "currencies": [
            {"code": "USD", "name": "US Dollar", "symbol": "$"},
            {"code": "RUB", "name": "Russian Ruble", "symbol": "₽"},
            {"code": "EUR", "name": "Euro", "symbol": "€"},
            {"code": "GBP", "name": "British Pound", "symbol": "£"},
            {"code": "JPY", "name": "Japanese Yen", "symbol": "¥"},
            {"code": "CNY", "name": "Chinese Yuan", "symbol": "¥"},
            {"code": "KRW", "name": "South Korean Won", "symbol": "₩"},
            {"code": "INR", "name": "Indian Rupee", "symbol": "₹"}
        ]
    }

# Helper functions
async def get_current_price_for_symbol(symbol: str, currency: str = "USD"):
    """Get current price for a specific symbol"""
    try:
        async with aiohttp.ClientSession() as session:
            symbol_map = {
                "BTC": "bitcoin", "ETH": "ethereum", "BNB": "binancecoin",
                "ADA": "cardano", "SOL": "solana", "DOT": "polkadot",
                "DOGE": "dogecoin", "AVAX": "avalanche-2", "LINK": "chainlink",
                "MATIC": "polygon"
            }
            coin_id = symbol_map.get(symbol.upper(), symbol.lower())
            
            url = f"https://api.coingecko.com/api/v3/simple/price?ids={coin_id}&vs_currencies={currency.lower()}"
            async with session.get(url, timeout=aiohttp.ClientTimeout(total=3)) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    return data[coin_id][currency.lower()]
    except:
        pass
    
    # Fallback mock prices
    mock_prices = {
        "BTC": 45230.50, "ETH": 2845.75, "BNB": 312.40, "ADA": 0.485,
        "SOL": 98.75, "DOT": 15.85, "DOGE": 0.085, "AVAX": 28.50,
        "LINK": 18.75, "MATIC": 0.95
    }
    base_price = mock_prices.get(symbol.upper(), 100.0)
    currency_rate = CURRENCY_RATES.get(currency.upper(), 1.0)
    return base_price * currency_rate

def calculate_prediction_confidence(symbol: str, direction: str, timeframe: str):
    """Calculate prediction confidence based on market analysis (mock)"""
    import random
    
    # Base confidence varies by symbol volatility
    base_confidence = {
        "BTC": 75.0, "ETH": 73.0, "BNB": 70.0, "ADA": 68.0, "SOL": 65.0,
        "DOT": 67.0, "DOGE": 60.0, "AVAX": 66.0, "LINK": 69.0, "MATIC": 68.0
    }
    
    confidence = base_confidence.get(symbol, 65.0)
    
    # Adjust for timeframe (shorter = lower confidence)
    timeframe_multipliers = {
        "1m": 0.85, "5m": 0.90, "15m": 0.95, "30m": 1.0,
        "1h": 1.05, "4h": 1.10, "1d": 1.15
    }
    
    confidence *= timeframe_multipliers.get(timeframe, 1.0)
    
    # Add some randomness
    confidence += random.uniform(-5, 5)
    
    return round(min(95, max(55, confidence)), 1)

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
    
    # Clean the response data for JSON serialization
    if "_id" in prediction_data:
        del prediction_data["_id"]
    if "created_at" in prediction_data:
        prediction_data["created_at"] = prediction_data["created_at"].isoformat()
    
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