from pymongo import MongoClient
from dotenv import load_dotenv
import os

# ------------------------------------------------
# LOAD ENV
# ------------------------------------------------
load_dotenv()

# ------------------------------------------------
# MONGO URI
# ------------------------------------------------
MONGO_URI = os.getenv("MONGO_URI")

# ------------------------------------------------
# CONNECT
# ------------------------------------------------
client = MongoClient(MONGO_URI)

# ------------------------------------------------
# DATABASE
# ------------------------------------------------
db = client["krishiconnect"]

# ------------------------------------------------
# COLLECTIONS
# ------------------------------------------------
farmers_collection = db["farmers"]

scheme_collection = db["schemes"]

print("MongoDB Connected Successfully")