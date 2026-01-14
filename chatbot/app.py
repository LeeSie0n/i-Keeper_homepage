from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import os

app = Flask(__name__)
CORS(
    app,
    resources={r"/chat": {"origins": [
        "http://i-keeper.site",
        f"{os.getenv('BACK_URL')}"
    ]}},
    supports_credentials=True
)

# Gemini API 설정
genai.configure(api_key=os.environ.get("GOOGLE_API_KEY"))

# 실제 사용 가능한 모델 
model = genai.GenerativeModel("models/gemini-2.5-flash")

# club_info.txt 불러오기
with open("club_info.txt", "r", encoding="utf-8") as f:
    CLUB_INFO = f.read()

# Chatbot API
@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json()
        user_message = data.get("message", "")

        if not user_message:
            return jsonify({"error": "message is required"}), 400

        # 프롬프트 생성
        prompt = f"""
너는 대학교 동아리 i-Keeper 안내 챗봇이다.
아래 제공된 정보 안에서만 답변해라.

===== 동아리 정보 =====
{CLUB_INFO}
=======================

사용자 질문: {user_message}
"""

        response = model.generate_content(prompt)

        return jsonify({
            "reply": response.text
        })

    except Exception as e:
        print("ERROR:", e)
        return jsonify({"error": str(e)}), 500


# 서버 실행
if __name__ == '__main__':
    app.run(host="0.0.0.0", port=4004, debug=True)