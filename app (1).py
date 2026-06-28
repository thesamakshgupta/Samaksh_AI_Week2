from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import re
import math
from datetime import datetime

app = Flask(__name__)
CORS(app)

# ─────────────────────────────────────────
# SKILL KEYWORDS PER DOMAIN
# ─────────────────────────────────────────
SKILL_KEYWORDS = {
    "Programming Languages": ["python", "java", "javascript", "c++", "c#", "typescript", "go", "rust", "kotlin", "swift", "php", "ruby", "scala", "r"],
    "Web Technologies": ["html", "css", "react", "angular", "vue", "node", "nodejs", "express", "django", "flask", "fastapi", "spring", "laravel", "bootstrap", "tailwind"],
    "Databases": ["sql", "mysql", "postgresql", "mongodb", "redis", "sqlite", "oracle", "firebase", "dynamodb", "cassandra", "elasticsearch"],
    "Cloud & DevOps": ["aws", "azure", "gcp", "docker", "kubernetes", "jenkins", "ci/cd", "terraform", "ansible", "linux", "git", "github", "gitlab"],
    "AI & Data": ["machine learning", "deep learning", "nlp", "tensorflow", "pytorch", "keras", "pandas", "numpy", "scikit-learn", "data analysis", "tableau", "power bi", "spark", "hadoop", "opencv"],
    "Soft Skills": ["leadership", "communication", "teamwork", "problem solving", "agile", "scrum", "project management", "time management", "critical thinking"]
}

# ─────────────────────────────────────────
# TEXT PREPROCESSING
# ─────────────────────────────────────────
STOP_WORDS = {
    "a","an","the","and","or","but","in","on","at","to","for","of","with",
    "by","from","is","are","was","were","be","been","being","have","has",
    "had","do","does","did","will","would","could","should","may","might",
    "shall","can","need","dare","ought","used","i","me","my","we","our",
    "you","your","he","she","it","they","them","their","this","that",
    "these","those","not","no","nor","so","yet","both","either","neither",
    "as","if","then","than","because","while","although","though","since",
    "until","unless","whether","after","before","when","where","who","which"
}

def preprocess(text):
    text = text.lower()
    text = re.sub(r'[^\w\s\+\#]', ' ', text)
    tokens = text.split()
    tokens = [t for t in tokens if t not in STOP_WORDS and len(t) > 1]
    return tokens

def extract_text_from_resume(text):
    """Clean and normalize resume text."""
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

# ─────────────────────────────────────────
# SKILL EXTRACTION
# ─────────────────────────────────────────
def extract_skills(text):
    text_lower = text.lower()
    found = {}
    for category, skills in SKILL_KEYWORDS.items():
        matched = []
        for skill in skills:
            pattern = r'\b' + re.escape(skill) + r'\b'
            if re.search(pattern, text_lower):
                matched.append(skill)
        if matched:
            found[category] = matched
    return found

# ─────────────────────────────────────────
# SECTION EXTRACTION
# ─────────────────────────────────────────
def extract_sections(text):
    sections = {"education": "", "experience": "", "skills": "", "projects": ""}
    text_lower = text.lower()

    patterns = {
        "education": r'(education|academic|qualification)',
        "experience": r'(experience|work history|employment|internship)',
        "skills": r'(skills|technologies|technical)',
        "projects": r'(project|portfolio|work)'
    }

    for section, pattern in patterns.items():
        match = re.search(pattern, text_lower)
        if match:
            start = match.start()
            snippet = text[start:start+400]
            sections[section] = snippet.strip()

    return sections

# ─────────────────────────────────────────
# TF-IDF SIMILARITY
# ─────────────────────────────────────────
def compute_tfidf(documents):
    """Compute TF-IDF vectors for a list of documents."""
    tokenized = [preprocess(doc) for doc in documents]
    vocab = set()
    for tokens in tokenized:
        vocab.update(tokens)
    vocab = list(vocab)

    N = len(documents)
    idf = {}
    for word in vocab:
        df = sum(1 for tokens in tokenized if word in tokens)
        idf[word] = math.log((N + 1) / (df + 1)) + 1

    vectors = []
    for tokens in tokenized:
        tf = {}
        for word in tokens:
            tf[word] = tf.get(word, 0) + 1
        total = max(len(tokens), 1)
        vec = {word: (tf.get(word, 0) / total) * idf[word] for word in vocab}
        vectors.append(vec)

    return vectors, vocab

def cosine_similarity(vec1, vec2):
    keys = set(vec1.keys()) | set(vec2.keys())
    dot = sum(vec1.get(k, 0) * vec2.get(k, 0) for k in keys)
    mag1 = math.sqrt(sum(v**2 for v in vec1.values()))
    mag2 = math.sqrt(sum(v**2 for v in vec2.values()))
    if mag1 == 0 or mag2 == 0:
        return 0.0
    return dot / (mag1 * mag2)

# ─────────────────────────────────────────
# CANDIDATE NAME EXTRACTION
# ─────────────────────────────────────────
def extract_name(text):
    lines = [l.strip() for l in text.strip().split('\n') if l.strip()]
    for line in lines[:5]:
        words = line.split()
        if 2 <= len(words) <= 4 and all(w[0].isupper() for w in words if w.isalpha()):
            return line
    return "Unknown Candidate"

def extract_email(text):
    match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', text)
    return match.group() if match else "N/A"

def extract_experience_years(text):
    matches = re.findall(r'(\d+)\+?\s*years?\s*(of\s*)?(experience|exp)', text.lower())
    if matches:
        return max(int(m[0]) for m in matches)
    return 0

# ─────────────────────────────────────────
# MAIN RANKING ENDPOINT
# ─────────────────────────────────────────
@app.route("/screen", methods=["POST"])
def screen():
    body = request.get_json()
    job_description = body.get("job_description", "").strip()
    resumes = body.get("resumes", [])  # List of {name, text}

    if not job_description:
        return jsonify({"error": "Job description is required"}), 400
    if not resumes:
        return jsonify({"error": "At least one resume is required"}), 400

    # Extract skills from JD
    jd_skills = extract_skills(job_description)
    jd_required_skills = []
    for skills in jd_skills.values():
        jd_required_skills.extend(skills)

    # Compute TF-IDF over all docs (JD + resumes)
    all_texts = [job_description] + [r["text"] for r in resumes]
    vectors, vocab = compute_tfidf(all_texts)
    jd_vector = vectors[0]
    resume_vectors = vectors[1:]

    results = []
    for i, resume in enumerate(resumes):
        text = resume["text"]
        label = resume.get("name", f"Candidate {i+1}")

        # Cosine similarity
        similarity = cosine_similarity(jd_vector, resume_vectors[i])
        similarity_pct = round(similarity * 100, 1)

        # Skill match
        resume_skills = extract_skills(text)
        matched_skills = []
        missing_skills = []
        for skill in jd_required_skills:
            found = any(skill in s_list for s_list in resume_skills.values())
            if found:
                matched_skills.append(skill)
            else:
                missing_skills.append(skill)

        skill_score = (len(matched_skills) / max(len(jd_required_skills), 1)) * 100

        # Experience
        exp_years = extract_experience_years(text)

        # Sections
        sections = extract_sections(text)

        # Final score: 60% similarity + 40% skill match
        final_score = round((similarity_pct * 0.6) + (skill_score * 0.4), 1)

        results.append({
            "name": label,
            "email": extract_email(text),
            "similarity_score": similarity_pct,
            "skill_match_score": round(skill_score, 1),
            "final_score": final_score,
            "experience_years": exp_years,
            "matched_skills": matched_skills,
            "missing_skills": missing_skills[:8],
            "all_skills": resume_skills,
            "sections_found": [k for k, v in sections.items() if v],
        })

    # Rank by final score
    results.sort(key=lambda x: x["final_score"], reverse=True)
    for i, r in enumerate(results):
        r["rank"] = i + 1

    return jsonify({
        "job_skills_required": jd_required_skills,
        "total_candidates": len(results),
        "results": results,
        "timestamp": datetime.now().strftime("%d %b %Y, %I:%M %p")
    })


@app.route("/", methods=["GET"])
def index():
    return jsonify({"status": "Resume Screening AI Backend Running ✅"})


if __name__ == "__main__":
    app.run(debug=True, port=5001)
