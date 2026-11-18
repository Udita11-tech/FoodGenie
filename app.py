from fastapi import FastAPI, Query, Body
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
import pickle
import re
import sqlite3
import uuid
from sklearn.metrics.pairwise import cosine_similarity

app = FastAPI(title="FoodGenie Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CSV_PATH = "cleaned_zomato.csv"
VECTORIZER_PATH = "tfidf_vectorizer.pkl"

df = pd.read_csv(CSV_PATH)

for col in ["name", "location", "cuisines", "dish_liked", "rest_type", "menu_item", "combined_text"]:
    if col in df.columns:
        df[col] = df[col].fillna("").astype(str)

df["rate"] = pd.to_numeric(df["rate"], errors="coerce").fillna(0)
df["approx_cost(for two people)"] = pd.to_numeric(
    df["approx_cost(for two people)"], errors="coerce"
).fillna(0)

with open(VECTORIZER_PATH, "rb") as f:
    tfidf = pickle.load(f)

tfidf_matrix = tfidf.transform(df["combined_text"])


def clean_records(records):
    clean = []
    for row in records:
        item = {}
        for k, v in row.items():
            if isinstance(v, float) and np.isnan(v):
                item[k] = None
            else:
                item[k] = v
        clean.append(item)
    return clean


def image_for(text):
    t = str(text).lower()
    if "biryani" in t:
        return "https://images.unsplash.com/photo-1563379091339-03246963d51a?auto=format&fit=crop&w=900&q=80"
    if "pizza" in t:
        return "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=900&q=80"
    if "burger" in t:
        return "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80"
    if "dosa" in t or "south indian" in t:
        return "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=900&q=80"
    if "dessert" in t or "cake" in t or "ice cream" in t:
        return "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=900&q=80"
    if "chinese" in t or "noodles" in t:
        return "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=900&q=80"
    if "healthy" in t or "salad" in t:
        return "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80"
    return "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80"


@app.get("/")
def home():
    return {"message": "FoodGenie backend running"}


@app.get("/recommend")
def recommend(
    query: str = Query("biryani"),
    max_price: int = Query(800),
    top_n: int = Query(12)
):
    query_lower = query.lower().strip()

    temp = df.copy()

    if max_price:
        temp = temp[temp["approx_cost(for two people)"] <= max_price]

    if temp.empty:
        temp = df.copy()

    query_vec = tfidf.transform([query_lower])
    temp_matrix = tfidf.transform(temp["combined_text"])
    similarity = cosine_similarity(query_vec, temp_matrix).flatten()

    temp = temp.copy()
    temp["similarity_score"] = similarity

    keywords = query_lower.split()

    def keyword_score(text):
        text = str(text).lower()
        return sum(1 for k in keywords if k in text)

    temp["keyword_score"] = temp["combined_text"].apply(keyword_score)
    temp["rating_score"] = temp["rate"] / 5

    temp["final_score"] = (
        0.65 * temp["similarity_score"] +
        0.25 * temp["keyword_score"] +
        0.10 * temp["rating_score"]
    )

    temp = temp.sort_values(by=["final_score", "rate"], ascending=False)
    temp = temp.drop_duplicates(subset=["name", "location"])

    cols = [
        "name",
        "location",
        "cuisines",
        "rate",
        "approx_cost(for two people)",
        "dish_liked",
        "menu_item",
        "rest_type",
    ]

    results = temp[cols].head(top_n).to_dict(orient="records")

    for r in results:
        full_text = f"{r.get('name','')} {r.get('cuisines','')} {r.get('dish_liked','')}"
        r["image"] = image_for(full_text)
        r["popular_dishes"] = [
            x.strip()
            for x in str(r.get("dish_liked", "")).split(",")
            if x.strip()
        ][:5]
        r["cost"] = r.get("approx_cost(for two people)", 0)

    return clean_records(results)


@app.get("/restaurant-detail")
def restaurant_detail(name: str):
    name_lower = name.lower().strip()

    match = df[df["name"].str.lower() == name_lower]

    if match.empty:
        match = df[df["name"].str.lower().str.contains(re.escape(name_lower), na=False)]

    if match.empty:
        return {"found": False}

    row = match.iloc[0]

    data = {
        "found": True,
        "name": row["name"],
        "location": row["location"],
        "cuisines": row["cuisines"],
        "rate": row["rate"],
        "cost": row["approx_cost(for two people)"],
        "dish_liked": row.get("dish_liked", ""),
        "menu_item": row.get("menu_item", ""),
        "rest_type": row.get("rest_type", ""),
        "image": image_for(
            f"{row['name']} {row['cuisines']} {row.get('dish_liked','')}"
        ),
    }

    data["popular_dishes"] = [
        x.strip()
        for x in str(data["dish_liked"]).split(",")
        if x.strip()
    ][:8]

    return data



# ================= TABLE BOOKING =================

DATABASE_PATH = "foodgenie.db"


def init_booking_database():
    with sqlite3.connect(DATABASE_PATH) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS bookings (
                id TEXT PRIMARY KEY,
                restaurant TEXT NOT NULL,
                name TEXT NOT NULL,
                phone TEXT NOT NULL,
                date TEXT NOT NULL,
                time TEXT NOT NULL,
                guests INTEGER NOT NULL,
                requests TEXT DEFAULT '',
                status TEXT DEFAULT 'confirmed'
            )
        """)
        conn.commit()


init_booking_database()


@app.post("/book-table")
def book_table(data: dict = Body(...)):
    required = ["restaurant", "name", "phone", "date", "time", "guests"]

    missing = [field for field in required if not data.get(field)]

    if missing:
        return {
            "success": False,
            "message": f"Missing fields: {', '.join(missing)}"
        }

    booking = {
        "id": "BK" + uuid.uuid4().hex[:8].upper(),
        "restaurant": str(data["restaurant"]),
        "name": str(data["name"]),
        "phone": str(data["phone"]),
        "date": str(data["date"]),
        "time": str(data["time"]),
        "guests": int(data["guests"]),
        "requests": str(data.get("requests", "")),
        "status": "confirmed"
    }

    with sqlite3.connect(DATABASE_PATH) as conn:
        conn.execute("""
            INSERT INTO bookings
            (id, restaurant, name, phone, date, time,
             guests, requests, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            booking["id"],
            booking["restaurant"],
            booking["name"],
            booking["phone"],
            booking["date"],
            booking["time"],
            booking["guests"],
            booking["requests"],
            booking["status"]
        ))
        conn.commit()

    return {"success": True, "booking": booking}


@app.get("/my-bookings")
def get_my_bookings(phone: str = Query(..., min_length=1)):
    with sqlite3.connect(DATABASE_PATH) as conn:
        conn.row_factory = sqlite3.Row

        rows = conn.execute("""
            SELECT *
            FROM bookings
            WHERE phone = ?
            ORDER BY date DESC, time DESC
        """, (phone,)).fetchall()

    return {
        "success": True,
        "bookings": [dict(row) for row in rows]
    }


# ================= ORDERS =================

orders = []



@app.post("/place-order")
def place_order(data: dict = Body(...)):
    order = {
        "id": f"FGXVQ{len(orders) + 1}PT",
        "items": data.get("items", []),
        "total": data.get("total", 0),
        "payment": data.get("payment", "Cash On Delivery"),
        "address": data.get("address", {}),
        "status": "confirmed",
    }
    orders.append(order)
    return {"success": True, "order": order}