# from flask import Flask, request, jsonify, send_file
# from flask_cors import CORS
# import google.generativeai as genai
# from docx import Document
# from docx.shared import Inches, Pt
# from docx.enum.text import WD_ALIGN_PARAGRAPH
# from docx.oxml.ns import qn
# from docx.oxml import OxmlElement
# import numpy as np
# from sentence_transformers import SentenceTransformer
# import os
# import tempfile
# import zipfile
# from io import BytesIO
# import re
# import json
# import sqlite3
# from datetime import datetime

# app = Flask(__name__)
# CORS(app, supports_credentials=True) # Enable CORS for your React app

# # Configure Gemini API key (should be loaded from environment variables in production)
# # For development, you can set it directly or use a .env file and python-dotenv
# # os.environ["GEMINI_API_KEY"] = "YOUR_GEMINI_API_KEY" # Replace with your actual key or load from .env
# # genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))

# class TemplateDatabase:
#     def __init__(self, db_path="templates.db"):
#         self.db_path = db_path
#         self.init_database()
    
#     def init_database(self):
#         conn = sqlite3.connect(self.db_path)
#         cursor = conn.cursor()
#         cursor.execute('''
#             CREATE TABLE IF NOT EXISTS templates (
#                 id INTEGER PRIMARY KEY AUTOINCREMENT,
#                 name TEXT UNIQUE,
#                 content BLOB,
#                 upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
#                 format_info TEXT
#             )
#         ''')
#         conn.commit()
#         conn.close()
    
#     def save_template(self, name, content, format_info):
#         conn = sqlite3.connect(self.db_path)
#         cursor = conn.cursor()
#         try:
#             cursor.execute('''
#                 INSERT OR REPLACE INTO templates (name, content, format_info)
#                 VALUES (?, ?, ?)
#             ''', (name, content, json.dumps(format_info)))
#             conn.commit()
#             return True
#         except Exception as e:
#             print(f"Error saving template: {e}")
#             return False
#         finally:
#             conn.close()
    
#     def get_templates(self):
#         conn = sqlite3.connect(self.db_path)
#         cursor = conn.cursor()
#         cursor.execute('SELECT name, content, format_info FROM templates ORDER BY upload_date DESC')
#         templates = cursor.fetchall()
#         conn.close()
#         return templates
    
#     def delete_template(self, name):
#         conn = sqlite3.connect(self.db_path)
#         cursor = conn.cursor()
#         cursor.execute('DELETE FROM templates WHERE name = ?', (name,))
#         conn.commit()
#         conn.close()

# class DocumentGenerator:
#     def __init__(self):
#         self.model = SentenceTransformer('all-MiniLM-L6-v2')
#         self.template_db = TemplateDatabase()
        
#     def extract_template_format(self, doc_content):
#         with tempfile.NamedTemporaryFile(delete=False, suffix='.docx') as tmp:
#             tmp.write(doc_content)
#             tmp_path = tmp.name
        
#         try:
#             doc = Document(tmp_path)
#             format_info = {
#                 'paragraphs': [],
#                 'styles': {}, # You might want to extract more style information
#                 'runs': []
#             }
            
#             for i, paragraph in enumerate(doc.paragraphs):
#                 para_format = {
#                     'text': paragraph.text,
#                     'alignment': str(paragraph.alignment), # Convert alignment enum to string
#                     'space_before': paragraph.paragraph_format.space_before.pt if paragraph.paragraph_format.space_before else None,
#                     'space_after': paragraph.paragraph_format.space_after.pt if paragraph.paragraph_format.space_after else None,
#                     'line_spacing': paragraph.paragraph_format.line_spacing,
#                     'runs': []
#                 }
                
#                 for run in paragraph.runs:
#                     run_format = {
#                         'text': run.text,
#                         'bold': run.bold,
#                         'italic': run.italic,
#                         'underline': run.underline,
#                         'font_name': run.font.name,
#                         'font_size': run.font.size.pt if run.font.size else 11,
#                         'font_color': str(run.font.color.rgb) if run.font.color else None
#                     }
#                     para_format['runs'].append(run_format)
                
#                 format_info['paragraphs'].append(para_format)
            
#             return format_info, doc
            
#         finally:
#             os.unlink(tmp_path)
    
#     def generate_content_with_placeholders(self, template_text, project_desc, lead_firm, jv_firm, date):
#         # Ensure API key is configured
#         api_key = os.environ.get("GEMINI_API_KEY")
#         if not api_key:
#             raise ValueError("Gemini API Key not configured.")
#         genai.configure(api_key=api_key)

#         model = genai.GenerativeModel('gemini-1.5-flash')
        
#         prompt = f"""
#         You are a professional document generator. Replace the placeholder content in the template with actual information while maintaining the exact structure and format.

#         Template Content: {template_text}
        
#         Replace with these details:
#         - Project Description: {project_desc}
#         - Lead Firm: {lead_firm}
#         - JV Partner Firm: {jv_firm}
#         - Date: {date}
        
#         Instructions:
#         1. Keep the exact same structure as the template
#         2. Replace placeholder text with actual information
#         3. Maintain all formatting indicators (bold text, numbered lists, etc.)
#         4. Do not add any new sections or content
#         5. Only replace the content, not the format
#         6. If template has numbered points, maintain them
#         7. If template has company names in specific positions, replace with actual firm names
        
#         Return only the content with placeholders replaced, maintaining exact structure.
#         """
        
#         response = model.generate_content(prompt)
#         return response.text
    
#     def apply_template_formatting_exact(self, template_format, generated_content):
#         new_doc = Document()
#         content_lines = generated_content.split('\n')
#         content_index = 0
        
#         # Mapping for alignment strings
#         alignment_map = {
#             'None': WD_ALIGN_PARAGRAPH.LEFT,
#             '0': WD_ALIGN_PARAGRAPH.LEFT,
#             '1': WD_ALIGN_PARAGRAPH.CENTER,
#             '2': WD_ALIGN_PARAGRAPH.RIGHT,
#             '3': WD_ALIGN_PARAGRAPH.JUSTIFY
#         }

#         for para_format in template_format['paragraphs']:
#             if content_index >= len(content_lines):
#                 break
                
#             while content_index < len(content_lines) and not content_lines[content_index].strip():
#                 content_index += 1
                
#             if content_index >= len(content_lines):
#                 break
                
#             paragraph = new_doc.add_paragraph()
            
#             # Apply paragraph formatting
#             paragraph.alignment = alignment_map.get(str(para_format['alignment']), WD_ALIGN_PARAGRAPH.LEFT)

#             if para_format['space_before'] is not None:
#                 paragraph.paragraph_format.space_before = Pt(para_format['space_before'])
#             if para_format['space_after'] is not None:
#                 paragraph.paragraph_format.space_after = Pt(para_format['space_after'])
#             if para_format['line_spacing'] is not None:
#                 paragraph.paragraph_format.line_spacing = para_format['line_spacing']
            
#             current_text = content_lines[content_index]
            
#             if para_format['runs']:
#                 for run_format in para_format['runs']:
#                     if run_format['text'].strip():
#                         run = paragraph.add_run(current_text)
#                         run.bold = run_format['bold']
#                         run.italic = run_format['italic']
#                         run.underline = run_format['underline']
#                         if run_format['font_name']:
#                             run.font.name = run_format['font_name']
#                         run.font.size = Pt(run_format['font_size'])
#                         break
#             else:
#                 run = paragraph.add_run(current_text)
#                 run.font.size = Pt(11)
            
#             content_index += 1
        
#         return new_doc

# generator = DocumentGenerator()

# @app.route('/api/templates', methods=['POST'])
# def upload_template():
#     if 'template' not in request.files:
#         return jsonify({"error": "No template file provided"}), 400
    
#     template_file = request.files['template']
#     if template_file.filename == '':
#         return jsonify({"error": "No selected file"}), 400
    
#     if template_file and template_file.filename.endswith('.docx'):
#         try:
#             template_content = template_file.read()
#             format_info, _ = generator.extract_template_format(template_content)
            
#             success = generator.template_db.save_template(
#                 template_file.filename, template_content, format_info
#             )
#             if success:
#                 return jsonify({"message": f"{template_file.filename} saved successfully!"}), 201
#             else:
#                 return jsonify({"error": "Failed to save template"}), 500
#         except Exception as e:
#             return jsonify({"error": str(e)}), 500
#     else:
#         return jsonify({"error": "Invalid file type. Only .docx allowed"}), 400

# @app.route('/api/templates', methods=['GET'])
# def get_templates():
#     templates = generator.template_db.get_templates()
#     # Prepare templates for JSON response (content needs to be handled carefully, maybe don't send raw bytes)
#     template_list = []
#     for name, _, format_info_json in templates:
#         template_list.append({
#             "name": name,
#             "format_info": json.loads(format_info_json) # Send format info as JSON
#         })
#     return jsonify(template_list), 200

# @app.route('/api/templates/<string:template_name>', methods=['DELETE'])
# def delete_template(template_name):
#     generator.template_db.delete_template(template_name)
#     return jsonify({"message": f"{template_name} deleted successfully!"}), 200

# @app.route('/api/generate-document', methods=['POST'])
# def generate_document():
#     data = request.json
#     project_description = data.get('projectDescription')
#     lead_firm = data.get('leadFirm')
#     jv_firm = data.get('jvFirm')
#     date = data.get('date')
#     selected_templates_names = data.get('selectedTemplates', [])
#     gemini_api_key = data.get('geminiApiKey') # Get API key from frontend

#     if not all([project_description, lead_firm, selected_templates_names, gemini_api_key]):
#         return jsonify({"error": "Missing required project details or templates or API Key"}), 400

#     os.environ["GEMINI_API_KEY"] = gemini_api_key # Set API key for this request

#     generated_docs = []
#     saved_templates = generator.template_db.get_templates()

#     for template_name in selected_templates_names:
#         template_data = None
#         for name, content, format_info_json in saved_templates:
#             if name == template_name:
#                 template_data = (content, json.loads(format_info_json))
#                 break
        
#         if not template_data:
#             return jsonify({"error": f"Template {template_name} not found"}), 404

#         template_content, format_info = template_data

#         try:
#             # Extract template text for content generation
#             with tempfile.NamedTemporaryFile(delete=False, suffix='.docx') as tmp:
#                 tmp.write(template_content)
#                 tmp_path = tmp.name
            
#             template_doc = Document(tmp_path)
#             template_text = "\n".join([para.text for para in template_doc.paragraphs])
#             os.unlink(tmp_path) # Clean up temp file

#             generated_content = generator.generate_content_with_placeholders(
#                 template_text, project_description, lead_firm, jv_firm, date
#             )
            
#             formatted_doc = generator.apply_template_formatting_exact(
#                 format_info, generated_content
#             )
            
#             doc_bytes_io = BytesIO()
#             formatted_doc.save(doc_bytes_io)
#             doc_bytes_io.seek(0)
            
#             generated_docs.append({
#                 'name': f"{template_name.replace('.docx', '')}_generated.docx",
#                 'content': doc_bytes_io.getvalue()
#             })
#         except Exception as e:
#             return jsonify({"error": f"Error generating {template_name}: {str(e)}"}), 500

#     # If only one document, send it directly
#     if len(generated_docs) == 1:
#         doc = generated_docs[0]
#         return send_file(
#             BytesIO(doc['content']),
#             mimetype="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
#             as_attachment=True,
#             download_name=doc['name']
#         )
#     else:
#         # If multiple, zip them
#         zip_buffer = BytesIO()
#         with zipfile.ZipFile(zip_buffer, 'w') as zip_file:
#             for doc in generated_docs:
#                 zip_file.writestr(doc['name'], doc['content'])
        
#         zip_buffer.seek(0)
#         return send_file(
#             zip_buffer,
#             mimetype="application/zip",
#             as_attachment=True,
#             download_name=f"generated_documents_{datetime.now().strftime('%Y%m%d_%H%M%S')}.zip"
#         )

# @app.route('/api/chat', methods=['POST'])
# def handle_chat():
#     if 'message' not in request.form:
#         return jsonify({"error": "No message provided"}), 400

#     message = request.form['message']
#     files = request.files.getlist('files') # Get list of uploaded files

#     print(f"Received message: {message}")
#     print(f"Received files: {[file.filename for file in files]}")

#     # --- Your AI/Chat Processing Logic Goes Here ---
#     # This is where you would integrate with a language model (e.g., Gemini API)
#     # and handle the uploaded files.
#     # Make sure your GEMINI_API_KEY is set in the environment or passed appropriately
#     # if you want to use genai.configure here.

#     ai_response = f"Hello! You said: '{message}'. "
#     if files:
#         ai_response += f"You also uploaded these files: {[f.filename for f in files]}. "
#         # Example: Save files to a temporary location for processing
#         for file in files:
#             # You might want to save them temporarily or process directly
#             # temp_file_path = os.path.join(tempfile.gettempdir(), file.filename)
#             # file.save(temp_file_path)
#             # print(f"Saved file temporarily: {temp_file_path}")
#             pass # Placeholder for actual file processing

#     ai_response += "I'm still under development!"
#     # ---------------------------------------------

#     response_data = {
#         "status": "success",
#         "received_message": message,
#         "received_files": [file.filename for file in files],
#         "ai_response": ai_response
#     }

#     return jsonify(response_data), 200


# if __name__ == '__main__':
#     app.run(debug=True, port=5000)



from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import google.generativeai as genai
from docx import Document
from docx.shared import Inches, Pt
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
import numpy as np
from sentence_transformers import SentenceTransformer
import os
import tempfile
import zipfile
from io import BytesIO
import re
import json
import sqlite3
from datetime import datetime

app = Flask(__name__)
CORS(app, supports_credentials=True)

class TemplateDatabase:
    def __init__(self, db_path="templates.db"):
        self.db_path = db_path
        self.init_database()
    
    def init_database(self):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS templates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE,
                content BLOB,
                upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                format_info TEXT
            )
        ''')
        conn.commit()
        conn.close()
    
    def save_template(self, name, content, format_info):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        try:
            cursor.execute('''
                INSERT OR REPLACE INTO templates (name, content, format_info)
                VALUES (?, ?, ?)
            ''', (name, content, json.dumps(format_info)))
            conn.commit()
            print(f"DEBUG: Template '{name}' saved/updated in DB.")
            return True
        except Exception as e:
            print(f"Error saving template: {e}")
            return False
        finally:
            conn.close()
    
    def get_templates(self):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('SELECT name, content, format_info FROM templates ORDER BY upload_date DESC')
        templates = cursor.fetchall()
        conn.close()
        return templates
    
    def delete_template(self, name):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('DELETE FROM templates WHERE name = ?', (name,))
        conn.commit()
        conn.close()
        print(f"DEBUG: Template '{name}' deleted from DB.")

class DocumentGenerator:
    def __init__(self):
        self.template_db = TemplateDatabase()
        
    def extract_template_format(self, doc_content):
        with tempfile.NamedTemporaryFile(delete=False, suffix='.docx') as tmp:
            tmp.write(doc_content)
            tmp_path = tmp.name
        
        try:
            doc = Document(tmp_path)
            format_info = {
                'paragraphs': [],
                'styles': {},
                'runs': []
            }
            
            for i, paragraph in enumerate(doc.paragraphs):
                para_format = {
                    'text': paragraph.text,
                    'alignment': str(paragraph.alignment),
                    'space_before': paragraph.paragraph_format.space_before.pt if paragraph.paragraph_format.space_before else None,
                    'space_after': paragraph.paragraph_format.space_after.pt if paragraph.paragraph_format.space_after else None,
                    'line_spacing': paragraph.paragraph_format.line_spacing,
                    'runs': []
                }
                
                for run in paragraph.runs:
                    run_format = {
                        'text': run.text,
                        'bold': run.bold,
                        'italic': run.italic,
                        'underline': run.underline,
                        'font_name': run.font.name,
                        'font_size': run.font.size.pt if run.font.size else 11,
                        'font_color': str(run.font.color.rgb) if run.font.color else None
                    }
                    para_format['runs'].append(run_format)
                
                format_info['paragraphs'].append(para_format)
            
            print(f"DEBUG: Extracted format info for {len(format_info['paragraphs'])} paragraphs.")
            return format_info, doc
            
        finally:
            os.unlink(tmp_path)
    
    def generate_content_with_placeholders(self, template_text, project_desc, lead_firm, jv_firm, date):
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("Gemini API Key not configured. Please set GEMINI_API_KEY environment variable.")
        genai.configure(api_key=api_key)

        model = genai.GenerativeModel('gemini-1.5-flash')
        
        prompt = f"""
        You are a professional document content generator. Your primary task is to replace specific placeholder strings within the provided 'Template Content' with the corresponding 'Information to Use'.

        Template Content:
        {template_text}

        Information to Use for Replacement:
        - Project Description: {project_desc}
        - Lead Firm Name: {lead_firm}
        - JV Partner Firm Name: {jv_firm if jv_firm else 'N/A'}
        - Document Date: {date}

        Instructions for Placeholder Replacement:
        1.  Locate the exact placeholder string '[PROJECT_DESCRIPTION_TEXT]' in the 'Template Content' and replace it precisely with the 'Project Description' provided.
        2.  Locate the exact placeholder string '[LEAD_FIRM_NAME]' and replace it precisely with the 'Lead Firm Name'.
        3.  Locate the exact placeholder string '[JV_FIRM_NAME]' and replace it precisely with the 'JV Partner Firm Name'. If 'JV Partner Firm Name' is 'N/A', remove the '[JV_FIRM_NAME]' placeholder or replace it with an empty string, depending on context (prefer removal if it stands alone).
        4.  Locate the exact placeholder string '[CURRENT_DATE]' and replace it precisely with the 'Document Date'.
        5.  Maintain the **exact original structure and formatting** (e.g., bolding, italics, line breaks, paragraph structure, numbering, bullet points, spacing) of the 'Template Content'. Do not introduce any new paragraphs, sentences, or formatting changes.
        6.  The output must contain **ONLY** the modified template content. Do not include any conversational phrases, explanations, or additional text outside of the template's original structure.
        7.  If a specified placeholder is not found in the 'Template Content', simply leave that part of the template as it is.

        Return ONLY the modified 'Template Content' with the specified placeholders replaced.
        """
        
        response = model.generate_content(prompt)
        print(f"\n--- DEBUG: AI's Raw Generated Content ---\n{response.text}\n---------------------------------------\n")
        return response.text
    
    def apply_template_formatting_exact(self, template_format, generated_content):
        new_doc = Document()
        content_lines = generated_content.split('\n')
        content_index = 0
        
        alignment_map = {
            'None': WD_ALIGN_PARAGRAPH.LEFT,
            '0': WD_ALIGN_PARAGRAPH.LEFT,
            '1': WD_ALIGN_PARAGRAPH.CENTER,
            '2': WD_ALIGN_PARAGRAPH.RIGHT,
            '3': WD_ALIGN_PARAGRAPH.JUSTIFY
        }

        for para_format in template_format['paragraphs']:
            while content_index < len(content_lines) and not content_lines[content_index].strip():
                content_index += 1
                
            if content_index >= len(content_lines):
                paragraph = new_doc.add_paragraph()
                paragraph.alignment = alignment_map.get(str(para_format['alignment']), WD_ALIGN_PARAGRAPH.LEFT)
                if para_format['space_before'] is not None:
                    paragraph.paragraph_format.space_before = Pt(para_format['space_before'])
                if para_format['space_after'] is not None:
                    paragraph.paragraph_format.space_after = Pt(para_format['space_after'])
                if para_format['line_spacing'] is not None:
                    paragraph.paragraph_format.line_spacing = para_format['line_spacing']
                continue

            paragraph = new_doc.add_paragraph()
            
            paragraph.alignment = alignment_map.get(str(para_format['alignment']), WD_ALIGN_PARAGRAPH.LEFT)
            if para_format['space_before'] is not None:
                paragraph.paragraph_format.space_before = Pt(para_format['space_before'])
            if para_format['space_after'] is not None:
                paragraph.paragraph_format.space_after = Pt(para_format['space_after'])
            if para_format['line_spacing'] is not None:
                paragraph.paragraph_format.line_spacing = para_format['line_spacing']
            
            current_text = content_lines[content_index]
            
            if para_format['runs']:
                first_non_empty_run_format = next((rf for rf in para_format['runs'] if rf['text'].strip()), None)
                if first_non_empty_run_format:
                    run = paragraph.add_run(current_text)
                    run.bold = first_non_empty_run_format['bold']
                    run.italic = first_non_empty_run_format['italic']
                    run.underline = first_non_empty_run_format['underline']
                    if first_non_empty_run_format['font_name']:
                        run.font.name = first_non_empty_run_format['font_name']
                    run.font.size = Pt(first_non_empty_run_format['font_size'])
                else:
                    run = paragraph.add_run(current_text)
                    run.font.size = Pt(11)
            else:
                run = paragraph.add_run(current_text)
                run.font.size = Pt(11)
            
            content_index += 1
        
        return new_doc

generator = DocumentGenerator()

@app.route('/api/templates', methods=['POST'])
def upload_template():
    if 'template' not in request.files:
        return jsonify({"error": "No template file provided"}), 400
    
    template_file = request.files['template']
    if template_file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    if template_file and template_file.filename.endswith('.docx'):
        try:
            template_content = template_file.read()
            format_info, _ = generator.extract_template_format(template_content)
            
            success = generator.template_db.save_template(
                template_file.filename, template_content, format_info
            )
            if success:
                return jsonify({"message": f"{template_file.filename} saved successfully!"}), 201
            else:
                return jsonify({"error": "Failed to save template"}), 500
        except Exception as e:
            print(f"Error during template upload: {e}")
            return jsonify({"error": f"Error processing template: {str(e)}"}), 500
    else:
        return jsonify({"error": "Invalid file type. Only .docx allowed"}), 400

@app.route('/api/templates', methods=['GET'])
def get_templates():
    templates = generator.template_db.get_templates()
    template_list = []
    for name, _, format_info_json in templates:
        template_list.append({
            "name": name,
            "format_info": json.loads(format_info_json)
        })
    print(f"DEBUG: Retrieved {len(template_list)} templates for GET /api/templates.")
    return jsonify(template_list), 200

@app.route('/api/templates/<string:template_name>', methods=['DELETE'])
def delete_template(template_name):
    try:
        generator.template_db.delete_template(template_name)
        return jsonify({"message": f"{template_name} deleted successfully!"}), 200
    except Exception as e:
        print(f"Error deleting template '{template_name}': {e}")
        return jsonify({"error": f"Error deleting template: {str(e)}"}), 500

@app.route('/api/generate-document', methods=['POST'])
def generate_document():
    data = request.json
    project_description = data.get('projectDescription')
    lead_firm = data.get('leadFirm')
    jv_firm = data.get('jvFirm')
    date = data.get('date')
    selected_templates_names = data.get('selectedTemplates', [])
    gemini_api_key = data.get('geminiApiKey')

    if not all([project_description, lead_firm, selected_templates_names, gemini_api_key]):
        missing_fields = []
        if not project_description: missing_fields.append("projectDescription")
        if not lead_firm: missing_fields.append("leadFirm")
        if not selected_templates_names: missing_fields.append("selectedTemplates")
        if not gemini_api_key: missing_fields.append("geminiApiKey")
        return jsonify({"error": f"Missing required fields: {', '.join(missing_fields)}"}), 400

    os.environ["GEMINI_API_KEY"] = gemini_api_key

    generated_docs = []
    saved_templates = generator.template_db.get_templates()
    
    all_successful = True

    for template_name in selected_templates_names:
        template_data = None
        for name, content, format_info_json in saved_templates:
            if name == template_name:
                template_data = (content, json.loads(format_info_json))
                break
        
        if not template_data:
            print(f"ERROR: Template {template_name} not found in database for generation.")
            all_successful = False
            continue

        template_content_bytes, format_info = template_data
        
        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix='.docx') as tmp_file:
                tmp_file.write(template_content_bytes)
                tmp_path = tmp_file.name
            
            temp_doc = Document(tmp_path)
            template_text_for_ai = "\n".join([para.text for para in temp_doc.paragraphs])
            os.unlink(tmp_path)

            generated_content_from_ai = generator.generate_content_with_placeholders(
                template_text_for_ai, project_description, lead_firm, jv_firm, str(date)
            )
            
            final_formatted_doc = generator.apply_template_formatting_exact(
                format_info, generated_content_from_ai
            )
            
            doc_bytes_io = BytesIO()
            final_formatted_doc.save(doc_bytes_io)
            doc_bytes_io.seek(0)
            
            generated_docs.append({
                'name': f"{template_name.replace('.docx', '')}_generated.docx",
                'content': doc_bytes_io.getvalue()
            })
            print(f"DEBUG: Successfully generated '{template_name}'.")

        except Exception as e:
            print(f"ERROR: Error generating '{template_name}': {str(e)}")
            all_successful = False
    
    if not all_successful and not generated_docs:
        return jsonify({"error": "Document generation failed for all selected templates."}), 500
    
    if len(generated_docs) == 1:
        doc = generated_docs[0]
        return send_file(
            BytesIO(doc['content']),
            mimetype="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            as_attachment=True,
            download_name=doc['name']
        )
    elif len(generated_docs) > 1:
        zip_buffer = BytesIO()
        with zipfile.ZipFile(zip_buffer, 'w') as zip_file:
            for doc in generated_docs:
                zip_file.writestr(doc['name'], doc['content'])
        
        zip_buffer.seek(0)
        zip_filename = f"generated_documents_{datetime.now().strftime('%Y%m%d_%H%M%S')}.zip"
        return send_file(
            zip_buffer,
            mimetype="application/zip",
            as_attachment=True,
            download_name=zip_filename
        )
    else:
        return jsonify({"message": "No documents were selected for generation or no documents could be generated."}), 200

@app.route('/api/chat', methods=['POST'])
def handle_chat():
    if 'message' not in request.form:
        return jsonify({"error": "No message provided"}), 400

    message = request.form['message']
    files = request.files.getlist('files')

    print(f"Received message: {message}")
    print(f"Received files: {[file.filename for file in files]}")

    try:
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            return jsonify({"error": "Gemini API Key not configured on backend."}), 500
        genai.configure(api_key=api_key)
        
        chat_model = genai.GenerativeModel('gemini-1.5-flash')
        
        chat_parts = [
            {"role": "user", "parts": [{"text": message}]}
        ]
        
        response = chat_model.generate_content(chat_parts)
        ai_response_text = response.text
        
    except Exception as e:
        print(f"Error during AI chat generation: {e}")
        ai_response_text = f"Sorry, I encountered an error: {str(e)}"
        
    if files:
        ai_response_text += f"\n(Note: I received files: {[f.filename for f in files]}, but my current capabilities might not fully process them yet.)"

    response_data = {
        "status": "success",
        "received_message": message,
        "received_files": [file.filename for file in files],
        "ai_response": ai_response_text
    }

    return jsonify(response_data), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)