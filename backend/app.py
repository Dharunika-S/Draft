from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import google.generativeai as genai
from docx import Document
from docx.shared import Pt
from docx.enum.text import WD_ALIGN_PARAGRAPH
import os
import tempfile
import zipfile
from io import BytesIO
import json
import sqlite3
from datetime import datetime
import re


try:
    from PyPDF2 import PdfReader
except ImportError:
    PdfReader = None
    print("WARNING: PyPDF2 not found. PDF extraction will not work. Install with 'pip install PyPDF2'")

app = Flask(__name__)
CORS(app, supports_credentials=True)

print("Flask app is initializing...")

class TemplateDatabase:
    """Manages document templates in an SQLite database."""
    def __init__(self, db_path="templates.db"):
        self.db_path = db_path
        self.init_database()

    def init_database(self):
        """Initializes the SQLite database table for templates."""
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
        """Saves or updates a template in the database."""
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
        """Retrieves all templates from the database."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('SELECT name, content, format_info FROM templates ORDER BY upload_date DESC')
        templates = cursor.fetchall()
        conn.close()
        return templates

    def delete_template(self, name):
        """Deletes a specific template from the database."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('DELETE FROM templates WHERE name = ?', (name,))
        conn.commit()
        conn.close()
        print(f"DEBUG: Template '{name}' deleted from DB.")

class DocumentGenerator:
    """Handles document generation and formatting."""
    def __init__(self):
        self.template_db = TemplateDatabase()

    def extract_template_format(self, doc_content):
        """Extracts formatting from a DOCX file."""
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
                alignment_name = None
                if paragraph.alignment is not None:
                    match = re.match(r'^(.*?)(\s*\((\d+)\))?$', paragraph.alignment.name)
                    if match:
                        alignment_name = match.group(1)
                    else:
                        alignment_name = paragraph.alignment.name

                para_format = {
                    'text': paragraph.text,
                    'alignment': alignment_name,
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
                        'font_size': run.font.size.pt if run.font.size else None,
                        'font_color': str(run.font.color.rgb) if run.font.color else None
                    }
                    para_format['runs'].append(run_format)

                format_info['paragraphs'].append(para_format)

            print(f"DEBUG: Extracted format info for {len(format_info['paragraphs'])} paragraphs.")
            return format_info, doc

        finally:
            os.unlink(tmp_path)

    def generate_content_with_placeholders(self, template_content_bytes, project_desc, lead_firm, jv_firm, date, gemini_api_key):
        """Uses Gemini AI to replace placeholders in template content."""
        tmp_path = None  
        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix='.docx') as tmp:
                tmp.write(template_content_bytes)
                tmp_path = tmp.name  # Get the path
           

            doc = Document(tmp_path)  # Now open the closed temporary file
            template_text = "\n".join([para.text for para in doc.paragraphs])

            # Configure Gemini
            genai.configure(api_key=gemini_api_key)
            model = genai.GenerativeModel('gemini-1.5-flash')

            prompt = f"""
            Replace placeholders in this template:
            {template_text}

            Replacements:
            - [PROJECT_DESCRIPTION_TEXT] -> {project_desc}
            - [LEAD_FIRM_NAME] -> {lead_firm}
            - [JV_FIRM_NAME] -> {jv_firm if jv_firm else 'N/A'}
            - [CURRENT_DATE] -> {date}

            Return ONLY the modified template content.
            """
            response = model.generate_content(prompt)
            return response.text

        except Exception as e:
            print(f"Error generating content: {str(e)}")
            raise  # Re-raise the exception after printing
        finally:
            if tmp_path and os.path.exists(tmp_path):
                os.unlink(tmp_path)  # Ensure temporary file is deleted


    def apply_template_formatting_exact(self, format_info, new_content_text):
        """Applies extracted formatting to new content, including run-level detail."""
        new_doc = Document()

        # Split the new content into lines to match paragraphs roughly
        new_content_lines = new_content_text.split('\n')
        
        # Ensure we don't go out of bounds if generated content is shorter/longer
        min_paragraphs = min(len(format_info['paragraphs']), len(new_content_lines))

        for i in range(min_paragraphs):
            para_format = format_info['paragraphs'][i]
            new_paragraph_text = new_content_lines[i] if i < len(new_content_lines) else ""
            
            p = new_doc.add_paragraph()
            # If the new_paragraph_text is empty, only add a paragraph if the original had content
            # or if it was explicitly a blank line in the generated content that should be preserved.
            # Otherwise, avoid adding empty paragraphs that don't correspond to new content.
            if new_paragraph_text.strip() or (i < len(new_content_lines) and not new_content_lines[i].strip() and para_format['text'].strip()):
                p.text = new_paragraph_text # Set the entire paragraph text first

            # Apply paragraph-level formatting
            if para_format['alignment'] == 'left':
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            elif para_format['alignment'] == 'center':
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            elif para_format['alignment'] == 'right':
                p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
            elif para_format['alignment'] == 'justify':
                p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
            
            if para_format['space_before'] is not None:
                p.paragraph_format.space_before = Pt(para_format['space_before'])
            if para_format['space_after'] is not None:
                p.paragraph_format.space_after = Pt(para_format['space_after'])
            if para_format['line_spacing'] is not None:
                p.paragraph_format.line_spacing = para_format['line_spacing']

            # Apply run-level formatting to the main run of the new paragraph
            if para_format['runs']:
                first_run_format = para_format['runs'][0]
                # Ensure there's at least one run to apply formatting to
                if p.runs:
                    run = p.runs[0]
                else:
                    run = p.add_run() # Add an empty run if paragraph was text-less initially
                
                if first_run_format.get('bold'):
                    run.bold = True
                if first_run_format.get('italic'):
                    run.italic = True
                if first_run_format.get('underline'):
                    run.underline = True
                if first_run_format.get('font_name'):
                    run.font.name = first_run_format['font_name']
                if first_run_format.get('font_size'):
                    run.font.size = Pt(first_run_format['font_size'])
                
        for i in range(min_paragraphs, len(new_content_lines)):
            if new_content_lines[i].strip(): # Only add non-empty lines
                new_doc.add_paragraph(new_content_lines[i])

        return new_doc


    def extract_description_with_gemini(self, file_content, file_type, gemini_api_key):
        """Extracts project description using Gemini API from various file types."""
        if not gemini_api_key:
            raise ValueError("Gemini API Key not provided for description extraction.")
        
        genai.configure(api_key=gemini_api_key)

        model = genai.GenerativeModel('gemini-1.5-flash')

        text_content = ""
        if file_type == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
            # Handle .docx
            try:
                doc = Document(BytesIO(file_content))
                for paragraph in doc.paragraphs:
                    text_content += paragraph.text + "\n"
            except Exception as e:
                raise ValueError(f"Error reading DOCX file: {e}")
        elif file_type == 'application/pdf':
            # Handle .pdf
            if PdfReader:
                try:
                    reader = PdfReader(BytesIO(file_content))
                    for page in reader.pages:
                        text_content += page.extract_text() + "\n"
                except Exception as e:
                    raise ValueError(f"Error reading PDF file: {e}")
            else:
                raise ValueError("PDF extraction requires PyPDF2. Please install it.")
        elif file_type == 'text/plain':
            # Handle .txt
            text_content = file_content.decode('utf-8')
        else:
            raise ValueError(f"Unsupported file type: {file_type}")

        if not text_content.strip():
            return "No readable text content found in the uploaded file."

        prompt = f"""
        Analyze the following text content and extract a concise project description.
        Focus on key objectives, technologies, and deliverables.
        Text:
        {text_content}

        Project Description:
        """
        response = model.generate_content(prompt)
        return response.text

# Initialize the database and document generator
generator = DocumentGenerator()

# --- Flask Routes ---

@app.route('/api/extract-description', methods=['POST'])
def extract_description():
    print("\n--- Flask: Incoming extract-description request ---")
    print("Request Headers:", request.headers)
    
    project_file = request.files.get('projectFile')
    gemini_api_key = request.form.get('geminiApiKey') # FormData for this endpoint

    print(f"DEBUG: projectFile received: {'Yes' if project_file else 'No'}")
    print(f"DEBUG: projectFile name: {project_file.filename if project_file else 'N/A'}")
    print(f"DEBUG: geminiApiKey received: {'Yes' if gemini_api_key else 'No'}")
    print(f"DEBUG: geminiApiKey (first 5 chars): '{gemini_api_key[:5] if gemini_api_key else 'N/A'}'")
    print("--- End Flask Debug ---")

    if not project_file:
        print("Flask: Missing projectFile, returning 400")
        return jsonify({"error": "No project file provided."}), 400
    if not gemini_api_key:
        print("Flask: Missing Gemini API Key, returning 400")
        return jsonify({"error": "Gemini API Key not provided."}), 400

    file_content = project_file.read()
    file_type = project_file.mimetype

    try:
        description = generator.extract_description_with_gemini(file_content, file_type, gemini_api_key)
        print("Flask: Description extracted successfully.")
        return jsonify({"description": description})
    except ValueError as e:
        print(f"Flask: Error extracting description - {str(e)}")
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        print(f"Flask: Unexpected error extracting description - {str(e)}")
        return jsonify({"error": "An internal server error occurred during description extraction."}), 500

@app.route('/api/templates', methods=['POST'])
def upload_template():
    if 'template' not in request.files:
        return jsonify({"error": "No template file provided"}), 400
    
    template_file = request.files['template']
    if template_file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    if not template_file.filename.endswith('.docx'):
        return jsonify({"error": "Only .docx files are supported for templates"}), 400

    template_name = template_file.filename
    template_content = template_file.read()

    try:
        # Extract format information and the document object for verification
        format_info, doc = generator.extract_template_format(template_content)
        
        # Save template content and format_info to database
        if generator.template_db.save_template(template_name, template_content, format_info):
            print(f"Flask: Template '{template_name}' uploaded and processed successfully.")
            return jsonify({"message": "Template uploaded successfully", "name": template_name}), 200
        else:
            print(f"Flask: Failed to save template '{template_name}'.")
            return jsonify({"error": "Failed to save template"}), 500
    except Exception as e:
        print(f"Flask: Error uploading template - {str(e)}")
        return jsonify({"error": f"Failed to process template: {str(e)}"}), 500

@app.route('/api/templates', methods=['GET'])
def get_templates():
    templates_data = generator.template_db.get_templates()
    templates_list = []
    for name, _, format_info_json in templates_data: # content is not sent to frontend
        try:
            format_info = json.loads(format_info_json)
        except json.JSONDecodeError:
            format_info = {} # Handle cases where format_info might be invalid JSON
        templates_list.append({"name": name, "format_info": format_info})
    print(f"Flask: Retrieved {len(templates_list)} templates.")
    return jsonify(templates_list)

@app.route('/api/templates/<template_name>', methods=['DELETE'])
def delete_template(template_name):
    generator.template_db.delete_template(template_name)
    print(f"Flask: Template '{template_name}' deleted.")
    return jsonify({"message": f"Template '{template_name}' deleted successfully"})


@app.route('/api/generate-document', methods=['POST'])
def generate_document():
    print("\n--- DEBUG: Incoming /api/generate-document request ---")
    
    # Check the Content-Type header explicitly
    content_type = request.headers.get('Content-Type', '')
    print(f"DEBUG: Request Content-Type: {content_type}")

    # Ensure it's multipart/form-data
    if 'multipart/form-data' not in content_type:
        print("Flask: Content-Type is not multipart/form-data. Returning 400.")
        return jsonify({"error": "Content-Type must be multipart/form-data"}), 400

    # Print raw form data for inspection
    print("DEBUG: Raw request.form data (should contain form fields):")
    if request.form:
        for key, value in request.form.items():
            print(f"  {key}: {value}")
    else:
        print("  request.form is empty!")
    
    print("DEBUG: Raw request.files data (should contain file uploads):")
    if request.files:
        for key, value in request.files.items():
            print(f"  {key}: {value.filename}")
    else:
        print("  request.files is empty!")

    # Extract data from request.form
    project_description = request.form.get('projectDescription')
    lead_firm = request.form.get('leadFirm')
    jv_firm = request.form.get('jvFirm')
    document_date_str = request.form.get('date') # Use 'date' as sent by frontend
    
    selected_templates = request.form.getlist('selectedTemplates') 
    
    gemini_api_key = request.form.get('geminiApiKey')

    print(f"DEBUG: Frontend sent 'selectedTemplates': {selected_templates} (Type: {type(selected_templates)})")
    print(f"DEBUG: Number of templates to process: {len(selected_templates)}")

    print(f"DEBUG: projectDescription: {project_description[:50] + '...' if project_description else 'N/A'}")
    print(f"DEBUG: leadFirm: {lead_firm}")
    print(f"DEBUG: jvFirm: {jv_firm}")
    print(f"DEBUG: documentDate: {document_date_str}")
    print(f"DEBUG: selectedTemplates: {selected_templates}")
    print(f"DEBUG: geminiApiKey (first 5 chars): {gemini_api_key[:5] if gemini_api_key else 'N/A'}")
    print("--- End Flask Debug ---")

    
    if not all([project_description, lead_firm, selected_templates, gemini_api_key]):
        print("Flask: Missing required fields for document generation, returning 400.")
        return jsonify({"error": "Missing required project details (description, lead firm, selected templates, or Gemini API Key)."}), 400

    document_date = document_date_str 

    generated_docs = []
    all_successful = True

    try:
        for i, template_name in enumerate(selected_templates): 
            print(f"DEBUG: Processing template {i+1}/{len(selected_templates)}: '{template_name}'") 
            
            templates_in_db = generator.template_db.get_templates()
            template_found = False
            template_content = None
            format_info = None

            for name, content, format_info_json in templates_in_db:
                if name == template_name:
                    template_content = content
                    format_info = json.loads(format_info_json)
                    template_found = True
                    break

            if not template_found:
                print(f"ERROR: Template '{template_name}' not found in database.")
                all_successful = False
                continue

            generated_content = generator.generate_content_with_placeholders(
                template_content, 
                project_description, lead_firm, jv_firm, document_date, gemini_api_key
            )

            final_doc = generator.apply_template_formatting_exact(format_info, generated_content)
            doc_bytes_io = BytesIO()
            final_doc.save(doc_bytes_io)
            doc_bytes_io.seek(0)

            generated_docs.append({
                'name': f"{template_name.replace('.docx', '')}_generated.docx",
                'content': doc_bytes_io.getvalue()
            })
            print(f"DEBUG: Successfully added '{template_name.replace('.docx', '')}_generated.docx' to generated_docs.") # Confirm add
            

    except Exception as e:
        print(f"ERROR: Error generating document(s): {str(e)}")
        return jsonify({"error": f"Error during document generation: {str(e)}"}), 500
    
    print(f"DEBUG: Final number of documents in generated_docs: {len(generated_docs)}")

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
        return jsonify({"message": "No documents were selected for generation or no documents could be generated."})

if __name__ == '__main__':
    generator = DocumentGenerator() 
    app.run(debug=True, port=5000)
