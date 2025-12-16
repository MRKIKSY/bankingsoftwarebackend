# from fastapi import FastAPI, HTTPException, Depends
# from fastapi.security import OAuth2PasswordBearer
# from fastapi.middleware.cors import CORSMiddleware
# from sqlmodel import SQLModel, Field, Session, create_engine, select
# from passlib.context import CryptContext
# from jose import jwt, JWTError
# from pydantic import BaseModel
# from datetime import datetime, timedelta
# from typing import Optional

# # ================================================
# # CONFIG
# # ================================================
# SECRET_KEY = "CHANGE_THIS_SECRET"
# ALGORITHM = "HS256"
# ACCESS_TOKEN_EXPIRE_MINUTES = 60

# # Use sha256_crypt instead of bcrypt
# pwd_context = CryptContext(schemes=["sha256_crypt"], deprecated="auto")


# sqlite_file_name = "bank.db"
# engine = create_engine(
#     f"sqlite:///{sqlite_file_name}",
#     connect_args={"check_same_thread": False}
# )

# # ================================================
# # MODELS
# # ================================================
# class User(SQLModel, table=True):
#     id: Optional[int] = Field(default=None, primary_key=True)
#     username: str = Field(unique=True, index=True)
#     hashed_password: str
#     is_admin: bool = False
#     address: Optional[str] = None
#     created_at: datetime = Field(default_factory=datetime.utcnow)

# class Transaction(SQLModel, table=True):
#     id: Optional[int] = Field(default=None, primary_key=True)
#     user_id: int = Field(index=True)
#     type: str  # "credit" or "debit"
#     amount: float
#     description: Optional[str] = None
#     status: str = "completed"
#     created_at: datetime = Field(default_factory=datetime.utcnow)

# # ================================================
# # SCHEMAS
# # ================================================
# class Token(BaseModel):
#     access_token: str
#     token_type: str

# class LoginInput(BaseModel):
#     username: str
#     password: str

# class UserOut(BaseModel):
#     id: int
#     username: str
#     is_admin: bool
#     address: Optional[str]

# class WithdrawIn(BaseModel):
#     amount: float
#     description: Optional[str] = None

# class AdminCreditIn(BaseModel):
#     username: str
#     amount: float
#     description: Optional[str] = None

# # ================================================
# # UTILS
# # ================================================
# def create_db():
#     SQLModel.metadata.create_all(engine)

# def get_session():
#     with Session(engine) as session:
#         yield session

# def hash_password(p: str) -> str:
#     return pwd_context.hash(p)

# def verify_password(plain: str, hashed: str) -> bool:
#     return pwd_context.verify(plain, hashed)

# oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# def get_user_from_token(token: str = Depends(oauth2_scheme),
#                         session: Session = Depends(get_session)):

#     exc = HTTPException(status_code=401, detail="Invalid authentication")

#     try:
#         payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
#         username = payload.get("sub")
#         if not username:
#             raise exc
#     except JWTError:
#         raise exc

#     user = session.exec(select(User).where(User.username == username)).first()
#     if not user:
#         raise exc
#     return user

# def require_admin(current_user: User = Depends(get_user_from_token)):
#     if not current_user.is_admin:
#         raise HTTPException(status_code=403, detail="Admin privileges required")
#     return current_user

# def create_access_token(username: str):
#     data = {
#         "sub": username,
#         "exp": datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
#     }
#     return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)

# # ================================================
# # APP
# # ================================================
# app = FastAPI(title="Mock Banking API")

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://localhost:3000", "*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# @app.on_event("startup")
# def startup():
#     create_db()

# # ================================================
# # AUTH
# # ================================================
# @app.post("/auth/login", response_model=Token)
# def login(data: LoginInput, session: Session = Depends(get_session)):
#     user = session.exec(select(User).where(User.username == data.username)).first()
#     if not user or not verify_password(data.password, user.hashed_password):
#         raise HTTPException(status_code=400, detail="Invalid username/password")
#     token = create_access_token(user.username)
#     return Token(access_token=token, token_type="bearer")

# # ================================================
# # INIT DATABASE
# # ================================================
# @app.post("/init")
# def init(session: Session = Depends(get_session)):
#     if session.exec(select(User).where(User.username == "femi")).first():
#         return {"detail": "Already initialized"}

#     femi = User(
#         username="femi",
#         hashed_password=hash_password("femipass"),
#         is_admin=False,
#         address="8427 Lone Star Ridge, Arlington, TX 76017"
#     )

#     admin = User(
#         username="admin",
#         hashed_password=hash_password("adminpass"),
#         is_admin=True,
#         address="1020 Republic Dr, Austin, TX 78701"
#     )

#     session.add(femi)
#     session.add(admin)
#     session.commit()
#     return {"detail": "Users created: femi/femipass, admin/adminpass"}

# # ================================================
# # USER ENDPOINTS
# # ================================================
# @app.get("/me", response_model=UserOut)
# def me(current_user: User = Depends(get_user_from_token)):
#     return current_user

# @app.get("/transactions")
# def transactions(current_user: User = Depends(get_user_from_token),
#                  session: Session = Depends(get_session)):
#     tx = session.exec(
#         select(Transaction)
#         .where(Transaction.user_id == current_user.id)
#         .order_by(Transaction.created_at.desc())
#     ).all()
#     return tx

# @app.get("/balance")
# def balance(current_user: User = Depends(get_user_from_token),
#             session: Session = Depends(get_session)):
#     txs = session.exec(select(Transaction).where(Transaction.user_id == current_user.id)).all()
#     credits = sum(t.amount for t in txs if t.type == "credit")
#     debits = sum(t.amount for t in txs if t.type == "debit")
#     return {"balance": credits - debits, "total_credits": credits, "total_debits": debits}

# @app.post("/withdraw")
# def withdraw(data: WithdrawIn,
#              current_user: User = Depends(get_user_from_token),
#              session: Session = Depends(get_session)):
#     if data.amount <= 0:
#         raise HTTPException(400, "Amount must be positive")
#     txs = session.exec(select(Transaction).where(Transaction.user_id == current_user.id)).all()
#     credits = sum(t.amount for t in txs if t.type == "credit")
#     debits = sum(t.amount for t in txs if t.type == "debit")
#     if data.amount > (credits - debits):
#         raise HTTPException(400, "Insufficient funds")
#     new_tx = Transaction(
#         user_id=current_user.id,
#         type="debit",
#         amount=data.amount,
#         description=data.description or "Withdrawal"
#     )
#     session.add(new_tx)
#     session.commit()
#     return {"detail": "Withdrawal completed"}

# # ================================================
# # ADMIN ENDPOINTS
# # ================================================
# @app.post("/admin/credit")
# def admin_credit(data: AdminCreditIn,
#                  admin: User = Depends(require_admin),
#                  session: Session = Depends(get_session)):
#     user = session.exec(select(User).where(User.username == data.username)).first()
#     if not user:
#         raise HTTPException(404, "User not found")
#     if data.amount <= 0:
#         raise HTTPException(400, "Amount invalid")
#     tx = Transaction(
#         user_id=user.id,
#         type="credit",
#         amount=data.amount,
#         description=data.description or f"Admin credit by {admin.username}"
#     )
#     session.add(tx)
#     session.commit()
#     return {"detail": "Credit added"}




from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel, Field, Session, create_engine, select
from passlib.context import CryptContext
from jose import jwt, JWTError
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import Optional
import os

# ----------------- CONFIG -----------------
SECRET_KEY = "CHANGE_THIS_SECRET"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["sha256_crypt"], deprecated="auto")


DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL not set")

DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg2://")

engine = create_engine(
    DATABASE_URL,
    echo=True,
    pool_pre_ping=True
)


# ----------------- MODELS -----------------
class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(unique=True, index=True)
    hashed_password: str
    is_admin: bool = False
    address: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Transaction(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True)
    type: str  # credit / debit
    amount: float
    description: Optional[str] = None

    routing_number: Optional[str] = None
    account_number: Optional[str] = None
    check_number: Optional[str] = None
    reference: Optional[str] = None

    status: str = "pending"  # pending | completed | rejected
    created_at: datetime = Field(default_factory=datetime.utcnow)

# ----------------- SCHEMAS -----------------
class Token(BaseModel):
    access_token: str
    token_type: str

class LoginInput(BaseModel):
    username: str
    password: str

class UserOut(BaseModel):
    id: int
    username: str
    is_admin: bool
    address: Optional[str]

class WithdrawIn(BaseModel):
    amount: float
    routing_number: str
    account_number: str
    check_number: Optional[str] = None
    reference: Optional[str] = None

class AdminCreditIn(BaseModel):
    username: str
    amount: float
    description: Optional[str] = None

# ----------------- UTILS -----------------
def create_db():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session

def hash_password(p: str) -> str:
    return pwd_context.hash(p)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def get_user_from_token(token: str = Depends(oauth2_scheme),
                        session: Session = Depends(get_session)):

    exc = HTTPException(status_code=401, detail="Invalid authentication")

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if not username:
            raise exc
    except JWTError:
        raise exc

    user = session.exec(select(User).where(User.username == username)).first()
    if not user:
        raise exc
    return user

def require_admin(current_user: User = Depends(get_user_from_token)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin privileges required")
    return current_user

def create_access_token(username: str):
    data = {
        "sub": username,
        "exp": datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    }
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)

# ----------------- APP -----------------
app = FastAPI(title="Mock Banking API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup():
    create_db()

# ----------------- AUTH -----------------
@app.post("/auth/login", response_model=Token)
def login(data: LoginInput, session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.username == data.username)).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid username/password")
    token = create_access_token(user.username)
    return Token(access_token=token, token_type="bearer")

@app.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_user_from_token)):
    return current_user

# ----------------- INIT -----------------
@app.post("/init")
def init(session: Session = Depends(get_session)):
    if session.exec(select(User).where(User.username == "femi")).first():
        return {"detail": "Already initialized"}

    femi = User(
        username="femi",
        hashed_password=hash_password("femipass"),
        is_admin=False,
        address="8427 Lone Star Ridge, Arlington, TX 76017"
    )
    admin = User(
        username="admin",
        hashed_password=hash_password("adminpass"),
        is_admin=True,
        address="1020 Republic Dr, Austin, TX 78701"
    )

    session.add(femi)
    session.add(admin)
    session.commit()
    return {"detail": "Users created: femi/femipass, admin/adminpass"}

# ----------------- USER ENDPOINTS -----------------
@app.get("/transactions")
def transactions(current_user: User = Depends(get_user_from_token),
                 session: Session = Depends(get_session)):
    tx = session.exec(
        select(Transaction)
        .where(Transaction.user_id == current_user.id)
        .order_by(Transaction.created_at.desc())
    ).all()
    return tx

@app.get("/balance")
def balance(current_user: User = Depends(get_user_from_token),
            session: Session = Depends(get_session)):
    txs = session.exec(select(Transaction).where(Transaction.user_id == current_user.id)).all()
    credits = sum(t.amount for t in txs if t.type == "credit" and t.status == "completed")
    debits = sum(t.amount for t in txs if t.type == "debit" and t.status == "completed")
    return {"balance": credits - debits, "total_credits": credits, "total_debits": debits}

@app.post("/withdraw")
def withdraw(data: WithdrawIn,
             current_user: User = Depends(get_user_from_token),
             session: Session = Depends(get_session)):
    if data.amount <= 0:
        raise HTTPException(400, "Amount must be positive")

    txs = session.exec(
        select(Transaction).where(Transaction.user_id == current_user.id)
    ).all()
    credits = sum(t.amount for t in txs if t.type == "credit" and t.status == "completed")
    debits = sum(t.amount for t in txs if t.type == "debit" and t.status == "completed")

    if data.amount > (credits - debits):
        raise HTTPException(400, "Insufficient funds")

    # Use the reference input as the description
    new_tx = Transaction(
        user_id=current_user.id,
        type="debit",
        amount=data.amount,
        description=data.reference,  # <--- here
        routing_number=data.routing_number,
        account_number=data.account_number,
        check_number=data.check_number,
        reference=data.reference,
        status="pending"
    )
    session.add(new_tx)
    session.commit()
    return {"detail": "Withdrawal submitted for approval"}


# ----------------- ADMIN ENDPOINTS -----------------
@app.post("/admin/credit")
def admin_credit(data: AdminCreditIn,
                 admin: User = Depends(require_admin),
                 session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.username == data.username)).first()
    if not user:
        raise HTTPException(404, "User not found")
    if data.amount <= 0:
        raise HTTPException(400, "Amount invalid")
    tx = Transaction(
        user_id=user.id,
        type="credit",
        amount=data.amount,
        description=data.description or f"Admin credit by {admin.username}",
        status="completed"
    )
    session.add(tx)
    session.commit()
    return {"detail": "Credit added"}

# ----------------- ADMIN PENDING TRANSACTIONS -----------------
@app.get("/admin/pending")
def pending_transactions(admin: User = Depends(require_admin),
                         session: Session = Depends(get_session)):
    # Get all transactions with status = pending
    txs = session.exec(select(Transaction).where(Transaction.status == "pending")).all()
    return txs


@app.post("/admin/approve/{tx_id}")
def approve_tx(tx_id: int,
               admin: User = Depends(require_admin),
               session: Session = Depends(get_session)):
    tx = session.get(Transaction, tx_id)
    if not tx or tx.status != "pending":
        raise HTTPException(404, "Transaction not found or already processed")
    tx.status = "completed"
    session.add(tx)
    session.commit()
    return {"detail": "Transaction approved"}
