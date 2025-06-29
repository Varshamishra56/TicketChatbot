from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import uuid
from datetime import datetime
import pandas as pd
import string
import joblib
import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# NLTK downloads
nltk.download("punkt")
nltk.download("stopwords")

# App Setup
app = Flask(__name__)
CORS(app, origins=["http://localhost:5173", "http://127.0.0.1:5173"])

# DB Config
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root:varsha@localhost/scj_ticket_db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Ticket Model
class Ticket(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    ticket_number = db.Column(db.String(20), unique=True, nullable=False)
    user_query = db.Column(db.Text, nullable=False)
    response = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "ticket_number": self.ticket_number,
            "user_query": self.user_query,
            "response": self.response,
            "created_at": self.created_at.strftime("%Y-%m-%d %H:%M:%S")
        }

# Load and preprocess FAQ
stop_words = set(stopwords.words("english"))
faq_df = pd.read_csv("./FAQs.csv")

def preprocess_text(text):
    tokens = word_tokenize(text.lower())
    tokens = [
        word for word in tokens
        if (len(tokens) > 4 and word not in stop_words and word not in string.punctuation) or
           (len(tokens) <= 4 and word not in string.punctuation)
    ]
    return " ".join(tokens)

faq_df["processed_question"] = faq_df["Question"].apply(preprocess_text)

# TF-IDF Setup
try:
    tfidf_vectorizer = joblib.load("tfidf_vectorizer.pkl")
    tfidf_matrix = joblib.load("tfidf_matrix.pkl")
except FileNotFoundError:
    tfidf_vectorizer = TfidfVectorizer()
    tfidf_matrix = tfidf_vectorizer.fit_transform(faq_df["processed_question"])
    joblib.dump(tfidf_vectorizer, "tfidf_vectorizer.pkl")
    joblib.dump(tfidf_matrix, "tfidf_matrix.pkl")

# FAQ Retrieval Function (Top 5)
def retrieve_faq(query, top_n=5):
    processed_query = preprocess_text(query)
    query_vector = tfidf_vectorizer.transform([processed_query])
    similarities = cosine_similarity(query_vector, tfidf_matrix)
    most_similar_indices = similarities.argsort()[0][-top_n:][::-1]
    top_faqs = faq_df.iloc[most_similar_indices]
    return top_faqs.to_dict(orient='records')

# /ask Endpoint
@app.route("/ask", methods=["POST"])
def ask_bot():
    data = request.get_json(force=True)
    query = data.get("query", "").strip()

    if not query:
        return jsonify([{"Answer": "Empty query"}]), 400

    try:
        results = retrieve_faq(query)
        return jsonify(results if results else [{"Answer": "Sorry, no relevant answer found."}]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# /ask_by_ticket Endpoint
@app.route("/ask_by_ticket", methods=["POST"])
def ask_by_ticket():
    data = request.get_json(force=True)
    ticket_number = data.get("ticket_number", "").strip()

    if not ticket_number:
        return jsonify({"error": "Ticket number is required"}), 400

    ticket = Ticket.query.filter_by(ticket_number=ticket_number).first()

    if not ticket:
        return jsonify([{"Answer": "Ticket not found"}]), 404

    results = retrieve_faq(ticket.user_query.strip())
    return jsonify(results if results else [{"Answer": "Sorry, no relevant answer found."}]), 200

# /data Endpoint - Pagination
@app.route("/data", methods=["POST"])
def get_data():
    data = request.get_json()
    page = data.get("pageNumber", 1)
    per_page = data.get("perPage", 10)
    start = (page - 1) * per_page
    end = start + per_page
    paginated = faq_df.iloc[start:end].to_dict(orient="records")
    return jsonify({
        "items": paginated,
        "page": page,
        "perPage": per_page,
        "totalRecords": len(faq_df)
    }), 200

# /ticket - Create Ticket
@app.route("/ticket", methods=["POST"])
def create_ticket():
    data = request.get_json()
    user_query = data.get("user_query", "").strip()

    if not user_query:
        return jsonify({"error": "Query is required"}), 400

    ticket_number = f"TKT{uuid.uuid4().hex[:8].upper()}"
    new_ticket = Ticket(ticket_number=ticket_number, user_query=user_query)
    db.session.add(new_ticket)
    db.session.commit()

    return jsonify({
        "ticket_number": ticket_number,
        "message": "Ticket created successfully!"
    }), 201

# /ticket/<ticket_number> - Get Ticket Info
@app.route("/ticket/<ticket_number>", methods=["GET"])
def get_ticket(ticket_number):
    ticket = Ticket.query.filter_by(ticket_number=ticket_number).first()

    if not ticket:
        return jsonify({"error": "Ticket not found"}), 404

    return jsonify(ticket.to_dict()), 200

# /ticket/<ticket_number>/response - Update Ticket Response
@app.route("/ticket/<ticket_number>/response", methods=["PUT"])
def update_response(ticket_number):
    ticket = Ticket.query.filter_by(ticket_number=ticket_number).first()

    if not ticket:
        return jsonify({"error": "Ticket not found"}), 404

    data = request.get_json()
    response = data.get("response", "").strip()

    if not response:
        return jsonify({"error": "Response cannot be empty"}), 400

    ticket.response = response
    db.session.commit()
    return jsonify({"message": "Response updated successfully"}), 200

# Run App
if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5000)
